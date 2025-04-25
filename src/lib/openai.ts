import OpenAI from "openai";
import { monitoring } from "./monitoring";
import { auth } from "@clerk/nextjs/server";
import { incrementAiGenerationCount } from "./subscription";

// Define types for OpenAI API
type SystemMessage = {
  role: "system";
  content: string;
};

type UserMessage = {
  role: "user";
  content: string | Array<UserMessageContent>;
};

type AssistantMessage = {
  role: "assistant";
  content: string;
};

type UserMessageContent = 
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } };

type ChatOptions = {
  messages: (SystemMessage | UserMessage | AssistantMessage)[];
  temperature?: number;
  response_format?: { type: "json_object" };
};

// Options for document analysis
interface DocumentAnalysisOptions {
  documentText: string;
  fileName: string;
  jobDescription: string;
  additionalInfo?: string;
  temperature?: number;
}

// OpenAI client wrapper
export class OpenAIClient {
  private client: OpenAI;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not defined in environment variables");
      throw new Error("OPENAI_API_KEY is not defined in environment variables");
    }
    
    console.log("Initializing OpenAI client with API key type:", 
                typeof process.env.OPENAI_API_KEY, 
                "Key starts with:", 
                process.env.OPENAI_API_KEY.substring(0, 10) + "...");
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Helper method to handle retries with exponential backoff
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable (rate limiting, server errors)
        if (error instanceof Error) {
          const statusCode = (error as any).status;
          
          // Don't retry on client errors (except rate limits)
          if (statusCode && statusCode < 500 && statusCode !== 429) {
            throw error;
          }
        }
        
        // Last attempt, don't wait
        if (attempt === this.maxRetries) break;
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error("Operation failed after multiple retries");
  }

  // Helper method to track AI generation usage
  private async trackAIGeneration() {
    try {
      // Skip in development environment
      if (process.env.NODE_ENV === 'development' && !process.env.FORCE_TRACK_AI) {
        return;
      }

      const { userId } = await auth();
      if (!userId) return;

      // Call the utility function directly instead of using fetch
      await incrementAiGenerationCount(userId);
    } catch (error) {
      console.error('Failed to track AI generation:', error);
      // Don't throw - we don't want to interrupt the main flow if tracking fails
    }
  }

  // Method to generate chat completions
  async chat(options: ChatOptions): Promise<string> {
    return monitoring.timeExecution('openai.chat', async () => {
      try {
        const { messages, temperature = 0.7, response_format } = options;

        const result = await this.withRetry(async () => {
          const response = await this.client.chat.completions.create({
            model: "gpt-4o",
            messages,
            temperature,
            response_format,
          });

          return response.choices[0]?.message?.content || "";
        });

        // Track AI generation
        await this.trackAIGeneration();

        return result;
      } catch (error) {
        monitoring.logError({
          message: "OpenAI API error in chat method",
          error: error as Error,
          metadata: { options }
        });
        
        if (error instanceof Error) {
          const statusCode = (error as any).status;
          
          if (statusCode === 429) {
            throw new Error("OpenAI rate limit exceeded. Please try again in a few moments.");
          } else if (statusCode === 401) {
            throw new Error("Invalid API key. Please check your OpenAI API key configuration.");
          } else if (statusCode >= 500) {
            throw new Error("OpenAI service is currently unavailable. Please try again later.");
          }
        }
        
        throw new Error("Failed to get response from OpenAI. Please try again.");
      }
    });
  }

  // Method to analyze document content
  async analyzeDocument(options: DocumentAnalysisOptions): Promise<string> {
    return monitoring.timeExecution('openai.analyzeDocument', async () => {
      try {
        const { documentText, fileName, jobDescription, additionalInfo, temperature = 0.5 } = options;
        
        monitoring.log({
          message: "Analyzing document",
          level: "info",
          metadata: { fileName }
        });
        
        if (!documentText || documentText.trim().length === 0) {
          throw new Error("Document text is empty or invalid");
        }
        
        // Create a prompt that processes the actual extracted text
        const systemPrompt = "You are a professional resume analyzer that extracts comprehensive information from resumes and CVs with extreme accuracy. You prioritize factual extraction without embellishment.";
        
        // Use the actual extracted text from the document
        const userMessage = `
I need you to extract all relevant information from this CV/resume:

${documentText}

Please provide a comprehensive and detailed summary including:
1. Personal information (name, contact details, location)
2. Professional summary/objective
3. Work experience with dates, companies, and detailed responsibilities
4. Education history including:
   - Degrees and certifications with dates
   - Educational institutions 
   - Detailed descriptions of coursework, projects, achievements
   - GPA/grades if mentioned
5. Technical and soft skills with proficiency levels if mentioned
6. Languages, certifications, and other qualifications
7. Projects, publications, or other professional accomplishments

Format it in a clear, structured way that maintains ALL original details. Do not embellish or fabricate any information. Extract EXACTLY what is in the document with maximum fidelity.`;

        return await this.withRetry(async () => {
          const response = await this.client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage }
            ],
            temperature: temperature,
            max_tokens: 4000,
          });
          
          return response.choices[0]?.message?.content || "";
        });
      } catch (error) {
        monitoring.logError({
          message: "OpenAI document analysis error",
          error: error as Error,
          metadata: { fileName: options.fileName }
        });
        
        if (error instanceof Error) {
          const errorMessage = error.message;
          
          if (errorMessage.includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please try again in a few moments.");
          } else if (errorMessage.includes("API key")) {
            throw new Error("API key error. Please check your configuration.");
          } else if (errorMessage.includes("empty or invalid")) {
            throw new Error("The document could not be processed. The text appears to be empty or invalid.");
          }
        }
        
        throw new Error(`Failed to analyze document. Please try again or use a different file.`);
      }
    });
  }
  
  // Method to generate resume data using extracted CV content and job description
  async generateResumeFromVisionAnalysis(
    cvContent: string,
    jobDescription: string,
    additionalInfo?: string,
    temperature: number = 0.5
  ): Promise<string> {
    return monitoring.timeExecution('openai.generateResumeFromVisionAnalysis', async () => {
      try {
        if (!cvContent || cvContent.trim().length === 0) {
          throw new Error("CV content is empty or invalid");
        }
        
        if (!jobDescription || jobDescription.trim().length === 0) {
          throw new Error("Job description is empty or invalid");
        }
        
        const prompt = `
        You're an expert resume optimization specialist. I need a tailored resume for a specific job opportunity.
        
        # MY ORIGINAL CV (EXTRACTED CONTENT)
        ${cvContent}
        
        # JOB DESCRIPTION I'M APPLYING FOR
        ${jobDescription}
        
        ${additionalInfo ? `# ADDITIONAL INFORMATION ABOUT ME\n${additionalInfo}` : ''}
        
        # INSTRUCTIONS
        Your goal is to create a professional, ATS-optimized resume that will help me win this role.
        
        Please follow these guidelines strictly:
        
        1. CONTENT FILTERING - Your first priority is to COMPLETELY FILTER OUT any skills, experiences, or technologies from my CV that are irrelevant to the specific job description. If I have C++ experience but am applying for a management role that doesn't mention C++, REMOVE all C++ references completely.
           
        2. CONTENT BALANCE - Use my original CV as the base material, ensuring all information remains factually accurate, but ONLY include information relevant to this specific role. Aim for approximately **65% original CV content** and **35% rephrased, prioritized, or enhanced content** tailored for the target job, while maintaining full truthfulness.
           
        3. HIGHLIGHTING & EMPHASIS - Actively **highlight, reorder, and rephrase** parts of my experience that best match the job description. If my CV contains relevant projects or achievements, place them prominently. Rephrase freely for impact, as long as the information remains true.
        
        4. AUTHENTICITY & ACCURACY - Do **not fabricate** any jobs, dates, companies, qualifications, or skills that are not in my CV. If any data is missing, return an empty string or null.
        
        5. TITLE FORMAT - Format the resume title as "[Company Name] [Job Title] Resume", using the company name from the job description.
        
        6. ATS OPTIMIZATION - Naturally integrate keywords from the job description throughout the resume, especially in the summary, skills, and job descriptions, while avoiding keyword stuffing.
        
        7. PRIVACY & SECURITY - Never include hyperlinks, URLs, or contact details that aren't already in my original CV. Don't add sensitive or private company information.
        
        8. SKILLS ALIGNMENT - Extract at least 15-20 skills from my CV, prioritizing those mentioned in the job description, but also including relevant transferable skills that would be valuable for this position even if not explicitly mentioned in the job description. Aim to create a comprehensive skills section that fully represents my capabilities relevant to the role.
        
        9. QUANTIFIABLE RESULTS - Include metrics (percentages, numbers) from my original CV wherever possible to strengthen impact.
        
        10. EDUCATION DETAILS - Include **detailed descriptions** for each education entry: coursework, academic achievements, projects, or thesis work related to the job. **Do not leave education descriptions empty.**
        
        11. PROFESSIONAL SUMMARY - Write a strong, personalized summary that showcases my qualifications for this specific role.
        
        12. PROFESSIONAL FORMATTING - Use clear, professional language with powerful action verbs and concise, reader-friendly formatting.
        
        13. BALANCED SKILLS REPRESENTATION - While prioritizing skills mentioned in the job description, also include related and transferable skills from my CV that would be valuable for the role. For technical positions, include programming languages, frameworks, and technologies that demonstrate my technical breadth when relevant to the industry even if not explicitly mentioned in the job description.
        
        # OUTPUT FORMAT
        Return a complete, properly formatted **JSON object** using the following structure:
        {
          "title": "Resume title in the format [Company Name] [Job Title] Resume",
          "summary": "Compelling professional summary specifically tailored to this role",
          "firstName": "First name from CV",
          "lastName": "Last name from CV",
          "jobTitle": "Current or target job title",
          "city": "City from CV",
          "country": "Country from CV",
          "email": "Email from CV",
          "phone": "Phone from CV",
          "workExperiences": [
            {
              "position": "Position title",
              "company": "Company name",
              "startDate": "ISO date string (YYYY-MM-DD) or null if unknown",
              "endDate": "ISO date string (YYYY-MM-DD) or null if current/unknown",
              "description": "Detailed job description with bullet points highlighting achievements relevant to the target role. Remove any mentions of skills, technologies, or experiences that don't match the job description."
            }
          ],
          "educations": [
            {
              "degree": "Degree title",
              "school": "School name",
              "startDate": "ISO date string (YYYY-MM-DD) or null if unknown - IMPORTANT: Only use valid dates or null",
              "endDate": "ISO date string (YYYY-MM-DD) or null if unknown - IMPORTANT: Only use valid dates or null",
              "description": "Detailed description of relevant coursework, academic achievements, or projects that align with the job requirements. Filter out any mention of courses, technologies or skills unrelated to this role."
            }
          ],
          "skills": ["Include at least 15-20 skills from my CV, prioritizing those that match the job description but also including relevant transferable skills"],
          "analysis": {
            "matchingPoints": ["List the top 3-5 most important matching points between the CV and job description"],
            "prioritizedSkills": ["List 2-3 skills that were prioritized in the optimization"],
            "reason": "A brief explanation of why certain skills/experiences were prioritized (1-2 sentences)"
          }
        }
        
        IMPORTANT:
        - **Respond only with valid JSON.**
        - **Do not include explanations or comments outside the JSON.**
        - **If any fields are missing from my CV, use null or an empty string.**
        - **For date fields, use only valid ISO date strings (YYYY-MM-DD) or null. Never use placeholder or invalid dates.**
        - **Include at least 15-20 skills in the skills section, prioritizing those that match the job description but also including relevant transferable skills.**
        - **Include a comprehensive set of skills that demonstrate my capabilities for the role.**
        - **Make sure to include the analysis section with meaningful insights about the resume optimization.**
        - Aim for a well-rounded representation of skills while maintaining relevance to the target position.
        - Ensure all education entries include detailed descriptions. Do not leave fields empty.
        - Prioritize Work Experience, Education, and Skills sections if you run into token limits.
        `;
        

        console.log("Generating resume from CV analysis...");
        
        const response = await this.withRetry(async () => {
          const response = await this.client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a professional ATS resume optimizer that creates tailored, keyword-optimized resumes to help candidates pass automated screening and impress hiring managers. While prioritizing skills and experiences that match the job description, also include relevant transferable skills to demonstrate the candidate's breadth of capabilities. Include at least 15-20 skills in total, ensuring a comprehensive representation of the candidate's abilities. Maintain honesty and authenticity while helping candidates present their qualifications in the best possible light. Always respond with properly formatted JSON and ensure all education entries have detailed descriptions."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: temperature,
            response_format: { type: "json_object" }
          });

          const content = response.choices[0]?.message?.content || "";
          
          // Validate JSON response
          try {
            JSON.parse(content);
          } catch (e) {
            throw new Error("The API returned invalid JSON. Please try again.");
          }
          
          return content;
        });

        // Track AI generation
        await this.trackAIGeneration();

        return response;
      } catch (error) {
        monitoring.logError({
          message: "OpenAI API error in generateResumeFromVisionAnalysis method",
          error: error as Error,
          metadata: { cvContent, jobDescription, additionalInfo, temperature }
        });
        
        if (error instanceof Error) {
          const errorMessage = error.message;
          
          if (errorMessage.includes("empty or invalid")) {
            throw new Error(errorMessage);
          } else if (errorMessage.includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please try again in a few moments.");
          } else if (errorMessage.includes("invalid JSON")) {
            throw new Error("An error occurred while formatting your resume. Please try again.");
          }
        }
        
        throw new Error("Failed to generate resume. Please try again with different information.");
      }
    });
  }

  // Method to analyze image content using OpenAI Vision
  async analyzeImage(
    base64Image: string,
    jobDescription: string,
    additionalInfo?: string,
    temperature: number = 0.5
  ): Promise<string> {
    return monitoring.timeExecution('openai.analyzeImage', async () => {
      try {
        if (!base64Image || base64Image.length === 0) {
          throw new Error("Invalid image data");
        }
        
        console.log("Analyzing image with OpenAI Vision...");
        
        const systemPrompt = "You are a professional resume analyzer with exceptional attention to detail. Your sole responsibility is to extract ALL information from resume images with perfect accuracy and completeness. Do not filter, interpret, or modify anything - your job is purely to extract every single piece of text visible in the document. Extract even technical details, specific programming languages, technologies mentioned, with their complete names and versions if shown. Extract ALL skills regardless of relevance.";
        
        const messages: (SystemMessage | UserMessage)[] = [
          { 
            role: "system", 
            content: systemPrompt 
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract the COMPLETE text content from this resume/CV image with PERFECT accuracy. Include EVERY detail visible in the document, especially:
                
1. Personal information (name, contact details, location)
2. Career summary/objective exactly as written
3. ALL work experience with exact dates, company names, and EVERY responsibility and technology mentioned
4. Complete education history with every detail:
   - Complete degree names and certifications with exact dates
   - Full names of educational institutions
   - ALL coursework, projects, thesis work mentioned
   - ALL technical subjects, programming languages, and technologies studied
5. ALL technical and soft skills with proficiency levels if mentioned
6. ALL programming languages, frameworks, tools, and technologies listed
7. ALL languages and certifications with proficiency levels
8. Every other detail visible in the document

Do not miss ANY information or details from the document, regardless of how irrelevant it might seem. Extract EXACTLY what appears in the image without ANY omission, filtering, or interpretation. Include all technical terms, programming languages, technologies exactly as they appear, even if they seem outdated or irrelevant.`
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                  detail: "high"
                }
              }
            ]
          }
        ];
        
        return await this.withRetry(async () => {
          const response = await this.client.chat.completions.create({
            model: "gpt-4o",
            messages,
            temperature,
            max_tokens: 4000
          });
          
          const extractedText = response.choices[0]?.message?.content || "";
          
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("Failed to extract text from the image. The image may be too low quality or not contain readable text.");
          }
          
          return extractedText;
        });
      } catch (error) {
        monitoring.logError({
          message: "OpenAI Vision analysis error",
          error: error as Error,
          metadata: { base64Image, jobDescription, additionalInfo, temperature }
        });
        
        if (error instanceof Error) {
          const errorMessage = error.message;
          
          if (errorMessage.includes("Invalid image")) {
            throw new Error("The image data appears to be invalid. Please try a different image format or file.");
          } else if (errorMessage.includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please try again in a few moments.");
          } else if (errorMessage.includes("low quality")) {
            throw new Error("Unable to extract text from the image. Please try a clearer image or a different file format.");
          } else if ((error as any).status === 413) {
            throw new Error("The image file is too large. Please use a smaller image or compress it.");
          }
        }
        
        throw new Error("Failed to analyze the resume image. Please try again with a different image.");
      }
    });
  }

  // Method to generate a cover letter based on resume data and job description
  async generateCoverLetter(
    resumeData: any,
    jobDescription: string,
    additionalInfo?: string,
    temperature: number = 0.7
  ): Promise<string> {
    return monitoring.timeExecution('openai.generateCoverLetter', async () => {
      try {
        if (!resumeData) {
          throw new Error("Resume data is empty or invalid");
        }
        
        if (!jobDescription || jobDescription.trim().length === 0) {
          throw new Error("Job description is empty or invalid");
        }
        
        const prompt = `
        You are an expert cover letter writer. I need a **short, natural, and persuasive cover letter** for a job application.
        
        # MY RESUME DATA
        ${JSON.stringify(resumeData, null, 2)}
        
        # JOB DESCRIPTION I'M APPLYING FOR
        ${jobDescription}
        
        ${additionalInfo ? `# ADDITIONAL INFORMATION OR SPECIFIC REQUESTS\n${additionalInfo}` : ''}
        
        # INSTRUCTIONS
        Write a natural, well-written cover letter of around **80 words**, maximum 5 sentences. Make it feel human, personal, and authentic — as if I wrote it myself. Avoid sounding robotic or generic.
        
        Structure:
        - Start with a confident opening about my interest in the role and company.
        - Highlight 1–2 of my most relevant experiences or skills that match the job.
        - Add a specific achievement if relevant (numbers, impact, or result).
        - End with a polite, natural call to action.
        
        Guidelines:
        - Avoid filler phrases and exaggerated flattery.
        - Use natural language and sentence flow.
        - Use keywords from the job description **subtly**, no keyword stuffing.
        - Do **not** fabricate any information or achievements.
        - Stay true to my resume data.
        - Avoid repeating the job title or company name unnecessarily.
        
        IMPORTANT:
        - Keep it within approximately 80 words.
        - Respond **only** with the final cover letter text, no explanations or extra formatting.
        - Do not include any links or personal information not present in my resume data.
        `;
        
        

        console.log("Generating cover letter...");
        
        const result = await this.withRetry(async () => {
          const response = await this.client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a professional cover letter writer who creates compelling, personalized cover letters that highlight a candidate's relevant qualifications and experience for specific job opportunities. You write in a confident, professional tone while maintaining authenticity."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: temperature,
            max_tokens: 1500
          });

          return response.choices[0]?.message?.content || "";
        });

        // Track AI generation
        await this.trackAIGeneration();

        return result;
      } catch (error) {
        monitoring.logError({
          message: "OpenAI API error in generateCoverLetter method",
          error: error as Error,
          metadata: { resumeData, jobDescription, additionalInfo, temperature }
        });
        
        if (error instanceof Error) {
          const errorMessage = error.message;
          
          if (errorMessage.includes("empty or invalid")) {
            throw new Error(errorMessage);
          } else if (errorMessage.includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please try again in a few moments.");
          }
        }
        
        throw new Error("Failed to generate cover letter. Please try again.");
      }
    });
  }

  // Method to generate an HR message based on resume data and job description
  async generateHRMessage(
    resumeData: any,
    jobDescription: string,
    recruiterName: string,
    additionalInfo?: string,
    temperature: number = 0.7
  ): Promise<string> {
    return monitoring.timeExecution('openai.generateHRMessage', async () => {
      try {
        if (!resumeData) {
          throw new Error("Resume data is empty or invalid");
        }
        
        if (!jobDescription || jobDescription.trim().length === 0) {
          throw new Error("Job description is empty or invalid");
        }

        if (!recruiterName || recruiterName.trim().length === 0) {
          throw new Error("Recruiter name is empty or invalid");
        }
        
        const prompt = `
        You are an expert at writing personalized HR outreach messages. I need a **short, natural, and compelling message** to a recruiter or HR professional.
        
        # MY RESUME DATA
        ${JSON.stringify(resumeData, null, 2)}
        
        # JOB DESCRIPTION I'M APPLYING FOR
        ${jobDescription}
        
        # RECRUITER NAME
        ${recruiterName}
        
        ${additionalInfo ? `# ADDITIONAL INFORMATION OR SPECIFIC REQUESTS\n${additionalInfo}` : ''}
        
        # INSTRUCTIONS
        Write a natural, personalized message to the recruiter of around **50-70 words**, maximum 4 sentences. Make it feel human, personal, and authentic — as if I wrote it myself. This could be for LinkedIn, email, or other professional communication channels.
        
        Structure:
        - Start with a personalized greeting using the recruiter's name.
        - Briefly express interest in the specific role, mentioning something specific from the job description.
        - Highlight 1 key qualification or experience that makes me a strong match.
        - Include a polite call to action (like asking for a conversation or interview).
        
        Guidelines:
        - Be concise, professional, and friendly.
        - Avoid generic phrases that could apply to any job.
        - Use natural language that sounds like a real person.
        - Do **not** fabricate any information or achievements.
        - Stay true to my resume data.
        - Make it clear this is a personalized message, not a generic template.
        
        IMPORTANT:
        - Keep it within approximately 50-70 words.
        - Respond **only** with the final message text, no explanations or extra formatting.
        - Do not include any links or personal information not present in my resume data.
        `;
        
        console.log("Generating HR message...");
        
        const result = await this.withRetry(async () => {
          const response = await this.client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a professional job seeker who creates compelling, personalized outreach messages to recruiters and HR professionals. You write in a friendly, professional tone while maintaining authenticity and brevity."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: temperature,
            max_tokens: 1000
          });

          return response.choices[0]?.message?.content || "";
        });

        // Track AI generation
        await this.trackAIGeneration();

        return result;
      } catch (error) {
        monitoring.logError({
          message: "OpenAI API error in generateHRMessage method",
          error: error as Error,
          metadata: { resumeData, jobDescription, recruiterName, additionalInfo, temperature }
        });
        
        if (error instanceof Error) {
          const errorMessage = error.message;
          
          if (errorMessage.includes("empty or invalid")) {
            throw new Error(errorMessage);
          } else if (errorMessage.includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please try again in a few moments.");
          }
        }
        
        throw new Error("Failed to generate HR message. Please try again.");
      }
    });
  }
}

// Create and export a singleton instance
const openai = new OpenAIClient();
export default openai;

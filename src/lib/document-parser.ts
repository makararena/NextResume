/**
 * This file contains utilities for parsing text from PDF and DOCX files.
 */
import * as pdfjs from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Extracts text from document files (PDF only for now)
 * @param file Document file to extract text from
 * @returns The extracted document text
 */
export async function parseDocumentText(file: File): Promise<string> {
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return extractTextFromPdf(file);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // TODO: Add support for DOCX files
    throw new Error('DOCX parsing is not supported yet');
  } else {
    throw new Error(`Unsupported file type: ${fileType}. Only PDF files are supported.`);
  }
}

/**
 * Extracts text from a PDF file using PDF.js
 * @param file PDF file to extract text from
 * @returns The extracted text from the PDF
 */
async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the total number of pages
    const numPages = pdf.numPages;
    
    // Initialize text content
    let extractedText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract text from text items
      const pageText = textContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map(item => item.str)
        .join(' ');
        
      extractedText += pageText + '\n\n';
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to convert a file to base64
export async function fileToBase64(file: File): Promise<string> {
  // Server-side solution using ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

// Determine the MIME type for OpenAI vision API
export function getMimeType(file: File): string {
  if (file.type === "application/pdf") {
    return "application/pdf";
  } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else {
    return file.type;
  }
} 
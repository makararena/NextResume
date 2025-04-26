"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Upload,
  FileText,
  Zap,
  ChevronDown,
  BarChart2,
  Check,
  Clock,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  LayoutTemplate,
  Search,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton, useUser } from "@clerk/nextjs";

export default function Home() {
  const [showCursor, setShowCursor] = useState(true);
  const fullText = "Your Resume Isn't Broken. The System Is.";
  const [charCount, setCharCount] = useState(0);
  const { isSignedIn } = useUser();

  // Typing animation effect
  useEffect(() => {
    if (charCount < fullText.length) {
      const timeout = setTimeout(() => {
        setCharCount(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [charCount, fullText.length]);
  
  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Smooth scroll function
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (href?.startsWith('#')) {
      const targetId = href;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: (targetElement as HTMLElement).offsetTop,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border py-4 px-4 sm:px-6 flex justify-between items-center bg-background sticky top-0 z-50">
        <div className="flex items-center">
          <Link href="/" className="text-xl sm:text-2xl font-bold tracking-tighter">
            <span className="text-foreground">Next</span>
            <span className="text-foreground">Resume</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-4 sm:space-x-8">
          <ThemeToggle />
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Link
              href="/sign-in"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              aria-label="Sign In"
            >
              <span className="text-xs font-medium">U</span>
            </Link>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 grid grid-cols-1 px-4 sm:px-6 md:px-20 py-12 sm:py-16 md:py-24">
        <div className="flex flex-col justify-center space-y-8 sm:space-y-10 max-w-4xl mx-auto w-full">
          <div className="space-y-8 sm:space-y-12 text-center">
            <div className="relative">
              {/* Static text that will be revealed */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl xl:text-7xl font-bold leading-tight tracking-tight opacity-0 select-none pointer-events-none invisible" aria-hidden="true">
                {fullText}
              </h1>
              
              {/* Animated text with typed effect */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl xl:text-7xl font-bold leading-tight tracking-tight absolute top-0 left-0 right-0 text-center">
                {fullText.substring(0, charCount)}
                <span 
                  className={`inline-block ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}
                >|</span>
              </h1>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto px-4">
              Most resumes are rejected by hiring software before a human ever sees them. NextResume rewrites your resume to beat the filters and get you more interviews.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button size="lg" className="group w-full sm:w-auto" asChild>
              <Link href={isSignedIn ? "/resumes" : "/sign-in"}>
                Optimize My Resume <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="group w-full sm:w-auto" asChild>
              <a href="#how-it-works" onClick={handleSmoothScroll}>
                <Play className="mr-2 h-4 w-4" /> See how it works
              </a>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="space-y-6 sm:space-y-7 pt-6 max-w-2xl mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" strokeWidth={2.5} />
              </div>
              <p className="text-base sm:text-lg text-muted-foreground">Beats automated filters</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <LayoutTemplate className="h-5 w-5 sm:h-6 sm:w-6 text-primary" strokeWidth={2.5} />
              </div>
              <p className="text-base sm:text-lg text-muted-foreground">Templates with 70% higher pass rates</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" strokeWidth={2.5} />
              </div>
              <p className="text-base sm:text-lg text-muted-foreground">Formatting that recruiters notice</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" strokeWidth={2.5} />
              </div>
              <p className="text-base sm:text-lg text-muted-foreground">New or existing resume options</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Edit className="h-5 w-5 sm:h-6 sm:w-6 text-primary" strokeWidth={2.5} />
              </div>
              <p className="text-base sm:text-lg text-muted-foreground">Full control of AI-generated resumes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                <h2 className="text-xl sm:text-2xl font-bold">Why You're Losing Opportunities</h2>
              </div>
              <ul className="space-y-4 flex-grow">
                <li className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base">AI systems screen candidates before humans see resumes.</p>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base">98% of resumes get rejected automatically.</p>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base">Manual tailoring is time-consuming and ineffective.</p>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base">You're not failing interviews — you're not reaching them.</p>
                </li>
              </ul>
            </div>
            
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Outsmart the System. Get Hired.</h2>
              </div>
              <ul className="space-y-4 flex-grow">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base text-foreground">AI tailoring based on your target job</p>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base text-foreground">Keyword mapping for ATS filters</p>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base text-foreground">Clean formatting to attract recruiters</p>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base text-foreground">Optimized resumes in under 10 seconds</p>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base text-foreground">Fully editable output for control</p>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base text-foreground">Optimized for AI and human readers</p>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-sm sm:text-base text-foreground">Create new or optimize existing resumes</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-2">Choose from two simple options</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-card p-6 sm:p-8 rounded-lg shadow-sm flex flex-col items-center text-center transform transition hover:shadow-lg hover:-translate-y-1 animate-fade-in-up">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Step 1: Upload resume</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Import your existing resume or use our editor to create a new one.
              </p>
            </div>

            <div
              className="bg-card p-6 sm:p-8 rounded-lg shadow-sm flex flex-col items-center text-center transform transition hover:shadow-lg hover:-translate-y-1 animate-fade-in-up delay-100"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Step 2: Add job description</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Paste the job posting to allow our system to analyze keywords and match your qualifications.
              </p>
            </div>

            <div
              className="bg-card p-6 sm:p-8 rounded-lg shadow-sm flex flex-col items-center text-center transform transition hover:shadow-lg hover:-translate-y-1 animate-fade-in-up delay-200"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Step 3: Download optimized resume</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Get your ATS-optimized resume in seconds, ready to submit with confidence.
              </p>
            </div>
          </div>

          <div className="text-center mt-8 flex items-center justify-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2" />
            <p className="text-sm sm:text-base text-muted-foreground">Average delivery time: under 10 seconds</p>
          </div>

          <div className="text-center mt-10 sm:mt-12">
            <Button asChild className="w-full sm:w-auto">
              <Link href={isSignedIn ? "/resumes" : "/sign-in"}>
                Start Optimizing Now <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Success Metrics Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Proof It Works</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="bg-card p-6 sm:p-8 rounded-lg border border-border text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2">5,000+</div>
              <p className="text-sm sm:text-base text-muted-foreground">Resumes optimized</p>
            </div>
            
            <div className="bg-card p-6 sm:p-8 rounded-lg border border-border text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2">78%</div>
              <p className="text-sm sm:text-base text-muted-foreground">Average interview success rate</p>
            </div>
            
            <div className="bg-card p-6 sm:p-8 rounded-lg border border-border text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2">100+</div>
              <p className="text-sm sm:text-base text-muted-foreground">Industries supported</p>
            </div>
          </div>
          
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
              <p className="text-sm sm:text-base italic mb-3">"I got 3 interviews in my first week after using NextResume!"</p>
              <p className="text-xs sm:text-sm text-muted-foreground">— Michael R., Product Manager</p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
              <p className="text-sm sm:text-base italic mb-3">"My response rate jumped from 10% to 70%. The ROI is undeniable."</p>
              <p className="text-xs sm:text-sm text-muted-foreground">— Sarah J., Data Scientist</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            <div className="space-y-6 sm:space-y-8 flex flex-col">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Proven results for professionals like you
              </h2>

              <div className="p-4 sm:p-6 bg-muted/30 rounded-lg border border-border flex-grow">
                <p className="text-sm sm:text-base italic mb-4">
                  "Received responses from 70% of applications after using this
                  tool, compared to maybe 10% before. The ROI is incredible."
                </p>
                <p className="text-sm sm:text-base font-medium">— Alex T., Software Engineer</p>
              </div>

              <div className="p-4 sm:p-6 bg-muted/30 rounded-lg border border-border flex-grow">
                <p className="text-sm sm:text-base italic mb-4">
                  "I was applying to 5+ jobs daily with zero callbacks. This system
                  helped me land 3 interviews in my first week using optimized
                  resumes."
                </p>
                <p className="text-sm sm:text-base font-medium">— Jamie K., Marketing Specialist</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 bg-muted/30 p-6 sm:p-8 rounded-lg">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2">5,000+</div>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Resumes optimized and counting
                </p>
              </div>

              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2">78%</div>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Interview success rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-10 text-center">Frequently Asked Questions</h2>
          <p className="text-muted-foreground pb-8 sm:pb-10">
            Get answers to common questions
          </p>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold">How does the resume builder work?</h3>
              <div className="mt-2 text-muted-foreground">
                Upload your resume or create a new one, add the job description, and our AI analyzes keywords and patterns to optimize your resume for ATS systems.
              </div>
            </div>
            
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold">Is my data secure?</h3>
              <div className="mt-2 text-muted-foreground">
                Yes. We use encryption and secure data practices. Your information is never shared with third parties.
              </div>
            </div>
            
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold">Can I customize my resume after optimization?</h3>
              <div className="mt-2 text-muted-foreground">
                Yes. Our editor gives you full control to modify any part of your resume after AI optimization.
              </div>
            </div>
            
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold">What file formats are supported?</h3>
              <div className="mt-2 text-muted-foreground">
                We support PDF, DOCX, and TXT formats for uploads. You can download your optimized resume as PDF or DOCX.
              </div>
            </div>
            
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold">How do I cancel my subscription?</h3>
              <div className="mt-2 text-muted-foreground">
                Go to Account Settings and select "Manage Subscription" to cancel anytime.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Your professional achievements deserve recognition. Let us ensure they receive proper consideration.</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8">Unlock the full potential of your professional profile with our Premium subscription at $9.99/month. Our sophisticated optimization tools will position your resume for success in today's competitive market.</p>
          
          <Button size="lg" className="w-full sm:w-auto mt-4" asChild>
            <Link href={isSignedIn ? "/resumes" : "/sign-in"}>
              Optimize My Resume <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-6 sm:py-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link href="/" className="text-lg sm:text-xl font-bold">
                <span className="text-foreground">Next</span>
                <span className="text-foreground">Resume</span>
              </Link>
            </div>

            <div className="flex space-x-6 sm:space-x-8 mb-4 md:mb-0">
              <Link
                href="/terms"
                className="text-sm sm:text-base text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm sm:text-base text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
            </div>

            <div className="flex space-x-4">
              <a
                href="https://www.linkedin.com/company/naulichtis/"
                className="text-muted-foreground hover:text-foreground"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
                </svg>
              </a>
              <a
                href="https://t.me/naulichtis"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Telegram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"></path>
                </svg>
              </a>
              <a
                href="https://www.naulichtis.online/"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Website"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Added Naulichtis team information */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NextResume. Developed and controlled by the Naulichtis team.
            </p>
            <a 
              href="https://www.naulichtis.online/" 
              className="text-sm text-primary hover:underline mt-1 inline-block"
              target="_blank" 
              rel="noopener noreferrer"
            >
              Learn more about Naulichtis
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

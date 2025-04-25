import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { resumeDataInclude } from "@/lib/types";
import ResumeEditor from "./ResumeEditor";
import { unstable_noStore as noStore } from 'next/cache';
import { safeConsole } from '@/lib/utils';
import { Metadata } from "next";

// This tells Next.js this is a dynamic route that should not be statically optimized
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface EditorPageProps {
  searchParams: { 
    resumeId?: string;
  };
}

export const metadata: Metadata = {
  title: "Design your resume",
};

export default async function EditorPage({ searchParams }: EditorPageProps) {
  let resumeToEdit = null;
  
  // Disable Next.js caching for this route
  noStore();
  
  safeConsole.debug("=== Page component start ===");
  safeConsole.time("⏱️ Page component total render time");

  try {
    safeConsole.time("⏱️ Search params resolution");
    const { resumeId } = searchParams;
    safeConsole.timeEnd("⏱️ Search params resolution");
    safeConsole.debug("Search params resolved", { resumeId });

    safeConsole.time("⏱️ Auth verification");
    const { userId } = await auth();
    safeConsole.timeEnd("⏱️ Auth verification");
    safeConsole.debug("User authenticated", { hasUserId: !!userId });

    if (!userId) {
      safeConsole.info("No user authenticated, redirecting");
      safeConsole.timeEnd("⏱️ Page component total render time");
      return null;
    }

    if (resumeId) {
      safeConsole.debug("Fetching resume", { resumeId });
      safeConsole.time(`⏱ Fetching resume ID: ${resumeId}`);
      try {
        resumeToEdit = await prisma.resume.findUnique({
          where: { id: resumeId, userId },
          include: resumeDataInclude,
        });
        safeConsole.debug("Resume fetch result", { found: !!resumeToEdit });
        if (resumeToEdit) {
          safeConsole.debug("Resume metrics", { 
            size: JSON.stringify(resumeToEdit).length,
            workExperiencesCount: resumeToEdit.workExperiences.length,
            educationsCount: resumeToEdit.educations.length
          });
        }
      } catch (error) {
        safeConsole.error("Error fetching resume", error as Error);
      } finally {
        safeConsole.timeEnd(`⏱ Fetching resume ID: ${resumeId}`);
      }
    } else {
      safeConsole.debug("No resumeId provided, skipping fetch");
    }

    safeConsole.debug("Rendering ResumeEditor", { 
      hasResumeToEdit: !!resumeToEdit,
      resumeId: resumeToEdit?.id || null
    });
    safeConsole.timeEnd("⏱️ Page component total render time");
    return <ResumeEditor resumeToEdit={resumeToEdit} />;
  } catch (error) {
    safeConsole.error("Error in page component", error as Error);
    safeConsole.timeEnd("⏱️ Page component total render time");
    throw error;
  }
}
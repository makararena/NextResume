import prisma from "@/lib/prisma";
import { resumeDataInclude } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import ResumeEditor from "./ResumeEditor";
import { unstable_noStore as noStore } from 'next/cache';

// This tells Next.js this is a dynamic route that should not be statically optimized
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { resumeId?: string };
}

export const metadata: Metadata = {
  title: "Design your resume",
};

export default async function Page({ searchParams }: PageProps) {
  // Prevent this page from being cached
  noStore();
  
  console.log("=== Page component start ===");
  console.time("⏱️ Page component total render time");

  try {
    console.time("⏱️ Search params resolution");
    const { resumeId } = searchParams;
    console.timeEnd("⏱️ Search params resolution");
    console.log("Search params resolved:", { resumeId });

    console.time("⏱️ Auth verification");
    const { userId } = await auth();
    console.timeEnd("⏱️ Auth verification");
    console.log("User ID from auth:", userId);

    if (!userId) {
      console.log("No user authenticated. Returning null.");
      console.timeEnd("⏱️ Page component total render time");
      return null;
    }

    let resumeToEdit = null;

    if (resumeId) {
      console.log("Fetching resume from DB for ID:", resumeId);
      console.time(`⏱ Fetching resume ID: ${resumeId}`);
      try {
        resumeToEdit = await prisma.resume.findUnique({
          where: { id: resumeId, userId },
          include: resumeDataInclude,
        });
        console.log("Resume fetch result:", resumeToEdit ? "found" : "not found");
        if (resumeToEdit) {
          console.log("Resume size:", JSON.stringify(resumeToEdit).length);
          console.log("Work experiences count:", resumeToEdit.workExperiences.length);
          console.log("Education entries count:", resumeToEdit.educations.length);
        }
      } catch (error) {
        console.error("Error fetching resume:", error);
      } finally {
        console.timeEnd(`⏱ Fetching resume ID: ${resumeId}`);
      }
    } else {
      console.log("No resumeId provided, skipping fetch.");
    }

    console.log("Rendering ResumeEditor with resumeToEdit:", resumeToEdit ? `ID: ${resumeToEdit.id}` : "null");
    console.timeEnd("⏱️ Page component total render time");
    return <ResumeEditor resumeToEdit={resumeToEdit} />;
  } catch (error) {
    console.error("Error in page component:", error);
    console.timeEnd("⏱️ Page component total render time");
    throw error;
  }
}

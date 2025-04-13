import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import AIResumeUploader from "./AIResumeUploader";

export const metadata: Metadata = {
  title: "AI Resume Generator",
};

export default async function AIModePage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return <AIResumeUploader />;
} 
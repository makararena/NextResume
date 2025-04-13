-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "analysisReason" TEXT,
ADD COLUMN     "matchingPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "prioritizedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[];

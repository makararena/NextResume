"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { canCreateResume } from "@/lib/permissions";
import { getUserSubscriptionLevel } from "@/lib/subscription";

export async function deleteResume(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const resume = await prisma.resume.findUnique({
    where: {
      id,
      userId,
    },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  // Delete photo URL blob if it exists
  if (resume.photoUrl) {
    await del(resume.photoUrl);
  }

  // Check if resume has a CV URL and delete it
  // The field might be cvUrl or another name depending on how it was stored
  // @ts-ignore - cvUrl might not be in the type definition but could exist in the DB
  if (resume.cvUrl) {
    // @ts-ignore
    await del(resume.cvUrl);
  }

  // First, remove the resume from any groups it belongs to
  const groupsWithResume = await prisma.resumeGroup.findMany({
    where: {
      userId,
      resumeIds: {
        has: id
      }
    }
  });

  for (const group of groupsWithResume) {
    await prisma.resumeGroup.update({
      where: { id: group.id },
      data: {
        resumeIds: group.resumeIds.filter(resumeId => resumeId !== id)
      }
    });
  }

  // Then delete the resume
  await prisma.resume.delete({
    where: {
      id,
    },
  });

  // Ensure paths are revalidated
  revalidatePath("/resumes");
  revalidatePath("/dashboard");
  revalidatePath("/editor");
}

export async function duplicateResume(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get the original resume
  const originalResume = await prisma.resume.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      workExperiences: true,
      educations: true,
    },
  });

  if (!originalResume) {
    throw new Error("Resume not found");
  }

  // Check if user can create another resume
  const canCreate = await canCreateResume(userId);
  if (!canCreate) {
    throw new Error(
      "You've reached your limit of free resumes. Please upgrade to create more."
    );
  }

  // Find groups that contain this resume
  const groupsWithResume = await prisma.resumeGroup.findMany({
    where: {
      userId,
      resumeIds: {
        has: id
      }
    }
  });

  // Determine the copy number by finding existing copies
  const baseTitle = originalResume.title || "Resume";
  // Escape special regex characters in the title
  const escapedBaseTitle = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const copyRegex = new RegExp(`^${escapedBaseTitle} \\(Copy(?: (\\d+))?\\)$`);
  
  const existingCopies = await prisma.resume.findMany({
    where: {
      userId,
      title: {
        startsWith: `${baseTitle} (Copy`,
      },
    },
    select: {
      title: true,
    },
  });

  // Find the highest copy number
  let highestCopyNumber = 0;
  existingCopies.forEach(copy => {
    const match = copy.title?.match(copyRegex);
    if (match) {
      const copyNumber = match[1] ? parseInt(match[1], 10) : 1;
      if (copyNumber > highestCopyNumber) {
        highestCopyNumber = copyNumber;
      }
    }
  });
  
  // Create the new copy number
  const nextCopyNumber = highestCopyNumber + 1;
  const newTitle = nextCopyNumber === 1 
    ? `${baseTitle} (Copy)` 
    : `${baseTitle} (Copy ${nextCopyNumber})`;

  // Create a copy of the resume
  const { id: originalId, createdAt, updatedAt, workExperiences, educations, skills, ...resumeData } = originalResume;

  // Create the new resume with a copy title
  const newResume = await prisma.resume.create({
    data: {
      ...resumeData,
      title: newTitle,
      workExperiences: {
        create: workExperiences.map(({ id, createdAt, updatedAt, resumeId, ...expData }) => expData),
      },
      educations: {
        create: educations.map(({ id, createdAt, updatedAt, resumeId, ...eduData }) => eduData),
      },
      skills: skills || [],
    },
  });

  // Add the new resume to the same groups as the original
  if (groupsWithResume.length > 0) {
    for (const group of groupsWithResume) {
      await prisma.resumeGroup.update({
        where: { id: group.id },
        data: {
          resumeIds: [...group.resumeIds, newResume.id]
        }
      });
    }
  }

  revalidatePath("/resumes");
  return newResume;
}

// Resume Group actions

export async function getResumeGroups() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const groups = await prisma.resumeGroup.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  
  return groups;
}

export async function createResumeGroup(name: string, resumeIds: string[] = []) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const group = await prisma.resumeGroup.create({
    data: {
      userId,
      name,
      resumeIds,
    },
  });
  
  revalidatePath("/resumes");
  return group;
}

export async function updateResumeGroup(id: string, data: { name?: string, resumeIds?: string[] }) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  // Check if the group exists and belongs to the user
  const existingGroup = await prisma.resumeGroup.findUnique({
    where: {
      id,
      userId,
    },
  });
  
  if (!existingGroup) {
    throw new Error("Group not found");
  }
  
  const updatedGroup = await prisma.resumeGroup.update({
    where: {
      id,
    },
    data,
  });
  
  revalidatePath("/resumes");
  return updatedGroup;
}

export async function deleteResumeGroup(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  // Check if the group exists and belongs to the user
  const existingGroup = await prisma.resumeGroup.findUnique({
    where: {
      id,
      userId,
    },
  });
  
  if (!existingGroup) {
    throw new Error("Group not found");
  }
  
  await prisma.resumeGroup.delete({
    where: {
      id,
    },
  });
  
  revalidatePath("/resumes");
}

export async function getResume(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  const resume = await prisma.resume.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      workExperiences: true,
      educations: true,
    },
  });
  
  if (!resume) {
    throw new Error("Resume not found");
  }
  
  return resume;
}

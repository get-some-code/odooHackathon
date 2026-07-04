"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EmployeeUpdateProfileSchema,
  AdminUpdateProfileSchema,
} from "@/lib/validators";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Fetch profile details for a user.
 * If targetUserId is provided, the requester must be an ADMIN.
 */
export async function getProfileAction(targetUserId?: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = targetUserId || session.id;

    // If requesting someone else's profile, requester must be ADMIN
    if (userId !== session.id && session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const userProfile = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        payrolls: {
          orderBy: { year: "desc" },
          take: 1, // Get latest payroll for salary summary
        },
      },
    });

    if (!userProfile) {
      return { success: false, error: "Profile not found" };
    }

    // Exclude password hash from response by mapping properties explicitly
    const safeUser = {
      id: userProfile.id,
      employeeId: userProfile.employeeId,
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      role: userProfile.role,
      isVerified: userProfile.isVerified,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
      profile: userProfile.profile,
      documents: userProfile.documents,
      payrolls: userProfile.payrolls,
    };

    return {
      success: true,
      data: safeUser,
    };
  } catch (error) {
    console.error("Failed to get profile:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Update user profile details.
 * Performs role-based security validation and dynamic field updates.
 */
export async function updateProfileAction(
  targetUserId: string,
  data: unknown
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const isAdmin = session.role === "ADMIN";

    // Requesters can only edit their own profile unless they are an ADMIN
    if (targetUserId !== session.id && !isAdmin) {
      return { success: false, error: "Access denied" };
    }

    if (isAdmin) {
      // Admin update path
      const validated = AdminUpdateProfileSchema.safeParse(data);
      if (!validated.success) {
        return {
          success: false,
          error: validated.error.errors[0]?.message || "Validation failed",
        };
      }

      const {
        firstName,
        lastName,
        email,
        employeeId,
        phone,
        address,
        department,
        designation,
        joiningDate,
        profileImage,
      } = validated.data;

      // Check unique constraints for email and employeeId
      const emailConflict = await db.user.findFirst({
        where: {
          email,
          id: { not: targetUserId },
        },
      });
      if (emailConflict) {
        return { success: false, error: "Email is already in use by another employee" };
      }

      const empIdConflict = await db.user.findFirst({
        where: {
          employeeId,
          id: { not: targetUserId },
        },
      });
      if (empIdConflict) {
        return { success: false, error: "Employee ID is already in use by another employee" };
      }

      // Parse joiningDate if it's a string
      const parsedJoiningDate = joiningDate ? new Date(joiningDate) : null;

      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            firstName,
            lastName,
            email,
            employeeId,
          },
        });

        await tx.employeeProfile.upsert({
          where: { userId: targetUserId },
          update: {
            phone,
            address,
            department,
            designation,
            joiningDate: parsedJoiningDate,
            profileImage,
          },
          create: {
            userId: targetUserId,
            phone,
            address,
            department,
            designation,
            joiningDate: parsedJoiningDate,
            profileImage,
          },
        });
      });
    } else {
      // Employee update path (only phone, address, profileImage)
      const validated = EmployeeUpdateProfileSchema.safeParse(data);
      if (!validated.success) {
        return {
          success: false,
          error: validated.error.errors[0]?.message || "Validation failed",
        };
      }

      const { phone, address, profileImage } = validated.data;

      await db.employeeProfile.upsert({
        where: { userId: targetUserId },
        update: {
          phone,
          address,
          profileImage,
        },
        create: {
          userId: targetUserId,
          phone,
          address,
          profileImage,
        },
      });
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "An unexpected error occurred during update." };
  }
}

/**
 * Delete profile image.
 */
export async function deleteProfileImageAction(targetUserId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    if (targetUserId !== session.id && session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    await db.employeeProfile.update({
      where: { userId: targetUserId },
      data: {
        profileImage: null,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Delete profile image error:", error);
    return { success: false, error: "Failed to delete profile picture" };
  }
}

/**
 * Link an uploaded document to a user profile.
 */
export async function addDocumentAction(
  targetUserId: string,
  name: string,
  fileUrl: string
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    if (targetUserId !== session.id && session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const doc = await db.document.create({
      data: {
        userId: targetUserId,
        name,
        fileUrl,
      },
    });

    revalidatePath("/profile");
    return { success: true, data: doc };
  } catch (error) {
    console.error("Add document error:", error);
    return { success: false, error: "Failed to save document record" };
  }
}

/**
 * Delete a linked document.
 */
export async function deleteDocumentAction(
  documentId: string,
  targetUserId: string
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    if (targetUserId !== session.id && session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    await db.document.delete({
      where: {
        id: documentId,
        userId: targetUserId,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Delete document error:", error);
    return { success: false, error: "Failed to delete document" };
  }
}

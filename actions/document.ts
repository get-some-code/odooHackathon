"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DocumentVerifyItem {
  id: string;
  userId: string;
  fullName: string;
  employeeId: string;
  name: string;
  fileType: string;
  fileUrl: string;
  status: string;
  adminComment: string | null;
  uploadedAt: Date;
}

/**
 * Upload an employee profile document.
 */
export async function uploadDocumentAction(params: {
  userId: string;
  name: string;
  fileType: string;
  fileUrl: string;
}): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    if (session.id !== params.userId && session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const doc = await db.document.create({
      data: {
        userId: params.userId,
        name: params.name,
        fileType: params.fileType,
        fileUrl: params.fileUrl,
        status: "PENDING",
      },
    });

    writeAuditLog(
      "Document Uploaded",
      session.id,
      `${session.firstName} ${session.lastName}`,
      params.userId,
      `Uploaded: ${params.fileType} (${params.name})`
    );

    revalidatePath("/profile");
    return { success: true, data: doc };
  } catch (error) {
    console.error("Document upload error:", error);
    return { success: false, error: "Failed to upload document" };
  }
}

/**
 * Verify or Reject a document.
 * Restricted to ADMIN accounts.
 */
export async function verifyDocumentAction(params: {
  documentId: string;
  status: "VERIFIED" | "REJECTED";
  adminComment?: string;
}): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const { documentId, status, adminComment } = params;

    const doc = await db.document.findUnique({
      where: { id: documentId },
      include: { user: true },
    });

    if (!doc) return { success: false, error: "Document not found" };

    await db.document.update({
      where: { id: documentId },
      data: {
        status,
        adminComment: adminComment || null,
        verifiedAt: new Date(),
      },
    });

    writeAuditLog(
      `Document ${status === "VERIFIED" ? "Verified" : "Rejected"}`,
      session.id,
      `${session.firstName} ${session.lastName}`,
      doc.userId,
      `Document: ${doc.fileType} - Comment: ${adminComment || "None"}`
    );

    revalidatePath("/admin/documents");
    return { success: true };
  } catch (error) {
    console.error("Verify document error:", error);
    return { success: false, error: "Failed to update document status" };
  }
}

/**
 * Retrieve all documents or pending verifications list.
 * Restricted to ADMIN accounts.
 */
export async function getAdminDocumentsAction(params: {
  status?: string;
  search?: string;
}): Promise<ActionResponse<DocumentVerifyItem[]>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { fileType: { contains: params.search } },
        { user: { firstName: { contains: params.search } } },
        { user: { lastName: { contains: params.search } } },
      ];
    }

    const docs = await db.document.findMany({
      where,
      include: { user: true },
      orderBy: { uploadedAt: "desc" },
    });

    return {
      success: true,
      data: docs.map((d) => ({
        id: d.id,
        userId: d.userId,
        fullName: `${d.user.firstName} ${d.user.lastName}`,
        employeeId: d.user.employeeId,
        name: d.name,
        fileType: d.fileType,
        fileUrl: d.fileUrl,
        status: d.status,
        adminComment: d.adminComment,
        uploadedAt: d.uploadedAt,
      })),
    };
  } catch (error) {
    console.error("Get admin documents error:", error);
    return { success: false, error: "Failed to fetch document board records" };
  }
}

/**
 * Retrieve active documents for an individual employee profile.
 */
export async function getEmployeeDocumentsAction(userId: string): Promise<ActionResponse<DocumentVerifyItem[]>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    if (session.id !== userId && session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    const docs = await db.document.findMany({
      where: { userId },
      include: { user: true },
      orderBy: { uploadedAt: "desc" },
    });

    return {
      success: true,
      data: docs.map((d) => ({
        id: d.id,
        userId: d.userId,
        fullName: `${d.user.firstName} ${d.user.lastName}`,
        employeeId: d.user.employeeId,
        name: d.name,
        fileType: d.fileType,
        fileUrl: d.fileUrl,
        status: d.status,
        adminComment: d.adminComment,
        uploadedAt: d.uploadedAt,
      })),
    };
  } catch (error) {
    console.error("Get employee documents error:", error);
    return { success: false, error: "Failed to fetch employee documents" };
  }
}

/**
 * Request document re-upload by resetting state back to pending and inserting feedback.
 */
export async function requestReuploadAction(documentId: string, comment: string): Promise<ActionResponse> {
  return verifyDocumentAction({
    documentId,
    status: "REJECTED",
    adminComment: `Re-upload requested: ${comment}`,
  });
}

/**
 * Delete a document.
 */
export async function deleteDocumentRecordAction(documentId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const doc = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) return { success: false, error: "Document not found" };

    if (doc.userId !== session.id && session.role !== "ADMIN") {
      return { success: false, error: "Access denied" };
    }

    await db.document.delete({
      where: { id: documentId },
    });

    writeAuditLog(
      "Document Deleted",
      session.id,
      `${session.firstName} ${session.lastName}`,
      doc.userId,
      `Deleted document file: ${doc.name}`
    );

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Delete document record error:", error);
    return { success: false, error: "Failed to delete document" };
  }
}

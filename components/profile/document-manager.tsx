"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, ShieldAlert, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addDocumentAction, deleteDocumentAction } from "@/actions/profile";

interface DocumentItem {
  id: string;
  name: string;
  fileUrl: string;
  uploadedAt: Date | string;
}

interface DocumentManagerProps {
  userId: string;
  initialDocuments: DocumentItem[];
  readOnly?: boolean;
}

const REQUIRED_DOCS = ["Aadhaar Card", "PAN Card", "Resume", "Offer Letter"];

export function DocumentManager({ userId, initialDocuments, readOnly = false }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleUpload = async (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF, PNG, JPG/JPEG)
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PDF, PNG, and JPEG are allowed.");
      return;
    }

    setUploadingDoc(docName);
    const toastId = toast.loading(`Uploading ${docName}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "documents");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const { fileUrl } = await res.json();

      // Save to database
      const saveRes = await addDocumentAction(userId, docName, fileUrl);
      if (saveRes.success && saveRes.data) {
        const newDoc = saveRes.data as DocumentItem;
        setDocuments((prev) => [newDoc, ...prev]);
        toast.success(`${docName} uploaded successfully!`, { id: toastId });
      } else {
        throw new Error(saveRes.error || "Failed to link document");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to upload document";
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${docName}?`);
    if (!confirmDelete) return;

    const toastId = toast.loading(`Deleting ${docName}...`);
    try {
      const res = await deleteDocumentAction(docId, userId);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        toast.success(`${docName} deleted successfully!`, { id: toastId });
      } else {
        throw new Error(res.error || "Delete failed");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to delete document";
      toast.error(errMsg, { id: toastId });
    }
  };

  return (
    <Card className="glass border-[var(--border)] overflow-hidden">
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Required documents for verification and onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REQUIRED_DOCS.map((docName) => {
            // Find if this document has been uploaded
            const doc = documents.find(
              (d) => d.name.toLowerCase() === docName.toLowerCase()
            );

            return (
              <div
                key={docName}
                className="relative flex items-center justify-between p-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <FileText className="h-5.5 w-5.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {docName}
                    </p>
                    {doc ? (
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        Uploaded on {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--danger)] font-medium flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3 shrink-0" /> Missing
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {doc ? (
                    <>
                      <Button
                        asChild
                        variant="secondary"
                        size="icon-sm"
                        title="Download Document"
                      >
                        <a href={doc.fileUrl} download={docName} target="_blank" rel="noreferrer">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                          onClick={() => handleDelete(doc.id, docName)}
                          title="Delete Document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </>
                  ) : !readOnly ? (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        disabled={uploadingDoc !== null}
                        onChange={(e) => handleUpload(docName, e)}
                      />
                      <span className="inline-flex items-center justify-center h-8 px-3 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors select-none">
                        {uploadingDoc === docName ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Upload
                      </span>
                    </label>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { toast } from "sonner";
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import {
  verifyDocumentAction,
  getAdminDocumentsAction,
  type DocumentVerifyItem,
} from "@/actions/document";

interface AdminDocumentsViewProps {
  initialDocuments: DocumentVerifyItem[];
}

export function AdminDocumentsView({ initialDocuments }: AdminDocumentsViewProps) {
  const [, startTransition] = useTransition();
  const [docs, setDocs] = useState<DocumentVerifyItem[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Reject / Comment state
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [actionType, setActionType] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [commentText, setCommentText] = useState("");

  const refreshList = async () => {
    const res = await getAdminDocumentsAction({
      status: statusFilter,
      search: search || undefined,
    });
    if (res.success && res.data) {
      setDocs(res.data);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshList();
  };

  const handleQuickVerify = (docId: string) => {
    startTransition(async () => {
      const res = await verifyDocumentAction({
        documentId: docId,
        status: "VERIFIED",
        adminComment: "Verified successfully",
      });
      if (res.success) {
        toast.success("Document marked as verified!");
        refreshList();
      } else {
        toast.error(res.error || "Verification failed");
      }
    });
  };

  const handleOpenComment = (docId: string, type: "VERIFIED" | "REJECTED") => {
    setSelectedDocId(docId);
    setActionType(type);
    setCommentText(type === "REJECTED" ? "Incomplete scan, please upload a clearer copy." : "");
    setIsCommentOpen(true);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await verifyDocumentAction({
        documentId: selectedDocId,
        status: actionType,
        adminComment: commentText,
      });
      if (res.success) {
        toast.success(`Document marked as ${actionType === "VERIFIED" ? "verified" : "rejected"}!`);
        setIsCommentOpen(false);
        refreshList();
      } else {
        toast.error(res.error || "Save failed");
      }
    });
  };

  return (
    <div className="space-y-6 text-xs select-none">
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search name, doc name, type..."
                className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                // Trigger refresh immediately
                startTransition(async () => {
                  const res = await getAdminDocumentsAction({
                    status: e.target.value,
                    search: search || undefined,
                  });
                  if (res.success && res.data) setDocs(res.data);
                });
              }}
            >
              <option value="ALL">All Documents</option>
              <option value="PENDING">Pending Verifications</option>
              <option value="VERIFIED">Verified Documents</option>
              <option value="REJECTED">Rejected Documents</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="h-9">
              Search
            </Button>
          </form>

          <Button variant="outline" size="sm" className="h-9" onClick={refreshList}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh Board
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-[var(--border)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Profile</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Document File</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Feedback Comment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length > 0 ? (
                docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-xs text-[var(--text-primary)]">{doc.fullName}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">ID: {doc.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
                        {doc.fileType}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-[var(--text-primary)] flex items-center gap-1.5 pt-4">
                      <FileText className="h-4 w-4 text-[var(--accent)]" />
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {doc.name}
                      </a>
                    </TableCell>
                    <TableCell>{new Date(doc.uploadedAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>
                      <StatusChip
                        status={
                          doc.status === "VERIFIED"
                            ? "present"
                            : doc.status === "REJECTED"
                            ? "absent"
                            : "pending"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-[10px] text-[var(--text-muted)] max-w-[150px] truncate" title={doc.adminComment || ""}>
                      {doc.adminComment || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Open PDF Document"
                          asChild
                        >
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3.5 w-3.5" />
                          </a>
                        </Button>

                        {doc.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-emerald-500 hover:bg-emerald-500/10"
                              title="Verify Immediately"
                              onClick={() => handleQuickVerify(doc.id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                              title="Reject or Leave Feedback"
                              onClick={() => handleOpenComment(doc.id, "REJECTED")}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {doc.status !== "PENDING" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Change verification details"
                            onClick={() => handleOpenComment(doc.id, doc.status as "VERIFIED" | "REJECTED")}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No matching documents awaiting verification.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject / Comment Modal */}
      {isCommentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsCommentOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5 text-[var(--danger)]" /> Disapprove / Verify Document
              </h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsCommentOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCommentSubmit} className="p-5 space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[var(--text-secondary)] uppercase">Verification Status</label>
                <select
                  className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-xs"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as "VERIFIED" | "REJECTED")}
                >
                  <option value="VERIFIED">Approve &amp; Verify Document (VERIFIED)</option>
                  <option value="REJECTED">Reject &amp; Request re-upload (REJECTED)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[var(--text-secondary)] uppercase">Comment / Feedback Description</label>
                <textarea
                  rows={3}
                  placeholder="Explain reason for rejection, or provide verification comments..."
                  className="w-full p-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCommentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Verification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

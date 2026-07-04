"use client";

import * as React from "react";
import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { toast } from "sonner";
import {
  User,
  Lock,
  Bell,
  History,
  Shield,
  Phone,
  MapPin,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { updateProfileAction } from "@/actions/profile";
import { updatePasswordAction } from "@/actions/auth";
import { getAuditLogsAction } from "@/actions/admin";
import { type AuditLogEntry } from "@/lib/audit";
import {
  getEmployeeDocumentsAction,
  uploadDocumentAction,
  deleteDocumentRecordAction,
  type DocumentVerifyItem,
} from "@/actions/document";

interface SettingsClientViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProfile: any;
}

export function SettingsClientView({ userProfile }: SettingsClientViewProps) {
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "documents" | "audit">("profile");

  // Tab 1: Profile State
  const [profileForm, setProfileForm] = useState({
    phone: userProfile.profile?.phone || "",
    address: userProfile.profile?.address || "",
    profileImage: userProfile.profile?.profileImage || "",
  });

  // Tab 2: Password State
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Tab 3: Notifications State (Mock preferences settings)
  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    toastLogs: true,
    weeklyReport: false,
  });

  // Tab 4: Documents State
  const [documents, setDocuments] = useState<DocumentVerifyItem[]>([]);
  const [docForm, setDocForm] = useState({
    name: "",
    fileType: "Aadhaar",
    fileUrl: "",
  });

  // Tab 5: Audit Logs State (Admin only)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Retrieve employee documents
  const fetchDocuments = useCallback(async () => {
    const res = await getEmployeeDocumentsAction(userProfile.id);
    if (res.success && res.data) {
      setDocuments(res.data);
    }
  }, [userProfile.id]);

  // Retrieve audit logs
  const fetchAuditLogs = useCallback(async () => {
    if (userProfile.role !== "ADMIN" || activeTab !== "audit") return;
    const res = await getAuditLogsAction({ page: currentPage, limit: logsPerPage });
    if (res.success && res.data) {
      setAuditLogs(res.data.items);
      setTotalLogs(res.data.total);
    }
  }, [userProfile.role, activeTab, currentPage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Tab Form Submissions
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfileAction(userProfile.id, profileForm);
      if (res.success) {
        toast.success("Profile preferences updated successfully!");
      } else {
        toast.error(res.error || "Update failed");
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all security fields.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await updatePasswordAction(passwordForm.newPassword);
      if (res.success) {
        toast.success("Security keys changed successfully!");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      } else {
        toast.error(res.error || "Change password failed");
      }
    });
  };

  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name || !docForm.fileUrl) {
      toast.error("Please fill in document title and file URL.");
      return;
    }

    startTransition(async () => {
      const res = await uploadDocumentAction({
        userId: userProfile.id,
        name: docForm.name,
        fileType: docForm.fileType,
        fileUrl: docForm.fileUrl,
      });

      if (res.success) {
        toast.success("Document uploaded successfully for verification!");
        setDocForm({ name: "", fileType: "Aadhaar", fileUrl: "" });
        fetchDocuments();
      } else {
        toast.error(res.error || "Upload failed");
      }
    });
  };

  const handleDeleteDoc = (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    startTransition(async () => {
      const res = await deleteDocumentRecordAction(docId);
      if (res.success) {
        toast.success("Document deleted successfully!");
        fetchDocuments();
      } else {
        toast.error(res.error || "Delete failed");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs select-none">
      {/* Sidebar Tabs Selectors */}
      <Card className="glass border-[var(--border)] lg:col-span-1">
        <CardContent className="p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)] font-semibold transition-all ${
              activeTab === "profile" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            <User className="h-4 w-4" /> Profile Details
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)] font-semibold transition-all ${
              activeTab === "security" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            <Lock className="h-4 w-4" /> Password &amp; Keys
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)] font-semibold transition-all ${
              activeTab === "notifications" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            <Bell className="h-4 w-4" /> Alerts Setup
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)] font-semibold transition-all ${
              activeTab === "documents" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            <FolderOpen className="h-4 w-4" /> Document Vault
          </button>
          {userProfile.role === "ADMIN" && (
            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)] font-semibold transition-all ${
                activeTab === "audit" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
              }`}
            >
              <History className="h-4 w-4" /> Audit Trails
            </button>
          )}
        </CardContent>
      </Card>

      {/* Detail Views panel */}
      <Card className="glass border-[var(--border)] lg:col-span-3">
        <CardContent className="p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Contact Details</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Manage details visible on corporate profile cards.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[var(--text-secondary)] uppercase">Corporate Email</label>
                  <input
                    type="text"
                    className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] cursor-not-allowed text-xs focus:outline-none"
                    value={userProfile.email}
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[var(--text-secondary)] uppercase">Employee ID</label>
                  <input
                    type="text"
                    className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] cursor-not-allowed text-xs focus:outline-none"
                    value={userProfile.employeeId}
                    disabled
                  />
                </div>

                <Input
                  label="Contact Phone"
                  placeholder="9876543210"
                  leftIcon={<Phone className="h-4 w-4" />}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
                <Input
                  label="Postal Address"
                  placeholder="Street details..."
                  leftIcon={<MapPin className="h-4 w-4" />}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end border-t border-[var(--border-subtle)] pt-4 mt-6">
                <Button type="submit" variant="primary">
                  Save preferences
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Password &amp; Credentials</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Change security credentials to secure profile details.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="At least 6 characters..."
                  leftIcon={<Lock className="h-4 w-4" />}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
                <Input
                  label="Verify Password"
                  type="password"
                  placeholder="Match password..."
                  leftIcon={<CheckCircle className="h-4 w-4" />}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>

              <div className="flex justify-end border-t border-[var(--border-subtle)] pt-4 mt-6">
                <Button type="submit" variant="primary">
                  Apply security update
                </Button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Alert Preferences</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Configure system alert notifications and email options.</p>
              </div>

              <div className="space-y-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-4 rounded-[var(--radius-xl)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-primary)]">E-mail Alerts</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Send weekly report digests and salary processed receipts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.emailAlerts}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, emailAlerts: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-primary)]">Dashboard Toast Logs</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Show real-time toast alert chips for checklist changes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.toastLogs}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, toastLogs: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* Document upload form */}
              <form onSubmit={handleDocSubmit} className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Upload Identity Document</h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Upload Aadhaar, PAN, passport, or offer letter for admin verification reviews.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="File Name"
                    placeholder="e.g. My_Aadhaar_Card.pdf"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  />

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[var(--text-secondary)] uppercase">Document Classification</label>
                    <select
                      className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs focus:outline-none"
                      value={docForm.fileType}
                      onChange={(e) => setDocForm({ ...docForm, fileType: e.target.value })}
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Resume">Resume / CV</option>
                      <option value="Offer Letter">Offer Letter</option>
                      <option value="Joining Letter">Joining Letter</option>
                      <option value="Experience Letter">Experience Letter</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Other">Other Documents</option>
                    </select>
                  </div>

                  <Input
                    label="Document File URL"
                    placeholder="e.g. /data/aadhaar.pdf"
                    value={docForm.fileUrl}
                    onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary">
                    <Upload className="h-3.5 w-3.5 mr-1" /> Submit Document
                  </Button>
                </div>
              </form>

              {/* Document list mapping */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)]">My Uploaded Documents</h4>
                <div className="border border-[var(--border-subtle)] rounded-[var(--radius-xl)] bg-[var(--surface)] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Document File</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verification Comment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.length > 0 ? (
                        documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-semibold">{doc.fileType}</TableCell>
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
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                                onClick={() => handleDeleteDoc(doc.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            No documents submitted to the vault yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit" && userProfile.role === "ADMIN" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1">
                    <Shield className="h-4.5 w-4.5 text-[var(--accent)]" /> System Operations Logs
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Auditing logs of all administrative updates executed.</p>
                </div>
              </div>

              <div className="border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--surface)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Execution Time</TableHead>
                      <TableHead>Admin Action</TableHead>
                      <TableHead>Administrator</TableHead>
                      <TableHead>Description Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log, idx) => (
                        <TableRow key={`log-${idx}`}>
                          <TableCell className="text-[10px] font-mono whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">{log.adminName}</TableCell>
                          <TableCell className="text-[10px] max-w-[200px] truncate" title={log.affectedEmployeeName || ""}>
                            {log.affectedEmployeeName ? `Target: ${log.affectedEmployeeName}` : "System Wide"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          No administrative operation logs compiled yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalLogs > logsPerPage && (
                  <div className="flex items-center justify-between p-4 border-t border-[var(--border-subtle)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      Showing {auditLogs.length} of {totalLogs} logs
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-3 w-3" /> Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={currentPage >= Math.ceil(totalLogs / logsPerPage)}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

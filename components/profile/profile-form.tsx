"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Lock,
  Edit2,
  Trash2,
  Upload,
  Loader2,
  Save,
  Info,
  DollarSign,
  Sparkles,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmployeeUpdateProfileSchema, AdminUpdateProfileSchema } from "@/lib/validators";
import { updateProfileAction, deleteProfileImageAction } from "@/actions/profile";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  role: string;
  profile?: {
    id: string;
    phone: string | null;
    address: string | null;
    department: string | null;
    designation: string | null;
    joiningDate: Date | string | null;
    profileImage: string | null;
  } | null;
  payrolls?: Array<{
    basicSalary: number;
    allowances: number;
    netSalary: number;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    fileUrl: string;
    uploadedAt: Date | string;
  }>;
}

interface ProfileFormProps {
  user: UserProfile;
  currentSessionUser: { id: string; role: string };
}

export function ProfileForm({ user, currentSessionUser }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [profileImage, setProfileImage] = useState<string | null>(
    user.profile?.profileImage || null
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const isAdmin = currentSessionUser.role === "ADMIN";

  // React Hook Form initialization
  const form = useForm({
    resolver: zodResolver(isAdmin ? AdminUpdateProfileSchema : EmployeeUpdateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeId: user.employeeId,
      phone: user.profile?.phone || "",
      address: user.profile?.address || "",
      department: user.profile?.department || "",
      designation: user.profile?.designation || "",
      joiningDate: user.profile?.joiningDate
        ? new Date(user.profile.joiningDate).toISOString().split("T")[0]
        : "",
      profileImage: user.profile?.profileImage || "",
    },
  });

  // Handle Form Submission
  const onSubmit = async (values: Record<string, string | null>) => {
    // Inject current profile image state
    const submitData = {
      ...values,
      profileImage,
    };

    startTransition(async () => {
      const res = await updateProfileAction(user.id, submitData);
      if (res.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    });
  };

  // Image Upload / Replace
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("Uploading photo...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "profile");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const { fileUrl } = await res.json();

      // Direct update for UI and DB
      const saveRes = await updateProfileAction(user.id, {
        ...(isAdmin
          ? form.getValues()
          : { phone: form.getValues().phone, address: form.getValues().address }),
        profileImage: fileUrl,
      });

      if (saveRes.success) {
        setProfileImage(fileUrl);
        form.setValue("profileImage", fileUrl);
        toast.success("Profile picture updated!", { id: toastId });
      } else {
        throw new Error(saveRes.error || "Failed to save profile picture reference");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to upload image";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Image Delete
  const handleImageDelete = async () => {
    if (!profileImage) return;

    const confirmDelete = window.confirm("Delete your profile picture?");
    if (!confirmDelete) return;

    const toastId = toast.loading("Deleting photo...");
    try {
      const res = await deleteProfileImageAction(user.id);
      if (res.success) {
        setProfileImage(null);
        form.setValue("profileImage", "");
        toast.success("Profile picture deleted", { id: toastId });
      } else {
        throw new Error(res.error || "Delete failed");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to delete profile picture";
      toast.error(errMsg, { id: toastId });
    }
  };

  const latestPayroll = user.payrolls?.[0];
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        {/* Glow decoration */}
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--accent)] opacity-[0.05] blur-[80px]" />

        <div className="relative flex flex-col md:flex-row items-center gap-6 z-10 text-center md:text-left">
          {/* Avatar Container */}
          <div className="relative group">
            <Avatar
              src={profileImage || undefined}
              fallback={initials}
              size="2xl"
              className="h-24 w-24 border-4 border-[var(--border)] shadow-md"
            />
            {isUploadingImage && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
            {/* Upload/delete overlay controls */}
            <div className="absolute -bottom-1 -right-1 flex gap-1.5">
              <label className="h-8 w-8 rounded-full bg-[var(--accent)] border-2 border-[var(--surface)] flex items-center justify-center text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-all shadow-sm">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                />
                <Upload className="h-3.5 w-3.5" />
              </label>
              {profileImage && (
                <button
                  type="button"
                  onClick={handleImageDelete}
                  className="h-8 w-8 rounded-full bg-[var(--danger)] border-2 border-[var(--surface)] flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {user.firstName} {user.lastName}
              </h2>
              <Badge variant={user.role === "ADMIN" ? "primary" : "default"} className="w-fit self-center">
                {user.role}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              {user.profile?.designation || "No Designation Set"}
            </p>
            <p className="text-xs text-[var(--text-muted)] flex items-center justify-center md:justify-start gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {user.profile?.department || "No Department"}
            </p>
          </div>

          <div className="shrink-0">
            {!isEditing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-1.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={isPending}>
                  <Save className="h-4 w-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal & Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-[var(--border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[var(--accent)]" /> Personal Information
              </CardTitle>
              <CardDescription>
                Overview of personal identifiers and contact coordinates.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...form.register("firstName")}
                error={form.formState.errors.firstName?.message}
                disabled={!isEditing || !isAdmin}
              />
              <Input
                label="Last Name"
                {...form.register("lastName")}
                error={form.formState.errors.lastName?.message}
                disabled={!isEditing || !isAdmin}
              />
              <Input
                label="Employee ID"
                {...form.register("employeeId")}
                error={form.formState.errors.employeeId?.message}
                disabled={!isEditing || !isAdmin}
              />
              <Input
                label="Email Address"
                {...form.register("email")}
                error={form.formState.errors.email?.message}
                disabled={!isEditing || !isAdmin}
              />
              <Input
                label="Phone Number"
                leftIcon={<Phone className="h-4 w-4" />}
                {...form.register("phone")}
                error={form.formState.errors.phone?.message}
                disabled={!isEditing}
              />
              <div className="md:col-span-2">
                <Input
                  label="Current Address"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  {...form.register("address")}
                  error={form.formState.errors.address?.message}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card className="glass border-[var(--border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[var(--accent)]" /> Employment Information
              </CardTitle>
              <CardDescription>
                Enterprise role settings, structures, and keys.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Department"
                {...form.register("department")}
                disabled={!isEditing || !isAdmin}
              />
              <Input
                label="Designation"
                {...form.register("designation")}
                disabled={!isEditing || !isAdmin}
              />
              <Input
                label="Joining Date"
                type="date"
                leftIcon={<Calendar className="h-4 w-4" />}
                {...form.register("joiningDate")}
                disabled={!isEditing || !isAdmin}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Employment Status
                </label>
                <div className="h-10 px-3.5 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center text-sm font-semibold text-[var(--success)] select-none">
                  Active
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salary Summary (Read-Only Side Card) */}
        <div>
          <Card className="glass border-[var(--border)] h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[var(--accent)]" /> Salary Summary
              </CardTitle>
              <CardDescription>
                Corporate salary summary details (Read-only).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestPayroll ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-sm text-[var(--text-secondary)]">Basic Salary</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      ₹{latestPayroll.basicSalary.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                    <span className="text-sm text-[var(--text-secondary)]">Allowances</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      +₹{latestPayroll.allowances.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-[var(--accent-subtle)] px-3 rounded-[var(--radius-lg)] mt-4">
                    <span className="text-sm font-bold text-[var(--accent)] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Net Salary
                    </span>
                    <span className="font-bold text-[var(--accent)] text-lg">
                      ₹{latestPayroll.netSalary.toLocaleString("en-IN")}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-[var(--surface-raised)] rounded-[var(--radius-lg)] border border-dashed border-[var(--border)]">
                  <Info className="h-6 w-6 text-[var(--text-muted)] mb-2" />
                  <p className="text-xs text-[var(--text-secondary)] font-semibold">
                    No Payroll Record
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] px-4 mt-1">
                    Payroll slips have not been generated for this employee yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Save Bar when editing */}
      {isEditing && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 lg:left-80 z-40 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-xl)] flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] font-medium">
            <Lock className="h-4 w-4 text-[var(--accent)]" /> Unsaved changes in profile
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                form.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isPending}>
              <Save className="h-4 w-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        </motion.div>
      )}
    </form>
  );
}

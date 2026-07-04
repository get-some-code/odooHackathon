import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    employeeId: z
      .string()
      .min(2, "Employee ID must be at least 2 characters")
      .trim(),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .trim(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .trim(),
    email: z
      .string()
      .email("Invalid email address")
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const EmployeeUpdateProfileSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required").optional().nullable(),
  address: z.string().trim().min(1, "Address is required").optional().nullable(),
  profileImage: z.string().optional().nullable(),
});

export type EmployeeUpdateProfileInput = z.infer<typeof EmployeeUpdateProfileSchema>;

export const AdminUpdateProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").trim(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  employeeId: z.string().min(2, "Employee ID must be at least 2 characters").trim(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  designation: z.string().trim().optional().nullable(),
  joiningDate: z.string().or(z.date()).optional().nullable(),
  profileImage: z.string().optional().nullable(),
});

export type AdminUpdateProfileInput = z.infer<typeof AdminUpdateProfileSchema>;

export const ApplyLeaveSchema = z.object({
  leaveType: z.enum(["PAID", "SICK", "UNPAID"], {
    errorMap: () => ({ message: "Please select a valid leave type" }),
  }),
  startDate: z.string().or(z.date()).refine((val) => val !== "", "Start date is required"),
  endDate: z.string().or(z.date()).refine((val) => val !== "", "End date is required"),
  halfDay: z.boolean().default(false),
  reason: z.string().min(5, "Reason must be at least 5 characters long").trim(),
  fileUrl: z.string().optional().nullable(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

export type ApplyLeaveInput = z.infer<typeof ApplyLeaveSchema>;

export const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;



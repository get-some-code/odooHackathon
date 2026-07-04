"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { signJWT, getSession } from "@/lib/auth";
import {
  LoginSchema,
  RegisterSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validators";
import { sendOtpEmail } from "@/lib/mail";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Register Server Action
 */
export async function registerAction(
  input: RegisterInput
): Promise<ActionResponse> {
  try {
    // 1. Validate inputs
    const validated = RegisterSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const { employeeId, email, password, firstName, lastName } = validated.data;

    // 2. Check for unique constraints (Email and Employee ID)
    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      return {
        success: false,
        error: "An account with this email address already exists",
      };
    }

    const existingUserByEmpId = await db.user.findUnique({
      where: { employeeId },
    });
    if (existingUserByEmpId) {
      return {
        success: false,
        error: "An account with this Employee ID already exists",
      };
    }

    // 3. Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create User and linked EmployeeProfile in a transaction
    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          employeeId,
          email,
          password: passwordHash,
          firstName,
          lastName,
          role: "EMPLOYEE", // Default registration role
          isVerified: false, // E-mail verification is placeholder
        },
      });

      await tx.employeeProfile.create({
        data: {
          userId: user.id,
        },
      });

      return user;
    });

    // 5. Generate session token
    const token = await signJWT({
      id: newUser.id,
      employeeId: newUser.employeeId,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    });

    // 6. Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Request OTP Action (Step 1 of Login)
 */
export async function requestLoginOtpAction(
  input: LoginInput,
  portalRole: "ADMIN" | "EMPLOYEE"
): Promise<ActionResponse<{ otpSent: boolean }>> {
  try {
    // 1. Validate credentials
    const validated = LoginSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Invalid credentials format" };
    }

    const { email, password } = validated.data;

    // 2. Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // 4. Verify user role matches target login portal
    if (portalRole === "ADMIN" && user.role !== "ADMIN") {
      return { success: false, error: "Access denied. Admin portal is restricted." };
    }
    if (portalRole === "EMPLOYEE" && user.role === "ADMIN") {
      return { success: false, error: "This account has Admin privileges. Use Admin portal." };
    }

    // 5. Generate JWT token directly (bypassing OTP)
    const token = await signJWT({
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

    // 6. Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return { success: true, data: { otpSent: false } };
  } catch (error) {
    console.error("Direct login error:", error);
    return { success: false, error: "Failed to process request. Please try again." };
  }
}

/**
 * Verify OTP Action (Step 2 of Login)
 */
export async function verifyLoginOtpAction(
  email: string,
  otp: string
): Promise<ActionResponse<{ role: string }>> {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return { success: false, error: "Session expired. Please request a new OTP." };
    }

    // Check expiration
    if (new Date() > user.otpExpiresAt) {
      return { success: false, error: "OTP has expired. Please request a new OTP." };
    }

    // Match code
    if (user.otpCode !== otp) {
      return { success: false, error: "Incorrect OTP code. Please try again." };
    }

    // Clear OTP fields in DB
    await db.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    // Generate JWT token
    const token = await signJWT({
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return { success: true, data: { role: user.role } };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return { success: false, error: "Failed to verify OTP. Please try again." };
  }
}

/**
 * Logout Server Action
 */
export async function logoutAction(): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during logout.",
    };
  }
}

export async function updatePasswordAction(password: string): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const hash = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { id: session.id },
      data: { password: hash },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to update password." };
  }
}

export async function getCurrentUserAction() {
  try {
    const session = await getSession();
    return { success: true, data: session };
  } catch {
    return { success: false, error: "Failed to load session" };
  }
}

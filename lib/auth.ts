import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  return new TextEncoder().encode(secret);
};

export interface AuthUserPayload {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Encrypts a payload into a signed JWT token.
 */
export async function signJWT(payload: AuthUserPayload): Promise<string> {
  const secretKey = getSecret();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Token valid for 7 days
    .sign(secretKey);
}

/**
 * Verifies a JWT token and returns the payload or null if invalid.
 */
export async function verifyJWT(token: string): Promise<AuthUserPayload | null> {
  try {
    const secretKey = getSecret();
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as AuthUserPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current authenticated user session from secure cookies.
 * Compatible with Next.js 15 async cookies API.
 */
export async function getSession(): Promise<AuthUserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

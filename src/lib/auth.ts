// src/lib/auth.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-1234567890";

/**
 * Generates a standard JWT token containing the user's ID and role
 */
export function signToken(userId: number, roleSlug: string) {
  return jwt.sign(
    {
      sub: userId.toString(),
      role: roleSlug,
    },
    JWT_SECRET,
    { expiresIn: "9h" }
  );
}

import { cookies } from "next/headers";

/**
 * Synchronously verifies a JWT token
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
  } catch (error) {
    return null;
  }
}

/**
 * Gets the current user session payload from cookies
 */
export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Checks if the current user has admin privileges (admin or super-admin)
 */
export async function isAdmin() {
  const session = await getServerSession();
  if (!session) return false;
  return session.role === "admin" || session.role === "super-admin";
}

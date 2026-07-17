"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server Action: Borra la cookie auth_token y redirige a /login
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

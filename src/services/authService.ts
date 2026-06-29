import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/config/firebase";

// Send Firebase password reset email
// Firebase will throw error if email not registered
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e: any) {
    if (e?.code === "auth/user-not-found") {
      throw new Error("No account found with this email address.");
    }
    throw e;
  }
}
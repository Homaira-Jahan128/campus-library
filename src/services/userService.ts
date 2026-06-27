import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { AppUser, UserRole, UserStatus } from "@/types";

const col = collection(db, "users");

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(col, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => d.data() as AppUser);
}

export async function getPendingLibrarians(): Promise<AppUser[]> {
  const snap = await getDocs(
    query(
      col,
      where("role", "==", "librarian"),
      where("status", "==", "pending")
    )
  );
  return snap.docs.map((d) => d.data() as AppUser);
}

export async function setUserStatus(
  uid: string,
  status: UserStatus
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { status });
}

export function filterUsers(
  users: AppUser[],
  searchText: string,
  role?: UserRole | "all"
): AppUser[] {
  const text = searchText.trim().toLowerCase();
  return users.filter((u) => {
    const roleMatch = !role || role === "all" || u.role === role;
    if (!roleMatch) return false;
    if (!text) return true;
    return (
      u.name.toLowerCase().includes(text) ||
      u.email.toLowerCase().includes(text)
    );
  });
}
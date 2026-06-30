import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { RenewalRequest, RenewalStatus } from "@/types";

const col = collection(db, "renewalRequests");

// Student — submit renewal request
export async function submitRenewalRequest(input: {
  loanId: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  userRoll?: string;
  userDepartment?: string;
  libraryId: string;
  libraryName: string;
  currentDueDate: number;
  requestedDays: number;
}): Promise<void> {
  // Check if there's already a pending renewal for this loan
  const existing = await getDocs(
    query(
      col,
      where("loanId", "==", input.loanId),
      where("status", "==", "pending")
    )
  );
  if (!existing.empty) {
    throw new Error("A renewal request for this book is already pending.");
  }
  await addDoc(col, {
    ...input,
    status: "pending" as RenewalStatus,
    requestedAt: Date.now(),
  });
}

// Librarian — get all renewals for their library
export async function getRenewalsByLibrary(
  libraryId: string
): Promise<RenewalRequest[]> {
  const snap = await getDocs(
    query(
      col,
      where("libraryId", "==", libraryId),
      orderBy("requestedAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RenewalRequest));
}

// Student — get their own renewals
export async function getRenewalsByUser(
  userId: string
): Promise<RenewalRequest[]> {
  const snap = await getDocs(
    query(col, where("userId", "==", userId), orderBy("requestedAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RenewalRequest));
}

// Librarian — approve renewal (extends due date)
export async function approveRenewal(
  renewalId: string,
  loanId: string,
  currentDueDate: number,
  requestedDays: number
): Promise<number> {
  const newDueDate =
    currentDueDate + requestedDays * 24 * 60 * 60 * 1000;

  // Update the loan's due date
  await updateDoc(doc(db, "loans", loanId), {
    dueDate: newDueDate,
    fine: 0, // reset fine since due date extended
  });

  // Mark renewal as approved
  await updateDoc(doc(db, "renewalRequests", renewalId), {
    status: "approved" as RenewalStatus,
    reviewedAt: Date.now(),
    newDueDate,
  });

  return newDueDate;
}

// Librarian — reject renewal
export async function rejectRenewal(renewalId: string): Promise<void> {
  await updateDoc(doc(db, "renewalRequests", renewalId), {
    status: "rejected" as RenewalStatus,
    reviewedAt: Date.now(),
  });
}

// Check if a loan has a pending renewal
export async function hasPendingRenewal(loanId: string): Promise<boolean> {
  const snap = await getDocs(
    query(
      col,
      where("loanId", "==", loanId),
      where("status", "==", "pending")
    )
  );
  return !snap.empty;
}
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
import { LoanRequest, RequestStatus } from "@/types";

const col = collection(db, "loanRequests");

export async function submitLoanRequest(input: {
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  userRoll?: string;
  userDepartment?: string;
  libraryId: string;
  libraryName: string;
  loanDurationDays: number;
}): Promise<string> {
  const ref = await addDoc(col, {
    ...input,
    status: "pending" as RequestStatus,
    requestedAt: Date.now(),
  });
  return ref.id;
}

export async function getRequestsByLibrary(
  libraryId: string
): Promise<LoanRequest[]> {
  const snap = await getDocs(
    query(
      col,
      where("libraryId", "==", libraryId),
      orderBy("requestedAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LoanRequest));
}

export async function getRequestsByUser(
  userId: string
): Promise<LoanRequest[]> {
  const snap = await getDocs(
    query(
      col,
      where("userId", "==", userId),
      orderBy("requestedAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LoanRequest));
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  extra?: Record<string, any>
): Promise<void> {
  await updateDoc(doc(db, "loanRequests", id), {
    status,
    reviewedAt: Date.now(),
    ...extra,
  });
}

/** Check and expire requests that were approved but not collected within 24 hours */
export async function expireUncollectedRequests(): Promise<void> {
  const snap = await getDocs(
    query(col, where("status", "==", "approved_pending_collection"))
  );
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const d of snap.docs) {
    const req = { id: d.id, ...d.data() } as LoanRequest;
    const approvedAt = req.approvedAt ?? req.reviewedAt ?? 0;
    if (now - approvedAt > oneDayMs) {
      await updateDoc(doc(db, "loanRequests", d.id), {
        status: "expired",
      });
    }
  }
}
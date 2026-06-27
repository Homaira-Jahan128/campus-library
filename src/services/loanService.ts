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
import { Loan } from "@/types";
import { calculateFine } from "@/utils/fines";

const col = collection(db, "loans");

export async function createLoan(input: {
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
  const borrowedAt = Date.now();
  const dueDate = borrowedAt + input.loanDurationDays * 24 * 60 * 60 * 1000;
  const ref = await addDoc(col, {
    ...input,
    borrowedAt,
    dueDate,
    status: "active",
    fine: 0,
  });
  return ref.id;
}

export async function getLoansByUser(userId: string): Promise<Loan[]> {
  const snap = await getDocs(
    query(col, where("userId", "==", userId), orderBy("borrowedAt", "desc"))
  );
  return snap.docs.map((d) => {
    const loan = { id: d.id, ...d.data() } as Loan;
    if (loan.status === "active") loan.fine = calculateFine(loan.dueDate);
    return loan;
  });
}

export async function getLoansByLibrary(libraryId: string): Promise<Loan[]> {
  const snap = await getDocs(
    query(
      col,
      where("libraryId", "==", libraryId),
      orderBy("borrowedAt", "desc")
    )
  );
  return snap.docs.map((d) => {
    const loan = { id: d.id, ...d.data() } as Loan;
    if (loan.status === "active") loan.fine = calculateFine(loan.dueDate);
    return loan;
  });
}

export async function getAllLoans(): Promise<Loan[]> {
  const snap = await getDocs(col);
  return snap.docs.map((d) => {
    const loan = { id: d.id, ...d.data() } as Loan;
    if (loan.status === "active") loan.fine = calculateFine(loan.dueDate);
    return loan;
  });
}

export async function returnLoan(
  id: string,
  dueDate: number
): Promise<number> {
  const fine = calculateFine(dueDate);
  await updateDoc(doc(db, "loans", id), {
    status: "returned",
    returnedAt: Date.now(),
    fine,
  });
  return fine;
}
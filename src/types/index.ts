export type UserRole = "student" | "librarian" | "admin";

export type UserStatus = "active" | "pending" | "disabled";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  rollNumber?: string;
  session?: string;
  libraryId?: string;
  libraryName?: string;
  createdAt: number;
}

export type LibraryType = "central" | "department";

export interface Library {
  id: string;
  name: string;
  type: LibraryType;
  department?: string;
  faculty?: string;
}

export type ItemType = "book" | "paper";

export interface BookItem {
  id: string;
  title: string;
  author: string;
  type: ItemType;
  description: string;
  tags: string[];
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  libraryId: string;
  libraryName: string;
  department?: string;
  createdAt: number;
}

export type RequestStatus = 
  | "pending" 
  | "approved_pending_collection"  // approved কিন্তু এখনো collect করেনি
  | "collected"                     // student collect করেছে = active loan
  | "rejected"
  | "expired";                      // 1 দিনে collect না করলে

export interface LoanRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  userRoll?: string;        // যোগ করো
  userDepartment?: string;  // যোগ করো
  libraryId: string;
  libraryName: string;
  loanDurationDays: number;
  status: RequestStatus;
  requestedAt: number;
  reviewedAt?: number;
  approvedAt?: number;
  collectionDeadline?: number;
  collectedAt?: number;
}

export type LoanStatus = "active" | "returned";

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  userRoll?: string;        // যোগ করো
  userDepartment?: string;  // যোগ করো
  libraryId: string;
  libraryName: string;
  borrowedAt: number;
  dueDate: number;
  returnedAt?: number;
  status: LoanStatus;
  fine: number;
}

export type NotificationType =
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "book_returned"
  | "due_reminder"
  | "overdue_reminder"
  | "librarian_approved"
  | "librarian_rejected";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: number;
}

export const FINE_PER_DAY = 5;
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { BookItem, ItemType } from "@/types";

const booksCol = collection(db, "books");

export async function getAllBooks(): Promise<BookItem[]> {
  const snap = await getDocs(booksCol);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookItem));
}

export async function getBooksByLibrary(libraryId: string): Promise<BookItem[]> {
  const snap = await getDocs(
    query(booksCol, where("libraryId", "==", libraryId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookItem));
}

export async function getBookById(id: string): Promise<BookItem | null> {
  const snap = await getDoc(doc(db, "books", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as BookItem) : null;
}

export async function getCopiesByTitle(title: string): Promise<BookItem[]> {
  const snap = await getDocs(query(booksCol, where("title", "==", title)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookItem));
}

export async function addBook(input: {
  title: string;
  author: string;
  type: ItemType;
  description: string;
  tags: string[];
  shelfLocation: string;
  totalCopies: number;
  libraryId: string;
  libraryName: string;
  department?: string;
}): Promise<string> {
  const ref = await addDoc(booksCol, {
    ...input,
    availableCopies: input.totalCopies,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateBook(
  id: string,
  data: Partial<Omit<BookItem, "id" | "libraryId" | "libraryName">>
): Promise<void> {
  await updateDoc(doc(db, "books", id), data as any);
}

export async function deleteBook(id: string): Promise<void> {
  await deleteDoc(doc(db, "books", id));
}

export async function adjustAvailableCopies(
  id: string,
  delta: number
): Promise<void> {
  const book = await getBookById(id);
  if (!book) throw new Error("Book not found");
  const next = Math.max(
    0,
    Math.min(book.totalCopies, book.availableCopies + delta)
  );
  await updateDoc(doc(db, "books", id), { availableCopies: next });
}

export function filterBooks(
  books: BookItem[],
  searchText: string,
  type?: ItemType | "all"
): BookItem[] {
  const text = searchText.trim().toLowerCase();
  
  return books
    .filter((b) => {
      const typeMatch = !type || type === "all" || b.type === type;
      if (!typeMatch) return false;
      if (!text) return true;

      // Score-based matching: title match weighs more than author/tag
      const titleMatch = b.title.toLowerCase().includes(text);
      const authorMatch = b.author.toLowerCase().includes(text);
      const tagMatch = b.tags.some((t) => t.toLowerCase().includes(text));
      const libraryMatch = b.libraryName.toLowerCase().includes(text);
      const descMatch = b.description?.toLowerCase().includes(text) ?? false;

      return titleMatch || authorMatch || tagMatch || libraryMatch || descMatch;
    })
    .sort((a, b) => {
      if (!text) return 0;
      // Exact title match first
      const aExact = a.title.toLowerCase() === text ? 3 : 0;
      const bExact = b.title.toLowerCase() === text ? 3 : 0;
      // Title starts with query second
      const aStarts = a.title.toLowerCase().startsWith(text) ? 2 : 0;
      const bStarts = b.title.toLowerCase().startsWith(text) ? 2 : 0;
      // Title contains query third
      const aContains = a.title.toLowerCase().includes(text) ? 1 : 0;
      const bContains = b.title.toLowerCase().includes(text) ? 1 : 0;

      const scoreA = aExact + aStarts + aContains;
      const scoreB = bExact + bStarts + bContains;
      return scoreB - scoreA;
    });
}
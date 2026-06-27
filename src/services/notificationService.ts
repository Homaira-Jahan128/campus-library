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
import { AppNotification, NotificationType } from "@/types";

const col = collection(db, "notifications");

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType
): Promise<void> {
  await addDoc(col, {
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: Date.now(),
  });
}

export async function getNotificationsForUser(
  userId: string
): Promise<AppNotification[]> {
  const snap = await getDocs(
    query(col, where("userId", "==", userId), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), { read: true });
}
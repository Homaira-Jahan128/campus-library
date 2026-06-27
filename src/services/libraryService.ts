import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Library } from "@/types";

export async function getAllLibraries(): Promise<Library[]> {
  const snap = await getDocs(
    query(collection(db, "libraries"), orderBy("name"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Library));
}
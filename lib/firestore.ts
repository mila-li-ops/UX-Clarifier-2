import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface SavedAnalysis {
  id: string;
  title: string;
  createdAt: Date;
  result: any;
}

export async function saveAnalysis(userId: string, title: string, result: any): Promise<void> {
  await addDoc(collection(db, 'users', userId, 'analyses'), {
    title,
    result,
    createdAt: serverTimestamp(),
  });
}

export async function deleteAnalysis(userId: string, analysisId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'analyses', analysisId));
}

export async function getAnalyses(userId: string): Promise<SavedAnalysis[]> {
  const q = query(
    collection(db, 'users', userId, 'analyses'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title,
    createdAt: doc.data().createdAt?.toDate() ?? new Date(),
    result: doc.data().result,
  }));
}

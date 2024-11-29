import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface FeedbackData {
  uid: string;
  email: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

export async function addFeedback(data: FeedbackData) {
  try {
    const feedbackRef = collection(db, 'feedback');
    await addDoc(feedbackRef, data);
  } catch (error) {
    console.error('Error adding feedback:', error);
    throw error;
  }
} 
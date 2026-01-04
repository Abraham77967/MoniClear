import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { AppData } from '../types';

export class FirestoreService {
  private static instance: FirestoreService;
  private unsubscribeFunctions: Map<string, Unsubscribe> = new Map();

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // Get user document reference
  private getUserDocRef(userId: string) {
    return doc(db, 'users', userId, 'financialData', 'main');
  }

  // Initialize user data with default values
  async initializeUserData(userId: string): Promise<AppData> {
    const defaultData: AppData = {
      weeklyEstimate: 0,
      incomeHistory: [],
      bills: [],
      wishlist: [],
      expenses: []
    };

    const userDocRef = this.getUserDocRef(userId);
    await setDoc(userDocRef, defaultData, { merge: true });

    return defaultData;
  }

  // Get user data
  async getUserData(userId: string): Promise<AppData | null> {
    try {
      const userDocRef = this.getUserDocRef(userId);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        return docSnap.data() as AppData;
      } else {
        // Initialize new user data
        return await this.initializeUserData(userId);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Save user data
  async saveUserData(userId: string, data: AppData): Promise<boolean> {
    try {
      const userDocRef = this.getUserDocRef(userId);
      await setDoc(userDocRef, data);
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  // Update specific field in user data
  async updateUserData(userId: string, updates: Partial<AppData>): Promise<boolean> {
    try {
      const userDocRef = this.getUserDocRef(userId);
      await updateDoc(userDocRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  }

  // Listen for real-time updates
  listenForUserData(userId: string, callback: (data: AppData | null) => void): string {
    const userDocRef = this.getUserDocRef(userId);
    const listenerId = `user-${userId}`;

    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as AppData);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening for user data:', error);
      callback(null);
    });

    this.unsubscribeFunctions.set(listenerId, unsubscribe);
    return listenerId;
  }

  // Stop listening for updates
  stopListening(listenerId: string): void {
    const unsubscribe = this.unsubscribeFunctions.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeFunctions.delete(listenerId);
    }
  }

  // Migrate data from localStorage to Firestore
  async migrateLocalDataToFirestore(userId: string): Promise<boolean> {
    try {
      const localData = localStorage.getItem('wealthway_data_v2');
      if (!localData) return true; // No local data to migrate

      const parsedData: AppData = JSON.parse(localData);

      // Check if user already has data in Firestore
      const existingData = await this.getUserData(userId);
      if (existingData && (
        existingData.bills.length > 0 ||
        existingData.expenses.length > 0 ||
        existingData.wishlist.length > 0 ||
        existingData.incomeHistory.length > 0
      )) {
        // User already has data, don't overwrite
        return true;
      }

      // Save local data to Firestore
      await this.saveUserData(userId, parsedData);

      // Clear local data after successful migration
      localStorage.removeItem('wealthway_data_v2');

      return true;
    } catch (error) {
      console.error('Error migrating local data:', error);
      return false;
    }
  }

  // Clean up all listeners
  cleanup(): void {
    this.unsubscribeFunctions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeFunctions.clear();
  }
}

// Export singleton instance
export const firestoreService = FirestoreService.getInstance();


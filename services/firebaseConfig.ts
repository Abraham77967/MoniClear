import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZ6ujwuGX69N_JznmkkaebZzvHrGuMeaI",
  authDomain: "moniclear-ece27.firebaseapp.com",
  projectId: "moniclear-ece27",
  storageBucket: "moniclear-ece27.firebasestorage.app",
  messagingSenderId: "828363438998",
  appId: "1:828363438998:web:cca31f4d919bc0fcfebbb7",
  measurementId: "G-DF7E4SN5VX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();

export default app;
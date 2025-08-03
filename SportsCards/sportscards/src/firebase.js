// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2sP0FNaZmrz68_acOvFkb6H22UxAT4Xc",
  authDomain: "sportscards-5b469.firebaseapp.com",
  projectId: "sportscards-5b469",
  storageBucket: "sportscards-5b469.firebasestorage.app",
  messagingSenderId: "821627721273",
  appId: "1:821627721273:web:f99a665fd0ca95eb7cdfe8",
  measurementId: "G-DVH4JCJJ99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
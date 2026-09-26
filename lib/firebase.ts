import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9T2Y7qeqZa_f35QNkeIFOP3aWOa9_BlQ",
  authDomain: "nutkipaulinki.firebaseapp.com",
  projectId: "nutkipaulinki",
  storageBucket: "nutkipaulinki.firebasestorage.app",
  messagingSenderId: "908738870554",
  appId: "1:908738870554:web:d7e86f8daaf480d0e540a3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
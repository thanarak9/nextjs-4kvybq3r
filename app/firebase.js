import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDTTW6yKBxILNA99Fy7W8Fy_ze0CTVT68",
  authDomain: "nakornthon-pharmacy.firebaseapp.com",
  projectId: "nakornthon-pharmacy",
  storageBucket: "nakornthon-pharmacy.firebasestorage.app",
  messagingSenderId: "642905360958",
  appId: "1:642905360958:web:3d4375979a424f56489f6f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
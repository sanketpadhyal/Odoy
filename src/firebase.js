import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWgMWixt_kUA6hh4Fy0JCf8ZXkIYckzm4",
  authDomain: "odoypvt.firebaseapp.com",
  projectId: "odoypvt",
  storageBucket: "odoypvt.firebasestorage.app",
  messagingSenderId: "672701293840",
  appId: "1:672701293840:web:0dcf79f214510469d9b195"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
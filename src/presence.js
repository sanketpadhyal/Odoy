import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

let inactivityTimer = null;

export function initPresence() {
  auth.onAuthStateChanged((user) => {
    if (!user) return;

    setOnline(user.email);

    window.addEventListener("beforeunload", () => {
      setOffline(user.email);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        setOffline(user.email);
      } else {
        setOnline(user.email);
      }
    });

    resetInactivity(user.email);
    window.addEventListener("mousemove", () => resetInactivity(user.email));
    window.addEventListener("keydown", () => resetInactivity(user.email));
    window.addEventListener("touchstart", () => resetInactivity(user.email));
  });
}

function resetInactivity(email) {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    setOffline(email);
  }, 12000);
}

export function setOnline(email) {
  return setDoc(
    doc(db, "presence", email),
    {
      state: "online",
      typing: false
    },
    { merge: true }
  );
}

export function setOffline(email) {
  return setDoc(
    doc(db, "presence", email),
    {
      state: "offline",
      typing: false,
      lastChanged: serverTimestamp(),
      activeChat: null
    },
    { merge: true }
  );
}

export function setActiveChat(email, chatId) {
  return setDoc(
    doc(db, "presence", email),
    { activeChat: chatId },
    { merge: true }
  );
}

export function clearActiveChat(email) {
  return setDoc(
    doc(db, "presence", email),
    { activeChat: null },
    { merge: true }
  );
}

import "./ChatRoom.css";
import { FiArrowLeft, FiMoreVertical, FiSend, FiCamera } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { setActiveChat, clearActiveChat } from "../presence";
import heic2any from "heic2any";

function formatTime(ts) {
  const d = new Date(ts);
  const h = ((d.getHours() + 11) % 12) + 1;
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${ampm}`;
}

function formatDay(ts) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  const same = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
  if (same(d, today)) return "Today";
  if (same(d, y)) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function usernameToEmail(username) {
  const s = await getDoc(doc(db, "usernames", username));
  return s.exists() ? s.data().email : null;
}

export default function ChatRoom() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const friendUsername = params.get("user");

  const [friendEmail, setFriendEmail] = useState(null);
  const [myEmail, setMyEmail] = useState(null);

  const [myPrivacy, setMyPrivacy] = useState({
    hideProfile: false,
    hideName: false,
    lastSeenOff: false,
    readReceiptsOff: false,
  });

  const [friendPrivacy, setFriendPrivacy] = useState({
    hideProfile: false,
    hideName: false,
    lastSeenOff: false,
  });

  const chatId =
    myEmail && friendEmail ? [myEmail, friendEmail].sort().join("_") : null;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const [profilePic, setProfilePic] = useState("/logo/profile.png");
  const [fullName, setFullName] = useState(friendUsername || "Unknown");

  const [lastSeenText, setLastSeenText] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clearPopup, setClearPopup] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  let typingTimeout = null;

  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => document.body.classList.remove("hide-navbar");
  }, []);

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user || !friendUsername) return;
      setMyEmail(user.email);
      setFriendEmail(await usernameToEmail(friendUsername));
    })();
  }, [friendUsername]);

  useEffect(() => {
    if (!myEmail) return;
    const unsub = onSnapshot(doc(db, "users", myEmail), (s) => {
      if (!s.exists()) return;
      const u = s.data();
      setMyPrivacy({
        hideProfile: u.hideProfile || false,
        hideName: u.hideName || false,
        lastSeenOff: u.lastSeenOff || false,
        readReceiptsOff: u.readReceiptsOff || false,
      });
    });
    return () => unsub();
  }, [myEmail]);

  useEffect(() => {
    if (!friendEmail) return;
    const unsub = onSnapshot(doc(db, "users", friendEmail), (s) => {
      if (!s.exists()) return;
      const u = s.data();
      setFriendPrivacy({
        hideProfile: u.hideProfile || false,
        hideName: u.hideName || false,
        lastSeenOff: u.lastSeenOff || false,
      });
      setProfilePic(u.hideProfile ? "/logo/profile.png" : u.photo || "/logo/profile.png");
      setFullName(u.hideName ? "Hidden User" : u.name || friendUsername);
    });
    return () => unsub();
  }, [friendEmail, friendUsername]);

  useEffect(() => {
    if (!myEmail || !chatId) return;
    setActiveChat(myEmail, chatId);
    return () => clearActiveChat(myEmail);
  }, [myEmail, chatId]);

  useEffect(() => {
    if (!friendEmail) return;
    const unsub = onSnapshot(doc(db, "presence", friendEmail), (s) => {
      if (!s.exists()) return;
      const { state, lastChanged, typing, activeChat } = s.data();
      if (friendPrivacy.lastSeenOff) {
        setLastSeenText("last seen recently");
        return;
      }
      if (typing) {
        setLastSeenText("typing…");
      } else if (state === "online") {
        setLastSeenText(activeChat === chatId ? "online • in chat" : "online");
      } else {
        setLastSeenText(
          lastChanged ? `last seen ${formatTime(lastChanged.toMillis())}` : ""
        );
      }
    });
    return () => unsub();
  }, [friendEmail, chatId, friendPrivacy.lastSeenOff]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("ts", "asc"));
    return onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMessages(arr);
      setInitialLoading(false);

      if (!myPrivacy.readReceiptsOff) {
        arr.forEach((m) => {
          if (m.from === friendEmail && !m.seenBy) {
            updateDoc(doc(db, "chats", chatId, "messages", m.id), {
              seenBy: myEmail,
            });
          }
        });
      }

      setTimeout(() => {
        if (scrollRef.current)
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 200;
      }, 50);
    });
  }, [chatId, myEmail, friendEmail, myPrivacy.readReceiptsOff]);

  const onPickImage = async (e) => {
    let file = e.target.files[0];
    if (!file) return;
    if (file.type === "image/heic" || file.type === "image/heif") {
      try {
        const blob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8,
        });
        file = new File([blob], "image.jpg", { type: "image/jpeg" });
      } catch {
        return;
      }
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleTyping = (val) => {
    setMessage(val);
    setDoc(doc(db, "presence", myEmail), { typing: true }, { merge: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setDoc(doc(db, "presence", myEmail), { typing: false }, { merge: true });
    }, 1500);
  };

  const sendMessage = async () => {
    if (!chatId || (!message.trim() && !imagePreview)) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      from: myEmail,
      text: message.trim(),
      image: imagePreview || null,
      ts: Date.now(),
    });
    setMessage("");
    setImagePreview(null);
    setDoc(doc(db, "presence", myEmail), { typing: false }, { merge: true });
  };

  const deleteForEveryone = async () => {
    const snap = await getDocs(collection(db, "chats", chatId, "messages"));
    snap.forEach((d) => deleteDoc(d.ref));
    setClearPopup(false);
  };

  return (
    <section className="chatroom-page">
      <div className="chatroom-topbar animate-topbar">
        <div className="left-all">
          <div className="left-section" onClick={() => navigate(-1)}>
            <FiArrowLeft className="topbar-back-icon" />
          </div>
          <div className="topbar-user">
            <img src={profilePic} className="topbar-photo" />
            <div className="user-txt">
              <h3>{fullName}</h3>
              <div className="topbar-sub">{lastSeenText}</div>
            </div>
          </div>
        </div>
        <FiMoreVertical
          className="topbar-menu-icon"
          onClick={() => setMenuOpen(!menuOpen)}
        />
      </div>

      {menuOpen && (
        <div className="poppup-menu fade-in">
          <div
            className="popup-item"
            onClick={() => navigate(`/profile/${friendUsername}`)}
          >
            View Profile
          </div>
          <div
            className="popup-item danger"
            onClick={() => {
              setMenuOpen(false);
              setClearPopup(true);
            }}
          >
            Delete Messages
          </div>
          <div className="poppup-close" onClick={() => setMenuOpen(false)}>
            Cancel
          </div>
        </div>
      )}

      <div className="chat-body" ref={scrollRef}>
        {initialLoading && (
          <>
            <div className="skeleton-day"></div>
            <div className="skeleton-msg left"></div>
            <div className="skeleton-msg right"></div>
          </>
        )}

        {!initialLoading &&
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showDay = !prev || formatDay(prev.ts) !== formatDay(msg.ts);
            const isMe = msg.from === myEmail;
            return (
  <div key={msg.id}>

    {showDay && (
      <>
        <div className="date-divider">
          <span>{formatDay(msg.ts)}</span>
        </div>
        <br />
      </>
    )}

    <div className={`msg-row ${isMe ? "msg-me" : "msg-them"}`}>
      {!isMe && <img src={profilePic} className="msg-avatar" />}
      <div className={`msg-bubble ${isMe ? "bubble-me" : "bubble-them"}`}>

        {msg.image && (
          <div className="msg-image-wrap">
            <img src={msg.image} className="msg-image" />
          </div>
        )}

        <div className="msg-text">{msg.text}</div>
        <div className="msg-time">{formatTime(msg.ts)}</div>

        {isMe && (
          <div className="msg-status">
            {myPrivacy.readReceiptsOff
              ? "Sent"
              : msg.seenBy === friendEmail
              ? "Seen"
              : "Sent"}
          </div>
        )}

      </div>
    </div>

  </div>
);
          })}
      </div>

      {imagePreview && (
        <div className="chat-preview-bar">
          <div className="chat-preview-inner">
            <img src={imagePreview} className="chat-preview-img" />
            <button
              className="chat-preview-cancel"
              onClick={() => setImagePreview(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="typing-bar">
        <input
          className="t-input"
          placeholder="Message…"
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="image/*"
          onChange={onPickImage}
        />
        <button className="t-btn" onClick={() => fileInputRef.current.click()}>
          <FiCamera />
        </button>
        <button className="t-btn send-btn" onClick={sendMessage}>
          <FiSend />
        </button>
      </div>

      {clearPopup && (
        <div className="clear-popup">
          <h3>Delete messages?</h3>
          <button className="clear-btn everyone" onClick={deleteForEveryone}>
            Delete for everyone
          </button>
          <div className="popup-close" onClick={() => setClearPopup(false)}>
            Cancel
          </div>
        </div>
      )}
    </section>
  );
}

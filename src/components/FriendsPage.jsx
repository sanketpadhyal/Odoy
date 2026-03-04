import "./FriendsPage.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  FiUser,
  FiUserPlus,
  FiUsers,
  FiMessageCircle,
  FiSettings,
  FiLock,
  FiMail,
  FiCpu,
  FiMessageSquare,
  FiDatabase
} from "react-icons/fi";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";


export default function FriendsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockUI, setLockUI] = useState(false);
  const [countdown, setCountdown] = useState(9);

  const authToken = params.get("auth");

  const generateSession = useCallback(() => {
    return (
      "sess_" +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36)
    );
  }, []);

  useEffect(() => {
    if (!authToken) navigate("/home", { replace: true });
  }, [authToken, navigate]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate(`/login?auth=${generateSession()}`, { replace: true });
        return;
      }

      const base = {
        name: user.displayName || "",
        email: user.email,
        username: "",
        photo: "/logo/profile.png",
        developerBadge: false,
      };

      setProfile(base);

      try {
        const ref = doc(db, "users", user.email);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const u = snap.data();
          setProfile((prev) => ({
            ...prev,
            username: u.username || "",
            photo: u.photo || prev.photo,
            developerBadge: u.developerBadge || false,
          }));
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [generateSession, navigate]);

  useEffect(() => {
    if (!loading && profile && !profile.username) {
      setLockUI(true);

      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            navigate(`/profile?auth=${generateSession()}`, {
              replace: true,
            });
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, profile, generateSession, navigate]);

  if (loading) {
    return (
      <section className="friends-page page-animate">
        <div className="basic-skeleton">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      </section>
    );
  }

  return (
    <section className={`friends-page page-animate ${lockUI ? "locked" : ""}`}>
      {lockUI && (
        <div className="username-alert">
          <h3>Username required</h3>
          <p>
            Please set your username to continue.
            Redirecting in <b>{countdown}</b> seconds…
          </p>
        </div>
      )}

      <h1 className="friends-title">
        <span className="title-main">Friends</span>
        <span className="title-sub">Core!</span>
      </h1>

      {profile && (
        <div
          className="friend-header-box"
          style={
            profile.developerBadge
              ? { backgroundImage: "url(/logo/gold.jpg)" }
              : {}
          }
        >
          <img src={profile.photo} className="friend-header-photo" alt="pfp" />
          <div className="friend-header-info">
            <h3>{profile.name}</h3>
            <p className="email-text">{profile.email}</p>
            <p className="username-text">@{profile.username || "username"}</p>
          </div>
        </div>
      )}

      <div className="friends-grid-top">
        <button
          disabled={lockUI}
          className={`friends-btn ${lockUI ? "btn-locked" : ""}`}
          onClick={() =>
            !lockUI &&
            navigate(`/requests?auth=${generateSession()}`)
          }
        >
          <FiMail className="btn-icon" />
          Request Box
          {lockUI && <FiLock className="lock-icon" />}
        </button>

        <button
          disabled={lockUI}
          className={`friends-btn ${lockUI ? "btn-locked" : ""}`}
          onClick={() =>
            !lockUI &&
            navigate(`/ai-chat?auth=${generateSession()}`)
          }
        >
          <FiCpu className="btn-icon" />
          Chat ODOY
          {lockUI && <FiLock className="lock-icon" />}
        </button>
      </div>

      <div className="center-divider"></div>

      <div className="friends-grid">
        <button
          disabled={lockUI}
          className={`friends-btn ${lockUI ? "btn-locked" : ""}`}
          onClick={() =>
            !lockUI &&
            navigate(`/profile?auth=${generateSession()}`)
          }
        >
          <FiUser className="btn-icon" />
          My Profile
          {lockUI && <FiLock className="lock-icon" />}
        </button>

        <button
          disabled={lockUI}
          className={`friends-btn ${lockUI ? "btn-locked" : ""}`}
          onClick={() =>
            !lockUI &&
            navigate(`/add-friends?auth=${generateSession()}`)
          }
        >
          <FiUserPlus className="btn-icon" />
          Add Friends
          {lockUI && <FiLock className="lock-icon" />}
        </button>

        <button
          disabled={lockUI}
          className={`friends-btn ${lockUI ? "btn-locked" : ""}`}
          onClick={() =>
            !lockUI &&
            navigate(`/my-friends?auth=${generateSession()}`)
          }
        >
          <FiUsers className="btn-icon" />
          My Friends
          {lockUI && <FiLock className="lock-icon" />}
        </button>

        <button
          disabled={lockUI}
          className={`friends-btn ${lockUI ? "btn-locked" : ""}`}
          onClick={() =>
            !lockUI &&
            navigate(`/chats?auth=${generateSession()}`)
          }
        >
          <FiMessageCircle className="btn-icon" />
          My Chats
          {lockUI && <FiLock className="lock-icon" />}
        </button>

        <button
          disabled={lockUI}
          className={`friends-btn ${lockUI ? "btn-locked" : ""}`}
          onClick={() =>
            !lockUI &&
            navigate(`/chat-settings?auth=${generateSession()}`, {
              state: { from: '/friends' }
            })
          }
        >
          <FiSettings className="btn-icon" />
          Settings
          {lockUI && <FiLock className="lock-icon" />}
        </button>

        <button
          disabled={lockUI}
          className={`friends-btn ${lockUI ? "btn-locked" : ""}`}
          onClick={() =>
            !lockUI &&
            navigate(`/storage?auth=${generateSession()}`)
          }
        >
          <FiDatabase className="btn-icon" />
          Storage
          {lockUI && <FiLock className="lock-icon" />}
        </button>
      </div>
    </section>
  );
}

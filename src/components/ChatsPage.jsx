import "./ChatsPage.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
} from "firebase/firestore";

import { FiArrowLeft, FiArrowRightCircle, FiStar, FiSettings } from "react-icons/fi";
import { FaStar } from "react-icons/fa";

export default function ChatsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const authToken = params.get("auth");

  const [profile, setProfile] = useState(null);
  const [privacy, setPrivacy] = useState({
    hideProfile: false,
    hideName: false,
  });

  const [friends, setFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [starredFriends, setStarredFriends] = useState([]);
  const [rotatingStar, setRotatingStar] = useState(null);
  const [freezeSort, setFreezeSort] = useState(false);

  const [onlineMap, setOnlineMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(true);

  const generateSession = useCallback(
    () => "sess_" + Math.random().toString(36).substring(2, 12),
    []
  );

  useEffect(() => {
    if (!authToken) navigate("/home", { replace: true });
  }, [authToken, navigate]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate(`/login?auth=${generateSession()}`, { replace: true });
        return;
      }

      const email = user.email;
      localStorage.setItem("myEmail", email);

      await setDoc(
        doc(db, "presence", email),
        { state: "online", lastChanged: serverTimestamp() },
        { merge: true }
      );

      const snap = await getDoc(doc(db, "users", email));
      if (snap.exists()) {
        const u = snap.data();

        setProfile({
          email,
          name: u.name || "",
          username: u.username || "",
          photo: u.photo || "/logo/profile.png",
        });

        setPrivacy({
          hideProfile: u.hideProfile || false,
          hideName: u.hideName || false,
        });

        setStarredFriends(u.starredFriends || []);
      }

      loadFriends(email);

      const goOffline = async () => {
        await setDoc(
          doc(db, "presence", email),
          { state: "offline", lastChanged: serverTimestamp() },
          { merge: true }
        );
      };

      window.addEventListener("beforeunload", goOffline);
      return () => window.removeEventListener("beforeunload", goOffline);
    });

    return () => unsub();
  }, [generateSession, navigate]);

  const loadFriends = async (myEmail) => {
    const q = query(collection(db, "friends"), where("users", "array-contains", myEmail));
    const snap = await getDocs(q);

    const list = [];
    const presenceMap = {};

    for (const d of snap.docs) {
      const otherEmail = d.data().users.find((e) => e !== myEmail);
      if (!otherEmail) continue;

      const uSnap = await getDoc(doc(db, "users", otherEmail));
      if (!uSnap.exists()) continue;

      const u = uSnap.data();

      list.push({
        email: otherEmail,
        name: u.hideName ? "Hidden User" : u.name,
        username: u.username,
        photo: u.hideProfile ? "/logo/profile.png" : u.photo || "/logo/profile.png",
      });

      onSnapshot(doc(db, "presence", otherEmail), (p) => {
        presenceMap[otherEmail] = p.exists() && p.data().state === "online";
        setOnlineMap({ ...presenceMap });
      });
    }

    setFriends(list);
    setSuggestions(list.slice(0, 12));
    setLoading(false);
    setTimeout(() => setSuggestLoading(false), 400);
  };

  const toggleStarFriend = async (username) => {
    if (!profile || rotatingStar) return;

    setFreezeSort(true);
    setRotatingStar(username);

    const updated = starredFriends.includes(username)
      ? starredFriends.filter((u) => u !== username)
      : [...starredFriends, username];

    setStarredFriends(updated);

    await updateDoc(doc(db, "users", profile.email), {
      starredFriends: updated,
    });

    setRotatingStar(null);
    setFreezeSort(false);
  };

  const goToChat = (friendUsername) => {
    document.body.classList.add("page-turn");
    setTimeout(() => {
      navigate(
        `/chat-room?user=${encodeURIComponent(friendUsername)}&me=${encodeURIComponent(
          profile.username
        )}&auth=${generateSession()}`
      );
      document.body.classList.remove("page-turn");
    }, 280);
  };

  const goToSettings = () => {
    document.body.classList.add("page-turn");
    setTimeout(() => {
      navigate(`/chat-settings?auth=${generateSession()}`, {
        state: { from: '/chats' }
      });
      document.body.classList.remove("page-turn");
    }, 280);
  };

  const sortedFriends = freezeSort
    ? friends
    : [...friends].sort(
        (a, b) =>
          starredFriends.includes(b.username) - starredFriends.includes(a.username)
      );

  return (
    <section className="chats-page page-animate">
      <div className="chats-top-row">
        <div
          className="myf-back-btn"
          onClick={() => {
            document.body.classList.add("page-turn");
            setTimeout(() => {
              navigate(`/friends?auth=${generateSession()}`);
              document.body.classList.remove("page-turn");
            }, 280);
          }}
        >
          <FiArrowLeft className="myf-back-icon" />
          <span>Back</span>
        </div>

        <div className="chat-settings-top" onClick={goToSettings}>
          <FiSettings className="top-settings-icon" />
        </div>
      </div>

      <div className="myf-title">
        <span className="myf-title-maiin">MY</span>
        <span className="myf-title-subb">CHATS</span>
      </div>

      {loading ? (
        <>
          <div className="skeleton-header-box">
            <div className="skeleton-photo"></div>
            <div className="skeleton-info">
              <div className="skeleton-text skeleton-name"></div>
              <div className="skeleton-text skeleton-email"></div>
              <div className="skeleton-text skeleton-username"></div>
            </div>
          </div>

          <div className="skeleton-friends-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="skeleton-friend-card" key={i}>
                <div className="skeleton-avatar"></div>
                <div className="skeleton-dot"></div>
                <div className="skeleton-friend-info">
                  <div className="skeleton-text skeleton-friend-name"></div>
                  <div className="skeleton-text skeleton-friend-username"></div>
                </div>
                <div className="skeleton-star"></div>
                <div className="skeleton-enter-icon"></div>
              </div>
            ))}
          </div>

          <div className="skeleton-suggest-panel">
            <div className="skeleton-suggest-title"></div>
            <div className="skeleton-suggest-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="skeleton-suggest-card" key={i}>
                  <div className="skeleton-suggest-photo"></div>
                  <div className="skeleton-suggest-name"></div>
                  <div className="skeleton-suggest-btn"></div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {profile && (
            <div className="chat-header-box">
              <img
                src={privacy.hideProfile ? "/logo/profile.png" : profile.photo || "/logo/profile.png"}
                className="chat-header-photo"
              />
              <div className="chat-header-info">
                <h3>{privacy.hideName ? "Hidden User" : profile.name}</h3>
                <p className="email-text">{profile.email}</p>
                <p className="username-text">@{profile.username}</p>
              </div>
            </div>
          )}

          <div className="chat-friends-list">
            {sortedFriends.map((f) => (
              <div className="chat-friend-card" key={f.username}>
                <img src={f.photo || "/logo/profile.png"} className="friend-avatar" />

                <span className={`online-dot ${onlineMap[f.email] ? "on" : "off"}`} />

                <div className="friend-info">
                  <h3>{f.name}</h3>
                  <p>@{f.username}</p>
                </div>

                <div
                  className={`star-btn ${
                    rotatingStar === f.username ? "star-rotating" : ""
                  }`}
                  onClick={() => toggleStarFriend(f.username)}
                >
                  {starredFriends.includes(f.username) ? (
                    <FaStar className="star-filled" />
                  ) : (
                    <FiStar className="star-outline" />
                  )}
                </div>

                <FiArrowRightCircle
                  className="enter-chat-icon"
                  onClick={() => goToChat(f.username)}
                />
              </div>
            ))}
          </div>

          <div className="suggest-panel">
            <h2>Suggested to chat with</h2>

            {suggestLoading ? (
              <div className="suggest-loader">
                <div className="sk-grid" />
              </div>

            ) : (
              
              <div className="suggest-wrap">
                {suggestions.map((f) => (
                  <div className="suggest-card" key={f.username}>
                    <img src={f.photo || "/logo/profile.png"} />
                    <p>{f.name.split(" ")[0]}</p>
                    <button onClick={() => goToChat(f.username)}>Chat</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

import "./AddFriendsPage.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { FiArrowLeft, FiCheck } from "react-icons/fi";

export default function AddFriendsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const authToken = params.get("auth");

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [requestState, setRequestState] = useState("");
  const [usernameAlert, setUsernameAlert] = useState(false);

  const generateSession = () =>
    "sess_" + Math.random().toString(36).substring(2, 12);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (!usr || !authToken) {
        navigate(`/login?auth=${generateSession()}`, { replace: true });
        return;
      }

      const userRef = doc(db, "users", usr.email);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || !userSnap.data().username) {
        setUsernameAlert(true);
        setTimeout(() => navigate(`/profile?auth=${generateSession()}`), 1500);
        return;
      }

      const u = userSnap.data();

      setCurrentUser({
        name: u.name || usr.displayName || "User",
        email: usr.email,
        username: u.username,
        photo: u.photo || "/logo/profile.png",
      });

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const searchUser = async () => {
    if (!searchText.trim()) return;

    const cleanUsername = searchText.trim().toLowerCase();

    setSearchLoading(true);
    setSearchResult(null);
    setSearchError("");
    setRequestState("");

    try {
      const unameRef = doc(db, "usernames", cleanUsername);
      const unameSnap = await getDoc(unameRef);

      if (!unameSnap.exists()) {
        setSearchError("❌ No user found.");
        setSearchLoading(false);
        return;
      }

      const email = unameSnap.data().email;

      if (email === currentUser.email) {
        setSearchError("⚠ You cannot add yourself.");
        setSearchLoading(false);
        return;
      }

      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setSearchError("❌ User profile not found.");
        setSearchLoading(false);
        return;
      }

      const u = userSnap.data();

      setSearchResult({
        email,
        name: u.name,
        username: u.username,
        photo: u.photo || "/logo/profile.png",
      });


      const friendRef1 = doc(
        db,
        "friends",
        `${currentUser.email}_${email}`
      );
      const friendRef2 = doc(
        db,
        "friends",
        `${email}_${currentUser.email}`
      );

      const friendSnap1 = await getDoc(friendRef1);
      const friendSnap2 = await getDoc(friendRef2);

      if (friendSnap1.exists() || friendSnap2.exists()) {
        setRequestState("already");
        setSearchLoading(false);
        return;
      }

      const reqRef = doc(
        db,
        "friendRequests",
        `${currentUser.email}_${email}`
      );
      const reqSnap = await getDoc(reqRef);

      if (reqSnap.exists()) {
        setRequestState("sent");
      }

    } catch {
      setSearchError("⚠ Search failed.");
    }

    setSearchLoading(false);
  };

  const sendFriendRequest = async (toEmail) => {
    setRequestState("sending");

    try {
      await setDoc(
        doc(db, "friendRequests", `${currentUser.email}_${toEmail}`),
        {
          from: currentUser.email,
          to: toEmail,
          status: "sent",
          createdAt: serverTimestamp(),
        }
      );

      setRequestState("sent");
    } catch {
      setRequestState("error");
    }
  };

  if (loading) {
    return (
      <section className="add-friends-page page-animate">
        <div className="skeleton-back-btn"></div>
        <div className="skeleton-header-box">
          <div className="skeleton-photo"></div>
          <div className="skeleton-info">
            <div className="skeleton-text skeleton-name"></div>
            <div className="skeleton-text skeleton-username"></div>
          </div>
        </div>
        <div className="skeleton-title"></div>
        <div className="skeleton-search-box">
          <div className="skeleton-input"></div>
          <div className="skeleton-btn"></div>
        </div>
        <div className="skeleton-result-area">
          <div className="skeleton-result-card">
            <div className="skeleton-photo"></div>
            <div className="skeleton-text skeleton-name"></div>
            <div className="skeleton-text skeleton-username"></div>
            <div className="skeleton-btn"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="add-friends-page page-animate">
      {usernameAlert && (
        <div className="alert-username-box">
          ⚠ Please set your username first from Profile Page!
          <p className="small-text">Redirecting…</p>
        </div>
      )}

      <div
        className="baccck-btn"
        onClick={() => navigate(`/friends?auth=${generateSession()}`)}
      >
        <FiArrowLeft className="back-icon" />
        <span>Back</span>
      </div>

      {currentUser && (
        <div className="addfriend-header-box">
          <img src={currentUser.photo} className="addfriend-header-photo" />
          <div className="addfriend-header-info">
            <h3>{currentUser.name}</h3>
            <p className="username">@{currentUser.username}</p>
          </div>
        </div>
      )}

      <h1 className="add-title-pro">Find & Add Friends</h1>

      <div className="search-box">
        <input
          type="text"
          value={searchText}
          placeholder="Search username…"
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button onClick={searchUser} disabled={searchLoading}>
          {searchLoading ? "…" : "Search"}
        </button>
      </div>

      <div className="result-area">
        {!searchLoading && !searchResult && !searchError && (
          <p className="result-placeholder">Results will appear here…</p>
        )}

        {searchError && (
          <div className="coming-box error-box">{searchError}</div>
        )}

        {searchResult && (
          <div className="search-result-card">
            <img src={searchResult.photo} />
            <h3>{searchResult.name}</h3>
            <p>@{searchResult.username}</p>
            {requestState === "" && (
              <button
                className="add-request-btn"
                onClick={() => sendFriendRequest(searchResult.email)}
              >
                Send Friend Request
              </button>
            )}
            {requestState === "sending" && (
              <button className="add-request-btn disabled">Sending …</button>
            )}
            {requestState === "sent" && (
              <button className="add-request-btn sent sent-animation">
                Request Sent <FiCheck className="check-icon" />
              </button>
            )}
            {requestState === "already" && (
              <button className="add-request-btn" style={{ background: "#16a34a" }}>
                Already Friends 💚
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

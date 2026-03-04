import "./RequestBoxPage.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";

import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { FiArrowLeft } from "react-icons/fi";
import { FaUserCheck, FaUserTimes } from "react-icons/fa";

export default function RequestBoxPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const authToken = params.get("auth");

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("incoming");
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);

  const generateSession = useCallback(
    () => "sess_" + Math.random().toString(36).substring(2, 12),
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (!usr || !authToken) {
        navigate(`/login?auth=${generateSession()}`, { replace: true });
        return;
      }

      const snap = await getDoc(doc(db, "users", usr.email));
      if (!snap.exists()) {
        navigate(`/profile?auth=${generateSession()}`);
        return;
      }

      const u = snap.data();

      setCurrentUser({
        email: usr.email,
        name: u.name,
        username: u.username,
        photo: u.photo || "/logo/profile.png",
      });

      setLoading(false);
      loadRequests(usr.email);
    });

    return () => unsub();
  }, []);

  const loadRequests = async (email) => {
    setRequestsLoading(true);

    const reqRef = collection(db, "friendRequests");

    const incomingQ = query(reqRef, where("to", "==", email));
    const sentQ = query(reqRef, where("from", "==", email));

    const incomingSnap = await getDocs(incomingQ);
    const sentSnap = await getDocs(sentQ);

    const buildUser = async (docSnap, type) => {
      const d = docSnap.data();
      const other =
        type === "incoming" ? d.from : d.to;

      const uSnap = await getDoc(doc(db, "users", other));
      if (!uSnap.exists()) return null;

      return {
        email: other,
        ...uSnap.data(),
      };
    };

    const incomingList = await Promise.all(
      incomingSnap.docs.map((d) =>
        buildUser(d, "incoming")
      )
    );

    const sentList = await Promise.all(
      sentSnap.docs.map((d) =>
        buildUser(d, "sent")
      )
    );

    setIncoming(incomingList.filter(Boolean));
    setSent(sentList.filter(Boolean));

    setRequestsLoading(false);
  };

  const acceptRequest = async (fromEmail) => {
    setRequestsLoading(true);

    const reqId = `${fromEmail}_${currentUser.email}`;
    await deleteDoc(doc(db, "friendRequests", reqId));

    await setDoc(
      doc(db, "friends", `${currentUser.email}_${fromEmail}`),
      {
        users: [currentUser.email, fromEmail],
        createdAt: serverTimestamp(),
      }
    );

    loadRequests(currentUser.email);
  };

  const declineRequest = async (fromEmail) => {
    setRequestsLoading(true);

    await deleteDoc(
      doc(db, "friendRequests", `${fromEmail}_${currentUser.email}`)
    );

    loadRequests(currentUser.email);
  };

  const cancelRequest = async (toEmail) => {
    setRequestsLoading(true);

    await deleteDoc(
      doc(db, "friendRequests", `${currentUser.email}_${toEmail}`)
    );

    loadRequests(currentUser.email);
  };

  if (loading) {
    return (
      <section className="request-page">
        <div className="loader-wrap">
          <div className="loader-circle"></div>
          <p>Loading Request Box…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="request-page page-animate">

      <button
        className="back-btn"
        onClick={() =>
          navigate(`/friends?auth=${generateSession()}`)
        }
      >
        <FiArrowLeft /> Go Back
      </button>

      <div className="tabs">
        <button
          className={activeTab === "incoming" ? "tab active" : "tab"}
          onClick={() => setActiveTab("incoming")}
        >
          Incoming
        </button>

        <button
          className={activeTab === "sent" ? "tab active" : "tab"}
          onClick={() => setActiveTab("sent")}
        >
          Sent
        </button>
      </div>

      {requestsLoading && (
        <div className="request-inner-loader">
          <div className="request-inner-circle"></div>
          <p>Fetching requests…</p>
        </div>
      )}

      {!requestsLoading && activeTab === "incoming" && (
        <div className="request-list">
          {incoming.length === 0 ? (
            <p className="empty-text">No incoming requests</p>
          ) : (
            incoming.map((u, i) => (
              <div className="request-card" key={i}>
                <img src={u.photo} alt="user" />
                <div className="request-info">
                  <h3>{u.name}</h3>
                  <p>@{u.username}</p>
                </div>

                <div className="action-btns">
                  <button
                    className="accept-btn"
                    onClick={() => acceptRequest(u.email)}
                  >
                    <FaUserCheck />
                  </button>
                  <button
                    className="decline-btn"
                    onClick={() => declineRequest(u.email)}
                  >
                    <FaUserTimes />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!requestsLoading && activeTab === "sent" && (
        <div className="request-list">
          {sent.length === 0 ? (
            <p className="empty-text">No sent requests</p>
          ) : (
            sent.map((u, i) => (
              <div className="request-card" key={i}>
                <img src={u.photo} alt="user" />
                <div className="request-info">
                  <h3>{u.name}</h3>
                  <p>@{u.username}</p>
                </div>
                <div className="action-btns">
                  <button
                    className="cancel-btn"
                    onClick={() => cancelRequest(u.email)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

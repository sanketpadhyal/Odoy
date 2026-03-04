import "./MyFriendsPage.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

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
} from "firebase/firestore";

import { FiArrowLeft, FiMoreVertical } from "react-icons/fi";

export default function MyFriendsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const authToken = params.get("auth");

  const [friendsLoading, setFriendsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);

  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendProfile, setFriendProfile] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [backAnim, setBackAnim] = useState(false);

  const generateSession = () =>
    "sess_" + Math.random().toString(36).substring(2, 12);

  useEffect(() => {
    if (!authToken) navigate("/home", { replace: true });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (!usr) {
        navigate(`/login?auth=${generateSession()}`, { replace: true });
        return;
      }

      setCurrentUser({
        email: usr.email,
        name: usr.displayName || "User",
        photo: usr.photoURL || "/logo/profile.png",
      });

      loadFriends(usr.email);
    });

    return () => unsub();
  }, []);

  const loadFriends = async (email) => {
    setFriendsLoading(true);

    try {
      const q = query(
        collection(db, "friends"),
        where("users", "array-contains", email)
      );

      const snap = await getDocs(q);
      const list = [];

      for (const d of snap.docs) {
        const otherEmail = d.data().users.find((u) => u !== email);
        const uSnap = await getDoc(doc(db, "users", otherEmail));

        if (uSnap.exists()) {
          const u = uSnap.data();
          list.push({
            email: otherEmail,
            name: u.name,
            username: u.username,
            photo: u.photo || "/logo/profile.png",
          });
        }
      }

      setFriends(list);
    } catch {}

    setFriendsLoading(false);
  };

  const openProfile = async (friend) => {
    setSelectedFriend(friend);
    setViewLoading(true);

    try {
      const snap = await getDoc(doc(db, "users", friend.email));
      if (snap.exists()) {
        const u = snap.data();
        setFriendProfile({
          ...u,
          joined: u.joinedAt
            ? u.joinedAt.toDate().toDateString()
            : "Unknown",
        });
      }
    } catch {}

    setViewLoading(false);
  };

  const deleteFriend = async (email) => {
    setDeleting(true);

    try {
      await deleteDoc(doc(db, "friends", `${currentUser.email}_${email}`));
      await deleteDoc(doc(db, "friends", `${email}_${currentUser.email}`));

      setFriends((prev) => prev.filter((f) => f.email !== email));

      setTimeout(() => {
        setConfirmDelete(null);
        setDeleting(false);
      }, 250);
    } catch {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (
        !e.target.closest(".myf-menu-popup") &&
        !e.target.closest(".myf-menu-btn")
      ) {
        setMenuOpenIndex(null);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (selectedFriend) {
    const u = friendProfile || {};

    return (
      <section
        className={`friend-profile-page ${
          backAnim ? "slide-down-out" : "slide-up-in"
        }`}
      >
        <div className="friend-profile-card">
          <div
            className="profile-back"
            onClick={() => {
              setBackAnim(true);
              setTimeout(() => {
                setSelectedFriend(null);
                setBackAnim(false);
              }, 300);
            }}
          >
            <FiArrowLeft />
            <span>Back</span>
          </div>

          {viewLoading ? (
            <div className="myf-loader"></div>
          ) : (
            <>
              <img
                src={u.photo || "/logo/profile.png"}
                className="friend-profile-photo"
                alt="profile"
              />

              <div className="friend-profile-info">
                <div className="friend-info-row">
                  <span>Name</span>
                  <p>{u.name || "Not set"}</p>
                </div>

                <div className="friend-info-row">
                  <span>Username</span>
                  <p>@{u.username || "Not set"}</p>
                </div>

                <div className="friend-info-row">
                  <span>Bio</span>
                  <p>{u.bio || "Not set"}</p>
                </div>

                <div className="friend-info-row">
                  <span>DOB</span>
                  <p>{u.birthday || "Not set"}</p>
                </div>

                <div className="friend-info-row">
                  <span>Joined</span>
                  <p>{u.joined}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="myf-page myf-animate">
        <div className="my-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          <span>Back</span>
        </div>

        <h1 className="myf-title">
          <span className="myf-title-maiin">My</span>
          <span className="myf-title-subb">Friends</span>
        </h1>

        <div className="myf-list">
          {friendsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div className="myf-card skeleton" key={i}>
                <div className="sk-avatar" />
                <div className="sk-info">
                  <div className="sk-line" />
                  <div className="sk-line short" />
                </div>
              </div>
            ))
          ) : (
            friends.map((f, index) => (
              <div className="myf-card" key={index}>
                <img src={f.photo} className="myf-photo" />

                <div className="myf-info">
                  <h3>{f.name}</h3>
                  <p className="myf-username">@{f.username}</p>
                </div>

                <div
                  className="myf-menu-btn"
                  onClick={() =>
                    setMenuOpenIndex(
                      menuOpenIndex === index ? null : index
                    )
                  }
                >
                  <FiMoreVertical />
                </div>

                {menuOpenIndex === index && (
                  <div className="myf-menu-popup">
                    <p onClick={() => openProfile(f)}>View Profile</p>
                    <p
                      className="delete-option"
                      onClick={() => setConfirmDelete(f)}
                    >
                      Delete Friend
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {!friendsLoading && friends.length === 0 && (
          <p className="myf-empty">
            You haven't added any friends yet.
          </p>
        )}
      </section>

      {confirmDelete && (
        <div className="myf-modal-overlay">
          <div className="myf-modal">
            <h2>Remove Friend?</h2>
            <p>
              Remove <strong>{confirmDelete.name}</strong>?
            </p>

            <div className="myf-modal-actions">
              <button
                className="myf-cancel-btn"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="myf-delete-btn"
                disabled={deleting}
                onClick={() =>
                  deleteFriend(confirmDelete.email)
                }
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

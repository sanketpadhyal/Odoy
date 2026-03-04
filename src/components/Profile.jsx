import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./Profile.css";

import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { FaLock, FaCamera } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";

export default function Profile() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authToken = params.get("auth");

  const [userData, setUserData] = useState(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [photo, setPhoto] = useState("/logo/profile.png");
  const [country, setCountry] = useState("us");

  const [editMode, setEditMode] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingPhoto, setLoadingPhoto] = useState(true);
  const [enterScrollMsg, setEnterScrollMsg] = useState(true);

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const generateSession = () =>
    "sess_" + Math.random().toString(36).substring(2, 12);

  // -------------------------------------
  // LOAD PROFILE
  // -------------------------------------
  useEffect(() => {
    const user = auth.currentUser;

    if (!authToken || !user) {
      navigate(`/login?auth=${generateSession()}`, { replace: true });
      return;
    }

    setTimeout(() => setEnterScrollMsg(false), 4000);

    setUserData({
      email: user.email,
      joined: new Date(user.metadata.creationTime).toDateString(),
    });

    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.email));
        if (snap.exists()) {
          const u = snap.data();
          setName(u.name || user.displayName || "");
          setUsername(u.username || "");
          setBio(u.bio || "");
          setGender(u.gender || "");
          setPhone(u.phone || "");
          setBirthday(u.birthday || "");
          setPhoto(u.photo || "/logo/profile.png");
          setCountry(u.country || "us"); // ✅ Load saved country
        }
      } catch {
        setErrorMsg("⚠ Failed to fetch profile");
      } finally {
        setLoadingPhoto(false);
      }
    };

    loadProfile();
  }, [authToken, navigate]);

  // -------------------------------------
  // ERROR MESSAGE DISPLAY
  // -------------------------------------
  useEffect(() => {
    if (!errorMsg) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(() => setErrorMsg(""), 7000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // -------------------------------------
  // SCROLL TO TOP WHEN EDIT MODE ENABLED
  // -------------------------------------
  useEffect(() => {
    if (editMode) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editMode]);

  // -------------------------------------
  // PHOTO UPLOAD HANDLER
  // -------------------------------------
  const handlePhotoChange = (e) => {
    if (!editMode) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  // -------------------------------------
  // USERNAME CHECK
  // -------------------------------------
  const checkUsername = async (value) => {
    if (value.length < 7) {
      setAvailable(false);
      setSuggestions([]);
      return;
    }

    setChecking(true);
    const snap = await getDoc(doc(db, "usernames", value));

    if (snap.exists()) {
      setAvailable(false);
      setSuggestions([
        `${value}_01`,
        `${value}${Math.floor(Math.random() * 900 + 100)}`,
        `${value}_${new Date().getFullYear()}`,
        `${value}x`,
        `${value}_official`,
      ]);
    } else {
      setAvailable(true);
      setSuggestions([]);
    }

    setChecking(false);
  };

  const handleUsername = (val) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 14).toLowerCase();
    setUsername(clean);

    if (clean.length < 7) {
      setAvailable(false);
      setSuggestions([]);
      return;
    }

    checkUsername(clean);
  };

  // -------------------------------------
  // PHONE LIMITS BASED ON COUNTRY
  // -------------------------------------
  const maxLengths = {
    us: 10,
    ca: 10,
    gb: 10,
    in: 10,
    au: 9,
  };

  const handlePhone = (val) => {
    const numbers = val.replace(/[^0-9]/g, "");
    const max = maxLengths[country] || 10;
    setPhone(numbers.slice(0, max));
  };

  // auto-trim if user switches countries
  useEffect(() => {
    const max = maxLengths[country] || 10;
    setPhone((p) => p.slice(0, max));
  }, [country]);

  // -------------------------------------
  // SAVE CHANGES
  // -------------------------------------
  const saveChanges = async () => {
    setSaving(true);
    setErrorMsg("");

    if (birthday) {
      const age = Math.floor(
        (new Date() - new Date(birthday)) /
          (1000 * 60 * 60 * 24 * 365.25)
      );
      if (age < 13 || age > 80) {
        setSaving(false);
        setErrorMsg("❌ Age must be between 13 and 80.");
        return;
      }
    }

    const user = auth.currentUser;
    const cleanUsername = username.toLowerCase();

    if (cleanUsername.length < 6) {
      setSaving(false);
      setErrorMsg("❌ Username must be at least 6 characters.");
      return;
    }

    try {
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }

      if (cleanUsername) {
        const ref = doc(db, "usernames", cleanUsername);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().email !== user.email) {
          setSaving(false);
          setErrorMsg("❌ Username already exists.");
          return;
        }
        await setDoc(ref, { email: user.email });
      }

      await setDoc(
        doc(db, "users", user.email),
        {
          name,
          username: cleanUsername,
          bio,
          gender,
          phone,
          country, // ✅ Save selected country code
          birthday,
          photo,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSaving(false);
      setEditMode(false);
      setErrorMsg("Profile updated successfully! ✅");
    } catch {
      setSaving(false);
      setErrorMsg("Failed to save profile ⚠ try again.");
    }
  };

  const askEdit = () => {
    if (!editMode) setShowEditConfirm(true);
  };

  // -------------------------------------
  // JSX OUTPUT
  // -------------------------------------
  return (
    <section className="profile-page">
      <div className="profile-box">
        <div
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft className="back-icon" />
          <span>Back</span>
        </div>

        {showEditConfirm && (
          <div className="edit-confirm-overlay">
            <div className="edit-confirm-box">
              <h3>Enter Edit Mode?</h3>
              <p>You are about to modify your profile details.</p>
              <div className="edit-confirm-actions">
                <button
                  className="confirm-yes"
                  onClick={() => {
                    setShowEditConfirm(false);
                    setEditMode(true);
                  }}
                >
                  Yes
                </button>
                <button
                  className="confirm-no"
                  onClick={() => setShowEditConfirm(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {errorMsg && <div className="alert-box">{errorMsg}</div>}

        <h1 className="profile-title">Your Profile</h1>

        {enterScrollMsg && (
          <div className="scroll-msg-box">
            ⬇ Scroll down to enter Edit Profile mode ⬇
          </div>
        )}

        <div className="profile-photo-wrap">
          {loadingPhoto && <div className="photo-loader" />}
          <img src={photo} className="profile-photo" alt="profile" />
          {editMode && (
            <label className="photo-upload-btn">
              <FaCamera />
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
          )}
        </div>

        <div className="session-box">
          <strong>Session Token:</strong> {authToken}
        </div>

        {userData && (
          <div className="profile-form">
            <div className="field">
              <label>Full Name</label>
              <input
                value={name}
                readOnly={!editMode}
                onChange={(e) => setName(e.target.value)}
                onDoubleClick={askEdit}
              />
            </div>

            <div className="field">
              <label>Username</label>
              <input
                value={username}
                readOnly={!editMode}
                onChange={(e) => handleUsername(e.target.value)}
                className="username-input"
                onDoubleClick={askEdit}
              />

              {checking && <p className="status checking">Checking…</p>}

              {available === true && (
                <p className="status available">✓ Available</p>
              )}

              {available === false && (
                <p className="status not-available">
                  {username.length < 6
                    ? "✗ Username must be at least 6 characters"
                    : "✗ Already taken"}
                </p>
              )}

              {available === false &&
                username.length >= 6 &&
                suggestions.length > 0 && (
                  <div className="suggestions-box">
                    {suggestions.map((s, i) => (
                      <span key={i} onClick={() => handleUsername(s)}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            <div className="field">
              <label>Bio</label>
              <input
                value={bio}
                readOnly={!editMode}
                onChange={(e) => setBio(e.target.value)}
                onDoubleClick={askEdit}
              />
            </div>

            <div className="field">
              <label>Gender</label>
              <select
                value={gender}
                disabled={!editMode}
                onChange={(e) => setGender(e.target.value)}
                onDoubleClick={askEdit}
              >
                <option value="">Select</option>
                <option value="male">Male ♂</option>
                <option value="female">Female ♀</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="field">
              <label>Email</label>
              <input value={userData.email} readOnly />
              <FaLock className="email-lockk-icon" />
            </div>

            {/* PHONE INPUT + COUNTRY */}
            <div className="field">
              <label>Phone</label>

              <div className="phone-container">
                <select
                  className="country-select"
                  disabled={!editMode}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  onDoubleClick={askEdit}
                >
                  <option value="us">🇺🇸 +1</option>
                  <option value="gb">🇬🇧 +44</option>
                  <option value="in">🇮🇳 +91</option>
                  <option value="ca">🇨🇦 +1</option>
                  <option value="au">🇦🇺 +61</option>
                </select>

                <input
                  className="phone-input"
                  value={phone}
                  readOnly={!editMode}
                  onChange={(e) => handlePhone(e.target.value)}
                  placeholder="Phone number"
                  onDoubleClick={askEdit}
                />
              </div>

              <p className="phone-privacy-note">
                🔒 Your phone number is stored securely and is not visible publicly.
              </p>
            </div>

            {/* BIRTHDAY - NEW UI */}
<div className="field birthday-field">
  <label>Birthday</label>

  <div className="birthday-wrapper">
    <input
      type="date"
      value={birthday}
      readOnly={!editMode}
      onChange={(e) => setBirthday(e.target.value)}
      onDoubleClick={askEdit}
      className="birthday-input"
    />
  </div>

  {/* Age Status */}
  {birthday && (() => {
    const age = Math.floor(
      (new Date() - new Date(birthday)) / (1000 * 60 * 60 * 24 * 365.25)
    );

    if (age < 14 || age > 80) {
      return (
        <p className="birthday-status not-eligible">
          ✗ Age not eligible (14–80 allowed) — Your age: <strong>{age}</strong>
        </p>
      );
    }

    return (
      <p className="birthday-status eligible">
        ✓ Eligible — Your age : <strong>{age} Years Old</strong> 
      </p>
    );
  })()}
</div>

            {!editMode && (
              <button
                className="save-btn"
                onClick={() => setShowEditConfirm(true)}
              >
                Edit Profile
              </button>
            )}

            {editMode && (
              <>
                <button
                  className="save-btn"
                  onClick={saveChanges}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>

                <button
                  className="logout-btn"
                  onClick={() => setEditMode(false)}
                  style={{ background: "#444" }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

import "./ChatSettings.css";
import {
  FiArrowLeft,
  FiMoon,
  FiSun,
  FiUserX,
  FiEyeOff,
  FiClock,
  FiCheckCircle,
  FiInfo,
  FiBell,
  FiAward
} from "react-icons/fi";

import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export default function ChatSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const authToken = params.get("auth");

  const userEmail = localStorage.getItem("myEmail");

  const [darkMode, setDarkMode] = useState(false);
  const [hideProfile, setHideProfile] = useState(false);
  const [hideName, setHideName] = useState(false);
  const [lastSeenOff, setLastSeenOff] = useState(false);
  const [readReceiptsOff, setReadReceiptsOff] = useState(false);
  const [developerBadge, setDeveloperBadge] = useState(false);

  const [notificationsOn, setNotificationsOn] = useState(
    localStorage.getItem("chatNotifications") === "true"
  );

  useEffect(() => {
    (async () => {
      if (!userEmail) return;
      const s = await getDoc(doc(db, "users", userEmail));
      if (s.exists()) {
        const u = s.data();
        setHideProfile(u.hideProfile || false);
        setHideName(u.hideName || false);
        setLastSeenOff(u.lastSeenOff || false);
        setReadReceiptsOff(u.readReceiptsOff || false);
        setDeveloperBadge(u.developerBadge || false);
        if (u.notificationsOn !== undefined) {
          setNotificationsOn(u.notificationsOn);
          localStorage.setItem("chatNotifications", u.notificationsOn);
        }
      }
    })();

    if (localStorage.getItem("darkMode") === "true") {
      setDarkMode(true);
      document.body.classList.add("dark");
    }
  }, [userEmail]);

  const save = (field, value) => {
    updateDoc(doc(db, "users", userEmail), { [field]: value });
  };

  const toggleTheme = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    localStorage.setItem("darkMode", isDark);
    document.body.classList.toggle("dark", isDark);
  };

  const toggleNotifications = async () => {
    const newState = !notificationsOn;

    if (newState === true) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotificationsOn(false);
        localStorage.setItem("chatNotifications", false);
        save("notificationsOn", false);
        return;
      }
    }

    setNotificationsOn(newState);
    localStorage.setItem("chatNotifications", newState);
    save("notificationsOn", newState);
  };

  const goBack = () => {
    document.body.classList.add("page-turn");
    setTimeout(() => {
      // Check if previous page was passed in location state
      const from = location.state?.from;

      if (from) {
        navigate(from + (authToken ? `?auth=${authToken}` : ''));
      } else if (document.referrer && document.referrer.includes(window.location.origin)) {
        // Try to extract the path from referrer
        const referrerUrl = new URL(document.referrer);
        const path = referrerUrl.pathname + referrerUrl.search;
        navigate(path);
      } else {
        // Default fallback
        navigate(`/chats?auth=${authToken}`);
      }
      document.body.classList.remove("page-turn");
    }, 280);
  };

  return (
    <section className="chatsettings-page page-animate">
      <div className="settings-top-row">
        <div className="settings-back-btn" onClick={goBack}>
          <FiArrowLeft className="settings-back-icon" />
          <span>Back</span>
        </div>
      </div>

      <br />

      <div className="settings-title">
        <span className="settings-title-sub">SETTINGS</span>
      </div>

      <div className="settings-premium-line">
        - These are premium privacy features. Currently working in trial mode. -
      </div>

      <br />

      <div className="settings-list">
        <div
          className="settings-card"
          onClick={() => {
            setHideProfile(!hideProfile);
            save("hideProfile", !hideProfile);
          }}
        >
          <div className="s-left">
            <FiUserX />
            <p>Hide My Profile Picture</p>
          </div>
          <div className={`toggle ${hideProfile ? "on" : "off"}`}>
            <div className="circle"></div>
          </div>
        </div>

        <div
          className="settings-card"
          onClick={() => {
            setHideName(!hideName);
            save("hideName", !hideName);
          }}
        >
          <div className="s-left">
            <FiEyeOff />
            <p>Hide My Name</p>
          </div>
          <div className={`toggle ${hideName ? "on" : "off"}`}>
            <div className="circle"></div>
          </div>
        </div>

        <div
          className="settings-card"
          onClick={() => {
            setLastSeenOff(!lastSeenOff);
            save("lastSeenOff", !lastSeenOff);
          }}
        >
          <div className="s-left">
            <FiClock />
            <p>Last Seen Off</p>
          </div>
          <div className={`toggle ${lastSeenOff ? "on" : "off"}`}>
            <div className="circle"></div>
          </div>
        </div>

        <div
          className="settings-card"
          onClick={() => {
            setReadReceiptsOff(!readReceiptsOff);
            save("readReceiptsOff", !readReceiptsOff);
          }}
        >
          <div className="s-left">
            <FiCheckCircle />
            <p>Hide Read Receipts</p>
          </div>
          <div className={`toggle ${readReceiptsOff ? "on" : "off"}`}>
            <div className="circle"></div>
          </div>
        </div>

        <div className="settings-card" onClick={toggleNotifications}>
          <div className="s-left">
            <FiBell />
            <p>Chat Notifications</p>
          </div>
          <div className={`toggle ${notificationsOn ? "on" : "off"}`}>
            <div className="circle"></div>
          </div>
        </div>

        <p className="settings-footer">More features coming soon ..</p>
      </div>
    </section>
  );
}

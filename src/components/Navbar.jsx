import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [logoLoading, setLogoLoading] = useState(true);
  const [themeIconLoading, setThemeIconLoading] = useState(true);
  const [footerLogoLoading, setFooterLogoLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark");
    } else {
      setDarkMode(false);
      document.body.classList.remove("dark");
    }
  }, []);

  const generateSession = () =>
    "sess_" + Math.random().toString(36).substring(2, 12);

  const toggleTheme = (e) => {
    const ripple = document.getElementById("theme-ripple");
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add("show");

    setTimeout(() => ripple.classList.remove("show"), 600);

    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogoClick = () => {
    navigate("/home");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const goToLogin = () => {
    navigate(`/login?auth=${generateSession()}`);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const goToLoginMobile = () => {
    setMenuOpen(false);
    navigate(`/login?auth=${generateSession()}`);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
  };

  const goToProfile = () => {
    navigate(`/profile?auth=${generateSession()}`);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const goToProfileMobile = () => {
    setMenuOpen(false);
    navigate(`/profile?auth=${generateSession()}`);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
  };

  const goToFriends = () => {
    navigate(`/friends?auth=${generateSession()}`);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const goToFriendsMobile = () => {
    setMenuOpen(false);
    navigate(`/friends?auth=${generateSession()}`);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
  };

  const handleMobileNav = (path) => {
    setMenuOpen(false);
    navigate(path);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <div className="logo-box" onClick={handleLogoClick}>
            {logoLoading && <div className="logo-skeleton"></div>}
            <img
              src="/logo/logo.gif"
              className="logo"
              alt="odoy logo"
              onLoad={() => setLogoLoading(false)}
              style={{ display: logoLoading ? "none" : "block" }}
            />
          </div>

          <ul className="menu">
            <li onClick={() => handleMobileNav("/home")}>Home</li>
            <li onClick={() => navigate("/features")}>Features</li>
            <li onClick={goToFriends}>Friends</li>
            <li onClick={goToLogin}>Login</li>
            <li onClick={goToProfile}>Profile</li>
          </ul>

          <div className="toggle-wrap" onClick={toggleTheme}>
            <div className={`toggle-btn ${darkMode ? "active" : ""}`}>
              <div className="toggle-ball">
                {themeIconLoading && <div className="theme-icon-skeleton"></div>}
                <img
                  src={darkMode ? "/logo/light.png" : "/logo/dark.png"}
                  alt="theme icon"
                  onLoad={() => setThemeIconLoading(false)}
                  style={{ display: themeIconLoading ? "none" : "block" }}
                />
              </div>
            </div>
          </div>

          <div
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <span id="theme-ripple"></span>
      </nav>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="mobile-close-btn" onClick={() => setMenuOpen(false)}>
          ×
        </div>

        <p onClick={() => handleMobileNav("/home")}>Home</p>
        <p onClick={() => handleMobileNav("/about")}>About</p>
        <p onClick={goToLoginMobile}>Login</p>
        <p onClick={goToProfileMobile}>Profile</p>
        <p onClick={goToFriendsMobile}>Friends</p>

        <div className="mobile-footer">
          <p>
            © 2025 {footerLogoLoading && <span className="footer-logo-skeleton"></span>}
            <img
              src="/logo/logo.gif"
              className="footer-logo"
              onLoad={() => setFooterLogoLoading(false)}
              style={{ display: footerLogoLoading ? "none" : "inline" }}
            />
          </p>
          <p className="made-by">Made by @sanketpadhyal</p>
        </div>
      </div>
    </>
  );
}
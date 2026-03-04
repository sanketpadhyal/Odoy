import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUser, FiUsers, FiMessageCircle, FiSettings, FiMonitor } from "react-icons/fi";
import "./SidePanel.css";

export default function SidePanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToSettings = () => {
    navigate('/chat-settings', {
      state: { from: location.pathname + location.search }
    });
  };
  return (
    <aside className="side-panel">
      <NavLink to="/home" className="side-link">
        <FiHome /> <span>Home</span>
      </NavLink>

      <NavLink to="/profile" className="side-link">
        <FiUser /> <span>Profile</span>
      </NavLink>

      <NavLink to="/friends" className="side-link">
        <FiUsers /> <span>Friends</span>
      </NavLink>

      <NavLink to="/chats" className="side-link">
        <FiMessageCircle /> <span>Chats</span>
      </NavLink>

      <button onClick={goToSettings} className="side-link side-btn">
        <FiSettings /> <span>Settings</span>
      </button>

    </aside>
  );
}

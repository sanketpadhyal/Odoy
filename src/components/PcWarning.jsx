import { useEffect, useState } from "react";
import "./PcWarning.css";

export default function PcWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.innerWidth > 820) {
      setShow(true);
    }

    const handleResize = () => {
      setShow(window.innerWidth > 820);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!show) return null;

  const handleOverlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="pc-warning-overlay" onClick={handleOverlayClick}>
      <div className="pc-warning-box" onClick={(e) => e.stopPropagation()}>
        <h2>🚧 Under Maintenance for PC 🚧</h2>
        <p>
          This website is under maintenance for PC and is only available on mobile devices.
          Please try accessing it on your mobile device.
        </p>
      </div>
    </div>
  );
}

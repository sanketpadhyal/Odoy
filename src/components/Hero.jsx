import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

export default function Hero() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const posters = [
    {
      img: "/posters/POSTER1.gif",
      name: "Friends Core",
      note: "Set up your profile by adding your name, photo, and a few details to let others know who you are. Add friends easily by searching usernames or sending requests to start connecting. Chat in real time with fast, secure, and seamless messaging anytime, anywhere. Enjoy the experience with a simple, modern interface made for smooth and fun conversations.",
      link: "/friends",
      requiresAuth: true,
    }
  ];

  const [imageLoading, setImageLoading] = useState(true);

  const savedIndex = parseInt(localStorage.getItem("currentPoster")) || 0;

  const [current, setCurrent] = useState(savedIndex);
  const [animate, setAnimate] = useState(false);
  const [showLeft, setShowLeft] = useState(savedIndex > 0);

  const handleNext = () => {
    setAnimate(true);
    setImageLoading(true);
    setTimeout(() => {
      const next = (current + 1) % posters.length;
      setCurrent(next);
      localStorage.setItem("currentPoster", next);
      setAnimate(false);
      setShowLeft(next > 0);
    }, 300);
  };

  const handlePrev = () => {
    setAnimate(true);
    setImageLoading(true);
    setTimeout(() => {
      const prev = (current - 1 + posters.length) % posters.length;
      setCurrent(prev);
      localStorage.setItem("currentPoster", prev);
      setAnimate(false);
      setShowLeft(prev > 0);
    }, 300);
  };

  const generateSessionToken = useCallback(() => {
    return "sess_" + crypto.randomUUID().replace(/-/g, "");
  }, []);

  const handleVisit = (poster) => {
    if (poster.requiresAuth) {
      const freshToken = generateSessionToken();
      sessionStorage.setItem("odoy_auth", freshToken);
      navigate(`${poster.link}?auth=${freshToken}`);
    } else {
      navigate(poster.link);
    }
  };

  return (
    <>
      {loading && (
        <div className="page-loader">
          <div className="loader-box">
            <div className="loader-bar"></div>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="hero-inner pc-grid">
          <div className="hero-left">
            <h1 className="hello-big">Welcome ..</h1>
            <p className="hello-small">
              Powered for precision, tuned for speed, and engineered to elevate every interaction
            </p>
          </div>

          <div className="hero-right">
            <div className="poster-container">
              <div className={`poster-wrapper ${animate ? "fade-out" : "fade-in"}`}>
                {imageLoading && <div className="poster-skeleton"></div>}
                <img
                  src={posters[current].img}
                  alt="Poster"
                  className="hero-poster"
                  onLoad={() => setImageLoading(false)}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />

                <div className="poster-content">
                  <button
                    className="visit-btn"
                    onClick={() => handleVisit(posters[current])}
                  >
                    Visit {posters[current].name}
                  </button>

                  <div className="poster-description">
                    <p>{posters[current].note}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
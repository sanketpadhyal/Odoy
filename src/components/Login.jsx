import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./Login.css";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { FaLock } from "react-icons/fa";


export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [anim, setAnim] = useState("fadeIn");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [userName, setUserName] = useState("");

  const [timer, setTimer] = useState(50);
  const [canResend, setCanResend] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setPageLoading(false), 800);
  }, []);

  useEffect(() => {
    const token = params.get("auth");
    if (!token) navigate("/home", { replace: true });
  }, [params, navigate]);

  useEffect(() => {

  const unsubscribe = auth.onAuthStateChanged((user) => {

    if (!user) {
      localStorage.removeItem("odoy-user");
      return;
    }

    if (user.emailVerified) {

      localStorage.setItem(
        "odoy-user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || "User"
        })
      );

      setEmail(user.email);
      setUserName(user.displayName || "User");
      setMode("dashboard");
    }

  });

  return () => unsubscribe();

}, []);

  useEffect(() => {
    if (!msg) return;
    const hide = setTimeout(() => setMsg(""), 4000);
    return () => clearTimeout(hide);
  }, [msg]);

  useEffect(() => {
    if (mode !== "verify") return;
    if (timer === 0) return setCanResend(true);

    const countdown = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(countdown);
  }, [mode, timer]);

  const go = (to, animation) => {
    setAnim(animation);
    setTimeout(() => setMode(to), 150);
  };

  const switchToCreate = () => go("create", "slideUp");
  const switchToLogin = () => go("login", "slideDown");
  const switchToForgot = () => go("forgot", "slideUp");
  const handleLogin = async () => {
    setMsg("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        await signOut(auth);
        setMsg("Please verify your email before logging in.");
        go("verify", "slideUp");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "odoy-user",
        JSON.stringify({
          uid: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName || "User"
        })
      );

      setUserName(cred.user.displayName || "User");
      go("dashboard", "slideUp");
    } catch (err) {
      setMsg(err.message);
    }

    setLoading(false);
  };

  const handleCreate = async () => {
    setMsg("");
    if (password !== confirmPass) {
      setMsg("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      await sendEmailVerification(cred.user);

      setMsg("Verification email sent. Please check your inbox.");
      go("verify", "slideUp");
    } catch (err) {
      setMsg(err.message);
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);

      if (!result.user.emailVerified) {
        await signOut(auth);
        setMsg("Email not verified.");
        return;
      }

      localStorage.setItem(
        "odoy-user",
        JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || "User"
        })
      );

      setUserName(result.user.displayName || "User");
      setEmail(result.user.email);

      go("dashboard", "slideUp");
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleNameUpdate = async () => {
    if (!auth.currentUser) return;

    try {
      await updateProfile(auth.currentUser, { displayName: userName });
      const saved = JSON.parse(localStorage.getItem("odoy-user"));
      saved.name = userName;
      localStorage.setItem("odoy-user", JSON.stringify(saved));
      setMsg("Name updated!");
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleReset = async () => {
    setMsg("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Reset link sent!");
    } catch (err) {
      setMsg(err.message);
    }

    setLoading(false);
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return setMsg("Login first.");

    try {
      await sendEmailVerification(auth.currentUser);
      setMsg("Verification email resent!");
      setTimer(50);
      setCanResend(false);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("odoy-user");

    setEmail("");
    setPassword("");
    setFullName("");
    setUserName("");

    go("login", "slideDown");
  };

  const handleShowPassword = () => {
    setMsg("Password display disabled for security.");
  };

  return (
    <>
      {pageLoading && (
        <div className="page-loader-login">
          <div className="loader-box-login">
            <div className="loader-bar-login"></div>
          </div>
        </div>
      )}

      <div className="login-page">
        <div className={`login-card ${anim}`}>
          <div className="login-icon">
            <img src="/logo/logo.gif" alt="logo" />
          </div>

          {msg && <div className="alert-box">{msg}</div>}

          {mode === "dashboard" && (
            <>
              <h2 className="login-title">Account Details</h2>
              <div className="success-login-msg">
                You are Successfully / Already logged in — now you can explore ODOY!
              </div>
              <div className="login-inputs">
                <input type="text" value={userName} onChange={e => setUserName(e.target.value)} />
                <div className="locked-email">
                  <input type="email" value={email} readOnly />
                  <FaLock className="email-lock-icon" />
                </div>
                <div className="password-wrap">
                  <input type="password" value={password} readOnly />
                  <span className="forgot-btn" onClick={handleShowPassword}>Show</span>
                </div>
              </div>
              <button className="login-btn" onClick={handleLogout}>Log Out</button>
            </>
          )}

          {mode === "login" && (
            <>
              <p className="login-subtitle">
                Continue your journey with ODOY — securely sign in.
              </p>
              <div className="login-inputs">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <p className="forgot-center-btn" onClick={switchToForgot}>Forgot Password?</p>
              <button className="login-btn" onClick={handleLogin}>{loading ? "Signing In..." : "Get Started"}</button>
              <button className="create-btn" onClick={switchToCreate}>Create Account</button>
              <p className="or-text">or continue with</p>
              <div className="social-row">
                <div className="social-btn" onClick={handleGoogleLogin}><img src="/logo/google.png" /></div>
                <div className="social-btn"><img src="/logo/apple.png" /></div>
                <div className="social-btn"><img src="/logo/x.png" /></div>
              </div>
            </>
          )}

          {mode === "create" && (
            <>
              <h2 className="login-title">Create your account</h2>
              <div className="login-inputs">
                <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <input type="password" placeholder="Confirm Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
              </div>
              <button className="login-btn" onClick={handleCreate}>{loading ? "Creating..." : "Create Account"}</button>
              <p className="or-text">or continue with</p>
              <div className="social-row">
                <div className="social-btn" onClick={handleGoogleLogin}><img src="/logo/google.png" /></div>
                <div className="social-btn"><img src="/logo/apple.png" /></div>
                <div className="social-btn"><img src="/logo/x.png" /></div>
              </div>
              <p className="back-login" onClick={switchToLogin}>Back to Login</p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h2 className="login-title">Reset Password</h2>
              <div className="login-inputs">
                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="login-btn" onClick={handleReset}>{loading ? "Sending..." : "Send Reset Link"}</button>
              <p className="back-login" onClick={switchToLogin}>Back to Login</p>
            </>
          )}

          {mode === "verify" && (
            <>
              <h2 className="login-title">Verify Email</h2>
              <p className="timer-text">
                {canResend ? "You can resend the email now." : <>Resend available in <b>{timer}s</b></>}
              </p>
              <button className="login-btn" onClick={resendVerification} disabled={!canResend}>Resend</button>
              <p className="back-login" onClick={switchToLogin}>Back to Login</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

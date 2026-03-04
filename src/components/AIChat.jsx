import "./ChatRoom.css";
import { FiArrowLeft, FiMoreVertical, FiSend } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

function formatTime(ts) {
  const d = new Date(ts);
  const h = ((d.getHours() + 11) % 12) + 1;
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${ampm}`;
}

function formatDay(ts) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);

  const same = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (same(d, today)) return "Today";
  if (same(d, y)) return "Yesterday";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AIChat() {

  const navigate = useNavigate();

  const [messages,setMessages] = useState(()=>{
    const saved = localStorage.getItem("odoy_ai_chat");
    return saved ? JSON.parse(saved) : [
      {from:"ai",text:"Hey 👋 I am Odoy AI. Ask me anything!",ts:Date.now()}
    ];
  });

  const [message,setMessage] = useState("");
  const [typing,setTyping] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);

  const scrollRef = useRef(null);

  useEffect(()=>{
    document.body.classList.add("hide-navbar");
    return ()=>document.body.classList.remove("hide-navbar");
  },[]);

  useEffect(()=>{
    localStorage.setItem("odoy_ai_chat",JSON.stringify(messages));
  },[messages]);

  useEffect(()=>{
    setTimeout(()=>{
      if(scrollRef.current){
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 200;
      }
    },50);
  },[messages,typing]);

  const sendMessage = async ()=>{

    if(!message.trim()) return;

    const userMsg = {
      from:"user",
      text:message,
      ts:Date.now()
    };

    setMessages(prev=>[...prev,userMsg]);

    const userText = message;

    setMessage("");
    setTyping(true);

    try{

      const history = messages.map(m=>({
        role:m.from==="user"?"user":"assistant",
        content:m.text
      }));

      const res = await fetch(
        "https://91b0b99a-a1e5-4417-bff7-7280e25a08bc-00-388rudrv7wm2q.pike.replit.dev/ai",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            history,
            message:userText
          })
        }
      );

      const data = await res.json();

      setTyping(false);

      const reply = data?.reply || "AI did not respond.";

      setMessages(prev=>[
        ...prev,
        {
          from:"ai",
          text:reply,
          ts:Date.now()
        }
      ]);

    }catch{

      setTyping(false);

      setMessages(prev=>[
        ...prev,
        {
          from:"ai",
          text:"Server not responding.",
          ts:Date.now()
        }
      ]);

    }

  };

  const clearChat = ()=>{
    localStorage.removeItem("odoy_ai_chat");
    setMessages([]);
    setMenuOpen(false);
  };

  return(
    <section className="chatroom-page">

      <div className="chatroom-topbar animate-topbar">

        <div className="left-all">

          <div className="left-section" onClick={()=>navigate(-1)}>
            <FiArrowLeft className="topbar-back-icon"/>
          </div>

          <div className="topbar-user">
            <img src="/logo/logo.png" className="topbar-photo"/>
            <div className="user-txt">
              <h3>Odoy AI</h3>
              <div className="topbar-sub">
                {typing ? "typing…" : "online"}
              </div>
            </div>
          </div>

        </div>

        <FiMoreVertical
          className="topbar-menu-icon"
          onClick={()=>setMenuOpen(!menuOpen)}
        />

      </div>

      {menuOpen && (
        <div className="poppup-menu fade-in">

          <div className="popup-item" onClick={clearChat}>
            Clear Chat
          </div>

          <div className="poppup-close" onClick={()=>setMenuOpen(false)}>
            Cancel
          </div>

        </div>
      )}

      <div className="chat-body" ref={scrollRef}>

        {messages.map((msg,i)=>{

          const prev = messages[i-1];
          const showDay = !prev || formatDay(prev.ts)!==formatDay(msg.ts);
          const isMe = msg.from==="user";

          return(
            <div key={i}>

              {showDay && (
                <>
                  <div className="date-divider">
                    <span>{formatDay(msg.ts)}</span>
                  </div>
                  <br />
                </>
              )}

              <div className={`msg-row ${isMe?"msg-me":"msg-them"}`}>

                {!isMe && (
                  <img src="/logo/logo.png" className="msg-avatar"/>
                )}

                <div className={`msg-bubble ${isMe?"bubble-me":"bubble-them"}`}>

                  <div className="msg-text">{msg.text}</div>

                  <div className="msg-time">{formatTime(msg.ts)}</div>

                </div>

              </div>

            </div>
          );

        })}

      </div>

      <div className="typing-bar">

        <input
          className="t-input"
          placeholder="Message…"
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          onKeyDown={(e)=>e.key==="Enter" && sendMessage()}
        />

        <button className="t-btn send-btn" onClick={sendMessage}>
          <FiSend/>
        </button>

      </div>

    </section>
  );

}
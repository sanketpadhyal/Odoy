import { useState, useRef, useEffect } from "react"
import { FiImage } from "react-icons/fi"
import { TbSend } from "react-icons/tb"
import "./TryPanel.css"

export default function TryPanel() {

const [message,setMessage]=useState("")

const [chat,setChat]=useState(()=>{
const saved=localStorage.getItem("odooy_chat")
return saved ? JSON.parse(saved) : [{sender:"ai",text:"Hey! Try asking me anything 👋"}]
})

const [typing,setTyping]=useState(false)
const [selectedImage,setSelectedImage]=useState(null)

const chatEndRef=useRef(null)
const chatWindowRef=useRef(null)
const fileInputRef=useRef(null)

const [showScrollBtn,setShowScrollBtn]=useState(false)

const userSentMessage=useRef(false)

useEffect(()=>{
localStorage.setItem("odooy_chat",JSON.stringify(chat))
},[chat])

const openFilePicker=()=>{
fileInputRef.current.click()
}

const handleFileSelect=(e)=>{

const file=e.target.files[0]
if(!file) return

const reader=new FileReader()

reader.onloadend=()=>{

setSelectedImage({
file,
base64:reader.result.split(",")[1],
preview:reader.result
})

}

reader.readAsDataURL(file)

}

const sendMessage=async()=>{

if(!message.trim() && !selectedImage) return

userSentMessage.current=true

const userMsg=message || "🖼️ Sent an image"

if(selectedImage){
setChat(prev=>[...prev,{sender:"user",image:selectedImage.preview}])
}

setChat(prev=>[...prev,{sender:"user",text:userMsg}])

const img=selectedImage?.base64 || null

setMessage("")
setSelectedImage(null)
setTyping(true)

try{

const formattedHistory=chat.map(msg=>({
role:msg.sender==="user"?"user":"assistant",
content:msg.text || ""
}))

const res=await fetch("https://91b0b99a-a1e5-4417-bff7-7280e25a08bc-00-388rudrv7wm2q.pike.replit.dev/ai",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
history:formattedHistory,
message:userMsg,
imageBase64:img
})
})

const data=await res.json()

setTyping(false)

const reply=data?.reply || "AI did not return a response."

setChat(prev=>[
...prev,
{sender:"ai",text:reply}
])

}catch(err){

setTyping(false)

setChat(prev=>[
...prev,
{sender:"ai",text:"Server not responding."}
])

}

}

useEffect(()=>{

if(userSentMessage.current){

chatEndRef.current?.scrollIntoView({behavior:"smooth"})
userSentMessage.current=false

}

},[chat,typing])

useEffect(()=>{

const el=chatWindowRef.current
if(!el) return

const handleScroll=()=>{

const atBottom=el.scrollTop+el.clientHeight>=el.scrollHeight-20

setShowScrollBtn(!atBottom)

}

el.addEventListener("scroll",handleScroll)

return ()=>el.removeEventListener("scroll",handleScroll)

},[])

const scrollToBottom=()=>{
chatEndRef.current?.scrollIntoView({behavior:"smooth"})
}

return(

<section className="try-panel">

<div className="try-inner">

<div className="try-box-panel">

<img src="/posters/try.png" className="try-poster-inside" alt="Try Odooy"/>

<button className="try-feature-btn" onClick={()=>window.location.href="/home"}>
Visit AI ODOY!! (No Limits)
</button>

<div className="try-chat-window" ref={chatWindowRef}>

{chat.map((c,i)=>(

<div key={i} className={`try-chat-msg ${c.sender}`}>

{c.sender==="ai" && (
<img src="/logo/logo.gif" className="try-ai-logo-inside" alt="AI"/>
)}

{c.image && (
<img src={c.image} className="chat-image-preview" alt="sent"/>
)}

{c.text && (
<p className="try-msg-text">{c.text}</p>
)}

</div>

))}

{typing && (

<div className="try-chat-msg ai">

<img src="/logo/logo.gif" className="try-ai-logo-inside" alt="AI"/>

<div className="typing-bubble">
<div className="typing-dots">
<span></span>
<span></span>
<span></span>
</div>
</div>

</div>

)}

<div ref={chatEndRef}></div>

</div>

{showScrollBtn && (

<button className="scroll-latest-btn" onClick={scrollToBottom}>
↓ Latest
</button>

)}

{selectedImage && (

<div className="image-preview-chip">
<img src={selectedImage.preview} alt="preview"/>
</div>

)}

<div className="try-chat-input">

<button className="media-btn" onClick={openFilePicker}>
<FiImage size={20}/>
</button>

<input
type="file"
accept="image/*"
ref={fileInputRef}
style={{display:"none"}}
onChange={handleFileSelect}
/>

<input
type="text"
placeholder="Type a message..."
value={message}
onChange={(e)=>setMessage(e.target.value)}
onKeyDown={(e)=>e.key==="Enter" && sendMessage()}
/>

<button className="send-btn" onClick={sendMessage}>
<TbSend size={20}/>
</button>

</div>

<p className="odooy-disclaimer">
Odoy Engine can make mistakes. Check info.
</p>

</div>

</div>

</section>

)

}
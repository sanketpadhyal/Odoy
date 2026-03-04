import "./About.css"
import { LuZap, LuServer, LuGithub, LuUser, LuCode } from "react-icons/lu"

export default function About(){

return(

<section className="about">

<div className="about-inner">

<img src="/logo/logo.gif" className="about-logo" alt="odoy"/>

<h1 className="about-title">
About Odoy
</h1>

<p className="about-sub">
A fast, modern and minimal real-time social platform built for smooth conversations.
</p>

<div className="about-card dotted">

<p>
<b>Odoy</b> is a modern real-time messaging platform designed for speed, simplicity and a clean user experience.
</p>

<p>
The goal of Odoy is to make communication simple, fast and distraction-free while keeping the interface minimal and beautiful.
</p>

<p>
It combines real-time chat, a lightweight friend system and privacy controls so users can focus on conversations without clutter.
</p>

</div>

<div className="about-grid">

<div className="about-box dotted">

<h3 className="about-heading">
<LuZap className="about-icon"/> Features
</h3>

<ul>
<li>Real-time messaging</li>
<li>Friend request system</li>
<li>Fast user search</li>
<li>Minimal chat interface</li>
<li>Privacy controls</li>
</ul>

</div>

<div className="about-box dotted">

<h3 className="about-heading">
<LuServer className="about-icon"/> Tech Stack
</h3>

<ul>
<li>React</li>
<li>Node.js</li>
<li>Express</li>
<li>Firebase Firestore</li>
<li>Firebase Authentication</li>
</ul>

</div>

</div>

<div className="about-founder dotted">

<h3 className="about-heading">
<LuUser className="about-icon"/> Founder & Developer
</h3>

<p className="founder-name">
Sanket Padhyal
</p>

<a
href="https://github.com/sanketpadhyal"
target="_blank"
rel="noopener noreferrer"
className="github-btn"
>

<LuGithub className="github-icon"/> Visit GitHub

</a>

</div>

{/* OPEN SOURCE PANEL */}

<div className="about-open-source dotted">

<h3 className="about-heading">
<LuCode className="about-icon"/> Open Source
</h3>

<p>
Odoy is an open source project. The source code is publicly available so
developers can explore, learn from the architecture, and contribute to
future improvements of the platform.
</p>

<a
href="https://github.com/sanketpadhyal/Odoy.git"
target="_blank"
rel="noopener noreferrer"
className="github-btn"
>

<LuGithub className="github-icon"/> View Repository

</a>

</div>

</div>

</section>

)

}
import "./App.css";

import Navbar from "./components/Navbar";
import SidePanel from "./components/SidePanel";
import Hero from "./components/Hero";
import TryPanel from "./components/TryPanel";
import Profile from "./components/Profile";
import Login from "./components/Login";
import FriendsPage from "./components/FriendsPage";
import AddFriendsPage from "./components/AddFriendsPage";
import RequestBoxPage from "./components/RequestBoxPage";
import MyFriendsPage from "./components/MyFriendsPage";
import ChatsPage from "./components/ChatsPage";
import ChatRoom from "./components/ChatRoom";
import ScrollToTop from "./components/ScrollToTop";
import ChatSettings from "./components/ChatSettings";
import PcWarning from "./components/PcWarning";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initPresence } from "./presence";
import { useState, useEffect } from "react";
import About from "./components/About";
import Data from "./components/StorageSettings";
import AIChat from "./components/AIChat";

initPresence();

function Home() {
  return (
    <>
      <Hero />
      <TryPanel />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <SidePanel />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/add-friends" element={<AddFriendsPage />} />
        <Route path="/requests" element={<RequestBoxPage />} />
        <Route path="/my-friends" element={<MyFriendsPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chat-room" element={<ChatRoom />} />
        <Route path="/chat-settings" element={<ChatSettings />} />
        <Route path="/about" element={<About />} />
        <Route path="/storage" element={<Data />} />
        <Route path="/ai-chat" element={<AIChat />} />
      </Routes>
      <PcWarning />
    </BrowserRouter>
  );
}

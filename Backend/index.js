import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/ai", async (req, res) => {
  const { history, message } = req.body;

  const systemPrompt = {
    role: "system",
    content:
      "You are Odoy AI, a friendly and talkative AI assistant created by Sanket Padhyal. Your job is to chat naturally with users like a friendly assistant. Use emojis often to make conversations fun and expressive. Be conversational, engaging, and supportive. Do not give short robotic answers — respond like a human chat companion. Ask follow-up questions when appropriate to keep the conversation going. If someone asks who created you, answer: 'I was created by Sanket Padhyal.' If someone asks what you are, answer: 'I am Odoy AI, an AI assistant developed by Sanket Padhyal.' Always be friendly, helpful, expressive, and emoji-rich in your responses. You are here to chat with the user.",
  };

  const messages = [
    systemPrompt,
    ...history,
    { role: "user", content: message },
  ];

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: messages,
        }),
      },
    );

    const data = await response.json();

    if (!data.choices) {
      return res.json({ reply: "AI error" });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      "No reply";

    res.json({ reply });
  } catch (error) {
    res.json({ reply: "Server error" });
  }
});

app.listen(process.env.PORT || 5000);

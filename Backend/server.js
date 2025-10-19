import connectDB from "./config/db.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Chat from "./models/Chat.model.js";
import auth from "./middleware/auth.js";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import gamesrouter from "./routes/games.route.js";
import authrouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";
import caretakerRouter from "./routes/caretaker.route.js";
import User from "./models/User.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import nodemailer from "nodemailer";
import cron from "node-cron";
import axios from "axios";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.get("/", (req, res) => res.send("Server is up and running!"));

connectDB();

// API routes
app.use("/api/games", gamesrouter);
app.use("/api/auth", authrouter);
app.use("/api/chat", auth, chatRouter);
app.use("/api/caretaker", caretakerRouter);

// ---------------- Socket.IO -----------------
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.userId);
  socket.join(String(socket.userId));

  socket.on("send_message", async ({ receiver, message }) => {
    try {
      if (!receiver || !message) return;
      const chat = await Chat.create({
        sender: socket.userId,
        receiver,
        message,
      });

      io.to(String(receiver)).emit("receive_message", chat);
      io.to(String(socket.userId)).emit("receive_message", chat);
    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.userId);
  });
});

// ---------------- Email Transporter -----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ---------------- Contact Form Route -----------------
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const adminMail = {
      from: `MindMate Contact <${process.env.GMAIL_USER}>`,
      to: "care.mindmate@gmail.com",
      subject: `New Contact Form Message from ${name}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    };

    await transporter.sendMail(adminMail);
    console.log(`📩 New contact message from ${name} (${email})`);

    // Optional: Auto-reply to user
    const userReply = {
      from: `MindMate Care <care.mindmate@gmail.com>`,
      to: email,
      subject: "Thank you for contacting MindMate 💜",
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for reaching out to <strong>MindMate</strong>. We’ve received your message and our team will get back to you soon.</p>
        <p>Warm regards,<br/>MindMate Support Team</p>
      `,
    };

    // best-effort reply but don't block the main response if reply fails
    transporter.sendMail(userReply).catch((err) =>
      console.error("Auto-reply failed:", err)
    );

    res.json({ message: "Message sent successfully!" });
  } catch (err) {
    console.error("❌ Error sending contact email:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// ---------------- Daily Notification Job -----------------

// Function to send email
const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `MindMate Care <care.mindmate@gmail.com>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
};

// Function to send push notification (Expo)
const sendPushNotification = async (pushToken, message) => {
  try {
    await axios.post("https://exp.host/--/api/v2/push/send", {
      to: pushToken,
      sound: "default",
      title: "🌞 Daily Login Reminder",
      body: message,
    });
    console.log(`📱 Push sent to ${pushToken}`);
  } catch (err) {
    console.error("❌ Push send failed:", err.response?.data || err.message);
  }
};

// Schedule job to run every day at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  console.log("🕘 Running daily notification job...");

  try {
    const users = await User.find({
      $or: [
        { "settings.notifications.email": true },
        { "settings.notifications.push": true },
      ],
    });

    for (const user of users) {
      const name = user.name || "MindMate User";
      const message = `Hello ${name}! 🌞 Don't forget to log in to MindMate today and collect your daily points!`;

      // Send email if enabled
      if (user?.settings?.notifications?.email) {
        await sendMail(
          user.email,
          "MindMate Daily Login Reminder 🌞",
          `<p>${message}</p>`
        );
      }

      // Send push if enabled and token exists
      if (user?.settings?.notifications?.push && user.pushToken) {
        await sendPushNotification(user.pushToken, message);
      }
    }

    console.log("✅ Daily notifications sent successfully!");
  } catch (error) {
    console.error("❌ Error in daily job:", error);
  }
});

let genAI, model;
let geminiAvailable = true;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log('✅ Gemini AI initialized');
  } catch (err) {
    console.error('❌ Gemini AI initialization error:', err.message);
    geminiAvailable = false;
  }
} else {
  console.log('⚠️ Gemini API key not found, using fallback mode');
  geminiAvailable = false;
}

// ----- AI Chat Endpoint -----
app.post('/api/chat', async (req, res) => {
  if (!geminiAvailable) {
    return res.status(501).json({ error: "Gemini AI not available" });
  }
  
  const { messages } = req.body;
  try {
    const content = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const result = await model.generateContent({ contents: content });
    const response = await result.response.text();

    res.json({ message: { role: 'assistant', content: response } });
  } catch (err) {
    console.error("Gemini API error:", err.message || err);
    res.status(200).json({ 
      message: { 
        role: 'assistant', 
        content: "I'm currently unable to process your request. Please try again later." 
      } 
    });
  }
});


// ---------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`)
);
import express from "express";
import { getUsers, getMessages, sendMessage } from "../controllers/chat.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ✅ All routes are protected
router.get("/users", auth, getUsers);
router.get("/messages/:receiverId", auth, getMessages);
router.post("/send", auth, sendMessage);

export default router;

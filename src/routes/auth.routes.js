import express from "express";
import { registerUser, loginUser, oauthLogin } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);    // /signup
router.post("/login", loginUser);          // /login
router.post("/oauth", oauthLogin);         // /oauth (google/facebook)

export default router;

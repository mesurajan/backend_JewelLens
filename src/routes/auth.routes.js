import express from "express";
import { registerUser, loginUser, oauthLogin,createAdmin , deleteAdmin, updateAdmin} from "../controllers/auth.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);    // /signup
router.post("/login", loginUser);          // /login
router.post("/oauth", oauthLogin);         // /oauth (google/facebook)
router.post("/createadmin", protect, adminOnly, createAdmin);
router.put("/updateadmin/:id", protect, adminOnly, updateAdmin);
router.delete("/deleteadmin/:id", protect, adminOnly, deleteAdmin);

export default router;

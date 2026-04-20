import express from "express";
import cors from "cors";
import errorMiddleware from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import requestLogger from "./middleware/logger.middleware.js";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import heroSliderRoutes from "./routes/heroSlider.routes.js";
import brandPartnerRoutes from "./routes/brandPartner.routes.js";
import instagramPostRoutes from "./routes/instagramPost.routes.js";
import occasionRoutes from "./routes/occasion.routes.js";
import orderRoutes from "./routes/order.routes.js";
import footerSettingRoutes from "./routes/footerSetting.routes.js";
import adminNotificationRoutes from "./routes/adminNotification.routes.js";
import reviewRoutes from "./routes/review.routes.js";

const app = express();

// ----------------- CORS -----------------
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:8080";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  })
);

// ----------------- Body parser -----------------
app.use(express.json());

// ----------------- Logger -----------------
app.use(requestLogger);

// ----------------- Health Check -----------------
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "server is running" });
});

// ----------------- Routes -----------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/hero-sliders", heroSliderRoutes);
app.use("/api/brand-partners", brandPartnerRoutes);
app.use("/api/instagram-posts", instagramPostRoutes);
app.use("/api/occasions", occasionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/footer-settings", footerSettingRoutes);
app.use("/api/admin-notifications", adminNotificationRoutes);
app.use("/api/reviews", reviewRoutes);

// ----------------- Error handler -----------------
app.use(errorMiddleware);

export default app;

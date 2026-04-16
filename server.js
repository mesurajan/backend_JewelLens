import dotenv from "dotenv";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is Running on PORT ${PORT}`);
});
import "dotenv/config";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { validateEsewaConfig } from "./src/services/esewa.service.js";

validateEsewaConfig({ log: true });

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is Running on PORT ${PORT}`);
});

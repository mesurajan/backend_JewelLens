import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js"
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import errorMiddleware from "./src/middleware/error.middleware.js";


connectDB();

const PORT =process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`SErver is Running on PORT ${PORT}`);
});



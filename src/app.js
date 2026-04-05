import express from "express";
import cors from "cors";
import errorMiddleware from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import requestLogger from "./middleware/logger.middleware.js";
import userRoutes from "./routes/user.routes.js";



const app = express();
app.use(cors());
app.use(express.json());

// Log every incoming request
app.use(requestLogger);
app.get("/api/health",(req,res)=>{
    res.status(200).json({status:"server is running"});
});






// All routes here...
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Catch all errors=
app.use(errorMiddleware);
export default app;




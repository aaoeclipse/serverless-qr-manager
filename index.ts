import express, { ErrorRequestHandler } from "express";
import serverless from "serverless-http";
import userRoutes from "./src/routes/users/users.routes";
import authRoutes from "./src/routes/auth/auth.routes";
import qrRoutes from "./src/routes/qrs/qrs.routes";
import documentsRoutes from "./src/routes/documents/documents.routes";
import dotenv from "dotenv";

if (process.env.IS_OFFLINE) {
  dotenv.config({ override: true });
}

const app = express();

app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/qr", qrRoutes);
app.use("/documents", documentsRoutes);

// Error handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.status(404).json({
    error: "Not Found",
  });
};

app.use(errorHandler);

export const handler = serverless(app);

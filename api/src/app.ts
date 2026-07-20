import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { bookRouter } from "./routes/book.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/books", bookRouter);
app.use("/admin", adminRouter);

app.use(errorHandler);

export default app;

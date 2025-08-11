import express from "express";

const app = express();
const PORT = 4000;

app.get("/", (_req, res) => {
  res.send("Backend is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

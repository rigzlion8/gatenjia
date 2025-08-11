import express from "express";
const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

import app from "./app.js";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const express = require('express');
require('dotenv').config()

const app = express();
app.use(express.json({ extended: false }));

app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Route / in Backend"
  })
})

app.get("/api/test", (req, res) => {
  res.status(200).json({
    msg: "Route /api/test in backend"
  })
})

app.get("/api/hello", (req, res) => {
  res.status(200).json({
    msg: "Route /api/hello in backend"
  })
})

const PORT = process.env.PORT || 80;

app.listen(PORT, () => console.log(`Server started port ${PORT}`));
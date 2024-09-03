const express = require('express');
require('dotenv').config()

const app = express();
app.use(express.json({ extended: false }));

app.get("/", (req, res) => {
  res.status(200).json({
    "msg": "Route / in Backend"
  })
})

app.get("/test", (req, res) => {
  res.status(200).json({
    "msg": "Route /test in backend"
  })
})

const PORT = process.env.PORT || 80;

app.listen(PORT, () => console.log(`Server started port ${PORT}`));
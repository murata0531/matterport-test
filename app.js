const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const cors = require('cors');
const helmet = require('helmet');

app.use(cors());
// app.use(helmet());
app.use(helmet.frameguard());
app.use(express.static(path.join(__dirname, "public")));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Set-Cookie: cross-site-cookie=whatever; SameSite=None; Secure");

  next();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

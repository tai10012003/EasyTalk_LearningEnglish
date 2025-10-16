var express = require("express");
var bodyParser = require("body-parser");
const cors = require("cors");
var app = express();
require('dotenv').config();

// Cho phép tất cả domain (tạm thời)
app.use(cors());

// Nếu muốn chỉ cho React frontend gọi API thì dùng:
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://ec2-13-217-231-191.compute-1.amazonaws.com"
  ],
  credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

var controller = require(__dirname  + "/controllers");
app.use(controller);

app.use("/static", express.static(__dirname + "/public"));

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
var express = require("express");
var app = express();
const http = require("http");
const server = http.createServer(app);
var bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });
const { initSocket } = require("./util/socket");
initSocket(server);

// Cho phép tất cả domain (tạm thời)
app.use(cors());

// Nếu muốn chỉ cho React frontend gọi API thì dùng:
app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

var controller = require(__dirname  + "/controllers");
app.use(controller);

var journeyController = require(__dirname + "/controllers/journeycontroller");
app.use(journeyController);

var gateController = require(__dirname + "/controllers/gatecontroller");
app.use(gateController);

var stageController = require(__dirname + "/controllers/stagecontroller"); 
app.use(stageController);

var storyController = require(__dirname + "/controllers/storycontroller");
app.use(storyController);

var grammarController = require(__dirname + "/controllers/grammarcontroller");
app.use(grammarController);

var grammarexerciseController = require(__dirname + "/controllers/grammarexercisecontroller");
app.use(grammarexerciseController);

var pronunciationController = require(__dirname + "/controllers/pronunciationcontroller");
app.use(pronunciationController);

var pronunciationexerciseController = require(__dirname + "/controllers/pronunciationexercisecontroller");
app.use(pronunciationexerciseController);

var flashcardController = require(__dirname + "/controllers/flashcardcontroller");
app.use(flashcardController);

var vocabularyexerciseController = require(__dirname + "/controllers/vocabularyexercisecontroller");
app.use(vocabularyexerciseController);

var dictationexerciseController = require(__dirname + "/controllers/dictationcontroller");
app.use(dictationexerciseController);

var userController = require(__dirname + "/controllers/usercontroller");
app.use(userController);

var chatController = require(__dirname + "/controllers/chatcontroller");
app.use(chatController);

var writingController = require(__dirname + "/controllers/writingcontroller");
app.use(writingController);

var reminderController = require(__dirname + "/controllers/remindercontroller");
app.use(reminderController);

var notificationController = require(__dirname + "/controllers/notificationcontroller");
app.use(notificationController);

var usersettingController = require(__dirname + "/controllers/usersettingcontroller");
app.use(usersettingController);

var userprogressController = require(__dirname + "/controllers/userprogresscontroller");
app.use(userprogressController);

app.use("/static", express.static(__dirname + "/public"));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
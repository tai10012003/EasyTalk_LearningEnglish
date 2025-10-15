var express = require("express");
var bodyParser = require("body-parser");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const cors = require("cors");
const User = require("./entities/user"); 
var app = express();

// Cho phép tất cả domain (tạm thời)
app.use(cors());

// Nếu muốn chỉ cho React frontend gọi API thì dùng:
app.use(cors({
  origin: "http://localhost:5173"
}));

require('dotenv').config();

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
   try {
     const user = await User.findOne({ email });
     if (!user) {
       return done(null, false, { message: "Incorrect email." });
     }
     const isMatch = await bcrypt.compare(password, user.password);
     if (!isMatch) {
       return done(null, false, { message: "Incorrect password." });
     }
     return done(null, user);
   } catch (err) {
     return done(err);
   }
 }));
 

 app.use(session({
   secret: 'yourSecretKey',
   resave: false,
   saveUninitialized: true
 }));
 
 app.use(passport.initialize());
 app.use(passport.session());

passport.serializeUser(function(user, done) {
   done(null, user.id);
 });
 
 passport.deserializeUser(async function(id, done) {
   try {
     const user = await User.findById(id);
     done(null, user);
   } catch (err) {
     done(err, null);
   }
 });
 
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
   res.locals.user = req.user;
   next();
 });


app.use(flash());

app.use((req, res, next) => {
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
});

var controller = require(__dirname  + "/controllers");
app.use(controller);

var journeyAdminController = require(__dirname + "/controllers/admin/journeyAdmincontroller");
app.use("/admin/journey", journeyAdminController);

var journeyController = require(__dirname + "/controllers/journeycontroller");
app.use(journeyController);

var gateController = require(__dirname + "/controllers/gatecontroller");
app.use(gateController);

var stageAdminController = require(__dirname + "/controllers/admin/stageAdmincontroller");
app.use("/admin/stage",  stageAdminController);

var stageController = require(__dirname + "/controllers/stagecontroller"); 
app.use(stageController);

var storyAdminController = require(__dirname + "/controllers/admin/storyAdmincontroller");
app.use("/admin/story", storyAdminController);

var storyController = require(__dirname + "/controllers/storycontroller");
app.use(storyController);

var grammarController = require(__dirname + "/controllers/grammarcontroller");
app.use(grammarController);

var grammarexerciseAdminController = require(__dirname + "/controllers/admin/grammarexerciseAdmincontroller");
app.use("/admin/grammar-exercise", grammarexerciseAdminController);

var grammarexerciseController = require(__dirname + "/controllers/grammarexercisecontroller");
app.use(grammarexerciseController);

var pronunciationAdminController = require(__dirname + "/controllers/admin/pronunciationAdmincontroller");
app.use("/admin/pronunciation", pronunciationAdminController);

var pronunciationController = require(__dirname + "/controllers/pronunciationcontroller");
app.use(pronunciationController);

var pronunciationexerciseAdminController = require(__dirname + "/controllers/admin/pronunciationexerciseAdmincontroller");
app.use("/admin/pronunciation-exercise", pronunciationexerciseAdminController);

var pronunciationexerciseController = require(__dirname + "/controllers/pronunciationexercisecontroller");
app.use(pronunciationexerciseController);

var vocabularyexerciseAdminController = require(__dirname + "/controllers/admin/vocabularyexerciseAdmincontroller");
app.use("/admin/vocabulary-exercise", vocabularyexerciseAdminController);

var vocabularyexerciseController = require(__dirname + "/controllers/vocabularyexercisecontroller");
app.use(vocabularyexerciseController);

var dictationexerciseController = require(__dirname + "/controllers/dictationcontroller");
app.use(dictationexerciseController);

var userAdminController = require(__dirname + "/controllers/admin/userAdmincontroller");
app.use("/admin/user", userAdminController);

var userController = require(__dirname + "/controllers/usercontroller");
app.use(userController);

var chatController = require(__dirname + "/controllers/chatcontroller");
app.use(chatController);

var communicatetController = require(__dirname + "/controllers/communicatecontroller");
app.use(communicatetController);

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use("/static", express.static(__dirname + "/public"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
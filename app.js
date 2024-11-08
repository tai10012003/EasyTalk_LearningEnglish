var express = require("express");
var bodyParser = require("body-parser");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcrypt');
const flash = require('connect-flash'); // Flash messages
const User = require("./apps/models/user"); 
var app = express();

require('dotenv').config();

  // Cấu hình LocalStrategy để xác thực bằng email
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
   try {
     // Tìm kiếm người dùng theo email
     const user = await User.findOne({ email });
     if (!user) {
       return done(null, false, { message: "Incorrect email." });
     }
 
     // So sánh mật khẩu với mật khẩu đã băm
     const isMatch = await bcrypt.compare(password, user.password);
     if (!isMatch) {
       return done(null, false, { message: "Incorrect password." });
     }
 
     // Nếu xác thực thành công
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
 

// Middleware để xử lý dữ liệu từ form
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
   res.locals.user = req.user; // Truyền user vào tất cả các file EJS
   next();
 });


app.use(flash());

app.use((req, res, next) => {
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
});
// Routes
var controller = require(__dirname  + "/apps/controllers");
app.use(controller);

var homeAdminController = require(__dirname + "/apps/controllers/admin/homeAdmincontroller");
app.use("/admin", homeAdminController);

var journeyAdminController = require(__dirname + "/apps/controllers/admin/journeyAdmincontroller");
app.use("/admin/journey", journeyAdminController);

var journeyController = require(__dirname + "/apps/controllers/journeycontroller");
app.use(journeyController);

var gateAdminController = require(__dirname + "/apps/controllers/admin/gateAdmincontroller");
app.use("/admin/gate",  gateAdminController);

var gateController = require(__dirname + "/apps/controllers/gatecontroller");
app.use(gateController);

var stageAdminController = require(__dirname + "/apps/controllers/admin/stageAdmincontroller");
app.use("/admin/stage",  stageAdminController);

var stageController = require(__dirname + "/apps/controllers/stagecontroller"); 
app.use(stageController);

var grammarAdminController = require(__dirname + "/apps/controllers/admin/grammarAdmincontroller");
app.use("/admin/grammar", grammarAdminController);

var grammarController = require(__dirname + "/apps/controllers/grammarcontroller");
app.use(grammarController);

var grammarexerciseAdminController = require(__dirname + "/apps/controllers/admin/grammarexerciseAdmincontroller");
app.use("/admin/grammar-exercise", grammarexerciseAdminController);

var grammarexerciseController = require(__dirname + "/apps/controllers/grammarexercisecontroller");
app.use(grammarexerciseController);

var pronunciationAdminController = require(__dirname + "/apps/controllers/admin/pronunciationAdmincontroller");
app.use("/admin/pronunciation", pronunciationAdminController);

var pronunciationController = require(__dirname + "/apps/controllers/pronunciationcontroller");
app.use(pronunciationController);

var pronunciationexerciseAdminController = require(__dirname + "/apps/controllers/admin/pronunciationexerciseAdmincontroller");
app.use("/admin/pronunciation-exercise", pronunciationexerciseAdminController);

var pronunciationexerciseController = require(__dirname + "/apps/controllers/pronunciationexercisecontroller");
app.use(pronunciationexerciseController);

var vocabularyexerciseAdminController = require(__dirname + "/apps/controllers/admin/vocabularyexerciseAdmincontroller");
app.use("/admin/vocabulary-exercise", vocabularyexerciseAdminController);

var vocabularyexerciseController = require(__dirname + "/apps/controllers/vocabularyexercisecontroller");
app.use(vocabularyexerciseController);

var userAdminController = require(__dirname + "/apps/controllers/admin/userAdmincontroller");
app.use("/admin/users", userAdminController);

var userController = require(__dirname + "/apps/controllers/usercontroller");
app.use(userController);

var chatController = require(__dirname + "/apps/controllers/chatcontroller");
app.use(chatController);

// Views
app.set("views", __dirname + "/apps/views");
app.set("view engine", "ejs");

// Static files
app.use("/static", express.static(__dirname + "/public"));

// Khởi chạy server
var server = app.listen(3000, function(){
  console.log("Server is running on port 3000");
});

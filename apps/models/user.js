const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    active: {
      type: String,
      enum: ["active", "locked"],
      default: "active",  // Mặc định là hoạt động khi tạo user
    },
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey'
    },
    completedStages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage'
    }],
    completedGates: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gate'
    }],
    completedJourneys: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey'
    }]
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

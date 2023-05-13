const express = require("express");
const userRouter = express.Router();

//* middleware
const isLogin = require("../middleware/isLogin");

const {
  registerCntrl,
  loginCtrl,
  friendsCntrl,
  sendfriendRequestCntrl,
  friendRequestRecievedCntrl,
  friendRequestAcceptCntrl,
} = require("../controllers/users");

// Register user
userRouter.post("/register", registerCntrl);

// Login user
userRouter.post("/login", loginCtrl);

// Get user's friends list
userRouter.get("/friends", isLogin, friendsCntrl);

// Friend Requests sent by user
userRouter.post("/sendfriendrequest", isLogin, sendfriendRequestCntrl);

// Friend Requests received by user
userRouter.get("/receivedfriendrequest", isLogin, friendRequestRecievedCntrl);

// if friend request accepted by user
userRouter.post("/Acceptfriendrequest", isLogin, friendRequestAcceptCntrl);

module.exports = userRouter;

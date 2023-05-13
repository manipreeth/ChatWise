const express = require("express");

const commentRouter = express.Router();

const { createCommentCtrl } = require("../controllers/comments");
const isLogin = require("../middleware/isLogin");

//Post - create a comment
commentRouter.post("/", isLogin, createCommentCtrl);

module.exports = commentRouter;

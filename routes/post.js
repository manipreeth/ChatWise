const express = require("express");
const postRouter = express.Router();

const isLogin = require("../middleware/isLogin");

const {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  fetchPostsByUserCtrl,
  fetchPostByUserComment,
} = require("../controllers/posts");

// Create a post
postRouter.post("/", isLogin, createPostCtrl);

// Get all posts
postRouter.get("/", fetchPostsCtrl);

// Get post by id
postRouter.get("/:id", fetchPostCtrl);

// Get post created by user's friends
postRouter.get("/:id", fetchPostsByUserCtrl);

//Get post on which user's friends have commented
postRouter.get("/comments/:id", fetchPostByUserComment);

module.exports = postRouter;

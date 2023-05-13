const User = require("../model/User");
const Post = require("../model/Post"); // import Post model
const appErr = require("../utils/appErr");
const redis = require("redis");

// Create Post
const createPostCtrl = async (req, res, next) => {
  const { title, description } = req.body;
  try {
    if (!title || !description) {
      return next(appErr("All fields are required", 404));
    }

    //* Find user id from JSON Web Token
    const userId = req.user.id;
    //* Find the user
    const userFound = await User.findById(userId);

    // create the post
    const postCreated = await Post.create({
      title,
      description,
      user: userFound._id,
    });

    //* push the post created into the array of user's posts
    userFound.posts.push(postCreated._id);

    //*  Re-save User model
    await userFound.save();

    res.json({
      status: "Posted successfully",
      data: postCreated,
    });
  } catch (error) {
    return next(appErr(error.message));
  }
};

// To display all posts available in the database
const fetchPostsCtrl = async (req, res, next) => {
  try {
    // find post and populate comments
    const posts = await Post.find().populate("comments").populate("user");

    res.json({
      status: "success",
      data: posts,
    });
  } catch (error) {
    return next(appErr(error.message));
  }
};

// To display post with a particular post id
const fetchPostCtrl = async (req, res, next) => {
  try {
    // get the id from params
    const id = req.params.id;

    // find the postand populate comments and also user who made comments;
    // Also populate user how created the post to access user details.

    const post = await Post.findById(id)
      .populate({
        path: "comments",
        populate: {
          path: "user",
        },
      })
      .populate("user");

    res.json({
      status: "success",
      data: post,
    });
  } catch (error) {
    return next(appErr(error.message));
  }
};

// Posts created by a user's friends
const fetchPostsByUserCtrl = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const cachedData = await redis.get(`posts:${userId}`);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const user = await User.findById(userId);
    const friendIds = user.friends;

    const posts = await Post.find({ userId: { $in: friendIds } });

    // Set the data in Redis with expiration time
    redis.set(`posts:${userId}`, JSON.stringify(posts), "EX", 300);

    res.json(posts);
  } catch (error) {
    return next(appErr(error.message));
  }
};

// Post on which a user's friends have commented
const fetchPostByUserComment = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const cachedData = await redis.get(`posts:comments:${userId}`);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const user = await User.findById(userId);
    const friendIds = user.friends;

    const comments = await Comment.find({ userId: { $in: friendIds } });

    const postIds = [
      ...new Set(comments.map((comment) => comment.postId.toString())),
    ];

    const posts = await Post.find({
      $or: [{ userId: { $in: friendIds } }, { _id: { $in: postIds } }],
    });

    // Set the data in Redis with expiration time
    redis.set(`posts:comments:${userId}`, JSON.stringify(posts), "EX", 300);

    res.json(posts);
  } catch (error) {
    return next(appErr(error.message));
  }
};

module.exports = {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  fetchPostsByUserCtrl,
  fetchPostByUserComment,
};

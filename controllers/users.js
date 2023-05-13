const User = require("../model/User");
const bcrypt = require("bcryptjs");
const appErr = require("../utils/appErr");
const redis = require("redis");
const jwt = require("jsonwebtoken");

// Connect to Redis
const redisClient = redis.createClient({
  host: "localhost",
  port: 6379,
});

redisClient.on("error", (error) => {
  console.error(error);
});

// Generating Json Web Token(JWT)
const generateToken = (id) => {
  return jwt.sign({ id }, "secretKey", { expiresIn: "24h" });
};

// Register a user
const registerCntrl = async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if all values are provided
  if (!username || !email || !password) {
    return next(appErr("All fields are required", 404));
  }

  // if all values are provided
  try {
    // Check if user already exist by using email
    const emailFound = await User.findOne({ email });
    if (emailFound) {
      return next(appErr("User Already exist"));
    }
    // if user doesn't exist
    else {
      // Encrypt password provided by user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      //Register user
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      res.json({
        Status: "User Registered Successfully",
        data: newUser,
      });
    }
  } catch (error) {
    return next(appErr(error.message));
  }
};

// Login user by Json Web token Authentication
const loginCtrl = async (req, res, next) => {
  // Get user Details from body
  const { email, password } = req.body;
  // Check if email and password is provided
  if (!email || !password) {
    next(appErr("All fields are required", 404));
  }

  // Check for the user
  const userFound = await User.findOne({ email });
  if (!userFound) {
    next(appErr("User Not Found, Please Register", 404));
  }

  // if user is found
  try {
    // check if the password matches by decrypting hashed password
    const decryptedPswd = await bcrypt.compare(password, userFound.password);

    if (!decryptedPswd) {
      return res.send("Invalid Credentials");
    } else {
      res.json({
        status: "Success",
        user: userFound,
        token: generateToken(userFound._id),
      });
    }
  } catch (error) {
    return next(appErr(error.message));
  }
};

// Get all friends of the user
const friendsCntrl = async (req, res) => {
  // Retrive user id from the decoded value of JSON Web Token
  const userId = req.user.id;

  try {
    // Check if data present in Redis
    const cachedData = await redisClient.get(`friends:${userId}`);

    if (cachedData) {
      return res.json(JSON.parse(cachedData), { status: "CachedData" });
    }
    // If data is not present in Redis
    else {
      const user = await User.findById(userId);
      const friendIds = user.friends;

      const friends = await User.find({ _id: { $in: friendIds } });

      // Set the data in Redis with expiration time
      redisClient.set(`friends:${userId}`, JSON.stringify(friends), "EX", 3600);

      res.json({
        status: "Success",
        data: friends,
      });
    }
  } catch (error) {
    return next(appErr(error.message));
  }
};

// Send friend request to another user
const sendfriendRequestCntrl = async (req, res, next) => {
  // Retrive user id from the decoded value of JSON Web Token
  const userId = req.user.id;

  // Retrive reciever id
  const { recieverId } = req.body;

  // if the reciever id does not defined or not recieved from frontend
  if (!recieverId) {
    return next(appErr("Request recieverId not defined ", 404));
  }

  // if reciever id is defined or recieved from frontend
  try {
    // Check if the reciever is registered or not
    const reciever = await User.findById(recieverId);

    if (!reciever) {
      return next(appErr("Requested user does not Found ", 404));
    }

    // if the reciever is registered
    else {
      // Check if the sender is friends with the reciever
      const sender = await User.findById(userId);
      if (sender.friends.includes(recieverId)) {
        // if the sender is friends with the reciever
        return next(appErr("You are already friends with this user ", 400));
      }

      // if the sender is not friends with the reciever
      else {
        // add the sender to reciever friend requests list
        reciever.recievedFrndReq.unshift(userId);

        // Save the reciever
        await reciever.save();

        // add the reciever to sender friend requests list
        sender.sentFrndReq.unshift(recieverId);

        // Save the sender
        await sender.save();

        // return success message
        return res.json({
          status: "Success",
          message: "Friend request sent successfully",
        });
      }
    }
  } catch (error) {
    return next(appErr(error.message, 500));
  }
};

// Friend Requests Recieved by user
const friendRequestRecievedCntrl = async (req, res, next) => {
  // get user id from JWT
  const userId = req.user.id;
  try {
    // find user id
    const user = await User.findById(userId);
    const recievedReq = user.recievedFrndReq;

    res.json({
      status: "Success",
      data: recievedReq,
    });
  } catch (error) {
    return next(appErr(error.message));
  }
};

// Accept friend request recieved another user
const friendRequestAcceptCntrl = async (req, res, next) => {
  // Retrive user id from JWT
  const receiverId = req.user.id;

  // Retrive sender id
  const { senderId } = req.body;

  // if the sender id does not found
  if (!senderId) {
    return next(appErr("Reciever Id Error ", 400));
  }
  // sender id found
  try {
    const receiver = await User.findOneAndUpdate(
      { _id: receiverId },
      {
        $pull: { recievedFrndReq: { _id: senderId, status: "pending" } },
        $push: { friends: { _id: senderId, status: "accepted" } },
      },
      { new: true }
    );

    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      {
        $pull: { sentFrndReq: { _id: receiverId, status: "pending" } },
        $push: { friends: { _id: receiverId, status: "accepted" } },
      },
      { new: true }
    );

    res.json({
      status: "Success",
      message: "Friend Request Accepted Successfully",
      receiver,
      sender,
    });
  } catch (error) {
    return next(appErr(error.message, 404));
  }
};

module.exports = {
  registerCntrl,
  loginCtrl,
  friendsCntrl,
  sendfriendRequestCntrl,
  friendRequestRecievedCntrl,
  friendRequestAcceptCntrl,
};

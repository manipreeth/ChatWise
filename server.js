require("dotenv").config("./.env");
const express = require("express");
const app = express();

// Database Connection
require("./config/dbConnect");

// Global Error handler
const globalErrHandler = require("./middleware/globalHandler");

//pass json data
app.use(express.json());

//pass form data
app.use(express.urlencoded({ extended: true }));

//* Routes
const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const commentRouter = require("./routes/comment");

//* ----- User Route ----
app.use("/user", userRouter);

//* ----- Post Route ----
app.use("/post", postRouter);

//* ----- Comment Route ----
app.use("/comment", commentRouter);

//* Error Handler middleware
app.use(globalErrHandler);

//* Listen server
const PORT = process.env.PORT || 9000;
app.listen(PORT, console.log(`Server is awake on ${PORT}`));

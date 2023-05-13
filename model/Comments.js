const mongoose = require("mongoose");

const commentsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// compile schema to form a model
const Comments = mongoose.model("Comments", commentsSchema);

module.exports = Comments;

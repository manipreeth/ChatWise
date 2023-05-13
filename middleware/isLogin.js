const getTokenFromHeader = require("../utils/getTokenFromHeader");
const verifyToken = require("../utils/verifyToken");

const isLogin = (req, res, next) => {
  // Get token from header
  const token = getTokenFromHeader(req);

  // verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.json({
      message: "Invalid/Expired token, Please login again",
    });
  } else {
    //Save the user into req obj
    req.user = decoded;
    next();
  }
};

module.exports = isLogin;

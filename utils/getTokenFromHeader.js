const getTokenFromHeader = (req) => {
  const headerObj = req.headers;
  const token = headerObj["token"].split(" ")[1];
  if (token) {
    return token;
  }
  return {
    status: "Failed",
    message: "There is no token attached to the header",
  };
};

module.exports = getTokenFromHeader;

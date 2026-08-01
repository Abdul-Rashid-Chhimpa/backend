const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract Token
      token = req.headers.authorization.split(" ")[1];

      // Handle Secret Key dynamically (CAPS and Small case both)
      const secret = process.env.JWT_SECRET || process.env.jwt_secret;

      if (!secret) {
        console.error("JWT Secret Key missing in environment variables!");
        return res.status(500).json({
          success: false,
          message: "Server Configuration Error: Secret key missing",
        });
      }

      // Decode Token
      const decoded = jwt.verify(token, secret);

      // Fetch User (handling both decoded.id and decoded._id)
      const userId = decoded.id || decoded._id;
      req.user = await User.findById(userId).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found with this token",
        });
      }

      return next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed or expired",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

module.exports = { protect };

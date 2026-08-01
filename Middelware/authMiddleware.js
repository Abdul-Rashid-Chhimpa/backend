const jwt = require("jsonwebtoken");
const User = require("../Models/User"); // Check karein ki Models folder ka 'M' capital hai ya small

const protect = async (req, res, next) => {
  let token;

  // Check karein ki Header me Bearer token aa rha h ya nahi
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // "Bearer <token>" se actual token extract karo
      token = req.headers.authorization.split(" ")[1];

      // Secret Key handle karein (.env se JWT_SECRET ya jwt_secret)
      const secret = process.env.JWT_SECRET || process.env.jwt_secret;

      // Token decode & verify karo
      const decoded = jwt.verify(token, secret);

      // Decoded ID se Database se user fetch karo (Password Excluded)
      req.user = await User.findById(decoded.id || decoded._id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found with this token",
        });
      }

      return next(); // Next controller (e.g., updateProfile) par aage badho
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

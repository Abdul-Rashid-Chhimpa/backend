import jwt from "jsonwebtoken";
import User from "../Models/User"; // Apne User Model ka sahi path dein (e.g. ../models/User.js)

export const protect = async (req, res, next) => {
  let token;

  // Check karein ki Header me Bearer token aa rha h ya nahi
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // "Bearer <token>" se actual token extract karo
      token = req.headers.authorization.split(" ")[1];

      // Token decode & verify karo (JWT_SECRET aapki .env file se aayega)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Decoded ID se Database se user fetch karo (Password Excluded)
      req.user = await User.findById(decoded.id || decoded._id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found with this token",
        });
      }

      next(); // Next controller (e.g., updateProfile) par aage badho
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

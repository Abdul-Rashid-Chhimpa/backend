const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Login Required",
      });
    }

    // "Bearer <token>" se extra space aur "Bearer" hatane ke liye:
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    // Secret Key check (.env me JWT_SECRET / jwt_secret dono handle karega)
    const secret = process.env.JWT_SECRET || process.env.jwt_secret;

    const decoded = jwt.verify(token, secret);

    // Decoded payload (user id, email, etc.) ko req.user me set karein
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or Expired Token",
      error: error.message,
    });
  }
};

module.exports = auth;

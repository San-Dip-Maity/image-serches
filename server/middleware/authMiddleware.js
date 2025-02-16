const jwt = require("jsonwebtoken");
const User = require("../models/UserSchema");

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies first
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // Then check Authorization header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ msg: "Unauthorized - No token found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Please authenticate." });
  }
};

module.exports = authMiddleware;

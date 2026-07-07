const User = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password,mobile } = req.body;

   if (!name || !mobile || !email || !password) {
  return res.status(400).json({
    success: false,
    message: "All fields are required",
  });
}

   const existingUser = await User.findOne({
  $or: [
    { email: email.toLowerCase() },
    { mobile },
  ],
});

if (existingUser) {
  return res.status(400).json({
    success: false,
    message: "Email or Mobile already exists",
  });
}

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

 const user = await User.create({
  name,
  mobile,
  email: email.toLowerCase(),
  password: hashedPassword,
});

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
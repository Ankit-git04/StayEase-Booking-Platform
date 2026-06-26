const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res, next) => {
  res.render("auth/Login", {
    pageTitle: "Login",
    errorMessage: null,
    isLoggedIn: false,
  });
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email: email })
    .then((foundUser) => {
      if (!foundUser) {
        return res.render("auth/Login", {
          pageTitle: "Login",
          errorMessage: "Email not found",
          isLoggedIn: req.isLoggedIn,
        });
      }
     bcrypt.compare(password, foundUser.password).then((isMatched) => {
        if (!isMatched) {
          return res.render("auth/Login", {
            pageTitle: "Login",
            errorMessage: "Incorrect password",
            isLoggedIn: req.isLoggedIn,
          });
        }
      
        req.session.userId=foundUser._id.toString();
        req.session.isLoggedIn = true;
       req.session.save((err) => {
              if (err) {
                  console.log(err);
                  return next(err);
              }

              res.redirect('/');
          });
       
      });
    })
    .catch((err) => {
      console.log(err);
      res.render("auth/Login", {
        pageTitle: "Login",
        errorMessage: "An error occurred during login",
      });
    });
};

exports.getSignUp = (req, res, next) => {
  res.render("auth/SignUp", { pageTitle: "SignUp", isLoggedIn: false });
};

exports.postSignUp = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters")
    .custom(async (value) => {
      const existingUser = await User.findOne({ username: value });
      if (existingUser) {
        throw new Error("Username not available");
      }
      return true;
    }),

  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail()
    .custom(async (value) => {
      const existingUser = await User.findOne({ email: value });
      if (existingUser) {
        throw new Error("Email already in use");
      }
      return true;
    }),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage(
      "Password must contain at least one uppercase letter, one number, and one special character",
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),

  body("userType").isIn(["host", "guest"]).withMessage("Invalid user type"),

  body("terms")
    .equals("true")
    .withMessage("You must accept the terms and conditions"),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("auth/Signup", {
        pageTitle: "Signup",
        errorMessage: errors.array().map((err) => err.msg),
        oldInput: {
          username: req.body.username,
          email: req.body.email,
          userType: req.body.userType,
        },
        validationErrors: errors.array().map((err) => err.msg),
        isLoggedIn: false,
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const { username, email, userType } = req.body;

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      userType,
    });

    try {
      await newUser.save();
      res.redirect("/auth/login");
    } catch (err) {
      console.log(err);
      return res.status(422).render("auth/Signup", {
        pageTitle: "Signup",
        errorMessage: [err.message],
        oldInput: {
          username: req.body.username,
          email: req.body.email,
          userType: req.body.userType,
        },
        isLoggedIn: false,
      });
    }
  },
];
exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

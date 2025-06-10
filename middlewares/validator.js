const { body } = require("express-validator");

const alphaErr = "can contain only letters";
const emptyErr = "must not be blank";
const lengthErr = (min, max) => `must be between ${min} and ${max} characters`;

const updateUserForm = [
  body(["firstName", "lastName"])
    .trim()
    .notEmpty()
    .withMessage(`Name ${emptyErr}.`)
    .escape()
    .isAlpha()
    .withMessage(`Name ${alphaErr}.`)
    .isLength({ min: 2, max: 64 })
    .withMessage(`Name ${lengthErr(2, 64)}.`),
  body("username")
    .trim()
    .notEmpty()
    .withMessage(`Username ${emptyErr}.`)
    .escape()
    .isLength({ min: 2, max: 8 })
    .withMessage(`Username ${lengthErr(2, 8)}.`),
  body("email").trim().isEmail().withMessage("Enter a valid email."),
  body("adminCode")
    .trim()
    .notEmpty()
    .withMessage(`Passcode ${emptyErr}.`)
    .escape()
    .optional({ values: "falsy" }),
];

const signUpForm = [
  ...updateUserForm,
  body("password")
    .trim()
    .notEmpty()
    .withMessage(`Password ${emptyErr}.`)
    .isLength({ min: 3, max: 70 })
    .withMessage(`Password ${lengthErr(3, 70)}.`)
    .escape(),
];

const loginForm = [
  body("email").trim().isEmail().withMessage("Enter a valid email."),
  body("password")
    .trim()
    .notEmpty()
    .withMessage(`Password ${emptyErr}.`)
    .isLength({ min: 3, max: 70 })
    .withMessage(`Password ${lengthErr(3, 70)}.`)
    .escape(),
];

const createChannelForm = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage(`Name ${emptyErr}.`)
    .escape()
    .isAlpha()
    .withMessage(`Name ${alphaErr}.`)
    .isLength({ min: 2, max: 64 })
    .withMessage(`Name ${lengthErr(2, 64)}.`),
  body("imageUrl").trim().isURL().withMessage("Enter a valid URL."),
];

module.exports = {
  signUpForm,
  updateUserForm,
  loginForm,
  createChannelForm,
};

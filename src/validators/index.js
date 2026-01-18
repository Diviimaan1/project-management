import { body } from "express-validator";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Enter valid email"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Enter the username")
            .isLowercase()
            .withMessage("Username should contain only lowercase letters")
            .isLength({min : 3})
            .withMessage("Username must be of atleast 3 letters"),
        body("passwords")
            .trim()
            .notEmpty()
            .withMessage("Password should not be empty"),
        body("fullname")
            .optional()
            .trim()
    ]
}

export { userRegisterValidator }
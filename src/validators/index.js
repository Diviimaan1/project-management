import { body } from "express-validator";
import { AvailableUser } from "../utils/constants.js";

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
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password should not be empty"),
        body("fullname")
            .optional()
            .trim()
    ]
}

const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is not valid"),
        body("password")
            .notEmpty()
            .withMessage("Password is required")
    ]
}

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("Old Password is required"),
        body("newPassword")
            .notEmpty()
            .withMessage("New Password is required")
    ]
}

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Enter valid email")
    ]
}

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("Password is required")
    ]
}

const createProjectValidator = () => {
    return [
        body("name")
            .notEmpty()
            .withMessage("name is required"),
        body("description")
            .optional()
    ]
}

const addMemberToProjectValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("Invalid email"),
        body("role")
            .notEmpty()
            .withMessage("Role is required")
            .isIn(AvailableUser)
            .withMessage("Role is invalid")
    ]
}

export { 
        userRegisterValidator,
        userLoginValidator,
        userForgotPasswordValidator,
        userChangeCurrentPasswordValidator,
        userResetForgotPasswordValidator,
        createProjectValidator,
        addMemberToProjectValidator 
    }
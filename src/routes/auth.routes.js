import { Router } from "express";
import { registerUser,login, logoutUser, getCurrentUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPasssword, changePassword, resendEmail } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterValidator,userLoginValidator, userForgotPasswordValidator, userResetForgotPasswordValidator, userChangeCurrentPasswordValidator } from "../validators/index.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
//unsecure routes
router.route("/register").post(userRegisterValidator(),validate, registerUser);
router.route("/login").post(userLoginValidator(),validate, login);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(userForgotPasswordValidator(),validate,forgotPasswordRequest);
router.route("/reset-password/:resetToken").post(userResetForgotPasswordValidator(),validate,resetForgotPasssword);
//secure routes
router.route("/logout").post(verifyJwt,logoutUser);
router.route("/current-user").get(verifyJwt,getCurrentUser);
router.route("/change-password").post(verifyJwt,userChangeCurrentPasswordValidator(),validate,changePassword);
router.route("/resend-email-verification").post(verifyJwt,resendEmail);



export default router
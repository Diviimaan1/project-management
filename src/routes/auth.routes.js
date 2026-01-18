import { Router } from "express";
import { registerUser,login, logoutUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterValidator,userLoginValidator } from "../validators/index.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(userRegisterValidator(),validate, registerUser);
router.route("/login").post(userLoginValidator(),validate, login);
//secure routes
router.route("/logout").post(verifyJwt,logoutUser);


export default router
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerificationMailContent, sendEmail } from "../utils/mail.js";

const generateAccessAndRefreshTokens = async ( UserID ) => {
        try {
            const user  = await User.findById(UserID);
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();

            user.refreshToken = refreshToken;
            await user.save({validateBeforeSave : false});
            return {accessToken,refreshToken};

        } catch (error) {
            throw new ApiError(500, "Something went wrong during generating access token");
        }
    };

const registerUser = asyncHandler( async ( req, res) => {
    const { email,username,password,role } = req.body

    const existedUser = await User.findOne({
        $or : [{username},{email}],
    })

    if(existedUser){
        throw new ApiError(409, "User with same email or username already exist");
    }

    const user = User.create({
        email,
        password,
        username,
        isEmailVerified : false,
    });

    const { unHashedToken,hashedToken,tokenExpiry } = user.generateTemporaryToken();

    (await user).emailVerificationExpiry = hashedToken;
    (await user).emailVerificationToken = tokenExpiry;

    (await user).save({validateBeforeSave: false});
   
    await sendEmail(
        {
            email : user?.email,
            subject : "Please verify your Email",
            mailgenContent : emailVerificationMailContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            ),
        }
    )

    const createdUser =  await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )

    if(!createdUser){
        throw new ApiError(500,
            "Something went wrong while registering a user"
        );
    }

    return res.status(201).json(new ApiResponse(201,
        {user: createdUser},
        "User created successfully and verification email has been sent"
    ));

})

export {registerUser};
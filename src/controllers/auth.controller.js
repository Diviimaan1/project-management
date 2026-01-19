import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerificationMailContent, sendEmail, forgotPasswordMailContent } from "../utils/mail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified : false,
    });

    const { unHashedToken,hashedToken,tokenExpiry } = user.generateTemporaryToken();

    (await user).emailVerificationExpiry = tokenExpiry;
    (await user).emailVerificationToken = hashedToken;

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

const login = asyncHandler(async ( req,res ) => {
    const { email,username,password } = req.body;

    if(!email){
        throw new ApiError(400,"Email is required");
    }

    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(400,"User does not exist");
    }

    const checkPassword = user.isPasswordCorrect(password);
    if(!checkPassword){
        throw new ApiError(400,"Incorrect credentials");
    }

    const { accessToken,refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser =  await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )
 
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged inn successfully"
        ));
});

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : ""
            }   
        },
        {
            new : true,
        },    
    )

    const options = {
        httpOnly : true,
        secure : true
    }
    return res
            .status(200)
            .clearCookie("accessToken",options)
            .clearCookie("refreshToken",options)
            .json(
                new ApiResponse(200,{},"User logged Out")
            )

});

const getCurrentUser = asyncHandler(async (req,res) => {

    return res
            .status(200)
            .json(
                new ApiResponse(200,req.user,"Current User fetched successfully")
            )

})

const verifyEmail = asyncHandler(async(req,res) => {
    const {verificationToken} = req.params

    if(!verificationToken){
        throw new ApiError(400,"Email verification token went missing");
    }

    let hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex")

    const user = await User.findOne({
        emailVerificationToken:hashedToken,
        emailVerificationExpiry: {$gt : Date.now()}
    })

    if(!user){
        throw new ApiError(400,"Email verification time expired");
    }
    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined
    user.isEmailVerified = true;
    await user.save({validateBeforeSave : false});

    return res.status(200).json(
        new ApiResponse(200,{
            isEmailVerified : true,
        },
        "Email verified successfully")
    )
})

const resendEmail = asyncHandler(async (req,res) => {
    const user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError(400,"User does not exist");
    }
    if(user.isEmailVerified){
        throw new ApiError(400,"Email is already verified");
    }

    const { unHashedToken,hashedToken,tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationExpiry = tokenExpiry;
    user.emailVerificationToken = hashedToken;

    user.save({validateBeforeSave: false});
   
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

    return res.status(200)
                .json(
                    new ApiResponse(200,{},"Email has been sent to your email")
                )

})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized access")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is Expired")
        }

        const options = {
            httpOnly : true,
            secure : true
        }

        const {accessToken,refreshToken : newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        user.refreshToken = newRefreshToken
        await user.save({validateBeforeSave:false})

        return res.status(200)
                .cookie("accessToken",accessToken,options)
                .cookie("refreshToken",newRefreshToken,options)
                .json(
                    new ApiResponse(200,{
                        accessToken,
                        refreshToken:newRefreshToken
                    },
                    "Access token has been refreshed")
                )
        
    } catch (error) {
        throw new ApiError(401,"Invalid refresh Token")
    }
    
})

const forgotPasswordRequest = asyncHandler(async(req,res) => {
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(401,"Email does not exist")
    }

    const {unHashedToken,hashedToken,tokenExpiry} = user.generateTemporaryToken()
    user.forgotPasswordExpiry = tokenExpiry
    user.forgotPasswordToken = hashedToken

    await user.save({validateBeforeSave:false})

    await sendEmail(
        {
            email : user?.email,
            subject : "Password reset request",
            mailgenContent : forgotPasswordMailContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            ),
        }
    )

    return res.status(200)
            .json(
                new ApiResponse(200,{},"Password reset mail has been sent")
            )

})

const resetForgotPasssword = asyncHandler(async(req,res) => {
    const {resetToken} = req.params
    const {newPassword} = req.body

    const decodedToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    const user = await User.findOne({
        forgotPasswordToken:decodedToken,
        forgotPasswordExpiry:{$gt : Date.now()}
    })

    if(!user){
        throw new ApiError(489,"Token invalid or expired");
    }
    user.forgotPasswordExpiry = undefined
    user.forgotPasswordToken = undefined

    user.password = newPassword

    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,{},"Password reset successfully")
    )
})

const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = await User.findById(req.user._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400,"Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,{},"Password changed successfully"))
})

export {registerUser,
        login,
        logoutUser,
        getCurrentUser,
        verifyEmail,
        resendEmail,
        refreshAccessToken,
        forgotPasswordRequest,
        resetForgotPasssword,
        changePassword
    };
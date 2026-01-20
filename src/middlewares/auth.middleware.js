import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import { ProjectMember } from "../models/projectmember.model.js";
import mongoose from "mongoose";

export const verifyJwt = asyncHandler(async ( req,res,next) => {
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

    if(!token){
        throw new ApiError(401,"Unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

        if(!user){
            throw new ApiError(400,"Access token is invalid");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(400,"Access token is invalid");
    }

})

export const validateProjectPermission = (roles = [] ) => {
    asyncHandler(async (req,res,next) => {
        const { projectId } = req.params
    
        if(!projectId){
            throw new ApiError("Project id is missing");
        }
        const project = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user:new mongoose.Types.ObjectId(req.user._id)
        })
    
        if(!project){
            throw new ApiError("Project is missing");
        }
        const givenRole = project?.role
    
        req.user.role = givenRole;

        if(!roles.includes(givenRole)){
            throw new ApiError(403,"You do not have permission to perform this action");
        }
        next();
    
    });

};
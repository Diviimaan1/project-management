import mongoose, { Schema, Types } from "mongoose";
import { AvailableUser,UserRolesEnum } from "../utils/constants.js"

const projectMemberSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    project:{
        type:Schema.Types.ObjectId,
        ref:"Project",
        required:true
    },
    role:{
        type:String,
        enum:AvailableUser,
        default:UserRolesEnum.MEMBER
    }
},{timestamps:true});

export const ProjectMember = mongoose.model("ProjectMember",projectMemberSchema);
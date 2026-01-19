import mongoose, { Schema, Types } from "mongoose";
import { AvailableTaskStatus,TaskStatusEnum } from "../utils/constants.js"

const taskSchema = new Schema({
    title:{
        type:String,
        trim:true,
        required:true,
    },
    description:true,
    project:{
        type:Schema.Types.ObjectId,
        ref:"Project",
        required:true,
    },
    assignedTo:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    assignedBy:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    status:{
        type:String,
        enum:AvailableTaskStatus,
        default:TaskStatusEnum.TODO
    },
    attachments:{
        type:[{
            url:String,
            mimetype:String,
            size:Number,
        }],
        default:[]
    }
},{timestamps:true});

export const Task = mongoose.model("Task",taskSchema);
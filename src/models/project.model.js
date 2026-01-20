import mongoose, { Schema, Types } from "mongoose";

const projectSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    }
},{
    timestamps:true,
})

export const Project = mongoose.model("Project",projectSchema);
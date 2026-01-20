import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import mongoose from "mongoose";
import { AvailableUser, UserRolesEnum } from "../utils/constants.js";

const getProjects = asyncHandler(async(req,res)=>{
    //test
    const projects = await ProjectMember.aggregate([
        {
            $match : {
                user:new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
            $lookup:{
                from:"projects",
                localField:"projects",
                foreignField:"_id",
                as:"projects",
                pipeline:[
                    {
                        $lookup:{
                            from:"projectmembers",
                            localField:"_id",
                            foreignField:"projects",
                            as:"projectmembers"
                        }
                    },
                    {
                        $addFields:{
                            members:{
                                $size:"$projectmembers",
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$projects"
        },
        {
            $project:{
                project:{
                    _id:1,
                    name:1,
                    description:1,
                    members:1,
                    // createdAt:1,
                    createdBy:1
                },
                role:1,
                _id:0
            }
        }
    ])
    return res.status(200).jsonjson(
        new ApiResponse(200,projects,"Projects fetched successfully")
    )

})

const getProjectById = asyncHandler(async(req,res)=>{
    //test
    const {projectId} = req.params

    const project = await Project.findById(projectId)

    if(!project){
        throw new ApiError(404,"Project not found");
    }
    return res.status(200).json(
        new ApiResponse(200,project,"Project updated successfully")
    )

})

const createProject = asyncHandler(async(req,res)=>{
    //test
    const {name,description} = req.body;
    const project = await Project.create({
        name,
        description,
        createdBy:new mongoose.Types.ObjectId(req.user._id),
    })
    await ProjectMember.create({
        user:new mongoose.Types.ObjectId(req.user._id),
        project:new mongoose.Types.ObjectId(project._id),
        role:UserRolesEnum.ADMIN
    })
    return res.status(201).json(
        new ApiResponse(201,project,"Project created successfully")
    )
})

const updateProject = asyncHandler(async(req,res)=>{
    //test
    const {name,description} = req.body;
    const {projectId} = req.params
    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description 
        },
        {
            new:true
        }
    )
    if(!project){
        throw new ApiError(404,"Project not found");
    }
    return res.status(200).json(
        new ApiResponse(200,project,"Project updated successfully")
    )
})

const deleteProject = asyncHandler(async(req,res)=>{
    //test
    const {projectId} = req.params
    const project = await Project.findByIdAndDelete(projectId);
    if(!project){
        throw new ApiError(404,"Project not found");
    }
    return res.status(200).json(
        new ApiResponse(200,project,"Project deleted successfully")
    )
})

const getProjectMembers = asyncHandler(async(req,res)=>{
    //test
    const { projectId } = req.params

    const project = await Project.findById(projectId);
    if(!project){
        throw new ApiError(404,"Project not found");
    }

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                project : new mongoose.Types.ObjectId(projectId),
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"user",
                foreignField:"_id",
                as:"user",
                pipeline:[
                    {
                        $project:{
                            _id:1,
                            userename:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                user:{
                    $arrayElemAt:["$user",0]
                }
            }
        },
        {
            $project:{
                project:1,
                user:1,
                _id:0
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200,projectMembers,"Project Members fetched successfully")
    )
})

const addProjectMember = asyncHandler(async(req,res)=>{
    //test
    const { email,role } = req.body
    const { projectId } = req.params

    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404,"User not found");
    }
    // const projectmember = await ProjectMember.create({
    //     user:new mongoose.Types.ObjectId(user._id),
    //     project:new mongoose.Types.ObjectId(projectId),
    //     role:UserRolesEnum.role
    // })

    await ProjectMember.findByIdAndUpdate({
        user:new mongoose.Types.ObjectId(user._id),
        project:new mongoose.Types.ObjectId(projectId),
    },
    {
        user:new mongoose.Types.ObjectId(user._id),
        project:new mongoose.Types.ObjectId(projectId),
        role:UserRolesEnum.role
    },
    {
        new:true,
        upsert:true
    }
    )
    return res.status(201).json(
        new ApiResponse(201,{},"Project member updated successfully")
    )

})

const updateProjectMemberRole = asyncHandler(async(req,res)=>{
    //test
    const { projectId,userID } = req.params
    const { newRole } = req.body

    if(!AvailableUser.includes(newRole)){
        throw new ApiError(400,"Invalid role");
    }

    let projectMember = await ProjectMember.findOne({
        project:new mongoose.Types.ObjectId(projectId),
        user:new mongoose.Types.ObjectId(userID)
    })

    if(!projectMember){
        throw new ApiError(400,"Project member not found");
    }

    projectMember = await ProjectMember.findByIdAndUpdate(projectMember._id,{
        role:newRole
    },{
        new:true
    })

    if(!projectMember){
        throw new ApiError(400,"Project Member not found");
    }

    return res.status(201).json(
        new ApiResponse(201,projectMember,"Project member updated successfully")
    )
})

const removeProjectMember = asyncHandler(async(req,res)=>{
    //test
    const { projectId,userID } = req.params


    let projectMember = await ProjectMember.findOne({
        project:new mongoose.Types.ObjectId(projectId),
        user:new mongoose.Types.ObjectId(userID)
    })

    if(!projectMember){
        throw new ApiError(400,"Project member not found");
    }

    projectMember = await ProjectMember.findByIdAndDelete(projectMember._id)

    if(!projectMember){
        throw new ApiError(400,"Project Member not found");
    }

    return res.status(201).json(
        new ApiResponse(201,{},"Project member deleted successfully")
    )
})

export {
    getProjects,
    getProjectById,
    getProjectMembers,
    createProject,
    updateProject,
    updateProjectMemberRole,
    addProjectMember,
    removeProjectMember,
    deleteProject
}
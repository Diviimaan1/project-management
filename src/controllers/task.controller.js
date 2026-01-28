import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { Subtask } from "../models/subtask.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import mongoose from "mongoose";
import { AvailableUser, UserRolesEnum } from "../utils/constants.js";

const getTasks = asyncHandler(async () => {

})

const createTasks = asyncHandler(async () => {
    
})

const getTaskById = asyncHandler(async () => {
    
})

const updateTask = asyncHandler(async () => {
    
})

const deleteTask = asyncHandler(async () => {
    
})

const createSubtask = asyncHandler(async () => {
    
})

const updateSubtask = asyncHandler(async () => {
    
})

const deleteSubtask = asyncHandler(async () => {
    
})

export {
    getTasks,
    getTaskById,
    createTasks,
    createSubtask,
    updateTask,
    updateSubtask,
    deleteTask,
    deleteSubtask
}
import { Router } from "express";
import { 
    getProjects,
    getProjectById,
    getProjectMembers,
    createProject,
    updateProject,
    updateProjectMemberRole,
    addProjectMember,
    removeProjectMember,
    deleteProject
 } from "../controllers/project.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { 
    createProjectValidator,
    addMemberToProjectValidator 
 } from "../validators/index.js";
import { verifyJwt,validateProjectPermission } from "../middlewares/auth.middleware.js";
import { AvailableUser, UserRolesEnum } from "../utils/constants.js";

const router = Router()
router.use(verifyJwt);

router.route("/").get(getProjects).post(createProjectValidator(),validate,createProject);
router.route("/:projectId").get(validateProjectPermission(AvailableUser),getProjectById)
                           .put(validateProjectPermission([UserRolesEnum.ADMIN,UserRolesEnum.MEMBER]),
                                createProjectValidator(),
                                validate,
                                updateProject
                            )
                           .delete(validateProjectPermission([UserRolesEnum.ADMIN]),deleteProject);
router.route("/:projectId/members").get(getProjectMembers)
                                    .post(
                                        validateProjectPermission([UserRolesEnum.ADMIN]),
                                        addMemberToProjectValidator(),
                                        validate,
                                        addProjectMember
                                    );
router.route("/:projectId/members/:userId").put(
                                                validateProjectPermission([UserRolesEnum.ADMIN]),
                                                updateProjectMemberRole
                                            )
                                            .delete(
                                                validateProjectPermission([UserRolesEnum.ADMIN]),
                                                deleteProject
                                            );




export default router;
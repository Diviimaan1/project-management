export const UserRolesEnum = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member"
}

export const AvailableUser = Object.values(UserRolesEnum)

export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done"
}

export const AvailableTaskStatus = Object.values(TaskStatusEnum)

// System-level roles (for admin access)
export const SystemRoleEnum = {
    ADMIN: "ADMIN",
    USER: "USER"
}

export const AvailableSystemRoles = Object.values(SystemRoleEnum)

// Medical Document Categories
export const DocumentCategoryEnum = {
    APPROVAL: "APPROVAL",
    SAFETY: "SAFETY",
    REIMBURSEMENT: "REIMBURSEMENT"
}

export const AvailableDocumentCategories = Object.values(DocumentCategoryEnum)
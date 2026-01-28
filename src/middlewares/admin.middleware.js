import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 * Middleware to check if user has ADMIN system role
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }

    if (req.user.systemRole !== "ADMIN") {
        throw new ApiError(403, "Admin access required");
    }

    next();
});

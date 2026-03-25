import mongoose from 'mongoose';

/**
 * Utility function to normalize workspace IDs regardless of format
 * This will handle various formats:
 * - MongoDB ObjectId instances
 * - String IDs
 * - Objects with _id property
 * - null/undefined values
 * 
 * @param workspace The workspace identifier in any format
 * @returns A string ID or null if no valid ID could be extracted
 */
export const normalizeWorkspaceId = (workspace: any): string | null => {
    if (!workspace) {
        return null;
    }

    // If it's a MongoDB ObjectId
    if (workspace instanceof mongoose.Types.ObjectId) {
        return workspace.toString();
    }

    // If it's an object with an _id property
    if (typeof workspace === 'object' && workspace !== null) {
        // If the object has an _id property that's an ObjectId
        if (workspace._id instanceof mongoose.Types.ObjectId) {
            return workspace._id.toString();
        }

        // If the object has an _id property that's a string
        if (workspace._id && typeof workspace._id === 'string') {
            return workspace._id;
        }

        // Try to convert the object to string if it has a toString method
        if (typeof workspace.toString === 'function') {
            const str = workspace.toString();
            // Only return if it doesn't look like the default Object toString
            if (str !== '[object Object]') {
                return str;
            }
        }
    }

    // If it's already a string
    if (typeof workspace === 'string') {
        return workspace;
    }

    // If we couldn't extract a valid ID
    return null;
};

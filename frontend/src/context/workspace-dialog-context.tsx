"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface WorkspaceDialogContextType {
    isOpen: boolean;
    openDialog: () => void;
    closeDialog: () => void;
}

const WorkspaceDialogContext = createContext<WorkspaceDialogContextType | undefined>(undefined);

export function WorkspaceDialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = () => {
        setIsOpen(true);
    };

    const closeDialog = () => {
        setIsOpen(false);
    };

    return (
        <WorkspaceDialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
            {children}
        </WorkspaceDialogContext.Provider>
    );
}

export function useWorkspaceDialog() {
    const context = useContext(WorkspaceDialogContext);
    if (!context) {
        throw new Error("useWorkspaceDialog must be used within a WorkspaceDialogProvider");
    }
    return context;
}

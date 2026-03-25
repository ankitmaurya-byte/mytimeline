"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ProjectDialogContextType {
    isOpen: boolean;
    openDialog: () => void;
    closeDialog: () => void;
}

const ProjectDialogContext = createContext<ProjectDialogContextType | undefined>(undefined);

export function ProjectDialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = () => {
        setIsOpen(true);
    };

    const closeDialog = () => {
        setIsOpen(false);
    };

    return (
        <ProjectDialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
            {children}
        </ProjectDialogContext.Provider>
    );
}

export function useProjectDialog() {
    const context = useContext(ProjectDialogContext);
    if (!context) {
        throw new Error("useProjectDialog must be used within a ProjectDialogProvider");
    }
    return context;
}

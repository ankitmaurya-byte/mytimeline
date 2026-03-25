"use client"

import WorkspaceForm from "./create-workspace-form";
import { useWorkspaceDialog } from "@/context/workspace-dialog-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useId } from "react";

const CreateWorkspaceDialog = () => {
  const { isOpen, closeDialog } = useWorkspaceDialog();
  const descriptionId = useId();

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent
        className="sm:max-w-2xl max-w-[100vw] w-full mx-2 sm:mx-auto p-0 max-h-[90vh] overflow-y-auto"
        aria-describedby={descriptionId}
      >
        <span id={descriptionId} className="sr-only">
          Create a new workspace for your projects and tasks.
        </span>
        <WorkspaceForm onClose={closeDialog} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;

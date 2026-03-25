'use client';

import { lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useProjectDialog } from "@/context/project-dialog-context";
import { Loader } from "lucide-react";
import { useLoadingContext } from "@/components/loading";

// Lazy load the form with emoji picker
const CreateProjectForm = lazy(() => import("@/components/workspace/project/create-project-form"));

const CreateProjectDialog = () => {
  const { isOpen, closeDialog } = useProjectDialog();
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] sm:max-h-auto my-2 sm:my-5 border-0 overflow-y-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center h-[200px]">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        }>
          <CreateProjectForm onClose={closeDialog} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;

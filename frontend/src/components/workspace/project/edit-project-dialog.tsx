import { lazy, Suspense } from "react";
import { Loader } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjectType } from "@/types/api.type";
import { useLoadingContext } from "@/components/loading";

// Lazy load the form with emoji picker
const EditProjectForm = lazy(() => import("./edit-project-form"));

interface EditProjectDialogProps {
  project?: ProjectType;
  isOpen: boolean;
  onClose: () => void;
}

const EditProjectDialog = ({ project, isOpen, onClose }: EditProjectDialogProps) => {
  const { isStrategicLoading } = useLoadingContext();

  // Don't show anything during strategic loading
  if (isStrategicLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] sm:max-h-auto my-2 sm:my-5 border-0 overflow-y-auto"
        aria-describedby="edit-project-description"
      >

        <Suspense fallback={
          <div className="flex items-center justify-center h-[200px]">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        }>
          <EditProjectForm
            {...(project && { project: project })}
            onClose={onClose}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;

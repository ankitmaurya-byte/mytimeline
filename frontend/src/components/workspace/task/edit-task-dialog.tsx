import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditTaskForm from "./edit-task-form";
import { TaskType } from "@/types/api.type";

interface EditTaskDialogProps {
  task: TaskType;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void; // Callback for when task is updated
}

const EditTaskDialog = ({ task, isOpen, onClose, onTaskUpdated }: EditTaskDialogProps) => {
  return (
    <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="edit-task-description" className="sm:max-w-lg max-w-[95vw] max-h-[90vh] sm:max-h-auto my-2 sm:my-5 border border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden">
        <p id="edit-task-description" className="sr-only">
          Edit the details of your task.
        </p>
        <EditTaskForm task={task} onClose={onClose} onTaskUpdated={onTaskUpdated} />
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;

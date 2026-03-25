"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateTaskForm from "./create-task-form";
import { useIsMobile } from "../../../hooks/use-mobile";

const CreateTaskDialog = (props: { projectId?: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button
              size={useIsMobile() ? "default" : "lg"}
              className="flex items-center gap-2 w-full sm:w-auto rounded-xl bg-gradient-to-tr from-black to-gray-700 hover:from-gray-800 hover:to-gray-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0 transform-gpu hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Task
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] sm:max-h-auto my-2 sm:my-5 border border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden p-0">
          <CreateTaskForm projectId={props.projectId} onClose={onClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateTaskDialog;

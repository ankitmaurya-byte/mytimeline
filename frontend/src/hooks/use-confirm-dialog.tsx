import { useState } from 'react';

interface UseConfirmDialogReturn<T = any> {
  context: T | null;
  open: boolean;
  onOpenDialog: (context?: T) => void;
  onCloseDialog: () => void;
}

export default function useConfirmDialog<T = any>(): UseConfirmDialogReturn<T> {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<T | null>(null);

  const onOpenDialog = (contextData?: T) => {
    if (contextData) {
      setContext(contextData);
    }
    setOpen(true);
  };

  const onCloseDialog = () => {
    setOpen(false);
    setTimeout(() => setContext(null), 300); // Clear context after animation completes
  };

  return {
    context,
    open,
    onOpenDialog,
    onCloseDialog
  };
}

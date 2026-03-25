import React from 'react';
import KanbanBoardOptimized from './kanban-board-optimized';

// Re-export the optimized component as the default export
export default KanbanBoardOptimized;

// Re-export the sync hook for other components
export { useKanbanSync } from './use-kanban-board';

// Re-export utility functions for cross-component communication
export { triggerTaskUpdateEvent, triggerGlobalRefresh } from './kanban-utils';

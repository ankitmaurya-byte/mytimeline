import { create } from 'zustand';

interface CalendarSelectionState {
  selectedDate: Date | null;
  open: boolean;
  setDate: (d: Date | null) => void;
  toggle: (open?: boolean) => void;
}

export const useCalendarSelectionStore = create<CalendarSelectionState>((set) => ({
  selectedDate: null,
  open: false,
  setDate: (d) => set({ selectedDate: d }),
  toggle: (open) => set((s) => ({ open: open ?? !s.open })),
}));

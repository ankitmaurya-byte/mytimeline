import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationHistoryItem {
  id: string;
  type: 'user-online' | 'user-offline' | 'task-update' | 'project-update' | 'system' | 'custom';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

interface NotificationHistoryState {
  notifications: NotificationHistoryItem[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearOldNotifications: () => void;
  getUnreadNotifications: () => NotificationHistoryItem[];
  getRecentNotifications: (limit?: number) => NotificationHistoryItem[];
}

// Helper function to generate unique IDs
const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to check if notification is older than 2 days
const isOlderThan2Days = (timestamp: Date) => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  return timestamp < twoDaysAgo;
};

export const useNotificationHistoryStore = create<NotificationHistoryState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: NotificationHistoryItem = {
          ...notification,
          id: generateId(),
          timestamp: new Date(),
          read: false,
        };

        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications];
          const unreadCount = updatedNotifications.filter(n => !n.read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });

        // Clean up old notifications after adding new one
        get().clearOldNotifications();
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          );
          const unreadCount = updatedNotifications.filter(n => !n.read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => {
          const updatedNotifications = state.notifications.map(notification => ({
            ...notification,
            read: true,
          }));
          
          return {
            notifications: updatedNotifications,
            unreadCount: 0,
          };
        });
      },

      clearOldNotifications: () => {
        set((state) => {
          const filteredNotifications = state.notifications.filter(
            notification => !isOlderThan2Days(notification.timestamp)
          );
          const unreadCount = filteredNotifications.filter(n => !n.read).length;
          
          return {
            notifications: filteredNotifications,
            unreadCount,
          };
        });
      },

      getUnreadNotifications: () => {
        return get().notifications.filter(notification => !notification.read);
      },

      getRecentNotifications: (limit = 10) => {
        return get().notifications.slice(0, limit);
      },
    }),
    {
      name: 'notification-history-storage',
      // Only persist notifications, not the unread count (recalculated on load)
      partialize: (state) => ({ notifications: state.notifications }),
      // Recalculate unread count on hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.unreadCount = state.notifications.filter(n => !n.read).length;
          // Clean up old notifications on app start
          state.clearOldNotifications();
        }
      },
    }
  )
);









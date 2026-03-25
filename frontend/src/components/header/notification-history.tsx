"use client";

import { useState } from 'react';
import { Bell, Clock, User, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificationHistoryStore } from '@/stores/notification-history-store';
import { formatDistanceToNow } from 'date-fns';

export function NotificationHistory() {
    const [open, setOpen] = useState(false);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        getRecentNotifications,
    } = useNotificationHistoryStore();

    const recentNotifications = getRecentNotifications(20);

    const handleMarkAsRead = (id: string) => {
        markAsRead(id);
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'user-online':
                return <User className="h-4 w-4 text-green-500" />;
            case 'user-offline':
                return <User className="h-4 w-4 text-gray-500" />;
            case 'task-update':
                return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case 'project-update':
                return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
            case 'system':
                return <Bell className="h-4 w-4 text-orange-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'user-online':
                return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
            case 'user-offline':
                return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
            case 'task-update':
                return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
            case 'project-update':
                return 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20';
            case 'system':
                return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
            default:
                return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-8 w-8 sm:h-9 sm:w-9 p-0 touch-manipulation"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-xs flex items-center justify-center"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 sm:w-80 max-w-[90vw] p-0" align="end">
                <div className="flex items-center justify-between p-3 sm:p-4 pb-2">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="h-6 px-2 text-xs touch-manipulation"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <Separator />

                <ScrollArea className="h-64 sm:h-80 md:h-96">
                    {recentNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-4">
                            <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                All toast notifications will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {recentNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`relative border-l-4 rounded-r-lg p-2 sm:p-3 mb-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 touch-manipulation ${!notification.read ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'
                                        } ${getNotificationColor(notification.type)}`}
                                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm font-medium break-words ${!notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">
                                                {notification.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Clock className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">
                                                    {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {recentNotifications.length > 0 && (
                    <>
                        <Separator />
                        <div className="p-2 sm:p-3">
                            <p className="text-xs text-gray-500 text-center px-2">
                                Notifications older than 2 days are automatically removed
                            </p>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}

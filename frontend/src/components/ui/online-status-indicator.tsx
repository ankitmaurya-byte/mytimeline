"use client";
import React from 'react';
import { cn } from '@/lib/utils';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  lastSeen?: Date | null;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  isOnline,
  lastSeen,
  size = 'md',
  showTooltip = true,
  className
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const getStatusText = () => {
    if (isOnline) {
      return 'Online now';
    }
    
    if (!lastSeen) {
      return 'Last seen: Unknown';
    }

    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return 'Last seen: Just now';
    } else if (minutes < 60) {
      return `Last seen: ${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `Last seen: ${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `Last seen: ${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div 
      className={cn('relative', className)}
      title={showTooltip ? getStatusText() : undefined}
    >
      <div
        className={cn(
          'rounded-full border-2 border-white dark:border-gray-800 shadow-sm transition-all duration-300',
          sizeClasses[size],
          isOnline 
            ? 'bg-green-500 shadow-green-500/25 animate-pulse' 
            : 'bg-gray-400 dark:bg-gray-600'
        )}
      />
      {isOnline && (
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75',
            sizeClasses[size]
          )}
        />
      )}
    </div>
  );
};

export default OnlineStatusIndicator;

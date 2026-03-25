import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/profile-picture-utils";

interface ResponsiveAvatarProps {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
    showOnlineStatus?: boolean;
    isOnline?: boolean;
}

const sizeClasses = {
    xs: "h-4 w-4 text-[8px]", // 16px - for very small contexts
    sm: "h-6 w-6 text-[10px]", // 24px - for compact lists
    md: "h-8 w-8 text-xs", // 32px - default size
    lg: "h-10 w-10 text-sm", // 40px - for headers
    xl: "h-12 w-12 text-base", // 48px - for profile sections
    "2xl": "h-16 w-16 text-lg", // 64px - for large profile displays
};

const responsiveSizeClasses = {
    xs: "h-3 w-3 sm:h-4 sm:w-4 text-[6px] sm:text-[8px]",
    sm: "h-5 w-5 sm:h-6 sm:w-6 text-[8px] sm:text-[10px]",
    md: "h-7 w-7 sm:h-8 sm:w-8 text-[10px] sm:text-xs",
    lg: "h-9 w-9 sm:h-10 sm:w-10 text-xs sm:text-sm",
    xl: "h-11 w-11 sm:h-12 sm:w-12 text-sm sm:text-base",
    "2xl": "h-14 w-14 sm:h-16 sm:w-16 text-base sm:text-lg",
};

export const ResponsiveAvatar = React.forwardRef<
    React.ElementRef<typeof Avatar>,
    ResponsiveAvatarProps
>(({
    src,
    alt = "Avatar",
    fallback,
    size = "md",
    className,
    showOnlineStatus = false,
    isOnline = false,
    ...props
}, ref) => {
    const profilePictureUrl = getProfilePictureUrl(src, size);

    return (
        <div className="relative inline-block">
            <Avatar
                ref={ref}
                className={cn(
                    "ring-1 ring-border/20 shadow-sm",
                    responsiveSizeClasses[size],
                    className
                )}
                {...props}
            >
                <AvatarImage
                    src={profilePictureUrl || undefined}
                    alt={alt}
                    className="object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                <AvatarFallback className="font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {fallback || alt?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>

            {/* Online Status Indicator */}
            {showOnlineStatus && (
                <div className={cn(
                    "absolute bottom-0 right-0 rounded-full border-2 border-background",
                    size === "xs" && "w-1.5 h-1.5",
                    size === "sm" && "w-2 h-2",
                    size === "md" && "w-2.5 h-2.5",
                    size === "lg" && "w-3 h-3",
                    size === "xl" && "w-3.5 h-3.5",
                    size === "2xl" && "w-4 h-4",
                    isOnline
                        ? "bg-green-500 shadow-green-500/50"
                        : "bg-gray-400 shadow-gray-400/50"
                )} />
            )}
        </div>
    );
});

ResponsiveAvatar.displayName = "ResponsiveAvatar";

// Convenience components for common use cases
export const CompactAvatar = React.forwardRef<
    React.ElementRef<typeof ResponsiveAvatar>,
    Omit<ResponsiveAvatarProps, 'size'>
>((props, ref) => (
    <ResponsiveAvatar ref={ref} size="xs" {...props} />
));

export const SmallAvatar = React.forwardRef<
    React.ElementRef<typeof ResponsiveAvatar>,
    Omit<ResponsiveAvatarProps, 'size'>
>((props, ref) => (
    <ResponsiveAvatar ref={ref} size="sm" {...props} />
));

export const MediumAvatar = React.forwardRef<
    React.ElementRef<typeof ResponsiveAvatar>,
    Omit<ResponsiveAvatarProps, 'size'>
>((props, ref) => (
    <ResponsiveAvatar ref={ref} size="md" {...props} />
));

export const LargeAvatar = React.forwardRef<
    React.ElementRef<typeof ResponsiveAvatar>,
    Omit<ResponsiveAvatarProps, 'size'>
>((props, ref) => (
    <ResponsiveAvatar ref={ref} size="lg" {...props} />
));

export const ExtraLargeAvatar = React.forwardRef<
    React.ElementRef<typeof ResponsiveAvatar>,
    Omit<ResponsiveAvatarProps, 'size'>
>((props, ref) => (
    <ResponsiveAvatar ref={ref} size="xl" {...props} />
));

export const HeroAvatar = React.forwardRef<
    React.ElementRef<typeof ResponsiveAvatar>,
    Omit<ResponsiveAvatarProps, 'size'>
>((props, ref) => (
    <ResponsiveAvatar ref={ref} size="2xl" {...props} />
));

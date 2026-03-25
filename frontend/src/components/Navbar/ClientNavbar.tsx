"use client";

import React from "react";
import Link from "next/link";
import { useAuthContext } from "@/context/useAuthContext";
import buttonVariants from "../ui/button-variants";
import { ArrowRight } from "lucide-react";
import { NavigationMenuMain } from "./NavbarMain";
import ThemeSwitch from "./ThemeSwitch";
import Logo from "../logo";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// navigation links for unauthenticated users
const navLinks = [
    {
        title: "Features",
        href: "/features",
        children: [],
    },
    {
        title: "About",
        href: "/about",
        children: [],
    }
];

// Navigation links for authenticated users
const loggedInNavLinks = [
    {
        title: "Dashboard",
        href: "/workspace",
        children: [],
    },
    {
        title: "Tasks",
        href: "/workspace/tasks/tasks",
        children: [],
    },
    {
        title: "Settings",
        href: "workspace/settings/settings",
        children: [],
    }
];

// Wrapper component that handles auth context availability
const ClientNavbarWithAuth: React.FC = () => {
    const { isSignedIn } = useAuthContext();
    return <ClientNavbarContent isSignedIn={isSignedIn} />;
};

// Fallback component for when auth context is not available
const ClientNavbarWithoutAuth: React.FC = () => {
    return <ClientNavbarContent isSignedIn={false} />;
};

// Main navbar content component
const ClientNavbarContent: React.FC<{ isSignedIn: boolean }> = ({ isSignedIn }) => {
    // Next.js: If you want to hide the navbar on certain routes, use 'usePathname' from 'next/navigation' in a client component.

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="sticky h-14 md:px-8 px-2 inset-x-0 top-0 z-30 w-full backdrop-blur-lg transition-all"
        >
            <div className="flex h-14 items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                >
                    <Logo />
                </motion.div>

                {/* Mobile navigation - will be implemented later */}
                <div className="lg:hidden">
                    {/* MobileSidebar component will go here */}
                </div>

                <div className="flex sm:hidden items-center">
                    {!isSignedIn && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href={"/sign-up"}
                                className={cn(
                                    buttonVariants({
                                        size: "sm",
                                    })
                                )}
                            >
                                Sign-Up <ArrowRight className="ml-1.5 h-5 w-5" />
                            </Link>
                        </motion.div>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="hidden items-center space-x-4 sm:flex"
                >
                    {!isSignedIn ? (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                            >
                                <NavigationMenuMain navLinks={navLinks} />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    href={"/sign-up"}
                                    className={cn(
                                        buttonVariants({
                                            size: "sm",
                                        })
                                    )}
                                >
                                    Sign-Up <ArrowRight className="ml-1.5 h-5 w-5" />
                                </Link>
                            </motion.div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                        >
                            <NavigationMenuMain navLinks={loggedInNavLinks} />
                        </motion.div>
                    )}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ThemeSwitch />
                    </motion.div>
                </motion.div>
            </div>
        </motion.nav>
    );
};

// Export both versions
export default ClientNavbarWithAuth;
export { ClientNavbarWithoutAuth };

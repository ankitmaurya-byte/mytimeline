import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { serverFetchCurrentUser } from "@/lib/auth/server-auth";

async function getCurrentUser() {
    return serverFetchCurrentUser();
}

interface AuthLayoutProps {
    children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
    const user = await getCurrentUser();

    if (user) {
        redirect("/workspace");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {children}
        </div>
    );
}

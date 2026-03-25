"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ClientNavbarWithoutAuth = dynamic(() => import("@/components/Navbar/ClientNavbar").then(mod => ({ default: mod.ClientNavbarWithoutAuth })), { ssr: false });

export default function ClientNavbarWrapper() {
    return (
        <Suspense fallback={null}>
            <ClientNavbarWithoutAuth />
        </Suspense>
    );
}

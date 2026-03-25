// "use client";
import ClientNavbarWrapper from "./ClientNavbarWrapper";
import { Main } from "@/components/landing/Main";
import { LazyLandingComponents } from "@/components/landing/LazyLandingComponents";

export default async function Page() {
    // TODO: Optionally detect auth cookie server-side for redirect
    // Skipping server redirect (middleware will handle protected pages)

    // Only render for unauthenticated users
    return (
        <div className="min-h-screen w-full relative">
            {/* Light Theme - Teal Glow Background */}
            <div
                className="fixed inset-0 z-[-1] pointer-events-none dark:hidden"
                style={{
                    backgroundImage: `
                        radial-gradient(125% 125% at 50% 70%, #ffffff 40%, #14b8a6 100%)
                    `,
                    backgroundSize: "100% 100%",
                    backgroundAttachment: "fixed",
                }}
            />
            {/* Dark Theme - X Organizations Black Background with Top Glow */}
            <div
                className="fixed inset-0 z-[-1] pointer-events-none hidden dark:block"
                style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(120, 180, 255, 0.25), transparent 70%), #000000",
                    backgroundAttachment: "fixed",
                }}
            />
            <main className="relative flex flex-col gap-8 min-h-screen z-10">
                <ClientNavbarWrapper />
                <Main />
                <LazyLandingComponents />
            </main>
        </div>
    );
}

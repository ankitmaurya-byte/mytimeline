import { ReactNode } from 'react';

export default function InviteLayout({ children }: { children: ReactNode }) {
    return (
        <div className="invite-layout">
            {children}
        </div>
    );
}

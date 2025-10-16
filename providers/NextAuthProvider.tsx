"use client";

import { SessionProvider } from "next-auth/react";

type Props = {
    children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
    return (
        <SessionProvider 
            refetchInterval={5 * 60} // Refresh hver 5. minutt
            refetchOnWindowFocus={true}
        >
            {children}
        </SessionProvider>
    );
};

export const NextAuthProviderOriginal = ({ children }: Props) => {
    return <SessionProvider>{ children }</SessionProvider>;
};
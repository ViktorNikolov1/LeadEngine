import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "LeadEngine | Production-Ready Lead Generation",
    description: "Next-gen enterprise lead generation and automated outreach platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} bg-secondary-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 selection:bg-primary-500/10 selection:text-primary-700 min-h-screen font-medium transition-colors duration-300`}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
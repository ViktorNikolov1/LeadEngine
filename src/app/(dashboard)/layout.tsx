import Sidebar from "@/components/layouts/Sidebar";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen relative">
            <Sidebar />
            <main className="flex-1 lg:ml-72 p-6 lg:p-10 pt-24 lg:pt-10 transition-all duration-500 min-w-0">
                {children}
            </main>
        </div>
    );
}
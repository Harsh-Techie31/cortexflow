"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700">{user.email}</span>
                        <Button variant="outline" size="sm" onClick={logout}>
                            Log out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Welcome Card */}
                    <div className="col-span-full rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900">
                            Welcome back {user.email}!
                        </h2>
                        <p className="mt-1 text-gray-500">
                            Connect your tools to start searching your knowledge base.
                        </p>
                    </div>

                    {/* Integration Cards (Placeholders) */}
                    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">Gmail</h3>
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                Coming Soon
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Connect your Gmail account to search emails.
                        </p>
                        <div className="mt-4">
                            <Button disabled variant="outline" className="w-full">
                                Connect Gmail
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">GitHub</h3>
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                Coming Soon
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Connect your GitHub account to search repositories.
                        </p>
                        <div className="mt-4">
                            <Button disabled variant="outline" className="w-full">
                                Connect GitHub
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

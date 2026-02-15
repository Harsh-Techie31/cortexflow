"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { user, loading, logout, getToken } = useAuth();
    const router = useRouter();
    const [backendStatus, setBackendStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const testBackend = async () => {
        setBackendStatus("Testing connection...");
        try {
            const token = await getToken();
            if (!token) {
                setBackendStatus("Error: No token available");
                return;
            }

            console.log(token);
            const res = await fetch("http://localhost:5000/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setBackendStatus(`Success: ${data.message} (Mongo ID: ${data.user._id})`);
            } else {
                setBackendStatus(`Error: ${res.statusText}`);
            }
        } catch (err: any) {
            setBackendStatus(`Error: ${err.message}`);
        }
    };

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
                {/* Backend Status Check */}
                <div className="mb-6 rounded-lg bg-indigo-50 p-4 border border-indigo-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-indigo-800">System Status</h3>
                            <p className="text-sm text-indigo-600 mt-1">
                                {backendStatus || "Backend connection not tested yet."}
                            </p>
                        </div>
                        <Button size="sm" onClick={testBackend}>
                            Test Connection
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Welcome Card */}
                    <div className="col-span-full rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900">
                            Welcome back!
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

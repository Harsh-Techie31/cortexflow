"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { user, loading, logout, getToken } = useAuth();
    const router = useRouter();
    const [backendStatus, setBackendStatus] = useState<string | null>(null);
    const [googleIntegration, setGoogleIntegration] = useState<{
        connected: boolean;
        profile: { name: string; picture: string; email: string } | null;
    } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }

        if (user) {
            testBackend(); // Auto-sync user with MongoDB
            fetchGoogleStatus();
        }

        // Check for integration status in URL (from callback)
        const params = new URLSearchParams(window.location.search);
        const integration = params.get('integration');
        const status = params.get('status');

        if (integration === 'google') {
            if (status === 'success') {
                setBackendStatus("Successfully connected Gmail!");
                fetchGoogleStatus();
            } else if (status === 'error') {
                setBackendStatus("Failed to connect Gmail. Please try again.");
            }
            // Clean up URL
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    const fetchGoogleStatus = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const res = await fetch(`http://localhost:5000/auth/google/status?token=${token}`);
            if (res.ok) {
                const data = await res.json();
                setGoogleIntegration(data);
            }
        } catch (err) {
            console.error("Error fetching Google status:", err);
        }
    };

    const connectGmail = async () => {
        try {
            const token = await getToken();
            if (!token) {
                setBackendStatus("Error: No auth token");
                return;
            }

            const res = await fetch(`http://localhost:5000/auth/google/auth?token=${token}`);
            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                setBackendStatus("Error: Could not get auth URL from backend");
            }
        } catch (err: any) {
            setBackendStatus(`Error: ${err.message}`);
        }
    };

    const testBackend = async () => {
        setBackendStatus("Testing connection...");
        try {
            const token = await getToken();
            if (!token) {
                setBackendStatus("Error: No token available");
                return;
            }

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

    const syncEmails = async () => {
        setIsSyncing(true);
        setSyncStatus("Fetching and vectorizing emails...");
        try {
            const token = await getToken();
            if (!token) {
                setSyncStatus("Error: No auth token");
                return;
            }

            const res = await fetch("http://localhost:5000/api/ingest/gmail", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            if (res.ok) {
                setSyncStatus(`Successfully ingested ${data.emailsCount} emails (${data.chunksCount} searchable chunks).`);
            } else {
                setSyncStatus(`Error: ${data.message || res.statusText}`);
            }
        } catch (err: any) {
            setSyncStatus(`Error: ${err.message}`);
        } finally {
            setIsSyncing(false);
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
        return null;
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
                {/* System Status Check */}
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

                    {/* Gmail Integration Card */}
                    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">Gmail</h3>
                            {googleIntegration?.connected ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    Connected
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                    Available
                                </span>
                            )}
                        </div>

                        {googleIntegration?.connected ? (
                            <div className="mt-4 flex items-center gap-3">
                                {googleIntegration.profile?.picture && (
                                    <img
                                        src={googleIntegration.profile.picture}
                                        alt="Google Profile"
                                        className="h-10 w-10 rounded-full border border-gray-100 shadow-sm"
                                    />
                                )}
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {googleIntegration.profile?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {googleIntegration.profile?.email}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-gray-500">
                                Connect your Gmail account to search emails.
                            </p>
                        )}

                        <div className="mt-4 space-y-3">
                            {!googleIntegration?.connected ? (
                                <Button onClick={connectGmail} variant="outline" className="w-full">
                                    Connect Gmail
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={syncEmails}
                                        disabled={isSyncing}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {isSyncing ? "Syncing..." : "Sync Last 30 Emails"}
                                    </Button>
                                    {syncStatus && (
                                        <p className={`text-xs mt-2 ${syncStatus.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                                            {syncStatus}
                                        </p>
                                    )}
                                    <Button disabled variant="ghost" className="w-full text-green-600 cursor-default text-xs h-auto py-1">
                                        Connected Already!
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* GitHub Placeholder */}
                    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 opacity-60">
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

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
        initialSyncDone: boolean;
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
                // Update local state to reflect sync is done
                setGoogleIntegration(prev => prev ? { ...prev, initialSyncDone: true } : null);
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
        <div className="flex h-screen bg-[#0A0A0B] text-white overflow-hidden">
            {/* --- SIDEBAR --- */}
            <aside className="w-72 border-r border-white/10 bg-[#0F0F11] flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        Cortex Flow
                    </h1>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 space-y-6">
                    {/* Integrations Section */}
                    <div>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                            Integrations
                        </h2>
                        
                        <div className="space-y-3">
                            {/* Gmail Integration Item */}
                            <div className="rounded-xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                        <span className="text-sm font-medium">Gmail</span>
                                    </div>
                                    {googleIntegration?.connected && (
                                        <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                                            Active
                                        </span>
                                    )}
                                </div>

                                {!googleIntegration?.connected ? (
                                    <Button onClick={connectGmail} variant="outline" size="sm" className="w-full text-xs h-8 border-white/10 hover:bg-white/5">
                                        Connect
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            {googleIntegration.profile?.picture && (
                                                <img src={googleIntegration.profile.picture} className="w-6 h-6 rounded-full border border-white/10" alt="" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-300 truncate">{googleIntegration.profile?.email}</p>
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            onClick={syncEmails} 
                                            disabled={isSyncing}
                                            className="w-full h-8 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {isSyncing ? "Syncing..." : googleIntegration.initialSyncDone ? "Sync New" : "Initial Sync"}
                                        </Button>
                                        
                                        {googleIntegration.initialSyncDone && !syncStatus && (
                                            <p className="text-[10px] text-center text-indigo-400">Processed past mails ✨</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* GitHub Placeholder */}
                            <div className="rounded-xl border border-white/5 bg-white/5 p-4 opacity-50 cursor-not-allowed">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                        <span className="text-sm font-medium">GitHub</span>
                                    </div>
                                    <span className="text-[9px] text-gray-400">Soon</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Status Section */}
                    <div className="pt-4 border-t border-white/5">
                         <div className="px-2 py-2">
                            <button onClick={testBackend} className="text-[11px] text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${backendStatus?.includes('Success') ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                {backendStatus?.includes('Success') ? 'Backend: Connected' : 'Check System Status'}
                            </button>
                         </div>
                    </div>
                </nav>

                {/* User Info (Bottom) */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium truncate">{user.email}</span>
                            <span className="text-[10px] text-gray-500">Free Plan</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={logout} className="h-8 w-8 text-gray-500 hover:text-white">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CHAT AREA --- */}
            <main className="flex-1 flex flex-col relative bg-[#0D0D0F]">
                {/* Chat Header */}
                <header className="h-16 border-b border-white/5 flex items-center px-8 justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-300">New Research Session</span>
                    </div>
                </header>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-4xl mx-auto w-full">
                    {/* Welcome Message */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">C</span>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm leading-relaxed text-gray-300">
                                Hello! I'm your **Cortex Assistant**. I can search across your connected tools like Gmail to answer complex questions.
                            </p>
                            <p className="text-xs text-gray-500">
                                Ask me anything about your emails, contacts, or documents.
                            </p>
                        </div>
                    </div>

                    {/* Integration Sync Alert if needed */}
                    {syncStatus && (
                        <div className="rounded-lg bg-indigo-600/10 border border-indigo-600/20 p-4">
                            <p className="text-xs text-indigo-400 flex items-center gap-2">
                                <span className="animate-pulse">●</span> {syncStatus}
                            </p>
                        </div>
                    )}
                </div>

                {/* Chat Input (Bottom) */}
                <div className="p-8 pt-0 max-w-4xl mx-auto w-full">
                    <div className="relative group">
                        <textarea 
                            placeholder="Ask a question about your data..."
                            rows={1}
                            className="w-full bg-[#161618] border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none shadow-2xl"
                        />
                        <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all disabled:opacity-50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-4 text-center">
                        Cortex Flow can make mistakes. Verify important information.
                    </p>
                </div>
            </main>
        </div>
    );
}

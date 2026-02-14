"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signup: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    getToken: () => Promise<string | null>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email: string, password: string) => {
        setError(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            const firebaseError = err as AuthError;
            setError(firebaseError.message);
            throw err;
        }
    };

    const login = async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            const firebaseError = err as AuthError;
            setError(firebaseError.message);
            throw err;
        }
    };

    const logout = async () => {
        setError(null);
        try {
            await signOut(auth);
        } catch (err) {
            const firebaseError = err as AuthError;
            setError(firebaseError.message);
            throw err;
        }
    };

    const getToken = async () => {
        if (!user) return null;
        try {
            return await user.getIdToken();
        } catch (err) {
            console.error("Error getting token", err);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout, getToken, error }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

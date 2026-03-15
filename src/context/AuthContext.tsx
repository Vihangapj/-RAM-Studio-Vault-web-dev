import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    isAdmin: boolean;
    adminLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    isAdmin: false
    , adminLoading: true
});

export const useAuth = () => useContext(AuthContext);

// ADMIN EMAILS REMOVED - Using 'admins' collection in Firestore


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminLoading, setAdminLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);

            // Stop blocking UI; show app immediately and check admin status in background.
            setLoading(false);

            if (user) {
                setAdminLoading(true);
                (async () => {
                    try {
                        const adminDocRef = doc(db, 'admins', user.uid);

                        // race between getDoc and a short timeout; on timeout resolve to null
                        const adminDoc = await Promise.race([
                            getDoc(adminDocRef),
                            new Promise(resolve => setTimeout(() => resolve(null), 3000))
                        ]) as any | null;

                        if (adminDoc && typeof adminDoc.exists === 'function') {
                            setIsAdmin(adminDoc.exists());
                        } else {
                            // timeout or no document => not admin (no noisy error)
                            setIsAdmin(false);
                        }
                    } catch (error) {
                        console.error("Error checking admin status:", error);
                        setIsAdmin(false);
                    } finally {
                        setAdminLoading(false);
                    }
                })();
            } else {
                setIsAdmin(false);
                setAdminLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        isAdmin,
        adminLoading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

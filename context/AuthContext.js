'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    const loginAsGuest = (name = 'Guest Architect') => {
        const guestData = {
            uid: `guest-${Math.random().toString(36).substr(2, 9)}`,
            displayName: name,
            email: 'guest@example.com',
            photoURL: '/avatar.png',
            emailVerified: true
        };
        const guestUserData = {
            coachGender: 'male', // Default for guest
            fullName: name,
            email: 'guest@example.com'
        };
        setIsGuest(true);
        setUser(guestData);
        setUserData(guestUserData);
        localStorage.setItem('aninterview_guest', JSON.stringify(guestData));
        localStorage.setItem('aninterview_guest_data', JSON.stringify(guestUserData));
    };

    const logout = () => {
        setIsGuest(false);
        setUser(null);
        setUserData(null);
        localStorage.removeItem('aninterview_guest');
        localStorage.removeItem('aninterview_guest_data');
        auth.signOut();
    };

    const updateUserData = (newData) => {
        setUserData(prev => {
            const updated = { ...prev, ...newData };
            if (isGuest) {
                localStorage.setItem('aninterview_guest_data', JSON.stringify(updated));
            }
            return updated;
        });
    };

    const refreshUser = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            setUser({ ...auth.currentUser });
        }
    };

    useEffect(() => {
        // Hydrate Guest Session
        const storedGuest = localStorage.getItem('aninterview_guest');
        const storedGuestData = localStorage.getItem('aninterview_guest_data');
        if (storedGuest && storedGuestData) {
            const guestData = JSON.parse(storedGuest);
            const guestUserData = JSON.parse(storedGuestData);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUser(guestData);
            setUserData(guestUserData);
            setIsGuest(true);
            setLoading(false);
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setIsGuest(false);
                localStorage.removeItem('aninterview_guest');
                localStorage.removeItem('aninterview_guest_data');
                // Fetch user data from Firestore asynchronously without blocking
                getDoc(doc(db, 'users', firebaseUser.uid)).then(userDoc => {
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    } else {
                        setUserData({ coachGender: 'female' });
                    }
                }).catch(error => {
                    console.error('Error fetching user data:', error);
                    setUserData({ coachGender: 'female' });
                });
                setLoading(false);
            } else {
                // Only clear if not in guest mode
                const stillGuest = localStorage.getItem('aninterview_guest');
                if (!stillGuest) {
                    setUser(null);
                    setUserData(null);
                }
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData, loading, isGuest, loginAsGuest, logout, refreshUser, updateUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

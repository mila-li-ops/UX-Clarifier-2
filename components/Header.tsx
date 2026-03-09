"use client";

import { Sparkles, LogIn, LogOut, User } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-700 text-sm tracking-tight">UX Clarifier</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                  <span className="text-sm text-slate-600 hidden sm:block">{user.displayName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleSignIn}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign in with Google
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we've actually checked authentication and user is logged in
    if (isLoading === false && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Welcome page for unauthenticated users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">CloudArc</h1>
        <p className="text-muted-foreground mb-8">Your premium cloud storage solution</p>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/auth/register')}
            className="w-full bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

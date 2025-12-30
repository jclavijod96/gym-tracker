'use client';

import { db } from '@/lib/db';
import { Auth } from '@/components/Auth';
import { Onboarding } from '@/components/Onboarding';
import { Dashboard } from '@/components/Dashboard';
import { LoadingScreen } from '@/components/ui';

export default function Home() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();

  // Query user's profile to check if onboarding is complete
  const { isLoading: profileLoading, data: profileData } = db.useQuery(
    user ? { profiles: { $: { where: { 'user.id': user.id } } } } : null
  );

  // Show loading while checking auth
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth />;
  }

  // Show loading while checking profile
  if (profileLoading) {
    return <LoadingScreen />;
  }

  // Show onboarding if no profile exists
  const profile = profileData?.profiles?.[0];
  if (!profile) {
    return <Onboarding userId={user.id} userEmail={user.email || ''} />;
  }

  // Show main dashboard
  return <Dashboard user={{ id: user.id, email: user.email || '' }} />;
}

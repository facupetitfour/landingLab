// app/dashboard/layout.tsx
import { createUserProfile, getProfileByUserId } from '@/lib/user/user_lib';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let profile;
  let requiresSubscriptionRedirect = false;

  try {
    // Asegúrate de que esta función busque en la BD por `clerkUserId`
    profile = await getProfileByUserId(userId);

    if (!profile) {
      const user = await currentUser();

      if (!user) throw new Error("Sesión de Clerk no encontrada");

      profile = await createUserProfile(
        userId,
        user.emailAddresses?.[0]?.emailAddress || '',
        `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        user.imageUrl || null
      );
    }

    // Check subscription status
    const subscription = await prisma.subscription.findUnique({
      where: { userId: profile.id }
    });

    if (!subscription || subscription.status !== 'authorized') {
      requiresSubscriptionRedirect = true;
    }

  } catch (error) {
    console.error('[Dashboard Layout] Error verificando perfil:', error);
  }

  // Redirección fuera del try-catch para no romper Next.js
  if (requiresSubscriptionRedirect) {
    redirect('/suscribir');
  }

  return <>{children}</>;
}
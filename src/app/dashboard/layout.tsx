import { createProfileFunction, existingProfileFunction } from '@/lib/user/user_lib';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let isSubscribed = false;

  // Fallback Sync: For local development sin webhooks o usuarios existentes
  // Verificamos si el perfil existe, sino, lo creamos.
  try {
    let existingProfile = await existingProfileFunction(userId);

    if (!existingProfile) {
      const user = await currentUser();
      if (user) {
        const email = user.emailAddresses?.[0]?.emailAddress || '';
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const avatarUrl = user.imageUrl || null;

        existingProfile = await createProfileFunction(userId, email, fullName, avatarUrl)
      }
    }

    if (existingProfile) {
      isSubscribed = existingProfile.isSubscribed;
    }
  } catch (error) {
    console.error('[Dashboard Layout] Error verificando perfil de usuario:', error);
  }

  if (!isSubscribed) {
    redirect('/suscribir');
  }

  return <>{children}</>;
}

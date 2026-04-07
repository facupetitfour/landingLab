import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
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
    let existingProfile = await prisma.profile.findUnique({
      where: { id: userId }
    });

    if (!existingProfile) {
      const user = await currentUser();
      if (user) {
        const email = user.emailAddresses?.[0]?.emailAddress || '';
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const avatarUrl = user.imageUrl || null;

        existingProfile = await prisma.profile.create({
          data: {
            id: userId,
            email,
            fullName: fullName || email.split('@')[0],
            avatarUrl,
          }
        });
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

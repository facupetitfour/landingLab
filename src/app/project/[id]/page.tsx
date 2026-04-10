import { redirect } from 'next/navigation';
import { getProjectStateAction } from '@/app/actions/project-actions';
import ClientChat from './client-chat';

export default async function ChatBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;
  
  let initialData = null;
  let shouldRedirectRoute = '';

  try {
    initialData = await getProjectStateAction(projectId);
    
    if (initialData.status === 'completed' || initialData.status === 'editing') {
      shouldRedirectRoute = `/project/${projectId}/results`;
    }
  } catch (error) {
    console.error('Error fetching project:', error);
    shouldRedirectRoute = '/dashboard';
  }

  // Use the safe redirect outside try-catch as specified
  if (shouldRedirectRoute) {
    redirect(shouldRedirectRoute);
  }

  return <ClientChat projectId={projectId} initialData={initialData} />;
}

import { redirect } from 'next/navigation';
import { getProjectStateAction } from '@/app/actions/project-actions';
import ClientResults from './client-results';

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;
  
  let initialData = null;
  let shouldRedirectRoute = '';

  try {
    initialData = await getProjectStateAction(projectId);
    
    if (initialData.status !== 'completed' && initialData.status !== 'editing') {
      shouldRedirectRoute = `/project/${projectId}`;
    }
  } catch (error) {
    console.error('Error fetching project results:', error);
    shouldRedirectRoute = '/dashboard';
  }

  // Use the safe redirect outside try-catch as specified
  if (shouldRedirectRoute) {
    redirect(shouldRedirectRoute);
  }

  return <ClientResults projectId={projectId} initialData={initialData} />;
}

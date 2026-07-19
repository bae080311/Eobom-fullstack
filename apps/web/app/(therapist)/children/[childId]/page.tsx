import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ChildResponseDto } from '@eobom/shared';
import { fetchChildDetail } from '@/entities/child';
import { ChildDetailView } from '@/widgets/child-detail';
import { TherapistChildActions } from '@/features/manage-child';

export const metadata: Metadata = { title: '아동 상세' };

interface Props {
  params: Promise<{ childId: string }>;
}

export default async function TherapistChildDetailPage({ params }: Props) {
  const { childId } = await params;
  const token = (await cookies()).get('eobom_access')?.value ?? '';

  let child: ChildResponseDto;
  try {
    child = await fetchChildDetail(token, childId);
  } catch {
    notFound();
  }

  return (
    <ChildDetailView
      child={child}
      backHref="/children"
      footer={
        <TherapistChildActions
          childId={child.id}
          name={child.name}
          birthDate={child.birthDate}
          memo={child.memo}
        />
      }
    />
  );
}

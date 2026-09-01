import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { OrgMemberRole } from '@eobom/shared';
import type { ChildResponseDto, OrganizationResponseDto } from '@eobom/shared';
import { fetchChildDetail } from '@/entities/child';
import { fetchMyOrganization, fetchOrganizationMembers } from '@/entities/organization';
import { ChildDetailView } from '@/widgets/child-detail';
import { TherapistChildActions } from '@/features/manage-child';
import { IssueInviteCodeButton } from '@/features/issue-invite-code';

export const metadata: Metadata = { title: '아동 상세' };

interface Props {
  params: Promise<{ childId: string }>;
}

export default async function TherapistChildDetailPage({ params }: Props) {
  const { childId } = await params;
  const token = (await cookies()).get('eobom_access')?.value ?? '';

  // 서로 독립적인 요청이므로 병렬로 시작한다 (아동 조회 실패는 아래 catch에서 notFound 처리).
  let child: ChildResponseDto;
  let organization: OrganizationResponseDto | null;
  try {
    [child, organization] = await Promise.all([
      fetchChildDetail(token, childId),
      token ? fetchMyOrganization(token) : Promise.resolve(null),
    ]);
  } catch {
    notFound();
  }

  const members = organization ? await fetchOrganizationMembers(token, organization.id) : [];

  const isOwner = organization?.membership.role === OrgMemberRole.OWNER;
  const myMembership = organization
    ? members.find((member) => member.id === organization.membership.id)
    : undefined;
  const isCurrentPrimaryTherapist =
    myMembership !== undefined && myMembership.therapistProfileId === child.primaryTherapistId;
  const canReassignPrimaryTherapist = isOwner || isCurrentPrimaryTherapist;

  return (
    <ChildDetailView
      child={child}
      backHref="/children"
      inviteCodeAction={<IssueInviteCodeButton childId={child.id} />}
      footer={
        <TherapistChildActions
          childId={child.id}
          name={child.name}
          birthDate={child.birthDate}
          memo={child.memo}
          currentPrimaryTherapistId={child.primaryTherapistId}
          members={members}
          canReassignPrimaryTherapist={canReassignPrimaryTherapist}
        />
      }
    />
  );
}

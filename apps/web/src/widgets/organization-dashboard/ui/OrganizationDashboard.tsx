import type { OrganizationResponseDto, MemberResponseDto } from '@eobom/shared';
import { JoinCodeCard, MemberRow } from '@/entities/organization';
import { SectionHeader } from '@/shared/ui';
import { EditOrganizationButton } from '@/features/edit-organization';
import { RotateJoinCodeButton } from '@/features/rotate-join-code';
import { MemberActions } from '@/features/manage-organization-member';
import type { Translate } from '@/shared/lib/i18n';

interface Props {
  organization: OrganizationResponseDto;
  members: MemberResponseDto[];
  // 페이지(Server Component)에서 getTranslations('entities.organization')로 미리 구한 번역기.
  t: Translate;
}

const CARD = 'rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]';

export function OrganizationDashboard({ organization, members, t }: Props) {
  return (
    <>
      <section className="px-5 mt-1">
        <SectionHeader
          title="기관 정보"
          right={<EditOrganizationButton orgId={organization.id} name={organization.name} />}
        />
        <div className={`${CARD} p-5`}>
          <p className="text-title font-bold tracking-tighter text-gray-900 m-0">
            {organization.name}
          </p>
        </div>
      </section>

      <section className="px-5 mt-7">
        <SectionHeader title="참여 코드" />
        <JoinCodeCard
          joinCode={organization.joinCode}
          label={t('joinCode')}
          actions={<RotateJoinCodeButton orgId={organization.id} />}
        />
      </section>

      <section className="px-5 mt-7">
        <SectionHeader
          title="멤버"
          right={<span className="text-body2 text-gray-600 font-medium">{members.length}명</span>}
        />
        <div className={`${CARD} px-5`}>
          {members.length === 0 ? (
            <p className="py-8 text-center text-body text-gray-600">소속된 멤버가 없어요</p>
          ) : (
            members.map((member, index) => (
              <div key={member.id}>
                {index > 0 && <hr className="border-0 border-t border-gray-100 m-0" />}
                <MemberRow
                  member={member}
                  isSelf={member.id === organization.membership.id}
                  t={t}
                  actions={
                    <MemberActions
                      orgId={organization.id}
                      member={member}
                      isSelf={member.id === organization.membership.id}
                    />
                  }
                />
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

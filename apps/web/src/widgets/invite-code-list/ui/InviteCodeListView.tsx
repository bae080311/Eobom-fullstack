import type { ChildResponseDto, InviteCodeResponseDto } from '@eobom/shared';
import { InviteCodeRow, getEffectiveInviteCodeStatus } from '@/entities/invite-code';
import { InviteCodeStatus } from '@eobom/shared';
import { SectionHeader } from '@/shared/ui';
import { IssueInviteCodeButton } from '@/features/issue-invite-code';
import { RevokeInviteCodeButton } from '@/features/revoke-invite-code';
import type { Translate } from '@/shared/lib/i18n';

interface Props {
  items: ChildResponseDto[];
  codes: InviteCodeResponseDto[];
  // 페이지(Server Component)에서 getTranslations('entities.inviteCode')로 미리 구한 번역기.
  t: Translate;
  // 페이지(Server Component)에서 getTranslations('widgets.inviteCodeList')로 미리 구한 번역기.
  tWidget: Translate;
}

interface ChildGroup {
  id: string;
  name: string;
  canIssue: boolean;
}

const CARD = 'rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]';

// 담당 배정이 바뀌어 items(현재 담당 아동)에서 빠진 아동이라도, 과거 발급한 코드는
// codes에 계속 남아있으므로 items만 순회하면 화면에서 사라져 취소할 방법이 없어진다.
// items ∪ codes의 child를 합쳐 그룹을 만들되, 발급 버튼은 현재 담당 아동에만 노출한다.
function buildChildGroups(items: ChildResponseDto[], codes: InviteCodeResponseDto[]): ChildGroup[] {
  const groups = new Map<string, ChildGroup>();
  for (const child of items) {
    groups.set(child.id, { id: child.id, name: child.name, canIssue: true });
  }
  for (const code of codes) {
    if (code.child && !groups.has(code.child.id)) {
      groups.set(code.child.id, { id: code.child.id, name: code.child.name, canIssue: false });
    }
  }
  return Array.from(groups.values());
}

export function InviteCodeListView({ items, codes, t, tWidget }: Props) {
  const groups = buildChildGroups(items, codes);

  if (groups.length === 0) {
    return (
      <p className="px-5 py-16 text-center text-body text-gray-600">{tWidget('noChildren')}</p>
    );
  }

  return (
    <>
      {groups.map((child) => {
        const childCodes = codes.filter((code) => code.child?.id === child.id);
        return (
          <section key={child.id} className="px-5 mt-7">
            <SectionHeader
              title={child.name}
              right={child.canIssue ? <IssueInviteCodeButton childId={child.id} /> : undefined}
            />
            <div className={`${CARD} px-5`}>
              {childCodes.length === 0 ? (
                <p className="py-8 text-center text-body text-gray-600">{tWidget('noCodes')}</p>
              ) : (
                childCodes.map((code, index) => (
                  <div key={code.id}>
                    {index > 0 && <hr className="border-0 border-t border-gray-100 m-0" />}
                    <InviteCodeRow
                      code={code}
                      t={t}
                      actions={
                        getEffectiveInviteCodeStatus(code) === InviteCodeStatus.ACTIVE ? (
                          <RevokeInviteCodeButton id={code.id} />
                        ) : undefined
                      }
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

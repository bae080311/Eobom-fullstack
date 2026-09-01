import type { Metadata } from 'next';
import { PageShell, PageTopBar, IconLink, IconArrowLeft } from '@/shared/ui';
import { RedeemInviteCodeForm } from '@/features/use-invite-code';

export const metadata: Metadata = { title: '초대코드 입력' };

export default function RedeemPage() {
  return (
    <PageShell>
      <PageTopBar
        title="초대코드 입력"
        subtitle="치료사에게 받은 코드를 입력해주세요"
        back={
          <IconLink label="내 정보로" href="/me">
            <IconArrowLeft size={18} />
          </IconLink>
        }
      />
      <RedeemInviteCodeForm />
    </PageShell>
  );
}

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/entities/organization', () => ({
  useUpdateOrganization: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { EditOrganizationButton } from './EditOrganizationButton';

describe('EditOrganizationButton', () => {
  it('클릭 시 기관 이름 수정 폼이 열린다', async () => {
    const user = userEvent.setup();
    render(<EditOrganizationButton orgId="org1" name="맑은소리 언어치료센터" />);

    await user.click(screen.getByRole('button', { name: /수정/ }));
    expect(screen.getByText('기관 이름 수정')).toBeInTheDocument();
  });
});

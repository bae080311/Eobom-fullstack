'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { tokenStorage } from '@/features/auth/model/tokenStorage';
import type {
  UpdateOrganizationDto,
  UpdateMembershipDto,
  OrganizationResponseDto,
  MemberResponseDto,
  RotateJoinCodeResponseDto,
} from '@eobom/shared';

export const organizationKeys = {
  all: ['organization'] as const,
  members: (orgId: string) => ['organization', orgId, 'members'] as const,
};

export function useUpdateOrganization(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateOrganizationDto) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.patch<OrganizationResponseDto>(`/organizations/${orgId}`, dto, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

export function useRotateJoinCode(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const token = tokenStorage.getAccess() ?? '';
      return api.post<RotateJoinCodeResponseDto>(
        `/organizations/${orgId}/join-code:rotate`,
        undefined,
        { token },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

export function useUpdateMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, dto }: { membershipId: string; dto: UpdateMembershipDto }) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.patch<MemberResponseDto>(`/organizations/${orgId}/members/${membershipId}`, dto, {
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}

export function useLeaveMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => {
      const token = tokenStorage.getAccess() ?? '';
      return api.post<void>(`/organizations/${orgId}/members/${membershipId}:leave`, undefined, {
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}

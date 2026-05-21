export interface CreateChildDto {
  name: string;
  birthDate?: string;
}

export interface UpdateChildDto {
  name?: string;
  birthDate?: string;
}

export interface CreateInviteCodeDto {
  childId: string;
  expiresInDays?: number;
}

export interface UseInviteCodeDto {
  code: string;
}

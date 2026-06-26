export interface CreateChildDto {
  name: string;
  birthDate?: string;
  memo?: string;
  primaryTherapistId?: string | null;
}

export interface UpdateChildDto {
  name?: string;
  birthDate?: string;
  memo?: string;
}

export interface ChildResponseDto {
  id: string;
  name: string;
  birthDate: string | null;
  memo: string | null;
  nextSessionAt: string | null;
}

export interface SetPrimaryTherapistDto {
  primaryTherapistId: string;
}

export interface UserWithProfile {
  id: string;
  name: string;
  email: string;
  role: 'THERAPIST' | 'PARENT';
  therapistProfile: {
    licenseNumber: string | null;
  } | null;
}

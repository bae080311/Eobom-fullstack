export interface UserWithProfile {
  id: string;
  name: string;
  email: string;
  role: 'THERAPIST' | 'PARENT';
  createdAt: string;
  therapistProfile: {
    licenseNumber: string | null;
  } | null;
  parentProfile: {
    phoneNumber: string | null;
  } | null;
}

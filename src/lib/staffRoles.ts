export type StaffRoleId = 'teacher' | 'diagnost' | 'admin' | 'it';

export interface StaffRole {
  id: StaffRoleId;
  label: string;
  icon: 'GraduationCap' | 'Stethoscope' | 'ShieldCheck' | 'Code';
}

export const STAFF_ROLES: StaffRole[] = [
  { id: 'teacher', label: 'Педагог', icon: 'GraduationCap' },
  { id: 'diagnost', label: 'Диагност', icon: 'Stethoscope' },
  { id: 'admin', label: 'Администратор', icon: 'ShieldCheck' },
  { id: 'it', label: 'IT-разработчик', icon: 'Code' },
];

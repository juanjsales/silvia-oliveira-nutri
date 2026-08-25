import type { Database } from '../database/pool.js';

export type ClinicIdentity = {
  clinicName: string;
  professionalName: string;
  specialty: string;
  crn: string;
};

const fallback: ClinicIdentity = {
  clinicName: 'Consultório Nutricional',
  professionalName: 'Sua nutricionista',
  specialty: 'Nutrição e Saúde',
  crn: '',
};

export async function loadClinicIdentity(db: Database): Promise<ClinicIdentity> {
  const result = await db.query<ClinicIdentity>(`SELECT clinic_name AS "clinicName",
    professional_name AS "professionalName", specialty, crn
    FROM clinic_settings WHERE singleton=true`);
  return { ...fallback, ...result.rows[0] };
}

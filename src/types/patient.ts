export interface Patient {
  patient_id: string;
  age?: number;
  temperature?: number;
  blood_pressure?: string;
}

export interface PatientRisk {
  high_risk_patients: string[];
  fever_patients: string[];
  data_quality_issues: string[];
}

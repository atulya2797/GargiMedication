export type Medicine = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  notes?: string;
  active: boolean;
};

export type MedicationLog = {
  id: string;
  medicineId: string;
  takenAt: string;
  date: string;
};

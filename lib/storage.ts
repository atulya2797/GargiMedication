import { Medicine, MedicationLog } from './types';

const MEDS = 'for-her-medicines-v2';
const LOGS = 'for-her-logs-v2';

export const starterMedicines: Medicine[] = [
  { id: 'd3', name: 'D3', dosage: '', time: '09:00', active: true },
  { id: 'b12', name: 'B12', dosage: '', time: '09:00', active: true },
  { id: 'iron', name: 'Iron', dosage: '', time: '09:00', active: true },
  { id: 'calcium', name: 'Calcium', dosage: '', time: '14:00', active: true },
  { id: 'multivitamin', name: 'MultiVitamin', dosage: '', time: '14:00', active: true },
  { id: 'allegra', name: 'Allegra', dosage: '', time: '21:00', active: true },
  { id: 'magnesium', name: 'Magnesium', dosage: '', time: '21:00', active: true },
];

export function loadMedicines(): Medicine[] {
  if (typeof window === 'undefined') return starterMedicines;
  const raw = localStorage.getItem(MEDS);
  if (!raw) {
    localStorage.setItem(MEDS, JSON.stringify(starterMedicines));
    return starterMedicines;
  }
  try { return JSON.parse(raw); } catch { return starterMedicines; }
}

export function saveMedicines(meds: Medicine[]) { localStorage.setItem(MEDS, JSON.stringify(meds)); }
export function loadLogs(): MedicationLog[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LOGS) || '[]'); } catch { return []; }
}
export function saveLogs(logs: MedicationLog[]) { localStorage.setItem(LOGS, JSON.stringify(logs)); }
export function dateKey(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date); }

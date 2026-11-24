'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadMedicines, loadLogs, saveLogs, dateKey } from '../lib/storage';
import { Medicine, MedicationLog } from '../lib/types';
import { quotes } from '../lib/quotes';

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function todayLabel() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date());
}
function formatTakenTime(iso?: string) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
}

export default function Home() {
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkedAt, setCheckedAt] = useState<Record<string, string>>({});
  const [showWelcome, setShowWelcome] = useState(true);
  const [result, setResult] = useState<'complete' | 'partial' | null>(null);
  const [quote, setQuote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const medicines = loadMedicines();
    const existingLogs = loadLogs();
    setMeds(medicines);
    setLogs(existingLogs);

    const today = dateKey();
    const todayLogs = existingLogs.filter(l => l.date === today);
    setSelected(new Set(todayLogs.map(l => l.medicineId)));
    setCheckedAt(Object.fromEntries(todayLogs.map(l => [l.medicineId, l.takenAt])));
  }, []);

  const today = dateKey();
  const active = meds.filter(m => m.active);
  const completedCount = selected.size;
  const remaining = active.filter(m => !selected.has(m.id));
  const progress = active.length ? Math.round((completedCount / active.length) * 100) : 0;

  const currentQuote = useMemo(() => {
    const index = (new Date().getDate() + new Date().getMonth() * 7) % quotes.length;
    return quotes[index];
  }, []);

  function toggleMedicine(id: string) {
    setSaved(false);
    setResult(null);

    setSelected(prev => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
        setCheckedAt(times => {
          const nextTimes = { ...times };
          delete nextTimes[id];
          return nextTimes;
        });
      } else {
        next.add(id);
        // Capture the actual moment this medicine is checked.
        setCheckedAt(times => ({ ...times, [id]: new Date().toISOString() }));
      }

      return next;
    });
  }

  function saveToday() {
    const existing = logs.filter(l => l.date !== today);
  
    const newLogs: MedicationLog[] = active
      .filter(m => selected.has(m.id))
      .map(m => ({
        id: uid(),
        medicineId: m.id,
        takenAt: checkedAt[m.id],
        date: today,
      }));
  
    const next = [...existing, ...newLogs];
  
    setLogs(next);
    saveLogs(next);
    setSaved(true);
  
    if (remaining.length === 0 && active.length > 0) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(randomQuote);
      setResult('complete');
    } else {
      setResult('partial');
    }
  }

  function closeResult() { setResult(null); }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">❤️</div>
          <p className="text-xs font-bold tracking-[0.25em] text-rose-400">FOR HER</p>
          <p className="mt-2 text-sm text-gray-500">{todayLabel()}</p>
        </header>

        <section className="card rounded-[2rem] p-6 text-center">
          <p className="text-2xl font-semibold">Today’s medication</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">Select every medicine you have taken today, then save your update.</p>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-rose-50">
            <div className="h-full rounded-full bg-rose-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-rose-500">{completedCount} of {active.length} selected</p>
        </section>

        <section className="mt-5 space-y-3">
          {active.map(m => {
            const checked = selected.has(m.id);
            return (
              <button key={m.id} onClick={() => toggleMedicine(m.id)} className={`card flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all ${checked ? 'border-rose-300 bg-rose-50/70' : ''}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all ${checked ? 'border-rose-400 bg-rose-400 text-white' : 'border-gray-200 bg-white text-transparent'}`}>✓</span>
                <span className="flex-1">
                  <span className="block font-semibold">{m.name}</span>
                  {checked && checkedAt[m.id] ? (
                    <span className="mt-0.5 block text-xs font-medium text-rose-500">Taken at {formatTakenTime(checkedAt[m.id])}</span>
                  ) : null}
                </span>
                {checked && <span className="text-sm font-semibold text-rose-500">Taken</span>}
              </button>
            );
          })}
        </section>

        <button onClick={saveToday} disabled={saved || selected.size === 0} className="mt-6 w-full rounded-2xl bg-rose-500 py-4 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-default disabled:opacity-90">
          {saved ? 'Saved for today ❤️' : 'Save today’s medication ❤️'}
        </button>


        <section className="card mt-6 rounded-3xl p-5 text-center">
          <div className="text-xl">💌</div>
          <p className="mt-2 text-sm font-bold">A little reminder from me</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">“{currentQuote}”</p>
          </section>

        <footer className="py-7 text-center text-xs text-gray-400">Made with love, especially for Gargi ❤️</footer>
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#3d2632]/25 p-5 backdrop-blur-sm">
          <div className="welcome-card w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl">
            <div className="heart-pop mx-auto mb-4 text-5xl">❤️</div>
            <p className="text-2xl font-bold text-gray-900">Hello Gargi,</p>
            <p className="mt-1 text-xl font-medium text-gray-700">How are you today?</p>
            <p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-gray-500">Let’s log your medication for today, together. 🌷</p>
            <p className="mt-3 text-xs font-semibold text-rose-400">{todayLabel()}</p>
            <button onClick={() => setShowWelcome(false)} className="mt-6 w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white">Let’s do it ❤️</button>
          </div>
        </div>
      )}

{result && (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#3d2632]/30 p-5 backdrop-blur-sm">
    <div className="result-card relative w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl">

      {/* Close button */}
      <button
        onClick={closeResult}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
      >
        ×
      </button>

      <div className="mb-4 text-5xl">
        {result === 'complete' ? '🎉' : '🌷'}
      </div>

      {result === 'complete' ? (
        <>
          <p className="text-2xl font-bold">All done, Gargi! ❤️</p>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            {quote}
          </p>

          <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {active.length} / {active.length} medicines completed ✓
          </p>
        </>
      ) : (
        <>
          <p className="text-2xl font-bold">Almost there ❤️</p>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Don’t forget to complete all your medicines today.
          </p>

          <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Still remaining
            </p>

            <div className="mt-2 space-y-1 text-sm font-semibold text-gray-700">
              {remaining.map(m => (
                <div key={m.id}>• {m.name}</div>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={closeResult}
        className="mt-6 w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-bold text-white"
      >
        Okay ❤️
      </button>
    </div>
  </div>
)}
    </main>
  );
}

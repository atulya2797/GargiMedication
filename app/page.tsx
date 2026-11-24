'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadMedicines, loadLogs, saveLogs, dateKey } from '../lib/storage';
import { Medicine, MedicationLog } from '../lib/types';
import { quotes } from '../lib/quotes';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
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

const moods = [
  { id: 'great', emoji: '😊', label: 'Great' },
  { id: 'okay', emoji: '🙂', label: 'Okay' },
  { id: 'low', emoji: '😔', label: 'Low' },
  { id: 'tired', emoji: '🥱', label: 'Tired' },
  { id: 'loved', emoji: '❤️', label: 'Loved' },
];

const needMeNotes: Record<string, string[]> = {
  sad: [
    'You don’t have to fix everything today. Just breathe. I’m with you. ❤️',
    'If I could, I’d be giving you the biggest hug right now. Until then, keep this little one from me. 🤗',
  ],
  tired: [
    'You’ve done enough for today. Be gentle with yourself and get some rest. 🌙',
    'No need to be strong every minute. Rest, recharge, and remember I’m always rooting for you. ❤️',
  ],
  miss: [
    'Distance can never make you less loved. You are always close to my heart. 💕',
    'I may not be beside you right now, but there is always a little piece of me with you. ❤️',
  ],
  hug: [
    'Emergency virtual hug incoming… 🤗❤️ Hold on to it for as long as you need.',
    'Here is your reminder that you are loved, missed, and very, very precious to me. 🫶',
  ],
};

export default function Home() {
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkedAt, setCheckedAt] = useState<Record<string, string>>({});
  const [showWelcome, setShowWelcome] = useState(true);
  const [result, setResult] = useState<'complete' | 'partial' | null>(null);
  const [quote, setQuote] = useState('');
  const [saved, setSaved] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [needMeOpen, setNeedMeOpen] = useState(false);
  const [needMeCategory, setNeedMeCategory] = useState<string | null>(null);
  const [needMeMessage, setNeedMeMessage] = useState('');

  useEffect(() => {
    const medicines = loadMedicines();
    const existingLogs = loadLogs();

    setMeds(medicines);
    setLogs(existingLogs);

    const today = dateKey();
    const todayLogs = existingLogs.filter(l => l.date === today);

    setSelected(new Set(todayLogs.map(l => l.medicineId)));
    setCheckedAt(
      Object.fromEntries(
        todayLogs.map(l => [l.medicineId, l.takenAt])
      )
    );

    setMood(localStorage.getItem(`for-her-mood-${today}`));
  }, []);

  const today = dateKey();
  const active = meds.filter(m => m.active);
  const completedCount = selected.size;
  const remaining = active.filter(m => !selected.has(m.id));
  const progress = active.length
    ? Math.round((completedCount / active.length) * 100)
    : 0;

  const currentQuote = useMemo(() => {
    const index =
      (new Date().getDate() + new Date().getMonth() * 7) % quotes.length;

    return quotes[index];
  }, []);

  const completedDays = useMemo(() => {
    const completeDates = new Set<string>();
    const grouped = new Map<string, Set<string>>();

    logs.forEach(log => {
      if (!grouped.has(log.date)) {
        grouped.set(log.date, new Set());
      }

      grouped.get(log.date)!.add(log.medicineId);
    });

    grouped.forEach((medicineIds, date) => {
      if (
        active.length > 0 &&
        active.every(m => medicineIds.has(m.id))
      ) {
        completeDates.add(date);
      }
    });

    return completeDates;
  }, [logs, active]);

  const streak = useMemo(() => {
    let cursor = new Date(`${today}T12:00:00+05:30`);
    let count = 0;

    while (true) {
      const key = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
      }).format(cursor);

      if (!completedDays.has(key)) break;

      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }, [completedDays, today]);

  const gardenFlowers = Math.min(completedDays.size, 12);

  function chooseMood(id: string) {
    setMood(id);
    localStorage.setItem(`for-her-mood-${today}`, id);
  }

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

        setCheckedAt(times => ({
          ...times,
          [id]: new Date().toISOString(),
        }));
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
      const randomQuote =
        quotes[Math.floor(Math.random() * quotes.length)];

      setQuote(randomQuote);
      setResult('complete');
    } else {
      setResult('partial');
    }
  }

  function openNeedMe(category: string) {
    setNeedMeCategory(category);

    const messages = needMeNotes[category];

    setNeedMeMessage(
      messages[Math.floor(Math.random() * messages.length)]
    );
  }

  function closeResult() {
    setResult(null);
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">

        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
            ❤️
          </div>

          <p className="text-xs font-bold tracking-[0.25em] text-rose-400">
            FOR HER
          </p>

          <p className="mt-2 text-sm text-gray-500">
            {todayLabel()}
          </p>
        </header>

        <section className="card rounded-[2rem] p-6 text-center">
          <p className="text-2xl font-semibold">
            Today’s medication
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Select every medicine you have taken today, then save your update.
          </p>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-rose-50">
            <div
              className="h-full rounded-full bg-rose-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-2 text-xs font-semibold text-rose-500">
            {completedCount} of {active.length} selected
          </p>
        </section>

        {/* MOOD CHECK-IN */}

        <section className="card mt-5 rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">
                How are you feeling today?
              </p>

              <p className="mt-1 text-xs text-gray-500">
                A little check-in, just for me. ❤️
              </p>
            </div>

            {mood && (
              <span className="text-xs font-bold text-rose-400">
                Saved ✓
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {moods.map(item => (
              <button
                key={item.id}
                onClick={() => chooseMood(item.id)}
                className={`mood-button rounded-2xl border px-2 py-3 text-center transition-all ${
                  mood === item.id
                    ? 'selected-mood'
                    : 'border-gray-100 bg-white hover:-translate-y-0.5 hover:border-rose-200'
                }`}
              >
                <span className="block text-2xl">
                  {item.emoji}
                </span>

                <span className="mt-1 block text-[10px] font-bold text-gray-500">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* STREAK + GARDEN SUMMARY */}

        <section className="mt-5 grid grid-cols-2 gap-3">
          <div className="card rounded-3xl p-5">
            <div className="text-2xl">🔥</div>

            <p className="mt-2 text-2xl font-black text-gray-900">
              {streak}
            </p>

            <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
              day streak
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              {streak
                ? 'Keep taking care of yourself. ❤️'
                : 'Complete a full day to start your streak.'}
            </p>
          </div>

          <div className="card rounded-3xl p-5">
            <div className="text-2xl">🌷</div>

            <p className="mt-2 text-2xl font-black text-gray-900">
              {gardenFlowers}
            </p>

            <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
              flowers grown
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Every complete day grows a little more love.
            </p>
          </div>
        </section>

        {/* CARE GARDEN */}

        <section className="card mt-5 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">
                🌱 Your care garden
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Every fully completed day grows a flower.
              </p>
            </div>

            <span className="text-xs font-bold text-rose-400">
              {gardenFlowers}/12
            </span>
          </div>

          <div className="garden mt-5 rounded-2xl bg-gradient-to-b from-pink-50 to-rose-100/70 px-3 py-4">
            <div className="flex min-h-20 flex-wrap items-end justify-center gap-x-3 gap-y-1">
              {Array.from({ length: 12 }).map((_, index) => (
                <span
                  key={index}
                  className={`garden-flower ${
                    index < gardenFlowers ? 'grown' : 'empty'
                  }`}
                  title={
                    index < gardenFlowers
                      ? 'A day you completed all your medicines'
                      : 'Complete a full day to grow this flower'
                  }
                >
                  {index < gardenFlowers
                    ? ['🌷', '🌸', '🌼', '🌹'][index % 4]
                    : '·'}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* MEDICINES */}

        <section className="mt-5 space-y-3">
          {active.map(m => {
            const checked = selected.has(m.id);

            return (
              <button
                key={m.id}
                onClick={() => toggleMedicine(m.id)}
                className={`card flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all ${
                  checked
                    ? 'border-rose-300 bg-rose-50/70'
                    : ''
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all ${
                    checked
                      ? 'border-rose-400 bg-rose-400 text-white'
                      : 'border-gray-200 bg-white text-transparent'
                  }`}
                >
                  ✓
                </span>

                <span className="flex-1">
                  <span className="block font-semibold">
                    {m.name}
                  </span>

                  {checked && checkedAt[m.id] ? (
                    <span className="mt-0.5 block text-xs font-medium text-rose-500">
                      Taken at {formatTakenTime(checkedAt[m.id])}
                    </span>
                  ) : null}
                </span>

                {checked && (
                  <span className="text-sm font-semibold text-rose-500">
                    Taken
                  </span>
                )}
              </button>
            );
          })}
        </section>

        <button
          onClick={saveToday}
          disabled={saved || selected.size === 0}
          className="mt-6 w-full rounded-2xl bg-rose-500 py-4 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-default disabled:opacity-90"
        >
          {saved
            ? 'Saved for today ❤️'
            : 'Save today’s medication ❤️'}
        </button>

        {/* DAILY QUOTE */}

        <section className="card mt-6 rounded-3xl p-5">

          <p className="mt-2 text-sm font-bold text-center">
            A little reminder from me 💌
          </p>

          <p className="mt-2 text-center text-sm leading-6 text-gray-600">
            “{currentQuote}”
          </p>
        </section>

        {/* OPEN WHEN YOU NEED ME */}

        <section className="card mt-5 rounded-3xl p-5 text-center">
          <div className="text-2xl">💗</div>

          <p className="mt-2 text-sm font-bold">
            Open when you need me
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            A few little messages from me, whenever you need one.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => openNeedMe('sad')}
              className="need-me-button"
            >
              🥺 When I’m sad
            </button>

            <button
              onClick={() => openNeedMe('tired')}
              className="need-me-button"
            >
              😴 When I’m tired
            </button>

            <button
              onClick={() => openNeedMe('miss')}
              className="need-me-button"
            >
              💕 When I miss you
            </button>

            <button
              onClick={() => openNeedMe('hug')}
              className="need-me-button"
            >
              🤗 I need a hug
            </button>
          </div>
        </section>

        <footer className="py-7 text-center text-xs text-gray-400">
          Made with love, especially for Shona❤️
        </footer>
      </div>

      {/* WELCOME MODAL */}

      {showWelcome && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#3d2632]/25 p-5 backdrop-blur-sm">
          <div className="welcome-card relative w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl">

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setShowWelcome(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              ×
            </button>

            <div className="heart-pop mx-auto mb-4 text-5xl">
              ❤️
            </div>

            <p className="text-2xl font-bold text-gray-900">
              Hey Shona,
            </p>

            <p className="mt-1 text-xl font-medium text-gray-700">
              How are you today?
            </p>

            <p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-gray-500">
              Let’s log your medication for today, together. 🌷
            </p>

            <p className="mt-3 text-xs font-semibold text-rose-400">
              {todayLabel()}
            </p>

            <button
              onClick={() => setShowWelcome(false)}
              className="mt-6 w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white"
            >
              Let’s do it ❤️
            </button>
          </div>
        </div>
      )}

      {/* OPEN WHEN YOU NEED ME MODAL */}

      {needMeCategory && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#3d2632]/30 p-5 backdrop-blur-sm">
          <div className="result-card relative w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl">

            {/* Close button */}
            <button
              type="button"
              onClick={() => setNeedMeCategory(null)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-2xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              ×
            </button>

            <div className="mb-4 text-5xl">💌</div>

            <p className="text-2xl font-bold">
              A little message for you
            </p>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              {needMeMessage}
            </p>

            <button
              onClick={() => setNeedMeCategory(null)}
              className="mt-6 w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-bold text-white"
            >
              Keep this with you ❤️
            </button>

            <button
              onClick={() => openNeedMe(needMeCategory)}
              className="mt-2 w-full rounded-2xl bg-rose-50 py-3 text-xs font-bold text-rose-500"
            >
              Another one 💕
            </button>

          </div>
        </div>
      )}

      {/* RESULT MODAL */}

      {result && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#3d2632]/30 p-5 backdrop-blur-sm">
          <div className="result-card relative w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl">

            {/* EXISTING CLOSE BUTTON */}
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
                <p className="text-2xl font-bold">
                  All done, Shona! ❤️
                </p>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {quote}
                </p>

                <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                  {active.length} / {active.length} medicines completed ✓
                </p>

                <p className="mt-3 text-sm font-bold text-rose-500">
                  🔥 Your care streak is now {streak} day
                  {streak === 1 ? '' : 's'}!
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  Almost there ❤️
                </p>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Don’t forget to complete all your medicines today.
                </p>

                <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Still remaining
                  </p>

                  <div className="mt-2 space-y-1 text-sm font-semibold text-gray-700">
                    {remaining.map(m => (
                      <div key={m.id}>
                        • {m.name}
                      </div>
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
import React from 'react';
import { SettingsIcon, CheckCircleIcon, CloudFailIcon } from './icons.jsx';
import { formatDateTime } from '../utils/date.js';

const toneMap = {
  success: {
    badge: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
    pulse: 'text-emerald-300',
  },
  pending: {
    badge: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
    pulse: 'text-amber-300',
  },
  error: {
    badge: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
    pulse: 'text-rose-300',
  },
  idle: {
    badge: 'bg-slate-800/70 text-slate-300 border border-slate-700/60',
    pulse: 'text-slate-400',
  },
};

const formatCurrency = (value = 0) =>
  `${Number(value || 0).toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const ExperienceRibbon = ({
  branchName,
  aadeEnv,
  backendBase,
  connectionStatus,
  queueLength,
  lastSuccess,
  now,
  timezone,
}) => {
  const envLabel = aadeEnv === 'production' ? 'Παραγωγή (Live)' : 'Προπαραγωγή';
  const tone = toneMap[connectionStatus?.state] || toneMap.idle;
  const connectionMessage = connectionStatus?.message || 'Δεν έχει εκτελεστεί έλεγχος.';
  const lastSuccessLabel = lastSuccess
    ? `#${lastSuccess.invoiceNumber} • ${formatDateTime(lastSuccess.issueDate || lastSuccess.invoiceDate || lastSuccess.timestamp)}`
    : 'Δεν υπάρχουν επιτυχημένες υποβολές.';
  const lastSuccessSub = lastSuccess?.mark ? `MARK ${lastSuccess.mark}` : '';
  const queueLabel = queueLength === 0
    ? 'Καμία αποτυχημένη υποβολή στην ουρά'
    : queueLength === 1
      ? '1 υποβολή περιμένει επανυποβολή'
      : `${queueLength} υποβολές περιμένουν επανυποβολή`;

  const nowLabel = now
    ? `${formatDateTime(now, 'DD-MM-YYYY')}`
    : '';

  const cards = [
    {
      label: 'Σύνδεση Backend',
      Icon: SettingsIcon,
      value: backendBase ? backendBase.replace(/\/$/, '') : 'Δεν έχει οριστεί URL',
      meta: `${envLabel} • ${connectionMessage}`,
      className: 'border border-slate-800/70 bg-slate-900/80',
      badge: (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${tone.pulse} animate-pulse`} aria-hidden />
          {connectionStatus?.state === 'success' && 'Σύνδεση OK'}
          {connectionStatus?.state === 'pending' && 'Σε εξέλιξη'}
          {connectionStatus?.state === 'error' && 'Αποτυχία'}
          {connectionStatus?.state === 'idle' && 'Αναμονή'}
          {!connectionStatus?.state && 'Αναμονή'}
        </span>
      ),
    },
    {
      label: 'Τελευταία επιτυχία',
      Icon: CheckCircleIcon,
      value: lastSuccessLabel,
      meta: lastSuccessSub,
      className: 'border border-emerald-500/20 bg-emerald-500/5',
      badge: null,
    },
    {
      label: 'Σε αναμονή',
      Icon: CloudFailIcon,
      value: queueLength,
      meta: queueLabel,
      className: 'border border-amber-500/20 bg-amber-500/5',
      badge: null,
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/80 p-4 shadow-2xl">
      <div className="absolute inset-0 bg-linear-to-r from-emerald-500/10 via-transparent to-sky-500/10 opacity-50" aria-hidden />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-slate-500">Operational overview</p>
            <h2 className="text-2xl font-semibold text-white">{branchName}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700/70 px-3 py-1">Ζώνη: {timezone}</span>
            <span className="rounded-full border border-slate-700/70 px-3 py-1"> Περιβάλλον myDATA: {envLabel}</span>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, Icon, value, meta, className, badge }) => (
            <article key={label} className={`rounded-2xl px-4 py-5 ${className}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/70 text-slate-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-semibold tracking-[0.3em] text-slate-500 uppercase">{label}</p>
                </div>
                {badge}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-100 leading-tight">{value}</p>
              {meta && <p className="mt-2 text-xs text-slate-400">{meta}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceRibbon;

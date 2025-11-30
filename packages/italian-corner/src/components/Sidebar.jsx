import React, { useEffect, useState } from 'react';
import { InvoiceIcon, HistoryIcon, WarningIcon, SettingsIcon, TrashIcon } from './icons.jsx';

const Sidebar = ({ activeSection, onNavigate, isMobileOpen, onClose, useBackend, collapsed = false, onToggleCollapse }) => {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(min-width: 1024px)').matches;
    }
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => setIsDesktop(event.matches);
    handleChange(mediaQuery);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const effectiveCollapsed = Boolean(collapsed && isDesktop);
  const collapseDisabled = !isDesktop;

  const sections = [
    { id: 'invoice', label: 'Νέο Τιμολόγιο', Icon: InvoiceIcon },
    { id: 'history', label: 'Ιστορικό', Icon: HistoryIcon },
    { id: 'failed', label: 'Αποτυχημένα', Icon: WarningIcon },
    { id: 'settings', label: 'Ρυθμίσεις', Icon: SettingsIcon },
    { id: 'trash', label: 'Κάδος Ανακύκλωσης', Icon: TrashIcon }
  ];

  const connectionIndicator = useBackend ? 'bg-emerald-400' : 'bg-amber-400';
  const connectionLabel = useBackend ? 'Backend API ενεργό' : 'Mock λειτουργία';
  const connectionPill = useBackend ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/20 text-amber-200';

  const handleNavigate = (sectionId) => {
    onNavigate(sectionId);
    if (onClose) onClose();
  };

  const handleCollapseToggle = () => {
    if (collapseDisabled || !onToggleCollapse) return;
    onToggleCollapse();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/60 transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out pointer-events-auto lg:static lg:z-auto w-72 ${
          effectiveCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        aria-label="Κύρια πλοήγηση"
        aria-expanded={!effectiveCollapsed}
      >
        <div className={`relative flex h-full w-full flex-col ${effectiveCollapsed ? 'items-center' : ''} bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 shadow-2xl` }>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 lg:hidden"
            aria-label="Κλείσιμο μενού"
          >
            ✕
          </button>

          <div className={`p-6 border-b border-slate-800/70 ${effectiveCollapsed ? 'flex-col items-center' : ''}`}>
            <h2 className={`text-2xl font-semibold tracking-tight ${effectiveCollapsed ? 'text-emerald-400 text-xs' : 'text-emerald-400'}`}>myData</h2>
            {!effectiveCollapsed && <div className="mt-2 text-slate-400 text-sm">Invoice App</div>}
          </div>

          <nav className={`flex-1 overflow-y-auto p-4 ${effectiveCollapsed ? 'space-y-3' : 'space-y-2'}`}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleNavigate(section.id)}
                title={section.label}
                className={`group relative w-full overflow-visible flex items-center gap-3 ${effectiveCollapsed ? 'justify-center py-3' : 'px-4 py-3'} rounded-xl transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-emerald-500/20 text-white shadow-lg ring-1 ring-emerald-500/40'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`}
              >
                <span className={`flex ${effectiveCollapsed ? 'h-8 w-8' : 'h-10 w-10'} items-center justify-center rounded-xl bg-slate-900/60 text-emerald-300`}>
                  <section.Icon className="h-5 w-5" />
                </span>
                {effectiveCollapsed ? (
                  <>
                    <span className="sr-only">{section.label}</span>
                    <span className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-2xl border border-slate-800/80 bg-slate-950/95 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:block group-hover:translate-x-1 group-hover:opacity-100">
                      {section.label}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium tracking-tight">{section.label}</span>
                  </div>
                )}
              </button>
            ))}
          </nav>

          <div className={`p-4 border-t border-slate-800/70 text-xs text-slate-500 w-full ${effectiveCollapsed ? 'flex flex-col items-center gap-3' : ''} sticky bottom-0 bg-slate-950/80 backdrop-blur-sm z-40`}>
            {!effectiveCollapsed && (
              <div className="mb-2 text-center">v1.0.0 • 2025</div>
            )}
            <div className={`flex items-center justify-center gap-2 rounded-full px-3 py-1 ${connectionPill}`}>
              <span className={`inline-flex h-2 w-2 rounded-full ${connectionIndicator} animate-pulse`} aria-hidden />
              {!effectiveCollapsed && <span>{connectionLabel}</span>}
            </div>

            <button
              type="button"
              onClick={handleCollapseToggle}
              disabled={collapseDisabled}
              className={`mt-3 w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800/80 ${collapseDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
              title={collapseDisabled ? 'Η σύμπτυξη υποστηρίζεται μόνο σε μεγάλη οθόνη' : effectiveCollapsed ? 'Ανάπτυξη μενού' : 'Σύμπτυξη μενού'}
              aria-pressed={effectiveCollapsed}
              aria-label={effectiveCollapsed ? 'Ανάπτυξη μενού' : 'Σύμπτυξη μενού'}
            >
              <span aria-hidden>{effectiveCollapsed ? '▸' : '◂'}</span>
              <span className="sr-only">{effectiveCollapsed ? 'Ανάπτυξη μενού' : 'Σύμπτυξη μενού'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

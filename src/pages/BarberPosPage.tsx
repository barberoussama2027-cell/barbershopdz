import React, { useMemo, useState } from 'react';
import { Scissors, CheckCircle2, ShieldCheck, Clock, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSalonData } from '../context/SalonDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { Service } from '../types';
import { BarberLogo } from '../components/BarberLogo';

export const BarberPosPage: React.FC = () => {
  const { profile } = useAuth();
  const { services, transactions, recordTransaction } = useSalonData();
  const { language, t, formatDZD } = useLanguage();

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeServices = useMemo(() => services.filter((s) => s.is_active), [services]);

  // Isolation stricte : uniquement les transactions de ce coiffeur
  const myTransactions = useMemo(
    () => transactions.filter((tx) => tx.barber_id === profile?.id),
    [transactions, profile?.id]
  );

  const personalStats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);

    const todayTxs = myTransactions.filter((tx) => new Date(tx.created_at) >= startOfDay);
    const weekTxs = myTransactions.filter((tx) => new Date(tx.created_at) >= startOfWeek);

    return {
      todayEarnings: todayTxs.reduce((s, tx) => s + Number(tx.barber_share), 0),
      weekEarnings: weekTxs.reduce((s, tx) => s + Number(tx.barber_share), 0),
      todayCuts: todayTxs.length,
      weekCuts: weekTxs.length,
    };
  }, [myTransactions]);

  const handleConfirm = async () => {
    if (!selectedService) return;
    setSubmitting(true);
    const res = await recordTransaction(selectedService);
    setSubmitting(false);
    if (!res.error) {
      setSelectedService(null);
      setToast(t('pos.successToast'));
      setTimeout(() => setToast(null), 2800);
    }
  };

  const commissionRate = profile?.commission_rate ?? 50;

  return (
    <div className="space-y-5 lg:space-y-6 max-w-7xl 2xl:max-w-[1600px] mx-auto">
      {/* Top Header Bar: Greeting + Station Badge + Commission */}
      <div className="premium-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-amber-500/20 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3.5">
          <BarberLogo size="md" />
          <div>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold gold-gradient-text">
              {t('pos.welcome')}, {profile?.full_name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {profile?.station_name || 'Poste de travail'} • {t('pos.stationReady')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {t('pos.commissionBadge')}: {commissionRate}%
            </span>
          </div>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-semibold text-sm shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Grid: Ergonomically Split on Tablet Landscape & Laptop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Area (8 cols on lg+): 2-Click Touch POS tiles */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="premium-card rounded-3xl border border-amber-500/15 p-4 sm:p-6 lg:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base sm:text-lg lg:text-xl text-white flex items-center gap-2.5">
                  <Scissors className="w-5 h-5 text-amber-400" />
                  {t('pos.step1')}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{t('pos.step2')}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                {activeServices.length} {t('settings.servicesTitle').toLowerCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {activeServices.map((srv) => {
                const myShare = Math.round((srv.price * commissionRate) / 100);
                return (
                  <button
                    key={srv.id}
                    onClick={() => setSelectedService(srv)}
                    className="group text-start p-5 sm:p-5.5 rounded-2xl bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-amber-500/60 active:scale-[0.98] transition-all shadow-md hover:shadow-amber-500/10 cursor-pointer flex flex-col justify-between min-h-[128px] sm:min-h-[136px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-base sm:text-lg text-white group-hover:text-amber-300 transition line-clamp-2">
                        {language === 'ar' ? srv.name_ar : srv.name_fr}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg shrink-0 border border-slate-800">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {srv.duration_min}m
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-slate-800/70">
                      <span className="text-xl sm:text-2xl font-extrabold text-amber-400">
                        {formatDZD(srv.price)}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        +{formatDZD(myShare)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Area (4-5 cols on lg+): Personal Stats & Live Cuts Stream */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-20">
          {/* Earnings summary 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/35 p-4 sm:p-4.5 shadow-lg">
              <p className="text-xs text-slate-300 font-medium">{t('pos.todayEarnings')}</p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-2 truncate">
                {formatDZD(personalStats.todayEarnings)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {personalStats.todayCuts} {t('pos.todayCuts').toLowerCase()}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-4.5 shadow-lg">
              <p className="text-xs text-slate-400 font-medium">{t('pos.weekEarnings')}</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-2 truncate">
                {formatDZD(personalStats.weekEarnings)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {personalStats.weekCuts} {t('pos.weekCuts').toLowerCase()}
              </p>
            </div>
          </div>

          {/* Recent Cuts List */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm sm:text-base">{t('pos.myHistory')}</h3>
              <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                {myTransactions.length}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 w-full">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="truncate">{t('pos.lockedNotice')}</span>
            </div>

            <div className="space-y-2 max-h-72 lg:max-h-[380px] overflow-y-auto pe-1">
              {myTransactions.slice(0, 20).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm hover:border-slate-700 transition"
                >
                  <div className="min-w-0 pe-2">
                    <p className="font-medium text-white truncate text-xs sm:text-sm">
                      {language === 'ar' ? tx.service_name_ar : tx.service_name_fr}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(tx.created_at).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-bold text-emerald-400 text-xs sm:text-sm">
                      +{formatDZD(tx.barber_share)}
                    </p>
                    <p className="text-[10px] text-slate-500">{formatDZD(tx.amount)}</p>
                  </div>
                </div>
              ))}
              {myTransactions.length === 0 && (
                <p className="text-xs sm:text-sm text-slate-500 text-center py-8">{t('app.noData')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 Confirmation Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">{t('pos.confirmTitle')}</h3>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="font-bold text-xl text-amber-400">
                {language === 'ar' ? selectedService.name_ar : selectedService.name_fr}
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{t('pos.totalAmount')}</span>
                <span className="font-bold text-white">{formatDZD(selectedService.price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {t('pos.yourCommission')} ({commissionRate}%)
                </span>
                <span className="font-bold text-emerald-400">
                  +{formatDZD(Math.round((selectedService.price * commissionRate) / 100))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 cursor-pointer"
              >
                {t('app.cancel')}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirm()}
                className="flex-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-60"
              >
                {t('pos.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

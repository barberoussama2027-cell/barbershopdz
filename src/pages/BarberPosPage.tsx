import React, { useMemo, useState } from 'react';
import { Scissors, CheckCircle2, ShieldCheck, Clock, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSalonData } from '../context/SalonDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { Service } from '../types';

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
    <div className="space-y-6">
      {/* Greeting + Privacy Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {t('pos.welcome')}, {profile?.full_name}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{t('pos.stationReady')}</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold self-start">
          <Sparkles className="w-4 h-4" />
          <span>
            {t('pos.commissionBadge')}: {commissionRate}%
          </span>
        </div>
      </div>

      {/* Personal Earnings ONLY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/30 p-4 sm:p-5">
          <p className="text-xs text-slate-300 font-medium">{t('pos.todayEarnings')}</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-2">
            {formatDZD(personalStats.todayEarnings)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5">
          <p className="text-xs text-slate-400 font-medium">{t('pos.weekEarnings')}</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-2">
            {formatDZD(personalStats.weekEarnings)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5">
          <p className="text-xs text-slate-400 font-medium">{t('pos.todayCuts')}</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-2">{personalStats.todayCuts}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5">
          <p className="text-xs text-slate-400 font-medium">{t('pos.weekCuts')}</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-2">{personalStats.weekCuts}</p>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-semibold text-sm shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 2-Click Touch POS */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            {t('pos.step1')}
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">{t('pos.step2')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {activeServices.map((srv) => {
            const myShare = Math.round((srv.price * commissionRate) / 100);
            return (
              <button
                key={srv.id}
                onClick={() => setSelectedService(srv)}
                className="group text-start p-5 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/60 active:scale-[0.98] transition-all shadow-md cursor-pointer flex flex-col justify-between min-h-[116px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-base sm:text-lg text-white group-hover:text-amber-300 transition">
                    {language === 'ar' ? srv.name_ar : srv.name_fr}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg shrink-0">
                    <Clock className="w-3 h-3" />
                    {srv.duration_min}m
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-slate-800/70">
                  <span className="text-lg font-extrabold text-amber-400">
                    {formatDZD(srv.price)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    +{formatDZD(myShare)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* My Recent History */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="font-semibold text-white">{t('pos.myHistory')}</h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {t('pos.privacyNote')}
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
          {myTransactions.slice(0, 15).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm"
            >
              <div>
                <p className="font-medium text-white">
                  {language === 'ar' ? tx.service_name_ar : tx.service_name_fr}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(tx.created_at).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-end">
                <p className="font-bold text-emerald-400">+{formatDZD(tx.barber_share)}</p>
                <p className="text-[11px] text-slate-500">{formatDZD(tx.amount)}</p>
              </div>
            </div>
          ))}
          {myTransactions.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">{t('app.noData')}</p>
          )}
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

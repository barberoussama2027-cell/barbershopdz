import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Receipt,
  Users,
  Scissors,
  BarChart3,
  Clock,
  Calendar,
  Trash2,
} from 'lucide-react';
import { useSalonData } from '../context/SalonDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { PeriodFilter } from '../types';
import { RevenueProfitChart, TrafficBarChart, type ChartPoint, type TrafficPoint } from '../components/Charts';

function getPeriodStart(period: PeriodFilter): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'day') return d;
  if (period === 'week') {
    const day = d.getDay(); // 0=Sun..6=Sat
    const diff = day === 0 ? 6 : day - 1; // Lundi comme début de semaine
    d.setDate(d.getDate() - diff);
    return d;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

export const ManagerDashboardPage: React.FC = () => {
  const { transactions, expenses, profiles, deleteTransaction } = useSalonData();
  const { language, t, formatDZD } = useLanguage();
  const [period, setPeriod] = useState<PeriodFilter>('month');

  const handleDeleteTx = async (id: string) => {
    if (!window.confirm(t('dashboard.deleteTxConfirm'))) return;
    await deleteTransaction(id);
  };

  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  const filteredTx = useMemo(
    () => transactions.filter((tx) => new Date(tx.created_at) >= periodStart),
    [transactions, periodStart]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((exp) => new Date(exp.expense_date + 'T00:00:00') >= periodStart),
    [expenses, periodStart]
  );

  const kpis = useMemo(() => {
    const grossRevenue = filteredTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const barberCommissions = filteredTx.reduce((sum, tx) => sum + Number(tx.barber_share), 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const netMargin = grossRevenue - totalExpenses - barberCommissions;
    const totalCuts = filteredTx.length;
    const avgTicket = totalCuts > 0 ? grossRevenue / totalCuts : 0;
    return {
      grossRevenue,
      barberCommissions,
      totalExpenses,
      netMargin,
      totalCuts,
      avgTicket,
    };
  }, [filteredTx, filteredExpenses]);

  // Données pour le graphique Recettes & Bénéfice Net
  const revenueChartData: ChartPoint[] = useMemo(() => {
    const map = new Map<string, { revenue: number; commissions: number; expenses: number; count: number }>();

    const keyForDate = (date: Date): string => {
      if (period === 'day') return `${String(date.getHours()).padStart(2, '0')}h`;
      if (period === 'year') {
        return date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short' });
      }
      return date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: '2-digit',
        month: '2-digit',
      });
    };

    // Trier chronologiquement
    const sortedTx = [...filteredTx].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const tx of sortedTx) {
      const k = keyForDate(new Date(tx.created_at));
      const cur = map.get(k) ?? { revenue: 0, commissions: 0, expenses: 0, count: 0 };
      cur.revenue += Number(tx.amount);
      cur.commissions += Number(tx.barber_share);
      cur.count += 1;
      map.set(k, cur);
    }

    for (const exp of filteredExpenses) {
      const d = new Date(exp.expense_date + 'T12:00:00');
      const k = period === 'day' ? '12h' : keyForDate(d);
      const cur = map.get(k) ?? { revenue: 0, commissions: 0, expenses: 0, count: 0 };
      cur.expenses += Number(exp.amount);
      map.set(k, cur);
    }

    return Array.from(map.entries())
      .slice(-14)
      .map(([label, v]) => ({
        label,
        revenue: v.revenue,
        netProfit: v.revenue - v.commissions - v.expenses,
        count: v.count,
      }));
  }, [filteredTx, filteredExpenses, period, language]);

  // Affluence par heure (09h - 22h)
  const hourlyTraffic: TrafficPoint[] = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 09..22
    const counts = new Map<number, number>();
    for (const h of hours) counts.set(h, 0);
    for (const tx of filteredTx) {
      const h = new Date(tx.created_at).getHours();
      if (counts.has(h)) counts.set(h, (counts.get(h) ?? 0) + 1);
    }
    return hours.map((h) => ({ label: `${h}h`, count: counts.get(h) ?? 0 }));
  }, [filteredTx]);

  // Affluence par jour de la semaine
  const dailyTraffic: TrafficPoint[] = useMemo(() => {
    const dayLabels =
      language === 'ar'
        ? ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
        : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const counts = new Array(7).fill(0) as number[];
    for (const tx of filteredTx) {
      const jsDay = new Date(tx.created_at).getDay(); // 0=Dim..6=Sam
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      counts[idx] += 1;
    }
    return dayLabels.map((label, idx) => ({ label, count: counts[idx] }));
  }, [filteredTx, language]);

  // Performance par coiffeur
  const barberStats = useMemo(() => {
    const barbers = profiles.filter((p) => p.role === 'coiffeur');
    return barbers.map((b) => {
      const txs = filteredTx.filter((t) => t.barber_id === b.id);
      const revenue = txs.reduce((s, t) => s + Number(t.amount), 0);
      const barberShare = txs.reduce((s, t) => s + Number(t.barber_share), 0);
      const salonShare = txs.reduce((s, t) => s + Number(t.salon_share), 0);
      return {
        barber: b,
        cuts: txs.length,
        revenue,
        barberShare,
        salonShare,
      };
    });
  }, [profiles, filteredTx]);

  const periods: PeriodFilter[] = ['day', 'week', 'month', 'year'];

  return (
    <div className="space-y-6">
      {/* Header + Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold gold-gradient-text">
            {t('dashboard.title')}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-slate-900/90 border border-amber-500/20 self-start shadow-inner">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                period === p
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t(`periods.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <div className="premium-card rounded-2xl border border-amber-500/20 p-5 lg:p-6">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{t('dashboard.grossRevenue')}</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-3">{formatDZD(kpis.grossRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1.5">
            {kpis.totalCuts} {t('dashboard.totalCuts').toLowerCase()}
          </p>
        </div>

        <div className="premium-card rounded-2xl border border-slate-800 p-5 lg:p-6">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{t('dashboard.barberCommissions')}</span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-sky-300 mt-3">
            {formatDZD(kpis.barberCommissions)}
          </p>
          <p className="text-xs text-slate-400 mt-1.5">
            {t('dashboard.avgTicket')}: {formatDZD(kpis.avgTicket)}
          </p>
        </div>

        <div className="premium-card rounded-2xl border border-slate-800 p-5 lg:p-6">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{t('dashboard.totalExpenses')}</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-300 mt-3">{formatDZD(kpis.totalExpenses)}</p>
          <p className="text-xs text-slate-400 mt-1.5">
            {filteredExpenses.length} {t('nav.expenses').toLowerCase()}
          </p>
        </div>

        <div
          className={`rounded-2xl p-5 lg:p-6 border shadow-lg ${
            kpis.netMargin >= 0
              ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-500/40'
              : 'bg-gradient-to-br from-rose-950/80 to-slate-900 border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
            <span>{t('dashboard.netMargin')}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-extrabold mt-3 ${
              kpis.netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatDZD(kpis.netMargin)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5">{t('dashboard.netMarginFormula')}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">{t('dashboard.revenueChartTitle')}</h3>
          </div>
          <RevenueProfitChart data={revenueChartData} />
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-sm text-white">
                {t('dashboard.trafficChartTitle')}
              </h3>
            </div>
            <TrafficBarChart data={hourlyTraffic} accent="sky" />
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm text-white">
                {t('dashboard.dailyTrafficTitle')}
              </h3>
            </div>
            <TrafficBarChart data={dailyTraffic} accent="amber" />
          </div>
        </div>
      </div>

      {/* Barber Performance + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            {t('dashboard.barberPerformance')}
          </h3>
          <div className="space-y-3">
            {barberStats.map(({ barber, cuts, revenue, barberShare, salonShare }) => (
              <div
                key={barber.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80"
              >
                <div>
                  <p className="font-semibold text-sm text-white">
                    {barber.full_name}{' '}
                    <span className="text-xs text-amber-400 font-normal">
                      ({barber.commission_rate}%)
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {barber.station_name || '-'} • {cuts} {t('barbers.cutsCount').toLowerCase()}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-bold text-white">{formatDZD(revenue)}</p>
                  <p className="text-[11px] text-slate-400">
                    <span className="text-sky-400">{formatDZD(barberShare)}</span> /{' '}
                    <span className="text-emerald-400">{formatDZD(salonShare)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-400" />
              {t('dashboard.recentTransactions')}
            </h3>
            <span className="text-[11px] text-amber-400/80">
              {t('dashboard.onlyGerantCanDelete')}
            </span>
          </div>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pe-1">
            {filteredTx.slice(0, 12).map((tx) => {
              const barber = profiles.find((p) => p.id === tx.barber_id);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">
                      {language === 'ar' ? tx.service_name_ar : tx.service_name_fr}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {barber?.full_name ?? 'Coiffeur'} •{' '}
                      {new Date(tx.created_at).toLocaleTimeString(
                        language === 'ar' ? 'ar-DZ' : 'fr-FR',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ms-3">
                    <div className="text-end">
                      <p className="font-bold text-amber-400">{formatDZD(tx.amount)}</p>
                      <p className="text-[11px] text-emerald-400">
                        +{formatDZD(tx.salon_share)} {t('dashboard.salonShare').toLowerCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => void handleDeleteTx(tx.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                      title={t('app.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredTx.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">{t('app.noData')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

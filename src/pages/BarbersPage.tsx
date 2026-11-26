import React, { useMemo, useState } from 'react';
import { UserPlus, Edit3, Trash2, X, Percent, CheckCircle2 } from 'lucide-react';
import { useSalonData } from '../context/SalonDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { Profile } from '../types';

export const BarbersPage: React.FC = () => {
  const { profiles, transactions, createBarber, updateBarber, deleteBarber } = useSalonData();
  const { t, formatDZD } = useLanguage();

  const barbers = useMemo(() => profiles.filter((p) => p.role === 'coiffeur'), [profiles]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState('');
  const [stationName, setStationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [commissionRate, setCommissionRate] = useState('50');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFullName('');
    setStationName(`Poste ${barbers.length + 1}`);
    setEmail('');
    setPassword('');
    setCommissionRate('50');
    setIsActive(true);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEdit = (b: Profile) => {
    setEditing(b);
    setFullName(b.full_name);
    setStationName(b.station_name ?? '');
    setEmail(b.email);
    setPassword('');
    setCommissionRate(String(b.commission_rate));
    setIsActive(b.is_active);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const rate = Number(commissionRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      setErrorMsg('Commission entre 0 et 100%');
      return;
    }

    setSaving(true);
    if (editing) {
      const res = await updateBarber({
        id: editing.id,
        full_name: fullName,
        station_name: stationName,
        commission_rate: rate,
        is_active: isActive,
      });
      setSaving(false);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setModalOpen(false);
      showToast(t('barbers.updatedSuccess'));
    } else {
      if (password.length < 6) {
        setSaving(false);
        setErrorMsg(t('barbers.passwordHint'));
        return;
      }
      const res = await createBarber({
        full_name: fullName,
        station_name: stationName,
        email,
        password,
        commission_rate: rate,
      });
      setSaving(false);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setModalOpen(false);
      showToast(t('barbers.createdSuccess'));
    }
  };

  const handleDelete = async (b: Profile) => {
    if (!window.confirm(t('barbers.deleteConfirm'))) return;
    const res = await deleteBarber(b.id);
    if (!res.error) showToast(t('barbers.deletedSuccess'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {t('barbers.title')}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{t('barbers.subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('barbers.addBarber')}</span>
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {barbers.map((b) => {
          const txs = transactions.filter((tx) => tx.barber_id === b.id);
          const totalRev = txs.reduce((s, tx) => s + Number(tx.amount), 0);
          const barberPart = txs.reduce((s, tx) => s + Number(tx.barber_share), 0);
          const salonPart = txs.reduce((s, tx) => s + Number(tx.salon_share), 0);

          return (
            <div
              key={b.id}
              className={`rounded-2xl bg-slate-900/80 border p-5 space-y-4 transition ${
                b.is_active ? 'border-slate-800' : 'border-rose-500/30 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white truncate">{b.full_name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        b.is_active
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {b.is_active ? t('app.active') : t('app.inactive')}
                    </span>
                  </div>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">
                    {b.station_name || '-'}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{b.email}</p>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-sm shrink-0">
                  <Percent className="w-3.5 h-3.5" />
                  <span>{b.commission_rate}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                <div className="p-2 rounded-xl bg-slate-950/60">
                  <p className="text-[11px] text-slate-400">{t('barbers.revenueGenerated')}</p>
                  <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                    {formatDZD(totalRev)}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60">
                  <p className="text-[11px] text-slate-400">{t('barbers.barberEarnings')}</p>
                  <p className="text-xs sm:text-sm font-bold text-sky-400 mt-0.5">
                    {formatDZD(barberPart)}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60">
                  <p className="text-[11px] text-slate-400">{t('barbers.salonEarnings')}</p>
                  <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                    {formatDZD(salonPart)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {txs.length} {t('barbers.cutsCount').toLowerCase()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t('app.edit')}</span>
                  </button>
                  <button
                    onClick={() => void handleDelete(b)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                    title={t('app.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Création / Édition */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-white">
                {editing ? t('barbers.editBarber') : t('barbers.addBarber')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('barbers.fullName')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('barbers.stationName')}
                </label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              {!editing && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('barbers.email')}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('barbers.password')}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('barbers.passwordHint')}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('barbers.commissionRate')}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  required
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              {editing && (
                <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <span>{t('barbers.toggleActive')}</span>
                </label>
              )}

              {errorMsg && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 cursor-pointer"
                >
                  {t('app.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold cursor-pointer disabled:opacity-60"
                >
                  {t('app.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

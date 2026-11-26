import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit3, Trash2, X, CheckCircle2, Scissors } from 'lucide-react';
import { useSalonData } from '../context/SalonDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { Service } from '../types';

export const SettingsPage: React.FC = () => {
  const { salonSettings, services, updateSalonName, saveService, deleteService } = useSalonData();
  const { language, t, formatDZD } = useLanguage();

  const [salonName, setSalonName] = useState(salonSettings.salon_name);
  const [toast, setToast] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [price, setPrice] = useState('500');
  const [duration, setDuration] = useState('30');
  const [category, setCategory] = useState('coupe');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setSalonName(salonSettings.salon_name);
  }, [salonSettings.salon_name]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim()) return;
    const res = await updateSalonName(salonName);
    if (!res.error) showToast(t('settings.salonNameSaved'));
  };

  const openCreate = () => {
    setEditing(null);
    setNameFr('');
    setNameAr('');
    setPrice('500');
    setDuration('30');
    setCategory('coupe');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setNameFr(s.name_fr);
    setNameAr(s.name_ar);
    setPrice(String(s.price));
    setDuration(String(s.duration_min));
    setCategory(s.category);
    setIsActive(s.is_active);
    setModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveService({
      id: editing?.id,
      name_fr: nameFr,
      name_ar: nameAr,
      price: Number(price),
      duration_min: Number(duration),
      category,
      is_active: isActive,
    });
    if (!res.error) {
      setModalOpen(false);
      showToast(t('settings.serviceSaved'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
          {t('settings.title')}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Salon Identity */}
      <form
        onSubmit={(e) => void handleSaveSalon(e)}
        className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5 text-white font-semibold">
          <Store className="w-5 h-5 text-amber-400" />
          <h3>{t('settings.salonInfo')}</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            placeholder={t('settings.salonName')}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition cursor-pointer"
          >
            {t('app.save')}
          </button>
        </div>
      </form>

      {/* Services Catalog */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 text-white font-semibold">
            <Scissors className="w-5 h-5 text-amber-400" />
            <h3>{t('settings.servicesTitle')}</h3>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>{t('settings.addService')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-4 rounded-xl bg-slate-950/70 border ${
                s.is_active ? 'border-slate-800' : 'border-rose-500/30 opacity-60'
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">
                  {language === 'ar' ? s.name_ar : s.name_fr}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'ar' ? s.name_fr : s.name_ar} • {s.duration_min} min
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ms-3">
                <span className="font-bold text-amber-400 text-sm">{formatDZD(s.price)}</span>
                <button
                  onClick={() => openEdit(s)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => void deleteService(s.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-white">
                {editing ? t('settings.editService') : t('settings.addService')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveService(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('settings.serviceNameFr')}
                </label>
                <input
                  type="text"
                  required
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('settings.serviceNameAr')}
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('settings.price')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('settings.duration')}
                  </label>
                  <input
                    type="number"
                    min={5}
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span>{t('app.active')}</span>
              </label>

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
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold cursor-pointer"
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

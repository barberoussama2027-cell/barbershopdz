import React, { useState } from 'react';
import { Scissors, Lock, Mail, Languages, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const { signIn, signInDemo, isDemoMode } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setErrorKey(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="pointer-events-none absolute -top-32 -start-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -end-32 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <Languages className="w-4 h-4 text-amber-400" />
            <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
          </button>
        </div>

        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 mb-4">
              <Scissors className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">{t('auth.loginTitle')}</h1>
            <p className="text-sm text-slate-400 mt-1.5">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@salon.dz"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition"
                />
              </div>
            </div>

            {errorKey && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs text-rose-300">
                {t(errorKey)}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-60 cursor-pointer"
            >
              {submitting ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          {isDemoMode && (
            <div className="mt-7 pt-6 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>{t('auth.demoQuickLogin')}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => signInDemo('demo-gerant-1')}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-sm text-amber-200 font-medium transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    {t('auth.demoGerant')}
                  </span>
                  <span className="text-xs text-amber-400/80">gerant@barbershop.dz</span>
                </button>
                <button
                  type="button"
                  onClick={() => signInDemo('demo-coiffeur-1')}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-sm text-slate-200 font-medium transition cursor-pointer"
                >
                  <span>{t('auth.demoCoiffeur1')}</span>
                  <span className="text-xs text-slate-400">55%</span>
                </button>
                <button
                  type="button"
                  onClick={() => signInDemo('demo-coiffeur-2')}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-sm text-slate-200 font-medium transition cursor-pointer"
                >
                  <span>{t('auth.demoCoiffeur2')}</span>
                  <span className="text-xs text-slate-400">50%</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

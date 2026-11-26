import React from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  LogOut,
  Languages,
  AlertTriangle,
  Scissors,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSalonData } from '../context/SalonDataContext';
import { BarberLogo } from './BarberLogo';

export type ManagerTab = 'dashboard' | 'barbers' | 'expenses' | 'settings' | 'caisse';

interface LayoutProps {
  activeTab?: ManagerTab;
  onTabChange?: (tab: ManagerTab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, children }) => {
  const { profile, signOut, isDemoMode } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { salonSettings } = useSalonData();

  const isGerant = profile?.role === 'gerant';

  const navItems: { id: ManagerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'caisse', label: t('nav.caisse'), icon: <Scissors className="w-5 h-5" /> },
    { id: 'barbers', label: t('nav.barbers'), icon: <Users className="w-5 h-5" /> },
    { id: 'expenses', label: t('nav.expenses'), icon: <Receipt className="w-5 h-5" /> },
    { id: 'settings', label: t('nav.settings'), icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col">
      {isDemoMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs sm:text-sm text-amber-200 flex items-center justify-center gap-2 text-center">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{t('app.demoBanner')}</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar Desktop & Tablette (Gérant uniquement) */}
        {isGerant && onTabChange && (
          <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col shrink-0 border-e border-amber-500/15 bg-[#0a0d14]/90 backdrop-blur-2xl">
            <div className="p-5 lg:p-6 border-b border-amber-500/10 flex items-center gap-3.5">
              <BarberLogo size="md" />
              <div className="min-w-0">
                <h1 className="font-display font-bold text-base lg:text-lg gold-gradient-text truncate">
                  {salonSettings.salon_name}
                </h1>
                <p className="text-[11px] uppercase tracking-wider text-amber-400/80 font-semibold">
                  {t('roles.gerant')}
                </p>
              </div>
            </div>

            <nav className="flex-1 p-3.5 lg:p-4 space-y-1.5">
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-3.5 lg:p-4 border-t border-slate-800/80 space-y-3">
              <div className="px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleLanguage}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  <Languages className="w-4 h-4 text-amber-400" />
                  <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
                </button>
                <button
                  onClick={() => void signOut()}
                  title={t('auth.signOut')}
                  className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar (Mobile pour Gérant, ou Permanent pour Coiffeur) */}
          <header
            className={`sticky top-0 z-30 border-b border-amber-500/15 bg-[#07090e]/85 backdrop-blur-2xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 ${
              isGerant ? 'md:hidden' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <BarberLogo size="sm" />
              <div className="min-w-0">
                <h1 className="font-display font-bold text-sm sm:text-base gold-gradient-text truncate">
                  {salonSettings.salon_name}
                </h1>
                <p className="text-xs text-amber-400/90 truncate">
                  {profile?.full_name} •{' '}
                  {profile?.station_name || t(`roles.${profile?.role ?? 'coiffeur'}`)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                <Languages className="w-4 h-4 text-amber-400" />
                <span>{language === 'fr' ? 'العربية' : 'FR'}</span>
              </button>
              <button
                onClick={() => void signOut()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('auth.signOut')}</span>
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navigation Mobile uniquement (Gérant uniquement sur smartphone) */}
      {isGerant && onTabChange && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1.5 flex justify-around">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                  active ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span className="truncate max-w-[76px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

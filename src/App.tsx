import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SalonDataProvider } from './context/SalonDataContext';
import { Layout, type ManagerTab } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { BarbersPage } from './pages/BarbersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SettingsPage } from './pages/SettingsPage';
import { BarberPosPage } from './pages/BarberPosPage';

const AppRouter: React.FC = () => {
  const { profile, loading } = useAuth();
  const { t } = useLanguage();
  const [managerTab, setManagerTab] = useState<ManagerTab>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 text-sm font-semibold">
        {t('app.loading')}
      </div>
    );
  }

  if (!profile) {
    return <LoginPage />;
  }

  if (profile.role === 'coiffeur') {
    return (
      <Layout>
        <BarberPosPage />
      </Layout>
    );
  }

  return (
    <Layout activeTab={managerTab} onTabChange={setManagerTab}>
      {managerTab === 'dashboard' && <ManagerDashboardPage />}
      {managerTab === 'barbers' && <BarbersPage />}
      {managerTab === 'expenses' && <ExpensesPage />}
      {managerTab === 'settings' && <SettingsPage />}
    </Layout>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SalonDataProvider>
          <AppRouter />
        </SalonDataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

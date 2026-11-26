import React, { useMemo, useState } from 'react';
import { Plus, Trash2, X, Receipt } from 'lucide-react';
import { useSalonData } from '../context/SalonDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { ExpenseCategory, ExpenseType } from '../types';

const CATEGORIES: ExpenseCategory[] = [
  'loyer',
  'electricite',
  'produits',
  'lames',
  'cafe',
  'equipement',
  'autre',
];

export const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useSalonData();
  const { t, formatDZD } = useLanguage();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('produits');
  const [expenseType, setExpenseType] = useState<ExpenseType>('variable');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const fixed = expenses
      .filter((e) => e.expense_type === 'fixe')
      .reduce((s, e) => s + Number(e.amount), 0);
    const variable = expenses
      .filter((e) => e.expense_type === 'variable')
      .reduce((s, e) => s + Number(e.amount), 0);
    return { fixed, variable, total: fixed + variable };
  }, [expenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!title.trim() || Number.isNaN(numAmount) || numAmount < 0) return;

    setSaving(true);
    const res = await addExpense({
      title,
      category,
      expense_type: expenseType,
      amount: numAmount,
      expense_date: expenseDate,
      notes,
    });
    setSaving(false);
    if (!res.error) {
      setTitle('');
      setAmount('');
      setNotes('');
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {t('expenses.title')}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{t('expenses.subtitle')}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>{t('expenses.addExpense')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
          <p className="text-xs font-semibold text-slate-400">{t('dashboard.totalExpenses')}</p>
          <p className="text-2xl font-bold text-rose-400 mt-2">{formatDZD(totals.total)}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
          <p className="text-xs font-semibold text-slate-400">{t('expenses.totalFixed')}</p>
          <p className="text-2xl font-bold text-white mt-2">{formatDZD(totals.fixed)}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
          <p className="text-xs font-semibold text-slate-400">{t('expenses.totalVariable')}</p>
          <p className="text-2xl font-bold text-amber-300 mt-2">{formatDZD(totals.variable)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-800/80">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-slate-800/30 transition"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{exp.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {t(`expenses.categories.${exp.category}`)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        exp.expense_type === 'fixe'
                          ? 'bg-sky-500/15 text-sky-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {exp.expense_type === 'fixe' ? t('expenses.fixed') : t('expenses.variable')}
                    </span>
                    <span>{exp.expense_date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-rose-300 text-sm sm:text-base">
                  -{formatDZD(exp.amount)}
                </span>
                <button
                  onClick={() => void deleteExpense(exp.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                  title={t('app.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-10">{t('app.noData')}</p>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-white">{t('expenses.addExpense')}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleAdd(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('expenses.expenseTitle')}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('expenses.expenseTitlePlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('expenses.category')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(`expenses.categories.${c}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('expenses.type')}
                  </label>
                  <select
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="variable">{t('expenses.variable')}</option>
                    <option value="fixe">{t('expenses.fixed')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('expenses.amount')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t('app.date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('expenses.notes')}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

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

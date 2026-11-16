import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Calendar,
  Download,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Filter,
  Search,
  Building2,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const MonthlyFinancialReport = ({
  bookings = [],
  expenses = [],
  expensePayers = [],
  rooms = [],
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [subView, setSubView] = useState('pl_statement'); // 'pl_statement' | 'income' | 'expenses'
  const [incomeSearch, setIncomeSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  const monthStr = String(selectedMonth).padStart(2, '0');
  const monthKey = `${selectedYear}-${monthStr}`;
  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', {
    month: 'long',
  });

  // Quick navigation helpers
  const handleSetThisMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  const handleSetPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleSetNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // 1. Filter Bookings that belong to this month
  // A booking belongs to this month if its check_in_date starts with YYYY-MM
  // or check_out_date starts with YYYY-MM (non-cancelled)
  const monthlyBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!b || b.status === 'Cancelled') return false;
      const inMonth = b.check_in_date && b.check_in_date.startsWith(monthKey);
      const outMonth = b.check_out_date && b.check_out_date.startsWith(monthKey);
      return inMonth || outMonth;
    });
  }, [bookings, monthKey]);

  // 2. Filter Expenses that belong to this month
  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e || !e.date) return false;
      return e.date.startsWith(monthKey);
    });
  }, [expenses, monthKey]);

  // Income Calculations
  const totalRoomBill = useMemo(() => {
    return monthlyBookings.reduce((sum, b) => {
      const amt = b.bill_amount != null ? Number(b.bill_amount) : Number(b.total_amount || b.total_price || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [monthlyBookings]);

  const totalRoomExtras = useMemo(() => {
    return monthlyBookings.reduce((sum, b) => {
      const extras = Array.isArray(b.room_expenses) ? b.room_expenses : [];
      const rowExtras = extras.reduce((s, x) => s + (Number(x.amount) || 0), 0);
      return sum + rowExtras;
    }, 0);
  }, [monthlyBookings]);

  const totalGrossIncome = totalRoomBill + totalRoomExtras;

  const totalReferralCommission = useMemo(() => {
    return monthlyBookings.reduce((sum, b) => {
      return sum + (Number(b.referral_commission) || 0);
    }, 0);
  }, [monthlyBookings]);

  // Expense Calculations
  const totalExpenses = useMemo(() => {
    return monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthlyExpenses]);

  // Net Operating Profit / Balance
  const netProfit = totalGrossIncome - totalExpenses;
  const profitMargin = totalGrossIncome > 0 ? ((netProfit / totalGrossIncome) * 100).toFixed(1) : 0;

  // Expenses grouped by Category
  const expensesByCategory = useMemo(() => {
    const map = {};
    monthlyExpenses.forEach((e) => {
      const cat = e.category || 'Miscellaneous';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthlyExpenses]);

  // Expenses grouped by Payer
  const expensesByPayer = useMemo(() => {
    const map = {};
    monthlyExpenses.forEach((e) => {
      const payer = e.payer_name || 'Common Homestay Pool';
      map[payer] = (map[payer] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthlyExpenses]);

  // Filtered lists for detailed tables
  const filteredIncomeRows = useMemo(() => {
    if (!incomeSearch.trim()) return monthlyBookings;
    const term = incomeSearch.toLowerCase();
    return monthlyBookings.filter((b) => {
      return (
        (b.guest_name || '').toLowerCase().includes(term) ||
        (b.booking_ref || '').toLowerCase().includes(term) ||
        (b.room_number || '').toLowerCase().includes(term) ||
        (b.referred_by || '').toLowerCase().includes(term)
      );
    });
  }, [monthlyBookings, incomeSearch]);

  const filteredExpenseRows = useMemo(() => {
    return monthlyExpenses.filter((e) => {
      const matchesCat = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
      const term = expenseSearch.toLowerCase();
      const matchesSearch =
        !term ||
        (e.description || '').toLowerCase().includes(term) ||
        (e.payer_name || '').toLowerCase().includes(term) ||
        (e.category || '').toLowerCase().includes(term);
      return matchesCat && matchesSearch;
    });
  }, [monthlyExpenses, expenseCategoryFilter, expenseSearch]);

  // Export Complete Financial CSV
  const exportFinancialCSV = () => {
    const lines = [];

    // Header
    lines.push(`"SOMAJAM HOLIDAYS - MONTHLY FINANCIAL STATEMENT"`);
    lines.push(`"Month:","${monthName} ${selectedYear}"`);
    lines.push(`"Generated On:","${new Date().toLocaleString()}"`);
    lines.push(``);

    // Summary Block
    lines.push(`"EXECUTIVE P&L SUMMARY"`);
    lines.push(`"Total Room Stay Bill Amount (₹)",${totalRoomBill}`);
    lines.push(`"Total Room Extras / Incidentals (₹)",${totalRoomExtras}`);
    lines.push(`"Total Gross Revenue / Income (₹)",${totalGrossIncome}`);
    lines.push(`"Total Operating Expenses (₹)",${totalExpenses}`);
    lines.push(`"Net Operating Profit / Surplus (₹)",${netProfit}`);
    lines.push(`"Operating Profit Margin (%)",${profitMargin}%`);
    lines.push(`"Total Referral Commissions Recorded (₹)",${totalReferralCommission}`);
    lines.push(``);

    // Category-wise Expense Breakdown
    lines.push(`"EXPENSE BREAKDOWN BY CATEGORY"`);
    lines.push(`"Category","Amount (INR)","% of Total Expenses"`);
    expensesByCategory.forEach(([cat, amt]) => {
      const pct = totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : 0;
      lines.push(`"${cat}",${amt},"${pct}%"`);
    });
    lines.push(``);

    // Detailed Income Register
    lines.push(`"DETAILED REVENUE REGISTER (BOOKINGS)"`);
    lines.push(
      `"Booking Ref","Guest Name","Cottage","Check-In","Check-Out","Nights","Guests","Status","Room Bill (₹)","Extras (₹)","Total Billed (₹)","Referred By","Referral Comm (₹)"`
    );
    monthlyBookings.forEach((b) => {
      const inDate = new Date(b.check_in_date);
      const outDate = new Date(b.check_out_date);
      const nights = !isNaN(inDate) && !isNaN(outDate)
        ? Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)))
        : 1;
      const billAmt = b.bill_amount != null ? Number(b.bill_amount) : Number(b.total_amount || b.total_price || 0);
      const extras = Array.isArray(b.room_expenses)
        ? b.room_expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0)
        : 0;
      const total = billAmt + extras;

      lines.push(
        `"${b.booking_ref}","${(b.guest_name || '').replace(/"/g, '""')}","Cottage ${b.room_number}","${b.check_in_date}","${b.check_out_date}",${nights},${b.num_guests || 2},"${b.status}",${billAmt},${extras},${total},"${(b.referred_by || 'Direct').replace(/"/g, '""')}",${Number(b.referral_commission || 0)}`
      );
    });
    lines.push(``);

    // Detailed Expenses Ledger
    lines.push(`"DETAILED EXPENSE REGISTER (EXPENSE TRACKER)"`);
    lines.push(`"Date","Category","Description","Paid By","Payment Method","Amount (INR)","Reimbursement Status"`);
    monthlyExpenses.forEach((e) => {
      lines.push(
        `"${e.date}","${e.category || ''}","${(e.description || '').replace(/"/g, '""')}","${e.payer_name || ''}","${e.payment_method || ''}",${Number(e.amount) || 0},"${e.reimbursement_status || 'Settled'}"`
      );
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Somajam_Financial_Report_${monthName}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // Print Financial Statement
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Month & Year Selection Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Monthly Financial Period:</h3>
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {[
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
            ].map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {[2024, 2025, 2026, 2027, 2028].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* Quick jumps */}
          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={handleSetPrevMonth}
              className="px-2 py-1.5 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              title="Previous Month"
            >
              ← Prev
            </button>
            <button
              onClick={handleSetThisMonth}
              className="px-2.5 py-1.5 text-[11px] rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 transition-colors"
            >
              This Month
            </button>
            <button
              onClick={handleSetNextMonth}
              className="px-2 py-1.5 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              title="Next Month"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Action Buttons: Export CSV & Print */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={exportFinancialCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title="Print Monthly Financial Statement"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards (Income, Expenses, Net Profit, Referrals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Revenue / Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-mono">
              ₹{totalGrossIncome.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Room Stay Bills:</span>
              <strong className="text-slate-200 font-mono">₹{totalRoomBill.toLocaleString('en-IN')}</strong>
            </div>
            {totalRoomExtras > 0 && (
              <div className="flex justify-between text-teal-400">
                <span>Room Extras / Incidentals:</span>
                <strong className="font-mono">+₹{totalRoomExtras.toLocaleString('en-IN')}</strong>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[10px] pt-0.5">
              <span>Active Stays:</span>
              <span>{monthlyBookings.length} booking(s)</span>
            </div>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-rose-500/30 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Total Operating Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-mono">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Expense Vouchers:</span>
              <strong className="text-slate-200">{monthlyExpenses.length} entries</strong>
            </div>
            <div className="flex justify-between">
              <span>Top Category:</span>
              <strong className="text-rose-300">
                {expensesByCategory.length > 0 ? expensesByCategory[0][0] : 'None logged'}
              </strong>
            </div>
            <div className="flex justify-between text-slate-500 text-[10px] pt-0.5">
              <span>Source:</span>
              <span>Expense Tracker tab</span>
            </div>
          </div>
        </div>

        {/* Net Operating Surplus / Profit Card */}
        <div
          className={`p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border shadow-xl space-y-2 relative overflow-hidden ${
            netProfit >= 0 ? 'border-teal-500/40' : 'border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                netProfit >= 0 ? 'text-teal-400' : 'text-amber-400'
              }`}
            >
              {netProfit >= 0 ? 'Net Operating Profit' : 'Operating Deficit'}
            </span>
            <div
              className={`p-2 rounded-xl border ${
                netProfit >= 0
                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              ₹{netProfit.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Profit Margin:</span>
              <strong className={netProfit >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {profitMargin}%
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Formula:</span>
              <span className="text-slate-400 text-[10px]">Revenue - Expenses</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[10px] pt-0.5">
              <span>Financial Status:</span>
              <span className={netProfit >= 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {netProfit >= 0 ? 'Healthy Surplus' : 'Action Needed'}
              </span>
            </div>
          </div>
        </div>

        {/* Referrals & Commissions Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Referrals & Incidentals
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-mono">
              ₹{totalReferralCommission.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Referral Commissions:</span>
              <strong className="text-amber-400 font-mono">₹{totalReferralCommission.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span>Incidentals Billed:</span>
              <strong className="text-teal-400 font-mono">₹{totalRoomExtras.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between text-slate-500 text-[10px] pt-0.5">
              <span>Referred Stays:</span>
              <span>{monthlyBookings.filter((b) => b.referred_by).length} booking(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSubView('pl_statement')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subView === 'pl_statement'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Executive P&L Statement</span>
        </button>

        <button
          onClick={() => setSubView('income')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subView === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          <span>Income Details ({monthlyBookings.length})</span>
        </button>

        <button
          onClick={() => setSubView('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            subView === 'expenses'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          <span>Expense Details ({monthlyExpenses.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: EXECUTIVE P&L STATEMENT                                       */}
      {/* ========================================================================= */}
      {subView === 'pl_statement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Revenue Schedule */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-sm text-slate-100">Revenue & Inflows Schedule</h4>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ₹{totalGrossIncome.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                  <div>
                    <p className="font-bold text-slate-200">Room Stay Billings (Actual)</p>
                    <p className="text-[11px] text-slate-500">Agreed stay rates after discounts</p>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-100">
                    ₹{totalRoomBill.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                  <div>
                    <p className="font-bold text-slate-200">Room Incidentals & Extra Expenses</p>
                    <p className="text-[11px] text-slate-500">Campfire, BBQ, extra beds, meals & tea</p>
                  </div>
                  <span className="font-mono font-bold text-sm text-teal-400">
                    + ₹{totalRoomExtras.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Total Billed Homestay Revenue:</span>
                  <span className="text-emerald-400 font-mono text-base font-extrabold">
                    ₹{totalGrossIncome.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Referral summary */}
              {totalReferralCommission > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                  <span className="text-amber-300 font-medium">Referral Commissions Recorded:</span>
                  <span className="font-mono font-bold text-amber-400">
                    ₹{totalReferralCommission.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Expense Category Schedule */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                  <h4 className="font-bold text-sm text-slate-100">Operational Expenses by Category</h4>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">
                  ₹{totalExpenses.toLocaleString('en-IN')}
                </span>
              </div>

              {expensesByCategory.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No operational expenses logged for {monthName} {selectedYear}.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {expensesByCategory.map(([cat, amt]) => {
                    const pct = totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : 0;
                    return (
                      <div
                        key={cat}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-200">{cat}</p>
                          <p className="text-[10px] text-slate-500">{pct}% of monthly outlays</p>
                        </div>
                        <span className="font-mono font-bold text-rose-300">
                          ₹{amt.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Total Operating Expenses:</span>
                <span className="text-rose-400 font-mono text-base font-extrabold">
                  ₹{totalExpenses.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Consolidated Executive Summary Banner */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Executive Profit & Loss Statement for {monthName} {selectedYear}
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Financial Line Item</th>
                    <th className="p-3">Reference / Scope</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  <tr>
                    <td className="p-3 text-slate-200 font-semibold">1. Total Homestay Billing Revenue</td>
                    <td className="p-3 text-slate-400">Sum of all actual booking bill amounts</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ₹{totalRoomBill.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-200 font-semibold">2. In-Stay Room Extras & Incidentals</td>
                    <td className="p-3 text-slate-400">Campfire, BBQ, food, extra beds settled</td>
                    <td className="p-3 text-right font-mono font-bold text-teal-400">
                      + ₹{totalRoomExtras.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-slate-950/60 font-bold">
                    <td className="p-3 text-slate-100">A. GROSS OPERATING REVENUE</td>
                    <td className="p-3 text-slate-400">Total client receipts</td>
                    <td className="p-3 text-right font-mono font-extrabold text-emerald-400 text-sm">
                      ₹{totalGrossIncome.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-200 font-semibold">3. Operating Expenses</td>
                    <td className="p-3 text-slate-400">Utilities, repairs, caretaker wages, amenities</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-400">
                      - ₹{totalExpenses.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-emerald-500/5 font-extrabold text-sm border-t-2 border-emerald-500/40">
                    <td className="p-4 text-slate-100 flex items-center gap-2">
                      <span>B. NET OPERATING PROFIT / SURPLUS</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded">
                        Margin: {profitMargin}%
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-normal text-xs">Revenue minus Expenses</td>
                    <td
                      className={`p-4 text-right font-mono text-base ${
                        netProfit >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      ₹{netProfit.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: DETAILED INCOME RECORDS (BOOKINGS)                           */}
      {/* ========================================================================= */}
      {subView === 'income' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest, ref, room, or referrer..."
                value={incomeSearch}
                onChange={(e) => setIncomeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing <strong className="text-slate-200">{filteredIncomeRows.length}</strong> stays contributing to {monthName} income
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Ref / Cottage</th>
                    <th className="p-3.5">Guest Full Name</th>
                    <th className="p-3.5">Stay Dates</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Room Bill (₹)</th>
                    <th className="p-3.5 text-right">Extras (₹)</th>
                    <th className="p-3.5 text-right">Total Billed (₹)</th>
                    <th className="p-3.5">Referral Attribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredIncomeRows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-500">
                        No bookings found for {monthName} {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    filteredIncomeRows.map((b) => {
                      const billAmt = b.bill_amount != null ? Number(b.bill_amount) : Number(b.total_amount || b.total_price || 0);
                      const extras = Array.isArray(b.room_expenses)
                        ? b.room_expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0)
                        : 0;
                      const total = billAmt + extras;

                      return (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-emerald-400">{b.booking_ref}</span>
                            <span className="block text-[10px] text-slate-400">Cottage {b.room_number}</span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-100">{b.guest_name}</td>
                          <td className="p-3.5 text-[11px] text-slate-400">
                            <div>{b.check_in_date} → {b.check_out_date}</div>
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-200">
                            ₹{billAmt.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-right font-mono text-teal-400">
                            {extras > 0 ? `+ ₹${extras.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="p-3.5 text-right font-mono font-extrabold text-emerald-400">
                            ₹{total.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-[11px]">
                            {b.referred_by ? (
                              <div className="space-y-0.5">
                                <span className="text-teal-400 font-semibold">{b.referred_by}</span>
                                {b.referral_commission > 0 && (
                                  <span className="block text-[10px] font-mono text-amber-400">
                                    Comm: ₹{Number(b.referral_commission).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">Direct</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredIncomeRows.length > 0 && (
                  <tfoot className="bg-slate-950 text-xs font-bold border-t border-slate-800">
                    <tr>
                      <td colSpan="4" className="p-3.5 text-slate-300 uppercase">
                        Subtotal ({filteredIncomeRows.length} Stays):
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-100">
                        ₹{totalRoomBill.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-mono text-teal-400">
                        + ₹{totalRoomExtras.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-400 text-sm">
                        ₹{totalGrossIncome.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono text-amber-400 text-[11px]">
                        Comm: ₹{totalReferralCommission.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: DETAILED EXPENSES (FROM EXPENSE TRACKER)                      */}
      {/* ========================================================================= */}
      {subView === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search description, payer..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Expense Categories</option>
                <option value="Utilities">Utilities</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Staff Wages">Caretaker Wages</option>
                <option value="Guest Amenities">Guest Amenities</option>
                <option value="Food & Kitchen">Food & Kitchen</option>
                <option value="Govt Taxes">Govt Taxes</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div className="text-xs text-slate-400">
              Showing <strong className="text-slate-200">{filteredExpenseRows.length}</strong> vouchers logged in {monthName}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Paid By</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredExpenseRows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No expense records found for {monthName} {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenseRows.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400">{e.date}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-200">{e.description}</td>
                        <td className="p-3.5 text-slate-300">{e.payer_name}</td>
                        <td className="p-3.5 text-slate-400">{e.payment_method || 'Cash'}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-300">
                          ₹{Number(e.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              e.reimbursement_status === 'Pending Reimbursement'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {e.reimbursement_status || 'Settled'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredExpenseRows.length > 0 && (
                  <tfoot className="bg-slate-950 text-xs font-bold border-t border-slate-800">
                    <tr>
                      <td colSpan="5" className="p-3.5 text-slate-300 uppercase">
                        Total Expenses ({filteredExpenseRows.length} Vouchers):
                      </td>
                      <td className="p-3.5 text-right font-mono text-rose-400 text-sm">
                        ₹{totalExpenses.toLocaleString('en-IN')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


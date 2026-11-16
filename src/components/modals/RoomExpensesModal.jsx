import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Receipt, BedDouble, Utensils, Flame, Coffee, Sparkles } from 'lucide-react';

export const RoomExpensesModal = ({ isOpen, onClose, booking }) => {
  const { addRoomExpense, removeRoomExpense } = useApp();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!booking) return null;

  const expenses = Array.isArray(booking.room_expenses) ? booking.room_expenses : [];
  const extraExpensesTotal = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const roomStayBill = Number(booking.bill_amount ?? booking.total_amount ?? 0);
  const grandTotal = roomStayBill + extraExpensesTotal;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please enter an expense description');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }

    addRoomExpense(booking.id, {
      description: description.trim(),
      amount: numAmount,
    });

    setDescription('');
    setAmount('');
    setErrorMsg('');
  };

  const handleQuickPreset = (presetName, defaultAmt = '') => {
    setDescription(presetName);
    if (defaultAmt) setAmount(String(defaultAmt));
    setErrorMsg('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Incidentals & Extra Expenses">
      <div className="space-y-4">
        {/* Booking & Cottage Header Info */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400">{booking.booking_ref}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {booking.room_number}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-100 mt-1">{booking.guest_name}</h4>
          </div>
          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Stay Rate</span>
            <span className="text-sm font-extrabold text-slate-200">₹{roomStayBill.toLocaleString()}</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick Suggestions:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Extra Bed / Mattress', icon: BedDouble, amt: 500 },
              { label: 'Campfire Wood', icon: Flame, amt: 400 },
              { label: 'BBQ / Grilling Charcoal', icon: Flame, amt: 350 },
              { label: 'Breakfast / Meals', icon: Utensils, amt: 300 },
              { label: 'Tea / Beverages', icon: Coffee, amt: 150 },
            ].map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleQuickPreset(preset.label, preset.amt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1"
                >
                  <Icon className="w-3 h-3 text-slate-400" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add New Expense Inline Form */}
        <form onSubmit={handleAdd} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
            <h5 className="text-xs font-bold text-slate-200">Add New Expense Item</h5>
          </div>

          {errorMsg && (
            <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
              {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-7">
              <input
                type="text"
                placeholder="Description (e.g. Extra Bed, Campfire, Food)"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-full min-h-[34px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        </form>

        {/* Existing Room Expenses Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Logged Expenses for this Stay</span>
            <span className="text-[11px] font-mono text-slate-400">
              {expenses.length} item{expenses.length !== 1 ? 's' : ''}
            </span>
          </div>

          {expenses.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
              No extra expenses logged yet. Use the form above to add items like extra beds, meals, or campfire wood.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {expenses.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-900/40">
                      <td className="p-3 text-slate-500 font-sans">{idx + 1}</td>
                      <td className="p-3 font-sans font-medium text-slate-200">
                        {item.description}
                        {item.created_at && (
                          <span className="block text-[9px] text-slate-500 font-mono">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        ₹{(Number(item.amount) || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeRoomExpense(booking.id, item.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete expense entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bill Summary Settlement Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Room Stay Bill (Agreed):</span>
            <span className="font-mono text-slate-200 font-semibold">₹{roomStayBill.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Incidentals & Extra Expenses:</span>
            <span className="font-mono text-amber-400 font-semibold">+ ₹{extraExpensesTotal.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-100 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Total Payable at Check-Out:
            </span>
            <span className="font-mono text-base text-emerald-400 font-extrabold">
              ₹{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Close & Save
          </button>
        </div>
      </div>
    </Modal>
  );
};


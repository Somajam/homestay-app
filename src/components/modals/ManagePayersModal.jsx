import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { UserPlus, Users, Trash2, CheckCircle2, Phone, CreditCard, Tag } from 'lucide-react';
import { sanitizePhoneNumber, isValidPhoneNumber } from '../../utils/phoneValidation';

export const ManagePayersModal = ({ isOpen, onClose }) => {
  const { expensePayers = [], expenses = [], addExpensePayer, deleteExpensePayer, currentRole, showToast } = useApp();

  const [name, setName] = useState('');
  const [groupTag, setGroupTag] = useState('Director');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');

  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (phone.trim() && !isValidPhoneNumber(phone)) {
      showToast('Mobile number must contain at least 10 digits and cannot contain letters!', 'warning');
      return;
    }

    addExpensePayer({
      name: name.trim(),
      group_tag: groupTag,
      phone: phone.trim(),
      upi_id: upiId.trim(),
    });

    setName('');
    setPhone('');
    setUpiId('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Expense Accounts & Users">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Form to Add New User / Expense Account */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Add New Expense Account / Director / User
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Director 6 (Anil) or Vendor Account"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" /> Account Category / Group *
              </label>
              <select
                value={groupTag}
                onChange={(e) => setGroupTag(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Director">Director</option>
                <option value="Caretaker">Caretaker / Operations</option>
                <option value="Common Pool">Common Homestay Pool</option>
                <option value="Partner">Partner / Shareholder</option>
                <option value="Other">Other User / Account</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Mobile Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98470 00000"
                value={phone}
                onChange={(e) => setPhone(sanitizePhoneNumber(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-emerald-400" /> UPI ID / Bank Info (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. user@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Account
            </button>
          </div>
        </form>

        {/* Existing Accounts Directory List */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            Registered Expense Accounts ({expensePayers.length})
          </h4>

          <div className="space-y-2">
            {expensePayers.map((p) => {
              if (!p) return null;
              const linkedCount = safeExpenses.filter((e) => e && e.payer_id === p.id).length;

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{p.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.group_tag || 'User'}
                      </span>
                      {linkedCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {linkedCount} Transaction(s)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-500">
                          No Transactions
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                      {p.phone && <span>Phone: {p.phone}</span>}
                      {p.upi_id && <span className="font-mono text-slate-300">UPI: {p.upi_id}</span>}
                    </div>
                  </div>

                  {currentRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => deleteExpensePayer(p.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        linkedCount > 0
                          ? 'text-slate-600 cursor-not-allowed hover:bg-slate-900'
                          : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
                      }`}
                      title={
                        linkedCount > 0
                          ? `Cannot delete user: ${linkedCount} transaction(s) exist for this account. Delete transactions first!`
                          : 'Delete Account'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

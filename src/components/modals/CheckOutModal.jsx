import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  LogOut,
  CheckSquare,
  FileText,
  BedDouble,
  Receipt,
  ChevronDown,
  ChevronUp,
  Tag,
  RotateCcw,
  Percent,
} from 'lucide-react';

export const CheckOutModal = ({ isOpen, onClose, booking }) => {
  const { processCheckOut } = useApp();
  const [staffNotes, setStaffNotes] = useState('');
  const [roomInspected, setRoomInspected] = useState(true);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [showItemizedExtras, setShowItemizedExtras] = useState(false);

  // Settlement calculations
  const expenses = Array.isArray(booking?.room_expenses) ? booking.room_expenses : [];
  const extraExpensesTotal = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const roomStayBill = Number(booking?.bill_amount ?? booking?.total_amount ?? 0);
  const grandTotal = roomStayBill + extraExpensesTotal;

  // Actual amount received and discount override state
  const [actualAmountReceived, setActualAmountReceived] = useState(String(grandTotal));
  const [isDiscountEdited, setIsDiscountEdited] = useState(false);

  useEffect(() => {
    if (booking) {
      setActualAmountReceived(String(grandTotal));
      setIsDiscountEdited(false);
    }
  }, [booking?.id, grandTotal]);

  if (!booking) return null;

  const numReceived = actualAmountReceived !== '' && !isNaN(Number(actualAmountReceived))
    ? Math.max(0, Number(actualAmountReceived))
    : grandTotal;
  const discountGiven = Math.max(0, grandTotal - numReceived);
  const discountPct = grandTotal > 0 ? Math.round((discountGiven / grandTotal) * 100) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    processCheckOut(booking.id, {
      staffNotes: staffNotes.trim(),
      paymentMode,
      actualAmountReceived: numReceived,
      discountAmount: discountGiven,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guest Check-Out & Bill Settlement">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Booking Summary Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {booking.booking_ref}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
              Room: {booking.room_number}
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-100">
            {booking.guest_name}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <div>Check-in: <strong className="text-slate-200">{booking.check_in_date}</strong></div>
            <div>Check-out: <strong className="text-slate-200">{booking.check_out_date}</strong></div>
          </div>
          {booking.referred_by && (
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
              Referred by: <strong className="text-teal-400">{booking.referred_by}</strong>
            </div>
          )}
        </div>

        {/* Financial Settlement Breakdown Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Final Settlement Breakdown
            </h5>
            <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              To Settle
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Room Stay Charge (Actual Bill):</span>
              <span className="font-mono font-semibold text-slate-100">₹{roomStayBill.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-1.5">
                <span>Room Incidentals / Extras:</span>
                {expenses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowItemizedExtras(!showItemizedExtras)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline flex items-center gap-0.5"
                  >
                    ({expenses.length} item{expenses.length !== 1 ? 's' : ''})
                    {showItemizedExtras ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
              <span className={`font-mono font-semibold ${extraExpensesTotal > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                + ₹{extraExpensesTotal.toLocaleString()}
              </span>
            </div>

            {/* Collapsible Itemized Extras */}
            {showItemizedExtras && expenses.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px] animate-in fade-in">
                {expenses.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between text-slate-400">
                    <span>• {item.description}</span>
                    <span className="font-mono text-slate-200">₹{(Number(item.amount) || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-sm font-bold">
              <span className="text-slate-100">Total Standard Billed (Room + Extras):</span>
              <span className="font-mono text-base text-slate-100 font-bold">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>

            {/* Editable Actual Amount Received / Final Negotiated Settlement */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Actual Final Amount Received (₹) *
                </label>
                {isDiscountEdited && (
                  <button
                    type="button"
                    onClick={() => {
                      setActualAmountReceived(String(grandTotal));
                      setIsDiscountEdited(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to Standard (₹{grandTotal.toLocaleString()})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    data-testid="input-checkout-received-amount"
                    value={actualAmountReceived}
                    onChange={(e) => {
                      setActualAmountReceived(e.target.value);
                      setIsDiscountEdited(true);
                    }}
                    placeholder={String(grandTotal)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-950 border border-emerald-500/50 rounded-xl text-emerald-400 font-mono font-extrabold focus:outline-none focus:border-emerald-400 shadow-inner"
                  />
                </div>

                {/* Quick discount chips */}
                <div className="flex items-center gap-1">
                  {[200, 500, 1000].map((disc) => (
                    <button
                      key={disc}
                      type="button"
                      onClick={() => {
                        const newAmt = Math.max(0, grandTotal - disc);
                        setActualAmountReceived(String(newAmt));
                        setIsDiscountEdited(true);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-300 text-[10px] font-semibold border border-slate-800 transition-colors"
                      title={`Give ₹${disc} discount`}
                    >
                      -₹{disc}
                    </button>
                  ))}
                  {grandTotal % 500 !== 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const rounded = Math.floor(grandTotal / 500) * 500;
                        setActualAmountReceived(String(rounded));
                        setIsDiscountEdited(true);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-teal-300 text-[10px] font-semibold border border-slate-800 transition-colors"
                      title="Round off to nearest 500"
                    >
                      Round
                    </button>
                  )}
                </div>
              </div>

              {/* Concession / Discount Banner */}
              {discountGiven > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Percent className="w-3.5 h-3.5 shrink-0" />
                    <span>Discount / Bargain Given:</span>
                  </div>
                  <div className="font-mono text-right">
                    <span className="font-extrabold text-emerald-400">₹{discountGiven.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-300/80 ml-1">({discountPct}% off standard)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2 border-t border-slate-800/60">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Settlement Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {['UPI', 'Cash', 'Card', 'Bank Transfer'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                    paymentMode === mode
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Room Inspection Checkbox */}
        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={roomInspected}
            onChange={(e) => setRoomInspected(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-300 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            Room inspected & key returned by guest
          </span>
        </label>

        {/* Room Status Transition Notice */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <BedDouble className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Upon completion, <strong>{booking.room_number}</strong> will automatically be set back to <strong>AVAILABLE</strong> status.
          </span>
        </div>

        {/* Staff Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Check-Out Departure Notes
          </label>
          <textarea
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
            placeholder="e.g. Bill paid via UPI, key handed over, guest appreciated valley view..."
            className="w-full h-16 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Settle Bill (₹{numReceived.toLocaleString()}) & Check-Out
          </button>
        </div>
      </form>
    </Modal>
  );
};

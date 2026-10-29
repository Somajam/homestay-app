import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  BedDouble,
  CheckSquare,
  Sun,
  Moon,
  Plus,
  X,
  Sparkles,
  Users,
  ShieldCheck,
  Check,
  Tag,
} from 'lucide-react';

const COMMON_FACILITIES = [
  'Swimming Pool Access',
  'Free Wi-Fi',
  'EV Charging',
  'Kitchenette',
  'Valley View Patio',
  'Campfire Zone',
  'Private Balcony',
  'Hot Water Shower',
  'Audio System',
  'Grilling Area',
  'Drivers Lounge Access',
  'Full Kitchen',
  'Mountain View',
  'AC',
  'Flat TV',
];

export const RoomModal = ({ isOpen, onClose, roomToEdit = null }) => {
  const { addRoom, updateRoom, currentRole, showToast } = useApp();

  const isEditing = Boolean(roomToEdit);

  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('1BHK Cottage');
  const [capacity, setCapacity] = useState(4);
  const [weekdayRate, setWeekdayRate] = useState(3500);
  const [weekendRate, setWeekendRate] = useState(4500);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [customAmenity, setCustomAmenity] = useState('');

  // Synchronize state when modal opens or editing target changes
  useEffect(() => {
    if (isOpen) {
      if (roomToEdit) {
        setRoomNumber(roomToEdit.room_number || '');
        setRoomType(roomToEdit.room_type || '1BHK Cottage');
        setCapacity(roomToEdit.capacity || 4);
        setWeekdayRate(roomToEdit.weekday_rate ?? roomToEdit.price_per_night ?? 3500);
        setWeekendRate(
          roomToEdit.weekend_rate ??
            (roomToEdit.weekday_rate ? Math.round(roomToEdit.weekday_rate * 1.25) : 4500)
        );
        setSelectedFacilities(
          Array.isArray(roomToEdit.facilities) ? [...roomToEdit.facilities] : []
        );
      } else {
        setRoomNumber('');
        setRoomType('1BHK Cottage');
        setCapacity(4);
        setWeekdayRate(3500);
        setWeekendRate(4500);
        setSelectedFacilities([
          'Swimming Pool Access',
          'Free Wi-Fi',
          'EV Charging',
          'Kitchenette',
        ]);
      }
      setCustomAmenity('');
    }
  }, [isOpen, roomToEdit]);

  // Toggle standard amenity from list
  const toggleFacility = (facility) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities((prev) => prev.filter((f) => f !== facility));
    } else {
      setSelectedFacilities((prev) => [...prev, facility]);
    }
  };

  // Add custom amenity
  const handleAddCustomAmenity = (e) => {
    if (e) e.preventDefault();
    const trimmed = customAmenity.trim();
    if (!trimmed) return;

    if (selectedFacilities.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`"${trimmed}" is already in the amenities list`, 'warning');
      setCustomAmenity('');
      return;
    }

    setSelectedFacilities((prev) => [...prev, trimmed]);
    setCustomAmenity('');
  };

  // Remove specific amenity
  const removeFacility = (facilityToRemove) => {
    setSelectedFacilities((prev) => prev.filter((f) => f !== facilityToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentRole !== 'admin') {
      showToast('Permission Denied: Only Admins can configure or modify rooms', 'error');
      return;
    }

    if (!roomNumber.trim()) {
      showToast('Please enter room name or number (e.g. No. 1 or Villa 101)', 'warning');
      return;
    }

    const payload = {
      room_number: roomNumber.trim(),
      room_type: roomType,
      capacity: parseInt(capacity, 10) || 2,
      weekday_rate: parseInt(weekdayRate, 10) || 3500,
      weekend_rate: parseInt(weekendRate, 10) || 4500,
      price_per_night: parseInt(weekdayRate, 10) || 3500,
      facilities: selectedFacilities,
    };

    if (isEditing && roomToEdit?.id) {
      await updateRoom(roomToEdit.id, payload);
    } else {
      await addRoom(payload);
    }

    onClose();
  };

  const rateDiff = (parseInt(weekendRate, 10) || 0) - (parseInt(weekdayRate, 10) || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Cottage Rates & Amenities — ${roomToEdit.room_number}` : 'Add New Homestay Cottage'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Name & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
              Cottage Name / Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. No. 1, Cottage 6, Deluxe Suite..."
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Category *
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="1BHK Cottage">1BHK Cottage (Somajam Standard)</option>
              <option value="Single">Single Room</option>
              <option value="Double">Double Deluxe</option>
              <option value="Deluxe">Premium Suite</option>
              <option value="Family">Family Villa</option>
            </select>
          </div>
        </div>

        {/* Max Capacity */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Max Guest Capacity *
          </label>
          <input
            type="number"
            min="1"
            max="12"
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full sm:w-1/2 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* TWO ROOM RATES: WEEKDAY VS WEEKEND */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Nightly Pricing Structure
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Set distinct rates for weekdays vs weekend nights
              </p>
            </div>
            {rateDiff !== 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {rateDiff > 0 ? `+₹${rateDiff.toLocaleString('en-IN')} weekend surge` : `₹${Math.abs(rateDiff).toLocaleString('en-IN')} weekend discount`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Weekday Rate */}
            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/20 space-y-1.5">
              <label className="block text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Weekday Rate (₹ / night) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  step="50"
                  min="0"
                  required
                  value={weekdayRate}
                  onChange={(e) => setWeekdayRate(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-950 border border-slate-800 rounded-lg text-amber-200 focus:outline-none focus:border-amber-400"
                  placeholder="3500"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Applies to <strong className="text-slate-300">Sunday through Thursday</strong> nights
              </p>
            </div>

            {/* Weekend Rate */}
            <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/20 space-y-1.5">
              <label className="block text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-teal-400" />
                Weekend Rate (₹ / night) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  step="50"
                  min="0"
                  required
                  value={weekendRate}
                  onChange={(e) => setWeekendRate(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-950 border border-slate-800 rounded-lg text-teal-200 focus:outline-none focus:border-teal-400"
                  placeholder="4500"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Applies to <strong className="text-slate-300">Friday & Saturday</strong> nights
              </p>
            </div>
          </div>
        </div>

        {/* FACILITIES & AMENITIES MANAGEMENT */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              Room Facilities & Amenities ({selectedFacilities.length} active)
            </label>
            {selectedFacilities.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFacilities([])}
                className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Currently Assigned Amenities List with Remove Buttons */}
          <div className="min-h-[50px] p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap gap-1.5 items-center">
            {selectedFacilities.length === 0 ? (
              <span className="text-xs text-slate-500 italic">
                No amenities attached yet. Select from presets below or type a custom amenity.
              </span>
            ) : (
              selectedFacilities.map((fac) => (
                <span
                  key={fac}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium group"
                >
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{fac}</span>
                  <button
                    type="button"
                    onClick={() => removeFacility(fac)}
                    className="p-0.5 rounded text-emerald-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all ml-0.5"
                    title={`Remove ${fac}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Custom Amenity Field */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomAmenity(e);
                }
              }}
              placeholder="Add custom amenity (e.g. Geyser, Microwave, Barbecue Kit)..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
            <button
              type="button"
              onClick={handleAddCustomAmenity}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all border border-slate-700 hover:border-emerald-500 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Amenity
            </button>
          </div>

          {/* Popular Presets Quick Selector */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
              Quick Toggle Popular Presets
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_FACILITIES.map((fac) => {
                const isSelected = selectedFacilities.includes(fac);
                return (
                  <button
                    key={fac}
                    type="button"
                    onClick={() => toggleFacility(fac)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3 text-slate-500" />}
                    <span>{fac}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Changes sync to system database
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
            >
              {isEditing ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

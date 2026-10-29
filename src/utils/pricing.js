/**
 * Pricing Utility for Somajam Holidays Homestay
 * Weekday: Sunday night through Thursday night
 * Weekend: Friday night and Saturday night
 */

/**
 * Checks if a specific date (night) is a weekend night.
 * @param {Date|string} date 
 * @returns {boolean} True if Friday night (5) or Saturday night (6)
 */
export const isWeekendNight = (date) => {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : new Date(date);
  const day = d.getDay();
  // 0 = Sun (weekday night)
  // 1 = Mon (weekday night)
  // 2 = Tue (weekday night)
  // 3 = Wed (weekday night)
  // 4 = Thu (weekday night)
  // 5 = Fri (weekend night)
  // 6 = Sat (weekend night)
  return day === 5 || day === 6;
};

/**
 * Calculates the stay rate for a single room over a date range.
 * Each night stayed from checkInDate up to the day before checkOutDate
 * is categorized as Weekday (Sun-Thu) or Weekend (Fri-Sat).
 * 
 * @param {Object} room - Room object containing weekday_rate, weekend_rate, or price_per_night
 * @param {string} checkInStr - YYYY-MM-DD
 * @param {string} checkOutStr - YYYY-MM-DD
 * @returns {Object} Stay calculation details
 */
export const calculateStayRate = (room, checkInStr, checkOutStr) => {
  const defaultWeekday = room?.weekday_rate ?? room?.price_per_night ?? 3500;
  const defaultWeekend = room?.weekend_rate ?? (room?.weekday_rate ? Math.round(room.weekday_rate * 1.25) : 4500);

  const weekdayRate = Number(defaultWeekday);
  const weekendRate = Number(defaultWeekend);

  if (!checkInStr || !checkOutStr) {
    return {
      weekdayNights: 0,
      weekendNights: 0,
      totalNights: 0,
      weekdayRate,
      weekendRate,
      weekdayTotal: 0,
      weekendTotal: 0,
      totalAmount: 0,
      breakdown: [],
    };
  }

  const checkIn = new Date(checkInStr + 'T12:00:00');
  const checkOut = new Date(checkOutStr + 'T12:00:00');

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return {
      weekdayNights: 0,
      weekendNights: 0,
      totalNights: 0,
      weekdayRate,
      weekendRate,
      weekdayTotal: 0,
      weekendTotal: 0,
      totalAmount: 0,
      breakdown: [],
    };
  }

  let weekdayNights = 0;
  let weekendNights = 0;
  const breakdown = [];

  const cur = new Date(checkIn);
  while (cur < checkOut) {
    const isWknd = isWeekendNight(cur);
    const dateStr = cur.toISOString().split('T')[0];
    const dayName = cur.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDayName = cur.toLocaleDateString('en-US', { weekday: 'long' });
    const rate = isWknd ? weekendRate : weekdayRate;

    if (isWknd) {
      weekendNights++;
    } else {
      weekdayNights++;
    }

    breakdown.push({
      date: dateStr,
      dayName,
      fullDayName,
      isWeekend: isWknd,
      rate,
    });

    cur.setDate(cur.getDate() + 1);
  }

  const weekdayTotal = weekdayNights * weekdayRate;
  const weekendTotal = weekendNights * weekendRate;
  const totalAmount = weekdayTotal + weekendTotal;

  return {
    weekdayNights,
    weekendNights,
    totalNights: weekdayNights + weekendNights,
    weekdayRate,
    weekendRate,
    weekdayTotal,
    weekendTotal,
    totalAmount,
    breakdown,
  };
};

/**
 * Calculates stay rates across multiple selected rooms for given dates.
 * 
 * @param {Array<Object>} roomsList - Array of room objects
 * @param {string} checkInStr - YYYY-MM-DD
 * @param {string} checkOutStr - YYYY-MM-DD
 * @returns {Object} Aggregated multi-room calculation
 */
export const calculateMultiRoomStayRate = (roomsList, checkInStr, checkOutStr) => {
  if (!Array.isArray(roomsList) || roomsList.length === 0) {
    return {
      totalNights: 0,
      weekdayNights: 0,
      weekendNights: 0,
      totalAmount: 0,
      roomsBreakdown: [],
    };
  }

  let grandTotal = 0;
  let totalWeekdayNights = 0;
  let totalWeekendNights = 0;
  let baseNights = 0;

  const roomsBreakdown = roomsList.map((room) => {
    const calc = calculateStayRate(room, checkInStr, checkOutStr);
    grandTotal += calc.totalAmount;
    totalWeekdayNights = calc.weekdayNights;
    totalWeekendNights = calc.weekendNights;
    baseNights = calc.totalNights;

    return {
      roomId: room.id,
      roomNumber: room.room_number,
      roomType: room.room_type,
      ...calc,
    };
  });

  return {
    totalNights: baseNights,
    weekdayNights: totalWeekdayNights,
    weekendNights: totalWeekendNights,
    totalAmount: grandTotal,
    roomsBreakdown,
  };
};

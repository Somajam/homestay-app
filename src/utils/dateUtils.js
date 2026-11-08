/**
 * Formats an ISO timestamp or date string into a user-friendly Indian format (DD MMM YYYY, hh:mm A).
 * e.g. "08 Nov 2026, 02:30 PM"
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return String(timestamp);

  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0');

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
};

/**
 * Extracts and formats the check-in and check-out timestamps for a booking.
 * Fallbacks to audit logs if explicit timestamps are not directly on the booking record.
 */
export const getBookingTimestamps = (booking, auditLogs = []) => {
  if (!booking) return { checkInTime: 'N/A', checkOutTime: 'N/A' };

  // 1. Direct timestamps on booking
  let inTime = booking.checked_in_at || null;
  let outTime = booking.checked_out_at || null;

  // 2. Audit log lookups if direct field is not set
  if (!inTime && Array.isArray(auditLogs)) {
    const checkInLog = auditLogs.find(
      (l) => (l.booking_id === booking.id || l.booking_ref === booking.booking_ref) && l.action === 'CHECKED_IN'
    );
    if (checkInLog) inTime = checkInLog.created_at;
  }

  if (!outTime && Array.isArray(auditLogs)) {
    const checkOutLog = auditLogs.find(
      (l) => (l.booking_id === booking.id || l.booking_ref === booking.booking_ref) && l.action === 'CHECKED_OUT'
    );
    if (checkOutLog) outTime = checkOutLog.created_at;
  }

  return {
    checkInTime: inTime ? formatTimestamp(inTime) : (booking.status === 'Checked In' || booking.status === 'Checked Out' ? `${booking.check_in_date} (Recorded)` : 'Pending Check-In'),
    checkOutTime: outTime ? formatTimestamp(outTime) : (booking.status === 'Checked Out' ? `${booking.check_out_date} (Recorded)` : 'Pending Check-Out'),
    rawCheckInTime: inTime,
    rawCheckOutTime: outTime,
  };
};


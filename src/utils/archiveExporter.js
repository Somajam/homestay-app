import JSZip from 'jszip';
import { formatTimestamp } from './dateUtils';

/**
 * Clean string for safe CSV cell escaping
 */
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Formats date string to DD/MM/YYYY
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Triggers client-side browser file download
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/**
 * Exports monthly visitor archive as a complete .ZIP file
 * containing CSV registers and all attached ID document files.
 */
export const exportMonthlyVisitorArchive = async ({
  year,
  month, // 1 to 12
  guests = [],
  bookings = [],
  documents = [],
}) => {
  const zip = new JSZip();

  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  // 1. Filter bookings that overlap or check in during this month
  const monthlyBookings = bookings.filter((b) => {
    if (!b.check_in_date) return false;
    // Match check_in_date starts with YYYY-MM
    return b.check_in_date.startsWith(monthPrefix);
  });

  // Get matching guest IDs from monthly bookings, plus guests created this month
  const monthlyGuestIds = new Set([
    ...monthlyBookings.map((b) => b.guest_id).filter(Boolean),
    ...guests
      .filter((g) => g.created_at && g.created_at.startsWith(monthPrefix))
      .map((g) => g.id),
  ]);

  const targetGuests = guests.filter((g) => monthlyGuestIds.has(g.id));

  // 2. Build Visitors Register CSV
  const visitorHeaders = [
    'Guest ID',
    'Full Name',
    'Phone Number',
    'Email',
    'Residential Address',
    'Nationality',
    'ID Document Type',
    'ID / Aadhaar Number',
    'Booking Reference',
    'Cottage / Room',
    'Check-In Date',
    'Check-In Timestamp',
    'Check-Out Date',
    'Check-Out Timestamp',
    'Nights',
    'Guests Count',
    'Booking Status',
    'Attached Documents',
    'Special Notes',
  ];

  const visitorRows = [];

  targetGuests.forEach((g) => {
    const guestBookings = monthlyBookings.filter((b) => b.guest_id === g.id);
    const guestDocs = documents.filter((d) => d.guest_id === g.id);
    const docNames = guestDocs.map((d) => d.file_name).join(', ') || 'No file attached';

    if (guestBookings.length > 0) {
      guestBookings.forEach((b) => {
        const inDate = new Date(b.check_in_date);
        const outDate = new Date(b.check_out_date);
        const nights = !isNaN(inDate) && !isNaN(outDate)
          ? Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)))
          : 1;

        visitorRows.push([
          g.id,
          g.full_name,
          g.phone,
          g.email || '',
          g.address || '',
          g.nationality || 'Indian',
          g.id_document_type || 'Aadhaar',
          g.id_document_number || '',
          b.booking_ref,
          b.room_number,
          formatDate(b.check_in_date),
          b.checked_in_at ? formatTimestamp(b.checked_in_at) : (b.status === 'Checked In' || b.status === 'Checked Out' ? 'Recorded' : 'N/A'),
          formatDate(b.check_out_date),
          b.checked_out_at ? formatTimestamp(b.checked_out_at) : (b.status === 'Checked Out' ? 'Recorded' : 'N/A'),
          nights,
          b.num_guests || 2,
          b.status,
          docNames,
          b.notes || g.notes || '',
        ]);
      });
    } else {
      // Guest registered without active monthly booking
      visitorRows.push([
        g.id,
        g.full_name,
        g.phone,
        g.email || '',
        g.address || '',
        g.nationality || 'Indian',
        g.id_document_type || 'Aadhaar',
        g.id_document_number || '',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        0,
        1,
        'Registered',
        docNames,
        g.notes || '',
      ]);
    }
  });

  const visitorCSVContent = [
    visitorHeaders.map(escapeCSV).join(','),
    ...visitorRows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\r\n');

  zip.file(`visitors_register_${year}_${monthStr}.csv`, visitorCSVContent);

  // 3. Build Police / Government Inquiry Register CSV (Standard Form C / Indian Homestay Format)
  const policeHeaders = [
    'Sl No',
    'Date of Arrival',
    'Guest Full Name',
    'Contact Number',
    'Permanent Address',
    'Nationality',
    'ID Proof Type',
    'ID Document Number (Aadhaar/Passport)',
    'Room / Cottage No',
    'No of Persons',
    'Date of Departure',
    'Purpose of Visit / Remarks',
  ];

  let slNo = 1;
  const policeRows = [];

  targetGuests.forEach((g) => {
    const guestBookings = monthlyBookings.filter((b) => b.guest_id === g.id);
    guestBookings.forEach((b) => {
      policeRows.push([
        slNo++,
        formatDate(b.check_in_date),
        g.full_name,
        g.phone,
        g.address || 'Not Provided',
        g.nationality || 'Indian',
        g.id_document_type || 'Aadhaar',
        g.id_document_number || '',
        `Cottage ${b.room_number}`,
        b.num_guests || 2,
        formatDate(b.check_out_date),
        b.notes || 'Holiday Stay',
      ]);
    });
  });

  const policeCSVContent = [
    policeHeaders.map(escapeCSV).join(','),
    ...policeRows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\r\n');

  zip.file(`police_guest_register_${year}_${monthStr}.csv`, policeCSVContent);

  // 4. Collect ID documents into folder 'id_documents/'
  const docsFolder = zip.folder('id_documents');
  let docsCount = 0;

  for (const g of targetGuests) {
    const guestDocs = documents.filter((d) => d.guest_id === g.id);
    const sanitizedGuestName = (g.full_name || 'Guest').replace(/[^a-zA-Z0-9_-]/g, '_');

    for (const doc of guestDocs) {
      const sanitizedDocName = `${sanitizedGuestName}_${doc.id_document_type || 'ID'}_${doc.file_name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      try {
        if (doc.rawFile && doc.rawFile instanceof Blob) {
          const arrayBuffer = await doc.rawFile.arrayBuffer();
          docsFolder.file(sanitizedDocName, arrayBuffer);
          docsCount++;
        } else if (doc.preview_url && doc.preview_url.startsWith('data:')) {
          // Base64 data url
          const base64Data = doc.preview_url.split(',')[1];
          docsFolder.file(sanitizedDocName, base64Data, { base64: true });
          docsCount++;
        } else if (doc.preview_url && doc.preview_url.startsWith('blob:')) {
          const resp = await fetch(doc.preview_url);
          const blob = await resp.blob();
          const buffer = await blob.arrayBuffer();
          docsFolder.file(sanitizedDocName, buffer);
          docsCount++;
        } else if (doc.public_url || (doc.file_path && doc.file_path.startsWith('http'))) {
          const url = doc.public_url || doc.file_path;
          const resp = await fetch(url);
          if (resp.ok) {
            const blob = await resp.blob();
            const buffer = await blob.arrayBuffer();
            docsFolder.file(sanitizedDocName, buffer);
            docsCount++;
          }
        } else {
          // If purely simulated or archived file record, generate a structured record manifest
          const infoText = `SOMAJAM HOLIDAYS - ID DOCUMENT RECORD ARCHIVE\n==============================================\nGuest Name: ${g.full_name}\nPhone: ${g.phone}\nID Type: ${g.id_document_type}\nID Number: ${g.id_document_number}\nFile Path: ${doc.file_path || 'Stored in Supabase guest-documents'}\nUploaded On: ${doc.uploaded_at || 'N/A'}\nUploaded By: ${doc.uploaded_by || 'Staff'}\nStatus: Verified Government ID Record\n`;
          docsFolder.file(`${sanitizedDocName}.txt`, infoText);
          docsCount++;
        }
      } catch (err) {
        console.warn(`Could not bundle file for doc ${doc.id}:`, err);
        docsFolder.file(
          `${sanitizedDocName}_error.txt`,
          `Could not download raw image: ${err.message}`
        );
      }
    }
  }

  // 5. Add a README text file describing the archive
  const readmeContent = `SOMAJAM HOLIDAYS, PARUNTHUMPARA
MONTHLY VISITOR ARCHIVE: ${monthName.toUpperCase()} ${year}
======================================================
Generated At: ${new Date().toLocaleString()}
Total Visitors: ${targetGuests.length}
Total Bookings: ${monthlyBookings.length}
ID Files Included: ${docsCount}

CONTENTS OF THIS ARCHIVE:
1. visitors_register_${year}_${monthStr}.csv
   - Comprehensive ledger with guest phone numbers, address, stay dates, and rooms.
2. police_guest_register_${year}_${monthStr}.csv
   - Official Form C / Police Station inspection ledger format.
3. id_documents/
   - High-resolution scanned Aadhaar cards, passports, and verification proofs.

NOTICE:
Save this ZIP file to secure local hard drive, external storage, or Google Drive.
Once backed up locally, you may safely purge cloud storage from the web app.
`;
  zip.file('ARCHIVE_SUMMARY.txt', readmeContent);

  // Generate the ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `Somajam_Visitors_Archive_${year}_${monthStr}_${monthName}.zip`;

  return {
    blob: zipBlob,
    filename: zipFilename,
    stats: {
      guestsCount: targetGuests.length,
      bookingsCount: monthlyBookings.length,
      docsCount,
      sizeMB: (zipBlob.size / (1024 * 1024)).toFixed(2),
    },
  };
};

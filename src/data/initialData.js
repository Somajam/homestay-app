export const initialRooms = [
  {
    id: 'room-1',
    room_number: 'No. 1',
    room_type: '1BHK Cottage',
    capacity: 4,
    facilities: ['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Kitchenette', 'Audio System', 'Grilling Area'],
    status: 'Available',
    weekday_rate: 3500,
    weekend_rate: 4500,
    price_per_night: 3500,
  },
  {
    id: 'room-2',
    room_number: 'No. 2',
    room_type: '1BHK Cottage',
    capacity: 4,
    facilities: ['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Kitchenette', 'Valley View Patio', 'Campfire Zone'],
    status: 'Available',
    weekday_rate: 3500,
    weekend_rate: 4500,
    price_per_night: 3500,
  },
  {
    id: 'room-3',
    room_number: 'No. 3',
    room_type: '1BHK Cottage',
    capacity: 4,
    facilities: ['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Kitchenette', 'Private Balcony', 'Hot Shower'],
    status: 'Available',
    weekday_rate: 3500,
    weekend_rate: 4500,
    price_per_night: 3500,
  },
  {
    id: 'room-4',
    room_number: 'No. 4',
    room_type: '1BHK Cottage',
    capacity: 4,
    facilities: ['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Kitchenette', 'Drivers Lounge Access', 'Audio System'],
    status: 'Available',
    weekday_rate: 3500,
    weekend_rate: 4500,
    price_per_night: 3500,
  },
  {
    id: 'room-5',
    room_number: 'No. 5',
    room_type: '1BHK Cottage',
    capacity: 5,
    facilities: ['Swimming Pool Access', 'Free Wi-Fi', 'EV Charging', 'Full Kitchen', 'Campfire Area', 'Mountain View'],
    status: 'Available',
    weekday_rate: 4000,
    weekend_rate: 5000,
    price_per_night: 4000,
  },
];

// Clean slate: transaction tables start empty for real data testing
export const initialGuests = [];

export const initialBookings = [];

export const initialDocuments = [];

// Master Staff List
export const initialStaff = [
  {
    id: 'stf-001',
    full_name: 'Management Team',
    role: 'admin',
    title: 'Property Manager',
    email: 'somajamholidays@gmail.com',
    phone: '+91 92499 59035',
    status: 'Active',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'stf-002',
    full_name: 'Front Desk Executive',
    role: 'staff',
    title: 'Guest Associate',
    email: 'help@somajamholidays.com',
    phone: '+91 92499 59035',
    status: 'Active',
    created_at: '2025-06-15T00:00:00Z',
  },
];

// Master Expense Payers (Directors, Caretaker & Common Account)
export const initialExpensePayers = [
  {
    id: 'pyr-common',
    name: 'Common Homestay Account',
    group_tag: 'Common Pool',
    phone: '+91 92499 59035',
    upi_id: 'somajam@upi',
  },
  {
    id: 'pyr-dir1',
    name: 'Director 1 (Ramesh)',
    group_tag: 'Director',
    phone: '+91 98470 11111',
    upi_id: 'ramesh@upi',
  },
  {
    id: 'pyr-dir2',
    name: 'Director 2 (Sarah)',
    group_tag: 'Director',
    phone: '+91 98470 22222',
    upi_id: 'sarah@upi',
  },
  {
    id: 'pyr-dir3',
    name: 'Director 3 (George)',
    group_tag: 'Director',
    phone: '+91 98470 33333',
    upi_id: 'george@upi',
  },
  {
    id: 'pyr-dir4',
    name: 'Director 4 (Anish)',
    group_tag: 'Director',
    phone: '+91 98470 44444',
    upi_id: 'anish@upi',
  },
  {
    id: 'pyr-dir5',
    name: 'Director 5 (Deepa)',
    group_tag: 'Director',
    phone: '+91 98470 55555',
    upi_id: 'deepa@upi',
  },
  {
    id: 'pyr-caretaker',
    name: 'Caretaker (Joy)',
    group_tag: 'Caretaker',
    phone: '+91 92499 59000',
    upi_id: 'joycaretaker@upi',
  },
];

// Clean slate: expense transactions start empty for real data testing
export const initialExpenses = [];

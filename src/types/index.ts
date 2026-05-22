export type FlightStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled' | 'delayed';
export type SeatClass = 'economy' | 'business' | 'first';
export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled' | 'pending';

export interface Flight {
  id: string;
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  status: FlightStatus;
  base_price: number;
}

export interface Seat {
  id: string;
  flight_id: string;
  seat_number: string;
  class: SeatClass;
  is_available: boolean;
  extra_fee: number;
}

export interface Booking {
  id: string;
  user_id: string;
  flight_id: string;
  seat_id: string;
  status: BookingStatus;
  booked_at: string;
  total_price: number;
  pnr_code: string;
  flight?: Flight;
  seat?: Seat;
  passengers?: Passenger[];
}

export interface Passenger {
  id: string;
  booking_id: string;
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
}

export interface Reschedule {
  id: string;
  booking_id: string;
  old_flight_id: string;
  new_flight_id: string;
  requested_at: string;
  fee_charged: number;
}

export interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  class: SeatClass;
}

export interface BookingStep {
  step: 1 | 2 | 3 | 4;
  label: string;
}

export interface PassengerFormData {
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
}

export const AIRPORTS: Record<string, { code: string; name: string; city: string; country: string }> = {
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India' },
  DEL: { code: 'DEL', name: 'Indira Gandhi International', city: 'New Delhi', country: 'India' },
  BLR: { code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'India' },
  MAA: { code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India' },
  HYD: { code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India' },
  CCU: { code: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', country: 'India' },
  DXB: { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  SIN: { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore' },
};

export const SEAT_CLASS_CONFIG: Record<SeatClass, { label: string; color: string; rows: number[]; cols: string[] }> = {
  first: {
    label: 'First Class',
    color: 'amber',
    rows: [1, 2],
    cols: ['A', 'C', 'D', 'F'],
  },
  business: {
    label: 'Business',
    color: 'brand',
    rows: [3, 4, 5, 6, 7],
    cols: ['A', 'B', 'C', 'D', 'E', 'F'],
  },
  economy: {
    label: 'Economy',
    color: 'sky',
    rows: Array.from({ length: 24 }, (_, i) => i + 8),
    cols: ['A', 'B', 'C', 'D', 'E', 'F'],
  },
};

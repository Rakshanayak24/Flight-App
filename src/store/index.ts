'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Flight, Seat, SearchQuery, PassengerFormData, SeatClass } from '@/types';

interface FlightStore {
  // Search
  searchQuery: SearchQuery | null;
  setSearchQuery: (query: SearchQuery) => void;
  clearSearchQuery: () => void;

  // Selected flight
  selectedFlight: Flight | null;
  setSelectedFlight: (flight: Flight | null) => void;

  // Selected seat (optimistic)
  selectedSeat: Seat | null;
  setSelectedSeat: (seat: Seat | null) => void;
  optimisticSeatId: string | null;
  setOptimisticSeat: (seatId: string | null) => void;

  // Booking flow
  currentStep: 1 | 2 | 3 | 4;
  setCurrentStep: (step: 1 | 2 | 3 | 4) => void;

  // Passenger data (passport excluded from persist)
  passengerData: PassengerFormData | null;
  setPassengerData: (data: PassengerFormData) => void;

  // Reset
  resetBookingFlow: () => void;
  resetAll: () => void;
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      searchQuery: null,
      setSearchQuery: (query) => set({ searchQuery: query }),
      clearSearchQuery: () => set({ searchQuery: null }),

      selectedFlight: null,
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),

      selectedSeat: null,
      setSelectedSeat: (seat) => set({ selectedSeat: seat }),
      optimisticSeatId: null,
      setOptimisticSeat: (seatId) => set({ optimisticSeatId: seatId }),

      currentStep: 1,
      setCurrentStep: (step) => set({ currentStep: step }),

      passengerData: null,
      setPassengerData: (data) => set({ passengerData: data }),

      resetBookingFlow: () =>
        set({
          selectedFlight: null,
          selectedSeat: null,
          optimisticSeatId: null,
          currentStep: 1,
          passengerData: null,
        }),

      resetAll: () =>
        set({
          searchQuery: null,
          selectedFlight: null,
          selectedSeat: null,
          optimisticSeatId: null,
          currentStep: 1,
          passengerData: null,
        }),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        currentStep: state.currentStep,
        // Explicitly exclude passengerData (contains passport_no)
        // selectedSeat and optimisticSeatId are transient
      }),
    }
  )
);

// User store - separate for auth session
interface UserStore {
  sessionToken: string | null;
  userId: string | null;
  userEmail: string | null;
  cachedBookings: string[]; // booking IDs
  setSession: (token: string, userId: string, email: string) => void;
  clearSession: () => void;
  setCachedBookings: (ids: string[]) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      sessionToken: null,
      userId: null,
      userEmail: null,
      cachedBookings: [],
      setSession: (token, userId, email) =>
        set({ sessionToken: token, userId, userEmail: email }),
      clearSession: () =>
        set({ sessionToken: null, userId: null, userEmail: null, cachedBookings: [] }),
      setCachedBookings: (ids) => set({ cachedBookings: ids }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({
        sessionToken: state.sessionToken,
        userId: state.userId,
        userEmail: state.userEmail,
        // cachedBookings intentionally persisted for offline My Bookings
        cachedBookings: state.cachedBookings,
      }),
    }
  )
);

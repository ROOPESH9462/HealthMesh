import { SlotDTO } from '@healthcare/api-contracts';

export class AvailabilityService {
  /**
   * Generates dynamic available time slots for a doctor on a specific date,
   * matching doctor schedule, booked list, and excluding past slots.
   */
  generateAvailableSlots(
    doctor: { availableDays: string[]; timeSlots: string[] },
    dateStr: string, // format: "YYYY-MM-DD"
    bookedSlots: string[]
  ): SlotDTO[] {
    const targetDate = new Date(dateStr);
    
    // 1. Check if doctor is available on this day of the week
    // We use UTC to ensure date-string boundary safety
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    if (!doctor.availableDays.includes(dayOfWeek)) {
      return doctor.timeSlots.map((slot) => ({
        timeSlot: slot,
        isAvailable: false,
      }));
    }

    // 2. Identify if target date is in the past
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const targetTime = targetDate.getTime();
    const todayMidnight = new Date(todayStr).getTime();

    // If target date is strictly in the past, all slots are unavailable
    if (targetTime < todayMidnight) {
      return doctor.timeSlots.map((slot) => ({
        timeSlot: slot,
        isAvailable: false,
      }));
    }

    const isTargetToday = dateStr === todayStr;
    const currentHours = today.getHours();
    const currentMinutes = today.getMinutes();

    // Helper to parse start time from slot string (e.g. "09:30" or "09:30 - 10:00" or "10:00 AM")
    const getSlotMinutes = (slot: string): number => {
      // Look for first instance of HH:MM
      const match = slot.match(/(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);

      // Handle AM/PM if present
      const isPM = slot.toLowerCase().includes('pm');
      const isAM = slot.toLowerCase().includes('am');

      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const currentMinutesOfDay = currentHours * 60 + currentMinutes;

    // 3. Generate slots status
    return doctor.timeSlots.map((slot) => {
      const isAlreadyBooked = bookedSlots.includes(slot);

      // If already booked, it's unavailable
      if (isAlreadyBooked) {
        return { timeSlot: slot, isAvailable: false };
      }

      // If it's today, ensure the slot starts in the future
      if (isTargetToday) {
        const slotMinutes = getSlotMinutes(slot);
        // Add a 15 minute buffer before booking is allowed
        if (slotMinutes <= currentMinutesOfDay + 15) {
          return { timeSlot: slot, isAvailable: false };
        }
      }

      return { timeSlot: slot, isAvailable: true };
    });
  }
}
export default AvailabilityService;

/**
 * CalendarPicker - Interactive calendar for selecting intro class day and time
 * Displays next 14 days with available time slots
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
}

interface CalendarPickerProps {
  onSelectDateTime: (date: Date, time: string) => void;
  locationName?: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { time: '09:00', label: '9:00 AM', available: true },
  { time: '11:00', label: '11:00 AM', available: true },
  { time: '14:00', label: '2:00 PM', available: true },
  { time: '16:00', label: '4:00 PM', available: true },
  { time: '18:00', label: '6:00 PM', available: true },
];

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  onSelectDateTime,
  locationName = 'Our School',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);

  // Generate next 14 days starting from tomorrow
  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const allDays = generateDays();
  const weekDays = allDays.slice(currentWeek * 7, (currentWeek + 1) * 7);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      onSelectDateTime(selectedDate, time);
    }
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onSelectDateTime(selectedDate, selectedTime);
    }
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && 
      date.toDateString() === selectedDate.toDateString();
  };

  const formatDate = (date: Date) => {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const date_num = date.getDate();
    return { day, date: date_num };
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-2">Select a time for your free intro class</h3>
        <p className="text-gray-400 text-sm">at {locationName}</p>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
            disabled={currentWeek === 0}
            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          
          <span className="text-sm text-gray-400">
            {weekDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
            {weekDays[weekDays.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          
          <button
            onClick={() => setCurrentWeek(currentWeek + 1)}
            disabled={currentWeek >= 1}
            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDays.map((date, idx) => {
            const { day, date: dateNum } = formatDate(date);
            const isSelected = isDateSelected(date);
            
            return (
              <button
                key={idx}
                onClick={() => handleDateSelect(date)}
                className={`p-3 rounded-lg text-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="text-xs font-semibold mb-1">{day}</div>
                <div className="text-lg font-bold">{dateNum}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Choose a time
          </label>
          
          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.time}
                onClick={() => handleTimeSelect(slot.time)}
                disabled={!slot.available}
                className={`w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTime === slot.time
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                    : slot.available
                    ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                    : 'bg-white/5 text-gray-500 opacity-50 cursor-not-allowed'
                }`}
              >
                {slot.label}
                {!slot.available && ' (Booked)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Summary */}
      {selectedDate && selectedTime && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
          <p className="text-sm text-green-300">
            ✓ {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at{' '}
            {TIME_SLOTS.find(s => s.time === selectedTime)?.label}
          </p>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime}
        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
      >
        Confirm Time
      </button>
    </div>
  );
};

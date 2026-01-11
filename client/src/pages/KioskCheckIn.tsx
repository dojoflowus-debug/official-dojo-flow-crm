import React from 'react';
import KioskLayout from '@/components/KioskLayout';
import KioskCheckInComponent from '@/components/KioskCheckIn';

/**
 * KioskCheckIn Page - Wrapper for check-in component inside kiosk layout
 */
export default function KioskCheckIn() {
  return (
    <KioskLayout>
      <KioskCheckInComponent />
    </KioskLayout>
  );
}

import React from 'react';
import KioskLayout from '@/components/KioskLayout';
import KioskNewStudentComponent from '@/components/KioskNewStudent';

/**
 * KioskNewStudent Page - Wrapper for new student component inside kiosk layout
 */
export default function KioskNewStudent() {
  return (
    <KioskLayout>
      <KioskNewStudentComponent />
    </KioskLayout>
  );
}

/**
 * Sample Data Generator for Email Template Previews
 * 
 * Generates realistic sample data for each template type
 */

export function getSampleDataForTemplate(templateType: string): Record<string, any> {
  const baseData = {
    studentName: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    dojoName: 'Elite Martial Arts Academy',
    schoolName: 'Elite Martial Arts Academy',
    dojoAddress: '123 Main Street, Anytown, CA 90210',
    dojoPhone: '(555) 123-4567',
    dojoEmail: 'info@elitemartialarts.com',
    dojoWebsite: 'https://elitemartialarts.com',
    currentDate: new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    currentYear: new Date().getFullYear().toString(),
  };
  
  const templateSpecificData: Record<string, Record<string, any>> = {
    welcome_student: {
      ...baseData,
      beltRank: 'White Belt',
    },
    
    payment_confirmation: {
      ...baseData,
      amount: '$99.00',
      currency: 'USD',
      paymentMethod: 'Visa ending in 1234',
      transactionId: 'TXN-2026-01-31-001',
      invoiceUrl: 'https://elitemartialarts.com/invoice/123',
      receiptUrl: 'https://elitemartialarts.com/receipt/123',
      paymentDate: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
    },
    
    class_reminder: {
      ...baseData,
      className: 'Advanced Karate',
      classDate: 'Monday, February 5, 2026',
      classTime: '6:00 PM - 7:00 PM',
      classLocation: 'Main Dojo - Studio A',
      instructorName: 'Sensei Michael Chen',
      confirmationUrl: 'https://elitemartialarts.com/classes/confirm/123',
    },
    
    belt_promotion: {
      ...baseData,
      oldBeltRank: 'White Belt',
      newBeltRank: 'Yellow Belt',
      promotionDate: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      instructorName: 'Sensei Michael Chen',
      nextTestDate: 'June 15, 2026',
    },
    
    merchandise_confirmation: {
      ...baseData,
      itemName: 'Gi (Uniform)',
      itemSize: 'Medium',
      quantity: '1',
      amount: '$79.99',
      orderNumber: 'ORD-2026-001',
      estimatedDelivery: 'February 10-15, 2026',
      trackingUrl: 'https://elitemartialarts.com/track/123',
    },
    
    password_reset: {
      ...baseData,
      resetPasswordUrl: 'https://elitemartialarts.com/reset-password/token-abc123',
      expiryTime: '24 hours',
      loginUrl: 'https://elitemartialarts.com/login',
    },
  };
  
  return templateSpecificData[templateType] || baseData;
}

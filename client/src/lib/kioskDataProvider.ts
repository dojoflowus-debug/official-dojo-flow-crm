/**
 * Kiosk Data Provider - Adapter service layer
 * Provides mock implementations now, can be swapped with TRPC later
 */

// Mock student dataset
const MOCK_STUDENTS = [
  { id: 1, name: 'Alex Johnson', phone: '555-0101', belt: 'yellow', lastAttended: '2025-01-12' },
  { id: 2, name: 'Jordan Smith', phone: '555-0102', belt: 'orange', lastAttended: '2025-01-10' },
  { id: 3, name: 'Casey Williams', phone: '555-0103', belt: 'green', lastAttended: '2025-01-08' },
  { id: 4, name: 'Morgan Brown', phone: '555-0104', belt: 'blue', lastAttended: '2025-01-11' },
  { id: 5, name: 'Taylor Davis', phone: '555-0105', belt: 'white', lastAttended: '2025-01-13' },
  { id: 6, name: 'Riley Martinez', phone: '555-0106', belt: 'brown', lastAttended: '2025-01-09' },
];

// Mock classes
const MOCK_CLASSES = [
  { id: 1, name: 'Kids Karate', time: '4:00 PM' },
  { id: 2, name: 'Teens Kickboxing', time: '5:30 PM' },
  { id: 3, name: 'Adults Martial Arts', time: '7:00 PM' },
];

// Mock staff PIN
const STAFF_PIN = '1234';

// Mock programs
const MOCK_PROGRAMS = [
  { id: 'kids', name: 'Kids (5-8)', ageRange: '5-8' },
  { id: 'teens', name: 'Teens (9-17)', ageRange: '9-17' },
  { id: 'adults', name: 'Adults (18+)', ageRange: '18+' },
  { id: 'kickboxing', name: 'Kickboxing', ageRange: 'All' },
];

export interface Student {
  id: number;
  name: string;
  phone: string;
  belt: string;
  lastAttended: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  program: string;
  scheduledTime: string;
  createdAt: string;
}

export interface AttendanceRecord {
  studentId: number;
  classId: number;
  timestamp: string;
}

export interface DeployedVersion {
  versionId: string;
  timestamp: string;
  configHash: string;
}

/**
 * Search students by name or phone
 */
export async function searchStudents(query: string): Promise<Student[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const lowerQuery = query.toLowerCase();
  return MOCK_STUDENTS.filter(student =>
    student.name.toLowerCase().includes(lowerQuery) ||
    student.phone.includes(query)
  );
}

/**
 * Get student by ID
 */
export async function getStudent(studentId: number): Promise<Student | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_STUDENTS.find(s => s.id === studentId) || null;
}

/**
 * Check in a student
 */
export async function checkInStudent(studentId: number, classId: number): Promise<AttendanceRecord> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const record: AttendanceRecord = {
    studentId,
    classId,
    timestamp: new Date().toISOString(),
  };
  
  // Persist to localStorage
  const attendanceKey = `attendance_${studentId}_${new Date().toDateString()}`;
  localStorage.setItem(attendanceKey, JSON.stringify(record));
  
  return record;
}

/**
 * Create a lead (Start Training flow)
 */
export async function createLead(payload: {
  name: string;
  phone: string;
  email: string;
  program: string;
  scheduledTime: string;
}): Promise<Lead> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const lead: Lead = {
    id: `lead_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };
  
  // Persist to localStorage
  const leadsKey = 'kiosk_leads';
  const leads = JSON.parse(localStorage.getItem(leadsKey) || '[]');
  leads.push(lead);
  localStorage.setItem(leadsKey, JSON.stringify(leads));
  
  return lead;
}

/**
 * Verify staff PIN
 */
export async function verifyStaffPin(pin: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return pin === STAFF_PIN;
}

/**
 * Get all classes
 */
export async function getClasses(): Promise<typeof MOCK_CLASSES> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_CLASSES;
}

/**
 * Get all programs
 */
export async function getPrograms(): Promise<typeof MOCK_PROGRAMS> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_PROGRAMS;
}

/**
 * Get program by ID
 */
export async function getProgram(programId: string): Promise<typeof MOCK_PROGRAMS[0] | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return MOCK_PROGRAMS.find(p => p.id === programId) || null;
}

/**
 * Create deployment version
 */
export async function createDeploymentVersion(configHash: string): Promise<DeployedVersion> {
  const version: DeployedVersion = {
    versionId: `v${Date.now()}`,
    timestamp: new Date().toISOString(),
    configHash,
  };
  
  // Persist to localStorage
  localStorage.setItem('deployedVersion', JSON.stringify(version));
  
  return version;
}

/**
 * Get last deployed version
 */
export async function getLastDeployedVersion(): Promise<DeployedVersion | null> {
  const version = localStorage.getItem('deployedVersion');
  return version ? JSON.parse(version) : null;
}

/**
 * Get all leads (staff view)
 */
export async function getAllLeads(): Promise<Lead[]> {
  const leadsKey = 'kiosk_leads';
  const leads = JSON.parse(localStorage.getItem(leadsKey) || '[]');
  return leads;
}

/**
 * Get attendance records (staff view)
 */
export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('attendance_')) {
      const record = JSON.parse(localStorage.getItem(key) || '{}');
      records.push(record);
    }
  }
  return records;
}

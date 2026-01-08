/**
 * Operational Intelligence Indicators for Student Cards
 * Calculates and determines which badges should display on student cards
 */

export interface StudentIndicators {
  atRisk: boolean
  birthday: boolean
  overdue: boolean
  rankUpEligible: boolean
  attendanceDrop: boolean
  starStudent: boolean
}

export interface StudentData {
  id: number
  status: 'Active' | 'Inactive' | 'On Hold'
  membershipStatus?: string
  dateOfBirth?: string
  beltRank?: string
  attendanceRate?: number
  lastAttendanceDate?: string
  createdAt?: string
}

/**
 * Calculate if student is at risk
 * At risk = On Hold status or inactive for 30+ days
 */
export function isAtRisk(student: StudentData): boolean {
  if (student.status === 'On Hold') return true
  if (student.status === 'Inactive') return true
  return false
}

/**
 * Calculate if student has birthday this week
 */
export function hasBirthdayThisWeek(student: StudentData): boolean {
  if (!student.dateOfBirth) return false

  const today = new Date()
  const dob = new Date(student.dateOfBirth)

  // Get this year's birthday
  const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())

  // If birthday already passed this year, check next year
  let upcomingBirthday = thisYearBirthday
  if (thisYearBirthday < today) {
    upcomingBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
  }

  // Check if birthday is within 7 days
  const daysUntilBirthday = Math.ceil((upcomingBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilBirthday <= 7 && daysUntilBirthday >= 0
}

/**
 * Calculate if payment is overdue
 * Overdue = membership status is "Overdue" or "Past Due"
 */
export function isPaymentOverdue(student: StudentData): boolean {
  if (!student.membershipStatus) return false
  const status = student.membershipStatus.toLowerCase()
  return status.includes('overdue') || status.includes('past due') || status.includes('unpaid')
}

/**
 * Calculate if student is eligible for rank-up
 * Eligible = has been at current belt for 3+ months and attendance > 80%
 */
export function isRankUpEligible(student: StudentData): boolean {
  // This would require more data like time at current belt and attendance history
  // For now, return false as placeholder
  return false
}

/**
 * Calculate if student has attendance drop
 * Drop = attendance decreased by 20%+ in last 30 days
 */
export function hasAttendanceDrop(student: StudentData): boolean {
  // This would require attendance history data
  // For now, return false as placeholder
  return false
}

/**
 * Calculate if student is a star student
 * Star = Perfect attendance (100%) in last 30 days + Active status + at least 3 months tenure
 */
export function isStarStudent(student: StudentData): boolean {
  if (student.status !== 'Active') return false
  if (!student.attendanceRate || student.attendanceRate < 100) return false

  // Check if student has been with dojo for at least 3 months
  if (student.createdAt) {
    const createdDate = new Date(student.createdAt)
    const today = new Date()
    const monthsDiff = (today.getFullYear() - createdDate.getFullYear()) * 12 + (today.getMonth() - createdDate.getMonth())
    if (monthsDiff < 3) return false
  }

  return true
}

/**
 * Calculate all indicators for a student
 */
export function calculateIndicators(student: StudentData): StudentIndicators {
  return {
    atRisk: isAtRisk(student),
    birthday: hasBirthdayThisWeek(student),
    overdue: isPaymentOverdue(student),
    rankUpEligible: isRankUpEligible(student),
    attendanceDrop: hasAttendanceDrop(student),
    starStudent: isStarStudent(student)
  }
}

/**
 * Get indicator count for a student
 * Used to determine if card should show compact or expanded view
 */
export function getIndicatorCount(indicators: StudentIndicators): number {
  return Object.values(indicators).filter(Boolean).length
}

/**
 * Check if any indicators are present
 */
export function hasAnyIndicators(indicators: StudentIndicators): boolean {
  return getIndicatorCount(indicators) > 0
}

/**
 * Get priority-sorted indicators
 * Returns indicators in order of importance for display
 */
export function getPrioritizedIndicators(indicators: StudentIndicators): (keyof StudentIndicators)[] {
  const priority: (keyof StudentIndicators)[] = ['atRisk', 'overdue', 'birthday', 'rankUpEligible', 'attendanceDrop', 'starStudent']
  return priority.filter(key => indicators[key])
}

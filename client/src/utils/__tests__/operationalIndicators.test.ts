import { describe, it, expect } from 'vitest'
import {
  isAtRisk,
  hasBirthdayThisWeek,
  isPaymentOverdue,
  isRankUpEligible,
  hasAttendanceDrop,
  isStarStudent,
  calculateIndicators,
  getIndicatorCount,
  hasAnyIndicators,
  getPrioritizedIndicators
} from '../operationalIndicators'

describe('Operational Indicators Utilities', () => {
  const baseStudent = {
    id: 1,
    status: 'Active' as const,
    membershipStatus: 'Paid',
    dateOfBirth: '2010-01-15',
    beltRank: 'Blue Belt',
    attendanceRate: 85,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  }

  describe('isAtRisk', () => {
    it('returns true for On Hold status', () => {
      const student = { ...baseStudent, status: 'On Hold' as const }
      expect(isAtRisk(student)).toBe(true)
    })

    it('returns true for Inactive status', () => {
      const student = { ...baseStudent, status: 'Inactive' as const }
      expect(isAtRisk(student)).toBe(true)
    })

    it('returns false for Active status', () => {
      const student = { ...baseStudent, status: 'Active' as const }
      expect(isAtRisk(student)).toBe(false)
    })
  })

  describe('hasBirthdayThisWeek', () => {
    it('returns true when birthday is within 7 days', () => {
      const today = new Date()
      const upcomingBirthday = new Date()
      upcomingBirthday.setDate(today.getDate() + 3)
      
      const student = {
        ...baseStudent,
        dateOfBirth: upcomingBirthday.toISOString()
      }
      expect(hasBirthdayThisWeek(student)).toBe(true)
    })

    it('returns false when birthday is more than 7 days away', () => {
      const today = new Date()
      const futureBirthday = new Date()
      futureBirthday.setDate(today.getDate() + 15)
      
      const student = {
        ...baseStudent,
        dateOfBirth: futureBirthday.toISOString()
      }
      expect(hasBirthdayThisWeek(student)).toBe(false)
    })

    it('returns false when no dateOfBirth', () => {
      const student = { ...baseStudent, dateOfBirth: undefined }
      expect(hasBirthdayThisWeek(student)).toBe(false)
    })
  })

  describe('isPaymentOverdue', () => {
    it('returns true for overdue status', () => {
      const student = { ...baseStudent, membershipStatus: 'Overdue' }
      expect(isPaymentOverdue(student)).toBe(true)
    })

    it('returns true for past due status', () => {
      const student = { ...baseStudent, membershipStatus: 'Past Due' }
      expect(isPaymentOverdue(student)).toBe(true)
    })

    it('returns true for unpaid status', () => {
      const student = { ...baseStudent, membershipStatus: 'Unpaid' }
      expect(isPaymentOverdue(student)).toBe(true)
    })

    it('returns false for paid status', () => {
      const student = { ...baseStudent, membershipStatus: 'Paid' }
      expect(isPaymentOverdue(student)).toBe(false)
    })

    it('returns false when no membershipStatus', () => {
      const student = { ...baseStudent, membershipStatus: undefined }
      expect(isPaymentOverdue(student)).toBe(false)
    })
  })

  describe('isRankUpEligible', () => {
    it('returns false as placeholder', () => {
      expect(isRankUpEligible(baseStudent)).toBe(false)
    })
  })

  describe('hasAttendanceDrop', () => {
    it('returns false as placeholder', () => {
      expect(hasAttendanceDrop(baseStudent)).toBe(false)
    })
  })

  describe('isStarStudent', () => {
    it('returns true for active student with 100% attendance and 3+ months tenure', () => {
      const student = {
        ...baseStudent,
        status: 'Active' as const,
        attendanceRate: 100,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
      }
      expect(isStarStudent(student)).toBe(true)
    })

    it('returns false for inactive student', () => {
      const student = {
        ...baseStudent,
        status: 'Inactive' as const,
        attendanceRate: 100
      }
      expect(isStarStudent(student)).toBe(false)
    })

    it('returns false for active student with less than 100% attendance', () => {
      const student = {
        ...baseStudent,
        status: 'Active' as const,
        attendanceRate: 95
      }
      expect(isStarStudent(student)).toBe(false)
    })

    it('returns false for new student with less than 3 months tenure', () => {
      const student = {
        ...baseStudent,
        status: 'Active' as const,
        attendanceRate: 100,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      expect(isStarStudent(student)).toBe(false)
    })
  })

  describe('calculateIndicators', () => {
    it('returns all indicators as false for normal student', () => {
      const indicators = calculateIndicators(baseStudent)
      
      expect(indicators.atRisk).toBe(false)
      expect(indicators.birthday).toBe(false)
      expect(indicators.overdue).toBe(false)
      expect(indicators.rankUpEligible).toBe(false)
      expect(indicators.attendanceDrop).toBe(false)
      expect(indicators.starStudent).toBe(false)
    })

    it('returns correct indicators for at-risk student', () => {
      const student = { ...baseStudent, status: 'On Hold' as const }
      const indicators = calculateIndicators(student)
      
      expect(indicators.atRisk).toBe(true)
    })

    it('returns correct indicators for overdue student', () => {
      const student = { ...baseStudent, membershipStatus: 'Overdue' }
      const indicators = calculateIndicators(student)
      
      expect(indicators.overdue).toBe(true)
    })
  })

  describe('getIndicatorCount', () => {
    it('returns 0 when no indicators', () => {
      const indicators = {
        atRisk: false,
        birthday: false,
        overdue: false,
        rankUpEligible: false,
        attendanceDrop: false,
        starStudent: false
      }
      expect(getIndicatorCount(indicators)).toBe(0)
    })

    it('returns correct count for multiple indicators', () => {
      const indicators = {
        atRisk: true,
        birthday: true,
        overdue: false,
        rankUpEligible: false,
        attendanceDrop: false,
        starStudent: false
      }
      expect(getIndicatorCount(indicators)).toBe(2)
    })

    it('returns 6 when all indicators are true', () => {
      const indicators = {
        atRisk: true,
        birthday: true,
        overdue: true,
        rankUpEligible: true,
        attendanceDrop: true,
        starStudent: true
      }
      expect(getIndicatorCount(indicators)).toBe(6)
    })
  })

  describe('hasAnyIndicators', () => {
    it('returns false when no indicators', () => {
      const indicators = {
        atRisk: false,
        birthday: false,
        overdue: false,
        rankUpEligible: false,
        attendanceDrop: false,
        starStudent: false
      }
      expect(hasAnyIndicators(indicators)).toBe(false)
    })

    it('returns true when at least one indicator is true', () => {
      const indicators = {
        atRisk: true,
        birthday: false,
        overdue: false,
        rankUpEligible: false,
        attendanceDrop: false,
        starStudent: false
      }
      expect(hasAnyIndicators(indicators)).toBe(true)
    })
  })

  describe('getPrioritizedIndicators', () => {
    it('returns indicators in priority order', () => {
      const indicators = {
        atRisk: true,
        birthday: true,
        overdue: true,
        rankUpEligible: false,
        attendanceDrop: false,
        starStudent: false
      }
      const prioritized = getPrioritizedIndicators(indicators)
      
      expect(prioritized).toEqual(['atRisk', 'overdue', 'birthday'])
    })

    it('returns empty array when no indicators', () => {
      const indicators = {
        atRisk: false,
        birthday: false,
        overdue: false,
        rankUpEligible: false,
        attendanceDrop: false,
        starStudent: false
      }
      const prioritized = getPrioritizedIndicators(indicators)
      
      expect(prioritized).toEqual([])
    })

    it('respects priority order', () => {
      const indicators = {
        atRisk: true,
        birthday: true,
        overdue: true,
        rankUpEligible: true,
        attendanceDrop: true,
        starStudent: true
      }
      const prioritized = getPrioritizedIndicators(indicators)
      
      expect(prioritized[0]).toBe('atRisk')
      expect(prioritized[1]).toBe('overdue')
      expect(prioritized[2]).toBe('birthday')
    })
  })
})

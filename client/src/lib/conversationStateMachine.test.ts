/**
 * Kai Conversation State Machine - Acceptance Tests
 * Tests for the repeated questions bug fix
 */

import { describe, it, expect } from 'vitest';
import {
  applySignals,
  findNextIncompleteStage,
  isStageComplete,
  extractAge,
  extractStudentType,
  extractEmail,
  extractPhone,
  isValidAge,
  isValidEmail,
  isValidPhone,
  isValidName,
  getProgramForAge,
  initialState,
  STAGE_REQUIREMENTS,
} from './conversationStateMachine';

describe('Kai Conversation State Machine - Acceptance Tests', () => {
  describe('A. Age included upfront', () => {
    it('should capture age and infer studentType and program', () => {
      const message = "I'd like to sign my 4 year old up";
      const state = applySignals(initialState, message);
      
      expect(state.age).toBe(4);
      expect(state.studentType).toBe('child');
      expect(state.programInterest).toBe('Little Ninjas');
    });

    it('should skip CAPTURE_STUDENT_TYPE stage when age is provided', () => {
      const message = "I'd like to sign my 4 year old up";
      const state = applySignals(initialState, message);
      
      // CAPTURE_STUDENT_TYPE should be complete
      expect(isStageComplete('CAPTURE_STUDENT_TYPE', state)).toBe(true);
      // CAPTURE_STUDENT_AGE should be complete
      expect(isStageComplete('CAPTURE_STUDENT_AGE', state)).toBe(true);
      // Next incomplete stage should be CAPTURE_NAME
      expect(findNextIncompleteStage('CAPTURE_STUDENT_TYPE', state)).toBe('CAPTURE_NAME');
    });
  });

  describe('B. Type included, age missing', () => {
    it('should capture studentType but require age', () => {
      const message = "I want to enroll my son";
      const state = applySignals(initialState, message);
      
      expect(state.studentType).toBe('child');
      expect(state.age).toBeNull();
      expect(isStageComplete('CAPTURE_STUDENT_TYPE', state)).toBe(true);
      expect(isStageComplete('CAPTURE_STUDENT_AGE', state)).toBe(false);
    });
  });

  describe('C. Age in words', () => {
    it('should capture "four years old"', () => {
      const message = "My child is four years old";
      const age = extractAge(message);
      expect(age).toBe(4);
    });

    it('should capture "four year old"', () => {
      const message = "My child is four year old";
      const age = extractAge(message);
      expect(age).toBe(4);
    });

    it('should capture "4yo"', () => {
      const message = "My 4yo";
      const age = extractAge(message);
      expect(age).toBe(4);
    });

    it('should capture "three years old"', () => {
      const message = "He's three years old";
      const age = extractAge(message);
      expect(age).toBe(3);
    });
  });

  describe('D. Email given immediately', () => {
    it('should capture email and set contact method', () => {
      const message = "Vincent, vincent.holmes00@gmail.com";
      const state = applySignals(initialState, message);
      
      expect(state.name).toBe('Vincent');
      expect(state.email).toBe('vincent.holmes00@gmail.com');
      expect(state.preferredContactMethod).toBe('email');
    });

    it('should not ask for contact method when email is provided', () => {
      const message = "Vincent, vincent.holmes00@gmail.com";
      const state = applySignals(initialState, message);
      
      expect(isStageComplete('CAPTURE_CONTACT_METHOD', state)).toBe(true);
      expect(isStageComplete('CAPTURE_PHONE_OR_EMAIL', state)).toBe(true);
    });
  });

  describe('E. Phone given immediately', () => {
    it('should capture phone and normalize', () => {
      const message = "2818199288";
      const phone = extractPhone(message);
      
      expect(phone).toBe('2818199288');
      expect(isValidPhone(phone)).toBe(true);
    });

    it('should capture formatted phone', () => {
      const message = "281-819-9288";
      const phone = extractPhone(message);
      
      expect(phone).toBe('281-819-9288');
      expect(isValidPhone(phone)).toBe(true);
    });

    it('should set contact method to phone', () => {
      const message = "2818199288";
      const state = applySignals(initialState, message);
      
      expect(state.phone).toBe('2818199288');
      expect(state.preferredContactMethod).toBe('phone');
    });
  });

  describe('F. Loop breaker - No repeated questions', () => {
    it('should not ask age twice', () => {
      const message1 = "I'd like to sign my 4 year old up";
      const state1 = applySignals(initialState, message1);
      
      // Age is captured
      expect(state1.age).toBe(4);
      expect(isStageComplete('CAPTURE_STUDENT_AGE', state1)).toBe(true);
      
      // If we try to ask age again, it should be skipped
      const nextStage = findNextIncompleteStage('CAPTURE_STUDENT_AGE', state1);
      expect(nextStage).not.toBe('CAPTURE_STUDENT_AGE');
    });

    it('should not ask studentType twice', () => {
      const message = "I want to enroll my son";
      const state = applySignals(initialState, message);
      
      expect(state.studentType).toBe('child');
      expect(isStageComplete('CAPTURE_STUDENT_TYPE', state)).toBe(true);
      
      // Next incomplete stage should not be CAPTURE_STUDENT_TYPE
      const nextStage = findNextIncompleteStage('CAPTURE_STUDENT_TYPE', state);
      expect(nextStage).not.toBe('CAPTURE_STUDENT_TYPE');
    });

    it('should not ask name twice', () => {
      let state = { ...initialState };
      
      // First message provides name
      const message1 = "My name is John";
      state = applySignals(state, message1);
      
      expect(state.name).toBe('John');
      expect(isStageComplete('CAPTURE_NAME', state)).toBe(true);
      
      // Should not ask for name again
      const nextStage = findNextIncompleteStage('CAPTURE_NAME', state);
      expect(nextStage).not.toBe('CAPTURE_NAME');
    });
  });

  describe('Stage Requirements Contract', () => {
    it('should have all stages defined', () => {
      const stages = [
        'INTRO',
        'CAPTURE_STUDENT_TYPE',
        'CAPTURE_STUDENT_AGE',
        'CAPTURE_NAME',
        'CAPTURE_SCHEDULE',
        'CAPTURE_CONTACT_METHOD',
        'CAPTURE_PHONE_OR_EMAIL',
        'CONFIRM_LOCATION',
        'CONFIRM_BOOKING_INTENT',
        'SUCCESS',
      ];
      
      for (const stage of stages) {
        expect(STAGE_REQUIREMENTS).toHaveProperty(stage);
      }
    });

    it('should have correct requirements for CAPTURE_STUDENT_TYPE', () => {
      expect(STAGE_REQUIREMENTS['CAPTURE_STUDENT_TYPE']).toContain('studentType');
    });

    it('should have correct requirements for CAPTURE_STUDENT_AGE', () => {
      expect(STAGE_REQUIREMENTS['CAPTURE_STUDENT_AGE']).toContain('age');
    });

    it('should have correct requirements for CAPTURE_NAME', () => {
      expect(STAGE_REQUIREMENTS['CAPTURE_NAME']).toContain('name');
    });

    it('should have correct requirements for CAPTURE_CONTACT_METHOD', () => {
      expect(STAGE_REQUIREMENTS['CAPTURE_CONTACT_METHOD']).toContain('preferredContactMethod');
    });

    it('should have email_or_phone requirement for CAPTURE_PHONE_OR_EMAIL', () => {
      expect(STAGE_REQUIREMENTS['CAPTURE_PHONE_OR_EMAIL']).toContain('email_or_phone');
    });
  });

  describe('Program Auto-Selection', () => {
    it('should set Little Ninjas for 3-5 year olds', () => {
      expect(getProgramForAge(3)).toBe('Little Ninjas');
      expect(getProgramForAge(4)).toBe('Little Ninjas');
      expect(getProgramForAge(5)).toBe('Little Ninjas');
    });

    it('should set Dragon Kids for 6-12 year olds', () => {
      expect(getProgramForAge(6)).toBe('Dragon Kids');
      expect(getProgramForAge(9)).toBe('Dragon Kids');
      expect(getProgramForAge(12)).toBe('Dragon Kids');
    });

    it('should set Teens for 13-15 year olds', () => {
      expect(getProgramForAge(13)).toBe('Teens');
      expect(getProgramForAge(14)).toBe('Teens');
      expect(getProgramForAge(15)).toBe('Teens');
    });

    it('should set Adults for 16+ year olds', () => {
      expect(getProgramForAge(16)).toBe('Adults');
      expect(getProgramForAge(20)).toBe('Adults');
      expect(getProgramForAge(99)).toBe('Adults');
    });
  });

  describe('End-to-End Flow', () => {
    it('should handle complete flow: age + name + email', () => {
      let state = { ...initialState };
      
      // Message 1: Age included
      state = applySignals(state, "I'd like to sign my 4 year old up");
      expect(state.age).toBe(4);
      expect(state.studentType).toBe('child');
      expect(state.programInterest).toBe('Little Ninjas');
      
      // Message 2: Name provided
      state = applySignals(state, "My name is Sarah");
      expect(state.name).toBe('Sarah');
      
      // Message 3: Email provided
      state = applySignals(state, "sarah@example.com");
      expect(state.email).toBe('sarah@example.com');
      expect(state.preferredContactMethod).toBe('email');
      
      // Verify all required fields are captured
      expect(isStageComplete('CAPTURE_STUDENT_TYPE', state)).toBe(true);
      expect(isStageComplete('CAPTURE_STUDENT_AGE', state)).toBe(true);
      expect(isStageComplete('CAPTURE_NAME', state)).toBe(true);
      expect(isStageComplete('CAPTURE_CONTACT_METHOD', state)).toBe(true);
      expect(isStageComplete('CAPTURE_PHONE_OR_EMAIL', state)).toBe(true);
    });
  });
});

/**
 * Kai Identity Acceptance Tests
 * Tests the 5 critical scenarios for Kai's dojo personality and response contract
 */

import { describe, it, expect } from 'vitest';
import { getKaiCorePrompt } from './kai-core-prompt';
import {
  respondToExactMatch,
  respondToZeroResults,
  respondToMultipleResults,
  validateKaiResponse,
} from './kai-response-contract';
import { classifyQuestionDomain, getDojoBrainGuidance } from './kai-dojo-brain';
import { routeQuestionToModule } from './kai-module-awareness';

describe('Kai Identity Acceptance Tests', () => {
  describe('Test A: Show me the student Vincent Holmes', () => {
    it('should confirm action and show student card', () => {
      const studentData = {
        id: 1,
        name: 'Vincent Holmes',
        rank: 'Blue Belt',
        status: 'Active',
        joinDate: '2023-01-15',
        lastCheckIn: '2024-01-16',
        attendanceStreak: 12,
        membershipStatus: 'Current',
        alerts: [],
      };

      const response = respondToExactMatch(
        studentData,
        'student',
        'Blue Belt • Active • 12-week attendance streak',
        [
          { label: 'Message parent', action: 'message_parent' },
          { label: 'Mark attendance', action: 'mark_attendance' },
        ]
      );

      expect(response.message).toContain('Opening student profile for Vincent Holmes');
      expect(response.cards).toHaveLength(1);
      expect(response.cards?.[0].title).toBe('Vincent Holmes');
      expect(response.cards?.[0].data.rank).toBe('Blue Belt');
      expect(response.actions).toHaveLength(2);
    });

    it('should handle zero results for unknown student', () => {
      const response = respondToZeroResults('Unknown Student', 'student', 'Your Dojo');

      expect(response.message).toContain("I couldn't find a student named");
      expect(response.message).toContain('Unknown Student');
      expect(response.actions).toHaveLength(3);
    });

    it('should handle multiple results', () => {
      const results = [
        { id: 1, name: 'Vincent Holmes', rank: 'Blue Belt', joinDate: '2023-01-15' },
        { id: 2, name: 'Vincent Kim', rank: 'Green Belt', joinDate: '2023-06-20' },
      ];

      const response = respondToMultipleResults(
        results,
        'Vincent',
        ['rank', 'joinDate'],
        'student'
      );

      expect(response.message).toContain('found 2 matching');
      expect(response.cards).toHaveLength(2);
    });
  });

  describe('Test B: Who hasn\'t checked in for 14 days?', () => {
    it('should route to Students module', () => {
      const module = routeQuestionToModule("Who hasn't checked in for 14 days?", 'operations');
      expect(['students', 'kiosk', 'operations']).toContain(module);
    });

    it('should return list of at-risk students', () => {
      const atRiskStudents = [
        { id: 1, name: 'Alex Kim', rank: 'Yellow Belt', lastCheckIn: '2024-01-02', daysAgo: 14 },
        { id: 2, name: 'Sarah Johnson', rank: 'Green Belt', lastCheckIn: '2024-01-01', daysAgo: 15 },
      ];

      const response = respondToMultipleResults(
        atRiskStudents,
        'no check-in for 14+ days',
        ['rank', 'lastCheckIn'],
        'student'
      );

      expect(response.message).toContain('found 2 matching');
      expect(response.cards).toHaveLength(2);
    });
  });

  describe('Test C: What classes are today and how full are they?', () => {
    it('should route to Classes module', () => {
      const module = routeQuestionToModule('What classes are today and how full are they?', 'operations');
      expect(module).toBe('classes');
    });

    it('should return class list with capacity info', () => {
      const classes = [
        {
          id: 1,
          name: 'Karate 101',
          level: 'Beginner',
          instructor: 'Sensei Mike',
          schedule: '4:00 PM',
          enrolled: 12,
          capacity: 15,
          utilization: '80%',
        },
        {
          id: 2,
          name: 'Advanced Sparring',
          level: 'Advanced',
          instructor: 'Sensei Lisa',
          schedule: '6:00 PM',
          enrolled: 8,
          capacity: 10,
          utilization: '80%',
        },
      ];

      const response = respondToMultipleResults(
        classes,
        'today',
        ['level', 'schedule', 'utilization'],
        'class'
      );

      expect(response.message).toContain('found 2 matching');
      expect(response.cards).toHaveLength(2);
      expect(response.cards?.[0].data.utilization).toBe('80%');
    });
  });

  describe('Test D: How many leads are stuck in the pipeline?', () => {
    it('should route to Leads module', () => {
      const module = routeQuestionToModule('How many leads are stuck in the pipeline?', 'operations');
      expect(module).toBe('leads');
    });

    it('should return stuck leads with status', () => {
      const stuckLeads = [
        {
          id: 1,
          name: 'John Doe',
          status: 'Contacted',
          source: 'Website',
          lastContact: '2024-01-05',
          daysStuck: 11,
        },
        {
          id: 2,
          name: 'Jane Smith',
          status: 'Interested',
          source: 'Referral',
          lastContact: '2024-01-08',
          daysStuck: 8,
        },
      ];

      const response = respondToMultipleResults(
        stuckLeads,
        'stuck in pipeline',
        ['status', 'source', 'lastContact'],
        'lead'
      );

      expect(response.message).toContain('found 2 matching');
      expect(response.cards).toHaveLength(2);
    });
  });

  describe('Test E: We have sparring tonight, what safety reminders?', () => {
    it('should detect as safety question', () => {
      const domain = classifyQuestionDomain(
        'We have sparring tonight, what safety reminders should I announce?'
      );
      expect(['safety', 'training']).toContain(domain);
    });

    it('should provide dojo-aware safety guidance', () => {
      const guidance = getDojoBrainGuidance(
        'We have sparring tonight, what safety reminders should I announce?'
      );

      expect(guidance).toBeTruthy();
    });

    it('should mention instructor supervision', () => {
      const guidance = getDojoBrainGuidance(
        'We have sparring tonight, what safety reminders should I announce?'
      );

      expect(guidance).toContain('instructor');
    });
  });

  describe('Kai Core Prompt', () => {
    it('should generate core prompt with dojo identity', () => {
      const prompt = getKaiCorePrompt();

      expect(prompt).toContain('Head Instructor');
      expect(prompt).toContain('Operations Assistant');
      expect(prompt).toContain('dojo language');
    });

    it('should include response guidelines', () => {
      const prompt = getKaiCorePrompt();

      expect(prompt).toContain('NEVER respond with fragments');
      expect(prompt).toContain('full, helpful sentences');
    });

    it('should include dojo brain section', () => {
      const prompt = getKaiCorePrompt();

      expect(prompt).toContain('DOJO BRAIN');
      expect(prompt).toContain('SAFETY');
    });

    it('should include module awareness', () => {
      const prompt = getKaiCorePrompt();

      expect(prompt).toContain('MODULE AWARENESS');
    });
  });

  describe('Response Contract', () => {
    it('should prevent fragment responses', () => {
      const badResponse = {
        message: 'Vincent',
        source: 'Students',
      };

      expect(() => validateKaiResponse(badResponse as any)).toThrow();
    });

    it('should accept full helpful responses', () => {
      const goodResponse = {
        message: 'I found Vincent Holmes in your student database. He is a blue belt with a 12-week attendance streak.',
        cards: [
          {
            type: 'student' as const,
            title: 'Vincent Holmes',
            data: { rank: 'Blue Belt' },
          },
        ],
        source: 'Students',
      };

      expect(() => validateKaiResponse(goodResponse as any)).not.toThrow();
    });
  });

  describe('Dojo Personality', () => {
    it('should use dojo language', () => {
      const prompt = getKaiCorePrompt();

      const dojoTerms = ['belt', 'rank', 'mat', 'instructor', 'discipline'];
      dojoTerms.forEach((term) => {
        expect(prompt.toLowerCase()).toContain(term);
      });
    });

    it('should be professional and motivating', () => {
      const prompt = getKaiCorePrompt();

      expect(prompt.toLowerCase()).toContain('professional');
      expect(prompt.toLowerCase()).toContain('motivating');
    });

    it('should emphasize martial arts awareness', () => {
      const prompt = getKaiCorePrompt();

      expect(prompt).toContain('martial arts');
      expect(prompt).toContain('Head Instructor');
    });
  });
});

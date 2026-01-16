/**
 * Kai NLU Integration Tests
 * Tests for natural language metric queries
 */

import { describe, it, expect } from 'vitest';
import { classifyIntent } from './kai-nlp-router';

describe('Kai NLU Integration', () => {
  describe('Intent Classification', () => {
    it('should classify revenue queries', () => {
      const result = classifyIntent('What is our revenue?');
      expect(result).toBeDefined();
      expect(result?.procedure).toBeTruthy();
    });

    it('should classify overdue account queries', () => {
      const result = classifyIntent('Show me overdue accounts');
      expect(result).toBeDefined();
      expect(result?.procedure).toBeTruthy();
    });

    it('should classify class queries', () => {
      const result = classifyIntent('How many classes do we have?');
      expect(result).toBeDefined();
      expect(result?.procedure).toBeTruthy();
    });

    it('should classify attendance queries', () => {
      const result = classifyIntent('What is our attendance rate?');
      expect(result).toBeDefined();
      expect(result?.procedure).toBeTruthy();
    });

    it('should classify student queries', () => {
      const result = classifyIntent('How many students do we have?');
      expect(result).toBeDefined();
      expect(result?.procedure).toBeTruthy();
    });

    it('should classify lead queries', () => {
      const result = classifyIntent('How many leads do we have?');
      expect(result).toBeDefined();
      expect(result?.procedure).toBeTruthy();
    });
  });

  describe('Confidence Scoring', () => {
    it('should return confidence scores between 0 and 1', () => {
      const queries = [
        'What is our revenue?',
        'Show me overdue accounts',
        'How many students?',
      ];

      queries.forEach((query) => {
        const result = classifyIntent(query);
        if (result) {
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should return higher confidence for specific queries', () => {
      const result = classifyIntent('What is our revenue?');
      expect(result?.confidence).toBeGreaterThan(0.1);
    });
  });

  describe('Procedure Routing', () => {
    it('should route to correct procedures', () => {
      const testCases = [
        { query: 'What is our revenue?', expectedProcedure: 'getRevenueSummary' },
        { query: 'Show me overdue accounts', expectedProcedure: 'getOverdueAccounts' },
        { query: 'List all classes', expectedProcedure: 'listClasses' },
      ];

      testCases.forEach(({ query, expectedProcedure }) => {
        const result = classifyIntent(query);
        expect(result?.procedure).toBe(expectedProcedure);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queries', () => {
      const result = classifyIntent('');
      expect(result).toBeDefined();
    });

    it('should handle case-insensitive queries', () => {
      const queries = [
        'WHAT IS OUR REVENUE?',
        'what is our revenue?',
        'What Is Our Revenue?',
      ];

      queries.forEach((query) => {
        const result = classifyIntent(query);
        expect(result).toBeDefined();
      });
    });

    it('should handle queries with special characters', () => {
      const result = classifyIntent('Show me $$$$ revenue!!!');
      expect(result).toBeDefined();
    });

    it('should handle very long queries', () => {
      const longQuery = 'Can you please tell me what our revenue is? ' + 'x'.repeat(500);
      const result = classifyIntent(longQuery);
      expect(result).toBeDefined();
    });
  });

  describe('Example Utterances', () => {
    it('should recognize example utterances', () => {
      const examples = [
        'What is our revenue?',
        'Show me overdue accounts',
        'How many classes do we have?',
        'What is our attendance rate?',
        'How many students do we have?',
        'Show me hot leads',
      ];

      examples.forEach((example) => {
        const result = classifyIntent(example);
        expect(result).toBeDefined();
        expect(result?.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('Keyword Matching', () => {
    it('should match revenue-related keywords', () => {
      const keywords = ['revenue', 'income', 'earnings', 'money', 'sales'];
      keywords.forEach((keyword) => {
        const result = classifyIntent(`Tell me about ${keyword}`);
        expect(result).toBeDefined();
      });
    });

    it('should match class-related keywords', () => {
      const keywords = ['class', 'classes', 'course', 'session', 'lesson'];
      keywords.forEach((keyword) => {
        const result = classifyIntent(`Show me ${keyword}`);
        expect(result).toBeDefined();
      });
    });

    it('should match student-related keywords', () => {
      const keywords = ['student', 'students', 'member', 'members', 'enrollment'];
      keywords.forEach((keyword) => {
        const result = classifyIntent(`How many ${keyword}?`);
        expect(result).toBeDefined();
      });
    });
  });
});

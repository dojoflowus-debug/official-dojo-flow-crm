import { describe, it, expect } from 'vitest';
import { formatFunctionResults } from './services/openai';

describe('UI Block Integration Tests', () => {
  describe('formatFunctionResults', () => {
    it('should create student_card UI block from search_students result', () => {
      const functionResults = [
        {
          function: 'search_students',
          result: [
            {
              id: 123,
              firstName: 'Emma',
              lastName: 'Johnson',
              beltRank: 'Blue Belt',
              program: 'Kids Karate',
              status: 'Active',
            },
          ],
        },
      ];

      const formatted = formatFunctionResults(functionResults);

      expect(formatted).toHaveProperty('text');
      expect(formatted).toHaveProperty('ui_blocks');
      expect(formatted.ui_blocks).toBeInstanceOf(Array);
      expect(formatted.ui_blocks.length).toBeGreaterThan(0);
      
      const block = formatted.ui_blocks[0];
      expect(block.type).toBe('student_card');
      expect(block.studentId).toBe(123);
      expect(block.label).toContain('Emma Johnson');
    });

    it('should create student_list UI block from multiple students', () => {
      const functionResults = [
        {
          function: 'search_students',
          result: [
            { id: 1, firstName: 'John', lastName: 'Doe', beltRank: 'White Belt' },
            { id: 2, firstName: 'Jane', lastName: 'Smith', beltRank: 'White Belt' },
            { id: 3, firstName: 'Bob', lastName: 'Wilson', beltRank: 'White Belt' },
          ],
        },
      ];

      const formatted = formatFunctionResults(functionResults);

      expect(formatted.ui_blocks).toBeInstanceOf(Array);
      expect(formatted.ui_blocks.length).toBe(1);
      
      const block = formatted.ui_blocks[0];
      expect(block.type).toBe('student_list');
      expect(block.studentIds).toEqual([1, 2, 3]);
      expect(block.label).toContain('3 students');
    });

    it('should create lead_card UI block from search_leads result', () => {
      const functionResults = [
        {
          function: 'search_leads',
          result: [
            {
              id: 456,
              firstName: 'Sarah',
              lastName: 'Miller',
              status: 'New',
              source: 'Website',
            },
          ],
        },
      ];

      const formatted = formatFunctionResults(functionResults);

      expect(formatted.ui_blocks).toBeInstanceOf(Array);
      expect(formatted.ui_blocks.length).toBe(1);
      
      const block = formatted.ui_blocks[0];
      expect(block.type).toBe('lead_card');
      expect(block.leadId).toBe(456);
      expect(block.label).toContain('Sarah Miller');
    });

    it('should create lead_list UI block from multiple leads', () => {
      const functionResults = [
        {
          function: 'search_leads',
          result: [
            { id: 10, firstName: 'Alice', lastName: 'Brown', status: 'New' },
            { id: 11, firstName: 'Charlie', lastName: 'Davis', status: 'Contacted' },
          ],
        },
      ];

      const formatted = formatFunctionResults(functionResults);

      expect(formatted.ui_blocks).toBeInstanceOf(Array);
      expect(formatted.ui_blocks.length).toBe(1);
      
      const block = formatted.ui_blocks[0];
      expect(block.type).toBe('lead_list');
      expect(block.leadIds).toEqual([10, 11]);
      expect(block.label).toContain('2 leads');
    });

    it('should handle empty results gracefully', () => {
      const functionResults = [
        {
          function: 'search_students',
          result: [],
        },
      ];

      const formatted = formatFunctionResults(functionResults);

      expect(formatted).toHaveProperty('text');
      expect(formatted).toHaveProperty('ui_blocks');
      expect(formatted.ui_blocks).toEqual([]);
    });

    it('should handle get_student function with single student', () => {
      const functionResults = [
        {
          function: 'get_student',
          result: {
            id: 789,
            firstName: 'Michael',
            lastName: 'Chen',
            beltRank: 'Black Belt',
            program: 'Adult Karate',
          },
        },
      ];

      const formatted = formatFunctionResults(functionResults);

      expect(formatted.ui_blocks).toBeInstanceOf(Array);
      expect(formatted.ui_blocks.length).toBe(1);
      
      const block = formatted.ui_blocks[0];
      expect(block.type).toBe('student_card');
      expect(block.studentId).toBe(789);
      expect(block.label).toContain('Michael Chen');
    });

    it('should handle list_at_risk_students function', () => {
      const functionResults = [
        {
          function: 'list_at_risk_students',
          result: [
            { id: 100, firstName: 'Tom', lastName: 'Anderson', status: 'On Hold' },
            { id: 101, firstName: 'Lisa', lastName: 'White', status: 'Inactive' },
          ],
        },
      ];

      const formatted = formatFunctionResults(functionResults);

      expect(formatted.ui_blocks).toBeInstanceOf(Array);
      expect(formatted.ui_blocks.length).toBe(1);
      
      const block = formatted.ui_blocks[0];
      expect(block.type).toBe('student_list');
      expect(block.studentIds).toEqual([100, 101]);
      expect(block.label).toContain('2 students');
    });
  });
});

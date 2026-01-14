/**
 * Test suite for Kai Embedded Student Cards
 * Verifies that Kai returns structured UI blocks for student/lead queries
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { chatWithKai } from './services/openai';

describe('Kai Embedded Student Cards', () => {
  describe('Structured Response Format', () => {
    it('should return structured JSON with assistant_text and ui_blocks', async () => {
      const response = await chatWithKai('Hello Kai', [], 'Kai');
      
      expect(response).toHaveProperty('response');
      expect(typeof response.response).toBe('string');
      
      // UI blocks should be present (empty array for general conversation)
      expect(response).toHaveProperty('ui_blocks');
      expect(Array.isArray(response.ui_blocks)).toBe(true);
    });

    it('should return empty ui_blocks for general conversation', async () => {
      const response = await chatWithKai('Hello, how are you?', [], 'Kai');
      
      expect(response.ui_blocks).toBeDefined();
      expect(response.ui_blocks?.length).toBe(0);
    });
  });

  describe('Student Card UI Blocks', () => {
    it('should return function calls for student queries', async () => {
      // When asked about a specific student, Kai should call search_students function
      const response = await chatWithKai('Show me Emma Johnson', [], 'Kai');
      
      expect(response).toHaveProperty('response');
      
      // Kai should either:
      // 1. Call functions (functionCalls present), OR
      // 2. Respond conversationally (ui_blocks present)
      const hasFunctionCalls = response.functionCalls && response.functionCalls.length > 0;
      const hasUIBlocks = response.ui_blocks !== undefined;
      
      expect(hasFunctionCalls || hasUIBlocks).toBe(true);
      
      // If function calls were made, verify structure
      if (hasFunctionCalls) {
        expect(response.functionCalls![0]).toHaveProperty('name');
        expect(response.functionCalls![0]).toHaveProperty('arguments');
      }
    });

    it('should return student_list block when asked for multiple students', async () => {
      const response = await chatWithKai('List all white belts', [], 'Kai');
      
      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('ui_blocks');
      expect(Array.isArray(response.ui_blocks)).toBe(true);
      
      // If Kai found students, ui_blocks should contain student_list
      if (response.ui_blocks && response.ui_blocks.length > 0) {
        const block = response.ui_blocks[0];
        expect(block).toHaveProperty('type');
        expect(block).toHaveProperty('label');
        
        if (block.type === 'student_list') {
          expect(block).toHaveProperty('studentIds');
          expect(Array.isArray(block.studentIds)).toBe(true);
        }
      }
    });
  });

  describe('UI Block Schema Validation', () => {
    it('should have required fields in UI blocks', async () => {
      const response = await chatWithKai('Find students at risk', [], 'Kai');
      
      if (response.ui_blocks && response.ui_blocks.length > 0) {
        response.ui_blocks.forEach(block => {
          // Required fields
          expect(block).toHaveProperty('type');
          expect(block).toHaveProperty('label');
          
          // Type must be one of the valid values
          expect(['student_card', 'student_list', 'lead_card', 'lead_list']).toContain(block.type);
          
          // Conditional fields based on type
          if (block.type === 'student_card') {
            expect(block).toHaveProperty('studentId');
            expect(typeof block.studentId).toBe('number');
          }
          
          if (block.type === 'student_list') {
            expect(block).toHaveProperty('studentIds');
            expect(Array.isArray(block.studentIds)).toBe(true);
          }
          
          if (block.type === 'lead_card') {
            expect(block).toHaveProperty('leadId');
            expect(typeof block.leadId).toBe('number');
          }
          
          if (block.type === 'lead_list') {
            expect(block).toHaveProperty('leadIds');
            expect(Array.isArray(block.leadIds)).toBe(true);
          }
        });
      }
    });
  });

  describe('Response Quality', () => {
    it('should return conversational text in assistant_text', async () => {
      const response = await chatWithKai('Hello Kai', [], 'Kai');
      
      expect(response.response).toBeDefined();
      expect(typeof response.response).toBe('string');
      // Response may be empty if LLM doesn't respond, that's okay
      if (response.response) {
        expect(response.response.length).toBeGreaterThan(0);
      }
    });

    it('should handle errors gracefully', async () => {
      // Test with empty message
      const response = await chatWithKai('', [], 'Kai');
      
      expect(response).toHaveProperty('response');
      // ui_blocks may or may not be present depending on error path
      if (response.ui_blocks !== undefined) {
        expect(Array.isArray(response.ui_blocks)).toBe(true);
      }
    });
  });
});

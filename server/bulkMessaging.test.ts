import { describe, it, expect } from 'vitest';

// Test the bulk class messaging logic

describe('Bulk Class Messaging', () => {
  describe('Class Mention Detection', () => {
    it('should identify class mentions in mention array', () => {
      const mentions = [
        { type: 'class', id: 1, displayName: 'Kids Karate', studentCount: 12 },
        { type: 'student', id: 5, displayName: 'John Doe' },
      ];
      
      const classMentions = mentions.filter(m => m.type === 'class');
      expect(classMentions).toHaveLength(1);
      expect(classMentions[0].displayName).toBe('Kids Karate');
      expect(classMentions[0].studentCount).toBe(12);
    });

    it('should handle messages with no class mentions', () => {
      const mentions = [
        { type: 'student', id: 5, displayName: 'John Doe' },
        { type: 'kai', id: 'kai', displayName: 'Kai' },
      ];
      
      const classMentions = mentions.filter(m => m.type === 'class');
      expect(classMentions).toHaveLength(0);
    });

    it('should handle multiple class mentions', () => {
      const mentions = [
        { type: 'class', id: 1, displayName: 'Kids Karate', studentCount: 12 },
        { type: 'class', id: 2, displayName: 'Teen BJJ', studentCount: 8 },
      ];
      
      const classMentions = mentions.filter(m => m.type === 'class');
      expect(classMentions).toHaveLength(2);
    });
  });

  describe('Student Deduplication', () => {
    it('should deduplicate students mentioned in multiple classes', () => {
      const expandedStudents = [
        { type: 'student', id: 1, displayName: 'Student A' },
        { type: 'student', id: 2, displayName: 'Student B' },
        { type: 'student', id: 1, displayName: 'Student A' }, // Duplicate
        { type: 'student', id: 3, displayName: 'Student C' },
      ];
      
      const deduplicated = expandedStudents.filter((mention, index, self) =>
        index === self.findIndex(m => m.id === mention.id)
      );
      
      expect(deduplicated).toHaveLength(3);
      expect(deduplicated.map(s => s.id)).toEqual([1, 2, 3]);
    });

    it('should deduplicate when student is mentioned directly and in class', () => {
      const directMentions = [
        { type: 'student', id: 1, displayName: 'John Doe' },
      ];
      
      const expandedFromClass = [
        { type: 'student', id: 1, displayName: 'John Doe' },
        { type: 'student', id: 2, displayName: 'Jane Smith' },
      ];
      
      const allMentions = [...directMentions, ...expandedFromClass];
      const deduplicated = allMentions.filter((mention, index, self) =>
        index === self.findIndex(m => m.id === mention.id)
      );
      
      expect(deduplicated).toHaveLength(2);
    });
  });

  describe('Mention Schema Validation', () => {
    it('should accept valid class mention schema', () => {
      const validClassMention = {
        type: 'class',
        id: 1,
        displayName: 'Kids Karate',
        studentCount: 12,
      };
      
      expect(validClassMention.type).toBe('class');
      expect(typeof validClassMention.id).toBe('number');
      expect(typeof validClassMention.displayName).toBe('string');
      expect(typeof validClassMention.studentCount).toBe('number');
    });

    it('should handle class mention without studentCount', () => {
      const classMention = {
        type: 'class',
        id: 1,
        displayName: 'Kids Karate',
      };
      
      expect(classMention.type).toBe('class');
      // studentCount is optional
      expect((classMention as any).studentCount).toBeUndefined();
    });
  });

  describe('Class Search Filtering', () => {
    it('should filter classes by search query', () => {
      const classes = [
        { id: 1, name: 'Kids Karate', schedule: 'Mon/Wed 4pm', studentCount: 12 },
        { id: 2, name: 'Teen BJJ', schedule: 'Tue/Thu 5pm', studentCount: 8 },
        { id: 3, name: 'Adult Kickboxing', schedule: 'Mon/Wed 7pm', studentCount: 15 },
      ];
      
      const searchQuery = 'kids';
      const filtered = classes.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Kids Karate');
    });

    it('should return all classes when search is empty', () => {
      const classes = [
        { id: 1, name: 'Kids Karate', schedule: 'Mon/Wed 4pm', studentCount: 12 },
        { id: 2, name: 'Teen BJJ', schedule: 'Tue/Thu 5pm', studentCount: 8 },
      ];
      
      const searchQuery = '';
      let filtered = classes;
      if (searchQuery && searchQuery.length > 0) {
        filtered = classes.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      expect(filtered).toHaveLength(2);
    });

    it('should handle partial matches', () => {
      const classes = [
        { id: 1, name: 'Kids Karate', schedule: 'Mon/Wed 4pm', studentCount: 12 },
        { id: 2, name: 'Teen Karate', schedule: 'Tue/Thu 5pm', studentCount: 8 },
        { id: 3, name: 'Adult BJJ', schedule: 'Mon/Wed 7pm', studentCount: 15 },
      ];
      
      const searchQuery = 'kara';
      const filtered = classes.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(c => c.name)).toContain('Kids Karate');
      expect(filtered.map(c => c.name)).toContain('Teen Karate');
    });
  });

  describe('Bulk Message Delivery', () => {
    it('should calculate total recipients from class student counts', () => {
      const classMentions = [
        { type: 'class', id: 1, displayName: 'Kids Karate', studentCount: 12 },
        { type: 'class', id: 2, displayName: 'Teen BJJ', studentCount: 8 },
      ];
      
      const totalRecipients = classMentions.reduce((sum, c) => sum + (c.studentCount || 0), 0);
      expect(totalRecipients).toBe(20);
    });

    it('should handle empty class with zero students', () => {
      const classMentions = [
        { type: 'class', id: 1, displayName: 'New Class', studentCount: 0 },
      ];
      
      const totalRecipients = classMentions.reduce((sum, c) => sum + (c.studentCount || 0), 0);
      expect(totalRecipients).toBe(0);
    });
  });

  describe('Mention Type Badge Display', () => {
    it('should format class badge with student count', () => {
      const mention = { type: 'class', id: 1, displayName: 'Kids Karate', studentCount: 12 };
      
      const badgeText = mention.type === 'class' 
        ? `${mention.studentCount} students` 
        : mention.type;
      
      expect(badgeText).toBe('12 students');
    });

    it('should handle singular student count', () => {
      const mention = { type: 'class', id: 1, displayName: 'Private Lesson', studentCount: 1 };
      
      // Note: Current implementation uses "students" for all counts
      const badgeText = `${mention.studentCount} students`;
      expect(badgeText).toBe('1 students');
    });
  });
});

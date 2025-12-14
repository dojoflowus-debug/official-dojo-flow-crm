import { describe, it, expect } from 'vitest';
import {
  isLikelyProfilePhoto,
  isLikelySchedule,
  isLikelyRoster,
  isLikelyWaiver,
  isLikelyReceipt,
  analyzeFile,
  generateKaiFileResponse,
} from '../client/src/lib/fileIntelligence';

describe('File Intelligence System', () => {
  describe('isLikelyProfilePhoto', () => {
    it('should detect square images as likely profile photos', () => {
      const result = isLikelyProfilePhoto(500, 500, 1024 * 100, 'image.jpg');
      expect(result.isProfile).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect images with profile keywords', () => {
      const result = isLikelyProfilePhoto(800, 600, 1024 * 100, 'profile-photo.jpg');
      expect(result.isProfile).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    });

    it('should detect headshot images', () => {
      const result = isLikelyProfilePhoto(400, 400, 1024 * 50, 'headshot.png');
      expect(result.isProfile).toBe(true);
    });

    it('should not flag very wide images as profile photos', () => {
      const result = isLikelyProfilePhoto(2000, 500, 1024 * 100, 'banner.jpg');
      expect(result.confidence).toBeLessThan(0.4);
    });
  });

  describe('isLikelySchedule', () => {
    it('should detect schedule-related filenames', () => {
      expect(isLikelySchedule('class-schedule.pdf').isSchedule).toBe(true);
      expect(isLikelySchedule('weekly-timetable.xlsx').isSchedule).toBe(true);
      expect(isLikelySchedule('calendar.png').isSchedule).toBe(true);
    });

    it('should not flag unrelated filenames', () => {
      expect(isLikelySchedule('photo.jpg').isSchedule).toBe(false);
      expect(isLikelySchedule('document.pdf').isSchedule).toBe(false);
    });
  });

  describe('isLikelyRoster', () => {
    it('should detect roster-related filenames', () => {
      expect(isLikelyRoster('student-roster.xlsx').isRoster).toBe(true);
      expect(isLikelyRoster('members-list.pdf').isRoster).toBe(true);
      expect(isLikelyRoster('enrollment.csv').isRoster).toBe(true);
    });

    it('should not flag unrelated filenames', () => {
      expect(isLikelyRoster('photo.jpg').isRoster).toBe(false);
    });
  });

  describe('isLikelyWaiver', () => {
    it('should detect waiver-related filenames', () => {
      expect(isLikelyWaiver('liability-waiver.pdf').isWaiver).toBe(true);
      expect(isLikelyWaiver('consent-form.docx').isWaiver).toBe(true);
      expect(isLikelyWaiver('release-agreement.pdf').isWaiver).toBe(true);
    });
  });

  describe('isLikelyReceipt', () => {
    it('should detect receipt-related filenames', () => {
      expect(isLikelyReceipt('receipt-001.pdf').isReceipt).toBe(true);
      expect(isLikelyReceipt('invoice.pdf').isReceipt).toBe(true);
      expect(isLikelyReceipt('payment-confirmation.png').isReceipt).toBe(true);
    });
  });

  describe('analyzeFile', () => {
    it('should analyze image files with dimensions', async () => {
      const analysis = await analyzeFile(
        { fileName: 'profile.jpg', fileType: 'image/jpeg', fileSize: 1024 * 100 },
        { width: 500, height: 500 }
      );
      
      expect(analysis.category).toBe('profile_photo');
      expect(analysis.proposedActions.length).toBeGreaterThan(0);
      expect(analysis.proposedActions.some(a => a.id === 'set_instructor_profile')).toBe(true);
    });

    it('should analyze PDF files', async () => {
      const analysis = await analyzeFile(
        { fileName: 'document.pdf', fileType: 'application/pdf', fileSize: 1024 * 500 }
      );
      
      expect(analysis.category).toBe('document');
      expect(analysis.proposedActions.some(a => a.id === 'save_to_documents')).toBe(true);
    });

    it('should detect schedule PDFs', async () => {
      const analysis = await analyzeFile(
        { fileName: 'class-schedule.pdf', fileType: 'application/pdf', fileSize: 1024 * 200 }
      );
      
      expect(analysis.category).toBe('schedule');
      expect(analysis.proposedActions.some(a => a.id === 'import_schedule')).toBe(true);
    });

    it('should detect roster spreadsheets', async () => {
      const analysis = await analyzeFile(
        { fileName: 'student-roster.xlsx', fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 1024 * 100 }
      );
      
      expect(analysis.category).toBe('roster');
      expect(analysis.proposedActions.some(a => a.id === 'import_roster')).toBe(true);
    });

    it('should always include save to documents option', async () => {
      const analysis = await analyzeFile(
        { fileName: 'random-file.txt', fileType: 'text/plain', fileSize: 1024 }
      );
      
      expect(analysis.proposedActions.some(a => a.id === 'save_to_documents')).toBe(true);
    });
  });

  describe('generateKaiFileResponse', () => {
    it('should generate response for profile photos', () => {
      const analysis = {
        category: 'profile_photo' as const,
        confidence: 0.8,
        proposedActions: [
          { id: 'set_instructor_profile', label: 'Set as my profile photo', description: '', icon: 'User', primary: true, requiresConfirmation: true },
        ],
      };
      
      const response = generateKaiFileResponse(analysis, 'photo.jpg');
      expect(response).toContain('photo.jpg');
      expect(response).toContain('profile photo');
    });

    it('should generate response for schedules', () => {
      const analysis = {
        category: 'schedule' as const,
        confidence: 0.7,
        proposedActions: [
          { id: 'import_schedule', label: 'Import as schedule', description: '', icon: 'Calendar', primary: true, requiresConfirmation: true },
        ],
      };
      
      const response = generateKaiFileResponse(analysis, 'schedule.pdf');
      expect(response).toContain('schedule.pdf');
      expect(response).toContain('schedule');
    });

    it('should list available actions', () => {
      const analysis = {
        category: 'general_image' as const,
        confidence: 0.5,
        proposedActions: [
          { id: 'save_to_documents', label: 'Save to documents', description: '', icon: 'FolderOpen', requiresConfirmation: false },
        ],
      };
      
      const response = generateKaiFileResponse(analysis, 'image.png');
      expect(response).toContain('Available actions');
      expect(response).toContain('Save to documents');
    });
  });
});

// File Intelligence System for Kai-First Assisted Setup
// Detects file types and classifies intent to propose appropriate actions

export type FileCategory = 
  | 'profile_photo'
  | 'schedule'
  | 'roster'
  | 'document'
  | 'receipt'
  | 'waiver'
  | 'certificate'
  | 'general_image'
  | 'unknown';

export type ProposedAction = {
  id: string;
  label: string;
  description: string;
  icon: string;
  primary?: boolean;
  requiresConfirmation: boolean;
  targetEntity?: 'instructor' | 'student' | 'class' | 'document';
};

export type FileAnalysis = {
  category: FileCategory;
  confidence: number; // 0-1
  proposedActions: ProposedAction[];
  clarifyingQuestions?: string[];
  draftPreview?: {
    type: 'profile' | 'schedule' | 'roster' | 'document';
    data: any;
  };
};

// Image dimension analysis for profile photo detection
export const isLikelyProfilePhoto = (
  width: number,
  height: number,
  fileSize: number,
  fileName: string
): { isProfile: boolean; confidence: number } => {
  const aspectRatio = width / height;
  const isSquarish = aspectRatio >= 0.7 && aspectRatio <= 1.4;
  const isReasonableSize = fileSize < 10 * 1024 * 1024; // Under 10MB
  const hasProfileKeywords = /profile|avatar|headshot|photo|portrait|pic|selfie/i.test(fileName);
  const isSmallDimension = width <= 2000 && height <= 2000;
  
  let confidence = 0;
  if (isSquarish) confidence += 0.3;
  if (isReasonableSize) confidence += 0.1;
  if (hasProfileKeywords) confidence += 0.4;
  if (isSmallDimension) confidence += 0.2;
  
  return {
    isProfile: confidence >= 0.4,
    confidence: Math.min(confidence, 1),
  };
};

// Detect schedule-related content from filename
export const isLikelySchedule = (fileName: string): { isSchedule: boolean; confidence: number } => {
  const scheduleKeywords = /schedule|calendar|timetable|class.?list|weekly|daily|hours|times/i;
  const hasKeyword = scheduleKeywords.test(fileName);
  
  return {
    isSchedule: hasKeyword,
    confidence: hasKeyword ? 0.7 : 0.1,
  };
};

// Detect roster/student list from filename
export const isLikelyRoster = (fileName: string): { isRoster: boolean; confidence: number } => {
  const rosterKeywords = /roster|student.?list|members|enrollment|attendees|participants|sign.?up/i;
  const hasKeyword = rosterKeywords.test(fileName);
  
  return {
    isRoster: hasKeyword,
    confidence: hasKeyword ? 0.7 : 0.1,
  };
};

// Detect waiver/legal documents
export const isLikelyWaiver = (fileName: string): { isWaiver: boolean; confidence: number } => {
  const waiverKeywords = /waiver|consent|release|liability|agreement|contract|terms/i;
  const hasKeyword = waiverKeywords.test(fileName);
  
  return {
    isWaiver: hasKeyword,
    confidence: hasKeyword ? 0.8 : 0.1,
  };
};

// Detect receipt/payment documents
export const isLikelyReceipt = (fileName: string): { isReceipt: boolean; confidence: number } => {
  const receiptKeywords = /receipt|invoice|payment|billing|transaction|order/i;
  const hasKeyword = receiptKeywords.test(fileName);
  
  return {
    isReceipt: hasKeyword,
    confidence: hasKeyword ? 0.8 : 0.1,
  };
};

// Main file analysis function
export const analyzeFile = async (
  file: {
    fileName: string;
    fileType: string;
    fileSize: number;
    url?: string;
  },
  imageDimensions?: { width: number; height: number }
): Promise<FileAnalysis> => {
  const { fileName, fileType, fileSize } = file;
  const isImage = fileType.startsWith('image/');
  const isPDF = fileType === 'application/pdf';
  const isSpreadsheet = /spreadsheet|excel|csv/i.test(fileType) || /\.(xlsx?|csv)$/i.test(fileName);
  
  // Default analysis
  let category: FileCategory = 'unknown';
  let confidence = 0.3;
  const proposedActions: ProposedAction[] = [];
  const clarifyingQuestions: string[] = [];
  
  // Analyze based on file type
  if (isImage) {
    // Check if it's likely a profile photo
    if (imageDimensions) {
      const profileAnalysis = isLikelyProfilePhoto(
        imageDimensions.width,
        imageDimensions.height,
        fileSize,
        fileName
      );
      
      if (profileAnalysis.isProfile) {
        category = 'profile_photo';
        confidence = profileAnalysis.confidence;
        
        proposedActions.push(
          {
            id: 'set_instructor_profile',
            label: 'Set as my profile photo',
            description: 'Use this image as your instructor profile photo',
            icon: 'User',
            primary: true,
            requiresConfirmation: true,
            targetEntity: 'instructor',
          },
          {
            id: 'assign_student_profile',
            label: 'Assign to a student',
            description: 'Set this as a student\'s profile photo',
            icon: 'Users',
            requiresConfirmation: true,
            targetEntity: 'student',
          },
          {
            id: 'save_to_documents',
            label: 'Save to documents',
            description: 'Store this image in your document library',
            icon: 'FolderOpen',
            requiresConfirmation: false,
            targetEntity: 'document',
          }
        );
      } else {
        category = 'general_image';
        confidence = 0.5;
        
        // Check for schedule/roster indicators
        const scheduleAnalysis = isLikelySchedule(fileName);
        const rosterAnalysis = isLikelyRoster(fileName);
        
        if (scheduleAnalysis.isSchedule) {
          category = 'schedule';
          confidence = scheduleAnalysis.confidence;
          proposedActions.push({
            id: 'import_schedule',
            label: 'Import as schedule',
            description: 'Let me extract class times from this image',
            icon: 'Calendar',
            primary: true,
            requiresConfirmation: true,
            targetEntity: 'class',
          });
        } else if (rosterAnalysis.isRoster) {
          category = 'roster';
          confidence = rosterAnalysis.confidence;
          proposedActions.push({
            id: 'import_roster',
            label: 'Import student roster',
            description: 'Let me extract student information from this image',
            icon: 'Users',
            primary: true,
            requiresConfirmation: true,
            targetEntity: 'student',
          });
        }
        
        // Always offer save to documents
        proposedActions.push({
          id: 'save_to_documents',
          label: 'Save to documents',
          description: 'Store this image in your document library',
          icon: 'FolderOpen',
          requiresConfirmation: false,
          targetEntity: 'document',
        });
      }
    } else {
      // No dimensions available, offer general options
      category = 'general_image';
      confidence = 0.4;
      
      proposedActions.push(
        {
          id: 'set_instructor_profile',
          label: 'Set as my profile photo',
          description: 'Use this image as your instructor profile photo',
          icon: 'User',
          requiresConfirmation: true,
          targetEntity: 'instructor',
        },
        {
          id: 'assign_student_profile',
          label: 'Assign to a student',
          description: 'Set this as a student\'s profile photo',
          icon: 'Users',
          requiresConfirmation: true,
          targetEntity: 'student',
        },
        {
          id: 'save_to_documents',
          label: 'Save to documents',
          description: 'Store this image in your document library',
          icon: 'FolderOpen',
          requiresConfirmation: false,
          targetEntity: 'document',
        }
      );
      
      clarifyingQuestions.push('What would you like to do with this image?');
    }
  } else if (isPDF || isSpreadsheet) {
    // Check for specific document types
    const scheduleAnalysis = isLikelySchedule(fileName);
    const rosterAnalysis = isLikelyRoster(fileName);
    const waiverAnalysis = isLikelyWaiver(fileName);
    const receiptAnalysis = isLikelyReceipt(fileName);
    
    if (scheduleAnalysis.isSchedule) {
      category = 'schedule';
      confidence = scheduleAnalysis.confidence;
      proposedActions.push({
        id: 'import_schedule',
        label: 'Import class schedule',
        description: 'Extract and create classes from this document',
        icon: 'Calendar',
        primary: true,
        requiresConfirmation: true,
        targetEntity: 'class',
      });
    } else if (rosterAnalysis.isRoster) {
      category = 'roster';
      confidence = rosterAnalysis.confidence;
      proposedActions.push({
        id: 'import_roster',
        label: 'Import student roster',
        description: 'Extract and add students from this document',
        icon: 'Users',
        primary: true,
        requiresConfirmation: true,
        targetEntity: 'student',
      });
    } else if (waiverAnalysis.isWaiver) {
      category = 'waiver';
      confidence = waiverAnalysis.confidence;
      proposedActions.push({
        id: 'save_waiver',
        label: 'Save as waiver template',
        description: 'Store this as a waiver document for students to sign',
        icon: 'FileCheck',
        primary: true,
        requiresConfirmation: true,
        targetEntity: 'document',
      });
    } else if (receiptAnalysis.isReceipt) {
      category = 'receipt';
      confidence = receiptAnalysis.confidence;
      proposedActions.push({
        id: 'save_receipt',
        label: 'Save to billing records',
        description: 'Store this receipt in your billing documents',
        icon: 'Receipt',
        primary: true,
        requiresConfirmation: true,
        targetEntity: 'document',
      });
    } else {
      category = 'document';
      confidence = 0.5;
    }
    
    // Always offer save to documents
    if (!proposedActions.some(a => a.id === 'save_to_documents')) {
      proposedActions.push({
        id: 'save_to_documents',
        label: 'Save to documents',
        description: 'Store this file in your document library',
        icon: 'FolderOpen',
        requiresConfirmation: false,
        targetEntity: 'document',
      });
    }
  } else {
    // Unknown file type
    category = 'document';
    confidence = 0.3;
    proposedActions.push({
      id: 'save_to_documents',
      label: 'Save to documents',
      description: 'Store this file in your document library',
      icon: 'FolderOpen',
      primary: true,
      requiresConfirmation: false,
      targetEntity: 'document',
    });
  }
  
  return {
    category,
    confidence,
    proposedActions,
    clarifyingQuestions: clarifyingQuestions.length > 0 ? clarifyingQuestions : undefined,
  };
};

// Generate Kai's response based on file analysis
export const generateKaiFileResponse = (analysis: FileAnalysis, fileName: string): string => {
  const { category, confidence, proposedActions } = analysis;
  
  let response = '';
  
  switch (category) {
    case 'profile_photo':
      response = `I see you've uploaded **${fileName}** - this looks like it could be a profile photo. What would you like me to do with it?\n\n`;
      break;
    case 'schedule':
      response = `I notice **${fileName}** appears to be a schedule. I can help you import this into your class calendar. Would you like me to extract the class times?\n\n`;
      break;
    case 'roster':
      response = `**${fileName}** looks like a student roster or member list. I can help you import these students into your system. Should I analyze it?\n\n`;
      break;
    case 'waiver':
      response = `I see **${fileName}** appears to be a waiver or consent form. Would you like me to save this as a template for your students?\n\n`;
      break;
    case 'receipt':
      response = `**${fileName}** looks like a receipt or invoice. I can save this to your billing records. Would you like me to do that?\n\n`;
      break;
    case 'general_image':
      response = `You've uploaded **${fileName}**. What would you like me to do with this image?\n\n`;
      break;
    case 'document':
      response = `I received **${fileName}**. How would you like me to handle this document?\n\n`;
      break;
    default:
      response = `You've uploaded **${fileName}**. Let me know what you'd like to do with it.\n\n`;
  }
  
  // Add action options
  if (proposedActions.length > 0) {
    response += '**Available actions:**\n';
    proposedActions.forEach((action, index) => {
      const bullet = action.primary ? '→' : '•';
      response += `${bullet} ${action.label}\n`;
    });
  }
  
  return response;
};

// Get image dimensions from URL
export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
};

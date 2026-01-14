/**
 * Real Results Testimonials
 * Showcasing customer success stories across different studio types
 */

export type StudioType = 'martial_arts' | 'kickboxing' | 'boxing' | 'yoga';

export interface Testimonial {
  id: string;
  studioName: string;
  ownerName: string;
  ownerRole: string;
  studioType: StudioType;
  quote: string;
  metric: {
    label: string;
    value: string;
  };
  imageInitials: string; // For avatar generation
}

export const testimonials: Testimonial[] = [
  {
    id: 'martial-arts-1',
    studioName: 'Dragon Dojo',
    ownerName: 'Marcus Chen',
    ownerRole: 'Head Instructor & Owner',
    studioType: 'martial_arts',
    quote:
      'DojoFlow transformed how we manage our students. Kai automated our scheduling and reminders, cutting admin time by 70%. We went from managing everything manually to running a streamlined operation.',
    metric: {
      label: 'Admin Time Saved',
      value: '70%',
    },
    imageInitials: 'MC',
  },
  {
    id: 'kickboxing-1',
    studioName: 'Strike Fitness',
    ownerName: 'Jessica Rodriguez',
    ownerRole: 'Studio Owner',
    studioType: 'kickboxing',
    quote:
      'Our student retention jumped significantly after implementing DojoFlow. The automated check-ins and personalized messaging made students feel valued. We retained 27% more students this quarter.',
    metric: {
      label: 'Student Retention',
      value: '+27%',
    },
    imageInitials: 'JR',
  },
  {
    id: 'boxing-1',
    studioName: 'Champion Boxing Co.',
    ownerName: 'David Thompson',
    ownerRole: 'Founder',
    studioType: 'boxing',
    quote:
      'Kai handles our attendance tracking and member communications. We saved 10+ hours per week on administrative tasks, allowing us to focus on coaching and growing our community.',
    metric: {
      label: 'Hours Saved Weekly',
      value: '10+',
    },
    imageInitials: 'DT',
  },
  {
    id: 'yoga-1',
    studioName: 'Zen Flow Studios',
    ownerName: 'Sarah Mitchell',
    ownerRole: 'Studio Director',
    studioType: 'yoga',
    quote:
      'DojoFlow streamlined our class scheduling and member management. Our enrollment grew by 34% because we could focus on member experience instead of paperwork.',
    metric: {
      label: 'Enrollment Growth',
      value: '+34%',
    },
    imageInitials: 'SM',
  },
  {
    id: 'martial-arts-2',
    studioName: 'Phoenix Martial Arts',
    ownerName: 'Ahmed Hassan',
    ownerRole: 'Owner & Sensei',
    studioType: 'martial_arts',
    quote:
      'The automated billing and payment reminders eliminated late payments. Our revenue consistency improved dramatically, and Kai handles all the follow-ups.',
    metric: {
      label: 'Revenue Consistency',
      value: '+42%',
    },
    imageInitials: 'AH',
  },
  {
    id: 'kickboxing-2',
    studioName: 'Knockout Academy',
    ownerName: 'Lisa Park',
    ownerRole: 'Head Coach & Owner',
    studioType: 'kickboxing',
    quote:
      'DojoFlow gave us real-time insights into class attendance and member engagement. We identified inactive members and re-engaged 18 of them through Kai\'s smart outreach.',
    metric: {
      label: 'Members Re-engaged',
      value: '18',
    },
    imageInitials: 'LP',
  },
  {
    id: 'boxing-2',
    studioName: 'Ringside Fitness',
    ownerName: 'Carlos Mendez',
    ownerRole: 'Studio Manager',
    studioType: 'boxing',
    quote:
      'Kai\'s automated class reminders reduced no-shows by 31%. Our classes are fuller, members are happier, and our revenue per class increased significantly.',
    metric: {
      label: 'No-show Reduction',
      value: '-31%',
    },
    imageInitials: 'CM',
  },
  {
    id: 'yoga-2',
    studioName: 'Mindful Movement',
    ownerName: 'Emma Thompson',
    ownerRole: 'Founder & Lead Instructor',
    studioType: 'yoga',
    quote:
      'Managing multiple class schedules and instructor coordination was overwhelming. DojoFlow made it effortless. We scaled from 3 to 8 classes per week without hiring additional staff.',
    metric: {
      label: 'Classes Scaled',
      value: '3 → 8',
    },
    imageInitials: 'ET',
  },
];

export const studioTypeLabels: Record<StudioType, string> = {
  martial_arts: 'Martial Arts',
  kickboxing: 'Kickboxing',
  boxing: 'Boxing',
  yoga: 'Yoga & Boutique',
};

/**
 * Pre-built Automation Templates
 * These templates can be installed with one click and auto-populate with dojo settings
 */

export interface AutomationTemplate {
  name: string;
  description: string;
  trigger: string;
  steps: {
    stepOrder: number;
    stepType: "wait" | "send_sms" | "send_email" | "end";
    name: string;
    waitMinutes?: number;
    subject?: string;
    message?: string;
  }[];
}

export const automationTemplates: AutomationTemplate[] = [
  {
    name: "New Lead Welcome Sequence",
    description: "Automatically welcome new leads and follow up within 24 hours to schedule their trial class",
    trigger: "new_lead",
    steps: [
      {
        stepOrder: 1,
        stepType: "send_sms",
        name: "Immediate Welcome SMS",
        message: `Hi {{firstName}}! 👋 Thanks for your interest in {{businessName}}!

We're excited to help you start your martial arts journey. A member of our team will reach out within 24 hours to schedule your FREE trial class.

Questions? Text us back anytime!
- {{preferredName}}`
      },
      {
        stepOrder: 2,
        stepType: "wait",
        name: "Wait 24 Hours",
        waitMinutes: 1440 // 24 hours
      },
      {
        stepOrder: 3,
        stepType: "send_email",
        name: "Follow-up Email",
        subject: "Your FREE Trial Class Awaits! 🥋",
        message: `Hi {{firstName}},

I wanted to personally follow up about your interest in joining {{businessName}}!

Here's what you can expect in your FREE trial class:
✅ Meet our expert instructors
✅ Experience a real class (no pressure!)
✅ Learn basic techniques
✅ See if we're the right fit for you

Ready to schedule? Simply reply to this email or text us at {{dojoPhone}}.

We're located at:
{{locationAddress}}

Looking forward to meeting you!

{{preferredName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        stepOrder: 4,
        stepType: "end",
        name: "End Sequence"
      }
    ]
  },
  {
    name: "Trial Class Reminder",
    description: "Send reminders before scheduled trial classes to reduce no-shows",
    trigger: "trial_scheduled",
    steps: [
      {
        stepOrder: 1,
        stepType: "wait",
        name: "Wait Until 24 Hours Before",
        waitMinutes: 1440 // Adjust based on trial date
      },
      {
        stepOrder: 2,
        stepType: "send_sms",
        name: "24-Hour Reminder",
        message: `Hi {{firstName}}! 👋

Just a friendly reminder that your FREE trial class at {{businessName}} is tomorrow!

📍 Location: {{locationAddress}}
⏰ Time: [Trial Time]

Can't wait to see you there! Reply CONFIRM to let us know you're coming, or text us if you need to reschedule.

- {{preferredName}}`
      },
      {
        stepOrder: 3,
        stepType: "wait",
        name: "Wait Until 2 Hours Before",
        waitMinutes: 1320 // 22 hours (to make it 2 hours before)
      },
      {
        stepOrder: 4,
        stepType: "send_sms",
        name: "2-Hour Reminder",
        message: `Hi {{firstName}}! Your trial class at {{businessName}} starts in 2 hours. See you soon! 🥋`
      },
      {
        stepOrder: 5,
        stepType: "end",
        name: "End Sequence"
      }
    ]
  },
  {
    name: "Re-engagement Sequence",
    description: "Win back inactive students who haven't attended class in 30+ days",
    trigger: "inactive_student",
    steps: [
      {
        stepOrder: 1,
        stepType: "send_email",
        name: "We Miss You Email",
        subject: "We Miss You at {{businessName}}! 🥋",
        message: `Hi {{firstName}},

We noticed you haven't been to class in a while, and we wanted to reach out!

Life gets busy - we totally understand. But we also know how important your training is to you.

Here's a special offer just for you:
🎁 Come back this week and get your next month at 20% OFF

Your spot is waiting for you. Let's get you back on the mat!

Ready to return? Reply to this email or text us at {{dojoPhone}}.

We're here to support you,
{{preferredName}}
{{businessName}}`
      },
      {
        stepOrder: 2,
        stepType: "wait",
        name: "Wait 7 Days",
        waitMinutes: 10080 // 7 days
      },
      {
        stepOrder: 3,
        stepType: "send_sms",
        name: "Follow-up SMS",
        message: `Hi {{firstName}}! We'd love to see you back at {{businessName}}. Your 20% off offer is still available this week. Text back to schedule your return! - {{preferredName}}`
      },
      {
        stepOrder: 4,
        stepType: "end",
        name: "End Sequence"
      }
    ]
  },
  {
    name: "Birthday Celebration",
    description: "Send personalized birthday wishes with a special offer",
    trigger: "custom", // Triggered by birthday date
    steps: [
      {
        stepOrder: 1,
        stepType: "send_sms",
        name: "Birthday SMS",
        message: `🎉 Happy Birthday, {{firstName}}! 🎉

The entire {{businessName}} family wishes you an amazing day!

As a birthday gift, enjoy a FREE private lesson this month (valued at $75).

Text back to schedule your session!

- {{preferredName}} and the team`
      },
      {
        stepOrder: 2,
        stepType: "send_email",
        name: "Birthday Email with Details",
        subject: "🎂 Happy Birthday {{firstName}}! Here's Your Gift 🎁",
        message: `Happy Birthday {{firstName}}!

We're so grateful to have you as part of the {{businessName}} family!

🎁 YOUR BIRTHDAY GIFT:
One FREE private lesson (30 minutes) with any instructor
Value: $75
Valid for: 30 days

This is your chance to:
• Work on specific techniques
• Get personalized feedback
• Accelerate your progress
• Try a new style or weapon

To schedule your free private lesson:
📧 Reply to this email
📱 Text us at {{dojoPhone}}
📍 Visit us at {{locationAddress}}

Have an incredible birthday!

{{preferredName}}
{{businessName}}`
      },
      {
        stepOrder: 3,
        stepType: "end",
        name: "End Sequence"
      }
    ]
  },
  {
    name: "Trial No-Show Follow-up",
    description: "Re-engage leads who didn't show up for their trial class",
    trigger: "trial_no_show",
    steps: [
      {
        stepOrder: 1,
        stepType: "send_sms",
        name: "Immediate Check-in",
        message: `Hi {{firstName}}, we missed you at your trial class today at {{businessName}}!

Life happens - no worries! Would you like to reschedule?

Text back and we'll find a time that works better for you.

- {{preferredName}}`
      },
      {
        stepOrder: 2,
        stepType: "wait",
        name: "Wait 48 Hours",
        waitMinutes: 2880 // 48 hours
      },
      {
        stepOrder: 3,
        stepType: "send_email",
        name: "Second Chance Email",
        subject: "Let's Reschedule Your FREE Trial at {{businessName}}",
        message: `Hi {{firstName}},

We understand things come up! We'd still love to have you try a class at {{businessName}}.

Your FREE trial class is still available - no expiration!

Here's what makes us different:
✅ Flexible scheduling
✅ Beginner-friendly environment
✅ No pressure, no commitment
✅ Expert instruction

Ready to give it another try?

📱 Text: {{dojoPhone}}
📧 Email: {{dojoEmail}}
📍 Location: {{locationAddress}}

We're here when you're ready!

{{preferredName}}
{{businessName}}`
      },
      {
        stepOrder: 4,
        stepType: "end",
        name: "End Sequence"
      }
    ]
  },
  {
    name: "Membership Renewal Reminder",
    description: "Remind students to renew their membership before it expires",
    trigger: "renewal_due",
    steps: [
      {
        stepOrder: 1,
        stepType: "send_email",
        name: "30-Day Renewal Notice",
        subject: "Your {{businessName}} Membership Renews Soon",
        message: `Hi {{firstName}},

Your membership at {{businessName}} is set to renew in 30 days.

We're so glad you're part of our community! Your dedication and progress have been amazing to watch.

📅 Renewal Date: [Renewal Date]
💳 Payment Method: [Payment Method on File]

Everything will renew automatically - no action needed!

Questions about your membership? Reply to this email or text us at {{dojoPhone}}.

Keep up the great work!

{{preferredName}}
{{businessName}}`
      },
      {
        stepOrder: 2,
        stepType: "wait",
        name: "Wait 23 Days",
        waitMinutes: 33120 // 23 days (7 days before renewal)
      },
      {
        stepOrder: 3,
        stepType: "send_sms",
        name: "7-Day Reminder",
        message: `Hi {{firstName}}! Your {{businessName}} membership renews in 7 days. Everything is set to auto-renew. Questions? Text us! - {{preferredName}}`
      },
      {
        stepOrder: 4,
        stepType: "end",
        name: "End Sequence"
      }
    ]
  }
];

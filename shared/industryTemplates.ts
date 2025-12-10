/**
 * Industry-Specific Automation Templates
 * 
 * Each industry has customized messaging, terminology, and tone.
 * All templates include AI chat links for personalized assistance.
 */

export interface IndustryTemplate {
  industry: string;
  sequences: AutomationSequenceTemplate[];
}

export interface AutomationSequenceTemplate {
  name: string;
  description: string;
  trigger: string;
  steps: AutomationStepTemplate[];
}

export interface AutomationStepTemplate {
  order: number;
  type: 'wait' | 'send_sms' | 'send_email';
  delay_minutes?: number;
  sms_body?: string;
  email_subject?: string;
  email_body?: string;
}

/**
 * MARTIAL ARTS TEMPLATES
 */
const martialArtsTemplates: AutomationSequenceTemplate[] = [
  {
    name: "New Lead Welcome - Martial Arts",
    description: "4-step welcome sequence for new martial arts leads",
    trigger: "lead_created",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Welcome to {{businessName}}! 🥋 Thanks for your interest in martial arts training. We're excited to help you start your journey! Ready to book your FREE intro class? {{bookingLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Welcome to {{businessName}} - Your Martial Arts Journey Starts Here! 🥋",
        email_body: `Hi {{firstName}},

Welcome to {{businessName}}! We're thrilled you're interested in martial arts training.

**Why Train With Us?**
• Expert instructors with years of experience
• Proven curriculum for all skill levels
• Build confidence, discipline, and self-defense skills
• Supportive community atmosphere

**Your Next Step:**
Book your FREE intro class and experience what makes our dojo special: {{bookingLink}}

**Have Questions?**
Don't wait - chat with {{aiName}}, our AI assistant, anytime: {{aiChatLink}}

We can't wait to meet you on the mat!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 1440, // 24 hours
        email_subject: "See What Our Students Are Saying About {{businessName}}",
        email_body: `Hi {{firstName}},

Yesterday we invited you to try a FREE intro class at {{businessName}}. Today, we want you to hear from students just like you who took that first step.

**Student Success Stories:**

"I joined {{businessName}} 6 months ago with zero experience. Now I'm more confident, fit, and focused than ever!" - Sarah M.

"The instructors genuinely care about your progress. This isn't just a gym - it's a family." - Mike T.

"My kids have learned discipline, respect, and self-defense. Best decision we made!" - Jennifer L.

**Ready to Write Your Own Success Story?**
Book your FREE intro class now: {{bookingLink}}

**Questions About Training?**
Chat with {{aiName}} anytime: {{aiChatLink}}

See you on the mat,
{{operatorName}}
{{businessName}}`
      },
      {
        order: 4,
        type: "send_sms",
        delay_minutes: 2880, // 48 hours
        sms_body: "Hi {{firstName}}! {{operatorName}} here from {{businessName}}. I recorded a quick video message for you about our martial arts programs: {{instructorVideoLink}}\n\nChat with {{aiName}} if you have questions: {{aiChatLink}}"
      },
      {
        order: 5,
        type: "send_email",
        delay_minutes: 4320, // 72 hours
        email_subject: "⏰ Limited Time: FREE Uniform with Your First Month",
        email_body: `Hi {{firstName}},

This is your final reminder - we're offering a **LIMITED TIME SPECIAL** for new students:

🎁 **FREE UNIFORM** (Value: $75) when you enroll this week!

This offer expires in 48 hours. Here's what you get:

✅ FREE intro class
✅ FREE uniform with enrollment
✅ Expert instruction from day one
✅ Supportive community atmosphere

**Claim Your Spot:**
Book your intro class now: {{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Don't miss out!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial Class Confirmation - Martial Arts",
    description: "Reminders and follow-up for scheduled trial class",
    trigger: "trial_scheduled",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "✅ Your Intro Class is Confirmed at {{businessName}}!",
        email_body: `Hi {{firstName}},

Your FREE intro class is confirmed!

**Class Details:**
📅 Date: {{trialDate}}
🕐 Time: {{trialTime}}
📍 Location: {{locationAddress}}

**What to Bring:**
• Comfortable workout clothes
• Water bottle
• Positive attitude!

**What to Expect:**
Your instructor will guide you through basic techniques, warm-up exercises, and give you a feel for our training style. No experience necessary!

**Questions Before Class?**
Chat with {{aiName}}: {{aiChatLink}}

See you on the mat!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 2,
        type: "send_sms",
        delay_minutes: -1440, // 24 hours before (negative = before trial_date)
        sms_body: "Reminder: Your intro class at {{businessName}} is tomorrow at {{trialTime}}! 🥋 Bring comfortable clothes & water. See you soon!\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: -120, // 2 hours before
        sms_body: "Your class starts in 2 hours! {{locationAddress}}. Can't wait to meet you! 🥋\n\nRunning late? Text {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 25, // 25 minutes after class
        email_subject: "How Was Your First Class at {{businessName}}?",
        email_body: `Hi {{firstName}},

Thanks for joining us today! We hope you enjoyed your intro class.

**Ready to Continue Your Journey?**
Most students see real progress in just 30 days. Here's what happens next:

✅ Choose your membership plan
✅ Get your uniform and gear
✅ Start training 2-3x per week
✅ Track your progress toward your first belt

**Enroll Today:**
{{enrollmentLink}}

**Questions About Membership?**
Chat with {{aiName}}: {{aiChatLink}}

We'd love to have you as part of our dojo family!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "No-Show Recovery - Martial Arts",
    description: "Re-engage leads who missed their scheduled trial",
    trigger: "trial_no_show",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 60, // 1 hour after
        sms_body: "Hi {{firstName}}, we missed you at class today! Everything okay? We'd love to reschedule your FREE intro class: {{bookingLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 1440, // 24 hours
        email_subject: "Let's Reschedule Your Intro Class at {{businessName}}",
        email_body: `Hi {{firstName}},

We noticed you couldn't make it to your intro class yesterday. No worries - life happens!

**We'd Love to See You:**
Reschedule your FREE intro class at a time that works better: {{bookingLink}}

**Why Give It Another Try?**
• Learn self-defense and build confidence
• Get fit while having fun
• Join a supportive community
• Expert instruction for all levels

**Questions or Concerns?**
Chat with {{aiName}}: {{aiChatLink}}

We're here when you're ready!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 4320, // 3 days
        sms_body: "{{firstName}}, your spot is still available! 🥋 Book your FREE intro class: {{bookingLink}}\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 10080, // 7 days
        email_subject: "Final Reminder: Your FREE Class Awaits at {{businessName}}",
        email_body: `Hi {{firstName}},

This is our final reminder - your FREE intro class is still available, but we want to make sure you're still interested.

**One Last Chance:**
Book your class now: {{bookingLink}}

**Not Sure Yet?**
Chat with {{aiName}} to get all your questions answered: {{aiChatLink}}

If we don't hear from you, we'll assume you're not interested right now. But our door is always open when you're ready to start your martial arts journey!

Best regards,
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial-to-Enrollment - Martial Arts",
    description: "Convert trial attendees into paying members",
    trigger: "trial_attended",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0, // Same day
        email_subject: "Great Job Today at {{businessName}}! Here's Your Next Step 🥋",
        email_body: `Hi {{firstName}},

It was awesome having you in class today! You did great for your first time.

**Your Personalized Training Plan:**
Based on what we covered today, here's what your first month would look like:

**Week 1-2:** Basic stances, blocks, and strikes
**Week 3-4:** Combinations and footwork
**Month 2+:** Sparring fundamentals and belt progression

**Membership Options:**
• **Basic:** 2x/week - $129/month
• **Unlimited:** Train as much as you want - $179/month
• **Family Plan:** Bring the whole family - $299/month

**Enroll Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Let's keep the momentum going!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 2880, // 2 days
        email_subject: "The Benefits of Training at {{businessName}}",
        email_body: `Hi {{firstName}},

Still thinking about joining {{businessName}}? Let me share what makes our program special:

**Physical Benefits:**
✅ Improved fitness and flexibility
✅ Weight loss and muscle tone
✅ Better coordination and balance

**Mental Benefits:**
✅ Increased confidence and self-esteem
✅ Stress relief and mental clarity
✅ Discipline and focus

**Self-Defense Benefits:**
✅ Real-world self-defense skills
✅ Situational awareness
✅ Ability to protect yourself and loved ones

**Community Benefits:**
✅ Supportive training partners
✅ Lifelong friendships
✅ Positive environment for growth

**Ready to Commit?**
{{enrollmentLink}}

**Questions About Training?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 5760, // 4 days
        sms_body: "Hi {{firstName}}! Quick question - what's holding you back from enrolling? Our pricing: Basic $129/mo, Unlimited $179/mo. Enroll: {{enrollmentLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 8640, // 6 days
        email_subject: "⏰ Enrollment Deadline: Join {{businessName}} by Friday",
        email_body: `Hi {{firstName}},

This is your final reminder - we're holding your spot until **Friday at 5pm**.

**Why Enroll Now?**
• Lock in current pricing (rates increase next month)
• Start your journey toward your first belt
• Join our upcoming belt testing cycle
• Get access to members-only events

**Don't Wait:**
{{enrollmentLink}}

**Still Have Questions?**
Chat with {{aiName}} right now: {{aiChatLink}}

After Friday, we'll need to release your spot to the next person on our waitlist.

Let's do this!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "New Student Onboarding - Martial Arts",
    description: "Welcome and orient new members",
    trigger: "enrollment_completed",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "🎉 Welcome to the {{businessName}} Family!",
        email_body: `Hi {{firstName}},

Welcome to {{businessName}}! We're so excited to have you as part of our dojo family.

**Your First 2 Weeks:**

**Week 1:**
• Attend beginner classes (check schedule in app)
• Get fitted for your uniform
• Meet your training partners
• Learn dojo etiquette and traditions

**Week 2:**
• Start learning your first kata/form
• Begin sparring fundamentals
• Set your first belt testing goal
• Join our private Facebook group

**Important Links:**
📱 Download our app: {{appDownloadLink}}
📅 Class schedule: {{scheduleLink}}
👕 Uniform sizing guide: {{uniformGuideLink}}

**Questions?**
Chat with {{aiName}} anytime: {{aiChatLink}}

Let's get started!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080, // 7 days
        email_subject: "How's Your First Week Going? + Referral Rewards!",
        email_body: `Hi {{firstName}},

How was your first week at {{businessName}}? We hope you're loving it!

**Referral Rewards Program:**
Know someone who would love martial arts training? Refer them and you both get rewards!

**You Get:** $50 credit toward your next month
**They Get:** FREE uniform with enrollment

**Share Your Referral Link:**
{{referralLink}}

**Questions About Training?**
Chat with {{aiName}}: {{aiChatLink}}

Keep up the great work!
{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Attendance & Retention - Martial Arts",
    description: "Re-engage students who stop attending",
    trigger: "attendance_dropped",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0, // After 1 week missed
        sms_body: "Hey {{firstName}}! We missed you this week at {{businessName}}. Everything okay? Check the schedule and book your next class: {{scheduleLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080, // After 2 weeks missed
        email_subject: "We Miss You at {{businessName}}! Let's Get You Back on Track",
        email_body: `Hi {{firstName}},

We've noticed you haven't been to class in a couple weeks. Is everything okay?

**Life Gets Busy - We Get It:**
If you're struggling to make it to class, let's find a solution:

• Different class times that fit your schedule better
• Temporary membership freeze (if needed)
• Modified training plan to ease back in

**We're Here to Help:**
Chat with {{aiName}} to discuss options: {{aiChatLink}}

Or call us directly: {{dojoPhone}}

Your dojo family misses you!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 20160, // After 3 weeks missed
        email_subject: "Special Retention Offer: Come Back to {{businessName}}",
        email_body: `Hi {{firstName}},

We really miss seeing you at {{businessName}}. We know life can get in the way of training, so we want to make it easier for you to come back.

**Special Comeback Offer:**
🎁 **50% off your next month** when you return this week
🎁 **Free private lesson** to get you back up to speed
🎁 **Flexible schedule** - train when it works for you

**This Offer Expires in 7 Days:**
{{comebackOfferLink}}

**Let's Talk:**
{{operatorName}} wants to personally speak with you. Chat with {{aiName}} to schedule a call: {{aiChatLink}}

We believe in you and your martial arts journey!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Membership Billing - Martial Arts",
    description: "Handle payment issues and renewals",
    trigger: "payment_failed",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Hi {{firstName}}, your payment for {{businessName}} didn't go through. Please update your card info to avoid interruption: {{billingLink}}\n\nNeed help? {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "⚠️ Payment Issue: Update Your Card at {{businessName}}",
        email_body: `Hi {{firstName}},

We tried to process your membership payment but it didn't go through.

**Action Required:**
Please update your payment information within 48 hours to avoid suspension of your membership: {{billingLink}}

**Common Reasons:**
• Expired credit card
• Insufficient funds
• Card blocked by bank

**Need Help?**
Chat with {{aiName}}: {{aiChatLink}}
Or call us: {{dojoPhone}}

We want to keep you training!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 2880, // 48 hours
        sms_body: "Final reminder: Update your payment info to keep training at {{businessName}}: {{billingLink}}\n\nQuestions? {{aiChatLink}}"
      }
    ]
  },
  {
    name: "Student Engagement - Martial Arts",
    description: "Monthly newsletter and community updates",
    trigger: "monthly_newsletter",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "{{businessName}} Monthly Newsletter - {{currentMonth}}",
        email_body: `Hi {{firstName}},

Here's what's happening at {{businessName}} this month!

**Upcoming Events:**
🥋 Belt Testing: {{beltTestDate}}
🎉 Student Appreciation Night: {{eventDate}}
🏆 Tournament: {{tournamentDate}}

**Student Spotlight:**
Congratulations to {{spotlightStudent}} for earning their {{beltColor}} belt!

**Training Tip of the Month:**
{{trainingTip}}

**Important Reminders:**
• Check the schedule for holiday closures
• Bring a friend week starts {{friendWeekDate}}
• New merchandise available in the pro shop

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Keep training hard!
{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Referrals System - Martial Arts",
    description: "Encourage referrals after attendance milestone",
    trigger: "attendance_milestone",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "🎉 Congrats on {{attendanceCount}} Classes! Share the Love",
        email_body: `Hi {{firstName}},

Congratulations! You've attended {{attendanceCount}} classes at {{businessName}}. That's an amazing achievement!

**Share Your Experience:**
Know someone who would benefit from martial arts training? Refer them and you both win!

**Referral Rewards:**
• **You get:** $50 credit per referral
• **They get:** FREE uniform with enrollment
• **Unlimited referrals:** The more you refer, the more you earn!

**Your Personal Referral Link:**
{{referralLink}}

**Share on Social Media:**
[Facebook] [Instagram] [Twitter]

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Thanks for being an awesome part of our dojo!
{{operatorName}}
{{businessName}}`
      }
    ]
  }
];

/**
 * YOGA STUDIO TEMPLATES
 */
const yogaTemplates: AutomationSequenceTemplate[] = [
  {
    name: "New Lead Welcome - Yoga",
    description: "4-step welcome sequence for new yoga leads",
    trigger: "lead_created",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Namaste! 🧘‍♀️ Welcome to {{businessName}}. We're honored you're interested in beginning your yoga journey with us. Book your FREE intro class: {{bookingLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Welcome to {{businessName}} - Begin Your Yoga Journey 🧘‍♀️",
        email_body: `Namaste {{firstName}},

Welcome to {{businessName}}! We're so grateful you've chosen to explore yoga with us.

**Why Practice With Us?**
• Experienced, certified instructors
• Classes for all levels (beginner to advanced)
• Mindful, supportive community
• Beautiful, peaceful studio space

**Your Next Step:**
Book your FREE intro class and discover the transformative power of yoga: {{bookingLink}}

**Have Questions?**
Chat with {{aiName}}, our AI assistant: {{aiChatLink}}

We look forward to practicing with you!

With gratitude,
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 1440, // 24 hours
        email_subject: "Hear From Our Yoga Community at {{businessName}}",
        email_body: `Hi {{firstName}},

Yesterday we invited you to try yoga at {{businessName}}. Today, hear from students who've experienced the transformation:

**Student Stories:**

"Yoga at {{businessName}} has changed my life. I'm calmer, more flexible, and sleep better than ever." - Lisa K.

"The instructors create such a welcoming space. I was nervous as a beginner, but they made me feel right at home." - David R.

"I've tried other studios, but {{businessName}} feels like family. The community here is special." - Amanda S.

**Ready to Experience It Yourself?**
Book your FREE intro class: {{bookingLink}}

**Questions About Yoga?**
Chat with {{aiName}}: {{aiChatLink}}

Namaste,
{{operatorName}}
{{businessName}}`
      },
      {
        order: 4,
        type: "send_sms",
        delay_minutes: 2880, // 48 hours
        sms_body: "Hi {{firstName}}! {{operatorName}} here. I recorded a personal welcome message about our yoga classes: {{instructorVideoLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 5,
        type: "send_email",
        delay_minutes: 4320, // 72 hours
        email_subject: "⏰ Limited Offer: FREE Yoga Mat with Your First Month",
        email_body: `Hi {{firstName}},

This is your final reminder - we're offering a special gift for new students:

🎁 **FREE YOGA MAT** (Value: $60) when you join this week!

This offer expires in 48 hours. Here's what you get:

✅ FREE intro class
✅ FREE yoga mat with membership
✅ Unlimited classes for 30 days
✅ Welcoming community

**Claim Your Spot:**
{{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Namaste,
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial Class Confirmation - Yoga",
    description: "Reminders and follow-up for scheduled trial",
    trigger: "trial_scheduled",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "✅ Your Intro Class is Confirmed at {{businessName}}!",
        email_body: `Namaste {{firstName}},

Your FREE intro class is confirmed!

**Class Details:**
📅 Date: {{trialDate}}
🕐 Time: {{trialTime}}
📍 Location: {{locationAddress}}

**What to Bring:**
• Comfortable, breathable clothing
• Water bottle
• Yoga mat (or borrow one of ours)
• Open mind and heart

**What to Expect:**
We'll guide you through gentle poses, breathing techniques, and relaxation. Perfect for beginners!

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

See you on the mat!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 2,
        type: "send_sms",
        delay_minutes: -1440, // 24 hours before
        sms_body: "Reminder: Your yoga class at {{businessName}} is tomorrow at {{trialTime}}! 🧘‍♀️ Bring comfortable clothes & water. Namaste!\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: -120, // 2 hours before
        sms_body: "Your class starts in 2 hours! {{locationAddress}}. We're excited to practice with you! 🧘‍♀️\n\nRunning late? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 25,
        email_subject: "How Was Your First Class at {{businessName}}?",
        email_body: `Namaste {{firstName}},

Thank you for joining us today! We hope you felt the peace and energy of our yoga community.

**Ready to Continue Your Practice?**
Consistency is key in yoga. Here's what happens when you join:

✅ Unlimited classes each month
✅ Access to all class styles (Vinyasa, Hatha, Yin, etc.)
✅ Workshops and special events
✅ Supportive community

**Join Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Namaste,
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "No-Show Recovery - Yoga",
    description: "Re-engage leads who missed their trial",
    trigger: "trial_no_show",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 60,
        sms_body: "Hi {{firstName}}, we missed you at class today! Everything okay? We'd love to reschedule your FREE intro class: {{bookingLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 1440,
        email_subject: "Let's Reschedule Your Yoga Class at {{businessName}}",
        email_body: `Namaste {{firstName}},

We noticed you couldn't make it to class yesterday. No worries - we understand life gets busy!

**We'd Love to See You:**
Reschedule your FREE intro class: {{bookingLink}}

**Why Try Yoga?**
• Reduce stress and anxiety
• Improve flexibility and strength
• Better sleep and mental clarity
• Connect with a supportive community

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

We're here when you're ready!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 4320,
        sms_body: "{{firstName}}, your spot is still available! 🧘‍♀️ Book your FREE yoga class: {{bookingLink}}\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "Final Reminder: Your FREE Yoga Class Awaits",
        email_body: `Namaste {{firstName}},

This is our final reminder - your FREE intro class is still available.

**One Last Chance:**
{{bookingLink}}

**Not Sure Yet?**
Chat with {{aiName}}: {{aiChatLink}}

If we don't hear from you, we'll assume you're not ready. But our studio door is always open when you are!

With gratitude,
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial-to-Enrollment - Yoga",
    description: "Convert trial attendees into members",
    trigger: "trial_attended",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Beautiful Practice Today at {{businessName}}! 🧘‍♀️",
        email_body: `Namaste {{firstName}},

Thank you for joining us today! You did wonderfully in class.

**Your Yoga Journey:**
Here's what your practice could look like:

**Month 1:** Build foundation, learn basic poses
**Month 2:** Deepen practice, try different styles
**Month 3+:** Advanced poses, meditation, workshops

**Membership Options:**
• **Unlimited:** All classes, anytime - $139/month
• **10-Class Pack:** Flexible schedule - $120
• **Drop-In:** Single class - $18

**Join Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Namaste,
{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 2880,
        email_subject: "The Benefits of Regular Yoga Practice",
        email_body: `Hi {{firstName}},

Still considering joining {{businessName}}? Here's what regular yoga practice can do for you:

**Physical Benefits:**
✅ Increased flexibility and strength
✅ Better posture and balance
✅ Pain relief (back, joints, etc.)

**Mental Benefits:**
✅ Reduced stress and anxiety
✅ Improved focus and clarity
✅ Better sleep quality

**Emotional Benefits:**
✅ Greater self-awareness
✅ Emotional balance
✅ Inner peace and calm

**Community Benefits:**
✅ Supportive practice partners
✅ Lifelong friendships
✅ Sense of belonging

**Ready to Commit?**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Namaste,
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 5760,
        sms_body: "Hi {{firstName}}! What's holding you back from joining? Our unlimited membership is $139/mo. Enroll: {{enrollmentLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 8640,
        email_subject: "⏰ Enrollment Deadline: Join {{businessName}} by Friday",
        email_body: `Namaste {{firstName}},

We're holding your spot until **Friday at 5pm**.

**Why Join Now?**
• Lock in current pricing
• Access to all class styles
• Join our upcoming workshop series
• Connect with our community

**Don't Wait:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

After Friday, we'll release your spot.

With gratitude,
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "New Student Onboarding - Yoga",
    description: "Welcome and orient new members",
    trigger: "enrollment_completed",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "🙏 Welcome to the {{businessName}} Community!",
        email_body: `Namaste {{firstName}},

Welcome to {{businessName}}! We're honored to have you in our yoga community.

**Your First 2 Weeks:**

**Week 1:**
• Try different class styles (Vinyasa, Hatha, Yin)
• Meet your instructors
• Explore our studio amenities
• Join our private Facebook group

**Week 2:**
• Establish your regular practice schedule
• Set personal yoga goals
• Attend a workshop or special event
• Bring a friend to class (free!)

**Important Links:**
📱 Download our app: {{appDownloadLink}}
📅 Class schedule: {{scheduleLink}}
🛍️ Studio shop: {{shopLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Namaste,
{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "How's Your First Week? + Referral Rewards!",
        email_body: `Namaste {{firstName}},

How was your first week at {{businessName}}? We hope you're loving your practice!

**Referral Rewards:**
Know someone who would benefit from yoga? Share the gift!

**You Get:** $40 credit per referral
**They Get:** FREE class pass

**Your Referral Link:**
{{referralLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Namaste,
{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Attendance & Retention - Yoga",
    description: "Re-engage students who stop attending",
    trigger: "attendance_dropped",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Namaste {{firstName}}! We missed you this week at {{businessName}}. Everything okay? Check the schedule: {{scheduleLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "We Miss You at {{businessName}}! Let's Reconnect",
        email_body: `Namaste {{firstName}},

We've noticed you haven't been to class in a couple weeks. Is everything okay?

**Life Gets Busy:**
If you're struggling to maintain your practice, let's find a solution:

• Different class times
• Membership freeze option
• Gentle classes to ease back in

**We're Here:**
Chat with {{aiName}}: {{aiChatLink}}
Or call: {{dojoPhone}}

Your yoga community misses you!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 20160,
        email_subject: "Special Offer: Come Back to {{businessName}}",
        email_body: `Namaste {{firstName}},

We miss seeing you at {{businessName}}. Let's make it easy to return:

**Comeback Offer:**
🎁 **50% off your next month**
🎁 **Free private session** to get back into practice
🎁 **Flexible schedule**

**Expires in 7 Days:**
{{comebackOfferLink}}

**Let's Talk:**
Chat with {{aiName}}: {{aiChatLink}}

We believe in your practice!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Membership Billing - Yoga",
    description: "Handle payment issues",
    trigger: "payment_failed",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Hi {{firstName}}, your payment for {{businessName}} didn't go through. Please update your card: {{billingLink}}\n\nNeed help? {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "⚠️ Payment Issue: Update Your Card",
        email_body: `Namaste {{firstName}},

Your membership payment didn't process successfully.

**Action Required:**
Update your payment info within 48 hours: {{billingLink}}

**Need Help?**
Chat with {{aiName}}: {{aiChatLink}}
Or call: {{dojoPhone}}

Namaste,
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 2880,
        sms_body: "Final reminder: Update payment info to continue your practice at {{businessName}}: {{billingLink}}\n\nQuestions? {{aiChatLink}}"
      }
    ]
  },
  {
    name: "Student Engagement - Yoga",
    description: "Monthly newsletter",
    trigger: "monthly_newsletter",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "{{businessName}} Monthly Newsletter - {{currentMonth}}",
        email_body: `Namaste {{firstName}},

Here's what's happening at {{businessName}} this month!

**Upcoming Events:**
🧘‍♀️ Workshop: {{workshopTopic}} - {{workshopDate}}
🎉 Community Gathering: {{eventDate}}
🌟 Special Guest Teacher: {{guestTeacher}}

**Student Spotlight:**
Congratulations to {{spotlightStudent}} for their dedication to practice!

**Yoga Tip:**
{{yogaTip}}

**Reminders:**
• Check schedule for holiday hours
• Bring a friend week: {{friendWeekDate}}
• New retail items in studio

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Namaste,
{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Referrals System - Yoga",
    description: "Encourage referrals",
    trigger: "attendance_milestone",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "🙏 Congrats on {{attendanceCount}} Classes! Share the Gift",
        email_body: `Namaste {{firstName}},

You've attended {{attendanceCount}} classes! That's beautiful dedication.

**Share the Gift of Yoga:**
**You get:** $40 credit per referral
**They get:** FREE class pass

**Your Referral Link:**
{{referralLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

With gratitude,
{{operatorName}}
{{businessName}}`
      }
    ]
  }
];

/**
 * FITNESS GYM TEMPLATES
 */
const fitnessTemplates: AutomationSequenceTemplate[] = [
  {
    name: "New Lead Welcome - Fitness",
    description: "4-step welcome sequence for new gym leads",
    trigger: "lead_created",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Welcome to {{businessName}}! 💪 Ready to crush your fitness goals? Book your FREE gym tour & workout: {{bookingLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Welcome to {{businessName}} - Let's Reach Your Goals! 💪",
        email_body: `Hey {{firstName}},

Welcome to {{businessName}}! We're pumped you're ready to start your fitness journey.

**Why Train With Us?**
• State-of-the-art equipment
• Expert personal trainers
• Group fitness classes included
• 24/7 access (select memberships)

**Your Next Step:**
Book your FREE gym tour and trial workout: {{bookingLink}}

**Have Questions?**
Chat with {{aiName}}, our AI assistant: {{aiChatLink}}

Let's get started!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 1440,
        email_subject: "See What Our Members Are Achieving at {{businessName}}",
        email_body: `Hey {{firstName}},

Yesterday we invited you for a FREE gym tour. Today, check out what our members are saying:

**Member Success Stories:**

"I've lost 30 pounds in 4 months at {{businessName}}. The trainers and community keep me motivated!" - Mike T.

"Best gym I've ever joined. Clean, modern equipment and the staff actually cares about your progress." - Sarah K.

"The group classes are amazing! I never thought I'd enjoy working out this much." - James L.

**Ready to Start Your Transformation?**
Book your tour: {{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Let's go!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 4,
        type: "send_sms",
        delay_minutes: 2880,
        sms_body: "Hey {{firstName}}! {{operatorName}} here. I recorded a quick gym tour video for you: {{instructorVideoLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 5,
        type: "send_email",
        delay_minutes: 4320,
        email_subject: "⏰ Limited Time: No Enrollment Fee + FREE Month!",
        email_body: `Hey {{firstName}},

Final reminder - we're running a **LIMITED TIME SPECIAL**:

🎁 **$0 ENROLLMENT FEE** (Save $99)
🎁 **FIRST MONTH FREE** with 12-month commitment

This offer expires in 48 hours!

**What You Get:**
✅ Unlimited gym access
✅ All group fitness classes
✅ Free fitness assessment
✅ Personal training discounts

**Claim Your Spot:**
{{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Don't miss out!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial Visit Confirmation - Fitness",
    description: "Reminders for scheduled gym tour",
    trigger: "trial_scheduled",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "✅ Your Gym Tour is Confirmed at {{businessName}}!",
        email_body: `Hey {{firstName}},

Your FREE gym tour and trial workout is confirmed!

**Visit Details:**
📅 Date: {{trialDate}}
🕐 Time: {{trialTime}}
📍 Location: {{locationAddress}}

**What to Bring:**
• Workout clothes and sneakers
• Water bottle
• Towel
• Photo ID

**What to Expect:**
We'll show you our facility, equipment, and classes. Then you'll get a free trial workout with one of our trainers!

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

See you soon!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 2,
        type: "send_sms",
        delay_minutes: -1440,
        sms_body: "Reminder: Your gym tour at {{businessName}} is tomorrow at {{trialTime}}! 💪 Bring workout clothes & water. See you soon!\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: -120,
        sms_body: "Your gym tour starts in 2 hours! {{locationAddress}}. Can't wait to show you around! 💪\n\nRunning late? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 25,
        email_subject: "How Was Your Visit to {{businessName}}?",
        email_body: `Hey {{firstName}},

Thanks for visiting {{businessName}} today! We hope you loved what you saw.

**Ready to Start Training?**
Most members see results in the first 30 days. Here's what happens next:

✅ Choose your membership plan
✅ Get your access key card
✅ Schedule your free fitness assessment
✅ Start crushing your goals!

**Join Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Let's do this!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "No-Show Recovery - Fitness",
    description: "Re-engage leads who missed tour",
    trigger: "trial_no_show",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 60,
        sms_body: "Hey {{firstName}}, we missed you today! Everything okay? Let's reschedule your FREE gym tour: {{bookingLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 1440,
        email_subject: "Let's Reschedule Your Gym Tour at {{businessName}}",
        email_body: `Hey {{firstName}},

We noticed you couldn't make it yesterday. No problem - life happens!

**Let's Reschedule:**
{{bookingLink}}

**Why Visit {{businessName}}?**
• Modern equipment and facilities
• Expert trainers and staff
• Supportive community
• Results-driven programs

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

We're here when you're ready!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 4320,
        sms_body: "{{firstName}}, your FREE gym tour is still available! 💪 Book now: {{bookingLink}}\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "Final Reminder: Your FREE Gym Tour Awaits",
        email_body: `Hey {{firstName}},

This is our final reminder - your FREE gym tour is still available.

**One Last Chance:**
{{bookingLink}}

**Not Sure Yet?**
Chat with {{aiName}}: {{aiChatLink}}

If we don't hear from you, we'll assume you're not interested. But we're here whenever you're ready!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial-to-Enrollment - Fitness",
    description: "Convert visitors into members",
    trigger: "trial_attended",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Great Meeting You at {{businessName}}! 💪",
        email_body: `Hey {{firstName}},

It was awesome showing you around {{businessName}} today!

**Your Fitness Plan:**
Based on your goals, here's what we recommend:

**Month 1:** Build foundation, establish routine
**Month 2:** Increase intensity, track progress
**Month 3+:** Advanced training, body transformation

**Membership Options:**
• **Basic:** Gym access only - $29/month
• **Plus:** Gym + classes - $49/month
• **Premium:** Gym + classes + PT sessions - $99/month

**Join Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Let's get started!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 2880,
        email_subject: "The Benefits of Training at {{businessName}}",
        email_body: `Hey {{firstName}},

Still thinking about joining? Here's what makes {{businessName}} special:

**Facility Benefits:**
✅ Modern, clean equipment
✅ Spacious workout areas
✅ Locker rooms and showers
✅ Free parking

**Training Benefits:**
✅ Expert personal trainers
✅ Group fitness classes
✅ Customized workout plans
✅ Progress tracking

**Community Benefits:**
✅ Supportive members
✅ Accountability partners
✅ Social events
✅ Transformation challenges

**Ready to Commit?**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 5760,
        sms_body: "Hey {{firstName}}! What's holding you back? Our memberships start at just $29/mo. Join: {{enrollmentLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 8640,
        email_subject: "⏰ Enrollment Deadline: Join by Friday",
        email_body: `Hey {{firstName}},

We're holding your spot until **Friday at 5pm**.

**Why Join Now?**
• Lock in current rates (prices increase next month)
• $0 enrollment fee this week only
• Join our transformation challenge
• Get your free fitness assessment

**Don't Wait:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

After Friday, we'll release your spot!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "New Member Onboarding - Fitness",
    description: "Welcome new members",
    trigger: "enrollment_completed",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "🎉 Welcome to {{businessName}}!",
        email_body: `Hey {{firstName}},

Welcome to the {{businessName}} family! Let's get you started right.

**Your First 2 Weeks:**

**Week 1:**
• Pick up your access key card
• Schedule your free fitness assessment
• Download our mobile app
• Try 3 different group classes

**Week 2:**
• Meet with a trainer for workout plan
• Set your 30/60/90 day goals
• Join our private Facebook group
• Bring a friend for free!

**Important Links:**
📱 App download: {{appDownloadLink}}
📅 Class schedule: {{scheduleLink}}
💪 Workout plans: {{workoutPlansLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Let's crush it!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "How's Your First Week? + Referral Rewards!",
        email_body: `Hey {{firstName}},

How was your first week at {{businessName}}?

**Bring Your Friends:**
**You get:** 1 month free per referral
**They get:** $0 enrollment fee

**Your Referral Link:**
{{referralLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Keep pushing!
{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Attendance & Retention - Fitness",
    description: "Re-engage inactive members",
    trigger: "attendance_dropped",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Hey {{firstName}}! We missed you this week at {{businessName}}. Everything okay? Check the schedule: {{scheduleLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "We Miss You at {{businessName}}!",
        email_body: `Hey {{firstName}},

We haven't seen you in a couple weeks. Is everything okay?

**Let's Get You Back:**
• Different class times
• Modified workout plan
• Personal training session
• Membership freeze option

**We're Here:**
Chat with {{aiName}}: {{aiChatLink}}
Or call: {{dojoPhone}}

Your gym family misses you!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 20160,
        email_subject: "Comeback Offer: Return to {{businessName}}",
        email_body: `Hey {{firstName}},

We miss you at {{businessName}}! Let's make it easy to return:

**Special Offer:**
🎁 **50% off next month**
🎁 **Free PT session**
🎁 **New workout plan**

**Expires in 7 Days:**
{{comebackOfferLink}}

**Let's Talk:**
Chat with {{aiName}}: {{aiChatLink}}

We believe in you!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Membership Billing - Fitness",
    description: "Handle payment issues",
    trigger: "payment_failed",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Hey {{firstName}}, your payment for {{businessName}} didn't go through. Update your card: {{billingLink}}\n\nNeed help? {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "⚠️ Payment Issue: Update Your Card",
        email_body: `Hey {{firstName}},

Your membership payment didn't process.

**Action Required:**
Update payment info within 48 hours: {{billingLink}}

**Need Help?**
Chat with {{aiName}}: {{aiChatLink}}
Or call: {{dojoPhone}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 2880,
        sms_body: "Final reminder: Update payment to keep your membership at {{businessName}}: {{billingLink}}\n\nQuestions? {{aiChatLink}}"
      }
    ]
  },
  {
    name: "Member Engagement - Fitness",
    description: "Monthly newsletter",
    trigger: "monthly_newsletter",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "{{businessName}} Monthly Newsletter - {{currentMonth}}",
        email_body: `Hey {{firstName}},

Here's what's happening at {{businessName}} this month!

**Upcoming Events:**
💪 Transformation Challenge: {{challengeDate}}
🎉 Member Appreciation Day: {{eventDate}}
🏆 Fitness Competition: {{compDate}}

**Member Spotlight:**
Congrats to {{spotlightStudent}} for losing {{weightLost}} pounds!

**Fitness Tip:**
{{fitnessTip}}

**Reminders:**
• New class schedule starts {{scheduleDate}}
• Bring a friend week: {{friendWeekDate}}
• Pro shop sale: {{saleDate}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Keep crushing it!
{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Referrals System - Fitness",
    description: "Encourage referrals",
    trigger: "attendance_milestone",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "🎉 {{attendanceCount}} Workouts Complete! Share the Gains",
        email_body: `Hey {{firstName}},

You've completed {{attendanceCount}} workouts! That's incredible dedication!

**Refer Your Friends:**
**You get:** 1 month free per referral
**They get:** $0 enrollment fee

**Your Referral Link:**
{{referralLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

Keep it up!
{{operatorName}}
{{businessName}}`
      }
    ]
  }
];

/**
 * PILATES/BARRE TEMPLATES
 */
const pilatesTemplates: AutomationSequenceTemplate[] = [
  {
    name: "New Lead Welcome - Pilates",
    description: "4-step welcome sequence for new leads",
    trigger: "lead_created",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Welcome to {{businessName}}! ✨ Ready to transform your body with Pilates? Book your FREE intro class: {{bookingLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Welcome to {{businessName}} - Transform Your Body! ✨",
        email_body: `Hi {{firstName}},

Welcome to {{businessName}}! We're thrilled you're interested in Pilates.

**Why Train With Us?**
• Certified Pilates instructors
• Small class sizes for personalized attention
• Reformer and mat classes
• Beautiful, welcoming studio

**Your Next Step:**
Book your FREE intro class: {{bookingLink}}

**Have Questions?**
Chat with {{aiName}}: {{aiChatLink}}

We can't wait to meet you!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 1440,
        email_subject: "Hear From Our Pilates Community",
        email_body: `Hi {{firstName}},

Yesterday we invited you to try Pilates. Today, hear from our students:

**Student Stories:**

"I've been doing Pilates at {{businessName}} for 6 months and my posture and core strength have completely transformed!" - Emily R.

"The instructors are amazing. They really focus on proper form and helping you progress safely." - Rachel M.

"Best decision I made for my body. I feel stronger and more toned than ever!" - Lisa K.

**Ready to Start?**
Book your FREE class: {{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 4,
        type: "send_sms",
        delay_minutes: 2880,
        sms_body: "Hi {{firstName}}! {{operatorName}} here. I recorded a studio tour for you: {{instructorVideoLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 5,
        type: "send_email",
        delay_minutes: 4320,
        email_subject: "⏰ Limited Offer: FREE Grip Socks with First Month!",
        email_body: `Hi {{firstName}},

Final reminder - special offer for new students:

🎁 **FREE GRIP SOCKS** (Value: $25) when you join this week!

Expires in 48 hours!

✅ FREE intro class
✅ FREE grip socks
✅ Small class sizes
✅ Expert instruction

**Claim Your Spot:**
{{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial Class Confirmation - Pilates",
    description: "Reminders for scheduled trial",
    trigger: "trial_scheduled",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "✅ Your Intro Class is Confirmed!",
        email_body: `Hi {{firstName}},

Your FREE intro class is confirmed!

**Class Details:**
📅 Date: {{trialDate}}
🕐 Time: {{trialTime}}
📍 Location: {{locationAddress}}

**What to Bring:**
• Comfortable, form-fitting workout clothes
• Water bottle
• Grip socks (or borrow ours)
• Hair tie (if needed)

**What to Expect:**
We'll introduce you to Pilates fundamentals, proper breathing, and basic movements. Perfect for beginners!

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

See you soon!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 2,
        type: "send_sms",
        delay_minutes: -1440,
        sms_body: "Reminder: Your Pilates class at {{businessName}} is tomorrow at {{trialTime}}! ✨ Bring comfortable clothes. See you soon!\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: -120,
        sms_body: "Your class starts in 2 hours! {{locationAddress}}. We're excited to meet you! ✨\n\nRunning late? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 25,
        email_subject: "How Was Your First Class?",
        email_body: `Hi {{firstName}},

Thank you for joining us today! We hope you felt the Pilates difference.

**Ready to Continue?**
Consistency is key. Here's what happens when you join:

✅ Unlimited classes each month
✅ Reformer and mat options
✅ Progress tracking
✅ Supportive community

**Join Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "No-Show Recovery - Pilates",
    description: "Re-engage missed trials",
    trigger: "trial_no_show",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 60,
        sms_body: "Hi {{firstName}}, we missed you today! Everything okay? Reschedule your FREE class: {{bookingLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 1440,
        email_subject: "Let's Reschedule Your Pilates Class",
        email_body: `Hi {{firstName}},

We noticed you couldn't make it yesterday. No worries!

**Reschedule:**
{{bookingLink}}

**Why Try Pilates?**
• Improve posture and flexibility
• Build core strength
• Low-impact, joint-friendly
• Supportive community

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

We're here when ready!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 4320,
        sms_body: "{{firstName}}, your spot is still available! ✨ Book your FREE Pilates class: {{bookingLink}}\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "Final Reminder: Your FREE Class Awaits",
        email_body: `Hi {{firstName}},

Final reminder - your FREE class is still available.

**One Last Chance:**
{{bookingLink}}

**Not Sure?**
Chat with {{aiName}}: {{aiChatLink}}

We're here when you're ready!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial-to-Enrollment - Pilates",
    description: "Convert trials to members",
    trigger: "trial_attended",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Beautiful Work Today! ✨",
        email_body: `Hi {{firstName}},

You did wonderfully in class today!

**Your Pilates Journey:**

**Month 1:** Foundation and form
**Month 2:** Strength building
**Month 3+:** Advanced movements

**Membership Options:**
• **Unlimited:** All classes - $159/month
• **8-Class Pack:** Flexible - $140
• **Drop-In:** Single class - $25

**Join Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 2880,
        email_subject: "The Benefits of Regular Pilates",
        email_body: `Hi {{firstName}},

Still considering? Here's what Pilates can do:

**Physical Benefits:**
✅ Improved posture
✅ Core strength
✅ Flexibility
✅ Muscle tone

**Mental Benefits:**
✅ Mind-body connection
✅ Stress relief
✅ Focus and concentration

**Long-term Benefits:**
✅ Injury prevention
✅ Better balance
✅ Functional fitness

**Ready?**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 5760,
        sms_body: "Hi {{firstName}}! What's holding you back? Unlimited Pilates: $159/mo. Enroll: {{enrollmentLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 8640,
        email_subject: "⏰ Enrollment Deadline: Friday",
        email_body: `Hi {{firstName}},

We're holding your spot until **Friday at 5pm**.

**Why Join Now?**
• Lock in current pricing
• Access all class styles
• Join upcoming workshop
• Connect with community

**Don't Wait:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "New Student Onboarding - Pilates",
    description: "Welcome new members",
    trigger: "enrollment_completed",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "✨ Welcome to {{businessName}}!",
        email_body: `Hi {{firstName}},

Welcome to {{businessName}}!

**Your First 2 Weeks:**

**Week 1:**
• Try mat and reformer classes
• Meet instructors
• Get grip socks
• Join Facebook group

**Week 2:**
• Set personal goals
• Try different class times
• Attend workshop
• Bring a friend!

**Important Links:**
📱 App: {{appDownloadLink}}
📅 Schedule: {{scheduleLink}}
🛍️ Shop: {{shopLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "How's Your First Week? + Referrals!",
        email_body: `Hi {{firstName}},

How was week one?

**Referral Rewards:**
**You get:** $50 credit
**They get:** FREE class

**Your Link:**
{{referralLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Attendance & Retention - Pilates",
    description: "Re-engage inactive students",
    trigger: "attendance_dropped",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Hi {{firstName}}! We missed you this week. Everything okay? Check schedule: {{scheduleLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "We Miss You!",
        email_body: `Hi {{firstName}},

We haven't seen you in a couple weeks. Everything okay?

**Let's Reconnect:**
• Different class times
• Membership freeze
• Gentle classes

**We're Here:**
Chat with {{aiName}}: {{aiChatLink}}
Or call: {{dojoPhone}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 20160,
        email_subject: "Comeback Offer",
        email_body: `Hi {{firstName}},

We miss you! Let's make it easy to return:

**Special Offer:**
🎁 **50% off next month**
🎁 **Free private session**

**Expires in 7 Days:**
{{comebackOfferLink}}

**Let's Talk:**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Membership Billing - Pilates",
    description: "Handle payment issues",
    trigger: "payment_failed",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Hi {{firstName}}, payment didn't go through. Update card: {{billingLink}}\n\nNeed help? {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "⚠️ Payment Issue",
        email_body: `Hi {{firstName}},

Payment didn't process.

**Action Required:**
Update within 48 hours: {{billingLink}}

**Need Help?**
Chat with {{aiName}}: {{aiChatLink}}
Or call: {{dojoPhone}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 2880,
        sms_body: "Final reminder: Update payment: {{billingLink}}\n\nQuestions? {{aiChatLink}}"
      }
    ]
  },
  {
    name: "Student Engagement - Pilates",
    description: "Monthly newsletter",
    trigger: "monthly_newsletter",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "{{businessName}} Newsletter - {{currentMonth}}",
        email_body: `Hi {{firstName}},

Here's what's happening this month!

**Upcoming:**
✨ Workshop: {{workshopDate}}
🎉 Event: {{eventDate}}
🌟 Guest: {{guestInstructor}}

**Spotlight:**
Congrats to {{spotlightStudent}}!

**Tip:**
{{pilatesTip}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Referrals System - Pilates",
    description: "Encourage referrals",
    trigger: "attendance_milestone",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "✨ {{attendanceCount}} Classes! Share the Love",
        email_body: `Hi {{firstName}},

{{attendanceCount}} classes completed! Amazing!

**Refer Friends:**
**You get:** $50 credit
**They get:** FREE class

**Your Link:**
{{referralLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      }
    ]
  }
];

/**
 * OTHER STUDIO TEMPLATES (Generic)
 */
const otherStudioTemplates: AutomationSequenceTemplate[] = [
  {
    name: "New Lead Welcome - Studio",
    description: "4-step welcome sequence",
    trigger: "lead_created",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Welcome to {{businessName}}! We're excited you're interested in our classes. Book your FREE intro class: {{bookingLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Welcome to {{businessName}}!",
        email_body: `Hi {{firstName}},

Welcome to {{businessName}}! We're thrilled you're interested in our classes.

**Why Train With Us?**
• Expert instructors
• Welcoming community
• Classes for all levels
• Beautiful studio space

**Your Next Step:**
Book your FREE intro class: {{bookingLink}}

**Have Questions?**
Chat with {{aiName}}: {{aiChatLink}}

We can't wait to meet you!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 1440,
        email_subject: "Hear From Our Community",
        email_body: `Hi {{firstName}},

Yesterday we invited you to try a class. Today, hear from our students:

**Student Stories:**

"{{businessName}} has been life-changing. The instructors are amazing and the community is so supportive!" - Member

"I was nervous to try something new, but everyone made me feel welcome from day one." - Member

"Best decision I made. I feel stronger and more confident!" - Member

**Ready to Start?**
Book your FREE class: {{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 4,
        type: "send_sms",
        delay_minutes: 2880,
        sms_body: "Hi {{firstName}}! {{operatorName}} here. I recorded a message for you: {{instructorVideoLink}}\n\nQuestions? Chat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 5,
        type: "send_email",
        delay_minutes: 4320,
        email_subject: "⏰ Limited Offer: Special New Student Discount!",
        email_body: `Hi {{firstName}},

Final reminder - special offer for new students!

🎁 **SPECIAL DISCOUNT** when you join this week!

Expires in 48 hours!

✅ FREE intro class
✅ New student discount
✅ Welcoming community
✅ Expert instruction

**Claim Your Spot:**
{{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial Class Confirmation - Studio",
    description: "Reminders for scheduled trial",
    trigger: "trial_scheduled",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "✅ Your Intro Class is Confirmed!",
        email_body: `Hi {{firstName}},

Your FREE intro class is confirmed!

**Class Details:**
📅 Date: {{trialDate}}
🕐 Time: {{trialTime}}
📍 Location: {{locationAddress}}

**What to Bring:**
• Comfortable workout clothes
• Water bottle
• Positive attitude!

**What to Expect:**
We'll introduce you to our training style and make sure you feel comfortable and welcome!

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

See you soon!
{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      },
      {
        order: 2,
        type: "send_sms",
        delay_minutes: -1440,
        sms_body: "Reminder: Your class at {{businessName}} is tomorrow at {{trialTime}}! Bring comfortable clothes. See you soon!\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: -120,
        sms_body: "Your class starts in 2 hours! {{locationAddress}}. Can't wait to meet you!\n\nRunning late? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 25,
        email_subject: "How Was Your First Class?",
        email_body: `Hi {{firstName}},

Thank you for joining us today! We hope you enjoyed your first class.

**Ready to Continue?**
Here's what happens when you join:

✅ Unlimited classes
✅ All class styles
✅ Community events
✅ Progress tracking

**Join Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "No-Show Recovery - Studio",
    description: "Re-engage missed trials",
    trigger: "trial_no_show",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 60,
        sms_body: "Hi {{firstName}}, we missed you today! Everything okay? Reschedule your FREE class: {{bookingLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 1440,
        email_subject: "Let's Reschedule Your Class",
        email_body: `Hi {{firstName}},

We noticed you couldn't make it yesterday. No worries!

**Reschedule:**
{{bookingLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

We're here when ready!
{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 4320,
        sms_body: "{{firstName}}, your spot is still available! Book your FREE class: {{bookingLink}}\n\nQuestions? {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "Final Reminder: Your FREE Class Awaits",
        email_body: `Hi {{firstName}},

Final reminder - your FREE class is still available.

**One Last Chance:**
{{bookingLink}}

**Not Sure?**
Chat with {{aiName}}: {{aiChatLink}}

We're here when you're ready!

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Trial-to-Enrollment - Studio",
    description: "Convert trials to members",
    trigger: "trial_attended",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "Great Job Today!",
        email_body: `Hi {{firstName}},

You did great in class today!

**Membership Options:**
• **Unlimited:** All classes - $149/month
• **Class Pack:** Flexible - $130
• **Drop-In:** Single class - $20

**Join Today:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 2880,
        email_subject: "The Benefits of Regular Training",
        email_body: `Hi {{firstName}},

Still considering? Here's what regular training can do:

**Benefits:**
✅ Improved fitness
✅ Stress relief
✅ Supportive community
✅ Personal growth

**Ready?**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 5760,
        sms_body: "Hi {{firstName}}! Ready to join? Unlimited classes: $149/mo. Enroll: {{enrollmentLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 4,
        type: "send_email",
        delay_minutes: 8640,
        email_subject: "⏰ Enrollment Deadline: Friday",
        email_body: `Hi {{firstName}},

We're holding your spot until **Friday at 5pm**.

**Don't Wait:**
{{enrollmentLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "New Student Onboarding - Studio",
    description: "Welcome new members",
    trigger: "enrollment_completed",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "🎉 Welcome to {{businessName}}!",
        email_body: `Hi {{firstName}},

Welcome to {{businessName}}!

**Your First 2 Weeks:**
• Try different classes
• Meet instructors
• Join community group
• Bring a friend!

**Important Links:**
📱 App: {{appDownloadLink}}
📅 Schedule: {{scheduleLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "How's Your First Week? + Referrals!",
        email_body: `Hi {{firstName}},

How was week one?

**Referral Rewards:**
**You get:** Credit per referral
**They get:** Special discount

**Your Link:**
{{referralLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Attendance & Retention - Studio",
    description: "Re-engage inactive students",
    trigger: "attendance_dropped",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Hi {{firstName}}! We missed you this week. Everything okay? Check schedule: {{scheduleLink}}\n\nChat with {{aiName}}: {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 10080,
        email_subject: "We Miss You!",
        email_body: `Hi {{firstName}},

We haven't seen you in a couple weeks. Everything okay?

**Let's Reconnect:**
Chat with {{aiName}}: {{aiChatLink}}
Or call: {{dojoPhone}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_email",
        delay_minutes: 20160,
        email_subject: "Comeback Offer",
        email_body: `Hi {{firstName}},

We miss you! Special comeback offer:

🎁 **Discount on next month**

**Expires in 7 Days:**
{{comebackOfferLink}}

**Let's Talk:**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}
{{dojoPhone}}`
      }
    ]
  },
  {
    name: "Membership Billing - Studio",
    description: "Handle payment issues",
    trigger: "payment_failed",
    steps: [
      {
        order: 1,
        type: "send_sms",
        delay_minutes: 0,
        sms_body: "Hi {{firstName}}, payment didn't go through. Update card: {{billingLink}}\n\nNeed help? {{aiChatLink}}"
      },
      {
        order: 2,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "⚠️ Payment Issue",
        email_body: `Hi {{firstName}},

Payment didn't process.

**Action Required:**
Update within 48 hours: {{billingLink}}

**Need Help?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      },
      {
        order: 3,
        type: "send_sms",
        delay_minutes: 2880,
        sms_body: "Final reminder: Update payment: {{billingLink}}\n\nQuestions? {{aiChatLink}}"
      }
    ]
  },
  {
    name: "Student Engagement - Studio",
    description: "Monthly newsletter",
    trigger: "monthly_newsletter",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "{{businessName}} Newsletter - {{currentMonth}}",
        email_body: `Hi {{firstName}},

Here's what's happening this month!

**Upcoming:**
• Event: {{eventDate}}
• Workshop: {{workshopDate}}

**Spotlight:**
Congrats to {{spotlightStudent}}!

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      }
    ]
  },
  {
    name: "Referrals System - Studio",
    description: "Encourage referrals",
    trigger: "attendance_milestone",
    steps: [
      {
        order: 1,
        type: "send_email",
        delay_minutes: 0,
        email_subject: "🎉 {{attendanceCount}} Classes Complete!",
        email_body: `Hi {{firstName}},

{{attendanceCount}} classes completed! Amazing!

**Refer Friends:**
**You get:** Credit per referral
**They get:** Special discount

**Your Link:**
{{referralLink}}

**Questions?**
Chat with {{aiName}}: {{aiChatLink}}

{{operatorName}}
{{businessName}}`
      }
    ]
  }
];

/**
 * EXPORT ALL INDUSTRY TEMPLATES
 */
export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    industry: "martial_arts",
    sequences: martialArtsTemplates
  },
  {
    industry: "yoga",
    sequences: yogaTemplates
  },
  {
    industry: "fitness",
    sequences: fitnessTemplates
  },
  {
    industry: "pilates",
    sequences: pilatesTemplates
  },
  {
    industry: "other",
    sequences: otherStudioTemplates
  }
];

/**
 * Get templates for a specific industry
 */
export function getTemplatesForIndustry(industry: string): AutomationSequenceTemplate[] {
  const industryTemplate = INDUSTRY_TEMPLATES.find(t => t.industry === industry);
  return industryTemplate ? industryTemplate.sequences : otherStudioTemplates;
}

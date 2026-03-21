/**
 * Kai Sales Knowledge Base
 * Source: MASS Training — Trial Sales Dialogue Flow (11/20/2023)
 *
 * This knowledge is injected into Kai's system prompt so Kai can coach
 * dojo owners through every stage of the trial sales process:
 * - Suggest the right script for the right moment
 * - Coach through objections
 * - Guide the enrollment conversation
 * - Generate confirmation call scripts personalized to the lead
 */

export const KAI_SALES_KNOWLEDGE = `
## SALES COACHING KNOWLEDGE: MASS Training Trial Sales System

You have been trained on the complete MASS Training Trial Sales Dialogue Flow. When a user asks about leads, sales, enrollment, follow-ups, scripts, or objections — draw on this knowledge to coach them with specific, actionable guidance.

### THE 12-STEP TRIAL SALES SYSTEM

The goal is NEVER to sell a membership on the phone. The goal is:
1. Book the trial lesson appointment
2. Deliver an exceptional first lesson
3. Enroll AFTER the lesson

**Core Rule:** Never answer pricing, schedule, or style questions before the first lesson. The uninformed lead will always object on price, schedule, or style. Sell the EXPERIENCE first.

---

### STEP 1 — INSTANT ENGAGEMENT (First Contact Call)

**Phone Call Answered Script:**
- Use upbeat tonality — act like you already know them
- "[First Name]? [First & Last Name]?"
- "Hi [First Name], this is [Your Name], one of the instructors here at [Academy Name]."
- "Hey, thanks for taking my call!"
- "[First Name], you submitted your contact details to find out about our two week trial martial arts membership."
- "I'm the guy/gal who's going to help you with all the information you need to know about our 2 Week Trial. I didn't catch you at a bad time did I?"
- "Great! To give you the right information, I need to ask a few questions first, okay?"

**Handling "Bad Time" / Delay:**
- Principle: "To delay is to deny" — never let them push you off without a specific callback time
- "Yes, of course. However, I would hate for us to play phone tag. Let's synchronize — I can call you back at ___ or after ___ this evening. Which works best?"
- If they can't decide: "Shoot me a text with the best time."
- "But I have to tell you, this is a very popular membership and our classes are filling up fast..."

**Handling Premature Price/Schedule Questions:**
- Redirect: "Oh, I can help you with that! Who are these lessons for, you or someone else?"
- If they persist: "Oh, I'll give you all that information. However, we might be getting ahead of ourselves. Let me give you all the information in the best sequence so you can make a well-informed decision. Okay?"

**No Answer Voicemail:**
"Hi [First Name], this is [Your Name] from [Academy Name]. You recently submitted your contact details to find out about our two week trial martial arts membership. I'm calling to get you all the information you need. Please give me a call back at [number] or text me at [number]. I look forward to speaking with you."

**No Answer Text:**
"Hi [First Name], this is [Your Name] from [Academy Name]. You recently submitted your contact details to find out about our 2 Week Trial Membership. Reply to this text or call me at [number] and I'll get you all the info you need."

---

### STEP 2 — RAPID RAPPORT

- "So [First Name], tell me a little about yourself / your child — what brings you to look into martial arts?"
- Listen actively — mirror their language and find a personal connection point
- Use their name frequently
- Acknowledge before moving on: "That's great" / "I love that" / "That makes total sense"
- Transition: "That's great! So let me ask you a few quick questions so I can point you in the right direction..."

---

### STEP 3 — DEEP DISCOVERY

**Discovery Questions (ask in sequence):**
1. "Who are the lessons for — you, or someone else in the family?"
2. "How old is [name]?" / "How long have you been thinking about this?"
3. "Have you done any martial arts before?"
4. "What made you decide to look into it now?" ← THE KEY QUESTION — surfaces the emotional driver
5. "What's most important to you in finding the right school?"
6. "Is it just [name] or are there other family members who might be interested?"
7. "And just so I know — is it just you making this decision or is there someone else involved?"

**Common Emotional Drivers to Listen For:**
- Confidence / self-esteem
- Bullying / self-defense
- Focus / discipline / school performance
- Fitness / weight loss
- Social skills / making friends
- Fun / something to do after school
- Following a friend or sibling

**How to Use Discovery:** Tie everything back to their emotional driver throughout the entire conversation. "Based on what you told me about [emotional driver], I think our program would be perfect because..."

---

### STEP 4 — TRIAL TRANSITION (Booking the Appointment)

- "Based on everything you've shared with me, I think the best next step is to get [name] in for their first lesson so they can experience it firsthand."
- "We have a 2-week trial membership that gives you [X] lessons, and it's the best way to see if it's the right fit."
- "I have [day] at [time] or [day] at [time] available — which works better for your schedule?"

**Key:** Always give TWO options (alternative close). Never ask "when are you free?"

**If They Ask About Trial Price:**
"It's a very affordable investment — but honestly, the first step is just getting [name] in for the first lesson so you can see what we're all about. After that, we'll go over all the program options together. Fair enough?"

---

### STEP 5 — FAST FIRST LESSON

**Before the Lesson:** Greet by name at the door, give a quick tour, set expectations: "The first lesson is about 45-50 minutes. I'll be with [name] the whole time."

**During the Lesson:** Make the student feel like a star. High-fives, encouragement, specific acknowledgment. End with a "graduation moment" — belt ceremony, certificate, or special recognition.

**After the Lesson:**
- "So [First Name], what did you think?"
- "I could tell [name] really loved it — did you see [specific moment]?"
- Transition to enrollment: "So here's what I'd like to do..."

---

### STEP 6 — FAMILY ADD-ON

- During discovery or after the first lesson: "You mentioned [sibling/parent] — have they ever thought about trying martial arts?"
- "We actually have a family program that makes it really affordable when more than one person trains."
- "Would it make sense to bring [family member] in for a trial lesson too?"

---

### STEP 7 — TRIAL TUITION PAYMENT

- "To hold your spot and get everything set up, there's a small investment for the 2-week trial — it's [amount]."
- "We accept all major cards — do you want to take care of that now so we're all set?"

**If They Hesitate on Price:**
"I completely understand. Here's the thing — the trial is designed so you can experience everything before making any bigger decision. And the [amount] is actually applied toward your membership if you decide to enroll. So it's really risk-free."

**If They Want to Think About It:**
"Of course! What questions do you have that I can answer right now?" → Address the objection → Re-close: "Does that make sense? Great — let's get you set up."

---

### STEP 8 — PARENTAL PARTICIPATION

- "One thing I always encourage parents to do is stay and watch the first lesson — it really helps you see what [name] is experiencing."
- "And if you want to jump in and try a few things yourself, you're more than welcome!"
- After the lesson: "What did you notice about [name] during the class?"
- Let the parent sell themselves on the value

---

### STEP 9 — COMMUNITY CONNECTION (Facebook Group)

- "We have a private Facebook group for our school family — it's where we share updates, events, and celebrate our students."
- "I'd love to add you to the group so you can see what our community is all about."

---

### STEP 10 — CONGRATULATE AND COMMEND

- "I have to tell you — [name] did an incredible job today."
- Be SPECIFIC: "[Name] picked up [specific technique] really quickly — that's not easy for a first lesson."
- To the student: "You were awesome today. Are you coming back?"
- To the parent: "You should be really proud."

**Key:** Specificity makes praise believable. Generic praise is forgettable.

---

### STEP 11 — PREFRAME AND COMMIT (Enrollment Conversation)

**After the First Lesson:**
- "So here's what's going to happen over the next two weeks..." (walk them through the trial)
- "And at the end of the two weeks, we'll sit down together and I'll show you all the program options. Sound good?"

**The Enrollment Conversation (End of Trial):**
- "So [First Name], [name] has had [X] lessons now — what's your overall impression?"
- "Based on what you've seen, do you feel like this is the right fit for [name]?"
- If yes: "Great — let me show you the program options we have..."
- Present 3 options (good/better/best structure)
- "Which of these feels like the best fit for your family?"

**Handling "I Need to Think About It":**
- "Of course — what specifically would you like to think about?"
- Identify the real objection (price, time, commitment)
- "If we could [solve objection], would you be ready to get started today?"

**Handling "It's Too Expensive":**
- "I completely understand. Can I ask — what were you expecting to invest?"
- "Here's what I want you to consider — [name] is going to be here [X] times per week. That works out to about [$/session]. For what [name] is getting — the confidence, the discipline, the fitness — is that a fair investment?"
- Offer payment plan if available

**Handling "We Need to Talk to Spouse/Partner":**
- "Absolutely — when would be a good time for all of us to connect? I can do a quick call or even a Zoom."
- Never let them leave without a follow-up appointment

---

### STEP 12 — CONFIRMATION CALLS

**Booking Confirmation — Phone Call Answered:**
"Hi [First Name], this is [Your Name] from [Academy Name]. I'm calling to confirm your first lesson [day] at [time]. Do you have any questions before you come in? Great — we're looking forward to meeting you! Oh, and just so you know — wear comfortable, loose-fitting clothes. You won't need to be barefoot — socks are fine. And if you want to come a few minutes early, you can watch the end of the class before yours. We'll see you [day] at [time]!"

**Booking Confirmation — No Answer Voicemail:**
"Hello [First Name], this is [Your Name] from [Academy Name], calling to confirm your first lesson [day] at [time]. I'm going to send you the map link with specific directions to our location so you'll know how long it'll take to get here. Be sure to wear loose-fitting clothes — socks are fine — this way you can join your child's first lesson. It'll be a lot of fun. And remember, the first lesson should take around 50 minutes or so. After the lesson, if you love martial arts as much as I know you will, we'll go over all the programs we have to offer. I'll even show you how to save money by enrolling after your first class. If for some reason you can't make your appointment, please call or text me to let me know and we'll reschedule. We are looking forward to meeting you [day] at [time]."

**Booking Confirmation — Follow-up Text:**
"Hello [First Name], this is [Your Name] from [Academy Name]. I just left you a voicemail to confirm your first lesson for [day] at [time]. Here's the map link: [link]. Look forward to seeing you soon! Please reply to confirm."

**Confirmation Day Of — Phone Call Answered:**
"Hi [First Name], [First Name, Last Name]? Hello again, this is [Your Name] from [Academy Name]. I wanted to call to let you know that we are on schedule for your first lesson at [time]. And if you want to come a few minutes early you can watch the last class finish up. Mr./Mrs. [Last Name] thank you for your support and I look forward to all of us taking our first class together. It's going to be fun! We'll see you tonight!"

**Confirmation Day Of — No Answer Voicemail:**
"Hello again, this is [Your Name] from [Academy Name]. I wanted to call to let you know that we are on schedule for your first lesson at [time]. When you get here, we'll have plenty of time for your child to change into their official [whatever is given away]. It's going to be fun! We'll see you tonight!"

**Confirmation Day Of — Follow-up Text:**
"Hello again, this is [Your Name] from [Academy Name]. I just left you a voicemail to confirm your first lesson tonight at [time]. It's going to be fun! We'll see you tonight! Please reply to confirm."

---

### MISSED APPOINTMENT RECOVERY

**Missed Appointment — Phone Call (15 minutes after):**
"Hi [First], [First Name, Last Name]? Hello! This is [Your Name] from [Academy Name], I'm glad I caught you. Is everything ok? I was looking forward to our first lesson tonight at [time]. We still have time this evening, can you make it in? [If no:] This happens a lot this time of year, but luckily we have two openings tomorrow, one at ___ or ___ — which is best for you? Did you receive the map link or do I need to text it again? I look forward to seeing you."

**Missed Appointment — No Answer Voicemail (15 minutes after):**
"Hello! This is [Your Name] from [Academy Name], I was just calling to make sure that everything is okay? I was looking forward to our first lesson tonight at [time]. We still have time this evening, can you make it in? Please give me a call back or shoot me a text at [number] and let me know! Thanks so much!"

**Missed Appointment — Follow-up Text (15 minutes after):**
"Hello! This is [Your Name] from [Academy Name], is everything ok? Please give me a call at [number] and let me know you guys are alright. Please reply."

**Day After Missed Appointment — Phone Call:**
"Hi, is this ___? Hello! This is [Your Name] from [Academy Name], how are you today? We missed you last night! And I'm getting back to you to reschedule your first lesson. Luckily we have two openings today, one at ___ or ___ — which is better for you? Did you receive the map link or do I need to text it again? I look forward to seeing you [day and time]."

**Day After Missed Appointment — No Answer Voicemail:**
"Hello! This is [Your Name] from [Academy Name], is everything ok? We missed you last night! And I'm getting back to you to reschedule your first lesson so you don't miss out on your trial. Please give me a call at [number] and let me know you guys are alright! Thank you!"

**Day After Missed Appointment — Follow-up Text:**
"Hello! This is [Your Name] from [Academy Name]. We missed your first lesson, is everything okay? Reply to this text with a time I can call you."

---

### KEY SALES PRINCIPLES

1. Never answer price/schedule/style questions before the first lesson — redirect every time
2. Always use the alternative close — give two options, never ask open-ended "when are you free?"
3. "To delay is to deny" — don't let leads push you off; always get a specific callback time
4. The emotional driver is everything — find it in discovery, reference it throughout the entire conversation
5. Specificity builds trust — specific praise, specific times, specific benefits
6. The trial payment is a commitment device — collecting payment reduces no-shows
7. Community = retention — Facebook group, parent involvement, celebration moments
8. Always have a next step — never end a conversation without a confirmed next action
9. Objections are questions in disguise — "I need to think about it" = "I have an unanswered question"
10. The enrollment conversation happens AFTER the lesson, not before — let the experience do the selling

---

### HOW TO USE THIS KNOWLEDGE AS KAI

When a user asks about a lead, ask yourself:
- What stage is this lead at? (New Lead, Contacted, Intro Scheduled, Showed Up, Offer Presented)
- What's the right script for this stage?
- What emotional driver did they surface?
- What objection are they facing?

Then give the user:
1. The specific script to use RIGHT NOW
2. The emotional driver to reference
3. The next step to take
4. Any objection handling if needed

Be a sales COACH, not just an information provider. Tell them exactly what to say.
`;

/**
 * Returns the sales knowledge section formatted for injection into the Kai system prompt.
 */
export function getSalesKnowledgeSection(): string {
  return KAI_SALES_KNOWLEDGE;
}

/**
 * Returns a stage-specific coaching tip based on the lead's current pipeline stage.
 */
export function getSalesCoachingForStage(stage: string): string {
  const stageMap: Record<string, string> = {
    'new_lead': `This lead just came in. Your ONLY goal right now is to make contact within the first 5 minutes. Use the Instant Engagement script. Do NOT answer price or schedule questions — redirect to discovery. Give them two callback time options if they say it's a bad time.`,
    'contacted': `You've made contact. Now your goal is to book the trial lesson appointment. Run through Rapid Rapport and Deep Discovery to find their emotional driver, then use the Trial Transition close: give them TWO specific time options. Never ask "when are you free?"`,
    'intro_scheduled': `The trial is booked. Now send the Booking Confirmation script (call + voicemail + text). The day before, send the Day Before Confirmation. Day of, send the Day Of Confirmation. If they don't show, call 15 minutes after with the Missed Appointment recovery script.`,
    'showed_up': `They came in for their first lesson. Now run the Congratulate & Commend step — be SPECIFIC about what they did well. Then Preframe the enrollment conversation: "At the end of the two weeks, we'll sit down and go over all the program options." Plant the family add-on seed if applicable.`,
    'offer_presented': `You've presented the enrollment offer. If they said "I need to think about it" — that means they have an unanswered question. Ask: "What specifically would you like to think about?" Then address the real objection (price, time, spouse). Close with: "If we could [solve it], would you be ready to get started today?"`,
    'enrolled': `They enrolled — congratulations! Now focus on community integration: add them to the Facebook group, introduce them to other families, and look for family add-on opportunities. A happy enrolled member is your best referral source.`,
    'nurture': `This lead went cold. Don't give up — use the Day After Missed Appointment recovery approach. Lead with empathy ("Is everything ok?"), then offer two specific reschedule times. Keep the tone warm, not pushy.`,
  };

  return stageMap[stage] || `Focus on understanding where this lead is in their decision journey and what emotional driver brought them to martial arts. Then match your approach to their stage.`;
}

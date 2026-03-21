/**
 * KaiSalesCoach — Stage-Aware Sales Coaching Panel
 *
 * Surfaces the right MASS Training script for each lead pipeline stage.
 * Shown in the LeadDrawer as the "Kai Coach" tab.
 */
import { useState } from 'react';
import { Copy, CheckCheck, ChevronDown, ChevronUp, Sparkles, Phone, MessageSquare, Mail, Voicemail } from 'lucide-react';

interface KaiSalesCoachProps {
  leadFirstName: string;
  leadLastName: string;
  currentStage: string;
  academyName?: string;
  instructorName?: string;
}

interface ScriptBlock {
  label: string;
  icon: React.ElementType;
  script: string;
}

function getScriptsForStage(
  stage: string,
  firstName: string,
  lastName: string,
  academy: string,
  instructor: string
): { coaching: string; scripts: ScriptBlock[] } {
  const fn = firstName;
  const ln = lastName;
  const full = `${fn} ${ln}`;
  const acad = academy || 'our academy';
  const inst = instructor || 'your instructor';

  switch (stage) {
    case 'new_lead':
      return {
        coaching: `${fn} just came in. Your ONLY goal right now is to make contact within the first 5 minutes. Use the Instant Engagement script below. Do NOT answer price or schedule questions — redirect to discovery. If they say it's a bad time, give them two specific callback time options.`,
        scripts: [
          {
            label: 'Phone Call — Answered',
            icon: Phone,
            script: `${fn}? ${full}?\n\nHi ${fn}, this is ${inst}, one of the instructors here at ${acad}.\n\nHey, thanks for taking my call!\n\n${fn}, you submitted your contact details to find out about our two week trial martial arts membership. I'm the one who's going to help you with all the information you need to know about our 2 Week Trial.\n\nI didn't catch you at a bad time did I?\n\nGreat! To give you the right information, I need to ask a few questions first, okay?`,
          },
          {
            label: 'No Answer — Voicemail',
            icon: Voicemail,
            script: `Hi ${fn}, this is ${inst} from ${acad}. You recently submitted your contact details to find out about our two week trial martial arts membership. I'm calling to get you all the information you need.\n\nPlease give me a call back or text me at [your number]. I look forward to speaking with you.`,
          },
          {
            label: 'No Answer — Text',
            icon: MessageSquare,
            script: `Hi ${fn}, this is ${inst} from ${acad}. You recently submitted your contact details to find out about our 2 Week Trial Membership. Reply to this text or call me at [your number] and I'll get you all the info you need.`,
          },
        ],
      };

    case 'contacted':
      return {
        coaching: `You've made contact with ${fn}. Now your goal is to book the trial lesson. Run through Rapid Rapport and Deep Discovery to find their emotional driver — then use the Trial Transition close. Always give TWO specific time options. Never ask "when are you free?"`,
        scripts: [
          {
            label: 'Rapid Rapport Opener',
            icon: Phone,
            script: `So ${fn}, tell me a little about yourself — what brings you to look into martial arts right now?\n\n[Listen actively — mirror their language]\n\nThat's great! So let me ask you a few quick questions so I can point you in the right direction...`,
          },
          {
            label: 'Deep Discovery (Key Questions)',
            icon: Phone,
            script: `Who are the lessons for — you, or someone else in the family?\n\nHow old is [name]? How long have you been thinking about this?\n\nHave you done any martial arts before?\n\nWhat made you decide to look into it now? ← [This is the key question — listen for the emotional driver]\n\nWhat's most important to you in finding the right school?\n\nIs it just you making this decision or is there someone else involved?`,
          },
          {
            label: 'Trial Transition Close',
            icon: Phone,
            script: `Based on everything you've shared with me, I think the best next step is to get [name] in for their first lesson so they can experience it firsthand.\n\nWe have a 2-week trial membership that gives you [X] lessons, and it's the best way to see if it's the right fit.\n\nI have [Day 1] at [Time 1] or [Day 2] at [Time 2] available — which works better for your schedule?`,
          },
          {
            label: 'If They Ask About Price',
            icon: MessageSquare,
            script: `It's a very affordable investment — but honestly, the first step is just getting [name] in for the first lesson so you can see what we're all about. After that, we'll go over all the program options together. Fair enough?`,
          },
        ],
      };

    case 'intro_scheduled':
      return {
        coaching: `${fn}'s trial lesson is booked. Now send the confirmation scripts below. Call + voicemail + text. Day before, send the Day Before Confirmation. Day of, send the Day Of Confirmation. If they don't show, call 15 minutes after with the Missed Appointment recovery script.`,
        scripts: [
          {
            label: 'Booking Confirmation — Phone Call',
            icon: Phone,
            script: `Hi ${fn}, this is ${inst} from ${acad}.\n\nI'm calling to confirm your first lesson [Day] at [Time]. Do you have any questions before you come in?\n\nGreat — we're looking forward to meeting you! Oh, and just so you know — wear comfortable, loose-fitting clothes. You won't need to be barefoot — socks are fine.\n\nAnd if you want to come a few minutes early, you can watch the end of the class before yours.\n\nWe'll see you [Day] at [Time]!`,
          },
          {
            label: 'Booking Confirmation — Voicemail',
            icon: Voicemail,
            script: `Hello ${fn}, this is ${inst} from ${acad}, calling to confirm your first lesson [Day] at [Time].\n\nI'm going to send you the map link with specific directions to our location so you'll know how long it'll take to get here.\n\nBe sure to wear loose-fitting clothes — socks are fine. And remember, the first lesson should take around 50 minutes or so.\n\nAfter the lesson, if you love martial arts as much as I know you will, we'll go over all the programs we have to offer. I'll even show you how to save money by enrolling after your first class.\n\nIf for some reason you can't make your appointment, please call or text me and we'll reschedule. We are looking forward to meeting you [Day] at [Time].`,
          },
          {
            label: 'Booking Confirmation — Text',
            icon: MessageSquare,
            script: `Hello ${fn}, this is ${inst} from ${acad}. I just left you a voicemail to confirm your first lesson for [Day] at [Time]. Here's the map link: [link]. Look forward to seeing you soon! Please reply to confirm.`,
          },
          {
            label: 'Day Of Confirmation — Phone Call',
            icon: Phone,
            script: `Hi ${fn}, ${full}?\n\nHello again, this is ${inst} from ${acad}.\n\nI wanted to call to let you know that we are on schedule for your first lesson at [Time].\n\nAnd if you want to come a few minutes early you can watch the last class finish up.\n\nMr./Mrs. ${ln}, thank you for your support and I look forward to all of us taking our first class together.\n\nIt's going to be fun! We'll see you tonight!`,
          },
          {
            label: 'Day Of Confirmation — Text',
            icon: MessageSquare,
            script: `Hello again, this is ${inst} from ${acad}. I just left you a voicemail to confirm your first lesson tonight at [Time]. It's going to be fun! We'll see you tonight! Please reply to confirm.`,
          },
        ],
      };

    case 'no_show':
    case 'nurture':
      return {
        coaching: `${fn} missed their appointment or went cold. Don't give up — lead with empathy ("Is everything ok?"), then offer two specific reschedule times. Keep the tone warm, not pushy. The goal is to reschedule, not to pressure.`,
        scripts: [
          {
            label: 'Missed Appointment — Phone Call (15 min after)',
            icon: Phone,
            script: `Hi ${fn}, ${full}?\n\nHello! This is ${inst} from ${acad}, I'm glad I caught you.\n\nIs everything ok?\n\nI was looking forward to our first lesson tonight at [Time]. We still have time this evening, can you make it in?\n\n[If no:] This happens a lot this time of year, but luckily we have two openings tomorrow, one at [Time 1] or [Time 2] — which is best for you?\n\nDid you receive the map link or do I need to text it again?\n\nI look forward to seeing you.`,
          },
          {
            label: 'Missed Appointment — Voicemail (15 min after)',
            icon: Voicemail,
            script: `Hello! This is ${inst} from ${acad}, I was just calling to make sure that everything is okay?\n\nI was looking forward to our first lesson tonight at [Time]. We still have time this evening, can you make it in?\n\nPlease give me a call back or shoot me a text at [your number] and let me know! Thanks so much!`,
          },
          {
            label: 'Missed Appointment — Text (15 min after)',
            icon: MessageSquare,
            script: `Hello! This is ${inst} from ${acad}, is everything ok? Please give me a call at [your number] and let me know you guys are alright. Please reply.`,
          },
          {
            label: 'Day After Missed — Phone Call',
            icon: Phone,
            script: `Hi, is this ${fn}?\n\nHello! This is ${inst} from ${acad}, how are you today?\n\nWe missed you last night! And I'm getting back to you to reschedule your first lesson.\n\nLuckily we have two openings today, one at [Time 1] or [Time 2] — which is better for you?\n\nDid you receive the map link or do I need to text it again?\n\nI look forward to seeing you [Day and Time].`,
          },
          {
            label: 'Day After Missed — Text',
            icon: MessageSquare,
            script: `Hello! This is ${inst} from ${acad}. We missed your first lesson, is everything okay? Reply to this text with a time I can call you.`,
          },
        ],
      };

    case 'showed_up':
      return {
        coaching: `${fn} came in for their first lesson. Now run the Congratulate & Commend step — be SPECIFIC about what they did well. Then Preframe the enrollment conversation. Plant the family add-on seed if applicable. The enrollment conversation happens AFTER the trial, not now.`,
        scripts: [
          {
            label: 'After First Lesson — Congratulate',
            icon: Phone,
            script: `I have to tell you — [student name] did an incredible job today.\n\n[Be specific: "[Name] picked up [specific technique] really quickly — that's not easy for a first lesson."]\n\nTo the student: "You were awesome today. Are you coming back?"\n\nTo the parent: "You should be really proud."`,
          },
          {
            label: 'Preframe the Enrollment Conversation',
            icon: Phone,
            script: `So here's what's going to happen over the next two weeks...\n\n[Walk them through the trial schedule]\n\nAnd at the end of the two weeks, we'll sit down together and I'll show you all the program options. Sound good?\n\n[If family members were mentioned:] "By the way, you mentioned [sibling/spouse] — would it make sense to bring them in for a trial lesson too? We have a family program that makes it really affordable."`,
          },
        ],
      };

    case 'offer_presented':
      return {
        coaching: `You've presented the enrollment offer to ${fn}. If they said "I need to think about it" — that means they have an unanswered question. Ask what specifically they'd like to think about, then address the real objection (price, time, spouse). Close with: "If we could solve that, would you be ready to get started today?"`,
        scripts: [
          {
            label: 'Enrollment Conversation Opener',
            icon: Phone,
            script: `So ${fn}, [student name] has had [X] lessons now — what's your overall impression?\n\nBased on what you've seen, do you feel like this is the right fit for [name]?\n\n[If yes:] "Great — let me show you the program options we have..."\n\n[Present 3 options — good/better/best]\n\n"Which of these feels like the best fit for your family?"`,
          },
          {
            label: 'Handling "I Need to Think About It"',
            icon: MessageSquare,
            script: `Of course — what specifically would you like to think about?\n\n[Listen for the real objection — price, time, or need to talk to spouse]\n\n[After identifying it:] "If we could [solve the objection], would you be ready to get started today?"`,
          },
          {
            label: 'Handling "It\'s Too Expensive"',
            icon: MessageSquare,
            script: `I completely understand. Can I ask — what were you expecting to invest?\n\n[Listen]\n\nHere's what I want you to consider — [name] is going to be here [X] times per week. That works out to about [$/session]. For what [name] is getting — the confidence, the discipline, the fitness — is that a fair investment?\n\n[Offer payment plan if available]`,
          },
          {
            label: 'Handling "Need to Talk to Spouse"',
            icon: Phone,
            script: `Absolutely — when would be a good time for all of us to connect? I can do a quick call or even a Zoom.\n\n[Never let them leave without a follow-up appointment booked]`,
          },
        ],
      };

    case 'enrolled':
      return {
        coaching: `${fn} enrolled — congratulations! Now focus on community integration and referrals. Add them to the Facebook group, introduce them to other families, and look for family add-on opportunities. A happy enrolled member is your best referral source.`,
        scripts: [
          {
            label: 'Community Welcome',
            icon: MessageSquare,
            script: `Welcome to the ${acad} family, ${fn}!\n\nWe have a private Facebook group for our school family — it's where we share updates, events, and celebrate our students. I'd love to add you to the group so you can stay connected.\n\nWhat's the best email or Facebook name to use?`,
          },
          {
            label: 'Referral Ask',
            icon: Phone,
            script: `${fn}, we love having you and [student name] as part of our community.\n\nDo you know anyone else who might benefit from what we offer here? We'd love to welcome them in for a free trial lesson — and we always take great care of referrals from our members.`,
          },
        ],
      };

    default:
      return {
        coaching: `Focus on understanding where ${fn} is in their decision journey and what emotional driver brought them to martial arts. Then match your approach to their stage.`,
        scripts: [],
      };
  }
}

function ScriptCard({ block }: { block: ScriptBlock }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const Icon = block.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(block.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = block.script.split('\n')[0];

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{block.label}</p>
          {!expanded && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{preview}</p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50">
            <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {block.script}
            </pre>
          </div>
          <div className="p-2 flex justify-end border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Script
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KaiSalesCoach({
  leadFirstName,
  leadLastName,
  currentStage,
  academyName,
  instructorName,
}: KaiSalesCoachProps) {
  const { coaching, scripts } = getScriptsForStage(
    currentStage,
    leadFirstName,
    leadLastName,
    academyName || 'our academy',
    instructorName || 'your instructor'
  );

  return (
    <div className="space-y-4">
      {/* Kai Coaching Header */}
      <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
            Kai's Coaching
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {coaching}
          </p>
        </div>
      </div>

      {/* Scripts */}
      {scripts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">
            Scripts for This Stage
          </p>
          <div className="space-y-2">
            {scripts.map((block, i) => (
              <ScriptCard key={i} block={block} />
            ))}
          </div>
        </div>
      )}

      {/* MASS Training Attribution */}
      <p className="text-xs text-slate-400 dark:text-slate-600 text-center pt-2">
        Powered by MASS Training Trial Sales System
      </p>
    </div>
  );
}

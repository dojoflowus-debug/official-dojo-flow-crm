import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Zap, Shield, Bug, Wrench, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ChangeEntry {
  type: 'feature' | 'improvement' | 'fix' | 'security';
  text: string;
  detail?: string;
}

interface VersionRelease {
  version: string;
  date: string;
  tag: 'latest' | 'beta' | 'stable' | 'hotfix';
  headline: string;
  summary: string;
  changes: ChangeEntry[];
}

const RELEASES: VersionRelease[] = [
  {
    version: 'v0.9.6',
    date: 'March 23, 2026',
    tag: 'latest',
    headline: 'Kai UX Polish & Language Upgrade',
    summary: 'Kai now guides users through creative briefs instead of announcing generation prematurely. All error language has been replaced with confident, forward-moving responses.',
    changes: [
      {
        type: 'fix',
        text: 'Removed premature "Got it — I\'m creating that flyer now" message',
        detail: 'Kai no longer announces generation before the server confirms all required fields are present. Instead, it asks guided questions first.',
      },
      {
        type: 'improvement',
        text: 'All "Sorry / I couldn\'t" language replaced across the platform',
        detail: 'Swept routers.ts, kai-metric-handler.ts, and kaiConversationsRouter.ts — every error path now uses forward-moving, confident language.',
      },
      {
        type: 'improvement',
        text: 'Gate error handler now shows friendly guided question',
        detail: 'When the execution gate fires, Kai responds with "Before I get started, I just need a couple quick details…" instead of a generic fallback.',
      },
    ],
  },
  {
    version: 'v0.9.5',
    date: 'March 22, 2026',
    tag: 'beta',
    headline: 'Conversational UX & Language Upgrade',
    summary: 'Replaced all error-style gate messages with friendly guided interaction. Added program chip suggestions, chat-bubble style questions, and warm collaborative tone throughout.',
    changes: [
      {
        type: 'feature',
        text: 'Conversational brief panel with chat-bubble style questions',
        detail: 'The Creative Brief Panel now opens with a smart suggestion card showing real stored programs as large tappable chips.',
      },
      {
        type: 'improvement',
        text: 'Forward-moving language across KaiCommand, KaiErrorAlert, KaiLeadCapture',
        detail: 'Removed all instances of "Sorry", "I couldn\'t", "Cannot generate", and failure-style messages.',
      },
      {
        type: 'improvement',
        text: 'Program chips auto-advance to next brief question on selection',
        detail: 'Selecting a program chip immediately moves to the audience question, reducing friction in the brief flow.',
      },
    ],
  },
  {
    version: 'v0.9.4',
    date: 'March 22, 2026',
    tag: 'beta',
    headline: 'Ad Intelligence Engine',
    summary: 'Conversion Mode enforced in the prompt engine with a mandatory 6-element ad structure, quality validation gate, and benefit-driven copy in all generation paths.',
    changes: [
      {
        type: 'feature',
        text: '6-element mandatory ad structure enforced on every generation',
        detail: 'Every ad output must include: headline, emotional hook, audience, benefits, CTA, and urgency element.',
      },
      {
        type: 'feature',
        text: 'Headline rewriter with benefit-driven copy',
        detail: 'Headlines are automatically rewritten to lead with the student outcome, not the school name.',
      },
      {
        type: 'feature',
        text: 'Template artifact blocklist',
        detail: 'Prevents placeholder text like "[School Name]", "[Phone Number]", or "Lorem ipsum" from appearing in generated outputs.',
      },
      {
        type: 'improvement',
        text: 'Quality validation gate before image generation',
        detail: 'Copy is validated against conversion rules before being sent to the image generation engine.',
      },
    ],
  },
  {
    version: 'v0.9.3',
    date: 'March 22, 2026',
    tag: 'beta',
    headline: 'Hard Execution Gate & OpenAI Intelligence Layer',
    summary: 'Generation is now blocked until program, audience, and key content are all confirmed. OpenAI enhances responses without overriding the Decision Intelligence Layer.',
    changes: [
      {
        type: 'feature',
        text: 'Hard execution gate — blocks generation until all 3 fields confirmed',
        detail: 'Program, audience, and key content must all be confirmed before any image generation proceeds. No bypasses.',
      },
      {
        type: 'feature',
        text: 'OpenAI Intelligence Layer integrated',
        detail: 'detectIntent(), enrichPromptContext(), generateMarketingCopy(), makeGenerationDecision(), and validateCopyAgainstRules() are all live.',
      },
      {
        type: 'feature',
        text: '3-pill status indicators in Creative Brief Panel',
        detail: 'Program, Audience, and Content pills show confirmed/pending state at a glance.',
      },
      {
        type: 'fix',
        text: 'kaiConversationsRouter fixed to use correct DB tables',
        detail: 'Was incorrectly querying conversations/messages tables — now correctly uses kaiConversations/kaiMessages.',
      },
    ],
  },
  {
    version: 'v0.9.2',
    date: 'March 22, 2026',
    tag: 'beta',
    headline: 'Creative Brief Engine & Context Injection',
    summary: 'School name, phone, email, programs, logo, and brand colors are now auto-loaded and injected into every generation prompt. No more placeholder content.',
    changes: [
      {
        type: 'feature',
        text: 'Context Injection Engine — auto-loads school profile into every prompt',
        detail: 'School name, phone, email, programs, logo, and brand colors are injected automatically so Kai never generates placeholder content.',
      },
      {
        type: 'feature',
        text: 'Creative Brief Panel with Guided Mode',
        detail: 'Step-by-step guided questions with program chips, progress bar, and Fast Mode toggle.',
      },
      {
        type: 'feature',
        text: 'Decision Intelligence Layer — program required before generation',
        detail: 'Program is required and cannot be bypassed by score or Fast Mode. "Program required" badge shown in brief header.',
      },
      {
        type: 'feature',
        text: 'Elite UX: smart suggestion card with real program chips',
        detail: 'Brief panel opens with "I can create a flyer for: [program chips]" using real stored programs from the DB.',
      },
    ],
  },
  {
    version: 'v0.9.1',
    date: 'March 21, 2026',
    tag: 'beta',
    headline: 'Login Fix & Debug Console Removal',
    summary: 'Fixed critical login failure for email/password accounts. Removed floating Eruda debug console from production.',
    changes: [
      {
        type: 'fix',
        text: 'Fixed critical login failure — localAuthRouter was never mounted',
        detail: 'Added /api/auth/login mount in server/index.ts. Both demo accounts now work correctly.',
      },
      {
        type: 'fix',
        text: 'Removed floating Eruda debug console button from production',
        detail: 'The debug console was visible to all users in production. Removed from index.html.',
      },
      {
        type: 'fix',
        text: 'Silenced 113 KaiCommand console.log/warn spam lines',
        detail: 'Console was flooded on every render. All non-essential logging removed.',
      },
    ],
  },
  {
    version: 'v0.9.0',
    date: 'March 20, 2026',
    tag: 'stable',
    headline: 'Kai Creative Launch',
    summary: 'Kai Creative is live — AI-powered flyer and ad generation for martial arts schools. Light mode command center, prompt carousel, and enhanced chat input.',
    changes: [
      {
        type: 'feature',
        text: 'Light mode command center with prompt carousel',
        detail: 'Centered Kai icon, title, and prompt carousel showing 3 cards at a time with intuitive arrow navigation.',
      },
      {
        type: 'feature',
        text: 'Enhanced chat input with loading feedback',
        detail: 'Send button shows loading spinner and disables during message submission to prevent duplicate sends.',
      },
      {
        type: 'feature',
        text: 'Improved navigation and theme switching',
        detail: 'Light / Night / Cinema theme modes available in the header.',
      },
      {
        type: 'feature',
        text: 'Kai Creative — AI flyer and ad generation',
        detail: 'Generate marketing materials for martial arts programs using natural language prompts.',
      },
    ],
  },
];

const TYPE_CONFIG = {
  feature: { icon: Star, label: 'New', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  improvement: { icon: Zap, label: 'Improved', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  fix: { icon: Bug, label: 'Fixed', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  security: { icon: Shield, label: 'Security', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

const TAG_CONFIG = {
  latest: { label: 'Latest', color: '#FF4C4C', bg: 'rgba(255,76,76,0.15)' },
  beta: { label: 'Beta', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  stable: { label: 'Stable', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  hotfix: { label: 'Hotfix', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

function ChangeItem({ entry, isDark }: { entry: ChangeEntry; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[entry.type];
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-start gap-3 py-3 border-b last:border-b-0 cursor-pointer group"
      style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
      onClick={() => entry.detail && setExpanded(!expanded)}
    >
      <div
        className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: cfg.bg }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, backgroundColor: cfg.bg }}
            >
              {cfg.label}
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)' }}
            >
              {entry.text}
            </span>
          </div>
          {entry.detail && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {expanded
                ? <ChevronUp className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                : <ChevronDown className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
              }
            </div>
          )}
        </div>
        {expanded && entry.detail && (
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}
          >
            {entry.detail}
          </p>
        )}
      </div>
    </div>
  );
}

function ReleaseCard({ release, isDark, isFirst }: { release: VersionRelease; isDark: boolean; isFirst: boolean }) {
  const [collapsed, setCollapsed] = useState(!isFirst);
  const tagCfg = TAG_CONFIG[release.tag];

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{
        backgroundColor: isDark ? (isFirst ? '#1e1e1e' : '#181818') : (isFirst ? '#ffffff' : '#f9f9f9'),
        border: isFirst
          ? '1px solid rgba(255,76,76,0.3)'
          : isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
        boxShadow: isFirst ? '0 0 0 1px rgba(255,76,76,0.1), 0 4px 24px rgba(0,0,0,0.2)' : undefined,
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between p-6 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span
              className="text-lg font-bold font-mono"
              style={{ color: isDark ? '#ffffff' : '#000000' }}
            >
              {release.version}
            </span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: tagCfg.color, backgroundColor: tagCfg.bg }}
            >
              {tagCfg.label}
            </span>
            <span
              className="text-xs"
              style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
            >
              {release.date}
            </span>
          </div>
          <h3
            className="text-base font-semibold mb-1"
            style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)' }}
          >
            {release.headline}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
          >
            {release.summary}
          </p>
        </div>
        <div className="flex-shrink-0 ml-4 mt-1">
          {collapsed
            ? <ChevronDown className="w-5 h-5" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
            : <ChevronUp className="w-5 h-5" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
          }
        </div>
      </div>

      {/* Change list */}
      {!collapsed && (
        <div
          className="px-6 pb-6"
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              padding: '0 16px',
            }}
          >
            {release.changes.map((entry, i) => (
              <ChangeItem key={i} entry={entry} isDark={isDark} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Changelog() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'cinema';

  const featureCount = RELEASES.reduce((acc, r) => acc + r.changes.filter(c => c.type === 'feature').length, 0);
  const fixCount = RELEASES.reduce((acc, r) => acc + r.changes.filter(c => c.type === 'fix').length, 0);
  const improvementCount = RELEASES.reduce((acc, r) => acc + r.changes.filter(c => c.type === 'improvement').length, 0);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: isDark ? '#111111' : '#f5f5f5' }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 border-b"
        style={{
          backgroundColor: isDark ? 'rgba(17,17,17,0.95)' : 'rgba(245,245,245,0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: 'rgba(255,76,76,0.1)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#FF4C4C' }} />
          </div>
          <span
            className="text-base font-bold"
            style={{ color: isDark ? '#ffffff' : '#000000' }}
          >
            DojoFlow Changelog
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: isDark ? '#ffffff' : '#000000' }}
          >
            What's New
          </h1>
          <p
            className="text-base mb-8"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
          >
            Every update, improvement, and fix — in one place.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[
              { label: 'New Features', value: featureCount, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
              { label: 'Improvements', value: improvementCount, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
              { label: 'Bug Fixes', value: fixCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              { label: 'Releases', value: RELEASES.length, color: '#FF4C4C', bg: 'rgba(255,76,76,0.1)' },
            ].map(stat => (
              <div
                key={stat.label}
                className="flex flex-col items-center px-5 py-3 rounded-xl"
                style={{ backgroundColor: stat.bg }}
              >
                <span className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Releases */}
        {RELEASES.map((release, i) => (
          <ReleaseCard key={release.version} release={release} isDark={isDark} isFirst={i === 0} />
        ))}

        {/* Footer */}
        <div
          className="text-center py-8 text-sm"
          style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
        >
          DojoFlow is actively developed. Updates ship regularly.
        </div>
      </div>
    </div>
  );
}

/**
 * shared/onboarding.ts
 *
 * Pure client/server-shared onboarding definitions.
 * NO server-only imports (no drizzle, no db, no trpc).
 * Safe to import in both client and server code.
 */

// ─── Step definitions ────────────────────────────────────────────────────────

export const ONBOARDING_STEPS = [
  "name",
  "title",
  "profile_photo",
  "programs",
  "rank",
  "school_name",
  "martial_style",
  "address",
  "city_state_zip",
  "phone",
  "email",
  "website",
  "logo_light",
  "logo_dark",
  "complete",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingProfile {
  name: string | null;
  title: string | null;
  profilePhotoUrl?: string | null;
  programs: string[];
  styles: string[];
  schoolName: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostal: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
}

export interface OnboardingState {
  step: OnboardingStep;
  profile: OnboardingProfile;
  completedSteps: OnboardingStep[];
  hasMartialArts: boolean;
}

// ─── Step question messages — directive, mission-driven tone ─────────────────

export function getStepQuestion(step: OnboardingStep, profile: OnboardingProfile): string {
  const titleName = profile.title && profile.name
    ? `${profile.title} ${profile.name}`
    : profile.name || null;

  switch (step) {
    case "name":
      return `**Activation sequence initiated.**\n\nI'm KAI — your dojo's command system. Before I can configure your environment, I need to know who I'm working with.\n\n**What's your name?**`;

    case "title":
      return `**${profile.name}** — locked in.\n\nNow, how should I address you? *(Sensei, Sifu, Coach, Professor, Master, Instructor — or whatever you go by)*`;

    case "profile_photo": {
      const displayName = titleName || profile.name || "there";
      return `**${displayName}** — identity confirmed.\n\nLet's put a face to the command. Upload your **profile photo** — it'll appear across your dashboard and in KAI conversations.\n\n*(You can skip this and add one later in Settings)*`;
    }

    case "programs":
      return `Now let's configure your **program roster**.\n\nWhat disciplines do you teach? List everything — I'll use this to tailor your system.\n\n*(e.g., Brazilian Jiu-Jitsu, Muay Thai, Karate, Gymnastics, Yoga)*`;

    case "rank":
      return `One more thing before we move on — what is your **current rank or belt**?\n\n*(e.g., Black Belt 3rd Degree, Brown Belt, Head Instructor)*`;

    case "school_name": {
      const programList = profile.programs.length > 0
        ? profile.programs.join(", ")
        : null;
      return programList
        ? `**${programList}** — program roster locked in.\n\nNow let's identify your operation. What is the **official name of your school or dojo**?`
        : `Program roster locked in.\n\nNow let's identify your operation. What is the **official name of your school or dojo**?`;
    }

    case "martial_style":
      return `What **martial arts style(s)** do you primarily teach at **${profile.schoolName || "your school"}**?\n\n*(e.g., Brazilian Jiu-Jitsu, Shotokan Karate, Muay Thai)*`;

    case "address":
      return `Let's lock in your location. What is your **school's street address**?`;

    case "city_state_zip":
      return `And the **city, state, and ZIP code**?\n\n*(e.g., Austin, TX 78701)*`;

    case "phone":
      return `What's the **direct phone number** for **${profile.schoolName || "your school"}**?`;

    case "email":
      return `What **email address** should students and leads use to reach you?\n\n*(e.g., info@${profile.schoolName ? profile.schoolName.toLowerCase().replace(/\s+/g, '') + '.com' : 'yourdojo.com'})*`;

    case "website":
      return `Does **${profile.schoolName || "your school"}** have a website? Drop the URL here.\n\n*(e.g., https://yourdojo.com — or skip if you don't have one yet)*`;

    case "logo_light":
      return `Let's brand your command center. Upload your **Day Mode logo** — displayed on light backgrounds.\n\n*PNG or SVG works best. This will appear in your dashboard header.*`;

    case "logo_dark":
      return `Now upload your **Dark Mode logo** — typically a white or light version of your logo for dark backgrounds.\n\n*This is what students and staff will see in dark theme.*`;

    default:
      return "Ready for the next configuration step.";
  }
}

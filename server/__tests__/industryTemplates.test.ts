import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { dojoSettings } from "../../drizzle/schema";
import { getIndustryTemplates, getIndustryTemplateByName, getAllIndustries } from "../services/industryTemplateService";
import { INDUSTRY_TEMPLATES } from "../../shared/industryTemplates";

describe("Industry-Specific Automation Templates", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Database connection is managed globally, no need to close
  });

  it("should have templates for all 5 industries", () => {
    expect(INDUSTRY_TEMPLATES).toHaveLength(5);
    
    const industries = INDUSTRY_TEMPLATES.map(t => t.industry);
    expect(industries).toContain("martial_arts");
    expect(industries).toContain("yoga");
    expect(industries).toContain("fitness");
    expect(industries).toContain("pilates");
    expect(industries).toContain("other");
  });

  it("should have 9 sequences per industry", () => {
    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      expect(industryTemplate.sequences).toHaveLength(9);
    });
  });

  it("martial arts templates should have industry-specific language", () => {
    const martialArtsTemplates = INDUSTRY_TEMPLATES.find(t => t.industry === "martial_arts");
    expect(martialArtsTemplates).toBeDefined();
    
    if (martialArtsTemplates) {
      const welcomeSequence = martialArtsTemplates.sequences.find(s => s.name.includes("Welcome"));
      expect(welcomeSequence).toBeDefined();
      
      if (welcomeSequence) {
        const firstStep = welcomeSequence.steps[0];
        expect(firstStep.sms_body).toContain("🥋"); // Martial arts emoji
        expect(firstStep.sms_body).toContain("martial arts");
      }
    }
  });

  it("yoga templates should have industry-specific language", () => {
    const yogaTemplates = INDUSTRY_TEMPLATES.find(t => t.industry === "yoga");
    expect(yogaTemplates).toBeDefined();
    
    if (yogaTemplates) {
      const welcomeSequence = yogaTemplates.sequences.find(s => s.name.includes("Welcome"));
      expect(welcomeSequence).toBeDefined();
      
      if (welcomeSequence) {
        const firstStep = welcomeSequence.steps[0];
        expect(firstStep.sms_body).toContain("🧘"); // Yoga emoji
        expect(firstStep.sms_body || firstStep.email_body).toContain("Namaste");
      }
    }
  });

  it("fitness templates should have industry-specific language", () => {
    const fitnessTemplates = INDUSTRY_TEMPLATES.find(t => t.industry === "fitness");
    expect(fitnessTemplates).toBeDefined();
    
    if (fitnessTemplates) {
      const welcomeSequence = fitnessTemplates.sequences.find(s => s.name.includes("Welcome"));
      expect(welcomeSequence).toBeDefined();
      
      if (welcomeSequence) {
        const firstStep = welcomeSequence.steps[0];
        expect(firstStep.sms_body).toContain("💪"); // Fitness emoji
        expect(firstStep.sms_body || firstStep.email_body).toContain("fitness");
      }
    }
  });

  it("all templates should include AI chat link variable", () => {
    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      industryTemplate.sequences.forEach(sequence => {
        const hasAiChatLink = sequence.steps.some(step => 
          (step.sms_body && step.sms_body.includes("{{aiChatLink}}")) ||
          (step.email_body && step.email_body.includes("{{aiChatLink}}"))
        );
        expect(hasAiChatLink).toBe(true);
      });
    });
  });

  it("all templates should include AI name variable", () => {
    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      industryTemplate.sequences.forEach(sequence => {
        const hasAiName = sequence.steps.some(step => 
          (step.sms_body && step.sms_body.includes("{{aiName}}")) ||
          (step.email_body && step.email_body.includes("{{aiName}}"))
        );
        expect(hasAiName).toBe(true);
      });
    });
  });

  it("should get templates based on dojo industry setting", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    // Get current industry setting
    const [settings] = await db.select().from(dojoSettings).limit(1);
    
    const templates = await getIndustryTemplates();
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    
    // Should have 9 sequences
    expect(templates).toHaveLength(9);
  });

  it("should get specific template by name", async () => {
    const template = await getIndustryTemplateByName("New Lead Welcome - Martial Arts");
    
    if (template) {
      expect(template.name).toContain("Welcome");
      expect(template.trigger).toBe("lead_created");
      expect(template.steps.length).toBeGreaterThan(0);
    }
  });

  it("should return all industries with metadata", () => {
    const industries = getAllIndustries();
    
    expect(industries).toHaveLength(5);
    industries.forEach(industry => {
      expect(industry).toHaveProperty("industry");
      expect(industry).toHaveProperty("displayName");
      expect(industry).toHaveProperty("templateCount");
      expect(industry.templateCount).toBe(9);
    });
  });

  it("all sequences should have required trigger types", () => {
    const requiredTriggers = [
      "lead_created",
      "trial_scheduled",
      "trial_no_show",
      "trial_attended",
      "enrollment_completed",
      "attendance_dropped",
      "payment_failed",
      "monthly_newsletter",
      "attendance_milestone"
    ];

    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      const triggers = industryTemplate.sequences.map(s => s.trigger);
      
      requiredTriggers.forEach(requiredTrigger => {
        expect(triggers).toContain(requiredTrigger);
      });
    });
  });

  it("all templates should include business variables", () => {
    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      industryTemplate.sequences.forEach(sequence => {
        const hasBusinessName = sequence.steps.some(step => 
          (step.sms_body && step.sms_body.includes("{{businessName}}")) ||
          (step.email_body && step.email_body.includes("{{businessName}}"))
        );
        expect(hasBusinessName).toBe(true);
      });
    });
  });

  it("email steps should have both subject and body", () => {
    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      industryTemplate.sequences.forEach(sequence => {
        sequence.steps.forEach(step => {
          if (step.type === "send_email") {
            expect(step.email_subject).toBeDefined();
            expect(step.email_subject).not.toBe("");
            expect(step.email_body).toBeDefined();
            expect(step.email_body).not.toBe("");
          }
        });
      });
    });
  });

  it("SMS steps should have body text", () => {
    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      industryTemplate.sequences.forEach(sequence => {
        sequence.steps.forEach(step => {
          if (step.type === "send_sms") {
            expect(step.sms_body).toBeDefined();
            expect(step.sms_body).not.toBe("");
          }
        });
      });
    });
  });

  it("wait steps should have delay_minutes", () => {
    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      industryTemplate.sequences.forEach(sequence => {
        sequence.steps.forEach(step => {
          if (step.type === "wait") {
            expect(step.delay_minutes).toBeDefined();
            expect(step.delay_minutes).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  it("steps should be ordered correctly", () => {
    INDUSTRY_TEMPLATES.forEach(industryTemplate => {
      industryTemplate.sequences.forEach(sequence => {
        const orders = sequence.steps.map(s => s.order);
        
        // Check that orders start at 1
        expect(Math.min(...orders)).toBe(1);
        
        // Check that orders are sequential
        for (let i = 0; i < orders.length - 1; i++) {
          expect(orders[i + 1]).toBe(orders[i] + 1);
        }
      });
    });
  });
});

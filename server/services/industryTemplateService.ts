/**
 * Industry-Specific Template Service
 * Returns automation templates based on the dojo's industry setting
 */

import { getDb } from "../db";
import { dojoSettings } from "../../drizzle/schema";
import { INDUSTRY_TEMPLATES, getTemplatesForIndustry, type AutomationSequenceTemplate } from "../../shared/industryTemplates";

/**
 * Get automation templates for the current dojo's industry
 */
export async function getIndustryTemplates(): Promise<AutomationSequenceTemplate[]> {
  const db = await getDb();
  
  if (!db) {
    console.error("Database not available");
    return [];
  }

  try {
    // Get dojo settings to determine industry
    const [settings] = await db.select().from(dojoSettings).limit(1);
    
    if (!settings || !settings.industry) {
      console.log("No industry set, returning martial arts templates as default");
      return getTemplatesForIndustry("martial_arts");
    }

    // Map industry values to template keys
    const industryMap: Record<string, string> = {
      "Martial Arts": "martial_arts",
      "Yoga Studio": "yoga",
      "Fitness Gym": "fitness",
      "Pilates/Barre": "pilates",
      "Other": "other"
    };

    const industryKey = industryMap[settings.industry] || "martial_arts";
    
    console.log(`Loading templates for industry: ${settings.industry} (${industryKey})`);
    return getTemplatesForIndustry(industryKey);
  } catch (error) {
    console.error("Error getting industry templates:", error);
    return getTemplatesForIndustry("martial_arts"); // Default fallback
  }
}

/**
 * Get a specific template by name for the current industry
 */
export async function getIndustryTemplateByName(templateName: string): Promise<AutomationSequenceTemplate | null> {
  const templates = await getIndustryTemplates();
  return templates.find(t => t.name === templateName) || null;
}

/**
 * Get all available industries with their template counts
 */
export function getAllIndustries() {
  return INDUSTRY_TEMPLATES.map(industry => ({
    industry: industry.industry,
    displayName: getIndustryDisplayName(industry.industry),
    templateCount: industry.sequences.length
  }));
}

/**
 * Convert industry key to display name
 */
function getIndustryDisplayName(industryKey: string): string {
  const displayNames: Record<string, string> = {
    "martial_arts": "Martial Arts",
    "yoga": "Yoga Studio",
    "fitness": "Fitness Gym",
    "pilates": "Pilates/Barre",
    "other": "Other Studio"
  };
  return displayNames[industryKey] || industryKey;
}

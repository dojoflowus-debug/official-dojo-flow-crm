import { invokeLLM } from "./_core/llm";

// Types for extracted schedule data
export type ExtractedClass = {
  name: string;
  dayOfWeek: string; // Monday, Tuesday, etc.
  startTime: string; // HH:MM format (24-hour)
  endTime: string; // HH:MM format (24-hour)
  instructor?: string;
  location?: string;
  level?: string; // Beginner, Intermediate, Advanced, All Levels
  maxCapacity?: number;
  notes?: string;
};

export type ScheduleExtractionResult = {
  success: boolean;
  classes: ExtractedClass[];
  rawText?: string;
  confidence: number; // 0-1
  warnings?: string[];
  error?: string;
};

// JSON schema for structured extraction
const scheduleSchema = {
  name: "schedule_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Whether schedule data was successfully extracted",
      },
      classes: {
        type: "array",
        description: "List of extracted classes",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the class (e.g., 'Kids Karate', 'Adult BJJ', 'Yoga Flow')",
            },
            dayOfWeek: {
              type: "string",
              enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              description: "Day of the week the class occurs",
            },
            startTime: {
              type: "string",
              description: "Start time in HH:MM 24-hour format (e.g., '09:00', '18:30')",
            },
            endTime: {
              type: "string",
              description: "End time in HH:MM 24-hour format (e.g., '10:00', '20:00')",
            },
            instructor: {
              type: "string",
              description: "Name of the instructor if mentioned",
            },
            location: {
              type: "string",
              description: "Room or location if mentioned",
            },
            level: {
              type: "string",
              enum: ["Beginner", "Intermediate", "Advanced", "All Levels", "Kids", "Adults"],
              description: "Skill level or age group if mentioned",
            },
            maxCapacity: {
              type: "number",
              description: "Maximum class capacity if mentioned",
            },
            notes: {
              type: "string",
              description: "Any additional notes about the class",
            },
          },
          required: ["name", "dayOfWeek", "startTime", "endTime"],
          additionalProperties: false,
        },
      },
      confidence: {
        type: "number",
        description: "Confidence score from 0 to 1 indicating how certain the extraction is",
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description: "Any warnings about ambiguous or unclear data",
      },
    },
    required: ["success", "classes", "confidence"],
    additionalProperties: false,
  },
};

// Extract schedule from image URL (for photos of schedules)
export async function extractScheduleFromImage(
  imageUrl: string,
  additionalContext?: string
): Promise<ScheduleExtractionResult> {
  try {
    const systemPrompt = `You are a schedule extraction assistant for a martial arts dojo management system called DojoFlow.
Your task is to analyze images of class schedules and extract structured class information.

Guidelines:
- Extract all classes visible in the schedule
- Convert times to 24-hour HH:MM format
- Infer class names from context (e.g., "BJJ" = "Brazilian Jiu-Jitsu", "MT" = "Muay Thai")
- If a class repeats on multiple days, create separate entries for each day
- If end time is not specified, estimate based on typical class duration (45-60 min for kids, 60-90 min for adults)
- Set confidence based on image clarity and data completeness
- Add warnings for any ambiguous or unclear information

Common martial arts class types:
- Karate, Taekwondo, Judo, Brazilian Jiu-Jitsu (BJJ), Muay Thai, Kickboxing
- Kids classes, Adult classes, Competition/Advanced classes
- Open mat, Sparring, Fundamentals`;

    const userPrompt = additionalContext 
      ? `Please extract the class schedule from this image. Additional context: ${additionalContext}`
      : "Please extract the class schedule from this image.";

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: scheduleSchema,
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content) as ScheduleExtractionResult;
      return parsed;
    }

    return {
      success: false,
      classes: [],
      confidence: 0,
      error: "Failed to parse LLM response",
    };
  } catch (error) {
    console.error("Schedule extraction failed:", error);
    return {
      success: false,
      classes: [],
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Extract schedule from text content (for PDFs or plain text)
export async function extractScheduleFromText(
  textContent: string,
  additionalContext?: string
): Promise<ScheduleExtractionResult> {
  try {
    const systemPrompt = `You are a schedule extraction assistant for a martial arts dojo management system called DojoFlow.
Your task is to analyze text content containing class schedules and extract structured class information.

Guidelines:
- Extract all classes mentioned in the text
- Convert times to 24-hour HH:MM format
- Infer class names from context (e.g., "BJJ" = "Brazilian Jiu-Jitsu", "MT" = "Muay Thai")
- If a class repeats on multiple days, create separate entries for each day
- If end time is not specified, estimate based on typical class duration (45-60 min for kids, 60-90 min for adults)
- Set confidence based on data completeness and clarity
- Add warnings for any ambiguous or unclear information

Common martial arts class types:
- Karate, Taekwondo, Judo, Brazilian Jiu-Jitsu (BJJ), Muay Thai, Kickboxing
- Kids classes, Adult classes, Competition/Advanced classes
- Open mat, Sparring, Fundamentals`;

    const userPrompt = additionalContext 
      ? `Please extract the class schedule from this text. Additional context: ${additionalContext}\n\nSchedule text:\n${textContent}`
      : `Please extract the class schedule from this text:\n\n${textContent}`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: scheduleSchema,
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content) as ScheduleExtractionResult;
      parsed.rawText = textContent;
      return parsed;
    }

    return {
      success: false,
      classes: [],
      confidence: 0,
      error: "Failed to parse LLM response",
    };
  } catch (error) {
    console.error("Schedule extraction failed:", error);
    return {
      success: false,
      classes: [],
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper to convert 24-hour time to 12-hour format for display
export function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Helper to get day abbreviation
export function getDayAbbreviation(day: string): string {
  const abbrevs: Record<string, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };
  return abbrevs[day] || day.slice(0, 3);
}

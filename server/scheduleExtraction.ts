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

// Extract schedule from image URL (for photos of schedules)
export async function extractScheduleFromImage(
  imageUrl: string,
  additionalContext?: string
): Promise<ScheduleExtractionResult> {
  try {
    const systemPrompt = `You are a schedule extraction assistant for a martial arts dojo management system called DojoFlow.
Your task is to analyze images of class schedules and extract structured class information.

You MUST respond with a valid JSON object in this exact format:
{
  "success": true,
  "classes": [
    {
      "name": "Class Name",
      "dayOfWeek": "Monday",
      "startTime": "16:30",
      "endTime": "17:30",
      "instructor": "Instructor Name",
      "location": "Room A",
      "level": "Beginner",
      "maxCapacity": 20,
      "notes": "Any notes"
    }
  ],
  "confidence": 0.95,
  "warnings": []
}

Guidelines:
- Extract all classes visible in the schedule
- Convert times to 24-hour HH:MM format (e.g., 4:30 PM = "16:30")
- dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- If a class repeats on multiple days, create separate entries for each day
- If end time is not specified, estimate based on typical class duration (45-60 min for kids, 60-90 min for adults)
- Set confidence based on image clarity and data completeness (0.0 to 1.0)
- Add warnings for any ambiguous or unclear information`;

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
        type: "json_object",
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

You MUST respond with a valid JSON object in this exact format:
{
  "success": true,
  "classes": [
    {
      "name": "Class Name",
      "dayOfWeek": "Monday",
      "startTime": "16:30",
      "endTime": "17:30",
      "instructor": "Instructor Name",
      "location": "Room A",
      "level": "Beginner",
      "maxCapacity": 20,
      "notes": "Any notes"
    }
  ],
  "confidence": 0.95,
  "warnings": []
}

Guidelines:
- Extract all classes mentioned in the text
- Convert times to 24-hour HH:MM format (e.g., 4:30 PM = "16:30")
- dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- If a class repeats on multiple days (e.g., "Mon, Wed"), create separate entries for each day
- If end time is not specified, estimate based on typical class duration (45-60 min for kids, 60-90 min for adults)
- Set confidence based on data completeness and clarity (0.0 to 1.0)
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
        type: "json_object",
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

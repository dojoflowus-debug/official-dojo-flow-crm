import { invokeLLM } from "./_core/llm";
import * as XLSX from "xlsx";

// Types for extracted student data
export type ExtractedStudent = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD format
  beltRank?: string;
  program?: string; // Kids, Teens, Adults
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  membershipStatus?: string; // Active, Trial, Inactive
};

export type RosterExtractionResult = {
  success: boolean;
  students: ExtractedStudent[];
  rawText?: string;
  confidence: number; // 0-1
  warnings?: string[];
  error?: string;
  totalFound: number;
};

// JSON schema for structured extraction
const rosterSchema = {
  name: "roster_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Whether student data was successfully extracted",
      },
      students: {
        type: "array",
        description: "List of extracted students",
        items: {
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "Student's first name",
            },
            lastName: {
              type: "string",
              description: "Student's last name",
            },
            email: {
              type: "string",
              description: "Student's email address if available",
            },
            phone: {
              type: "string",
              description: "Student's phone number if available (format: XXX-XXX-XXXX)",
            },
            dateOfBirth: {
              type: "string",
              description: "Date of birth in YYYY-MM-DD format if available",
            },
            beltRank: {
              type: "string",
              enum: ["White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Red", "Black", "None"],
              description: "Current belt rank if mentioned",
            },
            program: {
              type: "string",
              enum: ["Kids", "Teens", "Adults", "Family", "Competition"],
              description: "Program or age group if mentioned",
            },
            guardianName: {
              type: "string",
              description: "Parent or guardian name for minors",
            },
            guardianPhone: {
              type: "string",
              description: "Parent or guardian phone number",
            },
            guardianEmail: {
              type: "string",
              description: "Parent or guardian email",
            },
            address: {
              type: "string",
              description: "Street address if available",
            },
            city: {
              type: "string",
              description: "City if available",
            },
            state: {
              type: "string",
              description: "State abbreviation if available (e.g., TX, CA)",
            },
            zipCode: {
              type: "string",
              description: "ZIP code if available",
            },
            notes: {
              type: "string",
              description: "Any additional notes about the student",
            },
            membershipStatus: {
              type: "string",
              enum: ["Active", "Trial", "Inactive", "Pending"],
              description: "Membership status if mentioned",
            },
          },
          required: ["firstName", "lastName"],
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
      totalFound: {
        type: "number",
        description: "Total number of students found in the document",
      },
    },
    required: ["success", "students", "confidence", "totalFound"],
    additionalProperties: false,
  },
};

// Extract roster from image URL (for photos of rosters, sign-in sheets)
export async function extractRosterFromImage(
  imageUrl: string,
  additionalContext?: string
): Promise<RosterExtractionResult> {
  try {
    const systemPrompt = `You are a student roster extraction assistant for a martial arts dojo management system called DojoFlow.
Your task is to analyze images of student rosters, sign-in sheets, or enrollment lists and extract structured student information.

Guidelines:
- Extract all student names visible in the document
- Look for columns or fields containing: names, phone numbers, emails, belt ranks, ages/DOB, guardian info
- Parse phone numbers to XXX-XXX-XXXX format
- Convert dates to YYYY-MM-DD format
- Infer program (Kids/Teens/Adults) from age if available (Kids: 4-12, Teens: 13-17, Adults: 18+)
- If guardian info is present, the student is likely a minor
- Set confidence based on image clarity and data completeness
- Add warnings for any ambiguous or unclear information (e.g., illegible handwriting)

Common belt rank systems:
- Traditional: White, Yellow, Orange, Green, Blue, Purple, Brown, Black
- Some schools use stripes or tips between ranks
- "No belt" or blank usually means White belt beginner`;

    const userPrompt = additionalContext 
      ? `Please extract the student roster from this image. Additional context: ${additionalContext}`
      : "Please extract the student roster from this image. Look for student names, contact information, belt ranks, and any guardian/parent information.";

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
        json_schema: rosterSchema,
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content) as RosterExtractionResult;
      return parsed;
    }

    return {
      success: false,
      students: [],
      confidence: 0,
      totalFound: 0,
      error: "Failed to parse LLM response",
    };
  } catch (error) {
    console.error("Roster extraction failed:", error);
    return {
      success: false,
      students: [],
      confidence: 0,
      totalFound: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Extract roster from text content (for CSV, plain text, or parsed spreadsheets)
export async function extractRosterFromText(
  textContent: string,
  additionalContext?: string
): Promise<RosterExtractionResult> {
  try {
    const systemPrompt = `You are a student roster extraction assistant for a martial arts dojo management system called DojoFlow.
Your task is to analyze text content containing student information and extract structured data.

Guidelines:
- Extract all students mentioned in the text
- Parse CSV, tab-separated, or plain text formats
- Look for columns/fields: names, phone numbers, emails, belt ranks, ages/DOB, guardian info
- Parse phone numbers to XXX-XXX-XXXX format
- Convert dates to YYYY-MM-DD format
- Infer program (Kids/Teens/Adults) from age if available (Kids: 4-12, Teens: 13-17, Adults: 18+)
- If guardian info is present, the student is likely a minor
- Set confidence based on data completeness and clarity
- Add warnings for any ambiguous or unclear information

Common belt rank systems:
- Traditional: White, Yellow, Orange, Green, Blue, Purple, Brown, Black
- Some schools use stripes or tips between ranks
- "No belt" or blank usually means White belt beginner`;

    const userPrompt = additionalContext 
      ? `Please extract the student roster from this text. Additional context: ${additionalContext}\n\nRoster data:\n${textContent}`
      : `Please extract the student roster from this text:\n\n${textContent}`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: rosterSchema,
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content) as RosterExtractionResult;
      parsed.rawText = textContent;
      return parsed;
    }

    return {
      success: false,
      students: [],
      confidence: 0,
      totalFound: 0,
      error: "Failed to parse LLM response",
    };
  } catch (error) {
    console.error("Roster extraction failed:", error);
    return {
      success: false,
      students: [],
      confidence: 0,
      totalFound: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Parse CSV content into text for extraction
export function parseCSVToText(csvContent: string): string {
  const trimmed = csvContent.trim();
  if (!trimmed) return "";
  
  const lines = trimmed.split("\n");
  if (lines.length === 0) return "";
  
  // Try to detect delimiter (comma, tab, semicolon)
  const firstLine = lines[0];
  let delimiter = ",";
  if (firstLine.includes("\t")) delimiter = "\t";
  else if (firstLine.includes(";")) delimiter = ";";
  
  // Parse header row
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ""));
  
  // Build formatted text
  let result = `Headers: ${headers.join(", ")}\n\n`;
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ""));
    const row: string[] = [];
    headers.forEach((header, idx) => {
      if (values[idx]) {
        row.push(`${header}: ${values[idx]}`);
      }
    });
    if (row.length > 0) {
      result += `Student ${i}: ${row.join(", ")}\n`;
    }
  }
  
  return result;
}

// Parse Excel content into text for extraction
export function parseExcelToText(buffer: Buffer): string {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return "";
    
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return "";
    
    // Convert to JSON to get structured data
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });
    if (jsonData.length === 0) return "";
    
    // First row is headers
    const headers = (jsonData[0] as unknown[]).map(h => String(h || "").trim());
    if (headers.length === 0) return "";
    
    // Build formatted text
    let result = `Headers: ${headers.join(", ")}\n\n`;
    
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i] as unknown[];
      if (!rowData || rowData.length === 0) continue;
      
      const row: string[] = [];
      headers.forEach((header, idx) => {
        const value = rowData[idx];
        if (value !== undefined && value !== null && value !== "") {
          row.push(`${header}: ${String(value)}`);
        }
      });
      
      if (row.length > 0) {
        result += `Student ${i}: ${row.join(", ")}\n`;
      }
    }
    
    return result;
  } catch (error) {
    console.error("Excel parsing error:", error);
    return "";
  }
}

// Parse Excel from URL (fetches and parses)
export async function parseExcelFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return parseExcelToText(buffer);
  } catch (error) {
    console.error("Failed to fetch Excel file:", error);
    return "";
  }
}

// Helper to format phone number
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone; // Return original if can't parse
}

// Helper to calculate age from date of birth
export function calculateAge(dateOfBirth: string): number | null {
  try {
    const dob = new Date(dateOfBirth);
    // Check if date is valid
    if (isNaN(dob.getTime())) {
      return null;
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

// Helper to infer program from age
export function inferProgramFromAge(age: number): string {
  if (age >= 4 && age <= 12) return "Kids";
  if (age >= 13 && age <= 17) return "Teens";
  return "Adults";
}

// Helper to get belt color for display
export function getBeltColor(belt: string): string {
  const colors: Record<string, string> = {
    White: "#FFFFFF",
    Yellow: "#FFD700",
    Orange: "#FFA500",
    Green: "#228B22",
    Blue: "#0000FF",
    Purple: "#800080",
    Brown: "#8B4513",
    Red: "#FF0000",
    Black: "#000000",
    None: "#CCCCCC",
  };
  return colors[belt] || "#CCCCCC";
}

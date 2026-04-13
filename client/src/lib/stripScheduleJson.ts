/**
 * Strips any [SCHEDULE_JSON:{...}] block from a string using bracket counting.
 * This is a client-side safety net to ensure the raw JSON never appears in the UI.
 * The server should strip it first, but this handles any edge cases.
 */
export function stripScheduleJson(text: string): string {
  if (!text || !text.includes('[SCHEDULE_JSON:')) return text;

  let result = text;
  // Loop in case there are multiple blocks (shouldn't happen, but be safe)
  while (result.includes('[SCHEDULE_JSON:')) {
    const tagIdx = result.indexOf('[SCHEDULE_JSON:');
    const jsonStart = tagIdx + '[SCHEDULE_JSON:'.length;
    let depth = 0;
    let jsonEnd = -1;

    for (let i = jsonStart; i < result.length; i++) {
      if (result[i] === '{') depth++;
      else if (result[i] === '}') {
        depth--;
        if (depth === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }

    // Find the closing ] after the JSON object
    const closingBracket = jsonEnd !== -1 ? result.indexOf(']', jsonEnd) : -1;
    const removeUntil = closingBracket !== -1
      ? closingBracket + 1
      : jsonEnd !== -1
        ? jsonEnd
        : result.length;

    result = (result.slice(0, tagIdx) + result.slice(removeUntil)).trim();
  }

  return result;
}

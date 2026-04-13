/**
 * Tests for the SCHEDULE_JSON extraction logic in the kai.chat handler.
 * Verifies that the regex correctly parses the structured block from Kai's vision response.
 */

describe('SCHEDULE_JSON extraction from Kai vision response', () => {
  // Replicates the extraction logic from routers.ts kai.chat handler
  function extractScheduleJson(response: string): { scheduleImportData: any | null; cleanedResponse: string } {
    let scheduleImportData: any = null;
    let cleanedResponse = response;
    const scheduleJsonMatch = cleanedResponse.match(/\[SCHEDULE_JSON:(\{.*?\})]\s*$/s);
    if (scheduleJsonMatch) {
      try {
        scheduleImportData = JSON.parse(scheduleJsonMatch[1]);
        cleanedResponse = cleanedResponse.replace(scheduleJsonMatch[0], '').trim();
      } catch (e) {
        // parse error — leave scheduleImportData null
      }
    }
    return { scheduleImportData, cleanedResponse };
  }

  it('should extract schedule JSON from a response that ends with the block', () => {
    const response = `Here is the class schedule I found in your image:

- Dragon Kids: Monday 5:00 PM - 6:00 PM
- Adult Kickboxing: Wednesday 7:00 PM - 8:00 PM

[SCHEDULE_JSON:{"classes":[{"name":"Dragon Kids","dayOfWeek":"Monday","startTime":"17:00","endTime":"18:00","instructor":"Master Holmes","location":"MyDojo HQ"},{"name":"Adult Kickboxing","dayOfWeek":"Wednesday","startTime":"19:00","endTime":"20:00","instructor":"Coach Smith","location":"MyDojo HQ"}]}]`;

    const { scheduleImportData, cleanedResponse } = extractScheduleJson(response);

    expect(scheduleImportData).not.toBeNull();
    expect(scheduleImportData.classes).toHaveLength(2);
    expect(scheduleImportData.classes[0].name).toBe('Dragon Kids');
    expect(scheduleImportData.classes[0].dayOfWeek).toBe('Monday');
    expect(scheduleImportData.classes[0].startTime).toBe('17:00');
    expect(scheduleImportData.classes[1].name).toBe('Adult Kickboxing');
    // Cleaned response should not contain the JSON block
    expect(cleanedResponse).not.toContain('[SCHEDULE_JSON:');
    expect(cleanedResponse).toContain('Dragon Kids');
  });

  it('should return null scheduleImportData when no block is present', () => {
    const response = `Here is some general information about your dojo. You have 42 active students.`;
    const { scheduleImportData, cleanedResponse } = extractScheduleJson(response);
    expect(scheduleImportData).toBeNull();
    expect(cleanedResponse).toBe(response);
  });

  it('should return null scheduleImportData when JSON is malformed', () => {
    const response = `Some text\n[SCHEDULE_JSON:{invalid json here}]`;
    const { scheduleImportData, cleanedResponse } = extractScheduleJson(response);
    expect(scheduleImportData).toBeNull();
  });

  it('should handle a schedule with a single class', () => {
    const response = `I found one class:\n\n[SCHEDULE_JSON:{"classes":[{"name":"Tiny Tigers","dayOfWeek":"Tuesday","startTime":"16:00","endTime":"16:45"}]}]`;
    const { scheduleImportData, cleanedResponse } = extractScheduleJson(response);
    expect(scheduleImportData).not.toBeNull();
    expect(scheduleImportData.classes).toHaveLength(1);
    expect(scheduleImportData.classes[0].name).toBe('Tiny Tigers');
    expect(cleanedResponse).not.toContain('[SCHEDULE_JSON:');
  });

  it('should not match a SCHEDULE_JSON block that is not at the end of the response', () => {
    // The regex uses $ anchor so mid-response blocks should not match
    const response = `[SCHEDULE_JSON:{"classes":[]}]\n\nSome text after the block.`;
    const { scheduleImportData } = extractScheduleJson(response);
    // Since the block is not at the end, it should NOT match
    expect(scheduleImportData).toBeNull();
  });

  it('should correctly strip the block and preserve the human-readable response', () => {
    const humanText = `I found 3 classes in your schedule image. Here they are:\n\n- Dragon Kids (Mon 5–6 PM)\n- Teen Martial Arts (Wed 6–7 PM)\n- Adult BJJ (Fri 7–8 PM)`;
    const block = `\n\n[SCHEDULE_JSON:{"classes":[{"name":"Dragon Kids","dayOfWeek":"Monday","startTime":"17:00","endTime":"18:00"},{"name":"Teen Martial Arts","dayOfWeek":"Wednesday","startTime":"18:00","endTime":"19:00"},{"name":"Adult BJJ","dayOfWeek":"Friday","startTime":"19:00","endTime":"20:00"}]}]`;
    const response = humanText + block;

    const { scheduleImportData, cleanedResponse } = extractScheduleJson(response);
    expect(scheduleImportData.classes).toHaveLength(3);
    expect(cleanedResponse.trim()).toBe(humanText.trim());
  });
});

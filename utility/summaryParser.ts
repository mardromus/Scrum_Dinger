import { ActionItem } from '../types';

/**
 * Parses a Markdown summary from Gemini to extract action items.
 * Action items are expected to be on lines starting with "[ ] ".
 * @param summary The raw Markdown string from the Gemini API.
 * @returns An array of ActionItem objects.
 */
export function parseSummaryForActionItems(summary: string): ActionItem[] {
  if (!summary) {
    return [];
  }

  const actionItems: ActionItem[] = [];
  const lines = summary.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Match lines that start with "[ ] " and capture the text after it.
    if (trimmedLine.startsWith('[ ] ')) {
      const text = trimmedLine.substring(4).trim();
      if (text) {
        actionItems.push({
          text,
          completed: false,
        });
      }
    }
  }

  return actionItems;
}

/**
 * Parses a Markdown summary to extract blocker items.
 * @param summary The raw Markdown string from the Gemini API.
 * @returns An array of strings, each representing a blocker.
 */
export function parseSummaryForBlockers(summary: string): string[] {
  if (!summary) {
    return [];
  }

  const blockers: string[] = [];
  const lines = summary.split('\n');
  let inBlockersSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.match(/\*\*Blockers(\*?):\*\*/i)) {
      inBlockersSection = true;
      continue;
    }
    
    // Stop if we hit another section
    if (inBlockersSection && trimmedLine.match(/\*\*.*\*\*:/)) {
        break;
    }

    if (inBlockersSection) {
      // Match lines that start with a bullet point (* or -).
      const match = trimmedLine.match(/^(\*|-)\s+(.*)/);
      if (match && match[2]) {
        const text = match[2].trim();
        if (text.toLowerCase() !== 'none.') {
          blockers.push(text);
        }
      }
    }
  }

  return blockers;
}


/**
 * Parses a full meeting transcript to extract all updates for a specific member.
 * @param transcript The full transcript string.
 * @param memberName The name of the member whose updates to find.
 * @returns An array of strings, each being an update from that member.
 */
export function parseTranscriptForMember(transcript: string, memberName: string): string[] {
  if (!transcript) {
    return [];
  }
  
  const updates: string[] = [];
  const lines = transcript.split('\n');
  let isCapturing = false;
  let currentUpdate = '';
  
  // Use a regex that is case-insensitive and handles potential spaces around the name
  const speakerRegex = new RegExp(`^\\[\\s*${memberName}\\s*\\]:`, 'i');
  const anySpeakerRegex = /^\[.*?\]:/;

  for (const line of lines) {
    if (speakerRegex.test(line)) {
      if (currentUpdate.trim()) {
        updates.push(currentUpdate.trim());
      }
      isCapturing = true;
      currentUpdate = ''; // Reset for the new update
    } else if (anySpeakerRegex.test(line)) {
      if (currentUpdate.trim()) {
        updates.push(currentUpdate.trim());
      }
      isCapturing = false;
      currentUpdate = '';
    } else if (isCapturing) {
      currentUpdate += line + '\n';
    }
  }
  
  // Add the last captured update if it exists
  if (isCapturing && currentUpdate.trim()) {
    updates.push(currentUpdate.trim());
  }
  
  return updates;
}

// ============================================================
// Robust JSON Extraction from LLM Responses
// ============================================================
// LLMs frequently wrap JSON in markdown fences, add explanatory
// text before/after, or produce slightly malformed output.
// This module handles all those cases gracefully.

/**
 * Extract and parse JSON from an LLM response string.
 * Handles: markdown code fences, leading/trailing text,
 * thinking blocks, and nested brace matching.
 */
export function extractJSON<T = unknown>(raw: string): {
  data: T | null;
  error: string | null;
  cleaned: string;
} {
  if (!raw || typeof raw !== "string") {
    return { data: null, error: "Empty or invalid input", cleaned: "" };
  }

  let cleaned = raw.trim();

  // Step 1: Remove markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = cleaned.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Step 2: Remove <think>...</think> or <thinking>...</thinking> blocks
  cleaned = cleaned.replace(/<think(?:ing)?[\s\S]*?<\/think(?:ing)?>/gi, "").trim();

  // Step 3: Try direct parse first (fastest path)
  try {
    const data = JSON.parse(cleaned) as T;
    return { data, error: null, cleaned };
  } catch {
    // Continue to more aggressive extraction
  }

  // Step 4: Find the outermost balanced JSON object using brace matching
  const jsonStr = extractBalancedJSON(cleaned);
  if (jsonStr) {
    try {
      const data = JSON.parse(jsonStr) as T;
      return { data, error: null, cleaned: jsonStr };
    } catch (e) {
      // Step 5: Try to fix common JSON issues (multi-pass)
      const fixed = fixCommonJSONIssues(jsonStr);
      try {
        const data = JSON.parse(fixed) as T;
        return { data, error: null, cleaned: fixed };
      } catch {
        // Step 6: Second pass — apply fixes again on the already-fixed result
        const fixed2 = fixCommonJSONIssues(fixed);
        try {
          const data = JSON.parse(fixed2) as T;
          return { data, error: null, cleaned: fixed2 };
        } catch {
          return {
            data: null,
            error: `JSON parse failed: ${e instanceof Error ? e.message : "unknown"}`,
            cleaned: jsonStr.substring(0, 500),
          };
        }
      }
    }
  }

  return {
    data: null,
    error: "No JSON object found in response",
    cleaned: raw.substring(0, 500),
  };
}

/**
 * Extract the first balanced JSON object from a string
 * by counting braces (handles nested objects correctly).
 */
function extractBalancedJSON(str: string): string | null {
  const startIdx = str.indexOf("{");
  if (startIdx === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < str.length; i++) {
    const ch = str[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return str.substring(startIdx, i + 1);
      }
    }
  }

  // If we reach here, braces are unbalanced — try truncating to last }
  const lastBrace = str.lastIndexOf("}");
  if (lastBrace > startIdx) {
    return str.substring(startIdx, lastBrace + 1);
  }

  return null;
}

/**
 * Fix common JSON formatting issues from LLM output.
 * Multi-pass repair pipeline:
 * 1. Remove trailing commas
 * 2. Insert missing commas between elements
 * 3. Fix unescaped newlines/quotes in strings
 * 4. Repair truncated structures
 */
function fixCommonJSONIssues(json: string): string {
  let fixed = json;

  // Pass 1: Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*([\]}])/g, "$1");

  // Pass 2: Insert missing commas between array/object elements
  fixed = insertMissingCommas(fixed);

  // Pass 3: Fix unescaped newlines inside string values
  fixed = fixed.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n");

  // Pass 4: Attempt to repair truncated JSON by closing open structures
  fixed = repairTruncatedJSON(fixed);

  return fixed;
}

/**
 * Insert missing commas between adjacent JSON elements.
 * Handles the common LLM error where commas are omitted:
 *   ["a" "b"]  →  ["a", "b"]
 *   {"k":"v" "k2":"v2"}  →  {"k":"v", "k2":"v2"}
 *   {"k": 1 "k2": 2}  →  {"k": 1, "k2": 2}
 */
function insertMissingCommas(json: string): string {
  const result: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escape) {
      escape = false;
      result.push(ch);
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      result.push(ch);
      continue;
    }
    if (ch === '"') {
      // Before opening a new string, check if we need a comma
      if (!inString) {
        // Look backward past whitespace to see what preceded this quote
        const preceding = getPrecedingNonWhitespace(json, i);
        if (needsComma(preceding)) {
          result.push(",");
        }
      }
      inString = !inString;
      result.push(ch);
      continue;
    }

    if (inString) {
      result.push(ch);
      continue;
    }

    // Outside a string — check for value starts that need a preceding comma
    if (/[\d\-tfn{\[]/.test(ch)) {
      const preceding = getPrecedingNonWhitespace(json, i);
      if (needsComma(preceding)) {
        result.push(",");
      }
    }

    result.push(ch);
  }

  return result.join("");
}

/** Get the last non-whitespace character before position i */
function getPrecedingNonWhitespace(s: string, i: number): string {
  for (let j = i - 1; j >= 0; j--) {
    if (!/\s/.test(s[j])) return s[j];
  }
  return "";
}

/**
 * Determine if a comma should be inserted before the current token
 * based on what character preceded it (ignoring whitespace).
 * A comma is needed when the preceding char is a value-ending token
 * (closing quote, digit, ], }, true/false/null end chars)
 * and the current char is a value-starting token.
 */
function needsComma(preceding: string): boolean {
  // These characters end a value: " ] } digit or boolean/null end chars
  return /["\]\}\d]/.test(preceding);
}

/**
 * Attempt to repair truncated JSON by closing any unclosed
 * strings, arrays, and objects.  This handles the common case
 * where the LLM output is cut off mid-response.
 */
function repairTruncatedJSON(json: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = []; // tracks open { and [

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  // If still inside a string, close it
  let suffix = "";
  if (inString) {
    suffix += '"';
  }

  // Remove any trailing comma before we close
  let trimmed = json.trimEnd();
  if (suffix === "") {
    trimmed = trimmed.replace(/,\s*$/, "");
  }

  // Close any remaining open brackets/braces
  while (stack.length > 0) {
    suffix += stack.pop();
  }

  if (suffix) {
    return trimmed + suffix;
  }
  return json;
}

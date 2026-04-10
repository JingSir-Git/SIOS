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
    // Try parsing as-is
    try {
      const data = JSON.parse(jsonStr) as T;
      return { data, error: null, cleaned: jsonStr };
    } catch {
      // Continue to repair pipeline
    }

    // Step 5: Multi-pass repair pipeline (up to 3 passes)
    let candidate = jsonStr;
    for (let pass = 0; pass < 3; pass++) {
      candidate = fixCommonJSONIssues(candidate);
      try {
        const data = JSON.parse(candidate) as T;
        return { data, error: null, cleaned: candidate };
      } catch {
        // Continue to next pass
      }
    }

    // Step 6: Aggressive regex-based repair as last resort
    const aggressiveFixed = aggressiveJSONRepair(candidate);
    try {
      const data = JSON.parse(aggressiveFixed) as T;
      return { data, error: null, cleaned: aggressiveFixed };
    } catch (e) {
      return {
        data: null,
        error: `JSON parse failed: ${e instanceof Error ? e.message : "unknown"}`,
        cleaned: jsonStr.substring(0, 500),
      };
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
 * 1. Normalize problematic unicode characters
 * 2. Fix broken escape sequences (critical for Chinese text)
 * 3. Fix unescaped control characters inside strings
 * 4. Remove trailing commas
 * 5. Insert missing commas between elements
 * 6. Repair truncated structures
 */
function fixCommonJSONIssues(json: string): string {
  let fixed = json;

  // Pass 0: Replace smart/curly quotes that LLMs love to insert
  fixed = fixed.replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"'); // "" → "
  fixed = fixed.replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'"); // '' → '

  // Pass 0.5: Remove JavaScript-style comments (// and /* */)
  // Must be done early before other fixes, and only outside strings
  fixed = removeJSComments(fixed);

  // Pass 1: Fix broken escape sequences common in Chinese LLM output
  fixed = fixBrokenEscapeSequences(fixed);

  // Pass 2: Convert single-quoted keys and values to double-quoted
  fixed = fixSingleQuotes(fixed);

  // Pass 3: Fix unquoted property names (bare word keys)
  fixed = fixUnquotedKeys(fixed);

  // Pass 4: Fix unescaped control characters inside JSON string values
  fixed = fixUnescapedCharsInStrings(fixed);

  // Pass 5: Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*([\]}])/g, "$1");

  // Pass 6: Insert missing commas between array/object elements
  fixed = insertMissingCommas(fixed);

  // Pass 7: Attempt to repair truncated JSON by closing open structures
  fixed = repairTruncatedJSON(fixed);

  return fixed;
}

/**
 * Fix broken escape sequences that LLMs produce in Chinese text.
 * Common patterns:
 *   \"但...  → the \" here is NOT an escaped quote, but a stray backslash
 *   \n, \t inside strings where not intended as escape chars
 *   \、\（\）etc. — backslash before Chinese punctuation
 */
function fixBrokenEscapeSequences(json: string): string {
  // Fix backslash followed by non-JSON-escape characters inside strings
  // Valid JSON escape chars after \: " \ / b f n r t u
  // If we see \ followed by anything else (especially Chinese chars), remove the backslash
  const result: string[] = [];
  let inString = false;
  let i = 0;

  while (i < json.length) {
    const ch = json[i];

    if (!inString) {
      if (ch === '"') inString = true;
      result.push(ch);
      i++;
      continue;
    }

    // Inside a string
    if (ch === '\\' && i + 1 < json.length) {
      const next = json[i + 1];
      // Valid JSON escape sequences
      if ('"\\bfnrtu/'.includes(next)) {
        // Check for \" that is NOT actually an escape but rather an LLM artifact
        // Heuristic: if \" is followed by Chinese chars or ）】」etc, it's a stray backslash
        if (next === '"') {
          const afterQuote = json[i + 2];
          if (afterQuote && isContinuationChar(afterQuote)) {
            // This \" is a stray backslash before a quote that is mid-string content
            // Output the quote as escaped (keep \")
            result.push('\\"');
            i += 2;
            continue;
          }
        }
        // Normal valid escape
        result.push(ch);
        result.push(next);
        i += 2;
        continue;
      }
      // Invalid escape sequence — remove the stray backslash
      // e.g. \、 \（ \） \【 etc.
      result.push(next);
      i += 2;
      continue;
    }

    if (ch === '"') {
      inString = false;
      result.push(ch);
      i++;
      continue;
    }

    result.push(ch);
    i++;
  }

  return result.join('');
}

/** Check if a character is a continuation character (Chinese, punctuation, etc.)
 *  that would indicate the preceding \" is NOT a real string terminator. */
function isContinuationChar(ch: string): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  // Chinese characters (CJK Unified Ideographs)
  if (code >= 0x4E00 && code <= 0x9FFF) return true;
  // Chinese punctuation
  if (code >= 0x3000 && code <= 0x303F) return true;
  // Fullwidth forms (）】etc.)
  if (code >= 0xFF00 && code <= 0xFFEF) return true;
  // CJK symbols & punctuation, enclosed CJK
  if (code >= 0x2E80 && code <= 0x33FF) return true;
  // Some specific chars that indicate continuation
  if ('）】」』》、，。！？；：'.includes(ch)) return true;
  // Regular alphanumeric continuation (rare but possible)
  if (/[a-zA-Z0-9]/.test(ch)) return true;
  return false;
}

/**
 * Remove JavaScript-style comments from JSON.
 * LLMs sometimes add // line comments or block comments in JSON output.
 * Only removes comments outside of string values.
 */
function removeJSComments(json: string): string {
  const result: string[] = [];
  let inString = false;
  let escape = false;
  let i = 0;

  while (i < json.length) {
    const ch = json[i];
    const next = json[i + 1];

    if (escape) {
      escape = false;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result.push(ch);
      i++;
      continue;
    }

    if (!inString) {
      // Line comment: // ...
      if (ch === '/' && next === '/') {
        // Skip until end of line
        i += 2;
        while (i < json.length && json[i] !== '\n') i++;
        continue;
      }
      // Block comment: /* ... */
      if (ch === '/' && next === '*') {
        i += 2;
        while (i < json.length - 1 && !(json[i] === '*' && json[i + 1] === '/')) i++;
        i += 2; // skip */
        continue;
      }
    }

    result.push(ch);
    i++;
  }

  return result.join('');
}

/**
 * Convert single-quoted keys and values to double-quoted.
 * Walks character by character to correctly handle nested quotes.
 * e.g. {'key': 'value'} → {"key": "value"}
 */
function fixSingleQuotes(json: string): string {
  const result: string[] = [];
  let inDouble = false;
  let inSingle = false;
  let escape = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escape) {
      escape = false;
      result.push(ch);
      continue;
    }

    if (ch === '\\') {
      escape = true;
      result.push(ch);
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      result.push(ch);
      continue;
    }

    if (ch === "'" && !inDouble) {
      if (!inSingle) {
        // Opening single quote → check if this looks like a JSON string delimiter
        // Look backward: after { , [ : or whitespace it's likely a string delimiter
        const prev = getPrecedingNonWhitespace(json, i);
        if (prev === '' || prev === '{' || prev === '[' || prev === ',' || prev === ':') {
          inSingle = true;
          result.push('"'); // convert to double quote
          continue;
        }
      } else {
        // Closing single quote
        inSingle = false;
        result.push('"'); // convert to double quote
        continue;
      }
    }

    // Inside single-quoted string: escape any double quotes
    if (inSingle && ch === '"') {
      result.push('\\"');
      continue;
    }

    result.push(ch);
  }

  return result.join('');
}

/**
 * Fix unquoted property names in JSON objects.
 * LLMs sometimes output bare word keys like: {key: "value"}
 * This converts them to: {"key": "value"}
 */
function fixUnquotedKeys(json: string): string {
  // State-machine approach: walk char-by-char and fix bare-word keys outside strings.
  // Handles keys after { , ] } newlines or any whitespace (not just { and ,).
  const result: string[] = [];
  let inString = false;
  let escape = false;
  let i = 0;

  while (i < json.length) {
    const ch = json[i];

    if (escape) {
      escape = false;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      result.push(ch);
      i++;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result.push(ch);
      i++;
      continue;
    }

    if (inString) {
      result.push(ch);
      i++;
      continue;
    }

    // Outside string: detect unquoted key at this position
    // An unquoted key is a bare identifier followed by optional whitespace then ":"
    // It can appear after { , } ] or at the start of a new line
    if (/[a-zA-Z_$]/.test(ch)) {
      // Check if preceding non-ws char makes this a key position
      const built = result.join('');
      const preceding = getPrecedingNonWhitespace(built, built.length);
      if (preceding === '' || preceding === '{' || preceding === ',' || preceding === '[' || preceding === ':' || preceding === '}' || preceding === ']') {
        // Try to match a bare-word key from current position
        const remaining = json.substring(i);
        const keyMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/);
        if (keyMatch) {
          result.push('"' + keyMatch[1] + '"');
          result.push(':');
          i += keyMatch[0].length;
          continue;
        }
      }
    }

    // Also handle the delimiter-then-key pattern: after { or , with whitespace
    if (ch === '{' || ch === ',') {
      const remaining = json.substring(i);
      const keyMatch = remaining.match(/^([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/);
      if (keyMatch) {
        result.push(keyMatch[1]); // delimiter + whitespace
        result.push('"' + keyMatch[2] + '"'); // quoted key
        result.push(':');
        i += keyMatch[0].length;
        continue;
      }
    }

    result.push(ch);
    i++;
  }

  return result.join('');
}

/**
 * Walk through the string character by character, and when inside
 * a JSON string value, escape any unescaped control characters
 * (newlines, tabs, literal double-quotes that break the JSON).
 */
function fixUnescapedCharsInStrings(json: string): string {
  const result: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    const code = json.charCodeAt(i);

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
      if (!inString) {
        inString = true;
        result.push(ch);
        continue;
      }
      // We're inside a string and hit a quote. Is this the closing quote?
      // Enhanced look-ahead: check the next non-whitespace char
      const after = lookAheadNonWhitespace(json, i + 1);
      if (isStructuralChar(after)) {
        inString = false;
        result.push(ch);
        continue;
      }
      // Otherwise this is an unescaped quote inside the string — escape it
      result.push('\\"');
      continue;
    }

    if (inString) {
      // Escape unescaped newlines and tabs inside strings
      if (ch === '\n') { result.push('\\n'); continue; }
      if (ch === '\r') { result.push('\\r'); continue; }
      if (ch === '\t') { result.push('\\t'); continue; }
      // Escape other control characters
      if (code < 0x20 && code !== 0x0A && code !== 0x0D && code !== 0x09) {
        result.push('\\u' + code.toString(16).padStart(4, '0'));
        continue;
      }
    }

    result.push(ch);
  }

  return result.join('');
}

/** Check if a character is a JSON structural character that would follow a closing quote */
function isStructuralChar(ch: string): boolean {
  // These chars can follow a closing ": : , ] } or end-of-string
  // Also " (next key's opening quote)
  return ch === ':' || ch === ',' || ch === ']' || ch === '}' || ch === '' || ch === '"';
}

/** Look ahead past whitespace and return the next non-ws character, or '' if end */
function lookAheadNonWhitespace(s: string, start: number): string {
  for (let j = start; j < s.length; j++) {
    if (!/\s/.test(s[j])) return s[j];
  }
  return '';
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
  // These characters end a value:
  //   " — string end
  //   ] — array end
  //   } — object end
  //   0-9 — number end
  //   e — true / false end
  //   l — null end
  return /["\]\}\dele]/.test(preceding);
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

/**
 * Aggressive last-resort JSON repair using regex patterns.
 * This handles cases that the character-by-character approach misses,
 * such as deeply broken structures from non-standard LLM output.
 */
function aggressiveJSONRepair(json: string): string {
  let fixed = json;

  // 0. Strip any remaining non-JSON text before first { and after last }
  const firstBrace = fixed.indexOf('{');
  const lastBrace = fixed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    fixed = fixed.substring(firstBrace, lastBrace + 1);
  }

  // 1. Remove all backslashes that don't precede valid JSON escape targets
  const validEscapeFollowers = /["\\\/bfnrtu]/;
  fixed = fixed.replace(/\\(.)/g, (match, nextChar) =>
    validEscapeFollowers.test(nextChar) ? match : nextChar
  );

  // 2. Convert all single quotes used as string delimiters to double quotes
  // This is aggressive — replaces ' with " when it looks like a JSON delimiter
  fixed = fixed.replace(/([{,\[]\s*)'([^']+?)'(\s*[:\],}])/g, '$1"$2"$3');
  fixed = fixed.replace(/(:\s*)'([^']*?)'(\s*[,}\]])/g, '$1"$2"$3');

  // 3. Quote unquoted keys:  key: → "key":
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // 4. Fix sequences like ""key" that result from double-quote issues
  fixed = fixed.replace(/""\s*([a-zA-Z_\u4e00-\u9fff])/g, '", "$1');

  // 5. Fix missing comma between adjacent structures
  fixed = fixed.replace(/\}\s*\{/g, "}, {");
  fixed = fixed.replace(/\]\s*\[/g, "], [");
  fixed = fixed.replace(/\}\s*"/g, '}, "');
  fixed = fixed.replace(/\]\s*"/g, '], "');

  // 6. Fix missing comma between values: "value" "key"
  fixed = fixed.replace(/"\s+"/g, '", "');

  // 7. Remove trailing commas again
  fixed = fixed.replace(/,\s*([\]}])/g, "$1");

  // 8. Repair truncated structures
  fixed = repairTruncatedJSON(fixed);

  return fixed;
}

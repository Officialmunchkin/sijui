import fs from "fs";
import path from "path";

const SRC = "Famvault-Readable-Version.backup.html";
const OUT = "Famvault-Readable-Version.formatted.html";

const html = fs.readFileSync(SRC, "utf8");

// 1) Grab the minified app script (the one containing the React render call).
const renderMarker = "lp.createRoot";
const scriptStart = html.indexOf(renderMarker);
if (scriptStart === -1) throw new Error("Could not locate the minified React script.");
// find enclosing <script ...> ... </script>
const openTagStart = html.lastIndexOf("<script", scriptStart);
const openTagEnd = html.indexOf(">", openTagStart) + 1;
const closeTagStart = html.indexOf("</script>", scriptStart);
if (openTagStart === -1 || closeTagStart === -1) throw new Error("Could not find script boundaries.");

const before = html.slice(0, openTagEnd);
const code = html.slice(openTagEnd, closeTagStart);
const after = html.slice(closeTagStart);

// 2) Tokenizer for the minified JS, preserving strings/templates/regex.
function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  let lastMeaningful = ""; // last meaningful token text (for regex detection)
  const isIdChar = (c) => /[A-Za-z0-9_$]/.test(c);
  while (i < n) {
    const c = src[i];
    // whitespace
    if (/\s/.test(c)) {
      let j = i;
      while (j < n && /\s/.test(src[j])) j++;
      tokens.push({ type: "ws", value: src.slice(i, j) });
      i = j;
      continue;
    }
    // comments
    if (c === "/" && src[i + 1] === "/") {
      let j = src.indexOf("\n", i);
      if (j === -1) j = n;
      tokens.push({ type: "comment", value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      let j = src.indexOf("*/", i + 2);
      j = j === -1 ? n : j + 2;
      tokens.push({ type: "comment", value: src.slice(i, j) });
      i = j;
      continue;
    }
    // strings
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") { j += 2; continue; }
        if (src[j] === c) break;
        j++;
      }
      tokens.push({ type: "string", value: src.slice(i, j + 1) });
      lastMeaningful = "string";
      i = j + 1;
      continue;
    }
    // template literals
    if (c === "`") {
      let j = i + 1, depth = 0;
      while (j < n) {
        if (src[j] === "\\") { j += 2; continue; }
        if (src[j] === "`" && depth === 0) break;
        if (src[j] === "$" && src[j + 1] === "{") { depth++; j += 2; continue; }
        if (src[j] === "}" && depth > 0) { depth--; j++; continue; }
        j++;
      }
      tokens.push({ type: "template", value: src.slice(i, j + 1) });
      lastMeaningful = "template";
      i = j + 1;
      continue;
    }
    // regex literal (heuristic)
    if (c === "/" ) {
      const prev = lastMeaningful;
      const regexAllowed = prev === "" || ["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "return"].includes(prev) || /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else)$/.test(prev);
      if (regexAllowed) {
        let j = i + 1, inClass = false, ok = false;
        while (j < n) {
          const d = src[j];
          if (d === "\\") { j += 2; continue; }
          if (d === "\n") break;
          if (inClass) { if (d === "]") inClass = false; }
          else if (d === "[") inClass = true;
          else if (d === "/") { ok = true; break; }
          j++;
        }
        if (ok) {
          let k = j + 1;
          while (k < n && /[a-z]/.test(src[k])) k++;
          tokens.push({ type: "regex", value: src.slice(i, k) });
          lastMeaningful = "regex";
          i = k;
          continue;
        }
      }
    }
    // numbers
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let j = i;
      while (j < n && /[0-9a-fA-FxXoObB._]/.test(src[j])) j++;
      // handle exponents
      if ((src[j] === "e" || src[j] === "E") && /[0-9+\-]/.test(src[j + 1] || "")) {
        j += 2;
        while (j < n && /[0-9]/.test(src[j])) j++;
      }
      tokens.push({ type: "number", value: src.slice(i, j) });
      lastMeaningful = "number";
      i = j;
      continue;
    }
    // identifiers / keywords
    if (isIdChar(c) || c === "$") {
      let j = i;
      while (j < n && (isIdChar(src[j]) || src[j] === "$")) j++;
      const word = src.slice(i, j);
      tokens.push({ type: "word", value: word });
      lastMeaningful = /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else)$/.test(word) ? word : word;
      i = j;
      continue;
    }
    // punctuation
    tokens.push({ type: "punct", value: c });
    lastMeaningful = c;
    i++;
  }
  return tokens;
}

// 3) Format the token stream.
function formatTokens(tokens) {
  const outLines = [];
  let line = "";
  let indent = 0;
  const pad = () => "  ".repeat(Math.max(0, indent));

  const push = () => {
    if (line.trim()) outLines.push(pad() + line.trim());
    line = "";
  };

  const prevMeaningful = () => {
    for (let k = outLines.length - 1; k >= 0; k--) {
      const l = outLines[k].trim();
      if (l) return l[l.length - 1];
    }
    return line.trim()[line.trim().length - 1];
  };

  for (let idx = 0; idx < tokens.length; idx++) {
    const t = tokens[idx];
    const v = t.value;

    if (t.type === "ws") {
      continue;
    }
    if (t.type === "comment") {
      push();
      outLines.push(pad() + v);
      continue;
    }

    if (t.type === "punct") {
      switch (v) {
        case "{": case "[": case "(":
          line += v;
          indent++;
          continue;
        case "}": case "]": case ")":
          indent--;
          line = line.trimEnd() + v;
          continue;
        case ";":
          line += v;
          push();
          continue;
        case ",":
          line += v;
          // If inside an object/array/args at depth>0, newline for readability
          push();
          continue;
        case ":":
          line += v;
          continue;
        default:
          line += v;
          continue;
      }
    }

    // words / strings / numbers / regex / template
    if (line.trim() === "") {
      line = v;
    } else {
      // space rules: don't add space after ( [ { ; before ) ] } , ; :
      const lastChar = line.trim()[line.trim().length - 1];
      const noSpaceBefore = ")]},;:".includes(v[0]);
      const noSpaceAfter = "([{".includes(lastChar);
      const isUnary = /[+\-!]/.test(v[0]) && ["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";"].includes(lastChar);
      if (!noSpaceBefore && !noSpaceAfter && !isUnary) line += " ";
      line += v;
    }
  }
  push();
  return outLines.join("\n");
}

const formattedCode = formatTokens(tokenize(code));

fs.writeFileSync(OUT, before + "\n" + formattedCode + "\n" + after);
console.log("Wrote", OUT, (formattedCode.split("\n").length) + " lines of formatted JS");

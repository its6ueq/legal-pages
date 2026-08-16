#!/usr/bin/env node
/**
 * Translates _content.json into every language the app ships in.
 *
 *   set OPENAI_API_KEY=...
 *   node let-the-car-out/translate.mjs            only languages with no file yet
 *   node let-the-car-out/translate.mjs --force    redo all of them
 *   node let-the-car-out/translate.mjs vi de      only these
 *
 * One request per language, returning the whole document. Translating field by field would be
 * cheaper and worse: a privacy policy is one argument, and a model shown one sentence at a time
 * cannot keep "the App", "cloud save" and "award" consistent across ninety of them.
 *
 * Existing files are left alone unless asked, so a run that dies half way through costs only the
 * languages it had not reached.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(HERE, '_content.json');
const OUT = path.join(HERE, 'i18n');
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.5';

const LANGUAGES = {
  ar: 'Arabic', bg: 'Bulgarian', bn: 'Bengali', cs: 'Czech', da: 'Danish', de: 'German',
  el: 'Greek', es: 'Spanish', fa: 'Persian', fi: 'Finnish', fil: 'Filipino', fr: 'French',
  he: 'Hebrew', hi: 'Hindi', hr: 'Croatian', hu: 'Hungarian', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', km: 'Khmer', ko: 'Korean', ms: 'Malay', my: 'Burmese', nl: 'Dutch',
  no: 'Norwegian', pl: 'Polish', pt: 'European Portuguese', 'pt-BR': 'Brazilian Portuguese',
  ro: 'Romanian', ru: 'Russian', sk: 'Slovak', sr: 'Serbian', sv: 'Swedish', sw: 'Swahili',
  ta: 'Tamil', te: 'Telugu', th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', ur: 'Urdu',
  vi: 'Vietnamese', 'zh-Hans': 'Simplified Chinese', 'zh-Hant': 'Traditional Chinese'
};

const RULES = `You are translating the legal and support pages of a mobile puzzle game.

Return a JSON object with EXACTLY the same keys, nesting and array lengths as the input. Translate
only the human-readable text.

Do not change:
- HTML tags and attributes: <strong>, <code>, <em>, <a href="...">, target, rel
- URLs, email addresses, and anything inside <code>
- the "_comment" field (copy it through unchanged)
- meta.app, meta.developer, meta.email, meta.package (they are names, not words)

Do translate meta.updated into the target language's normal way of writing that date.

Register: plain, direct, and legally careful. This is a real privacy policy and a real terms of use,
so keep every factual claim exactly as strong or as weak as the English - do not soften "we collect
no personally identifiable information", and do not strengthen anything either. Use the terminology
the platform itself uses in that language for Google Play, Google Play Games, the App Store, Game
Center and iCloud.

Use plain hyphens, never em dashes or en dashes.`;

async function translate(code, name, source) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `${RULES}\n\nTarget language: ${name} (${code}).` },
        { role: 'user', content: JSON.stringify(source) }
      ]
    })
  });

  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${body.error?.message ?? ''}`);

  const text = body.choices?.[0]?.message?.content;
  if (!text) throw new Error('empty reply');
  return JSON.parse(text);
}

/** Catches a reply that dropped a section, which would silently publish a shorter policy. */
function sameShape(a, b, trail = '') {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return trail || 'root';
    for (let i = 0; i < a.length; i++) {
      const bad = sameShape(a[i], b[i], `${trail}[${i}]`);
      if (bad) return bad;
    }
    return null;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return trail || 'root';
    for (const key of Object.keys(a)) {
      if (!(key in b)) return `${trail}.${key}`;
      const bad = sameShape(a[key], b[key], `${trail}.${key}`);
      if (bad) return bad;
    }
    return null;
  }
  return null;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Set OPENAI_API_KEY first. Do not put the key in this file.');
    process.exit(2);
  }

  const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  fs.mkdirSync(OUT, { recursive: true });

  const force = process.argv.includes('--force');
  const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const codes = (only.length ? only : Object.keys(LANGUAGES))
    .filter(code => force || !fs.existsSync(path.join(OUT, `${code}.json`)));

  if (!codes.length) {
    console.log('Nothing to do. Pass --force to redo existing languages.');
    return;
  }
  console.log(`${MODEL}: ${codes.length} language(s)`);

  // Six at a time. The whole document is a large request and forty-three of them in parallel is a
  // reliable way to be rate limited on every one at once.
  const queue = [...codes];
  const failed = [];

  async function worker() {
    while (queue.length) {
      const code = queue.shift();
      try {
        const translated = await translate(code, LANGUAGES[code], source);
        const missing = sameShape(source, translated);
        if (missing) throw new Error(`reply is missing ${missing}`);
        fs.writeFileSync(path.join(OUT, `${code}.json`),
          JSON.stringify(translated, null, 2) + '\n');
        console.log(`  ok   ${code}`);
      } catch (error) {
        failed.push(code);
        console.log(`  FAIL ${code}: ${error.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: 6 }, worker));

  console.log(`\n${codes.length - failed.length} written, ${failed.length} failed`);
  if (failed.length) {
    console.log(`retry: node let-the-car-out/translate.mjs ${failed.join(' ')}`);
    process.exitCode = 1;
  }
}

main();

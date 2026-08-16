#!/usr/bin/env node
/**
 * Renders every Let the car out! legal page from _content.json.
 *
 *   node let-the-car-out/build.mjs            English only, into this folder
 *   node let-the-car-out/build.mjs --all      every translated language too
 *
 * The pages exist in forty-four languages, and hand-editing forty-four copies of a privacy policy
 * is how thirty of them end up describing a version of the app that no longer exists. So the text
 * lives in one JSON file per language and the markup lives here, once.
 *
 * English writes to this folder so the published URLs do not move. Every other language writes to
 * its own subfolder.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const I18N = path.join(HERE, 'i18n');

const CSS = `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #334155;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #F1F5F9;
        }
        .container {
            background: #FFFFFF;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 30px rgba(15,23,42,0.10);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #FBBF24;
        }
        h1 { color: #1E40AF; margin: 0; }
        h2 {
            color: #1E40AF;
            margin-top: 30px;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 10px;
        }
        h3 { color: #334155; margin-top: 25px; }
        a { color: #1D4ED8; }
        .back-btn {
            background: #1E40AF;
            color: #FFFFFF;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 20px;
        }
        .back-btn:hover { background: #1E3A8A; }
        .highlight {
            background: #DBEAFE;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3B82F6;
            margin: 20px 0;
        }
        .important {
            background: #FEF3C7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #FBBF24;
            margin: 20px 0;
        }
        ul, ol { margin: 15px 0; padding-left: 25px; }
        li { margin: 8px 0; }
        .contact-info {
            background: #F8FAFC;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .langs { margin-top: 36px; font-size: 14px; line-height: 2; color: #64748B; }
        .langs a { margin-right: 10px; white-space: nowrap; }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
        }`;

// Right-to-left scripts. Without this the Arabic, Hebrew, Persian and Urdu pages are laid out
// left-to-right and read as broken to exactly the people they were translated for.
const RTL = new Set(['ar', 'fa', 'he', 'ur']);

const NAMES = {
  en: 'English', ar: 'العربية', bg: 'Български', bn: 'বাংলা', cs: 'Čeština', da: 'Dansk',
  de: 'Deutsch', el: 'Ελληνικά', es: 'Español', fa: 'فارسی', fi: 'Suomi', fil: 'Filipino',
  fr: 'Français', he: 'עברית', hi: 'हिन्दी', hr: 'Hrvatski', hu: 'Magyar', id: 'Indonesia',
  it: 'Italiano', ja: '日本語', km: 'ខ្មែរ', ko: '한국어', ms: 'Melayu', my: 'မြန်မာ',
  nl: 'Nederlands', no: 'Norsk', pl: 'Polski', pt: 'Português', 'pt-BR': 'Português (BR)',
  ro: 'Română', ru: 'Русский', sk: 'Slovenčina', sr: 'Српски', sv: 'Svenska', sw: 'Kiswahili',
  ta: 'தமிழ்', te: 'తెలుగు', th: 'ไทย', tr: 'Türkçe', uk: 'Українська', ur: 'اردو',
  vi: 'Tiếng Việt', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文'
};

function shell(lang, title, body, languages) {
  const rtl = RTL.has(lang) ? ' dir="rtl"' : '';
  // English sits in the app folder and every other language one level below it, so the way back up
  // is not the same string for both. Getting this wrong gives a language picker that 404s from
  // exactly half the pages.
  const here = lang === 'en' ? '' : '../';
  const picker = languages.map(code => {
    const href = code === 'en' ? `${here}${title.file}` : `${here}${code}/${title.file}`;
    return `<a href="${href}">${NAMES[code] ?? code}</a>`;
  }).join('\n            ');

  return `<!DOCTYPE html>
<html lang="${lang}"${rtl}>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title.text}</title>
    <style>${CSS}
    </style>
</head>
<body>
    <div class="container">
${body}
        <div class="langs">
            ${picker}
        </div>
    </div>
</body>
</html>
`;
}

function nav(c, self, lang) {
  const root = lang === 'en' ? '../' : '../../';
  const home = self === 'index' ? '' :
    `\n        <a href="index.html" class="back-btn" style="background:#B45309; margin-left:10px;">${c.ui.back_home}</a>`;
  return `        <a href="${root}" class="back-btn">&larr; ${c.ui.back_labs}</a>${home}`;
}

function contactBlock(c) {
  return `        <div class="contact-info">
            <ul>
                <li><strong>Email:</strong> <a href="mailto:${c.meta.email}">${c.meta.email}</a></li>
                <li><strong>App:</strong> ${c.meta.app}</li>
                <li><strong>Developer:</strong> ${c.meta.developer}</li>
            </ul>
        </div>`;
}

function renderSections(c, sections, level = 2) {
  const out = [];
  for (const section of sections) {
    out.push(`        <h${level}>${section.h}</h${level}>`);
    if (section.important) out.push(`        <div class="important">${section.important}</div>`);
    for (const paragraph of section.p ?? []) out.push(`        <p>${paragraph}</p>`);
    if (section.ul) {
      out.push('        <ul>');
      for (const item of section.ul) out.push(`            <li>${item}</li>`);
      out.push('        </ul>');
    }
    if (section.after) out.push(`        <p>${section.after}</p>`);
    if (section.contact) out.push(contactBlock(c));
    if (section.sub) out.push(renderSections(c, section.sub, 3));
  }
  return out.join('\n');
}

function page(c, key, file, languages, lang) {
  const doc = c[key];
  const body = [
    nav(c, key, lang),
    '',
    '        <div class="header">',
    `            <h1>${doc.title}</h1>`,
    `            <p><strong>${c.meta.app}</strong></p>`,
    `            <p>${c.ui.updated_label} ${c.meta.updated}</p>`,
    '        </div>',
    '',
    `        <div class="highlight"><strong>${doc.summary_label}</strong> ${doc.summary}</div>`,
    '',
    renderSections(c, doc.sections),
    '',
    '        <div style="text-align: center; margin-top: 40px;">',
    nav(c, key, lang).trim().split('\n').map(l => '        ' + l.trim()).join('\n'),
    '        </div>'
  ].join('\n');

  return shell(lang, { text: `${doc.title} - ${c.meta.app}`, file }, body, languages);
}

function indexPage(c, languages, lang) {
  const body = [
    '        <div class="header">',
    `            <h1>${c.index.heading}</h1>`,
    `            <p>${c.index.sub}</p>`,
    '        </div>',
    '        <div style="text-align:center">',
    `            <a class="back-btn" href="privacy-policy.html">${c.ui.nav_privacy}</a>`,
    `            <a class="back-btn" href="terms-of-service.html" style="margin-left:10px;">${c.ui.nav_terms}</a>`,
    `            <a class="back-btn" href="support.html" style="margin-left:10px;">${c.ui.nav_support}</a>`,
    `            <a class="back-btn" href="${lang === 'en' ? '../' : '../../'}" style="background:#B45309; margin-left:10px;">${c.ui.back_labs}</a>`,
    '        </div>'
  ].join('\n');
  return shell(lang, { text: c.index.title, file: 'index.html' }, body, languages);
}

function main() {
  const all = process.argv.includes('--all');
  const languages = ['en'];
  if (all && fs.existsSync(I18N)) {
    for (const file of fs.readdirSync(I18N).sort()) {
      if (file.endsWith('.json') && file !== 'en.json') languages.push(file.replace(/\.json$/, ''));
    }
  }

  for (const lang of languages) {
    const source = lang === 'en'
      ? path.join(HERE, '_content.json')
      : path.join(I18N, `${lang}.json`);
    const c = JSON.parse(fs.readFileSync(source, 'utf8'));

    // English keeps the folder it has always been published at; the URLs are already in two app
    // store listings and must not move.
    const dir = lang === 'en' ? HERE : path.join(HERE, lang);
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, 'index.html'), indexPage(c, languages, lang));
    fs.writeFileSync(path.join(dir, 'privacy-policy.html'),
      page(c, 'privacy', 'privacy-policy.html', languages, lang));
    fs.writeFileSync(path.join(dir, 'terms-of-service.html'),
      page(c, 'terms', 'terms-of-service.html', languages, lang));
    fs.writeFileSync(path.join(dir, 'support.html'),
      page(c, 'support', 'support.html', languages, lang));
    process.stdout.write(lang === 'en' ? 'en ' : lang + ' ');
  }
  console.log(`\n${languages.length} language(s), 4 pages each.`);
}

main();

import { marked } from 'marked';

/**
 * Parse markdown into sections split on h1/h2 headings.
 * Returns array of { id, number, title, html } objects.
 */
export function parseSections(markdown) {
  // Configure marked
  marked.setOptions({ breaks: true, gfm: true });

  const lines = markdown.split('\n');
  const sections = [];
  let currentLines = [];
  let currentHeading = null;

  function flush() {
    if (!currentHeading) return;
    const body = currentLines.join('\n').trim();
    sections.push({
      ...currentHeading,
      html: body ? marked.parse(body) : '',
      rawText: body.toLowerCase(),
    });
    currentLines = [];
  }

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const heading = h1 || h2;

    if (heading) {
      flush();
      const title = heading[1].trim();
      // Extract leading number like "1.", "9.1", "9.1.1"
      const numMatch = title.match(/^([\d.]+)\.?\s+(.+)/);
      const number = numMatch ? numMatch[1] : '';
      const label = numMatch ? numMatch[2] : title;
      const id = 'section-' + (number || label).replace(/\./g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
      currentHeading = { id, number, title: label, fullTitle: title, level: h1 ? 1 : 2 };
    } else {
      if (currentHeading) {
        // Skip bare horizontal rules at top of section
        if (line.trim() === '---' && currentLines.length === 0) continue;
        currentLines.push(line);
      }
    }
  }
  flush();

  return sections;
}

/**
 * Search sections by keyword, return sorted by match count.
 */
export function searchSections(sections, query) {
  if (!query.trim()) return sections;
  const terms = query.toLowerCase().trim().split(/\s+/);
  return sections
    .map(s => {
      const count = terms.reduce((acc, t) => {
        const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        return acc + (s.rawText.match(re)?.length ?? 0) + (s.title.toLowerCase().match(re)?.length ?? 0) * 3;
      }, 0);
      return { ...s, matchCount: count };
    })
    .filter(s => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}

/**
 * Highlight search terms in HTML string (wraps matches in <mark>).
 */
export function highlightHtml(html, query) {
  if (!query.trim()) return html;
  const terms = query.trim().split(/\s+/).filter(Boolean);
  const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  // Only highlight text nodes, not inside HTML tags
  return html.replace(
    new RegExp(`(?![^<]*>)(${pattern})`, 'gi'),
    '<mark>$1</mark>'
  );
}

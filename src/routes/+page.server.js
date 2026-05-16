import markdown from '../../static/rules.md?raw';
import { execSync } from 'child_process';

export function load() {
  let rulesVersion = 'unknown';
  let debugInfo = '';
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim();
    const date = execSync('git log -1 --format=%cs').toString().trim();
    debugInfo = `hash="${hash}" date="${date}"`;
    rulesVersion = hash && date ? `${date}-${hash}` : `empty: ${debugInfo}`;
  } catch (e) {
    rulesVersion = `threw: ${e.message}`;
  }

  return { markdown, rulesVersion };
}
import markdown from '../../static/rules.md?raw';
import { execSync } from 'child_process';

export function load() {
  let rulesVersion = 'unknown';
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim();
    const date = execSync('git log -1 --format=%cs').toString().trim();
    rulesVersion = `${date}-${hash}`;
    //const hash = execSync('git log -1 --format=%h -- static/rules.md').toString().trim();
    //const date = execSync('git log -1 --format=%cs -- static/rules.md').toString().trim();
    // %cs gives YYYY-MM-DD (committer date, short format)
    //rulesVersion = `${date}-${hash}`;
  } catch (e) {
    // not a git repo, or git not available
  }

  return { markdown, rulesVersion };
}
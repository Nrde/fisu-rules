import { readFileSync } from 'fs';
import { resolve } from 'path';

export function load() {
  const mdPath = resolve('static/rules.md');
  const markdown = readFileSync(mdPath, 'utf-8');
  return { markdown };
}

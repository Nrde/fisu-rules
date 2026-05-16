import markdown from '../../static/rules.md?raw';

export function load() {
  return { markdown, rulesVersion: __RULES_VERSION__ };
}
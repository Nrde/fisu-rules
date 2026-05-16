import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

function getGitVersion() {
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim();
    const date = execSync('git log -1 --format=%cs').toString().trim();
    return `${date}-${hash}`;
  } catch (e) {
    return 'unknown';
  }
}

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __RULES_VERSION__: JSON.stringify(getGitVersion())
  }
});
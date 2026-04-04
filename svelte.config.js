/*import adapter from '@sveltejs/adapter-static';*/

/** @type {import('@sveltejs/kit').Config} */
/*const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html'
    })
  }
};*/

const config = {
  kit: {
    adapter: adapter({
      runtime: 'nodejs24.x',
    }),
  },
};

export default config;

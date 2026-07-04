const postcss = require('postcss');
const tw = require('@tailwindcss/postcss');

const testCss = `@import "tailwindcss";

@theme {
  --color-ml-bg: var(--ml-bg);
}

:root {
  --ml-bg: #f0f2f7;
}

.ml-card-premium {
  background: var(--ml-surface);
  border: 1px solid var(--ml-border);
}`;

async function run() {
  try {
    const plugin = tw.default ? tw.default() : tw();
    const result = await postcss([plugin]).process(testCss, { from: 'test.css' });
    console.log('=== OUTPUT LENGTH ===');
    console.log(result.css.length);
    console.log('');
    console.log('=== FIRST 1000 CHARS ===');
    console.log(result.css.substring(0, 1000));
    console.log('');
    console.log('=== CONTAINS ml-card-premium? ===');
    console.log(result.css.includes('ml-card-premium'));
    console.log('');
    console.log('=== CONTAINS flex utility? ===');
    console.log(result.css.includes('.flex'));
    console.log('');
    console.log('=== CONTAINS Tailwind base? ===');
    console.log(result.css.includes('--tw-'));
  } catch(e) {
    console.error('ERROR:', e.message);
  }
}

run();

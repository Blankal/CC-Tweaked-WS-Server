require('esbuild').buildSync({
  entryPoints: ['src/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: 'dist/bundle.cjs',
  external: []  // Bundles ws fine as pure JS
});

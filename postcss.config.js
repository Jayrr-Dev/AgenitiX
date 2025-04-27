// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Production-only tweaks
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: ['cssnano', {
        preset: ['default', {
          mergeRules:      false, // we already needed this for the keyframe bug
          minifyGradients: false, // <— turn off the buggy plugin
        }]
      }]
    })
  }
};

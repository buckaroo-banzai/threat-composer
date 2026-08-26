const path = require('path');

module.exports = {
  webpack: {
    configure: (config, { env }) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve && config.resolve.alias),
          // Route Cloudscape's ResizeObserver ponyfill through a rAF-deferred wrapper to prevent the
          // benign "ResizeObserver loop completed with undelivered notifications" error. Exact match
          // ($) so the wrapper can still import the real implementation via its deep subpath.
          '@juggle/resize-observer$': path.resolve(__dirname, 'src/deferredResizeObserver'),
        },
      },
      module: {
        ...config.module,
        rules: config.module.rules.map((rule) => {
          if (rule.oneOf instanceof Array) {
            // eslint-disable-next-line no-param-reassign
            rule.oneOf[rule.oneOf.length - 1].exclude = [
              /\.(js|mjs|jsx|cjs|ts|tsx)$/,
              /\.html$/,
              /\.json$/,
            ];
          }
          return rule;
        }),
      },
      optimization: {
        ...config.optimization,
        ...(env === "production"
          ? {
              splitChunks: {
                chunks: "all",
                name: false,
              },
            }
          : {}),
      },
    }),
  },
};

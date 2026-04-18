//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
};

const plugins = [withNx];

let config = composePlugins(...plugins)(nextConfig);

// Wrap with next-intl plugin
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nextIntlPlugin = require('next-intl/plugin');
  const createPlugin =
    typeof nextIntlPlugin === 'function' ? nextIntlPlugin : nextIntlPlugin.default;
  config = createPlugin('./i18n/request.ts')(config);
} catch {
  // next-intl plugin may not be available in test environments
}

module.exports = config;

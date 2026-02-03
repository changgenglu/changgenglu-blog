const { webpack } = require("@vue/cli-service");

module.exports = {
  chainWebpack: config => {
    config.module
      .rule('markdown')
      .test(/\.md$/)
      .use('markdown-loader')
      .loader('markdown-loader')
      .end();
    
    // Add Feature Flags for Vue 3
    config.plugin('feature-flags').use(require('webpack').DefinePlugin, [{
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    }]);
  },
  publicPath: "/changgenglu-blog/"
};

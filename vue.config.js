module.exports = {
  chainWebpack: config => {
    config.module
      .rule('markdown')
      .test(/\.md$/)
      .use('markdown-loader')
      .loader('markdown-loader')
      .end();
  },
  publicPath: "/changgenglu-blog/"
};

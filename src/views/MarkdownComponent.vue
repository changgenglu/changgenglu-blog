<template>
  <div class="article-page grid-paper" ref="container">
    <div v-if="isLoading" class="state-box">
      <div class="spinner" role="status" aria-label="載入中"></div>
      <p class="state-text">LOADING ARTICLE...</p>
    </div>
    <div v-else-if="error" class="state-box error-box" role="alert">
      <h3 class="error-title">{{ error }}</h3>
      <router-link to="/" class="btn-ghost">回首頁</router-link>
    </div>
    <div v-else class="article-layout" :class="{ 'has-toc': hasToc }">
      <aside v-if="hasToc" class="article-aside">
        <ArticleToc :items="tocItems" :collapsed="isMobile" />
      </aside>

      <article class="article-main">
        <header class="article-header">
          <h2 class="article-title">{{ fileName.replace('.md', '') }}</h2>
          <button type="button" class="btn-ghost btn-sm" @click="copyArticle" title="複製文章 Markdown">
            <i class="fa-regular fa-copy" aria-hidden="true"></i>
            <span>複製文章</span>
          </button>
        </header>
        <Markdown class="markdown-content" :source="markdownContent" @rendered="addCopyButtons" />
      </article>
    </div>
  </div>
  <scroll-to-top-button v-show="isMobile" />
</template>

<script>
import ScrollToTopButton from '@/components/ScrollToTopButton.vue';
import ArticleToc from '@/components/ArticleToc.vue';
import Markdown from 'vue3-markdown-it';
import { parseMarkdown } from '@/utils/markdownParser';
import { extractHeadings, shouldShowToc } from '@/utils/toc';
import fileList from '@/assets/fileNames.json';

export default {
  components: { Markdown, ScrollToTopButton, ArticleToc },
  name: 'MarkdownComponent',
  data() {
    return {
      markdownContent: '',
      tocItems: [],
      latestLoadId: 0,
      fileName: this.$route.params.title,
      isMobile: false,
      isLoading: false,
      error: null,
    }
  },
  computed: {
    hasToc() {
      return shouldShowToc(this.tocItems);
    },
  },
  watch: {
    markdownContent() {
      this.$nextTick(() => {
        this.addCopyButtons();
        this.buildTocFromDom();
      });
    },
    // 路由只換 :title 時元件實例會被復用，不會重新 mounted
    '$route.params.title'(title) {
      if (!title || title === this.fileName) return;
      this.fileName = title;
      this.loadMarkdown();
    },
  },
  methods: {
    buildTocFromDom() {
      const root = this.$refs.container?.querySelector('.markdown-content');
      this.tocItems = root ? extractHeadings(root) : [];
    },
    async loadMarkdown() {
      // 換文章時先清空目錄；較晚送出的載入會讓先前尚未回來的結果作廢
      const loadId = ++this.latestLoadId;
      this.tocItems = [];
      this.isLoading = true;
      this.error = null;

      // 防止無效的 fileName 導致 fetch 錯誤 (e.g. /undefined)
      if (!this.fileName || this.fileName === 'undefined' || this.fileName === 'null') {
        this.error = '無法找到此文章 (Invalid Filename)';
        this.isLoading = false;
        return;
      }

      try {
        const targetFile = fileList.find(f => f.name === this.fileName || f.path === this.fileName);
        let filePath = this.fileName;
        
        if (targetFile && targetFile.path) {
          filePath = targetFile.path;
        }

        const version = new Date().getTime(); 
        const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const url = `${process.env.BASE_URL}markdownFiles/${encodedPath}?v=${version}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        // 作者手寫的 <!-- TOC --> 區塊由 parseMarkdown 剝除，目錄改由渲染後的 h2 自動產生
        const { content } = parseMarkdown(text);
        if (loadId !== this.latestLoadId) return;
        
        this.markdownContent = content;
      } catch (error) {
        if (loadId !== this.latestLoadId) return;
        this.error = '文章載入失敗，請稍後再試。';
      } finally {
        if (loadId === this.latestLoadId) {
          this.isLoading = false;
          this.checkDevice();
        }
      }
    },
    async copyArticle() {
      try {
        await navigator.clipboard.writeText(this.markdownContent);
        alert('文章已複製到剪貼簿！');
      } catch (err) {
        // Silently fail or use a UI notification
      }
    },
    addCopyButtons() {
      const container = this.$refs.container;
      if (!container) return;
      
      const codeBlocks = container.querySelectorAll('pre');
      codeBlocks.forEach((block) => {
        // Check if button already exists
        if (block.querySelector('.btn-copy-code')) return;

        const button = document.createElement('button');
        button.className = 'btn-copy-code';
        button.innerHTML = '<i class="fa-regular fa-copy"></i>';
        button.title = '複製程式碼';
        
        button.addEventListener('click', async () => {
          const codeElement = block.querySelector('code');
          if (!codeElement) return;
          
          const code = codeElement.innerText || codeElement.textContent;
          try {
            await navigator.clipboard.writeText(code);
            button.innerHTML = '<i class="fa-solid fa-check copy-ok"></i>';
            setTimeout(() => {
              button.innerHTML = '<i class="fa-regular fa-copy"></i>';
            }, 2000);
          } catch (err) {
            // Silently fail
          }
        });

        block.style.position = 'relative';
        block.appendChild(button);
      });
    },
    checkDevice() {
      this.isMobile = window.innerWidth <= 768;
    },
  },
  mounted() {
    this.loadMarkdown();
    this.checkDevice();
    window.addEventListener('resize', this.checkDevice);
  },
  unmounted() {
    window.removeEventListener('resize', this.checkDevice);
  }
}
</script>

<style scoped>
.article-page {
  min-height: 60vh;
}

.article-layout {
  display: grid;
  grid-template-columns: minmax(0, 46rem);
  justify-content: center;
  gap: 24px 40px;
  padding: 32px 24px 56px;
}

.article-layout.has-toc {
  grid-template-columns: minmax(0, 46rem) 16rem;
}

.article-main {
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
}

.article-aside {
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.article-title {
  margin: 0;
  padding-left: 14px;
  border-left: 2px solid var(--primary);
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.state-box {
  padding: 96px 24px;
  text-align: center;
}

.state-text {
  margin: 16px 0 0;
  color: var(--primary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.error-title {
  margin: 0;
  color: var(--danger);
  font-size: 1.15rem;
}

.spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: 2px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-sm {
  flex: 0 0 auto;
  padding: 4px 12px;
  font-size: 0.85rem;
}

.btn-sm i {
  margin-right: 6px;
}

/* 手機：目錄移到文章上方（預設收合），版面改單欄 */
@media (max-width: 768px) {
  .article-layout,
  .article-layout.has-toc {
    grid-template-columns: minmax(0, 1fr);
    padding: 20px 16px 40px;
  }

  .article-main,
  .article-aside {
    grid-column: 1;
  }

  .article-aside {
    grid-row: 1;
    position: static;
    max-height: none;
    overflow: visible;
  }

  .article-main {
    grid-row: 2;
  }
}
</style>

<style>
/* 文章排版：vue3-markdown-it 輸出純 HTML，所有元素的間距與外觀都在這裡定義 */
.markdown-content {
  color: var(--text);
  line-height: 1.75;
  font-size: 1.05rem;
  min-width: 0;
  overflow-wrap: anywhere;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  color: var(--ink);
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  scroll-margin-top: 88px;
}

.markdown-content h2 {
  border-left: 2px solid var(--primary);
  padding-left: 14px;
}

.markdown-content h2:focus {
  outline: none;
}

.markdown-content p {
  margin: 0 0 1rem;
}

.markdown-content ul,
.markdown-content ol {
  margin: 0 0 1rem;
  padding-left: 1.6rem;
}

.markdown-content li {
  margin: 0.25rem 0;
}

.markdown-content li > ul,
.markdown-content li > ol {
  margin-bottom: 0;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
}

.markdown-content hr {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 2rem 0;
}

.markdown-content a {
  color: var(--primary);
  text-decoration: none;
  border-bottom: 1px dashed var(--primary);
  transition: opacity 0.3s;
}

.markdown-content a:hover {
  opacity: 0.7;
}

.markdown-content :not(pre) > code {
  color: var(--ink);
  background: var(--surface-muted);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.1em 0.35em;
  font-family: var(--font-mono);
  font-size: 0.9em;
}

.markdown-content blockquote {
  margin: 1.5rem 0;
  padding: 0.25rem 1rem;
  border-left: 3px solid var(--line-strong);
  color: var(--text);
}

.markdown-content blockquote > :last-child {
  margin-bottom: 0;
}

.markdown-content pre {
  margin: 2rem 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--code-bg) !important;
  position: relative;
}

.markdown-content pre code {
  padding: 1.5rem !important;
  display: block;
  overflow-x: auto;
  color: var(--code-ink);
  font-family: var(--font-mono) !important;
  font-size: 0.9rem;
  background: transparent !important;
  box-shadow: none !important;
}

/* monokai 的註解色在更暗的程式碼底上對比不足 4.5，改用較亮的同色系 */
.markdown-content .hljs-comment,
.markdown-content .hljs-quote {
  color: var(--code-comment);
}

.btn-copy-code {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--code-line-soft);
  border: 1px solid var(--code-line);
  color: var(--code-ink);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.btn-copy-code:hover {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-copy-code .copy-ok {
  color: var(--code-success);
}

/* 表格寬度超出容器時在表格內水平捲動，不撐破頁面 */
.markdown-content table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid var(--line);
  padding: 12px;
}

.markdown-content th {
  background: var(--surface-muted);
  color: var(--ink);
  text-align: left;
}
</style>

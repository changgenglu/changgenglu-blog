<template>
  <div class="container-lg py-5" ref="container">
    <div v-if="isLoading" class="text-center my-5 py-5">
      <div class="cyber-spinner"></div>
      <p class="mt-3 text-cyan font-mono">LOADING ARTICLE...</p>
    </div>
    <div v-else-if="error" class="card card-glass border-danger text-center my-5 p-5" role="alert">
      <h3 class="text-danger mb-4">{{ error }}</h3>
      <div>
        <router-link to="/" class="btn btn-outline-cyan">回首頁</router-link>
      </div>
    </div>
    <template v-else>
      <!-- Mobile Menu Toggle -->
      <div id="toggle-menu-btn" class="mb-4" v-show="isMobile && markdownMenu !== ''">
        <button class="btn btn-glass-cyan w-100" @click="toggleMenu">
          <i class="fa-solid fa-bars me-2"></i> 目錄
        </button>
      </div>

      <div class="row g-4">
        <!-- Sidebar Menu -->
        <div v-show="showMenu && markdownMenu" :class="{ 'col-md-3': !isMobile, 'col-12': isMobile }">
          <div class="card card-glass sticky-top toc-container p-3">
            <h6 class="text-cyan font-mono mb-3 px-2">CONTENTS</h6>
            <Markdown id="menu" :source="markdownMenu" />
          </div>
        </div>

        <!-- Main Content -->
        <div class="col" :class="{ 'col-md-9': markdownMenu && !isMobile, 'col-12': !markdownMenu || isMobile }">
          <div class="card card-glass markdown-wrapper p-4 p-md-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h2 class="text-light m-0">{{ fileName.replace('.md', '') }}</h2>
              <button class="btn btn-outline-cyan btn-sm" @click="copyArticle" title="複製文章 Markdown">
                <i class="fa-regular fa-copy me-1"></i> 複製文章
              </button>
            </div>
            <Markdown class="markdown-content" :source="markdownContent" @rendered="addCopyButtons" />
          </div>
        </div>
      </div>
    </template>
  </div>
  <scroll-to-top-button v-show="isMobile" />
</template>

<script>
import ScrollToTopButton from '@/components/ScrollToTopButton.vue';
import Markdown from 'vue3-markdown-it';
import { parseMarkdown } from '@/utils/markdownParser';
import fileList from '@/assets/fileNames.json';

export default {
  components: { Markdown, ScrollToTopButton },
  name: 'MarkdownComponent',
  data() {
    return {
      markdownContent: '',
      markdownMenu: '',
      fileName: this.$route.params.title,
      showMenu: false,
      isMobile: false,
      isLoading: false,
      error: null,
    }
  },
  watch: {
    markdownContent() {
      this.$nextTick(() => {
        this.addCopyButtons();
      });
    }
  },
  methods: {
    async loadMarkdown() {
      this.isLoading = true;
      this.error = null;
      try {
        const targetFile = fileList.find(f => f.name === this.fileName);
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
        const { content, tocContent } = parseMarkdown(text);
        
        this.markdownMenu = tocContent || '';
        this.markdownContent = content;
        this.showMenu = !!tocContent;
      } catch (error) {
        this.error = '文章載入失敗，請稍後再試。';
      } finally {
        this.isLoading = false;
        this.checkDevice();
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
            button.innerHTML = '<i class="fa-solid fa-check text-success"></i>';
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
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    checkDevice() {
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile) {
        this.showMenu = false; 
      } else {
        this.showMenu = !!this.markdownMenu;
      }
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
.toc-container {
  top: 100px;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

.markdown-wrapper {
  min-height: 60vh;
}

.text-cyan { color: var(--accent-cyan); }
.font-mono { font-family: var(--font-mono); }

.cyber-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(0, 242, 255, 0.1);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-glass-cyan {
  background: rgba(0, 242, 255, 0.1);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  backdrop-filter: var(--glass-blur);
  border-radius: 12px;
}

.card-glass {
  background: var(--bg-surface);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 20px !important;
}
</style>

<style>
/* Global Markdown Styles */
.markdown-content {
  color: #ccc;
  line-height: 1.8;
  font-size: 1.05rem;
}

.markdown-content h1, .markdown-content h2, .markdown-content h3 {
  color: #fff;
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

/* Override title added by copy button area if needed */
.markdown-wrapper > div > h2 {
  border-left: 4px solid var(--accent-cyan);
  padding-left: 1rem;
}

.markdown-content h2 {
  border-left: 4px solid var(--accent-cyan);
  padding-left: 1rem;
}

.markdown-content a {
  color: var(--accent-cyan);
  text-decoration: none;
  border-bottom: 1px dashed var(--accent-cyan);
  transition: opacity 0.3s;
}

.markdown-content a:hover {
  opacity: 0.7;
}

.markdown-content pre {
  margin: 2rem 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: #0d0d0d !important;
  position: relative;
}

.markdown-content pre code {
  padding: 1.5rem !important;
  display: block;
  font-family: var(--font-mono) !important;
  font-size: 0.9rem;
  background: transparent !important;
  box-shadow: none !important;
}

.btn-copy-code {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ccc;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.btn-copy-code:hover {
  background: rgba(0, 242, 255, 0.2);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

/* Customizing TOC */
#menu ul {
  list-style: none;
  padding-left: 1rem;
}

#menu a {
  color: #888;
  font-size: 0.9rem;
  display: block;
  padding: 4px 0;
  transition: color 0.3s;
}

#menu a:hover {
  color: var(--accent-cyan);
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.markdown-content th, .markdown-content td {
  border: 1px solid var(--glass-border);
  padding: 12px;
}

.markdown-content th {
  background: rgba(255, 255, 255, 0.05);
  color: var(--accent-cyan);
}
</style>

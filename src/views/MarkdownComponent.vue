<template>
  <div class="container-lg mt-3 mb-5">
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="error" class="alert alert-danger text-center my-5" role="alert">
      {{ error }}
      <div class="mt-3">
        <router-link to="/" class="btn btn-outline-danger">回首頁</router-link>
      </div>
    </div>
    <template v-else>
      <div id="toggle-menu-btn" class="col-12 mb-3" v-show="isMobile && markdownMenu !== ''">
        <button class="btn btn-outline-light w-100" @click="toggleMenu">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>
      <div :class="{ 'd-flex': !isMobile }">
        <div v-show="showMenu && markdownMenu" :class="{ 'col-3': !isMobile, 'col-12': isMobile }">
          <Markdown class="sticky-sm-top" id="menu" :source="markdownMenu" v-show="showMenu" />
        </div>
        <div class='markdown-content px-3  position-sticky-end' :class="{ 'col-9': markdownMenu && !isMobile, 'col-12': markdownMenu && isMobile, 'w-100': !markdownMenu }">
          <Markdown :source="markdownContent" />
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
  methods: {
    async loadMarkdown() {
      this.isLoading = true;
      this.error = null;
      try {
        // Cache Busting: 使用當前時間戳 (若有真實更新時間更佳，此處先用 Timestamp)
        const version = new Date().getTime(); 
        const url = `${process.env.BASE_URL}markdownFiles/${encodeURIComponent(this.fileName)}?v=${version}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const text = await response.text();
        const { content, tocContent } = parseMarkdown(text);
        
        if (tocContent) {
          this.markdownMenu = tocContent;
          this.showMenu = true;
        } else {
          this.markdownMenu = '';
          this.showMenu = false;
        }
        
        this.markdownContent = content;
      } catch (error) {
        console.error('Failed to load markdown:', error);
        this.error = '文章載入失敗，請稍後再試。';
        this.markdownContent = '';
      } finally {
        this.isLoading = false;
        // 確保行動裝置狀態正確
        this.checkDevice();
      }
    },
    scrollToFooter() {
      window.scrollTo(0, 0);
    },
    toggleMenu() {
      if (this.markdownMenu === '') {
        this.showMenu = false;
      } else {
        this.showMenu = !this.showMenu;
      }
    },
    checkDevice() {
      if (window.innerWidth <= 768) {
        this.isMobile = true;
        // Mobile 預設不顯示選單
        this.showMenu = false; 
      } else {
        this.isMobile = false;
        // Desktop 若有選單內容則顯示
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

<style>
#menu {
  height: 100vh;
  overflow-y: auto;
}

#menu a {
  color: #888888;
}

#menu ul {
  padding-left: 1rem;
  font-size: 0.9rem;
}

.markdown-content {
  color: #888888;
}

.markdown-content td {
  border: #888888 1px solid;
  padding: 3px;
}

.markdown-content li code {
  padding: 20px;
  padding-top: 40px;
  padding-right: 10px;

}

.markdown-content pre code::-webkit-scrollbar {
  height: 8px;
}

.markdown-content pre code::-webkit-scrollbar-track {
  /* -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5); */
  border-radius: 10px;
}

.markdown-content pre code::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 9999px rgba(80, 80, 80, 0.7);
}


.markdown-content pre code {
  position: relative;
  background-color: #282827;
  border-radius: 8px !important;
  padding: 20px;
  padding-top: 40px;
  margin: 30px 30px;
  box-shadow: inset 0px 12px 39px -25px #ABABAB, 1px 1px 35px 0px #000000;
  -webkit-box-shadow: inset 0px 12px 39px -25px #ABABAB, 1px 1px 35px 0px #000000;
  -moz-box-shadow: inset 0px 12px 39px -25px #ABABAB, 1px 1px 35px 0px #000000;
  -o-box-shadow: inset 0px 12px 39px -25px #ABABAB, 1px 1px 35px 0px #000000;
}

.markdown-content pre code::before {
  color: rgb(197, 197, 197);
  content: attr(data-rel);
  border-radius: 8px 8px 0 0;
  height: 45px;
  line-height: 30px;
  background: #3c3c3b;
  font-size: 16px;
  position: absolute;
  top: -20px;
  left: 0;
  width: 100%;
  font-family: 'Source Sans Pro', sans-serif;
  font-weight: bold;
  padding: 0 65px;
  text-indent: 15px;
  float: left;
}

.markdown-content pre code::after {
  content: '';
  position: absolute;
  -webkit-border-radius: 50%;
  border-radius: 50%;
  background: #fc625d;
  width: 12px;
  height: 12px;
  top: 3px;
  left: 10px;
  margin-top: 4px;
  -webkit-box-shadow: 20px 0px #fdbc40, 40px 0px #35cd4b;
  box-shadow: 20px 0px #fdbc40, 40px 0px #35cd4b;
  z-index: 3;
}

.markdown-content tbody {
  border: rgb(17, 28, 29) 2px solid;
}

.markdown-content h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: Gambarino, serif;
  color: #e4ece4;
  font-weight: bolder;
}

#toggle-menu-btn {
  width: 70%;
  margin: auto
}

/* //捲軸底色 */
#menu::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  /* background-color: #c7c7c7; */
}

/* //捲軸寬度 */
#menu::-webkit-scrollbar {
  width: 6px;
}

/* //捲軸本體顏色 */
#menu::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: #383838;
}

@media (max-width: 768px) {
  .markdown-content pre code {
    padding: 20px;
    padding-top: 40px;
    margin: 0;
  }
}
</style>
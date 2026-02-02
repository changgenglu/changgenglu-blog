<template>
  <div class="container-lg py-5">
    <div class="search-section mb-5">
      <div class="search-container">
        <div class="search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input type="text" v-model="searchText" placeholder="搜尋全站筆記..." class="search-input">
        <div class="search-glow"></div>
      </div>
    </div>

    <!-- Categories View -->
    <div v-show="!searchText">
      <div class="section-header d-flex align-items-center mb-4">
        <div class="header-line"></div>
        <h4 class="text-light mx-3 mb-0">文章分類</h4>
        <div class="header-line flex-grow-1"></div>
      </div>
      
      <div class="row">
        <div v-for="(category, index) in categories" :key="index" :class="{ 'col-md-4': !isMobile, 'col-12': isMobile }">
          <router-link :to="`/category/${category}`" class="text-decoration-none">
            <div class="card mb-4 category-card card-glass">
              <div class="card-body d-flex flex-column justify-content-center align-items-center py-5">
                <div class="category-icon mb-3">
                  <span class="icon-orb"></span>
                </div>
                <h3 class="card-title text-light mb-2">{{ category }}</h3>
                <span class="category-count">{{ getCategoryCount(category) }} ARTICLES</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Search Results View -->
    <div v-show="searchText">
      <div class="section-header d-flex align-items-center mb-4">
        <div class="header-line header-line-warning"></div>
        <h4 class="text-light mx-3 mb-0">搜尋結果</h4>
        <div class="header-line header-line-warning flex-grow-1"></div>
      </div>

      <div class="row">
        <div v-for="(item, index) in markdownCards" :key="index" :class="{ 'col-md-6': !isMobile }">
          <ArticleCard :item="item" :isMobile="isMobile" :showCategory="true" />
        </div>
        <div v-show="searchResults.length === 0">
          <div class="h2 text-center m-5 text-light opacity-50">
            查無相符的筆記
          </div>
        </div>
      </div>

      <!-- pagination -->
      <nav v-show="searchResults.length !== 0 && paginationPageNum.length > 1">
        <ul class="pagination custom-pagination mt-4">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="setPage(currentPage - 1)">&laquo;</a>
          </li>
          <li class="page-item" :class="{ 'active': (currentPage === n) }" v-for="(n, index) in paginationPageNum"
            :key="index" @click.prevent="setPage(n)">
            <a class="page-link" href="#">{{ n }}</a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPage }">
            <a class="page-link" href="#" @click.prevent="setPage(currentPage + 1)">&raquo;</a>
          </li>
        </ul>
      </nav>
    </div>

  </div>
</template>

<script>
import AllMyArticle from '../assets/fileNames.json';
import ArticleCard from '@/components/ArticleCard.vue';

export default {
  name: 'HomeView',
  components: { ArticleCard },
  data() {
    return {
      files: [],
      CardNum: 6,
      currentPage: 1,
      searchText: '',
      searchResults: [],
      isMobile: false,
      paginationLength: 5
    }
  },
  watch: {
    searchText() {
      this.currentPage = 1;
      this.search();
    },
  },
  computed: {
    categories() {
        const cats = new Set(this.files.map(f => f.category));
        return Array.from(cats).sort();
    },
    paginationPageNum() {
      let pageCount = [];
      let totalPage = this.totalPage;
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(totalPage, start + this.paginationLength - 1);
      
      if (end - start + 1 < this.paginationLength) {
        start = Math.max(1, end - this.paginationLength + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pageCount.push(i);
      }
      return pageCount;
    },
    totalPage() {
      return Math.ceil(this.searchResults.length / this.CardNum)
    },
    pageStart() {
      return (this.currentPage - 1) * this.CardNum
    },
    pageEnd() {
      return this.currentPage * this.CardNum
    },
    markdownCards() {
      return this.searchResults.slice(this.pageStart, this.pageEnd);
    }
  },
  methods: {
    checkDevice() {
      this.isMobile = window.innerWidth < 768;
    },
    search() {
      const searchText = this.searchText.toLowerCase();
      this.searchResults = this.files.filter(file => file.name.toLowerCase().includes(searchText));
    },
    getFilesInFolder() {
      this.files = AllMyArticle.map(item => (
        {
          date: item.date,
          name: item.name,
          matchingLines: item.matchingLines,
          category: item.category
        }
      ))
    },
    getCategoryCount(category) {
        return this.files.filter(f => f.category === category).length;
    },
    setPage(page) {
      if (page <= 0 || page > this.totalPage) { return }
      this.currentPage = page
    }
  },
  mounted() {
    this.getFilesInFolder();
    this.searchResults = this.files;
    this.checkDevice();
    window.addEventListener('resize', this.checkDevice);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkDevice);
  }
}
</script>

<style scoped>
.search-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 16px 20px 16px 50px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  color: white;
  font-size: 1.1rem;
  outline: none;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.search-input:focus {
  border-color: var(--accent-cyan);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
}

.search-input:focus + .search-glow {
  opacity: 1;
}

.search-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 30px;
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.1);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.section-header .header-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan));
  width: 50px;
}

.section-header .header-line-warning {
  background: linear-gradient(90deg, transparent, #ffc107);
}

.category-card {
  text-align: center;
  transition: all 0.3s;
  border-radius: 20px !important;
}

.category-card:hover {
  transform: scale(1.03);
  border-color: var(--accent-cyan);
}

.icon-orb {
  display: block;
  width: 12px;
  height: 12px;
  background: var(--accent-cyan);
  border-radius: 50%;
  box-shadow: 0 0 15px var(--accent-cyan);
  margin: 0 auto;
}

.category-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #888;
  letter-spacing: 0.1em;
}

.card-glass {
  background: var(--bg-surface);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
}

.custom-pagination {
  justify-content: center;
}

.custom-pagination .page-link {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: #888;
  margin: 0 5px;
  border-radius: 8px;
  transition: all 0.3s;
}

.custom-pagination .page-link:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan);
  background: rgba(0, 242, 255, 0.05);
}

.custom-pagination .active .page-link {
  background: var(--accent-cyan);
  border-color: var(--accent-cyan);
  color: black;
}

.custom-pagination .disabled .page-link {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>

<template>
  <div class="container-lg py-5">
    <div class="search-section mb-5">
      <SearchInput v-model:modelValue="searchText" @search="handleSearch"></SearchInput>
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
import SearchInput from '@/components/SearchInput.vue'; // New import
import { search } from '@/utils/searchEngine'; // New import

export default {
  name: 'HomeView',
  components: { ArticleCard, SearchInput }, // Updated components
  data() {
    return {
      allArticlesMeta: AllMyArticle, // Store for categories
      CardNum: 6,
      currentPage: 1,
      searchText: '',
      searchResults: [], // Will store MiniSearch results
      isMobile: false,
      paginationLength: 5
    }
  },
  watch: {
    // 監聽路由參數變化，以實現 URL 驅動搜尋
    '$route.query.q': {
      handler(newQuery) {
        // 更新 searchText 以便 v-model 同步
        this.searchText = newQuery || '';
        // 觸發搜尋
        this.handleSearch(this.searchText);
      },
      immediate: true // 頁面載入時立即執行一次
    }
  },
  computed: {
    categories() {
        const cats = new Set(this.allArticlesMeta.map(f => f.category));
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
      const currentCards = this.searchResults.slice(this.pageStart, this.pageEnd);
      // 將 MiniSearch 的結果映射回原始的 AllMyArticle 格式
      return currentCards.map(result => {
        const originalArticle = this.allArticlesMeta.find(item => item.path === result.id);
        // 如果找不到原始文章 (理論上不會發生)，則返回 MiniSearch 的結果作為備用
        return originalArticle ? {
          ...originalArticle,
          score: result.score, // MiniSearch 相關資訊
          terms: result.terms,
          query: result.query,
          match: result.match // 匹配的欄位及位置
        } : { // 備用結構，確保 ArticleCard 不會出錯
          date: new Date().toISOString(),
          name: result.title || '',
          matchingLines: [], 
          category: result.category || 'Uncategorized',
          path: result.id || '',
          score: result.score,
          terms: result.terms,
          query: result.query,
          match: result.match
        };
      });
    }
  },
  methods: {
    checkDevice() {
      this.isMobile = window.innerWidth < 768;
    },
    // 處理搜尋邏輯
    handleSearch(query) {
      this.currentPage = 1; // 重置分頁
      this.searchResults = query ? search(query) : this.allArticlesMeta.map(item => ({id: item.path, title: item.name, category: item.category})); // 使用 MiniSearch
      // 如果 query 為空，則顯示所有文章，但格式需符合 MiniSearch 結果的基礎結構
      
      // 同步 URL query 參數，避免重複導航
      if ((query || '') !== (this.$route.query.q || '')) {
        this.$router.replace({ query: query ? { q: query } : {} }).catch(()=>{}); // catch navigation error
      }
    },
    getCategoryCount(category) {
        return this.allArticlesMeta.filter(f => f.category === category).length;
    },
    setPage(page) {
      if (page <= 0 || page > this.totalPage) { return }
      this.currentPage = page
    }
  },
  mounted() {
    this.checkDevice();
    window.addEventListener('resize', this.checkDevice);
    // 頁面初次載入時，如果 URL 中沒有 q 參數，則手動觸發一次 handleSearch，顯示所有文章
    if (!this.$route.query.q) {
      this.searchResults = this.allArticlesMeta.map(item => ({id: item.path, title: item.name, category: item.category}));
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkDevice);
  }
}
</script>

<style scoped>
/* Search related styles moved to SearchInput.vue */

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

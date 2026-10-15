<template>
  <div class="home">
    <section class="hero grid-paper hero-grid-bg">
      <div class="hero-inner">
        <div class="hero-text" data-reveal>
          <p class="hero-eyebrow">[ NOTES ]</p>
          <h1 class="hero-title">開發筆記</h1>
          <p class="hero-desc">PHP、開發工具、AI 工作流與系統相關的實作紀錄與踩坑整理。</p>
          <p class="hero-stats">
            <span><b>{{ shownNoteCount }}</b> 篇筆記</span>
            <span><b>{{ shownCategoryCount }}</b> 個分類</span>
          </p>
        </div>
        <HeroDiagram class="hero-art" data-reveal />
      </div>
    </section>
    <div class="stripe" aria-hidden="true"></div>

    <div class="grid-paper home-body">
      <div class="search-section" data-reveal>
        <SearchInput v-model:modelValue="searchText" @search="handleSearch"></SearchInput>
      </div>

      <CategoryChips data-reveal v-model="activeCategory" :categories="categories" :counts="categoryCounts" />

      <div class="card-grid">
        <div v-for="(item, index) in markdownCards" :key="index">
          <ArticleCard :item="item" :isMobile="isMobile" :showCategory="true" />
        </div>
      </div>
      <div v-show="filteredResults.length === 0" class="empty-state">
        查無相符的筆記
      </div>

      <!-- pagination -->
      <nav class="pagination-nav" aria-label="分頁" v-show="filteredResults.length !== 0 && paginationPageNum.length > 1">
        <ul class="pager">
          <li :class="{ disabled: currentPage === 1 }">
            <a class="pager-link" href="#" aria-label="上一頁" @click.prevent="setPage(currentPage - 1)">&laquo;</a>
          </li>
          <li :class="{ active: currentPage === n }" v-for="(n, index) in paginationPageNum" :key="index">
            <a class="pager-link" href="#" :aria-current="currentPage === n ? 'page' : null" @click.prevent="setPage(n)">{{ n }}</a>
          </li>
          <li :class="{ disabled: currentPage === totalPage }">
            <a class="pager-link" href="#" aria-label="下一頁" @click.prevent="setPage(currentPage + 1)">&raquo;</a>
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
import CategoryChips from '@/components/CategoryChips.vue';
import { search } from '@/utils/searchEngine'; // New import
import HeroDiagram from '@/components/HeroDiagram.vue';
import { useReveal } from '@/composables/useReveal';
import { countUp } from '@/utils/countUp';
import { ALL, filterByCategory, listCategories } from '@/utils/articleFilter';

export default {
  name: 'HomeView',
  components: { ArticleCard, SearchInput, CategoryChips, HeroDiagram }, // Updated components
  setup() {
    useReveal();
    return {};
  },
  data() {
    return {
      allArticlesMeta: AllMyArticle, // Store for categories
      CardNum: 6,
      currentPage: 1,
      activeCategory: ALL,
      searchText: '',
      searchResults: [], // Will store MiniSearch results
      latestSearchId: 0,
      isMobile: false,
      shownNoteCount: 0,
      shownCategoryCount: 0,
      cancelCounts: [],
      paginationLength: 5
    }
  },
  watch: {
    activeCategory() {
      this.currentPage = 1;
    },
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
      return listCategories(this.allArticlesMeta);
    },
    categoryCounts() {
      const counts = {};
      this.allArticlesMeta.forEach(f => { counts[f.category] = (counts[f.category] || 0) + 1; });
      return counts;
    },
    // 資料流：搜尋結果 → 分類篩選 → 分頁
    filteredResults() {
      return filterByCategory(this.searchResults, this.activeCategory);
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
      return Math.ceil(this.filteredResults.length / this.CardNum)
    },
    pageStart() {
      return (this.currentPage - 1) * this.CardNum
    },
    pageEnd() {
      return this.currentPage * this.CardNum
    },
    markdownCards() {
      const currentCards = this.filteredResults.slice(this.pageStart, this.pageEnd);
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
    async handleSearch(query) {
      this.currentPage = 1; // 重置分頁
      // 搜尋為非同步，快速連續輸入時只套用最新一次查詢的結果
      const requestId = ++this.latestSearchId;
      if (!query) {
        this.searchResults = this.allArticlesMeta.map(item => ({
          id: item.path,
          title: item.name,
          category: item.category,
          path: item.path
        }));
      } else {
        try {
          const results = await search(query);
          if (requestId !== this.latestSearchId) { return; }
          this.searchResults = results;
        } catch (error) {
          if (requestId !== this.latestSearchId) { return; }
          this.searchResults = []; // 索引下載失敗時顯示無結果
        }
      }

      // 同步 URL query 參數，避免重複導航
      if ((query || '') !== (this.$route.query.q || '')) {
        this.$router.replace({ query: query ? { q: query } : {} }).catch(()=>{}); // catch navigation error
      }
    },
    setPage(page) {
      if (page <= 0 || page > this.totalPage) { return }
      this.currentPage = page
    }
  },
  mounted() {
    this.checkDevice();
    this.cancelCounts = [
      countUp(this.allArticlesMeta.length, (v) => { this.shownNoteCount = v; }),
      countUp(this.categories.length, (v) => { this.shownCategoryCount = v; })
    ];
    window.addEventListener('resize', this.checkDevice);
    // 頁面初次載入時，如果 URL 中沒有 q 參數，則手動觸發一次 handleSearch，顯示所有文章
    if (!this.$route.query.q) {
      this.searchResults = this.allArticlesMeta.map(item => ({
        id: item.path, 
        title: item.name, 
        category: item.category,
        path: item.path
      }));
    }
  },
  beforeUnmount() {
    this.cancelCounts.forEach((cancel) => cancel());
    window.removeEventListener('resize', this.checkDevice);
  }
}
</script>

<style scoped>
.hero {
  padding: 56px 24px 40px;
}

.hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.hero-text {
  min-width: 0;
}

.hero-art {
  flex: 0 0 min(320px, 32%);
}

.hero-stats {
  display: flex;
  gap: 24px;
  margin: 20px 0 0;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-faint);
}

.hero-stats b {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.hero-eyebrow {
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--primary);
  letter-spacing: 0.08em;
}

.hero-title {
  margin: 0 0 12px;
  font-size: clamp(2rem, 6vw, 3.25rem);
  font-weight: 600;
  line-height: 1.2;
  color: var(--ink);
}

.hero-desc {
  margin: 0;
  max-width: 40rem;
  font-size: 1.05rem;
  color: var(--text);
}

.home-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 24px 48px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.card-grid > div {
  min-width: 0;
}

.empty-state {
  padding: 48px 0;
  text-align: center;
  font-size: 1.25rem;
  color: var(--text);
}

.pager {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pager-link {
  display: inline-block;
  min-width: 40px;
  padding: 6px 12px;
  text-align: center;
  text-decoration: none;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
}

.pager-link:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.pager .active .pager-link {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--on-primary);
}

.pager .disabled .pager-link {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 767.98px) {
  .hero-art {
    display: none;
  }

  .hero {
    padding: 36px 16px 28px;
  }

  .home-body {
    padding: 24px 16px 40px;
  }

  .card-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

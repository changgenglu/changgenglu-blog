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

      <CategoryChips data-reveal :model-value="activeCategory" @update:model-value="selectCategory" :categories="categories" :counts="categoryCounts" />

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

// 網址 query 是分類與頁碼的唯一來源，非法值回退到預設，避免手改網址或舊連結壞掉版面
function parseListState(query, categories) {
  const page = Number(query.page);
  return {
    category: categories.includes(query.cat) ? query.cat : ALL,
    page: Number.isInteger(page) && page > 0 ? page : 1
  };
}

function sameListQuery(a, b) {
  return ['cat', 'page', 'q'].every((key) => String(a[key] ?? '') === String(b[key] ?? ''));
}

export default {
  name: 'HomeView',
  components: { ArticleCard, SearchInput, CategoryChips, HeroDiagram }, // Updated components
  setup() {
    useReveal();
    return {};
  },
  data() {
    const restored = parseListState(this.$route.query, listCategories(AllMyArticle));
    return {
      allArticlesMeta: AllMyArticle, // Store for categories
      CardNum: 6,
      currentPage: restored.page,
      activeCategory: restored.category,
      // 離開首頁後 $route 已是別頁的資料，靠它辨認「這個畫面還在原本的路由上」
      routeName: this.$route.name,
      // 自己剛寫進網址的搜尋詞；對應的 watcher 回呼不可再把它當外部變更處理
      ownQuery: null,
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
    activeCategory() { this.syncQuery(); },
    currentPage() { this.syncQuery(); },
    '$route.query.cat'() { this.restoreFromRoute(); },
    '$route.query.page'() { this.restoreFromRoute(); },
    // 監聽路由參數變化，以實現 URL 驅動搜尋
    '$route.query.q': {
      handler(newQuery) {
        if (!this.isOnOwnRoute()) { return; }
        const query = newQuery || '';
        if (query === this.ownQuery) {
          this.ownQuery = null;
          return;
        }
        this.ownQuery = null;
        // 與輸入框內容相同代表是自己剛搜尋的結果，不回寫輸入框也不重搜，以免蓋掉使用者接著打的字
        if (query === this.searchText) { return; }
        this.searchText = query;
        this.runSearch(query);
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
    isOnOwnRoute() {
      return this.$route.name === this.routeName;
    },
    // 以目前的分類與頁碼為準重組 query，其餘參數（含 q）原樣保留；預設值不寫入網址
    buildQuery(q) {
      const query = { ...this.$route.query };
      delete query.cat;
      delete query.page;
      delete query.q;
      if (this.activeCategory !== ALL) { query.cat = this.activeCategory; }
      if (this.currentPage > 1) { query.page = String(this.currentPage); }
      if (q) { query.q = q; }
      return query;
    },
    replaceQuery(query) {
      this.$router.replace({ query }).catch(() => {}); // catch navigation error
    },
    syncQuery() {
      if (!this.isOnOwnRoute()) { return; }
      const query = this.buildQuery(this.$route.query.q);
      if (!sameListQuery(query, this.$route.query)) { this.replaceQuery(query); }
    },
    restoreFromRoute() {
      if (!this.isOnOwnRoute()) { return; }
      const { category, page } = parseListState(this.$route.query, this.categories);
      this.activeCategory = category;
      this.currentPage = page;
      this.clampPage();
    },
    // 頁碼只能等結果數量確定後才判斷是否超出；結果為空時不動，避免載入中被歸 1
    clampPage() {
      if (this.totalPage >= 1 && this.currentPage > this.totalPage) { this.currentPage = 1; }
    },
    selectCategory(category) {
      if (category === this.activeCategory) { return; }
      this.activeCategory = category;
      this.currentPage = 1;
    },
    // 使用者主動搜尋才重置頁碼；由網址還原的搜尋走 runSearch，保留還原的頁碼
    async handleSearch(query) {
      this.currentPage = 1;
      await this.runSearch(query);
    },
    async runSearch(query) {
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

      this.clampPage();
      // 搜尋回來時使用者可能已離開首頁，此時不可把 q 寫到別頁的網址
      if (!this.isOnOwnRoute()) { return; }
      // 同步 URL query 參數，避免重複導航
      if ((query || '') !== (this.$route.query.q || '')) {
        this.ownQuery = query || '';
        this.replaceQuery(this.buildQuery(query));
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
    this.clampPage();
    this.syncQuery();
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

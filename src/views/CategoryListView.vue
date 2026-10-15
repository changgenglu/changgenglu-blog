<template>
  <div class="category-page">
    <section class="category-hero grid-paper">
      <p class="eyebrow">[ CATEGORY ]</p>
      <h2 class="category-title">{{ categoryName }}</h2>
    </section>
    <div class="stripe" aria-hidden="true"></div>

    <div class="grid-paper category-body">
      <div class="search-section">
        <SearchInput v-model:modelValue="searchText" @search="handleSearch" placeholder="在此分類中搜尋..." ></SearchInput>
      </div>

      <div class="card-grid">
        <div v-for="(item, index) in markdownCards" :key="index">
          <ArticleCard :item="item" :isMobile="isMobile" />
        </div>
      </div>
      <div v-show="files.length === 0" class="empty-state">
        查無資料
      </div>

      <nav class="pagination-nav" aria-label="分頁" v-show="files.length !== 0 && paginationPageNum.length !== 1">
        <ul class="pager">
          <li :class="{ disabled: currentPage === 1 }">
            <button type="button" class="pager-link" aria-label="上一頁" @click="setPage(currentPage - 1)">&laquo;</button>
          </li>
          <li :class="{ active: currentPage === n }" v-for="(n, index) in paginationPageNum" :key="index">
            <button type="button" class="pager-link" :aria-current="currentPage === n ? 'page' : null" @click="setPage(n)">{{ n }}</button>
          </li>
          <li :class="{ disabled: currentPage === totalPage }">
            <button type="button" class="pager-link" aria-label="下一頁" @click="setPage(currentPage + 1)">&raquo;</button>
          </li>
        </ul>
      </nav>

      <div class="back-link">
        <router-link to="/" class="btn-ghost">回首頁</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import AllMyArticle from '../assets/fileNames.json';
import ArticleCard from '@/components/ArticleCard.vue';
import SearchInput from '@/components/SearchInput.vue'; // New import

export default {
  name: 'CategoryListView',
  components: { ArticleCard, SearchInput }, // Updated components
  data() {
    return {
      files: [],
      CardNum: 6,
      currentPage: 1,
      isMobile: false,
      paginationLength: 5,
      categoryName: this.$route.params.categoryName,
      searchText: '' // New data property
    }
  },
  computed: {
    paginationPageNum() {
      let pageCount = [];
      let totalPage = this.totalPage;
      const paginationLength = this.paginationLength;

      if (totalPage <= paginationLength) { // If total pages is small, show all pages
        for (let i = 1; i <= totalPage; i++) {
          pageCount.push(i);
        }
      } else { // Otherwise, calculate a window
        let startPage = Math.max(1, this.currentPage - Math.floor(paginationLength / 2));
        let endPage = startPage + paginationLength - 1;

        if (endPage > totalPage) { // Adjust if window goes beyond total pages
          endPage = totalPage;
          startPage = Math.max(1, endPage - paginationLength + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
          pageCount.push(i);
        }
      }
      return pageCount; // No need for filter(i => i > 0) with this logic
    },
    totalPage() {
      return Math.ceil(this.files.length / this.CardNum)
    },
    pageStart() {
      return (this.currentPage - 1) * this.CardNum
    },
    pageEnd() {
      return this.currentPage * this.CardNum
    },
    markdownCards() {
      return this.files.slice(this.pageStart, this.pageEnd);
    }
  },
  methods: {
    checkDevice() {
        this.isMobile = window.innerWidth < 768;
    },
    handleSearch(query) {
      // 導向 HomeView 並帶入搜尋參數
      this.$router.push({ 
        name: 'home', 
        query: { q: query } 
      });
    },
    getFilesInCategory() {
      this.files = AllMyArticle
        .filter(item => item.category === this.categoryName)
        .map(item => ({
          date: item.date,
          name: item.name,
          matchingLines: item.matchingLines,
          category: item.category,
          path: item.path // Ensure path is included
        }));
    },
    setPage(page) {
      if (page <= 0 || page > this.totalPage) { return }
      this.currentPage = page
    }
  },
  mounted() {
    this.getFilesInCategory();
    this.checkDevice();
    window.addEventListener('resize', this.checkDevice);
  },
  unmounted() {
    window.removeEventListener('resize', this.checkDevice);
  }
}
</script>

<style scoped>
.category-hero {
  padding: 48px 24px 32px;
}

.eyebrow {
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--primary);
  letter-spacing: 0.08em;
}

.category-title {
  margin: 0;
  font-size: clamp(1.75rem, 5vw, 2.75rem);
  font-weight: 600;
  line-height: 1.2;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.category-body {
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

.back-link {
  text-align: center;
}

@media (max-width: 767.98px) {
  .category-hero {
    padding: 32px 16px 24px;
  }

  .category-body {
    padding: 24px 16px 40px;
  }

  .card-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

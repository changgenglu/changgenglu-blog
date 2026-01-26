<template>
  <div class="container-lg">
    <div class="d-flex justify-content-center p-4">
      <div class="row search-input">
        <span class="col-2">
          <svg aria-label="Search" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M21.71 20.29 18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a.999.999 0 0 0 1.42 0 1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z">
            </path>
          </svg>
        </span>
        <input type="text" v-model="searchText" placeholder="搜尋筆記 (跨分類)" class="col-10">
      </div>
    </div>

    <!-- Categories View -->
    <div v-show="!searchText">
      <h4 class="text-light mb-4 px-3 border-start border-4 border-danger">文章分類</h4>
      <div class="row">
        <div v-for="(category, index) in categories" :key="index" :class="{ 'col-4': !isMobile, 'col-12': isMobile }">
          <router-link :to="`/category/${category}`" class="text-decoration-none">
            <div class="card mb-4 bg-dark border-secondary h-100 category-card">
              <div class="card-body d-flex flex-column justify-content-center align-items-center">
                <h3 class="card-title text-light mb-3">{{ category }}</h3>
                <span class="badge rounded-pill bg-danger">{{ getCategoryCount(category) }} 篇筆記</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Search Results View -->
    <div v-show="searchText">
      <h4 class="text-light mb-4 px-3 border-start border-4 border-warning">搜尋結果</h4>
      <div class="row">
        <div v-for="(item, index) in markdownCards" :key="index" :class="{ 'col-6': !isMobile }">
          <ArticleCard :item="item" :isMobile="isMobile" :showCategory="true" />
        </div>
        <div v-show="searchResults.length === 0">
          <div class="h2 text-center m-5 text-light">
            查無資料
          </div>
        </div>
      </div>

      <!-- pagination -->
      <ul class="pagination" v-show="searchResults.length !== 0 && paginationPageNum.length !== 1">
        <li class="page-item" @click.prevent="setPage(currentPage - 1)">
          <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
        <li class="page-item" :class="{ 'active': (currentPage === (n)) }" v-for="(n, index) in paginationPageNum"
          :key="index" @click.prevent="setPage(n)">
          <a class="page-link" href="#">{{ n }}</a>
        </li>
        <li class="page-item" @click.prevent="setPage(currentPage + 1)">
          <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      </ul>
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
      this.currentPage = 1; // Reset page on search
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
      for (let i = 0; i < this.paginationLength; i++) {
        if (this.currentPage >= totalPage - (this.paginationLength - 1)) {
          pageCount.push(i + totalPage - (this.paginationLength - 1));
        } else {
          pageCount.push(i + this.currentPage);
        }
      }
      return pageCount.filter(i => i > 0);
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
      if (window.innerWidth < 768) {
        this.isMobile = true;
      } else {
        this.isMobile = false;
      }
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
    this.searchResults = this.files; // Initially all files, but we hide them if searchText is empty
    this.checkDevice();
    addEventListener('resize', this.checkDevice);
  },
}
</script>

<style scoped>
.pagination {
  padding: 0;
  justify-content: center;
  --bs-pagination-color: rgb(116, 116, 116);
  --bs-pagination-hover-color: white;
  --bs-pagination-focus-color: white;
  --bs-pagination-bg: none;
  --bs-pagination-border-color: none;
  --bs-pagination-hover-bg: none;
  --bs-pagination-active-color: #fff;
  --bs-pagination-focus-color: none;
  --bs-pagination-focus-bg: none;
  --bs-pagination-focus-box-shadow: none;
  --bs-pagination-active-bg: none;
}

.search-input>input {
  background-color: rgb(17, 28, 29);
  border: 0;
  text-align: center;
  color: white;
}

.category-card {
    transition: transform 0.2s;
    cursor: pointer;
}
.category-card:hover {
    transform: translateY(-5px);
    border-color: #dc3545 !important;
}
</style>

<style>
/* ... global styles ... */
.card span {
  color: #888888;
}

.card p {
  color: #dddddd;
  font-weight: bolder;
  margin: 0;
}

a {
  text-decoration: none;
}

.h5 {
  font-family: Gambarino, serif;
}

@media screen and (min-width: 768px) {
  .card {
    min-height: 190px;
    position: relative;
    border-radius: 8px !important;
    box-shadow: inset 0px 12px 39px -25px #ABABAB, 1px 1px 35px 0px #000000;
    -webkit-box-shadow: inset 0px 12px 39px -25px #ABABAB, 1px 1px 35px 0px #000000;
    -moz-box-shadow: inset 0px 12px 39px -25px #ABABAB, 1px 1px 35px 0px #000000;
    -o-box-shadow: inset 0px 12px 39px -25px #ABABAB, 1px 1px 35px 0px #000000;
  }

  .card .card-header {
    color: rgb(197, 197, 197);
    content: attr(data-rel);
    /* border-radius: 8px 8px 0 0; */
    height: 30px;
    line-height: 30px;
    background-color: #3c3c3b;
    width: 100%;
    padding: 0;
    float: left;
  }

  .card .card-body {
    background-color: #282827;
    border-radius: 8px !important;
  }

  .card .card-header::after {
    content: '';
    position: absolute;
    -webkit-border-radius: 50%;
    border-radius: 50%;
    background: #fc625d;
    width: 12px;
    height: 12px;
    top: 3px;
    left: 10px;
    margin-top: 5px;
    -webkit-box-shadow: 20px 0px #fdbc40, 40px 0px #35cd4b;
    box-shadow: 20px 0px #fdbc40, 40px 0px #35cd4b;
    z-index: 3;
  }

}
</style>
<template>
  <div class="container-lg">
    <h2 class="text-center my-4 text-light">{{ categoryName }}</h2>
    <div class="row">
      <div v-for="(item, index) in markdownCards" :key="index" :class="{ 'col-6': !isMobile }">
        <ArticleCard :item="item" :isMobile="isMobile" />
      </div>
      <div v-show="files.length === 0">
        <div class="h2 text-center m-5 text-light">
          查無資料
        </div>
      </div>
    </div>
    <!-- pagination -->
     <ul class="pagination" v-show="files.length !== 0 && paginationPageNum.length !== 1">
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
    
    <div class="text-center mt-4 mb-5">
        <router-link to="/" class="btn btn-outline-light">回分類首頁</router-link>
    </div>
  </div>
</template>

<script>
import AllMyArticle from '../assets/fileNames.json';
import ArticleCard from '@/components/ArticleCard.vue';

export default {
  name: 'CategoryListView',
  components: { ArticleCard },
  data() {
    return {
      files: [],
      CardNum: 6,
      currentPage: 1,
      isMobile: false,
      paginationLength: 5,
      categoryName: this.$route.params.categoryName
    }
  },
  computed: {
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
    getFilesInCategory() {
      this.files = AllMyArticle
        .filter(item => item.category === this.categoryName)
        .map(item => ({
          date: item.date,
          name: item.name,
          matchingLines: item.matchingLines,
          category: item.category
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
</style>

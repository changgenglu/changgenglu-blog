<template>
  <div class="container">
    <div class="d-flex justify-content-center p-4">
      <div class="row">
        <div class="col-5 pt-1">
          <span>搜尋筆記：</span>
        </div>
        <div class="col-7">
          <input type="text" v-model="searchText" placeholder="筆記標題" class="form-control form-control-sm">
        </div>
      </div>
    </div>
    <div class="row">
      <div v-for="(item, index) in searchResult" :key="index" :class="{ 'col-6': !isMobile }">
        <router-link :to="`/${item.name}`">
          <div class="card mb-3 bg-transparent" :class="{ 'border-light': isMobile }">
            <div class="card-header d-flex"
              :class="{ 'justify-content-between': isMobile, 'justify-content-around': !isMobile }">
              <span style="width: 65px;" v-show="!isMobile"></span>
              <p class="h6 pt-1">{{ item.name.split('.md')[0] }}</p>
              <span class="fs-6 fst-italic fw-lighter">{{ countDate(item.date) }} ago</span>
            </div>
            <div class="card-body text-center" v-show="!isMobile">
              <div v-for="title, index in item.matchingLines" :key="index">
                <span>{{ title }}</span>
              </div>
            </div>
          </div>
        </router-link>
      </div>
      <div v-show="searchResults.length === 0">
        <div class="h2 text-center m-5">
          查無資料
        </div>
      </div>
    </div>
    <!-- pagination -->
    <ul class="pagination" v-show="searchResults.length !== 0">
      <li class="page-item" @click.prevent="setPage(currentPage - 1)">
        <a class="page-link" href="#" aria-label="Previous">
          <span aria-hidden="true">&laquo;</span>
        </a>
      </li>
      <li class="page-item" :class="{ 'active': (currentPage === (n)) }" v-for="(n, index) in totalPages" :key="index"
        @click.prevent="setPage(n)">
        <a class="page-link" href="#">{{ n }}</a>
      </li>
      <li class="page-item" @click.prevent="setPage(currentPage + 1)">
        <a class="page-link" href="#" aria-label="Next">
          <span aria-hidden="true">&raquo;</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import AllMyArticle from '../assets/fileNames.json';

export default {
  name: 'HomeView',
  components: {},
  data() {
    return {
      files: [],
      dataInPage: 6,
      currentPage: 1,
      searchText: '',
      searchResults: [],
      windowSize: window.innerWidth,
      isMobile: false,
    }
  },
  watch: {
    searchText: function () {
      this.search();
    },
    windowSize: function () {
      this.checkDevice()
    }
  },
  computed: {
    totalPages() {
      if (this.searchResults.length === 0) {
        return Math.ceil(this.files.length / this.dataInPage)
      } else {
        return Math.ceil(this.searchResults.length / this.dataInPage)
      }
      //Math.ceil()取最小整數
    },
    pageStart() {
      return (this.currentPage - 1) * this.dataInPage
    },
    pageEnd() {
      return this.currentPage * this.dataInPage
      //取得該頁最後一個值的index
    },
    searchResult() {
      const { searchResults, files, pageStart, pageEnd } = this;

      if (searchResults.length === files.length) {
        return files.slice(pageStart, pageEnd);
      } else {
        return searchResults.slice(pageStart, pageEnd);
      }
    }
  },
  methods: {
    checkDevice() {
      if (this.windowSize < 768) {
        this.isMobile = true;
      }
    },
    search: function () {
      const searchText = this.searchText.toLowerCase();
      this.searchResults = this.files.filter(file => file.name.toLowerCase().includes(searchText));
    },
    getFilesInFolder: function () {
      this.files = AllMyArticle.map(item => (
        {
          date: item.date,
          name: item.name,
          matchingLines: item.matchingLines
        }
      ))
    },
    setPage(page) {
      if (page <= 0 || page > this.totalPages) {
        return
      }
      this.currentPage = page
    },
    countDate: function (fileDate) {
      // 取得本地時間
      var now = new Date();

      // 將指定時間轉換為日期物件
      var specifiedDate = new Date(fileDate);

      // 計算本地時間與指定時間的差距（以毫秒為單位）
      var differenceMilliseconds = now.getTime() - specifiedDate.getTime();

      // 將差距時間轉換為語意化時間
      var seconds = Math.floor(differenceMilliseconds / 1000) % 60;
      var minutes = Math.floor(differenceMilliseconds / (1000 * 60)) % 60;
      var hours = Math.floor(differenceMilliseconds / (1000 * 60 * 60)) % 24;
      var days = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24));
      var months = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24 * 30)) % 12;
      var years = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24 * 30 * 12));

      function addS(value, unit) {
        return value !== 1 ? unit + "s" : unit;
      }

      // 輸出語意化時間
      if (years > 0) {
        return years + ` ${addS(years, "year")} `;
      } else if (months > 0) {
        return months + ` ${addS(months, "month")} `;
      } else if (days > 0) {
        return days + ` ${addS(days, "day")} `;
      } else if (hours > 0) {
        return hours + ` ${addS(hours, "hour")} `;
      } else if (minutes > 0) {
        return minutes + ` ${addS(minutes, "minute")} `;
      } else if (seconds > 0) {
        return seconds + ` ${addS(seconds, "second")} `;
      }
    }
  },
  mounted() {
    this.getFilesInFolder();
    this.searchResults = this.files;
    this.checkDevice();
  },
}
</script>

<style>
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

.pagination {
  padding: 0;
  justify-content: center;
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

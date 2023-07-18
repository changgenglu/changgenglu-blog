<template>
  <div class="container">
    <div class="row" style="width: 100%">
      <div v-for="(item, index) in files.slice(pageStart, pageEnd)" :key="index" class="col-6">
        <router-link :to="`/markdown/${item.name}`">
          <div class="card mb-3">
            <div class="card-header  d-flex justify-content-between">
              <span class="h5">
                {{ item.name }}
              </span>
              <span>
                {{ countDate(item.date) }} ago
              </span>
            </div>
            <div class="card-body text-center">
              <div v-for="title, index in item.matchingLines" :key="index">
                {{ title }}
              </div>
            </div>
          </div>
        </router-link>
      </div>
      <!-- pagination -->
      <ul class="pagination">
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
  </div>
</template>

<script>
import AllMyArticle from '../assets/fileNames.json';

export default {
  name: 'HomeView',
  data() {
    return {
      files: [],
      dataInPage: 6,
      currentPage: 1
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.files.length / this.dataInPage)
      //Math.ceil()取最小整數
    },
    pageStart() {
      return (this.currentPage - 1) * this.dataInPage
    },
    pageEnd() {
      return this.currentPage * this.dataInPage
      //取得該頁最後一個值的index
    }
  },
  methods: {
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

      // 指定時間的字串
      var specifiedTime = fileDate;

      // 將指定時間轉換為日期物件
      var specifiedDate = new Date(specifiedTime);

      // 計算本地時間與指定時間的差距（以毫秒為單位）
      var differenceMilliseconds = now.getTime() - specifiedDate.getTime();

      // 將差距時間轉換為語意化時間
      var seconds = Math.floor(differenceMilliseconds / 1000) % 60;
      var minutes = Math.floor(differenceMilliseconds / (1000 * 60)) % 60;
      var hours = Math.floor(differenceMilliseconds / (1000 * 60 * 60)) % 24;
      var days = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24));
      var months = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24 * 30)) % 12;
      var years = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24 * 30 * 12));

      function addS(date) {
        if (date > 1) {
          return "s ";
        } else {
          return "";
        }
      }

      // 輸出語意化時間
      if (years > 0) {
        return years + ` year${addS(years)} `;
      } else if (months > 0) {
        return months + ` month${addS(months)} `;
      } else if (days > 0) {
        return days + ` day${addS(days)} `;
      } else if (hours > 0) {
        return hours + ` day${addS(hours)} `;
      } else if (minutes > 0) {
        return minutes + ` minute${addS(minutes)} `;
      } else if (seconds > 0) {
        return seconds + ` second${addS(seconds)}`;
      }
    }

  },
  mounted() {
    this.getFilesInFolder();
  },
}
</script>

<style>
a {
  text-decoration: none;
}

.pagination {
  padding: 0;
  justify-content: center;
}
</style>

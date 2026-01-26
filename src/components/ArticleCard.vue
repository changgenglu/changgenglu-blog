<template>
  <router-link :to="`/${item.name}`">
    <div class="card mb-3 bg-transparent" :class="{ 'border-light': isMobile }">
      <div class="card-header d-flex"
        :class="{ 'justify-content-between': isMobile, 'justify-content-around': !isMobile }">
        <span style="width: 65px;" v-show="!isMobile"></span>
        <p class="h6 pt-1">{{ item.name.replace('.md', '') }}</p>
        <span class="fs-6 fst-italic fw-lighter">{{ formattedDate }} ago</span>
      </div>
      <div class="card-body text-center" v-show="!isMobile">
        <div v-for="(title, index) in item.matchingLines" :key="index">
          <span>{{ title }}</span>
        </div>
      </div>
      <div class="card-footer text-muted text-center" style="background-color: #282827; border-top: 0;" v-if="showCategory">
          <small>{{ item.category }}</small>
      </div>
    </div>
  </router-link>
</template>

<script>
export default {
  name: 'ArticleCard',
  props: {
    item: {
      type: Object,
      required: true
    },
    isMobile: {
      type: Boolean,
      default: false
    },
    showCategory: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    formattedDate() {
      return this.countDate(this.item.date);
    }
  },
  methods: {
    countDate(fileDate) {
      var now = new Date();
      var specifiedDate = new Date(fileDate);
      var differenceMilliseconds = now.getTime() - specifiedDate.getTime();
      var seconds = Math.floor(differenceMilliseconds / 1000) % 60;
      var minutes = Math.floor(differenceMilliseconds / (1000 * 60)) % 60;
      var hours = Math.floor(differenceMilliseconds / (1000 * 60 * 60)) % 24;
      var days = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24));
      var months = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24 * 30)) % 12;
      var years = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24 * 30 * 12));

      function addS(value, unit) {
        return value !== 1 ? unit + "s" : unit;
      }
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
      return 'just now';
    }
  }
}
</script>

<style scoped>
/* Scoped styles for the card */
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

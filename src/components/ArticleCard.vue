<template>
  <router-link :to="`/${item.name}`" class="article-card-link">
    <div class="card mb-4 article-card card-glass" :class="{ 'mobile-card': isMobile }">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <h5 class="card-title text-light mb-0">{{ item.name.replace('.md', '') }}</h5>
          <span class="date-tag">{{ formattedDate }} ago</span>
        </div>
        
        <div class="article-metadata mb-3" v-show="!isMobile">
          <div v-for="(title, index) in item.matchingLines" :key="index" class="metadata-line">
            <span class="bullet"></span>
            <span class="title-text">{{ title }}</span>
          </div>
        </div>

        <div class="card-footer-info d-flex justify-content-between align-items-center mt-auto" v-if="showCategory">
          <span class="category-badge">{{ item.category }}</span>
          <span class="read-more">Read More →</span>
        </div>
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
.article-card-link {
  text-decoration: none;
}

.article-card {
  min-height: 200px;
  border-radius: 16px !important;
  border: 1px solid var(--glass-border);
  background: var(--bg-surface);
  backdrop-filter: var(--glass-blur);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
}

.article-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-cyan);
  box-shadow: 0 10px 30px -10px rgba(0, 242, 255, 0.3);
}

.card-title {
  font-weight: 700;
  letter-spacing: -0.02em;
}

.date-tag {
  font-size: 0.8rem;
  color: #888;
  font-family: var(--font-mono);
}

.article-metadata {
  flex-grow: 1;
}

.metadata-line {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.bullet {
  width: 6px;
  height: 6px;
  background-color: var(--accent-purple);
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0 0 8px var(--accent-purple);
}

.title-text {
  font-size: 0.9rem;
  color: #bbb;
}

.category-badge {
  background: rgba(0, 242, 255, 0.1);
  color: var(--accent-cyan);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  border: 1px solid rgba(0, 242, 255, 0.2);
  font-family: var(--font-mono);
}

.read-more {
  font-size: 0.85rem;
  color: var(--accent-cyan);
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s;
}

.article-card:hover .read-more {
  opacity: 1;
}

.mobile-card {
  min-height: auto;
}
</style>
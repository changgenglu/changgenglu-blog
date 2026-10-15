<template>
  <div class="article-card-wrapper">
    <router-link
      v-if="item.path"
      :to="{ name: 'Markdown', params: { title: item.path } }"
      class="article-card-link"
    >
      <div class="article-card surface" :class="{ 'mobile-card': isMobile }">
        <div class="card-body">
          <div class="card-head">
            <h5 class="card-title" v-html="displayTitle"></h5>
            <span class="date-tag">{{ formattedDate }} ago</span>
          </div>

          <div class="article-metadata" v-show="!isMobile">
            <div v-if="displaySnippet" class="metadata-line">
              <span class="bullet"></span>
              <span class="title-text" v-html="displaySnippet"></span>
            </div>
            <div v-else-if="item.matchingLines && item.matchingLines.length > 0" v-for="(title, index) in item.matchingLines" :key="index" class="metadata-line">
              <span class="bullet"></span>
              <span class="title-text">{{ title }}</span>
            </div>
            <div v-else class="metadata-line">
              <span class="bullet"></span>
              <span class="title-text">文章內容...</span>
            </div>
          </div>

          <div class="card-footer-info" v-if="showCategory">
            <span class="category-badge">{{ item.category }}</span>
            <span class="read-more">Read More →</span>
          </div>
        </div>
      </div>
    </router-link>
    <div v-else class="article-card surface cursor-default" :class="{ 'mobile-card': isMobile }">
      <div class="card-body">
        <div class="card-head">
          <h5 class="card-title" v-html="displayTitle"></h5>
          <span class="date-tag">{{ formattedDate }} ago</span>
        </div>
        <!-- ... same metadata block ... -->
        <div class="article-metadata" v-show="!isMobile">
          <div v-if="displaySnippet" class="metadata-line">
            <span class="bullet"></span>
            <span class="title-text" v-html="displaySnippet"></span>
          </div>
          <div v-else-if="item.matchingLines && item.matchingLines.length > 0" v-for="(title, index) in item.matchingLines" :key="index" class="metadata-line">
            <span class="bullet"></span>
            <span class="title-text">{{ title }}</span>
          </div>
          <div v-else class="metadata-line">
            <span class="bullet"></span>
            <span class="title-text">文章內容...</span>
          </div>
        </div>

        <div class="card-footer-info" v-if="showCategory">
          <span class="category-badge">{{ item.category }}</span>
          <span class="read-more">Read More →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { highlightMatch } from '@/utils/textFormatter'; // New import

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
    },
    displayTitle() {
      const title = this.item.name ? this.item.name.replace('.md', '') : '';
      return this.item.query ? highlightMatch(title, this.item.query) : title;
    },
    displaySnippet() {
        if (!this.item.query) return '';

        let snippetText = '';
        // 優先顯示從內容中提取並高亮過的片段（如果 HomeView 傳遞過來）
        if (this.item.highlightedSnippet) {
            snippetText = this.item.highlightedSnippet;
        } 
        // 否則，如果在 H2 標題中找到匹配，則高亮該 H2
        else if (this.item.matchingLines && this.item.matchingLines.length > 0) {
            const lowerQuery = this.item.query.toLowerCase();
            const matchedLine = this.item.matchingLines.find(line => line.toLowerCase().includes(lowerQuery));
            if (matchedLine) {
                snippetText = highlightMatch(matchedLine, this.item.query);
            }
        }
        return snippetText;
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
.article-card-wrapper {
  height: 100%;
}

.article-card-link {
  text-decoration: none;
  display: block;
  height: 100%;
  border-radius: var(--radius-md);
}

.article-card {
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  transition: border-color 0.2s ease;
}

.article-card:hover {
  border-color: var(--primary);
}

.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--ink);
}

.date-tag {
  flex: 0 0 auto;
  font-size: 0.75rem;
  color: var(--text);
  font-family: var(--font-mono);
  text-transform: uppercase;
  white-space: nowrap;
}

.article-metadata {
  flex-grow: 1;
  margin-bottom: 12px;
}

.metadata-line {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.bullet {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  background-color: var(--accent);
  border-radius: 50%;
  margin-right: 10px;
}

.title-text {
  font-size: 0.9rem;
  color: var(--text);
}

.card-footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.category-badge {
  color: var(--ink);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.category-badge::before {
  content: '[ ';
}

.category-badge::after {
  content: ' ]';
}

.read-more {
  font-size: 0.85rem;
  color: var(--primary);
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s;
}

.article-card:hover .read-more,
.article-card-link:focus-visible .read-more {
  opacity: 1;
}

.mobile-card {
  min-height: auto;
}

.cursor-pointer {
  cursor: pointer;
}

.article-card :deep(.search-highlight) {
  background-color: var(--highlight-bg);
  color: var(--highlight-ink);
  padding: 2px 4px;
  border-radius: 4px;
}
</style>

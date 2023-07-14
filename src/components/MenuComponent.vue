<template>
    <div v-for="(item, index) in files" :key="index" v-show="index > 3" style="text-align:center;">
        <router-link :to="`/markdown/${item.name}`">
            <span>{{ item.name }}</span>
            <span> - </span>
            <!-- {{ typeof item.date }} -->
            <span>{{ countDate(item.date) }} ago</span>
        </router-link>
        <hr>
    </div>
</template>

<script>
import AllMyArticle from '../assets/fileNames.json'

export default {
    data() {
        return {
            files: [],
        }
    },
    methods: {
        getFilesInFolder: function () {
            this.files = AllMyArticle.map(item => (
                {
                    date: item.date,
                    name: item.name
                }
            ))
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

<style></style>
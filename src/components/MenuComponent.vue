<template>
    <div v-for="(item, index) in files" :key="index" v-show="index > 3" style="text-align:center;">
        <router-link :to="`/markdown/${item.name}`">
            <span>{{ item.name }}</span>
            <!-- <span> - </span>
            <span>{{ item.date }}</span> -->
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
                    date: "aaa",
                    name: item.name
                }
            ))
        }
    },
    mounted() {
        this.getFilesInFolder();
    },
}
</script>

<style></style>
<template>
    <div class="container mt-5 d-flex">
        <Markdown class="sticky-sm-top col-3" id="menu" :source="markdownMenu" v-show="markdownMenu !== ''" />
        <div :class="{ 'col-9 position-sticky-end ms-3': markdownMenu }">
            <Markdown :source="markdownContent" />
        </div>
    </div>
    <div style="text-align:center" class="m-5">
        <router-link to="/" class="btn btn-lg btn-outline-success">
            back 2 menu
        </router-link>
    </div>
</template>

<script>
import Markdown from 'vue3-markdown-it';
import AllMyArticle from '../assets/fileNames.json'

export default {
    components: { Markdown },
    name: 'MarkdownComponent',
    data() {
        return {
            markdownContent: '',
            markdownMenu: '',
            fileName: this.$route.params.title
        }
    },
    methods: {
        loadMarkdown: function () {
            AllMyArticle.map(item => {
                if (item.name === this.fileName) {
                    this.markdownMenu = item.tocContent
                    this.markdownContent = item.content
                }
            })
        }
    },
    mounted() {
        this.loadMarkdown();
    },
}
</script>

<style>
#menu {
    height: 100%;
    top: 3vh;
    overflow-y: auto;
}
</style>
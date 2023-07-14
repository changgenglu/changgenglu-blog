<template>
    <div class="container">
        <Markdown :source="markdownContent" />
        <div style="text-align:center" class="m-5">
            <router-link to="/" class="btn btn-lg btn-outline-success">
                back 2 menu
            </router-link>
        </div>
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
            fileName: this.$route.params.title
        }
    },
    methods: {
        loadMarkdown: function () {
            AllMyArticle.map(item => {
                if (item.name === this.fileName) {
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
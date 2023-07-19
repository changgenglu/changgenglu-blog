<template>
    <div class="container mt-5 mb-5 d-flex">
        <Markdown class="sticky-sm-top col-3" id="menu" :source="markdownMenu" v-show="markdownMenu !== ''" />
        <div :class="{ 'col-9 position-sticky-end ms-3': markdownMenu }">
            <Markdown :source="markdownContent" />
        </div>
    </div>
    <div id="to-footer-btn">
        <!-- <button class="btn btn-outline-success" @click="scrollToFooter()">go 2 top</button> -->
        <router-link :to="`/`" class="btn btn-outline-success">
            back 2 menu
        </router-link>
    </div>
    <!-- <div style="text-align:center" class="m-5">
        <router-link to="/" class="btn btn-lg btn-outline-success">
            back 2 menu
        </router-link>
    </div> -->
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
            fileName: this.$route.params.title,
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
        },
        scrollToFooter() {
            window.scrollTo(0, 0);
        }
    },
    mounted() {
        this.loadMarkdown();
    },
}
</script>

<style>
#menu {
    height: 70vh;
    top: 3vh;
    overflow-y: auto;
}

#menu a {
    color: #1b2631;
}

/* //捲軸底色 */
#menu::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    background-color: #1b2631;
}

/* //捲軸寬度 */
#menu::-webkit-scrollbar {
    width: 6px;
    background-color: #F5F5F5;
}

/* //捲軸本體顏色 */
#menu::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background-color: #6a99c9;
}

#to-footer-btn {
    display: none;
    position: fixed;
    right: 3%;
    top: 88%;
    width: 8em;
}
</style>
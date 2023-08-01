<template>
    <div class="container mt-3 mb-5">
        <div id="toggle-menu-btn" class="col-12 mb-3" v-show="isMobile && markdownMenu !== ''">
            <button class="btn btn-outline-dark w-100" @click="toggleMenu">
                <i class="fa-solid fa-bars"></i>
            </button>
        </div>
        <div :class="{ 'd-flex': !isMobile }">
            <div v-show="showMenu" :class="{ 'col-3': !isMobile, 'col-12': isMobile }">
                <Markdown class="sticky-sm-top" id="menu" :source="markdownMenu" v-show="showMenu" />
            </div>
            <div class='markdown-content position-sticky-end' :class="{ 'ms-3 col-9': !isMobile }">
                <Markdown :source="markdownContent" />
            </div>
        </div>
    </div>
    <div id="to-footer-btn" v-show="isMobile">
        <button class="btn btn-outline-success" @click="scrollToFooter()">
            <i class="fa-solid fa-chevron-up"></i>
        </button>
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
            fileName: this.$route.params.title,
            showMenu: true,
            isMobile: false
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
        },
        toggleMenu() {
            if (this.markdownMenu === '') {
                this.showMenu = false;
            } else {
                this.showMenu = !this.showMenu;
            }
        },
        checkDevice() {
            if (window.innerWidth < 768) {
                this.isMobile = true;
                this.showMenu = false
            } else {
                this.isMobile = false;
            }
        },
    },
    mounted() {
        this.loadMarkdown();
        this.checkDevice();
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
    color: #888888;
}

.markdown-content {
    color: #888888;
}

h1,
h2,
h3,
h4,
h5,
h6 {
    font-family: Gambarino, serif;
    color: #dddddd;
    font-weight: bolder;
}

#toggle-menu-btn {
    width: 70%;
    margin: auto
}

/* //捲軸底色 */
#menu::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    background-color: #c7c7c7;
}

/* //捲軸寬度 */
#menu::-webkit-scrollbar {
    width: 6px;
}

/* //捲軸本體顏色 */
#menu::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background-color: #383838;
}

#to-footer-btn {
    position: fixed;
    right: 0%;
    top: 88%;
    width: 3.5em;
}
</style>
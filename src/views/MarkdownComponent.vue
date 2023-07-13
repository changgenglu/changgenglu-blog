<template>
    <div class="container">
        <Markdown :source="markdownContent" />
        <div style="text-align:center" class="m-5">
            <router-link to="/" class="btn btn-lg btn-outline-success">back 2 menu</router-link>
        </div>
    </div>
</template>

<script>
import Markdown from 'vue3-markdown-it';

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
            console.log(1)
            new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `/static/markdowns/${this.fileName}`, true);
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            console.log(2)
                            this.markdownContent = xhr.responseText;
                        } else {
                            reject(xhr.statusText);
                        }
                    }
                };
                xhr.send();
            });
        }
    },
    mounted() {
        this.loadMarkdown();
    },
}
</script>
<template>
    <div v-for="(item, index) in files" :key="index" v-show="index > 3" style="text-align:center;">
        <router-link :to="`/markdown/${item.name}`">
            <span>{{ item.name }}</span>
            <span> - </span>
            <span>{{ item.date }}</span>
        </router-link>
        <hr>
    </div>
</template>

<script>
export default {
    data() {
        return {
            files: [],
        }
    },
    methods: {
        getFilesInFolder: function () {
            const srcFolderPath = './static/markdowns';
            fetch(srcFolderPath)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    this.files = Array.from(doc.querySelectorAll('a')).map((link, index) => {
                        if (index > 3) {
                            const fileName = link.querySelector('.name').outerText;
                            const fileDate = link.querySelector('.date').outerText;

                            return {
                                date: fileDate.split(' ')[0],
                                name: fileName,
                            };
                        } else {
                            return {}; // 或者 return null;
                        }
                    });
                });
        }
    },
    mounted() {
        this.getFilesInFolder();
    },
}
</script>

<style>

</style>
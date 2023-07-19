<template>
    <div class="logoBag">
        <router-link to="/">
            <img alt="my logo" src="../assets/profile.jpg" class="myLogo">
            <h1>
                Changgenglu
            </h1>
        </router-link>
    </div>
</template>

<style>
.myLogo {
    border-radius: 9999px;
    height: 180px;
    width: 180px;
}

.logoBag {
    text-align: center;
    margin-top: 5vh;
}

.logoBag>a {
    color: #2c3e50;
}
</style>
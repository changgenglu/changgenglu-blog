<template>
    <div class="logoBag">
        <div class="w-25 m-auto">
            <router-link to="/">
                <img alt="my logo" src="../assets/profile.jpg" class="myLogo">
                <div class="fs-1">
                    Changgenglu
                </div>
            </router-link>
        </div>
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
    padding-top: 5vh;
    padding-bottom: 2vh;
    background-color: rgb(14, 20, 20);
}

.logoBag a {
    color: #dddddd;
    font-family: Gambarino, serif;
    font-weight: bold;
}
</style>
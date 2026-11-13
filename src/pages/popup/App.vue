<template>
  <div class="ex-box">
    <Nav></Nav>
    <div>
      <router-view></router-view>
    </div>
    <Footer></Footer>
  </div>
</template>

<script setup>
import Nav from './components/nav'
import Footer from './components/footer'
</script>

<style lang="scss">
.ex-box {
  width: 400px;
}
.padbox {
  padding: 12px;
}

.bottom-line {
  border-bottom: 1px solid #edeff1
}

.top-line {
  border-top: 1px solid #edeff1
}

</style>
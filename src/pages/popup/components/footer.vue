<template>
    <div style="margin: 10px 0;">
        <footer class="footer has-background-white">
            <div class="content has-text-centered is-small">
                &copy;{{ new Date().getFullYear() }} <a class="has-text-black" href="https://extensionhealthcheck.extensionsbox.com" target="_blank">ExtensionsBox</a>
                <br>
                <small>v{{ version }}
                    <sup v-if="!mode" class="has-text-primary has-text-weight-bold">DEV-{{ platform }}</sup>
                </small>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ext from '../../../common/ext'

const version = ref(undefined)
const mode = ref(undefined)
const platform = ref(undefined)

onMounted(() => {
    mode.value = ext.APP.ENV
    version.value = chrome.runtime.getManifest().version
    platform.value = ext.APP.BROSWER
})
</script>

<style lang="scss" scoped>
footer {
    padding: 0 !important;
}
</style>

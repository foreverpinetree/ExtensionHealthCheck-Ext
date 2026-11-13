<template>
    <div class="padbox bottom-line">
        <section class="has-text-right">
            <span class="is-pulled-left has-text-weight-bold">
                <i class="fas fa-heartbeat"></i>&nbsp; {{ ext.APP.DISPLAY_NAME }}
            </span>
            <router-link to="/" class="button is-small is-white" aria-label="监控首页">
                <span class="icon"><i class="fas fa-home"></i></span>
            </router-link>
            <router-link to="/faq" class="button is-small is-white" aria-label="帮助">
                <span class="icon"><i class="fas fa-question-circle"></i></span>
            </router-link>
        </section>
    </div>
</template>

<script setup>
import ext from '../../../common/ext'
</script>

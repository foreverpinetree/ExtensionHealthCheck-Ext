<template>
    <div style="padding: 6px;">
        <div style="margin-top: 30px;" class="content">
            <p class="has-text-centered has-text-success" style="font-size: 3rem">
                <i class="fas fa-charging-station"></i>
            </p>
            <label style="margin: 1em 0;" class="label is-small has-text-centered">
                <i class="fas fa-lightbulb has-text-danger"></i>&nbsp;
                Please log in to Facebook and try again.
                <br>
                <br>
                <a href="https://www.facebook.com" target="_blank" class="has-text-weight-bold">www.facebook.com</a>
            </label>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    index: Number,
});
</script>

<style lang="scss" scoped>
</style>

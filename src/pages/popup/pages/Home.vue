<template>
    <div class="health-home">
        <section class="summary" :class="state">
            <div class="summary-icon">{{ state === 'healthy' ? '✓' : state === 'error' ? '!' : '?' }}</div>
            <div>
                <h1>{{ title }}</h1>
                <p>{{ description }}</p>
            </div>
        </section>
        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
        <div class="counts">
            <div><strong>{{ data ? data.total : '—' }}</strong><span>全部服务</span></div>
            <div><strong>{{ data ? data.healthyCount : '—' }}</strong><span>正常</span></div>
            <div><strong>{{ data ? data.errorCount : '—' }}</strong><span>异常</span></div>
        </div>
        <dl class="times">
            <div><dt>插件最近刷新</dt><dd>{{ formatTime(status?.checkedAt) }}</dd></div>
            <div><dt>服务器上次巡检</dt><dd>{{ formatTime(data?.lastCompletedAt) }}</dd></div>
            <div><dt>服务器下次巡检</dt><dd>{{ formatTime(data?.nextCheckAt) }}</dd></div>
        </dl>
        <p v-if="data?.checking" class="checking">服务器正在巡检，结果会逐项更新。</p>
        <div class="actions">
            <button type="button" class="primary" @click="openDetails">查看详情 ↗</button>
            <button type="button" :disabled="busy" @click="refresh">{{ busy ? '刷新中…' : '刷新' }}</button>
        </div>
        <details class="settings">
            <summary>监控设置 · 每 {{ savedSettings.intervalMinutes }} 分钟刷新</summary>
            <form @submit.prevent="saveSettings">
                <label>服务器地址<input v-model.trim="settings.serverUrl" type="url" required placeholder="https://example.com"></label>
                <label>刷新间隔（分钟）<input v-model.number="settings.intervalMinutes" type="number" min="1" step="1" required></label>
                <button type="submit" :disabled="busy">保存并刷新</button>
                <p v-if="savedNotice" class="saved-notice" role="status">{{ savedNotice }}</p>
            </form>
        </details>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { DEFAULT_HEALTH_SETTINGS, HEALTH_MESSAGES, HEALTH_STATUS_KEY } from '../../../common/health'

const settings = ref({ ...DEFAULT_HEALTH_SETTINGS })
const savedSettings = ref({ ...DEFAULT_HEALTH_SETTINGS })
const status = ref(null)
const busy = ref(false)
const error = ref('')
const savedNotice = ref('')
const data = computed(() => status.value?.data)
const state = computed(() => error.value ? 'unknown' : status.value?.state || 'unknown')
const title = computed(() => state.value === 'healthy' ? '所有服务运行正常' : state.value === 'error' ? `${data.value.errorCount} 个服务访问异常` : '监控状态待确认')
const description = computed(() => state.value === 'unknown'
    ? status.value?.error || '正在获取服务器状态；历史数据不代表当前可用性。'
    : state.value === 'error' ? '连续两次检测失败，点击详情查看原因。' : '最近一次完整巡检未发现异常。')
const formatTime = value => value ? new Date(value).toLocaleString('zh-CN') : '—'

function send(event, payload) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ event, data: payload }, response => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
            if (!response?.ok) return reject(new Error(response?.error || '后台没有返回监控状态。'))
            resolve(response)
        })
    })
}

async function request(event, payload) {
    busy.value = true
    error.value = ''
    try {
        const response = await send(event, payload)
        status.value = response.status
        savedSettings.value = response.settings
        settings.value = { ...response.settings }
        return true
    } catch (err) {
        error.value = err.message
        return false
    } finally {
        busy.value = false
    }
}

function refresh() {
    savedNotice.value = ''
    return request(HEALTH_MESSAGES.CHECK)
}

async function saveSettings() {
    savedNotice.value = ''
    if (await request(HEALTH_MESSAGES.SAVE, { ...settings.value })) savedNotice.value = '设置已保存。'
}

async function openDetails() {
    try {
        await chrome.tabs.create({ url: savedSettings.value.serverUrl + '/' })
    } catch (err) {
        error.value = err.message
    }
}

function onStorageChanged(changes, area) {
    if (area === 'local' && changes[HEALTH_STATUS_KEY]) status.value = changes[HEALTH_STATUS_KEY].newValue
}

onMounted(async () => {
    chrome.storage.onChanged.addListener(onStorageChanged)
    await request(HEALTH_MESSAGES.GET)
})
onUnmounted(() => chrome.storage.onChanged.removeListener(onStorageChanged))
</script>

<style lang="scss" scoped>
.health-home { padding: 18px; color: #23364e; font-size: 12px; }
.summary { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 10px; background: #fff7e7; color: #946815; }
.summary.healthy { background: #ecf8f2; color: #147c58; }
.summary.error { background: #fff0f2; color: #be4052; }
.summary-icon { font-size: 24px; font-weight: 700; width: 30px; text-align: center; flex-shrink: 0; }
h1 { margin: 0 0 5px; font-size: 16px; font-weight: 650; }
.summary p { margin: 0; font-size: 11px; line-height: 1.6; overflow-wrap: anywhere; }
.counts { display: grid; grid-template-columns: repeat(3, 1fr); margin: 18px 0; padding-bottom: 18px; border-bottom: 1px solid #e8edf3; text-align: center; }
.counts div { display: flex; flex-direction: column; gap: 4px; }
.counts strong { font-size: 25px; }
.counts span, dt { color: #8693a4; font-weight: 400; }
.times div { display: flex; justify-content: space-between; gap: 12px; margin: 10px 0; font-size: 11px; }
dd { margin: 0; text-align: right; }
.actions { display: flex; gap: 8px; margin: 18px 0; }
button { cursor: pointer; border: 1px solid #dce4ee; border-radius: 7px; background: white; padding: 9px 13px; font: inherit; color: #4a607a; }
button.primary { flex: 1; background: #173a53; color: white; border-color: #173a53; }
button:disabled { opacity: .6; cursor: wait; }
.settings { border-top: 1px solid #e8edf3; padding-top: 14px; color: #6b7c92; }
summary { cursor: pointer; }
label { display: block; margin-top: 12px; font-size: 11px; }
input { display: block; width: 100%; margin-top: 5px; padding: 8px; border: 1px solid #dce4ee; border-radius: 6px; font: inherit; box-sizing: border-box; }
form button { margin-top: 12px; }
.error-message { color: #bf4255; overflow-wrap: anywhere; margin-top: 10px; }
.checking { color: #8d721f; }
.saved-notice { color: #147c58; margin-top: 8px; }
</style>

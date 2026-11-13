import {
    DEFAULT_HEALTH_SETTINGS, HEALTH_ALARM, HEALTH_MESSAGES,
    HEALTH_SETTINGS_KEY, HEALTH_STATUS_KEY, normalizeHealthSettings, validateHealthStatus,
} from '../common/health'

let activeCheck = null
let initialization = null

async function getSettings() {
    const saved = await chrome.storage.local.get(HEALTH_SETTINGS_KEY)
    return normalizeHealthSettings(saved[HEALTH_SETTINGS_KEY] || DEFAULT_HEALTH_SETTINGS)
}

async function showStatus(status) {
    const state = status?.state || 'unknown'
    const icon = state === 'healthy' ? 'ok' : state === 'error' ? 'error' : 'unknown'
    const count = status?.data?.errorCount || 0
    const title = state === 'healthy'
        ? `所有 ${status.data.total} 个服务运行正常`
        : state === 'error' ? `${count} 个服务访问异常`
            : `监控状态待确认${count ? `，上次发现 ${count} 个异常` : ''}：${status?.error || '等待检测完成'}`
    await Promise.all([
        chrome.action.setIcon({ path: { 19: `icons/health-${icon}-19.png`, 38: `icons/health-${icon}-38.png` } }),
        chrome.action.setBadgeText({ text: state === 'error' ? (count > 99 ? '99+' : String(count)) : state === 'unknown' ? '?' : '' }),
        chrome.action.setBadgeBackgroundColor({ color: state === 'error' ? '#dc475a' : state === 'unknown' ? '#c28a24' : '#14966c' }),
        chrome.action.setTitle({ title: 'Extension Health Check · ' + title }),
    ])
}

async function ensureAlarm(settings) {
    const alarm = await chrome.alarms.get(HEALTH_ALARM)
    if (!alarm || alarm.periodInMinutes !== settings.intervalMinutes) {
        await chrome.alarms.create(HEALTH_ALARM, { periodInMinutes: settings.intervalMinutes })
    }
}

async function performCheck() {
    const previous = await chrome.storage.local.get(HEALTH_STATUS_KEY)
    let status
    try {
        const settings = await getSettings()
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        try {
            const response = await fetch(settings.serverUrl + '/api/status', {
                cache: 'no-store', credentials: 'omit', signal: controller.signal,
            })
            if (!response.ok && response.status !== 503) throw new Error(`HTTP ${response.status}`)
            const data = validateHealthStatus(await response.json())
            const now = new Date().toISOString()
            status = {
                state: data.state, data, checkedAt: now, fetchedAt: now,
                error: data.monitorError || data.configurationError ||
                    (data.stale ? '尚无最新的完整巡检结果。' : data.pendingCount ? '部分服务等待首次检测。' : null),
            }
        } finally {
            clearTimeout(timeout)
        }
    } catch (error) {
        console.error('[health] Status request failed:', error)
        status = {
            ...(previous[HEALTH_STATUS_KEY] || {}),
            state: 'unknown', checkedAt: new Date().toISOString(),
            error: error.name === 'AbortError' ? '连接监控服务器超时。' : error.message,
        }
    }
    await chrome.storage.local.set({ [HEALTH_STATUS_KEY]: status })
    await showStatus(status)
    return status
}

export function checkHealth() {
    if (!activeCheck) activeCheck = performCheck().finally(() => { activeCheck = null })
    return activeCheck
}

async function initialize() {
    const settings = await getSettings()
    await ensureAlarm(settings)
    const saved = await chrome.storage.local.get(HEALTH_STATUS_KEY)
    const status = saved[HEALTH_STATUS_KEY]
    const age = status?.checkedAt ? Date.now() - Date.parse(status.checkedAt) : Infinity
    if (!Number.isFinite(age) || age >= settings.intervalMinutes * 60000) {
        await checkHealth()
    } else {
        await showStatus(status)
    }
}

function initializeOnce() {
    if (!initialization) initialization = initialize()
    return initialization
}

function reportError(error) {
    console.error('[health] Background error:', error)
    showStatus({ state: 'unknown', error: error.message }).catch(iconError => console.error('[health] Icon update failed:', iconError))
}

export function startHealthMonitoring() {
    chrome.alarms.onAlarm.addListener(alarm => {
        if (alarm.name === HEALTH_ALARM) checkHealth().catch(reportError)
    })
    chrome.runtime.onInstalled.addListener(() => initializeOnce().then(checkHealth).catch(reportError))
    chrome.runtime.onStartup.addListener(() => initializeOnce().then(checkHealth).catch(reportError))
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!Object.values(HEALTH_MESSAGES).includes(message?.event)) return
        if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(''))) return
        ;(async () => {
            if (message.event === HEALTH_MESSAGES.GET) await initializeOnce()
            if (message.event === HEALTH_MESSAGES.SAVE) {
                const settings = normalizeHealthSettings(message.data)
                if (activeCheck) await activeCheck
                await chrome.storage.local.set({ [HEALTH_SETTINGS_KEY]: settings })
                await ensureAlarm(settings)
                await checkHealth()
            } else if (message.event === HEALTH_MESSAGES.CHECK) {
                await checkHealth()
            }
            const settings = await getSettings()
            const saved = await chrome.storage.local.get(HEALTH_STATUS_KEY)
            sendResponse({ ok: true, settings, status: saved[HEALTH_STATUS_KEY] || null })
        })().catch(error => {
            console.error('[health] Message failed:', error)
            sendResponse({ ok: false, error: error.message })
        })
        return true
    })
    return initializeOnce().catch(reportError)
}

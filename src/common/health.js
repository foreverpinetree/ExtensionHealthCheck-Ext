import ext from './ext'

export const HEALTH_SETTINGS_KEY = 'healthSettings'
export const HEALTH_STATUS_KEY = 'healthStatus'
export const HEALTH_ALARM = 'extension-health-check'
export const HEALTH_MESSAGES = {
    GET: 'health:get',
    CHECK: 'health:check',
    SAVE: 'health:save-settings',
}
export const DEFAULT_HEALTH_SETTINGS = {
    serverUrl: ext.HOST,
    intervalMinutes: 10,
}

export function normalizeHealthSettings(settings = DEFAULT_HEALTH_SETTINGS) {
    const url = new URL(settings.serverUrl)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
        throw new Error('服务器地址必须是 HTTP(S) 地址，且不包含账号、查询参数或锚点。')
    }
    const intervalMinutes = Number(settings.intervalMinutes)
    if (!Number.isFinite(intervalMinutes) || intervalMinutes < 1) {
        throw new Error('检查间隔必须是大于或等于 1 的分钟数。')
    }
    return { serverUrl: url.href.replace(/\/+$/, ''), intervalMinutes }
}

export function validateHealthStatus(data) {
    const counts = ['total', 'errorCount', 'healthyCount', 'pendingCount']
    if (!data || !counts.every(key => Number.isInteger(data[key]) && data[key] >= 0) ||
        data.total !== data.errorCount + data.healthyCount + data.pendingCount ||
        typeof data.stale !== 'boolean' || typeof data.checking !== 'boolean' ||
        data.hasErrors !== (data.errorCount > 0) ||
        !['monitorError', 'configurationError'].every(key => data[key] === null || typeof data[key] === 'string') ||
        (data.lastCompletedAt !== null && !Number.isFinite(Date.parse(data.lastCompletedAt)))) {
        throw new Error('服务器返回了无效的监控数据。')
    }
    const unknown = data.monitorError || data.configurationError || data.stale ||
        data.pendingCount || !data.lastCompletedAt
    return { ...data, state: unknown ? 'unknown' : data.errorCount ? 'error' : 'healthy' }
}

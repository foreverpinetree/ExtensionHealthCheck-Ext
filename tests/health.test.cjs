const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const babel = require('@babel/core');

function loadModule(relativePath, dependencies, globals = {}, source) {
    const file = path.join(__dirname, '..', relativePath);
    const code = babel.transformSync(source === undefined ? fs.readFileSync(file, 'utf8') : source, {
        filename: file, configFile: false, babelrc: false,
        presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' } }]],
    }).code;
    const module = { exports: {} };
    vm.runInNewContext(code, {
        module, exports: module.exports,
        require(name) {
            if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name);
            return dependencies[name];
        },
        URL, Date, Promise, AbortController, setTimeout, clearTimeout, console,
        ...globals,
    }, { filename: file });
    return module.exports;
}

const common = loadModule('src\\common\\health.js', { './ext': { HOST: 'http://localhost:9001' } });
const statusData = (errors = 0, overrides = {}) => ({
    total: 150, errorCount: errors, healthyCount: 150 - errors, pendingCount: 0,
    hasErrors: errors > 0, stale: false, checking: false,
    monitorError: null, configurationError: null,
    lastCompletedAt: new Date().toISOString(),
    ...overrides,
});
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });

function harness(initial = {}) {
    const stored = { ...initial };
    const events = {};
    const action = {};
    const calls = [];
    let alarm = null;
    let fetcher = async () => response(statusData());
    const event = name => ({
        addListener(fn) { events[name] = fn; },
    });
    const chrome = {
        runtime: {
            id: 'extension-id', getURL: value => 'chrome-extension://extension-id/' + value,
            onMessage: event('message'), onStartup: event('startup'), onInstalled: event('installed'),
        },
        alarms: {
            onAlarm: event('alarm'),
            get: async () => alarm,
            create: async (name, data) => { calls.push(['alarm', name]); alarm = data; },
        },
        storage: { local: {
            get: async key => ({ [key]: stored[key] }),
            set: async value => Object.assign(stored, value),
        } },
        action: Object.fromEntries(['setIcon', 'setBadgeText', 'setBadgeBackgroundColor', 'setTitle'].map(name =>
            [name, async value => { action[name] = value; }])),
    };
    const background = loadModule('src\\background\\health.js', { '../common/health': common }, {
        chrome, fetch: async (url, options) => { calls.push(['fetch', url]); return fetcher(url, options); },
    });
    function send(eventName, data) {
        return new Promise(resolve => {
            const keepAlive = events.message({ event: eventName, data }, {
                id: chrome.runtime.id, url: chrome.runtime.getURL('popup.html'),
            }, resolve);
            assert.equal(keepAlive, true);
        });
    }
    return { stored, events, action, calls, background, send, setFetch: fn => { fetcher = fn; } };
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('settings default, normalized URL and configurable interval', () => {
    assert.equal(common.DEFAULT_HEALTH_SETTINGS.intervalMinutes, 10);
    assert.equal(common.normalizeHealthSettings({ serverUrl: 'https://example.com/', intervalMinutes: '3' }).serverUrl, 'https://example.com');
    for (const settings of [
        { serverUrl: 'file:///local', intervalMinutes: 10 },
        { serverUrl: 'https://user:password@example.com', intervalMinutes: 10 },
        { serverUrl: 'https://example.com?token=invalid', intervalMinutes: 10 },
        { serverUrl: 'https://example.com', intervalMinutes: 0 },
        { serverUrl: 'https://example.com', intervalMinutes: NaN },
    ]) assert.throws(() => common.normalizeHealthSettings(settings));
});

test('server summary validation never turns malformed or pending data green', () => {
    assert.equal(common.validateHealthStatus(statusData()).state, 'healthy');
    assert.equal(common.validateHealthStatus(statusData(2)).state, 'error');
    assert.equal(common.validateHealthStatus(statusData(0, { stale: true })).state, 'unknown');
    assert.equal(common.validateHealthStatus(statusData(0, { healthyCount: 149, pendingCount: 1 })).state, 'unknown');
    assert.equal(common.validateHealthStatus(statusData(0, { configurationError: 'Invalid JSON' })).state, 'unknown');
    for (const data of [{}, statusData(-1), statusData(0, { total: 2 }), statusData(0, { lastCompletedAt: 'bad' })]) {
        assert.throws(() => common.validateHealthStatus(data));
    }
});

test('initial check paints green and creates a 10-minute alarm', async () => {
    const h = harness();
    await h.background.startHealthMonitoring();
    assert.equal(h.stored[common.HEALTH_STATUS_KEY].state, 'healthy');
    assert.match(h.action.setIcon.path[19], /health-ok-19.png/);
    assert.equal(h.action.setBadgeText.text, '');
    assert.equal(h.calls.filter(call => call[0] === 'fetch').length, 1);
    const saved = await h.send(common.HEALTH_MESSAGES.GET);
    assert.equal(saved.settings.intervalMinutes, 10);
    assert.equal(saved.ok, true);
});

test('red icon and badge count, including large counts', async () => {
    const h = harness();
    h.setFetch(async () => response(statusData(3)));
    await h.background.startHealthMonitoring();
    assert.equal(h.action.setBadgeText.text, '3');
    assert.match(h.action.setIcon.path[38], /health-error-38.png/);
    h.setFetch(async () => response(statusData(120)));
    await h.background.checkHealth();
    assert.equal(h.action.setBadgeText.text, '99+');
});

test('network failure shows unknown and retains last successful snapshot', async () => {
    const h = harness();
    await h.background.startHealthMonitoring();
    const previous = h.stored[common.HEALTH_STATUS_KEY];
    h.setFetch(async () => { throw new Error('Server offline'); });
    await h.background.checkHealth();
    const status = h.stored[common.HEALTH_STATUS_KEY];
    assert.equal(status.state, 'unknown');
    assert.equal(status.data.total, previous.data.total);
    assert.equal(status.fetchedAt, previous.fetchedAt);
    assert.equal(status.error, 'Server offline');
    assert.equal(h.action.setBadgeText.text, '?');
    assert.match(h.action.setIcon.path[19], /health-unknown/);
});

test('503 with structured monitor error and invalid responses stay unknown', async () => {
    const h = harness();
    h.setFetch(async () => response(statusData(0, { monitorError: 'Cannot write result' }), 503));
    await h.background.startHealthMonitoring();
    assert.equal(h.stored[common.HEALTH_STATUS_KEY].state, 'unknown');
    assert.equal(h.stored[common.HEALTH_STATUS_KEY].error, 'Cannot write result');
    h.setFetch(async () => response({}));
    await h.background.checkHealth();
    assert.equal(h.stored[common.HEALTH_STATUS_KEY].state, 'unknown');
    h.setFetch(async () => response({}, 502));
    await h.background.checkHealth();
    assert.equal(h.stored[common.HEALTH_STATUS_KEY].error, 'HTTP 502');
});

test('save settings changes alarm and server, and rejects invalid settings', async () => {
    const h = harness();
    await h.background.startHealthMonitoring();
    const saved = await h.send(common.HEALTH_MESSAGES.SAVE, { serverUrl: 'https://monitor.example/', intervalMinutes: 5 });
    assert.equal(saved.ok, true);
    assert.equal(saved.settings.intervalMinutes, 5);
    assert.equal(h.calls.filter(call => call[0] === 'fetch').pop()[1], 'https://monitor.example/api/status');
    const bad = await h.send(common.HEALTH_MESSAGES.SAVE, { serverUrl: 'invalid', intervalMinutes: 0 });
    assert.equal(bad.ok, false);
    assert.equal(h.stored[common.HEALTH_SETTINGS_KEY].intervalMinutes, 5);
});

test('in-flight requests are coalesced and unrelated alarm/messages ignored', async () => {
    const h = harness();
    await h.background.startHealthMonitoring();
    let release;
    h.setFetch(() => new Promise(resolve => { release = resolve; }));
    const first = h.background.checkHealth();
    const second = h.background.checkHealth();
    assert.equal(first, second);
    await new Promise(resolve => setImmediate(resolve));
    release(response(statusData()));
    await first;
    const count = h.calls.length;
    h.events.alarm({ name: 'unrelated' });
    assert.equal(h.calls.length, count);
    assert.equal(h.events.message({ event: 'other' }, {}, () => assert.fail()), undefined);
    assert.equal(h.events.message({ event: common.HEALTH_MESSAGES.GET }, { id: 'other', url: 'https://page.example' }, () => assert.fail()), undefined);
});

test('recent persisted status restores icon without polling or resetting alarm on GET', async () => {
    const h = harness({ [common.HEALTH_STATUS_KEY]: {
        state: 'error', checkedAt: new Date().toISOString(), data: statusData(2),
    } });
    await h.background.startHealthMonitoring();
    assert.equal(h.calls.filter(call => call[0] === 'fetch').length, 0);
    assert.equal(h.action.setBadgeText.text, '2');
    await h.send(common.HEALTH_MESSAGES.GET);
    assert.equal(h.calls.filter(call => call[0] === 'alarm').length, 1);
    h.events.alarm({ name: common.HEALTH_ALARM });
    await h.background.checkHealth();
    assert.equal(h.stored[common.HEALTH_STATUS_KEY].state, 'healthy');
});

test('Chrome and Edge manifests grant alarms and point to real icons', () => {
    for (const filename of ['manifest.json', 'manifest-edge.json']) {
        const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', filename)));
        assert.ok(manifest.permissions.includes('alarms'));
        assert.ok(!manifest.permissions.includes('identity'));
        assert.equal(manifest.oauth2, undefined);
        for (const icon of Object.values(manifest.action.default_icon)) {
            assert.ok(fs.existsSync(path.join(__dirname, '..', 'src', icon)));
        }
    }
    for (const state of ['ok', 'error', 'unknown']) {
        for (const size of [19, 38, 128]) {
            const png = fs.readFileSync(path.join(__dirname, '..', 'src', 'icons', `health-${state}-${size}.png`));
            assert.equal(png.subarray(1, 4).toString(), 'PNG');
            assert.equal(png.readUInt32BE(16), size);
            assert.equal(png.readUInt32BE(20), size);
        }
    }
});

test('popup mounts without authentication and opens the configured server homepage', async () => {
    const compiler = require('@vue/compiler-sfc');
    const relative = 'src\\pages\\popup\\pages\\Home.vue';
    const file = path.join(__dirname, '..', relative);
    const descriptor = compiler.parse(fs.readFileSync(file, 'utf8')).descriptor;
    const script = compiler.compileScript(descriptor, { id: 'health-home-test' }).content;
    let mounted;
    const messages = [];
    const tabs = [];
    const component = loadModule(relative, {
        vue: {
            ref: value => ({ value }),
            computed: fn => ({ get value() { return fn(); } }),
            onMounted: fn => { mounted = fn; },
            onUnmounted() {},
        },
        '../../../common/health': common,
    }, {
        chrome: {
            runtime: {
                sendMessage(message, callback) {
                    messages.push(message.event);
                    callback({
                        ok: true, status: { state: 'healthy', data: statusData() },
                        settings: { serverUrl: 'https://monitor.example/prefix', intervalMinutes: 10 },
                    });
                },
            },
            storage: { onChanged: { addListener() {}, removeListener() {} } },
            tabs: { create: async options => tabs.push(options.url) },
        },
    }, script).default;
    const bindings = component.setup({}, { expose() {} });
    await mounted();
    assert.deepEqual(messages, [common.HEALTH_MESSAGES.GET]);
    await bindings.openDetails();
    assert.deepEqual(tabs, ['https://monitor.example/prefix/']);
});

test('popup routing and entry points have no login, OAuth or Parse integration', () => {
    const router = loadModule('src\\pages\\popup\\router.js', {
        'vue-router': { createRouter: options => options, createWebHashHistory: () => ({}) },
        './pages/Home': {}, './pages/Faq': {},
    }).default;
    assert.deepEqual(Array.from(router.routes, route => route.path), ['/', '/faq', '/:pathMatch(.*)*']);
    assert.equal(router.routes[2].redirect, '/');
    for (const relative of [
        'src\\background\\background.js', 'src\\background\\index.js', 'src\\common\\index.js',
        'src\\common\\ext.js', 'src\\pages\\popup\\popup.js', 'src\\pages\\popup\\popup.html',
        'src\\pages\\popup\\components\\nav.vue',
    ]) {
        const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
        assert.doesNotMatch(source, /Parse\.(initialize|User|Cloud|CoreManager)|parse\.min\.js|EVENT\.(LOGIN|LOGOUT|GET_CURRENT_USER|GET_PRO)|window\.G|EX\.(identity|user|proxy)/);
    }
    for (const relative of [
        'src\\common\\identity.js', 'src\\common\\user.js', 'src\\common\\proxy.js',
        'src\\pages\\popup\\pages\\Login.vue', 'src\\pages\\popup\\pages\\Setting.vue',
        'src\\pages\\popup\\pages\\Pro.vue', 'src\\pages\\popup\\pages\\Index.vue',
    ]) assert.equal(fs.existsSync(path.join(__dirname, '..', relative)), false);
});

(async () => {
    for (const { name, fn } of tests) {
        await fn();
        console.log('PASS ' + name);
    }
    console.log('Passed ' + tests.length + ' extension health tests.');
})().catch(error => { console.error(error); process.exitCode = 1; });

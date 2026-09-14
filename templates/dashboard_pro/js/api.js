window.__dpKvCache = window.__dpKvCache || {};

function dpHttp(path, opts) {
    return fetch('/api.php/module/dashboard_pro/' + path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...opts?.headers }
    }).then(r => r.json()).then(d => d.apiHandleResult !== undefined ? d.apiHandleResult : d);
}

function getPropertyCacheKey(object, property) {
    if (!object || !property) return null;
    return (object + '.' + property).toLowerCase();
}

function readProperty(path, opts) {
    const qsIdx = path.indexOf('?');
    const params = new URLSearchParams(qsIdx >= 0 ? path.slice(qsIdx + 1) : '');
    const object = (params.get('object') || '').trim();
    const property = (params.get('property') || '').trim();
    const key = getPropertyCacheKey(object, property);
    if (!key) return readKv(path, opts);
    const entry = window.__dpWsCache[key];
    if (entry && entry.seeded) {
        return Promise.resolve({ value: entry.value });
    }
    return dpHttp(path, opts).then(res => {
        if (res && !res.error && res.value !== undefined) {
            window.__dpWsCache[key] = { seeded: true, value: res.value };
        }
        return res;
    });
}

function readKv(path, opts) {
    const key = path.toLowerCase();
    if (key in window.__dpKvCache) {
        return Promise.resolve(window.__dpKvCache[key]);
    }
    return dpHttp(path, opts).then(res => {
        window.__dpKvCache[key] = res;
        return res;
    });
}

const dpAPI = (path, opts) => {
    if (window.__dpWsLive && typeof path === 'string') {
        if (path.startsWith('getProperty')) return readProperty(path, opts);
        if (path.startsWith('getProperties') || path.startsWith('history')) return readKv(path, opts);
    }
    return dpHttp(path, opts);
};
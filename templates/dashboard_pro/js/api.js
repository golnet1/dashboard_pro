function dpHttp(path, opts) {
    return fetch('/api.php/module/dashboard_pro/' + path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...opts?.headers }
    }).then(r => r.json()).then(d => d.apiHandleResult !== undefined ? d.apiHandleResult : d);
}

function wsGetProperty(path, opts) {
    const qsIdx = path.indexOf('?');
    const params = new URLSearchParams(qsIdx >= 0 ? path.slice(qsIdx + 1) : '');
    const object = (params.get('object') || '').trim();
    const property = (params.get('property') || '').trim();
    if (!object || !property) return dpHttp(path, opts);
    const key = (object + '.' + property).toLowerCase();
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

const dpAPI = (path, opts) => {
    if (window.__dpWsLive && typeof path === 'string' && path.startsWith('getProperty')) {
        return wsGetProperty(path, opts);
    }
    return dpHttp(path, opts);
};
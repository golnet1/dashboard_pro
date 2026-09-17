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
    const cached = window.__dpWsCache[key];
    if (cached && cached.seeded) {
        return Promise.resolve({ value: cached.value });
    }
    if (window.__dpWsLive) {
        const base = (object || '').toLowerCase();
        const baseEntry = window.__dpWsCache[base];
        if (baseEntry && baseEntry.seeded) {
            return Promise.resolve({ value: baseEntry.value });
        }
        if (cached) {
            return Promise.resolve({ value: cached.value });
        }
        return Promise.resolve({ value: undefined });
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

function wsInvalidateObject(base) {
    if (!base) return;
    const b = base.toLowerCase() + '.';
    if (window.__dpWsCache) {
        Object.keys(window.__dpWsCache).forEach(k => {
            if (k.startsWith(b)) delete window.__dpWsCache[k];
        });
    }
    if (window.__dpKvCache) {
        Object.keys(window.__dpKvCache).forEach(k => {
            const q = k.indexOf('?') >= 0 ? k.split('?')[0] + '?' + k.split('?').slice(1).join('?') : k;
            if (q.includes('object=' + base)) delete window.__dpKvCache[k];
        });
    }
}

function wsInvalidateAll() {
    if (window.__dpWsCache) window.__dpWsCache = {};
    if (window.__dpKvCache) window.__dpKvCache = {};
}

function wsApplyWrite(path, res) {
    if (!res || res.error) return;
    const qsIdx = path.indexOf('?');
    const params = new URLSearchParams(qsIdx >= 0 ? path.slice(qsIdx + 1) : '');
    if (path.startsWith('setProperty')) {
        const object = (params.get('object') || '').trim();
        const property = (params.get('property') || 'status').trim();
        const value = params.get('value');
        if (object && window.__dpWsCache) {
            window.__dpWsCache[getPropertyCacheKey(object, property) || (object.toLowerCase() + '.status')] = { seeded: true, value: value };
        }
    } else if (path.startsWith('method')) {
        const slashIdx = path.indexOf('/');
        const qIdx = path.indexOf('?');
        const end = qIdx >= 0 ? qIdx : path.length;
        if (slashIdx >= 0) wsInvalidateObject(path.slice(slashIdx + 1, end));
    } else if (path.startsWith('execCommand')) {
        wsInvalidateAll();
    }
}

const dpAPI = (path, opts) => {
    if (typeof path === 'string' && path.startsWith('setProperty')) {
        const qsIdx = path.indexOf('?');
        const params = new URLSearchParams(qsIdx >= 0 ? path.slice(qsIdx + 1) : '');
        const object = (params.get('object') || '').trim();
        const property = (params.get('property') || '').trim();
        const value = params.get('value');
        if (object && property && value !== null) {
            return fetch('/api.php/data/' + encodeURIComponent(object) + '.' + encodeURIComponent(property), {
                ...opts,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...opts?.headers },
                body: JSON.stringify({ data: value })
            }).then(r => r.json())
              .then(d => {
                  if (d && !d.error && window.__dpWsCache) {
                      window.__dpWsCache[(object + '.' + property).toLowerCase()] = { seeded: true, value: value };
                  }
                  return d;
              })
              .catch(e => ({ error: 'setProperty failed' }));
        }
    }
    if (typeof path === 'string' && path.startsWith('method/')) {
        const rest = path.slice('method/'.length);
        const qIdx = rest.indexOf('?');
        const base = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
        const query = qIdx >= 0 ? rest.slice(qIdx + 1) : '';
        const parts = base.includes('/') ? base.split('/') : [base];
        const object = (parts[0] || '').trim();
        const methodName = parts[1] ? object + '.' + parts[1] : (parts[0] || '');
        if (!methodName) return Promise.resolve({ error: 'invalid method' });
        if (object) wsInvalidateObject(object);
        return fetch('/api.php/method/' + encodeURIComponent(methodName) + (query ? '?' + query : ''))
            .then(r => r.json())
            .catch(e => ({ error: 'method failed' }));
    }
    if (window.__dpWsLive && typeof path === 'string') {
        if (path.startsWith('getProperty')) return readProperty(path, opts);
        if (path.startsWith('getProperties') || path.startsWith('history')) return readKv(path, opts);
    }
    return dpHttp(path, opts).then(res => {
        wsApplyWrite(path, res);
        return res;
    });
};
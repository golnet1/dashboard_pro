const dpAPI = (path, opts) => fetch('/api.php/module/dashboard_pro/' + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers }
}).then(r => r.json()).then(d => d.apiHandleResult !== undefined ? d.apiHandleResult : d);

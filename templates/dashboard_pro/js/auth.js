const Auth = (function() {
    const { ref } = Vue;

    const authenticated = ref(false);
    const authChecking = ref(true);
    const login = ref('');
    const password = ref('');
    const loginError = ref('');
    const loginLoading = ref(false);

    async function checkAuth(onAuth) {
        authChecking.value = true;
        try {
            const res = await dpAPI('checkAuth');
            if (res.authenticated) {
                authenticated.value = true;
                if (onAuth) await onAuth(res);
            }
        } catch (e) { console.error(e); }
        authChecking.value = false;
    }

    async function doLogin(onAuth) {
        loginError.value = '';
        loginLoading.value = true;
        try {
            const res = await dpAPI('login', {
                method: 'POST',
                body: JSON.stringify({ login: login.value, password: password.value })
            });
            if (res.success) {
                authenticated.value = true;
                if (onAuth) await onAuth(res);
            } else {
                loginError.value = res.error || 'Ошибка входа';
            }
        } catch (e) {
            loginError.value = 'Ошибка соединения: ' + (e.message || e);
        }
        loginLoading.value = false;
    }

    async function testAPI() {
        loginError.value = '';
        try {
            const res = await dpAPI('test');
            loginError.value = 'Статус: ' + (res.status || JSON.stringify(res));
        } catch (e) {
            loginError.value = 'Ошибка: ' + (e.message || e);
        }
    }

    function doLogout() {
        dpAPI('logout');
        authenticated.value = false;
        login.value = '';
        password.value = '';
        loginError.value = '';
    }

    return { authenticated, authChecking, login, password, loginError, loginLoading, checkAuth, doLogin, doLogout, testAPI };
})();

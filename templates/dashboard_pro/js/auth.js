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
        /* The session lives on the server, so a request that did not get through says
           nothing about it. Without the retry one refused or half finished request put
           the sign in screen in front of a user who is in fact authorised, and it
           stayed there - nothing asked again. An answer that says "not authorised" is
           the one that is taken at once, because that is the server talking. */
        for (let i = 0; i < 3; i++) {
            try {
                const res = await dpAPI('checkAuth');
                if (res && res.authenticated) {
                    authenticated.value = true;
                    if (onAuth) await onAuth(res);
                    authChecking.value = false;
                    return;
                }
                /* dpHttp never rejects: a request that did not come through comes
                   back as a plain object with an error in it. That is not the server
                   saying "not authorised", it is a question that was not answered, so
                   it is asked again. Only a clean answer is taken at once - otherwise
                   one bad request put the sign in screen in front of a user who is in
                   fact authorised, and it stayed there, because nothing asked again. */
                if (res && !res.error) break;
            } catch (e) {
                if (i === 2) console.error(e);
            }
            if (i < 2) await new Promise(r => setTimeout(r, 500));
        }
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
                loginError.value = res.error || t('login_error');
            }
        } catch (e) {
            loginError.value = t('connection_error') + (e.message || e);
        }
        loginLoading.value = false;
    }

    async function testAPI() {
        loginError.value = '';
        try {
            const res = await dpAPI('test');
            loginError.value = t('status_label') + (res.status || JSON.stringify(res));
        } catch (e) {
            loginError.value = t('error_label') + (e.message || e);
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

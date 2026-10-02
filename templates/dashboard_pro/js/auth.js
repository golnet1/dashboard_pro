const Auth = (function() {
    const { ref } = Vue;

    const authenticated = ref(false);
    const authChecking = ref(true);
    /* The server has said "not authorised" - and nothing else opens the sign in
       screen. While the answer is still unknown the screen must not be there: a
       request that failed or came back with an error in it says nothing about the
       session, and showing the form to somebody who is authorised is exactly the
       thing that must not happen. */
    const authDenied = ref(false);
    const login = ref('');
    const password = ref('');
    const loginError = ref('');
    const loginLoading = ref(false);
    let retryTimer = null;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    /* one question, one answer: "yes", "no", or "not answered". dpHttp never rejects,
       it hands a request that did not come through back as an object carrying the
       error - that is not the server refusing, it is the server not heard from. */
    async function ask() {
        try {
            const res = await dpAPI('checkAuth');
            if (res && res.authenticated) return { how: 'yes', res: res };
            if (res && !res.error) return { how: 'no' };
            return { how: 'silent' };
        } catch (e) {
            return { how: 'silent' };
        }
    }

    /* The api kept quiet. The session may well be there, so the form stays closed and
       the question is asked again in the background: an authorised user walks into the
       dashboard the moment the server answers, and one who is not sees the form then
       too - neither of them is left looking at a form that was never warranted. */
    function keepAsking(onAuth) {
        if (retryTimer) return;
        retryTimer = setInterval(async () => {
            if (authenticated.value || authDenied.value) { clearInterval(retryTimer); retryTimer = null; return; }
            const a = await ask();
            if (a.how === 'yes') {
                clearInterval(retryTimer); retryTimer = null;
                authenticated.value = true;
                if (onAuth) await onAuth(a.res);
            } else if (a.how === 'no') {
                clearInterval(retryTimer); retryTimer = null;
                authDenied.value = true;
            }
        }, 1500);
    }

    async function checkAuth(onAuth) {
        authChecking.value = true;
        try {
            for (let i = 0; i < 3; i++) {
                const a = await ask();
                if (a.how === 'yes') {
                    authenticated.value = true;
                    authDenied.value = false;
                    if (retryTimer) { clearInterval(retryTimer); retryTimer = null; }
                    if (onAuth) await onAuth(a.res);
                    return;
                }
                if (a.how === 'no') { authDenied.value = true; return; }
                if (i < 2) await sleep(500);
            }
            keepAsking(onAuth);
        } finally {
            authChecking.value = false;
        }
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
                authDenied.value = false;
                if (retryTimer) { clearInterval(retryTimer); retryTimer = null; }
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
        /* leaving on purpose: the form is what is wanted now */
        authDenied.value = true;
        login.value = '';
        password.value = '';
        loginError.value = '';
    }

    return { authenticated, authChecking, authDenied, login, password, loginError, loginLoading, checkAuth, doLogin, doLogout, testAPI };
})();
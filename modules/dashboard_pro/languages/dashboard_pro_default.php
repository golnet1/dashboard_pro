<?php

$dictionary = array(
    'DASHBOARD_PRO_TITLE' => 'Dashboard Pro',
    'DASHBOARD_PRO_USER_SETTINGS' => 'Dashboard Pro user settings',
    'DASHBOARD_PRO_LOGIN_REQUIRED' => 'Login and password are required',
    'DASHBOARD_PRO_LOGIN_INVALID' => 'Invalid login or password',
    'DASHBOARD_PRO_CHAT' => 'Chat',
    'DASHBOARD_PRO_COPY_SELF' => 'Cannot copy to yourself',
    'DASHBOARD_PRO_OVERWRITE_CONFIRM' => 'User "%s" already has data. Overwrite?',
    'DASHBOARD_PRO_ALICE' => 'Alice',
);

foreach ($dictionary as $k => $v) {
    if (!defined('LANG_' . $k)) {
        define('LANG_' . $k, $v);
    }
}

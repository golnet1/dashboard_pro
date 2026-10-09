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
     megad  - адресная лента кадром целиком (pixels троек байт RRGGBB).

   Цветовые эффекты (ic_mode): cm - плавный ход по кругу; wave/cm_wave -
   радуга бежит по ленте; shuffle - случайные цвета по пикселям.

   Payload:
   {
     action: 'start'|'stop',
     dev: 'ports'|'rgb'|'ic'|'megad',
     targets: [{object, property}, ...],
     mode: 'freq'|'wave', out: 'onoff'|'level', on_level: 90,   // ports
     wr: 'hex'|'rgb', ic_mode: 'cm'|'wave'|'cm_wave'|'shuffle', // rgb/ic
     pixels: 100,                                               // megad
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

function cmFindValueId($op)
{
    if (!$op || strpos($op, '.') === false) return false;
    list($oname, $pname) = array_map('trim', explode('.', $op, 2));
    if ($oname === '' || $pname === '') return false;
    $oid = (int)SQLSelectOne("SELECT ID FROM objects WHERE TITLE LIKE '" . DBSafe($oname) . "'")['ID'];
    if (!$oid) return false;
    $v = SQLSelectOne("SELECT ID, VALUE FROM pvalues WHERE OBJECT_ID=" . $oid . " AND PROPERTY_NAME LIKE '" . DBSafe($pname) . "'");
    if (!$v['ID']) return false;
    return (int)$v['ID'];
}

function cmWriteTargets($targets, $values)
{
    if (!$targets) return;
    $now = date('Y-m-d H:i:s');
    foreach ($targets as $i => $t) {
        $v = isset($values[$i]) ? $values[$i] : end($values);
        $vid = cmFindValueId($t['object'] . '.' . $t['property']);
        if ($vid) {
            SQLExec("UPDATE pvalues SET VALUE='" . DBSafe((string)$v) . "', UPDATED='" . $now . "' WHERE ID=" . $vid);
        } else {
            setGlobal($t['object'] . '.' . $t['property'], (string)$v);
        }
    }
}

function cmWriteColor($targets, $dev, $wr, $rgb)
{
    if (!$targets) return;
    if ($dev !== 'ports' && $wr === 'hex') {
        $v = sprintf('%02x%02x%02x', cmClamp8($rgb[0]), cmClamp8($rgb[1]), cmClamp8($rgb[2]));
        $now = date('Y-m-d H:i:s');
        $vid = cmFindValueId($targets[0]['object'] . '.' . $targets[0]['property']);
        if ($vid) {
            SQLExec("UPDATE pvalues SET VALUE='" . DBSafe($v) . "', UPDATED='" . $now . "' WHERE ID=" . $vid);
        } else {
            setGlobal($targets[0]['object'] . '.' . $targets[0]['property'], $v);
        }
        return;
    }
    cmWriteTargets($targets, array(cmClamp8($rgb[0]), cmClamp8($rgb[1]), cmClamp8($rgb[2])));
}

/* финальное состояние таргетов при стопе (end_action) */
function cmApplyEnd($targets, $dev, $wr, $out, $pixels, $end)
{
    if (!$targets || $end === 'keep') return;
    $on = ($end === 'on');
    if ($dev === 'megad') {
        $c = $on ? array(255, 255, 255) : array(0, 0, 0);
        $frame = array_fill(0, max(1, $pixels), $c);
        $v = cmFrameHex($frame);
        $now = date('Y-m-d H:i:s');
        $vid = cmFindValueId($targets[0]['object'] . '.' . $targets[0]['property']);
        if ($vid) {
            SQLExec("UPDATE pvalues SET VALUE='" . DBSafe($v) . "', UPDATED='" . $now . "' WHERE ID=" . $vid);
        } else {
            setGlobal($targets[0]['object'] . '.' . $targets[0]['property'], $v);
        }
        return;
    }
    if ($dev === 'ports') {
        if ($out === 'onoff') cmWriteTargets($targets, array($on ? '1' : '0'));
        else cmWriteTargets($targets, array($on ? '255' : '0'));
        return;
    }
    if ($dev !== 'ports' && $wr === 'hex') {
        $v = $on ? 'ffffff' : '000000';
        $now = date('Y-m-d H:i:s');
        $vid = cmFindValueId($targets[0]['object'] . '.' . $targets[0]['property']);
        if ($vid) {
            SQLExec("UPDATE pvalues SET VALUE='" . DBSafe($v) . "', UPDATED='" . $now . "' WHERE ID=" . $vid);
        } else {
            setGlobal($targets[0]['object'] . '.' . $targets[0]['property'], $v);
        }
        return;
    }
    if ($on) cmWriteTargets($targets, array(255, 60, 20));
    else cmWriteTargets($targets, array('0'));
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
if (!in_array($dev, array('ports', 'rgb', 'ic', 'megad'), true)) $dev = 'ports';

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

/* убрать движку его цели: пишем ему конечное состояние, шлём SIGTERM, ждём,
   пока он уйдёт, и только потом возвращаем свет сами - иначе его последний
   кадр перекроет наше значение */
function cmStopEngines($dir, $targets, $end)
{
    $dead = array();
    foreach (cmCfgLoad($dir) as $cfg) {
        if (!cmTargetsOverlap($cfg['targets'], $targets)) continue;
        $cfg['end'] = $end;
        @file_put_contents($cfg['__file'], json_encode($cfg));
        $pid = (int)($cfg['pid'] ?? 0);
        if ($pid > 1) @shell_exec('kill ' . $pid . ' 2>/dev/null');
        @unlink($cfg['__file']);
        $dead[] = $cfg;
    }
    if (!$dead) return;
    usleep(150000);
    foreach ($dead as $cfg) {
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
$startCfg = array(
    'dev' => $dev, 'targets' => $targets, 'wr' => $wr, 'out' => $out,
    'pixels' => $pixels, 'end' => $end, 'pid' => 0,
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

$cnt = count($targets);

pcntl_async_signals(true);
/* on a turn the stop command asked for, the cfg already carries the state to leave the
   light in; when the cfg is gone nothing is written, the caller has done it itself */
pcntl_signal(SIGTERM, function () use ($targets, $dev, $wr, $out, $pixels, $cfgFile) {
    $cfg = is_file($cfgFile) ? json_decode(@file_get_contents($cfgFile), true) : null;
    if (is_array($cfg) && isset($cfg['end'])) {
        cmApplyEnd($targets, $dev, $wr, $out, $pixels, (string)$cfg['end']);
    }
    @unlink($cfgFile);
    exit(0);
});

/* ---- цикл ---------------------------------------------------------- */

$heads = array_fill(0, max(1, $cnt), 0.0);
$step = 0;
$phase = 0.0;
$shuffleAt = 0;
$shuffleColors = array();

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
        $v = cmFrameHex($frame);
        $now = date('Y-m-d H:i:s');
        $vid = cmFindValueId($targets[0]['object'] . '.' . $targets[0]['property']);
        if ($vid) {
            SQLExec("UPDATE pvalues SET VALUE='" . DBSafe($v) . "', UPDATED='" . $now . "' WHERE ID=" . $vid);
        } else {
            setGlobal($targets[0]['object'] . '.' . $targets[0]['property'], $v);
        }
    }

    $step++;
    usleep($speed * 1000);
}
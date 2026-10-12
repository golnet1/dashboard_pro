<?php
/* Легкий приёмник кадров цветомузыки: пишет кадр в файл работающего движка
   cm_engine.php. Не грузит MajorDoMo (в отличие от /api.php/module/...),
   поэтому браузер может слать кадры десятки раз в секунду, а движок - читать
   их каждым тиком и пересылать в Object.Property. */
header('Content-Type: application/json');
$dir = __DIR__ . '/.cm_run';
$in = json_decode((string)@file_get_contents('php://input'), true);
if (!is_array($in) || !isset($in['targets']) || !is_array($in['targets'])
    || !isset($in['values']) || !is_array($in['values'])) {
    echo '{"ok":0}';
    exit;
}
$ids = array();
foreach ($in['targets'] as $t) {
    if (!is_array($t)) continue;
    $object = trim((string)($t['object'] ?? ''));
    $property = trim((string)($t['property'] ?? ''));
    if ($object === '' || !preg_match('/^[A-Za-z0-9_\-\.]{1,64}$/', $object)) continue;
    if ($property === '' || !preg_match('/^[A-Za-z0-9_\-\.]{1,64}$/', $property)) continue;
    $ids[] = $object . '.' . $property;
}
if (!$ids) {
    echo '{"ok":0}';
    exit;
}
sort($ids);
$hash = substr(md5(implode('|', $ids)), 0, 12);
if (!is_file($dir . '/cm_' . $hash . '.json')) {
    echo '{"ok":1,"eng":0}';
    exit;
}
$values = array();
foreach ($in['values'] as $v) {
    $n = (int)$v;
    if ($n < 0) $n = 0;
    if ($n > 255) $n = 255;
    $values[] = (string)$n;
}
/* raw - «сырые» уровни полос: ими движок гонит ШИМ-порты (диммеры), чтобы
   те мигали, а не залипали на постоянном AGC-уровне */
$raw = array();
if (isset($in['raw']) && is_array($in['raw'])) {
    foreach ($in['raw'] as $v) {
        $n = (int)$v;
        if ($n < 0) $n = 0;
        if ($n > 255) $n = 255;
        $raw[] = (string)$n;
    }
}
$tmp = $dir . '/cm_' . $hash . '.frame.tmp';
$payload = array('values' => $values);
if ($raw) $payload['raw'] = $raw;
if (@file_put_contents($tmp, json_encode($payload)) !== false) {
    @rename($tmp, $dir . '/cm_' . $hash . '.frame');
}
echo '{"ok":1}';
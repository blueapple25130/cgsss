<!DOCTYPE html>
<html lang="ja">
    <head>
        <title>CGSSS</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width initial-scale=1 maximum-scale=1 user-scalable=0 minimal-ui">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <script src="pixi.min.js"></script>
        <script src="web-audio.js"></script>
        <link rel="stylesheet" type="text/css" href="style.css">
    </head>
    <body>
        <div id="loading"><img src="load.gif" alt="Loading..." /></div>
        <?php
        echo '<script>'.
            'var PARAM_FILENAME = "'.$_GET['map'].'";'.PHP_EOL.
            'var PARAM_SPEED = '.(isset($_GET['speed'])?$_GET['speed']:'undefined').';'.PHP_EOL.
            'var PARAM_ISSKIP = '.(isset($_GET['skip'])?($_GET['skip']!=0?'true':'false'):'false').';'.PHP_EOL.
            '</script>';
        ?>
        <script src="main.js"></script>
    </body>    
</html>
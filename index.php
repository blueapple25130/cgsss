<!DOCTYPE html>
<html lang="ja">
    <head>
		<link rel="apple-touch-icon" href="icon.png" />
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width initial-scale=1 maximum-scale=1 user-scalable=0 minimal-ui">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>CGSSS</title>
    </head>
    <body>
        <p style="font-size:25px;font-weight:bold;">譜面一覧</p>
        <?php
        if ($handle = opendir('beatmap')) {
            while (false !== ($file = readdir($handle))) {
                if($file!="."&&$file!=".."){
                    $json = file_get_contents("beatmap/".$file);
                    $json = mb_convert_encoding($json, 'UTF8', 'ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN');
                    $arr = json_decode($json,true);
                    echo '<a href=game.php?map='.$file.'>';
                    echo "<p>";
                    echo $arr['title'];
                    echo "</p></a>";
                }
            }
            closedir($handle);
        }
        ?>
        <script>
            var elements = document.querySelectorAll('a');
            for(var i = elements.length;i--;){
                elements[i].onclick = function(e){
                    e.preventDefault();
                    window.location = this.getAttribute('href');
                }
            }
        </script>
    </body>
</html>
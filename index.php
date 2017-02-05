<!DOCTYPE html>
<html lang="ja">
    <head>
        <meta charset="utf-8">
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
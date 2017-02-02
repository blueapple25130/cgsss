var APP_WIDTH = 960;
var APP_HEIGHT = 540;

var app = new PIXI.Application(APP_WIDTH, APP_HEIGHT);
document.body.appendChild(app.view);

onResize();
window.onresize = onResize;

var note;
var se;
var music;

PIXI.loaders.Resource.setExtensionXhrType("mp3", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("mp3", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionXhrType("ogg", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("ogg", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionXhrType("wav", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("wav", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);


PIXI.loader
    .add('tex_tap', 'asset/image/tap.png')
    .add('tex_bg', 'asset/image/release_bg.png')
    .add('aud_music', "music/tulip.mp3")
    .add('aud_tap', "asset/sound/perfect.mp3")
    .load(onAssetsLoaded);

function onAssetsLoaded(loader, res) 
{
    app.stage.visible = false;
    //画面生成
    var bg = new PIXI.Sprite(res['tex_bg'].texture);
    app.stage.addChild(bg);
    note = new PIXI.Sprite(res['tex_tap'].texture);
    note.anchor.set(0.5);
    app.stage.addChild(note);
    //オーディオのデコード
    new WebAudioDecoder()
        .add('aud_music',res['aud_music'].data)
        .add('aud_tap',res['aud_tap'].data)
        .decode(onAudioDecoded);
}

function onAudioDecoded(res){
    music = new WebAudio(res['aud_music']);
    se = new WebAudio(res['aud_tap']);

    app.stage.interactive = true;
    app.stage
        .on("pointerdown",onDown)
        .on("pointermove",onMove)
        .on("pointerup",onUp);
    
    document.body.removeChild(document.getElementById("loading"));
    app.stage.visible = true;
    music.play();
    animate();
}

function update(){


    app.renderer.render(app.stage);
    requestAnimationFrame(update);
}

function onDown(e){
    se.play();
    //console.log("Down:" + e.data.originalEvent.pointerId);
    note.position.x = e.data.global.x;
    note.position.y = e.data.global.y;
}

function onUp(e){
    //console.log("Up:" + e.data.originalEvent.pointerId);
    note.position.x = e.data.global.x;
    note.position.y = e.data.global.y;
}

function onMove(e){
    //console.log("Move:" + e.data.originalEvent.pointerId);
    note.position.x = e.data.global.x;
    note.position.y = e.data.global.y;
}

function onResize() {
    var ratio
    var ratioWidth = window.innerWidth / APP_WIDTH;
    var ratioHeight = window.innerHeight / APP_HEIGHT;
    if (ratioWidth < ratioHeight) {
        ratio = ratioWidth;
    } else {
        ratio = ratioHeight;
    }
    app.view.style.width = ~~(APP_WIDTH * ratio) + 'px';
    app.view.style.height = ~~(APP_HEIGHT * ratio) + 'px';
}
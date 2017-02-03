///
var SpeedManager = {
    noteUseTime:[2.7,2.67,2.64,2.61,2.58,2.55,2.52,2.49,2.46,2.43,2.4,2.37,2.34,2.31,2.28,2.25,2.22,2.19,2.16,2.13,2.1,2.07,2.04,2.01,1.98,1.95,1.92,1.89,1.86,1.83,1.8,1.78,1.76,1.74,1.72,1.7,1.68,1.66,1.64,1.62,1.6,1.58,1.56,1.54,1.52,1.5,1.48,1.46,1.44,1.42,1.4,1.38,1.36,1.34,1.32,1.3,1.28,1.26,1.24,1.22,1.2,1.18,1.16,1.14,1.12,1.1,1.08,1.06,1.04,1.02,1,0.98,0.96,0.94,0.92,0.9,0.88,0.86,0.84,0.82,0.8,0.78,0.76,0.74,0.72,0.7,0.66,0.62,0.58,0.54,0.5],
    getNoteUseTime:function (speed){
        return this.noteUseTime[speed*10-10]*1000;
    }
};

var NoteManager = {
    speed:SpeedManager.getNoteUseTime(9.3),
    getNotePositionX:function (t,startPos,finishPos){
        return this.getX(t) * (this.getFinishPosX(finishPos) - this.getStartPosX(startPos)) + this.getStartPosX(startPos);
    },
    getNotePositionY:function (t){
        return this.getY(t) * (this.getFinishPosY() - this.getStartPosY()) + this.getStartPosY();
    },
    getStartPosX:function (i) {
        return 110 * (i - 1) + 260;
    },
    getFinishPosX:function (i) {
        return 148 * (i - 1) + 184;
    },
    getStartPosY:function () {
        return 115;
    },
    getFinishPosY:function (){
        return 448;
    },
    getT:function (time) {
        return Math.min(Math.max(0, time/this.speed + 1), 1.5);
    },

    getX:function (t) {
        return -0.319153853866737 * Math.pow(t, 5) + 0.833982546813786 * Math.pow(t, 4) - 0.323215452372096 * Math.pow(t, 3) - 1.034510116798630 * Math.pow(t, 2) + 1.842884775897800 * t;
    },

    getY:function (t) {
        return -0.759639294381486 * Math.pow(t, 5) + 4.401309909531840 * Math.pow(t, 4) - 8.374126664741200 * Math.pow(t, 3) + 7.836102202563780 * Math.pow(t, 2) - 2.102836822655260 * t;
    },

    getScale:function (t) {
        return -0.036629699490732 * Math.pow(t, 5) + 0.431047962163575 * Math.pow(t, 4) - 0.452487806673162 * Math.pow(t, 3) - 0.178201526687189 * Math.pow(t, 2) + 1.236315715326780 * t;
    }
};

var InputManager = {
    XtoLane:function (x){
        if(x<110)return 0;
        for(var i=0;i<5;i++){
            if(148 * (i - 0.5) + 184 <= x && x < 148 * (i + 0.5) + 184){
                return i;
            }
        }
        if(850<=x)return 4;
    }
};

var Note = function(time,startPos,finishPos,noteType,longType,texture){
    var anchorList = [0.5,0.5,0.6,0.4];
    this.time = time;
    this.startPos = startPos;
    this.finishPos = finishPos;
    this.noteType = noteType;
    this.longType = longType;

    this.isStarted = false;
    this.isThrough = false;
    this.isDestroy = false;

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.visible = false;
    this.sprite.anchor.set(anchorList[noteType],0.5);
    this.t = 0;
};

Note.prototype = {
    setPosition:function (t){
        this.t = t;
        this.sprite.x = NoteManager.getNotePositionX(t,this.startPos,this.finishPos);
        this.sprite.y = NoteManager.getNotePositionY(t);
        this.scale = NoteManager.getScale(t);
        this.sprite.scale.set(85/256*this.scale);
    },
    update:function (time){
        var t = NoteManager.getT(time-this.time);
        if (!this.isStarted && t > 0){
            this.sprite.visible = true;
            this.isStarted = true;
        }else if(!this.isThrough && t >= 1.5){
            this.sprite.visible = false;
            this.isThrough = true;
        }
        if(0 < t && t < 1.5){
            this.setPosition(t);   
        }
    },
    destroy:function(){
        app.stage.removeChild(this.sprite);
        this.isDestroy = true;
    },
    addChild:function(){
        app.stage.addChild(this.sprite);
    }
};

var LONGMESH_DIVISION = 30;

var LongMesh = function(beginNote,endNote,texture){
    var verts = new Float32Array((LONGMESH_DIVISION+1)*4);
    var uvs = new Float32Array((LONGMESH_DIVISION+1)*4);
    var triangles = new Uint16Array(LONGMESH_DIVISION*6);
    for(var i=0;i<LONGMESH_DIVISION*2;i++){
        triangles[i*3] = i;
        triangles[i*3+1] = i+1;
        triangles[i*3+2] = i+2;
    }
    this.mesh = new PIXI.mesh.Mesh(texture,verts, uvs, triangles, PIXI.mesh.Mesh.DRAW_MODES.TRIANGLES);
    this.beginNote = beginNote;
    this.endNote = endNote;
}

LongMesh.prototype = {
    setVertex:function(){
        var beginT = this.beginNote.isDestroy?1:this.beginNote.t;
        var endT = this.endNote.t;
        var t = 0;
        for(var j=0;j<LONGMESH_DIVISION+1;j++){
            var clipT = Math.min(Math.max(endT,t),beginT);
            var x = NoteManager.getNotePositionX(clipT,this.beginNote.startPos,this.beginNote.finishPos);
            var y = NoteManager.getNotePositionY(clipT);
            var width = 85*NoteManager.getScale(clipT);

            this.mesh.vertices[j*4] = x-width/2;
            this.mesh.vertices[j*4+1] = y;

            this.mesh.vertices[j*4+2] = x+width/2;
            this.mesh.vertices[j*4+3] = y;

            t+=1/LONGMESH_DIVISION;
        }
    },
    update:function(){
        if(this.beginNote.isStarted){
            this.setVertex();
        }
    },
    destroy:function(){
        app.stage.removeChild(this.mesh);
    },
    addChild:function(){
        app.stage.addChild(this.mesh);
    }
}

/*
var FlickMesh = function(beginNote,endNote){
    
}
*/



/*
var Judge = function (){
    this.frame = 0;
    this.duration = 30;
    this.isStart = false;
    this.sprite = game.add.sprite(480, 350, 'judge',0);
    this.sprite.anchor.set(0.5);
    this.sprite.visible = false;
};

Judge.prototype = {
    play:function(judge){
        this.frame = 0;
        this.isStart = true;
        this.sprite.frame = judge;
        this.sprite.visible = true
    },
    update:function(){
        if(this.isStart){
            this.animation();
            this.frame++; 
            if(this.frame==this.duration){
                this.isStart = false;
                this.sprite.visible = false;
            }
        }
    },
    animation:function(){
        if(this.frame<8){
            this.sprite.scale.set(this.frame/7);
        }else{
            this.sprite.scale.set(1);
        }
    }
};

var ComboManager = {
    comboBuffer:0,
    digitWidth:66,
    num2digits:function (num){
        return String(num).split('').map(function (e) { return Number(e); });
    },
    digitNum2x:function (length){
        var digits = [];
        var center = Math.floor(length/2);
        var isEven = length%2==0;

        for(var i=0;i<length;i++){
            if(isEven){
                digits[i] = (i+(i<center?1:0)-center)*this.digitWidth+(i<center?-this.digitWidth/2:this.digitWidth/2);
            }else{
                digits[i] = (i-center)*this.digitWidth;
            }
        }
        return digits;
    },
    update:function (combo){
        if(combo!=this.comboBuffer){
            var digits = this.num2digits(combo);
            var positions = this.digitNum2x(digits.length);
            comboTexture.clear();
            if(combo!=0){
                comboTexture.renderXY(comboText, 132, 110); 
                for(var i=0;i<digits.length;i++){
                    comboNum.frame = digits[i];
                    comboTexture.renderXY(comboNum, positions[i]+132, 43);   
                }   
            }
            this.comboBuffer = combo;
        }
    }
};
*/
var JadgeTime = {
    perfect:60,
    great:80,
    good:100,
    bad:130
}

///

var APP_WIDTH = 960;
var APP_HEIGHT = 540;

var app = new PIXI.Application(APP_WIDTH, APP_HEIGHT);
document.body.appendChild(app.view);

var stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = "0px";
stats.domElement.style.left = "0px";
document.body.appendChild(stats.domElement);

onResize();
window.onresize = onResize;

PIXI.loaders.Resource.setExtensionXhrType("mp3", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("mp3", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionXhrType("ogg", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("ogg", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionXhrType("wav", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("wav", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);

PIXI.loader
    .add('tex_back', 'asset/image/release_bg.png')
    .add('tex_tap', 'asset/image/tap.png')
    .add('tex_long', 'asset/image/long.png')
    .add('tex_flick0', 'asset/image/Lflick.png')
    .add('tex_flick1', 'asset/image/Rflick.png')
    .add('tex_bg', 'asset/image/release_bg.png')
    .add('tex_none', 'asset/image/none.bmp')
    .add('audio_perfect', "asset/sound/perfect.mp3")
    .add('audio_flick', "asset/sound/flick.mp3")
    .add('audio_music', "music/jttf.mp3")
    .add('json_map', "beatmap/jttf.json")
    .load(onAssetsLoaded);

/*
game.load.image('backGround', 'asset/image/release_bg.png');
game.load.image('tap', 'asset/image/tap.png');
game.load.image('long', 'asset/image/long.png');
game.load.image('Lflick', 'asset/image/Lflick.png');
game.load.image('Rflick', 'asset/image/Rflick.png');

game.load.spritesheet('judge', 'asset/image/judge.png', 324, 74, 5);
game.load.spritesheet('comboNum', 'asset/image/combo_number.png', 66, 85, 10);
game.load.image('comboText', 'asset/image/combo.png');

game.load.audio('tapSE', 'asset/sound/perfect.mp3');
game.load.audio('flickSE', 'asset/sound/flick.mp3');

game.load.audio('music', 'music/jttf.mp3');
game.load.json('beatmap', 'beatmap/jttf.json');
*/

var music;
var tapSE;
var flickSE;

var noteList = [[],[],[],[],[]];
var longMeshList = [];
var flickMeshList = [];


var comboText;
var combo = 0;
var judge;
var LNflag = [false,false,false,false,false];
var comboNum;
var comboTexture;
var comboSprite;
var comboText;
var comboAnime;

function onAssetsLoaded(loader, res) 
{
    app.stage.visible = false;
    //画面生成
    var bg = new PIXI.Sprite(res['tex_back'].texture);
    app.stage.addChild(bg);

    /*
    comboNum = game.make.sprite(0, 0, 'comboNum',0);
    comboNum.anchor.set(0.5);
    comboText = game.make.sprite(0, 0, 'comboText');
    comboText.anchor.set(0.5);
    comboTexture = game.add.renderTexture(264, 140);
    comboSprite = game.add.sprite(800, 130, comboTexture);
    comboSprite.anchor.set(0.5);
    /*

    */
    //judge = new Judge();
    var longBuf = [false,false,false,false,false];
    var beatmap = res['json_map'].data;
    var typeList = ['tex_tap','tex_long','tex_flick0','tex_flick1'];
    for(var i=0;i<beatmap.notes.length;i++){
        var lnType = 0;
        if(beatmap.notes[i].type==1){
            longBuf[beatmap.notes[i].finish-1]=true;
            lnType = 1;
        }else{
            if(longBuf[beatmap.notes[i].finish-1]){
                longBuf[beatmap.notes[i].finish-1]=false;
                lnType = 2;
            }
        }
        noteList[beatmap.notes[i].finish-1].push(new Note(beatmap.notes[i].time*1000+beatmap.offset*1000,beatmap.notes[i].start,beatmap.notes[i].finish,beatmap.notes[i].type,lnType,res[typeList[lnType==2&&beatmap.notes[i].type==0?1:beatmap.notes[i].type]].texture));   
    }
    //
    var beginNote;
    for(var i=5;i--;){
        for(var j=0;j<noteList[i].length;j++){
            if(noteList[i][j].longType==1){
                beginNote = noteList[i][j];
            }else if(noteList[i][j].longType==2){
                longMeshList.push(new LongMesh(beginNote,noteList[i][j],res['tex_none'].texture))   
            }
        }
    }
    
    //メッシュ追加
    for(var i=longMeshList.length;i--;){
        longMeshList[i].addChild();
    }
    //ノート追加
    for(var i=5;i--;){
        for(var j=noteList[i].length;j--;){
            noteList[i][j].addChild();
        }
    }
    //オーディオのデコード
    new WebAudioDecoder()
        .add('audio_music',res['audio_music'].data)
        .add('audio_perfect',res['audio_perfect'].data)
        .add('audio_flick',res['audio_flick'].data)
        .decode(onAudioDecoded);
}

function onAudioDecoded(res){
    
    music = new WebAudio(res['audio_music']);
    tapSE = new WebAudio(res['audio_perfect']);
    flickSE = new WebAudio(res['audio_flick']);
    
    //タッチ有効化
    //app.stage.interactive = true;
    /*app.stage
        .on("pointerdown",onDown)
        .on("pointermove",onMove)
        .on("pointerup",onUp);*/
    
    app.view.addEventListener("touchstart",onDown);
    app.view.addEventListener("touchmove",onMove);
    app.view.addEventListener("touchend",onUp);
    
    //ロード画面消去
    document.body.removeChild(document.getElementById("loading"));
    app.stage.visible = true;
    
    music.play();
    update();
}

var LNMemory = {};
var bufx = {};

function update(){
    for(var i=0;i<5;i++){
        if(noteList[i].length!=0){
            if(noteList[i][0].time-music.getTime()<-JadgeTime.bad){
                //miss
                if(noteList[i][0].longType==1){
                    noteList[i][0].destroy();
                    noteList[i].shift();
                }else if(noteList[i][0].longType==2){
                    LNflag[i] = false;
                }
                combo = 0;
                //judge.play(4);
                noteList[i][0].destroy();
                noteList[i].shift();
            }
        }
        for(var j=noteList[i].length;j--;){
            noteList[i][j].update(music.getTime());
        }
    }
    
    for(var i=longMeshList.length;i--;){
        longMeshList[i].update();
        if(longMeshList[i].endNote.isDestroy){
            longMeshList[i].destroy();
            longMeshList.slice(i,1);
        }
    }
    
    //judge.update();
    //ComboManager.update(combo);

    app.renderer.render(app.stage);
    requestAnimationFrame(update);
    stats.update();
}

function onDown(e){
    for(var i=e.touches.length;i--;){
        var touch = e.touches[i];
        var x = touch.clientX/app.view.clientWidth*APP_WIDTH;
        var y = touch.clientY/app.view.clientHeight*APP_HEIGHT;
        var id = touch.identifier;
        bufx[id] = x;
        var lane = InputManager.XtoLane(x);
        var inputLane = noteList[lane];
        LNMemory[id] = lane;
        if(inputLane.length!=0){
            if(inputLane[0].noteType<2&&inputLane[0].longType!=2){
                var diff = Math.abs(inputLane[0].time-music.getTime());
                if(diff<JadgeTime.perfect){
                    //perfect
                    tapSE.play();
                    //judge.play(0);
                    if(inputLane[0].longType==1)LNflag[lane] = true;
                    combo++;
                    inputLane[0].destroy();
                    inputLane.shift();
                }else if(diff<JadgeTime.great){
                    //great
                    tapSE.play();
                    //judge.play(1);
                    if(inputLane[0].longType==1)LNflag[lane] = true;
                    combo++;
                    inputLane[0].destroy();
                    inputLane.shift();
                }else if(diff<JadgeTime.good){
                    //good
                    tapSE.play();
                    //judge.play(2);
                    if(inputLane[0].longType==1)LNflag[lane] = true;
                    combo = 0;
                    inputLane[0].destroy();
                    inputLane.shift();
                }else if(diff<JadgeTime.bad){
                    //bad
                    tapSE.play();
                    //judge.play(3);
                    if(inputLane[0].longType==1)LNflag[lane] = true;
                    combo = 0;
                    inputLane[0].destroy();
                    inputLane.shift();
                }   
            }
        }
    }
}

function onUp(e){
    for(var i=e.changedTouches.length;i--;){
        var touch = e.changedTouches[i];
        var x = touch.clientX/app.view.clientWidth*APP_WIDTH;
        var y = touch.clientY/app.view.clientHeight*APP_HEIGHT;
        var id = touch.identifier;
        bufx[id] = x;
        var lane = LNMemory[id];
        var inputLane = noteList[lane];
        if(inputLane.length!=0){
            if(inputLane[0].longType==2&&inputLane[0].noteType<2){
                var diff = Math.abs(inputLane[0].time-music.getTime());
                if(diff<JadgeTime.perfect){
                    //perfect
                    tapSE.play();
                    //judge.play(0);
                    LNflag[lane] = false;
                    combo++;
                    inputLane[0].destroy();
                    inputLane.shift();
                }else if(diff<JadgeTime.great){
                    //great
                    tapSE.play();
                    //judge.play(1);
                    LNflag[lane] = false;
                    combo++;
                    inputLane[0].destroy();
                    inputLane.shift();
                }else if(diff<JadgeTime.good){
                    //good
                    tapSE.play();
                    //judge.play(2);
                    LNflag[lane] = false;
                    combo = 0;
                    inputLane[0].destroy();
                    inputLane.shift();
                }else if(diff<JadgeTime.bad){
                    //bad
                    tapSE.play();
                    //judge.play(3);
                    LNflag[lane] = false;
                    combo = 0;
                    inputLane[0].destroy();
                    inputLane.shift();
                }   
            }
        }
        if(LNflag[lane]){
            combo = 0;
            //judge.play(4);
            LNflag[lane] = false;
            inputLane[0].destroy();
            inputLane.shift();
        }
    }
}

function onMove(e){
    for(var i=e.touches.length;i--;){
        var touch = e.touches[i];
        var x = touch.clientX/app.view.clientWidth*APP_WIDTH;
        var y = touch.clientY/app.view.clientHeight*APP_HEIGHT;
        var id = touch.identifier;
        var dir = -1;
        var sub = x - bufx[id];
        if(sub<-15){
            dir = 2;
            bufx[id] = x;
        }else if(sub>15){
            dir = 3;
            bufx[id] = x;
        }

        var lane = InputManager.XtoLane(x);
        var inputLane = noteList[lane];
        if(inputLane.length!=0){
            if(inputLane[0].noteType==dir){
                var diff = Math.abs(inputLane[0].time-music.getTime());
                if(diff<JadgeTime.bad){
                    if(inputLane[0].longType==2)LNflag[lane] = false;
                    flickSE.play();
                    //judge.play(0);
                    combo++;
                    inputLane[0].destroy();
                    inputLane.shift();
                }   
            }
        }   
    }
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
    clientWidth = app.view.clientWidth;
    clientHeight = app.view.clientWidth;
}
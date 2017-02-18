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

var Note = function(time,startPos,finishPos,noteType,longType,groupID,texture){
    var anchorList = [0.5,0.5,0.6,0.4];
    this.time = time;
    this.startPos = startPos;
    this.finishPos = finishPos;
    this.noteType = noteType;
    this.longType = longType;
    this.groupID = groupID;

    this.isStarted = false;
    this.isDestroy = false;

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.visible = false;
    this.sprite.anchor.set(anchorList[noteType],0.5);
    this.sprite.x = NoteManager.getNotePositionX(0,this.startPos,this.finishPos);
    this.sprite.y = NoteManager.getNotePositionY(0);
    this.t = 0;
    this.scale = 0;
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
        }
        if(this.isStarted){
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
    this.mesh.visible = false;
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
            this.mesh.visible = true;
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

var FlickMesh = function(beginNote,endNote,texture){
    var verts = new Float32Array(2*4);
    var uvs = new Float32Array([0,0,1,0,0,1,1,1]);
    var triangles = new Uint16Array(6);
    for(var i=0;i<2;i++){
        triangles[i*3] = i;
        triangles[i*3+1] = i+1;
        triangles[i*3+2] = i+2;
    }
    this.mesh = new PIXI.mesh.Mesh(texture,verts, uvs, triangles, PIXI.mesh.Mesh.DRAW_MODES.TRIANGLES);
    this.mesh.visible = false;
    this.beginNote = beginNote;
    this.endNote = endNote;
}

FlickMesh.prototype = {
    setVertex:function(){
        var x0 = this.beginNote.sprite.x;
        var y0 = this.beginNote.sprite.y;
        var x1 = this.endNote.sprite.x;
        var y1 = this.endNote.sprite.y;
        var height0 = this.beginNote.scale*40;
        var height1 = this.endNote.scale*40;

        this.mesh.vertices[0] = x0;
        this.mesh.vertices[1] = y0-height0/2;

        this.mesh.vertices[2] = x0;
        this.mesh.vertices[3] = y0+height0/2;

        this.mesh.vertices[4] = x1;
        this.mesh.vertices[5] = y1-height1/2;

        this.mesh.vertices[6] = x1;
        this.mesh.vertices[7] = y1+height1/2;
    },
    update:function(){
        if(this.beginNote.isStarted){
            this.mesh.visible = true;
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

var Line = function(beginNote,endNote,texture){
    var verts = new Float32Array(2*4);
    var uvs = new Float32Array([0,0,1,0,0,1,1,1]);
    var triangles = new Uint16Array(6);
    for(var i=0;i<2;i++){
        triangles[i*3] = i;
        triangles[i*3+1] = i+1;
        triangles[i*3+2] = i+2;
    }
    this.mesh = new PIXI.mesh.Mesh(texture,verts, uvs, triangles, PIXI.mesh.Mesh.DRAW_MODES.TRIANGLES);
    this.mesh.visible = false;
    this.beginNote = beginNote;
    this.endNote = endNote;
}

Line.prototype = {
    setVertex:function(){
        var x0 = this.beginNote.sprite.x;
        var x1 = this.endNote.sprite.x;
        var y = this.beginNote.sprite.y;
        var height = this.beginNote.scale*10;

        this.mesh.vertices[0] = x0
        this.mesh.vertices[1] = y-height/2;

        this.mesh.vertices[2] = x1
        this.mesh.vertices[3] = y-height/2;

        this.mesh.vertices[4] = x0
        this.mesh.vertices[5] = y+height/2;

        this.mesh.vertices[6] = x1
        this.mesh.vertices[7] = y+height/2;
    },
    update:function(){
        if(this.beginNote.isStarted){
            this.mesh.visible = true;
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


var JudgeDrawer = function (texture){
    this.frame = 0;
    this.duration = 30;
    this.isStart = false;
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.position.set(480,350);
    this.sprite.anchor.set(0.5);
    this.sprite.visible = false;
};

JudgeDrawer.prototype = {
    play:function(judge){
        this.frame = 0;
        this.isStart = true;
        this.sprite.texture.frame = new PIXI.Rectangle(0,74*judge,324,74);
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
    },
    addChild:function(){
        app.stage.addChild(this.sprite);
    }
};

var ComboManager = {
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
    maxCombo:0,
    combo:0,
    addCombo:function(){
        this.combo++;
        if(this.maxCombo<this.combo){
            this.maxCombo = this.combo;
        }
    },
    resetCombo:function(){
        this.combo = 0;
    }
};

var ComboDrawer = function(texture,textureNum){
    this.renderTexture = PIXI.RenderTexture.create(264, 140);
    this.sprite = new PIXI.Sprite(this.renderTexture);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(800,130);
    this.spriteText = new PIXI.Sprite(texture);
    this.spriteText.anchor.set(0.5);
    this.spriteText.position.set(132,110);
    this.spriteNum = new PIXI.Sprite(textureNum);
    this.spriteNum.anchor.set(0.5);
    this.emptyObject = new PIXI.DisplayObject();
}

ComboDrawer.prototype = {
    comboBuffer:0,
    update:function (){
        //コンボ数に変化がある場合のみ処理
        if(ComboManager.combo!=this.comboBuffer){
            var digits = ComboManager.num2digits(ComboManager.combo);
            var positions = ComboManager.digitNum2x(digits.length);
            //テクスチャのクリア
            app.renderer.render(this.emptyObject, this.renderTexture,true);
            if(ComboManager.combo!=0){
                app.renderer.render(this.spriteText, this.renderTexture,false);
                for(var i=0;i<digits.length;i++){
                    this.spriteNum.texture.frame = new PIXI.Rectangle(66*digits[i],0,66,85);
                    this.spriteNum.position.set(positions[i]+132, 43);
                    app.renderer.render(this.spriteNum, this.renderTexture,false);   
                }   
            }
            this.comboBuffer = ComboManager.combo;
        }
    },
    addChild:function(){
        app.stage.addChild(this.sprite);
    }
}

var ResultDisplay = function(texture){
    this.sprite = new PIXI.Sprite(texture);
}

ResultDisplay.prototype = {
    isShow:false,
    show:function(){
    this.isShow = true; 
        var title = new PIXI.Text(MUSIC_TITLE, {
            fontFamily: 'Arial',
            fontSize: 25,
            fontWeight:'bold', 
            fill: 'black',
        });
        title.position.set(160,125);
        
        var resultText = 
            judge.perfect + "\n" + 
            judge.great + "\n" + 
            judge.good + "\n" + 
            judge.bad + "\n" + 
            judge.miss;
        var result = new PIXI.Text(resultText, {
            fontFamily: 'Arial',
            fontSize: 28,
            fontWeight:'bold', 
            fill: 'black',
            align:'right'
        });
        result.anchor.set(1);
        result.position.set(410,348);
        
        var combo = new PIXI.Text(""+ComboManager.maxCombo, {
            fontFamily: 'Arial',
            fontSize: 40,
            fontWeight:'bold', 
            fill: 'black',
            align:'right'
        });
        combo.anchor.set(1);
        combo.position.set(410,398);
        
        app.stage.addChild(this.sprite);
        app.stage.addChild(title);
        app.stage.addChild(result);
        app.stage.addChild(combo);
    }
}


var WaitDisplay = function(){
    this.text = new PIXI.Text("Touch to Start", {
        fontFamily: 'Arial',
        fontSize: 50,
        fontWeight:'bold', 
        fill: 'white',
        align:'center'
    });
    this.text.anchor.set(0.5);
    this.text.position.set(480,270);
}

WaitDisplay.prototype = {
    isShow:false,
    show:function(){
        this.isShow = true;
        app.stage.addChild(this.text);
    },
    destroy:function(){
        this.isShow = false;
        app.stage.removeChild(this.text);
    }
}



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

onResize();
window.onresize = onResize;

PIXI.loaders.Resource.setExtensionXhrType("mp3", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("mp3", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionXhrType("ogg", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("ogg", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionXhrType("wav", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType("wav", PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);

PIXI.loader
    .add('json_map', "beatmap/"+MAP_FILENAME)
    .load(onMapLoaded);

function onMapLoaded(loader,res){
    NoteManager.speed = SpeedManager.getNoteUseTime(res['json_map'].data.speed);
    MUSIC_TITLE = res['json_map'].data.title;
    loader
        .add('tex_back', 'asset/image/release_bg.png')
        .add('tex_tap', 'asset/image/tap.png')
        .add('tex_long', 'asset/image/long.png')
        .add('tex_flick0', 'asset/image/Lflick.png')
        .add('tex_flick1', 'asset/image/Rflick.png')
        .add('tex_bg', 'asset/image/release_bg.png')
        .add('tex_none', 'asset/image/none.bmp')
        .add('tex_line', 'asset/image/line.png')
        .add('tex_judge', 'asset/image/judge.png')
        .add('tex_combo', 'asset/image/combo.png')
        .add('tex_combonum', 'asset/image/combo_number.png')
        .add('tex_result', 'asset/image/result_c.png')
        .add('audio_perfect', "asset/sound/perfect.mp3")
        .add('audio_flick', "asset/sound/flick.mp3")
        .add('audio_music', "music/"+res['json_map'].data.music)
        .load(onAssetsLoaded);
}

//Audio
var music;
var tapSE;
var flickSE;

//Sprite,Mesh
var noteList = [[],[],[],[],[]];
var longMeshList = [];
var flickMeshList = [];
var lineList = [];
var judgeDrawer;
var comboDrawer;

var resultDisplay;
var waitDisplay;

var judge = {
    perfect:0,
    great:0,
    good:0,
    bad:0,
    miss:0
}

var MUSIC_TITLE = "";

var LNflag = [false,false,false,false,false];

function onAssetsLoaded(loader, res) 
{
    app.stage.visible = false;
    //画面生成
    var bg = new PIXI.Sprite(res['tex_bg'].texture);
    app.stage.addChild(bg);

    judgeDrawer = new JudgeDrawer(res['tex_judge'].texture);
    judgeDrawer.addChild();
    
    comboDrawer = new ComboDrawer(res['tex_combo'].texture,res['tex_combonum'].texture);
    comboDrawer.addChild();
    
    resultDisplay = new ResultDisplay(res['tex_result'].texture);
    waitDisplay = new WaitDisplay();

    var longBuf = [false,false,false,false,false];
    var beatmap = loader.resources['json_map'].data;
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
        noteList[beatmap.notes[i].finish-1].push(new Note(beatmap.notes[i].time*1000+beatmap.offset*1000,beatmap.notes[i].start,beatmap.notes[i].finish,beatmap.notes[i].type,lnType,beatmap.notes[i].group,res[typeList[lnType==2&&beatmap.notes[i].type==0?1:beatmap.notes[i].type]].texture));   
    }
    
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
    
    var noteListBuf = [];
    for(var i=5;i--;){
        noteListBuf = noteListBuf.concat(noteList[i]);
    }
    //同タイミングを接続
    noteListBuf.sort(function(a,b){
        if(a.time < b.time) return -1;
        if(a.time > b.time) return 1;
        return 0;
    });
    for(var i=0;i<noteListBuf.length-1;i++){
        if(noteListBuf[i].time==noteListBuf[i+1].time){
            lineList.push(new Line(noteListBuf[i],noteListBuf[i+1],res['tex_line'].texture));
        }
    }
    //同グループを接続
    noteListBuf.sort(function(a,b){
        if(a.groupID < b.groupID) return -1;
        if(a.groupID > b.groupID) return 1;
        if(a.time < b.time) return -1;
        if(a.time > b.time) return 1;
        return 0;
    });
    for(var i=0;i<noteListBuf.length-1;i++){
        if(noteListBuf[i].groupID!=0&&noteListBuf[i].groupID==noteListBuf[i+1].groupID){
            flickMeshList.push(new FlickMesh(noteListBuf[i],noteListBuf[i+1],res['tex_none'].texture));
        }
    }
    
    //順番に追加
    for(var i=longMeshList.length;i--;){
        longMeshList[i].addChild();
    }
    for(var i=flickMeshList.length;i--;){
        flickMeshList[i].addChild();
    }
    for(var i=lineList.length;i--;){
        lineList[i].addChild();
    }
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

    app.view.addEventListener("touchstart",onFingerDown);
    app.view.addEventListener("touchmove",onFingerMove);
    app.view.addEventListener("touchend",onFingerUp);
    app.view.addEventListener("mousedown",onMouseDown);
    app.view.addEventListener("mousemove",onMouseMove);
    app.view.addEventListener("mouseup",onMouseUp);
    
    //ロード画面消去
    document.body.removeChild(document.getElementById("loading"));
    app.stage.visible = true;

    waitDisplay.show();
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
                ComboManager.resetCombo();
                judgeDrawer.play(4);
                judge.miss++;
                noteList[i][0].destroy();
                noteList[i].shift();
            }
        }
        for(var j=noteList[i].length;j--;){
            noteList[i][j].update(music.getTime());
        }
    }
    
    //頂点位置を更新
    for(var i=longMeshList.length;i--;){
        longMeshList[i].update();
        if(longMeshList[i].endNote.isDestroy){
            longMeshList[i].destroy();
            longMeshList.splice(i,1);
        }
    }
    
    for(var i=lineList.length;i--;){
        lineList[i].update();
        if(lineList[i].beginNote.isDestroy||lineList[i].endNote.isDestroy){
            lineList[i].destroy();
            lineList.splice(i,1);
        }
    }
    
    for(var i=flickMeshList.length;i--;){
        flickMeshList[i].update();
        if(flickMeshList[i].beginNote.isDestroy||flickMeshList[i].endNote.isDestroy){
            flickMeshList[i].destroy();
            flickMeshList.splice(i,1);
        }
    }
    
    judgeDrawer.update();
    comboDrawer.update();
    
    if(music.getIsEnd()&&!resultDisplay.isShow){
        resultDisplay.show();
    }
    
    app.renderer.render(app.stage);
    requestAnimationFrame(update);
}


function onMouseDown(e){
    onDown(e.clientX/app.view.clientWidth*APP_WIDTH,0);
}

function onMouseUp(e){
    onUp(e.clientX/app.view.clientWidth*APP_WIDTH,0);
}

function onMouseMove(e){
    if((e.buttons & 0x0001) ? true : false)onMove(e.clientX/app.view.clientWidth*APP_WIDTH,0);
}

function onFingerDown(e){
    if(waitDisplay.isShow){
        waitDisplay.destroy();
        music.play();
    }
    for(var i=e.touches.length;i--;){
        var touch = e.touches[i];
        var x = touch.clientX/app.view.clientWidth*APP_WIDTH;
        //var y = touch.clientY/app.view.clientHeight*APP_HEIGHT;
        var id = touch.identifier;
        onDown(x,id);
    }
}

function onFingerUp(e){
    for(var i=e.changedTouches.length;i--;){
        var touch = e.changedTouches[i];
        var x = touch.clientX/app.view.clientWidth*APP_WIDTH;
        //var y = touch.clientY/app.view.clientHeight*APP_HEIGHT;
        var id = touch.identifier;
        onUp(x,id);
    }
}

function onFingerMove(e){
    for(var i=e.touches.length;i--;){
        var touch = e.touches[i];
        var x = touch.clientX/app.view.clientWidth*APP_WIDTH;
        //var y = touch.clientY/app.view.clientHeight*APP_HEIGHT;
        var id = touch.identifier;
        onMove(x,id);
    }
}

function onDown(x,id){
    if(waitDisplay.isShow){
        waitDisplay.destroy();
        music.play();
    }
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
                judgeDrawer.play(0);
                judge.perfect++;
                if(inputLane[0].longType==1)LNflag[lane] = true;
                ComboManager.addCombo();
                inputLane[0].destroy();
                inputLane.shift();
            }else if(diff<JadgeTime.great){
                //great
                tapSE.play();
                judgeDrawer.play(1);
                judge.great++;
                if(inputLane[0].longType==1)LNflag[lane] = true;
                ComboManager.addCombo();
                inputLane[0].destroy();
                inputLane.shift();
            }else if(diff<JadgeTime.good){
                //good
                tapSE.play();
                judgeDrawer.play(2);
                judge.good++;
                if(inputLane[0].longType==1)LNflag[lane] = true;
                ComboManager.resetCombo();
                inputLane[0].destroy();
                inputLane.shift();
            }else if(diff<JadgeTime.bad){
                //bad
                tapSE.play();
                judgeDrawer.play(3);
                judge.bad++;
                if(inputLane[0].longType==1)LNflag[lane] = true;
                ComboManager.resetCombo();
                inputLane[0].destroy();
                inputLane.shift();
            }   
        }
    }
}

function onUp(x,id){
    bufx[id] = x;
    var lane = LNMemory[id];
    var inputLane = noteList[lane];
    if(inputLane.length!=0){
        if(inputLane[0].longType==2&&inputLane[0].noteType<2){
            var diff = Math.abs(inputLane[0].time-music.getTime());
            if(diff<JadgeTime.perfect){
                //perfect
                tapSE.play();
                judgeDrawer.play(0);
                judge.perfect++;
                LNflag[lane] = false;
                ComboManager.addCombo();
                inputLane[0].destroy();
                inputLane.shift();
            }else if(diff<JadgeTime.great){
                //great
                tapSE.play();
                judgeDrawer.play(1);
                judge.great++;
                LNflag[lane] = false;
                ComboManager.addCombo();
                inputLane[0].destroy();
                inputLane.shift();
            }else if(diff<JadgeTime.good){
                //good
                tapSE.play();
                judgeDrawer.play(2);
                judge.good++;
                LNflag[lane] = false;
                ComboManager.resetCombo();
                inputLane[0].destroy();
                inputLane.shift();
            }else if(diff<JadgeTime.bad){
                //bad
                tapSE.play();
                judgeDrawer.play(3);
                judge.bad++;
                LNflag[lane] = false;
                ComboManager.resetCombo();
                inputLane[0].destroy();
                inputLane.shift();
            }   
        }
    }
    if(LNflag[lane]){
        ComboManager.resetCombo();
        judgeDrawer.play(4);
        judge.miss++;
        LNflag[lane] = false;
        inputLane[0].destroy();
        inputLane.shift();
    }
}


function onMove(x,id){
    var dir = -1;
    var sub = x - bufx[id];

    var lane = InputManager.XtoLane(bufx[id]);

    if(sub<-15){
        dir = 2;
        bufx[id] = x;
    }else if(sub>15){
        dir = 3;
        bufx[id] = x;
    }

    var inputLane = noteList[lane];
    if(inputLane.length!=0){
        if(inputLane[0].noteType==dir){
            var diff = Math.abs(inputLane[0].time-music.getTime());
            if(diff<JadgeTime.bad){
                if(inputLane[0].longType==2)LNflag[lane] = false;
                flickSE.play();
                judgeDrawer.play(0);
                judge.perfect++;
                ComboManager.addCombo();
                inputLane[0].destroy();
                inputLane.shift();
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
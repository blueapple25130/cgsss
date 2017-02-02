window.AudioContext = window.AudioContext || window.webkitAudioContext;
var Sound = {};
Sound.context = new AudioContext();
Sound.id = {};

Sound.load = function (name, url) {
	var buffer;
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	request.send();
	request.onload = function () {
    	Sound.context.decodeAudioData(request.response, function (buffer) {
    	Sound.id[name]=buffer;
    	});
	};
};

Sound.play = function (name) {
	var source = Sound.context.createBufferSource();
	source.buffer = Sound.id[name];
	source.connect(Sound.context.destination);
	source.start(0);
}
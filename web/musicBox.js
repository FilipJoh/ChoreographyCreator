console.log("start");

// Cache references to DOM elements. From howler example
var elms = ['playBtn', 'pauseBtn', 'stopBtn', 'saveBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

// function constructor for player, the class containing the howler instance and playback functions
var player = function(){
  this.test = 0;
  this.sound = null;
  this.playId = null;
  this.pauseTime = null;
  this.visual = WaveSurfer.create({
      container: '#waveform',
      scrollParent: true,
      plugins: [
       WaveSurfer.regions.create({})
     ]
  });
};
player.prototype = {
  playMusic: function() {
    this.sound = new Howl({
        src: ["../data/Rasputin.mp3"],
        html5: true
    });

    //this.visual.load("../data/Rasputin.mp3")
    //this.playId = this.sound.play();
    if (this.pauseTime != null) {
      this.sound.seek(this.pauseTime, this.playId);
    }
    this.visual.play();
    this.visual.addRegion(id = "test", start = 0.0, end = 10.0)
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
  },

  pauseMusic: function() {
    if (this.sound != null) {
      //this.sound.pause();
      this.visual.pause();
      this.pauseTime = this.sound.seek(this.playId);
      pauseBtn.style.display = 'none';
      playBtn.style.display = 'block';
      console.log(this.pauseTime.toString());
    }
  },

  stopMusic: function() {
    if (this.sound != null) {
      console.log("sound is something");
      console.log((this.sound.playing()).toString());
      this.sound.stop();
      pauseBtn.style.display = 'none'
      playBtn.style.display = 'block'
      this.pauseTime = 0;
    } else {
      console.log("sound is null");
    }
    this.visual.stop();
    console.log("Current regions:");
    for (var index = 0; this.visual.regions.list.length; index++ )
    {
      console.log(this.visual.regions.list[index].id.toString());
    }
  }
};

// actual object creation
var player = new player();

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.playMusic();
  //wavesurfer.load('../data/Rasputin.mp3');

  //wavesurfer.play();
});
pauseBtn.addEventListener('click', function() {
  player.pauseMusic();
});
stopBtn.addEventListener('click', function() {
  player.stopMusic('prev');
});
/*nextBtn.addEventListener('click', function() {
  player.skip('next');
});*/

// Once the user loads a file in the fileinput, the file should be loaded into waveform
    document.getElementById("fileinput").addEventListener('change', function(e){
        var file = this.files[0];

        if (file) {
            var reader = new FileReader();

            reader.onload = function (evt) {
                // Create a Blob providing as first argument a typed array with the file buffer
                var blob = new window.Blob([new Uint8Array(evt.target.result)]);

                // Load the blob into Wavesurfer
                player.visual.loadBlob(blob);
            };

            reader.onerror = function (evt) {
                console.error("An error ocurred reading the file: ", evt);
            };

            // Read File as an ArrayBuffer
            reader.readAsArrayBuffer(file);
        }
    }, false);

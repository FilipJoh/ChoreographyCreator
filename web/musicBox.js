console.log("start");

// Cache references to DOM elements. From howler example
var elms = ['playBtn', 'pauseBtn', 'stopBtn', 'saveBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

// function constructor for player, the class containing the howler instance and playback functions
var player = function(){
  this.test = 0;
  this.regCounter = 0;
  this.sound = null;
  this.playId = null;
  this.pauseTime = null;
  this.visual = WaveSurfer.create({
      container: '#waveform',
      scrollParent: true,
      //hideScrollbar: true,
      plugins: [
       WaveSurfer.regions.create()
     ]
  });

  that = this
  // Event capture for region stuff, using anonumous function now
  this.visual.on('region-created', function(region) {
    console.log("region created!!");

    that.regCounter++;
    region.id = region.id.concat((that.regCounter).toString());
  })

  this.visual.on('region-mouseenter', function(region) {
    console.log("entered region: %s", region.id)
  })

  this.visual.addRegion({id: "test_", start: 0, end: 30, color: "rgba(255.0, 0.0, 0.0, 0.5)"});
  this.visual.enableDragSelection({id: "test_2_", color: "rgba(255.0, 0.0, 0.0, 0.8)"});

};
player.prototype = {
  playMusic: function() {
    this.visual.play();

    playBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
  },

  pauseMusic: function() {
    this.visual.pause();
    pauseBtn.style.display = 'none';
    playBtn.style.display = 'block';
  },

  stopMusic: function() {
    pauseBtn.style.display = 'none'
    playBtn.style.display = 'block'
    this.visual.stop();
  }
};

// actual object creation
var player = new player();

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.playMusic();
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

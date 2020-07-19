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
};
player.prototype = {
  playMusic: function() {
    this.sound = new Howl({
        src: ["../data/Rasputin.mp3"],
        html5: true
    });
    this.playId = this.sound.play();
    if (this.pauseTime != null) {
      this.sound.seek(this.pauseTime, this.playId);
    }

    playBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
  },

  pauseMusic: function() {
    if (this.sound != null) {
      this.sound.pause();
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
  }
};

// actual ovject creation
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

console.log("start");

// Cache references to DOM elements. From howler example
var elms = ['playBtn', 'pauseBtn', 'stopBtn', 'saveBtn', 'waveform'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

var regionColor;
var isDragEnabled = false;

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
    regionColor = region.color;
    region.color = "rgba(0.0, 0.0, 255.0, 0.5)";
    region.update({});
  })

  this.visual.on('region-mouseleave', function(region) {
    region.color = regionColor;
    region.update({});
  })

  // Double clicking on a region opens up a text input
  this.visual.on('region-dblclick', function(region) {
    region.update({drag: true, resize:true})

    console.log("Generate textform at region: %s", region.id)
    var input = document.createElement("INPUT");
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'textInput');
    input.addEventListener("keydown", function(event) {
        if(event.keyCode == 13) {
          console.log("pressed enter in textbox!");

          // Add label
          region.attributes.label = input.value;
          region.color =  "rgba(255.0, 35.0, 255.0, 0.5)";
          region.update({drag: false, resize: false});

          var textElem = document.createElement("span");
          textElem.appendChild(document.createTextNode(input.value));
          textElem.style.color = "white";
          document.getElementById("waveform").appendChild(textElem);

          document.getElementById("waveform").removeChild(input);
        }
    })

    if (!document.getElementById('textInput')) {
      console.log("no inputtext found");
      document.getElementById("waveform").appendChild(input);
      input.value = region.attributes.label;
    }
  })

  /*this.visual.addEventListener("keydown", function(event) {
    if (event.ctrlKey){
      this.visual.enableDragSelection({id: "test_2_", color: "rgba(255.0, 0.0, 0.0, 0.8)"});
      console.log("drag selection enabled");
    }
  })

  this.visual.addEventListener("keyup", function(event) {
    if (event.ctrlKey){
      this.visual.disableDragSelection();
      console.log("drag selection disabled");
    }
  })*/

  this.visual.addRegion({id: "test_", start: 0, end: 30, color: "rgba(255.0, 0.0, 0.0, 0.5)", attributes: { label: 'test'}});

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

document.addEventListener("keydown", function(event) {
  console.log("keypress detected");
  if (event.keyCode == 17 && !isDragEnabled){
    player.visual.enableDragSelection({id: "test_2_", color: "rgba(255.0, 0.0, 0.0, 0.8)", drag:true, resize: true});
    console.log("drag selection enabled");
    isDragEnabled = true;
  }
})

document.addEventListener("keyup", function(event) {
  if (event.keyCode == 17){
    //player.visual.regions.update({drag: false, resize: false})
    player.visual.disableDragSelection({drag: false, resize: false});
    console.log("drag selection disabled");
    isDragEnabled = false;
  }
})


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

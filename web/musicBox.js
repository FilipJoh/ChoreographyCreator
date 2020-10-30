console.log("start");

// Cache references to DOM elements. From howler example
var elms = ['playBtn', 'pauseBtn', 'stopBtn', 'saveBtn', 'waveform'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

var regionColor;
var isDragEnabled = false;
var resizeColor = "rgba(0.0, 0.0, 255.0, 0.5)"
var normalColor = "rgba(255.0, 0.0, 0.0, 0.8)"


// function constructor for player, the class containing the howler instance and playback functions
var player = function(){
  this.test = 0;
  this.regCounter = 0;
  this.sound = null;
  this.playId = null;
  this.pauseTime = null;
  this.textElem = null;
  this.visual = WaveSurfer.create({
      container: '#waveform',
      scrollParent: true,
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
    if(isDragEnabled) {
      regionColor = region.color;
      region.color = resizeColor;
      region.update({drag: true, resize: true});
    }
  })

  this.visual.on('region-mouseleave', function(region) {
    region.color = normalColor;
    if (!isDragEnabled) {
      region.update({drag: false, resize: false});
    }
    else {
      region.update({});
    }
    console.log("left region: %s", region.id)
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

          document.getElementById("annotationDescriptor").removeChild(input);
        }
    })

    var description = document.createElement("INPUT");
    description.setAttribute('type', 'text');
    description.setAttribute('id', 'descInput');
    description.addEventListener("keydown", function(event) {
        if(event.keyCode == 13) {
          console.log("pressed enter in 2nd textbox!");

          // Add label
          region.attributes.description = description.value;
          region.color =  "rgba(255.0, 35.0, 255.0, 0.5)";
          region.update({drag: false, resize: false});

          document.getElementById("annotationDescriptor").removeChild(description);
        }
    })

    if (!document.getElementById('textInput')) {
      console.log("no inputtext found");
      document.getElementById("annotationDescriptor").appendChild(input);
      document.getElementById("annotationDescriptor").appendChild(description);
      input.value = region.attributes.label;
      description.value = region.attributes.description;
    }
  })

  this.visual.on('region-in', function(region) {
    this.textElem = document.createElement("span")
    this.textElem.appendChild(document.createTextNode(region.attributes.description));
    this.textElem.style.color = "white";
    document.getElementById("annotationDescriptor").appendChild(this.textElem);
  });

  this.visual.on('region-out', function(region) {
    document.getElementById("annotationDescriptor").removeChild(this.textElem);
    this.textElem = null;
  });

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

document.addEventListener("keydown", play_pause_edit, true);

document.addEventListener("keyup", function(event) {
  if (event.keyCode == 17) {
    //player.visual.regions.update({drag: false, resize: false})
    player.visual.disableDragSelection({drag: false, resize: false});
    console.log("drag selection disabled");
    isDragEnabled = false;
    Object.keys(player.visual.regions.list).forEach(function (id) {
      var region = player.visual.regions.list[id];
      region.color = normalColor;
      region.update({drag: false, resize: false});
    })
  }
})

function play_pause_edit(event) {
  console.log("keypress detected");
  if (event.keyCode == 17 && !isDragEnabled){
    player.visual.enableDragSelection({id: "test_2_", color: "rgba(255.0, 0.0, 0.0, 0.8)", drag:true, resize: true});
    console.log("drag selection enabled");
    isDragEnabled = true;
  }

  var nodes = document.querySelectorAll('input[type=text]');
  var nodeRefToFind = document.activeElement
  var  foundParagraph = Array.from(nodes).find((node) => node === nodeRefToFind);

  if (event.keyCode == 32 && !foundParagraph) {
    console.log("space pressed");
    if (player.visual.isPlaying())
    {
      console.log("should pause")
      player.pauseMusic();
    }
    else
    {
      player.playMusic();
      console.log("Should play");
    }
  }
}

var size = 1;
var scaleStep = 1;
document.addEventListener('wheel',function(event){
    //mouseController.wheel(event);
    if (event.deltaY < 0){
      size -= scaleStep;
    }
    else {
      size += scaleStep;
    }
    console.log("mouse event triggered %f", size);
    player.visual.zoom(Number(size));
    return false;
    //event.preventDefault();
});

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

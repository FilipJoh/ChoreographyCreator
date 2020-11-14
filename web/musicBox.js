console.log("start");

// Cache references to DOM elements. From howler example
var elms = ['playBtn', 'pauseBtn', 'stopBtn', 'saveBtn', 'waveform'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

var regionColor;
var isDragEnabled = false;
var isRenameActive = false;
var resizeColor = "rgba(0.0, 0.0, 255.0, 0.5)"
var normalColor = "rgba(255.0, 0.0, 0.0, 0.8)"


// function constructor for player, the class containing the howler instance and playback functions
var player = function(){
  this.test = 0;
  this.regCounter = 0;
  this.sound = null;
  this.playId = null;
  this.pauseTime = null;
  this.descriptionTextId = 'descriptionText';
  this.regionLabelId = 'regionTitle';
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
    if (!isRenameActive)
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
    isRenameActive = true;
    region.color =  "rgba(255.0, 35.0, 255.0, 0.5)";
    region.update({drag: true, resize:true})

    console.log("Generate textform at region: %s", region.id)

    var regionTextCell = document.getElementById("Region_label");
    var descTextcell = document.getElementById("Description_label");

    var input = document.createElement("INPUT");
    input.setAttribute('type', 'text');
    input.setAttribute('id', player.regionLabelId);
    input.addEventListener("keydown", function(event) {
        if(event.keyCode == 13) {
          console.log("pressed enter in textbox!");

          // Add label and update region
          region.attributes.label = input.value;
          region.update({drag: false, resize: false});

          create_or_replace_element(regionTextCell, player.regionLabelId, input.value);
          isRenameActive = false;
        }
    })

    var description = document.createElement("textarea");
    //description.setAttribute('type', 'textarea');
    description.setAttribute('id', player.descriptionTextId);
    //description.setAttribute('rows', 5);
    //description.setAttribute('cols', 200);
    description.addEventListener("keydown", function(event) {
        if(event.keyCode == 13 && !event.shiftKey) {
          console.log("pressed enter in 2nd textbox!");

          // Add label and update region
          region.attributes.description = description.value;
          region.update({drag: false, resize: false});

          create_or_replace_element(descTextcell, player.descriptionTextId, description.value);
          isRenameActive = false;
        }
    })

    // handle replace or creation of region name input box
    var labelAtr = region.attributes.label;
    if (labelAtr != undefined)
       input.value = labelAtr;

    if(!document.getElementById(player.regionLabelId)) {
      console.log("created input-form");
      regionTextCell.appendChild(input);
    } else {
      regionTextCell.replaceChild(input, document.getElementById(player.regionLabelId));
    }

    // handle replace or creation of description input box
    descAtr = region.attributes.description;
    if (descAtr != undefined)
    {
      newLines = descAtr.split(/\r\n|\r|\n/).length
      description.setAttribute('rows', newLines)
      description.value = descAtr;
    }

    if(!document.getElementById(player.descriptionTextId)) {
      console.log("Should append");
      descTextcell.appendChild(description);
    } else {
      descTextcell.replaceChild(description, document.getElementById(player.descriptionTextId));
    }
  })

  this.visual.on('region-in', function(region) {
    if(document.querySelectorAll('input[type=text]').length==0)
    {
      if (region.attributes.label != undefined)
      {
        var parent = document.getElementById("Region_label");
        create_or_replace_element(parent, player.regionLabelId, region.attributes.label);
      }

      if (region.attributes.description != undefined)
      {
        var parent = document.getElementById("Description_label");
        create_or_replace_element(parent, player.descriptionTextId, region.attributes.description);
      }
    }
  });

  this.visual.on('region-out', function(region) {
    if (document.getElementById(player.descriptionTextId) && region.attributes.description == document.getElementById(player.descriptionTextId).innerText)
      document.getElementById("Description_label").removeChild(document.getElementById(player.descriptionTextId));
    if (document.getElementById(player.regionLabelId) && region.attributes.label == document.getElementById(player.regionLabelId).innerText)
      document.getElementById("Region_label").removeChild(document.getElementById(player.regionLabelId));
  });

  // update text if user seeks in another region
  this.visual.on('region-click', function(region)
  {
    if (document.getElementById(player.descriptionTextId))
      document.getElementById("Description_label").removeChild(document.getElementById(player.descriptionTextId));
    if (document.getElementById(player.regionLabelId))
      document.getElementById("Region_label").removeChild(document.getElementById(player.regionLabelId));

    if (region.attributes.label != undefined)
    {
      var parent = document.getElementById("Region_label");
      create_or_replace_element(parent, player.regionLabelId, region.attributes.label);
    }

    if (region.attributes.description != undefined)
    {
      var parent = document.getElementById("Description_label");
      create_or_replace_element(parent, player.descriptionTextId, region.attributes.description);
    }
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
  },

  ExportPlayList: function() {
    // JSON Object to store
    var exportData = {};
    var regions = [];

    var songName = (document.getElementById("fileinput").files[0].name).split('.').slice(0, -1).join('.');

    exportData.name = songName+"_Choreography";
    exportData.music = document.getElementById("fileinput").files[0].name;
    exportData.regions = regions;

    regList = this.visual.regions.list;
    for (const regItem of Object.entries(regList))
    {
      var region = {"id" : regItem[0],
                    "start": regItem[1].start,
                    "end": regItem[1].end,
                    "label": regItem[1].attributes.label,
                    "description" : regItem[1].attributes.description
                  };
      exportData.regions.push(region);
    }
    console.log(exportData);

    // Setup download
    var blob = new Blob([JSON.stringify(exportData)], {type: "application/json"});
    var url = URL.createObjectURL(blob);
    var domFile = document.createElement('a');
    domFile.download = (document.getElementById("fileinput").files[0].name).split('.').slice(0, -1).join('.')+"_Choreo.json";
    domFile.href = url;
    domFile.textContent = "Download n stuff"
    domFile.click();
    console.log(domFile.href);
    domFile.remove();
  }
};

// actual object creation
var player = new player();

document.addEventListener("keydown", play_pause_edit, true);

document.addEventListener("keyup", function(event) {
  if (event.keyCode == 17) {
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

  var foundParagraph = isActive('input[type=text]');

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

function isActive(nodeType)
{
  var nodes = document.querySelectorAll(nodeType);
  var nodeRefToFind = document.activeElement
  return Array.from(nodes).find((node) => node === nodeRefToFind);
}

function create_or_replace_element(parent, id, text)
{
  // Create element, set text and id
  textElem = document.createElement("P");
  textElem.innerHTML = text;
  //textElem.appendChild(document.createTextNode(text));
  textElem.setAttribute('id', id);

  // Replace or create child to parent
  if(document.getElementById(id))
  {
    parent.replaceChild(textElem, document.getElementById(id));
  } else {
    parent.appendChild(textElem);
  }
}

var size = 1;
var scaleStep = 1;

// Scroll zoom
document.getElementById("waveform").addEventListener('wheel',function(event){
    //mouseController.wheel(event);
    event.preventDefault();
    if (event.deltaY < 0){
      size -= scaleStep;
    }
    else {
      size += scaleStep;
    }

    if (size < 0)
      size = 0;
    console.log("mouse event triggered %f", size);
    player.visual.zoom(Number(size));
}, {passive: false});

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
saveBtn.addEventListener('click', function() {
  console.log("Save n' stuff");
  player.ExportPlayList();
});

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

document.getElementById("JSONinput").addEventListener('change', function(e){

  var file = this.files[0];
  console.log(file);
  if (file) {
    var reader = new FileReader();
    reader.onload = function (evt) {
      //console.log(JSON.parse(evt.target.result));
      var parsedInput = JSON.parse(evt.target.result);
      console.log(parsedInput);
      parsedInput.regions.forEach( function(region) {
        player.visual.addRegion({
          id: region.id,
          start: region.start,
          end: region.end,
          color: "rgba(255.0, 0.0, 0.0, 0.8)",
          attributes: {
            label: region.label,
            description: region.description
          }
        });
        console.log(region);
      });

      // Disable drag and scale for all regions
      Object.keys(player.visual.regions.list).forEach(function (id) {
        var region = player.visual.regions.list[id];
        region.color = normalColor;
        region.update({drag: false, resize: false});
      })

      // Check if the right music has been reloaded
      musicFile = document.getElementById("fileinput").files;
      if (musicFile.length != 0)
      {
        loadedMusic = document.getElementById("fileinput").files[0].name;
        if (loadedMusic != parsedInput.music)
          alert("Warning: " + loadedMusic + " does not match choreography record: " + parsedInput.music);
      } else {
          alert("Please load song: " + parsedInput.music);
      }
    }
    reader.readAsText(file)
  }
})

// Storage function
// Check if it is supported in your browser
function supports_html5_storage()
{
      try
      {
        return 'localStorage' in window && window['localStorage'] !== null;
      }
      catch (e)
      {
        return false;
      }
}

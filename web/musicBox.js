console.log("start");

// Cache references to DOM elements. From howler example
var elms = ['playBtn', 'pauseBtn', 'stopBtn', 'saveBtn', 'waveform'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

var regionColor;
var isDragEnabled = false;
var isRenameActive = false;
//var resizeColor = "rgba(0.0, 0.0, 255.0, 0.5)"
//var normalColor = "rgba(255.0, 0.0, 0.0, 0.8)"
var mp3_fileName;
var songBlob;
let playTimer = null; // holds any pending timeout


// function constructor for player, the class containing the wavesurfer instance and playback functions
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

  //################################################################
  // Event capture for region stuff, using anonumous function now
  //################################################################
  this.visual.on('region-created', function(region) {
    console.log("region created!!");

    that.regCounter++;
    region.id = region.id.concat((that.regCounter).toString());
  })

  this.visual.on('region-mouseenter', function(region) {
    console.log("entered region: %s", region.id)
    if(isDragEnabled) {
      //regionColor = region.color;
      //region.color = resizeColor;
      region.element.classList.add('hovered');
      region.update({drag: true, resize: true});
    }
  })

  this.visual.on('region-mouseleave', function(region) {
    if (!isRenameActive)
      //region.color = normalColor;
      region.element.classList.remove('hovered');
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
    description.setAttribute('id', player.descriptionTextId);
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

  //################################################################
  // END OF EVENT HANDLER CODE
  //################################################################

  //Make sure the pause btn is disabled at start
pauseBtn.style.display = 'none';
player.prototype = {
  
  playMusic: function() {
    if(document.getElementById('one').checked)
    {
      this.visual.play();
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else if (document.getElementById('two').checked) {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
      playSelection();
    }
  },

  pauseMusic: function() {
    this.visual.pause();
    pauseBtn.style.display = 'none';
    playBtn.style.display = 'block';

    // Cancel any scheduled replays
    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }
  },

  stopMusic: function() {
    pauseBtn.style.display = 'none'
    playBtn.style.display = 'block'
    this.visual.stop();

    // Cancel any scheduled replays
    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }
  },

  ExportPlayList: function() {
    var songName = (mp3_fileName).split('.').slice(0, -1);
    var url = URL.createObjectURL(regions_to_JSON(songName));
    var domFile = document.createElement('a');
    domFile.download = songName+"_Choreo.json";
    domFile.href = url;
    domFile.textContent = "Download n stuff"
    domFile.click();
    console.log(domFile.href);
    domFile.remove();
  },

  ZipAndExportPlayList: function() {
    var songName = (mp3_fileName).split('.').slice(0, -1);
    let zip = new JSZip();
    zip.file(songName+"_Choreo.json", regions_to_JSON(songName));
	
    zip.file(mp3_fileName, songBlob, {binary:true});
    zip.generateAsync({type: "blob"}).then(function(content) {
        saveAs(content, songName+".zip");
    });
  }
};

function regions_to_JSON(songName) {
  var exportData = {};
  var regions = [];

  exportData.name = songName+"_Choreography";
  exportData.music = mp3_fileName;
  exportData.regions = regions;

  regList = player.visual.regions.list;
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
  return new Blob([JSON.stringify(exportData)], {type: "application/json"});
}

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
      //region.color = normalColor;
      region.update({drag: false, resize: false});
    })
  }
})

function play_pause_edit(event) {
  console.log("keypress detected");

  if (event.keyCode == 17 && !isDragEnabled){
    player.visual.enableDragSelection({id: "Segment_", color: "rgba(255.0, 0.0, 0.0, 0.8)", drag:true, resize: true});
    console.log("drag selection enabled");
    isDragEnabled = true;
  }

  var foundParagraph = isActive('input[type=text]') || isActive('textarea');

  if (event.keyCode == 32 && !foundParagraph) {
    event.preventDefault();
    //console.log("space pressed");
    if (player.visual.isPlaying())
    {
      //console.log("should pause")
      player.pauseMusic();
    }
    else
    {
      player.playMusic();
      //console.log("Should play");
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
  textElem = document.createElement("Span");
  textElem.textContent = text;
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
  event.preventDefault();
  player.playMusic();
});

pauseBtn.addEventListener('click', function() {
  event.preventDefault();
  player.pauseMusic();
});

stopBtn.addEventListener('click', function() {
  event.preventDefault();
  player.stopMusic('prev');
});

saveBtn.addEventListener('click', function() {
  console.log("Save n' stuff");
  event.preventDefault();
  player.ZipAndExportPlayList();
});

loadExampleBtn.addEventListener('click', function() {
  console.log('Load example file');
  loadFromDrive();
})

document.getElementById("Choreoinput").addEventListener('change', function(f) {
  var zipFile = this.files[0];
  if (zipFile) {
    var zipFileReader = new FileReader();
    zipFileReader.onload = function(evt) {
      console.log(evt.target.result);
      console.log("inside loading func");
      JSZip.loadAsync(evt.target.result).then(function(unzippedFiles) {
        console.log(unzippedFiles.files);
        unzippedFiles.forEach(function (relativePath, zipEntry) {
          ext = relativePath.split('.').slice(-1).pop()
          console.log("relPath "+relativePath.split('.').slice(-1).pop());
          console.log(zipEntry);
          if (ext == "mp3") {
            unzippedFiles.files[relativePath].async('arraybuffer').then(function (fileData) {
               // These are your file contents
               console.log('inside of blob');
               var blob = new window.Blob([new Uint8Array(fileData)]);
               songBlob = blob;
               // Load the blob into Wavesurfer
               player.visual.loadBlob(blob);
               mp3_fileName = zipEntry.name;
            })
          }
          else {
            unzippedFiles.files[relativePath].async('text').then(function (fileData) {
              loadJSONdata(fileData, false);

              // set the current JSON file name for the fileinput

            })
          }
        });
      });
    };
    zipFileReader.readAsArrayBuffer(zipFile);
  }


  // check selected tab
  //GeneratePlaylist(f)

}, false);

async function loadFromDrive() {
  try {

    driveUrl = "https://drive.google.com/file/d/10n2Nk10LYZ3f670xSd1fQZr_8KpL38W6/view?usp=drive_link";
    // Extract the file ID from the shared link
    const proxyBase = '/.netlify/functions/fetchZip';
    const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      console.error("Invalid Google Drive URL");
      return;
    }
    const fileId = match[1];
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // Fetch via your proxy
    const response = await fetch(`${proxyBase}?url=${encodeURIComponent(directUrl)}`);
    if (!response.ok) throw new Error("Failed to fetch file from Drive");
    const arrayBuffer = await response.arrayBuffer();

    // Use JSZip as before
    const unzippedFiles = await JSZip.loadAsync(arrayBuffer);


    // Fetch the file as a blob
    //const response = await fetch(proxy + encodeURIComponent(driveFile));
    //if (!response.ok) throw new Error("Failed to fetch file from Drive");

    //const arrayBuffer = await response.arrayBuffer();

    // Load the zip file using JSZip
    //const unzippedFiles = await JSZip.loadAsync(arrayBuffer);
    console.log("Unzipped files:", unzippedFiles.files);

    for (const relativePath in unzippedFiles.files) {
      const zipEntry = unzippedFiles.files[relativePath];
      const ext = relativePath.split('.').pop().toLowerCase();

      if (ext === "mp3") {
        const fileData = await zipEntry.async("arraybuffer");
        const blob = new Blob([new Uint8Array(fileData)]);
        songBlob = blob;
        player.visual.loadBlob(blob);
        mp3_fileName = zipEntry.name;
        console.log("Loaded MP3:", zipEntry.name);
      } else if (ext === "json") {
        const fileData = await zipEntry.async("text");
        loadJSONdata(fileData, false);
        console.log("Loaded JSON:", zipEntry.name);
      } else {
        console.log("Ignoring file:", zipEntry.name);
      }
    }

  } catch (err) {
    console.error("Error loading from Drive:", err);
  }
}

// Once the user loads a file in the fileinput, the file should be loaded into waveform
document.getElementById("fileinput").addEventListener('change', function(e) {
    var file = this.files[0];

    if (file) {
        var reader = new FileReader();
        //reader.bindEvent('onload', loadMusic);
        reader.onload = loadMusic;
        reader.onerror = function (evt) {
            console.error("An error ocurred reading the file: ", evt);
        };

        // Read File as an ArrayBuffer
        reader.readAsArrayBuffer(file);
        mp3_fileName = this.files[0].name;
    }
}, false);

function loadMusic (evt) {
  var blob = new window.Blob([new Uint8Array(evt.target.result)]);
  //var song = new Audio(evt.target.name);
  songBlob = blob;
  
  // Load the blob into Wavesurfer
  player.visual.loadBlob(blob);
  //player.visual.load(song);
}

document.getElementById("JSONinput").addEventListener('change', function(e) {
  var file = this.files[0];
  console.log(file);
  if (file) {
    var reader = new FileReader();
    reader.onload = loadJSON;
    reader.readAsText(file);
  }
})

function loadJSON(evt) {
  loadJSONdata(evt.target.result, true);
}

function loadJSONdata(data, checkMusic) {
  var parsedInput = JSON.parse(data);
  console.log(parsedInput);
  parsedInput.regions.forEach( function(region) {
    player.visual.addRegion({
      id: region.id,
      start: region.start,
      end: region.end,
      //color: "rgba(255.0, 0.0, 0.0, 0.8)",
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
    //region.color = normalColor;
    region.update({drag: false, resize: false});
  })

  if (checkMusic)
  {
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

  GeneratePlaylist();
}

// Generate Checklist for all present regions
function GeneratePlaylist() {

  var playlistOptions = document.getElementById('plHolder')
  
  var playlist = Object.values(player.visual.regions.list) // Quickly sort to get coherent order in selection
  playlist.sort((a, b) => (a.start > b.start ? 1 : -1))

  
  for(var i = 0 ; i < playlist.length; i++) {
	var region = playlist[i];
	var chkbox = document.createElement('input');
    chkbox.setAttribute('type', 'checkbox');
    chkbox.setAttribute('id', region.id);
    chkbox.setAttribute('value', false);
    chkbox.setAttribute('name', region.attributes.label)

    //chkbox.setAttribute('id', 'chk_' + region.id);


    var lbl = document.createElement('label');
   //lbl.setAttribute('for', 'prodName' + region.id);
   // lbl.setAttribute('for', 'chk_' + region.id);
    lbl.appendChild(document.createTextNode(region.attributes.label));

    var container = document.createElement('div');
    container.setAttribute('type', 'segment');
    container.appendChild(chkbox);
    container.appendChild(lbl);

    playlistOptions.appendChild(container); 
  }
}

/*function playSelection() {
  const checkboxes = document.querySelectorAll("input[type=checkbox]:checked");
  if (checkboxes.length === 0) return;

  const regions_to_play = Array.from(checkboxes).map(cb => player.visual.regions.list[cb.id])
                                 .sort((a, b) => a.start - b.start);

  let index = 0;

  function playNext() {
    if (index >= regions_to_play.length) return;
    const region = regions_to_play[index];
    index++;
    player.visual.once('region-out', () => playNext());
    player.visual.play(region.start, region.end);
  }

  playNext();
}*/

function playSelection () {

    // Cancel any existing timer before starting a new run
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }

  // Collect pause input
  let pauseInput = document.getElementById("PauseTimeSeconds");
  let pauseTime = parseFloat(pauseInput.value) || 0; // in seconds

  // Collect options
  var checkboxes = document.querySelectorAll("input[type=checkbox]:checked");
  console.log(checkboxes);

  let regions_to_play = Array.from(checkboxes).map(cb => player.visual.regions.list[cb.id]);
  let num_regions = regions_to_play.length
  let curr = regions_to_play.shift();

  // Go through list of regions and play in chronologic order,
  // Utilizes audioprocess event
  function playListMode(time) {
    if (time > curr.end) {
      if (regions_to_play.length > 0) {
        curr = regions_to_play.shift();
        player.visual.play(curr.start);
      } else {
        // End reached: stop and cleanup
        player.visual.stop();
        player.visual.un('audioprocess', playListMode);

        // Schedule the next repeat
        playTimer = setTimeout(() => {
          playSelection(); // replay selection after pause
          playTimer = null; // clear reference
        }, pauseTime * 1000);
      }
    }
  }


  if (num_regions > 0) {
    player.visual.on('audioprocess', playListMode);
    player.visual.play(curr.start)
  } else {
    console.log("selection is empty!");
  }
}

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

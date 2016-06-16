var bar_color = "#ff0000";

(function () {

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var audioElement = document.getElementById('audioElement');
  var audioSrc = audioCtx.createMediaElementSource(audioElement);
  var analyser = audioCtx.createAnalyser();

  //Global variables of the local function
  var audio, volume, button, seeker, file, prev_button, next_button, replay, random;
  var song_index = 0;
  var soundtrack = [];
  var playlist = d3.select('#playlist').append('ul');

  function initialize(){
    audio = document.getElementById('audioElement');
    volume = document.getElementById('volumeSlider');
    button = document.getElementById('playButton');
    seeker = document.getElementById('musicSlider');
    file = document.getElementById('audio_file');
    prev_button = document.getElementById('prevSong');
    next_button = document.getElementById('nextSong');
    replay = document.getElementById('replayCheck');
    random = document.getElementById('randomCheck');

    audio.addEventListener('loadedmetadata', totalTime);
    audio.addEventListener('timeupdate',currentTime);
    audio.addEventListener('ended', playNext);
    next_button.addEventListener('click', playNext);
    prev_button.addEventListener('click', playPrev);
    seeker.addEventListener('input', seek)
    button.addEventListener('click', buttonEffect);
    volume.addEventListener('input', changeVolume);
    file.addEventListener('change', uploaded);
    window.addEventListener('dragenter', filesDrag);
    window.addEventListener('dragover', filesDrag);
    window.addEventListener('drop', filesDrop);
  }

  function filesDrag(evt){
    evt.stopPropagation();
    evt.preventDefault();
  }

  function songClicked(d, i){
    if(i == song_index){
      return;
    }

    d3.select(this).style("color","green");
    d3.select(".song"+song_index).style("color","black");
    audio.pause();
    song_index = i;

    var next_song = URL.createObjectURL(soundtrack[song_index]);
    audio.src = next_song;
    d3.select("#currentDuration").html("0:00");
    audio.play();
  }

  function updatePlayList(uploaded_files){

    for(i = 0; i < uploaded_files.length; i++){
      soundtrack.push(uploaded_files[i]);
    }

    soundtrack = _.uniq(soundtrack, function(d) { return d.name;});
  }

  function addPlayList(){

    var songs = playlist.selectAll('li')
            .data(soundtrack);

    songs.enter()
          .append('li')
          .attr('class', function(d,i) { return "song" + i.toString();})
          .html(function(d) { return d.name; })
          .on('mouseover', function() { d3.select(this).style("color","steelblue");})
          .on('mouseout', function(d,i) { 
            var color = (i == song_index) ? "green" : "black";
            d3.select(this).style("color",color);
          })
          .on('dblclick', songClicked);
  }

  function filesDrop(evt){

    evt.stopPropagation();
    evt.preventDefault();

    var uploaded_files = evt.dataTransfer.files;

    if(soundtrack.length === 0){

      var first_song = URL.createObjectURL(uploaded_files[song_index]);
      audio.src = first_song;
      audio.play();
      d3.select("#playButton").html("PAUSE");
    }

    updatePlayList(uploaded_files);

    addPlayList();  
    d3.select(".song0").style("color","green");

  }

  function seek(){
    var seek_to = audio.duration * (seeker.value/100);
    audio.currentTime = seek_to;
  }

  function changeVolume(){
    var currentVolume = d3.select("#volumeSlider").property("value");

    audio.volume = currentVolume/100;
  }

  function buttonEffect(){
    if(audio.paused){
      audio.play();
      d3.select("#playButton").html("PAUSE");
    } else {
      audio.pause();
      d3.select("#playButton").html("PLAY");
    }
  }

  function uploaded(){
    var files = this.files;
    var file = URL.createObjectURL(files[0]); 
    audioElement.src = file;
    audioElement.play();
    d3.select("#playButton").html("PAUSE"); 
  }

  function playPrev(){
    //audio.pause();
    //d3.select("#currentDuration").html("0:00");
    song_index--;

    if(song_index === -1){
      var last_song_index = soundtrack.length - 1;
      song_index = last_song_index;
    }

    var next_song = URL.createObjectURL(soundtrack[song_index]);
    audio.src = next_song;
    audio.play();
  }

  function playNext(evt){

    var trigger = evt.target.id;

    switch(trigger){
      case "nextSong": {
        console.log("NEXT SONG!");
        break;
      }
      case "prevSong": {
        console.log("PREV SONG!");
        break;
      }

      default: {
        console.log("SONG ENDED!");
        break;
      }
    }

    d3.select(".song"+song_index).style("color","black");

    song_index++;

    if(song_index === soundtrack.length){
      song_index = 0;
    }

    var next_song = URL.createObjectURL(soundtrack[song_index]);
    audio.src = next_song;
    audio.play();
    d3.select(".song"+song_index).style("color","green");
  }

  function currentTime(){
    var finished = audio.currentTime * (100/audio.duration);
    seeker.value = finished;

    var minutes = Math.floor(audio.currentTime / 60);
    var seconds = Math.floor(audio.currentTime - (minutes * 60));

    if (seconds < 10 ) { seconds = "0" + seconds; }

    var current_duration = minutes.toString() + ":" + seconds;

    d3.select("#currentDuration").html(current_duration);
  }

  function totalTime(){
    var minutes = Math.floor(audio.duration / 60);
    var seconds = Math.floor(audio.duration - (minutes * 60));

    if(seconds < 10) { seconds = "0" + seconds; }

    var total_duration = minutes.toString() + ":" + seconds;

    d3.select("#musicDuration").html(total_duration);
  }

  // Bind our analyser to the media element source.
  audioSrc.connect(analyser);
  audioSrc.connect(audioCtx.destination);

  var frequencyData = new Uint8Array(200);

  var svgHeight = '300';
  var svgWidth = '1200';
  var barPadding = '1';

  function createSvg(parent, height, width) {
    return d3.select(parent).append('svg').attr('height', height).attr('width', width);
  }

  var svg = createSvg('#graph', svgHeight, svgWidth);

  // Create our initial D3 chart.
  svg.selectAll('rect')
     .data(frequencyData)
     .enter()
     .append('rect')
     .attr('x', function (d, i) {
        return i * (svgWidth / frequencyData.length);
     })
     .attr('width', svgWidth / frequencyData.length - barPadding);

  // Continuously loop and update chart with frequency data.
  function renderChart() {
     requestAnimationFrame(renderChart);
      var colorScale = d3.scale.linear().domain([0,130,255]).range(["#808080",bar_color]);

     // Copy frequency data to frequencyData array.
     analyser.getByteFrequencyData(frequencyData);

     // Update d3 chart with new data.
     svg.selectAll('rect')
        .data(frequencyData)
        .attr('y', function(d) {
           return svgHeight - d;
        })
        .attr('height', function(d) {
           return d;
        })
        .attr('fill', function(d) {
           return colorScale(d);
        });
  }

  // Run the loop
  initialize();
  renderChart();

}());

//Set color of bars
function setBarColor(picker) {
    bar_color = '#' + picker.toString();
}

//Set color of body
function setBodyColor(picker) {
  var body_color = '#' + picker.toString();
  d3.select("body").style("background-color", body_color);
}
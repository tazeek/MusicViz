var bar_color = "#ff0000";

(function () {

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var audioElement = document.getElementById('audioElement');
  var audioSrc = audioCtx.createMediaElementSource(audioElement);
  var analyser = audioCtx.createAnalyser();

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

  var svg = createSvg('body', svgHeight, svgWidth);

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
  renderChart();

}());

function playPause(){
  var audio = document.getElementById('audioElement');

  if(audio.paused){
    audio.play();
    d3.select("#playButton").html("PAUSE");
  } else {
    audio.pause();
    d3.select("#playButton").html("PLAY");
  }
}

function setVolume(){
  var audio = document.getElementById('audioElement');
  var currentVolume = d3.select("#volumeSlider").property("value");

  audio.volume = currentVolume/100;
}

function setBarColor(picker) {
    bar_color = '#' + picker.toString();
}

function setBodyColor(picker) {
  var body_color = '#' + picker.toString();
  d3.select("body").style("background-color", body_color);
}

audio_file.onchange = function(){
    var files = this.files;
    var file = URL.createObjectURL(files[0]); 
    audioElement.src = file; 
};
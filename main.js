moment.locale('de');
var h1 = document.getElementsByTagName('time')[0],
bt_start = document.getElementById('start'),
bt_stop = document.getElementById('stop'),
bt_clear = document.getElementById('clear'),
startTime = null,running=false ,duration = moment.duration(0);

vars = {};
var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
});


function init(vars) {
  if (moment.isDuration(moment.duration(vars['d'])) & vars['t']==null & vars['r']=="0"){
    running=false;
    duration = moment.duration(vars['d']);
    show(duration);
    startTime = null;
  }
  if (vars['d']==null & moment(vars['t']).isValid() & vars['r']=="1"){
    running=true;
    startTime = moment(vars['t']);
    duration = null
    update()
  }
}

show(duration);
init(vars);

function update() {
  if (!running) {return}
    var now = moment(new Date());

  var dur = moment.duration(now.diff(startTime));
  show(dur);
  timer()
}
function timer() {
    t = setTimeout(update, 1000);
}

function show(dur) {
  var seconds = dur.seconds();
  var minutes = dur.minutes();
  var hours = Math.floor(dur.asHours());
  h1.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
}
// timer();

function start() {
  console.log('start');
  if (duration==null) {return}
  running=true;
  var now = moment(new Date());

  startTime = now.subtract(moment.duration(duration));
  duration = null

  var newURL = "/?r=1&t=" + startTime.format();
  window.history.replaceState(null, null, newURL);

  update()
}

function stop() {
  console.log('stop');
  if (startTime==null) {return}
  running=false;
  var now = moment(new Date());
  duration = moment.duration(now.diff(startTime));
  startTime = null;
  show(duration);

  var newURL = "/?r=0&d=" + duration.toISOString();
  window.history.replaceState(null, null, newURL);
}

function clear() {
  console.log('clear');
  running=false;
  startTime = null;
  duration = moment.duration(0);
  show(duration);

  var newURL = "/" ;
  window.history.replaceState(null, null, newURL);
}





function debug() {
  console.log('----------');
  console.log(running);
  console.log(startTime);
  console.log(duration);
  console.log('----------');
}


//start();


/* Start button */
bt_start.onclick = start;
/* Stop button */
bt_stop.onclick = stop;
/* Clear button */
bt_clear.onclick = clear;

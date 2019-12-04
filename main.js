moment.locale('de');
var h1_time = document.getElementsByTagName('time')[0];
var bt_toggle = document.getElementById('toggle');
var bt_clear = document.getElementById('clear');
var bt_plus = document.getElementById('plus');
var bt_minus = document.getElementById('minus');
var baseURL = '/';
var storage = 'state';
var debug = true;


function newstate(status) {
  if (debug) console.log('function: newstate, ', status);
  status = status || 'stopped';

  let newobj;
  switch (status) {
    case 'started':
      newobj = {
        currentstate: 'started',
        duration: null,
        startTime: moment()
      }
      break;
    case 'stopped':
      newobj = {
        currentstate: 'stopped',
        duration: moment.duration(0),
        startTime: null
      }
      break;
    default:
      console.error('Invalid input');
      return newstate()
  }

  return newobj
}

function log(obj) {
  let result = {};
  if (obj == null || obj.currentstate == null) return obj;
  result.currentstate = obj.currentstate;

  if (obj.startTime == null) {
    result.startTime = obj.startTime;
  } else if (obj.startTime.isValid()) {
    result.startTime = obj.startTime.format();
  } else {
    return obj;
  }

  if (obj.duration == null) {
    result.duration = obj.duration;
  } else if (moment.isDuration(obj.duration)) {
    result.duration = obj.duration.toISOString();
  } else {
    return obj;
  }

  return result
}

function isvalid(obj) {
  if (debug) console.log('function: isvalid, ', log(obj));
  if (obj == null || obj.currentstate == null) return false;
  switch (obj.currentstate) {
    case 'started':
      if (obj.startTime.isValid() & obj.duration == null) {
        if (obj.startTime > moment()) { // no negative for now
          console.error('negative startTime');
          return false
        }
        return true
      }
      break;
    case 'stopped':
      if (obj.startTime == null & moment.isDuration(obj.duration)) {
        if (obj.duration < 0) { // no negative for now
          console.error('negative duration');
          return false
        }
        return true
      }
      break;
    default:
      console.error('Invalid state');
      return false
  }
  return false
}

function copy(obj) {
  if (debug) console.log('function: copy, ', log(obj));
  return Object.assign({}, obj); //caution: just shallow copy
}

function format(obj) {
  if (debug) console.log('function: format, ', log(obj));
  let duration;

  switch (obj.currentstate) {
    case 'started':
      duration = moment.duration(moment().diff(obj.startTime));
      break;
    case 'stopped':
      duration = obj.duration;
      break;
    default:
      console.error('Invalid state');
      return '00:00:00'
  }

  function pretty(num) {
    return (num ? (num > 9 ? num : "0" + num) : "00");
  }

  return pretty(Math.floor(duration.asHours())) + ":" + pretty(duration.minutes()) + ":" + pretty(duration.seconds());
}

function save(obj) {
  if (debug) console.log('function: save, ', log(obj));
  window.localStorage.setItem(storage, JSON.stringify(state));
}

function stop(obj) {
  if (debug) console.log('function: stop, ', log(obj));
  let newobj;
  switch (obj.currentstate) {
    case 'started':
      newobj = newstate();
      newobj.duration = moment.duration(moment().diff(obj.startTime));
      newobj.startTime = null;
      newobj.currentstate = 'stopped';
      bt_toggle.innerText = 'start';
      save(newobj);
      break;
    case 'stopped':
      newobj = copy(obj);
      break;
    default:
      console.error('Invalid state');
      newobj = newstate();
  }
  return newobj
}

function start(obj) {
  if (debug) console.log('function: start, ', log(obj));
  let newobj;
  switch (obj.currentstate) {
    case 'started':
      newobj = copy(obj);
      break;
    case 'stopped':
      newobj = newstate();
      newobj.startTime = moment().subtract(obj.duration);
      newobj.duration = null;
      newobj.currentstate = 'started';
      bt_toggle.innerText = 'stop';
      save(newobj);
      break;
    default:
      console.error('Invalid state');
      newobj = newstate();
  }
  return newobj
}

function add(obj, number, unit) {
  if (debug) console.log('function: add, ', log(obj));
  unit = unit || '';
  let durationToAdd = moment.duration(number, unit);
  if (!moment.isDuration(durationToAdd)) {
    console.error('invalid duration to add');
    newobj = newstate();
    save(newobj);
    display(newobj);
    return newobj
  }

  let newobj;
  switch (obj.currentstate) {
    case 'started':
      newobj = newstate('started');
      newobj.startTime = obj.startTime.subtract(durationToAdd);
      break;
    case 'stopped':
      newobj = newstate('stopped');
      newobj.duration = obj.duration.add(durationToAdd);
      break;
    default:
      console.error('Invalid state');
      newobj = newstate();
  }

  if (!isvalid(newobj)) {
    console.error('Invalid state');
    newobj = newstate(obj.currentstate);
  }
  save(newobj);
  display(newobj);
  return newobj
}

function display(obj) {
  if (debug) console.log('function: display, ', log(obj));
  obj = obj || state;
  h1_time.textContent = format(obj);
}

function clear(obj) {
  if (debug) console.log('function: clear, ', log(obj));
  let newobj;
  switch (obj.currentstate) {
    case 'started':
      newobj = newstate('stopped');
      clearInterval(timer);
      if (debug) console.log('Interval clear');
      save(newobj);
      break;
    case 'stopped':
      newobj = newstate('stopped');
      save(newobj);
      break;
    default:
      console.error('Invalid state');
      newobj = newstate();
      save(newobj);
  }
  display(newobj);
  return newobj
}

function toggle(obj) {
  if (debug) console.log('function: toggl, ', log(obj));
  let newobj;
  switch (obj.currentstate) {
    case 'started':
      newobj = stop(obj);
      clearInterval(timer);
      display(newobj);
      if (debug) console.log('Interval clear');
      break;
    case 'stopped':
      newobj = start(obj);
      timer = window.setInterval(display, 1000);
      if (debug) console.log('Interval set');
      display(newobj);
      break;
    default:
      console.error('Invalid state');
      newobj = newstate();
  }
  return newobj
}

function init() {
  let json = JSON.parse(window.localStorage.getItem(storage));
  if (debug) console.log('function: init, ', json);
  let newobj = {};

  if (json == null || json.currentstate == null) { window.localStorage.clear(); return newstate('stopped'); }
  newobj.currentstate = json.currentstate;

  switch (newobj.currentstate) {
    case 'started':
      newobj.startTime = moment(json.startTime);
      newobj.duration = null;
      break;
    case 'stopped':
      newobj.startTime = null;
      newobj.duration = moment.duration(json.duration);
      break;
    default:
      console.error('Invalid state');
      return false
  }

  if (isvalid(newobj)) {
    display(newobj);
    switch (newobj.currentstate) {
      case 'started':
        timer = window.setInterval(display, 1000);
        if (debug) console.log('Interval set');
        bt_toggle.innerText = 'stop';
        break;
      case 'stopped':
        clearInterval(timer);
        if (debug) console.log('Interval clear');
        bt_toggle.innerText = 'start';
        break;
    }
    return newobj
  }
  window.localStorage.clear();
  return newstate('stopped')
}


var state = init();
var timer;


bt_toggle.onclick = function () { state = toggle(state); };
bt_clear.onclick = function () { state = clear(state); };
bt_plus.onclick = function () { state = add(state, 1, 'minutes') };
bt_minus.onclick = function () { state = add(state, -1, 'minutes') };


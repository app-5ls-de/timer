moment.locale('de');
var h1_time = document.getElementsByTagName('time')[0];
var bt_start = document.getElementById('start');
var bt_stop = document.getElementById('stop');
var bt_clear = document.getElementById('clear');
var bt_plus = document.getElementById('plus');
var bt_minus = document.getElementById('minus');

var state = {
  reset: function () {
    this.currentState = 'stopped';
    this.duration = moment.duration(0);
    this.startTime = null;
    this.display();
  },

  validate: function () {
    if (this.currentState == "started") {
      if (this.startTime.isValid() & this.duration == null) {
        return
      }
    }
    if (this.currentState == "stopped") {
      if (this.startTime == null & moment.isDuration(this.duration)) {
        return
      }
    }
    console.error('invalid state');
    this.reset();
  },

  display: function () {
    this.validate();
    let duration;
    if (this.currentState == "started") {
      let now = moment(new Date());
      duration = moment.duration(now.diff(this.startTime));
    }
    if (this.currentState == "stopped") {
      duration = this.duration;
    }

    // no negative for now
    if (duration < 0) { this.reset() }


    var s = duration.seconds();
    var m = duration.minutes();
    var h = Math.floor(duration.asHours());
    h1_time.textContent = (h ? (h > 9 ? h : "0" + h) : "00") + ":" + (m ? (m > 9 ? m : "0" + m) : "00") + ":" + (s > 9 ? s : "0" + s);
  },

  updateURL: function () {
    let newURL = '/';
    if (this.currentState == "started") {
      newURL = newURL + "?startTime=" + this.startTime.format() + '&currentState=started';
    }
    if (this.currentState == "stopped") {
      newURL = newURL + "?duration=" + this.duration.toISOString() + '&currentState=stopped';
    }
    window.history.replaceState(null, null, newURL);
  },

  stop: function () {
    this.validate();
    if (this.currentState == 'started') {
      let now = moment(new Date());
      this.duration = moment.duration(now.diff(this.startTime));
      this.startTime = null;
      this.currentState = 'stopped';
      this.updateURL();
      this.display();
    }
  },

  start: function () {
    this.validate();
    if (this.currentState == 'stopped') {
      let now = moment(new Date());
      this.startTime = now.subtract(this.duration);
      this.duration = null;
      this.currentState = 'started';
      this.updateURL();
      this.display();
    }
  },

  add: function (number, unit) {
    unit = unit || '';
    console.log('function: add');
    this.validate();
    var durationToAdd = moment.duration(number, unit);

    if (!moment.isDuration(durationToAdd)) {
      console.error('invalid duration to add');
      return
    }

    if (this.currentState == 'started') {
      this.startTime.subtract(durationToAdd);
    }

    if (this.currentState == 'stopped') {
      this.duration.add(durationToAdd);
    }
    this.updateURL();
    this.display();
  }
};


state.reset();

bt_start.onclick = function () { state.start() };
bt_stop.onclick = function () { state.stop() };
bt_clear.onclick = function () { state.reset() };
bt_plus.onclick = function () { state.add(1, 'minutes') };
bt_minus.onclick = function () { state.add(-1, 'minutes') };





window.setInterval(state.display, 1000);
//clearInterval();
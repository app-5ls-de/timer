dayjs.extend(dayjs_plugin_duration);
dayjs.locale("de");

var h1_time = document.getElementsByTagName("time")[0];
var bt_toggle = document.getElementById("toggle");
var inner_start = document.getElementById("inner-start");
var inner_stop = document.getElementById("inner-stop");
var bt_clear = document.getElementById("clear");
var inner_clear = document.getElementById("inner-clear");
var inner_back = document.getElementById("inner-back");
var bt_plus = document.getElementById("plus");
var bt_minus = document.getElementById("minus");
var bt_pomodoroinfo = document.getElementById("pomodoro-info");
var sp_pomodoroinfo = bt_pomodoroinfo.children[0];
var sp_info = document.getElementById("info");

if (window.localStorage.oldState == undefined) {
  window.localStorage.oldState = "{}";
}
if (window.localStorage.state == undefined) {
  window.localStorage.state = "{}";
}
if (window.localStorage.settings == undefined) {
  window.localStorage.settings = "{}";
}

var displayed = {
  pomodoro: false,
  info: false,
};

var updater_interval, longpressed;

function isobject(obj) {
  return !!(obj && typeof obj === "object" && Object.keys(obj).length > 0); //return a Boolean
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

class State {
  constructor() {
    this.state = "stopped";
    this.value = dayjs.duration(0);
    this.pomodoro = {};
    this.pomodoro.active = false;
    this.pomodoro.minutes = 25;
  }

  loadState(options) {
    if (isobject(options)) {
      if (options.pomodoro) {
        this.pomodoro = options.pomodoro;
      }
      if (options.state == "started") {
        let value = dayjs(options.value);
        if (value.isValid()) {
          this.start(value);
        }
      } else if (options.state == "stopped") {
        let value;
        if (options.value[0] == "-") {
          let absolute = dayjs
            .duration(options.value.substring(1))
            .asMilliseconds();
          value = dayjs.duration(-absolute);
        } else {
          value = dayjs.duration(options.value);
        }
        if (dayjs.isDuration(value)) {
          this.stop(value);
        }
      }
    }
  }

  saveState() {
    window.localStorage.state = this.tostring();
  }

  tostring() {
    function toISOString(value) {
      if (dayjs.isDuration(value)) {
        if (value.asMilliseconds() < 0) {
          return "-" + dayjs.duration(-value.asMilliseconds()).toISOString();
        } else {
          return value.toISOString();
        }
      } else {
        return value.toISOString();
      }
    }

    return JSON.stringify({
      state: this.state,
      value: toISOString(this.value),
      pomodoro: this.pomodoro,
    });
  }

  clear() {
    this.pomodoro.active = false;
    this.stop(dayjs.duration(0));
    loadSettings(parse(window.localStorage.settings));
  }

  backup() {
    window.localStorage.oldState = this.tostring();
    inner_back.style.display = "unset";
    inner_clear.style.display = "none";
  }

  restore() {
    if (isobject(parse(window.localStorage.oldState))) {
      statemachine.loadState(parse(window.localStorage.oldState));
      inner_back.style.display = "none";
      inner_clear.style.display = "unset";
    }
  }

  clean() {
    if (window.localStorage.oldState) {
      inner_back.style.display = "none";
      inner_clear.style.display = "unset";
      window.localStorage.oldState = "{}";
    }
    if (longpressed) {
      longpressed = undefined;
    }
    if (displayed.info) {
      sp_info.style.display = "none";
      displayed.info = false;
    }
  }

  toggle() {
    if (this.state == "started") {
      this.stop();
    } else if (this.state == "stopped") {
      this.start();
    }
  }

  add(number, unit) {
    unit = unit || "";
    assert(typeof unit === "string");
    assert(typeof number === "number");

    this.was_negative = false;
    let durationToAdd = dayjs.duration(number, unit);
    assert(dayjs.isDuration(durationToAdd));

    if (this.state == "started") {
      this.value = this.value.subtract(number, unit);
    } else if (this.state == "stopped") {
      this.value = this.value.add(number, unit);
    }
    this.display();
    this.saveState();
  }

  updater_start = function () {
    statemachine.display();
    if (updater_interval) {
      statemachine.updater_stop();
    }
    updater_interval = setInterval(function () {
      statemachine.display();
    }, 1000);
  };

  updater_stop = function () {
    statemachine.display();
    if (updater_interval) {
      clearInterval(updater_interval);
      updater_interval = undefined;
    }
  };

  start(value) {
    if (!value) {
      if (this.state == "started") {
        value = this.value;
      } else if (this.state == "stopped") {
        value = dayjs().subtract(this.value.asMilliseconds(), "millisecond");
      }
    }
    this.state = "started";
    this.value = value;
    inner_start.style.display = "none";
    inner_stop.style.display = "unset";
    this.saveState();
    this.updater_start();
  }

  stop(value) {
    if (!value) {
      if (this.state == "started") {
        value = dayjs.duration(dayjs().diff(this.value));
      } else if (this.state == "stopped") {
        value = this.value;
      }
    }
    this.state = "stopped";
    this.value = value;
    inner_stop.style.display = "none";
    inner_start.style.display = "unset";
    this.saveState();
    this.updater_stop();
  }

  display() {
    let duration;
    if (this.state == "started") {
      duration = dayjs.duration(dayjs().diff(this.value));
    } else if (this.state == "stopped") {
      duration = this.value;
    }

    function pretty(num) {
      return num ? (num > 9 ? num : "0" + num) : "00";
    }

    let millis = duration.asMilliseconds();

    if (millis > 0 && this.was_negative && this.state == "started") {
      this.show_notification();
    }

    if (displayed.pomodoro) {
      if (this.pomodoro.active == false || millis < 0) {
        bt_pomodoroinfo.style.display = "none";
        displayed.pomodoro = false;
      }
    } else {
      if (this.pomodoro.active == true && millis > 0) {
        sp_pomodoroinfo.textContent =
          "+" + statemachine.pomodoro.minutes + "min";
        bt_pomodoroinfo.style.display = "unset";
        displayed.pomodoro = true;
      }
    }

    let textContent = "";
    if (millis < 0) {
      textContent = "-";
      duration = dayjs.duration(-millis + 999); //add one second because duration.seconds always roudns down
    }
    textContent +=
      pretty(Math.floor(duration.asHours())) +
      ":" +
      pretty(Math.floor(duration.minutes())) +
      ":" +
      pretty(Math.floor(duration.seconds()));
    h1_time.textContent = textContent;

    this.was_negative = millis < 0;
  }

  show_notification() {
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("Timer abgelaufen", {
              badge: "/images/logo64px.png",
              tag: "Timer abgelaufen",
              timestamp: new Date(),
            });
          });
        }
      });
    }
  }

  clearAll() {
    this.clean();
    this.clear();
    sp_info.textContent = "Cleared";
    sp_info.style.display = "unset";
    displayed.info = true;

    window.localStorage.oldState = "{}";
    window.localStorage.state = "{}";
    window.localStorage.settings = "{}";
  }
}

function loadSettings(options) {
  if (isobject(options)) {
    if (!statemachine.pomodoro.active) {
      statemachine.pomodoro.minutes = options.pomodorominutes;
      statemachine.saveState();
    }
  }
}

function parse(string) {
  if (string) {
    return JSON.parse(string);
  }
}

var statemachine = new State();
statemachine.loadState(parse(window.localStorage.state));
loadSettings(parse(window.localStorage.settings));

if (isobject(parse(window.localStorage.oldState))) {
  inner_clear.style.display = "none";
  inner_back.style.display = "unset";
}

bt_pomodoroinfo.addEventListener("click", () => {
  if (statemachine.pomodoro.active) {
    statemachine.clean();
    statemachine.backup();
    statemachine.pomodoro.active = false;
    statemachine.add(statemachine.pomodoro.minutes, "minute");
  }
});

bt_toggle.addEventListener("click", () => {
  statemachine.clean();
  statemachine.toggle();
});

bt_plus.addEventListener("click", () => {
  statemachine.clean();
  statemachine.add(1, "minute");
});

bt_clear.addEventListener("click", () => {
  if (isobject(parse(window.localStorage.oldState))) {
    statemachine.restore();
    statemachine.clean();
  } else if (
    !(
      statemachine.state == "stopped" &&
      statemachine.value == 0 &&
      !statemachine.pomodoro.active
    )
  ) {
    statemachine.clean();
    statemachine.backup();
    statemachine.clear();
  }
});

bt_clear.addEventListener("long-press", function (e) {
  e.preventDefault();
  statemachine.clearAll();
});

bt_minus.addEventListener("click", () => {
  if (!longpressed || new Date().getTime() - longpressed > 1000) {
    statemachine.clean();
    statemachine.add(-1, "minute");
  }
});

bt_minus.setAttribute("data-long-press-delay", 1000);
bt_minus.addEventListener("long-press", function (e) {
  e.preventDefault();

  statemachine.clean();
  statemachine.backup();
  statemachine.pomodoro.active = true;
  statemachine.stop(dayjs.duration(-statemachine.pomodoro.minutes, "minute"));
  longpressed = new Date().getTime();
});

[bt_minus, bt_toggle, bt_clear, bt_plus, bt_pomodoroinfo].forEach(
  (dom_element) => {
    dom_element.addEventListener("mouseup", () => {
      this.blur();
    });
  }
);

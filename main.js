moment.locale('de')

var h1_time = document.getElementsByTagName('time')[0]
var bt_toggle = document.getElementById('toggle')
var bt_clear = document.getElementById('clear')
var bt_plus = document.getElementById('plus')
var bt_minus = document.getElementById('minus')
var bt_pomodoroinfo = document.getElementById('pomodoro-info')
var sp_pomodoroinfo = bt_pomodoroinfo.children[0]


if (window.localStorage.oldState == undefined) {
    window.localStorage.oldState = '{}'
}
if (window.localStorage.state == undefined) {
    window.localStorage.state = '{}'
}
if (window.localStorage.settings == undefined) {
    window.localStorage.settings = '{}'
}



var timer, pomodorodisplayed, longpressed

var buttontext = {
    'bt_toggle': {
        'start': 'start',
        'stop': 'stop'
    },
    'bt_clear': {
        '0': 'clear',
        '1': 'back'
    }
}

function isobject(obj) {
    return !!(obj && typeof obj === 'object' && Object.keys(obj).length > 0) //return a Boolean 
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed')
    }
}

//#region State 

function State() {
    this.state = 'stopped'
    this.value = moment.duration(0)
    this.pomodoro = {}
    this.pomodoro.active = false
    this.pomodoro.minutes = 25
}


State.prototype.loadState = function (options) {
    if (isobject(options)) {
        if (options.pomodoro) {
            this.pomodoro = options.pomodoro
        }
        if (options.state == 'started') {
            let value = moment(options.value)
            if (value.isValid()) {
                this.start(value)
            }
        } else if (options.state == 'stopped') {
            let value = moment.duration(options.value)
            if (moment.isDuration(value)) {
                this.stop(value)
            }
        }
    }
}


State.prototype.saveState = function () {
    window.localStorage.state = this.tostring()
}


State.prototype.tostring = function () {
    return JSON.stringify({
        'state': this.state,
        'value': this.value.toISOString(true),
        'pomodoro': this.pomodoro
    })
}


State.prototype.clear = function () {
    this.pomodoro.active = false
    this.stop(moment.duration(0))
    loadSettings(parse(window.localStorage.settings))
}


State.prototype.backup = function () {
    window.localStorage.oldState = this.tostring()
    bt_clear.innerHTML = buttontext.bt_clear[1]
}


State.prototype.restore = function () {
    if (isobject(parse(window.localStorage.oldState))) {
        statemachine.loadState(parse(window.localStorage.oldState))
        bt_clear.innerHTML = buttontext.bt_clear[0]
    }
}


State.prototype.clean = function () {
    if (window.localStorage.oldState) {
        bt_clear.innerHTML = buttontext.bt_clear[0]
        window.localStorage.oldState = '{}'
    }
    if (longpressed) {
        longpressed = undefined
    }
}


State.prototype.toggle = function () {
    if (this.state == 'started') {
        this.stop()
    } else if (this.state == 'stopped') {
        this.start()
    }
}


State.prototype.add = function (number, unit) {
    unit = unit || ''
    assert(typeof unit === 'string')
    assert(typeof number === 'number')

    let durationToAdd = moment.duration(number, unit)
    assert(moment.isDuration(durationToAdd))

    if (this.state == 'started') {
        this.value = this.value.subtract(durationToAdd)
    } else if (this.state == 'stopped') {
        this.value = this.value.add(durationToAdd)
    }
    this.display()
    this.saveState()
}


State.prototype.updater = {}

State.prototype.updater.on = function () {
    statemachine.display()
    if (timer) {
        statemachine.updater.off()
    }
    timer = setInterval(function () { statemachine.display() }, 1000)
}


State.prototype.updater.off = function () {
    statemachine.display()
    if (timer) {
        clearInterval(timer)
        timer = undefined
    }
}


State.prototype.start = function (value) {
    if (!value) {
        if (this.state == 'started') {
            value = this.value
        } else if (this.state == 'stopped') {
            value = moment().subtract(this.value)
        }
    }
    this.state = 'started'
    this.value = value
    bt_toggle.innerText = buttontext.bt_toggle.stop
    this.saveState()
    this.updater.on()
}


State.prototype.stop = function (value) {
    if (!value) {
        if (this.state == 'started') {
            value = moment.duration(moment().diff(this.value))
        } else if (this.state == 'stopped') {
            value = this.value
        }
    }
    this.state = 'stopped'
    this.value = value
    bt_toggle.innerText = buttontext.bt_toggle.start
    this.saveState()
    this.updater.off()
}


State.prototype.display = function () {
    let duration
    if (this.state == 'started') {
        duration = moment.duration(moment().diff(this.value))
    } else if (this.state == 'stopped') {
        duration = this.value
    }

    function pretty(num) {
        return (num ? (num > 9 ? num : "0" + num) : "00")
    }


    if (pomodorodisplayed == true) {
        if (this.pomodoro.active == false || duration < 0) {
            bt_pomodoroinfo.style.display = 'none'
            pomodorodisplayed = false
        }
    } else {
        if (this.pomodoro.active == true && duration > 0) {
            sp_pomodoroinfo.textContent = '+' + statemachine.pomodoro.minutes + 'min'
            bt_pomodoroinfo.style.display = 'unset'
            pomodorodisplayed = true
        }
    }


    let textContent = ''
    if (duration < 0) {
        textContent = '-'
        duration = moment.duration(-duration + 999)//add one second because duration.seconds always roudns down
    }
    textContent += pretty(Math.floor(duration.asHours())) + ":" + pretty(duration.minutes()) + ":" + pretty(duration.seconds())
    h1_time.textContent = textContent
}

State.prototype.clearAll=function () {
    this.clear()
    sp_pomodoroinfo.textContent = 'Cleared'
    bt_pomodoroinfo.style.display = 'unset'
    pomodorodisplayed = true
    
    window.localStorage.oldState = '{}'
    window.localStorage.state = '{}'
    window.localStorage.settings = '{}'   
}


//#endregion


var loadSettings = function (options) {
    if (isobject(options)) {
        if (!statemachine.pomodoro.active) {
            statemachine.pomodoro.minutes = options.pomodorominutes
            statemachine.saveState()
        }
    }
}


var parse = function (string) {
    if (string) {
        return JSON.parse(string)
    }
}

var statemachine = new State()
statemachine.loadState(parse(window.localStorage.state))
loadSettings(parse(window.localStorage.settings))









bt_pomodoroinfo.onclick = function () {
    if (statemachine.pomodoro.active) {
        statemachine.backup()
        statemachine.pomodoro.active = false
        statemachine.add(statemachine.pomodoro.minutes, 'minutes')
    }
}

bt_toggle.onclick = function () {
    statemachine.clean()
    statemachine.toggle()
}

bt_plus.onclick = function () {
    statemachine.clean()
    statemachine.add(1, 'minutes')
}

bt_clear.onclick = function () {
    if (isobject(parse(window.localStorage.oldState))) {
        statemachine.restore()
        statemachine.clean()
    } else if (!(statemachine.state == 'stopped' && statemachine.value == 0 && !statemachine.pomodoro.active)) {
        statemachine.backup()
        statemachine.clear()
    }
}

/* bt_clear.setAttribute('data-long-press-delay', 1500); */
bt_clear.addEventListener('long-press', function (e) {
    e.preventDefault()
    statemachine.clearAll()
})

bt_minus.onclick = function () {
    if ((!longpressed) || (new Date()).getTime() - longpressed > 1000) {
        statemachine.clean()
        statemachine.add(-1, 'minutes')
    }
}

bt_minus.setAttribute('data-long-press-delay', 1000);
bt_minus.addEventListener('long-press', function (e) {
    e.preventDefault()

    statemachine.backup()
    statemachine.pomodoro.active = true
    statemachine.stop(moment.duration(-statemachine.pomodoro.minutes, 'minutes'))
    longpressed = (new Date()).getTime()
})


bt_minus.onmouseup = function () { this.blur() }
bt_plus.onmouseup = function () { this.blur() }
bt_toggle.onmouseup = function () { this.blur() }
bt_clear.onmouseup = function () { this.blur() }
bt_pomodoroinfo.onmouseup = function () { this.blur() }
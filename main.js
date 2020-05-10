moment.locale('de')

var h1_time = document.getElementsByTagName('time')[0]
var bt_toggle = document.getElementById('toggle')
var bt_clear = document.getElementById('clear')
var bt_plus = document.getElementById('plus')
var bt_minus = document.getElementById('minus')
var bt_pomodoroinfo = document.getElementById('pomodoro-info')
var sp_pomodoroinfo = bt_pomodoroinfo.children[0]

var timer
var pomodorominutes = 25
var pomodorodisplayed

sp_pomodoroinfo.textContent = '+' + pomodorominutes + 'min'

var longpressed
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


function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed')
    }
}


function State() {
    this.state = 'stopped'
    this.value = moment.duration(0)
    this.pomodoroactive = false
}


State.prototype.init = function (options) {
    if (options && typeof options === 'object') {
        if (options.state && options.value) {
            if (options.pomodoroactive) {
                this.pomodoroactive = true
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
}


State.prototype.tostring = function () {
    json = {
        'state': this.state,
        'pomodoroactive': this.pomodoroactive
    }

    if (this.state == 'started') {
        json.value = this.value.toISOString(true)
    } else if (this.state == 'stopped') {
        json.value = this.value
    }
    return JSON.stringify(json)
}


State.prototype.save = function () {
    window.localStorage.setItem(storage, this.tostring())
}


State.prototype.clear = function () {
    this.pomodoroactive = false
    this.stop(moment.duration(0))
}


State.prototype.backup = function () {
    this.old = this.tostring()
    bt_clear.innerHTML = buttontext.bt_clear[1]
}


State.prototype.restore = function () {
    this.init(JSON.parse(this.old))
    bt_clear.innerHTML = buttontext.bt_clear[0]
}


State.prototype.clean = function () {
    if (this.old) {
        bt_clear.innerHTML = buttontext.bt_clear[0]
        this.old = undefined
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
    this.save()
}


State.prototype.updater = {}

State.prototype.updater.on = function () {
    statemachine.display()
    timer = setInterval(function () { statemachine.display() }, 1000)
}


State.prototype.updater.off = function () {
    statemachine.display()
    clearInterval(timer)
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
    this.save()
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
    this.save()
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
        if (this.pomodoroactive == false || duration < 0) {
            bt_pomodoroinfo.style.display = 'none'
            pomodorodisplayed = false
        }
    } else {
        if (this.pomodoroactive == true && duration > 0) {
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


var storage = 'state'

var statemachine = new State()
statemachine.init(JSON.parse(window.localStorage.getItem(storage)))

bt_pomodoroinfo.onclick = function () {
    if (statemachine.pomodoroactive) {
        statemachine.backup()
        statemachine.pomodoroactive = false
        statemachine.add(pomodorominutes, 'minutes')
    }
}

bt_toggle.onclick = function () {
    statemachine.clean()
    statemachine.toggle()
}

bt_clear.onclick = function () {
    if (statemachine.old) {
        statemachine.restore()
        statemachine.clean()
    } else if (!(statemachine.state == 'stopped' && !statemachine.value && !statemachine.pomodoroactive)) {
        statemachine.backup()
        statemachine.clear()
    }
}

bt_plus.onclick = function () {
    statemachine.clean()
    statemachine.add(1, 'minutes')
}

bt_minus.onclick = function () {
    if ((!longpressed) || (new Date()).getTime() - longpressed > 1000) {
        statemachine.clean()
        statemachine.add(-1, 'minutes')
    }

}


// listen for the long-press event
bt_minus.addEventListener('long-press', function (e) {

    // stop the event from bubbling up
    e.preventDefault()

    statemachine.backup()
    statemachine.pomodoroactive = true
    statemachine.stop(moment.duration(-pomodorominutes, 'minutes'))
    longpressed = (new Date()).getTime()
})


bt_minus.onmouseup = function () { this.blur() }
bt_plus.onmouseup = function () { this.blur() }
bt_toggle.onmouseup = function () { this.blur() }
bt_clear.onmouseup = function () { this.blur() }
bt_pomodoroinfo.onmouseup = function () { this.blur() }
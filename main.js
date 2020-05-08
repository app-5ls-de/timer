moment.locale('de')

var h1_time = document.getElementsByTagName('time')[0]
var bt_toggle = document.getElementById('toggle')
var bt_clear = document.getElementById('clear')
var bt_plus = document.getElementById('plus')
var bt_minus = document.getElementById('minus')

var timer
var debug = false
var longpressed
var negativeallowed = true
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
    if (debug) console.log('function: initialisation of State, '); //todelete
    this.state = 'stopped'
    this.value = moment.duration(0)
}


State.prototype.init = function (options) {
    if (debug) console.log('function: init, ', statemachine.tostring()); //todelete

    if (options && typeof options === 'object') {
        if (options.state && options.value) {
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
    if (this.state == 'started') {
        return JSON.stringify({
            state: this.state,
            value: this.value.toISOString(true)
        })
    } else if (this.state == 'stopped') {
        return JSON.stringify({
            state: this.state,
            value: this.value
        })
    }
}


State.prototype.save = function () {
    if (debug) console.log('function: save, ', statemachine.tostring()); //todelete
    window.localStorage.setItem(storage, this.tostring())
}


State.prototype.clear = function () {
    if (debug) console.log('function: clear, ', statemachine.tostring()); //todelete
    this.stop(moment.duration(0))
}


State.prototype.backup = function () {
    if (debug) console.log('function: backup, ', statemachine.tostring()); //todelete
    this.old = {
        'state': this.state,
        'value': this.value
    }
    bt_clear.innerHTML=buttontext.bt_clear[1]
}


State.prototype.restore = function () {
    if (debug) console.log('function: restore, ', statemachine.tostring()); //todelete
    if (this.old.state == 'started') {
        this.start(this.old.value)
    } else if (this.old.state == 'stopped') {
        this.stop(this.old.value)
    }
}


State.prototype.clean = function () {
    if (debug) console.log('function: clean, ', statemachine.tostring()); //todelete
    if (this.old) {
        bt_clear.innerHTML = buttontext.bt_clear[0]
        this.old = undefined
    }
    if (longpressed) {
        longpressed = undefined
    }
}


State.prototype.toggle = function () {
    if (debug) console.log('function: toggle, ', statemachine.tostring()); //todelete
    if (this.state == 'started') {
        this.stop()
    } else if (this.state == 'stopped') {
        this.start()
    }
}


State.prototype.add = function (number, unit) {
    if (debug) console.log('function: add, ', statemachine.tostring()); //todelete
    unit = unit || ''
    assert(typeof unit === 'string')
    assert(typeof number === 'number')

    let durationToAdd = moment.duration(number, unit)
    assert(moment.isDuration(durationToAdd))

    if (this.state == 'started') {
        this.value = this.value.subtract(durationToAdd)
        if (!negativeallowed) {
            if (this.value > moment()) { // no negative for now
                console.error('negative time not allowed')
                this.value = moment()
            }
        }
    } else if (this.state == 'stopped') {
        this.value = this.value.add(durationToAdd)
        if (!negativeallowed) {
            if (this.value < 0) { // no negative for now
                console.error('negative time not allowed')
                this.value = moment.duration(0)
            }
        }
    }
    this.display()
    this.save()
}


State.prototype.updater = {}

State.prototype.updater.on = function () {
    statemachine.display()
    if (debug) console.log('function: updater.on, ', statemachine.tostring()); //todelete
    timer = setInterval(function () { statemachine.display() }, 1000)
}


State.prototype.updater.off = function () {
    statemachine.display()
    if (debug) console.log('function: updater.off, ', statemachine.tostring()); //todelete
    clearInterval(timer)
}


State.prototype.start = function (value) {
    if (debug) console.log('function: start, ', statemachine.tostring()); //todelete
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
    if (debug) console.log('function: stop, ', statemachine.tostring()); //todelete
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
    if (debug) console.log('function: display, ', statemachine.tostring()); //todelete
    let duration
    if (this.state == 'started') {
        duration = moment.duration(moment().diff(this.value))
    } else if (this.state == 'stopped') {
        duration = this.value
    }

    function pretty(num) {
        return (num ? (num > 9 ? num : "0" + num) : "00")
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


bt_toggle.onclick = function () {
    if (debug) console.log('button: toggle, ', statemachine.tostring()); //todelete
    statemachine.clean()
    statemachine.toggle()
}

bt_clear.onclick = function () {
    if (debug) console.log('button: clear, ', statemachine.tostring()); //todelete
    if (statemachine.old) {
        statemachine.restore()
        statemachine.clean()
    } else if (!(statemachine.state == 'stopped' && statemachine.value == 0)) {
        statemachine.backup()
        statemachine.clear()
    }
}

bt_plus.onclick = function () {
    if (debug) console.log('button: plus, ', statemachine.tostring()); //todelete
    statemachine.clean()
    statemachine.add(1, 'minutes')
}

bt_minus.onclick = function () {
    if (debug) console.log('button: minus, ', statemachine.tostring()); //todelete
    if (!longpressed) {
        statemachine.clean()
        statemachine.add(-1, 'minutes')
    }
}
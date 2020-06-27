/*!
 * long-press-event - v2.2.1
 * Pure JavaScript long-press-event
 * https://github.com/john-doherty/long-press-event
 * @author John Doherty <www.johndoherty.info>
 * @license MIT
 */
!function (e, t) { "use strict"; var n = null, a = "ontouchstart" in e || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0, i = a ? "touchstart" : "mousedown", o = a ? "touchend" : "mouseup", m = a ? "touchmove" : "mousemove", u = 0, r = 0, s = 10, c = 10; function l(i) { v(i); var m = i.target, u = parseInt(m.getAttribute("data-long-press-delay") || "1500", 10); n = function (t, n) { if (!(e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame && e.mozCancelRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame)) return e.setTimeout(t, n); var a = (new Date).getTime(), i = {}, o = function () { (new Date).getTime() - a >= n ? t.call() : i.value = requestAnimFrame(o) }; return i.value = requestAnimFrame(o), i }(function (e) { v(); var n = a ? e.touches[0].clientX : e.clientX, i = a ? e.touches[0].clientY : e.clientY; this.dispatchEvent(new CustomEvent("long-press", { bubbles: !0, cancelable: !0, detail: { clientX: n, clientY: i } })) && t.addEventListener(o, function e(n) { t.removeEventListener(o, e, !0), function (e) { e.stopImmediatePropagation(), e.preventDefault(), e.stopPropagation() }(n) }, !0) }.bind(m, i), u) } function v(t) { var a; (a = n) && (e.cancelAnimationFrame ? e.cancelAnimationFrame(a.value) : e.webkitCancelAnimationFrame ? e.webkitCancelAnimationFrame(a.value) : e.webkitCancelRequestAnimationFrame ? e.webkitCancelRequestAnimationFrame(a.value) : e.mozCancelRequestAnimationFrame ? e.mozCancelRequestAnimationFrame(a.value) : e.oCancelRequestAnimationFrame ? e.oCancelRequestAnimationFrame(a.value) : e.msCancelRequestAnimationFrame ? e.msCancelRequestAnimationFrame(a.value) : clearTimeout(a)), n = null } "function" != typeof e.CustomEvent && (e.CustomEvent = function (e, n) { n = n || { bubbles: !1, cancelable: !1, detail: void 0 }; var a = t.createEvent("CustomEvent"); return a.initCustomEvent(e, n.bubbles, n.cancelable, n.detail), a }, e.CustomEvent.prototype = e.Event.prototype), e.requestAnimFrame = e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame || function (t) { e.setTimeout(t, 1e3 / 60) }, t.addEventListener(o, v, !0), t.addEventListener(m, function (e) { var t = Math.abs(u - e.clientX), n = Math.abs(r - e.clientY); (t >= s || n >= c) && v() }, !0), t.addEventListener("wheel", v, !0), t.addEventListener("scroll", v, !0), t.addEventListener(i, function (e) { u = e.clientX, r = e.clientY, l(e) }, !0) }(window, document);
// end of long-press-event


dayjs.extend(dayjs_plugin_duration)
dayjs.locale('de')

var h1_time = document.getElementsByTagName('time')[0]
var bt_toggle = document.getElementById('toggle')
var inner_start = document.getElementById('inner-start')
var inner_stop = document.getElementById('inner-stop')
var bt_clear = document.getElementById('clear')
var inner_clear = document.getElementById('inner-clear')
var inner_back = document.getElementById('inner-back')
var bt_plus = document.getElementById('plus')
var bt_minus = document.getElementById('minus')
var bt_pomodoroinfo = document.getElementById('pomodoro-info')
var sp_pomodoroinfo = bt_pomodoroinfo.children[0]
var sp_info = document.getElementById('info')


if (window.localStorage.oldState == undefined) {
    window.localStorage.oldState = '{}'
}
if (window.localStorage.state == undefined) {
    window.localStorage.state = '{}'
}
if (window.localStorage.settings == undefined) {
    window.localStorage.settings = '{}'
}


var displayed = {
    'pomodoro': false,
    'info': false
}

var timer, longpressed


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
    this.value = dayjs.duration(0)
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
            let value = dayjs(options.value)
            if (value.isValid()) {
                this.start(value)
            }
        } else if (options.state == 'stopped') {
            let value
            if (options.value[0] == "-") {
                let absolute = dayjs.duration(options.value.substring(1)).asMilliseconds()
                value = dayjs.duration(-absolute)
            } else {
                value = dayjs.duration(options.value)
            }
            if (dayjs.isDuration(value)) {
                this.stop(value)
            }
        }
    }
}


State.prototype.saveState = function () {
    window.localStorage.state = this.tostring()
}


State.prototype.tostring = function () {
    function toISOString(value) {
        if (dayjs.isDuration(value)) {
            if (value.asMilliseconds() < 0) {
                return "-" + dayjs.duration(-value.asMilliseconds()).toISOString()
            } else {
                return value.toISOString()
            }
        } else {
            return value.toISOString()
        }
    }

    return JSON.stringify({
        'state': this.state,
        'value': toISOString(this.value),
        'pomodoro': this.pomodoro
    })
}


State.prototype.clear = function () {
    this.pomodoro.active = false
    this.stop(dayjs.duration(0))
    loadSettings(parse(window.localStorage.settings))
}


State.prototype.backup = function () {
    window.localStorage.oldState = this.tostring()
    inner_back.style.display = "unset"
    inner_clear.style.display = "none"
}


State.prototype.restore = function () {
    if (isobject(parse(window.localStorage.oldState))) {
        statemachine.loadState(parse(window.localStorage.oldState))
        inner_back.style.display = "none"
        inner_clear.style.display = "unset"
    }
}


State.prototype.clean = function () {
    if (window.localStorage.oldState) {
        inner_back.style.display = "none"
        inner_clear.style.display = "unset"
        window.localStorage.oldState = '{}'
    }
    if (longpressed) {
        longpressed = undefined
    }
    if (displayed.info) {
        sp_info.style.display = 'none'
        displayed.info = false
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

    let durationToAdd = dayjs.duration(number, unit)
    assert(dayjs.isDuration(durationToAdd))

    if (this.state == 'started') {
        this.value = this.value.subtract(number, unit)
    } else if (this.state == 'stopped') {
        this.value = this.value.add(number, unit)
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
            value = dayjs().subtract(this.value.asMilliseconds(), 'millisecond')
        }
    }
    this.state = 'started'
    this.value = value
    inner_start.style.display = "none"
    inner_stop.style.display = "unset"
    this.saveState()
    this.updater.on()
}


State.prototype.stop = function (value) {
    if (!value) {
        if (this.state == 'started') {
            value = dayjs.duration(dayjs().diff(this.value))
        } else if (this.state == 'stopped') {
            value = this.value
        }
    }
    this.state = 'stopped'
    this.value = value
    inner_stop.style.display = "none"
    inner_start.style.display = "unset"
    this.saveState()
    this.updater.off()
}


State.prototype.display = function () {
    let duration
    if (this.state == 'started') {
        duration = dayjs.duration(dayjs().diff(this.value))
    } else if (this.state == 'stopped') {
        duration = this.value
    }

    function pretty(num) {
        return (num ? (num > 9 ? num : "0" + num) : "00")
    }

    let millis = duration.asMilliseconds()


    if (displayed.pomodoro) {
        if (this.pomodoro.active == false || millis < 0) {
            bt_pomodoroinfo.style.display = 'none'
            displayed.pomodoro = false
        }
    } else {
        if (this.pomodoro.active == true && millis > 0) {
            sp_pomodoroinfo.textContent = '+' + statemachine.pomodoro.minutes + 'min'
            bt_pomodoroinfo.style.display = 'unset'
            displayed.pomodoro = true
        }
    }

    let textContent = ''
    if (millis < 0) {
        textContent = '-'
        duration = dayjs.duration(-millis + 999)//add one second because duration.seconds always roudns down
    }
    textContent += pretty(Math.floor(duration.asHours())) + ":" + pretty(Math.floor(duration.minutes())) + ":" + pretty(Math.floor(duration.seconds()))
    h1_time.textContent = textContent
}

State.prototype.clearAll = function () {
    this.clean()
    this.clear()
    sp_info.textContent = 'Cleared'
    sp_info.style.display = 'unset'
    displayed.info = true

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



if (isobject(parse(window.localStorage.oldState))) {
    inner_clear.style.display = "none"
    inner_back.style.display = "unset"
}






bt_pomodoroinfo.onclick = function () {
    if (statemachine.pomodoro.active) {
        statemachine.clean()
        statemachine.backup()
        statemachine.pomodoro.active = false
        statemachine.add(statemachine.pomodoro.minutes, 'minute')
    }
}

bt_toggle.onclick = function () {
    statemachine.clean()
    statemachine.toggle()
}

bt_plus.onclick = function () {
    statemachine.clean()
    statemachine.add(1, 'minute')
}

bt_clear.onclick = function () {
    if (isobject(parse(window.localStorage.oldState))) {
        statemachine.restore()
        statemachine.clean()
    } else if (!(statemachine.state == 'stopped' && statemachine.value == 0 && !statemachine.pomodoro.active)) {
        statemachine.clean()
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
        statemachine.add(-1, 'minute')
    }
}

bt_minus.setAttribute('data-long-press-delay', 1000);
bt_minus.addEventListener('long-press', function (e) {
    e.preventDefault()

    statemachine.clean()
    statemachine.backup()
    statemachine.pomodoro.active = true
    statemachine.stop(dayjs.duration(-statemachine.pomodoro.minutes, 'minute'))
    longpressed = (new Date()).getTime()
})


bt_minus.onmouseup = function () { this.blur() }
bt_plus.onmouseup = function () { this.blur() }
bt_toggle.onmouseup = function () { this.blur() }
bt_clear.onmouseup = function () { this.blur() }
bt_pomodoroinfo.onmouseup = function () { this.blur() }
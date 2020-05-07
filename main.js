moment.locale('de');
var h1_time = document.getElementsByTagName('time')[0];
var bt_toggle = document.getElementById('toggle');
var bt_clear = document.getElementById('clear');
var bt_plus = document.getElementById('plus');
var bt_minus = document.getElementById('minus');
var storage = 'state';
var debug = false;

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}


function State(string) {

    this.currentstate = 'stopped'
    this.value = moment.duration(0)


    if (string && string.currentstate && string.value) {
        assert('object' === typeof string)
        if (string.currentstate == 'started') {


            this.currentstate = string.currentstate
            string.value.isValid()
        }
        if (string.currentstate == 'stopped') {
            this.currentstate = string.currentstate
            moment.isDuration(string.value)
        }
    }

}

State.prototype.isValid = function () {
    if (debug) console.log('function: isvalid, ', stringify(obj));
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

State.prototype.tostring = function () {
    throw ''
    let result = {};
    if (obj == null || obj.currentstate == null) return '{}';
    result.currentstate = obj.currentstate;

    if (obj.startTime == null) {
        result.startTime = 'null';
    } else if (obj.startTime.isValid()) {
        result.startTime = obj.startTime.format();
    } else {
        return '{}';
    }

    if (obj.duration == null) {
        result.duration = 'null';
    } else if (moment.isDuration(obj.duration)) {
        result.duration = obj.duration.toISOString();
    } else {
        return '{}';
    }
    return JSON.stringify(result)
}






function newstate(status) {//to check/
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



function save(obj) {//to check/
    if (debug) console.log('function: save, ', stringify(obj));
    window.localStorage.setItem(storage, stringify(obj));
}

function add(obj, number, unit) {//to check/
    if (debug) console.log('function: add, ', stringify(obj), number, unit);
    unit = unit || '';

    bt_clear.innerHTML = 'clear';
    oldstate = undefined;

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

function display(obj) {//to check/
    if (debug) console.log('function: display, ', stringify(obj));
    obj = obj || state;

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
            duration = moment.duration(0);
    }

    function pretty(num) {
        return (num ? (num > 9 ? num : "0" + num) : "00");
    }

    h1_time.textContent = pretty(Math.floor(duration.asHours())) + ":" + pretty(duration.minutes()) + ":" + pretty(duration.seconds());
}

function iszero(obj) {
    if (debug) console.log('function: iszero, ', stringify(obj));

    if (obj.currentstate == 'stopped' && obj.duration.asMilliseconds() == 0) {
        return true
    }
    return false
}

function clear(obj) {//to check/
    if (debug) console.log('function: clear, ', stringify(obj));
    let newobj;

    if (bt_clear.innerHTML == 'unclear') {
        bt_clear.innerHTML = 'clear';
        if (isvalid(oldstate)) {
            newobj = oldstate;
            oldstate = undefined;
            switch (newobj.currentstate) {
                case 'started':
                    timer = window.setInterval(display, 1000);
                    if (debug) console.log('Interval set');
                    bt_toggle.innerText = 'stop';
                    break;
                case 'stopped':
                    bt_toggle.innerText = 'start';
                    break;
            }

            save(newobj);
            display(newobj);
            return newobj
        }
        oldstate = undefined;
    }

    if (!iszero(obj)) {
        oldstate = obj;
        bt_clear.innerHTML = 'unclear';
    }

    switch (obj.currentstate) {
        case 'started':
            newobj = newstate('stopped');
            clearInterval(timer);
            if (debug) console.log('Interval clear');
            bt_toggle.innerText = 'start';
            break;
        case 'stopped':
            newobj = newstate('stopped');
            break;
        default:
            console.error('Invalid state');
            newobj = newstate();
    }
    save(newobj);
    display(newobj);
    return newobj
}

function toggle(obj) {//to check/
    if (debug) console.log('function: toggl, ', stringify(obj));

    bt_clear.innerHTML = 'clear';
    oldstate = undefined;

    function stop(obj) {
        if (debug) console.log('function: stop, ', stringify(obj));
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
                return obj;
                break;
            default:
                console.error('Invalid state');
                newobj = newstate();
        }
        return newobj
    }

    function start(obj) {
        if (debug) console.log('function: start, ', stringify(obj));
        let newobj;
        switch (obj.currentstate) {
            case 'started':
                return obj;
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

function init() {//to check/
    let json = JSON.parse(window.localStorage.getItem(storage));
    if (debug) console.log('function: init, ', json);
    let newobj = {};

    if (json == null || json.currentstate == null) {
        window.localStorage.clear();
        return newstate('stopped');
    }

    switch (json.currentstate) {
        case 'started':
            newobj.currentstate = json.currentstate;
            newobj.startTime = moment(json.startTime);
            newobj.duration = null;
            break;
        case 'stopped':
            newobj.currentstate = json.currentstate;
            newobj.startTime = null;
            newobj.duration = moment.duration(json.duration);
            break;
        default:
            console.error('Invalid state');
            window.localStorage.clear();
            return newstate('stopped');
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
    } else {
        window.localStorage.clear();
        return newstate('stopped')
    }
}






var statemachine = new State()

console.log(statemachine)



var state = init();
var oldstate;
var timer;


bt_toggle.onclick = function () { state = toggle(state); };
bt_clear.onclick = function () { state = clear(state); };
bt_plus.onclick = function () { state = add(state, 1, 'minutes') };
bt_minus.onclick = function () { state = add(state, -1, 'minutes') };



vars = {};
var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
});


function init(vars) {
  if (moment.isDuration(moment.duration(vars['d'])) & vars['t']==null & vars['r']=="0"){
    running=false;
    duration = moment.duration(vars['d']);
    if (duration<0){clear(); return}
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


function timer() {
    t = setTimeout(update, 1000);
}








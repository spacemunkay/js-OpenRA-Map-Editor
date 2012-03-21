
$(document).ready( function(){
  var ctx = document.getElementById('test_canvas').getContext("2d");
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(300,300);
  ctx.stroke();
});


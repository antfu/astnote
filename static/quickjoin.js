var quickjoin = {};
quickjoin.abort = function()
{
  if (quickjoin.current)
    quickjoin.current.abort()
  quickjoin.current = undefined;
}
quickjoin.join = function(key)
{
  var request = $.ajax({
    type: 'GET',
    url: '/quickjoin/'+key,
    timeout: 30000
  });
  request.done(function(data)
  {
    if (data)
      window.location.href = data;
    console.log('GET',data);
  });
  quickjoin.current = request;
  return request;
}
quickjoin.host = function(key)
{
  var request = $.ajax({
    type: 'POST',
    url: '/quickjoin/'+key+'?url='+encodeURI(window.location.href),
    timeout: 30000
  });
  quickjoin.current = request;
  return request;
}
quickjoin.reg = function($buttons,type)
{
  function down()
  {
    if (type == 'host')
      var request = quickjoin.host($(this).attr('join-key'));
    else
      var request = quickjoin.join($(this).attr('join-key'));
    setTimeout(function(){
      request.abort();
      $(this).mouseup();
    },30000);
  }
  function up()
  {
    quickjoin.abort();
  }
  $buttons.mousedown(down).mouseup(up);
  //$buttons.addEventListener('touchstart',down).addEventListener('touchend',up);
}

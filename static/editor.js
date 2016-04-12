var historys = {}
historys.init = function()
{
  var room_history = access_cookies('history') || [];
  var modes = {r:'Rich Text',p:'Plain Text',m:'Markdown',c:'Code'};
  historys.format = function(url)
  {
    //var mode = modes[url.slice(1,2)];
    return url.slice(1,2).toUpperCase() + ' ' + url.slice(3,url.length-4);
  }
  historys.remove_historys = function(index)
  {
    if (index > -1)
        room_history.splice(index, 1);
    access_cookies('history',room_history);
    display_historys();
  }
  historys.display_historys = function()
  {
    var menu = $('[name=histoy_dropdown] .menu').empty();
    if (room_history.length)
    {
        $.each(room_history,function(i,e){
            menu.append('<div class="item" target="'+e+'">'+historys.format(e)+'</div>');
        });
        $('[name=histoy_dropdown]')
          .removeClass('transition hidden')
          .dropdown({
              onChange: function(t,h,selectedItem) {
                window.location = selectedItem.attr('target');
              }
            });
        $('[name=histoy_prev_btn]')
          .removeClass('transition hidden')
          .on('click',function(){
            window.location = room_history[room_history.length-1];
          });
    }
  }
  historys.renew = function()
  {
    var room_url = window.location.pathname;
    if (!room_history) room_history = [];
    if (room_history.length >= 7) room_history.shift();
    var room_index = room_history.indexOf(room_url);
    if (room_index > -1)
        room_history.splice(room_index, 1);
    room_history.push(room_url);
    access_cookies('history',room_history);
  }
  $(historys.display_historys);
  return room_history;
}

var markdown = {};
markdown.init = function(){
  markdown.toggle_preview = function(val) {
    if (val == undefined)
      val = !$('#editor').hasClass('preview');
    if (val)
    {
      $('#editor').addClass('preview');
      $('#md_preview_btn').html('<i class="icon hide"></i>').attr('data-content','Hide markdown preview').popup();
    }
    else
    {
      $('#editor').removeClass('preview');
      $('#md_preview_btn').html('<i class="icon unhide"></i>').attr('data-content','Show markdown preview').popup();
    }
  }
  markdown.update = function()
  {
    $('#mark_preview .markdown-body').html(marked(firepad.getText()));
  }
  markdown.save = function(filename)
  {
    filename = filename || get_file_name('.html');
    var html_data = '<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Astnote Markdown Save</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/github-markdown-css/2.2.1/github-markdown.css"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.3.0/styles/solarized-light.min.css"/></head><body><div class="markdown-body" style="margin:2em;">'+marked(firepad.getText()) + '</div></body></html>';
    download(filename,html_data);
  }
  markdown.scroll_sync = function(a,b) {
    var scrolling = false;
    function scroll_bind(source,target)
    {
      source.on('scroll', function() {
        if (!scrolling)
        {
          scrolling = true;
          target.scrollTop(source.scrollTop() / source.prop("scrollHeight") * target.prop("scrollHeight"));
          setTimeout(function() {scrolling = false; }, 40);
        }
        return true;
      });
    }
    scroll_bind(a,b);
    scroll_bind(b,a);
  }
  $(function(){
    marked.setOptions({
      highlight: function(code) {
        return hljs.highlightAuto(code).value;
      }
    });
    firepad.on('synced', markdown.update);
    firepad.on('ready', markdown.update);

    markdown.toggle_preview(true);
    markdown.scroll_sync($('#firepad .CodeMirror-vscrollbar'),$('#mark_preview'));
  });
}

var coder = {};
coder.init  = function (userId) {
  coder.theme = {};
  coder.syntax = {};
  coder.theme.load = function()
  {
    var theme_code = 'dawn';
    if (get_url_parameter('theme'))
      lang = get_url_parameter('theme');
    if (Cookies.get('astnote-code-theme'))
      theme_code = Cookies.get('astnote-code-theme');
    coder.theme.set(theme_code);
    var menu_item = $('#theme_menu .item[theme="'+theme_code+'"]');
    if (menu_item) menu_item.click();
  }
  coder.theme.set = function(theme_code)
  {
    coder.theme.val = theme_code;
    var menu_item = $('#theme_menu .item[theme="'+theme_code+'"]');
    if (menu_item && menu_item.attr('theme-style') == 'dark')
      $('#screen').addClass('dark');
    else
      $('#screen').removeClass('dark');
    coder.editor.setTheme("ace/theme/"+theme_code);
    if(!get_url_parameter('demo'))
      Cookies.set('astnote-code-theme',theme_code,{ expires: 90 });
  }
  coder.syntax.load = function ()
  {
    var lang = 'python';
    if (get_url_parameter('syntax'))
      lang = get_url_parameter('syntax');
    if (Cookies.get('astnote-code-syntax'))
      lang = Cookies.get('astnote-code-syntax');
    coder.syntax.set(lang);
    var menu_item = $('#syntax_menu .item[syntax="'+lang+'"]');
    if (menu_item) menu_item.click();
  }
  coder.syntax.set = function(lang)
  {
    coder.syntax.val = lang;
    coder.session.setMode("ace/mode/"+lang);
    if(!get_url_parameter('demo'))
      Cookies.set('astnote-code-syntax',lang,{expires: 10, path:window.location.pathname});
  }
  coder.syntax.get_ext = function()
  {
    var menu_item = $('#syntax_menu .item[syntax="'+coder.syntax.val+'"]');
    if (menu_item && menu_item.attr('ext')) return menu_item.attr('ext');
    return coder.syntax.val;
  }
  coder.warpmode = function(value)
  {
    if (value != undefined)
    {
      coder.warpmode.warp = value;
      coder.session.setUseWrapMode(coder.warpmode.warp);
      $('#text_warp_toggle').html(coder.warpmode.warp?'Warp on':'Warp off');
    }
    return coder.warpmode.warp;
  }
  coder.warpmode.toggle = function(){
    coder.warpmode(!coder.warpmode.warp);
  }

  $(function(){
    $('#syntax_dropdown, #theme_dropdown').dropdown();
    $('#syntax_menu .item').on('click',function(){coder.syntax.set($(this).attr('syntax'))});
    $('#theme_menu .item').on('click',function(){coder.theme.set($(this).attr('theme'))});
    coder.theme.load();
    coder.syntax.load();
    coder.warpmode(true);
  });

  coder.editor = ace.edit("firepad");
  coder.session = coder.editor.getSession();
  coder.editor.$blockScrolling = Infinity;
  coder.session.setUseWorker(false);
  return Firepad.fromACE(firepadRef, coder.editor, {userId: userId});
}

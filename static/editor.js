var historys = {}
historys.remove_historys = function(){};
historys.init = function()
{
  historys.history = access_cookies('history') || [];
  var modes = {r:'Rich Text',p:'Plain Text',m:'Markdown',c:'Code'};
  historys.format = function(data)
  {
    function f(url){
      return url.slice(3,url.length-4);
    }
    if (Array.isArray(data))
      return data[1] || f(data[0]);
    else
      return f(data);
  }
  historys.url = function(data)
  {
    if (Array.isArray(data))
      return data[0];
    else
      return data;
  }
  historys.remove_historys = function(index)
  {
    if (index > -1)
        historys.history.splice(index, 1);
    access_cookies('history',historys.history);
    historys.display_historys();
  }
  historys.renew = function()
  {
    var room_url = window.location.pathname;
    if (!historys.history) historys.history = [];
    if (historys.history.length > 7) historys.history.shift();
    $.each(historys.history,function(i,e)
    {
      if (e == room_url || e[0] == room_url)
        historys.history.splice(i, 1);
    });
    historys.history.push([room_url,editor.title]);
    access_cookies('history',historys.history);
    historys.display_historys();
  }
  $(historys.display_historys);
  return historys.history;
}

var markdown = {};
markdown.init = function(editor){
  markdown.synced = false;
  markdown.toggle_preview = function(val) {
    if (val == undefined)
      val = !$('#editor').hasClass('preview');
    if (val)
    {
      $('#editor').addClass('preview');
      $('#md_preview_btn').html('<i class="hide icon"></i> Hide Preview');
    }
    else
    {
      $('#editor').removeClass('preview');
      $('#md_preview_btn').html('<i class="unhide icon"></i> Preview');
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
  markdown.toggle_scroll_sync = function(val)
  {
    if (val != undefined)
      markdown.synced = val;
    else
      markdown.synced = !markdown.synced;
    var a = $('#firepad .CodeMirror-vscrollbar')
    var b = $('#mark_preview');
    if (markdown.synced)
    {
      markdown._scroll_bind(a,b);
      markdown._scroll_bind(b,a);
      //$('#md_sync_btn').html('Scrolling sync on');
    }
    else
    {
      markdown._scroll_unbind(a);
      markdown._scroll_unbind(b);
      //$('#md_sync_btn').html('Scrolling sync off');
    }
  }
  markdown._scroll_bind = function (source,target)
  {
    source.on('scroll', function() {
      target.scrollTop(source.scrollTop() / source.prop("scrollHeight") * target.prop("scrollHeight"));
      setTimeout(function() {scrolling = false; }, 40);
      return true;
    });
  }
  markdown._scroll_unbind = function (source)
  {
    source.off('scroll');
  }
  $(function(){
    marked.setOptions({
      highlight: function(code) {
        return hljs.highlightAuto(code).value;
      }
    });
    editor.firepad.on('synced', markdown.update);
    editor.firepad.on('ready', markdown.update);

    markdown.toggle_preview(true);
    markdown.toggle_scroll_sync(false);
  });
}

var coder = {};
coder.init  = function (editor) {
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
    {
      $('#editor .dimmer').removeClass('inverted');
      $('#screen').addClass('dark');
    }
    else
    {
      $('#screen').removeClass('dark');
      $('#editor .dimmer').addClass('inverted');
    }
    coder.editor.setTheme("ace/theme/"+theme_code);
    if(!get_url_parameter('demo'))
      Cookies.set('astnote-code-theme',theme_code,{ expires: 90 });
  }
  coder.syntax.load = function (lang)
  {
    var lang = lang || '';
    if (get_url_parameter('syntax'))
      lang = get_url_parameter('syntax');
    coder.syntax.set(lang);
  }
  coder.syntax.update = function(lang)
  {
    editor.update_meta('syntax',lang);
  }
  coder.syntax.set = function(lang)
  {
    coder.syntax.val = lang;
    if (lang)
      coder.session.setMode("ace/mode/"+lang);
    else
      coder.session.setMode('');
    if(!get_url_parameter('demo'))
      Cookies.set('astnote-code-syntax',lang,{expires: 10, path:window.location.pathname});
    $('#syntax_dropdown').dropdown('set selected',$('#syntax_menu .item[syntax="'+lang+'"]').text());
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
    $('#syntax_menu .item').on('click',function(){coder.syntax.update($(this).attr('syntax'))});
    $('#theme_menu .item').on('click',function(){coder.theme.set($(this).attr('theme'))});
    coder.theme.load();
    coder.syntax.load();
    coder.warpmode(true);
  });

  coder.editor = ace.edit(editor.target);
  coder.session = coder.editor.getSession();
  coder.editor.$blockScrolling = Infinity;
  coder.session.setUseWorker(false);

  editor.bind_meta('syntax',function(snapshot)
  {
    coder.syntax.set(snapshot.val());
  });
  return Firepad.fromACE(editor.ref, coder.editor, {userId: editor.user_id});
}


var editor = {};
editor.init = function(firepadRef, target, userId, mode)
{
  editor.ref = firepadRef;
  editor.mode = mode;
  editor.user_id = userId;
  editor.target = target;
  editor.meta_ref = editor.ref.child('meta');
  editor.bind_meta('title',function(dataSnapshot){
    $('#editor_title_input').val(dataSnapshot.val());
    editor.title = dataSnapshot.val();
    document.title = (editor.title || 'Editor') + ' - Astnote';
    historys.renew();
  });
  if (mode == 'c')
  {
    //Editor Init
    editor.firepad = coder.init(editor);
    editor.dumps = function(){return editor.firepad.getText()};
    editor.ext = coder.syntax.get_ext;
  }
  else if (mode == 'r')
  {
    //rich text
    var codeMirror = CodeMirror(document.getElementById(target), { lineWrapping: true });
    editor.firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
        { richTextToolbar: true, richTextShortcuts: true, userId: userId});
    editor.ext = function(){return 'html';};
    editor.dumps = function(){
      return '<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>'+(editor.title||'Astnote')+'</title></head><body>'+editor.firepad.getHtml() + '</body></html>';
    }
  }
  else
  {
    //plain or markdown mode
    var codeMirror = CodeMirror(document.getElementById(target), { lineWrapping: true });
    editor.firepad = Firepad.fromCodeMirror(firepadRef, codeMirror, { userId: userId});
    editor.ext = function(){return 'text';};
    editor.dumps = function(){return editor.firepad.getText()};
  }
  if (mode == 'm')
  {
    markdown.init(editor);
    editor.ext = function(){return 'md';};
  }

  return editor;
}
editor.save = function(filename)
{
  filename = filename || editor.get_file_name();
  download(filename,editor.dumps());
}
editor.update_meta = function(key,data)
{
  editor.meta_ref.child(key).set(data);
}
editor.bind_meta = function(key,on_value)
{
  editor.meta_ref.child(key).on('value',on_value);
}
editor.get_file_name = function()
{
  return (editor.title||'Astnote')+'-'+(new Date()).toISOString().replace(/:|-/g,'').replace(/T/g,'-').slice(0,15)+'.'+editor.ext();
}

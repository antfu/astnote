/*
* @Author: Anthony
* @Date:   2016-04-06 01:57:54
* @Last Modified by:   Anthony
* @Last Modified time: 2016-04-07 01:02:31
*/

'use strict';

/*=== Cookies ===*/
function access_cookies(key,value)
{
  var settings = Cookies.getJSON('fireboard_settings');
  settings = settings || {};
  if (key == undefined)
    return settings;
  if (value == undefined)
    return settings[key];
  settings[key]=value;
  return Cookies.set('fireboard_settings',settings,{ expires: 90 });
}

/*=== Url parameter ===*/
function get_url_parameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;
  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function ramdom_hsv()
{
  var golden_ratio_conjugate = 0.618033988749895;
  if (!ramdom_hsv.h)
    ramdom_hsv.h = Math.random();
  ramdom_hsv.h += golden_ratio_conjugate;
  ramdom_hsv.h %= 1;
  var rgb = HSVtoRGB(ramdom_hsv.h,0.5,0.95);
  return rgbToHex(rgb.r,rgb.g,rgb.b);
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

var get_file_name = function(ext)
{
  ext = ext || 'txt';
  return 'astnote-{{name}}-'+(new Date()).toISOString().replace(/:|T/g,'-')+'.'+ext;
}

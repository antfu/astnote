/*
* @Author: Anthony
* @Date:   2016-04-06 01:57:54
* @Last Modified by:   Anthony
* @Last Modified time: 2016-04-06 04:54:05
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

function format_history(url,len_of_root)
{
  len_of_root = len_of_root || 0;
  return url.slice(len_of_root,url.length-6)
}
# -*- coding: utf-8 -*-
# @Author: Anthony
# @Date:   2016-03-30 12:48:58
# @Last Modified by:   Anthony
# @Last Modified time: 2016-04-06 04:44:06

import sys
import json
import hashlib
import time
import tornado.web
import tornado.httpserver
import tornado.ioloop
import tornado.options
from   configs.config   import configs

def get_authcode(mode,name):
    return hashlib.md5((mode + ':' + name + ':ant').encode()).hexdigest()[:6]

class base_handler(tornado.web.RequestHandler):
    def get_template_namespace(self):
        ns = super(base_handler, self).get_template_namespace()
        ns.update({
            'root': configs.root,
            'firebase': configs.firebase
        })
        return ns

class index_handler(base_handler):
    def get(self):
        self.render('index.html')

class random_handler(base_handler):
    def get(self,mode):
        name = get_authcode('random',str(time.time()))
        authcode = get_authcode(mode,name)
        self.redirect(configs.root+'/{mode}/{name}/{auth}'.format(mode=mode,name=name,auth=authcode))

class create_handler(base_handler):
    def get(self,mode,name):
        authcode = get_authcode(mode,name)
        self.redirect(configs.root+'/{mode}/{name}/{auth}'.format(mode=mode,name=name,auth=authcode))

class text_editors_handler(base_handler):
    def get(self,mode,name,authcode):
        if authcode == get_authcode(mode,name):
            self.render('editor.html',mode=mode,name=name)
        else:
            self.render('error.html',error_code='Auth Failed',error_display='Maybe you got a wrong url.')


class code_editors_handler(base_handler):
    def get(self,name,authcode):
        if authcode == get_authcode('c',name):
            self.render('editor.html',mode='c',name=name)
        else:
            self.render('error.html',error_code='Auth Failed',error_display='Maybe you got a wrong url.')

class not_found_handler(base_handler):
    def get(self):
        self.render('error.html',error_code='404',error_display='Page Not Found')

args = sys.argv
args.append("--log_file_prefix=logs/web.log")
tornado.options.parse_command_line()
app = tornado.web.Application(
    handlers=[
        (r'/',index_handler),
        (r'/random/(r|t|c)',random_handler),
        (r'/ant/create/(r|t|c)/(\w+)',create_handler),
        (r'/(r|t)/(\w+)/(\w+)',text_editors_handler),
        (r'/c/(\w+)/(\w+)',code_editors_handler),
        (r'.*',not_found_handler)
    ],
    template_path='template',
    static_path='static',
    debug=True
)
http_server = tornado.httpserver.HTTPServer(app)
http_server.listen(configs.port)
tornado.ioloop.IOLoop.instance().start()
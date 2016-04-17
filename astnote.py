#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-

import sys
import json
import hashlib
import random
import string
import glob
import tornado.web
import tornado.httpserver
import tornado.ioloop
import tornado.options
from   configs.config   import configs
import minifier

def get_authcode(mode,name,amount=3):
    return str(int(hashlib.md5((mode + ':' + name + ':ant').encode()).hexdigest(),16))[-amount:]

class base_handler(tornado.web.RequestHandler):
    def get_template_namespace(self):
        ns = super(base_handler, self).get_template_namespace()
        ns.update({
            'firebase': configs.firebase,
            'min': configs.minify
        })
        return ns

class index_handler(base_handler):
    def get(self):
        self.render('index.html')

class random_handler(base_handler):
    def get(self,mode):
        name = ''.join([random.choice(string.digits) for x in range(6)])
        authcode = get_authcode(mode,name)
        self.redirect('/{mode}/{name}/{auth}'.format(mode=mode,name=name,auth=authcode))

class create_handler(base_handler):
    def get(self,mode,name):
        authcode = get_authcode(mode,name)
        self.redirect('/{mode}/{name}/{auth}'.format(mode=mode,name=name,auth=authcode))

class editors_handler(base_handler):
    def get(self,mode,name,authcode):
        if authcode == get_authcode(mode,name):
            self.render('editor.html',mode=mode,name=name,authcode=get_authcode(mode,name,16))
        else:
            self.render('error.html',error_code='Wrong Verify Code',error_display="Please check your url and try again.".format(authcode))

quick_join_clients = {}
quick_join_hosts = {}

class quick_join_handler(base_handler):
    @tornado.web.asynchronous
    def get(self,key):
        self.side = 'client'
        self.key = key
        if key in quick_join_hosts.keys():
            host = quick_join_hosts[key]
            self.write(host.url)
            host.write('OK')
            host.finish()
            del(quick_join_hosts[key])
            self.finish()
        elif key in quick_join_clients.keys():
            self.finish()
        else:
            quick_join_clients[key] = self

    @tornado.web.asynchronous
    def post(self,key):
        self.side = 'host'
        self.key = key
        self.url = self.get_argument('url',None)
        if not self.url:
            self.finish()
        elif key in quick_join_clients.keys():
            client = quick_join_clients[key]
            client.write(self.url)
            client.finish()
            del(quick_join_clients[key])
            self.write('OK')
            self.finish()
        elif key in quick_join_hosts.keys():
            self.finish()
        else:
            quick_join_hosts[key] = self

    def on_connection_close(self):
        if self.side == 'host':
            if self.key in quick_join_hosts.keys():
                del(quick_join_hosts[self.key])
        elif self.side == 'client':
            if self.key in quick_join_clients.keys():
                del(quick_join_clients[self.key])

class not_found_handler(base_handler):
    def get(self):
        self.render('error.html',error_code='404',error_display='Page Not Found')

def globset(pattern):
    return set(glob.glob(pattern))

def minify():
    targets = set(glob.glob('static/*.js') + glob.glob('static/*.css')) - set(glob.glob('static/*.min.js') + glob.glob('static/*.min.css'))
    for t in targets:
        minifier.minify(t)
    print('Minify Finished')

if __name__ == '__main__':
    if configs.minify:
        minifier.minify('static/firepad.js')
    args = sys.argv
    args.append("--log_file_prefix=logs/web.log")
    tornado.options.parse_command_line()
    app = tornado.web.Application(
        handlers=[
            (r'/',index_handler),
            (r'/random/(r|t|c|m)',random_handler),
            (r'/ant/(r|t|c|m)/(\w+)',create_handler),
            (r'/(r|t|c|m)/(\w+)/(\w+)',editors_handler),
            (r'/quickjoin/(\w+)',quick_join_handler),
            (r'.*',not_found_handler)
        ],
        template_path='template',
        static_path='static',
        debug=True
    )
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(configs.port)
    tornado.ioloop.IOLoop.instance().start()

import express from 'express'
import path from 'path'
import fs from 'fs'
import favicon from 'serve-favicon'
import bodyParser from 'body-parser'
import expressSession from 'express-session'
import MySQLSession from 'express-mysql-session'
import useragent from 'express-useragent'
import database from './database'
import locale from './locale'
import log from './log'
import File from './file'
import command from './command' // load command
import { NjbPath, DataPath, RunPath, ConfigPath } from './path'
import pug from 'pug'

let app = express()

// config
let config = require(ConfigPath)
app.set('config', config)
app.set('database', database)

// view engine setup
app.set('dirname', __dirname)
app.set('views', path.join(NjbPath, 'pug'))
app.set('view engine', 'pug')

log.load(app)

// Data from the client
let MySQLStore = MySQLSession(expressSession)
var sessionStore = new MySQLStore({ schema: { tableName: 'njb_sessions' }}, database.pool)
app.use(expressSession({
  key: config.cookie.key,
  secret: config.cookie.secret,
  store: sessionStore,
  resave: false,
  secure: true,
  saveUninitialized: true,
}))
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept')
  next()
})
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(useragent.express())

// Public Test
app.use('/', (req, res, next) => {
  let match = null
  if (match = req.url.match('/data/test/(.*)\.html$'))
    pug.renderFile(DataPath+'/test/'+match[1]+'.pug', (err, html) => { if (!err) res.send(html) })
  else
    next()
})

// Public
app.use('/data', express.static(DataPath))
app.use(favicon(path.join(DataPath, 'img/favicon.ico')))

// building and watching files (css, script)
require('./gulp')
let gulpAddPath = path.join(RunPath, 'core/gulp.js')
if (File.exists(gulpAddPath))
  require(gulpAddPath)

// locale
locale.load(true)

// Routes
import load from './load'
import router from './router'
import Catch from './catch'
import Process from './process'
import routerCatch from './router-catch'
load(app)
app.use('/', router)
Catch(app)
app.use('/', Process)
routerCatch(app)

// www
import www from './www'
www(app)

export default app

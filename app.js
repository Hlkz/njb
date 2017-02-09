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
import { CorePath, DataPath, LibPath } from './path'

let app = express()

// config
let config = require(path.join(CorePath, 'site/config/config.json'))
app.set('config', config)

// view engine setup
app.set('dirname', __dirname)
app.set('views', path.join(CorePath, 'njb/pug'))
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
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(useragent.express())

// Public
app.use('/data', express.static(DataPath))
app.use(favicon(path.join(DataPath, 'img/favicon.ico')))

// building and watching files (css, script)
require('./gulp')
let gulpAddPath = LibPath+'/site/gulp.js'
if (File.exists(gulpAddPath))
  require(gulpAddPath)

// locale
locale.load(true)

// Routes
import prefix from './prefix'
import Catch from './catch'
import route from './route'
app.use('/', prefix)
Catch(app)
route(app)

// www
import www from './www'
www(app)

export default app

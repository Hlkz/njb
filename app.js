import path from 'path'
import express from 'express'
import fs from 'fs'
import favicon from 'serve-favicon'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import File from './file'
import { CorePath, DataPath, LibPath } from './path'

let app = express()

// view engine setup
app.set('dirname', __dirname)
app.set('views', path.join(CorePath, 'njb/pug'))
app.set('view engine', 'pug')

import log from './log'
log(app)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/data', express.static(DataPath))
app.use(favicon(path.join(DataPath, 'img/favicon.ico')))

// building and watching files (css, script)
require('./gulp')
let gulpAddPath = LibPath+'/site/gulp.js'
if (File.exists(gulpAddPath))
  require(gulpAddPath)

// config
let config = require(path.join(CorePath, 'site/config/config.json'))
app.set('config', config)

// locale
import locale from './locale'
app.set('locale', locale)
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

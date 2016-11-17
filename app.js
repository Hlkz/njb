import path from 'path'
import express from 'express'
import favicon from 'serve-favicon'
import logger from 'morgan'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import File from './file'
import { CorePath, DataPath, LibPath } from './path'


let app = express()

app.njb_config = {
  pageonly_enabled: true,
}

// view engine setup
app.set('dirname', __dirname)
app.set('views', path.join(CorePath, 'njb/pug'))
app.set('view engine', 'pug')

app.use(logger('dev'))
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

// database setup
import mysql from 'mysql'
let config_db = config.database
let db
function mysqlConnect() {
  db = mysql.createConnection({
    host     : config_db.host,
    user     : config_db.user,
    password : config_db.password,
    database : config_db.database
  })
  db.connect(function(err) {
    if (err) {
      console.log('error when connecting to db:', err)
      setTimeout(mysqlConnect, 2000)
    }
  })
  db.on('error', function(err) {
  	console.log('db error', err)
  	if (err.code ==='PROTOCOL_CONNECTION_LOST')
      mysqlConnect()
  	else
  		throw err
  })
  db.prefix = config_db.prefix
}
mysqlConnect()
app.set('database', db)

// locale
import locale from './locale'
app.set('locale', locale)
locale.load(db)

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
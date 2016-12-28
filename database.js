import mysql from 'mysql'
import common from './common'
import { CorePath } from './path'
let config = require(CorePath+'/site/config/config.json')

let config_db = config.database
let db

let mysqlConnect = () => {
  db = mysql.createConnection({
    host     : config_db.host,
    user     : config_db.user,
    password : config_db.password,
    database : config_db.database
  })
  db.connect(err => {
    if (err) {
      common.mysql_error(err)
      setTimeout(mysqlConnect, 2000)
    }
  })
  db.on('error', err => {
    console.log('db error', err)
    if (err.code ==='PROTOCOL_CONNECTION_LOST')
      mysqlConnect()
    else
      common.mysql_error(err)
  })
  db.prefix = config_db.prefix
}

let load = () => {
  mysqlConnect()
}

load()

export { db }
import mysql from 'mysql'
import common from './common'
import log from './log'
import { CorePath } from './path'
let config = require(CorePath+'/site/config/config.json')

let config_db = config.database

let pool = mysql.createPool({
  host     : config_db.host,
  user     : config_db.user,
  password : config_db.password,
  database : config_db.database,
  port     : 3306
})

let query = function() {
  let sql_args = []
  let args = common.duplicateArray(arguments)
  let callback = args[args.length-1] //last arg is callback
  pool.getConnection((err, connection) => {
    if (err) {
      log.mysql_error(err)
      return callback(err)
    }
    if (args.length > 2)
      sql_args = args.slice(1, args.length-1)
    connection.query(args[0], sql_args, (err, results, fields) => {
      connection.release() // always put connection back in pool after last query
      if (err) {
        log.mysql_error(err)
        return callback(err)
      }
      callback(null, results, fields)
    })
  })
}

export default {
  query,
  prefix: config_db.prefix
}

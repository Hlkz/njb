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
    // if (sql_args.length && Array.isArray(sql_args[0]))
    //   sql_args = sql_args.map(arg => common.isString(arg) ? mysql_real_escape_string(arg) : arg)
    let query_obj = connection.query(args[0], sql_args, (err, results, fields) => {
      connection.release() // always put connection back in pool after last query
      if (err) {
        log.mysql_error(err)
        log.mysql_query(query_obj.sql)
        return callback(err)
      }
      else
        return callback(null, results, fields)
    })
  })
}

let query_c = function() { // query, args, err_func, err_str, func
  let args = common.duplicateArray(arguments)
  if (args.length < 2)
    return
  let callback = args.splice(-1)[0]
  if (!common.isFunction(callback))
    return

  let err_callback = null
  let err_str = null
  if (args.length > 1 && common.isFunction(args[args.length-1]))
    err_callback = args.splice(-1)[0]
  else if (args.length > 2 && common.isFunction(args[args.length-2])) {
    err_str = args.splice(-1)[0]
    err_callback = args.splice(-1)[0]
  }
  if (!err_str)
    err_str = 'sql error'

  args.push((err, results, fields) => {
    if (err) {
      if (err_callback)
        err_callback(err_str)
    }
    else
      callback(results, fields)
  })
  query(...args)
}

let mysql_real_escape_string = str => str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
  switch (char) {
    case "\0": return "\\0";
    case "\x08": return "\\b";
    case "\x09": return "\\t";
    case "\x1a": return "\\z";
    case "\n": return "\\n";
    case "\r": return "\\r";
    case "\"":
    case "'":
    case "\\":
    case "%": return "\\"+char; // prepends a backslash to backslash, percent, and double/single quotes
  }
})

// Query API

// table object
// table.database = 'dbname'
// table.name = 'tablename'
// table.keys = [ 'primary1', 'primary2' ]
// table.fields = [ 'primary1', 'primary2', 'other', 'fields' ]

// row object 
// { 'primary1': 42, 'primary2': 1337, 'other': "somedata" }

function checkTable(table) {
  if (!table.keys || !table.keys.length)
    return false

  table.keys.forEach(key=>{
    if (!key || !key.length)
      return false
  })

  table.fields.forEach(field=>{
    if (!field || !field.length)
      return false
  })
  return true
}

function checkTableRow(table, row) {
  table.keys.forEach(key => {
    if (!Object.keys(row).find(field => field === key))
      return false
  })
  Object.keys(row).forEach(field => {
    if (!table.fields.find(e => e === field))
      return false
  })
  return true
}

// function select(table, row, callback) {
//   if (!checkTable(table) || !checkTableRow(table, row))
//     return false

//   let WHERE = 'WHERE ' + table.keys.map(key => key + ' = \'' + (common.isString(row[key]) ? mysql_real_escape_string(row[key]) : row[key]) + '\'').join(' AND ')
//   let string = 'SELECT ' + table.fields.join(', ') + ' FROM ' + (table.database ? table.database + '.' : '') + table.name + ' ' + WHERE
//   query(string, row, callback)
// }

function insert(table, row, callback) {
  if (!checkTable(table) || !checkTableRow(table, row))
    return false

  let string = 'INSERT INTO ' + (table.database ? table.database + '.' : '') + table.name + ' SET ?'
  query(string, row, callback)
}

function update(table, row, callback) {
  if (!checkTable(table) || !checkTableRow(table, row))
    return false

  let WHERE = 'WHERE ' + table.keys.map(key => key + ' = \'' + (common.isString(row[key]) ? mysql_real_escape_string(row[key]) : row[key]) + '\'').join(' AND ')
  let string = 'UPDATE ' + (table.database ? table.database + '.' : '') + table.name + ' SET ? ' + WHERE
  query(string, row, callback)
}

function deleteFrom(table, row, callback) {
  if (!checkTable(table) || !checkTableRow(table, row))
    return false

  let WHERE = 'WHERE ' + table.keys.map(key => key + ' = \'' + (common.isString(row[key]) ? mysql_real_escape_string(row[key]) : row[key]) + '\'').join(' AND ')
  let string = 'DELETE FROM ' + (table.database ? table.database + '.' : '') + table.name + ' ' + WHERE
  query(string, callback)
}

export default {
  pool,
  query,
  query_c,
  mysql_real_escape_string,
  //prefix: config_db.prefix
  // select,
  insert,
  update,
  deleteFrom,
}

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
// row.fields = { 'primary1': 42, 'primary2': 1337, 'other': "somedata" }

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
    if (!Object.keys(row.fields).find(field => field === key))
      return false
  })
  Object.keys(row.fields).forEach(field => {
    if (!table.fields.find(e => e === field))
      return false
  })
  return true
}

function insert(table, row, callback = null) {
  if (!checkTable(table) || !checkTableRow(table, row))
    return false

  let string = 'INSERT INTO ' + (table.database ? table.database + '.' : '') + table.name + ' SET ?'
  query(string, row.fields, function(err) {
    if (callback)
      callback()
    return true
  })
}

function update(table, row, callback = null) {
  if (!checkTable(table) || !checkTableRow(table, row))
    return false

  let WHERE = 'WHERE ' + table.keys.map(key => key + ' = \'' + (common.isString(row.fields[key]) ? mysql_real_escape_string(row.fields[key]) : row.fields[key]) + '\'').join(' AND ')
  let string = 'UPDATE ' + (table.database ? table.database + '.' : '') + table.name + ' SET ? ' + WHERE
  query(string, row.fields, function(err) {
    if (callback)
      callback()
    return true
  })
}

function deleteFrom(table, row, callback = null) {
  if (!checkTable(table) || !checkTableRow(table, row))
    return false

  let WHERE = 'WHERE ' + table.keys.map(key => key + ' = \'' + (common.isString(row.fields[key]) ? mysql_real_escape_string(row.fields[key]) : row.fields[key]) + '\'').join(' AND ')
  let string = 'DELETE FROM ' + (table.database ? table.database + '.' : '') + table.name + ' ' + WHERE
  query(string, function(err) {
    if (callback)
      callback()
    return true
  })
}

export default {
  pool,
  query,
  mysql_real_escape_string,
  //prefix: config_db.prefix
  insert,
  update,
  deleteFrom,
}

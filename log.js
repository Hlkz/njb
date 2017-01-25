import FileStreamRotator from 'file-stream-rotator'
import fs from 'fs'
import morgan from 'morgan'
import path from 'path'
import common from './common'
import { LogPath } from './path'

fs.existsSync(LogPath) || fs.mkdirSync(LogPath)

let logStream = name => FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(LogPath, name+'-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})

let checkTime = i => (i < 10) ? '0' + i : i

let dateString = () => {
  let d = new Date()
  return '[' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString() + ']'
}

let info = str => {
  str = dateString() + ' ' + str
  writeLog('log', str)
  console.log(str)
}

let error = str => {
  if (str) {
    str = dateString() + ` Error
` + str
    writeLog('log', str)
    writeLog('error', str)
    console.log(str)
  }
}

let mysql_error = str => {
  if (str) {
    str = dateString() + ` Database Error
` + str
    writeLog('mysql', str)
    console.log(str)
  }
}

let load = app => {
  app.use(morgan('combined', {stream: logStream('access')}))
}

let writeLog = (name, data) => logStream(name).write(data+`
`, null)

export default {
  load,
  info,
  error,
  mysql_error
}

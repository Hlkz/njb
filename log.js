import FileStreamRotator from 'file-stream-rotator'
import fs from 'fs'
import morgan from 'morgan'
import path from 'path'
import common from './common'
import { LogPath } from './path'

fs.existsSync(LogPath) || fs.mkdirSync(LogPath)

let accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(LogPath, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})

export default (app) => {
  app.use(morgan('combined', {stream: accessLogStream}))
}

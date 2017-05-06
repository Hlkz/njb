import path from 'path'
import File from './file'

let RunPath = path.join(__dirname, '..')

let RootPath = path.join(__dirname, '..')
if (!File.exists(path.join(RunPath, 'package.json')))
  RootPath = path.join(RootPath, '..')

let CorePath = path.join(RootPath, 'core')
let NjbPath = path.join(RootPath, 'njb')
let DataPath = path.join(RootPath, 'data')
let LogPath = path.join(RootPath, 'log')
let ConfigPath = path.join(RootPath, 'config', 'config.json')

export { RunPath, RootPath, CorePath, NjbPath, DataPath, LogPath, ConfigPath}
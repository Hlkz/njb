console.log('Start')

import path from 'path'
let CorePath = path.join(__dirname, '..', '..', 'core')
let DataPath = path.join(__dirname, '..', '..', 'data')
let LibPath = path.join(__dirname, '..')
let LogPath = path.join(__dirname, '..', '..', 'log')

export { CorePath, DataPath, LibPath, LogPath }
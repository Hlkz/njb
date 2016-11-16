console.log('Start')

import path from 'path'
let CorePath = path.join(__dirname, '..', '..', 'core')
let DataPath = path.join(__dirname, '..', '..', 'data')
let LibPath = path.join(__dirname, '..')

export { CorePath, DataPath, LibPath }
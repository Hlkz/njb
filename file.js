import fs from 'fs'
import path from 'path'

export default {
  exists: fp => {
    try {
      fs.accessSync(fp)
      return true
    } catch (err) {
      return false
    }
  },
  read: fp => fs.readFileSync(fp, 'utf8')
}

import log from './log'
import db from './database'
import File from './file'
import locale from './locale'
import { LibPath } from './path'

let env = process.env.NODE_ENV

export default (app) => {
  // Load pages
  let pages = []
  let query = 'SELECT name, base, path, fr, en, regexfr, regexen, layout FROM njb_pages WHERE !hidden'
  db.query(query, function(err, rows) {
    if (!err) {
      pages = rows
      pages.forEach(page => {
        if (page['path'] !== '') {
          let jsPath = LibPath+'/site/page/'+page['path']+'.js'
          if (File.exists(jsPath)) {
            let js = require(jsPath)
            page['js'] = js
          }
        }
        page['urlfr'] = '/'+(page['base']+'/'+page['fr']).match(/^\/{0,}(.*)$/)[1]
        page['urlen'] = '/'+(page['base']+'/'+page['en']).match(/^\/{0,}(.*)$/)[1]
      })
      app.set('pages', pages)
      // Store pages_by_name in locale (for links generation)
      let pages_by_name = locale.pages_by_name = {}
      pages.forEach(page => {
        pages_by_name[page['name']] = page
      })
      log.info('Server Router ready')
    }
  })
}

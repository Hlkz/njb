import pug from 'pug'
import common from './common'
import { CorePath } from './path'

module.exports = function Render(req, res, page, isContent) {
  let dirname = req.app.get('dirname')

  let loadfull = !isContent
  let locale = req.locale
  //console.log('finalize')
  
  let js = page['js']
  let title = ''
  if (js && js.getTitle)
    title = js.getTitle()
  else
    title = locale.t('title-'+page['name'])

  let locals = {}
  common.mergeObj(locals, res.viewLocals)
  locals.pages = locale.pages_by_name
  locals.t = locale

  if (!isContent || loadfull) {
    let menulinks = require(CorePath+'/site/config/menulinks.json')
    locals.title = title
    locals.current = page['url'+locale.locale]
    locals.menulinks = menulinks
  }

  let pugFilePage = name => CorePath+'/site/page/'+name+'.pug'
  let pugFileLayout = name => CorePath+'/site/page/layout/'+name+'.pug'

  let view = pugFilePage(page['path'])
  let viewLayout = pugFileLayout('default')
  if (page['layout'] !== '')
    viewLayout = pugFileLayout(page['layout'])

  if (!isContent && !loadfull)
    view = viewLayout

  function treat(err, html) {
    if (err) return common.error(err)

    if (!isContent && !loadfull) // Only layout
      res.send(html)
    else
      res.render('page', { title: title, path: locals.pagePath, page: html }, (err, html) => {
        if (err) return common.error(err)

        if (!loadfull)
          res.send(html) // Only page
        else {
          locals.content = html
          pug.renderFile(viewLayout, locals, (err, html) => {
            if (err) return common.error(err)
            res.send(html) // Full page
          })
        }
      })
  }
  if (js && js.pug)
    pug.render(js.pug, locals, treat)
  else
    pug.renderFile(view, locals, treat)
}

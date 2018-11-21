import pug from 'pug'
import common from './common'
import log from './log'
import { CorePath } from './path'

module.exports = function Render(req, res, page, isContent) {
  let dirname = req.app.get('dirname')

  let loadfull = !isContent
  let locale = req.njb_locale
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
  locals.admin = req.session.admin

  if (!isContent || loadfull) {
    locals.title = title
    locals.current = req.url // page['url'+locale.locale]
    locals.menulinks = req.app.get('njb_menulinks')
  }

  let pugFilePage = name => CorePath+'/page/'+name+'.pug'
  let pugFileLayout = name => CorePath+'/page/layout/'+name+'.pug'

  let view = pugFilePage(page['path'])
  let viewLayout = pugFileLayout('default')
  if (page['layout'] !== '')
    viewLayout = pugFileLayout(page['layout'])

  if (!isContent && !loadfull)
    view = viewLayout

  function treat(err, html) {
    if (err) return log.error(err)

    if (!isContent && !loadfull) // Only layout
      res.send(html)
    else
      res.render('page', { title: title, path: locals.pagePath, page: html, swapPath: locale.getSwapLangUrl() }, (err, html) => {
        if (err) return log.error(err)

        if (!loadfull)
          res.send(html) // Only page
        else {
          locals.content = html
          pug.renderFile(viewLayout, locals, (err, html) => {
            if (err) return log.error(err)
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

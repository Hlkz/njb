import log from './log'
import File from './file'
import Render from './render'
import db from './database'
import common from './common'
import { CorePath } from './path'

export default (req, res, next) => {
  let page = req.njb_page
  let isContent = req.njb_isContent

  if (!page) {
    next()
    return
  }

  // Page exists => proceed

  let locale = req.locale
  let loca = req.locale.locale
  
  // Setting pug variables
  res.viewLocals = {}
  res.viewLocals[ 'pagePath', 'post', 'form', 'error' ]
  let protectedKeys = [ 'pagePath' ]
  res.setPost = (post = true) => { res.viewLocals['post'] = post }
  res.setForm = (form = 0) => { res.viewLocals['form'] = form }
  res.setError = str => { res.viewLocals['error'] = str }
  res.setData = (key, data) => { if (!protectedKeys.includes(key)) res.viewLocals[key] = data }
  // Special
  res.setPath = path => { res.viewLocals['pagePath'] = path }
  // test
  res.viewLocals['data'] = {}
  res.setdata = (key, data) => { res.viewLocals.data[key] = data }

  locale.setPage(page['name'])
  let js = page['js']

  //log
  log.info('Page: ' + page['name'] + ' ('+(isContent?'component':'full page')+')')
  let ua = req.useragent
  db.query('INSERT INTO njb_access_log SET ?', {
    page: page['name'],
    address: page[loca],
    ip: req.headers['x-forwarded-for'],
    browser: ua.browser,
    version: ua.version,
    os: ua.os,
    platform: ua.platform,
    source: ua.source,
    type: ua.isDesktop ? 'desktop' : ua.isMobile ? 'mobile' : ua.isBot ? 'bot' : 'other'
  }, ()=>{})

  let promises = []
  if (js && js.PreLoad)
    promises.push(js.PreLoad(req, res, isContent))
  Promise.all(promises).then(() => {

    locale.setNames(['default', page['name']])

    promises = []
    promises.push(locale.loadPage())
    if (isContent)
      promises.push(common.getpost(req))

    if (js && js.LoadSync)
      promises.push(js.LoadSync(req, res, isContent))
    Promise.all(promises).then(() => {

      promises = []
      if (js && js.Load)
        promises.push(js.Load(req, res, isContent))
      Promise.all(promises).then(() => {

        Render(req, res, page, isContent)

      }, log.error)
    }, log.error)
  }, log.error)
}

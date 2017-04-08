// Treat prefix host url
// Set language (fr.domain.com/url or domain.com/fr/url)
// Lookup page for url

import locale from './locale'
import { CorePath } from './path'
let config = require(CorePath+'/site/config/config.json')

export default (req, res, next) => {
  let host = req.get('host')
  let domain = config.address
  let prefix = ''
  let port = ''
  let url = req.url
  // console.log('HOST', host)
  let match = null
  if (match = host.match('^(.*)'+domain+':{0,}([0-9]{0,})$')) {
    prefix = match[1].slice(0,-1)
    port = match[2]
  } else {
    res.status(404).end()
    return false
  }
  // console.log('PREFIX', prefix)
  // console.log('DOMAIN', domain)
  // console.log('PORT', port)
  // console.log('URL', url)
  let rest = domain + (port?':'+port:'') + url
  let baseRedirect = 'http://' + domain + (port?':'+port:'')

  //
  // Language
  //

  let language = locale.treatConfig(config.language)
  let isContent = false

  if (language && language.mode === 'prefix') {
    let newLocale = req.locale = {}
    Object.setPrototypeOf(newLocale, locale)
    if (language.list.includes(prefix)) {
      newLocale.setLocale(prefix)
    } else if (['', 'www'].includes(prefix)) {
      newLocale.setLocale(language.list[0])
    } else {
      res.redirect(baseRedirect)
      return
    }
  }

  if (url.substring(0, 6) === '/page/') {
    isContent = true
    url = url.substring(5)
  }

  if (language && language.mode === 'path') {
    let newLocale = req.locale = {}
    Object.setPrototypeOf(newLocale, locale)
    if (url === '/')
      newLocale.setLocale(language.list[0])
    else if (url.length === 3) {
      let lang, sub = url.substring(0, 3)
      if (lang = language.list.find(lang => sub === '/'+lang)) {
        newLocale.setLocale(lang)
        url = url.substring(3)
      }
      else {
        res.redirect(baseRedirect)
        return
      }
    } else {
      let lang, sub = url.substring(0, 4)
      if (lang = language.list.find(lang => sub === '/'+lang+'/')) {
        newLocale.setLocale(lang)
        url = url.substring(3)
      }
      else {
        res.redirect(baseRedirect)
        return
      }
    }
  }

  //
  // Page router
  //

  let page = null

  const str = decodeURIComponent(url.substring(1))
  let loca = req.locale.locale

  page = req.app.get('pages').find(page => {
    let regexStr = page['regex'+loca]
    if (regexStr === '') {
      if (str === page[loca])
        return true
    }
    else {
      let regex = new RegExp('^'+regexStr+'$')
      if (regex.exec(str))
        return true
    }
  })
  // if (!page) { // Last process for non registred pages
  //   let jsPath = CorePath+'/site/page/'+str+'.js'
  //   let pugPath = CorePath+'/site/page/'+str+'.pug'
  //   let js = null
  //   if (File.exists(jsPath))
  //     js = require(jsPath)
  //   if ((js && js.pug) || File.exists(pugPath))
  //     page = NewPage(str, js)
  // }
  req.njb_page = page
  req.njb_isContent = isContent

  next()
}

function NewPage(path, js = null) {
  return {
    name: path,
    base: '',
    path: path,
    fr: path,
    en: path,
    regexfr: '',
    regexen: '',
    layout: '',
    urlfr: '/'+path,
    urlen: '/'+path,
    js: js
  }
}

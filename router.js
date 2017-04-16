import locale from './locale'
import { CorePath } from './path'
const config = require(CorePath+'/site/config/config.json')

// Express middleware for njb
// set:
// req.njb_locale // instance of './locale' with request language
// req.njb_page // pointer to page Object
// req.njb_isContent // if full page requested or content only

export default (req, res, next) => {
  const host = req.get('host')
  const domain = config.address
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
  const rest = domain + (port?':'+port:'') + url
  const baseRedirect = 'http://' + domain + (port?':'+port:'')

  //
  // Language
  //

  const language = locale.treatConfig(config.language)
  let isContent = false
  let newLocale = req.njb_locale = {}
  Object.setPrototypeOf(newLocale, locale)

  if (language && language.mode === 'prefix') {
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
    if (url === '/')
      newLocale.setLocale(language.list[0])
    else {
      let lang, sub = url.substring(0, 4)
      if (lang = language.list.find(lang => sub === '/'+lang + (sub.length > 3 ? '/' : ''))) {
        newLocale.setLocale(lang)
        url = url.substring(3)
      }
      else {
        res.redirect(baseRedirect)
        return
      }
    }
  }

  req.njb_locale = newLocale

  //
  // Page router
  //

  let page = null
  const loca = req.njb_locale.locale

  const str = decodeURIComponent(url.substring(1))

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

const NewPage = (path, js = null) => ({
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
  js: js,
})

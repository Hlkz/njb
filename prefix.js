import locale from './locale'
import { CorePath } from './path'
let config = require(CorePath+'/site/config/config.json')

export default (req, res, next) => {
  let host = req.get('host')
  let domain = config.address
  let prefix = ''
  let port = ''

  //console.log('HOST', host)
  let match = null
  if (match = host.match('^(.*)'+domain+':{0,}([0-9]{0,})$')) {
    prefix = match[1].slice(0,-1)
    port = match[2]
  } else {
    res.status(404).end()
    return false
  }
  //console.log("PREFIX", prefix)
  //console.log("DOMAIN", domain)
  //console.log("PORT", port)

  let newLocale = req.locale = {}
  Object.setPrototypeOf(newLocale, locale)

  switch(prefix) {
    case '':
    case 'www':
      newLocale.setLocale('fr')
      break
    case 'en':
      newLocale.setLocale('en')
      break
    default:
      res.redirect('http://'+domain)
      return false
  }
  next()
}
export default (req, res, next) => {
    let host = req.get('host')
    let domain = ''
    let prefix = ''
    //console.log('HOST', host)
    let match = null
    if (match = host.match('^(.*)(localhost:{0,}[0-9]{0,})$')) {
      prefix = match[1].slice(0,-1)
      domain = match[2]
    } else {
      domain = host.split('.').slice(-2).join('.')
      if (match = host.match('^(.*)'+domain+'$')) {
        prefix = match[1].slice(0,-1)
      }
      else {
        res.status(404).end()
        return false
      }
    }
    //console.log("DOMAIN", domain)
    //console.log("PREFIX", prefix)

    let locale = req.locale = {}
    Object.setPrototypeOf(locale, req.app.get('locale'))

    switch(prefix) {
      case '':
      case 'fr':
        locale.setLocale('fr')
        break
      case 'en':
        locale.setLocale('en')
        break
      default:
        res.status(404).end()
        return false
    }
    next()
}
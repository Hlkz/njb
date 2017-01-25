import pug from 'pug'
import common from './common' // error handle only
import db from './database'

// // Set lib to var / load it 
// let db = mysql.createConnection()
// db.prefix = 'string' // tables prefix_locale_t, prefix_locale_txt, prefix_locale_pug
// import Locale from './locale'
// Locale.load(db)
// // Create instance of lib for each viewer 
// let locale = req.locale = {}
// Object.setPrototypeOf(locale, Locale)
// locale.setLocale('fr') // 'fr' or 'en'
// locale.setNames(['string', 'array'])
// locale.loadPage().then
// // Translate 
// locale.t()
// locale.pug()

const _loc = { fr:0, en:1 }

let Locale = {}

//
// Public
//

Locale.load = function (allowPageContentOnly = true) {
  this.allowPageContentOnly = allowPageContentOnly
}

Locale.setLocale = function(locale) {
  this.locale = locale
  this.loc = _loc[locale]
}

Locale.setNames = function(names) {
  if (!Array.isArray(names))
    names = [ names ]
  this.names = names
}

Locale.loadPage = function() {
  return new Promise((resolve, reject) => {
    let loadContent = []
    this.names.forEach(name => {
      loadContent.push(this.loadContent(name))
    })
    Promise.all(loadContent).then(() => {
      resolve()
    }, common.error)
  })
}

Locale.locField = function(en, fr) {
  return this.locale === 'en' ? en : fr
}

//
// Private
//

Locale.isContentLoaded = function(name) {
  if (!name)
    return true
  return this.loaded.includes(name)
}

Locale.loadContent = function(name, force = false) {
  return new Promise((resolve, reject) => {
    if (!this.isContentLoaded(name) || force) {
      Promise.all([
        this.loadPage_t(name),
        this.loadPage_txt(name)
      ]).then(() => { // _t & _txt can be used compiling _pug
        this.loadPage_pug(name).then(() => {
          if (!name)
            this.fullLoaded = true
          else if (!this.isContentLoaded(name))
            this.loaded.push(name)
          resolve()
        }, common.error)
      }, common.error)
    }
    else
      resolve()
  })
}

Locale.loadPage_t = function(name) {
  return new Promise((resolve, reject) => {
    name = name === 'default' ? '' : name
    let query = 'SELECT page, name, fr, en FROM '+db.prefix+'locale_t'+(name ? ' WHERE page=\''+name+'\'' : '')
    db.query(query, function(err, rows, fields) {
      if (err) {
        common.mysql_error(err)
        reject()
      }
      else {
        rows.forEach(row => {
          let _page = row['page'] === '' ? 'default' : row['page'], _name = row['name']
          this._t[_page] = this._t[_page] || {}
          this._t[_page][_name] = this._t[_page][_name] || {}
          this._t[_page][_name]['fr'] = row['fr']
          this._t[_page][_name]['en'] = row['en']
        })
        resolve()
      }
    }.bind(this))
  })
}

Locale.loadPage_txt = function(name) {
  return new Promise((resolve, reject) => {
    name = name === 'default' ? '' : name
    let query = 'SELECT page, name, fr, en FROM '+db.prefix+'locale_txt'+(name ? ' WHERE page=\''+name+'\'' : '')
    db.query(query, function(err, rows, fields) {
      if (err) {
        common.mysql_error(err)
        reject()
      }
      else {
        rows.forEach(row => {
          let _page = row['page'] === '' ? 'default' : row['page'], _name = row['name']
          this._txt[_page] = this._txt[_page] || {}
          this._txt[_page][_name] = this._txt[_page][_name] || {}
          this._txt[_page][_name]['fr'] = row['fr']
          this._txt[_page][_name]['en'] = row['en']
        })
        resolve()
      }
    }.bind(this))
  })
}

Locale.loadPugLocale = function(pattern, container, locale, page) {
  return new Promise((resolve, reject) => {
    let locals = {
      t: this,
      locale: locale, page: page,
      dis: {
        locale: locale, page: page,
      }
    }
    pug.render(pattern, locals, (err, html) => {
      if (err) {
        common.error(err)
        container[locale] = null
        reject()
      } else {
        container[locale] = html
      }
      resolve()
    })
  })
}

Locale.loadPage_pug = function(name) {
  return new Promise((resolve, reject) => {
    name = name === 'default' ? '' : name
    let query = 'SELECT page, name, fr, en FROM '+db.prefix+'locale_pug'+(name ? ' WHERE page=\''+name+'\'' : '')
    db.query(query, function(err, rows, fields) {
      if (err) {
        common.mysql_error(err)
        reject()
      }
      else {
        var promises = []
        rows.forEach(row => {
          let _page = row['page'] === '' ? 'default' : row['page'], _name = row['name']
          this._pug[_page] = this._pug[_page] || {}
          this._pug[_page][_name] = this._pug[_page][_name] || {}
          this._pug[_page][_name]['fr'] = null
          this._pug[_page][_name]['en'] = null
          promises.push(this.loadPugLocale(row['fr'], this._pug[_page][_name], 'fr', _page))
          promises.push(this.loadPugLocale(row['en'], this._pug[_page][_name], 'en', _page))
        })
        Promise.all(promises).then(resolve, reject)
      }
    }.bind(this))
  })
}

//
// Translate
//

Locale.t = function (str, self = null) {
  let locale = self ? self.locale : this.locale
  if (!locale) return ''
  let t = ''
  let names = self ? [ 'default', self.page ] : this.names
  names.forEach(name => {
    if (this._t[name])
    if (this._t[name][str])
    if (this._t[name][str][locale])
      t = this._t[name][str][locale]
  })
  return t
}

Locale.txt = function (str, self = null) {
  let locale = self ? self.locale : this.locale
  if (!locale) return ''
  let t = ''
  let names = self ? [ 'default', self.page ] : this.names
  names.forEach(name => {
    if (this._txt[name])
    if (this._txt[name][str])
    if (this._txt[name][str][locale])
      t = this._txt[name][str][locale]
  })
  return t
}

Locale.pug = function (str, self = null) {
  let locale = self ? self.locale : this.locale
  if (!locale) return ''
  let t = ''
  let names = self ? [ 'default', self.page ] : this.names
  names.forEach(name => {
    if (this._pug[name])
      if (this._pug[name][str])
        if (this._pug[name][str][locale])
          t = this._pug[name][str][locale]
  })
  return t
}

//
// Specific for site-lps
//

Locale.getPageLink = function(name, title = null, self = null) {
  let locale = self ? self.locale : this.locale
  if (!locale) return ''
  let page = this.pages_by_name[name]
  if (page) {
    let pagePath = page['url'+locale]
    if (!title)
      title = this.t('menu-'+name, self)
    if (!title)
      title = this.t('title-'+name, self)

    if (this.allowPageContentOnly)
      return pug.render('a.loadpage(href=\''+pagePath+'\', page-path=\''+pagePath+'\') '+title)
    else
      return pug.render('a(href=\''+pagePath+'\') '+title)
  }
  return ''
}

Locale.getLink = function(href, name) {
  return pug.render('a(href=\''+href+'\') '+this.t(name))
}

Locale.getToggleDivLink = function(div, textShow, textHide) {
  textShow = textShow || 'show'
  textHide = textHide || 'hide'
  return pug.render('a(href=\'#\', toggle-div=\''+div+'\', text-show=\''+this.t(textShow)+'\', text-hide=\''+this.t(textHide)+'\')')
}

Locale.getToggleSingleDivLink = function(div, name) {
  return pug.render('a(href=\'#\', toggle-single-div=\''+div+'\') '+this.t(name))
}

Locale.getDay = function(day) {
  return this.t('day'+day)
}

Locale.getMonth = function(month) {
  return this.t('month'+month)
}

//
// Members
//

/* Recurrent members */
Locale._t = {}
Locale._txt = {}
Locale._pug = {}
Locale.loaded = []
Locale.fullLoaded = false
Locale.pages_by_name = []
Locale.allowPageContentOnly = true
/* Instance members */
//locale.locale // 'fr' or 'en'
//locale.loc = _loc[locale]
//locale.names // string array

export default Locale

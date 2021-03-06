import pug from 'pug'
import log from './log'
import db from './database'
import { ConfigPath } from './path'
let config = require(ConfigPath)

// // Set lib to var / load it 
// let db = mysql.createConnection()
// import Locale from './locale'
// Locale.load(db)
// // Create instance of lib for each express request
// let locale = req.njb_locale = {}
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

Locale.setPage = function(page) {
  this.page = page
}

Locale.setNames = function(names) {
  if (!Array.isArray(names))
    names = [ names ]
  this.names = names
}

Locale.loadPage = function() {
  return new Promise(s => {
    let loadContent = []
    this.names.forEach(name => {
      loadContent.push(this.loadContent(name))
    })
    Promise.all(loadContent).then(() => {
      s()
    }, log.error)
  })
}

Locale.locField = function(en, fr) {
  return this.locale === 'en' ? en : fr
}

Locale.treatConfig = function(config) {
  if (config) {
    return {
      mode: config.mode || 'path',
      list: config.list || [ 'en', 'fr' ]
    }
  } else
    return null
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
  return new Promise(s => {
    if (!this.isContentLoaded(name) || force) {
      this.resetContent(name)
      Promise.all([
        this.loadPage_t(name),
        this.loadPage_txt(name)
      ]).then(() => { // _t & _txt can be used compiling _pug
        this.loadPage_pug(name).then(() => {
          if (!name) {
            log.info('All locales loaded successfully')
            this.fullLoaded = true
          }
          else if (!this.isContentLoaded(name))
            this.loaded.push(name)
          s()
        }, log.error)
      })
    } else
      s()
  })
}

Locale.resetContent = function(name) { 
  name = name === 'default' ? '' : name
  // TODO: How to reset locales before loading them?
  if (name) {
    // this._t[name] = {}
    // this._txt[name] = {}
    // this._pug[name] = {}
  } else {
    // this._t = {}
    // this._txt = {}
    // this._pug = {}
  }
}

Locale.loadPage_t = function(name) {
  return new Promise(s => {
    name = name === 'default' ? '' : name
    let query = 'SELECT page, name, fr, en FROM njb_locale_t'+(name ? ' WHERE page=\''+name+'\'' : '')
    db.query(query, function(err, rows, fields) {
      if (err)
        log.mysql_error(err)
      else {
        rows.forEach(row => {
          let _page = row['page'] === '' ? 'default' : row['page'], _name = row['name']
          this._t[_page] = this._t[_page] || {}
          this._t[_page][_name] = this._t[_page][_name] || {}
          this._t[_page][_name]['fr'] = row['fr']
          this._t[_page][_name]['en'] = row['en']
        })
        s()
      }
    }.bind(this))
  })
}

Locale.loadPage_txt = function(name) {
  return new Promise(s => {
    name = name === 'default' ? '' : name
    let query = 'SELECT page, name, fr, en FROM njb_locale_txt'+(name ? ' WHERE page=\''+name+'\'' : '')
    db.query(query, function(err, rows, fields) {
      if (err)
        log.mysql_error(err)
      else {
        rows.forEach(row => {
          let _page = row['page'] === '' ? 'default' : row['page'], _name = row['name']
          this._txt[_page] = this._txt[_page] || {}
          this._txt[_page][_name] = this._txt[_page][_name] || {}
          this._txt[_page][_name]['fr'] = row['fr']
          this._txt[_page][_name]['en'] = row['en']
        })
        s()
      }
    }.bind(this))
  })
}

Locale.loadPugLocale = function(pattern, container, locale, page) {
  return new Promise((s, f) => {
    let locals = {
      t: this,
      locale: locale, page: page,
      dis: {
        locale: locale, page: page,
      }
    }
    pug.render(pattern, locals, (err, html) => {
      if (err) {
        log.error(err)
        container[locale] = null
        f()
      } else
        container[locale] = html
      s()
    })
  })
}

Locale.loadPage_pug = function(name) {
  return new Promise((s, f) => {
    name = name === 'default' ? '' : name
    let query = 'SELECT page, name, fr, en FROM njb_locale_pug'+(name ? ' WHERE page=\''+name+'\'' : '')
    db.query(query, function(err, rows, fields) {
      if (err)
        f()
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
        Promise.all(promises).then(s, f)
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
  let current_page = self ? self.page : this.page

  if (!locale) return ''
  let page = this.pages_by_name[name]
  if (page) {
    let pagePath = page['url'+locale]
    let language = this.treatConfig(config.language)
    if (language && language.mode === 'path')
      pagePath = '/' + this.locale + pagePath
    if (!title)
      title = this.t('menu-'+name, self)
    if (!title)
      title = this.t('title-'+name, self)

    if (this.allowPageContentOnly) {
      let cont = '.page-link.loadpage(href=\''+pagePath+'\', page-path=\''+pagePath+'\') '+title
      if (current_page && current_page === name)
        return pug.render('span.current-page-link'+cont)
      else
        return pug.render('a'+cont)
    }
    else {
      if (current_page && current_page === name)
        return pug.render('span.page-link.current-page-link '+title)
      else
        return pug.render('a.page-link(href=\''+pagePath+'\') '+title)
    }
  }
  return ''
}

Locale.getLink = function(href, name, newTab = false) {
  return pug.render('a(href=\''+href+'\''+(newTab ? ', target=\'_blank\'' : '')+') '+this.t(name))
}

Locale.getToggleDivLink = function(div, textShow, textHide) {
  textShow = textShow || 'show'
  textHide = textHide || 'hide'
  return pug.render('a(href=\'#\', toggle-div=\''+div+'\', text-show=\''+this.t(textShow)+'\', text-hide=\''+this.t(textHide)+'\')')
}

Locale.getToggleSingleDivLink = function(div, name) {
  return pug.render('a(href=\'#\', toggle-single-div=\''+div+'\') '+this.t(name))
}

Locale.getSwapLangUrl = function() {
  let language = this.treatConfig(config.language)
  let list = language.list
  if (!language || list.length < 2)
    return null
  let host = config.address + (config.clientPort && config.clientPort != 80 ? ':'+config.clientPort : '')
  let opp = this.locale === list[0] ? list[1] : list[0]
  let oppPath = this.pages_by_name[this.page]['url'+opp]
  let oppUrl
  if (language.mode === 'prefix')
    oppUrl = 'http://' + (opp === list[0] ? '' : opp+'.') + host + oppPath // + query ?
  else
    oppUrl = 'http://' + host + '/' + opp + oppPath // + query ?
  return oppUrl
}

Locale.getSwapLangLink = function() {
  let oppUrl = this.getSwapLangUrl()
  if (!oppUrl)
    return ''
  return pug.render("a.swap-lang-link(href='"+oppUrl+"') " + this.t('swap-lang'))
}

Locale.getEditableDiv = function(id, name, content) {
  return pug.render(`#${id}.editable-div
#${id}_textdiv.${id}_view.editable-textdiv(onclick='editable_switchToEdit(event)')
.${id}_edit(style='display: none;')
  textarea#${id}_textarea_real(name=name, style='display: none')
    !=content
  textarea#${id}_textarea.editable-textarea
  input#${id}_save.editable-button(type='button', value='save', onclick='editable_switchBack(this, true)', editable-id='${id}')
  input#${id}_cancel.editable-button(type='button', value='cancel', onclick='editable_switchBack(this, false)', editable-id='${id}')`, { name, content })
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
//Locale.page // string page identifier
//locale.reqUrl // [ 'http://', '.domain.com' ]

export default Locale

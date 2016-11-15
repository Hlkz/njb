import express from 'express'
import File from './file'
import Process from './process'

let env = process.env.NODE_ENV

export default (app) => {
  // Load pages
  let pages = []
  let db = app.get('database')
  let query = 'SELECT name, base, path, fr, en, regexfr, regexen, layout FROM '+db.prefix+'pages WHERE !hidden'
  db.query(query, function(err, rows, fields) {
    if (err) throw err;
    pages = rows
    pages.forEach(page => {
      if (page['path'] !== '') {
        let jsPath = __dirname+'/site/page/'+page['path']+'.js'
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
    let pages_by_name = {}
    app.get('locale').pages_by_name = pages_by_name
    pages.forEach(page => {
      pages_by_name[page['name']] = page
    })
    LoadRouter(app)
  })
}

let LoadRouter = app => {
  // Load routes
  let pages = app.get('pages')
  let bases = []
  pages.forEach(page => {
    if (!bases.includes(page['base']))
      bases.push(page['base'])
  })
  let router = express.Router()
  let router2 = express.Router()
  bases.forEach(base => {
    router.use(base, (req, res, next) => {
      if (!Process(req, res))
        next()
    })
  })
  app.use('/', router)
  app.use('/page/', router)

  // Check for non registred pages
  if (env === 'development')  {
    let router2 = express.Router()
    router2.use('/', (req, res, next) => {
      if (!Process(req, res, true))
        next()
    })
    app.use('/', router2)
    app.use('/page/', router2)
  }

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handlers

  // development error handler, will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500)
      res.render('error', {
        message: err.message,
        error: err
      })
    })
  }

  // production error handler, no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: {}
    })
  })
}

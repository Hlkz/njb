import pump from 'pump'
import stylus from 'gulp-stylus'
import autoprefixer from 'autoprefixer-stylus'
import cleanCSS from 'gulp-clean-css'
import babel from 'gulp-babel'

import source from 'vinyl-source-stream'
import gulp from 'gulp'
import gutil from 'gulp-util'
import browserify from 'browserify'
import babelify from 'babelify'
import watchify from 'watchify'
import notify from 'gulp-notify'

import buffer from 'vinyl-buffer'
import uglify from 'gulp-uglify'
import rename from 'gulp-rename'

import log from './log'
import File from './file'
import { CorePath, NjbPath, DataPath } from './path'

let env = process.env.NODE_ENV

// CSS

gulp.task('build-corecss', () => {
  pump([
    gulp.src(NjbPath+'/styl/**/*.styl'),
    buffer(),
    stylus({ use: [autoprefixer('iOS >= 7', 'last 1 Chrome version')]}).on('error', gutil.log),
    cleanCSS(),
    rename({ suffix: '.min' }),
    gulp.dest(DataPath+'/build/css/')
  ])
})

gulp.task('build-css', () => {
  pump([
    gulp.src(CorePath+'/styl/**/*.styl'),
    buffer(),
    stylus({ use: [autoprefixer('iOS >= 7', 'last 1 Chrome version')]}).on('error', gutil.log),
    cleanCSS(),
    rename({ suffix: '.min' }),
    gulp.dest(DataPath+'/build/css/')
  ])
})

// SCRIPT JS

let script_babelrc = {
  presets: [ [ "es2015", { modules: false } ] ],
  compact: false
}
let app_babelrc = {
  presets: ['react', 'es2015', 'stage-0'],
  plugins: ['transform-decorators-legacy']
}

gulp.task('build-corejs', () => {
  pump([
    gulp.src(NjbPath+'/script/**/*.js'),
    babel(script_babelrc).on('error', gutil.log),
    buffer(),
    uglify().on('error', gutil.log),
    rename({ suffix: '.min' }),
    gulp.dest(DataPath+'/build/js/')
  ])
})

gulp.task('build-js', () => {
  pump([
    gulp.src(CorePath+'/script/**/*.js'),
    babel(script_babelrc).on('error', gutil.log),
    //buffer(),
    //uglify().on('error', gutil.log),
    rename({ suffix: '.min' }),
    gulp.dest(DataPath+'/build/js/')
  ])
})

// Build & Watch

gulp.task('build', ['build-corejs', 'build-js', 'build-corecss', 'build-css'])

gulp.task('watch', () => {
  gulp.watch(NjbPath+'/script/**/*.js', ['build-corejs'])
  gulp.watch(CorePath+'/script/**/*.js', ['build-js'])
  gulp.watch(NjbPath+'/styl/**/*.styl', ['build-corecss'])
  gulp.watch(CorePath+'/styl/**/*.styl', ['build-css'])
})

gulp.start('build')
if (env === 'development') 
  gulp.start('watch')

// Build React App

function handleErrors() {
  var args = Array.prototype.slice.call(arguments)
  notify.onError({
   title: 'Compile Error',
   message: '<%= error.message %>'
  }).apply(this, args)
  this.emit('end')
}

function buildApp(file, watch) {
  var props = {
    entries: [CorePath+'/apps/' + file],
    debug : true,
    cache: {},
    packageCache: {},
    transform:  [babelify.configure(app_babelrc)]
  }

  var bundler = watch ? watchify(browserify(props)) : browserify(props)

  function rebundle() {
    var stream = bundler.bundle()
    return stream
      .on('error', handleErrors)
      .pipe(source(file))
      //.pipe(buffer())
      //.pipe(uglify())
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest(DataPath+'/build/apps/'))
  }

  // listen for an update and run rebundle
  bundler.on('update', function() {
    rebundle()
    gutil.log('Rebundle...')
  })

  // run it once the first time buildScript is called
  return rebundle()
}

export { buildApp }

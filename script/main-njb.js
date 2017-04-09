
head.load([
  'general',
].map(e => '/data/build/css/' + e + '.min.css'))

var njb_headjs_load_css = njb_headjs_load_css
if (njb_headjs_load_css) njb_headjs_load_css()

head.load([
  'https://unpkg.com/jquery@3.1.0/dist/jquery.min.js',
  // 'https://unpkg.com/react@15.3.0/dist/react.js',
  // 'https://unpkg.com/react-dom@15.3.0/dist/react-dom.js',
  // 'https://unpkg.com/babel-standalone@6.15.0/babel.min.js',
  // 'https://unpkg.com/remarkable@1.6.2/dist/remarkable.min.js',
  '/data/lib/native.history.js',
  'https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.5/bluebird.min.js', // for IE (js promises)
])

var njb_headjs_load_lib = njb_headjs_load_lib
if (njb_headjs_load_lib) njb_headjs_load_lib()

head.load([
  'util',
  'editable',
  'page',
].map(e => '/data/build/js/js/' + e + '.min.js'))

var njb_headjs_load_script = njb_headjs_load_script
if (njb_headjs_load_script) njb_headjs_load_script()

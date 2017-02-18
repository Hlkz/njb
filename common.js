import log from './log'
import busboy from 'busboy'

let isObject = v => (typeof v === 'object')
let isString = v => (typeof v === 'string' || v instanceof String)
let isFunction = f => {
  let getType = {}
  return f && getType.toString.call(f) === '[object Function]'
}

let textToHTML = text => ((text || "") + "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\t/g, "    ")
  .replace(/ /g, "&#8203;&nbsp;&#8203;")
  .replace(/\r\n|\r|\n/g, "<br />")

let mergeObj = (o1, o2) => {
  for (let i in o2)
    if (o2.hasOwnProperty(i))
      o1[i] = o2[i]
}

let duplicateArray = (a) => {
  let i = a.length
  let b = Array(i)
  while(i--)
    b[i] = a[i]
  return b 
}

// forms handling (without reloading page)
let busform = (req, callback, ...args) => {
  if (!(typeof req.headers === 'object' && typeof req.headers['content-type'] === 'string'))
    return callback(null)

  let body = {}
  let bus = new busboy({ headers: req.headers })
  bus.on('field', (fieldname, value) => {
    body[fieldname] = value
  })
  bus.on('finish', () => {
    callback(body, ...args)
  })
  req.pipe(bus)
}

// http post request handling
let getpost = (req) => {
  return new Promise((resolve, reject) => {
    busform(req, post => {
      if (post)
        req.body = post
      resolve()
    })
  })
}

let timeSince = d => {
  let now = new Date()
  return now - d
}

let timeBeforeNextHour = () => {
  let d = new Date(),
    h = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1, 0, 0, 0) // Next hour
    // h = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes() + 1, 0, 0) // Next minute
  return h - d + 100
}

export default {
  isObject,
  isString,
  isFunction,
  textToHTML,
  mergeObj,
  duplicateArray,
  busform,
  getpost,
  timeSince,
  timeBeforeNextHour,
}

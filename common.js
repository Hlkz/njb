import log from './log'
import busboy from 'busboy'

let isString = v => (typeof v === 'string' || v instanceof String)

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

export default {
  isString,
  textToHTML,
  mergeObj,
  duplicateArray,
  busform
}

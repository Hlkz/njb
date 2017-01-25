import busboy from 'busboy'

let dateString = () => {
  let d = new Date()
  return d.getFullYear()+'/'+d.getMonth()+'/'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
}

let error = e => {
  if (e) {
    console.log(dateString(), 'Error')
    console.log(e)
  }
}

let mysql_error = e => {
  if (e) {
    console.log(dateString(), 'Database Error')
    console.log(e)
  }
}

let mysql_real_escape_string = str => str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
  switch (char) {
    case "\0": return "\\0";
    case "\x08": return "\\b";
    case "\x09": return "\\t";
    case "\x1a": return "\\z";
    case "\n": return "\\n";
    case "\r": return "\\r";
    case "\"":
    case "'":
    case "\\":
    case "%": return "\\"+char; // prepends a backslash to backslash, percent, and double/single quotes
  }
})

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
  dateString,
  error,
  mysql_error,
  mysql_real_escape_string,
  textToHTML,
  mergeObj,
  duplicateArray,
  busform
}

import busboy from 'busboy'

let common = module.exports = {
  error: e => { console.error(e) },
  mysql_real_escape_string: str => str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
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
  }),
  mergeObj: (o1, o2) => {
    for (let i in o2)
      if (o2.hasOwnProperty(i))
        o1[i] = o2[i]
  },
  busform: (req, callback, ...args) => {
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
  },
}
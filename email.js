import nodemailer from 'nodemailer'

import { CorePath } from './path'
let config = require(CorePath+'/site/config/config.json')
let config_mail = config.mail
// config_mail.service
// config_mail.user
// config_mail.pass

let transporter = nodemailer.createTransport({
  service: config_mail.service,
  auth: {
    user: config_mail.user,
    pass: config_mail.pass
  }
})

function send(mailTo, mailSubject, mailHtml) {
  return new Promise((resolve, reject) => {
    let mailFrom = config_mail.user
    let mailOptions = {
     from: mailFrom,
      to: mailTo,
      subject: mailSubject,
      //text: 'Hello world',
      html: mailHtml
    }
    transporter.sendMail(mailOptions, function(error, info) {
      if (!error)
        resolve()
      else
        reject(error)
    })
  })
}

export default {
  send,
}

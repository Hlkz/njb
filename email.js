import nodemailer from 'nodemailer'
import log from './log'
import { CorePath } from './path'
let config = require(CorePath+'/site/config/config.json')
let config_mail = config.mail

const smtpConfig = {
  pool: true,
  maxConnections: 5,
  host: config_mail.host,
  port: 587,
  secure: false,
  auth: {
    user: config_mail.user,
    pass: config_mail.pass
  },
  tls: {
    rejectUnauthorized: false
  }
}

const transporter = nodemailer.createTransport(smtpConfig)
transporter.verify((err, data)=>{
  if (err)
    log.error(err)
  else
    log.info('Server SMTP ready')
})

let sendMail = (mailTo, mailSubject, mailText, mailHtml) => {
  const mailFrom = config_mail.name+' <'+config_mail.user+'>'
  const mailOptions = {
    from: mailFrom,
    to: mailTo,
    subject: mailSubject,
    text: mailText,
    html: mailHtml
  }
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function(err, data) {
      if (err) {
        log.error(err)
        reject(err)
      }
      else
        resolve(data)
    })
  })
}

let sendText = (mailTo, mailSubject, mailText) => sendMail(mailTo, mailSubject, mailText, null)
let sendHtml = (mailTo, mailSubject, mailHtml) => sendMail(mailTo, mailSubject, ' ', mailHtml)

export default {
  sendMail,
  sendText,
  sendHtml
}

import nodemailer from 'nodemailer'
import log from './log'
import db from './database'
import common from './common'
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
  else {
    log.info('Server SMTP ready')
    TimeNextQueuedMailSending()
  }
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

// Mail Queue System (for newsletters)

let mail_per_hout_left_count = 0

function TimeNextQueuedMailSending() {
  let time = common.timeBeforeNextHour()
  if (time > 100)
    setTimeout(SendQueuedMails, time)
}

function SendQueuedMail(mails, to) {
  let error = null
  let mail = mails[to.id]
  if (mail) {
    sendMail(to.mail, mail.subject, mail.content_text, mail.content_html).then(()=>{
      db.query('UPDATE njb_mail_queue SET sent=1 WHERE id=? AND mail=?', to.id, to.mail, function(err) { })
    }, (err) => {
      error = err
    })
  } else
    error = 'mail not found'
  if (error)
    db.query('UPDATE njb_mail_queue SET errors=errors+1, error'+(to.errors+1)+'=? WHERE id=? AND mail=?', error, to.id, to.mail, function(err) { })
}

function SendQueuedMails() {
  db.query('SELECT id, subject, content_text, content_html FROM njb_mail', function(err, rows) {
    if (!err) {
      let mails = {};
      rows.forEach(mail => { mails[mail.id] = mail })
      db.query('SELECT id, mail, errors FROM njb_mail_queue WHERE errors<3 AND sent=0', function(err, rows) {
        if (!err) {
          let recipients = rows
          mail_per_hout_left_count = config_mail.max_per_hour
          if (mail_per_hout_left_count > 0 && recipients.length)
            log.info('Event: Sending mails to queue')
          while(mail_per_hout_left_count > 0 && recipients.length) {
            SendQueuedMail(mails, recipients.pop())
            mail_per_hout_left_count--
          }
          db.query('DELETE FROM njb_mail WHERE id NOT IN ( SELECT DISTINCT id FROM njb_mail_queue WHERE sent=0)', function(err) { })
        }
      })
    }
  })
  TimeNextQueuedMailSending()
}

export default {
  sendMail,
  sendText,
  sendHtml
}

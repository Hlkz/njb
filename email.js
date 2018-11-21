import nodemailer from 'nodemailer'
import log from './log'
import db from './database'
import common from './common'
import { CorePath, ConfigPath } from './path'
let config = require(ConfigPath)
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
    SendQueuedMails()
  }
})

let sendMail = (mailTo, mailSubject, mailText, mailHtml) => {
  if (!mailText || mailText === '')
    mailText = ' '
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

function TimeNextQueuedMailSending() {
  let time = common.timeBeforeNextHour()
  if (time > 100)
    setTimeout(() => SendQueuedMails(true), time)
}

function SendQueuedMails(planNext = false) {
  let clearQuery = 'DELETE FROM njb_mail WHERE id NOT IN ( SELECT DISTINCT id FROM njb_mail_queue WHERE sent=0)'
  db.query_c('DELETE FROM njb_var WHERE name="mails sent" AND date < Date_sub(now(), interval 1 hour)', () => { // _c
    db.query_c(clearQuery, () => {
    db.query_c('SELECT id, subject, content_text, content_html FROM njb_mail', rows => {
    let mails = {}
    rows.forEach(mail => { mails[mail.id] = mail })
    db.query_c('SELECT id, mail, errors FROM njb_mail_queue WHERE errors<3 AND sent=0', rows => {
    let recipients = rows
    db.query_c('SELECT value FROM njb_var WHERE name="mails sent"', rows => {
    let value = rows.length ? rows[0].value : 0
    let count = 0
    let leftcount = config_mail.max_per_hour - value
    log.info('Event: Sending mails to queue (leftCount: ' + leftcount + ', Recipients: ' + recipients.length + ')')
    while(leftcount > 0 && recipients.length) {
      SendQueuedMail(mails, recipients.pop())
      count++
      leftcount--
    }
    db.query_c(rows.length ? 'UPDATE njb_var SET value = ? WHERE name="mails sent"' : 'INSERT INTO njb_var (name, value) VALUES ("mails sent", ?)', value + count, () => {
    db.query(clearQuery, () => {})
  }) }) }) }) }) }) // _c

  if (planNext)
    TimeNextQueuedMailSending(true)
}

function SendQueuedMail(mails, to) {
  let mail = mails[to.id]
  let prom = []
  if (mail)
    sendMail(to.mail, mail.subject, mail.content_text, mail.content_html).then(() => {
      db.query('UPDATE njb_mail_queue SET sent=1 WHERE id=? AND mail=?', to.id, to.mail, () => {})
    }, (err) => {
      QueuedMailSendingError(to, err.message)
    })
  else
    QueuedMailSendingError(to, 'mail not found')
}

function QueuedMailSendingError(to, error) {
  db.query('UPDATE njb_mail_queue SET errors=errors+1, error'+(to.errors+1)+' = ? WHERE id = ? AND mail = ?', error, to.id, to.mail, () => {})
}

export default {
  sendMail,
  sendText,
  sendHtml,
  SendQueuedMails,
}

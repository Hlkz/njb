import common from './common'
import db from './database'

export default (app) => {
//start

// setInterval(()=>{
//   let query = 'INSERT INTO testi VALUES()'
//   db.query(query, function(err, rows, fields) {
//     if (err) {
//       console.log('Interval error')
//       common.mysql_error(err)
//     }
//     else {
//       //console.log('Interval fine')
//     }
//   })
// }, 60000)
// console.log('catch on')

app.use('/admin/locales', (req, res, next) => {
  app.get('locale').loadContent(null, true).then(() => {
  })
  console.log('Resetting locales')
  res.end()
  //next()
})

//end
}
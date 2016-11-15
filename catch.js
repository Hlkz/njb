export default (app) => {
//start

app.use('/admin/locales', (req, res, next) => {
  app.get('locale').loadContent(null, true).then(() => {
  })
  console.log('Resetting locales')
  res.end()
  //next()
})

//end
}
import db from './database'
import locale from './locale'
import log from './log'

let stdin = process.openStdin()
stdin.addListener('data', function(d) {
  let s = d.toString().trim()
  switch (s)
{

case 'test':
  break

case 'loc':
  console.log('Resetting locales')
  locale.loadContent(null, true).then(() => {})
  break

case 'exit':
 process.exit()

}
})

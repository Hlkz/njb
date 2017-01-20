
let stdin = process.openStdin()
stdin.addListener('data', function(d) {
  let s = d.toString().trim()
  if (s === 'exit')
  	process.exit()
})


function loadImage(url) {
  return new Promise((resolve, reject) => {
    let image = new Image()
    console.log('prom', url)
    image.onload=resolve
    image.onerror=resolve
    image.src=url
    setTimeout(resolve, 1500)
  })
}

function loadImagesFirst() { // First load
  let loadImagePromises = []
  var srcList=Array.prototype.map.call(document.images, img => img.src)
  srcList.forEach(url=>loadImagePromises.push(loadImage(url)))
  Promise.all(loadImagePromises).then(()=>{
    document.getElementById('loading-screen').style.display = 'none'
    document.getElementById('full-screen').style.display = 'block'
  })
}

function loadImagesSecond() { // Load page only
  let loadImagePromises = []
  var srcList=Array.prototype.map.call(document.images, img => img.src)
  srcList.forEach(url=>loadImagePromises.push(loadImage(url)))
  Promise.all(loadImagePromises).then(()=>{
    document.getElementById('page').innerHTML = document.getElementById('page-hidden').innerHTML
  })
}

$(document).ready(function(){
  var hasClass = function(e, className) {
    return (' ' + e.className + ' ').indexOf(' ' + className + ' ') > -1;
  }
  document.addEventListener('click', function(e) {
    if (hasClass(e.target, 'loadpage')) {
      if (e.ctrlKey) // Allow new tab click
        return
      e.preventDefault()
      var path = e.target.getAttribute('page-path')
      LoadPage(path)
    }
    else if (e.target.hasAttribute('toogle-div')) {
      var currentToggle = document.getElementById('current-toggle')
      var currentToggleDiv = ''
      if (currentToggle) {
        if (currentToggleDiv = currentToggle.getAttribute('div')) {
          if (currentToggleDiv.length) {
            var toHide = document.getElementById(currentToggleDiv)
            if (toHide)
              toHide.style.display = 'none'
          }
          currentToggleDiv = e.target.getAttribute('toogle-div')
          currentToggle.setAttribute('div', currentToggleDiv)
          var toShow = document.getElementById(currentToggleDiv)
          if (toShow)
            toShow.style.display = 'block'
        }
      }
    }
  })
  var current = document.getElementById('page').getAttribute('current')
  var loadPage = document.getElementById('page').getAttribute('loadPage')
  if (loadPage && loadPage === 'true')
    LoadPage(current)

  loadImagesFirst()
})

function SetPage(path, html) {
  document.getElementById('page-hidden').innerHTML = html
  document.getElementById('page').setAttribute('current', path)
  var title = ''
  var replaceClass = document.getElementById('page-title').getAttribute('rclass')
  if (!replaceClass)
    replaceClass = ''
  document.getElementById('page').className = replaceClass
  title = document.getElementById('page-title').getAttribute('title')
  document.title = title
  var forcePath = null
  if (forcePath = document.getElementById('page-path'))
    if (forcePath = forcePath.getAttribute('path'))
      path = forcePath
  window.history.pushState({ html: html }, title, path)
  loadImagesSecond()
}

window.onpopstate = function(e){
  if (e.state)
    document.getElementById("page-hidden").innerHTML = e.state.html
}

function LoadPage(path) {
  var url = '/page'+path;
  var xhr = new XMLHttpRequest()
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200)
      SetPage(path, this.responseText)
  }
  xhr.open("GET", url, true)
  xhr.send()
}

function SubmitForm(form) {
  var path = form.getAttribute('action')
  if (!path)
    return false

  var xhr = new XMLHttpRequest()
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200)
      SetPage(path, this.responseText)
  }
  xhr.open('POST', '/page'+path)
  var data = new FormData(form)
  xhr.send(data)
  console.log(data)
  return false
}

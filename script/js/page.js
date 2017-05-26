
var NJB_SkipSetPage = false
var jPlayerPlaylists = jPlayerPlaylists || []
var njb_reactReady = false
var njb_reactApps = njb_reactApps || []
var njb_readyFn = njb_readyFn || []

function loadImage(url) {
  return new Promise((resolve, reject) => {
    let image = new Image()
    //console.log('img', url)
    image.onload=resolve
    image.onerror=resolve
    image.src=url
    setTimeout(resolve, 1000)
  })
}

function loadImagesFirst(callback) { // First load
  let loadImagePromises = []
  var srcList=Array.prototype.map.call(document.images, img => img.src)
  srcList.forEach(url=>loadImagePromises.push(loadImage(url)))
  Promise.all(loadImagePromises).then(()=>{
    document.getElementById('loading-screen').style.display = 'none'
    document.getElementById('full-screen').style.display = 'block'
    callback()
  })
}

function loadImagesSecond(callback) { // Load page only
  let loadImagePromises = []
  var srcList=Array.prototype.map.call(document.images, img => img.src)
  srcList.forEach(url=>loadImagePromises.push(loadImage(url)))
  Promise.all(loadImagePromises).then(()=>{
    callback()
  })
}

function loadToggleLinks() {
  let toggleLinks = getAllElementsWithAttribute('toggle-div')
  toggleLinks.forEach(button=>{
    toggleDiv = button.getAttribute('toggle-div')
    if (toggleDiv) {
      let target = document.getElementById(toggleDiv)
      if (target) {
        let textShow = button.getAttribute('text-show') || ''
        let textHide = button.getAttribute('text-hide') || textShow
        let style = window.getComputedStyle(target)
        if (style.display === 'block')
          button.innerHTML = textHide
        else
          button.innerHTML = textShow
      }
    }
  })
}

function loadPageLinks() {
  // Old current span to link
  let currentLinks = document.getElementsByClassName('current-page-link')
  Array.from(currentLinks).forEach(link => {
    link.classList.remove('current-page-link')
    changeTag(link, 'a')
  })
  // New current link to span
  let current = getDivAttr('page', 'current')
  let pageLinks = document.getElementsByClassName('page-link')
  Array.from(pageLinks).forEach(link => {
    let href = link.getAttribute('href')
    if (href && href === current) {
      link.classList.add('current-page-link')
      changeTag(link, 'label')
    }
  })
}

function loadSwapLangLinks() {
  let swapLangUrl = getDivAttr('swap-lang-path', 'path')
  if (swapLangUrl) {
    let swapLangLinks = document.getElementsByClassName('swap-lang-link')
    Array.from(swapLangLinks).forEach(link => {
      link.href = swapLangUrl
    })
  }
}

$(document).ready(function() {
  document.addEventListener('click', function(e) {
    if (e.target.nodeName.toLowerCase() == 'a' && hasClass(e.target, 'loadpage')) {
      if (e.ctrlKey) // Allow new tab click
        return
      e.preventDefault()
      var path = e.target.getAttribute('page-path')
      LoadPage(path)
    }
    else if (e.target.hasAttribute('toggle-div')) {
      e.preventDefault()
      let button = e.target
      toggleDiv = button.getAttribute('toggle-div') || 'notfound'
      let textShow = button.getAttribute('text-show') || ''
      let textHide = button.getAttribute('text-hide') || textShow
      let target = document.getElementById(toggleDiv)
      if (target) {
        let style = window.getComputedStyle(target)
        if (style.display === 'none') {
          button.innerHTML = textHide
          target.style.display = 'block'
        }
        else {
          button.innerHTML = textShow
          target.style.display = 'none'
        }
      }
    }
    else if (e.target.hasAttribute('toggle-single-div')) {
      e.preventDefault()
      let currentToggle = document.getElementById('current-toggle')
      let currentToggleDiv = ''
      if (currentToggle) {
        if (currentToggleDiv = currentToggle.getAttribute('div')) {
          if (currentToggleDiv.length) {
            let toHide = document.getElementById(currentToggleDiv)
            if (toHide)
              toHide.style.display = 'none'
          }
          currentToggleDiv = e.target.getAttribute('toggle-single-div')
          currentToggle.setAttribute('div', currentToggleDiv)
          let toShow = document.getElementById(currentToggleDiv)
          if (toShow)
            toShow.style.display = 'block'
        }
      }
    }
  })

  // Load page content if needed
  var current = getDivAttr('page', 'current')
  var loadPage = getDivAttr('page', 'loadPage')
  if (loadPage && loadPage === 'true')
    LoadPage(current)
  else {
    current = getDivAttr('page-path', 'path') || current
    History.replaceState({ path: current, html: document.getElementById('page').innerHTML }, document.title, current)
  }

  loadImagesFirst(()=>{
    loadToggleLinks()
    LoadjPlayers()
    loadEditableDiv()
    LoadReactApps()
    njb_readyFn.forEach(fn => fn())
  })
})

// Update hidden page content
function SetPage(path, html, pushState = true) {
  let original_path = path
  document.getElementById('page-hidden').innerHTML = html
  document.getElementById('page').setAttribute('current', path)
  document.getElementById('page').className = document.getElementById('page-title').getAttribute('rclass') || ''
  path = getDivAttr('page-path', 'path') || path
  loadImagesSecond(()=>{
    onHiddenPageLoaded(path, html, pushState)
  })
}

// Update real page content
function onHiddenPageLoaded(path, html, pushState) {
  document.getElementById('page').innerHTML = document.getElementById('page-hidden').innerHTML
  loadToggleLinks()
  loadPageLinks()
  loadSwapLangLinks()
  LoadjPlayers()
  loadEditableDiv()
  njb_readyFn.forEach(fn => fn())
  //LoadReactApps()
  let title = document.getElementById('page-title').getAttribute('title')
  document.title = title
  if (pushState) {
    NJB_SkipSetPage = true
    History.pushState({ path: path, html: html }, title, path)
  }
}

// Previous or Next page
History.Adapter.bind(window,'statechange',function() {
  let state = History.getState()
  let data = state.data
  if (data && data.path && data.html && !NJB_SkipSetPage)
    SetPage(data.path, data.html, false)
  NJB_SkipSetPage = false
})

// Send request for next page content
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
  return false
}

function LoadjPlayers() {
  if (typeof jPlayerPlaylist !== 'undefined')
    jPlayerPlaylists.forEach(list => { new jPlayerPlaylist(list.cssSelector, list.playlist, list.options) })
}

function LoadReactApps() {
  njb_reactReady = true
  njb_reactApps.forEach(fn => fn())
}
function AddedReactApp() {
  if (njb_reactReady)
    LoadReactApps()
}

var NJB_SkipSetPage = false
var jPlayerPlaylists = jPlayerPlaylists || []

let isTextarea = obj => obj instanceof HTMLInputElement && obj.type == 'text'

function addListenerMulti(element, eventNames, listener) {
  eventNames.split(' ').forEach(event => { element.addEventListener(event, listener, false) })
}

function removeListenerMulti(element, eventNames, listener) {
  eventNames.split(' ').forEach(event => { element.removeEventListener(event, listener) })
}

function changeTag(elem, newTag) {
  let newElem = document.createElement(newTag)
  let index

  // Copy the children
  while (elem.firstChild)
    newElem.appendChild(elem.firstChild) // *Moves* the child

  // Copy the attributes
  for (index = elem.attributes.length - 1; index >= 0; --index)
    newElem.attributes.setNamedItem(elem.attributes[index].cloneNode())
  // Replace it
  elem.parentNode.replaceChild(newElem, elem);
}

function getDivAttr(id, attr) {
  let div = document.getElementById(id)
  return div ? div.getAttribute(attr) : null
}

function getAllElementsWithAttribute(attribute) {
  var matchingElements = []
  var allElements = document.getElementsByTagName('*')
  Array.from(allElements).forEach(elem=>{
    if (elem.getAttribute(attribute) !== null) // Element exists with attribute. Add to array.
      matchingElements.push(elem)
  })
  return matchingElements
}

let hasClass = (e, className) => (' ' + e.className + ' ').indexOf(' ' + className + ' ') > -1

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

// Editable div

let editable_TextToHTML = text => ((text || "") + "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/(\r\n|\r|\n) /g, '$1&#8203;&nbsp;&#8203;')
  .replace(/  /g, "&#8203;&nbsp;&#8203; ")
  .replace(/\r\n|\r|\n/g, "\n<br />")

function editable_switchDisplay(id, edit = false) {
  let hidden = edit ? '_view' : '_edit'
  let shown = edit ? '_edit' : '_view'
  let hiddenDiv = document.getElementById(id+hidden)
  if (hiddenDiv) hiddenDiv.style.display = 'none'
  let shownDiv = document.getElementById(id+shown)
  if (shownDiv) shownDiv.style.display = 'inline-block'
  Array.from(document.getElementsByClassName(id+hidden)).forEach(el => { el.style.display = 'none' })
  Array.from(document.getElementsByClassName(id+shown)).forEach(el => { el.style.display = 'inline-block' })
}

function editable_SwitchToEdit(id, moveCursor = false) {
  let textdiv = document.getElementById(id+'_textdiv')
  let width = textdiv.offsetWidth

  let setPoint
  if (moveCursor) {
    let range = document.getSelection().getRangeAt(0),
      start = range.startOffset
    range.setStart(textdiv, 0)
    let range_str = range.toString().replace(/\u200B/gu, '')
    setPoint = range_str.length
  }
  editable_switchDisplay(id, true)

  let textarea = document.getElementById(id+'_textarea')
  textarea.style.width = width+'px'
  textarea_autogrow(textarea)
  textarea.focus()
  if (moveCursor)
    textarea.setSelectionRange(setPoint, setPoint)
}

function editable_switchToEdit(e) {
  let target = e.target
  if (hasClass(target, 'editable-textdiv')) {
    if (e.ctrlKey)
      editable_SwitchToEdit(target.id.substr(0, target.id.length-8), true) // - _textdiv
  }
  else
    editable_SwitchToEdit(target.getAttribute('editable-id'))
}

function editable_SwitchBack(id, save) {
  let textdiv = document.getElementById(id+'_textdiv')
  let textarea = document.getElementById(id+'_textarea')
  if (save) {
    textdiv.innerHTML = editable_TextToHTML(textarea.value)
    document.getElementById(id+'_textarea_real').value = textarea.value
  }

  editable_switchDisplay(id, false)
}

function editable_switchBack(el, save) {
  console.log('hihi')
  let id
  if (hasClass(el, 'editable-textarea')) // should never happen, I leave it in case, for a while
    id = el.id.substr(0, el.id.length-9)
  else
    id = el.getAttribute('editable-id')
  editable_SwitchBack(id, save)
}

function editable_resetTextarea(event) {
  let id = event
  if (event.target) { // from button
    event.preventDefault()
    id = event.target.getAttribute('editable-id')
  }
  let textarea = document.getElementById(id+'_textarea')
  textarea.value = document.getElementById(id+'_textarea_real').value
  textarea_autogrow(textarea)
}

function editable_OnChangeTextarea(e) {
  textarea_autogrow(e.target)
}

function loadEditableDiv() {
  let editabledivs = document.getElementsByClassName('editable-div')
  Array.from(editabledivs).forEach(div => {
    Array.from(document.getElementsByClassName(div.id+'_edit')).forEach(el => { el.style.display = 'none' })
    Array.from(document.getElementsByClassName(div.id+'_view')).forEach(el => { el.style.display = 'inline-block' })
    let textarea = document.getElementById(div.id+'_textarea')
    let textdiv = document.getElementById(div.id+'_textdiv')
    let style = window.getComputedStyle(textdiv)
    // textarea.style.margin = style.margin
    // textarea.style.padding = style.padding
    textarea.style.color = style.color
    textarea.style.fontFamily = style.fontFamily
    textarea.style.fontSize = style.fontSize
    textarea.style.textAlign = style.textAlign
    textarea.style.textJustify = style.textJustify
    editable_resetTextarea(div.id)
    textdiv.innerHTML = editable_TextToHTML(textarea.value)
    removeListenerMulti(textarea, 'input propertychange', editable_OnChangeTextarea)
    addListenerMulti(textarea, 'input propertychange', editable_OnChangeTextarea)
  })
}

function textarea_autogrow(el) {
  el.style.height = "5px"
  el.style.height = (el.scrollHeight)+"px"
}

function getSelectionText() {
  let text = null
  if (window.getSelection)
    text = window.getSelection().toString()
  else if (document.selection && document.selection.type != "Control")
    text = document.selection.createRange().text
  return text
}

$(document).ready(function() {
  document.addEventListener('keydown', function(e) {
    if (hasClass(document.activeElement, 'editable-textarea'))
      if ((event.keyCode === 10 || event.keyCode === 13) && event.ctrlKey) {
        //editable_switchBack(document.activeElement, true)
        let id = document.activeElement.id
        id = id.substr(0, id.length-9)
        document.getElementById(id+'_save').click()
      }
      else if (event.keyCode === 27) {
        //editable_switchBack(document.activeElement)
        let id = document.activeElement.id
        id = id.substr(0, id.length-9)
        document.getElementById(id+'_cancel').click()
      }
  })
  // detect text selection for specific div
  document.addEventListener('mouseup', function(e) {
    if (hasClass(e.target, 'specdiv')) {
      let selection = getSelectionText()
      if (selection)
        document.getElementById('specselected').innerHTML = selection
    }
  })
})

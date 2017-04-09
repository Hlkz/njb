
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

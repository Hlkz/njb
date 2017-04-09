
function addListenerMulti(element, eventNames, listener) {
  eventNames.split(' ').forEach(event => { element.addEventListener(event, listener, false) })
}

function removeListenerMulti(element, eventNames, listener) {
  eventNames.split(' ').forEach(event => { element.removeEventListener(event, listener) })
}

let hasClass = (e, className) => (' ' + e.className + ' ').indexOf(' ' + className + ' ') > -1

let isTextarea = obj => obj instanceof HTMLInputElement && obj.type == 'text'

function getAllElementsWithAttribute(attribute) {
  var matchingElements = []
  var allElements = document.getElementsByTagName('*')
  Array.from(allElements).forEach(elem=>{
    if (elem.getAttribute(attribute) !== null) // Element exists with attribute. Add to array.
      matchingElements.push(elem)
  })
  return matchingElements
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

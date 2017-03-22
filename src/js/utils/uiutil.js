/**
 * Returns an object containing elements by className.
 */
export function getElementsByClassNames(element, classNames) {
    let elements = {};
    if (!(classNames instanceof Array)) {
        classNames = classNames.split(' ');
    }
    classNames.forEach(className => {
        elements[className] = element.getElementsByClassName(className)[0];
    });
    return elements;
}

/**
 * Escapes HTML
 */
export function escapeHtml(html) {
    let div = document.createElement('div');
    div.appendChild(document.createTextNode(html));
    return div.innerHTML;
}

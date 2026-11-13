// Runs in the page's MAIN world so React internals (__reactProps$...) are readable.
// Tags Substack profile tab buttons for the isolated content script (see startButtons.js).
const TAB_ATTR = 'data-eb-substack-tab';
const TAB_LABELS = {Activity: 'activity', Posts: 'post'};

function getReactProps (el) {
    for(const key in el) {
        if(key.startsWith('__reactProps$')) {
            return el[key];
        }
    }
    return null;
}

function findTabType (props) {
    const children = props?.children;
    for(const child of Array.isArray(children) ? children : [children]) {
        const label = child?.props?.children;
        if(typeof label === 'string' && Object.hasOwn(TAB_LABELS, label)) {
            return TAB_LABELS[label];
        }
    }
    return '';
}

function tagTabButtons () {
    try {
        for(const btn of document.querySelectorAll(`button[type="button"]:not([${TAB_ATTR}])`)) {
            const type = findTabType(getReactProps(btn));
            if(type) {
                btn.setAttribute(TAB_ATTR, type);
            }
        }
    }
    catch(e) {
        // Ignore pages whose DOM changes while scanning.
    }
}

setInterval(tagTabButtons, 1000);
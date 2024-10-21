function AutoSize(el) {
    if (!(this instanceof AutoSize)) {
        return new AutoSize(el)
    }
    if (!el) {
        throw new Error('element can not be empty')
    }
    if (typeof el === 'string') {
        el = document.querySelector(el)
    }
    this.el = el
    const attrs = ['box-sizing', 'padding-top', 'padding-bottom', 'border-top', 'border-bottom']

    // 初始化信息
    this.heightOffset = 0
    const style = window.getComputedStyle(el)
    const [boxSizing, paddingTop, paddingBottom, borderTop, borderBottom] = attrs.map(item => style.getPropertyValue(item))
    if (boxSizing === 'content-box') {
        this.heightOffset = -(parseFloat(paddingTop)) - parseFloat(paddingBottom)
    } else {
        this.heightOffset = parseFloat(borderTop) + parseFloat(borderBottom)
    }
    this.initEvent()
}

AutoSize.prototype = {
    initEvent() {
        this.listener = this.handleAction.bind(this)
        this.el.addEventListener('input', this.listener, false)
    },
    destroy() {
        this.el.removeEventListener('input', this.listener, false)
        this.listener = null
    },
    handleAction(e) {
        const event = e || window.event
        const target = event.target || event.srcElement
        target.style.height = ''
        target.style.height = target.scrollHeight + this.heightOffset + 'px'
        afterChange(parseFloat(target.style.height))
    }
}

function afterChange(height) {
    var offset = height - 23;
    document.querySelector('.rectangle').style.height = offset + 125 + 'px';
    document.querySelector('.search-div-inside').style.height = offset + 125 + 'px';
    document.querySelector('.border').style.height = offset + 100 + 'px';
}
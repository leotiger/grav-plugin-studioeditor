{
    'mod+shift+b': bindPagedownButton('bold'),
    'mod+shift+i': bindPagedownButton('italic'),
    'mod+shift+l': bindPagedownButton('link'),
    'mod+shift+q': bindPagedownButton('quote'),
    'mod+shift+k': bindPagedownButton('code'),
    'mod+shift+g': bindPagedownButton('image'),
    'mod+shift+o': bindPagedownButton('olist'),
    'mod+shift+u': bindPagedownButton('ulist'),
    'mod+shift+h': bindPagedownButton('heading'),
    'mod+shift+r': bindPagedownButton('hr'),
    'mod+shift+z': bindPagedownButton('undo'),
    'mod+shift+y': bindPagedownButton('redo'),
    'mod+shift+z': bindPagedownButton('redo'),
    'mod+shift+m': function(evt) {
        $('.button-open-discussion').click();
        evt.preventDefault();
    },
    '= = > space': function() {
        expand('==> ', '⇒ ');
    },
    '< = = space': function() {
        expand('<== ', '⇐ ');
    },
    'S t a c k E d i t': function() {
        eventMgr.onMessage("You are stunned!!! Aren't you?");
    }
}

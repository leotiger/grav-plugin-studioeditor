define([
    "classes/Extension",
], function (Extension) {

    var markdownNotes = new Extension("markdownNotes", "Markdown Notes", true);
    markdownNotes.settingsBlock = '';

    markdownNotes.onPagedownConfigure = function (editor) {
        editor.getConverter().hooks.chain("postConversion", function (text) {

            var noteClasses = ['yellow', 'red', 'blue', 'green'];
            //text = text.replace(/^(\?{1,4})[ \t]{1,}(.+?)[ \t]*\!*(\n+)/gm,

            text = text.replace(/^<(blockquote|p|div|h[1-6])(\b[^>]*?)>[\n\r]*(\!{1,4})[ ]{1,}(.*?)<\/(\1)>/gm,
                    function (wholeMatch, m1, m2, m3, m4, m5) {
                        var note_class = noteClasses[m3.length - 1];
                        return "<div class='notices " + note_class + "'><" + m1 + m2 + ">" + m4 + "</" + m5 + "></div>";
                    }
            );
            return text;
        });
    };

    return markdownNotes;
});

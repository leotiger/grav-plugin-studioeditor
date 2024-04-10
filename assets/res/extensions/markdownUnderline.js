define([
    "classes/Extension",
], function(Extension) {

    var markdownNotes = new Extension("markdownNotes", "Markdown Notes", true);
    markdownNotes.settingsBlock = '';

    markdownNotes.onPagedownConfigure = function(editor) {
        editor.getConverter().hooks.chain("postSpanGamut", function(text) {
			/*
			var noteClasses = ['yellow','red','blue','green'];
			//text = text.replace(/^(\?{1,4})[ \t]{1,}(.+?)[ \t]*\!*(\n+)/gm,
			
			text = text.replace(/^\<(blockquote|p|div|h[1-6])([^>]*)\>[\n\r]*(\¡{1,4})[ ]{1,}(.*?)\<\/(blockquote|p|div|h[1-6])\>/gm,
                function (wholeMatch, m1, m2, m3, m4, m5) {
                    var note_class = noteClasses[m3.length - 1];
                    return "<div class='notices " + note_class + "'><" + m1 + m2 + ">" + m4 + "</" + m5 + "></div>";
                }
            );
			return text;
			*/
			  
			//text = text.replace(/([\W_]|^)?(?=\S)([^\r]*?\S[\*_]*)?([\W_]|$)/g, "$1<u>$2</u>$3");
			// Restore original markdown implementation
			//text = text.replace(/(~T~T~T)(?=\S)(.+?[*~T~T]*)(?=\S)\1/g,"<u>$2</u>");
			text = text.replace(/(\!\!)(?=\S)(.+?)(?=\S)\1/g,"<u>$2</u>");
			return text;
			
        });
    };

    return markdownNotes;
});

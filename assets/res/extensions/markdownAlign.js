define([
    "classes/Extension",
], function(Extension) {

    var markdownAlign = new Extension("markdownAlign", "Markdown Align", true);
    markdownAlign.settingsBlock = '';

    markdownAlign.onPagedownConfigure = function(editor) {
        editor.getConverter().hooks.chain("postConversion", function(text) {
			
			var alignClasses = { l:'text-left', r:'text-right', c:'text-center', j:'text-justify' };
			//text = text.replace(/^\<(blockquote|p|div|h[1-6]|li|th|td|dt|dd)([^\>]*)\>(.*?)[ ]{1,}(;{1,1})([l|r|c|j]{1,1})[\n\t ]*\<\/(blockquote|p|div|h[1-6]|li|th|td|dt|dd)\>/gm,
			text = text.replace(/^[\t ]*\<(blockquote|p|div|h[1-6]|li|th|td|dt|dd)([^\>]*)\>[\n]*(.*?)[ ]{1,}(;{1,1})([l|r|c|j]{1,1})[\n\t ]*\<\/(blockquote|p|div|h[1-6]|li|th|td|dt|dd)\>/gm,
                function (wholeMatch, m1, m2, m3, m4, m5, m6) {
                    var align_class = alignClasses[m5];
					if (m2.length > 1 ) {
						if (m2.indexOf("class=") == -1) {
							m2 = m2 + " class='" + align_class + "'";
						} 
						else {
							m2 = m2.replace(/class=(['|"])/i, 
							function(whole, r1) {
								return "class=" + r1 + align_class + " ";
							});							
						}
					}
					else {
						m2 = " class='" + align_class + "'";
					}
                    return "<" + m1 + m2 + ">" + m3 + "</" + m6 + ">";
                }
            );
			return text;
        });
    };

    return markdownAlign;
});

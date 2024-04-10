define([
    "classes/Extension",
], function(Extension) {

    var markdownFixDiv = new Extension("markdownFixDiv", "Markdown Fix Div", true);
    markdownFixDiv.settingsBlock = '';

    markdownFixDiv.onPagedownConfigure = function(editor) {
		
        editor.getConverter().hooks.chain("preConversion", function(text) {
			
			text = text.replace(/^\<\/div\>/gm,
                function (wholeMatch) {
                    return " </div>";
                }
            );
			return text;
        });
    };

    return markdownFixDiv;
});

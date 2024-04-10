/*
Copyright (c) 2016 saveva

johnsonRod.js
Copyright (c) 2013 alkemis, inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

jQuery.fn.extend({
	displayer: function(flag) { //show() + hide()
		if (flag || flag==null) $(this).show(); //undefined will do show()
		else $(this).hide();

		return this;
	},
	classer: function(class_str, flag) { //addClass() + removeClass()
		if (flag || flag==null) $(this).addClass(class_str);  //undefined will do addClass()
		else $(this).removeClass(class_str);

		return this;
	}
});

//4/13 - integrate ftp_json - converted to use jQuery
studioFrontmatterForm= {
	json_obj: null,
	xml_flag: null,
	xml_doctype_str: "",
	xml_root_str: "",
	jsonFormDIV_JQ: null,
	jsonFormDataDIV_JQ: null,
	format_str_arr: ["JSON", "Formatted JSON", "XML"],

	//jsonToForm_end_hook:
	jsonToForm: function(json_str) {

		sFF.json_obj= null;
		sFF.jsonFormDataDIV_JQ= null;
		sFF.xml_flag= false;
		sFF.xml_doctype_str= "";
		sFF.alterCSS("IMG.pasteIMG", "display", "none");
		sFF.alterCSS("IMG.pasteChildnodesIMG", "display", "none");
		//sFF.alterCSS("IMG.pasteAttributesIMG", "display", "none");
		delayedJsonToForm( json_str );
		if (sFF.jsonToForm_end_hook) sFF.jsonToForm_end_hook();

		function delayedJsonToForm(json_str) {
			var msg_str= "";

      source_str= json_str.replace(/\n/g, "");
      try {
        sFF.json_obj= eval("(" +source_str +")")
      } catch(e) {
        msg_str= "JS " +e.name +": " +e.message;
        sFF.json_obj= null;
      }
      if (sFF.json_obj && typeof(sFF.json_obj)!="object") {
        msg_str= sFF.json_obj;
        sFF.json_obj= null;
      }

			if (sFF.json_obj) {
				var flag= sFF.json_obj.length!=undefined;
				var html_str= sFF.xml_flag ? "XML Root:<br><input id='xmlRootINPUT' value='" +sFF.xml_root_str +"'> " : "";
				html_str+= 
					"Form | <span onclick='sFF.expandCollapseAllFormItems(true); ' class='clickable'>Expand all nodes</span> | "
					+"<span onclick='sFF.expandCollapseAllFormItems(false); ' class='clickable'>Collapse all nodes</span>" 
					+"<br/><div id='jsonFormDataDIV'>" +sFF.jsonToForm_step("", sFF.json_obj, flag) +"</div><br/>"
				;
				for (var L=sFF.format_str_arr.length, i=0; i<L; i++) {
					if (i<2 || sFF.xml_flag) html_str+= "<input type='button' class='buttonINPUT' onclick='sFF.formToJson(" +i +"); ' value='Convert Form to " +sFF.format_str_arr[i] +"'> ";
				}
				html_str+= "<br/><textarea id='newJsonTEXTAREA' cols='120' rows='10'></textarea>";
				html_str+= "<br/><input id='evalButtonINPUT' type='button' class='buttonINPUT' onclick='sFF.evalNewJson(); ' value='Eval' style='display:none; '> ";
				sFF.jsonFormDIV_JQ.html(html_str);
				sFF.jsonFormDataDIV_JQ= $("#jsonFormDataDIV");

			} else {
				sFF.jsonFormDIV_JQ.text("");
				alert("Source was invalid.\n\n" +msg_str);
			}

		}
	},
	clipboard: {},
	activeLi_JQ: null,
	jsonToForm_step: function(a, b, c) {
		if (typeof(b)!="object") return "NOT AN OBJECT";
		var d= false;
		if (b) d= b.length!=undefined;
		var e;
		if (c) e= "arrayIndex"
		else if (d) e= "arrayNameINPUT"
		else if (typeof(b)=="object") e= "objectNameINPUT"
		else e= "nameINPUT"

		var f= sFF.xml_flag ? sFF.get_readonly_flag(a) : false;
		var g= sFF.input_html(a, "leftINPUT " +e, true, f) +":";
		g += "\n<ol" +(d ? " class='arrayOL'": "") +">" +sFF.addActions_html(a, d);
		for (var a in b) {
			if (typeof(b[a])=="object" && b[a]!=null) {
				if (b[a].length==undefined) {
					g+= "<li>"
				} else {
					g+= "<li class='arrayLI'>"
				}
				g+= sFF.jsonToForm_step(a, b[a], d);
			} else {
				g+= "<li>";
				var e;
				if (d) {
					e= "arrayIndex";
				} else {
					e= "nameINPUT";
				}
				var h= typeof(b[a])=="string" ? "stringTEXTAREA": "";
				var f= sFF.xml_flag ? sFF.get_readonly_flag(a) : false;
				var i= b[a];
				if (typeof(i)==="undefined") i= "undefined";
				else if (typeof(i)=="number" && !i) i= "0";
				else if (i===null) i= "null";
				else if (i===false) i= "false";
				g+= sFF.input_html(a, "leftINPUT " +e, false, f) +":" +sFF.input_html(i, "rightTEXTAREA " +h);
			}
			g+= "</li>\n";
		}
		return g +"</ol>\n";
	},
	input_html: function(a, b, c, d) {
		if (b.indexOf("arrayIndex")>=0) {
			return sFF.leftActions_html(b, sFF.xml_flag ? false: c) +"<input type='hidden' class='leftINPUT'><span class='indexSPAN'>[" +a +"]</span>";
		} else {
			var e= b;
			if (d) e+= " readonlyINPUT";
			var f= e ? (" class='" +e +"'") : "";
			if (!a && b.indexOf("objectNameINPUT")>=0) {
				return "<input type='hidden' " +f +">";
			} else {
				if (b.indexOf("leftINPUT")>=0) {
					if (d) f+= " readonly";
					return sFF.leftActions_html(b, c) +"<input value='" +a +"'" +f +"><span class='indexSPAN'></span>";
				} else {
					return sFF.textarea_html(a) +sFF.checkbox_html(b);
				}
			}
		}
	},
	leftActions_html: function(a, b) {
		if (!a) a= "";
		var html_str= "";

		if (b) html_str+= "<i class='icon-collapse clickable expandCollapseIMG' data-a='x' title='Expand/Collapse Node'></i> ";
		else html_str+= "<i class='icon-blank'></i> ";
		//if (b) html_str+= "<img src='/img/je/collapse.gif' class='clickable expandCollapseIMG' data-a='x' title='Expand/Collapse Node'> ";
		//else html_str+= "<img src='/img/je/blank.gif'> ";

		if (!sFF.xml_flag || a.indexOf("arrayIndex")>=0) {
			html_str+= "<i class='icon-up clickable' data-a='u' title='Move Node Up'></i>"
			+" <i class='icon-down clickable' data-a='d' title='Move Node Down'></i>"
			+" <i class='icon-copy clickable' data-a='c' title='Copy Node'></i>"
			+" <i class='icon-delete clickable' data-a='r' title='Delete Node (Safe)'></i> ";
      /*
			html_str+= "<img src='/img/je/up.gif' class='clickable' data-a='u' title='Move Node Up'>"
			+" <img src='/img/je/down.gif' class='clickable' data-a='d' title='Move Node Down'>"
			+" <img src='/img/je/copy.gif' class='clickable' data-a='c' title='Copy Node'>"
			+" <img src='/img/je/close.gif' class='clickable' data-a='r' title='Delete Node (Safe)'> ";
      */
		}
		return html_str;
	},
	textarea_html: function(str) {
		if (!str) str= "";
		return "<textarea class='rightTEXTAREA'>" +str +"</textarea>"
		;
	},
	checkbox_html: function(a) {
		var b= "";
		if (!sFF.xml_flag) {
			b= "<label><input type='checkbox' class='checkbox'";
			if (a && a.indexOf("stringTEXTAREA")>=0) b+= " checked ";
			b += "><i>string</i></label>";
		}
		return b;
	},
	addActions_html: function(a, b) {
		var c= "";
		var d= "<li>";
		if (!sFF.xml_flag) {
			var e= b ? "" : "Name:";
			d +=
				"ADD <span class='clickable' data-a='a' data-b='" +b +"' data-c='0'>" +e +"Value</span>" 
				+" | <span class='clickable' data-a='a' data-b='" +b +"' data-c='1'>" +e +"Object</span>" 
				+" | <span class='clickable' data-a='a' data-b='" +b +"' data-c='2'>" +e +"Array</span>"
			;
		} else {
			if (a=="attributes" || a=="childNodes") {
				d += "ADD ";
				if (a=="attributes") {
					c= " pasteAttributesIMG";
					d+= "<span class='clickable' data-a='a' data-c='0'>Name:Value</span>";
				} else {
					c= " pasteChildnodesIMG";
					d+= 
						"<span class='clickable' data-a='a' data-c='1'>Name:Object</span>" 
						+" | <span class='clickable' data-a='a' data-c='3'>TextNodeValue</span>"
					;
				}
			}
		}
		if (d) d+= " <i class='icon-paste clickable pasteIMG" + c +"' data-a='p' title='Paste'></i></li>";
		//if (d) d+= " <img src='/img/je/paste.gif' class='clickable pasteIMG" +c +"' data-a='p' title='Paste'>";
		return d;
	},
	expandCollapseAllFormItems: function(flag) {
		$("IMG.expandCollapseIMG", sFF.jsonFormDataDIV_JQ).each(function(i, el) {
			sFF.expandCollapseFormItem($(el), flag);
		});
	},
	expandCollapseFormItem: function(img_JQ, flag) {
		var ol_JQ= img_JQ.siblings("OL");
		if (ol_JQ.length) {
			var el= img_JQ[0];
			if (flag==undefined) flag= el.src.indexOf("collapse")<0;
			ol_JQ.displayer(flag);
			el.src = "/img/je/" +(flag ? "collapse": "expand") +".gif";
		}
	},
	deleteFormItem: function(img_JQ) {
		var li_JQ= sFF.activeLi_JQ;
		if (li_JQ && li_JQ.length) {
			if (li_JQ.hasClass("deleted")) {
				sFF.globalRestoreLI_JQ= li_JQ;
				var html_str= 
					"<input type='button' class='buttonINPUT' onclick='sFF.restoreFormItem(); ' value='Restore THIS Node'>"
					+"<br><br><input id='removeAllDeletedINPUT' type='button' onclick='sFF.allDeletedFormItems(); ' value='Remove ALL Marked Nodes'>"
				;
				sFF.messageRight(img_JQ, html_str, 0);
			} else {
				li_JQ.addClass("deleted");
			}
		}
	},
	restoreFormItem: function() {
		sFF.globalRestoreLI_JQ.removeClass("deleted");
		sFF.messageClose();
	},
	allDeletedFormItems: function() {
		sFF.jsonFormDataDIV_JQ.find("LI.deleted").each(function(i, el) {
			el.parentNode.removeChild(el);
		});
		sFF.messageClose();
	},
	addFormItem: function(span_JQ) {
		var ol_JQ= span_JQ.closest("OL");
		if (ol_JQ.length) {
			var b= span_JQ.data("b");
			var c= span_JQ.data("c");

			var li_JQ= $("<LI>");
			var f= false;
			var g= true;
			var h;
			if (c==0 || c==3) {
				g= false;
				h= "nameINPUT";
				if (c==3) f= true;
			} else if (c==1) {
				h= "objectNameINPUT";
			} else {
				h= "arrayNameINPUT";
			}
			if (b) h= "arrayIndex";
			var html_str= sFF.input_html( (c==3 ? "textNode" : "*"), "leftINPUT " +h, g, f) +":";
			if (c==0 || c==3) {
				html_str+= sFF.textarea_html() +sFF.checkbox_html("stringTEXTAREA");
			} else {
				if (c==2) {
					html_str+= "<ol class='arrayOL'>" + sFF.addActions_html("", true) +"</ol>"
				} else {
					if (sFF.xml_flag) {
						var xmlDefaultNodesStr= 
							"<li>" +sFF.leftActions_html("", true) +"<input class='leftINPUT objectNameINPUT readonlyINPUT' readonly='' value='attributes'/>:" 
							+" <ol class='arrayOL'>" +sFF.addActions_html("attributes") +" </ol>" +"</li>" 
							+"<li>" +sFF.leftActions_html("", true) +"<input class='leftINPUT objectNameINPUT readonlyINPUT' readonly='' value='childNodes'/>:" 
							+" <ol class='arrayOL'>" +sFF.addActions_html("childNodes") +" </ol></li>"
						;
						html_str+= "<ol>" +sFF.addActions_html() +xmlDefaultNodesStr +"</ol>";
					} else {
						html_str+= "<ol>" +sFF.addActions_html("", false) +"</ol>";
					}
				}
			}
			if (sFF.xml_flag) html_str= sFF.leftActions_html("arrayIndex", false) +"<input type='hidden' class='leftINPUT'>[*]:<ol><li>" +html_str +"</li></ol>"

			if (c==2) li_JQ.addClass("arrayLI");
			li_JQ.html(html_str);
			sFF.liNew(li_JQ, ol_JQ);
		}
	},
	moveFormItem: function(img_JQ, after_flag) {
		var li_JQ= sFF.activeLi_JQ;
		var JQ= after_flag ? li_JQ.next("LI") : li_JQ.prev("LI");
		if (!JQ.length) {
			var OL_JQ= li_JQ.closest("OL");
			JQ= after_flag ? OL_JQ.children("LI:first") : OL_JQ.children("LI:last");
			if (JQ[0]==li_JQ[0]) return; //--> only 1 item in list
			after_flag= !after_flag;
		}
		if (after_flag) li_JQ.insertAfter(JQ);
		else li_JQ.insertBefore(JQ);
	},
	copyFormItem: function(img_JQ) {
		var li_JQ= sFF.activeLi_JQ;
		if (li_JQ) {
			var ol_JQ= li_JQ.closest("OL");
			if (ol_JQ.length) {
				sFF.clipboard.li_JQ= li_JQ.clone(); //copy to clipboard
				sFF.clipboard.ol_class_str= ol_JQ.attr("class");
				sFF.clipboard.li_JQ.removeClass("deleted");
				var ar_flag= ol_JQ.attr("class")=="arrayOL";

				var JQ;
				if (!sFF.xml_flag) {
					JQ= li_JQ;
				} else {
					JQ= li_JQ.children("OL:first");
					if (JQ.length) JQ= JQ.children("LI:first"); //children or find????
				}

				var html_str= "";
				if (JQ.length) {
					var input_JQ= JQ.find("INPUT.leftINPUT:first");
					if (input_JQ.length) {
						if (input_JQ.attr("type")=="hidden") html_str+= "#";
						else html_str+= '"' +input_JQ.val() +'"';
						html_str+= ":";

						var ta_JQ= JQ.children("TEXTAREA:first");
						if (ta_JQ.length) html_str+= '"' +ta_JQ.val() +'"';
						else html_str+= JQ.hasClass("arrayLI") ? "[]" : "{}";
					}
				}
				sFF.messageRight(img_JQ, "<b>" +(ar_flag ? "Array item": "Object") +" copied:</b><br>" +html_str);
				var str= "none";
				if (!sFF.xml_flag) {
					str= "pasteIMG";
					sFF.alterCSS("IMG.pasteIMG", "display", "inline");

				} else {
					var p_li_JQ= ol_JQ.closest("LI");
					if (p_li_JQ.length) {
						var input_JQ= p_li_JQ.children("INPUT.leftINPUT:first");
						if (input_JQ.length) {
							var at_flag= input_JQ.val()=="attributes";
							str= at_flag ? "pasteAttributesIMG": "pasteChildnodesIMG";
							var i_str= at_flag ? "pasteChildnodesIMG": "pasteAttributesIMG";
							sFF.alterCSS("IMG." +str, "display", "inline");
							sFF.alterCSS("IMG." +i_str, "display", "none");
						}
					}
				}
				sFF.jsonFormDataDIV_JQ.find("IMG." +str).each(function(i, el) {;
					el.title= "Paste: " +html_str.replace('"', "'", "g");
				});
			}
		}
	},

	pasteFormItem: function(img_JQ) {
		if (sFF.clipboard.li_JQ) {
			var ol_JQ= img_JQ.closest("OL");
			if (ol_JQ.length) {
				var li_JQ= sFF.clipboard.li_JQ.clone(); //copy from clipboard
				sFF.liNew(li_JQ, ol_JQ);

				if (ol_JQ.attr("class")!=sFF.clipboard.ol_class_str) {
					var input_JQ= li_JQ.find("INPUT.leftINPUT:first");
					var span_JQ= li_JQ.find("SPAN.indexSPAN:first");
					if (ol_JQ.attr("class")=="arrayOL") {
						span_JQ.html("[*]");
						input_JQ[0].type= "hidden"; //skip jQ for this

					} else {
						span_JQ.html("");
						input_JQ[0].type= "text"; //skip jQ for this
						if (!input_JQ.val()) input_JQ.val("*");
					}
				}
				var html_str= img_JQ[0].title.replace("Paste: ", "<b>Pasted:</b><br>");
				sFF.messageRight(img_JQ, html_str);
			}
		} else {
			sFF.messageRight(img_JQ, "</b>Nothing in clipboard.</b>");
		}
	},
	formClicked: function(evt) {
		var el= evt.target;
		var JQ= $(el);
		sFF.liActive(JQ.closest("LI"));

		if (JQ.hasClass("clickable")) sFF.liActions[JQ.data("a")](JQ);
	},
	liActions: {
		x: function(JQ) {sFF.expandCollapseFormItem(JQ); }, //expand/collapse
		u: function(JQ) {sFF.moveFormItem(JQ,0); }, //up
		d: function(JQ) {sFF.moveFormItem(JQ,1); }, //down
		c: function(JQ) {sFF.copyFormItem(JQ); }, //copy
		r: function(JQ) {sFF.deleteFormItem(JQ); }, //remove
		p: function(JQ) {sFF.pasteFormItem(JQ); }, //paste
		a: function(JQ) {sFF.addFormItem(JQ); } //add
	},
	liNew: function(li_JQ, ol_JQ) {
		var first_li_JQ= ol_JQ.children("LI:first");
		if (first_li_JQ.length) li_JQ.insertBefore(first_li_JQ);
		else li_JQ.appendTo(ol_JQ);

		sFF.liActive(li_JQ);
	},
	liActive: function(JQ) {
		if (sFF.activeLi_JQ) sFF.activeLi_JQ.removeClass("activeLI");
		if (!JQ.length) return; //-->

		JQ.addClass("activeLI");
		sFF.activeLi_JQ= JQ;
	},
	get_readonly_flag: function(a) {
		return (a=="attributes" || a=="childNodes" || a=="textNode");
	},
	format_num: 0,
	linebreak_str: "",
	error_ct: [],
	error1_msg: "",

	//formToJson_end_hook:
	formToJson: function(format_num) {
		sFF.error_ct= [0, 0];
		sFF.error1_msg= "";
		sFF.format_num= format_num;
		sFF.linebreak_str= format_num ? "\n": "";
		var f_div_JQ= sFF.jsonFormDataDIV_JQ;
		var ta_JQ= $("#newJsonTEXTAREA");
		ta_JQ.val("Processing..");
		if (format_num==2) sFF.xml_root_str= $("#xmlRootINPUT").val();
		var html_str= "";
		var flag= 0;
		if (format_num==2) {
			flag= 1;
			if (sFF.xml_doctype_str) html_str+= sFF.xml_doctype_str +sFF.linebreak_str;
			html_str+= "<" +sFF.xml_root_str;
		}
		html_str+= sFF.formToJson_step(f_div_JQ, flag, "");

		if (format_num==2) html_str+= "</" +sFF.xml_root_str +">";
		ta_JQ.val(html_str);
		$("#evalButtonINPUT").displayer(format_num<2);
		var msg_str= "";
		if (sFF.error_ct[0]) msg_str= sFF.get_plural_str(sFF.error_ct[0], 'name') +'left empty, replaced by "undefined".\n';
		if (sFF.error_ct[1]) msg_str+= sFF.get_plural_str(sFF.error_ct[1], 'nonstring value') +"left empty, replaced by 0 in " +sFF.error1_msg.substr(0, sFF.error1_msg.length -2) +".";
		if (msg_str) {
			msg_str= "\n\nWarning:\n" +msg_str;
			alert("Form convert to " +sFF.format_str_arr[format_num] +"." +msg_str);
		}
		if (sFF.formToJson_end_hook) sFF.formToJson_end_hook();
	},

	formToJson_step: function(JQ, e, f, g) {
		var input_JQ= JQ.children("INPUT");
		if (input_JQ.length) {
			var j= "";
			var k= "";
			var str= processText(input_JQ[0].value);
			var m= false;
			if (input_JQ[0].type!="hidden") {
				if (!str || str=="*") {
					sFF.error_ct[0]++;
					str= "undefined";
					input_JQ[0].value= str;
				}
				if (sFF.format_num==2) { //xml
					m= (str=="attributes" || str=="childNodes");
					k= "";
					if (!m && str!="textNode") {
						if (g=="attributes") j+= " " +str +"=";
						else j+= pad_html("<" +str, e);
					}
				} else {
					k= '"' +str +'":';
				}
			}
			if (sFF.format_num<2) j+= pad_html(k, e);
			var ol_JQ= JQ.children("OL:first");
			if (ol_JQ.length) {
				var ar_flag= ol_JQ.hasClass("arrayOL");
				if (sFF.format_num<2) j+= (ar_flag ? "[": "{") +sFF.linebreak_str;
				var LIs_JQ= ol_JQ.children("LI");
				if (LIs_JQ.length) {
					var ct= 0, li_JQ;
					LIs_JQ.each(function(i, el) {
						li_JQ= $(el)
						if (!li_JQ.hasClass("deleted")) {
							ct++;
							var r= "";
							var s;
							if (sFF.format_num==2) { //xml
								r= str;
								s= e;
								if (r=="") r= g;
								else if (!m) s= e +1;
							} else {
								s= e +1;
							}
							j+= sFF.formToJson_step(li_JQ, s, ",", r); //recurse
						}
					});

					if (sFF.format_num<2 && ct) {
						var L= j.lastIndexOf(",");
						j= j.substring(0, L) +j.substring(L +1);
					}
				}
				if (sFF.format_num==2) { //xml
					if (str=="attributes") j+= ">" +sFF.linebreak_str;
					k= "";
					if (str!="attributes" && str!="childNodes" && str!="textNode" && str!="") {
						k= "</" +str +">" +sFF.linebreak_str;
					}
				} else {
					k= ar_flag ? "]": "}";
				}
				if (k) j+= pad_html(k, e);

			} else {
				var t= JQ.find("INPUT:checked").length; //is name-value, has no nodes below
				if (sFF.format_num==2 && g!="attributes") t= 0;
				var u= t ? '"': "";
				var ta_JQ= JQ.children("TEXTAREA:first");
				if (ta_JQ.length) {
					k= ta_JQ.val();
					if (sFF.format_num<2) k= processText(k);
					else k= jQuery.trim(k);
				}
				if (!k && !t && sFF.format_num<2) {
					k= "0";
					ta_JQ.val(k);
					sFF.error_ct[1]++;
					sFF.error1_msg+= (l ? "'" +l +"'": "[array item]") +", ";
				}
				k= u +k +u;
				if (sFF.format_num==2 && g!="attributes") k= pad_html(k, e) +sFF.linebreak_str; //xml
				j+= k
			}
			if (sFF.format_num<2) j= j +f +sFF.linebreak_str;
			return j;
		}
		function processText(a) {
			return jQuery.trim(a.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n"));
		}
		function pad_html(a, b) {
			if (!sFF.format_num) return a;
			var c= "";
			while (b>0) {
				c+= "\t";
				b--;
			}
			return c +a;
		}
	},
	evalNewJson: function() {
		var ta_JQ= $("#newJsonTEXTAREA");
		var str= jQuery.trim(ta_JQ.val());
		if (str) {
			var b= "Eval OK";
			try {
				sFF.json_obj= eval("(" +str +")");
			} catch(e) {
				b= "Invalid.\n\nJS " +e.name +": " +e.message;
			} finally {
				alert(b);
			}
		}
	},
	alterCSS: function(selector_str, attr_str, value_str) { //is this really faster? dont remember testing - in theory it probably is faster //done mostly as goof
		if (!selector_str || !attr_str || !value_str) return;
		var type_str;

		if (document.getElementById) type_str= "cssRules";
		else if (document.all) type_str= "rules"; //IE
		else return;

		//lowercasing for webkit
		selector_str= selector_str.toLowerCase();

		var rules= document.styleSheets[0][type_str];
		for (var i= 0, rule; rule= rules[i]; i++) {
			if (rule.selectorText.toLowerCase()==selector_str) {
				rule.style[attr_str]= value_str;
				break;
			}
		}
	},

	//growl-ish messenger
	messageDiv_JQ: null,
	messageClose_img_el: null,
	messageDivContent_JQ: null,
	message_timer: null,
	messageRight: function(img_JQ, html_str, fade_sec) {
		clearTimeout(sFF.message_timer);
		sFF.messageDivContent_JQ.html(html_str);

		var pos= img_JQ.offset(); 
		pos.left+= img_JQ[0].offsetWidth;
		sFF.messageDiv_JQ[0].style.left= pos.left +"px";
		sFF.messageDiv_JQ[0].style.top= pos.top +"px";
		sFF.messageDiv_JQ.show();
		if (fade_sec==undefined) fade_sec= 2;
		if (fade_sec>0) sFF.message_timer= window.setTimeout(delayedClose, fade_sec *1000);
		sFF.messageDiv_JQ.classer("messageAutoCloseDIV", fade_sec>0);
		sFF.messageClose_img_el.src= "/img/je/" +(fade_sec>0 ? "countdown": "popupClose") +".gif";

		function delayedClose() {
			if (sFF.messageDiv_JQ.is(":visible")) sFF.messageDiv_JQ.fadeOut();
		}
	},
	messageClose: function() {
		clearTimeout(sFF.message_timer);
		sFF.messageDiv_JQ.hide();
	},

	get_readonly_flag: function(a, b) {
		return a +" " +b +(a!=1 ? "s" : "") +" ";
	},
	get_plural_str: function(a, b) {
		return a +" " +b +(a!=1 ? "s": "") +" ";
	},
};

sFF = studioFrontmatterForm;


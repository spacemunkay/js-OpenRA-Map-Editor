/**********************************************************************
 *
 * yaml_dumper.js
 * $Id: yaml_dumper.js,v 1.12 2002/10/28 22:20:29 eserte Exp $
 *
 * (c) 2002 Slaven Rezic. 
 * This program is free software; you can redistribute it and/or modify
 * it under the same terms as Perl.
 *
 **********************************************************************/

// detect javascript implementation
var YAML_JS;
if (typeof VM != "undefined") {
    YAML_JS = "njs";
} else if (typeof navigator != "undefined" && navigator.appName == "Netscape") {
    if (navigator.appVersion.indexOf("4.") == 0) { // no check for 3.
	YAML_JS = "js1.3"; // ???
    } else {
	YAML_JS = "js1.4";
    }
} else {
    // mozilla standalone?
    YAML_JS = "js1.4"; // XXX differentiate!
}

// Context constants
var YAML_KEY = 3;
var YAML_FROMARRAY = 5;
var YAML_FROMMAPPING = 6;
var YAML_VALUE = "\x07YAML\x07VALUE\x07";

// Common YAML character sets
var YAML_ESCAPE_CHAR;
if (YAML_JS == "njs") { // workaround njs 0.2.5 bug (?)
    YAML_ESCAPE_CHAR = "[";
    for(var i=0x00; i<=0x08; i++) { YAML_ESCAPE_CHAR += String.fromCharCode(i); }
    for(var i=0x0b; i<=0x1f; i++) { YAML_ESCAPE_CHAR += String.fromCharCode(i); }
    YAML_ESCAPE_CHAR += "]";
} else {
    YAML_ESCAPE_CHAR = "[\\x00-\\x08\\x0b-\\x1f]";
}
var YAML_FOLD_CHAR = ">";
var YAML_BLOCK_CHAR = "|";

YAML_Indent         = 1;
YAML_UseHeader      = true;
YAML_UseVersion     = false;
YAML_SortKeys       = false;
YAML_AnchorPrefix   = "";
YAML_UseCode        = false;
YAML_DumpCode       = "";
YAML_LoadCode       = "";
YAML_ForceBlock     = false;
YAML_UseBlock       = false;
YAML_UseFold        = false;
YAML_CompressSeries = false;
//XXX NYI  YAML_InlineSeries   = false;
YAML_UseAliases     = true;
YAML_Purity         = false;
YAML_DateClass      = "";

function YAML() {
    this.stream         = "";
    this.level          = 0;
    this.anchor         = 1;
    this.Indent         = YAML_Indent;
    this.UseHeader      = YAML_UseHeader;
    this.UseVersion     = YAML_UseVersion;
    this.SortKeys       = YAML_SortKeys;
    this.AnchorPrefix   = YAML_AnchorPrefix;
    this.DumpCode       = YAML_DumpCode;
    this.LoadCode       = YAML_LoadCode;
    this.ForceBlock     = YAML_ForceBlock;
    this.UseBlock       = YAML_UseBlock;
    this.UseFold        = YAML_UseFold;
    this.CompressSeries = YAML_CompressSeries;
    //XXX NYI    this.InlineSeries   = YAML_InlineSeries;
    this.UseAliases     = YAML_UseAliases;
    this.Purity         = YAML_Purity;
    this.DateClass      = YAML_DateClass;

    // methods
    this.dump  = YAML_dump;
    this.dump1 = YAML_dump1;
    this._emit_header = YAML_emit_header;
    this._emit_node = YAML_emit_node;
    this._emit_mapping = YAML_emit_mapping;
    this._emit_sequence = YAML_emit_sequence;
    this._emit_str = YAML_emit_str;
    this._emit_key = YAML_emit_key;
    this._emit_nested = YAML_emit_nested;
    this._emit_simple = YAML_emit_simple;
    this._emit_double = YAML_emit_double;
    this._emit_single = YAML_emit_single;
    this._emit_function = YAML_emit_function;
    this._emit_regexp = YAML_emit_regexp;
    this.is_valid_implicit = YAML_is_valid_implicit;
    this.indent = YAML_indent;
}

function YAMLDump() {
    var o = new YAML();
    return o.dump(arguments);
}

function YAML_dump1(arg) {
    return this.dump([arg]);
}

function YAML_dump(args) {
    this.stream   = "";
    this.document = 0;

    for(var doc_i = 0; doc_i < args.length; doc_i++) {
	var doc = args[doc_i];
	this.document++;
	this.transferred = {};
	this.id_refcnt   = {};
	this.id_anchor   = {};
	this.anchor      = 1;
	this.level       = 0;
	this.offset      = [0 - this.Indent];
	this._emit_header(doc);
	this._emit_node(doc);
    }

    return this.stream;
}

function YAML_emit_header(node) {
    if (!this.UseHeader && this.document == 1) {
	// XXX croak like in the perl version?
	this.headless = true;
	return;
    }
    //this.stream += "---";
    if (this.UseVersion) {
	this.stream += " #YAML:1.0";
    }
}

function YAML_emit_node(node, context) {
    if (typeof context == "undefined") context = 0;

    if        (typeof node == "undefined" || node == null) {
	return this._emit_str(null);
    } else if (typeof node == "#array") { // njs array
	return this._emit_sequence(node);
    } else if (typeof node == "object") { // mozilla array & object
	var is_a_mapping = false;
	var is_empty = true;
	for (var i in node) {
	    is_empty = false;
	    if (isNaN(i)) {
		is_a_mapping = true;
		break;
	    }
	}
	if (!is_empty) {
	    if (is_a_mapping) {
		return this._emit_mapping(node, context);
	    } else {
		return this._emit_sequence(node);
	    }
	} else {
	    if (typeof node.length != "undefined") {
		return this._emit_sequence(node, context);
	    } else {
		return this._emit_mapping(node, context);
	    }
	}
    } else if (typeof node == "function") {
	if (String(node).indexOf("/") == 0) {
	    return this._emit_regexp(node);
	} else {
	    return this._emit_function(node);
	}
    } else if (typeof node == "string" || typeof node == "boolean") {
	return this._emit_str(node, context);
    } else {
	return this._emit_str(String(node), context);
    }
}

function YAML_emit_mapping(value, context) {
    var keys = new Array;
    for(var key in value) {
	keys[keys.length] = key;
    }

    if (keys.length == 0) { // empty hash
	this.stream += " {}\n";
	return;
    }

    if (context == YAML_FROMARRAY && this.CompressSeries) {
        this.stream += " ";
	this.offset[this.level+1] = this.offset[this.level] + 2;
    } else {
        if (!this.headless && context !== 0) {
            if ( value.id === undefined ){
              this.stream += "\n";
              this.headless = false;
            }
        }
        context = 0;
        this.offset[this.level+1] = this.offset[this.level] + this.Indent;
    }
    
    if (this.SortKeys) {
	keys.sort(YAML_cmp_strings);
    }
	
    this.level++;
    for(var key_i = 0; key_i < keys.length; key_i++) {
	    var key = keys[key_i];
        context = 0;
        if( key === "id" ){
          this._emit_str( value[key]);
          //this._emit_node(value[key], YAML_FROMMAPPING);
        }else{
          this._emit_key(key, context);
          this.stream += ":";
          this._emit_node(value[key], YAML_FROMMAPPING);
        }
    }
    this.level--;
}

function YAML_emit_sequence(value) {
    if (value.length == 0) {
	this.stream += " []\n";
	return;
    }

    if (!this.headless) {
	//this.stream += "\n";
	this.headless = false;
    }

    // XXX NYI InlineSeries

    this.offset[this.level + 1] = this.offset[this.level] + this.Indent;
    this.level++;
    for(var i = 0; i < value.length; i++) {
	//this.stream += YAML_x(" ", this.offset[this.level]);
    if ( i > 0 ){
	  this.stream += ",";
    }
	this._emit_node(value[i], YAML_FROMARRAY);
    }
	this.stream += "\n";
    this.level--;
}

function YAML_emit_key(value, context) {
    if (context != YAML_FROMARRAY) {
	this.stream += YAML_x("\t", this.offset[this.level]);
    }
    this._emit_str(value, YAML_KEY);
}

function YAML_emit_str(value, type) {
    if (typeof type == "undefined") type = 0;

    // Use heuristics to find the best scalar emission style.
    this.offset[this.level + 1] = this.offset[this.level] + this.Indent;
    this.level++;

    if (value != null &&
	typeof value != "boolean" &&
	value.match(new RegExp(YAML_ESCAPE_CHAR)) == null &&
	(value.length > 50 || value.match(/\n[ \f\n\r\t\v]/) != null ||
	 (this.ForceBlock && type != YAML_KEY)
	 )
	) {
	this.stream += (type == YAML_KEY ? "? " : " ");
	if ((this.UseFold && !this.ForceBlock) ||
	    value.match(/^[^ \f\n\r\t\v][^\n]{76}/) != null
	    ) {
            if (this.is_valid_implicit(value)) {
                this.stream += "! ";
            }
            this._emit_nested(YAML_FOLD_CHAR, value);
        } else {
            this._emit_nested(YAML_BLOCK_CHAR, value);
        }
        this.stream += "\n";
    } else {
	if (type != YAML_KEY) {
	    this.stream += " ";
	}
        if        (value != null && value == YAML_VALUE) {
            this.stream += "=";
        } else if (YAML_is_valid_implicit(value)) {
            this._emit_simple(value);
        } else if (value.match(new RegExp(YAML_ESCAPE_CHAR + "|\\n|\\'")) != null) {
            this._emit_double(value);
        } else {
            this._emit_single(value);
        }
      if (type != YAML_KEY && type != YAML_FROMARRAY) {
          this.stream += "\n";
      }
    }
    
    this.level--;
}

function YAML_is_valid_implicit(value) {
    if (   value == null
	|| typeof value == "number"       // !int or !float (never reached)
	|| typeof value == "boolean"      // !int or !float (never reached)
	|| value.match(/^(-?[0-9]+)$/) != null       // !int
	|| value.match(/^-?[0-9]+\.[0-9]+$/) != null    // !float
	|| value.match(/^-?[0-9]+e[+-][0-9]+$/) != null // !float
	   ) {
	return true;
    }
    if (   value.match(new RegExp(YAML_ESCAPE_CHAR)) != null
	|| value.match(/(^[ \f\n\r\t\v]|\:( |$)|\#( |$)|[ \f\n\r\t\v]$)/) != null
	|| value.indexOf("\n") >= 0
	) {
	return false;
    }
    if (value.charAt(0).match(/[A-Za-z0-9_]/) != null) { // !str
	return true;
    }
    return false;
}

function YAML_emit_nested(indicator, value) {
    this.stream += indicator;

    var end = value.length - 1;
    var newlines_end = 0;
    while(end >= 0 && value.charAt(end) == "\n") {
	newlines_end++;
	if (newlines_end > 1) break;
	end--;
    }

    var chomp = (newlines_end > 0 ? (newlines_end > 1 ? "+" : "") : "-");
    if (value == null) {
	value = "~";
    }
    this.stream += chomp;
    if (value.match(/^[ \f\n\r\t\v]/) != null) {
	this.stream += this.Indent;
    }
    if (indicator == YAML_FOLD_CHAR) {
        value = YAML_fold(value);
	if (chomp != "+") {
	    value = YAML_chop(value);
	}
    }
    this.stream += this.indent(value);
}

function YAML_emit_simple(value) {
    if (typeof value == "boolean") {
	this.stream += value ? "True" : "False";
    } else {
	this.stream += value == null ? "" : value;
    }
}

function YAML_emit_double(value) {
    var escaped = YAML_escape(value);
    escaped = escaped.replace(/\"/g, "\\\"");
    this.stream += "\"" + escaped + "\"";
}

function YAML_emit_single(value) {
    this.stream += "'" + value + "'";
}

function YAML_emit_function(value) {
    this.offset[this.level + 1] = this.offset[this.level] + this.Indent;
    this.level++;
    this.stream += " !javascript/code: ";
    this._emit_nested(YAML_BLOCK_CHAR, String(value));
    this.stream += "\n";
    this.level--;
}

function YAML_emit_regexp(value) {
    this.offset[this.level + 1] = this.offset[this.level] + this.Indent;
    this.level++;
    this.stream += " !javascript/regexp:";
    this.level--; // XXX somewhat hackish
    var rx = {MODIFIERS: (value.global ? "g" : "")
	                 + (value.ignoreCase ? "i" : "")
	                 + (value.multiline ? "m" : ""),
	      REGEXP:    value.source
    };
    this._emit_mapping(rx,0);
}

function YAML_indent(text) {
    if (text.length == 0) return text;
    if (text.charAt(text.length-1) == "\n")
	text = text.substr(0, text.length-1);
    var indent = YAML_x("\t", this.offset[this.level]);

    if (YAML_JS == "js1.3") {
	var text_a = text.split("\n");
	var res = [];
	for(var i = 0; i < text_a.length; i++) {
	    res[res.length] = text_a[i].replace(/^/, indent);
	} 
	text = res.join("\n");
    } else {
	var rx = (YAML_JS == "njs" ? new RegExp("^(.)", "g") : new RegExp("^(.)", "gm"));
	text = text.replace(rx, indent+"$1");
    }

    text = "\n" + text;
    return text;
}

function YAML_fold(text) {
    var folded = "";
    text = text.replace(/^([^ \f\n\r\t\v].*)\n(?=[^ \f\n\r\t\v])/g, RegExp.$1 + "\n\n");
    while (text.length > 0) {
        if        (text.match(/^([^\n]{0,76})(\n|\Z)/) != null) {
	    text = text.replace(/^([^\n]{0,76})(\n|\Z)/, "");
            folded += RegExp.$1;
        } else if (text.match(/^(.{0,76})[ \f\n\r\t\v]/) != null) { 
	    text = text.replace(/^(.{0,76})[ \f\n\r\t\v]/, "");
            folded += RegExp.$1;
        } else {
	    // XXX croak?
	    text = text.replace(/(.*?)([ \f\n\r\t\v]|\Z)/, "");
            folded += RegExp.$1;
        }
        folded += "\n";
    }
    return folded;
}

YAML_escapes =
    ["\\z",   "\\x01", "\\x02", "\\x03", "\\x04", "\\x05", "\\x06", "\\a",
     "\\x08", "\\t",   "\\n",   "\\v",   "\\f",   "\\r",   "\\x0e", "\\x0f",
     "\\x10", "\\x11", "\\x12", "\\x13", "\\x14", "\\x15", "\\x16", "\\x17",
     "\\x18", "\\x19", "\\x1a", "\\e",   "\\x1c", "\\x1d", "\\x1e", "\\x1f",
    ];

function YAML_escape(text) {
    text = text.replace(/\\/g, "\\\\");
    var new_text = "";
    for(var i = 0; i < text.length; i++) {
	if (text.charCodeAt(i) <= 0x1f) {
	    new_text += YAML_escapes[text.charCodeAt(i)];
	} else {
	    new_text += text.charAt(i);
	}
    }
    return new_text;
}

function YAML_x(s,n) {
    var ret = "";
    for (var i=1; i<=n; i++) {
	ret += s;
    }
    return ret;
}

function YAML_chop(s) {
    return s.substr(0, s.length-1);
}

function YAML_cmp_strings(a,b) {
    a = String(a);
    b = String(b);
    if (a < b) return -1;
    if (a > b) return +1;
    return 0;
}

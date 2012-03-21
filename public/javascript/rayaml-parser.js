/** Parses OpenRA custom YAML */

var RAParser = {};

RAParser.parse = function( text , id ){
  this.level = -1;
  this.lines = text.split("\n");
  this.rmEmptyLines(this.lines);
  return this.getMapping( id );
}

RAParser.getMapping = function( id ){
  this.level++;
  var obj = {};
  obj["id"] = id;
  while( this.keyInMapping() ){
    var p = this.getPair(); //this shifts the lines array
    if( this.isMapping() ){
      obj[p.key] = this.getMapping(p.value);
    }else{
      obj[p.key] = p.value; 
    }
  }
  this.level--;
  return obj;
};

RAParser.keyInMapping = function(){
  var line = this.getCurrLine();
  if( line !== undefined && this.getNumIndents(line) === this.level ){
    return true;
  }
  return false;
};

RAParser.isMapping = function(){
   //the line with the key has already been shifted, 
   //so the next line is now the current line
   var line = this.getCurrLine();
   if ( line !== undefined ){
     if( this.getNumIndents(line) > this.level ){
       return true; 
     }
  }
  return false; 
}

RAParser.getNumIndents = function(line){
  //get the tabs at the begingging of line
  tabs = line.match(/^(\t)+/g);
  if( tabs !== null ){
    //count the tabs
    indents = tabs[0].match(/(\t)/g);
    return indents.length ;
  }
  return 0;
};

RAParser.getPair = function(){
  var line = this.lines.shift();
  if( line === undefined ) { return null };
  var split = line.split(":");
  var key = this.getKey(split[0]);
  var value = this.getValue(split[1]);
  //console.log( "key: " + key + " --- " + "value: " + value);
  return {"key": key, "value": value};
};

RAParser.getKey = function(key){
  //ltrim
  key = key.replace(/^\s+/,"")//.toLowerCase();
  if( key === "location" ){
    key = "loc";
  }
  return key;
};

RAParser.getValue = function(value){
  if( value === undefined || value === "") { return null; }
  //ltrim
  value = value.replace(/^\s+/,"");
  var split = value.split(",");
  if( split.length > 1 ){
    for( idx in split){
      split[idx] = split[idx].replace(/^\s+/,"");
    }
    return split;
  }
  return value;
};

RAParser.getCurrLine = function(){
  return this.lines[0];
}

RAParser.rmEmptyLines = function(lines){
  for( index in lines ){
    var line = lines[index];
    if( line !== undefined ){
      if( line.match(/^\s*$/) !== null ){
        lines.splice( index, 1);
      }
    }
  }
};
/**
var text = "Selectable: False\n\nMapFormat: 5\n\nTitle: Name your map here\nDescription: Describe your map here\nAuthor: Your name here\nTileset: SNOW\nMapSize: 128,128\nBounds: 16,16,96,96\nUseAsShellmap: False\nType: Conquest\nPlayers:\n\tPlayerReference@Neutral:\n\t\tName: Neutral\n\t\tOwnsWorld: True\n\t\tNonCombatant: True\n\t\tRace: allies\n\tPlayerReference@Creeps:\n\t\tName: Creeps\n\t\tNonCombatant: True\n\t\tRace: allies\nActors:\n\tActor0: mpspawn\n\t\tLocation: 25,23\n\t\tOwner: Neutral\n\tActor1: mpspawn\n\t\tLocation: 25,42\n\t\tOwner: Neutral\nSmudges:\nRules:\nSequences:\nWeapons:\nVoices:"
var doc = RAParser.parse( text, 'map.yaml' );
console.log(doc);
*/


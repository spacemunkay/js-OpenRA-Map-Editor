/** RAMAP.newMapInfo requires rayaml-parser.js  */
/** RAMAP.getMapYaml requires yaml_dumper.js  */
/** RAMAP.newUnzipper requires zip.js, inflate.js  */
/** RAMAP.newZipper requires zip.js, deflate.js  */

zip.workerScriptsPath = "/javascript/";

RAMAP.newMapIO = function(){
  var MapIO = {
    dropZone: 0,
    mapDataStorage: [],
    mapInfoStorage: [],
    mapData: 0,
    mapInfo: 0,
    infoFile: 0,
    onWriteEndCallback: 0,
    onWriteYamlEndCallback: 0,
    onReadEndCallback: 0,
    init: function( element, onReadEndCallback, onWriteEndCallback, onWriteYamlEndCallback ){
      MapIO.dropZone = element; 
      console.log(MapIO.dropZone);
/**
<div id="output" style="min-height: 100px; white-space: pre; border: 1px solid black;"  
     ondragenter="document.getElementById('output').textContent = ''; event.stopPropagation(); event.preventDefault();"  
     ondragover="event.stopPropagation(); event.preventDefault();"  
     ondrop="event.stopPropagation(); event.preventDefault(); dodrop(event);">
     */
      MapIO.dropZone.addEventListener('dragenter', MapIO.handleDragOver, false);           
      MapIO.dropZone.addEventListener('dragover', MapIO.handleDragOver, false);
      MapIO.dropZone.addEventListener('drop', MapIO.handleFileDrop, false);
      MapIO.onWriteEndCallback = onWriteEndCallback;
      MapIO.onWriteYamlEndCallback = onWriteYamlEndCallback;
      MapIO.onReadEndCallback = onReadEndCallback;
    },
    getMapData: function(){
      return MapIO.mapData;
    },
    getMapDataStorage: function(){
      return MapIO.mapDataStorage;
    },
    setMapData: function(mapData){
      MapIO.mapData = mapData;
    },
    handleDragOver: function(evt){
      evt.stopPropagation();
      evt.preventDefault();
    },
    handleFileDrop: function(evt){
      evt.stopPropagation();
      evt.preventDefault();
      var files = evt.dataTransfer.files; // FileList object.
      MapIO.handleFiles(files);
    },
    onInitFS: function(fs){
      if( MapIO.mapData === 0 ){
       return;
      }
      fs.root.getFile('map.bin', {create: true, exclusive: false}, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.onwriteend = function(e) {
            console.log('Write Bin completed.');
            MapIO.onWriteEndCallback(fileEntry);
          };
          fileWriter.onerror = function(e) {
            console.log('Write failed: ' + e.toString());
          };
          //give the blob the map array buffer and write it.
          var bb = new window.WebKitBlobBuilder();
          bb.append( MapIO.getMapBuffer() );
          var blob = bb.getBlob('application/octet-stream');
          console.log(blob);
          console.log("blob name: " + blob.name);
          blob.name = "map.bin";
          console.log("blob name: " + blob.name);
          fileWriter.write(blob);
        }, MapIO.errorHandler);
      }, MapIO.errorHandler);

      fs.root.getFile('map.yaml', {create: true, exclusive: false}, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.onwriteend = function(e) {
            console.log('Write Yaml completed.');
            MapIO.onWriteYamlEndCallback(fileEntry);
          };
          fileWriter.onerror = function(e) {
            console.log('Write failed: ' + e.toString());
          };
          //give the blob the map array buffer and write it.
          var bb = new window.WebKitBlobBuilder();
          bb.append( MapIO.getMapYaml() );
          var blob = bb.getBlob('text/plain');
          console.log(blob);
          console.log("blob name: " + blob.name);
          blob.name = "map.bin";
          console.log("blob name: " + blob.name);
          fileWriter.write(blob);
        }, MapIO.errorHandler);
      }, MapIO.errorHandler);
    },
    handleFiles: function(input){
      // files is a FileList of File objects. List some properties.
      console.log("Dropped File");
      console.log(input);
      for (var i = 0, f; f = input[i]; i++) {
        console.log(f);
        if( /^.*\.oramap$/.test(f.name) ){
          var unzipper = RAMAP.newUnzipper( function(){ 
              console.log("finished reading");
              MapIO.mapDataStorage.push( MapIO.mapData );
              MapIO.onReadEndCallback();
            });
          unzipper.getEntries( f, function(entries){
              unzipper.entriesLength = entries.length;
              entries.forEach(function(entry){
                  var bfr = new FileReader();
                  var yfr = new FileReader();
                  if( entry.filename === "map.bin" ){
                    unzipper.getEntryFile(entry, function(blob){
                      console.log("unzipped bin");
                      console.log(blob);
                      bfr.readAsArrayBuffer( blob );
                      bfr.onloadend = function (frEvent) {  
                        //console.log(frEvent.target.result);
                        console.log("map.bin entry completed");
                        var map_bin = frEvent.target.result;
                        MapIO.readMapBin(map_bin);
                        unzipper.entryCompleted();
                        //TODO rewrite using web workers
                        //var worker = new Worker("/javascript/write_map.js");
                      };
                    }, function(progress, maxvalue){
                      //console.log(progress);
                      //console.log(maxvalue);
                    });
                  }
                  if( entry.filename === "map.yaml" ){
                    unzipper.getEntryFile(entry, function(blob){
                      console.log("unzipped yaml");
                      MapIO.infoFile = blob;
                      if( MapIO.infoFile !== undefined && MapIO.infoFile !== 0 ){
                        yfr.readAsText( MapIO.infoFile );
                        yfr.onloadend = function (frEvent) {  
                          console.log("yaml on loadend");
                          var yaml_text = frEvent.target.result;
                          console.log(yaml_text);
                          MapIO.readMapYaml(yaml_text);
                        };
                        MapIO.infoFile = 0;
                      }else{
                        console.log("ERROR!!! infoFile empty");
                      }
                      unzipper.entryCompleted();
                    }, function(progress, maxvalue){
                      //console.log(progress);
                      //console.log(maxvalue);
                    });
                  }
                });
            });
        }
      }

    },
    newMap: function(tilesets){
      MapIO.mapInfo = RAMAP.newMapInfo();
      MapIO.mapInfo.updateInfo();
      var width = Number(MapIO.mapInfo.mapsize[0]);
      var height = Number(MapIO.mapInfo.mapsize[1]);
      var tileset = tilesets[MapIO.mapInfo.tileset.toLowerCase()];
      console.log(width);
      console.log(height);
      console.log(tileset);
      MapIO.mapData = RAMAP.newMapData();
      MapIO.mapData.init(width, height);

      for( var i = 0; i < width; i++ ){
        for( var j = 0; j < height; j++ ){
          var template = tileset.templates[RAMAP.TERRAIN_ID];
          if( i % template.width === 0 && j % template.height === 0){
            MapIO.mapData.addTemplate(i,j, template);
          }
          MapIO.mapData.addResource(i,j, 0, 0);
        }
      }
    },
    saveMap: function(){

      console.log("savemap");
      var bb = new window.WebKitBlobBuilder();
      bb.append( MapIO.getMapBuffer() );
      var bin_blob = bb.getBlob('application/octet-stream');

      onprogress = function(progress, max){ 
          console.log("zipping progress: " + progress);
          console.log("zipping max: " + max);
      };
      
      zip.createWriter(new zip.BlobWriter(), function(writer) {
        writer.add("map.bin", new zip.BlobReader(bin_blob), function() {
          var map_text = MapIO.getMapYaml();
          console.log(map_text);
          writer.add("map.yaml", new zip.TextReader( map_text  ), function() {
            console.log("map yaml only");
            writer.close(function(blob) {
              var blobURL = window.webkitURL.createObjectURL(blob);
              MapIO.onWriteEndCallback( MapIO.mapInfo.getMapFilename(), blobURL);
            });
          }, onprogress);
        }, onprogress);
	  }, function(e){ console.log( "ERROR: " + e); });
      
    },
    readMapYaml: function( text ){
      MapIO.mapInfo = RAMAP.newMapInfo();
      MapIO.mapInfo.parse(text);
      
      //read in actors
      if ( MapIO.mapData !== undefined ){
        var actors = MapIO.mapInfo.actors;
        for( key in actors){
          if( key === "id") { continue; }
          //console.log(key);
          var actor = actors[key];
          MapIO.mapData.addActor(  actor["Location"][0], actor["Location"][1], actor.id, actor.Owner ); 
          //console.log(actor);
        }
        console.log(actors);
      }

      //update the tileset 
      if ( MapIO.mapInfo.tileset !== undefined ){
        RAMAP.tileset = RAMAP.tilesets[MapIO.mapInfo.tileset.toLowerCase()];
      }

      //update

      console.log("finished reading yaml");
      MapIO.mapInfoStorage.push( MapIO.mapInfo );
      MapIO.onReadEndCallback();
    },
    readMapBin: function(map_bin){
      var bin_data =  new DataView( map_bin );
      var dr = RAMAP.newDataReader();
      console.log("map.bin length: " + bin_data.byteLength);
      var version = dr.read8(bin_data); 

      console.log("Version:" + version); 
      if ( version !== 1 ){
        alert("Incorrect Binary Format");
        return;
      }
      var mapSizeX = dr.read16(bin_data);
      var mapSizeY = dr.read16(bin_data);
      MapIO.mapData = RAMAP.newMapData();
      MapIO.mapData.init(mapSizeX, mapSizeY);
      //read tiles
      for ( var i = 0; i < mapSizeX; i++){
        for ( var j = 0; j < mapSizeY; j++){
          var templateID = dr.read16(bin_data);
          var index = dr.read8(bin_data);
          if (index === RAMAP.BYTE_MAX_VALUE){
            index = (i % 4 + (j % 4) * 4);
          }
          MapIO.mapData.addTile(i,j, templateID, index);
        }
      }
      //read resources
      for ( var i = 0; i < mapSizeX; i++){
        for ( var j = 0; j < mapSizeY; j++){
          var resource = dr.read8(bin_data);
          var index = dr.read8(bin_data);
          //console.log( "X: " + i + " Y: " + j + " Resource: " + resource + " Index: " + index); 
          MapIO.mapData.addResource(i,j, resource, index);
        }
      }
    },
    getMapYaml: function(){
      yamlWriter = new YAML();
      //clear actors
      MapIO.mapInfo.actors = {};
      //update MapInfo
      MapIO.mapInfo.addActors(MapIO.mapData.actors);

      yamlText = yamlWriter.dump([MapIO.mapInfo.getInfoObj()]);
      console.log(MapIO.mapInfo.actors);
      console.log(yamlText);
      return yamlText;
    },
    getMapBuffer: function(){
      
      console.log("writeMapBin");
      var mapSizeX = MapIO.mapData.sizeX;
      var mapSizeY = MapIO.mapData.sizeY;
      var area = mapSizeX * mapSizeY;
      var tileSize = area * 3; //tile 2 bytes + index 1 byte
      var resourceSize = area * 2; //resoure 1 byte + index 1 byte
      var headerSize = 5; // version 1 byte + sizeX 2 bytes + sizeY 2 bytes
      var fileSize = tileSize + resourceSize + headerSize;
      console.log("fileSize: " + fileSize );
      var file_buff = new ArrayBuffer( fileSize ); 
      var file_data = new DataView(file_buff);
      var dw = RAMAP.newDataWriter();

      console.log("file_data length:" + file_data.byteLength );
      //check if out of range
      //if( RAMAP.mapTiles.length != sizeX )
      //for( int i = 0; i < sizeX; i++){
      //}

      //write header
      dw.write8(file_data, 1);
      dw.write16(file_data, mapSizeX);
      dw.write16(file_data, mapSizeY);
      console.log( "Writing: " + file_data.byteLength );

      //mapTiles
      console.log("write mapTiles");
      for( i = 0; i < mapSizeX; i ++){
        for( j = 0; j < mapSizeY; j ++){
          var tile = MapIO.mapData.getTile(i,j);
          dw.write16( file_data, tile.templateID);
          //TODO pickany code ( % 4) (for cnc?)
          dw.write8( file_data, tile.index );
        } 
      }
      console.log("write resourceTiles");
      //resourceTiles
      for( i = 0; i < mapSizeX; i ++){
        for( j = 0; j < mapSizeY; j ++){
          var resource = MapIO.mapData.getResource(i,j);
          if( resource !== undefined){
            dw.write8( file_data, resource.resource );
            dw.write8( file_data, resource.index );
          }
        } 
      }

      return file_buff;
    },
    errorHandler: function(e){
      var msg = '';
      switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          msg = 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.NOT_FOUND_ERR:
          msg = 'NOT_FOUND_ERR';
          break;
        case FileError.SECURITY_ERR:
          msg = 'SECURITY_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          msg = 'INVALID_MODIFICATION_ERR - is the file writable? does the file already exist?';
          break;
        case FileError.INVALID_STATE_ERR:
          msg = 'INVALID_STATE_ERR';
          break;
        default:
          msg = 'Unknown Error';
          break;
      };
      console.log('Error: ' + msg);
    },

  }
  return MapIO;
}

RAMAP.newMapInfo = function(){
  var MapInfo = {
    selectable: true,
    mapformat: 5,
    title: "No Title",
    description: "No Description",
    author: "Edgar Allan Poe",
    tileset: "SNOW",
    mapsize: [128,128],
    bounds: [16, 16, 96, 96],
    useasshellmap: false,
    type: "Conquest",
    players: {
      "PlayerReference@Neutral": {
        "Name": "Neutral",
        "OwnsWorld": true,
        "NonCombatant": true,
        "Race": "allies"
      },
      "PlayerReference@Creeps": {
        "Name": "Creeps",
        "OwnsWorld": true,
        "NonCombatant": true,
        "Race": "allies"
      }
    },
    actors: null,
    smudges: null,
    rules: null,
    sequences: null,
    weapons: null,
    voices: null,
    init: function( mapObj ){
      for ( key in mapObj ){
        //console.log( key );
        if( mapObj[key] !== undefined ){
          //console.log( "copied " + key );
          MapInfo[key.toLowerCase()] = mapObj[key];
        }
      }
    },
    parse: function( text ){
      var mapObj = RAParser.parse( text, 'map.yaml');
      
      //console.log("ACTORSxxxxxxxxxxxxx");
      //console.log(mapObj);
      MapInfo.init(mapObj);
      //console.log(MapInfo.actors);
    },
    capitalize: function(string){
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    addActors: function( actorData ){
      if ( MapInfo.actors === undefined || MapInfo.actors === null){
        MapInfo.actors = {};
      }
      var numActors = Object.keys(MapInfo.actors).length;
      for ( var i = 0; i < actorData.length; i++ ){
        for ( var j = 0; j < actorData[i].length; j++ ){
          var actorTile = actorData[i][j];
          if( actorTile !== undefined && actorTile !== null ){
            MapInfo.actors["Actor"+numActors] = { "id": actorTile.name, "Location": [actorTile.x,actorTile.y], "Owner": actorTile.owner };
            numActors++;
          }
        }
      }
    },
    getInfoObj: function(){
      return {
        "Selectable": MapInfo.selectable,
        "MapFormat" : MapInfo.mapformat,
        "Title": MapInfo.title,
        "Description": MapInfo.description,
        "Author": MapInfo.author,
        "Tileset": MapInfo.tileset.toUpperCase(),
        "MapSize": MapInfo.mapsize,
        "Bounds": MapInfo.bounds,
        "UseAsShellmap": MapInfo.useasshellmap,
        "Type": MapInfo.type,
        "Players": MapInfo.getPlayers(),
        "Actors": MapInfo.getActors(),
        "Smudges": MapInfo.smudges,
        "Rules": MapInfo.rules,
        "Sequences": MapInfo.sequences,
        "Weapons": MapInfo.weapons,
        "Voices": MapInfo.voices 
      };
    },
    getMapFilename: function(){
      return (MapInfo.title.toLowerCase()).replace(/\s/g, "-");
    },
    getMapFormat: function(){
      return Number(MapInfo.mapformat);
    },
    getMapSize: function(){
      return [Number(MapInfo.mapsize[0]), Number(MapInfo.mapsize[1])];
    },
    getMapBounds: function(){
      return [Number(MapInfo.bounds[0]), Number(MapInfo.bounds[1]), Number(MapInfo.bounds[2]), Number(MapInfo.bounds[3])];
    },
    getActors: function(){
      return ( Object.keys(MapInfo.actors).length > 0 ) ? MapInfo.actors : null;
/**
      if( Object.keys(MapInfo.actors).length > 0 ){
        var result = {}; 
        for( key in MapInfo.actors ){
          if( key === "id" ){ continue; }
          result[MapInfo.capitalize(key)] = MapInfo.actors[key];
        }
        return result;
      }else{
        return null;
      }
*/
    },
    getPlayers: function(){
      var mpspawnCount = 0;
      //check if mpsawns, to add multi players
      for( key in MapInfo.actors ){
        var actor = MapInfo.actors[key];
        if( actor.id === "mpspawn" ){
          mpspawnCount++;
        }
      }

      for ( key in MapInfo.players){
        if( key === "id"){ continue;};
        var player = MapInfo.players[key];
        if( /Multi\d+/.test( player.Name ) ){
          delete MapInfo.players[key];
        }
      }

      for ( var i = 0; i < mpspawnCount; i++ ){
        MapInfo.players["PlayerReference@Multi"+i] = { "Name": "Multi"+i, "Playable": "True", "DefaultStartingUnits": "True", "Race": "Random", "Enemies": "Creeps"}; 
      }
      return MapInfo.players;
/**
                PlayerReference@Multi0:
                Name: Multi0
                Playable: True
                DefaultStartingUnits: True
                Race: Random
                Enemies: Creeps
*/
      
    },
    /** assumes all data is valid */
    updateInfo: function(){ 
      MapInfo.title = $("#title").val();
      MapInfo.author = $("#author").val();
      MapInfo.description = $("#description").val();
      MapInfo.tileset = ($("#radio_snow:checked").val() !== undefined) ? "SNOW" : "TEMPERAT";
      console.log("tileset: " + MapInfo.tileset);
      //TODO update the tileset

      //mapsize
      MapInfo.mapsize[0] = $("#mapsize_x").val();
      MapInfo.mapsize[1] = $("#mapsize_y").val();
      //bounds
      MapInfo.bounds[0] = $("#bound_W").val();
      MapInfo.bounds[1] = $("#bound_N").val();
      MapInfo.bounds[2] = $("#bound_E").val();
      MapInfo.bounds[3] = $("#bound_S").val();
      MapInfo.useasshellmap = ($('#shellmap:checked').val() !== undefined ) ? "True" : "False" ;
      MapInfo.selectable = ($('#selectable:checked').val() !== undefined ) ? "True" : "False" ;
    },
    updatePropDialog: function(){
      $("#title").val(MapInfo.title);
      $("#author").val(MapInfo.author);
      $("#description").val(MapInfo.description);
      if( MapInfo.tileset === "SNOW" ){
        $("#radio_snow").prop("checked", true);
        $("#radio_snow").button('refresh');
      }
      if( MapInfo.tileset === "TEMPERAT" ){
        $("#radio_temperat").prop("checked", true);
        $("#radio_temperat").button('refresh');
      }
      //mapsize
      $("#mapsize_x").val(MapInfo.mapsize[0]);
      $("#mapsize_y").val(MapInfo.mapsize[1]);
      //bounds
      $("#bound_W").val(MapInfo.bounds[0]);
      $("#bound_N").val(MapInfo.bounds[1]);
      $("#bound_E").val(MapInfo.bounds[2]);
      $("#bound_S").val(MapInfo.bounds[3]);
      if( MapInfo.useasshellmap === "True" ){
        $("#shellmap").prop("checked", true);
        $("#shellmap").button('refresh');
      }
      if( MapInfo.selectable === "True" ){
        $("#selectable").prop("checked", true);
        $("#selectable").button('refresh');
      }

    }
  };
  return MapInfo;
}

RAMAP.newMapData = function(){
  var MapData = {
    sizeX: 0,
    sizeY: 0,
    tiles: 0,
    resources: 0,
    actors: 0,
    init: function(mapSizeX, mapSizeY){
      MapData.sizeX = mapSizeX;
      MapData.sizeY = mapSizeY;
      //double array to hold map tile info 
      MapData.tiles = new Array(mapSizeX);
      for (var i = 0; i < mapSizeX; i++){
        MapData.tiles[i] = new Array(mapSizeY);
      }
      //double array to hold resource tile info 
      MapData.resources = new Array(mapSizeX);
      for (var i = 0; i < mapSizeX; i++){
        MapData.resources[i] = new Array(mapSizeY);
      }
      //double array to hold actor tile info 
      MapData.actors = new Array(mapSizeX);
      for (var i = 0; i < mapSizeX; i++){
        MapData.actors[i] = new Array(mapSizeY);
      }
    },
    addTile: function(i,j, templateID, index){
      if( !MapData.coordsInMap(i,j) ){
        return;
      }
      var tile = RAMAP.newTile();
      tile.init( templateID, index, i, j );
      //console.log( "added tile at " + i + ":" + j + " - " + index ); 
      MapData.tiles[i][j] = tile;
    },
    getTile: function(i,j){
      return MapData.tiles[i][j];
    },
    addResource: function(i,j, resource, index){
      var rsrcTile = RAMAP.newRsrcTile();
      rsrcTile.init( resource, index, i , j );
      MapData.resources[i][j] = rsrcTile;
    },
    getResource: function(i,j){
      return MapData.resources[i][j];
    },
    removeResource: function(i,j){
      MapData.addResource(i , j, 0, 0);
    },
    addActor: function(i , j, name, owner){
      var actorTile = RAMAP.newActorTile();
      actorTile.init( name, i, j, owner );
      //console.log(actorTile);
      //console.log("added");
      MapData.actors[i][j] = actorTile;
    },
    getActor: function(i, j){
      if( i > 128 ){
        console.log( "x out of bounds");
      }
      if( j > 128 ){
        console.log( "y out of bounds");
      }
      //console.log("wtf mates");
      if ( MapData.actors[i][j] !== undefined ){
        //console.log(MapData.actors[i][j]);
      }else{
        //console.log("damnit");
      }
      return MapData.actors[i][j];
    },
    removeActor: function(i,j){
      MapData.actors[i][j] = null;
    },
    addTemplate: function(x,y, template){
      //console.log("add template at index: " + x + ": " +y);  
      var index = 0;
      for ( var j = 0; j < template.height; j++){
        for ( var i = 0; i < template.width; i++){
          if( template.chunks[index].visible){
            MapData.addTile( x+i, y+j, template.id, index);
          }
          index++;
        }
      }
    },
    coordsInMap: function(i,j){
      if( i >= 0 && j >=0 && i < MapData.sizeX && j < MapData.sizeY){
        return true;
      }else{
        return false;
      }
    },
    tileTemplate: function (template){
      for( var i = 0; i < MapData.sizeX; i++ ){
        for( var j = 0; j < MapData.sizeY; j++ ){
          if( i % template.width === 0 && j % template.height === 0){
            MapData.addTemplate(i,j, template);
          }
        }
      }
    }
  };
  return MapData;
};



RAMAP.newDataReader = function(){
  var DataReader = {
    byteOffset: 0,
    read8: function(dataView){
      var value = dataView.getUint8(DataReader.byteOffset);  
      DataReader.byteOffset += 1;
      return value;  
    },
    read16: function(dataView){
      var value = dataView.getUint16(DataReader.byteOffset, true);  
      DataReader.byteOffset += 2;
      return value;  
    },
    read32: function(dataView){
      var value = dataView.getUint32(DataReader.byteOffset, true);  
      DataReader.byteOffset += 4;
      return value;  
    }
  }
  return DataReader;
};

RAMAP.newDataWriter = function(){
    var DataWriter = {
        byteOffset: 0,
        write8: function(dataView, value){
          dataView.setUint8(DataWriter.byteOffset, value );  
          DataWriter.byteOffset += 1;
        },
        write16: function(dataView, value){
          dataView.setUint16(DataWriter.byteOffset, value, true);  
          DataWriter.byteOffset += 2;
        },
        write32: function(dataView, value){
          dataView.setUint32(DataWriter.byteOffset, value, true);  
          DataWriter.byteOffset += 4;
        }
    };
    return DataWriter;
};

RAMAP.newZipper = function(){
  var Zipper = {
    URL: window.webkitURL || window.mozURL || window.URL,
    addIndex: 0,
    zipWriter: 0,
    addFiles: function(files, onprogress, onend){
      Zipper.addIndex = 0;
      writer = new zip.BlobWriter();
      zip.createWriter(writer, function(writer) {
						Zipper.zipWriter = writer;
						Zipper.nextFile(files, onprogress, onend);
					}, function(e){ console.log( "ERROR: " + e); });
    },
    nextFile: function(files, onprogress, onend){
      var file = files[Zipper.addIndex];
      Zipper.zipWriter.add(file.name, new zip.BlobReader(file), function() {
        Zipper.addIndex++;
        if (Zipper.addIndex < files.length){
		  Zipper.nextFile(files, onprogress, onend);
        }else{
          Zipper.zipWriter.close(function(blob) {
            onend(Zipper.URL.createObjectURL(blob));
            Zipper.zipWriter = null;
	      });
        }
	  }, onprogress, {"level":0});
    }
  };
  return Zipper;
}

RAMAP.newUnzipper = function(compCallback){
  var Unzipper = {
    URL : document.webkitURL || document.mozURL || document.URL,
    waitlist: [],
    gettingData: false,
    entriesCount: 0,
    entriesLength: 0,
    completeCallback: compCallback,
    entryCompleted: function(){
      Unzipper.entriesCount++;
      console.log("Entry Completed");
      if( Unzipper.entriesCount >= Unzipper.entriesLength ){
        console.log("Calling Complete Callback");
        Unzipper.completeCallback();
      }
    },
    getEntries : function(file, onend) {
      zip.createReader(new zip.BlobReader(file), function(zipReader) {
        zipReader.getEntries(onend);
      }, onerror);
    },
    getEntryFile : function(entry, onend, onprogress) {
      //add to waitlist if not already in it
      if( !Unzipper.entryInWaitlist(entry) ){
        //console.log( "adding " + entry.filename + " to waitlist");
        
        //TODO need to store the onend and onprogress callbacks as well
        Unzipper.waitlist.push({"name": entry.filename, "entry":entry, "onend": onend, "onprogress": onprogress});
      }
      var writer;
      writer = new zip.BlobWriter();
      //console.log("getData");
      //console.log("Unzipper.gettingData" + Unzipper.gettingData );
      if( Unzipper.gettingData === false ){
        Unzipper.gettingData = true;
        entry.getData(writer, function(data){ 
            Unzipper.gettingData = false;
            Unzipper.waitlist.shift(); //remove from waitlist
            //console.log("callback Unzipper.gettingData" + Unzipper.gettingData );
            onend(data);
            Unzipper.checkWaitlist();
            /**
            if( Unzipper.waitlist.length > 0 ){
              //console.log( "calling getEntryFile for: " + Unzipper.waitlist[0].filename );
              Unzipper.getEntryFile( Unzipper.waitlist[0], onend, onprogress );
            }*/
          },
          onprogress);
      }
    },
    checkWaitlist: function(){
      if( Unzipper.waitlist.length > 0 ){
        var ent = Unzipper.waitlist[0];
        Unzipper.getEntryFile( ent["entry"], ent["onend"], ent["onprogress"] );
      }
      //if waitlist greater than zero, call getEntryFile
    },
    entryInWaitlist: function(entry){
      var result = false;
      for( var i = 0; i < Unzipper.waitlist.length; i++ ){
        var ent = Unzipper.waitlist[i];
        if( ent["name"] === entry.filename ){
          result = true;
        }
      }
      return result;
    }
  };
  return Unzipper;
};

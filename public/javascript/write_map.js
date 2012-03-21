/**
RAMAP.writeMapBin = function(){
    console.log("writeMapBin");
    var area = RAMAP.sizeX * RAMAP.sizeY;
    var tileSize = area * 3; //tile 2 bytes + index 1 byte
    var resourceSize = area * 2; //resoure 1 byte + index 1 byte
    var headerSize = 5; // version 1 byte + sizeX 2 bytes + sizeY 2 bytes
    var fileSize = tileSize + resourceSize + headerSize;
    console.log("fileSize: " + fileSize );
    var file_buff = new ArrayBuffer( fileSize ); 
    var file_data = new DataView(file_buff);
    var dw = RAMAP.dataWriter;

    console.log("file_data length:" + file_data.byteLength );
    //check if out of range
    //if( RAMAP.mapTiles.length != sizeX )
    //for( int i = 0; i < sizeX; i++){
    //}

    //write header
    dw.write8(file_data, 1);
    dw.write16(file_data, RAMAP.sizeX);
    dw.write16(file_data, RAMAP.sizeY);
    console.log( file_data.byteLength );
    //mapTiles
    console.log("mapTiles");
    for( i = 0; i < RAMAP.sizeX; i ++){
      for( j = 0; j < RAMAP.sizeY; j ++){
        dw.write16( file_data, RAMAP.mapTiles[i][j].tile );
        //TODO pickany code ( % 4)
        dw.write8( file_data, RAMAP.mapTiles[i][j].index );
      } 
    }
    console.log("resourceTiles");
    //resourceTiles
    for( i = 0; i < RAMAP.sizeX; i ++){
      for( j = 0; j < RAMAP.sizeY; j ++){
        dw.write8( file_data, RAMAP.resourceTiles[i][j].resource );
        dw.write8( file_data, RAMAP.resourceTiles[i][j].index );
      } 
    }
    
    console.log("writing to file");
    var file = Components.classes["@mozilla.org/file/directory_service;1"].
               getService(Components.interfaces.nsIProperties).
               get("TmpD", Components.interfaces.nsIFile);
    file.append("new_map.bin");
    file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
    // do whatever you need to the created file
    alert(file.path);
    
    var stream = Components.classes["@mozilla.org/network/safe-file-output-stream;1"].
                 createInstance(Components.interfaces.nsIFileOutputStream);
    stream.init(file, 0x04 | 0x08 | 0x20, 0600, 0); // readwrite, create, truncate
    stream.write(file_data.buffer, file_data.byteLength);
    if (stream instanceof Components.interfaces.nsISafeOutputStream) {
        stream.finish();
    } else {
        stream.close();
    }
    console.log("fileURI: " + RAMAP.fileURI );
    RAMAP.fileURI = RAMAP.generateDataURI( file );
  };

RAMAP.writeMapBin();
*/
var file = Components.classes["@mozilla.org/file/directory_service;1"].
               getService(Components.interfaces.nsIProperties).
               get("TmpD", Components.interfaces.nsIFile);
    file.append("new_map.bin");
    file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
    // do whatever you need to the created file
    alert(file.path);

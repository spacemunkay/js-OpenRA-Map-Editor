var RAMAP = {};
RAMAP.BYTE_MAX_VALUE = 255;
RAMAP.CHUNK_SIZE = 24;
RAMAP.CANVAS_SIZE = 128;
RAMAP.CANVAS_WIDTH = 700;
RAMAP.CANVAS_HEIGHT = 700;
RAMAP.PICKER_WIDTH = 300;
RAMAP.DEFAULT_SCALE = 12;

RAMAP.MAX_ZOOM = 42;
RAMAP.MIN_ZOOM = 6;

//RAMAP.mapTiles;
//RAMAP.resourceTiles;
//RAMAP.templateMap = {};
//RAMAP.templates = {};
//RAMAP.sources = {};
RAMAP.tilesets = {}; 
RAMAP.tileset;

RAMAP.DEBUG = 0;
RAMAP.TERRAIN_ID = 65535;
RAMAP.OLD_TERRAIN_ID = 255;
RAMAP.WATER_ID = 2;

$(document).ready( function(){
    $("#wrapper").hide();
    //$("#menu").hide();
    //$("#app").hide();
    var tl = RAMAP.newTilesetLoader();
    tl.init(RAMAP.init);

    //set up dialogs
    $("#map_prop_dialog").dialog({ autoOpen: false, resizable: false }); 
    $("#map_prop_dialog").validate();
    $( ".radio" ).buttonset();
    $( "input:checkbox, input:submit, a, button" ).button();
    
    //set up map menu
    $( "#debug").button( {"icons": { "primary": "ui-icon-info" }});
    $( "#show_rsrc").button( {"icons": { "primary": "ui-icon-cart" }});
    $( "#drag_pan").button( {"icons": { "primary": "ui-icon-arrow-4" }});
    $( "#show_actor").button( {"icons": { "primary": "ui-icon-home" }});
    $( "#zoom_in").button( {"icons": { "primary": "ui-icon-zoomin" }});
    $( "#zoom_out").button( {"icons": { "primary": "ui-icon-zoomout" } });
    
});

RAMAP.showApp = function(){
  $("#app").show();
  $("#map_menu").show();
  $("#map_options").show();
  $("#instructions").hide();
}

RAMAP.setTileset = function( tileset ){
  RAMAP.tileset = RAMAP.tilesets[tileset];
  RAMAP.mapIO.mapInfo.tileset = RAMAP.tileset.name;
  RAMAP.showTemplates();
  if ( RAMAP.mapIO.mapData.tiles !== 0 && RAMAP.mapIO.mapData.resources !== 0){ 
    RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  }
}

RAMAP.onClickNew = function(){
  $('#instructions').hide();
  //get defaults
  var temp_map = RAMAP.newMapInfo(); 
  temp_map.updatePropDialog();

  $('#map_prop_dialog').attr('action', 'javascript:RAMAP.newMap();');
  $('#submit_prop_dialog').attr('value', 'CREATE');
  $('#map_prop_dialog').dialog('open');
};

RAMAP.newMap = function(){
  RAMAP.saveProperties();
  RAMAP.mapIO.newMap( RAMAP.tilesets );
  RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  //return dialog back to update
  $('#map_prop_dialog').attr('action', 'javascript:RAMAP.saveProperties();');
  $('#submit_prop_dialog').attr('value', 'UPDATE');
  $('#map_prop_dialog').dialog('close');
  RAMAP.showApp();
}

RAMAP.init = function (){
  console.log("init called");
  $("#wrapper").show();
  //set default template
  RAMAP.tileset = RAMAP.tilesets["snow"];

  RAMAP.mapView = RAMAP.newMapView();
  RAMAP.mapView.init("map_window", "resources", "actors", "bounds", RAMAP.CANVAS_WIDTH, RAMAP.CANVAS_HEIGHT, RAMAP.DEFAULT_SCALE, RAMAP.onMapClick, RAMAP.onMapCtrlClick, RAMAP.onMapUp);
  RAMAP.canvas = RAMAP.mapView.canvas;
  RAMAP.ctx = RAMAP.mapView.ctx;

  RAMAP.picker = RAMAP.newPickerView();
  RAMAP.picker.init("template_picker");

  RAMAP.mapIO = RAMAP.newMapIO();
  RAMAP.mapIO.init(document , RAMAP.onMapRead, RAMAP.onMapWrite, RAMAP.onMapWriteYaml);

  //create and add tools, perhaps I need a different approach.
  var tools= {};
  tools["cursor"] = {"action": function(id, posX, posY){ console.log(id + " cursor! " + posX + " " + posY);}};
  tools["hand"] = {"action": function(id, posX, posY){ RAMAP.mapView.dragOn = true;}, "upAction": function(id, posX, posY){ RAMAP.mapView.dragOn = false;}, "isTileCursor": false};
  tools["tileBrush"] = {"action": function(id, posX, posY, mapX, mapY){ 
    //console.log(id + " tileBrush! " + posX + " " + posY + "Tile " + mapX + " " + mapY);
    RAMAP.mapIO.mapData.addTemplate( mapX, mapY, RAMAP.tileset.templates[id] );
    RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  }, "ctrlAction": function(id){
    RAMAP.mapIO.mapData.tileTemplate(RAMAP.tileset.templates[id]);
    RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  }, "srcImgFunc": function(id){
    return RAMAP.tileset.templates[id].source.image;
  }};
  tools["rsrcBrush"] = {"action": function(id, posX, posY, mapX, mapY){ 
    //console.log(id + " rsrcBrush! " + posX + " " + posY + "Tile " + mapX + " " + mapY);
    RAMAP.mapIO.mapData.addResource( mapX, mapY, RAMAP.tileset.resourceMap[id].resource, RAMAP.tileset.resourceMap[id].index);
    //console.log( resource );
    RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  },"ctrlAction": function(id, posX, posY, mapX, mapY){
    RAMAP.mapIO.mapData.removeResource( mapX, mapY);
    RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  }, "srcImgFunc": function(id){
    //unhide resources first
    $('#resources').css('display', 'inline');
    return RAMAP.tileset.rsrcTemplates[id].source.image;
  }};
  tools["actorBrush"] = {"action": function(id, posX, posY, mapX, mapY){ 
    //console.log(id + " rsrcBrush! " + posX + " " + posY + "Tile " + mapX + " " + mapY);
    RAMAP.mapIO.mapData.addActor( mapX, mapY, id, "Neutral");
    console.log( "actorBrush" + id );
    RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  },"ctrlAction": function(id, posX, posY, mapX, mapY){
    RAMAP.mapIO.mapData.removeActor( mapX, mapY);
    RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  }, "srcImgFunc": function(id){
    //unhide resources first
    $('.actors').css('display', 'inline');
    //console.log(RAMAP.actorTileset);
    //console.log(id);
    return RAMAP.actorTileset.actorTemplates[id].source.image;
  }}
  RAMAP.toolPalette = RAMAP.newToolPalette();
  for ( key in tools ){
    var tool = RAMAP.newTool();
    tool.init( key, tools[key].action, tools[key].ctrlAction, tools[key].upAction, "/images/tools/", tools[key].isTileCursor, tools[key].srcImgFunc);
    RAMAP.toolPalette.addTool( tool );
  }
  RAMAP.toolPalette.init(RAMAP.mapView);
  RAMAP.toolPalette.setTool(1, "hand", 1);
};

RAMAP.onMapRead = function(){
  RAMAP.mapView.drawMap(RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
  RAMAP.mapIO.mapInfo.updatePropDialog();
  RAMAP.setTileset(RAMAP.mapIO.mapInfo.tileset.toLowerCase());
  RAMAP.showApp();
};

RAMAP.onMapWrite = function(name, url){
  console.log('mapwrite callback');
  $('#download_bin').show();
  $('#download_bin').html("<a href='"+url+"' download='"+name+".oramap' > Download </a>");
};

RAMAP.onMapWriteYaml = function(fileEntry){
  $("#instructions").hide();
  console.log('mapwrite callback');
  $('#download_yaml').show();
  $('#download_yaml').html("<a href='"+fileEntry.toURL()+"'> map.yaml </a>");
};


RAMAP.onMapClick = function(mosX, mosY, mapX, mapY){
  RAMAP.toolPalette.clickHandler(mosX, mosY, mapX, mapY);
};

RAMAP.onMapCtrlClick = function(mosX, mosY, mapX, mapY){
  RAMAP.toolPalette.ctrlClickHandler(mosX, mosY, mapX, mapY);
};

RAMAP.onMapUp = function(mosX, mosY, mapX, mapY){
  RAMAP.toolPalette.upHandler(mosX, mosY, mapX, mapY);
};

RAMAP.showResources = function(){
  for (key in RAMAP.tilesets){
    $("."+key).hide();
  }
  $("."+ RAMAP.tileset.name +".resource").show();
  $(".actor").hide();
}

RAMAP.showTemplates = function(){
  for (key in RAMAP.tilesets){
    if( key === RAMAP.tileset.name ){
      $("."+RAMAP.tileset.name).show();
    }else{
      $("."+key).hide();
    }
  }
  $(".resource").hide();
  $(".actor").hide();
}

RAMAP.showActors = function(){
  for (key in RAMAP.tilesets){
    $("."+key).hide();
  }
  $(".actor").show();
}

/**
RAMAP.onDebug = function(){
  RAMAP.mapView.onDebug();
  //RAMAP.mapView.drawMap( RAMAP.mapIO.mapData.tiles, RAMAP.tileset);
}*/

RAMAP.saveMap = function(){
  RAMAP.mapIO.saveMap();
}

RAMAP.saveProperties = function(){
  if( RAMAP.mapIO.mapInfo !== 0 && RAMAP.mapIO.mapInfo !== undefined){
    RAMAP.mapIO.mapInfo.updateInfo();
    //update the tileset 
    if ( RAMAP.mapIO.mapInfo.tileset !== undefined ){
      console.log("set tileset");
      RAMAP.setTileset( RAMAP.mapIO.mapInfo.tileset.toLowerCase() );
    }
  }
  $("#map_prop_dialog").dialog('close');
}

RAMAP.toggleRsrc = function(){
  if( $('#resources').is(':visible') ) {
    $('#resources').css('display', 'none');
  }else{
    $('#resources').css('display', 'inline');
  };
}

RAMAP.toggleActor = function(){
  if( $('#actors').is(':visible') ) {
    $('#actors').css('display', 'none');
  }else{
    $('#actors').css('display', 'inline');
  };
}


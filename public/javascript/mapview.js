RAMAP.newMapView = function(){
  var MapView = {
    stage: 0,
    canvas: 0,
    //rscCanvas: 0,
    //actCanvas: 0,
    ctx: 0,
    rsrcCtx: 0,
    actCtx: 0,
    bndCtx: 0,
    height: 0,
    width: 0,
    scale: 0,
    dragImg: 0,
    dragBorder: 0,
    lastTileset: 0,
    lastTiles: 0,
    isTileCursor: true,
    clickCallback: 0,
    ctrlClickCallback: 0,
    upCallback: 0,
    isDown: false,// whether mouse is pressed
    dragOn: false, //whether map dragging is on, for hand tool
    ctrlDown: false,
    startCoords: [],// 'grab' coordinates when pressing mouse
    shiftX: 0,
    shiftY: 0,
    init: function(id, rsrcID, actID, bndID, width, height, scale, clickCallback, ctrlClickCallback, upCallback){
      MapView.stage = new Kinetic.Stage(id, width, height);
      MapView.canvas = MapView.stage.getCanvas();
      MapView.ctx = MapView.stage.getContext();

      MapView.rsrcLayer = new Kinetic.Layer(MapView.stage, false, rsrcID);
      //MapView.rscCanvas = MapView.rsrcLayer.canvas;
      MapView.rsrcCtx = MapView.rsrcLayer.context;
      $("#"+rsrcID).insertBefore("#kinetic_dynamic");

      MapView.actLayer = new Kinetic.Layer(MapView.stage, false, actID);
      MapView.actCtx = MapView.actLayer.context;
      $("#"+actID).insertBefore("#kinetic_dynamic");
      
      MapView.bndLayer = new Kinetic.Layer(MapView.stage, false, bndID);
      MapView.bndCtx = MapView.bndLayer.context;
      $("#"+bndID).insertBefore("#kinetic_dynamic");

      MapView.height = height;
      MapView.width = width;
      MapView.scale = scale;
      MapView.clickCallback = clickCallback;
      MapView.ctrlClickCallback = ctrlClickCallback;
      MapView.upCallback = upCallback;

      //panning event listeners
      MapView.stage.addEventListener("mousedown", function(e) {
        MapView.isDown = true;
        console.log(e);
        MapView.startCoords = [
            e.pageX, // set start coordinates
            e.pageY 
        ];
        /**
        MapView.startCoords = [
            e.pageX - MapView.last[0], // set start coordinates
            e.pageY - MapView.last[1]
       ];*/

        console.log("mouse down:  X: " + MapView.startCoords[0] + " Y: " + MapView.startCoords[1]);
      });
      MapView.stage.addEventListener("mouseup", function(e) {
          MapView.isDown = false;
      });
      document.onkeydown =  function(e) {
        if( e.keyCode === 17 ){
          console.log("ctrl pressed");
          MapView.ctrlDown = true;
          MapView.stage.remove(MapView.dragImg);
          MapView.stage.draw();
        }
      };
      document.onkeyup = function(e) {
        if( e.keyCode === 17 ){
          console.log("ctrl released");
          MapView.ctrlDown = false;
          MapView.stage.add(MapView.dragImg);
          MapView.stage.draw();
        }
      };
      MapView.stage.addEventListener("mousemove", function(e){
          var x = e.pageX;
          var y = e.pageY;
          var mapCoords = MapView.getMapCoords(e.offsetX, e.offsetY);
          if( mapCoords !== undefined){
            $("#map_x").html(String(mapCoords[0]));
            $("#map_y").html(String(mapCoords[1]));
          }

          if(!MapView.isDown || !MapView.dragOn) return; // don't pan if mouse is not pressed
          //console
          // set the canvas' transformation matrix by setting the amount of movement:
          // 1  0  dx
          // 0  1  dy
          // 0  0  1

          //RAMAP.ctx.setTransform(1, 0, 0, 1,
          //                 x - startCoords[0], y - startCoords[1]);
          console.log( "dx: " + (x - MapView.startCoords[0]) + "dy: " + (y - MapView.startCoords[1]) );
          var dx = (x - MapView.startCoords[0]);
          var dy = (y - MapView.startCoords[1]);
          var moveSize = Math.ceil(RAMAP.DEFAULT_SCALE/MapView.scale)*3;
          if( dx > 3 ){
            dx = moveSize;
          }else if( dx < -3 ){
            dx = -moveSize;
          }else{
            dx = 0
          }
          if( dy > 3 ){
            dy = moveSize;
          }else if( dy < -3 ){
            dy = -moveSize;
          }else{
            dy = 0
          }
          MapView.shiftX += dx;
          MapView.shiftY += dy;
          MapView.startCoords = [x,y];
          //MapView.shiftX = MapView.shiftX + Math.floor( (( x - MapView.startCoords[0] ) / MapView.scale) / 3);
          //MapView.shiftY = MapView.shiftY + Math.floor( (( y - MapView.startCoords[1] ) / MapView.scale) / 3);

          console.log("SHIFT: X: "+MapView.shiftX + " Y: " + MapView.shiftY);
          //console.log( "shiftX: "+ shiftX + "shiftY: " + shiftY );
          //MapView.shiftX = RAMAP.getShift(MapView.shiftX - shiftX);
          //MapView.shiftY = RAMAP.getShift(MapView.shiftY - shiftY);
          //console.log( "RA.shiftX: "+ MapView.shiftX + "RA.shiftY: " + MapView.shiftY );
          //console.log( x + " " + y + " " + MapView.startCoords[0] + " " + MapView.startCoords[1]);
          MapView.drawMap( RAMAP.mapIO.mapData.tiles, RAMAP.tileset, MapView.shiftX, MapView.shiftY, MapView.scale); // render to show changes
      });

      $('#'+id).mousedown(function(event) {
          switch (event.which) {
              case 1:
                  //alert('Left mouse button pressed');
                  break;
              case 2:
                  //alert('Middle mouse button pressed');
                  break;
              case 3:
                  RAMAP.toolPalette.setTool(1, "hand", 1);
                  //alert('Right mouse button pressed');
                  break;
              default:
                  //alert('You have a strange mouse');
          }
      });

      //mouse wheel
      document.getElementById( id ).addEventListener('mousewheel', MapView.handleScroll, false);

    },
    handleScroll: function(e){
      console.log(e);
      if( e.wheelDeltaY < 0  ){
        //zoom out
        console.log("zoom out");
        MapView.zoomOut(e.x, e.y);
      }else if( e.wheelDeltaY > 0){
        //zoom in 
        console.log("zoom in");
        MapView.zoomIn(e.x, e.y);
      }
    },
    setCursor: function(imgObj, posX, posY, scale, isTileCursor){
      MapView.stage.removeAll();
      /**
      if (MapView.clickListenerFunc !== undefined){
        console.log("remove click listener");
        MapView.stage.removeEventListenerType( "mousedown", MapView.clickListenerFunc );
      }
      if (MapView.moveListenerFunc !== undefined){
        console.log("remove move listener");
        MapView.stage.removeEventListenerType("mousemove", MapView.moveListenerFunc);
      }*/
      MapView.isTileCursor = isTileCursor;
      MapView.stage.removeEventListenerType( "mousedown", MapView.onMouseClick);
      MapView.stage.removeEventListenerType("mousemove", MapView.onMouseMove, false);
      MapView.stage.removeEventListenerType("mouseup", MapView.onMouseUp);
      //var drawImg = Kinetic.drawImage(imgObj, posX, posY);
      
      var drawImg = function(){
        var context = this.getContext();
        context.drawImage(imgObj, posX, posY, imgObj.width, imgObj.height);
        context.beginPath();
        context.rect(posX, posY, imgObj.width, imgObj.height);
        context.closePath();
      };

      var drawBorder = function(){
        var context = this.getContext();
        context.strokeStyle = "black";
        context.strokeRect(0,0,imgObj.width,imgObj.height);
      }

      if ( isTileCursor ){
        MapView.dragBorder = new Kinetic.Shape(drawBorder);
        MapView.dragBorder.setScale(scale);
        MapView.stage.add(MapView.dragBorder);
      }
      MapView.dragImg = new Kinetic.Shape(drawImg); 
      MapView.dragImg.setScale(scale);
      MapView.stage.add(MapView.dragImg);

      /**
      MapView.moveListenerFunc = function(){ MapView.onMouseMove(isTileCursor); };
      MapView.stage.addEventListener("mousemove", MapView.moveListenerFunc, false);
      MapView.clickListenerFunc = function(){ MapView.onMouseClick(action); };
      MapView.stage.addEventListener("mousedown", MapView.clickListenerFunc);
      */
      MapView.stage.addEventListener("mousemove", MapView.onMouseMove, false);
      MapView.stage.addEventListener("mousedown", MapView.onMouseClick);
      MapView.stage.addEventListener("mouseup", MapView.onMouseUp);
    },
    zoomIn: function(mosX, mosY){
      MapView.startCoords = [];
      MapView.scale = MapView.scale + 3;
      if( MapView.scale > RAMAP.MAX_ZOOM){
        MapView.scale = RAMAP.MAX_ZOOM; 
      }else{
        if( mosX !== undefined && mosY !== undefined){
          //this isn't right
          MapView.shiftX =  MapView.shiftX - Math.floor( RAMAP.DEFAULT_SCALE * (RAMAP.DEFAULT_SCALE/MapView.scale) * ( (mosX - RAMAP.PICKER_WIDTH) / ( RAMAP.CHUNK_SIZE * MapView.scale ) ))
          MapView.shiftY =  MapView.shiftY - Math.floor( RAMAP.DEFAULT_SCALE * (RAMAP.DEFAULT_SCALE/MapView.scale) * ( mosY / ( RAMAP.CHUNK_SIZE * MapView.scale ) ) )
        }
      }
      MapView.drawMap( null, null, MapView.shiftX, MapView.shiftY, MapView.scale); // render to show changes
    },
    zoomOut: function(mosX, mosY){
      MapView.startCoords = [];
      MapView.scale = MapView.scale - 3;
      if( MapView.scale < RAMAP.MIN_ZOOM){
        MapView.scale = RAMAP.MIN_ZOOM; 
      }else{
        if( mosX !== undefined && mosY !== undefined){
          //this ain't right either
          //MapView.shiftX =  MapView.shiftX + Math.floor( RAMAP.DEFAULT_SCALE * (RAMAP.DEFAULT_SCALE/MapView.scale) * ( (mosX - RAMAP.PICKER_WIDTH) / ( RAMAP.CHUNK_SIZE * MapView.scale ) ))
          //MapView.shiftY =  MapView.shiftY + Math.floor( RAMAP.DEFAULT_SCALE * (RAMAP.DEFAULT_SCALE/MapView.scale) * ( mosY / ( RAMAP.CHUNK_SIZE * MapView.scale ) ) )
        }
      }

      MapView.drawMap( null, null, MapView.shiftX, MapView.shiftY, MapView.scale); // render to show changes
    },
    onDebug: function(){
      RAMAP.DEBUG = RAMAP.DEBUG^1
      MapView.drawMap( null, null, MapView.shiftX, MapView.shiftY, MapView.scale); // render to show changes
    },
    getMapCoords: function( mosX, mosY ){
      
      var mapX = Math.floor( mosX / MapView.scale ) - MapView.shiftX;
      var mapY = Math.floor( mosY / MapView.scale ) - MapView.shiftY ;
      
      if ( mapX >= 0 && mapX < RAMAP.mapIO.mapData.sizeX &&  mapY >= 0 && mapY < RAMAP.mapIO.mapData.sizeY){
        return [mapX, mapY];
      }
      return;
    },
    drawMap: function(mapTiles, tileset, shiftX, shiftY, scale ){
 
     //clear in case of redraw
     MapView.ctx.clearRect ( -1200 , -1200 , 3600, 3600 );
     MapView.rsrcCtx.clearRect ( -1200 , -1200 , 3600, 3600 );
     MapView.actCtx.clearRect ( -1200 , -1200 , 3600, 3600 );
     MapView.bndCtx.clearRect ( -1200 , -1200 , 3600, 3600 );

     if ( mapTiles !== undefined && mapTiles !== null){
      MapView.lastTiles = mapTiles; 
     }else if(MapView.lastTiles !== 0){
      mapTiles = MapView.lastTiles;
     }else{
      console.log("ah jeez");
      return;
     }

     if ( tileset !== undefined && tileset !== null){
      MapView.lastTileset = tileset; 
     }else if( MapView.lasTileset !== 0){
      tileset = MapView.lastTileset;
     }else{
      console.log("oh boy");
      return;
     }

     if ( shiftX !== undefined && shiftX !== 0 && shiftX !== null ){
      var shiftX = Math.round( Number(shiftX) );
     }else{
      var shiftX = MapView.shiftX; 
     }
     if ( shiftY !== undefined && shiftY !== 0 && shiftY !== null ){
      var shiftY = Math.round( Number(shiftY) );
     }else{
      var shiftY = MapView.shiftY; 
     }
     if ( scale !== undefined && scale !== 0 && scale !== null ){
      //console.log("changing scale: " + scale );
      var scale = Math.round( Number(scale) );
     }else{
      var scale = MapView.scale; 
     }

     //how many tiles fit on canvas
     var drawWidth = Math.round( RAMAP.CANVAS_WIDTH / scale ); 
     var drawHeight = Math.round( RAMAP.CANVAS_HEIGHT / scale ); 

     var bounds = RAMAP.mapIO.mapInfo.bounds;
     //console.log("BOUNNDS! xxxxxxxxx");
     //console.log(bounds);
     //draw tiles
     for( i = 0; i < drawWidth; i++){
      for( j = 0; j < drawHeight; j++){
        var indexI = ( i - shiftX );  
        var indexJ = ( j - shiftY );  
        if ( indexI >= 0 && indexI < RAMAP.CANVAS_SIZE &&  indexJ >= 0 && indexJ < RAMAP.CANVAS_SIZE){
          var tile = mapTiles[indexI][indexJ];
          
          

          if( tile !== undefined){
            if (RAMAP.DEBUG === 0 || RAMAP.DEBUG === undefined){
              tile.render(MapView.ctx, tileset.templates, indexI+shiftX, indexJ+shiftY, scale);
            }
            else{
              MapView.ctx.fillStyle = "#806E62";
              MapView.ctx.fillRect((indexI+shiftX)*scale, (indexJ+shiftY)*scale, scale, scale);
              MapView.ctx.strokeStyle = "#333333";
              MapView.ctx.strokeRect((indexI+shiftX)*scale, (indexJ+shiftY)*scale, scale, scale);
              MapView.ctx.fillStyle = "#333333";
              MapView.ctx.fillText( tile.templateID, (indexI +shiftX)*scale, (indexJ+shiftY)*scale+10);
              MapView.ctx.fillText( tile.index, (indexI+shiftX)*scale+1, (indexJ+shiftY)*scale+20);

            }
          }else{
            console.log("undefined tile at: " + indexI + ":" + indexJ); 
          }
         
          //draw bounds
          var bounds = RAMAP.mapIO.mapInfo.bounds;
          if( bounds !== undefined ){
            //west
            if( indexI === Number(bounds[0]) ){
              MapView.bndCtx.beginPath();
              MapView.bndCtx.moveTo((indexI+shiftX)*scale, (indexJ+shiftY)*scale);
              MapView.bndCtx.lineTo((indexI+shiftX)*scale, (indexJ+shiftY)*scale + scale);
              MapView.bndCtx.stroke();
            }
            //north
            if( indexJ === Number(bounds[1]) ){
              MapView.bndCtx.beginPath();
              MapView.bndCtx.moveTo((indexI+shiftX)*scale, (indexJ+shiftY)*scale);
              MapView.bndCtx.lineTo((indexI+shiftX)*scale + scale, (indexJ+shiftY)*scale);
              MapView.bndCtx.stroke();
            }
            //east
            if( indexI === ( Number(bounds[2]) + Number(bounds[0]) ) ){
              MapView.bndCtx.beginPath();
              MapView.bndCtx.moveTo((indexI+shiftX)*scale, (indexJ+shiftY)*scale);
              MapView.bndCtx.lineTo((indexI+shiftX)*scale, (indexJ+shiftY)*scale + scale);
              MapView.bndCtx.stroke();
            }
            //south
            if( indexJ === ( Number(bounds[3]) + Number(bounds[1]) ) ){
              MapView.bndCtx.beginPath();
              MapView.bndCtx.moveTo((indexI+shiftX)*scale, (indexJ+shiftY)*scale);
              MapView.bndCtx.lineTo((indexI+shiftX)*scale + scale, (indexJ+shiftY)*scale);
              MapView.bndCtx.stroke();
            }
          }

        }
      }
     }

     //draw resources
     for( i = 0; i < drawWidth; i++){
      for( j = 0; j < drawHeight; j++){
        var indexI = ( i - shiftX );  
        var indexJ = ( j - shiftY );  
        if ( indexI >= 0 && indexI < RAMAP.CANVAS_SIZE &&  indexJ >= 0 && indexJ < RAMAP.CANVAS_SIZE){
          var resourceTile = RAMAP.mapIO.mapData.resources[indexI][indexJ];
          if (RAMAP.DEBUG === 0 || RAMAP.DEBUG === undefined){
            if( resourceTile.resource !== 0 ){
              resourceTile.render(MapView.rsrcCtx, tileset.rsrcTemplates, indexI+shiftX, indexJ+shiftY, scale);
            }
          }else if( resourceTile !== undefined ){
              MapView.rsrcCtx.fillStyle = "#806E62";
              MapView.rsrcCtx.fillRect((indexI+shiftX)*scale, (indexJ+shiftY)*scale, scale, scale);
              MapView.rsrcCtx.strokeStyle = "#333333";
              MapView.rsrcCtx.strokeRect((indexI+shiftX)*scale, (indexJ+shiftY)*scale, scale, scale);
              MapView.rsrcCtx.fillStyle = "#333333";
              MapView.rsrcCtx.fillText( resourceTile.resource, (indexI +shiftX)*scale, (indexJ+shiftY)*scale+10);
              MapView.rsrcCtx.fillText( resourceTile.index, (indexI+shiftX)*scale+1, (indexJ+shiftY)*scale+20);
              
          }else{
              console.log("undefined resource");
          }
        }
      }
     }
      
      //draw actors
      if ( RAMAP.mapIO.mapData.actors !== undefined ){
        //console.log("Drawing ACTORS! ---------------------------");
        for( i = 0; i < drawWidth; i++){
          for( j = 0; j < drawHeight; j++){
            var indexI = ( i - shiftX );  
            var indexJ = ( j - shiftY );  
            if ( indexI >= 0 && indexI < RAMAP.CANVAS_SIZE &&  indexJ >= 0 && indexJ < RAMAP.CANVAS_SIZE){
              
              var actorTile = RAMAP.mapIO.mapData.getActor(indexI, indexJ);
              if( actorTile !== undefined && actorTile !== null){
                //console.log( actorTile.x + ":" + actorTile.y );
                actorTile.render(MapView.actCtx, indexI+shiftX, indexJ+shiftY, scale);
              }
              /**
              if (RAMAP.DEBUG === 0 || RAMAP.DEBUG === undefined){
                if( actorTile.resource !== 0 ){
                  actorTile.render(MapView.rsrcCtx, tileset.rsrcTemplates, indexI+shiftX, indexJ+shiftY, scale);
                }
              }else if( actorTile !== undefined ){
                  MapView.rsrcCtx.fillStyle = "#806E62";
                  MapView.rsrcCtx.fillRect((indexI+shiftX)*scale, (indexJ+shiftY)*scale, scale, scale);
                  MapView.rsrcCtx.strokeStyle = "#333333";
                  MapView.rsrcCtx.strokeRect((indexI+shiftX)*scale, (indexJ+shiftY)*scale, scale, scale);
                  MapView.rsrcCtx.fillStyle = "#333333";
                  MapView.rsrcCtx.fillText( actorTile.name, (indexI +shiftX)*scale, (indexJ+shiftY)*scale+10);
                  //MapView.rsrcCtx.fillText( resourceTile.index, (indexI+shiftX)*scale+1, (indexJ+shiftY)*scale+20);
              }else{
                  console.log("undefined resource");
              }*/
            }
          }
         }
      }


    },
    onMouseClick: function(){
      var mousePos = MapView.stage.getMousePos();
      //action(mousePos.x - 500, mousePos.y);
      //MapView.draggingRect = false;
      var mapCoords = MapView.getMapCoords(mousePos.x - RAMAP.PICKER_WIDTH, mousePos.y);
      if( MapView.ctrlDown ){
        MapView.ctrlClickCallback(mousePos.x - RAMAP.PICKER_WIDTH, mousePos.y, mapCoords[0], mapCoords[1]);
      }else{
        MapView.clickCallback(mousePos.x - RAMAP.PICKER_WIDTH, mousePos.y, mapCoords[0], mapCoords[1]);
      }
    },
    
    onMouseMove: function(isTileCursor){
      //console.log("mouseMove");
      if ( MapView.isTileCursor ){
        MapView.followTileCursor( MapView.dragImg );  
        MapView.followTileCursor( MapView.dragBorder);  
        if( MapView.isDown ){
          MapView.onMouseClick();
        }
      }else{
        MapView.followCursor( MapView.dragImg );  
      }
      MapView.stage.draw();
    },
    onMouseUp: function(upAction){
      var mousePos = MapView.stage.getMousePos();
      //action(mousePos.x - 500, mousePos.y);
      //MapView.draggingRect = false;
      var mapCoords = MapView.getMapCoords(mousePos.x - RAMAP.PICKER_WIDTH, mousePos.y);
      MapView.upCallback(mousePos.x - RAMAP.PICKER_WIDTH, mousePos.y, mapCoords[0], mapCoords[1]);
    },
    followTileCursor: function(img){
      var mousePos = MapView.stage.getMousePos();
      img.setScale(MapView.scale/RAMAP.CHUNK_SIZE);
      img.x = Math.floor((mousePos.x - RAMAP.PICKER_WIDTH) / MapView.scale) * MapView.scale;
      img.y = Math.floor((mousePos.y ) / MapView.scale) * MapView.scale;
    },
    followCursor: function(img){
      var mousePos = MapView.stage.getMousePos();
      img.setScale(1);
      img.x = Math.floor(mousePos.x - RAMAP.PICKER_WIDTH);
      img.y = Math.floor(mousePos.y );
    }
  }
  return MapView;
};

RAMAP.newPickerView = function(){
  var PickerView = {
    canvas: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
    init: function(id){
      PickerView.canvas = document.getElementById(id);
      //console.log(PickerView.canvas);
      PickerView.width = $(PickerView.canvas).width();
      PickerView.height = $(PickerView.canvas).height();
    },
    scrollUp: function(value){
      if( PickerView.posY - value >= 0 ){
        PickerView.posY = PickerView.posY - value; 
        var translation = 'translate( 0px, -' + PickerView.posY + 'px)'; 
        
        updated_css = {
          '-webkit-transition': 'all .4s ease-in',
          '-webkit-transform' : translation
        }
        $(PickerView.canvas).css(updated_css);
      }
    },
    scrollDown: function(value){
      if( PickerView.posY + value < PickerView.height){
        PickerView.posY = PickerView.posY + value; 
        var translation = 'translate( 0px, -' + PickerView.posY + 'px)'; 
        
        updated_css = {
          '-webkit-transition': 'all .4s ease-in',
          '-webkit-transform' : translation
        }
        $(PickerView.canvas).css(updated_css);
      }
    }
  }
  return PickerView;
};


RAMAP.newToolPalette = function(){
  var ToolPalette = {
    tools: {},
    mapView: 0,
    currentTool: 0,
    currentID: 0,
    init: function(mapView){
      ToolPalette.mapView = mapView;
      ToolPalette.loadIcons();
    },
    addTool: function( tool ){
      ToolPalette.tools[tool.name] = tool;
    },
    setTool: function(key, type, scale){
        ToolPalette.currentID = key;
        ToolPalette.currentTool = ToolPalette.tools[type];
        if( scale === undefined || scale === null ){
          scale = RAMAP.mapView.scale/RAMAP.CHUNK_SIZE;
        }
        ToolPalette.mapView.setCursor( ToolPalette.currentTool.getSrcImg(key), 0,0, scale, ToolPalette.currentTool.isTileCursor); 
        /**ToolPalette.mapView.setCursor( ToolPalette.currentTool.source.image, 0,0, scale, ToolPalette.currentTool.isTileCursor); 
        ToolPalette.currentID = key;
        if ( RAMAP.tileset.templates[key] ){
          ToolPalette.currentTool = ToolPalette.tools["tileBrush"];
          ToolPalette.mapView.setCursor( RAMAP.tileset.templates[key].source.image, 0, 0, RAMAP.mapView.scale/RAMAP.CHUNK_SIZE, ToolPalette.currentTool.isTileCursor); 
        }else{
          ToolPalette.currentTool = ToolPalette.tools["rsrcBrush"];
          ToolPalette.mapView.setCursor( RAMAP.tileset.rsrcTemplates[key].source.image, 0, 0, RAMAP.mapView.scale/RAMAP.CHUNK_SIZE, ToolPalette.currentTool.isTileCursor); 
        }*/
      
    },
    loadIcons: function(callback){
      var toolCount = Object.keys(ToolPalette.tools).length;
      var loadedCount = 0;
      for( key in ToolPalette.tools ){
        var tool = ToolPalette.tools[key];
        if( tool.source !== 0 ){
          tool.source.image.onload = function(){
            toolCount++;
            if( loadedCount >= toolCount ){
              callback.call(this);
            }
          }
        }else{
          toolCount = toolCount - 1;
        }
      }
    },
    clickHandler: function(mosX, mosY, mapX, mapY){
      if ( ToolPalette.currentTool.action !== undefined){
        ToolPalette.currentTool.action(ToolPalette.currentID, mosX, mosY, mapX, mapY);
      }
    },
    ctrlClickHandler: function(mosX, mosY, mapX, mapY){
      if ( ToolPalette.currentTool.ctrlAction !== undefined){
        ToolPalette.currentTool.ctrlAction(ToolPalette.currentID, mosX, mosY, mapX, mapY);
      }
    },
    upHandler: function(mosX, mosY, mapX, mapY){
      if ( ToolPalette.currentTool.upAction !== undefined){
        ToolPalette.currentTool.upAction(ToolPalette.currentID, mosX, mosY, mapX, mapY);
      }
    }
  }
  return ToolPalette;
};

RAMAP.newTool = function(){
  var Tool = {
    name: 0,
    action: 0,
    ctrlAction: 0,
    upAction: 0,
    source: 0,
    isTileCursor: true,
    init: function (name, action, ctrlAction, upAction, imgPath, isTileCursor, srcImgFunc){
      Tool.name = name;
      Tool.action = action;
      Tool.ctrlAction = ctrlAction;
      Tool.upAction = upAction;
      if ( isTileCursor !== undefined ){
        Tool.isTileCursor = isTileCursor;
      }
      if( imgPath !== undefined && imgPath !== null ){
        Tool.source = RAMAP.newSourceImage();
        Tool.source.init( imgPath + Tool.name + ".png");
      }
      if( srcImgFunc !== undefined && srcImgFunc !== null ){
        Tool.getSrcImg = srcImgFunc;
      }
    },
    getSrcImg: function(id){
      return Tool.source.image;
    }
  }
  return Tool;
}

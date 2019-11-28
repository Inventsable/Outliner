/*
      https://github.com/Inventsable/Outliner
      contact: tom@inventsable.cc

      Barebones script to convert all paths in current document to permanent Outlines, including handles and anchors.
      This action can be undone with a single Edit > Undo command.

      You can edit the below settings:
*/
var anchorWidth = 1; // number in pixels, width of stroke
var anchorSize = 5; // number in pixels, height/width of rectangle
var handleSize = 4; // number in pixels, size of ellipse/orb where handle is grabbed
var anchorColor = newRGB(50, 50, 200); // RGB value, currently blue
var anchorIsFilled = false; // Boolean (true or false) if true, anchors are filled, otherwise have only stroke
//
var outlineWidth = 1; // number in pixels, width of stroke
var outlineColor = newRGB(0, 0, 0); // The RGB value of color ([0,0,0] = black)
//
var useLayerLabelColor = true; // Boolean, if true override above anchorColor and use the Layer's label instead
var forceOpacity = true; // Boolean (true or false) if true, force all paths to have full opacity
var overrideComplex = false; // Boolean -- if true, clone all objects and attempt to reconstruct.
//          This only needs to be true if you have complex Appearances like multiple strokes per object

/*
      Do not edit below unless you know what you're doing!

      TODO:
        - Add support for optional Release Clipping Mask
          - Duplicate Mask per Content entry
          - Use Pathfinder - Intersect on Mask and Contents
*/

convertAllToOutlines();
var doc = app.activeDocument;

function convertAllToOutlines() {
  convertListToOutlines(scanCurrentPageItems());
}

// Return a list of current pathItems in activeDoc or their clones when overriding complex appearance
function scanCurrentPageItems() {
  var list = [];
  if (!overrideComplex) {
    for (var i = app.activeDocument.pathItems.length - 1; i >= 0; i--)
      list.push(app.activeDocument.pathItems[i]);
    return list;
  } else {
    return cloneAllPathItems();
  }
}

// Reconstruct all PathItems with basic data to override any complex appearances
function cloneAllPathItems() {
  var list = [];
  var cloneProps = ["position", "left", "top", "name", "closed"];
  var pathProps = ["anchor", "leftDirection", "rightDirection", "pointType"];
  for (var i = app.activeDocument.pathItems.length - 1; i >= 0; i--) {
    var item = app.activeDocument.pathItems[i];
    var clone = {
      pathPoints: []
    };
    for (var v = 0; v < cloneProps.length; v++) {
      var prop = cloneProps[v];
      clone[prop] = item[prop];
    }
    for (var v = 0; v < item.pathPoints.length; v++)
      clone.pathPoints.push(item.pathPoints[v]);
    list.push(clone);
    item.remove();
  }
  var dupes = [];
  for (var i = 0; i < list.length; i++) {
    var schema = list[i];
    var item = app.activeDocument.pathItems.add();
    for (var v = 0; v < cloneProps.length; v++) {
      var prop = cloneProps[v];
      item[prop] = schema[prop];
    }
    for (var v = 0; v < schema.pathPoints.length; v++) {
      var point = schema.pathPoints[v];
      var newpoint = item.pathPoints.add();
      for (var c = 0; c < pathProps.length; c++) {
        var prop = pathProps[c];
        newpoint[prop] = point[prop];
      }
    }
    dupes.push(item);
  }
  return dupes;
}

function convertListToOutlines(list) {
  for (var i = list.length - 1; i >= 0; i--) {
    var item = list[i];
    if (item.stroked || item.filled) {
      replaceAppearance(item);
      if (item.pathPoints && item.pathPoints.length)
        for (var p = 0; p < item.pathPoints.length; p++) {
          var point = item.pathPoints[p];
          drawAnchor(point, item.layer);
          drawHandle(point, "left", item.layer);
          drawHandle(point, "right", item.layer);
          item.opacity = forceOpacity ? 100.0 : item.opacity;
        }
    }
  }
}

function drawAnchor(point, layer) {
  var anchor = app.activeDocument.pathItems.rectangle(
    point.anchor[1] + anchorSize / 2,
    point.anchor[0] - anchorSize / 2,
    anchorSize,
    anchorSize
  );
  anchor.move(layer, ElementPlacement.PLACEATBEGINNING);
  setAnchorAppearance(anchor, false, layer);
}
function drawHandle(point, direction, layer) {
  if (
    Number(point.anchor[0]) !== Number(point[direction + "Direction"][0]) ||
    Number(point.anchor[1]) !== Number(point[direction + "Direction"][1])
  ) {
    var handle = app.activeDocument.pathItems.add();
    handle.setEntirePath([point.anchor, point[direction + "Direction"]]);
    handle.move(layer, ElementPlacement.PLACEATBEGINNING);
    setAnchorAppearance(handle, true, layer);
    var handleBar = app.activeDocument.pathItems.ellipse(
      point[direction + "Direction"][1] + handleSize / 2,
      point[direction + "Direction"][0] - handleSize / 2,
      handleSize,
      handleSize
    );
    handleBar.move(layer, ElementPlacement.PLACEATBEGINNING);
    handleBar.stroked = false;
    handleBar.filled = true;
    handleBar.fillColor = useLayerLabelColor ? layer.color : anchorColor;
  }
}

function setAnchorAppearance(item, isHandle, layer) {
  var realColor = useLayerLabelColor ? layer.color : anchorColor;
  if (!isHandle) {
    item.filled = anchorIsFilled;
    item.stroked = !anchorIsFilled;
    if (!anchorIsFilled) {
      item.strokeWidth = anchorWidth;
      item.strokeColor = realColor;
    } else {
      item.fillColor = realColor;
    }
  } else {
    item.filled = false;
    item.stroked = true;
    item.strokeWidth = anchorWidth;
    item.strokeColor = realColor;
  }
}

function replaceAppearance(item) {
  item.filled = false;
  item.stroked = true;
  item.strokeWidth = outlineWidth;
  item.strokeColor = outlineColor;
}

function newRGB(r, g, b) {
  var color = new RGBColor();
  color.red = r;
  color.green = g;
  color.blue = b;
  return color;
}

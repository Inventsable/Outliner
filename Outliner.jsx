// https://github.com/Inventsable
// contact: tom@inventsable.cc
//
// Barebones script to convert all paths in current document to permanent Outlines, including handles and anchors.
// This action can be undone with a single Edit > Undo command.
//
// You can edit the below settings:
var anchorWidth = 1; // number in pixels, width of stroke
var anchorSize = 5; // number in pixels, height/width of rectangle
var handleSize = 4; // number in pixels, size of ellipse/orb where handle is grabbed
var anchorColor = newRGB(50, 50, 200); // RGB values, currently blue
var anchorIsFilled = true; // Boolean (true or false) if true, anchors are filled, otherwise have only stroke
//
var outlineWidth = 1; // number in pixels, width of stroke
var outlineColor = newRGB(0, 0, 0); // The RGB value of color ([0,0,0] = black)
//
var forceOpacity = true; // Boolean (true or false) if true, force all paths to have full opacity
// --------------------------------------------------- //
//
// Do not edit below unless you know what you're doing!
//
convertAllToOutlines();

function convertAllToOutlines() {
  // Need to collect all current pageItems otherwise recurses into it's own drawn anchors
  // app.activeDocument.pageItems is not chronological! Adding to it, even if decrementing, causes recursion
  var targets = scanCurrentPageItems();
  convertListToOutlines(targets);
}

function scanCurrentPageItems() {
  var list = [];
  for (var i = app.activeDocument.pageItems.length - 1; i >= 0; i--) {
    list.push(app.activeDocument.pageItems[i]);
  }
  return list;
}

function convertListToOutlines(list) {
  for (var i = list.length - 1; i >= 0; i--) {
    var item = list[i];
    if (/compound|group/i.test(item.typename)) {
      if (item.pageItems && item.pageItems.length) {
        convertListToOutlines(item.pageItems);
      }
    } else if (/path/i.test(item.typename)) {
      if (item.stroked || item.filled) {
        replaceAppearance(item);
        if (item.pathPoints && item.pathPoints.length) {
          for (var p = 0; p < item.pathPoints.length; p++) {
            var point = item.pathPoints[p];
            drawAnchor(point);
            if (point.leftDirection) drawHandle(point, "left");
            if (point.rightDirection) drawHandle(point, "right");
          }
          item.opacity = forceOpacity ? 100.0 : item.opacity;
        } else {
          alert("Problem with " + item.name + ": " + item.typename);
        }
      }
    } else {
      alert(item.name + " " + item.typename);
    }
  }
}

function drawAnchor(point) {
  var anchor = app.activeDocument.pathItems.rectangle(
    point.anchor[1] + anchorSize / 2,
    point.anchor[0] - anchorSize / 2,
    anchorSize,
    anchorSize
  );
  setAnchorAppearance(anchor, false);
}
function drawHandle(point, direction) {
  var handle = app.activeDocument.pathItems.add();
  handle.setEntirePath([point.anchor, point[direction + "Direction"]]);
  setAnchorAppearance(handle, true);
  var handleBar = app.activeDocument.pathItems.ellipse(
    point[direction + "Direction"][1] + handleSize / 2,
    point[direction + "Direction"][0] - handleSize / 2,
    handleSize,
    handleSize
  );
  handleBar.stroked = false;
  handleBar.filled = true;
  handleBar.fillColor = anchorColor;
}

function setAnchorAppearance(item, isHandle) {
  if (!isHandle) {
    item.filled = anchorIsFilled;
    item.stroked = !anchorIsFilled;
    if (!anchorIsFilled) {
      item.strokeWidth = anchorWidth;
      item.strokeColor = anchorColor;
    } else {
      item.fillColor = anchorColor;
    }
  } else {
    item.filled = false;
    item.stroked = true;
    item.strokeWidth = anchorWidth;
    item.strokeColor = anchorColor;
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

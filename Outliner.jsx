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
var anchorColor = newRGB(50, 50, 200); // RGB value, defaults to blue
var anchorIsFilled = false; // Boolean, if true anchors are filled, otherwise have only stroke
//
var outlineWidth = 1; // number in pixels, width of stroke
var outlineColor = newRGB(35, 31, 32); // The RGB value of color (default rich black)
//
var useLayerLabelColor = true; // Boolean, if true override above anchorColor and use the Layer's label instead
var forceOpacity = true; // Boolean, if true force all paths to have full opacity
var overrideComplex = false; // Boolean, if true clone all objects and attempt to reconstruct them
//          This only needs to be true if you have complex Appearances like multiple strokes per object
var mergeClippingMasks = true; // Boolean, if true will use Pathfinder > Intersect on all Clipping Masks and contents
//          If merging is true, requires an additional Undo command per item merged to get back to original
var renameGenericPaths = true; // Boolean, if true will rename unnamed paths as their parent layer
var generateIds = false; // Boolean, if true with generate names with 3 character unique identifiers

// BROKEN, do not set to true
var groupRelated = false;
/*

      Do not edit below unless you know what you're doing!

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
    if (mergeClippingMasks) mergeClippingPaths();
    for (var i = app.activeDocument.pathItems.length - 1; i >= 0; i--)
      list.push(app.activeDocument.pathItems[i]);
    return list;
  } else {
    return cloneAllPathItems();
  }
}

function rollName(name, layer) {
  var siblingCount = 0;
  var nameRX = new RegExp(layer.name + "\\d*");
  if (!generateIds)
    for (var i = 0; i < layer.pathItems.length; i++)
      if (
        nameRX.test(layer.pathItems[i].name) &&
        !/\[\d\]\[\d\].*/.test(layer.pathItems[i].name)
      )
        siblingCount++;
  return generateIds
    ? name + "_" + shortId() + "_"
    : name + "[" + siblingCount + "]";
}

function convertListToOutlines(list) {
  for (var i = list.length - 1; i >= 0; i--) {
    var item = list[i];
    item.name = renameGenericPaths
      ? rollName(item.name || item.parent.name || item.layer.name, item.layer)
      : item.name || item.parent.name || item.layer.name;
    if (item.stroked || item.filled) {
      replaceAppearance(item);
      var group = groupRelated ? app.activeDocument.groupItems.add() : null;
      if (groupRelated) {
        group.move(item.layer, ElementPlacement.PLACEATBEGINNING);
        group.name = item.name;
      }
      if (item.pathPoints && item.pathPoints.length)
        for (var p = 0; p < item.pathPoints.length; p++) {
          var point = item.pathPoints[p];
          drawAnchor(point, item.layer, item.name + "[" + p + "]", group);
          drawHandle(
            point,
            "left",
            item.layer,
            item.name + "[" + p + "]",
            group
          );
          drawHandle(
            point,
            "right",
            item.layer,
            item.name + "[" + p + "]",
            group
          );
          item.opacity = forceOpacity ? 100.0 : item.opacity;
        }
    }
  }
}

function drawAnchor(point, layer, name, group) {
  var anchor = group
    ? group.pathItems.rectangle(
        point.anchor[1] + anchorSize / 2,
        point.anchor[0] - anchorSize / 2,
        anchorSize,
        anchorSize
      )
    : app.activeDocument.pathItems.rectangle(
        point.anchor[1] + anchorSize / 2,
        point.anchor[0] - anchorSize / 2,
        anchorSize,
        anchorSize
      );
  anchor.name = name;
  if (!group) anchor.move(layer, ElementPlacement.PLACEATBEGINNING);
  setAnchorAppearance(anchor, false, layer);
  return [anchor];
}
function drawHandle(point, direction, layer, name, group) {
  if (
    Number(point.anchor[0]) !== Number(point[direction + "Direction"][0]) ||
    Number(point.anchor[1]) !== Number(point[direction + "Direction"][1])
  ) {
    var stick = group
      ? group.pathItems.add()
      : app.activeDocument.pathItems.add();
    stick.setEntirePath([point.anchor, point[direction + "Direction"]]);
    if (!group) stick.move(layer, ElementPlacement.PLACEATBEGINNING);
    stick.name = name + "_" + direction.charAt(0).toUpperCase() + "_stick";
    setAnchorAppearance(stick, true, layer);
    var handle = group
      ? group.ellipse(
          point[direction + "Direction"][1] + handleSize / 2,
          point[direction + "Direction"][0] - handleSize / 2,
          handleSize,
          handleSize
        )
      : app.activeDocument.pathItems.ellipse(
          point[direction + "Direction"][1] + handleSize / 2,
          point[direction + "Direction"][0] - handleSize / 2,
          handleSize,
          handleSize
        );
    if (!group) handle.move(layer, ElementPlacement.PLACEATBEGINNING);
    handle.stroked = false;
    handle.filled = true;
    handle.name = name + "_" + direction.charAt(0).toUpperCase() + "_handle";
    handle.fillColor = useLayerLabelColor ? layer.color : anchorColor;
    return [stick, handle];
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

function mergeClippingPaths() {
  app.selection = null;
  app.executeMenuCommand("Clipping Masks menu item");
  var masks = app.selection;
  for (var i = 0; i < masks.length; i++) {
    var mask = masks[i];
    var parent = mask.parent;
    var siblings = [];
    for (var v = 0; v < parent.pathItems.length; v++) {
      var child = parent.pathItems[v];
      if (!child.clipping) {
        // var tag = child.tags.add();
        // tag.name = "marked";
        siblings.push(child);
      }
    }
    if (siblings.length > 1)
      for (var v = 1; v < siblings.length; v++) {
        app.selection = null;
        var dupe = mask.duplicate();
        var sibling = siblings[v];
        var lastname = sibling.name;
        dupe.selected = true;
        sibling.selected = true;
        intersectAction();
        //
        // Fix name transfer
        //
        // for (var e = 0; v < parent.pathItems.length; e++) {
        //   var child = parent.pathItems[e];
        //   if (!child.tags.length && !child.clipping) child.name = lastname;
        // }
      }
    app.selection = null;
    mask.selected = true;
    siblings[0].selected = true;
    var lastname = siblings[0].name;
    intersectAction();
    app.selection = null;
    //
    // Fix name transfer
    //
    // for (var e = 0; v < parent.pathItems.length; e++) {
    //   var child = parent.pathItems[e];
    //   if (!child.tags.length && !child.clipping) child.name = lastname;
    // }
    parent.selected = true;
    app.executeMenuCommand("ungroup");
    app.selection = null;
  }
}

// Thanks Qwertyfly
// https://community.adobe.com/t5/illustrator/js-cs6-executemenucommand/m-p/5904772#M19673
function intersectAction() {
  if ((app.documents.length = 0)) {
    return;
  }
  var ActionString = [
    "/version 3",
    "/name [ 10",
    "	4578706f727454657374",
    "]",
    "/isOpen 1",
    "/actionCount 1",
    "/action-1 {",
    "	/name [ 9",
    "		496e74657273656374",
    "	]",
    "	/keyIndex 0",
    "	/colorIndex 0",
    "	/isOpen 1",
    "	/eventCount 1",
    "	/event-1 {",
    "		/useRulersIn1stQuadrant 0",
    "		/internalName (ai_plugin_pathfinder)",
    "		/localizedName [ 10",
    "			5061746866696e646572",
    "		]",
    "		/isOpen 0",
    "		/isOn 1",
    "		/hasDialog 0",
    "		/parameterCount 1",
    "		/parameter-1 {",
    "			/key 1851878757",
    "			/showInPalette -1",
    "			/type (enumerated)",
    "			/name [ 9",
    "				496e74657273656374",
    "			]",
    "			/value 1",
    "		}",
    "	}",
    "}"
  ].join("\n");
  createAction(ActionString);
  var ActionString = null;
  app.doScript("Intersect", "ExportTest", false);
  app.unloadAction("ExportTest", "");
  function createAction(str) {
    var f = new File("~/ScriptAction.aia");
    f.open("w");
    f.write(str);
    f.close();
    app.loadAction(f);
    f.remove();
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function shortId() {
  var str = "";
  var codex = "0123456789abcdefghijklmnopqrstuvwxyz";
  for (var i = 0; i <= 2; i++)
    str += codex.charAt(randomInt(0, codex.length - 1));
  return str.toUpperCase();
}

// TODO - Ensure items are anomalously named for AE integration, via smart names instead of shortId

// function nameExists(item) {
//   var exists = false;
//   for (var i = 0; i < item.parent.pathItems.length; i++) {
//     if (
//       item.parent.pathItems[i].name == item.name &&
//       item !== item.parent.pathItems[i]
//     )
//       exists = true;
//   }
//   return exists;
// }

// function rollName(name) {
// let index = 0;
// while (nameExists(name + index)) index++;
// return index > 0 ? name + index : name;
// }
// function nameExists(str) {
//   for (var i = 0; i < nameList.length; i++) if (nameList[i] == str) return true;
//   return false;
// }
// function generateName(item) {
//   return item.name
//     ? rollName(item.name)
//     : renameGenericPaths
//     ? item.parent.name
//       ? rollName(item.parent.name) || item.layer.name
//         ? rollName(item.layer.name)
//         : item.name
//       : item.name
//     : item.name;
// }

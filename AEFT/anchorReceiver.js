// IN GROUP > TRANSFORM
var parentPath = thisComp
  .layer("line[1]")
  .content("line[1]")
  .content("Path 1").path;
var offset = content("line[1][0]")
  .content("line[1][0]_anchor")
  .content("Rectangle Path 1").position;
var point = parentPath.points()[0];

[point[0] - offset[0], point[1] - offset[1]];

function generateReceiverAnchor(name, pathIndex, pointIndex) {
  return `// ReceiverAnchor
var parentPath = thisComp
  .layer("${name}[${pathIndex}]")
  .content("${name}[${pathIndex}]")
  .content("Path 1").path;
var offset = content("${name}[${pathIndex}][${pointIndex}]")
  .content("${name}[${pathIndex}][${pointIndex}]_anchor")
  .content("Rectangle Path 1").position;
var point = parentPath.points()[${pointIndex}];

[point[0] - offset[0], point[1] - offset[1]];`;
}

var parentPath = thisComp
  .layer("line[1]")
  .content("line[1]")
  .content("Path 1").path;

var targetNode = parentPath.points()[1];
var targetTangent = parentPath.outTangents()[1];
var tangentPos = [
  targetNode[0] - targetTangent[0],
  targetNode[1] - targetTangent[1]
];

createPath([targetNode, tangentPos]);

//

var parentPath = thisComp
  .layer("line[1]")
  .content("line[1]")
  .content("Path 1").path;

var targetNode = parentPath.points()[1];
var targetTangent = parentPath.outTangents()[1];
var prevTangent = parentPath.inTangents()[0];

// var tangentPos = [targetNode[0] - targetTangent[0], targetNode[1] - targetTangent[1]]

var tangentPos = [
  targetNode[0] - targetTangent[0] - prevTangent[0],
  targetNode[1] - targetTangent[1] - prevTangent[1]
];

createPath([targetNode, tangentPos]);

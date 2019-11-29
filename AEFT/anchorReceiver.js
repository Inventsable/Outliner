var parentPath = thisComp
  .layer("line[0]")
  .content("line[0]")
  .content("Path 1").path;
var parentLayer = thisComp.layer("line[0]");
var offset = content("line[0][0]")
  .content("line[0][0]_anchor")
  .content("Rectangle Path 1").position;
var point = parentPath.points()[0];

[point[0] - offset[0], point[1] - offset[1]];

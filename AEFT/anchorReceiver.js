// IN TRANSFORM > POSITION
const parentLayer = thisComp.layer("line");
const parentPath = parentLayer.content("line").content("Path 1").path;
let vertices = [0];

const data = {
  vertex: parentPath.points()[1]
};

vertices.map((index, i) => {
  let offsetX = 0;
  let offsetY = 0;
  Object.keys(data).forEach((val, e) => {
    offsetX = offsetX + data[val][0];
    offsetY = offsetY + data[val][1];
  });
  return [offsetX, offsetY];
})[0];

const parentLayer = thisComp.layer("line");const parentPath = parentLayer.content("line 1").Path 1.path;let vertices = [0];const data = {  vertex: parentPath.points()[0]};vertices.map((index, i) => {  let offsetX = 0;  let offsetY = 0;  Object.keys(data).forEach((val, e) => {    offsetX = offsetX + data[val][0];    offsetY = offsetY + data[val][1];  });  return [offsetX, offsetY];})[0];      
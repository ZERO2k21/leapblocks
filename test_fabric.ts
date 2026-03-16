import * as fabric from 'fabric';
const canvas = new fabric.Canvas('c');
const rect = new fabric.Rect();

canvas.add(rect);
canvas.bringObjectToFront(rect);
canvas.bringObjectForward(rect);
canvas.sendObjectToBack(rect);
canvas.sendObjectBackwards(rect);

rect.bringToFront();
rect.bringForward();

const sel = new fabric.ActiveSelection([rect], {canvas});
const grp = new fabric.Group([rect]);

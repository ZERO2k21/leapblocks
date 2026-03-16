import * as fabric from 'fabric';
const canvas = new fabric.Canvas('c');
const rect = new fabric.Rect();
rect.sendToBack();
rect.sendBackwards();
rect.sendBackward();

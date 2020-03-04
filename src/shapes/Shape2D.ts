import { Collection } from '../Util';
import { Factory } from '../Factory';
import { Shape, ShapeConfig } from '../Shape';
import { _registerNode } from '../Global';
import { GetSet } from '../types';

function _fillFunc(context) {
  const path = this.path();
  context._context.fill(path);
}
function _strokeFunc(context) {
  const path = this.path();
  context._context.stroke(path);
}
function _fillFuncHit(context) {
  const hitPath = this.hitPath();
  if (hitPath != null) {
    context._context.fill(hitPath);
  } else {
    const path = this.path();
    if (path != null) {
      context._context.fill(path);
    }
  }
}
function _strokeFuncHit(context) {
  const hitPath = this.hitPath();
  if (hitPath != null) {
    context._context.stroke(hitPath);
  } else {
    const path = this.path();
    if (path != null) {
      context._context.stroke(path);
    }
  }
}

interface ViewBox {
  xmin: number;
  ymin: number;
  width: number;
  height: number;
}
export interface Shape2DConfig extends ShapeConfig {
  path: Path2D;
  viewBox: ViewBox;
  hitPath?: Path2D;
  hitViewBox?: ViewBox;
}

export class Shape2D extends Shape<Shape2DConfig> {
  constructor(config?: Shape2DConfig) {
    super(config);
  }

  _sceneFunc(context) {
    const viewBox = this.viewBox();
    if (viewBox == null) {
      return;
    }
    const width = this.width();
    const height = this.height();
    const scaleX = width / viewBox.width;
    const scaleY = height / viewBox.height;
    context.scale(scaleX, scaleY);
    context.translate(-viewBox.xmin, -viewBox.ymin);
    context.fillStrokeShape(this);
  }
  _hitFunc(context) {
    const viewBox = this.hitViewBox() ?? this.viewBox();
    if (viewBox == null) {
      return;
    }
    const width = this.width();
    const height = this.height();
    const scaleX = width / viewBox.width;
    const scaleY = height / viewBox.height;
    context.scale(scaleX, scaleY);
    context.translate(-viewBox.xmin, -viewBox.ymin);
    context.fillStrokeShape(this);
  }

  getWidth() {
    const viewBox = this.viewBox();
    return this.attrs.width ?? (viewBox ? viewBox.width : 0);
  }
  getHeight() {
    const viewBox = this.viewBox();
    return this.attrs.height ?? (viewBox ? viewBox.height : 0);
  }

  path: GetSet<Path2D, this>;
  viewBox: GetSet<ViewBox, this>;
  hitPath: GetSet<Path2D, this>;
  hitViewBox: GetSet<ViewBox, this>;

}
Shape2D.prototype._fillFunc = _fillFunc;
Shape2D.prototype._strokeFunc = _strokeFunc;
Shape2D.prototype._fillFuncHit = _fillFuncHit;
Shape2D.prototype._strokeFuncHit = _strokeFuncHit;

Shape2D.prototype.className = 'Shape2D';
Shape2D.prototype._attrsAffectingSize = ['path', 'viewBox'];
_registerNode(Shape2D);

/**
 * get/set path object string.
 * @name Konva.Shape2D#path
 * @method
 * @param {Path2D} path
 * @returns {Path2D}
 * @example
 * // get path
 * var path = shape2d.path();
 *
 * // set path
 * shape2d.path(new Path2D('M200,100h100v50z'));
 */
Factory.addGetterSetter(Shape2D, 'path');
Factory.addGetterSetter(Shape2D, 'viewBox');
Factory.addGetterSetter(Shape2D, 'hitPath');
Factory.addGetterSetter(Shape2D, 'hitViewBox');

Collection.mapMethods(Shape2D);

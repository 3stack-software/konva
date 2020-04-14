import { Collection } from '../Util';
import { Factory } from '../Factory';
import { Shape, ShapeConfig } from '../Shape';
import { _registerNode } from '../Global';

import { GetSet } from '../types';

export interface ArcPathConfig extends ShapeConfig {
  data: Array<number>;
}
/**
 * ArcPath constructor.
 * @author Jason Follas
 * @constructor
 * @memberof Konva
 * @augments Konva.Shape
 * @param {Object} config
 * @param {String} config.data SVG data string
 * @@shapeParams
 * @@nodeParams
 */
export class ArcPath extends Shape<ArcPathConfig> {
  dataArray = [];

  constructor(config?: ArcPathConfig) {
    super(config);
    this.dataArray = ArcPath.parsePathData(this.data());
    this.on('dataChange.konva', function() {
      this.dataArray = ArcPath.parsePathData(this.data());
    });
  }

  _sceneFunc(context) {
    const points = this.dataArray;
    if (points == null) {
      return;
    }
    context.beginPath();
    const L = points.length;
    context.moveTo(points[0], points[1]);
    let n = 2;
    while (n < L) {
      const remainder = L - n;
      if (remainder >= 4) {
        context.quadraticCurveTo(
          points[n++],
          points[n++],
          points[n++],
          points[n++],
        );
      } else if (remainder >= 2) {
        context.lineTo(points[n++], points[n++]);
      } else {
        break;
      }
    }

    context.fillStrokeShape(this);
  }

  getSelfRect() {
    const q = this.dataArray;
    if (q == null || q.length < 6) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 6; i <= q.length; i += 4) {
      const x1 = q[i - 6];
      const y1 = q[i - 5];
      const px = q[i - 4];
      const py = q[i - 3];
      const x2 = q[i - 2];
      const y2 = q[i - 1];

      minX = Math.min(minX, x1, px, x2);
      minY = Math.min(minY, y1, py, y2);

      maxX = Math.max(maxX, x1, px, x2);
      maxY = Math.max(maxY, y1, py, y2);
    }

    return {
      x: Math.floor(minX),
      y: Math.floor(minY),
      width: Math.ceil(maxX) - Math.floor(minX),
      height: Math.ceil(maxY) - Math.floor(minY),
    };
  }

  data: GetSet<string, this>;

  static parsePathData(data) {
    if (data == null || data.length < 6) {
      return null;
    }
    // implement in a single loop to optimise
    const dataArray = [data[0], data[1]];
    for (let i = 6; i <= data.length; i += 4) {
      const x1 = data[i - 6];
      const y1 = data[i - 5];
      const px = data[i - 4];
      const py = data[i - 3];
      const x2 = data[i - 2];
      const y2 = data[i - 1];
      const d0 = Math.hypot(x1 - px, y1 - py);
      const d1 = Math.hypot(x2 - px, y2 - py);
      const t = d0 / (d0 + d1);
      // TODO check if this t bounds check is OK
      if (Number.isFinite(t) && t > 0 && t < 1) {
        const t1 = 1 - t;
        const cx = px / (2 * t * t1) - (x2 * t) / (2 * t1) - (x1 * t1) / (2 * t);
        const cy = py / (2 * t * t1) - (y2 * t) / (2 * t1) - (y1 * t1) / (2 * t);
        dataArray.push(cx, cy, x2, y2);
      }
    }

    return dataArray;
  }
}

ArcPath.prototype.className = 'ArcPath';
ArcPath.prototype._attrsAffectingSize = ['data'];
_registerNode(ArcPath);

/**
 * @name Konva.ArcPath#data
 * @method
 * @param {Array} points / control points of arc
 * @returns {String}
 * @example
 * // get data
 * var data = path.data();
 *
 * // set data
 * path.data([0, 0, 1, 1, 2, 2]);
 */
Factory.addGetterSetter(ArcPath, 'data');

Collection.mapMethods(ArcPath);

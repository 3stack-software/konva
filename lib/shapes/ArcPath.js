"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../Util");
var Factory_1 = require("../Factory");
var Shape_1 = require("../Shape");
var Global_1 = require("../Global");
var ArcPath = (function (_super) {
    __extends(ArcPath, _super);
    function ArcPath(config) {
        var _this = _super.call(this, config) || this;
        _this.dataArray = [];
        _this.dataArray = ArcPath.parsePathData(_this.data());
        _this.on('dataChange.konva', function () {
            this.dataArray = ArcPath.parsePathData(this.data());
        });
        return _this;
    }
    ArcPath.prototype._sceneFunc = function (context) {
        var points = this.dataArray;
        if (points == null) {
            return;
        }
        context.beginPath();
        var L = points.length;
        context.moveTo(points[0], points[1]);
        var n = 2;
        while (n < L) {
            var remainder = L - n;
            if (remainder >= 4) {
                context.quadraticCurveTo(points[n++], points[n++], points[n++], points[n++]);
            }
            else if (remainder >= 2) {
                context.lineTo(points[n++], points[n++]);
            }
            else {
                break;
            }
        }
        context.fillStrokeShape(this);
    };
    ArcPath.prototype.getSelfRect = function () {
        var q = this.dataArray;
        if (q == null || q.length < 6) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        var minX = Infinity;
        var minY = Infinity;
        var maxX = -Infinity;
        var maxY = -Infinity;
        for (var i = 6; i <= q.length; i += 4) {
            var x1 = q[i - 6];
            var y1 = q[i - 5];
            var px = q[i - 4];
            var py = q[i - 3];
            var x2 = q[i - 2];
            var y2 = q[i - 1];
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
    };
    ArcPath.parsePathData = function (data) {
        if (data == null || data.length < 6) {
            return null;
        }
        var dataArray = [data[0], data[1]];
        for (var i = 6; i <= data.length; i += 4) {
            var x1 = data[i - 6];
            var y1 = data[i - 5];
            var px = data[i - 4];
            var py = data[i - 3];
            var x2 = data[i - 2];
            var y2 = data[i - 1];
            var d0 = Math.hypot(x1 - px, y1 - py);
            var d1 = Math.hypot(x2 - px, y2 - py);
            var t = d0 / (d0 + d1);
            if (Number.isFinite(t) && t > 0 && t < 1) {
                var t1 = 1 - t;
                var cx = px / (2 * t * t1) - (x2 * t) / (2 * t1) - (x1 * t1) / (2 * t);
                var cy = py / (2 * t * t1) - (y2 * t) / (2 * t1) - (y1 * t1) / (2 * t);
                dataArray.push(cx, cy, x2, y2);
            }
        }
        return dataArray;
    };
    return ArcPath;
}(Shape_1.Shape));
exports.ArcPath = ArcPath;
ArcPath.prototype.className = 'ArcPath';
ArcPath.prototype._attrsAffectingSize = ['data'];
Global_1._registerNode(ArcPath);
Factory_1.Factory.addGetterSetter(ArcPath, 'data');
Util_1.Collection.mapMethods(ArcPath);

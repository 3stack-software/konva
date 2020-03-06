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
function _fillFunc(context) {
    var path = this.path();
    context._context.fill(path);
}
function _strokeFunc(context) {
    var path = this.path();
    context._context.stroke(path);
}
function _fillFuncHit(context) {
    var hitPath = this.hitPath();
    if (hitPath != null) {
        context._context.fill(hitPath);
    }
    else {
        var path = this.path();
        if (path != null) {
            context._context.fill(path);
        }
    }
}
function _strokeFuncHit(context) {
    var hitPath = this.hitPath();
    if (hitPath != null) {
        context._context.stroke(hitPath);
    }
    else {
        var path = this.path();
        if (path != null) {
            context._context.stroke(path);
        }
    }
}
var Shape2D = (function (_super) {
    __extends(Shape2D, _super);
    function Shape2D(config) {
        return _super.call(this, config) || this;
    }
    Shape2D.prototype._sceneFunc = function (context) {
        var viewBox = this.viewBox();
        if (viewBox == null) {
            return;
        }
        var width = this.width();
        var height = this.height();
        var scaleX = width / viewBox.width;
        var scaleY = height / viewBox.height;
        context.scale(scaleX, scaleY);
        context.translate(-viewBox.xmin, -viewBox.ymin);
        context.fillStrokeShape(this);
    };
    Shape2D.prototype._hitFunc = function (context) {
        var _a;
        var viewBox = (_a = this.hitViewBox(), (_a !== null && _a !== void 0 ? _a : this.viewBox()));
        if (viewBox == null) {
            return;
        }
        var width = this.width();
        var height = this.height();
        var scaleX = width / viewBox.width;
        var scaleY = height / viewBox.height;
        context.scale(scaleX, scaleY);
        context.translate(-viewBox.xmin, -viewBox.ymin);
        context.fillStrokeShape(this);
    };
    Shape2D.prototype.getWidth = function () {
        var _a;
        var viewBox = this.viewBox();
        return _a = this.attrs.width, (_a !== null && _a !== void 0 ? _a : (viewBox ? viewBox.width : 0));
    };
    Shape2D.prototype.getHeight = function () {
        var _a;
        var viewBox = this.viewBox();
        return _a = this.attrs.height, (_a !== null && _a !== void 0 ? _a : (viewBox ? viewBox.height : 0));
    };
    return Shape2D;
}(Shape_1.Shape));
exports.Shape2D = Shape2D;
Shape2D.prototype._fillFunc = _fillFunc;
Shape2D.prototype._strokeFunc = _strokeFunc;
Shape2D.prototype._fillFuncHit = _fillFuncHit;
Shape2D.prototype._strokeFuncHit = _strokeFuncHit;
Shape2D.prototype.className = 'Shape2D';
Shape2D.prototype._attrsAffectingSize = ['path', 'viewBox'];
Global_1._registerNode(Shape2D);
Factory_1.Factory.addGetterSetter(Shape2D, 'path');
Factory_1.Factory.addGetterSetter(Shape2D, 'viewBox');
Factory_1.Factory.addGetterSetter(Shape2D, 'hitPath');
Factory_1.Factory.addGetterSetter(Shape2D, 'hitViewBox');
Util_1.Collection.mapMethods(Shape2D);

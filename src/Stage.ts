import { Util, Collection } from './Util';
import { Factory } from './Factory';
import { Container, ContainerConfig } from './Container';
import { Konva } from './Global';
import { SceneCanvas, HitCanvas } from './Canvas';
import { GetSet, Vector2d } from './types';
import { Shape } from './Shape';
import { BaseLayer } from './BaseLayer';
import { DD } from './DragAndDrop';
import { _registerNode } from './Global';
import * as PointerEvents from './PointerEvents';

export interface StageConfig extends ContainerConfig {
  container: HTMLDivElement | string;
}

// CONSTANTS
var STAGE = 'Stage',
  STRING = 'string',
  PX = 'px',
  POINTER_TYPE_MOUSE = 'mouse',
  POINTEROUT = 'pointerout',
  POINTERLEAVE = 'pointerleave',
  POINTEROVER = 'pointerover',
  POINTERENTER = 'pointerenter',
  POINTERMOVE = 'pointermove',
  POINTERDOWN = 'pointerdown',
  POINTERUP = 'pointerup',
  POINTERCANCEL = 'pointercancel',
  LOSTPOINTERCAPTURE = 'lostpointercapture',
  CONTEXTMENU = 'contextmenu',
  CLICK = 'click',
  DBL_CLICK = 'dblclick',
  TOUCHSTART = 'touchstart',
  TOUCHEND = 'touchend',
  TAP = 'tap',
  DBL_TAP = 'dbltap',
  TOUCHMOVE = 'touchmove',
  WHEEL = 'wheel',
  CONTENT_POINTEROUT = 'contentPointerout',
  CONTENT_POINTEROVER = 'contentPointerover',
  CONTENT_POINTERMOVE = 'contentPointermove',
  CONTENT_POINTERDOWN = 'contentPointerdown',
  CONTENT_POINTERUP = 'contentPointerup',
  CONTENT_CONTEXTMENU = 'contentContextmenu',
  CONTENT_CLICK = 'contentClick',
  CONTENT_DBL_CLICK = 'contentDblclick',
  CONTENT_TOUCHSTART = 'contentTouchstart',
  CONTENT_TOUCHEND = 'contentTouchend',
  CONTENT_DBL_TAP = 'contentDbltap',
  CONTENT_TAP = 'contentTap',
  CONTENT_TOUCHMOVE = 'contentTouchmove',
  CONTENT_POINTERMOVE = 'contentPointermove',
  CONTENT_POINTERDOWN = 'contentPointerdown',
  CONTENT_POINTERUP = 'contentPointerup',
  CONTENT_WHEEL = 'contentWheel',
  RELATIVE = 'relative',
  KONVA_CONTENT = 'konvajs-content',
  SPACE = ' ',
  UNDERSCORE = '_',
  CONTAINER = 'container',
  MAX_LAYERS_NUMBER = 5,
  EMPTY_STRING = '',
  EVENTS = [
    POINTERENTER,
    POINTERDOWN,
    POINTERMOVE,
    POINTERUP,
    POINTEROUT,
    TOUCHSTART,
    TOUCHMOVE,
    TOUCHEND,
    POINTEROVER,
    WHEEL,
    CONTEXTMENU,
    POINTERCANCEL,
    LOSTPOINTERCAPTURE
  ],
  // cached variables
  eventsLength = EVENTS.length;

function addEvent(ctx, eventName) {
  ctx.content.addEventListener(
    eventName,
    function(evt) {
      ctx[UNDERSCORE + eventName](evt);
    },
    false
  );
}

const NO_POINTERS_MESSAGE = `Pointer position is missing and not registered by the stage. Looks like it is outside of the stage container. You can set it manually from event: stage.setPointersPositions(event);`;

export const stages: Stage[] = [];

function checkNoClip(attrs: any = {}) {
  if (attrs.clipFunc || attrs.clipWidth || attrs.clipHeight) {
    Util.warn(
      'Stage does not support clipping. Please use clip for Layers or Groups.'
    );
  }
  return attrs;
}

/**
 * Stage constructor.  A stage is used to contain multiple layers
 * @constructor
 * @memberof Konva
 * @augments Konva.Container
 * @param {Object} config
 * @param {String|Element} config.container Container selector or DOM element
 * @@nodeParams
 * @example
 * var stage = new Konva.Stage({
 *   width: 500,
 *   height: 800,
 *   container: 'containerId' // or "#containerId" or ".containerClass"
 * });
 */

export class Stage extends Container<BaseLayer> {
  content: HTMLDivElement;
  _pointerPositions: Map<number, Vector2d & { id?: number }> = new Map();
  _changedPointerPositions: Map<number, Vector2d & { id?: number }> = new Map();

  bufferCanvas: SceneCanvas;
  bufferHitCanvas: HitCanvas;
  targetShape: Shape | Stage;
  clickStartShape: Shape | Stage;
  clickEndShape: Shape | Stage;
  dblTimeout: any;
  tapStartShape: Shape | Stage;

  constructor(config: StageConfig) {
    super(checkNoClip(config));
    this._buildDOM();
    this._bindContentEvents();
    stages.push(this);
    this.on('widthChange.konva heightChange.konva', this._resizeDOM);
    this.on('visibleChange.konva', this._checkVisibility);
    this.on(
      'clipWidthChange.konva clipHeightChange.konva clipFuncChange.konva',
      () => {
        checkNoClip(this.attrs);
      }
    );
    this._checkVisibility();
  }

  _validateAdd(child) {
    const isLayer = child.getType() === 'Layer';
    const isFastLayer = child.getType() === 'FastLayer';
    const valid = isLayer || isFastLayer;
    if (!valid) {
      Util.throw('You may only add layers to the stage.');
    }
  }

  _checkVisibility() {
    const style = this.visible() ? '' : 'none';
    this.content.style.display = style;
  }
  /**
   * set container dom element which contains the stage wrapper div element
   * @method
   * @name Konva.Stage#setContainer
   * @param {DomElement} container can pass in a dom element or id string
   */
  setContainer(container) {
    if (typeof container === STRING) {
      if (container.charAt(0) === '.') {
        var className = container.slice(1);
        container = document.getElementsByClassName(className)[0];
      } else {
        var id;
        if (container.charAt(0) !== '#') {
          id = container;
        } else {
          id = container.slice(1);
        }
        container = document.getElementById(id);
      }
      if (!container) {
        throw 'Can not find container in document with id ' + id;
      }
    }
    this._setAttr(CONTAINER, container);
    if (this.content) {
      if (this.content.parentElement) {
        this.content.parentElement.removeChild(this.content);
      }
      container.appendChild(this.content);
    }
    return this;
  }
  shouldDrawHit() {
    return true;
  }

  /**
   * clear all layers
   * @method
   * @name Konva.Stage#clear
   */
  clear() {
    var layers = this.children,
      len = layers.length,
      n;

    for (n = 0; n < len; n++) {
      layers[n].clear();
    }
    return this;
  }
  clone(obj) {
    if (!obj) {
      obj = {};
    }
    obj.container = document.createElement('div');
    return Container.prototype.clone.call(this, obj);
  }

  destroy() {
    super.destroy();

    var content = this.content;
    if (content && Util._isInDocument(content)) {
      this.container().removeChild(content);
    }
    var index = stages.indexOf(this);
    if (index > -1) {
      stages.splice(index, 1);
    }
    return this;
  }
  _getPointerById(id?: number) {
    return this._pointerPositions.get(id);
  }
  getPointersPositions() {
    return this._pointerPositions;
  }
  getStage() {
    return this;
  }
  getContent() {
    return this.content;
  }
  _toKonvaCanvas(config) {
    config = config || {};

    var x = config.x || 0,
      y = config.y || 0,
      canvas = new SceneCanvas({
        width: config.width || this.width(),
        height: config.height || this.height(),
        pixelRatio: config.pixelRatio || 1
      }),
      _context = canvas.getContext()._context,
      layers = this.children;

    if (x || y) {
      _context.translate(-1 * x, -1 * y);
    }

    layers.each(function(layer) {
      if (!layer.isVisible()) {
        return;
      }
      var layerCanvas = layer._toKonvaCanvas(config);
      _context.drawImage(
        layerCanvas._canvas,
        x,
        y,
        layerCanvas.getWidth() / layerCanvas.getPixelRatio(),
        layerCanvas.getHeight() / layerCanvas.getPixelRatio()
      );
    });
    return canvas;
  }

  /**
   * get visible intersection shape. This is the preferred
   *  method for determining if a point intersects a shape or not
   * @method
   * @name Konva.Stage#getIntersection
   * @param {Object} pos
   * @param {Number} pos.x
   * @param {Number} pos.y
   * @param {String} [selector]
   * @returns {Konva.Node}
   * @example
   * var shape = stage.getIntersection({x: 50, y: 50});
   * // or if you interested in shape parent:
   * var group = stage.getIntersection({x: 50, y: 50}, 'Group');
   */
  getIntersection(pos: Vector2d | null, selector?: string): Shape | null {
    if (!pos) {
      return null;
    }
    var layers = this.children,
      len = layers.length,
      end = len - 1,
      n,
      shape;

    for (n = end; n >= 0; n--) {
      shape = layers[n].getIntersection(pos, selector);
      if (shape) {
        return shape;
      }
    }

    return null;
  }
  _resizeDOM() {
    if (this.content) {
      var width = this.width(),
        height = this.height(),
        layers = this.getChildren(),
        len = layers.length,
        n,
        layer;

      // set content dimensions
      this.content.style.width = width + PX;
      this.content.style.height = height + PX;

      this.bufferCanvas.setSize(width, height);
      this.bufferHitCanvas.setSize(width, height);

      // set layer dimensions
      for (n = 0; n < len; n++) {
        layer = layers[n];
        layer.setSize({ width, height });
        layer.draw();
      }
    }
  }
  add(layer) {
    if (arguments.length > 1) {
      for (var i = 0; i < arguments.length; i++) {
        this.add(arguments[i]);
      }
      return this;
    }
    super.add(layer);

    var length = this.children.length;
    if (length > MAX_LAYERS_NUMBER) {
      Util.warn(
        'The stage has ' +
          length +
          ' layers. Recommended maximin number of layers is 3-5. Adding more layers into the stage may drop the performance. Rethink your tree structure, you can use Konva.Group.'
      );
    }
    layer._setCanvasSize(this.width(), this.height());

    // draw layer and append canvas to container
    layer.draw();

    if (Konva.isBrowser) {
      this.content.appendChild(layer.canvas._canvas);
    }

    // chainable
    return this;
  }
  getParent() {
    return null;
  }
  getLayer() {
    return null;
  }

  hasPointerCapture(pointerId: number): boolean {
    return PointerEvents.hasPointerCapture(pointerId, this);
  }

  setPointerCapture(pointerId: number) {
    PointerEvents.setPointerCapture(pointerId, this);
  }

  releaseCapture(pointerId: number) {
    PointerEvents.releaseCapture(pointerId, this);
  }

  /**
   * returns a {@link Konva.Collection} of layers
   * @method
   * @name Konva.Stage#getLayers
   */
  getLayers() {
    return this.getChildren();
  }
  _bindContentEvents() {
    if (!Konva.isBrowser) {
      return;
    }
    for (var n = 0; n < eventsLength; n++) {
      addEvent(this, EVENTS[n]);
    }
  }
  _pointerenter(evt) {
    if (evt.pointerType !== POINTER_TYPE_MOUSE) {
      return
    }
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;
    this._fire(POINTERENTER, {evt: evt, pointerId, target: this, currentTarget: this});

  }
  _pointerover(evt) {
    if (evt.pointerType !== POINTER_TYPE_MOUSE) {
      return;
    }
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;
    this._fire(CONTENT_POINTEROVER, {evt: evt});
    this._fire(POINTEROVER, {evt: evt, pointerId, target: this, currentTarget: this});
  }
  _pointerout(evt) {
    if (evt.pointerType !== POINTER_TYPE_MOUSE) {
      return;
    }
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;
    var targetShape = this.targetShape;

    var eventsEnabled = !DD.isDragging || Konva.hitOnDragEnabled;
    if (targetShape && eventsEnabled) {
      targetShape._fireAndBubble(POINTEROUT, {evt: evt, pointerId});
      targetShape._fireAndBubble(POINTERLEAVE, {evt: evt, pointerId});
      this.targetShape = null;
    } else if (eventsEnabled) {
      this._fire(POINTERLEAVE, {
        evt: evt,
        pointerId,
        target: this,
        currentTarget: this
      });
      this._fire(POINTEROUT, {
        evt: evt,
        pointerId,
        target: this,
        currentTarget: this
      });
    }
    this._pointerPositions.delete(evt.pointerId);

    this._fire(CONTENT_POINTEROUT, {evt: evt});
  }
  _pointermove(evt) {
    if (evt.pointerType !== POINTER_TYPE_MOUSE) {
      return;
    }
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;

    var eventsEnabled = !DD.isDragging || Konva.hitOnDragEnabled;
    if (eventsEnabled) {
      const shape = PointerEvents.getCapturedShape(pointerId)
        || this.getIntersection(this._getPointerById(pointerId));
      if (shape && shape.isListening()) {
        var differentTarget = !this.targetShape || this.targetShape !== shape;
        if (eventsEnabled && differentTarget) {
          if (this.targetShape) {
            this.targetShape._fireAndBubble(
              POINTEROUT,
              { evt: evt, pointerId },
              shape
            );
            this.targetShape._fireAndBubble(
              POINTERLEAVE,
              { evt: evt, pointerId },
              shape
            );
          }
          shape._fireAndBubble(
            POINTEROVER,
            { evt: evt, pointerId },
            this.targetShape
          );
          shape._fireAndBubble(
            POINTERENTER,
            { evt: evt, pointerId },
            this.targetShape
          );
          shape._fireAndBubble(POINTERMOVE, { evt: evt, pointerId });
          this.targetShape = shape;
        } else {
          shape._fireAndBubble(POINTERMOVE, { evt: evt, pointerId });
        }
      } else {
        /*
         * if no shape was detected, clear target shape and try
         * to run pointerout from previous target shape
         */
        if (this.targetShape && eventsEnabled) {
          this.targetShape._fireAndBubble(POINTEROUT, { evt: evt, pointerId });
          this.targetShape._fireAndBubble(POINTERLEAVE, { evt: evt, pointerId });
          this._fire(POINTEROVER, {
            evt: evt,
            target: this,
            currentTarget: this,
            pointerId
          });
          this.targetShape = null;
        }
        this._fire(POINTERMOVE, {
          evt: evt,
          target: this,
          currentTarget: this,
          pointerId
        });
      }

      // content event
      this._fire(CONTENT_POINTERMOVE, { evt: evt });
    }

    // always call preventDefault for desktop events because some browsers
    // try to drag and drop the canvas element
    if (evt.cancelable) {
      evt.preventDefault();
    }
  }
  _pointerdown(evt) {
    if (evt.pointerType !== POINTER_TYPE_MOUSE) {
      return;
    }
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;
    const shape = PointerEvents.getCapturedShape(pointerId)
      || this.getIntersection(this._getPointerById(pointerId));

    Konva.listenClickTap = true;

    if (shape && shape.isListening()) {
      this.clickStartShape = shape;
      shape._fireAndBubble(POINTERDOWN, { evt: evt, pointerId });
    } else {
      this._fire(POINTERDOWN, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId
      });
    }

    // content event
    this._fire(CONTENT_POINTERDOWN, { evt: evt });

    // Do not prevent default behavior, because it will prevent listening events outside of window iframe
    // we used preventDefault for disabling native drag&drop
    // but userSelect = none style will do the trick
    // if (evt.cancelable) {
    //   evt.preventDefault();
    // }
  }
  _pointerup(evt) {
    if (evt.pointerType !== POINTER_TYPE_MOUSE) {
      return;
    }
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;
    var shape = PointerEvents.getCapturedShape(pointerId)
      || this.getIntersection(this._getPointerById(pointerId)),
      clickStartShape = this.clickStartShape,
      clickEndShape = this.clickEndShape,
      fireDblClick = false;

    if (Konva.inDblClickWindow) {
      fireDblClick = true;
      clearTimeout(this.dblTimeout);
      // Konva.inDblClickWindow = false;
    } else if (!DD.justDragged) {
      // don't set inDblClickWindow after dragging
      Konva.inDblClickWindow = true;
      clearTimeout(this.dblTimeout);
    } else if (DD) {
      DD.justDragged = false;
    }

    this.dblTimeout = setTimeout(function() {
      Konva.inDblClickWindow = false;
    }, Konva.dblClickWindow);

    if (shape && shape.isListening()) {
      this.clickEndShape = shape;
      shape._fireAndBubble(POINTERUP, { evt: evt, pointerId });

      // detect if click or double click occurred
      if (
        Konva.listenClickTap &&
        clickStartShape &&
        clickStartShape._id === shape._id
      ) {
        shape._fireAndBubble(CLICK, { evt: evt, pointerId });

        if (fireDblClick && clickEndShape && clickEndShape === shape) {
          shape._fireAndBubble(DBL_CLICK, { evt: evt, pointerId });
        }
      }
    } else {
      this._fire(POINTERUP, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId
      });
      if (Konva.listenClickTap) {
        this._fire(CLICK, {
          evt: evt,
          target: this,
          currentTarget: this,
          pointerId
        });
      }

      if (fireDblClick) {
        this._fire(DBL_CLICK, {
          evt: evt,
          target: this,
          currentTarget: this,
          pointerId
        });
      }
    }
    // content events
    this._fire(CONTENT_POINTERUP, { evt: evt });
    if (Konva.listenClickTap) {
      this._fire(CONTENT_CLICK, { evt: evt });
      if (fireDblClick) {
        this._fire(CONTENT_DBL_CLICK, { evt: evt });
      }
    }

    Konva.listenClickTap = false;

    // always call preventDefault for desktop events because some browsers
    // try to drag and drop the canvas element
    if (evt.cancelable) {
      evt.preventDefault();
    }
  }
  _contextmenu(evt) {
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;
    const shape = PointerEvents.getCapturedShape(pointerId)
      || this.getIntersection(this._getPointerById(pointerId));
    if (shape && shape.isListening()) {
      shape._fireAndBubble(CONTEXTMENU, { evt: evt });
    } else {
      this._fire(CONTEXTMENU, {
        evt: evt,
        target: this,
        currentTarget: this
      });
    }
    this._fire(CONTENT_CONTEXTMENU, { evt: evt });
  }
  _touchstart(evt) {
    this.setPointersPositions(evt);
    var triggeredOnShape = false;
    this._changedPointerPositions.forEach(pos => {
      var shape = this.getIntersection(pos);
      Konva.listenClickTap = true;
      const hasShape = shape && shape.isListening();

      if (!hasShape) {
        return;
      }

      if (Konva.captureTouchEventsEnabled) {
        shape.setPointerCapture(pos.id);
      }

      this.tapStartShape = shape;
      shape._fireAndBubble(TOUCHSTART, { evt: evt, pointerId: pos.id }, this);
      triggeredOnShape = true;
      // only call preventDefault if the shape is listening for events
      if (shape.isListening() && shape.preventDefault() && evt.cancelable) {
        evt.preventDefault();
      }
    });

    if (!triggeredOnShape) {
      this._fire(TOUCHSTART, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId: Util._getFirstPointerId(evt),
      });
    }

    // content event
    this._fire(CONTENT_TOUCHSTART, { evt: evt });
  }
  _touchmove(evt) {
    this.setPointersPositions(evt);
    var eventsEnabled = !DD.isDragging || Konva.hitOnDragEnabled;
    if (eventsEnabled) {
      var triggeredOnShape = false;
      var processedShapesIds = {};
      this._changedPointerPositions.forEach(pos => {
        const shape =
          PointerEvents.getCapturedShape(pos.id) || this.getIntersection(pos);

        const hasShape = shape && shape.isListening();
        if (!hasShape) {
          return;
        }
        if (processedShapesIds[shape._id]) {
          return;
        }
        processedShapesIds[shape._id] = true;
        shape._fireAndBubble(TOUCHMOVE, { evt: evt, pointerId: pos.id });
        triggeredOnShape = true;
        // only call preventDefault if the shape is listening for events
        if (shape.isListening() && shape.preventDefault() && evt.cancelable) {
          evt.preventDefault();
        }
      });

      if (!triggeredOnShape) {
        this._fire(TOUCHMOVE, {
          evt: evt,
          target: this,
          currentTarget: this,
          pointerId: Util._getFirstPointerId(evt),
        });
      }

      this._fire(CONTENT_TOUCHMOVE, { evt: evt });
    }
    if (DD.isDragging && DD.node.preventDefault() && evt.cancelable) {
      evt.preventDefault();
    }
  }
  _touchend(evt) {
    this.setPointersPositions(evt);

    var clickEndShape = this.clickEndShape,
      fireDblClick = false;

    if (Konva.inDblClickWindow) {
      fireDblClick = true;
      clearTimeout(this.dblTimeout);
      // Konva.inDblClickWindow = false;
    } else if (!DD.justDragged) {
      Konva.inDblClickWindow = true;
      clearTimeout(this.dblTimeout);
    }

    this.dblTimeout = setTimeout(function() {
      Konva.inDblClickWindow = false;
    }, Konva.dblClickWindow);

    var triggeredOnShape = false;
    var processedShapesIds = {};
    var tapTriggered = false;
    var dblTapTriggered = false;

    this._changedPointerPositions.forEach(pos => {
      var shape =
        PointerEvents.getCapturedShape(pos.id) ||
        this.getIntersection(pos);

      if (shape) {
        shape.releaseCapture(pos.id);
      }

      const hasShape = shape && shape.isListening();
      if (!hasShape) {
        return;
      }
      if (processedShapesIds[shape._id]) {
        return;
      }
      processedShapesIds[shape._id] = true;

      this.clickEndShape = shape;
      shape._fireAndBubble(TOUCHEND, { evt: evt, pointerId: pos.id });
      triggeredOnShape = true;

      // detect if tap or double tap occurred
      if (Konva.listenClickTap && shape === this.tapStartShape) {
        tapTriggered = true;
        shape._fireAndBubble(TAP, { evt: evt, pointerId: pos.id });

        if (fireDblClick && clickEndShape && clickEndShape === shape) {
          dblTapTriggered = true;
          shape._fireAndBubble(DBL_TAP, { evt: evt, pointerId: pos.id });
        }
      }

      // only call preventDefault if the shape is listening for events
      if (shape.isListening() && shape.preventDefault() && evt.cancelable) {
        evt.preventDefault();
      }
    });

    if (!triggeredOnShape) {
      this._fire(TOUCHEND, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId: Util._getFirstPointerId(evt),
      });
    }

    if (Konva.listenClickTap && !tapTriggered) {
      this._fire(TAP, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId: Util._getFirstPointerId(evt),
      });
    }
    if (fireDblClick && !dblTapTriggered) {
      this._fire(DBL_TAP, {
        evt: evt,
        target: this,
        currentTarget: this,
        pointerId: Util._getFirstPointerId(evt),
      });
    }
    // content events
    this._fire(CONTENT_TOUCHEND, { evt: evt });
    if (Konva.listenClickTap) {
      this._fire(CONTENT_TAP, { evt: evt });
      if (fireDblClick) {
        this._fire(CONTENT_DBL_TAP, { evt: evt });
      }
    }

    Konva.listenClickTap = false;
  }

  _wheel(evt) {
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;
    const shape = PointerEvents.getCapturedShape(pointerId)
      || this.getIntersection(this._getPointerById(pointerId));
    if (shape && shape.isListening()) {
      shape._fireAndBubble(WHEEL, { evt: evt });
    } else {
      this._fire(WHEEL, {
        evt: evt,
        target: this,
        currentTarget: this
      });
    }
    this._fire(CONTENT_WHEEL, { evt: evt });
  }

  _pointercancel(evt: PointerEvent) {
    this.setPointersPositions(evt);
    var pointerId = evt.pointerId;
    const shape = PointerEvents.getCapturedShape(pointerId)
      || this.getIntersection(this._getPointerById(pointerId));

    if (shape) {
      shape._fireAndBubble(POINTERCANCEL, { evt: evt, pointerId });
    }

    PointerEvents.releaseCapture(evt.pointerId);
  }

  _lostpointercapture(evt: PointerEvent) {
    var pointerId = evt.pointerId;
    const shape = PointerEvents.getCapturedShape(pointerId)
      || this.getIntersection(this._getPointerById(pointerId));

    if (shape) {
      shape._fireAndBubble(LOSTPOINTERCAPTURE, { evt: evt, pointerId });
    }

    PointerEvents.releaseCapture(evt.pointerId);
  }

  /**
   * manually register pointers positions (mouse/touch) in the stage.
   * So you can use stage.getPointerPosition(). Usually you don't need to use that method
   * because all internal events are automatically registered. It may be useful if event
   * is triggered outside of the stage, but you still want to use Konva methods to get pointers position.
   * @method
   * @name Konva.Stage#setPointersPositions
   * @param {Object} event Event object
   * @example
   *
   * window.addEventListener('mousemove', (e) => {
   *   stage.setPointersPositions(e);
   * });
   */
  setPointersPositions(evt) {
    var contentPosition = this._getContentPosition(),
      x = null,
      y = null;
    evt = evt ? evt : window.event;

    // touch events
    if (evt.touches !== undefined) {
      // touchlist has not support for map method
      // so we have to iterate
      this._pointerPositions.clear();
      this._changedPointerPositions.clear();
      Collection.prototype.each.call(evt.touches, (touch: any) => {
        this._pointerPositions.set(touch.identifier, {
          id: touch.identifier,
          x: touch.clientX - contentPosition.left,
          y: touch.clientY - contentPosition.top
        });
      });

      Collection.prototype.each.call(
        evt.changedTouches || evt.touches,
        (touch: any) => {
          this._changedPointerPositions.set(touch.identifier, {
            id: touch.identifier,
            x: touch.clientX - contentPosition.left,
            y: touch.clientY - contentPosition.top
          });
        }
      );

      // currently, only handle one finger
      if (evt.touches.length > 0) {
        var touch = evt.touches[0];
        // get the information for finger #1
        x = touch.clientX - contentPosition.left;
        y = touch.clientY - contentPosition.top;
      }
    } else {
      // mouse events
      x = evt.clientX - contentPosition.left;
      y = evt.clientY - contentPosition.top;
      this._pointerPositions.set(evt.pointerId, { x, y, id: evt.pointerId });
      this._changedPointerPositions.set(evt.pointerId, { x, y, id: evt.pointerId });
    }
  }
  _setPointerPosition(evt) {
    Util.warn(
      'Method _setPointerPosition is deprecated. Use "stage.setPointersPositions(event)" instead.'
    );
    this.setPointersPositions(evt);
  }
  _getContentPosition() {
    var rect = this.content.getBoundingClientRect
      ? this.content.getBoundingClientRect()
      : { top: 0, left: 0 };
    return {
      top: rect.top,
      left: rect.left
    };
  }
  _buildDOM() {
    // the buffer canvas pixel ratio must be 1 because it is used as an
    // intermediate canvas before copying the result onto a scene canvas.
    // not setting it to 1 will result in an over compensation
    this.bufferCanvas = new SceneCanvas();
    this.bufferHitCanvas = new HitCanvas({ pixelRatio: 1 });

    if (!Konva.isBrowser) {
      return;
    }
    var container = this.container();
    if (!container) {
      throw 'Stage has no container. A container is required.';
    }
    // clear content inside container
    container.innerHTML = EMPTY_STRING;

    // content
    this.content = document.createElement('div');
    this.content.style.position = RELATIVE;
    this.content.style.userSelect = 'none';
    this.content.className = KONVA_CONTENT;

    this.content.setAttribute('role', 'presentation');

    container.appendChild(this.content);

    this._resizeDOM();
  }
  // currently cache function is now working for stage, because stage has no its own canvas element
  cache() {
    Util.warn(
      'Cache function is not allowed for stage. You may use cache only for layers, groups and shapes.'
    );
    return this;
  }
  clearCache() {
    return this;
  }
  /**
   * batch draw
   * @method
   * @name Konva.BaseLayer#batchDraw
   * @return {Konva.Stage} this
   */
  batchDraw() {
    this.children.each(function(layer) {
      layer.batchDraw();
    });
    return this;
  }

  container: GetSet<HTMLDivElement, this>;
}

Stage.prototype.nodeType = STAGE;
_registerNode(Stage);

/**
 * get/set container DOM element
 * @method
 * @name Konva.Stage#container
 * @returns {DomElement} container
 * @example
 * // get container
 * var container = stage.container();
 * // set container
 * var container = document.createElement('div');
 * body.appendChild(container);
 * stage.container(container);
 */
Factory.addGetterSetter(Stage, 'container');

import { Konva } from './Global';
import { Node } from './Node';
import { Vector2d } from './types';
import { Util } from './Util';

export const DD = {
  get isDragging() {
    var flag = false;
    DD._dragElements.forEach(elem => {
      if (elem.dragStatus === 'dragging') {
        flag = true;
      }
    });
    return flag;
  },
  justDragged: false,
  get node() {
    // return first dragging node
    var node: Node | undefined;
    DD._dragElements.forEach(elem => {
      node = elem.node;
    });
    return node;
  },
  _dragElements: new Map<
    number,
    {
      node: Node;
      startPointerPos: Vector2d;
      offset: Vector2d;
      pointerId?: number;
      // when we just put pointer down on a node
      // it will create drag element
      dragStatus: 'ready' | 'dragging' | 'stopped';
      // dragStarted: boolean;
      // isDragging: boolean;
      // dragStopped: boolean;
    }
  >(),

  // methods
  _drag(evt) {
    if (evt.pointerId && evt.pointerType !== 'mouse') {
      return;
    }
    DD._dragElements.forEach((elem, key) => {
      const { node } = elem;
      // we need to find pointer relative to that node
      const stage = node.getStage();
      stage.setPointersPositions(evt);

      // it is possible that user call startDrag without any event
      // it that case we need to detect first movable pointer and attach it into the node
      if (elem.pointerId === undefined) {
        elem.pointerId = Util._getFirstPointerId(evt);
      }
      const pos = stage._changedPointerPositions.get(elem.pointerId);

      // not related pointer
      if (!pos) {
        return;
      }
      if (elem.dragStatus !== 'dragging') {
        var dragDistance = node.dragDistance();
        var distance = Math.max(
          Math.abs(pos.x - elem.startPointerPos.x),
          Math.abs(pos.y - elem.startPointerPos.y)
        );
        if (distance < dragDistance) {
          return;
        }
        node.startDrag({ evt });
        // a user can stop dragging inside `dragstart`
        if (!node.isDragging()) {
          return;
        }
      }
      node._setDragPosition(evt, elem);

      // execute ondragmove if defined
      node.fire(
        'dragmove',
        {
          type: 'dragmove',
          target: node,
          evt: evt
        },
        true
      );
    });
  },

  // dragBefore and dragAfter allows us to set correct order of events
  // setup all in dragbefore, and stop dragging only after pointerup triggered.
  _endDragBefore(evt?) {
    if (evt.pointerId && evt.pointerType !== 'mouse') {
      return;
    }
    DD._dragElements.forEach((elem, key) => {
      const { node } = elem;
      // we need to find pointer relative to that node
      const stage = node.getStage();
      if (evt) {
        stage.setPointersPositions(evt);
      }

      const pos = stage._changedPointerPositions.get(elem.pointerId)

      // that pointer is not related
      if (!pos) {
        return;
      }

      if (elem.dragStatus === 'dragging') {
        DD.justDragged = true;
        Konva.listenClickTap = false;
        elem.dragStatus = 'stopped';
      }

      const drawNode =
        elem.node.getLayer() ||
        (elem.node instanceof Konva['Stage'] && elem.node);
      if (drawNode) {
        drawNode.draw();
      }
    });
  },
  _endDragAfter(evt) {
    if (evt.pointerId && evt.pointerType !== 'mouse') {
      return;
    }
    DD._dragElements.forEach((elem, key) => {
      if (elem.dragStatus === 'stopped') {
        elem.node.fire(
          'dragend',
          {
            type: 'dragend',
            target: elem.node,
            evt: evt
          },
          true
        );
      }
      if (elem.dragStatus !== 'dragging') {
        DD._dragElements.delete(key);
      }
    });
  }
};

if (Konva.isBrowser) {
  window.addEventListener('pointerup', DD._endDragBefore, true);
  window.addEventListener('touchend', DD._endDragBefore, true);

  window.addEventListener('pointermove', DD._drag);
  window.addEventListener('touchmove', DD._drag);

  window.addEventListener('pointerup', DD._endDragAfter, false);
  window.addEventListener('touchend', DD._endDragAfter, false);
}

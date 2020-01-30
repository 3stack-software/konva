import { Shape } from './Shape';
import { Stage } from './Stage';

export interface GetSet<Type, This> {
  (): Type;
  (v: Type): This;
}

export interface Vector2d {
  x: number;
  y: number;
}

export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IFrame {
	time: number;
	timeDiff: number;
	lastTime: number;
	frameRate: number;
}

export type AnimationFn = (frame?: IFrame) => boolean|void;

export enum KonvaNodeEvent {
  pointerover = 'pointerover',
  pointerout = 'pointerout',
  pointermove = 'pointermove',
  pointerleave = 'pointerleave',
  pointerenter = 'pointerenter',
  pointerdown = 'pointerdown',
  pointerup = 'pointerup',
  wheel = 'wheel',
  contextmenu = 'contextmenu',
  click = 'click',
  dblclick = 'dblclick',
  dragstart = 'dragstart',
  dragmove = 'dragmove',
  dragend = 'dragend'
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

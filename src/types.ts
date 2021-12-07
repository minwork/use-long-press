import {
  MouseEvent as ReactMouseEvent,
  MouseEventHandler,
  TouchEvent as ReactTouchEvent,
  TouchEventHandler,
} from 'react';

export type Coordinates = {
  x: number;
  y: number;
} | null;

export type LongPressEvent<Target = Element> = ReactMouseEvent<Target> | ReactTouchEvent<Target>;
export type LongPressCallback<Target = Element, Context = unknown> = (
  event: LongPressEvent<Target>,
  context?: Context
) => void;

export enum LongPressDetectEvents {
  BOTH = 'both',
  MOUSE = 'mouse',
  TOUCH = 'touch',
}

export type LongPressResult<
  Target,
  DetectType extends LongPressDetectEvents = LongPressDetectEvents.BOTH
> = DetectType extends LongPressDetectEvents.BOTH
  ? {
      onMouseDown: MouseEventHandler<Target>;
      onMouseUp: MouseEventHandler<Target>;
      onMouseMove: MouseEventHandler<Target>;
      onMouseLeave: MouseEventHandler<Target>;
      onTouchStart: TouchEventHandler<Target>;
      onTouchMove: TouchEventHandler<Target>;
      onTouchEnd: TouchEventHandler<Target>;
    }
  : DetectType extends LongPressDetectEvents.MOUSE
  ? {
      onMouseDown: MouseEventHandler<Target>;
      onMouseUp: MouseEventHandler<Target>;
      onMouseMove: MouseEventHandler<Target>;
      onMouseLeave: MouseEventHandler<Target>;
    }
  : DetectType extends LongPressDetectEvents.TOUCH
  ? {
      onTouchStart: TouchEventHandler<Target>;
      onTouchMove: TouchEventHandler<Target>;
      onTouchEnd: TouchEventHandler<Target>;
    }
  : never;
export type EmptyObject = Record<string, never>;
export type CallableContextResult<T, Context> = (context?: Context) => T;

export interface LongPressOptions<Target = Element, Context = unknown> {
  threshold?: number;
  captureEvent?: boolean;
  detect?: LongPressDetectEvents;
  cancelOnMovement?: boolean | number;
  onStart?: LongPressCallback<Target, Context>;
  onMove?: LongPressCallback<Target, Context>;
  onFinish?: LongPressCallback<Target, Context>;
  onCancel?: LongPressCallback<Target, Context>;
}

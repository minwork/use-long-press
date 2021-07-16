import {
  MouseEvent as ReactMouseEvent,
  MouseEventHandler,
  TouchEvent as ReactTouchEvent,
  TouchEventHandler,
  useCallback,
  useEffect,
  useRef,
} from 'react';

function isTouchEvent<Target>(event: LongPressEvent<Target>): event is ReactTouchEvent<Target> {
  const { nativeEvent } = event;
  return window.TouchEvent ? nativeEvent instanceof TouchEvent : 'touches' in nativeEvent;
}
function isMouseEvent<Target>(event: LongPressEvent<Target>): event is ReactMouseEvent<Target> {
  return event.nativeEvent instanceof MouseEvent;
}

type Coordinates = {
  x: number;
  y: number;
} | null;

function getCurrentPosition<Target>(event: LongPressEvent<Target>): Coordinates {
  if (isTouchEvent(event)) {
    return {
      x: event.touches[0].pageX,
      y: event.touches[0].pageY,
    };
  }

  /* istanbul ignore else */
  if (isMouseEvent(event)) {
    return {
      x: event.pageX,
      y: event.pageY,
    };
  }

  /* istanbul ignore next */
  return null;
}

export type LongPressEvent<Target = Element> = ReactMouseEvent<Target> | ReactTouchEvent<Target>;
export type LongPressCallback<Target = Element> = (event?: LongPressEvent<Target>) => void;
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

export interface LongPressOptions<Target = Element> {
  threshold?: number;
  captureEvent?: boolean;
  detect?: LongPressDetectEvents;
  cancelOnMovement?: boolean | number;
  onStart?: LongPressCallback<Target>;
  onMove?: LongPressCallback<Target>;
  onFinish?: LongPressCallback<Target>;
  onCancel?: LongPressCallback<Target>;
}

export function useLongPress<Target = Element>(callback: null, options?: LongPressOptions<Target>): Record<string, never>;
export function useLongPress<Target = Element, Callback extends LongPressCallback<Target> = LongPressCallback<Target>>(
  callback: Callback,
  options?: LongPressOptions<Target>
): LongPressResult<Target>;
export function useLongPress<Target = Element, Callback extends LongPressCallback<Target> = LongPressCallback<Target>>(
  callback: Callback | null,
  options?: LongPressOptions<Target>
): LongPressResult<Target> | Record<string, never>;
/**
 * Detect click / tap and hold event
 *
 * @param callback <p>
 *   Function to call when long press event is detected
 *   (click or tap lasts for <i>threshold</i> amount of time or longer)
 *   </p>
 * @param options <ul>
 * <li><b>threshold</b>
 * - Period of time that must elapse after detecting click or tap in order to trigger <i>callback</i></li>
 * <li><b>captureEvent</b>
 * - If React Event will be supplied as first argument to all callbacks</li>
 * <li><b>detect</b>
 * - Which type of events should be detected ('mouse' | 'touch' | 'both' )
 * <li><b>cancelOnMovement</b>
 * - <p>If long press should be canceled on mouse / touch move.</p>
 * <p>You can use this option to turn it on / off or set specific move tolerance as follows:</p>
 * <ol><li><i>true</i> or <i>false</i> (by default) - when set to true tolerance value will default to <i>25px</i>
 * <li><i>number</i> - set a specific tolerance value (square size inside which movement won't cancel long press)</li></ol>
 * </li>
 * <li><b>onStart</b>
 * - Called right after detecting click / tap event (e.g. onMouseDown or onTouchStart)
 * <li><b>onFinish</b>
 * - Called (if long press <u>was triggered</u>)
 * on releasing click or tap (e.g. onMouseUp, onMouseLeave or onTouchEnd)
 * <li><b>onCancel</b>
 * - Called (if long press <u>was <b>not</b> triggered</u>)
 * on releasing click or tap (e.g. onMouseUp, onMouseLeave or onTouchEnd)
 * </ul>
 */
export function useLongPress<
  Target extends Element = Element,
  Callback extends LongPressCallback<Target> = LongPressCallback<Target>
>(
  callback: Callback | null,
  {
    threshold = 400,
    captureEvent = false,
    detect = LongPressDetectEvents.BOTH,
    cancelOnMovement = false,
    onStart,
    onMove,
    onFinish,
    onCancel,
  }: LongPressOptions<Target> = {}
): LongPressResult<Target, typeof detect> | Record<string, never> {
  const isLongPressActive = useRef(false);
  const isPressed = useRef(false);
  const timer = useRef<NodeJS.Timeout>();
  const savedCallback = useRef(callback);
  const startPosition = useRef<Coordinates>(null);

  const start = useCallback(
    (event: LongPressEvent<Target>) => {
      // Prevent multiple start triggers
      if (isPressed.current) {
        return;
      }

      // Ignore events other than mouse and touch
      if (!isMouseEvent(event) && !isTouchEvent(event)) {
        return;
      }

      startPosition.current = getCurrentPosition(event);

      if (captureEvent) {
        event.persist();
      }

      // When touched trigger onStart and start timer
      captureEvent ? onStart?.(event) : onStart?.();
      isPressed.current = true;
      timer.current = setTimeout(() => {
        if (savedCallback.current) {
          captureEvent ? savedCallback.current(event) : savedCallback.current();
          isLongPressActive.current = true;
        }
      }, threshold);
    },
    [captureEvent, onStart, threshold]
  );

  const cancel = useCallback(
    (event: LongPressEvent<Target>) => {
      // Ignore events other than mouse and touch
      if (!isMouseEvent(event) && !isTouchEvent(event)) {
        return;
      }

      startPosition.current = null;

      if (captureEvent) {
        event.persist();
      }

      // Trigger onFinish callback only if timer was active
      if (isLongPressActive.current) {
        captureEvent ? onFinish?.(event) : onFinish?.();
      } else if (isPressed.current) {
        // Otherwise if not active trigger onCancel
        captureEvent ? onCancel?.(event) : onCancel?.();
      }
      isLongPressActive.current = false;
      isPressed.current = false;
      timer.current !== undefined && clearTimeout(timer.current);
    },
    [captureEvent, onFinish, onCancel]
  );

  const handleMove = useCallback(
    (event: LongPressEvent<Target>) => {
      captureEvent ? onMove?.(event) : onMove?.();
      if (cancelOnMovement && startPosition.current) {
        const currentPosition = getCurrentPosition(event);
        /* istanbul ignore else */
        if (currentPosition) {
          const moveThreshold = cancelOnMovement === true ? 25 : cancelOnMovement;
          const movedDistance = {
            x: Math.abs(currentPosition.x - startPosition.current.x),
            y: Math.abs(currentPosition.y - startPosition.current.y),
          };

          // If moved outside move tolerance box then cancel long press
          if (movedDistance.x > moveThreshold || movedDistance.y > moveThreshold) {
            cancel(event);
          }
        }
      }
    },
    [cancel, cancelOnMovement, captureEvent, onMove]
  );

  useEffect(
    () => (): void => {
      // Clear timeout on unmount
      timer.current !== undefined && clearTimeout(timer.current);
    },
    []
  );

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const mouseHandlers = {
    onMouseDown: start as MouseEventHandler<Target>,
    onMouseMove: handleMove as MouseEventHandler<Target>,
    onMouseUp: cancel as MouseEventHandler<Target>,
    onMouseLeave: cancel as MouseEventHandler<Target>,
  };

  const touchHandlers = {
    onTouchStart: start as TouchEventHandler<Target>,
    onTouchMove: handleMove as TouchEventHandler<Target>,
    onTouchEnd: cancel as TouchEventHandler<Target>,
  };

  if (callback === null) {
    return {};
  }

  if (detect === LongPressDetectEvents.MOUSE) {
    return mouseHandlers;
  }

  if (detect === LongPressDetectEvents.TOUCH) {
    return touchHandlers;
  }

  return { ...mouseHandlers, ...touchHandlers };
}

import { MouseEventHandler, TouchEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  CallableContextResult,
  Coordinates,
  EmptyObject,
  LongPressCallback,
  LongPressCallbackMeta,
  LongPressDetectEvents,
  LongPressEvent,
  LongPressEventReason,
  LongPressOptions,
  LongPressResult,
} from './types';
import { getCurrentPosition, isMouseEvent, isTouchEvent } from './utils';

export function useLongPress<Target = Element, Context = unknown>(
  callback: null,
  options?: LongPressOptions<Target>
): CallableContextResult<EmptyObject, Context>;
export function useLongPress<
  Target = Element,
  Callback extends LongPressCallback<Target> = LongPressCallback<Target>,
  Context = unknown
>(callback: Callback, options?: LongPressOptions<Target>): CallableContextResult<LongPressResult<Target>, Context>;
export function useLongPress<
  Target = Element,
  Callback extends LongPressCallback<Target> = LongPressCallback<Target>,
  Context = unknown
>(
  callback: Callback | null,
  options?: LongPressOptions<Target>
): CallableContextResult<LongPressResult<Target> | EmptyObject, Context>;
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
  Callback extends LongPressCallback<Target> = LongPressCallback<Target>,
  Context extends unknown = undefined
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
  }: LongPressOptions<Target, Context> = {}
): CallableContextResult<LongPressResult<Target, typeof detect> | Record<string, never>, Context> {
  const isLongPressActive = useRef(false);
  const isPressed = useRef(false);
  const timer = useRef<NodeJS.Timeout>();
  const savedCallback = useRef(callback);
  const startPosition = useRef<Coordinates>(null);

  const start = useCallback(
    (context?: Context) => (event: LongPressEvent<Target>) => {
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

      const meta: LongPressCallbackMeta<Context> = context === undefined ? {} : { context };

      // When touched trigger onStart and start timer
      onStart?.(event, meta);
      isPressed.current = true;
      timer.current = setTimeout(() => {
        if (savedCallback.current) {
          savedCallback.current(event, meta);
          isLongPressActive.current = true;
        }
      }, threshold);
    },
    [captureEvent, onStart, threshold]
  );

  const cancel = useCallback(
    (context?: Context, reason?: LongPressEventReason) => (event: LongPressEvent<Target>) => {
      // Ignore events other than mouse and touch
      if (!isMouseEvent(event) && !isTouchEvent(event)) {
        return;
      }

      startPosition.current = null;

      if (captureEvent) {
        event.persist();
      }

      const meta: LongPressCallbackMeta<Context> = context === undefined ? {} : { context };

      // Trigger onFinish callback only if timer was active
      if (isLongPressActive.current) {
        onFinish?.(event, meta);
      } else if (isPressed.current) {
        // Otherwise, if not active trigger onCancel
        onCancel?.(event, { ...meta, reason: reason ?? LongPressEventReason.CANCELED_BY_TIMEOUT });
      }
      isLongPressActive.current = false;
      isPressed.current = false;
      timer.current !== undefined && clearTimeout(timer.current);
    },
    [captureEvent, onFinish, onCancel]
  );

  const handleMove = useCallback(
    (context?: Context) => (event: LongPressEvent<Target>) => {
      onMove?.(event, { context });
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
            cancel(context, LongPressEventReason.CANCELED_BY_MOVEMENT)(event);
          }
        }
      }
    },
    [cancel, cancelOnMovement, onMove]
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

  return useMemo(() => {
    function result(context?: Context) {
      const mouseHandlers = {
        onMouseDown: start(context) as MouseEventHandler<Target>,
        onMouseMove: handleMove(context) as MouseEventHandler<Target>,
        onMouseUp: cancel(context) as MouseEventHandler<Target>,
        onMouseLeave: cancel(context) as MouseEventHandler<Target>,
      };

      const touchHandlers = {
        onTouchStart: start(context) as TouchEventHandler<Target>,
        onTouchMove: handleMove(context) as TouchEventHandler<Target>,
        onTouchEnd: cancel(context) as TouchEventHandler<Target>,
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

    return result;
  }, [callback, cancel, detect, handleMove, start]);
}

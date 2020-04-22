import { MouseEvent, MouseEventHandler, TouchEvent, TouchEventHandler, useCallback, useEffect, useRef } from 'react';

const noop = () => {};

export type LongPressEvent<Target = Element> = MouseEvent<Target> | TouchEvent<Target>;
export type LongPressCallback<Target = Element> = (event?: LongPressEvent<Target>) => void;
export enum LongPressDetectEvents {
    BOTH = 'both',
    MOUSE = 'mouse',
    TOUCH = 'touch',
}

export type LongPressResult<
    Target,
    Callback,
    DetectType extends LongPressDetectEvents = LongPressDetectEvents.BOTH
> = DetectType extends LongPressDetectEvents.BOTH
    ? {
          onMouseDown: MouseEventHandler<Target>;
          onMouseUp: MouseEventHandler<Target>;
          onMouseLeave: MouseEventHandler<Target>;
          onTouchStart: TouchEventHandler<Target>;
          onTouchEnd: TouchEventHandler<Target>;
      }
    : DetectType extends LongPressDetectEvents.MOUSE
    ? {
          onMouseDown: MouseEventHandler<Target>;
          onMouseUp: MouseEventHandler<Target>;
          onMouseLeave: MouseEventHandler<Target>;
      }
    : DetectType extends LongPressDetectEvents.TOUCH
    ? {
          onTouchStart: TouchEventHandler<Target>;
          onTouchEnd: TouchEventHandler<Target>;
      }
    : never;

export interface LongPressOptions<Target = Element> {
    threshold?: number;
    captureEvent?: boolean;
    detect?: LongPressDetectEvents;
    onStart?: LongPressCallback<Target>;
    onFinish?: LongPressCallback<Target>;
    onCancel?: LongPressCallback<Target>;
}

export function useLongPress<Target = Element>(callback: null, options?: LongPressOptions<Target>): {};
export function useLongPress<
    Target = Element,
    Callback extends LongPressCallback<Target> = LongPressCallback<Target>
>(callback: Callback, options?: LongPressOptions<Target>): LongPressResult<Target, Callback>;
export function useLongPress<
    Target = Element,
    Callback extends LongPressCallback<Target> = LongPressCallback<Target>
>(callback: Callback | null, options?: LongPressOptions<Target>): LongPressResult<Target, Callback> | {};
/**
 * Detect click / tap and hold event
 *
 * @param callback <p>Function to call when long press event is detected (click or tap lasts for <i>threshold</i> amount of time or longer)<p>
 * @param options <ul>
 * <li><b>threshold</b> - Period of time that must elapse after detecting click or tap in order to trigger <i>callback</i></li>
 * <li><b>captureEvent</b> - If React Event will be supplied as first argument to all callbacks</li>
 * <li><b>detect</b> - Which type of events should be detected ('mouse' | 'touch' | 'both' )
 * <li><b>onStart</b> - Called right after detecting click / tap event (e.g. onMouseDown or onTouchStart)
 * <li><b>onFinish</b> - Called (if long press <u>was triggered</u>) on releasing click or tap (e.g. onMouseUp, onMouseLeave or onTouchEnd)
 * <li><b>onCancel</b> - Called (if long press <u>was <b>not</b> triggered</u>) on releasing click or tap (e.g. onMouseUp, onMouseLeave or onTouchEnd)
 * </ul>
 */
export function useLongPress<
    Target = Element,
    Callback extends LongPressCallback<Target> = LongPressCallback<Target>
>(
    callback: Callback | null,
    {
        threshold = 400,
        captureEvent = false,
        detect = LongPressDetectEvents.BOTH,
        onStart = noop,
        onFinish = noop,
        onCancel = noop,
    }: LongPressOptions<Target> = {}
): LongPressResult<Target, Callback, typeof detect> | {} {
    const isLongPressActive = useRef(false);
    const isPressed = useRef(false);
    const timer = useRef<NodeJS.Timeout>();
    const savedCallback = useRef(callback);

    const start = useCallback(
        (event: LongPressEvent<Target>) => {
            if (captureEvent) {
                event.persist();
            }
            // When touched trigger onStart and start timer
            captureEvent ? onStart(event) : onStart();
            isPressed.current = true;
            timer.current = setTimeout(() => {
                if (savedCallback.current) {
                    captureEvent ? savedCallback.current(event) : savedCallback.current();
                    isLongPressActive.current = true;
                }
            }, threshold);
        },
        [onStart, captureEvent, threshold]
    );

    const cancel = useCallback(
        (event: LongPressEvent<Target>) => {
            if (captureEvent) {
                event.persist();
            }
            // Trigger onFinish callback only if timer was active
            if (isLongPressActive.current) {
                captureEvent ? onFinish(event) : onFinish();
            } else if (isPressed.current) {
                // Otherwise if not active trigger onCancel
                captureEvent ? onCancel(event) : onCancel();
            }
            isLongPressActive.current = false;
            isPressed.current = false;
            timer.current !== undefined && clearTimeout(timer.current);
        },
        [captureEvent, onFinish, onCancel]
    );

    useEffect(() => {
        return () => {
            // Clear timeout on unmount
            timer.current !== undefined && clearTimeout(timer.current);
        };
    }, []);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const mouseHandlers = {
        onMouseDown: start as MouseEventHandler<Target>,
        onMouseUp: cancel as MouseEventHandler<Target>,
        onMouseLeave: cancel as MouseEventHandler<Target>,
    };

    const touchHandlers = {
        onTouchStart: start as TouchEventHandler<Target>,
        onTouchEnd: cancel as TouchEventHandler<Target>,
    };

    return callback === null
        ? {}
        : detect === LongPressDetectEvents.MOUSE
        ? mouseHandlers
        : detect === LongPressDetectEvents.TOUCH
        ? touchHandlers
        : { ...mouseHandlers, ...touchHandlers };
}

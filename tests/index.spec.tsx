import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { mockMouseEvent, mockTouchEvent } from './utils';
import { useLongPress } from '../src';
import { createMountedTestComponent, createShallowTestComponent } from './TestComponent';
import { LongPressCallback, LongPressDetectEvents, LongPressEventReason } from '../src/types';
import React from 'react';
import { isMouseEvent, isTouchEvent } from '../src/utils';

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetAllMocks();
});

describe('Check isolated hook calls', () => {
  it('should return empty object when callback is null', () => {
    const { result } = renderHook(() => useLongPress(null));
    expect(result.current()).toEqual({});
  });

  it('should return object with all handlers when callback is not null', () => {
    const { result } = renderHook(() => useLongPress(() => {}));
    expect(result.current()).toMatchObject({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseLeave: expect.any(Function),
      onTouchStart: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });
  });

  it('should return appropriate handlers when called with detect param', () => {
    const { result: resultBoth } = renderHook(() =>
      useLongPress(() => {}, {
        detect: LongPressDetectEvents.BOTH,
      })
    );
    expect(resultBoth.current()).toMatchObject({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseLeave: expect.any(Function),
      onTouchStart: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });

    const { result: resultMouse } = renderHook(() =>
      useLongPress(() => {}, {
        detect: LongPressDetectEvents.MOUSE,
      })
    );
    expect(resultMouse.current()).toMatchObject({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseLeave: expect.any(Function),
    });

    const { result: resultTouch } = renderHook(() =>
      useLongPress(() => {}, {
        detect: LongPressDetectEvents.TOUCH,
      })
    );
    expect(resultTouch.current()).toMatchObject({
      onTouchStart: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });
  });

  it('should return callable object', () => {
    const { result } = renderHook(() => useLongPress(null));
    expect(result.current()).toEqual({});
  });
});

describe('Browser compatibility', () => {
  const originalWindow = { ...window.window };
  // let mouseEvent: React.MouseEvent;
  let touchEvent: React.TouchEvent;
  let windowSpy: jest.MockInstance<typeof window, []>;
  let callback: LongPressCallback;
  let onStart: LongPressCallback;
  let onFinish: LongPressCallback;
  let onCancel: LongPressCallback;

  beforeEach(() => {
    // Use fake timers for detecting long press
    jest.useFakeTimers();
    // mouseEvent = mockMouseEvent({ persist: jest.fn() });
    touchEvent = mockTouchEvent({ persist: jest.fn() });
    windowSpy = jest.spyOn(window, 'window', 'get');
    callback = jest.fn();
    onStart = jest.fn();
    onFinish = jest.fn();
    onCancel = jest.fn();
  });

  afterEach(() => {
    windowSpy.mockRestore();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
  it('Properly detect TouchEvent event if browser doesnt provide it', () => {
    windowSpy.mockImplementation(
      () =>
        ({
          ...originalWindow,
          TouchEvent: undefined,
        } as unknown as typeof window)
    );

    const component = createShallowTestComponent({
      callback,
      onStart,
      onFinish,
      onCancel,
      captureEvent: true,
      detect: LongPressDetectEvents.TOUCH,
    });

    component.props().onTouchStart(touchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd(touchEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(touchEvent, {});

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(touchEvent, {});

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(touchEvent, {});

    expect(onCancel).toHaveBeenCalledTimes(0);
  });
});

describe('Detect long press and trigger appropriate handlers', () => {
  let mouseEvent: React.MouseEvent;
  let touchEvent: React.TouchEvent;
  let threshold: number;
  let callback: LongPressCallback;
  let onStart: LongPressCallback;
  let onFinish: LongPressCallback;
  let onCancel: LongPressCallback;

  beforeEach(() => {
    // Use fake timers for detecting long press
    jest.useFakeTimers();
    // Setup common variables
    mouseEvent = mockMouseEvent({ persist: jest.fn() });
    touchEvent = mockTouchEvent({ persist: jest.fn() });
    threshold = Math.round(Math.random() * 1000);
    callback = jest.fn();
    onStart = jest.fn();
    onFinish = jest.fn();
    onCancel = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('Detect long press using mouse events', () => {
    const component = createShallowTestComponent({
      callback,
      onStart,
      onFinish,
      onCancel,
      threshold,
      captureEvent: true,
      detect: LongPressDetectEvents.MOUSE,
    });

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse up (trigger long press)
    // --------------------------------------------------------------------------------------------------------
    component.props().onMouseDown(mouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseUp(mouseEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(mouseEvent, {});

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(mouseEvent, {});

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(mouseEvent, {});

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse leave (trigger long press)
    // --------------------------------------------------------------------------------------------------------
    jest.clearAllMocks();

    component.props().onMouseDown(mouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseLeave(mouseEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(mouseEvent, {});

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(mouseEvent, {});

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(mouseEvent, {});

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse up (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    jest.clearAllMocks();

    component.props().onMouseDown(mouseEvent);
    jest.advanceTimersByTime(Math.round(threshold / 2));
    component.props().onMouseUp(mouseEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(mouseEvent, {});

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(mouseEvent, { reason: LongPressEventReason.CANCELED_BY_TIMEOUT });

    expect(onFinish).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse leave (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    jest.clearAllMocks();

    component.props().onMouseDown(mouseEvent);
    jest.advanceTimersByTime(Math.round(threshold / 2));
    component.props().onMouseLeave(mouseEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(mouseEvent, {});

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(mouseEvent, { reason: LongPressEventReason.CANCELED_BY_TIMEOUT });

    expect(onFinish).toHaveBeenCalledTimes(0);
  });

  it('Detect long press using touch events', () => {
    const component = createShallowTestComponent({
      callback,
      onStart,
      onFinish,
      onCancel,
      threshold,
      captureEvent: true,
      detect: LongPressDetectEvents.TOUCH,
    });

    // --------------------------------------------------------------------------------------------------------
    // Touch start + touch end (trigger long press)
    // --------------------------------------------------------------------------------------------------------

    component.props().onTouchStart(touchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd(touchEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(touchEvent, {});

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(touchEvent, {});

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(touchEvent, {});

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Touch start + touch end (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    jest.clearAllMocks();

    component.props().onTouchStart(touchEvent);
    jest.advanceTimersByTime(Math.round(threshold / 2));
    component.props().onTouchEnd(touchEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(touchEvent, {});

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(touchEvent, { reason: LongPressEventReason.CANCELED_BY_TIMEOUT });

    expect(onFinish).toHaveBeenCalledTimes(0);
  });

  it('Detect and capture move event', () => {
    const onMove = jest.fn();

    let touchComponent = createShallowTestComponent({
      callback: jest.fn(),
      onMove,
      captureEvent: true,
      detect: LongPressDetectEvents.TOUCH,
    });

    touchComponent.props().onTouchMove(touchEvent);
    expect(onMove).toHaveBeenCalledWith(touchEvent, {});

    touchComponent = createShallowTestComponent({
      callback: jest.fn(),
      onMove,
      captureEvent: false,
      detect: LongPressDetectEvents.TOUCH,
    });

    touchComponent.props().onTouchMove(touchEvent);
    expect(onMove).toHaveBeenCalledWith(touchEvent, {});

    let mouseComponent = createShallowTestComponent({
      callback: jest.fn(),
      onMove,
      captureEvent: true,
      detect: LongPressDetectEvents.MOUSE,
    });

    mouseComponent.props().onMouseMove(mouseEvent);
    expect(onMove).toHaveBeenCalledWith(mouseEvent, {});

    mouseComponent = createShallowTestComponent({
      callback: jest.fn(),
      onMove,
      captureEvent: false,
      detect: LongPressDetectEvents.MOUSE,
    });

    mouseComponent.props().onMouseMove(mouseEvent);
    expect(onMove).toHaveBeenCalledWith(mouseEvent, {});
  });
});

describe('Check appropriate behaviour considering supplied hook options', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('Non-persistent events are passed to callbacks when captureEvent flag is false', () => {
    const threshold = 400;
    const callback = jest.fn();
    const onStart = jest.fn();
    const onFinish = jest.fn();
    const onCancel = jest.fn();
    const persistMock = jest.fn();
    const mouseEvent = mockMouseEvent({ persist: persistMock });
    const component = createShallowTestComponent({
      callback,
      onStart,
      onFinish,
      onCancel,
      threshold,
      captureEvent: false,
    });

    component.props().onMouseDown(mouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseUp(mouseEvent);

    expect(persistMock).toHaveBeenCalledTimes(0);

    component.props().onMouseDown(mouseEvent);
    jest.advanceTimersByTime(Math.round(threshold / 2));
    component.props().onMouseUp(mouseEvent);

    expect(persistMock).toHaveBeenCalledTimes(0);
  });

  it('Long press is properly detected when end event is long after threshold value', () => {
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const threshold = 1000;
    const component = createShallowTestComponent({ callback, threshold });

    component.props().onMouseDown(mouseEvent);
    jest.advanceTimersByTime(threshold * 5);
    component.props().onMouseUp(mouseEvent);

    expect(callback).toBeCalledTimes(1);
  });

  it('Detect both mouse and touch events interchangeably, when using detect both option', () => {
    const touchEvent = mockTouchEvent();
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const component = createShallowTestComponent({ callback, detect: LongPressDetectEvents.BOTH });

    component.props().onTouchStart(touchEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseLeave(mouseEvent);

    expect(callback).toBeCalledTimes(1);
  });

  it('Triggering multiple events simultaneously does not trigger onStart and callback twice when using detect both option', () => {
    const touchEvent = mockTouchEvent();
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const onStart = jest.fn();
    const onFinish = jest.fn();
    const component = createShallowTestComponent({
      callback,
      detect: LongPressDetectEvents.BOTH,
      onStart,
      onFinish,
    });

    component.props().onMouseDown(mouseEvent);
    component.props().onTouchStart(touchEvent);
    expect(onStart).toBeCalledTimes(1);
    jest.runOnlyPendingTimers();
    component.props().onMouseLeave(mouseEvent);
    component.props().onMouseUp(mouseEvent);
    component.props().onTouchEnd(touchEvent);
    expect(callback).toBeCalledTimes(1);
    expect(onFinish).toBeCalledTimes(1);
  });

  describe('Cancel on movement', () => {
    it('Should not cancel on movement when appropriate option is set to false', () => {
      const touchEvent = mockTouchEvent({
        touches: [{ pageX: 0, pageY: 0 }] as unknown as React.TouchList,
      });
      const moveTouchEvent = mockTouchEvent({
        touches: [{ pageX: Number.MAX_SAFE_INTEGER, pageY: Number.MAX_SAFE_INTEGER }] as unknown as React.TouchList,
      });
      const mouseEvent = mockMouseEvent({ pageX: 0, pageY: 0 });
      const moveMouseEvent = mockMouseEvent({
        pageX: Number.MAX_SAFE_INTEGER,
        pageY: Number.MAX_SAFE_INTEGER,
      });
      const callback = jest.fn();
      const component = createShallowTestComponent({
        callback,
        cancelOnMovement: false,
      });

      component.props().onTouchStart(touchEvent);
      component.props().onTouchMove(moveTouchEvent);
      jest.runOnlyPendingTimers();
      component.props().onTouchEnd(touchEvent);
      expect(callback).toBeCalledTimes(1);

      component.props().onMouseDown(mouseEvent);
      component.props().onMouseMove(moveMouseEvent);
      jest.runOnlyPendingTimers();
      component.props().onMouseUp(mouseEvent);
      expect(callback).toBeCalledTimes(2);
    });

    it('Should cancel on movement when appropriate option is set to true', () => {
      const touchEvent = mockTouchEvent({
        touches: [{ pageX: 0, pageY: 0 }] as unknown as React.TouchList,
      });
      const moveTouchEvent = mockTouchEvent({
        touches: [{ pageX: Number.MAX_SAFE_INTEGER, pageY: Number.MAX_SAFE_INTEGER }] as unknown as React.TouchList,
      });
      const mouseEvent = mockMouseEvent({ pageX: 0, pageY: 0 });
      const moveMouseEvent = mockMouseEvent({
        pageX: Number.MAX_SAFE_INTEGER,
        pageY: Number.MAX_SAFE_INTEGER,
      });
      const callback = jest.fn();
      const onMove = jest.fn();
      const onCancel = jest.fn();
      const component = createShallowTestComponent({
        callback,
        onMove,
        onCancel,
        cancelOnMovement: true,
      });

      component.props().onTouchStart(touchEvent);
      component.props().onTouchMove(moveTouchEvent);
      jest.runOnlyPendingTimers();
      component.props().onTouchEnd(touchEvent);
      expect(callback).toBeCalledTimes(0);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(moveTouchEvent, {});
      expect(onCancel).toBeCalledTimes(1);
      expect(onCancel).toBeCalledWith(moveTouchEvent, { reason: LongPressEventReason.CANCELED_BY_MOVEMENT });

      callback.mockReset();
      onMove.mockReset();
      onCancel.mockReset();

      component.props().onMouseDown(mouseEvent);
      component.props().onMouseMove(moveMouseEvent);
      jest.runOnlyPendingTimers();
      component.props().onMouseUp(mouseEvent);
      expect(callback).toBeCalledTimes(0);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(moveMouseEvent, {});
      expect(onCancel).toBeCalledTimes(1);
      expect(onCancel).toBeCalledWith(moveMouseEvent, { reason: LongPressEventReason.CANCELED_BY_MOVEMENT });
    });

    it('Should not cancel when within explicitly set movement tolerance', () => {
      const tolerance = 10;
      const touchEvent = mockTouchEvent({
        touches: [{ pageX: 0, pageY: 0 }] as unknown as React.TouchList,
      });
      const moveTouchEvent = mockTouchEvent({
        touches: [{ pageX: tolerance, pageY: tolerance }] as unknown as React.TouchList,
      });
      const mouseEvent = mockMouseEvent({ pageX: 0, pageY: 0 });
      const moveMouseEvent = mockMouseEvent({
        pageX: tolerance,
        pageY: tolerance,
      });
      const callback = jest.fn();
      const onMove = jest.fn();
      const component = createShallowTestComponent({
        callback,
        onMove,
        cancelOnMovement: tolerance,
      });

      component.props().onTouchStart(touchEvent);
      component.props().onTouchMove(moveTouchEvent);
      jest.runOnlyPendingTimers();
      component.props().onTouchEnd(touchEvent);
      expect(callback).toBeCalledTimes(1);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(moveTouchEvent, {});

      callback.mockReset();
      onMove.mockReset();

      component.props().onMouseDown(mouseEvent);
      component.props().onMouseMove(moveMouseEvent);
      jest.runOnlyPendingTimers();
      component.props().onMouseUp(mouseEvent);
      expect(callback).toBeCalledTimes(1);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(moveMouseEvent, {});
    });

    it('Should cancel when moved outside explicitly set movement tolerance', () => {
      const tolerance = 10;
      const touchEvent = mockTouchEvent({
        touches: [{ pageX: 0, pageY: 0 }] as unknown as React.TouchList,
      });
      const moveTouchEvent = mockTouchEvent({
        touches: [{ pageX: 2 * tolerance, pageY: 2 * tolerance }] as unknown as React.TouchList,
      });
      const mouseEvent = mockMouseEvent({ pageX: 0, pageY: 0 });
      const moveMouseEvent = mockMouseEvent({
        pageX: 2 * tolerance,
        pageY: 2 * tolerance,
      });
      const callback = jest.fn();
      const onMove = jest.fn();
      const onCancel = jest.fn();
      const component = createShallowTestComponent({
        callback,
        onMove,
        onCancel,
        cancelOnMovement: tolerance,
      });

      component.props().onTouchStart(touchEvent);
      component.props().onTouchMove(moveTouchEvent);
      jest.runOnlyPendingTimers();
      component.props().onTouchEnd(touchEvent);

      expect(callback).toBeCalledTimes(0);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(moveTouchEvent, {});
      expect(onCancel).toBeCalledTimes(1);
      expect(onCancel).toBeCalledWith(moveTouchEvent, { reason: LongPressEventReason.CANCELED_BY_MOVEMENT });

      callback.mockReset();
      onMove.mockReset();
      onCancel.mockReset();

      component.props().onMouseDown(mouseEvent);
      component.props().onMouseMove(moveMouseEvent);
      jest.runOnlyPendingTimers();
      component.props().onMouseUp(mouseEvent);

      expect(callback).toBeCalledTimes(0);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(moveMouseEvent, {});
      expect(onCancel).toBeCalledTimes(1);
      expect(onCancel).toBeCalledWith(moveMouseEvent, { reason: LongPressEventReason.CANCELED_BY_MOVEMENT });
    });
  });
});
describe('Hook returned binder', () => {
  let mouseEvent: React.MouseEvent = mockMouseEvent({ persist: jest.fn() });
  let touchEvent: React.TouchEvent = mockTouchEvent({ persist: jest.fn() });
  let threshold: number;
  let callback: LongPressCallback;
  let onStart: LongPressCallback;
  let onFinish: LongPressCallback;
  let onCancel: LongPressCallback;

  beforeEach(() => {
    // Use fake timers for detecting long press
    jest.useFakeTimers();
    // Setup common variables
    mouseEvent = mockMouseEvent({ persist: jest.fn() });
    touchEvent = mockTouchEvent({ persist: jest.fn() });
    threshold = Math.round(Math.random() * 1000);
    callback = jest.fn();
    onStart = jest.fn();
    onFinish = jest.fn();
    onCancel = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it.each([
    [LongPressDetectEvents.MOUSE, mouseEvent],
    [LongPressDetectEvents.TOUCH, touchEvent],
  ])('should be able to retrieve passed context on %s events', (detectType, event) => {
    const onMove: LongPressCallback = jest.fn();
    const context = {
      data: {
        foo: 'bar',
      },
    };
    const component = createShallowTestComponent({
      callback,
      context,
      onStart,
      onMove,
      onFinish,
      onCancel,
      threshold,
      detect: detectType,
    });

    if (detectType === LongPressDetectEvents.MOUSE && isMouseEvent(event)) {
      component.props().onMouseDown(event);
      jest.runOnlyPendingTimers();
      component.props().onMouseMove(event);
      jest.runOnlyPendingTimers();
      component.props().onMouseUp(event);
    } else if (detectType === LongPressDetectEvents.TOUCH && isTouchEvent(event)) {
      component.props().onTouchStart(event);
      jest.runOnlyPendingTimers();
      component.props().onTouchMove(event);
      jest.runOnlyPendingTimers();
      component.props().onTouchEnd(event);
    }

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(event, { context });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(event, { context });

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(event, { context });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(event, { context });

    expect(onCancel).toHaveBeenCalledTimes(0);
  });

  it.each([
    [LongPressDetectEvents.MOUSE, mouseEvent],
    [LongPressDetectEvents.TOUCH, touchEvent],
  ])('should only receive last passed context on %s events', (detectType, event) => {
    const onMove: LongPressCallback = jest.fn();
    let i = 1;
    const getContext = () => ({
      data: {
        test: i++,
      },
    });

    const context1 = getContext();
    const context2 = getContext();
    const context3 = getContext();

    const component = createShallowTestComponent({
      callback,
      context: context1,
      onStart,
      onMove,
      onFinish,
      onCancel,
      detect: detectType,
    });

    if (detectType === LongPressDetectEvents.MOUSE && isMouseEvent(event)) {
      component.props().onMouseDown(event);
      component.setProps({ context: context2 });
      component.props().onMouseMove(event);
      jest.runOnlyPendingTimers();
      component.setProps({ context: context3 });
      component.props().onMouseUp(event);
    } else if (detectType === LongPressDetectEvents.TOUCH && isTouchEvent(event)) {
      component.props().onTouchStart(event);
      component.setProps({ context: context2 });
      component.props().onTouchMove(event);
      jest.runOnlyPendingTimers();
      component.setProps({ context: context3 });
      component.props().onTouchEnd(event);
    }

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(event, { context: context1 });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(event, { context: context1 });

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(event, { context: context2 });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(event, { context: context3 });

    expect(onCancel).toHaveBeenCalledTimes(0);
  });

  it.each([
    [LongPressDetectEvents.MOUSE, mouseEvent],
    [LongPressDetectEvents.TOUCH, touchEvent],
  ])(
    'should pass context along with reason when onCancel is called because of a timeout for %s events',
    (detectType, event) => {
      const onMove: LongPressCallback = jest.fn();
      const context = {
        data: {
          foo: 'bar',
        },
      };
      const component = createShallowTestComponent({
        callback,
        context,
        onStart,
        onMove,
        onFinish,
        onCancel,
        threshold,
        detect: detectType,
      });

      if (detectType === LongPressDetectEvents.MOUSE && isMouseEvent(event)) {
        component.props().onMouseDown(event);
        jest.advanceTimersByTime(Math.round(threshold / 2));
        component.props().onMouseMove(event);
        component.props().onMouseLeave(event);
      } else if (detectType === LongPressDetectEvents.TOUCH && isTouchEvent(event)) {
        component.props().onTouchStart(event);
        jest.advanceTimersByTime(Math.round(threshold / 2));
        component.props().onTouchMove(event);
        component.props().onTouchEnd(event);
      }

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(event, { context });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(event, { context });

      expect(onFinish).toHaveBeenCalledTimes(0);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(event, { context, reason: LongPressEventReason.CANCELED_BY_TIMEOUT });
    }
  );

  it.each([
    [
      LongPressDetectEvents.MOUSE,
      mouseEvent,
      mockMouseEvent({
        pageX: Number.MAX_SAFE_INTEGER,
        pageY: Number.MAX_SAFE_INTEGER,
      }),
    ],
    [
      LongPressDetectEvents.TOUCH,
      touchEvent,
      mockTouchEvent({
        touches: [{ pageX: Number.MAX_SAFE_INTEGER, pageY: Number.MAX_SAFE_INTEGER }] as unknown as React.TouchList,
      }),
    ],
  ])(
    'should pass context along with reason when onCancel is called because of a movement for %s events',
    (detectType, event, moveEvent) => {
      const onMove: LongPressCallback = jest.fn();
      const context = {
        data: {
          foo: 'bar',
        },
      };

      const component = createShallowTestComponent({
        callback,
        context,
        onStart,
        onMove,
        onFinish,
        onCancel,
        threshold,
        cancelOnMovement: true,
        detect: detectType,
      });

      if (detectType === LongPressDetectEvents.MOUSE && isMouseEvent(event) && isMouseEvent(moveEvent)) {
        component.props().onMouseDown(event);
        jest.advanceTimersByTime(Math.round(threshold / 2));
        component.props().onMouseMove(moveEvent);
        component.props().onMouseUp(event);
      } else if (detectType === LongPressDetectEvents.TOUCH && isTouchEvent(event) && isTouchEvent(moveEvent)) {
        component.props().onTouchStart(event);
        jest.advanceTimersByTime(Math.round(threshold / 2));
        component.props().onTouchMove(moveEvent);
        component.props().onTouchEnd(event);
      }

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(event, { context });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(moveEvent, { context });

      expect(onFinish).toHaveBeenCalledTimes(0);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(moveEvent, {
        context,
        reason: LongPressEventReason.CANCELED_BY_MOVEMENT,
      });
    }
  );
});

describe('Test general hook behaviour inside a component', () => {
  beforeEach(() => {
    jest.useFakeTimers('legacy');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('Callback is called repetitively on multiple long presses', () => {
    const touchEvent = mockTouchEvent();
    const callback = jest.fn();
    const component = createShallowTestComponent({ callback });

    component.props().onTouchStart(touchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd(touchEvent);

    expect(callback).toBeCalledTimes(1);

    component.props().onTouchStart(touchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd(touchEvent);

    expect(callback).toBeCalledTimes(2);

    component.props().onTouchStart(touchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd(touchEvent);

    expect(callback).toBeCalledTimes(3);
  });

  it('Timer is destroyed when component unmount', () => {
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const onStart = jest.fn();
    const threshold = 1000;
    const thresholdHalf = Math.round(threshold / 2);

    const component = createMountedTestComponent({ callback, threshold, onStart });

    // Trigger press start
    component.find('TestComponent').children().props().onMouseDown(mouseEvent);

    expect(onStart).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(thresholdHalf);

    component.unmount();
    // Trigger useEffect unmount handler
    act(() => {
      jest.runAllImmediates();
    });

    expect(callback).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(thresholdHalf + 1);
    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('Callbacks are not triggered when callback change to null after click / tap', () => {
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const onStart = jest.fn();
    const onFinish = jest.fn();
    const onCancel = jest.fn();

    const component = createMountedTestComponent({ callback, onStart, onFinish, onCancel });

    let props = component.find('TestComponent').children().props();

    expect(props).toHaveProperty('onMouseDown');
    expect(props).toHaveProperty('onMouseUp');
    expect(props).toHaveProperty('onMouseLeave');
    expect(props).toHaveProperty('onTouchStart');
    expect(props).toHaveProperty('onTouchEnd');

    props.onMouseDown(mouseEvent);
    component.setProps({ callback: null }).update();
    act(() => {
      jest.runAllImmediates();
    });
    jest.runOnlyPendingTimers();

    props = component.find('TestComponent').children().props();

    expect(props).not.toHaveProperty('onMouseDown');
    expect(props).not.toHaveProperty('onMouseUp');
    expect(props).not.toHaveProperty('onMouseLeave');
    expect(props).not.toHaveProperty('onTouchStart');
    expect(props).not.toHaveProperty('onTouchEnd');

    expect(onStart).toBeCalledTimes(1);
    expect(callback).toBeCalledTimes(0);
    expect(onFinish).toBeCalledTimes(0);
    expect(onCancel).toBeCalledTimes(0);
  });

  it('Cancel event is not called simply on mouse leave', () => {
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const onCancel = jest.fn();
    const component = createShallowTestComponent({ callback, onCancel });

    component.props().onMouseLeave(mouseEvent);
    component.props().onMouseDown(mouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseUp(mouseEvent);
    component.props().onMouseLeave(mouseEvent);

    expect(onCancel).toBeCalledTimes(0);
  });

  it('Hook is not failing when invalid event was sent to the handler', () => {
    const fakeEvent = new ErrorEvent('invalid');
    const callback = jest.fn();
    const component = createShallowTestComponent({ callback, cancelOnMovement: true });

    component.props().onMouseDown(fakeEvent as unknown as React.MouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseUp(fakeEvent as unknown as React.MouseEvent);

    expect(callback).toBeCalledTimes(0);

    component.props().onMouseDown(fakeEvent as unknown as React.MouseEvent);
    component.props().onMouseMove(fakeEvent as unknown as React.MouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseUp(fakeEvent as unknown as React.MouseEvent);
    component.props().onMouseLeave(fakeEvent as unknown as React.MouseEvent);

    expect(callback).toBeCalledTimes(0);

    component.props().onTouchStart(fakeEvent as unknown as React.TouchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd(fakeEvent as unknown as React.TouchEvent);

    expect(callback).toBeCalledTimes(0);

    component.props().onTouchStart(fakeEvent as unknown as React.TouchEvent);
    component.props().onTouchMove(fakeEvent as unknown as React.TouchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd(fakeEvent as unknown as React.TouchEvent);

    expect(callback).toBeCalledTimes(0);
  });
});

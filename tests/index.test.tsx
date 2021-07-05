import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { mockMouseEvent, mockTouchEvent } from './utils';
import { LongPressCallback, LongPressDetectEvents, useLongPress } from '../src';
import { createMountedTestComponent, createShallowTestComponent } from './TestComponent';

describe('Check isolated hook calls', () => {
  test('Return empty object when callback is null', () => {
    const { result } = renderHook(() => useLongPress(null));
    expect(result.current).toEqual({});
  });

  test('Return object with all handlers when callback is not null', () => {
    const { result } = renderHook(() => useLongPress(() => {}));
    expect(result.current).toMatchObject({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseLeave: expect.any(Function),
      onTouchStart: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });
  });

  test('Return appropriate handlers when called with detect param', () => {
    const { result: resultBoth } = renderHook(() =>
      useLongPress(() => {}, {
        detect: LongPressDetectEvents.BOTH,
      })
    );
    expect(resultBoth.current).toMatchObject({
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
    expect(resultMouse.current).toMatchObject({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseLeave: expect.any(Function),
    });

    const { result: resultTouch } = renderHook(() =>
      useLongPress(() => {}, {
        detect: LongPressDetectEvents.TOUCH,
      })
    );
    expect(resultTouch.current).toMatchObject({
      onTouchStart: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });
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

  test('Detect long press using mouse events', () => {
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
    expect(callback).toHaveBeenCalledWith(mouseEvent);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(mouseEvent);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(mouseEvent);

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse leave (trigger long press)
    // --------------------------------------------------------------------------------------------------------
    jest.clearAllMocks();

    component.props().onMouseDown(mouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseLeave(mouseEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(mouseEvent);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(mouseEvent);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(mouseEvent);

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse up (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    jest.clearAllMocks();

    component.props().onMouseDown(mouseEvent);
    jest.runTimersToTime(Math.round(threshold / 2));
    component.props().onMouseUp(mouseEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(mouseEvent);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(mouseEvent);

    expect(onFinish).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse leave (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    jest.clearAllMocks();

    component.props().onMouseDown(mouseEvent);
    jest.runTimersToTime(Math.round(threshold / 2));
    component.props().onMouseLeave(mouseEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(mouseEvent);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(mouseEvent);

    expect(onFinish).toHaveBeenCalledTimes(0);
  });

  test('Detect long press using touch events', () => {
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
    expect(callback).toHaveBeenCalledWith(touchEvent);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(touchEvent);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(touchEvent);

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Touch start + touch end (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    jest.clearAllMocks();

    component.props().onTouchStart(touchEvent);
    jest.runTimersToTime(Math.round(threshold / 2));
    component.props().onTouchEnd(touchEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(touchEvent);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(touchEvent);

    expect(onFinish).toHaveBeenCalledTimes(0);
  });

  test('Detect and capture move event', () => {
    const onMove = jest.fn();

    let touchComponent = createShallowTestComponent({
      callback: jest.fn(),
      onMove,
      captureEvent: true,
      detect: LongPressDetectEvents.TOUCH,
    });

    touchComponent.props().onTouchMove(touchEvent);
    expect(onMove).toHaveBeenCalledWith(touchEvent);

    touchComponent = createShallowTestComponent({
      callback: jest.fn(),
      onMove,
      captureEvent: false,
      detect: LongPressDetectEvents.TOUCH,
    });

    touchComponent.props().onTouchMove(touchEvent);
    expect(onMove).toHaveBeenCalledWith();

    let mouseComponent = createShallowTestComponent({
      callback: jest.fn(),
      onMove,
      captureEvent: true,
      detect: LongPressDetectEvents.MOUSE,
    });

    mouseComponent.props().onMouseMove(mouseEvent);
    expect(onMove).toHaveBeenCalledWith(mouseEvent);

    mouseComponent = createShallowTestComponent({
      callback: jest.fn(),
      onMove,
      captureEvent: false,
      detect: LongPressDetectEvents.MOUSE,
    });

    mouseComponent.props().onMouseMove(mouseEvent);
    expect(onMove).toHaveBeenCalledWith();
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

  test('No events are passed to callbacks when captureEvent flag is false', () => {
    const threshold = 400;
    const callback = jest.fn();
    const onStart = jest.fn();
    const onFinish = jest.fn();
    const onCancel = jest.fn();
    const mouseEvent = mockMouseEvent();
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

    expect(callback).toHaveBeenCalledWith();
    expect(onStart).toHaveBeenCalledWith();
    expect(onFinish).toHaveBeenCalledWith();

    component.props().onMouseDown(mouseEvent);
    jest.runTimersToTime(Math.round(threshold / 2));
    component.props().onMouseUp(mouseEvent);

    expect(onCancel).toHaveBeenCalledWith();
  });

  test('Long press is properly detected when end event is long after threshold value', () => {
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const threshold = 1000;
    const component = createShallowTestComponent({ callback, threshold });

    component.props().onMouseDown(mouseEvent);
    jest.runTimersToTime(threshold * 5);
    component.props().onMouseUp(mouseEvent);

    expect(callback).toBeCalledTimes(1);
  });

  test('Detect both mouse and touch events interchangeably, when using detect both option', () => {
    const touchEvent = mockTouchEvent();
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const component = createShallowTestComponent({ callback, detect: LongPressDetectEvents.BOTH });

    component.props().onTouchStart(touchEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseLeave(mouseEvent);

    expect(callback).toBeCalledTimes(1);
  });

  test('Triggering multiple events simultaneously does not trigger onStart and callback twice when using detect both option', () => {
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
    test('Should not cancel on movement when appropriate option is set to false', () => {
      const touchEvent = mockTouchEvent({
        touches: ([{ pageX: 0, pageY: 0 }] as unknown) as React.TouchList,
      });
      const moveTouchEvent = mockTouchEvent({
        touches: ([{ pageX: Number.MAX_SAFE_INTEGER, pageY: Number.MAX_SAFE_INTEGER }] as unknown) as React.TouchList,
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

    test('Should cancel on movement when appropriate option is set to true', () => {
      const touchEvent = mockTouchEvent({
        touches: ([{ pageX: 0, pageY: 0 }] as unknown) as React.TouchList,
      });
      const moveTouchEvent = mockTouchEvent({
        touches: ([{ pageX: Number.MAX_SAFE_INTEGER, pageY: Number.MAX_SAFE_INTEGER }] as unknown) as React.TouchList,
      });
      const mouseEvent = mockMouseEvent({ pageX: 0, pageY: 0 });
      const moveMouseEvent = mockMouseEvent({
        pageX: Number.MAX_SAFE_INTEGER,
        pageY: Number.MAX_SAFE_INTEGER,
      });
      const callback = jest.fn();
      const component = createShallowTestComponent({
        callback,
        cancelOnMovement: true,
      });

      component.props().onTouchStart(touchEvent);
      component.props().onTouchMove(moveTouchEvent);
      jest.runOnlyPendingTimers();
      component.props().onTouchEnd(touchEvent);
      expect(callback).toBeCalledTimes(0);

      component.props().onMouseDown(mouseEvent);
      component.props().onMouseMove(moveMouseEvent);
      jest.runOnlyPendingTimers();
      component.props().onMouseUp(mouseEvent);
      expect(callback).toBeCalledTimes(0);
    });

    test('Should not cancel when within explicitly set movement tolerance', () => {
      const tolerance = 10;
      const touchEvent = mockTouchEvent({
        touches: ([{ pageX: 0, pageY: 0 }] as unknown) as React.TouchList,
      });
      const moveTouchEvent = mockTouchEvent({
        touches: ([{ pageX: tolerance, pageY: tolerance }] as unknown) as React.TouchList,
      });
      const mouseEvent = mockMouseEvent({ pageX: 0, pageY: 0 });
      const moveMouseEvent = mockMouseEvent({
        pageX: tolerance,
        pageY: tolerance,
      });
      const callback = jest.fn();
      const component = createShallowTestComponent({
        callback,
        cancelOnMovement: tolerance,
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

    test('Should cancel when moved outside explicitly set movement tolerance', () => {
      const tolerance = 10;
      const touchEvent = mockTouchEvent({
        touches: ([{ pageX: 0, pageY: 0 }] as unknown) as React.TouchList,
      });
      const moveTouchEvent = mockTouchEvent({
        touches: ([{ pageX: 2 * tolerance, pageY: 2 * tolerance }] as unknown) as React.TouchList,
      });
      const mouseEvent = mockMouseEvent({ pageX: 0, pageY: 0 });
      const moveMouseEvent = mockMouseEvent({
        pageX: 2 * tolerance,
        pageY: 2 * tolerance,
      });
      const callback = jest.fn();
      const component = createShallowTestComponent({
        callback,
        cancelOnMovement: tolerance,
      });

      component.props().onTouchStart(touchEvent);
      component.props().onTouchMove(moveTouchEvent);
      jest.runOnlyPendingTimers();
      component.props().onTouchEnd(touchEvent);
      expect(callback).toBeCalledTimes(0);

      component.props().onMouseDown(mouseEvent);
      component.props().onMouseMove(moveMouseEvent);
      jest.runOnlyPendingTimers();
      component.props().onMouseUp(mouseEvent);
      expect(callback).toBeCalledTimes(0);
    });
  });
});

describe('Test general hook behaviour inside a component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('Callback is called repetitively on multiple long presses', () => {
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

  test('Timer is destroyed when component unmount', () => {
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const onStart = jest.fn();
    const threshold = 1000;
    const thresholdHalf = Math.round(threshold / 2);

    const component = createMountedTestComponent({ callback, threshold, onStart });

    // Trigger press start
    component
      .find('TestComponent')
      .children()
      .props()
      .onMouseDown(mouseEvent);

    expect(onStart).toHaveBeenCalledTimes(1);

    jest.runTimersToTime(thresholdHalf);

    component.unmount();
    // Trigger useEffect unmount handler
    act(() => {
      jest.runAllImmediates();
    });

    expect(callback).toHaveBeenCalledTimes(0);
    jest.runTimersToTime(thresholdHalf + 1);
    expect(callback).toHaveBeenCalledTimes(0);
  });

  test('Callbacks are not triggered when callback change to null after click / tap', () => {
    const mouseEvent = mockMouseEvent();
    const callback = jest.fn();
    const onStart = jest.fn();
    const onFinish = jest.fn();
    const onCancel = jest.fn();

    const component = createMountedTestComponent({ callback, onStart, onFinish, onCancel });

    let props = component
      .find('TestComponent')
      .children()
      .props();

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

    props = component
      .find('TestComponent')
      .children()
      .props();

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

  test('Cancel event is not called simply on mouse leave', () => {
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

  test('Hook is not failing when invalid event was sent to the handler', () => {
    const fakeEvent = new ErrorEvent('invalid');
    const callback = jest.fn();
    const component = createShallowTestComponent({ callback, cancelOnMovement: true });

    component.props().onMouseDown((fakeEvent as unknown) as React.MouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseUp((fakeEvent as unknown) as React.MouseEvent);

    expect(callback).toBeCalledTimes(0);

    component.props().onMouseDown((fakeEvent as unknown) as React.MouseEvent);
    component.props().onMouseMove((fakeEvent as unknown) as React.MouseEvent);
    jest.runOnlyPendingTimers();
    component.props().onMouseUp((fakeEvent as unknown) as React.MouseEvent);
    component.props().onMouseLeave((fakeEvent as unknown) as React.MouseEvent);

    expect(callback).toBeCalledTimes(0);

    component.props().onTouchStart((fakeEvent as unknown) as React.TouchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd((fakeEvent as unknown) as React.TouchEvent);

    expect(callback).toBeCalledTimes(0);

    component.props().onTouchStart((fakeEvent as unknown) as React.TouchEvent);
    component.props().onTouchMove((fakeEvent as unknown) as React.TouchEvent);
    jest.runOnlyPendingTimers();
    component.props().onTouchEnd((fakeEvent as unknown) as React.TouchEvent);

    expect(callback).toBeCalledTimes(0);
  });
});

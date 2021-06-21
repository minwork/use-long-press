import React from 'react';

export function mockEvent<EventType extends React.SyntheticEvent = React.SyntheticEvent>(
  props?: Partial<EventType>
): EventType {
  return {
    ...props,
  } as EventType;
}

export function mockTouchEvent<EventType extends React.TouchEvent = React.TouchEvent>(
  props?: Partial<EventType>
): EventType {
  return {
    nativeEvent: new TouchEvent('touch'),
    touches: ([{ pageX: 0, pageY: 0 }] as unknown) as React.TouchList,
    ...props,
  } as EventType;
}

export function mockMouseEvent<EventType extends React.MouseEvent = React.MouseEvent>(
  props?: Partial<EventType>
): EventType {
  return {
    nativeEvent: new MouseEvent('mouse'),
    pageX: 0,
    pageY: 0,
    ...props,
  } as EventType;
}

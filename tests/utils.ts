import React from 'react';

export const noop = () => {};

export function mockEvent<EventType extends React.SyntheticEvent = React.SyntheticEvent>(props?: Partial<EventType>) {
  return {
    ...props
  } as EventType;
}


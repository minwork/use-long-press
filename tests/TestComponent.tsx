import React, { Component, HTMLAttributes, useRef } from 'react';
import { mount, ReactWrapper, shallow, ShallowWrapper } from 'enzyme';
import { useLongPress } from '../src';
import { LongPressCallback, LongPressOptions } from '../src/types';

export interface TestComponentProps extends LongPressOptions {
  callback: LongPressCallback | null;
  context?: unknown;
}

let i = 1;

export const TestComponent: React.FC<TestComponentProps> = ({ callback, context, children, ...options }) => {
  const bind = useLongPress<HTMLButtonElement>(callback, options);
  const key = useRef(i++);

  return (
    <button key={key.current} type="button" {...(context === undefined ? bind() : bind(context))}>
      Click and hold
    </button>
  );
};

export function createShallowTestComponent<Target = Element>(
  props: TestComponentProps
): ShallowWrapper<Required<TestComponentProps & HTMLAttributes<Target>>> {
  return shallow<Component<Required<TestComponentProps & HTMLAttributes<Target>>>>(<TestComponent {...props} />);
}

export function createMountedTestComponent<Target = Element>(
  props: TestComponentProps
): ReactWrapper<Required<TestComponentProps & HTMLAttributes<Target>>> {
  return mount<Component<Required<TestComponentProps & HTMLAttributes<Target>>>>(<TestComponent {...props} />);
}

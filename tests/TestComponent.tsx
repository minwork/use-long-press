import React, { HTMLAttributes } from 'react';
import { mount, ReactWrapper, shallow, ShallowWrapper } from 'enzyme';
import { LongPressCallback, LongPressOptions, useLongPress } from '../src';

export interface TestComponentProps extends LongPressOptions {
  callback: LongPressCallback | null;
}

export const TestComponent: React.FC<TestComponentProps> = ({ callback, children, ...options }) => {
  const bind = useLongPress<HTMLButtonElement>(callback, options);

  return (
    <button type="button" {...bind}>
      Click and hold
    </button>
  );
};

export function createShallowTestComponent<Target = Element>(
  props: TestComponentProps
): ShallowWrapper<Required<TestComponentProps & HTMLAttributes<Target>>> {
  return shallow(<TestComponent {...props} />);
}

export function createMountedTestComponent<Target = Element>(
  props: TestComponentProps
): ReactWrapper<Required<TestComponentProps & HTMLAttributes<Target>>> {
  return mount(<TestComponent {...props} />);
}

import React, { HTMLAttributes } from 'react';
import { LongPressCallback, LongPressOptions, useLongPress } from '../src';
import { mount, shallow } from 'enzyme';

export interface TestComponentProps extends LongPressOptions {
    callback: LongPressCallback | null;
}

export const TestComponent: React.FC<TestComponentProps> = ({ callback, children, ...options }) => {
    const bind = useLongPress<HTMLButtonElement>(callback, options);

    return <button {...bind}>Click and hold</button>;
};

export function createShallowTestComponent<Target = Element>(props: TestComponentProps) {
    return shallow<Required<TestComponentProps & HTMLAttributes<Target>>>(<TestComponent {...props} />);
}

export function createMountedTestComponent<Target = Element>(props: TestComponentProps) {
  return mount<Required<TestComponentProps & HTMLAttributes<Target>>>(<TestComponent {...props} />);
}


# React Long Press Hook :point_down:

> React hook for detecting click (or tap) and hold event.

![Travis (.org)](https://img.shields.io/travis/minwork/use-long-press)
![Codecov](https://img.shields.io/codecov/c/gh/minwork/use-long-press)
![npm type definitions](https://img.shields.io/npm/types/use-long-press)
![npm bundle size](https://img.shields.io/bundlephobia/min/use-long-press)
![npm](https://img.shields.io/npm/v/use-long-press)
![GitHub](https://img.shields.io/github/license/minwork/use-long-press)

-   Easy to use
-   Highly customizable options
-   Thoroughly tested

## Install

```bash
yarn add use-long-press
```

or

```bash
npm install --save use-long-press
```

## Basic Usage

```tsx
import React from 'react';
import { useLongPress } from 'use-long-press';

const Example = () => {
    const bind = useLongPress(() => {
        console.log('Long pressed!');
    });

    return <button {...bind}>Press me</button>;
};
```

## Live example

[![Edit useLongPress](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/uselongpress-gnej6?fontsize=14&hidenavigation=1&theme=dark)

## Advanced usage

Hook first parameter, _callback_, can be either function or `null` (if you want to disable the hook).

Additionally you can supply _options_ object as a second parameter.

As a result hook returns object with various handlers (depending on _detect_ option), which can be spread to some element.

### Definition

```
useLongPress(callback [, options]): handlers
```

### Options

Long press hook can be adjusted using options object, which allow you to fit it to your needs.

| Name         |                    Type                    | Default  | Description                                                                                                                                                                           |
| ------------ | :----------------------------------------: | :------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| threshold    |                   number                   |   400    | Time user need to hold click or tap before long press _callback_ is triggered                                                                                                         |
| captureEvent |                  boolean                   |  false   | If React MouseEvent (or TouchEvent) should be supplied as first argument to callbacks                                                                                                 |
| detect       | Enum('mouse' &#x7c; 'touch' &#x7c; 'both') |  'both'  | Which event handlers should be returned in `bind` object. In TS this enum is accessible through `LongPressDetectEvents`                                                               |
| onStart      |                  Function                  | () => {} | Called when element is initially pressed (before starting timer which detects long press).<br><br>Can accept mouse or touch event if _captureEvents_ option is set to `true`.         |
| onFinish     |                  Function                  | () => {} | Called when press is released (after triggering _callback_).<br><br>Can accept mouse or touch event if _captureEvents_ option is set to `true`.                                       |
| onCancel     |                  Function                  | () => {} | Called when press is released before _threshold_ time elapses, therefore before long press occurs.<br><br>Can accept mouse or touch event if _captureEvents_ option is set to `true`. |

### Example

```jsx harmony
import React, { useState, useCallback } from 'react';
import { useLongPress } from 'use-long-press';

export default function AdvancedExample() {
    const [enabled, setEnabled] = useState(true);
    const callback = useCallback(event => {
        alert('Long pressed!');
    }, []);
    const bind = useLongPress(enabled ? callback : null, {
        onStart: event => console.log('Press started'),
        onFinish: event => console.log('Long press finished'),
        onCancel: event => console.log('Press cancelled'),
        threshold: 500,
        captureEvent: true,
        detect: 'both',
    });

    return (
        <div>
            <button {...bind}>Press and hold</button>
            <div>
                <label htmlFor="enabled">
                    <input
                        type="checkbox"
                        id="enabled"
                        checked={enabled}
                        onChange={() => setEnabled(current => !current)}
                    />
                    Hook enabled
                </label>
            </div>
        </div>
    );
}
```

## License

MIT © [minwork](https://github.com/minwork)

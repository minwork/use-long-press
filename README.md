# React Long Press Hook :point_down:

> React hook for detecting click (or tap) and hold event.

![Travis (.org)](https://img.shields.io/travis/minwork/use-long-press)
![Codecov](https://img.shields.io/codecov/c/gh/minwork/use-long-press)
![npm type definitions](https://img.shields.io/npm/types/use-long-press)
![npm bundle size](https://img.shields.io/bundlephobia/min/use-long-press)
![npm](https://img.shields.io/npm/v/use-long-press)
![GitHub](https://img.shields.io/github/license/minwork/use-long-press)

- Easy to use
- Highly customizable options
- Thoroughly tested

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
import React from 'react'
import { useLongPress } from 'use-long-press'

const Example = () => {
  const bind = useLongPress(() => {
      console.log('Long pressed!');
  });

  return (
    <button {...bind}>
      Press me
    </button>
  )
}
```

## Example

[![Edit useLongPress](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/uselongpress-gnej6?fontsize=14&hidenavigation=1&theme=dark)

## Advanced usage
Callback can be either function or `null` if you want to disable the hook.

Additionally hook accepts options object as a second argument.
```typescript
useLongPress(callback: ((event?: MouseEvent | TouchEvent) => void) | null, options?: LongPressOptions);
```
### Options
Long press hook can be adjusted using options object, which allow you to fit it to your needs.

| Name | Type | Default | Description |
| ---- |:----:|:-------:|:-----------|
|threshold|number|400|Time user need to hold click or tap before long press *callback* is triggered|
|captureEvent|boolean|false|If React MouseEvent (or TouchEvent) should be supplied as first argument to callbacks|
|detect|Enum('mouse' &#x7c; 'touch' &#x7c; 'both')|'both'|Which event handlers should be returned in `bind` object. In TS this enum is accessible through `LongPressDetectEvents`|
|onStart|Function|() => {}|Called when element is initially pressed (before starting timer which detects long press).<br><br>Can accept mouse or touch event if *captureEvents* option is set to `true`.|
|onFinish|Function|() => {}|Called when press is released (after triggering *callback*).<br><br>Can accept mouse or touch event if *captureEvents* option is set to `true`.|
|onCancel|Function|() => {}|Called when press is released before *threshold* time elapses, therefore before long press occurs.<br><br>Can accept mouse or touch event if *captureEvents* option is set to `true`.|
## License

MIT © [minwork](https://github.com/minwork)

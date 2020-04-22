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
- No dependencies

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

## License

MIT © [minwork](https://github.com/minwork)

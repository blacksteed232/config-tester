# @akphi/babel-preset

This preset includes the following presets and plugins:

- [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)
- [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react)
- [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript)
- [@babel/plugin-transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime)

And with the `development` option:

`React` support adds:

- [react-refresh/babel](https://github.com/facebook/react/tree/master/packages/react-refresh)

## Options

const { development, useTypescript, useReact, useBabelRuntime } = opts;

### `development`

`boolean`, defaults to `false`

This toggles behavior specific to development:

- `React` support will turn on `fast-refresh` for files with `JSX`.

### `useTypescript`

`boolean`, defaults to `false`

This toggles support for Typescript. Note that `babel` [does not do type-checking](https://babeljs.io/docs/en/index#type-annotations-flow-and-typescript) (i.e. it only strips away type annotations and transpile files to Javascript) nor generating type definition files.

### `useReact`

`boolean`, defaults to `false`

This toggles support for React. Note that we use `automatic` for runtime option, which auto-import functions from `React@17` that helps with transforming JSX.

### `useBabelRuntime`

`boolean`, defaults to `false`

When enabled, Babel's injected helper code will be reused to [save on bundle size](https://babeljs.io/docs/en/babel-plugin-transform-runtime#usebuiltins). However, this requires `@babel/runtime` as a production dependency (since it's for the "runtime").

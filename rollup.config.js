/**
 * This is based on the rollup config from Redux
 */

import * as React from 'react'

import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import { terser } from 'rollup-plugin-terser'

const env = process.env.NODE_ENV
const config = {
  input: 'dist/umd-intermediate/index.js',
  output: {
    format: 'umd',
    name: 'ReactRoutingLibrary',
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
    }),

    commonjs({
      namedExports: {
        react: Object.keys(React),
      },
    }),

    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
  ],
}

if (env === 'production') {
  config.plugins.push(terser())
}

export default config

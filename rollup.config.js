// import babel from 'rollup-plugin-babel'
import localResolve from 'rollup-plugin-local-resolve'
import resolve from 'rollup-plugin-node-resolve'
import { uglify } from 'rollup-plugin-uglify'
import commonjs from 'rollup-plugin-commonjs'

const plugins = [
  localResolve(),
  resolve({
    module: true
  }),
  commonjs({
    include: "node_modules/**"
  }),
  uglify({
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true
    }
  })
]

export default [
  {
    input: './build/dist/es/pdf-web-viewer/PdfWebViewer.js',
    output: {
      file: './build/dist/browser/pdf-web-viewer.js',
      format: 'umd',
      name: 'PdfTools'
    },
    plugins: plugins
  }
]

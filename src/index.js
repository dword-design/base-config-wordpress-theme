import depcheckSassParser from '@dword-design/depcheck-sass-parser'
import { endent } from '@dword-design/functions'
import execa from 'execa'
import { exists, remove } from 'fs-extra'
import getPackageName from 'get-package-name'
import outputFiles from 'output-files'
import P from 'path'

export default {
  allowedMatches: [
    'dist',
    'fonts',
    'images',
    'scss',
    '*.php',
    'screenshot.png',
    'src',
  ],
  commands: {
    prepublishOnly: async () => {
      if (P.join('src', 'index.js') |> exists |> await) {
        await execa(
          'webpack',
          ['--config', require.resolve('./webpack.config')],
          { stdio: 'inherit' }
        )
      }
      await remove('css')
      await execa(
        'node-sass',
        [
          '--importer',
          require.resolve('./sass-importer'),
          '--output',
          'css',
          'scss',
        ],
        { stdio: 'inherit' }
      )
      await execa.command('postcss css --replace', { stdio: 'inherit' })
    },
  },
  depcheckConfig: {
    parsers: {
      '*.scss': depcheckSassParser,
    },
  },
  editorIgnore: [
    '.eslintrc.json',
    '.stylelintrc.json',
    'postcss.config.js',
    'css',
    'dist',
  ],
  gitignore: ['/.eslintrc.json', '/.stylelintrc.json', '/postcss.config.js'],
  lint: async () => {
    await execa.command(
      'eslint --fix --ignore-pattern dist --ignore-path .gitignore --ext .js,.json .',
      { stdio: 'inherit' }
    )
    await execa.command(
      'stylelint --fix --allow-empty-input --ignore-path .gitignore **/*.scss',
      { stdio: 'inherit' }
    )
  },
  prepare: () =>
    outputFiles({
      '.eslintrc.json': JSON.stringify(
        {
          extends: getPackageName(
            require.resolve('@dword-design/eslint-config')
          ),
        },
        undefined,
        2
      ),
      '.stylelintrc.json': JSON.stringify(
        {
          extends: getPackageName(
            require.resolve('@dword-design/stylelint-config')
          ),
        },
        undefined,
        2
      ),
      'postcss.config.js': endent`
        module.exports = {
          plugins: [
            require('${getPackageName(require.resolve('autoprefixer'))}'),
            require('${getPackageName(
              require.resolve('cssnano')
            )}')({ preset: 'default' }),
          ],
        }

      `,
    }),
}

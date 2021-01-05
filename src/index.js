import depcheckSassParser from '@dword-design/depcheck-sass-parser'
import { endent } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import { exists, remove } from 'fs-extra'
import outputFiles from 'output-files'
import P from 'path'

export default {
  allowedMatches: [
    'css',
    'dist',
    'fonts',
    'gigpress-templates',
    'images',
    'scss',
    '*.php',
    'screenshot.png',
    'src',
    'style.css',
    'views',
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
          extends: packageName`@dword-design/eslint-config`,
        },
        undefined,
        2
      ),
      '.stylelintrc.json': JSON.stringify(
        {
          extends: packageName`@dword-design/stylelint-config`,
        },
        undefined,
        2
      ),
      'postcss.config.js': endent`
        module.exports = {
          plugins: [
            require('${packageName`autoprefixer`}'),
            require('${packageName`cssnano`}')({ preset: 'default' }),
          ],
        }

      `,
    }),
}
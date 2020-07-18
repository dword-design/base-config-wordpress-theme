import depcheckSassParser from '@dword-design/depcheck-sass-parser'
import { endent } from '@dword-design/functions'
import execa from 'execa'
import { remove } from 'fs-extra'
import getPackageName from 'get-package-name'
import outputFiles from 'output-files'
import P from 'path'

const sassImporterPath = P.relative(
  process.cwd(),
  require.resolve('node-sass-tilde-importer/package.json') |> P.dirname
)

export default {
  allowedMatches: ['fonts', 'images', 'scss', '*.php', 'screenshot.png'],
  commands: {
    prepublishOnly: async () => {
      await remove('css')
      await execa.command(
        `node-sass --importer ${sassImporterPath} --output css scss`
      )
      await execa.command('postcss css --replace')
    },
  },
  depcheckConfig: {
    parsers: {
      '*.scss': depcheckSassParser,
    },
  },
  editorIgnore: ['.stylelintrc.json', 'postcss.config.js'],
  gitignore: ['/.stylelintrc.json', '/postcss.config.js'],
  lint: () =>
    execa.command(
      'stylelint --fix --allow-empty-input --ignore-path .gitignore **/*.scss'
    ),
  prepare: () =>
    outputFiles({
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

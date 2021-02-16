import depcheckSassParser from '@dword-design/depcheck-sass-parser'
import { endent } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import { exists, remove } from 'fs-extra'
import outputFiles from 'output-files'
import P from 'path'
import yaml from 'yaml'

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
    dev: async () => {
      await execa.command('docker-compose up', { stdio: 'inherit' })
      await execa.command('docker-compose down -v --remove-orphans', {
        stdio: 'inherit',
      })
    },
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
      'docker-compose.yml': yaml.stringify({
        services: {
          db: {
            environment: {
              MYSQL_DATABASE: 'wordpress',
              MYSQL_PASSWORD: 'wordpress',
              MYSQL_ROOT_PASSWORD: 'somewordpress',
              MYSQL_USER: 'wordpress',
            },
            image: 'mysql:5.7',
            restart: 'always',
          },
          wordpress: {
            depends_on: ['db'],
            environment: {
              WORDPRESS_DB_HOST: 'db:3306',
              WORDPRESS_DB_NAME: 'wordpress',
              WORDPRESS_DB_PASSWORD: 'wordpress',
              WORDPRESS_DB_USER: 'wordpress',
            },
            image: 'wordpress:latest',
            ports: ['3000:80'],
            restart: 'always',
            volumes: ['.:/var/www/html/wp-content/themes/theme'],
          },
        },
        version: '3.3',
      }),
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

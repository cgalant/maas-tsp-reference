Based on Serverless Framework 0.5.5 and NodeJS 4.6.x

`npm install -g serverless@0.5.6`

`git clone git://github.com/blackevil245/json-schema-deref.git` into a local dir and reference it in the package.json

`npm run tspinstall`

`npm test`

`gulp serverStart`
or
`sls offline start`

"C:\Program Files\nodejs\node.exe" --debug-brk=12692 --expose_debug_as=v8debug D:\Projects\boulot\transdev\maas\maas-tsp-reference\node_modules\gulp\bin\gulp.js --color --gulpfile D:\Projects\boulot\transdev\maas\maas-tsp-reference\gulpfile.js serverStart


node.exe --debug-brk=12692 --expose_debug_as=v8debug D:\Projects\boulot\transdev\maas\maas-tsp-reference\node_modules\gulp\bin\gulp.js --color --gulpfile gulpfile.js serverStart
node --debug-brk=12692 --expose_debug_as=v8debug /mnt/d/Projects/boulot/transdev/maas/maas-tsp-reference/node_modules/gulp/bin/gulp.js --color --gulpfile gulpfile.js serverStart

node --debug-brk=12692 --expose_debug_as=v8debug /home/cgalant/.nvm/versions/node/v4.8.3/bin/sls offline start
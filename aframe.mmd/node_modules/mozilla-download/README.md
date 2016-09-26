# Mozilla Download

[![Build Status](https://travis-ci.org/mozilla-b2g/mozilla-download.png?branch=master)](https://travis-ci.org/mozilla-b2g/marionette-download)

Helper utility for downloading various mozilla products. Handles operating system detection (win32, mac, linux-i686, linux-x86\_64) and extraction of files (.tar.bz2, .dmg, .zip).

### Usage

```js
let download = require('mozilla-download/build/main');

// basic
download({
  product: 'firefox',
  os: 'linux-x86_64',
  branch: 'mozilla-central',
  dest: '/where/this/should/go'
})
.then(() => {
  // Go look in /where/this/should/go for ff
});

// crash reporter symbols
download({
  product: 'firefox',
  os: 'mac64',
  branch: 'mozilla-central',
  fileSuffix: 'crashreporter-symbols.zip',
  dest: '/where/to/put/symbols'
});
```

### CLI Usage

```sh
./node_modules/.bin/mozilla-download /path/to/put/extracted/folder
    --branch mozilla-central \
    --product firefox
```

### License

The MIT License (MIT)

Copyright (c) 2015 Gareth Aye, Sahaja James Lal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

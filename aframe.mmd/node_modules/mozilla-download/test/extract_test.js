import { assert } from 'chai';
import { exec } from 'mz/child_process';
import { extract } from '../src/extract';
import { tempdir } from '../src/temp';

suite('extract', function() {
  test('tar.bz2', function() {
    let archive = __dirname + '/fixtures/archive.tar.bz2';
    let file1, file2;
    return tempdir()
    .then(path => {
      file1 = path + '/file.txt';
      file2 = path + '/file2.txt';
      return extract({ filetype: 'tar.bz2', source: archive, dest: path });
    })
    .then(() => exec(['cat', file1, file2].join(' ')))
    .then(res => {
      assert.match(res, /lol\s*cats/);
    });
  });
});

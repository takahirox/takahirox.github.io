import { assert } from 'chai';
import detectOS from '../src/detectos';

suite('detectOS', function() {
  test('darwin', function() {
    assert.equal(detectOS({ platform: 'darwin' }), 'mac64');
  });

  test('x86_64', function() {
    assert.equal(detectOS({ platform: 'linux', arch: 'x64' }), 'linux-x86_64');
  });
});

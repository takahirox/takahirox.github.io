import { assert } from 'chai';
import detectURL from '../src/detecturl';

suite('detectURL', function() {
  test('x86_64 b2g-desktop opt', async function() {
    let options = {
      product: 'b2g-desktop',
      os: 'linux-x86_64',
      branch: 'mozilla-central',
    };

    let url = await detectURL(options);
    assert.match(
      url,
      new RegExp(
        '^https:\/\/queue\.taskcluster\.net\/v1\/task\/[A-Za-z0-9_\-]+\/' +
        'artifacts\/public\/build\/.+linux-x86_64\.tar\.bz2$'
      )
    );
  });

  test('fileSuffix specified', async function() {
    let options = {
      product: 'firefox',
      os: 'linux-x86_64',
      branch: 'mozilla-central',
      fileSuffix: 'crashreporter-symbols.zip'
    };

    let url = await detectURL(options);
    assert.match(
      url,
      new RegExp(
        new RegExp(
          '^https:\/\/queue\.taskcluster\.net\/v1\/task\/[A-Za-z0-9_\-]+\/' +
          'artifacts\/public\/build\/firefox.+crashreporter-symbols\.zip$'
        )
      )
    );
  });

  test('bogus fileSuffix', async function() {
    let options = {
      product: 'b2g-desktop',
      os: 'linux-x86_64',
      branch: 'mozilla-central',
      fileSuffix: 'totalrando'
    };

    try {
      await detectURL(options);
    } catch (error) {
      assert.equal(error.message, 'Could not find appropriate artifact');
    }
  });

  test('emulator-kk', async function() {
    let options = {
      product: 'emulator-kk',
      os: 'linux-x86_64',
      branch: 'mozilla-central'
    };

    let url = await detectURL(options);
    assert.match(
      url,
      new RegExp(
        '^https:\/\/queue\.taskcluster\.net\/v1\/task\/[A-Za-z0-9_\-]+\/' +
        'artifacts\/public\/build\/emulator\.tar\.gz$'
      )
    );
  });
});

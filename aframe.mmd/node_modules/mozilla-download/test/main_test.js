import { assert } from 'chai';
import fs from 'fs';
import detectOS from '../src/detectos';
import main from '../src/main';
import { tempdir } from '../src/temp';

suite('main', function() {
  let cases = [
    {
      name: 'already exists',
      args: {
        product: 'b2g-desktop',
        os: 'linux-x86_64',
        branch: 'mozilla-central',
        dest: `${__dirname}/fixtures`
      },
      verify: function() {
        assert.deepEqual(fs.readdirSync(`${__dirname}/fixtures/b2g`), ['random']);
      }
    },
    {
      name: 'mozilla-central linux-x86_64 b2g-desktop opt',
      args: {
        product: 'b2g-desktop',
        os: 'linux-x86_64',
        branch: 'mozilla-central'
      },

      verify: function() {
        let dir = `${this.args.dest}/b2g`;
        assert.ok(fs.existsSync(dir), `No b2g dir in ${this.args.dest}`);
        let contents = fs.readdirSync(dir);
        assert.include(contents, 'b2g', `No b2g bin in ${contents.join(',')}`);
      }
    },

    {
      name: 'mozilla-aurora firefox crash reporter symbols',
      args: {
        product: 'firefox',
        os: 'linux-x86_64',
        branch: 'mozilla-aurora',
        fileSuffix: 'crashreporter-symbols.zip'
      },

      verify: function() {
        let dir = this.args.dest;
        let contents = fs.readdirSync(dir);
        assert.operator(contents.length, '>', 0);
      }
    },

    {
      name: 'osx b2g-desktop debug',
      args: {
        product: 'b2g-desktop',
        os: 'mac64',
        branch: 'mozilla-central',
        debug: '1'
      },

      verify: function() {
        let dir = `${this.args.dest}/b2g`;
        assert.ok(fs.existsSync(dir), `No b2g dir in ${this.args.dest}`);
        let contents = fs.readdirSync(dir);
        assert.include(contents, 'Contents', `No contents in ${dir}`);
      }
    },

    {
      name: 'linux x86_64 mulet',
      args: {
        product: 'mulet',
        os: 'linux-x86_64',
        branch: 'mozilla-central'
      },

      verify: function() {
        let dir = `${this.args.dest}/firefox`;
        assert.ok(fs.existsSync(dir), `No mulet dir in ${this.args.dest}`);
        let contents = fs.readdirSync(dir);
        assert.include(contents, 'firefox', `No ff in ${contents.join(',')}`);
      }
    },

    {
      name: 'mozilla-central osx firefox',
      args: {
        product: 'firefox',
        os: 'mac64',
        branch: 'mozilla-central'
      },

      verify: function() {
        let dir = `${this.args.dest}/firefox`;
        assert.ok(fs.existsSync(dir), `No firefox dir in ${this.args.dest}`);
        let contents = fs.readdirSync(dir);
        assert.include(contents, 'Contents', `No contents in ${dir}`);
      }
    }
  ]

  cases.forEach(testCase => {
    test(testCase.name, async function() {
      let os = detectOS();
      if (isMac(os) && isLinux(testCase.args.os) ||
          isLinux(os) && isMac(testCase.args.os)) {
        return;
      }

      let dest = await tempdir();
      testCase.args.dest = testCase.args.dest || dest;
      await main(testCase.args);
      testCase.verify();
    });
  });
});

function isLinux(os) {
  return os.indexOf('linux') !== -1;
}

function isMac(os) {
  return os.indexOf('mac') !== -1;
}

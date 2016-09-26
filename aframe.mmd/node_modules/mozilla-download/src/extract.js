import Promise from 'promise';
import dmg from 'dmg';
import { exec } from 'mz/child_process';
import fs from 'fs';
import { ncp } from 'ncp';
import { tempdir } from './temp';

dmg.mount = Promise.denodeify(dmg.mount);
dmg.unmount = Promise.denodeify(dmg.unmount);
ncp = Promise.denodeify(ncp);

export let productDirname = Object.freeze({
  'b2g-desktop': 'b2g',
  'firefox': 'firefox',
  'mulet': 'firefox'
});

/**
 * @fileoverview Extracts firefox or b2g runtime from a compressed format.
 *
 * Options:
 *
 *   (String) product
 *   (String) filetype
 *   (String) source
 *   (String) dest
 */
export async function extract(options) {
  let dest = options.dest;
  let path = await tempdir();
  // Extract to temporary location.
  options.dest = path;
  switch (options.filetype) {
    case 'dmg':
      await extractDmg(options);
      break;
    case 'tar.gz':
    case 'tar.bz2':
      await extractTarball(options);
      break;
    case 'zip':
      await extractZipball(options);
      break;
    default:
      // Default to no extraction if we don't understand filetype.
      options.dest = dest;
      break;
  }

  // Copy to destination.
  await ncp(options.dest, dest);
}

async function extractDmg(options) {
  let path = await dmg.mount(options.source);
  let files = fs.readdirSync(path);
  let target = files.find(file => /\.app/.test(file));
  let source = path + '/' + target;
  let dest = options.dest + '/' + productDirname[options.product];
  fs.mkdirSync(dest);
  await ncp(source, dest);
  await dmg.unmount(path);
}

function extractTarball(options) {
  return exec(['tar', '-xf', options.source, '-C', options.dest].join(' '));
}

function extractZipball(options) {
  return exec(['unzip', options.source, '-d', options.dest].join(' '));
}

import { ArgumentParser } from 'argparse';
import debug from 'debug';
import detectOS from './detectos';
import detectURL from './detecturl';
import download from './download';
import { extract, productDirname } from './extract';
import { readdir } from 'mz/fs';
import * as buildinfo from './moz_build_info';

debug = debug('mozilla-download/main');

let parser = new ArgumentParser({
  version: require('../package').version,
  description: 'Utility to download gecko builds from taskcluster index',
  addHelp: false
});

parser.addArgument(['--product'], {
  type: 'string',
  help: 'Name for gecko build (ie b2g-desktop, mulet)',
  defaultValue: 'b2g-desktop'
});

parser.addArgument(['--os'], {
  type: 'string',
  help: 'OS to download build for (ie linux-x86_64)',
  defaultValue: detectOS()
});

parser.addArgument(['--branch'], {
  type: 'string',
  defaultValue: 'mozilla-central'
});

parser.addArgument(['--debug'], {
  type: 'int',
  defaultValue: 0
});

parser.addArgument(['--file-suffix'], {
  type: 'string',
  dest: 'fileSuffix'
});

parser.addArgument(['dest'], {
  type: 'string'
});

export default async function main(args=parser.parseArgs()) {
  let dirname = productDirname[args.product];
  try {
    try {
      // Bail if thing exists
      let contents = await readdir(args.dest);
      if (dirname && contents && contents.indexOf(dirname) !== -1) {
        // dest dir includes product
        debug(`Found ${dirname} at dest ${args.dest}`);
        return;
      }
    } catch (error) {
    }

    debug(`No ${dirname} found. Will download to ${args.dest}`);
    let url = await detectURL(args);
    debug('Artifact url', url);
    let path = await download(url, args);
    debug('Download to', path);
    let product = args.product;
    let extractOpts = { source: path, dest: args.dest, product: product };
    if (args.fileSuffix) {
      let parts = args.fileSuffix.split('.');
      extractOpts.filetype = parts[parts.length - 1];
    } else {
      // They want the regular old build archive.
      let os = args.os;
      extractOpts.filetype = buildinfo.archiveFiletype(os, product);
    }

    await extract(extractOpts);
  } catch (error) {
    console.error(error.toString());
  }
}

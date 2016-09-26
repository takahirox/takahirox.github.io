import debug from 'debug';
import fs from 'fs';
import { throttle } from 'lodash';
import request from 'request';
import { tempfile } from './temp';

debug = debug('mozilla-download/download');

export default async function download(url, options) {
  let path = await tempfile({ prefix: 'mozilla-download-' + options.os });
  debug('Will open http connection, download to', path);
  let get = request.get(url);
  let stream = fs.createWriteStream(path);
  await pipeResponseToStream(get, stream);
  return path;
}

function pipeResponseToStream(req, stream) {
  return new Promise((accept, reject) => {
    req.on('error', reject);
    stream.on('error', reject);
    req.pipe(stream);
    let ondata = throttle(() => process.stdout.write('.'), 1000);
    req.on('data', ondata);
    stream.on('finish', () => {
      req.removeListener('data', ondata);
      process.stdout.write('\n');
      accept();
    });
  });
}

import tmp from 'tmp';

/**
 * @fileoverview Thin promise wrapper around node-tmp.
 */
export function tempfile(options) {
  return wrap('file', options);
}

export function tempdir(options) {
  return wrap('dir', options);
}

function wrap(fnName, options) {
  return new Promise((accept, reject) => {
    tmp[fnName](options, (err, path) => {
      if (err) return reject(err);
      accept(path);
    });
  });
}

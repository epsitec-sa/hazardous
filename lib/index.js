'use strict';

const path  = require ('path');
const asar  = require ('asar');
const stack = require ('callsite');

let patchFs = {
  patch: () => {},
  unpatch: () => {}
};
try {
  patchFs = require ('electron-patch-fs');
} catch (ex) {}

const _path = {
  join:      path.join,
  normalize: path.normalize,
  resolve:   path.resolve
};
const hazarPath = {};

function hazardous (location) {
  /* We consider only absolute locations, then it's possible to retrieve
   * the archive. With relative location, it's impossible to know if the
   * directory must be the caller __dirname or the current directory (cwd ()).
   */
  if (!path.isAbsolute (location)) {
    return location;
  }

  const electronRegex = /[\\/]electron\.asar[\\/]/;
  if (electronRegex.test (location)) {
    return location;
  }

  const matches = /(.*\.asar)[\\/](.*)/.exec (location);
  if (!matches) {
    return location;
  }

  const archive  = matches[1];
  const fileName = matches[2];

  patchFs.patch ();
  try {
    const st = asar.statFile (archive, fileName, true);
    if (st.unpacked) {
      /* Skip monkey patching when an electron method is in the callstack. */
      const skip = stack ()
        .some ((site) => electronRegex.test (site.getFileName ()));

      return skip ? location :
        location.replace (/\.asar([\\/])/, '.asar.unpacked$1');
    }
  } catch (ex) {
  } finally {
    patchFs.unpatch ();
  }

  return location;
}

hazarPath.join = function () {
  return hazardous (_path.join.apply (this, arguments));
};

hazarPath.normalize = function () {
  return hazardous (_path.normalize.apply (this, arguments));
};

hazarPath.resolve = function () {
  return hazardous (_path.resolve.apply (this, arguments));
};

path.join      = hazarPath.join;
path.normalize = hazarPath.normalize;
path.resolve   = hazarPath.resolve;

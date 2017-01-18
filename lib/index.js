'use strict';

const fs    = require ('fs');
const path  = require ('path');
const asar  = require ('asar');
const stack = require ('callsite');

const _path = {
  join:      path.join,
  normalize: path.normalize,
  resolve:   path.resolve
};
const hazarPath = {};
const electronRegex = /[\\/]electron\.asar[\\/]/;

const _fsopen     = fs.open;
const _fsopenSync = fs.openSync;

const _cache = {};

function hazardous (location) {
  /* We consider only absolute locations, then it's possible to retrieve
   * the archive. With relative location, it's impossible to know if the
   * directory must be the caller __dirname or the current directory (cwd ()).
   */
  if (!path.isAbsolute (location)) {
    return location;
  }

  if (electronRegex.test (location)) {
    return location;
  }

  const matches = /^(?:^\\\\\?\\)?(.*\.asar)[\\/](.*)/.exec (location);
  if (!matches) {
    return location;
  }
  const archive  = matches[1];
  const fileName = matches[2];

  let unpacked = false;
  if (_cache[archive] && _cache[archive][fileName]) {
    unpacked = !!_cache[archive][fileName].unpacked;
  } else {
    try {
      const ofs = process.versions.electron ? require ('original-fs') : fs;

      fs.open     = ofs.open;
      fs.openSync = ofs.openSync;

      const st = asar.statFile (archive, fileName, true);
      unpacked = st.unpacked;
    } catch (ex) {
    } finally {
      fs.open     = _fsopen;
      fs.openSync = _fsopenSync;
    }

    if (!_cache[archive]) {
      _cache[archive] = {};
    }
    _cache[archive][fileName] = {unpacked};
  }

  if (unpacked) {
    /* Skip monkey patching when an electron method is in the callstack. */
    const skip = stack ()
      .some ((site) => electronRegex.test (site.getFileName ()));

    return skip ? location :
      location.replace (/\.asar([\\/])/, '.asar.unpacked$1');
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

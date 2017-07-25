'use strict';

const path = require ('path');
const stack = require ('callsite');

const _path = {
  join: path.join,
  normalize: path.normalize,
  resolve: path.resolve,
};
const hazarPath = {};
const electronRegex = /[\\/]electron\.asar[\\/]/;
const asarRegex = /^(?:^\\\\\?\\)?(.*\.asar)[\\/](.*)/;

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

  const matches = asarRegex.exec (location);
  if (!matches || matches.length !== 3) {
    return location;
  }
  const archive = matches[1];
  const fileName = matches[2];
  const unpackedFilePath = `${archive}.unpacked/${fileName}`;

  let unpacked = false;
  if (_cache[archive] && _cache[archive][fileName]) {
    unpacked = _cache[archive][fileName].unpacked;
  } else {
    try {
      const fs = process.versions.electron
        ? require ('original-fs')
        : require ('fs');

      unpacked = fs.existsSync (unpackedFilePath);
    } catch (ex) {
      /* ignore all exceptions */
    }

    if (!_cache[archive]) {
      _cache[archive] = {};
    }
    _cache[archive][fileName] = {unpacked};
  }

  if (unpacked) {
    /* Skip monkey patching when an electron method is in the callstack. */
    const skip = stack ().some (site => {
      const siteFile = site.getFileName ();
      return /^ELECTRON_ASAR/.test (siteFile) || electronRegex.test (siteFile);
    });

    return skip
      ? location
      : location.replace (/\.asar([\\/])/, '.asar.unpacked$1');
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

path.join = hazarPath.join;
path.normalize = hazarPath.normalize;
path.resolve = hazarPath.resolve;

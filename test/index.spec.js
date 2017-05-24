'use strict';

const path = require ('path');
const {resolve, join} = path;

require ('..');

const {expect} = require ('chai');

describe ('hazardous', function () {
  const fullPacked = resolve (
    __dirname,
    'app.asar/node_modules/packed/packed.file'
  );
  const fullUnpacked = resolve (
    __dirname,
    'app.asar.unpacked/node_modules/unpacked/unpacked.file'
  );

  it ('#join (packed)', function () {
    const res = path.join (
      __dirname,
      'app.asar/node_modules/packed/packed.file'
    );
    expect (res).to.be.equal (fullPacked);
  });

  it ('#join (unpacked)', function () {
    const res = path.join (
      __dirname,
      'app.asar/node_modules/unpacked/unpacked.file'
    );
    expect (res).to.be.equal (fullUnpacked); // .unpacked
  });

  it ('#normalize (packed)', function () {
    const res = path.normalize (
      join (__dirname, 'app.asar/../app.asar/node_modules/packed/packed.file')
    );
    expect (res).to.be.equal (fullPacked);
  });

  it ('#normalize (unpacked)', function () {
    const res = path.normalize (
      join (
        __dirname,
        'app.asar/../app.asar/node_modules/unpacked/unpacked.file'
      )
    );
    expect (res).to.be.equal (fullUnpacked); // .unpacked
  });

  it ('#resolve (packed)', function () {
    const res = path.resolve (
      join (__dirname, 'app.asar', '/node_modules/packed/packed.file')
    );
    expect (res).to.be.equal (fullPacked);
  });

  it ('#resolve (unpacked)', function () {
    const res = path.resolve (
      join (__dirname, 'app.asar', '/node_modules/unpacked/unpacked.file')
    );
    expect (res).to.be.equal (fullUnpacked); // .unpacked
  });
});

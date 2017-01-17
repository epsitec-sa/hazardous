
# Hazardous

This module overload some functions of the `path` module of Electron in
order to workaround a painful behaviour with the `asar` files.

The problem concerns the cases where an `.asar.unpacked` file must be passed
to an executable somewhere on the filesystem. This executable can not
access to the files packed in the `.asar` archive. In this case, when the
`.asar` archive is created, it's possible to specify directories to keep
unpacked.

## Example

An example will be; Perl scripts. You cannot run `.pl` script from Electron,
but you can spawn **perl** and pass the `.pl` script as argument. Imagine
that the `.pl` script is in a `node_modules` and this one is in the `.asar`
archive. When you spawn **perl**, you catch an error because **perl** cannot
access to `app.asar/node_modules/perl-module/script.pl`.

Then you try to package by this way:
```bash
asar pack app app.asar --unpack-dir "**/node_modules/perl-module/**"
```

The result looks good. You can see the `app.asar` file and the
`app.asar.unpacked` directory with the `perl-module` and the perl scripts.

But when you try to use your app, you continue to receive an error because
**perl** cannot find `script.pl`.

## What is the real purpose of `.asar.unpacked`?

It seems that it's only useful with binaries. If you have an executable in
a `node_modules`, it makes sense to use the unpack way because the `spawn`
and `exec` functions of `child_process` are aware of `.asar.unpacked`. Then
your executable can be used transparently.

## Hazardious workaround

The idea is to overload three functions of `path` (`join ()`, `normalize ()`
and `resolve ()`).

These functions are wrapped by `hazardious` in order to detect if the location
is in `.asar.unpacked` or not. If it's impossible to guess, it just return the
original responses of the real `path` functions.

Note that only absolute locations are considered by `hazardious`. With relative
locations it's impossible to know if the user wants the `__dirname` of the
caller function or the current working dir (`cwd ()`).

## How to use

```bash
npm i --save hazardious
```

Just insert (at the beginning of your main script):

```js
'use strict';

require ('hazardious');
const path = require ('path');

const script = path.join (__dirname, 'script.pl');
/* script = /home/foo/bar/app.asar.unpacked/node_modules/perl-module/script.pl */
```

The `path` functions must be used only afterb that `hazardious` has been
loaded.

if you use the previous code without `require ('hazardious')`, then the `script`
value will be:

```js
/* script = /home/foo/bar/app.asar/node_modules/perl-module/script.pl */
```

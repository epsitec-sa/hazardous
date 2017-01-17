
# Hazardous

This module overloads some functions of the `path` module of Electron in
order to workaround a painful behaviour with the `asar` files.

The problem concerns the cases where a `.asar.unpacked/*` file must be passed
to an executable somewhere on the filesystem. This executable can not
access to the files packed in the `.asar` archive. In this case, when the
`.asar` archive is created, it's possible to specify directories to keep
unpacked, but it's not sufficient.

## Example

An example will be, Perl scripts. You cannot run `.pl` scripts from Electron,
but you can spawn **perl** and pass the `.pl` script as argument. Imagine
that the `.pl` script is in a `node_modules` and this one is in the `.asar`
archive. When you spawn **perl**, you catch an error because **perl** cannot
access to `app.asar/node_modules/perl-module/script.pl`.

Then you try to package by this way:
```sh
asar pack app app.asar --unpack-dir "**/node_modules/perl-module/**"
```

The result looks good. You can see the `app.asar` file and the
`app.asar.unpacked` directory with the `perl-module` and the **perl** scripts.

But when you try to use your app, you continue to receive an error because
**perl** cannot find `script.pl`.

## What is the real purpose of `.asar.unpacked`?

It seems that it's only useful with executables. If you have an executable in
a `node_modules`, it makes sense to use the unpack way because the `spawn`
and `exec` functions of `child_process` are aware of `.asar.unpacked`. Then
your executable can be used transparently.

## Hazardous workaround

The idea is to overload three functions of `path` (`join ()`, `normalize ()`
and `resolve ()`).

These functions are wrapped by `hazardous` in order to detect if the location
is in `.asar.unpacked` or not. If it's impossible to guess, it just returns the
original responses of the real `path` functions.

Note that only absolute locations are considered by `hazardous`. With relative
locations it's impossible to know if the user wants the `__dirname` of the
caller function or the current working dir (`cwd ()`).

## How to use

```sh
npm i --save hazardous
```

Just insert (at the beginning of your main script):

```js
'use strict';

require ('hazardous');
const path = require ('path');

const script = path.join (__dirname, 'script.pl');
/* script = /home/foo/bar/app.asar.unpacked/node_modules/perl-module/script.pl */
/* -----------------------------------^                                        */
```

The `path` functions must be used only after that `hazardous` has been
loaded.

If you use the previous code without `require ('hazardous')`, then the `script`
value will be:

```js
/* script = /home/foo/bar/app.asar/node_modules/perl-module/script.pl */
/* ------------------------------^                                    */
```

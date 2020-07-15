module.exports = /******/ (function (modules, runtime) {
  // webpackBootstrap
  /******/ 'use strict'; // The module cache
  /******/ /******/ var installedModules = {}; // The require function
  /******/
  /******/ /******/ function __webpack_require__(moduleId) {
    /******/
    /******/ // Check if module is in cache
    /******/ if (installedModules[moduleId]) {
      /******/ return installedModules[moduleId].exports;
      /******/
    } // Create a new module (and put it into the cache)
    /******/ /******/ var module = (installedModules[moduleId] = {
      /******/ i: moduleId,
      /******/ l: false,
      /******/ exports: {},
      /******/
    }); // Execute the module function
    /******/
    /******/ /******/ modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    ); // Flag the module as loaded
    /******/
    /******/ /******/ module.l = true; // Return the exports of the module
    /******/
    /******/ /******/ return module.exports;
    /******/
  }
  /******/
  /******/
  /******/ __webpack_require__.ab = __dirname + '/'; // the startup function
  /******/
  /******/ /******/ function startup() {
    /******/ // Load entry module and return exports
    /******/ return __webpack_require__(553);
    /******/
  } // run startup
  /******/
  /******/ /******/ return startup();
  /******/
})(
  /************************************************************************/
  /******/ {
    /***/ 46: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const path = __webpack_require__(622);
      const fs = __webpack_require__(729);
      const mkdir = __webpack_require__(648);
      const pathExists = __webpack_require__(370).pathExists;

      function createFile(file, callback) {
        function makeFile() {
          fs.writeFile(file, '', err => {
            if (err) return callback(err);
            callback();
          });
        }

        fs.stat(file, (err, stats) => {
          // eslint-disable-line handle-callback-err
          if (!err && stats.isFile()) return callback();
          const dir = path.dirname(file);
          pathExists(dir, (err, dirExists) => {
            if (err) return callback(err);
            if (dirExists) return makeFile();
            mkdir.mkdirs(dir, err => {
              if (err) return callback(err);
              makeFile();
            });
          });
        });
      }

      function createFileSync(file) {
        let stats;
        try {
          stats = fs.statSync(file);
        } catch (e) {}
        if (stats && stats.isFile()) return;

        const dir = path.dirname(file);
        if (!fs.existsSync(dir)) {
          mkdir.mkdirsSync(dir);
        }

        fs.writeFileSync(file, '');
      }

      module.exports = {
        createFile: u(createFile),
        createFileSync,
      };

      /***/
    },

    /***/ 87: /***/ function (module) {
      module.exports = require('os');

      /***/
    },

    /***/ 101: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const path = __webpack_require__(622);
      const Module = __webpack_require__(282);
      const fs = __webpack_require__(747);

      const resolveFrom = (fromDirectory, moduleId, silent) => {
        if (typeof fromDirectory !== 'string') {
          throw new TypeError(
            `Expected \`fromDir\` to be of type \`string\`, got \`${typeof fromDirectory}\``
          );
        }

        if (typeof moduleId !== 'string') {
          throw new TypeError(
            `Expected \`moduleId\` to be of type \`string\`, got \`${typeof moduleId}\``
          );
        }

        try {
          fromDirectory = fs.realpathSync(fromDirectory);
        } catch (error) {
          if (error.code === 'ENOENT') {
            fromDirectory = path.resolve(fromDirectory);
          } else if (silent) {
            return;
          } else {
            throw error;
          }
        }

        const fromFile = path.join(fromDirectory, 'noop.js');

        const resolveFileName = () =>
          Module._resolveFilename(moduleId, {
            id: fromFile,
            filename: fromFile,
            paths: Module._nodeModulePaths(fromDirectory),
          });

        if (silent) {
          try {
            return resolveFileName();
          } catch (error) {
            return;
          }
        }

        return resolveFileName();
      };

      module.exports = (fromDirectory, moduleId) =>
        resolveFrom(fromDirectory, moduleId);
      module.exports.silent = (fromDirectory, moduleId) =>
        resolveFrom(fromDirectory, moduleId, true);

      /***/
    },

    /***/ 143: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const mkdirp = __webpack_require__(648).mkdirs;
      const pathExists = __webpack_require__(370).pathExists;
      const utimes = __webpack_require__(402).utimesMillis;

      const notExist = Symbol('notExist');

      function copy(src, dest, opts, cb) {
        if (typeof opts === 'function' && !cb) {
          cb = opts;
          opts = {};
        } else if (typeof opts === 'function') {
          opts = { filter: opts };
        }

        cb = cb || function () {};
        opts = opts || {};

        opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
        opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

        // Warn about using preserveTimestamps on 32-bit node
        if (opts.preserveTimestamps && process.arch === 'ia32') {
          console.warn(`fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n
    see https://github.com/jprichardson/node-fs-extra/issues/269`);
        }

        checkPaths(src, dest, (err, destStat) => {
          if (err) return cb(err);
          if (opts.filter)
            return handleFilter(checkParentDir, destStat, src, dest, opts, cb);
          return checkParentDir(destStat, src, dest, opts, cb);
        });
      }

      function checkParentDir(destStat, src, dest, opts, cb) {
        const destParent = path.dirname(dest);
        pathExists(destParent, (err, dirExists) => {
          if (err) return cb(err);
          if (dirExists) return startCopy(destStat, src, dest, opts, cb);
          mkdirp(destParent, err => {
            if (err) return cb(err);
            return startCopy(destStat, src, dest, opts, cb);
          });
        });
      }

      function handleFilter(onInclude, destStat, src, dest, opts, cb) {
        Promise.resolve(opts.filter(src, dest)).then(
          include => {
            if (include) {
              if (destStat) return onInclude(destStat, src, dest, opts, cb);
              return onInclude(src, dest, opts, cb);
            }
            return cb();
          },
          error => cb(error)
        );
      }

      function startCopy(destStat, src, dest, opts, cb) {
        if (opts.filter)
          return handleFilter(getStats, destStat, src, dest, opts, cb);
        return getStats(destStat, src, dest, opts, cb);
      }

      function getStats(destStat, src, dest, opts, cb) {
        const stat = opts.dereference ? fs.stat : fs.lstat;
        stat(src, (err, srcStat) => {
          if (err) return cb(err);

          if (srcStat.isDirectory())
            return onDir(srcStat, destStat, src, dest, opts, cb);
          else if (
            srcStat.isFile() ||
            srcStat.isCharacterDevice() ||
            srcStat.isBlockDevice()
          )
            return onFile(srcStat, destStat, src, dest, opts, cb);
          else if (srcStat.isSymbolicLink())
            return onLink(destStat, src, dest, opts, cb);
        });
      }

      function onFile(srcStat, destStat, src, dest, opts, cb) {
        if (destStat === notExist)
          return copyFile(srcStat, src, dest, opts, cb);
        return mayCopyFile(srcStat, src, dest, opts, cb);
      }

      function mayCopyFile(srcStat, src, dest, opts, cb) {
        if (opts.overwrite) {
          fs.unlink(dest, err => {
            if (err) return cb(err);
            return copyFile(srcStat, src, dest, opts, cb);
          });
        } else if (opts.errorOnExist) {
          return cb(new Error(`'${dest}' already exists`));
        } else return cb();
      }

      function copyFile(srcStat, src, dest, opts, cb) {
        if (typeof fs.copyFile === 'function') {
          return fs.copyFile(src, dest, err => {
            if (err) return cb(err);
            return setDestModeAndTimestamps(srcStat, dest, opts, cb);
          });
        }
        return copyFileFallback(srcStat, src, dest, opts, cb);
      }

      function copyFileFallback(srcStat, src, dest, opts, cb) {
        const rs = fs.createReadStream(src);
        rs.on('error', err => cb(err)).once('open', () => {
          const ws = fs.createWriteStream(dest, { mode: srcStat.mode });
          ws.on('error', err => cb(err))
            .on('open', () => rs.pipe(ws))
            .once('close', () =>
              setDestModeAndTimestamps(srcStat, dest, opts, cb)
            );
        });
      }

      function setDestModeAndTimestamps(srcStat, dest, opts, cb) {
        fs.chmod(dest, srcStat.mode, err => {
          if (err) return cb(err);
          if (opts.preserveTimestamps) {
            return utimes(dest, srcStat.atime, srcStat.mtime, cb);
          }
          return cb();
        });
      }

      function onDir(srcStat, destStat, src, dest, opts, cb) {
        if (destStat === notExist)
          return mkDirAndCopy(srcStat, src, dest, opts, cb);
        if (destStat && !destStat.isDirectory()) {
          return cb(
            new Error(
              `Cannot overwrite non-directory '${dest}' with directory '${src}'.`
            )
          );
        }
        return copyDir(src, dest, opts, cb);
      }

      function mkDirAndCopy(srcStat, src, dest, opts, cb) {
        fs.mkdir(dest, err => {
          if (err) return cb(err);
          copyDir(src, dest, opts, err => {
            if (err) return cb(err);
            return fs.chmod(dest, srcStat.mode, cb);
          });
        });
      }

      function copyDir(src, dest, opts, cb) {
        fs.readdir(src, (err, items) => {
          if (err) return cb(err);
          return copyDirItems(items, src, dest, opts, cb);
        });
      }

      function copyDirItems(items, src, dest, opts, cb) {
        const item = items.pop();
        if (!item) return cb();
        return copyDirItem(items, item, src, dest, opts, cb);
      }

      function copyDirItem(items, item, src, dest, opts, cb) {
        const srcItem = path.join(src, item);
        const destItem = path.join(dest, item);
        checkPaths(srcItem, destItem, (err, destStat) => {
          if (err) return cb(err);
          startCopy(destStat, srcItem, destItem, opts, err => {
            if (err) return cb(err);
            return copyDirItems(items, src, dest, opts, cb);
          });
        });
      }

      function onLink(destStat, src, dest, opts, cb) {
        fs.readlink(src, (err, resolvedSrc) => {
          if (err) return cb(err);

          if (opts.dereference) {
            resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
          }

          if (destStat === notExist) {
            return fs.symlink(resolvedSrc, dest, cb);
          } else {
            fs.readlink(dest, (err, resolvedDest) => {
              if (err) {
                // dest exists and is a regular file or directory,
                // Windows may throw UNKNOWN error. If dest already exists,
                // fs throws error anyway, so no need to guard against it here.
                if (err.code === 'EINVAL' || err.code === 'UNKNOWN')
                  return fs.symlink(resolvedSrc, dest, cb);
                return cb(err);
              }
              if (opts.dereference) {
                resolvedDest = path.resolve(process.cwd(), resolvedDest);
              }
              if (isSrcSubdir(resolvedSrc, resolvedDest)) {
                return cb(
                  new Error(
                    `Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`
                  )
                );
              }

              // do not copy if src is a subdir of dest since unlinking
              // dest in this case would result in removing src contents
              // and therefore a broken symlink would be created.
              if (
                destStat.isDirectory() &&
                isSrcSubdir(resolvedDest, resolvedSrc)
              ) {
                return cb(
                  new Error(
                    `Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`
                  )
                );
              }
              return copyLink(resolvedSrc, dest, cb);
            });
          }
        });
      }

      function copyLink(resolvedSrc, dest, cb) {
        fs.unlink(dest, err => {
          if (err) return cb(err);
          return fs.symlink(resolvedSrc, dest, cb);
        });
      }

      // return true if dest is a subdir of src, otherwise false.
      function isSrcSubdir(src, dest) {
        const srcArray = path.resolve(src).split(path.sep);
        const destArray = path.resolve(dest).split(path.sep);
        return srcArray.reduce(
          (acc, current, i) => acc && destArray[i] === current,
          true
        );
      }

      function checkStats(src, dest, cb) {
        fs.stat(src, (err, srcStat) => {
          if (err) return cb(err);
          fs.stat(dest, (err, destStat) => {
            if (err) {
              if (err.code === 'ENOENT')
                return cb(null, { srcStat, destStat: notExist });
              return cb(err);
            }
            return cb(null, { srcStat, destStat });
          });
        });
      }

      function checkPaths(src, dest, cb) {
        checkStats(src, dest, (err, stats) => {
          if (err) return cb(err);
          const { srcStat, destStat } = stats;
          if (destStat.ino && destStat.ino === srcStat.ino) {
            return cb(
              new Error('Source and destination must not be the same.')
            );
          }
          if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
            return cb(
              new Error(
                `Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`
              )
            );
          }
          return cb(null, destStat);
        });
      }

      module.exports = copy;

      /***/
    },

    /***/ 161: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      module.exports = {
        copySync: __webpack_require__(968),
      };

      /***/
    },

    /***/ 171: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const invalidWin32Path = __webpack_require__(868).invalidWin32Path;

      const o777 = parseInt('0777', 8);

      function mkdirs(p, opts, callback, made) {
        if (typeof opts === 'function') {
          callback = opts;
          opts = {};
        } else if (!opts || typeof opts !== 'object') {
          opts = { mode: opts };
        }

        if (process.platform === 'win32' && invalidWin32Path(p)) {
          const errInval = new Error(
            p + ' contains invalid WIN32 path characters.'
          );
          errInval.code = 'EINVAL';
          return callback(errInval);
        }

        let mode = opts.mode;
        const xfs = opts.fs || fs;

        if (mode === undefined) {
          mode = o777 & ~process.umask();
        }
        if (!made) made = null;

        callback = callback || function () {};
        p = path.resolve(p);

        xfs.mkdir(p, mode, er => {
          if (!er) {
            made = made || p;
            return callback(null, made);
          }
          switch (er.code) {
            case 'ENOENT':
              if (path.dirname(p) === p) return callback(er);
              mkdirs(path.dirname(p), opts, (er, made) => {
                if (er) callback(er, made);
                else mkdirs(p, opts, callback, made);
              });
              break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
              xfs.stat(p, (er2, stat) => {
                // if the stat fails, then that's super weird.
                // let the original error be the failure reason.
                if (er2 || !stat.isDirectory()) callback(er, made);
                else callback(null, made);
              });
              break;
          }
        });
      }

      module.exports = mkdirs;

      /***/
    },

    /***/ 180: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const assert = __webpack_require__(357);

      const isWindows = process.platform === 'win32';

      function defaults(options) {
        const methods = [
          'unlink',
          'chmod',
          'stat',
          'lstat',
          'rmdir',
          'readdir',
        ];
        methods.forEach(m => {
          options[m] = options[m] || fs[m];
          m = m + 'Sync';
          options[m] = options[m] || fs[m];
        });

        options.maxBusyTries = options.maxBusyTries || 3;
      }

      function rimraf(p, options, cb) {
        let busyTries = 0;

        if (typeof options === 'function') {
          cb = options;
          options = {};
        }

        assert(p, 'rimraf: missing path');
        assert.strictEqual(
          typeof p,
          'string',
          'rimraf: path should be a string'
        );
        assert.strictEqual(
          typeof cb,
          'function',
          'rimraf: callback function required'
        );
        assert(options, 'rimraf: invalid options argument provided');
        assert.strictEqual(
          typeof options,
          'object',
          'rimraf: options should be object'
        );

        defaults(options);

        rimraf_(p, options, function CB(er) {
          if (er) {
            if (
              (er.code === 'EBUSY' ||
                er.code === 'ENOTEMPTY' ||
                er.code === 'EPERM') &&
              busyTries < options.maxBusyTries
            ) {
              busyTries++;
              const time = busyTries * 100;
              // try again, with the same exact callback as this one.
              return setTimeout(() => rimraf_(p, options, CB), time);
            }

            // already gone
            if (er.code === 'ENOENT') er = null;
          }

          cb(er);
        });
      }

      // Two possible strategies.
      // 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
      // 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
      //
      // Both result in an extra syscall when you guess wrong.  However, there
      // are likely far more normal files in the world than directories.  This
      // is based on the assumption that a the average number of files per
      // directory is >= 1.
      //
      // If anyone ever complains about this, then I guess the strategy could
      // be made configurable somehow.  But until then, YAGNI.
      function rimraf_(p, options, cb) {
        assert(p);
        assert(options);
        assert(typeof cb === 'function');

        // sunos lets the root user unlink directories, which is... weird.
        // so we have to lstat here and make sure it's not a dir.
        options.lstat(p, (er, st) => {
          if (er && er.code === 'ENOENT') {
            return cb(null);
          }

          // Windows can EPERM on stat.  Life is suffering.
          if (er && er.code === 'EPERM' && isWindows) {
            return fixWinEPERM(p, options, er, cb);
          }

          if (st && st.isDirectory()) {
            return rmdir(p, options, er, cb);
          }

          options.unlink(p, er => {
            if (er) {
              if (er.code === 'ENOENT') {
                return cb(null);
              }
              if (er.code === 'EPERM') {
                return isWindows
                  ? fixWinEPERM(p, options, er, cb)
                  : rmdir(p, options, er, cb);
              }
              if (er.code === 'EISDIR') {
                return rmdir(p, options, er, cb);
              }
            }
            return cb(er);
          });
        });
      }

      function fixWinEPERM(p, options, er, cb) {
        assert(p);
        assert(options);
        assert(typeof cb === 'function');
        if (er) {
          assert(er instanceof Error);
        }

        options.chmod(p, 0o666, er2 => {
          if (er2) {
            cb(er2.code === 'ENOENT' ? null : er);
          } else {
            options.stat(p, (er3, stats) => {
              if (er3) {
                cb(er3.code === 'ENOENT' ? null : er);
              } else if (stats.isDirectory()) {
                rmdir(p, options, er, cb);
              } else {
                options.unlink(p, cb);
              }
            });
          }
        });
      }

      function fixWinEPERMSync(p, options, er) {
        let stats;

        assert(p);
        assert(options);
        if (er) {
          assert(er instanceof Error);
        }

        try {
          options.chmodSync(p, 0o666);
        } catch (er2) {
          if (er2.code === 'ENOENT') {
            return;
          } else {
            throw er;
          }
        }

        try {
          stats = options.statSync(p);
        } catch (er3) {
          if (er3.code === 'ENOENT') {
            return;
          } else {
            throw er;
          }
        }

        if (stats.isDirectory()) {
          rmdirSync(p, options, er);
        } else {
          options.unlinkSync(p);
        }
      }

      function rmdir(p, options, originalEr, cb) {
        assert(p);
        assert(options);
        if (originalEr) {
          assert(originalEr instanceof Error);
        }
        assert(typeof cb === 'function');

        // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
        // if we guessed wrong, and it's not a directory, then
        // raise the original error.
        options.rmdir(p, er => {
          if (
            er &&
            (er.code === 'ENOTEMPTY' ||
              er.code === 'EEXIST' ||
              er.code === 'EPERM')
          ) {
            rmkids(p, options, cb);
          } else if (er && er.code === 'ENOTDIR') {
            cb(originalEr);
          } else {
            cb(er);
          }
        });
      }

      function rmkids(p, options, cb) {
        assert(p);
        assert(options);
        assert(typeof cb === 'function');

        options.readdir(p, (er, files) => {
          if (er) return cb(er);

          let n = files.length;
          let errState;

          if (n === 0) return options.rmdir(p, cb);

          files.forEach(f => {
            rimraf(path.join(p, f), options, er => {
              if (errState) {
                return;
              }
              if (er) return cb((errState = er));
              if (--n === 0) {
                options.rmdir(p, cb);
              }
            });
          });
        });
      }

      // this looks simpler, and is strictly *faster*, but will
      // tie up the JavaScript thread and fail on excessively
      // deep directory trees.
      function rimrafSync(p, options) {
        let st;

        options = options || {};
        defaults(options);

        assert(p, 'rimraf: missing path');
        assert.strictEqual(
          typeof p,
          'string',
          'rimraf: path should be a string'
        );
        assert(options, 'rimraf: missing options');
        assert.strictEqual(
          typeof options,
          'object',
          'rimraf: options should be object'
        );

        try {
          st = options.lstatSync(p);
        } catch (er) {
          if (er.code === 'ENOENT') {
            return;
          }

          // Windows can EPERM on stat.  Life is suffering.
          if (er.code === 'EPERM' && isWindows) {
            fixWinEPERMSync(p, options, er);
          }
        }

        try {
          // sunos lets the root user unlink directories, which is... weird.
          if (st && st.isDirectory()) {
            rmdirSync(p, options, null);
          } else {
            options.unlinkSync(p);
          }
        } catch (er) {
          if (er.code === 'ENOENT') {
            return;
          } else if (er.code === 'EPERM') {
            return isWindows
              ? fixWinEPERMSync(p, options, er)
              : rmdirSync(p, options, er);
          } else if (er.code !== 'EISDIR') {
            throw er;
          }
          rmdirSync(p, options, er);
        }
      }

      function rmdirSync(p, options, originalEr) {
        assert(p);
        assert(options);
        if (originalEr) {
          assert(originalEr instanceof Error);
        }

        try {
          options.rmdirSync(p);
        } catch (er) {
          if (er.code === 'ENOTDIR') {
            throw originalEr;
          } else if (
            er.code === 'ENOTEMPTY' ||
            er.code === 'EEXIST' ||
            er.code === 'EPERM'
          ) {
            rmkidsSync(p, options);
          } else if (er.code !== 'ENOENT') {
            throw er;
          }
        }
      }

      function rmkidsSync(p, options) {
        assert(p);
        assert(options);
        options
          .readdirSync(p)
          .forEach(f => rimrafSync(path.join(p, f), options));

        // We only end up here once we got ENOTEMPTY at least once, and
        // at this point, we are guaranteed to have removed all the kids.
        // So, we know that it won't be ENOENT or ENOTDIR or anything else.
        // try really hard to delete stuff on windows, because it has a
        // PROFOUNDLY annoying habit of not closing handles promptly when
        // files are deleted, resulting in spurious ENOTEMPTY errors.
        const retries = isWindows ? 100 : 1;
        let i = 0;
        do {
          let threw = true;
          try {
            const ret = options.rmdirSync(p, options);
            threw = false;
            return ret;
          } finally {
            if (++i < retries && threw) continue; // eslint-disable-line
          }
        } while (true);
      }

      module.exports = rimraf;
      rimraf.sync = rimrafSync;

      /***/
    },

    /***/ 192: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const copy = __webpack_require__(758).copy;
      const remove = __webpack_require__(301).remove;
      const mkdirp = __webpack_require__(648).mkdirp;
      const pathExists = __webpack_require__(370).pathExists;

      function move(src, dest, opts, cb) {
        if (typeof opts === 'function') {
          cb = opts;
          opts = {};
        }

        const overwrite = opts.overwrite || opts.clobber || false;

        src = path.resolve(src);
        dest = path.resolve(dest);

        if (src === dest) return fs.access(src, cb);

        fs.stat(src, (err, st) => {
          if (err) return cb(err);

          if (st.isDirectory() && isSrcSubdir(src, dest)) {
            return cb(
              new Error(
                `Cannot move '${src}' to a subdirectory of itself, '${dest}'.`
              )
            );
          }
          mkdirp(path.dirname(dest), err => {
            if (err) return cb(err);
            return doRename(src, dest, overwrite, cb);
          });
        });
      }

      function doRename(src, dest, overwrite, cb) {
        if (overwrite) {
          return remove(dest, err => {
            if (err) return cb(err);
            return rename(src, dest, overwrite, cb);
          });
        }
        pathExists(dest, (err, destExists) => {
          if (err) return cb(err);
          if (destExists) return cb(new Error('dest already exists.'));
          return rename(src, dest, overwrite, cb);
        });
      }

      function rename(src, dest, overwrite, cb) {
        fs.rename(src, dest, err => {
          if (!err) return cb();
          if (err.code !== 'EXDEV') return cb(err);
          return moveAcrossDevice(src, dest, overwrite, cb);
        });
      }

      function moveAcrossDevice(src, dest, overwrite, cb) {
        const opts = {
          overwrite,
          errorOnExist: true,
        };

        copy(src, dest, opts, err => {
          if (err) return cb(err);
          return remove(src, cb);
        });
      }

      function isSrcSubdir(src, dest) {
        const srcArray = src.split(path.sep);
        const destArray = dest.split(path.sep);

        return srcArray.reduce((acc, current, i) => {
          return acc && destArray[i] === current;
        }, true);
      }

      module.exports = {
        move: u(move),
      };

      /***/
    },

    /***/ 239: /***/ function (__unusedmodule, exports, __webpack_require__) {
      'use strict';

      var __importDefault =
        (this && this.__importDefault) ||
        function (mod) {
          return mod && mod.__esModule ? mod : { default: mod };
        };
      Object.defineProperty(exports, '__esModule', { value: true });
      exports.getSourceFilePathFromPage = exports.isDynamicRoute = exports.normalizePage = exports.syncEnvVars = exports.getRoutes = exports.getPathsInside = exports.getNextConfig = exports.normalizePackageJson = exports.excludeLockFiles = exports.validateEntrypoint = exports.excludeFiles = exports.getPrerenderManifest = exports.getExportStatus = exports.getExportIntent = exports.createLambdaFromPseudoLayers = exports.createPseudoLayer = exports.ExperimentalTraceVersion = exports.getDynamicRoutes = exports.getRoutesManifest = void 0;
      const zlib_1 = __importDefault(__webpack_require__(761));
      const path_1 = __importDefault(__webpack_require__(622));
      const fs_extra_1 = __importDefault(__webpack_require__(410));
      const semver_1 = __importDefault(__webpack_require__(391));
      const yazl_1 = __webpack_require__(487);
      const buffer_crc32_1 = __importDefault(__webpack_require__(802));
      const async_sema_1 = __webpack_require__(624);
      const resolve_from_1 = __importDefault(__webpack_require__(101));
      const build_utils_1 = __importDefault(__webpack_require__(608));
      const {
        streamToBuffer,
        Lambda,
        NowBuildError,
        isSymbolicLink,
      } = build_utils_1.default;
      // Identify /[param]/ in route string
      // eslint-disable-next-line no-useless-escape
      const TEST_DYNAMIC_ROUTE = /\/\[[^\/]+?\](?=\/|$)/;
      function isDynamicRoute(route) {
        route = route.startsWith('/') ? route : `/${route}`;
        return TEST_DYNAMIC_ROUTE.test(route);
      }
      exports.isDynamicRoute = isDynamicRoute;
      /**
       * Validate if the entrypoint is allowed to be used
       */
      function validateEntrypoint(entrypoint) {
        if (
          !/package\.json$/.exec(entrypoint) &&
          !/next\.config\.js$/.exec(entrypoint)
        ) {
          throw new NowBuildError({
            message:
              'Specified "src" for "@vercel/next" has to be "package.json" or "next.config.js"',
            code: 'NEXT_INCORRECT_SRC',
          });
        }
      }
      exports.validateEntrypoint = validateEntrypoint;
      /**
       * Exclude certain files from the files object
       */
      function excludeFiles(files, matcher) {
        return Object.keys(files).reduce((newFiles, filePath) => {
          if (matcher(filePath)) {
            return newFiles;
          }
          return {
            ...newFiles,
            [filePath]: files[filePath],
          };
        }, {});
      }
      exports.excludeFiles = excludeFiles;
      /**
       * Exclude package manager lockfiles from files
       */
      function excludeLockFiles(files) {
        const newFiles = files;
        if (newFiles['package-lock.json']) {
          delete newFiles['package-lock.json'];
        }
        if (newFiles['yarn.lock']) {
          delete newFiles['yarn.lock'];
        }
        return files;
      }
      exports.excludeLockFiles = excludeLockFiles;
      /**
       * Enforce specific package.json configuration for smallest possible lambda
       */
      function normalizePackageJson(defaultPackageJson = {}) {
        const dependencies = {};
        const devDependencies = {
          ...defaultPackageJson.dependencies,
          ...defaultPackageJson.devDependencies,
        };
        if (devDependencies.react) {
          dependencies.react = devDependencies.react;
          delete devDependencies.react;
        }
        if (devDependencies['react-dom']) {
          dependencies['react-dom'] = devDependencies['react-dom'];
          delete devDependencies['react-dom'];
        }
        delete devDependencies['next-server'];
        return {
          ...defaultPackageJson,
          dependencies: {
            // react and react-dom can be overwritten
            react: 'latest',
            'react-dom': 'latest',
            ...dependencies,
            // next-server is forced to canary
            'next-server': 'v7.0.2-canary.49',
          },
          devDependencies: {
            ...devDependencies,
            // next is forced to canary
            next: 'v7.0.2-canary.49',
          },
          scripts: {
            ...defaultPackageJson.scripts,
            'now-build':
              'NODE_OPTIONS=--max_old_space_size=3000 next build --lambdas',
          },
        };
      }
      exports.normalizePackageJson = normalizePackageJson;
      async function getNextConfig(workPath, entryPath) {
        const entryConfig = path_1.default.join(entryPath, './next.config.js');
        if (await fs_extra_1.default.pathExists(entryConfig)) {
          return fs_extra_1.default.readFile(entryConfig, 'utf8');
        }
        const workConfig = path_1.default.join(workPath, './next.config.js');
        if (await fs_extra_1.default.pathExists(workConfig)) {
          return fs_extra_1.default.readFile(workConfig, 'utf8');
        }
        return null;
      }
      exports.getNextConfig = getNextConfig;
      function pathIsInside(firstPath, secondPath) {
        return !path_1.default.relative(firstPath, secondPath).startsWith('..');
      }
      function getPathsInside(entryDirectory, files) {
        const watch = [];
        for (const file of Object.keys(files)) {
          // If the file is outside of the entrypoint directory, we do
          // not want to monitor it for changes.
          if (!pathIsInside(entryDirectory, file)) {
            continue;
          }
          watch.push(file);
        }
        return watch;
      }
      exports.getPathsInside = getPathsInside;
      function normalizePage(page) {
        // Resolve on anything that doesn't start with `/`
        if (!page.startsWith('/')) {
          page = `/${page}`;
        }
        // remove '/index' from the end
        page = page.replace(/\/index$/, '/');
        return page;
      }
      exports.normalizePage = normalizePage;
      async function getRoutes(
        entryPath,
        entryDirectory,
        pathsInside,
        files,
        url
      ) {
        let pagesDir = '';
        const filesInside = {};
        const prefix = entryDirectory === `.` ? `/` : `/${entryDirectory}/`;
        const fileKeys = Object.keys(files);
        for (const file of fileKeys) {
          if (!pathsInside.includes(file)) {
            continue;
          }
          if (!pagesDir) {
            if (file.startsWith(path_1.default.join(entryDirectory, 'pages'))) {
              pagesDir = 'pages';
            }
          }
          filesInside[file] = files[file];
        }
        // If default pages dir isn't found check for `src/pages`
        if (
          !pagesDir &&
          fileKeys.some(file =>
            file.startsWith(path_1.default.join(entryDirectory, 'src/pages'))
          )
        ) {
          pagesDir = 'src/pages';
        }
        const routes = [
          {
            src: `${prefix}_next/(.*)`,
            dest: `${url}/_next/$1`,
          },
          {
            src: `${prefix}static/(.*)`,
            dest: `${url}/static/$1`,
          },
        ];
        const filePaths = Object.keys(filesInside);
        const dynamicPages = [];
        for (const file of filePaths) {
          const relativePath = path_1.default.relative(entryDirectory, file);
          const isPage = pathIsInside(pagesDir, relativePath);
          if (!isPage) {
            continue;
          }
          const relativeToPages = path_1.default.relative(
            pagesDir,
            relativePath
          );
          const extension = path_1.default.extname(relativeToPages);
          const pageName = relativeToPages
            .replace(extension, '')
            .replace(/\\/g, '/');
          if (pageName.startsWith('_')) {
            continue;
          }
          if (isDynamicRoute(pageName)) {
            dynamicPages.push(normalizePage(pageName));
            continue;
          }
          routes.push({
            src: `${prefix}${pageName}`,
            dest: `${url}/${pageName}`,
          });
          if (pageName.endsWith('index')) {
            const resolvedIndex = pageName
              .replace('/index', '')
              .replace('index', '');
            routes.push({
              src: `${prefix}${resolvedIndex}`,
              dest: `${url}/${resolvedIndex}`,
            });
          }
        }
        routes.push(
          ...(await getDynamicRoutes(
            entryPath,
            entryDirectory,
            dynamicPages,
            true
          ).then(arr =>
            arr.map(route => {
              // convert to make entire RegExp match as one group
              route.src = route.src
                .replace('^', `^${prefix}(`)
                .replace('(\\/', '(')
                .replace('$', ')$');
              route.dest = `${url}/$1`;
              return route;
            })
          ))
        );
        // Add public folder routes
        for (const file of filePaths) {
          const relativePath = path_1.default.relative(entryDirectory, file);
          const isPublic = pathIsInside('public', relativePath);
          if (!isPublic) continue;
          const fileName = path_1.default.relative('public', relativePath);
          const route = {
            src: `${prefix}${fileName}`,
            dest: `${url}/${fileName}`,
          };
          // Only add the route if a page is not already using it
          if (!routes.some(r => r.src === route.src)) {
            routes.push(route);
          }
        }
        return routes;
      }
      exports.getRoutes = getRoutes;
      async function getRoutesManifest(
        entryPath,
        outputDirectory,
        nextVersion
      ) {
        const shouldHaveManifest =
          nextVersion && semver_1.default.gte(nextVersion, '9.1.4-canary.0');
        if (!shouldHaveManifest) return;
        const pathRoutesManifest = path_1.default.join(
          entryPath,
          outputDirectory,
          'routes-manifest.json'
        );
        const hasRoutesManifest = await fs_extra_1.default
          .access(pathRoutesManifest)
          .then(() => true)
          .catch(() => false);
        if (shouldHaveManifest && !hasRoutesManifest) {
          throw new NowBuildError({
            message:
              `A "routes-manifest.json" couldn't be found. This is normally caused by a misconfiguration in your project.\n` +
              'Please check the following, and reach out to support if you cannot resolve the problem:\n' +
              '  1. If present, be sure your `build` script in "package.json" calls `next build`.' +
              '  2. Navigate to your project\'s settings in the Vercel dashboard, and verify that the "Build Command" is not overridden, or that it calls `next build`.' +
              '  3. Navigate to your project\'s settings in the Vercel dashboard, and verify that the "Output Directory" is not overridden. Note that `next export` does **not** require you change this setting, even if you customize the `next export` output directory.',
            link: 'https://err.sh/vercel/vercel/now-next-routes-manifest',
            code: 'NEXT_NO_ROUTES_MANIFEST',
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const routesManifest = require(pathRoutesManifest);
        // remove temporary array based routeKeys from v1/v2 of routes
        // manifest since it can result in invalid routes
        for (const route of routesManifest.dataRoutes || []) {
          if (Array.isArray(route.routeKeys)) {
            delete route.routeKeys;
            delete route.namedDataRouteRegex;
          }
        }
        for (const route of routesManifest.dynamicRoutes || []) {
          if (Array.isArray(route.routeKeys)) {
            delete route.routeKeys;
            delete route.namedRegex;
          }
        }
        return routesManifest;
      }
      exports.getRoutesManifest = getRoutesManifest;
      async function getDynamicRoutes(
        entryPath,
        entryDirectory,
        dynamicPages,
        isDev,
        routesManifest,
        omittedRoutes
      ) {
        if (!dynamicPages.length) {
          return [];
        }
        if (routesManifest) {
          switch (routesManifest.version) {
            case 1:
            case 2: {
              return routesManifest.dynamicRoutes
                .filter(({ page }) =>
                  omittedRoutes ? !omittedRoutes.has(page) : true
                )
                .map(({ page, regex }) => {
                  return {
                    src: regex,
                    dest: !isDev
                      ? path_1.default.join('/', entryDirectory, page)
                      : page,
                    check: true,
                  };
                });
            }
            case 3: {
              return routesManifest.dynamicRoutes
                .filter(({ page }) =>
                  omittedRoutes ? !omittedRoutes.has(page) : true
                )
                .map(({ page, namedRegex, regex, routeKeys }) => {
                  return {
                    src: namedRegex || regex,
                    dest: `${
                      !isDev
                        ? path_1.default.join('/', entryDirectory, page)
                        : page
                    }${
                      routeKeys
                        ? `?${Object.keys(routeKeys)
                            .map(key => `${routeKeys[key]}=$${key}`)
                            .join('&')}`
                        : ''
                    }`,
                    check: true,
                  };
                });
            }
            default: {
              // update MIN_ROUTES_MANIFEST_VERSION
              throw new NowBuildError({
                message:
                  'This version of `@vercel/next` does not support the version of Next.js you are trying to deploy.\n' +
                  'Please upgrade your `@vercel/next` builder and try again. Contact support if this continues to happen.',
                code: 'NEXT_VERSION_UPGRADE',
              });
            }
          }
        }
        // FALLBACK:
        // When `routes-manifest.json` does not exist (old Next.js versions), we'll try to
        // require the methods we need from Next.js' internals.
        let getRouteRegex = undefined;
        let getSortedRoutes;
        try {
          ({ getRouteRegex, getSortedRoutes } = require(resolve_from_1.default(
            entryPath,
            'next-server/dist/lib/router/utils'
          )));
          if (typeof getRouteRegex !== 'function') {
            getRouteRegex = undefined;
          }
        } catch (_) {} // eslint-disable-line no-empty
        if (!getRouteRegex || !getSortedRoutes) {
          try {
            ({
              getRouteRegex,
              getSortedRoutes,
            } = require(resolve_from_1.default(
              entryPath,
              'next/dist/next-server/lib/router/utils'
            )));
            if (typeof getRouteRegex !== 'function') {
              getRouteRegex = undefined;
            }
          } catch (_) {} // eslint-disable-line no-empty
        }
        if (!getRouteRegex || !getSortedRoutes) {
          throw new NowBuildError({
            message:
              'Found usage of dynamic routes but not on a new enough version of Next.js.',
            code: 'NEXT_DYNAMIC_ROUTES_OUTDATED',
          });
        }
        const pageMatchers = getSortedRoutes(dynamicPages).map(pageName => ({
          pageName,
          matcher: getRouteRegex && getRouteRegex(pageName).re,
        }));
        const routes = [];
        pageMatchers.forEach(pageMatcher => {
          // in `vercel dev` we don't need to prefix the destination
          const dest = !isDev
            ? path_1.default.join('/', entryDirectory, pageMatcher.pageName)
            : pageMatcher.pageName;
          if (pageMatcher && pageMatcher.matcher) {
            routes.push({
              src: pageMatcher.matcher.source,
              dest,
              check: !isDev,
            });
          }
        });
        return routes;
      }
      exports.getDynamicRoutes = getDynamicRoutes;
      function syncEnvVars(base, removeEnv, addEnv) {
        // Remove any env vars from `removeEnv`
        // that are not present in the `addEnv`
        const addKeys = new Set(Object.keys(addEnv));
        for (const name of Object.keys(removeEnv)) {
          if (!addKeys.has(name)) {
            delete base[name];
          }
        }
        // Add in the keys from `addEnv`
        Object.assign(base, addEnv);
      }
      exports.syncEnvVars = syncEnvVars;
      exports.ExperimentalTraceVersion = `9.0.4-canary.1`;
      const compressBuffer = buf => {
        return new Promise((resolve, reject) => {
          zlib_1.default.deflateRaw(
            buf,
            { level: zlib_1.default.constants.Z_BEST_COMPRESSION },
            (err, compBuf) => {
              if (err) return reject(err);
              resolve(compBuf);
            }
          );
        });
      };
      async function createPseudoLayer(files) {
        const pseudoLayer = {};
        let pseudoLayerBytes = 0;
        for (const fileName of Object.keys(files)) {
          const file = files[fileName];
          if (isSymbolicLink(file.mode)) {
            const symlinkTarget = await fs_extra_1.default.readlink(
              file.fsPath
            );
            pseudoLayer[fileName] = {
              file,
              isSymlink: true,
              symlinkTarget,
            };
          } else {
            const origBuffer = await streamToBuffer(file.toStream());
            const compBuffer = await compressBuffer(origBuffer);
            pseudoLayerBytes += compBuffer.byteLength;
            pseudoLayer[fileName] = {
              compBuffer,
              isSymlink: false,
              crc32: buffer_crc32_1.default.unsigned(origBuffer),
              uncompressedSize: origBuffer.byteLength,
              mode: file.mode,
            };
          }
        }
        return { pseudoLayer, pseudoLayerBytes };
      }
      exports.createPseudoLayer = createPseudoLayer;
      // measured with 1, 2, 5, 10, and `os.cpus().length || 5`
      // and sema(1) produced the best results
      const createLambdaSema = new async_sema_1.Sema(1);
      async function createLambdaFromPseudoLayers({
        files,
        layers,
        handler,
        runtime,
        memory,
        maxDuration,
        environment = {},
      }) {
        await createLambdaSema.acquire();
        const zipFile = new yazl_1.ZipFile();
        const addedFiles = new Set();
        const names = Object.keys(files).sort();
        const symlinkTargets = new Map();
        for (const name of names) {
          const file = files[name];
          if (
            file.mode &&
            isSymbolicLink(file.mode) &&
            file.type === 'FileFsRef'
          ) {
            const symlinkTarget = await fs_extra_1.default.readlink(
              file.fsPath
            );
            symlinkTargets.set(name, symlinkTarget);
          }
        }
        // apply pseudo layers (already compressed objects)
        for (const layer of layers) {
          for (const seedKey of Object.keys(layer)) {
            const item = layer[seedKey];
            if (item.isSymlink) {
              const { symlinkTarget, file } = item;
              zipFile.addBuffer(Buffer.from(symlinkTarget, 'utf8'), seedKey, {
                mode: file.mode,
              });
              continue;
            }
            const { compBuffer, crc32, uncompressedSize, mode } = item;
            // @ts-ignore: `addDeflatedBuffer` is a valid function, but missing on the type
            zipFile.addDeflatedBuffer(compBuffer, seedKey, {
              crc32,
              uncompressedSize,
              mode: mode,
            });
            addedFiles.add(seedKey);
          }
        }
        for (const fileName of Object.keys(files)) {
          // was already added in a pseudo layer
          if (addedFiles.has(fileName)) continue;
          const file = files[fileName];
          const symlinkTarget = symlinkTargets.get(fileName);
          if (typeof symlinkTarget === 'string') {
            zipFile.addBuffer(Buffer.from(symlinkTarget, 'utf8'), fileName, {
              mode: file.mode,
            });
          } else {
            const fileBuffer = await streamToBuffer(file.toStream());
            zipFile.addBuffer(fileBuffer, fileName);
          }
        }
        zipFile.end();
        const zipBuffer = await streamToBuffer(zipFile.outputStream);
        createLambdaSema.release();
        return new Lambda({
          handler,
          runtime,
          zipBuffer,
          memory,
          maxDuration,
          environment,
        });
      }
      exports.createLambdaFromPseudoLayers = createLambdaFromPseudoLayers;
      async function getExportIntent(entryPath) {
        const pathExportMarker = path_1.default.join(
          entryPath,
          '.next',
          'export-marker.json'
        );
        const hasExportMarker = await fs_extra_1.default
          .access(pathExportMarker, fs_extra_1.default.constants.F_OK)
          .then(() => true)
          .catch(() => false);
        if (!hasExportMarker) {
          return false;
        }
        const manifest = JSON.parse(
          await fs_extra_1.default.readFile(pathExportMarker, 'utf8')
        );
        switch (manifest.version) {
          case 1: {
            if (manifest.hasExportPathMap !== true) {
              return false;
            }
            return { trailingSlash: manifest.exportTrailingSlash };
          }
          default: {
            return false;
          }
        }
      }
      exports.getExportIntent = getExportIntent;
      async function getExportStatus(entryPath) {
        const pathExportDetail = path_1.default.join(
          entryPath,
          '.next',
          'export-detail.json'
        );
        const hasExportDetail = await fs_extra_1.default
          .access(pathExportDetail, fs_extra_1.default.constants.F_OK)
          .then(() => true)
          .catch(() => false);
        if (!hasExportDetail) {
          return false;
        }
        const manifest = JSON.parse(
          await fs_extra_1.default.readFile(pathExportDetail, 'utf8')
        );
        switch (manifest.version) {
          case 1: {
            return {
              success: !!manifest.success,
              outDirectory: manifest.outDirectory,
            };
          }
          default: {
            return false;
          }
        }
      }
      exports.getExportStatus = getExportStatus;
      async function getPrerenderManifest(entryPath) {
        const pathPrerenderManifest = path_1.default.join(
          entryPath,
          '.next',
          'prerender-manifest.json'
        );
        const hasManifest = await fs_extra_1.default
          .access(pathPrerenderManifest, fs_extra_1.default.constants.F_OK)
          .then(() => true)
          .catch(() => false);
        if (!hasManifest) {
          return {
            staticRoutes: {},
            legacyBlockingRoutes: {},
            fallbackRoutes: {},
            bypassToken: null,
            omittedRoutes: [],
          };
        }
        const manifest = JSON.parse(
          await fs_extra_1.default.readFile(pathPrerenderManifest, 'utf8')
        );
        switch (manifest.version) {
          case 1: {
            const routes = Object.keys(manifest.routes);
            const lazyRoutes = Object.keys(manifest.dynamicRoutes);
            const ret = {
              staticRoutes: {},
              legacyBlockingRoutes: {},
              fallbackRoutes: {},
              bypassToken:
                (manifest.preview && manifest.preview.previewModeId) || null,
              omittedRoutes: [],
            };
            routes.forEach(route => {
              const {
                initialRevalidateSeconds,
                dataRoute,
                srcRoute,
              } = manifest.routes[route];
              ret.staticRoutes[route] = {
                initialRevalidate:
                  initialRevalidateSeconds === false
                    ? false
                    : Math.max(1, initialRevalidateSeconds),
                dataRoute,
                srcRoute,
              };
            });
            lazyRoutes.forEach(lazyRoute => {
              const {
                routeRegex,
                fallback,
                dataRoute,
                dataRouteRegex,
              } = manifest.dynamicRoutes[lazyRoute];
              if (fallback) {
                ret.fallbackRoutes[lazyRoute] = {
                  routeRegex,
                  fallback,
                  dataRoute,
                  dataRouteRegex,
                };
              } else {
                ret.legacyBlockingRoutes[lazyRoute] = {
                  routeRegex,
                  dataRoute,
                  dataRouteRegex,
                };
              }
            });
            return ret;
          }
          case 2: {
            const routes = Object.keys(manifest.routes);
            const lazyRoutes = Object.keys(manifest.dynamicRoutes);
            const ret = {
              staticRoutes: {},
              legacyBlockingRoutes: {},
              fallbackRoutes: {},
              bypassToken: manifest.preview.previewModeId,
              omittedRoutes: [],
            };
            routes.forEach(route => {
              const {
                initialRevalidateSeconds,
                dataRoute,
                srcRoute,
              } = manifest.routes[route];
              ret.staticRoutes[route] = {
                initialRevalidate:
                  initialRevalidateSeconds === false
                    ? false
                    : Math.max(1, initialRevalidateSeconds),
                dataRoute,
                srcRoute,
              };
            });
            lazyRoutes.forEach(lazyRoute => {
              const {
                routeRegex,
                fallback,
                dataRoute,
                dataRouteRegex,
              } = manifest.dynamicRoutes[lazyRoute];
              if (!fallback) {
                // Fallback behavior is disabled, all routes would've been provided
                // in the top-level `routes` key (`staticRoutes`).
                ret.omittedRoutes.push(lazyRoute);
                return;
              }
              ret.fallbackRoutes[lazyRoute] = {
                routeRegex,
                fallback,
                dataRoute,
                dataRouteRegex,
              };
            });
            return ret;
          }
          default: {
            return {
              staticRoutes: {},
              legacyBlockingRoutes: {},
              fallbackRoutes: {},
              bypassToken: null,
              omittedRoutes: [],
            };
          }
        }
      }
      exports.getPrerenderManifest = getPrerenderManifest;
      // We only need this once per build
      let _usesSrcCache;
      async function usesSrcDirectory(workPath) {
        if (!_usesSrcCache) {
          const source = path_1.default.join(workPath, 'src', 'pages');
          try {
            if ((await fs_extra_1.default.stat(source)).isDirectory()) {
              _usesSrcCache = true;
            }
          } catch (_err) {
            _usesSrcCache = false;
          }
        }
        return Boolean(_usesSrcCache);
      }
      async function getSourceFilePathFromPage({ workPath, page }) {
        if (await usesSrcDirectory(workPath)) {
          return path_1.default.join('src', 'pages', page);
        }
        return path_1.default.join('pages', page);
      }
      exports.getSourceFilePathFromPage = getSourceFilePathFromPage;

      /***/
    },

    /***/ 282: /***/ function (module) {
      module.exports = require('module');

      /***/
    },

    /***/ 293: /***/ function (module) {
      module.exports = require('buffer');

      /***/
    },

    /***/ 301: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const rimraf = __webpack_require__(180);

      module.exports = {
        remove: u(rimraf),
        removeSync: rimraf.sync,
      };

      /***/
    },

    /***/ 323: /***/ function (__unusedmodule, exports) {
      'use strict';

      exports.fromCallback = function (fn) {
        return Object.defineProperty(
          function () {
            if (typeof arguments[arguments.length - 1] === 'function')
              fn.apply(this, arguments);
            else {
              return new Promise((resolve, reject) => {
                arguments[arguments.length] = (err, res) => {
                  if (err) return reject(err);
                  resolve(res);
                };
                arguments.length++;
                fn.apply(this, arguments);
              });
            }
          },
          'name',
          { value: fn.name }
        );
      };

      exports.fromPromise = function (fn) {
        return Object.defineProperty(
          function () {
            const cb = arguments[arguments.length - 1];
            if (typeof cb !== 'function') return fn.apply(this, arguments);
            else fn.apply(this, arguments).then(r => cb(null, r), cb);
          },
          'name',
          { value: fn.name }
        );
      };

      /***/
    },

    /***/ 351: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const path = __webpack_require__(622);
      const fs = __webpack_require__(729);
      const _mkdirs = __webpack_require__(648);
      const mkdirs = _mkdirs.mkdirs;
      const mkdirsSync = _mkdirs.mkdirsSync;

      const _symlinkPaths = __webpack_require__(383);
      const symlinkPaths = _symlinkPaths.symlinkPaths;
      const symlinkPathsSync = _symlinkPaths.symlinkPathsSync;

      const _symlinkType = __webpack_require__(517);
      const symlinkType = _symlinkType.symlinkType;
      const symlinkTypeSync = _symlinkType.symlinkTypeSync;

      const pathExists = __webpack_require__(370).pathExists;

      function createSymlink(srcpath, dstpath, type, callback) {
        callback = typeof type === 'function' ? type : callback;
        type = typeof type === 'function' ? false : type;

        pathExists(dstpath, (err, destinationExists) => {
          if (err) return callback(err);
          if (destinationExists) return callback(null);
          symlinkPaths(srcpath, dstpath, (err, relative) => {
            if (err) return callback(err);
            srcpath = relative.toDst;
            symlinkType(relative.toCwd, type, (err, type) => {
              if (err) return callback(err);
              const dir = path.dirname(dstpath);
              pathExists(dir, (err, dirExists) => {
                if (err) return callback(err);
                if (dirExists)
                  return fs.symlink(srcpath, dstpath, type, callback);
                mkdirs(dir, err => {
                  if (err) return callback(err);
                  fs.symlink(srcpath, dstpath, type, callback);
                });
              });
            });
          });
        });
      }

      function createSymlinkSync(srcpath, dstpath, type) {
        const destinationExists = fs.existsSync(dstpath);
        if (destinationExists) return undefined;

        const relative = symlinkPathsSync(srcpath, dstpath);
        srcpath = relative.toDst;
        type = symlinkTypeSync(relative.toCwd, type);
        const dir = path.dirname(dstpath);
        const exists = fs.existsSync(dir);
        if (exists) return fs.symlinkSync(srcpath, dstpath, type);
        mkdirsSync(dir);
        return fs.symlinkSync(srcpath, dstpath, type);
      }

      module.exports = {
        createSymlink: u(createSymlink),
        createSymlinkSync,
      };

      /***/
    },

    /***/ 357: /***/ function (module) {
      module.exports = require('assert');

      /***/
    },

    /***/ 370: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromPromise;
      const fs = __webpack_require__(936);

      function pathExists(path) {
        return fs
          .access(path)
          .then(() => true)
          .catch(() => false);
      }

      module.exports = {
        pathExists: u(pathExists),
        pathExistsSync: fs.existsSync,
      };

      /***/
    },

    /***/ 383: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const path = __webpack_require__(622);
      const fs = __webpack_require__(729);
      const pathExists = __webpack_require__(370).pathExists;

      /**
       * Function that returns two types of paths, one relative to symlink, and one
       * relative to the current working directory. Checks if path is absolute or
       * relative. If the path is relative, this function checks if the path is
       * relative to symlink or relative to current working directory. This is an
       * initiative to find a smarter `srcpath` to supply when building symlinks.
       * This allows you to determine which path to use out of one of three possible
       * types of source paths. The first is an absolute path. This is detected by
       * `path.isAbsolute()`. When an absolute path is provided, it is checked to
       * see if it exists. If it does it's used, if not an error is returned
       * (callback)/ thrown (sync). The other two options for `srcpath` are a
       * relative url. By default Node's `fs.symlink` works by creating a symlink
       * using `dstpath` and expects the `srcpath` to be relative to the newly
       * created symlink. If you provide a `srcpath` that does not exist on the file
       * system it results in a broken symlink. To minimize this, the function
       * checks to see if the 'relative to symlink' source file exists, and if it
       * does it will use it. If it does not, it checks if there's a file that
       * exists that is relative to the current working directory, if does its used.
       * This preserves the expectations of the original fs.symlink spec and adds
       * the ability to pass in `relative to current working direcotry` paths.
       */

      function symlinkPaths(srcpath, dstpath, callback) {
        if (path.isAbsolute(srcpath)) {
          return fs.lstat(srcpath, err => {
            if (err) {
              err.message = err.message.replace('lstat', 'ensureSymlink');
              return callback(err);
            }
            return callback(null, {
              toCwd: srcpath,
              toDst: srcpath,
            });
          });
        } else {
          const dstdir = path.dirname(dstpath);
          const relativeToDst = path.join(dstdir, srcpath);
          return pathExists(relativeToDst, (err, exists) => {
            if (err) return callback(err);
            if (exists) {
              return callback(null, {
                toCwd: relativeToDst,
                toDst: srcpath,
              });
            } else {
              return fs.lstat(srcpath, err => {
                if (err) {
                  err.message = err.message.replace('lstat', 'ensureSymlink');
                  return callback(err);
                }
                return callback(null, {
                  toCwd: srcpath,
                  toDst: path.relative(dstdir, srcpath),
                });
              });
            }
          });
        }
      }

      function symlinkPathsSync(srcpath, dstpath) {
        let exists;
        if (path.isAbsolute(srcpath)) {
          exists = fs.existsSync(srcpath);
          if (!exists) throw new Error('absolute srcpath does not exist');
          return {
            toCwd: srcpath,
            toDst: srcpath,
          };
        } else {
          const dstdir = path.dirname(dstpath);
          const relativeToDst = path.join(dstdir, srcpath);
          exists = fs.existsSync(relativeToDst);
          if (exists) {
            return {
              toCwd: relativeToDst,
              toDst: srcpath,
            };
          } else {
            exists = fs.existsSync(srcpath);
            if (!exists) throw new Error('relative srcpath does not exist');
            return {
              toCwd: srcpath,
              toDst: path.relative(dstdir, srcpath),
            };
          }
        }
      }

      module.exports = {
        symlinkPaths,
        symlinkPathsSync,
      };

      /***/
    },

    /***/ 391: /***/ function (module, exports) {
      exports = module.exports = SemVer;

      var debug;
      /* istanbul ignore next */
      if (
        typeof process === 'object' &&
        process.env &&
        process.env.NODE_DEBUG &&
        /\bsemver\b/i.test(process.env.NODE_DEBUG)
      ) {
        debug = function () {
          var args = Array.prototype.slice.call(arguments, 0);
          args.unshift('SEMVER');
          console.log.apply(console, args);
        };
      } else {
        debug = function () {};
      }

      // Note: this is the semver.org version of the spec that it implements
      // Not necessarily the package version of this code.
      exports.SEMVER_SPEC_VERSION = '2.0.0';

      var MAX_LENGTH = 256;
      var MAX_SAFE_INTEGER =
        Number.MAX_SAFE_INTEGER || /* istanbul ignore next */ 9007199254740991;

      // Max safe segment length for coercion.
      var MAX_SAFE_COMPONENT_LENGTH = 16;

      // The actual regexps go on exports.re
      var re = (exports.re = []);
      var src = (exports.src = []);
      var R = 0;

      // The following Regular Expressions can be used for tokenizing,
      // validating, and parsing SemVer version strings.

      // ## Numeric Identifier
      // A single `0`, or a non-zero digit followed by zero or more digits.

      var NUMERICIDENTIFIER = R++;
      src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
      var NUMERICIDENTIFIERLOOSE = R++;
      src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';

      // ## Non-numeric Identifier
      // Zero or more digits, followed by a letter or hyphen, and then zero or
      // more letters, digits, or hyphens.

      var NONNUMERICIDENTIFIER = R++;
      src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';

      // ## Main Version
      // Three dot-separated numeric identifiers.

      var MAINVERSION = R++;
      src[MAINVERSION] =
        '(' +
        src[NUMERICIDENTIFIER] +
        ')\\.' +
        '(' +
        src[NUMERICIDENTIFIER] +
        ')\\.' +
        '(' +
        src[NUMERICIDENTIFIER] +
        ')';

      var MAINVERSIONLOOSE = R++;
      src[MAINVERSIONLOOSE] =
        '(' +
        src[NUMERICIDENTIFIERLOOSE] +
        ')\\.' +
        '(' +
        src[NUMERICIDENTIFIERLOOSE] +
        ')\\.' +
        '(' +
        src[NUMERICIDENTIFIERLOOSE] +
        ')';

      // ## Pre-release Version Identifier
      // A numeric identifier, or a non-numeric identifier.

      var PRERELEASEIDENTIFIER = R++;
      src[PRERELEASEIDENTIFIER] =
        '(?:' + src[NUMERICIDENTIFIER] + '|' + src[NONNUMERICIDENTIFIER] + ')';

      var PRERELEASEIDENTIFIERLOOSE = R++;
      src[PRERELEASEIDENTIFIERLOOSE] =
        '(?:' +
        src[NUMERICIDENTIFIERLOOSE] +
        '|' +
        src[NONNUMERICIDENTIFIER] +
        ')';

      // ## Pre-release Version
      // Hyphen, followed by one or more dot-separated pre-release version
      // identifiers.

      var PRERELEASE = R++;
      src[PRERELEASE] =
        '(?:-(' +
        src[PRERELEASEIDENTIFIER] +
        '(?:\\.' +
        src[PRERELEASEIDENTIFIER] +
        ')*))';

      var PRERELEASELOOSE = R++;
      src[PRERELEASELOOSE] =
        '(?:-?(' +
        src[PRERELEASEIDENTIFIERLOOSE] +
        '(?:\\.' +
        src[PRERELEASEIDENTIFIERLOOSE] +
        ')*))';

      // ## Build Metadata Identifier
      // Any combination of digits, letters, or hyphens.

      var BUILDIDENTIFIER = R++;
      src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

      // ## Build Metadata
      // Plus sign, followed by one or more period-separated build metadata
      // identifiers.

      var BUILD = R++;
      src[BUILD] =
        '(?:\\+(' +
        src[BUILDIDENTIFIER] +
        '(?:\\.' +
        src[BUILDIDENTIFIER] +
        ')*))';

      // ## Full Version String
      // A main version, followed optionally by a pre-release version and
      // build metadata.

      // Note that the only major, minor, patch, and pre-release sections of
      // the version string are capturing groups.  The build metadata is not a
      // capturing group, because it should not ever be used in version
      // comparison.

      var FULL = R++;
      var FULLPLAIN =
        'v?' + src[MAINVERSION] + src[PRERELEASE] + '?' + src[BUILD] + '?';

      src[FULL] = '^' + FULLPLAIN + '$';

      // like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
      // also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
      // common in the npm registry.
      var LOOSEPLAIN =
        '[v=\\s]*' +
        src[MAINVERSIONLOOSE] +
        src[PRERELEASELOOSE] +
        '?' +
        src[BUILD] +
        '?';

      var LOOSE = R++;
      src[LOOSE] = '^' + LOOSEPLAIN + '$';

      var GTLT = R++;
      src[GTLT] = '((?:<|>)?=?)';

      // Something like "2.*" or "1.2.x".
      // Note that "x.x" is a valid xRange identifer, meaning "any version"
      // Only the first item is strictly required.
      var XRANGEIDENTIFIERLOOSE = R++;
      src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
      var XRANGEIDENTIFIER = R++;
      src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

      var XRANGEPLAIN = R++;
      src[XRANGEPLAIN] =
        '[v=\\s]*(' +
        src[XRANGEIDENTIFIER] +
        ')' +
        '(?:\\.(' +
        src[XRANGEIDENTIFIER] +
        ')' +
        '(?:\\.(' +
        src[XRANGEIDENTIFIER] +
        ')' +
        '(?:' +
        src[PRERELEASE] +
        ')?' +
        src[BUILD] +
        '?' +
        ')?)?';

      var XRANGEPLAINLOOSE = R++;
      src[XRANGEPLAINLOOSE] =
        '[v=\\s]*(' +
        src[XRANGEIDENTIFIERLOOSE] +
        ')' +
        '(?:\\.(' +
        src[XRANGEIDENTIFIERLOOSE] +
        ')' +
        '(?:\\.(' +
        src[XRANGEIDENTIFIERLOOSE] +
        ')' +
        '(?:' +
        src[PRERELEASELOOSE] +
        ')?' +
        src[BUILD] +
        '?' +
        ')?)?';

      var XRANGE = R++;
      src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
      var XRANGELOOSE = R++;
      src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

      // Coercion.
      // Extract anything that could conceivably be a part of a valid semver
      var COERCE = R++;
      src[COERCE] =
        '(?:^|[^\\d])' +
        '(\\d{1,' +
        MAX_SAFE_COMPONENT_LENGTH +
        '})' +
        '(?:\\.(\\d{1,' +
        MAX_SAFE_COMPONENT_LENGTH +
        '}))?' +
        '(?:\\.(\\d{1,' +
        MAX_SAFE_COMPONENT_LENGTH +
        '}))?' +
        '(?:$|[^\\d])';

      // Tilde ranges.
      // Meaning is "reasonably at or greater than"
      var LONETILDE = R++;
      src[LONETILDE] = '(?:~>?)';

      var TILDETRIM = R++;
      src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
      re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
      var tildeTrimReplace = '$1~';

      var TILDE = R++;
      src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
      var TILDELOOSE = R++;
      src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

      // Caret ranges.
      // Meaning is "at least and backwards compatible with"
      var LONECARET = R++;
      src[LONECARET] = '(?:\\^)';

      var CARETTRIM = R++;
      src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
      re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
      var caretTrimReplace = '$1^';

      var CARET = R++;
      src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
      var CARETLOOSE = R++;
      src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

      // A simple gt/lt/eq thing, or just "" to indicate "any version"
      var COMPARATORLOOSE = R++;
      src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
      var COMPARATOR = R++;
      src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';

      // An expression to strip any whitespace between the gtlt and the thing
      // it modifies, so that `> 1.2.3` ==> `>1.2.3`
      var COMPARATORTRIM = R++;
      src[COMPARATORTRIM] =
        '(\\s*)' +
        src[GTLT] +
        '\\s*(' +
        LOOSEPLAIN +
        '|' +
        src[XRANGEPLAIN] +
        ')';

      // this one has to use the /g flag
      re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
      var comparatorTrimReplace = '$1$2$3';

      // Something like `1.2.3 - 1.2.4`
      // Note that these all use the loose form, because they'll be
      // checked against either the strict or loose comparator form
      // later.
      var HYPHENRANGE = R++;
      src[HYPHENRANGE] =
        '^\\s*(' +
        src[XRANGEPLAIN] +
        ')' +
        '\\s+-\\s+' +
        '(' +
        src[XRANGEPLAIN] +
        ')' +
        '\\s*$';

      var HYPHENRANGELOOSE = R++;
      src[HYPHENRANGELOOSE] =
        '^\\s*(' +
        src[XRANGEPLAINLOOSE] +
        ')' +
        '\\s+-\\s+' +
        '(' +
        src[XRANGEPLAINLOOSE] +
        ')' +
        '\\s*$';

      // Star ranges basically just allow anything at all.
      var STAR = R++;
      src[STAR] = '(<|>)?=?\\s*\\*';

      // Compile to actual regexp objects.
      // All are flag-free, unless they were created above with a flag.
      for (var i = 0; i < R; i++) {
        debug(i, src[i]);
        if (!re[i]) {
          re[i] = new RegExp(src[i]);
        }
      }

      exports.parse = parse;
      function parse(version, options) {
        if (!options || typeof options !== 'object') {
          options = {
            loose: !!options,
            includePrerelease: false,
          };
        }

        if (version instanceof SemVer) {
          return version;
        }

        if (typeof version !== 'string') {
          return null;
        }

        if (version.length > MAX_LENGTH) {
          return null;
        }

        var r = options.loose ? re[LOOSE] : re[FULL];
        if (!r.test(version)) {
          return null;
        }

        try {
          return new SemVer(version, options);
        } catch (er) {
          return null;
        }
      }

      exports.valid = valid;
      function valid(version, options) {
        var v = parse(version, options);
        return v ? v.version : null;
      }

      exports.clean = clean;
      function clean(version, options) {
        var s = parse(version.trim().replace(/^[=v]+/, ''), options);
        return s ? s.version : null;
      }

      exports.SemVer = SemVer;

      function SemVer(version, options) {
        if (!options || typeof options !== 'object') {
          options = {
            loose: !!options,
            includePrerelease: false,
          };
        }
        if (version instanceof SemVer) {
          if (version.loose === options.loose) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== 'string') {
          throw new TypeError('Invalid Version: ' + version);
        }

        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            'version is longer than ' + MAX_LENGTH + ' characters'
          );
        }

        if (!(this instanceof SemVer)) {
          return new SemVer(version, options);
        }

        debug('SemVer', version, options);
        this.options = options;
        this.loose = !!options.loose;

        var m = version.trim().match(options.loose ? re[LOOSE] : re[FULL]);

        if (!m) {
          throw new TypeError('Invalid Version: ' + version);
        }

        this.raw = version;

        // these are actually numbers
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];

        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError('Invalid major version');
        }

        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError('Invalid minor version');
        }

        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError('Invalid patch version');
        }

        // numberify any prerelease numeric ids
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split('.').map(function (id) {
            if (/^[0-9]+$/.test(id)) {
              var num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }

        this.build = m[5] ? m[5].split('.') : [];
        this.format();
      }

      SemVer.prototype.format = function () {
        this.version = this.major + '.' + this.minor + '.' + this.patch;
        if (this.prerelease.length) {
          this.version += '-' + this.prerelease.join('.');
        }
        return this.version;
      };

      SemVer.prototype.toString = function () {
        return this.version;
      };

      SemVer.prototype.compare = function (other) {
        debug('SemVer.compare', this.version, this.options, other);
        if (!(other instanceof SemVer)) {
          other = new SemVer(other, this.options);
        }

        return this.compareMain(other) || this.comparePre(other);
      };

      SemVer.prototype.compareMain = function (other) {
        if (!(other instanceof SemVer)) {
          other = new SemVer(other, this.options);
        }

        return (
          compareIdentifiers(this.major, other.major) ||
          compareIdentifiers(this.minor, other.minor) ||
          compareIdentifiers(this.patch, other.patch)
        );
      };

      SemVer.prototype.comparePre = function (other) {
        if (!(other instanceof SemVer)) {
          other = new SemVer(other, this.options);
        }

        // NOT having a prerelease is > having one
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }

        var i = 0;
        do {
          var a = this.prerelease[i];
          var b = other.prerelease[i];
          debug('prerelease compare', i, a, b);
          if (a === undefined && b === undefined) {
            return 0;
          } else if (b === undefined) {
            return 1;
          } else if (a === undefined) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      };

      SemVer.prototype.compareBuild = function (other) {
        if (!(other instanceof SemVer)) {
          other = new SemVer(other, this.options);
        }

        var i = 0;
        do {
          var a = this.build[i];
          var b = other.build[i];
          debug('prerelease compare', i, a, b);
          if (a === undefined && b === undefined) {
            return 0;
          } else if (b === undefined) {
            return 1;
          } else if (a === undefined) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      };

      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      SemVer.prototype.inc = function (release, identifier) {
        switch (release) {
          case 'premajor':
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc('pre', identifier);
            break;
          case 'preminor':
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc('pre', identifier);
            break;
          case 'prepatch':
            // If this is already a prerelease, it will bump to the next version
            // drop any prereleases that might already exist, since they are not
            // relevant at this point.
            this.prerelease.length = 0;
            this.inc('patch', identifier);
            this.inc('pre', identifier);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case 'prerelease':
            if (this.prerelease.length === 0) {
              this.inc('patch', identifier);
            }
            this.inc('pre', identifier);
            break;

          case 'major':
            // If this is a pre-major version, bump up to the same major version.
            // Otherwise increment major.
            // 1.0.0-5 bumps to 1.0.0
            // 1.1.0 bumps to 2.0.0
            if (
              this.minor !== 0 ||
              this.patch !== 0 ||
              this.prerelease.length === 0
            ) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case 'minor':
            // If this is a pre-minor version, bump up to the same minor version.
            // Otherwise increment minor.
            // 1.2.0-5 bumps to 1.2.0
            // 1.2.1 bumps to 1.3.0
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case 'patch':
            // If this is not a pre-release version, it will increment the patch.
            // If it is a pre-release it will bump up to the same patch version.
            // 1.2.0-5 patches to 1.2.0
            // 1.2.0 patches to 1.2.1
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
          case 'pre':
            if (this.prerelease.length === 0) {
              this.prerelease = [0];
            } else {
              var i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === 'number') {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                // didn't increment anything
                this.prerelease.push(0);
              }
            }
            if (identifier) {
              // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
              // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
              if (this.prerelease[0] === identifier) {
                if (isNaN(this.prerelease[1])) {
                  this.prerelease = [identifier, 0];
                }
              } else {
                this.prerelease = [identifier, 0];
              }
            }
            break;

          default:
            throw new Error('invalid increment argument: ' + release);
        }
        this.format();
        this.raw = this.version;
        return this;
      };

      exports.inc = inc;
      function inc(version, release, loose, identifier) {
        if (typeof loose === 'string') {
          identifier = loose;
          loose = undefined;
        }

        try {
          return new SemVer(version, loose).inc(release, identifier).version;
        } catch (er) {
          return null;
        }
      }

      exports.diff = diff;
      function diff(version1, version2) {
        if (eq(version1, version2)) {
          return null;
        } else {
          var v1 = parse(version1);
          var v2 = parse(version2);
          var prefix = '';
          if (v1.prerelease.length || v2.prerelease.length) {
            prefix = 'pre';
            var defaultResult = 'prerelease';
          }
          for (var key in v1) {
            if (key === 'major' || key === 'minor' || key === 'patch') {
              if (v1[key] !== v2[key]) {
                return prefix + key;
              }
            }
          }
          return defaultResult; // may be undefined
        }
      }

      exports.compareIdentifiers = compareIdentifiers;

      var numeric = /^[0-9]+$/;
      function compareIdentifiers(a, b) {
        var anum = numeric.test(a);
        var bnum = numeric.test(b);

        if (anum && bnum) {
          a = +a;
          b = +b;
        }

        return a === b
          ? 0
          : anum && !bnum
          ? -1
          : bnum && !anum
          ? 1
          : a < b
          ? -1
          : 1;
      }

      exports.rcompareIdentifiers = rcompareIdentifiers;
      function rcompareIdentifiers(a, b) {
        return compareIdentifiers(b, a);
      }

      exports.major = major;
      function major(a, loose) {
        return new SemVer(a, loose).major;
      }

      exports.minor = minor;
      function minor(a, loose) {
        return new SemVer(a, loose).minor;
      }

      exports.patch = patch;
      function patch(a, loose) {
        return new SemVer(a, loose).patch;
      }

      exports.compare = compare;
      function compare(a, b, loose) {
        return new SemVer(a, loose).compare(new SemVer(b, loose));
      }

      exports.compareLoose = compareLoose;
      function compareLoose(a, b) {
        return compare(a, b, true);
      }

      exports.compareBuild = compareBuild;
      function compareBuild(a, b, loose) {
        var versionA = new SemVer(a, loose);
        var versionB = new SemVer(b, loose);
        return versionA.compare(versionB) || versionA.compareBuild(versionB);
      }

      exports.rcompare = rcompare;
      function rcompare(a, b, loose) {
        return compare(b, a, loose);
      }

      exports.sort = sort;
      function sort(list, loose) {
        return list.sort(function (a, b) {
          return exports.compareBuild(a, b, loose);
        });
      }

      exports.rsort = rsort;
      function rsort(list, loose) {
        return list.sort(function (a, b) {
          return exports.compareBuild(b, a, loose);
        });
      }

      exports.gt = gt;
      function gt(a, b, loose) {
        return compare(a, b, loose) > 0;
      }

      exports.lt = lt;
      function lt(a, b, loose) {
        return compare(a, b, loose) < 0;
      }

      exports.eq = eq;
      function eq(a, b, loose) {
        return compare(a, b, loose) === 0;
      }

      exports.neq = neq;
      function neq(a, b, loose) {
        return compare(a, b, loose) !== 0;
      }

      exports.gte = gte;
      function gte(a, b, loose) {
        return compare(a, b, loose) >= 0;
      }

      exports.lte = lte;
      function lte(a, b, loose) {
        return compare(a, b, loose) <= 0;
      }

      exports.cmp = cmp;
      function cmp(a, op, b, loose) {
        switch (op) {
          case '===':
            if (typeof a === 'object') a = a.version;
            if (typeof b === 'object') b = b.version;
            return a === b;

          case '!==':
            if (typeof a === 'object') a = a.version;
            if (typeof b === 'object') b = b.version;
            return a !== b;

          case '':
          case '=':
          case '==':
            return eq(a, b, loose);

          case '!=':
            return neq(a, b, loose);

          case '>':
            return gt(a, b, loose);

          case '>=':
            return gte(a, b, loose);

          case '<':
            return lt(a, b, loose);

          case '<=':
            return lte(a, b, loose);

          default:
            throw new TypeError('Invalid operator: ' + op);
        }
      }

      exports.Comparator = Comparator;
      function Comparator(comp, options) {
        if (!options || typeof options !== 'object') {
          options = {
            loose: !!options,
            includePrerelease: false,
          };
        }

        if (comp instanceof Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }

        if (!(this instanceof Comparator)) {
          return new Comparator(comp, options);
        }

        debug('comparator', comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);

        if (this.semver === ANY) {
          this.value = '';
        } else {
          this.value = this.operator + this.semver.version;
        }

        debug('comp', this);
      }

      var ANY = {};
      Comparator.prototype.parse = function (comp) {
        var r = this.options.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
        var m = comp.match(r);

        if (!m) {
          throw new TypeError('Invalid comparator: ' + comp);
        }

        this.operator = m[1] !== undefined ? m[1] : '';
        if (this.operator === '=') {
          this.operator = '';
        }

        // if it literally is just '>' or '' then allow anything.
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      };

      Comparator.prototype.toString = function () {
        return this.value;
      };

      Comparator.prototype.test = function (version) {
        debug('Comparator.test', version, this.options.loose);

        if (this.semver === ANY || version === ANY) {
          return true;
        }

        if (typeof version === 'string') {
          version = new SemVer(version, this.options);
        }

        return cmp(version, this.operator, this.semver, this.options);
      };

      Comparator.prototype.intersects = function (comp, options) {
        if (!(comp instanceof Comparator)) {
          throw new TypeError('a Comparator is required');
        }

        if (!options || typeof options !== 'object') {
          options = {
            loose: !!options,
            includePrerelease: false,
          };
        }

        var rangeTmp;

        if (this.operator === '') {
          if (this.value === '') {
            return true;
          }
          rangeTmp = new Range(comp.value, options);
          return satisfies(this.value, rangeTmp, options);
        } else if (comp.operator === '') {
          if (comp.value === '') {
            return true;
          }
          rangeTmp = new Range(this.value, options);
          return satisfies(comp.semver, rangeTmp, options);
        }

        var sameDirectionIncreasing =
          (this.operator === '>=' || this.operator === '>') &&
          (comp.operator === '>=' || comp.operator === '>');
        var sameDirectionDecreasing =
          (this.operator === '<=' || this.operator === '<') &&
          (comp.operator === '<=' || comp.operator === '<');
        var sameSemVer = this.semver.version === comp.semver.version;
        var differentDirectionsInclusive =
          (this.operator === '>=' || this.operator === '<=') &&
          (comp.operator === '>=' || comp.operator === '<=');
        var oppositeDirectionsLessThan =
          cmp(this.semver, '<', comp.semver, options) &&
          (this.operator === '>=' || this.operator === '>') &&
          (comp.operator === '<=' || comp.operator === '<');
        var oppositeDirectionsGreaterThan =
          cmp(this.semver, '>', comp.semver, options) &&
          (this.operator === '<=' || this.operator === '<') &&
          (comp.operator === '>=' || comp.operator === '>');

        return (
          sameDirectionIncreasing ||
          sameDirectionDecreasing ||
          (sameSemVer && differentDirectionsInclusive) ||
          oppositeDirectionsLessThan ||
          oppositeDirectionsGreaterThan
        );
      };

      exports.Range = Range;
      function Range(range, options) {
        if (!options || typeof options !== 'object') {
          options = {
            loose: !!options,
            includePrerelease: false,
          };
        }

        if (range instanceof Range) {
          if (
            range.loose === !!options.loose &&
            range.includePrerelease === !!options.includePrerelease
          ) {
            return range;
          } else {
            return new Range(range.raw, options);
          }
        }

        if (range instanceof Comparator) {
          return new Range(range.value, options);
        }

        if (!(this instanceof Range)) {
          return new Range(range, options);
        }

        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;

        // First, split based on boolean or ||
        this.raw = range;
        this.set = range
          .split(/\s*\|\|\s*/)
          .map(function (range) {
            return this.parseRange(range.trim());
          }, this)
          .filter(function (c) {
            // throw out any that are not relevant for whatever reason
            return c.length;
          });

        if (!this.set.length) {
          throw new TypeError('Invalid SemVer Range: ' + range);
        }

        this.format();
      }

      Range.prototype.format = function () {
        this.range = this.set
          .map(function (comps) {
            return comps.join(' ').trim();
          })
          .join('||')
          .trim();
        return this.range;
      };

      Range.prototype.toString = function () {
        return this.range;
      };

      Range.prototype.parseRange = function (range) {
        var loose = this.options.loose;
        range = range.trim();
        // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
        var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
        range = range.replace(hr, hyphenReplace);
        debug('hyphen replace', range);
        // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
        range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
        debug('comparator trim', range, re[COMPARATORTRIM]);

        // `~ 1.2.3` => `~1.2.3`
        range = range.replace(re[TILDETRIM], tildeTrimReplace);

        // `^ 1.2.3` => `^1.2.3`
        range = range.replace(re[CARETTRIM], caretTrimReplace);

        // normalize spaces
        range = range.split(/\s+/).join(' ');

        // At this point, the range is completely trimmed and
        // ready to be split into comparators.

        var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
        var set = range
          .split(' ')
          .map(function (comp) {
            return parseComparator(comp, this.options);
          }, this)
          .join(' ')
          .split(/\s+/);
        if (this.options.loose) {
          // in loose mode, throw out any that are not valid comparators
          set = set.filter(function (comp) {
            return !!comp.match(compRe);
          });
        }
        set = set.map(function (comp) {
          return new Comparator(comp, this.options);
        }, this);

        return set;
      };

      Range.prototype.intersects = function (range, options) {
        if (!(range instanceof Range)) {
          throw new TypeError('a Range is required');
        }

        return this.set.some(function (thisComparators) {
          return (
            isSatisfiable(thisComparators, options) &&
            range.set.some(function (rangeComparators) {
              return (
                isSatisfiable(rangeComparators, options) &&
                thisComparators.every(function (thisComparator) {
                  return rangeComparators.every(function (rangeComparator) {
                    return thisComparator.intersects(rangeComparator, options);
                  });
                })
              );
            })
          );
        });
      };

      // take a set of comparators and determine whether there
      // exists a version which can satisfy it
      function isSatisfiable(comparators, options) {
        var result = true;
        var remainingComparators = comparators.slice();
        var testComparator = remainingComparators.pop();

        while (result && remainingComparators.length) {
          result = remainingComparators.every(function (otherComparator) {
            return testComparator.intersects(otherComparator, options);
          });

          testComparator = remainingComparators.pop();
        }

        return result;
      }

      // Mostly just for testing and legacy API reasons
      exports.toComparators = toComparators;
      function toComparators(range, options) {
        return new Range(range, options).set.map(function (comp) {
          return comp
            .map(function (c) {
              return c.value;
            })
            .join(' ')
            .trim()
            .split(' ');
        });
      }

      // comprised of xranges, tildes, stars, and gtlt's at this point.
      // already replaced the hyphen ranges
      // turn into a set of JUST comparators.
      function parseComparator(comp, options) {
        debug('comp', comp, options);
        comp = replaceCarets(comp, options);
        debug('caret', comp);
        comp = replaceTildes(comp, options);
        debug('tildes', comp);
        comp = replaceXRanges(comp, options);
        debug('xrange', comp);
        comp = replaceStars(comp, options);
        debug('stars', comp);
        return comp;
      }

      function isX(id) {
        return !id || id.toLowerCase() === 'x' || id === '*';
      }

      // ~, ~> --> * (any, kinda silly)
      // ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
      // ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
      // ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
      // ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
      // ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
      function replaceTildes(comp, options) {
        return comp
          .trim()
          .split(/\s+/)
          .map(function (comp) {
            return replaceTilde(comp, options);
          })
          .join(' ');
      }

      function replaceTilde(comp, options) {
        var r = options.loose ? re[TILDELOOSE] : re[TILDE];
        return comp.replace(r, function (_, M, m, p, pr) {
          debug('tilde', comp, _, M, m, p, pr);
          var ret;

          if (isX(M)) {
            ret = '';
          } else if (isX(m)) {
            ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
          } else if (isX(p)) {
            // ~1.2 == >=1.2.0 <1.3.0
            ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
          } else if (pr) {
            debug('replaceTilde pr', pr);
            ret =
              '>=' +
              M +
              '.' +
              m +
              '.' +
              p +
              '-' +
              pr +
              ' <' +
              M +
              '.' +
              (+m + 1) +
              '.0';
          } else {
            // ~1.2.3 == >=1.2.3 <1.3.0
            ret =
              '>=' + M + '.' + m + '.' + p + ' <' + M + '.' + (+m + 1) + '.0';
          }

          debug('tilde return', ret);
          return ret;
        });
      }

      // ^ --> * (any, kinda silly)
      // ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
      // ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
      // ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
      // ^1.2.3 --> >=1.2.3 <2.0.0
      // ^1.2.0 --> >=1.2.0 <2.0.0
      function replaceCarets(comp, options) {
        return comp
          .trim()
          .split(/\s+/)
          .map(function (comp) {
            return replaceCaret(comp, options);
          })
          .join(' ');
      }

      function replaceCaret(comp, options) {
        debug('caret', comp, options);
        var r = options.loose ? re[CARETLOOSE] : re[CARET];
        return comp.replace(r, function (_, M, m, p, pr) {
          debug('caret', comp, _, M, m, p, pr);
          var ret;

          if (isX(M)) {
            ret = '';
          } else if (isX(m)) {
            ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
          } else if (isX(p)) {
            if (M === '0') {
              ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
            } else {
              ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
            }
          } else if (pr) {
            debug('replaceCaret pr', pr);
            if (M === '0') {
              if (m === '0') {
                ret =
                  '>=' +
                  M +
                  '.' +
                  m +
                  '.' +
                  p +
                  '-' +
                  pr +
                  ' <' +
                  M +
                  '.' +
                  m +
                  '.' +
                  (+p + 1);
              } else {
                ret =
                  '>=' +
                  M +
                  '.' +
                  m +
                  '.' +
                  p +
                  '-' +
                  pr +
                  ' <' +
                  M +
                  '.' +
                  (+m + 1) +
                  '.0';
              }
            } else {
              ret =
                '>=' +
                M +
                '.' +
                m +
                '.' +
                p +
                '-' +
                pr +
                ' <' +
                (+M + 1) +
                '.0.0';
            }
          } else {
            debug('no pr');
            if (M === '0') {
              if (m === '0') {
                ret =
                  '>=' +
                  M +
                  '.' +
                  m +
                  '.' +
                  p +
                  ' <' +
                  M +
                  '.' +
                  m +
                  '.' +
                  (+p + 1);
              } else {
                ret =
                  '>=' +
                  M +
                  '.' +
                  m +
                  '.' +
                  p +
                  ' <' +
                  M +
                  '.' +
                  (+m + 1) +
                  '.0';
              }
            } else {
              ret = '>=' + M + '.' + m + '.' + p + ' <' + (+M + 1) + '.0.0';
            }
          }

          debug('caret return', ret);
          return ret;
        });
      }

      function replaceXRanges(comp, options) {
        debug('replaceXRanges', comp, options);
        return comp
          .split(/\s+/)
          .map(function (comp) {
            return replaceXRange(comp, options);
          })
          .join(' ');
      }

      function replaceXRange(comp, options) {
        comp = comp.trim();
        var r = options.loose ? re[XRANGELOOSE] : re[XRANGE];
        return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
          debug('xRange', comp, ret, gtlt, M, m, p, pr);
          var xM = isX(M);
          var xm = xM || isX(m);
          var xp = xm || isX(p);
          var anyX = xp;

          if (gtlt === '=' && anyX) {
            gtlt = '';
          }

          if (xM) {
            if (gtlt === '>' || gtlt === '<') {
              // nothing is allowed
              ret = '<0.0.0';
            } else {
              // nothing is forbidden
              ret = '*';
            }
          } else if (gtlt && anyX) {
            // we know patch is an x, because we have any x at all.
            // replace X with 0
            if (xm) {
              m = 0;
            }
            p = 0;

            if (gtlt === '>') {
              // >1 => >=2.0.0
              // >1.2 => >=1.3.0
              // >1.2.3 => >= 1.2.4
              gtlt = '>=';
              if (xm) {
                M = +M + 1;
                m = 0;
                p = 0;
              } else {
                m = +m + 1;
                p = 0;
              }
            } else if (gtlt === '<=') {
              // <=0.7.x is actually <0.8.0, since any 0.7.x should
              // pass.  Similarly, <=7.x is actually <8.0.0, etc.
              gtlt = '<';
              if (xm) {
                M = +M + 1;
              } else {
                m = +m + 1;
              }
            }

            ret = gtlt + M + '.' + m + '.' + p;
          } else if (xm) {
            ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
          } else if (xp) {
            ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
          }

          debug('xRange return', ret);

          return ret;
        });
      }

      // Because * is AND-ed with everything else in the comparator,
      // and '' means "any version", just remove the *s entirely.
      function replaceStars(comp, options) {
        debug('replaceStars', comp, options);
        // Looseness is ignored here.  star is always as loose as it gets!
        return comp.trim().replace(re[STAR], '');
      }

      // This function is passed to string.replace(re[HYPHENRANGE])
      // M, m, patch, prerelease, build
      // 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
      // 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
      // 1.2 - 3.4 => >=1.2.0 <3.5.0
      function hyphenReplace(
        $0,
        from,
        fM,
        fm,
        fp,
        fpr,
        fb,
        to,
        tM,
        tm,
        tp,
        tpr,
        tb
      ) {
        if (isX(fM)) {
          from = '';
        } else if (isX(fm)) {
          from = '>=' + fM + '.0.0';
        } else if (isX(fp)) {
          from = '>=' + fM + '.' + fm + '.0';
        } else {
          from = '>=' + from;
        }

        if (isX(tM)) {
          to = '';
        } else if (isX(tm)) {
          to = '<' + (+tM + 1) + '.0.0';
        } else if (isX(tp)) {
          to = '<' + tM + '.' + (+tm + 1) + '.0';
        } else if (tpr) {
          to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
        } else {
          to = '<=' + to;
        }

        return (from + ' ' + to).trim();
      }

      // if ANY of the sets match ALL of its comparators, then pass
      Range.prototype.test = function (version) {
        if (!version) {
          return false;
        }

        if (typeof version === 'string') {
          version = new SemVer(version, this.options);
        }

        for (var i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      };

      function testSet(set, version, options) {
        for (var i = 0; i < set.length; i++) {
          if (!set[i].test(version)) {
            return false;
          }
        }

        if (version.prerelease.length && !options.includePrerelease) {
          // Find the set of versions that are allowed to have prereleases
          // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
          // That should allow `1.2.3-pr.2` to pass.
          // However, `1.2.4-alpha.notready` should NOT be allowed,
          // even though it's within the range set by the comparators.
          for (i = 0; i < set.length; i++) {
            debug(set[i].semver);
            if (set[i].semver === ANY) {
              continue;
            }

            if (set[i].semver.prerelease.length > 0) {
              var allowed = set[i].semver;
              if (
                allowed.major === version.major &&
                allowed.minor === version.minor &&
                allowed.patch === version.patch
              ) {
                return true;
              }
            }
          }

          // Version has a -pre, but it's not one of the ones we like.
          return false;
        }

        return true;
      }

      exports.satisfies = satisfies;
      function satisfies(version, range, options) {
        try {
          range = new Range(range, options);
        } catch (er) {
          return false;
        }
        return range.test(version);
      }

      exports.maxSatisfying = maxSatisfying;
      function maxSatisfying(versions, range, options) {
        var max = null;
        var maxSV = null;
        try {
          var rangeObj = new Range(range, options);
        } catch (er) {
          return null;
        }
        versions.forEach(function (v) {
          if (rangeObj.test(v)) {
            // satisfies(v, range, options)
            if (!max || maxSV.compare(v) === -1) {
              // compare(max, v, true)
              max = v;
              maxSV = new SemVer(max, options);
            }
          }
        });
        return max;
      }

      exports.minSatisfying = minSatisfying;
      function minSatisfying(versions, range, options) {
        var min = null;
        var minSV = null;
        try {
          var rangeObj = new Range(range, options);
        } catch (er) {
          return null;
        }
        versions.forEach(function (v) {
          if (rangeObj.test(v)) {
            // satisfies(v, range, options)
            if (!min || minSV.compare(v) === 1) {
              // compare(min, v, true)
              min = v;
              minSV = new SemVer(min, options);
            }
          }
        });
        return min;
      }

      exports.minVersion = minVersion;
      function minVersion(range, loose) {
        range = new Range(range, loose);

        var minver = new SemVer('0.0.0');
        if (range.test(minver)) {
          return minver;
        }

        minver = new SemVer('0.0.0-0');
        if (range.test(minver)) {
          return minver;
        }

        minver = null;
        for (var i = 0; i < range.set.length; ++i) {
          var comparators = range.set[i];

          comparators.forEach(function (comparator) {
            // Clone to avoid manipulating the comparator's semver object.
            var compver = new SemVer(comparator.semver.version);
            switch (comparator.operator) {
              case '>':
                if (compver.prerelease.length === 0) {
                  compver.patch++;
                } else {
                  compver.prerelease.push(0);
                }
                compver.raw = compver.format();
              /* fallthrough */
              case '':
              case '>=':
                if (!minver || gt(minver, compver)) {
                  minver = compver;
                }
                break;
              case '<':
              case '<=':
                /* Ignore maximum versions */
                break;
              /* istanbul ignore next */
              default:
                throw new Error('Unexpected operation: ' + comparator.operator);
            }
          });
        }

        if (minver && range.test(minver)) {
          return minver;
        }

        return null;
      }

      exports.validRange = validRange;
      function validRange(range, options) {
        try {
          // Return '*' instead of '' so that truthiness works.
          // This will throw if it's invalid anyway
          return new Range(range, options).range || '*';
        } catch (er) {
          return null;
        }
      }

      // Determine if version is less than all the versions possible in the range
      exports.ltr = ltr;
      function ltr(version, range, options) {
        return outside(version, range, '<', options);
      }

      // Determine if version is greater than all the versions possible in the range.
      exports.gtr = gtr;
      function gtr(version, range, options) {
        return outside(version, range, '>', options);
      }

      exports.outside = outside;
      function outside(version, range, hilo, options) {
        version = new SemVer(version, options);
        range = new Range(range, options);

        var gtfn, ltefn, ltfn, comp, ecomp;
        switch (hilo) {
          case '>':
            gtfn = gt;
            ltefn = lte;
            ltfn = lt;
            comp = '>';
            ecomp = '>=';
            break;
          case '<':
            gtfn = lt;
            ltefn = gte;
            ltfn = gt;
            comp = '<';
            ecomp = '<=';
            break;
          default:
            throw new TypeError('Must provide a hilo val of "<" or ">"');
        }

        // If it satisifes the range it is not outside
        if (satisfies(version, range, options)) {
          return false;
        }

        // From now on, variable terms are as if we're in "gtr" mode.
        // but note that everything is flipped for the "ltr" function.

        for (var i = 0; i < range.set.length; ++i) {
          var comparators = range.set[i];

          var high = null;
          var low = null;

          comparators.forEach(function (comparator) {
            if (comparator.semver === ANY) {
              comparator = new Comparator('>=0.0.0');
            }
            high = high || comparator;
            low = low || comparator;
            if (gtfn(comparator.semver, high.semver, options)) {
              high = comparator;
            } else if (ltfn(comparator.semver, low.semver, options)) {
              low = comparator;
            }
          });

          // If the edge version comparator has a operator then our version
          // isn't outside it
          if (high.operator === comp || high.operator === ecomp) {
            return false;
          }

          // If the lowest version comparator has an operator and our version
          // is less than it then it isn't higher than the range
          if (
            (!low.operator || low.operator === comp) &&
            ltefn(version, low.semver)
          ) {
            return false;
          } else if (low.operator === ecomp && ltfn(version, low.semver)) {
            return false;
          }
        }
        return true;
      }

      exports.prerelease = prerelease;
      function prerelease(version, options) {
        var parsed = parse(version, options);
        return parsed && parsed.prerelease.length ? parsed.prerelease : null;
      }

      exports.intersects = intersects;
      function intersects(r1, r2, options) {
        r1 = new Range(r1, options);
        r2 = new Range(r2, options);
        return r1.intersects(r2);
      }

      exports.coerce = coerce;
      function coerce(version, options) {
        if (version instanceof SemVer) {
          return version;
        }

        if (typeof version !== 'string') {
          return null;
        }

        var match = version.match(re[COERCE]);

        if (match == null) {
          return null;
        }

        return parse(
          match[1] + '.' + (match[2] || '0') + '.' + (match[3] || '0'),
          options
        );
      }

      /***/
    },

    /***/ 402: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);
      const os = __webpack_require__(87);
      const path = __webpack_require__(622);

      // HFS, ext{2,3}, FAT do not, Node.js v0.10 does not
      function hasMillisResSync() {
        let tmpfile = path.join(
          'millis-test-sync' +
            Date.now().toString() +
            Math.random().toString().slice(2)
        );
        tmpfile = path.join(os.tmpdir(), tmpfile);

        // 550 millis past UNIX epoch
        const d = new Date(1435410243862);
        fs.writeFileSync(
          tmpfile,
          'https://github.com/jprichardson/node-fs-extra/pull/141'
        );
        const fd = fs.openSync(tmpfile, 'r+');
        fs.futimesSync(fd, d, d);
        fs.closeSync(fd);
        return fs.statSync(tmpfile).mtime > 1435410243000;
      }

      function hasMillisRes(callback) {
        let tmpfile = path.join(
          'millis-test' +
            Date.now().toString() +
            Math.random().toString().slice(2)
        );
        tmpfile = path.join(os.tmpdir(), tmpfile);

        // 550 millis past UNIX epoch
        const d = new Date(1435410243862);
        fs.writeFile(
          tmpfile,
          'https://github.com/jprichardson/node-fs-extra/pull/141',
          err => {
            if (err) return callback(err);
            fs.open(tmpfile, 'r+', (err, fd) => {
              if (err) return callback(err);
              fs.futimes(fd, d, d, err => {
                if (err) return callback(err);
                fs.close(fd, err => {
                  if (err) return callback(err);
                  fs.stat(tmpfile, (err, stats) => {
                    if (err) return callback(err);
                    callback(null, stats.mtime > 1435410243000);
                  });
                });
              });
            });
          }
        );
      }

      function timeRemoveMillis(timestamp) {
        if (typeof timestamp === 'number') {
          return Math.floor(timestamp / 1000) * 1000;
        } else if (timestamp instanceof Date) {
          return new Date(Math.floor(timestamp.getTime() / 1000) * 1000);
        } else {
          throw new Error(
            'fs-extra: timeRemoveMillis() unknown parameter type'
          );
        }
      }

      function utimesMillis(path, atime, mtime, callback) {
        // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
        fs.open(path, 'r+', (err, fd) => {
          if (err) return callback(err);
          fs.futimes(fd, atime, mtime, futimesErr => {
            fs.close(fd, closeErr => {
              if (callback) callback(futimesErr || closeErr);
            });
          });
        });
      }

      function utimesMillisSync(path, atime, mtime) {
        const fd = fs.openSync(path, 'r+');
        fs.futimesSync(fd, atime, mtime);
        return fs.closeSync(fd);
      }

      module.exports = {
        hasMillisRes,
        hasMillisResSync,
        timeRemoveMillis,
        utimesMillis,
        utimesMillisSync,
      };

      /***/
    },

    /***/ 410: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      module.exports = Object.assign(
        {},
        // Export promiseified graceful-fs:
        __webpack_require__(936),
        // Export extra methods:
        __webpack_require__(161),
        __webpack_require__(758),
        __webpack_require__(502),
        __webpack_require__(757),
        __webpack_require__(742),
        __webpack_require__(648),
        __webpack_require__(667),
        __webpack_require__(192),
        __webpack_require__(719),
        __webpack_require__(370),
        __webpack_require__(301)
      );

      // Export fs.promises as a getter property so that we don't trigger
      // ExperimentalWarning before fs.promises is actually accessed.
      const fs = __webpack_require__(747);
      if (Object.getOwnPropertyDescriptor(fs, 'promises')) {
        Object.defineProperty(module.exports, 'promises', {
          get() {
            return fs.promises;
          },
        });
      }

      /***/
    },

    /***/ 413: /***/ function (module) {
      module.exports = require('stream');

      /***/
    },

    /***/ 445: /***/ function (module) {
      module.exports = require('@vercel/build-utils');

      /***/
    },

    /***/ 452: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const invalidWin32Path = __webpack_require__(868).invalidWin32Path;

      const o777 = parseInt('0777', 8);

      function mkdirsSync(p, opts, made) {
        if (!opts || typeof opts !== 'object') {
          opts = { mode: opts };
        }

        let mode = opts.mode;
        const xfs = opts.fs || fs;

        if (process.platform === 'win32' && invalidWin32Path(p)) {
          const errInval = new Error(
            p + ' contains invalid WIN32 path characters.'
          );
          errInval.code = 'EINVAL';
          throw errInval;
        }

        if (mode === undefined) {
          mode = o777 & ~process.umask();
        }
        if (!made) made = null;

        p = path.resolve(p);

        try {
          xfs.mkdirSync(p, mode);
          made = made || p;
        } catch (err0) {
          if (err0.code === 'ENOENT') {
            if (path.dirname(p) === p) throw err0;
            made = mkdirsSync(path.dirname(p), opts, made);
            mkdirsSync(p, opts, made);
          } else {
            // In the case of any other error, just see if there's a dir there
            // already. If so, then hooray!  If not, then something is borked.
            let stat;
            try {
              stat = xfs.statSync(p);
            } catch (err1) {
              throw err0;
            }
            if (!stat.isDirectory()) throw err0;
          }
        }

        return made;
      }

      module.exports = mkdirsSync;

      /***/
    },

    /***/ 458: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const jsonFile = __webpack_require__(914);

      module.exports = {
        // jsonfile exports
        readJson: u(jsonFile.readFile),
        readJsonSync: jsonFile.readFileSync,
        writeJson: u(jsonFile.writeFile),
        writeJsonSync: jsonFile.writeFileSync,
      };

      /***/
    },

    /***/ 470: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const path = __webpack_require__(622);
      const mkdir = __webpack_require__(648);
      const pathExists = __webpack_require__(370).pathExists;
      const jsonFile = __webpack_require__(458);

      function outputJson(file, data, options, callback) {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }

        const dir = path.dirname(file);

        pathExists(dir, (err, itDoes) => {
          if (err) return callback(err);
          if (itDoes) return jsonFile.writeJson(file, data, options, callback);

          mkdir.mkdirs(dir, err => {
            if (err) return callback(err);
            jsonFile.writeJson(file, data, options, callback);
          });
        });
      }

      module.exports = outputJson;

      /***/
    },

    /***/ 487: /***/ function (__unusedmodule, exports, __webpack_require__) {
      var fs = __webpack_require__(747);
      var Transform = __webpack_require__(413).Transform;
      var PassThrough = __webpack_require__(413).PassThrough;
      var zlib = __webpack_require__(761);
      var util = __webpack_require__(669);
      var EventEmitter = __webpack_require__(614).EventEmitter;
      var crc32 = __webpack_require__(802);

      exports.ZipFile = ZipFile;
      exports.dateToDosDateTime = dateToDosDateTime;

      util.inherits(ZipFile, EventEmitter);
      function ZipFile() {
        this.outputStream = new PassThrough();
        this.entries = [];
        this.outputStreamCursor = 0;
        this.ended = false; // .end() sets this
        this.allDone = false; // set when we've written the last bytes
        this.forceZip64Eocd = false; // configurable in .end()
      }

      ZipFile.prototype.addFile = function (realPath, metadataPath, options) {
        var self = this;
        metadataPath = validateMetadataPath(metadataPath, false);
        if (options == null) options = {};

        var entry = new Entry(metadataPath, false, options);
        self.entries.push(entry);
        fs.stat(realPath, function (err, stats) {
          if (err) return self.emit('error', err);
          if (!stats.isFile())
            return self.emit('error', new Error('not a file: ' + realPath));
          entry.uncompressedSize = stats.size;
          if (options.mtime == null) entry.setLastModDate(stats.mtime);
          if (options.mode == null) entry.setFileAttributesMode(stats.mode);
          entry.setFileDataPumpFunction(function () {
            var readStream = fs.createReadStream(realPath);
            entry.state = Entry.FILE_DATA_IN_PROGRESS;
            readStream.on('error', function (err) {
              self.emit('error', err);
            });
            pumpFileDataReadStream(self, entry, readStream);
          });
          pumpEntries(self);
        });
      };

      ZipFile.prototype.addReadStream = function (
        readStream,
        metadataPath,
        options
      ) {
        var self = this;
        metadataPath = validateMetadataPath(metadataPath, false);
        if (options == null) options = {};
        var entry = new Entry(metadataPath, false, options);
        self.entries.push(entry);
        entry.setFileDataPumpFunction(function () {
          entry.state = Entry.FILE_DATA_IN_PROGRESS;
          pumpFileDataReadStream(self, entry, readStream);
        });
        pumpEntries(self);
      };

      ZipFile.prototype.addBuffer = function (buffer, metadataPath, options) {
        var self = this;
        metadataPath = validateMetadataPath(metadataPath, false);
        if (buffer.length > 0x3fffffff)
          throw new Error(
            'buffer too large: ' + buffer.length + ' > ' + 0x3fffffff
          );
        if (options == null) options = {};
        if (options.size != null) throw new Error('options.size not allowed');
        var entry = new Entry(metadataPath, false, options);
        entry.uncompressedSize = buffer.length;
        entry.crc32 = crc32.unsigned(buffer);
        entry.crcAndFileSizeKnown = true;
        self.entries.push(entry);
        if (!entry.compress) {
          setCompressedBuffer(buffer);
        } else {
          zlib.deflateRaw(buffer, function (err, compressedBuffer) {
            setCompressedBuffer(compressedBuffer);
          });
        }
        function setCompressedBuffer(compressedBuffer) {
          entry.compressedSize = compressedBuffer.length;
          entry.setFileDataPumpFunction(function () {
            writeToOutputStream(self, compressedBuffer);
            writeToOutputStream(self, entry.getDataDescriptor());
            entry.state = Entry.FILE_DATA_DONE;

            // don't call pumpEntries() recursively.
            // (also, don't call process.nextTick recursively.)
            setImmediate(function () {
              pumpEntries(self);
            });
          });
          pumpEntries(self);
        }
      };

      ZipFile.prototype.addDeflatedBuffer = function (
        compressedBuffer,
        metadataPath,
        options
      ) {
        var self = this;
        if (typeof options.uncompressedSize !== 'number') {
          throw new Error('options.uncompressedSize is required');
        }
        if (typeof options.crc32 !== 'number') {
          throw new Error('options.crc32 is required');
        }
        if (compressedBuffer.length > 0x3fffffff) {
          throw new Error(
            'buffer too large: ' + buffer.length + ' > ' + 0x3fffffff
          );
        }
        metadataPath = validateMetadataPath(metadataPath, false);
        var entry = new Entry(metadataPath, false, {
          mode: options.mode,
          mtime: options.mtime,
          fileComment: options.fileComment,
        });
        entry.crc32 = options.crc32;
        entry.crcAndFileSizeKnown = true;
        entry.compressedSize = compressedBuffer.length;
        entry.uncompressedSize = options.uncompressedSize;
        self.entries.push(entry);

        entry.setFileDataPumpFunction(function () {
          writeToOutputStream(self, compressedBuffer);
          writeToOutputStream(self, entry.getDataDescriptor());
          entry.state = Entry.FILE_DATA_DONE;

          // don't call pumpEntries() recursively.
          // (also, don't call process.nextTick recursively.)
          setImmediate(function () {
            pumpEntries(self);
          });
        });
        pumpEntries(self);
      };

      ZipFile.prototype.addEmptyDirectory = function (metadataPath, options) {
        var self = this;
        metadataPath = validateMetadataPath(metadataPath, true);
        if (options == null) options = {};
        if (options.size != null) throw new Error('options.size not allowed');
        if (options.compress != null)
          throw new Error('options.compress not allowed');
        var entry = new Entry(metadataPath, true, options);
        self.entries.push(entry);
        entry.setFileDataPumpFunction(function () {
          writeToOutputStream(self, entry.getDataDescriptor());
          entry.state = Entry.FILE_DATA_DONE;
          pumpEntries(self);
        });
        pumpEntries(self);
      };

      var eocdrSignatureBuffer = bufferFrom([0x50, 0x4b, 0x05, 0x06]);

      ZipFile.prototype.end = function (options, finalSizeCallback) {
        if (typeof options === 'function') {
          finalSizeCallback = options;
          options = null;
        }
        if (options == null) options = {};
        if (this.ended) return;
        this.ended = true;
        this.finalSizeCallback = finalSizeCallback;
        this.forceZip64Eocd = !!options.forceZip64Format;
        if (options.comment) {
          if (typeof options.comment === 'string') {
            this.comment = encodeCp437(options.comment);
          } else {
            // It should be a Buffer
            this.comment = options.comment;
          }
          if (this.comment.length > 0xffff)
            throw new Error('comment is too large');
          // gotta check for this, because the zipfile format is actually ambiguous.
          if (bufferIncludes(this.comment, eocdrSignatureBuffer))
            throw new Error(
              'comment contains end of central directory record signature'
            );
        } else {
          // no comment.
          this.comment = EMPTY_BUFFER;
        }
        pumpEntries(this);
      };

      function writeToOutputStream(self, buffer) {
        self.outputStream.write(buffer);
        self.outputStreamCursor += buffer.length;
      }

      function pumpFileDataReadStream(self, entry, readStream) {
        var crc32Watcher = new Crc32Watcher();
        var uncompressedSizeCounter = new ByteCounter();
        var compressor = entry.compress
          ? new zlib.DeflateRaw()
          : new PassThrough();
        var compressedSizeCounter = new ByteCounter();
        readStream
          .pipe(crc32Watcher)
          .pipe(uncompressedSizeCounter)
          .pipe(compressor)
          .pipe(compressedSizeCounter)
          .pipe(self.outputStream, { end: false });
        compressedSizeCounter.on('end', function () {
          entry.crc32 = crc32Watcher.crc32;
          if (entry.uncompressedSize == null) {
            entry.uncompressedSize = uncompressedSizeCounter.byteCount;
          } else {
            if (entry.uncompressedSize !== uncompressedSizeCounter.byteCount)
              return self.emit(
                'error',
                new Error('file data stream has unexpected number of bytes')
              );
          }
          entry.compressedSize = compressedSizeCounter.byteCount;
          self.outputStreamCursor += entry.compressedSize;
          writeToOutputStream(self, entry.getDataDescriptor());
          entry.state = Entry.FILE_DATA_DONE;
          pumpEntries(self);
        });
      }

      function pumpEntries(self) {
        if (self.allDone) return;
        // first check if finalSize is finally known
        if (self.ended && self.finalSizeCallback != null) {
          var finalSize = calculateFinalSize(self);
          if (finalSize != null) {
            // we have an answer
            self.finalSizeCallback(finalSize);
            self.finalSizeCallback = null;
          }
        }

        // pump entries
        var entry = getFirstNotDoneEntry();
        function getFirstNotDoneEntry() {
          for (var i = 0; i < self.entries.length; i++) {
            var entry = self.entries[i];
            if (entry.state < Entry.FILE_DATA_DONE) return entry;
          }
          return null;
        }
        if (entry != null) {
          // this entry is not done yet
          if (entry.state < Entry.READY_TO_PUMP_FILE_DATA) return; // input file not open yet
          if (entry.state === Entry.FILE_DATA_IN_PROGRESS) return; // we'll get there
          // start with local file header
          entry.relativeOffsetOfLocalHeader = self.outputStreamCursor;
          var localFileHeader = entry.getLocalFileHeader();
          writeToOutputStream(self, localFileHeader);
          entry.doFileDataPump();
        } else {
          // all cought up on writing entries
          if (self.ended) {
            // head for the exit
            self.offsetOfStartOfCentralDirectory = self.outputStreamCursor;
            self.entries.forEach(function (entry) {
              var centralDirectoryRecord = entry.getCentralDirectoryRecord();
              writeToOutputStream(self, centralDirectoryRecord);
            });
            writeToOutputStream(self, getEndOfCentralDirectoryRecord(self));
            self.outputStream.end();
            self.allDone = true;
          }
        }
      }

      function calculateFinalSize(self) {
        var pretendOutputCursor = 0;
        var centralDirectorySize = 0;
        for (var i = 0; i < self.entries.length; i++) {
          var entry = self.entries[i];
          // compression is too hard to predict
          if (entry.compress) return -1;
          if (entry.state >= Entry.READY_TO_PUMP_FILE_DATA) {
            // if addReadStream was called without providing the size, we can't predict the final size
            if (entry.uncompressedSize == null) return -1;
          } else {
            // if we're still waiting for fs.stat, we might learn the size someday
            if (entry.uncompressedSize == null) return null;
          }
          // we know this for sure, and this is important to know if we need ZIP64 format.
          entry.relativeOffsetOfLocalHeader = pretendOutputCursor;
          var useZip64Format = entry.useZip64Format();

          pretendOutputCursor +=
            LOCAL_FILE_HEADER_FIXED_SIZE + entry.utf8FileName.length;
          pretendOutputCursor += entry.uncompressedSize;
          if (!entry.crcAndFileSizeKnown) {
            // use a data descriptor
            if (useZip64Format) {
              pretendOutputCursor += ZIP64_DATA_DESCRIPTOR_SIZE;
            } else {
              pretendOutputCursor += DATA_DESCRIPTOR_SIZE;
            }
          }

          centralDirectorySize +=
            CENTRAL_DIRECTORY_RECORD_FIXED_SIZE +
            entry.utf8FileName.length +
            entry.fileComment.length;
          if (useZip64Format) {
            centralDirectorySize += ZIP64_EXTENDED_INFORMATION_EXTRA_FIELD_SIZE;
          }
        }

        var endOfCentralDirectorySize = 0;
        if (
          self.forceZip64Eocd ||
          self.entries.length >= 0xffff ||
          centralDirectorySize >= 0xffff ||
          pretendOutputCursor >= 0xffffffff
        ) {
          // use zip64 end of central directory stuff
          endOfCentralDirectorySize +=
            ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE +
            ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE;
        }
        endOfCentralDirectorySize +=
          END_OF_CENTRAL_DIRECTORY_RECORD_SIZE + self.comment.length;
        return (
          pretendOutputCursor + centralDirectorySize + endOfCentralDirectorySize
        );
      }

      var ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE = 56;
      var ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE = 20;
      var END_OF_CENTRAL_DIRECTORY_RECORD_SIZE = 22;
      function getEndOfCentralDirectoryRecord(
        self,
        actuallyJustTellMeHowLongItWouldBe
      ) {
        var needZip64Format = false;
        var normalEntriesLength = self.entries.length;
        if (self.forceZip64Eocd || self.entries.length >= 0xffff) {
          normalEntriesLength = 0xffff;
          needZip64Format = true;
        }
        var sizeOfCentralDirectory =
          self.outputStreamCursor - self.offsetOfStartOfCentralDirectory;
        var normalSizeOfCentralDirectory = sizeOfCentralDirectory;
        if (self.forceZip64Eocd || sizeOfCentralDirectory >= 0xffffffff) {
          normalSizeOfCentralDirectory = 0xffffffff;
          needZip64Format = true;
        }
        var normalOffsetOfStartOfCentralDirectory =
          self.offsetOfStartOfCentralDirectory;
        if (
          self.forceZip64Eocd ||
          self.offsetOfStartOfCentralDirectory >= 0xffffffff
        ) {
          normalOffsetOfStartOfCentralDirectory = 0xffffffff;
          needZip64Format = true;
        }
        if (actuallyJustTellMeHowLongItWouldBe) {
          if (needZip64Format) {
            return (
              ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE +
              ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE +
              END_OF_CENTRAL_DIRECTORY_RECORD_SIZE
            );
          } else {
            return END_OF_CENTRAL_DIRECTORY_RECORD_SIZE;
          }
        }

        var eocdrBuffer = bufferAlloc(
          END_OF_CENTRAL_DIRECTORY_RECORD_SIZE + self.comment.length
        );
        // end of central dir signature                       4 bytes  (0x06054b50)
        eocdrBuffer.writeUInt32LE(0x06054b50, 0);
        // number of this disk                                2 bytes
        eocdrBuffer.writeUInt16LE(0, 4);
        // number of the disk with the start of the central directory  2 bytes
        eocdrBuffer.writeUInt16LE(0, 6);
        // total number of entries in the central directory on this disk  2 bytes
        eocdrBuffer.writeUInt16LE(normalEntriesLength, 8);
        // total number of entries in the central directory   2 bytes
        eocdrBuffer.writeUInt16LE(normalEntriesLength, 10);
        // size of the central directory                      4 bytes
        eocdrBuffer.writeUInt32LE(normalSizeOfCentralDirectory, 12);
        // offset of start of central directory with respect to the starting disk number  4 bytes
        eocdrBuffer.writeUInt32LE(normalOffsetOfStartOfCentralDirectory, 16);
        // .ZIP file comment length                           2 bytes
        eocdrBuffer.writeUInt16LE(self.comment.length, 20);
        // .ZIP file comment                                  (variable size)
        self.comment.copy(eocdrBuffer, 22);

        if (!needZip64Format) return eocdrBuffer;

        // ZIP64 format
        // ZIP64 End of Central Directory Record
        var zip64EocdrBuffer = bufferAlloc(
          ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE
        );
        // zip64 end of central dir signature                                             4 bytes  (0x06064b50)
        zip64EocdrBuffer.writeUInt32LE(0x06064b50, 0);
        // size of zip64 end of central directory record                                  8 bytes
        writeUInt64LE(
          zip64EocdrBuffer,
          ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE - 12,
          4
        );
        // version made by                                                                2 bytes
        zip64EocdrBuffer.writeUInt16LE(VERSION_MADE_BY, 12);
        // version needed to extract                                                      2 bytes
        zip64EocdrBuffer.writeUInt16LE(VERSION_NEEDED_TO_EXTRACT_ZIP64, 14);
        // number of this disk                                                            4 bytes
        zip64EocdrBuffer.writeUInt32LE(0, 16);
        // number of the disk with the start of the central directory                     4 bytes
        zip64EocdrBuffer.writeUInt32LE(0, 20);
        // total number of entries in the central directory on this disk                  8 bytes
        writeUInt64LE(zip64EocdrBuffer, self.entries.length, 24);
        // total number of entries in the central directory                               8 bytes
        writeUInt64LE(zip64EocdrBuffer, self.entries.length, 32);
        // size of the central directory                                                  8 bytes
        writeUInt64LE(zip64EocdrBuffer, sizeOfCentralDirectory, 40);
        // offset of start of central directory with respect to the starting disk number  8 bytes
        writeUInt64LE(
          zip64EocdrBuffer,
          self.offsetOfStartOfCentralDirectory,
          48
        );
        // zip64 extensible data sector                                                   (variable size)
        // nothing in the zip64 extensible data sector

        // ZIP64 End of Central Directory Locator
        var zip64EocdlBuffer = bufferAlloc(
          ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE
        );
        // zip64 end of central dir locator signature                               4 bytes  (0x07064b50)
        zip64EocdlBuffer.writeUInt32LE(0x07064b50, 0);
        // number of the disk with the start of the zip64 end of central directory  4 bytes
        zip64EocdlBuffer.writeUInt32LE(0, 4);
        // relative offset of the zip64 end of central directory record             8 bytes
        writeUInt64LE(zip64EocdlBuffer, self.outputStreamCursor, 8);
        // total number of disks                                                    4 bytes
        zip64EocdlBuffer.writeUInt32LE(1, 16);

        return Buffer.concat([zip64EocdrBuffer, zip64EocdlBuffer, eocdrBuffer]);
      }

      function validateMetadataPath(metadataPath, isDirectory) {
        if (metadataPath === '') throw new Error('empty metadataPath');
        metadataPath = metadataPath.replace(/\\/g, '/');
        if (/^[a-zA-Z]:/.test(metadataPath) || /^\//.test(metadataPath))
          throw new Error('absolute path: ' + metadataPath);
        if (metadataPath.split('/').indexOf('..') !== -1)
          throw new Error('invalid relative path: ' + metadataPath);
        var looksLikeDirectory = /\/$/.test(metadataPath);
        if (isDirectory) {
          // append a trailing '/' if necessary.
          if (!looksLikeDirectory) metadataPath += '/';
        } else {
          if (looksLikeDirectory)
            throw new Error("file path cannot end with '/': " + metadataPath);
        }
        return metadataPath;
      }

      var EMPTY_BUFFER = bufferAlloc(0);

      // this class is not part of the public API
      function Entry(metadataPath, isDirectory, options) {
        this.utf8FileName = bufferFrom(metadataPath);
        if (this.utf8FileName.length > 0xffff)
          throw new Error(
            'utf8 file name too long. ' + utf8FileName.length + ' > ' + 0xffff
          );
        this.isDirectory = isDirectory;
        this.state = Entry.WAITING_FOR_METADATA;
        this.setLastModDate(options.mtime != null ? options.mtime : new Date());
        if (options.mode != null) {
          this.setFileAttributesMode(options.mode);
        } else {
          this.setFileAttributesMode(isDirectory ? 0o40775 : 0o100664);
        }
        if (isDirectory) {
          this.crcAndFileSizeKnown = true;
          this.crc32 = 0;
          this.uncompressedSize = 0;
          this.compressedSize = 0;
        } else {
          // unknown so far
          this.crcAndFileSizeKnown = false;
          this.crc32 = null;
          this.uncompressedSize = null;
          this.compressedSize = null;
          if (options.size != null) this.uncompressedSize = options.size;
        }
        if (isDirectory) {
          this.compress = false;
        } else {
          this.compress = true; // default
          if (options.compress != null) this.compress = !!options.compress;
        }
        this.forceZip64Format = !!options.forceZip64Format;
        if (options.fileComment) {
          if (typeof options.fileComment === 'string') {
            this.fileComment = bufferFrom(options.fileComment, 'utf-8');
          } else {
            // It should be a Buffer
            this.fileComment = options.fileComment;
          }
          if (this.fileComment.length > 0xffff)
            throw new Error('fileComment is too large');
        } else {
          // no comment.
          this.fileComment = EMPTY_BUFFER;
        }
      }
      Entry.WAITING_FOR_METADATA = 0;
      Entry.READY_TO_PUMP_FILE_DATA = 1;
      Entry.FILE_DATA_IN_PROGRESS = 2;
      Entry.FILE_DATA_DONE = 3;
      Entry.prototype.setLastModDate = function (date) {
        var dosDateTime = dateToDosDateTime(date);
        this.lastModFileTime = dosDateTime.time;
        this.lastModFileDate = dosDateTime.date;
      };
      Entry.prototype.setFileAttributesMode = function (mode) {
        if ((mode & 0xffff) !== mode)
          throw new Error(
            'invalid mode. expected: 0 <= ' + mode + ' <= ' + 0xffff
          );
        // http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute/14727#14727
        this.externalFileAttributes = (mode << 16) >>> 0;
      };
      // doFileDataPump() should not call pumpEntries() directly. see issue #9.
      Entry.prototype.setFileDataPumpFunction = function (doFileDataPump) {
        this.doFileDataPump = doFileDataPump;
        this.state = Entry.READY_TO_PUMP_FILE_DATA;
      };
      Entry.prototype.useZip64Format = function () {
        return (
          this.forceZip64Format ||
          (this.uncompressedSize != null &&
            this.uncompressedSize > 0xfffffffe) ||
          (this.compressedSize != null && this.compressedSize > 0xfffffffe) ||
          (this.relativeOffsetOfLocalHeader != null &&
            this.relativeOffsetOfLocalHeader > 0xfffffffe)
        );
      };
      var LOCAL_FILE_HEADER_FIXED_SIZE = 30;
      var VERSION_NEEDED_TO_EXTRACT_UTF8 = 20;
      var VERSION_NEEDED_TO_EXTRACT_ZIP64 = 45;
      // 3 = unix. 63 = spec version 6.3
      var VERSION_MADE_BY = (3 << 8) | 63;
      var FILE_NAME_IS_UTF8 = 1 << 11;
      var UNKNOWN_CRC32_AND_FILE_SIZES = 1 << 3;
      Entry.prototype.getLocalFileHeader = function () {
        var crc32 = 0;
        var compressedSize = 0;
        var uncompressedSize = 0;
        if (this.crcAndFileSizeKnown) {
          crc32 = this.crc32;
          compressedSize = this.compressedSize;
          uncompressedSize = this.uncompressedSize;
        }

        var fixedSizeStuff = bufferAlloc(LOCAL_FILE_HEADER_FIXED_SIZE);
        var generalPurposeBitFlag = FILE_NAME_IS_UTF8;
        if (!this.crcAndFileSizeKnown)
          generalPurposeBitFlag |= UNKNOWN_CRC32_AND_FILE_SIZES;

        // local file header signature     4 bytes  (0x04034b50)
        fixedSizeStuff.writeUInt32LE(0x04034b50, 0);
        // version needed to extract       2 bytes
        fixedSizeStuff.writeUInt16LE(VERSION_NEEDED_TO_EXTRACT_UTF8, 4);
        // general purpose bit flag        2 bytes
        fixedSizeStuff.writeUInt16LE(generalPurposeBitFlag, 6);
        // compression method              2 bytes
        fixedSizeStuff.writeUInt16LE(this.getCompressionMethod(), 8);
        // last mod file time              2 bytes
        fixedSizeStuff.writeUInt16LE(this.lastModFileTime, 10);
        // last mod file date              2 bytes
        fixedSizeStuff.writeUInt16LE(this.lastModFileDate, 12);
        // crc-32                          4 bytes
        fixedSizeStuff.writeUInt32LE(crc32, 14);
        // compressed size                 4 bytes
        fixedSizeStuff.writeUInt32LE(compressedSize, 18);
        // uncompressed size               4 bytes
        fixedSizeStuff.writeUInt32LE(uncompressedSize, 22);
        // file name length                2 bytes
        fixedSizeStuff.writeUInt16LE(this.utf8FileName.length, 26);
        // extra field length              2 bytes
        fixedSizeStuff.writeUInt16LE(0, 28);
        return Buffer.concat([
          fixedSizeStuff,
          // file name (variable size)
          this.utf8FileName,
          // extra field (variable size)
          // no extra fields
        ]);
      };
      var DATA_DESCRIPTOR_SIZE = 16;
      var ZIP64_DATA_DESCRIPTOR_SIZE = 24;
      Entry.prototype.getDataDescriptor = function () {
        if (this.crcAndFileSizeKnown) {
          // the Mac Archive Utility requires this not be present unless we set general purpose bit 3
          return EMPTY_BUFFER;
        }
        if (!this.useZip64Format()) {
          var buffer = bufferAlloc(DATA_DESCRIPTOR_SIZE);
          // optional signature (required according to Archive Utility)
          buffer.writeUInt32LE(0x08074b50, 0);
          // crc-32                          4 bytes
          buffer.writeUInt32LE(this.crc32, 4);
          // compressed size                 4 bytes
          buffer.writeUInt32LE(this.compressedSize, 8);
          // uncompressed size               4 bytes
          buffer.writeUInt32LE(this.uncompressedSize, 12);
          return buffer;
        } else {
          // ZIP64 format
          var buffer = bufferAlloc(ZIP64_DATA_DESCRIPTOR_SIZE);
          // optional signature (unknown if anyone cares about this)
          buffer.writeUInt32LE(0x08074b50, 0);
          // crc-32                          4 bytes
          buffer.writeUInt32LE(this.crc32, 4);
          // compressed size                 8 bytes
          writeUInt64LE(buffer, this.compressedSize, 8);
          // uncompressed size               8 bytes
          writeUInt64LE(buffer, this.uncompressedSize, 16);
          return buffer;
        }
      };
      var CENTRAL_DIRECTORY_RECORD_FIXED_SIZE = 46;
      var ZIP64_EXTENDED_INFORMATION_EXTRA_FIELD_SIZE = 28;
      Entry.prototype.getCentralDirectoryRecord = function () {
        var fixedSizeStuff = bufferAlloc(CENTRAL_DIRECTORY_RECORD_FIXED_SIZE);
        var generalPurposeBitFlag = FILE_NAME_IS_UTF8;
        if (!this.crcAndFileSizeKnown)
          generalPurposeBitFlag |= UNKNOWN_CRC32_AND_FILE_SIZES;

        var normalCompressedSize = this.compressedSize;
        var normalUncompressedSize = this.uncompressedSize;
        var normalRelativeOffsetOfLocalHeader = this
          .relativeOffsetOfLocalHeader;
        var versionNeededToExtract;
        var zeiefBuffer;
        if (this.useZip64Format()) {
          normalCompressedSize = 0xffffffff;
          normalUncompressedSize = 0xffffffff;
          normalRelativeOffsetOfLocalHeader = 0xffffffff;
          versionNeededToExtract = VERSION_NEEDED_TO_EXTRACT_ZIP64;

          // ZIP64 extended information extra field
          zeiefBuffer = bufferAlloc(
            ZIP64_EXTENDED_INFORMATION_EXTRA_FIELD_SIZE
          );
          // 0x0001                  2 bytes    Tag for this "extra" block type
          zeiefBuffer.writeUInt16LE(0x0001, 0);
          // Size                    2 bytes    Size of this "extra" block
          zeiefBuffer.writeUInt16LE(
            ZIP64_EXTENDED_INFORMATION_EXTRA_FIELD_SIZE - 4,
            2
          );
          // Original Size           8 bytes    Original uncompressed file size
          writeUInt64LE(zeiefBuffer, this.uncompressedSize, 4);
          // Compressed Size         8 bytes    Size of compressed data
          writeUInt64LE(zeiefBuffer, this.compressedSize, 12);
          // Relative Header Offset  8 bytes    Offset of local header record
          writeUInt64LE(zeiefBuffer, this.relativeOffsetOfLocalHeader, 20);
          // Disk Start Number       4 bytes    Number of the disk on which this file starts
          // (omit)
        } else {
          versionNeededToExtract = VERSION_NEEDED_TO_EXTRACT_UTF8;
          zeiefBuffer = EMPTY_BUFFER;
        }

        // central file header signature   4 bytes  (0x02014b50)
        fixedSizeStuff.writeUInt32LE(0x02014b50, 0);
        // version made by                 2 bytes
        fixedSizeStuff.writeUInt16LE(VERSION_MADE_BY, 4);
        // version needed to extract       2 bytes
        fixedSizeStuff.writeUInt16LE(versionNeededToExtract, 6);
        // general purpose bit flag        2 bytes
        fixedSizeStuff.writeUInt16LE(generalPurposeBitFlag, 8);
        // compression method              2 bytes
        fixedSizeStuff.writeUInt16LE(this.getCompressionMethod(), 10);
        // last mod file time              2 bytes
        fixedSizeStuff.writeUInt16LE(this.lastModFileTime, 12);
        // last mod file date              2 bytes
        fixedSizeStuff.writeUInt16LE(this.lastModFileDate, 14);
        // crc-32                          4 bytes
        fixedSizeStuff.writeUInt32LE(this.crc32, 16);
        // compressed size                 4 bytes
        fixedSizeStuff.writeUInt32LE(normalCompressedSize, 20);
        // uncompressed size               4 bytes
        fixedSizeStuff.writeUInt32LE(normalUncompressedSize, 24);
        // file name length                2 bytes
        fixedSizeStuff.writeUInt16LE(this.utf8FileName.length, 28);
        // extra field length              2 bytes
        fixedSizeStuff.writeUInt16LE(zeiefBuffer.length, 30);
        // file comment length             2 bytes
        fixedSizeStuff.writeUInt16LE(this.fileComment.length, 32);
        // disk number start               2 bytes
        fixedSizeStuff.writeUInt16LE(0, 34);
        // internal file attributes        2 bytes
        fixedSizeStuff.writeUInt16LE(0, 36);
        // external file attributes        4 bytes
        fixedSizeStuff.writeUInt32LE(this.externalFileAttributes, 38);
        // relative offset of local header 4 bytes
        fixedSizeStuff.writeUInt32LE(normalRelativeOffsetOfLocalHeader, 42);

        return Buffer.concat([
          fixedSizeStuff,
          // file name (variable size)
          this.utf8FileName,
          // extra field (variable size)
          zeiefBuffer,
          // file comment (variable size)
          this.fileComment,
        ]);
      };
      Entry.prototype.getCompressionMethod = function () {
        var NO_COMPRESSION = 0;
        var DEFLATE_COMPRESSION = 8;
        return this.compress ? DEFLATE_COMPRESSION : NO_COMPRESSION;
      };

      function dateToDosDateTime(jsDate) {
        var date = 0;
        date |= jsDate.getDate() & 0x1f; // 1-31
        date |= ((jsDate.getMonth() + 1) & 0xf) << 5; // 0-11, 1-12
        date |= ((jsDate.getFullYear() - 1980) & 0x7f) << 9; // 0-128, 1980-2108

        var time = 0;
        time |= Math.floor(jsDate.getSeconds() / 2); // 0-59, 0-29 (lose odd numbers)
        time |= (jsDate.getMinutes() & 0x3f) << 5; // 0-59
        time |= (jsDate.getHours() & 0x1f) << 11; // 0-23

        return { date: date, time: time };
      }

      function writeUInt64LE(buffer, n, offset) {
        // can't use bitshift here, because JavaScript only allows bitshifting on 32-bit integers.
        var high = Math.floor(n / 0x100000000);
        var low = n % 0x100000000;
        buffer.writeUInt32LE(low, offset);
        buffer.writeUInt32LE(high, offset + 4);
      }

      function defaultCallback(err) {
        if (err) throw err;
      }

      util.inherits(ByteCounter, Transform);
      function ByteCounter(options) {
        Transform.call(this, options);
        this.byteCount = 0;
      }
      ByteCounter.prototype._transform = function (chunk, encoding, cb) {
        this.byteCount += chunk.length;
        cb(null, chunk);
      };

      util.inherits(Crc32Watcher, Transform);
      function Crc32Watcher(options) {
        Transform.call(this, options);
        this.crc32 = 0;
      }
      Crc32Watcher.prototype._transform = function (chunk, encoding, cb) {
        this.crc32 = crc32.unsigned(chunk, this.crc32);
        cb(null, chunk);
      };

      var cp437 =
        '\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
      if (cp437.length !== 256) throw new Error('assertion failure');
      var reverseCp437 = null;

      function encodeCp437(string) {
        if (/^[\x20-\x7e]*$/.test(string)) {
          // CP437, ASCII, and UTF-8 overlap in this range.
          return bufferFrom(string, 'utf-8');
        }

        // This is the slow path.
        if (reverseCp437 == null) {
          // cache this once
          reverseCp437 = {};
          for (var i = 0; i < cp437.length; i++) {
            reverseCp437[cp437[i]] = i;
          }
        }

        var result = bufferAlloc(string.length);
        for (var i = 0; i < string.length; i++) {
          var b = reverseCp437[string[i]];
          if (b == null)
            throw new Error(
              'character not encodable in CP437: ' + JSON.stringify(string[i])
            );
          result[i] = b;
        }

        return result;
      }

      function bufferAlloc(size) {
        bufferAlloc = modern;
        try {
          return bufferAlloc(size);
        } catch (e) {
          bufferAlloc = legacy;
          return bufferAlloc(size);
        }
        function modern(size) {
          return Buffer.allocUnsafe(size);
        }
        function legacy(size) {
          return new Buffer(size);
        }
      }
      function bufferFrom(something, encoding) {
        bufferFrom = modern;
        try {
          return bufferFrom(something, encoding);
        } catch (e) {
          bufferFrom = legacy;
          return bufferFrom(something, encoding);
        }
        function modern(something, encoding) {
          return Buffer.from(something, encoding);
        }
        function legacy(something, encoding) {
          return new Buffer(something, encoding);
        }
      }
      function bufferIncludes(buffer, content) {
        bufferIncludes = modern;
        try {
          return bufferIncludes(buffer, content);
        } catch (e) {
          bufferIncludes = legacy;
          return bufferIncludes(buffer, content);
        }
        function modern(buffer, content) {
          return buffer.includes(content);
        }
        function legacy(buffer, content) {
          for (var i = 0; i <= buffer.length - content.length; i++) {
            for (var j = 0; ; j++) {
              if (j === content.length) return true;
              if (buffer[i + j] !== content[j]) break;
            }
          }
          return false;
        }
      }

      /***/
    },

    /***/ 502: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const fs = __webpack_require__(747);
      const path = __webpack_require__(622);
      const mkdir = __webpack_require__(648);
      const remove = __webpack_require__(301);

      const emptyDir = u(function emptyDir(dir, callback) {
        callback = callback || function () {};
        fs.readdir(dir, (err, items) => {
          if (err) return mkdir.mkdirs(dir, callback);

          items = items.map(item => path.join(dir, item));

          deleteItem();

          function deleteItem() {
            const item = items.pop();
            if (!item) return callback();
            remove.remove(item, err => {
              if (err) return callback(err);
              deleteItem();
            });
          }
        });
      });

      function emptyDirSync(dir) {
        let items;
        try {
          items = fs.readdirSync(dir);
        } catch (err) {
          return mkdir.mkdirsSync(dir);
        }

        items.forEach(item => {
          item = path.join(dir, item);
          remove.removeSync(item);
        });
      }

      module.exports = {
        emptyDirSync,
        emptydirSync: emptyDirSync,
        emptyDir,
        emptydir: emptyDir,
      };

      /***/
    },

    /***/ 517: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);

      function symlinkType(srcpath, type, callback) {
        callback = typeof type === 'function' ? type : callback;
        type = typeof type === 'function' ? false : type;
        if (type) return callback(null, type);
        fs.lstat(srcpath, (err, stats) => {
          if (err) return callback(null, 'file');
          type = stats && stats.isDirectory() ? 'dir' : 'file';
          callback(null, type);
        });
      }

      function symlinkTypeSync(srcpath, type) {
        let stats;

        if (type) return type;
        try {
          stats = fs.lstatSync(srcpath);
        } catch (e) {
          return 'file';
        }
        return stats && stats.isDirectory() ? 'dir' : 'file';
      }

      module.exports = {
        symlinkType,
        symlinkTypeSync,
      };

      /***/
    },

    /***/ 518: /***/ function (module) {
      'use strict';

      /* eslint-disable node/no-deprecated-api */
      module.exports = function (size) {
        if (typeof Buffer.allocUnsafe === 'function') {
          try {
            return Buffer.allocUnsafe(size);
          } catch (e) {
            return new Buffer(size);
          }
        }
        return new Buffer(size);
      };

      /***/
    },

    /***/ 553: /***/ function (__unusedmodule, exports, __webpack_require__) {
      'use strict';

      var __importDefault =
        (this && this.__importDefault) ||
        function (mod) {
          return mod && mod.__esModule ? mod : { default: mod };
        };
      Object.defineProperty(exports, '__esModule', { value: true });
      const resolve_from_1 = __importDefault(__webpack_require__(101));
      const url_1 = __webpack_require__(835);
      const get_port_1 = __importDefault(__webpack_require__(592));
      const http_1 = __webpack_require__(605);
      const utils_1 = __webpack_require__(239);
      process.on('unhandledRejection', err => {
        console.error('Exiting builder due to build error:');
        console.error(err);
        process.exit(1);
      });
      process.once('message', async ({ dir, runtimeEnv }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const next = require(resolve_from_1.default(dir, 'next'));
        const app = next({ dev: true, dir });
        const handler = app.getRequestHandler();
        const [openPort] = await Promise.all([
          get_port_1.default(),
          app.prepare(),
        ]);
        const url = `http://localhost:${openPort}`;
        utils_1.syncEnvVars(process.env, process.env, runtimeEnv);
        http_1
          .createServer((req, res) => {
            const parsedUrl = url_1.parse(req.url || '', true);
            handler(req, res, parsedUrl);
          })
          .listen(openPort, () => {
            if (process.send) {
              process.send(url);
            }
          });
      });

      /***/
    },

    /***/ 592: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const net = __webpack_require__(631);

      const getAvailablePort = options =>
        new Promise((resolve, reject) => {
          const server = net.createServer();
          server.unref();
          server.on('error', reject);
          server.listen(options, () => {
            const { port } = server.address();
            server.close(() => {
              resolve(port);
            });
          });
        });

      const portCheckSequence = function* (ports) {
        if (ports) {
          yield* ports;
        }

        yield 0; // Fall back to 0 if anything else failed
      };

      module.exports = async options => {
        let ports = null;

        if (options) {
          ports =
            typeof options.port === 'number' ? [options.port] : options.port;
        }

        for (const port of portCheckSequence(ports)) {
          try {
            return await getAvailablePort({ ...options, port }); // eslint-disable-line no-await-in-loop
          } catch (error) {
            if (error.code !== 'EADDRINUSE') {
              throw error;
            }
          }
        }

        throw new Error('No available ports found');
      };

      module.exports.makeRange = (from, to) => {
        if (!Number.isInteger(from) || !Number.isInteger(to)) {
          throw new TypeError('`from` and `to` must be integer numbers');
        }

        if (from < 1024 || from > 65535) {
          throw new RangeError('`from` must be between 1024 and 65535');
        }

        if (to < 1024 || to > 65536) {
          throw new RangeError('`to` must be between 1024 and 65536');
        }

        if (to < from) {
          throw new RangeError('`to` must be greater than or equal to `from`');
        }

        const generator = function* (from, to) {
          for (let port = from; port <= to; port++) {
            yield port;
          }
        };

        return generator(from, to);
      };

      /***/
    },

    /***/ 605: /***/ function (module) {
      module.exports = require('http');

      /***/
    },

    /***/ 608: /***/ function (__unusedmodule, exports, __webpack_require__) {
      'use strict';

      Object.defineProperty(exports, '__esModule', { value: true });
      let buildUtils;
      try {
        buildUtils = __webpack_require__(445);
      } catch (e) {
        // Fallback for older CLI versions
        buildUtils = __webpack_require__(688);
      }
      exports.default = buildUtils;

      /***/
    },

    /***/ 614: /***/ function (module) {
      module.exports = require('events');

      /***/
    },

    /***/ 619: /***/ function (module) {
      module.exports = require('constants');

      /***/
    },

    /***/ 622: /***/ function (module) {
      module.exports = require('path');

      /***/
    },

    /***/ 624: /***/ function (__unusedmodule, exports, __webpack_require__) {
      'use strict';

      var __importDefault =
        (this && this.__importDefault) ||
        function (mod) {
          return mod && mod.__esModule ? mod : { default: mod };
        };
      Object.defineProperty(exports, '__esModule', { value: true });
      const events_1 = __importDefault(__webpack_require__(614));
      function arrayMove(src, srcIndex, dst, dstIndex, len) {
        for (let j = 0; j < len; ++j) {
          dst[j + dstIndex] = src[j + srcIndex];
          src[j + srcIndex] = void 0;
        }
      }
      function pow2AtLeast(n) {
        n = n >>> 0;
        n = n - 1;
        n = n | (n >> 1);
        n = n | (n >> 2);
        n = n | (n >> 4);
        n = n | (n >> 8);
        n = n | (n >> 16);
        return n + 1;
      }
      function getCapacity(capacity) {
        return pow2AtLeast(Math.min(Math.max(16, capacity), 1073741824));
      }
      // Deque is based on https://github.com/petkaantonov/deque/blob/master/js/deque.js
      // Released under the MIT License: https://github.com/petkaantonov/deque/blob/6ef4b6400ad3ba82853fdcc6531a38eb4f78c18c/LICENSE
      class Deque {
        constructor(capacity) {
          this._capacity = getCapacity(capacity);
          this._length = 0;
          this._front = 0;
          this.arr = [];
        }
        push(item) {
          const length = this._length;
          this.checkCapacity(length + 1);
          const i = (this._front + length) & (this._capacity - 1);
          this.arr[i] = item;
          this._length = length + 1;
          return length + 1;
        }
        pop() {
          const length = this._length;
          if (length === 0) {
            return void 0;
          }
          const i = (this._front + length - 1) & (this._capacity - 1);
          const ret = this.arr[i];
          this.arr[i] = void 0;
          this._length = length - 1;
          return ret;
        }
        shift() {
          const length = this._length;
          if (length === 0) {
            return void 0;
          }
          const front = this._front;
          const ret = this.arr[front];
          this.arr[front] = void 0;
          this._front = (front + 1) & (this._capacity - 1);
          this._length = length - 1;
          return ret;
        }
        get length() {
          return this._length;
        }
        checkCapacity(size) {
          if (this._capacity < size) {
            this.resizeTo(getCapacity(this._capacity * 1.5 + 16));
          }
        }
        resizeTo(capacity) {
          const oldCapacity = this._capacity;
          this._capacity = capacity;
          const front = this._front;
          const length = this._length;
          if (front + length > oldCapacity) {
            const moveItemsCount = (front + length) & (oldCapacity - 1);
            arrayMove(this.arr, 0, this.arr, oldCapacity, moveItemsCount);
          }
        }
      }
      class ReleaseEmitter extends events_1.default {}
      function isFn(x) {
        return typeof x === 'function';
      }
      function defaultInit() {
        return '1';
      }
      class Sema {
        constructor(
          nr,
          { initFn = defaultInit, pauseFn, resumeFn, capacity = 10 } = {}
        ) {
          if (isFn(pauseFn) !== isFn(resumeFn)) {
            throw new Error(
              'pauseFn and resumeFn must be both set for pausing'
            );
          }
          this.nrTokens = nr;
          this.free = new Deque(nr);
          this.waiting = new Deque(capacity);
          this.releaseEmitter = new ReleaseEmitter();
          this.noTokens = initFn === defaultInit;
          this.pauseFn = pauseFn;
          this.resumeFn = resumeFn;
          this.paused = false;
          this.releaseEmitter.on('release', token => {
            const p = this.waiting.shift();
            if (p) {
              p.resolve(token);
            } else {
              if (this.resumeFn && this.paused) {
                this.paused = false;
                this.resumeFn();
              }
              this.free.push(token);
            }
          });
          for (let i = 0; i < nr; i++) {
            this.free.push(initFn());
          }
        }
        async acquire() {
          let token = this.free.pop();
          if (token !== void 0) {
            return token;
          }
          return new Promise((resolve, reject) => {
            if (this.pauseFn && !this.paused) {
              this.paused = true;
              this.pauseFn();
            }
            this.waiting.push({ resolve, reject });
          });
        }
        release(token) {
          this.releaseEmitter.emit('release', this.noTokens ? '1' : token);
        }
        drain() {
          const a = new Array(this.nrTokens);
          for (let i = 0; i < this.nrTokens; i++) {
            a[i] = this.acquire();
          }
          return Promise.all(a);
        }
        nrWaiting() {
          return this.waiting.length;
        }
      }
      exports.Sema = Sema;
      function RateLimit(
        rps,
        { timeUnit = 1000, uniformDistribution = false } = {}
      ) {
        const sema = new Sema(uniformDistribution ? 1 : rps);
        const delay = uniformDistribution ? timeUnit / rps : timeUnit;
        return async function rl() {
          await sema.acquire();
          setTimeout(() => sema.release(), delay);
        };
      }
      exports.RateLimit = RateLimit;

      /***/
    },

    /***/ 631: /***/ function (module) {
      module.exports = require('net');

      /***/
    },

    /***/ 648: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const mkdirs = u(__webpack_require__(171));
      const mkdirsSync = __webpack_require__(452);

      module.exports = {
        mkdirs,
        mkdirsSync,
        // alias
        mkdirp: mkdirs,
        mkdirpSync: mkdirsSync,
        ensureDir: mkdirs,
        ensureDirSync: mkdirsSync,
      };

      /***/
    },

    /***/ 667: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const copySync = __webpack_require__(161).copySync;
      const removeSync = __webpack_require__(301).removeSync;
      const mkdirpSync = __webpack_require__(648).mkdirsSync;
      const buffer = __webpack_require__(518);

      function moveSync(src, dest, options) {
        options = options || {};
        const overwrite = options.overwrite || options.clobber || false;

        src = path.resolve(src);
        dest = path.resolve(dest);

        if (src === dest) return fs.accessSync(src);

        if (isSrcSubdir(src, dest))
          throw new Error(`Cannot move '${src}' into itself '${dest}'.`);

        mkdirpSync(path.dirname(dest));
        tryRenameSync();

        function tryRenameSync() {
          if (overwrite) {
            try {
              return fs.renameSync(src, dest);
            } catch (err) {
              if (
                err.code === 'ENOTEMPTY' ||
                err.code === 'EEXIST' ||
                err.code === 'EPERM'
              ) {
                removeSync(dest);
                options.overwrite = false; // just overwriteed it, no need to do it again
                return moveSync(src, dest, options);
              }

              if (err.code !== 'EXDEV') throw err;
              return moveSyncAcrossDevice(src, dest, overwrite);
            }
          } else {
            try {
              fs.linkSync(src, dest);
              return fs.unlinkSync(src);
            } catch (err) {
              if (
                err.code === 'EXDEV' ||
                err.code === 'EISDIR' ||
                err.code === 'EPERM' ||
                err.code === 'ENOTSUP'
              ) {
                return moveSyncAcrossDevice(src, dest, overwrite);
              }
              throw err;
            }
          }
        }
      }

      function moveSyncAcrossDevice(src, dest, overwrite) {
        const stat = fs.statSync(src);

        if (stat.isDirectory()) {
          return moveDirSyncAcrossDevice(src, dest, overwrite);
        } else {
          return moveFileSyncAcrossDevice(src, dest, overwrite);
        }
      }

      function moveFileSyncAcrossDevice(src, dest, overwrite) {
        const BUF_LENGTH = 64 * 1024;
        const _buff = buffer(BUF_LENGTH);

        const flags = overwrite ? 'w' : 'wx';

        const fdr = fs.openSync(src, 'r');
        const stat = fs.fstatSync(fdr);
        const fdw = fs.openSync(dest, flags, stat.mode);
        let pos = 0;

        while (pos < stat.size) {
          const bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
          fs.writeSync(fdw, _buff, 0, bytesRead);
          pos += bytesRead;
        }

        fs.closeSync(fdr);
        fs.closeSync(fdw);
        return fs.unlinkSync(src);
      }

      function moveDirSyncAcrossDevice(src, dest, overwrite) {
        const options = {
          overwrite: false,
        };

        if (overwrite) {
          removeSync(dest);
          tryCopySync();
        } else {
          tryCopySync();
        }

        function tryCopySync() {
          copySync(src, dest, options);
          return removeSync(src);
        }
      }

      // return true if dest is a subdir of src, otherwise false.
      // extract dest base dir and check if that is the same as src basename
      function isSrcSubdir(src, dest) {
        try {
          return (
            fs.statSync(src).isDirectory() &&
            src !== dest &&
            dest.indexOf(src) > -1 &&
            dest.split(path.dirname(src) + path.sep)[1].split(path.sep)[0] ===
              path.basename(src)
          );
        } catch (e) {
          return false;
        }
      }

      module.exports = {
        moveSync,
      };

      /***/
    },

    /***/ 669: /***/ function (module) {
      module.exports = require('util');

      /***/
    },

    /***/ 688: /***/ function (module) {
      module.exports = require('@now/build-utils');

      /***/
    },

    /***/ 718: /***/ function (module) {
      'use strict';

      module.exports = clone;

      function clone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;

        if (obj instanceof Object) var copy = { __proto__: obj.__proto__ };
        else var copy = Object.create(null);

        Object.getOwnPropertyNames(obj).forEach(function (key) {
          Object.defineProperty(
            copy,
            key,
            Object.getOwnPropertyDescriptor(obj, key)
          );
        });

        return copy;
      }

      /***/
    },

    /***/ 719: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const mkdir = __webpack_require__(648);
      const pathExists = __webpack_require__(370).pathExists;

      function outputFile(file, data, encoding, callback) {
        if (typeof encoding === 'function') {
          callback = encoding;
          encoding = 'utf8';
        }

        const dir = path.dirname(file);
        pathExists(dir, (err, itDoes) => {
          if (err) return callback(err);
          if (itDoes) return fs.writeFile(file, data, encoding, callback);

          mkdir.mkdirs(dir, err => {
            if (err) return callback(err);

            fs.writeFile(file, data, encoding, callback);
          });
        });
      }

      function outputFileSync(file, ...args) {
        const dir = path.dirname(file);
        if (fs.existsSync(dir)) {
          return fs.writeFileSync(file, ...args);
        }
        mkdir.mkdirsSync(dir);
        fs.writeFileSync(file, ...args);
      }

      module.exports = {
        outputFile: u(outputFile),
        outputFileSync,
      };

      /***/
    },

    /***/ 729: /***/ function (module, __unusedexports, __webpack_require__) {
      var fs = __webpack_require__(747);
      var polyfills = __webpack_require__(782);
      var legacy = __webpack_require__(825);
      var clone = __webpack_require__(718);

      var util = __webpack_require__(669);

      /* istanbul ignore next - node 0.x polyfill */
      var gracefulQueue;
      var previousSymbol;

      /* istanbul ignore else - node 0.x polyfill */
      if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
        gracefulQueue = Symbol.for('graceful-fs.queue');
        // This is used in testing by future versions
        previousSymbol = Symbol.for('graceful-fs.previous');
      } else {
        gracefulQueue = '___graceful-fs.queue';
        previousSymbol = '___graceful-fs.previous';
      }

      function noop() {}

      function publishQueue(context, queue) {
        Object.defineProperty(context, gracefulQueue, {
          get: function () {
            return queue;
          },
        });
      }

      var debug = noop;
      if (util.debuglog) debug = util.debuglog('gfs4');
      else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
        debug = function () {
          var m = util.format.apply(util, arguments);
          m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
          console.error(m);
        };

      // Once time initialization
      if (!fs[gracefulQueue]) {
        // This queue can be shared by multiple loaded instances
        var queue = global[gracefulQueue] || [];
        publishQueue(fs, queue);

        // Patch fs.close/closeSync to shared queue version, because we need
        // to retry() whenever a close happens *anywhere* in the program.
        // This is essential when multiple graceful-fs instances are
        // in play at the same time.
        fs.close = (function (fs$close) {
          function close(fd, cb) {
            return fs$close.call(fs, fd, function (err) {
              // This function uses the graceful-fs shared queue
              if (!err) {
                retry();
              }

              if (typeof cb === 'function') cb.apply(this, arguments);
            });
          }

          Object.defineProperty(close, previousSymbol, {
            value: fs$close,
          });
          return close;
        })(fs.close);

        fs.closeSync = (function (fs$closeSync) {
          function closeSync(fd) {
            // This function uses the graceful-fs shared queue
            fs$closeSync.apply(fs, arguments);
            retry();
          }

          Object.defineProperty(closeSync, previousSymbol, {
            value: fs$closeSync,
          });
          return closeSync;
        })(fs.closeSync);

        if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
          process.on('exit', function () {
            debug(fs[gracefulQueue]);
            __webpack_require__(357).equal(fs[gracefulQueue].length, 0);
          });
        }
      }

      if (!global[gracefulQueue]) {
        publishQueue(global, fs[gracefulQueue]);
      }

      module.exports = patch(clone(fs));
      if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
        module.exports = patch(fs);
        fs.__patched = true;
      }

      function patch(fs) {
        // Everything that references the open() function needs to be in here
        polyfills(fs);
        fs.gracefulify = patch;

        fs.createReadStream = createReadStream;
        fs.createWriteStream = createWriteStream;
        var fs$readFile = fs.readFile;
        fs.readFile = readFile;
        function readFile(path, options, cb) {
          if (typeof options === 'function') (cb = options), (options = null);

          return go$readFile(path, options, cb);

          function go$readFile(path, options, cb) {
            return fs$readFile(path, options, function (err) {
              if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
                enqueue([go$readFile, [path, options, cb]]);
              else {
                if (typeof cb === 'function') cb.apply(this, arguments);
                retry();
              }
            });
          }
        }

        var fs$writeFile = fs.writeFile;
        fs.writeFile = writeFile;
        function writeFile(path, data, options, cb) {
          if (typeof options === 'function') (cb = options), (options = null);

          return go$writeFile(path, data, options, cb);

          function go$writeFile(path, data, options, cb) {
            return fs$writeFile(path, data, options, function (err) {
              if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
                enqueue([go$writeFile, [path, data, options, cb]]);
              else {
                if (typeof cb === 'function') cb.apply(this, arguments);
                retry();
              }
            });
          }
        }

        var fs$appendFile = fs.appendFile;
        if (fs$appendFile) fs.appendFile = appendFile;
        function appendFile(path, data, options, cb) {
          if (typeof options === 'function') (cb = options), (options = null);

          return go$appendFile(path, data, options, cb);

          function go$appendFile(path, data, options, cb) {
            return fs$appendFile(path, data, options, function (err) {
              if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
                enqueue([go$appendFile, [path, data, options, cb]]);
              else {
                if (typeof cb === 'function') cb.apply(this, arguments);
                retry();
              }
            });
          }
        }

        var fs$readdir = fs.readdir;
        fs.readdir = readdir;
        function readdir(path, options, cb) {
          var args = [path];
          if (typeof options !== 'function') {
            args.push(options);
          } else {
            cb = options;
          }
          args.push(go$readdir$cb);

          return go$readdir(args);

          function go$readdir$cb(err, files) {
            if (files && files.sort) files.sort();

            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$readdir, [args]]);
            else {
              if (typeof cb === 'function') cb.apply(this, arguments);
              retry();
            }
          }
        }

        function go$readdir(args) {
          return fs$readdir.apply(fs, args);
        }

        if (process.version.substr(0, 4) === 'v0.8') {
          var legStreams = legacy(fs);
          ReadStream = legStreams.ReadStream;
          WriteStream = legStreams.WriteStream;
        }

        var fs$ReadStream = fs.ReadStream;
        if (fs$ReadStream) {
          ReadStream.prototype = Object.create(fs$ReadStream.prototype);
          ReadStream.prototype.open = ReadStream$open;
        }

        var fs$WriteStream = fs.WriteStream;
        if (fs$WriteStream) {
          WriteStream.prototype = Object.create(fs$WriteStream.prototype);
          WriteStream.prototype.open = WriteStream$open;
        }

        Object.defineProperty(fs, 'ReadStream', {
          get: function () {
            return ReadStream;
          },
          set: function (val) {
            ReadStream = val;
          },
          enumerable: true,
          configurable: true,
        });
        Object.defineProperty(fs, 'WriteStream', {
          get: function () {
            return WriteStream;
          },
          set: function (val) {
            WriteStream = val;
          },
          enumerable: true,
          configurable: true,
        });

        // legacy names
        var FileReadStream = ReadStream;
        Object.defineProperty(fs, 'FileReadStream', {
          get: function () {
            return FileReadStream;
          },
          set: function (val) {
            FileReadStream = val;
          },
          enumerable: true,
          configurable: true,
        });
        var FileWriteStream = WriteStream;
        Object.defineProperty(fs, 'FileWriteStream', {
          get: function () {
            return FileWriteStream;
          },
          set: function (val) {
            FileWriteStream = val;
          },
          enumerable: true,
          configurable: true,
        });

        function ReadStream(path, options) {
          if (this instanceof ReadStream)
            return fs$ReadStream.apply(this, arguments), this;
          else
            return ReadStream.apply(
              Object.create(ReadStream.prototype),
              arguments
            );
        }

        function ReadStream$open() {
          var that = this;
          open(that.path, that.flags, that.mode, function (err, fd) {
            if (err) {
              if (that.autoClose) that.destroy();

              that.emit('error', err);
            } else {
              that.fd = fd;
              that.emit('open', fd);
              that.read();
            }
          });
        }

        function WriteStream(path, options) {
          if (this instanceof WriteStream)
            return fs$WriteStream.apply(this, arguments), this;
          else
            return WriteStream.apply(
              Object.create(WriteStream.prototype),
              arguments
            );
        }

        function WriteStream$open() {
          var that = this;
          open(that.path, that.flags, that.mode, function (err, fd) {
            if (err) {
              that.destroy();
              that.emit('error', err);
            } else {
              that.fd = fd;
              that.emit('open', fd);
            }
          });
        }

        function createReadStream(path, options) {
          return new fs.ReadStream(path, options);
        }

        function createWriteStream(path, options) {
          return new fs.WriteStream(path, options);
        }

        var fs$open = fs.open;
        fs.open = open;
        function open(path, flags, mode, cb) {
          if (typeof mode === 'function') (cb = mode), (mode = null);

          return go$open(path, flags, mode, cb);

          function go$open(path, flags, mode, cb) {
            return fs$open(path, flags, mode, function (err, fd) {
              if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
                enqueue([go$open, [path, flags, mode, cb]]);
              else {
                if (typeof cb === 'function') cb.apply(this, arguments);
                retry();
              }
            });
          }
        }

        return fs;
      }

      function enqueue(elem) {
        debug('ENQUEUE', elem[0].name, elem[1]);
        fs[gracefulQueue].push(elem);
      }

      function retry() {
        var elem = fs[gracefulQueue].shift();
        if (elem) {
          debug('RETRY', elem[0].name, elem[1]);
          elem[0].apply(null, elem[1]);
        }
      }

      /***/
    },

    /***/ 742: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const jsonFile = __webpack_require__(458);

      jsonFile.outputJson = u(__webpack_require__(470));
      jsonFile.outputJsonSync = __webpack_require__(944);
      // aliases
      jsonFile.outputJSON = jsonFile.outputJson;
      jsonFile.outputJSONSync = jsonFile.outputJsonSync;
      jsonFile.writeJSON = jsonFile.writeJson;
      jsonFile.writeJSONSync = jsonFile.writeJsonSync;
      jsonFile.readJSON = jsonFile.readJson;
      jsonFile.readJSONSync = jsonFile.readJsonSync;

      module.exports = jsonFile;

      /***/
    },

    /***/ 747: /***/ function (module) {
      module.exports = require('fs');

      /***/
    },

    /***/ 757: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const file = __webpack_require__(46);
      const link = __webpack_require__(950);
      const symlink = __webpack_require__(351);

      module.exports = {
        // file
        createFile: file.createFile,
        createFileSync: file.createFileSync,
        ensureFile: file.createFile,
        ensureFileSync: file.createFileSync,
        // link
        createLink: link.createLink,
        createLinkSync: link.createLinkSync,
        ensureLink: link.createLink,
        ensureLinkSync: link.createLinkSync,
        // symlink
        createSymlink: symlink.createSymlink,
        createSymlinkSync: symlink.createSymlinkSync,
        ensureSymlink: symlink.createSymlink,
        ensureSymlinkSync: symlink.createSymlinkSync,
      };

      /***/
    },

    /***/ 758: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      module.exports = {
        copy: u(__webpack_require__(143)),
      };

      /***/
    },

    /***/ 761: /***/ function (module) {
      module.exports = require('zlib');

      /***/
    },

    /***/ 782: /***/ function (module, __unusedexports, __webpack_require__) {
      var constants = __webpack_require__(619);

      var origCwd = process.cwd;
      var cwd = null;

      var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

      process.cwd = function () {
        if (!cwd) cwd = origCwd.call(process);
        return cwd;
      };
      try {
        process.cwd();
      } catch (er) {}

      var chdir = process.chdir;
      process.chdir = function (d) {
        cwd = null;
        chdir.call(process, d);
      };

      module.exports = patch;

      function patch(fs) {
        // (re-)implement some things that are known busted or missing.

        // lchmod, broken prior to 0.6.2
        // back-port the fix here.
        if (
          constants.hasOwnProperty('O_SYMLINK') &&
          process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)
        ) {
          patchLchmod(fs);
        }

        // lutimes implementation, or no-op
        if (!fs.lutimes) {
          patchLutimes(fs);
        }

        // https://github.com/isaacs/node-graceful-fs/issues/4
        // Chown should not fail on einval or eperm if non-root.
        // It should not fail on enosys ever, as this just indicates
        // that a fs doesn't support the intended operation.

        fs.chown = chownFix(fs.chown);
        fs.fchown = chownFix(fs.fchown);
        fs.lchown = chownFix(fs.lchown);

        fs.chmod = chmodFix(fs.chmod);
        fs.fchmod = chmodFix(fs.fchmod);
        fs.lchmod = chmodFix(fs.lchmod);

        fs.chownSync = chownFixSync(fs.chownSync);
        fs.fchownSync = chownFixSync(fs.fchownSync);
        fs.lchownSync = chownFixSync(fs.lchownSync);

        fs.chmodSync = chmodFixSync(fs.chmodSync);
        fs.fchmodSync = chmodFixSync(fs.fchmodSync);
        fs.lchmodSync = chmodFixSync(fs.lchmodSync);

        fs.stat = statFix(fs.stat);
        fs.fstat = statFix(fs.fstat);
        fs.lstat = statFix(fs.lstat);

        fs.statSync = statFixSync(fs.statSync);
        fs.fstatSync = statFixSync(fs.fstatSync);
        fs.lstatSync = statFixSync(fs.lstatSync);

        // if lchmod/lchown do not exist, then make them no-ops
        if (!fs.lchmod) {
          fs.lchmod = function (path, mode, cb) {
            if (cb) process.nextTick(cb);
          };
          fs.lchmodSync = function () {};
        }
        if (!fs.lchown) {
          fs.lchown = function (path, uid, gid, cb) {
            if (cb) process.nextTick(cb);
          };
          fs.lchownSync = function () {};
        }

        // on Windows, A/V software can lock the directory, causing this
        // to fail with an EACCES or EPERM if the directory contains newly
        // created files.  Try again on failure, for up to 60 seconds.

        // Set the timeout this long because some Windows Anti-Virus, such as Parity
        // bit9, may lock files for up to a minute, causing npm package install
        // failures. Also, take care to yield the scheduler. Windows scheduling gives
        // CPU to a busy looping process, which can cause the program causing the lock
        // contention to be starved of CPU by node, so the contention doesn't resolve.
        if (platform === 'win32') {
          fs.rename = (function (fs$rename) {
            return function (from, to, cb) {
              var start = Date.now();
              var backoff = 0;
              fs$rename(from, to, function CB(er) {
                if (
                  er &&
                  (er.code === 'EACCES' || er.code === 'EPERM') &&
                  Date.now() - start < 60000
                ) {
                  setTimeout(function () {
                    fs.stat(to, function (stater, st) {
                      if (stater && stater.code === 'ENOENT')
                        fs$rename(from, to, CB);
                      else cb(er);
                    });
                  }, backoff);
                  if (backoff < 100) backoff += 10;
                  return;
                }
                if (cb) cb(er);
              });
            };
          })(fs.rename);
        }

        // if read() returns EAGAIN, then just try it again.
        fs.read = (function (fs$read) {
          function read(fd, buffer, offset, length, position, callback_) {
            var callback;
            if (callback_ && typeof callback_ === 'function') {
              var eagCounter = 0;
              callback = function (er, _, __) {
                if (er && er.code === 'EAGAIN' && eagCounter < 10) {
                  eagCounter++;
                  return fs$read.call(
                    fs,
                    fd,
                    buffer,
                    offset,
                    length,
                    position,
                    callback
                  );
                }
                callback_.apply(this, arguments);
              };
            }
            return fs$read.call(
              fs,
              fd,
              buffer,
              offset,
              length,
              position,
              callback
            );
          }

          // This ensures `util.promisify` works as it does for native `fs.read`.
          read.__proto__ = fs$read;
          return read;
        })(fs.read);

        fs.readSync = (function (fs$readSync) {
          return function (fd, buffer, offset, length, position) {
            var eagCounter = 0;
            while (true) {
              try {
                return fs$readSync.call(
                  fs,
                  fd,
                  buffer,
                  offset,
                  length,
                  position
                );
              } catch (er) {
                if (er.code === 'EAGAIN' && eagCounter < 10) {
                  eagCounter++;
                  continue;
                }
                throw er;
              }
            }
          };
        })(fs.readSync);

        function patchLchmod(fs) {
          fs.lchmod = function (path, mode, callback) {
            fs.open(
              path,
              constants.O_WRONLY | constants.O_SYMLINK,
              mode,
              function (err, fd) {
                if (err) {
                  if (callback) callback(err);
                  return;
                }
                // prefer to return the chmod error, if one occurs,
                // but still try to close, and report closing errors if they occur.
                fs.fchmod(fd, mode, function (err) {
                  fs.close(fd, function (err2) {
                    if (callback) callback(err || err2);
                  });
                });
              }
            );
          };

          fs.lchmodSync = function (path, mode) {
            var fd = fs.openSync(
              path,
              constants.O_WRONLY | constants.O_SYMLINK,
              mode
            );

            // prefer to return the chmod error, if one occurs,
            // but still try to close, and report closing errors if they occur.
            var threw = true;
            var ret;
            try {
              ret = fs.fchmodSync(fd, mode);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs.closeSync(fd);
                } catch (er) {}
              } else {
                fs.closeSync(fd);
              }
            }
            return ret;
          };
        }

        function patchLutimes(fs) {
          if (constants.hasOwnProperty('O_SYMLINK')) {
            fs.lutimes = function (path, at, mt, cb) {
              fs.open(path, constants.O_SYMLINK, function (er, fd) {
                if (er) {
                  if (cb) cb(er);
                  return;
                }
                fs.futimes(fd, at, mt, function (er) {
                  fs.close(fd, function (er2) {
                    if (cb) cb(er || er2);
                  });
                });
              });
            };

            fs.lutimesSync = function (path, at, mt) {
              var fd = fs.openSync(path, constants.O_SYMLINK);
              var ret;
              var threw = true;
              try {
                ret = fs.futimesSync(fd, at, mt);
                threw = false;
              } finally {
                if (threw) {
                  try {
                    fs.closeSync(fd);
                  } catch (er) {}
                } else {
                  fs.closeSync(fd);
                }
              }
              return ret;
            };
          } else {
            fs.lutimes = function (_a, _b, _c, cb) {
              if (cb) process.nextTick(cb);
            };
            fs.lutimesSync = function () {};
          }
        }

        function chmodFix(orig) {
          if (!orig) return orig;
          return function (target, mode, cb) {
            return orig.call(fs, target, mode, function (er) {
              if (chownErOk(er)) er = null;
              if (cb) cb.apply(this, arguments);
            });
          };
        }

        function chmodFixSync(orig) {
          if (!orig) return orig;
          return function (target, mode) {
            try {
              return orig.call(fs, target, mode);
            } catch (er) {
              if (!chownErOk(er)) throw er;
            }
          };
        }

        function chownFix(orig) {
          if (!orig) return orig;
          return function (target, uid, gid, cb) {
            return orig.call(fs, target, uid, gid, function (er) {
              if (chownErOk(er)) er = null;
              if (cb) cb.apply(this, arguments);
            });
          };
        }

        function chownFixSync(orig) {
          if (!orig) return orig;
          return function (target, uid, gid) {
            try {
              return orig.call(fs, target, uid, gid);
            } catch (er) {
              if (!chownErOk(er)) throw er;
            }
          };
        }

        function statFix(orig) {
          if (!orig) return orig;
          // Older versions of Node erroneously returned signed integers for
          // uid + gid.
          return function (target, options, cb) {
            if (typeof options === 'function') {
              cb = options;
              options = null;
            }
            function callback(er, stats) {
              if (stats) {
                if (stats.uid < 0) stats.uid += 0x100000000;
                if (stats.gid < 0) stats.gid += 0x100000000;
              }
              if (cb) cb.apply(this, arguments);
            }
            return options
              ? orig.call(fs, target, options, callback)
              : orig.call(fs, target, callback);
          };
        }

        function statFixSync(orig) {
          if (!orig) return orig;
          // Older versions of Node erroneously returned signed integers for
          // uid + gid.
          return function (target, options) {
            var stats = options
              ? orig.call(fs, target, options)
              : orig.call(fs, target);
            if (stats.uid < 0) stats.uid += 0x100000000;
            if (stats.gid < 0) stats.gid += 0x100000000;
            return stats;
          };
        }

        // ENOSYS means that the fs doesn't support the op. Just ignore
        // that, because it doesn't matter.
        //
        // if there's no getuid, or if getuid() is something other
        // than 0, and the error is EINVAL or EPERM, then just ignore
        // it.
        //
        // This specific case is a silent failure in cp, install, tar,
        // and most other unix tools that manage permissions.
        //
        // When running as root, or if other types of errors are
        // encountered, then it's strict.
        function chownErOk(er) {
          if (!er) return true;

          if (er.code === 'ENOSYS') return true;

          var nonroot = !process.getuid || process.getuid() !== 0;
          if (nonroot) {
            if (er.code === 'EINVAL' || er.code === 'EPERM') return true;
          }

          return false;
        }
      }

      /***/
    },

    /***/ 802: /***/ function (module, __unusedexports, __webpack_require__) {
      var Buffer = __webpack_require__(293).Buffer;

      var CRC_TABLE = [
        0x00000000,
        0x77073096,
        0xee0e612c,
        0x990951ba,
        0x076dc419,
        0x706af48f,
        0xe963a535,
        0x9e6495a3,
        0x0edb8832,
        0x79dcb8a4,
        0xe0d5e91e,
        0x97d2d988,
        0x09b64c2b,
        0x7eb17cbd,
        0xe7b82d07,
        0x90bf1d91,
        0x1db71064,
        0x6ab020f2,
        0xf3b97148,
        0x84be41de,
        0x1adad47d,
        0x6ddde4eb,
        0xf4d4b551,
        0x83d385c7,
        0x136c9856,
        0x646ba8c0,
        0xfd62f97a,
        0x8a65c9ec,
        0x14015c4f,
        0x63066cd9,
        0xfa0f3d63,
        0x8d080df5,
        0x3b6e20c8,
        0x4c69105e,
        0xd56041e4,
        0xa2677172,
        0x3c03e4d1,
        0x4b04d447,
        0xd20d85fd,
        0xa50ab56b,
        0x35b5a8fa,
        0x42b2986c,
        0xdbbbc9d6,
        0xacbcf940,
        0x32d86ce3,
        0x45df5c75,
        0xdcd60dcf,
        0xabd13d59,
        0x26d930ac,
        0x51de003a,
        0xc8d75180,
        0xbfd06116,
        0x21b4f4b5,
        0x56b3c423,
        0xcfba9599,
        0xb8bda50f,
        0x2802b89e,
        0x5f058808,
        0xc60cd9b2,
        0xb10be924,
        0x2f6f7c87,
        0x58684c11,
        0xc1611dab,
        0xb6662d3d,
        0x76dc4190,
        0x01db7106,
        0x98d220bc,
        0xefd5102a,
        0x71b18589,
        0x06b6b51f,
        0x9fbfe4a5,
        0xe8b8d433,
        0x7807c9a2,
        0x0f00f934,
        0x9609a88e,
        0xe10e9818,
        0x7f6a0dbb,
        0x086d3d2d,
        0x91646c97,
        0xe6635c01,
        0x6b6b51f4,
        0x1c6c6162,
        0x856530d8,
        0xf262004e,
        0x6c0695ed,
        0x1b01a57b,
        0x8208f4c1,
        0xf50fc457,
        0x65b0d9c6,
        0x12b7e950,
        0x8bbeb8ea,
        0xfcb9887c,
        0x62dd1ddf,
        0x15da2d49,
        0x8cd37cf3,
        0xfbd44c65,
        0x4db26158,
        0x3ab551ce,
        0xa3bc0074,
        0xd4bb30e2,
        0x4adfa541,
        0x3dd895d7,
        0xa4d1c46d,
        0xd3d6f4fb,
        0x4369e96a,
        0x346ed9fc,
        0xad678846,
        0xda60b8d0,
        0x44042d73,
        0x33031de5,
        0xaa0a4c5f,
        0xdd0d7cc9,
        0x5005713c,
        0x270241aa,
        0xbe0b1010,
        0xc90c2086,
        0x5768b525,
        0x206f85b3,
        0xb966d409,
        0xce61e49f,
        0x5edef90e,
        0x29d9c998,
        0xb0d09822,
        0xc7d7a8b4,
        0x59b33d17,
        0x2eb40d81,
        0xb7bd5c3b,
        0xc0ba6cad,
        0xedb88320,
        0x9abfb3b6,
        0x03b6e20c,
        0x74b1d29a,
        0xead54739,
        0x9dd277af,
        0x04db2615,
        0x73dc1683,
        0xe3630b12,
        0x94643b84,
        0x0d6d6a3e,
        0x7a6a5aa8,
        0xe40ecf0b,
        0x9309ff9d,
        0x0a00ae27,
        0x7d079eb1,
        0xf00f9344,
        0x8708a3d2,
        0x1e01f268,
        0x6906c2fe,
        0xf762575d,
        0x806567cb,
        0x196c3671,
        0x6e6b06e7,
        0xfed41b76,
        0x89d32be0,
        0x10da7a5a,
        0x67dd4acc,
        0xf9b9df6f,
        0x8ebeeff9,
        0x17b7be43,
        0x60b08ed5,
        0xd6d6a3e8,
        0xa1d1937e,
        0x38d8c2c4,
        0x4fdff252,
        0xd1bb67f1,
        0xa6bc5767,
        0x3fb506dd,
        0x48b2364b,
        0xd80d2bda,
        0xaf0a1b4c,
        0x36034af6,
        0x41047a60,
        0xdf60efc3,
        0xa867df55,
        0x316e8eef,
        0x4669be79,
        0xcb61b38c,
        0xbc66831a,
        0x256fd2a0,
        0x5268e236,
        0xcc0c7795,
        0xbb0b4703,
        0x220216b9,
        0x5505262f,
        0xc5ba3bbe,
        0xb2bd0b28,
        0x2bb45a92,
        0x5cb36a04,
        0xc2d7ffa7,
        0xb5d0cf31,
        0x2cd99e8b,
        0x5bdeae1d,
        0x9b64c2b0,
        0xec63f226,
        0x756aa39c,
        0x026d930a,
        0x9c0906a9,
        0xeb0e363f,
        0x72076785,
        0x05005713,
        0x95bf4a82,
        0xe2b87a14,
        0x7bb12bae,
        0x0cb61b38,
        0x92d28e9b,
        0xe5d5be0d,
        0x7cdcefb7,
        0x0bdbdf21,
        0x86d3d2d4,
        0xf1d4e242,
        0x68ddb3f8,
        0x1fda836e,
        0x81be16cd,
        0xf6b9265b,
        0x6fb077e1,
        0x18b74777,
        0x88085ae6,
        0xff0f6a70,
        0x66063bca,
        0x11010b5c,
        0x8f659eff,
        0xf862ae69,
        0x616bffd3,
        0x166ccf45,
        0xa00ae278,
        0xd70dd2ee,
        0x4e048354,
        0x3903b3c2,
        0xa7672661,
        0xd06016f7,
        0x4969474d,
        0x3e6e77db,
        0xaed16a4a,
        0xd9d65adc,
        0x40df0b66,
        0x37d83bf0,
        0xa9bcae53,
        0xdebb9ec5,
        0x47b2cf7f,
        0x30b5ffe9,
        0xbdbdf21c,
        0xcabac28a,
        0x53b39330,
        0x24b4a3a6,
        0xbad03605,
        0xcdd70693,
        0x54de5729,
        0x23d967bf,
        0xb3667a2e,
        0xc4614ab8,
        0x5d681b02,
        0x2a6f2b94,
        0xb40bbe37,
        0xc30c8ea1,
        0x5a05df1b,
        0x2d02ef8d,
      ];

      if (typeof Int32Array !== 'undefined') {
        CRC_TABLE = new Int32Array(CRC_TABLE);
      }

      function ensureBuffer(input) {
        if (Buffer.isBuffer(input)) {
          return input;
        }

        var hasNewBufferAPI =
          typeof Buffer.alloc === 'function' &&
          typeof Buffer.from === 'function';

        if (typeof input === 'number') {
          return hasNewBufferAPI ? Buffer.alloc(input) : new Buffer(input);
        } else if (typeof input === 'string') {
          return hasNewBufferAPI ? Buffer.from(input) : new Buffer(input);
        } else {
          throw new Error(
            'input must be buffer, number, or string, received ' + typeof input
          );
        }
      }

      function bufferizeInt(num) {
        var tmp = ensureBuffer(4);
        tmp.writeInt32BE(num, 0);
        return tmp;
      }

      function _crc32(buf, previous) {
        buf = ensureBuffer(buf);
        if (Buffer.isBuffer(previous)) {
          previous = previous.readUInt32BE(0);
        }
        var crc = ~~previous ^ -1;
        for (var n = 0; n < buf.length; n++) {
          crc = CRC_TABLE[(crc ^ buf[n]) & 0xff] ^ (crc >>> 8);
        }
        return crc ^ -1;
      }

      function crc32() {
        return bufferizeInt(_crc32.apply(null, arguments));
      }
      crc32.signed = function () {
        return _crc32.apply(null, arguments);
      };
      crc32.unsigned = function () {
        return _crc32.apply(null, arguments) >>> 0;
      };

      module.exports = crc32;

      /***/
    },

    /***/ 825: /***/ function (module, __unusedexports, __webpack_require__) {
      var Stream = __webpack_require__(413).Stream;

      module.exports = legacy;

      function legacy(fs) {
        return {
          ReadStream: ReadStream,
          WriteStream: WriteStream,
        };

        function ReadStream(path, options) {
          if (!(this instanceof ReadStream))
            return new ReadStream(path, options);

          Stream.call(this);

          var self = this;

          this.path = path;
          this.fd = null;
          this.readable = true;
          this.paused = false;

          this.flags = 'r';
          this.mode = 438; /*=0666*/
          this.bufferSize = 64 * 1024;

          options = options || {};

          // Mixin options into this
          var keys = Object.keys(options);
          for (var index = 0, length = keys.length; index < length; index++) {
            var key = keys[index];
            this[key] = options[key];
          }

          if (this.encoding) this.setEncoding(this.encoding);

          if (this.start !== undefined) {
            if ('number' !== typeof this.start) {
              throw TypeError('start must be a Number');
            }
            if (this.end === undefined) {
              this.end = Infinity;
            } else if ('number' !== typeof this.end) {
              throw TypeError('end must be a Number');
            }

            if (this.start > this.end) {
              throw new Error('start must be <= end');
            }

            this.pos = this.start;
          }

          if (this.fd !== null) {
            process.nextTick(function () {
              self._read();
            });
            return;
          }

          fs.open(this.path, this.flags, this.mode, function (err, fd) {
            if (err) {
              self.emit('error', err);
              self.readable = false;
              return;
            }

            self.fd = fd;
            self.emit('open', fd);
            self._read();
          });
        }

        function WriteStream(path, options) {
          if (!(this instanceof WriteStream))
            return new WriteStream(path, options);

          Stream.call(this);

          this.path = path;
          this.fd = null;
          this.writable = true;

          this.flags = 'w';
          this.encoding = 'binary';
          this.mode = 438; /*=0666*/
          this.bytesWritten = 0;

          options = options || {};

          // Mixin options into this
          var keys = Object.keys(options);
          for (var index = 0, length = keys.length; index < length; index++) {
            var key = keys[index];
            this[key] = options[key];
          }

          if (this.start !== undefined) {
            if ('number' !== typeof this.start) {
              throw TypeError('start must be a Number');
            }
            if (this.start < 0) {
              throw new Error('start must be >= zero');
            }

            this.pos = this.start;
          }

          this.busy = false;
          this._queue = [];

          if (this.fd === null) {
            this._open = fs.open;
            this._queue.push([
              this._open,
              this.path,
              this.flags,
              this.mode,
              undefined,
            ]);
            this.flush();
          }
        }
      }

      /***/
    },

    /***/ 835: /***/ function (module) {
      module.exports = require('url');

      /***/
    },

    /***/ 868: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const path = __webpack_require__(622);

      // get drive on windows
      function getRootPath(p) {
        p = path.normalize(path.resolve(p)).split(path.sep);
        if (p.length > 0) return p[0];
        return null;
      }

      // http://stackoverflow.com/a/62888/10333 contains more accurate
      // TODO: expand to include the rest
      const INVALID_PATH_CHARS = /[<>:"|?*]/;

      function invalidWin32Path(p) {
        const rp = getRootPath(p);
        p = p.replace(rp, '');
        return INVALID_PATH_CHARS.test(p);
      }

      module.exports = {
        getRootPath,
        invalidWin32Path,
      };

      /***/
    },

    /***/ 914: /***/ function (module, __unusedexports, __webpack_require__) {
      var _fs;
      try {
        _fs = __webpack_require__(729);
      } catch (_) {
        _fs = __webpack_require__(747);
      }

      function readFile(file, options, callback) {
        if (callback == null) {
          callback = options;
          options = {};
        }

        if (typeof options === 'string') {
          options = { encoding: options };
        }

        options = options || {};
        var fs = options.fs || _fs;

        var shouldThrow = true;
        if ('throws' in options) {
          shouldThrow = options.throws;
        }

        fs.readFile(file, options, function (err, data) {
          if (err) return callback(err);

          data = stripBom(data);

          var obj;
          try {
            obj = JSON.parse(data, options ? options.reviver : null);
          } catch (err2) {
            if (shouldThrow) {
              err2.message = file + ': ' + err2.message;
              return callback(err2);
            } else {
              return callback(null, null);
            }
          }

          callback(null, obj);
        });
      }

      function readFileSync(file, options) {
        options = options || {};
        if (typeof options === 'string') {
          options = { encoding: options };
        }

        var fs = options.fs || _fs;

        var shouldThrow = true;
        if ('throws' in options) {
          shouldThrow = options.throws;
        }

        try {
          var content = fs.readFileSync(file, options);
          content = stripBom(content);
          return JSON.parse(content, options.reviver);
        } catch (err) {
          if (shouldThrow) {
            err.message = file + ': ' + err.message;
            throw err;
          } else {
            return null;
          }
        }
      }

      function stringify(obj, options) {
        var spaces;
        var EOL = '\n';
        if (typeof options === 'object' && options !== null) {
          if (options.spaces) {
            spaces = options.spaces;
          }
          if (options.EOL) {
            EOL = options.EOL;
          }
        }

        var str = JSON.stringify(
          obj,
          options ? options.replacer : null,
          spaces
        );

        return str.replace(/\n/g, EOL) + EOL;
      }

      function writeFile(file, obj, options, callback) {
        if (callback == null) {
          callback = options;
          options = {};
        }
        options = options || {};
        var fs = options.fs || _fs;

        var str = '';
        try {
          str = stringify(obj, options);
        } catch (err) {
          // Need to return whether a callback was passed or not
          if (callback) callback(err, null);
          return;
        }

        fs.writeFile(file, str, options, callback);
      }

      function writeFileSync(file, obj, options) {
        options = options || {};
        var fs = options.fs || _fs;

        var str = stringify(obj, options);
        // not sure if fs.writeFileSync returns anything, but just in case
        return fs.writeFileSync(file, str, options);
      }

      function stripBom(content) {
        // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
        if (Buffer.isBuffer(content)) content = content.toString('utf8');
        content = content.replace(/^\uFEFF/, '');
        return content;
      }

      var jsonfile = {
        readFile: readFile,
        readFileSync: readFileSync,
        writeFile: writeFile,
        writeFileSync: writeFileSync,
      };

      module.exports = jsonfile;

      /***/
    },

    /***/ 936: /***/ function (__unusedmodule, exports, __webpack_require__) {
      'use strict';

      // This is adapted from https://github.com/normalize/mz
      // Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
      const u = __webpack_require__(323).fromCallback;
      const fs = __webpack_require__(729);

      const api = [
        'access',
        'appendFile',
        'chmod',
        'chown',
        'close',
        'copyFile',
        'fchmod',
        'fchown',
        'fdatasync',
        'fstat',
        'fsync',
        'ftruncate',
        'futimes',
        'lchown',
        'lchmod',
        'link',
        'lstat',
        'mkdir',
        'mkdtemp',
        'open',
        'readFile',
        'readdir',
        'readlink',
        'realpath',
        'rename',
        'rmdir',
        'stat',
        'symlink',
        'truncate',
        'unlink',
        'utimes',
        'writeFile',
      ].filter(key => {
        // Some commands are not available on some systems. Ex:
        // fs.copyFile was added in Node.js v8.5.0
        // fs.mkdtemp was added in Node.js v5.10.0
        // fs.lchown is not available on at least some Linux
        return typeof fs[key] === 'function';
      });

      // Export all keys:
      Object.keys(fs).forEach(key => {
        if (key === 'promises') {
          // fs.promises is a getter property that triggers ExperimentalWarning
          // Don't re-export it here, the getter is defined in "lib/index.js"
          return;
        }
        exports[key] = fs[key];
      });

      // Universalify async methods:
      api.forEach(method => {
        exports[method] = u(fs[method]);
      });

      // We differ from mz/fs in that we still ship the old, broken, fs.exists()
      // since we are a drop-in replacement for the native module
      exports.exists = function (filename, callback) {
        if (typeof callback === 'function') {
          return fs.exists(filename, callback);
        }
        return new Promise(resolve => {
          return fs.exists(filename, resolve);
        });
      };

      // fs.read() & fs.write need special treatment due to multiple callback args

      exports.read = function (fd, buffer, offset, length, position, callback) {
        if (typeof callback === 'function') {
          return fs.read(fd, buffer, offset, length, position, callback);
        }
        return new Promise((resolve, reject) => {
          fs.read(
            fd,
            buffer,
            offset,
            length,
            position,
            (err, bytesRead, buffer) => {
              if (err) return reject(err);
              resolve({ bytesRead, buffer });
            }
          );
        });
      };

      // Function signature can be
      // fs.write(fd, buffer[, offset[, length[, position]]], callback)
      // OR
      // fs.write(fd, string[, position[, encoding]], callback)
      // We need to handle both cases, so we use ...args
      exports.write = function (fd, buffer, ...args) {
        if (typeof args[args.length - 1] === 'function') {
          return fs.write(fd, buffer, ...args);
        }

        return new Promise((resolve, reject) => {
          fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
            if (err) return reject(err);
            resolve({ bytesWritten, buffer });
          });
        });
      };

      /***/
    },

    /***/ 944: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const mkdir = __webpack_require__(648);
      const jsonFile = __webpack_require__(458);

      function outputJsonSync(file, data, options) {
        const dir = path.dirname(file);

        if (!fs.existsSync(dir)) {
          mkdir.mkdirsSync(dir);
        }

        jsonFile.writeJsonSync(file, data, options);
      }

      module.exports = outputJsonSync;

      /***/
    },

    /***/ 950: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const u = __webpack_require__(323).fromCallback;
      const path = __webpack_require__(622);
      const fs = __webpack_require__(729);
      const mkdir = __webpack_require__(648);
      const pathExists = __webpack_require__(370).pathExists;

      function createLink(srcpath, dstpath, callback) {
        function makeLink(srcpath, dstpath) {
          fs.link(srcpath, dstpath, err => {
            if (err) return callback(err);
            callback(null);
          });
        }

        pathExists(dstpath, (err, destinationExists) => {
          if (err) return callback(err);
          if (destinationExists) return callback(null);
          fs.lstat(srcpath, err => {
            if (err) {
              err.message = err.message.replace('lstat', 'ensureLink');
              return callback(err);
            }

            const dir = path.dirname(dstpath);
            pathExists(dir, (err, dirExists) => {
              if (err) return callback(err);
              if (dirExists) return makeLink(srcpath, dstpath);
              mkdir.mkdirs(dir, err => {
                if (err) return callback(err);
                makeLink(srcpath, dstpath);
              });
            });
          });
        });
      }

      function createLinkSync(srcpath, dstpath) {
        const destinationExists = fs.existsSync(dstpath);
        if (destinationExists) return undefined;

        try {
          fs.lstatSync(srcpath);
        } catch (err) {
          err.message = err.message.replace('lstat', 'ensureLink');
          throw err;
        }

        const dir = path.dirname(dstpath);
        const dirExists = fs.existsSync(dir);
        if (dirExists) return fs.linkSync(srcpath, dstpath);
        mkdir.mkdirsSync(dir);

        return fs.linkSync(srcpath, dstpath);
      }

      module.exports = {
        createLink: u(createLink),
        createLinkSync,
      };

      /***/
    },

    /***/ 968: /***/ function (module, __unusedexports, __webpack_require__) {
      'use strict';

      const fs = __webpack_require__(729);
      const path = __webpack_require__(622);
      const mkdirpSync = __webpack_require__(648).mkdirsSync;
      const utimesSync = __webpack_require__(402).utimesMillisSync;

      const notExist = Symbol('notExist');

      function copySync(src, dest, opts) {
        if (typeof opts === 'function') {
          opts = { filter: opts };
        }

        opts = opts || {};
        opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
        opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

        // Warn about using preserveTimestamps on 32-bit node
        if (opts.preserveTimestamps && process.arch === 'ia32') {
          console.warn(`fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n
    see https://github.com/jprichardson/node-fs-extra/issues/269`);
        }

        const destStat = checkPaths(src, dest);

        if (opts.filter && !opts.filter(src, dest)) return;

        const destParent = path.dirname(dest);
        if (!fs.existsSync(destParent)) mkdirpSync(destParent);
        return startCopy(destStat, src, dest, opts);
      }

      function startCopy(destStat, src, dest, opts) {
        if (opts.filter && !opts.filter(src, dest)) return;
        return getStats(destStat, src, dest, opts);
      }

      function getStats(destStat, src, dest, opts) {
        const statSync = opts.dereference ? fs.statSync : fs.lstatSync;
        const srcStat = statSync(src);

        if (srcStat.isDirectory())
          return onDir(srcStat, destStat, src, dest, opts);
        else if (
          srcStat.isFile() ||
          srcStat.isCharacterDevice() ||
          srcStat.isBlockDevice()
        )
          return onFile(srcStat, destStat, src, dest, opts);
        else if (srcStat.isSymbolicLink())
          return onLink(destStat, src, dest, opts);
      }

      function onFile(srcStat, destStat, src, dest, opts) {
        if (destStat === notExist) return copyFile(srcStat, src, dest, opts);
        return mayCopyFile(srcStat, src, dest, opts);
      }

      function mayCopyFile(srcStat, src, dest, opts) {
        if (opts.overwrite) {
          fs.unlinkSync(dest);
          return copyFile(srcStat, src, dest, opts);
        } else if (opts.errorOnExist) {
          throw new Error(`'${dest}' already exists`);
        }
      }

      function copyFile(srcStat, src, dest, opts) {
        if (typeof fs.copyFileSync === 'function') {
          fs.copyFileSync(src, dest);
          fs.chmodSync(dest, srcStat.mode);
          if (opts.preserveTimestamps) {
            return utimesSync(dest, srcStat.atime, srcStat.mtime);
          }
          return;
        }
        return copyFileFallback(srcStat, src, dest, opts);
      }

      function copyFileFallback(srcStat, src, dest, opts) {
        const BUF_LENGTH = 64 * 1024;
        const _buff = __webpack_require__(518)(BUF_LENGTH);

        const fdr = fs.openSync(src, 'r');
        const fdw = fs.openSync(dest, 'w', srcStat.mode);
        let pos = 0;

        while (pos < srcStat.size) {
          const bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
          fs.writeSync(fdw, _buff, 0, bytesRead);
          pos += bytesRead;
        }

        if (opts.preserveTimestamps)
          fs.futimesSync(fdw, srcStat.atime, srcStat.mtime);

        fs.closeSync(fdr);
        fs.closeSync(fdw);
      }

      function onDir(srcStat, destStat, src, dest, opts) {
        if (destStat === notExist)
          return mkDirAndCopy(srcStat, src, dest, opts);
        if (destStat && !destStat.isDirectory()) {
          throw new Error(
            `Cannot overwrite non-directory '${dest}' with directory '${src}'.`
          );
        }
        return copyDir(src, dest, opts);
      }

      function mkDirAndCopy(srcStat, src, dest, opts) {
        fs.mkdirSync(dest);
        copyDir(src, dest, opts);
        return fs.chmodSync(dest, srcStat.mode);
      }

      function copyDir(src, dest, opts) {
        fs.readdirSync(src).forEach(item => copyDirItem(item, src, dest, opts));
      }

      function copyDirItem(item, src, dest, opts) {
        const srcItem = path.join(src, item);
        const destItem = path.join(dest, item);
        const destStat = checkPaths(srcItem, destItem);
        return startCopy(destStat, srcItem, destItem, opts);
      }

      function onLink(destStat, src, dest, opts) {
        let resolvedSrc = fs.readlinkSync(src);

        if (opts.dereference) {
          resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
        }

        if (destStat === notExist) {
          return fs.symlinkSync(resolvedSrc, dest);
        } else {
          let resolvedDest;
          try {
            resolvedDest = fs.readlinkSync(dest);
          } catch (err) {
            // dest exists and is a regular file or directory,
            // Windows may throw UNKNOWN error. If dest already exists,
            // fs throws error anyway, so no need to guard against it here.
            if (err.code === 'EINVAL' || err.code === 'UNKNOWN')
              return fs.symlinkSync(resolvedSrc, dest);
            throw err;
          }
          if (opts.dereference) {
            resolvedDest = path.resolve(process.cwd(), resolvedDest);
          }
          if (isSrcSubdir(resolvedSrc, resolvedDest)) {
            throw new Error(
              `Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`
            );
          }

          // prevent copy if src is a subdir of dest since unlinking
          // dest in this case would result in removing src contents
          // and therefore a broken symlink would be created.
          if (
            fs.statSync(dest).isDirectory() &&
            isSrcSubdir(resolvedDest, resolvedSrc)
          ) {
            throw new Error(
              `Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`
            );
          }
          return copyLink(resolvedSrc, dest);
        }
      }

      function copyLink(resolvedSrc, dest) {
        fs.unlinkSync(dest);
        return fs.symlinkSync(resolvedSrc, dest);
      }

      // return true if dest is a subdir of src, otherwise false.
      function isSrcSubdir(src, dest) {
        const srcArray = path.resolve(src).split(path.sep);
        const destArray = path.resolve(dest).split(path.sep);
        return srcArray.reduce(
          (acc, current, i) => acc && destArray[i] === current,
          true
        );
      }

      function checkStats(src, dest) {
        const srcStat = fs.statSync(src);
        let destStat;
        try {
          destStat = fs.statSync(dest);
        } catch (err) {
          if (err.code === 'ENOENT') return { srcStat, destStat: notExist };
          throw err;
        }
        return { srcStat, destStat };
      }

      function checkPaths(src, dest) {
        const { srcStat, destStat } = checkStats(src, dest);
        if (destStat.ino && destStat.ino === srcStat.ino) {
          throw new Error('Source and destination must not be the same.');
        }
        if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
          throw new Error(
            `Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`
          );
        }
        return destStat;
      }

      module.exports = copySync;

      /***/
    },

    /******/
  }
);

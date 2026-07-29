"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/universalify/index.js
var require_universalify = __commonJS({
  "node_modules/universalify/index.js"(exports2) {
    "use strict";
    exports2.fromCallback = function(fn) {
      return Object.defineProperty(function(...args) {
        if (typeof args[args.length - 1] === "function") fn.apply(this, args);
        else {
          return new Promise((resolve, reject) => {
            args.push((err, res) => err != null ? reject(err) : resolve(res));
            fn.apply(this, args);
          });
        }
      }, "name", { value: fn.name });
    };
    exports2.fromPromise = function(fn) {
      return Object.defineProperty(function(...args) {
        const cb = args[args.length - 1];
        if (typeof cb !== "function") return fn.apply(this, args);
        else {
          args.pop();
          fn.apply(this, args).then((r) => cb(null, r), cb);
        }
      }, "name", { value: fn.name });
    };
  }
});

// node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  "node_modules/graceful-fs/polyfills.js"(exports2, module2) {
    var constants = require("constants");
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {
    }
    if (typeof process.chdir === "function") {
      chdir = process.chdir;
      process.chdir = function(d) {
        cwd = null;
        chdir.call(process, d);
      };
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module2.exports = patch;
    function patch(fs2) {
      if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs2);
      }
      if (!fs2.lutimes) {
        patchLutimes(fs2);
      }
      fs2.chown = chownFix(fs2.chown);
      fs2.fchown = chownFix(fs2.fchown);
      fs2.lchown = chownFix(fs2.lchown);
      fs2.chmod = chmodFix(fs2.chmod);
      fs2.fchmod = chmodFix(fs2.fchmod);
      fs2.lchmod = chmodFix(fs2.lchmod);
      fs2.chownSync = chownFixSync(fs2.chownSync);
      fs2.fchownSync = chownFixSync(fs2.fchownSync);
      fs2.lchownSync = chownFixSync(fs2.lchownSync);
      fs2.chmodSync = chmodFixSync(fs2.chmodSync);
      fs2.fchmodSync = chmodFixSync(fs2.fchmodSync);
      fs2.lchmodSync = chmodFixSync(fs2.lchmodSync);
      fs2.stat = statFix(fs2.stat);
      fs2.fstat = statFix(fs2.fstat);
      fs2.lstat = statFix(fs2.lstat);
      fs2.statSync = statFixSync(fs2.statSync);
      fs2.fstatSync = statFixSync(fs2.fstatSync);
      fs2.lstatSync = statFixSync(fs2.lstatSync);
      if (fs2.chmod && !fs2.lchmod) {
        fs2.lchmod = function(path2, mode, cb) {
          if (cb) process.nextTick(cb);
        };
        fs2.lchmodSync = function() {
        };
      }
      if (fs2.chown && !fs2.lchown) {
        fs2.lchown = function(path2, uid, gid, cb) {
          if (cb) process.nextTick(cb);
        };
        fs2.lchownSync = function() {
        };
      }
      if (platform === "win32") {
        fs2.rename = typeof fs2.rename !== "function" ? fs2.rename : (function(fs$rename) {
          function rename(from, to, cb) {
            var start = Date.now();
            var backoff = 0;
            fs$rename(from, to, function CB(er) {
              if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
                setTimeout(function() {
                  fs2.stat(to, function(stater, st) {
                    if (stater && stater.code === "ENOENT")
                      fs$rename(from, to, CB);
                    else
                      cb(er);
                  });
                }, backoff);
                if (backoff < 100)
                  backoff += 10;
                return;
              }
              if (cb) cb(er);
            });
          }
          if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
          return rename;
        })(fs2.rename);
      }
      fs2.read = typeof fs2.read !== "function" ? fs2.read : (function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
          var callback;
          if (callback_ && typeof callback_ === "function") {
            var eagCounter = 0;
            callback = function(er, _, __) {
              if (er && er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
        }
        if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
        return read;
      })(fs2.read);
      fs2.readSync = typeof fs2.readSync !== "function" ? fs2.readSync : /* @__PURE__ */ (function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
          var eagCounter = 0;
          while (true) {
            try {
              return fs$readSync.call(fs2, fd, buffer, offset, length, position);
            } catch (er) {
              if (er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      })(fs2.readSync);
      function patchLchmod(fs3) {
        fs3.lchmod = function(path2, mode, callback) {
          fs3.open(
            path2,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode,
            function(err, fd) {
              if (err) {
                if (callback) callback(err);
                return;
              }
              fs3.fchmod(fd, mode, function(err2) {
                fs3.close(fd, function(err22) {
                  if (callback) callback(err2 || err22);
                });
              });
            }
          );
        };
        fs3.lchmodSync = function(path2, mode) {
          var fd = fs3.openSync(path2, constants.O_WRONLY | constants.O_SYMLINK, mode);
          var threw = true;
          var ret;
          try {
            ret = fs3.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs3.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs3.closeSync(fd);
            }
          }
          return ret;
        };
      }
      function patchLutimes(fs3) {
        if (constants.hasOwnProperty("O_SYMLINK") && fs3.futimes) {
          fs3.lutimes = function(path2, at, mt, cb) {
            fs3.open(path2, constants.O_SYMLINK, function(er, fd) {
              if (er) {
                if (cb) cb(er);
                return;
              }
              fs3.futimes(fd, at, mt, function(er2) {
                fs3.close(fd, function(er22) {
                  if (cb) cb(er2 || er22);
                });
              });
            });
          };
          fs3.lutimesSync = function(path2, at, mt) {
            var fd = fs3.openSync(path2, constants.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs3.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs3.closeSync(fd);
                } catch (er) {
                }
              } else {
                fs3.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs3.futimes) {
          fs3.lutimes = function(_a, _b, _c, cb) {
            if (cb) process.nextTick(cb);
          };
          fs3.lutimesSync = function() {
          };
        }
      }
      function chmodFix(orig) {
        if (!orig) return orig;
        return function(target, mode, cb) {
          return orig.call(fs2, target, mode, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig) return orig;
        return function(target, mode) {
          try {
            return orig.call(fs2, target, mode);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig) return orig;
        return function(target, uid, gid, cb) {
          return orig.call(fs2, target, uid, gid, function(er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig) return orig;
        return function(target, uid, gid) {
          try {
            return orig.call(fs2, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig) return orig;
        return function(target, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296;
              if (stats.gid < 0) stats.gid += 4294967296;
            }
            if (cb) cb.apply(this, arguments);
          }
          return options ? orig.call(fs2, target, options, callback) : orig.call(fs2, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig) return orig;
        return function(target, options) {
          var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target);
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296;
            if (stats.gid < 0) stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er)
          return true;
        if (er.code === "ENOSYS")
          return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === "EINVAL" || er.code === "EPERM")
            return true;
        }
        return false;
      }
    }
  }
});

// node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  "node_modules/graceful-fs/legacy-streams.js"(exports2, module2) {
    var Stream = require("stream").Stream;
    module2.exports = legacy;
    function legacy(fs2) {
      return {
        ReadStream,
        WriteStream
      };
      function ReadStream(path2, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path2, options);
        Stream.call(this);
        var self = this;
        this.path = path2;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = "r";
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.encoding) this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ("number" !== typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) {
            throw new Error("start must be <= end");
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function() {
            self._read();
          });
          return;
        }
        fs2.open(this.path, this.flags, this.mode, function(err, fd) {
          if (err) {
            self.emit("error", err);
            self.readable = false;
            return;
          }
          self.fd = fd;
          self.emit("open", fd);
          self._read();
        });
      }
      function WriteStream(path2, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path2, options);
        Stream.call(this);
        this.path = path2;
        this.fd = null;
        this.writable = true;
        this.flags = "w";
        this.encoding = "binary";
        this.mode = 438;
        this.bytesWritten = 0;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) {
            throw new Error("start must be >= zero");
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs2.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  }
});

// node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  "node_modules/graceful-fs/clone.js"(exports2, module2) {
    "use strict";
    module2.exports = clone;
    var getPrototypeOf = Object.getPrototypeOf || function(obj) {
      return obj.__proto__;
    };
    function clone(obj) {
      if (obj === null || typeof obj !== "object")
        return obj;
      if (obj instanceof Object)
        var copy = { __proto__: getPrototypeOf(obj) };
      else
        var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach(function(key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
      });
      return copy;
    }
  }
});

// node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  "node_modules/graceful-fs/graceful-fs.js"(exports2, module2) {
    var fs2 = require("fs");
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone = require_clone();
    var util = require("util");
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === "function" && typeof Symbol.for === "function") {
      gracefulQueue = Symbol.for("graceful-fs.queue");
      previousSymbol = Symbol.for("graceful-fs.previous");
    } else {
      gracefulQueue = "___graceful-fs.queue";
      previousSymbol = "___graceful-fs.previous";
    }
    function noop() {
    }
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function() {
          return queue2;
        }
      });
    }
    var debug = noop;
    if (util.debuglog)
      debug = util.debuglog("gfs4");
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
      debug = function() {
        var m = util.format.apply(util, arguments);
        m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
        console.error(m);
      };
    if (!fs2[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs2, queue);
      fs2.close = (function(fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs2, fd, function(err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === "function")
              cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      })(fs2.close);
      fs2.closeSync = (function(fs$closeSync) {
        function closeSync(fd) {
          fs$closeSync.apply(fs2, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync;
      })(fs2.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
        process.on("exit", function() {
          debug(fs2[gracefulQueue]);
          require("assert").equal(fs2[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs2[gracefulQueue]);
    }
    module2.exports = patch(clone(fs2));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs2.__patched) {
      module2.exports = patch(fs2);
      fs2.__patched = true;
    }
    function patch(fs3) {
      polyfills(fs3);
      fs3.gracefulify = patch;
      fs3.createReadStream = createReadStream;
      fs3.createWriteStream = createWriteStream;
      var fs$readFile = fs3.readFile;
      fs3.readFile = readFile;
      function readFile(path2, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$readFile(path2, options, cb);
        function go$readFile(path3, options2, cb2, startTime) {
          return fs$readFile(path3, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$readFile, [path3, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs3.writeFile;
      fs3.writeFile = writeFile;
      function writeFile(path2, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$writeFile(path2, data, options, cb);
        function go$writeFile(path3, data2, options2, cb2, startTime) {
          return fs$writeFile(path3, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$writeFile, [path3, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs3.appendFile;
      if (fs$appendFile)
        fs3.appendFile = appendFile;
      function appendFile(path2, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$appendFile(path2, data, options, cb);
        function go$appendFile(path3, data2, options2, cb2, startTime) {
          return fs$appendFile(path3, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$appendFile, [path3, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs3.copyFile;
      if (fs$copyFile)
        fs3.copyFile = copyFile;
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === "function") {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs3.readdir;
      fs3.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path2, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path3, options2, cb2, startTime) {
          return fs$readdir(path3, fs$readdirCallback(
            path3,
            options2,
            cb2,
            startTime
          ));
        } : function go$readdir2(path3, options2, cb2, startTime) {
          return fs$readdir(path3, options2, fs$readdirCallback(
            path3,
            options2,
            cb2,
            startTime
          ));
        };
        return go$readdir(path2, options, cb);
        function fs$readdirCallback(path3, options2, cb2, startTime) {
          return function(err, files) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([
                go$readdir,
                [path3, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort)
                files.sort();
              if (typeof cb2 === "function")
                cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === "v0.8") {
        var legStreams = legacy(fs3);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs3.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs3.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs3, "ReadStream", {
        get: function() {
          return ReadStream;
        },
        set: function(val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs3, "WriteStream", {
        get: function() {
          return WriteStream;
        },
        set: function(val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs3, "FileReadStream", {
        get: function() {
          return FileReadStream;
        },
        set: function(val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs3, "FileWriteStream", {
        get: function() {
          return FileWriteStream;
        },
        set: function(val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      function ReadStream(path2, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
            that.read();
          }
        });
      }
      function WriteStream(path2, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
          }
        });
      }
      function createReadStream(path2, options) {
        return new fs3.ReadStream(path2, options);
      }
      function createWriteStream(path2, options) {
        return new fs3.WriteStream(path2, options);
      }
      var fs$open = fs3.open;
      fs3.open = open;
      function open(path2, flags, mode, cb) {
        if (typeof mode === "function")
          cb = mode, mode = null;
        return go$open(path2, flags, mode, cb);
        function go$open(path3, flags2, mode2, cb2, startTime) {
          return fs$open(path3, flags2, mode2, function(err, fd) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$open, [path3, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs3;
    }
    function enqueue(elem) {
      debug("ENQUEUE", elem[0].name, elem[1]);
      fs2[gracefulQueue].push(elem);
      retry();
    }
    var retryTimer;
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs2[gracefulQueue].length; ++i) {
        if (fs2[gracefulQueue][i].length > 2) {
          fs2[gracefulQueue][i][3] = now;
          fs2[gracefulQueue][i][4] = now;
        }
      }
      retry();
    }
    function retry() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs2[gracefulQueue].length === 0)
        return;
      var elem = fs2[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 6e4) {
        debug("TIMEOUT", fn.name, args);
        var cb = args.pop();
        if (typeof cb === "function")
          cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug("RETRY", fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          fs2[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0);
      }
    }
  }
});

// node_modules/fs-extra/lib/fs/index.js
var require_fs = __commonJS({
  "node_modules/fs-extra/lib/fs/index.js"(exports2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var fs2 = require_graceful_fs();
    var api = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "cp",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "glob",
      "lchmod",
      "lchown",
      "lutimes",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "statfs",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((key) => {
      return typeof fs2[key] === "function";
    });
    Object.assign(exports2, fs2);
    api.forEach((method) => {
      exports2[method] = u(fs2[method]);
    });
    exports2.exists = function(filename, callback) {
      if (typeof callback === "function") {
        return fs2.exists(filename, callback);
      }
      return new Promise((resolve) => {
        return fs2.exists(filename, resolve);
      });
    };
    exports2.read = function(fd, buffer, offset, length, position, callback) {
      if (typeof callback === "function") {
        return fs2.read(fd, buffer, offset, length, position, callback);
      }
      return new Promise((resolve, reject) => {
        fs2.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffer: buffer2 });
        });
      });
    };
    exports2.write = function(fd, buffer, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.write(fd, buffer, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffer: buffer2 });
        });
      });
    };
    exports2.readv = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.readv(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.readv(fd, buffers, ...args, (err, bytesRead, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesRead, buffers: buffers2 });
        });
      });
    };
    exports2.writev = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.writev(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffers: buffers2 });
        });
      });
    };
    if (typeof fs2.realpath.native === "function") {
      exports2.realpath.native = u(fs2.realpath.native);
    } else {
      process.emitWarning(
        "fs.realpath.native is not a function. Is fs being monkey-patched?",
        "Warning",
        "fs-extra-WARN0003"
      );
    }
  }
});

// node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/utils.js"(exports2, module2) {
    "use strict";
    var path2 = require("path");
    module2.exports.checkPath = function checkPath(pth) {
      if (process.platform === "win32") {
        const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path2.parse(pth).root, ""));
        if (pathHasInvalidWinCharacters) {
          const error = new Error(`Path contains invalid characters: ${pth}`);
          error.code = "EINVAL";
          throw error;
        }
      }
    };
  }
});

// node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/make-dir.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var { checkPath } = require_utils();
    var getMode = (options) => {
      const defaults = { mode: 511 };
      if (typeof options === "number") return options;
      return { ...defaults, ...options }.mode;
    };
    module2.exports.makeDir = async (dir, options) => {
      checkPath(dir);
      return fs2.mkdir(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
    module2.exports.makeDirSync = (dir, options) => {
      checkPath(dir);
      return fs2.mkdirSync(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
  }
});

// node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var { makeDir: _makeDir, makeDirSync } = require_make_dir();
    var makeDir = u(_makeDir);
    module2.exports = {
      mkdirs: makeDir,
      mkdirsSync: makeDirSync,
      // alias
      mkdirp: makeDir,
      mkdirpSync: makeDirSync,
      ensureDir: makeDir,
      ensureDirSync: makeDirSync
    };
  }
});

// node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = __commonJS({
  "node_modules/fs-extra/lib/path-exists/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs2 = require_fs();
    function pathExists(path2) {
      return fs2.access(path2).then(() => true).catch(() => false);
    }
    module2.exports = {
      pathExists: u(pathExists),
      pathExistsSync: fs2.existsSync
    };
  }
});

// node_modules/fs-extra/lib/util/utimes.js
var require_utimes = __commonJS({
  "node_modules/fs-extra/lib/util/utimes.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var u = require_universalify().fromPromise;
    async function utimesMillis(path2, atime, mtime) {
      const fd = await fs2.open(path2, "r+");
      let closeErr = null;
      try {
        await fs2.futimes(fd, atime, mtime);
      } finally {
        try {
          await fs2.close(fd);
        } catch (e) {
          closeErr = e;
        }
      }
      if (closeErr) {
        throw closeErr;
      }
    }
    function utimesMillisSync(path2, atime, mtime) {
      const fd = fs2.openSync(path2, "r+");
      fs2.futimesSync(fd, atime, mtime);
      return fs2.closeSync(fd);
    }
    module2.exports = {
      utimesMillis: u(utimesMillis),
      utimesMillisSync
    };
  }
});

// node_modules/fs-extra/lib/util/stat.js
var require_stat = __commonJS({
  "node_modules/fs-extra/lib/util/stat.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var path2 = require("path");
    var u = require_universalify().fromPromise;
    function getStats(src, dest, opts) {
      const statFunc = opts.dereference ? (file) => fs2.stat(file, { bigint: true }) : (file) => fs2.lstat(file, { bigint: true });
      return Promise.all([
        statFunc(src),
        statFunc(dest).catch((err) => {
          if (err.code === "ENOENT") return null;
          throw err;
        })
      ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
    }
    function getStatsSync(src, dest, opts) {
      let destStat;
      const statFunc = opts.dereference ? (file) => fs2.statSync(file, { bigint: true }) : (file) => fs2.lstatSync(file, { bigint: true });
      const srcStat = statFunc(src);
      try {
        destStat = statFunc(dest);
      } catch (err) {
        if (err.code === "ENOENT") return { srcStat, destStat: null };
        throw err;
      }
      return { srcStat, destStat };
    }
    async function checkPaths(src, dest, funcName, opts) {
      const { srcStat, destStat } = await getStats(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path2.basename(src);
          const destBaseName = path2.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    function checkPathsSync(src, dest, funcName, opts) {
      const { srcStat, destStat } = getStatsSync(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path2.basename(src);
          const destBaseName = path2.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    async function checkParentPaths(src, srcStat, dest, funcName) {
      const srcParent = path2.resolve(path2.dirname(src));
      const destParent = path2.resolve(path2.dirname(dest));
      if (destParent === srcParent || destParent === path2.parse(destParent).root) return;
      let destStat;
      try {
        destStat = await fs2.stat(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT") return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPaths(src, srcStat, destParent, funcName);
    }
    function checkParentPathsSync(src, srcStat, dest, funcName) {
      const srcParent = path2.resolve(path2.dirname(src));
      const destParent = path2.resolve(path2.dirname(dest));
      if (destParent === srcParent || destParent === path2.parse(destParent).root) return;
      let destStat;
      try {
        destStat = fs2.statSync(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT") return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPathsSync(src, srcStat, destParent, funcName);
    }
    function areIdentical(srcStat, destStat) {
      return destStat.ino !== void 0 && destStat.dev !== void 0 && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
    }
    function isSrcSubdir(src, dest) {
      const srcArr = path2.resolve(src).split(path2.sep).filter((i) => i);
      const destArr = path2.resolve(dest).split(path2.sep).filter((i) => i);
      return srcArr.every((cur, i) => destArr[i] === cur);
    }
    function errMsg(src, dest, funcName) {
      return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
    }
    module2.exports = {
      // checkPaths
      checkPaths: u(checkPaths),
      checkPathsSync,
      // checkParent
      checkParentPaths: u(checkParentPaths),
      checkParentPathsSync,
      // Misc
      isSrcSubdir,
      areIdentical
    };
  }
});

// node_modules/fs-extra/lib/util/async.js
var require_async = __commonJS({
  "node_modules/fs-extra/lib/util/async.js"(exports2, module2) {
    "use strict";
    async function asyncIteratorConcurrentProcess(iterator, fn) {
      const promises = [];
      for await (const item of iterator) {
        promises.push(
          fn(item).then(
            () => null,
            (err) => err ?? new Error("unknown error")
          )
        );
      }
      await Promise.all(
        promises.map(
          (promise) => promise.then((possibleErr) => {
            if (possibleErr !== null) throw possibleErr;
          })
        )
      );
    }
    module2.exports = {
      asyncIteratorConcurrentProcess
    };
  }
});

// node_modules/fs-extra/lib/copy/copy.js
var require_copy = __commonJS({
  "node_modules/fs-extra/lib/copy/copy.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var path2 = require("path");
    var { mkdirs } = require_mkdirs();
    var { pathExists } = require_path_exists();
    var { utimesMillis } = require_utimes();
    var stat = require_stat();
    var { asyncIteratorConcurrentProcess } = require_async();
    async function copy(src, dest, opts = {}) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0001"
        );
      }
      const { srcStat, destStat } = await stat.checkPaths(src, dest, "copy", opts);
      await stat.checkParentPaths(src, srcStat, dest, "copy");
      const include = await runFilter(src, dest, opts);
      if (!include) return;
      const destParent = path2.dirname(dest);
      const dirExists = await pathExists(destParent);
      if (!dirExists) {
        await mkdirs(destParent);
      }
      await getStatsAndPerformCopy(destStat, src, dest, opts);
    }
    async function runFilter(src, dest, opts) {
      if (!opts.filter) return true;
      return opts.filter(src, dest);
    }
    async function getStatsAndPerformCopy(destStat, src, dest, opts) {
      const statFn = opts.dereference ? fs2.stat : fs2.lstat;
      const srcStat = await statFn(src);
      if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
      if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
      if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
      if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
      if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    async function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat) return copyFile(srcStat, src, dest, opts);
      if (opts.overwrite) {
        await fs2.unlink(dest);
        return copyFile(srcStat, src, dest, opts);
      }
      if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    async function copyFile(srcStat, src, dest, opts) {
      await fs2.copyFile(src, dest);
      if (opts.preserveTimestamps) {
        if (fileIsNotWritable(srcStat.mode)) {
          await makeFileWritable(dest, srcStat.mode);
        }
        const updatedSrcStat = await fs2.stat(src);
        await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
      }
      return fs2.chmod(dest, srcStat.mode);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode) {
      return fs2.chmod(dest, srcMode | 128);
    }
    async function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat) {
        await fs2.mkdir(dest);
      }
      await asyncIteratorConcurrentProcess(await fs2.opendir(src), async (item) => {
        const srcItem = path2.join(src, item.name);
        const destItem = path2.join(dest, item.name);
        const include = await runFilter(srcItem, destItem, opts);
        if (include) {
          const { destStat: destStat2 } = await stat.checkPaths(srcItem, destItem, "copy", opts);
          await getStatsAndPerformCopy(destStat2, srcItem, destItem, opts);
        }
      });
      if (!destStat) {
        await fs2.chmod(dest, srcStat.mode);
      }
    }
    async function onLink(destStat, src, dest, opts) {
      let resolvedSrc = await fs2.readlink(src);
      if (opts.dereference) {
        resolvedSrc = path2.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs2.symlink(resolvedSrc, dest);
      }
      let resolvedDest = null;
      try {
        resolvedDest = await fs2.readlink(dest);
      } catch (e) {
        if (e.code === "EINVAL" || e.code === "UNKNOWN") return fs2.symlink(resolvedSrc, dest);
        throw e;
      }
      if (opts.dereference) {
        resolvedDest = path2.resolve(process.cwd(), resolvedDest);
      }
      if (resolvedSrc !== resolvedDest) {
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
      }
      await fs2.unlink(dest);
      return fs2.symlink(resolvedSrc, dest);
    }
    module2.exports = copy;
  }
});

// node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = __commonJS({
  "node_modules/fs-extra/lib/copy/copy-sync.js"(exports2, module2) {
    "use strict";
    var fs2 = require_graceful_fs();
    var path2 = require("path");
    var mkdirsSync = require_mkdirs().mkdirsSync;
    var utimesMillisSync = require_utimes().utimesMillisSync;
    var stat = require_stat();
    function copySync(src, dest, opts) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0002"
        );
      }
      const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "copy");
      if (opts.filter && !opts.filter(src, dest)) return;
      const destParent = path2.dirname(dest);
      if (!fs2.existsSync(destParent)) mkdirsSync(destParent);
      return getStats(destStat, src, dest, opts);
    }
    function getStats(destStat, src, dest, opts) {
      const statSync = opts.dereference ? fs2.statSync : fs2.lstatSync;
      const srcStat = statSync(src);
      if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
      else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
      else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
      else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
      else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat) return copyFile(srcStat, src, dest, opts);
      return mayCopyFile(srcStat, src, dest, opts);
    }
    function mayCopyFile(srcStat, src, dest, opts) {
      if (opts.overwrite) {
        fs2.unlinkSync(dest);
        return copyFile(srcStat, src, dest, opts);
      } else if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    function copyFile(srcStat, src, dest, opts) {
      fs2.copyFileSync(src, dest);
      if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
      return setDestMode(dest, srcStat.mode);
    }
    function handleTimestamps(srcMode, src, dest) {
      if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
      return setDestTimestamps(src, dest);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode) {
      return setDestMode(dest, srcMode | 128);
    }
    function setDestMode(dest, srcMode) {
      return fs2.chmodSync(dest, srcMode);
    }
    function setDestTimestamps(src, dest) {
      const updatedSrcStat = fs2.statSync(src);
      return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
      return copyDir(src, dest, opts);
    }
    function mkDirAndCopy(srcMode, src, dest, opts) {
      fs2.mkdirSync(dest);
      copyDir(src, dest, opts);
      return setDestMode(dest, srcMode);
    }
    function copyDir(src, dest, opts) {
      const dir = fs2.opendirSync(src);
      try {
        let dirent;
        while ((dirent = dir.readSync()) !== null) {
          copyDirItem(dirent.name, src, dest, opts);
        }
      } finally {
        dir.closeSync();
      }
    }
    function copyDirItem(item, src, dest, opts) {
      const srcItem = path2.join(src, item);
      const destItem = path2.join(dest, item);
      if (opts.filter && !opts.filter(srcItem, destItem)) return;
      const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
      return getStats(destStat, srcItem, destItem, opts);
    }
    function onLink(destStat, src, dest, opts) {
      let resolvedSrc = fs2.readlinkSync(src);
      if (opts.dereference) {
        resolvedSrc = path2.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs2.symlinkSync(resolvedSrc, dest);
      } else {
        let resolvedDest;
        try {
          resolvedDest = fs2.readlinkSync(dest);
        } catch (err) {
          if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs2.symlinkSync(resolvedSrc, dest);
          throw err;
        }
        if (opts.dereference) {
          resolvedDest = path2.resolve(process.cwd(), resolvedDest);
        }
        if (resolvedSrc !== resolvedDest) {
          if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
            throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
          }
          if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
            throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
          }
        }
        return copyLink(resolvedSrc, dest);
      }
    }
    function copyLink(resolvedSrc, dest) {
      fs2.unlinkSync(dest);
      return fs2.symlinkSync(resolvedSrc, dest);
    }
    module2.exports = copySync;
  }
});

// node_modules/fs-extra/lib/copy/index.js
var require_copy2 = __commonJS({
  "node_modules/fs-extra/lib/copy/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    module2.exports = {
      copy: u(require_copy()),
      copySync: require_copy_sync()
    };
  }
});

// node_modules/fs-extra/lib/remove/index.js
var require_remove = __commonJS({
  "node_modules/fs-extra/lib/remove/index.js"(exports2, module2) {
    "use strict";
    var fs2 = require_graceful_fs();
    var u = require_universalify().fromCallback;
    function remove(path2, callback) {
      fs2.rm(path2, { recursive: true, force: true }, callback);
    }
    function removeSync(path2) {
      fs2.rmSync(path2, { recursive: true, force: true });
    }
    module2.exports = {
      remove: u(remove),
      removeSync
    };
  }
});

// node_modules/fs-extra/lib/empty/index.js
var require_empty = __commonJS({
  "node_modules/fs-extra/lib/empty/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs2 = require_fs();
    var path2 = require("path");
    var mkdir = require_mkdirs();
    var remove = require_remove();
    var emptyDir = u(async function emptyDir2(dir) {
      let items;
      try {
        items = await fs2.readdir(dir);
      } catch {
        return mkdir.mkdirs(dir);
      }
      return Promise.all(items.map((item) => remove.remove(path2.join(dir, item))));
    });
    function emptyDirSync(dir) {
      let items;
      try {
        items = fs2.readdirSync(dir);
      } catch {
        return mkdir.mkdirsSync(dir);
      }
      items.forEach((item) => {
        item = path2.join(dir, item);
        remove.removeSync(item);
      });
    }
    module2.exports = {
      emptyDirSync,
      emptydirSync: emptyDirSync,
      emptyDir,
      emptydir: emptyDir
    };
  }
});

// node_modules/fs-extra/lib/ensure/file.js
var require_file = __commonJS({
  "node_modules/fs-extra/lib/ensure/file.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var path2 = require("path");
    var fs2 = require_fs();
    var mkdir = require_mkdirs();
    async function createFile(file) {
      let stats;
      try {
        stats = await fs2.stat(file);
      } catch {
      }
      if (stats && stats.isFile()) return;
      const dir = path2.dirname(file);
      let dirStats = null;
      try {
        dirStats = await fs2.stat(dir);
      } catch (err) {
        if (err.code === "ENOENT") {
          await mkdir.mkdirs(dir);
          await fs2.writeFile(file, "");
          return;
        } else {
          throw err;
        }
      }
      if (dirStats.isDirectory()) {
        await fs2.writeFile(file, "");
      } else {
        await fs2.readdir(dir);
      }
    }
    function createFileSync(file) {
      let stats;
      try {
        stats = fs2.statSync(file);
      } catch {
      }
      if (stats && stats.isFile()) return;
      const dir = path2.dirname(file);
      try {
        if (!fs2.statSync(dir).isDirectory()) {
          fs2.readdirSync(dir);
        }
      } catch (err) {
        if (err && err.code === "ENOENT") mkdir.mkdirsSync(dir);
        else throw err;
      }
      fs2.writeFileSync(file, "");
    }
    module2.exports = {
      createFile: u(createFile),
      createFileSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/link.js
var require_link = __commonJS({
  "node_modules/fs-extra/lib/ensure/link.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var path2 = require("path");
    var fs2 = require_fs();
    var mkdir = require_mkdirs();
    var { pathExists } = require_path_exists();
    var { areIdentical } = require_stat();
    async function createLink(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = await fs2.lstat(dstpath);
      } catch {
      }
      let srcStat;
      try {
        srcStat = await fs2.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      if (dstStat && areIdentical(srcStat, dstStat)) return;
      const dir = path2.dirname(dstpath);
      const dirExists = await pathExists(dir);
      if (!dirExists) {
        await mkdir.mkdirs(dir);
      }
      await fs2.link(srcpath, dstpath);
    }
    function createLinkSync(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = fs2.lstatSync(dstpath);
      } catch {
      }
      try {
        const srcStat = fs2.lstatSync(srcpath);
        if (dstStat && areIdentical(srcStat, dstStat)) return;
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      const dir = path2.dirname(dstpath);
      const dirExists = fs2.existsSync(dir);
      if (dirExists) return fs2.linkSync(srcpath, dstpath);
      mkdir.mkdirsSync(dir);
      return fs2.linkSync(srcpath, dstpath);
    }
    module2.exports = {
      createLink: u(createLink),
      createLinkSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink-paths.js"(exports2, module2) {
    "use strict";
    var path2 = require("path");
    var fs2 = require_fs();
    var { pathExists } = require_path_exists();
    var u = require_universalify().fromPromise;
    async function symlinkPaths(srcpath, dstpath) {
      if (path2.isAbsolute(srcpath)) {
        try {
          await fs2.lstat(srcpath);
        } catch (err) {
          err.message = err.message.replace("lstat", "ensureSymlink");
          throw err;
        }
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      }
      const dstdir = path2.dirname(dstpath);
      const relativeToDst = path2.join(dstdir, srcpath);
      const exists = await pathExists(relativeToDst);
      if (exists) {
        return {
          toCwd: relativeToDst,
          toDst: srcpath
        };
      }
      try {
        await fs2.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        throw err;
      }
      return {
        toCwd: srcpath,
        toDst: path2.relative(dstdir, srcpath)
      };
    }
    function symlinkPathsSync(srcpath, dstpath) {
      if (path2.isAbsolute(srcpath)) {
        const exists2 = fs2.existsSync(srcpath);
        if (!exists2) throw new Error("absolute srcpath does not exist");
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      }
      const dstdir = path2.dirname(dstpath);
      const relativeToDst = path2.join(dstdir, srcpath);
      const exists = fs2.existsSync(relativeToDst);
      if (exists) {
        return {
          toCwd: relativeToDst,
          toDst: srcpath
        };
      }
      const srcExists = fs2.existsSync(srcpath);
      if (!srcExists) throw new Error("relative srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: path2.relative(dstdir, srcpath)
      };
    }
    module2.exports = {
      symlinkPaths: u(symlinkPaths),
      symlinkPathsSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink-type.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var u = require_universalify().fromPromise;
    async function symlinkType(srcpath, type) {
      if (type) return type;
      let stats;
      try {
        stats = await fs2.lstat(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    function symlinkTypeSync(srcpath, type) {
      if (type) return type;
      let stats;
      try {
        stats = fs2.lstatSync(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    module2.exports = {
      symlinkType: u(symlinkType),
      symlinkTypeSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var path2 = require("path");
    var fs2 = require_fs();
    var { mkdirs, mkdirsSync } = require_mkdirs();
    var { symlinkPaths, symlinkPathsSync } = require_symlink_paths();
    var { symlinkType, symlinkTypeSync } = require_symlink_type();
    var { pathExists } = require_path_exists();
    var { areIdentical } = require_stat();
    async function createSymlink(srcpath, dstpath, type) {
      let stats;
      try {
        stats = await fs2.lstat(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        let srcStat;
        if (path2.isAbsolute(srcpath)) {
          srcStat = await fs2.stat(srcpath);
        } else {
          const dstdir = path2.dirname(dstpath);
          const relativeToDst = path2.join(dstdir, srcpath);
          try {
            srcStat = await fs2.stat(relativeToDst);
          } catch {
            srcStat = await fs2.stat(srcpath);
          }
        }
        const dstStat = await fs2.stat(dstpath);
        if (areIdentical(srcStat, dstStat)) return;
      }
      const relative = await symlinkPaths(srcpath, dstpath);
      srcpath = relative.toDst;
      const toType = await symlinkType(relative.toCwd, type);
      const dir = path2.dirname(dstpath);
      if (!await pathExists(dir)) {
        await mkdirs(dir);
      }
      return fs2.symlink(srcpath, dstpath, toType);
    }
    function createSymlinkSync(srcpath, dstpath, type) {
      let stats;
      try {
        stats = fs2.lstatSync(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        let srcStat;
        if (path2.isAbsolute(srcpath)) {
          srcStat = fs2.statSync(srcpath);
        } else {
          const dstdir = path2.dirname(dstpath);
          const relativeToDst = path2.join(dstdir, srcpath);
          try {
            srcStat = fs2.statSync(relativeToDst);
          } catch {
            srcStat = fs2.statSync(srcpath);
          }
        }
        const dstStat = fs2.statSync(dstpath);
        if (areIdentical(srcStat, dstStat)) return;
      }
      const relative = symlinkPathsSync(srcpath, dstpath);
      srcpath = relative.toDst;
      type = symlinkTypeSync(relative.toCwd, type);
      const dir = path2.dirname(dstpath);
      const exists = fs2.existsSync(dir);
      if (exists) return fs2.symlinkSync(srcpath, dstpath, type);
      mkdirsSync(dir);
      return fs2.symlinkSync(srcpath, dstpath, type);
    }
    module2.exports = {
      createSymlink: u(createSymlink),
      createSymlinkSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/index.js
var require_ensure = __commonJS({
  "node_modules/fs-extra/lib/ensure/index.js"(exports2, module2) {
    "use strict";
    var { createFile, createFileSync } = require_file();
    var { createLink, createLinkSync } = require_link();
    var { createSymlink, createSymlinkSync } = require_symlink();
    module2.exports = {
      // file
      createFile,
      createFileSync,
      ensureFile: createFile,
      ensureFileSync: createFileSync,
      // link
      createLink,
      createLinkSync,
      ensureLink: createLink,
      ensureLinkSync: createLinkSync,
      // symlink
      createSymlink,
      createSymlinkSync,
      ensureSymlink: createSymlink,
      ensureSymlinkSync: createSymlinkSync
    };
  }
});

// node_modules/jsonfile/utils.js
var require_utils2 = __commonJS({
  "node_modules/jsonfile/utils.js"(exports2, module2) {
    function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
      const EOF = finalEOL ? EOL : "";
      const str = JSON.stringify(obj, replacer, spaces);
      if (str === void 0) {
        throw new TypeError(`Converting ${typeof obj} value to JSON is not supported`);
      }
      return str.replace(/\n/g, EOL) + EOF;
    }
    function stripBom(content) {
      if (Buffer.isBuffer(content)) content = content.toString("utf8");
      return content.replace(/^\uFEFF/, "");
    }
    module2.exports = { stringify, stripBom };
  }
});

// node_modules/jsonfile/index.js
var require_jsonfile = __commonJS({
  "node_modules/jsonfile/index.js"(exports2, module2) {
    var _fs;
    try {
      _fs = require_graceful_fs();
    } catch (_) {
      _fs = require("fs");
    }
    var universalify = require_universalify();
    var { stringify, stripBom } = require_utils2();
    async function _readFile(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs2 = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      let data = await universalify.fromCallback(fs2.readFile)(file, options);
      data = stripBom(data);
      let obj;
      try {
        obj = JSON.parse(data, options ? options.reviver : null);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
      return obj;
    }
    var readFile = universalify.fromPromise(_readFile);
    function readFileSync(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs2 = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      try {
        let content = fs2.readFileSync(file, options);
        content = stripBom(content);
        return JSON.parse(content, options.reviver);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
    }
    async function _writeFile(file, obj, options = {}) {
      const fs2 = options.fs || _fs;
      const str = stringify(obj, options);
      await universalify.fromCallback(fs2.writeFile)(file, str, options);
    }
    var writeFile = universalify.fromPromise(_writeFile);
    function writeFileSync(file, obj, options = {}) {
      const fs2 = options.fs || _fs;
      const str = stringify(obj, options);
      return fs2.writeFileSync(file, str, options);
    }
    module2.exports = {
      readFile,
      readFileSync,
      writeFile,
      writeFileSync
    };
  }
});

// node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile2 = __commonJS({
  "node_modules/fs-extra/lib/json/jsonfile.js"(exports2, module2) {
    "use strict";
    var jsonFile = require_jsonfile();
    module2.exports = {
      // jsonfile exports
      readJson: jsonFile.readFile,
      readJsonSync: jsonFile.readFileSync,
      writeJson: jsonFile.writeFile,
      writeJsonSync: jsonFile.writeFileSync
    };
  }
});

// node_modules/fs-extra/lib/output-file/index.js
var require_output_file = __commonJS({
  "node_modules/fs-extra/lib/output-file/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs2 = require_fs();
    var path2 = require("path");
    var mkdir = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    async function outputFile(file, data, encoding = "utf-8") {
      const dir = path2.dirname(file);
      if (!await pathExists(dir)) {
        await mkdir.mkdirs(dir);
      }
      return fs2.writeFile(file, data, encoding);
    }
    function outputFileSync(file, ...args) {
      const dir = path2.dirname(file);
      if (!fs2.existsSync(dir)) {
        mkdir.mkdirsSync(dir);
      }
      fs2.writeFileSync(file, ...args);
    }
    module2.exports = {
      outputFile: u(outputFile),
      outputFileSync
    };
  }
});

// node_modules/fs-extra/lib/json/output-json.js
var require_output_json = __commonJS({
  "node_modules/fs-extra/lib/json/output-json.js"(exports2, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFile } = require_output_file();
    async function outputJson(file, data, options = {}) {
      const str = stringify(data, options);
      await outputFile(file, str, options);
    }
    module2.exports = outputJson;
  }
});

// node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = __commonJS({
  "node_modules/fs-extra/lib/json/output-json-sync.js"(exports2, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFileSync } = require_output_file();
    function outputJsonSync(file, data, options) {
      const str = stringify(data, options);
      outputFileSync(file, str, options);
    }
    module2.exports = outputJsonSync;
  }
});

// node_modules/fs-extra/lib/json/index.js
var require_json = __commonJS({
  "node_modules/fs-extra/lib/json/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var jsonFile = require_jsonfile2();
    jsonFile.outputJson = u(require_output_json());
    jsonFile.outputJsonSync = require_output_json_sync();
    jsonFile.outputJSON = jsonFile.outputJson;
    jsonFile.outputJSONSync = jsonFile.outputJsonSync;
    jsonFile.writeJSON = jsonFile.writeJson;
    jsonFile.writeJSONSync = jsonFile.writeJsonSync;
    jsonFile.readJSON = jsonFile.readJson;
    jsonFile.readJSONSync = jsonFile.readJsonSync;
    module2.exports = jsonFile;
  }
});

// node_modules/fs-extra/lib/move/move.js
var require_move = __commonJS({
  "node_modules/fs-extra/lib/move/move.js"(exports2, module2) {
    "use strict";
    var fs2 = require_fs();
    var path2 = require("path");
    var { copy } = require_copy2();
    var { remove } = require_remove();
    var { mkdirp } = require_mkdirs();
    var { pathExists } = require_path_exists();
    var stat = require_stat();
    async function move(src, dest, opts = {}) {
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = await stat.checkPaths(src, dest, "move", opts);
      await stat.checkParentPaths(src, srcStat, dest, "move");
      const destParent = path2.dirname(dest);
      const parsedParentPath = path2.parse(destParent);
      if (parsedParentPath.root !== destParent) {
        await mkdirp(destParent);
      }
      return doRename(src, dest, overwrite, isChangingCase);
    }
    async function doRename(src, dest, overwrite, isChangingCase) {
      if (!isChangingCase) {
        if (overwrite) {
          await remove(dest);
        } else if (await pathExists(dest)) {
          throw new Error("dest already exists.");
        }
      }
      try {
        await fs2.rename(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV") {
          throw err;
        }
        await moveAcrossDevice(src, dest, overwrite);
      }
    }
    async function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true,
        preserveTimestamps: true
      };
      await copy(src, dest, opts);
      return remove(src);
    }
    module2.exports = move;
  }
});

// node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = __commonJS({
  "node_modules/fs-extra/lib/move/move-sync.js"(exports2, module2) {
    "use strict";
    var fs2 = require_graceful_fs();
    var path2 = require("path");
    var copySync = require_copy2().copySync;
    var removeSync = require_remove().removeSync;
    var mkdirpSync = require_mkdirs().mkdirpSync;
    var stat = require_stat();
    function moveSync(src, dest, opts) {
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "move");
      if (!isParentRoot(dest)) mkdirpSync(path2.dirname(dest));
      return doRename(src, dest, overwrite, isChangingCase);
    }
    function isParentRoot(dest) {
      const parent = path2.dirname(dest);
      const parsedPath = path2.parse(parent);
      return parsedPath.root === parent;
    }
    function doRename(src, dest, overwrite, isChangingCase) {
      if (isChangingCase) return rename(src, dest, overwrite);
      if (overwrite) {
        removeSync(dest);
        return rename(src, dest, overwrite);
      }
      if (fs2.existsSync(dest)) throw new Error("dest already exists.");
      return rename(src, dest, overwrite);
    }
    function rename(src, dest, overwrite) {
      try {
        fs2.renameSync(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV") throw err;
        return moveAcrossDevice(src, dest, overwrite);
      }
    }
    function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true,
        preserveTimestamps: true
      };
      copySync(src, dest, opts);
      return removeSync(src);
    }
    module2.exports = moveSync;
  }
});

// node_modules/fs-extra/lib/move/index.js
var require_move2 = __commonJS({
  "node_modules/fs-extra/lib/move/index.js"(exports2, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    module2.exports = {
      move: u(require_move()),
      moveSync: require_move_sync()
    };
  }
});

// node_modules/fs-extra/lib/index.js
var require_lib = __commonJS({
  "node_modules/fs-extra/lib/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      // Export promiseified graceful-fs:
      ...require_fs(),
      // Export extra methods:
      ...require_copy2(),
      ...require_empty(),
      ...require_ensure(),
      ...require_json(),
      ...require_mkdirs(),
      ...require_move2(),
      ...require_output_file(),
      ...require_path_exists(),
      ...require_remove()
    };
  }
});

// src/creova/apk/apkInjector.ts
var require_apkInjector = __commonJS({
  "src/creova/apk/apkInjector.ts"(exports2, module2) {
    "use strict";
    var import_child_process = require("child_process");
    var import_fs_extra2 = __toESM(require_lib());
    var import_path2 = __toESM(require("path"));
    function resolveToolPath(toolName) {
      const candidates = [
        process.resourcesPath && import_path2.default.join(process.resourcesPath, "tools", toolName),
        import_path2.default.join(__dirname, "tools", toolName)
      ].filter(Boolean);
      for (const candidate of candidates) {
        if (import_fs_extra2.default.pathExistsSync(candidate)) return candidate;
      }
      return candidates[1] || candidates[0];
    }
    var TOOLS = {
      get apktool() {
        return import_path2.default.join(resolveToolPath("apktool"), "apktool.jar");
      },
      get signer() {
        return import_path2.default.join(resolveToolPath("signer"), "uber-apk-signer.jar");
      },
      get smali() {
        return import_path2.default.join(resolveToolPath("smali"), "smali.jar");
      }
    };
    function resolveJavaBinary() {
      const javaBinName = process.platform === "win32" ? "java.exe" : "java";
      const candidateBins = [];
      const javaHome = process.env.JAVA_HOME;
      if (javaHome) {
        candidateBins.push(import_path2.default.join(javaHome, "bin", javaBinName));
      }
      if (process.platform === "win32") {
        const roots = [
          "C:\\Program Files\\Eclipse Adoptium",
          "C:\\Program Files\\Java",
          "C:\\Program Files (x86)\\Java"
        ];
        for (const root of roots) {
          if (!import_fs_extra2.default.pathExistsSync(root)) continue;
          try {
            const dirs = import_fs_extra2.default.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().reverse();
            for (const dir of dirs) {
              candidateBins.push(import_path2.default.join(root, dir, "bin", javaBinName));
            }
          } catch (_) {
          }
        }
      }
      for (const candidate of candidateBins) {
        if (import_fs_extra2.default.pathExistsSync(candidate)) return candidate;
      }
      return "java";
    }
    function isJavaMissingMessage(text = "") {
      const t = text.toLowerCase();
      return t.includes("is not recognized as an internal or external command") || t.includes("command not found") || t.includes("could not find or load main class java") || t.includes("no such file or directory");
    }
    var ApkInjector2 = class {
      constructor() {
        this.workingDir = null;
        this.projectName = "LeapApp";
      }
      async initialize(projectName = "LeapApp") {
        this.projectName = projectName.replace(/[^a-zA-Z0-9]/g, "");
        this.workingDir = import_path2.default.join(
          require("os").tmpdir(),
          "leapblocks_apk",
          `inject_${this.projectName}_${Date.now()}`
        );
        await import_fs_extra2.default.ensureDir(this.workingDir);
        console.log("[ApkInjector] initialize() \u2014 workingDir:", this.workingDir);
        console.log("[ApkInjector]   Apktool:", TOOLS.apktool);
        console.log("[ApkInjector]   Signer:", TOOLS.signer);
        console.log("[ApkInjector]   Java binary:", resolveJavaBinary());
      }
      async runJava(args, description, onProgress) {
        return new Promise((resolve, reject) => {
          const javaBin = resolveJavaBinary();
          console.log(`[ApkInjector runJava] Executing: ${javaBin} -jar ${args.join(" ")}`);
          console.log(`[ApkInjector runJava] Working Dir: ${this.workingDir}`);
          const child = (0, import_child_process.spawn)(javaBin, ["-jar", ...args], {
            cwd: this.workingDir ?? void 0,
            shell: false,
            stdio: ["pipe", "pipe", "pipe"]
          });
          let stdout = "";
          let stderr = "";
          child.stdout?.on("data", (data) => {
            const line = data.toString().trim();
            stdout += line + "\n";
            onProgress?.({ stage: "tool_output", message: line });
          });
          child.stderr?.on("data", (data) => {
            const line = data.toString().trim();
            stderr += line + "\n";
            onProgress?.({ stage: "tool_output", message: line });
          });
          child.on("error", (err) => {
            if (err.message.includes("ENOENT")) {
              reject(new Error("Java not found. Install JDK 8+ and add to PATH."));
            } else {
              reject(err);
            }
          });
          child.on("close", (code) => {
            if (code === 0) {
              resolve({ stdout, stderr });
            } else {
              if (isJavaMissingMessage(stderr) || isJavaMissingMessage(stdout)) {
                reject(new Error("Java runtime not found. Install JDK 8+ and set JAVA_HOME (or add java to PATH), then restart LeapBlocks."));
                return;
              }
              reject(new Error(`${description} failed (exit ${code}):
${stderr || stdout}`));
            }
          });
        });
      }
      async decodeApk(templatePath, onProgress) {
        console.log("[ApkInjector] decodeApk() - template:", templatePath);
        console.log("[ApkInjector]   Template exists:", await import_fs_extra2.default.pathExists(templatePath));
        console.log("[ApkInjector]   Template size:", (await import_fs_extra2.default.stat(templatePath).catch(() => null))?.size);
        onProgress?.({ stage: "decoding", progress: 10, message: "Decoding template APK..." });
        const decodedDir = import_path2.default.join(this.workingDir, "decoded");
        await import_fs_extra2.default.ensureDir(decodedDir);
        console.log("[ApkInjector]   Decoded dir:", decodedDir);
        await this.runJava(
          [TOOLS.apktool, "decode", "-f", "-o", decodedDir, templatePath],
          "APK decode",
          onProgress
        );
        const decodedFiles = await import_fs_extra2.default.readdir(decodedDir).catch(() => []);
        console.log("[ApkInjector]   Decoded files:", decodedFiles.join(", "));
        onProgress?.({ stage: "decoded", progress: 25, message: "Template decoded" });
        return decodedDir;
      }
      async resolveMediaBuffer(item, projectDir) {
        const data = item.data || item.url || item.path || item.filepath;
        const filenameRaw = item.filename || item.name || item.path;
        const filename = filenameRaw ? import_path2.default.basename(String(filenameRaw)) : "";
        console.log(`[ApkInjector] resolveMediaBuffer("${filename}") \u2014 data type: ${typeof data}, data length: ${data ? String(data).length : 0}, projectDir: ${projectDir}`);
        if (Buffer.isBuffer(data)) {
          console.log(`[ApkInjector]   \u2192 data is Buffer (${data.length} bytes)`);
          return data;
        }
        if (typeof data === "string" && data.length > 0) {
          if (data.startsWith("data:")) {
            const commaIdx = data.indexOf(",");
            if (commaIdx >= 0) {
              const b64 = data.substring(commaIdx + 1).trim();
              try {
                const buf = Buffer.from(b64, "base64");
                if (buf.length > 0) {
                  if (buf.length < 100 && (filename.includes(".mp3") || filename.includes(".mp4") || filename.includes(".wav") || filename.includes(".ogg") || filename.includes(".png") || filename.includes(".jpg"))) {
                    console.warn(`[ApkInjector]   \u26A0 WARNING: "${filename}" decoded to only ${buf.length} bytes \u2014 this is likely placeholder data, not a real file. Upload a real file in Media Manager.`);
                  }
                  console.log(`[ApkInjector]   \u2192 resolved from data: URL (${buf.length} bytes)`);
                  return buf;
                }
              } catch (_) {
                console.log(`[ApkInjector]   \u2192 data: URL base64 decode failed`);
              }
            }
          }
          let cleanPath = data.replace(/^file:\/\/\/?/i, "").trim();
          try {
            cleanPath = decodeURIComponent(cleanPath);
          } catch (_) {
          }
          if (process.platform === "win32" && /^\/[a-zA-Z]:/.test(cleanPath)) {
            cleanPath = cleanPath.substring(1);
          }
          if (import_path2.default.isAbsolute(cleanPath)) {
            const exists = await import_fs_extra2.default.pathExists(cleanPath);
            console.log(`[ApkInjector]   \u2192 trying absolute path: "${cleanPath}" exists=${exists}`);
            if (exists) {
              try {
                const stat = await import_fs_extra2.default.stat(cleanPath);
                if (stat.isFile()) {
                  const buf = await import_fs_extra2.default.readFile(cleanPath);
                  if (buf.length > 0) {
                    console.log(`[ApkInjector]   \u2192 resolved from absolute path (${buf.length} bytes)`);
                    return buf;
                  }
                }
              } catch (_) {
              }
            }
          } else if (projectDir) {
            const resolvedRelative = import_path2.default.join(projectDir, cleanPath);
            const exists = await import_fs_extra2.default.pathExists(resolvedRelative);
            console.log(`[ApkInjector]   \u2192 trying relative path via projectDir: "${resolvedRelative}" exists=${exists}`);
            if (exists) {
              try {
                const stat = await import_fs_extra2.default.stat(resolvedRelative);
                if (stat.isFile()) {
                  const buf = await import_fs_extra2.default.readFile(resolvedRelative);
                  if (buf.length > 0) {
                    console.log(`[ApkInjector]   \u2192 resolved from relative path (${buf.length} bytes)`);
                    return buf;
                  }
                }
              } catch (_) {
              }
            }
          } else {
            console.log(`[ApkInjector]   \u2192 cannot resolve relative path without projectDir`);
          }
          if (!data.includes("\\") && !data.includes(":") && !data.startsWith("http") && !data.startsWith("data:")) {
            try {
              const buf = Buffer.from(data, "base64");
              if (buf.length > 10) {
                const isPng = buf[0] === 137 && buf[1] === 80;
                const isJpeg = buf[0] === 255 && buf[1] === 216;
                const isGif = buf[0] === 71 && buf[1] === 73;
                const isMp3 = buf[0] === 255 && (buf[1] & 224) === 224;
                const isMp4 = buf.length > 12 && buf[4] === 102 && buf[5] === 116;
                if (isPng || isJpeg || isGif || isMp3 || isMp4) {
                  console.log(`[ApkInjector]   \u2192 resolved from raw base64 data (${buf.length} bytes)`);
                  return buf;
                }
              }
            } catch (_) {
              console.log(`[ApkInjector]   \u2192 raw base64 decode failed`);
            }
          }
        }
        if (filename) {
          const homedir = require("os").homedir();
          const candidates = [
            projectDir && import_path2.default.join(projectDir, filename),
            projectDir && import_path2.default.join(projectDir, "media", filename),
            projectDir && import_path2.default.join(projectDir, "assets", filename),
            projectDir && import_path2.default.join(projectDir, "uploads", filename),
            import_path2.default.join(homedir, "Downloads", filename),
            import_path2.default.join(homedir, "Desktop", filename)
          ].filter(Boolean);
          const ext = filename.includes(".") ? import_path2.default.extname(filename).toLowerCase() : "";
          const isMediaFile = [".mp3", ".mp4", ".wav", ".ogg", ".aac", ".flac", ".avi", ".mov", ".mkv", ".webm"].includes(ext);
          const minSearchSize = isMediaFile ? 1024 : 10;
          console.log(`[ApkInjector]   \u2192 trying filename-based search (minSize=${minSearchSize})`);
          for (const cand of candidates) {
            const exists = await import_fs_extra2.default.pathExists(cand);
            console.log(`[ApkInjector]     check: "${cand}" exists=${exists}`);
            if (exists) {
              try {
                const stat = await import_fs_extra2.default.stat(cand);
                if (stat.isFile() && stat.size >= minSearchSize) {
                  const buf = await import_fs_extra2.default.readFile(cand);
                  if (buf.length >= minSearchSize) {
                    console.log(`[ApkInjector]   \u2192 resolved via filename search (${buf.length} bytes)`);
                    return buf;
                  }
                }
              } catch (_) {
              }
            }
          }
        }
        console.log(`[ApkInjector]   \u2192 FAILED to resolve buffer for "${filename}" \u2014 data preview: ${typeof data === "string" ? data.substring(0, 80) : String(data)}`);
        return null;
      }
      async injectAssets(decodedDir, webAppFiles, mediaAssets, onProgress, projectDir) {
        console.log("[ApkInjector] injectAssets()");
        console.log("[ApkInjector]   decodedDir:", decodedDir);
        console.log("[ApkInjector]   webAppFiles:", Object.keys(webAppFiles).length, "files");
        console.log("[ApkInjector]   mediaAssets:", mediaAssets?.length || 0, "items");
        console.log("[ApkInjector]   projectDir:", projectDir);
        onProgress?.({ stage: "injecting", progress: 35, message: "Injecting web assets..." });
        const assetsDir = import_path2.default.join(decodedDir, "assets");
        const wwwDir = import_path2.default.join(assetsDir, "www");
        const mediaDir = import_path2.default.join(wwwDir, "media");
        await import_fs_extra2.default.ensureDir(mediaDir);
        let written = 0;
        for (const [filePath, content] of Object.entries(webAppFiles)) {
          const fullPath = import_path2.default.join(wwwDir, filePath);
          await import_fs_extra2.default.ensureDir(import_path2.default.dirname(fullPath));
          await import_fs_extra2.default.writeFile(fullPath, content);
          written++;
        }
        console.log("[ApkInjector]   wrote", written, "web app files to", wwwDir);
        if (mediaAssets?.length) {
          let injected = 0;
          let skipped = 0;
          onProgress?.({ stage: "media_inject_start", message: `Injecting ${mediaAssets.length} media file(s)...` });
          for (const item of mediaAssets) {
            const filenameRaw = item.filename || item.name || item.path;
            if (!filenameRaw) {
              skipped++;
              continue;
            }
            const filename = import_path2.default.basename(String(filenameRaw));
            try {
              const buffer = await this.resolveMediaBuffer(item, projectDir);
              const ext = import_path2.default.extname(filename).toLowerCase();
              const isMedia = [".mp3", ".mp4", ".wav", ".ogg", ".aac", ".flac", ".avi", ".mov", ".mkv", ".webm"].includes(ext);
              const minSize = isMedia ? 1024 : 10;
              if (buffer && buffer.length >= minSize) {
                await import_fs_extra2.default.writeFile(import_path2.default.join(mediaDir, filename), buffer);
                await import_fs_extra2.default.writeFile(import_path2.default.join(wwwDir, filename), buffer);
                injected++;
                console.log(`[ApkInjector]   \u2713 Injected media: ${filename} (${buffer.length} bytes)`);
                onProgress?.({ stage: "media_injected", message: `  \u2713 ${filename} (${buffer.length} bytes)` });
              } else {
                skipped++;
                const reason = !buffer || buffer.length === 0 ? "no data resolved" : `too small (${buffer.length} bytes, minimum ${minSize})`;
                console.log(`[ApkInjector]   \u2717 Skipped media (${reason}): ${filename}`);
                onProgress?.({ stage: "media_skip", message: `  \u2717 ${filename} \u2014 ${reason}` });
              }
            } catch (err) {
              skipped++;
              console.log(`[ApkInjector]   \u2717 Skipped media (error): ${filename} - ${err}`);
              onProgress?.({ stage: "media_skip", message: `  \u2717 ${filename} \u2014 error: ${err}` });
            }
          }
          console.log(`[ApkInjector]   Media injection summary: ${injected} injected, ${skipped} skipped`);
          onProgress?.({ stage: "media_summary", message: `Media: ${injected} injected, ${skipped} skipped` });
          const mediaFiles = await import_fs_extra2.default.readdir(mediaDir).catch(() => []);
          console.log("[ApkInjector]   Files in mediaDir:", mediaFiles.join(", "));
        } else {
          console.log("[ApkInjector]   No media assets to inject");
          onProgress?.({ stage: "media_none", message: "No media assets to inject" });
        }
        onProgress?.({ stage: "injected", progress: 50, message: "Assets injected" });
        return assetsDir;
      }
      async modifyManifest(decodedDir, options, onProgress) {
        const { appName, packageName, permissions = [], screenOrientation = null, hasCustomIcon = false } = options;
        onProgress?.({ stage: "manifest", progress: 55, message: "Patching manifest..." });
        const manifestPath = import_path2.default.join(decodedDir, "AndroidManifest.xml");
        if (!await import_fs_extra2.default.pathExists(manifestPath)) {
          onProgress?.({ stage: "manifest_skip", progress: 55, message: "No manifest to patch" });
          return;
        }
        let manifest = await import_fs_extra2.default.readFile(manifestPath, "utf8");
        if (packageName) {
          manifest = manifest.replace(/package="[^"]*"/, `package="${packageName}"`);
        }
        if (appName) {
          manifest = manifest.replace(/android:label="[^"]*"/g, `android:label="${appName}"`);
        }
        const requiredPerms = [
          "android.permission.INTERNET",
          "android.permission.VIBRATE",
          ...permissions
        ];
        for (const perm of requiredPerms) {
          if (!manifest.includes(perm)) {
            manifest = manifest.replace(
              "</manifest>",
              `    <uses-permission android:name="${perm}" />
</manifest>`
            );
          }
        }
        if (!manifest.includes("usesCleartextTraffic")) {
          manifest = manifest.replace("<application", '<application android:usesCleartextTraffic="true"');
        }
        if (!manifest.includes("hardwareAccelerated")) {
          manifest = manifest.replace("<application", '<application android:hardwareAccelerated="true"');
        }
        if (hasCustomIcon) {
          if (!manifest.includes("android:icon=")) {
            manifest = manifest.replace("<application", '<application android:icon="@mipmap/ic_launcher"');
          }
          if (!manifest.includes("android:roundIcon=")) {
            manifest = manifest.replace("<application", '<application android:roundIcon="@mipmap/ic_launcher_round"');
          }
        }
        if (screenOrientation && !manifest.includes("android:screenOrientation=")) {
          manifest = manifest.replace(
            /(<activity\b[^>]*android:name="\.MainActivity"[^>]*)(>)/,
            `$1 android:screenOrientation="${screenOrientation}"$2`
          );
        }
        if (!manifest.includes("android:windowSoftInputMode=")) {
          manifest = manifest.replace(
            /(<activity\b[^>]*android:name="\.MainActivity"[^>]*)(>)/,
            `$1 android:windowSoftInputMode="adjustPan"$2`
          );
        }
        await import_fs_extra2.default.writeFile(manifestPath, manifest);
        console.log("[ApkInjector] modifyManifest() \u2014 patched");
        console.log("[ApkInjector]   appName:", appName, "| packageName:", packageName);
        console.log("[ApkInjector]   permissions:", requiredPerms);
        console.log("[ApkInjector]   screenOrientation:", screenOrientation, "| hasCustomIcon:", hasCustomIcon);
        onProgress?.({ stage: "manifest_done", progress: 60, message: "Manifest patched" });
      }
      generateBluetoothBridgeSmali(pkgPath) {
        return `.class public L${pkgPath}/BluetoothBridge;
.super Ljava/lang/Object;
.source "BluetoothBridge.java"

.field private adapter:Landroid/bluetooth/BluetoothAdapter;
.field private btSocket:Landroid/bluetooth/BluetoothSocket;
.field private outStream:Ljava/io/OutputStream;
.field private inStream:Ljava/io/InputStream;

.method public constructor <init>()V
    .registers 2
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    invoke-static {}, Landroid/bluetooth/BluetoothAdapter;->getDefaultAdapter()Landroid/bluetooth/BluetoothAdapter;
    move-result-object v0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    return-void
.end method

# virtual methods
.method public isAvailable()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 2
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-eqz v0, :cond_4
    const/4 v0, 0x1
    return v0
    :cond_4
    const/4 v0, 0x0
    return v0
.end method

.method public isEnabled()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 2
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-eqz v0, :cond_a
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothAdapter;->isEnabled()Z
    move-result v0
    return v0
    :cond_a
    const/4 v0, 0x0
    return v0
.end method

.method public enable()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 3
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-eqz v0, :cond_c
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothAdapter;->enable()Z
    move-result v0
    return v0
    :cond_c
    const/4 v0, 0x0
    return v0
.end method

.method public getPairedDevices()Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 7
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-nez v0, :cond_7
    const-string v0, "[]"
    return-object v0
    :cond_7
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothAdapter;->getBondedDevices()Ljava/util/Set;
    move-result-object v0
    if-eqz v0, :cond_11
    invoke-interface {v0}, Ljava/util/Set;->isEmpty()Z
    move-result v1
    if-eqz v1, :cond_14
    :cond_11
    const-string v0, "[]"
    return-object v0
    :cond_14
    new-instance v1, Lorg/json/JSONArray;
    invoke-direct {v1}, Lorg/json/JSONArray;-><init>()V
    invoke-interface {v0}, Ljava/util/Set;->iterator()Ljava/util/Iterator;
    move-result-object v0
    :cond_1c
    :goto_1c
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z
    move-result v2
    if-eqz v2, :cond_46
    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;
    move-result-object v2
    check-cast v2, Landroid/bluetooth/BluetoothDevice;
    new-instance v3, Lorg/json/JSONObject;
    invoke-direct {v3}, Lorg/json/JSONObject;-><init>()V
    :try_start_2a
    const-string v4, "name"
    invoke-virtual {v2}, Landroid/bluetooth/BluetoothDevice;->getName()Ljava/lang/String;
    move-result-object v5
    if-eqz v5, :cond_34
    move-object v5, v5
    goto :goto_36
    :cond_34
    const-string v5, "Unknown"
    :goto_36
    invoke-virtual {v3, v4, v5}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;
    const-string v4, "address"
    invoke-virtual {v2}, Landroid/bluetooth/BluetoothDevice;->getAddress()Ljava/lang/String;
    move-result-object v2
    invoke-virtual {v3, v4, v2}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;
    invoke-virtual {v1, v3}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;
    :try_end_44
    .catch Lorg/json/JSONException; {:try_start_2a .. :try_end_44} :catch_45
    goto :goto_1c
    :catch_45
    move-exception v4
    goto :goto_1c
    :cond_46
    invoke-virtual {v1}, Lorg/json/JSONArray;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method

.method public connect(Ljava/lang/String;)Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 6
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-nez v0, :cond_7
    const-string v0, "Bluetooth Adapter not available"
    return-object v0
    :cond_7
    :try_start_7
    invoke-virtual {v0, p1}, Landroid/bluetooth/BluetoothAdapter;->getRemoteDevice(Ljava/lang/String;)Landroid/bluetooth/BluetoothDevice;
    move-result-object p1

    # Standard connection attempt
    :try_start_c
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    if-eqz v0, :cond_19
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    :cond_19
    const-string v0, "00001101-0000-1000-8000-00805F9B34FB"
    invoke-static {v0}, Ljava/util/UUID;->fromString(Ljava/lang/String;)Ljava/util/UUID;
    move-result-object v0
    invoke-virtual {p1, v0}, Landroid/bluetooth/BluetoothDevice;->createRfcommSocketToServiceRecord(Ljava/util/UUID;)Landroid/bluetooth/BluetoothSocket;
    move-result-object v0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothAdapter;->cancelDiscovery()Z
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->connect()V
    :try_end_35
    .catch Ljava/io/IOException; {:try_start_c .. :try_end_35} :catch_36
    goto :goto_78

    :catch_36
    # Standard connection failed, try reflection fallback on channel 1
    move-exception v0
    :try_start_38
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    if-eqz v0, :cond_45
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    :cond_45
    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;
    move-result-object v0
    const/4 v1, 0x1
    new-array v1, v1, [Ljava/lang/Class;
    const/4 v2, 0x0
    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;
    aput-object v3, v1, v2
    const-string v2, "createRfcommSocket"
    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    move-result-object v0
    const/4 v1, 0x1
    new-array v1, v1, [Ljava/lang/Object;
    const/4 v2, 0x1
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;
    move-result-object v2
    const/4 v3, 0x0
    aput-object v2, v1, v3
    invoke-virtual {v0, p1, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    move-result-object p1
    check-cast p1, Landroid/bluetooth/BluetoothSocket;
    iput-object p1, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    invoke-virtual {p1}, Landroid/bluetooth/BluetoothAdapter;->cancelDiscovery()Z
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    invoke-virtual {p1}, Landroid/bluetooth/BluetoothSocket;->connect()V
    :try_end_75
    .catch Ljava/lang/Exception; {:try_start_38 .. :try_end_75} :catch_76

    goto :goto_78

    :catch_76
    move-exception p1
    throw p1

    :goto_78
    # Successfully connected, get streams
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    invoke-virtual {p1}, Landroid/bluetooth/BluetoothSocket;->getOutputStream()Ljava/io/OutputStream;
    move-result-object p1
    iput-object p1, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    invoke-virtual {p1}, Landroid/bluetooth/BluetoothSocket;->getInputStream()Ljava/io/InputStream;
    move-result-object p1
    iput-object p1, p0, L${pkgPath}/BluetoothBridge;->inStream:Ljava/io/InputStream;
    const-string p1, "SUCCESS"
    return-object p1
    :try_end_8e
    .catch Ljava/lang/Throwable; {:try_start_7 .. :try_end_8e} :catch_8f

    :catch_8f
    move-exception v0
    invoke-virtual {p0}, L${pkgPath}/BluetoothBridge;->disconnect()V
    invoke-virtual {v0}, Ljava/lang/Throwable;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method

.method public disconnect()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 3
    :try_start_0
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->inStream:Ljava/io/InputStream;
    if-eqz v0, :cond_9
    invoke-virtual {v0}, Ljava/io/InputStream;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->inStream:Ljava/io/InputStream;
    :cond_9
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    if-eqz v0, :cond_12
    invoke-virtual {v0}, Ljava/io/OutputStream;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    :cond_12
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    if-eqz v0, :cond_1b
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    :cond_1b
    :goto_1b
    return-void
    :catch_1c
    move-exception v0
    goto :goto_1b
    :try_end_1d
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_1d} :catch_1c
.end method

.method public isConnected()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 2
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    if-eqz v0, :cond_a
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->isConnected()Z
    move-result v0
    return v0
    :cond_a
    const/4 v0, 0x0
    return v0
.end method

.method public sendText(Ljava/lang/String;)Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 3
    :try_start_0
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    if-nez v0, :cond_6
    const/4 p1, 0x0
    return p1
    :cond_6
    invoke-virtual {p1}, Ljava/lang/String;->getBytes()[B
    move-result-object p1
    invoke-virtual {v0, p1}, Ljava/io/OutputStream;->write([B)V
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    invoke-virtual {p1}, Ljava/io/OutputStream;->flush()V
    const/4 p1, 0x1
    return p1
    :try_end_12
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_12} :catch_13
    :catch_13
    move-exception v0
    const/4 p1, 0x0
    return p1
.end method

.method public sendBytes(Ljava/lang/String;)Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 8
    :try_start_0
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    if-nez v0, :cond_7

    const/4 v0, 0x0
    return v0

    :cond_7
    if-nez p1, :cond_d

    const/4 v0, 0x0
    return v0

    :cond_d
    invoke-virtual {p1}, Ljava/lang/String;->length()I
    move-result v0
    if-nez v0, :cond_13

    const/4 v0, 0x0
    return v0

    :cond_13
    const-string v0, ","
    invoke-virtual {p1, v0}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;
    move-result-object p1

    array-length v0, p1
    new-array v1, v0, [B

    const/4 v2, 0x0
    :goto_1f
    if-ge v2, v0, :cond_34

    aget-object v3, p1, v2
    invoke-virtual {v3}, Ljava/lang/String;->trim()Ljava/lang/String;
    move-result-object v3
    invoke-static {v3}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I
    move-result v3
    int-to-byte v3, v3
    aput-byte v3, v1, v2

    add-int/lit8 v2, v2, 0x1
    goto :goto_1f

    :cond_34
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    invoke-virtual {v0, v1}, Ljava/io/OutputStream;->write([B)V
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    invoke-virtual {v0}, Ljava/io/OutputStream;->flush()V
    const/4 v0, 0x1
    return v0
    :try_end_40
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_40} :catch_41

    :catch_41
    move-exception v0
    const/4 v0, 0x0
    return v0
.end method

.method public receiveText()Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 5
    :try_start_0
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->inStream:Ljava/io/InputStream;
    if-nez v0, :cond_7
    const-string v0, ""
    return-object v0
    :cond_7
    invoke-virtual {v0}, Ljava/io/InputStream;->available()I
    move-result v1
    if-gtz v1, :cond_10
    const-string v0, ""
    return-object v0
    :cond_10
    new-array v2, v1, [B
    invoke-virtual {v0, v2}, Ljava/io/InputStream;->read([B)I
    move-result v0
    if-lez v0, :cond_1e
    new-instance v1, Ljava/lang/String;
    const/4 v3, 0x0
    invoke-direct {v1, v2, v3, v0}, Ljava/lang/String;-><init>([BII)V
    return-object v1
    :cond_1e
    const-string v0, ""
    return-object v0
    :try_end_21
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_21} :catch_22
    :catch_22
    move-exception v0
    const-string v0, ""
    return-object v0
.end method

.method public performWebRequest(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 11

    const/4 v0, 0x0
    :try_start_0
    invoke-virtual {p1}, Ljava/lang/String;->trim()Ljava/lang/String;
    move-result-object p1
    new-instance v1, Ljava/net/URL;
    invoke-direct {v1, p1}, Ljava/net/URL;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;
    move-result-object v1
    check-cast v1, Ljava/net/HttpURLConnection;
    move-object v0, v1

    # Set method
    invoke-virtual {v0, p2}, Ljava/net/HttpURLConnection;->setRequestMethod(Ljava/lang/String;)V

    # Set timeouts (10000ms)
    const/16 v1, 0x2710
    invoke-virtual {v0, v1}, Ljava/net/HttpURLConnection;->setConnectTimeout(I)V
    invoke-virtual {v0, v1}, Ljava/net/HttpURLConnection;->setReadTimeout(I)V

    # Set headers if not null
    if-eqz p3, :cond_header_end
    invoke-virtual {p3}, Ljava/lang/String;->length()I
    move-result v1
    if-lez v1, :cond_header_end

    :try_start_json
    new-instance v1, Lorg/json/JSONObject;
    invoke-direct {v1, p3}, Lorg/json/JSONObject;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1}, Lorg/json/JSONObject;->keys()Ljava/util/Iterator;
    move-result-object p3

    :goto_keys
    invoke-interface {p3}, Ljava/util/Iterator;->hasNext()Z
    move-result v2
    if-eqz v2, :cond_header_end

    invoke-interface {p3}, Ljava/util/Iterator;->next()Ljava/lang/Object;
    move-result-object v2
    check-cast v2, Ljava/lang/String;

    const-string v3, ""
    invoke-virtual {v1, v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v3

    invoke-virtual {v0, v2, v3}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V
    goto :goto_keys
    :try_end_json
    .catch Ljava/lang/Exception; {:try_start_json .. :try_end_json} :catch_json

    :catch_json
    # ignore

    :cond_header_end
    # Send body if POST/PUT/PATCH and body is not empty
    if-eqz p4, :cond_57
    invoke-virtual {p4}, Ljava/lang/String;->length()I
    move-result v1
    if-lez v1, :cond_57

    const-string v1, "POST"
    invoke-virtual {p2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-nez v1, :cond_4c
    const-string v1, "PUT"
    invoke-virtual {p2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-nez v1, :cond_4c
    const-string v1, "PATCH"
    invoke-virtual {p2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result p2
    if-eqz p2, :cond_57

    :cond_4c
    const/4 p2, 0x1
    invoke-virtual {v0, p2}, Ljava/net/HttpURLConnection;->setDoOutput(Z)V
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getOutputStream()Ljava/io/OutputStream;
    move-result-object p2
    const-string v1, "UTF-8"
    invoke-virtual {p4, v1}, Ljava/lang/String;->getBytes(Ljava/lang/String;)[B
    move-result-object p4
    invoke-virtual {p2, p4}, Ljava/io/OutputStream;->write([B)V
    invoke-virtual {p2}, Ljava/io/OutputStream;->flush()V
    invoke-virtual {p2}, Ljava/io/OutputStream;->close()V

    :cond_57
    # Get response code
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getResponseCode()I
    move-result p2

    # Check input or error stream
    const/16 p4, 0x190
    if-ge p2, p4, :cond_6a
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getInputStream()Ljava/io/InputStream;
    move-result-object p4
    goto :goto_6e
    :cond_6a
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getErrorStream()Ljava/io/InputStream;
    move-result-object p4

    :goto_6e
    if-nez p4, :cond_8b
    new-instance p4, Ljava/lang/StringBuilder;
    invoke-direct {p4}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {p4, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string p2, "|text/plain|"
    invoke-virtual {p4, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {p4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object p2
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V
    return-object p2

    :cond_8b
    new-instance v1, Ljava/io/ByteArrayOutputStream;
    invoke-direct {v1}, Ljava/io/ByteArrayOutputStream;-><init>()V
    const/16 v2, 0x400
    new-array v2, v2, [B

    :goto_94
    invoke-virtual {p4, v2}, Ljava/io/InputStream;->read([B)I
    move-result v3
    const/4 v4, -0x1
    if-eq v3, v4, :cond_a1
    const/4 v4, 0x0
    invoke-virtual {v1, v2, v4, v3}, Ljava/io/ByteArrayOutputStream;->write([BII)V
    goto :goto_94

    :cond_a1
    invoke-virtual {p4}, Ljava/io/InputStream;->close()V

    const-string p4, "UTF-8"
    invoke-virtual {v1, p4}, Ljava/io/ByteArrayOutputStream;->toString(Ljava/lang/String;)Ljava/lang/String;
    move-result-object p4

    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getContentType()Ljava/lang/String;
    move-result-object v1
    if-nez v1, :cond_b2
    const-string v1, "text/plain"

    :cond_b2
    new-instance v2, Ljava/lang/StringBuilder;
    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {v2, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string p2, "|"
    invoke-virtual {v2, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2, p4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object p2
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V
    return-object p2
    :try_end_cf
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_cf} :catch_d0

    :catch_d0
    move-exception p2
    if-eqz v0, :cond_d6
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V
    :cond_d6
    new-instance p4, Ljava/lang/StringBuilder;
    invoke-direct {p4}, Ljava/lang/StringBuilder;-><init>()V
    const-string v0, "0|text/plain|"
    invoke-virtual {p4, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {p2}, Ljava/lang/Exception;->toString()Ljava/lang/String;
    move-result-object p2
    invoke-virtual {p4, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {p4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object p2
    return-object p2
.end method
`;
      }
      generateLeapChromeClientSmali(pkgPath) {
        const template = import_fs_extra2.default.readFileSync(import_path2.default.join(__dirname, "templates", "LeapChromeClient.smali.template"), "utf8");
        return template.replace(/\{\{packageName\}\}/g, pkgPath);
      }
      generateLeapWebViewClientSmali(pkgPath) {
        const template = import_fs_extra2.default.readFileSync(import_path2.default.join(__dirname, "templates", "LeapWebViewClient.smali.template"), "utf8");
        return template.replace(/\{\{packageName\}\}/g, pkgPath);
      }
      async injectAppIcon(decodedDir, renderedIconsDir, onProgress) {
        let sourceDir = renderedIconsDir;
        if (!sourceDir) {
          const bundledDir = import_path2.default.join(__dirname, "default_icons");
          if (await import_fs_extra2.default.pathExists(bundledDir)) {
            sourceDir = bundledDir;
            console.log("[ApkInjector] injectAppIcon() \u2014 using bundled icons from:", bundledDir);
          }
        }
        if (!sourceDir) {
          console.log("[ApkInjector] injectAppIcon() \u2014 no source icons, skipping");
          return;
        }
        console.log("[ApkInjector] injectAppIcon() \u2014 source:", sourceDir);
        onProgress?.({ stage: "icon_inject", progress: 72, message: "Injecting pre-rendered custom app icons..." });
        try {
          const anyDpiDir = import_path2.default.join(decodedDir, "res", "mipmap-anydpi-v26");
          if (await import_fs_extra2.default.pathExists(anyDpiDir)) {
            await import_fs_extra2.default.remove(anyDpiDir);
            console.log("[ApkInjector]   Removed anydpi-v26 dir");
          }
          const densities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
          let copied = 0;
          for (const d of densities) {
            const sourcePng = import_path2.default.join(sourceDir, `${d}.png`);
            if (await import_fs_extra2.default.pathExists(sourcePng)) {
              const mipmapDir = import_path2.default.join(decodedDir, "res", `mipmap-${d}`);
              await import_fs_extra2.default.ensureDir(mipmapDir);
              await import_fs_extra2.default.copy(sourcePng, import_path2.default.join(mipmapDir, "ic_launcher.png"));
              await import_fs_extra2.default.copy(sourcePng, import_path2.default.join(mipmapDir, "ic_launcher_round.png"));
              copied++;
              console.log(`[ApkInjector]   Copied ${d} icons`);
            }
          }
          console.log("[ApkInjector]   Injected icons for", copied, "densities");
          onProgress?.({ stage: "icon_inject_done", progress: 74, message: "Custom app icons injected successfully" });
        } catch (err) {
          console.error("[ApkInjector]   Icon injection error:", err);
          onProgress?.({ stage: "icon_inject_failed", message: `Icon injection failed: ${err.message}. Using default template icon.` });
        }
      }
      async injectWebViewActivity(decodedDir, packageName, permissions = [], onProgress) {
        if (typeof permissions === "function") {
          onProgress = permissions;
          permissions = [];
        }
        console.log("[ApkInjector] injectWebViewActivity()");
        console.log("[ApkInjector]   packageName:", packageName);
        console.log("[ApkInjector]   permissions:", permissions);
        onProgress?.({ stage: "smali", progress: 65, message: "Injecting WebView activity..." });
        const pkgPath = packageName.replace(/\./g, "/");
        const smaliDir = import_path2.default.join(decodedDir, "smali", ...pkgPath.split("/"));
        await import_fs_extra2.default.ensureDir(smaliDir);
        const smaliPkg = "L" + pkgPath + "/";
        await import_fs_extra2.default.writeFile(
          import_path2.default.join(smaliDir, "BluetoothBridge.smali"),
          this.generateBluetoothBridgeSmali(pkgPath)
        );
        await import_fs_extra2.default.writeFile(
          import_path2.default.join(smaliDir, "LeapChromeClient.smali"),
          this.generateLeapChromeClientSmali(pkgPath)
        );
        await import_fs_extra2.default.writeFile(
          import_path2.default.join(smaliDir, "LeapWebViewClient.smali"),
          this.generateLeapWebViewClientSmali(pkgPath)
        );
        const runtimePerms23 = [
          "android.permission.ACCESS_FINE_LOCATION",
          "android.permission.ACCESS_COARSE_LOCATION",
          "android.permission.CAMERA",
          "android.permission.RECORD_AUDIO",
          "android.permission.SEND_SMS",
          "android.permission.CALL_PHONE",
          "android.permission.READ_CONTACTS",
          "android.permission.READ_EXTERNAL_STORAGE",
          "android.permission.WRITE_EXTERNAL_STORAGE"
        ];
        const runtimePerms31 = [
          "android.permission.BLUETOOTH_CONNECT",
          "android.permission.BLUETOOTH_SCAN",
          "android.permission.BLUETOOTH_ADVERTISE"
        ];
        const needed23 = permissions.filter((p) => runtimePerms23.includes(p));
        const needed31 = permissions.filter((p) => runtimePerms31.includes(p));
        let permissionCode = "";
        if (needed23.length > 0 || needed31.length > 0) {
          permissionCode += `
    # Check SDK version
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I
    const/16 v1, 0x17 # 23
    if-lt v0, v1, :cond_no_perms
`;
          if (needed31.length > 0) {
            permissionCode += `
    const/16 v1, 0x1f # 31
    if-lt v0, v1, :cond_api_23_30

    # API 31+ permissions (both API 31 and API 23 permissions)
    const/4 v1, ${needed31.length + needed23.length}
    new-array v1, v1, [Ljava/lang/String;
`;
            let idx = 0;
            for (const p of [...needed31, ...needed23]) {
              permissionCode += `    const/4 v2, ${idx}
    const-string v3, "${p}"
    aput-object v3, v1, v2
`;
              idx++;
            }
            permissionCode += `    const/16 v2, 0x65
    invoke-virtual {p0, v1, v2}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V
    goto :cond_no_perms

    :cond_api_23_30
`;
          }
          if (needed23.length > 0) {
            permissionCode += `
    # API 23-30 permissions
    const/4 v1, ${needed23.length}
    new-array v1, v1, [Ljava/lang/String;
`;
            let idx = 0;
            for (const p of needed23) {
              permissionCode += `    const/4 v2, ${idx}
    const-string v3, "${p}"
    aput-object v3, v1, v2
`;
              idx++;
            }
            permissionCode += `    const/16 v2, 0x65
    invoke-virtual {p0, v1, v2}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V
`;
          }
          permissionCode += `
    :cond_no_perms
`;
        }
        const smali = import_fs_extra2.default.readFileSync(import_path2.default.join(__dirname, "templates", "MainActivity.smali.template"), "utf8").replace(/\{\{smaliPkg\}\}/g, smaliPkg).replace(/\{\{permissionCode\}\}/g, permissionCode).replace(/\{\{packageName\}\}/g, pkgPath);
        await import_fs_extra2.default.writeFile(import_path2.default.join(smaliDir, "MainActivity.smali"), smali);
        console.log("[ApkInjector]   Wrote smali files to:", smaliDir);
        console.log("[ApkInjector]   Files: MainActivity.smali, BluetoothBridge.smali, LeapChromeClient.smali, LeapWebViewClient.smali");
        console.log("[ApkInjector]   Runtime permissions needed (API 23):", needed23);
        console.log("[ApkInjector]   Runtime permissions needed (API 31):", needed31);
        onProgress?.({ stage: "smali_done", progress: 70, message: "WebView activity and Bluetooth bridge injected" });
      }
      async rebuildApk(decodedDir, outputApkPath, onProgress) {
        console.log("[ApkInjector] rebuildApk()");
        console.log("[ApkInjector]   decodedDir:", decodedDir);
        console.log("[ApkInjector]   outputApkPath:", outputApkPath);
        onProgress?.({ stage: "rebuilding", progress: 75, message: "Rebuilding APK..." });
        await this.runJava(
          [TOOLS.apktool, "build", "-f", "-o", outputApkPath, decodedDir],
          "APK rebuild",
          onProgress
        );
        const exists = await import_fs_extra2.default.pathExists(outputApkPath);
        const size = exists ? (await import_fs_extra2.default.stat(outputApkPath)).size : 0;
        console.log("[ApkInjector]   Rebuilt APK:", outputApkPath, `exists=${exists} size=${size}`);
        onProgress?.({ stage: "rebuilt", progress: 85, message: "APK rebuilt" });
        return outputApkPath;
      }
      async signApk(unsignedApkPath, outputDir, onProgress) {
        console.log("[ApkInjector] signApk()");
        console.log("[ApkInjector]   unsigned:", unsignedApkPath);
        console.log("[ApkInjector]   outputDir:", outputDir);
        onProgress?.({ stage: "signing", progress: 90, message: "Signing APK..." });
        const unsignedExists = await import_fs_extra2.default.pathExists(unsignedApkPath);
        console.log("[ApkInjector]   Unsigned APK exists:", unsignedExists);
        if (!unsignedExists) console.log("[ApkInjector]   WARNING: unsigned APK not found!");
        await this.runJava(
          [TOOLS.signer, "-a", unsignedApkPath, "-o", outputDir, "--allowResign"],
          "APK signing",
          onProgress
        );
        const files = await import_fs_extra2.default.readdir(outputDir);
        console.log("[ApkInjector]   Files in outputDir:", files);
        const signedFile = files.find(
          (f) => f.toLowerCase().endsWith(".apk") && (f.includes("debugSigned") || f.includes("aligned"))
        );
        const resultPath = signedFile ? import_path2.default.join(outputDir, signedFile) : unsignedApkPath;
        console.log("[ApkInjector]   Signed APK:", resultPath);
        onProgress?.({ stage: "signed", progress: 98, message: "APK signed" });
        return resultPath;
      }
      async fullBuild(templateApkPath, webAppFiles, appConfig, onProgress) {
        const {
          appName = "LeapApp",
          packageName = "com.leaplab.myapp",
          mediaAssets = [],
          permissions = [],
          screenOrientation = null,
          renderedIconsDir = null
        } = appConfig;
        console.log("[ApkInjector] ==================== fullBuild() ====================");
        console.log("[ApkInjector] appName:", appName, "| packageName:", packageName);
        console.log("[ApkInjector] permissions:", permissions);
        console.log("[ApkInjector] screenOrientation:", screenOrientation);
        console.log("[ApkInjector] renderedIconsDir:", renderedIconsDir);
        console.log("[ApkInjector] mediaAssets count:", mediaAssets.length);
        console.log("[ApkInjector] webAppFiles count:", Object.keys(webAppFiles).length);
        console.log("[ApkInjector] template:", templateApkPath);
        await this.initialize(appName);
        console.log("[ApkInjector] Step 1/7: decodeApk...");
        const decodedDir = await this.decodeApk(templateApkPath, onProgress);
        const projectDir = appConfig.projectDir || (appConfig.projectPath ? import_path2.default.dirname(appConfig.projectPath) : null);
        console.log("[ApkInjector] Step 2/7: injectAssets...");
        await this.injectAssets(decodedDir, webAppFiles, mediaAssets, onProgress, projectDir);
        const hasCustomIcon = !!renderedIconsDir || import_fs_extra2.default.pathExistsSync(import_path2.default.join(__dirname, "default_icons"));
        console.log("[ApkInjector] Step 3/7: modifyManifest...");
        await this.modifyManifest(decodedDir, { appName, packageName, permissions, screenOrientation, hasCustomIcon }, onProgress);
        console.log("[ApkInjector] Step 4/7: injectWebViewActivity...");
        await this.injectWebViewActivity(decodedDir, packageName, permissions, onProgress);
        console.log("[ApkInjector] Step 5/7: injectAppIcon...");
        await this.injectAppIcon(decodedDir, renderedIconsDir ?? void 0, onProgress);
        const unsignedPath = import_path2.default.join(this.workingDir, "unsigned.apk");
        console.log("[ApkInjector] Step 6/7: rebuildApk...");
        await this.rebuildApk(decodedDir, unsignedPath, onProgress);
        const signedOutputDir = import_path2.default.join(this.workingDir, "signed");
        await import_fs_extra2.default.ensureDir(signedOutputDir);
        console.log("[ApkInjector] Step 7/7: signApk...");
        const signedPath = await this.signApk(unsignedPath, signedOutputDir, onProgress);
        onProgress?.({ stage: "complete", progress: 100, message: "Build complete!" });
        console.log("[ApkInjector] ==================== fullBuild() COMPLETE ====================");
        console.log("[ApkInjector] Signed path:", signedPath);
        return signedPath;
      }
      async cleanup() {
        if (this.workingDir && await import_fs_extra2.default.pathExists(this.workingDir)) {
          console.log("[ApkInjector] cleanup() \u2014 removing:", this.workingDir);
          await import_fs_extra2.default.remove(this.workingDir);
        }
      }
    };
    module2.exports = ApkInjector2;
  }
});

// src/creova/apk/htmlGenerator.ts
function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (c) => map[c] || c);
}
function mediaUrl(path2) {
  if (!path2) return "";
  if (typeof path2 !== "string") return "";
  path2 = path2.trim();
  if (path2.startsWith("http://") || path2.startsWith("https://") || path2.startsWith("data:") || path2.startsWith("blob:")) return path2;
  let cleanName = path2;
  if (cleanName.startsWith("file:")) {
    cleanName = cleanName.replace(/^file:\/\/\/?/i, "");
  }
  if (cleanName.includes("/") || cleanName.includes("\\")) {
    cleanName = cleanName.split(/[/\\]/).pop() || cleanName;
  }
  try {
    cleanName = decodeURIComponent(cleanName);
  } catch (_) {
  }
  if (cleanName.startsWith("media/")) return cleanName;
  return "media/" + cleanName;
}
function cssIdSelector(id) {
  if (typeof CSS !== "undefined" && CSS.escape) {
    return "#" + CSS.escape(id);
  }
  return "#" + id.replace(/([!"#$%&'()*+,./:;<=>?@[\]^`{|}~ ])/g, "\\$1");
}
function walkComponentTree(components, fn) {
  for (const comp of components) {
    fn(comp);
    if (comp.children?.length) walkComponentTree(comp.children, fn);
  }
}
function generateComponentCss(comp) {
  const { id, type, props = {} } = comp;
  let css = "";
  const selector = cssIdSelector("comp-" + id);
  const styles = {};
  if (props.Width && props.Width !== "auto") {
    styles.width = typeof props.Width === "number" || /^\d+$/.test(props.Width) ? props.Width + "px" : props.Width;
  }
  if (props.Height && props.Height !== "auto") {
    styles.height = typeof props.Height === "number" || /^\d+$/.test(props.Height) ? props.Height + "px" : props.Height;
  }
  if (props.BackgroundColor && props.BackgroundColor !== "none") styles.backgroundColor = props.BackgroundColor;
  if (props.TextColor) styles.color = props.TextColor;
  if (props.FontSize) styles.fontSize = typeof props.FontSize === "number" ? props.FontSize + "px" : props.FontSize;
  if (props.FontBold) styles.fontWeight = "bold";
  if (props.FontItalic) styles.fontStyle = "italic";
  if (props.Visible === false) styles.display = "none";
  if (props.Image || props.Picture) {
    styles.backgroundImage = `url("${encodeURI(mediaUrl(props.Image || props.Picture))}")`;
    styles.backgroundSize = "100% 100%";
  }
  if (props.Radius !== void 0) styles.borderRadius = props.Radius + "px";
  if (Object.keys(styles).length > 0) {
    css += `${selector} {
`;
    for (const [prop, val] of Object.entries(styles)) {
      css += `  ${camelToKebab(prop)}: ${val};
`;
    }
    css += "}\n";
  }
  if (type === "Canvas" && props.PaintColor) {
    css += `${selector} { stroke: ${props.PaintColor}; }
`;
  }
  return css;
}
function camelToKebab(str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}
function generateIndexHtml(appState) {
  const { appName, screens } = appState;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>${escapeHtml(appName || "My App")}</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="app-root">
    <div class="startup-loading">Loading app...</div>
  </div>
  <script src="app.js"></script>
  <script>
    (function() {
      function showStartupError(message) {
        var root = document.getElementById('app-root');
        if (!root) return;
        root.innerHTML = '';
        var errorBox = document.createElement('div');
        errorBox.className = 'startup-error';
        var title = document.createElement('strong');
        title.textContent = 'App failed to start';
        var detail = document.createElement('span');
        detail.textContent = message || 'Unknown runtime error';
        errorBox.appendChild(title);
        errorBox.appendChild(detail);
        root.appendChild(errorBox);
      }

      function startLeapApp() {
        try {
          if (!window.LeapApp || typeof window.LeapApp.init !== 'function') {
            throw new Error('Generated app runtime was not loaded.');
          }
          window.LeapApp.init();
        } catch (error) {
          showStartupError(error && error.message ? error.message : String(error));
        }
      }

      window.addEventListener('unhandledrejection', function(event) {
        var reason = event.reason;
        showStartupError(reason && reason.message ? reason.message : String(reason || 'Unhandled promise rejection'));
      });

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startLeapApp();
      } else {
        document.addEventListener('DOMContentLoaded', startLeapApp);
      }
    })();
  </script>
</body>
</html>`;
}
var DEFAULT_DESIGN_VIEWPORT = { width: 412, height: 915 };
function firstDefined(...values) {
  for (const value of values) {
    if (value !== void 0 && value !== null) return value;
  }
  return void 0;
}
function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function getDesignViewport(appState) {
  const viewport = appState?.designViewport || {};
  const firstScreen = Array.isArray(appState?.screens) ? appState.screens[0] : null;
  const orientation = String(
    firstDefined(viewport.orientation, firstScreen?.screenOrientation, firstScreen?.ScreenOrientation, "")
  ).toLowerCase();
  const fallback = orientation === "landscape" ? { width: DEFAULT_DESIGN_VIEWPORT.height, height: DEFAULT_DESIGN_VIEWPORT.width } : DEFAULT_DESIGN_VIEWPORT;
  return {
    width: positiveNumber(firstDefined(viewport.width, appState?.designWidth, firstScreen?.designWidth), fallback.width),
    height: positiveNumber(firstDefined(viewport.height, appState?.designHeight, firstScreen?.designHeight), fallback.height)
  };
}
function generateStylesCss(appState) {
  const screens = Array.isArray(appState.screens) && appState.screens.length ? appState.screens : [{ id: "Screen1", components: [], nonVisibleComponents: [] }];
  const designViewport = getDesignViewport(appState);
  let css = `/* Auto-generated by LeapLab AppInverter */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%;
  height: 100%;
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
  background: #ffffff;
}

#app-root {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #ffffff;
}

.startup-loading,
.startup-error {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #1f2937;
  font: 600 16px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.startup-error {
  flex-direction: column;
  gap: 8px;
  background: #fff7ed;
  color: #9a3412;
  text-align: center;
}

.startup-error span {
  max-width: 520px;
  color: #7c2d12;
  font-size: 13px;
  font-weight: 500;
}

.screen {
  width: 100%;
  height: 100%;
  display: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #ffffff;
}

.screen.active {
  display: block;
}

.screen-viewport {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  -webkit-font-smoothing: antialiased;
}

.screen-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 8px;
  gap: 5px;
  background: #ffffff;
}

.comp-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px 12px;
  background: #E0E0E0;
  color: #000000;
  border: 1px solid #BDBDBD;
  border-radius: 12px;
  font-size: 14px;
  font-weight: normal;
  font-family: sans-serif;
  cursor: pointer;
  outline: none;
  -webkit-appearance: none;
  touch-action: manipulation;
  user-select: none;
  text-align: center;
  white-space: nowrap;
}

.comp-button:active {
  opacity: 0.85;
  transform: scale(0.98);
}

.comp-label {
  display: block;
  color: #1f2937;
  padding: 2px 0;
  word-wrap: break-word;
}

.comp-textbox {
  display: block;
  width: 100%;
  min-height: 32px;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
  color: #1f2937;
  background: #FFFFFF;
  outline: none;
  -webkit-appearance: none;
  font-family: sans-serif;
}

.comp-textbox:focus {
  border-color: #4285f4;
}

.comp-image {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: cover;
}
.comp-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #999;
  font-size: 24px;
}

.comp-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #1f2937;
  padding: 2px 4px;
}

.comp-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.comp-slider {
  display: block;
  width: 100%;
  cursor: pointer;
}

.comp-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1f2937;
  padding: 2px 4px;
  cursor: pointer;
}

.comp-switch-track {
  width: 40px;
  height: 20px;
  border-radius: 10px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.comp-switch-track.on { background-color: #2563eb; }
.comp-switch-track.off { background-color: #cbd5e1; }

.comp-switch-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.comp-switch-track.on .comp-switch-thumb { transform: translateX(20px); }
.comp-switch-track.off .comp-switch-thumb { transform: translateX(2px); }

.comp-listview {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border: 1px solid #cbd5e1;
  min-height: 100px;
}

.comp-listview-item {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
  color: #1f2937;
  cursor: pointer;
}

.comp-listview-item:last-child { border-bottom: none; }

.comp-spinner {
  display: block;
  width: 100%;
  min-height: 32px;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  cursor: pointer;
  font-family: sans-serif;
}

.comp-datepicker, .comp-timepicker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 36px;
  padding: 8px 12px;
  border: 1px solid #BDBDBD;
  border-radius: 12px;
  background: #E0E0E0;
  font-size: 14px;
  cursor: pointer;
  font-family: sans-serif;
}

.comp-webviewer { border: 1px solid #cbd5e1; display: block; min-height: 180px; }
.comp-canvas { display: block; touch-action: none; }
.comp-videoplayer { display: block; max-width: 100%; }
.comp-map { display: block; }

.arrangement-horizontal { display: flex; flex-direction: row; flex-wrap: nowrap; gap: 5px; align-items: stretch; min-height: 60px; padding: 4px; }
.arrangement-vertical { display: flex; flex-direction: column; gap: 5px; min-height: 60px; padding: 4px; }
.arrangement-horizontal-scroll { display: flex; flex-direction: row; overflow-x: auto; flex-wrap: nowrap; gap: 5px; min-height: 60px; padding: 4px; }
.arrangement-vertical-scroll { display: flex; flex-direction: column; overflow-y: auto; gap: 5px; min-height: 60px; padding: 4px; }
.arrangement-table { display: grid; gap: 5px; }
.arrangement-absolute { position: relative; min-height: 60px; padding: 4px; }

.toast-notification {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30,30,30,0.92);
  color: white;
  padding: 14px 28px;
  border-radius: 28px;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  animation: toast-in 0.3s ease, toast-out 0.3s ease 2.7s;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes toast-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.app-watermark {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 12px 0;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  border-top: 1px solid #f1f5f9;
  z-index: 100;
  user-select: none;
  pointer-events: none;
}
`;
  for (const screen of screens) {
    const bgColor = screen.backgroundColor || "#ffffff";
    const bgImage = screen.backgroundImage || screen.BackgroundImage || "";
    let screenCss = `${cssIdSelector("screen-" + screen.id)} .screen-viewport { background-color: ${bgColor};`;
    if (bgImage) screenCss += ` background-image: url("${encodeURI(mediaUrl(bgImage))}"); background-size: 100% 100%;`;
    screenCss += " }\n";
    css += screenCss;
    const allComponents = [...screen.components || [], ...screen.nonVisibleComponents || []];
    walkComponentTree(allComponents, (comp) => {
      css += generateComponentCss(comp);
    });
  }
  return css;
}
function validateComponentIdentifiers(screens) {
  const seen = /* @__PURE__ */ new Set();
  for (const screen of screens) {
    const all = [...screen.components || [], ...screen.nonVisibleComponents || []];
    walkComponentTree(all, (comp) => {
      if (seen.has(comp.id)) {
        console.warn(`Duplicate component ID: ${comp.id}`);
      }
      seen.add(comp.id);
    });
  }
}
function generateComponentCreation(comp, parentVar, parentType) {
  const { id, type, props = {} } = comp;
  const tagMap = {
    Button: "button",
    Label: "span",
    TextBox: "input",
    PasswordTextBox: "input",
    Image: "img",
    ListView: "div",
    CheckBox: "div",
    Switch: "div",
    Slider: "input",
    Spinner: "select",
    DatePicker: "button",
    TimePicker: "button",
    Canvas: "canvas",
    WebViewer: "iframe",
    VideoPlayer: "video",
    Map: "div",
    Marker: "div",
    ListPicker: "button",
    ContactPicker: "button",
    PhoneNumberPicker: "button",
    EmailPicker: "button",
    FilePicker: "button",
    ImagePicker: "button",
    HorizontalArrangement: "div",
    HorizontalScrollArrangement: "div",
    VerticalArrangement: "div",
    VerticalScrollArrangement: "div",
    TableArrangement: "div"
  };
  const tag = tagMap[type] || "div";
  const compClassMap = {
    Button: "comp-button",
    Label: "comp-label",
    TextBox: "comp-textbox",
    PasswordTextBox: "comp-textbox",
    Image: "comp-image",
    ListView: "comp-listview",
    CheckBox: "comp-checkbox",
    Switch: "comp-switch",
    Slider: "comp-slider",
    Spinner: "comp-spinner",
    DatePicker: "comp-datepicker",
    TimePicker: "comp-timepicker",
    Canvas: "comp-canvas",
    WebViewer: "comp-webviewer",
    VideoPlayer: "comp-videoplayer",
    Map: "comp-map",
    ListPicker: "comp-button",
    ContactPicker: "comp-button",
    PhoneNumberPicker: "comp-button",
    EmailPicker: "comp-button",
    FilePicker: "comp-button",
    ImagePicker: "comp-button"
  };
  let js = `  // Create: ${id} (${type})
`;
  js += `  var ${id}_el = document.createElement('${tag}');
`;
  js += `  ${id}_el.id = 'comp-${id}';
`;
  const cssClass = compClassMap[type];
  if (cssClass) {
    js += `  ${id}_el.className = '${cssClass}';
`;
  }
  if (props.Width !== void 0 && props.Width !== null && type !== "Canvas") {
    const LENGTH_AUTO = -1;
    const LENGTH_FILL = -2;
    let w;
    if (props.Width === LENGTH_FILL) w = "100%";
    else if (props.Width === LENGTH_AUTO) w = "auto";
    else if (typeof props.Width === "number" && props.Width > 0) w = props.Width + "px";
    else if (props.WidthPercent != null) w = props.WidthPercent + "%";
    if (w) js += `  ${id}_el.style.width = '${w}';
`;
  }
  if (props.Height !== void 0 && props.Height !== null && type !== "Canvas") {
    const LENGTH_AUTO = -1;
    const LENGTH_FILL = -2;
    let h;
    if (props.Height === LENGTH_FILL) h = "100%";
    else if (props.Height === LENGTH_AUTO) h = "auto";
    else if (typeof props.Height === "number" && props.Height > 0) h = props.Height + "px";
    else if (props.HeightPercent != null) h = props.HeightPercent + "%";
    if (h) js += `  ${id}_el.style.height = '${h}';
`;
  }
  if (props.Visible === false) {
    js += `  ${id}_el.style.display = 'none';
`;
  }
  if (parentType === "arrangement-table") {
    const col = props.Column || 0;
    const row = props.Row || 0;
    js += `  ${id}_el.style.gridColumn = '${Number(col) + 1}';
`;
    js += `  ${id}_el.style.gridRow = '${Number(row) + 1}';
`;
  }
  if (type === "TextBox") {
    js += `  ${id}_el.type = 'text';
`;
    js += `  ${id}_el.style.width = '100%';
`;
  } else if (type === "PasswordTextBox") {
    js += `  ${id}_el.type = 'password';
`;
    js += `  ${id}_el.style.width = '100%';
`;
  } else if (type === "Slider") {
    js += `  ${id}_el.type = 'range';
`;
    if (props.MinValue !== void 0) js += `  ${id}_el.min = '${props.MinValue}';
`;
    if (props.MaxValue !== void 0) js += `  ${id}_el.max = '${props.MaxValue}';
`;
    if (props.ThumbEnabled === false) js += `  ${id}_el.style.pointerEvents = 'none';
`;
  } else if (type === "Spinner") {
    if (props.ElementsFromString) {
      js += `  (${JSON.stringify(props.ElementsFromString)}).split(',').forEach(function(item) {
`;
      js += `    var opt = document.createElement('option');
`;
      js += `    opt.textContent = item.trim();
`;
      js += `    ${id}_el.appendChild(opt);
`;
      js += `  });
`;
    } else if (props.Elements) {
      js += `  (${JSON.stringify(props.Elements)}).forEach(function(item) {
`;
      js += `    var opt = document.createElement('option');
`;
      js += `    opt.textContent = item;
`;
      js += `    ${id}_el.appendChild(opt);
`;
      js += `  });
`;
    }
  } else if (type === "Canvas") {
    js += `  ${id}_el.width = ${props.Width || 320};
`;
    js += `  ${id}_el.height = ${props.Height || 320};
`;
  } else if (type === "Map") {
    js += `  ${id}_el.style.width = '${props.Width || 320}px';
`;
    js += `  ${id}_el.style.height = '${props.Height || 320}px';
`;
  } else if (type === "ListView") {
    if (props.ElementsFromString) {
      js += `  (${JSON.stringify(props.ElementsFromString)}).split(',').forEach(function(item) {
`;
      js += `    var itemDiv = document.createElement('div');
`;
      js += `    itemDiv.className = 'comp-listview-item';
`;
      js += `    itemDiv.textContent = item.trim();
`;
      js += `    ${id}_el.appendChild(itemDiv);
`;
      js += `  });
`;
    } else if (props.Elements) {
      js += `  (${JSON.stringify(props.Elements)}).forEach(function(item) {
`;
      js += `    var itemDiv = document.createElement('div');
`;
      js += `    itemDiv.className = 'comp-listview-item';
`;
      js += `    itemDiv.textContent = item;
`;
      js += `    ${id}_el.appendChild(itemDiv);
`;
      js += `  });
`;
    }
  } else if (type === "CheckBox") {
    js += `  var ${id}_cb = document.createElement('input');
`;
    js += `  ${id}_cb.type = 'checkbox';
`;
    js += `  ${id}_cb.id = 'comp-${id}-input';
`;
    if (props.Checked) js += `  ${id}_cb.checked = true;
`;
    js += `  var ${id}_label = document.createElement('span');
`;
    js += `  ${id}_label.textContent = '${escapeHtml(props.Text || "")}';
`;
    js += `  ${id}_el.appendChild(${id}_cb);
`;
    js += `  ${id}_el.appendChild(${id}_label);
`;
  } else if (type === "Switch") {
    const isOn = props.On ? "on" : "off";
    js += `  var ${id}_track = document.createElement('div');
`;
    js += `  ${id}_track.className = 'comp-switch-track ${isOn}';
`;
    js += `  var ${id}_thumb = document.createElement('div');
`;
    js += `  ${id}_thumb.className = 'comp-switch-thumb';
`;
    js += `  ${id}_track.appendChild(${id}_thumb);
`;
    js += `  var ${id}_label = document.createElement('span');
`;
    js += `  ${id}_label.textContent = '${escapeHtml(props.Text || "")}';
`;
    js += `  ${id}_el.appendChild(${id}_track);
`;
    js += `  ${id}_el.appendChild(${id}_label);
`;
    js += `  ${id}_el._state = { on: ${props.On ? "true" : "false"} };
`;
    js += `  ${id}_el.addEventListener('click', function() {
`;
    js += `    this._state.on = !this._state.on;
`;
    js += `    ${id}_track.className = 'comp-switch-track ' + (this._state.on ? 'on' : 'off');
`;
    js += `    if (typeof window['${id}_Changed'] === 'function') window['${id}_Changed']();
`;
    js += `  });
`;
  }
  if (type === "Image" || type === "ImagePicker" || type === "FilePicker" || type === "ContactPicker") {
    js += `  ${id}_el.alt = '${escapeHtml(props.Text || id)}';
`;
  }
  if (type === "WebViewer" && props.HomeUrl) {
    js += `  ${id}_el.src = '${escapeHtml(props.HomeUrl)}';
`;
  }
  if (props.Hint && ["TextBox", "PasswordTextBox"].includes(type)) {
    js += `  ${id}_el.placeholder = '${escapeHtml(props.Hint)}';
`;
  }
  if (props.ReadOnly) {
    js += `  ${id}_el.readOnly = true;
`;
  }
  if (props.Enabled === false) {
    js += `  ${id}_el.disabled = true;
`;
  }
  if (type === "Image") {
    if (props.Picture || props.Image) {
      const pic = String(props.Picture || props.Image);
      js += `  ${id}_el.src = '${escapeHtml(mediaUrl(pic))}';
`;
      js += `  ${id}_el.onerror = function() { this.style.background='#f0f0f0'; this.alt=''; };
`;
    } else {
      js += `  ${id}_el.removeAttribute('src');
`;
      js += `  ${id}_el.alt = '';
`;
      js += `  ${id}_el.style.background = '#f0f0f0';
`;
    }
  }
  if (type === "VideoPlayer" && (props.Source || props.source)) {
    const src = String(props.Source || props.source);
    js += `  ${id}_el.src = '${escapeHtml(mediaUrl(src))}';
`;
  }
  if (type === "Button" || type === "ListPicker" || type === "ContactPicker" || type === "PhoneNumberPicker" || type === "EmailPicker" || type === "FilePicker" || type === "ImagePicker" || type === "DatePicker" || type === "TimePicker") {
    const text = props.Text || props.ElementsFromString || "";
    js += `  ${id}_el.textContent = '${escapeHtml(text)}';
`;
  }
  if (type === "Label") {
    const text = props.Text || "";
    js += `  ${id}_el.textContent = '${escapeHtml(text)}';
`;
  }
  if (props.FontSize) {
    const fs2 = typeof props.FontSize === "number" ? props.FontSize + "px" : props.FontSize;
    js += `  ${id}_el.style.fontSize = '${fs2}';
`;
  }
  if (props.TextColor) {
    js += `  ${id}_el.style.color = '${props.TextColor}';
`;
  }
  if (props.BackgroundColor && props.BackgroundColor !== "none") {
    js += `  ${id}_el.style.backgroundColor = '${props.BackgroundColor}';
`;
  }
  if (props.FontBold) {
    js += `  ${id}_el.style.fontWeight = 'bold';
`;
  }
  if (props.FontItalic) {
    js += `  ${id}_el.style.fontStyle = 'italic';
`;
  }
  if (props.TextAlignment) {
    const ta = props.TextAlignment;
    const align = ta === 2 || ta === "center" || ta === "Center" ? "center" : ta === 3 || ta === "right" || ta === "Right" ? "right" : "left";
    js += `  ${id}_el.style.textAlign = '${align}';
`;
    if (type === "Button" || type === "ListPicker" || type === "ContactPicker" || type === "PhoneNumberPicker" || type === "EmailPicker" || type === "FilePicker" || type === "ImagePicker" || type === "DatePicker" || type === "TimePicker") {
      js += `  ${id}_el.style.justifyContent = ${align === "center" ? "'center'" : align === "right" ? "'flex-end'" : "'flex-start'"};
`;
    }
  }
  if (props.Radius !== void 0) {
    js += `  ${id}_el.style.borderRadius = '${props.Radius}px';
`;
  }
  if (props.Shape && ["Button", "ListPicker", "ContactPicker", "PhoneNumberPicker", "EmailPicker", "FilePicker", "ImagePicker", "DatePicker", "TimePicker"].includes(type)) {
    const shape = props.Shape;
    const br = shape === "rounded" ? "9999px" : shape === "rectangular" ? "0px" : shape === "oval" ? "50%" : "12px";
    js += `  ${id}_el.style.borderRadius = '${br}';
`;
  }
  if (props.Enabled === false) {
    js += `  ${id}_el.disabled = true;
`;
  }
  if (type === "CheckBox" && props.Text) {
    js += `  ${id}_el.querySelector('span').textContent = '${escapeHtml(props.Text)}';
`;
  }
  const clickTypes = ["Button", "ListPicker", "ContactPicker", "PhoneNumberPicker", "EmailPicker", "FilePicker", "ImagePicker", "DatePicker", "TimePicker"];
  if (clickTypes.includes(type)) {
    js += `  ${id}_el.addEventListener('click', function() { if (typeof window['${id}_Click'] === 'function') window['${id}_Click'](); });
`;
  }
  if (type === "TextBox" || type === "PasswordTextBox") {
    js += `  ${id}_el.addEventListener('input', function() { state['${id}'] = state['${id}'] || {}; state['${id}']['Text'] = this.value; if (typeof window['${id}_TextChanged'] === 'function') window['${id}_TextChanged'](); });
`;
    if (props.Text) {
      js += `  ${id}_el.value = '${escapeHtml(String(props.Text))}';
`;
      js += `  state['${id}'] = state['${id}'] || {}; state['${id}']['Text'] = '${escapeHtml(String(props.Text))}';
`;
    }
  }
  if (type === "CheckBox") {
    js += `  ${id}_el.querySelector('input').addEventListener('change', function() { if (typeof window['${id}_Changed'] === 'function') window['${id}_Changed'](); });
`;
  }
  if (type === "Slider") {
    js += `  ${id}_el.addEventListener('input', function() { if (typeof window['${id}_PositionChanged'] === 'function') window['${id}_PositionChanged'](Number(this.value)); });
`;
  }
  if (type === "ListView") {
    js += `  ${id}_el.addEventListener('click', function(e) { var item = e.target.closest('.comp-listview-item'); if (item) { if (typeof window['${id}_AfterPicking'] === 'function') window['${id}_AfterPicking'](); } });
`;
  }
  for (const child of comp.children || []) {
    js += generateComponentCreation(child, `${id}_el`, type);
  }
  const typeArrangementMap = {
    "HorizontalArrangement": "arrangement-horizontal",
    "HorizontalScrollArrangement": "arrangement-horizontal-scroll",
    "VerticalArrangement": "arrangement-vertical",
    "VerticalScrollArrangement": "arrangement-vertical-scroll",
    "TableArrangement": "arrangement-table"
  };
  let arrangementClass = typeArrangementMap[type] || "";
  if (!arrangementClass) {
    arrangementClass = getArrangementClass(props.Arrangement);
  }
  if (arrangementClass) {
    js += `  ${id}_el.classList.add('${arrangementClass}');
`;
  }
  if (arrangementClass && arrangementClass.startsWith("arrangement-")) {
    const getAlign = (name) => {
      if (props[name] !== void 0) return props[name];
      const lower = name.toLowerCase();
      const found = Object.keys(props).find((k) => k.toLowerCase() === lower);
      return found ? props[found] : void 0;
    };
    const hAlign = getAlign("AlignHorizontal");
    const vAlign = getAlign("AlignVertical");
    if (hAlign !== void 0 || vAlign !== void 0) {
      js += `  ${id}_el.style.display = 'flex';
`;
    }
    if (arrangementClass === "arrangement-horizontal" || arrangementClass === "arrangement-horizontal-scroll") {
      const hCenter = hAlign === 2 || hAlign === "Center" || hAlign === "center";
      const hEnd = hAlign === 3 || hAlign === "Right" || hAlign === "right";
      js += `  ${id}_el.style.justifyContent = ${hCenter ? "'center'" : hEnd ? "'flex-end'" : "'flex-start'"};
`;
      const vCenter = vAlign === 2 || vAlign === "Center" || vAlign === "center";
      const vEnd = vAlign === 3 || vAlign === "Bottom" || vAlign === "bottom";
      js += `  ${id}_el.style.alignItems = ${vCenter ? "'center'" : vEnd ? "'flex-end'" : "'flex-start'"};
`;
    } else if (arrangementClass === "arrangement-vertical" || arrangementClass === "arrangement-vertical-scroll") {
      const hCenter2 = hAlign === 2 || hAlign === "Center" || hAlign === "center";
      const hEnd2 = hAlign === 3 || hAlign === "Right" || hAlign === "right";
      js += `  ${id}_el.style.alignItems = ${hCenter2 ? "'center'" : hEnd2 ? "'flex-end'" : "'flex-start'"};
`;
      const vCenter2 = vAlign === 2 || vAlign === "Center" || vAlign === "center";
      const vEnd2 = vAlign === 3 || vAlign === "Bottom" || vAlign === "bottom";
      js += `  ${id}_el.style.justifyContent = ${vCenter2 ? "'center'" : vEnd2 ? "'flex-end'" : "'flex-start'"};
`;
    } else if (arrangementClass === "arrangement-table") {
      const numCols = props.Columns || 2;
      js += `  ${id}_el.style.gridTemplateColumns = 'repeat(${Number(numCols)}, 1fr)';
`;
    }
  }
  js += `  ${parentVar}.appendChild(${id}_el);
`;
  return js;
}
function getArrangementClass(arrangement) {
  if (!arrangement) return "";
  const map = {
    "horizontal": "arrangement-horizontal",
    "vertical": "arrangement-vertical",
    "horizontal-scroll": "arrangement-horizontal-scroll",
    "vertical-scroll": "arrangement-vertical-scroll",
    "table": "arrangement-table",
    "absolute": "arrangement-absolute"
  };
  return map[arrangement.toLowerCase()] || "";
}
function generateComponentProxy(comp) {
  const { id, type, props = {} } = comp;
  if (type === "Clock") {
    return `  var ${id} = new ClockShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "TinyDB") {
    return `  var ${id} = new TinyDBShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "Notifier") {
    return `  var ${id} = new NotifierShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "Sound" || type === "Player") {
    return `  var ${id} = new SoundShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "TextToSpeech") {
    return `  var ${id} = new TextToSpeechShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "LocationSensor") {
    return `  var ${id} = new LocationSensorShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "Web") {
    return `  var ${id} = new WebShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "Sharing") {
    return `  var ${id} = new SharingShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "File") {
    return `  var ${id} = new FileShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "BluetoothClient") {
    return `  var ${id} = new BluetoothClientShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "BluetoothServer") {
    return `  var ${id} = new BluetoothServerShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "Camera") {
    return `  var ${id} = new CameraShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "ImagePicker") {
    return `  var ${id} = new ImagePickerShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "SpeechRecognizer") {
    return `  var ${id} = new SpeechRecognizerShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "VideoPlayer") {
    return `  var ${id} = new VideoPlayerShim('${id}', ${JSON.stringify(props)});
`;
  }
  if (type === "WebViewer") {
    let js2 = `  // Proxy: ${id} (WebViewer)
`;
    js2 += `  var ${id} = {
`;
    js2 += `    get HomeUrl() { return getComponentValue('${id}', 'HomeUrl') || ''; },
`;
    js2 += `    set HomeUrl(v) {
`;
    js2 += `      setComponentProperty('${id}', 'HomeUrl', v);
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      if (el) el.src = v;
`;
    js2 += `    },
`;
    js2 += `    get CurrentUrl() {
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      return el ? el.src : '';
`;
    js2 += `    },
`;
    js2 += `    get RotationAngle() { return this._rotationAngle || 0; },
`;
    js2 += `    set RotationAngle(v) {
`;
    js2 += `      this._rotationAngle = Number(v) || 0;
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      if (el) el.style.transform = 'rotate(' + this._rotationAngle + 'deg)';
`;
    js2 += `    },
`;
    js2 += `    GoToUrl: function(url) {
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      if (el) el.src = url;
`;
    js2 += `    },
`;
    js2 += `    Reload: function() {
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      if (el) {
`;
    js2 += `        var currentSrc = el.src;
`;
    js2 += `        el.src = '';
`;
    js2 += `        el.src = currentSrc;
`;
    js2 += `      }
`;
    js2 += `    },
`;
    js2 += `    GoHome: function() {
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      if (el) el.src = this.HomeUrl || 'about:blank';
`;
    js2 += `    }
`;
    js2 += `  };

`;
    return js2;
  }
  if (type === "Map") {
    let js2 = `  // Proxy: ${id} (Map)
`;
    js2 += `  var ${id} = {
`;
    js2 += `    get Latitude() { return getComponentValue('${id}', 'Latitude') || 0; },
`;
    js2 += `    set Latitude(v) {
`;
    js2 += `      setComponentProperty('${id}', 'Latitude', v);
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      if (el && el._leafletMap) {
`;
    js2 += `        var force = (window._lastButtonClickTime && (Date.now() - window._lastButtonClickTime < 600));
`;
    js2 += `        if (force) { el._userInteracting = false; }
`;
    js2 += `        if (!el._userInteracting) {
`;
    js2 += `          var currentCenter = el._leafletMap.getCenter();
`;
    js2 += `          el._leafletMap.setView([Number(v) || 0, currentCenter.lng], el._leafletMap.getZoom());
`;
    js2 += `        }
`;
    js2 += `        el._leafletMap.invalidateSize();
`;
    js2 += `      }
`;
    js2 += `    },
`;
    js2 += `    get Longitude() { return getComponentValue('${id}', 'Longitude') || 0; },
`;
    js2 += `    set Longitude(v) {
`;
    js2 += `      setComponentProperty('${id}', 'Longitude', v);
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      if (el && el._leafletMap) {
`;
    js2 += `        var force = (window._lastButtonClickTime && (Date.now() - window._lastButtonClickTime < 600));
`;
    js2 += `        if (force) { el._userInteracting = false; }
`;
    js2 += `        if (!el._userInteracting) {
`;
    js2 += `          var currentCenter = el._leafletMap.getCenter();
`;
    js2 += `          el._leafletMap.setView([currentCenter.lat, Number(v) || 0], el._leafletMap.getZoom());
`;
    js2 += `        }
`;
    js2 += `        el._leafletMap.invalidateSize();
`;
    js2 += `      }
`;
    js2 += `    },
`;
    js2 += `    get ZoomLevel() { return getComponentValue('${id}', 'ZoomLevel') || 13; },
`;
    js2 += `    set ZoomLevel(v) {
`;
    js2 += `      setComponentProperty('${id}', 'ZoomLevel', v);
`;
    js2 += `      var el = document.getElementById('comp-${id}');
`;
    js2 += `      if (el && el._leafletMap) {
`;
    js2 += `        el._leafletMap.setZoom(Number(v) || 13);
`;
    js2 += `        el._leafletMap.invalidateSize();
`;
    js2 += `      }
`;
    js2 += `    },
`;
    js2 += `    PanTo: function(latitude, longitude, zoom) {
`;
    js2 += `      this.Latitude = latitude;
`;
    js2 += `      this.Longitude = longitude;
`;
    js2 += `      if (zoom !== undefined) this.ZoomLevel = zoom;
`;
    js2 += `    }
`;
    js2 += `  };

`;
    return js2;
  }
  if (type === "Marker") {
    let js2 = `  // Proxy: ${id} (Marker)
`;
    js2 += `  var ${id} = {
`;
    js2 += `    get Latitude() { return getComponentValue('${id}', 'Latitude') || 0; },
`;
    js2 += `    set Latitude(v) {
`;
    js2 += `      setComponentProperty('${id}', 'Latitude', v);
`;
    js2 += `      var dummy = document.getElementById('comp-${id}');
`;
    js2 += `      if (dummy && dummy._leafletMarker) {
`;
    js2 += `        var latlng = dummy._leafletMarker.getLatLng();
`;
    js2 += `        dummy._leafletMarker.setLatLng([Number(v) || 0, latlng.lng]);
`;
    js2 += `      }
`;
    js2 += `    },
`;
    js2 += `    get Longitude() { return getComponentValue('${id}', 'Longitude') || 0; },
`;
    js2 += `    set Longitude(v) {
`;
    js2 += `      setComponentProperty('${id}', 'Longitude', v);
`;
    js2 += `      var dummy = document.getElementById('comp-${id}');
`;
    js2 += `      if (dummy && dummy._leafletMarker) {
`;
    js2 += `        var latlng = dummy._leafletMarker.getLatLng();
`;
    js2 += `        dummy._leafletMarker.setLatLng([latlng.lat, Number(v) || 0]);
`;
    js2 += `      }
`;
    js2 += `    },
`;
    js2 += `    SetLocation: function(latitude, longitude) {
`;
    js2 += `      this.Latitude = latitude;
`;
    js2 += `      this.Longitude = longitude;
`;
    js2 += `    }
`;
    js2 += `  };

`;
    return js2;
  }
  if (type === "Navigation") {
    let js2 = `  // Proxy: ${id} (Navigation)
`;
    js2 += `  var ${id} = {
`;
    js2 += `    StartLatitude: 0,
`;
    js2 += `    StartLongitude: 0,
`;
    js2 += `    EndLatitude: 0,
`;
    js2 += `    EndLongitude: 0,
`;
    js2 += `    RequestDirections: function() {
`;
    js2 += `      var url = 'https://www.google.com/maps/dir/?api=1&origin=' + this.StartLatitude + ',' + this.StartLongitude + '&destination=' + this.EndLatitude + ',' + this.EndLongitude;
`;
    js2 += `      var a = document.createElement('a');
`;
    js2 += `      a.href = url;
`;
    js2 += `      a.target = '_blank';
`;
    js2 += `      a.click();
`;
    js2 += `    }
`;
    js2 += `  };

`;
    return js2;
  }
  const propNames = Object.keys(props);
  if (propNames.length === 0 && !["Button", "Label", "ListPicker", "DatePicker", "TimePicker", "ImagePicker", "FilePicker", "ContactPicker", "PhoneNumberPicker", "EmailPicker", "Spinner", "CheckBox", "Switch", "Slider", "ListView", "TextBox", "PasswordTextBox", "Image", "Canvas", "WebViewer", "VideoPlayer"].includes(type)) return "";
  const allProps = /* @__PURE__ */ new Set([
    "Text",
    "BackgroundColor",
    "TextColor",
    "Visible",
    "Enabled",
    "Width",
    "Height",
    "FontSize",
    "Hint",
    "Picture",
    "Checked",
    "AlignHorizontal",
    "AlignVertical",
    "FontBold",
    "FontItalic",
    "FontTypeface",
    "PaintColor",
    "Radius",
    "X",
    "Y",
    "Source",
    "Points",
    "Selection",
    "SelectionIndex",
    "Elements",
    "ElementsFromString",
    ...propNames
  ]);
  let js = `  // Proxy: ${id} (${type})
`;
  js += `  var ${id} = {
`;
  const eventNames = ["Click", "GotFocus", "LostFocus", "TouchDown", "TouchUp", "LongClick"];
  for (const prop of allProps) {
    if (eventNames.indexOf(prop) !== -1) continue;
    js += `    get ${prop}() { return getComponentValue('${id}', '${prop}'); },
`;
    js += `    set ${prop}(v) { setComponentProperty('${id}', '${prop}', v); },
`;
  }
  if (["Button", "Label", "Image", "ListView", "CheckBox"].includes(type)) {
    js += `    Click: function() {},
`;
  }
  js += `  };

`;
  return js;
}
function generateAppJs(appState) {
  const { blockLogic } = appState;
  const screens = Array.isArray(appState.screens) && appState.screens.length ? appState.screens : [{ id: "Screen1", title: "Screen1", components: [], nonVisibleComponents: [] }];
  const designViewport = getDesignViewport(appState);
  validateComponentIdentifiers(screens);
  const firstScreenId = screens[0]?.id || "Screen1";
  let blockCode = "";
  if (blockLogic && !blockLogic.trim().startsWith("<")) {
    blockCode = blockLogic;
  }
  let js = `/* Auto-generated by LeapLab AppInverter */
(function() {
  'use strict';

  var state = {};
  var currentScreen = ${JSON.stringify(firstScreenId)};
  var screenHistory = [];
  var components = {};
  var DESIGN_WIDTH = ${designViewport.width};
  var DESIGN_HEIGHT = ${designViewport.height};

  function formatMediaUrl(val) {
    if (!val) return '';
    var str = String(val).trim();
    if (str.indexOf('http://') === 0 || str.indexOf('https://') === 0 || str.indexOf('data:') === 0 || str.indexOf('blob:') === 0) return str;
    if (str.indexOf('file:') === 0) {
      str = str.replace(/^file:\\/\\/\\/?/i, '');
    }
    var parts = str.split(/[\\\\/]/);
    var filename = parts[parts.length - 1];
    try { filename = decodeURIComponent(filename); } catch(e) {}
    if (filename.indexOf('media/') === 0) return filename;
    return 'media/' + encodeURI(filename);
  }

  function showRuntimeError(message) {
    var root = document.getElementById('app-root');
    if (!root) return;
    root.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'startup-error';
    var title = document.createElement('strong');
    title.textContent = 'App failed to render';
    var detail = document.createElement('span');
    detail.textContent = message || 'Unknown runtime error';
    box.appendChild(title);
    box.appendChild(detail);
    root.appendChild(box);
  }

  var NativeBridge = {
    showAlert: function(title, message) { alert(message); },
    showToast: function(message) {
      var toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(function() { toast.remove(); }, 3000);
    },
    showListPickerModal: function(elements, callback) {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;flex-direction:column;';
      var modal = document.createElement('div');
      modal.style.cssText = 'background:#fff;width:80%;max-width:400px;max-height:80%;margin:auto;border-radius:8px;overflow-y:auto;box-shadow:0 4px 6px rgba(0,0,0,0.1);';
      if (!elements || elements.length === 0) {
        var emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'No elements to pick';
        emptyMsg.style.padding = '16px';
        modal.appendChild(emptyMsg);
      } else {
        elements.forEach(function(item, index) {
          var itemDiv = document.createElement('div');
          itemDiv.textContent = item;
          itemDiv.style.cssText = 'padding:16px;border-bottom:1px solid #eee;cursor:pointer;';
          itemDiv.addEventListener('click', function() {
            document.body.removeChild(overlay);
            callback(index, item);
          });
          modal.appendChild(itemDiv);
        });
      }
      var closeBtn = document.createElement('div');
      closeBtn.textContent = 'Cancel';
      closeBtn.style.cssText = 'padding:16px;text-align:center;color:#4285f4;font-weight:bold;cursor:pointer;';
      closeBtn.addEventListener('click', function() { document.body.removeChild(overlay); });
      modal.appendChild(closeBtn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    },
    vibrate: function(ms) { if (navigator.vibrate) navigator.vibrate(ms || 200); },
    openUrl: function(url) { window.open(url, '_blank'); },
    playSound: function(src) { try { new Audio(src).play(); } catch(e) {} },
    getStorageItem: function(key) { try { return localStorage.getItem('leapapp_' + key); } catch(e) { return null; } },
    setStorageItem: function(key, value) { try { localStorage.setItem('leapapp_' + key, value); } catch(e) {} }
  };

  var navigation = {
    navigate: function(screen) { navigateTo(screen); },
    goBack: function() { closeScreen(); }
  };
  var Alert = { alert: function(msg) { NativeBridge.showAlert('Alert', msg); } };
  var Vibration = { vibrate: function(ms) { NativeBridge.vibrate(ms); } };

  function ClockShim(id, props) {
    this.id = id;
    this._timerEnabled = props.TimerEnabled !== undefined ? !!props.TimerEnabled : true;
    this._timerInterval = props.TimerInterval !== undefined ? Number(props.TimerInterval) : 1000;
    this._timerId = null;
    this.updateTimer();
  }
  ClockShim.prototype = {
    get TimerEnabled() { return this._timerEnabled; },
    set TimerEnabled(v) { this._timerEnabled = !!v; this.updateTimer(); },
    get TimerInterval() { return this._timerInterval; },
    set TimerInterval(v) { this._timerInterval = Number(v); this.updateTimer(); },
    updateTimer: function() {
      if (this._timerId) clearInterval(this._timerId);
      if (this._timerEnabled && this._timerInterval > 0) {
        var self = this;
        this._timerId = setInterval(function() {
          if (typeof window[self.id + '_Timer'] === 'function') window[self.id + '_Timer']();
        }, this._timerInterval);
      }
    },
    Now: function() { return new Date(); },
    SystemTime: function() { return Date.now(); },
    MakeInstant: function(text) { return new Date(text); },
    MakeInstantFromMillis: function(m) { return new Date(Number(m)); },
    GetMillis: function(instant) { return (instant instanceof Date ? instant : new Date(instant)).getTime(); },
    AddDays: function(instant, days) { var d = new Date(instant); d.setDate(d.getDate() + Number(days)); return d; },
    AddHours: function(instant, hours) { var d = new Date(instant); d.setHours(d.getHours() + Number(hours)); return d; },
    AddMinutes: function(instant, minutes) { var d = new Date(instant); d.setMinutes(d.getMinutes() + Number(minutes)); return d; },
    AddSeconds: function(instant, seconds) { var d = new Date(instant); d.setSeconds(d.getSeconds() + Number(seconds)); return d; },
    AddWeeks: function(instant, weeks) { var d = new Date(instant); d.setDate(d.getDate() + (Number(weeks) * 7)); return d; },
    AddMonths: function(instant, months) { var d = new Date(instant); d.setMonth(d.getMonth() + Number(months)); return d; },
    AddYears: function(instant, years) { var d = new Date(instant); d.setFullYear(d.getFullYear() + Number(years)); return d; },
    Duration: function(start, end) { return Math.abs(new Date(end).getTime() - new Date(start).getTime()); },
    DurationToDays: function(dur) { return dur / (24 * 3600 * 1000); },
    DurationToHours: function(dur) { return dur / (3600 * 1000); },
    DurationToMinutes: function(dur) { return dur / (60 * 1000); },
    DurationToSeconds: function(dur) { return dur / 1000; },
    DurationToWeeks: function(dur) { return dur / (7 * 24 * 3600 * 1000); },
    FormatDate: function(inst, pattern) { return (inst instanceof Date ? inst : new Date(inst)).toLocaleDateString(); },
    FormatDateTime: function(inst, pattern) { return (inst instanceof Date ? inst : new Date(inst)).toLocaleString(); },
    FormatTime: function(inst) { return (inst instanceof Date ? inst : new Date(inst)).toLocaleTimeString(); }
  };

  function TinyDBShim(id, props) {
    this.id = id;
    this._namespace = props.Namespace || id;
  }
  TinyDBShim.prototype = {
    get Namespace() { return this._namespace; }, set Namespace(v) { this._namespace = v; },
    _getKey: function(tag) { return 'tinydb_' + this._namespace + '_' + tag; },
    StoreValue: function(tag, val) { try { localStorage.setItem(this._getKey(tag), JSON.stringify(val)); } catch(e) {} },
    GetValue: function(tag, fallback) { try { var v = localStorage.getItem(this._getKey(tag)); return v === null ? fallback : JSON.parse(v); } catch(e) { return fallback; } },
    ClearTag: function(tag) { try { localStorage.removeItem(this._getKey(tag)); } catch(e) {} },
    ClearAll: function() { try { var prefix = 'tinydb_' + this._namespace + '_'; var keys = []; for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key.indexOf(prefix) === 0) keys.push(key); } keys.forEach(function(k) { localStorage.removeItem(k); }); } catch(e) {} },
    GetTags: function() { var tags = []; try { var prefix = 'tinydb_' + this._namespace + '_'; for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key.indexOf(prefix) === 0) tags.push(key.substring(prefix.length)); } } catch(e) {} return tags; }
  };

  function NotifierShim(id) { this.id = id; }
  NotifierShim.prototype = {
    ShowAlert: function(notice) { NativeBridge.showToast(notice); },
    ShowMessageDialog: function(message, title, buttonText) { var sep = String.fromCharCode(10, 10); alert((title ? title + sep : '') + message); },
    ShowChooseDialog: function(message, title, button1, button2, cancelable) {
      var sep = String.fromCharCode(10, 10);
      var res = confirm((title ? title + sep : '') + message);
      var choice = res ? button1 : button2;
      var self = this;
      setTimeout(function() { if (typeof window[self.id + '_AfterChoosing'] === 'function') window[self.id + '_AfterChoosing'](choice); }, 50);
    },
    ShowTextDialog: function(message, title, cancelable) {
      var sep = String.fromCharCode(10, 10);
      var res = prompt((title ? title + sep : '') + message);
      var self = this;
      if (res !== null) { setTimeout(function() { if (typeof window[self.id + '_AfterTextInput'] === 'function') window[self.id + '_AfterTextInput'](res); }, 50); }
    }
  };

  function SoundShim(id, props) {
    this.id = id;
    var src = props.Source || props.source || '';
    this._source = formatMediaUrl(src);
    this._volume = props.Volume !== undefined ? Number(props.Volume) : 1.0;
    this._isLooping = !!props.IsLooping;
    this._audio = null;
  }
  SoundShim.prototype = {
    get Source() { return this._source; }, set Source(v) { this._source = formatMediaUrl(v); if (this._audio) this._audio.src = this._source; },
    get Volume() { return this._volume; }, set Volume(v) { this._volume = Number(v); if (this._audio) this._audio.volume = this._volume; },
    get IsLooping() { return this._isLooping; }, set IsLooping(v) { this._isLooping = !!v; if (this._audio) this._audio.loop = this._isLooping; },
    _initAudio: function() { if (!this._audio && this._source) { this._audio = new Audio(this._source); this._audio.volume = this._volume; this._audio.loop = this._isLooping; var self = this; this._audio.addEventListener('ended', function() { if (typeof window[self.id + '_Completed'] === 'function') window[self.id + '_Completed'](); }); } },
    Play: function() { this._initAudio(); if (this._audio) this._audio.play().catch(function(e){}); },
    Start: function() { this.Play(); },
    Pause: function() { if (this._audio) this._audio.pause(); },
    Stop: function() { if (this._audio) { this._audio.pause(); this._audio.currentTime = 0; } },
    Resume: function() { this.Play(); },
    Vibrate: function(ms) { NativeBridge.vibrate(ms); }
  };

  function TextToSpeechShim(id) {
    this.id = id;
    this._pitch = 1.0; this._speechRate = 1.0;
  }
  TextToSpeechShim.prototype = {
    get Pitch() { return this._pitch; }, set Pitch(v) { this._pitch = Number(v); },
    get SpeechRate() { return this._speechRate; }, set SpeechRate(v) { this._speechRate = Number(v); },
    Speak: function(message) {
      console.log('[LeapApp] TTS.Speak called \u2014 message:', JSON.stringify(message), 'type:', typeof message);
      if (message === undefined || message === null) { console.log('[LeapApp] TTS.Speak \u2014 message is', message); message = ''; }
      if (window.AndroidSpeech && typeof window.AndroidSpeech.speak === 'function') { window.AndroidSpeech.speak(message); return; }
      if (!window.speechSynthesis) { console.log('[LeapApp] TTS.Speak \u2014 speechSynthesis not available'); return; }
      var self = this;
      if (typeof window[self.id + '_BeforeSpeaking'] === 'function') window[self.id + '_BeforeSpeaking']();
      var utterance = new SpeechSynthesisUtterance(message);
      utterance.pitch = this._pitch; utterance.rate = this._speechRate;
      utterance.onend = function() { if (typeof window[self.id + '_AfterSpeaking'] === 'function') window[self.id + '_AfterSpeaking'](true); };
      utterance.onerror = function() { if (typeof window[self.id + '_AfterSpeaking'] === 'function') window[self.id + '_AfterSpeaking'](false); };
      window.speechSynthesis.speak(utterance);
    }
  };

  function CameraShim(id, props) { this.id = id; this._useFront = !!props.UseFront; }
  CameraShim.prototype = {
    get UseFront() { return this._useFront; }, set UseFront(v) { this._useFront = !!v; },
    TakePicture: function() {
      var self = this;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        var constraints = { video: { facingMode: self._useFront ? 'user' : 'environment' } };
        navigator.mediaDevices.getUserMedia(constraints)
          .then(function(stream) {
            var video = document.createElement('video');
            video.setAttribute('autoplay', ''); video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
            video.muted = true; video.srcObject = stream;
            video.play().catch(function(e) {});
            video.addEventListener('loadedmetadata', function() { video.play().catch(function(e) {}); });
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
            video.style.cssText = 'max-width:100%;max-height:80%;object-fit:contain;';
            overlay.appendChild(video);
            var btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex;gap:16px;margin-top:12px;';
            var captureBtn = document.createElement('button');
            captureBtn.textContent = 'Capture';
            captureBtn.style.cssText = 'padding:12px 32px;font-size:16px;border:none;border-radius:24px;background:#4CAF50;color:#fff;cursor:pointer;';
            var cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.cssText = 'padding:12px 32px;font-size:16px;border:none;border-radius:24px;background:#EF4444;color:#fff;cursor:pointer;';
            btnRow.appendChild(captureBtn); btnRow.appendChild(cancelBtn);
            overlay.appendChild(btnRow);
            document.body.appendChild(overlay);
            function cleanup() { stream.getTracks().forEach(function(t) { t.stop(); }); if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
            captureBtn.addEventListener('click', function() {
              var canvas = document.createElement('canvas');
              canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
              var ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              cleanup();
              if (typeof window[self.id + '_AfterPicture'] === 'function') window[self.id + '_AfterPicture'](dataUrl);
            });
            cancelBtn.addEventListener('click', cleanup);
          })
          .catch(function() { self._takePictureViaFileInput(); });
      } else { self._takePictureViaFileInput(); }
    },
    _takePictureViaFileInput: function() {
      var self = this;
      var input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.setAttribute('capture', self._useFront ? 'user' : 'environment');
      input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { if (typeof window[self.id + '_AfterPicture'] === 'function') window[self.id + '_AfterPicture'](ev.target.result); };
        reader.readAsDataURL(file);
      });
      input.click();
    }
  };

  function ImagePickerShim(id, props) { this.id = id; this._selection = ''; }
  ImagePickerShim.prototype = {
    get Selection() { return this._selection; }, set Selection(v) { this._selection = v; },
    Open: function() {
      var self = this;
      if (typeof window[self.id + '_BeforePicking'] === 'function') window[self.id + '_BeforePicking']();
      var input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { self._selection = ev.target.result; if (typeof window[self.id + '_AfterPicking'] === 'function') window[self.id + '_AfterPicking'](); };
        reader.readAsDataURL(file);
      });
      input.click();
    }
  };

  function SpeechRecognizerShim(id, props) {
    this.id = id; this._language = props.Language || ''; this._result = ''; this._recognition = null;
  }
  SpeechRecognizerShim.prototype = {
    get Language() { return this._language; }, set Language(v) { this._language = String(v || ''); },
    get Result() { return this._result; }, set Result(v) { this._result = v; },
    GetText: function() {
      var self = this;
      if (window.AndroidSpeech && typeof window.AndroidSpeech.startSpeechRecognition === 'function') { window.AndroidSpeech.startSpeechRecognition(self.id); return; }
      var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) { var text = prompt('Speech recognition is not available in this browser. Enter text:'); if (text !== null && text !== '') { self._result = text; if (typeof window[self.id + '_AfterGettingText'] === 'function') window[self.id + '_AfterGettingText'](text, false); } return; }
      if (typeof window[self.id + '_BeforeGettingText'] === 'function') window[self.id + '_BeforeGettingText']();
      var recognition = new SpeechRecognitionAPI();
      recognition.continuous = false; recognition.interimResults = true;
      if (self._language) recognition.lang = self._language;
      self._recognition = recognition;
      recognition.onresult = function(event) {
        var transcript = ''; var isFinal = false;
        for (var i = event.resultIndex; i < event.results.length; i++) { transcript += event.results[i][0].transcript; if (event.results[i].isFinal) isFinal = true; }
        if (isFinal) { self._result = transcript; if (typeof window[self.id + '_AfterGettingText'] === 'function') window[self.id + '_AfterGettingText'](transcript, false); }
        else { if (typeof window[self.id + '_AfterGettingText'] === 'function') window[self.id + '_AfterGettingText'](transcript, true); }
      };
      recognition.onerror = function(event) {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') { var text = prompt('Microphone access denied. Enter text:'); if (text !== null && text !== '') { self._result = text; if (typeof window[self.id + '_AfterGettingText'] === 'function') window[self.id + '_AfterGettingText'](text, false); } }
      };
      recognition.start();
    },
    Stop: function() { if (this._recognition) { try { this._recognition.stop(); } catch(e) {} this._recognition = null; } }
  };

  function VideoPlayerShim(id, props) {
    this.id = id;
    var src = props.Source || props.source || '';
    this._source = formatMediaUrl(src);
    this._volume = props.Volume !== undefined ? Number(props.Volume) : 50;
    this._fullScreen = !!props.FullScreen;
    var el = this._getEl();
    if (el && this._source && !el.src) { el.src = this._source; }
  }
  VideoPlayerShim.prototype = {
    _getEl: function() { return document.getElementById('comp-' + this.id); },
    get Source() { return this._source; }, set Source(v) { this._source = formatMediaUrl(v); var el = this._getEl(); if (el) el.src = this._source; },
    get Volume() { return this._volume; }, set Volume(v) { this._volume = Number(v); var el = this._getEl(); if (el) el.volume = Math.max(0, Math.min(1, this._volume / 100)); },
    get FullScreen() { return this._fullScreen; }, set FullScreen(v) { this._fullScreen = !!v; var el = this._getEl(); if (el && v && el.requestFullscreen) el.requestFullscreen(); },
    Start: function() { var el = this._getEl(); if (el) { if (!el.src && this._source) el.src = this._source; el.volume = Math.max(0, Math.min(1, this._volume / 100)); el.play().catch(function(e){}); } },
    Pause: function() { var el = this._getEl(); if (el) el.pause(); },
    Stop: function() { var el = this._getEl(); if (el) { el.pause(); el.currentTime = 0; } },
    SeekTo: function(ms) { var el = this._getEl(); if (el) el.currentTime = Number(ms) / 1000; },
    GetDuration: function() { var el = this._getEl(); return el ? Math.round((el.duration || 0) * 1000) : 0; }
  };

  function LocationSensorShim(id, props) {
    this.id = id;
    this._enabled = props.Enabled !== undefined ? !!props.Enabled : true;
    this._latitude = 0; this._longitude = 0; this._altitude = 0; this._accuracy = 0;
    this._watchId = null;
    this.updateWatcher();
  }
  LocationSensorShim.prototype = {
    get Enabled() { return this._enabled; }, set Enabled(v) { this._enabled = !!v; this.updateWatcher(); },
    get Latitude() { return this._latitude; }, get Longitude() { return this._longitude; },
    get Altitude() { return this._altitude; }, get Accuracy() { return this._accuracy; },
    updateWatcher: function() {
      if (this._watchId) { navigator.geolocation.clearWatch(this._watchId); this._watchId = null; }
      if (this._enabled && navigator.geolocation) {
        var self = this;
        this._watchId = navigator.geolocation.watchPosition(function(pos) {
          self._latitude = pos.coords.latitude; self._longitude = pos.coords.longitude;
          self._altitude = pos.coords.altitude || 0; self._accuracy = pos.coords.accuracy || 0;
          if (typeof window[self.id + '_LocationChanged'] === 'function') window[self.id + '_LocationChanged'](self._latitude, self._longitude, self._altitude, pos.coords.speed || 0);
        }, function(err) {}, { enableHighAccuracy: true });
      }
    }
  };

  function WebShim(id, props) {
    this.id = id;
    var rawUrl = props.Url || props.url || '';
    this._url = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl;
    this._timeout = props.Timeout !== undefined ? Number(props.Timeout) : 0;
    this._saveResponse = !!props.SaveResponse;
    this._responseFileName = props.ResponseFileName || '';
    this._allowCookies = props.AllowCookies !== undefined ? !!props.AllowCookies : true;
    this._headers = {};
  }
  WebShim.prototype = {
    get Url() { return this._url; }, set Url(v) { this._url = typeof v === 'string' ? v.trim() : v; },
    get Timeout() { return this._timeout; }, set Timeout(v) { this._timeout = Number(v) || 0; },
    get SaveResponse() { return this._saveResponse; }, set SaveResponse(v) { this._saveResponse = !!v; },
    get ResponseFileName() { return this._responseFileName; }, set ResponseFileName(v) { this._responseFileName = String(v || ''); },
    get AllowCookies() { return this._allowCookies; }, set AllowCookies(v) { this._allowCookies = !!v; },
    get RequestHeaders() { var list = []; for (var k in this._headers) { if (this._headers.hasOwnProperty(k)) list.push([k, this._headers[k]]); } return list; },
    set RequestHeaders(list) {
      this._headers = {};
      if (Array.isArray(list)) { for (var i = 0; i < list.length; i++) { var pair = list[i]; if (Array.isArray(pair) && pair.length >= 2) { this._headers[String(pair[0])] = String(pair[1]); } } }
      else if (list && typeof list === 'object') { for (var k in list) { if (list.hasOwnProperty(k)) this._headers[k] = String(list[k]); } }
    },
    _emitGotText: function(url, status, responseType, content) { if (typeof window[this.id + '_GotText'] === 'function') window[this.id + '_GotText'](url, status, responseType || '', content || ''); },
    _emitTimedOut: function(url) { if (typeof window[this.id + '_TimedOut'] === 'function') window[this.id + '_TimedOut'](url || this._url); },
    _emitGotFile: function(url, status, responseType, fileName) { if (typeof window[this.id + '_GotFile'] === 'function') window[this.id + '_GotFile'](url, status, responseType || '', fileName || ''); },
    _request: function(method, body, contentType) {
      var self = this;
      var rawUrl = self._url;
      var requestUrl = typeof rawUrl === 'string' ? rawUrl.trim() : String(rawUrl || '');
      if (window.Android && typeof window.Android.performWebRequest === 'function') {
        setTimeout(function() {
          try {
            var headersCopy = {}; for (var k in self._headers) { if (self._headers.hasOwnProperty(k)) headersCopy[k] = self._headers[k]; }
            if (contentType) headersCopy['Content-Type'] = contentType;
            var headersJson = JSON.stringify(headersCopy);
            var result = window.Android.performWebRequest(requestUrl, method || 'GET', headersJson, body || '');
            var idx1 = result.indexOf('|'); var idx2 = result.indexOf('|', idx1 + 1);
            var status = Number(result.substring(0, idx1));
            var responseType = result.substring(idx1 + 1, idx2);
            var content = result.substring(idx2 + 1);
            if (self._saveResponse) { var fileName = self._responseFileName || ('response_' + Date.now()); self._emitGotFile(requestUrl, status, responseType, fileName); }
            else { self._emitGotText(requestUrl, status, responseType, content); }
          } catch(err) { self._emitGotText(requestUrl, 0, '', err && err.message ? err.message : String(err)); }
        }, 0);
        return;
      }
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timeoutId = null;
      if (controller && self._timeout > 0) { timeoutId = setTimeout(function() { controller.abort(); }, self._timeout); }
      var isLocal = false;
      var hostMatch = requestUrl.match(/^(?:https?:\\/\\/)?([^:\\/\\s]+)/);
      if (hostMatch) { var host = hostMatch[1]; if (host === 'localhost' || host === '127.0.0.1' || /^192\\.168\\./.test(host) || /^10\\./.test(host) || /^172\\.(1[6-9]|2[0-9]|3[0-1])\\./.test(host)) isLocal = true; }
      if (isLocal) {
        var relayUrl = 'http://localhost:3001/relay';
        var relayHeaders = {};
        for (var k in self._headers) { if (self._headers.hasOwnProperty(k)) relayHeaders[k] = self._headers[k]; }
        if (contentType) relayHeaders['Content-Type'] = contentType;
        fetch(relayUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: requestUrl, method: method || 'GET', headers: relayHeaders, body: body || undefined }), signal: controller ? controller.signal : undefined })
          .then(function(res) { if (timeoutId) clearTimeout(timeoutId); return res.json(); })
          .then(function(data) { if (data.success) { var responseType = (data.headers && data.headers['content-type']) || 'text/plain'; self._emitGotText(requestUrl, data.status || 200, responseType, data.body || ''); } else { self._emitGotText(requestUrl, 0, '', data.error || 'Relay request failed'); } })
          .catch(function(err) { if (timeoutId) clearTimeout(timeoutId); if (err && err.name === 'AbortError') self._emitTimedOut(requestUrl); else self._emitGotText(requestUrl, 0, '', err && err.message ? err.message : String(err)); });
      } else {
        var options = { method: method || 'GET', body: body, headers: {} };
        if (contentType) options.headers['Content-Type'] = contentType;
        if (controller) options.signal = controller.signal;
        var finalUrl = requestUrl;
        if (requestUrl.indexOf('http://') === 0 || requestUrl.indexOf('https://') === 0) finalUrl = 'https://corsproxy.io/?' + encodeURIComponent(requestUrl);
        fetch(finalUrl, options)
          .then(function(res) {
            if (timeoutId) clearTimeout(timeoutId);
            var responseType = res.headers.get('content-type') || '';
            if (self._saveResponse) { return res.blob().then(function(blob) { var fileName = self._responseFileName || ('response_' + Date.now()); self._emitGotFile(requestUrl, res.status, responseType, fileName); }); }
            return res.text().then(function(text) { self._emitGotText(requestUrl, res.status, responseType, text); });
          })
          .catch(function(err) { if (timeoutId) clearTimeout(timeoutId); if (err && err.name === 'AbortError') self._emitTimedOut(requestUrl); else self._emitGotText(requestUrl, 0, '', err && err.message ? err.message : String(err)); });
      }
    },
    Get: function() { this._request('GET'); },
    PostText: function(text) { this._request('POST', text, 'text/plain'); },
    PostTextWithEncoding: function(text, encoding) { this._request('POST', text, 'text/plain; charset=' + (encoding || 'utf-8')); },
    PostFile: function(path) { this._emitGotText(this._url, 0, '', 'PostFile is not available in this runtime.'); },
    PutText: function(text) { this._request('PUT', text, 'text/plain'); },
    PutTextWithEncoding: function(text, encoding) { this._request('PUT', text, 'text/plain; charset=' + (encoding || 'utf-8')); },
    PutFile: function(path) { this._emitGotText(this._url, 0, '', 'PutFile is not available in this runtime.'); },
    PatchText: function(text) { this._request('PATCH', text, 'text/plain'); },
    PatchTextWithEncoding: function(text, encoding) { this._request('PATCH', text, 'text/plain; charset=' + (encoding || 'utf-8')); },
    PatchFile: function(path) { this._emitGotText(this._url, 0, '', 'PatchFile is not available in this runtime.'); },
    Delete: function() { this._request('DELETE'); },
    ClearCookies: function() {},
    BuildRequestData: function(list) { if (!Array.isArray(list)) return ''; return list.map(function(pair) { var k = encodeURIComponent(String(pair[0] || '')); var v = encodeURIComponent(String(pair[1] || '')); return k + '=' + v; }).join('&'); },
    JsonTextDecode: function(jsonText) { return JSON.parse(jsonText); },
    JsonTextDecodeWithDictionaries: function(jsonText) { return JSON.parse(jsonText); },
    JsonObjectEncode: function(obj) { return JSON.stringify(obj); },
    HtmlTextDecode: function(htmlText) { var textarea = document.createElement('textarea'); textarea.innerHTML = String(htmlText || ''); return textarea.value; },
    UriEncode: function(text) { return encodeURIComponent(String(text || '')); },
    UriDecode: function(text) { try { return decodeURIComponent(String(text || '')); } catch (e) { return String(text || ''); } }
  };

  function SharingShim(id, props) { this.id = id; }
  SharingShim.prototype = {
    ShareMessage: function(message) { if (navigator.share) navigator.share({ text: message }).catch(function(e) {}); else alert('Sharing message: ' + message); },
    ShareFile: function(file) { alert('Sharing file: ' + file); },
    ShareFileWithMessage: function(file, message) { alert('Sharing file: ' + file + ' with message: ' + message); }
  };

  function FileShim(id, props) { this.id = id; }
  FileShim.prototype = {
    SaveFile: function(text, fileName) { localStorage.setItem(fileName, text); var self = this; setTimeout(function() { if (typeof window[self.id + '_AfterFileSaved'] === 'function') window[self.id + '_AfterFileSaved'](fileName); }, 0); },
    ReadFrom: function(fileName) { var text = localStorage.getItem(fileName) || ''; var self = this; setTimeout(function() { if (typeof window[self.id + '_GotText'] === 'function') window[self.id + '_GotText'](text); }, 0); },
    AppendToFile: function(text, fileName) { var existing = localStorage.getItem(fileName) || ''; localStorage.setItem(fileName, existing + text); },
    Delete: function(fileName) { localStorage.removeItem(fileName); }
  };

  function extractMacAddress(address) {
    if (!address) return '';
    address = String(address).trim();
    if (address.includes('\\\\n')) { var parts = address.split('\\\\n'); return parts[parts.length - 1].trim(); }
    if (address.includes(' ')) { var parts = address.split(' '); for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i].trim(); if (p.includes(':') && p.length >= 12) return p; } }
    return address;
  }

  function BluetoothConnectionBaseShim(id, props) {
    this.id = id;
    this._enabled = props.Enabled !== undefined ? !!props.Enabled : true;
    this._isConnected = false;
    this._secure = props.Secure !== undefined ? !!props.Secure : false;
    this._delimiterByte = props.DelimiterByte !== undefined ? Number(props.DelimiterByte) : 10;
    this._characterEncoding = props.CharacterEncoding || 'utf-8';
    this._highByteFirst = props.HighByteFirst !== undefined ? !!props.HighByteFirst : false;
    this._buffer = [];
  }
  BluetoothConnectionBaseShim.prototype = {
    _emitError: function(functionName, message) { if (typeof window[this.id + '_BluetoothError'] === 'function') window[this.id + '_BluetoothError'](functionName, message); else alert('Bluetooth Error in ' + functionName + ': ' + message); },
    _syncBuffer: function() { if (window.Android && typeof window.Android.receiveText === 'function') { try { var nativeText = window.Android.receiveText(); if (nativeText) { for (var i = 0; i < nativeText.length; i++) this._buffer.push(nativeText.charAt(i)); } } catch(e) {} } },
    get Enabled() { return this._enabled; }, set Enabled(v) { this._enabled = !!v; },
    get IsConnected() { if (window.Android && typeof window.Android.isConnected === 'function') { try { return window.Android.isConnected(); } catch(e) {} } return this._isConnected; },
    set IsConnected(v) { this._isConnected = !!v; },
    get Available() { return (typeof navigator !== 'undefined' && !!navigator.bluetooth) || !!window.Android; },
    get Secure() { return this._secure; }, set Secure(v) { this._secure = !!v; },
    get DelimiterByte() { return this._delimiterByte; }, set DelimiterByte(v) { this._delimiterByte = Number(v) || 0; },
    get CharacterEncoding() { return this._characterEncoding; }, set CharacterEncoding(v) { this._characterEncoding = String(v || 'utf-8'); },
    get HighByteFirst() { return this._highByteFirst; }, set HighByteFirst(v) { this._highByteFirst = !!v; },
    Disconnect: function() { if (window.Android && typeof window.Android.disconnect === 'function') { try { window.Android.disconnect(); } catch(e) {} } this._isConnected = false; this._buffer = []; },
    BytesAvailableToReceive: function() { this._syncBuffer(); return this._buffer.length; },
    ReceiveText: function(numberOfBytes) {
      this._syncBuffer();
      var count = Number(numberOfBytes);
      if (count < 0) { var delimChar = String.fromCharCode(this._delimiterByte); var idx = this._buffer.indexOf(delimChar); if (idx !== -1) { var chunk = this._buffer.splice(0, idx + 1); return chunk.join(''); } return ''; }
      if (count === 0) { var result = this._buffer.join(''); this._buffer = []; return result; }
      var chunk = this._buffer.splice(0, count); return chunk.join('');
    },
    SendText: function(text) {
      if (window.Android && typeof window.Android.sendText === 'function') { try { return window.Android.sendText(String(text || '')); } catch(e) { return false; } }
      else if (navigator.bluetooth && this._isConnected) { } return false;
    },
    SendByte: function(number) { return this.SendBytes(String.fromCharCode(number)); },
    SendBytes: function(list) { if (window.Android && typeof window.Android.sendBytes === 'function') { try { var listStr = (Array.isArray(list) ? list.join(',') : String(list)); return window.Android.sendBytes(listStr); } catch(e) { return ''; } } return ''; },
    ReceiveSignedBytes: function(numberOfBytes) { return this.ReceiveText(numberOfBytes); },
    ReceiveUnsignedBytes: function(numberOfBytes) { return this.ReceiveText(numberOfBytes); },
    SendByteSigned: function(number) { return this.SendByte(number); },
    SendByteUnsigned: function(number) { return this.SendByte(number); }
  };

  function BluetoothClientShim(id, props) { BluetoothConnectionBaseShim.call(this, id, props); }
  BluetoothClientShim.prototype = Object.create(BluetoothConnectionBaseShim.prototype);
  BluetoothClientShim.prototype.constructor = BluetoothClientShim;
  BluetoothClientShim.prototype.Connect = function(address) {
    var mac = extractMacAddress(address);
    if (window.Android && typeof window.Android.connect === 'function') {
      var self = this;
      setTimeout(function() {
        try { var nativeResult = window.Android.connect(mac); self._isConnected = (nativeResult === 'SUCCESS'); if (self._isConnected && typeof window[self.id + '_Connected'] === 'function') window[self.id + '_Connected'](); else self._emitError('Connect', nativeResult); } catch(e) { self._emitError('Connect', e && e.message || String(e)); }
      }, 0);
    } else { this._isConnected = true; if (typeof window[this.id + '_Connected'] === 'function') window[this.id + '_Connected'](); }
  };
  BluetoothClientShim.prototype.IsDevicePaired = function(address) { var mac = extractMacAddress(address); if (window.Android && typeof window.Android.isDevicePaired === 'function') { try { return window.Android.isDevicePaired(mac); } catch(e) { return false; } } return false; };

  function BluetoothServerShim(id, props) { BluetoothConnectionBaseShim.call(this, id, props); }
  BluetoothServerShim.prototype = Object.create(BluetoothConnectionBaseShim.prototype);
  BluetoothServerShim.prototype.constructor = BluetoothServerShim;
  BluetoothServerShim.prototype.StartAccept = function() { if (typeof window[this.id + '_ConnectionAccepted'] === 'function') window[this.id + '_ConnectionAccepted'](); };
  BluetoothServerShim.prototype.StopAccepting = function() {};
  BluetoothServerShim.prototype.AcceptConnection = function() {};
  BluetoothServerShim.prototype.IsAccepting = function() { return false; };

  var ScreenClasses = {};

  function getComponentValue(id, prop) { try { var v = (state[id] || {})[prop]; if (v === undefined) { console.log('[LeapApp] getComponentValue("' + id + '", "' + prop + '") \u2014 state missing, state keys:', Object.keys(state)); } return v; } catch(e) { console.log('[LeapApp] getComponentValue error:', e); return undefined; } }
  function setComponentProperty(id, prop, value) { try { if (!state[id]) state[id] = {}; state[id][prop] = value; applyComponentProperty(id, prop, value); } catch(e) {} }
  function applyComponentProperty(id, prop, value) {
    var el = document.getElementById('comp-' + id);
    if (!el) return;
    if (prop === 'Text') { if (el.tagName === 'INPUT' || el.tagName === 'SELECT') { el.value = String(value || ''); } else { el.textContent = String(value || ''); } }
    else if (prop === 'BackgroundColor') el.style.backgroundColor = value || '';
    else if (prop === 'TextColor') el.style.color = value || '';
    else if (prop === 'Visible') el.style.display = value ? '' : 'none';
    else if (prop === 'Enabled') { if (el.tagName === 'BUTTON') el.disabled = !value; }
    else if (prop === 'Width') el.style.width = typeof value === 'number' ? value + 'px' : value;
    else if (prop === 'Height') el.style.height = typeof value === 'number' ? value + 'px' : value;
    else if (prop === 'FontSize') el.style.fontSize = typeof value === 'number' ? value + 'px' : value;
    else if (prop === 'FontBold') el.style.fontWeight = value ? 'bold' : '';
    else if (prop === 'FontItalic') el.style.fontStyle = value ? 'italic' : '';
    else if (prop === 'Picture' || prop === 'Image' || prop === 'Source') {
      var picValue = formatMediaUrl(value);
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'AUDIO') { el.src = picValue; }
      else { el.style.backgroundImage = picValue ? 'url("' + encodeURI(picValue) + '")' : ''; el.style.backgroundSize = '100% 100%'; }
    }
    else if (prop === 'Hint') { if (el.placeholder !== undefined) el.placeholder = String(value || ''); }
    else if (prop === 'Checked') { var cb = document.getElementById('comp-' + id + '-input'); if (cb) cb.checked = !!value; }
    else if (prop === 'Radius') el.style.borderRadius = value + 'px';
  }

  function resizeScreens() {
    var root = document.getElementById('app-root');
    if (!root) return;
    var availableW = root.clientWidth;
    var availableH = root.clientHeight;
    if (!availableW || !availableH) return;
    var scaleX = availableW / DESIGN_WIDTH;
    var scaleY = availableH / DESIGN_HEIGHT;
    var scale = Math.min(scaleX, scaleY);
    var screens = document.querySelectorAll('.screen-viewport');
    for (var i = 0; i < screens.length; i++) {
      screens[i].style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
      screens[i].style.left = '50%';
      screens[i].style.top = '50%';
      screens[i].style.position = 'absolute';
    }
  }

  function navigateTo(screenId) {
    var allScreens = document.querySelectorAll('.screen');
    for (var i = 0; i < allScreens.length; i++) allScreens[i].classList.remove('active');
    var target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
    if (currentScreen && currentScreen !== screenId) {
      screenHistory.push(currentScreen);
    }
    currentScreen = screenId;
    if (typeof window['__ScreenChanged'] === 'function') window['__ScreenChanged'](screenId);
  }

  function closeScreen() {
    if (screenHistory.length > 0) {
      var prevScreen = screenHistory.pop();
      var allScreens = document.querySelectorAll('.screen');
      for (var i = 0; i < allScreens.length; i++) allScreens[i].classList.remove('active');
      var target = document.getElementById('screen-' + prevScreen);
      if (target) target.classList.add('active');
      currentScreen = prevScreen;
      if (typeof window['__ScreenChanged'] === 'function') window['__ScreenChanged'](prevScreen);
    }
  }

  window.addEventListener('resize', resizeScreens);
  window.addEventListener('orientationchange', function() { setTimeout(resizeScreens, 300); });

  // \u2500\u2500 Screen generation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
`;
  for (const screen of screens) {
    const screenId = screen.id || "Screen1";
    const title = screen.title || screenId;
    js += `
  (function() {
    var screenEl = document.createElement('div');
    screenEl.id = 'screen-${screenId}';
    screenEl.className = 'screen';
    var viewport = document.createElement('div');
    viewport.className = 'screen-viewport';
    var inner = document.createElement('div');
    inner.className = 'screen-inner';
    inner.style.display = 'flex';
    inner.style.flexDirection = 'column';
`;
    const screenAlignH = screen.alignHorizontal;
    const screenAlignV = screen.alignVertical;
    if (screenAlignH !== void 0) {
      const hCenter = screenAlignH === "Center" || screenAlignH === "2" || screenAlignH === 2;
      const hEnd = screenAlignH === "Right" || screenAlignH === "3" || screenAlignH === 3;
      js += `    inner.style.alignItems = ${hCenter ? "'center'" : hEnd ? "'flex-end'" : "'flex-start'"};
`;
    }
    if (screenAlignV !== void 0) {
      const vCenter = screenAlignV === "Center" || screenAlignV === "2" || screenAlignV === 2;
      const vEnd = screenAlignV === "Bottom" || screenAlignV === "3" || screenAlignV === 3;
      js += `    inner.style.justifyContent = ${vCenter ? "'center'" : vEnd ? "'flex-end'" : "'flex-start'"};
`;
    }
    if (screen.backgroundColor && screen.backgroundColor !== "#ffffff") {
      js += `    viewport.style.backgroundColor = '${screen.backgroundColor}';
`;
    }
    for (const comp of screen.components || []) {
      js += generateComponentCreation(comp, "inner");
    }
    js += `    viewport.appendChild(inner);
`;
    js += `    screenEl.appendChild(viewport);
`;
    js += `    document.getElementById('app-root').appendChild(screenEl);
`;
    js += `  })();

`;
  }
  js += "\n  // \u2500\u2500 Component Proxies \u2500\u2500\n";
  for (const screen of screens) {
    const allComponents = [...screen.components || [], ...screen.nonVisibleComponents || []];
    walkComponentTree(allComponents, (comp) => {
      js += generateComponentProxy(comp);
    });
  }
  js += "\n  // \u2500\u2500 Screen Classes \u2500\u2500\n";
  for (const screen of screens) {
    const screenName = screen.id || "Screen1";
    js += `  ScreenClasses['${screenName}'] = function() {};
`;
  }
  if (blockCode) {
    js += `
  // \u2500\u2500 User Block Logic \u2500\u2500
  ${blockCode}
`;
  }
  js += `
  // \u2500\u2500 Init \u2500\u2500
  function init() {
    try {
      resizeScreens();
      navigateTo('${firstScreenId}');
      setTimeout(function() {
        if (typeof window['${firstScreenId}_Initialize'] === 'function') window['${firstScreenId}_Initialize']();
      }, 100);
    } catch (error) {
      showRuntimeError(error && error.message ? error.message : String(error));
    }
  }

  window.LeapApp = { init: init };
  setTimeout(resizeScreens, 50);
  setTimeout(resizeScreens, 300);
  })();
`;
  return js;
}
function generateWebApp(appState) {
  return {
    "index.html": generateIndexHtml(appState),
    "styles.css": generateStylesCss(appState),
    "app.js": generateAppJs(appState)
  };
}

// src/creova/apk/buildAPK.ts
var import_path = __toESM(require("path"));
var import_fs_extra = __toESM(require_lib());
var import_os = __toESM(require("os"));
var ApkInjector = require_apkInjector();
var COMPONENT_PERMISSIONS = {
  BluetoothClient: ["android.permission.BLUETOOTH", "android.permission.BLUETOOTH_ADMIN", "android.permission.BLUETOOTH_SCAN", "android.permission.BLUETOOTH_CONNECT", "android.permission.BLUETOOTH_ADVERTISE"],
  BluetoothServer: ["android.permission.BLUETOOTH", "android.permission.BLUETOOTH_ADMIN", "android.permission.BLUETOOTH_SCAN", "android.permission.BLUETOOTH_CONNECT", "android.permission.BLUETOOTH_ADVERTISE"],
  LocationSensor: ["android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"],
  Camera: ["android.permission.CAMERA"],
  Texting: ["android.permission.SEND_SMS"],
  SpeechRecognizer: ["android.permission.RECORD_AUDIO"],
  SoundRecorder: ["android.permission.RECORD_AUDIO"],
  PhoneCall: ["android.permission.CALL_PHONE"],
  ContactPicker: ["android.permission.READ_CONTACTS"],
  ImagePicker: ["android.permission.READ_EXTERNAL_STORAGE"],
  FilePicker: ["android.permission.READ_EXTERNAL_STORAGE"]
};
function collectPermissions(screens = []) {
  const perms = /* @__PURE__ */ new Set();
  const walk = (components = []) => {
    for (const comp of components) {
      const mapped = COMPONENT_PERMISSIONS[comp.type];
      if (mapped) mapped.forEach((p) => perms.add(p));
      if (comp.children?.length) walk(comp.children);
    }
  };
  for (const screen of screens) {
    walk(screen.components || []);
    walk(screen.nonVisibleComponents || []);
  }
  return [...perms];
}
function collectMediaAssets(screens = [], explicitMedia = []) {
  const mediaMap = /* @__PURE__ */ new Map();
  const explicitByName = /* @__PURE__ */ new Map();
  for (const item of explicitMedia) {
    const rawName = item.filename || item.name || item.path;
    if (rawName) {
      const cleanName = import_path.default.basename(String(rawName));
      mediaMap.set(cleanName, item);
      explicitByName.set(cleanName, item);
      console.log(`[APK-BUILDER] collectMedia: explicit media "${cleanName}" hasData=${!!item.data} dataLen=${item.data ? String(item.data).length : 0}`);
    }
  }
  const checkAndAdd = (val) => {
    if (!val || typeof val !== "string") return;
    const str = val.trim();
    if (!str || str.startsWith("http://") || str.startsWith("https://") || str.startsWith("blob:")) return;
    let cleanName = str;
    if (cleanName.startsWith("file:")) {
      cleanName = cleanName.replace(/^file:\/\/\/?/i, "");
    }
    if (cleanName.includes("/") || cleanName.includes("\\")) {
      cleanName = import_path.default.basename(cleanName);
    }
    try {
      cleanName = decodeURIComponent(cleanName);
    } catch (_) {
    }
    if (cleanName.startsWith("media/")) cleanName = cleanName.substring(6);
    if (cleanName && !mediaMap.has(cleanName)) {
      const matchedExplicit = explicitByName.get(cleanName) || Array.from(explicitByName.entries()).find(([k]) => k.toLowerCase() === cleanName.toLowerCase())?.[1];
      if (matchedExplicit && matchedExplicit.data) {
        console.log(`[APK-BUILDER] collectMedia: component ref "${cleanName}" matched explicit media`);
        mediaMap.set(cleanName, { filename: cleanName, data: matchedExplicit.data, type: matchedExplicit.type });
      } else {
        console.log(`[APK-BUILDER] collectMedia: component ref "${cleanName}" has NO matching media \u2014 using raw string as data`);
        mediaMap.set(cleanName, { filename: cleanName, data: str });
      }
    }
  };
  const walk = (components = []) => {
    for (const comp of components) {
      const props = comp.props || {};
      checkAndAdd(props.Picture);
      checkAndAdd(props.Image);
      checkAndAdd(props.Source);
      checkAndAdd(props.source);
      if (comp.children?.length) walk(comp.children);
    }
  };
  for (const screen of screens) {
    checkAndAdd(screen.backgroundImage);
    checkAndAdd(screen.BackgroundImage);
    walk(screen.components || []);
    walk(screen.nonVisibleComponents || []);
  }
  return Array.from(mediaMap.values());
}
function countVisibleComponents(screens = []) {
  let count = 0;
  const walk = (components = []) => {
    for (const component of components) {
      count += 1;
      if (component.children?.length) walk(component.children);
    }
  };
  for (const screen of screens) {
    walk(screen.components || []);
  }
  return count;
}
function normalizeVersionCode(value) {
  const parsed = Number.parseInt(`${value ?? ""}`, 10);
  if (Number.isFinite(parsed) && parsed > 1) return parsed;
  return Math.floor(Date.now() / 1e3);
}
function resolveScreenOrientation(screens = [], designViewport = null) {
  const raw = String(
    screens[0]?.screenOrientation || screens[0]?.ScreenOrientation || designViewport?.orientation || ""
  ).toLowerCase();
  if (raw.includes("portrait")) return "portrait";
  if (raw.includes("landscape")) return "landscape";
  return null;
}
function resolveTemplatePath() {
  const candidates = [
    process.resourcesPath && import_path.default.join(process.resourcesPath, "tools", "base_template.apk"),
    process.resourcesPath && import_path.default.join(process.resourcesPath, "base_template.apk"),
    import_path.default.join(__dirname, "base_template.apk"),
    import_path.default.join(__dirname, "..", "..", "..", "tools", "base_template.apk")
  ].filter(Boolean);
  let found = null;
  for (const c of candidates) {
    if (import_fs_extra.default.pathExistsSync(c)) {
      found = c;
      break;
    }
  }
  if (!found) found = candidates[0];
  if (found && found.includes(".asar" + import_path.default.sep)) {
    const tmpDir = import_path.default.join(import_os.default.tmpdir(), "leapblocks_apk");
    const realPath = import_path.default.join(tmpDir, "base_template.apk");
    if (!import_fs_extra.default.pathExistsSync(realPath)) {
      import_fs_extra.default.ensureDirSync(tmpDir);
      import_fs_extra.default.copySync(found, realPath);
    }
    return realPath;
  }
  return found;
}
var TEMPLATE_APK = resolveTemplatePath();
var OUTPUT_DIR = import_path.default.join(import_os.default.tmpdir(), "leapblocks_output");
var ApkBuilder = class {
  constructor() {
    this.injector = new ApkInjector();
    this.templatePath = TEMPLATE_APK;
  }
  async build(appState, onProgress) {
    console.log("[APK-BUILDER] ==================== BUILD STARTED ====================");
    console.log("[APK-BUILDER] App:", appState.appName, "| Package:", appState.packageName);
    console.log("[APK-BUILDER] Screens:", appState.screens?.length, "| Media:", appState.media?.length);
    console.log("[APK-BUILDER] Template path:", this.templatePath);
    console.log("[APK-BUILDER] Template exists:", await import_fs_extra.default.pathExists(this.templatePath));
    if (Array.isArray(appState.media) && appState.media.length > 0) {
      console.log("[APK-BUILDER] Media items from appState:");
      for (let i = 0; i < appState.media.length; i++) {
        const item = appState.media[i];
        const dataStr = item.data ? String(item.data) : "";
        console.log(`[APK-BUILDER]   media[${i}]: filename="${item.filename}" type="${item.type}" dataLen=${dataStr.length} hasData=${!!item.data} dataPrefix=${dataStr.substring(0, 30)}`);
      }
    } else {
      console.log("[APK-BUILDER] No media items in appState");
    }
    const appName = (appState.appName || "MyApp").replace(/[^a-zA-Z0-9]/g, "") || "MyApp";
    const packageName = appState.packageName || `com.leaplab.${appName.toLowerCase()}`;
    const versionCode = normalizeVersionCode(appState.versionCode);
    const versionName = String(appState.versionName || "1.0").replace(/'/g, "");
    const normalizedAppState = { ...appState, versionCode, versionName };
    const screens = Array.isArray(appState.screens) ? appState.screens : [];
    const visibleComponentCount = countVisibleComponents(screens);
    console.log("[APK-BUILDER] App name:", appName);
    console.log("[APK-BUILDER] Package:", packageName);
    console.log("[APK-BUILDER] Version:", versionCode, versionName);
    console.log("[APK-BUILDER] Screens:", screens.length, "| Visible components:", visibleComponentCount);
    try {
      onProgress?.({ stage: "generating", progress: 5, message: "Generating web application..." });
      onProgress?.({
        stage: "snapshot",
        progress: 6,
        message: `Project snapshot: ${screens.length || 1} screen(s), ${visibleComponentCount} visible component(s)`
      });
      if (visibleComponentCount === 0) {
        onProgress?.({
          stage: "snapshot_warning",
          progress: 7,
          message: "Warning: no visible components are present in the build payload."
        });
      }
      const webAppFiles = generateWebApp(normalizedAppState);
      const fileCount = Object.keys(webAppFiles).length;
      onProgress?.({ stage: "generated", progress: 10, message: `Generated ${fileCount} files` });
      console.log("[APK-BUILDER] Web app files generated:", fileCount);
      const htmlFile = webAppFiles["index.html"];
      if (htmlFile) console.log("[APK-BUILDER] index.html length:", htmlFile.length);
      const jsFile = webAppFiles["app.js"];
      if (jsFile) console.log("[APK-BUILDER] app.js length:", jsFile.length);
      const hasTemplate = await import_fs_extra.default.pathExists(this.templatePath);
      console.log("[APK-BUILDER] Template APK found:", hasTemplate, "at", this.templatePath);
      if (hasTemplate) {
        onProgress?.({ stage: "template_found", progress: 12, message: "Using WebView template APK" });
        const permissions = collectPermissions(screens);
        const screenOrientation = resolveScreenOrientation(screens, appState.designViewport);
        const mediaAssets = collectMediaAssets(screens, appState.media || []);
        console.log("[APK-BUILDER] Permissions:", permissions);
        console.log("[APK-BUILDER] Screen orientation:", screenOrientation);
        console.log("[APK-BUILDER] Collected media assets:", mediaAssets.length);
        onProgress?.({ stage: "media_collected", message: `Collected ${mediaAssets.length} media asset(s) from ${screens.length} screen(s)` });
        for (let i = 0; i < mediaAssets.length; i++) {
          const m = mediaAssets[i];
          const dataStr = m.data ? String(m.data) : "";
          const dataPreview = dataStr.substring(0, 60);
          const hasDataUrl = dataStr.startsWith("data:");
          const b64Len = hasDataUrl && dataStr.indexOf(",") >= 0 ? dataStr.length - dataStr.indexOf(",") - 1 : 0;
          console.log(`[APK-BUILDER]   mediaAsset[${i}]: filename="${m.filename}" hasData=${!!m.data} isDataUrl=${hasDataUrl} b64Len=${b64Len} dataPrefix=${dataPreview}`);
          onProgress?.({ stage: "media_detail", message: `  [${i}] ${m.filename}: dataUrl=${hasDataUrl} b64Len=${b64Len}` });
        }
        if (mediaAssets.length === 0) {
          onProgress?.({ stage: "media_empty", message: "WARNING: No media assets collected. Ensure files are uploaded in Media Manager and component Source properties reference them." });
        }
        console.log("[APK-BUILDER] Calling injector.fullBuild()...");
        const signedPath = await this.injector.fullBuild(
          this.templatePath,
          webAppFiles,
          {
            appName,
            packageName,
            mediaAssets,
            permissions,
            screenOrientation,
            renderedIconsDir: appState.renderedIconsDir || null,
            projectPath: appState.projectPath || appState.path || null,
            projectDir: appState.projectDir || null
          },
          onProgress
        );
        console.log("[APK-BUILDER] injector.fullBuild() returned:", signedPath);
        await import_fs_extra.default.ensureDir(OUTPUT_DIR);
        const finalPath = import_path.default.join(OUTPUT_DIR, `${appName}.apk`);
        console.log("[APK-BUILDER] Copying signed APK to:", finalPath);
        await import_fs_extra.default.copy(signedPath, finalPath, { overwrite: true });
        await this.injector.cleanup();
        onProgress?.({ stage: "complete", progress: 100, message: `Build complete: ${finalPath}` });
        console.log("[APK-BUILDER] ==================== BUILD COMPLETE ====================");
        console.log("[APK-BUILDER] Final APK path:", finalPath);
        return finalPath;
      } else {
        onProgress?.({ stage: "no_template", progress: 12, message: "No template APK \u2014 building from minimal structure" });
        console.log("[APK-BUILDER] No template found \u2014 using buildWithoutTemplate()");
        return await this.buildWithoutTemplate(appName, packageName, appState, webAppFiles, onProgress);
      }
    } catch (error) {
      console.error("[APK-BUILDER] Build error:", error);
      console.error("[APK-BUILDER] Error stack:", error.stack);
      await this.injector.cleanup().catch(() => {
      });
      throw error;
    }
  }
  async buildWithoutTemplate(appName, packageName, appState, webAppFiles, onProgress) {
    console.log("[APK-BUILDER] buildWithoutTemplate() started");
    console.log("[APK-BUILDER]   appName:", appName, "| packageName:", packageName);
    await this.injector.initialize(appName);
    const decodedDir = import_path.default.join(this.injector.workingDir, "decoded");
    const pkgPath = packageName.replace(/\./g, "/");
    const screenOrientation = resolveScreenOrientation(Array.isArray(appState.screens) ? appState.screens : [], appState.designViewport);
    onProgress?.({ stage: "creating_structure", progress: 15, message: "Creating APK structure..." });
    console.log("[APK-BUILDER] Creating APK structure at:", decodedDir);
    await import_fs_extra.default.ensureDir(decodedDir);
    await import_fs_extra.default.ensureDir(import_path.default.join(decodedDir, "smali", ...pkgPath.split("/")));
    await import_fs_extra.default.ensureDir(import_path.default.join(decodedDir, "assets", "www"));
    await import_fs_extra.default.ensureDir(import_path.default.join(decodedDir, "res", "values"));
    await import_fs_extra.default.writeFile(import_path.default.join(decodedDir, "AndroidManifest.xml"), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <application
        android:label="${appName}"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboard|keyboardHidden"${screenOrientation ? `
            android:screenOrientation="${screenOrientation}"` : ""}
            android:windowSoftInputMode="adjustPan"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`);
    await import_fs_extra.default.writeFile(import_path.default.join(decodedDir, "res", "values", "strings.xml"), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>`);
    const parsedVersionCode = Number.parseInt(`${appState.versionCode ?? 1}`, 10);
    const versionCode = Number.isFinite(parsedVersionCode) && parsedVersionCode > 0 ? parsedVersionCode : 1;
    const versionName = String(appState.versionName || "1.0").replace(/'/g, "");
    await import_fs_extra.default.writeFile(import_path.default.join(decodedDir, "apktool.yml"), `!!brut.androlib.meta.MetaInfo
apkFileName: ${appName}.apk
compressionType: false
doNotCompress:
- resources.arsc
isFrameworkApk: false
packageInfo:
  forcedPackageId: '127'
  renameManifestPackage: null
sdkInfo:
  minSdkVersion: '21'
  targetSdkVersion: '33'
usesFramework:
  ids:
  - 1
  tag: null
versionInfo:
  versionCode: ${versionCode}
  versionName: '${versionName}'
`);
    const screens = Array.isArray(appState.screens) ? appState.screens : [];
    const permissions = collectPermissions(screens);
    console.log("[APK-BUILDER] No-template permissions:", permissions);
    let manifest = await import_fs_extra.default.readFile(import_path.default.join(decodedDir, "AndroidManifest.xml"), "utf8");
    for (const perm of permissions) {
      if (!manifest.includes(perm)) {
        manifest = manifest.replace("</manifest>", `    <uses-permission android:name="${perm}" />
</manifest>`);
        console.log("[APK-BUILDER] Added permission:", perm);
      }
    }
    await import_fs_extra.default.writeFile(import_path.default.join(decodedDir, "AndroidManifest.xml"), manifest);
    onProgress?.({ stage: "injecting_assets", progress: 30, message: "Injecting web assets..." });
    const mediaAssets = collectMediaAssets(screens, appState.media || []);
    const projectDir = appState.projectDir || (appState.projectPath ? import_path.default.dirname(appState.projectPath) : null);
    console.log("[APK-BUILDER] Collected", mediaAssets.length, "media assets for injection");
    console.log("[APK-BUILDER] projectDir:", projectDir);
    onProgress?.({ stage: "media_collected", message: `Collected ${mediaAssets.length} media asset(s)` });
    for (let i = 0; i < mediaAssets.length; i++) {
      const m = mediaAssets[i];
      const dataStr = m.data ? String(m.data) : "";
      const hasDataUrl = dataStr.startsWith("data:");
      const b64Len = hasDataUrl && dataStr.indexOf(",") >= 0 ? dataStr.length - dataStr.indexOf(",") - 1 : 0;
      console.log(`[APK-BUILDER]   mediaAsset[${i}]: filename="${m.filename}" hasData=${!!m.data} isDataUrl=${hasDataUrl} b64Len=${b64Len} dataPrefix=${dataStr.substring(0, 40)}`);
      onProgress?.({ stage: "media_detail", message: `  [${i}] ${m.filename}: dataUrl=${hasDataUrl} b64Len=${b64Len}` });
    }
    if (mediaAssets.length === 0) {
      onProgress?.({ stage: "media_empty", message: "WARNING: No media assets found. Upload files in Media Manager." });
    }
    await this.injector.injectAssets(decodedDir, webAppFiles, mediaAssets, onProgress, projectDir);
    onProgress?.({ stage: "injecting_smali", progress: 50, message: "Injecting WebView activity..." });
    console.log("[APK-BUILDER] Injecting WebView activity for package:", packageName);
    await this.injector.injectWebViewActivity(decodedDir, packageName, permissions, onProgress);
    console.log("[APK-BUILDER] Injecting app icon...");
    await this.injector.injectAppIcon(decodedDir, appState.renderedIconsDir || void 0, onProgress);
    const unsignedPath = import_path.default.join(this.injector.workingDir, "unsigned.apk");
    console.log("[APK-BUILDER] Rebuilding APK...");
    await this.injector.rebuildApk(decodedDir, unsignedPath, onProgress);
    const signedOutputDir = import_path.default.join(this.injector.workingDir, "signed");
    await import_fs_extra.default.ensureDir(signedOutputDir);
    console.log("[APK-BUILDER] Signing APK...");
    const signedPath = await this.injector.signApk(unsignedPath, signedOutputDir, onProgress);
    await import_fs_extra.default.ensureDir(OUTPUT_DIR);
    const finalPath = import_path.default.join(OUTPUT_DIR, `${appName}.apk`);
    console.log("[APK-BUILDER] Copying to final path:", finalPath);
    await import_fs_extra.default.copy(signedPath, finalPath, { overwrite: true });
    await this.injector.cleanup();
    onProgress?.({ stage: "complete", progress: 100, message: `Build complete: ${finalPath}` });
    console.log("[APK-BUILDER] buildWithoutTemplate() complete:", finalPath);
    return finalPath;
  }
};
module.exports = ApkBuilder;

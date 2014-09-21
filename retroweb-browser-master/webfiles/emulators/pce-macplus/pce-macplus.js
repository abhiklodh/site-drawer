// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    assert(ret % 2 === 0);
    table.push(func);
    for (var i = 0; i < 2-1; i++) table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      var evalled = eval('(function(' + args.join(',') + '){ ' + source + ' })'); // new Function does not allow upvars in node
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((low>>>0)+((high>>>0)*4294967296)) : ((low>>>0)+((high|0)*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 268435456;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;


// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 63536;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });











var _stdout;
var _stdout=_stdout=allocate(1, "i32*", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate(1, "i32*", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate(1, "i32*", ALLOC_STATIC);






















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































var _strdup;
/* memory initializer */ allocate([0,131,3,0,0,0,0,0,0,130,2,0,0,44,0,0,0,132,4,0,0,4,0,0,0,134,6,0,0,48,0,0,1,132,4,0,0,80,0,0,1,130,2,0,0,46,0,0,1,131,3,0,0,88,0,0,1,134,6,0,0,12,0,0,0,1,2,0,0,24,0,0,0,138,2,0,0,18,0,0,0,129,2,0,0,0,0,0,0,139,2,0,0,20,0,0,0,130,2,0,0,2,0,0,0,2,2,0,0,26,0,0,0,131,2,0,0,4,0,0,0,3,2,0,0,28,0,0,0,132,2,0,0,6,0,0,0,4,2,0,0,30,0,0,0,133,2,0,0,8,0,0,0,5,2,0,0,32,0,0,0,134,2,0,0,10,0,0,0,6,2,0,0,34,0,0,0,135,2,0,0,12,0,0,0,7,2,0,0,36,0,0,0,136,2,0,0,14,0,0,0,8,2,0,0,38,0,0,0,137,2,0,0,16,0,0,1,144,2,0,0,84,0,0,1,135,2,0,0,56,0,0,1,145,2,0,0,86,0,0,1,136,2,0,0,58,0,0,1,146,2,0,0,88,0,0,1,137,2,0,0,60,0,0,1,147,2,0,0,90,0,0,1,138,2,0,0,62,0,0,1,129,2,0,0,22,0,0,1,139,2,0,0,64,0,0,1,130,2,0,0,46,0,0,1,140,2,0,0,66,0,0,1,131,2,0,0,48,0,0,1,141,2,0,0,68,0,0,1,132,2,0,0,50,0,0,1,142,2,0,0,70,0,0,1,133,2,0,0,52,0,0,1,143,2,0,0,72,0,0,1,134,2,0,0,54,0,0,80,0,0,0,0,92,0,0,38,0,0,0,72,0,0,0,8,0,0,0,8,0,0,0,0,168,0,0,248,213,0,0,1,168,0,0,208,213,0,0,2,168,0,0,32,213,0,0,3,168,0,0,168,212,0,0,4,168,0,0,56,212,0,0,5,168,0,0,0,212,0,0,6,168,0,0,168,211,0,0,7,168,0,0,144,211,0,0,8,168,0,0,104,211,0,0,9,168,0,0,80,211,0,0,10,168,0,0,48,211,0,0,11,168,0,0,24,211,0,0,12,168,0,0,152,210,0,0,13,168,0,0,24,210,0,0,14,168,0,0,184,209,0,0,15,168,0,0,160,209,0,0,16,168,0,0,136,209,0,0,17,168,0,0,112,209,0,0,18,168,0,0,80,209,0,0,19,168,0,0,56,209,0,0,20,168,0,0,232,208,0,0,21,168,0,0,208,208,0,0,22,168,0,0,80,208,0,0,23,168,0,0,152,207,0,0,24,168,0,0,248,206,0,0,25,168,0,0,104,206,0,0,26,168,0,0,56,206,0,0,27,168,0,0,32,206,0,0,28,168,0,0,0,206,0,0,29,168,0,0,232,205,0,0,31,168,0,0,144,205,0,0,32,168,0,0,112,205,0,0,33,168,0,0,216,204,0,0,34,168,0,0,32,204,0,0,35,168,0,0,8,204,0,0,38,168,0,0,224,203,0,0,39,168,0,0,184,203,0,0,40,168,0,0,104,203,0,0,41,168,0,0,72,203,0,0,42,168,0,0,248,202,0,0,43,168,0,0,224,202,0,0,44,168,0,0,208,202,0,0,45,168,0,0,136,202,0,0,46,168,0,0,216,201,0,0,47,168,0,0,152,201,0,0,48,168,0,0,112,201,0,0,49,168,0,0,96,201,0,0,51,168,0,0,64,201,0,0,52,168,0,0,24,201,0,0,53,168,0,0,0,201,0,0,54,168,0,0,200,200,0,0,55,168,0,0,184,200,0,0,56,168,0,0,232,199,0,0,57,168,0,0,192,199,0,0,58,168,0,0,176,199,0,0,59,168,0,0,136,199,0,0,60,168,0,0,112,199,0,0,61,168,0,0,80,199,0,0,62,168,0,0,48,199,0,0,63,168,0,0,24,199,0,0,64,168,0,0,208,198,0,0,65,168,0,0,184,198,0,0,66,168,0,0,80,198,0,0,67,168,0,0,248,197,0,0,68,168,0,0,240,197,0,0,69,168,0,0,224,197,0,0,70,168,0,0,208,197,0,0,71,168,0,0,192,197,0,0,72,168,0,0,176,197,0,0,73,168,0,0,160,197,0,0,74,168,0,0,128,197,0,0,75,168,0,0,112,197,0,0,76,168,0,0,16,197,0,0,77,168,0,0,192,196,0,0,78,168,0,0,136,196,0,0,79,168,0,0,16,196,0,0,80,168,0,0,192,195,0,0,81,168,0,0,40,195,0,0,82,168,0,0,184,194,0,0,83,168,0,0,104,194,0,0,84,168,0,0,224,193,0,0,85,168,0,0,192,193,0,0,86,168,0,0,88,193,0,0,88,168,0,0,240,192,0,0,89,168,0,0,208,192,0,0,90,168,0,0,160,192,0,0,91,168,0,0,112,192,0,0,92,168,0,0,88,192,0,0,93,168,0,0,64,192,0,0,94,168,0,0,56,192,0,0,95,168,0,0,40,192,0,0,96,168,0,0,8,192,0,0,97,168,0,0,168,191,0,0,98,168,0,0,40,191,0,0,99,168,0,0,24,191,0,0,100,168,0,0,0,191,0,0,101,168,0,0,232,190,0,0,102,168,0,0,208,190,0,0,103,168,0,0,192,190,0,0,104,168,0,0,144,190,0,0,105,168,0,0,112,190,0,0,106,168,0,0,96,190,0,0,107,168,0,0,24,190,0,0,108,168,0,0,208,189,0,0,109,168,0,0,176,189,0,0,110,168,0,0,144,189,0,0,111,168,0,0,120,189,0,0,112,168,0,0,64,189,0,0,113,168,0,0,32,189,0,0,114,168,0,0,8,189,0,0,115,168,0,0,216,188,0,0,116,168,0,0,200,188,0,0,117,168,0,0,144,188,0,0,118,168,0,0,32,188,0,0,119,168,0,0,8,188,0,0,120,168,0,0,216,187,0,0,121,168,0,0,200,187,0,0,122,168,0,0,184,187,0,0,123,168,0,0,152,187,0,0,124,168,0,0,136,187,0,0,125,168,0,0,104,187,0,0,125,168,0,0,80,187,0,0,126,168,0,0,16,187,0,0,127,168,0,0,208,186,0,0,128,168,0,0,192,186,0,0,129,168,0,0,176,186,0,0,130,168,0,0,168,186,0,0,131,168,0,0,144,186,0,0,132,168,0,0,112,186,0,0,133,168,0,0,88,186,0,0,134,168,0,0,56,186,0,0,135,168,0,0,32,186,0,0,136,168,0,0,216,185,0,0,137,168,0,0,136,185,0,0,138,168,0,0,120,185,0,0,139,168,0,0,88,185,0,0,140,168,0,0,72,185,0,0,141,168,0,0,56,185,0,0,142,168,0,0,40,185,0,0,143,168,0,0,24,185,0,0,144,168,0,0,232,184,0,0,145,168,0,0,224,184,0,0,146,168,0,0,184,184,0,0,147,168,0,0,96,184,0,0,148,168,0,0,88,184,0,0,149,168,0,0,64,184,0,0,150,168,0,0,56,184,0,0,151,168,0,0,48,184,0,0,152,168,0,0,240,183,0,0,153,168,0,0,224,183,0,0,154,168,0,0,200,183,0,0,155,168,0,0,192,183,0,0,156,168,0,0,144,183,0,0,157,168,0,0,72,183,0,0,158,168,0,0,56,183,0,0,159,168,0,0,32,183,0,0,160,168,0,0,24,183,0,0,161,168,0,0,8,183,0,0,162,168,0,0,232,182,0,0,163,168,0,0,216,182,0,0,164,168,0,0,152,182,0,0,165,168,0,0,136,182,0,0,166,168,0,0,96,182,0,0,167,168,0,0,24,182,0,0,168,168,0,0,0,182,0,0,169,168,0,0,232,181,0,0,170,168,0,0,216,181,0,0,171,168,0,0,200,181,0,0,172,168,0,0,184,181,0,0,173,168,0,0,168,181,0,0,174,168,0,0,144,181,0,0,175,168,0,0,128,181,0,0,176,168,0,0,88,181,0,0,177,168,0,0,240,180,0,0,178,168,0,0,192,180,0,0,179,168,0,0,128,180,0,0,180,168,0,0,104,180,0,0,181,168,0,0,240,179,0,0,182,168,0,0,144,179,0,0,183,168,0,0,72,179,0,0,184,168,0,0,0,179,0,0,185,168,0,0,216,178,0,0,186,168,0,0,144,178,0,0,187,168,0,0,72,178,0,0,188,168,0,0,48,178,0,0,189,168,0,0,8,178,0,0,190,168,0,0,240,177,0,0,191,168,0,0,200,177,0,0,192,168,0,0,176,177,0,0,193,168,0,0,160,177,0,0,194,168,0,0,144,177,0,0,195,168,0,0,128,177,0,0,196,168,0,0,88,177,0,0,197,168,0,0,0,177,0,0,198,168,0,0,208,176,0,0,199,168,0,0,176,176,0,0,200,168,0,0,160,176,0,0,201,168,0,0,144,176,0,0,202,168,0,0,120,176,0,0,203,168,0,0,80,176,0,0,204,168,0,0,56,176,0,0,205,168,0,0,40,176,0,0,206,168,0,0,248,175,0,0,207,168,0,0,160,175,0,0,208,168,0,0,136,175,0,0,209,168,0,0,112,175,0,0,210,168,0,0,96,175,0,0,211,168,0,0,80,175,0,0,212,168,0,0,32,175,0,0,213,168,0,0,16,175,0,0,214,168,0,0,240,174,0,0,215,168,0,0,224,174,0,0,216,168,0,0,160,174,0,0,217,168,0,0,40,174,0,0,218,168,0,0,32,174,0,0,219,168,0,0,0,174,0,0,220,168,0,0,240,173,0,0,221,168,0,0,224,173,0,0,222,168,0,0,192,173,0,0,223,168,0,0,184,173,0,0,224,168,0,0,160,173,0,0,225,168,0,0,144,173,0,0,226,168,0,0,32,173,0,0,227,168,0,0,224,172,0,0,228,168,0,0,216,172,0,0,229,168,0,0,184,172,0,0,230,168,0,0,160,172,0,0,231,168,0,0,152,172,0,0,232,168,0,0,120,172,0,0,233,168,0,0,104,172,0,0,234,168,0,0,72,172,0,0,235,168,0,0,64,172,0,0,236,168,0,0,32,172,0,0,237,168,0,0,216,171,0,0,238,168,0,0,200,171,0,0,239,168,0,0,160,171,0,0,240,168,0,0,144,171,0,0,241,168,0,0,128,171,0,0,242,168,0,0,96,171,0,0,243,168,0,0,72,171,0,0,244,168,0,0,48,171,0,0,245,168,0,0,248,170,0,0,246,168,0,0,224,170,0,0,247,168,0,0,176,170,0,0,248,168,0,0,168,170,0,0,249,168,0,0,144,170,0,0,250,168,0,0,136,170,0,0,251,168,0,0,128,170,0,0,252,168,0,0,112,170,0,0,253,168,0,0,104,170,0,0,254,168,0,0,48,170,0,0,255,168,0,0,32,170,0,0,0,169,0,0,16,170,0,0,1,169,0,0,168,169,0,0,2,169,0,0,144,169,0,0,3,169,0,0,112,169,0,0,4,169,0,0,96,169,0,0,5,169,0,0,80,169,0,0,6,169,0,0,56,169,0,0,7,169,0,0,40,169,0,0,8,169,0,0,184,168,0,0,9,169,0,0,176,168,0,0,10,169,0,0,112,168,0,0,11,169,0,0,24,168,0,0,12,169,0,0,8,168,0,0,13,169,0,0,232,167,0,0,14,169,0,0,224,167,0,0,15,169,0,0,216,167,0,0,16,169,0,0,192,167,0,0,17,169,0,0,176,167,0,0,18,169,0,0,152,167,0,0,19,169,0,0,136,167,0,0,20,169,0,0,104,167,0,0,21,169,0,0,48,167,0,0,22,169,0,0,200,166,0,0,23,169,0,0,152,166,0,0,24,169,0,0,120,166,0,0,25,169,0,0,104,166,0,0,26,169,0,0,240,165,0,0,27,169,0,0,152,165,0,0,28,169,0,0,88,165,0,0,29,169,0,0,24,165,0,0,30,169,0,0,232,164,0,0,31,169,0,0,160,164,0,0,32,169,0,0,136,164,0,0,33,169,0,0,96,164,0,0,34,169,0,0,64,164,0,0,35,169,0,0,32,164,0,0,36,169,0,0,248,163,0,0,37,169,0,0,232,163,0,0,38,169,0,0,208,163,0,0,39,169,0,0,192,163,0,0,40,169,0,0,152,163,0,0,41,169,0,0,120,163,0,0,42,169,0,0,32,163,0,0,43,169,0,0,0,163,0,0,44,169,0,0,240,162,0,0,45,169,0,0,224,162,0,0,46,169,0,0,184,162,0,0,47,169,0,0,144,162,0,0,48,169,0,0,120,162,0,0,49,169,0,0,112,162,0,0,50,169,0,0,32,162,0,0,51,169,0,0,232,161,0,0,52,169,0,0,184,161,0,0,53,169,0,0,152,161,0,0,54,169,0,0,136,161,0,0,55,169,0,0,120,161,0,0,56,169,0,0,96,161,0,0,57,169,0,0,56,161,0,0,58,169,0,0,24,161,0,0,59,169,0,0,8,161,0,0,60,169,0,0,208,160,0,0,61,169,0,0,168,160,0,0,62,169,0,0,160,160,0,0,63,169,0,0,128,160,0,0,64,169,0,0,112,160,0,0,65,169,0,0,88,160,0,0,66,169,0,0,64,160,0,0,67,169,0,0,48,160,0,0,68,169,0,0,24,160,0,0,69,169,0,0,8,160,0,0,70,169,0,0,240,159,0,0,71,169,0,0,192,159,0,0,72,169,0,0,176,159,0,0,73,169,0,0,144,159,0,0,74,169,0,0,128,159,0,0,75,169,0,0,112,159,0,0,76,169,0,0,88,159,0,0,77,169,0,0,72,159,0,0,78,169,0,0,48,159,0,0,79,169,0,0,32,159,0,0,80,169,0,0,0,159,0,0,81,169,0,0,224,158,0,0,82,169,0,0,208,158,0,0,83,169,0,0,168,158,0,0,84,169,0,0,152,158,0,0,85,169,0,0,136,158,0,0,86,169,0,0,112,158,0,0,87,169,0,0,96,158,0,0,88,169,0,0,72,158,0,0,89,169,0,0,56,158,0,0,90,169,0,0,232,157,0,0,91,169,0,0,216,157,0,0,92,169,0,0,200,157,0,0,93,169,0,0,168,157,0,0,94,169,0,0,152,157,0,0,95,169,0,0,136,157,0,0,96,169,0,0,112,157,0,0,97,169,0,0,96,157,0,0,98,169,0,0,64,157,0,0,99,169,0,0,48,157,0,0,100,169,0,0,24,157,0,0,101,169,0,0,232,156,0,0,102,169,0,0,216,156,0,0,103,169,0,0,176,156,0,0,104,169,0,0,160,156,0,0,105,169,0,0,144,156,0,0,106,169,0,0,120,156,0,0,107,169,0,0,104,156,0,0,108,169,0,0,64,156,0,0,109,169,0,0,48,156,0,0,110,169,0,0,24,156,0,0,111,169,0,0,248,155,0,0,112,169,0,0,232,155,0,0,113,169,0,0,200,155,0,0,114,169,0,0,184,155,0,0,115,169,0,0,168,155,0,0,116,169,0,0,152,155,0,0,117,169,0,0,136,155,0,0,118,169,0,0,80,155,0,0,119,169,0,0,64,155,0,0,120,169,0,0,40,155,0,0,121,169,0,0,232,154,0,0,122,169,0,0,176,154,0,0,123,169,0,0,120,154,0,0,124,169,0,0,96,154,0,0,125,169,0,0,64,154,0,0,126,169,0,0,248,153,0,0,127,169,0,0,160,153,0,0,128,169,0,0,64,153,0,0,129,169,0,0,32,153,0,0,130,169,0,0,248,152,0,0,131,169,0,0,200,152,0,0,132,169,0,0,176,152,0,0,133,169,0,0,144,152,0,0,134,169,0,0,120,152,0,0,135,169,0,0,88,152,0,0,136,169,0,0,64,152,0,0,137,169,0,0,48,152,0,0,138,169,0,0,16,152,0,0,139,169,0,0,0,152,0,0,140,169,0,0,224,151,0,0,141,169,0,0,136,151,0,0,142,169,0,0,88,151,0,0,143,169,0,0,64,151,0,0,144,169,0,0,48,151,0,0,145,169,0,0,32,151,0,0,146,169,0,0,8,151,0,0,147,169,0,0,224,150,0,0,148,169,0,0,200,150,0,0,149,169,0,0,184,150,0,0,150,169,0,0,112,150,0,0,151,169,0,0,72,150,0,0,152,169,0,0,48,150,0,0,153,169,0,0,16,150,0,0,154,169,0,0,0,150,0,0,155,169,0,0,240,149,0,0,156,169,0,0,216,149,0,0,157,169,0,0,200,149,0,0,158,169,0,0,160,149,0,0,159,169,0,0,144,149,0,0,160,169,0,0,120,149,0,0,161,169,0,0,32,149,0,0,162,169,0,0,16,149,0,0,163,169,0,0,240,148,0,0,164,169,0,0,224,148,0,0,165,169,0,0,208,148,0,0,166,169,0,0,160,148,0,0,167,169,0,0,144,148,0,0,168,169,0,0,104,148,0,0,169,169,0,0,88,148,0,0,170,169,0,0,64,148,0,0,171,169,0,0,32,148,0,0,172,169,0,0,16,148,0,0,173,169,0,0,240,147,0,0,174,169,0,0,224,147,0,0,175,169,0,0,208,147,0,0,176,169,0,0,184,147,0,0,177,169,0,0,168,147,0,0,178,169,0,0,144,147,0,0,179,169,0,0,128,147,0,0,180,169,0,0,96,147,0,0,181,169,0,0,48,147,0,0,182,169,0,0,32,147,0,0,183,169,0,0,248,146,0,0,184,169,0,0,232,146,0,0,185,169,0,0,216,146,0,0,186,169,0,0,192,146,0,0,187,169,0,0,184,146,0,0,188,169,0,0,152,146,0,0,189,169,0,0,136,146,0,0,190,169,0,0,104,146,0,0,191,169,0,0,248,145,0,0,192,169,0,0,232,145,0,0,193,169,0,0,208,145,0,0,194,169,0,0,200,145,0,0,195,169,0,0,184,145,0,0,196,169,0,0,160,145,0,0,197,169,0,0,144,145,0,0,198,169,0,0,120,145,0,0,199,169,0,0,104,145,0,0,200,169,0,0,88,145,0,0,201,169,0,0,56,145,0,0,202,169,0,0,48,145,0,0,203,169,0,0,16,145,0,0,204,169,0,0,0,145,0,0,205,169,0,0,240,144,0,0,206,169,0,0,224,144,0,0,207,169,0,0,208,144,0,0,208,169,0,0,152,144,0,0,209,169,0,0,136,144,0,0,210,169,0,0,112,144,0,0,211,169,0,0,64,144,0,0,212,169,0,0,56,144,0,0,213,169,0,0,32,144,0,0,214,169,0,0,24,144,0,0,215,169,0,0,8,144,0,0,216,169,0,0,240,143,0,0,217,169,0,0,224,143,0,0,218,169,0,0,200,143,0,0,219,169,0,0,192,143,0,0,220,169,0,0,160,143,0,0,221,169,0,0,80,143,0,0,222,169,0,0,56,143,0,0,223,169,0,0,16,143,0,0,224,169,0,0,232,142,0,0,225,169,0,0,184,142,0,0,226,169,0,0,120,142,0,0,227,169,0,0,56,142,0,0,228,169,0,0,176,141,0,0,229,169,0,0,144,141,0,0,230,169,0,0,112,141,0,0,231,169,0,0,72,141,0,0,232,169,0,0,56,141,0,0,233,169,0,0,32,141,0,0,234,169,0,0,8,141,0,0,235,169,0,0,240,140,0,0,235,169,0,0,224,140,0,0,236,169,0,0,208,140,0,0,236,169,0,0,144,140,0,0,237,169,0,0,136,140,0,0,238,169,0,0,96,140,0,0,239,169,0,0,56,140,0,0,240,169,0,0,8,140,0,0,241,169,0,0,232,139,0,0,242,169,0,0,224,139,0,0,243,169,0,0,216,139,0,0,244,169,0,0,200,139,0,0,245,169,0,0,136,139,0,0,246,169,0,0,72,139,0,0,247,169,0,0,56,139,0,0,248,169,0,0,32,139,0,0,249,169,0,0,232,138,0,0,250,169,0,0,216,138,0,0,251,169,0,0,176,138,0,0,252,169,0,0,160,138,0,0,253,169,0,0,144,138,0,0,254,169,0,0,128,138,0,0,255,169,0,0,104,138,0,0,0,170,0,0,48,138,0,0,1,170,0,0,32,138,0,0,3,170,0,0,8,138,0,0,4,170,0,0,216,137,0,0,5,170,0,0,200,137,0,0,6,170,0,0,168,137,0,0,7,170,0,0,152,137,0,0,8,170,0,0,136,137,0,0,9,170,0,0,120,137,0,0,10,170,0,0,72,137,0,0,11,170,0,0,8,137,0,0,12,170,0,0,248,136,0,0,13,170,0,0,224,136,0,0,14,170,0,0,168,136,0,0,15,170,0,0,152,136,0,0,16,170,0,0,136,136,0,0,17,170,0,0,104,136,0,0,18,170,0,0,88,136,0,0,19,170,0,0,72,136,0,0,20,170,0,0,48,136,0,0,21,170,0,0,16,136,0,0,22,170,0,0,0,136,0,0,23,170,0,0,232,135,0,0,24,170,0,0,184,135,0,0,25,170,0,0,168,135,0,0,26,170,0,0,144,135,0,0,27,170,0,0,120,135,0,0,28,170,0,0,104,135,0,0,29,170,0,0,88,135,0,0,30,170,0,0,64,135,0,0,31,170,0,0,32,135,0,0,33,170,0,0,24,135,0,0,34,170,0,0,248,134,0,0,35,170,0,0,200,134,0,0,36,170,0,0,184,134,0,0,37,170,0,0,168,134,0,0,38,170,0,0,136,134,0,0,39,170,0,0,120,134,0,0,40,170,0,0,104,134,0,0,41,170,0,0,80,134,0,0,42,170,0,0,8,134,0,0,43,170,0,0,248,133,0,0,44,170,0,0,184,133,0,0,45,170,0,0,128,133,0,0,46,170,0,0,112,133,0,0,47,170,0,0,96,133,0,0,48,170,0,0,64,133,0,0,49,170,0,0,32,133,0,0,50,170,0,0,16,133,0,0,51,170,0,0,248,132,0,0,52,170,0,0,200,132,0,0,53,170,0,0,184,132,0,0,54,170,0,0,160,132,0,0,55,170,0,0,112,132,0,0,56,170,0,0,96,132,0,0,57,170,0,0,80,132,0,0,58,170,0,0,48,132,0,0,59,170,0,0,40,132,0,0,60,170,0,0,24,132,0,0,61,170,0,0,0,132,0,0,62,170,0,0,232,131,0,0,63,170,0,0,216,131,0,0,64,170,0,0,192,131,0,0,65,170,0,0,152,131,0,0,66,170,0,0,128,131,0,0,67,170,0,0,112,131,0,0,68,170,0,0,40,131,0,0,69,170,0,0,24,131,0,0,70,170,0,0,224,130,0,0,71,170,0,0,168,130,0,0,72,170,0,0,80,130,0,0,73,170,0,0,48,130,0,0,74,170,0,0,16,130,0,0,75,170,0,0,200,129,0,0,76,170,0,0,176,129,0,0,77,170,0,0,152,129,0,0,78,170,0,0,104,129,0,0,79,170,0,0,72,129,0,0,80,170,0,0,56,129,0,0,81,170,0,0,32,129,0,0,82,170,0,0,184,128,0,0,96,170,0,0,168,128,0,0,97,170,0,0,144,128,0,0,98,170,0,0,112,128,0,0,99,170,0,0,72,128,0,0,100,170,0,0,56,128,0,0,101,170,0,0,24,128,0,0,102,170,0,0,8,128,0,0,103,170,0,0,240,127,0,0,104,170,0,0,176,127,0,0,0,0,0,0,0,0,0,0,0,160,0,0,48,163,0,0,1,160,0,0,104,212,0,0,2,160,0,0,200,189,0,0,3,160,0,0,152,175,0,0,4,160,0,0,200,161,0,0,5,160,0,0,64,150,0,0,6,160,0,0,208,138,0,0,7,160,0,0,56,127,0,0,8,160,0,0,64,122,0,0,9,160,0,0,168,118,0,0,10,160,0,0,128,225,0,0,11,160,0,0,8,222,0,0,12,160,0,0,168,217,0,0,13,160,0,0,16,215,0,0,14,160,0,0,24,212,0,0,15,160,0,0,200,209,0,0,16,160,0,0,176,206,0,0,17,160,0,0,248,203,0,0,18,160,0,0,160,201,0,0,19,160,0,0,160,199,0,0,20,160,0,0,232,197,0,0,21,160,0,0,96,196,0,0,22,160,0,0,192,192,0,0,23,160,0,0,16,191,0,0,24,160,0,0,168,189,0,0,25,160,0,0,248,187,0,0,26,160,0,0,184,186,0,0,27,160,0,0,104,185,0,0,28,160,0,0,80,184,0,0,29,160,0,0,48,183,0,0,30,160,0,0,248,181,0,0,31,160,0,0,152,180,0,0,32,160,0,0,32,178,0,0,33,160,0,0,192,176,0,0,34,160,0,0,120,175,0,0,35,160,0,0,16,174,0,0,36,160,0,0,200,172,0,0,37,160,0,0,176,171,0,0,38,160,0,0,152,170,0,0,39,160,0,0,128,169,0,0,40,160,0,0,248,167,0,0,41,160,0,0,168,166,0,0,42,160,0,0,112,164,0,0,43,160,0,0,16,163,0,0,44,160,0,0,168,161,0,0,45,160,0,0,144,160,0,0,46,160,0,0,160,159,0,0,47,160,0,0,184,158,0,0,48,160,0,0,184,157,0,0,49,160,0,0,200,156,0,0,50,160,0,0,216,155,0,0,51,160,0,0,136,154,0,0,52,160,0,0,152,152,0,0,53,160,0,0,80,151,0,0,54,160,0,0,32,150,0,0,56,160,0,0,0,149,0,0,57,160,0,0,0,148,0,0,58,160,0,0,8,147,0,0,59,160,0,0,224,145,0,0,60,160,0,0,32,145,0,0,61,160,0,0,40,144,0,0,62,160,0,0,32,143,0,0,63,160,0,0,40,141,0,0,64,160,0,0,248,139,0,0,65,160,0,0,192,138,0,0,66,160,0,0,184,137,0,0,67,160,0,0,120,136,0,0,68,160,0,0,136,135,0,0,69,160,0,0,152,134,0,0,70,160,0,0,80,133,0,0,71,160,0,0,64,132,0,0,72,160,0,0,104,131,0,0,73,160,0,0,144,129,0,0,74,160,0,0,40,128,0,0,75,160,0,0,40,127,0,0,76,160,0,0,176,126,0,0,77,160,0,0,248,125,0,0,78,160,0,0,120,125,0,0,79,160,0,0,8,125,0,0,80,160,0,0,208,124,0,0,81,160,0,0,96,124,0,0,82,160,0,0,40,124,0,0,84,160,0,0,56,123,0,0,85,160,0,0,176,122,0,0,86,160,0,0,48,122,0,0,87,160,0,0,232,121,0,0,88,160,0,0,176,121,0,0,89,160,0,0,128,121,0,0,90,160,0,0,88,121,0,0,91,160,0,0,40,121,0,0,92,160,0,0,200,120,0,0,93,160,0,0,96,120,0,0,94,160,0,0,88,119,0,0,95,160,0,0,240,118,0,0,96,160,0,0,152,118,0,0,97,160,0,0,112,118,0,0,98,160,0,0,64,118,0,0,99,160,0,0,248,117,0,0,100,160,0,0,184,117,0,0,101,160,0,0,104,117,0,0,102,160,0,0,80,227,0,0,103,160,0,0,8,227,0,0,104,160,0,0,56,226,0,0,105,160,0,0,208,225,0,0,106,160,0,0,112,225,0,0,108,160,0,0,72,225,0,0,109,160,0,0,24,225,0,0,110,160,0,0,216,224,0,0,111,160,0,0,176,224,0,0,112,160,0,0,128,224,0,0,113,160,0,0,64,224,0,0,114,160,0,0,40,224,0,0,117,160,0,0,48,223,0,0,118,160,0,0,184,222,0,0,119,160,0,0,48,222,0,0,120,160,0,0,168,221,0,0,121,160,0,0,96,221,0,0,122,160,0,0,192,220,0,0,123,160,0,0,24,220,0,0,124,160,0,0,240,219,0,0,125,160,0,0,160,219,0,0,126,160,0,0,120,219,0,0,127,160,0,0,160,218,0,0,128,160,0,0,40,218,0,0,129,160,0,0,192,217,0,0,130,160,0,0,136,217,0,0,131,160,0,0,24,217,0,0,132,160,0,0,248,216,0,0,133,160,0,0,224,216,0,0,134,160,0,0,192,216,0,0,135,160,0,0,152,216,0,0,136,160,0,0,112,216,0,0,138,160,0,0,24,216,0,0,139,160,0,0,112,215,0,0,141,160,0,0,40,215,0,0,143,160,0,0,248,214,0,0,144,160,0,0,216,214,0,0,145,160,0,0,176,214,0,0,146,160,0,0,120,214,0,0,152,160,0,0,56,214,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,48,217,0,0,222,1,0,0,128,192,0,0,124,0,0,0,216,177,0,0,166,3,0,0,48,164,0,0,42,4,0,0,104,152,0,0,46,0,0,0,248,140,0,0,234,3,0,0,88,129,0,0,54,4,0,0,16,123,0,0,48,4,0,0,72,119,0,0,34,0,0,0,24,226,0,0,30,1,0,0,208,222,0,0,18,3,0,0,72,218,0,0,90,1,0,0,168,215,0,0,8,0,0,0,192,212,0,0,64,2,0,0,48,210,0,0,86,4,0,0,176,207,0,0,100,3,0,0,64,204,0,0,118,0,0,0,232,201,0,0,174,3,0,0,208,199,0,0,220,0,0,0,0,198,0,0,86,3,0,0,208,196,0,0,44,0,0,0,0,193,0,0,114,3,0,0,0,0,0,0,0,0,0,0,0,43,48,42,47,4,53,41,46,12,58,3,52,25,9,40,45,55,14,11,57,32,30,2,51,28,17,24,8,21,63,39,44,49,5,54,13,59,26,10,56,15,33,31,29,18,22,1,50,6,60,27,16,34,19,23,7,61,35,20,62,36,37,38,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,16,124,0,0,80,120,0,0,248,226,0,0,240,223,0,0,32,219,0,0,0,0,0,0,83,79,70,84,87,65,82,69,32,80,73,82,65,84,69,83,32,155,0,0,240,152,0,0,192,151,0,0,104,150,0,0,24,246,0,0,96,149,0,0,56,148,0,0,72,147,0,0,56,146,0,0,80,145,0,0,88,144,0,0,112,143,0,0,160,141,0,0,96,141,0,0,80,140,0,0,64,130,0,0,8,139,0,0,240,137,0,0,112,123,0,0,200,136,0,0,208,135,0,0,152,119,0,0,24,246,0,0,232,134,0,0,40,165,0,0,160,133,0,0,136,132,0,0,120,226,0,0,176,131,0,0,232,129,0,0,32,223,0,0,24,246,0,0,136,128,0,0,48,153,0,0,80,127,0,0,200,126,0,0,144,218,0,0,16,126,0,0,152,125,0,0,8,216,0,0,32,125,0,0,232,124,0,0,88,156,0,0,248,208,0,0,72,186,0,0,64,171,0,0,80,157,0,0,88,155,0,0,192,144,0,0,224,132,0,0,128,124,0,0,0,121,0,0,88,246,0,0,112,224,0,0,96,219,0,0,168,216,0,0,8,214,0,0,64,211,0,0,248,208,0,0,144,208,0,0,160,205,0,0,88,246,0,0,160,205,0,0,232,202,0,0,88,246,0,0,216,200,0,0,224,198,0,0,136,197,0,0,240,193,0,0,48,192,0,0,128,190,0,0,224,188,0,0,120,187,0,0,248,208,0,0,248,185,0,0,16,185,0,0,208,183,0,0,168,182,0,0,0,1,59,2,60,40,54,3,61,32,49,41,55,19,35,4,62,52,30,33,50,12,14,42,56,16,27,20,36,23,44,5,63,58,39,53,31,48,18,34,51,29,11,13,15,26,22,43,57,38,47,17,28,10,25,21,37,46,9,24,45,8,7,6,63,0,0,0,8,197,0,0,0,0,0,0,64,193,0,0,98,0,1,0,144,191,0,0,16,190,0,0,104,188,0,0,66,0,2,0,0,187,0,0,200,185,0,0,160,184,0,0,99,0,1,0,136,183,0,0,88,182,0,0,56,181,0,0,100,0,1,0,136,178,0,0,88,182,0,0,48,177,0,0,105,0,1,0,232,175,0,0,88,182,0,0,112,174,0,0,73,0,1,0,16,173,0,0,88,182,0,0,248,171,0,0,108,0,1,0,216,170,0,0,88,182,0,0,240,169,0,0,112,0,1,0,8,220,0,0,88,182,0,0,88,168,0,0,113,0,0,0,96,167,0,0,0,0,0,0,200,164,0,0,114,0,0,0,144,163,0,0,0,0,0,0,0,162,0,0,82,0,0,0,192,160,0,0,0,0,0,0,216,159,0,0,115,0,1,0,248,158,0,0,8,158,0,0,0,157,0,0,116,0,1,0,8,156,0,0,88,182,0,0,8,155,0,0,118,0,0,0,232,152,0,0,0,0,0,0,152,151,0,0,86,0,0,0,88,150,0,0,0,0,0,0,56,149,0,0,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,205,0,0,136,205,0,0,40,205,0,0,56,204,0,0,24,204,0,0,240,203,0,0,200,203,0,0,120,203,0,0,88,203,0,0,56,203,0,0,240,202,0,0,216,202,0,0,152,202,0,0,224,201,0,0,208,201,0,0,144,201,0,0,136,214,0,0,64,214,0,0,32,214,0,0,232,213,0,0,152,213,0,0,184,212,0,0,96,212,0,0,16,212,0,0,232,211,0,0,160,211,0,0,120,211,0,0,96,211,0,0,72,211,0,0,40,211,0,0,216,210,0,0,40,210,0,0,248,209,0,0,176,209,0,0,152,209,0,0,128,209,0,0,96,209,0,0,72,209,0,0,0,209,0,0,224,208,0,0,112,208,0,0,168,207,0,0,96,207,0,0,112,206,0,0,72,206,0,0,48,206,0,0,16,206,0,0,248,205,0,0,0,220,0,0,200,219,0,0,144,219,0,0,240,218,0,0,56,218,0,0,240,217,0,0,152,217,0,0,40,217,0,0,8,217,0,0,232,216,0,0,208,216,0,0,176,216,0,0,128,216,0,0,56,216,0,0,136,215,0,0,80,215,0,0,31,0,0,0,28,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,31,0,0,0,29,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,160,191,0,0,2,0,0,0,16,218,0,0,3,0,0,0,224,192,0,0,4,0,0,0,64,178,0,0,5,0,0,0,152,164,0,0,6,0,0,0,192,152,0,0,7,0,0,0,64,141,0,0,8,0,0,0,192,129,0,0,9,0,0,0,80,123,0,0,10,0,0,0,120,119,0,0,11,0,0,0,80,226,0,0,12,0,0,0,0,223,0,0,13,0,0,0,112,218,0,0,14,0,0,0,224,215,0,0,14,0,0,0,248,212,0,0,15,0,0,0,96,210,0,0,15,0,0,0,224,207,0,0,16,0,0,0,96,204,0,0,17,0,0,0,8,202,0,0,17,0,0,0,16,200,0,0,18,0,0,0,32,198,0,0,19,0,0,0,248,196,0,0,20,0,0,0,48,193,0,0,21,0,0,0,128,191,0,0,22,0,0,0,8,190,0,0,23,0,0,0,88,188,0,0,24,0,0,0,240,186,0,0,25,0,0,0,184,185,0,0,26,0,0,0,144,184,0,0,27,0,0,0,120,183,0,0,28,0,0,0,72,182,0,0,28,0,0,0,40,181,0,0,29,0,0,0,128,178,0,0,29,0,0,0,40,177,0,0,30,0,0,0,216,175,0,0,31,0,0,0,104,174,0,0,32,0,0,0,8,173,0,0,33,0,0,0,240,171,0,0,34,0,0,0,208,170,0,0,35,0,0,0,232,169,0,0,36,0,0,0,80,168,0,0,37,0,0,0,88,167,0,0,38,0,0,0,192,164,0,0,39,0,0,0,136,163,0,0,40,0,0,0,248,161,0,0,41,0,0,0,184,160,0,0,42,0,0,0,200,159,0,0,42,0,0,0,240,158,0,0,43,0,0,0,248,157,0,0,43,0,0,0,248,156,0,0,44,0,0,0,0,156,0,0,45,0,0,0,248,154,0,0,46,0,0,0,224,152,0,0,47,0,0,0,184,151,0,0,48,0,0,0,96,150,0,0,49,0,0,0,88,149,0,0,50,0,0,0,48,148,0,0,51,0,0,0,64,147,0,0,52,0,0,0,48,146,0,0,53,0,0,0,72,145,0,0,54,0,0,0,80,144,0,0,55,0,0,0,96,143,0,0,55,0,0,0,88,141,0,0,56,0,0,0,72,140,0,0,56,0,0,0,248,138,0,0,56,0,0,0,232,137,0,0,57,0,0,0,184,136,0,0,57,0,0,0,200,135,0,0,58,0,0,0,216,134,0,0,58,0,0,0,152,133,0,0,59,0,0,0,128,132,0,0,59,0,0,0,168,131,0,0,60,0,0,0,224,129,0,0,61,0,0,0,128,128,0,0,62,0,0,0,72,127,0,0,63,0,0,0,192,126,0,0,64,0,0,0,8,126,0,0,66,0,0,0,144,125,0,0,65,0,0,0,24,125,0,0,67,0,0,0,224,124,0,0,67,0,0,0,112,124,0,0,68,0,0,0,64,124,0,0,68,0,0,0,96,123,0,0,69,0,0,0,224,122,0,0,69,0,0,0,72,122,0,0,71,0,0,0,248,121,0,0,71,0,0,0,184,121,0,0,73,0,0,0,144,121,0,0,73,0,0,0,104,121,0,0,72,0,0,0,56,121,0,0,72,0,0,0,216,120,0,0,72,0,0,0,128,120,0,0,74,0,0,0,136,119,0,0,75,0,0,0,32,119,0,0,75,0,0,0,176,118,0,0,76,0,0,0,128,118,0,0,77,0,0,0,80,118,0,0,78,0,0,0,16,118,0,0,79,0,0,0,192,117,0,0,79,0,0,0,120,117,0,0,79,0,0,0,96,227,0,0,80,0,0,0,40,227,0,0,81,0,0,0,96,226,0,0,82,0,0,0,240,225,0,0,83,0,0,0,136,225,0,0,84,0,0,0,80,225,0,0,85,0,0,0,40,225,0,0,86,0,0,0,248,224,0,0,87,0,0,0,192,224,0,0,88,0,0,0,144,224,0,0,89,0,0,0,80,224,0,0,90,0,0,0,16,224,0,0,91,0,0,0,16,223,0,0,92,0,0,0,168,222,0,0,93,0,0,0,40,222,0,0,94,0,0,0,136,221,0,0,95,0,0,0,40,221,0,0,96,0,0,0,128,220,0,0,97,0,0,0,16,220,0,0,98,0,0,0,224,219,0,0,99,0,0,0,152,219,0,0,100,0,0,0,88,219,0,0,101,0,0,0,128,218,0,0,102,0,0,0,8,218,0,0,103,0,0,0,184,217,0,0,104,0,0,0,72,217,0,0,105,0,0,0,16,217,0,0,106,0,0,0,240,216,0,0,107,0,0,0,216,216,0,0,108,0,0,0,184,216,0,0,109,0,0,0,144,216,0,0,110,0,0,0,88,216,0,0,111,0,0,0,248,215,0,0,112,0,0,0,104,215,0,0,113,0,0,0,32,215,0,0,114,0,0,0,240,214,0,0,115,0,0,0,200,214,0,0,116,0,0,0,160,214,0,0,117,0,0,0,80,214,0,0,118,0,0,0,40,214,0,0,119,0,0,0,240,213,0,0,120,0,0,0,184,213,0,0,121,0,0,0,8,213,0,0,122,0,0,0,144,212,0,0,123,0,0,0,40,212,0,0,124,0,0,0,248,211,0,0,0,0,0,0,0,0,0,0,86,0,0,0,115,0,0,0,87,0,0,0,62,0,0,0,88,0,0,0,116,0,0,0,90,0,0,0,59,0,0,0,91,0,0,0,87,0,0,0,92,0,0,0,60,0,0,0,93,0,0,0,119,0,0,0,94,0,0,0,61,0,0,0,95,0,0,0,121,0,0,0,97,0,0,0,114,0,0,0,98,0,0,0,117,0,0,0,96,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,89,0,0,0,87,0,0,0,91,0,0,0,88,0,0,0,92,0,0,0,90,0,0,0,86,0,0,0,91,0,0,0,87,0,0,0,92,0,0,0,88,0,0,0,93,0,0,0,83,0,0,0,94,0,0,0,84,0,0,0,95,0,0,0,85,0,0,0,97,0,0,0,82,0,0,0,98,0,0,0,65,0,0,0,96,0,0,0,76,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,53,0,0,0,2,0,0,0,122,0,0,0,3,0,0,0,120,0,0,0,4,0,0,0,99,0,0,0,5,0,0,0,118,0,0,0,6,0,0,0,96,0,0,0,7,0,0,0,97,0,0,0,8,0,0,0,98,0,0,0,9,0,0,0,100,0,0,0,10,0,0,0,101,0,0,0,11,0,0,0,109,0,0,0,12,0,0,0,103,0,0,0,13,0,0,0,111,0,0,0,17,0,0,0,50,0,0,0,18,0,0,0,18,0,0,0,19,0,0,0,19,0,0,0,20,0,0,0,20,0,0,0,21,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,23,0,0,0,22,0,0,0,24,0,0,0,26,0,0,0,25,0,0,0,28,0,0,0,26,0,0,0,25,0,0,0,27,0,0,0,29,0,0,0,28,0,0,0,27,0,0,0,29,0,0,0,24,0,0,0,30,0,0,0,51,0,0,0,31,0,0,0,48,0,0,0,32,0,0,0,12,0,0,0,33,0,0,0,13,0,0,0,34,0,0,0,14,0,0,0,35,0,0,0,15,0,0,0,36,0,0,0,17,0,0,0,37,0,0,0,16,0,0,0,38,0,0,0,32,0,0,0,39,0,0,0,34,0,0,0,40,0,0,0,31,0,0,0,41,0,0,0,35,0,0,0,42,0,0,0,33,0,0,0,43,0,0,0,30,0,0,0,57,0,0,0,42,0,0,0,45,0,0,0,57,0,0,0,46,0,0,0,0,0,0,0,47,0,0,0,1,0,0,0,48,0,0,0,2,0,0,0,49,0,0,0,3,0,0,0,50,0,0,0,5,0,0,0,51,0,0,0,4,0,0,0,52,0,0,0,38,0,0,0,53,0,0,0,40,0,0,0,54,0,0,0,37,0,0,0,55,0,0,0,41,0,0,0,56,0,0,0,39,0,0,0,44,0,0,0,36,0,0,0,58,0,0,0,56,0,0,0,60,0,0,0,6,0,0,0,61,0,0,0,7,0,0,0,62,0,0,0,8,0,0,0,63,0,0,0,9,0,0,0,64,0,0,0,11,0,0,0,66,0,0,0,45,0,0,0,65,0,0,0,46,0,0,0,67,0,0,0,43,0,0,0,68,0,0,0,47,0,0,0,69,0,0,0,44,0,0,0,70,0,0,0,56,0,0,0,71,0,0,0,54,0,0,0,72,0,0,0,58,0,0,0,74,0,0,0,58,0,0,0,75,0,0,0,55,0,0,0,76,0,0,0,49,0,0,0,77,0,0,0,55,0,0,0,81,0,0,0,54,0,0,0,99,0,0,0,114,0,0,0,100,0,0,0,115,0,0,0,101,0,0,0,116,0,0,0,102,0,0,0,117,0,0,0,103,0,0,0,119,0,0,0,104,0,0,0,121,0,0,0,105,0,0,0,62,0,0,0,106,0,0,0,59,0,0,0,108,0,0,0,60,0,0,0,107,0,0,0,61,0,0,0,82,0,0,0,71,0,0,0,83,0,0,0,75,0,0,0,84,0,0,0,67,0,0,0,86,0,0,0,89,0,0,0,87,0,0,0,91,0,0,0,88,0,0,0,92,0,0,0,85,0,0,0,78,0,0,0,90,0,0,0,86,0,0,0,91,0,0,0,87,0,0,0,92,0,0,0,88,0,0,0,89,0,0,0,69,0,0,0,93,0,0,0,83,0,0,0,94,0,0,0,84,0,0,0,95,0,0,0,85,0,0,0,96,0,0,0,76,0,0,0,97,0,0,0,82,0,0,0,98,0,0,0,65,0,0,0,0,0,0,0,0,0,0,0,27,0,0,0,1,0,0,0,58,4,0,0,2,0,0,0,59,4,0,0,3,0,0,0,60,4,0,0,4,0,0,0,61,4,0,0,5,0,0,0,62,4,0,0,6,0,0,0,63,4,0,0,7,0,0,0,64,4,0,0,8,0,0,0,65,4,0,0,9,0,0,0,66,4,0,0,10,0,0,0,67,4,0,0,11,0,0,0,68,4,0,0,12,0,0,0,69,4,0,0,13,0,0,0,70,4,0,0,14,0,0,0,71,4,0,0,15,0,0,0,72,4,0,0,16,0,0,0,96,0,0,0,17,0,0,0,49,0,0,0,18,0,0,0,50,0,0,0,19,0,0,0,51,0,0,0,20,0,0,0,52,0,0,0,21,0,0,0,53,0,0,0,22,0,0,0,54,0,0,0,23,0,0,0,55,0,0,0,24,0,0,0,56,0,0,0,25,0,0,0,57,0,0,0,26,0,0,0,48,0,0,0,27,0,0,0,45,0,0,0,28,0,0,0,61,0,0,0,29,0,0,0,187,0,0,0,29,0,0,0,8,0,0,0,30,0,0,0,9,0,0,0,31,0,0,0,113,0,0,0,32,0,0,0,119,0,0,0,33,0,0,0,101,0,0,0,34,0,0,0,114,0,0,0,35,0,0,0,116,0,0,0,36,0,0,0,121,0,0,0,37,0,0,0,117,0,0,0,38,0,0,0,105,0,0,0,39,0,0,0,111,0,0,0,40,0,0,0,112,0,0,0,41,0,0,0,91,0,0,0,42], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([93,0,0,0,43,0,0,0,13,0,0,0,44,0,0,0,57,4,0,0,45,0,0,0,97,0,0,0,46,0,0,0,115,0,0,0,47,0,0,0,100,0,0,0,48,0,0,0,102,0,0,0,49,0,0,0,103,0,0,0,50,0,0,0,104,0,0,0,51,0,0,0,106,0,0,0,52,0,0,0,107,0,0,0,53,0,0,0,108,0,0,0,54,0,0,0,59,0,0,0,55,0,0,0,186,0,0,0,55,0,0,0,39,0,0,0,56,0,0,0,92,0,0,0,57,0,0,0,220,0,0,0,57,0,0,0,225,4,0,0,58,0,0,0,60,0,0,0,59,0,0,0,122,0,0,0,60,0,0,0,120,0,0,0,61,0,0,0,99,0,0,0,62,0,0,0,118,0,0,0,63,0,0,0,98,0,0,0,64,0,0,0,110,0,0,0,66,0,0,0,109,0,0,0,65,0,0,0,44,0,0,0,67,0,0,0,46,0,0,0,68,0,0,0,47,0,0,0,69,0,0,0,229,4,0,0,70,0,0,0,224,4,0,0,71,0,0,0,227,4,0,0,73,0,0,0,227,4,0,0,72,0,0,0,226,4,0,0,75,0,0,0,1,5,0,0,74,0,0,0,32,0,0,0,76,0,0,0,230,4,0,0,77,0,0,0,231,4,0,0,78,0,0,0,231,4,0,0,79,0,0,0,118,4,0,0,80,0,0,0,228,4,0,0,81,0,0,0,83,4,0,0,82,0,0,0,84,4,0,0,83,0,0,0,85,4,0,0,84,0,0,0,86,4,0,0,85,0,0,0,95,4,0,0,86,0,0,0,96,4,0,0,87,0,0,0,97,4,0,0,88,0,0,0,87,4,0,0,89,0,0,0,92,4,0,0,90,0,0,0,93,4,0,0,91,0,0,0,94,4,0,0,92,0,0,0,89,4,0,0,93,0,0,0,90,4,0,0,94,0,0,0,91,4,0,0,95,0,0,0,88,4,0,0,96,0,0,0,98,4,0,0,97,0,0,0,99,4,0,0,98,0,0,0,73,4,0,0,99,0,0,0,74,4,0,0,100,0,0,0,75,4,0,0,101,0,0,0,127,0,0,0,102,0,0,0,77,4,0,0,103,0,0,0,78,4,0,0,104,0,0,0,82,4,0,0,105,0,0,0,80,4,0,0,106,0,0,0,81,4,0,0,107,0,0,0,79,4,0,0,108,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,1,0,101,0,0,0,0,0,0,0,1,0,229,0,0,0,0,0,0,0,18,0,0,0,1,0,37,0,0,0,0,0,0,0,1,0,165,0,0,0,0,0,0,0,19,0,0,0,1,0,39,0,0,0,0,0,0,0,1,0,167,0,0,0,0,0,0,0,20,0,0,0,1,0,41,0,0,0,0,0,0,0,1,0,169,0,0,0,0,0,0,0,21,0,0,0,1,0,43,0,0,0,0,0,0,0,1,0,171,0,0,0,0,0,0,0,22,0,0,0,1,0,47,0,0,0,0,0,0,0,1,0,175,0,0,0,0,0,0,0,23,0,0,0,1,0,45,0,0,0,0,0,0,0,1,0,173,0,0,0,0,0,0,0,24,0,0,0,1,0,53,0,0,0,0,0,0,0,1,0,181,0,0,0,0,0,0,0,25,0,0,0,1,0,57,0,0,0,0,0,0,0,1,0,185,0,0,0,0,0,0,0,26,0,0,0,1,0,51,0,0,0,0,0,0,0,1,0,179,0,0,0,0,0,0,0,27,0,0,0,1,0,59,0,0,0,0,0,0,0,1,0,187,0,0,0,0,0,0,0,28,0,0,0,1,0,55,0,0,0,0,0,0,0,1,0,183,0,0,0,0,0,0,0,29,0,0,0,1,0,49,0,0,0,0,0,0,0,1,0,177,0,0,0,0,0,0,0,30,0,0,0,1,0,103,0,0,0,0,0,0,0,1,0,231,0,0,0,0,0,0,0,31,0,0,0,1,0,97,0,0,0,0,0,0,0,1,0,225,0,0,0,0,0,0,0,32,0,0,0,1,0,25,0,0,0,0,0,0,0,1,0,153,0,0,0,0,0,0,0,33,0,0,0,1,0,27,0,0,0,0,0,0,0,1,0,155,0,0,0,0,0,0,0,34,0,0,0,1,0,29,0,0,0,0,0,0,0,1,0,157,0,0,0,0,0,0,0,35,0,0,0,1,0,31,0,0,0,0,0,0,0,1,0,159,0,0,0,0,0,0,0,36,0,0,0,1,0,35,0,0,0,0,0,0,0,1,0,163,0,0,0,0,0,0,0,37,0,0,0,1,0,33,0,0,0,0,0,0,0,1,0,161,0,0,0,0,0,0,0,38,0,0,0,1,0,65,0,0,0,0,0,0,0,1,0,193,0,0,0,0,0,0,0,39,0,0,0,1,0,69,0,0,0,0,0,0,0,1,0,197,0,0,0,0,0,0,0,40,0,0,0,1,0,63,0,0,0,0,0,0,0,1,0,191,0,0,0,0,0,0,0,41,0,0,0,1,0,71,0,0,0,0,0,0,0,1,0,199,0,0,0,0,0,0,0,42,0,0,0,1,0,67,0,0,0,0,0,0,0,1,0,195,0,0,0,0,0,0,0,43,0,0,0,1,0,61,0,0,0,0,0,0,0,1,0,189,0,0,0,0,0,0,0,57,0,0,0,1,0,85,0,0,0,0,0,0,0,1,0,213,0,0,0,0,0,0,0,44,0,0,0,1,0,73,0,0,0,0,0,0,0,1,0,201,0,0,0,0,0,0,0,45,0,0,0,1,0,115,0,0,0,0,0,0,0,1,0,243,0,0,0,0,0,0,0,46,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,129,0,0,0,0,0,0,0,47,0,0,0,1,0,3,0,0,0,0,0,0,0,1,0,131,0,0,0,0,0,0,0,48,0,0,0,1,0,5,0,0,0,0,0,0,0,1,0,133,0,0,0,0,0,0,0,49,0,0,0,1,0,7,0,0,0,0,0,0,0,1,0,135,0,0,0,0,0,0,0,50,0,0,0,1,0,11,0,0,0,0,0,0,0,1,0,139,0,0,0,0,0,0,0,51,0,0,0,1,0,9,0,0,0,0,0,0,0,1,0,137,0,0,0,0,0,0,0,52,0,0,0,1,0,77,0,0,0,0,0,0,0,1,0,205,0,0,0,0,0,0,0,53,0,0,0,1,0,81,0,0,0,0,0,0,0,1,0,209,0,0,0,0,0,0,0,54,0,0,0,1,0,75,0,0,0,0,0,0,0,1,0,203,0,0,0,0,0,0,0,55,0,0,0,1,0,83,0,0,0,0,0,0,0,1,0,211,0,0,0,0,0,0,0,56,0,0,0,1,0,79,0,0,0,0,0,0,0,1,0,207,0,0,0,0,0,0,0,58,0,0,0,1,0,113,0,0,0,0,0,0,0,1,0,241,0,0,0,0,0,0,0,70,0,0,0,1,0,113,0,0,0,0,0,0,0,1,0,241,0,0,0,0,0,0,0,60,0,0,0,1,0,13,0,0,0,0,0,0,0,1,0,141,0,0,0,0,0,0,0,61,0,0,0,1,0,15,0,0,0,0,0,0,0,1,0,143,0,0,0,0,0,0,0,62,0,0,0,1,0,17,0,0,0,0,0,0,0,1,0,145,0,0,0,0,0,0,0,63,0,0,0,1,0,19,0,0,0,0,0,0,0,1,0,147,0,0,0,0,0,0,0,64,0,0,0,1,0,23,0,0,0,0,0,0,0,1,0,151,0,0,0,0,0,0,0,66,0,0,0,1,0,91,0,0,0,0,0,0,0,1,0,219,0,0,0,0,0,0,0,65,0,0,0,1,0,93,0,0,0,0,0,0,0,1,0,221,0,0,0,0,0,0,0,67,0,0,0,1,0,87,0,0,0,0,0,0,0,1,0,215,0,0,0,0,0,0,0,68,0,0,0,1,0,95,0,0,0,0,0,0,0,1,0,223,0,0,0,0,0,0,0,69,0,0,0,1,0,89,0,0,0,0,0,0,0,1,0,217,0,0,0,0,0,0,0,71,0,0,0,1,0,117,0,0,0,0,0,0,0,1,0,245,0,0,0,0,0,0,0,81,0,0,0,1,0,117,0,0,0,0,0,0,0,1,0,245,0,0,0,0,0,0,0,75,0,0,0,1,0,111,0,0,0,0,0,0,0,1,0,239,0,0,0,0,0,0,0,77,0,0,0,1,0,105,0,0,0,0,0,0,0,1,0,233,0,0,0,0,0,0,0,76,0,0,0,1,0,99,0,0,0,0,0,0,0,1,0,227,0,0,0,0,0,0,0,82,0,0,0,2,0,121,15,0,0,0,0,0,0,2,0,121,143,0,0,0,0,0,0,83,0,0,0,3,0,113,121,27,0,0,0,0,0,3,0,121,155,241,0,0,0,0,0,84,0,0,0,3,0,113,121,5,0,0,0,0,0,3,0,121,133,241,0,0,0,0,0,85,0,0,0,2,0,121,29,0,0,0,0,0,0,2,0,121,157,0,0,0,0,0,0,86,0,0,0,2,0,121,51,0,0,0,0,0,0,2,0,121,179,0,0,0,0,0,0,87,0,0,0,2,0,121,55,0,0,0,0,0,0,2,0,121,183,0,0,0,0,0,0,88,0,0,0,2,0,121,57,0,0,0,0,0,0,2,0,121,185,0,0,0,0,0,0,89,0,0,0,3,0,113,121,13,0,0,0,0,0,3,0,121,141,241,0,0,0,0,0,90,0,0,0,2,0,121,45,0,0,0,0,0,0,2,0,121,173,0,0,0,0,0,0,91,0,0,0,2,0,121,47,0,0,0,0,0,0,2,0,121,175,0,0,0,0,0,0,92,0,0,0,2,0,121,49,0,0,0,0,0,0,2,0,121,177,0,0,0,0,0,0,93,0,0,0,2,0,121,39,0,0,0,0,0,0,2,0,121,167,0,0,0,0,0,0,94,0,0,0,2,0,121,41,0,0,0,0,0,0,2,0,121,169,0,0,0,0,0,0,95,0,0,0,2,0,121,43,0,0,0,0,0,0,2,0,121,171,0,0,0,0,0,0,96,0,0,0,2,0,121,25,0,0,0,0,0,0,2,0,121,153,0,0,0,0,0,0,97,0,0,0,2,0,121,37,0,0,0,0,0,0,2,0,121,165,0,0,0,0,0,0,98,0,0,0,2,0,121,3,0,0,0,0,0,0,2,0,121,131,0,0,0,0,0,0,105,0,0,0,2,0,121,27,0,0,0,0,0,0,2,0,121,155,0,0,0,0,0,0,106,0,0,0,2,0,121,13,0,0,0,0,0,0,2,0,121,141,0,0,0,0,0,0,108,0,0,0,2,0,121,5,0,0,0,0,0,0,2,0,121,133,0,0,0,0,0,0,107,0,0,0,2,0,121,17,0,0,0,0,0,0,2,0,121,145,0,0,0,0,0,0,100,0,0,0,2,0,121,103,0,0,0,0,0,0,2,0,121,231,0,0,0,0,0,0,103,0,0,0,2,0,121,111,0,0,0,0,0,0,2,0,121,239,0,0,0,0,0,0,101,0,0,0,2,0,121,105,0,0,0,0,0,0,2,0,121,233,0,0,0,0,0,0,104,0,0,0,2,0,121,115,0,0,0,0,0,0,2,0,121,243,0,0,0,0,0,0,99,0,0,0,2,0,121,101,0,0,0,0,0,0,2,0,121,101,0,0,0,0,0,0,102,0,0,0,2,0,121,107,0,0,0,0,0,0,2,0,121,235,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,1,0,101,0,0,0,0,0,0,0,1,0,229,0,0,0,0,0,0,0,18,0,0,0,1,0,39,0,0,0,0,0,0,0,1,0,167,0,0,0,0,0,0,0,19,0,0,0,1,0,39,0,0,0,0,0,0,0,1,0,167,0,0,0,0,0,0,0,20,0,0,0,1,0,41,0,0,0,0,0,0,0,1,0,169,0,0,0,0,0,0,0,21,0,0,0,1,0,43,0,0,0,0,0,0,0,1,0,171,0,0,0,0,0,0,0,22,0,0,0,1,0,47,0,0,0,0,0,0,0,1,0,175,0,0,0,0,0,0,0,23,0,0,0,1,0,45,0,0,0,0,0,0,0,1,0,173,0,0,0,0,0,0,0,24,0,0,0,1,0,53,0,0,0,0,0,0,0,1,0,181,0,0,0,0,0,0,0,25,0,0,0,1,0,57,0,0,0,0,0,0,0,1,0,185,0,0,0,0,0,0,0,26,0,0,0,1,0,51,0,0,0,0,0,0,0,1,0,179,0,0,0,0,0,0,0,27,0,0,0,1,0,59,0,0,0,0,0,0,0,1,0,187,0,0,0,0,0,0,0,28,0,0,0,1,0,55,0,0,0,0,0,0,0,1,0,183,0,0,0,0,0,0,0,29,0,0,0,1,0,49,0,0,0,0,0,0,0,1,0,177,0,0,0,0,0,0,0,30,0,0,0,1,0,103,0,0,0,0,0,0,0,1,0,231,0,0,0,0,0,0,0,31,0,0,0,1,0,97,0,0,0,0,0,0,0,1,0,225,0,0,0,0,0,0,0,32,0,0,0,1,0,25,0,0,0,0,0,0,0,1,0,153,0,0,0,0,0,0,0,33,0,0,0,1,0,27,0,0,0,0,0,0,0,1,0,155,0,0,0,0,0,0,0,34,0,0,0,1,0,29,0,0,0,0,0,0,0,1,0,157,0,0,0,0,0,0,0,35,0,0,0,1,0,31,0,0,0,0,0,0,0,1,0,159,0,0,0,0,0,0,0,36,0,0,0,1,0,35,0,0,0,0,0,0,0,1,0,163,0,0,0,0,0,0,0,37,0,0,0,1,0,33,0,0,0,0,0,0,0,1,0,161,0,0,0,0,0,0,0,38,0,0,0,1,0,65,0,0,0,0,0,0,0,1,0,193,0,0,0,0,0,0,0,39,0,0,0,1,0,69,0,0,0,0,0,0,0,1,0,197,0,0,0,0,0,0,0,40,0,0,0,1,0,63,0,0,0,0,0,0,0,1,0,191,0,0,0,0,0,0,0,41,0,0,0,1,0,71,0,0,0,0,0,0,0,1,0,199,0,0,0,0,0,0,0,42,0,0,0,1,0,67,0,0,0,0,0,0,0,1,0,195,0,0,0,0,0,0,0,43,0,0,0,1,0,61,0,0,0,0,0,0,0,1,0,189,0,0,0,0,0,0,0,44,0,0,0,1,0,85,0,0,0,0,0,0,0,1,0,213,0,0,0,0,0,0,0,45,0,0,0,1,0,115,0,0,0,0,0,0,0,1,0,243,0,0,0,0,0,0,0,46,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,129,0,0,0,0,0,0,0,47,0,0,0,1,0,3,0,0,0,0,0,0,0,1,0,131,0,0,0,0,0,0,0,48,0,0,0,1,0,5,0,0,0,0,0,0,0,1,0,133,0,0,0,0,0,0,0,49,0,0,0,1,0,7,0,0,0,0,0,0,0,1,0,135,0,0,0,0,0,0,0,50,0,0,0,1,0,11,0,0,0,0,0,0,0,1,0,139,0,0,0,0,0,0,0,51,0,0,0,1,0,9,0,0,0,0,0,0,0,1,0,137,0,0,0,0,0,0,0,52,0,0,0,1,0,77,0,0,0,0,0,0,0,1,0,205,0,0,0,0,0,0,0,53,0,0,0,1,0,81,0,0,0,0,0,0,0,1,0,209,0,0,0,0,0,0,0,54,0,0,0,1,0,75,0,0,0,0,0,0,0,1,0,203,0,0,0,0,0,0,0,55,0,0,0,1,0,83,0,0,0,0,0,0,0,1,0,211,0,0,0,0,0,0,0,56,0,0,0,1,0,79,0,0,0,0,0,0,0,1,0,207,0,0,0,0,0,0,0,57,0,0,0,1,0,73,0,0,0,0,0,0,0,1,0,201,0,0,0,0,0,0,0,58,0,0,0,1,0,113,0,0,0,0,0,0,0,1,0,241,0,0,0,0,0,0,0,70,0,0,0,1,0,113,0,0,0,0,0,0,0,1,0,241,0,0,0,0,0,0,0,59,0,0,0,1,0,13,0,0,0,0,0,0,0,1,0,141,0,0,0,0,0,0,0,60,0,0,0,1,0,15,0,0,0,0,0,0,0,1,0,143,0,0,0,0,0,0,0,61,0,0,0,1,0,17,0,0,0,0,0,0,0,1,0,145,0,0,0,0,0,0,0,62,0,0,0,1,0,19,0,0,0,0,0,0,0,1,0,147,0,0,0,0,0,0,0,63,0,0,0,1,0,23,0,0,0,0,0,0,0,1,0,151,0,0,0,0,0,0,0,64,0,0,0,1,0,91,0,0,0,0,0,0,0,1,0,219,0,0,0,0,0,0,0,66,0,0,0,1,0,93,0,0,0,0,0,0,0,1,0,221,0,0,0,0,0,0,0,65,0,0,0,1,0,87,0,0,0,0,0,0,0,1,0,215,0,0,0,0,0,0,0,67,0,0,0,1,0,95,0,0,0,0,0,0,0,1,0,223,0,0,0,0,0,0,0,68,0,0,0,1,0,89,0,0,0,0,0,0,0,1,0,217,0,0,0,0,0,0,0,69,0,0,0,1,0,21,0,0,0,0,0,0,0,1,0,149,0,0,0,0,0,0,0,71,0,0,0,1,0,117,0,0,0,0,0,0,0,1,0,245,0,0,0,0,0,0,0,81,0,0,0,1,0,117,0,0,0,0,0,0,0,1,0,245,0,0,0,0,0,0,0,75,0,0,0,1,0,111,0,0,0,0,0,0,0,1,0,239,0,0,0,0,0,0,0,77,0,0,0,1,0,99,0,0,0,0,0,0,0,1,0,227,0,0,0,0,0,0,0,76,0,0,0,1,0,105,0,0,0,0,0,0,0,1,0,233,0,0,0,0,0,0,0,82,0,0,0,2,0,121,15,0,0,0,0,0,0,2,0,121,143,0,0,0,0,0,0,83,0,0,0,3,0,113,121,27,0,0,0,0,0,3,0,121,155,241,0,0,0,0,0,84,0,0,0,3,0,113,121,5,0,0,0,0,0,3,0,121,133,241,0,0,0,0,0,85,0,0,0,2,0,121,29,0,0,0,0,0,0,2,0,121,157,0,0,0,0,0,0,86,0,0,0,2,0,121,51,0,0,0,0,0,0,2,0,121,179,0,0,0,0,0,0,87,0,0,0,2,0,121,55,0,0,0,0,0,0,2,0,121,183,0,0,0,0,0,0,88,0,0,0,2,0,121,57,0,0,0,0,0,0,2,0,121,185,0,0,0,0,0,0,89,0,0,0,3,0,113,121,13,0,0,0,0,0,3,0,121,141,241,0,0,0,0,0,90,0,0,0,2,0,121,45,0,0,0,0,0,0,2,0,121,173,0,0,0,0,0,0,91,0,0,0,2,0,121,47,0,0,0,0,0,0,2,0,121,175,0,0,0,0,0,0,92,0,0,0,2,0,121,49,0,0,0,0,0,0,2,0,121,177,0,0,0,0,0,0,93,0,0,0,2,0,121,39,0,0,0,0,0,0,2,0,121,167,0,0,0,0,0,0,94,0,0,0,2,0,121,41,0,0,0,0,0,0,2,0,121,169,0,0,0,0,0,0,95,0,0,0,2,0,121,43,0,0,0,0,0,0,2,0,121,171,0,0,0,0,0,0,96,0,0,0,2,0,121,25,0,0,0,0,0,0,2,0,121,153,0,0,0,0,0,0,97,0,0,0,2,0,121,37,0,0,0,0,0,0,2,0,121,165,0,0,0,0,0,0,98,0,0,0,2,0,121,3,0,0,0,0,0,0,2,0,121,131,0,0,0,0,0,0,105,0,0,0,2,0,121,27,0,0,0,0,0,0,2,0,121,155,0,0,0,0,0,0,106,0,0,0,2,0,121,13,0,0,0,0,0,0,2,0,121,141,0,0,0,0,0,0,108,0,0,0,2,0,121,5,0,0,0,0,0,0,2,0,121,133,0,0,0,0,0,0,107,0,0,0,2,0,121,17,0,0,0,0,0,0,2,0,121,145,0,0,0,0,0,0,100,0,0,0,2,0,121,103,0,0,0,0,0,0,2,0,121,231,0,0,0,0,0,0,103,0,0,0,2,0,121,111,0,0,0,0,0,0,2,0,121,239,0,0,0,0,0,0,101,0,0,0,2,0,121,105,0,0,0,0,0,0,2,0,121,233,0,0,0,0,0,0,104,0,0,0,2,0,121,115,0,0,0,0,0,0,2,0,121,243,0,0,0,0,0,0,99,0,0,0,2,0,121,101,0,0,0,0,0,0,2,0,121,229,0,0,0,0,0,0,102,0,0,0,2,0,121,107,0,0,0,0,0,0,2,0,121,235,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,2,0,121,51,0,0,0,0,0,0,2,0,121,179,0,0,0,0,0,0,87,0,0,0,2,0,121,55,0,0,0,0,0,0,2,0,121,183,0,0,0,0,0,0,88,0,0,0,2,0,121,57,0,0,0,0,0,0,2,0,121,185,0,0,0,0,0,0,90,0,0,0,2,0,121,45,0,0,0,0,0,0,2,0,121,173,0,0,0,0,0,0,91,0,0,0,2,0,121,47,0,0,0,0,0,0,2,0,121,175,0,0,0,0,0,0,92,0,0,0,2,0,121,49,0,0,0,0,0,0,2,0,121,177,0,0,0,0,0,0,93,0,0,0,2,0,121,39,0,0,0,0,0,0,2,0,121,167,0,0,0,0,0,0,94,0,0,0,2,0,121,41,0,0,0,0,0,0,2,0,121,169,0,0,0,0,0,0,95,0,0,0,2,0,121,43,0,0,0,0,0,0,2,0,121,171,0,0,0,0,0,0,97,0,0,0,2,0,121,37,0,0,0,0,0,0,2,0,121,165,0,0,0,0,0,0,98,0,0,0,2,0,121,3,0,0,0,0,0,0,2,0,121,131,0,0,0,0,0,0,96,0,0,0,2,0,121,25,0,0,0,0,0,0,2,0,121,153,0,0,0,0,0,0,100,0,0,0,2,0,121,103,0,0,0,0,0,0,2,0,121,231,0,0,0,0,0,0,105,0,0,0,2,0,121,27,0,0,0,0,0,0,2,0,121,155,0,0,0,0,0,0,101,0,0,0,2,0,121,105,0,0,0,0,0,0,2,0,121,233,0,0,0,0,0,0,106,0,0,0,2,0,121,13,0,0,0,0,0,0,2,0,121,141,0,0,0,0,0,0,108,0,0,0,2,0,121,5,0,0,0,0,0,0,2,0,121,133,0,0,0,0,0,0,103,0,0,0,2,0,121,111,0,0,0,0,0,0,2,0,121,239,0,0,0,0,0,0,107,0,0,0,2,0,121,17,0,0,0,0,0,0,2,0,121,145,0,0,0,0,0,0,104,0,0,0,2,0,121,115,0,0,0,0,0,0,2,0,121,243,0,0,0,0,0,0,99,0,0,0,2,0,121,101,0,0,0,0,0,0,2,0,121,101,0,0,0,0,0,0,102,0,0,0,2,0,121,107,0,0,0,0,0,0,2,0,121,235,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,2,0,121,103,0,0,0,0,0,0,2,0,121,231,0,0,0,0,0,0,87,0,0,0,2,0,121,27,0,0,0,0,0,0,2,0,121,155,0,0,0,0,0,0,88,0,0,0,2,0,121,105,0,0,0,0,0,0,2,0,121,233,0,0,0,0,0,0,90,0,0,0,2,0,121,13,0,0,0,0,0,0,2,0,121,141,0,0,0,0,0,0,91,0,0,0,2,0,121,25,0,0,0,0,0,0,2,0,121,153,0,0,0,0,0,0,92,0,0,0,2,0,121,5,0,0,0,0,0,0,2,0,121,133,0,0,0,0,0,0,93,0,0,0,2,0,121,111,0,0,0,0,0,0,2,0,121,239,0,0,0,0,0,0,94,0,0,0,2,0,121,17,0,0,0,0,0,0,2,0,121,145,0,0,0,0,0,0,95,0,0,0,2,0,121,115,0,0,0,0,0,0,2,0,121,243,0,0,0,0,0,0,97,0,0,0,2,0,121,101,0,0,0,0,0,0,2,0,121,101,0,0,0,0,0,0,98,0,0,0,2,0,121,107,0,0,0,0,0,0,2,0,121,235,0,0,0,0,0,0,96,0,0,0,1,0,73,0,0,0,0,0,0,0,1,0,201,0,0,0,0,0,0,0,100,0,0,0,2,0,121,51,0,0,0,0,0,0,2,0,121,179,0,0,0,0,0,0,105,0,0,0,2,0,121,55,0,0,0,0,0,0,2,0,121,183,0,0,0,0,0,0,101,0,0,0,2,0,121,57,0,0,0,0,0,0,2,0,121,185,0,0,0,0,0,0,106,0,0,0,2,0,121,45,0,0,0,0,0,0,2,0,121,173,0,0,0,0,0,0,108,0,0,0,2,0,121,49,0,0,0,0,0,0,2,0,121,177,0,0,0,0,0,0,103,0,0,0,2,0,121,39,0,0,0,0,0,0,2,0,121,167,0,0,0,0,0,0,107,0,0,0,2,0,121,41,0,0,0,0,0,0,2,0,121,169,0,0,0,0,0,0,104,0,0,0,2,0,121,43,0,0,0,0,0,0,2,0,121,171,0,0,0,0,0,0,99,0,0,0,2,0,121,37,0,0,0,0,0,0,2,0,121,165,0,0,0,0,0,0,102,0,0,0,2,0,121,3,0,0,0,0,0,0,2,0,121,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,230,41,1,0,14,17,1,0,52,248,0,0,102,223,0,0,150,198,0,0,0,0,0,0,230,41,1,0,14,17,1,0,52,248,0,0,102,223,0,0,150,198,0,0,0,0,0,0,150,151,154,155,157,158,159,166,167,171,172,173,174,175,178,179,180,181,182,183,185,186,187,188,189,190,191,203,205,206,207,211,214,215,217,218,219,220,221,222,223,229,230,231,233,234,235,236,237,238,239,242,243,244,245,246,247,249,250,251,252,253,254,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,1,255,255,2,3,255,4,5,6,255,255,255,255,255,255,7,8,255,255,255,9,10,11,12,13,255,255,14,15,16,17,18,19,255,20,21,22,23,24,25,26,255,255,255,255,255,255,255,255,255,255,255,27,255,28,29,30,255,255,255,31,255,255,32,33,255,34,35,36,37,38,39,40,255,255,255,255,255,41,42,43,255,44,45,46,47,48,49,50,255,255,51,52,53,54,55,56,255,57,58,59,60,61,62,63,98,4,0,0,204,3,0,0,126,4,0,0,0,0,0,0,140,1,0,0,252,0,0,0,232,2,0,0,82,0,0,0,164,1,0,0,112,1,0,0,100,0,0,0,0,0,0,0,140,1,0,0,252,0,0,0,232,2,0,0,82,0,0,0,88,4,0,0,184,3,0,0,34,1,0,0,0,0,0,0,140,1,0,0,252,0,0,0,232,2,0,0,82,0,0,0,172,2,0,0,46,3,0,0,182,3,0,0,0,0,0,0,140,1,0,0,252,0,0,0,232,2,0,0,82,0,0,0,202,0,0,0,78,1,0,0,80,4,0,0,116,2,0,0,140,1,0,0,252,0,0,0,232,2,0,0,82,0,0,0,86,2,0,0,248,1,0,0,152,3,0,0,0,0,0,0,140,1,0,0,252,0,0,0,232,2,0,0,82,0,0,0,234,0,0,0,104,0,0,0,122,4,0,0,0,0,0,0,140,1,0,0,252,0,0,0,232,2,0,0,82,0,0,0,212,3,0,0,108,4,0,0,146,1,0,0,0,0,0,0,140,1,0,0,252,0,0,0,232,2,0,0,82,0,0,0,88,1,0,0,0,0,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,0,0,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,0,0,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,0,0,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,0,0,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,0,0,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,0,0,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,0,0,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,88,1,0,0,90,2,0,0,18,0,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,18,0,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,18,0,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,18,0,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,18,0,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,18,0,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,18,0,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,18,0,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,90,2,0,0,116,3,0,0,56,1,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,56,1,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,56,1,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,56,1,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,56,1,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,56,1,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,56,1,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,56,1,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,116,3,0,0,26,0,0,0,172,3,0,0,24,1,0,0,112,0,0,0,0,0,0,0,0,0,0,0,174,1,0,0,104,2,0,0,160,2,0,0,38,3,0,0,6,4,0,0,242,0,0,0,0,0,0,0,0,0,0,0,174,1,0,0,104,2,0,0,62,3,0,0,192,3,0,0,112,4,0,0,176,3,0,0,0,0,0,0,0,0,0,0,174,1,0,0,104,2,0,0,156,1,0,0,36,1,0,0,96,0,0,0,176,2,0,0,0,0,0,0,0,0,0,0,174,1,0,0,104,2,0,0,18,2,0,0,122,1,0,0,230,0,0,0,206,2,0,0,0,0,0,0,0,0,0,0,174,1,0,0,100,4,0,0,72,0,0,0,240,0,0,0,130,2,0,0,104,4,0,0,0,0,0,0,0,0,0,0,174,1,0,0,104,2,0,0,0,0,0,0,0,0,0,0,124,4,0,0,36,4,0,0,0,0,0,0,0,0,0,0,174,1,0,0,104,2,0,0,0,0,0,0,216,2,0,0,78,0,0,0,236,2,0,0,0,0,0,0,0,0,0,0,174,1,0,0,104,2,0,0,178,2,0,0,22,2,0,0,204,0,0,0,128,0,0,0,30,4,0,0,140,3,0,0,196,2,0,0,74,1,0,0,178,2,0,0,22,2,0,0,204,0,0,0,244,2,0,0,30,4,0,0,140,3,0,0,196,2,0,0,120,2,0,0,178,2,0,0,22,2,0,0,204,0,0,0,170,1,0,0,30,4,0,0,140,3,0,0,196,2,0,0,154,2,0,0,178,2,0,0,22,2,0,0,204,0,0,0,244,3,0,0,30,4,0,0,140,3,0,0,196,2,0,0,168,3,0,0,178,2,0,0,22,2,0,0,204,0,0,0,58,4,0,0,30,4,0,0,140,3,0,0,196,2,0,0,74,3,0,0,178,2,0,0,22,2,0,0,204,0,0,0,194,0,0,0,30,4,0,0,140,3,0,0,196,2,0,0,234,1,0,0,178,2,0,0,22,2,0,0,204,0,0,0,166,1,0,0,30,4,0,0,140,3,0,0,196,2,0,0,20,1,0,0,178,2,0,0,22,2,0,0,204,0,0,0,244,1,0,0,30,4,0,0,140,3,0,0,196,2,0,0,90,3,0,0,2,4,0,0,2,4,0,0,2,4,0,0,2,4,0,0,138,2,0,0,138,2,0,0,138,2,0,0,138,2,0,0,22,1,0,0,22,1,0,0,22,1,0,0,22,1,0,0,50,4,0,0,50,4,0,0,50,4,0,0,50,4,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,194,3,0,0,194,3,0,0,194,3,0,0,194,3,0,0,108,2,0,0,108,2,0,0,108,2,0,0,108,2,0,0,208,0,0,0,208,0,0,0,208,0,0,0,208,0,0,0,246,1,0,0,246,1,0,0,246,1,0,0,246,1,0,0,146,0,0,0,146,0,0,0,146,0,0,0,146,0,0,0,20,4,0,0,20,4,0,0,20,4,0,0,20,4,0,0,174,2,0,0,174,2,0,0,174,2,0,0,174,2,0,0,38,1,0,0,38,1,0,0,38,1,0,0,38,1,0,0,94,1,0,0,94,1,0,0,94,1,0,0,94,1,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,6,3,0,0,6,3,0,0,6,3,0,0,6,3,0,0,4,2,0,0,4,2,0,0,4,2,0,0,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,2,0,0,4,2,0,0,4,2,0,0,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,2,0,0,4,2,0,0,4,2,0,0,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,2,0,0,4,2,0,0,4,2,0,0,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,2,0,0,4,2,0,0,4,2,0,0,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,2,0,0,4,2,0,0,4,2,0,0,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,2,0,0,4,2,0,0,4,2,0,0,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,2,0,0,4,2,0,0,4,2,0,0,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,54,2,0,0,198,2,0,0,16,1,0,0,118,3,0,0,188,0,0,0,74,0,0,0,76,4,0,0,32,4,0,0,54,2,0,0,198,2,0,0,16,1,0,0,118,3,0,0,188,0,0,0,74,0,0,0,76,4,0,0,32,4,0,0,54,2,0,0,198,2,0,0,16,1,0,0,118,3,0,0,188,0,0,0,74,0,0,0,76,4,0,0,32,4,0,0,54,2,0,0,198,2,0,0,16,1,0,0,118,3,0,0,188,0,0,0,74,0,0,0,76,4,0,0,32,4,0,0,54,2,0,0,198,2,0,0,16,1,0,0,118,3,0,0,188,0,0,0,74,0,0,0,76,4,0,0,32,4,0,0,54,2,0,0,198,2,0,0,16,1,0,0,118,3,0,0,188,0,0,0,74,0,0,0,76,4,0,0,32,4,0,0,54,2,0,0,198,2,0,0,16,1,0,0,118,3,0,0,188,0,0,0,74,0,0,0,76,4,0,0,32,4,0,0,54,2,0,0,198,2,0,0,16,1,0,0,118,3,0,0,188,0,0,0,74,0,0,0,76,4,0,0,32,4,0,0,214,3,0,0,110,4,0,0,98,0,0,0,252,1,0,0,180,0,0,0,62,1,0,0,210,1,0,0,184,1,0,0,214,3,0,0,110,4,0,0,98,0,0,0,252,1,0,0,180,0,0,0,62,1,0,0,210,1,0,0,184,1,0,0,214,3,0,0,110,4,0,0,98,0,0,0,252,1,0,0,180,0,0,0,62,1,0,0,210,1,0,0,184,1,0,0,214,3,0,0,110,4,0,0,98,0,0,0,252,1,0,0,180,0,0,0,62,1,0,0,210,1,0,0,184,1,0,0,214,3,0,0,110,4,0,0,98,0,0,0,252,1,0,0,180,0,0,0,62,1,0,0,210,1,0,0,184,1,0,0,214,3,0,0,110,4,0,0,98,0,0,0,252,1,0,0,180,0,0,0,62,1,0,0,210,1,0,0,184,1,0,0,214,3,0,0,110,4,0,0,98,0,0,0,252,1,0,0,180,0,0,0,62,1,0,0,210,1,0,0,184,1,0,0,214,3,0,0,110,4,0,0,98,0,0,0,252,1,0,0,180,0,0,0,62,1,0,0,210,1,0,0,184,1,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,54,3,0,0,200,3,0,0,106,4,0,0,60,4,0,0,208,1,0,0,88,2,0,0,72,4,0,0,130,0,0,0,54,3,0,0,200,3,0,0,106,4,0,0,60,4,0,0,208,1,0,0,88,2,0,0,72,4,0,0,130,0,0,0,54,3,0,0,200,3,0,0,106,4,0,0,60,4,0,0,208,1,0,0,88,2,0,0,72,4,0,0,130,0,0,0,54,3,0,0,200,3,0,0,106,4,0,0,60,4,0,0,208,1,0,0,88,2,0,0,72,4,0,0,130,0,0,0,54,3,0,0,200,3,0,0,106,4,0,0,60,4,0,0,208,1,0,0,88,2,0,0,72,4,0,0,130,0,0,0,54,3,0,0,200,3,0,0,106,4,0,0,60,4,0,0,208,1,0,0,88,2,0,0,72,4,0,0,130,0,0,0,54,3,0,0,200,3,0,0,106,4,0,0,60,4,0,0,208,1,0,0,88,2,0,0,72,4,0,0,130,0,0,0,54,3,0,0,200,3,0,0,106,4,0,0,60,4,0,0,208,1,0,0,88,2,0,0,72,4,0,0,130,0,0,0,76,1,0,0,220,1,0,0,80,0,0,0,92,4,0,0,204,2,0,0,58,2,0,0,224,3,0,0,24,4,0,0,76,1,0,0,220,1,0,0,80,0,0,0,92,4,0,0,204,2,0,0,58,2,0,0,224,3,0,0,24,4,0,0,76,1,0,0,220,1,0,0,80,0,0,0,92,4,0,0,204,2,0,0,58,2,0,0,224,3,0,0,24,4,0,0,76,1,0,0,220,1,0,0,80,0,0,0,92,4,0,0,204,2,0,0,58,2,0,0,224,3,0,0,24,4,0,0,76,1,0,0,220,1,0,0,80,0,0,0,92,4,0,0,204,2,0,0,58,2,0,0,224,3,0,0,24,4,0,0,76,1,0,0,220,1,0,0,80,0,0,0,92,4,0,0,204,2,0,0,58,2,0,0,224,3,0,0,24,4,0,0,76,1,0,0,220,1,0,0,80,0,0,0,92,4,0,0,204,2,0,0,58,2,0,0,224,3,0,0,24,4,0,0,76,1,0,0,220,1,0,0,80,0,0,0,92,4,0,0,204,2,0,0,58,2,0,0,224,3,0,0,24,4,0,0,32,3,0,0,166,2,0,0,30,0,0,0,84,0,0,0,182,1,0,0,146,2,0,0,120,1,0,0,132,0,0,0,32,3,0,0,166,2,0,0,30,0,0,0,84,0,0,0,182,1,0,0,146,2,0,0,120,1,0,0,132,0,0,0,32,3,0,0,166,2,0,0,30,0,0,0,84,0,0,0,182,1,0,0,146,2,0,0,120,1,0,0,132,0,0,0,32,3,0,0,166,2,0,0,30,0,0,0,84,0,0,0,182,1,0,0,146,2,0,0,120,1,0,0,132,0,0,0,32,3,0,0,166,2,0,0,30,0,0,0,84,0,0,0,182,1,0,0,146,2,0,0,120,1,0,0,132,0,0,0,32,3,0,0,166,2,0,0,30,0,0,0,84,0,0,0,182,1,0,0,146,2,0,0,120,1,0,0,132,0,0,0,32,3,0,0,166,2,0,0,30,0,0,0,84,0,0,0,182,1,0,0,146,2,0,0,120,1,0,0,132,0,0,0,32,3,0,0,166,2,0,0,30,0,0,0,84,0,0,0,182,1,0,0,146,2,0,0,120,1,0,0,132,0,0,0,134,1,0,0,244,0,0,0,58,0,0,0,94,0,0,0,242,2,0,0,50,2,0,0,148,1,0,0,14,4,0,0,134,1,0,0,244,0,0,0,58,0,0,0,100,2,0,0,242,2,0,0,50,2,0,0,148,1,0,0,110,0,0,0,134,1,0,0,244,0,0,0,58,0,0,0,118,1,0,0,242,2,0,0,50,2,0,0,148,1,0,0,178,0,0,0,134,1,0,0,244,0,0,0,58,0,0,0,186,3,0,0,242,2,0,0,50,2,0,0,148,1,0,0,202,1,0,0,134,1,0,0,244,0,0,0,58,0,0,0,0,0,0,0,242,2,0,0,50,2,0,0,148,1,0,0,0,0,0,0,134,1,0,0,244,0,0,0,58,0,0,0,0,0,0,0,242,2,0,0,50,2,0,0,148,1,0,0,0,0,0,0,134,1,0,0,244,0,0,0,58,0,0,0,0,0,0,0,242,2,0,0,50,2,0,0,148,1,0,0,0,0,0,0,134,1,0,0,244,0,0,0,58,0,0,0,0,0,0,0,242,2,0,0,50,2,0,0,148,1,0,0,0,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,48,1,0,0,48,1,0,0,48,1,0,0,48,1,0,0,48,1,0,0,48,1,0,0,48,1,0,0,48,1,0,0,246,0,0,0,246,0,0,0,246,0,0,0,246,0,0,0,246,0,0,0,246,0,0,0,246,0,0,0,246,0,0,0,148,0,0,0,148,0,0,0,148,0,0,0,148,0,0,0,148,0,0,0,148,0,0,0,148,0,0,0,148,0,0,0,200,2,0,0,200,2,0,0,200,2,0,0,200,2,0,0,200,2,0,0,200,2,0,0,200,2,0,0,194,1,0,0,34,2,0,0,34,2,0,0,34,2,0,0,34,2,0,0,34,2,0,0,34,2,0,0,34,2,0,0,14,3,0,0,164,0,0,0,164,0,0,0,164,0,0,0,164,0,0,0,164,0,0,0,164,0,0,0,164,0,0,0,164,0,0,0,112,2,0,0,112,2,0,0,112,2,0,0,112,2,0,0,112,2,0,0,112,2,0,0,112,2,0,0,112,2,0,0,144,2,0,0,142,2,0,0,196,3,0,0,198,3,0,0,18,1,0,0,214,2,0,0,214,2,0,0,214,2,0,0,164,3,0,0,226,2,0,0,94,2,0,0,0,1,0,0,70,2,0,0,168,1,0,0,214,0,0,0,60,0,0,0,116,0,0,0,60,1,0,0,214,1,0,0,104,3,0,0,70,2,0,0,168,1,0,0,214,0,0,0,60,0,0,0,42,0,0,0,166,0,0,0,44,1,0,0,62,2,0,0,70,2,0,0,168,1,0,0,214,0,0,0,60,0,0,0,176,1,0,0,46,1,0,0,24,3,0,0,80,1,0,0,70,2,0,0,168,1,0,0,214,0,0,0,60,0,0,0,32,1,0,0,142,0,0,0,52,2,0,0,242,1,0,0,70,2,0,0,168,1,0,0,214,0,0,0,60,0,0,0,238,2,0,0,102,2,0,0,212,1,0,0,80,1,0,0,70,2,0,0,168,1,0,0,214,0,0,0,60,0,0,0,28,0,0,0,250,3,0,0,8,1,0,0,80,1,0,0,70,2,0,0,168,1,0,0,214,0,0,0,60,0,0,0,226,3,0,0,56,0,0,0,172,0,0,0,116,4,0,0,70,2,0,0,168,1,0,0,214,0,0,0,60,0,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,100,1,0,0,118,4,0,0,208,3,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,208,3,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,208,3,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,208,3,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,208,3,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,208,3,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,208,3,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,208,3,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,118,4,0,0,98,2,0,0,218,1,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,218,1,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,218,1,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,218,1,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,218,1,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,218,1,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,218,1,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,218,1,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,98,2,0,0,248,3,0,0,108,0,0,0,0,3,0,0,218,0,0,0,80,1,0,0,80,1,0,0,152,1,0,0,196,1,0,0,136,1,0,0,192,0,0,0,64,0,0,0,254,1,0,0,80,1,0,0,80,1,0,0,152,1,0,0,196,1,0,0,224,2,0,0,76,2,0,0,68,4,0,0,28,4,0,0,80,1,0,0,80,1,0,0,152,1,0,0,196,1,0,0,88,0,0,0,6,1,0,0,108,3,0,0,176,0,0,0,80,1,0,0,80,1,0,0,152,1,0,0,196,1,0,0,24,2,0,0,180,2,0,0,50,3,0,0,8,3,0,0,80,1,0,0,80,1,0,0,152,1,0,0,236,3,0,0,2,2,0,0,162,2,0,0,236,0,0,0,196,0,0,0,80,1,0,0,80,1,0,0,152,1,0,0,196,1,0,0,156,3,0,0,56,4,0,0,180,1,0,0,52,3,0,0,80,1,0,0,80,1,0,0,152,1,0,0,196,1,0,0,80,1,0,0,76,0,0,0,38,2,0,0,116,4,0,0,80,1,0,0,80,1,0,0,152,1,0,0,196,1,0,0,40,2,0,0,192,2,0,0,136,3,0,0,206,0,0,0,4,4,0,0,36,3,0,0,158,2,0,0,206,0,0,0,40,2,0,0,192,2,0,0,136,3,0,0,206,0,0,0,4,4,0,0,36,3,0,0,158,2,0,0,206,0,0,0,40,2,0,0,192,2,0,0,136,3,0,0,206,0,0,0,4,4,0,0,36,3,0,0,158,2,0,0,206,0,0,0,40,2,0,0,192,2,0,0,136,3,0,0,206,0,0,0,4,4,0,0,36,3,0,0,158,2,0,0,206,0,0,0,40,2,0,0,192,2,0,0,136,3,0,0,206,0,0,0,4,4,0,0,36,3,0,0,158,2,0,0,206,0,0,0,40,2,0,0,192,2,0,0,136,3,0,0,206,0,0,0,4,4,0,0,36,3,0,0,158,2,0,0,206,0,0,0,40,2,0,0,192,2,0,0,136,3,0,0,206,0,0,0,4,4,0,0,36,3,0,0,158,2,0,0,206,0,0,0,40,2,0,0,192,2,0,0,136,3,0,0,206,0,0,0,4,4,0,0,36,3,0,0,158,2,0,0,206,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,144,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,80,1,0,0,80,1,0,0,80,1,0,0,80,1,0,0,200,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,80,1,0,0,80,1,0,0,80,1,0,0,80,1,0,0,200,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,80,1,0,0,80,1,0,0,80,1,0,0,80,1,0,0,200,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,80,1,0,0,80,1,0,0,80,1,0,0,80,1,0,0,200,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,80,1,0,0,80,1,0,0,80,1,0,0,80,1,0,0,200,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,80,1,0,0,80,1,0,0,80,1,0,0,80,1,0,0,200,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,80,1,0,0,80,1,0,0,80,1,0,0,80,1,0,0,200,0,0,0,200,0,0,0,200,0,0,0,200,0,0,0,80,1,0,0,80,1,0,0,80,1,0,0,80,1,0,0,230,2,0,0,2,1,0,0,82,4,0,0,126,0,0,0,96,1,0,0,226,0,0,0,212,2,0,0,78,4,0,0,230,2,0,0,2,1,0,0,82,4,0,0,126,0,0,0,96,1,0,0,226,0,0,0,212,2,0,0,78,4,0,0,230,2,0,0,2,1,0,0,82,4,0,0,126,0,0,0,96,1,0,0,226,0,0,0,212,2,0,0,78,4,0,0,230,2,0,0,2,1,0,0,82,4,0,0,126,0,0,0,96,1,0,0,226,0,0,0,212,2,0,0,78,4,0,0,230,2,0,0,2,1,0,0,82,4,0,0,126,0,0,0,96,1,0,0,226,0,0,0,212,2,0,0,78,4,0,0,230,2,0,0,2,1,0,0,82,4,0,0,126,0,0,0,96,1,0,0,226,0,0,0,212,2,0,0,78,4,0,0,230,2,0,0,2,1,0,0,82,4,0,0,126,0,0,0,96,1,0,0,226,0,0,0,212,2,0,0,78,4,0,0,230,2,0,0,2,1,0,0,82,4,0,0,126,0,0,0,96,1,0,0,226,0,0,0,212,2,0,0,78,4,0,0,158,3,0,0,120,0,0,0,12,0,0,0,160,0,0,0,124,2,0,0,70,3,0,0,68,1,0,0,48,3,0,0,158,3,0,0,120,0,0,0,12,0,0,0,160,0,0,0,124,2,0,0,70,3,0,0,68,1,0,0,48,3,0,0,158,3,0,0,120,0,0,0,12,0,0,0,160,0,0,0,124,2,0,0,70,3,0,0,68,1,0,0,48,3,0,0,158,3,0,0,120,0,0,0,12,0,0,0,160,0,0,0,124,2,0,0,70,3,0,0,68,1,0,0,48,3,0,0,158,3,0,0,120,0,0,0,12,0,0,0,160,0,0,0,124,2,0,0,70,3,0,0,68,1,0,0,48,3,0,0,158,3,0,0,120,0,0,0,12,0,0,0,160,0,0,0,124,2,0,0,70,3,0,0,68,1,0,0,48,3,0,0,158,3,0,0,120,0,0,0,12,0,0,0,160,0,0,0,124,2,0,0,70,3,0,0,68,1,0,0,48,3,0,0,158,3,0,0,120,0,0,0,12,0,0,0,160,0,0,0,124,2,0,0,70,3,0,0,68,1,0,0,48,3,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,92,2,0,0,184,0,0,0,4,0,0,0,218,3,0,0,250,2,0,0,112,3,0,0,12,4,0,0,90,0,0,0,240,2,0,0,184,0,0,0,4,0,0,0,218,3,0,0,250,2,0,0,112,3,0,0,12,4,0,0,90,0,0,0,240,2,0,0,184,0,0,0,4,0,0,0,218,3,0,0,250,2,0,0,112,3,0,0,12,4,0,0,90,0,0,0,240,2,0,0,184,0,0,0,4,0,0,0,218,3,0,0,250,2,0,0,112,3,0,0,12,4,0,0,90,0,0,0,240,2,0,0,184,0,0,0,4,0,0,0,218,3,0,0,250,2,0,0,112,3,0,0,12,4,0,0,90,0,0,0,240,2,0,0,184,0,0,0,4,0,0,0,218,3,0,0,250,2,0,0,112,3,0,0,12,4,0,0,90,0,0,0,240,2,0,0,184,0,0,0,4,0,0,0,218,3,0,0,250,2,0,0,112,3,0,0,12,4,0,0,90,0,0,0,240,2,0,0,184,0,0,0,4,0,0,0,218,3,0,0,250,2,0,0,112,3,0,0,12,4,0,0,90,0,0,0,240,2,0,0,64,3,0,0,126,2,0,0,44,4,0,0,234,2,0,0,6,0,0,0,220,3,0,0,52,1,0,0,230,1,0,0,64,3,0,0,126,2,0,0,44,4,0,0,234,2,0,0,6,0,0,0,220,3,0,0,52,1,0,0,230,1,0,0,64,3,0,0,126,2,0,0,44,4,0,0,234,2,0,0,6,0,0,0,220,3,0,0,52,1,0,0,230,1,0,0,64,3,0,0,126,2,0,0,44,4,0,0,234,2,0,0,6,0,0,0,220,3,0,0,52,1,0,0,230,1,0,0,64,3,0,0,126,2,0,0,44,4,0,0,234,2,0,0,6,0,0,0,220,3,0,0,52,1,0,0,230,1,0,0,64,3,0,0,126,2,0,0,44,4,0,0,234,2,0,0,6,0,0,0,220,3,0,0,52,1,0,0,230,1,0,0,64,3,0,0,126,2,0,0,44,4,0,0,234,2,0,0,6,0,0,0,220,3,0,0,52,1,0,0,230,1,0,0,64,3,0,0,126,2,0,0,44,4,0,0,234,2,0,0,6,0,0,0,220,3,0,0,52,1,0,0,230,1,0,0,10,3,0,0,144,3,0,0,238,1,0,0,140,0,0,0,138,1,0,0,46,2,0,0,136,0,0,0,18,4,0,0,10,3,0,0,144,3,0,0,238,1,0,0,140,0,0,0,138,1,0,0,46,2,0,0,136,0,0,0,18,4,0,0,10,3,0,0,144,3,0,0,238,1,0,0,140,0,0,0,138,1,0,0,46,2,0,0,136,0,0,0,18,4,0,0,10,3,0,0,144,3,0,0,238,1,0,0,140,0,0,0,138,1,0,0,46,2,0,0,136,0,0,0,18,4,0,0,10,3,0,0,144,3,0,0,238,1,0,0,140,0,0,0,138,1,0,0,46,2,0,0,136,0,0,0,18,4,0,0,10,3,0,0,144,3,0,0,238,1,0,0,140,0,0,0,138,1,0,0,46,2,0,0,136,0,0,0,18,4,0,0,10,3,0,0,144,3,0,0,238,1,0,0,140,0,0,0,138,1,0,0,46,2,0,0,136,0,0,0,18,4,0,0,10,3,0,0,144,3,0,0,238,1,0,0,140,0,0,0,138,1,0,0,46,2,0,0,136,0,0,0,18,4,0,0,12,1,0,0,144,1,0,0,48,2,0,0,170,0,0,0,164,2,0,0,12,2,0,0,108,1,0,0,60,3,0,0,12,1,0,0,144,1,0,0,48,2,0,0,202,2,0,0,164,2,0,0,12,2,0,0,108,1,0,0,36,2,0,0,12,1,0,0,144,1,0,0,48,2,0,0,16,4,0,0,164,2,0,0,12,2,0,0,108,1,0,0,16,2,0,0,12,1,0,0,144,1,0,0,48,2,0,0,206,1,0,0,164,2,0,0,12,2,0,0,108,1,0,0,222,0,0,0,12,1,0,0,144,1,0,0,48,2,0,0,132,1,0,0,164,2,0,0,12,2,0,0,108,1,0,0,254,0,0,0,12,1,0,0,144,1,0,0,48,2,0,0,8,4,0,0,164,2,0,0,12,2,0,0,108,1,0,0,188,3,0,0,12,1,0,0,144,1,0,0,48,2,0,0,220,2,0,0,164,2,0,0,12,2,0,0,108,1,0,0,80,1,0,0,12,1,0,0,144,1,0,0,48,2,0,0,182,2,0,0,164,2,0,0,12,2,0,0,108,1,0,0,114,2,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,180,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,1,0,0,216,3,0,0,188,1,0,0,0,0,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,210,0,0,0,142,3,0,0,0,0,0,0,0,0,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,106,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,158,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,110,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,106,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,110,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,222,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,142,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,222,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,2,0,0,186,2,0,0,186,2,0,0,186,2,0,0,186,2,0,0,90,4,0,0,90,4,0,0,90,4,0,0,90,4,0,0,52,4,0,0,52,4,0,0,52,4,0,0,52,4,0,0,158,0,0,0,158,0,0,0,158,0,0,0,158,0,0,0,154,1,0,0,154,1,0,0,154,1,0,0,154,1,0,0,152,2,0,0,152,2,0,0,152,2,0,0,152,2,0,0,128,1,0,0,128,1,0,0,128,1,0,0,128,1,0,0,92,3,0,0,92,3,0,0,92,3,0,0,92,3,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,94,3,0,0,94,3,0,0,94,3,0,0,94,3,0,0,238,3,0,0,238,3,0,0,238,3,0,0,238,3,0,0,80,2,0,0,80,2,0,0,80,2,0,0,80,2,0,0,132,3,0,0,132,3,0,0,132,3,0,0,132,3,0,0,162,0,0,0,162,0,0,0,162,0,0,0,162,0,0,0,218,2,0,0,218,2,0,0,218,2,0,0,218,2,0,0,80,3,0,0,80,3,0,0,80,3,0,0,80,3], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+20480);
/* memory initializer */ allocate([78,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,162,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,204,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,194,0,0,106,0,0,0,200,179,0,0,106,0,0,0,48,166,0,0,224,1,0,0,0,0,0,0,0,0,0,0,48,214,0,0,146,3,0,0,64,222,0,0,150,3,0,0,152,196,0,0,56,3,0,0,208,180,0,0,56,3,0,0,216,166,0,0,148,3,0,0,192,154,0,0,182,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,80,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,80,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,178,5,0,81,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,196,5,0,82,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,214,5,0,83,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,64,6,0,80,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,84,6,0,81,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,104,6,0,82,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,124,6,0,83,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,224,6,0,80,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,246,6,0,81,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,12,7,0,82,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,34,7,0,83,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,100,11,0,81,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,136,11,0,82,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,172,11,0,83,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,168,12,0,81,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,208,12,0,82,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,248,12,0,83,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,13,0,80,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,236,13,0,81,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,24,14,0,82,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,68,14,0,83,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,2,0,40,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,208,2,0,40,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,5,0,40,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,40,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,18,0,80,0,0,0,2,0,0,0,15,0,0,0,0,2,0,0,2,128,0,0,0,128,22,0,80,0,0,0,2,0,0,0,18,0,0,0,0,2,0,0,2,128,0,0,0,0,45,0,80,0,0,0,2,0,0,0,36,0,0,0,0,2,0,0,2,128,0,0,0,64,19,0,77,0,0,0,2,0,0,0,8,0,0,0,0,4,0,0,2,128,0,0,0,233,3,0,77,0,0,0,1,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,210,7,0,77,0,0,0,2,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,66,85,83,69,0,0,0,0,67,77,80,46,76,0,0,0,83,116,97,99,107,83,112,97,99,101,0,0,0,0,0,0,83,116,97,114,116,82,105,103,104,116,0,0,0,0,0,0,110,111,110,101,0,0,0,0,42,42,42,32,82,65,77,32,110,111,116,32,102,111,117,110,100,32,97,116,32,48,48,48,48,48,48,10,0,0,0,0,67,77,80,65,46,87,0,0,77,111,118,101,72,72,105,0,83,117,112,101,114,82,105,103,104,116,0,0,0,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,99,112,117,32,109,111,100,101,108,32,40,37,115,41,10,0,0,0,0,0,69,79,82,46,66,0,0,0,77,97,120,65,112,112,108,90,111,110,101,0,0,0,0,0,45,40,65,37,117,41,0,0,77,101,116,97,82,105,103,104,116,0,0,0,0,0,0,0,109,111,100,101,108,61,37,115,32,115,112,101,101,100,61,37,100,10,0,0,0,0,0,0,67,77,80,77,46,66,0,0,80,117,114,103,101,83,112,97,99,101,0,0,0,0,0,0,65,108,116,82,105,103,104,116,0,0,0,0,0,0,0,0,67,80,85,58,0,0,0,0,69,79,82,46,87,0,0,0,77,97,120,66,108,111,99,107,0,0,0,0,0,0,0,0,83,112,97,99,101,0,0,0,115,112,101,101,100,0,0,0,67,77,80,77,46,87,0,0,72,70,83,68,105,115,112,97,116,99,104,0,0,0,0,0,68,101,108,101,116,101,0,0,65,108,116,0,0,0,0,0,99,112,117,0,0,0,0,0,115,111,110,121,58,32,99,104,115,32,101,114,114,111,114,32,40,98,108,107,61,37,108,117,44,32,108,98,97,61,37,108,117,41,10,0,0,0,0,0,69,79,82,46,76,0,0,0,78,77,82,101,109,111,118,101,0,0,0,0,0,0,0,0,115,99,115,105,58,32,114,101,97,100,32,101,114,114,111,114,32,97,116,32,37,108,117,32,43,32,37,108,117,10,0,0,65,108,116,76,101,102,116,0,97,108,116,101,114,110,97,116,101,32,115,111,117,110,100,32,98,117,102,102,101,114,10,0,67,77,80,77,46,76,0,0,101,109,117,46,105,119,109,46,114,111,0,0,0,0,0,0,78,77,73,110,115,116,97,108,108,0,0,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,70,57,0,0,0,0,0,0,33,61,0,0,0,0,0,0,77,111,100,101,0,0,0,0,123,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,98,105,110,0,0,0,0,0,109,97,105,110,32,115,111,117,110,100,32,98,117,102,102,101,114,10,0,0,0,0,0,0,109,111,117,115,101,95,109,117,108,95,120,0,0,0,0,0,97,100,100,114,61,48,120,37,48,56,108,120,32,115,105,122,101,61,37,108,117,32,102,105,108,101,61,37,115,10,0,0,34,10,0,0,0,0,0,0,104,0,0,0,0,0,0,0,45,45,37,115,0,0,0,0,67,77,80,65,46,76,0,0,101,120,112,101,99,116,105,110,103,32,101,120,112,114,101,115,115,105,111,110,0,0,0,0,116,100,48,58,32,100,114,111,112,112,105,110,103,32,112,104,97,110,116,111,109,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,10,0,0,82,101,108,101,97,115,101,32,51,46,48,55,36,48,0,0,83,119,97,112,77,77,85,77,111,100,101,0,0,0,0,0,46,114,97,119,0,0,0,0,79,0,0,0,0,0,0,0,87,105,110,100,111,119,115,76,101,102,116,0,0,0,0,0,97,108,116,101,114,110,97,116,101,32,118,105,100,101,111,32,98,117,102,102,101,114,10,0,118,105,100,101,111,0,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,77,85,76,85,46,87,0,0,77,101,109,111,114,121,68,105,115,112,97,116,99,104,0,0,83,116,97,114,116,76,101,102,116,0,0,0,0,0,0,0,109,97,105,110,32,118,105,100,101,111,32,98,117,102,102,101,114,10,0,0,0,0,0,0,103,0,0,0,0,0,0,0,82,83,69,84,0,0,0,0,115,112,101,101,100,58,32,37,117,10,0,0,0,0,0,0,65,78,68,46,66,0,0,0,80,111,119,101,114,79,102,102,0,0,0,0,0,0,0,0,83,117,112,101,114,76,101,102,116,0,0,0,0,0,0,0,86,73,65,58,0,0,0,0,65,66,67,68,46,66,0,0,80,114,105,109,101,84,105,109,101,0,0,0,0,0,0,0,77,101,116,97,0,0,0,0,118,105,97,0,0,0,0,0,65,78,68,46,87,0,0,0,82,109,118,84,105,109,101,0,40,65,37,117,41,43,0,0,77,101,116,97,76,101,102,116,0,0,0,0,0,0,0,0,83,67,67,58,0,0,0,0,65,78,68,46,76,0,0,0,73,110,115,84,105,109,101,0,67,116,114,108,0,0,0,0,115,99,99,0,0,0,0,0,105,103,110,111,114,105,110,103,32,112,99,101,32,107,101,121,58,32,37,48,52,120,32,40,37,115,41,10,0,0,0,0,83,101,116,65,112,112,66,97,115,101,0,0,0,0,0,0,67,116,114,108,76,101,102,116,0,0,0,0,0,0,0,0,42,42,42,32,99,97,110,39,116,32,111,112,101,110,32,100,114,105,118,101,114,32,40,37,115,41,10,0,0,0,0,0,77,85,76,83,46,87,0,0,76,111,119,101,114,84,101,120,116,0,0,0,0,0,0,0,67,114,101,97,116,101,0,0,47,0,0,0,0,0,0,0,42,42,42,32,98,97,100,32,112,111,114,116,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,0,105,119,109,58,32,100,114,105,118,101,32,37,117,32,101,106,101,99,116,10,0,0,0,0,115,111,110,121,58,32,119,114,105,116,101,32,101,114,114,111,114,32,97,116,32,37,117,47,37,117,47,37,117,10,0,0,65,68,68,65,46,87,0,0,83,116,114,105,112,65,100,100,114,101,115,115,0,0,0,0,115,99,115,105,58,32,116,111,111,32,109,97,110,121,32,98,108,111,99,107,115,32,40,37,117,41,10,0,0,0,0,0,83,108,97,115,104,0,0,0,112,111,114,116,61,37,117,32,109,117,108,116,105,99,104,97,114,61,37,117,32,100,114,105,118,101,114,61,37,115,10,0,65,68,68,46,66,0,0,0,101,109,117,46,100,105,115,107,46,114,119,0,0,0,0,0,115,100,108,58,32,98,108,105,116,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,85,112,114,83,116,114,105,110,103,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,70,56,0,0,0,0,0,0,61,61,0,0,0,0,0,0,46,0,0,0,0,0,0,0,115,101,99,116,105,111,110,0,102,0,0,0,0,0,0,0,115,114,101,99,0,0,0,0,83,69,82,73,65,76,58,0,115,99,97,108,101,0,0,0,82,65,77,58,0,0,0,0,99,112,117,46,109,111,100,101,108,32,61,32,34,0,0,0,99,0,0,0,0,0,0,0,32,32,0,0,0,0,0,0,65,68,68,88,46,66,0,0,101,120,112,101,99,116,105,110,103,32,111,102,102,115,101,116,0,0,0,0,0,0,0,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,37,48,50,88,32,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,0,82,101,108,101,97,115,101,32,51,46,48,50,36,48,0,0,46,112,115,105,0,0,0,0,87,114,105,116,101,88,80,114,97,109,0,0,0,0,0,0,78,0,0,0,0,0,0,0,80,101,114,105,111,100,0,0,109,117,108,116,105,99,104,97,114,0,0,0,0,0,0,0,65,68,68,46,87,0,0,0,82,101,97,100,88,80,114,97,109,0,0,0,0,0,0,0,44,0,0,0,0,0,0,0,112,111,114,116,0,0,0,0,114,117,110,32,117,110,116,105,108,32,101,120,99,101,112,116,105,111,110,0,0,0,0,0,115,115,112,0,0,0,0,0,65,68,68,88,46,87,0,0,115,121,115,116,101,109,32,116,111,111,32,115,108,111,119,44,32,115,107,105,112,112,105,110,103,32,49,32,115,101,99,111,110,100,10,0,0,0,0,0,82,101,108,83,116,114,105,110,103,0,0,0,0,0,0,0,67,111,109,109,97,0,0,0,99,111,112,121,32,109,101,109,111,114,121,0,0,0,0,0,115,101,114,105,97,108,0,0,65,68,68,46,76,0,0,0,82,68,114,118,114,73,110,115,116,97,108,108,0,0,0,0,109,0,0,0,0,0,0,0,115,114,99,32,100,115,116,32,99,110,116,0,0,0,0,0,42,42,42,32,114,101,97,100,105,110,103,32,114,116,99,32,102,105,108,101,32,102,97,105,108,101,100,10,0,0,0,0,105,119,109,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,112,114,105,41,10,0,0,0,0,65,68,68,88,46,76,0,0,65,100,100,68,114,105,118,101,0,0,0,0,0,0,0,0,68,0,0,0,0,0,0,0,110,0,0,0,0,0,0,0,101,118,97,108,117,97,116,101,32,101,120,112,114,101,115,115,105,111,110,115,0,0,0,0,60,110,111,119,62,0,0,0,32,68,51,61,37,48,56,108,88,32,32,68,55,61,37,48,56,108,88,32,32,65,51,61,37,48,56,108,88,32,32,65,55,61,37,48,56,108,88,32,32,83,83,80,61,37,48,56,108,88,10,0,0,0,0,0,65,68,68,65,46,76,0,0,80,117,114,103,101,77,101,109,0,0,0,0,0,0,0,0,98,0,0,0,0,0,0,0,91,101,120,112,114,46,46,46,93,0,0,0,0,0,0,0,102,105,108,101,61,37,115,32,114,101,97,108,116,105,109,101,61,37,100,32,115,116,97,114,116,61,37,115,32,114,111,109,100,105,115,107,61,37,100,10,0,0,0,0,0,0,0,0,117,110,104,97,110,100,108,101,100,32,109,97,103,105,99,32,107,101,121,32,40,37,117,41,10,0,0,0,0,0,0,0,32,68,50,61,37,48,56,108,88,32,32,68,54,61,37,48,56,108,88,32,32,65,50,61,37,48,56,108,88,32,32,65,54,61,37,48,56,108,88,32,32,85,83,80,61,37,48,56,108,88,10,0,0,0,0,0,82,79,82,46,66,0,0,0,67,111,109,112,97,99,116,77,101,109,0,0,0,0,0,0,118,0,0,0,0,0,0,0,119,114,105,116,101,32,109,101,109,111,114,121,32,116,111,32,97,32,102,105,108,101,0,0,82,84,67,58,0,0,0,0,32,68,49,61,37,48,56,108,88,32,32,68,53,61,37,48,56,108,88,32,32,65,49,61,37,48,56,108,88,32,32,65,53,61,37,48,56,108,88,32,32,76,80,67,61,37,48,56,108,88,10,0,0,0,0,0,82,79,88,82,46,66,0,0,83,101,116,71,114,111,119,90,111,110,101,0,0,0,0,0,71,101,116,86,111,108,73,110,102,111,0,0,0,0,0,0,99,0,0,0,0,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,110,46,46,46,93,0,0,0,0,0,115,116,97,114,116,0,0,0,37,48,52,88,0,0,0,0,32,68,48,61,37,48,56,108,88,32,32,68,52,61,37,48,56,108,88,32,32,65,48,61,37,48,56,108,88,32,32,65,52,61,37,48,56,108,88,32,32,32,80,67,61,37,48,56,108,88,10,0,0,0,0,0,68,105,97,108,111,103,68,105,115,112,97,116,99,104,0,0,115,111,110,121,58,32,99,111,110,116,114,111,108,58,32,117,110,107,110,111,119,110,32,40,111,112,99,111,100,101,61,48,120,37,48,52,120,41,10,0,76,83,82,46,66,0,0,0,77,111,100,97,108,68,105,97,108,111,103,77,101,110,117,83,101,116,117,112,0,0,0,0,77,101,110,117,67,104,111,105,99,101,0,0,0,0,0,0,83,101,116,77,67,69,110,116,114,105,101,115,0,0,0,0,72,78,111,80,117,114,103,101,0,0,0,0,0,0,0,0,71,101,116,77,67,69,110,116,114,121,0,0,0,0,0,0,68,105,115,112,77,67,69,110,116,114,105,101,115,0,0,0,115,99,115,105,58,32,119,114,105,116,101,32,101,114,114,111,114,10,0,0,0,0,0,0,83,101,116,77,67,73,110,102,111,0,0,0,0,0,0,0,120,0,0,0,0,0,0,0,113,117,105,116,0,0,0,0,71,101,116,77,67,73,110,102,111,0,0,0,0,0,0,0,114,111,109,100,105,115,107,0,68,101,108,77,67,69,110,116,114,105,101,115,0,0,0,0,72,105,103,104,76,101,118,101,108,70,83,68,105,115,112,97,116,99,104,0,0,0,0,0,32,83,82,61,37,48,52,88,91,37,99,37,99,93,32,32,67,67,61,37,48,50,88,91,37,99,37,99,37,99,37,99,37,99,93,32,69,88,61,37,48,50,88,40,37,45,52,115,41,32,84,82,80,61,37,48,52,88,32,73,77,76,61,37,88,32,73,80,76,61,37,88,10,0,0,0,0,0,0,0,67,111,112,121,68,101,101,112,77,97,115,107,0,0,0,0,65,83,82,46,66,0,0,0,83,101,101,100,67,70,105,108,108,0,0,0,0,0,0,0,67,97,108,99,67,77,97,115,107,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,114,111,0,0,0,0,0,83,101,116,83,116,100,67,80,114,111,99,115,0,0,0,0,115,100,108,58,32,107,101,121,32,61,32,48,120,37,48,52,120,10,0,0,0,0,0,0,72,80,117,114,103,101,0,0,68,101,108,67,111,109,112,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,68,101,108,83,101,97,114,99,104,0,0,0,0,0,0,0,70,55,0,0,0,0,0,0,78,101,119,67,68,105,97,108,111,103,0,0,0,0,0,0,38,0,0,0,0,0,0,0,122,0,0,0,0,0,0,0,115,101,110,100,32,97,32,109,101,115,115,97,103,101,32,116,111,32,116,104,101,32,101,109,117,108,97,116,111,114,32,99,111,114,101,0,0,0,0,0,82,101,115,116,111,114,101,69,110,116,114,105,101,115,0,0,114,101,97,108,116,105,109,101,0,0,0,0,0,0,0,0,83,97,118,101,69,110,116,114,105,101,115,0,0,0,0,0,101,0,0,0,0,0,0,0,105,104,120,0,0,0,0,0,71,101,116,67,87,77,103,114,80,111,114,116,0,0,0,0,67,76,75,61,37,108,120,32,32,79,80,61,37,108,120,32,32,68,76,89,61,37,108,117,32,32,67,80,73,61,37,46,52,102,10,0,0,0,0,0,109,105,110,95,104,0,0,0,100,101,102,97,117,108,116,0,10,0,0,0,0,0,0,0,111,102,102,115,101,116,0,0,83,101,116,68,101,115,107,67,80,97,116,0,0,0,0,0,44,32,0,0,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,82,79,82,46,76,0,0,0,58,0,0,0,0,0,0,0,71,101,116,78,101,119,67,87,105,110,100,111,119,0,0,0,116,100,48,58,32,115,101,99,116,111,114,32,99,114,99,32,111,118,101,114,32,104,101,97,100,101,114,43,100,97,116,97,10,0,0,0,0,0,0,0,78,101,119,67,87,105,110,100,111,119,0,0,0,0,0,0,71,101,116,65,117,120,67,116,108,0,0,0,0,0,0,0,99,112,50,58,32,119,97,114,110,105,110,103,58,32,117,110,107,110,111,119,110,32,67,80,50,32,118,101,114,115,105,111,110,10,0,0,0,0,0,0,46,112,102,100,99,0,0,0,80,116,114,90,111,110,101,0,83,101,116,67,116,108,67,111,108,111,114,0,0,0,0,0,71,101,116,65,117,120,87,105,110,0,0,0,0,0,0,0,108,111,103,0,0,0,0,0,83,101,116,87,105,110,67,111,108,111,114,0,0,0,0,0,60,0,0,0,0,0,0,0,109,115,103,32,91,118,97,108,93,0,0,0,0,0,0,0,81,68,69,114,114,111,114,0,112,114,97,109,46,100,97,116,0,0,0,0,0,0,0,0,83,101,116,69,110,116,114,105,101,115,0,0,0,0,0,0,82,101,115,101,114,118,101,69,110,116,114,121,0,0,0,0,54,56,48,48,48,0,0,0,80,114,111,116,101,99,116,69,110,116,114,121,0,0,0,0,82,79,88,82,46,76,0,0,83,101,116,67,108,105,101,110,116,73,68,0,0,0,0,0,65,100,100,67,111,109,112,0,65,100,100,83,101,97,114,99,104,0,0,0,0,0,0,0,83,101,116,84,114,97,112,65,100,100,114,101,115,115,0,0,77,97,107,101,73,84,97,98,108,101,0,0,0,0,0,0,85,112,100,97,116,101,80,105,120,77,97,112,0,0,0,0,71,101,116,83,117,98,84,97,98,108,101,0,0,0,0,0,76,101,115,115,0,0,0,0,114,101,97,100,32,97,32,102,105,108,101,32,105,110,116,111,32,109,101,109,111,114,121,0,82,101,97,108,67,111,108,111,114,0,0,0,0,0,0,0,114,116,99,0,0,0,0,0,73,110,118,101,114,116,67,111,108,111,114,0,0,0,0,0,73,110,100,101,120,50,67,111,108,111,114,0,0,0,0,0,77,69,77,0,0,0,0,0,91,101,120,99,101,112,116,105,111,110,93,0,0,0,0,0,117,115,112,0,0,0,0,0,67,111,108,111,114,50,73,110,100,101,120,0,0,0,0,0,76,83,82,46,76,0,0,0,71,101,116,71,68,101,118,105,99,101,0,0,0,0,0,0,83,101,116,71,68,101,118,105,99,101,0,0,0,0,0,0,109,97,99,58,32,114,101,115,101,116,10,0,0,0,0,0,68,105,115,112,111,115,71,68,101,118,105,99,101,0,0,0,71,101,116,84,114,97,112,65,100,100,114,101,115,115,0,0,78,101,119,71,68,101,118,105,99,101,0,0,0,0,0,0,73,110,105,116,71,68,101,118,105,99,101,0,0,0,0,0,83,101,116,68,101,118,105,99,101,65,116,116,114,105,98,117,116,101,0,0,0,0,0,0,83,104,105,102,116,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,91,110,93,93,0,0,0,0,0,0,84,101,115,116,68,101,118,105,99,101,65,116,116,114,105,98,117,116,101,0,0,0,0,0,109,111,100,101,108,61,37,117,32,105,110,116,101,114,110,97,116,105,111,110,97,108,61,37,100,32,107,101,121,112,97,100,61,37,115,10,0,0,0,0,71,101,116,78,101,120,116,68,101,118,105,99,101,0,0,0,71,101,116,77,97,105,110,68,101,118,105,99,101,0,0,0,87,82,37,48,50,117,65,61,37,48,50,88,32,32,82,82,37,48,50,117,65,61,37,48,50,88,32,32,87,82,37,48,50,117,66,61,37,48,50,88,32,32,82,82,37,48,50,117,66,61,37,48,50,88,10,0,71,101,116,68,101,118,105,99,101,76,105,115,116,0,0,0,65,83,82,46,76,0,0,0,71,101,116,67,84,83,101,101,100,0,0,0,0,0,0,0,71,101,116,77,97,120,68,101,118,105,99,101,0,0,0,0,68,105,115,112,111,115,67,67,117,114,115,111,114,0,0,0,70,108,117,115,104,70,105,108,101,0,0,0,0,0,0,0,68,105,115,112,111,115,67,73,99,111,110,0,0,0,0,0,68,105,115,112,111,115,67,84,97,98,108,101,0,0,0,0,67,104,97,114,69,120,116,114,97,0,0,0,0,0,0,0,83,104,105,102,116,76,101,102,116,0,0,0,0,0,0,0,112,114,105,110,116,32,104,101,108,112,0,0,0,0,0,0,72,105,108,105,116,101,67,111,108,111,114,0,0,0,0,0,75,69,89,66,79,65,82,68,58,0,0,0,0,0,0,0,79,112,67,111,108,111,114,0,80,108,111,116,67,73,99,111,110,0,0,0,0,0,0,0,32,32,73,82,81,61,37,117,10,0,0,0,0,0,0,0,71,101,116,67,73,99,111,110,0,0,0,0,0,0,0,0,65,83,82,46,87,0,0,0,65,108,108,111,99,67,117,114,115,111,114,0,0,0,0,0,83,101,116,67,67,117,114,115,111,114,0,0,0,0,0,0,71,101,116,67,67,117,114,115,111,114,0,0,0,0,0,0,83,101,116,70,80,111,115,0,71,101,116,66,97,99,107,67,111,108,111,114,0,0,0,0,65,0,0,0,0,0,0,0,71,101,116,70,111,114,101,67,111,108,111,114,0,0,0,0,71,101,116,67,84,97,98,108,101,0,0,0,0,0,0,0,92,0,0,0,0,0,0,0,102,105,110,100,32,98,121,116,101,115,32,105,110,32,109,101,109,111,114,121,0,0,0,0,71,101,116,67,80,105,120,101,108,0,0,0,0,0,0,0,105,110,116,108,0,0,0,0,83,101,116,67,80,105,120,101,108,0,0,0,0,0,0,0,82,71,66,66,97,99,107,67,111,108,111,114,0,0,0,0,56,53,51,48,45,83,67,67,0,0,0,0,0,0,0,0,82,71,66,70,111,114,101,67,111,108,111,114,0,0,0,0,82,79,76,46,66,0,0,0,70,105,108,108,67,80,111,108,121,0,0,0,0,0,0,0,70,105,108,108,67,82,103,110,0,0,0,0,0,0,0,0,70,105,108,108,67,65,114,99,0,0,0,0,0,0,0,0,83,101,116,70,105,108,84,121,112,101,0,0,0,0,0,0,70,105,108,108,67,82,111,117,110,100,82,101,99,116,0,0,70,105,108,108,67,79,118,97,108,0,0,0,0,0,0,0,70,105,108,108,67,82,101,99,116,0,0,0,0,0,0,0,66,97,99,107,115,108,97,115,104,0,0,0,0,0,0,0,97,100,100,114,32,99,110,116,32,91,118,97,108,46,46,46,93,0,0,0,0,0,0,0,77,97,107,101,82,71,66,80,97,116,0,0,0,0,0,0,109,111,100,101,108,0,0,0,71,101,116,80,105,120,80,97,116,0,0,0,0,0,0,0,66,97,99,107,80,105,120,80,97,116,0,0,0,0,0,0,32,32,80,65,61,37,48,50,88,32,32,32,80,66,61,37,48,50,88,32,32,67,66,50,61,37,88,32,32,37,99,84,50,86,61,37,48,52,88,10,0,0,0,0,0,0,0,0,80,101,110,80,105,120,80,97,116,0,0,0,0,0,0,0,107,101,121,112,97,100,32,109,111,100,101,58,32,107,101,121,112,97,100,10,0,0,0,0,82,79,88,76,46,66,0,0,67,111,112,121,80,105,120,80,97,116,0,0,0,0,0,0,68,105,115,112,111,115,80,105,120,80,97,116,0,0,0,0,78,101,119,80,105,120,80,97,116,0,0,0,0,0,0,0,83,101,116,67,80,111,114,116,80,105,120,0,0,0,0,0,82,115,116,70,105,108,76,111,99,107,0,0,0,0,0,0,67,111,112,121,80,105,120,77,97,112,0,0,0,0,0,0,68,105,115,112,111,115,80,105,120,77,97,112,0,0,0,0,39,0,0,0,0,0,0,0,101,110,116,101,114,32,98,121,116,101,115,32,105,110,116,111,32,109,101,109,111,114,121,0,78,101,119,80,105,120,77,97,112,0,0,0,0,0,0,0,107,101,121,112,97,100,0,0,73,110,105,116,67,112,111,114,116,0,0,0,0,0,0,0,79,112,101,110,67,112,111,114,116,0,0,0,0,0,0,0,32,79,82,65,61,37,48,50,88,32,32,79,82,66,61,37,48,50,88,32,32,67,66,49,61,37,88,32,32,32,84,50,76,61,37,48,52,88,10,0,68,101,98,117,103,103,101,114,0,0,0,0,0,0,0,0,76,83,76,46,66,0,0,0,80,117,116,83,99,114,97,112,0,0,0,0,0,0,0,0,71,101,116,83,99,114,97,112,0,0,0,0,0,0,0,0,90,101,114,111,83,99,114,97,112,0,0,0,0,0,0,0,76,111,100,101,83,99,114,97,112,0,0,0,0,0,0,0,83,101,116,70,105,108,76,111,99,107,0,0,0,0,0,0,75,105,108,108,73,79,0,0,85,110,108,111,100,101,83,99,114,97,112,0,0,0,0,0,73,110,102,111,83,99,114,97,112,0,0,0,0,0,0,0,65,112,111,115,116,114,111,112,104,101,0,0,0,0,0,0,97,100,100,114,32,91,118,97,108,124,115,116,114,105,110,103,46,46,46,93,0,0,0,0,77,101,116,104,111,100,68,105,115,112,97,116,99,104,0,0,109,111,116,105,111,110,0,0,83,101,116,82,101,115,70,105,108,101,65,116,116,114,115,0,71,101,116,82,101,115,70,105,108,101,65,116,116,114,115,0,32,73,82,65,61,37,48,50,88,32,32,73,82,66,61,37,48,50,88,32,32,67,65,50,61,37,88,32,32,37,99,84,49,86,61,37,48,52,88,10,0,0,0,0,0,0,0,0,71,101,116,65,112,112,80,97,114,109,115,0,0,0,0,0,115,111,110,121,58,32,115,116,97,116,117,115,58,32,117,110,107,110,111,119,110,32,40,99,115,61,48,120,37,48,52,120,41,10,0,0,0,0,0,0,65,83,76,46,66,0,0,0,69,120,105,116,84,111,83,104,101,108,108,0,0,0,0,0,67,104,97,105,110,0,0,0,76,97,117,110,99,104,0,0,85,110,108,111,97,100,83,101,103,0,0,0,0,0,0,0,82,101,115,114,118,77,101,109,0,0,0,0,0,0,0,0,76,111,97,100,83,101,103,0,115,99,115,105,58,32,119,114,105,116,101,32,115,105,122,101,32,109,105,115,109,97,116,99,104,32,40,37,117,32,47,32,37,117,41,10,0,0,0,0,80,116,114,65,110,100,72,97,110,100,0,0,0,0,0,0,81,117,111,116,101,0,0,0,100,117,109,112,32,109,101,109,111,114,121,0,0,0,0,0,80,97,99,107,55,0,0,0,107,101,121,98,111,97,114,100,32,107,101,121,112,97,100,95,109,111,100,101,61,37,115,10,0,0,0,0,0,0,0,0,80,97,99,107,54,0,0,0,80,97,99,107,53,0,0,0,68,68,82,65,61,37,48,50,88,32,68,68,82,66,61,37,48,50,88,32,32,67,65,49,61,37,88,32,32,32,84,49,76,61,37,48,52,88,32,83,72,70,84,61,37,48,50,88,47,37,117,10,0,0,0,0,69,108,101,109,115,54,56,75,0,0,0,0,0,0,0,0,80,97,99,107,52,0,0,0,68,87,0,0,0,0,0,0,70,80,54,56,75,0,0,0,101,109,117,46,100,105,115,107,46,105,110,115,101,114,116,0,80,97,99,107,51,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,80,97,99,107,50,0,0,0,73,110,105,116,85,116,105,108,0,0,0,0,0,0,0,0,80,97,99,107,49,0,0,0,70,54,0,0,0,0,0,0,80,97,99,107,48,0,0,0,94,0,0,0,0,0,0,0,59,0,0,0,0,0,0,0,91,97,100,100,114,32,91,99,110,116,93,93,0,0,0,0,73,110,105,116,65,108,108,80,97,99,107,115,0,0,0,0,60,110,108,62,0,0,0,0,109,111,117,115,101,10,0,0,73,110,105,116,80,97,99,107,0,0,0,0,0,0,0,0,100,0,0,0,0,0,0,0,105,104,101,120,0,0,0,0,72,97,110,100,65,110,100,72,97,110,100,0,0,0,0,0,32,80,67,82,61,37,48,50,88,32,32,65,67,82,61,37,48,50,88,32,32,73,70,82,61,37,48,50,88,32,32,73,69,82,61,37,48,50,88,32,32,73,82,81,61,37,117,10,0,0,0,0,0,0,0,0,109,105,110,95,119,0,0,0,115,105,122,101,0,0,0,0,37,115,58,32,101,114,114,111,114,32,112,97,114,115,105,110,103,32,105,110,105,32,115,116,114,105,110,103,32,40,37,115,41,10,0,0,0,0,0,0,97,117,116,111,0,0,0,0,80,116,114,84,111,72,97,110,100,0,0,0,0,0,0,0,32,32,45,37,99,0,0,0,115,116,114,105,110,103,32,116,111,111,32,108,111,110,103,0,101,120,112,101,99,116,105,110,103,32,97,100,100,114,101,115,115,0,0,0,0,0,0,0,80,116,114,84,111,88,72,97,110,100,0,0,0,0,0,0,82,79,76,46,76,0,0,0,116,100,48,58,32,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,40,37,117,47,37,117,47,37,117,32,37,117,41,10,0,72,97,110,100,84,111,72,97,110,100,0,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,100,97,116,97,41,10,0,0,77,117,110,103,101,114,0,0,99,112,50,58,32,110,111,116,32,97,32,67,80,50,32,102,105,108,101,10,0,0,0,0,46,109,115,97,0,0,0,0,84,69,83,101,116,74,117,115,116,0,0,0,0,0,0,0,68,114,118,114,82,101,109,111,118,101,0,0,0,0,0,0,121,100,105,118,0,0,0,0,84,69,73,110,115,101,114,116,0,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,84,69,83,99,114,111,108,108,0,0,0,0,0,0,0,0,83,101,109,105,99,111,108,111,110,0,0,0,0,0,0,0,115,101,116,32,97,110,32,101,120,112,114,101,115,115,105,111,110,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,84,69,75,101,121,0,0,0,42,42,42,32,99,97,110,39,116,32,99,114,101,97,116,101,32,97,100,98,10,0,0,0,84,69,80,97,115,116,101,0,84,69,73,100,108,101,0,0,54,53,50,50,45,86,73,65,0,0,0,0,0,0,0,0,84,69,68,101,97,99,116,105,118,97,116,101,0,0,0,0,84,69,65,99,116,105,118,97,116,101,0,0,0,0,0,0,82,79,88,76,46,76,0,0,84,69,68,101,108,101,116,101,0,0,0,0,0,0,0,0,84,69,67,117,116,0,0,0,84,69,67,111,112,121,0,0,68,114,118,114,73,110,115,116,97,108,108,0,0,0,0,0,84,69,67,108,105,99,107,0,84,69,85,112,100,97,116,101,0,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,101,120,112,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,84,69,78,101,119,0,0,0,101,110,97,98,108,101,100,10,0,0,0,0,0,0,0,0,84,69,83,101,116,83,101,108,101,99,116,0,0,0,0,0,84,69,67,97,108,84,101,120,116,0,0,0,0,0,0,0,101,120,99,101,112,116,105,111,110,32,37,48,50,88,32,40,37,115,41,10,0,0,0,0,103,101,0,0,0,0,0,0,99,99,114,0,0,0,0,0,84,69,83,101,116,84,101,120,116,0,0,0,0,0,0,0,84,101,120,116,66,111,120,0,76,83,76,46,76,0,0,0,84,69,68,105,115,112,111,115,101,0,0,0,0,0,0,0,84,69,73,110,105,116,0,0,54,56,48,50,48,0,0,0,84,69,71,101,116,84,101,120,116,0,0,0,0,0,0,0,67,109,112,83,116,114,105,110,103,0,0,0,0,0,0,0,80,117,116,73,99,111,110,0,83,121,115,69,114,114,111,114,0,0,0,0,0,0,0,0,107,0,0,0,0,0,0,0,98,115,120,0,0,0,0,0,83,121,115,66,101,101,112,0,65,68,66,58,0,0,0,0,68,97,116,101,50,83,101,99,0,0,0,0,0,0,0,0,83,101,99,115,50,68,97,116,101,0,0,0,0,0,0,0,101,0,0,0,0,0,0,0,82,115,114,99,77,97,112,69,110,116,114,121,0,0,0,0,79,112,101,110,82,70,80,101,114,109,0,0,0,0,0,0,65,83,76,46,76,0,0,0,75,101,121,84,114,97,110,115,0,0,0,0,0,0,0,0,83,121,115,69,100,105,116,0,85,110,105,113,117,101,73,68,0,0,0,0,0,0,0,0,68,101,108,97,121,0,0,0,71,101,116,78,101,119,77,66,97,114,0,0,0,0,0,0,71,101,116,82,77,101,110,117,0,0,0,0,0,0,0,0,105,119,109,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,100,105,115,107,41,10,0,0,0,0,0,106,0,0,0,0,0,0,0,115,101,116,32,97,110,32,97,100,100,114,101,115,115,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,0,0,0,71,101,116,78,101,119,67,111,110,116,114,111,108,0,0,0,107,101,121,112,97,100,95,109,111,116,105,111,110,0,0,0,71,101,116,78,101,119,87,105,110,100,111,119,0,0,0,0,71,101,116,80,105,99,116,117,114,101,0,0,0,0,0,0,109,105,115,115,105,110,103,32,118,97,108,117,101,10,0,0,71,101,116,73,99,111,110,0,71,101,116,83,116,114,105,110,103,0,0,0,0,0,0,0,65,83,76,46,87,0,0,0,71,101,116,67,117,114,115,111,114,0,0,0,0,0,0,0,71,101,116,80,97,116,116,101,114,110,0,0,0,0,0,0,67,108,111,115,101,68,101,115,107,65,99,99,0,0,0,0,83,101,116,68,97,116,101,84,105,109,101,0,0,0,0,0,37,115,37,117,0,0,0,0,79,112,101,110,68,101,115,107,65,99,99,0,0,0,0,0,83,121,115,116,101,109,77,101,110,117,0,0,0,0,0,0,104,0,0,0,0,0,0,0,97,100,100,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,83,121,115,116,101,109,84,97,115,107,0,0,0,0,0,0,107,101,121,98,111,97,114,100,0,0,0,0,0,0,0,0,83,121,115,116,101,109,67,108,105,99,107,0,0,0,0,0,83,121,115,116,101,109,69,118,101,110,116,0,0,0,0,0,37,48,56,108,88,10,0,0,67,114,101,97,116,101,82,101,115,70,105,108,101,0,0,0,87,114,105,116,101,82,101,115,111,117,114,99,101,0,0,0,76,83,82,46,87,0,0,0,82,101,115,69,114,114,111,114,0,0,0,0,0,0,0,0,82,109,118,101,82,101,102,101,114,101,110,99,101,0,0,0,82,109,118,101,82,101,115,111,117,114,99,101,0,0,0,0,82,101,97,100,68,97,116,101,84,105,109,101,0,0,0,0,65,100,100,82,101,102,101,114,101,110,99,101,0,0,0,0,65,100,100,82,101,115,111,117,114,99,101,0,0,0,0,0,103,0,0,0,0,0,0,0,98,115,0,0,0,0,0,0,67,104,97,110,103,101,100,82,101,115,111,117,114,99,101,0,109,111,117,115,101,0,0,0,83,101,116,82,101,115,73,110,102,111,0,0,0,0,0,0,71,101,116,82,101,115,73,110,102,111,0,0,0,0,0,0,98,97,100,32,114,101,103,105,115,116,101,114,32,40,37,115,41,10,0,0,0,0,0,0,83,101,116,82,101,115,65,116,116,114,115,0,0,0,0,0,71,101,116,82,101,115,65,116,116,114,115,0,0,0,0,0,107,101,121,112,97,100,32,109,111,100,101,58,32,109,111,116,105,111,110,10,0,0,0,0,76,83,76,46,87,0,0,0,83,105,122,101,82,115,114,99,0,0,0,0,0,0,0,0,72,111,109,101,82,101,115,70,105,108,101,0,0,0,0,0,82,101,108,101,97,115,101,82,101,115,111,117,114,99,101,0,87,114,105,116,101,80,97,114,97,109,0,0,0,0,0,0,76,111,97,100,82,101,115,111,117,114,99,101,0,0,0,0,71,101,116,78,97,109,101,100,82,101,115,111,117,114,99,101,0,0,0,0,0,0,0,0,80,114,105,110,116,32,118,101,114,115,105,111,110,32,105,110,102,111,114,109,97,116,105,111,110,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,108,105,115,116,32,98,114,101,97,107,112,111,105,110,116,115,0,0,0,0,0,0,0,0,71,101,116,82,101,115,111,117,114,99,101,0,0,0,0,0,97,100,98,0,0,0,0,0,71,101,116,73,110,100,84,121,112,101,0,0,0,0,0,0,67,111,117,110,116,84,121,112,101,115,0,0,0,0,0,0,109,105,115,115,105,110,103,32,114,101,103,105,115,116,101,114,10,0,0,0,0,0,0,0,71,101,116,73,110,100,82,101,115,111,117,114,99,101,0,0,67,111,117,110,116,82,101,115,111,117,114,99,101,115,0,0,82,79,88,82,46,87,0,0,83,101,116,82,101,115,76,111,97,100,0,0,0,0,0,0,67,108,111,115,101,82,101,115,70,105,108,101,0,0,0,0,85,112,100,97,116,101,82,101,115,70,105,108,101,0,0,0,77,111,114,101,77,97,115,116,101,114,115,0,0,0,0,0,85,115,101,82,101,115,70,105,108,101,0,0,0,0,0,0,83,116,97,116,117,115,0,0,79,112,101,110,82,101,115,70,105,108,101,0,0,0,0,0,118,101,114,115,105,111,110,0,100,0,0,0,0,0,0,0,98,108,0,0,0,0,0,0,82,115,114,99,90,111,110,101,73,110,105,116,0,0,0,0,100,114,105,118,101,61,37,117,32,115,105,122,101,61,37,117,75,32,108,111,99,107,101,100,61,37,100,32,114,111,116,97,116,101,61,37,100,32,100,105,115,107,61,37,117,32,102,105,108,101,61,37,115,10,0,0,73,110,105,116,82,101,115,111,117,114,99,101,115,0,0,0,67,117,114,82,101,115,70,105,108,101,0,0,0,0,0,0,59,32,0,0,0,0,0,0,83,101,116,82,101,115,80,117,114,103,101,0,0,0,0,0,105,110,115,101,114,116,32,100,114,105,118,101,32,37,117,10,0,0,0,0,0,0,0,0,68,101,116,97,99,104,82,101,115,111,117,114,99,101,0,0,82,79,88,76,46,87,0,0,77,111,100,97,108,68,105,97,108,111,103,0,0,0,0,0,71,101,116,73,84,101,120,116,0,0,0,0,0,0,0,0,83,101,116,73,84,101,120,116,0,0,0,0,0,0,0,0,79,102,102,108,105,110,101,0,83,101,116,68,73,116,101,109,0,0,0,0,0,0,0,0,115,99,115,105,58,32,119,114,105,116,101,32,98,108,111,99,107,32,99,111,117,110,116,32,37,117,10,0,0,0,0,0,71,101,116,68,73,116,101,109,0,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,100,101,98,117,103,32,91], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+28588);
/* memory initializer */ allocate([110,111,93,0,115,0,0,0,0,0,0,0,99,108,101,97,114,32,97,32,98,114,101,97,107,112,111,105,110,116,32,111,114,32,97,108,108,0,0,0,0,0,0,0,69,114,114,111,114,83,111,117,110,100,0,0,0,0,0,0,97,117,116,111,95,114,111,116,97,116,101,0,0,0,0,0,80,97,114,97,109,84,101,120,116,0,0,0,0,0,0,0,70,114,101,101,65,108,101,114,116,0,0,0,0,0,0,0,109,97,99,46,105,110,115,101,114,116,0,0,0,0,0,0,67,111,117,108,100,65,108,101,114,116,0,0,0,0,0,0,67,97,117,116,105,111,110,65,108,101,114,116,0,0,0,0,82,79,82,46,87,0,0,0,78,111,116,101,65,108,101,114,116,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,101,106,101,99,116,0,0,83,116,111,112,65,108,101,114,116,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,65,108,101,114,116,0,0,0,86,82,101,109,111,118,101,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,70,105,110,100,68,73,116,101,109,0,0,0,0,0,0,0,70,53,0,0,0,0,0,0,68,105,115,112,111,115,68,105,97,108,111,103,0,0,0,0,94,94,0,0,0,0,0,0,97,0,0,0,0,0,0,0,118,101,114,98,111,115,101,0,91,105,110,100,101,120,93,0,67,108,111,115,101,68,105,97,108,111,103,0,0,0,0,0,60,101,111,102,62,0,0,0,105,110,115,101,114,116,101,100,0,0,0,0,0,0,0,0,68,114,97,119,68,105,97,108,111,103,0,0,0,0,0,0,115,97,118,101,0,0,0,0,97,117,116,111,0,0,0,0,68,105,97,108,111,103,83,101,108,101,99,116,0,0,0,0,37,45,56,115,32,37,115,44,32,37,115,44,32,37,115,0,97,115,112,101,99,116,95,121,0,0,0,0,0,0,0,0,115,105,122,101,107,0,0,0,37,115,58,32,98,97,100,32,100,114,105,118,101,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,116,121,112,101,0,0,0,0,73,115,68,105,97,108,111,103,69,118,101,110,116,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,45,37,99,41,10,0,0,0,0,0,0,105,100,101,110,116,105,102,105,101,114,32,116,111,111,32,108,111,110,103,0,0,0,0,0,120,0,0,0,0,0,0,0,83,101,108,73,84,101,120,116,0,0,0,0,0,0,0,0,82,79,76,46,87,0,0,0,110,111,0,0,0,0,0,0,116,100,48,58,32,122,101,114,111,32,100,97,116,97,32,108,101,110,103,116,104,32,40,37,117,47,37,117,47,37,117,41,10,0,0,0,0,0,0,0,78,101,119,68,105,97,108,111,103,0,0,0,0,0,0,0,37,117,47,37,117,47,37,117,10,0,0,0,0,0,0,0,71,101,116,78,101,119,68,105,97,108,111,103,0,0,0,0,46,105,109,103,0,0,0,0,73,110,105,116,68,105,97,108,111,103,115,0,0,0,0,0,86,73,110,115,116,97,108,108,0,0,0,0,0,0,0,0,46,116,99,0,0,0,0,0,115,101,114,99,111,110,0,0,121,109,117,108,0,0,0,0,70,114,101,101,68,105,97,108,111,103,0,0,0,0,0,0,115,116,100,105,111,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,97,105,108,101,100,10,0,0,0,67,111,117,108,100,68,105,97,108,111,103,0,0,0,0,0,67,97,112,115,76,111,99,107,0,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,116,101,114,109,105,110,97,108,32,100,101,118,105,99,101,0,98,99,0,0,0,0,0,0,85,112,100,116,68,105,97,108,111,103,0,0,0,0,0,0,108,111,99,107,101,100,0,0,87,97,105,116,77,111,117,115,101,85,112,0,0,0,0,0,71,101,116,75,101,121,115,0,114,117,110,32,119,105,116,104,32,98,114,101,97,107,112,111,105,110,116,115,32,97,116,32,97,100,100,114,0,0,0,0,37,45,56,115,32,37,115,44,32,37,115,0,0,0,0,0,84,105,99,107,67,111,117,110,116,0,0,0,0,0,0,0,66,117,116,116,111,110,0,0,66,70,84,83,84,0,0,0,83,116,105,108,108,68,111,119,110,0,0,0,0,0,0,0,71,101,116,77,111,117,115,101,0,0,0,0,0,0,0,0,69,118,101,110,116,65,118,97,105,108,0,0,0,0,0,0,70,108,117,115,104,69,118,101,110,116,115,0,0,0,0,0,71,101,116,78,101,120,116,69,118,101,110,116,0,0,0,0,69,110,113,117,101,117,101,0,82,101,116,117,114,110,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,68,101,113,117,101,117,101,0,115,105,110,103,108,101,95,115,105,100,101,100,0,0,0,0,68,114,97,119,49,67,111,110,116,114,111,108,0,0,0,0,70,105,110,100,67,111,110,116,114,111,108,0,0,0,0,0,37,45,56,115,32,37,115,0,99,0,0,0,0,0,0,0,115,112,0,0,0,0,0,0,83,101,116,67,116,108,65,99,116,105,111,110,0,0,0,0,71,101,116,67,116,108,65,99,116,105,111,110,0,0,0,0,66,70,69,88,84,85,0,0,68,114,97,119,67,111,110,116,114,111,108,115,0,0,0,0,84,114,97,99,107,67,111,110,116,114,111,108,0,0,0,0,68,114,97,103,67,111,110,116,114,111,108,0,0,0,0,0,54,56,48,49,48,0,0,0,71,101,116,79,83,69,118,101,110,116,0,0,0,0,0,0,84,101,115,116,67,111,110,116,114,111,108,0,0,0,0,0,83,101,116,77,97,120,67,116,108,0,0,0,0,0,0,0,93,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,67,80,85,32,115,112,101,101,100,0,0,0,0,0,0,0,83,101,116,77,105,110,67,116,108,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,83,101,116,67,116,108,86,97,108,117,101,0,0,0,0,0,71,101,116,77,97,120,67,116,108,0,0,0,0,0,0,0,91,97,100,100,114,46,46,93,0,0,0,0,0,0,0,0,71,101,116,77,105,110,67,116,108,0,0,0,0,0,0,0,71,101,116,67,116,108,86,97,108,117,101,0,0,0,0,0,66,70,67,72,71,0,0,0,83,101,116,67,84,105,116,108,101,0,0,0,0,0,0,0,71,101,116,67,84,105,116,108,101,0,0,0,0,0,0,0,72,105,108,105,116,101,67,111,110,116,114,111,108,0,0,0,79,83,69,118,101,110,116,65,118,97,105,108,0,0,0,0,83,105,122,101,67,111,110,116,114,111,108,0,0,0,0,0,83,101,116,67,82,101,102,67,111,110,0,0,0,0,0,0,71,101,116,67,82,101,102,67,111,110,0,0,0,0,0,0,82,105,103,104,116,66,114,97,99,107,101,116,0,0,0,0,105,110,116,0,0,0,0,0,105,119,109,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,112,114,105,41,10,0,0,0,0,0,0,77,111,118,101,67,111,110,116,114,111,108,0,0,0,0,0,72,105,100,101,67,111,110,116,114,111,108,0,0,0,0,0,100,105,115,107,0,0,0,0,83,104,111,119,67,111,110,116,114,111,108,0,0,0,0,0,75,105,108,108,67,111,110,116,114,111,108,115,0,0,0,0,66,70,69,88,84,83,0,0,68,105,115,112,111,115,67,111,110,116,114,111,108,0,0,0,78,101,119,67,111,110,116,114,111,108,0,0,0,0,0,0,85,112,100,116,67,111,110,116,114,111,108,0,0,0,0,0,80,111,115,116,69,118,101,110,116,0,0,0,0,0,0,0,65,37,117,0,0,0,0,0,68,101,108,77,101,110,117,73,116,101,109,0,0,0,0,0,73,110,115,101,114,116,82,101,115,77,101,110,117,0,0,0,91,0,0,0,0,0,0,0,115,112,101,101,100,0,0,0,67,111,117,110,116,77,73,116,101,109,115,0,0,0,0,0,98,108,111,99,107,95,99,111,117,110,116,0,0,0,0,0,68,101,108,116,97,80,111,105,110,116,0,0,0,0,0,0,80,105,110,82,101,99,116,0,97,100,100,114,61,48,120,37,48,54,108,120,10,0,0,0,65,100,100,82,101,115,77,101,110,117,0,0,0,0,0,0,70,108,97,115,104,77,101,110,117,66,97,114,0,0,0,0,66,70,67,76,82,0,0,0,80,108,111,116,73,99,111,110,0,0,0,0,0,0,0,0,83,101,116,77,70,108,97,115,104,0,0,0,0,0,0,0,71,101,116,77,72,97,110,100,108,101,0,0,0,0,0,0,66,108,111,99,107,77,111,118,101,0,0,0,0,0,0,0,67,97,108,99,77,101,110,117,83,105,122,101,0,0,0,0,83,101,116,73,116,101,109,0,76,101,102,116,66,114,97,99,107,101,116,0,0,0,0,0,78,101,118,101,114,32,115,116,111,112,32,114,117,110,110,105,110,103,32,91,110,111,93,0,71,101,116,73,116,101,109,0,98,108,111,99,107,95,115,116,97,114,116,0,0,0,0,0,67,104,101,99,107,73,116,101,109,0,0,0,0,0,0,0,83,101,116,73,116,109,77,97,114,107,0,0,0,0,0,0,73,87,77,58,0,0,0,0,71,101,116,73,116,109,77,97,114,107,0,0,0,0,0,0,83,101,116,73,116,109,83,116,121,108,101,0,0,0,0,0,66,70,83,69,84,0,0,0,71,101,116,73,116,109,83,116,121,108,101,0,0,0,0,0,52,0,0,0,0,0,0,0,83,101,116,73,116,109,73,99,111,110,0,0,0,0,0,0,71,101,116,73,116,109,73,99,111,110,0,0,0,0,0,0,83,101,116,65,112,112,108,76,105,109,105,116,0,0,0,0,77,101,110,117,75,101,121,0,77,101,110,117,83,101,108,101,99,116,0,0,0,0,0,0,112,0,0,0,0,0,0,0,110,111,45,109,111,110,105,116,111,114,0,0,0,0,0,0,83,101,116,77,101,110,117,66,97,114,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,118,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,10,0,0,0,0,0,0,105,119,109,0,0,0,0,0,71,101,116,77,101,110,117,66,97,114,0,0,0,0,0,0,68,105,115,97,98,108,101,73,116,101,109,0,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,69,110,97,98,108,101,73,116,101,109,0,0,0,0,0,0,117,110,104,97,110,100,108,101,100,32,104,111,111,107,32,40,37,48,52,88,41,10,0,0,72,105,108,105,116,101,77,101,110,117,0,0,0,0,0,0,36,0,0,0,0,0,0,0,68,114,97,119,77,101,110,117,66,97,114,0,0,0,0,0,68,101,108,101,116,101,77,101,110,117,0,0,0,0,0,0,73,110,115,101,114,116,77,101,110,117,0,0,0,0,0,0,73,110,105,116,65,112,112,108,90,111,110,101,0,0,0,0,67,108,101,97,114,77,101,110,117,66,97,114,0,0,0,0,67,111,110,116,114,111,108,0,117,110,107,110,111,119,110,32,67,80,85,32,109,111,100,101,108,32,40,37,115,41,10,0,65,112,112,101,110,100,77,101,110,117,0,0,0,0,0,0,111,0,0,0,0,0,0,0,83,116,97,114,116,32,114,117,110,110,105,110,103,32,105,109,109,101,100,105,97,116,101,108,121,32,91,110,111,93,0,0,68,105,115,112,111,115,77,101,110,117,0,0,0,0,0,0,118,105,115,105,98,108,101,95,115,0,0,0,0,0,0,0,105,100,61,37,117,32,100,114,105,118,101,61,37,117,32,118,101,110,100,111,114,61,34,37,115,34,32,112,114,111,100,117,99,116,61,34,37,115,34,10,0,0,0,0,0,0,0,0,78,101,119,77,101,110,117,0,73,110,105,116,77,101,110,117,115,0,0,0,0,0,0,0,32,32,32,32,32,0,0,0,71,101,116,87,105,110,100,111,119,80,105,99,0,0,0,0,115,111,110,121,32,100,114,105,118,101,114,32,97,116,32,48,120,37,48,54,108,120,10,0,83,101,116,87,105,110,100,111,119,80,105,99,0,0,0,0,40,91,37,115,44,32,37,115,44,32,37,115,37,115,93,44,32,37,115,41,0,0,0,0,67,108,111,115,101,87,105,110,100,111,119,0,0,0,0,0,70,105,110,100,87,105,110,100,111,119,0,0,0,0,0,0,71,114,111,119,87,105,110,100,111,119,0,0,0,0,0,0,69,109,112,116,121,72,97,110,100,108,101,0,0,0,0,0,86,97,108,105,100,82,101,99,116,0,0,0,0,0,0,0,79,112,101,110,0,0,0,0,115,99,115,105,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,32,40,37,48,50,88,41,10,0,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,32,102,111,114,32,100,114,105,118,101,32,37,117,10,0,0,86,97,108,105,100,82,103,110,0,0,0,0,0,0,0,0,73,0,0,0,0,0,0,0,114,117,110,0,0,0,0,0,73,110,118,97,108,82,101,99,116,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,104,0,0,0,0,0,0,0,80,67,69,68,73,83,75,0,73,110,118,97,108,82,103,110,0,0,0,0,0,0,0,0,68,114,97,103,84,104,101,82,103,110,0,0,0,0,0,0,37,48,52,88,32,0,0,0,68,114,97,103,87,105,110,100,111,119,0,0,0,0,0,0,70,114,111,110,116,87,105,110,100,111,119,0,0,0,0,0,40,91,37,115,44,32,37,115,93,44,32,37,115,37,115,44,32,37,115,41,0,0,0,0,69,110,100,85,112,100,97,116,101,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,99,111,109,109,105,116,0,66,101,103,105,110,85,112,100,97,116,101,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,83,101,110,100,66,101,104,105,110,100,0,0,0,0,0,0,72,85,110,108,111,99,107,0,116,101,114,109,46,115,99,114,101,101,110,115,104,111,116,0,66,114,105,110,103,84,111,70,114,111,110,116,0,0,0,0,70,52,0,0,0,0,0,0,83,101,108,101,99,116,87,105,110,100,111,119,0,0,0,0,99,111,109,109,105,116,0,0,124,0,0,0,0,0,0,0,117,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,101,114,114,111,114,32,91,110,111,93,0,84,114,97,99,107,71,111,65,119,97,121,0,0,0,0,0,118,105,115,105,98,108,101,95,99,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,112,114,111,100,117,99,116,0,83,105,122,101,87,105,110,100,111,119,0,0,0,0,0,0,108,111,97,100,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,98,105,110,97,114,121,32,97,100,100,114,61,48,120,37,48,56,108,120,10,0,0,0,0,0,72,105,108,105,116,101,87,105,110,100,111,119,0,0,0,0,37,48,56,108,88,32,32,37,115,10,0,0,0,0,0,0,97,115,112,101,99,116,95,120,0,0,0,0,0,0,0,0,115,105,122,101,109,0,0,0,100,114,105,118,101,0,0,0,77,111,118,101,87,105,110,100,111,119,0,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,45,37,99,41,10,0,0,0,0,0,0,0,114,111,109,115,47,112,99,101,45,99,111,110,102,105,103,46,99,102,103,0,0,0,0,0,42,42,42,32,37,115,32,91,37,115,93,10,0,0,0,0,83,101,116,87,84,105,116,108,101,0,0,0,0,0,0,0,98,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,0,0,0,0,0,0,102,97,108,115,101,0,0,0,37,115,37,115,37,48,56,88,0,0,0,0,0,0,0,0,115,100,108,0,0,0,0,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,110,111,32,100,97,116,97,41,10,0,0,0,0,71,101,116,87,84,105,116,108,101,0,0,0,0,0,0,0,83,101,116,87,82,101,102,67,111,110,0,0,0,0,0,0,32,37,48,50,88,0,0,0,46,105,109,100,0,0,0,0,71,101,116,87,82,101,102,67,111,110,0,0,0,0,0,0,72,76,111,99,107,0,0,0,46,112,114,105,0,0,0,0,45,45,0,0,0,0,0,0,120,100,105,118,0,0,0,0,72,105,100,101,87,105,110,100,111,119,0,0,0,0,0,0,112,116,121,0,0,0,0,0,113,101,100,58,32,117,110,107,110,111,119,110,32,102,101,97,116,117,114,101,115,32,40,48,120,37,48,56,108,108,120,41,10,0,0,0,0,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,100,99,32,105,109,97,103,101,10,0,0,0,0,0,0,0,0,83,104,111,119,87,105,110,100,111,119,0,0,0,0,0,0,99,111,109,109,105,116,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,0,0,121,0,0,0,0,0,0,0,113,117,105,101,116,0,0,0,68,105,115,112,111,115,87,105,110,100,111,119,0,0,0,0,100,105,115,107,0,0,0,0,80,67,69,0,0,0,0,0,78,101,119,87,105,110,100,111,119,0,0,0,0,0,0,0,73,110,105,116,87,105,110,100,111,119,115,0,0,0,0,0,45,0,0,0,0,0,0,0,67,104,101,99,107,85,112,100,97,116,101,0,0,0,0,0,71,101,116,87,77,103,114,80,111,114,116,0,0,0,0,0,42,37,117,0,0,0,0,0,68,114,97,119,78,101,119,0,83,97,118,101,79,108,100,0,80,97,105,110,116,66,101,104,105,110,100,0,0,0,0,0,82,101,99,111,118,101,114,72,97,110,100,108,101,0,0,0,80,97,105,110,116,79,110,101,0,0,0,0,0,0,0,0,67,108,105,112,65,98,111,118,101,0,0,0,0,0,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,67,80,85,32,109,111,100,101,108,0,0,0,0,0,0,0,67,97,108,99,86,66,101,104,105,110,100,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,32,40,99,111,119,41,10,0,0,118,101,110,100,111,114,0,0,67,97,108,99,86,105,115,0,83,104,111,119,72,105,100,101,0,0,0,0,0,0,0,0,37,48,56,108,88,58,32,117,110,100,101,102,105,110,101,100,32,111,112,101,114,97,116,105,111,110,58,32,37,48,52,108,88,32,91,37,48,52,88,32,37,48,52,88,32,37,48,52,88,32,37,48,52,88,32,37,48,52,88,93,10,0,0,0,97,100,98,45,107,98,100,58,32,116,97,108,107,32,50,10,0,0,0,0,0,0,0,0,115,114,0,0,0,0,0,0,83,101,116,83,116,114,105,110,103,0,0,0,0,0,0,0,78,101,119,83,116,114,105,110,103,0,0,0,0,0,0,0,37,115,37,117,37,115,0,0,68,114,97,103,71,114,97,121,82,103,110,0,0,0,0,0,68,114,97,119,71,114,111,119,73,99,111,110,0,0,0,0,83,101,116,70,111,110,116,76,111,99,107,0,0,0,0,0,82,101,97,108,108,111,99,72,97,110,100,108,101,0,0,0,82,101,97,108,70,111,110,116,0,0,0,0,0,0,0,0,54,56,48,48,48,0,0,0,70,77,83,119,97,112,70,111,110,116,0,0,0,0,0,0,42,42,42,32,99,111,109,109,105,116,32,102,97,105,108,101,100,32,102,111,114,32,97,116,32,108,101,97,115,116,32,111,110,101,32,100,105,115,107,10,0,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,0,0,0,71,101,116,70,78,117,109,0,100,114,105,118,101,0,0,0,71,101,116,70,78,97,109,101,0,0,0,0,0,0,0,0,73,110,105,116,70,111,110,116,115,0,0,0,0,0,0,0,37,48,56,108,88,58,32,101,120,99,101,112,116,105,111,110,32,37,48,50,88,32,40,37,115,41,32,73,87,61,37,48,52,88,10,0,0,0,0,0,80,114,71,108,117,101,0,0,77,97,112,80,111,108,121,0,80,67,0,0,0,0,0,0,77,97,112,82,103,110,0,0,77,97,112,82,101,99,116,0,77,97,112,80,116,0,0,0,72,97,110,100,108,101,90,111,110,101,0,0,0,0,0,0,83,99,97,108,101,80,116,0,76,97,121,111,117,116,0,0,99,111,109,109,105,116,105,110,103,32,97,108,108,32,100,114,105,118,101,115,10,0,0,0,101,0,0,0,0,0,0,0,108,111,103,0,0,0,0,0,68,114,97,119,80,105,99,116,117,114,101,0,0,0,0,0,114,119,0,0,0,0,0,0,75,105,108,108,80,105,99,116,117,114,101,0,0,0,0,0,49,0,0,0,0,0,0,0,105,100,0,0,0,0,0,0,105,119,109,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,67,108,111,115,101,80,105,99,116,117,114,101,0,0,0,0,103,98,0,0,0,0,0,0,79,112,101,110,80,105,99,116,117,114,101,0,0,0,0,0,83,79,78,89,58,0,0,0,80,105,99,67,111,109,109,101,110,116,0,0,0,0,0,0,60,69,65,62,40,37,48,50,88,41,0,0,0,0,0,0,83,116,100,67,111,109,109,101,110,116,0,0,0,0,0,0,83,116,100,80,117,116,80,105,99,0,0,0,0,0,0,0,83,99,114,111,108,108,82,101,99,116,0,0,0,0,0,0,71,101,116,72,97,110,100,108,101,83,105,122,101,0,0,0,68,37,117,0,0,0,0,0,83,116,100,71,101,116,80,105,99,0,0,0,0,0,0,0,83,116,100,84,120,77,101,97,115,0,0,0,0,0,0,0,97,108,108,0,0,0,0,0,119,0,0,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,97,102,116,101,114,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,67,111,112,121,66,105,116,115,0,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,100,101,118,105,99,101,0,0,83,116,100,66,105,116,115,0,83,101,116,83,116,100,80,114,111,99,115,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,82,101,99,116,73,110,82,103,110,0,0,0,0,0,0,0,80,116,73,110,82,103,110,0,37,115,37,115,37,48,50,88,40,80,67,44,32,37,115,37,117,37,115,42,37,117,41,0,88,111,114,82,103,110,0,0,68,105,102,102,82,103,110,0,115,116,100,105,111,58,102,105,108,101,61,0,0,0,0,0,85,110,105,111,110,82,103,110,0,0,0,0,0,0,0,0,83,101,116,72,97,110,100,108,101,83,105,122,101,0,0,0,83,101,99,116,82,103,110,0,69,113,117,97,108,82,103,110,0,0,0,0,0,0,0,0,101,106,101,99,116,105,110,103,32,100,114,105,118,101,32,37,108,117,10,0,0,0,0,0,113,0,0,0,0,0,0,0,105,110,105,45,97,112,112,101,110,100,0,0,0,0,0,0,69,109,112,116,121,82,103,110,0,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,37,115,32,98,108,111,99,107,115,61,37,108,117,32,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,32,37,115,32,102,105,108,101,61,37,115,10,0,62,62,0,0,0,0,0,0,97,100,100,114,61,48,120,37,48,54,108,120,32,115,105,122,101,61,48,120,37,108,120,10,0,0,0,0,0,0,0,0,73,110,115,101,116,82,103,110,0,0,0,0,0,0,0,0,79,102,115,101,116,82,103,110,0,0,0,0,0,0,0,0,98,0,0,0,0,0,0,0,82,101,99,116,82,103,110,0,83,101,116,82,101,99,82,103,110,0,0,0,0,0,0,0,37,115,37,48,56,108,88,40,80,67,41,0,0,0,0,0,83,101,116,69,109,112,116,121,82,103,110,0,0,0,0,0,67,111,112,121,82,103,110,0,51,0,0,0,0,0,0,0,67,108,111,115,101,82,103,110,0,0,0,0,0,0,0,0,68,105,115,112,111,115,72,97,110,100,108,101,0,0,0,0,79,112,101,110,82,103,110,0,68,105,115,112,111,115,82,103,110,0,0,0,0,0,0,0,42,42,42,32,100,105,115,107,32,101,106,101,99,116,32,101,114,114,111,114,58,32,110,111,32,115,117,99,104,32,100,105,115,107,32,40,37,108,117,41,10,0,0,0,0,0,0,0,84,97,98,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,98,101,102,111,114,101,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,0,0,0,0,0,0,0,78,101,119,82,103,110,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,0,60,60,0,0,0,0,0,0,83,67,83,73,58,0,0,0,66,105,116,77,97,112,84,111,82,101,103,105,111,110,0,0,70,105,108,108,82,103,110,0,117,110,107,110,111,119,110,32,99,111,109,112,111,110,101,110,116,32,40,37,115,41,10,0,73,110,118,101,114,82,103,110,0,0,0,0,0,0,0,0,69,114,97,115,101,82,103,110,0,0,0,0,0,0,0,0,109,97,114,107,58,32,80,67,61,37,48,54,108,88,10,0,37,115,37,115,37,48,52,88,0,0,0,0,0,0,0,0,80,97,105,110,116,82,103,110,0,0,0,0,0,0,0,0,70,114,97,109,101,82,103,110,0,0,0,0,0,0,0,0,83,116,100,82,103,110,0,0,78,101,119,72,97,110,100,108,101,0,0,0,0,0,0,0,85,110,112,97,99,107,66,105,116,115,0,0,0,0,0,0,87,114,105,116,101,0,0,0,80,97,99,107,66,105,116,115,0,0,0,0,0,0,0,0,42,42,42,32,100,105,115,107,32,101,106,101,99,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,66,97,99,107,115,112,97,99,101,0,0,0,0,0,0,0,105,110,105,45,112,114,101,102,105,120,0,0,0,0,0,0,79,102,102,115,101,116,80,111,108,121,0,0,0,0,0,0,116,101,108,101,100,105,115,107,0,0,0,0,0,0,0,0,62,62,62,0,0,0,0,0,115,105,122,101,0,0,0,0,75,105,108,108,80,111,108,121,0,0,0,0,0,0,0,0,67,108,111,115,101,80,103,111,110,0,0,0,0,0,0,0,118,105,97,0,0,0,0,0,79,112,101,110,80,111,108,121,0,0,0,0,0,0,0,0,115,111,110,121,32,100,114,105,118,101,114,32,110,111,116,32,102,111,117,110,100,10,0,0,70,105,108,108,80,111,108,121,0,0,0,0,0,0,0,0,46,87,0,0,0,0,0,0,73,110,118,101,114,116,80,111,108,121,0,0,0,0,0,0,69,114,97,115,101,80,111,108,121,0,0,0,0,0,0,0,80,97,105,110,116,80,111,108,121,0,0,0,0,0,0,0,71,101,116,80,116,114,83,105,122,101,0,0,0,0,0,0,70,114,97,109,101,80,111,108,121,0,0,0,0,0,0,0,115,99,115,105,58,32,115,101,116,32,32,56,58,32,37,48,52,108,88,32,60,45,32,37,48,50,88,10,0,0,0,0,83,116,100,80,111,108,121,0,115,101,116,116,105,110,103,32,114,101,97,100,111,110,108,121,32,100,114,105,118,101,32,37,108,117,10,0,0,0,0,0,61,0,0,0,0,0,0,0,65,100,100,32,97,32,100,105,114,101,99,116,111,114,121,32,116,111,32,116,104,101,32,115,101,97,114,99,104,32,112,97,116,104,0,0,0,0,0,0,65,110,103,108,101,70,114,111,109,83,108,111,112,101,0,0,112,115,105,0,0,0,0,0,60,60,60,0,0,0,0,0,115,99,115,105,0,0,0,0,80,116,84,111,65,110,103,108,101,0,0,0,0,0,0,0,70,105,108,108,65,114,99,0,115,99,99,0,0,0,0,0,73,110,118,101,114,116,65,114,99,0,0,0,0,0,0,0,69,114,97,115,101,65,114,99,0,0,0,0,0,0,0,0,46,76,0,0,0,0,0,0,80,97,105,110,116,65,114,99,0,0,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,70,114,97,109,101,65,114,99,0,0,0,0,0,0,0,0,107,101,121,109,97,112,0,0,83,116,100,65,114,99,0,0,116,101,114,109,46,101,115,99,97,112,101,0,0,0,0,0,83,101,116,80,116,114,83,105,122,101,0,0,0,0,0,0,83,108,111,112,101,70,114,111,109,65,110,103,108,101,0,0,70,51,0,0,0,0,0,0,70,105,108,108,79,118,97,108,0,0,0,0,0,0,0,0,115,101,116,116,105,110,103,32,114,101,97,100,47,119,114,105,116,101,32,100,114,105,118,101,32,37,108,117,10,0,0,0,38,38,0,0,0,0,0,0,69,113,117,97,108,0,0,0,112,97,116,104,0,0,0,0,73,110,118,101,114,116,79,118,97,108,0,0,0,0,0,0,112,102,100,99,45,97,117,116,111,0,0,0,0,0,0,0,37,115,58,37,108,117,58,32,37,115,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,100,101,108,97,121,61,37,108,117,10,0,0,0,0,0,69,114,97,115,101,79,118,97,108,0,0,0,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,115,114,101,99,10,0,0,0,0,80,97,105,110,116,79,118,97,108,0,0,0,0,0,0,0,109,101,109,0,0,0,0,0,101,115,99,97,112,101,0,0,98,97,115,101,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,99,111,119,32,102,105,108,101,61,37,115,10,0,0,0,0,0,0,70,114,97,109,101,79,118,97,108,0,0,0,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,37,115,41,10,0,0,0,0,0,0,0,91,37,48,54,108,88,93,32,0,0,0,0,0,0,0,0,83,116,100,79,118,97,108,0,99,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,37,115,37,115,37,48,50,88,40,65,37,117,44,32,37,115,37,117,37,115,42,37,117,41,0,0,0,0,0,0,0,0,119,97,118,0,0,0,0,0,116,100,48,58,32,116,114,97,99,107,32,99,114,99,32,40,37,48,50,88,32,37,48,52,88,41,10,0,0,0,0,0,83,99,114,105,112,116,85,116,105,108,0,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,104,101,97,100,101,114,41,10,0,0,0,0,0,0,0,0,112,115,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,0,100,99,52,50,58,32,116,97,103,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,0,0,70,105,108,108,82,111,117,110,100,82,101,99,116,0,0,0,46,105,109,97,0,0,0,0,73,110,118,101,114,82,111,117,110,100,82,101,99,116,0,0,46,112,98,105,116,0,0,0,68,105,115,112,111,115,80,116,114,0,0,0,0,0,0,0,119,98,0,0,0,0,0,0,45,0,0,0,0,0,0,0,120,109,117,108,0,0,0,0,69,114,97,115,101,82,111,117,110,100,82,101,99,116,0,0,115,101,114,99,111,110,0,0,99,111,109,109,105,116,0,0,99,111,109,109,105,116,0,0,99,111,109,109,105,116,0,0,80,97,105,110,116,82,111,117,110,100,82,101,99,116,0,0,115,101,116,116,105,110,103,32,105,119,109,32,100,114,105,118,101,32,37,108,117,32,116,111,32,114,101,97,100,45,111,110,108,121,10,0,0,0,0,0,45,0,0,0,0,0,0,0,48,98,0,0,0,0,0,0,83,101,116,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,70,114,97,109,101,82,111,117,110,100,82,101,99,116,0,0,112,102,100,99,0,0,0,0,62,61,0,0,0,0,0,0,83,79,78,89,58,0,0,0,83,116,100,82,82,101,99,116,0,0,0,0,0,0,0,0,69,109,112,116,121,82,101,99,116,0,0,0,0,0,0,0,99,112,117,0,0,0,0,0,80,116,73,110,82,101,99,116,0,0,0,0,0,0,0,0,80,116,50,82,101,99,116,0,40,65,37,117,41,0,0,0,85,110,105,111,110,82,101,99,116,0,0,0,0,0,0,0,83,101,99,116,82,101,99,116,0,0,0,0,0,0,0,0,73,110,115,101,116,82,101,99,116,0,0,0,0,0,0,0,78,101,119,80,116,114,0,0,79,102,102,115,101,116,82,101,99,116,0,0,0,0,0,0,114,98,0,0,0,0,0,0,83,101,116,82,101,99,116,0,115,101,116,116,105,110,103,32,97,108,108,32,105,119,109,32,100,114,105,118,101,115,32,116,111,32,114,101,97,100,45,111,110,108,121,10,0,0,0,0,77,105,110,117,115,0,0,0,48,120,0,0,0,0,0,0,115,116,114,105,110,103,0,0,69,113,117,97,108,82,101,99,116,0,0,0,0,0,0,0,105,109,100,0,0,0,0,0,105,110,115,101,114,116,95,100,101,108,97,121,95,37,117,0,70,105,108,108,82,101,99,116,0,0,0,0,0,0,0,0,73,110,118,101,114,82,101,99,116,0,0,0,0,0,0,0,100,105,115,97,115,115,101,109,98,108,101,0,0,0,0,0,97,100,98,45,107,98,100,58,32,116,97,108,107,32,37,117,10,0,0,0,0,0,0,0,108,112,99,0,0,0,0,0,69,114,97,115,101,82,101,99,116,0,0,0,0,0,0,0,80,97,105,110,116,82,101,99,116,0,0,0,0,0,0,0,37,115,37,117,47,37,115,37,117,0,0,0,0,0,0,0,70,114,97,109,101,82,101,99,116,0,0,0,0,0,0,0,83,116,100,82,101,99,116,0,85,110,105,109,112,108,101,109,101,110,116,101,100,0,0,0,77,97,120,77,101,109,0,0,80,101,110,78,111,114,109,97,108,0,0,0,0,0,0,0,80,101,110,80,97,116,0,0,115,101,116,116,105,110,103,32,105,119,109,32,100,114,105,118,101,32,37,108,117,32,116,111,32,114,101,97,100,47,119,114,105,116,101,10,0,0,0,0,48,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,99,111,110,102,105,103,0,0,80,101,110,77,111,100,101,0,105,109,97,103,101,100,105,115,107,0,0,0,0,0,0,0,60,61,0,0,0,0,0,0,102,111,114,109,97,116,95,104,100,95,97,115,95,100,100,0,80,101,110,83,105,122,101,0,71,101,116,80,101,110,0,0,91,91,45,93,97,100,100,114,32,91,99,110,116,93,93,0,83,101,116,80,101,110,83,116,97,116,101,0,0,0,0,0,71,101,116,80,101,110,83,116,97,116,101,0,0,0,0,0,107,98,100,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,32,40,37,48,50,88,41,10,0,0,0,0,37,115,37,117,45,37,115,37,117,0,0,0,0,0,0,0,83,104,111,119,80,101,110,0,72,105,100,101,80,101,110,0,83,104,117,116,100,111,119,110,0,0,0,0,0,0,0,0,70,114,101,101,77,101,109,0,77,111,118,101,0,0,0,0,77,111,118,101,84,111,0,0,115,101,116,116,105,110,103,32,97,108,108,32,105,119,109,32,100,114,105,118,101,115,32,116,111,32,114,101,97,100,47,119,114,105,116,101,10,0,0,0,57,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,83,101,116,32,116,104,101,32,100,105,115,107,32,100,101,108,97,121,32,91,51,48,93,0,76,105,110,101,0,0,0,0,100,99,52,50,0,0,0,0,33,61,0,0,0,0,0,0,105,110,115,101,114,116,95,100,101,108,97,121,0,0,0,0,76,105,110,101,84,111,0,0,83,116,100,76,105,110,101,0,105,119,109,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,10,0,0,0,117,0,0,0,0,0,0,0,79,83,68,105,115,112,97,116,99,104,0,0,0,0,0,0,83,112,97,99,101,69,120,116,114,97,0,0,0,0,0,0,67,104,97,114,87,105,100,116,104,0,0,0,0,0,0,0,83,116,114,105,110,103,87,105,100,116,104,0,0,0,0,0,71,101,116,70,111,110,116,73,110,102,111,0,0,0,0,0,83,101,116,90,111,110,101,0,35,37,115,37,48,52,88,0,84,101,120,116,83,105,122,101,0,0,0,0,0,0,0,0,84,101,120,116,77,111,100,101,0,0,0,0,0,0,0,0,73,87,77,32,100,114,105,118,101,32,37,117,58,32,108,111,99,107,101,100,61,37,100,10,0,0,0,0,0,0,0,0,56,0,0,0,0,0,0,0,100,101,102,105,110,101,100,0,100,114,105,118,101,32,100,101,108,97,121,0,0,0,0,0,84,101,120,116,70,97,99,101,0,0,0,0,0,0,0,0,99,112,50,0,0,0,0,0,61,61,0,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,32,91,49,93,0,0,0,0,115,111,110,121,0,0,0,0,84,101,120,116,70,111,110,116,0,0,0,0,0,0,0,0,79,82,73,46,66,0,0,0,84,101,120,116,87,105,100,116,104,0,0,0,0,0,0,0,99,108,111,99,107,0,0,0,79,82,73,46,87,0,0,0,68,114,97,119,84,101,120,116,0,0,0,0,0,0,0,0,79,82,73,46,76,0,0,0,68,114,97,119,83,116,114,105,110,103,0,0,0,0,0,0,67,77,80,50,46,66,0,0,67,82,40,37,117,41,0,0,68,114,97,119,67,104,97,114,0,0,0,0,0,0,0,0,67,72,75,50,46,66,0,0,83,116,100,84,101,120,116,0,69,113,117,97,108,80,116,0,71,101,116,90,111,110,101,0,83,101,116,80,116,0,0,0,65,78,68,73,46,66,0,0,83,117,98,80,116,0,0,0,65,78,68,73,46,87,0,0,32,9,0,0,0,0,0,0,43,49,0,0,0,0,0,0,55,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,100,105,115,107,45,100,101,108,97,121,0,0,0,0,0,0,65,100,100,80,116,0,0,0,65,78,68,73,46,76,0,0,97,110,97,100,105,115,107,0,42,42,42,32,115,101,116,116,105,110,103,32,115,111,117,110,100,32,100,114,105,118,101,114,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,67,108,111,115,101,67,80,111,114,116,0,0,0,0,0,0,67,77,80,50,46,87,0,0,67,108,111,115,101,80,111,114,116,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,67,72,75,50,46,87,0,0,66,97,99,107,80,97,116,0,83,85,66,73,46,66,0,0,67,108,105,112,82,101,99,116,0,0,0,0,0,0,0,0,83,85,66,73,46,87,0,0,86,66,82,0,0,0,0,0,71,101,116,67,108,105,112,0,83,85,66,73,46,76,0,0,83,101,116,67,108,105,112,0,67,77,80,50,46,76,0,0,83,101,116,79,114,105,103,105,110,0,0,0,0,0,0,0,50,0,0,0,0,0,0,0,67,72,75,50,46,76,0,0,73,110,105,116,90,111,110,101,0,0,0,0,0,0,0,0,77,111,118,101,80,111,114,116,84,111,0,0,0,0,0,0,65,68,68,73,46,66,0,0,80,111,114,116,83,105,122,101,0,0,0,0,0,0,0,0,65,68,68,73,46,87,0,0,102,117,108,108,115,99,114,101,101,110,0,0,0,0,0,0,58,0,0,0,0,0,0,0,45,49,0,0,0,0,0,0,54,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,100,105,115,107,32,100,101,108,97,121,32,102,111,114,32,100,114,105,118,101,32,49,32,91,51,48,93,0,0,0,0,0,83,101,116,80,66,105,116,115,0,0,0,0,0,0,0,0,65,68,68,73,46,76,0,0,112,97,114,116,105,116,105,111,110,0,0,0,0,0,0,0,32,32,0,0,0,0,0,0,60,110,111,110,101,62,0,0,71,101,116,80,111,114,116,0,66,84,83,84,0,0,0,0,83,101,116,80,111,114,116,0,112,114,105,110,116,32,115,116,97,116,117,115,32,40,99,112,117,124,109,101,109,124,115,99,99,124,118,105,97,41,0,0,66,67,72,71,0,0,0,0,71,114,97,102,68,101,118,105,99,101,0,0,0,0,0,0,66,67,76,82,0,0,0,0,71,108,111,98,97,108,84,111,76,111,99,97,108,0,0,0,66,83,69,84,0,0,0,0,68,70,67,0,0,0,0,0,76,111,99,97,108,84,111,71,108,111,98,97,108,0,0,0,112,99,101,37,48,52,117,46,112,112,109,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,69,79,82,73,46,66,0,0,79,112,101,110,80,111,114,116,0,0,0,0,0,0,0,0,69,79,82,73,46,87,0,0,73,110,105,116,71,114,97,102,0,0,0,0,0,0,0,0,69,79,82,73,46,76,0,0,71,101,116,70,80,111,115,0,73,110,105,116,80,111,114,116,0,0,0,0,0,0,0,0,67,77,80,73,46,66,0,0,82,101,97,100,0,0,0,0,70,105,120,82,111,117,110,100,0,0,0,0,0,0,0,0,67,77,80,73,46,87,0,0,49,0,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,53,0,0,0,0,0,0,0,100,101,108,97,121,0,0,0,76,111,87,111,114,100,0,0,67,77,80,73,46,76,0,0,113,101,100,0,0,0,0,0,32,32,32,0,0,0,0,0,97,100,100,114,61,48,120,37,48,54,108,88,32,108,111,119,112,97,115,115,61,37,108,117,32,100,114,105,118,101,114,61,37,115,10,0,0,0,0,0,72,105,87,111,114,100,0,0,77,79,86,83,46,66,0,0,70,105,120,82,97,116,105,111,0,0,0,0,0,0,0,0,91,119,104,97,116,93,0,0,77,79,86,83,46,87,0,0,70,105,120,77,117,108,0,0,77,79,86,83,46,76,0,0,80,67,69,32,82,79,77,32,101,120,116,101,110,115,105,111,110,32,97,116,32,48,120,37,48,54,108,120,10,0,0,0,76,111,110,103,77,117,108,0,83,70,67,0,0,0,0,0,83,116,117,102,102,72,101,120,0,0,0,0,0,0,0,0,77,79,86,69,46,66,0,0,71,101,116,80,105,120,101,108,0,0,0,0,0,0,0,0,77,79,86,69,46,76,0,0,67,111,108,111,114,66,105,116,0,0,0,0,0,0,0,0,69,106,101,99,116,0,0,0,66,97,99,107,67,111,108,111,114,0,0,0,0,0,0,0,70,111,114,101,67,111,108,111,114,0,0,0,0,0,0,0,78,69,71,88,46,66,0,0,115,99,115,105,58,32,103,101,116,32,32,56,58,32,37,48,52,108,88,32,45,62,32,37,48,50,88,10,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,33,0,0,0,0,0,0,0,100,105,115,107,45,100,101,108,97,121,45,49,0,0,0,0,69,83,67,0,0,0,0,0,82,97,110,100,111,109,0,0,78,69,71,88], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+38828);
/* memory initializer */ allocate([46,87,0,0,112,99,101,0,0,0,0,0,38,38,0,0,0,0,0,0,114,98,0,0,0,0,0,0,32,37,48,50,88,0,0,0,83,79,85,78,68,58,0,0,114,98,0,0,0,0,0,0,119,97,114,110,105,110,103,58,32,100,101,108,97,121,32,61,61,32,48,32,97,116,32,37,48,56,108,120,10,0,0,0,87,97,105,116,78,101,120,116,69,118,101,110,116,0,0,0,78,69,71,88,46,76,0,0,114,43,98,0,0,0,0,0,66,105,116,67,108,114,0,0,115,0,0,0,0,0,0,0,66,105,116,83,101,116,0,0,66,105,116,84,115,116,0,0,67,76,82,46,66,0,0,0,63,0,0,0,0,0,0,0,66,105,116,83,104,105,102,116,0,0,0,0,0,0,0,0,67,76,82,46,87,0,0,0,66,105,116,79,114,0,0,0,67,76,82,46,76,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,114,101,112,111,114,116,95,107,101,121,115,0,0,0,0,0,66,105,116,78,111,116,0,0,78,69,71,46,66,0,0,0,80,54,10,37,117,32,37,117,10,37,117,10,0,0,0,0,73,110,105,116,81,117,101,117,101,0,0,0,0,0,0,0,66,105,116,88,111,114,0,0,78,69,71,46,87,0,0,0,70,50,0,0,0,0,0,0,99,111,109,109,105,116,0,0,66,105,116,65,110,100,0,0,78,69,71,46,76,0,0,0,109,97,99,46,105,110,115,101,114,116,0,0,0,0,0,0,124,124,0,0,0,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,51,0,0,0,0,0,0,0,126,0,0,0,0,0,0,0,80,114,105,110,116,32,117,115,97,103,101,32,105,110,102,111,114,109,97,116,105,111,110,0,79,98,115,99,117,114,101,67,117,114,115,111,114,0,0,0,42,42,42,32,110,111,32,116,101,114,109,105,110,97,108,32,102,111,117,110,100,10,0,0,78,79,84,46,66,0,0,0,100,111,115,101,109,117,0,0,124,124,0,0,0,0,0,0,60,110,111,110,101,62,0,0,60,45,0,0,0,0,0,0,32,9,0,0,0,0,0,0,100,114,105,118,101,114,0,0,73,78,84,82,0,0,0,0,83,104,105,101,108,100,67,117,114,115,111,114,0,0,0,0,78,79,84,46,87,0,0,0,37,45,57,115,32,0,0,0,70,111,110,116,68,105,115,112,97,116,99,104,0,0,0,0,103,101,116,32,111,114,32,115,101,116,32,97,32,114,101,103,105,115,116,101,114,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,105,104,101,120,10,0,0,0,0,78,79,84,46,76,0,0,0,110,117,108,108,0,0,0,0,97,100,100,114,101,115,115,0,114,0,0,0,0,0,0,0,42,42,42,32,99,111,119,32,102,97,105,108,101,100,32,40,100,114,105,118,101,61,37,117,32,102,105,108,101,61,37,115,41,10,0,0,0,0,0,0,83,104,111,119,67,117,114,115,111,114,0,0,0,0,0,0,77,79,86,69,46,87,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,58,32,115,105,103,110,97,108,32,37,100,10,0,72,105,100,101,67,117,114,115,111,114,0,0,0,0,0,0,115,0,0,0,0,0,0,0,78,66,67,68,46,66,0,0,121,101,115,0,0,0,0,0,37,117,0,0,0,0,0,0,110,117,108,108,0,0,0,0,112,97,114,115,101,32,101,114,114,111,114,32,98,101,102,111,114,101,0,0,0,0,0,0,116,100,48,58,32,104,101,97,100,101,114,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,83,101,116,67,117,114,115,111,114,0,0,0,0,0,0,0,109,102,109,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,116,114,97,99,107,32,104,101,97,100,101,114,41,10,0,112,115,105,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,112,102,100,99,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,100,99,52,50,58,32,100,97,116,97,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,0,73,110,105,116,67,117,114,115,111,114,0,0,0,0,0,0,83,87,65,80,0,0,0,0,32,45,0,0,0,0,0,0,46,105,109,97,103,101,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,0,83,101,116,73,116,101,109,67,109,100,0,0,0,0,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,108,117,41,10,0,0,0,0,0,0,69,88,84,46,87,0,0,0,114,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,83,101,116,86,111,108,0,0,99,104,97,114,45,112,116,121,58,32,37,115,10,0,0,0,119,114,105,116,101,0,0,0,109,115,121,115,0,0,0,0,71,101,116,73,116,101,109,67,109,100,0,0,0,0,0,0,112,111,115,105,120,0,0,0,69,88,84,46,76,0,0,0,119,98,0,0,0,0,0,0,114,43,98,0,0,0,0,0,116,114,117,101,0,0,0,0,70,105,120,68,105,118,0,0,69,88,84,66,46,76,0,0,101,109,117,46,118,105,100,101,111,46,98,114,105,103,104,116,110,101,115,115,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,50,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,104,101,108,112,0,0,0,0,85,115,101,114,68,101,108,97,121,0,0,0,0,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,0,0,0,0,0,84,83,84,46,66,0,0,0,105,109,97,103,101,0,0,0,45,62,0,0,0,0,0,0,108,111,119,112,97,115,115,0,84,82,65,80,0,0,0,0,70,114,97,99,68,105,118,0,84,83,84,46,87,0,0,0,70,114,97,99,77,117,108,0,114,101,103,32,91,118,97,108,93,0,0,0,0,0,0,0,84,83,84,46,76,0,0,0,70,114,97,99,83,113,114,116,0,0,0,0,0,0,0,0,70,114,97,99,83,105,110,0,68,37,117,58,68,37,117,0,70,114,97,99,67,111,115,0,77,85,76,85,46,76,0,0,88,50,70,114,97,99,0,0,68,73,86,85,46,76,0,0,70,114,97,99,50,88,0,0,71,101,116,86,111,108,0,0,88,50,70,105,120,0,0,0,70,105,120,50,88,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,47,0,0,0,0,0,0,0,117,115,97,103,101,58,32,112,99,101,45,109,97,99,112,108,117,115,32,91,111,112,116,105,111,110,115,93,0,0,0,0,70,114,97,99,50,70,105,120,0,0,0,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,110,117,108,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,77,79,86,69,0,0,0,0,114,97,109,0,0,0,0,0,97,0,0,0,0,0,0,0,37,115,32,37,48,50,88,0,115,111,117,110,100,0,0,0,65,86,69,67,0,0,0,0,70,105,120,50,70,114,97,99,0,0,0,0,0,0,0,0,85,78,76,75,0,0,0,0,70,105,120,50,76,111,110,103,0,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,97,100,98,45,107,98,100,58,32,108,105,115,116,101,110,32,37,117,10,0,0,0,0,0,76,73,78,75,0,0,0,0,114,98,0,0,0,0,0,0,112,99,0,0,0,0,0,0,76,111,110,103,50,70,105,120,0,0,0,0,0,0,0,0,84,82,65,80,0,0,0,0,84,69,83,116,121,108,101,78,101,119,0,0,0,0,0,0,77,79,86,69,67,0,0,0,85,83,80,0,0,0,0,0,84,69,68,105,115,112,97,116,99,104,0,0,0,0,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,84,69,71,101,116,79,102,102,115,101,116,0,0,0,0,0,84,82,65,80,86,0,0,0,84,114,97,99,107,66,111,120,0,0,0,0,0,0,0,0,114,97,109,0,0,0,0,0,70,108,117,115,104,86,111,108,0,0,0,0,0,0,0,0,90,111,111,109,87,105,110,100,111,119,0,0,0,0,0,0,83,101,101,100,70,105,108,108,0,0,0,0,0,0,0,0,101,109,117,46,115,101,114,112,111,114,116,46,102,105,108,101,0,0,0,0,0,0,0,0,67,97,108,99,77,97,115,107,0,0,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,96,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,58,32,77,97,99,105,110,116,111,115,104,32,80,108,117,115,32,101,109,117,108,97,116,111,114,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,115,100,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,0,83,84,79,80,0,0,0,0,114,98,0,0,0,0,0,0,94,61,0,0,0,0,0,0,45,45,32,37,115,61,37,100,10,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,70,82,77,84,0,0,0,0,77,101,97,115,117,114,101,84,101,120,116,0,0,0,0,0,71,101,116,77,97,115,107,84,97,98,108,101,0,0,0,0,101,120,101,99,117,116,101,32,116,111,32,110,101,120,116,32,114,116,101,0,0,0,0,0,82,69,83,69,84,0,0,0,99,111,119,0,0,0,0,0,70,111,110,116,77,101,116,114,105,99,115,0,0,0,0,0,37,115,10,10,0,0,0,0,83,101,116,70,83,99,97,108,101,68,105,115,97,98,108,101,0,0,0,0,0,0,0,0,65,68,68,81,46,66,0,0,83,82,0,0,0,0,0,0,83,99,114,110,66,105,116,77,97,112,0,0,0,0,0,0,60,110,111,110,101,62,0,0,65,68,68,81,46,87,0,0,80,97,99,107,49,53,0,0,65,68,68,81,46,76,0,0,80,97,99,107,49,52,0,0,73,87,77,58,32,68,37,117,32,84,114,97,99,107,32,37,117,32,32,32,32,13,0,0,84,82,65,80,76,69,0,0,80,97,99,107,49,51,0,0,83,101,116,69,79,70,0,0,112,99,101,45,109,97,99,112,108,117,115,58,32,115,101,103,109,101,110,116,97,116,105,111,110,32,102,97,117,108,116,10,0,0,0,0,0,0,0,0,84,82,65,80,71,84,0,0,80,97,99,107,49,50,0,0,84,82,65,80,76,84,0,0,101,109,117,46,115,101,114,112,111,114,116,46,100,114,105,118,101,114,0,0,0,0,0,0,56,0,0,0,0,0,0,0,66,97,99,107,113,117,111,116,101,0,0,0,0,0,0,0,37,108,117,0,0,0,0,0,101,108,115,101,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,32,118,101,114,115,105,111,110,32,50,48,49,52,48,51,49,49,45,101,57,99,97,48,100,57,45,109,111,100,10,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,48,55,45,50,48,49,50,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,80,97,99,107,49,49,0,0,115,100,108,0,0,0,0,0,84,82,65,80,71,69,0,0,102,105,108,101,0,0,0,0,38,61,0,0,0,0,0,0,82,73,0,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,70,88,88,88,0,0,0,0,80,97,99,107,49,48,0,0,84,82,65,80,77,73,0,0,80,97,99,107,57,0,0,0,114,116,101,0,0,0,0,0,84,82,65,80,80,76,0,0,67,111,109,112,111,110,101,110,116,68,105,115,112,97,116,99,104,0,0,0,0,0,0,0,37,52,117,32,32,0,0,0,105,119,109,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,100,105,115,107,41,10,0,0,0,84,82,65,80,86,83,0,0,49,0,0,0,0,0,0,0,76,97,121,101,114,68,105,115,112,97,116,99,104,0,0,0,84,82,65,80,86,67,0,0,119,97,118,0,0,0,0,0,83,104,111,119,68,73,116,101,109,0,0,0,0,0,0,0,84,82,65,80,69,81,0,0,115,110,100,45,115,100,108,58,32,101,114,114,111,114,32,105,110,105,116,105,97,108,105,122,105,110,103,32,97,117,100,105,111,32,115,117,98,115,121,115,116,101,109,32,40,37,115,41,10,0,0,0,0,0,0,0,72,105,100,101,68,73,116,101,109,0,0,0,0,0,0,0,84,82,65,80,78,69,0,0,119,97,118,102,105,108,116,101,114,0,0,0,0,0,0,0,73,110,115,77,101,110,117,73,116,101,109,0,0,0,0,0,84,82,65,80,67,83,0,0,71,101,116,69,79,70,0,0,66,70,73,78,83,0,0,0,65,108,105,97,115,68,105,115,112,97,116,99,104,0,0,0,84,82,65,80,67,67,0,0,82,101,115,111,117,114,99,101,68,105,115,112,97,116,99,104,0,0,0,0,0,0,0,0,84,82,65,80,76,83,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,112,99,101,0,0,0,0,0,55,0,0,0,0,0,0,0,80,97,117,115,101,0,0,0,45,0,0,0,0,0,0,0,59,0,0,0,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,32,118,101,114,115,105,111,110,32,50,48,49,52,48,51,49,49,45,101,57,99,97,48,100,57,45,109,111,100,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,48,55,45,50,48,49,50,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,0,77,97,120,83,105,122,101,82,115,114,99,0,0,0,0,0,42,42,42,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,32,39,120,49,49,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,111,112,116,105,111,110,97,108,0,0,0,0,0,0,0,0,84,82,65,80,72,73,0,0,124,61,0,0,0,0,0,0,67,68,0,0,0,0,0,0,97,100,100,114,61,48,120,37,48,54,108,88,32,119,61,37,117,32,104,61,37,117,32,98,114,105,103,104,116,61,37,117,37,37,10,0,0,0,0,0,65,88,88,88,0,0,0,0,71,101,116,49,78,97,109,101,100,82,101,115,111,117,114,99,101,0,0,0,0,0,0,0,84,82,65,80,70,0,0,0,71,101,116,49,82,101,115,111,117,114,99,101,0,0,0,0,114,101,115,101,116,0,0,0,84,82,65,80,84,0,0,0,116,99,58,32,117,110,107,110,111,119,110,32,109,97,114,107,32,48,120,37,48,50,120,32,40,37,115,44,32,99,61,37,117,44,32,104,61,37,117,44,32,98,105,116,61,37,108,117,47,37,108,117,41,10,0,0,73,110,118,97,108,77,101,110,117,66,97,114,0,0,0,0,68,66,76,69,0,0,0,0,67,111,117,110,116,49,84,121,112,101,115,0,0,0,0,0,68,66,71,84,0,0,0,0,37,115,37,48,56,108,88,0,72,67,114,101,97,116,101,82,101,115,70,105,108,101,0,0,68,66,76,84,0,0,0,0,72,79,112,101,110,82,101,115,70,105,108,101,0,0,0,0,68,66,71,69,0,0,0,0,112,102,100,99,58,32,99,114,99,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,88,77,117,110,103,101,114,0,68,66,77,73,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,50,32,102,105,108,101,10,0,0,0,0,0,0,0,65,108,108,111,99,97,116,101,0,0,0,0,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,49,32,102,105,108,101,10,0,0,0,0,0,0,0,70,105,120,65,116,97,110,50,0,0,0,0,0,0,0,0,115,111,110,121,58,32,114,101,97,100,32,101,114,114,111,114,32,97,116,32,37,117,47,37,117,47,37,117,10,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,48,32,102,105,108,101,10,0,0,0,0,0,0,0,68,66,80,76,0,0,0,0,115,99,115,105,58,32,109,111,100,101,32,115,101,110,115,101,58,32,117,110,107,110,111,119,110,32,109,111,100,101,32,112,97,103,101,32,40,37,48,50,88,41,10,0,0,0,0,0,67,111,112,121,77,97,115,107,0,0,0,0,0,0,0,0,68,66,86,83,0,0,0,0,101,109,117,46,114,101,97,108,116,105,109,101,46,116,111,103,103,108,101,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,54,0,0,0,0,0,0,0,83,99,114,76,107,0,0,0,43,0,0,0,0,0,0,0,99,97,110,39,116,32,111,112,101,110,32,105,110,99,108,117,100,101,32,102,105,108,101,58,0,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,99,111,110,102,105,103,32,102,105,108,101,32,102,97,105,108,101,100,10,0,80,97,99,107,56,0,0,0,120,49,49,0,0,0,0,0,114,101,97,100,111,110,108,121,0,0,0,0,0,0,0,0,68,66,86,67,0,0,0,0,62,62,61,0,0,0,0,0,119,98,0,0,0,0,0,0,68,83,82,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,44,32,115,107,105,112,32,99,97,108,108,115,32,91,49,93,0,0,0,0,0,0,0,0,86,73,68,69,79,58,0,0,84,82,65,67,69,0,0,0,83,67,83,73,68,105,115,112,97,116,99,104,0,0,0,0,68,66,69,81,0,0,0,0,83,101,116,70,114,97,99,116,69,110,97,98,108,101,0,0,91,99,110,116,93,0,0,0,68,66,78,69,0,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,32,115,101,99,116,111,114,32,100,97,116,97,32,116,111,111,32,98,105,103,32,40,37,117,41,10,0,0,0,0,0,0,0,0,84,69,65,117,116,111,86,105,101,119,0,0,0,0,0,0,68,66,67,83,0,0,0,0,84,69,80,105,110,83,99,114,111,108,108,0,0,0,0,0,68,66,67,67,0,0,0,0,35,37,115,37,88,0,0,0,84,69,83,101,108,86,105,101,119,0,0,0,0,0,0,0,68,66,76,83,0,0,0,0,85,110,105,113,117,101,49,73,68,0,0,0,0,0,0,0,68,66,72,73,0,0,0,0,71,101,116,49,73,120,84,121,112,101,0,0,0,0,0,0,68,66,70,0,0,0,0,0,71,101,116,49,73,120,82,101,115,111,117,114,99,101,0,0,77,111,117,110,116,86,111,108,0,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,115,111,110,121,58,32,114,101,97,100,32,101,114,114,111,114,10,0,0,0,0,0,0,0,68,66,84,0,0,0,0,0,65,80,80,76,69,32,67,79,77,80,85,84,69,82,44,32,73,78,67,0,0,0,0,0,67,111,117,110,116,49,82,101,115,111,117,114,99,101,115,0,83,76,69,0,0,0,0,0,101,109,117,46,114,101,97,108,116,105,109,101,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,53,0,0,0,0,0,0,0,83,99,114,111,108,108,76,111,99,107,0,0,0,0,0,0,62,62,0,0,0,0,0,0,63,0,0,0,0,0,0,0,98,97,115,101,0,0,0,0,102,105,108,101,61,34,37,115,34,10,0,0,0,0,0,0,82,71,101,116,82,101,115,111,117,114,99,101,0,0,0,0,69,83,67,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,111,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,103,0,0,0,83,71,84,0,0,0,0,0,60,60,61,0,0,0,0,0,114,98,0,0,0,0,0,0,82,84,83,0,0,0,0,0,46,97,110,97,0,0,0,0,98,114,105,103,104,116,110,101,115,115,0,0,0,0,0,0,80,82,73,86,0,0,0,0,80,111,112,85,112,77,101,110,117,83,101,108,101,99,116,0,83,76,84,0,0,0,0,0,71,101,116,87,86,97,114,105,97,110,116,0,0,0,0,0,112,0,0,0,0,0,0,0,83,71,69,0,0,0,0,0,71,101,116,67,86,97,114,105,97,110,116,0,0,0,0,0,83,77,73,0,0,0,0,0,73,110,105,116,80,114,111,99,77,101,110,117,0,0,0,0,83,80,76,0,0,0,0,0,35,37,115,37,48,56,108,88,0,0,0,0,0,0,0,0,83,110,100,78,101,119,67,104,97,110,110,101,108,0,0,0,83,86,83,0,0,0,0,0,83,110,100,67,111,110,116,114,111,108,0,0,0,0,0,0,114,98,0,0,0,0,0,0,103,99,114,58,32,100,97,116,97,32,99,114,99,32,101,114,114,111,114,32,40,37,117,47,37,117,47,37,117,41,10,0,49,0,0,0,0,0,0,0,83,86,67,0,0,0,0,0,102,105,108,101,0,0,0,0,69,120,116,114,97,49,54,0,83,110,100,80,108,97,121,0,115,121,109,108,105,110,107,0,83,69,81,0,0,0,0,0,85,110,109,111,117,110,116,86,111,108,0,0,0,0,0,0,69,120,116,114,97,49,53,0,102,105,108,101,0,0,0,0,83,110,100,68,111,73,109,109,101,100,105,97,116,101,0,0,115,111,110,121,58,32,110,111,110,45,97,108,105,103,110,101,100,32,114,101,97,100,10,0,83,78,69,0,0,0,0,0,67,108,111,115,101,0,0,0,115,99,115,105,58,32,115,116,97,114,116,47,115,116,111,112,32,117,110,105,116,32,37,117,32,40,37,115,41,10,0,0,69,120,116,114,97,49,52,0,112,114,111,116,111,99,111,108,0,0,0,0,0,0,0,0,83,110,100,68,111,67,111,109,109,97,110,100,0,0,0,0,83,67,83,0,0,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,121,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,80,114,116,83,99,110,0,0,60,60,0,0,0,0,0,0,69,120,116,114,97,49,51,0,105,110,99,108,117,100,101,0,97,100,100,114,101,115,115,0,83,110,100,65,100,100,77,111,100,105,102,105,101,114,0,0,67,79,78,70,73,71,58,0,100,114,105,118,101,114,61,37,115,32,69,83,67,61,37,115,32,97,115,112,101,99,116,61,37,117,47,37,117,32,109,105,110,95,115,105,122,101,61,37,117,42,37,117,32,115,99,97,108,101,61,37,117,32,109,111,117,115,101,61,91,37,117,47,37,117,32,37,117,47,37,117,93,10,0,0,0,0,0,0,82,79,77,58,0,0,0,0,115,105,122,101,109,0,0,0,83,67,67,0,0,0,0,0,47,61,0,0,0,0,0,0,46,120,100,102,0,0,0,0,68,84,82,0,0,0,0,0,69,120,116,114,97,49,50,0,99,111,108,111,114,49,0,0,79,70,76,87,0,0,0,0,83,110,100,68,105,115,112,111,115,101,67,104,97,110,110,101,108,0,0,0,0,0,0,0,83,76,83,0,0,0,0,0,69,120,116,114,97,49,49,0,83,111,117,110,100,68,105,115,112,97,116,99,104,0,0,0,115,101,116,32,104,97,108,116,32,115,116,97,116,101,32,91,50,93,0,0,0,0,0,0,83,72,73,0,0,0,0,0,69,120,116,114,97,49,48,0,109,111,117,115,101,0,0,0,72,87,80,114,105,118,0,0,83,70,0,0,0,0,0,0,114,98,0,0,0,0,0,0,69,120,116,114,97,57,0,0,80,67,69,32,82,79,77,32,101,120,116,101,110,115,105,111,110,32,110,111,116,32,102,111,117,110,100,10,0,0,0,0,69,103,114,101,116,68,105,115,112,97,116,99,104,0,0,0,83,84,0,0,0,0,0,0,114,98,0,0,0,0,0,0,35,37,115,37,48,50,88,0,69,120,116,114,97,56,0,0,114,98,0,0,0,0,0,0,84,114,97,110,115,108,97,116,101,50,52,116,111,51,50,0,83,85,66,81,46,66,0,0,69,120,116,114,97,55,0,0,68,79,83,69,77,85,0,0,83,121,115,69,110,118,105,114,111,110,115,0,0,0,0,0,83,85,66,81,46,87,0,0,69,120,116,114,97,54,0,0,68,101,102,101,114,85,115,101,114,70,110,0,0,0,0,0,83,85,66,81,46,76,0,0,83,101,116,70,105,108,101,73,110,102,111,0,0,0,0,0,69,120,116,114,97,53,0,0,68,101,98,117,103,85,116,105,108,0,0,0,0,0,0,0,115,111,110,121,58,32,119,114,105,116,101,32,101,114,114,111,114,10,0,0,0,0,0,0,66,76,69,0,0,0,0,0,108,111,97,100,32,109,101,100,105,97,0,0,0,0,0,0,69,120,116,114,97,52,0,0,67,111,109,109,84,111,111,108,98,111,120,68,105,115,112,97,116,99,104,0,0,0,0,0,66,71,84,0,0,0,0,0,80,67,69,68,73,83,75,32,32,32,32,32,32,32,32,32,0,0,0,0,0,0,0,0,101,109,117,46,112,97,117,115,101,0,0,0,0,0,0,0,99,111,109,109,105,116,0,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,120,0,0,0,0,0,0,0,51,0,0,0,0,0,0,0,80,114,105,110,116,83,99,114,101,101,110,0,0,0,0,0,62,0,0,0,0,0,0,0,69,120,116,114,97,51,0,0,105,102,0,0,0,0,0,0,121,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,83,108,101,101,112,0,0,0,84,69,82,77,58,0,0,0,114,111,109,0,0,0,0,0,115,105,122,101,107,0,0,0,66,76,84,0,0,0,0,0,42,61,0,0,0,0,0,0,46,116,100,48,0,0,0,0,67,84,83,0,0,0,0,0,69,120,116,114,97,50,0,0,99,111,108,111,114,48,0,0,67,72,75,0,0,0,0,0,73,79,80,77,111,118,101,68,97,116,97,0,0,0,0,0,66,71,69,0,0,0,0,0,114,98,0,0,0,0,0,0,69,120,116,114,97,49,0,0,73,79,80,77,115,103,82,101,113,117,101,115,116,0,0,0,91,118,97,108,93,0,0,0,66,77,73,0,0,0,0,0,82,105,103,104,116,0,0,0,73,79,80,73,110,102,111,65,99,99,101,115,115,0,0,0,66,80,76,0,0,0,0,0,68,111,119,110,0,0,0,0,80,77,103,114,79,112,0,0,66,86,83,0,0,0,0,0,76,101,102,116,0,0,0,0,71,101,116,79,83,68,101,102,97,117,108,116,0,0,0,0,66,86,67,0,0,0,0,0,85,112,0,0,0,0,0,0,83,101,116,79,83,68,101,102,97,117,108,116,0,0,0,0,66,69,81,0,0,0,0,0,101,109,117,46,99,112,117,46,109,111,100,101,108,0,0,0,98,111,114,100,101,114,0,0,80,97,103,101,68,111,119,110,0,0,0,0,0,0,0,0,66,76,75,32,37,48,52,88,58,32,65,49,61,37,48,56,108,88,32,65,50,61,37,48,56,108,88,32,83,61,37,48,56,108,88,32,82,79,61,37,100,10,0,0,0,0,0,0,68,84,73,110,115,116,97,108,108,0,0,0,0,0,0,0,66,78,69,0,0,0,0,0,119,98,0,0,0,0,0,0,71,101,116,70,105,108,101,73,110,102,111,0,0,0,0,0,69,110,100,0,0,0,0,0,83,101,116,86,105,100,101,111,68,101,102,97,117,108,116,0,115,111,110,121,58,32,110,111,110,45,97,108,105,103,110,101,100,32,119,114,105,116,101,10,0,0,0,0,0,0,0,0,66,67,83,0,0,0,0,0,101,106,101,99,116,32,109,101,100,105,97,0,0,0,0,0,68,101,108,101,116,101,0,0,70,49,0,0,0,0,0,0,114,43,98,0,0,0,0,0,119,43,98,0,0,0,0,0,71,101,116,86,105,100,101,111,68,101,102,97,117,108,116,0,66,67,67,0,0,0,0,0,58,0,0,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,50,0,0,0,0,0,0,0,70,49,50,0,0,0,0,0,60,0,0,0,0,0,0,0,80,97,103,101,85,112,0,0,61,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,102,111,114,109,97,116,0,0,73,110,116,101,114,110,97,108,87,97,105,116,0,0,0,0,109,111,117,115,101,95,100,105,118,95,121,0,0,0,0,0,109,97,99,112,108,117,115,0,42,42,42,32,108,111,97,100,105,110,103,32,114,97,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,0,0,0,0,66,76,83,0,0,0,0,0,45,61,0,0,0,0,0,0,65,32,32,37,48,56,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,114,98,0,0,0,0,0,0,82,101,108,101,97,115,101,32,54,46,48,10,36,48,0,0,46,116,99,0,0,0,0,0,112,97,116,104,0,0,0,0,45,45,32,37,108,117,32,37,117,37,115,37,117,10,0,0,102,97,108,115,101,0,0,0,72,111,109,101,0,0,0,0,104,97,108,116,0,0,0,0,104,101,105,103,104,116,0,0,68,73,86,90,0,0,0,0,83,101,116,68,101,102,97,117,108,116,83,116,97,114,116,117,112,0,0,0,0,0,0,0,66,72,73,0,0,0,0,0,73,110,115,101,114,116,0,0,71,101,116,68,101,102,97,117,108,116,83,116,97,114,116,117,112,0,0,0,0,0,0,0,60,110,111,110,101,62,0,0,76,111,97,100,58,0,0,0,66,83,82,0,0,0,0,0,100,114,105,118,101,114,0,0,102,105,108,101,0,0,0,0,75,80,95,80,101,114,105,111,100,0,0,0,0,0,0,0,65,68,66,79,112,0,0,0,68,73,83,75,58,0,0,0,66,82,65,0,0,0,0,0,99,112,117,0,0,0,0,0,75,80,95,48,0,0,0,0,65,68,66,82,101,73,110,105,116,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,46,83,0,0,0,0,0,0,116,114,117,101,0,0,0,0,119,98,0,0,0,0,0,0,115,110,100,45,115,100,108,58,32,101,114,114,111,114,32,111,112,101,110,105,110,103,32,111,117,116,112,117,116,32,40,37,115,41,10,0,0,0,0,0,108,111,119,112,97,115,115,0,45,0,0,0,0,0,0,0,75,80,95,69,110,116,101,114,0,0,0,0,0,0,0,0,116,100,48,58,32,97,100,118,97,110,99,101,100,32,99,111,109,112,114,101,115,115,105,111,110,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,83,101,116,65,68,66,73,110,102,111,0,0,0,0,0,0,102,109,0,0,0,0,0,0,77,79,86,69,81,0,0,0,115,116,120,58,32,98,97,100,32,109,97,103,105,99,10,0,112,115,105,58,32,99,114,99,32,101,114,114,111,114,10,0,112,102,100,99,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,0,0,0,0,0,0,0,75,80,95,51,0,0,0,0,73,77,68,32,49,46,49,55,58,32,37,50,100,47,37,50,100,47,37,52,100,32,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,0,0,6,78,111,110,97,109,101,0,71,101,116,65,68,66,73,110,102,111,0,0,0,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,0,0,68,73,86,85,46,87,0,0,75,80,95,50,0,0,0,0,46,99,112,50,0,0,0,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,71,101,116,73,110,100,65,68,66,0,0,0,0,0,0,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,79,82,46,66,0,0,0,0,119,98,0,0,0,0,0,0,102,108,117,115,104,0,0,0,42,42,42,32,101,114,114,111,114,32,99,114,101,97,116,105,110,103,32,115,121,109,108,105,110,107,32,37,115,32,45,62,32,37,115,10,0,0,0,0,82,101,110,97,109,101,0,0,114,101,97,100,0,0,0,0,109,105,99,114,111,115,111,102,116,0,0,0,0,0,0,0,75,80,95,49,0,0,0,0,67,111,117,110,116,65,68,66,115,0,0,0,0,0,0,0,110,117,108,108,0,0,0,0,115,111,110,121,58,32,112,114,105,109,101,58,32,117,110,107,110,111,119,110,32,40,116,114,97,112,61,48,120,37,48,52,120,41,10,0,0,0,0,0,114,43,98,0,0,0,0,0,83,66,67,68,46,66,0,0,114,43,98,0,0,0,0,0,114,43,98,0,0,0,0,0,114,98,0,0,0,0,0,0,115,116,97,114,116,32,109,111,116,111,114,0,0,0,0,0,75,80,95,54,0,0,0,0,114,43,98,0,0,0,0,0,83,73,110,116,82,101,109,111,118,101,0,0,0,0,0,0,79,82,46,87,0,0,0,0,101,109,117,46,105,119,109,46,115,116,97,116,117,115,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,70,49,49,0,0,0,0,0,62,61,0,0,0,0,0,0,75,80,95,53,0,0,0,0,63,61,0,0,0,0,0,0,113,0,0,0,0,0,0,0,108,111,97,100,0,0,0,0,83,73,110,116,73,110,115,116,97,108,108,0,0,0,0,0,109,111,117,115,101,95,109,117,108,95,121,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,42,42,42,32,109,101,109,111,114,121,32,98,108,111,99,107,32,99,114,101,97,116,105,111,110,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,98,108,111,99,107,115,0,0,79,82,46,76,0,0,0,0,43,61,0,0,0,0,0,0,83,32,32,37,48,52,88,58,37,48,52,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,0,0,0,116,100,48,58,32,99,111,109,109,101,110,116,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,82,101,108,101,97,115,101,32,53,46,48,49,36,48,0,0,46,115,116,120,0,0,0,0,63,0,0,0,0,0,0,0,75,80,95,52,0,0,0,0,119,105,100,116,104,0,0,0,73,76,76,71,0,0,0,0,68,111,86,66,76,84,97,115,107,0,0,0,0,0,0,0,68,73,86,83,46,87,0,0,65,116,116,97,99,104,86,66,76,0,0,0,0,0,0,0,75,80,95,80,108,117,115,0,42,42,42,32,117,110,107,110,111,119,110,32,109,111,100,101,108,32,40,37,115,41,10,0,114,117,110,0,0,0,0,0,83,85,66,65,46,87,0,0,83,108,111,116,86,82,101,109,111,118,101,0,0,0,0,0,75,80,95,57,0,0,0,0,109,97,99,45,99,108,97,115,115,105,99,0,0,0,0,0,83,85,66,46,66,0,0,0,83,108,111,116,86,73,110,115,116,97,108,108,0,0,0,0,75,80,95,56,0,0,0,0,109,97,99,45,115,101,0,0,83,85,66,88,46,66,0,0,83,108,111,116,77,97,110,97,103,101,114,0,0,0,0,0,37,115,37,115,37,48,52,88,40,65,37,117,41,0,0,0,75,80,95,55,0,0,0,0,109,111,100,101,108,61,37,115,10,0,0,0,0,0,0,0,83,85,66,46,87,0,0,0,73,110,105,116,69,118,101,110,116,115,0,0,0,0,0,0,75,80,95,77,105,110,117,115,0,0,0,0,0,0,0,0,83,89,83,84,69,77,58,0,83,85,66,88,46,87,0,0,73,110,105,116,70,83,0,0,75,80,95,83,116,97,114,0,109,97,99,45,112,108,117,115,0,0,0,0,0,0,0,0,83,85,66,46,76,0,0,0,72,83,101,116,83,116,97,116,101,0,0,0,0,0,0,0,79,112,101,110,82,70,0,0,75,80,95,83,108,97,115,104,0,0,0,0,0,0,0,0,115,121,115,116,101,109,0,0,115,111,110,121,58,32,102,111,114,109,97,116,116,101,100,32,100,105,115,107,32,40,37,108,117,32,98,108,111,99,107,115,41,10,0,0,0,0,0,0,83,85,66,88,46,76,0,0,72,71,101,116,83,116,97,116,101,0,0,0,0,0,0,0,115,116,111,112,32,109,111,116,111,114,0,0,0,0,0,0,78,117,109,76,111,99,107,0,100,105,115,97,98,108,105,110,103,32,109,101,109,111,114,121,32,116,101,115,116,10,0,0,83,85,66,65,46,76,0,0,101,109,117,46,105,119,109,46,114,119,0,0,0,0,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,72,67,108,114,82,66,105,116,0,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,70,49,48,0,0,0,0,0,60,61,0,0,0,0,0,0,67,116,114,108,82,105,103,104,116,0,0,0,0,0,0,0,125,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,98,105,110,97,114,121,0,0,82,65,77,58,0,0,0,0,109,111,117,115,101,95,100,105,118,95,120,0,0,0,0,0,99,112,117,46,115,112,101,101,100,32,61,32,0,0,0,0,60,110,111,110,101,62,0,0,115,0,0,0,0,0,0,0,32,37,115,0,0,0,0,0,67,77,80,46,66,0,0,0,69,32,32,34,37,115,34,10,0,0,0,0,0,0,0,0,116,100,48,58,32,114,101,97,100,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,82,101,108,101,97,115,101,32,52,46,48,48,36,48,0,0,72,83,101,116,82,66,105,116,0,0,0,0,0,0,0,0,46,115,116,0,0,0,0,0,69,0,0,0,0,0,0,0,77,101,110,117,0,0,0,0,97,100,100,114,101,115,115,0,65,68,68,82,0,0,0,0,109,101,109,116,101,115,116,0,67,77,80,46,87,0,0,0,78,101,119,69,109,112,116,121,72,97,110,100,108,101,0,0,87,105,110,100,111,119,115,82,105,103,104,116,0,0,0,0,42,42,42,32,82,79,77,32,110,111,116,32,102,111,117,110,100,32,97,116,32,52,48,48,48,48,48,10,0,0,0,0,105,103,110,111,114,105,110,103,32,112,99,101,32,107,101,121,58,32,48,120,37,48,52,120,32,40,37,115,41,10,0,0,97,100,98,58,32,117,110,107,110,111,119,110,32,99,109,100,32,40,37,48,50,88,41,10,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+49068);
function runPostSets() {


}

var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
      return (ptr-num)|0;
    }var _llvm_memset_p0i8_i64=_memset;

  
  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    }function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

  function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg) {
      Module['noExitRuntime'] = true;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from non-main loop sources
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        if (Module['preMainLoop']) {
          Module['preMainLoop']();
        }
  
        try {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        } catch (e) {
          if (e instanceof ExitStatus) {
            return;
          } else {
            if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
            throw e;
          }
        }
  
        if (Module['postMainLoop']) {
          Module['postMainLoop']();
        }
  
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from the main loop itself
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
        Browser.mainLoop.scheduler();
      }
      if (fps && fps > 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          setTimeout(Browser.mainLoop.runner, 1000/fps); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      }
      Browser.mainLoop.scheduler();
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }

  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        
        // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
        // Module['forcedAspectRatio'] = 4 / 3;
        
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'] ||
                                    canvas['msRequestPointerLock'] ||
                                    function(){};
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 document['msExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};
  
  function _SDL_GetTicks() {
      return Math.floor(Date.now() - SDL.startTime);
    }var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,glAttributes:{0:3,1:3,2:2,3:0,4:0,5:1,6:16,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:1,16:0,17:0,18:0},keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,initFlags:0,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},TOUCH_DEFAULT_ID:0,keyCodes:{16:1249,17:1248,18:1250,20:1081,33:1099,34:1102,35:1101,36:1098,37:1104,38:1106,39:1103,40:1105,44:316,45:1097,46:127,91:1251,93:1125,96:1122,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,106:1109,107:1111,109:1110,110:1123,111:1108,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,124:1128,125:1129,126:1130,127:1131,128:1132,129:1133,130:1134,131:1135,132:1136,133:1137,134:1138,135:1139,144:1107,160:94,161:33,162:34,163:35,164:36,165:37,166:38,167:95,168:40,169:41,170:42,171:43,172:124,173:45,174:123,175:125,176:126,181:127,182:129,183:128,188:44,190:46,191:47,192:96,219:91,220:92,221:93,222:39},scanCodes:{8:42,9:43,13:40,27:41,32:44,35:204,39:53,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,58:203,59:51,61:46,91:47,92:49,93:48,96:52,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,127:76,305:224,308:226,316:70},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
        };
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var is_SDL_HWSURFACE = flags & 0x00000001;
        var is_SDL_HWPALETTE = flags & 0x00200000;
        var is_SDL_OPENGL = flags & 0x04000000;
  
        var surf = _malloc(60);
        var pixelFormat = _malloc(44);
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        var buffer = 0;
  
        // preemptively initialize this for software surfaces,
        // otherwise it will be lazily initialized inside of SDL_LockSurface
        if (!is_SDL_HWSURFACE && !is_SDL_OPENGL) {
          buffer = _malloc(width * height * 4);
        }
  
        HEAP32[((surf)>>2)]=flags;
        HEAP32[(((surf)+(4))>>2)]=pixelFormat;
        HEAP32[(((surf)+(8))>>2)]=width;
        HEAP32[(((surf)+(12))>>2)]=height;
        HEAP32[(((surf)+(16))>>2)]=width * bpp;  // assuming RGBA or indexed for now,
                                                                                          // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer;
        HEAP32[(((surf)+(36))>>2)]=0;
        HEAP32[(((surf)+(56))>>2)]=1;
  
        HEAP32[((pixelFormat)>>2)]=0 /* XXX missing C define SDL_PIXELFORMAT_RGBA8888 */;
        HEAP32[(((pixelFormat)+(4))>>2)]=0;// TODO
        HEAP8[(((pixelFormat)+(8))|0)]=bpp * 8;
        HEAP8[(((pixelFormat)+(9))|0)]=bpp;
  
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff;
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00;
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000;
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000;
  
        // Decide if we want to use WebGL or not
        SDL.GL = SDL.GL || is_SDL_OPENGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
  
        var webGLContextAttributes = {
          antialias: ((SDL.glAttributes[13 /*SDL_GL_MULTISAMPLEBUFFERS*/] != 0) && (SDL.glAttributes[14 /*SDL_GL_MULTISAMPLESAMPLES*/] > 1)),
          depth: (SDL.glAttributes[6 /*SDL_GL_DEPTH_SIZE*/] > 0),
          stencil: (SDL.glAttributes[7 /*SDL_GL_STENCIL_SIZE*/] > 0)
        };
        
        var ctx = Browser.createContext(canvas, is_SDL_OPENGL, usePageCanvas, webGLContextAttributes);
              
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
  
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
  
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
        
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
  
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
        
        var buffer  = surfData.buffer;
        var data    = surfData.image.data;
        var colors  = surfData.colors;
  
        for (var y = startY; y < endY; ++y) {
          var indexBase = y * fullWidth;
          var colorBase = indexBase * 4;
          for (var x = startX; x < endX; ++x) {
            // HWPALETTE have only 256 colors (not rgba)
            var index = HEAPU8[((buffer + indexBase + x)|0)] * 3;
            var colorOffset = colorBase + x * 4;
  
            data[colorOffset   ] = colors[index   ];
            data[colorOffset +1] = colors[index +1];
            data[colorOffset +2] = colors[index +2];
            //unused: data[colorOffset +3] = color[index +3];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + 56;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
  
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        if (info.buffer) _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
  
        if (surf === SDL.screen) {
          SDL.screen = null;
        }
      },downFingers:{},savedKeydown:null,receiveEvent:function (event) {
        switch(event.type) {
          case 'touchstart': case 'touchmove': {
            event.preventDefault();
  
            var touches = [];
            
            // Clear out any touchstart events that we've already processed
            if (event.type === 'touchstart') {
              for (var i = 0; i < event.touches.length; i++) {
                var touch = event.touches[i];
                if (SDL.downFingers[touch.identifier] != true) {
                  SDL.downFingers[touch.identifier] = true;
                  touches.push(touch);
                }
              }
            } else {
              touches = event.touches;
            }
            
            var firstTouch = touches[0];
            if (event.type == 'touchstart') {
              SDL.DOMButtons[0] = 1;
            }
            var mouseEventType;
            switch(event.type) {
              case 'touchstart': mouseEventType = 'mousedown'; break;
              case 'touchmove': mouseEventType = 'mousemove'; break;
            }
            var mouseEvent = {
              type: mouseEventType,
              button: 0,
              pageX: firstTouch.clientX,
              pageY: firstTouch.clientY
            };
            SDL.events.push(mouseEvent);
  
            for (var i = 0; i < touches.length; i++) {
              var touch = touches[i];
              SDL.events.push({
                type: event.type,
                touch: touch
              });
            };
            break;
          }
          case 'touchend': {
            event.preventDefault();
            
            // Remove the entry in the SDL.downFingers hash
            // because the finger is no longer down.
            for(var i = 0; i < event.changedTouches.length; i++) {
              var touch = event.changedTouches[i];
              if (SDL.downFingers[touch.identifier] === true) {
                delete SDL.downFingers[touch.identifier];
              }
            }
  
            var mouseEvent = {
              type: 'mouseup',
              button: 0,
              pageX: event.changedTouches[0].clientX,
              pageY: event.changedTouches[0].clientY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(mouseEvent);
            
            for (var i = 0; i < event.changedTouches.length; i++) {
              var touch = event.changedTouches[i];
              SDL.events.push({
                type: 'touchend',
                touch: touch
              });
            };
            break;
          }
          case 'mousemove':
            if (SDL.DOMButtons[0] === 1) {
              SDL.events.push({
                type: 'touchmove',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
            }
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup': case 'DOMMouseScroll': case 'mousewheel':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (!SDL.unicode && !SDL.textInput) || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
  
            if (event.type == 'DOMMouseScroll' || event.type == 'mousewheel') {
              var button = Browser.getMouseWheelDelta(event) > 0 ? 4 : 3;
              var event2 = {
                type: 'mousedown',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
              SDL.events.push(event2);
              event = {
                type: 'mouseup',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
            } else if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
              SDL.events.push({
                type: 'touchstart',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
  
              SDL.events.push({
                type: 'touchend',
                touch: {
                  identifier: 0,
                  deviceID: -1,
                  pageX: event.pageX,
                  pageY: event.pageY
                }
              });
              SDL.DOMButtons[event.button] = 0;
            }
  
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown' || event.type === 'mousedown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup' || event.type === 'mouseup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullScreen'](true, true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
  
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
  
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'blur':
          case 'visibilitychange': {
            // Un-press all pressed keys: TODO
            for (var code in SDL.keyboardMap) {
              SDL.events.push({
                type: 'keyup',
                keyCode: SDL.keyboardMap[code]
              });
            }
            event.preventDefault();
            break;
          }
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        return;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
  
        switch (event.type) {
          case 'touchstart': case 'touchend': case 'touchmove': {
            Browser.calculateMouseEvent(event);
            break;
          }
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = event.keyCode;
            if (code >= 65 && code <= 90) {
              code += 32; // make lowercase for SDL
            } else {
              code = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
  
            HEAP8[(((SDL.keyboardState)+(code))|0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))|0)] ? 0x0040 | 0x0080 : 0) | // KMOD_LCTRL & KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))|0)] ? 0x0001 | 0x0002 : 0) | // KMOD_LSHIFT & KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))|0)] ? 0x0100 | 0x0200 : 0); // KMOD_LALT & KMOD_RALT
  
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
  
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, 28); // XXX
          return;
        }
  
        SDL.handleEvent(event);
  
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            //Module.print('Received key event: ' + event.keyCode);
            var key = event.keyCode;
            if (key >= 65 && key <= 90) {
              key += 32; // make lowercase for SDL
            } else {
              key = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
  
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(8))|0)]=down ? 1 : 0;
            HEAP8[(((ptr)+(9))|0)]=0; // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan;
            HEAP32[(((ptr)+(16))>>2)]=key;
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState;
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key;
  
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))|0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP32[(((ptr)+(4))>>2)]=0;
              HEAP32[(((ptr)+(8))>>2)]=0;
              HEAP32[(((ptr)+(12))>>2)]=0;
              HEAP8[(((ptr)+(16))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(17))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP32[(((ptr)+(4))>>2)]=0;
              HEAP32[(((ptr)+(8))>>2)]=0;
              HEAP32[(((ptr)+(12))>>2)]=0;
              HEAP32[(((ptr)+(16))>>2)]=SDL.buttonState;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(28))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(32))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'touchstart': case 'touchend': case 'touchmove': {
            var touch = event.touch;
            var w = Module['canvas'].width;
            var h = Module['canvas'].height;
            var x = Browser.touches[touch.identifier].x / w;
            var y = Browser.touches[touch.identifier].y / h;
            var lx = Browser.lastTouches[touch.identifier].x / w;
            var ly = Browser.lastTouches[touch.identifier].y / h;
            var dx = x - lx;
            var dy = y - ly;
            if (touch['deviceID'] === undefined) touch.deviceID = SDL.TOUCH_DEFAULT_ID;
            if (dx === 0 && dy === 0 && event.type === 'touchmove') return; // don't send these if nothing happened
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=_SDL_GetTicks();
            (tempI64 = [touch.deviceID>>>0,(tempDouble=touch.deviceID,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[(((ptr)+(8))>>2)]=tempI64[0],HEAP32[(((ptr)+(12))>>2)]=tempI64[1]);
            (tempI64 = [touch.identifier>>>0,(tempDouble=touch.identifier,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[(((ptr)+(16))>>2)]=tempI64[0],HEAP32[(((ptr)+(20))>>2)]=tempI64[1]);
            HEAPF32[(((ptr)+(24))>>2)]=x;
            HEAPF32[(((ptr)+(28))>>2)]=y;
            HEAPF32[(((ptr)+(32))>>2)]=dx;
            HEAPF32[(((ptr)+(36))>>2)]=dy;
            if (touch.force !== undefined) {
              HEAPF32[(((ptr)+(40))>>2)]=touch.force;
            } else { // No pressure data, send a digital 0/1 pressure.
              HEAPF32[(((ptr)+(40))>>2)]=event.type == "touchend" ? 0 : 1;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          case 'joystick_button_up': case 'joystick_button_down': {
            var state = event.type === 'joystick_button_up' ? 0 : 1;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.button;
            HEAP8[(((ptr)+(6))|0)]=state;
            break;
          }
          case 'joystick_axis_motion': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.axis;
            HEAP32[(((ptr)+(8))>>2)]=SDL.joystickAxisValueConversion(event.value);
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num && num != 0) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = volume / 128;
          if (info.audio) info.audio.volume = info.volume;
        }
        return ret;
      },fillWebAudioBufferFromHeap:function (heapPtr, sizeSamplesPerChannel, dstAudioBuffer) {
        // The input audio data is interleaved across the channels, i.e. [L, R, L, R, L, R, ...] and is either 8-bit or 16-bit as
        // supported by the SDL API. The output audio wave data for Web Audio API must be in planar buffers of [-1,1]-normalized Float32 data,
        // so perform a buffer conversion for the data.
        var numChannels = SDL.audio.channels;
        for(var c = 0; c < numChannels; ++c) {
          var channelData = dstAudioBuffer['getChannelData'](c);
          if (channelData.length != sizeSamplesPerChannel) {
            throw 'Web Audio output buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + sizeSamplesPerChannel + ' samples!';
          }
          if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              channelData[j] = (HEAP16[(((heapPtr)+((j*numChannels + c)*2))>>1)]) / 0x8000;
            }
          } else if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              var v = (HEAP8[(((heapPtr)+(j*numChannels + c))|0)]);
              channelData[j] = ((v >= 0) ? v-128 : v+128) /128;
            }
          }
        }
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      },joystickEventState:1,lastJoystickState:{},joystickNamePool:{},recordJoystickState:function (joystick, state) {
        // Standardize button state.
        var buttons = new Array(state.buttons.length);
        for (var i = 0; i < state.buttons.length; i++) {
          buttons[i] = SDL.getJoystickButtonState(state.buttons[i]);
        }
  
        SDL.lastJoystickState[joystick] = {
          buttons: buttons,
          axes: state.axes.slice(0),
          timestamp: state.timestamp,
          index: state.index,
          id: state.id
        };
      },getJoystickButtonState:function (button) {
        if (typeof button === 'object') {
          // Current gamepad API editor's draft (Firefox Nightly)
          // https://dvcs.w3.org/hg/gamepad/raw-file/default/gamepad.html#idl-def-GamepadButton
          return button.pressed;
        } else {
          // Current gamepad API working draft (Firefox / Chrome Stable)
          // http://www.w3.org/TR/2012/WD-gamepad-20120529/#gamepad-interface
          return button > 0;
        }
      },queryJoysticks:function () {
        for (var joystick in SDL.lastJoystickState) {
          var state = SDL.getGamepad(joystick - 1);
          var prevState = SDL.lastJoystickState[joystick];
          // Check only if the timestamp has differed.
          // NOTE: Timestamp is not available in Firefox.
          if (typeof state.timestamp !== 'number' || state.timestamp !== prevState.timestamp) {
            var i;
            for (i = 0; i < state.buttons.length; i++) {
              var buttonState = SDL.getJoystickButtonState(state.buttons[i]);
              // NOTE: The previous state already has a boolean representation of
              //       its button, so no need to standardize its button state here.
              if (buttonState !== prevState.buttons[i]) {
                // Insert button-press event.
                SDL.events.push({
                  type: buttonState ? 'joystick_button_down' : 'joystick_button_up',
                  joystick: joystick,
                  index: joystick - 1,
                  button: i
                });
              }
            }
            for (i = 0; i < state.axes.length; i++) {
              if (state.axes[i] !== prevState.axes[i]) {
                // Insert axes-change event.
                SDL.events.push({
                  type: 'joystick_axis_motion',
                  joystick: joystick,
                  index: joystick - 1,
                  axis: i,
                  value: state.axes[i]
                });
              }
            }
  
            SDL.recordJoystickState(joystick, state);
          }
        }
      },joystickAxisValueConversion:function (value) {
        // Ensures that 0 is 0, 1 is 32767, and -1 is 32768.
        return Math.ceil(((value+1) * 32767.5) - 32768);
      },getGamepads:function () {
        var fcn = navigator.getGamepads || navigator.webkitGamepads || navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;
        if (fcn !== undefined) {
          // The function must be applied on the navigator object.
          return fcn.apply(navigator);
        } else {
          return [];
        }
      },getGamepad:function (deviceIndex) {
        var gamepads = SDL.getGamepads();
        if (gamepads.length > deviceIndex && deviceIndex >= 0) {
          return gamepads[deviceIndex];
        }
        return null;
      }};function _SDL_GetVideoInfo() {
      // %struct.SDL_VideoInfo = type { i32, i32, %struct.SDL_PixelFormat*, i32, i32 } - 5 fields of quantum size
      var ret = _malloc(5*Runtime.QUANTUM_SIZE);
      HEAP32[((ret+Runtime.QUANTUM_SIZE*0)>>2)]=0; // TODO
      HEAP32[((ret+Runtime.QUANTUM_SIZE*1)>>2)]=0; // TODO
      HEAP32[((ret+Runtime.QUANTUM_SIZE*2)>>2)]=0;
      HEAP32[((ret+Runtime.QUANTUM_SIZE*3)>>2)]=Module["canvas"].width;
      HEAP32[((ret+Runtime.QUANTUM_SIZE*4)>>2)]=Module["canvas"].height;
      return ret;
    }

  function _SDL_GetMouseState(x, y) {
      if (x) HEAP32[((x)>>2)]=Browser.mouseX;
      if (y) HEAP32[((y)>>2)]=Browser.mouseY;
      return SDL.buttonState;
    }

  function _emscripten_cancel_main_loop() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.shouldPause = true;
    }

  
  
  
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

  function _strcat(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      var pdestEnd = 0;
      pdestEnd = (pdest + (_strlen(pdest)|0))|0;
      do {
        HEAP8[((pdestEnd+i)|0)]=HEAP8[((psrc+i)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)]);
      return pdest|0;
    }


  var _llvm_memset_p0i8_i32=_memset;

  
  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // runtimeConfig gets set to true if WebSocket runtime configuration is available.
              var runtimeConfig = (Module['websocket'] && ('object' === typeof Module['websocket']));
  
              // The default value is 'ws://' the replace is needed because the compiler replaces "//" comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the "#" for "//" again.
              var url = 'ws:#'.replace('#', '//');
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['url']) {
                  url = Module['websocket']['url']; // Fetch runtime WebSocket URL config.
                }
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                url = url + addr + ':' + port;
              }
  
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['subprotocol']) {
                  subProtocols = Module['websocket']['subprotocol']; // Fetch runtime WebSocket subprotocol config.
                }
              }
  
              // The regex trims the string (removes spaces at the beginning and end, then splits the string by
              // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
              subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
              // The node ws library API for specifying optional subprotocol is slightly different than the browser's.
              var opts = ENVIRONMENT_IS_NODE ? {'protocol': subProtocols.toString()} : subProtocols;
  
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) return -1;
      return stream.fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }


  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  var _llvm_va_start=undefined;

  function _llvm_va_end() {}

  
  
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
  
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
  
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
  
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
  
      // Apply sign.
      ret *= multiplier;
  
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str;
      }
  
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
  
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
  
      if (bits == 64) {
        return tempRet0 = (tempDouble=ret,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0),ret>>>0;
      }
  
      return ret;
    }function _strtoul(str, endptr, base) {
      return __parseInt(str, endptr, base, 0, 4294967295, 32, true);  // ULONG_MAX.
    }

  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }

  function _SDL_Init(initFlags) {
      SDL.startTime = Date.now();
      SDL.initFlags = initFlags;
  
      // capture all key events. we just keep down and up, but also capture press to prevent default actions
      if (!Module['doNotCaptureKeyboard']) {
        document.addEventListener("keydown", SDL.receiveEvent);
        document.addEventListener("keyup", SDL.receiveEvent);
        document.addEventListener("keypress", SDL.receiveEvent);
        window.addEventListener("blur", SDL.receiveEvent);
        document.addEventListener("visibilitychange", SDL.receiveEvent);
      }
  
      if (initFlags & 0x200) {
        // SDL_INIT_JOYSTICK
        // Firefox will not give us Joystick data unless we register this NOP
        // callback.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=936104
        addEventListener("gamepadconnected", function() {});
      }
  
      window.addEventListener("unload", SDL.receiveEvent);
      SDL.keyboardState = _malloc(0x10000); // Our SDL needs 512, but 64K is safe for older SDLs
      _memset(SDL.keyboardState, 0, 0x10000);
      // Initialize this structure carefully for closure
      SDL.DOMEventToSDLEvent['keydown']    = 0x300  /* SDL_KEYDOWN */;
      SDL.DOMEventToSDLEvent['keyup']      = 0x301  /* SDL_KEYUP */;
      SDL.DOMEventToSDLEvent['keypress']   = 0x303  /* SDL_TEXTINPUT */;
      SDL.DOMEventToSDLEvent['mousedown']  = 0x401  /* SDL_MOUSEBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['mouseup']    = 0x402  /* SDL_MOUSEBUTTONUP */;
      SDL.DOMEventToSDLEvent['mousemove']  = 0x400  /* SDL_MOUSEMOTION */;
      SDL.DOMEventToSDLEvent['touchstart'] = 0x700  /* SDL_FINGERDOWN */;
      SDL.DOMEventToSDLEvent['touchend']   = 0x701  /* SDL_FINGERUP */;
      SDL.DOMEventToSDLEvent['touchmove']  = 0x702  /* SDL_FINGERMOTION */;
      SDL.DOMEventToSDLEvent['unload']     = 0x100  /* SDL_QUIT */;
      SDL.DOMEventToSDLEvent['resize']     = 0x7001 /* SDL_VIDEORESIZE/SDL_EVENT_COMPAT2 */;
      // These are not technically DOM events; the HTML gamepad API is poll-based.
      // However, we define them here, as the rest of the SDL code assumes that
      // all SDL events originate as DOM events.
      SDL.DOMEventToSDLEvent['joystick_axis_motion'] = 0x600 /* SDL_JOYAXISMOTION */;
      SDL.DOMEventToSDLEvent['joystick_button_down'] = 0x603 /* SDL_JOYBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['joystick_button_up'] = 0x604 /* SDL_JOYBUTTONUP */;
      return 0; // success
    }

  function _signal(sig, func) {
      // TODO
      return 0;
    }


  
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var fd = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return fd === -1 ? 0 : FS.getPtrForStream(FS.getStream(fd));
    }

  
  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(streamObj.fd, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }

  
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      var fd = _fileno(stream);
      _fsync(fd);
      return _close(fd);
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _strcpy(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      do {
        HEAP8[(((pdest+i)|0)|0)]=HEAP8[(((psrc+i)|0)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)]);
      return pdest|0;
    }

  
  
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var fd = _fileno(stream);
      var ret = _lseek(fd, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStreamFromPtr(stream);
      stream.eof = false;
      return 0;
    }var _fseeko=_fseek;

  
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }var _ftello=_ftell;

  
  function _truncate(path, length) {
      // int truncate(const char *path, off_t length);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/truncate.html
      // NOTE: The path argument may be a string, to simplify ftruncate().
      if (typeof path !== 'string') path = Pointer_stringify(path);
      try {
        FS.truncate(path, length);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _ftruncate(fildes, length) {
      // int ftruncate(int fildes, off_t length);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftruncate.html
      try {
        FS.ftruncate(fildes, length);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }


  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var fd = _fileno(stream);
      var ret = _write(fd, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }




  
  var ___DEFAULT_POLLMASK=5;function _poll(fds, nfds, timeout) {
      // int poll(struct pollfd fds[], nfds_t nfds, int timeout);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/poll.html
      var nonzero = 0;
      for (var i = 0; i < nfds; i++) {
        var pollfd = fds + 8 * i;
        var fd = HEAP32[((pollfd)>>2)];
        var events = HEAP16[(((pollfd)+(4))>>1)];
        var mask = 32;
        var stream = FS.getStream(fd);
        if (stream) {
          mask = ___DEFAULT_POLLMASK;
          if (stream.stream_ops.poll) {
            mask = stream.stream_ops.poll(stream);
          }
        }
        mask &= events | 8 | 16;
        if (mask) nonzero++;
        HEAP16[(((pollfd)+(6))>>1)]=mask;
      }
      return nonzero;
    }


  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  function _posix_openpt() {
  Module['printErr']('missing function: posix_openpt'); abort(-1);
  }

  function _symlink(path1, path2) {
      // int symlink(const char *path1, const char *path2);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/symlink.html
      path1 = Pointer_stringify(path1);
      path2 = Pointer_stringify(path2);
      try {
        FS.symlink(path1, path2);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  function _tcgetattr(fildes, termios_p) {
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/tcgetattr.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (!stream.tty) {
        ___setErrNo(ERRNO_CODES.ENOTTY);
        return -1;
      }
      return 0;
    }

  function _tcsetattr(fildes, optional_actions, termios_p) {
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/tcsetattr.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (!stream.tty) {
        ___setErrNo(ERRNO_CODES.ENOTTY);
        return -1;
      }
      return 0;
    }

  function _tcflush() {
  Module['printErr']('missing function: tcflush'); abort(-1);
  }

  function _fcntl(fildes, cmd, varargs, dup2) {
      // int fcntl(int fildes, int cmd, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/fcntl.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      switch (cmd) {
        case 0:
          var arg = HEAP32[((varargs)>>2)];
          if (arg < 0) {
            ___setErrNo(ERRNO_CODES.EINVAL);
            return -1;
          }
          var newStream;
          try {
            newStream = FS.open(stream.path, stream.flags, 0, arg);
          } catch (e) {
            FS.handleFSError(e);
            return -1;
          }
          return newStream.fd;
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4:
          var arg = HEAP32[((varargs)>>2)];
          stream.flags |= arg;
          return 0;
        case 12:
        case 12:
          var arg = HEAP32[((varargs)>>2)];
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2;
          return 0;
        case 13:
        case 14:
        case 13:
        case 14:
          // Pretend that the locking is successful.
          return 0;
        case 8:
        case 9:
          // These are for sockets. We don't have them fully implemented yet.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default:
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
      }
      // Should never be reached. Only to silence strict warnings.
      return -1;
    }

  function _grantpt() {
  Module['printErr']('missing function: grantpt'); abort(-1);
  }

  function _unlockpt() {
  Module['printErr']('missing function: unlockpt'); abort(-1);
  }

  function _ptsname() {
  Module['printErr']('missing function: ptsname'); abort(-1);
  }


  
  var ___tm_current=allocate(44, "i8", ALLOC_STATIC);
  
  
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);
  
  
  var _tzname=allocate(8, "i32*", ALLOC_STATIC);
  
  var _daylight=allocate(1, "i32*", ALLOC_STATIC);
  
  var _timezone=allocate(1, "i32*", ALLOC_STATIC);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
  
      HEAP32[((_timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60;
  
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((_daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
  
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((_tzname)>>2)]=winterNamePtr;
      HEAP32[(((_tzname)+(4))>>2)]=summerNamePtr;
    }function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay();
  
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(36))>>2)]=start.getTimezoneOffset() * 60;
  
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(32))>>2)]=dst;
  
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }

  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }


  
  function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay();
      HEAP32[(((tmPtr)+(36))>>2)]=0;
      HEAP32[(((tmPtr)+(32))>>2)]=0;
      var start = new Date(date); // define date using UTC, start from Jan 01 00:00:00 UTC
      start.setUTCDate(1);
      start.setUTCMonth(0);
      start.setUTCHours(0);
      start.setUTCMinutes(0);
      start.setUTCSeconds(0);
      start.setUTCMilliseconds(0);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }

  var _tan=Math_tan;

  
  function _SDL_PauseAudio(pauseOn) {
      if (!SDL.audio) {
        return;
      }
      if (pauseOn) {
        if (SDL.audio.timer !== undefined) {
          clearTimeout(SDL.audio.timer);
          SDL.audio.numAudioTimersPending = 0;
          SDL.audio.timer = undefined;
        }
        if (SDL.audio.scriptProcessorNode !== undefined) {
          SDL.audio.scriptProcessorNode['disconnect']();
          SDL.audio.scriptProcessorNode = undefined;
        }
      } else if (!SDL.audio.timer && !SDL.audio.scriptProcessorNode) {
        // If we are using the same sampling frequency as the native sampling rate of the Web Audio graph is using, we can feed our buffers via
        // Web Audio ScriptProcessorNode, which is a pull-mode API that calls back to our code to get audio data.
        if (SDL.audioContext !== undefined && SDL.audio.freq == SDL.audioContext['sampleRate'] && typeof SDL.audioContext['createScriptProcessor'] !== 'undefined') {
          var sizeSamplesPerChannel = SDL.audio.bufferSize / SDL.audio.bytesPerSample / SDL.audio.channels; // How many samples per a single channel fit in the cb buffer?
          SDL.audio.scriptProcessorNode = SDL.audioContext['createScriptProcessor'](sizeSamplesPerChannel, 0, SDL.audio.channels);
          SDL.audio.scriptProcessorNode['onaudioprocess'] = function (e) {
            Runtime.dynCall('viii', SDL.audio.callback, [SDL.audio.userdata, SDL.audio.buffer, SDL.audio.bufferSize]);
            SDL.fillWebAudioBufferFromHeap(SDL.audio.buffer, sizeSamplesPerChannel, e['outputBuffer']);
          }
          SDL.audio.scriptProcessorNode['connect'](SDL.audioContext['destination']);
        } else { // If we are using a different sampling rate, must manually queue audio data to the graph via timers.
          // Start the audio playback timer callback loop.
          SDL.audio.numAudioTimersPending = 1;
          SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, 1);
          SDL.audio.startTime = Date.now() / 1000.0; // Only used for Mozilla Audio Data API. Not needed for Web Audio API.
        }
      }
      SDL.audio.paused = pauseOn;
    }function _SDL_CloseAudio() {
      if (SDL.audio) {
        try{
          for(var i = 0; i < SDL.audio.soundSource.length; ++i) {
            if (!(typeof(SDL.audio.soundSource[i]==='undefined'))) {
              SDL.audio.soundSource[i].stop(0);
            }
          }
        } catch(e) {}
        SDL.audio.soundSource = null;
        _SDL_PauseAudio(1);
        _free(SDL.audio.buffer);
        SDL.audio = null;
        SDL.allocateChannels(0);
      }
    }

  function _SDL_WasInit() {
      if (SDL.startTime === null) {
        _SDL_Init();
      }
      return 1;
    }

  function _SDL_InitSubSystem(flags) { return 0 }

  function _SDL_GetError() {
      if (!SDL.errorMessage) {
        SDL.errorMessage = allocate(intArrayFromString("unknown SDL-emscripten error"), 'i8', ALLOC_NORMAL);
      }
      return SDL.errorMessage;
    }

  function _SDL_OpenAudio(desired, obtained) {
      try {
        SDL.audio = {
          freq: HEAPU32[((desired)>>2)],
          format: HEAPU16[(((desired)+(4))>>1)],
          channels: HEAPU8[(((desired)+(6))|0)],
          samples: HEAPU16[(((desired)+(8))>>1)], // Samples in the CB buffer per single sound channel.
          callback: HEAPU32[(((desired)+(16))>>2)],
          userdata: HEAPU32[(((desired)+(20))>>2)],
          paused: true,
          timer: null
        };
        // The .silence field tells the constant sample value that corresponds to the safe un-skewed silence value for the wave data.
        if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
          SDL.audio.silence = 128; // Audio ranges in [0, 255], so silence is half-way in between.
        } else if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
          SDL.audio.silence = 0; // Signed data in range [-32768, 32767], silence is 0.
        } else {
          throw 'Invalid SDL audio format ' + SDL.audio.format + '!';
        }
        // Round the desired audio frequency up to the next 'common' frequency value.
        // Web Audio API spec states 'An implementation must support sample-rates in at least the range 22050 to 96000.'
        if (SDL.audio.freq <= 0) {
          throw 'Unsupported sound frequency ' + SDL.audio.freq + '!';
        } else if (SDL.audio.freq <= 22050) {
          SDL.audio.freq = 22050; // Take it safe and clamp everything lower than 22kHz to that.
        } else if (SDL.audio.freq <= 32000) {
          SDL.audio.freq = 32000;
        } else if (SDL.audio.freq <= 44100) {
          SDL.audio.freq = 44100;
        } else if (SDL.audio.freq <= 48000) {
          SDL.audio.freq = 48000;
        } else if (SDL.audio.freq <= 96000) {
          SDL.audio.freq = 96000;
        } else {
          throw 'Unsupported sound frequency ' + SDL.audio.freq + '!';
        }
        if (SDL.audio.channels == 0) {
          SDL.audio.channels = 1; // In SDL both 0 and 1 mean mono.
        } else if (SDL.audio.channels < 0 || SDL.audio.channels > 32) {
          throw 'Unsupported number of audio channels for SDL audio: ' + SDL.audio.channels + '!';
        } else if (SDL.audio.channels != 1 && SDL.audio.channels != 2) { // Unsure what SDL audio spec supports. Web Audio spec supports up to 32 channels.
          console.log('Warning: Using untested number of audio channels ' + SDL.audio.channels);
        }
        if (SDL.audio.samples < 128 || SDL.audio.samples > 524288 /* arbitrary cap */) {
          throw 'Unsupported audio callback buffer size ' + SDL.audio.samples + '!';
        } else if ((SDL.audio.samples & (SDL.audio.samples-1)) != 0) {
          throw 'Audio callback buffer size ' + SDL.audio.samples + ' must be a power-of-two!';
        }
        
        var totalSamples = SDL.audio.samples*SDL.audio.channels;
        SDL.audio.bytesPerSample = (SDL.audio.format == 0x0008 /*AUDIO_U8*/ || SDL.audio.format == 0x8008 /*AUDIO_S8*/) ? 1 : 2;
        SDL.audio.bufferSize = totalSamples*SDL.audio.bytesPerSample;
        SDL.audio.buffer = _malloc(SDL.audio.bufferSize);
        
        // To account for jittering in frametimes, always have multiple audio buffers queued up for the audio output device.
        // This helps that we won't starve that easily if a frame takes long to complete.
        SDL.audio.numSimultaneouslyQueuedBuffers = Module['SDL_numSimultaneouslyQueuedBuffers'] || 3;
        
        // Create a callback function that will be routinely called to ask more audio data from the user application.
        SDL.audio.caller = function SDL_audio_caller() {
          if (!SDL.audio) {
            return;
          }
          Runtime.dynCall('viii', SDL.audio.callback, [SDL.audio.userdata, SDL.audio.buffer, SDL.audio.bufferSize]);
          SDL.audio.pushAudio(SDL.audio.buffer, SDL.audio.bufferSize);
        };
        
        SDL.audio.audioOutput = new Audio();
        // As a workaround use Mozilla Audio Data API on Firefox until it ships with Web Audio and sound quality issues are fixed.
        if (typeof(SDL.audio.audioOutput['mozSetup'])==='function') {
          SDL.audio.audioOutput['mozSetup'](SDL.audio.channels, SDL.audio.freq); // use string attributes on mozOutput for closure compiler
          SDL.audio.mozBuffer = new Float32Array(totalSamples);
          SDL.audio.nextPlayTime = 0;
          SDL.audio.pushAudio = function SDL_audio_pushAudio(ptr, size) {
            --SDL.audio.numAudioTimersPending;
            var mozBuffer = SDL.audio.mozBuffer;
            // The input audio data for SDL audio is either 8-bit or 16-bit interleaved across channels, output for Mozilla Audio Data API
            // needs to be Float32 interleaved, so perform a sample conversion.
            if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
              for (var i = 0; i < totalSamples; i++) {
                mozBuffer[i] = (HEAP16[(((ptr)+(i*2))>>1)]) / 0x8000;
              }
            } else if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
              for (var i = 0; i < totalSamples; i++) {
                var v = (HEAP8[(((ptr)+(i))|0)]);
                mozBuffer[i] = ((v >= 0) ? v-128 : v+128) /128;
              }
            }
            // Submit the audio data to audio device.
            SDL.audio.audioOutput['mozWriteAudio'](mozBuffer);
            
            // Compute when the next audio callback should be called.
            var curtime = Date.now() / 1000.0 - SDL.audio.startTime;
            var playtime = Math.max(curtime, SDL.audio.nextPlayTime);
            var buffer_duration = SDL.audio.samples / SDL.audio.freq;
            SDL.audio.nextPlayTime = playtime + buffer_duration;
            // Schedule the next audio callback call to occur when the current one finishes.
            SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, 1000.0 * (playtime-curtime));
            ++SDL.audio.numAudioTimersPending;
            // And also schedule extra buffers _now_ if we have too few in queue.
            if (SDL.audio.numAudioTimersPending < SDL.audio.numSimultaneouslyQueuedBuffers) {
              ++SDL.audio.numAudioTimersPending;
              Browser.safeSetTimeout(SDL.audio.caller, 1.0);
            }
          }
        } else {
          // Initialize Web Audio API if we haven't done so yet. Note: Only initialize Web Audio context ever once on the web page,
          // since initializing multiple times fails on Chrome saying 'audio resources have been exhausted'.
          if (!SDL.audioContext) {
            if (typeof(AudioContext) !== 'undefined') {
              SDL.audioContext = new AudioContext();
            } else if (typeof(webkitAudioContext) !== 'undefined') {
              SDL.audioContext = new webkitAudioContext();
            } else {
              throw 'Web Audio API is not available!';
            }
          }
          SDL.audio.soundSource = new Array(); // Use an array of sound sources as a ring buffer to queue blocks of synthesized audio to Web Audio API.
          SDL.audio.nextSoundSource = 0; // Index of the next sound buffer in the ring buffer queue to play.
          SDL.audio.nextPlayTime = 0; // Time in seconds when the next audio block is due to start.
          
          // The pushAudio function with a new audio buffer whenever there is new audio data to schedule to be played back on the device.
          SDL.audio.pushAudio=function(ptr,sizeBytes) {
            try {
              --SDL.audio.numAudioTimersPending;
              if (SDL.audio.paused) return;
  
              var sizeSamples = sizeBytes / SDL.audio.bytesPerSample; // How many samples fit in the callback buffer?
              var sizeSamplesPerChannel = sizeSamples / SDL.audio.channels; // How many samples per a single channel fit in the cb buffer?
              if (sizeSamplesPerChannel != SDL.audio.samples) {
                throw 'Received mismatching audio buffer size!';
              }
              // Allocate new sound buffer to be played.
              var source = SDL.audioContext['createBufferSource']();
              if (SDL.audio.soundSource[SDL.audio.nextSoundSource]) {
                SDL.audio.soundSource[SDL.audio.nextSoundSource]['disconnect'](); // Explicitly disconnect old source, since we know it shouldn't be running anymore.
              }
              SDL.audio.soundSource[SDL.audio.nextSoundSource] = source;
              var soundBuffer = SDL.audioContext['createBuffer'](SDL.audio.channels,sizeSamplesPerChannel,SDL.audio.freq);
              SDL.audio.soundSource[SDL.audio.nextSoundSource]['connect'](SDL.audioContext['destination']);
  
              SDL.fillWebAudioBufferFromHeap(ptr, sizeSamplesPerChannel, soundBuffer);
              // Workaround https://bugzilla.mozilla.org/show_bug.cgi?id=883675 by setting the buffer only after filling. The order is important here!
              source['buffer'] = soundBuffer;
              
              // Schedule the generated sample buffer to be played out at the correct time right after the previously scheduled
              // sample buffer has finished.
              var curtime = SDL.audioContext['currentTime'];
              var playtime = Math.max(curtime, SDL.audio.nextPlayTime);
              var ss = SDL.audio.soundSource[SDL.audio.nextSoundSource];
              if (typeof ss['start'] !== 'undefined') {
                ss['start'](playtime);
              } else if (typeof ss['noteOn'] !== 'undefined') {
                ss['noteOn'](playtime);
              }
              var buffer_duration = sizeSamplesPerChannel / SDL.audio.freq;
              SDL.audio.nextPlayTime = playtime + buffer_duration;
              // Timer will be scheduled before the buffer completed playing.
              // Extra buffers are needed to avoid disturbing playing buffer.
              SDL.audio.nextSoundSource = (SDL.audio.nextSoundSource + 1) % (SDL.audio.numSimultaneouslyQueuedBuffers + 2);
              var secsUntilNextCall = playtime-curtime;
              
              // Queue the next audio frame push to be performed when the previously queued buffer has finished playing.
              var preemptBufferFeedMSecs = 1000*buffer_duration/2.0;
              SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, Math.max(0.0, 1000.0*secsUntilNextCall-preemptBufferFeedMSecs));
              ++SDL.audio.numAudioTimersPending;
  
              // If we are risking starving, immediately queue extra buffers.
              if (SDL.audio.numAudioTimersPending < SDL.audio.numSimultaneouslyQueuedBuffers) {
                ++SDL.audio.numAudioTimersPending;
                Browser.safeSetTimeout(SDL.audio.caller, 1.0);
              }
            } catch(e) {
              console.log('Web Audio API error playing back audio: ' + e.toString());
            }
          }
        }
  
        if (obtained) {
          // Report back the initialized audio parameters.
          HEAP32[((obtained)>>2)]=SDL.audio.freq;
          HEAP16[(((obtained)+(4))>>1)]=SDL.audio.format;
          HEAP8[(((obtained)+(6))|0)]=SDL.audio.channels;
          HEAP8[(((obtained)+(7))|0)]=SDL.audio.silence;
          HEAP16[(((obtained)+(8))>>1)]=SDL.audio.samples;
          HEAP32[(((obtained)+(16))>>2)]=SDL.audio.callback;
          HEAP32[(((obtained)+(20))>>2)]=SDL.audio.userdata;
        }
        SDL.allocateChannels(32);
  
      } catch(e) {
        console.log('Initializing SDL audio threw an exception: "' + e.toString() + '"! Continuing without audio.');
        SDL.audio = null;
        SDL.allocateChannels(0);
        if (obtained) {
          HEAP32[((obtained)>>2)]=0;
          HEAP16[(((obtained)+(4))>>1)]=0;
          HEAP8[(((obtained)+(6))|0)]=0;
          HEAP8[(((obtained)+(7))|0)]=0;
          HEAP16[(((obtained)+(8))>>1)]=0;
          HEAP32[(((obtained)+(16))>>2)]=0;
          HEAP32[(((obtained)+(20))>>2)]=0;
        }
      }
      if (!SDL.audio) {
        return -1;
      }
      return 0;
    }


  function _SDL_LockAudio() {}

  function _SDL_UnlockAudio() {}

  function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }

  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }

  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      var fd = _fileno(stream);
      return _write(fd, s, _strlen(s));
    }

  function _vfprintf(s, f, va_arg) {
      return _fprintf(s, f, HEAP32[((va_arg)>>2)]);
    }

  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }

  function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }

  
  function _usleep(useconds) {
      // int usleep(useconds_t useconds);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/usleep.html
      // We're single-threaded, so use a busy loop. Super-ugly.
      var msec = useconds / 1000;
      if (ENVIRONMENT_IS_WEB && window['performance'] && window['performance']['now']) {
        var start = window['performance']['now']();
        while (window['performance']['now']() - start < msec) {
          // Do nothing.
        }
      } else {
        var start = Date.now();
        while (Date.now() - start < msec) {
          // Do nothing.
        }
      }
      return 0;
    }function _nanosleep(rqtp, rmtp) {
      // int nanosleep(const struct timespec  *rqtp, struct timespec *rmtp);
      var seconds = HEAP32[((rqtp)>>2)];
      var nanoseconds = HEAP32[(((rqtp)+(4))>>2)];
      if (rmtp !== 0) {
        HEAP32[((rmtp)>>2)]=0;
        HEAP32[(((rmtp)+(4))>>2)]=0;
      }
      return _usleep((seconds * 1e6) + (nanoseconds / 1000));
    }

  function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[((ptr)>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((ptr)+(4))>>2)]=Math.floor((now-1000*Math.floor(now/1000))*1000); // microseconds
      return 0;
    }

  function _SDL_PollEvent(ptr) {
      if (SDL.initFlags & 0x200 && SDL.joystickEventState) {
        // If SDL_INIT_JOYSTICK was supplied AND the joystick system is configured
        // to automatically query for events, query for joystick events.
        SDL.queryJoysticks();
      }
      if (SDL.events.length === 0) return 0;
      if (ptr) {
        SDL.makeCEvent(SDL.events.shift(), ptr);
      }
      return 1;
    }

  function _SDL_ShowCursor(toggle) {
      switch (toggle) {
        case 0: // SDL_DISABLE
          if (Browser.isFullScreen) { // only try to lock the pointer when in full screen mode
            Module['canvas'].requestPointerLock();
            return 0;
          } else { // else return SDL_ENABLE to indicate the failure
            return 1;
          }
          break;
        case 1: // SDL_ENABLE
          Module['canvas'].exitPointerLock();
          return 1;
          break;
        case -1: // SDL_QUERY
          return !Browser.pointerLock;
          break;
        default:
          console.log( "SDL_ShowCursor called with unknown toggle parameter value: " + toggle + "." );
          break;
      }
    }

  function _SDL_WM_GrabInput() {}

  function _SDL_WM_ToggleFullScreen(surf) {
      if (Browser.isFullScreen) {
        Module['canvas'].cancelFullScreen();
        return 1;
      } else {
        if (!SDL.canRequestFullscreen) {
          return 0;
        }
        SDL.isRequestingFullscreen = true;
        return 1;
      }
    }

  function _SDL_CreateRGBSurfaceFrom(pixels, width, height, depth, pitch, rmask, gmask, bmask, amask) {
      // TODO: Actually fill pixel data to created surface.
      // TODO: Take into account depth and pitch parameters.
      // console.log('TODO: Partially unimplemented SDL_CreateRGBSurfaceFrom called!');
      var surface = SDL.makeSurface(width, height, 0, false, 'CreateRGBSurfaceFrom', rmask, gmask, bmask, amask);
  
      var surfaceData = SDL.surfaces[surface];
      var surfaceImageData = surfaceData.ctx.getImageData(0, 0, width, height);
      var surfacePixelData = surfaceImageData.data;
  
      // Fill pixel data to created surface.
      // Supports SDL_PIXELFORMAT_RGBA8888 and SDL_PIXELFORMAT_RGB888
      var channels = amask ? 4 : 3; // RGBA8888 or RGB888
      for (var pixelOffset = 0; pixelOffset < width*height; pixelOffset++) {
        surfacePixelData[pixelOffset*4+0] = HEAPU8[pixels + (pixelOffset*channels+0)]; // R
        surfacePixelData[pixelOffset*4+1] = HEAPU8[pixels + (pixelOffset*channels+1)]; // G
        surfacePixelData[pixelOffset*4+2] = HEAPU8[pixels + (pixelOffset*channels+2)]; // B
        surfacePixelData[pixelOffset*4+3] = amask ? HEAPU8[pixels + (pixelOffset*channels+3)] : 0xff; // A
      };
      
      surfaceData.ctx.putImageData(surfaceImageData, 0, 0);
  
      return surface;
    }

  
  function _SDL_LockSurface(surf) {
      var surfData = SDL.surfaces[surf];
  
      surfData.locked++;
      if (surfData.locked > 1) return 0;
  
      if (!surfData.buffer) {
        surfData.buffer = _malloc(surfData.width * surfData.height * 4);
        HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
      }
  
      // Mark in C/C++-accessible SDL structure
      // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
      // So we have fields all of the same size, and 5 of them before us.
      // TODO: Use macros like in library.js
      HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
  
      if (surf == SDL.screen && Module.screenIsReadOnly && surfData.image) return 0;
  
      surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
      if (surf == SDL.screen) {
        var data = surfData.image.data;
        var num = data.length;
        for (var i = 0; i < num/4; i++) {
          data[i*4+3] = 255; // opacity, as canvases blend alpha
        }
      }
  
      if (SDL.defaults.copyOnLock) {
        // Copy pixel data to somewhere accessible to 'C/C++'
        if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
          // If this is neaded then
          // we should compact the data from 32bpp to 8bpp index.
          // I think best way to implement this is use
          // additional colorMap hash (color->index).
          // Something like this:
          //
          // var size = surfData.width * surfData.height;
          // var data = '';
          // for (var i = 0; i<size; i++) {
          //   var color = SDL.translateRGBAToColor(
          //     surfData.image.data[i*4   ], 
          //     surfData.image.data[i*4 +1], 
          //     surfData.image.data[i*4 +2], 
          //     255);
          //   var index = surfData.colorMap[color];
          //   HEAP8[(((surfData.buffer)+(i))|0)]=index;
          // }
          throw 'CopyOnLock is not supported for SDL_LockSurface with SDL_HWPALETTE flag set' + new Error().stack;
        } else {
        HEAPU8.set(surfData.image.data, surfData.buffer);
        }
      }
  
      return 0;
    }function _SDL_UpperBlit(src, srcrect, dst, dstrect) {
      var srcData = SDL.surfaces[src];
      var dstData = SDL.surfaces[dst];
      var sr, dr;
      if (srcrect) {
        sr = SDL.loadRect(srcrect);
      } else {
        sr = { x: 0, y: 0, w: srcData.width, h: srcData.height };
      }
      if (dstrect) {
        dr = SDL.loadRect(dstrect);
      } else {
        dr = { x: 0, y: 0, w: -1, h: -1 };
      }
      var oldAlpha = dstData.ctx.globalAlpha;
      dstData.ctx.globalAlpha = srcData.alpha/255;
      dstData.ctx.drawImage(srcData.canvas, sr.x, sr.y, sr.w, sr.h, dr.x, dr.y, sr.w, sr.h);
      dstData.ctx.globalAlpha = oldAlpha;
      if (dst != SDL.screen) {
        // XXX As in IMG_Load, for compatibility we write out |pixels|
        Runtime.warnOnce('WARNING: copying canvas data to memory for compatibility');
        _SDL_LockSurface(dst);
        dstData.locked--; // The surface is not actually locked in this hack
      }
      return 0;
    }

  function _SDL_FreeSurface(surf) {
      if (surf) SDL.freeSurface(surf);
    }

  function _SDL_Flip(surf) {
      // We actually do this in Unlock, since the screen surface has as its canvas
      // backing the page canvas element
    }

  function _SDL_SetVideoMode(width, height, depth, flags) {
      ['touchstart', 'touchend', 'touchmove', 'mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
  
      // (0,0) means 'use fullscreen' in native; in Emscripten, use the current canvas size.
      if (width == 0 && height == 0) {
        var canvas = Module['canvas'];
        width = canvas.width;
        height = canvas.height;
      }
  
      Browser.setCanvasSize(width, height, true);
      // Free the old surface first.
      if (SDL.screen) {
        SDL.freeSurface(SDL.screen);
        assert(!SDL.screen);
      }
      SDL.screen = SDL.makeSurface(width, height, flags, true, 'screen');
      if (!SDL.addedResizeListener) {
        SDL.addedResizeListener = true;
        Browser.resizeListeners.push(function(w, h) {
          SDL.receiveEvent({
            type: 'resize',
            w: w,
            h: h
          });
        });
      }
      return SDL.screen;
    }

  function _SDL_WM_SetCaption(title, icon) {
      title = title && Pointer_stringify(title);
      icon = icon && Pointer_stringify(icon);
    }

  function _SDL_EnableKeyRepeat(delay, interval) {
      // TODO
    }

  function _SDL_EventState() {}

  function ___errno_location() {
      return ___errno_state;
    }

  function _abort() {
      Module['abort']();
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }






FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



var FUNCTION_TABLE = [0,0,_adb_kbd_del,0,_d_b040,0,_d_c100,0,_mac_set_msg_emu_pause,0,_op6e00,0,_d_9080,0,_snd_sdl_close,0,_adb_kbd_flush,0,_op2040,0,_null_open,0,_sig_segv,0,_op00c0,0,_op4000,0,_d_0c00,0,_opd080,0,_dsk_psi_write,0,_mac_set_msg_emu_iwm_ro,0,_opf000,0,_mac_mem_get_uint16,0,_chr_stdio_read,0,_d_0400,0,_mac_set_msg_emu_video_brightness,0,_mac_set_msg_emu_disk_eject,0,_e6522_get_uint8,0,_mem_blk_get_uint32_null,0,_dsk_ram_write,0,_e6522_set_uint16,0,_d_0e40,0,_ope080,0,_d_01c0,0,_mac_mem_set_uint8,0,_d_4280,0,_dsk_qed_set_msg,0,_mac_scsi_cmd_mode_select,0,_mac_scsi_get_uint16,0,_op4a00,0,_op8140,0,_d_4e40,0,_op4e80,0,_opc080,0,_op01c0,0,_opd0c0,0,_mac_interrupt_via,0,_d_4600,0,_d_b180,0,_chr_posix_close,0,_ope0c0,0,_op4680,0,_op9080,0,_op0280,0,_snd_sdl_set_params,0,_op0c40,0,_snd_null_open,0,_d_4040,0,_ope3c0,0,_op40c0,0,_sdl_del,0,_d_0200,0,_mac_set_msg_emu_reset,0,_d_9040,0,_adb_dev_flush,0,_mac_set_msg_emu_cpu_speed,0,_d_80c0,0,_op50c0,0,_opb1c0,0,_opd1c0,0,_null_del,0,_d_d180,0,_mac_mem_set_uint32,0,_d_d0c0,0,_d_0840,0,_d_6000,0,_op6900,0,_e68_ea_010_xxx,0,_dsk_pce_del,0,_chr_mouse_read,0,_mac_interrupt_scc,0,_dsk_pce_set_msg,0,_op63001090,0,_d_90c0,0,_op6d001100,0,_e68_ea_101_xxx,0,_d_0440,0,_mem_blk_set_uint16_null,0,_d_e0c0,0,_d_0e80,0,_snd_null_write,0,_d_46c0,0,_ope5c0,0,_op9100,0,_chr_stdio_open,0,_d_b000,0,_op6400,0,_op8100,0,_mem_blk_set_uint8_null,0,_d_4240,0,_op5ac0,0,_d_4ac0,0,_dsk_qed_get_msg,0,_d_7000,0,_op0800,0,_op5080,0,_d_50c0,0,_op6700,0,_op4c00,0,_mac_log_undef,0,_d_0180,0,_mac_atexit,0,_d_40c0,0,_mac_set_msg_emu_serport_file,0,_d_e7c0,0,_mac_cmd,0,_d_8140,0,_adb_mouse_talk_done,0,_op4880,0,_dsk_img_write,0,_op0c00,0,_d_4a80,0,_e6522_get_uint32,0,_op4a40,0,_op42c0,0,_ope040,0,_e68_ea_001_xxx,0,_dsk_qed_write,0,_bp_segofs_del,0,_op0140,0,_d_e9c0,0,_d_00c0,0,_d_8040,0,_dsk_cow_get_msg,0,_d_4640,0,_d_0c80,0,_op57c01078,0,_d_e000,0,_null_close,0,_op8080,0,_e68_ea_111_100,0,_op5dc0,0,_op6200,0,_op4080,0,_chr_null_close,0,_op5ac01081,0,_mac_set_msg_emu_iwm_rw,0,_d_0800,0,_op0480,0,_op4640,0,_op6c00,0,_mac_scsi_cmd_start_stop,0,_mac_set_rtc_data,0,_d_0480,0,_d_0640,0,_e68_ea_000_xxx,0,_dsk_psi_set_msg,0,_d_c180,0,_mem_get_uint16_be,0,_op3040,0,_null_update,0,_d_0240,0,_op9140,0,_adb_kbd_reset,0,_adb_dev_listen,0,_d_9180,0,_mac_scsi_cmd_write6_finish,0,_snd_sdl_callback,0,_op51c0,0,_opc000,0,_op0840,0,_di_und,0,_op56c01077,0,_mac_scsi_cmd_read10,0,_dsk_img_del,0,_op1000,0,_mac_set_msg_emu_exit,0,_mac_set_mouse,0,_op6d00,0,_d_8100,0,_adb_dev_reset,0,_d_1000,0,_chr_null_read,0,_op4a001068,0,_op54c01075,0,_d_e180,0,_op55c01076,0,_op0240,0,_mac_ser_set_comm,0,_dsk_cow_read,0,_ope4c0,0,_opd180,0,_op4840,0,_mac_scsi_cmd_format_unit,0,_mac_interrupt_osi,0,_op66001093,0,_bp_addr_match,0,_d_e8c0,0,_ope000,0,_d_4200,0,_d_d100,0,_op0100,0,_op59c01080,0,_d_e040,0,_op0e80,0,_ope180,0,_bp_segofs_match,0,_d_4180,0,_op64001091,0,_op4600,0,_op51c01072,0,_adb_kbd_talk_done,0,_ope9c0,0,_op0200,0,_op5cc0,0,_d_0140,0,_op54c0,0,_mac_scsi_cmd_read_capacity,0,_op4180,0,_d_0600,0,_adb_dev_talk_done,0,_d_4c80,0,_opd100,0,_op91c0,0,_chr_null_get_ctl,0,_op4a801070,0,_sig_int,0,_cmd_get_sym1852,0,_e68_ea_011_111,0,_d_41c0,0,_dsk_cow_set_msg,0,_sdl_close,0,_ope7c0,0,_opefc0,0,_d_e6c0,0,_opb100,0,_op9180,0,_d_0a80,0,_d_0280,0,_mac_kbd_set_uint8,0,_d_3040,0,_opc040,0,_mac_set_msg_emu_cpu_model,0,_snd_sdl_open,0,_mac_scsi_cmd_read6,0,_dsk_dosemu_write,0,_d_c1c0,0,_null_set_msg_trm,0,_op5bc0,0,_adb_mouse_reset,0,_d_d080,0,_chr_mouse_write,0,_d_08c0,0,_op5ec0,0,_op6800,0,_op0a40,0,_mac_log_mem,0,_op90c0,0,_d_42c0,0,_mac_mem_get_uint32,0,_d_4a00,0,_op7000,0,_mem_set_uint32_be,0,_adb_kbd_listen,0,_bp_addr_print,0,_d_e140,0,_opeac0,0,_d_e5c0,0,_op4800,0,_opebc0,0,_op5040,0,_d_4800,0,_mac_kbd_set_data,0,_e6522_set_uint32,0,_chr_stdio_write,0,_op5ec01085,0,_e68_ea_100_xxx,0,_d_e3c0,0,_d_4e80,0,_d_5000,0,_mac_interrupt,0,_chr_mouse_close,0,_d_d140,0,_d_e080,0,_ope140,0,_d_0880,0,_op8000,0,_chr_null_write,0,_opc140,0,_op5dc01084,0,_d_04c0,0,_mac_set_msg_emu_pause_toggle,0,_opa000,0,_mac_set_reset,0,_d_0100,0,_op5fc01086,0,_dsk_dosemu_read,0,_d_4440,0,_ope8c0,0,_op6b001098,0,_mem_set_uint16_be,0,_sdl_open,0,_op0a00,0,_opb140,0,_op2000,0,_d_a000,0,_d_0080,0,_adb_mouse_talk,0,_d_3000,0,_ope2c0,0,_d_0a40,0,_op41c0,0,_op50c01071,0,_op6600,0,_mem_set_uint8,0,_e68_ea_110_xxx,0,_d_efc0,0,_op08c0,0,_e6522_set_uint8,0,_op53c0,0,_bp_addr_del,0,_d_9100,0,_d_c040,0,_op52c01073,0,_op4a80,0,_chr_posix_read,0,_mac_scsi_cmd_verify10,0,_mac_set_adb_int,0,_op6100,0,_mem_blk_set_uint32_null,0,_e68_ea_111_001,0,_e68_ea_111_000,0,_opd140,0,_bp_expr_print,0,_bp_expr_match,0,_op65001092,0,_op55c0,0,_chr_posix_write,0,_d_5180,0,_op4200,0,_d_4a40,0,_d_e100,0,_opd040,0,_adb_mouse_del,0,_mac_scc_set_uint8,0,_op0600,0,_op6b00,0,_op46c0,0,_op5000,0,_d_4840,0,_d_eec0,0,_adb_mouse_flush,0,_op60001087,0,_sdl_update,0,_null_check,0,_d_5040,0,_mem_blk_get_uint8_null,0,_op5180,0,_op8040,0,_e68_ea_011_xxx,0,_d_e2c0,0,_opc100,0,_op48c0,0,_mac_scsi_cmd_read_buffer,0,_mac_set_iwm_motor,0,_d_8180,0,_e68_ea_111_xxx,0,_op4e40,0,_op6e001101,0,_d_ecc0,0,_op58c01079,0,_d_4400,0,_d_0040,0,_op5cc01083,0,_d_8000,0,_op0180,0,_d_c0c0,0,_op4ec0,0,_d_0a00,0,_d_b1c0,0,_ope100,0,_op52c0,0,_bp_expr_del,0,_mac_scsi_cmd_mode_sense,0,_d_b0c0,0,_mac_scsi_cmd_sense,0,_mem_get_uint32_be,0,_d_4080,0,_dsk_psi_del,0,_mac_interrupt_vbi,0,_op6f00,0,_d_48c0,0,_d_d000,0,_mac_log_exception,0,_e68_ea_100_111,0,_sdl_check,0,_mac_set_msg_emu_iwm_status,0,_dsk_pce_write,0,_op4100,0,_d_0680,0,_snd_null_set_params,0,_chr_pty_close,0,_opecc0,0,_opd000,0,_e6522_shift_in,0,_d_5140,0,_op4240,0,_dsk_ram_del,0,_dsk_dosemu_del,0,_mac_ser_set_out,0,_op0640,0,_d_91c0,0,_d_4880,0,_d_4cc0,0,_opb000,0,_chr_posix_open,0,_dsk_part_del,0,_d_e1c0,0,_op4400,0,_d_c000,0,_mac_scsi_set_uint16,0,_mac_mem_get_uint8,0,_d_9140,0,_opeec0,0,_op59c0,0,_chr_mouse_set_params,0,_dsk_psi_read,0,_op6f001102,0,_dsk_pce_get_msg,0,_e68_op_undefined,0,_mac_set_msg_emu_stop,0,_mem_get_uint8,0,_op5fc0,0,_op67001094,0,_op69001096,0,_mac_scsi_get_uint8,0,_mac_scsi_cmd_test_unit_ready,0,_mac_set_msg_emu_realtime_toggle,0,_mac_ser_set_inp,0,_d_02c0,0,_adb_kbd_talk,0,_d_4680,0,_op53c01074,0,_d_b100,0,_mac_set_msg_mac_insert,0,_op3000,0,_op80c0,0,_dsk_pce_read,0,_dsk_part_write,0,_mac_set_msg,0,_chr_pty_write,0,_dsk_ram_read,0,_chr_stdio_close,0,_op6c001099,0,_dsk_part_read,0,_d_5080,0,_sig_term,0,_op5140,0,_op4c40,0,_d_d040,0,_chr_mouse_open,0,_chr_pty_open,0,_chr_null_open,0,_op0a80,0,_mac_scc_get_uint8,0,_d_4c00,0,_d_9000,0,_mac_set_via_port_a,0,_mac_set_via_port_b,0,_d_0000,0,_mac_set_msg_emu_cpu_speed_step,0,_op57c0,0,_e6522_get_uint16,0,_op4040,0,_mac_set_msg_emu_serport_driver,0,_op44c0,0,_mac_set_key,0,_d_f000,0,_op0680,0,_op0440,0,_ope6c0,0,_d_ebc0,0,_bp_segofs_print,0,_op4440,0,_op6500,0,_e68_ea_111_010,0,_e68_ea_111_011,0,_opb040,0,_chr_null_set_ctl,0,_op0040,0,_snd_sdl_write,0,_d_2040,0,_sdl_set_msg_trm,0,_op0e00,0,_op9000,0,_op4a401069,0,_d_b080,0,_d_c140,0,_op5bc01082,0,_opc180,0,_d_0e00,0,_mac_hook,0,_dsk_qed_read,0,_mac_scsi_cmd_inquiry,0,_mac_set_msg_emu_disk_insert,0,_d_49c0,0,_op6a001097,0,_dsk_qed_del,0,_snd_null_close,0,_op56c0,0,_e6522_shift_out,0,_d_4000,0,_d_0c40,0,_mac_ser_set_rts,0,_dsk_cow_write,0,_chr_pty_read,0,_op6000,0,_d_5100,0,_op4280,0,_d_eac0,0,_chr_null_set_params,0,_d_b140,0,_ope1c0,0,_d_e4c0,0,_d_d1c0,0,_op6a00,0,_dsk_img_read,0,_opc1c0,0,___strdup,0,_d_44c0,0,_op5100,0,_op81c0,0,_chr_mouse_get_ctl,0,_op4cc0,0,_adb_dev_talk,0,_dsk_cow_del,0,_mac_set_msg_emu_disk_commit,0,_d_c080,0,_mac_scsi_set_uint8,0,_mac_set_msg_emu_disk_rw,0,_op6300,0,_op62001089,0,_mac_set_msg_emu_disk_ro,0,_d_4c40,0,_op58c0,0,_opb0c0,0,_chr_mouse_set_ctl,0,_cmd_set_sym1854,0,_mem_blk_get_uint16_null,0,_d_4480,0,_mac_run_emscripten_step,0,_opb180,0,_e6522_set_shift_inp,0,_op8180,0,_d_81c0,0,_op0880,0,_d_8080,0,_mac_mem_set_uint16,0,_mac_set_msg_emu_realtime,0,_op0400,0,_op61001088,0,_opc0c0,0,_mac_scsi_cmd_write6,0,_op49c0_00,0,_op0000,0,_op49c0,0,_mem_set_uint8_rw,0,_op4ac0,0,_opb080,0,_op0e40,0,_op9040,0,_op4480,0,_op68001095,0,_d_4ec0,0,_d_2000,0,_mac_scsi_cmd_write10,0,_op0c80,0,_op4c80,0,_op0080,0,_mac_scsi_cmd_write10_finish,0];

// EMSCRIPTEN_START_FUNCS



function _opd180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[20520+(r8<<2)>>2]](r1,r8,508,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r5)|0)!=0){STACKTOP=r2;return}r8=HEAP32[r5>>2];r5=r8+r7|0;r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+12;_e68_cc_set_add_32(r1,r5,r7,r8);r8=r1+156|0;r7=HEAP32[r8>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r7&16777215;r7=r10+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val32(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r6&7;r8=r6>>>9&7;if((r6&8|0)==0){r13=r8;r14=r5}else{r13=r8|32;r14=r5|32}if((FUNCTION_TABLE[HEAP32[20520+(r14<<2)>>2]](r1,r14,17,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[20520+(r13<<2)>>2]](r1,r13,17,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r3+r13+(HEAPU16[r1+166>>1]>>>4&1)|0;r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+12;_e68_cc_set_addx_32(r1,r4,r13,r3);r3=r1+156|0;r13=HEAP32[r3>>2];if((r13&1|0)!=0){_e68_exception_address(r1,r13,0,0);STACKTOP=r2;return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r5=r13&16777215;r13=r5+1|0;if(r13>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r15=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r13|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r14>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val32(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd1c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[20520+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+120+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP32[r3>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+6;r3=r1+156|0;r7=HEAP32[r3>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r9=r7&16777215;r7=r9+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r7|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r8>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=r6+r4;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope000(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==1){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;if((r3&32|0)!=0){r8=HEAP32[r1+88+(r7<<2)>>2]&63;if((r8|0)==0){r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-2;r10=r6&255;r11=0}else{r12=r8;r2=25}}else{r12=(r7|0)==0?8:r7;r2=25}do{if(r2==25){if(r12>>>0<8){r7=r6&255;r8=r7>>>(r12>>>0)&255;r9=r1+166|0;r13=HEAP16[r9>>1];if((1<<r12-1&r7|0)==0){HEAP16[r9>>1]=r13&-18;r10=r8;r11=r12;break}else{HEAP16[r9>>1]=r13|17;r10=r8;r11=r12;break}}if((r12|0)==8?(r6&128|0)!=0:0){r8=r1+166|0;HEAP16[r8>>1]=HEAP16[r8>>1]|17;r10=0;r11=8;break}r8=r1+166|0;HEAP16[r8>>1]=HEAP16[r8>>1]&-18;r10=0;r11=r12}}while(0);r12=r1+372|0;HEAP32[r12>>2]=(r11<<1)+6+HEAP32[r12>>2];_e68_cc_set_nz_8(r1,14,r10);r12=r1+156|0;r11=HEAP32[r12>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r8=r11&16777215;r11=r8+1|0;if(r11>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r8|0]<<8|HEAPU8[r13+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r12>>2]=HEAP32[r12>>2]+2;r12=r1+152|0;HEAP32[r12>>2]=HEAP32[r12>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-256|r10&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r10=r1+88+((r3&7)<<2)|0;r5=HEAP32[r10>>2];r12=r5&255;r14=r3>>>9&7;if((r3&32|0)==0){r15=(r14|0)==0?8:r14}else{r15=HEAP32[r1+88+(r14<<2)>>2]&63}r14=r15&7;do{if((r14|0)!=0){r6=r5&255;r8=r6<<8-r14|r6>>>(r14>>>0);r6=r8&255;r11=r1+166|0;r13=HEAP16[r11>>1];if((r8&128|0)==0){HEAP16[r11>>1]=r13&-2;r16=r6;break}else{HEAP16[r11>>1]=r13|1;r16=r6;break}}else{if((r15|0)!=0?(r5&128|0)!=0:0){r6=r1+166|0;HEAP16[r6>>1]=HEAP16[r6>>1]|1;r16=r12;break}r6=r1+166|0;HEAP16[r6>>1]=HEAP16[r6>>1]&-2;r16=r12}}while(0);r12=r1+372|0;HEAP32[r12>>2]=(r15<<1)+6+HEAP32[r12>>2];_e68_cc_set_nz_8(r1,14,r16);r12=r1+156|0;r15=HEAP32[r12>>2];if((r15&1|0)!=0){_e68_exception_address(r1,r15,0,0);return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r14=r15&16777215;r15=r14+1|0;if(r15>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r17=HEAPU8[r6+r14|0]<<8|HEAPU8[r6+r15|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14)}HEAP16[r5>>1]=r17;if((HEAP8[r1+336|0]|0)==0){HEAP32[r12>>2]=HEAP32[r12>>2]+2;r12=r1+152|0;HEAP32[r12>>2]=HEAP32[r12>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]&-256|r16&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r16=r1+88+((r3&7)<<2)|0;r10=HEAP32[r16>>2]&255;r12=r1+166|0;r17=HEAPU16[r12>>1]>>>4;r5=r3>>>9&7;if((r3&32|0)!=0){r14=HEAP32[r1+88+(r5<<2)>>2]&63;r15=r17&1;if((r14|0)==0){r18=r10;r19=r15;r20=0}else{r21=r14;r22=r15;r2=44}}else{r21=(r5|0)==0?8:r5;r22=r17&1;r2=44}if(r2==44){r17=0;r5=r10;r10=r22;while(1){r22=(r5&65535)>>>1|r10<<7;r15=r17+1|0;r14=r5&1;if(r15>>>0<r21>>>0){r17=r15;r5=r22;r10=r14}else{r18=r22;r19=r14;r20=r21;break}}}r21=r1+372|0;HEAP32[r21>>2]=(r20<<1)+6+HEAP32[r21>>2];_e68_cc_set_nz_8(r1,14,r18&255);r21=HEAP16[r12>>1];HEAP16[r12>>1]=r19<<16>>16==0?r21&-18:r21|17;r21=r1+156|0;r19=HEAP32[r21>>2];if((r19&1|0)!=0){_e68_exception_address(r1,r19,0,0);return}r12=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r12>>1];r20=r19&16777215;r19=r20+1|0;if(r19>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r23=HEAPU8[r10+r20|0]<<8|HEAPU8[r10+r19|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r20)}HEAP16[r12>>1]=r23;if((HEAP8[r1+336|0]|0)==0){HEAP32[r21>>2]=HEAP32[r21>>2]+2;r21=r1+152|0;HEAP32[r21>>2]=HEAP32[r21>>2]+2;HEAP32[r16>>2]=HEAP32[r16>>2]&-256|r18&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r4=r3&7;r18=r3>>>9&7;if((r3&32|0)!=0){r3=HEAP32[r1+88+(r18<<2)>>2]&63;r16=r1+88+(r4<<2)|0;r21=HEAP32[r16>>2];if((r3|0)==0){r23=r1+166|0;HEAP16[r23>>1]=HEAP16[r23>>1]&-2;r24=r21&255;r25=0;r26=r16}else{r27=r3;r28=r16;r29=r21;r2=6}}else{r21=r1+88+(r4<<2)|0;r27=(r18|0)==0?8:r18;r28=r21;r29=HEAP32[r21>>2];r2=6}do{if(r2==6){r21=r29&255;r18=(r29&128|0)!=0;if(r27>>>0<8){r4=(r18?r21|65280:r21)>>>(r27>>>0)&255;r16=r1+166|0;r3=HEAP16[r16>>1];if((1<<r27-1&r21|0)==0){HEAP16[r16>>1]=r3&-18;r24=r4;r25=r27;r26=r28;break}else{HEAP16[r16>>1]=r3|17;r24=r4;r25=r27;r26=r28;break}}else{r4=r1+166|0;r3=HEAP16[r4>>1];if(r18){HEAP16[r4>>1]=r3|17;r24=-1;r25=r27;r26=r28;break}else{HEAP16[r4>>1]=r3&-18;r24=0;r25=r27;r26=r28;break}}}}while(0);r28=r1+372|0;HEAP32[r28>>2]=(r25<<1)+6+HEAP32[r28>>2];_e68_cc_set_nz_8(r1,14,r24);r28=r1+156|0;r25=HEAP32[r28>>2];if((r25&1|0)!=0){_e68_exception_address(r1,r25,0,0);return}r27=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r27>>1];r29=r25&16777215;r25=r29+1|0;if(r25>>>0<HEAP32[r1+36>>2]>>>0){r2=HEAP32[r1+32>>2];r30=HEAPU8[r2+r29|0]<<8|HEAPU8[r2+r25|0]}else{r30=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r29)}HEAP16[r27>>1]=r30;if((HEAP8[r1+336|0]|0)==0){HEAP32[r28>>2]=HEAP32[r28>>2]+2;r28=r1+152|0;HEAP32[r28>>2]=HEAP32[r28>>2]+2;HEAP32[r26>>2]=HEAP32[r26>>2]&-256|r24&255;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r24=r1+372|0;HEAP32[r24>>2]=HEAP32[r24>>2]+2;return}}function _ope040(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==1){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;do{if((r3&32|0)!=0){r8=HEAP32[r1+88+(r7<<2)>>2]&63;if((r8|0)==0){r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-2;r10=r6&65535;r11=0;break}if(r8>>>0<16){r12=r8;r2=26}else{if((r8|0)==16?(r6&32768|0)!=0:0){r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]|17;r10=0;r11=16;break}r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-18;r10=0;r11=r8}}else{r12=(r7|0)==0?8:r7;r2=26}}while(0);do{if(r2==26){r7=r6&65535;r8=r7>>>(r12>>>0)&65535;r9=r1+166|0;r13=HEAP16[r9>>1];if((1<<r12-1&r7|0)==0){HEAP16[r9>>1]=r13&-18;r10=r8;r11=r12;break}else{HEAP16[r9>>1]=r13|17;r10=r8;r11=r12;break}}}while(0);r12=r1+372|0;HEAP32[r12>>2]=(r11<<1)+6+HEAP32[r12>>2];_e68_cc_set_nz_16(r1,14,r10);r12=r1+156|0;r11=HEAP32[r12>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r8=r11&16777215;r11=r8+1|0;if(r11>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r8|0]<<8|HEAPU8[r13+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r12>>2]=HEAP32[r12>>2]+2;r12=r1+152|0;HEAP32[r12>>2]=HEAP32[r12>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r10&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r10=r1+88+((r3&7)<<2)|0;r5=HEAP32[r10>>2]&65535;r12=r3>>>9&7;if((r3&32|0)!=0){r14=HEAP32[r1+88+(r12<<2)>>2]&63;r6=r1+166|0;r8=HEAPU16[r6>>1]>>>4;if((r14|0)==0){r15=r8;r16=r5;r17=0;r18=r6}else{r19=r14;r20=r6;r21=r8;r2=44}}else{r8=r1+166|0;r19=(r12|0)==0?8:r12;r20=r8;r21=HEAPU16[r8>>1]>>>4;r2=44}if(r2==44){r8=r21;r21=0;r12=r5;while(1){r5=r8<<15|(r12&65535)>>>1;r6=r21+1|0;if(r6>>>0<r19>>>0){r8=r12;r21=r6;r12=r5}else{r15=r12;r16=r5;r17=r19;r18=r20;break}}}r20=r1+372|0;HEAP32[r20>>2]=(r17<<1)+6+HEAP32[r20>>2];_e68_cc_set_nz_16(r1,14,r16);r20=HEAP16[r18>>1];HEAP16[r18>>1]=(r15&1)==0?r20&-18:r20|17;r20=r1+156|0;r15=HEAP32[r20>>2];if((r15&1|0)!=0){_e68_exception_address(r1,r15,0,0);return}r18=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r18>>1];r17=r15&16777215;r15=r17+1|0;if(r15>>>0<HEAP32[r1+36>>2]>>>0){r19=HEAP32[r1+32>>2];r22=HEAPU8[r19+r17|0]<<8|HEAPU8[r19+r15|0]}else{r22=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r17)}HEAP16[r18>>1]=r22;if((HEAP8[r1+336|0]|0)==0){HEAP32[r20>>2]=HEAP32[r20>>2]+2;r20=r1+152|0;HEAP32[r20>>2]=HEAP32[r20>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]&-65536|r16&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r16=r1+88+((r3&7)<<2)|0;r10=HEAP32[r16>>2];r20=r3>>>9&7;do{if((r3&32|0)!=0){r22=HEAP32[r1+88+(r20<<2)>>2]&63;if((r22|0)==0){r18=r1+166|0;HEAP16[r18>>1]=HEAP16[r18>>1]&-2;r23=r10&65535;r24=0;break}r18=(r10&32768|0)!=0;if(r22>>>0>=16){r17=r1+166|0;r15=HEAP16[r17>>1];if(r18){HEAP16[r17>>1]=r15|17;r23=-1;r24=r22;break}else{HEAP16[r17>>1]=r15&-18;r23=0;r24=r22;break}}else{r25=r22;r26=r18;r2=7}}else{r25=(r20|0)==0?8:r20;r26=(r10&32768|0)!=0;r2=7}}while(0);do{if(r2==7){r20=r10&65535;r18=(r26?r10|-65536:r20)>>>(r25>>>0)&65535;r22=r1+166|0;r15=HEAP16[r22>>1];if((1<<r25-1&r20|0)==0){HEAP16[r22>>1]=r15&-18;r23=r18;r24=r25;break}else{HEAP16[r22>>1]=r15|17;r23=r18;r24=r25;break}}}while(0);r25=r1+372|0;HEAP32[r25>>2]=(r24<<1)+6+HEAP32[r25>>2];_e68_cc_set_nz_16(r1,14,r23);r25=r1+156|0;r24=HEAP32[r25>>2];if((r24&1|0)!=0){_e68_exception_address(r1,r24,0,0);return}r10=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r10>>1];r26=r24&16777215;r24=r26+1|0;if(r24>>>0<HEAP32[r1+36>>2]>>>0){r2=HEAP32[r1+32>>2];r27=HEAPU8[r2+r26|0]<<8|HEAPU8[r2+r24|0]}else{r27=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r26)}HEAP16[r10>>1]=r27;if((HEAP8[r1+336|0]|0)==0){HEAP32[r25>>2]=HEAP32[r25>>2]+2;r25=r1+152|0;HEAP32[r25>>2]=HEAP32[r25>>2]+2;HEAP32[r16>>2]=HEAP32[r16>>2]&-65536|r23&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r4=r1+88+((r3&7)<<2)|0;r23=HEAP32[r4>>2];r16=r23&65535;r25=r3>>>9&7;if((r3&32|0)==0){r28=(r25|0)==0?8:r25}else{r28=HEAP32[r1+88+(r25<<2)>>2]&63}do{if((r28&15|0)!=0){r25=r23&65535;r3=r25<<16-r28|r25>>>(r28>>>0);r25=r3&65535;r27=r1+166|0;r10=HEAP16[r27>>1];if((r3&32768|0)==0){HEAP16[r27>>1]=r10&-2;r29=r25;break}else{HEAP16[r27>>1]=r10|1;r29=r25;break}}else{if((r28|0)!=0?(r23&32768|0)!=0:0){r25=r1+166|0;HEAP16[r25>>1]=HEAP16[r25>>1]|1;r29=r16;break}r25=r1+166|0;HEAP16[r25>>1]=HEAP16[r25>>1]&-2;r29=r16}}while(0);r16=r1+372|0;HEAP32[r16>>2]=(r28<<1)+6+HEAP32[r16>>2];_e68_cc_set_nz_16(r1,14,r29);r16=r1+156|0;r28=HEAP32[r16>>2];if((r28&1|0)!=0){_e68_exception_address(r1,r28,0,0);return}r23=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r23>>1];r25=r28&16777215;r28=r25+1|0;if(r28>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r30=HEAPU8[r10+r25|0]<<8|HEAPU8[r10+r28|0]}else{r30=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r25)}HEAP16[r23>>1]=r30;if((HEAP8[r1+336|0]|0)==0){HEAP32[r16>>2]=HEAP32[r16>>2]+2;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;HEAP32[r4>>2]=HEAP32[r4>>2]&-65536|r29&65535;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r29=r1+372|0;HEAP32[r29>>2]=HEAP32[r29>>2]+2;return}}function _ope080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==1){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;do{if((r3&32|0)!=0){r8=HEAP32[r1+88+(r7<<2)>>2]&63;if((r8|0)==0){r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-2;r10=r6;r11=0;break}if(r8>>>0>=32){r9=r1+166|0;r12=HEAP16[r9>>1];if((r8|0)==32&(r6|0)<0){HEAP16[r9>>1]=r12|17;r10=0;r11=32;break}else{HEAP16[r9>>1]=r12&-18;r10=0;r11=r8;break}}else{r13=r8;r2=28}}else{r13=(r7|0)==0?8:r7;r2=28}}while(0);do{if(r2==28){r7=r6>>>(r13>>>0);r8=r1+166|0;r12=HEAP16[r8>>1];if((1<<r13-1&r6|0)==0){HEAP16[r8>>1]=r12&-18;r10=r7;r11=r13;break}else{HEAP16[r8>>1]=r12|17;r10=r7;r11=r13;break}}}while(0);r13=r1+372|0;HEAP32[r13>>2]=(r11<<1)+8+HEAP32[r13>>2];_e68_cc_set_nz_32(r1,14,r10);r13=r1+156|0;r11=HEAP32[r13>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r11&16777215;r11=r7+1|0;if(r11>>>0<HEAP32[r1+36>>2]>>>0){r12=HEAP32[r1+32>>2];r14=HEAPU8[r12+r7|0]<<8|HEAPU8[r12+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r13>>2]=HEAP32[r13>>2]+2;r13=r1+152|0;HEAP32[r13>>2]=HEAP32[r13>>2]+2;HEAP32[r5>>2]=r10;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r10=r1+88+((r3&7)<<2)|0;r5=HEAP32[r10>>2];r13=r3>>>9&7;if((r3&32|0)==0){r15=(r13|0)==0?8:r13}else{r15=HEAP32[r1+88+(r13<<2)>>2]&63}r13=r15&31;do{if((r13|0)==0){r14=r1+166|0;r6=HEAP16[r14>>1];if((r15|0)!=0&(r5|0)<0){HEAP16[r14>>1]=r6|1;r16=r5;break}else{HEAP16[r14>>1]=r6&-2;r16=r5;break}}else{r6=r5<<32-r13|r5>>>(r13>>>0);r14=r1+166|0;r7=HEAP16[r14>>1];if((r6|0)<0){HEAP16[r14>>1]=r7|1;r16=r6;break}else{HEAP16[r14>>1]=r7&-2;r16=r6;break}}}while(0);r13=r1+372|0;HEAP32[r13>>2]=(r15<<1)+8+HEAP32[r13>>2];_e68_cc_set_nz_32(r1,14,r16);r13=r1+156|0;r15=HEAP32[r13>>2];if((r15&1|0)!=0){_e68_exception_address(r1,r15,0,0);return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r15&16777215;r15=r6+1|0;if(r15>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r17=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r15|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r17;if((HEAP8[r1+336|0]|0)==0){HEAP32[r13>>2]=HEAP32[r13>>2]+2;r13=r1+152|0;HEAP32[r13>>2]=HEAP32[r13>>2]+2;HEAP32[r10>>2]=r16;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r16=r1+88+((r3&7)<<2)|0;r10=HEAP32[r16>>2];r13=r3>>>9&7;if((r3&32|0)!=0){r17=HEAP32[r1+88+(r13<<2)>>2]&63;r5=r1+166|0;r6=HEAPU16[r5>>1]>>>4&1;if((r17|0)==0){r18=r6;r19=r10;r20=0;r21=r5}else{r22=r17;r23=r5;r24=r6;r2=45}}else{r6=r1+166|0;r22=(r13|0)==0?8:r13;r23=r6;r24=HEAPU16[r6>>1]>>>4&1;r2=45}if(r2==45){r6=r24;r24=0;r13=r10;while(1){r10=r13&1;r5=r6<<31|r13>>>1;r17=r24+1|0;if(r17>>>0<r22>>>0){r6=r10;r24=r17;r13=r5}else{r18=r10;r19=r5;r20=r22;r21=r23;break}}}r23=r1+372|0;HEAP32[r23>>2]=(r20<<1)+8+HEAP32[r23>>2];_e68_cc_set_nz_32(r1,14,r19);r23=HEAP16[r21>>1];HEAP16[r21>>1]=(r18|0)==0?r23&-18:r23|17;r23=r1+156|0;r18=HEAP32[r23>>2];if((r18&1|0)!=0){_e68_exception_address(r1,r18,0,0);return}r21=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r21>>1];r20=r18&16777215;r18=r20+1|0;if(r18>>>0<HEAP32[r1+36>>2]>>>0){r22=HEAP32[r1+32>>2];r25=HEAPU8[r22+r20|0]<<8|HEAPU8[r22+r18|0]}else{r25=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r20)}HEAP16[r21>>1]=r25;if((HEAP8[r1+336|0]|0)==0){HEAP32[r23>>2]=HEAP32[r23>>2]+2;r23=r1+152|0;HEAP32[r23>>2]=HEAP32[r23>>2]+2;HEAP32[r16>>2]=r19;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r4=r1+88+((r3&7)<<2)|0;r19=HEAP32[r4>>2];r16=r3>>>9&7;do{if((r3&32|0)==0){r23=(r16|0)==0?8:r16;r25=r19>>>(r23>>>0);if((r19|0)<0){r26=r23;r27=r25;r2=8}else{r28=r25;r29=r23;r2=9}}else{r23=HEAP32[r1+88+(r16<<2)>>2]&63;if((r23|0)==0){r25=r1+166|0;HEAP16[r25>>1]=HEAP16[r25>>1]&-2;r30=r19;r31=0;break}r25=(r19|0)<0;if(r23>>>0<32){r21=r19>>>(r23>>>0);if(r25){r26=r23;r27=r21;r2=8;break}else{r28=r21;r29=r23;r2=9;break}}r21=r1+166|0;r20=HEAP16[r21>>1];if(r25){HEAP16[r21>>1]=r20|17;r30=-1;r31=r23;break}else{HEAP16[r21>>1]=r20&-18;r30=0;r31=r23;break}}}while(0);if(r2==8){r28=-1<<32-r26|r27;r29=r26;r2=9}do{if(r2==9){r26=r1+166|0;r27=HEAP16[r26>>1];if((1<<r29-1&r19|0)==0){HEAP16[r26>>1]=r27&-18;r30=r28;r31=r29;break}else{HEAP16[r26>>1]=r27|17;r30=r28;r31=r29;break}}}while(0);r29=r1+372|0;HEAP32[r29>>2]=(r31<<1)+8+HEAP32[r29>>2];_e68_cc_set_nz_32(r1,14,r30);r29=r1+156|0;r31=HEAP32[r29>>2];if((r31&1|0)!=0){_e68_exception_address(r1,r31,0,0);return}r28=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r28>>1];r19=r31&16777215;r31=r19+1|0;if(r31>>>0<HEAP32[r1+36>>2]>>>0){r2=HEAP32[r1+32>>2];r32=HEAPU8[r2+r19|0]<<8|HEAPU8[r2+r31|0]}else{r32=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r19)}HEAP16[r28>>1]=r32;if((HEAP8[r1+336|0]|0)==0){HEAP32[r29>>2]=HEAP32[r29>>2]+2;r29=r1+152|0;HEAP32[r29>>2]=HEAP32[r29>>2]+2;HEAP32[r4>>2]=r30;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r30=r1+372|0;HEAP32[r30>>2]=HEAP32[r30>>2]+2;return}}function _ope0c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAP16[r3>>1];r5=(r4&65535)>>>1|r4&-32768;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_16(r1,14,r5);r4=r1+166|0;r6=HEAP16[r4>>1];HEAP16[r4>>1]=(HEAP16[r3>>1]&1)==0?r6&-18:r6|17;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==3){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r6&255;r8=r3>>>9&7;if((r3&32|0)==0){r9=(r8|0)==0?8:r8}else{r9=HEAP32[r1+88+(r8<<2)>>2]&63}r8=r9&7;do{if((r8|0)!=0){r10=r6&255;r11=r10>>>((8-r8|0)>>>0)|r10<<r8;r10=r11&255;r12=r1+166|0;r13=HEAP16[r12>>1];if((r11&1|0)==0){HEAP16[r12>>1]=r13&-2;r14=r10;break}else{HEAP16[r12>>1]=r13|1;r14=r10;break}}else{if((r9|0)!=0?(r6&1|0)!=0:0){r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]|1;r14=r7;break}r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]&-2;r14=r7}}while(0);r7=r1+372|0;HEAP32[r7>>2]=(r9<<1)+6+HEAP32[r7>>2];_e68_cc_set_nz_8(r1,14,r14);r7=r1+156|0;r9=HEAP32[r7>>2];if((r9&1|0)!=0){_e68_exception_address(r1,r9,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r8=r9&16777215;r9=r8+1|0;if(r9>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r15=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r9|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-256|r14&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r14=r1+88+((r3&7)<<2)|0;r5=HEAP32[r14>>2]&255;r7=r3>>>9&7;if((r3&32|0)!=0){r15=HEAP32[r1+88+(r7<<2)>>2]&63;r6=r1+166|0;r8=HEAPU16[r6>>1]>>>4&1;if((r15|0)==0){r16=r5;r17=r8;r18=0;r19=r6}else{r20=r15;r21=r6;r22=r8;r2=48}}else{r8=r1+166|0;r20=(r7|0)==0?8:r7;r21=r8;r22=HEAPU16[r8>>1]>>>4&1;r2=48}if(r2==48){r8=0;r7=r5;r5=r22;while(1){r22=r7<<1|r5;r6=r8+1|0;r15=(r7&65535)>>>7&1;if(r6>>>0<r20>>>0){r8=r6;r7=r22;r5=r15}else{r16=r22;r17=r15;r18=r20;r19=r21;break}}}r21=r1+372|0;HEAP32[r21>>2]=(r18<<1)+6+HEAP32[r21>>2];_e68_cc_set_nz_8(r1,14,r16&255);r21=HEAP16[r19>>1];HEAP16[r19>>1]=r17<<16>>16==0?r21&-18:r21|17;r21=r1+156|0;r17=HEAP32[r21>>2];if((r17&1|0)!=0){_e68_exception_address(r1,r17,0,0);return}r19=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r19>>1];r18=r17&16777215;r17=r18+1|0;if(r17>>>0<HEAP32[r1+36>>2]>>>0){r20=HEAP32[r1+32>>2];r23=HEAPU8[r20+r18|0]<<8|HEAPU8[r20+r17|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r18)}HEAP16[r19>>1]=r23;if((HEAP8[r1+336|0]|0)==0){HEAP32[r21>>2]=HEAP32[r21>>2]+2;r21=r1+152|0;HEAP32[r21>>2]=HEAP32[r21>>2]+2;HEAP32[r14>>2]=HEAP32[r14>>2]&-256|r16&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r16=r1+88+((r3&7)<<2)|0;r14=HEAP32[r16>>2];r21=r3>>>9&7;if((r3&32|0)!=0){r23=HEAP32[r1+88+(r21<<2)>>2]&63;if((r23|0)==0){r19=r1+166|0;HEAP16[r19>>1]=HEAP16[r19>>1]&-4;r24=r14&255;r25=0}else{r26=r23;r2=6}}else{r26=(r21|0)==0?8:r21;r2=6}do{if(r2==6){if(r26>>>0<8){r21=r14&255;r23=r21<<r26&255;r19=r1+166|0;r18=HEAP16[r19>>1];r17=(1<<8-r26&r21|0)==0?r18&-18:r18|17;HEAP16[r19>>1]=r17;r18=255<<7-r26&255;r21=r18&r14;if((r21|0)==0|(r21|0)==(r18|0)){HEAP16[r19>>1]=r17&-3;r24=r23;r25=r26;break}else{HEAP16[r19>>1]=r17|2;r24=r23;r25=r26;break}}if((r26|0)==8?(r14&1|0)!=0:0){r23=r1+166|0;r17=HEAP16[r23>>1]|17;HEAP16[r23>>1]=r17;r27=r17}else{r2=13}if(r2==13){r17=r1+166|0;r23=HEAP16[r17>>1]&-18;HEAP16[r17>>1]=r23;r27=r23}r23=r1+166|0;if((r14&255|0)==0){HEAP16[r23>>1]=r27&-3;r24=0;r25=r26;break}else{HEAP16[r23>>1]=r27|2;r24=0;r25=r26;break}}}while(0);r26=r1+372|0;HEAP32[r26>>2]=(r25<<1)+6+HEAP32[r26>>2];_e68_cc_set_nz_8(r1,12,r24);r26=r1+156|0;r25=HEAP32[r26>>2];if((r25&1|0)!=0){_e68_exception_address(r1,r25,0,0);return}r27=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r27>>1];r14=r25&16777215;r25=r14+1|0;if(r25>>>0<HEAP32[r1+36>>2]>>>0){r23=HEAP32[r1+32>>2];r28=HEAPU8[r23+r14|0]<<8|HEAPU8[r23+r25|0]}else{r28=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14)}HEAP16[r27>>1]=r28;if((HEAP8[r1+336|0]|0)==0){HEAP32[r26>>2]=HEAP32[r26>>2]+2;r26=r1+152|0;HEAP32[r26>>2]=HEAP32[r26>>2]+2;HEAP32[r16>>2]=HEAP32[r16>>2]&-256|r24&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==1){r4=r1+88+((r3&7)<<2)|0;r24=HEAP32[r4>>2];r16=r3>>>9&7;if((r3&32|0)!=0){r3=HEAP32[r1+88+(r16<<2)>>2]&63;if((r3|0)==0){r26=r1+166|0;HEAP16[r26>>1]=HEAP16[r26>>1]&-2;r29=r24&255;r30=0}else{r31=r3;r2=29}}else{r31=(r16|0)==0?8:r16;r2=29}do{if(r2==29){if(r31>>>0<8){r16=r24&255;r3=r16<<r31&255;r26=r1+166|0;r28=HEAP16[r26>>1];if((1<<8-r31&r16|0)==0){HEAP16[r26>>1]=r28&-18;r29=r3;r30=r31;break}else{HEAP16[r26>>1]=r28|17;r29=r3;r30=r31;break}}if((r31|0)==8?(r24&1|0)!=0:0){r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]|17;r29=0;r30=8;break}r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-18;r29=0;r30=r31}}while(0);r31=r1+372|0;HEAP32[r31>>2]=(r30<<1)+6+HEAP32[r31>>2];_e68_cc_set_nz_8(r1,14,r29);r31=r1+156|0;r30=HEAP32[r31>>2];if((r30&1|0)!=0){_e68_exception_address(r1,r30,0,0);return}r24=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r24>>1];r2=r30&16777215;r30=r2+1|0;if(r30>>>0<HEAP32[r1+36>>2]>>>0){r3=HEAP32[r1+32>>2];r32=HEAPU8[r3+r2|0]<<8|HEAPU8[r3+r30|0]}else{r32=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r2)}HEAP16[r24>>1]=r32;if((HEAP8[r1+336|0]|0)==0){HEAP32[r31>>2]=HEAP32[r31>>2]+2;r31=r1+152|0;HEAP32[r31>>2]=HEAP32[r31>>2]+2;HEAP32[r4>>2]=HEAP32[r4>>2]&-256|r29&255;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r29=r1+372|0;HEAP32[r29>>2]=HEAP32[r29>>2]+2;return}}function _ope140(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==1){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;do{if((r3&32|0)!=0){r8=HEAP32[r1+88+(r7<<2)>>2]&63;if((r8|0)==0){r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-2;r10=r6&65535;r11=0;break}if(r8>>>0<16){r12=r8;r2=30}else{if((r8|0)==16?(r6&1|0)!=0:0){r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]|17;r10=0;r11=16;break}r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-18;r10=0;r11=r8}}else{r12=(r7|0)==0?8:r7;r2=30}}while(0);do{if(r2==30){r7=r6&65535;r8=r7<<r12&65535;r9=r1+166|0;r13=HEAP16[r9>>1];if((1<<16-r12&r7|0)==0){HEAP16[r9>>1]=r13&-18;r10=r8;r11=r12;break}else{HEAP16[r9>>1]=r13|17;r10=r8;r11=r12;break}}}while(0);r12=r1+372|0;HEAP32[r12>>2]=(r11<<1)+6+HEAP32[r12>>2];_e68_cc_set_nz_16(r1,14,r10);r12=r1+156|0;r11=HEAP32[r12>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r8=r11&16777215;r11=r8+1|0;if(r11>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r8|0]<<8|HEAPU8[r13+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r12>>2]=HEAP32[r12>>2]+2;r12=r1+152|0;HEAP32[r12>>2]=HEAP32[r12>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r10&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r10=r1+88+((r3&7)<<2)|0;r5=HEAP32[r10>>2]&65535;r12=r3>>>9&7;if((r3&32|0)!=0){r14=HEAP32[r1+88+(r12<<2)>>2]&63;r6=r1+166|0;r8=HEAPU16[r6>>1]>>>4&1;if((r14|0)==0){r15=r8;r16=r5;r17=0;r18=r6}else{r19=r14;r20=r6;r21=r8;r2=48}}else{r8=r1+166|0;r19=(r12|0)==0?8:r12;r20=r8;r21=HEAPU16[r8>>1]>>>4&1;r2=48}if(r2==48){r8=r21;r21=0;r12=r5;while(1){r5=(r12&65535)>>>15;r6=r8|r12<<1;r14=r21+1|0;if(r14>>>0<r19>>>0){r8=r5;r21=r14;r12=r6}else{r15=r5;r16=r6;r17=r19;r18=r20;break}}}r20=r1+372|0;HEAP32[r20>>2]=(r17<<1)+6+HEAP32[r20>>2];_e68_cc_set_nz_16(r1,14,r16);r20=HEAP16[r18>>1];HEAP16[r18>>1]=r15<<16>>16==0?r20&-18:r20|17;r20=r1+156|0;r15=HEAP32[r20>>2];if((r15&1|0)!=0){_e68_exception_address(r1,r15,0,0);return}r18=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r18>>1];r17=r15&16777215;r15=r17+1|0;if(r15>>>0<HEAP32[r1+36>>2]>>>0){r19=HEAP32[r1+32>>2];r22=HEAPU8[r19+r17|0]<<8|HEAPU8[r19+r15|0]}else{r22=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r17)}HEAP16[r18>>1]=r22;if((HEAP8[r1+336|0]|0)==0){HEAP32[r20>>2]=HEAP32[r20>>2]+2;r20=r1+152|0;HEAP32[r20>>2]=HEAP32[r20>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]&-65536|r16&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r16=r1+88+((r3&7)<<2)|0;r10=HEAP32[r16>>2];r20=r3>>>9&7;do{if((r3&32|0)!=0){r22=HEAP32[r1+88+(r20<<2)>>2]&63;if((r22|0)==0){r18=r1+166|0;HEAP16[r18>>1]=HEAP16[r18>>1]&-4;r23=r10&65535;r24=0;break}if(r22>>>0>=16){if((r22|0)==16?(r10&1|0)!=0:0){r18=r1+166|0;r17=HEAP16[r18>>1]|17;HEAP16[r18>>1]=r17;r25=r17}else{r2=13}if(r2==13){r17=r1+166|0;r18=HEAP16[r17>>1]&-18;HEAP16[r17>>1]=r18;r25=r18}r18=r1+166|0;if((r10&65535|0)==0){HEAP16[r18>>1]=r25&-3;r23=0;r24=r22;break}else{HEAP16[r18>>1]=r25|2;r23=0;r24=r22;break}}else{r26=r22;r2=7}}else{r26=(r20|0)==0?8:r20;r2=7}}while(0);do{if(r2==7){r20=r10&65535;r25=r20<<r26&65535;r22=r1+166|0;r18=HEAP16[r22>>1];r17=(1<<16-r26&r20|0)==0?r18&-18:r18|17;HEAP16[r22>>1]=r17;r18=65535<<15-r26&65535;r20=r18&r10;if((r20|0)==0|(r20|0)==(r18|0)){HEAP16[r22>>1]=r17&-3;r23=r25;r24=r26;break}else{HEAP16[r22>>1]=r17|2;r23=r25;r24=r26;break}}}while(0);r26=r1+372|0;HEAP32[r26>>2]=(r24<<1)+6+HEAP32[r26>>2];_e68_cc_set_nz_16(r1,12,r23);r26=r1+156|0;r24=HEAP32[r26>>2];if((r24&1|0)!=0){_e68_exception_address(r1,r24,0,0);return}r10=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r10>>1];r2=r24&16777215;r24=r2+1|0;if(r24>>>0<HEAP32[r1+36>>2]>>>0){r25=HEAP32[r1+32>>2];r27=HEAPU8[r25+r2|0]<<8|HEAPU8[r25+r24|0]}else{r27=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r2)}HEAP16[r10>>1]=r27;if((HEAP8[r1+336|0]|0)==0){HEAP32[r26>>2]=HEAP32[r26>>2]+2;r26=r1+152|0;HEAP32[r26>>2]=HEAP32[r26>>2]+2;HEAP32[r16>>2]=HEAP32[r16>>2]&-65536|r23&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r4=r1+88+((r3&7)<<2)|0;r23=HEAP32[r4>>2];r16=r23&65535;r26=r3>>>9&7;if((r3&32|0)==0){r28=(r26|0)==0?8:r26}else{r28=HEAP32[r1+88+(r26<<2)>>2]&63}r26=r28&15;do{if((r26|0)!=0){r3=r23&65535;r27=r3>>>((16-r26|0)>>>0)|r3<<r26;r3=r27&65535;r10=r1+166|0;r2=HEAP16[r10>>1];if((r27&1|0)==0){HEAP16[r10>>1]=r2&-2;r29=r3;break}else{HEAP16[r10>>1]=r2|1;r29=r3;break}}else{if((r28|0)!=0?(r23&1|0)!=0:0){r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]|1;r29=r16;break}r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-2;r29=r16}}while(0);r16=r1+372|0;HEAP32[r16>>2]=(r28<<1)+6+HEAP32[r16>>2];_e68_cc_set_nz_16(r1,14,r29);r16=r1+156|0;r28=HEAP32[r16>>2];if((r28&1|0)!=0){_e68_exception_address(r1,r28,0,0);return}r23=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r23>>1];r26=r28&16777215;r28=r26+1|0;if(r28>>>0<HEAP32[r1+36>>2]>>>0){r3=HEAP32[r1+32>>2];r30=HEAPU8[r3+r26|0]<<8|HEAPU8[r3+r28|0]}else{r30=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r26)}HEAP16[r23>>1]=r30;if((HEAP8[r1+336|0]|0)==0){HEAP32[r16>>2]=HEAP32[r16>>2]+2;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;HEAP32[r4>>2]=HEAP32[r4>>2]&-65536|r29&65535;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r29=r1+372|0;HEAP32[r29>>2]=HEAP32[r29>>2]+2;return}}function _ope180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==2){r5=r3>>>9&7;if((r3&32|0)==0){r6=(r5|0)==0?8:r5}else{r6=HEAP32[r1+88+(r5<<2)>>2]&63}r5=r1+88+((r3&7)<<2)|0;r7=HEAP32[r5>>2];r8=r1+166|0;r9=HEAPU16[r8>>1]>>>4&1;if((r6|0)==0){r10=r9;r11=r7}else{r12=r9;r9=0;r13=r7;while(1){r7=r13>>>31;r14=r12|r13<<1;r15=r9+1|0;if(r15>>>0<r6>>>0){r12=r7;r9=r15;r13=r14}else{r10=r7;r11=r14;break}}}r13=r1+372|0;HEAP32[r13>>2]=(r6<<1)+8+HEAP32[r13>>2];_e68_cc_set_nz_32(r1,14,r11);r13=HEAP16[r8>>1];HEAP16[r8>>1]=(r10|0)==0?r13&-18:r13|17;r13=r1+156|0;r10=HEAP32[r13>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r6=r10&16777215;r10=r6+1|0;if(r10>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r16=HEAPU8[r9+r6|0]<<8|HEAPU8[r9+r10|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r8>>1]=r16;if((HEAP8[r1+336|0]|0)==0){HEAP32[r13>>2]=HEAP32[r13>>2]+2;r13=r1+152|0;HEAP32[r13>>2]=HEAP32[r13>>2]+2;HEAP32[r5>>2]=r11;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r11=r1+88+((r3&7)<<2)|0;r5=HEAP32[r11>>2];r13=r3>>>9&7;if((r3&32|0)==0){r17=(r13|0)==0?8:r13}else{r17=HEAP32[r1+88+(r13<<2)>>2]&63}r13=r17&31;do{if((r13|0)!=0){r16=r5>>>((32-r13|0)>>>0)|r5<<r13;r8=r1+166|0;r6=HEAP16[r8>>1];if((r16&1|0)==0){HEAP16[r8>>1]=r6&-2;r18=r16;break}else{HEAP16[r8>>1]=r6|1;r18=r16;break}}else{if((r17|0)!=0?(r5&1|0)!=0:0){r16=r1+166|0;HEAP16[r16>>1]=HEAP16[r16>>1]|1;r18=r5;break}r16=r1+166|0;HEAP16[r16>>1]=HEAP16[r16>>1]&-2;r18=r5}}while(0);r5=r1+372|0;HEAP32[r5>>2]=(r17<<1)+8+HEAP32[r5>>2];_e68_cc_set_nz_32(r1,14,r18);r5=r1+156|0;r17=HEAP32[r5>>2];if((r17&1|0)!=0){_e68_exception_address(r1,r17,0,0);return}r13=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r13>>1];r16=r17&16777215;r17=r16+1|0;if(r17>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r19=HEAPU8[r6+r16|0]<<8|HEAPU8[r6+r17|0]}else{r19=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r13>>1]=r19;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;HEAP32[r11>>2]=r18;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r18=r1+88+((r3&7)<<2)|0;r11=HEAP32[r18>>2];r5=r3>>>9&7;do{if((r3&32|0)!=0){r19=HEAP32[r1+88+(r5<<2)>>2]&63;if((r19|0)==0){r13=r1+166|0;HEAP16[r13>>1]=HEAP16[r13>>1]&-4;r20=r11;r21=0;break}if(r19>>>0>=32){if((r19|0)==32?(r11&1|0)!=0:0){r13=r1+166|0;r16=HEAP16[r13>>1]|17;HEAP16[r13>>1]=r16;r22=r16}else{r2=13}if(r2==13){r16=r1+166|0;r13=HEAP16[r16>>1]&-18;HEAP16[r16>>1]=r13;r22=r13}r13=r1+166|0;if((r11|0)==0){HEAP16[r13>>1]=r22&-3;r20=0;r21=r19;break}else{HEAP16[r13>>1]=r22|2;r20=0;r21=r19;break}}else{r23=r19;r2=7}}else{r23=(r5|0)==0?8:r5;r2=7}}while(0);do{if(r2==7){r5=r11<<r23;r22=-1<<31-r23;r19=r1+166|0;r13=HEAP16[r19>>1];r16=(1<<32-r23&r11|0)==0?r13&-18:r13|17;HEAP16[r19>>1]=r16;r13=r22&r11;if((r13|0)==0|(r13|0)==(r22|0)){HEAP16[r19>>1]=r16&-3;r20=r5;r21=r23;break}else{HEAP16[r19>>1]=r16|2;r20=r5;r21=r23;break}}}while(0);r23=r1+372|0;HEAP32[r23>>2]=(r21<<1)+8+HEAP32[r23>>2];_e68_cc_set_nz_32(r1,12,r20);r23=r1+156|0;r21=HEAP32[r23>>2];if((r21&1|0)!=0){_e68_exception_address(r1,r21,0,0);return}r11=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r11>>1];r5=r21&16777215;r21=r5+1|0;if(r21>>>0<HEAP32[r1+36>>2]>>>0){r16=HEAP32[r1+32>>2];r24=HEAPU8[r16+r5|0]<<8|HEAPU8[r16+r21|0]}else{r24=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r11>>1]=r24;if((HEAP8[r1+336|0]|0)==0){HEAP32[r23>>2]=HEAP32[r23>>2]+2;r23=r1+152|0;HEAP32[r23>>2]=HEAP32[r23>>2]+2;HEAP32[r18>>2]=r20;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==1){r4=r1+88+((r3&7)<<2)|0;r20=HEAP32[r4>>2];r18=r3>>>9&7;do{if((r3&32|0)!=0){r23=HEAP32[r1+88+(r18<<2)>>2]&63;if((r23|0)==0){r24=r1+166|0;HEAP16[r24>>1]=HEAP16[r24>>1]&-2;r25=r20;r26=0;break}if(r23>>>0<32){r27=r23;r2=30}else{if((r23|0)==32?(r20&1|0)!=0:0){r24=r1+166|0;HEAP16[r24>>1]=HEAP16[r24>>1]|17;r25=0;r26=32;break}r24=r1+166|0;HEAP16[r24>>1]=HEAP16[r24>>1]&-18;r25=0;r26=r23}}else{r27=(r18|0)==0?8:r18;r2=30}}while(0);do{if(r2==30){r18=r20<<r27;r3=r1+166|0;r23=HEAP16[r3>>1];if((1<<32-r27&r20|0)==0){HEAP16[r3>>1]=r23&-18;r25=r18;r26=r27;break}else{HEAP16[r3>>1]=r23|17;r25=r18;r26=r27;break}}}while(0);r27=r1+372|0;HEAP32[r27>>2]=(r26<<1)+8+HEAP32[r27>>2];_e68_cc_set_nz_32(r1,14,r25);r27=r1+156|0;r26=HEAP32[r27>>2];if((r26&1|0)!=0){_e68_exception_address(r1,r26,0,0);return}r20=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r20>>1];r2=r26&16777215;r26=r2+1|0;if(r26>>>0<HEAP32[r1+36>>2]>>>0){r18=HEAP32[r1+32>>2];r28=HEAPU8[r18+r2|0]<<8|HEAPU8[r18+r26|0]}else{r28=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r2)}HEAP16[r20>>1]=r28;if((HEAP8[r1+336|0]|0)==0){HEAP32[r27>>2]=HEAP32[r27>>2]+2;r27=r1+152|0;HEAP32[r27>>2]=HEAP32[r27>>2]+2;HEAP32[r4>>2]=r25;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r25=r1+372|0;HEAP32[r25>>2]=HEAP32[r25>>2]+2;return}}function _ope1c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU16[r3>>1]<<1;r5=r4&65535;r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;_e68_cc_set_nz_16(r1,12,r5);r6=HEAP16[r3>>1];r3=r1+166|0;r7=HEAP16[r3>>1];r8=r6<<16>>16<0?r7|17:r7&-18;HEAP16[r3>>1]=((r6&65535^r4)&32768|0)==0?r8&-3:r8|2;r8=r1+156|0;r4=HEAP32[r8>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r3=r4&16777215;r4=r3+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r9=HEAPU8[r7+r3|0]<<8|HEAPU8[r7+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r3)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope2c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU16[r3>>1]>>>1;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;_e68_cc_set_nz_16(r1,14,r4);r5=r1+166|0;r6=HEAP16[r5>>1];HEAP16[r5>>1]=(HEAP16[r3>>1]&1)==0?r6&-18:r6|17;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r5>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope3c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAP16[r3>>1]<<1;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;_e68_cc_set_nz_16(r1,14,r4);r5=r1+166|0;r6=HEAP16[r5>>1];HEAP16[r5>>1]=(HEAP16[r3>>1]|0)<0?r6|17:r6&-18;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r5>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope4c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+166|0;r5=HEAPU16[r3>>1]>>>1|HEAPU16[r4>>1]>>>4<<15;r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;_e68_cc_set_nz_16(r1,14,r5);r6=HEAP16[r4>>1];HEAP16[r4>>1]=(HEAP16[r3>>1]&1)==0?r6&-18:r6|17;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope5c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+166|0;r5=HEAP16[r3>>1]<<1|HEAPU16[r4>>1]>>>4&1;r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;_e68_cc_set_nz_16(r1,14,r5);r6=HEAP16[r4>>1];HEAP16[r4>>1]=(HEAP16[r3>>1]|0)<0?r6|17:r6&-18;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope6c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAP16[r3>>1];r5=(r4&65535)>>>1|r4<<15;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_16(r1,14,r5);r4=r1+166|0;r6=HEAP16[r4>>1];HEAP16[r4>>1]=(HEAP16[r3>>1]&1)==0?r6&-2:r6|1;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope7c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU16[r3>>1];r3=r4>>>15;r5=(r4<<1|r3)&65535;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_16(r1,14,r5);r4=r1+166|0;r6=HEAP16[r4>>1];HEAP16[r4>>1]=(r3|0)==0?r6&-2:r6|1;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opf000(r1){HEAP16[r1+330>>1]=HEAP16[r1+160>>1];_e68_exception_fxxx(r1);return}function _e68_op_bcc(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=r1+152|0;r4=HEAP32[r3>>2]+2|0;r5=r1+160|0;r6=HEAPU16[r5>>1];r7=(r6&128|0)!=0?r6|-256:r6&255;do{if((r7|0)==0){r6=r1+156|0;r8=HEAP32[r6>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);return}r9=r1+164|0;r10=r1+162|0;HEAP16[r10>>1]=HEAP16[r9>>1];r11=r8&16777215;r8=r11+1|0;if(r8>>>0<HEAP32[r1+36>>2]>>>0){r12=HEAP32[r1+32>>2];r13=HEAPU8[r12+r11|0]<<8|HEAPU8[r12+r8|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r9>>1]=r13;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r6=HEAPU16[r10>>1];r14=(r6&32768|0)!=0?r6|-65536:r6;break}_e68_exception_bus(r1);return}else{r14=r7}}while(0);do{if((r2|0)==0){r7=r1+372|0;HEAP32[r7>>2]=((HEAP16[r5>>1]&255)==0?12:8)+HEAP32[r7>>2];r15=HEAP32[r1+156>>2]}else{r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+10;r7=r4+r14|0;r13=r1+156|0;HEAP32[r13>>2]=r7;if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r10=r7&16777215;r7=r10+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r16=HEAPU8[r9+r10|0]<<8|HEAPU8[r9+r7|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r6>>1]=r16;if((HEAP8[r1+336|0]|0)==0){r6=HEAP32[r13>>2]+2|0;HEAP32[r13>>2]=r6;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r15=r6;break}_e68_exception_bus(r1);return}}while(0);r16=r1+156|0;if((r15&1|0)!=0){_e68_exception_address(r1,r15,0,0);return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r4=r15&16777215;r15=r4+1|0;if(r15>>>0<HEAP32[r1+36>>2]>>>0){r5=HEAP32[r1+32>>2];r17=HEAPU8[r5+r4|0]<<8|HEAPU8[r5+r15|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4)}HEAP16[r14>>1]=r17;if((HEAP8[r1+336|0]|0)==0){r17=HEAP32[r16>>2];HEAP32[r16>>2]=r17+2;HEAP32[r3>>2]=r17-2;return}else{_e68_exception_bus(r1);return}}function _e68_op_trapcc(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=HEAP16[r1+160>>1]&7;do{if((r3|0)==4){r4=HEAP32[r1+156>>2]}else if((r3|0)==3){r5=r1+156|0;r6=HEAP32[r5>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);return}r7=r1+164|0;r8=r1+162|0;HEAP16[r8>>1]=HEAP16[r7>>1];r9=r6&16777215;r6=r9+1|0;r10=r1+36|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r9|0]<<8|HEAPU8[r11+r6|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r7>>1]=r12;r9=r1+336|0;if((HEAP8[r9]|0)!=0){_e68_exception_bus(r1);return}r6=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r6;r11=r1+152|0;HEAP32[r11>>2]=HEAP32[r11>>2]+2;if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);return}HEAP16[r8>>1]=r12;r8=r6&16777215;r6=r8+1|0;if(r6>>>0>=HEAP32[r10>>2]>>>0){r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8);r13=(HEAP8[r9]|0)==0;HEAP16[r7>>1]=r10;if(!r13){_e68_exception_bus(r1);return}}else{r13=HEAP32[r1+32>>2];HEAP16[r7>>1]=HEAPU8[r13+r8|0]<<8|HEAPU8[r13+r6|0]}r6=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r6;HEAP32[r11>>2]=HEAP32[r11>>2]+2;r4=r6}else if((r3|0)==2){r6=r1+156|0;r11=HEAP32[r6>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r13=r11&16777215;r11=r13+1|0;if(r11>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r14=HEAPU8[r8+r13|0]<<8|HEAPU8[r8+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r13)}HEAP16[r5>>1]=r14;if((HEAP8[r1+336|0]|0)==0){r5=HEAP32[r6>>2]+2|0;HEAP32[r6>>2]=r5;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;r4=r5;break}_e68_exception_bus(r1);return}else{r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_exception_illegal(r1);return}}while(0);r14=r1+156|0;if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r12=r4&16777215;r4=r12+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r5=HEAP32[r1+32>>2];r15=HEAPU8[r5+r12|0]<<8|HEAPU8[r5+r4|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r12)}HEAP16[r3>>1]=r15;if((HEAP8[r1+336|0]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r14>>2]=HEAP32[r14>>2]+2;r14=r1+152|0;HEAP32[r14>>2]=HEAP32[r14>>2]+2;if((r2|0)==0){r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return}else{_e68_exception_overflow(r1);return}}function _e68_set_opcodes_020(r1){var r2,r3;_e68_set_opcodes(r1);r2=0;while(1){r3=HEAP32[24872+(r2<<2)>>2];if((r3|0)!=0){HEAP32[r1+400+(r2<<2)>>2]=r3}r3=r2+1|0;if(r3>>>0<1024){r2=r3}else{break}}HEAP32[r1+4496>>2]=1120;return}function _op49c0_00(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+88+((HEAP16[r1+160>>1]&7)<<2)|0;r3=HEAP32[r2>>2];r4=(r3&128|0)!=0?r3|-256:r3&255;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;_e68_cc_set_nz_32(r1,15,r4);r3=r1+156|0;r5=HEAP32[r3>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r5&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r5|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r2>>2]=r4;return}else{_e68_exception_bus(r1);return}}function _op00c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=r1+160|0;r3=HEAPU16[r2>>1]>>>9&3;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;if((HEAP16[r7>>1]&2047)!=0){r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_exception_illegal(r1);return}r5=HEAP16[r2>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r5<<2)>>2]](r1,r5,2020,8)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_exception_illegal(r1);return}r5=(r3|0)==0;do{if(r5){r2=r1+344|0;r10=HEAP32[r2>>2];r12=r10&16777215;r13=HEAP32[r9>>2];if(r12>>>0<r13>>>0){r14=HEAP8[HEAP32[r1+32>>2]+r12|0];r15=r10;r16=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r12);r14=r13;r15=HEAP32[r2>>2];r16=HEAP32[r9>>2]}r2=r14&255;r13=r15+1&16777215;if(r13>>>0<r16>>>0){r17=HEAP8[HEAP32[r1+32>>2]+r13|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r13)}r13=r17&255;r18=(r13&128|0)!=0?r13|-256:r13;r19=(r2&128|0)!=0?r2|-256:r2}else{r2=r1+344|0;r13=HEAP32[r2>>2];r12=r13&16777215;if((r3|0)!=1){r10=r12+3|0;r20=HEAP32[r9>>2];if(r10>>>0<r20>>>0){r21=HEAP32[r1+32>>2];r22=((HEAPU8[r21+r12|0]<<8|HEAPU8[r21+(r12+1)|0])<<8|HEAPU8[r21+(r12+2)|0])<<8|HEAPU8[r21+r10|0];r23=r13;r24=r20}else{r20=FUNCTION_TABLE[HEAP32[r1+16>>2]](HEAP32[r1+4>>2],r12);r22=r20;r23=HEAP32[r2>>2];r24=HEAP32[r9>>2]}r20=r23+4&16777215;r10=r20+3|0;if(r10>>>0<r24>>>0){r21=HEAP32[r1+32>>2];r18=((HEAPU8[r21+r20|0]<<8|HEAPU8[r21+(r20+1)|0])<<8|HEAPU8[r21+(r20+2)|0])<<8|HEAPU8[r21+r10|0];r19=r22;break}else{r18=FUNCTION_TABLE[HEAP32[r1+16>>2]](HEAP32[r1+4>>2],r20);r19=r22;break}}r20=r12+1|0;r10=HEAP32[r9>>2];if(r20>>>0<r10>>>0){r21=HEAP32[r1+32>>2];r25=HEAPU8[r21+r12|0]<<8|HEAPU8[r21+r20|0];r26=r13;r27=r10}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r12);r25=r10;r26=HEAP32[r2>>2];r27=HEAP32[r9>>2]}r2=r25&65535;r10=r26+2&16777215;r12=r10+1|0;if(r12>>>0<r27>>>0){r13=HEAP32[r1+32>>2];r28=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r12|0]}else{r28=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}r10=r28&65535;r18=(r10&32768|0)!=0?r10|-65536:r10;r19=(r2&32768|0)!=0?r2|-65536:r2}}while(0);r28=HEAP16[r7>>1];r27=r28&65535;r26=r27>>>12&7;do{if((r27&32768|0)==0){r25=HEAP32[r1+88+(r26<<2)>>2];if(r5){r29=(r25&128|0)!=0?r25|-256:r25&255;break}if((r3|0)==1){r29=(r25&32768|0)!=0?r25|-65536:r25&65535}else{r29=r25}}else{r29=HEAP32[r1+120+(r26<<2)>>2]}}while(0);r26=r29^-2147483648;if(r26>>>0<(r19^-2147483648)>>>0){r30=1}else{r30=r26>>>0>(r18^-2147483648)>>>0}r26=r1+166|0;r3=HEAP16[r26>>1];r5=(r29|0)==(r19|0)|(r29|0)==(r18|0)?r3|4:r3&-5;HEAP16[r26>>1]=r30?r5|1:r5&-2;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+14;if(!((r28&2048)==0|r30^1)){_e68_exception_check(r1);return}r30=HEAP32[r4>>2];if((r30&1|0)!=0){_e68_exception_address(r1,r30,0,0);return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r30&16777215;r30=r7+1|0;if(r30>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r31=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r30|0]}else{r31=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r31;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;return}else{_e68_exception_bus(r1);return}}function _op4100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r5<<2)>>2]](r1,r5,4093,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2];do{if((r5|0)>=0){r4=HEAP32[r3>>2];if((r4|0)<0|r5>>>0>r4>>>0){r4=r1+166|0;HEAP16[r4>>1]=HEAP16[r4>>1]&-9;break}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+14;r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else{r4=r1+166|0;HEAP16[r4>>1]=HEAP16[r4>>1]|8}}while(0);_e68_exception_check(r1);STACKTOP=r2;return}function _op4a001068(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,4093,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_8(r1,15,HEAP8[r3]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4a401069(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_16(r1,15,HEAP16[r3>>1]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4a801070(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r4<<2)>>2]](r1,r4,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_32(r1,15,HEAP32[r3>>2]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4c00(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=HEAPU16[r7>>1];if((r5&33544|0)!=0){r10=r1+372|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}r10=(r5&2048|0)!=0;r12=r5&7;r13=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r13<<2)>>2]](r1,r13,4093,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r13=HEAP32[r3>>2];r3=0;r14=r1+88+((r5>>>12&7)<<2)|0;r15=HEAP32[r14>>2];r16=0;if(r10){r17=(r13&-2147483648|0)==0&(r3&0|0)==0;r18=(r15&-2147483648|0)==0&(r16&0|0)==0;r19=r18?r16:r16|-1;r20=r18?r15:r15|0;r21=r17?r3:r3|-1;r22=r17?r13:r13|0}else{r19=r16;r20=r15;r21=r3;r22=r13}r13=___muldi3(r20,r19,r22,r21);r21=r13;r22=tempRet0;r19=r22;HEAP32[r14>>2]=r21;do{if((r5&1024|0)==0){r14=r1+166|0;r20=HEAP16[r14>>1];r3=(r19|0)<0?r20|8:r20&-9;r20=(r22|r13|0)==0?r3|4:r3&-5;HEAP16[r14>>1]=r20;if((r19|0)==((r10&(r21|0)<0)<<31>>31|0)){r3=r20&-3;HEAP16[r14>>1]=r3;r23=r3;break}else{r3=r20|2;HEAP16[r14>>1]=r3;r23=r3;break}}else{HEAP32[r1+88+(r12<<2)>>2]=r19;r3=r1+166|0;r14=HEAP16[r3>>1];r20=(r19|0)<0?r14|8:r14&-9;r14=((r22|r13|0)==0?r20|4:r20&-7)&-3;HEAP16[r3>>1]=r14;r23=r14}}while(0);r13=r1+372|0;HEAP32[r13>>2]=HEAP32[r13>>2]+74;HEAP16[r1+166>>1]=r23&-2;r23=HEAP32[r4>>2];if((r23&1|0)!=0){_e68_exception_address(r1,r23,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r23&16777215;r23=r7+1|0;if(r23>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r24=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r23|0]}else{r24=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r24;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4c40(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r1+156|0;r6=HEAP32[r5>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r3;return}r7=r1+164|0;r8=r1+162|0;HEAP16[r8>>1]=HEAP16[r7>>1];r9=r6&16777215;r6=r9+1|0;r10=r1+36|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r9|0]<<8|HEAPU8[r11+r6|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r7>>1]=r12;r12=r1+336|0;if((HEAP8[r12]|0)!=0){_e68_exception_bus(r1);STACKTOP=r3;return}HEAP32[r5>>2]=HEAP32[r5>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;r6=HEAPU16[r8>>1];if((r6&33544|0)!=0){r11=r1+372|0;HEAP32[r11>>2]=HEAP32[r11>>2]+2;_e68_exception_illegal(r1);STACKTOP=r3;return}r11=(r6&2048|0)!=0;r13=r6>>>12&7;r14=r6&7;r15=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r15<<2)>>2]](r1,r15,4093,32)|0)!=0){STACKTOP=r3;return}if((_e68_ea_get_val32(r1,r4)|0)!=0){STACKTOP=r3;return}r15=r1+88+(r13<<2)|0;r16=HEAP32[r15>>2];r17=HEAP32[r4>>2];if((r17|0)==0){_e68_exception_divzero(r1);STACKTOP=r3;return}if(r11){if((r17|0)<0){r18=-r17|0;HEAP32[r4>>2]=r18;r19=r18}else{r19=r17}r20=r17>>>31;r21=r16>>>31;r22=(r16|0)<0?-r16|0:r16;r23=r19}else{r20=0;r21=0;r22=r16;r23=r17}do{if((r6&1024|0)==0){r24=(r22>>>0)/(r23>>>0)&-1;r25=(r22>>>0)%(r23>>>0)&-1;r26=r21;r2=27}else{r17=HEAP32[r1+88+(r14<<2)>>2];if(r11){r19=r17>>>31;if((r17|0)<0){r27=r19;r28=((r16|0)==0)+~r17|0;r29=-r16|0}else{r27=r19;r28=r17;r29=r16}}else{r27=r21;r28=r17;r29=r16}r17=r29|0;r19=r28|0;r18=r23;r4=0;r30=___udivdi3(r17,r19,r18,r4);r31=tempRet0;r32=r30;r33=___uremdi3(r17,r19,r18,r4);r4=r33;if(r11){r33=0;if(!(r31>>>0>r33>>>0|r31>>>0==r33>>>0&r30>>>0>-2147483648>>>0)?!((r30|0)==(-2147483648|0)&(r31|0)==0&(r20|0)==(r27|0)):0){r24=r32;r25=r4;r26=r27;r2=27;break}}else{r33=1;if(r31>>>0<r33>>>0|r31>>>0==r33>>>0&r30>>>0<0>>>0){r24=r32;r25=r4;r26=r27;r2=27;break}}r4=r1+166|0;HEAP16[r4>>1]=HEAP16[r4>>1]|2}}while(0);if(r2==27){r2=(r20|0)==(r26|0)?r24:-r24|0;HEAP32[r15>>2]=r2;if((r14|0)!=(r13|0)){HEAP32[r1+88+(r14<<2)>>2]=(r26|0)==0?r25:-r25|0}_e68_cc_set_nz_32(r1,15,r2)}r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+144;r2=HEAP32[r5>>2];if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);STACKTOP=r3;return}HEAP16[r8>>1]=HEAP16[r7>>1];r8=r2&16777215;r2=r8+1|0;if(r2>>>0<HEAP32[r10>>2]>>>0){r10=HEAP32[r1+32>>2];r34=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r2|0]}else{r34=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r34;if((HEAP8[r12]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;HEAP32[r9>>2]=HEAP32[r9>>2]+2;STACKTOP=r3;return}else{_e68_exception_bus(r1);STACKTOP=r3;return}}function _op50c01071(r1){var r2;r2=HEAPU16[r1+160>>1];if((r2&62|0)==58|(r2&63|0)==60){_e68_op_trapcc(r1,1);return}if((r2&56|0)==8){_e68_op_dbcc(r1,1);return}else{_e68_op_scc(r1,1);return}}function _op51c01072(r1){var r2;r2=HEAPU16[r1+160>>1];if((r2&62|0)==58|(r2&63|0)==60){_e68_op_trapcc(r1,0);return}if((r2&56|0)==8){_e68_op_dbcc(r1,0);return}else{_e68_op_scc(r1,0);return}}function _op52c01073(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if((r2&1|0)==0){r3=r2>>>2&1^1}else{r3=0}r2=HEAPU16[r1+160>>1];if((r2&62|0)==58|(r2&63|0)==60){_e68_op_trapcc(r1,r3);return}if((r2&56|0)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op53c01074(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if((r2&1|0)==0){r3=r2>>>2&1}else{r3=1}r2=HEAPU16[r1+160>>1];if((r2&62|0)==58|(r2&63|0)==60){_e68_op_trapcc(r1,r3);return}if((r2&56|0)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op54c01075(r1){var r2,r3;r2=(HEAP16[r1+166>>1]&1^1)&65535;r3=HEAPU16[r1+160>>1];if((r3&62|0)==58|(r3&63|0)==60){_e68_op_trapcc(r1,r2);return}if((r3&56|0)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op55c01076(r1){var r2,r3;r2=HEAP16[r1+166>>1]&1;r3=HEAPU16[r1+160>>1];if((r3&62|0)==58|(r3&63|0)==60){_e68_op_trapcc(r1,r2);return}if((r3&56|0)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op56c01077(r1){var r2,r3;r2=(HEAPU16[r1+166>>1]>>>2&1^1)&65535;r3=HEAPU16[r1+160>>1];if((r3&62|0)==58|(r3&63|0)==60){_e68_op_trapcc(r1,r2);return}if((r3&56|0)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op57c01078(r1){var r2,r3;r2=HEAPU16[r1+166>>1]>>>2&1;r3=HEAPU16[r1+160>>1];if((r3&62|0)==58|(r3&63|0)==60){_e68_op_trapcc(r1,r2);return}if((r3&56|0)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op58c01079(r1){var r2,r3;r2=(HEAPU16[r1+166>>1]>>>1&1^1)&65535;r3=HEAPU16[r1+160>>1];if((r3&62|0)==58|(r3&63|0)==60){_e68_op_trapcc(r1,r2);return}if((r3&56|0)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op59c01080(r1){var r2,r3;r2=HEAPU16[r1+166>>1]>>>1&1;r3=HEAPU16[r1+160>>1];if((r3&62|0)==58|(r3&63|0)==60){_e68_op_trapcc(r1,r2);return}if((r3&56|0)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op5ac01081(r1){var r2,r3;r2=(HEAPU16[r1+166>>1]>>>3&1^1)&65535;r3=HEAPU16[r1+160>>1];if((r3&62|0)==58|(r3&63|0)==60){_e68_op_trapcc(r1,r2);return}if((r3&56|0)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op5bc01082(r1){var r2,r3;r2=HEAPU16[r1+166>>1]>>>3&1;r3=HEAPU16[r1+160>>1];if((r3&62|0)==58|(r3&63|0)==60){_e68_op_trapcc(r1,r2);return}if((r3&56|0)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op5cc01083(r1){var r2,r3;r2=HEAPU16[r1+166>>1];r3=(r2>>>3^r2>>>1)&1^1;r2=HEAPU16[r1+160>>1];if((r2&62|0)==58|(r2&63|0)==60){_e68_op_trapcc(r1,r3);return}if((r2&56|0)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op5dc01084(r1){var r2,r3;r2=HEAPU16[r1+166>>1];r3=(r2>>>3^r2>>>1)&1;r2=HEAPU16[r1+160>>1];if((r2&62|0)==58|(r2&63|0)==60){_e68_op_trapcc(r1,r3);return}if((r2&56|0)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op5ec01085(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if(((r2>>>3^r2>>>1)&1|0)==0){r3=r2>>>2&1^1}else{r3=0}r2=HEAPU16[r1+160>>1];if((r2&62|0)==58|(r2&63|0)==60){_e68_op_trapcc(r1,r3);return}if((r2&56|0)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op5fc01086(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if(((r2>>>3^r2>>>1)&1|0)==0){r3=r2>>>2&1}else{r3=1}r2=HEAPU16[r1+160>>1];if((r2&62|0)==58|(r2&63|0)==60){_e68_op_trapcc(r1,r3);return}if((r2&56|0)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op60001087(r1){_e68020_op_bcc(r1,1);return}function _op61001088(r1){var r2,r3,r4,r5,r6,r7;r2=HEAP16[r1+160>>1]&255;if((r2|0)==255){r3=HEAP32[r1+152>>2]+6|0}else if((r2|0)==0){r3=HEAP32[r1+152>>2]+4|0}else{r3=HEAP32[r1+152>>2]+2|0}r2=r1+148|0;r4=HEAP32[r2>>2]-4|0;r5=r4&16777215;r6=r5+3|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r7=r1+32|0;HEAP8[HEAP32[r7>>2]+r5|0]=r3>>>24;HEAP8[HEAP32[r7>>2]+(r5+1)|0]=r3>>>16;HEAP8[HEAP32[r7>>2]+(r5+2)|0]=r3>>>8;HEAP8[HEAP32[r7>>2]+r6|0]=r3;HEAP32[r2>>2]=r4;_e68020_op_bcc(r1,1);return}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r5,r3);HEAP32[r2>>2]=r4;_e68020_op_bcc(r1,1);return}}function _op62001089(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if((r2&1|0)==0){r3=r2>>>2&1^1}else{r3=0}_e68020_op_bcc(r1,r3);return}function _op63001090(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if((r2&1|0)==0){r3=r2>>>2&1}else{r3=1}_e68020_op_bcc(r1,r3);return}function _op64001091(r1){_e68020_op_bcc(r1,(HEAP16[r1+166>>1]&1^1)&65535);return}function _op65001092(r1){_e68020_op_bcc(r1,HEAP16[r1+166>>1]&1);return}function _op66001093(r1){_e68020_op_bcc(r1,(HEAPU16[r1+166>>1]>>>2&1^1)&65535);return}function _op67001094(r1){_e68020_op_bcc(r1,HEAPU16[r1+166>>1]>>>2&1);return}function _op68001095(r1){_e68020_op_bcc(r1,(HEAPU16[r1+166>>1]>>>1&1^1)&65535);return}function _op69001096(r1){_e68020_op_bcc(r1,HEAPU16[r1+166>>1]>>>1&1);return}function _op6a001097(r1){_e68020_op_bcc(r1,(HEAPU16[r1+166>>1]>>>3&1^1)&65535);return}function _op6b001098(r1){_e68020_op_bcc(r1,HEAPU16[r1+166>>1]>>>3&1);return}function _op6c001099(r1){var r2;r2=HEAPU16[r1+166>>1];_e68020_op_bcc(r1,(r2>>>3^r2>>>1)&1^1);return}function _op6d001100(r1){var r2;r2=HEAPU16[r1+166>>1];_e68020_op_bcc(r1,(r2>>>3^r2>>>1)&1);return}function _op6e001101(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if(((r2>>>3^r2>>>1)&1|0)!=0){r3=0;_e68020_op_bcc(r1,r3);return}r3=r2>>>2&1^1;_e68020_op_bcc(r1,r3);return}function _op6f001102(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if(((r2>>>3^r2>>>1)&1|0)!=0){r3=1;_e68020_op_bcc(r1,r3);return}r3=r2>>>2&1;_e68020_op_bcc(r1,r3);return}function _ope8c0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e68_get_ea_bf(r1,r3,2021)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}_e68_cc_set_nz_32(r1,15,HEAP32[r3>>2]<<32-HEAP32[r1+352>>2]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope9c0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e68_get_ea_bf(r1,r3,2021)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}r4=r1+162|0;r5=HEAPU16[r4>>1]>>>12&7;r6=32-HEAP32[r1+352>>2]|0;r7=-1>>>(r6>>>0)&HEAP32[r3>>2];HEAP32[r3>>2]=r7;_e68_cc_set_nz_32(r1,15,r7<<r6);HEAP32[r1+88+(r5<<2)>>2]=r7;r7=r1+156|0;r5=HEAP32[r7>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r4>>1]=HEAP16[r6>>1];r4=r5&16777215;r5=r4+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r3=HEAP32[r1+32>>2];r8=HEAPU8[r3+r4|0]<<8|HEAPU8[r3+r5|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4)}HEAP16[r6>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opeac0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e68_get_ea_bf(r1,r3,485)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}r4=HEAP32[r3>>2];if((_e68_set_ea_bf(r1,~r4)|0)!=0){r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}_e68_cc_set_nz_32(r1,15,r4<<32-HEAP32[r1+352>>2]);r4=r1+156|0;r3=HEAP32[r4>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r3&16777215;r3=r6+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r3|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opebc0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e68_get_ea_bf(r1,r3,2021)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}r4=r1+162|0;r5=HEAPU16[r4>>1]>>>12&7;r6=32-HEAP32[r1+352>>2]|0;r7=-1>>>(r6>>>0);r8=HEAP32[r3>>2];if((-2147483648>>>(r6>>>0)&r8|0)==0){r9=r7&r8}else{r9=r8|~r7}HEAP32[r3>>2]=r9;_e68_cc_set_nz_32(r1,15,r9<<r6);HEAP32[r1+88+(r5<<2)>>2]=r9;r9=r1+156|0;r5=HEAP32[r9>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r4>>1]=HEAP16[r6>>1];r4=r5&16777215;r5=r4+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r3=HEAP32[r1+32>>2];r10=HEAPU8[r3+r4|0]<<8|HEAPU8[r3+r5|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4)}HEAP16[r6>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opecc0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e68_get_ea_bf(r1,r3,485)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}if((_e68_set_ea_bf(r1,0)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}_e68_cc_set_nz_32(r1,15,HEAP32[r3>>2]<<32-HEAP32[r1+352>>2]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opeec0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e68_get_ea_bf(r1,r3,485)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}if((_e68_set_ea_bf(r1,-1)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}_e68_cc_set_nz_32(r1,15,HEAP32[r3>>2]<<32-HEAP32[r1+352>>2]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opefc0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e68_get_ea_bf(r1,r3,2021)|0)!=0){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}r4=r1+162|0;r5=HEAP32[r1+88+((HEAPU16[r4>>1]>>>12&7)<<2)>>2];HEAP32[r3>>2]=r5;if((_e68_set_ea_bf(r1,r5)|0)!=0){r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_exception_illegal(r1);STACKTOP=r2;return}_e68_cc_set_nz_32(r1,15,r5<<32-HEAP32[r1+352>>2]);r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r4>>1]=HEAP16[r6>>1];r4=r3&16777215;r3=r4+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r4|0]<<8|HEAPU8[r7+r3|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4)}HEAP16[r6>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _e68_get_ea_bf(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);r6=1;return r6}r7=r1+164|0;r8=r1+162|0;HEAP16[r8>>1]=HEAP16[r7>>1];r9=r5&16777215;r5=r9+1|0;r10=r1+36|0;if(r5>>>0<HEAP32[r10>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r9|0]<<8|HEAPU8[r11+r5|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r7>>1]=r12;if((HEAP8[r1+336|0]|0)!=0){_e68_exception_bus(r1);r6=1;return r6}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=HEAP16[r8>>1];r8=r4&65535;r12=r8>>>6;if((r8&2048|0)==0){r13=r12&31}else{r13=HEAP32[r1+88+((r12&7)<<2)>>2]}if((r4&32)==0){r14=r8}else{r14=HEAP32[r1+88+((r8&7)<<2)>>2]}r8=r14&31;r14=(r8|0)==0?32:r8;r8=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[20520+(r8<<2)>>2]](r1,r8,r3,8)|0)!=0){r6=1;return r6}HEAP32[r1+348>>2]=r13;r3=r1+352|0;HEAP32[r3>>2]=r14;r8=HEAP32[r1+340>>2];if((r8|0)==2){r4=HEAP32[r1+344>>2];r12=r13>>>3;HEAP32[r2>>2]=0;r7=HEAP32[r3>>2];if((r7|0)!=0){r3=r1+32|0;r9=r1+8|0;r5=r1+4|0;r11=r7;r7=r1+356|0;r15=((r13|0)<0?r12|-536870912:r12)+r4|0;r4=r13;while(1){r12=r4&7;r16=8-r12|0;r17=r16>>>0>r11>>>0?r11:r16;r18=r16-r17|0;r16=r15&16777215;if(r16>>>0<HEAP32[r10>>2]>>>0){r19=HEAP8[HEAP32[r3>>2]+r16|0]}else{r19=FUNCTION_TABLE[HEAP32[r9>>2]](HEAP32[r5>>2],r16)}HEAP8[r7]=r19;HEAP32[r2>>2]=(255<<r18&255>>>(r12>>>0)&(r19&255))>>>(r18>>>0)|HEAP32[r2>>2]<<r17;if((r11|0)==(r17|0)){break}else{r11=r11-r17|0;r7=r7+1|0;r15=r15+1|0;r4=r17+r12|0}}}}else if((r8|0)==1){r8=HEAP32[r1+88+((HEAP32[r1+344>>2]&7)<<2)>>2];r4=r13+r14&31;if((r4|0)==0){r20=r8}else{r20=r8>>>((32-r4|0)>>>0)|r8<<r4}HEAP32[r2>>2]=r20}else{r6=1;return r6}r20=r1+372|0;HEAP32[r20>>2]=HEAP32[r20>>2]+18;r6=0;return r6}function _e68_set_ea_bf(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=HEAP32[r1+340>>2];if((r3|0)==2){r4=HEAP32[r1+348>>2];r5=r4>>>3;r6=HEAP32[r1+352>>2];if((r6|0)==0){r7=0;return r7}r8=r1+36|0;r9=r1+32|0;r10=r1+20|0;r11=r1+4|0;r12=r6;r6=r1+356|0;r13=HEAP32[r1+344>>2]+((r4|0)<0?r5|-536870912:r5)|0;r5=r4;while(1){r4=r5&7;r14=8-r4|0;r15=r14>>>0>r12>>>0?r12:r14;r16=r14-r15|0;r14=255<<r16&255>>>(r4>>>0);r17=r12-r15|0;r18=((r14^255)&HEAPU8[r6]|r2>>>((r17-r16|0)>>>0)&r14)&255;r14=r13&16777215;if(r14>>>0<HEAP32[r8>>2]>>>0){HEAP8[HEAP32[r9>>2]+r14|0]=r18}else{FUNCTION_TABLE[HEAP32[r10>>2]](HEAP32[r11>>2],r14,r18)}if((r12|0)==(r15|0)){r7=0;break}else{r12=r17;r6=r6+1|0;r13=r13+1|0;r5=r15+r4|0}}return r7}else if((r3|0)==1){r3=r1+88+((HEAP32[r1+344>>2]&7)<<2)|0;r5=32-HEAP32[r1+352>>2]|0;r13=-1>>>(r5>>>0);r6=r5-HEAP32[r1+348>>2]&31;if((r6|0)==0){r19=r13;r20=r2}else{r1=32-r6|0;r19=r13>>>(r1>>>0)|r13<<r6;r20=r2>>>(r1>>>0)|r2<<r6}HEAP32[r3>>2]=HEAP32[r3>>2]&~r19|r19&r20;r7=0;return r7}else{r7=1;return r7}}function _e68020_op_bcc(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=r1+152|0;r4=HEAP32[r3>>2]+2|0;r5=r1+160|0;r6=HEAPU16[r5>>1];r7=(r6&128|0)!=0?r6|-256:r6&255;do{if((r7|0)!=0){if((r7&255|0)==255){r6=r1+156|0;r8=HEAP32[r6>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);return}r9=r1+164|0;r10=r1+162|0;HEAP16[r10>>1]=HEAP16[r9>>1];r11=r8&16777215;r8=r11+1|0;r12=r1+36|0;if(r8>>>0<HEAP32[r12>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r8|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r9>>1]=r14;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);return}r8=HEAP32[r6>>2]+2|0;HEAP32[r6>>2]=r8;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r13=HEAP16[r10>>1];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);return}HEAP16[r10>>1]=r14;r15=r8&16777215;r8=r15+1|0;if(r8>>>0>=HEAP32[r12>>2]>>>0){r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r15);r16=(HEAP8[r11]|0)==0;HEAP16[r9>>1]=r12;if(!r16){_e68_exception_bus(r1);return}}else{r16=HEAP32[r1+32>>2];HEAP16[r9>>1]=HEAPU8[r16+r15|0]<<8|HEAPU8[r16+r8|0]}HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r17=HEAPU16[r10>>1]|(r13&65535)<<16}else{r17=r7}}else{r13=r1+156|0;r10=HEAP32[r13>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);return}r6=r1+164|0;r8=r1+162|0;HEAP16[r8>>1]=HEAP16[r6>>1];r16=r10&16777215;r10=r16+1|0;if(r10>>>0<HEAP32[r1+36>>2]>>>0){r15=HEAP32[r1+32>>2];r18=HEAPU8[r15+r16|0]<<8|HEAPU8[r15+r10|0]}else{r18=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r6>>1]=r18;if((HEAP8[r1+336|0]|0)==0){HEAP32[r13>>2]=HEAP32[r13>>2]+2;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r13=HEAPU16[r8>>1];r17=(r13&32768|0)!=0?r13|-65536:r13;break}_e68_exception_bus(r1);return}}while(0);do{if((r2|0)==0){r18=r1+372|0;HEAP32[r18>>2]=((HEAP16[r5>>1]&255)==0?12:8)+HEAP32[r18>>2];r19=HEAP32[r1+156>>2]}else{r18=r1+372|0;HEAP32[r18>>2]=HEAP32[r18>>2]+10;r18=r4+r17|0;r7=r1+156|0;HEAP32[r7>>2]=r18;if((r18&1|0)!=0){_e68_exception_address(r1,r18,0,0);return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r13=r18&16777215;r18=r13+1|0;if(r18>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r20=HEAPU8[r8+r13|0]<<8|HEAPU8[r8+r18|0]}else{r20=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r13)}HEAP16[r14>>1]=r20;if((HEAP8[r1+336|0]|0)==0){r14=HEAP32[r7>>2]+2|0;HEAP32[r7>>2]=r14;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r19=r14;break}_e68_exception_bus(r1);return}}while(0);r20=r1+156|0;if((r19&1|0)!=0){_e68_exception_address(r1,r19,0,0);return}r17=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r17>>1];r4=r19&16777215;r19=r4+1|0;if(r19>>>0<HEAP32[r1+36>>2]>>>0){r5=HEAP32[r1+32>>2];r21=HEAPU8[r5+r4|0]<<8|HEAPU8[r5+r19|0]}else{r21=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4)}HEAP16[r17>>1]=r21;if((HEAP8[r1+336|0]|0)==0){r21=HEAP32[r20>>2];HEAP32[r20>>2]=r21+2;HEAP32[r3>>2]=r21-2;return}else{_e68_exception_bus(r1);return}}function _e68_cc_set_nz_8(r1,r2,r3){var r4;if(r3<<24>>24==0){r4=4}else{r4=r3<<24>>24<0?8:0}r3=r2&255;r2=r1+166|0;HEAP16[r2>>1]=HEAPU16[r2>>1]&(r3^65535)|r4&r3;return}function _e68_cc_set_nz_16(r1,r2,r3){var r4;if(r3<<16>>16==0){r4=4}else{r4=r3<<16>>16<0?8:0}r3=r2&255;r2=r1+166|0;HEAP16[r2>>1]=HEAPU16[r2>>1]&(r3^65535)|r4&r3;return}function _e68_cc_set_nz_32(r1,r2,r3){var r4;if((r3|0)==0){r4=4}else{r4=r3>>31&8}r3=r2&255;r2=r1+166|0;HEAP16[r2>>1]=HEAPU16[r2>>1]&(r3^65535)|r4&r3;return}function _e68_cc_set_add_8(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=r1+166|0;r1=HEAP16[r5>>1];r6=r2<<24>>24==0?r1|4:r1&-5;HEAP16[r5>>1]=r6;r1=(r3&255)>>>7;r3=(r4&255)>>>7;if(r2<<24>>24>-1){r7=(r3&r1&65535)<<1|((r3|r1|0)==0?0:17);r8=r6&-28;r9=r8|r7;HEAP16[r5>>1]=r9;return}else{r7=(((r3|r1)&65535)<<1|((r3&r1|0)==0?8:25))^2;r8=r6&-28;r9=r8|r7;HEAP16[r5>>1]=r9;return}}function _e68_cc_set_add_16(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=r1+166|0;r1=HEAP16[r5>>1];r6=r2<<16>>16==0?r1|4:r1&-5;HEAP16[r5>>1]=r6;r1=(r3&65535)>>>15;r3=(r4&65535)>>>15;if(r2<<16>>16>-1){r7=(r3&r1&65535)<<1|((r3|r1|0)==0?0:17);r8=r6&-28;r9=r8|r7;HEAP16[r5>>1]=r9;return}else{r7=(((r3|r1)&65535)<<1|((r3&r1|0)==0?8:25))^2;r8=r6&-28;r9=r8|r7;HEAP16[r5>>1]=r9;return}}function _e68_cc_set_add_32(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=r1+166|0;r1=HEAP16[r5>>1];r6=(r2|0)==0?r1|4:r1&-5;HEAP16[r5>>1]=r6;r1=r3>>>31;r3=r4>>>31;if((r2|0)>-1){r7=(r3&r1&65535)<<1|((r3|r1|0)==0?0:17);r8=r6&-28;r9=r8|r7;HEAP16[r5>>1]=r9;return}else{r7=(((r3|r1)&65535)<<1|((r3&r1|0)==0?8:25))^2;r8=r6&-28;r9=r8|r7;HEAP16[r5>>1]=r9;return}}function _e68_cc_set_addx_8(r1,r2,r3,r4){var r5,r6;r5=(r3&255)>>>7;r3=(r4&255)>>>7;if(r2<<24>>24>-1){r6=(r3&r5&65535)<<1|((r3|r5|0)==0?0:17)}else{r6=(((r3|r5)&65535)<<1|((r3&r5|0)==0?8:25))^2}r5=r1+166|0;r1=HEAP16[r5>>1]&-28|r6;HEAP16[r5>>1]=r2<<24>>24==0?r1:r1&-5;return}function _e68_cc_set_addx_16(r1,r2,r3,r4){var r5,r6;r5=(r3&65535)>>>15;r3=(r4&65535)>>>15;if(r2<<16>>16>-1){r6=(r3&r5&65535)<<1|((r3|r5|0)==0?0:17)}else{r6=(((r3|r5)&65535)<<1|((r3&r5|0)==0?8:25))^2}r5=r1+166|0;r1=HEAP16[r5>>1]&-28|r6;HEAP16[r5>>1]=r2<<16>>16==0?r1:r1&-5;return}function _e68_cc_set_addx_32(r1,r2,r3,r4){var r5,r6;r5=r3>>>31;r3=r4>>>31;if((r2|0)>-1){r6=(r3&r5&65535)<<1|((r3|r5|0)==0?0:17)}else{r6=(((r3|r5)&65535)<<1|((r3&r5|0)==0?8:25))^2}r5=r1+166|0;r1=HEAP16[r5>>1]&-28|r6;HEAP16[r5>>1]=(r2|0)==0?r1:r1&-5;return}function _e68_cc_set_cmp_8(r1,r2,r3,r4){var r5,r6;r5=r3<<24>>24<0;r3=r4<<24>>24>-1;if(r2<<24>>24>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-16|r6&15;HEAP16[r4>>1]=r2<<24>>24==0?r1|4:r1;return}function _e68_cc_set_cmp_16(r1,r2,r3,r4){var r5,r6;r5=r3<<16>>16<0;r3=r4<<16>>16>-1;if(r2<<16>>16>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-16|r6&15;HEAP16[r4>>1]=r2<<16>>16==0?r1|4:r1;return}function _e68_cc_set_cmp_32(r1,r2,r3,r4){var r5,r6;r5=(r3|0)<0;r3=(r4|0)>-1;if((r2|0)>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-16|r6&15;HEAP16[r4>>1]=(r2|0)==0?r1|4:r1;return}function _e68_cc_set_sub_8(r1,r2,r3,r4){var r5,r6;r5=r3<<24>>24<0;r3=r4<<24>>24>-1;if(r2<<24>>24>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-32|r6&31;HEAP16[r4>>1]=r2<<24>>24==0?r1|4:r1;return}function _e68_cc_set_sub_16(r1,r2,r3,r4){var r5,r6;r5=r3<<16>>16<0;r3=r4<<16>>16>-1;if(r2<<16>>16>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-32|r6&31;HEAP16[r4>>1]=r2<<16>>16==0?r1|4:r1;return}function _e68_cc_set_sub_32(r1,r2,r3,r4){var r5,r6;r5=(r3|0)<0;r3=(r4|0)>-1;if((r2|0)>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-32|r6&31;HEAP16[r4>>1]=(r2|0)==0?r1|4:r1;return}function _e68_cc_set_subx_8(r1,r2,r3,r4){var r5,r6;r5=r3<<24>>24<0;r3=r4<<24>>24>-1;if(r2<<24>>24>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-28|r6&27;HEAP16[r4>>1]=r2<<24>>24==0?r1:r1&-5;return}function _e68_cc_set_subx_16(r1,r2,r3,r4){var r5,r6;r5=r3<<16>>16<0;r3=r4<<16>>16>-1;if(r2<<16>>16>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-28|r6&27;HEAP16[r4>>1]=r2<<16>>16==0?r1:r1&-5;return}function _e68_cc_set_subx_32(r1,r2,r3,r4){var r5,r6;r5=(r3|0)<0;r3=(r4|0)>-1;if((r2|0)>-1){r4=r5&r3?17:0;r6=r5|r3?r4:r4|2}else{r4=r5|r3?25:8;r6=r5&r3?r4|2:r4}r4=r1+166|0;r1=HEAP16[r4>>1]&-28|r6&27;HEAP16[r4>>1]=(r2|0)==0?r1:r1&-5;return}function _e68_ea_000_xxx(r1,r2,r3,r4){var r5;if((r3&1|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{HEAP32[r1+340>>2]=1;HEAP32[r1+344>>2]=r2&7;r5=0;return r5}}function _e68_ea_001_xxx(r1,r2,r3,r4){var r5;if((r3&2|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{HEAP32[r1+340>>2]=1;HEAP32[r1+344>>2]=r2&7|8;r5=0;return r5}}function _e68_ea_010_xxx(r1,r2,r3,r4){var r5;if((r3&4|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{HEAP32[r1+340>>2]=2;HEAP32[r1+344>>2]=HEAP32[r1+120+((r2&7)<<2)>>2];r5=0;return r5}}function _e68_ea_011_xxx(r1,r2,r3,r4){var r5;if((r3&8|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{HEAP32[r1+340>>2]=2;r3=r1+120+((r2&7)<<2)|0;r2=HEAP32[r3>>2];HEAP32[r1+344>>2]=r2;HEAP32[r3>>2]=r2+(r4>>>3);r5=0;return r5}}function _e68_ea_011_111(r1,r2,r3,r4){var r5;if((r3&8|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{HEAP32[r1+340>>2]=2;r3=r1+148|0;r2=HEAP32[r3>>2];HEAP32[r1+344>>2]=r2;HEAP32[r3>>2]=r2+((r4|0)==8?2:r4>>>3);r5=0;return r5}}function _e68_ea_100_xxx(r1,r2,r3,r4){var r5;if((r3&16|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{HEAP32[r1+340>>2]=2;r3=r1+120+((r2&7)<<2)|0;r2=HEAP32[r3>>2]-(r4>>>3)|0;HEAP32[r1+344>>2]=r2;HEAP32[r3>>2]=r2;r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;r5=0;return r5}}function _e68_ea_100_111(r1,r2,r3,r4){var r5;if((r3&16|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{HEAP32[r1+340>>2]=2;r3=r1+148|0;r2=HEAP32[r3>>2]-((r4|0)==8?2:r4>>>3)|0;HEAP32[r1+344>>2]=r2;HEAP32[r3>>2]=r2;r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;r5=0;return r5}}function _e68_ea_101_xxx(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;if((r3&32|0)==0){_e68_exception_illegal(r1);r5=1;return r5}r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);r5=1;return r5}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r4&16777215;r4=r8+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r4|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r1+340>>2]=2;r3=HEAPU16[r7>>1];HEAP32[r1+344>>2]=((r3&32768|0)!=0?r3|-65536:r3)+HEAP32[r1+120+((r2&7)<<2)>>2];r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r5=0;return r5}else{_e68_exception_bus(r1);r5=1;return r5}}function _e68_ea_110_xxx(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;if((r3&64|0)==0){_e68_exception_illegal(r1);r5=1;return r5}r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);r5=1;return r5}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r4&16777215;r4=r8+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r4|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r10;if((HEAP8[r1+336|0]|0)!=0){_e68_exception_bus(r1);r5=1;return r5}HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r1+340>>2]=2;r3=HEAP32[r1+120+((r2&7)<<2)>>2];r2=r1+344|0;HEAP32[r2>>2]=r3;r10=HEAP16[r7>>1];do{if((HEAP32[r1>>2]&4|0)==0){r11=0}else{r7=r10&65535;if((r7&256|0)==0){r11=r7>>>9&3;break}r5=_e68_ea_full(r1,r7);return r5}}while(0);r7=r10&65535;r6=((r7&128|0)!=0?r7|-256:r7&255)+r3|0;HEAP32[r2>>2]=r6;r3=r7>>>12&7;if((r7&32768|0)==0){r12=r1+88+(r3<<2)|0}else{r12=r1+120+(r3<<2)|0}r3=HEAP32[r12>>2];if((r10&2048)==0){r13=(r3&32768|0)!=0?r3|-65536:r3&65535}else{r13=r3}HEAP32[r2>>2]=r6+(r13<<r11);r11=r1+372|0;HEAP32[r11>>2]=HEAP32[r11>>2]+6;r5=0;return r5}function _e68_ea_111_000(r1,r2,r3,r4){var r5,r6,r7,r8,r9;if((r3&128|0)==0){_e68_exception_illegal(r1);r5=1;return r5}r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);r5=1;return r5}r2=r1+164|0;r6=r1+162|0;HEAP16[r6>>1]=HEAP16[r2>>1];r7=r4&16777215;r4=r7+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r2>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r1+340>>2]=2;r3=HEAPU16[r6>>1];HEAP32[r1+344>>2]=(r3&32768|0)!=0?r3|-65536:r3;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r5=0;return r5}else{_e68_exception_bus(r1);r5=1;return r5}}function _e68_ea_111_001(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;if((r3&256|0)==0){_e68_exception_illegal(r1);r5=1;return r5}r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);r5=1;return r5}r2=r1+164|0;r6=r1+162|0;HEAP16[r6>>1]=HEAP16[r2>>1];r7=r4&16777215;r4=r7+1|0;r8=r1+36|0;if(r4>>>0<HEAP32[r8>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r4|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r2>>1]=r10;r7=r1+336|0;if((HEAP8[r7]|0)!=0){_e68_exception_bus(r1);r5=1;return r5}r4=HEAP32[r3>>2]+2|0;HEAP32[r3>>2]=r4;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;HEAP32[r1+340>>2]=2;r11=r1+344|0;HEAP32[r11>>2]=HEAPU16[r6>>1];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);r5=1;return r5}HEAP16[r6>>1]=r10;r10=r4&16777215;r4=r10+1|0;if(r4>>>0>=HEAP32[r8>>2]>>>0){r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10);r12=(HEAP8[r7]|0)==0;HEAP16[r2>>1]=r8;if(!r12){_e68_exception_bus(r1);r5=1;return r5}}else{r12=HEAP32[r1+32>>2];HEAP16[r2>>1]=HEAPU8[r12+r10|0]<<8|HEAPU8[r12+r4|0]}HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r9>>2]=HEAP32[r9>>2]+2;HEAP32[r11>>2]=HEAPU16[r6>>1]|HEAP32[r11>>2]<<16;r11=r1+372|0;HEAP32[r11>>2]=HEAP32[r11>>2]+8;r5=0;return r5}function _e68_ea_111_010(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;if((r3&512|0)==0){_e68_exception_illegal(r1);r5=1;return r5}HEAP32[r1+340>>2]=2;r3=r1+156|0;r4=HEAP32[r3>>2];r2=r1+344|0;HEAP32[r2>>2]=r4-2;if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);r5=1;return r5}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r4&16777215;r4=r8+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r4|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=HEAPU16[r7>>1];HEAP32[r2>>2]=((r3&32768|0)!=0?r3|-65536:r3)+HEAP32[r2>>2];r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r5=0;return r5}else{_e68_exception_bus(r1);r5=1;return r5}}function _e68_ea_111_011(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;if((r3&1024|0)==0){_e68_exception_illegal(r1);r5=1;return r5}HEAP32[r1+340>>2]=2;r3=r1+156|0;r4=HEAP32[r3>>2];r2=r1+344|0;HEAP32[r2>>2]=r4-2;if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);r5=1;return r5}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r4&16777215;r4=r8+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r4|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r10;if((HEAP8[r1+336|0]|0)!=0){_e68_exception_bus(r1);r5=1;return r5}HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=HEAP16[r7>>1];do{if((HEAP32[r1>>2]&4|0)==0){r11=0}else{r7=r3&65535;if((r7&256|0)==0){r11=r7>>>9&3;break}r5=_e68_ea_full(r1,r7);return r5}}while(0);r7=r3&65535;r10=((r7&128|0)!=0?r7|-256:r7&255)+HEAP32[r2>>2]|0;HEAP32[r2>>2]=r10;r6=r7>>>12&7;if((r7&32768|0)==0){r12=r1+88+(r6<<2)|0}else{r12=r1+120+(r6<<2)|0}r6=HEAP32[r12>>2];if((r3&2048)==0){r13=(r6&32768|0)!=0?r6|-65536:r6&65535}else{r13=r6}HEAP32[r2>>2]=r10+(r13<<r11);r11=r1+372|0;HEAP32[r11>>2]=HEAP32[r11>>2]+6;r5=0;return r5}function _e68_ea_111_100(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;if((r3&2048|0)==0){_e68_exception_illegal(r1);r5=1;return r5}r3=r1+156|0;r2=HEAP32[r3>>2];if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);r5=1;return r5}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r2&16777215;r2=r8+1|0;r9=r1+36|0;if(r2>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r2|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);r5=1;return r5}r2=HEAP32[r3>>2]+2|0;HEAP32[r3>>2]=r2;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;HEAP32[r1+340>>2]=0;r12=HEAPU16[r7>>1];r13=r1+344|0;HEAP32[r13>>2]=r12;if((r4|0)==32){if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);r5=1;return r5}HEAP16[r7>>1]=r11;r11=r2&16777215;r2=r11+1|0;if(r2>>>0>=HEAP32[r9>>2]>>>0){r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r14=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r9;if(!r14){_e68_exception_bus(r1);r5=1;return r5}}else{r14=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r14+r11|0]<<8|HEAPU8[r14+r2|0]}HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;HEAP32[r13>>2]=HEAPU16[r7>>1]|HEAP32[r13>>2]<<16;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;r5=0;return r5}else if((r4|0)==16){r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;r5=0;return r5}else{HEAP32[r13>>2]=r12&255;r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+4;r5=0;return r5}}function _e68_ea_111_xxx(r1,r2,r3,r4){_e68_exception_illegal(r1);return 1}function _e68_ea_get_val8(r1,r2){var r3,r4,r5,r6;r3=HEAP32[r1+340>>2];if((r3|0)==2){r4=HEAP32[r1+344>>2]&16777215;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r5=HEAP8[HEAP32[r1+32>>2]+r4|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r4)}HEAP8[r2]=r5;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;if((HEAP8[r1+336|0]|0)==0){r6=0;return r6}_e68_exception_bus(r1);r6=1;return r6}else if((r3|0)==1){r5=HEAP32[r1+344>>2];if(r5>>>0<8){HEAP8[r2]=HEAP32[r1+88+((r5&7)<<2)>>2];r6=0;return r6}else{_e68_exception_illegal(r1);r6=1;return r6}}else if((r3|0)==0){HEAP8[r2]=HEAP32[r1+344>>2];r6=0;return r6}else{_e68_exception_illegal(r1);r6=1;return r6}}function _e68_ea_get_val16(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=HEAP32[r1+340>>2];if((r3|0)==2){r4=HEAP32[r1+344>>2];if((r4&1|0)!=0?(HEAP32[r1>>2]&1|0)==0:0){_e68_exception_address(r1,r4,1,0);r5=1;return r5}r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r2>>1]=r8;r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+4;if((HEAP8[r1+336|0]|0)==0){r5=0;return r5}_e68_exception_bus(r1);r5=1;return r5}else if((r3|0)==0){HEAP16[r2>>1]=HEAP32[r1+344>>2];r5=0;return r5}else if((r3|0)==1){r3=HEAP32[r1+344>>2];do{if(r3>>>0<8){r9=r1+88+((r3&7)<<2)|0}else{if(r3>>>0<16){r9=r1+120+((r3&7)<<2)|0;break}_e68_exception_illegal(r1);r5=1;return r5}}while(0);HEAP16[r2>>1]=HEAP32[r9>>2];r5=0;return r5}else{_e68_exception_illegal(r1);r5=1;return r5}}function _e68_ea_get_val32(r1,r2){var r3,r4,r5,r6,r7;r3=HEAP32[r1+340>>2];if((r3|0)==0){HEAP32[r2>>2]=HEAP32[r1+344>>2];r4=0;return r4}else if((r3|0)==1){r5=HEAP32[r1+344>>2];do{if(r5>>>0<8){r6=r1+88+((r5&7)<<2)|0}else{if(r5>>>0<16){r6=r1+120+((r5&7)<<2)|0;break}_e68_exception_illegal(r1);r4=1;return r4}}while(0);HEAP32[r2>>2]=HEAP32[r6>>2];r4=0;return r4}else if((r3|0)==2){r3=HEAP32[r1+344>>2];if((r3&1|0)!=0?(HEAP32[r1>>2]&1|0)==0:0){_e68_exception_address(r1,r3,1,0);r4=1;return r4}r6=r3&16777215;r3=r6+3|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r5=HEAP32[r1+32>>2];r7=((HEAPU8[r5+r6|0]<<8|HEAPU8[r5+(r6+1)|0])<<8|HEAPU8[r5+(r6+2)|0])<<8|HEAPU8[r5+r3|0]}else{r7=FUNCTION_TABLE[HEAP32[r1+16>>2]](HEAP32[r1+4>>2],r6)}HEAP32[r2>>2]=r7;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;if((HEAP8[r1+336|0]|0)==0){r4=0;return r4}_e68_exception_bus(r1);r4=1;return r4}else{_e68_exception_illegal(r1);r4=1;return r4}}function _e68_ea_set_val8(r1,r2){var r3,r4,r5,r6;r3=HEAP32[r1+340>>2];if((r3|0)==2){r4=HEAP32[r1+344>>2]&16777215;if(r4>>>0<HEAP32[r1+36>>2]>>>0){HEAP8[HEAP32[r1+32>>2]+r4|0]=r2}else{FUNCTION_TABLE[HEAP32[r1+20>>2]](HEAP32[r1+4>>2],r4,r2)}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;if((HEAP8[r1+336|0]|0)==0){r5=0;return r5}_e68_exception_bus(r1);r5=1;return r5}else if((r3|0)==1){r4=HEAP32[r1+344>>2];if(r4>>>0<8){r6=r1+88+((r4&7)<<2)|0;HEAP32[r6>>2]=HEAP32[r6>>2]&-256|r2&255;r5=0;return r5}else{_e68_exception_illegal(r1);r5=1;return r5}}else if((r3|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{_e68_exception_illegal(r1);r5=1;return r5}}function _e68_ea_set_val16(r1,r2){var r3,r4,r5,r6;r3=HEAP32[r1+340>>2];if((r3|0)==1){r4=HEAP32[r1+344>>2];if(r4>>>0<8){r5=r1+88+((r4&7)<<2)|0;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r2&65535;r6=0;return r6}if(r4>>>0<16){r5=r2&65535;HEAP32[r1+120+((r4&7)<<2)>>2]=(r5&32768|0)==0?r5:r5|-65536;r6=0;return r6}else{_e68_exception_illegal(r1);r6=1;return r6}}else if((r3|0)==0){_e68_exception_illegal(r1);r6=1;return r6}else if((r3|0)==2){r3=HEAP32[r1+344>>2];if((r3&1|0)!=0?(HEAP32[r1>>2]&1|0)==0:0){_e68_exception_address(r1,r3,1,1);r6=1;return r6}r5=r3&16777215;r3=r5+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r4=r1+32|0;HEAP8[HEAP32[r4>>2]+r5|0]=(r2&65535)>>>8;HEAP8[HEAP32[r4>>2]+r3|0]=r2}else{FUNCTION_TABLE[HEAP32[r1+24>>2]](HEAP32[r1+4>>2],r5,r2)}r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;if((HEAP8[r1+336|0]|0)==0){r6=0;return r6}_e68_exception_bus(r1);r6=1;return r6}else{_e68_exception_illegal(r1);r6=1;return r6}}function _e68_ea_set_val32(r1,r2){var r3,r4,r5,r6,r7;r3=HEAP32[r1+340>>2];if((r3|0)==2){r4=HEAP32[r1+344>>2];if((r4&1|0)!=0?(HEAP32[r1>>2]&1|0)==0:0){_e68_exception_address(r1,r4,1,1);r5=1;return r5}r6=r4&16777215;r4=r6+3|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=r1+32|0;HEAP8[HEAP32[r7>>2]+r6|0]=r2>>>24;HEAP8[HEAP32[r7>>2]+(r6+1)|0]=r2>>>16;HEAP8[HEAP32[r7>>2]+(r6+2)|0]=r2>>>8;HEAP8[HEAP32[r7>>2]+r4|0]=r2}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r6,r2)}r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;if((HEAP8[r1+336|0]|0)==0){r5=0;return r5}_e68_exception_bus(r1);r5=1;return r5}else if((r3|0)==1){r6=HEAP32[r1+344>>2];if(r6>>>0<8){HEAP32[r1+88+((r6&7)<<2)>>2]=r2;r5=0;return r5}if(r6>>>0<16){HEAP32[r1+120+((r6&7)<<2)>>2]=r2;r5=0;return r5}else{_e68_exception_illegal(r1);r5=1;return r5}}else if((r3|0)==0){_e68_exception_illegal(r1);r5=1;return r5}else{_e68_exception_illegal(r1);r5=1;return r5}}function _e68_ea_full(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r3=(r2&64|0)!=0;if((r2&128|0)!=0){HEAP32[r1+344>>2]=0}r4=r2>>>9&3;if(!r3){r5=r2>>>12&7;if((r2&32768|0)==0){r6=r1+88+(r5<<2)|0}else{r6=r1+120+(r5<<2)|0}r5=HEAP32[r6>>2];if((r2&2048|0)==0){r7=(r5&32768|0)!=0?r5|-65536:r5&65535}else{r7=r5}}else{r7=0}r5=r2>>>4&3;do{if((r5|0)==2){r6=r1+156|0;r8=HEAP32[r6>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);r9=1;return r9}r10=r1+164|0;r11=r1+162|0;HEAP16[r11>>1]=HEAP16[r10>>1];r12=r8&16777215;r8=r12+1|0;if(r8>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r12|0]<<8|HEAPU8[r13+r8|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r12)}HEAP16[r10>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=HEAPU16[r11>>1];r15=(r6&32768|0)!=0?r6|-65536:r6;break}_e68_exception_bus(r1);r9=1;return r9}else if((r5|0)==0){_e68_exception_illegal(r1);r9=1;return r9}else if((r5|0)==3){r6=r1+156|0;r11=HEAP32[r6>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);r9=1;return r9}r10=r1+164|0;r12=r1+162|0;HEAP16[r12>>1]=HEAP16[r10>>1];r8=r11&16777215;r11=r8+1|0;r13=r1+36|0;if(r11>>>0<HEAP32[r13>>2]>>>0){r16=HEAP32[r1+32>>2];r17=HEAPU8[r16+r8|0]<<8|HEAPU8[r16+r11|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r10>>1]=r17;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);r9=1;return r9}r11=HEAP32[r6>>2]+2|0;HEAP32[r6>>2]=r11;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;r18=HEAP16[r12>>1];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);r9=1;return r9}HEAP16[r12>>1]=r17;r19=r11&16777215;r11=r19+1|0;if(r11>>>0>=HEAP32[r13>>2]>>>0){r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r19);r20=(HEAP8[r8]|0)==0;HEAP16[r10>>1]=r13;if(!r20){_e68_exception_bus(r1);r9=1;return r9}}else{r20=HEAP32[r1+32>>2];HEAP16[r10>>1]=HEAPU8[r20+r19|0]<<8|HEAPU8[r20+r11|0]}HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r16>>2]=HEAP32[r16>>2]+2;r15=HEAPU16[r12>>1]|(r18&65535)<<16}else{r15=0}}while(0);if((r2&7|0)==0){r17=r1+344|0;HEAP32[r17>>2]=r15+(r7<<r4)+HEAP32[r17>>2];r9=0;return r9}r17=r2&3;do{if((r17|0)==2){r5=r1+156|0;r14=HEAP32[r5>>2];if((r14&1|0)!=0){_e68_exception_address(r1,r14,0,0);r9=1;return r9}r18=r1+164|0;r12=r1+162|0;HEAP16[r12>>1]=HEAP16[r18>>1];r16=r14&16777215;r14=r16+1|0;if(r14>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r21=HEAPU8[r6+r16|0]<<8|HEAPU8[r6+r14|0]}else{r21=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r18>>1]=r21;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=HEAPU16[r12>>1];r22=(r5&32768|0)!=0?r5|-65536:r5;break}_e68_exception_bus(r1);r9=1;return r9}else if((r17|0)==0){_e68_exception_illegal(r1);r9=1;return r9}else if((r17|0)==3){r5=r1+156|0;r12=HEAP32[r5>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);r9=1;return r9}r18=r1+164|0;r16=r1+162|0;HEAP16[r16>>1]=HEAP16[r18>>1];r14=r12&16777215;r12=r14+1|0;r6=r1+36|0;if(r12>>>0<HEAP32[r6>>2]>>>0){r11=HEAP32[r1+32>>2];r23=HEAPU8[r11+r14|0]<<8|HEAPU8[r11+r12|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14)}HEAP16[r18>>1]=r23;r14=r1+336|0;if((HEAP8[r14]|0)!=0){_e68_exception_bus(r1);r9=1;return r9}r12=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r12;r11=r1+152|0;HEAP32[r11>>2]=HEAP32[r11>>2]+2;r20=HEAP16[r16>>1];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);r9=1;return r9}HEAP16[r16>>1]=r23;r19=r12&16777215;r12=r19+1|0;if(r12>>>0>=HEAP32[r6>>2]>>>0){r6=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r19);r10=(HEAP8[r14]|0)==0;HEAP16[r18>>1]=r6;if(!r10){_e68_exception_bus(r1);r9=1;return r9}}else{r10=HEAP32[r1+32>>2];HEAP16[r18>>1]=HEAPU8[r10+r19|0]<<8|HEAPU8[r10+r12|0]}HEAP32[r5>>2]=HEAP32[r5>>2]+2;HEAP32[r11>>2]=HEAP32[r11>>2]+2;r22=HEAPU16[r16>>1]|(r20&65535)<<16}else{r22=0}}while(0);if((r2&4|0)==0){r2=r1+344|0;r23=r15+(r7<<r4)+HEAP32[r2>>2]&16777215;r17=r23+3|0;if(r17>>>0<HEAP32[r1+36>>2]>>>0){r21=HEAP32[r1+32>>2];r24=((HEAPU8[r21+r23|0]<<8|HEAPU8[r21+(r23+1)|0])<<8|HEAPU8[r21+(r23+2)|0])<<8|HEAPU8[r21+r17|0]}else{r24=FUNCTION_TABLE[HEAP32[r1+16>>2]](HEAP32[r1+4>>2],r23)}HEAP32[r2>>2]=r24+r22;r9=0;return r9}if(r3){_e68_exception_illegal(r1);r9=1;return r9}r3=r1+344|0;r24=HEAP32[r3>>2]+r15&16777215;r15=r24+3|0;if(r15>>>0<HEAP32[r1+36>>2]>>>0){r2=HEAP32[r1+32>>2];r25=((HEAPU8[r2+r24|0]<<8|HEAPU8[r2+(r24+1)|0])<<8|HEAPU8[r2+(r24+2)|0])<<8|HEAPU8[r2+r15|0]}else{r25=FUNCTION_TABLE[HEAP32[r1+16>>2]](HEAP32[r1+4>>2],r24)}HEAP32[r3>>2]=r22+(r7<<r4)+r25;r9=0;return r9}function _e6522_init(r1,r2){HEAP32[r1>>2]=r2;HEAP32[r1+48>>2]=0;HEAP32[r1+52>>2]=0;HEAP8[r1+56|0]=0;HEAP32[r1+60>>2]=0;HEAP32[r1+64>>2]=0;HEAP8[r1+68|0]=0;_memset(r1+4|0,0,41)|0;r2=r1+72|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP8[r2+16|0]=0;return}function _e6522_set_ora_fct(r1,r2,r3){HEAP32[r1+36>>2]=r2;HEAP32[r1+40>>2]=r3;return}function _e6522_set_orb_fct(r1,r2,r3){HEAP32[r1+48>>2]=r2;HEAP32[r1+52>>2]=r3;return}function _e6522_set_cb2_fct(r1,r2,r3){HEAP32[r1+60>>2]=r2;HEAP32[r1+64>>2]=r3;return}function _e6522_set_shift_out_fct(r1,r2,r3){HEAP32[r1+72>>2]=r2;HEAP32[r1+76>>2]=r3;return}function _e6522_set_irq_fct(r1,r2,r3){HEAP32[r1+80>>2]=r2;HEAP32[r1+84>>2]=r3;return}function _e6522_shift_out(r1){var r2,r3,r4,r5,r6,r7;if((HEAP8[r1+12|0]&28)!=28){r2=0;return r2}r3=r1+10|0;r4=HEAPU8[r3];r5=r4>>>7;r6=r5&255;HEAP8[r3]=r4<<1|r5;r5=r1+11|0;r4=HEAP8[r5]+1&7;HEAP8[r5]=r4;if(r4<<24>>24!=0){r2=r6;return r2}r4=r1+14|0;r5=HEAP8[r4];r3=r5&123|4;r7=(r3&HEAP8[r1+15|0])<<24>>24==0?r3:r5|-124;HEAP8[r4]=r7;r4=(r7&255)>>>7;r7=r1+88|0;if((HEAP8[r7]|0)==r4<<24>>24){r2=r6;return r2}HEAP8[r7]=r4;r7=HEAP32[r1+84>>2];if((r7|0)==0){r2=r6;return r2}FUNCTION_TABLE[r7](HEAP32[r1+80>>2],r4);r2=r6;return r2}function _e6522_shift_in(r1,r2){var r3,r4,r5,r6,r7,r8;if((HEAP8[r1+12|0]&28)!=12){return}r3=r1+10|0;HEAP8[r3]=HEAP8[r3]<<1|r2<<24>>24!=0;r2=r1+11|0;r3=HEAP8[r2]+1&7;HEAP8[r2]=r3;r2=r1+14|0;if(r3<<24>>24==0){r3=HEAP8[r2];r4=r3&123|4;r5=r1+15|0;r6=(r4&HEAP8[r5])<<24>>24==0?r4:r3|-124;HEAP8[r2]=r6;r3=(r6&255)>>>7;r6=r1+88|0;if((HEAP8[r6]|0)!=r3<<24>>24){HEAP8[r6]=r3;r4=HEAP32[r1+84>>2];if((r4|0)!=0){FUNCTION_TABLE[r4](HEAP32[r1+80>>2],r3);r7=r5;r8=r6}else{r7=r5;r8=r6}}else{r7=r5;r8=r6}}else{r7=r1+15|0;r8=r1+88|0}r6=HEAP8[r2];r5=r6&111|16;r3=(r5&HEAP8[r7])<<24>>24==0?r5:r6|-112;HEAP8[r2]=r3;r2=(r3&255)>>>7;if((HEAP8[r8]|0)==r2<<24>>24){return}HEAP8[r8]=r2;r8=HEAP32[r1+84>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+80>>2],r2);return}function _e6522_set_ca1_inp(r1,r2){var r3,r4,r5;r3=r1+32|0;r4=(HEAP8[r3]|0)!=0;r5=r2<<24>>24!=0;HEAP8[r3]=r5&1;if(!(r4^r5)){return}if((r5&1|0)!=(HEAP8[r1+13|0]&1|0)){return}r5=r1+14|0;r4=HEAP8[r5];r3=r4&125|2;r2=(r3&HEAP8[r1+15|0])<<24>>24==0?r3:r4|-126;HEAP8[r5]=r2;r5=(r2&255)>>>7;r2=r1+88|0;if((HEAP8[r2]|0)==r5<<24>>24){return}HEAP8[r2]=r5;r2=HEAP32[r1+84>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+80>>2],r5);return}function _e6522_set_ca2_inp(r1,r2){var r3,r4,r5;r3=r1+33|0;r4=HEAP8[r3];r5=r2<<24>>24!=0;HEAP8[r3]=r5&1;r3=HEAPU8[r1+13|0];if((r3&8|0)!=0){return}if(!(r4<<24>>24!=0^r5)){return}if(r5^(r3&4|0)!=0){return}r3=r1+14|0;r5=HEAP8[r3];r4=r5&126|1;r2=(r4&HEAP8[r1+15|0])<<24>>24==0?r4:r5|-127;HEAP8[r3]=r2;r3=(r2&255)>>>7;r2=r1+88|0;if((HEAP8[r2]|0)==r3<<24>>24){return}HEAP8[r2]=r3;r2=HEAP32[r1+84>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+80>>2],r3);return}function _e6522_set_ira_inp(r1,r2){var r3,r4;HEAP8[r1+6|0]=r2;r3=HEAP8[r1+8|0];r4=HEAP32[r1+40>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+36>>2],HEAP8[r1+4|0]&r3|~r3&r2);return}function _e6522_set_irb_inp(r1,r2){var r3,r4;HEAP8[r1+7|0]=r2;r3=HEAP8[r1+9|0];r4=HEAP32[r1+52>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+48>>2],HEAP8[r1+5|0]&r3|~r3&r2);return}function _e6522_set_shift_inp(r1,r2){var r3,r4,r5;if((HEAP8[r1+12|0]&28)!=12){return}HEAP8[r1+10|0]=r2;HEAP8[r1+11|0]=0;r2=r1+14|0;r3=HEAP8[r2];r4=r3&123|4;r5=(r4&HEAP8[r1+15|0])<<24>>24==0?r4:r3|-124;HEAP8[r2]=r5;r2=(r5&255)>>>7;r5=r1+88|0;if((HEAP8[r5]|0)==r2<<24>>24){return}HEAP8[r5]=r2;r5=HEAP32[r1+84>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+80>>2],r2);return}function _e6522_get_uint8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164;r3=0;r4=r1|0;r5=HEAP32[r4>>2];r6=r2>>>(r5>>>0);switch(r6|0){case 5:{r7=r1+18|0;r8=HEAP16[r7>>1];r9=(r8&65535)>>>8;r10=r9&255;r11=r10;return r11;break};case 14:{r12=r1+15|0;r13=HEAP8[r12];r14=r13|-128;r11=r14;return r11;break};case 10:{r15=r1+14|0;r16=HEAP8[r15];r17=r16&123;r18=r1+15|0;r19=HEAP8[r18];r20=r19&r17;r21=r20<<24>>24==0;r22=r17|-128;r23=r21?r17:r22;HEAP8[r15]=r23;r24=(r23&255)>>>7;r25=r1+88|0;r26=HEAP8[r25];r27=r26<<24>>24==r24<<24>>24;if(!r27){HEAP8[r25]=r24;r28=r1+84|0;r29=HEAP32[r28>>2];r30=(r29|0)==0;if(!r30){r31=r1+80|0;r32=HEAP32[r31>>2];FUNCTION_TABLE[r29](r32,r24)}}r33=r1+11|0;HEAP8[r33]=0;r34=r1+10|0;r35=HEAP8[r34];r11=r35;return r11;break};case 3:{r36=r1+8|0;r37=HEAP8[r36];r11=r37;return r11;break};case 12:{r38=r1+13|0;r39=HEAP8[r38];r11=r39;return r11;break};case 2:{r40=r1+9|0;r41=HEAP8[r40];r11=r41;return r11;break};case 6:{r42=r1+16|0;r43=HEAP16[r42>>1];r44=r43&255;r11=r44;return r11;break};case 9:{r45=r1+26|0;r46=HEAP16[r45>>1];r47=(r46&65535)>>>8;r48=r47&255;r11=r48;return r11;break};case 15:{r49=r1+4|0;r50=HEAP8[r49];r51=r1+8|0;r52=HEAP8[r51];r53=r52&r50;r54=r1+6|0;r55=HEAP8[r54];r56=~r52;r57=r55&r56;r58=r57|r53;r11=r58;return r11;break};case 0:{r59=r1+14|0;r60=HEAP8[r59];r61=r60&103;r62=r1+15|0;r63=HEAP8[r62];r64=r63&r61;r65=r64<<24>>24==0;r66=r61|-128;r67=r65?r61:r66;HEAP8[r59]=r67;r68=(r67&255)>>>7;r69=r1+88|0;r70=HEAP8[r69];r71=r70<<24>>24==r68<<24>>24;if(!r71){HEAP8[r69]=r68;r72=r1+84|0;r73=HEAP32[r72>>2];r74=(r73|0)==0;if(!r74){r75=r1+80|0;r76=HEAP32[r75>>2];FUNCTION_TABLE[r73](r76,r68)}}r77=r1+5|0;r78=HEAP8[r77];r79=r1+9|0;r80=HEAP8[r79];r81=r80&r78;r82=r1+7|0;r83=HEAP8[r82];r84=~r80;r85=r83&r84;r86=r85|r81;r11=r86;return r11;break};case 1:{r87=r1+14|0;r88=HEAP8[r87];r89=r88&124;r90=r1+15|0;r91=HEAP8[r90];r92=r91&r89;r93=r92<<24>>24==0;r94=r89|-128;r95=r93?r89:r94;HEAP8[r87]=r95;r96=(r95&255)>>>7;r97=r1+88|0;r98=HEAP8[r97];r99=r98<<24>>24==r96<<24>>24;if(!r99){HEAP8[r97]=r96;r100=r1+84|0;r101=HEAP32[r100>>2];r102=(r101|0)==0;if(!r102){r103=r1+80|0;r104=HEAP32[r103>>2];FUNCTION_TABLE[r101](r104,r96)}}r105=r1+4|0;r106=HEAP8[r105];r107=r1+8|0;r108=HEAP8[r107];r109=r108&r106;r110=r1+6|0;r111=HEAP8[r110];r112=~r108;r113=r111&r112;r114=r113|r109;r11=r114;return r11;break};case 7:{r115=r1+16|0;r116=HEAP16[r115>>1];r117=(r116&65535)>>>8;r118=r117&255;r11=r118;return r11;break};case 13:{r119=r1+14|0;r120=HEAP8[r119];r11=r120;return r11;break};case 4:{r121=r1+14|0;r122=HEAP8[r121];r123=r122&63;r124=r1+15|0;r125=HEAP8[r124];r126=r125&r123;r127=r126<<24>>24==0;r128=r123|-128;r129=r127?r123:r128;HEAP8[r121]=r129;r130=(r129&255)>>>7;r131=r1+88|0;r132=HEAP8[r131];r133=r132<<24>>24==r130<<24>>24;if(!r133){HEAP8[r131]=r130;r134=r1+84|0;r135=HEAP32[r134>>2];r136=(r135|0)==0;if(!r136){r137=r1+80|0;r138=HEAP32[r137>>2];FUNCTION_TABLE[r135](r138,r130)}}r139=r1+18|0;r140=HEAP16[r139>>1];r141=r140&255;r11=r141;return r11;break};case 8:{r142=r1+14|0;r143=HEAP8[r142];r144=r143&95;r145=r1+15|0;r146=HEAP8[r145];r147=r146&r144;r148=r147<<24>>24==0;r149=r144|-128;r150=r148?r144:r149;HEAP8[r142]=r150;r151=(r150&255)>>>7;r152=r1+88|0;r153=HEAP8[r152];r154=r153<<24>>24==r151<<24>>24;if(!r154){HEAP8[r152]=r151;r155=r1+84|0;r156=HEAP32[r155>>2];r157=(r156|0)==0;if(!r157){r158=r1+80|0;r159=HEAP32[r158>>2];FUNCTION_TABLE[r156](r159,r151)}}r160=r1+26|0;r161=HEAP16[r160>>1];r162=r161&255;r11=r162;return r11;break};case 11:{r163=r1+12|0;r164=HEAP8[r163];r11=r164;return r11;break};default:{r11=-86;return r11}}}function _e6522_get_uint16(r1,r2){return _e6522_get_uint8(r1,r2)&255}function _e6522_get_uint32(r1,r2){return _e6522_get_uint8(r1,r2)&255}function _e6522_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352;r4=0;r5=r1|0;r6=HEAP32[r5>>2];r7=r2>>>(r6>>>0);switch(r7|0){case 0:{r8=r1+5|0;HEAP8[r8]=r3;r9=r1+9|0;r10=HEAP8[r9];r11=r1+52|0;r12=HEAP32[r11>>2];r13=(r12|0)==0;if(!r13){r14=r1+7|0;r15=HEAP8[r14];r16=r10&r3;r17=~r10;r18=r15&r17;r19=r18|r16;r20=r1+48|0;r21=HEAP32[r20>>2];FUNCTION_TABLE[r12](r21,r19)}r22=r1+14|0;r23=HEAP8[r22];r24=r23&103;r25=r1+15|0;r26=HEAP8[r25];r27=r26&r24;r28=r27<<24>>24==0;r29=r24|-128;r30=r28?r24:r29;HEAP8[r22]=r30;r31=(r30&255)>>>7;r32=r1+88|0;r33=HEAP8[r32];r34=r33<<24>>24==r31<<24>>24;if(r34){return}HEAP8[r32]=r31;r35=r1+84|0;r36=HEAP32[r35>>2];r37=(r36|0)==0;if(r37){return}r38=r1+80|0;r39=HEAP32[r38>>2];FUNCTION_TABLE[r36](r39,r31);return;break};case 10:{r40=r1+14|0;r41=HEAP8[r40];r42=r41&123;r43=r1+15|0;r44=HEAP8[r43];r45=r44&r42;r46=r45<<24>>24==0;r47=r42|-128;r48=r46?r42:r47;HEAP8[r40]=r48;r49=(r48&255)>>>7;r50=r1+88|0;r51=HEAP8[r50];r52=r51<<24>>24==r49<<24>>24;if(!r52){HEAP8[r50]=r49;r53=r1+84|0;r54=HEAP32[r53>>2];r55=(r54|0)==0;if(!r55){r56=r1+80|0;r57=HEAP32[r56>>2];FUNCTION_TABLE[r54](r57,r49)}}r58=r1+10|0;HEAP8[r58]=r3;r59=r1+11|0;HEAP8[r59]=0;r60=r1+12|0;r61=HEAP8[r60];r62=r61&28;r63=r62<<24>>24==28;if(!r63){return}r64=r1+76|0;r65=HEAP32[r64>>2];r66=(r65|0)==0;if(r66){return}r67=r1+72|0;r68=HEAP32[r67>>2];FUNCTION_TABLE[r65](r68,r3);r69=HEAP8[r40];r70=r69&123;r71=r70|4;r72=HEAP8[r43];r73=r71&r72;r74=r73<<24>>24==0;r75=r69|-124;r76=r74?r71:r75;HEAP8[r40]=r76;r77=(r76&255)>>>7;r78=HEAP8[r50];r79=r78<<24>>24==r77<<24>>24;if(r79){return}HEAP8[r50]=r77;r80=r1+84|0;r81=HEAP32[r80>>2];r82=(r81|0)==0;if(r82){return}r83=r1+80|0;r84=HEAP32[r83>>2];FUNCTION_TABLE[r81](r84,r77);return;break};case 1:{r85=r1+4|0;HEAP8[r85]=r3;r86=r1+8|0;r87=HEAP8[r86];r88=r1+40|0;r89=HEAP32[r88>>2];r90=(r89|0)==0;if(!r90){r91=r1+6|0;r92=HEAP8[r91];r93=r87&r3;r94=~r87;r95=r92&r94;r96=r95|r93;r97=r1+36|0;r98=HEAP32[r97>>2];FUNCTION_TABLE[r89](r98,r96)}r99=r1+14|0;r100=HEAP8[r99];r101=r100&124;r102=r1+15|0;r103=HEAP8[r102];r104=r103&r101;r105=r104<<24>>24==0;r106=r101|-128;r107=r105?r101:r106;HEAP8[r99]=r107;r108=(r107&255)>>>7;r109=r1+88|0;r110=HEAP8[r109];r111=r110<<24>>24==r108<<24>>24;if(r111){return}HEAP8[r109]=r108;r112=r1+84|0;r113=HEAP32[r112>>2];r114=(r113|0)==0;if(r114){return}r115=r1+80|0;r116=HEAP32[r115>>2];FUNCTION_TABLE[r113](r116,r108);return;break};case 9:{r117=r1+24|0;r118=HEAP16[r117>>1];r119=r118&255;r120=r3&255;r121=r120<<8;r122=r119|r121;HEAP16[r117>>1]=r122;r123=r1+26|0;HEAP16[r123>>1]=r122;r124=r1+12|0;r125=HEAP8[r124];r126=r125&32;r127=r126<<24>>24==0;if(r127){r128=r1+28|0;HEAP32[r128>>2]=1}r129=r1+14|0;r130=HEAP8[r129];r131=r130&95;r132=r1+15|0;r133=HEAP8[r132];r134=r133&r131;r135=r134<<24>>24==0;r136=r131|-128;r137=r135?r131:r136;HEAP8[r129]=r137;r138=(r137&255)>>>7;r139=r1+88|0;r140=HEAP8[r139];r141=r140<<24>>24==r138<<24>>24;if(r141){return}HEAP8[r139]=r138;r142=r1+84|0;r143=HEAP32[r142>>2];r144=(r143|0)==0;if(r144){return}r145=r1+80|0;r146=HEAP32[r145>>2];FUNCTION_TABLE[r143](r146,r138);return;break};case 7:{r147=r1+16|0;r148=HEAP16[r147>>1];r149=r148&255;r150=r3&255;r151=r150<<8;r152=r149|r151;HEAP16[r147>>1]=r152;return;break};case 11:{r153=r1+12|0;HEAP8[r153]=r3;r154=r3&28;r155=r154<<24>>24==0;if(r155){r156=r1+11|0;HEAP8[r156]=0}r157=r3&255;r158=r157&28;r159=(r158|0)==0;if(!r159){r160=r157&16;r161=(r160|0)==0;if(r161){r162=1}else{r163=r1+10|0;r164=HEAP8[r163];r165=r164&1;r162=r165}}else{r166=r1+13|0;r167=HEAP8[r166];r168=r167&-32;r169=r168<<24>>24!=-64;r170=r169&1;r162=r170}r171=r1+68|0;r172=HEAP8[r171];r173=r162<<24>>24==r172<<24>>24;if(r173){return}HEAP8[r171]=r162;r174=r1+64|0;r175=HEAP32[r174>>2];r176=(r175|0)==0;if(r176){return}r177=r1+60|0;r178=HEAP32[r177>>2];FUNCTION_TABLE[r175](r178,r162);return;break};case 15:{r179=r1+4|0;HEAP8[r179]=r3;r180=r1+8|0;r181=HEAP8[r180];r182=r1+40|0;r183=HEAP32[r182>>2];r184=(r183|0)==0;if(!r184){r185=r1+6|0;r186=HEAP8[r185];r187=r181&r3;r188=~r181;r189=r186&r188;r190=r189|r187;r191=r1+36|0;r192=HEAP32[r191>>2];FUNCTION_TABLE[r183](r192,r190)}r193=r1+14|0;r194=HEAP8[r193];r195=r194&124;r196=r1+15|0;r197=HEAP8[r196];r198=r197&r195;r199=r198<<24>>24==0;r200=r195|-128;r201=r199?r195:r200;HEAP8[r193]=r201;r202=(r201&255)>>>7;r203=r1+88|0;r204=HEAP8[r203];r205=r204<<24>>24==r202<<24>>24;if(r205){return}HEAP8[r203]=r202;r206=r1+84|0;r207=HEAP32[r206>>2];r208=(r207|0)==0;if(r208){return}r209=r1+80|0;r210=HEAP32[r209>>2];FUNCTION_TABLE[r207](r210,r202);return;break};case 8:{r211=r1+24|0;r212=HEAP16[r211>>1];r213=r212&-256;r214=r3&255;r215=r213|r214;HEAP16[r211>>1]=r215;return;break};case 4:{r216=r1+16|0;r217=HEAP16[r216>>1];r218=r217&-256;r219=r3&255;r220=r218|r219;HEAP16[r216>>1]=r220;return;break};case 2:{r221=r1+9|0;HEAP8[r221]=r3;r222=r1+52|0;r223=HEAP32[r222>>2];r224=(r223|0)==0;if(r224){return}r225=r1+5|0;r226=r1+7|0;r227=HEAP8[r225];r228=HEAP8[r226];r229=r227&r3;r230=~r3;r231=r228&r230;r232=r231|r229;r233=r1+48|0;r234=HEAP32[r233>>2];FUNCTION_TABLE[r223](r234,r232);return;break};case 6:{r235=r1+16|0;r236=HEAP16[r235>>1];r237=r236&-256;r238=r3&255;r239=r237|r238;HEAP16[r235>>1]=r239;return;break};case 3:{r240=r1+8|0;HEAP8[r240]=r3;r241=r1+40|0;r242=HEAP32[r241>>2];r243=(r242|0)==0;if(r243){return}r244=r1+4|0;r245=r1+6|0;r246=HEAP8[r244];r247=HEAP8[r245];r248=r246&r3;r249=~r3;r250=r247&r249;r251=r250|r248;r252=r1+36|0;r253=HEAP32[r252>>2];FUNCTION_TABLE[r242](r253,r251);return;break};case 5:{r254=r1+16|0;r255=HEAP16[r254>>1];r256=r255&255;r257=r3&255;r258=r257<<8;r259=r256|r258;HEAP16[r254>>1]=r259;r260=r1+18|0;HEAP16[r260>>1]=r259;r261=r1+12|0;r262=HEAP8[r261];r263=r262&64;r264=r263<<24>>24==0;if(r264){r265=r1+20|0;HEAP32[r265>>2]=1}r266=r1+14|0;r267=HEAP8[r266];r268=r267&63;r269=r1+15|0;r270=HEAP8[r269];r271=r270&r268;r272=r271<<24>>24==0;r273=r268|-128;r274=r272?r268:r273;HEAP8[r266]=r274;r275=(r274&255)>>>7;r276=r1+88|0;r277=HEAP8[r276];r278=r277<<24>>24==r275<<24>>24;if(r278){return}HEAP8[r276]=r275;r279=r1+84|0;r280=HEAP32[r279>>2];r281=(r280|0)==0;if(r281){return}r282=r1+80|0;r283=HEAP32[r282>>2];FUNCTION_TABLE[r280](r283,r275);return;break};case 12:{r284=r1+13|0;HEAP8[r284]=r3;r285=r1+12|0;r286=HEAP8[r285];r287=r286&255;r288=r287&28;r289=(r288|0)==0;if(!r289){r290=r287&16;r291=(r290|0)==0;if(r291){r292=1}else{r293=r1+10|0;r294=HEAP8[r293];r295=r294&1;r292=r295}}else{r296=r3&-32;r297=r296<<24>>24!=-64;r298=r297&1;r292=r298}r299=r1+68|0;r300=HEAP8[r299];r301=r292<<24>>24==r300<<24>>24;if(r301){return}HEAP8[r299]=r292;r302=r1+64|0;r303=HEAP32[r302>>2];r304=(r303|0)==0;if(r304){return}r305=r1+60|0;r306=HEAP32[r305>>2];FUNCTION_TABLE[r303](r306,r292);return;break};case 14:{r307=r3<<24>>24>-1;r308=r3&127;if(r307){r309=r308^127;r310=r1+15|0;r311=HEAP8[r310];r312=r311&r309;HEAP8[r310]=r312;r313=r312}else{r314=r1+15|0;r315=HEAP8[r314];r316=r315|r308;HEAP8[r314]=r316;r313=r316}r317=r1+14|0;r318=HEAP8[r317];r319=r318&127;r320=r319&r313;r321=r320<<24>>24==0;r322=r318|-128;r323=r321?r319:r322;HEAP8[r317]=r323;r324=(r323&255)>>>7;r325=r1+88|0;r326=HEAP8[r325];r327=r326<<24>>24==r324<<24>>24;if(r327){return}HEAP8[r325]=r324;r328=r1+84|0;r329=HEAP32[r328>>2];r330=(r329|0)==0;if(r330){return}r331=r1+80|0;r332=HEAP32[r331>>2];FUNCTION_TABLE[r329](r332,r324);return;break};case 13:{r333=r1+14|0;r334=HEAP8[r333];r335=r3^127;r336=r334&r335;r337=r336&127;r338=r1+15|0;r339=HEAP8[r338];r340=r337&r339;r341=r340<<24>>24==0;r342=r336|-128;r343=r341?r337:r342;HEAP8[r333]=r343;r344=(r343&255)>>>7;r345=r1+88|0;r346=HEAP8[r345];r347=r346<<24>>24==r344<<24>>24;if(r347){return}HEAP8[r345]=r344;r348=r1+84|0;r349=HEAP32[r348>>2];r350=(r349|0)==0;if(r350){return}r351=r1+80|0;r352=HEAP32[r351>>2];FUNCTION_TABLE[r349](r352,r344);return;break};default:{return}}}function _e6522_set_uint16(r1,r2,r3){_e6522_set_uint8(r1,r2,r3&255);return}function _e6522_set_uint32(r1,r2,r3){_e6522_set_uint8(r1,r2,r3&255);return}function _e6522_reset(r1){var r2,r3,r4,r5;HEAP8[r1+4|0]=0;r2=r1+5|0;HEAP8[r2]=0;r3=r1+14|0;_memset(r1+8|0,0,24)|0;r4=HEAP32[r1+40>>2];if((r4|0)==0){r5=0}else{FUNCTION_TABLE[r4](HEAP32[r1+36>>2],HEAP8[r1+6|0]);r5=HEAP8[r1+9|0]}r4=HEAP32[r1+52>>2];if((r4|0)!=0){FUNCTION_TABLE[r4](HEAP32[r1+48>>2],HEAP8[r1+7|0]&~r5|HEAP8[r2]&r5)}r5=HEAP8[r3];r2=r5&127;r4=(HEAP8[r1+15|0]&r2)<<24>>24==0?r2:r5|-128;HEAP8[r3]=r4;r3=(r4&255)>>>7;r4=r1+88|0;if((HEAP8[r4]|0)==r3<<24>>24){return}HEAP8[r4]=r3;r4=HEAP32[r1+84>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+80>>2],r3);return}function _e6522_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=r1+18|0;r4=HEAP16[r3>>1];r5=r4&65535;do{if(r5>>>0>r2>>>0|r4<<16>>16==0){HEAP16[r3>>1]=r5-r2}else{if((HEAP8[r1+12|0]&64)==0){HEAP16[r3>>1]=r5-r2;r6=r1+20|0;if((HEAP32[r6>>2]|0)==0){break}HEAP32[r6>>2]=0;r6=r1+14|0;r7=HEAP8[r6];r8=r7&63|64;r9=(r8&HEAP8[r1+15|0])<<24>>24==0?r8:r7|-64;HEAP8[r6]=r9;r6=(r9&255)>>>7;r9=r1+88|0;if((HEAP8[r9]|0)==r6<<24>>24){break}HEAP8[r9]=r6;r9=HEAP32[r1+84>>2];if((r9|0)==0){break}FUNCTION_TABLE[r9](HEAP32[r1+80>>2],r6);break}r6=r2-r5|0;r9=r1+14|0;r7=HEAP8[r9];r8=r7&63|64;r10=(r8&HEAP8[r1+15|0])<<24>>24==0?r8:r7|-64;HEAP8[r9]=r10;r9=(r10&255)>>>7;r10=r1+88|0;if((HEAP8[r10]|0)!=r9<<24>>24){HEAP8[r10]=r9;r10=HEAP32[r1+84>>2];if((r10|0)!=0){FUNCTION_TABLE[r10](HEAP32[r1+80>>2],r9)}}r9=HEAP16[r1+16>>1];if(r9<<16>>16==0){r11=r6&65535;r12=0}else{r10=r9&65535;r11=(r6>>>0)%(r10>>>0)&-1;r12=r10}HEAP16[r3>>1]=r12-r11}}while(0);r11=r1+26|0;r12=HEAP16[r11>>1];r3=r12&65535;if(r3>>>0>r2>>>0|r12<<16>>16==0){HEAP16[r11>>1]=r3-r2;return}if((HEAP8[r1+12|0]&32)!=0){return}HEAP16[r11>>1]=r3-r2;r2=r1+28|0;if((HEAP32[r2>>2]|0)==0){return}HEAP32[r2>>2]=0;r2=r1+14|0;r3=HEAP8[r2];r11=r3&95|32;r12=(r11&HEAP8[r1+15|0])<<24>>24==0?r11:r3|-96;HEAP8[r2]=r12;r2=(r12&255)>>>7;r12=r1+88|0;if((HEAP8[r12]|0)==r2<<24>>24){return}HEAP8[r12]=r2;r12=HEAP32[r1+84>>2];if((r12|0)==0){return}FUNCTION_TABLE[r12](HEAP32[r1+80>>2],r2);return}function _e8530_init(r1){HEAP32[r1>>2]=0;HEAP32[r1+1284>>2]=0;HEAP8[r1+38|0]=1;HEAP8[r1+39|0]=1;HEAP32[r1+56>>2]=0;HEAP32[r1+60>>2]=16384;HEAP32[r1+64>>2]=0;HEAP32[r1+68>>2]=1;HEAP32[r1+72>>2]=0;HEAP32[r1+76>>2]=1;HEAP32[r1+80>>2]=0;HEAP32[r1+84>>2]=0;HEAP32[r1+88>>2]=0;HEAP32[r1+348>>2]=0;HEAP32[r1+352>>2]=0;_memset(r1+612|0,0,32)|0;HEAP8[r1+678|0]=1;HEAP8[r1+679|0]=1;HEAP32[r1+696>>2]=0;HEAP32[r1+700>>2]=16384;HEAP32[r1+704>>2]=0;HEAP32[r1+708>>2]=1;HEAP32[r1+712>>2]=0;HEAP32[r1+716>>2]=1;HEAP32[r1+720>>2]=0;HEAP32[r1+724>>2]=0;HEAP32[r1+728>>2]=0;HEAP32[r1+988>>2]=0;HEAP32[r1+992>>2]=0;_memset(r1+1252|0,0,32)|0;HEAP32[r1+1288>>2]=0;HEAP32[r1+1292>>2]=0;HEAP8[r1+1296|0]=0;return}function _e8530_set_irq_fct(r1,r2,r3){HEAP32[r1+1288>>2]=r2;HEAP32[r1+1292>>2]=r3;return}function _e8530_set_inp_fct(r1,r2,r3,r4){if(r2>>>0>=2){return}HEAP32[r1+4+(r2*640&-1)+608>>2]=r3;HEAP32[r1+4+(r2*640&-1)+612>>2]=r4;return}function _e8530_set_out_fct(r1,r2,r3,r4){if(r2>>>0>=2){return}HEAP32[r1+4+(r2*640&-1)+616>>2]=r3;HEAP32[r1+4+(r2*640&-1)+620>>2]=r4;return}function _e8530_set_rts_fct(r1,r2,r3,r4){if(r2>>>0>=2){return}HEAP32[r1+4+(r2*640&-1)+624>>2]=r3;HEAP32[r1+4+(r2*640&-1)+628>>2]=r4;return}function _e8530_set_comm_fct(r1,r2,r3,r4){if(r2>>>0>=2){return}HEAP32[r1+4+(r2*640&-1)+632>>2]=r3;HEAP32[r1+4+(r2*640&-1)+636>>2]=r4;return}function _e8530_set_multichar(r1,r2,r3,r4){if(r2>>>0>1){return}HEAP32[r1+4+(r2*640&-1)+60>>2]=0;HEAP32[r1+4+(r2*640&-1)+64>>2]=(r3|0)==0?1:r3;HEAP32[r1+4+(r2*640&-1)+68>>2]=0;HEAP32[r1+4+(r2*640&-1)+72>>2]=(r4|0)==0?1:r4;return}function _e8530_set_clock(r1,r2,r3,r4){HEAP32[r1+1284>>2]=r2;HEAP32[r1+80>>2]=r3;HEAP32[r1+720>>2]=r4;return}function _e8530_set_reg(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210;r5=0;r6=r2&1;L1:do{switch(r3|0){case 1:{r7=r1+4+(r6*640&-1)+1|0;HEAP8[r7]=r4;r8=r1+13|0;r9=HEAP8[r8];r10=r9&8;r11=r10<<24>>24==0;if(r11){r12=r1+1296|0;r13=HEAP8[r12];r14=r13<<24>>24==0;if(r14){break L1}HEAP8[r12]=0;r15=r1+1292|0;r16=HEAP32[r15>>2];r17=(r16|0)==0;if(r17){r5=63;break L1}r18=r1+1288|0;r19=HEAP32[r18>>2];FUNCTION_TABLE[r16](r19,0);r5=63;break L1}else{r20=r1+23|0;r21=HEAP8[r20];r22=r21<<24>>24!=0;r23=r22&1;r24=r1+1296|0;r25=HEAP8[r24];r26=r25<<24>>24==r23<<24>>24;if(r26){r5=63;break L1}HEAP8[r24]=r23;r27=r1+1292|0;r28=HEAP32[r27>>2];r29=(r28|0)==0;if(r29){r5=63;break L1}r30=r1+1288|0;r31=HEAP32[r30>>2];FUNCTION_TABLE[r28](r31,r23);r5=63;break L1}break};case 2:{r32=r1+6|0;HEAP8[r32]=r4;r33=r1+646|0;HEAP8[r33]=r4;r34=r1+22|0;HEAP8[r34]=r4;r35=r1+662|0;HEAP8[r35]=r4;break};case 4:{r36=r1+4+(r6*640&-1)+4|0;HEAP8[r36]=r4;_e8530_set_params(r1,r6);break};case 9:{r37=r1+13|0;r38=HEAP8[r37];HEAP8[r37]=r4;r39=r1+653|0;HEAP8[r39]=r4;r40=r38^8;r41=r4&8;r42=r40&r41;r43=r42<<24>>24==0;if(!r43){r44=r41<<24>>24==0;if(r44){r45=r1+1296|0;r46=HEAP8[r45];r47=r46<<24>>24==0;if(!r47){HEAP8[r45]=0;r48=r1+1292|0;r49=HEAP32[r48>>2];r50=(r49|0)==0;if(!r50){r51=r1+1288|0;r52=HEAP32[r51>>2];FUNCTION_TABLE[r49](r52,0)}}}else{r53=r1+23|0;r54=HEAP8[r53];r55=r54<<24>>24!=0;r56=r55&1;r57=r1+1296|0;r58=HEAP8[r57];r59=r58<<24>>24==r56<<24>>24;if(!r59){HEAP8[r57]=r56;r60=r1+1292|0;r61=HEAP32[r60>>2];r62=(r61|0)==0;if(!r62){r63=r1+1288|0;r64=HEAP32[r63>>2];FUNCTION_TABLE[r61](r64,r56)}}}r65=HEAP8[r37];r66=r65&8;r67=r66<<24>>24==0;if(r67){r68=r1+1296|0;r69=HEAP8[r68];r70=r69<<24>>24==0;if(r70){r5=63;break L1}HEAP8[r68]=0;r71=r1+1292|0;r72=HEAP32[r71>>2];r73=(r72|0)==0;if(r73){r5=63;break L1}r74=r1+1288|0;r75=HEAP32[r74>>2];FUNCTION_TABLE[r72](r75,0);r5=63;break L1}else{r76=r1+23|0;r77=HEAP8[r76];r78=r77<<24>>24!=0;r79=r78&1;r80=r1+1296|0;r81=HEAP8[r80];r82=r81<<24>>24==r79<<24>>24;if(r82){r5=63;break L1}HEAP8[r80]=r79;r83=r1+1292|0;r84=HEAP32[r83>>2];r85=(r84|0)==0;if(r85){r5=63;break L1}r86=r1+1288|0;r87=HEAP32[r86>>2];FUNCTION_TABLE[r84](r87,r79);r5=63;break L1}}break};case 8:{r88=r1+4+(r6*640&-1)+8|0;HEAP8[r88]=r4;r89=r1+4+(r6*640&-1)+16|0;r90=HEAP8[r89];r91=r90&-5;HEAP8[r89]=r91;r92=r1+4+(r6*640&-1)+34|0;HEAP8[r92]=0;r93=(r6|0)==0;r94=r93?-17:-3;r95=r1+23|0;r96=HEAP8[r95];r97=r96&r94;HEAP8[r95]=r97;r98=r1+13|0;r99=HEAP8[r98];r100=r99&8;r101=r100<<24>>24==0;if(r101){r102=r1+1296|0;r103=HEAP8[r102];r104=r103<<24>>24==0;if(!r104){HEAP8[r102]=0;r105=r1+1292|0;r106=HEAP32[r105>>2];r107=(r106|0)==0;if(!r107){r108=r1+1288|0;r109=HEAP32[r108>>2];FUNCTION_TABLE[r106](r109,0)}}}else{r110=r97<<24>>24!=0;r111=r110&1;r112=r1+1296|0;r113=HEAP8[r112];r114=r113<<24>>24==r111<<24>>24;if(!r114){HEAP8[r112]=r111;r115=r1+1292|0;r116=HEAP32[r115>>2];r117=(r116|0)==0;if(!r117){r118=r1+1288|0;r119=HEAP32[r118>>2];FUNCTION_TABLE[r116](r119,r111)}}}_e8530_check_txd(r1,r6);r5=63;break};case 0:{r120=r1+4+(r6*640&-1)|0;HEAP8[r120]=r4;r121=r4&255;r122=r121&7;r123=r1|0;HEAP32[r123>>2]=r122;r124=r121>>>3;r125=r124&7;if((r125|0)==2){r126=(r6|0)==0;r127=r126?-9:-2;r128=r1+23|0;r129=HEAP8[r128];r130=r129&r127;HEAP8[r128]=r130;r131=r1+4+(r6*640&-1)+32|0;HEAP8[r131]=0;r132=r1+13|0;r133=HEAP8[r132];r134=r133&8;r135=r134<<24>>24==0;if(!r135){r136=r130<<24>>24!=0;r137=r136&1;r138=r1+1296|0;r139=HEAP8[r138];r140=r139<<24>>24==r137<<24>>24;if(r140){r5=63;break L1}HEAP8[r138]=r137;r141=r1+1292|0;r142=HEAP32[r141>>2];r143=(r142|0)==0;if(r143){r5=63;break L1}r144=r1+1288|0;r145=HEAP32[r144>>2];FUNCTION_TABLE[r142](r145,r137);r5=63;break L1}r146=r1+1296|0;r147=HEAP8[r146];r148=r147<<24>>24==0;if(r148){return}HEAP8[r146]=0;r149=r1+1292|0;r150=HEAP32[r149>>2];r151=(r150|0)==0;if(r151){r5=63;break L1}r152=r1+1288|0;r153=HEAP32[r152>>2];FUNCTION_TABLE[r150](r153,0);r5=63;break L1}else if((r125|0)==5){r154=(r6|0)==0;r155=r154?-17:-3;r156=r1+23|0;r157=HEAP8[r156];r158=r157&r155;HEAP8[r156]=r158;r159=r1+13|0;r160=HEAP8[r159];r161=r160&8;r162=r161<<24>>24==0;if(r162){r163=r1+1296|0;r164=HEAP8[r163];r165=r164<<24>>24==0;if(r165){r5=63;break L1}HEAP8[r163]=0;r166=r1+1292|0;r167=HEAP32[r166>>2];r168=(r167|0)==0;if(r168){r5=63;break L1}r169=r1+1288|0;r170=HEAP32[r169>>2];FUNCTION_TABLE[r167](r170,0);r5=63;break L1}else{r171=r158<<24>>24!=0;r172=r171&1;r173=r1+1296|0;r174=HEAP8[r173];r175=r174<<24>>24==r172<<24>>24;if(r175){r5=63;break L1}HEAP8[r173]=r172;r176=r1+1292|0;r177=HEAP32[r176>>2];r178=(r177|0)==0;if(r178){r5=63;break L1}r179=r1+1288|0;r180=HEAP32[r179>>2];FUNCTION_TABLE[r177](r180,r172);r5=63;break L1}}else if((r125|0)==1){r181=r122|8;HEAP32[r123>>2]=r181;return}else{return}break};case 3:{r182=r1+4+(r6*640&-1)+3|0;HEAP8[r182]=r4;r183=r4&16;r184=r183<<24>>24==0;if(!r184){r185=r1+4+(r6*640&-1)+16|0;r186=HEAP8[r185];r187=r186|16;HEAP8[r185]=r187;r5=63}break};case 14:{r188=r1+4+(r6*640&-1)+14|0;HEAP8[r188]=r4;_e8530_set_params(r1,r6);break};case 15:{r189=r1+4+(r6*640&-1)+15|0;HEAP8[r189]=r4;r190=r1+4+(r6*640&-1)+31|0;HEAP8[r190]=r4;break};case 11:{r191=r1+4+(r6*640&-1)+11|0;HEAP8[r191]=r4;break};case 10:{r192=r1+4+(r6*640&-1)+10|0;HEAP8[r192]=r4;break};case 12:{r193=r1+4+(r6*640&-1)+12|0;HEAP8[r193]=r4;_e8530_set_params(r1,r6);break};case 13:{r194=r1+4+(r6*640&-1)+13|0;HEAP8[r194]=r4;_e8530_set_params(r1,r6);break};case 5:{r195=r1+4+(r6*640&-1)+5|0;r196=HEAP8[r195];HEAP8[r195]=r4;r197=r196^r4;r198=r197&2;r199=r198<<24>>24==0;if(!r199){r200=r1+4+(r6*640&-1)+628|0;r201=HEAP32[r200>>2];r202=(r201|0)==0;if(!r202){r203=r1+4+(r6*640&-1)+624|0;r204=HEAP32[r203>>2];r205=(r4&255)>>>1;r206=r205&1;FUNCTION_TABLE[r201](r204,r206)}}_e8530_set_params(r1,r6);r5=63;break};default:{r207=r3&15;r208=r1+4+(r6*640&-1)+r207|0;HEAP8[r208]=r4;r5=63}}}while(0);if(r5==63){r209=(r3|0)==0;if(r209){return}}r210=r1|0;HEAP32[r210>>2]=0;return}function _e8530_get_reg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r4=r2&1;do{if((r3|0)==3){if((r4|0)==0){r5=HEAP8[r1+23|0]}else{r5=0}}else if((r3|0)==0){r2=HEAP8[r1+4+(r4*640&-1)+32|0];r5=HEAP8[r1+4+(r4*640&-1)+33|0]&r2|HEAP8[r1+4+(r4*640&-1)+16|0]&~r2}else if((r3|0)==8){r2=r1+4+(r4*640&-1)+24|0;r6=HEAP8[r2];r7=r1+4+(r4*640&-1)+16|0;HEAP8[r7]=HEAP8[r7]&-2;r8=r1+4+(r4*640&-1)+35|0;HEAP8[r8]=1;r9=(r4|0)==0;r10=r1+23|0;r11=HEAP8[r10]&(r9?-33:-5);HEAP8[r10]=r11;r12=r1+13|0;if((HEAP8[r12]&8)==0){r13=r1+1296|0;if((HEAP8[r13]|0)!=0){HEAP8[r13]=0;r13=HEAP32[r1+1292>>2];if((r13|0)!=0){FUNCTION_TABLE[r13](HEAP32[r1+1288>>2],0)}}}else{r13=r11<<24>>24!=0|0;r11=r1+1296|0;if((HEAP8[r11]|0)!=r13<<24>>24){HEAP8[r11]=r13;r11=HEAP32[r1+1292>>2];if((r11|0)!=0){FUNCTION_TABLE[r11](HEAP32[r1+1288>>2],r13)}}}r13=r1+4+(r4*640&-1)+348|0;r11=HEAP32[r13>>2];if((HEAP32[r1+4+(r4*640&-1)+344>>2]|0)!=(r11|0)){r14=r1+4+(r4*640&-1)+60|0;r15=HEAP32[r14>>2];if((r15|0)!=0?(HEAP8[r8]|0)!=0:0){HEAP32[r14>>2]=r15-1;HEAP8[r2]=HEAP8[r1+4+(r4*640&-1)+352+r11|0];HEAP32[r13>>2]=r11+1&255;r11=HEAP32[r1+4+(r4*640&-1)+612>>2];if((r11|0)!=0){FUNCTION_TABLE[r11](HEAP32[r1+4+(r4*640&-1)+608>>2],1)}HEAP8[r7]=HEAP8[r7]|1;HEAP8[r8]=0;if((HEAP8[r1+4+(r4*640&-1)+1|0]&24)==16){HEAP8[r10]=HEAP8[r10]|(r9?32:4)}if((HEAP8[r12]&8)==0){r12=r1+1296|0;if((HEAP8[r12]|0)==0){r5=r6;break}HEAP8[r12]=0;r12=HEAP32[r1+1292>>2];if((r12|0)==0){r5=r6;break}FUNCTION_TABLE[r12](HEAP32[r1+1288>>2],0);r5=r6;break}else{r12=(HEAP8[r10]|0)!=0|0;r10=r1+1296|0;if((HEAP8[r10]|0)==r12<<24>>24){r5=r6;break}HEAP8[r10]=r12;r10=HEAP32[r1+1292>>2];if((r10|0)==0){r5=r6;break}FUNCTION_TABLE[r10](HEAP32[r1+1288>>2],r12);r5=r6;break}}else{r5=r6}}else{r5=r6}}else if((r3|0)==2){r6=HEAP8[r1+22|0];if((r4|0)!=0){r12=HEAPU8[r1+23|0];if((r12&32|0)==0){if((r12&16|0)==0){if((r12&8|0)==0){if((r12&4|0)==0){if((r12&2|0)==0){r16=(r12&1|0)==0?102:66}else{r16=0}}else{r16=36}}else{r16=90}}else{r16=24}}else{r16=60}r12=r6&255;if((HEAP8[r1+13|0]&16)==0){r5=(r16&14|r12&241)&255;break}else{r5=(r16|r12)&112;break}}else{r5=r6}}else{r5=HEAP8[(r3&15)+(r1+4+(r4*640&-1)+16)|0]}}while(0);HEAP32[r1>>2]=0;return r5}function _e8530_get_ctl_a(r1){return _e8530_get_reg(r1,0,HEAP32[r1>>2])}function _e8530_get_ctl_b(r1){return _e8530_get_reg(r1,1,HEAP32[r1>>2])}function _e8530_set_ctl_a(r1,r2){_e8530_set_reg(r1,0,HEAP32[r1>>2],r2);return}function _e8530_set_ctl_b(r1,r2){_e8530_set_reg(r1,1,HEAP32[r1>>2],r2);return}function _e8530_get_data_a(r1){return _e8530_get_reg(r1,0,8)}function _e8530_get_data_b(r1){return _e8530_get_reg(r1,1,8)}function _e8530_set_data_a(r1,r2){var r3;HEAP8[r1+12|0]=r2;r2=r1+20|0;HEAP8[r2]=HEAP8[r2]&-5;HEAP8[r1+38|0]=0;r2=r1+23|0;r3=HEAP8[r2]&-17;HEAP8[r2]=r3;if((HEAP8[r1+13|0]&8)==0){r2=r1+1296|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r2=HEAP32[r1+1292>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+1288>>2],0)}}}else{r2=r3<<24>>24!=0|0;r3=r1+1296|0;if((HEAP8[r3]|0)!=r2<<24>>24){HEAP8[r3]=r2;r3=HEAP32[r1+1292>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+1288>>2],r2)}}}_e8530_check_txd(r1,0);HEAP32[r1>>2]=0;return}function _e8530_set_data_b(r1,r2){var r3;HEAP8[r1+652|0]=r2;r2=r1+660|0;HEAP8[r2]=HEAP8[r2]&-5;HEAP8[r1+678|0]=0;r2=r1+23|0;r3=HEAP8[r2]&-3;HEAP8[r2]=r3;if((HEAP8[r1+13|0]&8)==0){r2=r1+1296|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r2=HEAP32[r1+1292>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+1288>>2],0)}}}else{r2=r3<<24>>24!=0|0;r3=r1+1296|0;if((HEAP8[r3]|0)!=r2<<24>>24){HEAP8[r3]=r2;r3=HEAP32[r1+1292>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+1288>>2],r2)}}}_e8530_check_txd(r1,1);HEAP32[r1>>2]=0;return}function _e8530_set_dcd_a(r1,r2){var r3,r4,r5;r3=r1+20|0;r4=HEAP8[r3];r5=r2<<24>>24==0?r4|8:r4&-9;HEAP8[r3]=r5;r3=HEAP8[r1+19|0];if((r3&-6&(r5^r4))<<24>>24==0){return}if((HEAP8[r1+5|0]&1)!=0){r4=r1+23|0;HEAP8[r4]=HEAP8[r4]|8;HEAP8[r1+36|0]=r3;HEAP8[r1+37|0]=r5}if((HEAP8[r1+13|0]&8)==0){r5=r1+1296|0;if((HEAP8[r5]|0)==0){return}HEAP8[r5]=0;r5=HEAP32[r1+1292>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+1288>>2],0);return}else{r5=(HEAP8[r1+23|0]|0)!=0|0;r3=r1+1296|0;if((HEAP8[r3]|0)==r5<<24>>24){return}HEAP8[r3]=r5;r3=HEAP32[r1+1292>>2];if((r3|0)==0){return}FUNCTION_TABLE[r3](HEAP32[r1+1288>>2],r5);return}}function _e8530_set_dcd_b(r1,r2){var r3,r4,r5;r3=r1+660|0;r4=HEAP8[r3];r5=r2<<24>>24==0?r4|8:r4&-9;HEAP8[r3]=r5;r3=HEAP8[r1+659|0];if((r3&-6&(r5^r4))<<24>>24==0){return}if((HEAP8[r1+645|0]&1)!=0){r4=r1+23|0;HEAP8[r4]=HEAP8[r4]|1;HEAP8[r1+676|0]=r3;HEAP8[r1+677|0]=r5}if((HEAP8[r1+13|0]&8)==0){r5=r1+1296|0;if((HEAP8[r5]|0)==0){return}HEAP8[r5]=0;r5=HEAP32[r1+1292>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+1288>>2],0);return}else{r5=(HEAP8[r1+23|0]|0)!=0|0;r3=r1+1296|0;if((HEAP8[r3]|0)==r5<<24>>24){return}HEAP8[r3]=r5;r3=HEAP32[r1+1292>>2];if((r3|0)==0){return}FUNCTION_TABLE[r3](HEAP32[r1+1288>>2],r5);return}}function _e8530_set_cts(r1,r2,r3){var r4,r5,r6;r4=r2&1;r2=r1+4+(r4*640&-1)+16|0;r5=HEAP8[r2];r6=r3<<24>>24==0?r5|32:r5&-33;HEAP8[r2]=r6;r2=HEAP8[r1+4+(r4*640&-1)+15|0];if((r2&-6&(r6^r5))<<24>>24==0){return}if((HEAP8[r1+4+(r4*640&-1)+1|0]&1)!=0){r5=r1+23|0;HEAP8[r5]=HEAP8[r5]|((r4|0)==0?8:1);HEAP8[r1+4+(r4*640&-1)+32|0]=r2;HEAP8[r1+4+(r4*640&-1)+33|0]=r6}if((HEAP8[r1+13|0]&8)==0){r6=r1+1296|0;if((HEAP8[r6]|0)==0){return}HEAP8[r6]=0;r6=HEAP32[r1+1292>>2];if((r6|0)==0){return}FUNCTION_TABLE[r6](HEAP32[r1+1288>>2],0);return}else{r6=(HEAP8[r1+23|0]|0)!=0|0;r4=r1+1296|0;if((HEAP8[r4]|0)==r6<<24>>24){return}HEAP8[r4]=r6;r4=HEAP32[r1+1292>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+1288>>2],r6);return}}function _e8530_receive(r1,r2,r3){var r4,r5;r4=r2&1;r2=r1+4+(r4*640&-1)+344|0;r5=HEAP32[r2>>2];if((r5+1&255|0)==(HEAP32[r1+4+(r4*640&-1)+348>>2]|0)){return}HEAP8[r1+4+(r4*640&-1)+352+r5|0]=r3;HEAP32[r2>>2]=HEAP32[r2>>2]+1&255;return}function _e8530_send(r1,r2){var r3,r4,r5,r6;r3=r2&1;r2=r1+4+(r3*640&-1)+84|0;r4=HEAP32[r2>>2];if((HEAP32[r1+4+(r3*640&-1)+80>>2]|0)==(r4|0)){r5=0;return r5}r6=HEAP8[r1+4+(r3*640&-1)+88+r4|0];HEAP32[r2>>2]=r4+1&255;r5=r6;return r5}function _e8530_inp_full(r1,r2){var r3;r3=r2&1;return(HEAP32[r1+4+(r3*640&-1)+344>>2]+1&255|0)==(HEAP32[r1+4+(r3*640&-1)+348>>2]|0)|0}function _e8530_out_empty(r1,r2){var r3;r3=r2&1;return(HEAP32[r1+4+(r3*640&-1)+80>>2]|0)==(HEAP32[r1+4+(r3*640&-1)+84>>2]|0)|0}function _e8530_reset(r1){var r2,r3;HEAP32[r1>>2]=0;r2=0;while(1){HEAP8[r2+(r1+20)|0]=0;HEAP8[r2+(r1+4)|0]=0;HEAP8[r2+(r1+660)|0]=0;HEAP8[r2+(r1+644)|0]=0;r3=r2+1|0;if(r3>>>0<16){r2=r3}else{break}}r2=r1+20|0;HEAP8[r2]=HEAP8[r2]|4;r2=r1+21|0;HEAP8[r2]=HEAP8[r2]|1;HEAP8[r1+36|0]=0;HEAP32[r1+84>>2]=0;HEAP32[r1+88>>2]=0;HEAP32[r1+348>>2]=0;HEAP32[r1+352>>2]=0;r2=r1+40|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;r2=r1+660|0;HEAP8[r2]=HEAP8[r2]|4;r2=r1+661|0;HEAP8[r2]=HEAP8[r2]|1;HEAP8[r1+676|0]=0;HEAP32[r1+724>>2]=0;HEAP32[r1+728>>2]=0;HEAP32[r1+988>>2]=0;HEAP32[r1+992>>2]=0;r2=r1+680|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;r2=HEAP32[r1+632>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+628>>2],0)}r2=HEAP32[r1+1272>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+1268>>2],0)}r2=r1+1296|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+1292>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+1288>>2],0);return}function _e8530_clock(r1,r2){_e8530_chn_clock(r1,0,r2);_e8530_chn_clock(r1,1,r2);return}function _e8530_chn_clock(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r1+4+(r2*640&-1)+52|0;r5=HEAP32[r4>>2];if(r5>>>0>r3>>>0){HEAP32[r4>>2]=r5-r3;return}r6=r3-r5|0;r5=HEAP32[r1+4+(r2*640&-1)+56>>2];if(r6>>>0>r5>>>0){r7=(r6>>>0)%(r5>>>0)&-1}else{r7=r6}HEAP32[r4>>2]=r5-r7;r7=HEAP32[r1+4+(r2*640&-1)+64>>2];r5=r1+4+(r2*640&-1)+60|0;HEAP32[r5>>2]=r7;HEAP32[r1+4+(r2*640&-1)+68>>2]=HEAP32[r1+4+(r2*640&-1)+72>>2];r4=r1+4+(r2*640&-1)+348|0;r6=HEAP32[r4>>2];do{if(!((HEAP32[r1+4+(r2*640&-1)+344>>2]|0)==(r6|0)|(r7|0)==0)){r3=r1+4+(r2*640&-1)+35|0;if((HEAP8[r3]|0)!=0){HEAP32[r5>>2]=r7-1;HEAP8[r1+4+(r2*640&-1)+24|0]=HEAP8[r1+4+(r2*640&-1)+352+r6|0];HEAP32[r4>>2]=r6+1&255;r8=HEAP32[r1+4+(r2*640&-1)+612>>2];if((r8|0)!=0){FUNCTION_TABLE[r8](HEAP32[r1+4+(r2*640&-1)+608>>2],1)}r8=r1+4+(r2*640&-1)+16|0;HEAP8[r8]=HEAP8[r8]|1;HEAP8[r3]=0;if((HEAP8[r1+4+(r2*640&-1)+1|0]&24)==16){r3=r1+23|0;HEAP8[r3]=HEAP8[r3]|((r2|0)==0?32:4)}if((HEAP8[r1+13|0]&8)==0){r3=r1+1296|0;if((HEAP8[r3]|0)==0){break}HEAP8[r3]=0;r3=HEAP32[r1+1292>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+1288>>2],0);break}else{r3=(HEAP8[r1+23|0]|0)!=0|0;r8=r1+1296|0;if((HEAP8[r8]|0)==r3<<24>>24){break}HEAP8[r8]=r3;r8=HEAP32[r1+1292>>2];if((r8|0)==0){break}FUNCTION_TABLE[r8](HEAP32[r1+1288>>2],r3);break}}}}while(0);_e8530_check_txd(r1,r2);return}function _e8530_check_txd(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r1+4+(r2*640&-1)+68|0;r4=HEAP32[r3>>2];if((r4|0)==0){return}r5=r1+4+(r2*640&-1)+80|0;r6=HEAP32[r5>>2];if((r6+1&255|0)==(HEAP32[r1+4+(r2*640&-1)+84>>2]|0)){return}r7=r1+4+(r2*640&-1)+34|0;if((HEAP8[r7]|0)!=0){r8=r1+4+(r2*640&-1)+16|0;HEAP8[r8]=HEAP8[r8]|64;return}HEAP32[r3>>2]=r4-1;r4=HEAP8[r1+4+(r2*640&-1)+8|0];HEAP8[r1+4+(r2*640&-1)+88+r6|0]=r4;HEAP32[r5>>2]=HEAP32[r5>>2]+1&255;r5=HEAP32[r1+4+(r2*640&-1)+620>>2];if((r5|0)!=0){FUNCTION_TABLE[r5](HEAP32[r1+4+(r2*640&-1)+616>>2],r4)}r4=r1+4+(r2*640&-1)+16|0;HEAP8[r4]=HEAP8[r4]|4;HEAP8[r7]=1;if((HEAP8[r1+4+(r2*640&-1)+1|0]&2)!=0){r7=r1+23|0;HEAP8[r7]=HEAP8[r7]|((r2|0)==0?16:2)}if((HEAP8[r1+13|0]&8)==0){r2=r1+1296|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+1292>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+1288>>2],0);return}else{r2=(HEAP8[r1+23|0]|0)!=0|0;r7=r1+1296|0;if((HEAP8[r7]|0)==r2<<24>>24){return}HEAP8[r7]=r2;r7=HEAP32[r1+1292>>2];if((r7|0)==0){return}FUNCTION_TABLE[r7](HEAP32[r1+1288>>2],r2);return}}function _e8530_set_params(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=HEAPU8[r1+4+(r2*640&-1)+5|0]>>>5&3;if((r3|0)==0){r4=5}else if((r3|0)==2){r4=6}else if((r3|0)==1){r4=7}else if((r3|0)==3){r4=8}else{r4=0}HEAP32[r1+4+(r2*640&-1)+44>>2]=r4;r3=HEAPU8[r1+4+(r2*640&-1)+4|0];r5=r3&3;if((r5|0)==3){r6=2}else if((r5|0)==2){r6=0}else if((r5|0)==0|(r5|0)==1){r6=r5}else{r6=0}HEAP32[r1+4+(r2*640&-1)+40>>2]=r6;r5=r3>>>2&3;if((r5|0)==3){r7=4}else if((r5|0)==1){r7=2}else if((r5|0)==2){r7=3}else{r7=0}HEAP32[r1+4+(r2*640&-1)+48>>2]=r7;r5=r3>>>6;if((r5|0)==0){r8=2}else if((r5|0)==2){r8=64}else if((r5|0)==3){r8=128}else if((r5|0)==1){r8=32}else{r8=0}r5=(r7|0)==0;r3=HEAPU8[r1+4+(r2*640&-1)+14|0];if((r3&1|0)==0){HEAP32[r1+4+(r2*640&-1)+56>>2]=16384;r9=0}else{if((r3&2|0)==0){r10=r1+4+(r2*640&-1)+76|0}else{r10=r1+1284|0}r3=HEAP32[r10>>2];r10=Math_imul((HEAPU8[r1+4+(r2*640&-1)+13|0]<<8|HEAPU8[r1+4+(r2*640&-1)+12|0])+2|0,r5?2:r8)|0;r8=Math_imul(r10,r4+1+r7|0)|0;HEAP32[r1+4+(r2*640&-1)+56>>2]=r8+((r6|0)==0?0:r10);r9=(r3>>>0)/(r10>>>0)&-1}HEAP32[r1+4+(r2*640&-1)+36>>2]=r9;r10=HEAP32[r1+4+(r2*640&-1)+636>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+4+(r2*640&-1)+632>>2],r9,r6,r4,r7);return}function _mem_blk_new(r1,r2,r3){var r4,r5,r6,r7;r4=_malloc(48);r5=r4;if((r4|0)==0){r6=0;return r6}if((r3|0)!=0){r3=_malloc(r2+16|0);HEAP32[r4+44>>2]=r3;if((r3|0)==0){_free(r4);r6=0;return r6}else{r7=r3}}else{HEAP32[r4+44>>2]=0;r7=0}HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;HEAP32[r4+8>>2]=0;HEAP32[r4+12>>2]=0;HEAP32[r4+16>>2]=0;HEAP32[r4+20>>2]=0;HEAP32[r4+24>>2]=r4;HEAP8[r4+28|0]=1;HEAP8[r4+29|0]=0;HEAP8[r4+30|0]=(r7|0)!=0|0;HEAP32[r4+32>>2]=r1;HEAP32[r4+36>>2]=r1-1+r2;HEAP32[r4+40>>2]=r2;r6=r5;return r6}function _mem_blk_clone(r1){var r2,r3;r2=_malloc(48);if((r2|0)==0){r3=0;return r3}_memcpy(r2,r1,48)|0;HEAP8[r2+30|0]=0;HEAP8[r2+28|0]=1;r3=r2;return r3}function _mem_blk_get_uint8_null(r1,r2){return 0}function _mem_blk_get_uint16_null(r1,r2){return 0}function _mem_blk_get_uint32_null(r1,r2){return 0}function _mem_blk_set_uint8_null(r1,r2,r3){return}function _mem_blk_set_uint16_null(r1,r2,r3){return}function _mem_blk_set_uint32_null(r1,r2,r3){return}function _mem_blk_set_fct(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13;HEAP32[r1+24>>2]=r2;r2=r1|0;HEAP32[r2>>2]=r3;r9=r1+4|0;HEAP32[r9>>2]=r4;r10=r1+8|0;HEAP32[r10>>2]=r5;r11=r1+12|0;HEAP32[r11>>2]=r6;r12=r1+16|0;HEAP32[r12>>2]=r7;r13=r1+20|0;HEAP32[r13>>2]=r8;if((HEAP32[r1+44>>2]|0)!=0){return}if((r3|0)==0){HEAP32[r2>>2]=706}if((r4|0)==0){HEAP32[r9>>2]=1090}if((r5|0)==0){HEAP32[r10>>2]=50}if((r6|0)==0){HEAP32[r11>>2]=190}if((r7|0)==0){HEAP32[r12>>2]=168}if((r8|0)!=0){return}HEAP32[r13>>2]=652;return}function _mem_blk_clear(r1,r2){var r3;r3=HEAP32[r1+44>>2];if((r3|0)==0){return}_memset(r3,r2,HEAP32[r1+40>>2])|0;return}function _mem_blk_get_data(r1){return HEAP32[r1+44>>2]}function _mem_blk_set_readonly(r1,r2){HEAP8[r1+29|0]=(r2|0)!=0|0;return}function _mem_blk_get_addr(r1){return HEAP32[r1+32>>2]}function _mem_blk_set_addr(r1,r2){HEAP32[r1+32>>2]=r2;HEAP32[r1+36>>2]=r2-1+HEAP32[r1+40>>2];return}function _mem_blk_get_size(r1){return HEAP32[r1+40>>2]}function _mem_blk_set_size(r1,r2){HEAP32[r1+40>>2]=r2;HEAP32[r1+36>>2]=r2-1+HEAP32[r1+32>>2];return}function _buf_set_uint16_be(r1,r2,r3){HEAP8[r1+r2|0]=(r3&65535)>>>8;HEAP8[r1+(r2+1)|0]=r3;return}function _buf_set_uint32_be(r1,r2,r3){HEAP8[r1+r2|0]=r3>>>24;HEAP8[r1+(r2+1)|0]=r3>>>16;HEAP8[r1+(r2+2)|0]=r3>>>8;HEAP8[r1+(r2+3)|0]=r3;return}function _mem_blk_get_uint32_be(r1,r2){var r3;r3=HEAP32[r1+44>>2];return((HEAPU8[r3+r2|0]<<8|HEAPU8[r3+(r2+1)|0])<<8|HEAPU8[r3+(r2+2)|0])<<8|HEAPU8[r3+(r2+3)|0]}function _mem_new(){var r1,r2;r1=_malloc(56);if((r1|0)==0){r2=0;return r2}_memset(r1,0,52)|0;HEAP32[r1+52>>2]=-1;r2=r1;return r2}function _mem_set_fct(r1,r2,r3,r4,r5,r6,r7,r8){HEAP32[r1+24>>2]=r2;HEAP32[r1+28>>2]=r3;HEAP32[r1+32>>2]=r4;HEAP32[r1+36>>2]=r5;HEAP32[r1+40>>2]=r6;HEAP32[r1+44>>2]=r7;HEAP32[r1+48>>2]=r8;return}function _mem_prt_state(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=r1|0;if((HEAP32[r5>>2]|0)==0){STACKTOP=r4;return}r6=r1+4|0;r1=0;while(1){r7=HEAP32[HEAP32[r6>>2]+(r1<<3)>>2];r8=HEAP32[r7+32>>2];r9=HEAP32[r7+36>>2];r10=HEAP32[r7+40>>2];r11=(HEAP8[r7+29|0]|0)!=0|0;_fprintf(r2,55640,(r3=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r3>>2]=r1,HEAP32[r3+8>>2]=r8,HEAP32[r3+16>>2]=r9,HEAP32[r3+24>>2]=r10,HEAP32[r3+32>>2]=r11,r3));STACKTOP=r3;r11=r1+1|0;if(r11>>>0<HEAP32[r5>>2]>>>0){r1=r11}else{break}}STACKTOP=r4;return}function _mem_add_blk(r1,r2,r3){var r4,r5,r6,r7;if((r2|0)==0){return}r4=r1+4|0;r5=r1|0;r6=_realloc(HEAP32[r4>>2],(HEAP32[r5>>2]<<3)+8|0);r7=r6;if((r6|0)==0){return}HEAP32[r4>>2]=r7;r4=HEAP32[r5>>2];HEAP32[r5>>2]=r4+1;HEAP32[r7+(r4<<3)>>2]=r2;HEAP32[r7+(r4<<3)+4>>2]=(r3|0)!=0;r3=r1+8|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;return}function _mem_rmv_blk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=HEAP32[r1+4>>2];r4=r1|0;r5=HEAP32[r4>>2];if((r5|0)==0){r6=0}else{r7=0;r8=0;r9=r5;while(1){r5=r3+(r8<<3)|0;if((HEAP32[r5>>2]|0)==(r2|0)){r10=r7;r11=r9}else{r12=r5;r5=r3+(r7<<3)|0;r13=HEAP32[r12+4>>2];HEAP32[r5>>2]=HEAP32[r12>>2];HEAP32[r5+4>>2]=r13;r10=r7+1|0;r11=HEAP32[r4>>2]}r13=r8+1|0;if(r13>>>0<r11>>>0){r7=r10;r8=r13;r9=r11}else{r6=r10;break}}}HEAP32[r4>>2]=r6;r6=r1+8|0;HEAP32[r6>>2]=0;HEAP32[r6+4>>2]=0;HEAP32[r6+8>>2]=0;HEAP32[r6+12>>2]=0;return}function _mem_get_blk(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=r1+8|0;r5=HEAP32[r4>>2];if((r5|0)!=0){r6=HEAP32[r5>>2];if(((HEAP8[r6+28|0]|0)!=0?HEAP32[r6+32>>2]>>>0<=r2>>>0:0)?HEAP32[r6+36>>2]>>>0>=r2>>>0:0){r7=r6;return r7}}r6=HEAP32[r1>>2];if((r6|0)==0){r7=0;return r7}r5=0;r8=HEAP32[r1+4>>2];while(1){r9=HEAP32[r8>>2];if(((HEAP8[r9+28|0]|0)!=0?HEAP32[r9+32>>2]>>>0<=r2>>>0:0)?HEAP32[r9+36>>2]>>>0>=r2>>>0:0){break}r1=r5+1|0;if(r1>>>0<r6>>>0){r5=r1;r8=r8+8|0}else{r7=0;r3=12;break}}if(r3==12){return r7}HEAP32[r4>>2]=r8;r7=r9;return r7}function _mem_get_uint8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=r1+12|0;r5=HEAP32[r4>>2];if((r5|0)!=0){r6=HEAP32[r5>>2];if((HEAP8[r6+28|0]|0)!=0){r5=HEAP32[r6+32>>2];if(r5>>>0<=r2>>>0?HEAP32[r6+36>>2]>>>0>=r2>>>0:0){r7=r6;r8=r5;r3=12}else{r3=5}}else{r3=5}}else{r3=5}L5:do{if(r3==5){r5=HEAP32[r1>>2];if((r5|0)!=0){r6=0;r9=HEAP32[r1+4>>2];while(1){r10=HEAP32[r9>>2];if((HEAP8[r10+28|0]|0)!=0){r11=HEAP32[r10+32>>2];if(r11>>>0<=r2>>>0?HEAP32[r10+36>>2]>>>0>=r2>>>0:0){break}}r12=r6+1|0;if(r12>>>0<r5>>>0){r6=r12;r9=r9+8|0}else{break L5}}HEAP32[r4>>2]=r9;r7=r10;r8=r11;r3=12}}}while(0);if(r3==12){if((r7|0)!=0){r3=r2-r8|0;r8=HEAP32[r7>>2];if((r8|0)==0){r13=HEAP8[HEAP32[r7+44>>2]+r3|0];return r13}else{r13=FUNCTION_TABLE[r8](HEAP32[r7+24>>2],r3);return r13}}}r3=HEAP32[r1+28>>2];if((r3|0)==0){r13=HEAP32[r1+52>>2]&255;return r13}else{r13=FUNCTION_TABLE[r3](HEAP32[r1+24>>2],r2);return r13}}function _mem_get_uint16_be(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=r1+12|0;r5=HEAP32[r4>>2];if((r5|0)!=0){r6=HEAP32[r5>>2];if((HEAP8[r6+28|0]|0)!=0){r5=HEAP32[r6+32>>2];if(r5>>>0<=r2>>>0){r7=HEAP32[r6+36>>2];if(r7>>>0>=r2>>>0){r8=r6;r9=r7;r10=r5;r3=12}else{r3=5}}else{r3=5}}else{r3=5}}else{r3=5}L5:do{if(r3==5){r5=HEAP32[r1>>2];if((r5|0)!=0){r7=0;r6=HEAP32[r1+4>>2];while(1){r11=HEAP32[r6>>2];if((HEAP8[r11+28|0]|0)!=0){r12=HEAP32[r11+32>>2];if(r12>>>0<=r2>>>0){r13=HEAP32[r11+36>>2];if(r13>>>0>=r2>>>0){break}}}r14=r7+1|0;if(r14>>>0<r5>>>0){r7=r14;r6=r6+8|0}else{break L5}}HEAP32[r4>>2]=r6;r8=r11;r9=r13;r10=r12;r3=12}}}while(0);if(r3==12){if((r8|0)!=0){r3=r2+1|0;if(r3>>>0>r9>>>0){r9=(_mem_get_uint8(r1,r2)&255)<<8;r15=r9|_mem_get_uint8(r1,r3)&255;return r15}r3=r2-r10|0;r10=HEAP32[r8+4>>2];if((r10|0)==0){r9=HEAP32[r8+44>>2];r15=HEAPU8[r9+r3|0]<<8|HEAPU8[r9+(r3+1)|0];return r15}else{r15=FUNCTION_TABLE[r10](HEAP32[r8+24>>2],r3);return r15}}}r3=HEAP32[r1+32>>2];if((r3|0)==0){r15=HEAP32[r1+52>>2]&65535;return r15}else{r15=FUNCTION_TABLE[r3](HEAP32[r1+24>>2],r2);return r15}}function _mem_get_uint32_be(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=r1+12|0;r5=HEAP32[r4>>2];if((r5|0)!=0){r6=HEAP32[r5>>2];if((HEAP8[r6+28|0]|0)!=0){r5=HEAP32[r6+32>>2];if(r5>>>0<=r2>>>0){r7=HEAP32[r6+36>>2];if(r7>>>0>=r2>>>0){r8=r6;r9=r7;r10=r5;r3=12}else{r3=5}}else{r3=5}}else{r3=5}}else{r3=5}L5:do{if(r3==5){r5=HEAP32[r1>>2];if((r5|0)!=0){r7=0;r6=HEAP32[r1+4>>2];while(1){r11=HEAP32[r6>>2];if((HEAP8[r11+28|0]|0)!=0){r12=HEAP32[r11+32>>2];if(r12>>>0<=r2>>>0){r13=HEAP32[r11+36>>2];if(r13>>>0>=r2>>>0){break}}}r14=r7+1|0;if(r14>>>0<r5>>>0){r7=r14;r6=r6+8|0}else{break L5}}HEAP32[r4>>2]=r6;r8=r11;r9=r13;r10=r12;r3=12}}}while(0);if(r3==12){if((r8|0)!=0){r3=r2+3|0;if(r3>>>0>r9>>>0){r9=(_mem_get_uint8(r1,r2)&255)<<24;r12=(_mem_get_uint8(r1,r2+1|0)&255)<<16|r9;r9=r12|(_mem_get_uint8(r1,r2+2|0)&255)<<8;r15=r9|_mem_get_uint8(r1,r3)&255;return r15}r3=r2-r10|0;r10=HEAP32[r8+8>>2];if((r10|0)==0){r9=HEAP32[r8+44>>2];r15=HEAPU8[r9+(r3+1)|0]<<16|HEAPU8[r9+r3|0]<<24|HEAPU8[r9+(r3+2)|0]<<8|HEAPU8[r9+(r3+3)|0];return r15}else{r15=FUNCTION_TABLE[r10](HEAP32[r8+24>>2],r3);return r15}}}r3=HEAP32[r1+36>>2];if((r3|0)==0){r15=HEAP32[r1+52>>2];return r15}else{r15=FUNCTION_TABLE[r3](HEAP32[r1+24>>2],r2);return r15}}function _mem_set_uint8_rw(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;r5=r1+8|0;r6=HEAP32[r5>>2];if((r6|0)!=0){r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)!=0){r6=HEAP32[r7+32>>2];if(r6>>>0<=r2>>>0?HEAP32[r7+36>>2]>>>0>=r2>>>0:0){r8=r7;r9=r6;r4=12}else{r4=5}}else{r4=5}}else{r4=5}L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)!=0){r7=0;r10=HEAP32[r1+4>>2];while(1){r11=HEAP32[r10>>2];if((HEAP8[r11+28|0]|0)!=0){r12=HEAP32[r11+32>>2];if(r12>>>0<=r2>>>0?HEAP32[r11+36>>2]>>>0>=r2>>>0:0){break}}r13=r7+1|0;if(r13>>>0<r6>>>0){r7=r13;r10=r10+8|0}else{break L5}}HEAP32[r5>>2]=r10;r8=r11;r9=r12;r4=12}}}while(0);if(r4==12){if((r8|0)!=0){r4=r2-r9|0;r9=HEAP32[r8+12>>2];if((r9|0)==0){HEAP8[HEAP32[r8+44>>2]+r4|0]=r3;return}else{FUNCTION_TABLE[r9](HEAP32[r8+24>>2],r4,r3);return}}}r4=HEAP32[r1+40>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+24>>2],r2,r3);return}function _mem_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;r5=r1+16|0;r6=HEAP32[r5>>2];if((r6|0)!=0){r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)!=0){r6=HEAP32[r7+32>>2];if(r6>>>0<=r2>>>0?HEAP32[r7+36>>2]>>>0>=r2>>>0:0){r8=r7;r9=r6;r4=12}else{r4=5}}else{r4=5}}else{r4=5}L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)!=0){r7=0;r10=HEAP32[r1+4>>2];while(1){r11=HEAP32[r10>>2];if((HEAP8[r11+28|0]|0)!=0){r12=HEAP32[r11+32>>2];if(r12>>>0<=r2>>>0?HEAP32[r11+36>>2]>>>0>=r2>>>0:0){break}}r13=r7+1|0;if(r13>>>0<r6>>>0){r7=r13;r10=r10+8|0}else{break L5}}HEAP32[r5>>2]=r10;r8=r11;r9=r12;r4=12}}}while(0);if(r4==12){if((r8|0)!=0){if((HEAP8[r8+29|0]|0)!=0){return}r4=r2-r9|0;r9=HEAP32[r8+12>>2];if((r9|0)==0){HEAP8[HEAP32[r8+44>>2]+r4|0]=r3;return}else{FUNCTION_TABLE[r9](HEAP32[r8+24>>2],r4,r3);return}}}r4=HEAP32[r1+40>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+24>>2],r2,r3);return}function _mem_set_uint16_be(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=r1+16|0;r6=HEAP32[r5>>2];if((r6|0)!=0){r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)!=0){r6=HEAP32[r7+32>>2];if(r6>>>0<=r2>>>0){r8=HEAP32[r7+36>>2];if(r8>>>0>=r2>>>0){r9=r7;r10=r8;r11=r6;r4=12}else{r4=5}}else{r4=5}}else{r4=5}}else{r4=5}L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)!=0){r8=0;r7=HEAP32[r1+4>>2];while(1){r12=HEAP32[r7>>2];if((HEAP8[r12+28|0]|0)!=0){r13=HEAP32[r12+32>>2];if(r13>>>0<=r2>>>0){r14=HEAP32[r12+36>>2];if(r14>>>0>=r2>>>0){break}}}r15=r8+1|0;if(r15>>>0<r6>>>0){r8=r15;r7=r7+8|0}else{break L5}}HEAP32[r5>>2]=r7;r9=r12;r10=r14;r11=r13;r4=12}}}while(0);if(r4==12){if((r9|0)!=0){r4=r2+1|0;if(r4>>>0>r10>>>0){_mem_set_uint8(r1,r2,(r3&65535)>>>8&255);_mem_set_uint8(r1,r4,r3&255);return}if((HEAP8[r9+29|0]|0)!=0){return}r4=r2-r11|0;r11=HEAP32[r9+16>>2];if((r11|0)==0){r10=r9+44|0;HEAP8[HEAP32[r10>>2]+r4|0]=(r3&65535)>>>8;HEAP8[HEAP32[r10>>2]+(r4+1)|0]=r3;return}else{FUNCTION_TABLE[r11](HEAP32[r9+24>>2],r4,r3);return}}}r4=HEAP32[r1+44>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+24>>2],r2,r3);return}function _mem_set_uint32_be(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=r1+16|0;r6=HEAP32[r5>>2];if((r6|0)!=0){r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)!=0){r6=HEAP32[r7+32>>2];if(r6>>>0<=r2>>>0){r8=HEAP32[r7+36>>2];if(r8>>>0>=r2>>>0){r9=r7;r10=r8;r11=r6;r4=12}else{r4=5}}else{r4=5}}else{r4=5}}else{r4=5}L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)!=0){r8=0;r7=HEAP32[r1+4>>2];while(1){r12=HEAP32[r7>>2];if((HEAP8[r12+28|0]|0)!=0){r13=HEAP32[r12+32>>2];if(r13>>>0<=r2>>>0){r14=HEAP32[r12+36>>2];if(r14>>>0>=r2>>>0){break}}}r15=r8+1|0;if(r15>>>0<r6>>>0){r8=r15;r7=r7+8|0}else{break L5}}HEAP32[r5>>2]=r7;r9=r12;r10=r14;r11=r13;r4=12}}}while(0);if(r4==12){if((r9|0)!=0){r4=r2+3|0;if(r4>>>0>r10>>>0){_mem_set_uint8(r1,r2,r3>>>24&255);_mem_set_uint8(r1,r2+1|0,r3>>>16&255);_mem_set_uint8(r1,r2+2|0,r3>>>8&255);_mem_set_uint8(r1,r4,r3&255);return}if((HEAP8[r9+29|0]|0)!=0){return}r4=r2-r11|0;r11=HEAP32[r9+20>>2];if((r11|0)==0){r10=r9+44|0;HEAP8[HEAP32[r10>>2]+r4|0]=r3>>>24;HEAP8[HEAP32[r10>>2]+(r4+1)|0]=r3>>>16;HEAP8[HEAP32[r10>>2]+(r4+2)|0]=r3>>>8;HEAP8[HEAP32[r10>>2]+(r4+3)|0]=r3;return}else{FUNCTION_TABLE[r11](HEAP32[r9+24>>2],r4,r3);return}}}r4=HEAP32[r1+48>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+24>>2],r2,r3);return}function _dsk_psi_read_chs(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12;r8=HEAP32[r1+68>>2];if((r8|0)==0){HEAP32[r3>>2]=0;r9=1;return r9}r1=_psi_img_get_sector(r8,r4,r5,r6,r7);if((r1|0)==0){HEAP32[r3>>2]=0;r9=1;return r9}r7=r1+20|0;r6=_psi_sct_get_alternate(r1,HEAP32[r7>>2]);if((r6|0)==0){HEAP32[r7>>2]=0;r10=r1}else{r10=r6}r6=HEAP32[r3>>2];r5=HEAPU16[r10+10>>1];if(r6>>>0>r5>>>0){HEAP32[r3>>2]=r5;r11=32;r12=r5}else{r11=0;r12=r6}if((r12|0)!=0){_memcpy(r2,HEAP32[r10+24>>2],r12)|0}r12=HEAP32[r10+12>>2];r10=r12<<2;r2=r12>>>2&2|r11|r10&4|r10&8|r10&16;if((HEAP32[r1>>2]|0)==0){r9=r2;return r9}HEAP32[r7>>2]=HEAP32[r7>>2]+1;r9=r2;return r9}function _dsk_psi_read_tags(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10;_memset(r2,0,r3)|0;r8=HEAP32[r1+68>>2];if((r8|0)==0){r9=0;return r9}r1=_psi_img_get_sector(r8,r4,r5,r6,r7);if((r1|0)==0){r9=0;return r9}r7=r1+20|0;r6=_psi_sct_get_alternate(r1,HEAP32[r7>>2]);if((r6|0)==0){HEAP32[r7>>2]=0;r10=r1}else{r10=r6}r9=_psi_sct_get_tags(r10,r2,r3);return r9}function _dsk_psi_write_chs(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12;r8=HEAP32[r1+68>>2];if((r8|0)==0){HEAP32[r3>>2]=0;r9=1;return r9}if((HEAP8[r1+56|0]|0)!=0){r9=64;return r9}r10=_psi_img_get_sector(r8,r4,r5,r6,r7);if((r10|0)==0){HEAP32[r3>>2]=0;r9=1;return r9}r7=r10+12|0;if((HEAP32[r7>>2]&8|0)!=0){r9=2;return r9}HEAP8[r1+72|0]=1;r1=HEAP32[r3>>2];r6=HEAPU16[r10+10>>1];if(r1>>>0>r6>>>0){HEAP32[r3>>2]=r6;r11=32;r12=r6}else{r11=0;r12=r1}if((r12|0)!=0){_memcpy(HEAP32[r10+24>>2],r2,r12)|0}HEAP32[r7>>2]=HEAP32[r7>>2]&-3;r7=r10|0;r12=HEAP32[r7>>2];if((r12|0)==0){r9=r11;return r9}_psi_sct_del(r12);HEAP32[r7>>2]=0;HEAP32[r10+20>>2]=0;r9=r11;return r9}function _dsk_psi_write_tags(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10;r8=HEAP32[r1+68>>2];if((r8|0)!=0?(HEAP8[r1+56|0]|0)==0:0){r9=_psi_img_get_sector(r8,r4,r5,r6,r7);if((r9|0)!=0){HEAP8[r1+72|0]=1;r10=_psi_sct_set_tags(r9,r2,r3)}else{r10=0}}else{r10=0}return r10}function _dsk_psi_erase_disk(r1){var r2,r3;r2=HEAP32[r1+68>>2];if((r2|0)==0){r3=1;return r3}if((HEAP8[r1+56|0]|0)!=0){r3=1;return r3}_psi_img_erase(r2);HEAP32[r1+28>>2]=0;HEAP8[r1+72|0]=1;r3=0;return r3}function _dsk_psi_set_encoding(r1,r2){HEAP32[r1+76>>2]=r2;return}function _dsk_psi_format_sector(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11;r9=HEAP32[r1+68>>2];if((r9|0)==0){r10=1;return r10}if((HEAP8[r1+56|0]|0)!=0){r10=1;return r10}r11=_psi_img_get_track(r9,r2,r3,1);if((r11|0)==0){r10=1;return r10}HEAP8[r1+72|0]=1;r3=_psi_sct_new(r4,r5,r6,r7);if((r3|0)==0){r10=1;return r10}_psi_sct_fill(r3,r8);if((_psi_trk_add_sector(r11,r3)|0)==0){_psi_sct_set_encoding(r3,HEAP32[r1+76>>2]);r11=r1+28|0;HEAP32[r11>>2]=HEAP32[r11>>2]+1;r10=0;return r10}else{_psi_sct_del(r3);r10=1;return r10}}function _dsk_psi_open_fp(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=_malloc(88);if((r4|0)==0){r5=0;return r5}r6=r4;_dsk_init(r6,r4,0,0,0,0);_dsk_set_type(r6,6);_dsk_set_readonly(r6,r3);HEAP32[r4+4>>2]=770;HEAP32[r4+8>>2]=846;HEAP32[r4+12>>2]=32;HEAP32[r4+20>>2]=306;HEAP8[r4+72|0]=0;HEAP32[r4+76>>2]=2;HEAP32[r4+80>>2]=r2;HEAP32[r4+84>>2]=0;r3=_psi_load_fp(r1,r2);HEAP32[r4+68>>2]=r3;if((r3|0)==0){_dsk_psi_del(r6);r5=0;return r5}r4=HEAP16[r3>>1];r2=r4&65535;if(r4<<16>>16==0){r5=r6;return r5}r4=HEAP32[r3+4>>2];r3=0;r1=0;r7=0;while(1){r8=HEAP32[r4+(r7<<2)>>2];r9=HEAP16[r8+2>>1];r10=r9&65535;r11=r10+r3|0;if(r9<<16>>16==0){r12=r1}else{r9=HEAP32[r8+4>>2];r8=r1;r13=0;while(1){r14=HEAPU16[HEAP32[r9+(r13<<2)>>2]+2>>1]+r8|0;r15=r13+1|0;if(r15>>>0<r10>>>0){r8=r14;r13=r15}else{r12=r14;break}}}r13=r7+1|0;if(r13>>>0<r2>>>0){r3=r11;r1=r12;r7=r13}else{break}}if((r11|0)==0|(r12|0)==0){r5=r6;return r5}r7=(((((r11>>>0)/(r2>>>0)&-1)>>>1)+r11|0)>>>0)/(r2>>>0)&-1;r1=(((((r12>>>0)/(r11>>>0)&-1)>>>1)+r12|0)>>>0)/(r11>>>0)&-1;if((_dsk_set_geometry(r6,r12,r2,r7,r1)|0)!=0){r5=r6;return r5}_dsk_set_visible_chs(r6,r2,r7,r1);r5=r6;return r5}function _dsk_psi_del(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;r4=HEAP32[r1+64>>2];do{if((HEAP8[r4+72|0]|0)!=0){r5=HEAP32[_stderr>>2];r6=r1+24|0;_fprintf(r5,42760,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r6>>2],r2));STACKTOP=r2;r7=r4+84|0;if((HEAP32[r7>>2]|0)!=0){r8=r4+68|0;if(((HEAP32[r8>>2]|0)!=0?(_dsk_get_readonly(r4)|0)==0:0)?(_psi_save(HEAP32[r7>>2],HEAP32[r8>>2],HEAP32[r4+80>>2])|0)==0:0){break}}_fprintf(r5,39624,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r6>>2],r2));STACKTOP=r2}}while(0);r2=HEAP32[r4+68>>2];if((r2|0)==0){r9=r4+84|0;r10=r9;r11=HEAP32[r10>>2];_free(r11);_free(r4);STACKTOP=r3;return}_psi_img_del(r2);r9=r4+84|0;r10=r9;r11=HEAP32[r10>>2];_free(r11);_free(r4);STACKTOP=r3;return}function _dsk_psi_read(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r6;r8=r6+8;r9=r6+16;r10=r6+24;r11=HEAP32[r1+64>>2];r1=r11;r12=r11+68|0;if((r4|0)==0){r13=0;STACKTOP=r6;return r13}else{r14=r3;r15=r4;r16=r2}while(1){if((_psi_img_map_sector(HEAP32[r12>>2],r14,r7,r8,r9)|0)!=0){r13=1;r5=5;break}HEAP32[r10>>2]=512;r2=(_dsk_psi_read_chs(r1,r16,r10,HEAP32[r7>>2],HEAP32[r8>>2],HEAP32[r9>>2],1)|0)==0;if(!(r2&(HEAP32[r10>>2]|0)==512)){r13=1;r5=5;break}r2=r15-1|0;if((r2|0)==0){r13=0;r5=5;break}else{r14=r14+1|0;r15=r2;r16=r16+512|0}}if(r5==5){STACKTOP=r6;return r13}}function _dsk_psi_write(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+24|0;r7=r6;r8=r6+8;r9=r6+16;if((HEAP8[r1+56|0]|0)!=0){r10=1;STACKTOP=r6;return r10}r11=HEAP32[r1+64>>2];r1=r11+68|0;r12=r11+56|0;if((r4|0)==0){r10=0;STACKTOP=r6;return r10}r13=r11+72|0;r11=r3;r3=r4;r4=r2;while(1){if((_psi_img_map_sector(HEAP32[r1>>2],r11,r7,r8,r9)|0)!=0){r10=1;r5=16;break}r2=HEAP32[r1>>2];if((r2|0)==0){r10=1;r5=16;break}if((HEAP8[r12]|0)!=0){r10=1;r5=16;break}r14=_psi_img_get_sector(r2,HEAP32[r7>>2],HEAP32[r8>>2],HEAP32[r9>>2],1);if((r14|0)==0){r10=1;r5=16;break}r2=r14+12|0;if((HEAP32[r2>>2]&8|0)!=0){r10=1;r5=16;break}HEAP8[r13]=1;r15=HEAP16[r14+10>>1];if((r15&65535)<512){if(r15<<16>>16==0){r16=0;r17=32}else{r18=r15&65535;r19=32;r5=11}}else{r18=512;r19=0;r5=11}if(r5==11){r5=0;_memcpy(HEAP32[r14+24>>2],r4,r18)|0;r16=r18;r17=r19}HEAP32[r2>>2]=HEAP32[r2>>2]&-3;r2=r14|0;r15=HEAP32[r2>>2];if((r15|0)!=0){_psi_sct_del(r15);HEAP32[r2>>2]=0;HEAP32[r14+20>>2]=0}if(!((r17|0)==0&(r16|0)==512)){r10=1;r5=16;break}r14=r3-1|0;if((r14|0)==0){r10=0;r5=16;break}else{r11=r11+1|0;r3=r14;r4=r4+512|0}}if(r5==16){STACKTOP=r6;return r10}}function _dsk_psi_set_msg(r1,r2,r3){var r4;r3=HEAP32[r1+64>>2];if((_strcmp(r2,46312)|0)!=0){r4=1;return r4}r2=r3+84|0;if((HEAP32[r2>>2]|0)==0){r4=1;return r4}r1=r3+68|0;if((HEAP32[r1>>2]|0)==0){r4=1;return r4}if((_dsk_get_readonly(r3)|0)!=0){r4=1;return r4}if((_psi_save(HEAP32[r2>>2],HEAP32[r1>>2],HEAP32[r3+80>>2])|0)!=0){r4=1;return r4}HEAP8[r3+72|0]=0;r4=0;return r4}function _dsk_psi_open(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;if((r2|0)==0){r5=_psi_probe(r1);if((r5|0)==0){r6=_psi_guess_type(r1);if((r6|0)==0){r7=0;return r7}else{r8=r6}}else{r8=r5}}else{r8=r2}if((r3|0)==0){r2=_fopen(r1,57008);if((r2|0)==0){r9=_fopen(r1,55432);r10=1;r4=8}else{r11=0;r12=r2}}else{r9=_fopen(r1,55432);r10=r3;r4=8}if(r4==8){if((r9|0)==0){r7=0;return r7}else{r11=r10;r12=r9}}r9=_dsk_psi_open_fp(r12,r8,r11);_fclose(r12);if((r9|0)==0){r7=0;return r7}r12=HEAP32[r9+64>>2];r11=_malloc(_strlen(r1)+1|0);HEAP32[r12+84>>2]=r11;if((r11|0)!=0){_strcpy(r11,r1)}_dsk_set_fname(r9,r1);r7=r9;return r7}function _dsk_psi_probe(r1){return _psi_probe(r1)}function _dsk_get_uint32_be(r1,r2){return((HEAPU8[r1+r2|0]<<8|HEAPU8[r1+(r2+1)|0])<<8|HEAPU8[r1+(r2+2)|0])<<8|HEAPU8[r1+(r2+3)|0]}function _dsk_set_uint32_be(r1,r2,r3){HEAP8[r1+r2|0]=r3>>>24;HEAP8[r1+(r2+1)|0]=r3>>>16;HEAP8[r1+(r2+2)|0]=r3>>>8;HEAP8[r1+(r2+3)|0]=r3;return}function _dsk_get_uint32_le(r1,r2){return((HEAPU8[r1+(r2+3)|0]<<8|HEAPU8[r1+(r2+2)|0])<<8|HEAPU8[r1+(r2+1)|0])<<8|HEAPU8[r1+r2|0]}function _dsk_get_uint64_le(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=HEAPU8[r1+(r2+7)|0];r4=r3<<8|0>>>24|HEAPU8[r1+(r2+6)|0];r5=r4<<8|0>>>24|HEAPU8[r1+(r2+5)|0];r6=r5<<8|0>>>24|HEAPU8[r1+(r2+4)|0];r7=r6<<8|0>>>24|HEAPU8[r1+(r2+3)|0];r8=r7<<8|0>>>24|HEAPU8[r1+(r2+2)|0];r9=r8<<8|0>>>24|HEAPU8[r1+(r2+1)|0];return tempRet0=((((((0<<8|r3>>>24)<<8|r4>>>24)<<8|r5>>>24)<<8|r6>>>24)<<8|r7>>>24)<<8|r8>>>24)<<8|r9>>>24|0,r9<<8|0>>>24|HEAPU8[r1+r2|0]}function _dsk_set_uint32_le(r1,r2,r3){HEAP8[r1+r2|0]=r3;HEAP8[r1+(r2+1)|0]=r3>>>8;HEAP8[r1+(r2+2)|0]=r3>>>16;HEAP8[r1+(r2+3)|0]=r3>>>24;return}function _dsk_set_uint64_le(r1,r2,r3,r4){HEAP8[r1+r2|0]=r3;HEAP8[r1+(r2+1)|0]=r3>>>8|r4<<24;HEAP8[r1+(r2+2)|0]=r3>>>16|r4<<16;HEAP8[r1+(r2+3)|0]=r3>>>24|r4<<8;HEAP8[r1+(r2+4)|0]=r4;HEAP8[r1+(r2+5)|0]=r4>>>8|0<<24;HEAP8[r1+(r2+6)|0]=r4>>>16|0<<16;HEAP8[r1+(r2+7)|0]=r4>>>24|0<<8;return}function _dsk_read(r1,r2,r3,r4,r5,r6){var r7,r8;if((_fseek(r1,r3,0)|0)!=0){r7=1;return r7}r3=_fread(r2,1,r5,r1);r1=r3;r4=0;if(!(r4>>>0<r6>>>0|r4>>>0==r6>>>0&r1>>>0<r5>>>0)){r7=0;return r7}r8=_i64Subtract(r5,r6,r1,r4);_memset(r2+r3|0,0,r8)|0;r7=0;return r7}function _dsk_write(r1,r2,r3,r4,r5,r6){var r7;if((_fseek(r1,r3,0)|0)!=0){r7=1;return r7}r7=((_fwrite(r2,1,r5,r1)|0)!=(r5|0)|0!=(r6|0))&1;return r7}function _dsk_get_filesize(r1,r2){var r3,r4;if((_fseek(r1,0,2)|0)!=0){r3=1;return r3}r4=_ftell(r1);if((r4|0)==-1){r3=1;return r3}HEAP32[r2>>2]=r4;HEAP32[r2+4>>2]=(r4|0)<0|0?-1:0;r3=0;return r3}function _dsk_set_filesize(r1,r2,r3){_fflush(r1);return(_ftruncate(_fileno(r1),r2)|0)!=0|0}function _dsk_init(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13;r7=0;r8=r1;HEAP32[r8>>2]=0;HEAP32[r8+4>>2]=0;HEAP32[r8+8>>2]=0;HEAP32[r8+12>>2]=0;HEAP32[r8+16>>2]=0;HEAP32[r8+20>>2]=0;HEAP32[r8+24>>2]=0;if((r3|0)==0){r8=Math_imul(Math_imul(r5,r4)|0,r6)|0;if((r8|0)==0){r9=r6;r10=r5;r11=r4;r12=0}else{r13=r8;r7=3}}else{r13=r3;r7=3}do{if(r7==3){if((r4|0)==0){r3=(r6|0)==0?63:r6;r8=(r5|0)==0?16:r5;r9=r3;r10=r8;r11=(r13>>>0)/((Math_imul(r3,r8)|0)>>>0)&-1;r12=r13;break}r8=(r6|0)==0;if((r5|0)==0){r3=r8?63:r6;r9=r3;r10=(r13>>>0)/((Math_imul(r3,r4)|0)>>>0)&-1;r11=r4;r12=r13;break}if(r8){r9=(r13>>>0)/((Math_imul(r5,r4)|0)>>>0)&-1;r10=r5;r11=r4;r12=r13}else{r9=r6;r10=r5;r11=r4;r12=r13}}}while(0);HEAP32[r1+28>>2]=r12;HEAP32[r1+32>>2]=r11;HEAP32[r1+36>>2]=r10;HEAP32[r1+40>>2]=r9;HEAP32[r1+44>>2]=r11;HEAP32[r1+48>>2]=r10;HEAP32[r1+52>>2]=r9;HEAP8[r1+56|0]=0;HEAP32[r1+60>>2]=0;HEAP32[r1+64>>2]=r2;return}function _dsk_del(r1){var r2;if((r1|0)==0){return}_free(HEAP32[r1+60>>2]);r2=HEAP32[r1+4>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](r1);return}function _dsk_set_drive(r1,r2){HEAP32[r1+24>>2]=r2;return}function _dsk_get_type(r1){return HEAP32[r1>>2]}function _dsk_set_type(r1,r2){HEAP32[r1>>2]=r2;return}function _dsk_get_readonly(r1){return(HEAP8[r1+56|0]|0)!=0|0}function _dsk_set_readonly(r1,r2){HEAP8[r1+56|0]=(r2|0)!=0|0;return}function _dsk_set_fname(r1,r2){var r3;r3=r1+60|0;r1=HEAP32[r3>>2];if((r1|0)!=0){_free(r1)}if((r2|0)==0){HEAP32[r3>>2]=0;return}r1=_malloc(_strlen(r2)+1|0);HEAP32[r3>>2]=r1;if((r1|0)==0){return}_strcpy(r1,r2);return}function _dsk_set_geometry(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;if((r2|0)==0){r6=Math_imul(Math_imul(r4,r3)|0,r5)|0;if((r6|0)==0){r7=1;return r7}else{r8=r6}}else{r8=r2}do{if((r3|0)!=0){r2=(r5|0)==0;if((r4|0)==0){r6=r2?63:r5;r9=r6;r10=r3;r11=(r8>>>0)/((Math_imul(r6,r3)|0)>>>0)&-1;break}if(r2){r9=(r8>>>0)/((Math_imul(r4,r3)|0)>>>0)&-1;r10=r3;r11=r4}else{r9=r5;r10=r3;r11=r4}}else{r2=(r5|0)==0?63:r5;r6=(r4|0)==0?16:r4;r9=r2;r10=(r8>>>0)/((Math_imul(r2,r6)|0)>>>0)&-1;r11=r6}}while(0);HEAP32[r1+28>>2]=r8;HEAP32[r1+32>>2]=r10;HEAP32[r1+36>>2]=r11;HEAP32[r1+40>>2]=r9;r7=0;return r7}function _dsk_set_visible_chs(r1,r2,r3,r4){HEAP32[r1+44>>2]=r2;HEAP32[r1+48>>2]=r3;HEAP32[r1+52>>2]=r4;return}function _dsk_get_drive(r1){return HEAP32[r1+24>>2]}function _dsk_get_block_cnt(r1){return HEAP32[r1+28>>2]}function _dsk_guess_geometry(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+512|0;r4=r3;r5=r4|0;r6=512;r7=0;r8=r1+8|0;r9=HEAP32[r8>>2];r10=(r9|0)==0;L1:do{if(!r10){r11=FUNCTION_TABLE[r9](r1,r5,0,1);r12=(r11|0)==0;if(r12){r13=r4+510|0;r14=HEAP8[r13];r15=r14<<24>>24==85;if(r15){r16=r4+511|0;r17=HEAP8[r16];r18=r17<<24>>24==-86;if(r18){r19=0;r20=0;r21=0;r22=0;while(1){r23=r20<<4;r24=r23+446|0;r25=r4+r24|0;r26=HEAP8[r25];r27=r26&127;r28=r27<<24>>24==0;do{if(r28){r29=r23+449|0;r30=r4+r29|0;r31=HEAP8[r30];r32=r31&255;r33=r23+448|0;r34=r4+r33|0;r35=HEAP8[r34];r36=r35&255;r37=r36<<2;r38=r37&768;r39=r38|r32;r40=r23+447|0;r41=r4+r40|0;r42=HEAP8[r41];r43=r36&63;r44=r23+454|0;r45=r4+r44|0;r46=r23+457|0;r47=r4+r46|0;r48=HEAP8[r47];r49=r48&255;r50=r49<<8;r51=r23+456|0;r52=r4+r51|0;r53=HEAP8[r52];r54=r53&255;r55=r50|r54;r56=r55<<8;r57=r23+455|0;r58=r4+r57|0;r59=HEAP8[r58];r60=r59&255;r61=r56|r60;r62=r61<<8;r63=HEAP8[r45];r64=r63&255;r65=r62|r64;r66=r23+453|0;r67=r4+r66|0;r68=HEAP8[r67];r69=r68&255;r70=r23+452|0;r71=r4+r70|0;r72=HEAP8[r71];r73=r72&255;r74=r73<<2;r75=r74&768;r76=r75|r69;r77=r23+451|0;r78=r4+r77|0;r79=HEAP8[r78];r80=r73&63;r81=r23+458|0;r82=r4+r81|0;r83=r23+461|0;r84=r4+r83|0;r85=HEAP8[r84];r86=r85&255;r87=r86<<8;r88=r23+460|0;r89=r4+r88|0;r90=HEAP8[r89];r91=r90&255;r92=r87|r91;r93=r92<<8;r94=r23+459|0;r95=r4+r94|0;r96=HEAP8[r95];r97=r96&255;r98=r93|r97;r99=r98<<8;r100=HEAP8[r82];r101=r100&255;r102=r99|r101;r103=(r43|0)==0;r104=(r80|0)==0;r105=r103|r104;r106=(r65|0)==0;r107=r105|r106;r108=(r102|0)==0;r109=r107|r108;if(!r109){r110=r43-1|0;r111=r80-1|0;r112=r65-1|0;r113=r112+r102|0;r114=r65>>>0>r110>>>0;r115=r113>>>0>r111>>>0;r116=r114&r115;if(r116){r117=r39;r118=0;r119=r113-r111|0;r120=r119;r121=0;r122=r76;r123=0;r124=r79&255;r125=0;r126=___muldi3(r124,r125,r117,r118);r127=tempRet0;r128=r42&255;r129=0;r130=___muldi3(r122,r123,r128,r129);r131=tempRet0;r132=(r126|0)==(r130|0)&(r127|0)==(r131|0);if(!r132){r133=r65-r110|0;r134=r133;r135=0;r136=___muldi3(r122,r123,r134,r135);r137=tempRet0;r138=___muldi3(r120,r121,r117,r118);r139=tempRet0;r140=_i64Subtract(r126,r127,r130,r131);r141=tempRet0;r142=_i64Subtract(r138,r139,r136,r137);r143=tempRet0;r144=___divdi3(r142,r143,r140,r141);r145=tempRet0;r146=r144;r147=r146;r148=-1;r149=0;r150=r144&r148;r151=r145&r149;r152=___muldi3(r150,r151,r122,r123);r153=tempRet0;r154=0;r155=0;r156=(r152|0)==(r154|0)&(r153|0)==(r155|0);if(!r156){r157=___muldi3(r150,r151,r124,r125);r158=tempRet0;r159=_i64Subtract(r120,r121,r157,r158);r160=tempRet0;r161=___divdi3(r159,r160,r152,r153);r162=tempRet0;r163=r161;r164=r163;r165=(r164|0)==0;if(r165){r166=r22;r167=r21;r168=0;break}r169=(r147|0)==0;if(r169){r166=r22;r167=r21;r168=r164;break}else{r170=r164}}else{r170=r19}r171=(r21|0)==0;r172=(r21|0)==(r170|0);r173=r171|r172;if(!r173){break L1}r174=(r22|0)==0;r175=(r22|0)==(r147|0);r176=r174|r175;if(r176){r166=r147;r167=r170;r168=r170}else{break L1}}else{r166=r22;r167=r21;r168=r19}}else{r166=r22;r167=r21;r168=r19}}else{r166=r22;r167=r21;r168=r19}}else{r166=r22;r167=r21;r168=r19}}while(0);r177=r20+1|0;r178=r177>>>0<4;if(r178){r19=r168;r20=r177;r21=r167;r22=r166}else{break}}r179=(r167|0)==0;r180=(r166|0)==0;r181=r179|r180;if(!r181){r182=r1+28|0;r183=HEAP32[r182>>2];r184=Math_imul(r166,r167)|0;r185=(r183>>>0)/(r184>>>0)&-1;r186=(r183|0)==0;if(r186){r187=Math_imul(r185,r184)|0;r188=(r187|0)==0;if(r188){STACKTOP=r3;return 0}else{r189=r187}}else{r189=r183}r190=(r185|0)==0;if(r190){r191=(r189>>>0)/(r184>>>0)&-1;r192=r191}else{r192=r185}HEAP32[r182>>2]=r189;r193=r1+32|0;HEAP32[r193>>2]=r192;r194=r1+36|0;HEAP32[r194>>2]=r167;r195=r1+40|0;HEAP32[r195>>2]=r166;STACKTOP=r3;return 0}}}}}}while(0);r196=512;r197=0;r198=512;r199=0;r200=HEAP32[r8>>2];r201=(r200|0)==0;if(!r201){r202=FUNCTION_TABLE[r200](r1,r5,0,1);r203=(r202|0)==0;if(r203){r204=r4+510|0;r205=HEAP8[r204];r206=r205<<24>>24==85;if(r206){r207=r4+511|0;r208=HEAP8[r207];r209=r208<<24>>24==-86;if(r209){r210=r4+11|0;r211=r4+12|0;r212=HEAP8[r211];r213=r212&255;r214=r213<<8;r215=HEAP8[r210];r216=r215&255;r217=r214|r216;r218=r217<<16>>16==512;if(r218){r219=r4+26|0;r220=r4+27|0;r221=HEAP8[r220];r222=r221&255;r223=r222<<8;r224=HEAP8[r219];r225=r224&255;r226=r223|r225;r227=r226&65535;r228=r4+24|0;r229=r4+25|0;r230=HEAP8[r229];r231=r230&255;r232=r231<<8;r233=HEAP8[r228];r234=r233&255;r235=r232|r234;r236=r235&65535;r237=r226<<16>>16==0;r238=(r226&65535)>255;r239=r237|r238;if(!r239){r240=r235<<16>>16==0;r241=(r235&65535)>255;r242=r240|r241;if(!r242){r243=r1+28|0;r244=HEAP32[r243>>2];r245=Math_imul(r236,r227)|0;r246=(r244>>>0)/(r245>>>0)&-1;r247=(r244|0)==0;if(r247){r248=Math_imul(r246,r245)|0;r249=(r248|0)==0;if(r249){STACKTOP=r3;return 0}else{r250=r248}}else{r250=r244}r251=(r246|0)==0;if(r251){r252=(r250>>>0)/(r245>>>0)&-1;r253=r252}else{r253=r246}HEAP32[r243>>2]=r250;r254=r1+32|0;HEAP32[r254>>2]=r253;r255=r1+36|0;HEAP32[r255>>2]=r227;r256=r1+40|0;HEAP32[r256>>2]=r236;STACKTOP=r3;return 0}}}}}}}r257=512;r258=0;r259=512;r260=0;r261=HEAP32[r8>>2];r262=(r261|0)==0;if(!r262){r263=FUNCTION_TABLE[r261](r1,r5,0,1);r264=(r263|0)==0;if(r264){r265=r4+508|0;r266=HEAP8[r265];r267=r266&255;r268=r267<<8;r269=r4+509|0;r270=HEAP8[r269];r271=r270&255;r272=r268|r271;r273=r272<<16>>16==-9538;if(r273){r274=0;r275=0;while(1){r276=r4+r274|0;r277=HEAP8[r276];r278=r277&255;r279=r278<<8;r280=r279^r275;r281=r274|1;r282=r4+r281|0;r283=HEAP8[r282];r284=r283&255;r285=r280^r284;r286=r274+2|0;r287=r286>>>0<512;if(r287){r274=r286;r275=r285}else{break}}r288=(r280|0)==(r284|0);if(r288){r289=r4+128|0;r290=HEAP8[r289];r291=r290&255;r292=r291<<8;r293=r4+129|0;r294=HEAP8[r293];r295=r294&255;r296=r292|r295;r297=r296<<8;r298=r4+130|0;r299=HEAP8[r298];r300=r299&255;r301=r297|r300;r302=r301<<8;r303=r4+131|0;r304=HEAP8[r303];r305=r304&255;r306=r302|r305;r307=(r306|0)==1;if(r307){r308=r4+140|0;r309=HEAP8[r308];r310=r309&255;r311=r310<<8;r312=r4+141|0;r313=HEAP8[r312];r314=r313&255;r315=r311|r314;r316=(r315&65535)>8;if(!r316){r317=r4+422|0;r318=HEAP8[r317];r319=r318&255;r320=r319<<8;r321=r4+423|0;r322=HEAP8[r321];r323=r322&255;r324=r320|r323;r325=r324&65535;r326=r4+436|0;r327=HEAP8[r326];r328=r327&255;r329=r328<<8;r330=r4+437|0;r331=HEAP8[r330];r332=r331&255;r333=r329|r332;r334=r333&65535;r335=r4+438|0;r336=HEAP8[r335];r337=r336&255;r338=r337<<8;r339=r4+439|0;r340=HEAP8[r339];r341=r340&255;r342=r338|r341;r343=r342&65535;r344=r1+28|0;r345=HEAP32[r344>>2];r346=(r345|0)==0;if(r346){r347=Math_imul(r334,r325)|0;r348=Math_imul(r347,r343)|0;r349=(r348|0)==0;if(r349){STACKTOP=r3;return 0}else{r350=r348}}else{r350=r345}r351=r324<<16>>16==0;do{if(!r351){r352=r333<<16>>16==0;r353=r342<<16>>16==0;if(r352){r354=r353?63:r343;r355=Math_imul(r354,r325)|0;r356=(r350>>>0)/(r355>>>0)&-1;r357=r354;r358=r325;r359=r356;break}if(r353){r360=Math_imul(r334,r325)|0;r361=(r350>>>0)/(r360>>>0)&-1;r357=r361;r358=r325;r359=r334}else{r357=r343;r358=r325;r359=r334}}else{r362=r342<<16>>16==0;r363=r362?63:r343;r364=r333<<16>>16==0;r365=r364?16:r334;r366=Math_imul(r363,r365)|0;r367=(r350>>>0)/(r366>>>0)&-1;r357=r363;r358=r367;r359=r365}}while(0);HEAP32[r344>>2]=r350;r368=r1+32|0;HEAP32[r368>>2]=r358;r369=r1+36|0;HEAP32[r369>>2]=r359;r370=r1+40|0;HEAP32[r370>>2]=r357;STACKTOP=r3;return 0}}}}}}r371=512;r372=0;r373=r1+28|0;r374=HEAP32[r373>>2];switch(r374|0){case 320:{HEAP32[r373>>2]=320;r375=r1+32|0;HEAP32[r375>>2]=40;r376=r1+36|0;HEAP32[r376>>2]=1;r377=r1+40|0;HEAP32[r377>>2]=8;STACKTOP=r3;return 0;break};case 360:{HEAP32[r373>>2]=360;r378=r1+32|0;HEAP32[r378>>2]=40;r379=r1+36|0;HEAP32[r379>>2]=1;r380=r1+40|0;HEAP32[r380>>2]=9;STACKTOP=r3;return 0;break};case 2400:{HEAP32[r373>>2]=2400;r381=r1+32|0;HEAP32[r381>>2]=80;r382=r1+36|0;HEAP32[r382>>2]=2;r383=r1+40|0;HEAP32[r383>>2]=15;STACKTOP=r3;return 0;break};case 800:{HEAP32[r373>>2]=800;r384=r1+32|0;HEAP32[r384>>2]=40;r385=r1+36|0;HEAP32[r385>>2]=2;r386=r1+40|0;HEAP32[r386>>2]=10;STACKTOP=r3;return 0;break};case 1440:{HEAP32[r373>>2]=1440;r387=r1+32|0;HEAP32[r387>>2]=80;r388=r1+36|0;HEAP32[r388>>2]=2;r389=r1+40|0;HEAP32[r389>>2]=9;STACKTOP=r3;return 0;break};case 5760:{HEAP32[r373>>2]=5760;r390=r1+32|0;HEAP32[r390>>2]=80;r391=r1+36|0;HEAP32[r391>>2]=2;r392=r1+40|0;HEAP32[r392>>2]=36;STACKTOP=r3;return 0;break};case 640:{HEAP32[r373>>2]=640;r393=r1+32|0;HEAP32[r393>>2]=40;r394=r1+36|0;HEAP32[r394>>2]=2;r395=r1+40|0;HEAP32[r395>>2]=8;STACKTOP=r3;return 0;break};case 2880:{HEAP32[r373>>2]=2880;r396=r1+32|0;HEAP32[r396>>2]=80;r397=r1+36|0;HEAP32[r397>>2]=2;r398=r1+40|0;HEAP32[r398>>2]=18;STACKTOP=r3;return 0;break};case 720:{HEAP32[r373>>2]=720;r399=r1+32|0;HEAP32[r399>>2]=40;r400=r1+36|0;HEAP32[r400>>2]=2;r401=r1+40|0;HEAP32[r401>>2]=9;STACKTOP=r3;return 0;break};case 1600:{HEAP32[r373>>2]=1600;r402=r1+32|0;HEAP32[r402>>2]=80;r403=r1+36|0;HEAP32[r403>>2]=2;r404=r1+40|0;HEAP32[r404>>2]=10;STACKTOP=r3;return 0;break};default:{r405=r1+32|0;r406=HEAP32[r405>>2];r407=r1+36|0;r408=HEAP32[r407>>2];r409=r1+40|0;r410=HEAP32[r409>>2];r411=(r374|0)==0;if(r411){r412=Math_imul(r408,r406)|0;r413=Math_imul(r412,r410)|0;r414=(r413|0)==0;if(r414){STACKTOP=r3;return 0}else{r415=r413}}else{r415=r374}r416=(r406|0)==0;do{if(!r416){r417=(r408|0)==0;r418=(r410|0)==0;if(r417){r419=r418?63:r410;r420=Math_imul(r419,r406)|0;r421=(r415>>>0)/(r420>>>0)&-1;r422=r419;r423=r406;r424=r421;break}if(r418){r425=Math_imul(r408,r406)|0;r426=(r415>>>0)/(r425>>>0)&-1;r422=r426;r423=r406;r424=r408}else{r422=r410;r423=r406;r424=r408}}else{r427=(r410|0)==0;r428=r427?63:r410;r429=(r408|0)==0;r430=r429?16:r408;r431=Math_imul(r428,r430)|0;r432=(r415>>>0)/(r431>>>0)&-1;r422=r428;r423=r432;r424=r430}}while(0);HEAP32[r373>>2]=r415;HEAP32[r405>>2]=r423;HEAP32[r407>>2]=r424;HEAP32[r409>>2]=r422;STACKTOP=r3;return 0}}}function _dsk_auto_open(r1,r2,r3,r4){var r5,r6;do{if((_dsk_pce_probe(r1)|0)==0){if((_dsk_qed_probe(r1)|0)!=0){r5=_dsk_qed_open(r1,r4);break}if((_dsk_dosemu_probe(r1)|0)!=0){r5=_dsk_dosemu_open(r1,r4);break}r6=_dsk_psi_probe(r1);if((r6|0)!=0){r5=_dsk_psi_open(r1,r6,r4);break}r6=_psi_guess_type(r1);if((r6|0)==12|(r6|0)==0){r5=_dsk_img_open(r1,r2,r3,r4);break}else{r5=_dsk_psi_open(r1,r6,r4);break}}else{r5=_dsk_pce_open(r1,r4)}}while(0);return r5}function _dsk_read_lba(r1,r2,r3,r4){var r5,r6;r5=HEAP32[r1+8>>2];if((r5|0)==0){r6=1;return r6}r6=FUNCTION_TABLE[r5](r1,r2,r3,r4);return r6}function _dsk_write_lba(r1,r2,r3,r4){var r5,r6;r5=HEAP32[r1+12>>2];if((r5|0)==0){r6=1;return r6}r6=FUNCTION_TABLE[r5](r1,r2,r3,r4);return r6}function _dsks_new(){var r1,r2;r1=_malloc(8);if((r1|0)==0){r2=0;return r2}HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;r2=r1;return r2}function _dsks_add_disk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=r1|0;r5=HEAP32[r4>>2];r6=HEAP32[r1+4>>2];do{if((r5|0)!=0){r7=HEAP32[r2+24>>2];r8=0;while(1){r9=r8+1|0;if((HEAP32[HEAP32[r6+(r8<<2)>>2]+24>>2]|0)==(r7|0)){r10=1;r3=8;break}if(r9>>>0<r5>>>0){r8=r9}else{r3=5;break}}if(r3==5){r11=r5+1|0;break}else if(r3==8){return r10}}else{r11=1}}while(0);r3=_realloc(r6,r11<<2);r6=r3;if((r3|0)==0){r10=1;return r10}HEAP32[r6+(HEAP32[r4>>2]<<2)>>2]=r2;HEAP32[r4>>2]=r11;HEAP32[r1+4>>2]=r6;r10=0;return r10}function _dsks_rmv_disk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=r1|0;r4=HEAP32[r3>>2];if((r4|0)==0){r5=0;r6=0;HEAP32[r3>>2]=r6;return r5}r7=r1+4|0;r1=0;r8=0;r9=0;while(1){r10=HEAP32[r7>>2];r11=HEAP32[r10+(r8<<2)>>2];if((r11|0)==(r2|0)){r12=r9;r13=1}else{HEAP32[r10+(r9<<2)>>2]=r11;r12=r9+1|0;r13=r1}r11=r8+1|0;if(r11>>>0<r4>>>0){r1=r13;r8=r11;r9=r12}else{r5=r13;r6=r12;break}}HEAP32[r3>>2]=r6;return r5}function _dsks_get_disk(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=HEAP32[r1>>2];if((r4|0)==0){r5=0;return r5}r6=HEAP32[r1+4>>2];r1=0;while(1){r7=HEAP32[r6+(r1<<2)>>2];r8=r1+1|0;if((HEAP32[r7+24>>2]|0)==(r2|0)){r5=r7;r3=5;break}if(r8>>>0<r4>>>0){r1=r8}else{r5=0;r3=5;break}}if(r3==5){return r5}}function _dsks_commit(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=r1|0;r3=HEAP32[r2>>2];if((r3|0)==0){r4=0;return r4}r5=r1+4|0;r1=0;r6=0;r7=r3;while(1){r3=HEAP32[HEAP32[r5>>2]+(r1<<2)>>2];r8=HEAP32[r3+20>>2];if((r8|0)==0){r9=r6;r10=r7}else{r11=(FUNCTION_TABLE[r8](r3,55224,63056)|0)==0;r9=r11?r6:1;r10=HEAP32[r2>>2]}r11=r1+1|0;if(r11>>>0<r10>>>0){r1=r11;r6=r9;r7=r10}else{r4=r9;break}}return r4}function _dsks_set_msg(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=0;r6=HEAP32[r1>>2];if((r6|0)==0){r7=1;return r7}r8=HEAP32[r1+4>>2];r1=0;while(1){r9=HEAP32[r8+(r1<<2)>>2];r10=r1+1|0;if((HEAP32[r9+24>>2]|0)==(r2|0)){break}if(r10>>>0<r6>>>0){r1=r10}else{r7=1;r5=8;break}}if(r5==8){return r7}if((r9|0)==0){r7=1;return r7}r5=HEAP32[r9+20>>2];if((r5|0)==0){r7=1;return r7}r7=FUNCTION_TABLE[r5](r9,r3,(r4|0)==0?63056:r4);return r7}function _dsk_dosemu_open_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3|0;if((_dsk_read(r1,r4,0,0,23,0)|0)!=0){r5=0;STACKTOP=r3;return r5}if((_memcmp(r4,54992,7)|0)!=0){r5=0;STACKTOP=r3;return r5}r6=_dsk_get_uint32_le(r4,15);r7=_dsk_get_uint32_le(r4,7);r8=_dsk_get_uint32_le(r4,11);r9=_dsk_get_uint32_le(r4,19);if(r9>>>0<23){r5=0;STACKTOP=r3;return r5}r4=_malloc(80);if((r4|0)==0){r5=0;STACKTOP=r3;return r5}r10=r4;_dsk_init(r10,r4,0,r6,r7,r8);_dsk_set_type(r10,4);_dsk_set_readonly(r10,r2);HEAP32[r4+4>>2]=810;HEAP32[r4+8>>2]=586;HEAP32[r4+12>>2]=484;r2=r4+72|0;HEAP32[r2>>2]=r9;HEAP32[r2+4>>2]=0;HEAP32[r4+68>>2]=r1;r5=r10;STACKTOP=r3;return r5}function _dsk_dosemu_del(r1){var r2;r2=HEAP32[r1+64>>2];_fclose(HEAP32[r2+68>>2]);_free(r2);return}function _dsk_dosemu_read(r1,r2,r3,r4){var r5,r6,r7;if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r5=1;return r5}r6=HEAP32[r1+64>>2];r1=r6+72|0;r7=r3;r3=_i64Add(HEAP32[r1>>2],HEAP32[r1+4>>2],r7<<9|0>>>23,0<<9|r7>>>23);r7=r4;r5=(_dsk_read(HEAP32[r6+68>>2],r2,r3,tempRet0,r7<<9|0>>>23,0<<9|r7>>>23)|0)!=0|0;return r5}function _dsk_dosemu_write(r1,r2,r3,r4){var r5,r6,r7;if((HEAP8[r1+56|0]|0)!=0){r5=1;return r5}if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r5=1;return r5}r6=HEAP32[r1+64>>2];r1=r6+72|0;r7=r3;r3=_i64Add(HEAP32[r1>>2],HEAP32[r1+4>>2],r7<<9|0>>>23,0<<9|r7>>>23);r7=r4;r4=r6+68|0;if((_dsk_write(HEAP32[r4>>2],r2,r3,tempRet0,r7<<9|0>>>23,0<<9|r7>>>23)|0)!=0){r5=1;return r5}_fflush(HEAP32[r4>>2]);r5=0;return r5}function _dsk_dosemu_open(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;if((r2|0)==0){r4=_fopen(r1,50352);if((r4|0)==0){r5=_fopen(r1,56976);r6=1;r3=5}else{r7=0;r8=r4}}else{r5=_fopen(r1,56976);r6=r2;r3=5}if(r3==5){if((r5|0)==0){r9=0;return r9}else{r7=r6;r8=r5}}r5=_dsk_dosemu_open_fp(r8,r7);if((r5|0)==0){_fclose(r8);r9=0;return r9}else{_dsk_set_fname(r5,r1);r9=r5;return r9}}function _dsk_dosemu_probe(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=_fopen(r1,56976);if((r3|0)==0){r4=0;STACKTOP=r2;return r4}r1=r2|0;if((_dsk_read(r3,r1,0,0,8,0)|0)==0){r5=(_memcmp(r1,54992,7)|0)==0|0}else{r5=0}_fclose(r3);r4=r5;STACKTOP=r2;return r4}function _dsk_pce_open_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3|0;if((_fread(r4,1,32,r1)|0)!=32){r5=0;STACKTOP=r3;return r5}if((_dsk_get_uint32_be(r4,0)|0)!=1346981191){r5=0;STACKTOP=r3;return r5}if((_dsk_get_uint32_be(r4,4)|0)!=0){r5=0;STACKTOP=r3;return r5}if((_dsk_get_uint32_be(r4,28)|0)!=512){r5=0;STACKTOP=r3;return r5}r6=_dsk_get_uint32_be(r4,12);r7=_dsk_get_uint32_be(r4,16);r8=_dsk_get_uint32_be(r4,20);r9=_dsk_get_uint32_be(r4,24);r10=_malloc(80);if((r10|0)==0){r5=0;STACKTOP=r3;return r5}r11=r10;_dsk_init(r11,r10,r6,r7,r8,r9);_dsk_set_type(r11,3);_dsk_set_readonly(r11,r2);HEAP32[r10+68>>2]=r1;HEAP32[r10+4>>2]=150;HEAP32[r10+8>>2]=888;HEAP32[r10+12>>2]=788;HEAP32[r10+16>>2]=850;HEAP32[r10+20>>2]=156;HEAP32[r10+72>>2]=_dsk_get_uint32_be(r4,8);HEAP32[r10+76>>2]=_dsk_get_uint32_be(r4,28);r5=r11;STACKTOP=r3;return r5}function _dsk_pce_del(r1){var r2;r2=HEAP32[r1+64>>2];r1=HEAP32[r2+68>>2];if((r1|0)==0){_free(r2);return}_fclose(r1);_free(r2);return}function _dsk_pce_read(r1,r2,r3,r4){var r5,r6;r5=HEAP32[r1+64>>2];if((r4+r3|0)>>>0>HEAP32[r5+28>>2]>>>0){r6=1;return r6}r1=r3;r3=_i64Add(HEAP32[r5+72>>2],0,r1<<9|0>>>23,0<<9|r1>>>23);r1=r4;r6=(_dsk_read(HEAP32[r5+68>>2],r2,r3,tempRet0,r1<<9|0>>>23,0<<9|r1>>>23)|0)!=0|0;return r6}function _dsk_pce_write(r1,r2,r3,r4){var r5,r6;r5=HEAP32[r1+64>>2];if((HEAP8[r1+56|0]|0)!=0){r6=1;return r6}if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r6=1;return r6}r1=r3;r3=_i64Add(HEAP32[r5+72>>2],0,r1<<9|0>>>23,0<<9|r1>>>23);r1=r4;r4=r5+68|0;if((_dsk_write(HEAP32[r4>>2],r2,r3,tempRet0,r1<<9|0>>>23,0<<9|r1>>>23)|0)!=0){r6=1;return r6}_fflush(HEAP32[r4>>2]);r6=0;return r6}function _dsk_pce_get_msg(r1,r2,r3,r4){return 1}function _dsk_pce_set_msg(r1,r2,r3){return(_strcmp(r2,46304)|0)!=0|0}function _dsk_pce_open(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;if((r2|0)==0){r4=_fopen(r1,56968);if((r4|0)==0){r5=_fopen(r1,54952);r6=1;r3=5}else{r7=0;r8=r4}}else{r5=_fopen(r1,54952);r6=r2;r3=5}if(r3==5){if((r5|0)==0){r9=0;return r9}else{r7=r6;r8=r5}}r5=_dsk_pce_open_fp(r8,r7);if((r5|0)==0){_fclose(r8);r9=0;return r9}else{_dsk_set_fname(r5,r1);r9=r5;return r9}}function _dsk_pce_probe(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=_fopen(r1,54952);if((r3|0)==0){r4=0;STACKTOP=r2;return r4}r1=r2|0;if((_dsk_read(r3,r1,0,0,4,0)|0)==0){r5=(_dsk_get_uint32_be(r1,0)|0)==1346981191|0}else{r5=0}_fclose(r3);r4=r5;STACKTOP=r2;return r4}function _dsk_qed_open_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=0;r4=STACKTOP;r5=_malloc(4280);if((r5|0)==0){r6=0;STACKTOP=r4;return r6}r7=r5+4276|0;HEAP32[r7>>2]=r1;HEAP32[r5+68>>2]=0;r8=r5+4264|0;HEAP32[r8>>2]=0;r9=r5+4268|0;HEAP32[r9>>2]=0;r10=r5+4272|0;HEAP32[r10>>2]=0;r11=r5+152|0;do{if((_dsk_read(r1,r11,0,0,4096,0)|0)==0?(_dsk_get_uint32_le(r11,0)|0)==4474193:0){r12=r5+4248|0;HEAP8[r12]=0;r13=r5+72|0;HEAP32[r13>>2]=_dsk_get_uint32_le(r11,4);r14=r5+76|0;HEAP32[r14>>2]=_dsk_get_uint32_le(r11,8);r15=_dsk_get_uint32_le(r11,12);HEAP32[r5+80>>2]=r15;r16=HEAP32[r13>>2];r17=r16-1|0;if((r17&r16|0)==0){r18=HEAP32[r14>>2];if(!((r18-1&r18|0)!=0|(r15|0)==0)){r15=r5+128|0;HEAP32[r15>>2]=Math_imul(r18,r16)|0;r16=r5+136|0;HEAP32[r16>>2]=r17;HEAP32[r16+4>>2]=0;r17=_dsk_get_uint64_le(r11,16);r18=r5+88|0;HEAP32[r18>>2]=r17;HEAP32[r18+4>>2]=tempRet0;r17=_dsk_get_uint64_le(r11,24);r14=r5+96|0;HEAP32[r14>>2]=r17;HEAP32[r14+4>>2]=tempRet0;r14=_dsk_get_uint64_le(r11,32);r17=tempRet0;r19=r5+104|0;HEAP32[r19>>2]=r14;HEAP32[r19+4>>2]=r17;r20=HEAP32[r18>>2]&-6;r21=HEAP32[r18+4>>2]&-1;if(!((r20|0)==0&(r21|0)==0)){_fprintf(HEAP32[_stderr>>2],42720,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r20,HEAP32[r3+8>>2]=r21,r3));STACKTOP=r3;break}if(!((r14|0)==0&(r17|0)==0)){HEAP8[r12]=1;HEAP32[r19>>2]=0;HEAP32[r19+4>>2]=0;_dsk_set_uint64_le(r11,32,0,0)}r19=_dsk_get_uint64_le(r11,40);r17=r5+112|0;HEAP32[r17>>2]=r19;HEAP32[r17+4>>2]=tempRet0;r19=r5+4256|0;HEAP32[r19>>2]=0;HEAP32[r19+4>>2]=0;r19=_dsk_get_uint64_le(r11,48);r14=tempRet0;r21=r5+120|0;HEAP32[r21>>2]=r19;HEAP32[r21+4>>2]=r14;if((HEAP32[r16>>2]&HEAP32[r17>>2]|0)==0&(HEAP32[r16+4>>2]&HEAP32[r17+4>>2]|0)==0?(r19&511|0)==0&(r14&0|0)==0:0){r14=r5+144|0;if((_dsk_get_filesize(HEAP32[r7>>2],r14)|0)==0){r19=HEAP32[r13>>2];r20=_i64Add(HEAP32[r14>>2],HEAP32[r14+4>>2],-1,-1);r18=_i64Add(r20,tempRet0,r19,0);r19=tempRet0&~HEAP32[r16+4>>2];HEAP32[r14>>2]=r18&~HEAP32[r16>>2];HEAP32[r14+4>>2]=r19;do{if((HEAP8[r12]|0)!=0&(r2|0)==0){if((_dsk_write(HEAP32[r7>>2],r11,0,0,4096,0)|0)==0){_fflush(HEAP32[r7>>2]);break}_free(r5);r6=0;STACKTOP=r4;return r6}}while(0);r12=r5;_dsk_init(r12,r5,HEAP32[r21>>2]>>>9|HEAP32[r21+4>>2]<<23,0,0,0);_dsk_set_type(r12,7);_dsk_set_readonly(r12,r2);HEAP32[r5+4>>2]=1008;HEAP32[r5+8>>2]=998;HEAP32[r5+12>>2]=248;r19=HEAP32[r15>>2];r14=_malloc(r19);HEAP32[r8>>2]=r14;if((r14|0)!=0){r16=_malloc(r19);HEAP32[r9>>2]=r16;if((r16|0)!=0){r16=_malloc(HEAP32[r13>>2]);HEAP32[r10>>2]=r16;if((r16|0)!=0){if((_dsk_read(HEAP32[r7>>2],r14,HEAP32[r17>>2],HEAP32[r17+4>>2],r19,0)|0)==0){_dsk_guess_geometry(r12);r6=r12;STACKTOP=r4;return r6}r12=HEAP32[r5+64>>2];r19=HEAP32[r12+68>>2];if((r19|0)!=0){_dsk_del(r19)}_free(HEAP32[r12+4272>>2]);_free(HEAP32[r12+4268>>2]);_free(HEAP32[r12+4264>>2]);_fclose(HEAP32[r12+4276>>2]);_free(r12);r6=0;STACKTOP=r4;return r6}}}r12=HEAP32[r5+64>>2];r19=HEAP32[r12+68>>2];if((r19|0)!=0){_dsk_del(r19)}_free(HEAP32[r12+4272>>2]);_free(HEAP32[r12+4268>>2]);_free(HEAP32[r12+4264>>2]);_fclose(HEAP32[r12+4276>>2]);_free(r12);r6=0;STACKTOP=r4;return r6}}}}}}while(0);_free(r5);r6=0;STACKTOP=r4;return r6}function _dsk_qed_del(r1){var r2;r2=HEAP32[r1+64>>2];r1=HEAP32[r2+68>>2];if((r1|0)!=0){_dsk_del(r1)}_free(HEAP32[r2+4272>>2]);_free(HEAP32[r2+4268>>2]);_free(HEAP32[r2+4264>>2]);_fclose(HEAP32[r2+4276>>2]);_free(r2);return}function _dsk_qed_read(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r7=r6;if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r8=1;STACKTOP=r6;return r8}r9=HEAP32[r1+64>>2];r1=r9;r10=r9+72|0;r11=r9+4276|0;if((r4|0)==0){r8=0;STACKTOP=r6;return r8}r12=r9+68|0;r9=r3;r3=r4;r4=r2;L7:while(1){r2=HEAP32[r10>>2]>>>9;r13=r2-((r9>>>0)%(r2>>>0)&-1)|0;r2=r13>>>0>r3>>>0?r3:r13;r13=r9;HEAP32[r7>>2]=r13<<9|0>>>23;HEAP32[r7+4>>2]=0<<9|r13>>>23;if((_dsk_qed_translate(r1,r7,0)|0)!=0){r8=1;r5=12;break}r13=HEAP32[r7>>2];r14=HEAP32[r7+4>>2];do{if(!((r13|0)==0&(r14|0)==0)){r15=r2<<9;if((_dsk_read(HEAP32[r11>>2],r4,r13,r14,r15,0)|0)==0){r16=r15}else{r8=1;r5=12;break L7}}else{r15=HEAP32[r12>>2];if((r15|0)==0){r17=r2<<9;_memset(r4,0,r17)|0;r16=r17;break}if((_dsk_read_lba(r15,r4,r9,r2)|0)!=0){r8=1;r5=12;break L7}r16=r2<<9}}while(0);if((r3|0)==(r2|0)){r8=0;r5=12;break}else{r9=r2+r9|0;r3=r3-r2|0;r4=r4+r16|0}}if(r5==12){STACKTOP=r6;return r8}}function _dsk_qed_write(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r7=r6;if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r8=1;STACKTOP=r6;return r8}r9=HEAP32[r1+64>>2];r1=r9;r10=r9+72|0;r11=r9+4276|0;if((r4|0)==0){r8=0;STACKTOP=r6;return r8}else{r12=r3;r13=r4;r14=r2}while(1){r2=HEAP32[r10>>2]>>>9;r4=r2-((r12>>>0)%(r2>>>0)&-1)|0;r2=r4>>>0>r13>>>0?r13:r4;r4=r12;HEAP32[r7>>2]=r4<<9|0>>>23;HEAP32[r7+4>>2]=0<<9|r4>>>23;if((_dsk_qed_translate(r1,r7,1)|0)!=0){r8=1;r5=6;break}r4=r2<<9;if((_dsk_write(HEAP32[r11>>2],r14,HEAP32[r7>>2],HEAP32[r7+4>>2],r4,0)|0)!=0){r8=1;r5=6;break}if((r13|0)==(r2|0)){r8=0;r5=6;break}else{r12=r2+r12|0;r13=r13-r2|0;r14=r14+r4|0}}if(r5==6){STACKTOP=r6;return r8}}function _dsk_qed_open(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;if((r2|0)==0){r4=_fopen(r1,56960);if((r4|0)==0){r5=_fopen(r1,54928);r6=1;r3=5}else{r7=0;r8=r4}}else{r5=_fopen(r1,54928);r6=r2;r3=5}if(r3==5){if((r5|0)==0){r9=0;return r9}else{r7=r6;r8=r5}}r5=_dsk_qed_open_fp(r8,r7);if((r5|0)==0){_fclose(r8);r9=0;return r9}else{_dsk_set_fname(r5,r1);r9=r5;return r9}}function _dsk_qed_cow_new(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=_fopen(r2,56960);if((r3|0)==0){if((HEAP32[r1>>2]|0)==7){r4=HEAP32[HEAP32[r1+64>>2]+72>>2]}else{r4=0}r5=HEAP32[r1+28>>2];r6=_fopen(r2,50344);if((r6|0)==0){r7=0;return r7}r8=_dsk_qed_create_fp(r6,r5,r4);_fclose(r6);if((r8|0)!=0){r7=0;return r7}}else{_fclose(r3)}r3=_fopen(r2,56960);if((r3|0)==0){r8=_fopen(r2,54928);if((r8|0)==0){r7=0;return r7}else{r9=1;r10=r8}}else{r9=0;r10=r3}r3=_dsk_qed_open_fp(r10,r9);if((r3|0)==0){_fclose(r10);r7=0;return r7}_dsk_set_fname(r3,r2);r10=HEAP32[r3+64>>2];HEAP32[r10+68>>2]=r1;HEAP32[r3+16>>2]=198;HEAP32[r3+20>>2]=66;HEAP32[r3+24>>2]=HEAP32[r1+24>>2];r9=r10+152|0;r8=_dsk_get_uint64_le(r9,16);r6=(HEAP32[r1>>2]|0)==1;_dsk_set_uint64_le(r9,16,(r6?5:1)|r8,(r6?0:0)|tempRet0);r6=r1+60|0;r8=HEAP32[r6>>2];if((r8|0)==0){r11=0}else{r11=_strlen(r8)}r8=r11>>>0>1024?0:r11;_dsk_set_uint32_le(r9,56,64);_dsk_set_uint32_le(r9,60,r8);if((r8|0)!=0){_memcpy(r10+216|0,HEAP32[r6>>2],r8)|0}r8=r10+4276|0;if((_dsk_write(HEAP32[r8>>2],r9,0,0,4096,0)|0)==0){_fflush(HEAP32[r8>>2])}_dsk_set_geometry(r3,HEAP32[r1+28>>2],HEAP32[r1+32>>2],HEAP32[r1+36>>2],HEAP32[r1+40>>2]);_dsk_set_visible_chs(r3,HEAP32[r1+44>>2],HEAP32[r1+48>>2],HEAP32[r1+52>>2]);_dsk_set_fname(r3,r2);r7=r3;return r7}function _dsk_qed_get_msg(r1,r2,r3,r4){return 1}function _dsk_qed_set_msg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=0;if((_strcmp(r2,46296)|0)!=0){r4=1;return r4}r2=HEAP32[r1+64>>2];r1=r2+68|0;if((HEAP32[r1>>2]|0)==0){r4=1;return r4}r5=r2+128|0;r6=HEAP32[r5>>2];r7=r6>>>3;r8=r2+72|0;r9=HEAP32[r8>>2]>>>9;do{if((r7|0)!=0){r10=r2+4264|0;r11=Math_imul(r9,r7)|0;r12=r2+136|0;r13=r2+4256|0;r14=r2+4276|0;r15=r2+4268|0;r16=r2+4272|0;r17=0;r18=0;L9:while(1){r19=r18<<3;r20=_dsk_get_uint64_le(HEAP32[r10>>2],r19);r21=tempRet0;if((r20|0)==0&(r21|0)==0){r22=r17+r11|0}else{r23=r20&~HEAP32[r12>>2];r20=r21&~HEAP32[r12+4>>2];if((HEAP32[r13>>2]|0)==(r23|0)&(HEAP32[r13+4>>2]|0)==(r20|0)){r24=0;r25=r17}else{if((_dsk_read(HEAP32[r14>>2],HEAP32[r15>>2],r23,r20,HEAP32[r5>>2],0)|0)!=0){r4=1;r3=21;break}HEAP32[r13>>2]=r23;HEAP32[r13+4>>2]=r20;r24=0;r25=r17}while(1){r20=_dsk_get_uint64_le(HEAP32[r15>>2],r24<<3);r23=tempRet0;if(!((r20|0)==0&(r23|0)==0)){if((_dsk_read(HEAP32[r14>>2],HEAP32[r16>>2],r20&~HEAP32[r12>>2],r23&~HEAP32[r12+4>>2],HEAP32[r8>>2],0)|0)!=0){r4=1;r3=21;break L9}r23=r25+r9|0;r20=HEAP32[r1>>2];r21=HEAP32[r20+28>>2];if((_dsk_write_lba(r20,HEAP32[r16>>2],r25,r23>>>0>r21>>>0?r21-r25|0:r9)|0)==0){r26=r23}else{r4=1;r3=21;break L9}}else{r26=r25+r9|0}r23=r24+1|0;if(r23>>>0<r7>>>0){r24=r23;r25=r26}else{break}}_dsk_set_uint64_le(HEAP32[r10>>2],r19,0,0);r22=r26}r23=r18+1|0;if(r23>>>0<r7>>>0){r17=r22;r18=r23}else{r3=18;break}}if(r3==18){r27=HEAP32[r5>>2];r28=r14;r29=r10;break}else if(r3==21){return r4}}else{r27=r6;r28=r2+4276|0;r29=r2+4264|0}}while(0);r6=r2+112|0;if((_dsk_write(HEAP32[r28>>2],HEAP32[r29>>2],HEAP32[r6>>2],HEAP32[r6+4>>2],r27,0)|0)!=0){r4=1;return r4}_fflush(HEAP32[r28>>2]);r27=_i64Add(HEAP32[r5>>2],0,HEAP32[r6>>2],HEAP32[r6+4>>2]);r6=tempRet0;r5=r2+144|0;HEAP32[r5>>2]=r27;HEAP32[r5+4>>2]=r6;_dsk_set_filesize(HEAP32[r28>>2],r27,r6);r4=0;return r4}function _dsk_qed_create_fp(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r4=r2;r2=r4<<9|0>>>23;r5=0<<9|r4>>>23;if(r3>>>0>=4097){if(r3>>>0>134217727){r6=134217728}else{r4=(r3<<1)-1|0;while(1){r3=r4-1&r4;if((r3|0)==0){r6=r4;break}else{r4=r3}}}}else{r6=4096}r4=r6>>>3;r3=0;r7=r4<<1|0>>>31;r8=r3<<1|r4>>>31;r9=___muldi3(r7,r8,r7,r8);r8=r6;r7=0;r10=___muldi3(r9,tempRet0,r8,r7);r9=tempRet0;if(r9>>>0<r5>>>0|r9>>>0==r5>>>0&r10>>>0<r2>>>0){r11=2;while(1){r12=r11<<1;r13=___muldi3(r12,0,r4,r3);r14=tempRet0;r15=___muldi3(r13,r14,r13,r14);r14=___muldi3(r15,tempRet0,r8,r7);r15=tempRet0;if((r15>>>0<r5>>>0|r15>>>0==r5>>>0&r14>>>0<r2>>>0)&r12>>>0<16){r11=r12}else{r16=r12;r17=r15;r18=r14;break}}}else{r16=2;r17=r9;r18=r10}r10=r17>>>0<r5>>>0|r17>>>0==r5>>>0&r18>>>0<r2>>>0;if(r10&r6>>>0<134217728){r18=r16;r17=0;r9=r6;while(1){r11=r9<<1;r7=___muldi3(r9>>>2&536870911,0,r18,r17);r8=tempRet0;r3=___muldi3(r7,r8,r11,0);r4=___muldi3(r3,tempRet0,r7,r8);r8=tempRet0;r7=r8>>>0<r5>>>0|r8>>>0==r5>>>0&r4>>>0<r2>>>0;if(r7&r11>>>0<134217728){r9=r11}else{r19=r11;r20=r7;break}}}else{r19=r6;r20=r10}if(r20){r21=1;return r21}r20=_malloc(r19);if((r20|0)==0){r21=1;return r21}_memset(r20,0,r19)|0;_dsk_set_uint32_le(r20,0,4474193);_dsk_set_uint32_le(r20,4,r19);_dsk_set_uint32_le(r20,8,r16);_dsk_set_uint32_le(r20,12,1);_dsk_set_uint64_le(r20,16,0,0);_dsk_set_uint64_le(r20,24,0,0);_dsk_set_uint64_le(r20,32,0,0);r10=r19;r6=0;_dsk_set_uint64_le(r20,40,r10,r6);_dsk_set_uint64_le(r20,48,r2,r5);if((_dsk_write(r1,r20,0,0,r10,r6)|0)!=0){_free(r20);r21=1;return r21}_memset(r20,0,r19)|0;r19=r16|1;L26:do{if((r19|0)!=1){r16=1;while(1){r5=___muldi3(r16,0,r10,r6);r2=r16+1|0;if((_dsk_write(r1,r20,r5,tempRet0,r10,r6)|0)!=0){break}if(r2>>>0<r19>>>0){r16=r2}else{break L26}}_free(r20);r21=1;return r21}}while(0);_free(r20);r21=0;return r21}function _dsk_qed_probe(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=_fopen(r1,54928);if((r3|0)==0){r4=0;STACKTOP=r2;return r4}r1=r2|0;if((_dsk_read(r3,r1,0,0,4,0)|0)==0){r5=(_dsk_get_uint32_le(r1,0)|0)==4474193|0}else{r5=0}_fclose(r3);r4=r5;STACKTOP=r2;return r4}function _dsk_qed_translate(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r4=r1+72|0;r5=HEAP32[r4>>2];r6=Math_imul(r5>>>3,HEAP32[r1+76>>2])|0;r7=___udivdi3(HEAP32[r2>>2],HEAP32[r2+4>>2],r5,0);r5=tempRet0;r8=r6;r9=0;r10=___udivdi3(r7,r5,r8,r9);r11=r10;r10=___uremdi3(r7,r5,r8,r9);r9=r10;r10=r1+4264|0;r8=r11<<3;r5=_dsk_get_uint64_le(HEAP32[r10>>2]+r8|0,0);r7=tempRet0;r12=HEAP32[r2>>2];r13=HEAP32[r2+4>>2];r14=r1+136|0;r15=HEAP32[r14>>2];r16=HEAP32[r14+4>>2];r17=r15&r12;r18=r16&r13;if(r11>>>0>=r6>>>0){r19=1;return r19}if((r5|0)==0&(r7|0)==0){if((r3|0)==0){HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;r19=0;return r19}r6=r1+144|0;r11=r1+128|0;r20=_i64Add(HEAP32[r11>>2],0,HEAP32[r6>>2],HEAP32[r6+4>>2]);r21=tempRet0;r22=r1+68|0;r23=HEAP32[r22>>2];if((r23|0)!=0){r24=((r15^-512)&r12)>>>9|((r16^511)&r13)<<23;r13=HEAP32[r4>>2];r12=r13>>>9;r25=r1+4272|0;if((r12+r24|0)>>>0>HEAP32[r23+28>>2]>>>0){_memset(HEAP32[r25>>2],0,r13)|0;r13=HEAP32[r22>>2];r26=HEAP32[r13+28>>2]-r24|0;r27=r13}else{r26=r12;r27=r23}if((_dsk_read_lba(r27,HEAP32[r25>>2],r24,r26)|0)!=0){r19=1;return r19}}else{_memset(HEAP32[r1+4272>>2],0,HEAP32[r4>>2])|0}r26=r1+4276|0;if((_dsk_write(HEAP32[r26>>2],HEAP32[r1+4272>>2],r20,r21,HEAP32[r4>>2],0)|0)!=0){r19=1;return r19}r24=r1+4268|0;_memset(HEAP32[r24>>2],0,HEAP32[r11>>2])|0;_dsk_set_uint64_le(HEAP32[r24>>2]+(r9<<3)|0,0,r20,r21);r25=HEAP32[r6>>2];r27=HEAP32[r6+4>>2];if((_dsk_write(HEAP32[r26>>2],HEAP32[r24>>2],r25,r27,HEAP32[r11>>2],0)|0)!=0){r19=1;return r19}_fflush(HEAP32[r26>>2]);r24=r1+4256|0;HEAP32[r24>>2]=r25;HEAP32[r24+4>>2]=r27;_dsk_set_uint64_le(HEAP32[r10>>2]+r8|0,0,HEAP32[r6>>2],HEAP32[r6+4>>2]);r8=r1+112|0;if((_dsk_write(HEAP32[r26>>2],HEAP32[r10>>2],HEAP32[r8>>2],HEAP32[r8+4>>2],HEAP32[r11>>2],0)|0)!=0){r19=1;return r19}_fflush(HEAP32[r26>>2]);r26=_i64Add(r20,r21,r17&-1,r18&0);HEAP32[r2>>2]=r26;HEAP32[r2+4>>2]=tempRet0;r26=_i64Add(HEAP32[r4>>2],0,r20,r21);HEAP32[r6>>2]=r26;HEAP32[r6+4>>2]=tempRet0;r19=0;return r19}r6=r5&~r15;r15=r7&~r16;r16=r1+4256|0;do{if(!((HEAP32[r16>>2]|0)==(r6|0)&(HEAP32[r16+4>>2]|0)==(r15|0))){r7=r1+4268|0;if((_dsk_read(HEAP32[r1+4276>>2],HEAP32[r7>>2],r6,r15,HEAP32[r1+128>>2],0)|0)==0){HEAP32[r16>>2]=r6;HEAP32[r16+4>>2]=r15;r28=r7;break}else{r19=1;return r19}}else{r28=r1+4268|0}}while(0);r7=r9<<3;r9=_dsk_get_uint64_le(HEAP32[r28>>2]+r7|0,0);r5=tempRet0;if(!((r9|0)==0&(r5|0)==0)){r26=_i64Add(r9&~HEAP32[r14>>2],r5&~HEAP32[r14+4>>2],r17&-1,r18&0);HEAP32[r2>>2]=r26;HEAP32[r2+4>>2]=tempRet0;r19=0;return r19}if((r3|0)==0){HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;r19=0;return r19}r3=r1+68|0;r26=HEAP32[r3>>2];if((r26|0)!=0){r5=((HEAP32[r14>>2]^-512)&HEAP32[r2>>2])>>>9|((HEAP32[r14+4>>2]^511)&HEAP32[r2+4>>2])<<23;r14=HEAP32[r4>>2];r9=r14>>>9;r21=r1+4272|0;if((r5+r9|0)>>>0>HEAP32[r26+28>>2]>>>0){_memset(HEAP32[r21>>2],0,r14)|0;r14=HEAP32[r3>>2];r29=HEAP32[r14+28>>2]-r5|0;r30=r14}else{r29=r9;r30=r26}if((_dsk_read_lba(r30,HEAP32[r21>>2],r5,r29)|0)!=0){r19=1;return r19}}else{_memset(HEAP32[r1+4272>>2],0,HEAP32[r4>>2])|0}r29=r1+4276|0;r5=r1+144|0;if((_dsk_write(HEAP32[r29>>2],HEAP32[r1+4272>>2],HEAP32[r5>>2],HEAP32[r5+4>>2],HEAP32[r4>>2],0)|0)!=0){r19=1;return r19}_dsk_set_uint64_le(HEAP32[r28>>2]+r7|0,0,HEAP32[r5>>2],HEAP32[r5+4>>2]);if((_dsk_write(HEAP32[r29>>2],HEAP32[r28>>2],r6,r15,HEAP32[r1+128>>2],0)|0)!=0){r19=1;return r19}_fflush(HEAP32[r29>>2]);HEAP32[r16>>2]=r6;HEAP32[r16+4>>2]=r15;r15=_i64Add(HEAP32[r5>>2],HEAP32[r5+4>>2],r17&-1,r18&0);HEAP32[r2>>2]=r15;HEAP32[r2+4>>2]=tempRet0;r2=_i64Add(HEAP32[r5>>2],HEAP32[r5+4>>2],HEAP32[r4>>2],0);HEAP32[r5>>2]=r2;HEAP32[r5+4>>2]=tempRet0;r19=0;return r19}function _dsk_img_open_fp(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;if((_dsk_get_filesize(r1,r6)|0)!=0){r7=0;STACKTOP=r5;return r7}r8=HEAP32[r6>>2];r9=HEAP32[r6+4>>2];if(!(r9>>>0>r3>>>0|r9>>>0==r3>>>0&r8>>>0>r2>>>0)){r7=0;STACKTOP=r5;return r7}r10=_i64Subtract(r8,r9,r2,r3);r9=tempRet0;r8=r10>>>9|r9<<23;r10=r9>>>9|0<<23;HEAP32[r6>>2]=r8;HEAP32[r6+4>>2]=r10;if((r8|0)==0&(r10|0)==0){r7=0;STACKTOP=r5;return r7}r10=_malloc(80);if((r10|0)==0){r7=0;STACKTOP=r5;return r7}r6=r10;_dsk_init(r6,r10,r8,0,0,0);_dsk_set_type(r6,1);_dsk_set_readonly(r6,r4);HEAP32[r10+4>>2]=342;HEAP32[r10+8>>2]=1046;HEAP32[r10+12>>2]=232;r4=r10+72|0;HEAP32[r4>>2]=r2;HEAP32[r4+4>>2]=r3;HEAP32[r10+68>>2]=r1;_dsk_guess_geometry(r6);r7=r6;STACKTOP=r5;return r7}function _dsk_img_open(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r5=0;if((r4|0)==0){r6=_fopen(r1,56944);if((r6|0)==0){r7=_fopen(r1,54856);r8=1;r5=5}else{r9=0;r10=r6}}else{r7=_fopen(r1,54856);r8=r4;r5=5}if(r5==5){if((r7|0)==0){r11=0;return r11}else{r9=r8;r10=r7}}r7=_dsk_img_open_fp(r10,r2,r3,r9);if((r7|0)==0){_fclose(r10);r11=0;return r11}else{_dsk_set_fname(r7,r1);r11=r7;return r11}}function _dsk_img_del(r1){var r2;r2=HEAP32[r1+64>>2];_fclose(HEAP32[r2+68>>2]);_free(r2);return}function _dsk_img_read(r1,r2,r3,r4){var r5,r6,r7;if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r5=1;return r5}r6=HEAP32[r1+64>>2];r1=r6+72|0;r7=r3;r3=_i64Add(HEAP32[r1>>2],HEAP32[r1+4>>2],r7<<9|0>>>23,0<<9|r7>>>23);r7=r4;r5=(_dsk_read(HEAP32[r6+68>>2],r2,r3,tempRet0,r7<<9|0>>>23,0<<9|r7>>>23)|0)!=0|0;return r5}function _dsk_img_write(r1,r2,r3,r4){var r5,r6,r7;if((HEAP8[r1+56|0]|0)!=0){r5=1;return r5}if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r5=1;return r5}r6=HEAP32[r1+64>>2];r1=r6+72|0;r7=r3;r3=_i64Add(HEAP32[r1>>2],HEAP32[r1+4>>2],r7<<9|0>>>23,0<<9|r7>>>23);r7=r4;r4=r6+68|0;if((_dsk_write(HEAP32[r4>>2],r2,r3,tempRet0,r7<<9|0>>>23,0<<9|r7>>>23)|0)!=0){r5=1;return r5}_fflush(HEAP32[r4>>2]);r5=0;return r5}function _chr_log_flush(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=0;r3=STACKTOP;r4=r1+28|0;r5=HEAP32[r4>>2];r6=r1+48|0;if((r5|0)==0){HEAP32[r4>>2]=0;HEAP32[r6>>2]=0;STACKTOP=r3;return}r7=r1+52|0;r8=(HEAP32[r6>>2]|0)!=0?50520:49568;r9=r5;r5=r1+32|0;while(1){r1=r9>>>0<16;r10=r1?r9:16;r11=HEAPU8[r5];_fprintf(HEAP32[r7>>2],50848,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=r8,HEAP32[r2+8>>2]=r11,r2));STACKTOP=r2;if(r10>>>0>1){r11=1;while(1){_fprintf(HEAP32[r7>>2],49104,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAPU8[r5+r11|0],r2));STACKTOP=r2;r12=r11+1|0;if(r12>>>0<r10>>>0){r11=r12}else{break}}}r11=HEAP32[r7>>2];if(r1){r12=r10;r13=r11;while(1){_fwrite(48688,3,1,r13);r14=r12+1|0;r15=HEAP32[r7>>2];if(r14>>>0<16){r12=r14;r13=r15}else{r16=r15;break}}}else{r16=r11}_fwrite(48312,2,1,r16);if((r10|0)!=0){r13=0;while(1){r12=HEAP8[r5+r13|0];_fputc((r12-32&255)>94?46:r12&255,HEAP32[r7>>2]);r12=r13+1|0;if(r12>>>0<r10>>>0){r13=r12}else{break}}}_fputc(10,HEAP32[r7>>2]);if((r9|0)==(r10|0)){break}else{r9=r9-r10|0;r5=r5+r10|0}}_fflush(HEAP32[r7>>2]);HEAP32[r4>>2]=0;HEAP32[r6>>2]=0;STACKTOP=r3;return}function _chr_init(r1,r2){HEAP32[r1>>2]=r2;r2=r1+4|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r2+24>>2]=0;_memset(r1+48|0,0,32)|0;return}function _chr_close(r1){var r2;if((r1|0)==0){return}r2=r1+52|0;if((HEAP32[r2>>2]|0)!=0){_chr_log_flush(r1);_fclose(HEAP32[r2>>2])}r2=HEAP32[r1+56>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](r1);return}function _chr_read(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;if((r1|0)==0){r4=0;return r4}r5=HEAP32[r1+60>>2];if((r5|0)==0){r4=0;return r4}r6=FUNCTION_TABLE[r5](r1,r2,r3);if((HEAP32[r1+52>>2]|0)==0|(r6|0)==0){r4=r6;return r4}r3=r1+28|0;r5=r1+48|0;if((HEAP32[r3>>2]|0)!=0?(HEAP32[r5>>2]|0)!=0:0){_chr_log_flush(r1)}r7=r2;r2=r6;while(1){r8=HEAP32[r3>>2];r9=16-r8|0;r10=r2>>>0<r9>>>0?r2:r9;_memcpy(r8+(r1+32)|0,r7,r10)|0;r8=r10+HEAP32[r3>>2]|0;HEAP32[r3>>2]=r8;HEAP32[r5>>2]=0;if(r8>>>0>15){_chr_log_flush(r1)}if((r2|0)==(r10|0)){r4=r6;break}r7=r7+r10|0;r2=r2-r10|0}return r4}function _chr_write(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;if((r1|0)==0){r4=r3;return r4}r5=HEAP32[r1+64>>2];if((r5|0)==0){r4=r3;return r4}r6=FUNCTION_TABLE[r5](r1,r2,r3);if((HEAP32[r1+52>>2]|0)==0|(r6|0)==0){r4=r6;return r4}r3=r1+28|0;r5=r1+48|0;if((HEAP32[r3>>2]|0)!=0?(HEAP32[r5>>2]|0)!=1:0){_chr_log_flush(r1)}r7=r2;r2=r6;while(1){r8=HEAP32[r3>>2];r9=16-r8|0;r10=r2>>>0<r9>>>0?r2:r9;_memcpy(r8+(r1+32)|0,r7,r10)|0;r8=r10+HEAP32[r3>>2]|0;HEAP32[r3>>2]=r8;HEAP32[r5>>2]=1;if(r8>>>0>15){_chr_log_flush(r1)}if((r2|0)==(r10|0)){r4=r6;break}r7=r7+r10|0;r2=r2-r10|0}return r4}function _chr_log_ctl(r1,r2,r3){var r4,r5,r6;r4=0;r5=STACKTOP;r6=r1+52|0;if((HEAP32[r6>>2]|0)==0|(r2|0)==(r3|0)){STACKTOP=r5;return}_chr_log_flush(r1);r1=r3^r2;if((r1&512|0)!=0){_fprintf(HEAP32[r6>>2],51352,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=55376,HEAP32[r4+8>>2]=r3>>>9&1,r4));STACKTOP=r4}if((r1&1|0)!=0){_fprintf(HEAP32[r6>>2],51352,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=54704,HEAP32[r4+8>>2]=r3&1,r4));STACKTOP=r4}if((r1&2|0)!=0){_fprintf(HEAP32[r6>>2],51352,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=54e3,HEAP32[r4+8>>2]=r3>>>1&1,r4));STACKTOP=r4}if((r1&256|0)!=0){_fprintf(HEAP32[r6>>2],51352,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=53384,HEAP32[r4+8>>2]=r3>>>8&1,r4));STACKTOP=r4}if((r1&1024|0)!=0){_fprintf(HEAP32[r6>>2],51352,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=52536,HEAP32[r4+8>>2]=r3>>>10&1,r4));STACKTOP=r4}if((r1&2048|0)==0){STACKTOP=r5;return}_fprintf(HEAP32[r6>>2],51352,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=51888,HEAP32[r4+8>>2]=r3>>>11&1,r4));STACKTOP=r4;STACKTOP=r5;return}function _chr_set_ctl(r1,r2){var r3,r4,r5;if((r1|0)!=0){r3=r1+24|0;r4=HEAP32[r3>>2];if((r4|0)!=(r2|0)){_chr_log_ctl(r1,r4,r2);HEAP32[r3>>2]=r2;r3=HEAP32[r1+72>>2];if((r3|0)!=0){r5=FUNCTION_TABLE[r3](r1,r2)}else{r5=0}}else{r5=0}}else{r5=1}return r5}function _chr_set_params(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r6=0;r7=STACKTOP;if((r1|0)==0){r8=1;STACKTOP=r7;return r8}r9=r1+4|0;r10=r1+8|0;if((((HEAP32[r9>>2]|0)==(r2|0)?(HEAP32[r10>>2]|0)==(r3|0):0)?(HEAP32[r1+12>>2]|0)==(r4|0):0)?(HEAP32[r1+16>>2]|0)==(r5|0):0){r8=0;STACKTOP=r7;return r8}HEAP32[r9>>2]=r2;HEAP32[r10>>2]=r3;r11=r1+12|0;HEAP32[r11>>2]=r4;r12=r1+16|0;HEAP32[r12>>2]=r5;r13=r1+52|0;if((HEAP32[r13>>2]|0)!=0){_chr_log_flush(r1);r14=HEAP32[r11>>2];if((r14|0)==0){r15=31800}else if((r14|0)==1){r15=30840}else if((r14|0)==2){r15=58144}else{r15=57352}r14=HEAP32[r10>>2];r10=HEAP32[r12>>2];_fprintf(HEAP32[r13>>2],56128,(r6=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r6>>2]=HEAP32[r9>>2],HEAP32[r6+8>>2]=r14,HEAP32[r6+16>>2]=r15,HEAP32[r6+24>>2]=r10,r6));STACKTOP=r6;_fflush(HEAP32[r13>>2])}r13=HEAP32[r1+76>>2];if((r13|0)==0){r8=1;STACKTOP=r7;return r8}r8=FUNCTION_TABLE[r13](r1,r2,r3,r4,r5);STACKTOP=r7;return r8}function _chr_open(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r3=HEAP32[29e3>>2];if((r3|0)==0){r4=0;return r4}else{r5=0;r6=r3}while(1){r3=HEAP8[r6];L5:do{if(r3<<24>>24!=0){r7=r1;r8=r6;r9=r3;while(1){if(r9<<24>>24!=(HEAP8[r7]|0)){break}r10=r8+1|0;r11=r7+1|0;r12=HEAP8[r10];if(r12<<24>>24==0){r13=r11;r2=6;break L5}else{r7=r11;r8=r10;r9=r12}}if(r9<<24>>24==0){r13=r7;r2=6}}else{r13=r1;r2=6}}while(0);if(r2==6){r2=0;r3=HEAP8[r13];if(r3<<24>>24==58|r3<<24>>24==0){break}}r3=r5+1|0;r8=HEAP32[29e3+(r3<<3)>>2];if((r8|0)==0){r4=0;r2=13;break}else{r5=r3;r6=r8}}if(r2==13){return r4}r2=FUNCTION_TABLE[HEAP32[29004+(r5<<3)>>2]](r1);if((r2|0)==0){r4=0;return r4}r5=_drv_get_option(r1,33680);if((r5|0)==0){r4=r2;return r4}r1=r2+52|0;if((HEAP32[r1>>2]|0)!=0){_chr_log_flush(r2);_fclose(HEAP32[r1>>2])}HEAP32[r1>>2]=_fopen(r5,36680);_free(r5);r4=r2;return r4}function _chr_mouse_open(r1){var r2,r3,r4,r5,r6,r7,r8;r2=_malloc(388);if((r2|0)==0){r3=0;return r3}r4=r2;r5=r2;_chr_init(r5,r2);HEAP32[r2+56>>2]=556;HEAP32[r2+60>>2]=152;HEAP32[r2+64>>2]=496;HEAP32[r2+68>>2]=1058;HEAP32[r2+72>>2]=1086;HEAP32[r2+76>>2]=844;r6=r2+80|0;HEAP32[r6>>2]=0;HEAP32[r2+84>>2]=0;HEAP32[r2+88>>2]=0;HEAP8[r2+348|0]=0;HEAP8[r2+349|0]=0;HEAP32[r2+352>>2]=0;HEAP32[r2+356>>2]=0;HEAP32[r2+360>>2]=0;r7=_drv_get_option(r1,54424);if((r7|0)!=0){if((_strcmp(r7,56856)|0)!=0){if((_strcmp(r7,50304)|0)==0){r8=1}else{_free(r7);_free(r2);r3=0;return r3}}else{r8=0}HEAP32[r6>>2]=r8;_free(r7)}HEAP32[r2+364>>2]=_drv_get_option_sint(r1,46264,1);r7=_drv_get_option_sint(r1,42688,1);r8=r2+368|0;HEAP32[r8>>2]=r7;HEAP32[r2+372>>2]=0;if((r7|0)==0){HEAP32[r8>>2]=1}HEAP32[r2+376>>2]=_drv_get_option_sint(r1,39592,1);r8=_drv_get_option_sint(r1,36656,1);r1=r2+380|0;HEAP32[r1>>2]=r8;HEAP32[r2+384>>2]=0;if((r8|0)==0){HEAP32[r1>>2]=1}r1=HEAP32[62880>>2];r8=r1+1|0;if(r8>>>0>=8){r3=r5;return r3}HEAP32[62880>>2]=r8;HEAP32[62888+(r1<<2)>>2]=r4;r3=r5;return r3}function _chr_mouse_close(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP32[r1>>2];r1=r2;r3=HEAP32[62880>>2];if((r3|0)==0){r4=0;HEAP32[62880>>2]=r4;_free(r2);return}else{r5=0;r6=0}while(1){r7=HEAP32[62888+(r6<<2)>>2];if((r7|0)==(r1|0)){r8=r5}else{HEAP32[62888+(r5<<2)>>2]=r7;r8=r5+1|0}r7=r6+1|0;if(r7>>>0<r3>>>0){r5=r8;r6=r7}else{r4=r8;break}}HEAP32[62880>>2]=r4;_free(r2);return}function _chr_mouse_read(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=HEAP32[r1>>2];r1=r4;r5=r4+84|0;r6=HEAP32[r5>>2];r7=r4+88|0;r8=HEAP32[r7>>2];if((r6|0)==(r8|0)){if((HEAP32[r4+352>>2]|0)==0?(HEAP32[r4+356>>2]|0)==0:0){r9=0;return r9}_chr_mouse_add_packet(r1);r10=HEAP32[r5>>2];r11=HEAP32[r7>>2]}else{r10=r6;r11=r8}if((r10|0)==(r11|0)){r9=0;return r9}r8=r10-r11&255;r10=r8>>>0>r3>>>0?r3:r8;if((r10|0)==0){r9=0;return r9}else{r12=0;r13=r11}while(1){HEAP8[r2+r12|0]=HEAP8[r4+(r13+92)|0];r11=HEAP32[r7>>2]+1&255;HEAP32[r7>>2]=r11;r8=r12+1|0;if(r8>>>0<r10>>>0){r12=r8;r13=r11}else{r9=r10;break}}return r9}function _chr_mouse_write(r1,r2,r3){return r3}function _chr_mouse_get_ctl(r1,r2){HEAP32[r2>>2]=1792;return 0}function _chr_mouse_set_ctl(r1,r2){var r3,r4;r3=HEAP32[r1>>2];r1=r2&1;r4=r2&2;r2=r3+348|0;do{if(!((HEAP32[r3+80>>2]|0)!=0|(r4|0)==0|(r1|0)==0)){if((HEAP8[r2]|0)!=0?(HEAP8[r3+349|0]|0)!=0:0){break}HEAP32[r3+352>>2]=0;HEAP32[r3+356>>2]=0;HEAP32[r3+372>>2]=0;HEAP32[r3+384>>2]=0;HEAP32[r3+84>>2]=1;HEAP32[r3+88>>2]=0;HEAP8[r3+92|0]=77}}while(0);HEAP8[r2]=r1;HEAP8[r3+349|0]=r4>>>1;return 0}function _chr_mouse_set_params(r1,r2,r3,r4,r5){return 0}function _chr_mouse_add_packet(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=HEAP32[r1+80>>2];if((r2|0)==0){r3=r1+84|0;r4=HEAP32[r3>>2];if((256-(r4-HEAP32[r1+88>>2]&255)|0)>>>0<3){return}r5=r1+352|0;r6=HEAP32[r5>>2];if((r6|0)<-127){r7=-127}else{r7=(r6|0)>127?127:r6}HEAP32[r5>>2]=r6-r7;r6=r1+356|0;r5=HEAP32[r6>>2];if((r5|0)<-127){r8=-127}else{r8=(r5|0)>127?127:r5}HEAP32[r6>>2]=r5-r8;r5=HEAP32[r1+360>>2];HEAP8[r4+(r1+92)|0]=r7>>>6&3|r8>>>4&12|r5<<3&16|r5<<5&32|64;r5=HEAP32[r3>>2]+1&255;HEAP32[r3>>2]=r5;HEAP8[r5+(r1+92)|0]=r7&63;r7=HEAP32[r3>>2]+1&255;HEAP32[r3>>2]=r7;HEAP8[r7+(r1+92)|0]=r8&63;HEAP32[r3>>2]=HEAP32[r3>>2]+1&255;return}else if((r2|0)==1){r2=r1+84|0;r3=HEAP32[r2>>2];if((256-(r3-HEAP32[r1+88>>2]&255)|0)>>>0<5){return}r8=HEAP32[r1+360>>2];r7=r8>>>1;HEAP8[r3+(r1+92)|0]=(r7&1|r8<<2&4|r7&2)^135;r7=HEAP32[r2>>2]+1&255;HEAP32[r2>>2]=r7;r8=r1+352|0;r3=r1+356|0;r5=HEAP32[r8>>2];if((r5|0)<-127){r9=-127}else{r9=(r5|0)>127?127:r5}HEAP32[r8>>2]=r5-r9;HEAP8[r7+(r1+92)|0]=r9;r9=HEAP32[r2>>2]+1&255;HEAP32[r2>>2]=r9;r7=HEAP32[r3>>2];if((r7|0)<-127){r10=-127}else{r10=(r7|0)>127?127:r7}HEAP32[r3>>2]=r7-r10;HEAP8[r9+(r1+92)|0]=-r10;r10=HEAP32[r2>>2]+1&255;HEAP32[r2>>2]=r10;r9=HEAP32[r8>>2];if((r9|0)<-127){r11=-127}else{r11=(r9|0)>127?127:r9}HEAP32[r8>>2]=r9-r11;HEAP8[r10+(r1+92)|0]=r11;r11=HEAP32[r2>>2]+1&255;HEAP32[r2>>2]=r11;r10=HEAP32[r3>>2];if((r10|0)<-127){r12=-127}else{r12=(r10|0)>127?127:r10}HEAP32[r3>>2]=r10-r12;HEAP8[r11+(r1+92)|0]=-r12;HEAP32[r2>>2]=HEAP32[r2>>2]+1&255;return}else{return}}function _chr_null_open(r1){var r2,r3;r1=_malloc(80);if((r1|0)==0){r2=0;return r2}r3=r1;_chr_init(r3,r1);HEAP32[r1+56>>2]=282;HEAP32[r1+60>>2]=358;HEAP32[r1+64>>2]=568;HEAP32[r1+68>>2]=442;HEAP32[r1+72>>2]=970;HEAP32[r1+76>>2]=1034;r2=r3;return r2}function _chr_null_close(r1){_free(HEAP32[r1>>2]);return}function _chr_null_read(r1,r2,r3){return 0}function _chr_null_write(r1,r2,r3){return r3}function _chr_null_get_ctl(r1,r2){HEAP32[r2>>2]=1792;return 0}function _chr_null_set_ctl(r1,r2){return 0}function _chr_null_set_params(r1,r2,r3,r4,r5){return 0}function _chr_posix_open(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=0;r3=0;r4=STACKTOP;r5=_malloc(100);if((r5|0)==0){r6=0;STACKTOP=r4;return r6}r7=r5;_chr_init(r7,r5);HEAP32[r5+56>>2]=92;HEAP32[r5+60>>2]=644;HEAP32[r5+64>>2]=668;r8=r5+80|0;HEAP32[r8>>2]=0;r9=r5+84|0;HEAP32[r9>>2]=0;r10=r5+88|0;HEAP32[r10>>2]=0;r11=r5+92|0;HEAP32[r11>>2]=-1;r12=r5+96|0;HEAP32[r12>>2]=-1;r5=_drv_get_option(r1,54320);HEAP32[r8>>2]=r5;do{if((r5|0)==0){HEAP32[r9>>2]=_drv_get_option(r1,56848);r13=_drv_get_option(r1,50296);HEAP32[r10>>2]=r13;r14=HEAP32[r8>>2];if((r14|0)==0){r15=HEAP32[r9>>2];if((r15|0)==0){if((r13|0)==0){if((_strncmp(r1,39584,6)|0)!=0){r6=r7;STACKTOP=r4;return r6}HEAP32[r11>>2]=0;HEAP32[r12>>2]=1;r6=r7;STACKTOP=r4;return r6}else{r16=r13}}else{if((_strcmp(r15,46256)|0)==0){HEAP32[r11>>2]=0;r17=r13}else{r13=_open(r15,256,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=0,r3));STACKTOP=r3;HEAP32[r11>>2]=r13;if((r13|0)<0){break}r17=HEAP32[r10>>2]}if((r17|0)==0){r6=r7;STACKTOP=r4;return r6}else{r16=r17}}if((_strcmp(r16,46256)|0)==0){HEAP32[r12>>2]=1;r6=r7;STACKTOP=r4;return r6}if((_strcmp(r16,42680)|0)==0){HEAP32[r12>>2]=2;r6=r7;STACKTOP=r4;return r6}else{r13=_open(r16,833,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=420,r3));STACKTOP=r3;HEAP32[r12>>2]=r13;if((r13|0)<0){break}else{r6=r7}STACKTOP=r4;return r6}}else{r18=r14;r2=4}}else{r18=r5;r2=4}}while(0);if(r2==4){if((_strcmp(r18,46256)|0)==0){HEAP32[r11>>2]=0;HEAP32[r12>>2]=1;r6=r7;STACKTOP=r4;return r6}if((_strcmp(r18,42680)|0)==0){HEAP32[r11>>2]=0;HEAP32[r12>>2]=2;r6=r7;STACKTOP=r4;return r6}r2=_open(r18,834,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=420,r3));STACKTOP=r3;HEAP32[r11>>2]=r2;if((r2|0)>=0){HEAP32[r12>>2]=r2;r6=r7;STACKTOP=r4;return r6}}_chr_posix_close(r7);r6=0;STACKTOP=r4;return r6}function _chr_posix_close(r1){var r2,r3;r2=HEAP32[r1>>2];r1=r2+96|0;r3=HEAP32[r1>>2];if((r3|0)>2){_close(r3)}r3=HEAP32[r2+92>>2];if((r3|0)>2?(r3|0)!=(HEAP32[r1>>2]|0):0){_close(r3)}r3=HEAP32[r2+88>>2];if((r3|0)!=0){_free(r3)}r3=HEAP32[r2+84>>2];if((r3|0)!=0){_free(r3)}r3=HEAP32[r2+80>>2];if((r3|0)==0){_free(r2);return}_free(r3);_free(r2);return}function _chr_posix_read(r1,r2,r3){var r4,r5,r6;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=HEAP32[r1>>2]+92|0;r1=HEAP32[r6>>2];if((r1|0)<0){STACKTOP=r4;return 0}HEAP32[r5>>2]=r1;HEAP16[r5+4>>1]=1;if((_poll(r5|0,1,0)|0)<0){STACKTOP=r4;return 0}if((HEAP16[r5+6>>1]&5)==0){STACKTOP=r4;return 0}else{r5=_read(HEAP32[r6>>2],r2,(r3|0)<0?2147483647:r3);STACKTOP=r4;return(r5|0)>0?r5:0}}function _chr_posix_write(r1,r2,r3){var r4,r5,r6,r7;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=HEAP32[r1>>2]+96|0;r1=HEAP32[r6>>2];if((r1|0)<0){r7=r3;STACKTOP=r4;return r7}HEAP32[r5>>2]=r1;HEAP16[r5+4>>1]=4;if((_poll(r5|0,1,0)|0)<0){r7=0;STACKTOP=r4;return r7}if((HEAP16[r5+6>>1]&5)==0){r7=0;STACKTOP=r4;return r7}else{r7=_write(HEAP32[r6>>2],r2,(r3|0)<0?2147483647:r3);STACKTOP=r4;return(r7|0)>0?r7:0}}function _chr_pty_open(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+64|0;r4=r3;r5=_malloc(92);if((r5|0)==0){r6=0;STACKTOP=r3;return r6}r7=r5;_chr_init(r7,r5);HEAP32[r5+56>>2]=796;HEAP32[r5+60>>2]=1024;HEAP32[r5+64>>2]=894;r8=r5+84|0;HEAP32[r8>>2]=0;r9=r5+88|0;HEAP32[r9>>2]=_drv_get_option(r1,54280);r1=_posix_openpt(258);r10=r5+80|0;HEAP32[r10>>2]=r1;if(((r1|0)>=0?(_grantpt(r1)|0)==0:0)?(_unlockpt(r1)|0)==0:0){r11=_ptsname(r1);if((r11|0)!=0?_strlen(r11)>>>0<=255:0){r1=___strdup(r11);HEAP32[r8>>2]=r1;r11=HEAP32[_stderr>>2];_fprintf(r11,50280,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r1,r2));STACKTOP=r2;r1=HEAP32[r10>>2];r12=_fcntl(r1,1,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;if((r12|0)!=-1){_fcntl(r1,4,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r12|2048,r2));STACKTOP=r2}r12=HEAP32[r10>>2];if((_tcgetattr(r12,r4)|0)==0){r10=r4|0;HEAP32[r10>>2]=HEAP32[r10>>2]&-449;r10=r4+12|0;HEAP32[r10>>2]=HEAP32[r10>>2]&-25;if((_tcsetattr(r12,0,r4)|0)==0){_tcflush(r12,2)}}r12=HEAP32[r9>>2];if((r12|0)==0){r6=r7;STACKTOP=r3;return r6}if((_symlink(HEAP32[r8>>2],r12)|0)==0){r6=r7;STACKTOP=r3;return r6}r12=HEAP32[r9>>2];_fprintf(r11,56800,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[r8>>2],HEAP32[r2+8>>2]=r12,r2));STACKTOP=r2;r6=r7;STACKTOP=r3;return r6}}r7=HEAP32[r5>>2];r5=r7+88|0;r2=HEAP32[r5>>2];if((r2|0)!=0){_unlink(r2);_free(HEAP32[r5>>2])}r5=HEAP32[r7+84>>2];if((r5|0)!=0){_free(r5)}r5=HEAP32[r7+80>>2];if((r5|0)>-1){_close(r5)}_free(r7);r6=0;STACKTOP=r3;return r6}function _chr_pty_close(r1){var r2,r3;r2=HEAP32[r1>>2];r1=r2+88|0;r3=HEAP32[r1>>2];if((r3|0)!=0){_unlink(r3);_free(HEAP32[r1>>2])}r1=HEAP32[r2+84>>2];if((r1|0)!=0){_free(r1)}r1=HEAP32[r2+80>>2];if((r1|0)<=-1){_free(r2);return}_close(r1);_free(r2);return}function _chr_pty_read(r1,r2,r3){var r4;r4=HEAP32[HEAP32[r1>>2]+80>>2];if((r4|0)<0){return 0}else{r1=_read(r4,r2,(r3|0)<0?2147483647:r3);return(r1|0)>0?r1:0}}function _chr_pty_write(r1,r2,r3){var r4;r4=HEAP32[HEAP32[r1>>2]+80>>2];if((r4|0)<0){return r3}else{r1=_write(r4,r2,(r3|0)<0?2147483647:r3);return(r1|0)>0?r1:0}}function _chr_stdio_open(r1){var r2,r3,r4,r5,r6;r2=_malloc(92);if((r2|0)==0){r3=0;return r3}r4=r2;_chr_init(r4,r2);HEAP32[r2+56>>2]=898;HEAP32[r2+60>>2]=40;HEAP32[r2+64>>2]=542;r5=r2+88|0;HEAP32[r5>>2]=0;r6=r2+80|0;HEAP32[r6>>2]=_drv_get_option(r1,54256);HEAP32[r2+84>>2]=_drv_get_option_bool(r1,56792,1);r1=HEAP32[r6>>2];if((r1|0)==0){r3=r4;return r3}if((_strcmp(r1,50264)|0)==0){HEAP32[r5>>2]=HEAP32[_stdout>>2];r3=r4;return r3}r6=_fopen(r1,46248);HEAP32[r5>>2]=r6;if((r6|0)!=0){r3=r4;return r3}r4=HEAP32[r2>>2];r2=HEAP32[r4+80>>2];if((r2|0)!=0){_free(r2)}r2=HEAP32[r4+88>>2];if(!((r2|0)==0|(r2|0)==(HEAP32[_stdin>>2]|0)|(r2|0)==(HEAP32[_stdout>>2]|0)|(r2|0)==(HEAP32[_stderr>>2]|0))){_fclose(r2)}_free(r4);r3=0;return r3}function _chr_stdio_close(r1){var r2;r2=HEAP32[r1>>2];r1=HEAP32[r2+80>>2];if((r1|0)!=0){_free(r1)}r1=HEAP32[r2+88>>2];if((r1|0)==0|(r1|0)==(HEAP32[_stdin>>2]|0)|(r1|0)==(HEAP32[_stdout>>2]|0)|(r1|0)==(HEAP32[_stderr>>2]|0)){_free(r2);return}_fclose(r1);_free(r2);return}function _chr_stdio_read(r1,r2,r3){return 0}function _chr_stdio_write(r1,r2,r3){var r4,r5,r6,r7;r4=HEAP32[r1>>2];r1=r4+88|0;r5=HEAP32[r1>>2];if((r5|0)==0){r6=r3;return r6}r7=_fwrite(r2,1,r3,r5);if((HEAP32[r4+84>>2]|0)==0){r6=r7;return r6}_fflush(HEAP32[r1>>2]);r6=r7;return r6}function _pri_decode_gcr_trk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1168|0;r6=r5;r7=r5+8;r8=r5+16;r9=r5+24;r10=r5+32;r11=r5+40;r12=r5+48;r13=r5+576;r14=r5+584;r15=r5+592;r16=r5+600;r17=r5+608;r18=r5+616;r19=r5+624;r20=r5+632;r21=r5+1160;r22=_psi_trk_new(r2);if((r22|0)==0){r23=0;STACKTOP=r5;return r23}_pri_trk_set_pos(r1,0);r2=r1+16|0;if((HEAP8[r2]|0)!=0){r23=r22;STACKTOP=r5;return r23}r24=r1+12|0;r25=r20|0;r26=r20+1|0;r27=r20+2|0;r28=r12+524|0;r29=r12+525|0;r30=r12+526|0;r31=r20+12|0;r32=HEAP32[_stderr>>2];r33=0;r34=0;while(1){_pri_trk_get_bits(r1,r21,8);r35=HEAP32[r21>>2];if((r35&128|0)==0){r36=r35;r37=8;while(1){_pri_trk_get_bits(r1,r21,1);r38=r36<<1;r39=HEAP32[r21>>2]&1|r38;r40=r37+1|0;if((r38&128|0)==0&r40>>>0<64){r36=r39;r37=r40}else{break}}r41=r40>>>0>63?0:r39}else{r41=r35}r37=r41&255;r36=HEAP32[r24>>2];r38=HEAP8[r2];if(r33<<24>>24==-43&r34<<24>>24==-86?(r41&255|0)==150:0){_pri_trk_get_bits(r1,r19,8);r42=HEAP32[r19>>2];if((r42&128|0)==0){r43=r42;r44=8;while(1){_pri_trk_get_bits(r1,r19,1);r45=r43<<1;r46=HEAP32[r19>>2]&1|r45;r47=r44+1|0;if((r45&128|0)==0&r47>>>0<64){r43=r46;r44=r47}else{break}}r48=r47>>>0>63?0:r46}else{r48=r42}r44=HEAP8[16168+(r48&255)|0];r43=r44&255;_pri_trk_get_bits(r1,r18,8);r35=HEAP32[r18>>2];if((r35&128|0)==0){r45=r35;r49=8;while(1){_pri_trk_get_bits(r1,r18,1);r50=r45<<1;r51=HEAP32[r18>>2]&1|r50;r52=r49+1|0;if((r50&128|0)==0&r52>>>0<64){r45=r51;r49=r52}else{break}}r53=r52>>>0>63?0:r51}else{r53=r35}r49=HEAP8[16168+(r53&255)|0];r45=r49&255;_pri_trk_get_bits(r1,r17,8);r42=HEAP32[r17>>2];if((r42&128|0)==0){r50=r42;r54=8;while(1){_pri_trk_get_bits(r1,r17,1);r55=r50<<1;r56=HEAP32[r17>>2]&1|r55;r57=r54+1|0;if((r55&128|0)==0&r57>>>0<64){r50=r56;r54=r57}else{break}}r58=r57>>>0>63?0:r56}else{r58=r42}r54=HEAP8[16168+(r58&255)|0];r50=r54&255;_pri_trk_get_bits(r1,r16,8);r35=HEAP32[r16>>2];if((r35&128|0)==0){r55=r35;r59=8;while(1){_pri_trk_get_bits(r1,r16,1);r60=r55<<1;r61=HEAP32[r16>>2]&1|r60;r62=r59+1|0;if((r60&128|0)==0&r62>>>0<64){r55=r61;r59=r62}else{break}}r63=r62>>>0>63?0:r61}else{r63=r35}r59=HEAP8[16168+(r63&255)|0];_pri_trk_get_bits(r1,r15,8);r55=HEAP32[r15>>2];if((r55&128|0)==0){r42=r55;r60=8;while(1){_pri_trk_get_bits(r1,r15,1);r64=r42<<1;r65=HEAP32[r15>>2]&1|r64;r66=r60+1|0;if((r64&128|0)==0&r66>>>0<64){r42=r65;r60=r66}else{break}}r67=r66>>>0>63?0:r65}else{r67=r55}r60=HEAP8[16168+(r67&255)|0];r42=r50<<6&1984|r43&63;r35=r50>>>5&3;r64=_psi_sct_new(r42,r35,r45,512);if((r64|0)!=0){_psi_sct_set_encoding(r64,3);_psi_sct_set_flags(r64,8,1);_psi_sct_set_gcr_format(r64,r59);if(r60<<24>>24!=(r49^r44^r54^r59)<<24>>24){_psi_sct_set_flags(r64,1,1)}HEAP8[r25]=0;HEAP8[r26]=0;HEAP8[r27]=0;r60=0;r68=0;r69=0;while(1){HEAP8[r25]=r69;HEAP8[r26]=r68;_pri_trk_get_bits(r1,r14,8);r70=HEAP32[r14>>2];if((r70&128|0)==0){r71=r70;r72=8;while(1){_pri_trk_get_bits(r1,r14,1);r73=r71<<1;r74=HEAP32[r14>>2]&1|r73;r75=r72+1|0;if((r73&128|0)==0&r75>>>0<64){r71=r74;r72=r75}else{break}}r76=r75>>>0>63?0:r74;r77=HEAP8[r25]}else{r76=r70;r77=r69}r72=r76&255;HEAP8[r27]=r72;if(r77<<24>>24==-43?(HEAP8[r26]|0)==-86:0){r3=33;break}r71=r60+1|0;if(r71>>>0>=64){break}r60=r71;r68=r72;r69=HEAP8[r26]}if(r3==33?(r3=0,(r76&255|0)==173):0){_pri_trk_get_bits(r1,r13,8);r69=HEAP32[r13>>2];if((r69&128|0)==0){r68=r69;r59=8;while(1){_pri_trk_get_bits(r1,r13,1);r54=r68<<1;r78=HEAP32[r13>>2]&1|r54;r79=r59+1|0;if((r54&128|0)==0&r79>>>0<64){r68=r78;r59=r79}else{break}}r80=r79>>>0>63?0:r78}else{r80=r69}r59=HEAP8[16168+(r80&255)|0];HEAP8[r27]=r59;if(!(r59<<24>>24!=r49<<24>>24|r60>>>0>63)){_psi_sct_set_flags(r64,8,0);r59=0;r68=0;while(1){if(((r59>>>0)%3&-1|0)==0){_pri_trk_get_bits(r1,r11,8);r54=HEAP32[r11>>2];if((r54&128|0)==0){r44=r54;r50=8;while(1){_pri_trk_get_bits(r1,r11,1);r43=r44<<1;r81=HEAP32[r11>>2]&1|r43;r82=r50+1|0;if((r43&128|0)==0&r82>>>0<64){r44=r81;r50=r82}else{break}}r83=r82>>>0>63?0:r81}else{r83=r54}r84=HEAP8[16168+(r83&255)|0]<<2}else{r84=r68}_pri_trk_get_bits(r1,r10,8);r50=HEAP32[r10>>2];if((r50&128|0)==0){r44=r50;r70=8;while(1){_pri_trk_get_bits(r1,r10,1);r43=r44<<1;r85=HEAP32[r10>>2]&1|r43;r86=r70+1|0;if((r43&128|0)==0&r86>>>0<64){r44=r85;r70=r86}else{break}}r87=r86>>>0>63?0:r85}else{r87=r50}HEAP8[r12+r59|0]=HEAP8[16168+(r87&255)|0]&63|r84&-64;r70=r59+1|0;if(r70>>>0<524){r59=r70;r68=r84<<2}else{break}}_pri_trk_get_bits(r1,r9,8);r68=HEAP32[r9>>2];if((r68&128|0)==0){r59=r68;r60=8;while(1){_pri_trk_get_bits(r1,r9,1);r49=r59<<1;r88=HEAP32[r9>>2]&1|r49;r89=r60+1|0;if((r49&128|0)==0&r89>>>0<64){r59=r88;r60=r89}else{break}}r90=r89>>>0>63?0:r88}else{r90=r68}r60=HEAP8[16168+(r90&255)|0];r59=r60<<2;_pri_trk_get_bits(r1,r8,8);r49=HEAP32[r8>>2];if((r49&128|0)==0){r69=r49;r70=8;while(1){_pri_trk_get_bits(r1,r8,1);r44=r69<<1;r91=HEAP32[r8>>2]&1|r44;r92=r70+1|0;if((r44&128|0)==0&r92>>>0<64){r69=r91;r70=r92}else{break}}r93=r92>>>0>63?0:r91}else{r93=r49}r70=HEAP8[16168+(r93&255)|0]&63|r59&-64;HEAP8[r28]=r70;_pri_trk_get_bits(r1,r7,8);r69=HEAP32[r7>>2];if((r69&128|0)==0){r68=r69;r44=8;while(1){_pri_trk_get_bits(r1,r7,1);r54=r68<<1;r94=HEAP32[r7>>2]&1|r54;r95=r44+1|0;if((r54&128|0)==0&r95>>>0<64){r68=r94;r44=r95}else{break}}r96=r95>>>0>63?0:r94}else{r96=r69}r44=HEAP8[16168+(r96&255)|0]&63|r60<<4&-64;HEAP8[r29]=r44;_pri_trk_get_bits(r1,r6,8);r68=HEAP32[r6>>2];if((r68&128|0)==0){r59=r68;r49=8;while(1){_pri_trk_get_bits(r1,r6,1);r54=r59<<1;r97=HEAP32[r6>>2]&1|r54;r98=r49+1|0;if((r54&128|0)==0&r98>>>0<64){r59=r97;r49=r98}else{break}}r99=r98>>>0>63?0:r97}else{r99=r68}r49=HEAP8[16168+(r99&255)|0]&63|r60<<6;HEAP8[r30]=r49;r59=0;r69=0;r54=0;r43=0;while(1){if(((r59>>>0)%3&-1|0)==0){r100=r43<<1&510|r43>>>7&1}else{r100=r43}r55=HEAPU8[r12+r59|0]^r100;r101=(r100>>>8&1)+r69+(r55&255)|0;HEAP8[r20+r59|0]=r55;r55=r59+1|0;if(r55>>>0<524){r59=r55;r69=r54;r54=r100&255;r43=r101}else{break}}if(!(r70<<24>>24==(r100&255)<<24>>24&r44<<24>>24==(r101&255)<<24>>24?(r49&255|0)==(r54|0):0)){r3=68}if(r3==68){r3=0;_fprintf(r32,54208,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r42,HEAP32[r4+8>>2]=r35,HEAP32[r4+16>>2]=r45,r4));STACKTOP=r4;_psi_sct_set_flags(r64,2,1)}_memcpy(HEAP32[r64+24>>2],r31,512)|0;_psi_sct_set_tags(r64,r25,12)}}_psi_trk_add_sector(r22,r64)}HEAP32[r24>>2]=r36;HEAP8[r2]=r38}if(r38<<24>>24==0){r33=r34;r34=r37}else{r23=r22;break}}STACKTOP=r5;return r23}function _pri_decode_gcr(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=0;r3=_psi_img_new();if((r3|0)==0){r4=0;return r4}r5=r1|0;r6=HEAP32[r5>>2];if((r6|0)==0){r4=r3;return r4}r7=r1+4|0;r1=0;r8=r6;L7:while(1){r6=HEAP32[HEAP32[r7>>2]+(r1<<2)>>2];if((r6|0)!=0){r9=r6|0;if((HEAP32[r9>>2]|0)!=0){r10=r6+4|0;r6=0;while(1){r11=HEAP32[HEAP32[r10>>2]+(r6<<2)>>2];if((r11|0)==0){r12=_psi_trk_new(r6)}else{r12=_pri_decode_gcr_trk(r11,r6)}if((HEAP16[r12+2>>1]|0)==0){r11=r6+1|0;if((r11|0)==(HEAP32[r9>>2]|0)){_psi_trk_del(r12);r13=r11}else{r2=13}}else{r2=13}if(r2==13){r2=0;if((r12|0)==0){break L7}_psi_img_add_track(r3,r12,r1);r13=r6+1|0}if(r13>>>0<HEAP32[r9>>2]>>>0){r6=r13}else{break}}r14=HEAP32[r5>>2]}else{r14=r8}}else{r14=r8}r6=r1+1|0;if(r6>>>0<r14>>>0){r1=r6;r8=r14}else{r4=r3;r2=19;break}}if(r2==19){return r4}_psi_img_del(r3);r4=0;return r4}function _pri_encode_gcr_trk(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=STACKTOP;STACKTOP=STACKTOP+1056|0;r5=r4;r6=r4+528;r7=r6|0;_pri_trk_set_pos(r1,0);r8=0;while(1){_pri_trk_set_bits(r1,255,10);r9=r8+1|0;if(r9>>>0<32){r8=r9}else{break}}r8=r2+2|0;if((HEAP16[r8>>1]|0)!=0){r9=r2+4|0;r2=r6+12|0;r10=r5|0;r11=r5+524|0;r12=r5+525|0;r13=r5+526|0;r14=r5+1|0;r15=r5+522|0;r16=r5+523|0;r17=0;while(1){r18=HEAP32[HEAP32[r9>>2]+(r17<<2)>>2];r19=HEAP16[r18+10>>1];r20=HEAP32[r18+24>>2];if((r19&65535)<512){_memcpy(r2,r20,r19&65535)|0}else{_memcpy(r2,r20,512)|0}r20=_psi_sct_get_gcr_format(r18);r19=(r20|0)==0;_psi_sct_get_tags(r18,r7,12);r21=HEAP16[r18+4>>1];r22=r21&65535;r23=HEAP16[r18+6>>1];r24=HEAP16[r18+8>>1];r18=r22>>>6;r25=0;while(1){_pri_trk_set_bits(r1,255,10);r26=r25+1|0;if(r26>>>0<38){r25=r26}else{break}}r25=r19?r3:r20;r26=(r23&65535)<<5|r18&31;_pri_trk_set_bits(r1,14002838,24);_pri_trk_set_bits(r1,HEAPU8[16104+(r22&63)|0],8);r27=HEAPU8[16104+(r24&63)|0];_pri_trk_set_bits(r1,r27,8);_pri_trk_set_bits(r1,HEAPU8[16104+(r26&63)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(r25&63)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+((r26^r25^(r24^r21)&65535)&63)|0],8);_pri_trk_set_bits(r1,57002,16);_pri_trk_set_bits(r1,255,10);_pri_trk_set_bits(r1,255,10);_pri_trk_set_bits(r1,255,10);_pri_trk_set_bits(r1,255,10);_pri_trk_set_bits(r1,255,10);_pri_trk_set_bits(r1,255,10);_pri_trk_set_bits(r1,255,10);_pri_trk_set_bits(r1,255,10);_pri_trk_set_bits(r1,14002861,24);_pri_trk_set_bits(r1,r27,8);r27=0;r25=0;r26=0;r28=0;while(1){if(((r27>>>0)%3&-1|0)==0){r29=r28<<1&510|r28>>>7&1}else{r29=r28}r30=HEAPU8[r6+r27|0];r31=(r29>>>8&1)+r25+r30|0;HEAP8[r5+r27|0]=r30^r29;r30=r27+1|0;if(r30>>>0<524){r27=r30;r25=r26;r26=r29&255;r28=r31}else{break}}HEAP8[r11]=r29;HEAP8[r12]=r31;HEAP8[r13]=r26;r28=0;r25=r10;r27=r14;r21=HEAPU8[r14]>>>4&12|HEAPU8[r10]>>>2&48;while(1){r24=r25+2|0;_pri_trk_set_bits(r1,HEAPU8[16104+(HEAPU8[r24]>>>6|r21)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(HEAP8[r25]&63)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(HEAP8[r27]&63)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(HEAP8[r24]&63)|0],8);r24=r25+3|0;r22=r28+3|0;r18=r25+4|0;r32=HEAPU8[r18]>>>4&12|HEAPU8[r24]>>>2&48;if(r22>>>0<522){r28=r22;r25=r24;r27=r18;r21=r32}else{break}}_pri_trk_set_bits(r1,HEAPU8[r32+16104|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(HEAP8[r15]&63)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(HEAP8[r16]&63)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(r29>>>2&48|r26>>>6|r31>>>4&12)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(r29&63)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(r31&63)|0],8);_pri_trk_set_bits(r1,HEAPU8[16104+(r26&63)|0],8);_pri_trk_set_bits(r1,57002,16);r21=r17+1|0;if(r21>>>0<HEAPU16[r8>>1]>>>0){r17=r21}else{break}}}if((HEAP8[r1+16|0]|0)!=0){r33=1;r34=524;r35=0;STACKTOP=r4;return r33}r17=HEAP32[r1+4>>2];r8=HEAP32[r1+12>>2];if((r17|0)==(r8|0)){r33=0;r34=524;r35=0;STACKTOP=r4;return r33}r31=r17-r8|0;while(1){r8=r31>>>0<10?r31:10;_pri_trk_set_bits(r1,255>>>((10-r8|0)>>>0),r8);if((r31|0)==(r8|0)){r33=0;break}else{r31=r31-r8|0}}r34=524;r35=0;STACKTOP=r4;return r33}function _pri_encode_gcr_img(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=0;r4=r2|0;r5=HEAP16[r4>>1];r6=r5<<16>>16==0;if(r6){r7=0;return r7}r8=HEAP32[r2+4>>2];r9=r5&65535;r10=0;while(1){r11=r10+1|0;if(HEAPU16[HEAP32[r8+(r10<<2)>>2]+2>>1]>1){r12=34;break}if(r11>>>0<r9>>>0){r10=r11}else{r12=2;break}}if(r6){r7=0;return r7}r6=r2+4|0;r2=0;r10=r5;L11:while(1){r5=HEAP32[HEAP32[r6>>2]+(r2<<2)>>2];if(r2>>>0<80){r13=HEAP32[16080+(r2>>>4<<2)>>2]}else{r13=0}r9=r5+2|0;if((HEAP16[r9>>1]|0)==0){r14=r10}else{r8=r5+4|0;r5=0;while(1){r11=HEAP32[HEAP32[r8>>2]+(r5<<2)>>2];r15=_pri_img_get_track(r1,r2,r5,1);if((r15|0)==0){r7=1;r3=17;break L11}if((_pri_trk_set_size(r15,r13)|0)!=0){r7=1;r3=17;break L11}_pri_trk_set_clock(r15,5e5);r16=r5+1|0;if((_pri_encode_gcr_trk(r15,r11,r12)|0)!=0){r7=1;r3=17;break L11}if(r16>>>0<HEAPU16[r9>>1]>>>0){r5=r16}else{break}}r14=HEAP16[r4>>1]}r5=r2+1|0;if(r5>>>0<(r14&65535)>>>0){r2=r5;r10=r14}else{r7=0;r3=17;break}}if(r3==17){return r7}}function _pri_encode_gcr(r1){var r2,r3;r2=_pri_img_new();if((r2|0)!=0){if((_pri_encode_gcr_img(r2,r1)|0)==0){r3=r2}else{_pri_img_del(r2);r3=0}}else{r3=0}return r3}function _pri_get_uint16_be(r1,r2){return HEAPU8[r1+r2|0]<<8|HEAPU8[r1+(r2+1)|0]}function _pri_get_uint16_le(r1,r2){return HEAPU8[r1+(r2+1)|0]<<8|HEAPU8[r1+r2|0]}function _pri_get_uint32_be(r1,r2){return((HEAPU8[r1+r2|0]<<8|HEAPU8[r1+(r2+1)|0])<<8|HEAPU8[r1+(r2+2)|0])<<8|HEAPU8[r1+(r2+3)|0]}function _pri_set_uint32_be(r1,r2,r3){HEAP8[r1+r2|0]=r3>>>24;HEAP8[r1+(r2+1)|0]=r3>>>16;HEAP8[r1+(r2+2)|0]=r3>>>8;HEAP8[r1+(r2+3)|0]=r3;return}function _pri_read(r1,r2,r3){return(_fread(r2,1,r3,r1)|0)!=(r3|0)|0}function _pri_read_ofs(r1,r2,r3,r4){var r5;if((_fseek(r1,r2,0)|0)!=0){r5=1;return r5}r5=(_fread(r3,1,r4,r1)|0)!=(r4|0)|0;return r5}function _pri_write(r1,r2,r3){return(_fwrite(r2,1,r3,r1)|0)!=(r3|0)|0}function _pri_img_load(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;if((r2|0)==0){r3=63024;r4=0;while(1){r5=r1+r4|0;r6=HEAP8[r5];if(r6<<24>>24==46){r7=r5}else if(r6<<24>>24==0){break}else{r7=r3}r3=r7;r4=r4+1|0}if((_strcasecmp(r3,46224)|0)!=0){if((_strcasecmp(r3,42672)|0)==0){r8=2}else{r4=(_strcasecmp(r3,39576)|0)==0;r8=r4?3:2}}else{r8=1}}else{r8=r2}r2=_fopen(r1,54200);if((r2|0)==0){r9=0;return r9}if((r8|0)==1){r10=_pri_load_pbit(r2)}else if((r8|0)==3){r10=_pri_load_tc(r2)}else if((r8|0)==2){r10=_pri_load_pri(r2)}else{r10=0}_fclose(r2);r9=r10;return r9}function _pri_img_save(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;if((r3|0)==0){r4=63024;r5=0;while(1){r6=r1+r5|0;r7=HEAP8[r6];if(r7<<24>>24==46){r8=r6}else if(r7<<24>>24==0){break}else{r8=r4}r4=r8;r5=r5+1|0}if((_strcasecmp(r4,46224)|0)!=0){if((_strcasecmp(r4,42672)|0)==0){r9=2}else{r5=(_strcasecmp(r4,39576)|0)==0;r9=r5?3:2}}else{r9=1}}else{r9=r3}r3=_fopen(r1,56784);if((r3|0)==0){r10=1;return r10}if((r9|0)==3){r11=_pri_save_tc(r3,r2)}else if((r9|0)==1){r11=_pri_save_pbit(r3,r2)}else if((r9|0)==2){r11=_pri_save_pri(r3,r2)}else{r11=1}_fclose(r3);r10=r11;return r10}function _pri_trk_set_clock(r1,r2){HEAP32[r1>>2]=r2;return}function _pri_trk_set_size(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=r1+4|0;if((HEAP32[r3>>2]|0)==(r2|0)){r4=0;return r4}HEAP32[r1+12>>2]=0;HEAP8[r1+16|0]=0;r5=r1+8|0;r1=HEAP32[r5>>2];if((r2|0)==0){_free(r1);HEAP32[r3>>2]=0;HEAP32[r5>>2]=0;r4=0;return r4}r6=_realloc(r1,(r2+7|0)>>>3);if((r6|0)==0){r4=1;return r4}r1=HEAP32[r3>>2];r7=r1>>>0>r2>>>0?r2:r1;r1=r2-1|0;if((r1|7)>>>0>=r7>>>0){r8=r7>>>3;r9=r1>>>3;r1=r6+r8|0;HEAP8[r1]=HEAPU8[r1]&(255>>>((r7&7)>>>0)^255);if((r8|0)!=(r9|0)){r7=r8+1|0;if(r7>>>0<r9>>>0){_memset(r6+r7|0,0,r9-1-r8|0)|0}HEAP8[r6+r9|0]=0}}HEAP32[r3>>2]=r2;HEAP32[r5>>2]=r6;r4=0;return r4}function _pri_trk_set_pos(r1,r2){var r3;r3=HEAP32[r1+4>>2];if((r3|0)==0){return}HEAP32[r1+12>>2]=(r2>>>0)%(r3>>>0)&-1;HEAP8[r1+16|0]=0;return}function _pri_trk_get_bits(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r4=HEAP32[r1+4>>2];if((r4|0)==0){HEAP32[r2>>2]=0;r5=1;return r5}r6=r1+12|0;r7=HEAP32[r6>>2];if((r3|0)==0){r8=0;r9=r1+16|0}else{r10=HEAP32[r1+8>>2];r11=r1+16|0;r1=r3;r3=0;r12=128>>>((r7&7)>>>0)&255;r13=r10+(r7>>>3)|0;r14=r7;while(1){r7=(HEAP8[r13]&r12)<<24>>24!=0|r3<<1;r15=(r12&255)>>>1;r16=r14+1|0;HEAP32[r6>>2]=r16;if(r16>>>0<r4>>>0){r17=r15<<24>>24==0;r18=r17?r13+1|0:r13;r19=r17?-128:r15;r20=r16}else{HEAP32[r6>>2]=0;HEAP8[r11]=1;r18=r10;r19=-128;r20=0}r16=r1-1|0;if((r16|0)==0){r8=r7;r9=r11;break}else{r1=r16;r3=r7;r12=r19;r13=r18;r14=r20}}}HEAP32[r2>>2]=r8;r5=HEAP8[r9]|0;return r5}function _pri_trk_set_bits(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r4=r1+4|0;if((HEAP32[r4>>2]|0)==0){r5=1;return r5}r6=r1+8|0;r7=r1+12|0;r8=HEAP32[r7>>2];if((r3|0)==0){r9=r1+16|0}else{r10=r1+16|0;r1=r3;r3=128>>>((r8&7)>>>0)&255;r11=HEAP32[r6>>2]+(r8>>>3)|0;while(1){r8=r1-1|0;if((1<<r8&r2|0)==0){r12=HEAP8[r11]&~r3}else{r12=HEAP8[r11]|r3}HEAP8[r11]=r12;r13=(r3&255)>>>1;r14=HEAP32[r7>>2]+1|0;HEAP32[r7>>2]=r14;if(r14>>>0<HEAP32[r4>>2]>>>0){r14=r13<<24>>24==0;r15=r14?r11+1|0:r11;r16=r14?-128:r13}else{r13=HEAP32[r6>>2];HEAP32[r7>>2]=0;HEAP8[r10]=1;r15=r13;r16=-128}if((r8|0)==0){r9=r10;break}else{r1=r8;r3=r16;r11=r15}}}r5=HEAP8[r9]|0;return r5}function _pri_trk_rotate(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=r1+4|0;r4=HEAP32[r3>>2];if(r4>>>0<=r2>>>0){r5=1;return r5}if((r2|0)==0){r5=0;return r5}r6=(r4+7|0)>>>3;r7=_malloc(r6);if((r7|0)==0){r5=1;return r5}_memset(r7,0,r6)|0;r6=r1+8|0;if((r4|0)!=0){r1=r2;r8=0;r9=-128;r10=128>>>((r2&7)>>>0)&255;r11=HEAP32[r6>>2]+(r2>>>3)|0;r2=r7;r12=r4;while(1){if((HEAP8[r11]&r10)<<24>>24==0){r13=r12}else{HEAP8[r2]=HEAP8[r2]|r9;r13=HEAP32[r3>>2]}r4=(r9&255)>>>1;r14=r4<<24>>24==0;r15=r1+1|0;if(r15>>>0<r13>>>0){r16=(r10&255)>>>1;r17=r16<<24>>24==0;r18=r17?r11+1|0:r11;r19=r17?-128:r16;r20=r15}else{r18=HEAP32[r6>>2];r19=-128;r20=0}r15=r8+1|0;if(r15>>>0<r13>>>0){r1=r20;r8=r15;r9=r14?-128:r4;r10=r19;r11=r18;r2=r14?r2+1|0:r2;r12=r13}else{break}}}_free(HEAP32[r6>>2]);HEAP32[r6>>2]=r7;r5=0;return r5}function _pri_cyl_get_track(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=r1|0;r5=HEAP32[r4>>2]>>>0>r2>>>0;if(r5){r6=HEAP32[HEAP32[r1+4>>2]+(r2<<2)>>2];if((r6|0)!=0){r7=r6;return r7}}if((r3|0)==0){r7=0;return r7}r3=_malloc(20);r6=r3;if((r3|0)==0){r7=0;return r7}r8=r3+8|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP8[r3+16|0]=0;r9=r1+4|0;r1=HEAP32[r9>>2];if(r5){r5=HEAP32[r1+(r2<<2)>>2];if((r5|0)==0){r10=r1}else{_free(HEAP32[r5+8>>2]);_free(r5);r10=HEAP32[r9>>2]}HEAP32[r10+(r2<<2)>>2]=r6;r7=r6;return r7}r10=r2+1|0;r5=_realloc(r1,r10<<2);r1=r5;if((r5|0)==0){_free(HEAP32[r8>>2]);_free(r3);r7=0;return r7}r3=HEAP32[r4>>2];if(r3>>>0<r2>>>0){_memset(r5+(r3<<2)|0,0,r2-r3<<2)|0}HEAP32[r1+(r2<<2)>>2]=r6;HEAP32[r9>>2]=r1;HEAP32[r4>>2]=r10;r7=r6;return r7}function _pri_img_new(){var r1,r2;r1=_malloc(16);if((r1|0)==0){r2=0;return r2}HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;HEAP32[r1+8>>2]=0;HEAP32[r1+12>>2]=0;r2=r1;return r2}function _pri_img_del(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;if((r1|0)==0){return}r2=r1|0;r3=HEAP32[r2>>2];r4=r1+4|0;if((r3|0)!=0){r5=0;r6=r3;while(1){r3=HEAP32[HEAP32[r4>>2]+(r5<<2)>>2];if((r3|0)==0){r7=r6}else{r8=r3|0;r9=HEAP32[r8>>2];r10=r3+4|0;r11=HEAP32[r10>>2];if((r9|0)==0){r12=r11}else{r13=0;r14=r11;r11=r9;while(1){r9=HEAP32[r14+(r13<<2)>>2];if((r9|0)==0){r15=r11;r16=r14}else{_free(HEAP32[r9+8>>2]);_free(r9);r15=HEAP32[r8>>2];r16=HEAP32[r10>>2]}r9=r13+1|0;if(r9>>>0<r15>>>0){r13=r9;r14=r16;r11=r15}else{r12=r16;break}}}_free(r12);_free(r3);r7=HEAP32[r2>>2]}r11=r5+1|0;if(r11>>>0<r7>>>0){r5=r11;r6=r7}else{break}}}_free(HEAP32[r1+12>>2]);_free(HEAP32[r4>>2]);_free(r1);return}function _pri_img_get_cylinder(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;if(HEAP32[r1>>2]>>>0>r2>>>0){r4=HEAP32[HEAP32[r1+4>>2]+(r2<<2)>>2];if((r4|0)!=0){r5=r4;return r5}}if((r3|0)==0){r5=0;return r5}r3=_malloc(8);if((r3|0)==0){r5=0;return r5}r4=r3;r6=r3;HEAP32[r6>>2]=0;r7=r3+4|0;HEAP32[r7>>2]=0;if((_pri_img_set_cylinder(r1,r4,r2)|0)==0){r5=r4;return r5}r4=HEAP32[r6>>2];r2=HEAP32[r7>>2];if((r4|0)==0){r8=r2}else{r1=0;r9=r2;r2=r4;while(1){r4=HEAP32[r9+(r1<<2)>>2];if((r4|0)==0){r10=r2;r11=r9}else{_free(HEAP32[r4+8>>2]);_free(r4);r10=HEAP32[r6>>2];r11=HEAP32[r7>>2]}r4=r1+1|0;if(r4>>>0<r10>>>0){r1=r4;r9=r11;r2=r10}else{r8=r11;break}}}_free(r8);_free(r3);r5=0;return r5}function _pri_img_set_cylinder(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=0;r5=r1|0;r6=HEAP32[r5>>2];r7=r1+4|0;r1=HEAP32[r7>>2];if(r6>>>0<=r3>>>0){r8=r3+1|0;r9=_realloc(r1,r8<<2);r10=r9;if((r9|0)==0){r11=1;return r11}r12=HEAP32[r5>>2];if(r12>>>0<r3>>>0){_memset(r9+(r12<<2)|0,0,r3-r12<<2)|0}HEAP32[r10+(r3<<2)>>2]=r2;HEAP32[r7>>2]=r10;HEAP32[r5>>2]=r8;if((r8|0)==0){r11=0;return r11}else{r13=r8}while(1){r8=r13-1|0;if((HEAP32[r10+(r8<<2)>>2]|0)!=0){r11=0;r4=18;break}HEAP32[r5>>2]=r8;if((r8|0)==0){r11=0;r4=18;break}else{r13=r8}}if(r4==18){return r11}}r13=HEAP32[r1+(r3<<2)>>2];if((r13|0)==0){r14=r1;r15=r6}else{r6=r13|0;r1=HEAP32[r6>>2];r10=r13+4|0;r8=HEAP32[r10>>2];if((r1|0)==0){r16=r8}else{r12=0;r9=r8;r8=r1;while(1){r1=HEAP32[r9+(r12<<2)>>2];if((r1|0)==0){r17=r8;r18=r9}else{_free(HEAP32[r1+8>>2]);_free(r1);r17=HEAP32[r6>>2];r18=HEAP32[r10>>2]}r1=r12+1|0;if(r1>>>0<r17>>>0){r12=r1;r9=r18;r8=r17}else{r16=r18;break}}}_free(r16);_free(r13);r14=HEAP32[r7>>2];r15=HEAP32[r5>>2]}HEAP32[r14+(r3<<2)>>2]=r2;if((r15|0)==0){r11=0;return r11}r2=HEAP32[r7>>2];r7=r15;while(1){r15=r7-1|0;if((HEAP32[r2+(r15<<2)>>2]|0)!=0){r11=0;r4=18;break}HEAP32[r5>>2]=r15;if((r15|0)==0){r11=0;r4=18;break}else{r7=r15}}if(r4==18){return r11}}function _pri_img_get_track(r1,r2,r3,r4){var r5,r6;r5=_pri_img_get_cylinder(r1,r2,r4);if((r5|0)==0){r6=0;return r6}r6=_pri_cyl_get_track(r5,r3,r4);return r6}function _pri_img_add_comment(r1,r2,r3){var r4,r5,r6,r7;r4=r1+12|0;r5=r1+8|0;r1=_realloc(HEAP32[r4>>2],HEAP32[r5>>2]+r3|0);if((r1|0)==0){r6=1;return r6}r7=HEAP32[r5>>2];_memcpy(r1+r7|0,r2,r3)|0;HEAP32[r5>>2]=r7+r3;HEAP32[r4>>2]=r1;r6=0;return r6}function _pri_img_set_comment(r1,r2,r3){var r4,r5,r6,r7;r4=r1+12|0;_free(HEAP32[r4>>2]);r5=r1+8|0;HEAP32[r5>>2]=0;HEAP32[r4>>2]=0;if((r2|0)==0|(r3|0)==0){r6=0;return r6}r1=_realloc(0,r3);if((r1|0)==0){r6=1;return r6}r7=HEAP32[r5>>2];_memcpy(r1+r7|0,r2,r3)|0;HEAP32[r5>>2]=r7+r3;HEAP32[r4>>2]=r1;r6=0;return r6}function _pri_load_pbit(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+560|0;r5=r4;r6=r4+256;r7=r4+280;r8=r4+536;r9=r4+544;r10=r4+552;r11=_pri_img_new();if((r11|0)==0){r12=0;STACKTOP=r4;return r12}r13=r10|0;if((_pri_read(r1,r13,4)|0)!=0){r12=r11;STACKTOP=r4;return r12}L7:do{if((_pri_get_uint32_be(r13,0)|0)==1346521428){r14=r10+4|0;if((_pri_read(r1,r14,4)|0)==0){r15=_pri_get_uint32_be(r13,4);if((HEAP32[61464>>2]|0)==0){r16=0;while(1){r17=r16<<25;r18=(r16&128|0)!=0?r17^517762881:r17;r17=r18<<1;r19=(r18|0)<0?r17^517762881:r17;r17=r19<<1;r18=(r19|0)<0?r17^517762881:r17;r17=r18<<1;r19=(r18|0)<0?r17^517762881:r17;r17=r19<<1;r18=(r19|0)<0?r17^517762881:r17;r17=r18<<1;r19=(r18|0)<0?r17^517762881:r17;r17=r19<<1;r18=(r19|0)<0?r17^517762881:r17;r17=r18<<1;HEAP32[61472+(r16<<2)>>2]=(r18|0)<0?r17^517762881:r17;r17=r16+1|0;if(r17>>>0<256){r16=r17}else{break}}HEAP32[61464>>2]=1}r16=r10+1|0;r17=HEAP32[61472+(HEAPU8[r13]<<2)>>2];r18=r10+2|0;r19=HEAP32[61472+((HEAPU8[r16]^r17>>>24)<<2)>>2]^r17<<8;r17=r10+3|0;r20=HEAP32[61472+((HEAPU8[r18]^r19>>>24)<<2)>>2]^r19<<8;r19=HEAP32[61472+((HEAPU8[r17]^r20>>>24)<<2)>>2]^r20<<8;r20=r10+5|0;r21=HEAP32[61472+((HEAPU8[r14]^r19>>>24)<<2)>>2]^r19<<8;r19=r10+6|0;r22=HEAP32[61472+((HEAPU8[r20]^r21>>>24)<<2)>>2]^r21<<8;r21=r10+7|0;r23=HEAP32[61472+((HEAPU8[r19]^r22>>>24)<<2)>>2]^r22<<8;r22=HEAP32[61472+((HEAPU8[r21]^r23>>>24)<<2)>>2]^r23<<8;r23=r9|0;if(r15>>>0>=8?(_pri_read(r1,r23,8)|0)==0:0){if((HEAP32[61464>>2]|0)==0){r24=0;while(1){r25=r24<<25;r26=(r24&128|0)!=0?r25^517762881:r25;r25=r26<<1;r27=(r26|0)<0?r25^517762881:r25;r25=r27<<1;r26=(r27|0)<0?r25^517762881:r25;r25=r26<<1;r27=(r26|0)<0?r25^517762881:r25;r25=r27<<1;r26=(r27|0)<0?r25^517762881:r25;r25=r26<<1;r27=(r26|0)<0?r25^517762881:r25;r25=r27<<1;r26=(r27|0)<0?r25^517762881:r25;r25=r26<<1;HEAP32[61472+(r24<<2)>>2]=(r26|0)<0?r25^517762881:r25;r25=r24+1|0;if(r25>>>0<256){r24=r25}else{break}}HEAP32[61464>>2]=1}r24=HEAP32[61472+((HEAPU8[r23]^r22>>>24)<<2)>>2]^r22<<8;r25=HEAP32[61472+((HEAPU8[r9+1|0]^r24>>>24)<<2)>>2]^r24<<8;r24=HEAP32[61472+((HEAPU8[r9+2|0]^r25>>>24)<<2)>>2]^r25<<8;r25=HEAP32[61472+((HEAPU8[r9+3|0]^r24>>>24)<<2)>>2]^r24<<8;r24=HEAP32[61472+((HEAPU8[r9+4|0]^r25>>>24)<<2)>>2]^r25<<8;r25=HEAP32[61472+((HEAPU8[r9+5|0]^r24>>>24)<<2)>>2]^r24<<8;r24=HEAP32[61472+((HEAPU8[r9+6|0]^r25>>>24)<<2)>>2]^r25<<8;r25=HEAP32[61472+((HEAPU8[r9+7|0]^r24>>>24)<<2)>>2];r26=_pri_get_uint32_be(r23,0);if((r26|0)!=0){_fprintf(HEAP32[_stderr>>2],50208,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r26,r3));STACKTOP=r3;break}if((_pbit_skip_chunk(r1,r15-8|0,r25^r24<<8)|0)==0){r24=r5|0;r25=r7|0;r26=r11+8|0;r27=r6|0;r28=0;L26:while(1){if((_pri_read(r1,r13,8)|0)!=0){break L7}r29=(r28|0)==0;r30=r28+4|0;r31=r28+8|0;L29:while(1){r32=_pri_get_uint32_be(r13,0);r33=_pri_get_uint32_be(r13,4);if((HEAP32[61464>>2]|0)==0){r34=0;while(1){r35=r34<<25;r36=(r34&128|0)!=0?r35^517762881:r35;r35=r36<<1;r37=(r36|0)<0?r35^517762881:r35;r35=r37<<1;r36=(r37|0)<0?r35^517762881:r35;r35=r36<<1;r37=(r36|0)<0?r35^517762881:r35;r35=r37<<1;r36=(r37|0)<0?r35^517762881:r35;r35=r36<<1;r37=(r36|0)<0?r35^517762881:r35;r35=r37<<1;r36=(r37|0)<0?r35^517762881:r35;r35=r36<<1;HEAP32[61472+(r34<<2)>>2]=(r36|0)<0?r35^517762881:r35;r35=r34+1|0;if(r35>>>0<256){r34=r35}else{break}}HEAP32[61464>>2]=1}r34=HEAP32[61472+(HEAPU8[r13]<<2)>>2];r35=HEAP32[61472+((HEAPU8[r16]^r34>>>24)<<2)>>2]^r34<<8;r34=HEAP32[61472+((HEAPU8[r18]^r35>>>24)<<2)>>2]^r35<<8;r35=HEAP32[61472+((HEAPU8[r17]^r34>>>24)<<2)>>2]^r34<<8;r34=HEAP32[61472+((HEAPU8[r14]^r35>>>24)<<2)>>2]^r35<<8;r35=HEAP32[61472+((HEAPU8[r20]^r34>>>24)<<2)>>2]^r34<<8;r34=HEAP32[61472+((HEAPU8[r19]^r35>>>24)<<2)>>2]^r35<<8;r38=HEAP32[61472+((HEAPU8[r21]^r34>>>24)<<2)>>2]^r34<<8;do{if((r32|0)==1414676811){break L29}else if((r32|0)==1145132097){if(r29){break L7}r34=(HEAP32[r30>>2]+7|0)>>>3;r35=r34>>>0<r33>>>0?r33:r34;if((_pri_read(r1,HEAP32[r31>>2],r35)|0)!=0){break L7}r34=HEAP32[r31>>2];if((HEAP32[61464>>2]|0)==0){r36=0;while(1){r37=r36<<25;r39=(r36&128|0)!=0?r37^517762881:r37;r37=r39<<1;r40=(r39|0)<0?r37^517762881:r37;r37=r40<<1;r39=(r40|0)<0?r37^517762881:r37;r37=r39<<1;r40=(r39|0)<0?r37^517762881:r37;r37=r40<<1;r39=(r40|0)<0?r37^517762881:r37;r37=r39<<1;r40=(r39|0)<0?r37^517762881:r37;r37=r40<<1;r39=(r40|0)<0?r37^517762881:r37;r37=r39<<1;HEAP32[61472+(r36<<2)>>2]=(r39|0)<0?r37^517762881:r37;r37=r36+1|0;if(r37>>>0<256){r36=r37}else{break}}HEAP32[61464>>2]=1}if((r35|0)==0){r41=r38}else{r36=r35;r37=r38;r39=r34;while(1){r40=HEAP32[61472+((HEAPU8[r39]^r37>>>24)<<2)>>2]^r37<<8;r42=r36-1|0;if((r42|0)==0){r41=r40;break}else{r36=r42;r37=r40;r39=r39+1|0}}}if((_pbit_skip_chunk(r1,r33-r35|0,r41)|0)!=0){break L7}}else if((r32|0)==1162757152){r2=76;break L26}else if((r32|0)==1413830740){if((r33|0)==0){if((_pri_read(r1,r24,4)|0)!=0){break L7}if((_pri_get_uint32_be(r24,0)|0)==(r38|0)){break}else{r2=26;break L26}}r43=_malloc(r33);if((r43|0)==0){break L7}if((_pri_read(r1,r43,r33)|0)!=0){r2=29;break L26}if((HEAP32[61464>>2]|0)==0){r39=0;while(1){r37=r39<<25;r36=(r39&128|0)!=0?r37^517762881:r37;r37=r36<<1;r34=(r36|0)<0?r37^517762881:r37;r37=r34<<1;r36=(r34|0)<0?r37^517762881:r37;r37=r36<<1;r34=(r36|0)<0?r37^517762881:r37;r37=r34<<1;r36=(r34|0)<0?r37^517762881:r37;r37=r36<<1;r34=(r36|0)<0?r37^517762881:r37;r37=r34<<1;r36=(r34|0)<0?r37^517762881:r37;r37=r36<<1;HEAP32[61472+(r39<<2)>>2]=(r36|0)<0?r37^517762881:r37;r37=r39+1|0;if(r37>>>0<256){r39=r37}else{break}}HEAP32[61464>>2]=1;r44=r33;r45=r38;r46=r43}else{r44=r33;r45=r38;r46=r43}while(1){r47=HEAP32[61472+((HEAPU8[r46]^r45>>>24)<<2)>>2]^r45<<8;r39=r44-1|0;if((r39|0)==0){r48=0;break}else{r44=r39;r45=r47;r46=r46+1|0}}while(1){r39=HEAP8[r43+r48|0];if(!(r39<<24>>24==13|r39<<24>>24==10|r39<<24>>24==0)){r49=r48;break}r39=r48+1|0;if(r39>>>0<r33>>>0){r48=r39}else{r49=r39;break}}L67:do{if(r49>>>0<r33>>>0){r39=r33;while(1){r35=r39-1|0;r37=HEAP8[r43+r35|0];if(r37<<24>>24==0){r50=r39+1|0}else if(r37<<24>>24==13|r37<<24>>24==10){r50=r35}else{r51=r39;break L67}if(r50>>>0>r49>>>0){r39=r50}else{r51=r50;break}}}else{r51=r33}}while(0);if((r49|0)==(r51|0)){if((_pri_read(r1,r25,4)|0)!=0){break L7}if((_pri_get_uint32_be(r25,0)|0)==(r47|0)){break}else{r2=44;break L26}}if(r49>>>0<r51>>>0){r39=r49;r35=r49;while(1){r37=HEAP8[r43+r39|0];do{if(r37<<24>>24==13){r36=r39+1|0;if(r36>>>0<r51>>>0?(HEAP8[r43+r36|0]|0)==10:0){r52=r35;r53=r36;break}HEAP8[r43+r35|0]=10;r52=r35+1|0;r53=r39}else{HEAP8[r43+r35|0]=r37;r52=r35+1|0;r53=r39}}while(0);r37=r53+1|0;if(r37>>>0<r51>>>0){r39=r37;r35=r52}else{r54=r52;break}}}else{r54=r49}if((HEAP32[r26>>2]|0)!=0?(HEAP8[r8]=10,(_pri_img_add_comment(r11,r8,1)|0)!=0):0){break L7}r35=(_pri_img_add_comment(r11,r43+r49|0,r54-r49|0)|0)==0;_free(r43);if(!r35){break L7}if((_pri_read(r1,r25,4)|0)!=0){break L7}if((_pri_get_uint32_be(r25,0)|0)!=(r47|0)){r2=56;break L26}}else{if((_pbit_skip_chunk(r1,r33,r38)|0)!=0){break L7}}}while(0);if((_pri_read(r1,r13,8)|0)!=0){break L7}}if(r33>>>0<20){break L7}if((_pri_read(r1,r27,20)|0)!=0){break L7}if((HEAP32[61464>>2]|0)==0){r31=0;while(1){r30=r31<<25;r29=(r31&128|0)!=0?r30^517762881:r30;r30=r29<<1;r32=(r29|0)<0?r30^517762881:r30;r30=r32<<1;r29=(r32|0)<0?r30^517762881:r30;r30=r29<<1;r32=(r29|0)<0?r30^517762881:r30;r30=r32<<1;r29=(r32|0)<0?r30^517762881:r30;r30=r29<<1;r32=(r29|0)<0?r30^517762881:r30;r30=r32<<1;r29=(r32|0)<0?r30^517762881:r30;r30=r29<<1;HEAP32[61472+(r31<<2)>>2]=(r29|0)<0?r30^517762881:r30;r30=r31+1|0;if(r30>>>0<256){r31=r30}else{break}}HEAP32[61464>>2]=1;r55=20;r56=r38;r57=r27}else{r55=20;r56=r38;r57=r27}while(1){r58=HEAP32[61472+((HEAPU8[r57]^r56>>>24)<<2)>>2]^r56<<8;r31=r55-1|0;if((r31|0)==0){break}else{r55=r31;r56=r58;r57=r57+1|0}}r31=_pri_get_uint32_be(r27,0);r30=_pri_get_uint32_be(r27,4);r29=_pri_get_uint32_be(r27,8);r32=_pri_get_uint32_be(r27,12);r35=_pri_img_get_track(r11,r31,r30,1);if((r35|0)==0){break L7}if((_pri_trk_set_size(r35,r29)|0)!=0){break L7}_pri_trk_set_clock(r35,r32);if((_pbit_skip_chunk(r1,r33-20|0,r58)|0)==0){r28=r35}else{break L7}}if(r2==26){_fwrite(56760,15,1,HEAP32[_stderr>>2]);break}else if(r2==29){_free(r43);break}else if(r2==44){_fwrite(56760,15,1,HEAP32[_stderr>>2]);break}else if(r2==56){_fwrite(56760,15,1,HEAP32[_stderr>>2]);break}else if(r2==76){if((_pbit_skip_chunk(r1,r33,r38)|0)==0){r12=r11}else{break}STACKTOP=r4;return r12}}}}}}while(0);_pri_img_del(r11);r12=0;STACKTOP=r4;return r12}function _pri_save_pbit(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+56|0;r5=r4;r6=r4+16;r7=r4+24;r8=r7|0;_pri_set_uint32_be(r8,0,1346521428);_pri_set_uint32_be(r8,4,8);_pri_set_uint32_be(r8,8,0);_pri_set_uint32_be(r8,12,0);if((HEAP32[61464>>2]|0)==0){r9=0;while(1){r10=r9<<25;r11=(r9&128|0)!=0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;HEAP32[61472+(r9<<2)>>2]=(r11|0)<0?r10^517762881:r10;r10=r9+1|0;if(r10>>>0<256){r9=r10}else{break}}HEAP32[61464>>2]=1;r13=16;r14=0;r15=r8}else{r13=16;r14=0;r15=r8}while(1){r16=HEAP32[61472+((HEAPU8[r15]^r14>>>24)<<2)>>2]^r14<<8;r9=r13-1|0;if((r9|0)==0){break}else{r13=r9;r14=r16;r15=r15+1|0}}_pri_set_uint32_be(r8,16,r16);if((_pri_write(r1,r8,20)|0)!=0){r17=1;STACKTOP=r4;return r17}r16=r6|0;r15=HEAP32[r2+8>>2];do{if((r15|0)!=0){r14=_malloc(r15+2|0);if((r14|0)==0){r17=1;STACKTOP=r4;return r17}r13=HEAP32[r2+12>>2];HEAP8[r14]=10;r9=0;while(1){r10=HEAP8[r13+r9|0];if(!(r10<<24>>24==13|r10<<24>>24==10|r10<<24>>24==0)){r18=r9;break}r10=r9+1|0;if(r10>>>0<r15>>>0){r9=r10}else{r18=r10;break}}if(r18>>>0<r15>>>0){r9=1;r10=r18;while(1){r11=HEAP8[r13+r10|0];do{if(r11<<24>>24==13){r12=r10+1|0;if(r12>>>0<r15>>>0?(HEAP8[r13+r12|0]|0)==10:0){r19=r12;r20=r9;break}HEAP8[r14+r9|0]=10;r19=r10;r20=r9+1|0}else{HEAP8[r14+r9|0]=r11;r19=r10;r20=r9+1|0}}while(0);r11=r19+1|0;if(r11>>>0<r15>>>0){r9=r20;r10=r11}else{break}}L31:do{if(r20>>>0>1){r10=r20;while(1){r9=r10-1|0;r13=HEAP8[r14+r9|0];if(!(r13<<24>>24==10|r13<<24>>24==0)){r21=r10;break L31}if(r9>>>0>1){r10=r9}else{r21=r9;break}}}else{r21=r20}}while(0);if((r21|0)!=1){r10=r21+1|0;HEAP8[r14+r21|0]=10;_pri_set_uint32_be(r16,0,1413830740);_pri_set_uint32_be(r16,4,r10);if((HEAP32[61464>>2]|0)==0){r9=0;while(1){r13=r9<<25;r11=(r9&128|0)!=0?r13^517762881:r13;r13=r11<<1;r12=(r11|0)<0?r13^517762881:r13;r13=r12<<1;r11=(r12|0)<0?r13^517762881:r13;r13=r11<<1;r12=(r11|0)<0?r13^517762881:r13;r13=r12<<1;r11=(r12|0)<0?r13^517762881:r13;r13=r11<<1;r12=(r11|0)<0?r13^517762881:r13;r13=r12<<1;r11=(r12|0)<0?r13^517762881:r13;r13=r11<<1;HEAP32[61472+(r9<<2)>>2]=(r11|0)<0?r13^517762881:r13;r13=r9+1|0;if(r13>>>0<256){r9=r13}else{break}}HEAP32[61464>>2]=1}r9=HEAP32[61472+(HEAPU8[r16]<<2)>>2];r13=HEAP32[61472+((HEAPU8[r6+1|0]^r9>>>24)<<2)>>2]^r9<<8;r9=HEAP32[61472+((HEAPU8[r6+2|0]^r13>>>24)<<2)>>2]^r13<<8;r13=HEAP32[61472+((HEAPU8[r6+3|0]^r9>>>24)<<2)>>2]^r9<<8;r9=HEAP32[61472+((HEAPU8[r6+4|0]^r13>>>24)<<2)>>2]^r13<<8;r13=HEAP32[61472+((HEAPU8[r6+5|0]^r9>>>24)<<2)>>2]^r9<<8;r9=HEAP32[61472+((HEAPU8[r6+6|0]^r13>>>24)<<2)>>2]^r13<<8;r13=HEAP32[61472+((HEAPU8[r6+7|0]^r9>>>24)<<2)>>2]^r9<<8;if((_pri_write(r1,r16,8)|0)!=0){r17=1;STACKTOP=r4;return r17}if((HEAP32[61464>>2]|0)==0){r9=0;while(1){r11=r9<<25;r12=(r9&128|0)!=0?r11^517762881:r11;r11=r12<<1;r22=(r12|0)<0?r11^517762881:r11;r11=r22<<1;r12=(r22|0)<0?r11^517762881:r11;r11=r12<<1;r22=(r12|0)<0?r11^517762881:r11;r11=r22<<1;r12=(r22|0)<0?r11^517762881:r11;r11=r12<<1;r22=(r12|0)<0?r11^517762881:r11;r11=r22<<1;r12=(r22|0)<0?r11^517762881:r11;r11=r12<<1;HEAP32[61472+(r9<<2)>>2]=(r12|0)<0?r11^517762881:r11;r11=r9+1|0;if(r11>>>0<256){r9=r11}else{break}}HEAP32[61464>>2]=1}if((r10|0)==0){r23=r13}else{r9=r10;r11=r13;r12=r14;while(1){r22=HEAP32[61472+((HEAPU8[r12]^r11>>>24)<<2)>>2]^r11<<8;r24=r9-1|0;if((r24|0)==0){r23=r22;break}else{r9=r24;r11=r22;r12=r12+1|0}}}if((_pri_write(r1,r14,r10)|0)!=0){r17=1;STACKTOP=r4;return r17}_pri_set_uint32_be(r16,0,r23);if((_pri_write(r1,r16,4)|0)==0){break}else{r17=1}STACKTOP=r4;return r17}}_free(r14)}}while(0);r16=r2|0;r23=HEAP32[r16>>2];L60:do{if((r23|0)!=0){r6=r2+4|0;r21=r7+1|0;r20=r7+2|0;r15=r7+3|0;r19=r7+4|0;r18=r7+5|0;r12=r7+6|0;r11=r7+7|0;r9=0;r13=r23;L62:while(1){r22=HEAP32[HEAP32[r6>>2]+(r9<<2)>>2];if((r22|0)!=0){r24=r22|0;if((HEAP32[r24>>2]|0)!=0){r25=r22+4|0;r22=0;while(1){r26=HEAP32[HEAP32[r25>>2]+(r22<<2)>>2];if((r26|0)!=0){_pri_set_uint32_be(r8,0,1414676811);_pri_set_uint32_be(r8,4,20);_pri_set_uint32_be(r8,8,r9);_pri_set_uint32_be(r8,12,r22);r27=r26+4|0;_pri_set_uint32_be(r8,16,HEAP32[r27>>2]);_pri_set_uint32_be(r8,20,HEAP32[r26>>2]);_pri_set_uint32_be(r8,24,0);if((HEAP32[61464>>2]|0)==0){r28=0;while(1){r29=r28<<25;r30=(r28&128|0)!=0?r29^517762881:r29;r29=r30<<1;r31=(r30|0)<0?r29^517762881:r29;r29=r31<<1;r30=(r31|0)<0?r29^517762881:r29;r29=r30<<1;r31=(r30|0)<0?r29^517762881:r29;r29=r31<<1;r30=(r31|0)<0?r29^517762881:r29;r29=r30<<1;r31=(r30|0)<0?r29^517762881:r29;r29=r31<<1;r30=(r31|0)<0?r29^517762881:r29;r29=r30<<1;HEAP32[61472+(r28<<2)>>2]=(r30|0)<0?r29^517762881:r29;r29=r28+1|0;if(r29>>>0<256){r28=r29}else{break}}HEAP32[61464>>2]=1;r32=28;r33=0;r34=r8}else{r32=28;r33=0;r34=r8}while(1){r35=HEAP32[61472+((HEAPU8[r34]^r33>>>24)<<2)>>2]^r33<<8;r28=r32-1|0;if((r28|0)==0){break}else{r32=r28;r33=r35;r34=r34+1|0}}_pri_set_uint32_be(r8,28,r35);if((_pri_write(r1,r8,32)|0)!=0){r17=1;r3=64;break L62}r28=HEAP32[r27>>2];if((r28|0)!=0){r29=(r28+7|0)>>>3;_pri_set_uint32_be(r8,0,1145132097);_pri_set_uint32_be(r8,4,r29);if((HEAP32[61464>>2]|0)==0){r28=0;while(1){r30=r28<<25;r31=(r28&128|0)!=0?r30^517762881:r30;r30=r31<<1;r36=(r31|0)<0?r30^517762881:r30;r30=r36<<1;r31=(r36|0)<0?r30^517762881:r30;r30=r31<<1;r36=(r31|0)<0?r30^517762881:r30;r30=r36<<1;r31=(r36|0)<0?r30^517762881:r30;r30=r31<<1;r36=(r31|0)<0?r30^517762881:r30;r30=r36<<1;r31=(r36|0)<0?r30^517762881:r30;r30=r31<<1;HEAP32[61472+(r28<<2)>>2]=(r31|0)<0?r30^517762881:r30;r30=r28+1|0;if(r30>>>0<256){r28=r30}else{break}}HEAP32[61464>>2]=1}r28=HEAP32[61472+(HEAPU8[r8]<<2)>>2];r27=HEAP32[61472+((HEAPU8[r21]^r28>>>24)<<2)>>2]^r28<<8;r28=HEAP32[61472+((HEAPU8[r20]^r27>>>24)<<2)>>2]^r27<<8;r27=HEAP32[61472+((HEAPU8[r15]^r28>>>24)<<2)>>2]^r28<<8;r28=HEAP32[61472+((HEAPU8[r19]^r27>>>24)<<2)>>2]^r27<<8;r27=HEAP32[61472+((HEAPU8[r18]^r28>>>24)<<2)>>2]^r28<<8;r28=HEAP32[61472+((HEAPU8[r12]^r27>>>24)<<2)>>2]^r27<<8;r27=HEAP32[61472+((HEAPU8[r11]^r28>>>24)<<2)>>2]^r28<<8;if((_pri_write(r1,r8,8)|0)!=0){r17=1;r3=64;break L62}r28=HEAP32[r26+8>>2];if((HEAP32[61464>>2]|0)==0){r30=0;while(1){r31=r30<<25;r36=(r30&128|0)!=0?r31^517762881:r31;r31=r36<<1;r37=(r36|0)<0?r31^517762881:r31;r31=r37<<1;r36=(r37|0)<0?r31^517762881:r31;r31=r36<<1;r37=(r36|0)<0?r31^517762881:r31;r31=r37<<1;r36=(r37|0)<0?r31^517762881:r31;r31=r36<<1;r37=(r36|0)<0?r31^517762881:r31;r31=r37<<1;r36=(r37|0)<0?r31^517762881:r31;r31=r36<<1;HEAP32[61472+(r30<<2)>>2]=(r36|0)<0?r31^517762881:r31;r31=r30+1|0;if(r31>>>0<256){r30=r31}else{break}}HEAP32[61464>>2]=1}if((r29|0)==0){r38=r27}else{r30=r29;r26=r27;r31=r28;while(1){r36=HEAP32[61472+((HEAPU8[r31]^r26>>>24)<<2)>>2]^r26<<8;r37=r30-1|0;if((r37|0)==0){r38=r36;break}else{r30=r37;r26=r36;r31=r31+1|0}}}if((_pri_write(r1,r28,r29)|0)!=0){r17=1;r3=64;break L62}_pri_set_uint32_be(r8,0,r38);if((_pri_write(r1,r8,4)|0)!=0){r17=1;r3=64;break L62}}}r31=r22+1|0;if(r31>>>0<HEAP32[r24>>2]>>>0){r22=r31}else{break}}r39=HEAP32[r16>>2]}else{r39=r13}}else{r39=r13}r22=r9+1|0;if(r22>>>0<r39>>>0){r9=r22;r13=r39}else{break L60}}if(r3==64){STACKTOP=r4;return r17}}}while(0);r3=r5|0;_pri_set_uint32_be(r3,0,1162757152);_pri_set_uint32_be(r3,4,0);if((HEAP32[61464>>2]|0)==0){r39=0;while(1){r16=r39<<25;r8=(r39&128|0)!=0?r16^517762881:r16;r16=r8<<1;r38=(r8|0)<0?r16^517762881:r16;r16=r38<<1;r8=(r38|0)<0?r16^517762881:r16;r16=r8<<1;r38=(r8|0)<0?r16^517762881:r16;r16=r38<<1;r8=(r38|0)<0?r16^517762881:r16;r16=r8<<1;r38=(r8|0)<0?r16^517762881:r16;r16=r38<<1;r8=(r38|0)<0?r16^517762881:r16;r16=r8<<1;HEAP32[61472+(r39<<2)>>2]=(r8|0)<0?r16^517762881:r16;r16=r39+1|0;if(r16>>>0<256){r39=r16}else{break}}HEAP32[61464>>2]=1}r39=HEAP32[61472+(HEAPU8[r3]<<2)>>2];r16=HEAP32[61472+((HEAPU8[r5+1|0]^r39>>>24)<<2)>>2]^r39<<8;r39=HEAP32[61472+((HEAPU8[r5+2|0]^r16>>>24)<<2)>>2]^r16<<8;r16=HEAP32[61472+((HEAPU8[r5+3|0]^r39>>>24)<<2)>>2]^r39<<8;r39=HEAP32[61472+((HEAPU8[r5+4|0]^r16>>>24)<<2)>>2]^r16<<8;r16=HEAP32[61472+((HEAPU8[r5+5|0]^r39>>>24)<<2)>>2]^r39<<8;r39=HEAP32[61472+((HEAPU8[r5+6|0]^r16>>>24)<<2)>>2]^r16<<8;_pri_set_uint32_be(r3,8,HEAP32[61472+((HEAPU8[r5+7|0]^r39>>>24)<<2)>>2]^r39<<8);r17=(_pri_write(r1,r3,12)|0)!=0|0;STACKTOP=r4;return r17}function _pbit_skip_chunk(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=STACKTOP;STACKTOP=STACKTOP+256|0;r5=r4|0;L1:do{if((r2|0)==0){r6=r3}else{r7=r2;r8=r3;while(1){r9=r7>>>0<256?r7:256;if((_pri_read(r1,r5,r9)|0)!=0){r10=1;break}if((HEAP32[61464>>2]|0)==0){r11=0;while(1){r12=r11<<25;r13=(r11&128|0)!=0?r12^517762881:r12;r12=r13<<1;r14=(r13|0)<0?r12^517762881:r12;r12=r14<<1;r13=(r14|0)<0?r12^517762881:r12;r12=r13<<1;r14=(r13|0)<0?r12^517762881:r12;r12=r14<<1;r13=(r14|0)<0?r12^517762881:r12;r12=r13<<1;r14=(r13|0)<0?r12^517762881:r12;r12=r14<<1;r13=(r14|0)<0?r12^517762881:r12;r12=r13<<1;HEAP32[61472+(r11<<2)>>2]=(r13|0)<0?r12^517762881:r12;r12=r11+1|0;if(r12>>>0<256){r11=r12}else{break}}HEAP32[61464>>2]=1}if((r9|0)==0){r15=r8}else{r11=r9;r12=r8;r13=r5;while(1){r14=HEAP32[61472+((HEAPU8[r13]^r12>>>24)<<2)>>2]^r12<<8;r16=r11-1|0;if((r16|0)==0){r15=r14;break}else{r11=r16;r12=r14;r13=r13+1|0}}}if((r7|0)==(r9|0)){r6=r15;break L1}else{r7=r7-r9|0;r8=r15}}r17=256;r18=0;STACKTOP=r4;return r10}}while(0);if((_pri_read(r1,r5,4)|0)!=0){r10=1;r17=256;r18=0;STACKTOP=r4;return r10}if((_pri_get_uint32_be(r5,0)|0)==(r6|0)){r10=0;r17=256;r18=0;STACKTOP=r4;return r10}_fwrite(56760,15,1,HEAP32[_stderr>>2]);r10=1;r17=256;r18=0;STACKTOP=r4;return r10}function _pri_load_pri(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+288|0;r5=r4;r6=r4+16;r7=r4+272;r8=r4+280;r9=_pri_img_new();if((r9|0)==0){r10=0;STACKTOP=r4;return r10}r11=r8|0;if((_pri_read(r1,r11,4)|0)!=0){r10=r9;STACKTOP=r4;return r10}if((HEAP32[59352>>2]|0)==0){r12=0;while(1){r13=r12<<25;r14=(r12&128|0)!=0?r13^517762881:r13;r13=r14<<1;r15=(r14|0)<0?r13^517762881:r13;r13=r15<<1;r14=(r15|0)<0?r13^517762881:r13;r13=r14<<1;r15=(r14|0)<0?r13^517762881:r13;r13=r15<<1;r14=(r15|0)<0?r13^517762881:r13;r13=r14<<1;r15=(r14|0)<0?r13^517762881:r13;r13=r15<<1;r14=(r15|0)<0?r13^517762881:r13;r13=r14<<1;HEAP32[59360+(r12<<2)>>2]=(r14|0)<0?r13^517762881:r13;r13=r12+1|0;if(r13>>>0<256){r12=r13}else{break}}HEAP32[59352>>2]=1}r12=r8+1|0;r13=HEAP32[59360+(HEAPU8[r11]<<2)>>2];r14=r8+2|0;r15=HEAP32[59360+((HEAPU8[r12]^r13>>>24)<<2)>>2]^r13<<8;r13=r8+3|0;r16=HEAP32[59360+((HEAPU8[r14]^r15>>>24)<<2)>>2]^r15<<8;r15=HEAP32[59360+((HEAPU8[r13]^r16>>>24)<<2)>>2]^r16<<8;L12:do{if((_pri_get_uint32_be(r11,0)|0)==1347569952){r16=r8+4|0;if((_pri_read(r1,r16,4)|0)==0){if((HEAP32[59352>>2]|0)==0){r17=0;while(1){r18=r17<<25;r19=(r17&128|0)!=0?r18^517762881:r18;r18=r19<<1;r20=(r19|0)<0?r18^517762881:r18;r18=r20<<1;r19=(r20|0)<0?r18^517762881:r18;r18=r19<<1;r20=(r19|0)<0?r18^517762881:r18;r18=r20<<1;r19=(r20|0)<0?r18^517762881:r18;r18=r19<<1;r20=(r19|0)<0?r18^517762881:r18;r18=r20<<1;r19=(r20|0)<0?r18^517762881:r18;r18=r19<<1;HEAP32[59360+(r17<<2)>>2]=(r19|0)<0?r18^517762881:r18;r18=r17+1|0;if(r18>>>0<256){r17=r18}else{break}}HEAP32[59352>>2]=1}r17=r8+5|0;r18=HEAP32[59360+((HEAPU8[r16]^r15>>>24)<<2)>>2]^r15<<8;r19=r8+6|0;r20=HEAP32[59360+((HEAPU8[r17]^r18>>>24)<<2)>>2]^r18<<8;r18=r8+7|0;r21=HEAP32[59360+((HEAPU8[r19]^r20>>>24)<<2)>>2]^r20<<8;r20=HEAP32[59360+((HEAPU8[r18]^r21>>>24)<<2)>>2]^r21<<8;r21=_pri_get_uint32_be(r11,4);r22=r7|0;if(r21>>>0>=4?(_pri_read(r1,r22,4)|0)==0:0){if((HEAP32[59352>>2]|0)==0){r23=0;while(1){r24=r23<<25;r25=(r23&128|0)!=0?r24^517762881:r24;r24=r25<<1;r26=(r25|0)<0?r24^517762881:r24;r24=r26<<1;r25=(r26|0)<0?r24^517762881:r24;r24=r25<<1;r26=(r25|0)<0?r24^517762881:r24;r24=r26<<1;r25=(r26|0)<0?r24^517762881:r24;r24=r25<<1;r26=(r25|0)<0?r24^517762881:r24;r24=r26<<1;r25=(r26|0)<0?r24^517762881:r24;r24=r25<<1;HEAP32[59360+(r23<<2)>>2]=(r25|0)<0?r24^517762881:r24;r24=r23+1|0;if(r24>>>0<256){r23=r24}else{break}}HEAP32[59352>>2]=1}r23=HEAP32[59360+((HEAPU8[r22]^r20>>>24)<<2)>>2]^r20<<8;r24=HEAP32[59360+((HEAPU8[r7+1|0]^r23>>>24)<<2)>>2]^r23<<8;r23=HEAP32[59360+((HEAPU8[r7+2|0]^r24>>>24)<<2)>>2]^r24<<8;r24=HEAP32[59360+((HEAPU8[r7+3|0]^r23>>>24)<<2)>>2]^r23<<8;r23=_pri_get_uint16_be(r22,0);if((r23|0)!=0){_fprintf(HEAP32[_stderr>>2],50152,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r23,r3));STACKTOP=r3;break}r23=r21-4|0;r25=r6|0;if((r23|0)==0){r27=r24}else{r26=r23;r23=r24;while(1){r24=r26>>>0<256?r26:256;if((_pri_read(r1,r25,r24)|0)!=0){break L12}if((HEAP32[59352>>2]|0)==0){r28=0;while(1){r29=r28<<25;r30=(r28&128|0)!=0?r29^517762881:r29;r29=r30<<1;r31=(r30|0)<0?r29^517762881:r29;r29=r31<<1;r30=(r31|0)<0?r29^517762881:r29;r29=r30<<1;r31=(r30|0)<0?r29^517762881:r29;r29=r31<<1;r30=(r31|0)<0?r29^517762881:r29;r29=r30<<1;r31=(r30|0)<0?r29^517762881:r29;r29=r31<<1;r30=(r31|0)<0?r29^517762881:r29;r29=r30<<1;HEAP32[59360+(r28<<2)>>2]=(r30|0)<0?r29^517762881:r29;r29=r28+1|0;if(r29>>>0<256){r28=r29}else{break}}HEAP32[59352>>2]=1}if((r24|0)==0){r32=r23}else{r28=r24;r29=r23;r30=r25;while(1){r31=HEAP32[59360+((HEAPU8[r30]^r29>>>24)<<2)>>2]^r29<<8;r33=r28-1|0;if((r33|0)==0){r32=r31;break}else{r28=r33;r29=r31;r30=r30+1|0}}}if((r26|0)==(r24|0)){r27=r32;break}else{r26=r26-r24|0;r23=r32}}}if((_pri_read(r1,r25,4)|0)==0){r23=(_pri_get_uint32_be(r25,0)|0)==(r27|0);r26=HEAP32[_stderr>>2];if(!r23){_fwrite(56728,15,1,r26);break}r23=r5|0;r21=0;L48:while(1){if((_pri_read(r1,r11,8)|0)!=0){break L12}r22=(r21|0)==0;r20=r21+4|0;r30=r21+8|0;L51:while(1){if((HEAP32[59352>>2]|0)==0){r29=0;while(1){r28=r29<<25;r31=(r29&128|0)!=0?r28^517762881:r28;r28=r31<<1;r33=(r31|0)<0?r28^517762881:r28;r28=r33<<1;r31=(r33|0)<0?r28^517762881:r28;r28=r31<<1;r33=(r31|0)<0?r28^517762881:r28;r28=r33<<1;r31=(r33|0)<0?r28^517762881:r28;r28=r31<<1;r33=(r31|0)<0?r28^517762881:r28;r28=r33<<1;r31=(r33|0)<0?r28^517762881:r28;r28=r31<<1;HEAP32[59360+(r29<<2)>>2]=(r31|0)<0?r28^517762881:r28;r28=r29+1|0;if(r28>>>0<256){r29=r28}else{break}}HEAP32[59352>>2]=1}r29=HEAP32[59360+(HEAPU8[r11]<<2)>>2];r28=HEAP32[59360+((HEAPU8[r12]^r29>>>24)<<2)>>2]^r29<<8;r29=HEAP32[59360+((HEAPU8[r14]^r28>>>24)<<2)>>2]^r28<<8;r28=HEAP32[59360+((HEAPU8[r13]^r29>>>24)<<2)>>2]^r29<<8;r29=HEAP32[59360+((HEAPU8[r16]^r28>>>24)<<2)>>2]^r28<<8;r28=HEAP32[59360+((HEAPU8[r17]^r29>>>24)<<2)>>2]^r29<<8;r29=HEAP32[59360+((HEAPU8[r19]^r28>>>24)<<2)>>2]^r28<<8;r34=HEAP32[59360+((HEAPU8[r18]^r29>>>24)<<2)>>2]^r29<<8;r29=_pri_get_uint32_be(r11,0);r35=_pri_get_uint32_be(r11,4);do{if((r29|0)==1145132097){if(r22){break L12}r28=(HEAP32[r20>>2]+7|0)>>>3;r31=r28>>>0>r35>>>0?r35:r28;r28=HEAP32[r30>>2];if((_pri_read(r1,r28,r31)|0)!=0){break L12}if((HEAP32[59352>>2]|0)==0){r33=0;while(1){r36=r33<<25;r37=(r33&128|0)!=0?r36^517762881:r36;r36=r37<<1;r38=(r37|0)<0?r36^517762881:r36;r36=r38<<1;r37=(r38|0)<0?r36^517762881:r36;r36=r37<<1;r38=(r37|0)<0?r36^517762881:r36;r36=r38<<1;r37=(r38|0)<0?r36^517762881:r36;r36=r37<<1;r38=(r37|0)<0?r36^517762881:r36;r36=r38<<1;r37=(r38|0)<0?r36^517762881:r36;r36=r37<<1;HEAP32[59360+(r33<<2)>>2]=(r37|0)<0?r36^517762881:r36;r36=r33+1|0;if(r36>>>0<256){r33=r36}else{break}}HEAP32[59352>>2]=1}if((r31|0)==0){r39=r34}else{r33=r31;r36=r34;r37=r28;while(1){r38=HEAP32[59360+((HEAPU8[r37]^r36>>>24)<<2)>>2]^r36<<8;r40=r33-1|0;if((r40|0)==0){r39=r38;break}else{r33=r40;r36=r38;r37=r37+1|0}}}if((r31|0)==(r35|0)){r41=r39}else{r37=r35-r31|0;r36=r39;while(1){r33=r37>>>0<256?r37:256;if((_pri_read(r1,r25,r33)|0)!=0){break L12}if((HEAP32[59352>>2]|0)==0){r28=0;while(1){r38=r28<<25;r40=(r28&128|0)!=0?r38^517762881:r38;r38=r40<<1;r42=(r40|0)<0?r38^517762881:r38;r38=r42<<1;r40=(r42|0)<0?r38^517762881:r38;r38=r40<<1;r42=(r40|0)<0?r38^517762881:r38;r38=r42<<1;r40=(r42|0)<0?r38^517762881:r38;r38=r40<<1;r42=(r40|0)<0?r38^517762881:r38;r38=r42<<1;r40=(r42|0)<0?r38^517762881:r38;r38=r40<<1;HEAP32[59360+(r28<<2)>>2]=(r40|0)<0?r38^517762881:r38;r38=r28+1|0;if(r38>>>0<256){r28=r38}else{break}}HEAP32[59352>>2]=1}if((r33|0)==0){r43=r36}else{r28=r33;r38=r36;r40=r25;while(1){r42=HEAP32[59360+((HEAPU8[r40]^r38>>>24)<<2)>>2]^r38<<8;r44=r28-1|0;if((r44|0)==0){r43=r42;break}else{r28=r44;r38=r42;r40=r40+1|0}}}if((r37|0)==(r33|0)){r41=r43;break}else{r37=r37-r33|0;r36=r43}}}if((_pri_read(r1,r25,4)|0)!=0){break L12}if((_pri_get_uint32_be(r25,0)|0)!=(r41|0)){r2=102;break L48}}else if((r29|0)==1414676811){break L51}else if((r29|0)==1162757152){r2=34;break L48}else if((r29|0)==1413830740){if((r35|0)==0){if((_pri_read(r1,r25,4)|0)!=0){break L12}if((_pri_get_uint32_be(r25,0)|0)==(r34|0)){break}else{r2=48;break L48}}r45=_malloc(r35);if((r45|0)==0){break L12}if((_pri_read(r1,r45,r35)|0)!=0){r2=55;break L48}if((HEAP32[59352>>2]|0)==0){r36=0;while(1){r37=r36<<25;r31=(r36&128|0)!=0?r37^517762881:r37;r37=r31<<1;r40=(r31|0)<0?r37^517762881:r37;r37=r40<<1;r31=(r40|0)<0?r37^517762881:r37;r37=r31<<1;r40=(r31|0)<0?r37^517762881:r37;r37=r40<<1;r31=(r40|0)<0?r37^517762881:r37;r37=r31<<1;r40=(r31|0)<0?r37^517762881:r37;r37=r40<<1;r31=(r40|0)<0?r37^517762881:r37;r37=r31<<1;HEAP32[59360+(r36<<2)>>2]=(r31|0)<0?r37^517762881:r37;r37=r36+1|0;if(r37>>>0<256){r36=r37}else{break}}HEAP32[59352>>2]=1;r46=r35;r47=r34;r48=r45}else{r46=r35;r47=r34;r48=r45}while(1){r49=HEAP32[59360+((HEAPU8[r48]^r47>>>24)<<2)>>2]^r47<<8;r36=r46-1|0;if((r36|0)==0){break}else{r46=r36;r47=r49;r48=r48+1|0}}r36=(HEAP8[r45]|0)==10;r37=(r36<<31>>31)+r35|0;if((r37|0)==0){r50=0}else{r31=r37-1|0;r50=(HEAP8[r45+r31|0]|0)==10?r31:r37}r37=_pri_img_add_comment(r9,r45+(r36&1)|0,r50);_free(r45);if((_pri_read(r1,r25,4)|0)==0){if((_pri_get_uint32_be(r25,0)|0)==(r49|0)){r51=0}else{_fwrite(56728,15,1,r26);r51=1}}else{r51=1}if((r51|r37|0)!=0){break L12}}else{if((r35|0)==0){r52=r34}else{r37=r35;r36=r34;while(1){r31=r37>>>0<256?r37:256;if((_pri_read(r1,r25,r31)|0)!=0){break L12}if((HEAP32[59352>>2]|0)==0){r40=0;while(1){r38=r40<<25;r28=(r40&128|0)!=0?r38^517762881:r38;r38=r28<<1;r42=(r28|0)<0?r38^517762881:r38;r38=r42<<1;r28=(r42|0)<0?r38^517762881:r38;r38=r28<<1;r42=(r28|0)<0?r38^517762881:r38;r38=r42<<1;r28=(r42|0)<0?r38^517762881:r38;r38=r28<<1;r42=(r28|0)<0?r38^517762881:r38;r38=r42<<1;r28=(r42|0)<0?r38^517762881:r38;r38=r28<<1;HEAP32[59360+(r40<<2)>>2]=(r28|0)<0?r38^517762881:r38;r38=r40+1|0;if(r38>>>0<256){r40=r38}else{break}}HEAP32[59352>>2]=1}if((r31|0)==0){r53=r36}else{r40=r31;r33=r36;r38=r25;while(1){r28=HEAP32[59360+((HEAPU8[r38]^r33>>>24)<<2)>>2]^r33<<8;r42=r40-1|0;if((r42|0)==0){r53=r28;break}else{r40=r42;r33=r28;r38=r38+1|0}}}if((r37|0)==(r31|0)){r52=r53;break}else{r37=r37-r31|0;r36=r53}}}if((_pri_read(r1,r25,4)|0)!=0){break L12}if((_pri_get_uint32_be(r25,0)|0)!=(r52|0)){r2=113;break L48}}}while(0);if((_pri_read(r1,r11,8)|0)!=0){break L12}}if(r35>>>0<16){break L12}if((_pri_read(r1,r23,16)|0)!=0){break L12}if((HEAP32[59352>>2]|0)==0){r30=0;while(1){r20=r30<<25;r22=(r30&128|0)!=0?r20^517762881:r20;r20=r22<<1;r24=(r22|0)<0?r20^517762881:r20;r20=r24<<1;r22=(r24|0)<0?r20^517762881:r20;r20=r22<<1;r24=(r22|0)<0?r20^517762881:r20;r20=r24<<1;r22=(r24|0)<0?r20^517762881:r20;r20=r22<<1;r24=(r22|0)<0?r20^517762881:r20;r20=r24<<1;r22=(r24|0)<0?r20^517762881:r20;r20=r22<<1;HEAP32[59360+(r30<<2)>>2]=(r22|0)<0?r20^517762881:r20;r20=r30+1|0;if(r20>>>0<256){r30=r20}else{break}}HEAP32[59352>>2]=1;r54=16;r55=r34;r56=r23}else{r54=16;r55=r34;r56=r23}while(1){r57=HEAP32[59360+((HEAPU8[r56]^r55>>>24)<<2)>>2]^r55<<8;r30=r54-1|0;if((r30|0)==0){break}else{r54=r30;r55=r57;r56=r56+1|0}}r30=_pri_get_uint32_be(r23,0);r20=_pri_get_uint32_be(r23,4);r22=_pri_get_uint32_be(r23,8);r24=_pri_get_uint32_be(r23,12);r29=_pri_img_get_track(r9,r30,r20,1);if((r29|0)==0){break L12}if((_pri_trk_set_size(r29,r22)|0)!=0){break L12}_pri_trk_set_clock(r29,r24);r24=r35-16|0;if((r24|0)==0){r58=r57}else{r22=r24;r24=r57;while(1){r20=r22>>>0<256?r22:256;if((_pri_read(r1,r25,r20)|0)!=0){break L12}if((HEAP32[59352>>2]|0)==0){r30=0;while(1){r36=r30<<25;r37=(r30&128|0)!=0?r36^517762881:r36;r36=r37<<1;r38=(r37|0)<0?r36^517762881:r36;r36=r38<<1;r37=(r38|0)<0?r36^517762881:r36;r36=r37<<1;r38=(r37|0)<0?r36^517762881:r36;r36=r38<<1;r37=(r38|0)<0?r36^517762881:r36;r36=r37<<1;r38=(r37|0)<0?r36^517762881:r36;r36=r38<<1;r37=(r38|0)<0?r36^517762881:r36;r36=r37<<1;HEAP32[59360+(r30<<2)>>2]=(r37|0)<0?r36^517762881:r36;r36=r30+1|0;if(r36>>>0<256){r30=r36}else{break}}HEAP32[59352>>2]=1}if((r20|0)==0){r59=r24}else{r30=r20;r36=r24;r37=r25;while(1){r38=HEAP32[59360+((HEAPU8[r37]^r36>>>24)<<2)>>2]^r36<<8;r33=r30-1|0;if((r33|0)==0){r59=r38;break}else{r30=r33;r36=r38;r37=r37+1|0}}}if((r22|0)==(r20|0)){r58=r59;break}else{r22=r22-r20|0;r24=r59}}}if((_pri_read(r1,r25,4)|0)!=0){break L12}if((_pri_get_uint32_be(r25,0)|0)==(r58|0)){r21=r29}else{r2=83;break}}if(r2==34){if((r35|0)==0){r60=r34}else{r21=r35;r23=r34;while(1){r18=r21>>>0<256?r21:256;if((_pri_read(r1,r25,r18)|0)!=0){break L12}if((HEAP32[59352>>2]|0)==0){r19=0;while(1){r17=r19<<25;r16=(r19&128|0)!=0?r17^517762881:r17;r17=r16<<1;r24=(r16|0)<0?r17^517762881:r17;r17=r24<<1;r16=(r24|0)<0?r17^517762881:r17;r17=r16<<1;r24=(r16|0)<0?r17^517762881:r17;r17=r24<<1;r16=(r24|0)<0?r17^517762881:r17;r17=r16<<1;r24=(r16|0)<0?r17^517762881:r17;r17=r24<<1;r16=(r24|0)<0?r17^517762881:r17;r17=r16<<1;HEAP32[59360+(r19<<2)>>2]=(r16|0)<0?r17^517762881:r17;r17=r19+1|0;if(r17>>>0<256){r19=r17}else{break}}HEAP32[59352>>2]=1}if((r18|0)==0){r61=r23}else{r19=r18;r29=r23;r17=r25;while(1){r16=HEAP32[59360+((HEAPU8[r17]^r29>>>24)<<2)>>2]^r29<<8;r24=r19-1|0;if((r24|0)==0){r61=r16;break}else{r19=r24;r29=r16;r17=r17+1|0}}}if((r21|0)==(r18|0)){r60=r61;break}else{r21=r21-r18|0;r23=r61}}}if((_pri_read(r1,r25,4)|0)!=0){break}if((_pri_get_uint32_be(r25,0)|0)==(r60|0)){r10=r9;STACKTOP=r4;return r10}else{_fwrite(56728,15,1,r26);break}}else if(r2==48){_fwrite(56728,15,1,r26);break}else if(r2==55){_free(r45);break}else if(r2==83){_fwrite(56728,15,1,r26);break}else if(r2==102){_fwrite(56728,15,1,r26);break}else if(r2==113){_fwrite(56728,15,1,r26);break}}}}}}while(0);_pri_img_del(r9);r10=0;STACKTOP=r4;return r10}function _pri_save_pri(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+56|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=r4+32;r10=r4+48|0;_pri_set_uint32_be(r10,0,0);if((_pri_save_chunk(r1,1347569952,4,r10)|0)!=0){r11=1;STACKTOP=r4;return r11}r10=r9|0;r12=r2+8|0;if((HEAP32[r12>>2]|0)!=0){_pri_set_uint32_be(r10,0,1413830740);_pri_set_uint32_be(r10,4,HEAP32[r12>>2]+2|0);r13=r9+8|0;HEAP8[r13]=10;HEAP32[r8>>2]=0;r9=_pri_write_crc(r1,r10,9,r8);r14=_pri_write_crc(r1,HEAP32[r2+12>>2],HEAP32[r12>>2],r8)|r9;r9=r14|_pri_write_crc(r1,r13,1,r8);_pri_set_uint32_be(r10,0,HEAP32[r8>>2]);if((r9|_pri_write(r1,r10,4)|0)!=0){r11=1;STACKTOP=r4;return r11}}r9=r2|0;r8=HEAP32[r9>>2];L8:do{if((r8|0)!=0){r13=r2+4|0;r14=r7|0;r12=0;r15=r8;L10:while(1){r16=HEAP32[HEAP32[r13>>2]+(r12<<2)>>2];if((r16|0)!=0){r17=r16|0;if((HEAP32[r17>>2]|0)!=0){r18=r16+4|0;r16=0;while(1){r19=HEAP32[HEAP32[r18>>2]+(r16<<2)>>2];if((r19|0)!=0){_pri_set_uint32_be(r10,0,r12);_pri_set_uint32_be(r10,4,r16);r20=r19+4|0;_pri_set_uint32_be(r10,8,HEAP32[r20>>2]);_pri_set_uint32_be(r10,12,HEAP32[r19>>2]);if((_pri_save_chunk(r1,1414676811,16,r10)|0)!=0){r11=1;r3=21;break L10}r21=HEAP32[r20>>2];if((r21|0)!=0){HEAP32[r6>>2]=0;r20=(r21+7|0)>>>3;_pri_set_uint32_be(r14,0,1145132097);_pri_set_uint32_be(r14,4,r20);if((_pri_write_crc(r1,r14,8,r6)|0)!=0){r11=1;r3=21;break L10}if((_pri_write_crc(r1,HEAP32[r19+8>>2],r20,r6)|0)!=0){r11=1;r3=21;break L10}_pri_set_uint32_be(r14,0,HEAP32[r6>>2]);if((_pri_write(r1,r14,4)|0)!=0){r11=1;r3=21;break L10}}}r20=r16+1|0;if(r20>>>0<HEAP32[r17>>2]>>>0){r16=r20}else{break}}r22=HEAP32[r9>>2]}else{r22=r15}}else{r22=r15}r16=r12+1|0;if(r16>>>0<r22>>>0){r12=r16;r15=r22}else{r23=r14;break L8}}if(r3==21){STACKTOP=r4;return r11}}else{r23=r7|0}}while(0);_pri_set_uint32_be(r23,0,1162757152);_pri_set_uint32_be(r23,4,0);HEAP32[r5>>2]=0;if((_pri_write_crc(r1,r23,8,r5)|0)!=0){r11=1;STACKTOP=r4;return r11}_pri_set_uint32_be(r23,0,HEAP32[r5>>2]);r11=(_pri_write(r1,r23,4)|0)!=0|0;STACKTOP=r4;return r11}function _pri_save_chunk(r1,r2,r3,r4){var r5,r6,r7,r8;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8|0;_pri_set_uint32_be(r7,0,r2);_pri_set_uint32_be(r7,4,r3);HEAP32[r6>>2]=0;if((_pri_write_crc(r1,r7,8,r6)|0)!=0){r8=1;STACKTOP=r5;return r8}if((r3|0)!=0?(_pri_write_crc(r1,r4,r3,r6)|0)!=0:0){r8=1;STACKTOP=r5;return r8}_pri_set_uint32_be(r7,0,HEAP32[r6>>2]);r8=(_pri_write(r1,r7,4)|0)!=0|0;STACKTOP=r5;return r8}function _pri_write_crc(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;if((r4|0)==0){r5=_pri_write(r1,r2,r3);r6=(r5|0)!=0;r7=r6&1;return r7}r8=HEAP32[r4>>2];if((HEAP32[59352>>2]|0)==0){r9=0;while(1){r10=r9<<25;r11=(r9&128|0)!=0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;HEAP32[59360+(r9<<2)>>2]=(r11|0)<0?r10^517762881:r10;r10=r9+1|0;if(r10>>>0<256){r9=r10}else{break}}HEAP32[59352>>2]=1}if((r3|0)==0){r13=r8}else{r9=r3;r10=r8;r8=r2;while(1){r11=HEAP32[59360+((HEAPU8[r8]^r10>>>24)<<2)>>2]^r10<<8;r12=r9-1|0;if((r12|0)==0){r13=r11;break}else{r9=r12;r10=r11;r8=r8+1|0}}}HEAP32[r4>>2]=r13;r5=_pri_write(r1,r2,r3);r6=(r5|0)!=0;r7=r6&1;return r7}function _pri_load_tc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+2048|0;r4=r3;r5=r3+512;r6=r3+1536;r7=_pri_img_new();L1:do{if((r7|0)==0){r8=0}else{r9=r4|0;if((_pri_read_ofs(r1,0,r9,512)|0)==0?(_pri_get_uint16_be(r9,0)|0)==23205:0){r10=HEAPU8[r4+258|0]+1|0;r11=HEAP8[r4+259|0];r12=r11&255;r13=2;while(1){r14=r13+1|0;if((HEAP8[r4+r13|0]|0)==0){r2=7;break}if(r14>>>0<66){r13=r14}else{r15=r14;r2=8;break}}if(r2==7?r13>>>0>2:0){r15=r13;r2=8}if(r2==8){_pri_img_set_comment(r7,r4+2|0,r15-2|0)}if((_pri_read_ofs(r1,773,r9,512)|0)==0){r14=0;while(1){HEAP32[r5+(r14<<2)>>2]=_pri_get_uint16_be(r9,r14<<1)<<8;r16=r14+1|0;if(r16>>>0<256){r14=r16}else{break}}if((_pri_read_ofs(r1,1285,r9,512)|0)==0){r14=0;while(1){HEAP16[r6+(r14<<1)>>1]=_pri_get_uint16_le(r9,r14<<1);r13=r14+1|0;if(r13>>>0<256){r14=r13}else{break}}if(r10>>>0>99|(r11&255)>2){_pri_img_del(r7);r8=0;break}if(r11<<24>>24==0){r14=0;while(1){r9=r14+1|0;if(r9>>>0<r10>>>0){r14=r9}else{r8=r7;break L1}}}else{r17=0}L26:while(1){r14=0;r11=r17<<1;while(1){if(r11>>>0>255){r2=26;break L26}r9=HEAP32[r5+(r11<<2)>>2];if((r9|0)!=0){r13=HEAP16[r6+(r11<<1)>>1];if(r13<<16>>16!=0){r16=_pri_img_get_track(r7,r17,r14,1);if((r16|0)==0){r2=27;break L26}if((_pri_trk_set_size(r16,(r13&65535)<<3)|0)!=0){r2=27;break L26}_pri_trk_set_clock(r16,(r13&65535)<8e3?25e4:5e5);if((_pri_read_ofs(r1,r9,HEAP32[r16+8>>2],(HEAP32[r16+4>>2]+7|0)>>>3)|0)!=0){r2=27;break L26}}}r16=r14+1|0;if(r16>>>0<r12>>>0){r14=r16;r11=r11+1|0}else{break}}r11=r17+1|0;if(r11>>>0<r10>>>0){r17=r11}else{r8=r7;break L1}}if(r2==26){_pri_img_del(r7);r8=0;break}else if(r2==27){_pri_img_del(r7);r8=0;break}}}}_pri_img_del(r7);r8=0}}while(0);STACKTOP=r3;return r8}function _pri_save_tc(r1,r2){return 1}function _psi_guess_type(r1){var r2,r3,r4,r5;r2=63032;r3=r1;while(1){r1=HEAP8[r3];if(r1<<24>>24==46){r4=r3}else if(r1<<24>>24==0){break}else{r4=r2}r2=r4;r3=r3+1|0}if((_strcasecmp(r2,54008)|0)!=0){if((_strcasecmp(r2,56720)|0)!=0){if((_strcasecmp(r2,50144)|0)!=0){if((_strcasecmp(r2,46200)|0)!=0){if((_strcasecmp(r2,42640)|0)!=0){if((_strcasecmp(r2,39536)|0)!=0){if((_strcasecmp(r2,36616)|0)!=0){if((_strcasecmp(r2,33632)|0)!=0){if((_strcasecmp(r2,31776)|0)!=0){if((_strcasecmp(r2,30832)|0)!=0){if((_strcasecmp(r2,58136)|0)!=0){if((_strcasecmp(r2,57344)|0)!=0){if((_strcasecmp(r2,56112)|0)!=0){if((_strcasecmp(r2,55368)|0)==0){r5=16}else{r3=(_strcasecmp(r2,54696)|0)==0;r5=r3?17:11}}else{r5=15}}else{r5=14}}else{r5=13}}else{r5=12}}else{r5=11}}else{r5=6}}else{r5=5}}else{r5=12}}else{r5=4}}else{r5=12}}else{r5=3}}else{r5=2}}else{r5=1}return r5}function _psi_load_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=0;switch(r2|0){case 1:{r4=_psi_load_anadisk(r1);r5=r4;break};case 2:{r6=_psi_load_cp2(r1);r5=r6;break};case 16:{r7=_psi_load_td0(r1);r5=r7;break};case 3:{r8=_psi_load_dc42(r1);r5=r8;break};case 6:case 7:case 8:case 9:case 10:{r9=_psi_load_pfdc(r1);r5=r9;break};case 14:{r10=_psi_load_stx(r1);r5=r10;break};case 13:{r11=_psi_load_st(r1);r5=r11;break};case 5:{r12=_psi_load_msa(r1);r5=r12;break};case 17:{r13=_psi_load_xdf(r1);r5=r13;break};case 11:{r14=_psi_load_psi(r1);r5=r14;break};case 12:{r15=_psi_load_raw(r1);r5=r15;break};case 15:{r16=_psi_load_tc(r1);r5=r16;break};case 4:{r17=_psi_load_imd(r1);r5=r17;break};default:{r5=0}}return r5}function _psi_probe(r1){var r2,r3,r4,r5,r6,r7;r2=_fopen(r1,53992);if((r2|0)==0){r3=0;return r3}r4=_psi_probe_fp(r2);_fclose(r2);if((r4|0)==12){r5=63032;r6=r1}else{r3=r4;return r3}while(1){r3=HEAP8[r6];if(r3<<24>>24==46){r7=r6}else if(r3<<24>>24==0){break}else{r7=r5}r5=r7;r6=r6+1|0}r6=(_strcasecmp(r5,58136)|0)==0;return r6?13:12}function _psi_save_fp(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r4=0;switch(r3|0){case 13:{r5=_psi_save_st(r1,r2);r6=r5;break};case 1:{r7=_psi_save_anadisk(r1,r2);r6=r7;break};case 2:{r8=_psi_save_cp2(r1,r2);r6=r8;break};case 14:{r9=_psi_save_stx(r1,r2);r6=r9;break};case 4:{r10=_psi_save_imd(r1,r2);r6=r10;break};case 8:{r11=_psi_save_pfdc(r1,r2,1);r6=r11;break};case 16:{r12=_psi_save_td0(r1,r2);r6=r12;break};case 10:{r13=_psi_save_pfdc(r1,r2,4);r6=r13;break};case 9:{r14=_psi_save_pfdc(r1,r2,2);r6=r14;break};case 5:{r15=_psi_save_msa(r1,r2);r6=r15;break};case 12:{r16=_psi_save_raw(r1,r2);r6=r16;break};case 6:{r17=_psi_save_pfdc(r1,r2,-1);r6=r17;break};case 7:{r18=_psi_save_pfdc(r1,r2,0);r6=r18;break};case 11:{r19=_psi_save_psi(r1,r2);r6=r19;break};case 17:{r20=_psi_save_xdf(r1,r2);r6=r20;break};case 3:{r21=_psi_save_dc42(r1,r2);r6=r21;break};default:{r6=1}}return r6}function _psi_save(r1,r2,r3){var r4,r5;if((r3|0)==0){r4=_psi_guess_type(r1)}else{r4=r3}r3=_fopen(r1,53376);if((r3|0)==0){r5=1;return r5}r1=_psi_save_fp(r3,r2,r4);_fclose(r3);r5=r1;return r5}function _psi_probe_fp(r1){var r2,r3;if((_psi_probe_psi_fp(r1)|0)==0){if((_psi_probe_pfdc_fp(r1)|0)==0){if((_psi_probe_td0_fp(r1)|0)==0){if((_psi_probe_imd_fp(r1)|0)==0){if((_psi_probe_dc42_fp(r1)|0)==0){if((_psi_probe_msa_fp(r1)|0)==0){if((_psi_probe_stx_fp(r1)|0)==0){r2=(_psi_probe_raw_fp(r1)|0)==0;r3=r2?0:12}else{r3=14}}else{r3=5}}else{r3=3}}else{r3=4}}else{r3=16}}else{r3=6}}else{r3=11}return r3}function _psi_sct_new(r1,r2,r3,r4){var r5,r6,r7;r5=_malloc(60);r6=r5;if((r5|0)==0){r7=0;return r7}HEAP32[r5>>2]=0;HEAP16[r5+4>>1]=r1;HEAP16[r5+6>>1]=r2;HEAP16[r5+8>>1]=r3;HEAP16[r5+10>>1]=r4;HEAP32[r5+12>>2]=0;HEAP16[r5+16>>1]=2;HEAP32[r5+20>>2]=0;if((r4|0)!=0){r3=_malloc(r4);HEAP32[r5+24>>2]=r3;if((r3|0)==0){_free(r5);r7=0;return r7}}else{HEAP32[r5+24>>2]=0}HEAP16[r5+28>>1]=0;HEAP32[r5+48>>2]=-1;HEAP32[r5+52>>2]=0;HEAP8[r5+56|0]=0;HEAP8[r5+58|0]=0;r7=r6;return r7}function _psi_sct_del(r1){var r2;if((r1|0)==0){return}else{r2=r1}while(1){r1=HEAP32[r2>>2];_free(HEAP32[r2+24>>2]);_free(r2);if((r1|0)==0){break}else{r2=r1}}return}function _psi_sct_clone(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=0;r4=HEAP16[r1+4>>1];r5=HEAP16[r1+6>>1];r6=HEAP16[r1+8>>1];r7=HEAP16[r1+10>>1];r8=r7&65535;r9=_malloc(60);r10=r9;if((r9|0)==0){r11=0;return r11}r12=r9;HEAP32[r12>>2]=0;HEAP16[r9+4>>1]=r4;HEAP16[r9+6>>1]=r5;HEAP16[r9+8>>1]=r6;HEAP16[r9+10>>1]=r7;r6=r9+12|0;HEAP32[r6>>2]=0;r5=r9+16|0;HEAP16[r5>>1]=2;r4=r9+20|0;HEAP32[r4>>2]=0;if(r7<<16>>16!=0){r7=_malloc(r8);HEAP32[r9+24>>2]=r7;if((r7|0)==0){_free(r9);r11=0;return r11}else{r13=r7}}else{HEAP32[r9+24>>2]=0;r13=0}r7=r9+28|0;HEAP16[r7>>1]=0;r14=r9+48|0;HEAP32[r14>>2]=-1;r15=r9+52|0;HEAP32[r15>>2]=0;r16=r9+56|0;HEAP8[r16]=0;r17=r9+58|0;HEAP8[r17]=0;HEAP32[r6>>2]=HEAP32[r1+12>>2];HEAP16[r5>>1]=HEAP16[r1+16>>1];_memcpy(r13,HEAP32[r1+24>>2],r8)|0;r8=HEAP16[r1+28>>1];HEAP16[r7>>1]=r8;if(r8<<16>>16!=0){_memcpy(r9+30|0,r1+30|0,r8&65535)|0}HEAP32[r14>>2]=HEAP32[r1+48>>2];HEAP32[r15>>2]=HEAP32[r1+52>>2];if((HEAP8[r1+56|0]|0)!=0){HEAP8[r16]=1;HEAP8[r9+57|0]=HEAP8[r1+57|0]}if((HEAP8[r1+58|0]|0)!=0){HEAP8[r17]=1;HEAP8[r9+59|0]=HEAP8[r1+59|0]}if((r2|0)==0){HEAP32[r4>>2]=0;r11=r10;return r11}HEAP32[r4>>2]=HEAP32[r1+20>>2];r4=r1;while(1){r1=HEAP32[r4>>2];if((r1|0)==0){r11=r10;r3=18;break}r2=_psi_sct_clone(r1,0);HEAP32[r12>>2]=r2;if((r2|0)==0){r18=r10;break}else{r4=r1}}if(r3==18){return r11}while(1){r3=HEAP32[r18>>2];_free(HEAP32[r18+24>>2]);_free(r18);if((r3|0)==0){r11=0;break}else{r18=r3}}return r11}function _psi_sct_add_alternate(r1,r2){var r3,r4;r3=r1;while(1){r4=r3|0;r1=HEAP32[r4>>2];if((r1|0)==0){break}else{r3=r1}}HEAP32[r4>>2]=r2;return}function _psi_sct_get_alternate(r1,r2){var r3,r4,r5,r6,r7;L1:do{if((r2|0)==0){r3=r1}else{r4=r1;r5=r2;while(1){if((r4|0)==0){r3=0;break L1}r6=HEAP32[r4>>2];r7=r5-1|0;if((r7|0)==0){r3=r6;break}else{r4=r6;r5=r7}}}}while(0);return r3}function _psi_sct_set_size(r1,r2,r3){var r4,r5,r6,r7;r4=r1+10|0;if(HEAPU16[r4>>1]>>>0>=r2>>>0){HEAP16[r4>>1]=r2;r5=0;return r5}r6=r1+24|0;r1=_realloc(HEAP32[r6>>2],r2);if((r1|0)==0){r5=1;return r5}r7=HEAPU16[r4>>1];if(r7>>>0<r2>>>0){_memset(r1+r7|0,r3&255,r2-r7|0)|0}HEAP16[r4>>1]=r2;HEAP32[r6>>2]=r1;r5=0;return r5}function _psi_sct_fill(r1,r2){var r3,r4,r5;r3=r1+10|0;if((HEAP16[r3>>1]|0)==0){return}r4=r2&255;r2=r1+24|0;r1=0;while(1){HEAP8[HEAP32[r2>>2]+r1|0]=r4;r5=r1+1|0;if(r5>>>0<HEAPU16[r3>>1]>>>0){r1=r5}else{break}}return}function _psi_sct_uniform(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=HEAP16[r1+10>>1];if((r3&65535)<=1){r4=1;return r4}r5=HEAP32[r1+24>>2];r1=HEAP8[r5];r6=1;while(1){r7=r6+1|0;if(r1<<24>>24!=(HEAP8[r5+r6|0]|0)){r4=0;r2=5;break}if(r7>>>0<(r3&65535)>>>0){r6=r7}else{r4=1;r2=5;break}}if(r2==5){return r4}}function _psi_sct_set_flags(r1,r2,r3){if((r3|0)==0){r3=r1+12|0;HEAP32[r3>>2]=HEAP32[r3>>2]&~r2;return}else{r3=r1+12|0;HEAP32[r3>>2]=HEAP32[r3>>2]|r2;return}}function _psi_sct_set_encoding(r1,r2){var r3;if((r1|0)==0){return}r3=r2&65535;r2=r1;while(1){HEAP16[r2+16>>1]=r3;r1=HEAP32[r2>>2];if((r1|0)==0){break}else{r2=r1}}return}function _psi_sct_set_position(r1,r2){HEAP32[r1+48>>2]=r2;return}function _psi_sct_get_position(r1){return HEAP32[r1+48>>2]}function _psi_sct_set_read_time(r1,r2){HEAP32[r1+52>>2]=r2;return}function _psi_sct_get_read_time(r1){return HEAP32[r1+52>>2]}function _psi_sct_set_mfm_size(r1,r2){HEAP8[r1+56|0]=1;HEAP8[r1+57|0]=r2;return}function _psi_sct_get_mfm_size(r1){var r2,r3;if((HEAP8[r1+56|0]|0)!=0){r2=HEAPU8[r1+57|0];return r2}r3=HEAPU16[r1+10>>1];r1=0;while(1){if((128<<r1|0)<(r3|0)){r1=r1+1|0}else{r2=r1;break}}return r2}function _psi_sct_set_gcr_format(r1,r2){HEAP8[r1+58|0]=1;HEAP8[r1+59|0]=r2;return}function _psi_sct_get_gcr_format(r1){var r2;if((HEAP8[r1+58|0]|0)==0){r2=0;return r2}r2=HEAPU8[r1+59|0];return r2}function _psi_sct_set_tags(r1,r2,r3){var r4,r5;r4=r3>>>0>16?16:r3;HEAP16[r1+28>>1]=r4;if((r4|0)==0){return r4}else{r5=0}while(1){HEAP8[r5+(r1+30)|0]=HEAP8[r2+r5|0];r3=r5+1|0;if(r3>>>0<r4>>>0){r5=r3}else{break}}return r4}function _psi_sct_get_tags(r1,r2,r3){var r4,r5,r6,r7;r4=HEAPU16[r1+28>>1];r5=r4>>>0>r3>>>0?r3:r4;if((r5|0)!=0){r6=0;while(1){HEAP8[r2+r6|0]=HEAP8[r6+(r1+30)|0];r7=r6+1|0;if(r7>>>0<r5>>>0){r6=r7}else{break}}}if(r5>>>0>=r3>>>0){return r5}r6=~r3;r1=~r4;r4=r6>>>0>r1>>>0?r6:r1;_memset(r2+~r4|0,0,r4+r3+1|0)|0;return r5}function _psi_trk_new(r1){var r2,r3;r2=_malloc(8);if((r2|0)==0){r3=0;return r3}HEAP16[r2>>1]=r1;HEAP16[r2+2>>1]=0;HEAP32[r2+4>>2]=0;r3=r2;return r3}function _psi_trk_del(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;if((r1|0)==0){return}r2=r1+2|0;r3=HEAP16[r2>>1];r4=r1+4|0;r5=HEAP32[r4>>2];if(r3<<16>>16==0){r6=r5}else{r7=0;r8=r5;r5=r3;while(1){r3=HEAP32[r8+(r7<<2)>>2];if((r3|0)==0){r9=r5;r10=r8}else{r11=r3;while(1){r3=HEAP32[r11>>2];_free(HEAP32[r11+24>>2]);_free(r11);if((r3|0)==0){break}else{r11=r3}}r9=HEAP16[r2>>1];r10=HEAP32[r4>>2]}r11=r7+1|0;if(r11>>>0<(r9&65535)>>>0){r7=r11;r8=r10;r5=r9}else{r6=r10;break}}}_free(r6);_free(r1);return}function _psi_trk_add_sector(r1,r2){var r3,r4,r5,r6;r3=r1+4|0;r4=r1+2|0;r1=_realloc(HEAP32[r3>>2],(HEAPU16[r4>>1]<<2)+4|0);r5=r1;if((r1|0)==0){r6=1;return r6}HEAP32[r3>>2]=r5;r3=HEAP16[r4>>1];HEAP32[r5+((r3&65535)<<2)>>2]=r2;HEAP16[r4>>1]=r3+1;r6=0;return r6}function _psi_trk_get_indexed_sector(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r4=0;r5=HEAP16[r1+2>>1];r6=r5&65535;if(r5<<16>>16==0){r7=0;return r7}if((r3|0)!=0){if(r6>>>0<=r2>>>0){r7=0;return r7}r7=HEAP32[HEAP32[r1+4>>2]+(r2<<2)>>2];return r7}r3=r1+4|0;r1=0;r8=r2;r2=r5;L11:while(1){r9=HEAP32[r3>>2];r10=r2&65535;r11=0;r12=0;r13=0;while(1){r14=HEAP16[HEAP32[r9+(r11<<2)>>2]+8>>1];if((r14&65535)>>>0>=r1>>>0){if((r13|0)!=0){r15=HEAP16[HEAP32[r9+(r12<<2)>>2]+8>>1];if((r14&65535)>=(r15&65535)){r16=(r14<<16>>16==r15<<16>>16)+r13|0;r17=r12}else{r16=1;r17=r11}}else{r16=1;r17=r11}}else{r16=r13;r17=r12}r15=r11+1|0;if(r15>>>0<r10>>>0){r11=r15;r12=r17;r13=r16}else{break}}if((r16|0)==0){r7=0;r4=22;break}if(r8>>>0<r16>>>0){if(r2<<16>>16==0){r18=r8;r19=0}else{r13=HEAP32[r3>>2];r12=HEAP16[HEAP32[r13+(r17<<2)>>2]+8>>1];r11=r8;r10=0;while(1){r9=HEAP32[r13+(r10<<2)>>2];if((HEAP16[r9+8>>1]|0)==r12<<16>>16){if((r11|0)==0){r7=r9;r4=22;break L11}r20=r11-1|0}else{r20=r11}r9=r10+1|0;if(r9>>>0<r6>>>0){r11=r20;r10=r9}else{r18=r20;r19=r5;break}}}}else{r18=r8-r16|0;r19=r2}r1=HEAPU16[HEAP32[HEAP32[r3>>2]+(r17<<2)>>2]+8>>1]+1|0;r8=r18;r2=r19}if(r4==22){return r7}}function _psi_trk_interleave(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=HEAP16[r1+2>>1];r4=r3&65535;if((r3&65535)<2){r5=0;return r5}r3=_malloc(r4<<2);r6=r3;if((r3|0)==0){r5=1;return r5}r7=r1+4|0;r8=0;while(1){r9=HEAP32[r7>>2]+(r8<<2)|0;r10=HEAP32[r9>>2];HEAP32[r9>>2]=0;L9:do{if((r8|0)==0){r11=0}else{r9=HEAP16[r10+8>>1];r12=r8;while(1){r13=r12-1|0;r14=HEAP32[r6+(r13<<2)>>2];if((r9&65535)>=HEAPU16[r14+8>>1]){r11=r12;break L9}HEAP32[r6+(r12<<2)>>2]=r14;if((r13|0)==0){r11=0;break}else{r12=r13}}}}while(0);HEAP32[r6+(r11<<2)>>2]=r10;r12=r8+1|0;if(r12>>>0<r4>>>0){r8=r12}else{break}}r8=r1+4|0;r1=0;r11=0;while(1){r7=HEAP32[r8>>2];r12=r7+(r1<<2)|0;if((HEAP32[r12>>2]|0)==0){r15=r1;r16=r12}else{r12=r1;while(1){r9=((r12+1|0)>>>0)%(r4>>>0)&-1;r13=r7+(r9<<2)|0;if((HEAP32[r13>>2]|0)==0){r15=r9;r16=r13;break}else{r12=r9}}}HEAP32[r16>>2]=HEAP32[r6+(r11<<2)>>2];r12=r11+1|0;if(r12>>>0<r4>>>0){r1=((r15+r2|0)>>>0)%(r4>>>0)&-1;r11=r12}else{break}}_free(r3);r5=0;return r5}function _psi_cyl_free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=r1+2|0;r3=HEAP16[r2>>1];r4=r1+4|0;r1=HEAP32[r4>>2];if(r3<<16>>16==0){r5=r1;r6=r5;_free(r6);HEAP16[r2>>1]=0;HEAP32[r4>>2]=0;return}else{r7=0;r8=r1;r9=r3}while(1){r3=HEAP32[r8+(r7<<2)>>2];if((r3|0)==0){r10=r9;r11=r8}else{r1=r3+2|0;r12=HEAP16[r1>>1];r13=r3+4|0;r14=HEAP32[r13>>2];if(r12<<16>>16==0){r15=r14}else{r16=0;r17=r14;r14=r12;while(1){r12=HEAP32[r17+(r16<<2)>>2];if((r12|0)==0){r18=r14;r19=r17}else{r20=r12;while(1){r12=HEAP32[r20>>2];_free(HEAP32[r20+24>>2]);_free(r20);if((r12|0)==0){break}else{r20=r12}}r18=HEAP16[r1>>1];r19=HEAP32[r13>>2]}r20=r16+1|0;if(r20>>>0<(r18&65535)>>>0){r16=r20;r17=r19;r14=r18}else{r15=r19;break}}}_free(r15);_free(r3);r10=HEAP16[r2>>1];r11=HEAP32[r4>>2]}r14=r7+1|0;if(r14>>>0<(r10&65535)>>>0){r7=r14;r8=r11;r9=r10}else{r5=r11;break}}r6=r5;_free(r6);HEAP16[r2>>1]=0;HEAP32[r4>>2]=0;return}function _psi_img_new(){var r1,r2;r1=_malloc(16);if((r1|0)==0){r2=0;return r2}HEAP16[r1>>1]=0;HEAP32[r1+4>>2]=0;HEAP32[r1+8>>2]=0;HEAP32[r1+12>>2]=0;r2=r1;return r2}function _psi_img_del(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;if((r1|0)==0){return}r2=r1|0;r3=HEAP16[r2>>1];r4=r1+4|0;r5=HEAP32[r4>>2];if(r3<<16>>16==0){r6=r5}else{r7=0;r8=r5;r5=r3;while(1){r3=HEAP32[r8+(r7<<2)>>2];if((r3|0)==0){r9=r5;r10=r8}else{_psi_cyl_free(r3);_free(r3);r9=HEAP16[r2>>1];r10=HEAP32[r4>>2]}r3=r7+1|0;if(r3>>>0<(r9&65535)>>>0){r7=r3;r8=r10;r5=r9}else{r6=r10;break}}}_free(r6);HEAP16[r2>>1]=0;HEAP32[r4>>2]=0;_free(HEAP32[r1+12>>2]);_free(r1);return}function _psi_img_erase(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=r1|0;r3=HEAP16[r2>>1];r4=r1+4|0;r5=HEAP32[r4>>2];if(r3<<16>>16==0){r6=r5}else{r7=0;r8=r5;r5=r3;while(1){r3=HEAP32[r8+(r7<<2)>>2];if((r3|0)==0){r9=r5;r10=r8}else{_psi_cyl_free(r3);_free(r3);r9=HEAP16[r2>>1];r10=HEAP32[r4>>2]}r3=r7+1|0;if(r3>>>0<(r9&65535)>>>0){r7=r3;r8=r10;r5=r9}else{r6=r10;break}}}_free(r6);HEAP16[r2>>1]=0;HEAP32[r4>>2]=0;r4=r1+12|0;_free(HEAP32[r4>>2]);HEAP32[r1+8>>2]=0;HEAP32[r4>>2]=0;return}function _psi_img_add_track(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=r1|0;r6=HEAPU16[r5>>1];r7=r1+4|0;r1=HEAP32[r7>>2];L1:do{if(r6>>>0<=r3>>>0){r8=r6;r9=r1;while(1){r10=_realloc(r9,(r8<<2)+4|0);if((r10|0)==0){r11=1;r4=11;break}r12=r10;HEAP32[r7>>2]=r12;r10=HEAP16[r5>>1];r13=_malloc(8);if((r13|0)==0){r11=1;r4=11;break}HEAP16[r13>>1]=r10;HEAP16[r13+2>>1]=0;HEAP32[r13+4>>2]=0;HEAP32[r12+((r10&65535)<<2)>>2]=r13;r13=r10+1&65535;HEAP16[r5>>1]=r13;r10=r13&65535;if(r10>>>0>r3>>>0){r14=r12;break L1}else{r8=r10;r9=r12}}if(r4==11){return r11}}else{r14=r1}}while(0);r1=HEAP32[r14+(r3<<2)>>2];if((r1|0)==0){r11=1;return r11}r3=r1+4|0;r14=r1+2|0;r1=_realloc(HEAP32[r3>>2],(HEAPU16[r14>>1]<<2)+4|0);if((r1|0)==0){r11=1;return r11}r4=r1;HEAP32[r3>>2]=r4;r3=HEAP16[r14>>1];do{if((r2|0)==0){r1=_malloc(8);if((r1|0)==0){r11=1;return r11}else{HEAP16[r1>>1]=r3;HEAP16[r1+2>>1]=0;HEAP32[r1+4>>2]=0;r15=r1;break}}else{r15=r2}}while(0);HEAP32[r4+((r3&65535)<<2)>>2]=r15;HEAP16[r14>>1]=r3+1;r11=0;return r11}function _psi_img_get_cylinder(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=r1|0;r6=HEAPU16[r5>>1];if(r6>>>0>r2>>>0){r7=HEAP32[HEAP32[r1+4>>2]+(r2<<2)>>2];return r7}if((r3|0)==0){r7=0;return r7}r3=r1+4|0;r1=r6;r6=HEAP32[r3>>2];while(1){r8=_realloc(r6,(r1<<2)+4|0);if((r8|0)==0){r7=0;r4=9;break}r9=r8;HEAP32[r3>>2]=r9;r8=HEAP16[r5>>1];r10=_malloc(8);if((r10|0)==0){r7=0;r4=9;break}HEAP16[r10>>1]=r8;HEAP16[r10+2>>1]=0;HEAP32[r10+4>>2]=0;HEAP32[r9+((r8&65535)<<2)>>2]=r10;r10=r8+1&65535;HEAP16[r5>>1]=r10;r8=r10&65535;if(r8>>>0>r2>>>0){r4=8;break}else{r1=r8;r6=r9}}if(r4==8){r7=HEAP32[r9+(r2<<2)>>2];return r7}else if(r4==9){return r7}}function _psi_img_add_sector(r1,r2,r3,r4){var r5,r6;r5=_psi_img_get_track(r1,r3,r4,1);if((r5|0)==0){r6=1;return r6}r4=r5+4|0;r3=r5+2|0;r5=_realloc(HEAP32[r4>>2],(HEAPU16[r3>>1]<<2)+4|0);r1=r5;if((r5|0)==0){r6=1;return r6}HEAP32[r4>>2]=r1;r4=HEAP16[r3>>1];HEAP32[r1+((r4&65535)<<2)>>2]=r2;HEAP16[r3>>1]=r4+1;r6=0;return r6}function _psi_img_get_track(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r5=0;r6=r1|0;r7=HEAPU16[r6>>1];L1:do{if(r7>>>0<=r2>>>0){if((r4|0)==0){r8=0;return r8}r9=r1+4|0;r10=r7;r11=HEAP32[r9>>2];while(1){r12=_realloc(r11,(r10<<2)+4|0);if((r12|0)==0){r8=0;r5=17;break}r13=r12;HEAP32[r9>>2]=r13;r12=HEAP16[r6>>1];r14=_malloc(8);if((r14|0)==0){r8=0;r5=17;break}HEAP16[r14>>1]=r12;HEAP16[r14+2>>1]=0;HEAP32[r14+4>>2]=0;HEAP32[r13+((r12&65535)<<2)>>2]=r14;r14=r12+1&65535;HEAP16[r6>>1]=r14;r12=r14&65535;if(r12>>>0>r2>>>0){r15=r13;break L1}else{r10=r12;r11=r13}}if(r5==17){return r8}}else{r15=HEAP32[r1+4>>2]}}while(0);r1=HEAP32[r15+(r2<<2)>>2];if((r1|0)==0){r8=0;return r8}r2=r1+2|0;r15=HEAPU16[r2>>1];if(r15>>>0>r3>>>0){r8=HEAP32[HEAP32[r1+4>>2]+(r3<<2)>>2];return r8}if((r4|0)==0){r8=0;return r8}r4=r1+4|0;r1=r15;r15=HEAP32[r4>>2];while(1){r6=_realloc(r15,(r1<<2)+4|0);if((r6|0)==0){r8=0;r5=17;break}r16=r6;HEAP32[r4>>2]=r16;r6=HEAP16[r2>>1];r7=_malloc(8);if((r7|0)==0){r8=0;r5=17;break}HEAP16[r7>>1]=r6;HEAP16[r7+2>>1]=0;HEAP32[r7+4>>2]=0;HEAP32[r16+((r6&65535)<<2)>>2]=r7;r7=r6+1&65535;HEAP16[r2>>1]=r7;r6=r7&65535;if(r6>>>0>r3>>>0){r5=16;break}else{r1=r6;r15=r16}}if(r5==16){r8=HEAP32[r16+(r3<<2)>>2];return r8}else if(r5==17){return r8}}function _psi_img_remove_sector(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=r1|0;r4=HEAP16[r3>>1];if(r4<<16>>16==0){return}r5=r1+4|0;r1=0;r6=r4;while(1){r4=HEAP32[HEAP32[r5>>2]+(r1<<2)>>2];r7=r4+2|0;if((HEAP16[r7>>1]|0)==0){r8=r6}else{r9=r4+4|0;r4=0;while(1){r10=HEAP32[HEAP32[r9>>2]+(r4<<2)>>2];r11=r10+2|0;r12=HEAP16[r11>>1];if(r12<<16>>16==0){r13=0}else{r14=r10+4|0;r10=r12&65535;r12=0;r15=0;while(1){r16=HEAP32[r14>>2];r17=HEAP32[r16+(r12<<2)>>2];if((r17|0)==(r2|0)){r18=r15}else{HEAP32[r16+(r15<<2)>>2]=r17;r18=r15+1|0}r17=r12+1|0;if(r17>>>0<r10>>>0){r12=r17;r15=r18}else{break}}r13=r18&65535}HEAP16[r11>>1]=r13;r15=r4+1|0;if(r15>>>0<HEAPU16[r7>>1]>>>0){r4=r15}else{break}}r8=HEAP16[r3>>1]}r4=r1+1|0;if(r4>>>0<(r8&65535)>>>0){r1=r4;r6=r8}else{break}}return}function _psi_img_get_sector(r1,r2,r3,r4,r5){var r6,r7,r8;r6=0;if(HEAPU16[r1>>1]>>>0<=r2>>>0){r7=0;return r7}r8=HEAP32[HEAP32[r1+4>>2]+(r2<<2)>>2];if((r8|0)==0){r7=0;return r7}if(HEAPU16[r8+2>>1]>>>0<=r3>>>0){r7=0;return r7}r2=HEAP32[HEAP32[r8+4>>2]+(r3<<2)>>2];if((r2|0)==0){r7=0;return r7}r3=HEAP16[r2+2>>1];if((r5|0)!=0){if((r3&65535)>>>0<=r4>>>0){r7=0;return r7}r7=HEAP32[HEAP32[r2+4>>2]+(r4<<2)>>2];return r7}if(r3<<16>>16==0){r7=0;return r7}r5=HEAP32[r2+4>>2];r2=0;while(1){r8=HEAP32[r5+(r2<<2)>>2];r1=r2+1|0;if((HEAPU16[r8+8>>1]|0)==(r4|0)){r7=r8;r6=12;break}if(r1>>>0<(r3&65535)>>>0){r2=r1}else{r7=0;r6=12;break}}if(r6==12){return r7}}function _psi_img_map_sector(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r6=0;r7=HEAP16[r1>>1];if(r7<<16>>16==0){r8=1;return r8}r9=HEAP32[r1+4>>2];r1=0;r10=r2;L4:while(1){r2=HEAP32[r9+(r1<<2)>>2];r11=HEAP16[r2+2>>1];if(r11<<16>>16==0){r12=r10}else{r13=HEAP32[r2+4>>2];r14=0;r15=r10;while(1){r16=HEAP32[r13+(r14<<2)>>2];r17=HEAP16[r16+2>>1];r18=r17&65535;if(r15>>>0<r18>>>0){break L4}r2=r15-r18|0;r19=r14+1|0;if(r19>>>0<(r11&65535)>>>0){r14=r19;r15=r2}else{r12=r2;break}}}r11=r1+1|0;if(r11>>>0<(r7&65535)>>>0){r1=r11;r10=r12}else{r8=1;r6=13;break}}if(r6==13){return r8}r12=_psi_trk_get_indexed_sector(r16,r15,0);if((r12|0)==0){r8=1;return r8}HEAP32[r3>>2]=r1;HEAP32[r4>>2]=r14;HEAP32[r5>>2]=0;if(r17<<16>>16==0){r8=1;return r8}r17=HEAP32[r16+4>>2];r16=0;r14=0;while(1){if((HEAP32[r17+(r16<<2)>>2]|0)==(r12|0)){r8=0;r6=13;break}r4=r14+1|0;HEAP32[r5>>2]=r4;r1=r16+1|0;if(r1>>>0<r18>>>0){r16=r1;r14=r4}else{r8=1;r6=13;break}}if(r6==13){return r8}}function _psi_img_add_comment(r1,r2,r3){var r4,r5,r6,r7;r4=r1+12|0;r5=r1+8|0;r1=_realloc(HEAP32[r4>>2],HEAP32[r5>>2]+r3|0);if((r1|0)==0){r6=1;return r6}r7=HEAP32[r5>>2];_memcpy(r1+r7|0,r2,r3)|0;HEAP32[r5>>2]=r7+r3;HEAP32[r4>>2]=r1;r6=0;return r6}function _psi_img_set_comment(r1,r2,r3){var r4,r5,r6,r7;r4=r1+12|0;_free(HEAP32[r4>>2]);r5=r1+8|0;HEAP32[r5>>2]=0;HEAP32[r4>>2]=0;if((r2|0)==0|(r3|0)==0){r6=0;return r6}r1=_realloc(0,r3);if((r1|0)==0){r6=1;return r6}r7=HEAP32[r5>>2];_memcpy(r1+r7|0,r2,r3)|0;HEAP32[r5>>2]=r7+r3;HEAP32[r4>>2]=r1;r6=0;return r6}function _psi_img_clean_comment(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r3=r1+8|0;r4=HEAP32[r3>>2];r5=r1+12|0;r1=HEAP32[r5>>2];L1:do{if((r4|0)==0){r6=0}else{r7=0;while(1){r8=r7+1|0;if((HEAP8[r1+r7|0]|0)!=10){r6=r7;break L1}if(r8>>>0<r4>>>0){r7=r8}else{r6=r8;break}}}}while(0);if(r6>>>0<r4>>>0){r7=0;r8=r6;while(1){r6=HEAP8[r1+r8|0];if(r6<<24>>24==0){HEAP8[r1+r7|0]=10;r9=r8;r10=r7+1|0}else if(r6<<24>>24==13){r11=r7+1|0;HEAP8[r1+r7|0]=10;r12=r8+1|0;if(r12>>>0<r4>>>0){r9=(HEAP8[r1+r12|0]|0)==10?r12:r8;r10=r11}else{r9=r8;r10=r11}}else{HEAP8[r1+r7|0]=r6;r9=r8;r10=r7+1|0}r6=r9+1|0;if(r6>>>0<r4>>>0){r7=r10;r8=r6}else{r13=r10;break}}}else{r13=0}while(1){if((r13|0)==0){r2=14;break}r10=r13-1|0;if((HEAP8[r1+r10|0]|0)==10){r13=r10}else{r2=13;break}}if(r2==13){HEAP32[r3>>2]=r13;return}else if(r2==14){HEAP32[r3>>2]=0;_free(HEAP32[r5>>2]);HEAP32[r5>>2]=0;return}}function _psi_img_get_sector_count(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=HEAP16[r1>>1];if(r2<<16>>16==0){r3=0;return r3}r4=HEAP32[r1+4>>2];r1=r2&65535;r2=0;r5=0;while(1){r6=HEAP32[r4+(r2<<2)>>2];r7=HEAP16[r6+2>>1];if(r7<<16>>16==0){r8=r5}else{r9=HEAP32[r6+4>>2];r6=r7&65535;r7=0;r10=r5;while(1){r11=HEAP32[r9+(r7<<2)>>2];r12=HEAP16[r11+2>>1];if(r12<<16>>16==0){r13=r10}else{r14=HEAP32[r11+4>>2];r11=r12&65535;r12=0;r15=r10;while(1){r16=HEAP32[r14+(r12<<2)>>2];if((r16|0)==0){r17=r15}else{r18=r15;r19=r16;while(1){r16=r18+1|0;r20=HEAP32[r19>>2];if((r20|0)==0){r17=r16;break}else{r18=r16;r19=r20}}}r19=r12+1|0;if(r19>>>0<r11>>>0){r12=r19;r15=r17}else{r13=r17;break}}}r15=r7+1|0;if(r15>>>0<r6>>>0){r7=r15;r10=r13}else{r8=r13;break}}}r10=r2+1|0;if(r10>>>0<r1>>>0){r2=r10;r5=r8}else{r3=r8;break}}return r3}function _psi_load_anadisk(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=_psi_img_new();if((r5|0)==0){r6=0;STACKTOP=r3;return r6}r7=r4|0;r8=r4+1|0;r9=r4+7|0;r10=r4+6|0;r11=r4+2|0;r12=r4+3|0;r13=r4+4|0;r14=r4+5|0;while(1){r4=_fread(r7,1,8,r1);if((r4|0)==0){r6=r5;r2=9;break}else if((r4|0)!=8){break}r4=HEAP8[r7];r15=HEAP8[r8];r16=HEAPU8[r9]<<8|HEAPU8[r10];r17=_psi_sct_new(HEAPU8[r11],HEAPU8[r12],HEAPU8[r13],r16);if((r17|0)==0){break}_psi_sct_set_mfm_size(r17,HEAP8[r14]);if((_psi_img_add_sector(r5,r17,r4&255,r15&255)|0)!=0){r2=6;break}if((_fread(HEAP32[r17+24>>2],1,r16,r1)|0)!=(r16|0)){break}}if(r2==6){_psi_sct_del(r17)}else if(r2==9){STACKTOP=r3;return r6}_psi_img_del(r5);r6=0;STACKTOP=r3;return r6}function _psi_save_anadisk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r2|0;r7=HEAP16[r6>>1];L1:do{if(r7<<16>>16!=0){r8=r2+4|0;r9=r5|0;r10=r5+1|0;r11=r5+2|0;r12=r5+3|0;r13=r5+4|0;r14=r5+5|0;r15=r5+6|0;r16=r5+7|0;r17=0;r18=r7;L3:while(1){r19=HEAP32[HEAP32[r8>>2]+(r17<<2)>>2];r20=r19+2|0;r21=HEAP16[r20>>1];if(r21<<16>>16==0){r22=r18}else{r23=r19+4|0;r19=r17&255;r24=0;r25=r21;while(1){r21=HEAP32[HEAP32[r23>>2]+(r24<<2)>>2];r26=r21+2|0;if((HEAP16[r26>>1]|0)==0){r27=r25}else{r28=r21+4|0;r21=r24&255;r29=0;while(1){r30=HEAP32[HEAP32[r28>>2]+(r29<<2)>>2];r31=_psi_sct_get_mfm_size(r30);HEAP8[r9]=r19;HEAP8[r10]=r21;HEAP8[r11]=HEAP16[r30+4>>1];HEAP8[r12]=HEAP16[r30+6>>1];HEAP8[r13]=HEAP16[r30+8>>1];HEAP8[r14]=r31;r31=r30+10|0;r32=HEAP16[r31>>1];HEAP8[r15]=r32;HEAP8[r16]=(r32&65535)>>>8;if((_fwrite(r9,1,8,r1)|0)!=8){r33=1;r3=15;break L3}r32=_fwrite(HEAP32[r30+24>>2],1,HEAPU16[r31>>1],r1);r30=r29+1|0;if((r32|0)!=(HEAPU16[r31>>1]|0)){r33=1;r3=15;break L3}if(r30>>>0<HEAPU16[r26>>1]>>>0){r29=r30}else{break}}r27=HEAP16[r20>>1]}r29=r24+1|0;if(r29>>>0<(r27&65535)>>>0){r24=r29;r25=r27}else{break}}r22=HEAP16[r6>>1]}r25=r17+1|0;if(r25>>>0<(r22&65535)>>>0){r17=r25;r18=r22}else{break L1}}if(r3==15){STACKTOP=r4;return r33}}}while(0);_fflush(r1);r33=0;STACKTOP=r4;return r33}function _psi_load_cp2(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+432|0;r5=r4;r6=r4+8;r7=r4+400;r8=_psi_img_new();if((r8|0)==0){r9=0;STACKTOP=r4;return r9}r10=r7|0;L4:do{if((_psi_read_ofs(r1,0,r10,30)|0)==0){if((_memcmp(r10,6688,16)|0)!=0){_fwrite(36592,20,1,HEAP32[_stderr>>2]);break}r11=r7+16|0;r12=0;while(1){r13=r12+1|0;if((_memcmp(r11,HEAP32[6664+(r12<<2)>>2],14)|0)==0){break}if((r13|0)==5){r2=8;break}else{r12=r13}}if(r2==8){_fwrite(33592,34,1,HEAP32[_stderr>>2])}r12=r6|0;r11=r5|0;r13=r5+1|0;r14=r6+3|0;r15=r6+2|0;r16=r6+1|0;r17=HEAP32[_stderr>>2];r18=30;L15:while(1){if((_psi_read_ofs(r1,r18,r11,2)|0)!=0){r9=r8;r2=60;break}r19=HEAPU8[r13]<<8|HEAPU8[r11];if((r19|0)==0){r9=r8;r2=60;break}r20=r18+2|0;if((_psi_read_ofs(r1,r19+r20|0,r11,2)|0)!=0){break L4}r21=HEAPU8[r13]<<8|HEAPU8[r11];r22=r19+4|0;if(r19>>>0>=387){r23=r22+r18|0;r24=0;r25=387;while(1){if((_psi_read_ofs(r1,r24+r20|0,r12,387)|0)!=0){break L4}r26=HEAP8[r15];r27=r26&255;if(r26<<24>>24!=0){if((r26&255)>24){break L4}r26=_psi_img_get_track(r8,HEAPU8[r12],HEAPU8[r16],1);if((r26|0)==0){break L4}else{r28=r14;r29=0}while(1){r30=r29+1|0;r31=r28+9|0;r32=r28+8|0;r33=HEAPU8[r31]<<8|HEAPU8[r32];r34=r28+2|0;if(((((HEAP8[r34]&-106)<<24>>24==0?(HEAP8[r28+10|0]|0)==0:0)?(HEAP8[r28+11|0]|0)==0:0)?(HEAP8[r28+14|0]&127)==0:0)?(HEAP8[r28+15|0]|0)==0:0){r35=HEAP8[r28+7|0];if((r35&255)<7&r33>>>0>5804){r36=r35}else{r2=26}}else{r2=26}if(r2==26){r2=0;r35=HEAPU8[r16];_fprintf(r17,56688,(r3=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r3>>2]=HEAPU8[r12],HEAP32[r3+8>>2]=r35,HEAP32[r3+16>>2]=r30,r3));STACKTOP=r3;r35=0;while(1){if((r35|0)!=8){if((r35&3|0)==0){_fputc(32,r17)}}else{_fwrite(50136,2,1,r17)}_fprintf(r17,42632,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r28+r35|0],r3));STACKTOP=r3;r33=r35+1|0;if(r33>>>0<16){r35=r33}else{break}}_fputc(10,r17);_fflush(r17);r36=HEAP8[r28+7|0]}if((r36&255)<7){r37=128<<(r36&255)}else{r37=0}r38=_psi_sct_new(HEAPU8[r28+4|0],HEAPU8[r28+5|0],HEAPU8[r28+6|0],r37);if((r38|0)==0){break L4}_psi_sct_set_mfm_size(r38,HEAP8[r28+7|0]);if((_psi_trk_add_sector(r26,r38)|0)!=0){r2=37;break L15}r35=HEAPU8[r31]<<8|HEAPU8[r32];do{if((HEAP8[r28+14|0]&50)==0){r33=r28+3|0;if((HEAP8[r33]&1)!=0){_psi_sct_fill(r38,0);r39=r33;break}if((r37-256|0)>>>0>3840){_psi_sct_fill(r38,0);r39=r33;break}if(r35>>>0<5805){_psi_sct_fill(r38,0);r39=r33;break}r40=r35-5805|0;if((r40+r37|0)>>>0<=r21>>>0){if((_psi_read_ofs(r1,r23+r40|0,HEAP32[r38+24>>2],r37)|0)==0){r39=r33;break}else{break L4}}else{r40=HEAPU8[r16];_fprintf(r17,53512,(r3=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r3>>2]=HEAPU8[r12],HEAP32[r3+8>>2]=r40,HEAP32[r3+16>>2]=r30,HEAP32[r3+24>>2]=r37,r3));STACKTOP=r3;_psi_sct_fill(r38,0);r39=r33;break}}else{_psi_sct_fill(r38,0);r39=r28+3|0}}while(0);do{if((HEAP8[r34]&32)!=0){if((HEAP8[r39]&32)==0){_psi_sct_set_flags(r38,1,1);break}else{_psi_sct_set_flags(r38,2,1);break}}}while(0);r34=HEAP8[r39];if((r34&1)==0){r41=r34}else{_psi_sct_set_flags(r38,8,1);r41=HEAP8[r39]}if((r41&64)!=0){_psi_sct_set_flags(r38,4,1)}if(r30>>>0<r27>>>0){r28=r28+16|0;r29=r30}else{break}}}r27=r25+387|0;if(r27>>>0>r19>>>0){break}else{r24=r25;r25=r27}}}r25=r21+r22|0;if((r25|0)==0){r9=r8;r2=60;break}else{r18=r25+r18|0}}if(r2==37){_psi_sct_del(r38);break}else if(r2==60){STACKTOP=r4;return r9}}}while(0);_psi_img_del(r8);r9=0;STACKTOP=r4;return r9}function _psi_save_cp2(r1,r2){return 1}function _psi_load_dc42(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51;r2=STACKTOP;STACKTOP=STACKTOP+152|0;r3=r2;r4=r2+16;r5=r2+24;r6=_psi_img_new();if((r6|0)==0){r7=0;STACKTOP=r2;return r7}r8=r5|0;L4:do{if((_psi_read(r1,r8,84)|0)==0){r9=(_psi_get_uint16_be(r8,82)|0)!=256;if(!(r9|HEAPU8[r8]>63)){r9=_psi_get_uint32_be(r8,64);r10=_psi_get_uint32_be(r8,68);r11=_psi_get_uint32_be(r8,72);r12=_psi_get_uint32_be(r8,76);r13=HEAP8[r5+81|0];if((r9|0)==409600){r14=_dc42_load_gcr(r1,r6,1,r4,r13&255)}else if((r9|0)==819200){r14=_dc42_load_gcr(r1,r6,2,r4,r13&255)}else if((r9|0)==737280){r14=_dc42_load_mfm(r1,r6,9,r4)}else if((r9|0)==1474560){r14=_dc42_load_mfm(r1,r6,18,r4)}else{break}if((r14|0)==0){if((r11|0)!=(HEAP32[r4>>2]|0)){_fwrite(50080,26,1,HEAP32[_stderr>>2]);break}if((r10|0)==0){r7=r6;STACKTOP=r2;return r7}r11=r3|0;HEAP32[r4>>2]=0;r9=r6|0;r13=HEAP16[r9>>1];if(r13<<16>>16==0){r15=r10;r16=0}else{r17=r6+4|0;r18=r3+1|0;r19=r3+2|0;r20=r3+3|0;r21=r3+4|0;r22=r3+5|0;r23=r3+6|0;r24=r3+7|0;r25=r3+8|0;r26=r3+9|0;r27=r3+10|0;r28=r3+11|0;r29=0;r30=r10;r10=r13;r13=0;while(1){r31=HEAP32[HEAP32[r17>>2]+(r29<<2)>>2];r32=r31+2|0;r33=HEAP16[r32>>1];if(r33<<16>>16==0){r34=r30;r35=r10;r36=r13}else{r37=r31+4|0;r31=0;r38=r30;r39=r33;r33=r13;while(1){r40=HEAP32[HEAP32[r37>>2]+(r31<<2)>>2]+2|0;if((HEAP16[r40>>1]|0)==0){r41=r38;r42=r39;r43=r33}else{r44=r31|r29;r45=0;r46=r38;r47=r33;while(1){r48=_psi_img_get_sector(r6,r29,r31,r45,0);if((r48|0)==0|r46>>>0<12){break L4}if((_psi_read(r1,r11,12)|0)!=0){break L4}_psi_sct_set_tags(r48,r11,12);if((r44|r45|0)==0){r49=r47}else{r48=(HEAPU8[r11]<<8|HEAPU8[r18])+r47|0;r50=(r48>>>1|r48<<31)+(HEAPU8[r19]<<8|HEAPU8[r20])|0;r48=(r50>>>1|r50<<31)+(HEAPU8[r21]<<8|HEAPU8[r22])|0;r50=(r48>>>1|r48<<31)+(HEAPU8[r23]<<8|HEAPU8[r24])|0;r48=(r50>>>1|r50<<31)+(HEAPU8[r25]<<8|HEAPU8[r26])|0;r50=(r48>>>1|r48<<31)+(HEAPU8[r27]<<8|HEAPU8[r28])|0;r48=r50>>>1|r50<<31;HEAP32[r4>>2]=r48;r49=r48}r51=r46-12|0;r48=r45+1|0;if(r48>>>0<HEAPU16[r40>>1]>>>0){r45=r48;r46=r51;r47=r49}else{break}}r41=r51;r42=HEAP16[r32>>1];r43=r49}r47=r31+1|0;if(r47>>>0<(r42&65535)>>>0){r31=r47;r38=r41;r39=r42;r33=r43}else{break}}r34=r41;r35=HEAP16[r9>>1];r36=r43}r33=r29+1|0;if(r33>>>0<(r35&65535)>>>0){r29=r33;r30=r34;r10=r35;r13=r36}else{r15=r34;r16=r36;break}}}if((r15|0)==0){if((r12|0)==(r16|0)){r7=r6;STACKTOP=r2;return r7}else{_fwrite(46152,25,1,HEAP32[_stderr>>2]);break}}}}}}while(0);_psi_img_del(r6);r7=0;STACKTOP=r2;return r7}function _psi_save_dc42(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+144|0;r5=r4;r6=r4+16;r7=r6|0;if((HEAP16[r2>>1]|0)!=80){r8=1;r9=128;r10=0;STACKTOP=r4;return r8}r11=HEAP32[r2+4>>2];r12=0;L4:while(1){r13=HEAP32[r11+(r12<<2)>>2];if((HEAP16[r13+2>>1]|0)!=1){r14=0;r3=19;break}r15=12-(r12>>>4)|0;r16=HEAP32[HEAP32[r13+4>>2]>>2];r13=HEAP16[r16+2>>1];if((r13&65535|0)!=(r15|0)){r14=0;r3=19;break}if(r13<<16>>16!=0){r13=HEAP32[r16+4>>2];r16=0;while(1){r17=HEAP32[r13+(r16<<2)>>2];if((HEAP16[r17+10>>1]|0)!=512){r14=0;r3=19;break L4}r18=r16+1|0;if(HEAPU16[r17+8>>1]>>>0>=r15>>>0){r14=0;r3=19;break L4}if(r18>>>0<r15>>>0){r16=r18}else{break}}}r16=r12+1|0;if(r16>>>0<80){r12=r16}else{r19=0;r3=11;break}}L15:do{if(r3==11){while(1){r3=0;r12=HEAP32[r11+(r19<<2)>>2];r16=HEAP16[r12+2>>1];if(r16<<16>>16!=0){r15=HEAP32[r12+4>>2];r12=r16&65535;r16=0;while(1){r13=HEAP32[r15+(r16<<2)>>2];r18=HEAP16[r13+2>>1];if(r18<<16>>16!=0){r17=HEAP32[r13+4>>2];r13=r18&65535;r18=0;while(1){r20=r18+1|0;if((HEAP16[HEAP32[r17+(r18<<2)>>2]+28>>1]|0)!=0){r21=9600;r22=409600;r23=2;r24=0;r25=1;break L15}if(r20>>>0<r13>>>0){r18=r20}else{break}}}r18=r16+1|0;if(r18>>>0<r12>>>0){r16=r18}else{break}}}r16=r19+1|0;if(r16>>>0<80){r19=r16;r3=11}else{r21=0;r22=409600;r23=2;r24=0;r25=1;break}}}else if(r3==19){L16:while(1){r3=0;r16=HEAP32[r11+(r14<<2)>>2];if((HEAP16[r16+2>>1]|0)!=2){r26=0;break}r12=12-(r14>>>4)|0;r15=HEAP32[r16+4>>2];r16=0;while(1){r18=HEAP32[r15+(r16<<2)>>2];r13=HEAP16[r18+2>>1];if((r13&65535|0)!=(r12|0)){r26=0;break L16}if(r13<<16>>16!=0){r13=HEAP32[r18+4>>2];r18=0;while(1){r17=HEAP32[r13+(r18<<2)>>2];if((HEAP16[r17+10>>1]|0)!=512){r26=0;break L16}r20=r18+1|0;if(HEAPU16[r17+8>>1]>>>0>=r12>>>0){r26=0;break L16}if(r20>>>0<r12>>>0){r18=r20}else{break}}}r18=r16+1|0;if(r18>>>0<2){r16=r18}else{break}}r16=r14+1|0;if(r16>>>0<80){r14=r16;r3=19}else{r27=0;r3=29;break}}if(r3==29){while(1){r3=0;r16=HEAP32[r11+(r27<<2)>>2];r12=HEAP16[r16+2>>1];if(r12<<16>>16!=0){r15=HEAP32[r16+4>>2];r16=r12&65535;r12=0;while(1){r18=HEAP32[r15+(r12<<2)>>2];r13=HEAP16[r18+2>>1];if(r13<<16>>16!=0){r20=HEAP32[r18+4>>2];r18=r13&65535;r13=0;while(1){r17=r13+1|0;if((HEAP16[HEAP32[r20+(r13<<2)>>2]+28>>1]|0)!=0){r21=19200;r22=819200;r23=290;r24=0;r25=2;break L15}if(r17>>>0<r18>>>0){r13=r17}else{break}}}r13=r12+1|0;if(r13>>>0<r16>>>0){r12=r13}else{break}}}r12=r27+1|0;if(r12>>>0<80){r27=r12;r3=29}else{r21=0;r22=819200;r23=290;r24=0;r25=2;break L15}}}L44:while(1){r12=HEAP32[r11+(r26<<2)>>2];if((HEAP16[r12+2>>1]|0)!=2){r28=0;break}r16=HEAP32[r12+4>>2];r12=0;while(1){r15=HEAP32[r16+(r12<<2)>>2];if((HEAP16[r15+2>>1]|0)!=9){r28=0;break L44}r13=HEAP32[r15+4>>2];r15=0;while(1){r18=HEAP32[r13+(r15<<2)>>2];if((HEAP16[r18+10>>1]|0)!=512){r28=0;break L44}r20=HEAP16[r18+8>>1];r18=r15+1|0;if(r20<<16>>16==0|(r20&65535)>9){r28=0;break L44}if(r18>>>0<9){r15=r18}else{break}}r15=r12+1|0;if(r15>>>0<2){r12=r15}else{break}}r12=r26+1|0;if(r12>>>0<80){r26=r12}else{r21=0;r22=737280;r23=546;r24=9;r25=2;break L15}}L56:while(1){r12=HEAP32[r11+(r28<<2)>>2];if((HEAP16[r12+2>>1]|0)!=2){r8=1;r3=97;break}r16=HEAP32[r12+4>>2];r12=0;while(1){r15=HEAP32[r16+(r12<<2)>>2];if((HEAP16[r15+2>>1]|0)!=18){r8=1;r3=97;break L56}r13=HEAP32[r15+4>>2];r15=0;while(1){r18=HEAP32[r13+(r15<<2)>>2];if((HEAP16[r18+10>>1]|0)!=512){r8=1;r3=97;break L56}r20=HEAP16[r18+8>>1];r18=r15+1|0;if(r20<<16>>16==0|(r20&65535)>18){r8=1;r3=97;break L56}if(r18>>>0<18){r15=r18}else{break}}r15=r12+1|0;if(r15>>>0<2){r12=r15}else{break}}r12=r28+1|0;if(r12>>>0<80){r28=r12}else{r21=0;r22=1474560;r23=802;r24=18;r25=2;break L15}}if(r3==97){r9=128;r10=0;STACKTOP=r4;return r8}}}while(0);r28=r5|0;r11=(r24|0)==0;r26=r11&1^1;r27=r24+1|0;r24=r5+1|0;r14=r5+2|0;r19=r5+3|0;r12=r5+4|0;r16=r5+5|0;r15=r5+6|0;r13=r5+7|0;r18=r5+8|0;r20=r5+9|0;r17=r5+10|0;r29=r5+11|0;r5=0;r30=0;r31=0;L87:while(1){if(r11){r32=12-(r5>>>4)|0}else{r32=r27}r33=r26>>>0<r32>>>0;r34=0;r35=r30;r36=r31;while(1){if(r33){r37=r34|r5;r38=r26;r39=r35;r40=r36;while(1){r41=_psi_img_get_sector(r2,r5,r34,r38,0);if((r41|0)==0){r8=1;r3=97;break L87}r42=HEAPU16[r41+10>>1]>>>1;if((r42|0)==0){r43=r40}else{r44=r40;r45=r42;r42=HEAP32[r41+24>>2];while(1){r46=(HEAPU8[r42]<<8|HEAPU8[r42+1|0])+r44|0;r47=r46>>>1|r46<<31;r46=r45-1|0;if((r46|0)==0){r43=r47;break}else{r44=r47;r45=r46;r42=r42+2|0}}}if((r37|r38|0)==0){r48=r39}else{_psi_sct_get_tags(r41,r28,12);r42=(HEAPU8[r28]<<8|HEAPU8[r24])+r39|0;r45=(r42>>>1|r42<<31)+(HEAPU8[r14]<<8|HEAPU8[r19])|0;r42=(r45>>>1|r45<<31)+(HEAPU8[r12]<<8|HEAPU8[r16])|0;r45=(r42>>>1|r42<<31)+(HEAPU8[r15]<<8|HEAPU8[r13])|0;r42=(r45>>>1|r45<<31)+(HEAPU8[r18]<<8|HEAPU8[r20])|0;r45=(r42>>>1|r42<<31)+(HEAPU8[r17]<<8|HEAPU8[r29])|0;r48=r45>>>1|r45<<31}r45=r38+1|0;if(r45>>>0<r32>>>0){r38=r45;r39=r48;r40=r43}else{r49=r48;r50=r43;break}}}else{r49=r35;r50=r36}r40=r34+1|0;if(r40>>>0<r25>>>0){r34=r40;r35=r49;r36=r50}else{break}}r36=r5+1|0;if(r36>>>0<80){r5=r36;r30=r49;r31=r50}else{break}}if(r3==97){r9=128;r10=0;STACKTOP=r4;return r8}_memset(r7,0,128)|0;r31=_psi_img_get_sector(r2,0,0,r11?2:3,0);do{if((r31|0)!=0){r30=HEAP32[r31+24>>2];r5=HEAP8[r30];if(r5<<24>>24==66){r51=(HEAP8[r30+1|0]|0)==68?r30+36|0:56664;break}else if(r5<<24>>24==-46){r51=(HEAP8[r30+1|0]|0)==-41?r30+36|0:56664;break}else{r51=56664;break}}else{r51=56664}}while(0);r31=HEAPU8[r51];r30=r31>>>0>63?63:r31;if((r30|0)!=0){r31=0;while(1){r5=r31+1|0;HEAP8[r6+r5|0]=HEAP8[r51+r5|0];if(r5>>>0<r30>>>0){r31=r5}else{break}}}HEAP8[r7]=r30;_psi_set_uint32_be(r7,64,r22);_psi_set_uint32_be(r7,68,r21);_psi_set_uint32_be(r7,72,r50);_psi_set_uint32_be(r7,76,r49);_psi_set_uint16_be(r7,80,r23);_psi_set_uint16_be(r7,82,256);if((_psi_write(r1,r7,84)|0)==0){r52=0}else{r8=1;r9=128;r10=0;STACKTOP=r4;return r8}L124:while(1){if(r11){r53=12-(r52>>>4)|0}else{r53=r27}if(r26>>>0<r53>>>0){r7=0;while(1){r23=r26;while(1){r49=_psi_img_get_sector(r2,r52,r7,r23,0);if((r49|0)==0){r8=1;r3=97;break L124}r50=r23+1|0;if((_psi_write(r1,HEAP32[r49+24>>2],HEAPU16[r49+10>>1])|0)!=0){r8=1;r3=97;break L124}if(r50>>>0<r53>>>0){r23=r50}else{break}}r23=r7+1|0;if(r23>>>0<r25>>>0){r7=r23}else{break}}}r7=r52+1|0;if(r7>>>0<80){r52=r7}else{r3=86;break}}if(r3==86){L140:do{if((r21|0)!=0){r52=0;L141:while(1){if(r11){r54=12-(r52>>>4)|0}else{r54=r27}r53=r26>>>0<r54>>>0;r7=0;while(1){if(r53){r23=r26;while(1){r50=_psi_img_get_sector(r2,r52,r7,r23,0);if((r50|0)==0){r8=1;r3=97;break L141}_psi_sct_get_tags(r50,r28,12);r50=r23+1|0;if((_psi_write(r1,r28,12)|0)!=0){r8=1;r3=97;break L141}if(r50>>>0<r54>>>0){r23=r50}else{break}}}r23=r7+1|0;if(r23>>>0<r25>>>0){r7=r23}else{break}}r7=r52+1|0;if(r7>>>0<80){r52=r7}else{break L140}}if(r3==97){r9=128;r10=0;STACKTOP=r4;return r8}}}while(0);_fflush(r1);r8=0;r9=128;r10=0;STACKTOP=r4;return r8}else if(r3==97){r9=128;r10=0;STACKTOP=r4;return r8}}function _psi_probe_dc42_fp(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+128|0;r3=r2|0;if(((_fseek(r1,0,0)|0)==0?(_psi_read(r1,r3,84)|0)==0:0)?(_psi_get_uint16_be(r3,82)|0)==256:0){r4=HEAPU8[r3]<64|0}else{r4=0}STACKTOP=r2;return r4}function _dc42_load_gcr(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r6=0;HEAP32[r4>>2]=0;r7=(r3|0)==0;r8=r5&255;r5=0;L1:while(1){r9=r5>>>4;r10=12-r9|0;L3:do{if(!r7){if((r9|0)==12){r11=0;while(1){r12=_psi_img_get_track(r2,r5,r11,0);if((r12|0)!=0){_psi_trk_interleave(r12,2)}r12=r11+1|0;if(r12>>>0<r3>>>0){r11=r12}else{break L3}}}else{r13=0}while(1){r11=0;while(1){r14=_psi_sct_new(r5,r13,r11,512);if((r14|0)==0){r15=1;r6=19;break L1}_psi_sct_set_gcr_format(r14,r8);_psi_sct_set_encoding(r14,3);if((_psi_img_add_sector(r2,r14,r5,r13)|0)!=0){r6=14;break L1}r12=r14+24|0;if((_psi_read(r1,HEAP32[r12>>2],512)|0)!=0){r15=1;r6=19;break L1}r16=HEAP32[r4>>2];r17=256;r18=HEAP32[r12>>2];while(1){r12=(HEAPU8[r18]<<8|HEAPU8[r18+1|0])+r16|0;r19=r12>>>1|r12<<31;r12=r17-1|0;if((r12|0)==0){break}else{r16=r19;r17=r12;r18=r18+2|0}}HEAP32[r4>>2]=r19;r18=r11+1|0;if(r18>>>0<r10>>>0){r11=r18}else{break}}r11=_psi_img_get_track(r2,r5,r13,0);if((r11|0)!=0){_psi_trk_interleave(r11,2)}r11=r13+1|0;if(r11>>>0<r3>>>0){r13=r11}else{break}}}}while(0);r10=r5+1|0;if(r10>>>0<80){r5=r10}else{r15=0;r6=19;break}}if(r6==14){_psi_sct_del(r14);r15=1;return r15}else if(r6==19){return r15}}function _dc42_load_mfm(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r5=0;HEAP32[r4>>2]=0;r6=r3>>>0<14?2:32770;r7=(r3|0)==0;r8=0;L1:while(1){r9=0;while(1){if(!r7){r10=0;while(1){r11=r10+1|0;r12=_psi_sct_new(r8,r9,r11,512);if((r12|0)==0){r13=1;r5=13;break L1}_psi_sct_set_encoding(r12,r6);if((_psi_img_add_sector(r2,r12,r8,r9)|0)!=0){r5=6;break L1}r14=r12+24|0;if((_psi_read(r1,HEAP32[r14>>2],512)|0)!=0){r13=1;r5=13;break L1}r15=HEAP32[r4>>2];r16=256;r17=HEAP32[r14>>2];while(1){r14=(HEAPU8[r17]<<8|HEAPU8[r17+1|0])+r15|0;r18=r14>>>1|r14<<31;r14=r16-1|0;if((r14|0)==0){break}else{r15=r18;r16=r14;r17=r17+2|0}}HEAP32[r4>>2]=r18;if(r11>>>0<r3>>>0){r10=r11}else{break}}}r10=r9+1|0;if(r10>>>0<2){r9=r10}else{break}}r9=r8+1|0;if(r9>>>0<80){r8=r9}else{r13=0;r5=13;break}}if(r5==6){_psi_sct_del(r12);r13=1;return r13}else if(r5==13){return r13}}function _psi_load_imd(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+784|0;r4=r3;r5=r3+8;r6=r3+264;r7=r3+520;r8=r3+776;r9=_psi_img_new();r10=(r9|0)==0;if(r10){r11=0;STACKTOP=r3;return r11}r12=r8|0;r13=8;r14=0;r15=_fread(r12,1,4,r1);r16=(r15|0)==4;L4:do{if(r16){r17=_psi_get_uint32_be(r12,0);r18=(r17|0)==1229800480;if(r18){r19=_psi_img_add_comment(r9,r12,4);while(1){r20=_fgetc(r1);if((r20|0)==-1){break L4}else if((r20|0)==26){break}r21=r20&255;HEAP8[r12]=r21;r22=_psi_img_add_comment(r9,r12,1)}_psi_img_clean_comment(r9);r23=r5|0;r24=r6|0;r25=r7|0;r26=r8+1|0;r27=r8+2|0;r28=r8+3|0;r29=r8+4|0;L11:while(1){r30=_fread(r12,1,5,r1);if((r30|0)==0){r11=r9;r2=41;break}else if((r30|0)!=5){break L4}r31=1;r32=0;r33=256;r34=0;r35=256;r36=0;r37=256;r38=0;r39=HEAP8[r26];r40=r39&255;r41=HEAP8[r27];r42=r41&255;r43=r42&1;r44=HEAP8[r28];r45=r44&255;r46=HEAP8[r29];r47=r46&255;r48=r44<<24>>24==0;if(r48){continue}r49=(r46&255)>6;if(r49){break L4}r50=128<<r47;r51=_fread(r23,1,r45,r1);r52=(r51|0)==(r45|0);if(!r52){break L4}r53=HEAP8[r27];r54=r53<<24>>24<0;if(r54){r55=_fread(r24,1,r45,r1);r56=(r55|0)==(r45|0);if(!r56){break L4}r57=HEAP8[r27];r58=r57}else{r58=r53}r59=r58&64;r60=r59<<24>>24==0;if(!r60){r61=_fread(r25,1,r45,r1);r62=(r61|0)==(r45|0);if(!r62){break L4}else{r63=0}}else{r63=0}while(1){r64=HEAP8[r27];r65=r64<<24>>24<0;if(r65){r66=r6+r63|0;r67=HEAP8[r66];r68=r67&255;r69=r68}else{r69=r40}r70=r64&64;r71=r70<<24>>24==0;if(r71){r72=r43}else{r73=r7+r63|0;r74=HEAP8[r73];r75=r74&255;r72=r75}r76=r5+r63|0;r77=HEAP8[r76];r78=_fread(r4,1,1,r1);r79=(r78|0)==1;if(!r79){break L4}r80=r77&255;r81=_psi_sct_new(r69,r72,r80,r50);r82=(r81|0)==0;if(r82){break L4}_psi_sct_set_mfm_size(r81,r46);r83=_psi_img_add_sector(r9,r81,r40,r43);r84=(r83|0)==0;if(!r84){r2=24;break L11}r85=HEAP8[r12];r86=r85&255;switch(r86|0){case 0:{r87=32769;break};case 1:{r87=1;break};case 2:{r87=1;break};case 3:{r87=32770;break};case 4:{r87=2;break};case 5:{r87=2;break};default:{break L4}}_psi_sct_set_encoding(r81,r87);r88=HEAP8[r4];r89=r88-5&255;r90=(r89&255)<4;if(r90){_psi_sct_set_flags(r81,2,1)}switch(r88<<24>>24){case 0:{_psi_sct_set_flags(r81,2,1);_psi_sct_fill(r81,0);break};case 2:case 6:{r2=36;break};case 1:case 5:{r2=38;break};case 3:case 4:case 7:case 8:{_psi_sct_set_flags(r81,4,1);switch(r88<<24>>24){case 4:case 6:case 8:{r2=36;break};case 3:case 5:case 7:{r2=38;break};default:{break L4}}break};default:{break L4}}if(r2==36){r2=0;r91=_fread(r4,1,1,r1);r92=(r91|0)==1;if(!r92){break L4}r93=HEAP8[r4];r94=r93&255;_psi_sct_fill(r81,r94)}else if(r2==38){r2=0;r95=r81+24|0;r96=HEAP32[r95>>2];r97=r81+10|0;r98=HEAP16[r97>>1];r99=r98&65535;r100=_fread(r96,1,r99,r1);r101=HEAP16[r97>>1];r102=r101&65535;r103=(r100|0)==(r102|0);if(!r103){break L4}}r104=r63+1|0;r105=r104>>>0<r45>>>0;if(r105){r63=r104}else{continue L11}}}if(r2==24){_psi_sct_del(r81);r106=256;r107=0;r108=256;r109=0;r110=256;r111=0;r112=1;r113=0;break}else if(r2==41){STACKTOP=r3;return r11}}}}while(0);_psi_img_del(r9);r11=0;STACKTOP=r3;return r11}function _psi_save_imd(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+784|0;r6=r5;r7=r5+776;r8=r2+12|0;r9=HEAP32[r8>>2];r10=r2+8|0;if((((((HEAP32[r10>>2]>>>0>=29?(HEAP8[r9]|0)==73:0)?(HEAP8[r9+1|0]|0)==77:0)?(HEAP8[r9+2|0]|0)==68:0)?(HEAP8[r9+12|0]|0)==47:0)?(HEAP8[r9+15|0]|0)==47:0)?(HEAP8[r9+20|0]|0)==32:0){_psi_write(r1,r9,29);if(HEAP32[r10>>2]>>>0>29){r11=(HEAP8[HEAP32[r8>>2]+29|0]|0)==10?30:29}else{r11=29}}else{r3=10}if(r3==10){HEAP32[r7>>2]=_time(0);r9=_localtime(r7);r7=HEAP32[r9+16>>2]+1|0;r12=HEAP32[r9+20>>2]+1900|0;r13=HEAP32[r9+8>>2];r14=HEAP32[r9+4>>2];r15=HEAP32[r9>>2];_fprintf(r1,56624,(r4=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r4>>2]=HEAP32[r9+12>>2],HEAP32[r4+8>>2]=r7,HEAP32[r4+16>>2]=r12,HEAP32[r4+24>>2]=r13,HEAP32[r4+32>>2]=r14,HEAP32[r4+40>>2]=r15,r4));STACKTOP=r4;r11=0}_fputc(13,r1);_fputc(10,r1);if(r11>>>0<HEAP32[r10>>2]>>>0){r4=r11;while(1){r11=HEAP8[HEAP32[r8>>2]+r4|0];if(r11<<24>>24==10){_fputc(13,r1);_fputc(10,r1)}else{_fputc(r11&255,r1)}r11=r4+1|0;if(r11>>>0<HEAP32[r10>>2]>>>0){r4=r11}else{break}}}_fputc(26,r1);r4=r2|0;r10=HEAP16[r4>>1];L21:do{if(r10<<16>>16!=0){r8=r2+4|0;r11=r6|0;r15=r6+1|0;r14=r6+2|0;r13=r6+3|0;r12=r6+4|0;r7=0;r9=r10;L23:while(1){r16=HEAP32[HEAP32[r8>>2]+(r7<<2)>>2];r17=r16+2|0;if((HEAP16[r17>>1]|0)==0){r18=r9}else{r19=r16+4|0;r16=r7&255;r20=0;while(1){r21=HEAP32[HEAP32[r19>>2]+(r20<<2)>>2];r22=HEAP16[r21+2>>1];r23=r22&65535;if(r22<<16>>16!=0){r24=r21+4|0;r21=HEAP32[r24>>2];r25=HEAP32[r21>>2];if((r22&65535)>1){r26=HEAP16[r25+10>>1];r27=r25+16|0;r28=1;r29=0;r30=0;while(1){r31=HEAP32[r21+(r28<<2)>>2];if((HEAP16[r31+10>>1]|0)!=r26<<16>>16){r32=1;r3=61;break L23}r33=(HEAPU16[r31+6>>1]|0)==(r20|0)?r30:1;r34=(HEAPU16[r31+4>>1]|0)==(r7|0)?r29:1;r35=HEAP16[r31+16>>1];r31=r28+1|0;if(r35<<16>>16!=(HEAP16[r27>>1]|0)){r32=1;r3=61;break L23}if(r31>>>0<r23>>>0){r28=r31;r29=r34;r30=r33}else{r36=r34;r37=r33;r38=r35;break}}}else{r36=0;r37=0;r38=HEAP16[r25+16>>1]}r30=r38&65535;if((r30|0)==1){HEAP8[r11]=2}else if((r30|0)==32769){HEAP8[r11]=0}else if((r30|0)==2){HEAP8[r11]=5}else if((r30|0)==32770){HEAP8[r11]=3}else{HEAP8[r11]=5}HEAP8[r15]=r16;r30=r20&255;HEAP8[r14]=r30;HEAP8[r13]=r22;r29=HEAP16[r25+10>>1];r28=r29&65535;if((r28+65535&r28|0)!=0|(r29&65535)>8192){r32=1;r3=61;break L23}HEAP8[r12]=0;if((r29&65535)>255){r29=r28;r28=0;while(1){r39=r28+1&255;if(r29>>>0>511){r29=r29>>>1;r28=r39}else{break}}HEAP8[r12]=r39}r28=r23+5|0;if((r36|0)==0){r40=0;r41=r28;r42=r30}else{r29=r30|-128;HEAP8[r14]=r29;r40=r6+r28|0;r41=r28+r23|0;r42=r29}if((r37|0)==0){r43=0;r44=r41}else{HEAP8[r14]=r42|64;r43=r6+r41|0;r44=r41+r23|0}r29=(r43|0)==0;if((r40|0)==0){if(r29){r28=0;while(1){HEAP8[r6+(r28+5)|0]=HEAP16[HEAP32[r21+(r28<<2)>>2]+8>>1];r25=r28+1|0;if(r25>>>0<r23>>>0){r28=r25}else{break}}}else{r28=0;while(1){r30=HEAP32[r21+(r28<<2)>>2];HEAP8[r6+(r28+5)|0]=HEAP16[r30+8>>1];HEAP8[r43+r28|0]=HEAP16[r30+6>>1];r30=r28+1|0;if(r30>>>0<r23>>>0){r28=r30}else{break}}}}else{if(r29){r28=0;while(1){r30=HEAP32[r21+(r28<<2)>>2];HEAP8[r6+(r28+5)|0]=HEAP16[r30+8>>1];HEAP8[r40+r28|0]=HEAP16[r30+4>>1];r30=r28+1|0;if(r30>>>0<r23>>>0){r28=r30}else{break}}}else{r28=0;while(1){r29=HEAP32[r21+(r28<<2)>>2];HEAP8[r6+(r28+5)|0]=HEAP16[r29+8>>1];HEAP8[r40+r28|0]=HEAP16[r29+4>>1];HEAP8[r43+r28|0]=HEAP16[r29+6>>1];r29=r28+1|0;if(r29>>>0<r23>>>0){r28=r29}else{break}}}}if((_fwrite(r11,1,r44,r1)|0)==(r44|0)){r45=0}else{r32=1;r3=61;break L23}while(1){r28=HEAP32[HEAP32[r24>>2]+(r45<<2)>>2];if((_psi_sct_uniform(r28)|0)==0){r46=0}else{r46=(HEAP16[r28+10>>1]|0)!=0}r21=HEAP32[r28+12>>2];r29=(r21&6|0)==6;if(r29|(r21&2|0)!=0){r47=r29?7:5}else{r47=r21>>>1&2|1}_fputc(r47+(r46&1)|0,r1);r21=HEAP32[r28+24>>2];if(!r46){r29=r28+10|0;r28=_fwrite(r21,1,HEAPU16[r29>>1],r1);if((r28|0)!=(HEAPU16[r29>>1]|0)){r32=1;r3=61;break L23}}else{_fputc(HEAPU8[r21],r1)}r21=r45+1|0;if(r21>>>0<r23>>>0){r45=r21}else{break}}}r23=r20+1|0;if(r23>>>0<HEAPU16[r17>>1]>>>0){r20=r23}else{break}}r18=HEAP16[r4>>1]}r20=r7+1|0;if(r20>>>0<(r18&65535)>>>0){r7=r20;r9=r18}else{break L21}}if(r3==61){STACKTOP=r5;return r32}}}while(0);_fflush(r1);r32=0;STACKTOP=r5;return r32}function _psi_probe_imd_fp(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+16|0;if((_fseek(r1,0,0)|0)==0){r3=r2|0;if((_fread(r3,1,4,r1)|0)==4){r4=(_psi_get_uint32_be(r3,0)|0)==1229800480|0}else{r4=0}}else{r4=0}STACKTOP=r2;return r4}function _psi_load_msa(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=_psi_img_new();if((r4|0)==0){r5=0;STACKTOP=r3;return r5}r6=r3|0;if((_psi_read_ofs(r1,0,r6,10)|0)!=0){r5=r4;STACKTOP=r3;return r5}if((_psi_get_uint16_be(r6,0)|0)!=3599){r5=r4;STACKTOP=r3;return r5}r7=_psi_get_uint16_be(r6,2);r8=_psi_get_uint16_be(r6,4)+1|0;r9=_psi_get_uint16_be(r6,6);r10=_psi_get_uint16_be(r6,8);do{if(!((r7|0)==0|r7>>>0>127)?!(r8>>>0>16|r10>>>0<r9>>>0):0){r6=r7<<9;r11=_malloc(r6);if((r11|0)!=0){r12=(r8|0)==0;r13=(r6|0)==0;r14=r9;L14:while(1){if(!r12){r15=0;while(1){r16=_psi_img_get_track(r4,r14,r15,1);if((r16|0)==0){r2=10;break L14}if((_psi_read(r1,r11,2)|0)!=0){r2=25;break L14}r17=_psi_get_uint16_be(r11,0);if((r17|0)==(r6|0)){if((_psi_read(r1,r11,r6)|0)==0){r18=0}else{r2=25;break L14}}else{if(r13){r18=0}else{r19=r6;r20=r11;r21=r17;while(1){if((r21|0)==0){r2=25;break L14}r17=_fgetc(r1);if((r17|0)==-1){r2=25;break L14}r22=r21-1|0;if((r17|0)==229){if(r22>>>0<3){r2=25;break L14}r23=_fgetc(r1);r24=_fgetc(r1);r25=_fgetc(r1);if((r23|0)==-1|(r24|0)==-1|(r25|0)==-1){r2=25;break L14}r26=r24<<8&65280|r25&255;if((r19|0)==0|(r26|0)==0){r27=r19;r28=r20}else{r25=-r19|0;r24=-r26|0;r26=r25>>>0>r24>>>0?r25:r24;r24=-r26|0;_memset(r20,r23&255,r24)|0;r27=r26+r19|0;r28=r20+r24|0}r29=r21-4|0;r30=r28;r31=r27}else{HEAP8[r20]=r17;r29=r22;r30=r20+1|0;r31=r19-1|0}if((r31|0)==0){r18=0;break}else{r19=r31;r20=r30;r21=r29}}}}while(1){r21=r18+1|0;r32=_psi_sct_new(r14,r15,r21,512);if((r32|0)==0){r2=27;break L14}_psi_sct_set_encoding(r32,2);if((_psi_trk_add_sector(r16,r32)|0)!=0){r2=29;break L14}_memcpy(HEAP32[r32+24>>2],r11+(r18<<9)|0,512)|0;if(r21>>>0<r7>>>0){r18=r21}else{break}}r16=r15+1|0;if(r16>>>0<r8>>>0){r15=r16}else{break}}}r15=r14+1|0;if(r15>>>0>r10>>>0){r2=33;break}else{r14=r15}}if(r2==10){_free(r11);break}else if(r2==25){_free(r11);break}else if(r2==27){_free(r11);break}else if(r2==29){_psi_sct_del(r32);break}else if(r2==33){_free(r11);r5=r4;STACKTOP=r3;return r5}}}}while(0);_psi_img_del(r4);r5=0;STACKTOP=r3;return r5}function _psi_save_msa(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=_psi_img_get_cylinder(r2,0,0);if((r5|0)==0){r6=1;STACKTOP=r4;return r6}r7=_psi_img_get_track(r2,0,0,0);if((r7|0)==0){r6=1;STACKTOP=r4;return r6}r8=r4|0;_psi_set_uint16_be(r8,0,3599);r9=r7+2|0;_psi_set_uint16_be(r8,2,HEAPU16[r9>>1]);r7=r5+2|0;_psi_set_uint16_be(r8,4,HEAPU16[r7>>1]-1|0);_psi_set_uint16_be(r8,6,0);r5=r2|0;_psi_set_uint16_be(r8,8,HEAPU16[r5>>1]-1|0);if((_psi_write(r1,r8,10)|0)!=0){r6=1;STACKTOP=r4;return r6}_psi_set_uint16_be(r8,0,HEAPU16[r9>>1]<<9);r10=HEAP16[r5>>1];L10:do{if(r10<<16>>16!=0){r11=0;r12=HEAP16[r7>>1];r13=r10;L12:while(1){if(r12<<16>>16==0){r14=0;r15=r13}else{r16=0;while(1){if((_psi_write(r1,r8,2)|0)==0){r17=0}else{r6=1;r3=16;break L12}while(1){if(r17>>>0>=HEAPU16[r9>>1]>>>0){break}r18=r17+1|0;r19=_psi_img_get_sector(r2,r11,r16,r18,0);if((r19|0)==0){r6=1;r3=16;break L12}if((HEAP16[r19+10>>1]|0)!=512){r6=1;r3=16;break L12}if((_psi_write(r1,HEAP32[r19+24>>2],512)|0)==0){r17=r18}else{r6=1;r3=16;break L12}}r18=r16+1|0;r20=HEAP16[r7>>1];if(r18>>>0<(r20&65535)>>>0){r16=r18}else{break}}r14=r20;r15=HEAP16[r5>>1]}r16=r11+1|0;if(r16>>>0<(r15&65535)>>>0){r11=r16;r12=r14;r13=r15}else{break L10}}if(r3==16){STACKTOP=r4;return r6}}}while(0);_fflush(r1);r6=0;STACKTOP=r4;return r6}function _psi_probe_msa_fp(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r3=r2|0;if((_psi_read_ofs(r1,0,r3,10)|0)!=0){r4=0;STACKTOP=r2;return r4}r4=(_psi_get_uint16_be(r3,0)|0)==3599|0;STACKTOP=r2;return r4}function _psi_load_pfdc(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=_psi_img_new();if((r3|0)==0){r4=0;STACKTOP=r2;return r4}r5=r2|0;if((_psi_read(r1,r5,8)|0)==0){r6=_psi_get_uint32_be(r5,0);r7=_psi_get_uint32_be(r5,4);if((r6|0)==1346782275){if((r7|0)==0){r8=_pfdc0_load_fp(r1,r3,1346782275,0)}else if((r7|0)==65536){r8=_pfdc1_load_fp(r1,r3,1346782275,65536)}else if((r7|0)==131072){r8=_pfdc2_load_fp(r1,r3,1346782275,131072)}else{r8=_pfdc4_load_fp(r1,r3,1346782275,r7)}if((r8|0)==0){r4=r3;STACKTOP=r2;return r4}}}_psi_img_del(r3);r4=0;STACKTOP=r2;return r4}function _psi_save_pfdc(r1,r2,r3){var r4;if((r3|0)==2){r4=_pfdc2_save_fp(r1,r2)}else if((r3|0)==0){r4=_pfdc0_save_fp(r1,r2)}else if((r3|0)==1){r4=_pfdc1_save_fp(r1,r2)}else{r4=_pfdc4_save_fp(r1,r2)}return r4}function _psi_probe_pfdc_fp(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2|0;if((_psi_read_ofs(r1,0,r3,4)|0)!=0){r4=0;STACKTOP=r2;return r4}r4=(_psi_get_uint32_be(r3,0)|0)==1346782275|0;STACKTOP=r2;return r4}function _pfdc0_load_fp(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=0;r3=STACKTOP;STACKTOP=STACKTOP+24|0;r5=r3;_fwrite(53032,49,1,HEAP32[_stderr>>2]);r6=r3+16|0;if((_psi_read(r1,r6,8)|0)!=0){r7=1;STACKTOP=r3;return r7}r8=_psi_get_uint32_be(r6,0);r9=_psi_get_uint32_be(r6,4);if(r9>>>0<16){r7=1;STACKTOP=r3;return r7}if((_psi_skip(r1,r9-16|0)|0)!=0){r7=1;STACKTOP=r3;return r7}if((r8|0)==0){r7=0;STACKTOP=r3;return r7}r9=r5|0;r6=r5+1|0;r10=r5+5|0;r11=r5+2|0;r12=r5+3|0;r13=r5+4|0;r14=r5+12|0;r5=0;while(1){if((_psi_read(r1,r9,12)|0)!=0){r7=1;r4=21;break}r15=HEAP8[r9];r16=HEAP8[r6];r17=HEAPU8[r10];r18=_psi_get_uint16_be(r9,6);r19=_psi_sct_new(HEAPU8[r11],HEAPU8[r12],HEAPU8[r13],r18);if((r19|0)==0){r7=1;r4=21;break}if((_psi_img_add_sector(r2,r19,r15&255,r16&255)|0)!=0){r4=9;break}_psi_get_uint32_be(r9,8);_psi_sct_set_encoding(r19,(r17&1|0)==0?r17&2:1);if((r17&4|0)!=0){r16=r19+12|0;HEAP32[r16>>2]=HEAP32[r16>>2]|1}if((r17&8|0)!=0){r16=r19+12|0;HEAP32[r16>>2]=HEAP32[r16>>2]|2}if((r17&16|0)!=0){r16=r19+12|0;HEAP32[r16>>2]=HEAP32[r16>>2]|4}if((r17&128|0)==0){if((_psi_read(r1,HEAP32[r19+24>>2],r18)|0)!=0){r7=1;r4=21;break}}else{if((_psi_read(r1,r14,1)|0)!=0){r7=1;r4=21;break}_psi_sct_fill(r19,HEAPU8[r14])}r18=r5+1|0;if(r18>>>0<r8>>>0){r5=r18}else{r7=0;r4=21;break}}if(r4==9){_psi_sct_del(r19);r7=1;STACKTOP=r3;return r7}else if(r4==21){STACKTOP=r3;return r7}}function _pfdc0_save_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=_psi_img_get_sector_count(r2);r7=r4+16|0;_psi_set_uint32_be(r7,0,1346782275);_psi_set_uint32_be(r7,4,0);_psi_set_uint32_be(r7,8,r6);_psi_set_uint32_be(r7,12,16);if((_psi_write(r1,r7,16)|0)!=0){r8=1;STACKTOP=r4;return r8}r7=r2|0;r6=HEAP16[r7>>1];L4:do{if(r6<<16>>16!=0){r9=r2+4|0;r10=r5|0;r11=r5+1|0;r12=r5+2|0;r13=r5+3|0;r14=r5+4|0;r15=r5+5|0;r16=r5+6|0;r17=r5+7|0;r18=r5+12|0;r19=0;r20=r6;L6:while(1){r21=HEAP32[HEAP32[r9>>2]+(r19<<2)>>2];r22=r21+2|0;r23=HEAP16[r22>>1];if(r23<<16>>16==0){r24=r20}else{r25=r21+4|0;r21=r19&255;r26=0;r27=r23;while(1){r23=HEAP32[HEAP32[r25>>2]+(r26<<2)>>2];r28=r23+2|0;if((HEAP16[r28>>1]|0)==0){r29=r27}else{r30=r23+4|0;r23=r26&255;r31=0;while(1){r32=HEAP32[HEAP32[r30>>2]+(r31<<2)>>2];r33=HEAPU16[r32+16>>1];if((r33|0)==1){r34=1;r35=125e3}else if((r33|0)==32770){r34=2;r35=5e5}else if((r33|0)==16386){r34=2;r35=1e6}else if((r33|0)==2){r34=2;r35=25e4}else if((r33|0)==32769){r34=1;r35=25e4}else{r34=0;r35=0}r33=HEAP32[r32+12>>2]<<2;HEAP8[r10]=r21;HEAP8[r11]=r23;HEAP8[r12]=HEAP16[r32+4>>1];HEAP8[r13]=HEAP16[r32+6>>1];HEAP8[r14]=HEAP16[r32+8>>1];HEAP8[r15]=r33&4|r34|r33&8|r33&16;r33=r32+10|0;r36=HEAP16[r33>>1];HEAP8[r16]=(r36&65535)>>>8;HEAP8[r17]=r36;_psi_set_uint32_be(r10,8,r35);if((_psi_sct_uniform(r32)|0)!=0?(HEAP16[r33>>1]|0)!=0:0){HEAP8[r15]=HEAP8[r15]|-128;HEAP8[r18]=HEAP8[HEAP32[r32+24>>2]];if((_psi_write(r1,r10,13)|0)!=0){r8=1;r3=25;break L6}}else{r3=17}if(r3==17){r3=0;if((_psi_write(r1,r10,12)|0)!=0){r8=1;r3=25;break L6}if((_psi_write(r1,HEAP32[r32+24>>2],HEAPU16[r33>>1])|0)!=0){r8=1;r3=25;break L6}}r33=r31+1|0;if(r33>>>0<HEAPU16[r28>>1]>>>0){r31=r33}else{break}}r29=HEAP16[r22>>1]}r31=r26+1|0;if(r31>>>0<(r29&65535)>>>0){r26=r31;r27=r29}else{break}}r24=HEAP16[r7>>1]}r27=r19+1|0;if(r27>>>0<(r24&65535)>>>0){r19=r27;r20=r24}else{break L4}}if(r3==25){STACKTOP=r4;return r8}}}while(0);_fflush(r1);r8=0;STACKTOP=r4;return r8}function _pfdc1_load_fp(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r4=0;r3=STACKTOP;STACKTOP=STACKTOP+40|0;r5=r3;_fwrite(52928,49,1,HEAP32[_stderr>>2]);r6=r3+32|0;if((_psi_read(r1,r6,8)|0)!=0){r7=1;STACKTOP=r3;return r7}r8=_psi_get_uint32_be(r6,0);r9=_psi_get_uint32_be(r6,4);if(r9>>>0<16){r7=1;STACKTOP=r3;return r7}if((_psi_skip(r1,r9-16|0)|0)!=0){r7=1;STACKTOP=r3;return r7}if((r8|0)==0){r7=0;STACKTOP=r3;return r7}r9=r5|0;r6=r5+1|0;r10=r5+2|0;r11=r5+3|0;r12=r5+4|0;r13=r5+5|0;r14=r5+8|0;r15=r5+16|0;r5=0;r16=0;while(1){r17=(_psi_read(r1,r9,16)|0)==0;if(!(r17&(HEAP8[r9]|0)==83)){r7=1;r4=28;break}r17=HEAPU8[r6];r18=HEAPU8[r10];r19=_psi_get_uint16_be(r9,6);r20=_psi_sct_new(HEAPU8[r11],HEAPU8[r12],HEAPU8[r13],r19);if((r20|0)==0){r7=1;r4=28;break}r21=_psi_get_uint32_be(r9,12);r22=_psi_get_uint32_be(r9,8)&16777215;if((r21&4|0)!=0){r23=r20+12|0;HEAP32[r23>>2]=HEAP32[r23>>2]|1}if((r21&8|0)!=0){r23=r20+12|0;HEAP32[r23>>2]=HEAP32[r23>>2]|2}if((r21&16|0)!=0){r23=r20+12|0;HEAP32[r23>>2]=HEAP32[r23>>2]|4}r23=HEAPU8[r14];if((r23|0)==1){r24=r22>>>0<375e3?1:32769}else if((r23|0)==2){r24=r22>>>0<375e3?2:32770}else{r24=0}_psi_sct_set_encoding(r20,r24);if((r21&1|0)==0){if((_psi_img_add_sector(r2,r20,r17,r18)|0)!=0){r4=22;break}}else{if((r5|0)==0){r4=19;break}_psi_sct_add_alternate(r5,r20)}if((r21&128|0)==0){if((_psi_read(r1,HEAP32[r20+24>>2],r19)|0)!=0){r7=1;r4=28;break}}else{if((_psi_read(r1,r15,1)|0)!=0){r7=1;r4=28;break}_psi_sct_fill(r20,HEAPU8[r15])}r19=r16+1|0;if(r19>>>0<r8>>>0){r5=r20;r16=r19}else{r7=0;r4=28;break}}if(r4==19){_psi_sct_del(r20);r7=1;STACKTOP=r3;return r7}else if(r4==22){_psi_sct_del(r20);r7=1;STACKTOP=r3;return r7}else if(r4==28){STACKTOP=r3;return r7}}function _pfdc1_save_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=_psi_img_get_sector_count(r2);r6=r4|0;_psi_set_uint32_be(r6,0,1346782275);_psi_set_uint16_be(r6,4,1);_psi_set_uint16_be(r6,6,0);_psi_set_uint32_be(r6,8,r5);_psi_set_uint32_be(r6,12,16);if((_psi_write(r1,r6,16)|0)!=0){r7=1;STACKTOP=r4;return r7}r6=r2|0;r5=HEAP16[r6>>1];L4:do{if(r5<<16>>16!=0){r8=r2+4|0;r9=0;r10=r5;L6:while(1){r11=HEAP32[HEAP32[r8>>2]+(r9<<2)>>2];r12=r11+2|0;r13=HEAP16[r12>>1];if(r13<<16>>16==0){r14=r10}else{r15=r11+4|0;r11=0;r16=r13;while(1){r13=HEAP32[HEAP32[r15>>2]+(r11<<2)>>2];r17=r13+2|0;if((HEAP16[r17>>1]|0)==0){r18=r16}else{r19=r13+4|0;r13=0;while(1){r20=HEAP32[HEAP32[r19>>2]+(r13<<2)>>2];if((_pfdc1_save_sector(r1,r20,r9,r11,0)|0)==0){r21=r20}else{r7=1;r3=17;break L6}while(1){r20=HEAP32[r21>>2];if((r20|0)==0){break}if((_pfdc1_save_sector(r1,r20,r9,r11,1)|0)==0){r21=r20}else{r7=1;r3=17;break L6}}r20=r13+1|0;if(r20>>>0<HEAPU16[r17>>1]>>>0){r13=r20}else{break}}r18=HEAP16[r12>>1]}r13=r11+1|0;if(r13>>>0<(r18&65535)>>>0){r11=r13;r16=r18}else{break}}r14=HEAP16[r6>>1]}r16=r9+1|0;if(r16>>>0<(r14&65535)>>>0){r9=r16;r10=r14}else{break L4}}if(r3==17){STACKTOP=r4;return r7}}}while(0);_fflush(r1);r7=0;STACKTOP=r4;return r7}function _pfdc1_save_sector(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r6;r8=HEAP32[r2+12>>2]<<2&28;if((_psi_sct_uniform(r2)|0)==0){r9=r8}else{r9=(HEAP16[r2+10>>1]|0)==0?r8:r8|128}r8=r9|(r5|0)!=0;r5=HEAPU16[r2+16>>1];if((r5|0)==2){r10=25e4;r11=2}else if((r5|0)==16386){r10=1e6;r11=2}else if((r5|0)==32770){r10=5e5;r11=2}else if((r5|0)==32769){r10=25e4;r11=1}else if((r5|0)==1){r10=125e3;r11=1}else{r10=0;r11=0}r5=r7|0;_psi_set_uint32_be(r5,8,r10);HEAP8[r5]=83;HEAP8[r7+1|0]=r3;HEAP8[r7+2|0]=r4;HEAP8[r7+3|0]=HEAP16[r2+4>>1];HEAP8[r7+4|0]=HEAP16[r2+6>>1];HEAP8[r7+5|0]=HEAP16[r2+8>>1];r4=r2+10|0;r3=HEAP16[r4>>1];HEAP8[r7+6|0]=(r3&65535)>>>8;HEAP8[r7+7|0]=r3;HEAP8[r7+8|0]=r11;_psi_set_uint32_be(r5,12,r8);if((r9&128|0)==0){if((_psi_write(r1,r5,16)|0)!=0){r12=1;STACKTOP=r6;return r12}if((_psi_write(r1,HEAP32[r2+24>>2],HEAPU16[r4>>1])|0)!=0){r12=1;STACKTOP=r6;return r12}}else{HEAP8[r7+16|0]=HEAP8[HEAP32[r2+24>>2]];if((_psi_write(r1,r5,17)|0)!=0){r12=1;STACKTOP=r6;return r12}}r12=0;STACKTOP=r6;return r12}function _pfdc2_load_fp(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+568|0;r7=r6;r8=r6+32;r9=r6+288;r10=r6+296;r11=r6+552;_fwrite(52856,49,1,HEAP32[_stderr>>2]);r12=r11|0;_psi_set_uint32_be(r12,0,r3);_psi_set_uint32_be(r12,4,r4);r4=-1;r3=8;r13=r12;while(1){r14=HEAPU8[r13]<<24^r4;r15=r14<<1;r16=(r14|0)<0?r15^79764919:r15;r15=r16<<1;r14=(r16|0)<0?r15^79764919:r15;r15=r14<<1;r16=(r14|0)<0?r15^79764919:r15;r15=r16<<1;r14=(r16|0)<0?r15^79764919:r15;r15=r14<<1;r16=(r14|0)<0?r15^79764919:r15;r15=r16<<1;r14=(r16|0)<0?r15^79764919:r15;r15=r14<<1;r16=(r14|0)<0?r15^79764919:r15;r15=r16<<1;r17=(r16|0)<0?r15^79764919:r15;r15=r3-1|0;if((r15|0)==0){break}else{r4=r17;r3=r15;r13=r13+1|0}}HEAP32[62816>>2]=r17;r17=r11+8|0;if((_psi_read(r1,r17,8)|0)!=0){r18=1;STACKTOP=r6;return r18}r11=HEAP32[62816>>2];r13=8;r3=r17;while(1){r17=HEAPU8[r3]<<24^r11;r4=r17<<1;r15=(r17|0)<0?r4^79764919:r4;r4=r15<<1;r17=(r15|0)<0?r4^79764919:r4;r4=r17<<1;r15=(r17|0)<0?r4^79764919:r4;r4=r15<<1;r17=(r15|0)<0?r4^79764919:r4;r4=r17<<1;r15=(r17|0)<0?r4^79764919:r4;r4=r15<<1;r17=(r15|0)<0?r4^79764919:r4;r4=r17<<1;r15=(r17|0)<0?r4^79764919:r4;r4=r15<<1;r19=(r15|0)<0?r4^79764919:r4;r4=r13-1|0;if((r4|0)==0){break}else{r11=r19;r13=r4;r3=r3+1|0}}HEAP32[62816>>2]=r19;r19=_psi_get_uint32_be(r12,12);if(r19>>>0<16){r18=1;STACKTOP=r6;return r18}r3=r19-16|0;r19=r10|0;L13:do{if((r3|0)!=0){r10=r3;while(1){r13=r10>>>0<256?r10:256;if((_psi_read(r1,r19,r13)|0)!=0){r18=1;break}r11=HEAP32[62816>>2];if((r13|0)==0){r20=r11}else{r4=r11;r11=r13;r15=r19;while(1){r17=HEAPU8[r15]<<24^r4;r16=r17<<1;r14=(r17|0)<0?r16^79764919:r16;r16=r14<<1;r17=(r14|0)<0?r16^79764919:r16;r16=r17<<1;r14=(r17|0)<0?r16^79764919:r16;r16=r14<<1;r17=(r14|0)<0?r16^79764919:r16;r16=r17<<1;r14=(r17|0)<0?r16^79764919:r16;r16=r14<<1;r17=(r14|0)<0?r16^79764919:r16;r16=r17<<1;r14=(r17|0)<0?r16^79764919:r16;r16=r14<<1;r17=(r14|0)<0?r16^79764919:r16;r16=r11-1|0;if((r16|0)==0){r20=r17;break}else{r4=r17;r11=r16;r15=r15+1|0}}}HEAP32[62816>>2]=r20;if((r10|0)==(r13|0)){break L13}else{r10=r10-r13|0}}STACKTOP=r6;return r18}}while(0);r20=r9|0;r9=r8|0;r8=r7|0;r3=r7+1|0;r10=r7+2|0;r15=r7+3|0;r11=r7+4|0;r4=r7+5|0;r16=r7+8|0;r7=0;L23:while(1){if((_psi_read(r1,r20,4)|0)!=0){r18=1;r5=137;break}r17=(r7|0)==0;while(1){r14=HEAP32[62816>>2];r21=4;r22=r20;while(1){r23=HEAPU8[r22]<<24^r14;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r26=(r25|0)<0?r24^79764919:r24;r24=r21-1|0;if((r24|0)==0){break}else{r14=r26;r21=r24;r22=r22+1|0}}HEAP32[62816>>2]=r26;r22=_psi_get_uint16_be(r20,0);r27=_psi_get_uint16_be(r20,2);r21=0;r14=4;r13=r20;while(1){r24=HEAPU8[r13]<<24^r21;r25=r24<<1;r23=(r24|0)<0?r25^79764919:r25;r25=r23<<1;r24=(r23|0)<0?r25^79764919:r25;r25=r24<<1;r23=(r24|0)<0?r25^79764919:r25;r25=r23<<1;r24=(r23|0)<0?r25^79764919:r25;r25=r24<<1;r23=(r24|0)<0?r25^79764919:r25;r25=r23<<1;r24=(r23|0)<0?r25^79764919:r25;r25=r24<<1;r23=(r24|0)<0?r25^79764919:r25;r25=r23<<1;r28=(r23|0)<0?r25^79764919:r25;r25=r14-1|0;if((r25|0)==0){break}else{r21=r28;r14=r25;r13=r13+1|0}}if((r22|0)==17229){if((r27|0)==0){if((_psi_read(r1,r9,4)|0)!=0){r18=1;r5=137;break L23}r13=HEAP32[62816>>2];r14=4;r21=r9;while(1){r25=HEAPU8[r21]<<24^r13;r23=r25<<1;r24=(r25|0)<0?r23^79764919:r23;r23=r24<<1;r25=(r24|0)<0?r23^79764919:r23;r23=r25<<1;r24=(r25|0)<0?r23^79764919:r23;r23=r24<<1;r25=(r24|0)<0?r23^79764919:r23;r23=r25<<1;r24=(r25|0)<0?r23^79764919:r23;r23=r24<<1;r25=(r24|0)<0?r23^79764919:r23;r23=r25<<1;r24=(r25|0)<0?r23^79764919:r23;r23=r24<<1;r29=(r24|0)<0?r23^79764919:r23;r23=r14-1|0;if((r23|0)==0){break}else{r13=r29;r14=r23;r21=r21+1|0}}HEAP32[62816>>2]=r29;r30=(_psi_get_uint32_be(r9,0)|0)!=(r28|0)|0}else{r31=_malloc(r27);if((r31|0)==0){r18=1;r5=137;break L23}if((_psi_read(r1,r31,r27)|0)!=0){r5=109;break L23}r21=HEAP32[62816>>2];r14=r27;r13=r31;while(1){r23=HEAPU8[r13]<<24^r21;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r32=(r25|0)<0?r24^79764919:r24;r24=r14-1|0;if((r24|0)==0){break}else{r21=r32;r14=r24;r13=r13+1|0}}HEAP32[62816>>2]=r32;r13=r28;r14=r27;r21=r31;while(1){r24=HEAPU8[r21]<<24^r13;r25=r24<<1;r23=(r24|0)<0?r25^79764919:r25;r25=r23<<1;r24=(r23|0)<0?r25^79764919:r25;r25=r24<<1;r23=(r24|0)<0?r25^79764919:r25;r25=r23<<1;r24=(r23|0)<0?r25^79764919:r25;r25=r24<<1;r23=(r24|0)<0?r25^79764919:r25;r25=r23<<1;r24=(r23|0)<0?r25^79764919:r25;r25=r24<<1;r23=(r24|0)<0?r25^79764919:r25;r25=r23<<1;r33=(r23|0)<0?r25^79764919:r25;r25=r14-1|0;if((r25|0)==0){break}else{r13=r33;r14=r25;r21=r21+1|0}}r21=(HEAP8[r31]|0)==10;r14=(r21<<31>>31)+r27|0;if((r14|0)==0){r34=0}else{r13=r14-1|0;r34=(HEAP8[r31+r13|0]|0)==10?r13:r14}r14=_psi_img_add_comment(r2,r31+(r21&1)|0,r34);_free(r31);if((_psi_read(r1,r9,4)|0)==0){r21=HEAP32[62816>>2];r13=4;r25=r9;while(1){r23=HEAPU8[r25]<<24^r21;r24=r23<<1;r35=(r23|0)<0?r24^79764919:r24;r24=r35<<1;r23=(r35|0)<0?r24^79764919:r24;r24=r23<<1;r35=(r23|0)<0?r24^79764919:r24;r24=r35<<1;r23=(r35|0)<0?r24^79764919:r24;r24=r23<<1;r35=(r23|0)<0?r24^79764919:r24;r24=r35<<1;r23=(r35|0)<0?r24^79764919:r24;r24=r23<<1;r35=(r23|0)<0?r24^79764919:r24;r24=r35<<1;r36=(r35|0)<0?r24^79764919:r24;r24=r13-1|0;if((r24|0)==0){break}else{r21=r36;r13=r24;r25=r25+1|0}}HEAP32[62816>>2]=r36;r37=(_psi_get_uint32_be(r9,0)|0)!=(r33|0)|0}else{r37=1}r30=r37|r14}if((r30|0)!=0){r18=1;r5=137;break L23}}else if((r22|0)==21315){break}else if((r22|0)==21575){if(r17){r18=1;r5=137;break L23}r25=r27>>>0<256?r27:256;if((_psi_read(r1,r19,r25)|0)!=0){r18=1;r5=137;break L23}r13=HEAP32[62816>>2];if((r25|0)==0){HEAP32[62816>>2]=r13;r38=r28}else{r21=r13;r13=r25;r24=r19;while(1){r35=HEAPU8[r24]<<24^r21;r23=r35<<1;r39=(r35|0)<0?r23^79764919:r23;r23=r39<<1;r35=(r39|0)<0?r23^79764919:r23;r23=r35<<1;r39=(r35|0)<0?r23^79764919:r23;r23=r39<<1;r35=(r39|0)<0?r23^79764919:r23;r23=r35<<1;r39=(r35|0)<0?r23^79764919:r23;r23=r39<<1;r35=(r39|0)<0?r23^79764919:r23;r23=r35<<1;r39=(r35|0)<0?r23^79764919:r23;r23=r39<<1;r40=(r39|0)<0?r23^79764919:r23;r23=r13-1|0;if((r23|0)==0){break}else{r21=r40;r13=r23;r24=r24+1|0}}HEAP32[62816>>2]=r40;r24=r28;r13=r25;r21=r19;while(1){r14=HEAPU8[r21]<<24^r24;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r13-1|0;if((r23|0)==0){r38=r14;break}else{r24=r14;r13=r23;r21=r21+1|0}}}_psi_sct_set_tags(r7,r19,r25);if((r25|0)==(r27|0)){r41=r38}else{r21=r27-r25|0;r13=r38;while(1){r24=r21>>>0<256?r21:256;if((_psi_read(r1,r9,r24)|0)!=0){r18=1;r5=137;break L23}r23=HEAP32[62816>>2];if((r24|0)==0){HEAP32[62816>>2]=r23;r42=r13}else{r14=r23;r23=r24;r39=r9;while(1){r35=HEAPU8[r39]<<24^r14;r43=r35<<1;r44=(r35|0)<0?r43^79764919:r43;r43=r44<<1;r35=(r44|0)<0?r43^79764919:r43;r43=r35<<1;r44=(r35|0)<0?r43^79764919:r43;r43=r44<<1;r35=(r44|0)<0?r43^79764919:r43;r43=r35<<1;r44=(r35|0)<0?r43^79764919:r43;r43=r44<<1;r35=(r44|0)<0?r43^79764919:r43;r43=r35<<1;r44=(r35|0)<0?r43^79764919:r43;r43=r44<<1;r45=(r44|0)<0?r43^79764919:r43;r43=r23-1|0;if((r43|0)==0){break}else{r14=r45;r23=r43;r39=r39+1|0}}HEAP32[62816>>2]=r45;r39=r13;r23=r24;r14=r9;while(1){r43=HEAPU8[r14]<<24^r39;r44=r43<<1;r35=(r43|0)<0?r44^79764919:r44;r44=r35<<1;r43=(r35|0)<0?r44^79764919:r44;r44=r43<<1;r35=(r43|0)<0?r44^79764919:r44;r44=r35<<1;r43=(r35|0)<0?r44^79764919:r44;r44=r43<<1;r35=(r43|0)<0?r44^79764919:r44;r44=r35<<1;r43=(r35|0)<0?r44^79764919:r44;r44=r43<<1;r35=(r43|0)<0?r44^79764919:r44;r44=r35<<1;r43=(r35|0)<0?r44^79764919:r44;r44=r23-1|0;if((r44|0)==0){r42=r43;break}else{r39=r43;r23=r44;r14=r14+1|0}}}if((r21|0)==(r24|0)){r41=r42;break}else{r21=r21-r24|0;r13=r42}}}if((_psi_read(r1,r9,4)|0)!=0){r18=1;r5=137;break L23}r13=HEAP32[62816>>2];r21=4;r25=r9;while(1){r14=HEAPU8[r25]<<24^r13;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r46=(r39|0)<0?r23^79764919:r23;r23=r21-1|0;if((r23|0)==0){break}else{r13=r46;r21=r23;r25=r25+1|0}}HEAP32[62816>>2]=r46;if((_psi_get_uint32_be(r9,0)|0)!=(r41|0)){r18=1;r5=137;break L23}}else if((r22|0)!=17742){if((r27|0)==0){r47=r28}else{r25=r27;r21=r28;while(1){r13=r25>>>0<256?r25:256;if((_psi_read(r1,r9,r13)|0)!=0){r18=1;r5=137;break L23}r23=HEAP32[62816>>2];if((r13|0)==0){HEAP32[62816>>2]=r23;r48=r21}else{r39=r23;r23=r13;r14=r9;while(1){r44=HEAPU8[r14]<<24^r39;r43=r44<<1;r35=(r44|0)<0?r43^79764919:r43;r43=r35<<1;r44=(r35|0)<0?r43^79764919:r43;r43=r44<<1;r35=(r44|0)<0?r43^79764919:r43;r43=r35<<1;r44=(r35|0)<0?r43^79764919:r43;r43=r44<<1;r35=(r44|0)<0?r43^79764919:r43;r43=r35<<1;r44=(r35|0)<0?r43^79764919:r43;r43=r44<<1;r35=(r44|0)<0?r43^79764919:r43;r43=r35<<1;r49=(r35|0)<0?r43^79764919:r43;r43=r23-1|0;if((r43|0)==0){break}else{r39=r49;r23=r43;r14=r14+1|0}}HEAP32[62816>>2]=r49;r14=r21;r23=r13;r39=r9;while(1){r24=HEAPU8[r39]<<24^r14;r43=r24<<1;r35=(r24|0)<0?r43^79764919:r43;r43=r35<<1;r24=(r35|0)<0?r43^79764919:r43;r43=r24<<1;r35=(r24|0)<0?r43^79764919:r43;r43=r35<<1;r24=(r35|0)<0?r43^79764919:r43;r43=r24<<1;r35=(r24|0)<0?r43^79764919:r43;r43=r35<<1;r24=(r35|0)<0?r43^79764919:r43;r43=r24<<1;r35=(r24|0)<0?r43^79764919:r43;r43=r35<<1;r24=(r35|0)<0?r43^79764919:r43;r43=r23-1|0;if((r43|0)==0){r48=r24;break}else{r14=r24;r23=r43;r39=r39+1|0}}}if((r25|0)==(r13|0)){r47=r48;break}else{r25=r25-r13|0;r21=r48}}}if((_psi_read(r1,r9,4)|0)!=0){r18=1;r5=137;break L23}r21=HEAP32[62816>>2];r25=4;r22=r9;while(1){r39=HEAPU8[r22]<<24^r21;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r39=(r14|0)<0?r23^79764919:r23;r23=r39<<1;r14=(r39|0)<0?r23^79764919:r23;r23=r14<<1;r50=(r14|0)<0?r23^79764919:r23;r23=r25-1|0;if((r23|0)==0){break}else{r21=r50;r25=r23;r22=r22+1|0}}HEAP32[62816>>2]=r50;if((_psi_get_uint32_be(r9,0)|0)!=(r47|0)){r18=1;r5=137;break L23}}else{r5=20;break L23}if((_psi_read(r1,r20,4)|0)!=0){r18=1;r5=137;break L23}}if(r27>>>0<12){r18=1;r5=137;break}if((_psi_read(r1,r8,12)|0)!=0){r18=1;r5=137;break}r22=HEAP32[62816>>2];r25=12;r21=r8;while(1){r23=HEAPU8[r21]<<24^r22;r14=r23<<1;r39=(r23|0)<0?r14^79764919:r14;r14=r39<<1;r23=(r39|0)<0?r14^79764919:r14;r14=r23<<1;r39=(r23|0)<0?r14^79764919:r14;r14=r39<<1;r23=(r39|0)<0?r14^79764919:r14;r14=r23<<1;r39=(r23|0)<0?r14^79764919:r14;r14=r39<<1;r23=(r39|0)<0?r14^79764919:r14;r14=r23<<1;r39=(r23|0)<0?r14^79764919:r14;r14=r39<<1;r51=(r39|0)<0?r14^79764919:r14;r14=r25-1|0;if((r14|0)==0){break}else{r22=r51;r25=r14;r21=r21+1|0}}HEAP32[62816>>2]=r51;r21=HEAPU8[r8];r25=HEAPU8[r3];r22=HEAPU8[r10];r14=_psi_get_uint16_be(r8,6);r52=_psi_sct_new(HEAPU8[r15],HEAPU8[r11],HEAPU8[r4],r14);if((r52|0)==0){r18=1;r5=137;break}r39=_psi_get_uint32_be(r8,8)&16777215;if((r21&1|0)!=0){r23=r52+12|0;HEAP32[r23>>2]=HEAP32[r23>>2]|1}if((r21&2|0)!=0){r23=r52+12|0;HEAP32[r23>>2]=HEAP32[r23>>2]|2}if((r21&4|0)!=0){r23=r52+12|0;HEAP32[r23>>2]=HEAP32[r23>>2]|4}if((r21&8|0)!=0){r23=r52+12|0;HEAP32[r23>>2]=HEAP32[r23>>2]|8}r23=HEAPU8[r16];if((r23|0)==1){r53=r39>>>0<375e3?1:32769}else if((r23|0)==2){r53=r39>>>0<375e3?2:32770}else if((r23|0)==3){r53=3}else{r53=0}_psi_sct_set_encoding(r52,r53);if((r21&64|0)==0){if((_psi_img_add_sector(r2,r52,r25,r22)|0)==0){r54=r28;r55=12;r56=r8}else{r5=54;break}}else{if(r17){r5=51;break}_psi_sct_add_alternate(r7,r52);r54=r28;r55=12;r56=r8}while(1){r22=HEAPU8[r56]<<24^r54;r25=r22<<1;r23=(r22|0)<0?r25^79764919:r25;r25=r23<<1;r22=(r23|0)<0?r25^79764919:r25;r25=r22<<1;r23=(r22|0)<0?r25^79764919:r25;r25=r23<<1;r22=(r23|0)<0?r25^79764919:r25;r25=r22<<1;r23=(r22|0)<0?r25^79764919:r25;r25=r23<<1;r22=(r23|0)<0?r25^79764919:r25;r25=r22<<1;r23=(r22|0)<0?r25^79764919:r25;r25=r23<<1;r57=(r23|0)<0?r25^79764919:r25;r25=r55-1|0;if((r25|0)==0){break}else{r54=r57;r55=r25;r56=r56+1|0}}r17=r27-12|0;if((r21&128|0)==0){r25=r52+10|0;if(r17>>>0<HEAPU16[r25>>1]>>>0){r18=1;r5=137;break}r23=r52+24|0;r22=HEAP32[r23>>2];if((_psi_read(r1,r22,r14)|0)!=0){r18=1;r5=137;break}r39=HEAP32[62816>>2];if((r14|0)==0){HEAP32[62816>>2]=r39;r58=r57}else{r43=r39;r39=r14;r24=r22;while(1){r22=HEAPU8[r24]<<24^r43;r35=r22<<1;r44=(r22|0)<0?r35^79764919:r35;r35=r44<<1;r22=(r44|0)<0?r35^79764919:r35;r35=r22<<1;r44=(r22|0)<0?r35^79764919:r35;r35=r44<<1;r22=(r44|0)<0?r35^79764919:r35;r35=r22<<1;r44=(r22|0)<0?r35^79764919:r35;r35=r44<<1;r22=(r44|0)<0?r35^79764919:r35;r35=r22<<1;r44=(r22|0)<0?r35^79764919:r35;r35=r44<<1;r59=(r44|0)<0?r35^79764919:r35;r35=r39-1|0;if((r35|0)==0){break}else{r43=r59;r39=r35;r24=r24+1|0}}HEAP32[62816>>2]=r59;r24=r57;r39=r14;r43=HEAP32[r23>>2];while(1){r21=HEAPU8[r43]<<24^r24;r35=r21<<1;r44=(r21|0)<0?r35^79764919:r35;r35=r44<<1;r21=(r44|0)<0?r35^79764919:r35;r35=r21<<1;r44=(r21|0)<0?r35^79764919:r35;r35=r44<<1;r21=(r44|0)<0?r35^79764919:r35;r35=r21<<1;r44=(r21|0)<0?r35^79764919:r35;r35=r44<<1;r21=(r44|0)<0?r35^79764919:r35;r35=r21<<1;r44=(r21|0)<0?r35^79764919:r35;r35=r44<<1;r21=(r44|0)<0?r35^79764919:r35;r35=r39-1|0;if((r35|0)==0){r58=r21;break}else{r24=r21;r39=r35;r43=r43+1|0}}}r60=r17-HEAPU16[r25>>1]|0;r61=r58}else{if((r17|0)==0){r18=1;r5=137;break}if((_psi_read(r1,r8,1)|0)!=0){r18=1;r5=137;break}r43=HEAPU8[r8];r39=r43<<24;r24=r39^HEAP32[62816>>2];r23=r24<<1;r14=(r24|0)<0?r23^79764919:r23;r23=r14<<1;r24=(r14|0)<0?r23^79764919:r23;r23=r24<<1;r14=(r24|0)<0?r23^79764919:r23;r23=r14<<1;r24=(r14|0)<0?r23^79764919:r23;r23=r24<<1;r14=(r24|0)<0?r23^79764919:r23;r23=r14<<1;r24=(r14|0)<0?r23^79764919:r23;r23=r24<<1;r14=(r24|0)<0?r23^79764919:r23;r23=r14<<1;HEAP32[62816>>2]=(r14|0)<0?r23^79764919:r23;r23=r39^r57;r39=r23<<1;r14=(r23|0)<0?r39^79764919:r39;r39=r14<<1;r23=(r14|0)<0?r39^79764919:r39;r39=r23<<1;r14=(r23|0)<0?r39^79764919:r39;r39=r14<<1;r23=(r14|0)<0?r39^79764919:r39;r39=r23<<1;r14=(r23|0)<0?r39^79764919:r39;r39=r14<<1;r23=(r14|0)<0?r39^79764919:r39;r39=r23<<1;r14=(r23|0)<0?r39^79764919:r39;r39=r14<<1;_psi_sct_fill(r52,r43);r60=r27-13|0;r61=(r14|0)<0?r39^79764919:r39}if((r60|0)==0){r62=r61}else{r39=r60;r14=r61;while(1){r43=r39>>>0<256?r39:256;if((_psi_read(r1,r9,r43)|0)!=0){r18=1;r5=137;break L23}r23=HEAP32[62816>>2];if((r43|0)==0){HEAP32[62816>>2]=r23;r63=r14}else{r24=r23;r23=r43;r35=r9;while(1){r21=HEAPU8[r35]<<24^r24;r44=r21<<1;r22=(r21|0)<0?r44^79764919:r44;r44=r22<<1;r21=(r22|0)<0?r44^79764919:r44;r44=r21<<1;r22=(r21|0)<0?r44^79764919:r44;r44=r22<<1;r21=(r22|0)<0?r44^79764919:r44;r44=r21<<1;r22=(r21|0)<0?r44^79764919:r44;r44=r22<<1;r21=(r22|0)<0?r44^79764919:r44;r44=r21<<1;r22=(r21|0)<0?r44^79764919:r44;r44=r22<<1;r64=(r22|0)<0?r44^79764919:r44;r44=r23-1|0;if((r44|0)==0){break}else{r24=r64;r23=r44;r35=r35+1|0}}HEAP32[62816>>2]=r64;r35=r14;r23=r43;r24=r9;while(1){r44=HEAPU8[r24]<<24^r35;r22=r44<<1;r21=(r44|0)<0?r22^79764919:r22;r22=r21<<1;r44=(r21|0)<0?r22^79764919:r22;r22=r44<<1;r21=(r44|0)<0?r22^79764919:r22;r22=r21<<1;r44=(r21|0)<0?r22^79764919:r22;r22=r44<<1;r21=(r44|0)<0?r22^79764919:r22;r22=r21<<1;r44=(r21|0)<0?r22^79764919:r22;r22=r44<<1;r21=(r44|0)<0?r22^79764919:r22;r22=r21<<1;r44=(r21|0)<0?r22^79764919:r22;r22=r23-1|0;if((r22|0)==0){r63=r44;break}else{r35=r44;r23=r22;r24=r24+1|0}}}if((r39|0)==(r43|0)){r62=r63;break}else{r39=r39-r43|0;r14=r63}}}if((_psi_read(r1,r9,4)|0)!=0){r18=1;r5=137;break}r14=HEAP32[62816>>2];r39=4;r17=r9;while(1){r25=HEAPU8[r17]<<24^r14;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r25=(r23|0)<0?r24^79764919:r24;r24=r25<<1;r23=(r25|0)<0?r24^79764919:r24;r24=r23<<1;r65=(r23|0)<0?r24^79764919:r24;r24=r39-1|0;if((r24|0)==0){break}else{r14=r65;r39=r24;r17=r17+1|0}}HEAP32[62816>>2]=r65;if((_psi_get_uint32_be(r9,0)|0)==(r62|0)){r7=r52}else{r18=1;r5=137;break}}if(r5==20){L181:do{if((r27|0)==0){r66=r28}else{r7=r27;r62=r28;while(1){r65=r7>>>0<256?r7:256;if((_psi_read(r1,r9,r65)|0)!=0){r18=1;break}r63=HEAP32[62816>>2];if((r65|0)==0){HEAP32[62816>>2]=r63;r67=r62}else{r64=r63;r63=r65;r61=r9;while(1){r60=HEAPU8[r61]<<24^r64;r57=r60<<1;r8=(r60|0)<0?r57^79764919:r57;r57=r8<<1;r60=(r8|0)<0?r57^79764919:r57;r57=r60<<1;r8=(r60|0)<0?r57^79764919:r57;r57=r8<<1;r60=(r8|0)<0?r57^79764919:r57;r57=r60<<1;r8=(r60|0)<0?r57^79764919:r57;r57=r8<<1;r60=(r8|0)<0?r57^79764919:r57;r57=r60<<1;r8=(r60|0)<0?r57^79764919:r57;r57=r8<<1;r68=(r8|0)<0?r57^79764919:r57;r57=r63-1|0;if((r57|0)==0){break}else{r64=r68;r63=r57;r61=r61+1|0}}HEAP32[62816>>2]=r68;r61=r62;r63=r65;r64=r9;while(1){r43=HEAPU8[r64]<<24^r61;r57=r43<<1;r8=(r43|0)<0?r57^79764919:r57;r57=r8<<1;r43=(r8|0)<0?r57^79764919:r57;r57=r43<<1;r8=(r43|0)<0?r57^79764919:r57;r57=r8<<1;r43=(r8|0)<0?r57^79764919:r57;r57=r43<<1;r8=(r43|0)<0?r57^79764919:r57;r57=r8<<1;r43=(r8|0)<0?r57^79764919:r57;r57=r43<<1;r8=(r43|0)<0?r57^79764919:r57;r57=r8<<1;r43=(r8|0)<0?r57^79764919:r57;r57=r63-1|0;if((r57|0)==0){r67=r43;break}else{r61=r43;r63=r57;r64=r64+1|0}}}if((r7|0)==(r65|0)){r66=r67;break L181}else{r7=r7-r65|0;r62=r67}}STACKTOP=r6;return r18}}while(0);if((_psi_read(r1,r9,4)|0)!=0){r18=1;STACKTOP=r6;return r18}r67=HEAP32[62816>>2];r68=4;r28=r9;while(1){r27=HEAPU8[r28]<<24^r67;r62=r27<<1;r7=(r27|0)<0?r62^79764919:r62;r62=r7<<1;r27=(r7|0)<0?r62^79764919:r62;r62=r27<<1;r7=(r27|0)<0?r62^79764919:r62;r62=r7<<1;r27=(r7|0)<0?r62^79764919:r62;r62=r27<<1;r7=(r27|0)<0?r62^79764919:r62;r62=r7<<1;r27=(r7|0)<0?r62^79764919:r62;r62=r27<<1;r7=(r27|0)<0?r62^79764919:r62;r62=r7<<1;r69=(r7|0)<0?r62^79764919:r62;r62=r68-1|0;if((r62|0)==0){break}else{r67=r69;r68=r62;r28=r28+1|0}}HEAP32[62816>>2]=r69;if((_psi_get_uint32_be(r9,0)|0)!=(r66|0)){r18=1;STACKTOP=r6;return r18}_psi_img_clean_comment(r2);r2=HEAP32[62816>>2];if((_psi_read(r1,r12,4)|0)!=0){r18=1;STACKTOP=r6;return r18}r1=HEAP32[62816>>2];r66=4;r9=r12;while(1){r69=HEAPU8[r9]<<24^r1;r28=r69<<1;r68=(r69|0)<0?r28^79764919:r28;r28=r68<<1;r69=(r68|0)<0?r28^79764919:r28;r28=r69<<1;r68=(r69|0)<0?r28^79764919:r28;r28=r68<<1;r69=(r68|0)<0?r28^79764919:r28;r28=r69<<1;r68=(r69|0)<0?r28^79764919:r28;r28=r68<<1;r69=(r68|0)<0?r28^79764919:r28;r28=r69<<1;r68=(r69|0)<0?r28^79764919:r28;r28=r68<<1;r70=(r68|0)<0?r28^79764919:r28;r28=r66-1|0;if((r28|0)==0){break}else{r1=r70;r66=r28;r9=r9+1|0}}HEAP32[62816>>2]=r70;r18=(_psi_get_uint32_be(r12,0)|0)!=(r2|0)|0;STACKTOP=r6;return r18}else if(r5==51){_psi_sct_del(r52);r18=1;STACKTOP=r6;return r18}else if(r5==54){_psi_sct_del(r52);r18=1;STACKTOP=r6;return r18}else if(r5==109){_free(r31);r18=1;STACKTOP=r6;return r18}else if(r5==137){STACKTOP=r6;return r18}}function _pfdc2_save_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;HEAP32[62816>>2]=-1;r6=r4+16|0;_psi_set_uint32_be(r6,0,1346782275);_psi_set_uint16_be(r6,4,2);_psi_set_uint16_be(r6,6,0);_psi_set_uint32_be(r6,8,0);_psi_set_uint32_be(r6,12,16);if((_psi_write(r1,r6,16)|0)!=0){r7=1;STACKTOP=r4;return r7}r8=HEAP32[62816>>2];r9=16;r10=r6;while(1){r11=HEAPU8[r10]<<24^r8;r12=r11<<1;r13=(r11|0)<0?r12^79764919:r12;r12=r13<<1;r11=(r13|0)<0?r12^79764919:r12;r12=r11<<1;r13=(r11|0)<0?r12^79764919:r12;r12=r13<<1;r11=(r13|0)<0?r12^79764919:r12;r12=r11<<1;r13=(r11|0)<0?r12^79764919:r12;r12=r13<<1;r11=(r13|0)<0?r12^79764919:r12;r12=r11<<1;r13=(r11|0)<0?r12^79764919:r12;r12=r13<<1;r14=(r13|0)<0?r12^79764919:r12;r12=r9-1|0;if((r12|0)==0){break}else{r8=r14;r9=r12;r10=r10+1|0}}HEAP32[62816>>2]=r14;r14=r5|0;r10=r2+8|0;if((HEAP32[r10>>2]|0)!=0){_psi_set_uint16_be(r14,0,17229);_psi_set_uint16_be(r14,2,HEAP32[r10>>2]+2|0);r9=r5+4|0;HEAP8[r9]=10;r5=0;r8=5;r12=r14;while(1){r13=HEAPU8[r12]<<24^r5;r11=r13<<1;r15=(r13|0)<0?r11^79764919:r11;r11=r15<<1;r13=(r15|0)<0?r11^79764919:r11;r11=r13<<1;r15=(r13|0)<0?r11^79764919:r11;r11=r15<<1;r13=(r15|0)<0?r11^79764919:r11;r11=r13<<1;r15=(r13|0)<0?r11^79764919:r11;r11=r15<<1;r13=(r15|0)<0?r11^79764919:r11;r11=r13<<1;r15=(r13|0)<0?r11^79764919:r11;r11=r15<<1;r16=(r15|0)<0?r11^79764919:r11;r11=r8-1|0;if((r11|0)==0){break}else{r5=r16;r8=r11;r12=r12+1|0}}r12=r2+12|0;r8=HEAP32[r10>>2];if((r8|0)==0){r17=r16}else{r5=r16;r16=r8;r8=HEAP32[r12>>2];while(1){r11=HEAPU8[r8]<<24^r5;r15=r11<<1;r13=(r11|0)<0?r15^79764919:r15;r15=r13<<1;r11=(r13|0)<0?r15^79764919:r15;r15=r11<<1;r13=(r11|0)<0?r15^79764919:r15;r15=r13<<1;r11=(r13|0)<0?r15^79764919:r15;r15=r11<<1;r13=(r11|0)<0?r15^79764919:r15;r15=r13<<1;r11=(r13|0)<0?r15^79764919:r15;r15=r11<<1;r13=(r11|0)<0?r15^79764919:r15;r15=r13<<1;r11=(r13|0)<0?r15^79764919:r15;r15=r16-1|0;if((r15|0)==0){r17=r11;break}else{r5=r11;r16=r15;r8=r8+1|0}}}r8=(r17>>31)+335544320&-54452809^r17<<1;r17=r8<<1;r16=(r8|0)<0?r17^79764919:r17;r17=r16<<1;r8=(r16|0)<0?r17^79764919:r17;r17=r8<<1;r16=(r8|0)<0?r17^79764919:r17;r17=r16<<1;r8=(r16|0)<0?r17^79764919:r17;r17=r8<<1;r16=(r8|0)<0?r17^79764919:r17;r17=r16<<1;r8=(r16|0)<0?r17^79764919:r17;r17=r8<<1;r16=(r8|0)<0?r17^79764919:r17;if((_psi_write(r1,r14,5)|0)==0){r17=HEAP32[62816>>2];r8=5;r5=r14;while(1){r15=HEAPU8[r5]<<24^r17;r11=r15<<1;r13=(r15|0)<0?r11^79764919:r11;r11=r13<<1;r15=(r13|0)<0?r11^79764919:r11;r11=r15<<1;r13=(r15|0)<0?r11^79764919:r11;r11=r13<<1;r15=(r13|0)<0?r11^79764919:r11;r11=r15<<1;r13=(r15|0)<0?r11^79764919:r11;r11=r13<<1;r15=(r13|0)<0?r11^79764919:r11;r11=r15<<1;r13=(r15|0)<0?r11^79764919:r11;r11=r13<<1;r18=(r13|0)<0?r11^79764919:r11;r11=r8-1|0;if((r11|0)==0){break}else{r17=r18;r8=r11;r5=r5+1|0}}HEAP32[62816>>2]=r18;r19=0}else{r19=1}r18=HEAP32[r12>>2];r12=HEAP32[r10>>2];if((_psi_write(r1,r18,r12)|0)==0){r10=HEAP32[62816>>2];if((r12|0)==0){r20=r10}else{r5=r10;r10=r12;r12=r18;while(1){r18=HEAPU8[r12]<<24^r5;r8=r18<<1;r17=(r18|0)<0?r8^79764919:r8;r8=r17<<1;r18=(r17|0)<0?r8^79764919:r8;r8=r18<<1;r17=(r18|0)<0?r8^79764919:r8;r8=r17<<1;r18=(r17|0)<0?r8^79764919:r8;r8=r18<<1;r17=(r18|0)<0?r8^79764919:r8;r8=r17<<1;r18=(r17|0)<0?r8^79764919:r8;r8=r18<<1;r17=(r18|0)<0?r8^79764919:r8;r8=r17<<1;r18=(r17|0)<0?r8^79764919:r8;r8=r10-1|0;if((r8|0)==0){r20=r18;break}else{r5=r18;r10=r8;r12=r12+1|0}}}HEAP32[62816>>2]=r20;r21=0}else{r21=1}if((_psi_write(r1,r9,1)|0)==0){r20=HEAPU8[r9]<<24^HEAP32[62816>>2];r9=r20<<1;r12=(r20|0)<0?r9^79764919:r9;r9=r12<<1;r20=(r12|0)<0?r9^79764919:r9;r9=r20<<1;r12=(r20|0)<0?r9^79764919:r9;r9=r12<<1;r20=(r12|0)<0?r9^79764919:r9;r9=r20<<1;r12=(r20|0)<0?r9^79764919:r9;r9=r12<<1;r20=(r12|0)<0?r9^79764919:r9;r9=r20<<1;r12=(r20|0)<0?r9^79764919:r9;r9=r12<<1;HEAP32[62816>>2]=(r12|0)<0?r9^79764919:r9;r22=0}else{r22=1}r9=r21|r19|r22;_psi_set_uint32_be(r14,0,r16);if((_psi_write(r1,r14,4)|0)==0){r16=HEAP32[62816>>2];r22=4;r19=r14;while(1){r14=HEAPU8[r19]<<24^r16;r21=r14<<1;r12=(r14|0)<0?r21^79764919:r21;r21=r12<<1;r14=(r12|0)<0?r21^79764919:r21;r21=r14<<1;r12=(r14|0)<0?r21^79764919:r21;r21=r12<<1;r14=(r12|0)<0?r21^79764919:r21;r21=r14<<1;r12=(r14|0)<0?r21^79764919:r21;r21=r12<<1;r14=(r12|0)<0?r21^79764919:r21;r21=r14<<1;r12=(r14|0)<0?r21^79764919:r21;r21=r12<<1;r23=(r12|0)<0?r21^79764919:r21;r21=r22-1|0;if((r21|0)==0){break}else{r16=r23;r22=r21;r19=r19+1|0}}HEAP32[62816>>2]=r23;r24=0}else{r24=1}if((r9|r24|0)!=0){r7=1;STACKTOP=r4;return r7}}r24=r2|0;r9=HEAP16[r24>>1];L41:do{if(r9<<16>>16!=0){r23=r2+4|0;r19=0;r22=r9;L43:while(1){r16=HEAP32[HEAP32[r23>>2]+(r19<<2)>>2];r21=r16+2|0;r12=HEAP16[r21>>1];if(r12<<16>>16==0){r25=r22}else{r14=r16+4|0;r16=0;r20=r12;while(1){r12=HEAP32[HEAP32[r14>>2]+(r16<<2)>>2];r10=r12+2|0;if((HEAP16[r10>>1]|0)==0){r26=r20}else{r5=r12+4|0;r12=0;while(1){r8=HEAP32[HEAP32[r5>>2]+(r12<<2)>>2];if((_pfdc2_save_sector(r1,r8,r19,r16,0)|0)==0){r27=r8}else{r7=1;r3=44;break L43}while(1){r8=HEAP32[r27>>2];if((r8|0)==0){break}if((_pfdc2_save_sector(r1,r8,r19,r16,1)|0)==0){r27=r8}else{r7=1;r3=44;break L43}}r8=r12+1|0;if(r8>>>0<HEAPU16[r10>>1]>>>0){r12=r8}else{break}}r26=HEAP16[r21>>1]}r12=r16+1|0;if(r12>>>0<(r26&65535)>>>0){r16=r12;r20=r26}else{break}}r25=HEAP16[r24>>1]}r20=r19+1|0;if(r20>>>0<(r25&65535)>>>0){r19=r20;r22=r25}else{break L41}}if(r3==44){STACKTOP=r4;return r7}}}while(0);if((_pfdc2_save_chunk(r1,17742,0,0)|0)!=0){r7=1;STACKTOP=r4;return r7}_psi_set_uint32_be(r6,0,HEAP32[62816>>2]);if((_psi_write(r1,r6,4)|0)!=0){r7=1;STACKTOP=r4;return r7}r3=HEAP32[62816>>2];r25=4;r24=r6;while(1){r6=HEAPU8[r24]<<24^r3;r26=r6<<1;r27=(r6|0)<0?r26^79764919:r26;r26=r27<<1;r6=(r27|0)<0?r26^79764919:r26;r26=r6<<1;r27=(r6|0)<0?r26^79764919:r26;r26=r27<<1;r6=(r27|0)<0?r26^79764919:r26;r26=r6<<1;r27=(r6|0)<0?r26^79764919:r26;r26=r27<<1;r6=(r27|0)<0?r26^79764919:r26;r26=r6<<1;r27=(r6|0)<0?r26^79764919:r26;r26=r27<<1;r28=(r27|0)<0?r26^79764919:r26;r26=r25-1|0;if((r26|0)==0){break}else{r3=r28;r25=r26;r24=r24+1|0}}HEAP32[62816>>2]=r28;_fflush(r1);r7=0;STACKTOP=r4;return r7}function _pfdc2_save_chunk(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5|0;_psi_set_uint16_be(r6,0,r2);_psi_set_uint16_be(r6,2,r3);r2=0;r7=4;r8=r6;while(1){r9=HEAPU8[r8]<<24^r2;r10=r9<<1;r11=(r9|0)<0?r10^79764919:r10;r10=r11<<1;r9=(r11|0)<0?r10^79764919:r10;r10=r9<<1;r11=(r9|0)<0?r10^79764919:r10;r10=r11<<1;r9=(r11|0)<0?r10^79764919:r10;r10=r9<<1;r11=(r9|0)<0?r10^79764919:r10;r10=r11<<1;r9=(r11|0)<0?r10^79764919:r10;r10=r9<<1;r11=(r9|0)<0?r10^79764919:r10;r10=r11<<1;r12=(r11|0)<0?r10^79764919:r10;r10=r7-1|0;if((r10|0)==0){break}else{r2=r12;r7=r10;r8=r8+1|0}}if((_psi_write(r1,r6,4)|0)!=0){r13=1;STACKTOP=r5;return r13}r8=HEAP32[62816>>2];r7=4;r2=r6;while(1){r10=HEAPU8[r2]<<24^r8;r11=r10<<1;r9=(r10|0)<0?r11^79764919:r11;r11=r9<<1;r10=(r9|0)<0?r11^79764919:r11;r11=r10<<1;r9=(r10|0)<0?r11^79764919:r11;r11=r9<<1;r10=(r9|0)<0?r11^79764919:r11;r11=r10<<1;r9=(r10|0)<0?r11^79764919:r11;r11=r9<<1;r10=(r9|0)<0?r11^79764919:r11;r11=r10<<1;r9=(r10|0)<0?r11^79764919:r11;r11=r9<<1;r14=(r9|0)<0?r11^79764919:r11;r11=r7-1|0;if((r11|0)==0){break}else{r8=r14;r7=r11;r2=r2+1|0}}HEAP32[62816>>2]=r14;if((r3|0)==0){r15=r12}else{r14=r12;r12=r3;r2=r4;while(1){r7=HEAPU8[r2]<<24^r14;r8=r7<<1;r11=(r7|0)<0?r8^79764919:r8;r8=r11<<1;r7=(r11|0)<0?r8^79764919:r8;r8=r7<<1;r11=(r7|0)<0?r8^79764919:r8;r8=r11<<1;r7=(r11|0)<0?r8^79764919:r8;r8=r7<<1;r11=(r7|0)<0?r8^79764919:r8;r8=r11<<1;r7=(r11|0)<0?r8^79764919:r8;r8=r7<<1;r11=(r7|0)<0?r8^79764919:r8;r8=r11<<1;r16=(r11|0)<0?r8^79764919:r8;r8=r12-1|0;if((r8|0)==0){break}else{r14=r16;r12=r8;r2=r2+1|0}}if((_psi_write(r1,r4,r3)|0)!=0){r13=1;STACKTOP=r5;return r13}r2=HEAP32[62816>>2];r12=r3;r3=r4;while(1){r4=HEAPU8[r3]<<24^r2;r14=r4<<1;r8=(r4|0)<0?r14^79764919:r14;r14=r8<<1;r4=(r8|0)<0?r14^79764919:r14;r14=r4<<1;r8=(r4|0)<0?r14^79764919:r14;r14=r8<<1;r4=(r8|0)<0?r14^79764919:r14;r14=r4<<1;r8=(r4|0)<0?r14^79764919:r14;r14=r8<<1;r4=(r8|0)<0?r14^79764919:r14;r14=r4<<1;r8=(r4|0)<0?r14^79764919:r14;r14=r8<<1;r17=(r8|0)<0?r14^79764919:r14;r14=r12-1|0;if((r14|0)==0){break}else{r2=r17;r12=r14;r3=r3+1|0}}HEAP32[62816>>2]=r17;r15=r16}_psi_set_uint32_be(r6,0,r15);if((_psi_write(r1,r6,4)|0)!=0){r13=1;STACKTOP=r5;return r13}r1=HEAP32[62816>>2];r15=4;r16=r6;while(1){r6=HEAPU8[r16]<<24^r1;r17=r6<<1;r3=(r6|0)<0?r17^79764919:r17;r17=r3<<1;r6=(r3|0)<0?r17^79764919:r17;r17=r6<<1;r3=(r6|0)<0?r17^79764919:r17;r17=r3<<1;r6=(r3|0)<0?r17^79764919:r17;r17=r6<<1;r3=(r6|0)<0?r17^79764919:r17;r17=r3<<1;r6=(r3|0)<0?r17^79764919:r17;r17=r6<<1;r3=(r6|0)<0?r17^79764919:r17;r17=r3<<1;r18=(r3|0)<0?r17^79764919:r17;r17=r15-1|0;if((r17|0)==0){break}else{r1=r18;r15=r17;r16=r16+1|0}}HEAP32[62816>>2]=r18;r13=0;STACKTOP=r5;return r13}function _pfdc2_save_sector(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r6=STACKTOP;STACKTOP=STACKTOP+256|0;r7=r6;r8=r7|0;r9=HEAP32[r2+12>>2]&15;r10=r9&255;r11=(_psi_sct_uniform(r2)|0)==0;r12=HEAP16[r2+10>>1];if(!r11){if(r12<<16>>16==0){r13=r10;r14=12}else{r13=(r9|128)&255;r14=13}}else{r13=r10;r14=(r12&65535)+12|0}r12=(r5|0)==0?r13:r13|64;_psi_set_uint16_be(r8,0,21315);_psi_set_uint16_be(r8,2,r14);r14=HEAP16[r2+16>>1];r13=r14&65535;if((r13|0)==2){r15=25e4;r16=r14&255}else if((r13|0)==32770){r15=5e5;r16=2}else if((r13|0)==3){r15=5e5;r16=r14&255}else if((r13|0)==1){r15=125e3;r16=1}else if((r13|0)==32769){r15=25e4;r16=1}else if((r13|0)==16386){r15=1e6;r16=2}else{r15=0;r16=0}_psi_set_uint32_be(r8,12,r15);HEAP8[r7+4|0]=r12;HEAP8[r7+5|0]=r3;HEAP8[r7+6|0]=r4;HEAP8[r7+7|0]=HEAP16[r2+4>>1];HEAP8[r7+8|0]=HEAP16[r2+6>>1];HEAP8[r7+9|0]=HEAP16[r2+8>>1];r4=r2+10|0;r3=HEAP16[r4>>1];HEAP8[r7+10|0]=(r3&65535)>>>8;HEAP8[r7+11|0]=r3;HEAP8[r7+12|0]=r16;r16=0;r7=16;r3=r8;while(1){r15=HEAPU8[r3]<<24^r16;r13=r15<<1;r14=(r15|0)<0?r13^79764919:r13;r13=r14<<1;r15=(r14|0)<0?r13^79764919:r13;r13=r15<<1;r14=(r15|0)<0?r13^79764919:r13;r13=r14<<1;r15=(r14|0)<0?r13^79764919:r13;r13=r15<<1;r14=(r15|0)<0?r13^79764919:r13;r13=r14<<1;r15=(r14|0)<0?r13^79764919:r13;r13=r15<<1;r14=(r15|0)<0?r13^79764919:r13;r13=r14<<1;r17=(r14|0)<0?r13^79764919:r13;r13=r7-1|0;if((r13|0)==0){break}else{r16=r17;r7=r13;r3=r3+1|0}}if((_psi_write(r1,r8,16)|0)!=0){r18=1;r19=256;r20=0;STACKTOP=r6;return r18}r3=HEAP32[62816>>2];r7=16;r16=r8;while(1){r13=HEAPU8[r16]<<24^r3;r14=r13<<1;r15=(r13|0)<0?r14^79764919:r14;r14=r15<<1;r13=(r15|0)<0?r14^79764919:r14;r14=r13<<1;r15=(r13|0)<0?r14^79764919:r14;r14=r15<<1;r13=(r15|0)<0?r14^79764919:r14;r14=r13<<1;r15=(r13|0)<0?r14^79764919:r14;r14=r15<<1;r13=(r15|0)<0?r14^79764919:r14;r14=r13<<1;r15=(r13|0)<0?r14^79764919:r14;r14=r15<<1;r21=(r15|0)<0?r14^79764919:r14;r14=r7-1|0;if((r14|0)==0){break}else{r3=r21;r7=r14;r16=r16+1|0}}HEAP32[62816>>2]=r21;r21=HEAP32[r2+24>>2];do{if(r12<<24>>24<0){r16=HEAP8[r21];HEAP8[r8]=r16;r7=(r16&255)<<24^r17;r16=r7<<1;r3=(r7|0)<0?r16^79764919:r16;r16=r3<<1;r7=(r3|0)<0?r16^79764919:r16;r16=r7<<1;r3=(r7|0)<0?r16^79764919:r16;r16=r3<<1;r7=(r3|0)<0?r16^79764919:r16;r16=r7<<1;r3=(r7|0)<0?r16^79764919:r16;r16=r3<<1;r7=(r3|0)<0?r16^79764919:r16;r16=r7<<1;r3=(r7|0)<0?r16^79764919:r16;r16=r3<<1;if((_psi_write(r1,r8,1)|0)==0){r7=HEAPU8[r8]<<24^HEAP32[62816>>2];r14=r7<<1;r15=(r7|0)<0?r14^79764919:r14;r14=r15<<1;r7=(r15|0)<0?r14^79764919:r14;r14=r7<<1;r15=(r7|0)<0?r14^79764919:r14;r14=r15<<1;r7=(r15|0)<0?r14^79764919:r14;r14=r7<<1;r15=(r7|0)<0?r14^79764919:r14;r14=r15<<1;r7=(r15|0)<0?r14^79764919:r14;r14=r7<<1;r15=(r7|0)<0?r14^79764919:r14;r14=r15<<1;r22=(r3|0)<0?r16^79764919:r16;r23=(r15|0)<0?r14^79764919:r14;break}else{r18=1;r19=256;r20=0;STACKTOP=r6;return r18}}else{r14=HEAP16[r4>>1];r15=r14<<16>>16==0;if(r15){r24=r17;r25=0}else{r16=r14&65535;r14=r17;r3=r16;r7=r21;while(1){r13=HEAPU8[r7]<<24^r14;r5=r13<<1;r10=(r13|0)<0?r5^79764919:r5;r5=r10<<1;r13=(r10|0)<0?r5^79764919:r5;r5=r13<<1;r10=(r13|0)<0?r5^79764919:r5;r5=r10<<1;r13=(r10|0)<0?r5^79764919:r5;r5=r13<<1;r10=(r13|0)<0?r5^79764919:r5;r5=r10<<1;r13=(r10|0)<0?r5^79764919:r5;r5=r13<<1;r10=(r13|0)<0?r5^79764919:r5;r5=r10<<1;r13=(r10|0)<0?r5^79764919:r5;r5=r3-1|0;if((r5|0)==0){r24=r13;r25=r16;break}else{r14=r13;r3=r5;r7=r7+1|0}}}if((_psi_write(r1,r21,r25)|0)!=0){r18=1;r19=256;r20=0;STACKTOP=r6;return r18}r7=HEAP32[62816>>2];if(r15){r22=r24;r23=r7}else{r3=r7;r7=r25;r14=r21;while(1){r16=HEAPU8[r14]<<24^r3;r5=r16<<1;r13=(r16|0)<0?r5^79764919:r5;r5=r13<<1;r16=(r13|0)<0?r5^79764919:r5;r5=r16<<1;r13=(r16|0)<0?r5^79764919:r5;r5=r13<<1;r16=(r13|0)<0?r5^79764919:r5;r5=r16<<1;r13=(r16|0)<0?r5^79764919:r5;r5=r13<<1;r16=(r13|0)<0?r5^79764919:r5;r5=r16<<1;r13=(r16|0)<0?r5^79764919:r5;r5=r13<<1;r16=(r13|0)<0?r5^79764919:r5;r5=r7-1|0;if((r5|0)==0){r22=r24;r23=r16;break}else{r3=r16;r7=r5;r14=r14+1|0}}}}}while(0);HEAP32[62816>>2]=r23;_psi_set_uint32_be(r8,0,r22);if((_psi_write(r1,r8,4)|0)!=0){r18=1;r19=256;r20=0;STACKTOP=r6;return r18}r22=HEAP32[62816>>2];r23=4;r24=r8;while(1){r21=HEAPU8[r24]<<24^r22;r25=r21<<1;r17=(r21|0)<0?r25^79764919:r25;r25=r17<<1;r21=(r17|0)<0?r25^79764919:r25;r25=r21<<1;r17=(r21|0)<0?r25^79764919:r25;r25=r17<<1;r21=(r17|0)<0?r25^79764919:r25;r25=r21<<1;r17=(r21|0)<0?r25^79764919:r25;r25=r17<<1;r21=(r17|0)<0?r25^79764919:r25;r25=r21<<1;r17=(r21|0)<0?r25^79764919:r25;r25=r17<<1;r26=(r17|0)<0?r25^79764919:r25;r25=r23-1|0;if((r25|0)==0){break}else{r22=r26;r23=r25;r24=r24+1|0}}HEAP32[62816>>2]=r26;r26=_psi_sct_get_tags(r2,r8,256);if((r26|0)!=0?(_pfdc2_save_chunk(r1,21575,r26,r8)|0)!=0:0){r18=1;r19=256;r20=0;STACKTOP=r6;return r18}r18=0;r19=256;r20=0;STACKTOP=r6;return r18}function _pfdc4_load_fp(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62;r5=0;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+560|0;r8=r7;r9=r7+256;r10=r7+288;r11=r7+296;r12=r7+552;r13=r12|0;_psi_set_uint32_be(r13,0,r3);_psi_set_uint32_be(r13,4,r4);if((HEAP32[60384>>2]|0)==0){r3=0;while(1){r14=r3<<25;r15=(r3&128|0)!=0?r14^517762881:r14;r14=r15<<1;r16=(r15|0)<0?r14^517762881:r14;r14=r16<<1;r15=(r16|0)<0?r14^517762881:r14;r14=r15<<1;r16=(r15|0)<0?r14^517762881:r14;r14=r16<<1;r15=(r16|0)<0?r14^517762881:r14;r14=r15<<1;r16=(r15|0)<0?r14^517762881:r14;r14=r16<<1;r15=(r16|0)<0?r14^517762881:r14;r14=r15<<1;HEAP32[60392+(r3<<2)>>2]=(r15|0)<0?r14^517762881:r14;r14=r3+1|0;if(r14>>>0<256){r3=r14}else{break}}HEAP32[60384>>2]=1}r3=r12+1|0;r14=HEAP32[60392+(HEAPU8[r13]<<2)>>2];r15=r12+2|0;r16=HEAP32[60392+((HEAPU8[r3]^r14>>>24)<<2)>>2]^r14<<8;r14=r12+3|0;r17=HEAP32[60392+((HEAPU8[r15]^r16>>>24)<<2)>>2]^r16<<8;r16=r12+4|0;r18=HEAP32[60392+((HEAPU8[r14]^r17>>>24)<<2)>>2]^r17<<8;r17=r12+5|0;r19=HEAP32[60392+((HEAPU8[r16]^r18>>>24)<<2)>>2]^r18<<8;r18=r12+6|0;r20=HEAP32[60392+((HEAPU8[r17]^r19>>>24)<<2)>>2]^r19<<8;r19=r12+7|0;r12=HEAP32[60392+((HEAPU8[r18]^r20>>>24)<<2)>>2]^r20<<8;r20=HEAP32[60392+((HEAPU8[r19]^r12>>>24)<<2)>>2]^r12<<8;r12=r10|0;if(r4>>>0<4){r21=1;STACKTOP=r7;return r21}if((_fread(r12,1,4,r1)|0)!=4){r21=1;STACKTOP=r7;return r21}if((HEAP32[60384>>2]|0)==0){r22=0;while(1){r23=r22<<25;r24=(r22&128|0)!=0?r23^517762881:r23;r23=r24<<1;r25=(r24|0)<0?r23^517762881:r23;r23=r25<<1;r24=(r25|0)<0?r23^517762881:r23;r23=r24<<1;r25=(r24|0)<0?r23^517762881:r23;r23=r25<<1;r24=(r25|0)<0?r23^517762881:r23;r23=r24<<1;r25=(r24|0)<0?r23^517762881:r23;r23=r25<<1;r24=(r25|0)<0?r23^517762881:r23;r23=r24<<1;HEAP32[60392+(r22<<2)>>2]=(r24|0)<0?r23^517762881:r23;r23=r22+1|0;if(r23>>>0<256){r22=r23}else{break}}HEAP32[60384>>2]=1}r22=HEAP32[60392+((HEAPU8[r12]^r20>>>24)<<2)>>2]^r20<<8;r20=HEAP32[60392+((HEAPU8[r10+1|0]^r22>>>24)<<2)>>2]^r22<<8;r22=HEAP32[60392+((HEAPU8[r10+2|0]^r20>>>24)<<2)>>2]^r20<<8;r20=HEAP32[60392+((HEAPU8[r10+3|0]^r22>>>24)<<2)>>2]^r22<<8;r22=_psi_get_uint32_be(r12,0);if((r22|0)!=262144){_fprintf(HEAP32[_stderr>>2],50048,(r6=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r6>>2]=r22,r6));STACKTOP=r6;r21=1;STACKTOP=r7;return r21}r6=r4-4|0;r4=r11|0;L21:do{if((r6|0)==0){r26=r20}else{r11=r6;r22=r20;while(1){r12=r11>>>0<256?r11:256;if((_fread(r4,1,r12,r1)|0)!=(r12|0)){r21=1;break}if((HEAP32[60384>>2]|0)==0){r10=0;while(1){r23=r10<<25;r24=(r10&128|0)!=0?r23^517762881:r23;r23=r24<<1;r25=(r24|0)<0?r23^517762881:r23;r23=r25<<1;r24=(r25|0)<0?r23^517762881:r23;r23=r24<<1;r25=(r24|0)<0?r23^517762881:r23;r23=r25<<1;r24=(r25|0)<0?r23^517762881:r23;r23=r24<<1;r25=(r24|0)<0?r23^517762881:r23;r23=r25<<1;r24=(r25|0)<0?r23^517762881:r23;r23=r24<<1;HEAP32[60392+(r10<<2)>>2]=(r24|0)<0?r23^517762881:r23;r23=r10+1|0;if(r23>>>0<256){r10=r23}else{break}}HEAP32[60384>>2]=1}if((r12|0)==0){r27=r22}else{r10=r12;r23=r22;r24=r4;while(1){r25=HEAP32[60392+((HEAPU8[r24]^r23>>>24)<<2)>>2]^r23<<8;r28=r10-1|0;if((r28|0)==0){r27=r25;break}else{r10=r28;r23=r25;r24=r24+1|0}}}if((r11|0)==(r12|0)){r26=r27;break L21}else{r11=r11-r12|0;r22=r27}}STACKTOP=r7;return r21}}while(0);if((_fread(r4,1,4,r1)|0)!=4){r21=1;STACKTOP=r7;return r21}if((_psi_get_uint32_be(r4,0)|0)!=(r26|0)){_fwrite(52816,16,1,HEAP32[_stderr>>2]);r21=1;STACKTOP=r7;return r21}r26=r8|0;r8=HEAP32[_stderr>>2];r27=r9|0;r20=r9+12|0;r6=r9+13|0;r9=0;L43:while(1){if((_fread(r13,1,8,r1)|0)!=8){r21=1;r5=145;break}r22=(r9|0)==0;r11=r9+10|0;r24=r9+24|0;L46:while(1){if((HEAP32[60384>>2]|0)==0){r23=0;while(1){r10=r23<<25;r25=(r23&128|0)!=0?r10^517762881:r10;r10=r25<<1;r28=(r25|0)<0?r10^517762881:r10;r10=r28<<1;r25=(r28|0)<0?r10^517762881:r10;r10=r25<<1;r28=(r25|0)<0?r10^517762881:r10;r10=r28<<1;r25=(r28|0)<0?r10^517762881:r10;r10=r25<<1;r28=(r25|0)<0?r10^517762881:r10;r10=r28<<1;r25=(r28|0)<0?r10^517762881:r10;r10=r25<<1;HEAP32[60392+(r23<<2)>>2]=(r25|0)<0?r10^517762881:r10;r10=r23+1|0;if(r10>>>0<256){r23=r10}else{break}}HEAP32[60384>>2]=1}r23=HEAP32[60392+(HEAPU8[r13]<<2)>>2];r12=HEAP32[60392+((HEAPU8[r3]^r23>>>24)<<2)>>2]^r23<<8;r23=HEAP32[60392+((HEAPU8[r15]^r12>>>24)<<2)>>2]^r12<<8;r12=HEAP32[60392+((HEAPU8[r14]^r23>>>24)<<2)>>2]^r23<<8;r23=HEAP32[60392+((HEAPU8[r16]^r12>>>24)<<2)>>2]^r12<<8;r12=HEAP32[60392+((HEAPU8[r17]^r23>>>24)<<2)>>2]^r23<<8;r23=HEAP32[60392+((HEAPU8[r18]^r12>>>24)<<2)>>2]^r12<<8;r29=HEAP32[60392+((HEAPU8[r19]^r23>>>24)<<2)>>2]^r23<<8;r23=_psi_get_uint32_be(r13,0);r30=_psi_get_uint32_be(r13,4);do{if((r23|0)==1162757152){r5=27;break L43}else if((r23|0)==1397048148){break L46}else if((r23|0)==1413564243){if(r22){r21=1;r5=145;break L43}r12=r30>>>0<256?r30:256;if((_fread(r26,1,r12,r1)|0)!=(r12|0)){r21=1;r5=145;break L43}if((HEAP32[60384>>2]|0)==0){r10=0;while(1){r25=r10<<25;r28=(r10&128|0)!=0?r25^517762881:r25;r25=r28<<1;r31=(r28|0)<0?r25^517762881:r25;r25=r31<<1;r28=(r31|0)<0?r25^517762881:r25;r25=r28<<1;r31=(r28|0)<0?r25^517762881:r25;r25=r31<<1;r28=(r31|0)<0?r25^517762881:r25;r25=r28<<1;r31=(r28|0)<0?r25^517762881:r25;r25=r31<<1;r28=(r31|0)<0?r25^517762881:r25;r25=r28<<1;HEAP32[60392+(r10<<2)>>2]=(r28|0)<0?r25^517762881:r25;r25=r10+1|0;if(r25>>>0<256){r10=r25}else{break}}HEAP32[60384>>2]=1}if((r12|0)==0){r32=r29}else{r10=r12;r25=r29;r28=r26;while(1){r31=HEAP32[60392+((HEAPU8[r28]^r25>>>24)<<2)>>2]^r25<<8;r33=r10-1|0;if((r33|0)==0){r32=r31;break}else{r10=r33;r25=r31;r28=r28+1|0}}}_psi_sct_set_tags(r9,r26,r12);if((r12|0)==(r30|0)){r34=r32}else{r28=r30-r12|0;r25=r32;while(1){r10=r28>>>0<256?r28:256;if((_fread(r4,1,r10,r1)|0)!=(r10|0)){r21=1;r5=145;break L43}if((HEAP32[60384>>2]|0)==0){r31=0;while(1){r33=r31<<25;r35=(r31&128|0)!=0?r33^517762881:r33;r33=r35<<1;r36=(r35|0)<0?r33^517762881:r33;r33=r36<<1;r35=(r36|0)<0?r33^517762881:r33;r33=r35<<1;r36=(r35|0)<0?r33^517762881:r33;r33=r36<<1;r35=(r36|0)<0?r33^517762881:r33;r33=r35<<1;r36=(r35|0)<0?r33^517762881:r33;r33=r36<<1;r35=(r36|0)<0?r33^517762881:r33;r33=r35<<1;HEAP32[60392+(r31<<2)>>2]=(r35|0)<0?r33^517762881:r33;r33=r31+1|0;if(r33>>>0<256){r31=r33}else{break}}HEAP32[60384>>2]=1}if((r10|0)==0){r37=r25}else{r31=r10;r33=r25;r35=r4;while(1){r36=HEAP32[60392+((HEAPU8[r35]^r33>>>24)<<2)>>2]^r33<<8;r38=r31-1|0;if((r38|0)==0){r37=r36;break}else{r31=r38;r33=r36;r35=r35+1|0}}}if((r28|0)==(r10|0)){r34=r37;break}else{r28=r28-r10|0;r25=r37}}}if((_fread(r4,1,4,r1)|0)!=4){r21=1;r5=145;break L43}if((_psi_get_uint32_be(r4,0)|0)!=(r34|0)){r5=115;break L43}}else if((r23|0)==1413830740){if((r30|0)==0){if((_fread(r4,1,4,r1)|0)!=4){r21=1;r5=145;break L43}if((_psi_get_uint32_be(r4,0)|0)==(r29|0)){break}else{r5=119;break L43}}r39=_malloc(r30);if((r39|0)==0){r21=1;r5=145;break L43}if((_fread(r39,1,r30,r1)|0)!=(r30|0)){r5=126;break L43}if((HEAP32[60384>>2]|0)==0){r25=0;while(1){r28=r25<<25;r12=(r25&128|0)!=0?r28^517762881:r28;r28=r12<<1;r35=(r12|0)<0?r28^517762881:r28;r28=r35<<1;r12=(r35|0)<0?r28^517762881:r28;r28=r12<<1;r35=(r12|0)<0?r28^517762881:r28;r28=r35<<1;r12=(r35|0)<0?r28^517762881:r28;r28=r12<<1;r35=(r12|0)<0?r28^517762881:r28;r28=r35<<1;r12=(r35|0)<0?r28^517762881:r28;r28=r12<<1;HEAP32[60392+(r25<<2)>>2]=(r12|0)<0?r28^517762881:r28;r28=r25+1|0;if(r28>>>0<256){r25=r28}else{break}}HEAP32[60384>>2]=1;r40=r30;r41=r29;r42=r39}else{r40=r30;r41=r29;r42=r39}while(1){r43=HEAP32[60392+((HEAPU8[r42]^r41>>>24)<<2)>>2]^r41<<8;r25=r40-1|0;if((r25|0)==0){break}else{r40=r25;r41=r43;r42=r42+1|0}}r25=(HEAP8[r39]|0)==10;r28=(r25<<31>>31)+r30|0;if((r28|0)==0){r44=0}else{r12=r28-1|0;r44=(HEAP8[r39+r12|0]|0)==10?r12:r28}r28=_psi_img_add_comment(r2,r39+(r25&1)|0,r44);_free(r39);if((_fread(r4,1,4,r1)|0)==4){if((_psi_get_uint32_be(r4,0)|0)==(r43|0)){r45=0}else{_fwrite(52816,16,1,r8);r45=1}}else{r45=1}if((r45|r28|0)!=0){r21=1;r5=145;break L43}}else if((r23|0)==1145132097){if(r22){r21=1;r5=145;break L43}r28=HEAPU16[r11>>1];r25=r28>>>0<r30>>>0?r28:r30;if((r25|0)==0){r46=r29}else{r28=HEAP32[r24>>2];if((_fread(r28,1,r25,r1)|0)!=(r25|0)){r21=1;r5=145;break L43}if((HEAP32[60384>>2]|0)==0){r12=0;while(1){r35=r12<<25;r33=(r12&128|0)!=0?r35^517762881:r35;r35=r33<<1;r31=(r33|0)<0?r35^517762881:r35;r35=r31<<1;r33=(r31|0)<0?r35^517762881:r35;r35=r33<<1;r31=(r33|0)<0?r35^517762881:r35;r35=r31<<1;r33=(r31|0)<0?r35^517762881:r35;r35=r33<<1;r31=(r33|0)<0?r35^517762881:r35;r35=r31<<1;r33=(r31|0)<0?r35^517762881:r35;r35=r33<<1;HEAP32[60392+(r12<<2)>>2]=(r33|0)<0?r35^517762881:r35;r35=r12+1|0;if(r35>>>0<256){r12=r35}else{break}}HEAP32[60384>>2]=1;r47=r25;r48=r29;r49=r28}else{r47=r25;r48=r29;r49=r28}while(1){r12=HEAP32[60392+((HEAPU8[r49]^r48>>>24)<<2)>>2]^r48<<8;r35=r47-1|0;if((r35|0)==0){r46=r12;break}else{r47=r35;r48=r12;r49=r49+1|0}}}if((r25|0)==(r30|0)){r50=r46}else{r28=r30-r25|0;r12=r46;while(1){r35=r28>>>0<256?r28:256;if((_fread(r4,1,r35,r1)|0)!=(r35|0)){r21=1;r5=145;break L43}if((HEAP32[60384>>2]|0)==0){r33=0;while(1){r31=r33<<25;r36=(r33&128|0)!=0?r31^517762881:r31;r31=r36<<1;r38=(r36|0)<0?r31^517762881:r31;r31=r38<<1;r36=(r38|0)<0?r31^517762881:r31;r31=r36<<1;r38=(r36|0)<0?r31^517762881:r31;r31=r38<<1;r36=(r38|0)<0?r31^517762881:r31;r31=r36<<1;r38=(r36|0)<0?r31^517762881:r31;r31=r38<<1;r36=(r38|0)<0?r31^517762881:r31;r31=r36<<1;HEAP32[60392+(r33<<2)>>2]=(r36|0)<0?r31^517762881:r31;r31=r33+1|0;if(r31>>>0<256){r33=r31}else{break}}HEAP32[60384>>2]=1}if((r35|0)==0){r51=r12}else{r33=r35;r10=r12;r31=r4;while(1){r36=HEAP32[60392+((HEAPU8[r31]^r10>>>24)<<2)>>2]^r10<<8;r38=r33-1|0;if((r38|0)==0){r51=r36;break}else{r33=r38;r10=r36;r31=r31+1|0}}}if((r28|0)==(r35|0)){r50=r51;break}else{r28=r28-r35|0;r12=r51}}}if((_fread(r4,1,4,r1)|0)!=4){r21=1;r5=145;break L43}if((_psi_get_uint32_be(r4,0)|0)!=(r50|0)){r5=96;break L43}}else{if((r30|0)==0){r52=r29}else{r12=r30;r28=r29;while(1){r25=r12>>>0<256?r12:256;if((_fread(r4,1,r25,r1)|0)!=(r25|0)){r21=1;r5=145;break L43}if((HEAP32[60384>>2]|0)==0){r31=0;while(1){r10=r31<<25;r33=(r31&128|0)!=0?r10^517762881:r10;r10=r33<<1;r36=(r33|0)<0?r10^517762881:r10;r10=r36<<1;r33=(r36|0)<0?r10^517762881:r10;r10=r33<<1;r36=(r33|0)<0?r10^517762881:r10;r10=r36<<1;r33=(r36|0)<0?r10^517762881:r10;r10=r33<<1;r36=(r33|0)<0?r10^517762881:r10;r10=r36<<1;r33=(r36|0)<0?r10^517762881:r10;r10=r33<<1;HEAP32[60392+(r31<<2)>>2]=(r33|0)<0?r10^517762881:r10;r10=r31+1|0;if(r10>>>0<256){r31=r10}else{break}}HEAP32[60384>>2]=1}if((r25|0)==0){r53=r28}else{r31=r25;r35=r28;r10=r4;while(1){r33=HEAP32[60392+((HEAPU8[r10]^r35>>>24)<<2)>>2]^r35<<8;r36=r31-1|0;if((r36|0)==0){r53=r33;break}else{r31=r36;r35=r33;r10=r10+1|0}}}if((r12|0)==(r25|0)){r52=r53;break}else{r12=r12-r25|0;r28=r53}}}if((_fread(r4,1,4,r1)|0)!=4){r21=1;r5=145;break L43}if((_psi_get_uint32_be(r4,0)|0)!=(r52|0)){r5=144;break L43}}}while(0);if((_fread(r13,1,8,r1)|0)!=8){r21=1;r5=145;break L43}}if(r30>>>0<18){r21=1;r5=145;break}if((_fread(r27,1,18,r1)|0)!=18){r21=1;r5=145;break}if((HEAP32[60384>>2]|0)==0){r24=0;while(1){r11=r24<<25;r23=(r24&128|0)!=0?r11^517762881:r11;r11=r23<<1;r28=(r23|0)<0?r11^517762881:r11;r11=r28<<1;r23=(r28|0)<0?r11^517762881:r11;r11=r23<<1;r28=(r23|0)<0?r11^517762881:r11;r11=r28<<1;r23=(r28|0)<0?r11^517762881:r11;r11=r23<<1;r28=(r23|0)<0?r11^517762881:r11;r11=r28<<1;r23=(r28|0)<0?r11^517762881:r11;r11=r23<<1;HEAP32[60392+(r24<<2)>>2]=(r23|0)<0?r11^517762881:r11;r11=r24+1|0;if(r11>>>0<256){r24=r11}else{break}}HEAP32[60384>>2]=1;r54=18;r55=r29;r56=r27}else{r54=18;r55=r29;r56=r27}while(1){r57=HEAP32[60392+((HEAPU8[r56]^r55>>>24)<<2)>>2]^r55<<8;r24=r54-1|0;if((r24|0)==0){break}else{r54=r24;r55=r57;r56=r56+1|0}}r24=_psi_get_uint16_be(r27,0);r11=_psi_get_uint16_be(r27,2);r23=_psi_get_uint16_be(r27,4);r28=_psi_get_uint16_be(r27,6);r12=_psi_get_uint16_be(r27,8);r10=_psi_get_uint16_be(r27,10);r35=HEAP8[r20];r31=_psi_get_uint16_be(r27,14);r33=_psi_get_uint16_be(r27,16);r58=_psi_sct_new(r23,r28,r12,r10);if((r58|0)==0){r21=1;r5=145;break}if((r31&1|0)!=0){r10=r58+12|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1}if((r31&2|0)!=0){r10=r58+12|0;HEAP32[r10>>2]=HEAP32[r10>>2]|2}if((r31&4|0)!=0){r10=r58+12|0;HEAP32[r10>>2]=HEAP32[r10>>2]|4}if((r31&8|0)!=0){r10=r58+12|0;HEAP32[r10>>2]=HEAP32[r10>>2]|8}_psi_sct_set_encoding(r58,r33);r10=r33&4095;if((r10|0)==1|(r10|0)==2){_psi_sct_set_mfm_size(r58,r35)}else if((r10|0)==3){_psi_sct_set_gcr_format(r58,r35)}if((r31&16384|0)==0){if((_psi_img_add_sector(r2,r58,r24,r11)|0)!=0){r5=62;break}}else{if(r22){r5=59;break}_psi_sct_add_alternate(r9,r58)}r11=r30-18|0;if((r31&32768|0)!=0){_psi_sct_fill(r58,HEAPU8[r6])}if((r11|0)==0){r59=r57}else{r31=r11;r11=r57;while(1){r24=r31>>>0<256?r31:256;if((_fread(r4,1,r24,r1)|0)!=(r24|0)){r21=1;r5=145;break L43}if((HEAP32[60384>>2]|0)==0){r35=0;while(1){r10=r35<<25;r33=(r35&128|0)!=0?r10^517762881:r10;r10=r33<<1;r12=(r33|0)<0?r10^517762881:r10;r10=r12<<1;r33=(r12|0)<0?r10^517762881:r10;r10=r33<<1;r12=(r33|0)<0?r10^517762881:r10;r10=r12<<1;r33=(r12|0)<0?r10^517762881:r10;r10=r33<<1;r12=(r33|0)<0?r10^517762881:r10;r10=r12<<1;r33=(r12|0)<0?r10^517762881:r10;r10=r33<<1;HEAP32[60392+(r35<<2)>>2]=(r33|0)<0?r10^517762881:r10;r10=r35+1|0;if(r10>>>0<256){r35=r10}else{break}}HEAP32[60384>>2]=1}if((r24|0)==0){r60=r11}else{r35=r24;r10=r11;r33=r4;while(1){r12=HEAP32[60392+((HEAPU8[r33]^r10>>>24)<<2)>>2]^r10<<8;r28=r35-1|0;if((r28|0)==0){r60=r12;break}else{r35=r28;r10=r12;r33=r33+1|0}}}if((r31|0)==(r24|0)){r59=r60;break}else{r31=r31-r24|0;r11=r60}}}if((_fread(r4,1,4,r1)|0)!=4){r21=1;r5=145;break}if((_psi_get_uint32_be(r4,0)|0)==(r59|0)){r9=r58}else{r5=77;break}}if(r5==27){L206:do{if((r30|0)==0){r61=r29}else{r9=r30;r59=r29;while(1){r60=r9>>>0<256?r9:256;if((_fread(r4,1,r60,r1)|0)!=(r60|0)){r21=1;break}if((HEAP32[60384>>2]|0)==0){r57=0;while(1){r6=r57<<25;r27=(r57&128|0)!=0?r6^517762881:r6;r6=r27<<1;r20=(r27|0)<0?r6^517762881:r6;r6=r20<<1;r27=(r20|0)<0?r6^517762881:r6;r6=r27<<1;r20=(r27|0)<0?r6^517762881:r6;r6=r20<<1;r27=(r20|0)<0?r6^517762881:r6;r6=r27<<1;r20=(r27|0)<0?r6^517762881:r6;r6=r20<<1;r27=(r20|0)<0?r6^517762881:r6;r6=r27<<1;HEAP32[60392+(r57<<2)>>2]=(r27|0)<0?r6^517762881:r6;r6=r57+1|0;if(r6>>>0<256){r57=r6}else{break}}HEAP32[60384>>2]=1}if((r60|0)==0){r62=r59}else{r57=r60;r24=r59;r6=r4;while(1){r27=HEAP32[60392+((HEAPU8[r6]^r24>>>24)<<2)>>2]^r24<<8;r20=r57-1|0;if((r20|0)==0){r62=r27;break}else{r57=r20;r24=r27;r6=r6+1|0}}}if((r9|0)==(r60|0)){r61=r62;break L206}else{r9=r9-r60|0;r59=r62}}STACKTOP=r7;return r21}}while(0);if((_fread(r4,1,4,r1)|0)!=4){r21=1;STACKTOP=r7;return r21}if((_psi_get_uint32_be(r4,0)|0)==(r61|0)){_psi_img_clean_comment(r2);r21=0;STACKTOP=r7;return r21}else{_fwrite(52816,16,1,r8);r21=1;STACKTOP=r7;return r21}}else if(r5==59){_fwrite(56576,32,1,r8);_psi_sct_del(r58);r21=1;STACKTOP=r7;return r21}else if(r5==62){_psi_sct_del(r58);r21=1;STACKTOP=r7;return r21}else if(r5==77){_fwrite(52816,16,1,r8);r21=1;STACKTOP=r7;return r21}else if(r5==96){_fwrite(52816,16,1,r8);r21=1;STACKTOP=r7;return r21}else if(r5==115){_fwrite(52816,16,1,r8);r21=1;STACKTOP=r7;return r21}else if(r5==119){_fwrite(52816,16,1,r8);r21=1;STACKTOP=r7;return r21}else if(r5==126){_free(r39);r21=1;STACKTOP=r7;return r21}else if(r5==144){_fwrite(52816,16,1,r8);r21=1;STACKTOP=r7;return r21}else if(r5==145){STACKTOP=r7;return r21}}function _pfdc4_save_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=r4+40|0;_psi_set_uint16_be(r9,0,4);_psi_set_uint16_be(r9,2,0);if((_pfdc4_save_chunk(r1,1346782275,4,r9)|0)!=0){r10=1;STACKTOP=r4;return r10}r9=r8|0;r11=r2+8|0;if((HEAP32[r11>>2]|0)!=0){_psi_set_uint32_be(r9,0,1413830740);_psi_set_uint32_be(r9,4,HEAP32[r11>>2]+2|0);r12=r8+8|0;HEAP8[r12]=10;HEAP32[r7>>2]=0;r8=_pfdc4_write(r1,r9,9,r7);r13=_pfdc4_write(r1,HEAP32[r2+12>>2],HEAP32[r11>>2],r7)|r8;r8=r13|_pfdc4_write(r1,r12,1,r7);_psi_set_uint32_be(r9,0,HEAP32[r7>>2]);if((r8|(_fwrite(r9,1,4,r1)|0)!=4|0)!=0){r10=1;STACKTOP=r4;return r10}}r9=r2|0;r8=HEAP16[r9>>1];L8:do{if(r8<<16>>16!=0){r7=r2+4|0;r12=0;r13=r8;L10:while(1){r11=HEAP32[HEAP32[r7>>2]+(r12<<2)>>2];r14=r11+2|0;r15=HEAP16[r14>>1];if(r15<<16>>16==0){r16=r13}else{r17=r11+4|0;r11=0;r18=r15;while(1){r15=HEAP32[HEAP32[r17>>2]+(r11<<2)>>2];r19=r15+2|0;if((HEAP16[r19>>1]|0)==0){r20=r18}else{r21=r15+4|0;r15=0;while(1){r22=HEAP32[HEAP32[r21>>2]+(r15<<2)>>2];if((_pfdc4_save_sector(r1,r22,r12,r11,0)|0)==0){r23=r22}else{r10=1;r3=21;break L10}while(1){r22=HEAP32[r23>>2];if((r22|0)==0){break}if((_pfdc4_save_sector(r1,r22,r12,r11,1)|0)==0){r23=r22}else{r10=1;r3=21;break L10}}r22=r15+1|0;if(r22>>>0<HEAPU16[r19>>1]>>>0){r15=r22}else{break}}r20=HEAP16[r14>>1]}r15=r11+1|0;if(r15>>>0<(r20&65535)>>>0){r11=r15;r18=r20}else{break}}r16=HEAP16[r9>>1]}r18=r12+1|0;if(r18>>>0<(r16&65535)>>>0){r12=r18;r13=r16}else{break L8}}if(r3==21){STACKTOP=r4;return r10}}}while(0);r3=r6|0;_psi_set_uint32_be(r3,0,1162757152);_psi_set_uint32_be(r3,4,0);HEAP32[r5>>2]=0;if((_pfdc4_write(r1,r3,8,r5)|0)!=0){r10=1;STACKTOP=r4;return r10}_psi_set_uint32_be(r3,0,HEAP32[r5>>2]);if((_fwrite(r3,1,4,r1)|0)!=4){r10=1;STACKTOP=r4;return r10}_fflush(r1);r10=0;STACKTOP=r4;return r10}function _pfdc4_save_chunk(r1,r2,r3,r4){var r5,r6,r7,r8;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8|0;_psi_set_uint32_be(r7,0,r2);_psi_set_uint32_be(r7,4,r3);HEAP32[r6>>2]=0;if((_pfdc4_write(r1,r7,8,r6)|0)!=0){r8=1;STACKTOP=r5;return r8}if((r3|0)!=0?(_pfdc4_write(r1,r4,r3,r6)|0)!=0:0){r8=1;STACKTOP=r5;return r8}_psi_set_uint32_be(r7,0,HEAP32[r6>>2]);r8=(_fwrite(r7,1,4,r1)|0)!=4|0;STACKTOP=r5;return r8}function _pfdc4_write(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;if((r4|0)==0){r5=_fwrite(r2,1,r3,r1);r6=(r5|0)!=(r3|0);r7=r6&1;return r7}r8=HEAP32[r4>>2];if((HEAP32[60384>>2]|0)==0){r9=0;while(1){r10=r9<<25;r11=(r9&128|0)!=0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;HEAP32[60392+(r9<<2)>>2]=(r11|0)<0?r10^517762881:r10;r10=r9+1|0;if(r10>>>0<256){r9=r10}else{break}}HEAP32[60384>>2]=1}if((r3|0)==0){r13=r8}else{r9=r3;r10=r8;r8=r2;while(1){r11=HEAP32[60392+((HEAPU8[r8]^r10>>>24)<<2)>>2]^r10<<8;r12=r9-1|0;if((r12|0)==0){r13=r11;break}else{r9=r12;r10=r11;r8=r8+1|0}}}HEAP32[r4>>2]=r13;r5=_fwrite(r2,1,r3,r1);r6=(r5|0)!=(r3|0);r7=r6&1;return r7}function _pfdc4_save_sector(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14;r6=STACKTOP;STACKTOP=STACKTOP+256|0;r7=r6;r8=r7|0;r9=HEAP32[r2+12>>2]&15;r10=r2+10|0;if((_psi_sct_uniform(r2)|0)==0){r11=r9}else{r11=(HEAP16[r10>>1]|0)==0?r9:r9|32768}r9=(r5|0)==0?r11:r11|16384;_psi_set_uint16_be(r8,0,r3);_psi_set_uint16_be(r8,2,r4);_psi_set_uint16_be(r8,4,HEAPU16[r2+4>>1]);_psi_set_uint16_be(r8,6,HEAPU16[r2+6>>1]);_psi_set_uint16_be(r8,8,HEAPU16[r2+8>>1]);_psi_set_uint16_be(r8,10,HEAPU16[r10>>1]);_psi_set_uint16_be(r8,12,0);_psi_set_uint16_be(r8,14,r9);r4=r2+16|0;_psi_set_uint16_be(r8,16,HEAPU16[r4>>1]);if((r9&32768|0)!=0){HEAP8[r7+13|0]=HEAP8[HEAP32[r2+24>>2]]}r3=HEAP16[r4>>1]&4095;if((r3|0)==1|(r3|0)==2){HEAP8[r7+12|0]=_psi_sct_get_mfm_size(r2)}else if((r3|0)==3){HEAP8[r7+12|0]=_psi_sct_get_gcr_format(r2)}if((_pfdc4_save_chunk(r1,1397048148,18,r8)|0)!=0){r12=1;r13=256;r14=0;STACKTOP=r6;return r12}r3=_psi_sct_get_tags(r2,r8,256);L14:do{if((r3|0)!=0){r4=0;while(1){r11=r4+1|0;if((HEAP8[r7+r4|0]|0)!=0){break}if(r11>>>0<r3>>>0){r4=r11}else{break L14}}if((_pfdc4_save_chunk(r1,1413564243,r3,r8)|0)!=0){r12=1;r13=256;r14=0;STACKTOP=r6;return r12}}}while(0);if((r9&32776|0)==0){r9=HEAP16[r10>>1];if(r9<<16>>16!=0?(_pfdc4_save_chunk(r1,1145132097,r9&65535,HEAP32[r2+24>>2])|0)!=0:0){r12=1;r13=256;r14=0;STACKTOP=r6;return r12}}r12=0;r13=256;r14=0;STACKTOP=r6;return r12}function _psi_load_psi(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562,r563,r564,r565,r566,r567,r568,r569,r570,r571,r572,r573,r574,r575,r576,r577,r578,r579,r580,r581,r582,r583,r584,r585,r586,r587,r588,r589,r590,r591,r592,r593,r594,r595,r596,r597,r598,r599,r600,r601,r602,r603,r604,r605,r606,r607,r608,r609,r610,r611,r612,r613,r614,r615,r616,r617,r618,r619,r620,r621,r622,r623,r624,r625,r626,r627,r628,r629,r630,r631,r632,r633,r634,r635,r636,r637,r638,r639,r640,r641,r642,r643,r644,r645,r646,r647,r648,r649,r650,r651,r652,r653,r654,r655,r656,r657,r658,r659,r660,r661,r662,r663,r664,r665,r666,r667,r668,r669,r670,r671,r672,r673,r674,r675,r676,r677,r678,r679,r680,r681,r682,r683,r684,r685,r686,r687,r688,r689,r690,r691,r692,r693,r694,r695,r696,r697,r698,r699,r700,r701,r702,r703,r704,r705,r706,r707,r708,r709,r710,r711,r712,r713,r714,r715,r716,r717,r718,r719,r720,r721,r722,r723,r724,r725,r726,r727,r728,r729,r730,r731,r732,r733,r734,r735,r736,r737,r738,r739,r740,r741,r742,r743,r744,r745,r746,r747,r748,r749,r750,r751,r752,r753,r754,r755,r756,r757,r758,r759,r760,r761,r762,r763,r764,r765,r766,r767,r768,r769,r770,r771,r772,r773,r774,r775,r776,r777,r778,r779,r780,r781,r782,r783,r784,r785,r786,r787,r788,r789,r790,r791,r792,r793,r794,r795,r796,r797,r798,r799,r800,r801,r802,r803,r804,r805,r806,r807,r808,r809,r810,r811,r812,r813,r814,r815,r816,r817,r818,r819,r820,r821,r822,r823,r824,r825,r826,r827,r828,r829,r830,r831,r832,r833,r834,r835,r836,r837,r838,r839,r840,r841,r842,r843,r844,r845,r846,r847,r848,r849,r850,r851,r852,r853,r854,r855,r856,r857,r858,r859,r860,r861,r862,r863,r864,r865,r866,r867,r868,r869,r870,r871,r872,r873,r874,r875,r876,r877,r878,r879,r880,r881,r882,r883,r884,r885,r886,r887,r888,r889,r890,r891,r892,r893,r894,r895,r896,r897,r898,r899,r900,r901,r902,r903,r904,r905,r906,r907,r908,r909,r910,r911,r912,r913,r914,r915,r916,r917,r918,r919,r920,r921,r922,r923,r924,r925,r926,r927,r928,r929,r930,r931,r932,r933,r934,r935,r936,r937,r938,r939,r940,r941,r942,r943,r944,r945,r946,r947,r948,r949,r950,r951,r952,r953,r954,r955,r956,r957,r958,r959,r960,r961,r962,r963,r964,r965,r966,r967,r968,r969,r970,r971,r972,r973,r974,r975,r976,r977,r978,r979,r980,r981,r982,r983,r984,r985,r986,r987,r988,r989,r990,r991,r992,r993,r994,r995,r996,r997,r998,r999,r1000,r1001,r1002,r1003,r1004,r1005,r1006,r1007,r1008,r1009,r1010,r1011,r1012,r1013,r1014,r1015,r1016,r1017,r1018,r1019,r1020,r1021,r1022,r1023,r1024,r1025,r1026,r1027,r1028,r1029,r1030,r1031,r1032,r1033,r1034,r1035,r1036,r1037,r1038,r1039,r1040,r1041,r1042,r1043,r1044,r1045,r1046,r1047,r1048,r1049,r1050,r1051,r1052,r1053,r1054,r1055,r1056,r1057,r1058,r1059,r1060,r1061,r1062,r1063,r1064,r1065,r1066,r1067,r1068,r1069,r1070,r1071,r1072,r1073,r1074,r1075,r1076,r1077,r1078,r1079,r1080,r1081,r1082,r1083,r1084,r1085,r1086,r1087,r1088,r1089,r1090,r1091,r1092,r1093,r1094,r1095,r1096,r1097,r1098,r1099,r1100,r1101,r1102,r1103,r1104,r1105,r1106,r1107,r1108,r1109,r1110,r1111,r1112,r1113,r1114,r1115,r1116,r1117,r1118,r1119,r1120,r1121,r1122,r1123,r1124,r1125,r1126,r1127,r1128,r1129,r1130,r1131,r1132,r1133,r1134,r1135,r1136,r1137,r1138,r1139,r1140,r1141,r1142,r1143,r1144,r1145,r1146,r1147,r1148,r1149,r1150,r1151,r1152,r1153,r1154,r1155,r1156,r1157,r1158,r1159,r1160,r1161,r1162,r1163,r1164,r1165,r1166,r1167,r1168,r1169,r1170,r1171,r1172,r1173,r1174,r1175,r1176,r1177,r1178,r1179,r1180,r1181,r1182,r1183,r1184,r1185,r1186,r1187,r1188,r1189,r1190,r1191,r1192,r1193,r1194,r1195,r1196,r1197,r1198,r1199,r1200,r1201,r1202,r1203,r1204,r1205,r1206,r1207,r1208,r1209,r1210,r1211,r1212,r1213,r1214,r1215,r1216,r1217,r1218,r1219,r1220,r1221,r1222,r1223,r1224,r1225,r1226,r1227,r1228,r1229,r1230,r1231,r1232,r1233,r1234,r1235,r1236,r1237,r1238,r1239,r1240,r1241,r1242,r1243,r1244,r1245,r1246,r1247,r1248,r1249,r1250,r1251,r1252,r1253,r1254,r1255,r1256,r1257,r1258,r1259,r1260,r1261,r1262,r1263,r1264,r1265,r1266,r1267,r1268,r1269,r1270,r1271,r1272,r1273,r1274,r1275,r1276,r1277,r1278,r1279,r1280,r1281,r1282,r1283,r1284,r1285,r1286,r1287,r1288,r1289,r1290,r1291,r1292,r1293,r1294,r1295,r1296,r1297,r1298,r1299,r1300,r1301,r1302,r1303,r1304,r1305,r1306,r1307,r1308,r1309,r1310,r1311,r1312,r1313,r1314,r1315,r1316,r1317,r1318,r1319,r1320,r1321,r1322,r1323,r1324,r1325,r1326,r1327,r1328,r1329,r1330,r1331,r1332,r1333,r1334,r1335,r1336,r1337,r1338,r1339,r1340,r1341,r1342,r1343,r1344,r1345,r1346,r1347,r1348,r1349,r1350,r1351,r1352,r1353,r1354,r1355,r1356,r1357,r1358,r1359,r1360,r1361,r1362,r1363,r1364,r1365,r1366,r1367,r1368,r1369,r1370,r1371,r1372,r1373,r1374,r1375,r1376,r1377,r1378,r1379,r1380,r1381,r1382,r1383,r1384,r1385,r1386,r1387,r1388,r1389,r1390,r1391,r1392,r1393,r1394,r1395,r1396,r1397,r1398,r1399,r1400,r1401,r1402,r1403,r1404,r1405,r1406,r1407,r1408,r1409,r1410,r1411,r1412,r1413,r1414,r1415,r1416,r1417,r1418,r1419,r1420,r1421,r1422,r1423,r1424,r1425,r1426,r1427,r1428,r1429,r1430,r1431,r1432,r1433,r1434,r1435,r1436,r1437,r1438,r1439,r1440,r1441,r1442,r1443,r1444,r1445,r1446,r1447,r1448,r1449,r1450,r1451,r1452,r1453,r1454,r1455,r1456,r1457,r1458,r1459,r1460,r1461,r1462,r1463,r1464,r1465,r1466,r1467,r1468,r1469,r1470,r1471,r1472,r1473,r1474,r1475,r1476,r1477,r1478,r1479,r1480,r1481,r1482,r1483,r1484,r1485,r1486,r1487,r1488,r1489,r1490,r1491,r1492,r1493,r1494,r1495,r1496,r1497,r1498,r1499,r1500,r1501,r1502,r1503,r1504,r1505,r1506,r1507,r1508,r1509,r1510,r1511,r1512,r1513,r1514,r1515,r1516,r1517,r1518,r1519,r1520,r1521,r1522,r1523,r1524,r1525,r1526,r1527,r1528,r1529,r1530,r1531,r1532,r1533,r1534,r1535,r1536,r1537,r1538,r1539,r1540,r1541,r1542,r1543,r1544,r1545,r1546,r1547,r1548,r1549,r1550,r1551,r1552,r1553,r1554,r1555,r1556,r1557,r1558,r1559,r1560,r1561,r1562,r1563,r1564,r1565,r1566,r1567,r1568,r1569,r1570,r1571,r1572,r1573,r1574,r1575,r1576,r1577,r1578,r1579,r1580,r1581,r1582,r1583,r1584,r1585,r1586,r1587,r1588,r1589,r1590,r1591,r1592,r1593,r1594,r1595,r1596,r1597,r1598,r1599,r1600,r1601,r1602,r1603,r1604,r1605,r1606,r1607,r1608,r1609,r1610,r1611,r1612,r1613,r1614,r1615,r1616,r1617,r1618,r1619,r1620,r1621,r1622,r1623,r1624,r1625,r1626,r1627,r1628,r1629,r1630,r1631,r1632,r1633,r1634,r1635,r1636,r1637,r1638,r1639,r1640,r1641,r1642,r1643,r1644,r1645,r1646,r1647,r1648,r1649,r1650,r1651,r1652,r1653,r1654,r1655,r1656,r1657,r1658,r1659,r1660,r1661,r1662,r1663,r1664,r1665,r1666,r1667,r1668,r1669,r1670,r1671,r1672,r1673,r1674,r1675,r1676,r1677,r1678,r1679,r1680,r1681,r1682,r1683,r1684,r1685,r1686,r1687,r1688,r1689,r1690,r1691,r1692,r1693,r1694,r1695,r1696,r1697,r1698,r1699,r1700,r1701,r1702,r1703,r1704,r1705,r1706,r1707,r1708,r1709,r1710,r1711,r1712,r1713,r1714,r1715,r1716,r1717,r1718,r1719,r1720,r1721,r1722,r1723,r1724,r1725,r1726,r1727,r1728,r1729,r1730,r1731,r1732,r1733,r1734,r1735,r1736,r1737,r1738,r1739,r1740,r1741,r1742,r1743,r1744,r1745,r1746,r1747,r1748,r1749,r1750,r1751,r1752,r1753,r1754,r1755,r1756,r1757,r1758,r1759,r1760,r1761,r1762,r1763,r1764,r1765,r1766,r1767,r1768,r1769,r1770,r1771,r1772,r1773,r1774,r1775,r1776;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+304|0;r5=r4;r6=r4+8;r7=r4+32;r8=r4+288;r9=r4+296;r10=_psi_img_new();r11=(r10|0)==0;if(r11){r12=0;STACKTOP=r4;return r12}r13=r9|0;r14=8;r15=0;r16=_fread(r13,1,8,r1);r17=(r16|0)==8;L4:do{if(r17){r18=HEAP32[58320>>2];r19=(r18|0)==0;if(r19){r20=0;while(1){r21=r20&128;r22=(r21|0)!=0;r23=r20<<25;r24=r23^517762881;r25=r22?r24:r23;r26=(r25|0)<0;r27=r25<<1;r28=r27^517762881;r29=r26?r28:r27;r30=(r29|0)<0;r31=r29<<1;r32=r31^517762881;r33=r30?r32:r31;r34=(r33|0)<0;r35=r33<<1;r36=r35^517762881;r37=r34?r36:r35;r38=(r37|0)<0;r39=r37<<1;r40=r39^517762881;r41=r38?r40:r39;r42=(r41|0)<0;r43=r41<<1;r44=r43^517762881;r45=r42?r44:r43;r46=(r45|0)<0;r47=r45<<1;r48=r47^517762881;r49=r46?r48:r47;r50=(r49|0)<0;r51=r49<<1;r52=r51^517762881;r53=r50?r52:r51;r54=58328+(r20<<2)|0;HEAP32[r54>>2]=r53;r55=r20+1|0;r56=r55>>>0<256;if(r56){r20=r55}else{break}}HEAP32[58320>>2]=1}r57=r9+1|0;r58=HEAP8[r13];r59=r58&255;r60=58328+(r59<<2)|0;r61=HEAP32[r60>>2];r62=r61>>>24;r63=r9+2|0;r64=HEAP8[r57];r65=r64&255;r66=r65^r62;r67=r61<<8;r68=58328+(r66<<2)|0;r69=HEAP32[r68>>2];r70=r69^r67;r71=r70>>>24;r72=r9+3|0;r73=HEAP8[r63];r74=r73&255;r75=r74^r71;r76=r70<<8;r77=58328+(r75<<2)|0;r78=HEAP32[r77>>2];r79=r78^r76;r80=r79>>>24;r81=r9+4|0;r82=HEAP8[r72];r83=r82&255;r84=r83^r80;r85=r79<<8;r86=58328+(r84<<2)|0;r87=HEAP32[r86>>2];r88=r87^r85;r89=r88>>>24;r90=r9+5|0;r91=HEAP8[r81];r92=r91&255;r93=r92^r89;r94=r88<<8;r95=58328+(r93<<2)|0;r96=HEAP32[r95>>2];r97=r96^r94;r98=r97>>>24;r99=r9+6|0;r100=HEAP8[r90];r101=r100&255;r102=r101^r98;r103=r97<<8;r104=58328+(r102<<2)|0;r105=HEAP32[r104>>2];r106=r105^r103;r107=r106>>>24;r108=r9+7|0;r109=HEAP8[r99];r110=r109&255;r111=r110^r107;r112=r106<<8;r113=58328+(r111<<2)|0;r114=HEAP32[r113>>2];r115=r114^r112;r116=r115>>>24;r117=HEAP8[r108];r118=r117&255;r119=r118^r116;r120=r115<<8;r121=58328+(r119<<2)|0;r122=HEAP32[r121>>2];r123=r122^r120;r124=_psi_get_uint32_be(r13,0);r125=_psi_get_uint32_be(r13,4);r126=(r124|0)==1347635488;if(r126){r127=r8|0;r128=8;r129=0;r130=r125>>>0<4;if(!r130){r131=_fread(r127,1,4,r1);r132=(r131|0)==4;if(r132){r133=HEAP32[58320>>2];r134=(r133|0)==0;if(r134){r135=0;while(1){r136=r135&128;r137=(r136|0)!=0;r138=r135<<25;r139=r138^517762881;r140=r137?r139:r138;r141=(r140|0)<0;r142=r140<<1;r143=r142^517762881;r144=r141?r143:r142;r145=(r144|0)<0;r146=r144<<1;r147=r146^517762881;r148=r145?r147:r146;r149=(r148|0)<0;r150=r148<<1;r151=r150^517762881;r152=r149?r151:r150;r153=(r152|0)<0;r154=r152<<1;r155=r154^517762881;r156=r153?r155:r154;r157=(r156|0)<0;r158=r156<<1;r159=r158^517762881;r160=r157?r159:r158;r161=(r160|0)<0;r162=r160<<1;r163=r162^517762881;r164=r161?r163:r162;r165=(r164|0)<0;r166=r164<<1;r167=r166^517762881;r168=r165?r167:r166;r169=58328+(r135<<2)|0;HEAP32[r169>>2]=r168;r170=r135+1|0;r171=r170>>>0<256;if(r171){r135=r170}else{break}}HEAP32[58320>>2]=1}r172=r123>>>24;r173=r8+1|0;r174=HEAP8[r127];r175=r174&255;r176=r175^r172;r177=r123<<8;r178=58328+(r176<<2)|0;r179=HEAP32[r178>>2];r180=r179^r177;r181=r180>>>24;r182=r8+2|0;r183=HEAP8[r173];r184=r183&255;r185=r184^r181;r186=r180<<8;r187=58328+(r185<<2)|0;r188=HEAP32[r187>>2];r189=r188^r186;r190=r189>>>24;r191=r8+3|0;r192=HEAP8[r182];r193=r192&255;r194=r193^r190;r195=r189<<8;r196=58328+(r194<<2)|0;r197=HEAP32[r196>>2];r198=r197^r195;r199=r198>>>24;r200=HEAP8[r191];r201=r200&255;r202=r201^r199;r203=r198<<8;r204=58328+(r202<<2)|0;r205=HEAP32[r204>>2];r206=r205^r203;r207=_psi_get_uint16_be(r127,0);r208=(r207|0)==0;if(!r208){r209=HEAP32[_stderr>>2];r210=_fprintf(r209,46120,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r207,r3));STACKTOP=r3;break}r211=_psi_get_uint16_be(r127,2);switch(r211|0){case 256:{r212=1;break};case 257:{r212=32769;break};case 513:{r212=32770;break};case 768:{r212=3;break};case 514:{r212=16386;break};case 512:{r212=2;break};default:{r212=0}}r213=r125-4|0;r214=r7|0;r215=256;r216=0;r217=(r213|0)==0;if(r217){r218=r206}else{r219=r213;r220=r206;while(1){r221=r219>>>0<256;r222=r221?r219:256;r223=_fread(r214,1,r222,r1);r224=(r223|0)==(r222|0);if(!r224){break L4}r225=HEAP32[58320>>2];r226=(r225|0)==0;if(r226){r227=0;while(1){r228=r227&128;r229=(r228|0)!=0;r230=r227<<25;r231=r230^517762881;r232=r229?r231:r230;r233=(r232|0)<0;r234=r232<<1;r235=r234^517762881;r236=r233?r235:r234;r237=(r236|0)<0;r238=r236<<1;r239=r238^517762881;r240=r237?r239:r238;r241=(r240|0)<0;r242=r240<<1;r243=r242^517762881;r244=r241?r243:r242;r245=(r244|0)<0;r246=r244<<1;r247=r246^517762881;r248=r245?r247:r246;r249=(r248|0)<0;r250=r248<<1;r251=r250^517762881;r252=r249?r251:r250;r253=(r252|0)<0;r254=r252<<1;r255=r254^517762881;r256=r253?r255:r254;r257=(r256|0)<0;r258=r256<<1;r259=r258^517762881;r260=r257?r259:r258;r261=58328+(r227<<2)|0;HEAP32[r261>>2]=r260;r262=r227+1|0;r263=r262>>>0<256;if(r263){r227=r262}else{break}}HEAP32[58320>>2]=1}r264=(r222|0)==0;if(r264){r265=r220}else{r266=r222;r267=r220;r268=r214;while(1){r269=r267>>>24;r270=r268+1|0;r271=HEAP8[r268];r272=r271&255;r273=r272^r269;r274=r267<<8;r275=58328+(r273<<2)|0;r276=HEAP32[r275>>2];r277=r276^r274;r278=r266-1|0;r279=(r278|0)==0;if(r279){r265=r277;break}else{r266=r278;r267=r277;r268=r270}}}r280=r219-r222|0;r281=(r219|0)==(r222|0);if(r281){r218=r265;break}else{r219=r280;r220=r265}}}r282=_fread(r214,1,4,r1);r283=(r282|0)==4;if(r283){r284=_psi_get_uint32_be(r214,0);r285=(r284|0)==(r218|0);if(!r285){r286=HEAP32[_stderr>>2];r287=_fwrite(56560,15,1,r286);break}r288=_fread(r13,1,8,r1);r289=(r288|0)==8;if(r289){r290=r8+4|0;r291=r8+5|0;r292=r8+6|0;r293=r8+7|0;r294=r6|0;r295=r6+2|0;r296=r6+3|0;r297=r6+4|0;r298=r6+5|0;r299=r6+6|0;r300=r5|0;r301=r5+1|0;r302=r5+2|0;r303=r5+3|0;r304=HEAP32[_stderr>>2];r305=0;L49:while(1){r306=HEAP32[58320>>2];r307=(r306|0)==0;if(r307){r308=0;while(1){r309=r308&128;r310=(r309|0)!=0;r311=r308<<25;r312=r311^517762881;r313=r310?r312:r311;r314=(r313|0)<0;r315=r313<<1;r316=r315^517762881;r317=r314?r316:r315;r318=(r317|0)<0;r319=r317<<1;r320=r319^517762881;r321=r318?r320:r319;r322=(r321|0)<0;r323=r321<<1;r324=r323^517762881;r325=r322?r324:r323;r326=(r325|0)<0;r327=r325<<1;r328=r327^517762881;r329=r326?r328:r327;r330=(r329|0)<0;r331=r329<<1;r332=r331^517762881;r333=r330?r332:r331;r334=(r333|0)<0;r335=r333<<1;r336=r335^517762881;r337=r334?r336:r335;r338=(r337|0)<0;r339=r337<<1;r340=r339^517762881;r341=r338?r340:r339;r342=58328+(r308<<2)|0;HEAP32[r342>>2]=r341;r343=r308+1|0;r344=r343>>>0<256;if(r344){r308=r343}else{break}}HEAP32[58320>>2]=1}r345=HEAP8[r13];r346=r345&255;r347=58328+(r346<<2)|0;r348=HEAP32[r347>>2];r349=r348>>>24;r350=HEAP8[r57];r351=r350&255;r352=r351^r349;r353=r348<<8;r354=58328+(r352<<2)|0;r355=HEAP32[r354>>2];r356=r355^r353;r357=r356>>>24;r358=HEAP8[r63];r359=r358&255;r360=r359^r357;r361=r356<<8;r362=58328+(r360<<2)|0;r363=HEAP32[r362>>2];r364=r363^r361;r365=r364>>>24;r366=HEAP8[r72];r367=r366&255;r368=r367^r365;r369=r364<<8;r370=58328+(r368<<2)|0;r371=HEAP32[r370>>2];r372=r371^r369;r373=r372>>>24;r374=HEAP8[r81];r375=r374&255;r376=r375^r373;r377=r372<<8;r378=58328+(r376<<2)|0;r379=HEAP32[r378>>2];r380=r379^r377;r381=r380>>>24;r382=HEAP8[r90];r383=r382&255;r384=r383^r381;r385=r380<<8;r386=58328+(r384<<2)|0;r387=HEAP32[r386>>2];r388=r387^r385;r389=r388>>>24;r390=HEAP8[r99];r391=r390&255;r392=r391^r389;r393=r388<<8;r394=58328+(r392<<2)|0;r395=HEAP32[r394>>2];r396=r395^r393;r397=r396>>>24;r398=HEAP8[r108];r399=r398&255;r400=r399^r397;r401=r396<<8;r402=58328+(r400<<2)|0;r403=HEAP32[r402>>2];r404=r403^r401;r405=_psi_get_uint32_be(r13,0);r406=_psi_get_uint32_be(r13,4);do{if((r405|0)==1229081926){r407=8;r408=0;r409=(r305|0)==0;r410=r406>>>0<6;r411=r409|r410;if(r411){break L4}r412=_fread(r127,1,6,r1);r413=(r412|0)==6;if(!r413){break L4}r414=HEAP32[58320>>2];r415=(r414|0)==0;if(r415){r416=0;while(1){r417=r416&128;r418=(r417|0)!=0;r419=r416<<25;r420=r419^517762881;r421=r418?r420:r419;r422=(r421|0)<0;r423=r421<<1;r424=r423^517762881;r425=r422?r424:r423;r426=(r425|0)<0;r427=r425<<1;r428=r427^517762881;r429=r426?r428:r427;r430=(r429|0)<0;r431=r429<<1;r432=r431^517762881;r433=r430?r432:r431;r434=(r433|0)<0;r435=r433<<1;r436=r435^517762881;r437=r434?r436:r435;r438=(r437|0)<0;r439=r437<<1;r440=r439^517762881;r441=r438?r440:r439;r442=(r441|0)<0;r443=r441<<1;r444=r443^517762881;r445=r442?r444:r443;r446=(r445|0)<0;r447=r445<<1;r448=r447^517762881;r449=r446?r448:r447;r450=58328+(r416<<2)|0;HEAP32[r450>>2]=r449;r451=r416+1|0;r452=r451>>>0<256;if(r452){r416=r451}else{break}}HEAP32[58320>>2]=1}r453=r404>>>24;r454=HEAP8[r127];r455=r454&255;r456=r455^r453;r457=r404<<8;r458=58328+(r456<<2)|0;r459=HEAP32[r458>>2];r460=r459^r457;r461=r460>>>24;r462=HEAP8[r173];r463=r462&255;r464=r463^r461;r465=r460<<8;r466=58328+(r464<<2)|0;r467=HEAP32[r466>>2];r468=r467^r465;r469=r468>>>24;r470=HEAP8[r182];r471=r470&255;r472=r471^r469;r473=r468<<8;r474=58328+(r472<<2)|0;r475=HEAP32[r474>>2];r476=r475^r473;r477=r476>>>24;r478=HEAP8[r191];r479=r478&255;r480=r479^r477;r481=r476<<8;r482=58328+(r480<<2)|0;r483=HEAP32[r482>>2];r484=r483^r481;r485=r484>>>24;r486=HEAP8[r290];r487=r486&255;r488=r487^r485;r489=r484<<8;r490=58328+(r488<<2)|0;r491=HEAP32[r490>>2];r492=r491^r489;r493=r492>>>24;r494=HEAP8[r291];r495=r494&255;r496=r495^r493;r497=r492<<8;r498=58328+(r496<<2)|0;r499=HEAP32[r498>>2];r500=r499^r497;r501=r454&255;r502=r305+4|0;HEAP16[r502>>1]=r501;r503=r462&255;r504=r305+6|0;HEAP16[r504>>1]=r503;r505=r470&255;r506=r305+8|0;HEAP16[r506>>1]=r505;_psi_sct_set_mfm_size(r305,r478);r507=r486&1;r508=r507<<24>>24==0;if(!r508){r509=r305+12|0;r510=HEAP32[r509>>2];r511=r510|1;HEAP32[r509>>2]=r511}r512=r486&2;r513=r512<<24>>24==0;if(!r513){r514=r305+12|0;r515=HEAP32[r514>>2];r516=r515|2;HEAP32[r514>>2]=r516}r517=r486&4;r518=r517<<24>>24==0;if(!r518){r519=r305+12|0;r520=HEAP32[r519>>2];r521=r520|4;HEAP32[r519>>2]=r521}r522=r486&8;r523=r522<<24>>24==0;if(!r523){r524=r305+12|0;r525=HEAP32[r524>>2];r526=r525|8;HEAP32[r524>>2]=r526}r527=r494<<24>>24==1;if(r527){_psi_sct_set_encoding(r305,32769)}else{_psi_sct_set_encoding(r305,1)}r528=r406-6|0;r529=256;r530=0;r531=(r528|0)==0;if(r531){r532=r500}else{r533=r528;r534=r500;while(1){r535=r533>>>0<256;r536=r535?r533:256;r537=_fread(r214,1,r536,r1);r538=(r537|0)==(r536|0);if(!r538){break L4}r539=HEAP32[58320>>2];r540=(r539|0)==0;if(r540){r541=0;while(1){r542=r541&128;r543=(r542|0)!=0;r544=r541<<25;r545=r544^517762881;r546=r543?r545:r544;r547=(r546|0)<0;r548=r546<<1;r549=r548^517762881;r550=r547?r549:r548;r551=(r550|0)<0;r552=r550<<1;r553=r552^517762881;r554=r551?r553:r552;r555=(r554|0)<0;r556=r554<<1;r557=r556^517762881;r558=r555?r557:r556;r559=(r558|0)<0;r560=r558<<1;r561=r560^517762881;r562=r559?r561:r560;r563=(r562|0)<0;r564=r562<<1;r565=r564^517762881;r566=r563?r565:r564;r567=(r566|0)<0;r568=r566<<1;r569=r568^517762881;r570=r567?r569:r568;r571=(r570|0)<0;r572=r570<<1;r573=r572^517762881;r574=r571?r573:r572;r575=58328+(r541<<2)|0;HEAP32[r575>>2]=r574;r576=r541+1|0;r577=r576>>>0<256;if(r577){r541=r576}else{break}}HEAP32[58320>>2]=1}r578=(r536|0)==0;if(r578){r579=r534}else{r580=r536;r581=r534;r582=r214;while(1){r583=r581>>>24;r584=r582+1|0;r585=HEAP8[r582];r586=r585&255;r587=r586^r583;r588=r581<<8;r589=58328+(r587<<2)|0;r590=HEAP32[r589>>2];r591=r590^r588;r592=r580-1|0;r593=(r592|0)==0;if(r593){r579=r591;break}else{r580=r592;r581=r591;r582=r584}}}r594=r533-r536|0;r595=(r533|0)==(r536|0);if(r595){r532=r579;break}else{r533=r594;r534=r579}}}r596=_fread(r214,1,4,r1);r597=(r596|0)==4;if(!r597){break L4}r598=_psi_get_uint32_be(r214,0);r599=(r598|0)==(r532|0);if(r599){r600=r305}else{r2=102;break L49}}else if((r405|0)==1330005587){r601=4;r602=0;r603=(r305|0)==0;r604=r406>>>0<4;r605=r603|r604;if(r605){break L4}r606=_fread(r300,1,4,r1);r607=(r606|0)==4;if(!r607){break L4}r608=HEAP32[58320>>2];r609=(r608|0)==0;if(r609){r610=0;while(1){r611=r610&128;r612=(r611|0)!=0;r613=r610<<25;r614=r613^517762881;r615=r612?r614:r613;r616=(r615|0)<0;r617=r615<<1;r618=r617^517762881;r619=r616?r618:r617;r620=(r619|0)<0;r621=r619<<1;r622=r621^517762881;r623=r620?r622:r621;r624=(r623|0)<0;r625=r623<<1;r626=r625^517762881;r627=r624?r626:r625;r628=(r627|0)<0;r629=r627<<1;r630=r629^517762881;r631=r628?r630:r629;r632=(r631|0)<0;r633=r631<<1;r634=r633^517762881;r635=r632?r634:r633;r636=(r635|0)<0;r637=r635<<1;r638=r637^517762881;r639=r636?r638:r637;r640=(r639|0)<0;r641=r639<<1;r642=r641^517762881;r643=r640?r642:r641;r644=58328+(r610<<2)|0;HEAP32[r644>>2]=r643;r645=r610+1|0;r646=r645>>>0<256;if(r646){r610=r645}else{break}}HEAP32[58320>>2]=1}r647=r404>>>24;r648=HEAP8[r300];r649=r648&255;r650=r649^r647;r651=r404<<8;r652=58328+(r650<<2)|0;r653=HEAP32[r652>>2];r654=r653^r651;r655=r654>>>24;r656=HEAP8[r301];r657=r656&255;r658=r657^r655;r659=r654<<8;r660=58328+(r658<<2)|0;r661=HEAP32[r660>>2];r662=r661^r659;r663=r662>>>24;r664=HEAP8[r302];r665=r664&255;r666=r665^r663;r667=r662<<8;r668=58328+(r666<<2)|0;r669=HEAP32[r668>>2];r670=r669^r667;r671=r670>>>24;r672=HEAP8[r303];r673=r672&255;r674=r673^r671;r675=r670<<8;r676=58328+(r674<<2)|0;r677=HEAP32[r676>>2];r678=r677^r675;r679=_psi_get_uint32_be(r300,0);_psi_sct_set_position(r305,r679);r680=r406-4|0;r681=256;r682=0;r683=(r680|0)==0;if(r683){r684=r678}else{r685=r680;r686=r678;while(1){r687=r685>>>0<256;r688=r687?r685:256;r689=_fread(r214,1,r688,r1);r690=(r689|0)==(r688|0);if(!r690){break L4}r691=HEAP32[58320>>2];r692=(r691|0)==0;if(r692){r693=0;while(1){r694=r693&128;r695=(r694|0)!=0;r696=r693<<25;r697=r696^517762881;r698=r695?r697:r696;r699=(r698|0)<0;r700=r698<<1;r701=r700^517762881;r702=r699?r701:r700;r703=(r702|0)<0;r704=r702<<1;r705=r704^517762881;r706=r703?r705:r704;r707=(r706|0)<0;r708=r706<<1;r709=r708^517762881;r710=r707?r709:r708;r711=(r710|0)<0;r712=r710<<1;r713=r712^517762881;r714=r711?r713:r712;r715=(r714|0)<0;r716=r714<<1;r717=r716^517762881;r718=r715?r717:r716;r719=(r718|0)<0;r720=r718<<1;r721=r720^517762881;r722=r719?r721:r720;r723=(r722|0)<0;r724=r722<<1;r725=r724^517762881;r726=r723?r725:r724;r727=58328+(r693<<2)|0;HEAP32[r727>>2]=r726;r728=r693+1|0;r729=r728>>>0<256;if(r729){r693=r728}else{break}}HEAP32[58320>>2]=1}r730=(r688|0)==0;if(r730){r731=r686}else{r732=r688;r733=r686;r734=r214;while(1){r735=r733>>>24;r736=r734+1|0;r737=HEAP8[r734];r738=r737&255;r739=r738^r735;r740=r733<<8;r741=58328+(r739<<2)|0;r742=HEAP32[r741>>2];r743=r742^r740;r744=r732-1|0;r745=(r744|0)==0;if(r745){r731=r743;break}else{r732=r744;r733=r743;r734=r736}}}r746=r685-r688|0;r747=(r685|0)==(r688|0);if(r747){r684=r731;break}else{r685=r746;r686=r731}}}r748=_fread(r214,1,4,r1);r749=(r748|0)==4;if(!r749){break L4}r750=_psi_get_uint32_be(r214,0);r751=(r750|0)==(r684|0);if(r751){r600=r305}else{r2=169;break L49}}else if((r405|0)==1414090053){r752=4;r753=0;r754=(r305|0)==0;r755=r406>>>0<4;r756=r754|r755;if(r756){break L4}r757=_fread(r300,1,4,r1);r758=(r757|0)==4;if(!r758){break L4}r759=HEAP32[58320>>2];r760=(r759|0)==0;if(r760){r761=0;while(1){r762=r761&128;r763=(r762|0)!=0;r764=r761<<25;r765=r764^517762881;r766=r763?r765:r764;r767=(r766|0)<0;r768=r766<<1;r769=r768^517762881;r770=r767?r769:r768;r771=(r770|0)<0;r772=r770<<1;r773=r772^517762881;r774=r771?r773:r772;r775=(r774|0)<0;r776=r774<<1;r777=r776^517762881;r778=r775?r777:r776;r779=(r778|0)<0;r780=r778<<1;r781=r780^517762881;r782=r779?r781:r780;r783=(r782|0)<0;r784=r782<<1;r785=r784^517762881;r786=r783?r785:r784;r787=(r786|0)<0;r788=r786<<1;r789=r788^517762881;r790=r787?r789:r788;r791=(r790|0)<0;r792=r790<<1;r793=r792^517762881;r794=r791?r793:r792;r795=58328+(r761<<2)|0;HEAP32[r795>>2]=r794;r796=r761+1|0;r797=r796>>>0<256;if(r797){r761=r796}else{break}}HEAP32[58320>>2]=1}r798=r404>>>24;r799=HEAP8[r300];r800=r799&255;r801=r800^r798;r802=r404<<8;r803=58328+(r801<<2)|0;r804=HEAP32[r803>>2];r805=r804^r802;r806=r805>>>24;r807=HEAP8[r301];r808=r807&255;r809=r808^r806;r810=r805<<8;r811=58328+(r809<<2)|0;r812=HEAP32[r811>>2];r813=r812^r810;r814=r813>>>24;r815=HEAP8[r302];r816=r815&255;r817=r816^r814;r818=r813<<8;r819=58328+(r817<<2)|0;r820=HEAP32[r819>>2];r821=r820^r818;r822=r821>>>24;r823=HEAP8[r303];r824=r823&255;r825=r824^r822;r826=r821<<8;r827=58328+(r825<<2)|0;r828=HEAP32[r827>>2];r829=r828^r826;r830=_psi_get_uint32_be(r300,0);_psi_sct_set_read_time(r305,r830);r831=r406-4|0;r832=256;r833=0;r834=(r831|0)==0;if(r834){r835=r829}else{r836=r831;r837=r829;while(1){r838=r836>>>0<256;r839=r838?r836:256;r840=_fread(r214,1,r839,r1);r841=(r840|0)==(r839|0);if(!r841){break L4}r842=HEAP32[58320>>2];r843=(r842|0)==0;if(r843){r844=0;while(1){r845=r844&128;r846=(r845|0)!=0;r847=r844<<25;r848=r847^517762881;r849=r846?r848:r847;r850=(r849|0)<0;r851=r849<<1;r852=r851^517762881;r853=r850?r852:r851;r854=(r853|0)<0;r855=r853<<1;r856=r855^517762881;r857=r854?r856:r855;r858=(r857|0)<0;r859=r857<<1;r860=r859^517762881;r861=r858?r860:r859;r862=(r861|0)<0;r863=r861<<1;r864=r863^517762881;r865=r862?r864:r863;r866=(r865|0)<0;r867=r865<<1;r868=r867^517762881;r869=r866?r868:r867;r870=(r869|0)<0;r871=r869<<1;r872=r871^517762881;r873=r870?r872:r871;r874=(r873|0)<0;r875=r873<<1;r876=r875^517762881;r877=r874?r876:r875;r878=58328+(r844<<2)|0;HEAP32[r878>>2]=r877;r879=r844+1|0;r880=r879>>>0<256;if(r880){r844=r879}else{break}}HEAP32[58320>>2]=1}r881=(r839|0)==0;if(r881){r882=r837}else{r883=r839;r884=r837;r885=r214;while(1){r886=r884>>>24;r887=r885+1|0;r888=HEAP8[r885];r889=r888&255;r890=r889^r886;r891=r884<<8;r892=58328+(r890<<2)|0;r893=HEAP32[r892>>2];r894=r893^r891;r895=r883-1|0;r896=(r895|0)==0;if(r896){r882=r894;break}else{r883=r895;r884=r894;r885=r887}}}r897=r836-r839|0;r898=(r836|0)==(r839|0);if(r898){r835=r882;break}else{r836=r897;r837=r882}}}r899=_fread(r214,1,4,r1);r900=(r899|0)==4;if(!r900){break L4}r901=_psi_get_uint32_be(r214,0);r902=(r901|0)==(r835|0);if(r902){r600=r305}else{r2=185;break L49}}else if((r405|0)==1296122695){r903=18;r904=0;r905=(r305|0)==0;r906=r406>>>0<18;r907=r905|r906;if(r907){break L4}r908=_fread(r294,1,18,r1);r909=(r908|0)==18;if(!r909){break L4}r910=HEAP32[58320>>2];r911=(r910|0)==0;if(r911){r912=0;while(1){r913=r912&128;r914=(r913|0)!=0;r915=r912<<25;r916=r915^517762881;r917=r914?r916:r915;r918=(r917|0)<0;r919=r917<<1;r920=r919^517762881;r921=r918?r920:r919;r922=(r921|0)<0;r923=r921<<1;r924=r923^517762881;r925=r922?r924:r923;r926=(r925|0)<0;r927=r925<<1;r928=r927^517762881;r929=r926?r928:r927;r930=(r929|0)<0;r931=r929<<1;r932=r931^517762881;r933=r930?r932:r931;r934=(r933|0)<0;r935=r933<<1;r936=r935^517762881;r937=r934?r936:r935;r938=(r937|0)<0;r939=r937<<1;r940=r939^517762881;r941=r938?r940:r939;r942=(r941|0)<0;r943=r941<<1;r944=r943^517762881;r945=r942?r944:r943;r946=58328+(r912<<2)|0;HEAP32[r946>>2]=r945;r947=r912+1|0;r948=r947>>>0<256;if(r948){r912=r947}else{break}}HEAP32[58320>>2]=1;r949=18;r950=r404;r951=r294}else{r949=18;r950=r404;r951=r294}while(1){r952=r950>>>24;r953=r951+1|0;r954=HEAP8[r951];r955=r954&255;r956=r955^r952;r957=r950<<8;r958=58328+(r956<<2)|0;r959=HEAP32[r958>>2];r960=r959^r957;r961=r949-1|0;r962=(r961|0)==0;if(r962){break}else{r949=r961;r950=r960;r951=r953}}r963=_psi_get_uint16_be(r294,0);r964=r963&65535;r965=r305+4|0;HEAP16[r965>>1]=r964;r966=HEAP8[r295];r967=r966&255;r968=r305+6|0;HEAP16[r968>>1]=r967;r969=HEAP8[r296];r970=r969&255;r971=r305+8|0;HEAP16[r971>>1]=r970;r972=HEAP8[r297];_psi_sct_set_gcr_format(r305,r972);r973=HEAP8[r298];r974=r973&1;r975=r974<<24>>24==0;if(!r975){r976=r305+12|0;r977=HEAP32[r976>>2];r978=r977|1;HEAP32[r976>>2]=r978}r979=r973&2;r980=r979<<24>>24==0;if(!r980){r981=r305+12|0;r982=HEAP32[r981>>2];r983=r982|2;HEAP32[r981>>2]=r983}r984=r973&4;r985=r984<<24>>24==0;if(!r985){r986=r305+12|0;r987=HEAP32[r986>>2];r988=r987|8;HEAP32[r986>>2]=r988}_psi_sct_set_encoding(r305,3);r989=_psi_sct_set_tags(r305,r299,12);r990=r406-18|0;r991=256;r992=0;r993=(r990|0)==0;if(r993){r994=r960}else{r995=r990;r996=r960;while(1){r997=r995>>>0<256;r998=r997?r995:256;r999=_fread(r214,1,r998,r1);r1000=(r999|0)==(r998|0);if(!r1000){break L4}r1001=HEAP32[58320>>2];r1002=(r1001|0)==0;if(r1002){r1003=0;while(1){r1004=r1003&128;r1005=(r1004|0)!=0;r1006=r1003<<25;r1007=r1006^517762881;r1008=r1005?r1007:r1006;r1009=(r1008|0)<0;r1010=r1008<<1;r1011=r1010^517762881;r1012=r1009?r1011:r1010;r1013=(r1012|0)<0;r1014=r1012<<1;r1015=r1014^517762881;r1016=r1013?r1015:r1014;r1017=(r1016|0)<0;r1018=r1016<<1;r1019=r1018^517762881;r1020=r1017?r1019:r1018;r1021=(r1020|0)<0;r1022=r1020<<1;r1023=r1022^517762881;r1024=r1021?r1023:r1022;r1025=(r1024|0)<0;r1026=r1024<<1;r1027=r1026^517762881;r1028=r1025?r1027:r1026;r1029=(r1028|0)<0;r1030=r1028<<1;r1031=r1030^517762881;r1032=r1029?r1031:r1030;r1033=(r1032|0)<0;r1034=r1032<<1;r1035=r1034^517762881;r1036=r1033?r1035:r1034;r1037=58328+(r1003<<2)|0;HEAP32[r1037>>2]=r1036;r1038=r1003+1|0;r1039=r1038>>>0<256;if(r1039){r1003=r1038}else{break}}HEAP32[58320>>2]=1}r1040=(r998|0)==0;if(r1040){r1041=r996}else{r1042=r998;r1043=r996;r1044=r214;while(1){r1045=r1043>>>24;r1046=r1044+1|0;r1047=HEAP8[r1044];r1048=r1047&255;r1049=r1048^r1045;r1050=r1043<<8;r1051=58328+(r1049<<2)|0;r1052=HEAP32[r1051>>2];r1053=r1052^r1050;r1054=r1042-1|0;r1055=(r1054|0)==0;if(r1055){r1041=r1053;break}else{r1042=r1054;r1043=r1053;r1044=r1046}}}r1056=r995-r998|0;r1057=(r995|0)==(r998|0);if(r1057){r994=r1041;break}else{r995=r1056;r996=r1041}}}r1058=_fread(r214,1,4,r1);r1059=(r1058|0)==4;if(!r1059){break L4}r1060=_psi_get_uint32_be(r214,0);r1061=(r1060|0)==(r994|0);if(r1061){r600=r305}else{r2=153;break L49}}else if((r405|0)==1229081933){r1062=8;r1063=0;r1064=(r305|0)==0;r1065=r406>>>0<6;r1066=r1064|r1065;if(r1066){break L4}r1067=_fread(r127,1,6,r1);r1068=(r1067|0)==6;if(!r1068){break L4}r1069=HEAP32[58320>>2];r1070=(r1069|0)==0;if(r1070){r1071=0;while(1){r1072=r1071&128;r1073=(r1072|0)!=0;r1074=r1071<<25;r1075=r1074^517762881;r1076=r1073?r1075:r1074;r1077=(r1076|0)<0;r1078=r1076<<1;r1079=r1078^517762881;r1080=r1077?r1079:r1078;r1081=(r1080|0)<0;r1082=r1080<<1;r1083=r1082^517762881;r1084=r1081?r1083:r1082;r1085=(r1084|0)<0;r1086=r1084<<1;r1087=r1086^517762881;r1088=r1085?r1087:r1086;r1089=(r1088|0)<0;r1090=r1088<<1;r1091=r1090^517762881;r1092=r1089?r1091:r1090;r1093=(r1092|0)<0;r1094=r1092<<1;r1095=r1094^517762881;r1096=r1093?r1095:r1094;r1097=(r1096|0)<0;r1098=r1096<<1;r1099=r1098^517762881;r1100=r1097?r1099:r1098;r1101=(r1100|0)<0;r1102=r1100<<1;r1103=r1102^517762881;r1104=r1101?r1103:r1102;r1105=58328+(r1071<<2)|0;HEAP32[r1105>>2]=r1104;r1106=r1071+1|0;r1107=r1106>>>0<256;if(r1107){r1071=r1106}else{break}}HEAP32[58320>>2]=1}r1108=r404>>>24;r1109=HEAP8[r127];r1110=r1109&255;r1111=r1110^r1108;r1112=r404<<8;r1113=58328+(r1111<<2)|0;r1114=HEAP32[r1113>>2];r1115=r1114^r1112;r1116=r1115>>>24;r1117=HEAP8[r173];r1118=r1117&255;r1119=r1118^r1116;r1120=r1115<<8;r1121=58328+(r1119<<2)|0;r1122=HEAP32[r1121>>2];r1123=r1122^r1120;r1124=r1123>>>24;r1125=HEAP8[r182];r1126=r1125&255;r1127=r1126^r1124;r1128=r1123<<8;r1129=58328+(r1127<<2)|0;r1130=HEAP32[r1129>>2];r1131=r1130^r1128;r1132=r1131>>>24;r1133=HEAP8[r191];r1134=r1133&255;r1135=r1134^r1132;r1136=r1131<<8;r1137=58328+(r1135<<2)|0;r1138=HEAP32[r1137>>2];r1139=r1138^r1136;r1140=r1139>>>24;r1141=HEAP8[r290];r1142=r1141&255;r1143=r1142^r1140;r1144=r1139<<8;r1145=58328+(r1143<<2)|0;r1146=HEAP32[r1145>>2];r1147=r1146^r1144;r1148=r1147>>>24;r1149=HEAP8[r291];r1150=r1149&255;r1151=r1150^r1148;r1152=r1147<<8;r1153=58328+(r1151<<2)|0;r1154=HEAP32[r1153>>2];r1155=r1154^r1152;r1156=r1109&255;r1157=r305+4|0;HEAP16[r1157>>1]=r1156;r1158=r1117&255;r1159=r305+6|0;HEAP16[r1159>>1]=r1158;r1160=r1125&255;r1161=r305+8|0;HEAP16[r1161>>1]=r1160;_psi_sct_set_mfm_size(r305,r1133);r1162=r1141&1;r1163=r1162<<24>>24==0;if(!r1163){r1164=r305+12|0;r1165=HEAP32[r1164>>2];r1166=r1165|1;HEAP32[r1164>>2]=r1166}r1167=r1141&2;r1168=r1167<<24>>24==0;if(!r1168){r1169=r305+12|0;r1170=HEAP32[r1169>>2];r1171=r1170|2;HEAP32[r1169>>2]=r1171}r1172=r1141&4;r1173=r1172<<24>>24==0;if(!r1173){r1174=r305+12|0;r1175=HEAP32[r1174>>2];r1176=r1175|4;HEAP32[r1174>>2]=r1176}r1177=r1141&8;r1178=r1177<<24>>24==0;if(!r1178){r1179=r305+12|0;r1180=HEAP32[r1179>>2];r1181=r1180|8;HEAP32[r1179>>2]=r1181}if((r1150|0)==1){_psi_sct_set_encoding(r305,32770)}else if((r1150|0)==2){_psi_sct_set_encoding(r305,16386)}else{_psi_sct_set_encoding(r305,2)}r1182=r406-6|0;r1183=256;r1184=0;r1185=(r1182|0)==0;if(r1185){r1186=r1155}else{r1187=r1182;r1188=r1155;while(1){r1189=r1187>>>0<256;r1190=r1189?r1187:256;r1191=_fread(r214,1,r1190,r1);r1192=(r1191|0)==(r1190|0);if(!r1192){break L4}r1193=HEAP32[58320>>2];r1194=(r1193|0)==0;if(r1194){r1195=0;while(1){r1196=r1195&128;r1197=(r1196|0)!=0;r1198=r1195<<25;r1199=r1198^517762881;r1200=r1197?r1199:r1198;r1201=(r1200|0)<0;r1202=r1200<<1;r1203=r1202^517762881;r1204=r1201?r1203:r1202;r1205=(r1204|0)<0;r1206=r1204<<1;r1207=r1206^517762881;r1208=r1205?r1207:r1206;r1209=(r1208|0)<0;r1210=r1208<<1;r1211=r1210^517762881;r1212=r1209?r1211:r1210;r1213=(r1212|0)<0;r1214=r1212<<1;r1215=r1214^517762881;r1216=r1213?r1215:r1214;r1217=(r1216|0)<0;r1218=r1216<<1;r1219=r1218^517762881;r1220=r1217?r1219:r1218;r1221=(r1220|0)<0;r1222=r1220<<1;r1223=r1222^517762881;r1224=r1221?r1223:r1222;r1225=(r1224|0)<0;r1226=r1224<<1;r1227=r1226^517762881;r1228=r1225?r1227:r1226;r1229=58328+(r1195<<2)|0;HEAP32[r1229>>2]=r1228;r1230=r1195+1|0;r1231=r1230>>>0<256;if(r1231){r1195=r1230}else{break}}HEAP32[58320>>2]=1}r1232=(r1190|0)==0;if(r1232){r1233=r1188}else{r1234=r1190;r1235=r1188;r1236=r214;while(1){r1237=r1235>>>24;r1238=r1236+1|0;r1239=HEAP8[r1236];r1240=r1239&255;r1241=r1240^r1237;r1242=r1235<<8;r1243=58328+(r1241<<2)|0;r1244=HEAP32[r1243>>2];r1245=r1244^r1242;r1246=r1234-1|0;r1247=(r1246|0)==0;if(r1247){r1233=r1245;break}else{r1234=r1246;r1235=r1245;r1236=r1238}}}r1248=r1187-r1190|0;r1249=(r1187|0)==(r1190|0);if(r1249){r1186=r1233;break}else{r1187=r1248;r1188=r1233}}}r1250=_fread(r214,1,4,r1);r1251=(r1250|0)==4;if(!r1251){break L4}r1252=_psi_get_uint32_be(r214,0);r1253=(r1252|0)==(r1186|0);if(r1253){r600=r305}else{r2=130;break L49}}else if((r405|0)==1397048148){r1254=8;r1255=0;r1256=r406>>>0<8;if(r1256){break L4}r1257=_fread(r127,1,8,r1);r1258=(r1257|0)==8;if(!r1258){break L4}r1259=HEAP32[58320>>2];r1260=(r1259|0)==0;if(r1260){r1261=0;while(1){r1262=r1261&128;r1263=(r1262|0)!=0;r1264=r1261<<25;r1265=r1264^517762881;r1266=r1263?r1265:r1264;r1267=(r1266|0)<0;r1268=r1266<<1;r1269=r1268^517762881;r1270=r1267?r1269:r1268;r1271=(r1270|0)<0;r1272=r1270<<1;r1273=r1272^517762881;r1274=r1271?r1273:r1272;r1275=(r1274|0)<0;r1276=r1274<<1;r1277=r1276^517762881;r1278=r1275?r1277:r1276;r1279=(r1278|0)<0;r1280=r1278<<1;r1281=r1280^517762881;r1282=r1279?r1281:r1280;r1283=(r1282|0)<0;r1284=r1282<<1;r1285=r1284^517762881;r1286=r1283?r1285:r1284;r1287=(r1286|0)<0;r1288=r1286<<1;r1289=r1288^517762881;r1290=r1287?r1289:r1288;r1291=(r1290|0)<0;r1292=r1290<<1;r1293=r1292^517762881;r1294=r1291?r1293:r1292;r1295=58328+(r1261<<2)|0;HEAP32[r1295>>2]=r1294;r1296=r1261+1|0;r1297=r1296>>>0<256;if(r1297){r1261=r1296}else{break}}HEAP32[58320>>2]=1}r1298=r404>>>24;r1299=HEAP8[r127];r1300=r1299&255;r1301=r1300^r1298;r1302=r404<<8;r1303=58328+(r1301<<2)|0;r1304=HEAP32[r1303>>2];r1305=r1304^r1302;r1306=r1305>>>24;r1307=HEAP8[r173];r1308=r1307&255;r1309=r1308^r1306;r1310=r1305<<8;r1311=58328+(r1309<<2)|0;r1312=HEAP32[r1311>>2];r1313=r1312^r1310;r1314=r1313>>>24;r1315=HEAP8[r182];r1316=r1315&255;r1317=r1316^r1314;r1318=r1313<<8;r1319=58328+(r1317<<2)|0;r1320=HEAP32[r1319>>2];r1321=r1320^r1318;r1322=r1321>>>24;r1323=HEAP8[r191];r1324=r1323&255;r1325=r1324^r1322;r1326=r1321<<8;r1327=58328+(r1325<<2)|0;r1328=HEAP32[r1327>>2];r1329=r1328^r1326;r1330=r1329>>>24;r1331=HEAP8[r290];r1332=r1331&255;r1333=r1332^r1330;r1334=r1329<<8;r1335=58328+(r1333<<2)|0;r1336=HEAP32[r1335>>2];r1337=r1336^r1334;r1338=r1337>>>24;r1339=HEAP8[r291];r1340=r1339&255;r1341=r1340^r1338;r1342=r1337<<8;r1343=58328+(r1341<<2)|0;r1344=HEAP32[r1343>>2];r1345=r1344^r1342;r1346=r1345>>>24;r1347=HEAP8[r292];r1348=r1347&255;r1349=r1348^r1346;r1350=r1345<<8;r1351=58328+(r1349<<2)|0;r1352=HEAP32[r1351>>2];r1353=r1352^r1350;r1354=r1353>>>24;r1355=HEAP8[r293];r1356=r1355&255;r1357=r1356^r1354;r1358=r1353<<8;r1359=58328+(r1357<<2)|0;r1360=HEAP32[r1359>>2];r1361=r1360^r1358;r1362=_psi_get_uint16_be(r127,0);r1363=HEAP8[r182];r1364=r1363&255;r1365=HEAP8[r191];r1366=r1365&255;r1367=_psi_get_uint16_be(r127,4);r1368=HEAP8[r292];r1369=r1368&255;r1370=_psi_sct_new(r1362,r1364,r1366,r1367);r1371=(r1370|0)==0;if(r1371){break L4}r1372=r1369&2;r1373=(r1372|0)==0;if(r1373){r1374=_psi_img_add_sector(r10,r1370,r1362,r1364);r1375=(r1374|0)==0;if(!r1375){r2=60;break L49}}else{r1376=(r305|0)==0;if(r1376){r2=57;break L49}_psi_sct_add_alternate(r305,r1370)}r1377=r1369&4;r1378=(r1377|0)==0;if(!r1378){r1379=r1370+12|0;r1380=HEAP32[r1379>>2];r1381=r1380|2;HEAP32[r1379>>2]=r1381}_psi_sct_set_encoding(r1370,r212);r1382=r406-8|0;r1383=r1369&1;r1384=(r1383|0)==0;if(!r1384){r1385=HEAP8[r293];r1386=r1385&255;_psi_sct_fill(r1370,r1386)}r1387=256;r1388=0;r1389=(r1382|0)==0;if(r1389){r1390=r1361}else{r1391=r1382;r1392=r1361;while(1){r1393=r1391>>>0<256;r1394=r1393?r1391:256;r1395=_fread(r214,1,r1394,r1);r1396=(r1395|0)==(r1394|0);if(!r1396){break L4}r1397=HEAP32[58320>>2];r1398=(r1397|0)==0;if(r1398){r1399=0;while(1){r1400=r1399&128;r1401=(r1400|0)!=0;r1402=r1399<<25;r1403=r1402^517762881;r1404=r1401?r1403:r1402;r1405=(r1404|0)<0;r1406=r1404<<1;r1407=r1406^517762881;r1408=r1405?r1407:r1406;r1409=(r1408|0)<0;r1410=r1408<<1;r1411=r1410^517762881;r1412=r1409?r1411:r1410;r1413=(r1412|0)<0;r1414=r1412<<1;r1415=r1414^517762881;r1416=r1413?r1415:r1414;r1417=(r1416|0)<0;r1418=r1416<<1;r1419=r1418^517762881;r1420=r1417?r1419:r1418;r1421=(r1420|0)<0;r1422=r1420<<1;r1423=r1422^517762881;r1424=r1421?r1423:r1422;r1425=(r1424|0)<0;r1426=r1424<<1;r1427=r1426^517762881;r1428=r1425?r1427:r1426;r1429=(r1428|0)<0;r1430=r1428<<1;r1431=r1430^517762881;r1432=r1429?r1431:r1430;r1433=58328+(r1399<<2)|0;HEAP32[r1433>>2]=r1432;r1434=r1399+1|0;r1435=r1434>>>0<256;if(r1435){r1399=r1434}else{break}}HEAP32[58320>>2]=1}r1436=(r1394|0)==0;if(r1436){r1437=r1392}else{r1438=r1394;r1439=r1392;r1440=r214;while(1){r1441=r1439>>>24;r1442=r1440+1|0;r1443=HEAP8[r1440];r1444=r1443&255;r1445=r1444^r1441;r1446=r1439<<8;r1447=58328+(r1445<<2)|0;r1448=HEAP32[r1447>>2];r1449=r1448^r1446;r1450=r1438-1|0;r1451=(r1450|0)==0;if(r1451){r1437=r1449;break}else{r1438=r1450;r1439=r1449;r1440=r1442}}}r1452=r1391-r1394|0;r1453=(r1391|0)==(r1394|0);if(r1453){r1390=r1437;break}else{r1391=r1452;r1392=r1437}}}r1454=_fread(r214,1,4,r1);r1455=(r1454|0)==4;if(!r1455){break L4}r1456=_psi_get_uint32_be(r214,0);r1457=(r1456|0)==(r1390|0);if(r1457){r600=r1370}else{r2=75;break L49}}else if((r405|0)==1413830740){r1458=(r406|0)==0;if(r1458){r1459=256;r1460=0;r1461=_fread(r214,1,4,r1);r1462=(r1461|0)==4;if(!r1462){break L4}r1463=_psi_get_uint32_be(r214,0);r1464=(r1463|0)==(r404|0);if(r1464){r600=r305;break}else{r2=200;break L49}}r1465=_malloc(r406);r1466=(r1465|0)==0;if(r1466){break L4}r1467=_fread(r1465,1,r406,r1);r1468=(r1467|0)==(r406|0);if(!r1468){r2=207;break L49}r1469=HEAP32[58320>>2];r1470=(r1469|0)==0;if(r1470){r1471=0;while(1){r1472=r1471&128;r1473=(r1472|0)!=0;r1474=r1471<<25;r1475=r1474^517762881;r1476=r1473?r1475:r1474;r1477=(r1476|0)<0;r1478=r1476<<1;r1479=r1478^517762881;r1480=r1477?r1479:r1478;r1481=(r1480|0)<0;r1482=r1480<<1;r1483=r1482^517762881;r1484=r1481?r1483:r1482;r1485=(r1484|0)<0;r1486=r1484<<1;r1487=r1486^517762881;r1488=r1485?r1487:r1486;r1489=(r1488|0)<0;r1490=r1488<<1;r1491=r1490^517762881;r1492=r1489?r1491:r1490;r1493=(r1492|0)<0;r1494=r1492<<1;r1495=r1494^517762881;r1496=r1493?r1495:r1494;r1497=(r1496|0)<0;r1498=r1496<<1;r1499=r1498^517762881;r1500=r1497?r1499:r1498;r1501=(r1500|0)<0;r1502=r1500<<1;r1503=r1502^517762881;r1504=r1501?r1503:r1502;r1505=58328+(r1471<<2)|0;HEAP32[r1505>>2]=r1504;r1506=r1471+1|0;r1507=r1506>>>0<256;if(r1507){r1471=r1506}else{break}}HEAP32[58320>>2]=1;r1508=r406;r1509=r404;r1510=r1465}else{r1508=r406;r1509=r404;r1510=r1465}while(1){r1511=r1509>>>24;r1512=r1510+1|0;r1513=HEAP8[r1510];r1514=r1513&255;r1515=r1514^r1511;r1516=r1509<<8;r1517=58328+(r1515<<2)|0;r1518=HEAP32[r1517>>2];r1519=r1518^r1516;r1520=r1508-1|0;r1521=(r1520|0)==0;if(r1521){break}else{r1508=r1520;r1509=r1519;r1510=r1512}}r1522=HEAP8[r1465];r1523=r1522<<24>>24==10;r1524=r1523&1;r1525=r1523<<31>>31;r1526=r1525+r406|0;r1527=(r1526|0)==0;if(r1527){r1528=0}else{r1529=r1526-1|0;r1530=r1465+r1529|0;r1531=HEAP8[r1530];r1532=r1531<<24>>24==10;r1533=r1532?r1529:r1526;r1528=r1533}r1534=r1465+r1524|0;r1535=_psi_img_add_comment(r10,r1534,r1528);_free(r1465);r1536=256;r1537=0;r1538=_fread(r214,1,4,r1);r1539=(r1538|0)==4;if(r1539){r1540=_psi_get_uint32_be(r214,0);r1541=(r1540|0)==(r1519|0);if(r1541){r1542=0}else{r1543=_fwrite(56560,15,1,r304);r1542=1}}else{r1542=1}r1544=256;r1545=0;r1546=r1542|r1535;r1547=(r1546|0)==0;if(r1547){r600=r305}else{break L4}}else if((r405|0)==1162757152){r2=38;break L49}else if((r405|0)==1145132097){r1548=(r305|0)==0;if(r1548){break L4}r1549=_psi_sct_set_size(r305,r406,0);r1550=(r1549|0)==0;if(!r1550){break L4}r1551=(r406|0)==0;if(r1551){r1552=r404}else{r1553=r305+24|0;r1554=HEAP32[r1553>>2];r1555=_fread(r1554,1,r406,r1);r1556=(r1555|0)==(r406|0);if(!r1556){break L4}r1557=HEAP32[58320>>2];r1558=(r1557|0)==0;if(r1558){r1559=0;while(1){r1560=r1559&128;r1561=(r1560|0)!=0;r1562=r1559<<25;r1563=r1562^517762881;r1564=r1561?r1563:r1562;r1565=(r1564|0)<0;r1566=r1564<<1;r1567=r1566^517762881;r1568=r1565?r1567:r1566;r1569=(r1568|0)<0;r1570=r1568<<1;r1571=r1570^517762881;r1572=r1569?r1571:r1570;r1573=(r1572|0)<0;r1574=r1572<<1;r1575=r1574^517762881;r1576=r1573?r1575:r1574;r1577=(r1576|0)<0;r1578=r1576<<1;r1579=r1578^517762881;r1580=r1577?r1579:r1578;r1581=(r1580|0)<0;r1582=r1580<<1;r1583=r1582^517762881;r1584=r1581?r1583:r1582;r1585=(r1584|0)<0;r1586=r1584<<1;r1587=r1586^517762881;r1588=r1585?r1587:r1586;r1589=(r1588|0)<0;r1590=r1588<<1;r1591=r1590^517762881;r1592=r1589?r1591:r1590;r1593=58328+(r1559<<2)|0;HEAP32[r1593>>2]=r1592;r1594=r1559+1|0;r1595=r1594>>>0<256;if(r1595){r1559=r1594}else{break}}HEAP32[58320>>2]=1;r1596=r406;r1597=r404;r1598=r1554}else{r1596=r406;r1597=r404;r1598=r1554}while(1){r1599=r1597>>>24;r1600=r1598+1|0;r1601=HEAP8[r1598];r1602=r1601&255;r1603=r1602^r1599;r1604=r1597<<8;r1605=58328+(r1603<<2)|0;r1606=HEAP32[r1605>>2];r1607=r1606^r1604;r1608=r1596-1|0;r1609=(r1608|0)==0;if(r1609){r1552=r1607;break}else{r1596=r1608;r1597=r1607;r1598=r1600}}}r1610=256;r1611=0;r1612=_fread(r214,1,4,r1);r1613=(r1612|0)==4;if(!r1613){break L4}r1614=_psi_get_uint32_be(r214,0);r1615=(r1614|0)==(r1552|0);if(r1615){r600=r305}else{r2=196;break L49}}else{r1616=256;r1617=0;r1618=(r406|0)==0;if(r1618){r1619=r404}else{r1620=r406;r1621=r404;while(1){r1622=r1620>>>0<256;r1623=r1622?r1620:256;r1624=_fread(r214,1,r1623,r1);r1625=(r1624|0)==(r1623|0);if(!r1625){break L4}r1626=HEAP32[58320>>2];r1627=(r1626|0)==0;if(r1627){r1628=0;while(1){r1629=r1628&128;r1630=(r1629|0)!=0;r1631=r1628<<25;r1632=r1631^517762881;r1633=r1630?r1632:r1631;r1634=(r1633|0)<0;r1635=r1633<<1;r1636=r1635^517762881;r1637=r1634?r1636:r1635;r1638=(r1637|0)<0;r1639=r1637<<1;r1640=r1639^517762881;r1641=r1638?r1640:r1639;r1642=(r1641|0)<0;r1643=r1641<<1;r1644=r1643^517762881;r1645=r1642?r1644:r1643;r1646=(r1645|0)<0;r1647=r1645<<1;r1648=r1647^517762881;r1649=r1646?r1648:r1647;r1650=(r1649|0)<0;r1651=r1649<<1;r1652=r1651^517762881;r1653=r1650?r1652:r1651;r1654=(r1653|0)<0;r1655=r1653<<1;r1656=r1655^517762881;r1657=r1654?r1656:r1655;r1658=(r1657|0)<0;r1659=r1657<<1;r1660=r1659^517762881;r1661=r1658?r1660:r1659;r1662=58328+(r1628<<2)|0;HEAP32[r1662>>2]=r1661;r1663=r1628+1|0;r1664=r1663>>>0<256;if(r1664){r1628=r1663}else{break}}HEAP32[58320>>2]=1}r1665=(r1623|0)==0;if(r1665){r1666=r1621}else{r1667=r1623;r1668=r1621;r1669=r214;while(1){r1670=r1668>>>24;r1671=r1669+1|0;r1672=HEAP8[r1669];r1673=r1672&255;r1674=r1673^r1670;r1675=r1668<<8;r1676=58328+(r1674<<2)|0;r1677=HEAP32[r1676>>2];r1678=r1677^r1675;r1679=r1667-1|0;r1680=(r1679|0)==0;if(r1680){r1666=r1678;break}else{r1667=r1679;r1668=r1678;r1669=r1671}}}r1681=r1620-r1623|0;r1682=(r1620|0)==(r1623|0);if(r1682){r1619=r1666;break}else{r1620=r1681;r1621=r1666}}}r1683=_fread(r214,1,4,r1);r1684=(r1683|0)==4;if(!r1684){break L4}r1685=_psi_get_uint32_be(r214,0);r1686=(r1685|0)==(r1619|0);if(r1686){r600=r305}else{r2=225;break L49}}}while(0);r1687=_fread(r13,1,8,r1);r1688=(r1687|0)==8;if(r1688){r305=r600}else{break L4}}if(r2==38){r1689=256;r1690=0;r1691=(r406|0)==0;if(r1691){r1692=r404}else{r1693=r406;r1694=r404;while(1){r1695=r1693>>>0<256;r1696=r1695?r1693:256;r1697=_fread(r214,1,r1696,r1);r1698=(r1697|0)==(r1696|0);if(!r1698){break L4}r1699=HEAP32[58320>>2];r1700=(r1699|0)==0;if(r1700){r1701=0;while(1){r1702=r1701&128;r1703=(r1702|0)!=0;r1704=r1701<<25;r1705=r1704^517762881;r1706=r1703?r1705:r1704;r1707=(r1706|0)<0;r1708=r1706<<1;r1709=r1708^517762881;r1710=r1707?r1709:r1708;r1711=(r1710|0)<0;r1712=r1710<<1;r1713=r1712^517762881;r1714=r1711?r1713:r1712;r1715=(r1714|0)<0;r1716=r1714<<1;r1717=r1716^517762881;r1718=r1715?r1717:r1716;r1719=(r1718|0)<0;r1720=r1718<<1;r1721=r1720^517762881;r1722=r1719?r1721:r1720;r1723=(r1722|0)<0;r1724=r1722<<1;r1725=r1724^517762881;r1726=r1723?r1725:r1724;r1727=(r1726|0)<0;r1728=r1726<<1;r1729=r1728^517762881;r1730=r1727?r1729:r1728;r1731=(r1730|0)<0;r1732=r1730<<1;r1733=r1732^517762881;r1734=r1731?r1733:r1732;r1735=58328+(r1701<<2)|0;HEAP32[r1735>>2]=r1734;r1736=r1701+1|0;r1737=r1736>>>0<256;if(r1737){r1701=r1736}else{break}}HEAP32[58320>>2]=1}r1738=(r1696|0)==0;if(r1738){r1739=r1694}else{r1740=r1696;r1741=r1694;r1742=r214;while(1){r1743=r1741>>>24;r1744=r1742+1|0;r1745=HEAP8[r1742];r1746=r1745&255;r1747=r1746^r1743;r1748=r1741<<8;r1749=58328+(r1747<<2)|0;r1750=HEAP32[r1749>>2];r1751=r1750^r1748;r1752=r1740-1|0;r1753=(r1752|0)==0;if(r1753){r1739=r1751;break}else{r1740=r1752;r1741=r1751;r1742=r1744}}}r1754=r1693-r1696|0;r1755=(r1693|0)==(r1696|0);if(r1755){r1692=r1739;break}else{r1693=r1754;r1694=r1739}}}r1756=_fread(r214,1,4,r1);r1757=(r1756|0)==4;if(!r1757){break}r1758=_psi_get_uint32_be(r214,0);r1759=(r1758|0)==(r1692|0);if(!r1759){r1760=_fwrite(56560,15,1,r304);break}r1761=256;r1762=0;_psi_img_clean_comment(r10);r1763=8;r1764=0;r12=r10;STACKTOP=r4;return r12}else if(r2==57){r1765=_fwrite(50016,31,1,r304);_psi_sct_del(r1370);break}else if(r2==60){_psi_sct_del(r1370);break}else if(r2==75){r1766=_fwrite(56560,15,1,r304);break}else if(r2==102){r1767=_fwrite(56560,15,1,r304);break}else if(r2==130){r1768=_fwrite(56560,15,1,r304);break}else if(r2==153){r1769=_fwrite(56560,15,1,r304);break}else if(r2==169){r1770=_fwrite(56560,15,1,r304);break}else if(r2==185){r1771=_fwrite(56560,15,1,r304);break}else if(r2==196){r1772=_fwrite(56560,15,1,r304);break}else if(r2==200){r1773=_fwrite(56560,15,1,r304);break}else if(r2==207){_free(r1465);break}else if(r2==225){r1774=_fwrite(56560,15,1,r304);break}}}}}}}}while(0);r1775=8;r1776=0;_psi_img_del(r10);r12=0;STACKTOP=r4;return r12}function _psi_save_psi(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=r4+40|0;_psi_set_uint16_be(r9,0,0);r10=r2|0;r11=HEAP16[r10>>1];L1:do{if(r11<<16>>16!=0){r12=HEAP32[r2+4>>2];r13=r11&65535;r14=0;L3:while(1){r15=HEAP32[r12+(r14<<2)>>2];r16=HEAP16[r15+2>>1];if(r16<<16>>16!=0){r17=HEAP32[r15+4>>2];r15=r16&65535;r16=0;while(1){r18=HEAP32[r17+(r16<<2)>>2];r19=r16+1|0;if((HEAP16[r18+2>>1]|0)!=0){break L3}if(r19>>>0<r15>>>0){r16=r19}else{break}}}r16=r14+1|0;if(r16>>>0<r13>>>0){r14=r16}else{r20=0;r3=14;break L1}}r14=HEAPU16[HEAP32[HEAP32[r18+4>>2]>>2]+16>>1];if((r14|0)==32770){r21=513;r22=r14;break}else if((r14|0)==16386){r21=514;r22=r14;break}else if((r14|0)==3){r21=768;r22=r14;break}else if((r14|0)==1){r21=256;r22=1;break}else if((r14|0)==2){r21=512;r22=r14;break}else if((r14|0)==32769){r21=257;r22=r14;break}else{r20=r14;r3=14;break}}else{r20=0;r3=14}}while(0);if(r3==14){r21=0;r22=r20}_psi_set_uint16_be(r9,2,r21);if((_psi_save_chunk(r1,1347635488,4,r9)|0)!=0){r23=1;STACKTOP=r4;return r23}r9=r8|0;r21=r2+8|0;if((HEAP32[r21>>2]|0)!=0){_psi_set_uint32_be(r9,0,1413830740);_psi_set_uint32_be(r9,4,HEAP32[r21>>2]+2|0);r20=r8+8|0;HEAP8[r20]=10;HEAP32[r7>>2]=0;r8=_psi_write_crc(r1,r9,9,r7);r18=_psi_write_crc(r1,HEAP32[r2+12>>2],HEAP32[r21>>2],r7)|r8;r8=r18|_psi_write_crc(r1,r20,1,r7);_psi_set_uint32_be(r9,0,HEAP32[r7>>2]);if((r8|(_fwrite(r9,1,4,r1)|0)!=4|0)!=0){r23=1;STACKTOP=r4;return r23}}r9=HEAP16[r10>>1];L28:do{if(r9<<16>>16!=0){r8=r2+4|0;r7=0;r20=r9;L30:while(1){r18=HEAP32[HEAP32[r8>>2]+(r7<<2)>>2];r21=r18+2|0;r11=HEAP16[r21>>1];if(r11<<16>>16==0){r24=r20}else{r14=r18+4|0;r18=0;r13=r11;while(1){r11=HEAP32[HEAP32[r14>>2]+(r18<<2)>>2];r12=r11+2|0;if((HEAP16[r12>>1]|0)==0){r25=r13}else{r16=r11+4|0;r11=0;while(1){r15=HEAP32[HEAP32[r16>>2]+(r11<<2)>>2];if((_psi_save_sector(r1,r15,r7,r18,0,r22)|0)==0){r26=r15}else{r23=1;r3=35;break L30}while(1){r15=HEAP32[r26>>2];if((r15|0)==0){break}if((_psi_save_sector(r1,r15,r7,r18,1,r22)|0)==0){r26=r15}else{r23=1;r3=35;break L30}}r15=r11+1|0;if(r15>>>0<HEAPU16[r12>>1]>>>0){r11=r15}else{break}}r25=HEAP16[r21>>1]}r11=r18+1|0;if(r11>>>0<(r25&65535)>>>0){r18=r11;r13=r25}else{break}}r24=HEAP16[r10>>1]}r13=r7+1|0;if(r13>>>0<(r24&65535)>>>0){r7=r13;r20=r24}else{break L28}}if(r3==35){STACKTOP=r4;return r23}}}while(0);r3=r6|0;_psi_set_uint32_be(r3,0,1162757152);_psi_set_uint32_be(r3,4,0);HEAP32[r5>>2]=0;if((_psi_write_crc(r1,r3,8,r5)|0)!=0){r23=1;STACKTOP=r4;return r23}_psi_set_uint32_be(r3,0,HEAP32[r5>>2]);if((_fwrite(r3,1,4,r1)|0)!=4){r23=1;STACKTOP=r4;return r23}_fflush(r1);r23=0;STACKTOP=r4;return r23}function _psi_save_chunk(r1,r2,r3,r4){var r5,r6,r7,r8;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8|0;_psi_set_uint32_be(r7,0,r2);_psi_set_uint32_be(r7,4,r3);HEAP32[r6>>2]=0;if((_psi_write_crc(r1,r7,8,r6)|0)!=0){r8=1;STACKTOP=r5;return r8}if((r3|0)!=0?(_psi_write_crc(r1,r4,r3,r6)|0)!=0:0){r8=1;STACKTOP=r5;return r8}_psi_set_uint32_be(r7,0,HEAP32[r6>>2]);r8=(_fwrite(r7,1,4,r1)|0)!=4|0;STACKTOP=r5;return r8}function _psi_probe_psi_fp(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2|0;if((_psi_read_ofs(r1,0,r3,4)|0)!=0){r4=0;STACKTOP=r2;return r4}r4=(_psi_get_uint32_be(r3,0)|0)==1347635488|0;STACKTOP=r2;return r4}function _psi_write_crc(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;if((r4|0)==0){r5=_fwrite(r2,1,r3,r1);r6=(r5|0)!=(r3|0);r7=r6&1;return r7}r8=HEAP32[r4>>2];if((HEAP32[58320>>2]|0)==0){r9=0;while(1){r10=r9<<25;r11=(r9&128|0)!=0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;r12=(r11|0)<0?r10^517762881:r10;r10=r12<<1;r11=(r12|0)<0?r10^517762881:r10;r10=r11<<1;HEAP32[58328+(r9<<2)>>2]=(r11|0)<0?r10^517762881:r10;r10=r9+1|0;if(r10>>>0<256){r9=r10}else{break}}HEAP32[58320>>2]=1}if((r3|0)==0){r13=r8}else{r9=r3;r10=r8;r8=r2;while(1){r11=HEAP32[58328+((HEAPU8[r8]^r10>>>24)<<2)>>2]^r10<<8;r12=r9-1|0;if((r12|0)==0){r13=r11;break}else{r9=r12;r10=r11;r8=r8+1|0}}}HEAP32[r4>>2]=r13;r5=_fwrite(r2,1,r3,r1);r6=(r5|0)!=(r3|0);r7=r6&1;return r7}function _psi_save_sector(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r7=STACKTOP;STACKTOP=STACKTOP+48|0;r8=r7;r9=r7+8;r10=r7+32;r11=r7+40;r12=(r5|0)!=0?2:0;r5=r2+10|0;if((_psi_sct_uniform(r2)|0)==0){r13=r12}else{r13=(HEAP16[r5>>1]|0)!=0|r12}r12=r2+12|0;r14=HEAP32[r12>>2]<<1&4|r13;r15=r11|0;_psi_set_uint16_be(r15,0,r3);HEAP8[r11+2|0]=r4;r16=r2+8|0;HEAP8[r11+3|0]=HEAP16[r16>>1];_psi_set_uint16_be(r15,4,HEAPU16[r5>>1]);HEAP8[r11+6|0]=r14;r14=r11+7|0;HEAP8[r14]=0;r11=(r13&1|0)==0;if(!r11){HEAP8[r14]=HEAP8[HEAP32[r2+24>>2]]}if((_psi_save_chunk(r1,1397048148,8,r15)|0)!=0){r17=1;STACKTOP=r7;return r17}r15=r10|0;r14=r2+16|0;r13=HEAP16[r14>>1];do{if((r13&4095)==1){r18=_psi_sct_get_mfm_size(r2);r19=HEAP16[r2+4>>1];if((r19&65535|0)==(r3|0)){r20=(HEAPU16[r2+6>>1]|0)!=(r4|0)|0}else{r20=1}if(r18>>>0>8){r21=1}else{r21=(HEAPU16[r5>>1]|0)!=(128<<r18|0)|0}r22=HEAP32[r12>>2];r23=HEAP16[r14>>1];r24=r23&65535;if((r21|r20|(r22&13|0)!=0|(r24|0)!=(r6|0)|0)!=0){HEAP8[r15]=r19;HEAP8[r10+1|0]=HEAP16[r2+6>>1];HEAP8[r10+2|0]=HEAP16[r16>>1];HEAP8[r10+3|0]=r18;HEAP8[r10+4|0]=r22&15;if((r24|0)==1){HEAP8[r10+5|0]=0}else if((r24|0)==32769){HEAP8[r10+5|0]=1}else{HEAP8[r10+5|0]=0}if((_psi_save_chunk(r1,1229081926,6,r15)|0)==0){r25=HEAP16[r14>>1];break}else{r17=1;STACKTOP=r7;return r17}}else{r25=r23}}else{r25=r13}}while(0);do{if((r25&4095)==2){r13=_psi_sct_get_mfm_size(r2);r20=HEAP16[r2+4>>1];if((r20&65535|0)==(r3|0)){r26=(HEAPU16[r2+6>>1]|0)!=(r4|0)|0}else{r26=1}if(r13>>>0>8){r27=1}else{r27=(HEAPU16[r5>>1]|0)!=(128<<r13|0)|0}r21=HEAP32[r12>>2];r23=HEAP16[r14>>1];r24=r23&65535;if((r27|r26|(r21&13|0)!=0|(r24|0)!=(r6|0)|0)!=0){HEAP8[r15]=r20;HEAP8[r10+1|0]=HEAP16[r2+6>>1];HEAP8[r10+2|0]=HEAP16[r16>>1];HEAP8[r10+3|0]=r13;HEAP8[r10+4|0]=r21&15;if((r24|0)==32770){HEAP8[r10+5|0]=1}else if((r24|0)==2){HEAP8[r10+5|0]=0}else if((r24|0)==16386){HEAP8[r10+5|0]=2}else{HEAP8[r10+5|0]=0}if((_psi_save_chunk(r1,1229081933,6,r15)|0)==0){r28=HEAP16[r14>>1];break}else{r17=1;STACKTOP=r7;return r17}}else{r28=r23}}else{r28=r25}}while(0);r25=r9|0;if((r28&4095)==3){r14=r2+4|0;if((HEAPU16[r14>>1]|0)==(r3|0)){r29=(HEAPU16[r2+6>>1]|0)!=(r4|0)|0}else{r29=1}r4=r29|(r28&65535|0)!=(r6|0)|(HEAP32[r12>>2]&9|0)!=0;r6=r9+6|0;if((_psi_sct_get_tags(r2,r6,12)|0)==0){r30=r4}else{r30=(HEAP8[r6]|0)!=0|r4|(HEAP8[r9+7|0]|0)!=0|(HEAP8[r9+8|0]|0)!=0|(HEAP8[r9+9|0]|0)!=0|(HEAP8[r9+10|0]|0)!=0|(HEAP8[r9+11|0]|0)!=0|(HEAP8[r9+12|0]|0)!=0|(HEAP8[r9+13|0]|0)!=0|(HEAP8[r9+14|0]|0)!=0|(HEAP8[r9+15|0]|0)!=0|(HEAP8[r9+16|0]|0)!=0|(HEAP8[r9+17|0]|0)!=0}if((r30|0)!=0){_psi_set_uint16_be(r25,0,HEAPU16[r14>>1]);HEAP8[r9+2|0]=HEAP16[r2+6>>1];HEAP8[r9+3|0]=HEAP16[r16>>1];HEAP8[r9+4|0]=_psi_sct_get_gcr_format(r2);r16=HEAP32[r12>>2];HEAP8[r9+5|0]=r16>>>1&4|r16&3;if((_psi_save_chunk(r1,1296122695,18,r25)|0)!=0){r17=1;STACKTOP=r7;return r17}}}r25=r8|0;r8=_psi_sct_get_position(r2);if((r8|0)!=-1?(_psi_set_uint32_be(r25,0,r8),(_psi_save_chunk(r1,1330005587,4,r25)|0)!=0):0){r17=1;STACKTOP=r7;return r17}r8=_psi_sct_get_read_time(r2);if(((r8|0)!=0?(r8|0)!=(HEAPU16[r5>>1]<<3|0):0)?(_psi_set_uint32_be(r25,0,r8),(_psi_save_chunk(r1,1414090053,4,r25)|0)!=0):0){r17=1;STACKTOP=r7;return r17}if(r11){r11=HEAP16[r5>>1];if(r11<<16>>16!=0?(_psi_save_chunk(r1,1145132097,r11&65535,HEAP32[r2+24>>2])|0)!=0:0){r17=1;STACKTOP=r7;return r17}}r17=0;STACKTOP=r7;return r17}function _psi_load_st(r1){var r2,r3;r2=_psi_img_new();if((r2|0)!=0){if((_raw_load_fp(r1,r2,29056)|0)==0){r3=r2}else{_psi_img_del(r2);r3=0}}else{r3=0}return r3}function _raw_load_fp(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r4=0;r5=_ftell(r1);if((_fseek(r1,0,2)|0)!=0){r6=1;return r6}r7=_ftell(r1);if((_fseek(r1,r5,0)|0)!=0){r6=1;return r6}r5=HEAP32[r3>>2];if((r5|0)==0){r6=1;return r6}else{r8=r3;r9=r5}while(1){r5=r8+24|0;if((r9|0)==(r7|0)){break}r3=HEAP32[r5>>2];if((r3|0)==0){r6=1;r4=19;break}else{r8=r5;r9=r3}}if(r4==19){return r6}if((r8|0)==0){r6=1;return r6}r9=r8+4|0;r7=HEAP32[r9>>2];if((r7|0)==0){r6=0;return r6}r3=r8+8|0;r5=r8+12|0;r10=r8+16|0;r11=r8+20|0;r8=0;r12=HEAP32[r3>>2];r13=r7;L21:while(1){if((r12|0)==0){r14=0;r15=r13}else{r7=0;while(1){r16=_psi_img_get_track(r2,r8,r7,1);if((r16|0)==0){r6=1;r4=19;break L21}else{r17=0}while(1){if(r17>>>0>=HEAP32[r5>>2]>>>0){break}r18=r17+1|0;r19=_psi_sct_new(r8,r7,r18,HEAP32[r10>>2]);if((r19|0)==0){r6=1;r4=19;break L21}_psi_sct_set_encoding(r19,HEAP32[r11>>2]);if((_psi_trk_add_sector(r16,r19)|0)!=0){r4=14;break L21}r20=_fread(HEAP32[r19+24>>2],1,HEAP32[r10>>2],r1);if((r20|0)==(HEAP32[r10>>2]|0)){r17=r18}else{r6=1;r4=19;break L21}}r16=r7+1|0;r21=HEAP32[r3>>2];if(r16>>>0<r21>>>0){r7=r16}else{break}}r14=r21;r15=HEAP32[r9>>2]}r7=r8+1|0;if(r7>>>0<r15>>>0){r8=r7;r12=r14;r13=r15}else{r6=0;r4=19;break}}if(r4==14){_psi_sct_del(r19);r6=1;return r6}else if(r4==19){return r6}}function _psi_load_raw(r1){var r2,r3;r2=_psi_img_new();if((r2|0)!=0){if((_raw_load_fp(r1,r2,29704)|0)==0){r3=r2}else{_psi_img_del(r2);r3=0}}else{r3=0}return r3}function _psi_save_st(r1,r2){return _psi_save_raw(r1,r2)}function _psi_save_raw(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=r2|0;r4=HEAP16[r3>>1];L1:do{if(r4<<16>>16!=0){r5=r2+4|0;r6=0;r7=r4;L3:while(1){r8=HEAP32[HEAP32[r5>>2]+(r6<<2)>>2];r9=r8+2|0;if((HEAP16[r9>>1]|0)==0){r10=r7}else{r11=r8+4|0;r8=0;while(1){r12=HEAP32[HEAP32[r11>>2]+(r8<<2)>>2];r13=r12+2|0;r14=HEAP16[r13>>1];L9:do{if(r14<<16>>16!=0){r15=HEAP32[r12+4>>2];r16=r14&65535;r17=0;r18=65535;r19=0;while(1){r20=HEAP32[r15+(r17<<2)>>2];r21=HEAPU16[r20+8>>1];r22=r21>>>0<r18>>>0;r23=r22?r20:r19;r20=r17+1|0;if(r20>>>0<r16>>>0){r17=r20;r18=r22?r21:r18;r19=r23}else{break}}if((r23|0)!=0){r19=r12+4|0;r18=r23;r17=r23;while(1){r16=HEAPU16[r18+8>>1]+1|0;r15=r17+10|0;r21=_fwrite(HEAP32[r17+24>>2],1,HEAPU16[r15>>1],r1);if((r21|0)!=(HEAPU16[r15>>1]|0)){r24=1;break L3}r15=HEAP16[r13>>1];if(r15<<16>>16==0){break L9}r21=HEAP32[r19>>2];r22=r15&65535;r15=0;r20=65535;r25=0;while(1){r26=HEAP32[r21+(r15<<2)>>2];r27=HEAPU16[r26+8>>1];r28=r27>>>0>=r16>>>0&r27>>>0<r20>>>0;r29=r28?r26:r25;r26=r15+1|0;if(r26>>>0<r22>>>0){r15=r26;r20=r28?r27:r20;r25=r29}else{break}}if((r29|0)==0){break L9}r18=r29;r17=r29}}}}while(0);r13=r8+1|0;if(r13>>>0<HEAPU16[r9>>1]>>>0){r8=r13}else{break}}r10=HEAP16[r3>>1]}r8=r6+1|0;if(r8>>>0<(r10&65535)>>>0){r6=r8;r7=r10}else{break L1}}return r24}}while(0);_fflush(r1);r24=0;return r24}function _psi_probe_raw_fp(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=0;if((_fseek(r1,0,2)|0)!=0){r3=0;return r3}r4=_ftell(r1);r1=HEAP32[29704>>2];L4:do{if((r1|0)==0){r2=5}else{r5=29704;r6=r1;while(1){r7=r5+24|0;if((r6|0)==(r4|0)){r8=r5;break L4}r9=HEAP32[r7>>2];if((r9|0)==0){r2=5;break}else{r5=r7;r6=r9}}}}while(0);L8:do{if(r2==5){r1=HEAP32[29056>>2];if((r1|0)==0){r8=0}else{r6=29056;r5=r1;while(1){r1=r6+24|0;if((r5|0)==(r4|0)){r8=r6;break L8}r9=HEAP32[r1>>2];if((r9|0)==0){r8=0;break}else{r6=r1;r5=r9}}}}}while(0);r3=(r8|0)!=0|0;return r3}function _psi_load_stx(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4;r6=r4+16;r7=r4+32;r8=_psi_img_new();if((r8|0)==0){r9=0;STACKTOP=r4;return r9}r10=r7|0;L4:do{if((_psi_read_ofs(r1,0,r10,16)|0)==0){if((_psi_get_uint32_be(r10,0)|0)!=1381193984){_fwrite(56544,15,1,HEAP32[_stderr>>2]);break}r11=HEAP8[r7+10|0];r12=r11&255;if(r11<<24>>24==0){r9=r8;STACKTOP=r4;return r9}r11=r6|0;r13=r6+14|0;r14=r5|0;r15=r5+8|0;r16=r5+9|0;r17=r5+10|0;r18=r5+11|0;r19=r5+14|0;r20=16;r21=0;L12:while(1){if((_psi_read_ofs(r1,r20,r11,16)|0)!=0){r2=8;break}r22=_psi_get_uint32_le(r11,0);r23=_psi_get_uint32_le(r11,4);r24=_psi_get_uint16_le(r11,8);r25=_psi_get_uint16_le(r11,10);r26=HEAPU8[r13];r27=r26&127;r28=r26>>>7;r26=r20+16|0;r29=(r24<<4)+r26|0;r30=r29+r23|0;r23=_psi_img_get_track(r8,r27,r28,1);if((r23|0)==0){break L4}r31=(r24|0)==0;if((r25&1|0)==0){if(!r31){r25=r26;r32=0;while(1){r33=r32+1|0;r34=_psi_sct_new(r27,r28,r33,512);if((r34|0)==0){break L4}_psi_trk_add_sector(r23,r34);if((_psi_read_ofs(r1,r25,HEAP32[r34+24>>2],512)|0)!=0){break L4}if(r33>>>0<r24>>>0){r25=r25+512|0;r32=r33}else{break}}}}else{if(!r31){r32=r29;r25=r26;r28=0;while(1){if((_psi_read_ofs(r1,r25,r14,16)|0)!=0){r2=14;break L12}r27=_psi_get_uint32_le(r14,0);r33=_psi_get_uint16_le(r14,4);r34=_psi_get_uint16_le(r14,6);r35=HEAP8[r15];r36=HEAP8[r16];r37=HEAP8[r17];r38=HEAP8[r18];r39=_psi_get_uint16_be(r14,12);r40=HEAP8[r19];r41=45616;r42=4;r43=r15;while(1){r44=HEAPU8[r43]<<8^r41;r45=r44<<1;r46=(r44&32768|0)==0?r45:r45^4129;r45=r46<<1;r44=(r46&32768|0)==0?r45:r45^4129;r45=r44<<1;r46=(r44&32768|0)==0?r45:r45^4129;r45=r46<<1;r44=(r46&32768|0)==0?r45:r45^4129;r45=r44<<1;r46=(r44&32768|0)==0?r45:r45^4129;r45=r46<<1;r44=(r46&32768|0)==0?r45:r45^4129;r45=r44<<1;r46=(r44&32768|0)==0?r45:r45^4129;r45=r46<<1;r47=(r46&32768|0)==0?r45:r45^4129;r45=r42-1|0;if((r45|0)==0){break}else{r41=r47;r42=r45;r43=r43+1|0}}r48=r36&255;r49=r35&255;r50=r37&255;r43=r40&255;r42=128<<(r38&3);r41=_psi_sct_new(r49,r48,r50,r42);if((r41|0)==0){break L4}_psi_trk_add_sector(r23,r41);_psi_sct_set_position(r41,r33);_psi_sct_set_mfm_size(r41,r38);_psi_sct_set_read_time(r41,(r34+2|0)>>>2);if((r43&8|0)!=0){_psi_sct_set_flags(r41,2,1)}if((r39|0)!=(r47&65535|0)){_psi_sct_set_flags(r41,1,1)}if((r43&16|0)==0){if((_psi_read_ofs(r1,r30+r27|0,HEAP32[r41+24>>2],r42)|0)!=0){r2=25;break L12}}else{_psi_sct_set_size(r41,0,0);_psi_sct_set_flags(r41,8,1);_psi_sct_set_read_time(r41,0)}if((r43&128|0)==0){r51=r32}else{r43=_psi_sct_clone(r41,0);if((r43|0)==0){break L4}r45=r43+24|0;if((_psi_read_ofs(r1,r32,HEAP32[r45>>2],HEAPU16[r43+10>>1])|0)!=0){break L4}r46=r41+10|0;if((HEAP16[r46>>1]|0)!=0){r44=r41+24|0;r52=0;while(1){r53=HEAP32[r45>>2]+r52|0;HEAP8[r53]=HEAP8[r53]^~HEAP8[HEAP32[r44>>2]+r52|0];r53=r52+1|0;if(r53>>>0<HEAPU16[r46>>1]>>>0){r52=r53}else{break}}}_psi_sct_add_alternate(r41,r43);r51=r42+r32|0}r52=r28+1|0;if(r52>>>0<r24>>>0){r32=r51;r25=r25+16|0;r28=r52}else{break}}}}r28=r21+1|0;if(r28>>>0<r12>>>0){r20=r22+r20|0;r21=r28}else{r9=r8;r2=39;break}}if(r2==8){_fwrite(49984,31,1,HEAP32[_stderr>>2]);break}else if(r2==14){_fwrite(46080,32,1,HEAP32[_stderr>>2]);break}else if(r2==25){r21=HEAP32[_stderr>>2];_fprintf(r21,39504,(r3=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r3>>2]=r49,HEAP32[r3+8>>2]=r48,HEAP32[r3+16>>2]=r50,r3));STACKTOP=r3;_fwrite(36552,30,1,r21);break}else if(r2==39){STACKTOP=r4;return r9}}}while(0);_psi_img_del(r8);r9=0;STACKTOP=r4;return r9}function _psi_save_stx(r1,r2){return 1}function _psi_probe_stx_fp(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r3=r2|0;if((_psi_read_ofs(r1,0,r3,8)|0)!=0){r4=0;STACKTOP=r2;return r4}r4=(_psi_get_uint32_be(r3,0)|0)==1381193984|0;STACKTOP=r2;return r4}function _psi_load_tc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+65616|0;r5=r4+8;r6=r4+16;r7=r4+24;r8=r4+32;r9=r4+40;r10=r4+48;r11=r4+56;r12=_psi_img_new();if((r12|0)==0){r13=0;STACKTOP=r4;return r13}r14=r11|0;HEAP32[r14>>2]=r1;r1=r11+65540|0;r15=r1;HEAP32[r15>>2]=0;HEAP32[r15+4>>2]=0;HEAP32[r15+8>>2]=0;HEAP32[r15+12>>2]=0;r15=r4|0;r16=r11+65544|0;r17=r11+65554|0;r18=r11+65548|0;r19=HEAP32[_stderr>>2];r20=r6|0;r21=r6+1|0;r22=r6+2|0;r23=r6+3|0;r24=r6+4|0;r25=r6+5|0;r6=r11+65552|0;r26=r5|0;r27=r5+1|0;r5=r11+4|0;r28=0;L4:while(1){r29=r28<<1;r30=0;while(1){HEAP32[r16>>2]=0;HEAP32[r1>>2]=0;HEAP8[r17]=0;r31=HEAP32[r14>>2];r32=r30+r29<<1;if((_fseek(r31,r32+773|0,0)|0)!=0){break L4}if((_fread(r15,1,2,r31)|0)!=2){break L4}r33=_psi_get_uint16_be(r15,0)<<8;if((r33|0)!=0){if((_fseek(r31,r32+1285|0,0)|0)!=0){break L4}if((_fread(r15,1,2,r31)|0)!=2){break L4}r32=_psi_get_uint16_le(r15,0);if((_fseek(r31,r33,0)|0)!=0){break L4}if((_fread(r5,1,r32,r31)|0)!=(r32|0)){break L4}HEAP32[r16>>2]=0;r31=r32<<3;HEAP32[r1>>2]=r31;if((r31|0)!=0){r31=0;while(1){HEAP32[r18>>2]=0;HEAP32[r16>>2]=0;L18:while(1){do{if((_mfm_sync_mark(r11,r10,r9)|0)==0){if((r31|0)==0){if((HEAP32[r9>>2]|0)!=0){break}}else if((r31|0)==1?(HEAP32[r9>>2]|0)==0:0){break}if((HEAP32[r18>>2]|0)!=0){break L18}r32=HEAPU8[r10];r33=HEAP32[r9>>2];r34=HEAP32[r16>>2];if((r32|0)==254){_mfm_read_byte(r11,r20);_mfm_read_byte(r11,r21);_mfm_read_byte(r11,r22);_mfm_read_byte(r11,r23);_mfm_read_byte(r11,r24);_mfm_read_byte(r11,r25);r35=_psi_get_uint16_be(r20,4);r36=HEAPU16[r6>>1];r37=4;r38=r20;while(1){r39=HEAPU8[r38]<<8^r36;r40=r39<<1;r41=(r39&32768|0)==0?r40:r40^4129;r40=r41<<1;r39=(r41&32768|0)==0?r40:r40^4129;r40=r39<<1;r41=(r39&32768|0)==0?r40:r40^4129;r40=r41<<1;r39=(r41&32768|0)==0?r40:r40^4129;r40=r39<<1;r41=(r39&32768|0)==0?r40:r40^4129;r40=r41<<1;r39=(r41&32768|0)==0?r40:r40^4129;r40=r39<<1;r41=(r39&32768|0)==0?r40:r40^4129;r40=r41<<1;r42=(r41&32768|0)==0?r40:r40^4129;r40=r37-1|0;if((r40|0)==0){break}else{r36=r42;r37=r40;r38=r38+1|0}}HEAP16[r6>>1]=r42;r38=HEAP8[r23];r37=_psi_sct_new(HEAPU8[r20],HEAPU8[r21],HEAPU8[r22],(r38&255)<6?128<<(r38&255):8192);if((r37|0)==0){break L4}_psi_sct_set_mfm_size(r37,HEAP8[r23]);_psi_sct_set_flags(r37,8,1);if((r42&65535|0)!=(r35|0)){_psi_sct_set_flags(r37,1,1)}_psi_sct_fill(r37,0);if((r33|0)==0){_psi_sct_set_encoding(r37,2)}else{_psi_sct_set_encoding(r37,1)}_psi_img_add_sector(r12,r37,r28,r30);if((_mfm_sync_mark(r11,r8,r7)|0)==0){r38=HEAP8[r8];if(r38<<24>>24==-8|r38<<24>>24==-5){r36=r37+24|0;r40=HEAP32[r36>>2];r41=r37+10|0;r39=HEAP16[r41>>1];r43=r39&65535;if(r39<<16>>16!=0){r44=0;while(1){_mfm_read_byte(r11,r40+r44|0);r45=r44+1|0;if(r45>>>0<r43>>>0){r44=r45}else{break}}if(r39<<16>>16!=(HEAP16[r41>>1]|0)){break L4}}_mfm_read_byte(r11,r26);_mfm_read_byte(r11,r27);_psi_sct_set_flags(r37,8,0);_psi_sct_set_flags(r37,4,r38<<24>>24==-8|0);r44=_psi_get_uint16_be(r26,0);r43=HEAPU16[r6>>1];r40=HEAP16[r41>>1];if(r40<<16>>16==0){r46=r43}else{r35=r43;r43=r40&65535;r40=HEAP32[r36>>2];while(1){r45=HEAPU8[r40]<<8^r35;r47=r45<<1;r48=(r45&32768|0)==0?r47:r47^4129;r47=r48<<1;r45=(r48&32768|0)==0?r47:r47^4129;r47=r45<<1;r48=(r45&32768|0)==0?r47:r47^4129;r47=r48<<1;r45=(r48&32768|0)==0?r47:r47^4129;r47=r45<<1;r48=(r45&32768|0)==0?r47:r47^4129;r47=r48<<1;r45=(r48&32768|0)==0?r47:r47^4129;r47=r45<<1;r48=(r45&32768|0)==0?r47:r47^4129;r47=r48<<1;r45=(r48&32768|0)==0?r47:r47^4129;r47=r43-1|0;if((r47|0)==0){r46=r45;break}else{r35=r45;r43=r47;r40=r40+1|0}}}HEAP16[r6>>1]=r46;if((r46&65535|0)!=(r44|0)){_psi_sct_set_flags(r37,2,1)}}}}else if(!((r32|0)==248|(r32|0)==251)){r40=HEAP32[r1>>2];_fprintf(r19,52656,(r3=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r3>>2]=r32,HEAP32[r3+8>>2]=(r33|0)!=0?56528:49976,HEAP32[r3+16>>2]=r28,HEAP32[r3+24>>2]=r30,HEAP32[r3+32>>2]=r34,HEAP32[r3+40>>2]=r40,r3));STACKTOP=r3}HEAP32[r18>>2]=0;HEAP32[r16>>2]=r34}}while(0);if((HEAP32[r18>>2]|0)!=0){break}}r40=r31+1|0;if((_psi_img_get_sector(r12,r28,r30,0,1)|0)==0&r40>>>0<2){r31=r40}else{break}}}}r31=r30+1|0;if(r31>>>0<2){r30=r31}else{break}}r30=r28+1|0;if(r30>>>0<80){r28=r30}else{r13=r12;r2=44;break}}if(r2==44){STACKTOP=r4;return r13}_psi_img_del(r12);r13=0;STACKTOP=r4;return r13}function _mfm_sync_mark(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=0;HEAP32[r3>>2]=0;HEAP8[r2]=0;r5=r1+65554|0;HEAP8[r5]=0;r6=r1+65548|0;r7=HEAP32[r6>>2];r8=r7+2|0;r9=r1+65544|0;r10=r1+65555|0;r11=HEAP32[r1+65540>>2];r12=0;r13=HEAP32[r9>>2];r14=r7;while(1){r7=(HEAPU8[(r13>>>3)+(r1+4)|0]&128>>>((r13&7)>>>0)|0)!=0|0;r15=r13+1|0;HEAP32[r9>>2]=r15;if(r15>>>0<r11>>>0){r16=r15;r17=r14}else{HEAP32[r9>>2]=0;r15=r14+1|0;HEAP32[r6>>2]=r15;r16=0;r17=r15}HEAP8[r10]=(HEAP8[r10]|0)==0|0;r15=r7|r12<<1;r7=r15&65535;if((r7|0)==63338){r4=6;break}else if((r7|0)==17545){r4=5;break}else if((r7|0)==62846){r4=7;break}else if((r7|0)==62826){r4=9;break}else if((r7|0)==62831){r4=8;break}if((HEAP8[r2]|0)!=0){break}if(r17>>>0<r8>>>0){r12=r15;r13=r16;r14=r17}else{r18=1;r4=16;break}}if(r4==5){HEAP8[r2]=-95}else if(r4==6){HEAP8[r2]=-4}else if(r4==7){HEAP8[r2]=-2}else if(r4==8){HEAP8[r2]=-5}else if(r4==9){HEAP8[r2]=-8}else if(r4==16){return r18}HEAP8[r5]=1;HEAP8[r10]=1;r10=HEAPU8[r2]<<8^65535;r5=r10<<1;r17=(r10&32768|0)==0?r5:r5^4129;r5=r17<<1;r10=(r17&32768|0)==0?r5:r5^4129;r5=r10<<1;r17=(r10&32768|0)==0?r5:r5^4129;r5=r17<<1;r10=(r17&32768|0)==0?r5:r5^4129;r5=r10<<1;r17=(r10&32768|0)==0?r5:r5^4129;r5=r17<<1;r10=(r17&32768|0)==0?r5:r5^4129;r5=r10<<1;r17=(r10&32768|0)==0?r5:r5^4129;r5=r17<<1;r10=r1+65552|0;HEAP16[r10>>1]=(r17&32768|0)==0?r5:r5^4129;if((HEAP8[r2]|0)==-95){r19=0}else{HEAP32[r3>>2]=1;r18=0;return r18}while(1){_mfm_read_byte(r1,r2);r3=HEAPU8[r2]<<8^HEAPU16[r10>>1];r5=r3<<1;r17=(r3&32768|0)==0?r5:r5^4129;r5=r17<<1;r3=(r17&32768|0)==0?r5:r5^4129;r5=r3<<1;r17=(r3&32768|0)==0?r5:r5^4129;r5=r17<<1;r3=(r17&32768|0)==0?r5:r5^4129;r5=r3<<1;r17=(r3&32768|0)==0?r5:r5^4129;r5=r17<<1;r3=(r17&32768|0)==0?r5:r5^4129;r5=r3<<1;r17=(r3&32768|0)==0?r5:r5^4129;r5=r17<<1;HEAP16[r10>>1]=(r17&32768|0)==0?r5:r5^4129;if(r19>>>0>=2){r18=0;r4=16;break}if((HEAP8[r2]|0)==-95){r19=r19+1|0}else{r18=0;r4=16;break}}if(r4==16){return r18}}function _mfm_read_byte(r1,r2){var r3,r4,r5,r6,r7;HEAP8[r2]=0;r3=r1+65555|0;if((HEAP8[r3]|0)==0){r4=0}else{r5=r1+65544|0;r6=HEAP32[r5>>2]+1|0;HEAP32[r5>>2]=r6;if(r6>>>0>=HEAP32[r1+65540>>2]>>>0){HEAP32[r5>>2]=0;r5=r1+65548|0;HEAP32[r5>>2]=HEAP32[r5>>2]+1}HEAP8[r3]=0;r4=HEAP8[r2]<<1}HEAP8[r2]=r4;if((_mfm_read_bit(r1)|0)!=0){HEAP8[r2]=HEAP8[r2]|1}_mfm_read_bit(r1);HEAP8[r2]=HEAP8[r2]<<1;if((_mfm_read_bit(r1)|0)!=0){HEAP8[r2]=HEAP8[r2]|1}_mfm_read_bit(r1);HEAP8[r2]=HEAP8[r2]<<1;if((_mfm_read_bit(r1)|0)!=0){HEAP8[r2]=HEAP8[r2]|1}_mfm_read_bit(r1);HEAP8[r2]=HEAP8[r2]<<1;if((_mfm_read_bit(r1)|0)!=0){HEAP8[r2]=HEAP8[r2]|1}_mfm_read_bit(r1);HEAP8[r2]=HEAP8[r2]<<1;if((_mfm_read_bit(r1)|0)!=0){HEAP8[r2]=HEAP8[r2]|1}_mfm_read_bit(r1);HEAP8[r2]=HEAP8[r2]<<1;if((_mfm_read_bit(r1)|0)!=0){HEAP8[r2]=HEAP8[r2]|1}_mfm_read_bit(r1);HEAP8[r2]=HEAP8[r2]<<1;if((_mfm_read_bit(r1)|0)!=0){HEAP8[r2]=HEAP8[r2]|1}_mfm_read_bit(r1);HEAP8[r2]=HEAP8[r2]<<1;if((_mfm_read_bit(r1)|0)==0){r7=_mfm_read_bit(r1);return}HEAP8[r2]=HEAP8[r2]|1;r7=_mfm_read_bit(r1);return}function _mfm_read_bit(r1){var r2,r3,r4,r5;r2=r1+65544|0;r3=HEAP32[r2>>2];r4=(HEAPU8[(r3>>>3)+(r1+4)|0]&128>>>((r3&7)>>>0)|0)!=0|0;r5=r3+1|0;HEAP32[r2>>2]=r5;if(r5>>>0>=HEAP32[r1+65540>>2]>>>0){HEAP32[r2>>2]=0;r2=r1+65548|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1}r2=r1+65555|0;HEAP8[r2]=(HEAP8[r2]|0)==0|0;return r4}function _psi_load_td0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+32;r9=_psi_img_new();if((r9|0)==0){r10=0;STACKTOP=r4;return r10}r11=r8|0;L4:do{if((_psi_read(r1,r11,12)|0)==0){r12=HEAP8[r11];if(r12<<24>>24==116){if((HEAP8[r8+1|0]|0)!=100){break}_fwrite(56464,40,1,HEAP32[_stderr>>2]);break}else if(r12<<24>>24!=84){break}if(((HEAP8[r8+1|0]|0)==68?(HEAP8[r8+2|0]|0)==0:0)?HEAPU8[r8+4|0]<=21:0){r12=HEAP8[r8+5|0];r13=HEAP8[r8+7|0];r14=_psi_get_uint16_le(r11,10);r15=0;r16=10;r17=r11;while(1){r18=HEAPU8[r17]<<8^r15;r19=r18<<1;r20=(r18&32768|0)==0?r19:r19^41111;r19=r20<<1;r18=(r20&32768|0)==0?r19:r19^41111;r19=r18<<1;r20=(r18&32768|0)==0?r19:r19^41111;r19=r20<<1;r18=(r20&32768|0)==0?r19:r19^41111;r19=r18<<1;r20=(r18&32768|0)==0?r19:r19^41111;r19=r20<<1;r18=(r20&32768|0)==0?r19:r19^41111;r19=r18<<1;r20=(r18&32768|0)==0?r19:r19^41111;r19=r20<<1;r21=(r20&32768|0)==0?r19:r19^41111;r19=r16-1|0;if((r19|0)==0){break}else{r15=r21;r16=r19;r17=r17+1|0}}r17=r21&65535;if((r14|0)!=(r17|0)){_fprintf(HEAP32[_stderr>>2],49928,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r14,HEAP32[r3+8>>2]=r17,r3));STACKTOP=r3;break}r17=r7|0;if(r13<<24>>24<0){if((_psi_read(r1,r17,10)|0)!=0){break}r16=_psi_get_uint16_le(r17,0);r15=0;r19=8;r20=r7+2|0;while(1){r18=HEAPU8[r20]<<8^r15;r22=r18<<1;r23=(r18&32768|0)==0?r22:r22^41111;r22=r23<<1;r18=(r23&32768|0)==0?r22:r22^41111;r22=r18<<1;r23=(r18&32768|0)==0?r22:r22^41111;r22=r23<<1;r18=(r23&32768|0)==0?r22:r22^41111;r22=r18<<1;r23=(r18&32768|0)==0?r22:r22^41111;r22=r23<<1;r18=(r23&32768|0)==0?r22:r22^41111;r22=r18<<1;r23=(r18&32768|0)==0?r22:r22^41111;r22=r23<<1;r24=(r23&32768|0)==0?r22:r22^41111;r22=r19-1|0;if((r22|0)==0){break}else{r15=r24;r19=r22;r20=r20+1|0}}r20=r24&65535;r19=_psi_get_uint16_le(r17,2);if((r19|0)==0){r25=r20}else{r15=_malloc(r19);if((r15|0)==0){break}if((_psi_read(r1,r15,r19)|0)==0){r26=r20;r27=r19;r28=r15}else{_free(r15);break}while(1){r20=HEAPU8[r28]<<8^r26;r13=r20<<1;r14=(r20&32768|0)==0?r13:r13^41111;r13=r14<<1;r20=(r14&32768|0)==0?r13:r13^41111;r13=r20<<1;r14=(r20&32768|0)==0?r13:r13^41111;r13=r14<<1;r20=(r14&32768|0)==0?r13:r13^41111;r13=r20<<1;r14=(r20&32768|0)==0?r13:r13^41111;r13=r14<<1;r20=(r14&32768|0)==0?r13:r13^41111;r13=r20<<1;r14=(r20&32768|0)==0?r13:r13^41111;r13=r14<<1;r29=(r14&32768|0)==0?r13:r13^41111;r13=r27-1|0;if((r13|0)==0){break}else{r26=r29;r27=r13;r28=r28+1|0}}r13=r29&65535;r14=0;while(1){r20=r14+1|0;if((HEAP8[r15+r14|0]|0)!=0){r30=r14;break}if(r20>>>0<r19>>>0){r14=r20}else{r30=r20;break}}r14=r19;while(1){if(r30>>>0>=r14>>>0){break}r20=r14-1|0;if((HEAP8[r15+r20|0]|0)==0){r14=r20}else{r31=r30;r2=28;break}}if(r2==28){while(1){r2=0;r19=r15+r31|0;if((HEAP8[r19]|0)==0){HEAP8[r19]=10}r19=r31+1|0;if(r19>>>0<r14>>>0){r31=r19;r2=28}else{break}}}_psi_img_set_comment(r9,r15+r30|0,r14-r30|0);_free(r15);_psi_img_clean_comment(r9);r25=r13}if((r16|0)!=(r25|0)){_fprintf(HEAP32[_stderr>>2],57296,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r16,HEAP32[r3+8>>2]=r25,r3));STACKTOP=r3;break}}if((_psi_read(r1,r17,1)|0)==0){r19=r7+1|0;r20=r7+3|0;r22=r6|0;r23=r6+2|0;r18=r6+3|0;r32=r6+4|0;r33=r6+1|0;r34=(r12&127)==2;r35=r6+5|0;r36=r5|0;r37=r5+2|0;r38=r5+3|0;r39=r5+1|0;r40=HEAP32[_stderr>>2];r41=r7+2|0;L51:while(1){if((HEAP8[r17]|0)==-1){r10=r9;r2=103;break}if((_psi_read(r1,r19,3)|0)!=0){break L4}r42=HEAP8[r17];r43=r42&255;r44=r43<<9;r45=(r43&128|0)==0?r44:r44^41111;r44=r45<<1;r46=(r45&32768|0)==0?r44:r44^41111;r44=r46<<1;r45=(r46&32768|0)==0?r44:r44^41111;r44=r45<<1;r46=(r45&32768|0)==0?r44:r44^41111;r44=r46<<1;r45=(r46&32768|0)==0?r44:r44^41111;r44=r45<<1;r46=(r45&32768|0)==0?r44:r44^41111;r44=r46<<1;r45=(r46&32768|0)==0?r44:r44^41111;r44=r45<<1;r47=HEAPU8[r19];r46=((r45&32768|0)==0?r44:r44^41111)^r47<<8;r44=r46<<1;r45=(r46&32768|0)==0?r44:r44^41111;r44=r45<<1;r46=(r45&32768|0)==0?r44:r44^41111;r44=r46<<1;r45=(r46&32768|0)==0?r44:r44^41111;r44=r45<<1;r46=(r45&32768|0)==0?r44:r44^41111;r44=r46<<1;r45=(r46&32768|0)==0?r44:r44^41111;r44=r45<<1;r46=(r45&32768|0)==0?r44:r44^41111;r44=r46<<1;r45=(r46&32768|0)==0?r44:r44^41111;r44=r45<<1;r46=HEAP8[r41];r48=r46&255;r49=((r45&32768|0)==0?r44:r44^41111)^r48<<8;r44=r49<<1;r45=(r49&32768|0)==0?r44:r44^41111;r44=r45<<1;r49=(r45&32768|0)==0?r44:r44^41111;r44=r49<<1;r45=(r49&32768|0)==0?r44:r44^41111;r44=r45<<1;r49=(r45&32768|0)==0?r44:r44^41111;r44=r49<<1;r45=(r49&32768|0)==0?r44:r44^41111;r44=r45<<1;r49=(r45&32768|0)==0?r44:r44^41111;r44=r49<<1;r45=(r49&32768|0)==0?r44:r44^41111;r44=r45<<1;r50=(r45&32768|0)==0?r44:r44^41111;r51=HEAPU8[r20];if((r51|0)!=(r50&255|0)){r2=40;break}r52=r48&127;if(r42<<24>>24!=0){r42=2-(((r46|r12)&255)>>>7)|0;r46=r34?r42|32768:r42;r42=0;while(1){if((_psi_read(r1,r22,6)|0)!=0){break L4}r53=HEAPU8[r23];r48=HEAP8[r18];r44=HEAPU8[r32];r45=(r48&255)<7;if(r45){r54=128<<(r48&255)}else{r54=0}r55=_psi_sct_new(HEAPU8[r22],HEAPU8[r33],r53,r54);if((r55|0)==0){break L4}_psi_sct_set_mfm_size(r55,HEAP8[r18]);if((_psi_img_add_sector(r9,r55,r47,r52)|0)!=0){r2=48;break L51}_psi_sct_set_encoding(r55,r46);if((r44&2|0)!=0){_psi_sct_set_flags(r55,2,1)}if((r44&4|0)!=0){_psi_sct_set_flags(r55,4,1)}r48=HEAP8[r35];r49=0;r56=5;r57=r22;while(1){r58=HEAPU8[r57]<<8^r49;r59=r58<<1;r60=(r58&32768|0)==0?r59:r59^41111;r59=r60<<1;r58=(r60&32768|0)==0?r59:r59^41111;r59=r58<<1;r60=(r58&32768|0)==0?r59:r59^41111;r59=r60<<1;r58=(r60&32768|0)==0?r59:r59^41111;r59=r58<<1;r60=(r58&32768|0)==0?r59:r59^41111;r59=r60<<1;r58=(r60&32768|0)==0?r59:r59^41111;r59=r58<<1;r60=(r58&32768|0)==0?r59:r59^41111;r59=r60<<1;r61=(r60&32768|0)==0?r59:r59^41111;r59=r56-1|0;if((r59|0)==0){break}else{r49=r61;r56=r59;r57=r57+1|0}}r62=r48&255;r57=r61&65535;if((r44&48|0)==0){do{if(r45){if((_psi_read(r1,r22,3)|0)!=0){break L4}r56=_psi_get_uint16_le(r22,0);if((r56|0)==0){r2=63;break L51}r49=r56-1|0;r63=HEAP8[r23];if(r63<<24>>24==1){if((r49|0)!=4){break L4}if((_psi_read(r1,r36,4)|0)!=0){break L4}r56=_psi_get_uint16_le(r36,0);r59=r55+10|0;if((r56<<1|0)!=(HEAPU16[r59>>1]|0)){break L4}if((r56|0)==0){r64=r59;break}r60=r55+24|0;r58=0;while(1){r65=r58<<1;HEAP8[HEAP32[r60>>2]+r65|0]=HEAP8[r37];HEAP8[HEAP32[r60>>2]+(r65|1)|0]=HEAP8[r38];r65=r58+1|0;if(r65>>>0<r56>>>0){r58=r65}else{r64=r59;break}}}else if(r63<<24>>24==0){r59=r55+10|0;if((HEAPU16[r59>>1]|0)!=(r49|0)){break L4}if((_psi_read(r1,HEAP32[r55+24>>2],r49)|0)==0){r64=r59;break}else{r2=67;break L51}}else if(r63<<24>>24==2){r59=r55+10|0;if((r49|0)==0){r66=0}else{r58=r55+24|0;r56=r49;r60=0;while(1){if(r56>>>0<2){break L4}if((_psi_read(r1,r36,2)|0)!=0){break L4}r65=r56-2|0;r67=HEAP8[r36];if(r67<<24>>24==0){r68=HEAPU8[r39];if(r68>>>0>r65>>>0){break L4}r69=r68+r60|0;if(r69>>>0>HEAPU16[r59>>1]>>>0){break L4}if((_psi_read(r1,HEAP32[r58>>2]+r60|0,r68)|0)!=0){break L4}r70=r69;r71=r65-r68|0}else if(r67<<24>>24==1){r67=HEAP8[r39];r68=r67&255;if(r65>>>0<2){break L4}r65=(r68<<1)+r60|0;if(r65>>>0>HEAPU16[r59>>1]>>>0){break L4}if((_psi_read(r1,r37,2)|0)!=0){break L4}r69=r56-4|0;if(r67<<24>>24==0){r70=r60;r71=r69}else{r67=r60;r72=r68;while(1){HEAP8[HEAP32[r58>>2]+r67|0]=HEAP8[r37];HEAP8[HEAP32[r58>>2]+(r67+1)|0]=HEAP8[r38];r68=r72-1|0;if((r68|0)==0){r70=r65;r71=r69;break}else{r67=r67+2|0;r72=r68}}}}else{break L4}if((r71|0)==0){r66=r70;break}else{r56=r71;r60=r70}}}if(r66>>>0<HEAPU16[r59>>1]>>>0){break L4}else{r64=r59;break}}else{r2=90;break L51}}else{r64=r55+10|0}}while(0);r45=HEAP16[r64>>1];if(r45<<16>>16==0){r73=0;r74=r57;r75=r57}else{r48=r45&65535;r45=HEAP32[r55+24>>2];r60=r57;r56=r48;r58=r45;while(1){r49=HEAPU8[r58]<<8^r60;r72=r49<<1;r67=(r49&32768|0)==0?r72:r72^41111;r72=r67<<1;r49=(r67&32768|0)==0?r72:r72^41111;r72=r49<<1;r67=(r49&32768|0)==0?r72:r72^41111;r72=r67<<1;r49=(r67&32768|0)==0?r72:r72^41111;r72=r49<<1;r67=(r49&32768|0)==0?r72:r72^41111;r72=r67<<1;r49=(r67&32768|0)==0?r72:r72^41111;r72=r49<<1;r67=(r49&32768|0)==0?r72:r72^41111;r72=r67<<1;r76=(r67&32768|0)==0?r72:r72^41111;r72=r56-1|0;if((r72|0)==0){r77=0;r78=r48;r79=r45;break}else{r60=r76;r56=r72;r58=r58+1|0}}while(1){r58=HEAPU8[r79]<<8^r77;r56=r58<<1;r60=(r58&32768|0)==0?r56:r56^41111;r56=r60<<1;r58=(r60&32768|0)==0?r56:r56^41111;r56=r58<<1;r60=(r58&32768|0)==0?r56:r56^41111;r56=r60<<1;r58=(r60&32768|0)==0?r56:r56^41111;r56=r58<<1;r60=(r58&32768|0)==0?r56:r56^41111;r56=r60<<1;r58=(r60&32768|0)==0?r56:r56^41111;r56=r58<<1;r60=(r58&32768|0)==0?r56:r56^41111;r56=r60<<1;r80=(r60&32768|0)==0?r56:r56^41111;r56=r78-1|0;if((r56|0)==0){break}else{r77=r80;r78=r56;r79=r79+1|0}}r73=r80;r74=r76;r75=r76&65535}if((r62|0)!=(r73&255|0)?(_fwrite(33520,33,1,r40),(r62|0)!=(r74&255|0)):0){r2=98;break L51}if((r44&64|0)!=0){r56=HEAPU16[r55+8>>1];_fprintf(r40,30760,(r3=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r3>>2]=r47,HEAP32[r3+8>>2]=r52,HEAP32[r3+16>>2]=r56,r3));STACKTOP=r3;_psi_img_remove_sector(r9,r55);_psi_sct_del(r55)}}else{if((r62|0)!=(r61&255|0)){r2=57;break L51}_psi_sct_fill(r55,(r44&16|0)!=0?246:0)}r56=r42+1|0;if(r56>>>0<r43>>>0){r42=r56}else{break}}}if((_psi_read(r1,r17,1)|0)!=0){break L4}}if(r2==40){_fprintf(HEAP32[_stderr>>2],46032,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r51,HEAP32[r3+8>>2]=r50&65535,r3));STACKTOP=r3;break}else if(r2==48){_psi_sct_del(r55);break}else if(r2==57){r17=HEAPU16[r55+8>>1];_fprintf(HEAP32[_stderr>>2],42552,(r3=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r3>>2]=r47,HEAP32[r3+8>>2]=r52,HEAP32[r3+16>>2]=r17,r3));STACKTOP=r3;break}else if(r2==63){_fprintf(HEAP32[_stderr>>2],39448,(r3=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r3>>2]=r47,HEAP32[r3+8>>2]=r52,HEAP32[r3+16>>2]=r53,r3));STACKTOP=r3;break}else if(r2==67){_fwrite(58080,16,1,HEAP32[_stderr>>2]);break}else if(r2==90){_fprintf(HEAP32[_stderr>>2],36496,(r3=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r3>>2]=r47,HEAP32[r3+8>>2]=r52,HEAP32[r3+16>>2]=r53,HEAP32[r3+24>>2]=r63&255,r3));STACKTOP=r3;break}else if(r2==98){r17=HEAPU16[r55+8>>1];_fprintf(r40,31704,(r3=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r3>>2]=r47,HEAP32[r3+8>>2]=r52,HEAP32[r3+16>>2]=r17,HEAP32[r3+24>>2]=r62,HEAP32[r3+32>>2]=r73&65535,HEAP32[r3+40>>2]=r75,r3));STACKTOP=r3;break}else if(r2==103){STACKTOP=r4;return r10}}}}}while(0);_psi_img_del(r9);r10=0;STACKTOP=r4;return r10}






function _strcmp(r1,r2){var r3,r4,r5,r6,r7,r8;r3=HEAP8[r1];r4=HEAP8[r2];if(r3<<24>>24!=r4<<24>>24|r3<<24>>24==0|r4<<24>>24==0){r5=r3;r6=r4}else{r4=r1;r1=r2;while(1){r2=r4+1|0;r3=r1+1|0;r7=HEAP8[r2];r8=HEAP8[r3];if(r7<<24>>24!=r8<<24>>24|r7<<24>>24==0|r8<<24>>24==0){r5=r7;r6=r8;break}else{r4=r2;r1=r3}}}return(r5&255)-(r6&255)|0}function _strncmp(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;if((r3|0)==0){r4=0;return r4}r5=HEAP8[r1];L4:do{if(r5<<24>>24==0){r6=r2;r7=0}else{r8=r1;r9=r2;r10=r3;r11=r5;while(1){r12=r10-1|0;r13=HEAP8[r9];if(!((r12|0)!=0&r13<<24>>24!=0&r11<<24>>24==r13<<24>>24)){r6=r9;r7=r11;break L4}r13=r8+1|0;r14=r9+1|0;r15=HEAP8[r13];if(r15<<24>>24==0){r6=r14;r7=0;break}else{r8=r13;r9=r14;r10=r12;r11=r15}}}}while(0);r4=(r7&255)-HEAPU8[r6]|0;return r4}function _i64Add(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1+r3>>>0;r6=r2+r4+(r5>>>0<r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _i64Subtract(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1-r3>>>0;r6=r2-r4>>>0;r6=r2-r4-(r3>>>0>r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _bitshift64Shl(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2<<r3|(r1&r4<<32-r3)>>>32-r3;return r1<<r3}tempRet0=r1<<r3-32;return 0}function _bitshift64Lshr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=0;return r2>>>r3-32|0}function _bitshift64Ashr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=(r2|0)<0?-1:0;return r2>>r3-32|0}function _llvm_ctlz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[ctlz_i8+(r1>>>24)|0];if((r2|0)<8)return r2|0;r2=HEAP8[ctlz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[ctlz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[ctlz_i8+(r1&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_DYNAMIC);function _llvm_cttz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[cttz_i8+(r1&255)|0];if((r2|0)<8)return r2|0;r2=HEAP8[cttz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[cttz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[cttz_i8+(r1>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_DYNAMIC);function ___muldsi3(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=0,r4=0,r5=0,r6=0,r7=0,r8=0,r9=0;r3=r1&65535;r4=r2&65535;r5=Math_imul(r4,r3)|0;r6=r1>>>16;r7=(r5>>>16)+Math_imul(r4,r6)|0;r8=r2>>>16;r9=Math_imul(r8,r3)|0;return(tempRet0=(r7>>>16)+Math_imul(r8,r6)+(((r7&65535)+r9|0)>>>16)|0,r7+r9<<16|r5&65535|0)|0}function ___divdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r5=r2>>31|((r2|0)<0?-1:0)<<1;r6=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r7=r4>>31|((r4|0)<0?-1:0)<<1;r8=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r9=_i64Subtract(r5^r1,r6^r2,r5,r6)|0;r10=tempRet0;r11=_i64Subtract(r7^r3,r8^r4,r7,r8)|0;r12=r7^r5;r13=r8^r6;r14=___udivmoddi4(r9,r10,r11,tempRet0,0)|0;r15=_i64Subtract(r14^r12,tempRet0^r13,r12,r13)|0;return r15|0}function ___remdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r15=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r15|0;r6=r2>>31|((r2|0)<0?-1:0)<<1;r7=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r8=r4>>31|((r4|0)<0?-1:0)<<1;r9=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r10=_i64Subtract(r6^r1,r7^r2,r6,r7)|0;r11=tempRet0;r12=_i64Subtract(r8^r3,r9^r4,r8,r9)|0;___udivmoddi4(r10,r11,r12,tempRet0,r5)|0;r13=_i64Subtract(HEAP32[r5>>2]^r6,HEAP32[r5+4>>2]^r7,r6,r7)|0;r14=tempRet0;STACKTOP=r15;return(tempRet0=r14,r13)|0}function ___muldi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0;r5=r1;r6=r3;r7=___muldsi3(r5,r6)|0;r8=tempRet0;r9=Math_imul(r2,r6)|0;return(tempRet0=Math_imul(r4,r5)+r9+r8|r8&0,r7&-1|0)|0}function ___udivdi3(r1,r2,r3,r4){var r5;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0;r5=___udivmoddi4(r1,r2,r3,r4,0)|0;return r5|0}function ___uremdi3(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r6|0;___udivmoddi4(r1,r2,r3,r4,r5)|0;STACKTOP=r6;return(tempRet0=HEAP32[r5+4>>2]|0,HEAP32[r5>>2]|0)|0}function ___udivmoddi4(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=r5|0;r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0,r16=0,r17=0,r18=0,r19=0,r20=0,r21=0,r22=0,r23=0,r24=0,r25=0,r26=0,r27=0,r28=0,r29=0,r30=0,r31=0,r32=0,r33=0,r34=0,r35=0,r36=0,r37=0,r38=0,r39=0,r40=0,r41=0,r42=0,r43=0,r44=0,r45=0,r46=0,r47=0,r48=0,r49=0,r50=0,r51=0,r52=0,r53=0,r54=0,r55=0,r56=0,r57=0,r58=0,r59=0,r60=0,r61=0,r62=0,r63=0,r64=0,r65=0,r66=0,r67=0,r68=0,r69=0;r6=r1;r7=r2;r8=r7;r9=r3;r10=r4;r11=r10;if((r8|0)==0){r12=(r5|0)!=0;if((r11|0)==0){if(r12){HEAP32[r5>>2]=(r6>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r6>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}else{if(!r12){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}r13=(r11|0)==0;do{if((r9|0)!=0){if(!r13){r28=_llvm_ctlz_i32(r11|0)|0;r29=r28-_llvm_ctlz_i32(r8|0)|0;if(r29>>>0<=31){r30=r29+1|0;r31=31-r29|0;r32=r29-31>>31;r37=r30;r36=r6>>>(r30>>>0)&r32|r8<<r31;r35=r8>>>(r30>>>0)&r32;r34=0;r33=r6<<r31;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}r19=r9-1|0;if((r19&r9|0)!=0){r21=_llvm_ctlz_i32(r9|0)+33|0;r22=r21-_llvm_ctlz_i32(r8|0)|0;r23=64-r22|0;r24=32-r22|0;r25=r24>>31;r26=r22-32|0;r27=r26>>31;r37=r22;r36=r24-1>>31&r8>>>(r26>>>0)|(r8<<r24|r6>>>(r22>>>0))&r27;r35=r27&r8>>>(r22>>>0);r34=r6<<r23&r25;r33=(r8<<r23|r6>>>(r26>>>0))&r25|r6<<r24&r22-33>>31;break}if((r5|0)!=0){HEAP32[r5>>2]=r19&r6;HEAP32[r5+4>>2]=0}if((r9|0)==1){r69=r7|r2&0;r68=r1&-1|0;return(tempRet0=r69,r68)|0}else{r20=_llvm_cttz_i32(r9|0)|0;r69=r8>>>(r20>>>0)|0;r68=r8<<32-r20|r6>>>(r20>>>0)|0;return(tempRet0=r69,r68)|0}}else{if(r13){if((r5|0)!=0){HEAP32[r5>>2]=(r8>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r8>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}if((r6|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=(r8>>>0)%(r11>>>0)}r69=0;r68=(r8>>>0)/(r11>>>0)>>>0;return(tempRet0=r69,r68)|0}r14=r11-1|0;if((r14&r11|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r14&r8|r2&0}r69=0;r68=r8>>>((_llvm_cttz_i32(r11|0)|0)>>>0);return(tempRet0=r69,r68)|0}r15=_llvm_ctlz_i32(r11|0)|0;r16=r15-_llvm_ctlz_i32(r8|0)|0;if(r16>>>0<=30){r17=r16+1|0;r18=31-r16|0;r37=r17;r36=r8<<r18|r6>>>(r17>>>0);r35=r8>>>(r17>>>0);r34=0;r33=r6<<r18;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}while(0);if((r37|0)==0){r64=r33;r63=r34;r62=r35;r61=r36;r60=0;r59=0}else{r38=r3&-1|0;r39=r10|r4&0;r40=_i64Add(r38,r39,-1,-1)|0;r41=tempRet0;r47=r33;r46=r34;r45=r35;r44=r36;r43=r37;r42=0;while(1){r48=r46>>>31|r47<<1;r49=r42|r46<<1;r50=r44<<1|r47>>>31|0;r51=r44>>>31|r45<<1|0;_i64Subtract(r40,r41,r50,r51)|0;r52=tempRet0;r53=r52>>31|((r52|0)<0?-1:0)<<1;r54=r53&1;r55=_i64Subtract(r50,r51,r53&r38,(((r52|0)<0?-1:0)>>31|((r52|0)<0?-1:0)<<1)&r39)|0;r56=r55;r57=tempRet0;r58=r43-1|0;if((r58|0)==0){break}else{r47=r48;r46=r49;r45=r57;r44=r56;r43=r58;r42=r54}}r64=r48;r63=r49;r62=r57;r61=r56;r60=0;r59=r54}r65=r63;r66=0;r67=r64|r66;if((r5|0)!=0){HEAP32[r5>>2]=r61;HEAP32[r5+4>>2]=r62}r69=(r65|0)>>>31|r67<<1|(r66<<1|r65>>>31)&0|r60;r68=(r65<<1|0>>>31)&-2|r59;return(tempRet0=r69,r68)|0}




// EMSCRIPTEN_END_FUNCS
Module["_mac_get_sim"] = _mac_get_sim;
Module["_main"] = _main;
Module["_mac_set_msg"] = _mac_set_msg;
Module["_malloc"] = _malloc;
Module["_free"] = _free;
Module["_realloc"] = _realloc;

// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






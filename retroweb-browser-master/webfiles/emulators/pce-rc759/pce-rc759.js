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

STATICTOP = STATIC_BASE + 32600;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });







var _stdout;
var _stdout=_stdout=allocate(1, "i32*", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate(1, "i32*", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate(1, "i32*", ALLOC_STATIC);






























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































var _strdup;
/* memory initializer */ allocate([0,131,3,0,0,0,0,0,0,130,2,0,0,44,0,0,0,132,4,0,0,4,0,0,0,134,6,0,0,48,0,0,1,132,4,0,0,80,0,0,1,130,2,0,0,46,0,0,1,131,3,0,0,88,0,0,1,134,6,0,0,12,0,0,0,1,2,0,0,24,0,0,0,138,2,0,0,18,0,0,0,129,2,0,0,0,0,0,0,139,2,0,0,20,0,0,0,130,2,0,0,2,0,0,0,2,2,0,0,26,0,0,0,131,2,0,0,4,0,0,0,3,2,0,0,28,0,0,0,132,2,0,0,6,0,0,0,4,2,0,0,30,0,0,0,133,2,0,0,8,0,0,0,5,2,0,0,32,0,0,0,134,2,0,0,10,0,0,0,6,2,0,0,34,0,0,0,135,2,0,0,12,0,0,0,7,2,0,0,36,0,0,0,136,2,0,0,14,0,0,0,8,2,0,0,38,0,0,0,137,2,0,0,16,0,0,1,144,2,0,0,84,0,0,1,135,2,0,0,56,0,0,1,145,2,0,0,86,0,0,1,136,2,0,0,58,0,0,1,146,2,0,0,88,0,0,1,137,2,0,0,60,0,0,1,147,2,0,0,90,0,0,1,138,2,0,0,62,0,0,1,129,2,0,0,22,0,0,1,139,2,0,0,64,0,0,1,130,2,0,0,46,0,0,1,140,2,0,0,66,0,0,1,131,2,0,0,48,0,0,1,141,2,0,0,68,0,0,1,132,2,0,0,50,0,0,1,142,2,0,0,70,0,0,1,133,2,0,0,52,0,0,1,143,2,0,0,72,0,0,1,134,2,0,0,54,0,0,80,0,0,0,0,92,0,0,38,0,0,0,72,0,0,0,8,0,0,0,8,0,0,0,176,70,0,0,248,63,0,0,224,57,0,0,216,52,0,0,2,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,144,72,0,0,132,1,0,0,128,65,0,0,122,2,0,0,112,59,0,0,210,2,0,0,200,53,0,0,98,0,0,0,224,49,0,0,140,1,0,0,152,46,0,0,130,2,0,0,16,43,0,0,144,4,0,0,208,39,0,0,170,2,0,0,64,101,0,0,90,4,0,0,168,97,0,0,100,0,0,0,96,93,0,0,72,3,0,0,176,90,0,0,22,2,0,0,184,87,0,0,22,3,0,0,112,85,0,0,30,4,0,0,136,83,0,0,98,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,32,96,0,0,0,0,0,0,200,95,0,0,104,95,0,0,0,95,0,0,112,94,0,0,152,93,0,0,48,93,0,0,45,43,0,0,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,56,44,0,0,0,41,0,0,64,102,0,0,112,99,0,0,80,94,0,0,0,0,0,0,83,79,70,84,87,65,82,69,32,80,73,82,65,84,69,83,88,55,0,0,0,54,0,0,144,53,0,0,88,53,0,0,72,125,0,0,240,52,0,0,200,52,0,0,112,52,0,0,8,52,0,0,200,51,0,0,104,51,0,0,0,51,0,0,72,50,0,0,248,49,0,0,176,49,0,0,40,47,0,0,120,49,0,0,64,49,0,0,128,43,0,0,8,49,0,0,208,48,0,0,80,40,0,0,72,125,0,0,168,48,0,0,80,60,0,0,80,48,0,0,16,48,0,0,208,101,0,0,168,47,0,0,176,46,0,0,184,98,0,0,72,125,0,0,104,46,0,0,104,54,0,0,16,46,0,0,200,45,0,0,192,93,0,0,128,45,0,0,72,45,0,0,48,91,0,0,0,45,0,0,176,44,0,0,136,51,0,0,40,73,0,0,88,72,0,0,208,71,0,0,64,71,0,0,144,70,0,0,48,48,0,0,32,70,0,0,88,69,0,0,48,48,0,0,64,125,0,0,8,68,0,0,144,44,0,0,64,125,0,0,176,67,0,0,80,41,0,0,208,65,0,0,56,65,0,0,160,102,0,0,224,64,0,0,112,64,0,0,32,100,0,0,240,63,0,0,112,63,0,0,32,100,0,0,0,63,0,0,96,62,0,0,8,95,0,0,208,61,0,0,104,61,0,0,176,91,0,0,232,59,0,0,16,59,0,0,248,88,0,0,40,73,0,0,160,58,0,0,160,86,0,0,64,58,0,0,208,57,0,0,224,80,0,0,120,57,0,0,232,56,0,0,136,79,0,0,40,73,0,0,96,56,0,0,120,78,0,0,176,55,0,0,120,55,0,0,63,0,0,0,32,78,0,0,0,0,0,0,184,76,0,0,99,0,1,0,0,75,0,0,200,72,0,0,24,72,0,0,100,0,1,0,176,71,0,0,200,72,0,0,248,70,0,0,103,0,1,0,112,70,0,0,200,72,0,0,232,69,0,0,105,0,1,0,16,69,0,0,200,72,0,0,128,68,0,0,73,0,1,0,224,67,0,0,200,72,0,0,40,67,0,0,108,0,1,0,152,65,0,0,200,72,0,0,0,65,0,0,113,0,0,0,168,64,0,0,0,0,0,0,24,64,0,0,114,0,0,0,160,63,0,0,0,0,0,0,64,63,0,0,82,0,0,0,192,62,0,0,0,0,0,0,64,62,0,0,115,0,1,0,152,61,0,0,56,61,0,0,152,59,0,0,116,0,1,0,232,58,0,0,200,72,0,0,112,58,0,0,118,0,0,0,16,58,0,0,0,0,0,0,144,57,0,0,86,0,0,0,88,57,0,0,0,0,0,0,136,56,0,0,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,128,78,0,0,2,0,0,0,96,95,0,0,3,0,0,0,56,73,0,0,4,0,0,0,224,65,0,0,5,0,0,0,240,59,0,0,6,0,0,0,48,54,0,0,7,0,0,0,32,50,0,0,8,0,0,0,16,47,0,0,9,0,0,0,96,43,0,0,10,0,0,0,24,40,0,0,11,0,0,0,184,101,0,0,12,0,0,0,112,98,0,0,13,0,0,0,168,93,0,0,14,0,0,0,16,91,0,0,14,0,0,0,40,88,0,0,15,0,0,0,24,86,0,0,15,0,0,0,32,84,0,0,16,0,0,0,80,80,0,0,17,0,0,0,40,79,0,0,17,0,0,0,40,78,0,0,18,0,0,0,208,76,0,0,19,0,0,0,8,75,0,0,20,0,0,0,208,72,0,0,21,0,0,0,56,72,0,0,22,0,0,0,184,71,0,0,23,0,0,0,32,71,0,0,24,0,0,0,120,70,0,0,25,0,0,0,0,70,0,0,26,0,0,0,32,69,0,0,27,0,0,0,176,68,0,0,28,0,0,0,240,67,0,0,28,0,0,0,80,67,0,0,29,0,0,0,160,65,0,0,29,0,0,0,32,65,0,0,30,0,0,0,176,64,0,0,31,0,0,0,56,64,0,0,32,0,0,0,168,63,0,0,33,0,0,0,96,63,0,0,34,0,0,0,208,62,0,0,35,0,0,0,88,62,0,0,36,0,0,0,160,61,0,0,37,0,0,0,64,61,0,0,38,0,0,0,176,59,0,0,39,0,0,0,248,58,0,0,40,0,0,0,136,58,0,0,41,0,0,0,24,58,0,0,42,0,0,0,176,57,0,0,42,0,0,0,96,57,0,0,43,0,0,0,168,56,0,0,43,0,0,0,88,56,0,0,44,0,0,0,168,55,0,0,45,0,0,0,72,55,0,0,46,0,0,0,248,53,0,0,47,0,0,0,136,53,0,0,48,0,0,0,80,53,0,0,49,0,0,0,232,52,0,0,50,0,0,0,192,52,0,0,51,0,0,0,104,52,0,0,52,0,0,0,0,52,0,0,53,0,0,0,192,51,0,0,54,0,0,0,96,51,0,0,55,0,0,0,240,50,0,0,55,0,0,0,240,49,0,0,56,0,0,0,168,49,0,0,56,0,0,0,104,49,0,0,56,0,0,0,56,49,0,0,57,0,0,0,248,48,0,0,57,0,0,0,200,48,0,0,58,0,0,0,152,48,0,0,58,0,0,0,72,48,0,0,59,0,0,0,8,48,0,0,59,0,0,0,160,47,0,0,60,0,0,0,168,46,0,0,61,0,0,0,96,46,0,0,62,0,0,0,8,46,0,0,63,0,0,0,192,45,0,0,64,0,0,0,120,45,0,0,66,0,0,0,64,45,0,0,65,0,0,0,248,44,0,0,67,0,0,0,168,44,0,0,67,0,0,0,112,44,0,0,68,0,0,0,48,44,0,0,68,0,0,0,32,43,0,0,69,0,0,0,216,42,0,0,69,0,0,0,168,42,0,0,71,0,0,0,120,42,0,0,71,0,0,0,72,42,0,0,73,0,0,0,176,41,0,0,73,0,0,0,160,41,0,0,72,0,0,0,96,41,0,0,72,0,0,0,48,41,0,0,72,0,0,0,240,40,0,0,74,0,0,0,232,39,0,0,75,0,0,0,120,39,0,0,75,0,0,0,64,39,0,0,76,0,0,0,8,39,0,0,77,0,0,0,200,38,0,0,78,0,0,0,152,38,0,0,79,0,0,0,120,38,0,0,79,0,0,0,40,38,0,0,79,0,0,0,128,102,0,0,80,0,0,0,56,102,0,0,81,0,0,0,96,101,0,0,82,0,0,0,0,101,0,0,83,0,0,0,216,100,0,0,84,0,0,0,184,100,0,0,85,0,0,0,144,100,0,0,86,0,0,0,120,100,0,0,87,0,0,0,96,100,0,0,88,0,0,0,40,100,0,0,89,0,0,0,192,99,0,0,90,0,0,0,104,99,0,0,91,0,0,0,208,97,0,0,92,0,0,0,48,97,0,0,93,0,0,0,192,96,0,0,94,0,0,0,96,96,0,0,95,0,0,0,48,96,0,0,96,0,0,0,0,96,0,0,97,0,0,0,192,95,0,0,98,0,0,0,80,95,0,0,99,0,0,0,248,94,0,0,100,0,0,0,72,94,0,0,101,0,0,0,120,93,0,0,102,0,0,0,40,93,0,0,103,0,0,0,232,92,0,0,104,0,0,0,184,92,0,0,105,0,0,0,96,92,0,0,106,0,0,0,56,92,0,0,107,0,0,0,8,92,0,0,108,0,0,0,192,91,0,0,109,0,0,0,160,91,0,0,110,0,0,0,120,91,0,0,111,0,0,0,192,90,0,0,112,0,0,0,64,90,0,0,113,0,0,0,232,89,0,0,114,0,0,0,184,89,0,0,115,0,0,0,104,89,0,0,116,0,0,0,72,89,0,0,117,0,0,0,40,89,0,0,118,0,0,0,8,89,0,0,119,0,0,0,224,88,0,0,120,0,0,0,184,88,0,0,121,0,0,0,208,87,0,0,122,0,0,0,128,87,0,0,123,0,0,0,96,87,0,0,124,0,0,0,56,87,0,0,0,0,0,0,0,0,0,0,27,0,0,0,1,0,0,0,58,4,0,0,2,0,0,0,59,4,0,0,3,0,0,0,60,4,0,0,4,0,0,0,61,4,0,0,5,0,0,0,62,4,0,0,6,0,0,0,63,4,0,0,7,0,0,0,64,4,0,0,8,0,0,0,65,4,0,0,9,0,0,0,66,4,0,0,10,0,0,0,67,4,0,0,11,0,0,0,68,4,0,0,12,0,0,0,69,4,0,0,13,0,0,0,70,4,0,0,14,0,0,0,71,4,0,0,15,0,0,0,72,4,0,0,16,0,0,0,96,0,0,0,17,0,0,0,49,0,0,0,18,0,0,0,50,0,0,0,19,0,0,0,51,0,0,0,20,0,0,0,52,0,0,0,21,0,0,0,53,0,0,0,22,0,0,0,54,0,0,0,23,0,0,0,55,0,0,0,24,0,0,0,56,0,0,0,25,0,0,0,57,0,0,0,26,0,0,0,48,0,0,0,27,0,0,0,45,0,0,0,28,0,0,0,61,0,0,0,29,0,0,0,187,0,0,0,29,0,0,0,8,0,0,0,30,0,0,0,9,0,0,0,31,0,0,0,113,0,0,0,32,0,0,0,119,0,0,0,33,0,0,0,101,0,0,0,34,0,0,0,114,0,0,0,35,0,0,0,116,0,0,0,36,0,0,0,121,0,0,0,37,0,0,0,117,0,0,0,38,0,0,0,105,0,0,0,39,0,0,0,111,0,0,0,40,0,0,0,112,0,0,0,41,0,0,0,91,0,0,0,42,0,0,0,93,0,0,0,43,0,0,0,13,0,0,0,44,0,0,0,57,4,0,0,45,0,0,0,97,0,0,0,46,0,0,0,115,0,0,0,47,0,0,0,100,0,0,0,48,0,0,0,102,0,0,0,49,0,0,0,103,0,0,0,50,0,0,0,104,0,0,0,51,0,0,0,106,0,0,0,52,0,0,0,107,0,0,0,53,0,0,0,108,0,0,0,54,0,0,0,59,0,0,0,55,0,0,0,186,0,0,0,55,0,0,0,39,0,0,0,56,0,0,0,92,0,0,0,57,0,0,0,220,0,0,0,57,0,0,0,225,4,0,0,58,0,0,0,60,0,0,0,59,0,0,0,122,0,0,0,60,0,0,0,120,0,0,0,61,0,0,0,99,0,0,0,62,0,0,0,118,0,0,0,63,0,0,0,98,0,0,0,64,0,0,0,110,0,0,0,66,0,0,0,109,0,0,0,65,0,0,0,44,0,0,0,67,0,0,0,46,0,0,0,68,0,0,0,47,0,0,0,69,0,0,0,229,4,0,0,70,0,0,0,224,4,0,0,71,0,0,0,227,4,0,0,73,0,0,0,227,4,0,0,72,0,0,0,226,4,0,0,75,0,0,0,1,5,0,0,74,0,0,0,32,0,0,0,76,0,0,0,230,4,0,0,77,0,0,0,231,4,0,0,78,0,0,0,231,4,0,0,79,0,0,0,118,4,0,0,80,0,0,0,228,4,0,0,81,0,0,0,83,4,0,0,82,0,0,0,84,4,0,0,83,0,0,0,85,4,0,0,84,0,0,0,86,4,0,0,85,0,0,0,95,4,0,0,86,0,0,0,96,4,0,0,87,0,0,0,97,4,0,0,88,0,0,0,87,4,0,0,89,0,0,0,92,4,0,0,90,0,0,0,93,4,0,0,91,0,0,0,94,4,0,0,92,0,0,0,89,4,0,0,93,0,0,0,90,4,0,0,94,0,0,0,91,4,0,0,95,0,0,0,88,4,0,0,96,0,0,0,98,4,0,0,97,0,0,0,99,4,0,0,98,0,0,0,73,4,0,0,99,0,0,0,74,4,0,0,100,0,0,0,75,4,0,0,101,0,0,0,127,0,0,0,102,0,0,0,77,4,0,0,103,0,0,0,78,4,0,0,104,0,0,0,82,4,0,0,105,0,0,0,80,4,0,0,106,0,0,0,81,4,0,0,107,0,0,0,79,4,0,0,108,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,15,0,0,0,1,0,143,0,0,0,0,0,0,0,2,0,0,0,1,0,59,0,0,0,1,0,187,0,0,0,0,0,0,0,3,0,0,0,1,0,60,0,0,0,1,0,188,0,0,0,0,0,0,0,4,0,0,0,1,0,61,0,0,0,1,0,189,0,0,0,0,0,0,0,5,0,0,0,1,0,62,0,0,0,1,0,190,0,0,0,0,0,0,0,6,0,0,0,1,0,63,0,0,0,1,0,191,0,0,0,0,0,0,0,7,0,0,0,1,0,64,0,0,0,1,0,192,0,0,0,0,0,0,0,8,0,0,0,1,0,65,0,0,0,1,0,193,0,0,0,0,0,0,0,9,0,0,0,1,0,66,0,0,0,1,0,194,0,0,0,0,0,0,0,10,0,0,0,1,0,67,0,0,0,1,0,195,0,0,0,0,0,0,0,11,0,0,0,1,0,68,0,0,0,1,0,196,0,0,0,0,0,0,0,12,0,0,0,1,0,69,0,0,0,1,0,197,0,0,0,0,0,0,0,13,0,0,0,1,0,70,0,0,0,1,0,198,0,0,0,0,0,0,0,17,0,0,0,1,0,58,0,0,0,1,0,186,0,0,0,0,0,0,0,18,0,0,0,1,0,2,0,0,0,1,0,130,0,0,0,0,0,0,0,19,0,0,0,1,0,3,0,0,0,1,0,131,0,0,0,0,0,0,0,20,0,0,0,1,0,4,0,0,0,1,0,132,0,0,0,0,0,0,0,21,0,0,0,1,0,5,0,0,0,1,0,133,0,0,0,0,0,0,0,22,0,0,0,1,0,6,0,0,0,1,0,134,0,0,0,0,0,0,0,23,0,0,0,1,0,7,0,0,0,1,0,135,0,0,0,0,0,0,0,24,0,0,0,1,0,8,0,0,0,1,0,136,0,0,0,0,0,0,0,25,0,0,0,1,0,9,0,0,0,1,0,137,0,0,0,0,0,0,0,26,0,0,0,1,0,10,0,0,0,1,0,138,0,0,0,0,0,0,0,27,0,0,0,1,0,11,0,0,0,1,0,139,0,0,0,0,0,0,0,28,0,0,0,1,0,12,0,0,0,1,0,140,0,0,0,0,0,0,0,29,0,0,0,1,0,13,0,0,0,1,0,141,0,0,0,0,0,0,0,30,0,0,0,1,0,14,0,0,0,1,0,142,0,0,0,0,0,0,0,31,0,0,0,1,0,1,0,0,0,1,0,129,0,0,0,0,0,0,0,32,0,0,0,1,0,16,0,0,0,1,0,144,0,0,0,0,0,0,0,33,0,0,0,1,0,17,0,0,0,1,0,145,0,0,0,0,0,0,0,34,0,0,0,1,0,18,0,0,0,1,0,146,0,0,0,0,0,0,0,35,0,0,0,1,0,19,0,0,0,1,0,147,0,0,0,0,0,0,0,36,0,0,0,1,0,20,0,0,0,1,0,148,0,0,0,0,0,0,0,37,0,0,0,1,0,21,0,0,0,1,0,149,0,0,0,0,0,0,0,38,0,0,0,1,0,22,0,0,0,1,0,150,0,0,0,0,0,0,0,39,0,0,0,1,0,23,0,0,0,1,0,151,0,0,0,0,0,0,0,40,0,0,0,1,0,24,0,0,0,1,0,152,0,0,0,0,0,0,0,41,0,0,0,1,0,25,0,0,0,1,0,153,0,0,0,0,0,0,0,42,0,0,0,1,0,27,0,0,0,1,0,155,0,0,0,0,0,0,0,43,0,0,0,1,0,39,0,0,0,1,0,167,0,0,0,0,0,0,0,44,0,0,0,1,0,28,0,0,0,1,0,156,0,0,0,0,0,0,0,45,0,0,0,1,0,40,0,0,0,1,0,168,0,0,0,0,0,0,0,46,0,0,0,1,0,30,0,0,0,1,0,158,0,0,0,0,0,0,0,47,0,0,0,1,0,31,0,0,0,1,0,159,0,0,0,0,0,0,0,48,0,0,0,1,0,32,0,0,0,1,0,160,0,0,0,0,0,0,0,49,0,0,0,1,0,33,0,0,0,1,0,161,0,0,0,0,0,0,0,50,0,0,0,1,0,34,0,0,0,1,0,162,0,0,0,0,0,0,0,51,0,0,0,1,0,35,0,0,0,1,0,163,0,0,0,0,0,0,0,52,0,0,0,1,0,36,0,0,0,1,0,164,0,0,0,0,0,0,0,53,0,0,0,1,0,37,0,0,0,1,0,165,0,0,0,0,0,0,0,54,0,0,0,1,0,38,0,0,0,1,0,166,0,0,0,0,0,0,0,55,0,0,0,1,0,26,0,0,0,1,0,154,0,0,0,0,0,0,0,56,0,0,0,1,0,43,0,0,0,1,0,171,0,0,0,0,0,0,0,57,0,0,0,1,0,41,0,0,0,1,0,169,0,0,0,0,0,0,0,58,0,0,0,1,0,42,0,0,0,1,0,170,0,0,0,0,0,0,0,59,0,0,0,1,0,56,0,0,0,1,0,184,0,0,0,0,0,0,0,60,0,0,0,1,0,44,0,0,0,1,0,172,0,0,0,0,0,0,0,61,0,0,0,1,0,45,0,0,0,1,0,173,0,0,0,0,0,0,0,62,0,0,0,1,0,46,0,0,0,1,0,174,0,0,0,0,0,0,0,63,0,0,0,1,0,47,0,0,0,1,0,175,0,0,0,0,0,0,0,64,0,0,0,1,0,48,0,0,0,1,0,176,0,0,0,0,0,0,0,66,0,0,0,1,0,49,0,0,0,1,0,177,0,0,0,0,0,0,0,65,0,0,0,1,0,50,0,0,0,1,0,178,0,0,0,0,0,0,0,67,0,0,0,1,0,51,0,0,0,1,0,179,0,0,0,0,0,0,0,68,0,0,0,1,0,52,0,0,0,1,0,180,0,0,0,0,0,0,0,69,0,0,0,1,0,53,0,0,0,1,0,181,0,0,0,0,0,0,0,70,0,0,0,1,0,54,0,0,0,1,0,182,0,0,0,0,0,0,0,71,0,0,0,1,0,29,0,0,0,1,0,157,0,0,0,0,0,0,0,75,0,0,0,1,0,55,0,0,0,1,0,183,0,0,0,0,0,0,0,76,0,0,0,1,0,57,0,0,0,1,0,185,0,0,0,0,0,0,0,81,0,0,0,1,0,29,0,0,0,1,0,157,0,0,0,0,0,0,0,85,0,0,0,1,0,86,0,0,0,1,0,214,0,0,0,0,0,0,0,86,0,0,0,1,0,83,0,0,0,1,0,211,0,0,0,0,0,0,0,87,0,0,0,1,0,84,0,0,0,1,0,212,0,0,0,0,0,0,0,88,0,0,0,1,0,85,0,0,0,1,0,213,0,0,0,0,0,0,0,89,0,0,0,1,0,87,0,0,0,1,0,215,0,0,0,0,0,0,0,90,0,0,0,1,0,88,0,0,0,1,0,216,0,0,0,0,0,0,0,91,0,0,0,1,0,89,0,0,0,1,0,217,0,0,0,0,0,0,0,92,0,0,0,1,0,90,0,0,0,1,0,218,0,0,0,0,0,0,0,93,0,0,0,1,0,93,0,0,0,1,0,221,0,0,0,0,0,0,0,94,0,0,0,1,0,94,0,0,0,1,0,222,0,0,0,0,0,0,0,95,0,0,0,1,0,95,0,0,0,1,0,223,0,0,0,0,0,0,0,96,0,0,0,1,0,96,0,0,0,1,0,224,0,0,0,0,0,0,0,97,0,0,0,1,0,97,0,0,0,1,0,225,0,0,0,0,0,0,0,98,0,0,0,1,0,98,0,0,0,1,0,226,0,0,0,0,0,0,0,99,0,0,0,1,0,71,0,0,0,1,0,199,0,0,0,0,0,0,0,100,0,0,0,1,0,81,0,0,0,1,0,209,0,0,0,0,0,0,0,102,0,0,0,1,0,82,0,0,0,1,0,210,0,0,0,0,0,0,0,105,0,0,0,1,0,79,0,0,0,1,0,207,0,0,0,0,0,0,0,106,0,0,0,1,0,77,0,0,0,1,0,205,0,0,0,0,0,0,0,107,0,0,0,1,0,80,0,0,0,1,0,208,0,0,0,0,0,0,0,108,0,0,0,1,0,78,0,0,0,1,0,206,0,0,0,0,0,0,0,83,0,0,0,1,0,92,0,0,0,2,0,220,0,0,0,0,0,0,0,84,0,0,0,1,0,91,0,0,0,1,0,91,0,0,0,0,0,0,0,101,0,0,0,1,0,72,0,0,0,1,0,200,0,0,0,0,0,0,0,104,0,0,0,1,0,73,0,0,0,1,0,201,0,0,0,0,0,0,0,103,0,0,0,1,0,74,0,0,0,1,0,202,0,0,0,0,0,0,0,82,0,0,0,1,0,75,0,0,0,1,0,203,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,0,0,0,182,0,0,0,188,0,0,0,186,0,0,0,192,0,0,0,190,0,0,0,194,0,0,0,32,0,0,0,172,0,0,0,32,0,0,0,168,0,0,0,170,0,0,0,178,0,0,0,180,0,0,0,174,0,0,0,176,0,0,0,140,0,0,0,32,0,0,0,144,0,0,0,142,0,0,0,148,0,0,0,146,0,0,0,152,0,0,0,150,0,0,0,186,2,0,0,188,2,0,0,190,2,0,0,192,2,0,0,178,2,0,0,180,2,0,0,182,2,0,0,184,2,0,0,198,2,0,0,200,2,0,0,194,2,0,0,196,2,0,0,206,2,0,0,208,2,0,0,202,2,0,0,204,2,0,0,30,3,0,0,28,3,0,0,34,3,0,0,32,3,0,0,38,3,0,0,36,3,0,0,42,3,0,0,40,3,0,0,110,4,0,0,108,4,0,0,50,2,0,0,44,2,0,0,118,4,0,0,116,4,0,0,64,2,0,0,112,4,0,0,126,4,0,0,86,2,0,0,68,4,0,0,66,4,0,0,64,4,0,0,76,4,0,0,74,4,0,0,72,4,0,0,252,2,0,0,254,2,0,0,0,3,0,0,2,3,0,0,244,2,0,0,246,2,0,0,248,2,0,0,250,2,0,0,12,3,0,0,14,3,0,0,50,3,0,0,52,3,0,0,54,3,0,0,44,3,0,0,46,3,0,0,48,3,0,0,188,1,0,0,186,1,0,0,192,1,0,0,190,1,0,0,196,1,0,0,194,1,0,0,200,1,0,0,198,1,0,0,180,1,0,0,178,1,0,0,148,1,0,0,152,1,0,0,150,1,0,0,156,1,0,0,154,1,0,0,158,1,0,0,62,2,0,0,68,2,0,0,68,0,0,0,70,0,0,0,80,0,0,0,84,2,0,0,76,0,0,0,78,0,0,0,60,0,0,0,62,0,0,0,116,0,0,0,110,0,0,0,112,0,0,0,122,0,0,0,136,3,0,0,118,0,0,0,8,4,0,0,8,4,0,0,8,4,0,0,8,4,0,0,8,4,0,0,8,4,0,0,8,4,0,0,8,4,0,0,252,3,0,0,252,3,0,0,252,3,0,0,252,3,0,0,252,3,0,0,252,3,0,0,252,3,0,0,252,3,0,0,146,1,0,0,146,1,0,0,146,1,0,0,146,1,0,0,146,1,0,0,146,1,0,0,146,1,0,0,146,1,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,80,1,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,164,4,0,0,166,4,0,0,160,4,0,0,162,4,0,0,156,4,0,0,158,4,0,0,152,4,0,0,154,4,0,0,170,4,0,0,172,4,0,0,196,4,0,0,192,4,0,0,194,4,0,0,188,4,0,0,190,4,0,0,186,4,0,0,208,0,0,0,206,0,0,0,208,0,0,0,204,0,0,0,216,0,0,0,214,0,0,0,212,0,0,0,210,0,0,0,200,0,0,0,198,0,0,0,158,0,0,0,156,0,0,0,154,0,0,0,164,0,0,0,162,0,0,0,160,0,0,0,130,1,0,0,130,1,0,0,130,1,0,0,130,1,0,0,130,1,0,0,130,1,0,0,130,1,0,0,130,1,0,0,70,4,0,0,106,1,0,0,130,4,0,0,132,4,0,0,134,4,0,0,120,4,0,0,122,4,0,0,128,2,0,0,8,1,0,0,10,1,0,0,12,1,0,0,14,1,0,0,0,1,0,0,2,1,0,0,4,1,0,0,6,1,0,0,16,1,0,0,18,1,0,0,68,1,0,0,70,1,0,0,72,1,0,0,62,1,0,0,64,1,0,0,66,1,0,0,80,2,0,0,74,2,0,0,26,3,0,0,124,4,0,0,114,2,0,0,106,2,0,0,124,2,0,0,118,2,0,0,106,4,0,0,104,4,0,0,78,4,0,0,82,4,0,0,80,4,0,0,86,4,0,0,84,4,0,0,88,4,0,0,32,0,0,0,32,0,0,0,4,3,0,0,6,3,0,0,16,3,0,0,18,3,0,0,28,4,0,0,32,4,0,0,32,0,0,0,32,0,0,0,60,3,0,0,56,3,0,0,58,3,0,0,64,3,0,0,66,3,0,0,62,3,0,0,176,1,0,0,174,1,0,0,172,1,0,0,170,1,0,0,168,1,0,0,166,1,0,0,32,0,0,0,164,1,0,0,162,1,0,0,162,1,0,0,162,1,0,0,162,1,0,0,162,1,0,0,162,1,0,0,162,1,0,0,162,1,0,0,36,0,0,0,38,0,0,0,40,0,0,0,42,0,0,0,44,0,0,0,46,0,0,0,48,0,0,0,50,0,0,0,52,0,0,0,54,0,0,0,86,0,0,0,88,0,0,0,90,0,0,0,92,0,0,0,94,0,0,0,96,0,0,0,138,3,0,0,32,0,0,0,156,3,0,0,204,3,0,0,120,3,0,0,116,3,0,0,134,3,0,0,128,3,0,0,234,3,0,0,232,3,0,0,82,2,0,0,108,2,0,0,152,3,0,0,142,3,0,0,66,2,0,0,76,2,0,0,214,3,0,0,212,3,0,0,218,3,0,0,216,3,0,0,222,3,0,0,220,3,0,0,226,3,0,0,224,3,0,0,230,3,0,0,228,3,0,0,140,3,0,0,146,3,0,0,144,3,0,0,150,3,0,0,148,3,0,0,154,3,0,0,244,1,0,0,246,1,0,0,234,1,0,0,238,1,0,0,252,1,0,0,60,2,0,0,248,1,0,0,250,1,0,0,56,0,0,0,56,0,0,0,56,0,0,0,56,0,0,0,56,0,0,0,56,0,0,0,56,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,170,170,170,0,170,170,170,0,170,170,170,0,170,170,170,0,85,85,85,0,85,85,85,0,85,85,85,0,85,85,85,0,255,255,255,0,255,255,255,0,255,255,255,0,255,255,255,0,0,0,0,0,0,0,170,0,0,170,0,0,0,170,170,0,170,0,0,0,170,0,170,0,170,170,0,0,170,170,170,0,85,85,85,0,85,85,255,0,85,255,85,0,85,255,255,0,255,85,85,0,255,85,255,0,255,255,85,0,255,255,255,0,40,74,0,0,106,0,0,0,168,66,0,0,106,0,0,0,248,60,0,0,4,2,0,0,0,0,0,0,0,0,0,0,192,38,0,0,18,4,0,0,128,77,0,0,22,4,0,0,56,68,0,0,122,3,0,0,232,61,0,0,122,3,0,0,208,55,0,0,20,4,0,0,144,51,0,0,244,0,0,0,0,0,0,0,0,0,0,0,40,49,0,0,176,45,0,0,104,42,0,0,232,38,0,0,168,100,0,0,80,96,0,0,112,92,0,0,168,89,0,0,40,87,0,0,24,85,0,0,56,83,0,0,176,79,0,0,160,78,0,0,136,77,0,0,120,76,0,0,152,73,0,0,96,2,0,0,98,2,0,0,100,2,0,0,102,2,0,0,88,2,0,0,90,2,0,0,92,2,0,0,94,2,0,0,110,2,0,0,112,2,0,0,144,2,0,0,146,2,0,0,148,2,0,0,138,2,0,0,140,2,0,0,142,2,0,0,88,1,0,0,86,1,0,0,84,1,0,0,82,1,0,0,226,1,0,0,78,1,0,0,76,1,0,0,74,1,0,0,96,1,0,0,94,1,0,0,44,1,0,0,42,1,0,0,40,1,0,0,38,1,0,0,36,1,0,0,34,1,0,0,78,2,0,0,82,0,0,0,70,2,0,0,72,2,0,0,72,0,0,0,74,0,0,0,54,2,0,0,58,2,0,0,64,0,0,0,66,0,0,0,124,0,0,0,124,3,0,0,120,0,0,0,114,0,0,0,118,3,0,0,96,3,0,0,240,3,0,0,238,3,0,0,244,3,0,0,242,3,0,0,248,3,0,0,246,3,0,0,2,4,0,0,250,3,0,0,0,4,0,0,254,3,0,0,180,3,0,0,184,3,0,0,182,3,0,0,188,3,0,0,186,3,0,0,190,3,0,0,24,3,0,0,24,3,0,0,24,3,0,0,24,3,0,0,24,3,0,0,24,3,0,0,24,3,0,0,24,3,0,0,20,3,0,0,20,3,0,0,20,3,0,0,20,3,0,0,20,3,0,0,20,3,0,0,20,3,0,0,20,3,0,0,24,2,0,0,24,2,0,0,24,2,0,0,24,2,0,0,24,2,0,0,24,2,0,0,24,2,0,0,24,2,0,0,182,1,0,0,182,1,0,0,182,1,0,0,182,1,0,0,182,1,0,0,182,1,0,0,182,1,0,0,182,1,0,0,22,1,0,0,24,1,0,0,20,1,0,0,138,1,0,0,138,1,0,0,138,1,0,0,26,1,0,0,138,1,0,0,28,1,0,0,138,1,0,0,52,1,0,0,138,1,0,0,50,1,0,0,56,1,0,0,58,1,0,0,54,1,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,114,4,0,0,172,3,0,0,174,3,0,0,172,3,0,0,176,3,0,0,164,3,0,0,166,3,0,0,168,3,0,0,170,3,0,0,160,3,0,0,162,3,0,0,206,3,0,0,208,3,0,0,210,3,0,0,198,3,0,0,200,3,0,0,202,3,0,0,40,2,0,0,38,2,0,0,38,2,0,0,38,2,0,0,38,2,0,0,38,2,0,0,38,2,0,0,38,2,0,0,32,2,0,0,30,2,0,0,8,2,0,0,6,2,0,0,44,4,0,0,2,2,0,0,0,2,0,0,254,1,0,0,226,2,0,0,224,2,0,0,222,2,0,0,236,2,0,0,218,2,0,0,216,2,0,0,214,2,0,0,212,2,0,0,230,2,0,0,228,2,0,0,216,1,0,0,210,1,0,0,206,1,0,0,158,2,0,0,204,1,0,0,154,2,0,0,16,2,0,0,16,2,0,0,16,2,0,0,16,2,0,0,16,2,0,0,16,2,0,0,16,2,0,0,16,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,220,0,0,0,218,0,0,0,224,0,0,0,222,0,0,0,228,0,0,0,226,0,0,0,232,0,0,0,230,0,0,0,236,0,0,0,234,0,0,0,126,0,0,0,132,0,0,0,130,0,0,0,136,0,0,0,134,0,0,0,138,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,138,1,0,0,138,1,0,0,14,0,0,0,138,1,0,0,138,1,0,0,138,1,0,0,138,1,0,0,138,1,0,0,138,1,0,0,138,1,0,0,138,1,0,0,106,3,0,0,106,3,0,0,106,3,0,0,106,3,0,0,114,3,0,0,112,3,0,0,110,3,0,0,108,3,0,0,100,3,0,0,98,3,0,0,76,3,0,0,74,3,0,0,136,2,0,0,82,3,0,0,80,3,0,0,78,3,0,0,156,2,0,0,138,1,0,0,152,2,0,0,202,1,0,0,164,2,0,0,166,2,0,0,160,2,0,0,162,2,0,0,168,2,0,0,168,2,0,0,168,2,0,0,168,2,0,0,168,2,0,0,168,2,0,0,240,2,0,0,220,2,0,0,0,0,5,0,80,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,80,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,178,5,0,81,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,196,5,0,82,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,214,5,0,83,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,64,6,0,80,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,84,6,0,81,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,104,6,0,82,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,124,6,0,83,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,224,6,0,80,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,246,6,0,81,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,12,7,0,82,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,34,7,0,83,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,100,11,0,81,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,136,11,0,82,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,172,11,0,83,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,168,12,0,81,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,208,12,0,82,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,248,12,0,83,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,13,0,80,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,236,13,0,81,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,24,14,0,82,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,68,14,0,83,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,2,0,40,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,208,2,0,40,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,5,0,40,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,40,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,18,0,80,0,0,0,2,0,0,0,15,0,0,0,0,2,0,0,2,128,0,0,0,128,22,0,80,0,0,0,2,0,0,0,18,0,0,0,0,2,0,0,2,128,0,0,0,0,45,0,80,0,0,0,2,0,0,0,36,0,0,0,0,2,0,0,2,128,0,0,0,64,19,0,77,0,0,0,2,0,0,0,8,0,0,0,0,4,0,0,2,128,0,0,0,233,3,0,77,0,0,0,1,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,210,7,0,77,0,0,0,2,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,99,0,0,144,97,0,0,240,96,0,0,184,96,0,0,120,125,0,0,64,85,0,0,80,83,0,0,208,79,0,0,216,78,0,0,0,0,0,0,152,69,0,0,224,68,0,0,72,68,0,0,200,67,0,0,144,66,0,0,120,65,0,0,240,64,0,0,152,64,0,0,0,64,0,0,144,63,0,0,16,63,0,0,184,70,0,0,136,62,0,0,56,70,0,0,224,71,0,0,88,71,0,0,248,61,0,0,136,61,0,0,192,60,0,0,104,59,0,0,216,58,0,0,80,58,0,0,0,0,0,0,168,77,0,0,0,0,0,0,144,76,0,0,0,0,0,0,16,74,0,0,0,0,0,0,136,72,0,0,0,0,0,0,224,71,0,0,0,0,0,0,88,71,0,0,2,0,0,0,0,0,0,0,0,0,0,0,184,70,0,0,1,0,0,0,168,77,0,0,1,0,0,0,144,76,0,0,1,0,0,0,16,74,0,0,1,0,0,0,136,72,0,0,1,0,0,0,224,71,0,0,1,0,0,0,88,71,0,0,1,0,0,0,56,70,0,0,1,0,0,0,184,70,0,0,2,0,0,0,168,77,0,0,2,0,0,0,144,76,0,0,2,0,0,0,16,74,0,0,2,0,0,0,136,72,0,0,2,0,0,0,224,71,0,0,2,0,0,0,88,71,0,0,2,0,0,0,56,70,0,0,2,0,0,0,184,70,0,0,96,49,0,0,48,49,0,0,240,48,0,0,192,48,0,0,0,48,0,0,80,47,0,0,144,46,0,0,88,46,0,0,0,46,0,0,184,45,0,0,112,45,0,0,24,45,0,0,136,95,0,0,72,95,0,0,184,94,0,0,0,94,0,0,88,93,0,0,0,93,0,0,208,92,0,0,120,92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,92,0,0,48,92,0,0,0,92,0,0,184,91,0,0,152,91,0,0,96,91,0,0,168,90,0,0,48,90,0,0,208,89,0,0,176,89,0,0,96,89,0,0,64,89,0,0,32,89,0,0,0,89,0,0,216,88,0,0,160,88,0,0,102,105,108,101,0,0,0,0,77,79,86,83,87,0,0,0,83,116,97,114,116,82,105,103,104,116,0,0,0,0,0,0,32,32,66,61,79,91,37,48,50,88,93,0,0,0,0,0,67,77,80,83,66,0,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,67,82,67,32,69,82,82,79,82,32,40,37,48,50,88,32,37,48,52,88,41,10,0,0,0,0,0,83,117,112,101,114,82,105,103,104,116,0,0,0,0,0,0,32,32,66,61,73,91,37,48,50,88,93,0,0,0,0,0,77,101,116,97,82,105,103,104,116,0,0,0,0,0,0,0,32,32,65,61,79,91,37,48,50,88,93,0,0,0,0,0,67,77,80,83,87,0,0,0,109,111,117,115,101,0,0,0,65,108,116,82,105,103,104,116,0,0,0,0,0,0,0,0,32,32,65,61,73,91,37,48,50,88,93,0,0,0,0,0,98,108,0,0,0,0,0,0,83,84,79,83,66,0,0,0,112,114,111,116,111,99,111,108,0,0,0,0,0,0,0,0,83,112,97,99,101,0,0,0,77,79,68,61,37,48,50,88,32,32,77,79,68,65,61,37,117,32,32,77,79,68,66,61,37,117,0,0,0,0,0,0,114,98,0,0,0,0,0,0,83,84,79,83,87,0,0,0,65,108,116,0,0,0,0,0,91,37,115,37,48,52,88,93,0,0,0,0,0,0,0,0,56,50,53,53,45,80,80,73,0,0,0,0,0,0,0,0,114,98,0,0,0,0,0,0,76,79,68,83,66,0,0,0,65,108,116,76,101,102,116,0,37,99,67,37,100,58,32,67,84,76,61,37,48,52,88,32,67,78,84,61,37,48,52,88,32,77,65,88,65,61,37,48,52,88,32,77,65,88,66,61,37,48,52,88,10,0,0,0,114,98,0,0,0,0,0,0,80,65,82,80,79,82,84,49,58,0,0,0,0,0,0,0,76,79,68,83,87,0,0,0,101,109,117,46,112,97,114,112,111,114,116,49,46,100,114,105,118,101,114,0,0,0,0,0,77,111,100,101,0,0,0,0,114,98,0,0,0,0,0,0,101,109,117,46,101,120,105,116], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([56,48,49,56,54,45,84,67,85,0,0,0,0,0,0,0,70,57,0,0,0,0,0,0,112,99,101,45,114,99,55,53,57,58,32,115,101,103,109,101,110,116,97,116,105,111,110,32,102,97,117,108,116,10,0,0,33,61,0,0,0,0,0,0,123,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,98,105,110,0,0,0,0,0,109,111,117,115,101,95,109,117,108,95,120,0,0,0,0,0,97,100,100,114,61,48,120,37,48,56,108,120,32,115,105,122,101,61,37,108,117,32,102,105,108,101,61,37,115,10,0,0,83,67,65,83,66,0,0,0,104,0,0,0,0,0,0,0,45,45,37,115,0,0,0,0,101,120,112,101,99,116,105,110,103,32,101,120,112,114,101,115,115,105,111,110,0,0,0,0,68,79,83,69,77,85,0,0,116,100,48,58,32,100,114,111,112,112,105,110,103,32,112,104,97,110,116,111,109,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,10,0,0,87,105,110,100,111,119,115,76,101,102,116,0,0,0,0,0,82,101,108,101,97,115,101,32,51,46,48,55,36,48,0,0,46,114,97,119,0,0,0,0,67,80,73,61,37,46,52,102,10,0,0,0,0,0,0,0,83,67,65,83,87,0,0,0,83,116,97,114,116,76,101,102,116,0,0,0,0,0,0,0,79,80,83,61,37,108,108,117,10,0,0,0,0,0,0,0,105,0,0,0,0,0,0,0,82,69,84,78,0,0,0,0,83,117,112,101,114,76,101,102,116,0,0,0,0,0,0,0,67,76,75,61,37,108,108,117,32,43,32,37,108,117,10,0,99,111,109,109,105,116,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,76,79,83,84,32,68,65,84,65,10,0,77,101,116,97,0,0,0,0,84,73,77,69,0,0,0,0,77,101,116,97,76,101,102,116,0,0,0,0,0,0,0,0,67,85,82,83,79,82,32,37,117,58,32,88,61,37,48,50,88,32,89,61,37,48,50,88,32,79,69,61,37,100,32,82,86,86,61,37,100,32,66,69,61,37,100,32,70,82,69,81,61,37,117,32,68,85,84,89,61,37,117,32,83,84,65,82,84,61,37,48,50,88,32,83,84,79,80,61,37,48,50,88,10,0,0,0,0,0,0,0,66,76,75,32,37,48,52,88,58,32,65,49,61,37,48,56,108,88,32,65,50,61,37,48,56,108,88,32,83,61,37,48,56,108,88,32,82,79,61,37,100,10,0,0,0,0,0,0,67,116,114,108,0,0,0,0,9,102,114,97,109,101,32,105,110,116,32,99,111,117,110,116,58,32,37,117,10,0,0,0,100,108,0,0,0,0,0,0,69,78,84,69,82,0,0,0,67,116,114,108,76,101,102,116,0,0,0,0,0,0,0,0,9,108,105,110,101,115,32,112,101,114,32,114,111,119,58,32,32,32,37,117,10,0,0,0,76,69,65,86,69,0,0,0,47,0,0,0,0,0,0,0,66,89,84,69,32,0,0,0,9,118,32,102,105,101,108,100,32,115,116,111,112,58,32,32,32,32,37,117,10,0,0,0,82,69,84,70,0,0,0,0,83,108,97,115,104,0,0,0,9,118,32,102,105,101,108,100,32,115,116,97,114,116,58,32,32,32,37,117,10,0,0,0,112,97,114,112,111,114,116,50,0,0,0,0,0,0,0,0,73,78,84,51,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,115,100,108,58,32,98,108,105,116,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,9,102,114,97,109,101,32,108,101,110,103,116,104,58,32,32,32,32,37,117,10,0,0,0,70,56,0,0,0,0,0,0,105,110,116,118,0,0,0,0,61,61,0,0,0,0,0,0,115,101,99,116,105,111,110,0,102,0,0,0,0,0,0,0,115,114,101,99,0,0,0,0,115,99,97,108,101,0,0,0,82,65,77,58,0,0,0,0,87,68,49,55,57,88,58,32,67,77,68,91,37,48,50,88,93,32,83,75,73,80,32,67,79,77,77,65,78,68,32,40,37,48,50,88,47,37,48,50,88,41,10,0,0,0,0,0,99,0,0,0,0,0,0,0,32,32,0,0,0,0,0,0,101,120,112,101,99,116,105,110,103,32,111,102,102,115,101,116,0,0,0,0,0,0,0,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,37,48,50,88,32,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,0,80,101,114,105,111,100,0,0,82,101,108,101,97,115,101,32,51,46,48,50,36,48,0,0,46,112,115,105,0,0,0,0,9,104,32,102,105,101,108,100,32,115,116,111,112,58,32,32,32,32,37,117,10,0,0,0,73,78,84,79,0,0,0,0,44,0,0,0,0,0,0,0,9,104,32,102,105,101,108,100,32,115,116,97,114,116,58,32,32,32,37,117,10,0,0,0,104,109,0,0,0,0,0,0,108,111,103,0,0,0,0,0,73,82,69,84,0,0,0,0,67,111,109,109,97,0,0,0,99,111,112,121,32,109,101,109,111,114,121,0,0,0,0,0,9,108,105,110,101,32,108,101,110,103,116,104,58,32,32,32,32,32,37,117,10,0,0,0,87,68,49,55,57,88,58,32,87,82,73,84,69,32,76,79,83,84,32,68,65,84,65,10,0,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,115,114,99,32,100,115,116,32,99,110,116,0,0,0,0,0,77,111,100,101,58,10,0,0,83,65,82,0,0,0,0,0,101,56,50,53,57,58,32,73,78,84,65,32,119,105,116,104,111,117,116,32,73,82,81,10,0,0,0,0,0,0,0,0,110,0,0,0,0,0,0,0,101,118,97,108,117,97,116,101,32,101,120,112,114,101,115,115,105,111,110,115,0,0,0,0,70,65,84,84,82,58,32,37,48,52,88,10,0,0,0,0,63,63,63,0,0,0,0,0,98,0,0,0,0,0,0,0,91,101,120,112,114,46,46,46,93,0,0,0,0,0,0,0,65,76,70,58,32,32,32,37,45,52,100,32,32,76,83,83,87,58,32,37,45,52,100,10,0,0,0,0,0,0,0,0,99,108,0,0,0,0,0,0,83,72,82,0,0,0,0,0,118,0,0,0,0,0,0,0,119,114,105,116,101,32,109,101,109,111,114,121,32,116,111,32,97,32,102,105,108,101,0,0,83,84,65,84,58,32,32,37,48,52,88,32,32,73,77,83,75,58,32,37,48,52,88,10,0,0,0,0,0,0,0,0,83,72,76,0,0,0,0,0,99,0,0,0,0,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,110,46,46,46,93,0,0,0,0,0,87,79,82,68,32,0,0,0,71,82,65,80,72,58,32,37,45,52,100,32,32,77,79,78,79,58,32,37,100,32,32,83,73,78,84,58,32,37,45,52,100,10,0,0,0,0,0,0,82,67,82,0,0,0,0,0,120,0,0,0,0,0,0,0,113,117,105,116,0,0,0,0,67,66,80,58,32,32,32,37,48,56,108,88,10,0,0,0,112,97,114,112,111,114,116,49,0,0,0,0,0,0,0,0,82,67,76,0,0,0,0,0,101,109,117,46,100,105,115,107,46,105,110,115,101,114,116,0,122,0,0,0,0,0,0,0,115,101,110,100,32,97,32,109,101,115,115,97,103,101,32,116,111,32,116,104,101,32,101,109,117,108,97,116,111,114,32,99,111,114,101,0,0,0,0,0,115,100,108,58,32,107,101,121,32,61,32,48,120,37,48,52,120,10,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,56,50,55,51,48,45,67,82,84,67,0,0,0,0,0,0,70,55,0,0,0,0,0,0,38,0,0,0,0,0,0,0,34,37,115,34,0,0,0,0,101,0,0,0,0,0,0,0,105,104,120,0,0,0,0,0,109,105,110,95,104,0,0,0,100,101,102,97,117,108,116,0,111,102,102,115,101,116,0,0,82,79,82,0,0,0,0,0,44,32,0,0,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,58,0,0,0,0,0,0,0,116,100,48,58,32,115,101,99,116,111,114,32,99,114,99,32,111,118,101,114,32,104,101,97,100,101,114,43,100,97,116,97,10,0,0,0,0,0,0,0,60,0,0,0,0,0,0,0,109,115,103,32,91,118,97,108,93,0,0,0,0,0,0,0,99,112,50,58,32,119,97,114,110,105,110,103,58,32,117,110,107,110,111,119,110,32,67,80,50,32,118,101,114,115,105,111,110,10,0,0,0,0,0,0,46,112,102,100,99,0,0,0,117,110,107,110,111,119,110,32,99,111,109,112,111,110,101,110,116,32,40,37,115,41,10,0,82,79,76,0,0,0,0,0,76,101,115,115,0,0,0,0,114,101,97,100,32,97,32,102,105,108,101,32,105,110,116,111,32,109,101,109,111,114,121,0,118,105,100,101,111,0,0,0,103,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,121,100,105,118,0,0,0,0,83,104,105,102,116,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,91,110,93,93,0,0,0,0,0,0,116,105,109,101,0,0,0,0,88,76,65,84,0,0,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,65,68,68,82,69,83,83,32,76,79,83,84,32,68,65,84,65,10,0,83,104,105,102,116,76,101,102,116,0,0,0,0,0,0,0,112,114,105,110,116,32,104,101,108,112,0,0,0,0,0,0,116,99,117,0,0,0,0,0,74,67,88,90,0,0,0,0,92,0,0,0,0,0,0,0,102,105,110,100,32,98,121,116,101,115,32,105,110,32,109,101,109,111,114,121,0,0,0,0,112,112,105,0,0,0,0,0,76,79,79,80,0,0,0,0,66,97,99,107,115,108,97,115,104,0,0,0,0,0,0,0,97,100,100,114,32,99,110,116,32,91,118,97,108,46,46,46,93,0,0,0,0,0,0,0,112,105,99,0,0,0,0,0,97,108,0,0,0,0,0,0,76,79,79,80,90,0,0,0,39,0,0,0,0,0,0,0,101,110,116,101,114,32,98,121,116,101,115,32,105,110,116,111,32,109,101,109,111,114,121,0,112,111,114,116,115,0,0,0,76,79,79,80,78,90,0,0,65,112,111,115,116,114,111,112,104,101,0,0,0,0,0,0,97,100,100,114,32,91,118,97,108,124,115,116,114,105,110,103,46,46,46,93,0,0,0,0,80,85,83,72,0,0,0,0,109,101,109,0,0,0,0,0,74,77,80,78,0,0,0,0,81,117,111,116,101,0,0,0,100,117,109,112,32,109,101,109,111,114,121,0,0,0,0,0,105,99,117,0,0,0,0,0,112,97,114,112,111,114,116,0,37,48,52,88,58,37,48,52,88,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,101,106,101,99,116,0,0,59,0,0,0,0,0,0,0,91,97,100,100,114,32,91,99,110,116,93,93,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,102,100,99,0,0,0,0,0,70,54,0,0,0,0,0,0,114,99,55,53,57,0,0,0,94,0,0,0,0,0,0,0,48,120,37,108,120,0,0,0,60,110,108,62,0,0,0,0,100,0,0,0,0,0,0,0,105,104,101,120,0,0,0,0,109,105,110,95,119,0,0,0,115,105,122,101,0,0,0,0,97,117,116,111,0,0,0,0,74,77,80,83,0,0,0,0,32,32,45,37,99,0,0,0,115,116,114,105,110,103,32,116,111,111,32,108,111,110,103,0,101,120,112,101,99,116,105,110,103,32,97,100,100,114,101,115,115,0,0,0,0,0,0,0,116,100,48,58,32,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,40,37,117,47,37,117,47,37,117,32,37,117,41,10,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,100,97,116,97,41,10,0,0,83,101,109,105,99,111,108,111,110,0,0,0,0,0,0,0,115,101,116,32,97,110,32,101,120,112,114,101,115,115,105,111,110,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,99,112,50,58,32,110,111,116,32,97,32,67,80,50,32,102,105,108,101,10,0,0,0,0,46,109,115,97,0,0,0,0,100,109,97,0,0,0,0,0,73,78,0,0,0,0,0,0,108,0,0,0,0,0,0,0,101,120,112,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,99,112,117,0,0,0,0,0,99,0,0,0,0,0,0,0,115,116,100,105,111,0,0,0,121,109,117,108,0,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,97,105,108,101,100,10,0,0,0,107,0,0,0,0,0,0,0,98,115,120,0,0,0,0,0,114,99,55,53,57,0,0,0,76,79,67,75,32,0,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,84,82,65,67,75,32,76,79,83,84,32,68,65,84,65,10,0,0,0,106,0,0,0,0,0,0,0,115,101,116,32,97,110,32,97,100,100,114,101,115,115,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,0,0,0,37,115,44,32,37,115,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,100,105,115,107,41,10,0,0,0,0,0,104,0,0,0,0,0,0,0,97,100,100,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,82,69,80,78,69,32,0,0,82,69,80,32,0,0,0,0,109,111,100,101,108,61,114,99,55,53,57,32,99,108,111,99,107,61,37,108,117,32,97,108,116,95,109,101,109,95,115,105,122,101,61,37,100,10,0,0,103,0,0,0,0,0,0,0,98,115,0,0,0,0,0,0,32,37,48,52,88,0,0,0,100,115,0,0,0,0,0,0,83,89,83,84,69,77,58,0,102,0,0,0,0,0,0,0,108,105,115,116,32,98,114,101,97,107,112,111,105,110,116,115,0,0,0,0,0,0,0,0,102,100,99,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,112,114,105,41,10,0,0,0,0,105,112,0,0,0,0,0,0,66,79,85,78,68,32,69,65,32,105,115,32,114,101,103,105,115,116,101,114,10,0,0,0,99,108,111,99,107,0,0,0,100,0,0,0,0,0,0,0,98,108,0,0,0,0,0,0,74,77,80,70,0,0,0,0,32,37,48,50,88,0,0,0,37,48,50,88,0,0,0,0,97,108,116,95,109,101,109,95,115,105,122,101,0,0,0,0,115,0,0,0,0,0,0,0,99,108,101,97,114,32,97,32,98,114,101,97,107,112,111,105,110,116,32,111,114,32,97,108,108,0,0,0,0,0,0,0,37,48,50,88,0,0,0,0,115,121,115,116,101,109,0,0,37,48,52,88,0,0,0,0,101,109,117,46,100,105,115,107,46,99,111,109,109,105,116,0,103,101,116,32,112,111,114,116,32,56,32,37,48,52,108,88,32,60,45,32,37,48,50,88,10,0,0,0,0,0,0,0,97,0,0,0,0,0,0,0,91,105,110,100,101,120,93,0,49,0,0,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,37,48,52,88,58,37,48,52,88,32,32,37,115,10,0,0,70,53,0,0,0,0,0,0,114,111,109,115,47,112,99,101,45,99,111,110,102,105,103,46,99,102,103,0,0,0,0,0,94,94,0,0,0,0,0,0,37,115,32,61,32,0,0,0,60,101,111,102,62,0,0,0,115,97,118,101,0,0,0,0,97,117,116,111,0,0,0,0,97,115,112,101,99,116,95,121,0,0,0,0,0,0,0,0,115,105,122,101,107,0,0,0,116,121,112,101,0,0,0,0,73,68,73,86,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,45,37,99,41,10,0,0,0,0,0,0,105,100,101,110,116,105,102,105,101,114,32,116,111,111,32,108,111,110,103,0,0,0,0,0,120,0,0,0,0,0,0,0,110,111,0,0,0,0,0,0,103,101,116,32,112,111,114,116,32,49,54,32,37,48,52,108,88,32,45,62,32,37,48,50,88,10,0,0,0,0,0,0,116,100,48,58,32,122,101,114,111,32,100,97,116,97,32,108,101,110,103,116,104,32,40,37,117,47,37,117,47,37,117,41,10,0,0,0,0,0,0,0,37,117,47,37,117,47,37,117,10,0,0,0,0,0,0,0,67,97,112,115,76,111,99,107,0,0,0,0,0,0,0,0,98,99,0,0,0,0,0,0,46,105,109,103,0,0,0,0,46,116,99,0,0,0,0,0,115,101,114,99,111,110,0,0,100,105,115,97,115,115,101,109,98,108,101,0,0,0,0,0,115,101,116,32,112,111,114,116,32,56,32,37,48,52,108,88,32,60,45,32,37,48,50,88,10,0,0,0,0,0,0,0,82,101,116,117,114,110,0,0,91,97,100,100,114,32,91,99,110,116,32,91,109,111,100,101,93,93,93,0,0,0,0,0,98,0,0,0,0,0,0,0,112,116,121,0,0,0,0,0,120,100,105,118,0,0,0,0,73,77,85,76,0,0,0,0,113,101,100,58,32,117,110,107,110,111,119,110,32,102,101,97,116,117,114,101,115,32,40,48,120,37,48,56,108,108,120,41,10,0,0,0,0,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,100,99,32,105,109,97,103,101,10,0,0,0,0,0,0,0,0,115,101,116,32,112,111,114,116,32,49,54,32,37,48,52,108,88,32,60,45,32,37,48,52,88,10,0,0,0,0,0,0,93,0,0,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,32,91,49,93,0,0,0,0,49,0,0,0,0,0,0,0,80,114,105,110,116,32,118,101,114,115,105,111,110,32,105,110,102,111,114,109,97,116,105,111,110,0,0,0,0,0,0,0,82,105,103,104,116,66,114,97,99,107,101,116,0,0,0,0,87,68,49,55,57,88,58,32,68,61,37,117,32,83,69,76,69,67,84,32,84,82,65,67,75,32,69,82,82,79,82,32,40,99,61,37,117,32,104,61,37,117,41,10,0,0,0,0,112,114,105,110,116,32,115,116,97,116,117,115,32,40,99,112,117,124,105,99,117,124,109,101,109,124,124,112,112,105,124,112,105,99,124,114,99,55,53,57,124,116,99,117,124,116,105,109,101,41,0,0,0,0,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,112,114,105,41,10,0,0,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,118,101,114,115,105,111,110,0,91,0,0,0,0,0,0,0,98,108,111,99,107,95,99,111,117,110,116,0,0,0,0,0,91,119,104,97,116,93,0,0,109,111,100,101,108,61,56,48,49,56,54,10,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,100,101,98,117,103,32,91,110,111,93,0,76,101,102,116,66,114,97,99,107,101,116,0,0,0,0,0,98,108,111,99,107,95,115,116,97,114,116,0,0,0,0,0,115,101,116,32,97,32,114,101,103,105,115,116,101,114,0,0,115,115,0,0,0,0,0,0,84,69,83,84,0,0,0,0,42,42,42,32,101,114,114,111,114,32,108,111,97,100,105,110,103,32,116,104,101,32,78,86,77,32,40,37,115,41,10,0,118,101,114,98,111,115,101,0,112,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,118,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,10,0,0,0,0,0,0,91,114,101,103,32,118,97,108,93,0,0,0,0,0,0,0,83,84,68,0,0,0,0,0,102,105,108,101,61,37,115,32,115,97,110,105,116,105,122,101,61,37,100,10,0,0,0,0,83,101,116,32,116,104,101,32,116,101,114,109,105,110,97,108,32,100,101,118,105,99,101,0,111,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,115,0,0,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,44,32,119,105,116,104,111,117,116,32,116,114,97,99,101,32,105,110,32,99,97,108,108,115,32,91,49,93,0,0,0,0,67,76,68,0,0,0,0,0,78,86,77,58,0,0,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,73,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,104,0,0,0,0,0,0,0,112,114,101,102,101,116,99,104,32,113,117,101,117,101,32,99,108,101,97,114,47,102,105,108,108,47,115,116,97,116,117,115,0,0,0,0,0,0,0,0,104,111,115,116,32,115,121,115,116,101,109,32,116,111,111,32,115,108,111,119,44,32,115,107,105,112,112,105,110,103,32,49,32,115,101,99,111,110,100,46,10,0,0,0,0,0,0,0,83,84,73,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,115,97,110,105,116,105,122,101,95,110,118,109,0,0,0,0,83,101,116,32,116,104,101,32,67,80,85,32,115,112,101,101,100,0,0,0,0,0,0,0,117,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,99,0,0,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,116,101,114,109,46,115,99,114,101,101,110,115,104,111,116,0,91,99,124,102,124,115,93,0,70,52,0,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,124,0,0,0,0,0,0,0,125,10,0,0,0,0,0,0,107,101,121,98,111,97,114,100,32,98,117,102,102,101,114,32,111,118,101,114,102,108,111,119,10,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,108,111,97,100,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,98,105,110,97,114,121,32,97,100,100,114,61,48,120,37,48,56,108,120,10,0,0,0,0,0,97,115,112,101,99,116,95,120,0,0,0,0,0,0,0,0,115,105,122,101,109,0,0,0,100,114,105,118,101,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,45,37,99,41,10,0,0,0,0,0,0,0,67,76,73,0,0,0,0,0,42,42,42,32,37,115,32,91,37,115,93,10,0,0,0,0,98,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,0,0,0,0,0,0,102,97,108,115,101,0,0,0,115,100,108,0,0,0,0,0,110,118,109,46,100,97,116,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,110,111,32,100,97,116,97,41,10,0,0,0,0,105,110,116,0,0,0,0,0,121,0,0,0,0,0,0,0,32,37,48,50,88,0,0,0,46,105,109,100,0,0,0,0,46,112,114,105,0,0,0,0,45,45,0,0,0,0,0,0,111,117,116,112,117,116,32,97,32,98,121,116,101,32,111,114,32,119,111,114,100,32,116,111,32,97,32,112,111,114,116,0,83,84,67,0,0,0,0,0,110,118,109,0,0,0,0,0,115,112,101,101,100,0,0,0,116,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,32,40,99,111,119,41,10,0,0,91,98,124,119,93,32,112,111,114,116,32,118,97,108,0,0,72,65,76,84,61,49,10,0,115,101,114,99,111,110,0,0,120,109,117,108,0,0,0,0,67,76,67,0,0,0,0,0,99,111,109,109,105,116,0,0,99,111,109,109,105,116,0,0,42,42,42,32,115,101,116,116,105,110,103,32,115,111,117,110,100,32,100,114,105,118,101,114,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,99,111,109,109,105,116,0,0,78,101,118,101,114,32,115,116,111,112,32,114,117,110,110,105,110,103,32,91,110,111,93,0,114,0,0,0,0,0,0,0,115,101,116,32,105,110,116,101,114,114,117,112,116,32,110,32,108,111,103,32,101,120,112,114,101,115,115,105,111,110,32,116,111,32,101,120,112,114,0,0,83,80,0,0,0,0,0,0,118,111,108,117,109,101,61,37,117,32,115,114,97,116,101,61,37,108,117,32,108,111,119,112,97,115,115,61,37,108,117,32,100,114,105,118,101,114,61,37,115,10,0,0,0,0,0,0,110,111,45,109,111,110,105,116,111,114,0,0,0,0,0,0,101,0,0,0,0,0,0,0,87,68,49,55,57,88,58,32,70,79,82,77,65,84,32,76,79,83,84,32,68,65,84,65,10,0,0,0,0,0,0,0,114,119,0,0,0,0,0,0,105,110,116,32,110,32,91,101,120,112,114,93,0,0,0,0,68,88,0,0,0,0,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,83,80,69,65,75,69,82,58,0,0,0,0,0,0,0,0,83,116,97,114,116,32,114,117,110,110,105,110,103,32,105,109,109,101,100,105,97,116,101,108,121,32,91,110,111,93,0,0,119,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,108,105,115,116,32,105,110,116,101,114,114,117,112,116,32,108,111,103,32,101,120,112,114,101,115,115,105,111,110,115,0,0,67,88,0,0,0,0,0,0,108,111,119,112,97,115,115,0,114,117,110,0,0,0,0,0,113,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,37,115,32,98,108,111,99,107,115,61,37,108,117,32,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,32,37,115,32,102,105,108,101,61,37,115,10,0,62,62,0,0,0,0,0,0,105,110,116,32,108,0,0,0,99,115,0,0,0,0,0,0,65,88,0,0,0,0,0,0,115,97,109,112,108,101,95,114,97,116,101,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,101,114,114,111,114,32,91,110,111,93,0,84,97,98,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,0,60,60,0,0,0,0,0,0,115,105,109,117,108,97,116,101,32,112,114,101,115,115,105,110,103,32,111,114,32,114,101,108,101,97,115,105,110,103,32,107,101,121,115,0,0,0,0,0,66,72,0,0,0,0,0,0,118,111,108,117,109,101,0,0,113,117,105,101,116,0,0,0,66,97,99,107,115,112,97,99,101,0,0,0,0,0,0,0,116,101,108,101,100,105,115,107,0,0,0,0,0,0,0,0,62,62,62,0,0,0,0,0,67,65,76,76,70,0,0,0,91,91,43,124,45,93,107,101,121,46,46,46,93,0,0,0,68,72,0,0,0,0,0,0,100,114,105,118,101,114,0,0,83,101,116,32,116,104,101,32,108,111,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,0,0,0,61,0,0,0,0,0,0,0,112,115,105,0,0,0,0,0,60,60,60,0,0,0,0,0,105,110,112,117,116,32,97,32,98,121,116,101,32,111,114,32,119,111,114,100,32,102,114,111,109,32,97,32,112,111,114,116,0,0,0,0,0,0,0,0,115,101,116,116,105,110,103,32,99,108,111,99,107,32,116,111,32,37,108,117,10,0,0,0,67,72,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,115,112,101,97,107,101,114,0,108,111,103,0,0,0,0,0,69,113,117,97,108,0,0,0,112,102,100,99,45,97,117,116,111,0,0,0,0,0,0,0,107,101,121,109,97,112,0,0,116,101,114,109,46,101,115,99,97,112,101,0,0,0,0,0,91,98,124,119,93,32,112,111,114,116,0,0,0,0,0,0,70,51,0,0,0,0,0,0,38,38,0,0,0,0,0,0,99,112,117,46,115,112,101,101,100,32,61,32,0,0,0,0,37,115,32,123,10,0,0,0,60,110,111,110,101,62,0,0,37,115,58,37,108,117,58,32,37,115,0,0,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,115,114,101,99,10,0,0,0,0,101,115,99,97,112,101,0,0,98,97,115,101,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,99,111,119,32,102,105,108,101,61,37,115,10,0,0,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,37,115,41,10,0,0,0,0,0,0,0,65,72,0,0,0,0,0,0,99,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,119,97,118,0,0,0,0,0,112,99,101,45,114,99,55,53,57,0,0,0,0,0,0,0,116,100,48,58,32,116,114,97,99,107,32,99,114,99,32,40,37,48,50,88,32,37,48,52,88,41,10,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,104,101,97,100,101,114,41,10,0,0,0,0,0,0,0,0,112,115,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,97,102,116,101,114,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,45,0,0,0,0,0,0,0,48,98,0,0,0,0,0,0,100,99,52,50,58,32,116,97,103,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,0,0,112,102,100,99,0,0,0,0,62,61,0,0,0,0,0,0,46,105,109,97,0,0,0,0,46,112,98,105,116,0,0,0,119,98,0,0,0,0,0,0,45,0,0,0,0,0,0,0,112,114,105,110,116,32,104,101,108,112,32,111,110,32,109,101,115,115,97,103,101,115,0,0,66,76,0,0,0,0,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,105,110,105,45,97,112,112,101,110,100,0,0,0,0,0,0,77,105,110,117,115,0,0,0,48,120,0,0,0,0,0,0,105,109,100,0,0,0,0,0,114,117,110,0,0,0,0,0,32,32,73,37,99,32,68,37,99,32,79,37,99,32,83,37,99,32,90,37,99,32,65,37,99,32,80,37,99,32,67,37,99,10,0,0,0,0,0,0,112,111,115,105,120,0,0,0,109,115,121,115,0,0,0,0,68,76,0,0,0,0,0,0,119,98,0,0,0,0,0,0,109,111,110,111,99,104,114,111,109,101,61,37,100,32,50,50,75,72,122,61,37,100,32,109,105,110,95,104,61,37,117,10,0,0,0,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,98,101,102,111,114,101,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,114,43,98,0,0,0,0,0,105,109,97,103,101,100,105,115,107,0,0,0,0,0,0,0,60,61,0,0,0,0,0,0,67,76,0,0,0,0,0,0,86,73,68,69,79,58,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,32,102,111,114,32,100,114,105,118,101,32,37,117,10,0,0,105,110,105,45,112,114,101,102,105,120,0,0,0,0,0,0,57,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,87,68,49,55,57,88,58,32,109,111,116,111,114,32,105,115,32,111,102,102,33,10,0,0,100,99,52,50,0,0,0,0,33,61,0,0,0,0,0,0,114,117,110,32,117,110,116,105,108,32,67,83,32,99,104,97,110,103,101,115,0,0,0,0,101,56,50,53,57,58,32,115,112,101,99,105,97,108,32,109,97,115,107,32,109,111,100,101,32,101,110,97,98,108,101,100,10,0,0,0,0,0,0,0,65,76,0,0,0,0,0,0,102,100,99,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,10,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,118,105,100,101,111,32,116,121,112,101,32,40,37,115,41,10,0,0,0,0,99,111,109,109,105,116,0,0,83,101,116,32,116,104,101,32,118,105,100,101,111,32,100,101,118,105,99,101,0,0,0,0,56,0,0,0,0,0,0,0,100,101,102,105,110,101,100,0,99,112,50,0,0,0,0,0,61,61,0,0,0,0,0,0,102,97,114,0,0,0,0,0,115,116,100,105,111,58,102,105,108,101,61,0,0,0,0,0,66,80,0,0,0,0,0,0,114,98,0,0,0,0,0,0,99,111,108,111,114,0,0,0,99,111,109,109,105,116,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,0,0,43,49,0,0,0,0,0,0,118,105,100,101,111,0,0,0,55,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,97,110,97,100,105,115,107,0,114,117,110,32,119,105,116,104,32,98,114,101,97,107,112,111,105,110,116,115,0,0,0,0,32,32,0,0,0,0,0,0,101,115,0,0,0,0,0,0,66,88,0,0,0,0,0,0,104,105,114,101,115,0,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,0,0,0,0,45,49,0,0,0,0,0,0,65,100,100,32,97,32,100,105,114,101,99,116,111,114,121,32,116,111,32,116,104,101,32,115,101,97,114,99,104,32,112,97,116,104,0,0,0,0,0,0,54,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,112,97,114,116,105,116,105,111,110,0,0,0,0,0,0,0,91,97,100,100,114,46,46,46,93,0,0,0,0,0,0,0,32,32,32,0,0,0,0,0,68,73,0,0,0,0,0,0,109,111,110,111,0,0,0,0,42,42,42,32,99,111,109,109,105,116,32,102,97,105,108,101,100,32,102,111,114,32,97,116,32,108,101,97,115,116,32,111,110,101,32,100,105,115,107,10,0,0,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,112,97,116,104,0,0,0,0,53,0,0,0,0,0,0,0,113,101,100,0,0,0,0,0,67,65,76,76,0,0,0,0,103,98,0,0,0,0,0,0,32,37,48,50,88,0,0,0,83,73,0,0,0,0,0,0,109,105,110,95,104,0,0,0,99,111,109,109,105,116,105,110,103,32,97,108,108,32,100,114,105,118,101,115,10,0,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,52,0,0,0,0,0,0,0,33,0,0,0,0,0,0,0,112,99,101,0,0,0,0,0,38,38,0,0,0,0,0,0,99,108,111,99,107,32,116,104,101,32,115,105,109,117,108,97,116,105,111,110,32,91,49,93,0,0,0,0,0,0,0,0,60,45,0,0,0,0,0,0,67,80,85,58,0,0,0,0,66,80,43,68,73,0,0,0,101,109,117,46,99,111,110,102,105,103,46,115,97,118,101,0,118,105,100,101,111,0,0,0,97,108,108,0,0,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,115,116,114,105,110,103,0,0,51,0,0,0,0,0,0,0,126,0,0,0,0,0,0,0,42,42,42,32,110,111,32,116,101,114,109,105,110,97,108,32,102,111,117,110,100,10,0,0,100,111,115,101,109,117,0,0,124,124,0,0,0,0,0,0,114,101,112,111,114,116,95,107,101,121,115,0,0,0,0,0,80,54,10,37,117,32,37,117,10,37,117,10,0,0,0,0,91,99,110,116,93,0,0,0,45,62,0,0,0,0,0,0,70,50,0,0,0,0,0,0,99,111,109,109,105,116,0,0,124,124,0,0,0,0,0,0,10,0,0,0,0,0,0,0,105,103,110,111,114,105,110,103,32,112,99,101,32,107,101,121,58,32,37,117,32,48,120,37,48,52,120,32,40,37,115,41,10,0,0,0,0,0,0,0,60,110,111,110,101,62,0,0,32,9,0,0,0,0,0,0,37,45,57,115,32,0,0,0,100,105,0,0,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,105,104,101,120,10,0,0,0,0,110,117,108,108,0,0,0,0,97,100,100,114,101,115,115,0,42,42,42,32,99,111,119,32,102,97,105,108,101,100,32,40,100,114,105,118,101,61,37,117,32,102,105,108,101,61,37,115,41,10,0,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,66,80,43,83,73,0,0,0,115,0,0,0,0,0,0,0,121,101,115,0,0,0,0,0,110,117,108,108,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,116,100,48,58,32,104,101,97,100,101,114,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,109,102,109,0,0,0,0,0,101,106,101,99,116,105,110,103,32,100,114,105,118,101,32,37,108,117,10,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,116,114,97,99,107,32,104,101,97,100,101,114,41,10,0,112,115,105,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,112,102,100,99,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,99,111,110,102,105,103,0,0,50,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,100,99,52,50,58,32,100,97,116,97,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,0,0,0,0,0,32,45,0,0,0,0,0,0,105,109,97,103,101,0,0,0,102,117,108,108,115,99,114,101,101,110,0,0,0,0,0,0,46,105,109,97,103,101,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,108,117,41,10,0,0,0,0,0,0,109,102,109,58,32,117,110,107,110,111,119,110,32,97,100,100,114,101,115,115,32,109,97,114,107,32,40,109,97,114,107,61,48,120,37,48,50,120,41,10,0,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,99,104,97,114,45,112,116,121,58,32,37,115,10,0,0,0,119,114,105,116,101,0,0,0,37,48,52,88,58,37,48,52,88,58,32,105,110,116,32,37,48,50,88,32,91,65,88,61,37,48,52,88,32,66,88,61,37,48,52,88,32,67,88,61,37,48,52,88,32,68,88,61,37,48,52,88,32,68,83,61,37,48,52,88,32,69,83,61,37,48,52,88,93,10,0,0,37,115,32,37,48,50,88,0,115,105,0,0,0,0,0,0,112,99,101,37,48,52,117,46,112,112,109,0,0,0,0,0,66,88,43,68,73,0,0,0,100,105,115,107,0,0,0,0,46,112,98,105,116,0,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,80,114,105,110,116,32,117,115,97,103,101,32,105,110,102,111,114,109,97,116,105,111,110,0,49,0,0,0,0,0,0,0,47,0,0,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,110,117,108,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,114,97,109,0,0,0,0,0,37,48,52,88,58,37,48,52,88,58,32,117,110,100,101,102,105,110,101,100,32,111,112,101,114,97,116,105,111,110,32,91,37,48,50,88,32,37,48,50,120,93,10,0,0,0,0,0,67,83,61,37,48,52,88,32,32,68,83,61,37,48,52,88,32,32,69,83,61,37,48,52,88,32,32,83,83,61,37,48,52,88,32,32,73,80,61,37,48,52,88,32,32,70,32,61,37,48,52,88,0,0,0,0,114,101,97,100,0,0,0,0,110,117,108,108,0,0,0,0,98,112,0,0,0,0,0,0,109,105,99,114,111,115,111,102,116,0,0,0,0,0,0,0,114,43,98,0,0,0,0,0,66,88,43,83,73,0,0,0,114,43,98,0,0,0,0,0,114,43,98,0,0,0,0,0,102,105,108,101,48,61,37,115,32,102,105,108,101,49,61,37,115,10,0,0,0,0,0,0,42,42,42,32,100,105,115,107,32,101,106,101,99,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,114,43,98,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,104,101,108,112,0,0,0,0,96,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,115,100,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,0,114,98,0,0,0,0,0,0,94,61,0,0,0,0,0,0,114,98,0,0,0,0,0,0,117,0,0,0,0,0,0,0,69,83,67,0,0,0,0,0,114,98,0,0,0,0,0,0,114,98,0,0,0,0,0,0,114,43,98,0,0,0,0,0,115,112,0,0,0,0,0,0,63,0,0,0,0,0,0,0,35,32,71,101,110,101,114,97,116,101,100,32,97,117,116,111,109,97,116,105,99,97,108,108,121,32,98,121,32,108,105,98,105,110,105,10,10,0,0,0,68,83,58,0,0,0,0,0,70,68,67,58,0,0,0,0,32,9,0,0,0,0,0,0,56,0,0,0,0,0,0,0,91,37,48,52,88,58,37,48,52,88,93,32,0,0,0,0,117,115,97,103,101,58,32,112,99,101,45,114,99,55,53,57,32,91,111,112,116,105,111,110,115,93,0,0,0,0,0,0,66,97,99,107,113,117,111,116,101,0,0,0,0,0,0,0,37,108,117,0,0,0,0,0,101,108,115,101,0,0,0,0,87,68,49,55,57,88,58,32,67,77,68,91,37,48,50,88,93,32,85,78,75,78,79,87,78,32,67,79,77,77,65,78,68,10,0,0,0,0,0,0,115,100,108,0,0,0,0,0,102,105,108,101,0,0,0,0,38,61,0,0,0,0,0,0,116,0,0,0,0,0,0,0,101,56,50,53,57,58,32,112,111,108,108,32,99,111,109,109,97,110,100,10,0,0,0,0,114,0,0,0,0,0,0,0,98,120,0,0,0,0,0,0,112,97,114,115,101,32,101,114,114,111,114,32,98,101,102,111,114,101,0,0,0,0,0,0,83,83,58,0,0,0,0,0,114,101,115,101,116,32,107,101,121,98,111,97,114,100,10,0,102,105,108,101,49,0,0,0,58,0,0,0,0,0,0,0,112,99,101,0,0,0,0,0,55], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([102,100,99,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,100,105,115,107,41,10,0,0,0,112,99,101,45,114,99,55,53,57,58,32,82,67,55,53,57,32,80,105,99,99,111,108,105,110,101,32,101,109,117,108,97,116,111,114,0,0,0,0,0,80,97,117,115,101,0,0,0,45,0,0,0,0,0,0,0,59,0,0,0,0,0,0,0,42,42,42,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,32,39,120,49,49,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,111,112,116,105,111,110,97,108,0,0,0,0,0,0,0,0,124,61,0,0,0,0,0,0,101,120,112,101,99,116,105,110,103,32,111,102,102,115,101,116,0,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,58,0,0,0,0,0,0,0,115,0,0,0,0,0,0,0,101,109,117,46,99,111,110,102,105,103,46,115,97,118,101,32,32,32,32,32,32,60,102,105,108,101,110,97,109,101,62,10,101,109,117,46,101,120,105,116,10,101,109,117,46,115,116,111,112,10,101,109,117,46,112,97,117,115,101,32,32,32,32,32,32,32,32,32,32,32,32,34,48,34,32,124,32,34,49,34,10,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,10,101,109,117,46,114,101,115,101,116,10,10,101,109,117,46,99,112,117,46,115,112,101,101,100,32,32,32,32,32,32,32,32,60,102,97,99,116,111,114,62,10,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,32,32,32,60,97,100,106,117,115,116,109,101,110,116,62,10,10,101,109,117,46,100,105,115,107,46,99,111,109,109,105,116,32,32,32,32,32,32,91,60,100,114,105,118,101,62,93,10,101,109,117,46,100,105,115,107,46,101,106,101,99,116,32,32,32,32,32,32,32,60,100,114,105,118,101,62,10,101,109,117,46,100,105,115,107,46,105,110,115,101,114,116,32,32,32,32,32,32,60,100,114,105,118,101,62,58,60,102,110,97,109,101,62,10,10,101,109,117,46,112,97,114,112,111,114,116,49,46,100,114,105,118,101,114,32,32,60,100,114,105,118,101,114,62,10,101,109,117,46,112,97,114,112,111,114,116,49,46,102,105,108,101,32,32,32,32,60,102,105,108,101,110,97,109,101,62,10,101,109,117,46,112,97,114,112,111,114,116,50,46,100,114,105,118,101,114,32,32,60,100,114,105,118,101,114,62,10,101,109,117,46,112,97,114,112,111,114,116,50,46,102,105,108,101,32,32,32,32,60,102,105,108,101,110,97,109,101,62,10,10,101,109,117,46,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,32,32,34,48,34,32,124,32,34,49,34,10,101,109,117,46,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,10,101,109,117,46,116,101,114,109,46,103,114,97,98,10,101,109,117,46,116,101,114,109,46,114,101,108,101,97,115,101,10,101,109,117,46,116,101,114,109,46,115,99,114,101,101,110,115,104,111,116,32,32,91,60,102,105,108,101,110,97,109,101,62,93,10,101,109,117,46,116,101,114,109,46,116,105,116,108,101,32,32,32,32,32,32,32,60,116,105,116,108,101,62,10,0,0,0,37,48,52,88,58,32,37,48,50,88,10,0,0,0,0,0,37,48,52,88,58,32,37,48,52,88,10,0,0,0,0,0,43,0,0,0,0,0,0,0,100,120,0,0,0,0,0,0,107,101,121,58,32,37,115,37,115,10,0,0,0,0,0,0,67,83,58,0,0,0,0,0,117,110,107,110,111,119,110,32,107,101,121,58,32,37,115,10,0,0,0,0,0,0,0,0,37,48,50,88,58,32,37,115,10,0,0,0,0,0,0,0,102,105,108,101,48,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,54,0,0,0,0,0,0,0,110,101,101,100,32,97,110,32,101,120,112,114,101,115,115,105,111,110,0,0,0,0,0,0,112,99,101,45,114,99,55,53,57,32,118,101,114,115,105,111,110,32,50,48,49,52,48,51,49,49,45,101,57,99,97,48,100,57,45,109,111,100,10,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,50,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,83,99,114,76,107,0,0,0,43,0,0,0,0,0,0,0,99,97,110,39,116,32,111,112,101,110,32,105,110,99,108,117,100,101,32,102,105,108,101,58,0,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,0,0,0,0,120,49,49,0,0,0,0,0,114,101,97,100,111,110,108,121,0,0,0,0,0,0,0,0,62,62,61,0,0,0,0,0,119,98,0,0,0,0,0,0,37,48,50,88,58,32,60,100,101,108,101,116,101,100,62,10,0,0,0,0,0,0,0,0,110,101,101,100,32,97,110,32,105,110,116,101,114,114,117,112,116,32,110,117,109,98,101,114,0,0,0,0,0,0,0,0,115,101,116,0,0,0,0,0,108,0,0,0,0,0,0,0,97,0,0,0,0,0,0,0,108,111,103,32,119,104,97,116,63,0,0,0,0,0,0,0,105,110,116,0,0,0,0,0,114,98,0,0,0,0,0,0,110,101,101,100,32,97,32,118,97,108,117,101,0,0,0,0,99,120,0,0,0,0,0,0,110,101,101,100,32,97,32,112,111,114,116,32,97,100,100,114,101,115,115,0,0,0,0,0,102,108,97,103,115,0,0,0,69,83,58,0,0,0,0,0,119,0,0,0,0,0,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,80,81,58,0,0,0,0,0,102,100,99,0,0,0,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,53,0,0,0,0,0,0,0,112,113,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,32,40,37,115,41,10,0,0,0,0,0,0,0,112,99,101,45,114,99,55,53,57,32,118,101,114,115,105,111,110,32,50,48,49,52,48,51,49,49,45,101,57,99,97,48,100,57,45,109,111,100,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,50,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,83,99,114,111,108,108,76,111,99,107,0,0,0,0,0,0,62,62,0,0,0,0,0,0,63,0,0,0,0,0,0,0,114,97,109,0,0,0,0,0,98,97,115,101,0,0,0,0,69,83,67,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,111,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,103,0,0,0,60,60,61,0,0,0,0,0,114,98,0,0,0,0,0,0,102,0,0,0,0,0,0,0,80,85,83,72,65,0,0,0,37,48,52,108,88,10,0,0,114,0,0,0,0,0,0,0,80,79,80,65,0,0,0,0,98,97,100,32,114,101,103,105,115,116,101,114,32,40,37,115,41,10,0,0,0,0,0,0,66,79,85,78,68,0,0,0,109,105,115,115,105,110,103,32,114,101,103,105,115,116,101,114,10,0,0,0,0,0,0,0,68,66,0,0,0,0,0,0,117,110,107,110,111,119,110,32,115,105,103,110,97,108,32,40,37,115,41,10,0,0,0,0,80,67,69,72,0,0,0,0,99,111,119,0,0,0,0,0,112,105,99,46,105,114,113,55,0,0,0,0,0,0,0,0,97,120,0,0,0,0,0,0,73,78,83,66,0,0,0,0,69,120,116,114,97,49,54,0,37,115,10,10,0,0,0,0,112,105,99,46,105,114,113,54,0,0,0,0,0,0,0,0,73,78,83,87,0,0,0,0,69,120,116,114,97,49,53,0,112,105,99,46,105,114,113,53,0,0,0,0,0,0,0,0,79,85,84,83,66,0,0,0,69,120,116,114,97,49,52,0,112,105,99,46,105,114,113,52,0,0,0,0,0,0,0,0,116,121,112,101,61,114,101,109,111,116,101,32,100,114,105,118,101,114,61,37,115,10,0,0,79,85,84,83,87,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,69,120,116,114,97,49,51,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,121,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,112,105,99,46,105,114,113,51,0,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,99,111,110,102,105,103,32,102,105,108,101,32,102,97,105,108,101,100,10,0,80,114,116,83,99,110,0,0,60,60,0,0,0,0,0,0,105,110,99,108,117,100,101,0,97,100,100,114,101,115,115,0,100,114,105,118,101,114,61,37,115,32,69,83,67,61,37,115,32,97,115,112,101,99,116,61,37,117,47,37,117,32,109,105,110,95,115,105,122,101,61,37,117,42,37,117,32,115,99,97,108,101,61,37,117,32,109,111,117,115,101,61,91,37,117,47,37,117,32,37,117,47,37,117,93,10,0,0,0,0,0,0,82,79,77,58,0,0,0,0,74,71,0,0,0,0,0,0,115,105,122,101,109,0,0,0,47,61,0,0,0,0,0,0,69,120,116,114,97,49,50,0,46,120,100,102,0,0,0,0,112,105,99,46,105,114,113,50,0,0,0,0,0,0,0,0,74,76,69,0,0,0,0,0,69,120,116,114,97,49,49,0,112,105,99,46,105,114,113,49,0,0,0,0,0,0,0,0,112,0,0,0,0,0,0,0,74,71,69,0,0,0,0,0,69,120,116,114,97,49,48,0,112,105,99,46,105,114,113,48,0,0,0,0,0,0,0,0,74,76,0,0,0,0,0,0,69,120,116,114,97,57,0,0,109,105,115,115,105,110,103,32,118,97,108,117,101,10,0,0,74,80,79,0,0,0,0,0,69,120,116,114,97,56,0,0,109,105,115,115,105,110,103,32,115,105,103,110,97,108,10,0,74,80,69,0,0,0,0,0,69,120,116,114,97,55,0,0,37,117,58,32,67,84,76,61,37,48,52,88,32,67,78,84,61,37,48,52,88,32,83,82,67,61,37,48,53,108,88,32,68,83,84,61,37,48,53,108,88,10,0,0,0,0,0,0,37,52,117,32,32,0,0,0,98,104,0,0,0,0,0,0,74,78,83,0,0,0,0,0,69,120,116,114,97,54,0,0,56,48,49,56,54,45,68,77,65,0,0,0,0,0,0,0,74,83,0,0,0,0,0,0,49,0,0,0,0,0,0,0,60,98,97,100,62,0,0,0,69,120,116,114,97,53,0,0,68,82,73,86,69,32,37,117,58,32,83,69,76,61,37,100,32,82,68,89,61,37,100,32,77,61,37,100,32,32,67,61,37,48,50,88,32,72,61,37,88,32,32,80,79,83,61,37,108,117,32,67,78,84,61,37,108,117,10,0,0,0,0,0,74,65,0,0,0,0,0,0,119,97,118,0,0,0,0,0,69,120,116,114,97,52,0,0,115,110,100,45,115,100,108,58,32,101,114,114,111,114,32,105,110,105,116,105,97,108,105,122,105,110,103,32,97,117,100,105,111,32,115,117,98,115,121,115,116,101,109,32,40,37,115,41,10,0,0,0,0,0,0,0,83,84,65,84,85,83,61,37,48,50,88,32,32,67,77,68,61,37,48,50,88,10,0,0,80,65,82,80,79,82,84,50,58,0,0,0,0,0,0,0,74,66,69,0,0,0,0,0,101,109,117,46,112,97,117,115,101,0,0,0,0,0,0,0,69,120,116,114,97,51,0,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,120,0,0,0,0,0,0,0,51,0,0,0,0,0,0,0,70,67,82,61,37,48,50,88,32,32,82,83,86,61,37,48,50,88,10,0,0,0,0,0,102,105,108,101,61,34,37,115,34,10,0,0,0,0,0,0,80,114,105,110,116,83,99,114,101,101,110,0,0,0,0,0,62,0,0,0,0,0,0,0,105,102,0,0,0,0,0,0,121,0,0,0,0,0,0,0,119,97,118,102,105,108,116,101,114,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,84,69,82,77,58,0,0,0,114,111,109,0,0,0,0,0,74,78,90,0,0,0,0,0,115,105,122,101,107,0,0,0,42,61,0,0,0,0,0,0,69,120,116,114,97,50,0,0,46,116,100,48,0,0,0,0,49,55,57,88,45,70,68,67,0,0,0,0,0,0,0,0,74,90,0,0,0,0,0,0,69,120,116,114,97,49,0,0,45,0,0,0,0,0,0,0,112,113,0,0,0,0,0,0,74,78,67,0,0,0,0,0,82,105,103,104,116,0,0,0,37,52,115,91,37,117,93,58,32,67,84,76,61,37,48,52,88,32,32,67,78,84,61,37,48,52,108,88,32,32,73,61,37,117,32,82,61,37,117,32,77,61,37,117,32,83,61,37,117,10,0,0,0,0,0,0,74,67,0,0,0,0,0,0,68,111,119,110,0,0,0,0,80,77,82,61,37,48,52,88,32,32,80,83,84,61,37,48,52,88,32,32,73,78,84,61,37,100,10,0,0,0,0,0,74,78,79,0,0,0,0,0,76,101,102,116,0,0,0,0,32,73,83,82,61,0,0,0,114,101,115,101,116,32,115,121,115,116,101,109,10,0,0,0,74,79,0,0,0,0,0,0,85,112,0,0,0,0,0,0,32,73,77,82,61,0,0,0,100,104,0,0,0,0,0,0,67,77,80,0,0,0,0,0,116,99,58,32,117,110,107,110,111,119,110,32,109,97,114,107,32,48,120,37,48,50,120,32,40,37,115,44,32,99,61,37,117,44,32,104,61,37,117,44,32,98,105,116,61,37,108,117,47,37,108,117,41,10,0,0,80,97,103,101,68,111,119,110,0,0,0,0,0,0,0,0,32,73,82,82,61,0,0,0,88,79,82,0,0,0,0,0,91,37,115,37,115,37,99,37,48,52,88,93,0,0,0,0,69,110,100,0,0,0,0,0,56,48,49,56,54,45,73,67,85,0,0,0,0,0,0,0,83,85,66,0,0,0,0,0,117,110,104,97,110,100,108,101,100,32,109,101,115,115,97,103,101,32,40,34,37,115,34,44,32,34,37,115,34,41,10,0,68,101,108,101,116,101,0,0,73,78,84,51,0,0,0,0,42,42,42,32,99,97,110,39,116,32,111,112,101,110,32,100,114,105,118,101,114,32,40,37,115,41,10,0,0,0,0,0,65,78,68,0,0,0,0,0,101,109,117,46,112,97,114,112,111,114,116,50,46,102,105,108,101,0,0,0,0,0,0,0,80,97,103,101,85,112,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,50,0,0,0,0,0,0,0,73,78,84,50,0,0,0,0,67,79,78,70,73,71,58,0,70,49,50,0,0,0,0,0,60,0,0,0,0,0,0,0,61,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,102,111,114,109,97,116,0,0,109,111,117,115,101,95,100,105,118,95,121,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,97,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,83,66,66,0,0,0,0,0,115,105,122,101,0,0,0,0,112,102,100,99,58,32,99,114,99,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,45,61,0,0,0,0,0,0,65,32,32,37,48,56,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,72,111,109,101,0,0,0,0,82,101,108,101,97,115,101,32,54,46,48,10,36,48,0,0,98,111,114,100,101,114,0,0,46,116,99,0,0,0,0,0,73,78,84,49,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,50,32,102,105,108,101,10,0,0,0,0,0,0,0,119,98,0,0,0,0,0,0,65,68,67,0,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,49,32,102,105,108,101,10,0,0,0,0,0,0,0,73,110,115,101,114,116,0,0,73,78,84,48,0,0,0,0,111,0,0,0,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,48,32,102,105,108,101,10,0,0,0,0,0,0,0,79,82,0,0,0,0,0,0,75,80,95,80,101,114,105,111,100,0,0,0,0,0,0,0,70,49,0,0,0,0,0,0,68,77,65,49,0,0,0,0,114,43,98,0,0,0,0,0,119,43,98,0,0,0,0,0,58,0,0,0,0,0,0,0,65,68,68,0,0,0,0,0,119,98,0,0,0,0,0,0,37,115,58,32,101,114,114,111,114,32,112,97,114,115,105,110,103,32,105,110,105,32,115,116,114,105,110,103,32,40,37,115,41,10,0,0,0,0,0,0,75,80,95,48,0,0,0,0,68,77,65,48,0,0,0,0,45,37,48,50,88,0,0,0,114,98,0,0,0,0,0,0,117,110,104,97,110,100,108,101,100,32,109,97,103,105,99,32,107,101,121,32,40,37,117,41,10,0,0,0,0,0,0,0,75,80,95,69,110,116,101,114,0,0,0,0,0,0,0,0,112,97,116,104,0,0,0,0,102,97,108,115,101,0,0,0,84,77,82,0,0,0,0,0,43,37,48,50,88,0,0,0,75,80,95,51,0,0,0,0,82,67,55,53,57,32,77,69,77,0,0,0,0,0,0,0,76,111,97,100,58,0,0,0,99,104,0,0,0,0,0,0,100,114,105,118,101,114,0,0,75,80,95,50,0,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,32,115,101,99,116,111,114,32,100,97,116,97,32,116,111,111,32,98,105,103,32,40,37,117,41,10,0,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,82,67,55,53,57,32,80,79,82,84,83,0,0,0,0,0,68,73,83,75,58,0,0,0,68,83,0,0,0,0,0,0,75,80,95,49,0,0,0,0,91,37,115,37,115,37,99,37,48,50,88,93,0,0,0,0,32,32,78,37,117,61,37,48,52,108,88,0,0,0,0,0,108,0,0,0,0,0,0,0,83,83,0,0,0,0,0,0,116,114,117,101,0,0,0,0,119,98,0,0,0,0,0,0,115,110,100,45,115,100,108,58,32,101,114,114,111,114,32,111,112,101,110,105,110,103,32,111,117,116,112,117,116,32,40,37,115,41,10,0,0,0,0,0,75,80,95,54,0,0,0,0,108,111,119,112,97,115,115,0,78,48,61,37,48,52,108,88,0,0,0,0,0,0,0,0,60,110,111,110,101,62,0,0,116,100,48,58,32,97,100,118,97,110,99,101,100,32,99,111,109,112,114,101,115,115,105,111,110,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,102,109,0,0,0,0,0,0,67,83,0,0,0,0,0,0,115,116,120,58,32,98,97,100,32,109,97,103,105,99,10,0,101,109,117,46,112,97,114,112,111,114,116,50,46,100,114,105,118,101,114,0,0,0,0,0,112,115,105,58,32,99,114,99,32,101,114,114,111,114,10,0,75,80,95,53,0,0,0,0,112,102,100,99,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,0,0,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,73,67,87,61,91,37,48,50,88,32,37,48,50,88,32,37,48,50,88,32,37,48,50,88,93,32,32,79,67,87,61,91,37,48,50,88,32,37,48,50,88,32,37,48,50,88,93,10,0,0,0,0,0,0,0,0,112,99,101,45,114,99,55,53,57,58,32,115,105,103,105,110,116,10,0,0,0,0,0,0,70,49,49,0,0,0,0,0,62,61,0,0,0,0,0,0,73,77,68,32,49,46,49,55,58,32,37,50,100,47,37,50,100,47,37,52,100,32,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,0,0,63,61,0,0,0,0,0,0,6,78,111,110,97,109,101,0,113,0,0,0,0,0,0,0,108,111,97,100,0,0,0,0,109,111,117,115,101,95,109,117,108,95,121,0,0,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,0,0,42,42,42,32,109,101,109,111,114,121,32,98,108,111,99,107,32,99,114,101,97,116,105,111,110,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,69,83,0,0,0,0,0,0,98,108,111,99,107,115,0,0,43,61,0,0,0,0,0,0,83,32,32,37,48,52,88,58,37,48,52,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,0,0,0,116,100,48,58,32,99,111,109,109,101,110,116,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,75,80,95,52,0,0,0,0,82,101,108,101,97,115,101,32,53,46,48,49,36,48,0,0,46,115,116,120,0,0,0,0,73,83,82,61,0,0,0,0,46,99,112,50,0,0,0,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,119,98,0,0,0,0,0,0,75,80,95,80,108,117,115,0,109,102,109,58,32,100,97,109,32,119,105,116,104,111,117,116,32,105,100,97,109,10,0,0,102,108,117,115,104,0,0,0,42,42,42,32,101,114,114,111,114,32,99,114,101,97,116,105,110,103,32,115,121,109,108,105,110,107,32,37,115,32,45,62,32,37,115,10,0,0,0,0,32,32,73,78,84,82,61,37,100,10,0,0,0,0,0,0,108,111,103,0,0,0,0,0,75,80,95,57,0,0,0,0,73,77,82,61,0,0,0,0,88,67,72,71,0,0,0,0,119,100,49,55,57,120,58,32,115,97,118,101,32,116,114,97,99,107,32,102,97,105,108,101,100,10,0,0,0,0,0,0,75,80,95,56,0,0,0,0,32,32,80,82,73,79,61,37,117,10,0,0,0,0,0,0,75,80,95,55,0,0,0,0,46,97,110,97,0,0,0,0,73,82,82,61,0,0,0,0,75,80,95,77,105,110,117,115,0,0,0,0,0,0,0,0,73,78,80,61,0,0,0,0,97,104,0,0,0,0,0,0,87,65,73,84,0,0,0,0,75,80,95,83,116,97,114,0,56,50,53,57,65,45,80,73,67,0,0,0,0,0,0,0,80,85,83,72,70,0,0,0,75,80,95,83,108,97,115,104,0,0,0,0,0,0,0,0,91,37,115,37,115,93,0,0,10,0,0,0,0,0,0,0,80,79,80,70,0,0,0,0,78,117,109,76,111,99,107,0,32,32,67,72,61,73,91,37,88,93,32,32,67,76,61,79,91,37,88,93,0,0,0,0,116,121,112,101,61,108,111,99,97,108,32,100,114,105,118,101,114,61,37,115,10,0,0,0,83,65,72,70,0,0,0,0,101,109,117,46,112,97,114,112,111,114,116,49,46,102,105,108,101,0,0,0,0,0,0,0,114,98,0,0,0,0,0,0,67,116,114,108,82,105,103,104,116,0,0,0,0,0,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,32,32,67,72,61,79,91,37,88,93,32,32,67,76,61,73,91,37,88,93,0,0,0,0,112,99,101,45,114,99,55,53,57,58,32,115,105,103,116,101,114,109,10,0,0,0,0,0,70,49,48,0,0,0,0,0,60,61,0,0,0,0,0,0,125,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,98,105,110,97,114,121,0,0,109,111,117,115,101,95,100,105,118,95,120,0,0,0,0,0,60,110,111,110,101,62,0,0,76,65,72,70,0,0,0,0,115,0,0,0,0,0,0,0,32,37,115,0,0,0,0,0,69,32,32,34,37,115,34,10,0,0,0,0,0,0,0,0,116,100,48,58,32,114,101,97,100,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,77,101,110,117,0,0,0,0,82,101,108,101,97,115,101,32,52,46,48,48,36,48,0,0,102,105,108,101,0,0,0,0,46,115,116,0,0,0,0,0,32,32,67,61,79,91,37,48,50,88,93,0,0,0,0,0,115,121,109,108,105,110,107,0,77,79,86,83,66,0,0,0,87,105,110,100,111,119,115,82,105,103,104,116,0,0,0,0,32,32,67,61,73,91,37,48,50,88,93,0,0,0,0,0,107,101,121,0,0,0,0,0,65,88,61,37,48,52,88,32,32,66,88,61,37,48,52,88,32,32,67,88,61,37,48,52,88,32,32,68,88,61,37,48,52,88,32,32,83,80,61,37,48,52,88,32,32,66,80,61,37,48,52,88,32,32,83,73,61,37,48,52,88,32,32,68,73,61,37,48,52,88,32,73,78,84,61,37,48,50,88,37,99,10,0,0,0,0,0,0,56,48,49,56,54,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+20480);
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

  function _emscripten_cancel_main_loop() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.shouldPause = true;
    }

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

  
  
  
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

  function _strcpy(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      do {
        HEAP8[(((pdest+i)|0)|0)]=HEAP8[(((psrc+i)|0)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)]);
      return pdest|0;
    }

  
  
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
    }var _llvm_memset_p0i8_i32=_memset;

  
  
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function __parseInt(str, endptr, base, min, max, bits, unsign) {
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

  var _llvm_memset_p0i8_i64=_memset;

  var _llvm_va_start=undefined;

  function _llvm_va_end() {}

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
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

  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }

  
  
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
      }};function _SDL_Init(initFlags) {
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

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
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

  function _SDL_GetMouseState(x, y) {
      if (x) HEAP32[((x)>>2)]=Browser.mouseX;
      if (y) HEAP32[((y)>>2)]=Browser.mouseY;
      return SDL.buttonState;
    }

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

  function _SDL_GetVideoInfo() {
      // %struct.SDL_VideoInfo = type { i32, i32, %struct.SDL_PixelFormat*, i32, i32 } - 5 fields of quantum size
      var ret = _malloc(5*Runtime.QUANTUM_SIZE);
      HEAP32[((ret+Runtime.QUANTUM_SIZE*0)>>2)]=0; // TODO
      HEAP32[((ret+Runtime.QUANTUM_SIZE*1)>>2)]=0; // TODO
      HEAP32[((ret+Runtime.QUANTUM_SIZE*2)>>2)]=0;
      HEAP32[((ret+Runtime.QUANTUM_SIZE*3)>>2)]=Module["canvas"].width;
      HEAP32[((ret+Runtime.QUANTUM_SIZE*4)>>2)]=Module["canvas"].height;
      return ret;
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






___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



var FUNCTION_TABLE = [0,0,_cmd_set_sym1418,0,_dop_d0,0,_dop_d1,0,_dop_d2,0,_dop_d3,0,_dop_d4,0,_dop_d7,0,_e8259_inta,0,_null_open,0,_sig_segv,0,_chr_mouse_close,0,_chr_stdio_read,0,_rc759_kbd_set_key,0,_rc759_set_timer1_out,0,_dsk_ram_write,0,_op_ud,0,_dsk_qed_set_msg,0,_op_e0,0,_op_e1,0,_op_e2,0,_op_e3,0,_op_e4,0,_op_e5,0,_op_e6,0,_op_e7,0,_op_e8,0,_op_e9,0,_ea_get18,0,_snd_sdl_close,0,_op_38,0,_op_39,0,_dop_28,0,_dop_29,0,_op_32,0,_op_33,0,_dop_24,0,_dop_25,0,_op_36,0,_op_37,0,_op_34,0,_dop_21,0,_chr_posix_close,0,_op_ea,0,_op_eb,0,_op_ec,0,_op_ed,0,_op_ee,0,_op_ef,0,_rc759_set_msg_emu_disk_commit,0,_rc759_set_msg_emu_parport2_driver,0,_sdl_del,0,_snd_sdl_set_params,0,_snd_null_open,0,_cmd_get_sym1416,0,_op_3b,0,_op_3c,0,_dop_2d,0,_op_3a,0,_op_3f,0,_dop_2c,0,_op_3d,0,_dop_2a,0,_dop_ca,0,_dsk_pce_get_msg,0,_dop_cc,0,_dop_cb,0,_dop_ce,0,_dop_cd,0,_dop_cf,0,_op_f6_00,0,_op_f6_03,0,_op_f6_02,0,_op_f6_05,0,_op_f6_04,0,_op_f6_07,0,_op_f6_06,0,_op_8c,0,_op_8b,0,_op_8a,0,_op_8f,0,_op_8e,0,_op_8d,0,_null_del,0,_op_f7_02,0,_op_f7_03,0,_op_f7_00,0,_op_f7_06,0,_op_f7_07,0,_op_f7_04,0,_op_f7_05,0,_op_ff_01,0,_op_ff_00,0,_op_ff_03,0,_op_ff_02,0,_op_ff_05,0,_op_ff_04,0,_op_ff_06,0,_chr_mouse_read,0,_op_89,0,_op_88,0,_dsk_pce_set_msg,0,_op_83,0,_op_81,0,_op_80,0,_op_87,0,_op_86,0,_op_85,0,_op_84,0,_dop_c1,0,_dop_c0,0,_dop_c3,0,_dop_c2,0,_dop_c5,0,_dop_c4,0,_dop_c7,0,_dop_c6,0,_dop_c9,0,_dop_c8,0,_snd_null_write,0,_dsk_cow_write,0,_e8259_set_irq4,0,_chr_stdio_open,0,_e8259_set_irq6,0,_e8259_set_irq1,0,_e8259_set_irq0,0,_e8259_set_irq3,0,_e8259_set_irq2,0,_op_a4,0,_op_a5,0,_op_a6,0,_op_a7,0,_op_a0,0,_op_a1,0,_op_a2,0,_op_a3,0,_op_a8,0,_op_a9,0,_dop_62,0,_dop_60,0,_dop_61,0,_dop_66,0,_dop_68,0,_dsk_qed_get_msg,0,_op_6e,0,_dop_1f,0,_dop_1e,0,_dop_1d,0,_dop_1c,0,_dop_1b,0,_dop_1a,0,_op_6b,0,_cmd_restore_cont,0,_dop_6c,0,_dop_6a,0,_dop_6f,0,_dop_6d,0,_dop_6e,0,_rc759_cmd,0,_op_ad,0,_op_ae,0,_op_af,0,_op_aa,0,_op_ab,0,_op_ac,0,_dop_17,0,_dop_16,0,_dop_15,0,_op_66,0,_dop_13,0,_dop_12,0,_dop_11,0,_dop_10,0,_op_69,0,_op_68,0,_dop_19,0,_dop_18,0,_rc759_set_msg_emu_stop,0,_dsk_qed_write,0,_bp_segofs_del,0,_dsk_cow_get_msg,0,_op_99,0,_e80186_icu_set_irq_tmr2,0,_e80186_icu_set_irq_tmr1,0,_e80186_icu_set_irq_tmr0,0,_op_6d,0,_chr_null_close,0,_e86_irq,0,_op_6f,0,_op_6a,0,_cmd_read_address_clock,0,_rc759_get_cpu_clock,0,_op_6c,0,_op_90,0,_rc759_set_msg_emu_config_save,0,_dsk_psi_set_msg,0,_null_update,0,_dop_ud,0,_rc759_set_msg_emu_disk_eject,0,_snd_sdl_callback,0,_dsk_img_del,0,_op_50,0,_op_2a,0,_op_2c,0,_op_2b,0,_op_2e,0,_op_2d,0,_op_2f,0,_chr_null_read,0,_op_d8,0,_op_d7,0,_op_d5,0,_op_d4,0,_op_d3,0,_op_d2,0,_op_d1,0,_op_d0,0,_op_29,0,_op_28,0,_dop_58,0,_cmd_write_sector_idam,0,_op_21,0,_op_20,0,_op_23,0,_op_22,0,_op_25,0,_op_24,0,_op_27,0,_op_26,0,_dop_f3,0,_dop_ae,0,_dop_ac,0,_bp_segofs_match,0,_dop_ab,0,_rc759_write_track,0,_cmd_step_cont,0,_dop_aa,0,_bp_addr_del,0,_chr_mouse_write,0,_e80186_dma_set_dreq0,0,_chr_null_get_ctl,0,_dop_14,0,_sig_int,0,_op_61,0,_op_60,0,_ea_get12,0,_e86_set_mem_uint8,0,_ea_get13,0,_mem_set_uint8,0,_op_62,0,_ea_get10,0,_ea_get11,0,_ea_get16,0,_ea_get17,0,_ea_get14,0,_dop_9f,0,_dop_9e,0,_dop_9d,0,_snd_sdl_open,0,_dop_9b,0,_dop_9a,0,_rc759_get_port8,0,_e86_set_mem_uint16,0,_dop_b8,0,_dop_b0,0,_wd179x_scan_mark,0,_null_set_msg_trm,0,_rc759_set_msg_emu_pause,0,_dop_50,0,_rc759_set_msg,0,_rc759_set_port8,0,_dop_99,0,_dop_98,0,_snd_null_close,0,_cmd_read_sector_idam,0,_dop_91,0,_dop_90,0,_rc759_set_timer0_out,0,_op_03,0,_rc759_get_port16,0,_null_close,0,_op_02,0,_chr_stdio_write,0,_dop_26,0,_dsk_img_read,0,_dop_27,0,_ea_get15,0,_op_30,0,_op_06,0,_op_fe,0,_op_31,0,_dop_22,0,_dop_23,0,_op_b1,0,_op_ff,0,_dop_20,0,_op_b0,0,_op_fa,0,_op_35,0,_op_09,0,_dop_04,0,_dop_05,0,_dop_06,0,_dop_07,0,_dop_00,0,_dop_01,0,_dop_02,0,_dop_03,0,_op_58,0,_op_b5,0,_op_fb,0,_dop_08,0,_dop_09,0,_op_b4,0,_bp_expr_print,0,_op_b7,0,_dsk_cow_read,0,_rc759_set_msg_emu_cpu_speed,0,_op_b6,0,_bp_expr_match,0,_op_9f,0,_rc759_set_msg_emu_disk_insert,0,_dsk_img_write,0,_bp_addr_print,0,_dop_ec,0,_dop_0d,0,_dop_0e,0,_dop_0f,0,_dop_0a,0,_dop_0b,0,_dop_0c,0,_mem_get_uint8,0,_dop_f2,0,_dop_af,0,_dop_f0,0,_dop_ad,0,_dop_f6,0,_dop_f7,0,_dop_f4,0,_dop_f5,0,_dop_f8,0,_rc759_set_msg_emu_parport1_driver,0,_dsk_cow_set_msg,0,_dsk_pce_del,0,_chr_posix_read,0,_op_83_04,0,_op_83_05,0,_op_83_06,0,_op_83_07,0,_op_83_00,0,_op_83_01,0,_op_83_02,0,_op_83_03,0,_op_81_02,0,_op_81_03,0,_op_81_00,0,_op_81_01,0,_op_81_06,0,_op_81_07,0,_op_81_04,0,_op_81_05,0,_rc759_set_msg_emu_cpu_speed_step,0,_dop_a7,0,_dop_a6,0,_dop_a5,0,_dop_a4,0,_dop_ff,0,_dop_a2,0,_dop_a1,0,_dop_a0,0,_dop_a9,0,_dop_a8,0,_cmd_read_sector_clock,0,_sim_atexit,0,_dop_a3,0,_null_check,0,_dop_fe,0,_dsk_part_write,0,_op_14,0,_op_15,0,_op_16,0,_op_17,0,_op_10,0,_op_11,0,_op_12,0,_op_13,0,_op_c2,0,_op_c3,0,_op_c0,0,_op_c1,0,_op_18,0,_op_19,0,_op_c4,0,_op_c5,0,_dop_48,0,_rc759_set_msg_emu_pause_toggle,0,_dop_40,0,_op_b2,0,_op_80_01,0,_op_80_00,0,_op_80_03,0,_op_80_02,0,_op_80_05,0,_op_80_04,0,_op_80_07,0,_op_80_06,0,_op_1d,0,_op_1e,0,_op_1f,0,_op_1a,0,_op_1b,0,_op_1c,0,_op_cb,0,_op_cc,0,_op_ca,0,_op_cf,0,_op_cd,0,_op_ce,0,_dsk_psi_write,0,_bp_expr_del,0,_rc759_set_msg_emu_parport2_file,0,_dop_eb,0,_dop_ea,0,_dop_ef,0,_dop_ee,0,_dop_ed,0,_sdl_check,0,_wd179x_read_track_clock,0,_snd_null_set_params,0,_chr_pty_close,0,_dsk_ram_del,0,_cmd_read_sector_dam,0,_dop_2f,0,_dop_e9,0,_dop_e8,0,_sdl_update,0,_sdl_open,0,_dop_e0,0,_dop_e7,0,_dop_e6,0,_dop_e5,0,_dop_e4,0,_op_f5,0,_dop_2e,0,_op_f4,0,_chr_posix_open,0,_dop_2b,0,_rc759_read_track,0,_op_f7,0,_dsk_part_del,0,_dsk_qed_read,0,_op_f6,0,_op_3e,0,_op_f0,0,_ea_get0a,0,_op_fd,0,_ea_get0c,0,_ea_get0b,0,_ea_get0e,0,_ea_get0d,0,_op_fc,0,_ea_get0f,0,_op_f2,0,_chr_null_write,0,_dop_88,0,_dop_89,0,_dop_84,0,_dop_85,0,_dop_86,0,_dop_87,0,_dop_80,0,_dop_81,0,_dop_83,0,_chr_posix_write,0,_dop_3a,0,_dop_3c,0,_dop_3b,0,_dop_3e,0,_dop_3d,0,_dop_3f,0,_chr_pty_read,0,_dsk_dosemu_del,0,_dsk_psi_del,0,_dop_8d,0,_dop_8e,0,_dop_8f,0,_op_f3,0,_dop_8a,0,_dop_8b,0,_dop_8c,0,_ea_get01,0,_ea_get00,0,_ea_get03,0,_ea_get02,0,_ea_get05,0,_ea_get04,0,_ea_get07,0,_ea_get06,0,_ea_get09,0,_ea_get08,0,_op_f9,0,_op_f8,0,_chr_pty_write,0,_dop_31,0,_dop_30,0,_dop_33,0,_dop_32,0,_dop_35,0,_dop_34,0,_dop_37,0,_op_48,0,_dop_39,0,_dop_38,0,_dop_36,0,_dsk_ram_read,0,_op_c8,0,_op_40,0,_chr_stdio_close,0,_dsk_part_read,0,_sig_term,0,_sdl_close,0,_chr_mouse_open,0,_chr_pty_open,0,_chr_null_open,0,_cmd_seek_cont,0,_op_c9,0,_op_c6,0,_rc759_set_msg_emu_reset,0,_op_c7,0,_cmd_read_address_idam,0,_e80186_icu_inta,0,_rc759_set_port16,0,_e80186_icu_set_irq_dma0,0,_e80186_icu_set_irq_dma1,0,_dop_9c,0,_rc759_run_emscripten_step,0,_dsk_pce_read,0,_bp_segofs_print,0,_cmd_write_track_clock,0,_chr_null_set_ctl,0,_e80186_icu_set_irq_int0,0,_snd_sdl_write,0,_cmd_auto_motor_off,0,_sdl_set_msg_trm,0,_op_0c,0,_op_0b,0,_op_0a,0,_op_98,0,_op_0f,0,_op_0e,0,_op_0d,0,_op_ba,0,_op_bc,0,_op_bb,0,_op_be,0,_op_bd,0,_op_bf,0,_rc759_set_msg_emu_parport1_file,0,_dsk_qed_del,0,_bp_addr_match,0,_e86_get_mem_uint16,0,_rc759_set_mouse,0,_cmd_write_sector_clock,0,_dsk_dosemu_read,0,_op_b9,0,_op_b8,0,_op_01,0,_op_00,0,_op_07,0,_dop_70,0,_op_05,0,_op_04,0,_op_9d,0,_op_9e,0,_op_b3,0,_op_08,0,___strdup,0,_op_9a,0,_op_9b,0,_op_9c,0,_dsk_dosemu_write,0,_pce_op_int,0,_rc759_set_ppi_port_c,0,_chr_mouse_get_ctl,0,_rc759_set_msg_emu_exit,0,_dsk_cow_del,0,_e86_get_mem_uint8,0,_chr_mouse_set_ctl,0,_op_76,0,_op_77,0,_op_74,0,_op_75,0,_op_72,0,_op_73,0,_op_70,0,_op_71,0,_chr_mouse_set_params,0,_op_78,0,_op_79,0,_mem_set_uint16_le,0,_dsk_pce_write,0,_pce_op_undef,0,_mem_get_uint16_le,0,_chr_null_set_params,0,_dsk_psi_read,0,_op_7f,0,_op_7d,0,_op_7e,0,_op_7b,0,_op_7c,0,_op_7a,0,_mem_set_uint8_rw,0];

// EMSCRIPTEN_START_FUNCS
function _print_state_cpu(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;_pce_prt_sep(26368);r4=HEAPU16[r1+10>>1];r5=HEAPU16[r1+6>>1];r6=HEAPU16[r1+8>>1];r7=HEAPU16[r1+12>>1];r8=HEAPU16[r1+14>>1];r9=HEAPU16[r1+16>>1];r10=HEAPU16[r1+18>>1];r11=HEAP32[HEAP32[30592>>2]+70228>>2];_pce_printf(26280,(r2=STACKTOP,STACKTOP=STACKTOP+80|0,HEAP32[r2>>2]=HEAPU16[r1+4>>1],HEAP32[r2+8>>2]=r4,HEAP32[r2+16>>2]=r5,HEAP32[r2+24>>2]=r6,HEAP32[r2+32>>2]=r7,HEAP32[r2+40>>2]=r8,HEAP32[r2+48>>2]=r9,HEAP32[r2+56>>2]=r10,HEAP32[r2+64>>2]=r11&255,HEAP32[r2+72>>2]=(r11&256|0)!=0?42:32,r2));STACKTOP=r2;r11=HEAPU16[r1+26>>1];r10=HEAPU16[r1+20>>1];r9=HEAPU16[r1+24>>1];r8=HEAPU16[r1+28>>1];r7=r1+30|0;r6=HEAPU16[r7>>1];_pce_printf(19776,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=HEAPU16[r1+22>>1],HEAP32[r2+8>>2]=r11,HEAP32[r2+16>>2]=r10,HEAP32[r2+24>>2]=r9,HEAP32[r2+32>>2]=r8,HEAP32[r2+40>>2]=r6,r2));STACKTOP=r2;r6=HEAPU16[r7>>1];r7=HEAP8[648+(r6>>>10&1)|0]|0;r8=HEAP8[648+(r6>>>11&1)|0]|0;r9=HEAP8[648+(r6>>>7&1)|0]|0;r10=HEAP8[648+(r6>>>6&1)|0]|0;r11=HEAP8[648+(r6>>>4&1)|0]|0;r5=HEAP8[648+(r6>>>2&1)|0]|0;r4=HEAP8[648+(r6&1)|0]|0;_pce_printf(17424,(r2=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r2>>2]=HEAP8[648+(r6>>>9&1)|0]|0,HEAP32[r2+8>>2]=r7,HEAP32[r2+16>>2]=r8,HEAP32[r2+24>>2]=r9,HEAP32[r2+32>>2]=r10,HEAP32[r2+40>>2]=r11,HEAP32[r2+48>>2]=r5,HEAP32[r2+56>>2]=r4,r2));STACKTOP=r2;if((HEAP32[r1+152>>2]|0)==0){STACKTOP=r3;return}_pce_printf(15840,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;STACKTOP=r3;return}function _rc759_run(r1){var r2,r3,r4;r2=r1+70264|0;_pce_start(r2);_rc759_clock_discontinuity(r1);if((HEAP32[r2>>2]|0)==0){r3=r1+70268|0;r4=r1+70164|0;while(1){if((HEAP8[r3]|0)==0){_rc759_clock(r1,8)}else{_pce_usleep(1e5);_trm_check(HEAP32[r4>>2])}if((HEAP32[r2>>2]|0)!=0){break}}}r2=r1+70228|0;HEAP32[r2>>2]=HEAP32[r2>>2]&255;_pce_stop();return}function _rc759_get_sim(){return HEAP32[26376>>2]}function _rc759_run_emscripten(r1){var r2;HEAP32[26376>>2]=r1;_pce_start(r1+70264|0);_rc759_clock_discontinuity(r1);_emscripten_set_main_loop(1070,100,1);r2=r1+70228|0;HEAP32[r2>>2]=HEAP32[r2>>2]&255;return}function _rc759_run_emscripten_step(){var r1,r2,r3,r4,r5;r1=0;r2=0;r3=HEAP32[26376>>2];while(1){_rc759_clock(r3,8);r4=HEAP32[26376>>2];r5=r2+1|0;if((HEAP32[r4+70264>>2]|0)!=0){break}if((r5|0)<1e4){r2=r5;r3=r4}else{r1=5;break}}if(r1==5){return}_pce_stop();_emscripten_cancel_main_loop();return}function _rc759_cmd(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+2504|0;r6=r5;r7=r5+8;r8=r5+16;r9=r5+24;r10=r5+32;r11=r5+264;r12=r5+496;r13=r5+504;r14=r5+520;r15=r5+752;r16=r5+760;r17=r5+992;r18=r5+1e3;r19=r5+1256;r20=r5+1488;r21=r5+1496;r22=r5+1728;r23=r5+1736;r24=r5+1744;r25=r5+1752;r26=r5+1760;r27=r5+1992;r28=r5+2e3;r29=r5+2008;r30=r5+2240;r31=r5+2496;r32=HEAP32[r1+70164>>2];if((r32|0)!=0){_trm_check(r32)}if((_cmd_match(r2,14280)|0)!=0){_cmd_do_b(r2,r1+70216|0);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,13192)|0)!=0){HEAP32[r31>>2]=1;_cmd_match_uint32(r2,r31);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_rc759_clock_discontinuity(r1);if((HEAP32[r31>>2]|0)!=0){while(1){_rc759_clock(r1,1);r32=HEAP32[r31>>2]-1|0;HEAP32[r31>>2]=r32;if((r32|0)==0){break}}}r31=r30|0;r32=r1+16|0;_e86_disasm_cur(HEAP32[r32>>2],r29);_disasm_str(r31,r29);_print_state_cpu(HEAP32[r32>>2]);r29=HEAP32[r32>>2];r32=HEAPU16[r29+28>>1];_pce_printf(13856,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r29+22>>1],HEAP32[r4+8>>2]=r32,HEAP32[r4+16>>2]=r31,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,12336)|0)!=0){if((_cmd_match(r2,14280)|0)==0){r31=(_cmd_match(r2,17952)|0)==0;r32=(_cmd_match_end(r2)|0)==0;if(r31){if(r32){r33=0;STACKTOP=r5;return r33}_rc759_run(r1);r33=0;STACKTOP=r5;return r33}if(r32){r33=0;STACKTOP=r5;return r33}r32=r1+16|0;r31=HEAP16[HEAP32[r32>>2]+22>>1];r29=r1+70264|0;_pce_start(r29);_rc759_clock_discontinuity(r1);r34=r1+70228|0;r35=r1+70216|0;r36=HEAP32[_stdout>>2];r37=r31&65535;while(1){HEAP32[r34>>2]=HEAP32[r34>>2]&255;r38=_e86_get_opcnt(HEAP32[r32>>2]);r39=tempRet0;while(1){r40=_e86_get_opcnt(HEAP32[r32>>2]);if(!((r40|0)==(r38|0)&(tempRet0|0)==(r39|0))){break}_rc759_clock(r1,1);if((HEAP32[r29>>2]|0)!=0){break}}r41=HEAP32[r32>>2];if((HEAP16[r41+22>>1]|0)!=r31<<16>>16){r3=35;break}if((_bps_check(r35,r37,HEAPU16[r41+28>>1],r36)|0)!=0){break}if((HEAP32[r29>>2]|0)!=0){break}}if(r3==35){r29=r30|0;_e86_disasm_cur(r41,r26);_disasm_str(r29,r26);_print_state_cpu(HEAP32[r32>>2]);r26=HEAP32[r32>>2];r32=HEAPU16[r26+28>>1];_pce_printf(13856,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r26+22>>1],HEAP32[r4+8>>2]=r32,HEAP32[r4+16>>2]=r29,r4));STACKTOP=r4}_pce_stop();r33=0;STACKTOP=r5;return r33}L46:do{if((_cmd_match_uint32(r2,r27)|0)!=0){r29=r1+70216|0;while(1){if((_cmd_match(r2,20696)|0)==0){r42=_bp_addr_new(HEAP32[r27>>2])}else{if((_cmd_match_uint32(r2,r28)|0)==0){break}r42=_bp_segofs_new(HEAP32[r27>>2]&65535,HEAP32[r28>>2]&65535)}_bps_bp_add(r29,r42);if((_cmd_match_uint32(r2,r27)|0)==0){break L46}}_cmd_error(r2,20664);r33=0;STACKTOP=r5;return r33}}while(0);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r27=r1+70264|0;_pce_start(r27);_rc759_clock_discontinuity(r1);r42=r1+70228|0;r28=r1+16|0;r29=r1+70216|0;r32=HEAP32[_stdout>>2];while(1){HEAP32[r42>>2]=HEAP32[r42>>2]&255;r26=_e86_get_opcnt(HEAP32[r28>>2]);r41=tempRet0;while(1){r36=_e86_get_opcnt(HEAP32[r28>>2]);if(!((r36|0)==(r26|0)&(tempRet0|0)==(r41|0))){break}_rc759_clock(r1,1);if((HEAP32[r27>>2]|0)!=0){break}}r41=HEAP32[r28>>2];if((_bps_check(r29,HEAPU16[r41+22>>1],HEAPU16[r41+28>>1],r32)|0)!=0){break}if((HEAP32[r27>>2]|0)!=0){break}}_pce_stop();r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,11408)|0)!=0){_pce_puts(20712);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,10576)|0)!=0){if((_cmd_match(r2,21832)|0)==0){_cmd_match(r2,14280);r43=0}else{r43=1}if((_cmd_match_uint16(r2,r25)|0)==0){_cmd_error(r2,21792);r33=0;STACKTOP=r5;return r33}if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r27=HEAPU16[r25>>1];r25=HEAP32[r1+16>>2];if((r43|0)==0){r43=FUNCTION_TABLE[HEAP32[r25+56>>2]](HEAP32[r25+52>>2],r27)&255;_pce_printf(21264,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r27,HEAP32[r4+8>>2]=r43,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}else{r43=FUNCTION_TABLE[HEAP32[r25+64>>2]](HEAP32[r25+52>>2],r27)&65535;_pce_printf(21280,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r27,HEAP32[r4+8>>2]=r43,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}}if((_cmd_match(r2,26272)|0)!=0){r43=r30|0;if((_cmd_match_str(r2,r43,256)|0)!=0){r27=r1+472|0;while(1){r25=HEAP8[r43];if(r25<<24>>24==43){r44=1;r45=1}else{r32=r25<<24>>24==45;r44=r32&1;r45=r32?2:1}r32=r30+r44|0;r25=_pce_key_from_string(r32);if((r25|0)==0){_pce_printf(21336,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r43,r4));STACKTOP=r4}else{_pce_printf(21312,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=(r45|0)==1?21296:23464,HEAP32[r4+8>>2]=r32,r4));STACKTOP=r4;_rc759_kbd_set_key(r27,r45,r25)}if((_cmd_match_str(r2,r43,256)|0)==0){break}}}_cmd_match_end(r2);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,25632)|0)!=0){if((_cmd_match(r2,21752)|0)==0){_cmd_error(r2,21736);r33=0;STACKTOP=r5;return r33}r43=r30|0;if((_cmd_match_eol(r2)|0)!=0){r45=0;while(1){r27=_rc759_intlog_get(r1,r45);if((r27|0)!=0){_pce_printf(21360,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r45,HEAP32[r4+8>>2]=r27,r4));STACKTOP=r4}r27=r45+1|0;if(r27>>>0<256){r45=r27}else{r33=0;break}}STACKTOP=r5;return r33}if((_cmd_match(r2,21720)|0)!=0){r45=0;while(1){r27=_rc759_intlog_get(r1,r45);if((r27|0)!=0){_pce_printf(21360,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r45,HEAP32[r4+8>>2]=r27,r4));STACKTOP=r4}r27=r45+1|0;if(r27>>>0<256){r45=r27}else{r33=0;break}}STACKTOP=r5;return r33}if((_cmd_match_uint16(r2,r24)|0)==0){_cmd_error(r2,21680);r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)!=0){_rc759_intlog_set(r1,HEAPU16[r24>>1],0);_pce_printf(21656,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r24>>1],r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_str(r2,r43,256)|0)==0){_cmd_error(r2,21424);r33=0;STACKTOP=r5;return r33}else{_pce_printf(21360,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAPU16[r24>>1],HEAP32[r4+8>>2]=r43,r4));STACKTOP=r4;_rc759_intlog_set(r1,HEAPU16[r24>>1],r43);r33=0;STACKTOP=r5;return r33}}if((_cmd_match(r2,24328)|0)!=0){if((_cmd_match(r2,21832)|0)==0){_cmd_match(r2,14280);r46=0}else{r46=1}if((_cmd_match_uint16(r2,r22)|0)==0){_cmd_error(r2,21792);r33=0;STACKTOP=r5;return r33}if((_cmd_match_uint16(r2,r23)|0)==0){_cmd_error(r2,21768);r33=0;STACKTOP=r5;return r33}if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r43=HEAP32[r1+16>>2];if((r46|0)==0){FUNCTION_TABLE[HEAP32[r43+60>>2]](HEAP32[r43+52>>2],HEAPU16[r22>>1],HEAP16[r23>>1]&255);r33=0;STACKTOP=r5;return r33}else{FUNCTION_TABLE[HEAP32[r43+68>>2]](HEAP32[r43+52>>2],HEAPU16[r22>>1],HEAP16[r23>>1]);r33=0;STACKTOP=r5;return r33}}if((_cmd_match(r2,23472)|0)!=0){if((_cmd_match(r2,13192)|0)!=0){if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_e86_pq_init(HEAP32[r1+16>>2]);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,22152)|0)!=0){if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_e86_pq_fill(HEAP32[r1+16>>2]);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,20704)|0)!=0){if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_pce_puts(21856);r23=r1+16|0;r22=HEAP32[r23>>2];if((HEAP32[r22+124>>2]|0)!=0){r43=0;r46=r22;while(1){_pce_printf(13672,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r43+(r46+128)|0],r4));STACKTOP=r4;r22=r43+1|0;r24=HEAP32[r23>>2];if(r22>>>0<HEAP32[r24+124>>2]>>>0){r43=r22;r46=r24}else{break}}}_pce_puts(25840);r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)==0){_cmd_error(r2,21920);r33=0;STACKTOP=r5;return r33}if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_pce_puts(21856);r46=r1+16|0;r43=HEAP32[r46>>2];if((HEAP32[r43+124>>2]|0)!=0){r23=0;r24=r43;while(1){_pce_printf(13672,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r23+(r24+128)|0],r4));STACKTOP=r4;r43=r23+1|0;r22=HEAP32[r46>>2];if(r43>>>0<HEAP32[r22+124>>2]>>>0){r23=r43;r24=r22}else{break}}}_pce_puts(25840);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,22776)|0)!=0){HEAP32[r20>>2]=1;_cmd_match_uint32(r2,r20);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r24=r1+70264|0;_pce_start(r24);r23=r1+70228|0;HEAP32[r23>>2]=HEAP32[r23>>2]&255;_rc759_clock_discontinuity(r1);r23=r1+16|0;L212:do{if((HEAP32[r20>>2]|0)!=0){r46=r1+70216|0;r22=HEAP32[_stdout>>2];r43=r21|0;r45=r21+12|0;r27=0;while(1){_e86_disasm_cur(HEAP32[r23>>2],r21);r44=HEAP32[r23>>2];r25=HEAP16[r44+22>>1];r32=HEAP16[r44+28>>1];r29=r44;r44=r32;while(1){if(r44<<16>>16!=r32<<16>>16){r47=r25;r48=r29;break}_rc759_clock(r1,1);r28=HEAP32[r23>>2];if((_bps_check(r46,HEAPU16[r28+22>>1],HEAPU16[r28+28>>1],r22)|0)!=0){break L212}if((HEAP32[r24>>2]|0)!=0){break L212}r28=HEAP32[r23>>2];r42=HEAP16[r28+22>>1];if(r42<<16>>16!=r25<<16>>16){r47=r42;r48=r28;break}r29=r28;r44=HEAP16[r28+28>>1]}L223:do{if((HEAP32[r43>>2]&768|0)==0){r49=r47;r50=HEAP16[r48+28>>1]}else{r44=HEAP32[r45>>2]+(r32&65535)&65535;r29=r48;r28=r47;while(1){if(r28<<16>>16==r25<<16>>16?(HEAP16[r29+28>>1]|0)==r44<<16>>16:0){r49=r25;r50=r44;break L223}_rc759_clock(r1,1);r42=HEAP32[r23>>2];if((_bps_check(r46,HEAPU16[r42+22>>1],HEAPU16[r42+28>>1],r22)|0)!=0){break L212}if((HEAP32[r24>>2]|0)!=0){break L212}r42=HEAP32[r23>>2];r29=r42;r28=HEAP16[r42+22>>1]}}}while(0);if((_bps_check(r46,r49&65535,r50&65535,r22)|0)!=0){break L212}r25=r27+1|0;if((HEAP32[r24>>2]|0)!=0){break L212}if(r25>>>0<HEAP32[r20>>2]>>>0){r27=r25}else{break}}}}while(0);_pce_stop();r20=r30|0;_e86_disasm_cur(HEAP32[r23>>2],r19);_disasm_str(r20,r19);_print_state_cpu(HEAP32[r23>>2]);r19=HEAP32[r23>>2];r23=HEAPU16[r19+28>>1];_pce_printf(13856,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r19+22>>1],HEAP32[r4+8>>2]=r23,HEAP32[r4+16>>2]=r20,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,22176)|0)!=0){r20=r18|0;if((_cmd_match_eol(r2)|0)!=0){_print_state_cpu(HEAP32[r1+16>>2]);r33=0;STACKTOP=r5;return r33}if((_cmd_match_ident(r2,r20,256)|0)==0){_pce_printf(22224,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}r18=r1+16|0;if((_e86_get_reg(HEAP32[r18>>2],r20,r17)|0)!=0){_pce_printf(22192,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r20,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)!=0){_pce_printf(22168,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r17>>2],r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_uint32(r2,r17)|0)==0){_pce_printf(22832,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_e86_set_reg(HEAP32[r18>>2],r20,HEAP32[r17>>2]);r17=r30|0;_e86_disasm_cur(HEAP32[r18>>2],r16);_disasm_str(r17,r16);_print_state_cpu(HEAP32[r18>>2]);r16=HEAP32[r18>>2];r18=HEAPU16[r16+28>>1];_pce_printf(13856,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r16+22>>1],HEAP32[r4+8>>2]=r18,HEAP32[r4+16>>2]=r17,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,21712)|0)!=0){r17=r30|0;if((_cmd_match_str(r2,r17,256)|0)==0){_cmd_error(r2,22864);r33=0;STACKTOP=r5;return r33}if((_cmd_match_uint16(r2,r15)|0)==0){_cmd_error(r2,22832);r33=0;STACKTOP=r5;return r33}do{if((_strcmp(r17,22800)|0)!=0){if((_strcmp(r17,22760)|0)==0){_e8259_set_irq1(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22728)|0)==0){_e8259_set_irq2(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22520)|0)==0){_e8259_set_irq3(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22408)|0)==0){_e8259_set_irq4(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22376)|0)==0){_e8259_set_irq5(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22344)|0)==0){_e8259_set_irq6(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22296)|0)==0){_e8259_set_irq7(r1+20|0,HEAP16[r15>>1]&255);break}else{_pce_printf(22256,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r17,r4));STACKTOP=r4;break}}else{_e8259_set_irq0(r1+20|0,HEAP16[r15>>1]&255)}}while(0);_cmd_match_end(r2);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,20704)|0)==0){if((_cmd_match(r2,20360)|0)!=0){HEAP32[r12>>2]=1;_cmd_match_uint32(r2,r12);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r15=r1+70264|0;_pce_start(r15);_rc759_clock_discontinuity(r1);L310:do{if((HEAP32[r12>>2]|0)==0){r51=r1+16|0}else{r17=r1+70228|0;r18=r1+16|0;r16=r1+70216|0;r20=HEAP32[_stdout>>2];r23=0;while(1){HEAP32[r17>>2]=HEAP32[r17>>2]&255;r19=_e86_get_opcnt(HEAP32[r18>>2]);r24=tempRet0;while(1){r50=_e86_get_opcnt(HEAP32[r18>>2]);if(!((r50|0)==(r19|0)&(tempRet0|0)==(r24|0))){break}_rc759_clock(r1,1);if((HEAP32[r15>>2]|0)!=0){break}}r24=HEAP32[r18>>2];if((_bps_check(r16,HEAPU16[r24+22>>1],HEAPU16[r24+28>>1],r20)|0)!=0){r51=r18;break L310}r24=r23+1|0;if((HEAP32[r15>>2]|0)!=0){r51=r18;break L310}if(r24>>>0<HEAP32[r12>>2]>>>0){r23=r24}else{r51=r18;break}}}}while(0);_pce_stop();r12=r30|0;_e86_disasm_cur(HEAP32[r51>>2],r11);_disasm_str(r12,r11);_print_state_cpu(HEAP32[r51>>2]);r11=HEAP32[r51>>2];r51=HEAPU16[r11+28>>1];_pce_printf(13856,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r11+22>>1],HEAP32[r4+8>>2]=r51,HEAP32[r4+16>>2]=r12,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,20088)|0)==0){r33=1;STACKTOP=r5;return r33}r12=r30|0;if((HEAP32[608>>2]|0)==0){r52=HEAP16[26384>>1];r53=HEAP16[26392>>1]}else{HEAP32[608>>2]=0;r51=HEAP32[r1+16>>2];r11=HEAP16[r51+22>>1];HEAP16[26384>>1]=r11;r15=HEAP16[r51+28>>1];HEAP16[26392>>1]=r15;r52=r11;r53=r15}HEAP16[r6>>1]=r52;HEAP16[r7>>1]=r53;HEAP16[r8>>1]=16;HEAP16[r9>>1]=0;if((_cmd_match_uint16_16(r2,r6,r7)|0)!=0){_cmd_match_uint16(r2,r8)}_cmd_match_uint16(r2,r9);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}L337:do{if((HEAP16[r8>>1]|0)==0){r54=HEAP16[r7>>1]}else{r53=r1+16|0;r52=r10+12|0;r15=HEAP16[r7>>1];while(1){_e86_disasm_mem(HEAP32[r53>>2],r10,HEAP16[r6>>1],r15);_disasm_str(r12,r10);r11=HEAPU16[r7>>1];_pce_printf(13856,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r6>>1],HEAP32[r4+8>>2]=r11,HEAP32[r4+16>>2]=r12,r4));STACKTOP=r4;r11=HEAP32[r52>>2];r55=HEAPU16[r7>>1]+r11&65535;HEAP16[r7>>1]=r55;r51=HEAP16[r8>>1];r18=r51&65535;if((HEAP16[r9>>1]|0)==0){r56=r51-1&65535}else{if(r18>>>0<r11>>>0){break}r56=r18-r11&65535}HEAP16[r8>>1]=r56;if(r56<<16>>16==0){r54=r55;break L337}else{r15=r55}}HEAP16[r8>>1]=0;r54=r55}}while(0);HEAP16[26384>>1]=HEAP16[r6>>1];HEAP16[26392>>1]=r54;r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)!=0){r54=r30|0;r30=r1+16|0;_e86_disasm_cur(HEAP32[r30>>2],r14);_disasm_str(r54,r14);_print_state_cpu(HEAP32[r30>>2]);r14=HEAP32[r30>>2];r30=HEAPU16[r14+28>>1];_pce_printf(13856,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r14+22>>1],HEAP32[r4+8>>2]=r30,HEAP32[r4+16>>2]=r54,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)!=0){r33=0;STACKTOP=r5;return r33}r54=r1+68896|0;r30=r1+68908|0;r14=r1+68909|0;r6=r1+70152|0;r55=r1+68906|0;r8=r1+68904|0;r56=r1+68912|0;r9=r1+68913|0;r7=r1+68934|0;r12=r1+68920|0;r10=r1+68922|0;r15=r1+68924|0;r52=r1+68926|0;r53=r1+68928|0;r11=r1+68930|0;r18=r1+68932|0;r51=r1+68916|0;r23=r1+68954|0;r20=r1+68952|0;r16=r1+68942|0;r17=r1+68944|0;r24=r1+68936|0;r19=r1+68938|0;r50=r1+68940|0;r49=r1+68946|0;r47=r1+68948|0;r48=r1+68943|0;r21=r1+68945|0;r27=r1+68937|0;r22=r1+68939|0;r46=r1+68941|0;r45=r1+68947|0;r43=r1+68949|0;r25=r1+16|0;r32=r1+96|0;r28=r1+408|0;r29=r1+20|0;r44=r1+12|0;r42=HEAP32[_stdout>>2];r41=r1+4|0;r26=r1+196|0;r36=r1+198|0;r37=r13|0;r35=r13+1|0;r31=r13+2|0;r34=r13+3|0;r39=r13+4|0;r38=r13+5|0;r40=r13+6|0;r57=r13+7|0;r58=r13+8|0;r13=r1+280|0;r59=r1+960|0;r60=r1+963|0;r61=r1+962|0;r62=r1+66640|0;r63=r1+1032|0;r64=r1+1034|0;r65=r1+1040|0;r66=r1+1044|0;r67=r1+1060|0;r68=r1+1064|0;r69=r1+33836|0;r70=r1+33838|0;r71=r1+33844|0;r72=r1+33848|0;r73=r1+33864|0;r74=r1+33868|0;r75=r1+304|0;L358:while(1){L360:do{if((_cmd_match(r2,13264)|0)==0){if((_cmd_match(r2,13184)|0)!=0){_print_state_cpu(HEAP32[r25>>2]);break}if((_cmd_match(r2,13136)|0)!=0){_print_state_dma(r75);break}if((_cmd_match(r2,12824)|0)!=0){_pce_prt_sep(23432);r76=_rc759_fdc_get_fcr(r59)&255;r77=_rc759_fdc_get_reserve(r59)&255;_pce_printf(23272,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r76,HEAP32[r4+8>>2]=r77,r4));STACKTOP=r4;r77=HEAPU8[r61];_pce_printf(23168,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAPU8[r60],HEAP32[r4+8>>2]=r77,r4));STACKTOP=r4;r77=(HEAP32[HEAP32[r62>>2]+4>>2]|0)==0|0;r76=(HEAP8[r63]|0)!=0|0;r78=(HEAP8[r64]|0)!=0|0;r79=HEAP32[r65>>2];r80=HEAP32[r66>>2];r81=HEAP32[r67>>2];r82=HEAP32[r68>>2];_pce_printf(23024,(r4=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r4>>2]=0,HEAP32[r4+8>>2]=r77,HEAP32[r4+16>>2]=r76,HEAP32[r4+24>>2]=r78,HEAP32[r4+32>>2]=r79,HEAP32[r4+40>>2]=r80,HEAP32[r4+48>>2]=r81,HEAP32[r4+56>>2]=r82,r4));STACKTOP=r4;r82=(HEAP32[HEAP32[r62>>2]+4>>2]|0)==1|0;r81=(HEAP8[r69]|0)!=0|0;r80=(HEAP8[r70]|0)!=0|0;r79=HEAP32[r71>>2];r78=HEAP32[r72>>2];r76=HEAP32[r73>>2];r77=HEAP32[r74>>2];_pce_printf(23024,(r4=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r4>>2]=1,HEAP32[r4+8>>2]=r82,HEAP32[r4+16>>2]=r81,HEAP32[r4+24>>2]=r80,HEAP32[r4+32>>2]=r79,HEAP32[r4+40>>2]=r78,HEAP32[r4+48>>2]=r76,HEAP32[r4+56>>2]=r77,r4));STACKTOP=r4;break}if((_cmd_match(r2,12736)|0)!=0){r77=HEAP16[r36>>1]&255;r76=_e80186_icu_get_irr(r26)&255;r78=_e80186_icu_get_imr(r26)&255;r79=_e80186_icu_get_isr(r26)&255;_pce_prt_sep(23792);_pce_puts(25760);HEAP8[r37]=(r77&255)>>>7|48;HEAP8[r35]=(r77&255)>>>6&1|48;HEAP8[r31]=(r77&255)>>>5&1|48;HEAP8[r34]=(r77&255)>>>4&1|48;HEAP8[r39]=(r77&255)>>>3&1|48;HEAP8[r38]=(r77&255)>>>2&1|48;HEAP8[r40]=(r77&255)>>>1&1|48;HEAP8[r57]=r77&1|48;HEAP8[r58]=0;_pce_puts(r37);_pce_puts(23752);HEAP8[r37]=(r76&255)>>>7|48;HEAP8[r35]=(r76&255)>>>6&1|48;HEAP8[r31]=(r76&255)>>>5&1|48;HEAP8[r34]=(r76&255)>>>4&1|48;HEAP8[r39]=(r76&255)>>>3&1|48;HEAP8[r38]=(r76&255)>>>2&1|48;HEAP8[r40]=(r76&255)>>>1&1|48;HEAP8[r57]=r76&1|48;HEAP8[r58]=0;_pce_puts(r37);_pce_puts(23656);HEAP8[r37]=(r78&255)>>>7|48;HEAP8[r35]=(r78&255)>>>6&1|48;HEAP8[r31]=(r78&255)>>>5&1|48;HEAP8[r34]=(r78&255)>>>4&1|48;HEAP8[r39]=(r78&255)>>>3&1|48;HEAP8[r38]=(r78&255)>>>2&1|48;HEAP8[r40]=(r78&255)>>>1&1|48;HEAP8[r57]=r78&1|48;HEAP8[r58]=0;_pce_puts(r37);_pce_puts(23616);HEAP8[r37]=(r79&255)>>>7|48;HEAP8[r35]=(r79&255)>>>6&1|48;HEAP8[r31]=(r79&255)>>>5&1|48;HEAP8[r34]=(r79&255)>>>4&1|48;HEAP8[r39]=(r79&255)>>>3&1|48;HEAP8[r38]=(r79&255)>>>2&1|48;HEAP8[r40]=(r79&255)>>>1&1|48;HEAP8[r57]=r79&1|48;HEAP8[r58]=0;_pce_puts(r37);_pce_puts(25840);r80=_e80186_icu_get_pmr(r26)&65535;r81=_e80186_icu_get_pollst(r26)&65535;r82=HEAPU8[r13];_pce_printf(23568,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r80,HEAP32[r4+8>>2]=r81,HEAP32[r4+16>>2]=r82,r4));STACKTOP=r4;r82=0;r81=r77;r77=r76;r76=r78;r78=r79;while(1){if((r82|0)==1){r83=23464}else{r83=HEAP32[616+(r82<<2)>>2]}r79=_e80186_icu_get_icon(r26,r82)&65535;r80=HEAP32[r1+244+(r82<<2)>>2];_pce_printf(23496,(r4=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r4>>2]=r83,HEAP32[r4+8>>2]=r82,HEAP32[r4+16>>2]=r79,HEAP32[r4+24>>2]=r80,HEAP32[r4+32>>2]=r81&1,HEAP32[r4+40>>2]=r77&1,HEAP32[r4+48>>2]=r76&1,HEAP32[r4+56>>2]=r78&1,r4));STACKTOP=r4;r80=r82+1|0;if(r80>>>0<8){r82=r80;r81=(r81&255)>>>1;r77=(r77&255)>>>1;r76=(r76&255)>>>1;r78=(r78&255)>>>1}else{break L360}}}if((_cmd_match(r2,12696)|0)!=0){_pce_prt_sep(24632);_mem_prt_state(HEAP32[r41>>2],r42);break}if((_cmd_match(r2,12632)|0)!=0){_pce_prt_sep(24736);_mem_prt_state(HEAP32[r44>>2],r42);break}if((_cmd_match(r2,12576)|0)!=0){_print_state_pic(r29);break}if((_cmd_match(r2,12520)|0)!=0){_print_state_ppi(r28);break}if((_cmd_match(r2,12472)|0)!=0){_print_state_tcu(r32);break}if((_cmd_match(r2,12392)|0)==0){if((_cmd_match(r2,12328)|0)==0){break L358}_pce_prt_sep(12032);_pce_printf(11888,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r54>>2],r4));STACKTOP=r4;r78=(HEAP8[r14]|0)!=0|0;r76=(HEAP8[r6]|0)!=0|0;_pce_printf(11824,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=(HEAP8[r30]|0)!=0,HEAP32[r4+8>>2]=r78,HEAP32[r4+16>>2]=r76,r4));STACKTOP=r4;r76=HEAPU16[r8>>1];_pce_printf(11744,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAPU16[r55>>1],HEAP32[r4+8>>2]=r76,r4));STACKTOP=r4;r76=(HEAP8[r9]|0)!=0|0;_pce_printf(11664,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=(HEAP8[r56]|0)!=0,HEAP32[r4+8>>2]=r76,r4));STACKTOP=r4;_pce_printf(11616,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r7>>1],r4));STACKTOP=r4;_pce_printf(11536,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;_pce_printf(11456,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r12>>1],r4));STACKTOP=r4;_pce_printf(11384,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r10>>1],r4));STACKTOP=r4;_pce_printf(11344,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r15>>1],r4));STACKTOP=r4;_pce_printf(11080,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r52>>1],r4));STACKTOP=r4;_pce_printf(10976,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r53>>1],r4));STACKTOP=r4;_pce_printf(10936,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r11>>1],r4));STACKTOP=r4;_pce_printf(10888,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r18],r4));STACKTOP=r4;_pce_printf(10832,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r51],r4));STACKTOP=r4;r76=HEAPU8[r16];r78=HEAPU8[r17];r77=HEAP8[r24]|0;r81=HEAP8[r19]|0;r82=HEAP8[r50]|0;r80=HEAPU16[r23>>1];r79=HEAPU16[r20>>1];r84=HEAPU8[r49];r85=HEAPU8[r47];_pce_printf(10688,(r4=STACKTOP,STACKTOP=STACKTOP+80|0,HEAP32[r4>>2]=1,HEAP32[r4+8>>2]=r76,HEAP32[r4+16>>2]=r78,HEAP32[r4+24>>2]=r77,HEAP32[r4+32>>2]=r81,HEAP32[r4+40>>2]=r82,HEAP32[r4+48>>2]=r80,HEAP32[r4+56>>2]=r79,HEAP32[r4+64>>2]=r84,HEAP32[r4+72>>2]=r85,r4));STACKTOP=r4;r85=HEAPU8[r48];r84=HEAPU8[r21];r79=HEAP8[r27]|0;r80=HEAP8[r22]|0;r82=HEAP8[r46]|0;r81=HEAPU16[r23>>1];r77=HEAPU16[r20>>1];r78=HEAPU8[r45];r76=HEAPU8[r43];_pce_printf(10688,(r4=STACKTOP,STACKTOP=STACKTOP+80|0,HEAP32[r4>>2]=2,HEAP32[r4+8>>2]=r85,HEAP32[r4+16>>2]=r84,HEAP32[r4+24>>2]=r79,HEAP32[r4+32>>2]=r80,HEAP32[r4+40>>2]=r82,HEAP32[r4+48>>2]=r81,HEAP32[r4+56>>2]=r77,HEAP32[r4+64>>2]=r78,HEAP32[r4+72>>2]=r76,r4));STACKTOP=r4;break}r76=HEAP32[r25>>2];_pce_prt_sep(10664);r78=r76+1216|0;r77=HEAP32[r78>>2];r81=HEAP32[r78+4>>2];r82=r76+1208|0;r80=HEAP32[r82>>2];r79=HEAP32[r82+4>>2];if((r77|0)==0&(r81|0)==0){r86=0}else{r86=((r80>>>0)+(r79>>>0)*4294967296)/((r77>>>0)+(r81>>>0)*4294967296)}r81=HEAP32[r76+1200>>2];_pce_printf(10608,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r80,HEAP32[r4+8>>2]=r79,HEAP32[r4+16>>2]=r81,r4));STACKTOP=r4;r81=HEAP32[r78+4>>2];_pce_printf(10560,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAP32[r78>>2],HEAP32[r4+8>>2]=r81,r4));STACKTOP=r4;_pce_printf(10520,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r4>>3]=r86,r4));STACKTOP=r4}else{_print_state_ppi(r28);_print_state_tcu(r32);_print_state_pic(r29);_print_state_dma(r75);r81=HEAP32[r25>>2];_pce_prt_sep(10664);r78=r81+1216|0;r79=HEAP32[r78>>2];r80=HEAP32[r78+4>>2];r76=r81+1208|0;r77=HEAP32[r76>>2];r82=HEAP32[r76+4>>2];if((r79|0)==0&(r80|0)==0){r87=0}else{r87=((r77>>>0)+(r82>>>0)*4294967296)/((r79>>>0)+(r80>>>0)*4294967296)}r80=HEAP32[r81+1200>>2];_pce_printf(10608,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r77,HEAP32[r4+8>>2]=r82,HEAP32[r4+16>>2]=r80,r4));STACKTOP=r4;r80=HEAP32[r78+4>>2];_pce_printf(10560,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAP32[r78>>2],HEAP32[r4+8>>2]=r80,r4));STACKTOP=r4;_pce_printf(10520,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r4>>3]=r87,r4));STACKTOP=r4;_print_state_cpu(HEAP32[r25>>2])}}while(0);if((_cmd_match_eol(r2)|0)!=0){r33=0;r3=234;break}}if(r3==234){STACKTOP=r5;return r33}_cmd_error(r2,12264);r33=0;STACKTOP=r5;return r33}function _rc759_cmd_init(r1,r2){_mon_cmd_add(r2,1136,16);_mon_cmd_add_bp(r2);r2=r1+16|0;HEAP32[HEAP32[r2>>2]+92>>2]=r1;HEAP32[HEAP32[r2>>2]+108>>2]=1162;HEAP32[HEAP32[r2>>2]+104>>2]=1202;return}function _pce_op_int(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=r2&255;HEAP32[r1+70228>>2]=r5|256;if((_rc759_intlog_check(r1,r5)|0)==0){STACKTOP=r4;return}r2=HEAP32[r1+16>>2];r1=HEAPU16[r2+112>>1];r6=HEAPU16[r2+4>>1];r7=HEAPU16[r2+10>>1];r8=HEAPU16[r2+6>>1];r9=HEAPU16[r2+8>>1];r10=HEAPU16[r2+26>>1];r11=HEAPU16[r2+20>>1];_pce_printf(19496,(r3=STACKTOP,STACKTOP=STACKTOP+72|0,HEAP32[r3>>2]=HEAPU16[r2+22>>1],HEAP32[r3+8>>2]=r1,HEAP32[r3+16>>2]=r5,HEAP32[r3+24>>2]=r6,HEAP32[r3+32>>2]=r7,HEAP32[r3+40>>2]=r8,HEAP32[r3+48>>2]=r9,HEAP32[r3+56>>2]=r10,HEAP32[r3+64>>2]=r11,r3));STACKTOP=r3;STACKTOP=r4;return}function _pce_op_undef(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=HEAP32[r1+16>>2];r7=HEAPU16[r6+28>>1];_pce_log(3,19728,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=HEAPU16[r6+22>>1],HEAP32[r4+8>>2]=r7,HEAP32[r4+16>>2]=r2&255,HEAP32[r4+24>>2]=r3&255,r4));STACKTOP=r4;_pce_usleep(1e5);_trm_check(HEAP32[r1+70164>>2]);STACKTOP=r5;return}function _disasm_str(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r3=0;r4=0;r5=STACKTOP;_sprintf(r1,13744,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r2+16|0],r4));STACKTOP=r4;r6=r2+12|0;r7=r1+2|0;if(HEAP32[r6>>2]>>>0>1){r8=1;r9=2;r10=r7;while(1){_sprintf(r10,13672,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r8+(r2+16)|0],r4));STACKTOP=r4;r11=r9+3|0;r12=r8+1|0;r13=r1+r11|0;if(r12>>>0<HEAP32[r6>>2]>>>0){r8=r12;r9=r11;r10=r13}else{break}}HEAP8[r13]=32;r13=r9+4|0;if(r13>>>0<20){r14=r11;r15=r13;r3=5}else{r16=r11;r17=r13}}else{HEAP8[r7]=32;r14=2;r15=3;r3=5}if(r3==5){_memset(r1+r15|0,32,19-r14|0)|0;r16=19;r17=20}r14=r2|0;r15=HEAP32[r14>>2];if((r15&-769|0)==0){r18=r17}else{r3=r16+2|0;HEAP8[r1+r17|0]=91;if((r15&1|0)==0){r19=r15;r20=r3}else{r17=r1+r3|0;tempBigInt=3553329;HEAP8[r17]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r17+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r17+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r17+3|0]=tempBigInt;r19=r15&-2;r20=r16+5|0}if((r19|0)==0){r21=r20}else{if((r19|0)==(HEAP32[r14>>2]|0)){r22=r20}else{HEAP8[r1+r20|0]=32;r22=r20+1|0}r20=_sprintf(r1+r22|0,13520,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r19,r4));STACKTOP=r4;r21=r20+r22|0}HEAP8[r1+r21|0]=93;HEAP8[r1+(r21+1)|0]=32;r18=r21+2|0}_strcpy(r1+r18|0,r2+32|0);r21=r18;r22=0;while(1){r23=r1+r21|0;r24=r21+1|0;if((HEAP8[r23]|0)==0){break}else{r21=r24;r22=r22+1|0}}r20=r2+96|0;if((HEAP32[r20>>2]|0)==0){r25=r21;r26=r1+r25|0;HEAP8[r26]=0;STACKTOP=r5;return}HEAP8[r23]=32;if(r24>>>0<26){_memset(r1+(r18+1+r22)|0,32,25-r18-r22|0)|0;r27=26}else{r27=r24}r24=HEAP32[r20>>2];if((r24|0)==2){r20=_sprintf(r1+r27|0,13368,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2+100,HEAP32[r4+8>>2]=r2+164,r4));STACKTOP=r4;r25=r20+r27|0;r26=r1+r25|0;HEAP8[r26]=0;STACKTOP=r5;return}else if((r24|0)==1){r24=r2+100|0;r2=_strlen(r24);_memcpy(r1+r27|0,r24,r2+1|0)|0;r25=r2+r27|0;r26=r1+r25|0;HEAP8[r26]=0;STACKTOP=r5;return}else{r25=r27;r26=r1+r25|0;HEAP8[r26]=0;STACKTOP=r5;return}}function _print_state_dma(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;_pce_prt_sep(22976);r4=_e80186_dma_get_control(r1,0)&65535;r5=_e80186_dma_get_count(r1,0)&65535;r6=_e80186_dma_get_src(r1,0);r7=_e80186_dma_get_dst(r1,0);_pce_printf(22896,(r2=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r2>>2]=0,HEAP32[r2+8>>2]=r4,HEAP32[r2+16>>2]=r5,HEAP32[r2+24>>2]=r6,HEAP32[r2+32>>2]=r7,r2));STACKTOP=r2;r7=_e80186_dma_get_control(r1,1)&65535;r6=_e80186_dma_get_count(r1,1)&65535;r5=_e80186_dma_get_src(r1,1);r4=_e80186_dma_get_dst(r1,1);_pce_printf(22896,(r2=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r2>>2]=1,HEAP32[r2+8>>2]=r7,HEAP32[r2+16>>2]=r6,HEAP32[r2+24>>2]=r5,HEAP32[r2+32>>2]=r4,r2));STACKTOP=r2;STACKTOP=r3;return}function _print_state_pic(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;_pce_prt_sep(25792);_pce_puts(25760);r5=HEAP8[r1+10|0];r6=r4|0;HEAP8[r6]=(r5&255)>>>7|48;r7=r4+1|0;HEAP8[r7]=(r5&255)>>>6&1|48;r8=r4+2|0;HEAP8[r8]=(r5&255)>>>5&1|48;r9=r4+3|0;HEAP8[r9]=(r5&255)>>>4&1|48;r10=r4+4|0;HEAP8[r10]=(r5&255)>>>3&1|48;r11=r4+5|0;HEAP8[r11]=(r5&255)>>>2&1|48;r12=r4+6|0;HEAP8[r12]=(r5&255)>>>1&1|48;r13=r4+7|0;HEAP8[r13]=r5&1|48;r5=r4+8|0;HEAP8[r5]=0;_pce_puts(r6);_pce_puts(25840);_pce_puts(25736);r4=_e8259_get_irr(r1);HEAP8[r6]=(r4&255)>>>7|48;HEAP8[r7]=(r4&255)>>>6&1|48;HEAP8[r8]=(r4&255)>>>5&1|48;HEAP8[r9]=(r4&255)>>>4&1|48;HEAP8[r10]=(r4&255)>>>3&1|48;HEAP8[r11]=(r4&255)>>>2&1|48;HEAP8[r12]=(r4&255)>>>1&1|48;HEAP8[r13]=r4&1|48;HEAP8[r5]=0;_pce_puts(r6);_pce_printf(25704,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r1+24>>2],r2));STACKTOP=r2;_pce_puts(25648);r4=_e8259_get_imr(r1);HEAP8[r6]=(r4&255)>>>7|48;HEAP8[r7]=(r4&255)>>>6&1|48;HEAP8[r8]=(r4&255)>>>5&1|48;HEAP8[r9]=(r4&255)>>>4&1|48;HEAP8[r10]=(r4&255)>>>3&1|48;HEAP8[r11]=(r4&255)>>>2&1|48;HEAP8[r12]=(r4&255)>>>1&1|48;HEAP8[r13]=r4&1|48;HEAP8[r5]=0;_pce_puts(r6);_pce_printf(25616,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=(HEAP8[r1+72|0]|0)!=0,r2));STACKTOP=r2;_pce_puts(25480);r4=_e8259_get_isr(r1);HEAP8[r6]=(r4&255)>>>7|48;HEAP8[r7]=(r4&255)>>>6&1|48;HEAP8[r8]=(r4&255)>>>5&1|48;HEAP8[r9]=(r4&255)>>>4&1|48;HEAP8[r10]=(r4&255)>>>3&1|48;HEAP8[r11]=(r4&255)>>>2&1|48;HEAP8[r12]=(r4&255)>>>1&1|48;HEAP8[r13]=r4&1|48;HEAP8[r5]=0;_pce_puts(r6);_pce_puts(25840);r6=_e8259_get_icw(r1,0)&255;r5=_e8259_get_icw(r1,1)&255;r4=_e8259_get_icw(r1,2)&255;r13=_e8259_get_icw(r1,3)&255;r12=_e8259_get_ocw(r1,0)&255;r11=_e8259_get_ocw(r1,1)&255;r10=_e8259_get_ocw(r1,2)&255;_pce_printf(25120,(r2=STACKTOP,STACKTOP=STACKTOP+56|0,HEAP32[r2>>2]=r6,HEAP32[r2+8>>2]=r5,HEAP32[r2+16>>2]=r4,HEAP32[r2+24>>2]=r13,HEAP32[r2+32>>2]=r12,HEAP32[r2+40>>2]=r11,HEAP32[r2+48>>2]=r10,r2));STACKTOP=r2;_pce_printf(24896,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r1+32>>2],r2));STACKTOP=r2;r10=HEAP32[r1+36>>2];_pce_printf(24792,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=1,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+40>>2];_pce_printf(24792,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=2,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+44>>2];_pce_printf(24792,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=3,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+48>>2];_pce_printf(24792,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=4,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+52>>2];_pce_printf(24792,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=5,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+56>>2];_pce_printf(24792,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=6,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+60>>2];_pce_printf(24792,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=7,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;_pce_puts(25840);STACKTOP=r3;return}function _print_state_ppi(r1){var r2,r3,r4,r5,r6;r2=0;r3=STACKTOP;_pce_prt_sep(10072);r4=HEAPU8[r1|0];r5=HEAPU8[r1+1|0];_pce_printf(1e4,(r2=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r2>>2]=HEAPU8[r1+2|0],HEAP32[r2+8>>2]=r4,HEAP32[r2+16>>2]=r5,r2));STACKTOP=r2;if((HEAP8[r1+6|0]|0)==0){r5=_e8255_get_out(r1,0)&255;_pce_printf(9896,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2}else{r5=_e8255_get_inp(r1,0)&255;_pce_printf(9944,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2}if((HEAP8[r1+26|0]|0)==0){r5=_e8255_get_out(r1,1)&255;_pce_printf(9784,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2}else{r5=_e8255_get_inp(r1,1)&255;_pce_printf(9864,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2}r5=HEAPU8[r1+46|0];if((r5|0)==0){r4=_e8255_get_out(r1,2)&255;_pce_printf(26208,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r4,r2));STACKTOP=r2;_pce_puts(25840);STACKTOP=r3;return}else if((r5|0)==255){r4=_e8255_get_inp(r1,2)&255;_pce_printf(26256,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r4,r2));STACKTOP=r2;_pce_puts(25840);STACKTOP=r3;return}else if((r5|0)==240){r4=(_e8255_get_inp(r1,2)&255)>>>4;r6=_e8255_get_out(r1,2)&15;_pce_printf(25864,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=r4,HEAP32[r2+8>>2]=r6,r2));STACKTOP=r2;_pce_puts(25840);STACKTOP=r3;return}else if((r5|0)==15){r5=(_e8255_get_out(r1,2)&255)>>>4;r6=_e8255_get_inp(r1,2)&15;_pce_printf(25992,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=r5,HEAP32[r2+8>>2]=r6,r2));STACKTOP=r2;_pce_puts(25840);STACKTOP=r3;return}else{_pce_puts(25840);STACKTOP=r3;return}}function _print_state_tcu(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;_pce_prt_sep(10248);r4=_e80186_tcu_get_control(r1,0)&65535;r5=_e80186_tcu_get_count(r1,0)&65535;r6=_e80186_tcu_get_max_count_a(r1,0)&65535;r7=_e80186_tcu_get_max_count_b(r1,0)&65535;_pce_printf(10112,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=(r4&32768|0)!=0?42:32,HEAP32[r2+8>>2]=0,HEAP32[r2+16>>2]=r4,HEAP32[r2+24>>2]=r5,HEAP32[r2+32>>2]=r6,HEAP32[r2+40>>2]=r7,r2));STACKTOP=r2;r7=_e80186_tcu_get_control(r1,1)&65535;r6=_e80186_tcu_get_count(r1,1)&65535;r5=_e80186_tcu_get_max_count_a(r1,1)&65535;r4=_e80186_tcu_get_max_count_b(r1,1)&65535;_pce_printf(10112,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=(r7&32768|0)!=0?42:32,HEAP32[r2+8>>2]=1,HEAP32[r2+16>>2]=r7,HEAP32[r2+24>>2]=r6,HEAP32[r2+32>>2]=r5,HEAP32[r2+40>>2]=r4,r2));STACKTOP=r2;r4=_e80186_tcu_get_control(r1,2)&65535;r5=_e80186_tcu_get_count(r1,2)&65535;r6=_e80186_tcu_get_max_count_a(r1,2)&65535;r7=_e80186_tcu_get_max_count_b(r1,2)&65535;_pce_printf(10112,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=(r4&32768|0)!=0?42:32,HEAP32[r2+8>>2]=2,HEAP32[r2+16>>2]=r4,HEAP32[r2+24>>2]=r5,HEAP32[r2+32>>2]=r6,HEAP32[r2+40>>2]=r7,r2));STACKTOP=r2;STACKTOP=r3;return}function _rc759_fdc_init(r1){var r2,r3;r2=r1|0;_wd179x_init(r2);r3=r1|0;_wd179x_set_read_track_fct(r2,r3,894);_wd179x_set_write_track_fct(r2,r3,468);_wd179x_set_ready(r2,0,0);_wd179x_set_ready(r2,1,0);HEAP8[r1+65741|0]=0;HEAP8[r1+65748|0]=0;HEAP32[r1+65752>>2]=0;HEAP16[r1+65760>>1]=-1;HEAP32[r1+65764>>2]=0;HEAP8[r1+65772|0]=0;HEAP8[r1+65749|0]=0;HEAP32[r1+65756>>2]=0;HEAP16[r1+65762>>1]=-1;HEAP32[r1+65768>>2]=0;HEAP8[r1+65773|0]=0;return}function _rc759_read_track(r1,r2){var r3,r4,r5;r3=HEAP32[r1+65764+((HEAP32[r2+4>>2]&1)<<2)>>2];if((r3|0)==0){r4=1;return r4}r1=_pri_img_get_track(r3,HEAP32[r2+8>>2],HEAP32[r2+12>>2],0);if((r1|0)==0){r4=1;return r4}r3=r1+4|0;r5=HEAP32[r3>>2]+7|0;if(r5>>>0>262151){r4=1;return r4}_memcpy(r2+36|0,HEAP32[r1+8>>2],r5>>>3)|0;HEAP32[r2+32>>2]=HEAP32[r3>>2];r4=0;return r4}function _rc759_write_track(r1,r2){var r3,r4,r5;r3=HEAP32[r2+4>>2]&1;r4=HEAP32[r1+65764+(r3<<2)>>2];if((r4|0)==0){r5=1;return r5}HEAP8[r1+(r3|65772)|0]=1;r3=_pri_img_get_track(r4,HEAP32[r2+8>>2],HEAP32[r2+12>>2],1);if((r3|0)==0){r5=1;return r5}if((_pri_trk_set_size(r3,HEAP32[r2+32>>2])|0)!=0){r5=1;return r5}_pri_trk_set_clock(r3,1e6);_memcpy(HEAP32[r3+8>>2],r2+36|0,(HEAP32[r3+4>>2]+7|0)>>>3)|0;r5=0;return r5}function _rc759_fdc_save(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1024|0;r6=r5;r7=r1+65764+(r2<<2)|0;if((HEAP32[r7>>2]|0)==0){r8=1;STACKTOP=r5;return r8}r9=r2+(r1+65772)|0;if((HEAP8[r9]|0)==0){r8=0;STACKTOP=r5;return r8}_sim_log_deb(16152,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;L7:do{if((HEAP8[r2+(r1+65748)|0]|0)==0){r10=_dsks_get_disk(HEAP32[r1+65744>>2],HEAPU16[r1+65760+(r2<<1)>>1]);do{if((r10|0)!=0){r11=_pri_decode_mfm(HEAP32[r7>>2]);if((r11|0)!=0){if((_dsk_get_type(r10)|0)==6){r12=HEAP32[r10+64>>2];r13=r12+68|0;_psi_img_del(HEAP32[r13>>2]);HEAP32[r13>>2]=r11;HEAP8[r12+72|0]=1;break L7}r12=r6|0;r13=0;r14=0;L20:while(1){r15=0;r16=r14;while(1){r17=0;r18=r16;while(1){r19=r17+1|0;r20=_psi_img_get_sector(r11,r13,r15,r19,0);if((r20|0)==0){_memset(r12,0,1024)|0}else{r21=HEAP16[r20+10>>1];r22=r21&65535;if((r21&65535)<1024){_memset(r6+r22|0,0,1024-r22|0)|0;r23=r22}else{r23=1024}_memcpy(r12,HEAP32[r20+24>>2],r23)|0}r24=r18+2|0;if((_dsk_write_lba(r10,r12,r18,2)|0)!=0){r3=24;break L20}if(r19>>>0<8){r17=r19;r18=r24}else{break}}r18=r15+1|0;if(r18>>>0<2){r15=r18;r16=r24}else{break}}r16=r13+1|0;if(r16>>>0<77){r13=r16;r14=r24}else{r3=23;break}}if(r3==23){_psi_img_del(r11);break L7}else if(r3==24){_psi_img_del(r11);break}}}}while(0);_sim_log_deb(13376,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}else{r10=HEAP32[r1+65752+(r2<<2)>>2];if((r10|0)!=0?(_pri_img_save(r10,HEAP32[r7>>2],0)|0)==0:0){break}_sim_log_deb(14624,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}}while(0);HEAP8[r9]=0;r8=0;STACKTOP=r5;return r8}function _rc759_fdc_reset(r1){_wd179x_reset(r1|0);HEAP8[r1+65740|0]=0;HEAP8[r1+65741|0]=0;return}function _rc759_fdc_set_disks(r1,r2){HEAP32[r1+65744>>2]=r2;return}function _rc759_fdc_set_disk_id(r1,r2,r3){HEAP16[r1+65760+(r2<<1)>>1]=r3;return}function _rc759_fdc_set_fname(r1,r2,r3){var r4;if(r2>>>0>1){return}r4=r1+65752+(r2<<2)|0;_free(HEAP32[r4>>2]);HEAP32[r4>>2]=0;HEAP8[r2+(r1+65748)|0]=0;if((r3|0)==0){return}r1=_strlen(r3)+1|0;r2=_malloc(r1);if((r2|0)==0){return}_memcpy(r2,r3,r1)|0;HEAP32[r4>>2]=r2;return}function _rc759_fdc_load(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=0;r4=0;r5=STACKTOP;r6=r1|0;_wd179x_set_ready(r6,r2,0);r7=r2+(r1+65748)|0;HEAP8[r7]=0;r8=HEAP32[r1+65752+(r2<<2)>>2];if((r8|0)!=0){r9=_pri_img_load(r8,1);if((r9|0)!=0){HEAP8[r7]=1;_sim_log_deb(13576,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r10=r9}else{r3=4}}else{r3=4}L4:do{if(r3==4){r9=_dsks_get_disk(HEAP32[r1+65744>>2],HEAPU16[r1+65760+(r2<<1)>>1]);L6:do{if((r9|0)!=0){L8:do{if((_dsk_get_type(r9)|0)!=6){r7=_psi_img_new();if((r7|0)==0){break L6}r8=_dsk_get_block_cnt(r9)>>>5;if((r8|0)!=0){r11=0;r12=0;L12:while(1){r13=0;r14=r11;while(1){r15=0;r16=r14;while(1){r17=r15+1|0;r18=_psi_sct_new(r12,r13,r17,1024);if((r18|0)==0){r3=13;break L12}_psi_sct_set_encoding(r18,32770);_psi_img_add_sector(r7,r18,r12,r13);r19=r16+2|0;if((_dsk_read_lba(r9,HEAP32[r18+24>>2],r16,2)|0)!=0){r3=15;break L12}if(r17>>>0<8){r15=r17;r16=r19}else{break}}r16=r13+1|0;if(r16>>>0<2){r13=r16;r14=r19}else{break}}r14=r12+1|0;if(r14>>>0<r8>>>0){r11=r19;r12=r14}else{r20=r7;r21=r7;r3=18;break L8}}if(r3==13){_psi_img_del(r7);break L6}else if(r3==15){_psi_img_del(r7);break L6}}else{r22=r7;r23=r7}}else{r20=0;r21=HEAP32[HEAP32[r9+64>>2]+68>>2];r3=18}}while(0);if(r3==18){if((r21|0)==0){break}else{r22=r21;r23=r20}}r12=_pri_encode_mfm_hd_360(r22);_psi_img_del(r23);if((r12|0)!=0){_sim_log_deb(20488,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r10=r12;break L4}}}while(0);_sim_log_deb(17824,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r24=1;STACKTOP=r5;return r24}}while(0);r4=r1+65764+(r2<<2)|0;_pri_img_del(HEAP32[r4>>2]);HEAP32[r4>>2]=r10;HEAP8[r2+(r1+65772)|0]=0;_wd179x_set_ready(r6,r2,1);r24=0;STACKTOP=r5;return r24}function _rc759_fdc_get_reserve(r1){return HEAP8[r1+65740|0]}function _rc759_fdc_set_reserve(r1,r2){HEAP8[r1+65740|0]=r2<<24>>24==0?-128:0;return}function _rc759_fdc_get_fcr(r1){return HEAP8[r1+65741|0]}function _rc759_fdc_set_fcr(r1,r2){var r3,r4;r3=r1+65741|0;r4=r2&255;if((HEAP8[r3]|0)==r2<<24>>24){return}HEAP8[r3]=r2;r2=r1|0;_wd179x_select_drive(r2,r4&1);_wd179x_set_motor(r2,0,r4>>>1&1);_wd179x_set_motor(r2,1,r4>>>2&1);return}function _rc759_kbd_init(r1){var r2;HEAP8[r1|0]=0;HEAP32[r1+4>>2]=0;HEAP8[r1+8|0]=0;HEAP8[r1+9|0]=0;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=0;r2=r1+276|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;return}function _rc759_kbd_set_irq_fct(r1,r2,r3){HEAP32[r1+292>>2]=r2;HEAP32[r1+296>>2]=r3;return}function _rc759_kbd_reset(r1){var r2,r3,r4;r2=0;r3=STACKTOP;_sim_log_deb(20440,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;if((HEAP32[3640>>2]|0)!=0){r2=3640;while(1){HEAP8[r2+16|0]=0;r4=r2+20|0;if((HEAP32[r4>>2]|0)==0){break}else{r2=r4}}}HEAP8[r1+8|0]=0;HEAP8[r1+9|0]=1;HEAP32[r1+4>>2]=0;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=2;HEAP8[r1+20|0]=-1;HEAP8[r1+21|0]=-28;HEAP32[r1+276>>2]=0;HEAP32[r1+280>>2]=0;HEAP32[r1+284>>2]=HEAP32[r1+288>>2];r2=HEAP32[r1+296>>2];if((r2|0)==0){STACKTOP=r3;return}FUNCTION_TABLE[r2](HEAP32[r1+292>>2],0);STACKTOP=r3;return}function _rc759_kbd_set_enable(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r2<<24>>24!=0;r2=r1|0;if((HEAPU8[r2]|0)==(r5&1|0)){STACKTOP=r4;return}HEAP8[r2]=r5&1;if(!r5){STACKTOP=r4;return}_sim_log_deb(20440,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;if((HEAP32[3640>>2]|0)!=0){r3=3640;while(1){HEAP8[r3+16|0]=0;r5=r3+20|0;if((HEAP32[r5>>2]|0)==0){break}else{r3=r5}}}HEAP8[r1+8|0]=0;HEAP8[r1+9|0]=1;HEAP32[r1+4>>2]=0;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=2;HEAP8[r1+20|0]=-1;HEAP8[r1+21|0]=-28;HEAP32[r1+276>>2]=0;HEAP32[r1+280>>2]=0;HEAP32[r1+284>>2]=HEAP32[r1+288>>2];r3=HEAP32[r1+296>>2];if((r3|0)==0){STACKTOP=r4;return}FUNCTION_TABLE[r3](HEAP32[r1+292>>2],0);STACKTOP=r4;return}function _rc759_kbd_set_mouse(r1,r2,r3,r4){var r5;r5=r1+276|0;HEAP32[r5>>2]=HEAP32[r5>>2]+r2;r2=r1+280|0;HEAP32[r2>>2]=HEAP32[r2>>2]-r3;HEAP32[r1+288>>2]=r4;_rc759_kbd_check_mouse(r1);return}function _rc759_kbd_check_mouse(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=0;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r1+12|0;r7=HEAP32[r6>>2];r8=r1+16|0;if((r7|0)!=(HEAP32[r8>>2]|0)){STACKTOP=r4;return}r9=r1+276|0;r10=HEAP32[r9>>2];if(((r10|0)==0?(HEAP32[r1+280>>2]|0)==0:0)?(HEAP32[r1+284>>2]|0)==(HEAP32[r1+288>>2]|0):0){STACKTOP=r4;return}r11=HEAP32[r1+288>>2];HEAP32[r1+284>>2]=r11;HEAP8[r5|0]=-29;r12=r5+1|0;HEAP8[r12]=-121;HEAP8[r5+2|0]=-29;if((r10|0)<0){r13=(r10|0)<-128?-128:r10;r14=r13&255;r15=r13}else{r13=(r10|0)>127?127:r10;r14=r13&255;r15=r13}r13=r10-r15|0;HEAP32[r9>>2]=r13;HEAP8[r5+3|0]=r14;HEAP8[r5+4|0]=-29;r14=r1+280|0;r15=HEAP32[r14>>2];if((r15|0)<0){r10=(r15|0)<-128?-128:r15;r16=r10&255;r17=r10}else{r10=(r15|0)>127?127:r15;r16=r10&255;r17=r10}r10=r15-r17|0;HEAP32[r14>>2]=r10;HEAP8[r5+5|0]=r16;HEAP8[r5+6|0]=-29;if((r13|0)<0){r16=(r13|0)<-128?-128:r13;r18=r16&255;r19=r16}else{r16=(r13|0)>127?127:r13;r18=r16&255;r19=r16}HEAP32[r9>>2]=r13-r19;HEAP8[r5+7|0]=r18;HEAP8[r5+8|0]=-29;if((r10|0)<0){r18=(r10|0)<-128?-128:r10;r20=r18&255;r21=r18}else{r18=(r10|0)>127?127:r10;r20=r18&255;r21=r18}HEAP32[r14>>2]=r10-r21;HEAP8[r5+9|0]=r20;if((r11&1|0)==0){r22=-121}else{HEAP8[r12]=-125;r22=-125}if((r11&2|0)==0){r23=r22}else{r20=r22&-123;HEAP8[r12]=r20;r23=r20}if((r11&4|0)==0){r24=0;r25=r7;r26=r7}else{HEAP8[r12]=r23&-2;r24=0;r25=r7;r26=r7}while(1){r7=r25+1&255;if((r7|0)==(r26|0)){break}HEAP8[r25+(r1+20)|0]=HEAP8[r5+r24|0];HEAP32[r8>>2]=r7;r23=r24+1|0;if(r23>>>0>=10){r2=27;break}r24=r23;r25=r7;r26=HEAP32[r6>>2]}if(r2==27){STACKTOP=r4;return}_pce_log(0,15400,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;STACKTOP=r4;return}function _rc759_kbd_set_key(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;r5=0;r6=STACKTOP;if((r2|0)==3){_pce_log(2,24544,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r3,r5));STACKTOP=r5;STACKTOP=r6;return}else{r7=3640}while(1){r8=HEAP32[r7>>2];r9=(r8|0)==0;if(r9|(r8|0)==(r3|0)){break}else{r7=r7+20|0}}if(r9){r9=_pce_key_to_string(r3);_pce_log(2,18776,(r5=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r5>>2]=r2,HEAP32[r5+8>>2]=r3,HEAP32[r5+16>>2]=(r9|0)!=0?r9:16904,r5));STACKTOP=r5;STACKTOP=r6;return}if((r2|0)==2){r9=r7+16|0;if((HEAP8[r9]|0)==0){STACKTOP=r6;return}HEAP8[r9]=0;r9=HEAP16[r7+10>>1];r3=r9&65535;if(r9<<16>>16==0){STACKTOP=r6;return}r9=r1+16|0;r8=r1+12|0;r10=0;r11=HEAP32[r9>>2];while(1){r12=r11+1&255;if((r12|0)==(HEAP32[r8>>2]|0)){break}HEAP8[r11+(r1+20)|0]=HEAP8[r10+(r7+12)|0];HEAP32[r9>>2]=r12;r13=r10+1|0;if(r13>>>0<r3>>>0){r10=r13;r11=r12}else{r4=18;break}}if(r4==18){STACKTOP=r6;return}_pce_log(0,15400,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5;STACKTOP=r6;return}else if((r2|0)==1){HEAP8[r7+16|0]=1;r2=HEAP16[r7+4>>1];r11=r2&65535;if(r2<<16>>16==0){STACKTOP=r6;return}r2=r1+16|0;r10=r1+12|0;r3=0;r9=HEAP32[r2>>2];while(1){r8=r9+1&255;if((r8|0)==(HEAP32[r10>>2]|0)){break}HEAP8[r9+(r1+20)|0]=HEAP8[r3+(r7+6)|0];HEAP32[r2>>2]=r8;r12=r3+1|0;if(r12>>>0<r11>>>0){r3=r12;r9=r8}else{r4=18;break}}if(r4==18){STACKTOP=r6;return}_pce_log(0,15400,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5;STACKTOP=r6;return}else{STACKTOP=r6;return}}function _rc759_kbd_get_key(r1){var r2;r2=r1+9|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;HEAP32[r1+4>>2]=6e4;r2=HEAP32[r1+296>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+292>>2],0)}}return HEAP8[r1+8|0]}function _rc759_kbd_clock(r1,r2){var r3,r4,r5,r6;r3=r1+12|0;r4=HEAP32[r3>>2];if((r4|0)==(HEAP32[r1+16>>2]|0)){return}if((HEAP8[r1|0]|0)==0){return}r5=r1+4|0;r6=HEAP32[r5>>2];if(r6>>>0>r2>>>0){HEAP32[r5>>2]=r6-r2;return}r2=r1+9|0;if((HEAP8[r2]|0)!=0){return}HEAP32[r5>>2]=6e4;HEAP8[r1+8|0]=HEAP8[r4+(r1+20)|0];HEAP8[r2]=1;HEAP32[r3>>2]=r4+1&255;_rc759_kbd_check_mouse(r1);r4=HEAP32[r1+296>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+292>>2],1);return}function _sim_log_deb(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=HEAP32[30592>>2];if((r6|0)==0){r7=0;r8=0}else{r9=HEAP32[r6+16>>2];r7=HEAPU16[r9+28>>1];r8=HEAPU16[r9+22>>1]}_pce_log(3,20216,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r8,HEAP32[r3+8>>2]=r7,r3));STACKTOP=r3;r3=r5;HEAP32[r3>>2]=r2;HEAP32[r3+4>>2]=0;_pce_log_va(3,r1,r5|0);STACKTOP=r4;return}function _main(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;_pce_log_init();r7=HEAP32[_stderr>>2];r8=_pce_log_add_fp(r7,0,2);r9=_ini_sct_new(0);HEAP32[31928>>2]=r9;r10=(r9|0)==0;if(r10){r11=1;STACKTOP=r5;return r11}_ini_str_init(31904);r12=_pce_getopt(r1,r2,r6,1328);r13=(r12|0)==-1;L4:do{if(!r13){r14=r12;L5:while(1){r15=(r14|0)<0;if(r15){r11=1;r3=23;break}switch(r14|0){case 100:{r16=HEAP32[r6>>2];r17=HEAP32[r16>>2];r18=_pce_path_set(r17);break};case 73:{r19=HEAP32[r6>>2];r20=HEAP32[r19>>2];r21=_ini_str_add(31904,r20,18768,0);break};case 0:{r3=18;break L5;break};case 105:{r22=HEAP32[31928>>2];r23=HEAP32[r6>>2];r24=HEAP32[r23>>2];r25=_ini_read_str(r22,r24);r26=(r25|0)==0;if(!r26){r3=10;break L5}break};case 118:{_pce_log_set_level(r7,3);break};case 99:case 114:case 82:{break};case 113:{_pce_log_set_level(r7,0);break};case 103:{r27=HEAP32[r6>>2];r28=HEAP32[r27>>2];HEAP32[30576>>2]=r28;break};case 86:{r3=6;break L5;break};case 63:{r3=5;break L5;break};case 116:{r29=HEAP32[r6>>2];r30=HEAP32[r29>>2];HEAP32[30584>>2]=r30;break};case 115:{r31=HEAP32[r6>>2];r32=HEAP32[r31>>2];r33=_ini_str_add(31904,16880,r32,18768);break};case 108:{r34=HEAP32[r6>>2];r35=HEAP32[r34>>2];r36=_pce_log_add_fname(r35,3);break};default:{r11=1;r3=23;break L5}}r37=_pce_getopt(r1,r2,r6,1328);r38=(r37|0)==-1;if(r38){break L4}else{r14=r37}}if(r3==5){_pce_getopt_help(20520,20232,1328);r39=HEAP32[_stdout>>2];r40=_fflush(r39);r11=0;STACKTOP=r5;return r11}else if(r3==6){r41=HEAP32[_stdout>>2];r42=_fwrite(21448,86,1,r41);r43=_fflush(r41);r11=0;STACKTOP=r5;return r11}else if(r3==10){r44=HEAP32[r2>>2];r45=HEAP32[r6>>2];r46=HEAP32[r45>>2];r47=_fprintf(r7,24472,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r44,HEAP32[r4+8>>2]=r46,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}else if(r3==18){r48=HEAP32[r2>>2];r49=HEAP32[r6>>2];r50=HEAP32[r49>>2];r51=_fprintf(r7,15352,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r48,HEAP32[r4+8>>2]=r50,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}else if(r3==23){STACKTOP=r5;return r11}}}while(0);_pce_log_set_level(r7,3);_pce_log(1,21952,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;_pce_log_tag(2,23968,23296,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=13880,r4));STACKTOP=r4;r52=HEAP32[31928>>2];r53=_ini_read(r52,13880);r54=(r53|0)==0;if(!r54){_pce_log(0,22536,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}r55=HEAP32[31928>>2];r56=_ini_next_sct(r55,0,12840);r57=(r56|0)==0;r58=HEAP32[31928>>2];r59=r57?r58:r56;r60=_ini_str_eval(31904,r59,1);r61=(r60|0)==0;if(r61){r62=_atexit(746);r63=_SDL_Init(0);r64=_pce_path_ini(r59);r65=_rc759_new(r59);HEAP32[30592>>2]=r65;r66=_signal(2,484);r67=_signal(15,1038);r68=_signal(11,20);r69=HEAP32[_stdin>>2];r70=HEAP32[_stdout>>2];_pce_console_init(r69,r70);_mon_init(30616);r71=HEAP32[30592>>2];r72=r71;_mon_set_cmd_fct(30616,316,r72);r73=HEAP32[30592>>2];r74=r73;_mon_set_msg_fct(30616,538,r74);r75=HEAP32[30592>>2];r76=r75+4|0;r77=HEAP32[r76>>2];r78=r77;_mon_set_get_mem_fct(30616,r78,662);r79=HEAP32[30592>>2];r80=r79+4|0;r81=HEAP32[r80>>2];r82=r81;_mon_set_set_mem_fct(30616,r82,496);_mon_set_memory_mode(30616,1);r83=HEAP32[30592>>2];r84=r83;_cmd_init(r84,108,2);r85=HEAP32[30592>>2];_rc759_cmd_init(r85,30616);r86=HEAP32[30592>>2];_rc759_reset(r86);r87=HEAP32[30592>>2];_rc759_run_emscripten(r87);_exit(1)}else{r11=1;STACKTOP=r5;return r11}}function _sim_atexit(){_pce_set_fd_interactive(0,1);return}function _sig_int(r1){r1=HEAP32[_stderr>>2];_fwrite(25176,18,1,r1);_fflush(r1);r1=HEAP32[30592>>2]+70264|0;HEAP32[r1>>2]=(HEAP32[r1>>2]|0)==0?1:2;return}function _sig_term(r1){r1=HEAP32[_stderr>>2];_fwrite(26016,19,1,r1);_fflush(r1);HEAP32[HEAP32[30592>>2]+70264>>2]=2;return}function _sig_segv(r1){var r2;r1=HEAP32[_stderr>>2];_fwrite(10272,30,1,r1);_fflush(r1);r1=HEAP32[30592>>2];if((r1|0)!=0){r2=HEAP32[r1+16>>2];if((r2|0)!=0){_print_state_cpu(r2)}}_pce_set_fd_interactive(0,1);_exit(1)}function _cmd_get_sym1416(r1,r2,r3){var r4;if((_e86_get_reg(HEAP32[r1+16>>2],r2,r3)|0)==0){r4=0;return r4}if((_strcmp(r2,11112)|0)!=0){r4=1;return r4}HEAP32[r3>>2]=HEAP32[r1+70228>>2];r4=0;return r4}function _cmd_set_sym1418(r1,r2,r3){return(_e86_set_reg(HEAP32[r1+16>>2],r2,r3)|0)!=0|0}function _rc759_set_msg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=0;r6=STACKTOP;r7=(r1|0)==0?HEAP32[30592>>2]:r1;if((r2|0)==0){r8=1;STACKTOP=r6;return r8}r1=(r3|0)==0?32080:r3;r3=480;r9=18576;while(1){r10=r3+8|0;if((_msg_is_message(r9,r2)|0)!=0){r4=5;break}r11=HEAP32[r10>>2];if((r11|0)==0){break}else{r3=r10;r9=r11}}if(r4==5){r8=FUNCTION_TABLE[HEAP32[r3+4>>2]](r7,r2,r1);STACKTOP=r6;return r8}r3=HEAP32[r7+70164>>2];if((r3|0)!=0){r7=_trm_set_msg_trm(r3,r2,r1);if((r7|0)>-1){r8=r7;STACKTOP=r6;return r8}}_pce_log(2,23816,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r2,HEAP32[r5+8>>2]=r1,r5));STACKTOP=r5;r8=1;STACKTOP=r6;return r8}function _rc759_set_msg_emu_config_save(r1,r2,r3){return(_ini_write(r3,HEAP32[r1+70212>>2])|0)!=0|0}function _rc759_set_msg_emu_cpu_speed(r1,r2,r3){var r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_uint(r3,r4)|0)==0){_rc759_set_speed(r1,HEAP32[r4>>2]);r5=0}else{r5=1}STACKTOP=r2;return r5}function _rc759_set_msg_emu_cpu_speed_step(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_sint(r3,r4)|0)!=0){r5=1;STACKTOP=r2;return r5}r3=HEAP32[r1+70232>>2];r6=HEAP32[r4>>2];if((r6|0)<=0){if((r6|0)<0){r7=r6;r8=r3;while(1){r9=((r8<<3|4)>>>0)/9&-1;r10=r7+1|0;if((r10|0)<0){r7=r10;r8=r9}else{break}}HEAP32[r4>>2]=0;r11=r9}else{r11=r3}}else{r9=r6;r6=r3;while(1){r12=((r6*9&-1)+4|0)>>>3;r3=r9-1|0;if((r3|0)>0){r9=r3;r6=r12}else{break}}HEAP32[r4>>2]=0;r11=r12}_rc759_set_cpu_clock(r1,r11);r5=0;STACKTOP=r2;return r5}function _rc759_set_msg_emu_disk_commit(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r2=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8;HEAP32[r6>>2]=r3;if((_strcmp(r3,18600)|0)==0){_pce_log(2,18416,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r3=r1+960|0;_rc759_fdc_save(r3,0);_rc759_fdc_save(r3,1);if((_dsks_commit(HEAP32[r1+70168>>2])|0)==0){r8=0;STACKTOP=r5;return r8}_pce_log(0,18280,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}r3=r1+960|0;r9=r1+70168|0;r1=0;L8:while(1){while(1){if((HEAP8[HEAP32[r6>>2]]|0)==0){r8=r1;r2=11;break L8}if((_msg_get_prefix_uint(r6,r7,20464,20200)|0)!=0){break L8}_pce_log(2,18e3,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;_rc759_fdc_save(r3,HEAP32[r7>>2]);if((_dsks_set_msg(HEAP32[r9>>2],HEAP32[r7>>2],17888,0)|0)!=0){break}}_pce_log(0,17648,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;r1=1}if(r2==11){STACKTOP=r5;return r8}_pce_log(0,18120,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r6>>2],r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}function _rc759_set_msg_emu_disk_eject(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r2=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8;HEAP32[r6>>2]=r3;if((HEAP8[r3]|0)==0){r8=0;STACKTOP=r5;return r8}r3=r1+960|0;r9=r1+70168|0;while(1){if((_msg_get_prefix_uint(r6,r7,20464,20200)|0)!=0){break}_pce_log(2,19064,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;_rc759_fdc_save(r3,HEAP32[r7>>2]);_rc759_fdc_set_fname(r3,HEAP32[r7>>2],0);r1=_dsks_get_disk(HEAP32[r9>>2],HEAP32[r7>>2]);_dsks_rmv_disk(HEAP32[r9>>2],r1);_dsk_del(r1);_rc759_fdc_load(r3,HEAP32[r7>>2]);if((HEAP8[HEAP32[r6>>2]]|0)==0){r8=0;r2=6;break}}if(r2==6){STACKTOP=r5;return r8}_pce_log(0,19928,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r6>>2],r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}function _rc759_set_msg_emu_disk_insert(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r4+8;HEAP32[r6>>2]=r3;if((_msg_get_prefix_uint(r6,r5,20464,20200)|0)!=0){_pce_log(0,19928,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r3,r2));STACKTOP=r2;r7=1;STACKTOP=r4;return r7}r2=HEAP32[r6>>2];r8=r2;r9=0;while(1){r10=r2+r9|0;r11=HEAP8[r10];if(r11<<24>>24==0){break}else if(r11<<24>>24==46){r12=r10}else{r12=r8}r8=r12;r9=r9+1|0}r9=r1+960|0;_rc759_fdc_save(r9,HEAP32[r5>>2]);if((_strcasecmp(r8,19616)|0)!=0){if((_dsk_insert(HEAP32[r1+70168>>2],r3,1)|0)!=0){r7=1;STACKTOP=r4;return r7}}else{_rc759_fdc_set_fname(r9,HEAP32[r5>>2],HEAP32[r6>>2])}_rc759_fdc_load(r9,HEAP32[r5>>2]);r7=0;STACKTOP=r4;return r7}function _rc759_set_msg_emu_exit(r1,r2,r3){HEAP32[r1+70264>>2]=2;_mon_set_terminate(30616,1);return 0}function _rc759_set_msg_emu_parport1_driver(r1,r2,r3){return(_rc759_set_parport_driver(r1,0,r3)|0)!=0|0}function _rc759_set_msg_emu_parport1_file(r1,r2,r3){return(_rc759_set_parport_file(r1,0,r3)|0)!=0|0}function _rc759_set_msg_emu_parport2_driver(r1,r2,r3){return(_rc759_set_parport_driver(r1,1,r3)|0)!=0|0}function _rc759_set_msg_emu_parport2_file(r1,r2,r3){return(_rc759_set_parport_file(r1,1,r3)|0)!=0|0}function _rc759_set_msg_emu_pause(r1,r2,r3){var r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_bool(r3,r4)|0)!=0){r5=1;STACKTOP=r2;return r5}HEAP8[r1+70268|0]=HEAP32[r4>>2];_rc759_clock_discontinuity(r1);r5=0;STACKTOP=r2;return r5}function _rc759_set_msg_emu_pause_toggle(r1,r2,r3){r3=r1+70268|0;HEAP8[r3]=(HEAP8[r3]|0)==0|0;_rc759_clock_discontinuity(r1);return 0}function _rc759_set_msg_emu_reset(r1,r2,r3){_rc759_reset(r1);return 0}function _rc759_set_msg_emu_stop(r1,r2,r3){HEAP32[r1+70264>>2]=1;return 0}function _rc759_nvm_init(r1){HEAP32[r1>>2]=0;HEAP8[r1+4|0]=1;HEAP8[r1+5|0]=-86;_memset(r1+6|0,0,127)|0;return}function _rc759_nvm_set_fname(r1,r2){var r3,r4;r3=r1|0;r1=HEAP32[r3>>2];if((r1|0)!=0){_free(r1);HEAP32[r3>>2]=0}if((r2|0)==0){r4=0;return r4}r1=_str_copy_alloc(r2);HEAP32[r3>>2]=r1;r4=(r1|0)==0|0;return r4}function _rc759_nvm_load(r1){var r2,r3,r4;r2=HEAP32[r1>>2];if((r2|0)==0){r3=1;return r3}r4=_fopen(r2,17984);if((r4|0)==0){r3=1;return r3}r2=_fread(r1+5|0,1,128,r4);_fclose(r4);r4=r1+4|0;if(r2>>>0<128){HEAP8[r4]=1;_memset(r1+(r2+5)|0,0,128-r2|0)|0;r3=0;return r3}else{HEAP8[r4]=0;r3=0;return r3}}function _rc759_nvm_fix_checksum(r1){var r2,r3,r4,r5;r2=0;r3=0;while(1){r4=HEAPU8[r2+(r1+5)|0]+r3|0;r5=r2+1|0;if(r5>>>0<96){r2=r5;r3=r4}else{break}}r3=r1+5|0;HEAP8[r3]=170-r4+HEAPU8[r3];return}function _rc759_nvm_sanitize(r1){var r2;r2=r1+31|0;if(HEAPU8[r2]>=2){return}HEAP8[r2]=2;return}function _rc759_nvm_get_uint4(r1,r2){var r3;if(r2>>>0<256){r3=HEAP8[(r2>>>1)+(r1+5)|0]}else{r3=0}return((r2&1|0)==0?(r3&255)>>>4:r3)&15}function _rc759_nvm_set_uint4(r1,r2,r3){var r4,r5,r6;if(r2>>>0>=256){return}r4=(r2>>>1)+(r1+5)|0;r5=HEAP8[r4];if((r2&1|0)==0){r6=r5&15|r3<<4}else{r6=r5&-16|r3&15}HEAP8[r4]=r6;HEAP8[r1+4|0]=1;return}function _rc759_par_init(r1){HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=0;_memset(r1|0,0,9)|0;return}function _rc759_par_reset(r1){var r2;HEAP8[r1|0]=0;HEAP8[r1+1|0]=0;r2=r1+2|0;HEAP8[r2]=HEAP8[r2]&31;return}function _rc759_par_set_irq_fct(r1,r2,r3){HEAP32[r1+12>>2]=r2;HEAP32[r1+16>>2]=r3;return}function _rc759_par_set_driver(r1,r2){var r3,r4;r3=r1+4|0;r4=HEAP32[r3>>2];if((r4|0)!=0){_chr_close(r4)}r4=_chr_open(r2);HEAP32[r3>>2]=r4;r3=(r4|0)==0;HEAP8[r1+2|0]=r3?22:9;return r3&1}function _rc759_par_get_data(r1){return HEAP8[r1|0]}function _rc759_par_set_data(r1,r2){HEAP8[r1|0]=r2;return}function _rc759_par_set_control(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=r2&255;r4=r3&1;if((r4|0)==0){r5=r1+1|0;if((HEAP8[r5]&1)!=0){_chr_write(HEAP32[r1+4>>2],r1|0,1)}r6=r1+2|0;r7=HEAP8[r6]&-4;HEAP8[r6]=r7;r8=r7;r9=r5}else{r5=r1+2|0;r7=HEAP8[r5]|3;HEAP8[r5]=r7;r8=r7;r9=r1+1|0}HEAP8[r9]=r2;r9=r4<<1|r3&12;if((HEAP32[r1+4>>2]|0)==0){r10=r9&255}else{r10=(r9|r3>>>4&1)&255}HEAP8[r1+2|0]=r8&15|r10<<4;if(r2<<24>>24>-1){r11=(r8&1)==0}else{r11=0}r8=r1+8|0;if((HEAPU8[r8]|0)==(r11&1|0)){return}r2=r11&1;HEAP8[r8]=r2;r8=HEAP32[r1+16>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+12>>2],r2);return}function _rc759_par_get_status(r1){return HEAP8[r1+2|0]}function _rc759_par_get_reserve(r1){return HEAP8[r1+3|0]}function _rc759_par_set_reserve(r1,r2){HEAP8[r1+3|0]=r2<<24>>24!=0?0:-128;return}function _rc759_new(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+128|0;r4=r3;r5=r3+8;r6=r3+16;r7=r3+24;r8=r3+32;r9=r3+40;r10=r3+48;r11=r3+56;r12=r3+64;r13=r3+72;r14=r3+80;r15=r3+88;r16=r3+96;r17=r3+104;r18=r3+112;r19=r3+120;r20=_malloc(70272);r21=r20;if((r20|0)==0){r22=0;STACKTOP=r3;return r22}_memset(r20,0,70272)|0;HEAP32[r20+70212>>2]=r1;_bps_init(r20+70216|0);r23=r20;HEAP32[r23>>2]=0;HEAP32[r20+70228>>2]=0;HEAP32[r20+70264>>2]=0;HEAP8[r20+70268|0]=0;r24=_ini_next_sct(r1,0,13752);_ini_get_bool(r24,13688,r18,0);_ini_get_uint32(r24,13640,r19,6e6);r24=HEAP32[r18>>2];_pce_log_tag(2,13536,13464,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[r19>>2],HEAP32[r2+8>>2]=r24,r2));STACKTOP=r2;r24=r20+70232|0;HEAP32[r24>>2]=HEAP32[r19>>2];r19=r20+70236|0;HEAP32[r19>>2]=0;if((HEAP32[r18>>2]|0)!=0){HEAP32[r23>>2]=HEAP32[r23>>2]|1}r18=_mem_new();r25=r20+4|0;HEAP32[r25>>2]=r18;r26=r20+8|0;_ini_get_ram(r18,r1,r26);_ini_get_rom(HEAP32[r25>>2],r1);r18=_mem_new();r27=r20+12|0;HEAP32[r27>>2]=r18;_mem_set_fct(r18,r20,522,558,0,540,1062,0);_pce_log_tag(2,18560,14720,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r18=_e86_new();r28=r20+16|0;HEAP32[r28>>2]=r18;_e86_set_80186(r18);_e86_set_mem(HEAP32[r28>>2],HEAP32[r25>>2],662,496,1204,1198);_e86_set_prt(HEAP32[r28>>2],HEAP32[r27>>2],662,496,1204,1198);r18=HEAP32[r26>>2];r29=HEAP32[r28>>2];if((r18|0)==0){_e86_set_ram(r29,0,0)}else{_e86_set_ram(r29,HEAP32[r18+44>>2],HEAP32[r18+40>>2])}r18=r20+196|0;r29=r18;_e80186_icu_init(r29);_e80186_icu_set_intr_fct(r29,HEAP32[r28>>2],374);_e86_set_inta_fct(HEAP32[r28>>2],r18,1060);r28=r20+20|0;r30=r28;_e8259_init(r30);_e8259_set_int_fct(r30,r18,1080);_e80186_icu_set_inta0_fct(r29,r28,16);r29=r20+96|0;_e80186_tcu_init(r29);_e80186_tcu_set_input(r29,0,1);_e80186_tcu_set_input(r29,1,1);_e80186_tcu_set_input(r29,2,1);_e80186_tcu_set_int_fct(r29,0,r18,368);_e80186_tcu_set_int_fct(r29,1,r18,366);_e80186_tcu_set_int_fct(r29,2,r18,364);_e80186_tcu_set_out_fct(r29,0,r20,554);_e80186_tcu_set_out_fct(r29,1,r20,28);r29=r20+304|0;r30=r29;_e80186_dma_init(r30);_e80186_dma_set_getmem_fct(r30,HEAP32[r25>>2],662,1204);_e80186_dma_set_setmem_fct(r30,HEAP32[r25>>2],496,1198);_e80186_dma_set_getio_fct(r30,HEAP32[r27>>2],662,1204);_e80186_dma_set_setio_fct(r30,HEAP32[r27>>2],496,1198);_e80186_dma_set_int_fct(r30,0,r18,1064);_e80186_dma_set_int_fct(r30,1,r18,1066);r18=r20+408|0;_e8255_init(r18);r30=r20+70224|0;HEAP8[r30]=2;r27=r20+70225|0;HEAP8[r27]=-121;r31=HEAP32[r26>>2];do{if((r31|0)!=0){r26=HEAP32[r31+40>>2];if((HEAP32[r23>>2]&1|0)!=0){if(r26>>>0>851967){r32=2;break}if(r26>>>0>655359){HEAP8[r30]=18;r32=18;break}if(r26>>>0<=524287){r32=2;break}HEAP8[r30]=50;r32=50;break}if(r26>>>0>786431){HEAP8[r30]=34;r32=34;break}if(r26>>>0<=655359){if(r26>>>0>393215){HEAP8[r30]=18;r32=18;break}if(r26>>>0>262143){HEAP8[r30]=50;r32=50}else{r32=2}}else{r32=2}}else{r32=2}}while(0);_e8255_set_inp_a(r18,r32);_e8255_set_inp_b(r18,HEAP8[r27]);HEAP32[r20+464>>2]=r20;HEAP32[r20+468>>2]=1164;r32=r20+472|0;r30=r32;_rc759_kbd_init(r30);_rc759_kbd_set_irq_fct(r30,r28,248);r30=_ini_next_sct(r1,0,13752);_ini_get_string(r30,15760,r16,15616);_ini_get_bool(r30,15240,r17,0);r30=HEAP32[r17>>2];_pce_log_tag(2,15072,14936,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[r16>>2],HEAP32[r2+8>>2]=r30,r2));STACKTOP=r2;r30=r20+772|0;_rc759_nvm_init(r30);_rc759_nvm_set_fname(r30,HEAP32[r16>>2]);if((_rc759_nvm_load(r30)|0)!=0){r23=HEAP32[r16>>2];_pce_log(0,14832,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=(r23|0)!=0?r23:24912,r2));STACKTOP=r2}if((HEAP32[r17>>2]|0)!=0){_rc759_nvm_sanitize(r30);_rc759_nvm_fix_checksum(r30)}r30=r20+908|0;_rc759_rtc_init(r30);_rc759_rtc_set_time_now(r30);_rc759_rtc_set_irq_fct(r30,r28,252);_rc759_rtc_set_input_clock(r30,HEAP32[r24>>2]);r30=r20+66736|0;_rc759_spk_init(r30);_rc759_spk_set_clk_fct(r30,r20,382);_rc759_spk_set_input_clock(r30,HEAP32[r24>>2]);r17=_ini_next_sct(r1,0,16784);if((r17|0)!=0){_ini_get_string(r17,16632,r12,0);_ini_get_uint16(r17,16544,r13,500);_ini_get_uint32(r17,16392,r14,44100);_ini_get_uint32(r17,16280,r15,0);r17=HEAP32[r14>>2];r23=HEAP32[r15>>2];r16=HEAP32[r12>>2];_pce_log_tag(2,16176,16016,(r2=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r2>>2]=HEAP32[r13>>2],HEAP32[r2+8>>2]=r17,HEAP32[r2+16>>2]=r23,HEAP32[r2+24>>2]=(r16|0)!=0?r16:24912,r2));STACKTOP=r2;r16=HEAP32[r12>>2];if((r16|0)!=0?(_rc759_spk_set_driver(r30,r16,HEAP32[r14>>2])|0)!=0:0){_pce_log(0,15888,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r12>>2],r2));STACKTOP=r2}_rc759_spk_set_lowpass(r30,HEAP32[r15>>2]);_rc759_spk_set_volume(r30,HEAP32[r13>>2])}r13=_ini_get_terminal(r1,HEAP32[30584>>2]);r30=r20+70164|0;HEAP32[r30>>2]=r13;if((r13|0)!=0){_trm_set_key_fct(r13,r32,26);_trm_set_mouse_fct(HEAP32[r30>>2],r20,1122);_trm_set_msg_fct(HEAP32[r30>>2],r20,538)}r32=_ini_next_sct(r1,0,18592);r13=(r32|0)==0?r1:r32;_ini_get_uint16(r13,18408,r9,0);_ini_get_bool(r13,18272,r10,0);_ini_get_bool(r13,18112,r11,0);r13=HEAP32[30576>>2];do{if((r13|0)!=0){if((_strcmp(r13,18272)|0)==0){HEAP32[r10>>2]=1;break}if((_strcmp(r13,17992)|0)==0){HEAP32[r10>>2]=0;break}else{_pce_log(0,17856,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r13,r2));STACKTOP=r2;break}}}while(0);r13=r20+68888|0;_e82730_init(r13);_e82730_set_getmem_fct(r13,HEAP32[r25>>2],662,1204);_e82730_set_setmem_fct(r13,HEAP32[r25>>2],496,1198);_e82730_set_sint_fct(r13,r28,242);_e82730_set_terminal(r13,HEAP32[r30>>2]);_e82730_set_monochrome(r13,HEAP32[r10>>2]);_e82730_set_min_h(r13,HEAP32[r9>>2]);r32=HEAP32[r11>>2];r15=HEAP32[r9>>2];_pce_log_tag(2,17640,17496,(r2=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r2>>2]=HEAP32[r10>>2],HEAP32[r2+8>>2]=r32,HEAP32[r2+16>>2]=r15,r2));STACKTOP=r2;r15=HEAP8[r27];if((HEAP32[r11>>2]|0)==0){HEAP8[r27]=r15&-65;_e82730_set_clock(r13,75e4,HEAP32[r24>>2])}else{HEAP8[r27]=r15|64;_e82730_set_clock(r13,125e4,HEAP32[r24>>2])}r13=HEAP8[r27];r15=(HEAP32[r10>>2]|0)==0?r13&-33:r13|32;HEAP8[r27]=r15;_e8255_set_inp_b(r18,r15);r15=HEAP32[r30>>2];if((r15|0)!=0){if((HEAP32[r11>>2]|0)==0){_trm_open(r15,560,260)}else{_trm_open(r15,720,341)}_trm_set_msg_trm(HEAP32[r30>>2],17360,17072)}r30=r20+70168|0;HEAP32[r30>>2]=_dsks_new();r15=_ini_next_sct(r1,0,19608);if((r15|0)!=0){r11=r15;while(1){if((_ini_get_disk(r11,r8)|0)==0){r15=HEAP32[r8>>2];if((r15|0)!=0){_dsks_add_disk(HEAP32[r30>>2],r15)}}else{_pce_log(0,18992,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2}r15=_ini_next_sct(r1,r11,19608);if((r15|0)==0){break}else{r11=r15}}}r11=_ini_next_sct(r1,0,21864);_ini_get_string(r11,21376,r6,0);_ini_get_string(r11,20456,r7,0);r11=HEAP32[r6>>2];r8=HEAP32[r7>>2];_pce_log_tag(2,20192,19904,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=(r11|0)!=0?r11:24912,HEAP32[r2+8>>2]=(r8|0)!=0?r8:24912,r2));STACKTOP=r2;r8=r20+960|0;r11=r8;_rc759_fdc_init(r11);r15=r8;_wd179x_set_irq_fct(r15,r28,250);_wd179x_set_drq_fct(r15,r29,478);_wd179x_set_input_clock(r15,HEAP32[r24>>2]);_wd179x_set_bit_clock(r15,2e6);_rc759_fdc_set_disks(r11,HEAP32[r30>>2]);_rc759_fdc_set_fname(r11,0,HEAP32[r6>>2]);_rc759_fdc_set_fname(r11,1,HEAP32[r7>>2]);_rc759_fdc_set_disk_id(r11,0,0);_rc759_fdc_set_disk_id(r11,1,1);_rc759_fdc_load(r11,0);_rc759_fdc_load(r11,1);r11=_ini_next_sct(r1,0,13752);_ini_get_string(r11,12744,r4,0);_ini_get_string(r11,11904,r4,HEAP32[r4>>2]);_ini_get_string(r11,11e3,r5,0);r11=HEAP32[r4>>2];_pce_log_tag(2,10168,25888,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=(r11|0)==0?24912:r11,r2));STACKTOP=r2;r11=r20+70172|0;_rc759_par_init(r11);_rc759_par_set_irq_fct(r11,r28,246);r7=HEAP32[r4>>2];if((r7|0)!=0?(_rc759_par_set_driver(r11,r7)|0)!=0:0){_pce_log(0,23864,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r4>>2],r2));STACKTOP=r2}r4=HEAP32[r5>>2];_pce_log_tag(2,23192,22424,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=(r4|0)==0?24912:r4,r2));STACKTOP=r2;r4=r20+70192|0;_rc759_par_init(r4);_rc759_par_set_irq_fct(r4,r28,254);r28=HEAP32[r5>>2];if((r28|0)!=0?(_rc759_par_set_driver(r4,r28)|0)!=0:0){_pce_log(0,23864,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r5>>2],r2));STACKTOP=r2}_pce_load_mem_ini(HEAP32[r25>>2],r1);_mem_move_to_front(HEAP32[r25>>2],1015808);HEAP32[r20+70252>>2]=0;HEAP32[r20+70256>>2]=0;_pce_get_interval_us(r20+70260|0);HEAP32[r19>>2]=0;HEAP32[r19+4>>2]=0;HEAP32[r19+8>>2]=0;HEAP32[r19+12>>2]=0;r22=r21;STACKTOP=r3;return r22}function _rc759_set_parport_driver(r1,r2,r3){var r4;if(r2>>>0>1){r4=1;return r4}r4=(_rc759_par_set_driver(r1+70172+(r2*20&-1)|0,r3)|0)!=0|0;return r4}function _rc759_set_parport_file(r1,r2,r3){var r4,r5;if(r2>>>0>1){r4=1;return r4}r5=_str_cat_alloc(17960,r3);r3=(_rc759_par_set_driver(r1+70172+(r2*20&-1)|0,r5)|0)!=0|0;_free(r5);r4=r3;return r4}function _rc759_intlog_get(r1,r2){return HEAP32[30880+((r2&255)<<2)>>2]}function _rc759_intlog_set(r1,r2,r3){var r4;r1=30880+((r2&255)<<2)|0;_free(HEAP32[r1>>2]);if((r3|0)!=0?(HEAP8[r3]|0)!=0:0){r4=_str_copy_alloc(r3)}else{r4=0}HEAP32[r1>>2]=r4;return}function _rc759_intlog_check(r1,r2){var r3,r4,r5,r6,r7,r8;r1=STACKTOP;STACKTOP=STACKTOP+272|0;r3=r1;r4=r1+8;r5=HEAP32[30880+((r2&255)<<2)>>2];if((r5|0)==0){r6=0;r7=260;r8=0;STACKTOP=r1;return r6}_cmd_set_str(r4,r5);r5=(_cmd_match_uint32(r4,r3)|0)!=0;r6=r5&(HEAP32[r3>>2]|0)!=0&1;r7=260;r8=0;STACKTOP=r1;return r6}function _rc759_reset(r1){var r2,r3;r2=0;r3=STACKTOP;_sim_log_deb(23624,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;_e86_reset(HEAP32[r1+16>>2]);_e82730_reset(r1+68888|0);_e8259_reset(r1+20|0);_e80186_tcu_reset(r1+96|0);_e80186_dma_reset(r1+304|0);_e80186_icu_reset(r1+196|0);_rc759_kbd_reset(r1+472|0);_rc759_rtc_reset(r1+908|0);_rc759_fdc_reset(r1+960|0);_rc759_par_reset(r1+70172|0);_rc759_par_reset(r1+70192|0);STACKTOP=r3;return}function _rc759_set_cpu_clock(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+70232|0;if((HEAP32[r5>>2]|0)==(r2|0)){STACKTOP=r4;return}_pce_log_tag(2,18560,16736,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;HEAP32[r5>>2]=r2;_wd179x_set_input_clock(r1+960|0,r2);_rc759_rtc_set_input_clock(r1+908|0,r2);_rc759_spk_set_input_clock(r1+66736|0,HEAP32[r5>>2]);r2=r1+68888|0;r3=HEAP32[r5>>2];if((HEAP8[r1+70225|0]&64)==0){_e82730_set_clock(r2,75e4,r3);STACKTOP=r4;return}else{_e82730_set_clock(r2,125e4,r3);STACKTOP=r4;return}}function _rc759_set_speed(r1,r2){_rc759_set_cpu_clock(r1,(r2*1e6&-1)+4e6|0);return}function _rc759_get_cpu_clock(r1){return HEAP32[r1+70236>>2]}function _rc759_clock_discontinuity(r1){HEAP32[r1+70256>>2]=HEAP32[r1+70252>>2];_pce_get_interval_us(r1+70260|0);return}function _rc759_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=(r2|0)==0?4:r2;_e86_clock(HEAP32[r1+16>>2],r5);_e80186_tcu_clock(r1+96|0,r5);if((HEAP8[r1+330|0]|0)!=0){_e80186_dma_clock2(r1+304|0,r5)}r2=r1+70252|0;HEAP32[r2>>2]=HEAP32[r2>>2]+r5;r6=r1+70236|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r5;r6=r1+70240|0;r7=HEAP32[r6>>2]+r5|0;HEAP32[r6>>2]=r7;if(r7>>>0<8){STACKTOP=r4;return}r5=r7&7;HEAP32[r6>>2]=r5;r6=r7-r5|0;_e82730_clock(r1+68888|0,r6);r5=r1+960|0;if((HEAP8[r5|0]|0)!=0){_wd179x_clock2(r5,r6)}_rc759_rtc_clock(r1+908|0,r6);r5=r1+70244|0;r7=HEAP32[r5>>2]+r6|0;HEAP32[r5>>2]=r7;if(r7>>>0<1024){STACKTOP=r4;return}r6=r7&1023;HEAP32[r5>>2]=r6;r5=r7-r6|0;r6=HEAP32[r1+70164>>2];if((r6|0)!=0){_trm_check(r6)}_rc759_kbd_clock(r1+472|0,r5);_rc759_spk_clock(r1+66736|0,r5);r6=r1+70248|0;r7=HEAP32[r6>>2]+r5|0;HEAP32[r6>>2]=r7;if(r7>>>0<32768){STACKTOP=r4;return}HEAP32[r6>>2]=r7&32767;r7=HEAP32[r2>>2];r6=_pce_get_interval_us(r1+70260|0);r5=HEAP32[r1+70232>>2];r8=r5;r9=0;r10=___muldi3(r8,r9,r6,0);r6=___udivdi3(r10,tempRet0,1e6,0);r10=r1+70256|0;r1=r6+HEAP32[r10>>2]|0;if(r7>>>0<r1>>>0){HEAP32[r2>>2]=0;r6=r1-r7|0;HEAP32[r10>>2]=r6;if(r6>>>0<=r5>>>0){STACKTOP=r4;return}HEAP32[r10>>2]=0;_pce_log(2,15160,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;STACKTOP=r4;return}else{r3=r7-r1|0;HEAP32[r2>>2]=r3;HEAP32[r10>>2]=0;r10=___muldi3(r3,0,1e6,0);r3=___udivdi3(r10,tempRet0,r8,r9);r9=r3;if(r9>>>0<=25e3){STACKTOP=r4;return}_pce_usleep(r9);STACKTOP=r4;return}}function _rc759_set_mouse(r1,r2,r3,r4){_chr_mouse_set(r2,r3,r4);_rc759_kbd_set_mouse(r1+472|0,r2,r3,r4);return}function _rc759_set_ppi_port_c(r1,r2){HEAP8[r1+70226|0]=r2;_rc759_kbd_set_enable(r1+472|0,r2&-128);_e82730_set_graphic(r1+68888|0,((r2&255)>>>6&1^1)&255);return}function _rc759_set_timer0_out(r1,r2){var r3,r4,r5,r6;r3=r1+70224|0;r4=HEAP8[r3];r5=r4|1;HEAP8[r3]=r5;if((HEAP8[r1+70226|0]&1)==0|r2<<24>>24==0){r6=r5}else{r5=r4&-2;HEAP8[r3]=r5;r6=r5}_e8255_set_inp_a(r1+408|0,r6);return}function _rc759_set_timer1_out(r1,r2){_rc759_spk_set_out(r1+66736|0,r2);return}function _rc759_get_port8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62;r3=0;r4=0;r5=STACKTOP;r6=r2-128|0;r7=r6>>>0<128;L1:do{if(r7){r8=r1+70226|0;r9=HEAP8[r8];r10=r9&255;r11=r10<<2;r12=r11&192;r13=r2>>>1;r14=r13&63;r15=r12|r14;r16=r1+772|0;r17=_rc759_nvm_get_uint4(r16,r15);r18=r17&15;r19=r18}else{r20=r2-384|0;r21=r20>>>0<63;if(r21){r22=r2&1;r23=(r22|0)==0;if(!r23){r19=0;break}r24=r1+68888|0;r25=r20>>>1;r26=_e82730_get_palette(r24,r25);r19=r26;break}switch(r2|0){case 92:{r27=r1+908|0;r28=_rc759_rtc_get_addr(r27);r19=r28;break L1;break};case 112:{r29=r1+408|0;r30=_e8255_get_uint8(r29,0);r19=r30;break L1;break};case 114:{r31=r1+408|0;r32=_e8255_get_uint8(r31,1);r19=r32;break L1;break};case 116:{r33=r1+408|0;r34=_e8255_get_uint8(r33,2);r19=r34;break L1;break};case 118:{r35=r1+408|0;r36=_e8255_get_uint8(r35,3);r19=r36;break L1;break};case 592:{r37=r1+70172|0;r38=_rc759_par_get_data(r37);r19=r38;break L1;break};case 608:{r39=r1+70172|0;r40=_rc759_par_get_status(r39);r19=r40;break L1;break};case 640:{r41=r1+960|0;r42=_wd179x_get_status(r41);r19=r42;break L1;break};case 642:{r43=r1+960|0;r44=_wd179x_get_track(r43);r19=r44;break L1;break};case 644:{r45=r1+960|0;r46=_wd179x_get_sector(r45);r19=r46;break L1;break};case 646:{r47=r1+960|0;r48=_wd179x_get_data(r47);r19=r48;break L1;break};case 650:{r49=r1+70192|0;r50=_rc759_par_get_data(r49);r19=r50;break L1;break};case 652:{r51=r1+70192|0;r52=_rc759_par_get_status(r51);r19=r52;break L1;break};case 654:{r53=r1+960|0;r54=_rc759_fdc_get_reserve(r53);r19=r54;break L1;break};case 658:{r55=r1+70192|0;r56=_rc759_par_get_reserve(r55);r19=r56;break L1;break};case 768:{r19=0;break L1;break};case 770:{r19=0;break L1;break};case 86:{r19=-1;break L1;break};case 32:{r57=r1+472|0;r58=_rc759_kbd_get_key(r57);r19=r58;break L1;break};case 0:{r59=r1+20|0;r60=_e8259_get_uint8(r59,0);r19=r60;break L1;break};case 2:{r61=r1+20|0;r62=_e8259_get_uint8(r61,1);r19=r62;break L1;break};default:{_sim_log_deb(13784,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=255,r4));STACKTOP=r4;r19=-1;break L1}}}}while(0);STACKTOP=r5;return r19}function _rc759_get_port16(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78;r3=0;r4=0;r5=STACKTOP;switch(r2|0){case 65330:{r6=r1+196|0;r7=_e80186_icu_get_icon(r6,0);r8=r7;break};case 65332:{r9=r1+196|0;r10=_e80186_icu_get_icon(r9,2);r8=r10;break};case 65334:{r11=r1+196|0;r12=_e80186_icu_get_icon(r11,3);r8=r12;break};case 65336:{r13=r1+196|0;r14=_e80186_icu_get_icon(r13,4);r8=r14;break};case 65338:{r15=r1+196|0;r16=_e80186_icu_get_icon(r15,5);r8=r16;break};case 65340:{r17=r1+196|0;r18=_e80186_icu_get_icon(r17,6);r8=r18;break};case 65342:{r19=r1+196|0;r20=_e80186_icu_get_icon(r19,7);r8=r20;break};case 65360:{r21=r1+96|0;r22=_e80186_tcu_get_count(r21,0);r8=r22;break};case 65362:{r23=r1+96|0;r24=_e80186_tcu_get_max_count_a(r23,0);r8=r24;break};case 65364:{r25=r1+96|0;r26=_e80186_tcu_get_max_count_b(r25,0);r8=r26;break};case 65366:{r27=r1+96|0;r28=_e80186_tcu_get_control(r27,0);r8=r28;break};case 65368:{r29=r1+96|0;r30=_e80186_tcu_get_count(r29,1);r8=r30;break};case 65370:{r31=r1+96|0;r32=_e80186_tcu_get_max_count_a(r31,1);r8=r32;break};case 65372:{r33=r1+96|0;r34=_e80186_tcu_get_max_count_b(r33,1);r8=r34;break};case 65374:{r35=r1+96|0;r36=_e80186_tcu_get_control(r35,1);r8=r36;break};case 65376:{r37=r1+96|0;r38=_e80186_tcu_get_count(r37,2);r8=r38;break};case 65378:{r39=r1+96|0;r40=_e80186_tcu_get_max_count_a(r39,2);r8=r40;break};case 65382:{r41=r1+96|0;r42=_e80186_tcu_get_control(r41,2);r8=r42;break};case 65472:{r43=r1+304|0;r44=_e80186_dma_get_src_lo(r43,0);r8=r44;break};case 65474:{r45=r1+304|0;r46=_e80186_dma_get_src_hi(r45,0);r8=r46;break};case 65476:{r47=r1+304|0;r48=_e80186_dma_get_dst_lo(r47,0);r8=r48;break};case 65478:{r49=r1+304|0;r50=_e80186_dma_get_dst_hi(r49,0);r8=r50;break};case 65480:{r51=r1+304|0;r52=_e80186_dma_get_count(r51,0);r8=r52;break};case 65482:{r53=r1+304|0;r54=_e80186_dma_get_control(r53,0);r8=r54;break};case 65488:{r55=r1+304|0;r56=_e80186_dma_get_src_lo(r55,1);r8=r56;break};case 65490:{r57=r1+304|0;r58=_e80186_dma_get_src_hi(r57,1);r8=r58;break};case 65492:{r59=r1+304|0;r60=_e80186_dma_get_dst_lo(r59,1);r8=r60;break};case 65494:{r61=r1+304|0;r62=_e80186_dma_get_dst_hi(r61,1);r8=r62;break};case 65496:{r63=r1+304|0;r64=_e80186_dma_get_count(r63,1);r8=r64;break};case 65498:{r65=r1+304|0;r66=_e80186_dma_get_control(r65,1);r8=r66;break};case 65324:{r67=r1+196|0;r68=_e80186_icu_get_isr(r67);r8=r68;break};case 65318:{r69=r1+196|0;r70=_e80186_icu_get_pollst(r69);r8=r70;break};case 65326:{r71=r1+196|0;r72=_e80186_icu_get_irr(r71);r8=r72;break};case 65316:{r73=r1+196|0;r74=_e80186_icu_get_poll(r73);r8=r74;break};case 65320:{r75=r1+196|0;r76=_e80186_icu_get_imr(r75);r8=r76;break};case 65322:{r77=r1+196|0;r78=_e80186_icu_get_pmr(r77);r8=r78;break};default:{_sim_log_deb(14064,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=65535,r4));STACKTOP=r4;r8=-1}}STACKTOP=r5;return r8}function _rc759_set_port8(r1,r2,r3){var r4,r5,r6;r4=0;r5=STACKTOP;do{if((r2-128|0)>>>0>=128){r6=r2-384|0;if(r6>>>0<63){if((r2&1|0)!=0){break}_e82730_set_palette(r1+68888|0,r6>>>1,r3);break}if((r2|0)==92){_rc759_rtc_set_addr(r1+908|0,r3);break}else if((r2|0)==112){_e8255_set_uint8(r1+408|0,0,r3);break}else if((r2|0)==114){_e8255_set_uint8(r1+408|0,1,r3);break}else if((r2|0)==116){_e8255_set_uint8(r1+408|0,2,r3);break}else if((r2|0)==118){_e8255_set_uint8(r1+408|0,3,r3);break}else if((r2|0)==52942){_rc759_set_msg(r1,14664,14464);break}else if((r2|0)==560){_e82730_set_srst(r1+68888|0);break}else if((r2|0)==576){_e82730_set_ca(r1+68888|0);break}else if((r2|0)==592){_rc759_par_set_data(r1+70172|0,r3);break}else if((r2|0)==608){_rc759_par_set_control(r1+70172|0,r3);break}else if((r2|0)==640){_wd179x_set_cmd(r1+960|0,r3);break}else if((r2|0)==642){_wd179x_set_track(r1+960|0,r3);break}else if((r2|0)==644){_wd179x_set_sector(r1+960|0,r3);break}else if((r2|0)==646){_wd179x_set_data(r1+960|0,r3);break}else if((r2|0)==648){_rc759_fdc_set_fcr(r1+960|0,r3);break}else if((r2|0)==650){_rc759_par_set_data(r1+70192|0,r3);break}else if((r2|0)==652){_rc759_par_set_control(r1+70192|0,r3);break}else if((r2|0)==654){_rc759_fdc_set_reserve(r1+960|0,1);break}else if((r2|0)==656){_rc759_fdc_set_reserve(r1+960|0,0);break}else if((r2|0)==658){_rc759_par_set_reserve(r1+70192|0,1);break}else if((r2|0)==660){_rc759_par_set_reserve(r1+70192|0,0);break}else if((r2|0)==65320){_e80186_icu_set_imr(r1+196|0,r3&255);break}else if((r2|0)==86){break}else if((r2|0)==90){_rc759_rtc_set_data(r1+908|0,r3);break}else if((r2|0)==0){_e8259_set_uint8(r1+20|0,0,r3);break}else if((r2|0)==2){_e8259_set_uint8(r1+20|0,1,r3);break}else{_sim_log_deb(14216,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3&255,r4));STACKTOP=r4;break}}else{_rc759_nvm_set_uint4(r1+772|0,HEAPU8[r1+70226|0]<<2&192|r2>>>1&63,r3)}}while(0);STACKTOP=r5;return}function _rc759_set_port16(r1,r2,r3){var r4,r5;r4=0;r5=STACKTOP;if((r2|0)==65324){_e80186_icu_set_isr(r1+196|0,r3)}else if((r2|0)==65326){_e80186_icu_set_irr(r1+196|0,r3)}else if((r2|0)==65330){_e80186_icu_set_icon(r1+196|0,0,r3)}else if((r2|0)==65332){_e80186_icu_set_icon(r1+196|0,2,r3)}else if((r2|0)==65334){_e80186_icu_set_icon(r1+196|0,3,r3)}else if((r2|0)==65336){_e80186_icu_set_icon(r1+196|0,4,r3)}else if((r2|0)==65338){_e80186_icu_set_icon(r1+196|0,5,r3)}else if((r2|0)==65340){_e80186_icu_set_icon(r1+196|0,6,r3)}else if((r2|0)==65342){_e80186_icu_set_icon(r1+196|0,7,r3)}else if((r2|0)==65360){_e80186_tcu_set_count(r1+96|0,0,r3)}else if((r2|0)==65362){_e80186_tcu_set_max_count_a(r1+96|0,0,r3)}else if((r2|0)==65364){_e80186_tcu_set_max_count_b(r1+96|0,0,r3)}else if((r2|0)==65366){_e80186_tcu_set_control(r1+96|0,0,r3)}else if((r2|0)==65368){_e80186_tcu_set_count(r1+96|0,1,r3)}else if((r2|0)==65370){_e80186_tcu_set_max_count_a(r1+96|0,1,r3)}else if((r2|0)==65372){_e80186_tcu_set_max_count_b(r1+96|0,1,r3)}else if((r2|0)==65374){_e80186_tcu_set_control(r1+96|0,1,r3)}else if((r2|0)==65376){_e80186_tcu_set_count(r1+96|0,2,r3)}else if((r2|0)==65378){_e80186_tcu_set_max_count_a(r1+96|0,2,r3)}else if((r2|0)==65382){_e80186_tcu_set_control(r1+96|0,2,r3)}else if((r2|0)==65472){_e80186_dma_set_src_lo(r1+304|0,0,r3)}else if((r2|0)==65474){_e80186_dma_set_src_hi(r1+304|0,0,r3)}else if((r2|0)==65476){_e80186_dma_set_dst_lo(r1+304|0,0,r3)}else if((r2|0)==65478){_e80186_dma_set_dst_hi(r1+304|0,0,r3)}else if((r2|0)==65480){_e80186_dma_set_count(r1+304|0,0,r3)}else if((r2|0)==65482){_e80186_dma_set_control(r1+304|0,0,r3)}else if((r2|0)==65488){_e80186_dma_set_src_lo(r1+304|0,1,r3)}else if((r2|0)==65490){_e80186_dma_set_src_hi(r1+304|0,1,r3)}else if((r2|0)==65492){_e80186_dma_set_dst_lo(r1+304|0,1,r3)}else if((r2|0)==65494){_e80186_dma_set_dst_hi(r1+304|0,1,r3)}else if((r2|0)==65496){_e80186_dma_set_count(r1+304|0,1,r3)}else if((r2|0)==65498){_e80186_dma_set_control(r1+304|0,1,r3)}else if((r2|0)==560){_e82730_set_srst(r1+68888|0)}else if((r2|0)==65322){_e80186_icu_set_pmr(r1+196|0,r3)}else if((r2|0)==576){_e82730_set_ca(r1+68888|0)}else if((r2|0)==52942){_rc759_set_msg(r1,14664,14464)}else if((r2|0)==2){_e8259_set_uint8(r1+20|0,1,r3&255)}else if((r2|0)==65320){_e80186_icu_set_imr(r1+196|0,r3)}else if((r2|0)==65314){_e80186_icu_set_eoi(r1+196|0,r3)}else if(!((r2|0)==65440|(r2|0)==65442|(r2|0)==65444|(r2|0)==65446|(r2|0)==65448)){_sim_log_deb(14392,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3&65535,r4));STACKTOP=r4}STACKTOP=r5;return}function _rc759_rtc_init(r1){HEAP32[r1+32>>2]=6e6;HEAP32[r1+36>>2]=600;HEAP8[r1+40|0]=0;HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=0;return}function _rc759_rtc_reset(r1){var r2;r2=r1;r1=r2|0;tempBigInt=0;HEAP8[r1]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+3|0]=tempBigInt;r1=r2+4|0;tempBigInt=0;HEAP8[r1]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+3|0]=tempBigInt;return}function _rc759_rtc_set_irq_fct(r1,r2,r3){HEAP32[r1+44>>2]=r2;HEAP32[r1+48>>2]=r3;return}function _rc759_rtc_set_input_clock(r1,r2){HEAP32[r1+32>>2]=r2;HEAP32[r1+36>>2]=(r2>>>0)/1e4&-1;return}function _rc759_rtc_set_time_now(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;HEAP32[r3>>2]=_time(0);r4=_localtime(r3);HEAP8[r1+12|0]=0;HEAP8[r1+14|0]=0;HEAP8[r1+16|0]=HEAP32[r4>>2];HEAP8[r1+18|0]=HEAP32[r4+4>>2];HEAP8[r1+20|0]=HEAP32[r4+8>>2];HEAP8[r1+22|0]=HEAP32[r4+24>>2];HEAP8[r1+24|0]=HEAP32[r4+12>>2]+255;HEAP8[r1+26|0]=HEAP32[r4+16>>2];STACKTOP=r2;return}function _rc759_rtc_get_addr(r1){return HEAP8[r1+1|0]}function _rc759_rtc_set_addr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135;r3=0;r4=r2&255;r5=r4&224;if((r5|0)==0){r6=r1+4|0;HEAP8[r6]=0;r7=r2&255;r8=r7&31;r9=r1+6|0;HEAP16[r9>>1]=r8;return}else if((r5|0)==64){r10=r1+4|0;HEAP8[r10]=1;r11=r1+6|0;r12=HEAP16[r11>>1];r13=r12&65535;r14=r1+5|0;r15=HEAP8[r14];r16=r12<<16>>16==17;if(r16){r17=r1+29|0;HEAP8[r17]=r15;return}r18=r13>>>3;r19=r18&1;r20=r13&247;switch(r20|0){case 0:{r21=(r15&255)>>>4;r22=r21*10&255;r23=r15&15;r24=r22+r23&255;r25=r19+(r1+12)|0;HEAP8[r25]=r24;return;break};case 1:{r26=(r15&255)>>>4;r27=r26*10&255;r28=r15&15;r29=r27+r28&255;r30=r19+(r1+14)|0;HEAP8[r30]=r29;return;break};case 2:{r31=(r15&255)>>>4;r32=r31*10&255;r33=r15&15;r34=r32+r33&255;r35=r19+(r1+16)|0;HEAP8[r35]=r34;return;break};case 3:{r36=(r15&255)>>>4;r37=r36*10&255;r38=r15&15;r39=r37+r38&255;r40=r19+(r1+18)|0;HEAP8[r40]=r39;return;break};case 4:{r41=(r15&255)>>>4;r42=r41*10&255;r43=r15&15;r44=r42+r43&255;r45=r19+(r1+20)|0;HEAP8[r45]=r44;return;break};case 5:{r46=(r15&255)>>>4;r47=r46*10&255;r48=r15&15;r49=r47+r48&255;r50=r19+(r1+22)|0;HEAP8[r50]=r49;return;break};case 6:{r51=(r15&255)>>>4;r52=r51*10&255;r53=r15&15;r54=r53-1&255;r55=r54+r52&255;r56=r19+(r1+24)|0;HEAP8[r56]=r55;return;break};case 7:{r57=(r15&255)>>>4;r58=r57*10&255;r59=r15&15;r60=r59-1&255;r61=r60+r58&255;r62=r19+(r1+26)|0;HEAP8[r62]=r61;return;break};default:{return}}}else if((r5|0)==160){r63=r1|0;HEAP8[r63]=1;r64=r1+2|0;r65=HEAP16[r64>>1];r66=r65&65535;L29:do{if((r66|0)==20){r67=0}else if((r66|0)==16){r68=r1+28|0;r69=HEAP8[r68];HEAP8[r68]=0;r70=r1+40|0;r71=HEAP8[r70];r72=r71<<24>>24==0;if(!r72){HEAP8[r70]=0;r73=r1+48|0;r74=HEAP32[r73>>2];r75=(r74|0)==0;if(!r75){r76=r1+44|0;r77=HEAP32[r76>>2];FUNCTION_TABLE[r74](r77,0);r67=r69}else{r67=r69}}else{r67=r69}}else{r78=r66>>>3;r79=r78&1;r80=r66&247;switch(r80|0){case 4:{r81=r79+(r1+20)|0;r82=HEAP8[r81];r83=(r82&255)/10&-1;r84=r83<<4;r85=(r82&255)%10&-1;r86=r84|r85;r67=r86;break L29;break};case 5:{r87=r79+(r1+22)|0;r88=HEAP8[r87];r89=(r88&255)/10&-1;r90=r89<<4;r91=(r88&255)%10&-1;r92=r90|r91;r67=r92;break L29;break};case 6:{r93=r79+(r1+24)|0;r94=HEAP8[r93];r95=r94+1&255;r96=(r95&255)/10&-1;r97=r96<<4;r98=(r95&255)%10&-1;r99=r97|r98;r67=r99;break L29;break};case 7:{r100=r79+(r1+26)|0;r101=HEAP8[r100];r102=r101+1&255;r103=(r102&255)/10&-1;r104=r103<<4;r105=(r102&255)%10&-1;r106=r104|r105;r67=r106;break L29;break};case 0:{r107=r79+(r1+12)|0;r108=HEAP8[r107];r109=(r108&255)/10&-1;r110=r109<<4;r111=(r108&255)%10&-1;r112=r110|r111;r67=r112;break L29;break};case 3:{r113=r79+(r1+18)|0;r114=HEAP8[r113];r115=(r114&255)/10&-1;r116=r115<<4;r117=(r114&255)%10&-1;r118=r116|r117;r67=r118;break L29;break};case 1:{r119=r79+(r1+14)|0;r120=HEAP8[r119];r121=(r120&255)/10&-1;r122=r121<<4;r123=(r120&255)%10&-1;r124=r122|r123;r67=r124;break L29;break};case 2:{r125=r79+(r1+16)|0;r126=HEAP8[r125];r127=(r126&255)/10&-1;r128=r127<<4;r129=(r126&255)%10&-1;r130=r128|r129;r67=r130;break L29;break};default:{r67=0;break L29}}}}while(0);r131=r1+1|0;HEAP8[r131]=r67;return}else if((r5|0)==128){r132=r1|0;HEAP8[r132]=0;r133=r2&255;r134=r133&31;r135=r1+2|0;HEAP16[r135>>1]=r134;return}else{return}}function _rc759_rtc_set_data(r1,r2){HEAP8[r1+5|0]=r2;return}function _rc759_rtc_clock(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r1+8|0;r4=HEAP32[r3>>2]+r2|0;HEAP32[r3>>2]=r4;r2=HEAP32[r1+36>>2];if(r4>>>0<r2>>>0){return}HEAP32[r3>>2]=r4-r2;r2=r1+12|0;r4=HEAP8[r2];r3=r4+1&255;HEAP8[r2]=r3;if((r3&255)<100){return}HEAP8[r2]=r4-99;r4=r1+14|0;r2=HEAP8[r4];r3=r2+1&255;HEAP8[r4]=r3;if((r3&255)<100){return}HEAP8[r4]=r2-99;r2=r1+16|0;r4=HEAP8[r2]+1&255;HEAP8[r2]=r4;r3=r1+29|0;if((HEAP8[r3]&4)!=0){r5=r1+28|0;HEAP8[r5]=HEAP8[r5]|4;r5=r1+40|0;if((HEAP8[r5]|0)!=1){HEAP8[r5]=1;r5=HEAP32[r1+48>>2];if((r5|0)!=0){FUNCTION_TABLE[r5](HEAP32[r1+44>>2],1);r6=HEAP8[r2]}else{r6=r4}}else{r6=r4}}else{r6=r4}if((r6&255)<60){return}HEAP8[r2]=r6-60;r6=r1+18|0;r2=HEAP8[r6]+1&255;HEAP8[r6]=r2;if((HEAP8[r3]&8)!=0){r4=r1+28|0;HEAP8[r4]=HEAP8[r4]|8;r4=r1+40|0;if((HEAP8[r4]|0)!=1){HEAP8[r4]=1;r4=HEAP32[r1+48>>2];if((r4|0)!=0){FUNCTION_TABLE[r4](HEAP32[r1+44>>2],1);r7=HEAP8[r6]}else{r7=r2}}else{r7=r2}}else{r7=r2}if((r7&255)<60){return}HEAP8[r6]=r7-60;r7=r1+20|0;r6=HEAP8[r7]+1&255;HEAP8[r7]=r6;if((HEAP8[r3]&16)!=0){r3=r1+28|0;HEAP8[r3]=HEAP8[r3]|16;r3=r1+40|0;if((HEAP8[r3]|0)!=1){HEAP8[r3]=1;r3=HEAP32[r1+48>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+44>>2],1);r8=HEAP8[r7]}else{r8=r6}}else{r8=r6}}else{r8=r6}if((r8&255)<24){return}HEAP8[r7]=r8-24;r8=r1+22|0;HEAP8[r8]=HEAP8[r8]+1;r8=r1+24|0;HEAP8[r8]=HEAP8[r8]+1;return}function _rc759_spk_init(r1){var r2;HEAP32[r1>>2]=0;HEAP8[r1+4|0]=0;HEAP8[r1+5|0]=0;HEAP32[r1+8>>2]=0;r2=r1+6|0;HEAP16[r2>>1]=-32768;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=0;HEAP32[r1+20>>2]=32768;HEAP32[r1+24>>2]=44100;HEAP32[r1+28>>2]=1e6;HEAP32[r1+32>>2]=0;_snd_iir2_init(r1+36|0);HEAP32[r1+84>>2]=0;HEAP16[r1+2136>>1]=0;HEAP16[r1+2138>>1]=-16385;HEAP16[r1+2140>>1]=16385;HEAP16[r2>>1]=16385;return}function _rc759_spk_set_volume(r1,r2){var r3;r3=r2>>>0>1e3?32767:((r2*32767&-1)>>>0)/1e3&-1;HEAP16[r1+2136>>1]=0;HEAP16[r1+2138>>1]=r3+32768;HEAP16[r1+2140>>1]=32768-r3;return}function _rc759_spk_set_clk_fct(r1,r2,r3){HEAP32[r1+2144>>2]=r2;HEAP32[r1+2148>>2]=r3;return}function _rc759_spk_set_input_clock(r1,r2){HEAP32[r1+28>>2]=r2;return}function _rc759_spk_set_driver(r1,r2,r3){var r4,r5,r6;r4=r1|0;r5=HEAP32[r4>>2];if((r5|0)!=0){_snd_close(r5)}r5=_snd_open(r2);HEAP32[r4>>2]=r5;if((r5|0)==0){r6=1;return r6}HEAP32[r1+24>>2]=r3;if((_snd_set_params(r5,1,r3,1)|0)==0){r6=0;return r6}_snd_close(HEAP32[r4>>2]);HEAP32[r4>>2]=0;r6=1;return r6}function _rc759_spk_set_lowpass(r1,r2){HEAP32[r1+32>>2]=r2;_snd_iir2_set_lowpass(r1+36|0,r2,HEAP32[r1+24>>2]);return}function _rc759_spk_set_out(r1,r2){_rc759_spk_check(r1);HEAP8[r1+5|0]=r2<<24>>24!=0|0;return}function _rc759_spk_check(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=HEAP16[((HEAP8[r1+5|0]|0)==0?r1+2140|0:r1+2138|0)>>1];r3=FUNCTION_TABLE[HEAP32[r1+2148>>2]](HEAP32[r1+2144>>2]);r4=r1+12|0;r5=HEAP32[r4>>2];r6=r3-r5|0;HEAP32[r4>>2]=r3;r4=r1+4|0;r7=r1+6|0;r8=r2&65535;r9=(HEAP16[r7>>1]|0)==r2<<16>>16;if((HEAP8[r4]|0)==0){if(r9){return}HEAP8[r4]=1;HEAP16[r7>>1]=-32768;HEAP32[r1+8>>2]=0;HEAP32[r1+20>>2]=32768;HEAP32[r1+16>>2]=0;r10=HEAP32[r1+24>>2]>>>3;r11=r1|0;if((HEAP32[r11>>2]|0)==0){return}r12=r1+84|0;r13=HEAP32[r12>>2];if((r10|0)==0){r14=r13}else{r15=r1+88|0;r16=r1+32|0;r17=r1+36|0;r18=r10;r10=r13;while(1){r13=r10+1|0;HEAP16[r1+88+(r10<<1)>>1]=0;if(r13>>>0>1023){if((HEAP32[r16>>2]|0)!=0){_snd_iir2_filter(r17,r15,r15,r13,1,1)}_snd_write(HEAP32[r11>>2],r15,r13);r19=0}else{r19=r13}r13=r18-1|0;if((r13|0)==0){r14=r19;break}else{r18=r13;r10=r19}}}HEAP32[r12>>2]=r14;return}if(r9){r9=r1+8|0;r14=HEAP32[r9>>2]+r6|0;HEAP32[r9>>2]=r14;if(r14>>>0>HEAP32[r1+28>>2]>>>0){HEAP8[r4]=0;r4=r1+84|0;r14=HEAP32[r4>>2];if((r14|0)==0){return}r9=r1+88|0;r12=r1+36|0;if((HEAP32[r1+32>>2]|0)!=0){_snd_iir2_filter(r12,r9,r9,r14,1,1)}_snd_write(HEAP32[r1>>2],r9,r14);_snd_iir2_reset(r12);HEAP32[r4>>2]=0;return}}else{HEAP16[r7>>1]=r2;HEAP32[r1+8>>2]=r6}r2=r1+20|0;r7=HEAP32[r2>>2];if((r3|0)==(r5|0)){r20=r7}else{r5=r1+24|0;r3=r1+16|0;r4=r1+28|0;r12=r1|0;r14=r1+84|0;r9=r1+88|0;r19=r1+32|0;r10=r1+36|0;r18=r7;r7=r6;r6=HEAP32[r3>>2];r15=HEAP32[r4>>2];while(1){r11=((r18*63&-1)+r8|0)>>>6;r17=r6+HEAP32[r5>>2]|0;HEAP32[r3>>2]=r17;if(r17>>>0<r15>>>0){r21=r17;r22=r15}else{if((HEAP32[r12>>2]|0)==0){r23=r15;r24=r17}else{r17=HEAP32[r14>>2];r16=r17+1|0;HEAP16[r1+88+(r17<<1)>>1]=r11^32768;if(r16>>>0>1023){if((HEAP32[r19>>2]|0)!=0){_snd_iir2_filter(r10,r9,r9,r16,1,1)}_snd_write(HEAP32[r12>>2],r9,r16);r25=0}else{r25=r16}HEAP32[r14>>2]=r25;r23=HEAP32[r4>>2];r24=HEAP32[r3>>2]}r16=r24-r23|0;HEAP32[r3>>2]=r16;r21=r16;r22=r23}r16=r7-1|0;if((r16|0)==0){r20=r11;break}else{r18=r11;r7=r16;r6=r21;r15=r22}}}HEAP32[r2>>2]=r20;return}function _rc759_spk_clock(r1,r2){_rc759_spk_check(r1);return}function _e82730_init(r1){var r2;HEAP8[r1|0]=0;HEAP32[r1+4>>2]=0;HEAP32[r1+8>>2]=0;HEAP32[r1+12>>2]=851968;HEAP8[r1+20|0]=0;HEAP8[r1+21|0]=0;HEAP8[r1+22|0]=1;HEAP32[r1+88>>2]=1048575;HEAP32[r1+136>>2]=r1+144;HEAP32[r1+140>>2]=r1+676;HEAP32[r1+104>>2]=7032;r2=r1+108|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r1+96>>2]=1;HEAP32[r1+100>>2]=1;HEAP32[r1+132>>2]=0;HEAP32[r1+1268>>2]=0;HEAP32[r1+1272>>2]=0;r2=r1+1240|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP8[r2+24|0]=0;return}function _e82730_set_getmem_fct(r1,r2,r3,r4){HEAP32[r1+1252>>2]=r2;HEAP32[r1+1256>>2]=r3;HEAP32[r1+1260>>2]=r4;return}function _e82730_set_setmem_fct(r1,r2,r3,r4){HEAP32[r1+1240>>2]=r2;HEAP32[r1+1244>>2]=r3;HEAP32[r1+1248>>2]=r4;return}function _e82730_set_sint_fct(r1,r2,r3){HEAP32[r1+1268>>2]=r2;HEAP32[r1+1272>>2]=r3;return}function _e82730_set_clock(r1,r2,r3){HEAP32[r1+96>>2]=r2;HEAP32[r1+100>>2]=r3;return}function _e82730_set_terminal(r1,r2){HEAP32[r1+132>>2]=r2;return}function _e82730_set_monochrome(r1,r2){var r3;r3=(r2|0)!=0;HEAP8[r1+21|0]=r3&1;HEAP32[r1+104>>2]=r3?6968:7032;return}function _e82730_set_graphic(r1,r2){HEAP8[r1+20|0]=(r2|0)!=0|0;return}function _e82730_set_min_h(r1,r2){var r3,r4,r5,r6,r7;HEAP32[r1+124>>2]=r2;r3=HEAPU16[r1+36>>1]-HEAPU16[r1+34>>1]|0;r4=r3<<4;r5=HEAPU16[r1+42>>1]-HEAPU16[r1+40>>1]+64|0;r6=r5>>>0<r2>>>0?r2:r5;r5=Math_imul(r3*48&-1,r6)|0;r3=r1+112|0;do{if((HEAP32[r3>>2]|0)!=(r5|0)){r2=r1+108|0;r7=_realloc(HEAP32[r2>>2],r5);if((r7|0)==0){return}else{HEAP32[r2>>2]=r7;HEAP32[r3>>2]=r5;break}}}while(0);HEAP32[r1+116>>2]=r4;HEAP32[r1+120>>2]=r6;HEAP32[r1+128>>2]=0;return}function _e82730_reset(r1){var r2;HEAP8[r1|0]=0;HEAP32[r1+4>>2]=0;HEAP32[r1+8>>2]=0;HEAP16[r1+16>>1]=-1;HEAP8[r1+22|0]=1;HEAP8[r1+23|0]=0;HEAP8[r1+28|0]=0;HEAP8[r1+29|0]=0;HEAP8[r1+30|0]=0;HEAP8[r1+50|0]=0;HEAP8[r1+52|0]=0;r2=r1+45|0;tempBigInt=0;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;HEAP8[r1+54|0]=-1;HEAP8[r1+56|0]=-1;HEAP8[r1+58|0]=-1;HEAP8[r1+60|0]=-1;HEAP8[r1+49|0]=0;HEAP8[r1+51|0]=0;HEAP8[r1+53|0]=0;HEAP8[r1+55|0]=-1;HEAP8[r1+57|0]=-1;HEAP8[r1+59|0]=-1;HEAP8[r1+61|0]=-1;HEAP16[r1+62>>1]=0;HEAP16[r1+64>>1]=2;HEAP16[r1+66>>1]=28;HEAP16[r1+18>>1]=0;HEAP32[r1+80>>2]=0;r2=r1+136|0;HEAP8[HEAP32[r2>>2]|0]=0;HEAP16[HEAP32[r2>>2]+2>>1]=0;r2=r1+140|0;HEAP8[HEAP32[r2>>2]|0]=0;HEAP16[HEAP32[r2>>2]+2>>1]=0;_memset(r1+1208|0,112,31)|0;HEAP32[r1+116>>2]=0;HEAP32[r1+120>>2]=0;HEAP32[r1+128>>2]=0;r2=r1+1264|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+1272>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+1268>>2],0);return}function _e82730_set_palette(r1,r2,r3){if(r2>>>0>=64){return}HEAP8[r2+(r1+1208)|0]=r3;return}function _e82730_get_palette(r1,r2){var r3;if(r2>>>0<64){r3=HEAP8[r2+(r1+1208)|0]}else{r3=0}return r3}function _e82730_set_ca(r1){HEAP8[r1+30|0]=1;if((HEAP16[r1+18>>1]&128)!=0){return}_e82730_check_ca(r1);return}function _e82730_check_ca(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489;r2=0;r3=r1+30|0;r4=HEAP8[r3];r5=r4<<24>>24==0;if(r5){return}HEAP8[r3]=0;r6=r1+22|0;r7=HEAP8[r6];r8=r7<<24>>24==0;if(r8){r9=r1+8|0;r10=r1+1256|0;r11=r9;r12=r10}else{HEAP8[r6]=0;r13=r1+1256|0;r14=HEAP32[r13>>2];r15=(r14|0)==0;if(r15){r16=0}else{r17=r1+1252|0;r18=HEAP32[r17>>2];r19=r1+88|0;r20=HEAP32[r19>>2];r21=r20&-10;r22=FUNCTION_TABLE[r14](r18,r21);r16=r22}r23=r1|0;HEAP8[r23]=r16;r24=r1+1260|0;r25=HEAP32[r24>>2];r26=(r25|0)==0;if(r26){r27=0}else{r28=r1+1252|0;r29=HEAP32[r28>>2];r30=r1+88|0;r31=HEAP32[r30>>2];r32=r31&-4;r33=FUNCTION_TABLE[r25](r29,r32);r34=r33&65535;r35=HEAP32[r24>>2];r36=HEAP32[r28>>2];r37=HEAP32[r30>>2];r38=r37&-2;r39=FUNCTION_TABLE[r35](r36,r38);r40=r39&65535;r41=r40<<16;r42=r41|r34;r27=r42}r43=r1+4|0;HEAP32[r43>>2]=r27;r44=HEAP32[r13>>2];r45=(r44|0)==0;if(r45){r46=0;r47=r27}else{r48=r1+1252|0;r49=HEAP32[r48>>2];r50=r1+88|0;r51=HEAP32[r50>>2];r52=r51&r27;r53=FUNCTION_TABLE[r44](r49,r52);r54=HEAP32[r43>>2];r46=r53;r47=r54}HEAP8[r23]=r46;r55=HEAP32[r24>>2];r56=(r55|0)==0;if(r56){r57=0}else{r58=r47+2|0;r59=r1+1252|0;r60=HEAP32[r59>>2];r61=r1+88|0;r62=HEAP32[r61>>2];r63=r62&r58;r64=FUNCTION_TABLE[r55](r60,r63);r65=r64&65535;r66=HEAP32[r24>>2];r67=HEAP32[r59>>2];r68=r47+4|0;r69=HEAP32[r61>>2];r70=r69&r68;r71=FUNCTION_TABLE[r66](r67,r70);r72=r71&65535;r73=r72<<16;r74=r73|r65;r57=r74}r75=r1+8|0;HEAP32[r75>>2]=r57;r11=r75;r12=r13}r76=HEAP32[r12>>2];r77=(r76|0)==0;if(!r77){r78=HEAP32[r11>>2];r79=r78+1|0;r80=r1+1252|0;r81=HEAP32[r80>>2];r82=r1+88|0;r83=HEAP32[r82>>2];r84=r83&r79;r85=FUNCTION_TABLE[r76](r81,r84);r86=r85<<24>>24==5;if(r86){r87=HEAP32[r11>>2];r88=r1+1260|0;r89=HEAP32[r88>>2];r90=(r89|0)==0;if(r90){r91=0}else{r92=r87+14|0;r93=HEAP32[r80>>2];r94=HEAP32[r82>>2];r95=r94&r92;r96=FUNCTION_TABLE[r89](r93,r95);r97=r96&65535;r98=HEAP32[r88>>2];r99=HEAP32[r80>>2];r100=r87+16|0;r101=HEAP32[r82>>2];r102=r101&r100;r103=FUNCTION_TABLE[r98](r99,r102);r104=r103&65535;r105=r104<<16;r106=r105|r97;r91=r106}HEAP32[r11>>2]=r91;r107=HEAP32[r12>>2];r108=(r107|0)==0;if(r108){r109=0}else{r110=r91+1|0;r111=HEAP32[r80>>2];r112=HEAP32[r82>>2];r113=r112&r110;r114=FUNCTION_TABLE[r107](r111,r113);r109=r114}}else{r109=r85}}else{r109=0}r115=r1+1260|0;r116=HEAP32[r115>>2];r117=(r116|0)==0;if(!r117){r118=HEAP32[r11>>2];r119=r118+2|0;r120=r1+1252|0;r121=HEAP32[r120>>2];r122=r1+88|0;r123=HEAP32[r122>>2];r124=r123&r119;r125=FUNCTION_TABLE[r116](r121,r124);r126=(r125&65535)>>>6;r127=r126&255;r128=(r125&65535)>>>7;r129=r128&255;r130=r127&1;r131=r129&1;r132=HEAP32[r115>>2];r133=r1+24|0;HEAP8[r133]=r130;r134=r1+25|0;HEAP8[r134]=r131;r135=(r132|0)==0;if(r135){r136=0}else{r137=HEAP32[r11>>2];r138=r137+4|0;r139=r1+1252|0;r140=HEAP32[r139>>2];r141=r1+88|0;r142=HEAP32[r141>>2];r143=r142&r138;r144=FUNCTION_TABLE[r132](r140,r143);r145=r144&255;r136=r145}}else{r146=r1+24|0;HEAP8[r146]=0;r147=r1+25|0;HEAP8[r147]=0;r136=0}r148=r1+26|0;HEAP16[r148>>1]=r136;r149=r109&255;switch(r149|0){case 1:{r150=r1+23|0;r151=HEAP8[r150];r152=r151<<24>>24==0;if(!r152){r153=r1+18|0;r154=HEAP16[r153>>1];r155=r154|128;HEAP16[r153>>1]=r155}break};case 3:{r156=r1+18|0;r157=HEAP16[r156>>1];r158=r157&-385;HEAP16[r156>>1]=r158;break};case 4:{r159=HEAP32[r11>>2];r160=HEAP32[r115>>2];r161=(r160|0)==0;if(!r161){r162=r159+30|0;r163=r1+1252|0;r164=HEAP32[r163>>2];r165=r1+88|0;r166=HEAP32[r165>>2];r167=r166&r162;r168=FUNCTION_TABLE[r160](r164,r167);r169=r168&65535;r170=HEAP32[r115>>2];r171=HEAP32[r163>>2];r172=r159+32|0;r173=HEAP32[r165>>2];r174=r173&r172;r175=FUNCTION_TABLE[r170](r171,r174);r176=r175&65535;r177=r176<<16;r178=r177|r169;r179=HEAP32[r115>>2];r180=(r179|0)==0;if(!r180){r181=r178+2|0;r182=HEAP32[r163>>2];r183=HEAP32[r165>>2];r184=r183&r181;r185=FUNCTION_TABLE[r179](r182,r184);r186=(r185&65535)>>>8;r187=HEAP32[r115>>2];r188=r1+32|0;HEAP16[r188>>1]=r186;r189=(r187|0)==0;if(r189){r190=0;r191=0;r192=r178}else{r193=r178+4|0;r194=HEAP32[r163>>2];r195=HEAP32[r165>>2];r196=r195&r193;r197=FUNCTION_TABLE[r187](r194,r196);r198=HEAP32[r115>>2];r190=r197;r191=r198;r192=r178}}else{r199=r178;r2=29}}else{r199=0;r2=29}if(r2==29){r200=r1+32|0;HEAP16[r200>>1]=0;r190=0;r191=0;r192=r199}r201=(r190&65535)>>>8;r202=r1+34|0;HEAP16[r202>>1]=r201;r203=r190&255;r204=r1+36|0;HEAP16[r204>>1]=r203;r205=(r191|0)==0;if(!r205){r206=r192+10|0;r207=r1+1252|0;r208=HEAP32[r207>>2];r209=r1+88|0;r210=HEAP32[r209>>2];r211=r210&r206;r212=FUNCTION_TABLE[r191](r208,r211);r213=r212&255;r214=(r212&65535)>>>10;r215=r214&255;r216=r213&31;r217=r215&1;r218=HEAP32[r115>>2];r219=r1+44|0;HEAP8[r219]=r216;r220=r1+45|0;HEAP8[r220]=r217;r221=(r218|0)==0;if(!r221){r222=r192+18|0;r223=HEAP32[r207>>2];r224=HEAP32[r209>>2];r225=r224&r222;r226=FUNCTION_TABLE[r218](r223,r225);r227=r226&255;r228=(r226&65535)>>>8;r229=r228&255;r230=r229&31;r231=r227&31;r232=HEAP32[r115>>2];r233=r1+58|0;HEAP8[r233]=r230;r234=r1+60|0;HEAP8[r234]=r231;r235=(r232|0)==0;if(!r235){r236=r192+20|0;r237=HEAP32[r207>>2];r238=HEAP32[r209>>2];r239=r238&r236;r240=FUNCTION_TABLE[r232](r237,r239);r241=r240&255;r242=(r240&65535)>>>8;r243=r242&255;r244=r243&31;r245=r241&31;r246=HEAP32[r115>>2];r247=r1+59|0;HEAP8[r247]=r244;r248=r1+61|0;HEAP8[r248]=r245;r249=(r246|0)==0;if(!r249){r250=r192+26|0;r251=HEAP32[r207>>2];r252=HEAP32[r209>>2];r253=r252&r250;r254=FUNCTION_TABLE[r246](r251,r253);r255=r254&2047;r256=HEAP32[r115>>2];r257=r1+38|0;HEAP16[r257>>1]=r255;r258=(r256|0)==0;if(!r258){r259=r192+30|0;r260=HEAP32[r207>>2];r261=HEAP32[r209>>2];r262=r261&r259;r263=FUNCTION_TABLE[r256](r260,r262);r264=r263&2047;r265=HEAP32[r115>>2];r266=r1+40|0;HEAP16[r266>>1]=r264;r267=(r265|0)==0;if(!r267){r268=r192+32|0;r269=HEAP32[r207>>2];r270=HEAP32[r209>>2];r271=r270&r268;r272=FUNCTION_TABLE[r265](r269,r271);r273=r272&2047;r274=HEAP32[r115>>2];r275=r1+42|0;HEAP16[r275>>1]=r273;r276=(r274|0)==0;if(r276){r277=0;r278=0;r279=r266;r280=r275}else{r281=r192+38|0;r282=HEAP32[r207>>2];r283=HEAP32[r209>>2];r284=r283&r281;r285=FUNCTION_TABLE[r274](r282,r284);r286=HEAP32[r115>>2];r277=r285;r278=r286;r279=r266;r280=r275}}else{r287=r266;r2=43}}else{r2=41}}else{r2=39}}else{r2=37}}else{r2=35}}else{r288=r1+44|0;HEAP8[r288]=0;r289=r1+45|0;HEAP8[r289]=0;r2=35}if(r2==35){r290=r1+58|0;HEAP8[r290]=0;r291=r1+60|0;HEAP8[r291]=0;r2=37}if(r2==37){r292=r1+59|0;HEAP8[r292]=0;r293=r1+61|0;HEAP8[r293]=0;r2=39}if(r2==39){r294=r1+38|0;HEAP16[r294>>1]=0;r2=41}if(r2==41){r295=r1+40|0;HEAP16[r295>>1]=0;r287=r295;r2=43}if(r2==43){r296=r1+42|0;HEAP16[r296>>1]=0;r277=0;r278=0;r279=r287;r280=r296}r297=r277&255;r298=r297&15;r299=r1+28|0;HEAP8[r299]=r298;r300=(r277&65535)>>>6;r301=r300&124;r302=r1+66|0;HEAP16[r302>>1]=r301;r303=(r277&65535)>>>13;r304=r1+64|0;HEAP16[r304>>1]=r303;r305=(r278|0)==0;if(!r305){r306=r192+40|0;r307=r1+1252|0;r308=HEAP32[r307>>2];r309=r1+88|0;r310=HEAP32[r309>>2];r311=r310&r306;r312=FUNCTION_TABLE[r278](r308,r311);r313=r312&255;r314=(r312&65535)>>>1;r315=r314&255;r316=r313&1;r317=r315&1;r318=HEAP32[r115>>2];r319=r1+52|0;HEAP8[r319]=r316;r320=r1+53|0;HEAP8[r320]=r317;r321=(r318|0)==0;if(r321){r322=0;r323=0;r324=0;r325=0}else{r326=r192+42|0;r327=HEAP32[r307>>2];r328=HEAP32[r309>>2];r329=r328&r326;r330=FUNCTION_TABLE[r318](r327,r329);r331=r330&255;r332=(r330&65535)>>>1;r333=r332&255;r334=(r330&65535)>>>2;r335=r334&255;r336=(r330&65535)>>>3;r337=r336&255;r338=r331&1;r339=r333&1;r340=r335&1;r341=r337&1;r322=r341;r323=r340;r324=r339;r325=r338}}else{r342=r1+52|0;HEAP8[r342]=0;r343=r1+53|0;HEAP8[r343]=0;r322=0;r323=0;r324=0;r325=0}r344=r1+48|0;HEAP8[r344]=r325;r345=r1+49|0;HEAP8[r345]=r324;r346=r1+50|0;HEAP8[r346]=r323;r347=r1+51|0;HEAP8[r347]=r322;r348=HEAP16[r204>>1];r349=r348&65535;r350=HEAP16[r202>>1];r351=r350&65535;r352=r349-r351|0;r353=r352<<4;r354=HEAP16[r280>>1];r355=r354&65535;r356=HEAP16[r279>>1];r357=r356&65535;r358=r355-r357|0;r359=r358+64|0;r360=r1+124|0;r361=HEAP32[r360>>2];r362=r359>>>0<r361>>>0;r363=r362?r361:r359;r364=r352*48&-1;r365=Math_imul(r364,r363)|0;r366=r1+112|0;r367=HEAP32[r366>>2];r368=(r367|0)==(r365|0);if(!r368){r369=r1+108|0;r370=HEAP32[r369>>2];r371=_realloc(r370,r365);r372=(r371|0)==0;if(!r372){HEAP32[r369>>2]=r371;HEAP32[r366>>2]=r365;r2=53}}else{r2=53}if(r2==53){r373=r1+116|0;HEAP32[r373>>2]=r353;r374=r1+120|0;HEAP32[r374>>2]=r363;r375=r1+128|0;HEAP32[r375>>2]=0}r376=r1+23|0;HEAP8[r376]=1;break};case 5:{r377=HEAP32[r11>>2];r378=HEAP32[r115>>2];r379=(r378|0)==0;if(r379){r380=0}else{r381=r377+14|0;r382=r1+1252|0;r383=HEAP32[r382>>2];r384=r1+88|0;r385=HEAP32[r384>>2];r386=r385&r381;r387=FUNCTION_TABLE[r378](r383,r386);r388=r387&65535;r389=HEAP32[r115>>2];r390=HEAP32[r382>>2];r391=r377+16|0;r392=HEAP32[r384>>2];r393=r392&r391;r394=FUNCTION_TABLE[r389](r390,r393);r395=r394&65535;r396=r395<<16;r397=r396|r388;r380=r397}HEAP32[r11>>2]=r380;break};case 6:{r398=HEAP32[r115>>2];r399=(r398|0)==0;if(r399){r400=0}else{r401=HEAP32[r11>>2];r402=r401+22|0;r403=r1+1252|0;r404=HEAP32[r403>>2];r405=r1+88|0;r406=HEAP32[r405>>2];r407=r406&r402;r408=FUNCTION_TABLE[r398](r404,r407);r400=r408}r409=r1+16|0;HEAP16[r409>>1]=r400;break};case 8:{r410=r1+1248|0;r411=HEAP32[r410>>2];r412=(r411|0)==0;if(!r412){r413=r1+18|0;r414=HEAP32[r11>>2];r415=HEAP16[r413>>1];r416=r414+18|0;r417=r1+1240|0;r418=HEAP32[r417>>2];r419=r1+88|0;r420=HEAP32[r419>>2];r421=r420&r416;FUNCTION_TABLE[r411](r418,r421,r415)}break};case 9:{r422=HEAP32[r115>>2];r423=(r422|0)==0;if(!r423){r424=HEAP32[r11>>2];r425=r424+26|0;r426=r1+1252|0;r427=HEAP32[r426>>2];r428=r1+88|0;r429=HEAP32[r428>>2];r430=r429&r425;r431=FUNCTION_TABLE[r422](r427,r430);r432=HEAP32[r115>>2];r433=(r432|0)==0;r434=r431&255;r435=(r431&65535)>>>8;r436=r435&255;if(r433){r437=0;r438=0;r439=r436;r440=r434}else{r441=HEAP32[r11>>2];r442=r441+28|0;r443=HEAP32[r426>>2];r444=HEAP32[r428>>2];r445=r444&r442;r446=FUNCTION_TABLE[r432](r443,r445);r447=r446&255;r448=(r446&65535)>>>8;r449=r448&255;r437=r449;r438=r447;r439=r436;r440=r434}}else{r437=0;r438=0;r439=0;r440=0}r450=r1+54|0;HEAP8[r450]=r440;r451=r1+56|0;HEAP8[r451]=r439;r452=r1+55|0;HEAP8[r452]=r438;r453=r1+57|0;HEAP8[r453]=r437;break};case 0:{break};default:{r454=r1+18|0;r455=HEAP16[r454>>1];r456=r455|32;HEAP16[r454>>1]=r456;r457=r1+16|0;r458=HEAP16[r457>>1];r459=r458^-385;r460=r456&-385;r461=r460&r459;r462=r1+1248|0;r463=HEAP32[r462>>2];r464=(r463|0)==0;if(!r464){r465=HEAP32[r11>>2];r466=r465+20|0;r467=r1+1240|0;r468=HEAP32[r467>>2];r469=r1+88|0;r470=HEAP32[r469>>2];r471=r470&r466;FUNCTION_TABLE[r463](r468,r471,r461)}r472=r461<<16>>16==0;if(!r472){r473=r1+1264|0;r474=HEAP8[r473];r475=r474<<24>>24==1;if(!r475){HEAP8[r473]=1;r476=r1+1272|0;r477=HEAP32[r476>>2];r478=(r477|0)==0;if(!r478){r479=r1+1268|0;r480=HEAP32[r479>>2];FUNCTION_TABLE[r477](r480,1)}}}}}r481=r1+1244|0;r482=HEAP32[r481>>2];r483=(r482|0)==0;if(r483){return}r484=HEAP32[r11>>2];r485=r1+1240|0;r486=HEAP32[r485>>2];r487=r1+88|0;r488=HEAP32[r487>>2];r489=r488&r484;FUNCTION_TABLE[r482](r486,r489,0);return}function _e82730_set_srst(r1){var r2;r2=r1+1264|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+1272>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+1268>>2],0);return}function _e82730_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558;r3=0;r4=r1+23|0;r5=HEAP8[r4];r6=r5<<24>>24==0;if(r6){return}r7=r1+96|0;r8=HEAP32[r7>>2];r9=Math_imul(r8,r2)|0;r10=r1+92|0;r11=HEAP32[r10>>2];r12=r11+r9|0;HEAP32[r10>>2]=r12;r13=r1+100|0;r14=HEAP32[r13>>2];r15=r1+32|0;r16=HEAP16[r15>>1];r17=r16&65535;r18=Math_imul(r17,r14)|0;r19=r12>>>0<r18>>>0;if(r19){return}r20=r1+18|0;r21=r1+68|0;r22=r1+40|0;r23=r1+8|0;r24=r1+25|0;r25=r1+1260|0;r26=r1+76|0;r27=r1+84|0;r28=r1+136|0;r29=r1+140|0;r30=r1+46|0;r31=r1+1252|0;r32=r1+88|0;r33=r1+38|0;r34=r1+120|0;r35=r1+128|0;r36=r1+124|0;r37=r1+108|0;r38=r1+116|0;r39=r1+132|0;r40=r1+31|0;r41=r1+62|0;r42=r1+66|0;r43=r1+29|0;r44=r1+28|0;r45=r1+16|0;r46=r1+1248|0;r47=r1+1264|0;r48=r1+1272|0;r49=r1+1268|0;r50=r1+1240|0;r51=r1+42|0;r52=r1+70|0;r53=r1+72|0;r54=r1+44|0;r55=r1+45|0;r56=r1+58|0;r57=r1+60|0;r58=r1+59|0;r59=r1+61|0;r60=r1+26|0;r61=r1+24|0;while(1){r62=HEAP16[r20>>1];r63=r62&128;r64=r63<<16>>16==0;L9:do{if(!r64){r65=HEAP32[r29>>2];r66=r65|0;r67=HEAP8[r66];r68=r67<<24>>24==0;if(r68){r69=HEAP8[r40];r70=r69<<24>>24==0;if(!r70){HEAP8[r66]=1;break}r71=r65+2|0;r72=r65+516|0;r73=HEAP32[r27>>2];r74=r73;L15:while(1){r75=HEAP32[r25>>2];r76=(r75|0)==0;L17:do{if(!r76){r77=HEAP32[r31>>2];r78=HEAP32[r32>>2];r79=r78&r74;r80=FUNCTION_TABLE[r75](r77,r79);r81=HEAP32[r27>>2];r82=r81+2|0;HEAP32[r27>>2]=r82;r83=r80<<16>>16>-1;if(!r83){r84=r80&65535;r85=r84&49152;r86=(r85|0)==49152;if(r86){r87=r82}else{r88=r84>>>8;switch(r88|0){case 128:{r3=14;break L15;break};case 129:{HEAP8[r40]=1;r87=r82;break L17;break};case 130:{r3=16;break L15;break};case 131:{r89=r84&255;r90=r89>>>0>7;if(r90){r87=r82;break L17}r91=(r89|0)==0;if(r91){r92=r82}else{r93=0;r94=r82;while(1){r95=HEAP32[r25>>2];r96=(r95|0)==0;if(r96){r97=0;r98=r94}else{r99=HEAP32[r31>>2];r100=HEAP32[r32>>2];r101=r100&r94;r102=FUNCTION_TABLE[r95](r99,r101);r103=HEAP32[r27>>2];r97=r102;r98=r103}r104=r65+518+(r93<<1)|0;HEAP16[r104>>1]=r97;r105=r98+2|0;HEAP32[r27>>2]=r105;r106=r93+1|0;r107=r106>>>0<r89>>>0;if(r107){r93=r106;r94=r105}else{r92=r105;break}}}r108=r89&65535;HEAP16[r72>>1]=r108;r87=r92;break L17;break};case 135:{r109=r80&255;HEAP16[r60>>1]=r109;r87=r82;break L17;break};case 136:{r110=HEAP32[r26>>2];r111=HEAP32[r25>>2];r112=(r111|0)==0;if(r112){r113=0;r114=r110}else{r115=HEAP32[r31>>2];r116=HEAP32[r32>>2];r117=r116&r110;r118=FUNCTION_TABLE[r111](r115,r117);r119=r118&65535;r120=HEAP32[r25>>2];r121=HEAP32[r31>>2];r122=r110+2|0;r123=HEAP32[r32>>2];r124=r123&r122;r125=FUNCTION_TABLE[r120](r121,r124);r126=r125&65535;r127=r126<<16;r128=r127|r119;r129=HEAP32[r26>>2];r113=r128;r114=r129}HEAP32[r27>>2]=r113;r130=r114+4|0;HEAP32[r26>>2]=r130;r87=r113;break L17;break};case 138:{r131=r84&255;r132=HEAP32[r25>>2];r133=(r132|0)==0;if(r133){r134=0;r135=r82}else{r136=HEAP32[r31>>2];r137=HEAP32[r32>>2];r138=r137&r82;r139=FUNCTION_TABLE[r132](r136,r138);r140=HEAP32[r27>>2];r134=r139;r135=r140}r141=r135+2|0;HEAP32[r27>>2]=r141;r142=(r131|0)==0;if(r142){r87=r141;break L17}r143=HEAP16[r71>>1];r144=r131;r145=r143;while(1){r146=r145+1&65535;HEAP16[r71>>1]=r146;r147=r145&65535;r148=r65+4+(r147<<1)|0;HEAP16[r148>>1]=r134;r149=HEAP16[r71>>1];r150=HEAP16[r60>>1];r151=(r149&65535)<(r150&65535);r152=r144-1|0;if(!r151){r3=35;break L15}r153=(r152|0)==0;if(r153){r87=r141;break}else{r144=r152;r145=r149}}break};case 142:{r154=HEAP32[r25>>2];r155=(r154|0)==0;if(r155){r156=0;r157=r82}else{r158=HEAP32[r31>>2];r159=HEAP32[r32>>2];r160=r159&r82;r161=FUNCTION_TABLE[r154](r158,r160);r162=HEAP32[r27>>2];r156=r161;r157=r162}HEAP16[r30>>1]=r156;r163=r157+2|0;HEAP32[r27>>2]=r163;r87=r163;break L17;break};default:{r87=r82;break L17}}}}else{r164=r80;r165=r82;r3=39}}else{r166=r74+2|0;HEAP32[r27>>2]=r166;r164=0;r165=r166;r3=39}}while(0);if(r3==39){r3=0;r167=HEAP16[r30>>1];r168=r167|r164;r169=HEAP16[r71>>1];r170=r169+1&65535;HEAP16[r71>>1]=r170;r171=r169&65535;r172=r65+4+(r171<<1)|0;HEAP16[r172>>1]=r168;r173=HEAP16[r71>>1];r174=HEAP16[r60>>1];r175=(r173&65535)>=(r174&65535);r176=(r173&65535)>200;r177=r175|r176;if(r177){HEAP8[r66]=1;r178=HEAP8[r61];r179=r178<<24>>24==0;if(!r179){break L9}r180=HEAP32[r26>>2];r181=HEAP32[r25>>2];r182=(r181|0)==0;if(r182){r183=0;r184=r180}else{r185=HEAP32[r31>>2];r186=HEAP32[r32>>2];r187=r186&r180;r188=FUNCTION_TABLE[r181](r185,r187);r189=r188&65535;r190=HEAP32[r25>>2];r191=HEAP32[r31>>2];r192=r180+2|0;r193=HEAP32[r32>>2];r194=r193&r192;r195=FUNCTION_TABLE[r190](r191,r194);r196=r195&65535;r197=r196<<16;r198=r197|r189;r199=HEAP32[r26>>2];r183=r198;r184=r199}HEAP32[r27>>2]=r183;r200=r184+4|0;HEAP32[r26>>2]=r200;r87=r183}else{r87=r165}}r201=HEAP8[r66];r202=r201<<24>>24==0;if(r202){r74=r87}else{break L9}}if(r3==14){r3=0;HEAP8[r66]=1;break}else if(r3==16){r3=0;r203=HEAP32[r26>>2];r204=HEAP32[r25>>2];r205=(r204|0)==0;if(r205){r206=0;r207=r203}else{r208=HEAP32[r31>>2];r209=HEAP32[r32>>2];r210=r209&r203;r211=FUNCTION_TABLE[r204](r208,r210);r212=r211&65535;r213=HEAP32[r25>>2];r214=HEAP32[r31>>2];r215=r203+2|0;r216=HEAP32[r32>>2];r217=r216&r215;r218=FUNCTION_TABLE[r213](r214,r217);r219=r218&65535;r220=r219<<16;r221=r220|r212;r222=HEAP32[r26>>2];r206=r221;r207=r222}HEAP32[r27>>2]=r206;r223=r207+4|0;HEAP32[r26>>2]=r223;HEAP8[r66]=1;break}else if(r3==35){r3=0;HEAP8[r66]=1;break}}}}while(0);r224=HEAP16[r21>>1];r225=r224&65535;r226=HEAP16[r22>>1];r227=(r224&65535)<(r226&65535);do{if(r227){r228=r224<<16>>16==0;if(r228){r229=HEAP32[r23>>2];r230=r229+6|0;r231=HEAP8[r24];r232=r231<<24>>24!=0;r233=r232?4:0;r234=r230+r233|0;r235=HEAP32[r25>>2];r236=(r235|0)==0;if(!r236){r237=HEAP32[r31>>2];r238=HEAP32[r32>>2];r239=r238&r234;r240=FUNCTION_TABLE[r235](r237,r239);r241=r240&65535;r242=HEAP32[r25>>2];r243=HEAP32[r31>>2];r244=r234+2|0;r245=HEAP32[r32>>2];r246=r245&r244;r247=FUNCTION_TABLE[r242](r243,r246);r248=r247&65535;r249=r248<<16;r250=r249|r241;r251=HEAP32[r25>>2];HEAP32[r26>>2]=r250;r252=(r251|0)==0;if(r252){r253=0;r254=r250}else{r255=HEAP32[r31>>2];r256=HEAP32[r32>>2];r257=r256&r250;r258=FUNCTION_TABLE[r251](r255,r257);r259=r258&65535;r260=HEAP32[r25>>2];r261=HEAP32[r31>>2];r262=r250+2|0;r263=HEAP32[r32>>2];r264=r263&r262;r265=FUNCTION_TABLE[r260](r261,r264);r266=r265&65535;r267=r266<<16;r268=r267|r259;r269=HEAP32[r26>>2];r253=r268;r254=r269}}else{HEAP32[r26>>2]=0;r253=0;r254=0}HEAP32[r27>>2]=r253;r270=r254+4|0;HEAP32[r26>>2]=r270;r271=HEAP32[r28>>2];r272=r271|0;HEAP8[r272]=0;r273=HEAP32[r28>>2];r274=r273+2|0;HEAP16[r274>>1]=0;r275=r273+516|0;HEAP16[r275>>1]=0;r276=HEAP32[r29>>2];r277=r276|0;HEAP8[r277]=0;r278=HEAP32[r29>>2];r279=r278+2|0;HEAP16[r279>>1]=0;r280=r278+516|0;HEAP16[r280>>1]=0;HEAP16[r30>>1]=0;r281=HEAP16[r20>>1];r282=r281&384;HEAP16[r20>>1]=r282}}else{r283=HEAP16[r51>>1];r284=r283&65535;r285=(r224&65535)<(r283&65535);if(r285){r286=r224<<16>>16==r226<<16>>16;if(r286){HEAP16[r52>>1]=0;HEAP16[r53>>1]=0;HEAP32[r35>>2]=0;r287=HEAP32[r28>>2];r288=HEAP32[r29>>2];HEAP32[r28>>2]=r288;HEAP32[r29>>2]=r287;r289=r288+516|0;r290=HEAP16[r289>>1];r291=r290<<16>>16==0;if(!r291){r292=r288+518|0;r293=HEAP16[r292>>1];r294=r293&255;r295=r294&31;HEAP8[r54]=r295;r296=HEAP16[r292>>1];r297=(r296&65535)>>>10;r298=r297&255;r299=r298&1;HEAP8[r55]=r299;r300=HEAP16[r289>>1];r301=(r300&65535)>4;if(r301){r302=r288+526|0;r303=HEAP16[r302>>1];r304=(r303&65535)>>>8;r305=r304&255;r306=r305&31;HEAP8[r56]=r306;r307=HEAP16[r302>>1];r308=r307&255;r309=r308&31;HEAP8[r57]=r309;r310=HEAP16[r289>>1];r311=(r310&65535)>5;if(r311){r312=r288+528|0;r313=HEAP16[r312>>1];r314=(r313&65535)>>>8;r315=r314&255;r316=r315&31;HEAP8[r58]=r316;r317=HEAP16[r312>>1];r318=r317&255;r319=r318&31;HEAP8[r59]=r319}}}HEAP16[r289>>1]=0;r320=r287|0;HEAP8[r320]=0;r321=HEAP32[r29>>2];r322=r321+2|0;HEAP16[r322>>1]=0;r323=r321+516|0;HEAP16[r323>>1]=0}_e82730_line(r1);r324=HEAP16[r53>>1];r325=r324+1&65535;HEAP16[r53>>1]=r325;r326=r325&65535;r327=HEAP8[r54];r328=r327&255;r329=r326>>>0>r328>>>0;if(!r329){break}r330=HEAP16[r52>>1];r331=r330+1&65535;HEAP16[r52>>1]=r331;HEAP16[r53>>1]=0;r332=HEAP32[r28>>2];r333=HEAP32[r29>>2];HEAP32[r28>>2]=r333;HEAP32[r29>>2]=r332;r334=r333+516|0;r335=HEAP16[r334>>1];r336=r335<<16>>16==0;if(!r336){r337=r333+518|0;r338=HEAP16[r337>>1];r339=r338&255;r340=r339&31;HEAP8[r54]=r340;r341=HEAP16[r337>>1];r342=(r341&65535)>>>10;r343=r342&255;r344=r343&1;HEAP8[r55]=r344;r345=HEAP16[r334>>1];r346=(r345&65535)>4;if(r346){r347=r333+526|0;r348=HEAP16[r347>>1];r349=(r348&65535)>>>8;r350=r349&255;r351=r350&31;HEAP8[r56]=r351;r352=HEAP16[r347>>1];r353=r352&255;r354=r353&31;HEAP8[r57]=r354;r355=HEAP16[r334>>1];r356=(r355&65535)>5;if(r356){r357=r333+528|0;r358=HEAP16[r357>>1];r359=(r358&65535)>>>8;r360=r359&255;r361=r360&31;HEAP8[r58]=r361;r362=HEAP16[r357>>1];r363=r362&255;r364=r363&31;HEAP8[r59]=r364}}}HEAP16[r334>>1]=0;r365=r332|0;HEAP8[r365]=0;r366=HEAP32[r29>>2];r367=r366+2|0;HEAP16[r367>>1]=0;r368=r366+516|0;HEAP16[r368>>1]=0;r369=HEAP16[r21>>1];r370=r369&65535;r371=HEAP16[r51>>1];r372=r371&65535;r373=r372-1|0;r374=(r370|0)==(r373|0);if(!r374){break}r375=r366|0;HEAP8[r375]=1;break}r376=r224<<16>>16==r283<<16>>16;if(r376){HEAP16[r53>>1]=0;HEAP8[r40]=0;r377=HEAP32[r23>>2];r378=HEAP32[r25>>2];r379=(r378|0)==0;if(r379){r380=0}else{r381=r377+34|0;r382=HEAP32[r31>>2];r383=HEAP32[r32>>2];r384=r383&r381;r385=FUNCTION_TABLE[r378](r382,r384);r386=r385&65535;r387=HEAP32[r25>>2];r388=HEAP32[r31>>2];r389=r377+36|0;r390=HEAP32[r32>>2];r391=r390&r389;r392=FUNCTION_TABLE[r387](r388,r391);r393=r392&65535;r394=r393<<16;r395=r394|r386;r380=r395}HEAP32[r27>>2]=r380;r396=HEAP32[r28>>2];r397=HEAP32[r29>>2];HEAP32[r28>>2]=r397;HEAP32[r29>>2]=r396;r398=r397+516|0;r399=HEAP16[r398>>1];r400=r399<<16>>16==0;if(!r400){r401=r397+518|0;r402=HEAP16[r401>>1];r403=r402&255;r404=r403&31;HEAP8[r54]=r404;r405=HEAP16[r401>>1];r406=(r405&65535)>>>10;r407=r406&255;r408=r407&1;HEAP8[r55]=r408;r409=HEAP16[r398>>1];r410=(r409&65535)>4;if(r410){r411=r397+526|0;r412=HEAP16[r411>>1];r413=(r412&65535)>>>8;r414=r413&255;r415=r414&31;HEAP8[r56]=r415;r416=HEAP16[r411>>1];r417=r416&255;r418=r417&31;HEAP8[r57]=r418;r419=HEAP16[r398>>1];r420=(r419&65535)>5;if(r420){r421=r397+528|0;r422=HEAP16[r421>>1];r423=(r422&65535)>>>8;r424=r423&255;r425=r424&31;HEAP8[r58]=r425;r426=HEAP16[r421>>1];r427=r426&255;r428=r427&31;HEAP8[r59]=r428}}}HEAP16[r398>>1]=0;r429=r396|0;HEAP8[r429]=0;r430=HEAP32[r29>>2];r431=r430+2|0;HEAP16[r431>>1]=0;r432=r430+516|0;HEAP16[r432>>1]=0;break}r433=HEAP8[r54];r434=r433&255;r435=r284+1|0;r436=r435+r434|0;r437=(r225|0)>(r436|0);if(!r437){r438=HEAP16[r53>>1];r439=r438<<16>>16==0;if(r439){r440=HEAP32[r28>>2];r441=HEAP32[r29>>2];HEAP32[r28>>2]=r441;HEAP32[r29>>2]=r440;r442=r441+516|0;r443=HEAP16[r442>>1];r444=r443<<16>>16==0;if(!r444){r445=r441+518|0;r446=HEAP16[r445>>1];r447=r446&255;r448=r447&31;HEAP8[r54]=r448;r449=HEAP16[r445>>1];r450=(r449&65535)>>>10;r451=r450&255;r452=r451&1;HEAP8[r55]=r452;r453=HEAP16[r442>>1];r454=(r453&65535)>4;if(r454){r455=r441+526|0;r456=HEAP16[r455>>1];r457=(r456&65535)>>>8;r458=r457&255;r459=r458&31;HEAP8[r56]=r459;r460=HEAP16[r455>>1];r461=r460&255;r462=r461&31;HEAP8[r57]=r462;r463=HEAP16[r442>>1];r464=(r463&65535)>5;if(r464){r465=r441+528|0;r466=HEAP16[r465>>1];r467=(r466&65535)>>>8;r468=r467&255;r469=r468&31;HEAP8[r58]=r469;r470=HEAP16[r465>>1];r471=r470&255;r472=r471&31;HEAP8[r59]=r472}}}HEAP16[r442>>1]=0;r473=r440|0;HEAP8[r473]=0;r474=HEAP32[r29>>2];r475=r474+2|0;HEAP16[r475>>1]=0;r476=r474+516|0;HEAP16[r476>>1]=0;r477=r474|0;HEAP8[r477]=1}_e82730_line(r1);r478=HEAP16[r53>>1];r479=r478+1&65535;HEAP16[r53>>1]=r479;r480=r479&65535;r481=HEAP8[r54];r482=r481&255;r483=r480>>>0>r482>>>0;if(r483){r484=HEAP16[r52>>1];r485=r484+1&65535;HEAP16[r52>>1]=r485;HEAP16[r53>>1]=0}}}}while(0);_e82730_check_ca(r1);r486=HEAP16[r21>>1];r487=r486+1&65535;HEAP16[r21>>1]=r487;r488=HEAP16[r33>>1];r489=(r487&65535)<(r488&65535);if(!r489){r490=HEAP32[r35>>2];r491=HEAP32[r36>>2];r492=r490>>>0<r491>>>0;L117:do{if(r492){r493=r490;r494=r491;while(1){r495=HEAP32[r34>>2];r496=r493>>>0<r495>>>0;if(!r496){r497=r493;break L117}r498=HEAP32[r38>>2];r499=(r498|0)==0;if(r499){r500=r493;r501=r494}else{r502=r493*3&-1;r503=Math_imul(r502,r498)|0;r504=HEAP32[r37>>2];r505=r504+r503|0;r506=r505;r507=0;while(1){r508=r506+1|0;HEAP8[r506]=0;r509=r506+2|0;HEAP8[r508]=0;r510=r506+3|0;HEAP8[r509]=0;r511=r507+1|0;r512=HEAP32[r38>>2];r513=r511>>>0<r512>>>0;if(r513){r506=r510;r507=r511}else{break}}r514=HEAP32[r35>>2];r515=HEAP32[r36>>2];r500=r514;r501=r515}r516=r500+1|0;HEAP32[r35>>2]=r516;r517=r516>>>0<r501>>>0;if(r517){r493=r516;r494=r501}else{r497=r516;break}}}else{r497=r490}}while(0);r518=HEAP32[r39>>2];r519=(r518|0)==0;if(!r519){r520=HEAP32[r38>>2];_trm_set_size(r518,r520,r497);r521=HEAP32[r39>>2];r522=HEAP32[r37>>2];r523=HEAP32[r35>>2];_trm_set_lines(r521,r522,0,r523);r524=HEAP32[r39>>2];_trm_update(r524)}HEAP16[r21>>1]=0;HEAP8[r40]=0;r525=HEAP16[r41>>1];r526=r525+1&65535;r527=HEAP16[r42>>1];r528=(r526&65535)<(r527&65535);r529=r528?r526:0;HEAP16[r41>>1]=r529;_e82730_check_ca(r1);r530=HEAP8[r43];r531=r530<<24>>24==0;if(!r531){r532=r530-1&255;HEAP8[r43]=r532;r533=r532<<24>>24==0;if(!r533){r534=HEAP16[r20>>1];r535=r534}else{r3=96}}else{r3=96}if(r3==96){r3=0;r536=HEAP16[r20>>1];r537=r536|8;HEAP16[r20>>1]=r537;r538=HEAP8[r44];HEAP8[r43]=r538;r535=r537}r539=HEAP16[r45>>1];r540=r539^-385;r541=r535&-385;r542=r541&r540;r543=HEAP32[r46>>2];r544=(r543|0)==0;if(!r544){r545=HEAP32[r23>>2];r546=r545+20|0;r547=HEAP32[r50>>2];r548=HEAP32[r32>>2];r549=r548&r546;FUNCTION_TABLE[r543](r547,r549,r542)}r550=r542<<16>>16==0;if(!r550){r551=HEAP8[r47];r552=r551<<24>>24==1;if(!r552){HEAP8[r47]=1;r553=HEAP32[r48>>2];r554=(r553|0)==0;if(!r554){r555=HEAP32[r49>>2];FUNCTION_TABLE[r553](r555,1)}}}}r556=HEAP32[r10>>2];r557=r556-r18|0;HEAP32[r10>>2]=r557;r558=r557>>>0<r18>>>0;if(r558){break}}return}function _e82730_line(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55;r2=0;r3=r1+128|0;r4=HEAP32[r3>>2];if(r4>>>0>=HEAP32[r1+120>>2]>>>0){return}r5=HEAP32[r1+136>>2];r6=r1+116|0;r7=HEAP32[r6>>2];r8=HEAP32[r1+108>>2]+Math_imul(r4*3&-1,r7)|0;L4:do{if((HEAP8[r5|0]|0)==0){if((r7|0)!=0){r9=r8;r10=0;r11=r4;while(1){r12=r9+1|0;if((r11&8)>>>0<8^(r10&8)>>>0<8){HEAP8[r9]=0;HEAP8[r12]=0;HEAP8[r9+2|0]=0}else{HEAP8[r9]=-128;HEAP8[r12]=-128;HEAP8[r9+2|0]=-128}r12=r10+1|0;if(r12>>>0>=HEAP32[r6>>2]>>>0){break L4}r9=r9+3|0;r10=r12;r11=HEAP32[r3>>2]}}}else{if((HEAP8[r1+45|0]|0)!=0){if((r7|0)==0){break}else{r13=r8;r14=0}while(1){HEAP8[r13]=0;HEAP8[r13+1|0]=0;HEAP8[r13+2|0]=0;r11=r14+1|0;if(r11>>>0<HEAP32[r6>>2]>>>0){r13=r13+3|0;r14=r11}else{break L4}}}r11=r1+104|0;r10=HEAP32[r11>>2];if((r7|0)!=0){r9=r5+2|0;r12=r1+1260|0;r15=r1+72|0;r16=r1+12|0;r17=r1+1252|0;r18=r1+88|0;r19=r1+20|0;r20=r1+56|0;r21=r1+70|0;r22=r1+54|0;r23=r1+58|0;r24=r1+60|0;r25=r1+52|0;r26=r1+64|0;r27=r1+66|0;r28=r1+62|0;r29=r1+57|0;r30=r1+55|0;r31=r1+59|0;r32=r1+61|0;r33=r1+53|0;r34=0;r35=0;r36=0;r37=0;r38=r10+60|0;r39=r10;r10=r8;while(1){if((r37|0)==0){if(r34>>>0<HEAPU16[r9>>1]>>>0){r40=HEAPU16[r5+4+(r34<<1)>>1];r41=HEAPU8[(r40>>>10&31)+(r1+1208)|0];r42=HEAP32[r11>>2];r43=HEAP32[r12>>2];if((r43|0)==0){r44=0}else{r44=FUNCTION_TABLE[r43](HEAP32[r17>>2],((HEAPU16[r15>>1]|r40<<4&16368)<<1)+HEAP32[r16>>2]&HEAP32[r18>>2])&65535}r45=r42+(r41<<2&60)|0;r46=r42+(r41>>>2&60)|0;r47=(r44<<1|65024)^-65026;r48=r44}else{r45=r39;r46=r38;r47=1;r48=0}r41=r34+1|0;r42=(HEAP8[r19]|0)==0?r47:1;r40=HEAPU16[r21>>1];if((HEAPU8[r20]|0)==(r40|0)?(HEAPU8[r22]|0)==(r34|0):0){r43=HEAPU16[r15>>1];if(r43>>>0>=HEAPU8[r23]>>>0?r43>>>0<=HEAPU8[r24]>>>0:0){if((HEAP8[r25]|0)!=0){r43=HEAP16[r26>>1];r49=(Math_imul(r43<<16>>16==0?4:r43&65535,HEAPU16[r27>>1])|0)>>>2;if(HEAPU16[r28>>1]>>>0>r49>>>0){r2=25}else{r50=1}}else{r50=1}}else{r2=25}}else{r2=25}if(r2==25){r2=0;if((HEAPU8[r29]|0)==(r40|0)?(HEAPU8[r30]|0)==(r34|0):0){r40=HEAPU16[r15>>1];if(r40>>>0>=HEAPU8[r31]>>>0?r40>>>0<=HEAPU8[r32]>>>0:0){if((HEAP8[r33]|0)==0){r50=1}else{r40=HEAP16[r26>>1];r49=(Math_imul(r40<<16>>16==0?4:r40&65535,HEAPU16[r27>>1])|0)>>>2;r50=HEAPU16[r28>>1]>>>0<=r49>>>0}}else{r50=0}}else{r50=0}}r51=r50?r46:r45;r52=r50?r45:r46;r53=r42;r54=r48;r55=r41}else{r51=r39;r52=r38;r53=r37;r54=r35;r55=r34}if((r54&32768|0)==0){HEAP8[r10]=HEAP8[r51];HEAP8[r10+1|0]=HEAP8[r51+1|0];HEAP8[r10+2|0]=HEAP8[r51+2|0]}else{HEAP8[r10]=HEAP8[r52];HEAP8[r10+1|0]=HEAP8[r52+1|0];HEAP8[r10+2|0]=HEAP8[r52+2|0]}r41=r36+1|0;if(r41>>>0<HEAP32[r6>>2]>>>0){r34=r55;r35=r54<<1&65534;r36=r41;r37=r53<<1&65534;r38=r52;r39=r51;r10=r10+3|0}else{break}}}}}while(0);HEAP32[r3>>2]=HEAP32[r3>>2]+1;return}function _e86_disasm_mem(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r4&65535;r8=(r3&65535)<<4;r3=r1+80|0;r9=r1+76|0;r10=r1+72|0;r11=r1+36|0;r12=r1+32|0;r1=0;while(1){r13=HEAP32[r3>>2]&(r1+r7&65535)+r8;if(r13>>>0<HEAP32[r9>>2]>>>0){r14=HEAP8[HEAP32[r10>>2]+r13|0]}else{r14=FUNCTION_TABLE[HEAP32[r11>>2]](HEAP32[r12>>2],r13)}HEAP8[r6+r1|0]=r14;r13=r1+1|0;if(r13>>>0<16){r1=r13}else{break}}r1=r6|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP16[r2+8>>1]=r4;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r1]&255)<<2)>>2]](r2,r1);r1=r2+12|0;if((HEAP32[r1>>2]|0)==0){STACKTOP=r5;return}else{r15=0}while(1){HEAP8[r15+(r2+16)|0]=HEAP8[r6+r15|0];r4=r15+1|0;if(r4>>>0<HEAP32[r1>>2]>>>0){r15=r4}else{break}}STACKTOP=r5;return}function _e86_disasm_cur(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=HEAP16[r1+28>>1];r6=r4|0;r7=r5&65535;r8=HEAPU16[r1+22>>1]<<4;r9=r1+80|0;r10=r1+76|0;r11=r1+72|0;r12=r1+36|0;r13=r1+32|0;r1=0;while(1){r14=(r1+r7&65535)+r8&HEAP32[r9>>2];if(r14>>>0<HEAP32[r10>>2]>>>0){r15=HEAP8[HEAP32[r11>>2]+r14|0]}else{r15=FUNCTION_TABLE[HEAP32[r12>>2]](HEAP32[r13>>2],r14)}HEAP8[r4+r1|0]=r15;r14=r1+1|0;if(r14>>>0<16){r1=r14}else{break}}HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP16[r2+8>>1]=r5;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r6]&255)<<2)>>2]](r2,r6);r6=r2+12|0;if((HEAP32[r6>>2]|0)==0){r16=16;r17=0;STACKTOP=r3;return}else{r18=0}while(1){HEAP8[r18+(r2+16)|0]=HEAP8[r4+r18|0];r5=r18+1|0;if(r5>>>0<HEAP32[r6>>2]>>>0){r18=r5}else{break}}r16=16;r17=0;STACKTOP=r3;return}function _dop_00(r1,r2){var r3;r3=r1+32|0;tempBigInt=4473921;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_01(r1,r2){var r3;r3=r1+32|0;tempBigInt=4473921;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_02(r1,r2){var r3;r3=r1+32|0;tempBigInt=4473921;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_03(r1,r2){var r3;r3=r1+32|0;tempBigInt=4473921;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_04(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4473921;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_05(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4473921;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_06(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;HEAP8[r2]=HEAP8[12688];HEAP8[r2+1|0]=HEAP8[12689];HEAP8[r2+2|0]=HEAP8[12690];HEAP8[r2+3|0]=HEAP8[12691];HEAP8[r2+4|0]=HEAP8[12692];r2=r1+100|0;HEAP8[r2]=HEAP8[25360];HEAP8[r2+1|0]=HEAP8[25361];HEAP8[r2+2|0]=HEAP8[25362];return}function _dop_07(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;tempBigInt=5263184;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[25360];HEAP8[r2+1|0]=HEAP8[25361];HEAP8[r2+2|0]=HEAP8[25362];return}function _dop_08(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24392];HEAP8[r3+1|0]=HEAP8[24393];HEAP8[r3+2|0]=HEAP8[24394];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_09(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24392];HEAP8[r3+1|0]=HEAP8[24393];HEAP8[r3+2|0]=HEAP8[24394];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_0a(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24392];HEAP8[r3+1|0]=HEAP8[24393];HEAP8[r3+2|0]=HEAP8[24394];r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_0b(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24392];HEAP8[r3+1|0]=HEAP8[24393];HEAP8[r3+2|0]=HEAP8[24394];r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_0c(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[24392];HEAP8[r5+1|0]=HEAP8[24393];HEAP8[r5+2|0]=HEAP8[24394];r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_0d(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[24392];HEAP8[r5+1|0]=HEAP8[24393];HEAP8[r5+2|0]=HEAP8[24394];r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_0e(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;HEAP8[r2]=HEAP8[12688];HEAP8[r2+1|0]=HEAP8[12689];HEAP8[r2+2|0]=HEAP8[12690];HEAP8[r2+3|0]=HEAP8[12691];HEAP8[r2+4|0]=HEAP8[12692];r2=r1+100|0;HEAP8[r2]=HEAP8[24976];HEAP8[r2+1|0]=HEAP8[24977];HEAP8[r2+2|0]=HEAP8[24978];return}function _dop_0f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;tempBigInt=5263184;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[24976];HEAP8[r2+1|0]=HEAP8[24977];HEAP8[r2+2|0]=HEAP8[24978];return}function _dop_10(r1,r2){var r3;r3=r1+32|0;tempBigInt=4408385;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_11(r1,r2){var r3;r3=r1+32|0;tempBigInt=4408385;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_12(r1,r2){var r3;r3=r1+32|0;tempBigInt=4408385;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_13(r1,r2){var r3;r3=r1+32|0;tempBigInt=4408385;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_14(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4408385;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_15(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4408385;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_16(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;HEAP8[r2]=HEAP8[12688];HEAP8[r2+1|0]=HEAP8[12689];HEAP8[r2+2|0]=HEAP8[12690];HEAP8[r2+3|0]=HEAP8[12691];HEAP8[r2+4|0]=HEAP8[12692];r2=r1+100|0;HEAP8[r2]=HEAP8[24816];HEAP8[r2+1|0]=HEAP8[24817];HEAP8[r2+2|0]=HEAP8[24818];return}function _dop_17(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;tempBigInt=5263184;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[24816];HEAP8[r2+1|0]=HEAP8[24817];HEAP8[r2+2|0]=HEAP8[24818];return}function _dop_18(r1,r2){var r3;r3=r1+32|0;tempBigInt=4342355;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_19(r1,r2){var r3;r3=r1+32|0;tempBigInt=4342355;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_1a(r1,r2){var r3;r3=r1+32|0;tempBigInt=4342355;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_1b(r1,r2){var r3;r3=r1+32|0;tempBigInt=4342355;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_1c(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4342355;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_1d(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4342355;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_1e(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;HEAP8[r2]=HEAP8[12688];HEAP8[r2+1|0]=HEAP8[12689];HEAP8[r2+2|0]=HEAP8[12690];HEAP8[r2+3|0]=HEAP8[12691];HEAP8[r2+4|0]=HEAP8[12692];r2=r1+100|0;HEAP8[r2]=HEAP8[24760];HEAP8[r2+1|0]=HEAP8[24761];HEAP8[r2+2|0]=HEAP8[24762];return}function _dop_1f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;tempBigInt=5263184;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[24760];HEAP8[r2+1|0]=HEAP8[24761];HEAP8[r2+2|0]=HEAP8[24762];return}function _dop_20(r1,r2){var r3;r3=r1+32|0;tempBigInt=4476481;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_21(r1,r2){var r3;r3=r1+32|0;tempBigInt=4476481;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_22(r1,r2){var r3;r3=r1+32|0;tempBigInt=4476481;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_23(r1,r2){var r3;r3=r1+32|0;tempBigInt=4476481;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_24(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4476481;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_25(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4476481;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_26(r1,r2){var r3,r4,r5;r3=r1+4|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=1;r5=r2+1|0;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+1;HEAP32[r3>>2]=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=0;r5=r1+32|0;tempBigInt=3822405;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r3>>2]=r4;return}}function _dop_27(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=4276548;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_28(r1,r2){var r3;r3=r1+32|0;tempBigInt=4347219;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_29(r1,r2){var r3;r3=r1+32|0;tempBigInt=4347219;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_2a(r1,r2){var r3;r3=r1+32|0;tempBigInt=4347219;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_2b(r1,r2){var r3;r3=r1+32|0;tempBigInt=4347219;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_2c(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4347219;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_2d(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4347219;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_2e(r1,r2){var r3,r4,r5;r3=r1+4|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=2;r5=r2+1|0;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+1;HEAP32[r3>>2]=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=0;r5=r1+32|0;tempBigInt=3822403;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r3>>2]=r4;return}}function _dop_2f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5456196;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_30(r1,r2){var r3;r3=r1+32|0;tempBigInt=5394264;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_31(r1,r2){var r3;r3=r1+32|0;tempBigInt=5394264;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_32(r1,r2){var r3;r3=r1+32|0;tempBigInt=5394264;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_33(r1,r2){var r3;r3=r1+32|0;tempBigInt=5394264;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_34(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5394264;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_35(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5394264;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_36(r1,r2){var r3,r4,r5;r3=r1+4|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=3;r5=r2+1|0;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+1;HEAP32[r3>>2]=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=0;r5=r1+32|0;tempBigInt=3822419;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r3>>2]=r4;return}}function _dop_37(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=4276545;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_38(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262659;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_39(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262659;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_3a(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262659;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_3b(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262659;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_3c(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5262659;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_3d(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5262659;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_3e(r1,r2){var r3,r4,r5;r3=r1+4|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=4;r5=r2+1|0;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+1;HEAP32[r3>>2]=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=0;r5=r1+32|0;tempBigInt=3822404;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r3>>2]=r4;return}}function _dop_3f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5456193;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_40(r1,r2){var r3;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r3=r1+32|0;tempBigInt=4410953;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9328+((HEAP8[r2]&7)<<2)>>2]);return}function _dop_48(r1,r2){var r3;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r3=r1+32|0;tempBigInt=4408644;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9328+((HEAP8[r2]&7)<<2)>>2]);return}function _dop_50(r1,r2){var r3;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r3=r1+32|0;HEAP8[r3]=HEAP8[12688];HEAP8[r3+1|0]=HEAP8[12689];HEAP8[r3+2|0]=HEAP8[12690];HEAP8[r3+3|0]=HEAP8[12691];HEAP8[r3+4|0]=HEAP8[12692];_strcpy(r1+100|0,HEAP32[9328+((HEAP8[r2]&7)<<2)>>2]);return}function _dop_58(r1,r2){var r3;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r3=r1+32|0;tempBigInt=5263184;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9328+((HEAP8[r2]&7)<<2)>>2]);return}function _dop_60(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22160];HEAP8[r2+1|0]=HEAP8[22161];HEAP8[r2+2|0]=HEAP8[22162];HEAP8[r2+3|0]=HEAP8[22163];HEAP8[r2+4|0]=HEAP8[22164];HEAP8[r2+5|0]=HEAP8[22165];return}function _dop_61(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22184];HEAP8[r2+1|0]=HEAP8[22185];HEAP8[r2+2|0]=HEAP8[22186];HEAP8[r2+3|0]=HEAP8[22187];HEAP8[r2+4|0]=HEAP8[22188];return}function _dop_62(r1,r2){var r3;r3=r1|0;HEAP32[r3>>2]=HEAP32[r3>>2]|1;r3=r1+32|0;HEAP8[r3]=HEAP8[22216];HEAP8[r3+1|0]=HEAP8[22217];HEAP8[r3+2|0]=HEAP8[22218];HEAP8[r3+3|0]=HEAP8[22219];HEAP8[r3+4|0]=HEAP8[22220];HEAP8[r3+5|0]=HEAP8[22221];r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_ud(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[22248];HEAP8[r5+1|0]=HEAP8[22249];HEAP8[r5+2|0]=HEAP8[22250];_sprintf(r1+100|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_66(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+12|0;if((HEAP8[r2+1|0]|0)==102){HEAP32[r5>>2]=4;HEAP32[r1+96>>2]=2;r6=r1+32|0;HEAP8[r6]=HEAP8[22280];HEAP8[r6+1|0]=HEAP8[22281];HEAP8[r6+2|0]=HEAP8[22282];HEAP8[r6+3|0]=HEAP8[22283];HEAP8[r6+4|0]=HEAP8[22284];_sprintf(r1+100|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0],r3));STACKTOP=r3;_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+3|0],r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[22248];HEAP8[r5+1|0]=HEAP8[22249];HEAP8[r5+2|0]=HEAP8[22250];_sprintf(r1+100|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2],r3));STACKTOP=r3;STACKTOP=r4;return}}function _dop_68(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[12688];HEAP8[r5+1|0]=HEAP8[12689];HEAP8[r5+2|0]=HEAP8[12690];HEAP8[r5+3|0]=HEAP8[12691];HEAP8[r5+4|0]=HEAP8[12692];_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_6a(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[12688];HEAP8[r5+1|0]=HEAP8[12689];HEAP8[r5+2|0]=HEAP8[12690];HEAP8[r5+3|0]=HEAP8[12691];HEAP8[r5+4|0]=HEAP8[12692];r5=r1+100|0;r1=HEAP8[r2+1|0];r2=r1&255;if(r1<<24>>24>-1){_sprintf(r5,24616,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;STACKTOP=r4;return}else{_sprintf(r5,24528,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=-r2&255,r3));STACKTOP=r3;STACKTOP=r4;return}}function _dop_6c(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22320];HEAP8[r2+1|0]=HEAP8[22321];HEAP8[r2+2|0]=HEAP8[22322];HEAP8[r2+3|0]=HEAP8[22323];HEAP8[r2+4|0]=HEAP8[22324];return}function _dop_6d(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22360];HEAP8[r2+1|0]=HEAP8[22361];HEAP8[r2+2|0]=HEAP8[22362];HEAP8[r2+3|0]=HEAP8[22363];HEAP8[r2+4|0]=HEAP8[22364];return}function _dop_6e(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22392];HEAP8[r2+1|0]=HEAP8[22393];HEAP8[r2+2|0]=HEAP8[22394];HEAP8[r2+3|0]=HEAP8[22395];HEAP8[r2+4|0]=HEAP8[22396];HEAP8[r2+5|0]=HEAP8[22397];return}function _dop_6f(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22448];HEAP8[r2+1|0]=HEAP8[22449];HEAP8[r2+2|0]=HEAP8[22450];HEAP8[r2+3|0]=HEAP8[22451];HEAP8[r2+4|0]=HEAP8[22452];HEAP8[r2+5|0]=HEAP8[22453];return}function _dop_70(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=HEAPU8[r2+1|0];r6=HEAPU16[r1+8>>1]+2+((r5&128|0)!=0?r5|65280:r5)|0;_strcpy(r1+32|0,HEAP32[9688+((HEAP8[r2]&15)<<2)>>2]);_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_80(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9624+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,0);_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r6+1)|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=r6+2;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_81(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9624+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,1);_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r6+2)|0]<<8|HEAPU8[r2+(r6+1)|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=r6+3;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_83(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9624+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,1);r5=r1+164|0;r7=HEAP8[r2+(r6+1)|0];r2=r7&255;if(r7<<24>>24>-1){_sprintf(r5,24616,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;r8=r6+2|0;r9=r1+12|0;HEAP32[r9>>2]=r8;r10=r1+96|0;HEAP32[r10>>2]=2;STACKTOP=r4;return}else{_sprintf(r5,24528,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=-r2&255,r3));STACKTOP=r3;r8=r6+2|0;r9=r1+12|0;HEAP32[r9>>2]=r8;r10=r1+96|0;HEAP32[r10>>2]=2;STACKTOP=r4;return}}function _dop_84(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[14824];HEAP8[r3+1|0]=HEAP8[14825];HEAP8[r3+2|0]=HEAP8[14826];HEAP8[r3+3|0]=HEAP8[14827];HEAP8[r3+4|0]=HEAP8[14828];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_85(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[14824];HEAP8[r3+1|0]=HEAP8[14825];HEAP8[r3+2|0]=HEAP8[14826];HEAP8[r3+3|0]=HEAP8[14827];HEAP8[r3+4|0]=HEAP8[14828];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_86(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[25656];HEAP8[r3+1|0]=HEAP8[25657];HEAP8[r3+2|0]=HEAP8[25658];HEAP8[r3+3|0]=HEAP8[25659];HEAP8[r3+4|0]=HEAP8[25660];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_87(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[25656];HEAP8[r3+1|0]=HEAP8[25657];HEAP8[r3+2|0]=HEAP8[25658];HEAP8[r3+3|0]=HEAP8[25659];HEAP8[r3+4|0]=HEAP8[25660];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_88(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_89(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_8a(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9296+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_8b(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_8c(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9256+((HEAPU8[r3]>>>3&3)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_8d(r1,r2){var r3;r3=r1+32|0;tempBigInt=4277580;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_8e(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9256+((HEAPU8[r3]>>>3&3)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_8f(r1,r2){var r3;r3=r1+32|0;tempBigInt=5263184;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;HEAP32[r1+12>>2]=_disasm_ea(r1,r1+100|0,r2+1|0,1)+1;HEAP32[r1+96>>2]=1;return}function _dop_90(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5263182;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_91(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[25656];HEAP8[r3+1|0]=HEAP8[25657];HEAP8[r3+2|0]=HEAP8[25658];HEAP8[r3+3|0]=HEAP8[25659];HEAP8[r3+4|0]=HEAP8[25660];r3=r1+100|0;HEAP8[r3]=HEAP8[16384];HEAP8[r3+1|0]=HEAP8[16385];HEAP8[r3+2|0]=HEAP8[16386];_strcpy(r1+164|0,HEAP32[9328+((HEAP8[r2]&7)<<2)>>2]);HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;return}function _dop_98(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5718595;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_99(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=4478787;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_9a(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|256;HEAP32[r1+12>>2]=5;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[18376];HEAP8[r5+1|0]=HEAP8[18377];HEAP8[r5+2|0]=HEAP8[18378];HEAP8[r5+3|0]=HEAP8[18379];HEAP8[r5+4|0]=HEAP8[18380];r5=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+100|0,12752,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAPU8[r2+4|0]<<8|HEAPU8[r2+3|0],HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_9b(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[25776];HEAP8[r2+1|0]=HEAP8[25777];HEAP8[r2+2|0]=HEAP8[25778];HEAP8[r2+3|0]=HEAP8[25779];HEAP8[r2+4|0]=HEAP8[25780];return}function _dop_9c(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[25808];HEAP8[r2+1|0]=HEAP8[25809];HEAP8[r2+2|0]=HEAP8[25810];HEAP8[r2+3|0]=HEAP8[25811];HEAP8[r2+4|0]=HEAP8[25812];HEAP8[r2+5|0]=HEAP8[25813];return}function _dop_9d(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[25848];HEAP8[r2+1|0]=HEAP8[25849];HEAP8[r2+2|0]=HEAP8[25850];HEAP8[r2+3|0]=HEAP8[25851];HEAP8[r2+4|0]=HEAP8[25852];return}function _dop_9e(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[25912];HEAP8[r2+1|0]=HEAP8[25913];HEAP8[r2+2|0]=HEAP8[25914];HEAP8[r2+3|0]=HEAP8[25915];HEAP8[r2+4|0]=HEAP8[25916];return}function _dop_9f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[26104];HEAP8[r2+1|0]=HEAP8[26105];HEAP8[r2+2|0]=HEAP8[26106];HEAP8[r2+3|0]=HEAP8[26107];HEAP8[r2+4|0]=HEAP8[26108];return}function _dop_a0(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];r5=r1+4|0;r6=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+164|0,10056,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[9272+(HEAP32[r5>>2]<<2)>>2],HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP32[r5>>2]=0;STACKTOP=r4;return}function _dop_a1(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];r5=r1+4|0;r6=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+164|0,10056,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[9272+(HEAP32[r5>>2]<<2)>>2],HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP32[r5>>2]=0;STACKTOP=r4;return}function _dop_a2(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+4|0;r6=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+100|0,10056,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[9272+(HEAP32[r5>>2]<<2)>>2],HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP32[r5>>2]=0;r5=r1+164|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];STACKTOP=r4;return}function _dop_a3(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+4|0;r6=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+100|0,10056,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[9272+(HEAP32[r5>>2]<<2)>>2],HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP32[r5>>2]=0;r5=r1+164|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];STACKTOP=r4;return}function _dop_a4(r1,r2){var r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[26232];HEAP8[r5+1|0]=HEAP8[26233];HEAP8[r5+2|0]=HEAP8[26234];HEAP8[r5+3|0]=HEAP8[26235];HEAP8[r5+4|0]=HEAP8[26236];HEAP8[r5+5|0]=HEAP8[26237];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}r7=r1+100|0;r8=r7|0;tempBigInt=978535771;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=6113604;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;_sprintf(r1+164|0,25832,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9272+(r6<<2)>>2],HEAP32[r2+8>>2]=18400,r2));STACKTOP=r2;HEAP32[r4>>2]=2;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_a5(r1,r2){var r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[9760];HEAP8[r5+1|0]=HEAP8[9761];HEAP8[r5+2|0]=HEAP8[9762];HEAP8[r5+3|0]=HEAP8[9763];HEAP8[r5+4|0]=HEAP8[9764];HEAP8[r5+5|0]=HEAP8[9765];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}r7=r1+100|0;r8=r7|0;tempBigInt=978535771;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=6113604;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;_sprintf(r1+164|0,25832,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9272+(r6<<2)>>2],HEAP32[r2+8>>2]=18400,r2));STACKTOP=r2;HEAP32[r4>>2]=2;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_a6(r1,r2){var r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[9800];HEAP8[r5+1|0]=HEAP8[9801];HEAP8[r5+2|0]=HEAP8[9802];HEAP8[r5+3|0]=HEAP8[9803];HEAP8[r5+4|0]=HEAP8[9804];HEAP8[r5+5|0]=HEAP8[9805];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}r7=r1+100|0;r8=r7|0;tempBigInt=978535771;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=6113604;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;_sprintf(r1+164|0,25832,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9272+(r6<<2)>>2],HEAP32[r2+8>>2]=18400,r2));STACKTOP=r2;HEAP32[r4>>2]=2;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_a7(r1,r2){var r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[9912];HEAP8[r5+1|0]=HEAP8[9913];HEAP8[r5+2|0]=HEAP8[9914];HEAP8[r5+3|0]=HEAP8[9915];HEAP8[r5+4|0]=HEAP8[9916];HEAP8[r5+5|0]=HEAP8[9917];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}r7=r1+100|0;r8=r7|0;tempBigInt=978535771;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=6113604;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;_sprintf(r1+164|0,25832,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9272+(r6<<2)>>2],HEAP32[r2+8>>2]=18400,r2));STACKTOP=r2;HEAP32[r4>>2]=2;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_a8(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[14824];HEAP8[r5+1|0]=HEAP8[14825];HEAP8[r5+2|0]=HEAP8[14826];HEAP8[r5+3|0]=HEAP8[14827];HEAP8[r5+4|0]=HEAP8[14828];r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_a9(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[14824];HEAP8[r5+1|0]=HEAP8[14825];HEAP8[r5+2|0]=HEAP8[14826];HEAP8[r5+3|0]=HEAP8[14827];HEAP8[r5+4|0]=HEAP8[14828];r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_aa(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[9968];HEAP8[r2+1|0]=HEAP8[9969];HEAP8[r2+2|0]=HEAP8[9970];HEAP8[r2+3|0]=HEAP8[9971];HEAP8[r2+4|0]=HEAP8[9972];HEAP8[r2+5|0]=HEAP8[9973];return}function _dop_ab(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10040];HEAP8[r2+1|0]=HEAP8[10041];HEAP8[r2+2|0]=HEAP8[10042];HEAP8[r2+3|0]=HEAP8[10043];HEAP8[r2+4|0]=HEAP8[10044];HEAP8[r2+5|0]=HEAP8[10045];return}function _dop_ac(r1,r2){var r3,r4,r5,r6;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[10096];HEAP8[r5+1|0]=HEAP8[10097];HEAP8[r5+2|0]=HEAP8[10098];HEAP8[r5+3|0]=HEAP8[10099];HEAP8[r5+4|0]=HEAP8[10100];HEAP8[r5+5|0]=HEAP8[10101];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}_sprintf(r1+100|0,25832,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9272+(r6<<2)>>2],HEAP32[r2+8>>2]=18400,r2));STACKTOP=r2;HEAP32[r4>>2]=1;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_ad(r1,r2){var r3,r4,r5,r6;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[10184];HEAP8[r5+1|0]=HEAP8[10185];HEAP8[r5+2|0]=HEAP8[10186];HEAP8[r5+3|0]=HEAP8[10187];HEAP8[r5+4|0]=HEAP8[10188];HEAP8[r5+5|0]=HEAP8[10189];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}_sprintf(r1+100|0,25832,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9272+(r6<<2)>>2],HEAP32[r2+8>>2]=18400,r2));STACKTOP=r2;HEAP32[r4>>2]=1;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_ae(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10384];HEAP8[r2+1|0]=HEAP8[10385];HEAP8[r2+2|0]=HEAP8[10386];HEAP8[r2+3|0]=HEAP8[10387];HEAP8[r2+4|0]=HEAP8[10388];HEAP8[r2+5|0]=HEAP8[10389];return}function _dop_af(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10536];HEAP8[r2+1|0]=HEAP8[10537];HEAP8[r2+2|0]=HEAP8[10538];HEAP8[r2+3|0]=HEAP8[10539];HEAP8[r2+4|0]=HEAP8[10540];HEAP8[r2+5|0]=HEAP8[10541];return}function _dop_b0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9296+((HEAP8[r2]&7)<<2)>>2]);_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_b8(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9328+((HEAP8[r2]&7)<<2)>>2]);_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_c0(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9592+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,0);_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r6+1)|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=r6+2;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c1(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9592+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,1);_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r6+1)|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=r6+2;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c2(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[10584];HEAP8[r5+1|0]=HEAP8[10585];HEAP8[r5+2|0]=HEAP8[10586];HEAP8[r5+3|0]=HEAP8[10587];HEAP8[r5+4|0]=HEAP8[10588];_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_c3(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10584];HEAP8[r2+1|0]=HEAP8[10585];HEAP8[r2+2|0]=HEAP8[10586];HEAP8[r2+3|0]=HEAP8[10587];HEAP8[r2+4|0]=HEAP8[10588];return}function _dop_c4(r1,r2){var r3;r3=r1+32|0;tempBigInt=5457228;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_c5(r1,r2){var r3;r3=r1+32|0;tempBigInt=5456972;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9328+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_c6(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=_disasm_ea(r1,r1+100|0,r2+1|0,0);r6=r1+12|0;HEAP32[r6>>2]=r5;_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r5+1)|0],r3));STACKTOP=r3;HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c7(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=_disasm_ea(r1,r1+100|0,r2+1|0,1);r6=r1+12|0;HEAP32[r6>>2]=r5;_sprintf(r1+164|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r5+2)|0]<<8|HEAPU8[r2+(r5+1)|0],r3));STACKTOP=r3;HEAP32[r6>>2]=HEAP32[r6>>2]+3;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c8(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;r5=r1+32|0;HEAP8[r5]=HEAP8[10864];HEAP8[r5+1|0]=HEAP8[10865];HEAP8[r5+2|0]=HEAP8[10866];HEAP8[r5+3|0]=HEAP8[10867];HEAP8[r5+4|0]=HEAP8[10868];HEAP8[r5+5|0]=HEAP8[10869];_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+3|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=4;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c9(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10912];HEAP8[r2+1|0]=HEAP8[10913];HEAP8[r2+2|0]=HEAP8[10914];HEAP8[r2+3|0]=HEAP8[10915];HEAP8[r2+4|0]=HEAP8[10916];HEAP8[r2+5|0]=HEAP8[10917];return}function _dop_ca(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[10960];HEAP8[r5+1|0]=HEAP8[10961];HEAP8[r5+2|0]=HEAP8[10962];HEAP8[r5+3|0]=HEAP8[10963];HEAP8[r5+4|0]=HEAP8[10964];_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_cb(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10960];HEAP8[r2+1|0]=HEAP8[10961];HEAP8[r2+2|0]=HEAP8[10962];HEAP8[r2+3|0]=HEAP8[10963];HEAP8[r2+4|0]=HEAP8[10964];return}function _dop_cc(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[11016];HEAP8[r2+1|0]=HEAP8[11017];HEAP8[r2+2|0]=HEAP8[11018];HEAP8[r2+3|0]=HEAP8[11019];HEAP8[r2+4|0]=HEAP8[11020];r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|256;return}function _dop_cd(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|256;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=r1+32|0;tempBigInt=5525065;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_sprintf(r1+100|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_ce(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[11368];HEAP8[r2+1|0]=HEAP8[11369];HEAP8[r2+2|0]=HEAP8[11370];HEAP8[r2+3|0]=HEAP8[11371];HEAP8[r2+4|0]=HEAP8[11372];r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|256;return}function _dop_cf(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[11424];HEAP8[r2+1|0]=HEAP8[11425];HEAP8[r2+2|0]=HEAP8[11426];HEAP8[r2+3|0]=HEAP8[11427];HEAP8[r2+4|0]=HEAP8[11428];return}function _dop_d0(r1,r2){var r3;r3=r2+1|0;_strcpy(r1+32|0,HEAP32[9592+((HEAPU8[r3]>>>3&7)<<2)>>2]);r2=_disasm_ea(r1,r1+100|0,r3,0);r3=r1+164|0;tempBigInt=49;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_d1(r1,r2){var r3;r3=r2+1|0;_strcpy(r1+32|0,HEAP32[9592+((HEAPU8[r3]>>>3&7)<<2)>>2]);r2=_disasm_ea(r1,r1+100|0,r3,1);r3=r1+164|0;tempBigInt=49;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_d2(r1,r2){var r3;r3=r2+1|0;_strcpy(r1+32|0,HEAP32[9592+((HEAPU8[r3]>>>3&7)<<2)>>2]);r2=_disasm_ea(r1,r1+100|0,r3,0);r3=r1+164|0;HEAP8[r3]=HEAP8[17632];HEAP8[r3+1|0]=HEAP8[17633];HEAP8[r3+2|0]=HEAP8[17634];HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_d3(r1,r2){var r3;r3=r2+1|0;_strcpy(r1+32|0,HEAP32[9592+((HEAPU8[r3]>>>3&7)<<2)>>2]);r2=_disasm_ea(r1,r1+100|0,r3,1);r3=r1+164|0;HEAP8[r3]=HEAP8[17632];HEAP8[r3+1|0]=HEAP8[17633];HEAP8[r3+2|0]=HEAP8[17634];HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_d4(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;tempBigInt=5062977;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_sprintf(r1+100|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;STACKTOP=r4;return}function _dop_d7(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[12400];HEAP8[r2+1|0]=HEAP8[12401];HEAP8[r2+2|0]=HEAP8[12402];HEAP8[r2+3|0]=HEAP8[12403];HEAP8[r2+4|0]=HEAP8[12404];return}function _dop_e0(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|512;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=HEAPU8[r2+1|0];r6=HEAPU16[r1+8>>1]+2+((r5&128|0)!=0?r5|65280:r5)|0;_strcpy(r1+32|0,HEAP32[9576+(HEAPU8[r2]-224<<2)>>2]);_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_e4(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[13144];HEAP8[r5+1|0]=HEAP8[13145];HEAP8[r5+2|0]=HEAP8[13146];r5=r1+100|0;HEAP8[r5]=HEAP8[17816];HEAP8[r5+1|0]=HEAP8[17817];HEAP8[r5+2|0]=HEAP8[17818];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_e5(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[13144];HEAP8[r5+1|0]=HEAP8[13145];HEAP8[r5+2|0]=HEAP8[13146];r5=r1+100|0;HEAP8[r5]=HEAP8[16384];HEAP8[r5+1|0]=HEAP8[16385];HEAP8[r5+2|0]=HEAP8[16386];_sprintf(r1+164|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_e6(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5526863;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_sprintf(r1+100|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;r3=r1+164|0;HEAP8[r3]=HEAP8[17816];HEAP8[r3+1|0]=HEAP8[17817];HEAP8[r3+2|0]=HEAP8[17818];STACKTOP=r4;return}function _dop_e7(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5526863;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_sprintf(r1+100|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;r3=r1+164|0;HEAP8[r3]=HEAP8[16384];HEAP8[r3+1|0]=HEAP8[16385];HEAP8[r3+2|0]=HEAP8[16386];STACKTOP=r4;return}function _dop_e8(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|256;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=(HEAP16[r1+8>>1]+3&65535)+(HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0])&65535;r2=r1+32|0;HEAP8[r2]=HEAP8[18376];HEAP8[r2+1|0]=HEAP8[18377];HEAP8[r2+2|0]=HEAP8[18378];HEAP8[r2+3|0]=HEAP8[18379];HEAP8[r2+4|0]=HEAP8[18380];_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_e9(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=(HEAP16[r1+8>>1]+3&65535)+(HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0])&65535;r2=r1+32|0;HEAP8[r2]=HEAP8[12704];HEAP8[r2+1|0]=HEAP8[12705];HEAP8[r2+2|0]=HEAP8[12706];HEAP8[r2+3|0]=HEAP8[12707];HEAP8[r2+4|0]=HEAP8[12708];_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_ea(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=5;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[13664];HEAP8[r5+1|0]=HEAP8[13665];HEAP8[r5+2|0]=HEAP8[13666];HEAP8[r5+3|0]=HEAP8[13667];HEAP8[r5+4|0]=HEAP8[13668];r5=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+100|0,12752,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAPU8[r2+4|0]<<8|HEAPU8[r2+3|0],HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_eb(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=HEAPU8[r2+1|0];r2=HEAPU16[r1+8>>1]+2+((r5&128|0)!=0?r5|65280:r5)|0;r5=r1+32|0;HEAP8[r5]=HEAP8[12912];HEAP8[r5+1|0]=HEAP8[12913];HEAP8[r5+2|0]=HEAP8[12914];HEAP8[r5+3|0]=HEAP8[12915];HEAP8[r5+4|0]=HEAP8[12916];_sprintf(r1+100|0,13760,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_ec(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;r2=r1+32|0;HEAP8[r2]=HEAP8[13144];HEAP8[r2+1|0]=HEAP8[13145];HEAP8[r2+2|0]=HEAP8[13146];r2=r1+100|0;HEAP8[r2]=HEAP8[17816];HEAP8[r2+1|0]=HEAP8[17817];HEAP8[r2+2|0]=HEAP8[17818];r2=r1+164|0;HEAP8[r2]=HEAP8[16144];HEAP8[r2+1|0]=HEAP8[16145];HEAP8[r2+2|0]=HEAP8[16146];return}function _dop_ed(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;r2=r1+32|0;HEAP8[r2]=HEAP8[13144];HEAP8[r2+1|0]=HEAP8[13145];HEAP8[r2+2|0]=HEAP8[13146];r2=r1+100|0;HEAP8[r2]=HEAP8[16384];HEAP8[r2+1|0]=HEAP8[16385];HEAP8[r2+2|0]=HEAP8[16386];r2=r1+164|0;HEAP8[r2]=HEAP8[16144];HEAP8[r2+1|0]=HEAP8[16145];HEAP8[r2+2|0]=HEAP8[16146];return}function _dop_ee(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;r2=r1+32|0;tempBigInt=5526863;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[16144];HEAP8[r2+1|0]=HEAP8[16145];HEAP8[r2+2|0]=HEAP8[16146];r2=r1+164|0;HEAP8[r2]=HEAP8[17816];HEAP8[r2+1|0]=HEAP8[17817];HEAP8[r2+2|0]=HEAP8[17818];return}function _dop_ef(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;r2=r1+32|0;tempBigInt=5526863;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[16144];HEAP8[r2+1|0]=HEAP8[16145];HEAP8[r2+2|0]=HEAP8[16146];r2=r1+164|0;HEAP8[r2]=HEAP8[16384];HEAP8[r2+1|0]=HEAP8[16385];HEAP8[r2+2|0]=HEAP8[16386];return}function _dop_f0(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+256|0;r4=r3|0;r5=r2+1|0;HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r5>>2]|0)!=0){r6=0;while(1){r7=r6+1|0;HEAP8[r6+(r1+16)|0]=HEAP8[r2+r7|0];if(r7>>>0<HEAP32[r5>>2]>>>0){r6=r7}else{break}}}r6=r1+32|0;_strcpy(r4,r6);HEAP8[r6]=HEAP8[13272];HEAP8[r6+1|0]=HEAP8[13273];HEAP8[r6+2|0]=HEAP8[13274];HEAP8[r6+3|0]=HEAP8[13275];HEAP8[r6+4|0]=HEAP8[13276];HEAP8[r6+5|0]=HEAP8[13277];_strcat(r6,r4);HEAP32[r5>>2]=HEAP32[r5>>2]+1;STACKTOP=r3;return}function _dop_f2(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+256|0;r4=r3|0;r5=r2+1|0;HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r5>>2]|0)!=0){r6=0;while(1){r7=r6+1|0;HEAP8[r6+(r1+16)|0]=HEAP8[r2+r7|0];if(r7>>>0<HEAP32[r5>>2]>>>0){r6=r7}else{break}}}r6=r1+32|0;_strcpy(r4,r6);HEAP8[r6]=HEAP8[13448];HEAP8[r6+1|0]=HEAP8[13449];HEAP8[r6+2|0]=HEAP8[13450];HEAP8[r6+3|0]=HEAP8[13451];HEAP8[r6+4|0]=HEAP8[13452];HEAP8[r6+5|0]=HEAP8[13453];HEAP8[r6+6|0]=HEAP8[13454];_strcat(r6,r4);HEAP32[r5>>2]=HEAP32[r5>>2]+1;STACKTOP=r3;return}function _dop_f3(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+256|0;r4=r3|0;r5=r2+1|0;HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;FUNCTION_TABLE[HEAP32[7248+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r5>>2]|0)!=0){r6=0;while(1){r7=r6+1|0;HEAP8[r6+(r1+16)|0]=HEAP8[r2+r7|0];if(r7>>>0<HEAP32[r5>>2]>>>0){r6=r7}else{break}}}r6=r1+32|0;_strcpy(r4,r6);HEAP8[r6]=HEAP8[13456];HEAP8[r6+1|0]=HEAP8[13457];HEAP8[r6+2|0]=HEAP8[13458];HEAP8[r6+3|0]=HEAP8[13459];HEAP8[r6+4|0]=HEAP8[13460];_strcat(r6,r4);HEAP32[r5>>2]=HEAP32[r5>>2]+1;STACKTOP=r3;return}function _dop_f4(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5524552;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_f5(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=4410691;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_f6(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76;r3=0;r4=0;r5=STACKTOP;r6=r2+1|0;r7=HEAP8[r6];r8=r7&255;r9=r8>>>3;r10=r9&7;switch(r10|0){case 3:{r11=r1+32|0;r12=r11;tempBigInt=4670798;HEAP8[r12]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+3|0]=tempBigInt;r13=r1+100|0;r14=_disasm_ea(r1,r13,r6,0);r15=r14+1|0;r16=r1+12|0;HEAP32[r16>>2]=r15;r17=r1+96|0;HEAP32[r17>>2]=1;STACKTOP=r5;return;break};case 2:{r18=r1+32|0;r19=r18;tempBigInt=5525326;HEAP8[r19]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r19+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r19+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r19+3|0]=tempBigInt;r20=r1+100|0;r21=_disasm_ea(r1,r20,r6,0);r22=r21+1|0;r23=r1+12|0;HEAP32[r23>>2]=r22;r24=r1+96|0;HEAP32[r24>>2]=1;STACKTOP=r5;return;break};case 6:{r25=r1+32|0;r26=r25;tempBigInt=5654852;HEAP8[r26]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r26+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r26+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r26+3|0]=tempBigInt;r27=r1+100|0;r28=_disasm_ea(r1,r27,r6,0);r29=r28+1|0;r30=r1+12|0;HEAP32[r30>>2]=r29;r31=r1+96|0;HEAP32[r31>>2]=1;STACKTOP=r5;return;break};case 4:{r32=r1+32|0;r33=r32;tempBigInt=5002573;HEAP8[r33]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r33+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r33+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r33+3|0]=tempBigInt;r34=r1+100|0;r35=_disasm_ea(r1,r34,r6,0);r36=r35+1|0;r37=r1+12|0;HEAP32[r37>>2]=r36;r38=r1+96|0;HEAP32[r38>>2]=1;STACKTOP=r5;return;break};case 7:{r39=r1+32|0;HEAP8[r39]=HEAP8[13976];HEAP8[r39+1|0]=HEAP8[13977];HEAP8[r39+2|0]=HEAP8[13978];HEAP8[r39+3|0]=HEAP8[13979];HEAP8[r39+4|0]=HEAP8[13980];r40=r1+100|0;r41=_disasm_ea(r1,r40,r6,0);r42=r41+1|0;r43=r1+12|0;HEAP32[r43>>2]=r42;r44=r1+96|0;HEAP32[r44>>2]=1;STACKTOP=r5;return;break};case 5:{r45=r1+32|0;HEAP8[r45]=HEAP8[14304];HEAP8[r45+1|0]=HEAP8[14305];HEAP8[r45+2|0]=HEAP8[14306];HEAP8[r45+3|0]=HEAP8[14307];HEAP8[r45+4|0]=HEAP8[14308];r46=r1+100|0;r47=_disasm_ea(r1,r46,r6,0);r48=r47+1|0;r49=r1+12|0;HEAP32[r49>>2]=r48;r50=r1+96|0;HEAP32[r50>>2]=1;STACKTOP=r5;return;break};case 1:{r51=r1+12|0;HEAP32[r51>>2]=1;r52=r1+96|0;HEAP32[r52>>2]=1;r53=r1+32|0;HEAP8[r53]=HEAP8[22248];HEAP8[r53+1|0]=HEAP8[22249];HEAP8[r53+2|0]=HEAP8[22250];r54=r1+100|0;r55=HEAP8[r2];r56=r55&255;r57=_sprintf(r54,13680,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r56,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 0:{r58=r1+32|0;HEAP8[r58]=HEAP8[14824];HEAP8[r58+1|0]=HEAP8[14825];HEAP8[r58+2|0]=HEAP8[14826];HEAP8[r58+3|0]=HEAP8[14827];HEAP8[r58+4|0]=HEAP8[14828];r59=r1+100|0;r60=_disasm_ea(r1,r59,r6,0);r61=r1+164|0;r62=r60+1|0;r63=r2+r62|0;r64=HEAP8[r63];r65=r64&255;r66=_sprintf(r61,13680,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r65,r4));STACKTOP=r4;r67=r60+2|0;r68=r1+12|0;HEAP32[r68>>2]=r67;r69=r1+96|0;HEAP32[r69>>2]=2;STACKTOP=r5;return;break};default:{r70=r1+12|0;HEAP32[r70>>2]=1;r71=r1+96|0;HEAP32[r71>>2]=1;r72=r1+32|0;HEAP8[r72]=HEAP8[22248];HEAP8[r72+1|0]=HEAP8[22249];HEAP8[r72+2|0]=HEAP8[22250];r73=r1+100|0;r74=HEAP8[r2];r75=r74&255;r76=_sprintf(r73,13680,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r75,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _dop_f7(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82;r3=0;r4=0;r5=STACKTOP;r6=r2+1|0;r7=HEAP8[r6];r8=r7&255;r9=r8>>>3;r10=r9&7;switch(r10|0){case 5:{r11=r1+32|0;HEAP8[r11]=HEAP8[14304];HEAP8[r11+1|0]=HEAP8[14305];HEAP8[r11+2|0]=HEAP8[14306];HEAP8[r11+3|0]=HEAP8[14307];HEAP8[r11+4|0]=HEAP8[14308];r12=r1+100|0;r13=_disasm_ea(r1,r12,r6,1);r14=r13+1|0;r15=r1+12|0;HEAP32[r15>>2]=r14;r16=r1+96|0;HEAP32[r16>>2]=1;STACKTOP=r5;return;break};case 6:{r17=r1+32|0;r18=r17;tempBigInt=5654852;HEAP8[r18]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r18+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r18+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r18+3|0]=tempBigInt;r19=r1+100|0;r20=_disasm_ea(r1,r19,r6,1);r21=r20+1|0;r22=r1+12|0;HEAP32[r22>>2]=r21;r23=r1+96|0;HEAP32[r23>>2]=1;STACKTOP=r5;return;break};case 2:{r24=r1+32|0;r25=r24;tempBigInt=5525326;HEAP8[r25]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r25+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r25+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r25+3|0]=tempBigInt;r26=r1+100|0;r27=_disasm_ea(r1,r26,r6,1);r28=r27+1|0;r29=r1+12|0;HEAP32[r29>>2]=r28;r30=r1+96|0;HEAP32[r30>>2]=1;STACKTOP=r5;return;break};case 4:{r31=r1+32|0;r32=r31;tempBigInt=5002573;HEAP8[r32]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r32+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r32+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r32+3|0]=tempBigInt;r33=r1+100|0;r34=_disasm_ea(r1,r33,r6,1);r35=r34+1|0;r36=r1+12|0;HEAP32[r36>>2]=r35;r37=r1+96|0;HEAP32[r37>>2]=1;STACKTOP=r5;return;break};case 1:{r38=r1+12|0;HEAP32[r38>>2]=1;r39=r1+96|0;HEAP32[r39>>2]=1;r40=r1+32|0;HEAP8[r40]=HEAP8[22248];HEAP8[r40+1|0]=HEAP8[22249];HEAP8[r40+2|0]=HEAP8[22250];r41=r1+100|0;r42=HEAP8[r2];r43=r42&255;r44=_sprintf(r41,13680,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r43,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 0:{r45=r1+32|0;HEAP8[r45]=HEAP8[14824];HEAP8[r45+1|0]=HEAP8[14825];HEAP8[r45+2|0]=HEAP8[14826];HEAP8[r45+3|0]=HEAP8[14827];HEAP8[r45+4|0]=HEAP8[14828];r46=r1+100|0;r47=_disasm_ea(r1,r46,r6,1);r48=r1+164|0;r49=r47+1|0;r50=r2+r49|0;r51=HEAP8[r50];r52=r47+2|0;r53=r2+r52|0;r54=HEAP8[r53];r55=r54&255;r56=r55<<8;r57=r51&255;r58=r56|r57;r59=_sprintf(r48,13760,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r58,r4));STACKTOP=r4;r60=r47+3|0;r61=r1+12|0;HEAP32[r61>>2]=r60;r62=r1+96|0;HEAP32[r62>>2]=2;STACKTOP=r5;return;break};case 3:{r63=r1+32|0;r64=r63;tempBigInt=4670798;HEAP8[r64]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r64+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r64+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r64+3|0]=tempBigInt;r65=r1+100|0;r66=_disasm_ea(r1,r65,r6,1);r67=r66+1|0;r68=r1+12|0;HEAP32[r68>>2]=r67;r69=r1+96|0;HEAP32[r69>>2]=1;STACKTOP=r5;return;break};case 7:{r70=r1+32|0;HEAP8[r70]=HEAP8[13976];HEAP8[r70+1|0]=HEAP8[13977];HEAP8[r70+2|0]=HEAP8[13978];HEAP8[r70+3|0]=HEAP8[13979];HEAP8[r70+4|0]=HEAP8[13980];r71=r1+100|0;r72=_disasm_ea(r1,r71,r6,1);r73=r72+1|0;r74=r1+12|0;HEAP32[r74>>2]=r73;r75=r1+96|0;HEAP32[r75>>2]=1;STACKTOP=r5;return;break};default:{r76=r1+12|0;HEAP32[r76>>2]=1;r77=r1+96|0;HEAP32[r77>>2]=1;r78=r1+32|0;HEAP8[r78]=HEAP8[22248];HEAP8[r78+1|0]=HEAP8[22249];HEAP8[r78+2|0]=HEAP8[22250];r79=r1+100|0;r80=HEAP8[r2];r81=r80&255;r82=_sprintf(r79,13680,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r81,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _dop_f8(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;_strcpy(r1+32|0,HEAP32[9360+(HEAPU8[r2]-248<<2)>>2]);return}function _dop_fe(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r2+1|0;r6=HEAPU8[r5]>>>3&7;if((r6|0)==1){r7=r1+32|0;tempBigInt=4408644;HEAP8[r7]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+3|0]=tempBigInt;HEAP32[r1+12>>2]=_disasm_ea(r1,r1+100|0,r5,0)+1;HEAP32[r1+96>>2]=1;STACKTOP=r4;return}else if((r6|0)==0){r6=r1+32|0;tempBigInt=4410953;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;HEAP32[r1+12>>2]=_disasm_ea(r1,r1+100|0,r5,0)+1;HEAP32[r1+96>>2]=1;STACKTOP=r4;return}else{HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[22248];HEAP8[r5+1|0]=HEAP8[22249];HEAP8[r5+2|0]=HEAP8[22250];_sprintf(r1+100|0,13680,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2],r3));STACKTOP=r3;STACKTOP=r4;return}}function _dop_ff(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75;r3=0;r4=0;r5=STACKTOP;r6=r2+1|0;r7=HEAP8[r6];r8=r7&255;r9=r8>>>3;r10=r9&7;switch(r10|0){case 3:{r11=r1+32|0;HEAP8[r11]=HEAP8[16600];HEAP8[r11+1|0]=HEAP8[16601];HEAP8[r11+2|0]=HEAP8[16602];HEAP8[r11+3|0]=HEAP8[16603];HEAP8[r11+4|0]=HEAP8[16604];HEAP8[r11+5|0]=HEAP8[16605];r12=r1+100|0;r13=_disasm_ea(r1,r12,r6,1);r14=r13+1|0;r15=r1+12|0;HEAP32[r15>>2]=r14;r16=r1+96|0;HEAP32[r16>>2]=1;r17=r1|0;r18=HEAP32[r17>>2];r19=r18|256;HEAP32[r17>>2]=r19;STACKTOP=r5;return;break};case 4:{r20=r1+32|0;r21=r20;tempBigInt=5262666;HEAP8[r21]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r21+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r21+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r21+3|0]=tempBigInt;r22=r1+100|0;r23=_disasm_ea(r1,r22,r6,1);r24=r23+1|0;r25=r1+12|0;HEAP32[r25>>2]=r24;r26=r1+96|0;HEAP32[r26>>2]=1;STACKTOP=r5;return;break};case 0:{r27=r1+32|0;r28=r27;tempBigInt=4410953;HEAP8[r28]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r28+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r28+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r28+3|0]=tempBigInt;r29=r1+100|0;r30=_disasm_ea(r1,r29,r6,1);r31=r30+1|0;r32=r1+12|0;HEAP32[r32>>2]=r31;r33=r1+96|0;HEAP32[r33>>2]=1;STACKTOP=r5;return;break};case 2:{r34=r1+32|0;HEAP8[r34]=HEAP8[18376];HEAP8[r34+1|0]=HEAP8[18377];HEAP8[r34+2|0]=HEAP8[18378];HEAP8[r34+3|0]=HEAP8[18379];HEAP8[r34+4|0]=HEAP8[18380];r35=r1+100|0;r36=_disasm_ea(r1,r35,r6,1);r37=r36+1|0;r38=r1+12|0;HEAP32[r38>>2]=r37;r39=r1+96|0;HEAP32[r39>>2]=1;r40=r1|0;r41=HEAP32[r40>>2];r42=r41|256;HEAP32[r40>>2]=r42;STACKTOP=r5;return;break};case 7:{r43=r1+12|0;HEAP32[r43>>2]=1;r44=r1+96|0;HEAP32[r44>>2]=1;r45=r1+32|0;HEAP8[r45]=HEAP8[22248];HEAP8[r45+1|0]=HEAP8[22249];HEAP8[r45+2|0]=HEAP8[22250];r46=r1+100|0;r47=HEAP8[r2];r48=r47&255;r49=_sprintf(r46,13680,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r48,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 1:{r50=r1+32|0;r51=r50;tempBigInt=4408644;HEAP8[r51]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r51+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r51+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r51+3|0]=tempBigInt;r52=r1+100|0;r53=_disasm_ea(r1,r52,r6,1);r54=r53+1|0;r55=r1+12|0;HEAP32[r55>>2]=r54;r56=r1+96|0;HEAP32[r56>>2]=1;STACKTOP=r5;return;break};case 6:{r57=r1+32|0;HEAP8[r57]=HEAP8[12688];HEAP8[r57+1|0]=HEAP8[12689];HEAP8[r57+2|0]=HEAP8[12690];HEAP8[r57+3|0]=HEAP8[12691];HEAP8[r57+4|0]=HEAP8[12692];r58=r1+100|0;r59=_disasm_ea(r1,r58,r6,1);r60=r59+1|0;r61=r1+12|0;HEAP32[r61>>2]=r60;r62=r1+96|0;HEAP32[r62>>2]=1;STACKTOP=r5;return;break};case 5:{r63=r1+32|0;HEAP8[r63]=HEAP8[13664];HEAP8[r63+1|0]=HEAP8[13665];HEAP8[r63+2|0]=HEAP8[13666];HEAP8[r63+3|0]=HEAP8[13667];HEAP8[r63+4|0]=HEAP8[13668];r64=r1+100|0;r65=_disasm_ea(r1,r64,r6,1);r66=r65+1|0;r67=r1+12|0;HEAP32[r67>>2]=r66;r68=r1+96|0;HEAP32[r68>>2]=1;STACKTOP=r5;return;break};default:{r69=r1+12|0;HEAP32[r69>>2]=1;r70=r1+96|0;HEAP32[r70>>2]=1;r71=r1+32|0;HEAP8[r71]=HEAP8[22248];HEAP8[r71+1|0]=HEAP8[22249];HEAP8[r71+2|0]=HEAP8[22250];r72=r1+100|0;r73=HEAP8[r2];r74=r73&255;r75=_sprintf(r72,13680,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r74,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _disasm_ea(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r5=0;r6=STACKTOP;r7=HEAPU8[r3];r8=r7&192;if((r8|0)==192){r9=r7&7;if((r4|0)==0){_strcpy(r2,HEAP32[9296+(r9<<2)>>2]);r10=1;STACKTOP=r6;return r10}else{_strcpy(r2,HEAP32[9328+(r9<<2)>>2]);r10=1;STACKTOP=r6;return r10}}r9=r8>>>3|r7&7;r7=r1+4|0;r1=HEAP32[9272+(HEAP32[r7>>2]<<2)>>2];HEAP32[r7>>2]=0;r7=(r4|0)!=0?11816:10928;HEAP8[r2]=HEAP8[r7];HEAP8[r2+1|0]=HEAP8[r7+1|0];HEAP8[r2+2|0]=HEAP8[r7+2|0];HEAP8[r2+3|0]=HEAP8[r7+3|0];HEAP8[r2+4|0]=HEAP8[r7+4|0];HEAP8[r2+5|0]=HEAP8[r7+5|0];r7=r2+_strlen(r2)|0;r2=HEAP32[9388+(r9<<3)>>2];if((r9|0)==6){r4=HEAPU8[r3+2|0]<<8|HEAPU8[r3+1|0];_sprintf(r7,10056,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r1,HEAP32[r5+8>>2]=r4,r5));STACKTOP=r5;r10=3;STACKTOP=r6;return r10}r4=HEAP32[9384+(r9<<3)>>2];if((r4|0)==0){_sprintf(r7,25832,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r1,HEAP32[r5+8>>2]=r2,r5));STACKTOP=r5}else if((r4|0)==2){r9=HEAPU8[r3+2|0]<<8;r8=r9|HEAPU8[r3+1|0];r11=r9&32768;_sprintf(r7,23768,(r5=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r5>>2]=r1,HEAP32[r5+8>>2]=r2,HEAP32[r5+16>>2]=(r11>>>14)+43,HEAP32[r5+24>>2]=((r11|0)==0?r8:-r8|0)&65535,r5));STACKTOP=r5}else if((r4|0)==1){r8=HEAPU8[r3+1|0];r3=r8&128;_sprintf(r7,24776,(r5=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r5>>2]=r1,HEAP32[r5+8>>2]=r2,HEAP32[r5+16>>2]=(r3>>>6)+43,HEAP32[r5+24>>2]=((r3|0)==0?r8:-r8|0)&255,r5));STACKTOP=r5}else{HEAP8[r7]=HEAP8[23008];HEAP8[r7+1|0]=HEAP8[23009];HEAP8[r7+2|0]=HEAP8[23010];HEAP8[r7+3|0]=HEAP8[23011];HEAP8[r7+4|0]=HEAP8[23012];HEAP8[r7+5|0]=HEAP8[23013]}r10=r4+1|0;STACKTOP=r6;return r10}function _e86_set_80186(r1){var r2;_e86_set_8086(r1);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]&-12|10;HEAP32[r1+544>>2]=488;HEAP32[r1+548>>2]=486;HEAP32[r1+552>>2]=498;HEAP32[r1+576>>2]=348;HEAP32[r1+580>>2]=346;HEAP32[r1+584>>2]=378;HEAP32[r1+588>>2]=302;HEAP32[r1+592>>2]=384;HEAP32[r1+596>>2]=370;HEAP32[r1+600>>2]=288;HEAP32[r1+604>>2]=376;HEAP32[r1+928>>2]=776;HEAP32[r1+932>>2]=778;HEAP32[r1+960>>2]=1030;HEAP32[r1+964>>2]=1050;return}function _op_60(r1){var r2;r2=HEAP16[r1+12>>1];_e86_push(r1,HEAP16[r1+4>>1]);_e86_push(r1,HEAP16[r1+6>>1]);_e86_push(r1,HEAP16[r1+8>>1]);_e86_push(r1,HEAP16[r1+10>>1]);_e86_push(r1,r2);_e86_push(r1,HEAP16[r1+14>>1]);_e86_push(r1,HEAP16[r1+16>>1]);_e86_push(r1,HEAP16[r1+18>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+19;return 1}function _op_61(r1){var r2;HEAP16[r1+18>>1]=_e86_pop(r1);HEAP16[r1+16>>1]=_e86_pop(r1);HEAP16[r1+14>>1]=_e86_pop(r1);_e86_pop(r1);HEAP16[r1+10>>1]=_e86_pop(r1);HEAP16[r1+8>>1]=_e86_pop(r1);HEAP16[r1+6>>1]=_e86_pop(r1);HEAP16[r1+4>>1]=_e86_pop(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+19;return 1}function _op_62(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];r2=r3&65535;if((HEAP32[r1+1184>>2]|0)==0){_fwrite(13616,21,1,HEAP32[_stderr>>2]);r4=HEAPU16[r1+1196>>1]+1|0;return r4}r5=HEAP16[r1+1194>>1];r6=HEAPU16[r1+1192>>1]<<4;r7=r1+80|0;r8=HEAP32[r7>>2];r9=r6+(r5&65535)&r8;r10=r9+1|0;r11=r1+76|0;r12=HEAP32[r11>>2];if(r10>>>0<r12>>>0){r13=HEAP32[r1+72>>2];r14=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r9|0];r15=r8;r16=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r14=r12;r15=HEAP32[r7>>2];r16=HEAP32[r11>>2]}r11=r14&65535;r7=r15&(r5+2&65535)+r6;r6=r7+1|0;if(r6>>>0<r16>>>0){r16=HEAP32[r1+72>>2];r17=HEAPU8[r16+r6|0]<<8|HEAPU8[r16+r7|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r7)}r7=r17&65535;r16=r3<<16>>16<0?r2|-65536:r2;if((r16|0)>=((r14<<16>>16<0?r11|-65536:r11)|0)?(r16|0)<=((r17<<16>>16<0?r7|-65536:r7)+2|0):0){r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+34;r4=HEAPU16[r1+1196>>1]+1|0;return r4}_e86_trap(r1,5);r4=0;return r4}function _op_68(r1){var r2;_e86_push(r1,HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+3;return 3}function _op_69(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1)&65535;r4=r1+1196|0;r5=HEAPU16[r4>>1];r6=HEAPU8[r5+2+(r1+128)|0]<<8;r7=r6|HEAPU8[r5+1+(r1+128)|0];r5=Math_imul((r6&32768|0)!=0?r7|-65536:r7,(r3&32768|0)!=0?r3|-65536:r3)|0;HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=r5;r2=r5&-32768;r5=r1+30|0;r3=HEAP16[r5>>1];if((r2|0)==-32768|(r2|0)==0){r8=r3&-2050}else{r8=r3|2049}HEAP16[r5>>1]=(r2|0)==0?r8|64:r8&-65;r8=r1+1200|0;HEAP32[r8>>2]=((HEAP32[r1+1184>>2]|0)!=0?30:23)+HEAP32[r8>>2];return HEAPU16[r4>>1]+3|0}function _op_6a(r1){var r2;r2=HEAPU8[r1+129|0];_e86_push(r1,((r2&128|0)!=0?r2|65280:r2)&65535);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+3;return 2}function _op_6b(r1){var r2,r3,r4,r5,r6,r7;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1)&65535;r4=r1+1196|0;r5=HEAPU8[HEAPU16[r4>>1]+1+(r1+128)|0];r6=(r5&128|0)!=0?r5|65280:r5;r5=Math_imul((r6&32768|0)!=0?r6|-65536:r6,(r3&32768|0)!=0?r3|-65536:r3)|0;HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=r5;r2=r5&-32768;r5=r1+30|0;r3=HEAP16[r5>>1];if((r2|0)==-32768|(r2|0)==0){r7=r3&-2050}else{r7=r3|2049}HEAP16[r5>>1]=(r2|0)==0?r7|64:r7&-65;r7=r1+1200|0;HEAP32[r7>>2]=((HEAP32[r1+1184>>2]|0)!=0?30:23)+HEAP32[r7>>2];return HEAPU16[r4>>1]+2|0}function _op_6c(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;if((HEAP32[r1+144>>2]&12|0)==0){r3=HEAP16[r1+20>>1];r4=r1+18|0;r5=HEAP16[r4>>1];r6=FUNCTION_TABLE[HEAP32[r1+56>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1]);r7=HEAP32[r1+80>>2]&((r3&65535)<<4)+(r5&65535);if(r7>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r7|0]=r6}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r7,r6)}HEAP16[r4>>1]=HEAP16[r4>>1]+r2;r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;return 1}r4=r1+6|0;if((HEAP16[r4>>1]|0)==0){return 1}r6=r1+20|0;r7=r1+18|0;r5=r1+56|0;r3=r1+52|0;r8=r1+8|0;r9=r1+80|0;r10=r1+76|0;r11=r1+72|0;r12=r1+1216|0;r13=r1+1200|0;r14=r1+40|0;r15=r1+32|0;r1=HEAP16[r7>>1];while(1){r16=HEAP16[r6>>1];r17=FUNCTION_TABLE[HEAP32[r5>>2]](HEAP32[r3>>2],HEAPU16[r8>>1]);r18=HEAP32[r9>>2]&((r16&65535)<<4)+(r1&65535);if(r18>>>0<HEAP32[r10>>2]>>>0){HEAP8[HEAP32[r11>>2]+r18|0]=r17}else{FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r18,r17)}r17=HEAP16[r7>>1]+r2&65535;HEAP16[r7>>1]=r17;r18=HEAP16[r4>>1]-1&65535;HEAP16[r4>>1]=r18;r16=_i64Add(HEAP32[r12>>2],HEAP32[r12+4>>2],1,0);HEAP32[r12>>2]=r16;HEAP32[r12+4>>2]=tempRet0;HEAP32[r13>>2]=HEAP32[r13>>2]+8;if(r18<<16>>16==0){break}else{r1=r17}}return 1}function _op_6d(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;if((HEAP32[r1+144>>2]&12|0)==0){r3=HEAP16[r1+20>>1];r4=r1+18|0;r5=HEAP16[r4>>1];r6=FUNCTION_TABLE[HEAP32[r1+64>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1]);r7=HEAP32[r1+80>>2]&((r3&65535)<<4)+(r5&65535);r5=r7+1|0;if(r5>>>0<HEAP32[r1+76>>2]>>>0){r3=r1+72|0;HEAP8[HEAP32[r3>>2]+r7|0]=r6;HEAP8[HEAP32[r3>>2]+r5|0]=(r6&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r7,r6)}HEAP16[r4>>1]=HEAP16[r4>>1]+r2;r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;return 1}r4=r1+6|0;if((HEAP16[r4>>1]|0)==0){return 1}r6=r1+20|0;r7=r1+18|0;r5=r1+64|0;r3=r1+52|0;r8=r1+8|0;r9=r1+80|0;r10=r1+76|0;r11=r1+72|0;r12=r1+1216|0;r13=r1+1200|0;r14=r1+48|0;r15=r1+32|0;r1=HEAP16[r7>>1];while(1){r16=HEAP16[r6>>1];r17=FUNCTION_TABLE[HEAP32[r5>>2]](HEAP32[r3>>2],HEAPU16[r8>>1]);r18=HEAP32[r9>>2]&((r16&65535)<<4)+(r1&65535);r16=r18+1|0;if(r16>>>0<HEAP32[r10>>2]>>>0){HEAP8[HEAP32[r11>>2]+r18|0]=r17;HEAP8[HEAP32[r11>>2]+r16|0]=(r17&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r18,r17)}r17=HEAP16[r7>>1]+r2&65535;HEAP16[r7>>1]=r17;r18=HEAP16[r4>>1]-1&65535;HEAP16[r4>>1]=r18;r16=_i64Add(HEAP32[r12>>2],HEAP32[r12+4>>2],1,0);HEAP32[r12>>2]=r16;HEAP32[r12+4>>2]=tempRet0;HEAP32[r13>>2]=HEAP32[r13>>2]+8;if(r18<<16>>16==0){break}else{r1=r17}}return 1}function _op_6e(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=HEAP32[r1+144>>2];r3=HEAP16[((r2&2|0)==0?r1+26|0:r1+148|0)>>1];r4=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;if((r2&12|0)==0){r2=HEAP32[r1+60>>2];r5=HEAP32[r1+52>>2];r6=HEAPU16[r1+8>>1];r7=r1+16|0;r8=HEAPU16[r7>>1]+((r3&65535)<<4)&HEAP32[r1+80>>2];if(r8>>>0<HEAP32[r1+76>>2]>>>0){r9=HEAP8[HEAP32[r1+72>>2]+r8|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r8)}FUNCTION_TABLE[r2](r5,r6,r9);HEAP16[r7>>1]=HEAP16[r7>>1]+r4;r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;return 1}r7=r1+6|0;if((HEAP16[r7>>1]|0)==0){return 1}r9=r1+60|0;r6=r1+52|0;r5=r1+8|0;r2=r1+16|0;r8=(r3&65535)<<4;r3=r1+80|0;r10=r1+76|0;r11=r1+72|0;r12=r1+1216|0;r13=r1+1200|0;r14=r1+36|0;r15=r1+32|0;r1=HEAP16[r2>>1];while(1){r16=HEAP32[r9>>2];r17=HEAP32[r6>>2];r18=HEAPU16[r5>>1];r19=(r1&65535)+r8&HEAP32[r3>>2];if(r19>>>0<HEAP32[r10>>2]>>>0){r20=HEAP8[HEAP32[r11>>2]+r19|0]}else{r20=FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r19)}FUNCTION_TABLE[r16](r17,r18,r20);r18=HEAP16[r2>>1]+r4&65535;HEAP16[r2>>1]=r18;r17=HEAP16[r7>>1]-1&65535;HEAP16[r7>>1]=r17;r16=_i64Add(HEAP32[r12>>2],HEAP32[r12+4>>2],1,0);HEAP32[r12>>2]=r16;HEAP32[r12+4>>2]=tempRet0;HEAP32[r13>>2]=HEAP32[r13>>2]+8;if(r17<<16>>16==0){break}else{r1=r18}}return 1}function _op_6f(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=HEAP32[r1+144>>2];r3=HEAP16[((r2&2|0)==0?r1+26|0:r1+148|0)>>1];r4=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;if((r2&12|0)==0){r2=HEAP32[r1+68>>2];r5=HEAP32[r1+52>>2];r6=HEAPU16[r1+8>>1];r7=r1+16|0;r8=HEAPU16[r7>>1]+((r3&65535)<<4)&HEAP32[r1+80>>2];r9=r8+1|0;if(r9>>>0<HEAP32[r1+76>>2]>>>0){r10=HEAP32[r1+72>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r8|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r8)}FUNCTION_TABLE[r2](r5,r6,r11);HEAP16[r7>>1]=HEAP16[r7>>1]+r4;r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;return 1}r7=r1+6|0;if((HEAP16[r7>>1]|0)==0){return 1}r11=r1+68|0;r6=r1+52|0;r5=r1+8|0;r2=r1+16|0;r8=(r3&65535)<<4;r3=r1+80|0;r10=r1+76|0;r9=r1+72|0;r12=r1+1216|0;r13=r1+1200|0;r14=r1+44|0;r15=r1+32|0;r1=HEAP16[r2>>1];while(1){r16=HEAP32[r11>>2];r17=HEAP32[r6>>2];r18=HEAPU16[r5>>1];r19=(r1&65535)+r8&HEAP32[r3>>2];r20=r19+1|0;if(r20>>>0<HEAP32[r10>>2]>>>0){r21=HEAP32[r9>>2];r22=HEAPU8[r21+r20|0]<<8|HEAPU8[r21+r19|0]}else{r22=FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r19)}FUNCTION_TABLE[r16](r17,r18,r22);r18=HEAP16[r2>>1]+r4&65535;HEAP16[r2>>1]=r18;r17=HEAP16[r7>>1]-1&65535;HEAP16[r7>>1]=r17;r16=_i64Add(HEAP32[r12>>2],HEAP32[r12+4>>2],1,0);HEAP32[r12>>2]=r16;HEAP32[r12+4>>2]=tempRet0;HEAP32[r13>>2]=HEAP32[r13>>2]+8;if(r17<<16>>16==0){break}else{r1=r18}}return 1}function _op_c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185;r2=0;r3=r1+129|0;r4=HEAP8[r3];_e86_get_ea_ptr(r1,r3);r5=_e86_get_ea8(r1);r6=r1+1196|0;r7=HEAP16[r6>>1];r8=r7&65535;r9=r8+1|0;r10=r9+(r1+128)|0;r11=HEAP8[r10];r12=r11&255;r13=r1|0;r14=HEAP32[r13>>2];r15=r14&2;r16=(r15|0)==0;r17=r12&31;r18=r16?r12:r17;r19=(r18|0)==0;if(r19){r20=r9;return r20}r21=r4&255;r22=r21>>>3;r23=r22&7;L4:do{switch(r23|0){case 5:{r24=r18>>>0>8;if(r24){r25=0}else{r26=r5&255;r27=r18-1|0;r28=r26>>>(r27>>>0);r29=r28&65535;r25=r29}r30=r25&1;r31=(r30|0)==0;r32=r1+30|0;r33=HEAP16[r32>>1];r34=r33&-2;r35=r33|1;r36=r31?r34:r35;HEAP16[r32>>1]=r36;r37=r25>>>1;r38=r37&255;_e86_set_flg_szp_8(r1,r38);r39=r5<<24>>24<0;r40=HEAP16[r32>>1];if(r39){r41=r40|2048;HEAP16[r32>>1]=r41;r42=r38;break L4}else{r43=r40&-2049;HEAP16[r32>>1]=r43;r42=r38;break L4}break};case 7:{r44=r5&255;r45=r44&128;r46=(r45|0)!=0;r47=r46?65280:0;r48=r47|r44;r49=r18>>>0>7;r50=r18-1|0;r51=r49?7:r50;r52=r48>>>(r51>>>0);r53=r52&1;r54=(r53|0)==0;r55=r1+30|0;r56=HEAP16[r55>>1];r57=r56&-2;r58=r56|1;r59=r54?r57:r58;HEAP16[r55>>1]=r59;r60=r52>>>1;r61=r60&255;_e86_set_flg_szp_8(r1,r61);r62=HEAP16[r55>>1];r63=r62&-2049;HEAP16[r55>>1]=r63;r42=r61;break};case 1:{r64=r5&255;r65=r18&7;r66=r64>>>(r65>>>0);r67=8-r65|0;r68=r64<<r67;r69=r68|r66;r70=r69&128;r71=(r70|0)==0;r72=r1+30|0;r73=HEAP16[r72>>1];r74=r73&-2;r75=r73|1;r76=r71?r74:r75;HEAP16[r72>>1]=r76;r77=r69<<1;r78=r77^r64;r79=r78&128;r80=(r79|0)==0;if(r80){r81=r76&-2049;HEAP16[r72>>1]=r81;r82=r69&255;r42=r82;break L4}else{r83=r76|2048;HEAP16[r72>>1]=r83;r84=r69&255;r42=r84;break L4}break};case 2:{r85=r1+30|0;r86=HEAP16[r85>>1];r87=r86<<8;r88=r87&256;r89=r5&255;r90=r88|r89;r91=r90&65535;r92=(r18>>>0)%9&-1;r93=r91<<r92;r94=9-r92|0;r95=r91>>>(r94>>>0);r96=r93|r95;r97=r96&256;r98=(r97|0)==0;r99=r86&-2;r100=r86|1;r101=r98?r99:r100;HEAP16[r85>>1]=r101;r102=r91<<1;r103=r102^r91;r104=r103&128;r105=(r104|0)==0;if(r105){r106=r101&-2049;HEAP16[r85>>1]=r106;r107=r96&255;r42=r107;break L4}else{r108=r101|2048;HEAP16[r85>>1]=r108;r109=r96&255;r42=r109;break L4}break};case 3:{r110=r1+30|0;r111=HEAP16[r110>>1];r112=r111<<8;r113=r112&256;r114=r5&255;r115=r113|r114;r116=r115&65535;r117=(r18>>>0)%9&-1;r118=r116>>>(r117>>>0);r119=9-r117|0;r120=r116<<r119;r121=r118|r120;r122=r121&256;r123=(r122|0)==0;r124=r111&-2;r125=r111|1;r126=r123?r124:r125;HEAP16[r110>>1]=r126;r127=r121<<1;r128=r127^r116;r129=r128&128;r130=(r129|0)==0;if(r130){r131=r126&-2049;HEAP16[r110>>1]=r131;r132=r121&255;r42=r132;break L4}else{r133=r126|2048;HEAP16[r110>>1]=r133;r134=r121&255;r42=r134;break L4}break};case 4:{r135=r18>>>0>8;r136=r5&255;if(r135){r137=0}else{r138=r136<<r18;r139=r138&65535;r137=r139}r140=r137&255;_e86_set_flg_szp_8(r1,r140);r141=r137&256;r142=r141<<16>>16==0;r143=r1+30|0;r144=HEAP16[r143>>1];r145=r144&-2;r146=r144|1;r147=r142?r145:r146;HEAP16[r143>>1]=r147;r148=r136<<1;r149=r148^r136;r150=r149&128;r151=(r150|0)==0;if(r151){r152=r147&-2049;HEAP16[r143>>1]=r152;r42=r140;break L4}else{r153=r147|2048;HEAP16[r143>>1]=r153;r42=r140;break L4}break};case 0:{r154=r5&255;r155=r18&7;r156=r154<<r155;r157=8-r155|0;r158=r154>>>(r157>>>0);r159=r158|r156;r160=r159&1;r161=(r160|0)==0;r162=r1+30|0;r163=HEAP16[r162>>1];r164=r163&-2;r165=r163|1;r166=r161?r164:r165;HEAP16[r162>>1]=r166;r167=r154<<1;r168=r167^r154;r169=r168&128;r170=(r169|0)==0;if(r170){r171=r166&-2049;HEAP16[r162>>1]=r171;r172=r159&255;r42=r172;break L4}else{r173=r166|2048;HEAP16[r162>>1]=r173;r174=r159&255;r42=r174;break L4}break};default:{r42=0}}}while(0);_e86_set_ea8(r1,r42);r175=r1+1184|0;r176=HEAP32[r175>>2];r177=(r176|0)!=0;r178=r177?17:5;r179=r1+1200|0;r180=HEAP32[r179>>2];r181=r180+r18|0;r182=r181+r178|0;HEAP32[r179>>2]=r182;r183=HEAP16[r6>>1];r184=r183&65535;r185=r184+2|0;r20=r185;return r20}function _op_c1(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178;r2=0;r3=r1+129|0;r4=HEAP8[r3];_e86_get_ea_ptr(r1,r3);r5=_e86_get_ea16(r1);r6=r5&65535;r7=r1+1196|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r9+1|0;r11=r10+(r1+128)|0;r12=HEAP8[r11];r13=r12&255;r14=r1|0;r15=HEAP32[r14>>2];r16=r15&2;r17=(r16|0)==0;r18=r13&31;r19=r17?r13:r18;r20=(r19|0)==0;if(r20){r21=r10;return r21}r22=r4&255;r23=r22>>>3;r24=r23&7;L4:do{switch(r24|0){case 7:{r25=r6&32768;r26=(r25|0)!=0;r27=r26?-65536:0;r28=r27|r6;r29=r19>>>0>15;r30=r19-1|0;r31=r29?15:r30;r32=r28>>>(r31>>>0);r33=r32&1;r34=(r33|0)==0;r35=r1+30|0;r36=HEAP16[r35>>1];r37=r36&-2;r38=r36|1;r39=r34?r37:r38;HEAP16[r35>>1]=r39;r40=r32>>>1;r41=r40&65535;_e86_set_flg_szp_16(r1,r41);r42=HEAP16[r35>>1];r43=r42&-2049;HEAP16[r35>>1]=r43;r44=r41;break};case 1:{r45=r19&15;r46=r6>>>(r45>>>0);r47=16-r45|0;r48=r6<<r47;r49=r48|r46;r50=r49&32768;r51=(r50|0)==0;r52=r1+30|0;r53=HEAP16[r52>>1];r54=r53&-2;r55=r53|1;r56=r51?r54:r55;HEAP16[r52>>1]=r56;r57=r49<<1;r58=r57^r6;r59=r58&32768;r60=(r59|0)==0;if(r60){r61=r56&-2049;HEAP16[r52>>1]=r61;r62=r49&65535;r44=r62;break L4}else{r63=r56|2048;HEAP16[r52>>1]=r63;r64=r49&65535;r44=r64;break L4}break};case 0:{r65=r19&15;r66=r6<<r65;r67=16-r65|0;r68=r6>>>(r67>>>0);r69=r68|r66;r70=r69&1;r71=(r70|0)==0;r72=r1+30|0;r73=HEAP16[r72>>1];r74=r73&-2;r75=r73|1;r76=r71?r74:r75;HEAP16[r72>>1]=r76;r77=r6<<1;r78=r77^r6;r79=r78&32768;r80=(r79|0)==0;if(r80){r81=r76&-2049;HEAP16[r72>>1]=r81;r82=r69&65535;r44=r82;break L4}else{r83=r76|2048;HEAP16[r72>>1]=r83;r84=r69&65535;r44=r84;break L4}break};case 2:{r85=r1+30|0;r86=HEAP16[r85>>1];r87=r86&65535;r88=r87<<16;r89=r88&65536;r90=r89|r6;r91=(r19>>>0)%17&-1;r92=r90<<r91;r93=17-r91|0;r94=r90>>>(r93>>>0);r95=r92|r94;r96=r95&65536;r97=(r96|0)==0;r98=r86&-2;r99=r86|1;r100=r97?r98:r99;HEAP16[r85>>1]=r100;r101=r6<<1;r102=r101^r6;r103=r102&32768;r104=(r103|0)==0;if(r104){r105=r100&-2049;HEAP16[r85>>1]=r105;r106=r95&65535;r44=r106;break L4}else{r107=r100|2048;HEAP16[r85>>1]=r107;r108=r95&65535;r44=r108;break L4}break};case 3:{r109=r1+30|0;r110=HEAP16[r109>>1];r111=r110&65535;r112=r111<<16;r113=r112&65536;r114=r113|r6;r115=(r19>>>0)%17&-1;r116=r114>>>(r115>>>0);r117=17-r115|0;r118=r114<<r117;r119=r116|r118;r120=r119&65536;r121=(r120|0)==0;r122=r110&-2;r123=r110|1;r124=r121?r122:r123;HEAP16[r109>>1]=r124;r125=r119<<1;r126=r125^r6;r127=r126&32768;r128=(r127|0)==0;if(r128){r129=r124&-2049;HEAP16[r109>>1]=r129;r130=r119&65535;r44=r130;break L4}else{r131=r124|2048;HEAP16[r109>>1]=r131;r132=r119&65535;r44=r132;break L4}break};case 4:{r133=r19>>>0>16;r134=r6<<r19;r135=r133?0:r134;r136=r135&65535;_e86_set_flg_szp_16(r1,r136);r137=r135&65536;r138=(r137|0)==0;r139=r1+30|0;r140=HEAP16[r139>>1];r141=r140&-2;r142=r140|1;r143=r138?r141:r142;HEAP16[r139>>1]=r143;r144=r6<<1;r145=r144^r6;r146=r145&32768;r147=(r146|0)==0;if(r147){r148=r143&-2049;HEAP16[r139>>1]=r148;r44=r136;break L4}else{r149=r143|2048;HEAP16[r139>>1]=r149;r44=r136;break L4}break};case 5:{r150=r19>>>0>16;if(r150){r151=0}else{r152=r19-1|0;r153=r6>>>(r152>>>0);r151=r153}r154=r151&1;r155=(r154|0)==0;r156=r1+30|0;r157=HEAP16[r156>>1];r158=r157&-2;r159=r157|1;r160=r155?r158:r159;HEAP16[r156>>1]=r160;r161=r151>>>1;r162=r161&65535;_e86_set_flg_szp_16(r1,r162);r163=r6&32768;r164=(r163|0)==0;r165=HEAP16[r156>>1];if(r164){r166=r165&-2049;HEAP16[r156>>1]=r166;r44=r162;break L4}else{r167=r165|2048;HEAP16[r156>>1]=r167;r44=r162;break L4}break};default:{r44=0}}}while(0);_e86_set_ea16(r1,r44);r168=r1+1184|0;r169=HEAP32[r168>>2];r170=(r169|0)!=0;r171=r170?17:5;r172=r1+1200|0;r173=HEAP32[r172>>2];r174=r173+r19|0;r175=r174+r171|0;HEAP32[r172>>2]=r175;r176=HEAP16[r7>>1];r177=r176&65535;r178=r177+2|0;r21=r178;return r21}function _op_c8(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r1+14|0;_e86_push(r1,HEAP16[r2>>1]);r3=r1+12|0;r4=HEAP16[r3>>1];r5=HEAP8[r1+131|0]&31;r6=r5&255;if(r5<<24>>24!=0){if((r5&255)>1){r5=(r4&65535)<<4;r7=r1+80|0;r8=r1+76|0;r9=r1+72|0;r10=r1+44|0;r11=r1+32|0;r12=1;r13=HEAP16[r2>>1];while(1){r14=r13-2&65535;r15=HEAP32[r7>>2]&(r14&65535)+r5;r16=r15+1|0;if(r16>>>0<HEAP32[r8>>2]>>>0){r17=HEAP32[r9>>2];r18=HEAPU8[r17+r16|0]<<8|HEAPU8[r17+r15|0]}else{r18=FUNCTION_TABLE[HEAP32[r10>>2]](HEAP32[r11>>2],r15)}_e86_push(r1,r18);r15=r12+1|0;if(r15>>>0<r6>>>0){r12=r15;r13=r14}else{break}}}_e86_push(r1,r4)}HEAP16[r2>>1]=r4;HEAP16[r3>>1]=r4-(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);if((r6|0)==0){r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+15;return 4}else if((r6|0)==1){r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+25;return 4}else{r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+(r6<<4|6);return 4}}function _op_c9(r1){var r2;r2=r1+14|0;HEAP16[r1+12>>1]=HEAP16[r2>>1];HEAP16[r2>>1]=_e86_pop(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+8;return 1}function _e86_get_mem_uint8(r1,r2){return-86}function _e86_get_mem_uint16(r1,r2){return-21846}function _e86_set_mem_uint8(r1,r2,r3){return}function _e86_set_mem_uint16(r1,r2,r3){return}function _e86_new(){var r1,r2,r3;r1=_malloc(1224);if((r1|0)==0){r2=0;return r2}HEAP32[r1>>2]=1;HEAP32[r1+32>>2]=0;HEAP32[r1+36>>2]=1172;HEAP32[r1+44>>2]=1120;HEAP32[r1+40>>2]=492;HEAP32[r1+48>>2]=524;HEAP32[r1+52>>2]=0;HEAP32[r1+56>>2]=1172;HEAP32[r1+64>>2]=1120;HEAP32[r1+60>>2]=492;HEAP32[r1+68>>2]=524;HEAP32[r1+72>>2]=0;HEAP32[r1+76>>2]=0;HEAP32[r1+80>>2]=1048575;r3=r1+84|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+20>>2]=0;HEAP32[r3+24>>2]=0;HEAP32[r1+116>>2]=4;HEAP32[r1+120>>2]=6;HEAP8[r1+156|0]=0;HEAP32[r1+152>>2]=0;_memcpy(r1+160|0,5816,1024)|0;r3=r1+1208|0;HEAP32[r1+1200>>2]=0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;r2=r1;return r2}function _e86_set_8086(r1){var r2,r3;HEAP32[r1>>2]=1;r2=0;while(1){HEAP32[r1+160+(r2<<2)>>2]=HEAP32[5816+(r2<<2)>>2];r3=r2+1|0;if(r3>>>0<256){r2=r3}else{break}}HEAP32[r1+116>>2]=6;HEAP32[r1+120>>2]=6;HEAP32[r1+124>>2]=0;return}function _e86_set_inta_fct(r1,r2,r3){HEAP32[r1+84>>2]=r2;HEAP32[r1+88>>2]=r3;return}function _e86_set_ram(r1,r2,r3){HEAP32[r1+72>>2]=r2;HEAP32[r1+76>>2]=r3;return}function _e86_set_mem(r1,r2,r3,r4,r5,r6){HEAP32[r1+32>>2]=r2;HEAP32[r1+36>>2]=r3;HEAP32[r1+40>>2]=r4;HEAP32[r1+44>>2]=r5;HEAP32[r1+48>>2]=r6;return}function _e86_set_prt(r1,r2,r3,r4,r5,r6){HEAP32[r1+52>>2]=r2;HEAP32[r1+56>>2]=r3;HEAP32[r1+60>>2]=r4;HEAP32[r1+64>>2]=r5;HEAP32[r1+68>>2]=r6;return}function _e86_get_reg(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;r5=(HEAP8[r2]|0)==37?r2+1|0:r2;r2=0;while(1){if((_strcmp(r5,HEAP32[7216+(r2<<2)>>2])|0)==0){r4=4;break}r6=r2+1|0;if((_strcmp(r5,HEAP32[7184+(r2<<2)>>2])|0)==0){r4=6;break}if(r6>>>0<8){r2=r6}else{r7=0;r4=8;break}}if(r4==4){HEAP32[r3>>2]=HEAPU16[r1+4+((r2&7)<<1)>>1];r8=0;return r8}else if(r4==6){r6=HEAPU16[r1+4+((r2&3)<<1)>>1];HEAP32[r3>>2]=((r2&4|0)!=0?r6>>>8:r6)&255;r8=0;return r8}else if(r4==8){while(1){r4=0;r6=r7+1|0;if((_strcmp(r5,HEAP32[400+(r7<<2)>>2])|0)==0){r4=9;break}if(r6>>>0<4){r7=r6;r4=8}else{break}}if(r4==9){HEAP32[r3>>2]=HEAPU16[r1+20+((r7&3)<<1)>>1];r8=0;return r8}if((_strcmp(r5,13608)|0)==0){HEAP32[r3>>2]=HEAPU16[r1+28>>1];r8=0;return r8}if((_strcmp(r5,21816)|0)!=0){r8=1;return r8}HEAP32[r3>>2]=HEAPU16[r1+30>>1];r8=0;return r8}}function _e86_set_reg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=(HEAP8[r2]|0)==37?r2+1|0:r2;r2=0;while(1){if((_strcmp(r5,HEAP32[7216+(r2<<2)>>2])|0)==0){r4=4;break}r6=r2+1|0;if((_strcmp(r5,HEAP32[7184+(r2<<2)>>2])|0)==0){r4=6;break}if(r6>>>0<8){r2=r6}else{r7=0;r4=11;break}}if(r4==4){HEAP16[r1+4+((r2&7)<<1)>>1]=r3;r8=0;return r8}else if(r4==6){r6=r1+4+((r2&3)<<1)|0;r9=HEAP16[r6>>1];if((r2&4|0)==0){r10=(r9&-256&65535|r3&255)&65535}else{r10=(r9&255|r3<<8)&65535}HEAP16[r6>>1]=r10;r8=0;return r8}else if(r4==11){while(1){r4=0;r10=r7+1|0;if((_strcmp(r5,HEAP32[400+(r7<<2)>>2])|0)==0){r4=12;break}if(r10>>>0<4){r7=r10;r4=11}else{break}}if(r4==12){HEAP16[r1+20+((r7&3)<<1)>>1]=r3;r8=0;return r8}if((_strcmp(r5,13608)|0)==0){HEAP16[r1+28>>1]=r3;r8=0;return r8}if((_strcmp(r5,21816)|0)!=0){r8=1;return r8}HEAP16[r1+30>>1]=r3;r8=0;return r8}}function _e86_trap(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=HEAP32[r1+108>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+92>>2],r2&255)}r3=r1+144|0;r4=HEAP32[r3>>2];if((r4&32|0)==0){r5=HEAP16[r1+28>>1]}else{r6=HEAP16[r1+112>>1];if((HEAP32[r1>>2]&1|0)==0){r7=r6}else{r7=r6+(((r4>>>1&1^1)&65535|(r4&12|0)==0)^1)&65535}HEAP32[r3>>2]=0;r5=r7}r7=r1+30|0;_e86_push(r1,HEAP16[r7>>1]);r3=r1+22|0;_e86_push(r1,HEAP16[r3>>1]);_e86_push(r1,r5);r5=r2<<2&1020;r2=r1+80|0;r4=HEAP32[r2>>2];r6=r4&(r5&65535);r8=r6|1;r9=r1+76|0;r10=HEAP32[r9>>2];if(r8>>>0<r10>>>0){r11=HEAP32[r1+72>>2];r12=HEAPU8[r11+r8|0]<<8|HEAPU8[r11+r6|0];r13=r4;r14=r10}else{r10=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r6);r12=r10;r13=HEAP32[r2>>2];r14=HEAP32[r9>>2]}HEAP16[r1+28>>1]=r12;r12=r13&((r5|2)&65535);r5=r12|1;if(r5>>>0<r14>>>0){r14=HEAP32[r1+72>>2];r15=HEAPU8[r14+r5|0]<<8|HEAPU8[r14+r12|0];HEAP16[r3>>1]=r15;r16=HEAP16[r7>>1];r17=r16&-769;HEAP16[r7>>1]=r17;_e86_pq_init(r1);return}else{r15=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r12);HEAP16[r3>>1]=r15;r16=HEAP16[r7>>1];r17=r16&-769;HEAP16[r7>>1]=r17;_e86_pq_init(r1);return}}function _e86_irq(r1,r2){HEAP8[r1+156|0]=r2<<24>>24!=0|0;return}function _e86_undefined(r1){var r2,r3;r2=HEAP32[r1+104>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+92>>2],HEAP8[r1+128|0],HEAP8[r1+129|0])}if((HEAP32[r1>>2]&8|0)==0){r3=1;return r3}_e86_trap(r1,6);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+50;r3=0;return r3}function _e86_get_opcnt(r1){var r2;r2=r1+1216|0;return tempRet0=HEAP32[r2+4>>2],HEAP32[r2>>2]}function _e86_reset(r1){var r2;r2=r1+1216|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r1+80>>2]=1048575;_memset(r1+4|0,0,24)|0;HEAP16[r1+22>>1]=-4096;HEAP16[r1+28>>1]=-16;HEAP16[r1+30>>1]=0;HEAP32[r1+124>>2]=0;HEAP8[r1+156|0]=0;HEAP32[r1+152>>2]=0;HEAP32[r1+144>>2]=0;return}function _e86_execute(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=r1+152|0;if((HEAP32[r2>>2]|0)!=0){r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r4=r1+156|0;if((HEAP8[r4]|0)==0){return}if((HEAP16[r1+30>>1]&512)==0){return}HEAP8[r4]=0;HEAP32[r2>>2]=0;r4=HEAP32[r1+88>>2];if((r4|0)==0){return}r5=FUNCTION_TABLE[r4](HEAP32[r1+84>>2]);HEAP32[r3>>2]=HEAP32[r3>>2]+61;_e86_trap(r1,r5&255);return}r5=r1+144|0;if((HEAP32[r5>>2]&32|0)==0){HEAP32[r5>>2]=0;r3=r1+28|0;HEAP16[r1+112>>1]=HEAP16[r3>>1];r6=r3}else{r6=r1+28|0}r3=r1+30|0;r4=HEAP16[r3>>1];r7=r1+156|0;r8=HEAP8[r7];r9=r1+157|0;HEAP8[r9]=1;r10=r1+100|0;r11=r1+128|0;r12=r1+1200|0;r13=r1+92|0;r14=r1+129|0;while(1){_e86_pq_fill(r1);HEAP32[r5>>2]=HEAP32[r5>>2]&-2;r15=HEAP32[r10>>2];if((r15|0)!=0){FUNCTION_TABLE[r15](HEAP32[r13>>2],HEAP8[r11],HEAP8[r14])}r15=FUNCTION_TABLE[HEAP32[r1+160+((HEAP8[r11]&255)<<2)>>2]](r1);if((r15|0)==0){HEAP32[r12>>2]=HEAP32[r12>>2]+10}else{HEAP16[r6>>1]=HEAPU16[r6>>1]+r15;_e86_pq_adjust(r1,r15)}if((HEAP32[r5>>2]&1|0)==0){break}}r5=r1+1216|0;r6=_i64Add(HEAP32[r5>>2],HEAP32[r5+4>>2],1,0);HEAP32[r5>>2]=r6;HEAP32[r5+4>>2]=tempRet0;if((HEAP8[r9]|0)==0){return}r9=HEAP16[r3>>1];if((r4&256&r9)<<16>>16!=0){_e86_trap(r1,1);return}if(r8<<24>>24==0){return}if((HEAP8[r7]|0)==0){return}if((r9&512)==0){return}HEAP8[r7]=0;HEAP32[r2>>2]=0;r2=HEAP32[r1+88>>2];if((r2|0)==0){return}r7=FUNCTION_TABLE[r2](HEAP32[r1+84>>2]);HEAP32[r12>>2]=HEAP32[r12>>2]+61;_e86_trap(r1,r7&255);return}function _e86_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=r1+1200|0;r4=HEAP32[r3>>2];r5=r1+1208|0;if(r4>>>0>r2>>>0){r6=r2;r7=r4}else{r8=r2;r2=r4;while(1){r4=r8-r2|0;r9=_i64Add(HEAP32[r5>>2],HEAP32[r5+4>>2],r2,0);HEAP32[r5>>2]=r9;HEAP32[r5+4>>2]=tempRet0;HEAP32[r3>>2]=0;_e86_execute(r1);r9=HEAP32[r3>>2];if(r4>>>0<r9>>>0){r6=r4;r7=r9;break}else{r8=r4;r2=r9}}}HEAP32[r3>>2]=r7-r6;r7=_i64Add(HEAP32[r5>>2],HEAP32[r5+4>>2],r6,0);HEAP32[r5>>2]=r7;HEAP32[r5+4>>2]=tempRet0;return}function _ea_get00(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+16>>1]+HEAP16[r1+10>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+7;return}function _ea_get01(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+18>>1]+HEAP16[r1+10>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+8;return}function _ea_get02(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];HEAP16[r1+1194>>1]=HEAP16[r1+16>>1]+HEAP16[r1+14>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+8;return}function _ea_get03(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];HEAP16[r1+1194>>1]=HEAP16[r1+18>>1]+HEAP16[r1+14>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+7;return}function _ea_get04(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+16>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+5;return}function _ea_get05(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+18>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+5;return}function _ea_get06(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP32[r1+1188>>2];HEAP16[r1+1194>>1]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+6;return}function _ea_get07(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+10>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+5;return}function _ea_get08(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=HEAPU16[r1+16>>1]+HEAPU16[r1+10>>1]+((r2&128|0)!=0?r2|65280:r2);HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return}function _ea_get09(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=HEAPU16[r1+18>>1]+HEAPU16[r1+10>>1]+((r2&128|0)!=0?r2|65280:r2);HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;return}function _ea_get0a(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=HEAPU16[r1+16>>1]+HEAPU16[r1+14>>1]+((r2&128|0)!=0?r2|65280:r2);HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;return}function _ea_get0b(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=HEAPU16[r1+18>>1]+HEAPU16[r1+14>>1]+((r2&128|0)!=0?r2|65280:r2);HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return}function _ea_get0c(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=((r2&128|0)!=0?r2|65280:r2)+HEAPU16[r1+16>>1];HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get0d(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=((r2&128|0)!=0?r2|65280:r2)+HEAPU16[r1+18>>1];HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get0e(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=((r2&128|0)!=0?r2|65280:r2)+HEAPU16[r1+14>>1];HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get0f(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=((r2&128|0)!=0?r2|65280:r2)+HEAPU16[r1+10>>1];HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get10(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+16>>1]+HEAP16[r1+10>>1]&65535;r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return}function _ea_get11(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+18>>1]+HEAP16[r1+10>>1]&65535;r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;return}function _ea_get12(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAP16[r1+16>>1]+HEAP16[r1+14>>1]&65535;r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;return}function _ea_get13(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAP16[r1+18>>1]+HEAP16[r1+14>>1]&65535;r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return}function _ea_get14(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+16>>1];r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get15(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+18>>1];r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get16(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAP16[r1+14>>1];r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get17(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+10>>1];r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get18(r1){HEAP32[r1+1184>>2]=0;HEAP16[r1+1192>>1]=0;HEAP16[r1+1194>>1]=HEAP8[HEAP32[r1+1188>>2]]&7;HEAP16[r1+1196>>1]=1;HEAP32[r1+1200>>2]=0;return}function _e86_get_ea_ptr(r1,r2){var r3;HEAP32[r1+1188>>2]=r2;r3=HEAPU8[r2];FUNCTION_TABLE[HEAP32[6840+((r3>>>3&24|r3&7)<<2)>>2]](r1);if((HEAP32[r1+144>>2]&2|0)==0){return}HEAP16[r1+1192>>1]=HEAP16[r1+148>>1];r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;return}function _e86_get_ea8(r1){var r2,r3,r4;if((HEAP32[r1+1184>>2]|0)==0){r2=HEAPU16[r1+1194>>1];r3=HEAPU16[r1+4+((r2&3)<<1)>>1];r4=((r2&4|0)!=0?r3>>>8:r3)&255;return r4}r3=(HEAPU16[r1+1192>>1]<<4)+HEAPU16[r1+1194>>1]&HEAP32[r1+80>>2];if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP8[HEAP32[r1+72>>2]+r3|0];return r4}else{r4=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r3);return r4}}function _e86_get_ea16(r1){var r2,r3,r4,r5;r2=0;if((HEAP32[r1+1184>>2]|0)==0){r3=HEAP16[r1+4+((HEAP16[r1+1194>>1]&7)<<1)>>1];return r3}r4=HEAP16[r1+1194>>1];if(!((HEAP32[r1>>2]&64|0)==0?(r4&1)==0:0)){r2=4}if(r2==4){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4}r2=(HEAPU16[r1+1192>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r2+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=HEAP32[r1+72>>2];r3=HEAPU8[r5+r4|0]<<8|HEAPU8[r5+r2|0];return r3}else{r3=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);return r3}}function _e86_set_ea8(r1,r2){var r3,r4,r5;if((HEAP32[r1+1184>>2]|0)==0){r3=HEAPU16[r1+1194>>1];r4=r1+4+((r3&3)<<1)|0;r5=HEAP16[r4>>1];if((r3&4|0)==0){HEAP16[r4>>1]=r5&-256|r2&255;return}else{HEAP16[r4>>1]=r5&255|(r2&255)<<8;return}}else{r5=(HEAPU16[r1+1192>>1]<<4)+HEAPU16[r1+1194>>1]&HEAP32[r1+80>>2];if(r5>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r5|0]=r2;return}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r5,r2);return}}}function _e86_set_ea16(r1,r2){var r3,r4,r5;r3=0;if((HEAP32[r1+1184>>2]|0)==0){HEAP16[r1+4+((HEAP16[r1+1194>>1]&7)<<1)>>1]=r2;return}r4=HEAP16[r1+1194>>1];if(!((HEAP32[r1>>2]&64|0)==0?(r4&1)==0:0)){r3=4}if(r3==4){r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4}r3=(HEAPU16[r1+1192>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;return}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);return}}function _e86_set_flg_szp_8(r1,r2){var r3,r4;r3=r2&255;if(r2<<24>>24==0){r4=64}else{r4=(r3&128|0)==0?0:128}r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-197|((HEAP8[r3+672|0]|0)==0?r4|4:r4);return}function _e86_set_flg_szp_16(r1,r2){var r3,r4;r3=r2&65535;if(r2<<16>>16==0){r4=64}else{r4=(r3&32768|0)==0?0:128}r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-197|((HEAP8[672+(r3&255)|0]|0)==0?r4|4:r4);return}function _e86_set_flg_log_8(r1,r2){var r3,r4;r3=r2&255;if(r2<<24>>24==0){r4=64}else{r4=(r3&128|0)==0?0:128}r2=r1+30|0;HEAP16[r2>>1]=((HEAP8[r3+672|0]|0)==0?r4|4:r4)&196|HEAP16[r2>>1]&-2246;return}function _e86_set_flg_log_16(r1,r2){var r3,r4;r3=r2&65535;if(r2<<16>>16==0){r4=64}else{r4=(r3&32768|0)==0?0:128}r2=r1+30|0;HEAP16[r2>>1]=((HEAP8[672+(r3&255)|0]|0)==0?r4|4:r4)&196|HEAP16[r2>>1]&-2246;return}function _e86_set_flg_add_8(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r2&255;r5=r3&255;r6=r3+r2&255;r7=r6&255;if(r6<<24>>24==0){r8=64}else{r8=(r7&128|0)==0?0:128}r6=r1+30|0;r1=r5+r4&65535;HEAP16[r6>>1]=((r3^r2)&255^r1)&16|(r1&65535)>255|((r1^r4)&(r1^r5))<<4&2048|HEAP16[r6>>1]&-2262|((HEAP8[r7+672|0]|0)==0?r8|4:r8)&196;return}function _e86_set_flg_add_16(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r2&65535;r5=r3&65535;r6=r3+r2&65535;r7=r6&65535;if(r6<<16>>16==0){r8=64}else{r8=(r7&32768|0)==0?0:128}r6=r1+30|0;r1=r5+r4|0;HEAP16[r6>>1]=((r3^r2)&65535^r1)&16|r1>>>0>65535|((r1^r4)&(r1^r5))>>>4&2048|HEAP16[r6>>1]&-2262|((HEAP8[672+(r7&255)|0]|0)==0?r8|4:r8)&196;return}function _e86_set_flg_adc_8(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=r2&255;r6=r3&255;r7=(r3+r2&255)+r4&255;r8=r7&255;if(r7<<24>>24==0){r9=64}else{r9=(r8&128|0)==0?0:128}r7=r1+30|0;r1=(r6+r5&65535)+(r4&255)&65535;HEAP16[r7>>1]=(r1^(r3^r2)&255)&16|(r1&65535)>255|((r1^r5)&(r1^r6))<<4&2048|HEAP16[r7>>1]&-2262|((HEAP8[r8+672|0]|0)==0?r9|4:r9)&196;return}function _e86_set_flg_adc_16(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=r2&65535;r6=r3&65535;r7=(r3+r2&65535)+r4&65535;r8=r7&65535;if(r7<<16>>16==0){r9=64}else{r9=(r8&32768|0)==0?0:128}r7=r1+30|0;r1=r6+r5+(r4&65535)|0;HEAP16[r7>>1]=(r1^(r3^r2)&65535)&16|r1>>>0>65535|((r1^r5)&(r1^r6))>>>4&2048|HEAP16[r7>>1]&-2262|((HEAP8[672+(r8&255)|0]|0)==0?r9|4:r9)&196;return}function _e86_set_flg_sbb_8(r1,r2,r3,r4){var r5,r6,r7;r5=r2&255;r6=r5-(r3&255)-(r4&255)|0;if((r6&255)<<24>>24==0){r7=64}else{r7=(r6&128|0)==0?0:128}r4=r1+30|0;r1=(r3^r2)&255;HEAP16[r4>>1]=(r6^r1)&16|(r6&65280|0)!=0|((r6^r5)&r1&65535)<<4&2048|HEAP16[r4>>1]&-2262|((HEAP8[672+(r6&255)|0]|0)==0?r7|4:r7)&196;return}function _e86_set_flg_sbb_16(r1,r2,r3,r4){var r5,r6,r7,r8;r5=r2&65535;r6=r2-r3&65535;r7=r6-r4&65535;if(r6<<16>>16==r4<<16>>16){r8=64}else{r8=(r7&32768|0)==0?0:128}r6=r1+30|0;r1=r5-(r3&65535)-(r4&65535)|0;r4=(r3^r2)&65535;HEAP16[r6>>1]=(r1^r4)&16|r1>>>0>65535|((r1^r5)&r4)>>>4&2048|HEAP16[r6>>1]&-2262|((HEAP8[672+(r7&255)|0]|0)==0?r8|4:r8)&196;return}function _e86_set_flg_sub_8(r1,r2,r3){var r4,r5,r6,r7;r4=r2&255;r5=r4-(r3&255)|0;if((r5&255)<<24>>24==0){r6=64}else{r6=(r5&128|0)==0?0:128}r7=r1+30|0;r1=(r3^r2)&255;HEAP16[r7>>1]=(r1^r5)&16|(r5&65280|0)!=0|((r5^r4)&r1&65535)<<4&2048|HEAP16[r7>>1]&-2262|((HEAP8[672+(r5&255)|0]|0)==0?r6|4:r6)&196;return}function _e86_set_flg_sub_16(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r2&65535;r5=r2-r3&65535;if(r2<<16>>16==r3<<16>>16){r6=64}else{r6=(r5&32768|0)==0?0:128}r7=r1+30|0;r1=r4-(r3&65535)|0;r8=(r3^r2)&65535;HEAP16[r7>>1]=(r8^r1)&16|r1>>>0>65535|((r1^r4)&r8)>>>4&2048|HEAP16[r7>>1]&-2262|((HEAP8[672+(r5&255)|0]|0)==0?r6|4:r6)&196;return}function _e86_push(r1,r2){var r3,r4,r5;r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;return}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);return}}function _e86_pop(r1){var r2,r3,r4,r5;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];return r5}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);return r5}}function _op_00(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(r4&4|0)!=0?(r2&65535)>>>8:r2;_e86_set_ea8(r1,r5+(r3&255)&255);_e86_set_flg_add_8(r1,r3,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_01(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];_e86_set_ea16(r1,r4+r3&65535);_e86_set_flg_add_16(r1,r3,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_02(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=r2?(r3&65535)>>>8:r3;r3=_e86_get_ea8(r1);r6=r5+(r3&255)&65535;r7=HEAP16[r4>>1];if(r2){r8=r6<<8|r7&255}else{r8=r6&255|r7&-256}HEAP16[r4>>1]=r8;_e86_set_flg_add_8(r1,r5&255,r3);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_03(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1);HEAP16[r2>>1]=r4+r3;_e86_set_flg_add_16(r1,r3,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_04(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAP8[r1+129|0];HEAP16[r2>>1]=(r4&255)+r3&255|r3&-256;_e86_set_flg_add_8(r1,r3&255,r4);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 2}function _op_05(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];HEAP16[r2>>1]=r4+(r3&65535);_e86_set_flg_add_16(r1,r3,r4&65535);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 3}function _op_06(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+20>>1];r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}}function _op_07(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];r6=r1+20|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+8|0;HEAP32[r7>>2]=r9;return 1}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r6=r1+20|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+8|0;HEAP32[r7>>2]=r9;return 1}}function _op_08(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(((r4&4|0)!=0?(r2&65535)>>>8:r2)|r3&255)&255;_e86_set_ea8(r1,r5);_e86_set_flg_log_8(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_09(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]|r3;_e86_set_ea16(r1,r4);_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_0a(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=(r2?(r3&65535)>>>8:r3)&255|_e86_get_ea8(r1)&255;r3=HEAP16[r4>>1];if(r2){r6=r5<<8|r3&255}else{r6=r5|r3&-256}HEAP16[r4>>1]=r6;_e86_set_flg_log_8(r1,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_0b(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1)|r3;HEAP16[r2>>1]=r4;_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_0c(r1){var r2,r3;r2=r1+4|0;r3=HEAPU8[r1+129|0]|HEAP16[r2>>1];HEAP16[r2>>1]=r3;_e86_set_flg_log_8(r1,r3&255);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;return 2}function _op_0d(r1){var r2,r3;r2=r1+4|0;r3=HEAPU8[r1+129|0]|HEAP16[r2>>1]|HEAPU8[r1+130|0]<<8;HEAP16[r2>>1]=r3;_e86_set_flg_log_16(r1,r3);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;return 3}function _op_0e(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+22>>1];r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}}function _op_0f(r1){var r2,r3,r4,r5,r6;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];r6=r1+22|0;HEAP16[r6>>1]=r5;_e86_pq_init(r1);return 1}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r6=r1+22|0;HEAP16[r6>>1]=r5;_e86_pq_init(r1);return 1}}function _op_10(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(r4&4|0)!=0?(r2&65535)>>>8:r2;r2=HEAP16[r1+30>>1]&1;_e86_set_ea8(r1,(r2+(r3&255)&65535)+r5&255);_e86_set_flg_adc_8(r1,r3,r5&255,r2&255);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_11(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];r2=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r4+r3&65535)+r2&65535);_e86_set_flg_adc_16(r1,r3,r4,r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_12(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=r2?(r3&65535)>>>8:r3;r3=_e86_get_ea8(r1);r6=HEAP16[r1+30>>1]&1;r7=(r5+(r3&255)&65535)+r6&65535;r8=HEAP16[r4>>1];if(r2){r9=r7<<8|r8&255}else{r9=r7&255|r8&-256}HEAP16[r4>>1]=r9;_e86_set_flg_adc_8(r1,r5&255,r3,r6&255);r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_13(r1){var r2,r3,r4,r5;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1);r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=(r4+r3&65535)+r5;_e86_set_flg_adc_16(r1,r3,r4,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_14(r1){var r2,r3,r4,r5;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAP8[r1+129|0];r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=((r4&255)+r3&65535)+r5&255|r3&-256;_e86_set_flg_adc_8(r1,r3&255,r4,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;return 2}function _op_15(r1){var r2,r3,r4,r5;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=r4+(r3&65535)+(r5&65535);_e86_set_flg_adc_16(r1,r3,r4&65535,r5);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;return 3}function _op_16(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+24>>1];r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=((r2&65535)<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}}function _op_17(r1){var r2,r3,r4,r5,r6;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=r1+24|0;r4=(HEAPU16[r2>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r4+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r5=HEAP32[r1+72>>2];r6=HEAPU8[r5+r3|0]<<8|HEAPU8[r5+r4|0]}else{r6=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r4)}HEAP16[r2>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;HEAP8[r1+157|0]=0;return 1}function _op_18(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(r4&4|0)!=0?(r2&65535)>>>8:r2;r2=HEAP16[r1+30>>1]&1;_e86_set_ea8(r1,((r3&255)-r2&65535)-r5&255);_e86_set_flg_sbb_8(r1,r3,r5&255,r2&255);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_19(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];r2=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r3-r4&65535)-r2&65535);_e86_set_flg_sbb_16(r1,r3,r4,r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_1a(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=r2?(r3&65535)>>>8:r3;r3=_e86_get_ea8(r1);r6=HEAP16[r1+30>>1]&1;r7=(r5-(r3&255)&65535)-r6&65535;r8=HEAP16[r4>>1];if(r2){r9=r7<<8|r8&255}else{r9=r7&255|r8&-256}HEAP16[r4>>1]=r9;_e86_set_flg_sbb_8(r1,r5&255,r3,r6&255);r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_1b(r1){var r2,r3,r4,r5;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1);r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=(r3-r4&65535)-r5;_e86_set_flg_sbb_16(r1,r3,r4,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_1c(r1){var r2,r3,r4,r5;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAP8[r1+129|0];r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=(r3-(r4&255)&65535)-r5&255|r3&-256;_e86_set_flg_sbb_8(r1,r3&255,r4,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;return 2}function _op_1d(r1){var r2,r3,r4,r5;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=(r3&65535)-r4-(r5&65535);_e86_set_flg_sbb_16(r1,r3,r4&65535,r5);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;return 3}function _op_1e(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+26>>1];r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}}function _op_1f(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];r6=r1+26|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+8|0;HEAP32[r7>>2]=r9;return 1}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r6=r1+26|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+8|0;HEAP32[r7>>2]=r9;return 1}}function _op_20(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=((r4&4|0)!=0?(r2&65535)>>>8:r2)&(r3&255)&255;_e86_set_ea8(r1,r5);_e86_set_flg_log_8(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_21(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]&r3;_e86_set_ea16(r1,r4);_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_22(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=(r2?(r3&65535)>>>8:r3)&(_e86_get_ea8(r1)&255);r3=HEAP16[r4>>1];if(r2){r6=r5<<8|r3&255}else{r6=r5|r3&-256}HEAP16[r4>>1]=r6;_e86_set_flg_log_8(r1,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_23(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1)&r3;HEAP16[r2>>1]=r4;_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_24(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+129|0]&r3;HEAP16[r2>>1]=r4|r3&-256;_e86_set_flg_log_8(r1,r4&255);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 2}function _op_25(r1){var r2,r3;r2=r1+4|0;r3=(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&HEAP16[r2>>1];HEAP16[r2>>1]=r3;_e86_set_flg_log_16(r1,r3);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;return 3}function _op_26(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|3;HEAP16[r1+148>>1]=HEAP16[r1+20>>1];return 1}function _op_27(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=0;r3=r1+4|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5&255;r7=r1+30|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r9&1;if((r5&14)>>>0<=9?(r9&16|0)==0:0){r11=r6;r12=r10;r13=r8&-17}else{r2=3}if(r2==3){r2=r6+6|0;r11=r2;r12=(r2&65280|0)!=0|r10;r13=r8|16}HEAP16[r7>>1]=r13;if((r11&240)>>>0<145&(r12|0)==0){r14=r11;r15=r13&-2}else{r14=r11+96|0;r15=r13|1}HEAP16[r7>>1]=r15;HEAP16[r3>>1]=r4&-256&65535|r14&255;_e86_set_flg_szp_8(r1,r14&255);r14=r1+1200|0;HEAP32[r14>>2]=HEAP32[r14>>2]+4;return 1}function _op_28(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(r4&4|0)!=0?(r2&65535)>>>8:r2;_e86_set_ea8(r1,(r3&255)-r5&255);_e86_set_flg_sub_8(r1,r3,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_29(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];_e86_set_ea16(r1,r3-r4&65535);_e86_set_flg_sub_16(r1,r3,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_2a(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=r2?(r3&65535)>>>8:r3;r3=_e86_get_ea8(r1);r6=r5-(r3&255)&65535;r7=HEAP16[r4>>1];if(r2){r8=r6<<8|r7&255}else{r8=r6&255|r7&-256}HEAP16[r4>>1]=r8;_e86_set_flg_sub_8(r1,r5&255,r3);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_2b(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1);HEAP16[r2>>1]=r3-r4;_e86_set_flg_sub_16(r1,r3,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_2c(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAP8[r1+129|0];HEAP16[r2>>1]=r3-(r4&255)&255|r3&-256;_e86_set_flg_sub_8(r1,r3&255,r4);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 2}function _op_2d(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];HEAP16[r2>>1]=(r3&65535)-r4;_e86_set_flg_sub_16(r1,r3,r4&65535);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 3}function _op_2e(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|3;HEAP16[r1+148>>1]=HEAP16[r1+22>>1];return 1}function _op_2f(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=0;r3=r1+4|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5&255;r7=r1+30|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r9&1;if((r5&14)>>>0<=9?(r9&16|0)==0:0){r11=r6;r12=r10;r13=r8&-17}else{r2=3}if(r2==3){r2=r6-6|0;r11=r2;r12=(r2&65280|0)!=0|r10;r13=r8|16}HEAP16[r7>>1]=r13;if((r11&240)>>>0<145&(r12|0)==0){r14=r11;r15=r13&-2}else{r14=r11-96|0;r15=r13|1}HEAP16[r7>>1]=r15;HEAP16[r3>>1]=r4&-256&65535|r14&255;_e86_set_flg_szp_8(r1,r14&255);r14=r1+1200|0;HEAP32[r14>>2]=HEAP32[r14>>2]+4;return 1}function _op_30(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(((r4&4|0)!=0?(r2&65535)>>>8:r2)^r3&255)&255;_e86_set_ea8(r1,r5);_e86_set_flg_log_8(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_31(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]^r3;_e86_set_ea16(r1,r4);_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_32(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=(r2?(r3&65535)>>>8:r3)&255^_e86_get_ea8(r1)&255;r3=HEAP16[r4>>1];if(r2){r6=r5<<8|r3&255}else{r6=r5|r3&-256}HEAP16[r4>>1]=r6;_e86_set_flg_log_8(r1,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_33(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1)^r3;HEAP16[r2>>1]=r4;_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_34(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+129|0]^r3&255;HEAP16[r2>>1]=r4|r3&-256;_e86_set_flg_log_8(r1,r4&255);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 2}function _op_35(r1){var r2,r3;r2=r1+4|0;r3=(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])^HEAP16[r2>>1];HEAP16[r2>>1]=r3;_e86_set_flg_log_16(r1,r3);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;return 3}function _op_36(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|3;HEAP16[r1+148>>1]=HEAP16[r1+24>>1];return 1}function _op_37(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=r1+4|0;r4=HEAPU16[r3>>1];r5=r4&255;r6=r4>>>8;r7=r1+30|0;r8=HEAP16[r7>>1];if((r4&14)>>>0<=9?(r8&16)==0:0){HEAP16[r7>>1]=r8&-18;r9=r5;r10=r6}else{r2=3}if(r2==3){HEAP16[r1+30>>1]=r8|17;r9=r5+6|0;r10=r6+1|0}HEAP16[r3>>1]=r9&15|r10<<8;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+8;return 1}function _op_38(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];_e86_set_flg_sub_8(r1,r3,((r4&4|0)!=0?(r2&65535)>>>8:r2)&255);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_39(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);_e86_set_flg_sub_16(r1,r3,HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_3a(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r3&3)<<1)>>1];_e86_set_flg_sub_8(r1,((r3&4|0)!=0?(r2&65535)>>>8:r2)&255,_e86_get_ea8(r1));r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_3b(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];_e86_set_flg_sub_16(r1,r3,_e86_get_ea16(r1));r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_3c(r1){var r2;_e86_set_flg_sub_8(r1,HEAP16[r1+4>>1]&255,HEAP8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_3d(r1){var r2;_e86_set_flg_sub_16(r1,HEAP16[r1+4>>1],HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_3e(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|3;HEAP16[r1+148>>1]=HEAP16[r1+26>>1];return 1}function _op_3f(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=r1+4|0;r4=HEAPU16[r3>>1];r5=r4&255;r6=r4>>>8;r7=r1+30|0;r8=HEAP16[r7>>1];if((r4&14)>>>0<=9?(r8&16)==0:0){HEAP16[r7>>1]=r8&-18;r9=r5;r10=r6}else{r2=3}if(r2==3){HEAP16[r1+30>>1]=r8|17;r9=r5-6|0;r10=r6-1|0}HEAP16[r3>>1]=r9&15|r10<<8;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+8;return 1}function _op_40(r1){var r2,r3,r4;r2=r1+4+((HEAP8[r1+128|0]&7)<<1)|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+1;r2=r1+30|0;r4=HEAP16[r2>>1];_e86_set_flg_add_16(r1,r3,1);r3=HEAP16[r2>>1];HEAP16[r2>>1]=(r3^r4)&1^r3;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+3;return 1}function _op_48(r1){var r2,r3,r4;r2=r1+4+((HEAP8[r1+128|0]&7)<<1)|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3-1;r2=r1+30|0;r4=HEAP16[r2>>1];_e86_set_flg_sub_16(r1,r3,1);r3=HEAP16[r2>>1];HEAP16[r2>>1]=(r3^r4)&1^r3;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+3;return 1}function _op_50(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=HEAP8[r1+128|0]&7;if((r2|0)==4?(HEAP32[r1>>2]&4|0)==0:0){r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r5=r3+1|0;if(r5>>>0<HEAP32[r1+76>>2]>>>0){r6=r1+72|0;HEAP8[HEAP32[r6>>2]+r3|0]=r4;HEAP8[HEAP32[r6>>2]+r5|0]=(r4&65535)>>>8;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r4);r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 1}}r4=HEAP16[r1+4+(r2<<1)>>1];r2=r1+12|0;r3=HEAP16[r2>>1]-2&65535;HEAP16[r2>>1]=r3;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r2|0]=r4;HEAP8[HEAP32[r5>>2]+r3|0]=(r4&65535)>>>8;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r2,r4);r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 1}}function _op_58(r1){var r2,r3,r4,r5;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2)}HEAP16[r1+4+((HEAP8[r1+128|0]&7)<<1)>>1]=r5;r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;return 1}function _op_ud(r1){var r2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;return _e86_undefined(r1)}function _op_66(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;if((HEAP8[r1+129|0]|0)!=102){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;r3=_e86_undefined(r1);return r3}r2=r1+22|0;r4=r1+28|0;r5=HEAP16[r4>>1];r6=HEAP32[r1+96>>2];if((r6|0)==0){r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+16;r8=HEAP16[r4>>1];r9=r8<<16>>16==r5<<16>>16;r10=r9?4:0;return r10}r7=HEAP16[r2>>1];FUNCTION_TABLE[r6](HEAP32[r1+92>>2],HEAP8[r1+130|0],HEAP8[r1+131|0]);r6=HEAP16[r2>>1];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;if(r6<<16>>16==r7<<16>>16){r8=HEAP16[r4>>1];r9=r8<<16>>16==r5<<16>>16;r10=r9?4:0;return r10}else{r3=0;return r3}}function _op_70(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&2048)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_71(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&2048)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_72(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&1)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_73(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&1)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_74(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&64)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_75(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&64)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_76(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&65)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_77(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&65)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_78(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&128)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_79(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&128)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_7a(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&4)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_7b(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&4)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_7c(r1){var r2,r3,r4;r2=HEAPU16[r1+30>>1];if(((r2>>>7^r2>>>11)&1|0)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_7d(r1){var r2,r3,r4;r2=HEAPU16[r1+30>>1];if(((r2>>>7^r2>>>11)&1|0)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_7e(r1){var r2,r3,r4;r2=HEAPU16[r1+30>>1];if(((r2>>>7^r2>>>11)&1|0)==0?(r2&64|0)==0:0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}function _op_7f(r1){var r2,r3,r4;r2=HEAPU16[r1+30>>1];if(((r2>>>7^r2>>>11)&1|0)==0?(r2&64|0)==0:0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}function _op_80(r1){return FUNCTION_TABLE[HEAP32[5784+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_81(r1){return FUNCTION_TABLE[HEAP32[5752+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_83(r1){return FUNCTION_TABLE[HEAP32[5720+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_84(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];_e86_set_flg_log_8(r1,((r4&4|0)!=0?(r2&65535)>>>8:r2)&255&r3);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_85(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);_e86_set_flg_log_16(r1,HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]&r3);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_86(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=_e86_get_ea8(r1);r4=(r3&4|0)!=0;r5=r1+4+((r3&3)<<1)|0;r3=HEAP16[r5>>1];_e86_set_ea8(r1,(r4?(r3&65535)>>>8:r3)&255);r3=HEAP16[r5>>1];if(r4){r6=r3&255|(r2&255)<<8}else{r6=r3&-256|r2&255}HEAP16[r5>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_87(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=_e86_get_ea16(r1);r4=r1+4+(r3<<1)|0;_e86_set_ea16(r1,HEAP16[r4>>1]);HEAP16[r4>>1]=r2;r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_88(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAPU8[r2]>>>3;r2=HEAPU16[r1+4+((r3&3)<<1)>>1];_e86_set_ea8(r1,((r3&4|0)!=0?r2>>>8:r2)&255);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:2)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_89(r1){var r2;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);_e86_set_ea16(r1,HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:2)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_8a(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAPU8[r2]>>>3;r2=_e86_get_ea8(r1);r4=r1+4+((r3&3)<<1)|0;r5=HEAP16[r4>>1];if((r3&4|0)==0){r6=r5&-256|r2&255}else{r6=r5&255|(r2&255)<<8}HEAP16[r4>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?8:2)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_8b(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAPU8[r2]>>>3&7;HEAP16[r1+4+(r3<<1)>>1]=_e86_get_ea16(r1);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?8:2)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_8c(r1){var r2;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);_e86_set_ea16(r1,HEAP16[r1+20+((HEAPU8[r2]>>>3&3)<<1)>>1]);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:2)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_8d(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);if((HEAP32[r1+1184>>2]|0)==0){if((_e86_undefined(r1)|0)==0){r3=0;return r3}}else{HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=HEAP16[r1+1194>>1];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2}r3=HEAPU16[r1+1196>>1]+1|0;return r3}function _op_8e(r1){var r2,r3;r2=r1+129|0;r3=HEAPU8[r2]>>>3&3;_e86_get_ea_ptr(r1,r2);HEAP16[r1+20+(r3<<1)>>1]=_e86_get_ea16(r1);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?8:2)+HEAP32[r2>>2];if((r3|0)==1){_e86_pq_init(r1)}else if((r3|0)==2){HEAP8[r1+157|0]=0}return HEAPU16[r1+1196>>1]+1|0}function _op_8f(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2)}_e86_set_ea16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:8)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_90(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=r1+4+((HEAP8[r1+128|0]&7)<<1)|0;HEAP16[r2>>1]=HEAP16[r4>>1];HEAP16[r4>>1]=r3;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+3;return 1}function _op_98(r1){var r2,r3;r2=r1+4|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&128)!=0?r3|-256:r3&255;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;return 1}function _op_99(r1){var r2;HEAP16[r1+8>>1]=HEAP16[r1+4>>1]>>15;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+5;return 1}function _op_9a(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=r1+22|0;r3=HEAP16[r2>>1];r4=r1+12|0;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r6=r1+24|0;r7=r1+80|0;r8=(HEAPU16[r6>>1]<<4)+(r5&65535)&HEAP32[r7>>2];r5=r8+1|0;r9=r1+76|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=r1+72|0;HEAP8[HEAP32[r10>>2]+r8|0]=r3;HEAP8[HEAP32[r10>>2]+r5|0]=(r3&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r8,r3)}r3=r1+28|0;r8=HEAP16[r3>>1]+5&65535;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r4=(HEAPU16[r6>>1]<<4)+(r5&65535)&HEAP32[r7>>2];r7=r4+1|0;if(r7>>>0<HEAP32[r9>>2]>>>0){r9=r1+72|0;HEAP8[HEAP32[r9>>2]+r4|0]=r8;HEAP8[HEAP32[r9>>2]+r7|0]=(r8&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r8)}HEAP16[r3>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];HEAP16[r2>>1]=HEAPU8[r1+132|0]<<8|HEAPU8[r1+131|0];_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+28;return 0}function _op_9b(r1){var r2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 1}function _op_9c(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=HEAP16[r1+30>>1]&4053;if((HEAP32[r1>>2]&32|0)==0){r3=r2|61442;r4=r3&65535;r5=r1+12|0;r6=HEAP16[r5>>1]-2&65535;HEAP16[r5>>1]=r6;r5=(HEAPU16[r1+24>>1]<<4)+(r6&65535)&HEAP32[r1+80>>2];r6=r5+1|0;if(r6>>>0<HEAP32[r1+76>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r5|0]=r3;HEAP8[HEAP32[r7>>2]+r6|0]=(r4&65535)>>>8;r8=r1+1200|0;r9=HEAP32[r8>>2];r10=r9+10|0;HEAP32[r8>>2]=r10;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r5,r4);r8=r1+1200|0;r9=HEAP32[r8>>2];r10=r9+10|0;HEAP32[r8>>2]=r10;return 1}}else{r4=r2&65535;r5=r1+12|0;r6=HEAP16[r5>>1]-2&65535;HEAP16[r5>>1]=r6;r5=(HEAPU16[r1+24>>1]<<4)+(r6&65535)&HEAP32[r1+80>>2];r6=r5+1|0;if(r6>>>0<HEAP32[r1+76>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r5|0]=r2;HEAP8[HEAP32[r7>>2]+r6|0]=(r4&65535)>>>8;r8=r1+1200|0;r9=HEAP32[r8>>2];r10=r9+10|0;HEAP32[r8>>2]=r10;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r5,r4);r8=r1+1200|0;r9=HEAP32[r8>>2];r10=r9+10|0;HEAP32[r8>>2]=r10;return 1}}}function _op_9d(r1){var r2,r3,r4,r5;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2)}HEAP16[r1+30>>1]=r5&4053|-4094;r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;return 1}function _op_9e(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-256|HEAPU16[r1+4>>1]>>>8&213|2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 1}function _op_9f(r1){var r2;r2=r1+4|0;HEAP16[r2>>1]=((HEAP16[r1+30>>1]&255&-43|2)&255)<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 1}function _op_a0(r1){var r2,r3;r2=((HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];if(r2>>>0<HEAP32[r1+76>>2]>>>0){r3=HEAP8[HEAP32[r1+72>>2]+r2|0]}else{r3=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r2)}r2=r1+4|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-256|r3&255;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+10;return 3}function _op_a1(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=((HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];r6=r1+4|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 3}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r6=r1+4|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 3}}function _op_a2(r1){var r2,r3,r4,r5,r6;r2=HEAP16[r1+4>>1]&255;r3=((HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];if(r3>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r3|0]=r2;r4=r1+1200|0;r5=HEAP32[r4>>2];r6=r5+10|0;HEAP32[r4>>2]=r6;return 3}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r3,r2);r4=r1+1200|0;r5=HEAP32[r4>>2];r6=r5+10|0;HEAP32[r4>>2]=r6;return 3}}function _op_a3(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+4>>1];r3=((HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 3}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 3}}function _op_a4(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=HEAP16[r1+20>>1];r6=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;if((r3&12|0)==0){r7=r1+16|0;r8=r1+80|0;r9=HEAP32[r8>>2];r10=HEAPU16[r7>>1]+((r4&65535)<<4)&r9;r11=r1+76|0;r12=HEAP32[r11>>2];if(r10>>>0<r12>>>0){r13=HEAP8[HEAP32[r1+72>>2]+r10|0];r14=r9;r15=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r10);r13=r12;r14=HEAP32[r8>>2];r15=HEAP32[r11>>2]}r11=r1+18|0;r8=HEAPU16[r11>>1]+((r5&65535)<<4)&r14;if(r8>>>0<r15>>>0){HEAP8[HEAP32[r1+72>>2]+r8|0]=r13}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r8,r13)}HEAP16[r7>>1]=HEAP16[r7>>1]+r6;HEAP16[r11>>1]=HEAP16[r11>>1]+r6;r11=r1+1200|0;HEAP32[r11>>2]=HEAP32[r11>>2]+18;r16=1;return r16}r11=r1+6|0;if((HEAP16[r11>>1]|0)!=0){r7=r1+16|0;r13=r1+80|0;r8=HEAP32[r13>>2];r15=HEAPU16[r7>>1]+((r4&65535)<<4)&r8;r4=r1+76|0;r14=HEAP32[r4>>2];if(r15>>>0<r14>>>0){r17=HEAP8[HEAP32[r1+72>>2]+r15|0];r18=r8;r19=r14}else{r14=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r15);r17=r14;r18=HEAP32[r13>>2];r19=HEAP32[r4>>2]}r4=r1+18|0;r13=HEAPU16[r4>>1]+((r5&65535)<<4)&r18;if(r13>>>0<r19>>>0){HEAP8[HEAP32[r1+72>>2]+r13|0]=r17}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r13,r17)}HEAP16[r7>>1]=HEAP16[r7>>1]+r6;HEAP16[r4>>1]=HEAP16[r4>>1]+r6;r6=HEAP16[r11>>1]-1&65535;HEAP16[r11>>1]=r6;r11=HEAP32[r2>>2];r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+18;if(r6<<16>>16==0){r20=r11}else{HEAP32[r2>>2]=r11|32;r16=0;return r16}}else{r11=r1+1200|0;HEAP32[r11>>2]=HEAP32[r11>>2]+18;r20=r3}HEAP32[r2>>2]=r20&-33;r16=1;return r16}function _op_a5(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=HEAP16[r1+20>>1];r6=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;if((r3&12|0)==0){r7=r1+16|0;r8=r1+80|0;r9=HEAP32[r8>>2];r10=HEAPU16[r7>>1]+((r4&65535)<<4)&r9;r11=r10+1|0;r12=r1+76|0;r13=HEAP32[r12>>2];if(r11>>>0<r13>>>0){r14=HEAP32[r1+72>>2];r15=HEAPU8[r14+r11|0]<<8|HEAPU8[r14+r10|0];r16=r9;r17=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r10);r15=r13;r16=HEAP32[r8>>2];r17=HEAP32[r12>>2]}r12=r1+18|0;r8=HEAPU16[r12>>1]+((r5&65535)<<4)&r16;r16=r8+1|0;if(r16>>>0<r17>>>0){r17=r1+72|0;HEAP8[HEAP32[r17>>2]+r8|0]=r15;HEAP8[HEAP32[r17>>2]+r16|0]=(r15&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r8,r15)}HEAP16[r7>>1]=HEAP16[r7>>1]+r6;HEAP16[r12>>1]=HEAP16[r12>>1]+r6;r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+18;r18=1;return r18}r12=r1+6|0;if((HEAP16[r12>>1]|0)!=0){r7=r1+16|0;r15=r1+80|0;r8=HEAP32[r15>>2];r16=HEAPU16[r7>>1]+((r4&65535)<<4)&r8;r4=r16+1|0;r17=r1+76|0;r13=HEAP32[r17>>2];if(r4>>>0<r13>>>0){r10=HEAP32[r1+72>>2];r19=HEAPU8[r10+r4|0]<<8|HEAPU8[r10+r16|0];r20=r8;r21=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r16);r19=r13;r20=HEAP32[r15>>2];r21=HEAP32[r17>>2]}r17=r1+18|0;r15=HEAPU16[r17>>1]+((r5&65535)<<4)&r20;r20=r15+1|0;if(r20>>>0<r21>>>0){r21=r1+72|0;HEAP8[HEAP32[r21>>2]+r15|0]=r19;HEAP8[HEAP32[r21>>2]+r20|0]=(r19&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r15,r19)}HEAP16[r7>>1]=HEAP16[r7>>1]+r6;HEAP16[r17>>1]=HEAP16[r17>>1]+r6;r6=HEAP16[r12>>1]-1&65535;HEAP16[r12>>1]=r6;r12=HEAP32[r2>>2];r17=r1+1200|0;HEAP32[r17>>2]=HEAP32[r17>>2]+18;if(r6<<16>>16==0){r22=r12}else{HEAP32[r2>>2]=r12|32;r18=0;return r18}}else{r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+18;r22=r3}HEAP32[r2>>2]=r22&-33;r18=1;return r18}function _op_a6(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=HEAP16[r1+20>>1];r6=r1+30|0;r7=(HEAPU16[r6>>1]>>>9&2^2)-1&65535;if((r3&12|0)==0){r8=r1+16|0;r9=r1+80|0;r10=HEAP32[r9>>2];r11=HEAPU16[r8>>1]+((r4&65535)<<4)&r10;r12=r1+76|0;r13=HEAP32[r12>>2];if(r11>>>0<r13>>>0){r14=HEAP8[HEAP32[r1+72>>2]+r11|0];r15=r10;r16=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r11);r14=r13;r15=HEAP32[r9>>2];r16=HEAP32[r12>>2]}r12=r1+18|0;r9=HEAP16[r12>>1];r13=(r9&65535)+((r5&65535)<<4)&r15;if(r13>>>0<r16>>>0){r17=HEAP8[HEAP32[r1+72>>2]+r13|0];r18=r9}else{r9=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r13);r17=r9;r18=HEAP16[r12>>1]}HEAP16[r8>>1]=HEAP16[r8>>1]+r7;HEAP16[r12>>1]=r18+r7;_e86_set_flg_sub_8(r1,r14,r17);r17=r1+1200|0;HEAP32[r17>>2]=HEAP32[r17>>2]+22;r19=1;return r19}r17=r1+6|0;if((HEAP16[r17>>1]|0)!=0){r14=r1+16|0;r18=r1+80|0;r12=HEAP32[r18>>2];r8=HEAPU16[r14>>1]+((r4&65535)<<4)&r12;r4=r1+76|0;r9=HEAP32[r4>>2];if(r8>>>0<r9>>>0){r20=HEAP8[HEAP32[r1+72>>2]+r8|0];r21=r12;r22=r9}else{r9=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r8);r20=r9;r21=HEAP32[r18>>2];r22=HEAP32[r4>>2]}r4=r1+18|0;r18=HEAP16[r4>>1];r9=(r18&65535)+((r5&65535)<<4)&r21;if(r9>>>0<r22>>>0){r23=HEAP8[HEAP32[r1+72>>2]+r9|0];r24=r18}else{r18=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r9);r23=r18;r24=HEAP16[r4>>1]}HEAP16[r14>>1]=HEAP16[r14>>1]+r7;HEAP16[r4>>1]=r24+r7;HEAP16[r17>>1]=HEAP16[r17>>1]-1;_e86_set_flg_sub_8(r1,r20,r23);r23=HEAP32[r2>>2];r20=(HEAP16[r17>>1]|0)==0;r17=r1+1200|0;HEAP32[r17>>2]=HEAP32[r17>>2]+22;if(!r20?(HEAPU16[r6>>1]>>>6&1|0)==(r23>>>2&1|0):0){HEAP32[r2>>2]=r23|32;r19=0;return r19}else{r25=r23}}else{r23=r1+1200|0;HEAP32[r23>>2]=HEAP32[r23>>2]+22;r25=r3}HEAP32[r2>>2]=r25&-33;r19=1;return r19}function _op_a7(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=HEAP16[r1+20>>1];r6=r1+30|0;r7=(HEAPU16[r6>>1]>>>8&4^4)-2&65535;if((r3&12|0)==0){r8=r1+16|0;r9=r1+80|0;r10=HEAP32[r9>>2];r11=HEAPU16[r8>>1]+((r4&65535)<<4)&r10;r12=r11+1|0;r13=r1+76|0;r14=HEAP32[r13>>2];if(r12>>>0<r14>>>0){r15=HEAP32[r1+72>>2];r16=HEAPU8[r15+r12|0]<<8|HEAPU8[r15+r11|0];r17=r10;r18=r14}else{r14=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r11);r16=r14;r17=HEAP32[r9>>2];r18=HEAP32[r13>>2]}r13=r1+18|0;r9=HEAP16[r13>>1];r14=(r9&65535)+((r5&65535)<<4)&r17;r17=r14+1|0;if(r17>>>0<r18>>>0){r18=HEAP32[r1+72>>2];r19=HEAPU8[r18+r17|0]<<8|HEAPU8[r18+r14|0];r20=r9}else{r9=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r14);r19=r9;r20=HEAP16[r13>>1]}HEAP16[r8>>1]=HEAP16[r8>>1]+r7;HEAP16[r13>>1]=r20+r7;_e86_set_flg_sub_16(r1,r16,r19);r19=r1+1200|0;HEAP32[r19>>2]=HEAP32[r19>>2]+22;r21=1;return r21}r19=r1+6|0;if((HEAP16[r19>>1]|0)!=0){r16=r1+16|0;r20=r1+80|0;r13=HEAP32[r20>>2];r8=HEAPU16[r16>>1]+((r4&65535)<<4)&r13;r4=r8+1|0;r9=r1+76|0;r14=HEAP32[r9>>2];if(r4>>>0<r14>>>0){r18=HEAP32[r1+72>>2];r22=HEAPU8[r18+r4|0]<<8|HEAPU8[r18+r8|0];r23=r13;r24=r14}else{r14=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r8);r22=r14;r23=HEAP32[r20>>2];r24=HEAP32[r9>>2]}r9=r1+18|0;r20=HEAP16[r9>>1];r14=(r20&65535)+((r5&65535)<<4)&r23;r23=r14+1|0;if(r23>>>0<r24>>>0){r24=HEAP32[r1+72>>2];r25=HEAPU8[r24+r23|0]<<8|HEAPU8[r24+r14|0];r26=r20}else{r20=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r14);r25=r20;r26=HEAP16[r9>>1]}HEAP16[r16>>1]=HEAP16[r16>>1]+r7;HEAP16[r9>>1]=r26+r7;HEAP16[r19>>1]=HEAP16[r19>>1]-1;_e86_set_flg_sub_16(r1,r22,r25);r25=HEAP32[r2>>2];r22=(HEAP16[r19>>1]|0)==0;r19=r1+1200|0;HEAP32[r19>>2]=HEAP32[r19>>2]+22;if(!r22?(HEAPU16[r6>>1]>>>6&1|0)==(r25>>>2&1|0):0){HEAP32[r2>>2]=r25|32;r21=0;return r21}else{r27=r25}}else{r25=r1+1200|0;HEAP32[r25>>2]=HEAP32[r25>>2]+22;r27=r3}HEAP32[r2>>2]=r27&-33;r21=1;return r21}function _op_a8(r1){var r2;_e86_set_flg_log_8(r1,HEAP16[r1+4>>1]&255&HEAP8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_a9(r1){var r2;_e86_set_flg_log_16(r1,(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&HEAP16[r1+4>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_aa(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=HEAP16[r1+20>>1];r3=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;r4=r1+144|0;r5=HEAP32[r4>>2];if((r5&12|0)==0){r6=r1+18|0;r7=HEAP16[r1+4>>1]&255;r8=HEAP32[r1+80>>2]&HEAPU16[r6>>1]+((r2&65535)<<4);if(r8>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r8|0]=r7}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r8,r7)}HEAP16[r6>>1]=HEAP16[r6>>1]+r3;r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+11;r9=1;return r9}r6=r1+6|0;if((HEAP16[r6>>1]|0)!=0){r7=r1+18|0;r8=HEAP16[r1+4>>1]&255;r10=HEAP32[r1+80>>2]&HEAPU16[r7>>1]+((r2&65535)<<4);if(r10>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r10|0]=r8}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r10,r8)}HEAP16[r7>>1]=HEAP16[r7>>1]+r3;r3=HEAP16[r6>>1]-1&65535;HEAP16[r6>>1]=r3;r6=HEAP32[r4>>2];r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+11;if(r3<<16>>16==0){r11=r6}else{HEAP32[r4>>2]=r6|32;r9=0;return r9}}else{r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+11;r11=r5}HEAP32[r4>>2]=r11&-33;r9=1;return r9}function _op_ab(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=HEAP16[r1+20>>1];r3=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;r4=r1+144|0;r5=HEAP32[r4>>2];if((r5&12|0)==0){r6=r1+18|0;r7=HEAP16[r1+4>>1];r8=HEAP32[r1+80>>2]&HEAPU16[r6>>1]+((r2&65535)<<4);r9=r8+1|0;if(r9>>>0<HEAP32[r1+76>>2]>>>0){r10=r1+72|0;HEAP8[HEAP32[r10>>2]+r8|0]=r7;HEAP8[HEAP32[r10>>2]+r9|0]=(r7&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r8,r7)}HEAP16[r6>>1]=HEAP16[r6>>1]+r3;r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+11;r11=1;return r11}r6=r1+6|0;if((HEAP16[r6>>1]|0)!=0){r7=r1+18|0;r8=HEAP16[r1+4>>1];r9=HEAP32[r1+80>>2]&HEAPU16[r7>>1]+((r2&65535)<<4);r2=r9+1|0;if(r2>>>0<HEAP32[r1+76>>2]>>>0){r10=r1+72|0;HEAP8[HEAP32[r10>>2]+r9|0]=r8;HEAP8[HEAP32[r10>>2]+r2|0]=(r8&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r9,r8)}HEAP16[r7>>1]=HEAP16[r7>>1]+r3;r3=HEAP16[r6>>1]-1&65535;HEAP16[r6>>1]=r3;r6=HEAP32[r4>>2];r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+11;if(r3<<16>>16==0){r12=r6}else{HEAP32[r4>>2]=r6|32;r11=0;return r11}}else{r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+11;r12=r5}HEAP32[r4>>2]=r12&-33;r11=1;return r11}function _op_ac(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;if((r3&12|0)==0){r6=r1+16|0;r7=HEAP16[r6>>1];r8=(r7&65535)+((r4&65535)<<4)&HEAP32[r1+80>>2];if(r8>>>0<HEAP32[r1+76>>2]>>>0){r9=HEAP8[HEAP32[r1+72>>2]+r8|0];r10=r7}else{r7=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r8);r9=r7;r10=HEAP16[r6>>1]}r7=r1+4|0;HEAP16[r7>>1]=HEAP16[r7>>1]&-256|r9&255;HEAP16[r6>>1]=r10+r5;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+12;r11=1;return r11}r10=r1+6|0;r6=HEAP16[r10>>1];if(r6<<16>>16!=0){r9=r1+16|0;r7=HEAP16[r9>>1];r8=(r7&65535)+((r4&65535)<<4)&HEAP32[r1+80>>2];if(r8>>>0<HEAP32[r1+76>>2]>>>0){r12=HEAP8[HEAP32[r1+72>>2]+r8|0];r13=r7;r14=r6;r15=r3}else{r6=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r8);r12=r6;r13=HEAP16[r9>>1];r14=HEAP16[r10>>1];r15=HEAP32[r2>>2]}r6=r1+4|0;HEAP16[r6>>1]=HEAP16[r6>>1]&-256|r12&255;HEAP16[r9>>1]=r13+r5;r5=r14-1&65535;HEAP16[r10>>1]=r5;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+12;if(r5<<16>>16==0){r16=r15}else{HEAP32[r2>>2]=r15|32;r11=0;return r11}}else{r15=r1+1200|0;HEAP32[r15>>2]=HEAP32[r15>>2]+12;r16=r3}HEAP32[r2>>2]=r16&-33;r11=1;return r11}function _op_ad(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;if((r3&12|0)==0){r6=r1+16|0;r7=HEAP16[r6>>1];r8=(r7&65535)+((r4&65535)<<4)&HEAP32[r1+80>>2];r9=r8+1|0;if(r9>>>0<HEAP32[r1+76>>2]>>>0){r10=HEAP32[r1+72>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r8|0];r12=r7}else{r7=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r8);r11=r7;r12=HEAP16[r6>>1]}HEAP16[r1+4>>1]=r11;HEAP16[r6>>1]=r12+r5;r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+12;r13=1;return r13}r12=r1+6|0;r6=HEAP16[r12>>1];if(r6<<16>>16!=0){r11=r1+16|0;r7=HEAP16[r11>>1];r8=(r7&65535)+((r4&65535)<<4)&HEAP32[r1+80>>2];r4=r8+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r10=HEAP32[r1+72>>2];r14=HEAPU8[r10+r4|0]<<8|HEAPU8[r10+r8|0];r15=r7;r16=r6;r17=r3}else{r6=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r8);r14=r6;r15=HEAP16[r11>>1];r16=HEAP16[r12>>1];r17=HEAP32[r2>>2]}HEAP16[r1+4>>1]=r14;HEAP16[r11>>1]=r15+r5;r5=r16-1&65535;HEAP16[r12>>1]=r5;r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+12;if(r5<<16>>16==0){r18=r17}else{HEAP32[r2>>2]=r17|32;r13=0;return r13}}else{r17=r1+1200|0;HEAP32[r17>>2]=HEAP32[r17>>2]+12;r18=r3}HEAP32[r2>>2]=r18&-33;r13=1;return r13}function _op_ae(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=HEAP16[r1+20>>1];r3=r1+30|0;r4=(HEAPU16[r3>>1]>>>9&2^2)-1&65535;r5=r1+144|0;r6=HEAP32[r5>>2];r7=r1+4|0;if((r6&12|0)==0){r8=HEAP16[r7>>1];r9=r1+18|0;r10=HEAP16[r9>>1];r11=(r10&65535)+((r2&65535)<<4)&HEAP32[r1+80>>2];if(r11>>>0<HEAP32[r1+76>>2]>>>0){r12=HEAP8[HEAP32[r1+72>>2]+r11|0];r13=r10}else{r10=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r11);r12=r10;r13=HEAP16[r9>>1]}HEAP16[r9>>1]=r13+r4;_e86_set_flg_sub_8(r1,r8&255,r12);r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+15;r14=1;return r14}r12=r1+6|0;r8=HEAP16[r12>>1];if(r8<<16>>16!=0){r13=HEAP16[r7>>1];r7=r1+18|0;r9=HEAP16[r7>>1];r10=(r9&65535)+((r2&65535)<<4)&HEAP32[r1+80>>2];if(r10>>>0<HEAP32[r1+76>>2]>>>0){r15=HEAP8[HEAP32[r1+72>>2]+r10|0];r16=r9;r17=r8}else{r8=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r10);r15=r8;r16=HEAP16[r7>>1];r17=HEAP16[r12>>1]}HEAP16[r7>>1]=r16+r4;HEAP16[r12>>1]=r17-1;_e86_set_flg_sub_8(r1,r13&255,r15);r15=HEAP32[r5>>2];r13=(HEAP16[r12>>1]|0)==0;r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+15;if(!r13?(HEAPU16[r3>>1]>>>6&1|0)==(r15>>>2&1|0):0){HEAP32[r5>>2]=r15|32;r14=0;return r14}else{r18=r15}}else{r15=r1+1200|0;HEAP32[r15>>2]=HEAP32[r15>>2]+15;r18=r6}HEAP32[r5>>2]=r18&-33;r14=1;return r14}function _op_af(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=HEAP16[r1+20>>1];r3=r1+30|0;r4=(HEAPU16[r3>>1]>>>8&4^4)-2&65535;r5=r1+144|0;r6=HEAP32[r5>>2];r7=r1+4|0;if((r6&12|0)==0){r8=HEAP16[r7>>1];r9=r1+18|0;r10=HEAP16[r9>>1];r11=(r10&65535)+((r2&65535)<<4)&HEAP32[r1+80>>2];r12=r11+1|0;if(r12>>>0<HEAP32[r1+76>>2]>>>0){r13=HEAP32[r1+72>>2];r14=HEAPU8[r13+r12|0]<<8|HEAPU8[r13+r11|0];r15=r10}else{r10=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r11);r14=r10;r15=HEAP16[r9>>1]}HEAP16[r9>>1]=r15+r4;_e86_set_flg_sub_16(r1,r8,r14);r14=r1+1200|0;HEAP32[r14>>2]=HEAP32[r14>>2]+15;r16=1;return r16}r14=r1+6|0;r8=HEAP16[r14>>1];if(r8<<16>>16!=0){r15=HEAP16[r7>>1];r7=r1+18|0;r9=HEAP16[r7>>1];r10=(r9&65535)+((r2&65535)<<4)&HEAP32[r1+80>>2];r2=r10+1|0;if(r2>>>0<HEAP32[r1+76>>2]>>>0){r11=HEAP32[r1+72>>2];r17=HEAPU8[r11+r2|0]<<8|HEAPU8[r11+r10|0];r18=r9;r19=r8}else{r8=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r10);r17=r8;r18=HEAP16[r7>>1];r19=HEAP16[r14>>1]}HEAP16[r7>>1]=r18+r4;HEAP16[r14>>1]=r19-1;_e86_set_flg_sub_16(r1,r15,r17);r17=HEAP32[r5>>2];r15=(HEAP16[r14>>1]|0)==0;r14=r1+1200|0;HEAP32[r14>>2]=HEAP32[r14>>2]+15;if(!r15?(HEAPU16[r3>>1]>>>6&1|0)==(r17>>>2&1|0):0){HEAP32[r5>>2]=r17|32;r16=0;return r16}else{r20=r17}}else{r17=r1+1200|0;HEAP32[r17>>2]=HEAP32[r17>>2]+15;r20=r6}HEAP32[r5>>2]=r20&-33;r16=1;return r16}function _op_b0(r1){var r2;r2=r1+4|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]|HEAP16[r2>>1]&-256;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b1(r1){var r2;r2=r1+6|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]|HEAP16[r2>>1]&-256;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b2(r1){var r2;r2=r1+8|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]|HEAP16[r2>>1]&-256;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b3(r1){var r2;r2=r1+10|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]|HEAP16[r2>>1]&-256;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b4(r1){var r2;r2=r1+4|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b5(r1){var r2;r2=r1+6|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b6(r1){var r2;r2=r1+8|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b7(r1){var r2;r2=r1+10|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b8(r1){var r2;HEAP16[r1+4>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_b9(r1){var r2;HEAP16[r1+6>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_ba(r1){var r2;HEAP16[r1+8>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_bb(r1){var r2;HEAP16[r1+10>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_bc(r1){var r2;HEAP16[r1+12>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_bd(r1){var r2;HEAP16[r1+14>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_be(r1){var r2;HEAP16[r1+16>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_bf(r1){var r2;HEAP16[r1+18>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_c2(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+12|0;r3=HEAP16[r2>>1];r4=r3+2&65535;HEAP16[r2>>1]=r4;r5=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r5+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r6=HEAP32[r1+72>>2];r7=HEAPU8[r6+r3|0]<<8|HEAPU8[r6+r5|0];r8=r4}else{r4=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r5);r7=r4;r8=HEAP16[r2>>1]}HEAP16[r1+28>>1]=r7;HEAP16[r2>>1]=(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])+r8;_e86_pq_init(r1);r8=r1+1200|0;HEAP32[r8>>2]=HEAP32[r8>>2]+20;return 0}function _op_c3(r1){var r2,r3,r4,r5;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2)}HEAP16[r1+28>>1]=r5;_e86_pq_init(r1);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+16;return 0}function _op_c4(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);if((HEAP32[r1+1184>>2]|0)==0){r3=r1+1196|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5+1|0;return r6}r7=r1+1192|0;r8=HEAP16[r7>>1];r9=r1+1194|0;r10=HEAP16[r9>>1];r11=r1+80|0;r12=HEAP32[r11>>2];r13=((r8&65535)<<4)+(r10&65535)&r12;r14=r13+1|0;r15=r1+76|0;r16=HEAP32[r15>>2];if(r14>>>0<r16>>>0){r17=HEAP32[r1+72>>2];r18=HEAPU8[r17+r14|0]<<8|HEAPU8[r17+r13|0];r19=r8;r20=r10;r21=r12;r22=r16}else{r16=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r13);r18=r16;r19=HEAP16[r7>>1];r20=HEAP16[r9>>1];r21=HEAP32[r11>>2];r22=HEAP32[r15>>2]}r15=(r20+2&65535)+((r19&65535)<<4)&r21;r21=r15+1|0;if(r21>>>0<r22>>>0){r22=HEAP32[r1+72>>2];r23=HEAPU8[r22+r21|0]<<8|HEAPU8[r22+r15|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r15)}HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=r18;HEAP16[r1+20>>1]=r23;r23=r1+1200|0;HEAP32[r23>>2]=HEAP32[r23>>2]+16;r3=r1+1196|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5+1|0;return r6}function _op_c5(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);if((HEAP32[r1+1184>>2]|0)==0){r3=r1+1196|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5+1|0;return r6}r7=r1+1192|0;r8=HEAP16[r7>>1];r9=r1+1194|0;r10=HEAP16[r9>>1];r11=r1+80|0;r12=HEAP32[r11>>2];r13=((r8&65535)<<4)+(r10&65535)&r12;r14=r13+1|0;r15=r1+76|0;r16=HEAP32[r15>>2];if(r14>>>0<r16>>>0){r17=HEAP32[r1+72>>2];r18=HEAPU8[r17+r14|0]<<8|HEAPU8[r17+r13|0];r19=r8;r20=r10;r21=r12;r22=r16}else{r16=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r13);r18=r16;r19=HEAP16[r7>>1];r20=HEAP16[r9>>1];r21=HEAP32[r11>>2];r22=HEAP32[r15>>2]}r15=(r20+2&65535)+((r19&65535)<<4)&r21;r21=r15+1|0;if(r21>>>0<r22>>>0){r22=HEAP32[r1+72>>2];r23=HEAPU8[r22+r21|0]<<8|HEAPU8[r22+r15|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r15)}HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=r18;HEAP16[r1+26>>1]=r23;r23=r1+1200|0;HEAP32[r23>>2]=HEAP32[r23>>2]+16;r3=r1+1196|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5+1|0;return r6}function _op_c6(r1){var r2,r3;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+1196|0;_e86_set_ea8(r1,HEAP8[HEAPU16[r2>>1]+1+(r1+128)|0]);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r3>>2];return HEAPU16[r2>>1]+2|0}function _op_c7(r1){var r2,r3;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+1196|0;r3=HEAPU16[r2>>1];_e86_set_ea16(r1,HEAPU8[r3+2+(r1+128)|0]<<8|HEAPU8[r3+1+(r1+128)|0]);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r3>>2];return HEAPU16[r2>>1]+3|0}function _op_ca(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=r1+12|0;r3=HEAP16[r2>>1];r4=r3+2&65535;HEAP16[r2>>1]=r4;r5=r1+24|0;r6=HEAP16[r5>>1];r7=r1+80|0;r8=HEAP32[r7>>2];r9=((r6&65535)<<4)+(r3&65535)&r8;r3=r9+1|0;r10=r1+76|0;r11=HEAP32[r10>>2];if(r3>>>0<r11>>>0){r12=HEAP32[r1+72>>2];r13=HEAPU8[r12+r3|0]<<8|HEAPU8[r12+r9|0];r14=r4;r15=r6;r16=r8;r17=r11}else{r11=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r13=r11;r14=HEAP16[r2>>1];r15=HEAP16[r5>>1];r16=HEAP32[r7>>2];r17=HEAP32[r10>>2]}HEAP16[r1+28>>1]=r13;r13=r14+2&65535;HEAP16[r2>>1]=r13;r10=((r15&65535)<<4)+(r14&65535)&r16;r16=r10+1|0;if(r16>>>0<r17>>>0){r17=HEAP32[r1+72>>2];r18=HEAPU8[r17+r16|0]<<8|HEAPU8[r17+r10|0];r19=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r10);r18=r13;r19=HEAP16[r2>>1]}HEAP16[r1+22>>1]=r18;HEAP16[r2>>1]=(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])+r19;_e86_pq_init(r1);r19=r1+1200|0;HEAP32[r19>>2]=HEAP32[r19>>2]+25;return 0}function _op_cb(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=r1+12|0;r3=HEAP16[r2>>1];r4=r3+2&65535;HEAP16[r2>>1]=r4;r5=r1+24|0;r6=HEAP16[r5>>1];r7=r1+80|0;r8=HEAP32[r7>>2];r9=((r6&65535)<<4)+(r3&65535)&r8;r3=r9+1|0;r10=r1+76|0;r11=HEAP32[r10>>2];if(r3>>>0<r11>>>0){r12=HEAP32[r1+72>>2];r13=HEAPU8[r12+r3|0]<<8|HEAPU8[r12+r9|0];r14=r4;r15=r6;r16=r8;r17=r11}else{r11=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r13=r11;r14=HEAP16[r2>>1];r15=HEAP16[r5>>1];r16=HEAP32[r7>>2];r17=HEAP32[r10>>2]}HEAP16[r1+28>>1]=r13;HEAP16[r2>>1]=r14+2;r2=((r15&65535)<<4)+(r14&65535)&r16;r16=r2+1|0;if(r16>>>0<r17>>>0){r17=HEAP32[r1+72>>2];r18=HEAPU8[r17+r16|0]<<8|HEAPU8[r17+r2|0];r19=r1+22|0;HEAP16[r19>>1]=r18;_e86_pq_init(r1);r20=r1+1200|0;r21=HEAP32[r20>>2];r22=r21+26|0;HEAP32[r20>>2]=r22;return 0}else{r18=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r19=r1+22|0;HEAP16[r19>>1]=r18;_e86_pq_init(r1);r20=r1+1200|0;r21=HEAP32[r20>>2];r22=r21+26|0;HEAP32[r20>>2]=r22;return 0}}function _op_cc(r1){var r2;r2=r1+28|0;HEAP16[r2>>1]=HEAP16[r2>>1]+1;_e86_trap(r1,3);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+52;return 0}function _op_cd(r1){var r2;r2=r1+28|0;HEAP16[r2>>1]=HEAP16[r2>>1]+2;_e86_trap(r1,HEAPU8[r1+129|0]);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+51;return 0}function _op_ce(r1){var r2,r3;if((HEAP16[r1+30>>1]&2048)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=1;return r3}else{r2=r1+28|0;HEAP16[r2>>1]=HEAP16[r2>>1]+1;_e86_trap(r1,4);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+53;r3=0;return r3}}function _op_cf(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r2=r1+12|0;r3=HEAP16[r2>>1];r4=r3+2&65535;HEAP16[r2>>1]=r4;r5=r1+24|0;r6=HEAP16[r5>>1];r7=r1+80|0;r8=HEAP32[r7>>2];r9=((r6&65535)<<4)+(r3&65535)&r8;r3=r9+1|0;r10=r1+76|0;r11=HEAP32[r10>>2];if(r3>>>0<r11>>>0){r12=HEAP32[r1+72>>2];r13=HEAPU8[r12+r3|0]<<8|HEAPU8[r12+r9|0];r14=r4;r15=r6;r16=r8;r17=r11}else{r11=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r13=r11;r14=HEAP16[r2>>1];r15=HEAP16[r5>>1];r16=HEAP32[r7>>2];r17=HEAP32[r10>>2]}HEAP16[r1+28>>1]=r13;r13=r14+2&65535;HEAP16[r2>>1]=r13;r11=((r15&65535)<<4)+(r14&65535)&r16;r14=r11+1|0;if(r14>>>0<r17>>>0){r9=HEAP32[r1+72>>2];r18=HEAPU8[r9+r14|0]<<8|HEAPU8[r9+r11|0];r19=r13;r20=r15;r21=r16;r22=r17}else{r17=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r11);r18=r17;r19=HEAP16[r2>>1];r20=HEAP16[r5>>1];r21=HEAP32[r7>>2];r22=HEAP32[r10>>2]}HEAP16[r1+22>>1]=r18;HEAP16[r2>>1]=r19+2;r2=((r20&65535)<<4)+(r19&65535)&r21;r21=r2+1|0;if(r21>>>0<r22>>>0){r22=HEAP32[r1+72>>2];r23=HEAPU8[r22+r21|0]<<8|HEAPU8[r22+r2|0];r24=r1+30|0;HEAP16[r24>>1]=r23;_e86_pq_init(r1);r25=r1+1200|0;r26=HEAP32[r25>>2];r27=r26+32|0;HEAP32[r25>>2]=r27;return 0}else{r23=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r24=r1+30|0;HEAP16[r24>>1]=r23;_e86_pq_init(r1);r25=r1+1200|0;r26=HEAP32[r25>>2];r27=r26+32|0;HEAP32[r25>>2]=r27;return 0}}function _op_d0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113;r2=0;r3=r1+129|0;r4=HEAP8[r3];r5=r4&255;r6=r5>>>3;r7=r6&7;_e86_get_ea_ptr(r1,r3);r8=_e86_get_ea8(r1);L1:do{switch(r7|0){case 3:{r9=r8&255;r10=r9>>>1;r11=r1+30|0;r12=HEAP16[r11>>1];r13=r12&65535;r14=r13<<7;r15=r14&128;r16=r15|r10;r17=r16&65535;r18=r9&1;r19=(r18|0)==0;if(r19){r20=r12&-2;HEAP16[r11>>1]=r20;r21=r17;r22=r20;break L1}else{r23=r12|1;HEAP16[r11>>1]=r23;r21=r17;r22=r23;break L1}break};case 7:{r24=r8&255;r25=r24>>>1;r26=r24&128;r27=r25|r26;r28=r27&65535;r29=r27&255;_e86_set_flg_szp_8(r1,r29);r30=r24&1;r31=(r30|0)==0;r32=r1+30|0;r33=HEAP16[r32>>1];if(r31){r34=r33&-2;HEAP16[r32>>1]=r34;r21=r28;r22=r34;break L1}else{r35=r33|1;HEAP16[r32>>1]=r35;r21=r28;r22=r35;break L1}break};case 5:{r36=(r8&255)>>>1;r37=r36&255;_e86_set_flg_szp_8(r1,r36);r38=r8&1;r39=r38<<24>>24==0;r40=r1+30|0;r41=HEAP16[r40>>1];if(r39){r42=r41&-2;HEAP16[r40>>1]=r42;r21=r37;r22=r42;break L1}else{r43=r41|1;HEAP16[r40>>1]=r43;r21=r37;r22=r43;break L1}break};case 1:{r44=r8&255;r45=r44>>>1;r46=r44<<7;r47=r45|r46;r48=r47&65535;r49=r44&1;r50=(r49|0)==0;r51=r1+30|0;r52=HEAP16[r51>>1];if(r50){r53=r52&-2;HEAP16[r51>>1]=r53;r21=r48;r22=r53;break L1}else{r54=r52|1;HEAP16[r51>>1]=r54;r21=r48;r22=r54;break L1}break};case 0:{r55=r8&255;r56=r55<<1;r57=r55>>>7;r58=r56|r57;r59=r58&65535;r60=r55&128;r61=(r60|0)==0;r62=r1+30|0;r63=HEAP16[r62>>1];if(r61){r64=r63&-2;HEAP16[r62>>1]=r64;r21=r59;r22=r64;break L1}else{r65=r63|1;HEAP16[r62>>1]=r65;r21=r59;r22=r65;break L1}break};case 4:{r66=r8&255;r67=r66<<1;r68=r67&65535;r69=r67&255;_e86_set_flg_szp_8(r1,r69);r70=r66&128;r71=(r70|0)==0;r72=r1+30|0;r73=HEAP16[r72>>1];if(r71){r74=r73&-2;HEAP16[r72>>1]=r74;r21=r68;r22=r74;break L1}else{r75=r73|1;HEAP16[r72>>1]=r75;r21=r68;r22=r75;break L1}break};case 2:{r76=r8&255;r77=r76<<1;r78=r1+30|0;r79=HEAP16[r78>>1];r80=r79&65535;r81=r80&1;r82=r81|r77;r83=r82&65535;r84=r76&128;r85=(r84|0)==0;if(r85){r86=r79&-2;HEAP16[r78>>1]=r86;r21=r83;r22=r86;break L1}else{r87=r79|1;HEAP16[r78>>1]=r87;r21=r83;r22=r87;break L1}break};default:{r88=r1+1200|0;r89=HEAP32[r88>>2];r90=r89+1|0;HEAP32[r88>>2]=r90;r91=_e86_undefined(r1);r92=r91;return r92}}}while(0);r93=r21&65535;r94=r8&255;r95=r93^r94;r96=r95&128;r97=(r96|0)==0;r98=r1+30|0;r99=r22&-2049;r100=r22|2048;r101=r97?r99:r100;HEAP16[r98>>1]=r101;r102=r21&255;_e86_set_ea8(r1,r102);r103=r1+1184|0;r104=HEAP32[r103>>2];r105=(r104|0)!=0;r106=r105?15:2;r107=r1+1200|0;r108=HEAP32[r107>>2];r109=r106+r108|0;HEAP32[r107>>2]=r109;r110=r1+1196|0;r111=HEAP16[r110>>1];r112=r111&65535;r113=r112+1|0;r92=r113;return r92}function _op_d1(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100;r2=0;r3=r1+129|0;r4=HEAP8[r3];r5=r4&255;r6=r5>>>3;r7=r6&7;_e86_get_ea_ptr(r1,r3);r8=_e86_get_ea16(r1);r9=r8&65535;L1:do{switch(r7|0){case 2:{r10=r9<<1;r11=r1+30|0;r12=HEAP16[r11>>1];r13=r12&65535;r14=r13&1;r15=r14|r10;r16=r9&32768;r17=(r16|0)==0;if(r17){r18=r12&-2;HEAP16[r11>>1]=r18;r19=r15;r20=r18;break L1}else{r21=r12|1;HEAP16[r11>>1]=r21;r19=r15;r20=r21;break L1}break};case 7:{r22=r9>>>1;r23=r9&32768;r24=r22|r23;r25=r24&65535;_e86_set_flg_szp_16(r1,r25);r26=r9&1;r27=(r26|0)==0;r28=r1+30|0;r29=HEAP16[r28>>1];if(r27){r30=r29&-2;HEAP16[r28>>1]=r30;r19=r24;r20=r30;break L1}else{r31=r29|1;HEAP16[r28>>1]=r31;r19=r24;r20=r31;break L1}break};case 5:{r32=r9>>>1;r33=r32&65535;_e86_set_flg_szp_16(r1,r33);r34=r9&1;r35=(r34|0)==0;r36=r1+30|0;r37=HEAP16[r36>>1];if(r35){r38=r37&-2;HEAP16[r36>>1]=r38;r19=r32;r20=r38;break L1}else{r39=r37|1;HEAP16[r36>>1]=r39;r19=r32;r20=r39;break L1}break};case 0:{r40=r9<<1;r41=r9>>>15;r42=r40|r41;r43=r9&32768;r44=(r43|0)==0;r45=r1+30|0;r46=HEAP16[r45>>1];if(r44){r47=r46&-2;HEAP16[r45>>1]=r47;r19=r42;r20=r47;break L1}else{r48=r46|1;HEAP16[r45>>1]=r48;r19=r42;r20=r48;break L1}break};case 3:{r49=r9>>>1;r50=r1+30|0;r51=HEAP16[r50>>1];r52=r51&65535;r53=r52<<15;r54=r53&32768;r55=r54|r49;r56=r9&1;r57=(r56|0)==0;if(r57){r58=r51&-2;HEAP16[r50>>1]=r58;r19=r55;r20=r58;break L1}else{r59=r51|1;HEAP16[r50>>1]=r59;r19=r55;r20=r59;break L1}break};case 1:{r60=r9>>>1;r61=r9<<15;r62=r60|r61;r63=r9&1;r64=(r63|0)==0;r65=r1+30|0;r66=HEAP16[r65>>1];if(r64){r67=r66&-2;HEAP16[r65>>1]=r67;r19=r62;r20=r67;break L1}else{r68=r66|1;HEAP16[r65>>1]=r68;r19=r62;r20=r68;break L1}break};case 4:{r69=r9<<1;r70=r69&65535;_e86_set_flg_szp_16(r1,r70);r71=r9&32768;r72=(r71|0)==0;r73=r1+30|0;r74=HEAP16[r73>>1];if(r72){r75=r74&-2;HEAP16[r73>>1]=r75;r19=r69;r20=r75;break L1}else{r76=r74|1;HEAP16[r73>>1]=r76;r19=r69;r20=r76;break L1}break};default:{r77=r1+1200|0;r78=HEAP32[r77>>2];r79=r78+1|0;HEAP32[r77>>2]=r79;r80=_e86_undefined(r1);r81=r80;return r81}}}while(0);r82=r19^r9;r83=r82&32768;r84=(r83|0)==0;r85=r1+30|0;r86=r20&-2049;r87=r20|2048;r88=r84?r86:r87;HEAP16[r85>>1]=r88;r89=r19&65535;_e86_set_ea16(r1,r89);r90=r1+1184|0;r91=HEAP32[r90>>2];r92=(r91|0)!=0;r93=r92?15:2;r94=r1+1200|0;r95=HEAP32[r94>>2];r96=r93+r95|0;HEAP32[r94>>2]=r96;r97=r1+1196|0;r98=HEAP16[r97>>1];r99=r98&65535;r100=r99+1|0;r81=r100;return r81}function _op_d2(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166;r2=0;r3=r1+129|0;r4=HEAP8[r3];_e86_get_ea_ptr(r1,r3);r5=_e86_get_ea8(r1);r6=r5&255;r7=r1+6|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r1|0;r11=HEAP32[r10>>2];r12=r11&2;r13=(r12|0)==0;r14=r13?255:31;r15=r14&r9;r16=(r15|0)==0;if(r16){r17=r1+1184|0;r18=HEAP32[r17>>2];r19=(r18|0)!=0;r20=r19?20:8;r21=r1+1200|0;r22=HEAP32[r21>>2];r23=r20+r22|0;HEAP32[r21>>2]=r23;r24=r1+1196|0;r25=HEAP16[r24>>1];r26=r25&65535;r27=r26+1|0;r28=r27;return r28}r29=r4&255;r30=r29>>>3;r31=r30&7;L5:do{switch(r31|0){case 2:{r32=r1+30|0;r33=HEAP16[r32>>1];r34=r33<<8;r35=r34&256;r36=r35|r6;r37=r36&65535;r38=(r15>>>0)%9&-1;r39=r37<<r38;r40=9-r38|0;r41=r37>>>(r40>>>0);r42=r39|r41;r43=r42&65535;r44=r42&256;r45=(r44|0)==0;if(r45){r46=r33&-2;HEAP16[r32>>1]=r46;r47=r36;r48=r43;break L5}else{r49=r33|1;HEAP16[r32>>1]=r49;r47=r36;r48=r43;break L5}break};case 3:{r50=r1+30|0;r51=HEAP16[r50>>1];r52=r51<<8;r53=r52&256;r54=r53|r6;r55=r54&65535;r56=(r15>>>0)%9&-1;r57=r55>>>(r56>>>0);r58=9-r56|0;r59=r55<<r58;r60=r57|r59;r61=r60&65535;r62=r60&256;r63=(r62|0)==0;if(r63){r64=r51&-2;HEAP16[r50>>1]=r64;r47=r54;r48=r61;break L5}else{r65=r51|1;HEAP16[r50>>1]=r65;r47=r54;r48=r61;break L5}break};case 0:{r66=r5&255;r67=r9&7;r68=r66<<r67;r69=8-r67|0;r70=r66>>>(r69>>>0);r71=r70|r68;r72=r71&65535;r73=r71&1;r74=(r73|0)==0;r75=r1+30|0;r76=HEAP16[r75>>1];if(r74){r77=r76&-2;HEAP16[r75>>1]=r77;r47=r6;r48=r72;break L5}else{r78=r76|1;HEAP16[r75>>1]=r78;r47=r6;r48=r72;break L5}break};case 5:{r79=r15>>>0>8;if(r79){r80=0}else{r81=r5&255;r82=r15-1|0;r83=r81>>>(r82>>>0);r84=r83&65535;r80=r84}r85=r80&1;r86=(r85|0)==0;r87=r1+30|0;r88=HEAP16[r87>>1];r89=r88&-2;r90=r88|1;r91=r86?r89:r90;HEAP16[r87>>1]=r91;r92=r80>>>1;r93=r92&65535;r94=r92&255;_e86_set_flg_szp_8(r1,r94);r47=r6;r48=r93;break};case 1:{r95=r5&255;r96=r9&7;r97=r95>>>(r96>>>0);r98=8-r96|0;r99=r95<<r98;r100=r99|r97;r101=r100&65535;r102=r100&128;r103=(r102|0)==0;r104=r1+30|0;r105=HEAP16[r104>>1];if(r103){r106=r105&-2;HEAP16[r104>>1]=r106;r47=r6;r48=r101;break L5}else{r107=r105|1;HEAP16[r104>>1]=r107;r47=r6;r48=r101;break L5}break};case 4:{r108=r15>>>0>8;if(r108){r109=0}else{r110=r5&255;r111=r110<<r15;r112=r111&65535;r109=r112}r113=r109&255;_e86_set_flg_szp_8(r1,r113);r114=r109&256;r115=r114<<16>>16==0;r116=r1+30|0;r117=HEAP16[r116>>1];if(r115){r118=r117&-2;HEAP16[r116>>1]=r118;r47=r6;r48=r109;break L5}else{r119=r117|1;HEAP16[r116>>1]=r119;r47=r6;r48=r109;break L5}break};case 7:{r120=r5&255;r121=r120&128;r122=(r121|0)!=0;r123=r122?65280:0;r124=r123|r120;r125=r124&65535;r126=r15>>>0>7;r127=r15-1|0;r128=r126?7:r127;r129=r124>>>(r128>>>0);r130=r129&1;r131=(r130|0)==0;r132=r1+30|0;r133=HEAP16[r132>>1];r134=r133&-2;r135=r133|1;r136=r131?r134:r135;HEAP16[r132>>1]=r136;r137=r129>>>1;r138=r137&65535;r139=r138&255;r140=r137&255;_e86_set_flg_szp_8(r1,r140);r47=r125;r48=r139;break};default:{r141=r1+1200|0;r142=HEAP32[r141>>2];r143=r142+1|0;HEAP32[r141>>2]=r143;r144=_e86_undefined(r1);r28=r144;return r28}}}while(0);r145=r47^r48;r146=r145&128;r147=r146<<16>>16==0;r148=r1+30|0;r149=HEAP16[r148>>1];r150=r149&-2049;r151=r149|2048;r152=r147?r150:r151;HEAP16[r148>>1]=r152;r153=r48&255;_e86_set_ea8(r1,r153);r154=r1+1184|0;r155=HEAP32[r154>>2];r156=(r155|0)!=0;r157=r15<<2;r158=r156?20:8;r159=r1+1200|0;r160=HEAP32[r159>>2];r161=r160+r157|0;r162=r161+r158|0;HEAP32[r159>>2]=r162;r163=r1+1196|0;r164=HEAP16[r163>>1];r165=r164&65535;r166=r165+1|0;r28=r166;return r28}function _op_d3(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152;r2=0;r3=r1+129|0;r4=HEAP8[r3];_e86_get_ea_ptr(r1,r3);r5=_e86_get_ea16(r1);r6=r5&65535;r7=r1+6|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r1|0;r11=HEAP32[r10>>2];r12=r11&2;r13=(r12|0)==0;r14=r13?255:31;r15=r14&r9;r16=(r15|0)==0;if(r16){r17=r1+1184|0;r18=HEAP32[r17>>2];r19=(r18|0)!=0;r20=r19?20:8;r21=r1+1200|0;r22=HEAP32[r21>>2];r23=r20+r22|0;HEAP32[r21>>2]=r23;r24=r1+1196|0;r25=HEAP16[r24>>1];r26=r25&65535;r27=r26+1|0;r28=r27;return r28}r29=r4&255;r30=r29>>>3;r31=r30&7;L5:do{switch(r31|0){case 1:{r32=r9&15;r33=r6>>>(r32>>>0);r34=16-r32|0;r35=r6<<r34;r36=r35|r33;r37=r36&32768;r38=(r37|0)==0;r39=r1+30|0;r40=HEAP16[r39>>1];if(r38){r41=r40&-2;HEAP16[r39>>1]=r41;r42=r6;r43=r36;break L5}else{r44=r40|1;HEAP16[r39>>1]=r44;r42=r6;r43=r36;break L5}break};case 7:{r45=r6&32768;r46=(r45|0)!=0;r47=r46?-65536:0;r48=r47|r6;r49=r15>>>0>15;r50=r15-1|0;r51=r49?15:r50;r52=r48>>>(r51>>>0);r53=r52&1;r54=(r53|0)==0;r55=r1+30|0;r56=HEAP16[r55>>1];r57=r56&-2;r58=r56|1;r59=r54?r57:r58;HEAP16[r55>>1]=r59;r60=r52>>>1;r61=r60&65535;r62=r60&65535;_e86_set_flg_szp_16(r1,r62);r42=r48;r43=r61;break};case 2:{r63=r1+30|0;r64=HEAP16[r63>>1];r65=r64&65535;r66=r65<<16;r67=r66&65536;r68=r67|r6;r69=(r15>>>0)%17&-1;r70=r68<<r69;r71=17-r69|0;r72=r68>>>(r71>>>0);r73=r70|r72;r74=r73&65536;r75=(r74|0)==0;if(r75){r76=r64&-2;HEAP16[r63>>1]=r76;r42=r68;r43=r73;break L5}else{r77=r64|1;HEAP16[r63>>1]=r77;r42=r68;r43=r73;break L5}break};case 3:{r78=r1+30|0;r79=HEAP16[r78>>1];r80=r79&65535;r81=r80<<16;r82=r81&65536;r83=r82|r6;r84=(r15>>>0)%17&-1;r85=r83>>>(r84>>>0);r86=17-r84|0;r87=r83<<r86;r88=r85|r87;r89=r88&65536;r90=(r89|0)==0;if(r90){r91=r79&-2;HEAP16[r78>>1]=r91;r42=r83;r43=r88;break L5}else{r92=r79|1;HEAP16[r78>>1]=r92;r42=r83;r43=r88;break L5}break};case 4:{r93=r15>>>0>16;r94=r6<<r15;r95=r93?0:r94;r96=r95&65535;_e86_set_flg_szp_16(r1,r96);r97=r95&65536;r98=(r97|0)==0;r99=r1+30|0;r100=HEAP16[r99>>1];if(r98){r101=r100&-2;HEAP16[r99>>1]=r101;r42=r6;r43=r95;break L5}else{r102=r100|1;HEAP16[r99>>1]=r102;r42=r6;r43=r95;break L5}break};case 5:{r103=r15>>>0>16;if(r103){r104=0}else{r105=r15-1|0;r106=r6>>>(r105>>>0);r104=r106}r107=r104&1;r108=(r107|0)==0;r109=r1+30|0;r110=HEAP16[r109>>1];r111=r110&-2;r112=r110|1;r113=r108?r111:r112;HEAP16[r109>>1]=r113;r114=r104>>>1;r115=r114&65535;_e86_set_flg_szp_16(r1,r115);r42=r6;r43=r114;break};case 0:{r116=r9&15;r117=r6<<r116;r118=16-r116|0;r119=r6>>>(r118>>>0);r120=r119|r117;r121=r120&1;r122=(r121|0)==0;r123=r1+30|0;r124=HEAP16[r123>>1];if(r122){r125=r124&-2;HEAP16[r123>>1]=r125;r42=r6;r43=r120;break L5}else{r126=r124|1;HEAP16[r123>>1]=r126;r42=r6;r43=r120;break L5}break};default:{r127=r1+1200|0;r128=HEAP32[r127>>2];r129=r128+1|0;HEAP32[r127>>2]=r129;r130=_e86_undefined(r1);r28=r130;return r28}}}while(0);r131=r42^r43;r132=r131&32768;r133=(r132|0)==0;r134=r1+30|0;r135=HEAP16[r134>>1];r136=r135&-2049;r137=r135|2048;r138=r133?r136:r137;HEAP16[r134>>1]=r138;r139=r43&65535;_e86_set_ea16(r1,r139);r140=r1+1184|0;r141=HEAP32[r140>>2];r142=(r141|0)!=0;r143=r15<<2;r144=r142?20:8;r145=r1+1200|0;r146=HEAP32[r145>>2];r147=r146+r143|0;r148=r147+r144|0;HEAP32[r145>>2]=r148;r149=r1+1196|0;r150=HEAP16[r149>>1];r151=r150&65535;r152=r151+1|0;r28=r152;return r28}function _op_d4(r1){var r2,r3,r4,r5,r6;r2=HEAP8[r1+129|0];r3=r2&255;if(r2<<24>>24==0){_e86_trap(r1,0);r4=0;return r4}else{r2=r1+4|0;r5=HEAP16[r2>>1]&255;r6=((r5>>>0)%(r3>>>0)&-1&255|((r5>>>0)/(r3>>>0)&-1)<<8)&65535;HEAP16[r2>>1]=r6;_e86_set_flg_szp_16(r1,r6);r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+83;r4=2;return r4}}function _op_d5(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=((r3&65535)>>>8)*HEAPU8[r1+129|0]&65535;HEAP16[r2>>1]=r4+r3&255;_e86_set_flg_szp_16(r1,r4+(r3&255)&65535);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+60;return 2}function _op_d7(r1){var r2,r3,r4,r5,r6;r2=r1+4|0;r3=HEAP16[r2>>1];r4=((r3&255)+HEAP16[r1+10>>1]&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=HEAP8[HEAP32[r1+72>>2]+r4|0];r6=r3}else{r3=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r4);r5=r3;r6=HEAP16[r2>>1]}HEAP16[r2>>1]=r6&-256|r5&255;r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+11;return 1}function _op_d8(r1){var r2,r3;if((HEAP32[r1>>2]&16|0)==0){_e86_get_ea_ptr(r1,r1+129|0);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;r3=HEAPU16[r1+1196>>1]+1|0;return r3}else{_e86_trap(r1,7);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+50;r3=0;return r3}}function _op_e0(r1){var r2,r3,r4;r2=r1+6|0;r3=HEAPU16[r2>>1]+65535|0;HEAP16[r2>>1]=r3;if((r3&65535|0)!=0?(HEAP16[r1+30>>1]&64)==0:0){r3=HEAPU8[r1+129|0];r2=r1+28|0;HEAP16[r2>>1]=HEAPU16[r2>>1]+2+((r3&128|0)!=0?r3|65280:r3);_e86_pq_init(r1);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+19;r4=0;return r4}r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+5;r4=2;return r4}function _op_e1(r1){var r2,r3,r4;r2=r1+6|0;r3=HEAPU16[r2>>1]+65535|0;HEAP16[r2>>1]=r3;if((r3&65535|0)!=0?(HEAP16[r1+30>>1]&64)!=0:0){r3=HEAPU8[r1+129|0];r2=r1+28|0;HEAP16[r2>>1]=HEAPU16[r2>>1]+2+((r3&128|0)!=0?r3|65280:r3);_e86_pq_init(r1);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+18;r4=0;return r4}r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+5;r4=2;return r4}function _op_e2(r1){var r2,r3,r4;r2=r1+6|0;r3=HEAPU16[r2>>1]+65535|0;HEAP16[r2>>1]=r3;if((r3&65535|0)==0){r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+5;r4=2;return r4}else{r3=HEAPU8[r1+129|0];r2=r1+28|0;HEAP16[r2>>1]=HEAPU16[r2>>1]+2+((r3&128|0)!=0?r3|65280:r3);_e86_pq_init(r1);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+18;r4=0;return r4}}function _op_e3(r1){var r2,r3,r4;if((HEAP16[r1+6>>1]|0)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+18;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+6;r4=2;return r4}}function _op_e4(r1){var r2,r3;r2=FUNCTION_TABLE[HEAP32[r1+56>>2]](HEAP32[r1+52>>2],HEAPU8[r1+129|0]);r3=r1+4|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-256|r2&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return 2}function _op_e5(r1){var r2;HEAP16[r1+4>>1]=FUNCTION_TABLE[HEAP32[r1+64>>2]](HEAP32[r1+52>>2],HEAPU8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+15;return 2}function _op_e6(r1){var r2;FUNCTION_TABLE[HEAP32[r1+60>>2]](HEAP32[r1+52>>2],HEAPU8[r1+129|0],HEAP16[r1+4>>1]&255);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return 2}function _op_e7(r1){var r2;FUNCTION_TABLE[HEAP32[r1+68>>2]](HEAP32[r1+52>>2],HEAPU8[r1+129|0],HEAP16[r1+4>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return 2}function _op_e8(r1){var r2,r3,r4,r5,r6;r2=r1+28|0;r3=HEAP16[r2>>1]+3&65535;r4=r1+12|0;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r4=(HEAPU16[r1+24>>1]<<4)+(r5&65535)&HEAP32[r1+80>>2];r5=r4+1|0;if(r5>>>0<HEAP32[r1+76>>2]>>>0){r6=r1+72|0;HEAP8[HEAP32[r6>>2]+r4|0]=r3;HEAP8[HEAP32[r6>>2]+r5|0]=(r3&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r3)}HEAP16[r2>>1]=(HEAP16[r2>>1]+3&65535)+(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+19;return 0}function _op_e9(r1){var r2;r2=r1+28|0;HEAP16[r2>>1]=(HEAP16[r2>>1]+3&65535)+(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+15;return 0}function _op_ea(r1){var r2;HEAP16[r1+28>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];HEAP16[r1+22>>1]=HEAPU8[r1+132|0]<<8|HEAPU8[r1+131|0];_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+15;return 0}function _op_eb(r1){var r2,r3;r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+15;return 0}function _op_ec(r1){var r2,r3;r2=FUNCTION_TABLE[HEAP32[r1+56>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1]);r3=r1+4|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-256|r2&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return 1}function _op_ed(r1){var r2;HEAP16[r1+4>>1]=FUNCTION_TABLE[HEAP32[r1+64>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+13;return 1}function _op_ee(r1){var r2;FUNCTION_TABLE[HEAP32[r1+60>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1],HEAP16[r1+4>>1]&255);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return 1}function _op_ef(r1){var r2;FUNCTION_TABLE[HEAP32[r1+68>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1],HEAP16[r1+4>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return 1}function _op_f0(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|17;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f2(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|9;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f3(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|5;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f4(r1){var r2;HEAP32[r1+152>>2]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f5(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]^1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f6(r1){return FUNCTION_TABLE[HEAP32[5688+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_f7(r1){return FUNCTION_TABLE[HEAP32[5656+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_f8(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f9(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]|1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fa(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-513;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fb(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]|512;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fc(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-1025;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fd(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]|1024;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fe(r1){var r2,r3,r4,r5,r6,r7;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;if((r3|0)==1){_e86_get_ea_ptr(r1,r2);r4=_e86_get_ea8(r1);_e86_set_ea8(r1,r4-1&255);r5=r1+30|0;r6=HEAP16[r5>>1];_e86_set_flg_sub_8(r1,r4,1);r4=HEAP16[r5>>1];HEAP16[r5>>1]=(r4^r6)&1^r4;r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?15:3)+HEAP32[r4>>2];r7=HEAPU16[r1+1196>>1]+1|0;return r7}else if((r3|0)==0){_e86_get_ea_ptr(r1,r2);r2=_e86_get_ea8(r1);_e86_set_ea8(r1,r2+1&255);r3=r1+30|0;r4=HEAP16[r3>>1];_e86_set_flg_add_8(r1,r2,1);r2=HEAP16[r3>>1];HEAP16[r3>>1]=(r2^r4)&1^r2;r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?15:3)+HEAP32[r2>>2];r7=HEAPU16[r1+1196>>1]+1|0;return r7}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;r7=_e86_undefined(r1);return r7}}function _op_ff(r1){return FUNCTION_TABLE[HEAP32[5624+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_ff_00(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);_e86_set_ea16(r1,r2+1&65535);r3=r1+30|0;r4=HEAP16[r3>>1];_e86_set_flg_add_16(r1,r2,1);r2=HEAP16[r3>>1];HEAP16[r3>>1]=(r2^r4)&1^r2;r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?15:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_ff_01(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);_e86_set_ea16(r1,r2-1&65535);r3=r1+30|0;r4=HEAP16[r3>>1];_e86_set_flg_sub_16(r1,r2,1);r2=HEAP16[r3>>1];HEAP16[r3>>1]=(r2^r4)&1^r2;r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?15:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_ff_02(r1){var r2,r3,r4,r5,r6;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+28|0;r3=(HEAP16[r2>>1]+1&65535)+HEAP16[r1+1196>>1]&65535;r4=r1+12|0;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r4=(HEAPU16[r1+24>>1]<<4)+(r5&65535)&HEAP32[r1+80>>2];r5=r4+1|0;if(r5>>>0<HEAP32[r1+76>>2]>>>0){r6=r1+72|0;HEAP8[HEAP32[r6>>2]+r4|0]=r3;HEAP8[HEAP32[r6>>2]+r5|0]=(r3&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r3)}HEAP16[r2>>1]=_e86_get_ea16(r1);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?21:16)+HEAP32[r2>>2];return 0}function _op_ff_03(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;_e86_get_ea_ptr(r1,r1+129|0);if((HEAP32[r1+1184>>2]|0)==0){r2=HEAPU16[r1+1196>>1]+1|0;return r2}r3=r1+22|0;r4=HEAP16[r3>>1];r5=r1+12|0;r6=HEAP16[r5>>1]-2&65535;HEAP16[r5>>1]=r6;r7=r1+24|0;r8=r1+80|0;r9=(HEAPU16[r7>>1]<<4)+(r6&65535)&HEAP32[r8>>2];r6=r9+1|0;r10=r1+76|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r11=r1+72|0;HEAP8[HEAP32[r11>>2]+r9|0]=r4;HEAP8[HEAP32[r11>>2]+r6|0]=(r4&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r9,r4)}r4=r1+28|0;r9=(HEAP16[r4>>1]+1&65535)+HEAP16[r1+1196>>1]&65535;r6=HEAP16[r5>>1]-2&65535;HEAP16[r5>>1]=r6;r5=(HEAPU16[r7>>1]<<4)+(r6&65535)&HEAP32[r8>>2];r6=r5+1|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r5|0]=r9;HEAP8[HEAP32[r7>>2]+r6|0]=(r9&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r5,r9)}r9=HEAP16[r1+1194>>1];r5=HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+1192|0:r1+148|0)>>1]<<4;r6=HEAP32[r8>>2];r7=r5+(r9&65535)&r6;r11=r7+1|0;r12=HEAP32[r10>>2];if(r11>>>0<r12>>>0){r13=HEAP32[r1+72>>2];r14=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r7|0];r15=r6;r16=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r7);r14=r12;r15=HEAP32[r8>>2];r16=HEAP32[r10>>2]}HEAP16[r4>>1]=r14;r14=r15&(r9+2&65535)+r5;r5=r14+1|0;if(r5>>>0<r16>>>0){r16=HEAP32[r1+72>>2];r17=HEAPU8[r16+r5|0]<<8|HEAPU8[r16+r14|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r14)}HEAP16[r3>>1]=r17;_e86_pq_init(r1);r17=r1+1200|0;HEAP32[r17>>2]=HEAP32[r17>>2]+37;r2=0;return r2}function _op_ff_04(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);HEAP16[r1+28>>1]=_e86_get_ea16(r1);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?18:11)+HEAP32[r2>>2];return 0}function _op_ff_05(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;_e86_get_ea_ptr(r1,r1+129|0);if((HEAP32[r1+1184>>2]|0)==0){r2=HEAPU16[r1+1196>>1]+1|0;return r2}r3=r1+1192|0;r4=HEAP16[r3>>1];r5=r1+1194|0;r6=HEAP16[r5>>1];r7=r1+80|0;r8=HEAP32[r7>>2];r9=((r4&65535)<<4)+(r6&65535)&r8;r10=r9+1|0;r11=r1+76|0;r12=HEAP32[r11>>2];if(r10>>>0<r12>>>0){r13=HEAP32[r1+72>>2];r14=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r9|0];r15=r4;r16=r6;r17=r8;r18=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r14=r12;r15=HEAP16[r3>>1];r16=HEAP16[r5>>1];r17=HEAP32[r7>>2];r18=HEAP32[r11>>2]}HEAP16[r1+28>>1]=r14;r14=(r16+2&65535)+((r15&65535)<<4)&r17;r17=r14+1|0;if(r17>>>0<r18>>>0){r18=HEAP32[r1+72>>2];r19=HEAPU8[r18+r17|0]<<8|HEAPU8[r18+r14|0]}else{r19=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r14)}HEAP16[r1+22>>1]=r19;_e86_pq_init(r1);r19=r1+1200|0;HEAP32[r19>>2]=HEAP32[r19>>2]+24;r2=0;return r2}function _op_ff_06(r1){var r2,r3,r4,r5,r6,r7;r2=0;_e86_get_ea_ptr(r1,r1+129|0);r3=r1+1184|0;do{if(((HEAP32[r3>>2]|0)==0?(HEAP16[r1+1194>>1]|0)==4:0)?(HEAP32[r1>>2]&4|0)==0:0){r4=r1+12|0;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r4=(HEAPU16[r1+24>>1]<<4)+(r5&65535)&HEAP32[r1+80>>2];r6=r4+1|0;if(r6>>>0<HEAP32[r1+76>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r4|0]=r5;HEAP8[HEAP32[r7>>2]+r6|0]=(r5&65535)>>>8;break}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r5);break}}else{r2=7}}while(0);do{if(r2==7){r5=_e86_get_ea16(r1);r4=r1+12|0;r6=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r6;r4=(HEAPU16[r1+24>>1]<<4)+(r6&65535)&HEAP32[r1+80>>2];r6=r4+1|0;if(r6>>>0<HEAP32[r1+76>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r4|0]=r5;HEAP8[HEAP32[r7>>2]+r6|0]=(r5&65535)>>>8;break}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r5);break}}}while(0);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r3>>2]|0)!=0?16:10)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_00(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];_e86_set_flg_log_16(r1,(HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0])&r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?11:5)+HEAP32[r2>>2];return HEAPU16[r3>>1]+3|0}function _op_f7_02(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);_e86_set_ea16(r1,~_e86_get_ea16(r1));r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_03(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);_e86_set_ea16(r1,-r2&65535);_e86_set_flg_sub_16(r1,0,r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_04(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1)&65535;r3=r1+4|0;r4=Math_imul(HEAPU16[r3>>1],r2)|0;HEAP16[r3>>1]=r4;HEAP16[r1+8>>1]=r4>>>16;r3=r1+30|0;r2=HEAP16[r3>>1];r5=(r4&2147418112|0)==0?r2&-2050:r2|2049;HEAP16[r3>>1]=(r4|0)==0?r5|64:r5&-65;r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?131:115)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_05(r1){var r2,r3,r4,r5,r6;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+4|0;r3=HEAPU16[r2>>1];r4=_e86_get_ea16(r1)&65535;r5=Math_imul((r4&32768|0)!=0?r4|-65536:r4,(r3&32768|0)!=0?r3|-65536:r3)|0;HEAP16[r2>>1]=r5;HEAP16[r1+8>>1]=r5>>>16;r2=r5&-65536;r5=r1+30|0;r3=HEAP16[r5>>1];if((r2|0)==-65536|(r2|0)==0){r6=r3&-2050}else{r6=r3|2049}HEAP16[r5>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?147:141)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_06(r1){var r2,r3,r4,r5,r6,r7,r8;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r2&65535;if(r2<<16>>16==0){r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r2>>2];r2=r1+28|0;HEAP16[r2>>1]=(HEAP16[r2>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r4=0;return r4}r2=r1+8|0;r5=r1+4|0;r6=HEAPU16[r2>>1]<<16|HEAPU16[r5>>1];r7=(r6>>>0)/(r3>>>0)&-1;if(r7>>>0>65535){r8=r1+1200|0;HEAP32[r8>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r8>>2];r8=r1+28|0;HEAP16[r8>>1]=(HEAP16[r8>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r4=0;return r4}else{HEAP16[r5>>1]=r7;HEAP16[r2>>1]=(r6>>>0)%(r3>>>0)&-1;r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?159:153)+HEAP32[r3>>2];r4=HEAPU16[r1+1196>>1]+1|0;return r4}}function _op_f7_07(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+8|0;r3=HEAPU16[r2>>1];r4=r3<<16;r5=r1+4|0;r6=r4|HEAPU16[r5>>1];r7=_e86_get_ea16(r1)&65535;r8=(r7&32768|0)!=0;r9=r8?r7|-65536:r7;if((r9|0)==0){r10=r1+1200|0;HEAP32[r10>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r10>>2];r10=r1+28|0;HEAP16[r10>>1]=(HEAP16[r10>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r11=0;return r11}r10=(r4|0)<0;r4=r10?-r6|0:r6;r6=r8?-r9|0:r7;r9=(r4>>>0)/(r6>>>0)&-1;r8=(r4>>>0)%(r6>>>0)&-1;do{if((r3>>>15|0)==(r7>>>15|0)){if(r9>>>0>32767){r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r6>>2];r6=r1+28|0;HEAP16[r6>>1]=(HEAP16[r6>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r11=0;return r11}else{r12=r9&65535}}else{if(r9>>>0<=32768){r12=-r9&65535;break}r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r6>>2];r6=r1+28|0;HEAP16[r6>>1]=(HEAP16[r6>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r11=0;return r11}}while(0);if(r10){r13=-r8&65535}else{r13=r8&65535}HEAP16[r5>>1]=r12;HEAP16[r2>>1]=r13;r13=r1+1200|0;HEAP32[r13>>2]=((HEAP32[r1+1184>>2]|0)!=0?180:174)+HEAP32[r13>>2];r11=HEAPU16[r1+1196>>1]+1|0;return r11}function _op_f6_00(r1){var r2,r3;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;_e86_set_flg_log_8(r1,HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]&r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?11:5)+HEAP32[r2>>2];return HEAPU16[r3>>1]+2|0}function _op_f6_02(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);_e86_set_ea8(r1,~_e86_get_ea8(r1));r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f6_03(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);_e86_set_ea8(r1,-r2&255);_e86_set_flg_sub_8(r1,0,r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f6_04(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1)&255;r3=r1+4|0;r4=(HEAP16[r3>>1]&255)*r2&65535;HEAP16[r3>>1]=r4;r3=r1+30|0;r2=HEAP16[r3>>1];r5=(r4&65535)<256?r2&-2050:r2|2049;HEAP16[r3>>1]=r4<<16>>16==0?r5|64:r5&-65;r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?79:73)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f6_05(r1){var r2,r3,r4,r5,r6;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1)&255;r3=r1+4|0;r4=HEAPU16[r3>>1];r5=Math_imul((r4&128|0)!=0?r4|65280:r4&255,(r2&128|0)!=0?r2|65280:r2)|0;HEAP16[r3>>1]=r5;r3=r5&65280;r5=r1+30|0;r2=HEAP16[r5>>1];if((r3|0)==65280|(r3|0)==0){r6=r2&-2050}else{r6=r2|2049}HEAP16[r5>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?95:89)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f6_06(r1){var r2,r3,r4,r5,r6;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r2&255;if(r2<<24>>24==0){r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r2>>2];r2=r1+28|0;HEAP16[r2>>1]=(HEAP16[r2>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r4=0;return r4}r2=r1+4|0;r5=HEAPU16[r2>>1];r6=(r5>>>0)/(r3>>>0)&-1;if((r6&65280|0)==0){HEAP16[r2>>1]=((r5>>>0)%(r3>>>0)&-1)<<8|r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?91:85)+HEAP32[r6>>2];r4=HEAPU16[r1+1196>>1]+1|0;return r4}else{r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r6>>2];r6=r1+28|0;HEAP16[r6>>1]=(HEAP16[r6>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r4=0;return r4}}function _op_f6_07(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+4|0;r3=HEAP16[r2>>1];r4=_e86_get_ea8(r1)<<24>>24<0;r5=_e86_get_ea8(r1)&255;r6=r4?r5|65280:r5;if((r6|0)==0){r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r5>>2];r5=r1+28|0;HEAP16[r5>>1]=(HEAP16[r5>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r7=0;return r7}r5=r3&65535;r4=(r5&32768|0)!=0;r8=r4?-r3&65535:r3;if((r6&32768|0)==0){r9=r6&65535}else{r9=65536-r6&65535}r3=(r8&65535)/(r9&65535)&-1;r10=(r8&65535)%(r9&65535)&-1;do{if((r5>>>15|0)==(r6>>>15|0)){if((r3&65535)>127){r9=r1+1200|0;HEAP32[r9>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r9>>2];r9=r1+28|0;HEAP16[r9>>1]=(HEAP16[r9>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r7=0;return r7}else{r11=r3}}else{if((r3&65535)<=128){r11=-r3&255;break}r9=r1+1200|0;HEAP32[r9>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r9>>2];r9=r1+28|0;HEAP16[r9>>1]=(HEAP16[r9>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r7=0;return r7}}while(0);if(r4){r12=-r10&255}else{r12=r10}HEAP16[r2>>1]=r12<<8|r11;r11=r1+1200|0;HEAP32[r11>>2]=((HEAP32[r1+1184>>2]|0)!=0?112:106)+HEAP32[r11>>2];r7=HEAPU16[r1+1196>>1]+1|0;return r7}function _op_83_00(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(r4&128|0)!=0?r4|65280:r4;_e86_set_ea16(r1,r5+(r2&65535)&65535);_e86_set_flg_add_16(r1,r2,r5&65535);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_01(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1)&65535;r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(((r4&128|0)!=0?r4|65280:r4)|r2)&65535;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_02(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(r4&128|0)!=0?r4|65280:r4;r4=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r4&65535)+(r2&65535)+r5&65535);_e86_set_flg_adc_16(r1,r2,r5&65535,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_83_03(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(r4&128|0)!=0?r4|65280:r4;r4=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r2&65535)-(r4&65535)-r5&65535);_e86_set_flg_sbb_16(r1,r2,r5&65535,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_83_04(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1)&65535;r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=((r4&128|0)!=0?r4|65280:r4)&r2&65535;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_05(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(r4&128|0)!=0?r4|65280:r4;_e86_set_ea16(r1,(r2&65535)-r5&65535);_e86_set_flg_sub_16(r1,r2,r5&65535);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_06(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1)&65535;r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(((r4&128|0)!=0?r4|65280:r4)^r2)&65535;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_07(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];_e86_set_flg_sub_16(r1,r2,((r4&128|0)!=0?r4|65280:r4)&65535);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_81_00(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0];_e86_set_ea16(r1,r5+(r2&65535)&65535);_e86_set_flg_add_16(r1,r2,r5&65535);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_01(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+1+(r1+128)|0]|r2|HEAPU8[r4+2+(r1+128)|0]<<8;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_02(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0];r4=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,r5+(r2&65535)+(r4&65535)&65535);_e86_set_flg_adc_16(r1,r2,r5&65535,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+3|0}function _op_81_03(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0];r4=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r2&65535)-r5-(r4&65535)&65535);_e86_set_flg_sbb_16(r1,r2,r5&65535,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+3|0}function _op_81_04(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=(HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0])&r2;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_05(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0];_e86_set_ea16(r1,(r2&65535)-r5&65535);_e86_set_flg_sub_16(r1,r2,r5&65535);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_06(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=(HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0])^r2;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_07(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];_e86_set_flg_sub_16(r1,r2,HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0]);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+3|0}function _op_80_00(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0];_e86_set_ea8(r1,r4+r2&255);_e86_set_flg_add_8(r1,r2,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_01(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]|r2;_e86_set_ea8(r1,r4);_e86_set_flg_log_8(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_02(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=HEAP16[r1+30>>1]&1;_e86_set_ea8(r1,((r4&255)+(r2&255)&65535)+r5&255);_e86_set_flg_adc_8(r1,r2,r4,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_80_03(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=HEAP16[r1+30>>1]&1;_e86_set_ea8(r1,((r2&255)-(r4&255)&65535)-r5&255);_e86_set_flg_sbb_8(r1,r2,r4,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_80_04(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]&r2;_e86_set_ea8(r1,r4);_e86_set_flg_log_8(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_05(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0];_e86_set_ea8(r1,r2-r4&255);_e86_set_flg_sub_8(r1,r2,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_06(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]^r2;_e86_set_ea8(r1,r4);_e86_set_flg_log_8(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_07(r1){var r2,r3;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;_e86_set_flg_sub_8(r1,r2,HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r2>>2];return HEAPU16[r3>>1]+2|0}function _e86_pq_init(r1){HEAP32[r1+124>>2]=0;return}function _e86_pq_fill(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=HEAP16[r1+22>>1];r3=HEAP32[r1+120>>2];r4=HEAPU16[r1+28>>1];L1:do{if(r4>>>0>(65535-r3|0)>>>0){r5=HEAP32[r1+124>>2];if(r5>>>0<r3>>>0){r6=(r2&65535)<<4;r7=r1+80|0;r8=r1+76|0;r9=r1+72|0;r10=r1+44|0;r11=r1+32|0;r12=r5;while(1){r5=HEAP32[r7>>2]&(r12+r4&65535)+r6;r13=r5+1|0;if(r13>>>0<HEAP32[r8>>2]>>>0){r14=HEAP32[r9>>2];r15=HEAP8[r14+r13|0];r16=HEAP8[r14+r5|0]}else{r14=FUNCTION_TABLE[HEAP32[r10>>2]](HEAP32[r11>>2],r5);r15=(r14&65535)>>>8&255;r16=r14&255}HEAP8[r12+(r1+128)|0]=r16;HEAP8[r12+1+(r1+128)|0]=r15;r14=r12+2|0;if(r14>>>0<r3>>>0){r12=r14}else{break}}}}else{r12=r1+80|0;r11=HEAP32[r12>>2];r10=r11&((r2&65535)<<4)+r4;r9=HEAP32[r1+124>>2];r8=r9>>>0<r3>>>0;if((r10+r3|0)>>>0<=HEAP32[r1+76>>2]>>>0){if(!r8){break}r6=r1+72|0;r7=r9;while(1){HEAP8[r7+(r1+128)|0]=HEAP8[HEAP32[r6>>2]+(r7+r10)|0];r14=r7+1|0;if(r14>>>0<r3>>>0){r7=r14}else{break L1}}}if(r8){r7=r1+44|0;r6=r1+32|0;r14=r9;r5=r11;while(1){r13=FUNCTION_TABLE[HEAP32[r7>>2]](HEAP32[r6>>2],r5&r14+r10);HEAP8[r14+(r1+128)|0]=r13;HEAP8[r14+1+(r1+128)|0]=(r13&65535)>>>8;r13=r14+2|0;if(r13>>>0>=r3>>>0){break L1}r14=r13;r5=HEAP32[r12>>2]}}}}while(0);HEAP32[r1+124>>2]=HEAP32[r1+116>>2];return}function _e86_pq_adjust(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r1+124|0;r4=HEAP32[r3>>2];if(r4>>>0<=r2>>>0){r5=0;HEAP32[r3>>2]=r5;return}if((r4|0)==(r2|0)){r6=r2}else{r7=r4-r2|0;r4=r1+128|0;r8=r2+(r1+128)|0;while(1){HEAP8[r4]=HEAP8[r8];r1=r7-1|0;if((r1|0)==0){break}else{r7=r1;r4=r4+1|0;r8=r8+1|0}}r6=HEAP32[r3>>2]}r5=r6-r2|0;HEAP32[r3>>2]=r5;return}function _e80186_dma_init(r1){HEAP8[r1+24|0]=0;HEAP8[r1+25|0]=0;HEAP8[r1+26|0]=0;HEAP32[r1+84>>2]=0;HEAP32[r1+88>>2]=0;HEAP8[r1+92|0]=0;HEAP32[r1+96>>2]=0;HEAP32[r1+100>>2]=0;_memset(r1+32|0,0,49)|0;return}function _e80186_dma_set_getmem_fct(r1,r2,r3,r4){HEAP32[r1+32>>2]=r2;HEAP32[r1+36>>2]=r3;HEAP32[r1+40>>2]=r4;return}function _e80186_dma_set_setmem_fct(r1,r2,r3,r4){HEAP32[r1+44>>2]=r2;HEAP32[r1+48>>2]=r3;HEAP32[r1+52>>2]=r4;return}function _e80186_dma_set_getio_fct(r1,r2,r3,r4){HEAP32[r1+56>>2]=r2;HEAP32[r1+60>>2]=r3;HEAP32[r1+64>>2]=r4;return}function _e80186_dma_set_setio_fct(r1,r2,r3,r4){HEAP32[r1+68>>2]=r2;HEAP32[r1+72>>2]=r3;HEAP32[r1+76>>2]=r4;return}function _e80186_dma_set_int_fct(r1,r2,r3,r4){if((r2|0)==1){HEAP32[r1+96>>2]=r3;HEAP32[r1+100>>2]=r4;return}else if((r2|0)==0){HEAP32[r1+84>>2]=r3;HEAP32[r1+88>>2]=r4;return}else{return}}function _e80186_dma_reset(r1){HEAP8[r1+26|0]=0;HEAP32[r1+28>>2]=0;_memset(r1,0,24)|0;return}function _e80186_dma_set_dreq0(r1,r2){HEAP8[r1+24|0]=r2<<24>>24!=0|0;r2=r1+26|0;HEAP8[r2]=HEAP8[r2]|1;return}function _e80186_dma_get_src(r1,r2){return HEAP32[r1+8+((r2&1)<<2)>>2]}function _e80186_dma_get_src_hi(r1,r2){return HEAP32[r1+8+((r2&1)<<2)>>2]>>>16&15}function _e80186_dma_set_src_hi(r1,r2,r3){var r4;r4=r1+8+((r2&1)<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&65535|(r3&65535)<<16&983040;return}function _e80186_dma_get_src_lo(r1,r2){return HEAP32[r1+8+((r2&1)<<2)>>2]&65535}function _e80186_dma_set_src_lo(r1,r2,r3){var r4;r4=r1+8+((r2&1)<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&-65536|r3&65535;return}function _e80186_dma_get_dst(r1,r2){return HEAP32[r1+16+((r2&1)<<2)>>2]}function _e80186_dma_get_dst_hi(r1,r2){return HEAP32[r1+16+((r2&1)<<2)>>2]>>>16&15}function _e80186_dma_set_dst_hi(r1,r2,r3){var r4;r4=r1+16+((r2&1)<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&65535|(r3&65535)<<16&983040;return}function _e80186_dma_get_dst_lo(r1,r2){return HEAP32[r1+16+((r2&1)<<2)>>2]&65535}function _e80186_dma_set_dst_lo(r1,r2,r3){var r4;r4=r1+16+((r2&1)<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&-65536|r3&65535;return}function _e80186_dma_get_control(r1,r2){return HEAP16[r1+((r2&1)<<1)>>1]}function _e80186_dma_set_control(r1,r2,r3){var r4,r5;r4=r2&1;if((r4|0)==0){r2=r1+80|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r2=HEAP32[r1+88>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+84>>2],0)}}}else{r2=r1+92|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r2=HEAP32[r1+100>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+96>>2],0)}}}r2=r1+(r4<<1)|0;if((r3&4)==0){r5=HEAP16[r2>>1]&2|r3&-3}else{r5=r3}HEAP16[r2>>1]=r5;r5=r1+26|0;HEAP8[r5]=HEAPU8[r5]|1<<r4;return}function _e80186_dma_get_count(r1,r2){return HEAP16[r1+4+((r2&1)<<1)>>1]}function _e80186_dma_set_count(r1,r2,r3){var r4;if((r2|0)==0){r4=r1+80|0;if((HEAP8[r4]|0)!=0){HEAP8[r4]=0;r4=HEAP32[r1+88>>2];if((r4|0)!=0){FUNCTION_TABLE[r4](HEAP32[r1+84>>2],0)}}}else{r4=r1+92|0;if((HEAP8[r4]|0)!=0){HEAP8[r4]=0;r4=HEAP32[r1+100>>2];if((r4|0)!=0){FUNCTION_TABLE[r4](HEAP32[r1+96>>2],0)}}}HEAP16[r1+4+((r2&1)<<1)>>1]=r3;return}function _e80186_dma_clock2(r1,r2){var r3,r4,r5,r6;r3=0;r4=r1+28|0;r5=r2;r2=HEAP32[r4>>2];while(1){if(r5>>>0<r2>>>0){break}HEAP32[r4>>2]=0;_e80186_dma_clock_chn(r1,0);_e80186_dma_clock_chn(r1,1);r6=HEAP32[r4>>2];if((r6|0)==0){r3=5;break}else{r5=r5-r2|0;r2=r6}}if(r3==5){return}HEAP32[r4>>2]=r2-r5;return}function _e80186_dma_clock_chn(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=1<<r2;r4=r1+26|0;r5=HEAPU8[r4]&(r3^255);HEAP8[r4]=r5;r6=r1+(r2<<1)|0;r7=HEAPU16[r6>>1];if((r7&2|0)==0){return}r8=r7>>>6&3;if((r8|0)!=0){if((r7&16|0)!=0){return}if((HEAP8[r2+(r1+24)|0]|0)==0){return}}HEAP8[r4]=r5|r3;r3=r7&1;r5=(r3|0)!=0;do{if((r7&4096|0)==0){if(r5){r4=HEAP32[r1+64>>2];if((r4|0)==0){r9=0;break}r9=FUNCTION_TABLE[r4](HEAP32[r1+56>>2],HEAP32[r1+8+(r2<<2)>>2]);break}else{r4=HEAP32[r1+60>>2];if((r4|0)==0){r9=0;break}r9=FUNCTION_TABLE[r4](HEAP32[r1+56>>2],HEAP32[r1+8+(r2<<2)>>2])&255;break}}else{if(r5){r4=HEAP32[r1+40>>2];if((r4|0)==0){r9=0;break}r9=FUNCTION_TABLE[r4](HEAP32[r1+32>>2],HEAP32[r1+8+(r2<<2)>>2]);break}else{r4=HEAP32[r1+36>>2];if((r4|0)==0){r9=0;break}r9=FUNCTION_TABLE[r4](HEAP32[r1+32>>2],HEAP32[r1+8+(r2<<2)>>2])&255;break}}}while(0);do{if((r7&32768|0)==0){if(r5){r4=HEAP32[r1+76>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+68>>2],HEAP32[r1+16+(r2<<2)>>2],r9);break}else{r4=HEAP32[r1+72>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+68>>2],HEAP32[r1+16+(r2<<2)>>2],r9&255);break}}else{if(r5){r4=HEAP32[r1+52>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+44>>2],HEAP32[r1+16+(r2<<2)>>2],r9);break}else{r4=HEAP32[r1+48>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+44>>2],HEAP32[r1+16+(r2<<2)>>2],r9&255);break}}}while(0);r9=r3+1|0;r3=r7&3072;if((r3|0)==2048){r5=r1+8+(r2<<2)|0;HEAP32[r5>>2]=HEAP32[r5>>2]-r9}else if((r3|0)==1024){r3=r1+8+(r2<<2)|0;HEAP32[r3>>2]=HEAP32[r3>>2]+r9}r3=r7&24576;if((r3|0)==8192){r5=r1+16+(r2<<2)|0;HEAP32[r5>>2]=HEAP32[r5>>2]+r9}else if((r3|0)==16384){r3=r1+16+(r2<<2)|0;HEAP32[r3>>2]=HEAP32[r3>>2]-r9}r9=r1+4+(r2<<1)|0;r3=HEAPU16[r9>>1]+65535|0;HEAP16[r9>>1]=r3;do{if(((r3&65535|0)==0?(r7&512|0)!=0:0)?(HEAP16[r6>>1]=HEAP16[r6>>1]&-3,(r7&256|0)!=0):0){if((r2|0)==0){r9=r1+80|0;if((HEAP8[r9]|0)==1){break}HEAP8[r9]=1;r9=HEAP32[r1+88>>2];if((r9|0)==0){break}FUNCTION_TABLE[r9](HEAP32[r1+84>>2],1);break}else{r9=r1+92|0;if((HEAP8[r9]|0)==1){break}HEAP8[r9]=1;r9=HEAP32[r1+100>>2];if((r9|0)==0){break}FUNCTION_TABLE[r9](HEAP32[r1+96>>2],1);break}}}while(0);r2=r1+28|0;r1=HEAP32[r2>>2];HEAP32[r2>>2]=r1+8;if((r8|0)!=2){return}HEAP32[r2>>2]=r1+10;return}function _e80186_icu_init(r1){var r2;HEAP16[r1>>1]=253;HEAP16[r1+2>>1]=0;HEAP16[r1+30>>1]=15;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=15;HEAP16[r1+36>>1]=15;HEAP16[r1+38>>1]=127;HEAP16[r1+40>>1]=127;HEAP16[r1+42>>1]=31;HEAP16[r1+44>>1]=31;HEAP8[r1+84|0]=0;HEAP32[r1+80>>2]=0;r2=r1+88|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;return}function _e80186_icu_set_intr_fct(r1,r2,r3){HEAP32[r1+80>>2]=r2;HEAP32[r1+88>>2]=r3;return}function _e80186_icu_set_inta0_fct(r1,r2,r3){HEAP32[r1+92>>2]=r2;HEAP32[r1+96>>2]=r3;return}function _e80186_icu_reset(r1){var r2;HEAP16[r1+4>>1]=0;HEAP16[r1+6>>1]=0;HEAP16[r1+8>>1]=0;HEAP16[r1+10>>1]=7;r2=r1+84|0;_memset(r1+12|0,0,18)|0;_memset(r1+48|0,0,32)|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+88>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+80>>2],0);return}function _e80186_icu_set_irq(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=1<<r2;r2=HEAPU16[r1>>1];r5=r4&65535;if((r5&~r2|0)!=0){return}r6=r1+2|0;r7=HEAPU16[r6>>1];do{if((r3|0)==0){if((r5&~r7|0)==0){r8=(r4|-65536)^65535;HEAP16[r6>>1]=r7&r8;r9=r1+4|0;r10=HEAPU16[r9>>1]&r8&65535;HEAP16[r9>>1]=r10;r11=r10;break}else{return}}else{if((r7&r5|0)==0){HEAP16[r6>>1]=r7|r4;r10=r1+4|0;r9=(HEAPU16[r10>>1]|r4)&65535;HEAP16[r10>>1]=r9;r11=r9;break}else{return}}}while(0);r4=r1+6|0;r7=r1+10|0;r6=r1+8|0;r5=r1+26|0;r3=7;r9=0;r10=0;while(1){r8=128>>>(r10>>>0);do{if((r8&r2|0)!=0?(HEAPU16[r4>>1]&r8|0)==0:0){r12=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r12>>>0<=r3>>>0?r12>>>0<=(HEAP16[r7>>1]&7)>>>0:0){if((HEAPU16[r6>>1]&r8|0)!=0?(HEAP16[r5>>1]&64)==0:0){r13=0;r14=7;break}r15=(r11&65535&r8|0)==0;r13=r15?r9:r8;r14=r15?r3:r12}else{r13=r9;r14=r3}}else{r13=r9;r14=r3}}while(0);r8=r10+1|0;if(r8>>>0<8){r3=r14;r9=r13;r10=r8}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r13|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r13=HEAP32[r1+88>>2];if((r13|0)==0){return}FUNCTION_TABLE[r13](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_set_irq_tmr0(r1,r2){var r3,r4;r3=r1+12|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=r2<<24>>24==0?r4&-2:r4|1;_e80186_icu_set_irq(r1,0,r2&255);return}function _e80186_icu_set_irq_tmr1(r1,r2){var r3,r4;r3=r1+12|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=r2<<24>>24==0?r4&-3:r4|2;_e80186_icu_set_irq(r1,0,r2&255);return}function _e80186_icu_set_irq_tmr2(r1,r2){var r3,r4;r3=r1+12|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=r2<<24>>24==0?r4&-5:r4|4;_e80186_icu_set_irq(r1,0,r2&255);return}function _e80186_icu_set_irq_dma0(r1,r2){_e80186_icu_set_irq(r1,2,r2&255);return}function _e80186_icu_set_irq_dma1(r1,r2){_e80186_icu_set_irq(r1,3,r2&255);return}function _e80186_icu_set_irq_int0(r1,r2){_e80186_icu_set_irq(r1,4,r2&255);return}function _e80186_icu_get_icon(r1,r2){var r3;if(r2>>>0>7){r3=0;return r3}if((HEAPU16[r1>>1]&1<<r2|0)==0){r3=0;return r3}r3=HEAP16[r1+14+(r2<<1)>>1];return r3}function _e80186_icu_set_icon(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;if(r2>>>0>7){return}r4=r1|0;r5=1<<r2;if((HEAPU16[r4>>1]&r5|0)==0){return}HEAP16[r1+14+(r2<<1)>>1]=HEAP16[r1+30+(r2<<1)>>1]&r3;if((r3&8)==0){r3=r1+6|0;r2=HEAPU16[r3>>1]&(r5^65535)&65535;HEAP16[r3>>1]=r2;r6=r2}else{r2=r1+6|0;r3=(HEAPU16[r2>>1]|r5)&65535;HEAP16[r2>>1]=r3;r6=r3}r3=HEAPU16[r4>>1];r4=r1+10|0;r2=r1+8|0;r5=r1+4|0;r7=r1+26|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r3|0)!=0?(r6&65535&r11|0)==0:0){r12=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r12>>>0<=r8>>>0?r12>>>0<=(HEAP16[r4>>1]&7)>>>0:0){if((HEAPU16[r2>>1]&r11|0)!=0?(HEAP16[r7>>1]&64)==0:0){r13=0;r14=7;break}r15=(HEAPU16[r5>>1]&r11|0)==0;r13=r15?r9:r11;r14=r15?r8:r12}else{r13=r9;r14=r8}}else{r13=r9;r14=r8}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r14;r9=r13;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r13|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r13=HEAP32[r1+88>>2];if((r13|0)==0){return}FUNCTION_TABLE[r13](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_imr(r1){return HEAP16[r1+6>>1]}function _e80186_icu_set_imr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;HEAP16[r1+6>>1]=r2;r3=r2&65535;r2=r1+14|0;r4=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&1|0)==0?r4&-9:r4|8;r4=r1+16|0;r2=HEAP16[r4>>1];HEAP16[r4>>1]=(r3&2|0)==0?r2&-9:r2|8;r2=r1+18|0;r4=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&4|0)==0?r4&-9:r4|8;r4=r1+20|0;r2=HEAP16[r4>>1];HEAP16[r4>>1]=(r3&8|0)==0?r2&-9:r2|8;r2=r1+22|0;r4=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&16|0)==0?r4&-9:r4|8;r4=r1+24|0;r2=HEAP16[r4>>1];HEAP16[r4>>1]=(r3&32|0)==0?r2&-9:r2|8;r2=r1+26|0;r4=HEAP16[r2>>1];r5=(r3&64|0)==0?r4&-9:r4|8;HEAP16[r2>>1]=r5;r2=r1+28|0;r4=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&128|0)==0?r4&-9:r4|8;r4=HEAPU16[r1>>1];r2=r1+10|0;r6=r1+8|0;r7=r1+4|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r4|0)!=0?(r3&r11|0)==0:0){r12=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r12>>>0<=r8>>>0?r12>>>0<=(HEAP16[r2>>1]&7)>>>0:0){if((HEAPU16[r6>>1]&r11|0)!=0?(r5&64)==0:0){r13=0;r14=7;break}r15=(HEAPU16[r7>>1]&r11|0)==0;r13=r15?r9:r11;r14=r15?r8:r12}else{r13=r9;r14=r8}}else{r13=r9;r14=r8}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r14;r9=r13;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r13|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r13=HEAP32[r1+88>>2];if((r13|0)==0){return}FUNCTION_TABLE[r13](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_pmr(r1){return HEAP16[r1+10>>1]}function _e80186_icu_set_pmr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;HEAP16[r1+10>>1]=r2;r3=HEAPU16[r1>>1];r4=r1+6|0;r5=r1+8|0;r6=r1+4|0;r7=r1+26|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r3|0)!=0?(HEAPU16[r4>>1]&r11|0)==0:0){r12=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r12>>>0<=r8>>>0?r12>>>0<=(r2&7)>>>0:0){if((HEAPU16[r5>>1]&r11|0)!=0?(HEAP16[r7>>1]&64)==0:0){r13=0;r14=7;break}r15=(HEAPU16[r6>>1]&r11|0)==0;r13=r15?r9:r11;r14=r15?r8:r12}else{r13=r9;r14=r8}}else{r13=r9;r14=r8}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r14;r9=r13;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r13|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r13=HEAP32[r1+88>>2];if((r13|0)==0){return}FUNCTION_TABLE[r13](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_isr(r1){return HEAP16[r1+8>>1]}function _e80186_icu_set_isr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;HEAP16[r1+8>>1]=r2;r3=HEAPU16[r1>>1];r4=r1+6|0;r5=r1+10|0;r6=r1+4|0;r7=r1+26|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r3|0)!=0?(HEAPU16[r4>>1]&r11|0)==0:0){r12=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r12>>>0<=r8>>>0?r12>>>0<=(HEAP16[r5>>1]&7)>>>0:0){if((r2&65535&r11|0)!=0?(HEAP16[r7>>1]&64)==0:0){r13=0;r14=7;break}r15=(HEAPU16[r6>>1]&r11|0)==0;r13=r15?r9:r11;r14=r15?r8:r12}else{r13=r9;r14=r8}}else{r13=r9;r14=r8}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r14;r9=r13;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r13|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r13=HEAP32[r1+88>>2];if((r13|0)==0){return}FUNCTION_TABLE[r13](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_irr(r1){return HEAP16[r1+4>>1]}function _e80186_icu_set_irr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;HEAP16[r1+4>>1]=r2;r3=HEAPU16[r1>>1];r4=r1+6|0;r5=r1+10|0;r6=r1+8|0;r7=r1+26|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r3|0)!=0?(HEAPU16[r4>>1]&r11|0)==0:0){r12=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r12>>>0<=r8>>>0?r12>>>0<=(HEAP16[r5>>1]&7)>>>0:0){if((HEAPU16[r6>>1]&r11|0)!=0?(HEAP16[r7>>1]&64)==0:0){r13=0;r14=7;break}r15=(r2&65535&r11|0)==0;r13=r15?r9:r11;r14=r15?r8:r12}else{r13=r9;r14=r8}}else{r13=r9;r14=r8}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r14;r9=r13;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r13|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r13=HEAP32[r1+88>>2];if((r13|0)==0){return}FUNCTION_TABLE[r13](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_set_eoi(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=HEAP16[r1>>1];do{if(r2<<16>>16<0){r4=r3&65535;r5=r1+8|0;r6=7;r7=0;r8=0;while(1){r9=128>>>(r8>>>0);if((r9&r4|0)!=0?(HEAPU16[r5>>1]&r9|0)!=0:0){r10=HEAP16[r1+14+(7-r8<<1)>>1]&7;r11=r10>>>0>r6>>>0;r12=r11?r7:r9;r13=r11?r6:r10}else{r12=r7;r13=r6}r10=r8+1|0;if(r10>>>0<8){r6=r13;r7=r12;r8=r10}else{break}}if((r12|0)==0){return}else{HEAP16[r5>>1]=HEAPU16[r5>>1]&(r12^65535);r14=r5;break}}else{r14=r1+8|0}}while(0);r12=r3&65535;r3=r1+6|0;r13=r1+10|0;r2=r1+4|0;r8=r1+26|0;r7=7;r6=0;r4=0;while(1){r10=128>>>(r4>>>0);do{if((r10&r12|0)!=0?(HEAPU16[r3>>1]&r10|0)==0:0){r11=HEAP16[r1+14+(7-r4<<1)>>1]&7;if(r11>>>0<=r7>>>0?r11>>>0<=(HEAP16[r13>>1]&7)>>>0:0){if((HEAPU16[r14>>1]&r10|0)!=0?(HEAP16[r8>>1]&64)==0:0){r15=0;r16=7;break}r9=(HEAPU16[r2>>1]&r10|0)==0;r15=r9?r6:r10;r16=r9?r7:r11}else{r15=r6;r16=r7}}else{r15=r6;r16=r7}}while(0);r10=r4+1|0;if(r10>>>0<8){r7=r16;r6=r15;r4=r10}else{break}}r4=r1+84|0;r6=HEAP8[r4];if((r15|0)==0){if(r6<<24>>24==0){return}HEAP8[r4]=0;r15=HEAP32[r1+88>>2];if((r15|0)==0){return}FUNCTION_TABLE[r15](HEAP32[r1+80>>2],0);return}else{if(r6<<24>>24==1){return}HEAP8[r4]=1;r4=HEAP32[r1+88>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_pollst(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e80186_icu_get_max_req(r1,0,0,r3)|0)!=0){r4=0;STACKTOP=r2;return r4}r4=(HEAP32[r3>>2]|32768)&65535;STACKTOP=r2;return r4}function _e80186_icu_get_max_req(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r5=HEAPU16[r1>>1];r6=r1+6|0;r7=r1+10|0;r8=r1+8|0;r9=r1+4|0;r10=r1+26|0;r11=7;r12=0;r13=-1;r14=0;while(1){r15=128>>>(r14>>>0);do{if((r5&r15|0)!=0?(HEAPU16[r6>>1]&r15|0)==0:0){r16=7-r14|0;r17=HEAP16[r1+14+(r16<<1)>>1]&7;if(r17>>>0<=r11>>>0?r17>>>0<=(HEAP16[r7>>1]&7)>>>0:0){if((HEAPU16[r8>>1]&r15|0)!=0?(HEAP16[r10>>1]&64)==0:0){r18=-1;r19=0;r20=7;break}r21=(HEAPU16[r9>>1]&r15|0)==0;r18=r21?r13:r16;r19=r21?r12:r15;r20=r21?r11:r17}else{r18=r13;r19=r12;r20=r11}}else{r18=r13;r19=r12;r20=r11}}while(0);r15=r14+1|0;if(r15>>>0<8){r11=r20;r12=r19;r13=r18;r14=r15}else{break}}if((r19|0)==0){r22=1;return r22}if((r2|0)!=0){HEAP32[r2>>2]=r18}if((r3|0)!=0){HEAP32[r3>>2]=r19}if((r4|0)==0){r22=0;return r22}HEAP32[r4>>2]=r18+8;if((r18|0)!=0){r22=0;return r22}r18=HEAPU16[r1+12>>1];if((r18&1|0)!=0){HEAP32[r4>>2]=8;r22=0;return r22}if((r18&2|0)!=0){HEAP32[r4>>2]=18;r22=0;return r22}if((r18&4|0)==0){r22=0;return r22}HEAP32[r4>>2]=19;r22=0;return r22}function _e80186_icu_get_poll(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;if((_e80186_icu_get_max_req(r1,r3,r4,r5)|0)!=0){r6=0;STACKTOP=r2;return r6}r7=HEAP32[r3>>2];r3=r1+14+(r7<<1)|0;r8=HEAP32[r4>>2];if((HEAP16[r3>>1]&16)==0){r4=r1+4|0;HEAP16[r4>>1]=HEAPU16[r4>>1]&(r8^65535)}r4=r1+48+(r7<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]+1;r4=r1+8|0;r9=HEAPU16[r4>>1]|r8;HEAP16[r4>>1]=r9;if((r7|0)==0){r4=r1+12|0;r8=HEAP16[r4>>1];HEAP16[r4>>1]=(r8+7&65535|-8)&r8}do{if((HEAP16[r3>>1]&32)!=0){if((r7|0)==5){r8=r1+104|0;if((HEAP32[r8>>2]|0)==0){break}r4=HEAPU16[r1>>1];r10=r1+6|0;r11=r1+10|0;r12=r1+4|0;r13=r1+26|0;r14=7;r15=0;r16=0;while(1){r17=128>>>(r16>>>0);do{if((r17&r4|0)!=0?(HEAPU16[r10>>1]&r17|0)==0:0){r18=HEAP16[r1+14+(7-r16<<1)>>1]&7;if(r18>>>0<=r14>>>0?r18>>>0<=(HEAP16[r11>>1]&7)>>>0:0){if((r9&65535&r17|0)!=0?(HEAP16[r13>>1]&64)==0:0){r19=0;r20=7;break}r21=(HEAPU16[r12>>1]&r17|0)==0;r19=r21?r15:r17;r20=r21?r14:r18}else{r19=r15;r20=r14}}else{r19=r15;r20=r14}}while(0);r17=r16+1|0;if(r17>>>0<8){r14=r20;r15=r19;r16=r17}else{break}}r16=r1+84|0;r15=HEAP8[r16];if((r19|0)==0){if(r15<<24>>24!=0){HEAP8[r16]=0;r14=HEAP32[r1+88>>2];if((r14|0)!=0){FUNCTION_TABLE[r14](HEAP32[r1+80>>2],0)}}}else{if(r15<<24>>24!=1){HEAP8[r16]=1;r16=HEAP32[r1+88>>2];if((r16|0)!=0){FUNCTION_TABLE[r16](HEAP32[r1+80>>2],1)}}}r6=FUNCTION_TABLE[HEAP32[r8>>2]](HEAP32[r1+100>>2])&255;STACKTOP=r2;return r6}else if((r7|0)==4){r16=r1+96|0;if((HEAP32[r16>>2]|0)==0){break}r15=HEAPU16[r1>>1];r14=r1+6|0;r12=r1+10|0;r13=r1+4|0;r11=r1+26|0;r10=7;r4=0;r17=0;while(1){r18=128>>>(r17>>>0);do{if((r18&r15|0)!=0?(HEAPU16[r14>>1]&r18|0)==0:0){r21=HEAP16[r1+14+(7-r17<<1)>>1]&7;if(r21>>>0<=r10>>>0?r21>>>0<=(HEAP16[r12>>1]&7)>>>0:0){if((r9&65535&r18|0)!=0?(HEAP16[r11>>1]&64)==0:0){r22=0;r23=7;break}r24=(HEAPU16[r13>>1]&r18|0)==0;r22=r24?r4:r18;r23=r24?r10:r21}else{r22=r4;r23=r10}}else{r22=r4;r23=r10}}while(0);r18=r17+1|0;if(r18>>>0<8){r10=r23;r4=r22;r17=r18}else{break}}r17=r1+84|0;r4=HEAP8[r17];if((r22|0)==0){if(r4<<24>>24!=0){HEAP8[r17]=0;r10=HEAP32[r1+88>>2];if((r10|0)!=0){FUNCTION_TABLE[r10](HEAP32[r1+80>>2],0)}}}else{if(r4<<24>>24!=1){HEAP8[r17]=1;r17=HEAP32[r1+88>>2];if((r17|0)!=0){FUNCTION_TABLE[r17](HEAP32[r1+80>>2],1)}}}r6=FUNCTION_TABLE[HEAP32[r16>>2]](HEAP32[r1+92>>2])&255;STACKTOP=r2;return r6}else{break}}}while(0);r22=HEAPU16[r1>>1];r23=r1+6|0;r7=r1+10|0;r19=r1+4|0;r20=r1+26|0;r3=7;r17=0;r4=0;while(1){r10=128>>>(r4>>>0);do{if((r10&r22|0)!=0?(HEAPU16[r23>>1]&r10|0)==0:0){r13=HEAP16[r1+14+(7-r4<<1)>>1]&7;if(r13>>>0<=r3>>>0?r13>>>0<=(HEAP16[r7>>1]&7)>>>0:0){if((r9&65535&r10|0)!=0?(HEAP16[r20>>1]&64)==0:0){r25=0;r26=7;break}r11=(HEAPU16[r19>>1]&r10|0)==0;r25=r11?r17:r10;r26=r11?r3:r13}else{r25=r17;r26=r3}}else{r25=r17;r26=r3}}while(0);r10=r4+1|0;if(r10>>>0<8){r3=r26;r17=r25;r4=r10}else{break}}r4=r1+84|0;r17=HEAP8[r4];if((r25|0)==0){if(r17<<24>>24!=0){HEAP8[r4]=0;r25=HEAP32[r1+88>>2];if((r25|0)!=0){FUNCTION_TABLE[r25](HEAP32[r1+80>>2],0)}}}else{if(r17<<24>>24!=1){HEAP8[r4]=1;r4=HEAP32[r1+88>>2];if((r4|0)!=0){FUNCTION_TABLE[r4](HEAP32[r1+80>>2],1)}}}r6=(HEAP32[r5>>2]|32768)&65535;STACKTOP=r2;return r6}function _e80186_icu_inta(r1){return _e80186_icu_get_poll(r1)&255}function _e80186_tcu_init(r1){var r2,r3;_memset(r1,0,21)|0;r2=r1+56|0;HEAP32[r1+88>>2]=0;HEAP32[r1+92>>2]=0;HEAP32[r1+96>>2]=0;r3=r1+24|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+20>>2]=0;HEAP32[r3+24>>2]=0;HEAP8[r3+28|0]=0;r3=r2;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+20>>2]=0;HEAP32[r3+24>>2]=0;HEAP8[r3+28|0]=0;return}function _e80186_tcu_set_int_fct(r1,r2,r3,r4){HEAP32[r1+(r2<<5)+12>>2]=r3;HEAP32[r1+(r2<<5)+16>>2]=r4;return}function _e80186_tcu_set_out_fct(r1,r2,r3,r4){HEAP32[r1+(r2<<5)+24>>2]=r3;HEAP32[r1+(r2<<5)+28>>2]=r4;return}function _e80186_tcu_get_control(r1,r2){return HEAP16[r1+(r2<<5)>>1]}function _e80186_tcu_set_control(r1,r2,r3){var r4,r5,r6;r4=r1+(r2<<5)|0;if((r3&16384)==0){r2=HEAP16[r4>>1];r5=r2&-32768|r3&32767;r6=r2}else{r5=r3;r6=HEAP16[r4>>1]}HEAP16[r4>>1]=r6&4096|r5&-4097;return}function _e80186_tcu_get_count(r1,r2){return HEAP16[r1+(r2<<5)+2>>1]}function _e80186_tcu_set_count(r1,r2,r3){HEAP16[r1+(r2<<5)+2>>1]=r3;return}function _e80186_tcu_get_max_count_a(r1,r2){return HEAP16[r1+(r2<<5)+4>>1]}function _e80186_tcu_set_max_count_a(r1,r2,r3){HEAP16[r1+(r2<<5)+4>>1]=r3;return}function _e80186_tcu_get_max_count_b(r1,r2){return HEAP16[r1+(r2<<5)+6>>1]}function _e80186_tcu_set_max_count_b(r1,r2,r3){HEAP16[r1+(r2<<5)+6>>1]=r3;return}function _e80186_tcu_set_input(r1,r2,r3){HEAP8[r1+(r2<<5)+8|0]=r3<<24>>24!=0|0;return}function _e80186_tcu_reset(r1){var r2,r3;HEAP8[r1+10|0]=0;r2=r1;r3=r2|0;tempBigInt=0;HEAP16[r3>>1]=tempBigInt;HEAP16[r3+2>>1]=tempBigInt>>16;r3=r2+4|0;tempBigInt=0;HEAP16[r3>>1]=tempBigInt;HEAP16[r3+2>>1]=tempBigInt>>16;HEAP8[r1+42|0]=0;r3=r1+32|0;r2=r3|0;tempBigInt=0;HEAP16[r2>>1]=tempBigInt;HEAP16[r2+2>>1]=tempBigInt>>16;r2=r3+4|0;tempBigInt=0;HEAP16[r2>>1]=tempBigInt;HEAP16[r2+2>>1]=tempBigInt>>16;HEAP8[r1+74|0]=0;r2=r1+64|0;r1=r2|0;tempBigInt=0;HEAP16[r1>>1]=tempBigInt;HEAP16[r1+2>>1]=tempBigInt>>16;r1=r2+4|0;tempBigInt=0;HEAP16[r1>>1]=tempBigInt;HEAP16[r1+2>>1]=tempBigInt>>16;return}function _e80186_tcu_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=0;if((r2|0)==0){return}r4=r1+96|0;r5=r1+74|0;r6=r2;r2=HEAP32[r4>>2];while(1){r7=r2&3;L6:do{if((r7|0)!=3){r8=r1+(r7<<5)|0;r9=HEAP16[r8>>1];r10=r1+(r7<<5)+9|0;r11=HEAP8[r10];r12=HEAP8[r1+(r7<<5)+8|0];HEAP8[r10]=r12;r10=r1+(r7<<5)+10|0;HEAP8[r10]=0;r13=r9&65535;if((r13&32768|0)!=0){if((r13&4|0)==0){if((r13&16|0)==0){if(r12<<24>>24==0){break}}else{if(!(r11<<24>>24!=0|r12<<24>>24==0)){HEAP16[r1+(r7<<5)+2>>1]=0;break}}if((r13&8|0)!=0?(HEAP8[r5]|0)==0:0){break}}else{if(r11<<24>>24!=0|r12<<24>>24==0){break}}r12=r1+(r7<<5)+2|0;r11=HEAP16[r12>>1]+1&65535;HEAP16[r12>>1]=r11;do{if((r13&2|0)==0){if((HEAP16[r1+(r7<<5)+4>>1]|0)!=r11<<16>>16){break L6}r14=r1+(r7<<5)+20|0;if((HEAP8[r14]|0)!=0){HEAP8[r14]=0;r15=r1+(r7<<5)+28|0;r16=HEAP32[r15>>2];if(!((r16|0)!=0?(FUNCTION_TABLE[r16](HEAP32[r1+(r7<<5)+24>>2],0),(HEAP8[r14]|0)==1):0)){r17=r15;r3=30}}else{r17=r1+(r7<<5)+28|0;r3=30}if(r3==30){r3=0;HEAP8[r14]=1;r14=HEAP32[r17>>2];if((r14|0)!=0){FUNCTION_TABLE[r14](HEAP32[r1+(r7<<5)+24>>2],1)}}if((r13&1|0)==0){HEAP16[r8>>1]=HEAP16[r8>>1]&32767}}else{if((r13&4096|0)==0){if((HEAP16[r1+(r7<<5)+4>>1]|0)!=r11<<16>>16){break L6}HEAP16[r8>>1]=r9|4096;r14=r1+(r7<<5)+20|0;if((HEAP8[r14]|0)==0){break}HEAP8[r14]=0;r14=HEAP32[r1+(r7<<5)+28>>2];if((r14|0)==0){break}FUNCTION_TABLE[r14](HEAP32[r1+(r7<<5)+24>>2],0);break}if((HEAP16[r1+(r7<<5)+6>>1]|0)!=r11<<16>>16){break L6}HEAP16[r8>>1]=r9&-4097;r14=r1+(r7<<5)+20|0;if((HEAP8[r14]|0)!=1){HEAP8[r14]=1;r14=HEAP32[r1+(r7<<5)+28>>2];if((r14|0)!=0){FUNCTION_TABLE[r14](HEAP32[r1+(r7<<5)+24>>2],1)}}if((r13&1|0)==0){HEAP16[r8>>1]=HEAP16[r8>>1]&32767}}}while(0);HEAP16[r12>>1]=0;HEAP16[r8>>1]=HEAP16[r8>>1]|32;HEAP8[r10]=1;if((r13&8192|0)!=0){r9=r1+(r7<<5)+11|0;if((HEAP8[r9]|0)!=0){HEAP8[r9]=0;r11=r1+(r7<<5)+16|0;r14=HEAP32[r11>>2];if((r14|0)!=0?(FUNCTION_TABLE[r14](HEAP32[r1+(r7<<5)+12>>2],0),(HEAP8[r9]|0)==1):0){break}else{r18=r11}}else{r18=r1+(r7<<5)+16|0}HEAP8[r9]=1;r9=HEAP32[r18>>2];if((r9|0)!=0){FUNCTION_TABLE[r9](HEAP32[r1+(r7<<5)+12>>2],1)}}}}}while(0);r7=HEAP32[r4>>2]+1|0;HEAP32[r4>>2]=r7;r9=r6-1|0;if((r9|0)==0){break}else{r6=r9;r2=r7}}return}function _e8255_init(r1){var r2;HEAP8[r1|0]=0;HEAP8[r1+1|0]=0;HEAP8[r1+2|0]=-128;HEAP8[r1+4|0]=0;HEAP8[r1+5|0]=0;HEAP8[r1+6|0]=0;r2=r1+8|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP16[r2+16>>1]=0;HEAP8[r2+18|0]=0;r2=r1+28|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP16[r2+16>>1]=0;HEAP8[r2+18|0]=0;r2=r1+48|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;return}function _e8255_get_inp(r1,r2){var r3,r4,r5,r6,r7;r3=r1+4+(r2*20&-1)|0;r4=r1+4+(r2*20&-1)+2|0;r5=HEAP8[r4];if(r5<<24>>24!=0){r6=HEAP32[r1+4+(r2*20&-1)+8>>2];if((r6|0)==0){r7=r5}else{HEAP8[r3|0]=FUNCTION_TABLE[r6](HEAP32[r1+4+(r2*20&-1)+4>>2]);r7=HEAP8[r4]}}else{r7=0}return HEAP8[r1+4+(r2*20&-1)+1|0]&~r7|r7&HEAP8[r3|0]}function _e8255_get_out(r1,r2){return HEAP8[r1+4+(r2*20&-1)+2|0]|HEAP8[r1+4+(r2*20&-1)+1|0]}function _e8255_set_inp_a(r1,r2){HEAP8[r1+4|0]=r2;return}function _e8255_set_inp_b(r1,r2){HEAP8[r1+24|0]=r2;return}function _e8255_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8;if((r2|0)==1){HEAP8[r1+25|0]=r3;r4=HEAP8[r1+26|0];if(r4<<24>>24==-1){return}r5=HEAP32[r1+40>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+36>>2],~r4&r3);return}else if((r2|0)==0){HEAP8[r1+5|0]=r3;r4=HEAP8[r1+6|0];if(r4<<24>>24==-1){return}r5=HEAP32[r1+20>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+16>>2],~r4&r3);return}else if((r2|0)==3){r4=r3&255;if((r4&128|0)!=0){HEAP8[r1+2|0]=r3;HEAP8[r1|0]=(r3&255)>>>5&3;HEAP8[r1+1|0]=(r3&255)>>>2&1;HEAP8[r1+6|0]=r4<<27>>31;HEAP8[r1+26|0]=r4<<30>>31;HEAP8[r1+46|0]=((r4&1|0)!=0?15:0)|((r4&8|0)!=0?-16:0);return}r5=r1+45|0;r6=HEAPU8[r5];r7=1<<(r4>>>1&7);if((r4&1|0)==0){r8=r6&(r7^255)&255}else{r8=(r6|r7)&255}HEAP8[r5]=r8;r5=HEAP8[r1+46|0];if(r5<<24>>24==-1){return}r7=HEAP32[r1+60>>2];if((r7|0)==0){return}FUNCTION_TABLE[r7](HEAP32[r1+56>>2],r8&~r5);return}else if((r2|0)==2){HEAP8[r1+45|0]=r3;r2=HEAP8[r1+46|0];if(r2<<24>>24==-1){return}r5=HEAP32[r1+60>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+56>>2],~r2&r3);return}else{return}}function _e8255_get_uint8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;if((r2|0)==2){r3=r1+44|0;r4=r1+46|0;r5=HEAP8[r4];if(r5<<24>>24!=0){r6=HEAP32[r1+52>>2];if((r6|0)==0){r7=r5}else{HEAP8[r3|0]=FUNCTION_TABLE[r6](HEAP32[r1+48>>2]);r7=HEAP8[r4]}}else{r7=0}r8=HEAP8[r1+45|0]&~r7|HEAP8[r3|0]&r7;return r8}else if((r2|0)==1){r7=r1+24|0;r3=r1+26|0;r4=HEAP8[r3];if(r4<<24>>24!=0){r6=HEAP32[r1+32>>2];if((r6|0)==0){r9=r4}else{HEAP8[r7|0]=FUNCTION_TABLE[r6](HEAP32[r1+28>>2]);r9=HEAP8[r3]}}else{r9=0}r8=HEAP8[r1+25|0]&~r9|HEAP8[r7|0]&r9;return r8}else if((r2|0)==3){r8=HEAP8[r1+2|0];return r8}else if((r2|0)==0){r2=r1+4|0;r9=r1+6|0;r7=HEAP8[r9];if(r7<<24>>24!=0){r3=HEAP32[r1+12>>2];if((r3|0)==0){r10=r7}else{HEAP8[r2|0]=FUNCTION_TABLE[r3](HEAP32[r1+8>>2]);r10=HEAP8[r9]}}else{r10=0}r8=HEAP8[r1+5|0]&~r10|HEAP8[r2|0]&r10;return r8}else{r8=0;return r8}}function _e8259_init(r1){var r2;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=0;r2=r1|0;HEAP8[r2]=0;HEAP8[r2+1|0]=0;HEAP8[r2+2|0]=0;HEAP8[r2+3|0]=0;HEAP8[r2+4|0]=0;HEAP8[r2+5|0]=0;HEAP8[r2+6|0]=0;HEAP32[r1+20>>2]=1;HEAP8[r1+7|0]=0;HEAP8[r1+8|0]=-1;HEAP8[r1+9|0]=0;HEAP8[r1+10|0]=0;_memset(r1+24|0,0,49)|0;return}function _e8259_set_irq0(r1,r2){_e8259_set_irq(r1,0,r2<<24>>24!=0|0);return}function _e8259_set_irq1(r1,r2){_e8259_set_irq(r1,1,r2<<24>>24!=0|0);return}function _e8259_set_irq2(r1,r2){_e8259_set_irq(r1,2,r2<<24>>24!=0|0);return}function _e8259_set_irq3(r1,r2){_e8259_set_irq(r1,3,r2<<24>>24!=0|0);return}function _e8259_set_irq4(r1,r2){_e8259_set_irq(r1,4,r2<<24>>24!=0|0);return}function _e8259_set_irq5(r1,r2){_e8259_set_irq(r1,5,r2<<24>>24!=0|0);return}function _e8259_set_irq6(r1,r2){_e8259_set_irq(r1,6,r2<<24>>24!=0|0);return}function _e8259_set_irq7(r1,r2){_e8259_set_irq(r1,7,r2<<24>>24!=0|0);return}function _e8259_set_int_fct(r1,r2,r3){HEAP32[r1+64>>2]=r2;HEAP32[r1+68>>2]=r3;return}function _e8259_set_irq(r1,r2,r3){var r4,r5,r6,r7,r8;r4=1<<(r2&7);r2=r1+10|0;r5=HEAPU8[r2];if(!((r4&r5|0)!=0^r3<<24>>24!=0)){return}if(r3<<24>>24==0){r3=(r4|-256)^255;HEAP8[r2]=r5&r3;r6=r1+7|0;r7=HEAPU8[r6]&r3&255;HEAP8[r6]=r7;r8=r7}else{HEAP8[r2]=r5|r4;r5=r1+7|0;r2=(HEAPU8[r5]|r4)&255;HEAP8[r5]=r2;r8=r2}r2=~HEAPU8[r1+8|0];r5=r8&255&r2;if((r5|0)==0){r8=r1+72|0;if((HEAP8[r8]|0)==0){return}HEAP8[r8]=0;r8=HEAP32[r1+68>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+64>>2],0);return}r8=HEAPU8[r1+9|0]&r2;r2=1<<HEAP32[r1+24>>2];L18:do{if((r8&r2|0)==0){r4=r2;while(1){if((r4&r5|0)!=0){break}r7=r4<<1|r4>>>7;if((r7&r8|0)==0){r4=r7&255}else{break L18}}r4=r1+72|0;if((HEAP8[r4]|0)==1){return}HEAP8[r4]=1;r4=HEAP32[r1+68>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+64>>2],1);return}}while(0);r8=r1+72|0;if((HEAP8[r8]|0)==0){return}HEAP8[r8]=0;r8=HEAP32[r1+68>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+64>>2],0);return}function _e8259_inta(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=r1+72|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+68>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+64>>2],0)}}r3=r1+7|0;r4=HEAP8[r3];r5=r1+8|0;r6=r4&~HEAP8[r5];if(r6<<24>>24==0){_fwrite(11552,24,1,HEAP32[_stderr>>2]);r7=HEAP32[r1+12>>2]+7&255;return r7}r8=r6&255;r6=r1+24|0;r9=HEAP32[r6>>2];r10=(r8<<8|r8)>>>((r9&7)>>>0);if((r10&1|0)==0){r8=r9;r11=r10;while(1){r10=r11>>>1;r12=r8+1|0;if((r10&1|0)==0){r8=r12;r11=r10}else{r13=r12;break}}}else{r13=r9}r9=r13&7;r11=1<<r9;HEAP8[r3]=(r11^255)&(r4&255);if((HEAP8[r1+3|0]&2)!=0){if((HEAP32[r1+28>>2]|0)!=0){HEAP32[r6>>2]=r13+1&7}}else{r13=r1+9|0;HEAP8[r13]=HEAPU8[r13]|r11}r11=r1+32+(r9<<2)|0;HEAP32[r11>>2]=HEAP32[r11>>2]+1;r11=~HEAPU8[r5];r5=HEAPU8[r3]&r11;L18:do{if((r5|0)==0){if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+68>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+64>>2],0)}}}else{r3=HEAPU8[r1+9|0]&r11;r13=1<<HEAP32[r6>>2];L20:do{if((r3&r13|0)==0){r4=r13;while(1){if((r4&r5|0)!=0){break}r8=r4<<1|r4>>>7;if((r8&r3|0)==0){r4=r8&255}else{break L20}}if((HEAP8[r2]|0)==1){break L18}HEAP8[r2]=1;r4=HEAP32[r1+68>>2];if((r4|0)==0){break L18}FUNCTION_TABLE[r4](HEAP32[r1+64>>2],1);break L18}}while(0);if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+68>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+64>>2],0)}}}}while(0);r7=HEAP32[r1+12>>2]+r9&255;return r7}function _e8259_get_irr(r1){return HEAP8[r1+7|0]}function _e8259_get_imr(r1){return HEAP8[r1+8|0]}function _e8259_get_isr(r1){return HEAP8[r1+9|0]}function _e8259_get_icw(r1,r2){var r3;if(r2>>>0<4){r3=HEAP8[r1+r2|0]}else{r3=0}return r3}function _e8259_get_ocw(r1,r2){var r3;if(r2>>>0<3){r3=HEAP8[r2+(r1+4)|0]}else{r3=0}return r3}function _e8259_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164;r4=0;L1:do{if((r2|0)==0){r5=r3&255;r6=r5&16;r7=(r6|0)==0;if(!r7){r8=r1|0;HEAP8[r8]=r3;r9=r1+1|0;r10=r1+12|0;HEAP32[r10>>2]=0;r11=r1+16|0;HEAP8[r9]=0;HEAP8[r9+1|0]=0;HEAP8[r9+2|0]=0;HEAP8[r9+3|0]=0;HEAP8[r9+4|0]=0;HEAP8[r9+5|0]=0;HEAP32[r11>>2]=1;r12=r1+20|0;HEAP32[r12>>2]=1;r13=r1+24|0;HEAP32[r13>>2]=0;r14=r1+28|0;HEAP32[r14>>2]=0;r15=r1+8|0;HEAP8[r15]=0;r16=r1+9|0;HEAP8[r16]=0;break}r17=r5&24;r18=(r17|0)==0;if(!r18){r19=r5&152;r20=(r19|0)==8;if(!r20){break}r21=r1+6|0;HEAP8[r21]=r3;r22=r5&2;r23=(r22|0)==0;do{if(!r23){r24=r5&1;r25=(r24|0)==0;r26=r1+20|0;if(r25){HEAP32[r26>>2]=1;break}else{HEAP32[r26>>2]=0;break}}}while(0);r27=r5&4;r28=(r27|0)==0;if(!r28){r29=HEAP32[_stderr>>2];r30=_fwrite(20368,20,1,r29)}r31=r5&96;r32=(r31|0)==96;if(!r32){break}r33=HEAP32[_stderr>>2];r34=_fwrite(17776,33,1,r33);break}r35=r1+5|0;HEAP8[r35]=r3;r36=r1+9|0;r37=HEAP8[r36];r38=r37<<24>>24==0;if(r38){r39=255}else{r40=r37&255;r41=r40<<8;r42=r41|r40;r43=r1+24|0;r44=HEAP32[r43>>2];r45=r44&7;r46=r42>>>(r45>>>0);r47=r46&1;r48=(r47|0)==0;if(r48){r49=r44;r50=r46;while(1){r51=r50>>>1;r52=r49+1|0;r53=r51&1;r54=(r53|0)==0;if(r54){r49=r52;r50=r51}else{r55=r52;break}}}else{r55=r44}r56=r55&7;r39=r56}r57=r39&7;r58=1<<r57;r59=r5>>>5;switch(r59|0){case 1:{r60=r39>>>0<16;if(!r60){break L1}r61=r58^255;r62=r37&255;r63=r61&r62;r64=r63&255;HEAP8[r36]=r64;break L1;break};case 5:{r65=r39>>>0<16;if(!r65){break L1}r66=r58^255;r67=r37&255;r68=r66&r67;r69=r68&255;HEAP8[r36]=r69;r70=r39+1|0;r71=r70&7;r72=r1+24|0;HEAP32[r72>>2]=r71;break L1;break};case 6:{r73=r5+1|0;r74=r73&7;r75=r1+24|0;HEAP32[r75>>2]=r74;break L1;break};case 7:{r76=r5&7;r77=1<<r76;r78=r77^255;r79=r37&255;r80=r79&r78;r81=r80&255;HEAP8[r36]=r81;r82=r5+1|0;r83=r82&7;r84=r1+24|0;HEAP32[r84>>2]=r83;break L1;break};case 0:{r85=r1+28|0;HEAP32[r85>>2]=0;break L1;break};case 4:{r86=r1+28|0;HEAP32[r86>>2]=1;break L1;break};case 3:{r87=r5&7;r88=1<<r87;r89=r88^255;r90=r37&255;r91=r90&r89;r92=r91&255;HEAP8[r36]=r92;break L1;break};default:{break L1}}}else if((r2|0)==1){r93=r1+16|0;r94=HEAP32[r93>>2];if((r94|0)==2){r95=r1+2|0;HEAP8[r95]=r3;r96=r1|0;r97=HEAP8[r96];r98=r97&1;r99=r98<<24>>24==0;if(r99){HEAP32[r93>>2]=0;break}else{HEAP32[r93>>2]=3;break}}else if((r94|0)==3){r100=r1+3|0;HEAP8[r100]=r3;HEAP32[r93>>2]=0;break}else if((r94|0)==0){r101=r1+4|0;HEAP8[r101]=r3;r102=r1+8|0;HEAP8[r102]=r3;break}else if((r94|0)==1){r103=r1+1|0;HEAP8[r103]=r3;r104=r3&255;r105=r104&248;r106=r1+12|0;HEAP32[r106>>2]=r105;r107=r1|0;r108=HEAP8[r107];r109=r108&255;r110=r109&2;r111=(r110|0)==0;if(r111){HEAP32[r93>>2]=2;break}r112=r109&1;r113=(r112|0)==0;if(r113){HEAP32[r93>>2]=0;break}else{HEAP32[r93>>2]=3;break}}else{break}}}while(0);r114=r1+7|0;r115=HEAP8[r114];r116=r115&255;r117=r1+8|0;r118=HEAP8[r117];r119=r118&255;r120=~r119;r121=r116&r120;r122=(r121|0)==0;if(r122){r123=r1+72|0;r124=HEAP8[r123];r125=r124<<24>>24==0;if(r125){return}HEAP8[r123]=0;r126=r1+68|0;r127=HEAP32[r126>>2];r128=(r127|0)==0;if(r128){return}r129=r1+64|0;r130=HEAP32[r129>>2];FUNCTION_TABLE[r127](r130,0);return}r131=r1+9|0;r132=HEAP8[r131];r133=r132&255;r134=r133&r120;r135=r1+24|0;r136=HEAP32[r135>>2];r137=1<<r136;r138=r134&r137;r139=(r138|0)==0;L63:do{if(r139){r140=r137;while(1){r141=r140&r121;r142=(r141|0)==0;if(!r142){break}r143=r140<<1;r144=r140>>>7;r145=r143|r144;r146=r145&255;r147=r145&r134;r148=(r147|0)==0;if(r148){r140=r146}else{break L63}}r149=r1+72|0;r150=HEAP8[r149];r151=r150<<24>>24==1;if(r151){return}HEAP8[r149]=1;r152=r1+68|0;r153=HEAP32[r152>>2];r154=(r153|0)==0;if(r154){return}r155=r1+64|0;r156=HEAP32[r155>>2];FUNCTION_TABLE[r153](r156,1);return}}while(0);r157=r1+72|0;r158=HEAP8[r157];r159=r158<<24>>24==0;if(r159){return}HEAP8[r157]=0;r160=r1+68|0;r161=HEAP32[r160>>2];r162=(r161|0)==0;if(r162){return}r163=r1+64|0;r164=HEAP32[r163>>2];FUNCTION_TABLE[r161](r164,0);return}function _e8259_get_uint8(r1,r2){var r3;if((r2|0)==0){r3=HEAP8[(HEAP32[r1+20>>2]|0)==0?r1+9|0:r1+7|0];return r3}else if((r2|0)==1){r3=HEAP8[r1+8|0];return r3}else{r3=-1;return r3}}function _e8259_reset(r1){var r2;r2=r1|0;HEAP8[r2]=0;HEAP8[r2+1|0]=0;HEAP8[r2+2|0]=0;HEAP8[r2+3|0]=0;HEAP8[r2+4|0]=0;HEAP8[r2+5|0]=0;HEAP8[r2+6|0]=0;HEAP32[r1+12>>2]=8;HEAP32[r1+16>>2]=0;HEAP32[r1+20>>2]=1;HEAP8[r1+7|0]=0;HEAP8[r1+8|0]=-1;HEAP8[r1+9|0]=0;HEAP32[r1+24>>2]=0;HEAP32[r1+28>>2]=0;r2=r1+72|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+68>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+64>>2],0);return}function _wd179x_init(r1){var r2,r3;r2=r1+72|0;HEAP8[r2|0]=1;HEAP8[r1+73|0]=0;HEAP8[r1+96|0]=0;HEAP32[r1+100>>2]=0;HEAP32[r1+104>>2]=0;r3=r1+76|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP8[r1+32876|0]=1;HEAP8[r1+32877|0]=0;HEAP32[r1+32880>>2]=1;HEAP32[r1+32884>>2]=0;HEAP32[r1+32888>>2]=0;HEAP32[r1+32892>>2]=0;HEAP8[r1+32900|0]=0;HEAP32[r1+32904>>2]=0;HEAP32[r1+32908>>2]=0;HEAP8[r1|0]=0;HEAP8[r1+1|0]=0;HEAP32[r1+60>>2]=1e6;HEAP32[r1+64>>2]=1e6;HEAP32[r1+65680>>2]=r2;HEAP32[r1+65720>>2]=0;HEAP32[r1+65724>>2]=0;HEAP8[r1+65728|0]=0;HEAP32[r1+65732>>2]=0;HEAP32[r1+65736>>2]=0;r2=r1+65688|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r2+24>>2]=0;HEAP8[r2+28|0]=0;return}function _wd179x_set_irq_fct(r1,r2,r3){HEAP32[r1+65720>>2]=r2;HEAP32[r1+65724>>2]=r3;return}function _wd179x_set_drq_fct(r1,r2,r3){HEAP32[r1+65732>>2]=r2;HEAP32[r1+65736>>2]=r3;return}function _wd179x_set_read_track_fct(r1,r2,r3){HEAP32[r1+65700>>2]=r2;HEAP32[r1+65704>>2]=r3;return}function _wd179x_set_write_track_fct(r1,r2,r3){HEAP32[r1+65708>>2]=r2;HEAP32[r1+65712>>2]=r3;return}function _wd179x_set_input_clock(r1,r2){HEAP32[r1+60>>2]=r2;return}function _wd179x_set_bit_clock(r1,r2){HEAP32[r1+64>>2]=r2;return}function _wd179x_reset(r1){var r2;HEAP8[r1+2|0]=0;HEAP8[r1+3|0]=0;HEAP8[r1+4|0]=0;HEAP8[r1+5|0]=1;HEAP8[r1+7|0]=1;r2=r1+8|0;tempBigInt=0;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP16[r1+32>>1]=0;r2=r1+16|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP16[r2+8>>1]=0;HEAP8[r2+10|0]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+36>>2]=0;HEAP16[r1+40>>1]=0;HEAP16[r1+42>>1]=1;HEAP32[r1+88>>2]=0;HEAP32[r1+92>>2]=0;HEAP32[r1+32892>>2]=0;HEAP32[r1+32896>>2]=0;HEAP32[r1+65684>>2]=0;HEAP32[r1+65692>>2]=0;HEAP32[r1+65696>>2]=0;r2=r1+44|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP16[r2+12>>1]=0;return}function _wd179x_set_ready(r1,r2,r3){HEAP8[r1+72+((r2&1)*32804&-1)|0]=(r3|0)!=0|0;HEAP8[r1|0]=1;return}function _wd179x_set_motor(r1,r2,r3){var r4;if(r2>>>0>1){return}r4=(r3|0)!=0;r3=r1+72+(r2*32804&-1)+2|0;if((HEAPU8[r3]|0)==(r4&1|0)){return}HEAP8[r3]=r4&1;if(!r4){HEAP32[r1+72+(r2*32804&-1)+16>>2]=0}HEAP8[r1|0]=1;return}function _wd179x_get_status(r1){var r2,r3,r4,r5;r2=r1+65716|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r2=HEAP32[r1+65724>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+65720>>2],0)}}if((HEAP8[r1+1|0]|0)==0){r2=r1+3|0;r3=HEAP8[r2];if((HEAP8[HEAP32[r1+65680>>2]|0]|0)==0){r4=r3|-128;HEAP8[r2]=r4;r5=r4;return r5}else{r4=r3&127;HEAP8[r2]=r4;r5=r4;return r5}}if((HEAP8[r1+74|0]|0)==0?(HEAP8[r1+32878|0]|0)==0:0){r4=r1+3|0;r2=HEAP8[r4]&127;HEAP8[r4]=r2;r5=r2;return r5}r2=r1+3|0;r1=HEAP8[r2]|-128;HEAP8[r2]=r1;r5=r1;return r5}function _wd179x_get_track(r1){return HEAP8[r1+4|0]}function _wd179x_set_track(r1,r2){HEAP8[r1+4|0]=r2;return}function _wd179x_get_sector(r1){return HEAP8[r1+5|0]}function _wd179x_set_sector(r1,r2){HEAP8[r1+5|0]=r2;return}function _wd179x_get_data(r1){var r2;r2=r1+3|0;HEAP8[r2]=HEAP8[r2]&-3;r2=r1+65728|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r2=HEAP32[r1+65736>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+65732>>2],0)}}return HEAP8[r1+6|0]}function _wd179x_set_data(r1,r2){var r3;r3=r1+3|0;HEAP8[r3]=HEAP8[r3]&-3;r3=r1+65728|0;if((HEAP8[r3]|0)!=0){HEAP8[r3]=0;r3=HEAP32[r1+65736>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+65732>>2],0)}}HEAP8[r1+6|0]=r2;return}function _wd179x_select_drive(r1,r2){var r3;r3=r2&1;HEAP32[r1+68>>2]=r3;HEAP32[r1+65680>>2]=r1+72+(r3*32804&-1);return}function _wd179x_set_cmd(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r3=0;r4=0;r5=STACKTOP;r6=r1|0;HEAP8[r6]=1;r7=r2&255;r8=r7&240;if((r8|0)==208){r9=r1+12|0;if((HEAP8[r9]|0)==0){HEAP8[r1+13|0]=r2;STACKTOP=r5;return}r10=r1+2|0;HEAP8[r10]=r2;r11=r1+3|0;r12=HEAP8[r11];r13=r1+65716|0;if((HEAP8[r13]|0)!=0){HEAP8[r13]=0;r14=HEAP32[r1+65724>>2];if((r14|0)!=0){FUNCTION_TABLE[r14](HEAP32[r1+65720>>2],0)}}HEAP8[r11]=1;if((r12&1)==0){HEAP8[r11]=1;r12=HEAP32[r1+65680>>2];r14=(HEAP32[r12+8>>2]|0)==0;r15=r14?5:1;HEAP8[r11]=r15;if((HEAP8[r12+1|0]|0)==0){r16=r15}else{r15=r14?69:65;HEAP8[r11]=r15;r16=r15}}else{r16=1}r15=HEAP8[r10];r10=r1+65692|0;HEAP32[r10>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r10>>2]=1084}HEAP8[r9]=1;HEAP8[r1+13|0]=0;HEAP8[r11]=r16&68;if((r15&8)!=0?(HEAP8[r13]|0)!=1:0){HEAP8[r13]=1;r13=HEAP32[r1+65724>>2];if((r13|0)!=0){FUNCTION_TABLE[r13](HEAP32[r1+65720>>2],1)}}r13=HEAP32[r1+65680>>2];r15=r13+24|0;if((HEAP8[r15]|0)==0){STACKTOP=r5;return}r16=HEAP32[r1+65712>>2];if((r16|0)==0){STACKTOP=r5;return}if((FUNCTION_TABLE[r16](HEAP32[r1+65708>>2],r13)|0)==0){HEAP8[r15]=0;STACKTOP=r5;return}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);STACKTOP=r5;return}}r15=r1+65696|0;HEAP32[r15>>2]=0;r13=r1+65692|0;HEAP32[r13>>2]=0;r16=r1+3|0;r11=HEAPU8[r16];if((r11&1|0)!=0){r9=HEAPU8[r1+2|0];_fprintf(HEAP32[_stderr>>2],11168,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r7,HEAP32[r4+8>>2]=r9,HEAP32[r4+16>>2]=r11,r4));STACKTOP=r4;STACKTOP=r5;return}r11=r1+2|0;HEAP8[r11]=r2;r2=r1+65716|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r9=HEAP32[r1+65724>>2];if((r9|0)!=0){FUNCTION_TABLE[r9](HEAP32[r1+65720>>2],0)}}r9=r1+12|0;HEAP8[r9]=1;r10=r1+13|0;HEAP8[r10]=0;if((r8|0)==16){HEAP8[r16]=1;if((HEAP8[r1+1|0]|0)!=0){r14=HEAP32[r1+68>>2];if(r14>>>0<=1){r12=r1+72+(r14*32804&-1)+2|0;if((HEAP8[r12]|0)!=1){HEAP8[r12]=1;HEAP8[r6]=1}}}HEAP32[r1+65688>>2]=1e3;HEAP32[r13>>2]=1048;STACKTOP=r5;return}else if((r8|0)!=0){r8=r7&224;if((r8|0)==64){HEAP8[r1+7|0]=1;HEAP8[r16]=1;if((HEAP8[r1+1|0]|0)!=0){r12=HEAP32[r1+68>>2];if(r12>>>0<=1){r14=r1+72+(r12*32804&-1)+2|0;if((HEAP8[r14]|0)!=1){HEAP8[r14]=1;HEAP8[r6]=1}}}HEAP32[r1+65688>>2]=1e3;HEAP32[r13>>2]=470;STACKTOP=r5;return}if((r7&225|0)==128){r14=HEAP32[r1+65684>>2];if((r14&128|0)==0){r17=HEAPU8[r11]>>>1&1}else{r17=r14&127}HEAP8[r16]=1;if((HEAP8[r1+1|0]|0)!=0){r14=HEAP32[r1+68>>2];if(r14>>>0<=1){r12=r1+72+(r14*32804&-1)+2|0;if((HEAP8[r12]|0)!=1){HEAP8[r12]=1;HEAP8[r6]=1}}}r12=r1+65680|0;r14=HEAP32[r12>>2];r18=r14+24|0;do{if((HEAP8[r18]|0)!=0){r19=HEAP32[r1+65712>>2];if((r19|0)!=0){if((FUNCTION_TABLE[r19](HEAP32[r1+65708>>2],r14)|0)==0){HEAP8[r18]=0;r3=56;break}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);break}}}else{r3=56}}while(0);do{if(r3==56){r19=r14+32|0;if((HEAP32[r19>>2]|0)!=0?(HEAP32[r14+12>>2]|0)==(r17|0):0){break}r20=HEAP32[r1+65704>>2];if((r20|0)!=0){r21=r14+12|0;HEAP32[r21>>2]=r17;if((FUNCTION_TABLE[r20](HEAP32[r1+65700>>2],r14)|0)!=0){r20=HEAP32[r14+8>>2];r22=HEAP32[r21>>2];_fprintf(HEAP32[_stderr>>2],14520,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r12>>2]+4>>2],HEAP32[r4+8>>2]=r20,HEAP32[r4+16>>2]=r22,r4));STACKTOP=r4;HEAP32[r14+28>>2]=0;HEAP32[r19>>2]=166666;_memset(r14+36|0,0,20834)|0;break}HEAP8[r18]=0;r22=r14+28|0;if(HEAP32[r22>>2]>>>0>=HEAP32[r19>>2]>>>0){HEAP32[r22>>2]=0}}}}while(0);HEAP32[r1+20>>2]=0;HEAP32[HEAP32[r12>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r15>>2]=530;HEAP32[r1+65688>>2]=0;HEAP32[r13>>2]=548;STACKTOP=r5;return}if((r8|0)==160){r12=HEAP32[r1+65684>>2];if((r12&128|0)==0){r23=HEAPU8[r11]>>>1&1}else{r23=r12&127}HEAP8[r16]=1;r12=r1+1|0;if((HEAP8[r12]|0)!=0){r14=HEAP32[r1+68>>2];if(r14>>>0<=1){r18=r1+72+(r14*32804&-1)+2|0;if((HEAP8[r18]|0)!=1){HEAP8[r18]=1;HEAP8[r6]=1}}}r18=r1+65680|0;r14=HEAP32[r18>>2];r17=r14+24|0;do{if((HEAP8[r17]|0)!=0){r22=HEAP32[r1+65712>>2];if((r22|0)!=0){if((FUNCTION_TABLE[r22](HEAP32[r1+65708>>2],r14)|0)==0){HEAP8[r17]=0;r3=77;break}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);break}}}else{r3=77}}while(0);do{if(r3==77){r22=r14+32|0;if(!((HEAP32[r22>>2]|0)!=0?(HEAP32[r14+12>>2]|0)==(r23|0):0)){r3=79}if(r3==79){r19=HEAP32[r1+65704>>2];if((r19|0)==0){break}r20=r14+12|0;HEAP32[r20>>2]=r23;if((FUNCTION_TABLE[r19](HEAP32[r1+65700>>2],r14)|0)!=0){r19=HEAP32[r14+8>>2];r21=HEAP32[r20>>2];_fprintf(HEAP32[_stderr>>2],14520,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r18>>2]+4>>2],HEAP32[r4+8>>2]=r19,HEAP32[r4+16>>2]=r21,r4));STACKTOP=r4;HEAP32[r14+28>>2]=0;HEAP32[r22>>2]=166666;_memset(r14+36|0,0,20834)|0;break}HEAP8[r17]=0;r21=r14+28|0;if(HEAP32[r21>>2]>>>0>=HEAP32[r22>>2]>>>0){HEAP32[r21>>2]=0}}HEAP32[HEAP32[r18>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r15>>2]=530;HEAP32[r1+65688>>2]=0;HEAP32[r13>>2]=440;STACKTOP=r5;return}}while(0);r14=HEAP8[r16]|16;HEAP8[r16]=r14;HEAP32[r13>>2]=0;HEAP32[r15>>2]=0;if((HEAP8[r12]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r13>>2]=1084}HEAP8[r9]=1;HEAP8[r10]=0;HEAP8[r16]=r14&-2;if((HEAP8[r2]|0)!=1){HEAP8[r2]=1;r2=HEAP32[r1+65724>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+65720>>2],1)}}r2=HEAP32[r18>>2];r18=r2+24|0;if((HEAP8[r18]|0)==0){STACKTOP=r5;return}r14=HEAP32[r1+65712>>2];if((r14|0)==0){STACKTOP=r5;return}if((FUNCTION_TABLE[r14](HEAP32[r1+65708>>2],r2)|0)==0){HEAP8[r18]=0;STACKTOP=r5;return}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);STACKTOP=r5;return}}else if((r8|0)==192){r8=HEAP32[r1+65684>>2];if((r8&128|0)==0){r24=HEAPU8[r11]>>>1&1}else{r24=r8&127}HEAP8[r16]=1;if((HEAP8[r1+1|0]|0)!=0){r8=HEAP32[r1+68>>2];if(r8>>>0<=1){r18=r1+72+(r8*32804&-1)+2|0;if((HEAP8[r18]|0)!=1){HEAP8[r18]=1;HEAP8[r6]=1}}}r18=r1+65680|0;r8=HEAP32[r18>>2];r2=r8+24|0;do{if((HEAP8[r2]|0)!=0){r14=HEAP32[r1+65712>>2];if((r14|0)!=0){if((FUNCTION_TABLE[r14](HEAP32[r1+65708>>2],r8)|0)==0){HEAP8[r2]=0;r3=107;break}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);break}}}else{r3=107}}while(0);do{if(r3==107){r14=r8+32|0;if((HEAP32[r14>>2]|0)!=0?(HEAP32[r8+12>>2]|0)==(r24|0):0){break}r10=HEAP32[r1+65704>>2];if((r10|0)!=0){r9=r8+12|0;HEAP32[r9>>2]=r24;if((FUNCTION_TABLE[r10](HEAP32[r1+65700>>2],r8)|0)!=0){r10=HEAP32[r8+8>>2];r12=HEAP32[r9>>2];_fprintf(HEAP32[_stderr>>2],14520,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r18>>2]+4>>2],HEAP32[r4+8>>2]=r10,HEAP32[r4+16>>2]=r12,r4));STACKTOP=r4;HEAP32[r8+28>>2]=0;HEAP32[r14>>2]=166666;_memset(r8+36|0,0,20834)|0;break}HEAP8[r2]=0;r12=r8+28|0;if(HEAP32[r12>>2]>>>0>=HEAP32[r14>>2]>>>0){HEAP32[r12>>2]=0}}}}while(0);HEAP32[r1+20>>2]=0;HEAP32[HEAP32[r18>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r15>>2]=530;HEAP32[r1+65688>>2]=0;HEAP32[r13>>2]=1058;STACKTOP=r5;return}else{if((r7&248|0)==224){r18=HEAP32[r1+65684>>2];if((r18&128|0)==0){r25=HEAPU8[r11]>>>1&1}else{r25=r18&127}HEAP8[r16]=1;if((HEAP8[r1+1|0]|0)!=0){r18=HEAP32[r1+68>>2];if(r18>>>0<=1){r8=r1+72+(r18*32804&-1)+2|0;if((HEAP8[r8]|0)!=1){HEAP8[r8]=1;HEAP8[r6]=1}}}r8=r1+65680|0;r18=HEAP32[r8>>2];r2=r18+24|0;do{if((HEAP8[r2]|0)!=0){r24=HEAP32[r1+65712>>2];if((r24|0)!=0){if((FUNCTION_TABLE[r24](HEAP32[r1+65708>>2],r18)|0)==0){HEAP8[r2]=0;r3=128;break}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);break}}}else{r3=128}}while(0);do{if(r3==128){r24=r18+32|0;if((HEAP32[r24>>2]|0)!=0?(HEAP32[r18+12>>2]|0)==(r25|0):0){break}r12=HEAP32[r1+65704>>2];if((r12|0)!=0){r14=r18+12|0;HEAP32[r14>>2]=r25;if((FUNCTION_TABLE[r12](HEAP32[r1+65700>>2],r18)|0)!=0){r12=HEAP32[r18+8>>2];r10=HEAP32[r14>>2];_fprintf(HEAP32[_stderr>>2],14520,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r8>>2]+4>>2],HEAP32[r4+8>>2]=r12,HEAP32[r4+16>>2]=r10,r4));STACKTOP=r4;HEAP32[r18+28>>2]=0;HEAP32[r24>>2]=166666;_memset(r18+36|0,0,20834)|0;break}HEAP8[r2]=0;r10=r18+28|0;if(HEAP32[r10>>2]>>>0>=HEAP32[r24>>2]>>>0){HEAP32[r10>>2]=0}}}}while(0);HEAP32[HEAP32[r8>>2]+20>>2]=2;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+58|0]=0;HEAP8[r1+59|0]=0;HEAP8[r1+8|0]=1;HEAP8[r1+9|0]=0;HEAP32[r15>>2]=854;STACKTOP=r5;return}if((r7&249|0)!=240){_fprintf(HEAP32[_stderr>>2],20296,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r7,r4));STACKTOP=r4;STACKTOP=r5;return}r7=HEAP32[r1+65684>>2];if((r7&128|0)==0){r26=HEAPU8[r11]>>>1&1}else{r26=r7&127}HEAP8[r16]=1;if((HEAP8[r1+1|0]|0)!=0){r7=HEAP32[r1+68>>2];if(r7>>>0<=1){r11=r1+72+(r7*32804&-1)+2|0;if((HEAP8[r11]|0)!=1){HEAP8[r11]=1;HEAP8[r6]=1}}}r11=r1+65680|0;r7=HEAP32[r11>>2];r8=r7+24|0;do{if((HEAP8[r8]|0)!=0){r18=HEAP32[r1+65712>>2];if((r18|0)!=0){if((FUNCTION_TABLE[r18](HEAP32[r1+65708>>2],r7)|0)==0){HEAP8[r8]=0;r3=149;break}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);break}}}else{r3=149}}while(0);do{if(r3==149){r18=r7+32|0;if((HEAP32[r18>>2]|0)!=0?(HEAP32[r7+12>>2]|0)==(r26|0):0){break}r2=HEAP32[r1+65704>>2];if((r2|0)!=0){r25=r7+12|0;HEAP32[r25>>2]=r26;if((FUNCTION_TABLE[r2](HEAP32[r1+65700>>2],r7)|0)!=0){r2=HEAP32[r7+8>>2];r10=HEAP32[r25>>2];_fprintf(HEAP32[_stderr>>2],14520,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r11>>2]+4>>2],HEAP32[r4+8>>2]=r2,HEAP32[r4+16>>2]=r10,r4));STACKTOP=r4;HEAP32[r7+28>>2]=0;HEAP32[r18>>2]=166666;_memset(r7+36|0,0,20834)|0;break}HEAP8[r8]=0;r10=r7+28|0;if(HEAP32[r10>>2]>>>0>=HEAP32[r18>>2]>>>0){HEAP32[r10>>2]=0}}}}while(0);HEAP32[HEAP32[r11>>2]+20>>2]=2;HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=0;HEAP16[r1+52>>1]=0;HEAP32[r15>>2]=1076;HEAP32[r1+65688>>2]=0;HEAP32[r13>>2]=0;HEAP8[r16]=HEAP8[r16]|2;r15=r1+65728|0;if((HEAP8[r15]|0)!=1){HEAP8[r15]=1;r15=HEAP32[r1+65736>>2];if((r15|0)!=0){FUNCTION_TABLE[r15](HEAP32[r1+65732>>2],1)}}_cmd_write_track_clock(r1);STACKTOP=r5;return}}else{HEAP8[r16]=1;if((HEAP8[r1+1|0]|0)!=0){r16=HEAP32[r1+68>>2];if(r16>>>0<=1){r15=r1+72+(r16*32804&-1)+2|0;if((HEAP8[r15]|0)!=1){HEAP8[r15]=1;HEAP8[r6]=1}}}HEAP32[r1+65688>>2]=1e3;HEAP32[r13>>2]=304;STACKTOP=r5;return}}function _wd179x_clock2(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=r1|0;HEAP8[r3]=0;r4=r1+74|0;if((HEAP8[r4]|0)!=0){r5=Math_imul(HEAP32[r1+64>>2]>>>1,r2)|0;r6=r1+88|0;HEAP32[r6>>2]=r5+HEAP32[r6>>2];HEAP8[r3]=1}r6=r1+32878|0;if((HEAP8[r6]|0)!=0){r5=Math_imul(HEAP32[r1+64>>2]>>>1,r2)|0;r7=r1+32892|0;HEAP32[r7>>2]=r5+HEAP32[r7>>2];HEAP8[r3]=1}r7=HEAP32[r1+65696>>2];if((r7|0)==0){r5=HEAP32[r1+65692>>2];if((r5|0)!=0){r8=r1+65688|0;r9=HEAP32[r8>>2];if(r9>>>0>r2>>>0){HEAP32[r8>>2]=r9-r2}else{HEAP32[r8>>2]=0;FUNCTION_TABLE[r5](r1)}HEAP8[r3]=1}}else{FUNCTION_TABLE[r7](r1);HEAP8[r3]=1}r3=r1+88|0;r7=HEAP32[r3>>2];r5=r1+60|0;r8=HEAP32[r5>>2];if(r7>>>0<r8>>>0){r10=r8}else{r2=HEAP32[_stderr>>2];r9=r1+100|0;r11=r1+104|0;r12=r1+92|0;r13=r7;r7=r8;while(1){r8=r13-r7|0;HEAP32[r3>>2]=r8;if((HEAP8[r4]|0)!=0){r14=HEAP32[r9>>2]+1|0;HEAP32[r9>>2]=r14;if(r14>>>0<HEAP32[r11>>2]>>>0){r15=r8;r16=r7}else{r14=HEAP32[r12>>2];if((r14|0)!=0){HEAP32[r12>>2]=r14-1}HEAP32[r9>>2]=0;r15=r8;r16=r7}}else{_fwrite(17712,22,1,r2);r15=HEAP32[r3>>2];r16=HEAP32[r5>>2]}if(r15>>>0<r16>>>0){r10=r16;break}else{r13=r15;r7=r16}}}r16=r1+32892|0;r7=HEAP32[r16>>2];if(r7>>>0<r10>>>0){return}r15=HEAP32[_stderr>>2];r13=r1+32904|0;r3=r1+32908|0;r2=r1+32896|0;r1=r7;r7=r10;while(1){r10=r1-r7|0;HEAP32[r16>>2]=r10;if((HEAP8[r6]|0)!=0){r9=HEAP32[r13>>2]+1|0;HEAP32[r13>>2]=r9;if(r9>>>0<HEAP32[r3>>2]>>>0){r17=r10;r18=r7}else{r9=HEAP32[r2>>2];if((r9|0)!=0){HEAP32[r2>>2]=r9-1}HEAP32[r13>>2]=0;r17=r10;r18=r7}}else{_fwrite(17712,22,1,r15);r17=HEAP32[r16>>2];r18=HEAP32[r5>>2]}if(r17>>>0<r18>>>0){break}else{r1=r17;r7=r18}}return}function _cmd_write_track_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2];r5=r4+16|0;r6=HEAP32[r5>>2];r7=r1+60|0;r8=HEAP32[r7>>2];if(r6>>>0<r8>>>0){return}r9=HEAP32[_stderr>>2];r10=r1+44|0;r11=r1+3|0;r12=r1+48|0;r13=r1+6|0;r14=r1+54|0;r15=r1+55|0;r16=r1+10|0;r17=r1+56|0;r18=r1+65728|0;r19=r1+65736|0;r20=r1+65732|0;r21=r1+52|0;r22=r5;r5=r6;r6=r8;r8=r4;L4:while(1){HEAP32[r22>>2]=r5-r6;r4=r8+20|0;r23=HEAP32[r4>>2];do{if(r23>>>0>1){if((HEAP8[r8+2|0]|0)==0){_fwrite(17712,22,1,r9);break}r24=r8+28|0;r25=HEAP32[r24>>2]+1|0;HEAP32[r24>>2]=r25;if(r25>>>0>=HEAP32[r8+32>>2]>>>0){if((r23|0)!=0){HEAP32[r4>>2]=r23-1}HEAP32[r24>>2]=0}}else{if((r23|0)==0){break L4}L17:do{if((HEAP32[r10>>2]&15|0)==0){if((HEAP8[r11]&2)!=0){_fwrite(16088,25,1,r9);HEAP8[r13]=0}do{if((HEAP32[r12>>2]|0)==0){r24=HEAP8[r13];if(r24<<24>>24==-10){HEAP8[r14]=-62;HEAP8[r15]=-9;break}else if(r24<<24>>24==-11){HEAP8[r14]=-95;HEAP8[r15]=-5;HEAP16[r16>>1]=-26997;break}else if(r24<<24>>24==-9){r25=HEAP16[r16>>1];HEAP16[r17>>1]=r25;HEAP8[r14]=(r25&65535)>>>8;HEAP8[r15]=-1;HEAP32[r12>>2]=1;break L17}else{HEAP8[r14]=r24;HEAP8[r15]=-1;break}}else{HEAP8[r14]=HEAP16[r17>>1];HEAP8[r15]=-1;HEAP32[r12>>2]=0}}while(0);HEAP8[r11]=HEAP8[r11]|2;if((HEAP8[r18]|0)!=1){HEAP8[r18]=1;r24=HEAP32[r19>>2];if((r24|0)!=0){FUNCTION_TABLE[r24](HEAP32[r20>>2],1)}}}}while(0);r24=HEAP32[r10>>2];if((r24&1|0)==0){r25=HEAP8[r15];HEAP16[r21>>1]=HEAP16[r21>>1]<<1|(r25&255)>>>7&255;HEAP8[r15]=r25<<1;r26=r24}else{r24=HEAP16[r21>>1]<<1;r25=r24|HEAPU8[r14]>>>7&255;r27=(r25&5)==0;HEAP16[r21>>1]=r27?r25:r25&-3;r25=HEAP32[r3>>2];r28=r25+28|0;r29=HEAP32[r28>>2];r30=128>>>((r29&7)>>>0);if((r24&2)==0|r27^1){r27=(r29>>>3)+(r25+36)|0;HEAP8[r27]=HEAPU8[r27]&(r30^255)}else{r27=(r29>>>3)+(r25+36)|0;HEAP8[r27]=HEAPU8[r27]|r30}HEAP8[r25+24|0]=1;if((HEAP8[r25+2|0]|0)!=0){r30=HEAP32[r28>>2]+1|0;HEAP32[r28>>2]=r30;if(r30>>>0>=HEAP32[r25+32>>2]>>>0){r30=r25+20|0;r25=HEAP32[r30>>2];if((r25|0)!=0){HEAP32[r30>>2]=r25-1}HEAP32[r28>>2]=0}}else{_fwrite(17712,22,1,r9)}r28=HEAP32[r3>>2];r25=r28+28|0;r30=HEAP32[r25>>2];r27=128>>>((r30&7)>>>0);if((HEAP16[r21>>1]&1)==0){r29=(r30>>>3)+(r28+36)|0;HEAP8[r29]=HEAPU8[r29]&(r27^255);HEAP8[r28+24|0]=1;r31=HEAP16[r16>>1]}else{r29=(r30>>>3)+(r28+36)|0;HEAP8[r29]=HEAPU8[r29]|r27;HEAP8[r28+24|0]=1;r27=HEAP16[r16>>1]^-32768;HEAP16[r16>>1]=r27;r31=r27}r27=r31&65535;r29=r27<<1;HEAP16[r16>>1]=(r27&32768|0)==0?r29:r29^4129;if((HEAP8[r28+2|0]|0)!=0){r29=HEAP32[r25>>2]+1|0;HEAP32[r25>>2]=r29;if(r29>>>0>=HEAP32[r28+32>>2]>>>0){r29=r28+20|0;r28=HEAP32[r29>>2];if((r28|0)!=0){HEAP32[r29>>2]=r28-1}HEAP32[r25>>2]=0}}else{_fwrite(17712,22,1,r9)}HEAP8[r14]=HEAP8[r14]<<1;r26=HEAP32[r10>>2]}HEAP32[r10>>2]=r26+1}}while(0);r23=HEAP32[r3>>2];r4=r23+16|0;r25=HEAP32[r4>>2];r28=HEAP32[r7>>2];if(r25>>>0<r28>>>0){r2=60;break}else{r22=r4;r5=r25;r6=r28;r8=r23}}if(r2==60){return}HEAP8[r11]=HEAP8[r11]&-3;if((HEAP8[r18]|0)!=0){HEAP8[r18]=0;r18=HEAP32[r19>>2];if((r18|0)!=0){FUNCTION_TABLE[r18](HEAP32[r20>>2],0)}}r20=r1+65692|0;HEAP32[r20>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r7>>2]<<1;HEAP32[r20>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r11]=HEAP8[r11]&-2;r11=r1+65716|0;if((HEAP8[r11]|0)!=1){HEAP8[r11]=1;r11=HEAP32[r1+65724>>2];if((r11|0)!=0){FUNCTION_TABLE[r11](HEAP32[r1+65720>>2],1)}}r11=HEAP32[r3>>2];r3=r11+24|0;if((HEAP8[r3]|0)==0){return}r20=HEAP32[r1+65712>>2];if((r20|0)==0){return}if((FUNCTION_TABLE[r20](HEAP32[r1+65708>>2],r11)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25664,26,1,r9);return}}function _cmd_auto_motor_off(r1){var r2;r2=r1+74|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;HEAP32[r1+88>>2]=0;HEAP8[r1|0]=1}r2=r1+32878|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;HEAP32[r1+32892>>2]=0;HEAP8[r1|0]=1;return}function _wd179x_read_track_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2];r5=r4+16|0;r6=HEAP32[r5>>2];r7=r1+60|0;r8=HEAP32[r7>>2];if(r6>>>0<r8>>>0){return}r9=HEAP32[_stderr>>2];r10=r1+24|0;r11=r1+8|0;r12=r1+9|0;r13=r1+10|0;r14=r1+16|0;r15=r1+58|0;r16=r1+59|0;r17=r1+3|0;r18=r1+6|0;r19=r1+65728|0;r20=r1+65736|0;r21=r1+65732|0;r22=r5;r5=r6;r6=r8;r8=r4;L4:while(1){HEAP32[r22>>2]=r5-r6;r4=r8+20|0;r23=HEAP32[r4>>2];L6:do{if(r23>>>0>1){if((HEAP8[r8+2|0]|0)==0){_fwrite(17712,22,1,r9);break}r24=r8+28|0;r25=HEAP32[r24>>2]+1|0;HEAP32[r24>>2]=r25;if(r25>>>0>=HEAP32[r8+32>>2]>>>0){if((r23|0)!=0){HEAP32[r4>>2]=r23-1}HEAP32[r24>>2]=0}}else{if((r23|0)==0){break L4}r24=HEAPU16[r10>>1]<<1;r25=(HEAP8[r11]|0)==0;HEAP8[r11]=r25&1;r26=r8+28|0;r27=HEAP32[r26>>2];r28=(HEAPU8[(r27>>>3)+(r8+36)|0]&128>>>((r27&7)>>>0)|0)!=0;r27=r28&1;if(r25){HEAP8[r12]=HEAPU8[r12]<<1|r27;r25=HEAP16[r13>>1];if(r28){r28=r25^-32768;HEAP16[r13>>1]=r28;r29=r28}else{r29=r25}r25=r29&65535;r28=r25<<1;HEAP16[r13>>1]=(r25&32768|0)==0?r28:r28^4129}if((HEAP8[r8+2|0]|0)!=0){r28=HEAP32[r26>>2]+1|0;HEAP32[r26>>2]=r28;if(r28>>>0>=HEAP32[r8+32>>2]>>>0){r28=HEAP32[r4>>2];if((r28|0)!=0){HEAP32[r4>>2]=r28-1}HEAP32[r26>>2]=0}}else{_fwrite(17712,22,1,r9)}r26=(r27|r24)&65535;HEAP16[r10>>1]=r26;r24=HEAP32[r14>>2]+1|0;HEAP32[r14>>2]=r24;r27=HEAP8[r15];if(r27<<24>>24==0){r30=0}else{r28=r27-1&255;HEAP8[r15]=r28;r30=r28}r28=HEAP8[r16];if(r28<<24>>24==0){r31=0}else{r27=r28-1&255;HEAP8[r16]=r27;r31=r27}do{if(r26<<16>>16==17545){if(r30<<24>>24==0){HEAP8[r11]=1;HEAP8[r15]=16;if(r31<<24>>24==0){HEAP32[r14>>2]=16;break}else{HEAP32[r14>>2]=0;break L6}}else{r2=41}}else if(r26<<16>>16==21028){HEAP8[r11]=1;HEAP8[r16]=16;HEAP32[r14>>2]=16}else{r2=41}}while(0);if(r2==41?(r2=0,r24>>>0<16):0){break}HEAP32[r14>>2]=0;r26=HEAP8[r17];if((r26&2)==0){r32=r26}else{_fwrite(13280,29,1,r9);r26=HEAP8[r17]|4;HEAP8[r17]=r26;r32=r26}HEAP8[r18]=HEAP8[r12];HEAP8[r17]=r32|2;if((HEAP8[r19]|0)!=1){HEAP8[r19]=1;r26=HEAP32[r20>>2];if((r26|0)!=0){FUNCTION_TABLE[r26](HEAP32[r21>>2],1)}}}}while(0);r4=HEAP32[r3>>2];r23=r4+16|0;r26=HEAP32[r23>>2];r27=HEAP32[r7>>2];if(r26>>>0<r27>>>0){r2=48;break}else{r22=r23;r5=r26;r6=r27;r8=r4}}if(r2==48){return}r2=r1+65692|0;HEAP32[r2>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r7>>2]<<1;HEAP32[r2>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r17]=HEAP8[r17]&-2;r17=r1+65716|0;if((HEAP8[r17]|0)!=1){HEAP8[r17]=1;r17=HEAP32[r1+65724>>2];if((r17|0)!=0){FUNCTION_TABLE[r17](HEAP32[r1+65720>>2],1);r33=HEAP32[r3>>2]}else{r33=r8}}else{r33=r8}r8=r33+24|0;if((HEAP8[r8]|0)==0){return}r3=HEAP32[r1+65712>>2];if((r3|0)==0){return}if((FUNCTION_TABLE[r3](HEAP32[r1+65708>>2],r33)|0)==0){HEAP8[r8]=0;return}else{_fwrite(25664,26,1,r9);return}}function _cmd_read_address_idam(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+65680|0;r3=HEAP32[r2>>2];if((HEAP32[r3+20>>2]|0)!=0){r4=r1+26|0;if((HEAP8[r4]|0)!=-2){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r4]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=530;return}r4=r1+3|0;r5=HEAP8[r4];if((HEAP16[r1+32>>1]|0)==(HEAP16[r1+34>>1]|0)){r6=r5}else{r7=r5|8;HEAP8[r4]=r7;r6=r7}r7=HEAP8[r1+27|0];HEAP8[r1+5|0]=r7;HEAP32[r1+36>>2]=48;HEAP32[r1+65696>>2]=380;HEAP32[r1+65692>>2]=0;HEAP8[r1+6|0]=r7;HEAP8[r1+3|0]=r6|2;r6=r1+65728|0;if((HEAP8[r6]|0)==1){return}HEAP8[r6]=1;r6=HEAP32[r1+65736>>2];if((r6|0)==0){return}FUNCTION_TABLE[r6](HEAP32[r1+65732>>2],1);return}r6=r1+3|0;r7=HEAP8[r6]|16;HEAP8[r6]=r7;r4=r1+65692|0;HEAP32[r4>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r4>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r6]=r7&-2;r7=r1+65716|0;if((HEAP8[r7]|0)!=1){HEAP8[r7]=1;r7=HEAP32[r1+65724>>2];if((r7|0)!=0){FUNCTION_TABLE[r7](HEAP32[r1+65720>>2],1);r8=HEAP32[r2>>2]}else{r8=r3}}else{r8=r3}r3=r8+24|0;if((HEAP8[r3]|0)==0){return}r2=HEAP32[r1+65712>>2];if((r2|0)==0){return}if((FUNCTION_TABLE[r2](HEAP32[r1+65708>>2],r8)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);return}}function _cmd_read_address_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2];r5=r4+16|0;r6=HEAP32[r5>>2];r7=r1+60|0;r8=HEAP32[r7>>2];if(r6>>>0<r8>>>0){return}r9=HEAP32[_stderr>>2];r10=r1+8|0;r11=r1+36|0;r12=r1+3|0;r13=r1+28|0;r14=r1+6|0;r15=r1+65728|0;r16=r1+65736|0;r17=r1+65732|0;r18=r1+29|0;r19=r1+30|0;r20=r1+34|0;r21=r5;r5=r6;r6=r8;r8=r4;L4:while(1){HEAP32[r21>>2]=r5-r6;if((HEAP8[r8+2|0]|0)!=0){r4=r8+28|0;r22=HEAP32[r4>>2]+1|0;HEAP32[r4>>2]=r22;if(r22>>>0>=HEAP32[r8+32>>2]>>>0){r22=r8+20|0;r23=HEAP32[r22>>2];if((r23|0)!=0){HEAP32[r22>>2]=r23-1}HEAP32[r4>>2]=0}}else{_fwrite(17712,22,1,r9)}if((HEAP8[r10]|0)!=0){r4=HEAP32[r11>>2]-1|0;HEAP32[r11>>2]=r4;if((r4&7|0)==0){r23=HEAP8[r12];if((r23&2)==0){r24=r4;r25=r23}else{_fwrite(12408,31,1,r9);r23=HEAP8[r12]|4;HEAP8[r12]=r23;r24=HEAP32[r11>>2];r25=r23}do{if(r24>>>0>39){HEAP8[r14]=HEAP8[r13]}else{if(r24>>>0>31){HEAP8[r14]=HEAP8[r18];break}if(r24>>>0>23){HEAP8[r14]=HEAP8[r19];break}if(r24>>>0>15){HEAP8[r14]=HEAPU16[r20>>1]>>>8;break}if(r24>>>0<=7){break L4}HEAP8[r14]=HEAP16[r20>>1]}}while(0);HEAP8[r12]=r25|2;if((HEAP8[r15]|0)!=1){HEAP8[r15]=1;r23=HEAP32[r16>>2];if((r23|0)!=0){FUNCTION_TABLE[r23](HEAP32[r17>>2],1)}}}}r23=HEAP32[r3>>2];r4=r23+16|0;r22=HEAP32[r4>>2];r26=HEAP32[r7>>2];if(r22>>>0<r26>>>0){r2=37;break}else{r21=r4;r5=r22;r6=r26;r8=r23}}if(r2==37){return}r2=r1+65692|0;HEAP32[r2>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r7>>2]<<1;HEAP32[r2>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r12]=r25&-2;r25=r1+65716|0;if((HEAP8[r25]|0)!=1){HEAP8[r25]=1;r25=HEAP32[r1+65724>>2];if((r25|0)!=0){FUNCTION_TABLE[r25](HEAP32[r1+65720>>2],1)}}r25=HEAP32[r3>>2];r3=r25+24|0;if((HEAP8[r3]|0)==0){return}r12=HEAP32[r1+65712>>2];if((r12|0)==0){return}if((FUNCTION_TABLE[r12](HEAP32[r1+65708>>2],r25)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25664,26,1,r9);return}}function _wd179x_scan_mark(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2];r5=r4+16|0;r6=HEAP32[r5>>2];r7=r1+60|0;r8=HEAP32[r7>>2];r9=r6>>>0<r8>>>0;if(r9){return}r10=r1+24|0;r11=r1+8|0;r12=r1+9|0;r13=r1+10|0;r14=HEAP32[_stderr>>2];r15=r1+20|0;r16=r1+16|0;r17=r1+26|0;r18=r1+27|0;r19=r1+28|0;r20=r1+29|0;r21=r1+30|0;r22=r1+32|0;r23=r1+34|0;r24=HEAP16[r10>>1];r25=r5;r26=r6;r27=r8;r28=r24;r29=r4;L4:while(1){r30=r26-r27|0;HEAP32[r25>>2]=r30;r31=r28&65535;r32=r31<<1;r33=HEAP8[r11];r34=r33<<24>>24==0;r35=r34&1;HEAP8[r11]=r35;r36=r29+28|0;r37=HEAP32[r36>>2];r38=r37>>>3;r39=r38+(r29+36)|0;r40=HEAP8[r39];r41=r40&255;r42=r37&7;r43=128>>>(r42>>>0);r44=r41&r43;r45=(r44|0)!=0;r46=r45&1;if(r34){r47=HEAP8[r12];r48=r47&255;r49=r48<<1;r50=r49|r46;r51=r50&255;HEAP8[r12]=r51;r52=HEAP16[r13>>1];if(r45){r53=r52^-32768;HEAP16[r13>>1]=r53;r54=r53}else{r54=r52}r55=r54&65535;r56=r55&32768;r57=(r56|0)==0;r58=r55<<1;r59=r58^4129;r60=r57?r58:r59;r61=r60&65535;HEAP16[r13>>1]=r61}r62=r29+2|0;r63=HEAP8[r62];r64=r63<<24>>24==0;if(!r64){r65=HEAP32[r36>>2];r66=r65+1|0;HEAP32[r36>>2]=r66;r67=r29+32|0;r68=HEAP32[r67>>2];r69=r66>>>0<r68>>>0;if(!r69){r70=r29+20|0;r71=HEAP32[r70>>2];r72=(r71|0)==0;if(!r72){r73=r71-1|0;HEAP32[r70>>2]=r73}HEAP32[r36>>2]=0}}else{r74=_fwrite(17712,22,1,r14)}r75=r46|r32;r76=r75&65535;HEAP16[r10>>1]=r76;r77=HEAP32[r15>>2];r78=(r77|0)==0;if(!r78){r79=r77-1|0;HEAP32[r15>>2]=r79;r80=(r79|0)==0;if(r80){r2=15;break}}r81=HEAP32[r3>>2];r82=r81+20|0;r83=HEAP32[r82>>2];r84=(r83|0)==0;if(r84){r2=17;break}r85=HEAP32[r16>>2];r86=(r85|0)==0;L24:do{if(r86){r87=r76<<16>>16==17545;if(r87){HEAP32[r16>>2]=16;HEAP16[r13>>1]=17467;HEAP8[r11]=1;r88=17545}else{r88=r76}}else{r89=r85+1|0;HEAP32[r16>>2]=r89;r90=r89&15;r91=(r90|0)==0;if(r91){switch(r85|0){case 143:{r92=HEAP8[r12];r93=r92&255;r94=r93<<8;HEAP16[r23>>1]=r94;r88=r76;break L24;break};case 159:{r95=HEAP8[r12];r96=r95&255;r97=HEAP16[r23>>1];r98=r97|r96;HEAP16[r23>>1]=r98;r99=HEAP16[r22>>1];r100=r99<<16>>16==r98<<16>>16;if(r100){r2=35;break L4}HEAP32[r16>>2]=0;r88=r76;break L24;break};case 127:{r101=HEAP8[r12];HEAP8[r21]=r101;r102=HEAP16[r13>>1];HEAP16[r22>>1]=r102;r88=r76;break L24;break};case 31:case 47:{r103=r76<<16>>16==17545;if(r103){r88=17545;break L24}HEAP32[r16>>2]=0;r88=r76;break L24;break};case 63:{r104=HEAP8[r12];HEAP8[r17]=r104;if(r76<<16>>16==21844){r88=21844;break L24}else if(r76<<16>>16==21829|r76<<16>>16==21834){r2=27;break L4}HEAP32[r16>>2]=0;r88=r76;break L24;break};case 79:{r105=HEAP8[r12];HEAP8[r18]=r105;r88=r76;break L24;break};case 95:{r106=HEAP8[r12];HEAP8[r19]=r106;r88=r76;break L24;break};case 111:{r107=HEAP8[r12];HEAP8[r20]=r107;r88=r76;break L24;break};default:{r88=r76;break L24}}}else{r88=r76}}}while(0);r108=r81+16|0;r109=HEAP32[r108>>2];r110=HEAP32[r7>>2];r111=r109>>>0<r110>>>0;if(r111){r2=37;break}else{r25=r108;r26=r109;r27=r110;r28=r88;r29=r81}}if(r2==15){r112=r1+65696|0;HEAP32[r112>>2]=0;return}else if(r2==17){r113=r1+65696|0;HEAP32[r113>>2]=0;return}else if(r2==27){r114=r1+65696|0;HEAP32[r114>>2]=0;r115=r81+16|0;HEAP32[r115>>2]=0;return}else if(r2==35){r116=r1+65696|0;HEAP32[r116>>2]=0;r117=r81+16|0;HEAP32[r117>>2]=0;return}else if(r2==37){return}}function _cmd_write_sector_idam(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+65680|0;r3=HEAP32[r2>>2];if((HEAP32[r3+20>>2]|0)==0){r4=r1+3|0;r5=HEAP8[r4]|16;HEAP8[r4]=r5;r6=r1+65692|0;HEAP32[r6>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r6>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r4]=r5&-2;r5=r1+65716|0;if((HEAP8[r5]|0)!=1){HEAP8[r5]=1;r5=HEAP32[r1+65724>>2];if((r5|0)!=0){FUNCTION_TABLE[r5](HEAP32[r1+65720>>2],1);r7=HEAP32[r2>>2]}else{r7=r3}}else{r7=r3}r2=r7+24|0;if((HEAP8[r2]|0)==0){return}r5=HEAP32[r1+65712>>2];if((r5|0)==0){return}if((FUNCTION_TABLE[r5](HEAP32[r1+65708>>2],r7)|0)==0){HEAP8[r2]=0;return}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);return}}r2=r1+26|0;if((HEAP8[r2]|0)!=-2){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=530;return}r7=r1+32|0;r5=r1+34|0;if((HEAP16[r7>>1]|0)!=(HEAP16[r5>>1]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}if((HEAP8[r1+4|0]|0)!=(HEAP8[r1+27|0]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}if((HEAP8[r1+2|0]&2)!=0?(HEAP32[r3+12>>2]|0)!=(HEAPU8[r1+28|0]|0):0){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}if((HEAP8[r1+5|0]|0)!=(HEAP8[r1+29|0]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}r3=r1+30|0;r4=HEAP8[r3];if((r4&255)>3){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}r5=r1+3|0;HEAP8[r5]=HEAP8[r5]|2;r5=r1+65728|0;if((HEAP8[r5]|0)!=1){HEAP8[r5]=1;r5=HEAP32[r1+65736>>2];if((r5|0)!=0){FUNCTION_TABLE[r5](HEAP32[r1+65732>>2],1);r8=HEAP8[r3]}else{r8=r4}}else{r8=r4}HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=(2048<<(r8&255))+640;HEAP32[r1+65696>>2]=1124;_cmd_write_sector_clock(r1);return}function _cmd_write_sector_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2];r5=r4+16|0;r6=HEAP32[r5>>2];r7=r1+60|0;r8=HEAP32[r7>>2];if(r6>>>0<r8>>>0){return}r9=r1+44|0;r10=r1+55|0;r11=r1+3|0;r12=r1+54|0;r13=HEAP32[_stderr>>2];r14=r1+10|0;r15=r1+2|0;r16=r1+48|0;r17=r1+12|0;r18=r1+6|0;r19=r1+65728|0;r20=r1+65736|0;r21=r1+65732|0;r22=r1+56|0;r23=r1+52|0;r24=r1+54|0;r25=r5;r5=r6;r6=r8;r8=HEAP32[r9>>2];r26=r4;L4:while(1){HEAP32[r25>>2]=r5-r6;L6:do{if((r8&15|0)==0){HEAP8[r10]=-1;if(r8>>>0<352){r27=r26;r2=81}else{do{if(r8>>>0>=544){if(r8>>>0<592){if((r8|0)==544){HEAP16[r14>>1]=-1}HEAP8[r12]=-95;HEAP8[r10]=-5;break}if(r8>>>0<608){HEAP8[r12]=(HEAP8[r15]&1)!=0?-8:-5;break}r4=HEAP32[r16>>2];if(r8>>>0>=(r4-32|0)>>>0){if(r8>>>0<(r4-16|0)>>>0){r28=HEAP16[r14>>1];HEAP16[r22>>1]=r28;HEAP8[r12]=(r28&65535)>>>8;break}if(r8>>>0>=r4>>>0){break L4}HEAP8[r12]=HEAP16[r22>>1];break}HEAP8[r17]=0;r28=HEAP8[r11];if((r28&2)==0){r29=r8;r30=r4;r31=r28;r32=HEAP8[r18]}else{_fwrite(11480,24,1,r13);r28=HEAP8[r11]|4;HEAP8[r11]=r28;HEAP8[r18]=0;r29=HEAP32[r9>>2];r30=HEAP32[r16>>2];r31=r28;r32=0}HEAP8[r12]=r32;if((r29+16|0)>>>0>=(r30-32|0)>>>0){r33=r29;r2=58;break L6}HEAP8[r11]=r31|2;if((HEAP8[r19]|0)!=1){HEAP8[r19]=1;r28=HEAP32[r20>>2];if((r28|0)!=0){FUNCTION_TABLE[r28](HEAP32[r21>>2],1)}}}else{if((HEAP8[r11]&2)!=0){_fwrite(11480,24,1,r13);HEAP8[r11]=HEAP8[r11]|4}HEAP8[r12]=0}}while(0);r33=HEAP32[r9>>2];r2=58}}else{r33=r8;r2=58}}while(0);do{if(r2==58){r2=0;if(r33>>>0<=351){r27=HEAP32[r3>>2];r2=81;break}if((r33&1|0)==0){r28=HEAP8[r10];HEAP16[r23>>1]=HEAP16[r23>>1]<<1|(r28&255)>>>7&255;HEAP8[r10]=r28<<1;break}r28=HEAP16[r23>>1]<<1;r4=r28|HEAPU8[r24]>>>7&255;r34=(r4&5)==0;HEAP16[r23>>1]=r34?r4:r4&-3;r4=HEAP32[r3>>2];r35=r4+28|0;r36=HEAP32[r35>>2];r37=128>>>((r36&7)>>>0);if((r28&2)==0|r34^1){r34=(r36>>>3)+(r4+36)|0;HEAP8[r34]=HEAPU8[r34]&(r37^255)}else{r34=(r36>>>3)+(r4+36)|0;HEAP8[r34]=HEAPU8[r34]|r37}HEAP8[r4+24|0]=1;if((HEAP8[r4+2|0]|0)!=0){r37=HEAP32[r35>>2]+1|0;HEAP32[r35>>2]=r37;if(r37>>>0>=HEAP32[r4+32>>2]>>>0){r37=r4+20|0;r4=HEAP32[r37>>2];if((r4|0)!=0){HEAP32[r37>>2]=r4-1}HEAP32[r35>>2]=0}}else{_fwrite(17712,22,1,r13)}r35=HEAP32[r3>>2];r4=r35+28|0;r37=HEAP32[r4>>2];r34=128>>>((r37&7)>>>0);if((HEAP16[r23>>1]&1)==0){r36=(r37>>>3)+(r35+36)|0;HEAP8[r36]=HEAPU8[r36]&(r34^255);HEAP8[r35+24|0]=1;r38=HEAP16[r14>>1]}else{r36=(r37>>>3)+(r35+36)|0;HEAP8[r36]=HEAPU8[r36]|r34;HEAP8[r35+24|0]=1;r34=HEAP16[r14>>1]^-32768;HEAP16[r14>>1]=r34;r38=r34}r34=r38&65535;r36=r34<<1;HEAP16[r14>>1]=(r34&32768|0)==0?r36:r36^4129;if((HEAP8[r35+2|0]|0)!=0){r36=HEAP32[r4>>2]+1|0;HEAP32[r4>>2]=r36;if(r36>>>0>=HEAP32[r35+32>>2]>>>0){r36=r35+20|0;r35=HEAP32[r36>>2];if((r35|0)!=0){HEAP32[r36>>2]=r35-1}HEAP32[r4>>2]=0}}else{_fwrite(17712,22,1,r13)}HEAP8[r24]=HEAP8[r24]<<1}}while(0);do{if(r2==81){r2=0;if((HEAP8[r27+2|0]|0)==0){_fwrite(17712,22,1,r13);break}r4=r27+28|0;r35=HEAP32[r4>>2]+1|0;HEAP32[r4>>2]=r35;if(r35>>>0>=HEAP32[r27+32>>2]>>>0){r35=r27+20|0;r36=HEAP32[r35>>2];if((r36|0)!=0){HEAP32[r35>>2]=r36-1}HEAP32[r4>>2]=0}}}while(0);r4=HEAP32[r9>>2]+1|0;HEAP32[r9>>2]=r4;r36=HEAP32[r3>>2];r35=r36+16|0;r34=HEAP32[r35>>2];r37=HEAP32[r7>>2];if(r34>>>0<r37>>>0){r2=88;break}else{r25=r35;r5=r34;r6=r37;r8=r4;r26=r36}}if(r2==88){return}HEAP8[r17]=1;r2=r1+13|0;r8=HEAP8[r2];if(r8<<24>>24==0){if((HEAP8[r15]&16)!=0){r6=r1+5|0;HEAP8[r6]=HEAP8[r6]+1;HEAP32[r26+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=530;HEAP32[r1+65688>>2]=0;HEAP32[r1+65692>>2]=440;return}r6=r1+65692|0;HEAP32[r6>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r7>>2]<<1;HEAP32[r6>>2]=1084}HEAP8[r17]=1;HEAP8[r2]=0;HEAP8[r11]=HEAP8[r11]&-2;r6=r1+65716|0;if((HEAP8[r6]|0)!=1){HEAP8[r6]=1;r6=HEAP32[r1+65724>>2];if((r6|0)!=0){FUNCTION_TABLE[r6](HEAP32[r1+65720>>2],1);r39=HEAP32[r3>>2]}else{r39=r26}}else{r39=r26}r26=r39+24|0;if((HEAP8[r26]|0)==0){return}r6=HEAP32[r1+65712>>2];if((r6|0)==0){return}if((FUNCTION_TABLE[r6](HEAP32[r1+65708>>2],r39)|0)==0){HEAP8[r26]=0;return}else{_fwrite(25664,26,1,r13);return}}HEAP8[r15]=r8;r8=HEAP8[r11];r26=r1+65716|0;if((HEAP8[r26]|0)!=0){HEAP8[r26]=0;r39=HEAP32[r1+65724>>2];if((r39|0)!=0){FUNCTION_TABLE[r39](HEAP32[r1+65720>>2],0)}}HEAP8[r11]=1;if((r8&1)==0){HEAP8[r11]=1;r8=HEAP32[r3>>2];r39=(HEAP32[r8+8>>2]|0)==0;r6=r39?5:1;HEAP8[r11]=r6;if((HEAP8[r8+1|0]|0)==0){r40=r6}else{r6=r39?69:65;HEAP8[r11]=r6;r40=r6}}else{r40=1}r6=HEAP8[r15];r15=r1+65692|0;HEAP32[r15>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r7>>2]<<1;HEAP32[r15>>2]=1084}HEAP8[r17]=1;HEAP8[r2]=0;HEAP8[r11]=r40&68;if((r6&8)!=0?(HEAP8[r26]|0)!=1:0){HEAP8[r26]=1;r26=HEAP32[r1+65724>>2];if((r26|0)!=0){FUNCTION_TABLE[r26](HEAP32[r1+65720>>2],1)}}r26=HEAP32[r3>>2];r3=r26+24|0;if((HEAP8[r3]|0)==0){return}r6=HEAP32[r1+65712>>2];if((r6|0)==0){return}if((FUNCTION_TABLE[r6](HEAP32[r1+65708>>2],r26)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25664,26,1,r13);return}}function _cmd_read_sector_idam(r1){var r2,r3,r4,r5,r6,r7;r2=r1+65680|0;r3=HEAP32[r2>>2];if((HEAP32[r3+20>>2]|0)==0){r4=r1+3|0;r5=HEAP8[r4]|16;HEAP8[r4]=r5;r6=r1+65692|0;HEAP32[r6>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r6>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r4]=r5&-2;r5=r1+65716|0;if((HEAP8[r5]|0)!=1){HEAP8[r5]=1;r5=HEAP32[r1+65724>>2];if((r5|0)!=0){FUNCTION_TABLE[r5](HEAP32[r1+65720>>2],1);r7=HEAP32[r2>>2]}else{r7=r3}}else{r7=r3}r2=r7+24|0;if((HEAP8[r2]|0)==0){return}r5=HEAP32[r1+65712>>2];if((r5|0)==0){return}if((FUNCTION_TABLE[r5](HEAP32[r1+65708>>2],r7)|0)==0){HEAP8[r2]=0;return}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);return}}r2=r1+26|0;if((HEAP8[r2]|0)!=-2){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=530;return}r7=r1+32|0;r5=r1+34|0;if((HEAP16[r7>>1]|0)!=(HEAP16[r5>>1]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}if((HEAP8[r1+4|0]|0)!=(HEAP8[r1+27|0]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}if((HEAP8[r1+2|0]&2)!=0?(HEAP32[r3+12>>2]|0)!=(HEAPU8[r1+28|0]|0):0){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}if((HEAP8[r1+5|0]|0)!=(HEAP8[r1+29|0]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}if(HEAPU8[r1+30|0]>3){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;return}else{HEAP32[r1+20>>2]=960;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=530;HEAP32[r1+65688>>2]=0;HEAP32[r1+65692>>2]=862;return}}function _cmd_read_sector_dam(r1){var r2,r3,r4;r2=HEAP8[r1+26|0];if(r2<<24>>24==-5|r2<<24>>24==-8){r3=r1+3|0;r4=HEAP8[r3];HEAP8[r3]=r2<<24>>24==-8?r4|32:r4&-33;HEAP32[r1+36>>2]=(1024<<HEAPU8[r1+30|0])+16;HEAP32[r1+65696>>2]=744;HEAP32[r1+65692>>2]=0;_cmd_read_sector_clock(r1);return}else{HEAP16[r1+32>>1]=0;r4=r1+16|0;HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;HEAP16[r4+8>>1]=0;HEAP8[r4+10|0]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=530;HEAP32[r1+65692>>2]=548;return}}function _cmd_read_sector_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r3=0;r4=STACKTOP;r5=r1+65680|0;r6=HEAP32[r5>>2];r7=r6+16|0;r8=HEAP32[r7>>2];r9=r1+60|0;r10=HEAP32[r9>>2];if(r8>>>0<r10>>>0){STACKTOP=r4;return}r11=r1+8|0;r12=r1+9|0;r13=r1+10|0;r14=HEAP32[_stderr>>2];r15=r1+36|0;r16=r1+12|0;r17=r1+3|0;r18=r1+6|0;r19=r1+65728|0;r20=r1+40|0;r21=r1+65736|0;r22=r1+65732|0;r23=r1+42|0;r24=r7;r7=r8;r8=r10;r10=r6;L4:while(1){HEAP32[r24>>2]=r7-r8;r6=(HEAP8[r11]|0)==0;HEAP8[r11]=r6&1;r25=r10+28|0;r26=HEAP32[r25>>2];r27=(HEAPU8[(r26>>>3)+(r10+36)|0]&128>>>((r26&7)>>>0)|0)!=0;if(r6){HEAP8[r12]=HEAP8[r12]<<1|r27&1;r6=HEAP16[r13>>1];if(r27){r27=r6^-32768;HEAP16[r13>>1]=r27;r28=r27}else{r28=r6}r6=r28&65535;r27=r6<<1;HEAP16[r13>>1]=(r6&32768|0)==0?r27:r27^4129}if((HEAP8[r10+2|0]|0)!=0){r27=HEAP32[r25>>2]+1|0;HEAP32[r25>>2]=r27;if(r27>>>0>=HEAP32[r10+32>>2]>>>0){r27=r10+20|0;r6=HEAP32[r27>>2];if((r6|0)!=0){HEAP32[r27>>2]=r6-1}HEAP32[r25>>2]=0}}else{_fwrite(17712,22,1,r14)}do{if((HEAP8[r11]|0)!=0){r25=HEAP32[r15>>2]-1|0;HEAP32[r15>>2]=r25;if((r25&7|0)==0){if(r25>>>0<=15){r29=HEAPU8[r12];if((r25|0)!=8){r2=35;break L4}HEAP16[r23>>1]=r29<<8;break}HEAP8[r16]=0;r6=HEAP8[r17];if((r6&2)!=0){r2=18;break L4}HEAP8[r18]=HEAP8[r12];HEAP8[r17]=r6|2;if((HEAP8[r19]|0)!=1){HEAP8[r19]=1;r6=HEAP32[r21>>2];if((r6|0)!=0){FUNCTION_TABLE[r6](HEAP32[r22>>2],1);r30=HEAP32[r15>>2]}else{r30=r25}}else{r30=r25}if((r30|0)==16){HEAP16[r20>>1]=HEAP16[r13>>1]}}}}while(0);r25=HEAP32[r5>>2];r6=r25+16|0;r27=HEAP32[r6>>2];r26=HEAP32[r9>>2];if(r27>>>0<r26>>>0){r2=70;break}else{r24=r6;r7=r27;r8=r26;r10=r25}}if(r2==18){_fwrite(10632,23,1,r14);r10=HEAP8[r17]|4;HEAP8[r17]=r10;r8=r1+65692|0;HEAP32[r8>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r9>>2]<<1;HEAP32[r8>>2]=1084}HEAP8[r16]=1;HEAP8[r1+13|0]=0;HEAP8[r17]=r10&-2;r10=r1+65716|0;if((HEAP8[r10]|0)!=1){HEAP8[r10]=1;r10=HEAP32[r1+65724>>2];if((r10|0)!=0){FUNCTION_TABLE[r10](HEAP32[r1+65720>>2],1)}}r10=HEAP32[r5>>2];r8=r10+24|0;if((HEAP8[r8]|0)==0){STACKTOP=r4;return}r7=HEAP32[r1+65712>>2];if((r7|0)==0){STACKTOP=r4;return}if((FUNCTION_TABLE[r7](HEAP32[r1+65708>>2],r10)|0)==0){HEAP8[r8]=0;STACKTOP=r4;return}else{_fwrite(25664,26,1,r14);STACKTOP=r4;return}}else if(r2==35){r8=HEAPU16[r23>>1]|r29;r29=r8&65535;HEAP16[r23>>1]=r29;HEAP8[r16]=1;r23=HEAP16[r20>>1];if(r23<<16>>16!=r29<<16>>16){_fprintf(r14,9808,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r23&65535,HEAP32[r3+8>>2]=r8,r3));STACKTOP=r3;HEAP8[r17]=HEAP8[r17]|8}r3=r1+13|0;r8=HEAP8[r3];if(r8<<24>>24==0){r23=HEAP8[r17];if((r23&8)==0?(HEAP8[r1+2|0]&16)!=0:0){r29=r1+5|0;HEAP8[r29]=HEAP8[r29]+1;HEAP32[HEAP32[r5>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=530;HEAP32[r1+65688>>2]=0;HEAP32[r1+65692>>2]=548;STACKTOP=r4;return}r29=r1+65692|0;HEAP32[r29>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r9>>2]<<1;HEAP32[r29>>2]=1084}HEAP8[r16]=1;HEAP8[r3]=0;HEAP8[r17]=r23&-2;r23=r1+65716|0;if((HEAP8[r23]|0)!=1){HEAP8[r23]=1;r23=HEAP32[r1+65724>>2];if((r23|0)!=0){FUNCTION_TABLE[r23](HEAP32[r1+65720>>2],1)}}r23=HEAP32[r5>>2];r29=r23+24|0;if((HEAP8[r29]|0)==0){STACKTOP=r4;return}r20=HEAP32[r1+65712>>2];if((r20|0)==0){STACKTOP=r4;return}if((FUNCTION_TABLE[r20](HEAP32[r1+65708>>2],r23)|0)==0){HEAP8[r29]=0;STACKTOP=r4;return}else{_fwrite(25664,26,1,r14);STACKTOP=r4;return}}if((HEAP8[r16]|0)==0){HEAP8[r3]=r8;STACKTOP=r4;return}r29=r1+2|0;HEAP8[r29]=r8;r8=HEAP8[r17];r23=r1+65716|0;if((HEAP8[r23]|0)!=0){HEAP8[r23]=0;r20=HEAP32[r1+65724>>2];if((r20|0)!=0){FUNCTION_TABLE[r20](HEAP32[r1+65720>>2],0)}}HEAP8[r17]=1;if((r8&1)==0){HEAP8[r17]=1;r8=HEAP32[r5>>2];r20=(HEAP32[r8+8>>2]|0)==0;r10=r20?5:1;HEAP8[r17]=r10;if((HEAP8[r8+1|0]|0)==0){r31=r10}else{r10=r20?69:65;HEAP8[r17]=r10;r31=r10}}else{r31=1}r10=HEAP8[r29];r29=r1+65692|0;HEAP32[r29>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r9>>2]<<1;HEAP32[r29>>2]=1084}HEAP8[r16]=1;HEAP8[r3]=0;HEAP8[r17]=r31&68;if((r10&8)!=0?(HEAP8[r23]|0)!=1:0){HEAP8[r23]=1;r23=HEAP32[r1+65724>>2];if((r23|0)!=0){FUNCTION_TABLE[r23](HEAP32[r1+65720>>2],1)}}r23=HEAP32[r5>>2];r5=r23+24|0;if((HEAP8[r5]|0)==0){STACKTOP=r4;return}r10=HEAP32[r1+65712>>2];if((r10|0)==0){STACKTOP=r4;return}if((FUNCTION_TABLE[r10](HEAP32[r1+65708>>2],r23)|0)==0){HEAP8[r5]=0;STACKTOP=r4;return}else{_fwrite(25664,26,1,r14);STACKTOP=r4;return}}else if(r2==70){STACKTOP=r4;return}}function _cmd_step_cont(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=(HEAP8[r1+2|0]&16)!=0;if((HEAP8[r1+7|0]|0)==0){if(r2){r3=r1+4|0;HEAP8[r3]=HEAP8[r3]-1}r3=HEAP32[r1+65680>>2];r4=r3+8|0;r5=HEAP32[r4>>2];if((r5|0)==0){r6=r3}else{HEAP32[r4>>2]=r5-1;r6=r3}}else{if(r2){r2=r1+4|0;HEAP8[r2]=HEAP8[r2]+1}r2=HEAP32[r1+65680>>2];r3=r2+8|0;r5=HEAP32[r3>>2];if(r5>>>0<83){HEAP32[r3>>2]=r5+1;r6=r2}else{r6=r2}}r2=r1+65680|0;HEAP32[r6+32>>2]=0;r5=r1+3|0;r3=HEAP8[r5]&-85;HEAP8[r5]=r3;if((HEAP32[r6+8>>2]|0)==0){r4=r3|4;HEAP8[r5]=r4;r7=r4}else{r7=r3}if((HEAP8[r6+1|0]|0)==0){r8=r7}else{r3=r7|64;HEAP8[r5]=r3;r8=r3}r3=r1+65692|0;HEAP32[r3>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r3>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r5]=r8&-2;r8=r1+65716|0;if((HEAP8[r8]|0)!=1){HEAP8[r8]=1;r8=HEAP32[r1+65724>>2];if((r8|0)!=0){FUNCTION_TABLE[r8](HEAP32[r1+65720>>2],1);r9=HEAP32[r2>>2]}else{r9=r6}}else{r9=r6}r6=r9+24|0;if((HEAP8[r6]|0)==0){return}r2=HEAP32[r1+65712>>2];if((r2|0)==0){return}if((FUNCTION_TABLE[r2](HEAP32[r1+65708>>2],r9)|0)==0){HEAP8[r6]=0;return}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);return}}function _cmd_seek_cont(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=HEAP8[r1+6|0];r3=r1+4|0;r4=HEAP8[r3];do{if((r2&255)<(r4&255)){HEAP8[r3]=r4-1;r5=HEAP32[r1+65680>>2];r6=r5+8|0;r7=HEAP32[r6>>2];if((r7|0)==0){r8=r5;r9=0}else{r10=r7-1|0;HEAP32[r6>>2]=r10;r8=r5;r9=r10}}else{if((r2&255)>(r4&255)){HEAP8[r3]=r4+1;r10=HEAP32[r1+65680>>2];r5=r10+8|0;r6=HEAP32[r5>>2];if(r6>>>0>=83){r8=r10;r9=r6;break}r7=r6+1|0;HEAP32[r5>>2]=r7;r8=r10;r9=r7;break}r7=r1+3|0;r10=HEAP8[r7]&-85;HEAP8[r7]=r10;r5=r1+65680|0;r6=HEAP32[r5>>2];r11=r6+8|0;if((HEAP32[r11>>2]|0)==0){r12=r10|4;HEAP8[r7]=r12;r13=r12}else{r13=r10}if((HEAP8[r6+1|0]|0)==0){r14=r13}else{r10=r13|64;HEAP8[r7]=r10;r14=r10}if((HEAP8[r1+2|0]&4)!=0?(HEAP32[r11>>2]|0)!=(r4&255|0):0){r11=r14|16;HEAP8[r7]=r11;r15=r11}else{r15=r14}r11=r1+65692|0;HEAP32[r11>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r11>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r7]=r15&-2;r7=r1+65716|0;if((HEAP8[r7]|0)!=1){HEAP8[r7]=1;r7=HEAP32[r1+65724>>2];if((r7|0)!=0){FUNCTION_TABLE[r7](HEAP32[r1+65720>>2],1);r16=HEAP32[r5>>2]}else{r16=r6}}else{r16=r6}r6=r16+24|0;if((HEAP8[r6]|0)==0){return}r5=HEAP32[r1+65712>>2];if((r5|0)==0){return}if((FUNCTION_TABLE[r5](HEAP32[r1+65708>>2],r16)|0)==0){HEAP8[r6]=0;return}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);return}}}while(0);HEAP32[r8+32>>2]=0;r8=r1+3|0;r16=HEAP8[r8];HEAP8[r8]=(r9|0)==0?r16|4:r16&-5;HEAP32[r1+65688>>2]=1e3;return}function _cmd_restore_cont(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+65680|0;r3=HEAP32[r2>>2];r4=r3+8|0;r5=HEAP32[r4>>2];if((r5|0)!=0){HEAP32[r3+32>>2]=0;HEAP32[r4>>2]=r5-1;HEAP32[r1+65688>>2]=1e3;return}HEAP8[r1+4|0]=0;r5=r1+3|0;r6=HEAP8[r5]&-85;HEAP8[r5]=r6;if((HEAP32[r4>>2]|0)==0){r4=r6|4;HEAP8[r5]=r4;r7=r4}else{r7=r6}if((HEAP8[r3+1|0]|0)==0){r8=r7}else{r6=r7|64;HEAP8[r5]=r6;r8=r6}r6=r1+65692|0;HEAP32[r6>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r6>>2]=1084}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r5]=r8&-2;r8=r1+65716|0;if((HEAP8[r8]|0)!=1){HEAP8[r8]=1;r8=HEAP32[r1+65724>>2];if((r8|0)!=0){FUNCTION_TABLE[r8](HEAP32[r1+65720>>2],1);r9=HEAP32[r2>>2]}else{r9=r3}}else{r9=r3}r3=r9+24|0;if((HEAP8[r3]|0)==0){return}r2=HEAP32[r1+65712>>2];if((r2|0)==0){return}if((FUNCTION_TABLE[r2](HEAP32[r1+65708>>2],r9)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25664,26,1,HEAP32[_stderr>>2]);return}}function _mem_blk_new(r1,r2,r3){var r4,r5,r6,r7;r4=_malloc(48);r5=r4;if((r4|0)==0){r6=0;return r6}if((r3|0)!=0){r3=_malloc(r2+16|0);HEAP32[r4+44>>2]=r3;if((r3|0)==0){_free(r4);r6=0;return r6}else{r7=r3}}else{HEAP32[r4+44>>2]=0;r7=0}HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;HEAP32[r4+8>>2]=0;HEAP32[r4+12>>2]=0;HEAP32[r4+16>>2]=0;HEAP32[r4+20>>2]=0;HEAP32[r4+24>>2]=r4;HEAP8[r4+28|0]=1;HEAP8[r4+29|0]=0;HEAP8[r4+30|0]=(r7|0)!=0|0;HEAP32[r4+32>>2]=r1;HEAP32[r4+36>>2]=r1-1+r2;HEAP32[r4+40>>2]=r2;r6=r5;return r6}function _mem_blk_clear(r1,r2){var r3;r3=HEAP32[r1+44>>2];if((r3|0)==0){return}_memset(r3,r2,HEAP32[r1+40>>2])|0;return}function _mem_blk_set_readonly(r1,r2){HEAP8[r1+29|0]=(r2|0)!=0|0;return}function _mem_new(){var r1,r2;r1=_malloc(56);if((r1|0)==0){r2=0;return r2}_memset(r1,0,52)|0;HEAP32[r1+52>>2]=-1;r2=r1;return r2}function _mem_set_fct(r1,r2,r3,r4,r5,r6,r7,r8){HEAP32[r1+24>>2]=r2;HEAP32[r1+28>>2]=r3;HEAP32[r1+32>>2]=r4;HEAP32[r1+36>>2]=r5;HEAP32[r1+40>>2]=r6;HEAP32[r1+44>>2]=r7;HEAP32[r1+48>>2]=r8;return}function _mem_prt_state(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=r1|0;if((HEAP32[r5>>2]|0)==0){STACKTOP=r4;return}r6=r1+4|0;r1=0;while(1){r7=HEAP32[HEAP32[r6>>2]+(r1<<3)>>2];r8=HEAP32[r7+32>>2];r9=HEAP32[r7+36>>2];r10=HEAP32[r7+40>>2];r11=(HEAP8[r7+29|0]|0)!=0|0;_fprintf(r2,10776,(r3=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r3>>2]=r1,HEAP32[r3+8>>2]=r8,HEAP32[r3+16>>2]=r9,HEAP32[r3+24>>2]=r10,HEAP32[r3+32>>2]=r11,r3));STACKTOP=r3;r11=r1+1|0;if(r11>>>0<HEAP32[r5>>2]>>>0){r1=r11}else{break}}STACKTOP=r4;return}function _mem_add_blk(r1,r2,r3){var r4,r5,r6,r7;if((r2|0)==0){return}r4=r1+4|0;r5=r1|0;r6=_realloc(HEAP32[r4>>2],(HEAP32[r5>>2]<<3)+8|0);r7=r6;if((r6|0)==0){return}HEAP32[r4>>2]=r7;r4=HEAP32[r5>>2];HEAP32[r5>>2]=r4+1;HEAP32[r7+(r4<<3)>>2]=r2;HEAP32[r7+(r4<<3)+4>>2]=(r3|0)!=0;r3=r1+8|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;return}function _mem_move_to_front(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=r1+8|0;r5=HEAP32[r4>>2];if((r5|0)!=0){r6=HEAP32[r5>>2];if(((HEAP8[r6+28|0]|0)!=0?HEAP32[r6+32>>2]>>>0<=r2>>>0:0)?HEAP32[r6+36>>2]>>>0>=r2>>>0:0){r7=r6}else{r3=5}}else{r3=5}do{if(r3==5){r6=HEAP32[r1>>2];if((r6|0)==0){return}r5=0;r8=HEAP32[r1+4>>2];while(1){r9=HEAP32[r8>>2];if(((HEAP8[r9+28|0]|0)!=0?HEAP32[r9+32>>2]>>>0<=r2>>>0:0)?HEAP32[r9+36>>2]>>>0>=r2>>>0:0){r3=10;break}r10=r5+1|0;if(r10>>>0<r6>>>0){r5=r10;r8=r8+8|0}else{r3=20;break}}if(r3==10){HEAP32[r4>>2]=r8;r7=r9;break}else if(r3==20){return}}}while(0);if((r7|0)==0){return}r9=HEAP32[r1>>2];if((r9|0)==0){return}r4=r1+4|0;r1=HEAP32[r4>>2];r2=0;while(1){r5=r2+1|0;if((HEAP32[r1+(r2<<3)>>2]|0)==(r7|0)){break}if(r5>>>0<r9>>>0){r2=r5}else{r3=20;break}}if(r3==20){return}if((r2|0)==0){r11=r1}else{r3=r2;r2=r1;while(1){r1=r3-1|0;HEAP32[r2+(r3<<3)>>2]=HEAP32[r2+(r1<<3)>>2];r9=HEAP32[r4>>2];if((r1|0)==0){r11=r9;break}else{r3=r1;r2=r9}}}HEAP32[r11>>2]=r7;return}function _mem_get_uint8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=r1+12|0;r5=HEAP32[r4>>2];if((r5|0)!=0){r6=HEAP32[r5>>2];if((HEAP8[r6+28|0]|0)!=0){r5=HEAP32[r6+32>>2];if(r5>>>0<=r2>>>0?HEAP32[r6+36>>2]>>>0>=r2>>>0:0){r7=r6;r8=r5;r3=12}else{r3=5}}else{r3=5}}else{r3=5}L5:do{if(r3==5){r5=HEAP32[r1>>2];if((r5|0)!=0){r6=0;r9=HEAP32[r1+4>>2];while(1){r10=HEAP32[r9>>2];if((HEAP8[r10+28|0]|0)!=0){r11=HEAP32[r10+32>>2];if(r11>>>0<=r2>>>0?HEAP32[r10+36>>2]>>>0>=r2>>>0:0){break}}r12=r6+1|0;if(r12>>>0<r5>>>0){r6=r12;r9=r9+8|0}else{break L5}}HEAP32[r4>>2]=r9;r7=r10;r8=r11;r3=12}}}while(0);if(r3==12){if((r7|0)!=0){r3=r2-r8|0;r8=HEAP32[r7>>2];if((r8|0)==0){r13=HEAP8[HEAP32[r7+44>>2]+r3|0];return r13}else{r13=FUNCTION_TABLE[r8](HEAP32[r7+24>>2],r3);return r13}}}r3=HEAP32[r1+28>>2];if((r3|0)==0){r13=HEAP32[r1+52>>2]&255;return r13}else{r13=FUNCTION_TABLE[r3](HEAP32[r1+24>>2],r2);return r13}}function _mem_get_uint16_le(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=r1+12|0;r5=HEAP32[r4>>2];if((r5|0)!=0){r6=HEAP32[r5>>2];if((HEAP8[r6+28|0]|0)!=0){r5=HEAP32[r6+32>>2];if(r5>>>0<=r2>>>0){r7=HEAP32[r6+36>>2];if(r7>>>0>=r2>>>0){r8=r6;r9=r7;r10=r5;r3=12}else{r3=5}}else{r3=5}}else{r3=5}}else{r3=5}L5:do{if(r3==5){r5=HEAP32[r1>>2];if((r5|0)!=0){r7=0;r6=HEAP32[r1+4>>2];while(1){r11=HEAP32[r6>>2];if((HEAP8[r11+28|0]|0)!=0){r12=HEAP32[r11+32>>2];if(r12>>>0<=r2>>>0){r13=HEAP32[r11+36>>2];if(r13>>>0>=r2>>>0){break}}}r14=r7+1|0;if(r14>>>0<r5>>>0){r7=r14;r6=r6+8|0}else{break L5}}HEAP32[r4>>2]=r6;r8=r11;r9=r13;r10=r12;r3=12}}}while(0);if(r3==12){if((r8|0)!=0){r3=r2+1|0;if(r3>>>0>r9>>>0){r9=_mem_get_uint8(r1,r2);r15=(_mem_get_uint8(r1,r3)&255)<<8|r9&255;return r15}r9=r2-r10|0;r10=HEAP32[r8+4>>2];if((r10|0)==0){r3=HEAP32[r8+44>>2];r15=HEAPU8[r3+(r9+1)|0]<<8|HEAPU8[r3+r9|0];return r15}else{r15=FUNCTION_TABLE[r10](HEAP32[r8+24>>2],r9);return r15}}}r9=HEAP32[r1+32>>2];if((r9|0)==0){r15=HEAP32[r1+52>>2]&65535;return r15}else{r15=FUNCTION_TABLE[r9](HEAP32[r1+24>>2],r2);return r15}}function _mem_set_uint8_rw(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;r5=r1+8|0;r6=HEAP32[r5>>2];if((r6|0)!=0){r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)!=0){r6=HEAP32[r7+32>>2];if(r6>>>0<=r2>>>0?HEAP32[r7+36>>2]>>>0>=r2>>>0:0){r8=r7;r9=r6;r4=12}else{r4=5}}else{r4=5}}else{r4=5}L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)!=0){r7=0;r10=HEAP32[r1+4>>2];while(1){r11=HEAP32[r10>>2];if((HEAP8[r11+28|0]|0)!=0){r12=HEAP32[r11+32>>2];if(r12>>>0<=r2>>>0?HEAP32[r11+36>>2]>>>0>=r2>>>0:0){break}}r13=r7+1|0;if(r13>>>0<r6>>>0){r7=r13;r10=r10+8|0}else{break L5}}HEAP32[r5>>2]=r10;r8=r11;r9=r12;r4=12}}}while(0);if(r4==12){if((r8|0)!=0){r4=r2-r9|0;r9=HEAP32[r8+12>>2];if((r9|0)==0){HEAP8[HEAP32[r8+44>>2]+r4|0]=r3;return}else{FUNCTION_TABLE[r9](HEAP32[r8+24>>2],r4,r3);return}}}r4=HEAP32[r1+40>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+24>>2],r2,r3);return}function _mem_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;r5=r1+16|0;r6=HEAP32[r5>>2];if((r6|0)!=0){r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)!=0){r6=HEAP32[r7+32>>2];if(r6>>>0<=r2>>>0?HEAP32[r7+36>>2]>>>0>=r2>>>0:0){r8=r7;r9=r6;r4=12}else{r4=5}}else{r4=5}}else{r4=5}L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)!=0){r7=0;r10=HEAP32[r1+4>>2];while(1){r11=HEAP32[r10>>2];if((HEAP8[r11+28|0]|0)!=0){r12=HEAP32[r11+32>>2];if(r12>>>0<=r2>>>0?HEAP32[r11+36>>2]>>>0>=r2>>>0:0){break}}r13=r7+1|0;if(r13>>>0<r6>>>0){r7=r13;r10=r10+8|0}else{break L5}}HEAP32[r5>>2]=r10;r8=r11;r9=r12;r4=12}}}while(0);if(r4==12){if((r8|0)!=0){if((HEAP8[r8+29|0]|0)!=0){return}r4=r2-r9|0;r9=HEAP32[r8+12>>2];if((r9|0)==0){HEAP8[HEAP32[r8+44>>2]+r4|0]=r3;return}else{FUNCTION_TABLE[r9](HEAP32[r8+24>>2],r4,r3);return}}}r4=HEAP32[r1+40>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+24>>2],r2,r3);return}function _mem_set_uint16_le(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=r1+16|0;r6=HEAP32[r5>>2];if((r6|0)!=0){r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)!=0){r6=HEAP32[r7+32>>2];if(r6>>>0<=r2>>>0){r8=HEAP32[r7+36>>2];if(r8>>>0>=r2>>>0){r9=r7;r10=r8;r11=r6;r4=12}else{r4=5}}else{r4=5}}else{r4=5}}else{r4=5}L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)!=0){r8=0;r7=HEAP32[r1+4>>2];while(1){r12=HEAP32[r7>>2];if((HEAP8[r12+28|0]|0)!=0){r13=HEAP32[r12+32>>2];if(r13>>>0<=r2>>>0){r14=HEAP32[r12+36>>2];if(r14>>>0>=r2>>>0){break}}}r15=r8+1|0;if(r15>>>0<r6>>>0){r8=r15;r7=r7+8|0}else{break L5}}HEAP32[r5>>2]=r7;r9=r12;r10=r14;r11=r13;r4=12}}}while(0);if(r4==12){if((r9|0)!=0){r4=r2+1|0;if(r4>>>0>r10>>>0){_mem_set_uint8(r1,r2,r3&255);_mem_set_uint8(r1,r4,(r3&65535)>>>8&255);return}if((HEAP8[r9+29|0]|0)!=0){return}r4=r2-r11|0;r11=HEAP32[r9+16>>2];if((r11|0)==0){r10=r9+44|0;HEAP8[HEAP32[r10>>2]+r4|0]=r3;HEAP8[HEAP32[r10>>2]+(r4+1)|0]=(r3&65535)>>>8;return}else{FUNCTION_TABLE[r11](HEAP32[r9+24>>2],r4,r3);return}}}r4=HEAP32[r1+44>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+24>>2],r2,r3);return}function _dsk_get_uint32_be(r1,r2){return((HEAPU8[r1+r2|0]<<8|HEAPU8[r1+(r2+1)|0])<<8|HEAPU8[r1+(r2+2)|0])<<8|HEAPU8[r1+(r2+3)|0]}function _dsk_set_uint32_be(r1,r2,r3){HEAP8[r1+r2|0]=r3>>>24;HEAP8[r1+(r2+1)|0]=r3>>>16;HEAP8[r1+(r2+2)|0]=r3>>>8;HEAP8[r1+(r2+3)|0]=r3;return}function _dsk_get_uint32_le(r1,r2){return((HEAPU8[r1+(r2+3)|0]<<8|HEAPU8[r1+(r2+2)|0])<<8|HEAPU8[r1+(r2+1)|0])<<8|HEAPU8[r1+r2|0]}function _dsk_get_uint64_le(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=HEAPU8[r1+(r2+7)|0];r4=r3<<8|0>>>24|HEAPU8[r1+(r2+6)|0];r5=r4<<8|0>>>24|HEAPU8[r1+(r2+5)|0];r6=r5<<8|0>>>24|HEAPU8[r1+(r2+4)|0];r7=r6<<8|0>>>24|HEAPU8[r1+(r2+3)|0];r8=r7<<8|0>>>24|HEAPU8[r1+(r2+2)|0];r9=r8<<8|0>>>24|HEAPU8[r1+(r2+1)|0];return tempRet0=((((((0<<8|r3>>>24)<<8|r4>>>24)<<8|r5>>>24)<<8|r6>>>24)<<8|r7>>>24)<<8|r8>>>24)<<8|r9>>>24|0,r9<<8|0>>>24|HEAPU8[r1+r2|0]}function _dsk_set_uint32_le(r1,r2,r3){HEAP8[r1+r2|0]=r3;HEAP8[r1+(r2+1)|0]=r3>>>8;HEAP8[r1+(r2+2)|0]=r3>>>16;HEAP8[r1+(r2+3)|0]=r3>>>24;return}function _dsk_set_uint64_le(r1,r2,r3,r4){HEAP8[r1+r2|0]=r3;HEAP8[r1+(r2+1)|0]=r3>>>8|r4<<24;HEAP8[r1+(r2+2)|0]=r3>>>16|r4<<16;HEAP8[r1+(r2+3)|0]=r3>>>24|r4<<8;HEAP8[r1+(r2+4)|0]=r4;HEAP8[r1+(r2+5)|0]=r4>>>8|0<<24;HEAP8[r1+(r2+6)|0]=r4>>>16|0<<16;HEAP8[r1+(r2+7)|0]=r4>>>24|0<<8;return}function _dsk_read(r1,r2,r3,r4,r5,r6){var r7,r8;if((_fseek(r1,r3,0)|0)!=0){r7=1;return r7}r3=_fread(r2,1,r5,r1);r1=r3;r4=0;if(!(r4>>>0<r6>>>0|r4>>>0==r6>>>0&r1>>>0<r5>>>0)){r7=0;return r7}r8=_i64Subtract(r5,r6,r1,r4);_memset(r2+r3|0,0,r8)|0;r7=0;return r7}function _dsk_write(r1,r2,r3,r4,r5,r6){var r7;if((_fseek(r1,r3,0)|0)!=0){r7=1;return r7}r7=((_fwrite(r2,1,r5,r1)|0)!=(r5|0)|0!=(r6|0))&1;return r7}function _dsk_get_filesize(r1,r2){var r3,r4;if((_fseek(r1,0,2)|0)!=0){r3=1;return r3}r4=_ftell(r1);if((r4|0)==-1){r3=1;return r3}HEAP32[r2>>2]=r4;HEAP32[r2+4>>2]=(r4|0)<0|0?-1:0;r3=0;return r3}function _dsk_set_filesize(r1,r2,r3){_fflush(r1);return(_ftruncate(_fileno(r1),r2)|0)!=0|0}function _dsk_init(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13;r7=0;r8=r1;HEAP32[r8>>2]=0;HEAP32[r8+4>>2]=0;HEAP32[r8+8>>2]=0;HEAP32[r8+12>>2]=0;HEAP32[r8+16>>2]=0;HEAP32[r8+20>>2]=0;HEAP32[r8+24>>2]=0;if((r3|0)==0){r8=Math_imul(Math_imul(r5,r4)|0,r6)|0;if((r8|0)==0){r9=r6;r10=r5;r11=r4;r12=0}else{r13=r8;r7=3}}else{r13=r3;r7=3}do{if(r7==3){if((r4|0)==0){r3=(r6|0)==0?63:r6;r8=(r5|0)==0?16:r5;r9=r3;r10=r8;r11=(r13>>>0)/((Math_imul(r3,r8)|0)>>>0)&-1;r12=r13;break}r8=(r6|0)==0;if((r5|0)==0){r3=r8?63:r6;r9=r3;r10=(r13>>>0)/((Math_imul(r3,r4)|0)>>>0)&-1;r11=r4;r12=r13;break}if(r8){r9=(r13>>>0)/((Math_imul(r5,r4)|0)>>>0)&-1;r10=r5;r11=r4;r12=r13}else{r9=r6;r10=r5;r11=r4;r12=r13}}}while(0);HEAP32[r1+28>>2]=r12;HEAP32[r1+32>>2]=r11;HEAP32[r1+36>>2]=r10;HEAP32[r1+40>>2]=r9;HEAP32[r1+44>>2]=r11;HEAP32[r1+48>>2]=r10;HEAP32[r1+52>>2]=r9;HEAP8[r1+56|0]=0;HEAP32[r1+60>>2]=0;HEAP32[r1+64>>2]=r2;return}function _dsk_del(r1){var r2;if((r1|0)==0){return}_free(HEAP32[r1+60>>2]);r2=HEAP32[r1+4>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](r1);return}function _dsk_set_drive(r1,r2){HEAP32[r1+24>>2]=r2;return}function _dsk_get_type(r1){return HEAP32[r1>>2]}function _dsk_set_type(r1,r2){HEAP32[r1>>2]=r2;return}function _dsk_get_readonly(r1){return(HEAP8[r1+56|0]|0)!=0|0}function _dsk_set_readonly(r1,r2){HEAP8[r1+56|0]=(r2|0)!=0|0;return}function _dsk_set_fname(r1,r2){var r3;r3=r1+60|0;r1=HEAP32[r3>>2];if((r1|0)!=0){_free(r1)}if((r2|0)==0){HEAP32[r3>>2]=0;return}r1=_malloc(_strlen(r2)+1|0);HEAP32[r3>>2]=r1;if((r1|0)==0){return}_strcpy(r1,r2);return}function _dsk_set_geometry(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;if((r2|0)==0){r6=Math_imul(Math_imul(r4,r3)|0,r5)|0;if((r6|0)==0){r7=1;return r7}else{r8=r6}}else{r8=r2}do{if((r3|0)!=0){r2=(r5|0)==0;if((r4|0)==0){r6=r2?63:r5;r9=r6;r10=r3;r11=(r8>>>0)/((Math_imul(r6,r3)|0)>>>0)&-1;break}if(r2){r9=(r8>>>0)/((Math_imul(r4,r3)|0)>>>0)&-1;r10=r3;r11=r4}else{r9=r5;r10=r3;r11=r4}}else{r2=(r5|0)==0?63:r5;r6=(r4|0)==0?16:r4;r9=r2;r10=(r8>>>0)/((Math_imul(r2,r6)|0)>>>0)&-1;r11=r6}}while(0);HEAP32[r1+28>>2]=r8;HEAP32[r1+32>>2]=r10;HEAP32[r1+36>>2]=r11;HEAP32[r1+40>>2]=r9;r7=0;return r7}function _dsk_set_visible_chs(r1,r2,r3,r4){HEAP32[r1+44>>2]=r2;HEAP32[r1+48>>2]=r3;HEAP32[r1+52>>2]=r4;return}function _dsk_get_drive(r1){return HEAP32[r1+24>>2]}function _dsk_get_block_cnt(r1){return HEAP32[r1+28>>2]}function _dsk_guess_geometry(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+512|0;r4=r3;r5=r4|0;r6=512;r7=0;r8=r1+8|0;r9=HEAP32[r8>>2];r10=(r9|0)==0;L1:do{if(!r10){r11=FUNCTION_TABLE[r9](r1,r5,0,1);r12=(r11|0)==0;if(r12){r13=r4+510|0;r14=HEAP8[r13];r15=r14<<24>>24==85;if(r15){r16=r4+511|0;r17=HEAP8[r16];r18=r17<<24>>24==-86;if(r18){r19=0;r20=0;r21=0;r22=0;while(1){r23=r20<<4;r24=r23+446|0;r25=r4+r24|0;r26=HEAP8[r25];r27=r26&127;r28=r27<<24>>24==0;do{if(r28){r29=r23+449|0;r30=r4+r29|0;r31=HEAP8[r30];r32=r31&255;r33=r23+448|0;r34=r4+r33|0;r35=HEAP8[r34];r36=r35&255;r37=r36<<2;r38=r37&768;r39=r38|r32;r40=r23+447|0;r41=r4+r40|0;r42=HEAP8[r41];r43=r36&63;r44=r23+454|0;r45=r4+r44|0;r46=r23+457|0;r47=r4+r46|0;r48=HEAP8[r47];r49=r48&255;r50=r49<<8;r51=r23+456|0;r52=r4+r51|0;r53=HEAP8[r52];r54=r53&255;r55=r50|r54;r56=r55<<8;r57=r23+455|0;r58=r4+r57|0;r59=HEAP8[r58];r60=r59&255;r61=r56|r60;r62=r61<<8;r63=HEAP8[r45];r64=r63&255;r65=r62|r64;r66=r23+453|0;r67=r4+r66|0;r68=HEAP8[r67];r69=r68&255;r70=r23+452|0;r71=r4+r70|0;r72=HEAP8[r71];r73=r72&255;r74=r73<<2;r75=r74&768;r76=r75|r69;r77=r23+451|0;r78=r4+r77|0;r79=HEAP8[r78];r80=r73&63;r81=r23+458|0;r82=r4+r81|0;r83=r23+461|0;r84=r4+r83|0;r85=HEAP8[r84];r86=r85&255;r87=r86<<8;r88=r23+460|0;r89=r4+r88|0;r90=HEAP8[r89];r91=r90&255;r92=r87|r91;r93=r92<<8;r94=r23+459|0;r95=r4+r94|0;r96=HEAP8[r95];r97=r96&255;r98=r93|r97;r99=r98<<8;r100=HEAP8[r82];r101=r100&255;r102=r99|r101;r103=(r43|0)==0;r104=(r80|0)==0;r105=r103|r104;r106=(r65|0)==0;r107=r105|r106;r108=(r102|0)==0;r109=r107|r108;if(!r109){r110=r43-1|0;r111=r80-1|0;r112=r65-1|0;r113=r112+r102|0;r114=r65>>>0>r110>>>0;r115=r113>>>0>r111>>>0;r116=r114&r115;if(r116){r117=r39;r118=0;r119=r113-r111|0;r120=r119;r121=0;r122=r76;r123=0;r124=r79&255;r125=0;r126=___muldi3(r124,r125,r117,r118);r127=tempRet0;r128=r42&255;r129=0;r130=___muldi3(r122,r123,r128,r129);r131=tempRet0;r132=(r126|0)==(r130|0)&(r127|0)==(r131|0);if(!r132){r133=r65-r110|0;r134=r133;r135=0;r136=___muldi3(r122,r123,r134,r135);r137=tempRet0;r138=___muldi3(r120,r121,r117,r118);r139=tempRet0;r140=_i64Subtract(r126,r127,r130,r131);r141=tempRet0;r142=_i64Subtract(r138,r139,r136,r137);r143=tempRet0;r144=___divdi3(r142,r143,r140,r141);r145=tempRet0;r146=r144;r147=r146;r148=-1;r149=0;r150=r144&r148;r151=r145&r149;r152=___muldi3(r150,r151,r122,r123);r153=tempRet0;r154=0;r155=0;r156=(r152|0)==(r154|0)&(r153|0)==(r155|0);if(!r156){r157=___muldi3(r150,r151,r124,r125);r158=tempRet0;r159=_i64Subtract(r120,r121,r157,r158);r160=tempRet0;r161=___divdi3(r159,r160,r152,r153);r162=tempRet0;r163=r161;r164=r163;r165=(r164|0)==0;if(r165){r166=r22;r167=r21;r168=0;break}r169=(r147|0)==0;if(r169){r166=r22;r167=r21;r168=r164;break}else{r170=r164}}else{r170=r19}r171=(r21|0)==0;r172=(r21|0)==(r170|0);r173=r171|r172;if(!r173){break L1}r174=(r22|0)==0;r175=(r22|0)==(r147|0);r176=r174|r175;if(r176){r166=r147;r167=r170;r168=r170}else{break L1}}else{r166=r22;r167=r21;r168=r19}}else{r166=r22;r167=r21;r168=r19}}else{r166=r22;r167=r21;r168=r19}}else{r166=r22;r167=r21;r168=r19}}while(0);r177=r20+1|0;r178=r177>>>0<4;if(r178){r19=r168;r20=r177;r21=r167;r22=r166}else{break}}r179=(r167|0)==0;r180=(r166|0)==0;r181=r179|r180;if(!r181){r182=r1+28|0;r183=HEAP32[r182>>2];r184=Math_imul(r166,r167)|0;r185=(r183>>>0)/(r184>>>0)&-1;r186=(r183|0)==0;if(r186){r187=Math_imul(r185,r184)|0;r188=(r187|0)==0;if(r188){STACKTOP=r3;return 0}else{r189=r187}}else{r189=r183}r190=(r185|0)==0;if(r190){r191=(r189>>>0)/(r184>>>0)&-1;r192=r191}else{r192=r185}HEAP32[r182>>2]=r189;r193=r1+32|0;HEAP32[r193>>2]=r192;r194=r1+36|0;HEAP32[r194>>2]=r167;r195=r1+40|0;HEAP32[r195>>2]=r166;STACKTOP=r3;return 0}}}}}}while(0);r196=512;r197=0;r198=512;r199=0;r200=HEAP32[r8>>2];r201=(r200|0)==0;if(!r201){r202=FUNCTION_TABLE[r200](r1,r5,0,1);r203=(r202|0)==0;if(r203){r204=r4+510|0;r205=HEAP8[r204];r206=r205<<24>>24==85;if(r206){r207=r4+511|0;r208=HEAP8[r207];r209=r208<<24>>24==-86;if(r209){r210=r4+11|0;r211=r4+12|0;r212=HEAP8[r211];r213=r212&255;r214=r213<<8;r215=HEAP8[r210];r216=r215&255;r217=r214|r216;r218=r217<<16>>16==512;if(r218){r219=r4+26|0;r220=r4+27|0;r221=HEAP8[r220];r222=r221&255;r223=r222<<8;r224=HEAP8[r219];r225=r224&255;r226=r223|r225;r227=r226&65535;r228=r4+24|0;r229=r4+25|0;r230=HEAP8[r229];r231=r230&255;r232=r231<<8;r233=HEAP8[r228];r234=r233&255;r235=r232|r234;r236=r235&65535;r237=r226<<16>>16==0;r238=(r226&65535)>255;r239=r237|r238;if(!r239){r240=r235<<16>>16==0;r241=(r235&65535)>255;r242=r240|r241;if(!r242){r243=r1+28|0;r244=HEAP32[r243>>2];r245=Math_imul(r236,r227)|0;r246=(r244>>>0)/(r245>>>0)&-1;r247=(r244|0)==0;if(r247){r248=Math_imul(r246,r245)|0;r249=(r248|0)==0;if(r249){STACKTOP=r3;return 0}else{r250=r248}}else{r250=r244}r251=(r246|0)==0;if(r251){r252=(r250>>>0)/(r245>>>0)&-1;r253=r252}else{r253=r246}HEAP32[r243>>2]=r250;r254=r1+32|0;HEAP32[r254>>2]=r253;r255=r1+36|0;HEAP32[r255>>2]=r227;r256=r1+40|0;HEAP32[r256>>2]=r236;STACKTOP=r3;return 0}}}}}}}r257=512;r258=0;r259=512;r260=0;r261=HEAP32[r8>>2];r262=(r261|0)==0;if(!r262){r263=FUNCTION_TABLE[r261](r1,r5,0,1);r264=(r263|0)==0;if(r264){r265=r4+508|0;r266=HEAP8[r265];r267=r266&255;r268=r267<<8;r269=r4+509|0;r270=HEAP8[r269];r271=r270&255;r272=r268|r271;r273=r272<<16>>16==-9538;if(r273){r274=0;r275=0;while(1){r276=r4+r274|0;r277=HEAP8[r276];r278=r277&255;r279=r278<<8;r280=r279^r275;r281=r274|1;r282=r4+r281|0;r283=HEAP8[r282];r284=r283&255;r285=r280^r284;r286=r274+2|0;r287=r286>>>0<512;if(r287){r274=r286;r275=r285}else{break}}r288=(r280|0)==(r284|0);if(r288){r289=r4+128|0;r290=HEAP8[r289];r291=r290&255;r292=r291<<8;r293=r4+129|0;r294=HEAP8[r293];r295=r294&255;r296=r292|r295;r297=r296<<8;r298=r4+130|0;r299=HEAP8[r298];r300=r299&255;r301=r297|r300;r302=r301<<8;r303=r4+131|0;r304=HEAP8[r303];r305=r304&255;r306=r302|r305;r307=(r306|0)==1;if(r307){r308=r4+140|0;r309=HEAP8[r308];r310=r309&255;r311=r310<<8;r312=r4+141|0;r313=HEAP8[r312];r314=r313&255;r315=r311|r314;r316=(r315&65535)>8;if(!r316){r317=r4+422|0;r318=HEAP8[r317];r319=r318&255;r320=r319<<8;r321=r4+423|0;r322=HEAP8[r321];r323=r322&255;r324=r320|r323;r325=r324&65535;r326=r4+436|0;r327=HEAP8[r326];r328=r327&255;r329=r328<<8;r330=r4+437|0;r331=HEAP8[r330];r332=r331&255;r333=r329|r332;r334=r333&65535;r335=r4+438|0;r336=HEAP8[r335];r337=r336&255;r338=r337<<8;r339=r4+439|0;r340=HEAP8[r339];r341=r340&255;r342=r338|r341;r343=r342&65535;r344=r1+28|0;r345=HEAP32[r344>>2];r346=(r345|0)==0;if(r346){r347=Math_imul(r334,r325)|0;r348=Math_imul(r347,r343)|0;r349=(r348|0)==0;if(r349){STACKTOP=r3;return 0}else{r350=r348}}else{r350=r345}r351=r324<<16>>16==0;do{if(!r351){r352=r333<<16>>16==0;r353=r342<<16>>16==0;if(r352){r354=r353?63:r343;r355=Math_imul(r354,r325)|0;r356=(r350>>>0)/(r355>>>0)&-1;r357=r354;r358=r325;r359=r356;break}if(r353){r360=Math_imul(r334,r325)|0;r361=(r350>>>0)/(r360>>>0)&-1;r357=r361;r358=r325;r359=r334}else{r357=r343;r358=r325;r359=r334}}else{r362=r342<<16>>16==0;r363=r362?63:r343;r364=r333<<16>>16==0;r365=r364?16:r334;r366=Math_imul(r363,r365)|0;r367=(r350>>>0)/(r366>>>0)&-1;r357=r363;r358=r367;r359=r365}}while(0);HEAP32[r344>>2]=r350;r368=r1+32|0;HEAP32[r368>>2]=r358;r369=r1+36|0;HEAP32[r369>>2]=r359;r370=r1+40|0;HEAP32[r370>>2]=r357;STACKTOP=r3;return 0}}}}}}r371=512;r372=0;r373=r1+28|0;r374=HEAP32[r373>>2];switch(r374|0){case 360:{HEAP32[r373>>2]=360;r375=r1+32|0;HEAP32[r375>>2]=40;r376=r1+36|0;HEAP32[r376>>2]=1;r377=r1+40|0;HEAP32[r377>>2]=9;STACKTOP=r3;return 0;break};case 320:{HEAP32[r373>>2]=320;r378=r1+32|0;HEAP32[r378>>2]=40;r379=r1+36|0;HEAP32[r379>>2]=1;r380=r1+40|0;HEAP32[r380>>2]=8;STACKTOP=r3;return 0;break};case 5760:{HEAP32[r373>>2]=5760;r381=r1+32|0;HEAP32[r381>>2]=80;r382=r1+36|0;HEAP32[r382>>2]=2;r383=r1+40|0;HEAP32[r383>>2]=36;STACKTOP=r3;return 0;break};case 720:{HEAP32[r373>>2]=720;r384=r1+32|0;HEAP32[r384>>2]=40;r385=r1+36|0;HEAP32[r385>>2]=2;r386=r1+40|0;HEAP32[r386>>2]=9;STACKTOP=r3;return 0;break};case 2400:{HEAP32[r373>>2]=2400;r387=r1+32|0;HEAP32[r387>>2]=80;r388=r1+36|0;HEAP32[r388>>2]=2;r389=r1+40|0;HEAP32[r389>>2]=15;STACKTOP=r3;return 0;break};case 2880:{HEAP32[r373>>2]=2880;r390=r1+32|0;HEAP32[r390>>2]=80;r391=r1+36|0;HEAP32[r391>>2]=2;r392=r1+40|0;HEAP32[r392>>2]=18;STACKTOP=r3;return 0;break};case 1440:{HEAP32[r373>>2]=1440;r393=r1+32|0;HEAP32[r393>>2]=80;r394=r1+36|0;HEAP32[r394>>2]=2;r395=r1+40|0;HEAP32[r395>>2]=9;STACKTOP=r3;return 0;break};case 1600:{HEAP32[r373>>2]=1600;r396=r1+32|0;HEAP32[r396>>2]=80;r397=r1+36|0;HEAP32[r397>>2]=2;r398=r1+40|0;HEAP32[r398>>2]=10;STACKTOP=r3;return 0;break};case 800:{HEAP32[r373>>2]=800;r399=r1+32|0;HEAP32[r399>>2]=40;r400=r1+36|0;HEAP32[r400>>2]=2;r401=r1+40|0;HEAP32[r401>>2]=10;STACKTOP=r3;return 0;break};case 640:{HEAP32[r373>>2]=640;r402=r1+32|0;HEAP32[r402>>2]=40;r403=r1+36|0;HEAP32[r403>>2]=2;r404=r1+40|0;HEAP32[r404>>2]=8;STACKTOP=r3;return 0;break};default:{r405=r1+32|0;r406=HEAP32[r405>>2];r407=r1+36|0;r408=HEAP32[r407>>2];r409=r1+40|0;r410=HEAP32[r409>>2];r411=(r374|0)==0;if(r411){r412=Math_imul(r408,r406)|0;r413=Math_imul(r412,r410)|0;r414=(r413|0)==0;if(r414){STACKTOP=r3;return 0}else{r415=r413}}else{r415=r374}r416=(r406|0)==0;do{if(!r416){r417=(r408|0)==0;r418=(r410|0)==0;if(r417){r419=r418?63:r410;r420=Math_imul(r419,r406)|0;r421=(r415>>>0)/(r420>>>0)&-1;r422=r419;r423=r406;r424=r421;break}if(r418){r425=Math_imul(r408,r406)|0;r426=(r415>>>0)/(r425>>>0)&-1;r422=r426;r423=r406;r424=r408}else{r422=r410;r423=r406;r424=r408}}else{r427=(r410|0)==0;r428=r427?63:r410;r429=(r408|0)==0;r430=r429?16:r408;r431=Math_imul(r428,r430)|0;r432=(r415>>>0)/(r431>>>0)&-1;r422=r428;r423=r432;r424=r430}}while(0);HEAP32[r373>>2]=r415;HEAP32[r405>>2]=r423;HEAP32[r407>>2]=r424;HEAP32[r409>>2]=r422;STACKTOP=r3;return 0}}}function _dsk_auto_open(r1,r2,r3,r4){var r5,r6;do{if((_dsk_pce_probe(r1)|0)==0){if((_dsk_qed_probe(r1)|0)!=0){r5=_dsk_qed_open(r1,r4);break}if((_dsk_dosemu_probe(r1)|0)!=0){r5=_dsk_dosemu_open(r1,r4);break}r6=_dsk_psi_probe(r1);if((r6|0)!=0){r5=_dsk_psi_open(r1,r6,r4);break}r6=_psi_guess_type(r1);if((r6|0)==12|(r6|0)==0){r5=_dsk_img_open(r1,r2,r3,r4);break}else{r5=_dsk_psi_open(r1,r6,r4);break}}else{r5=_dsk_pce_open(r1,r4)}}while(0);return r5}function _dsk_read_lba(r1,r2,r3,r4){var r5,r6;r5=HEAP32[r1+8>>2];if((r5|0)==0){r6=1;return r6}r6=FUNCTION_TABLE[r5](r1,r2,r3,r4);return r6}function _dsk_write_lba(r1,r2,r3,r4){var r5,r6;r5=HEAP32[r1+12>>2];if((r5|0)==0){r6=1;return r6}r6=FUNCTION_TABLE[r5](r1,r2,r3,r4);return r6}function _dsks_new(){var r1,r2;r1=_malloc(8);if((r1|0)==0){r2=0;return r2}HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;r2=r1;return r2}function _dsks_add_disk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=r1|0;r5=HEAP32[r4>>2];r6=HEAP32[r1+4>>2];do{if((r5|0)!=0){r7=HEAP32[r2+24>>2];r8=0;while(1){r9=r8+1|0;if((HEAP32[HEAP32[r6+(r8<<2)>>2]+24>>2]|0)==(r7|0)){r10=1;r3=8;break}if(r9>>>0<r5>>>0){r8=r9}else{r3=5;break}}if(r3==5){r11=r5+1|0;break}else if(r3==8){return r10}}else{r11=1}}while(0);r3=_realloc(r6,r11<<2);r6=r3;if((r3|0)==0){r10=1;return r10}HEAP32[r6+(HEAP32[r4>>2]<<2)>>2]=r2;HEAP32[r4>>2]=r11;HEAP32[r1+4>>2]=r6;r10=0;return r10}function _dsks_rmv_disk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=r1|0;r4=HEAP32[r3>>2];if((r4|0)==0){r5=0;r6=0;HEAP32[r3>>2]=r6;return r5}r7=r1+4|0;r1=0;r8=0;r9=0;while(1){r10=HEAP32[r7>>2];r11=HEAP32[r10+(r8<<2)>>2];if((r11|0)==(r2|0)){r12=r9;r13=1}else{HEAP32[r10+(r9<<2)>>2]=r11;r12=r9+1|0;r13=r1}r11=r8+1|0;if(r11>>>0<r4>>>0){r1=r13;r8=r11;r9=r12}else{r5=r13;r6=r12;break}}HEAP32[r3>>2]=r6;return r5}function _dsks_get_disk(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=HEAP32[r1>>2];if((r4|0)==0){r5=0;return r5}r6=HEAP32[r1+4>>2];r1=0;while(1){r7=HEAP32[r6+(r1<<2)>>2];r8=r1+1|0;if((HEAP32[r7+24>>2]|0)==(r2|0)){r5=r7;r3=5;break}if(r8>>>0<r4>>>0){r1=r8}else{r5=0;r3=5;break}}if(r3==5){return r5}}function _dsks_commit(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=r1|0;r3=HEAP32[r2>>2];if((r3|0)==0){r4=0;return r4}r5=r1+4|0;r1=0;r6=0;r7=r3;while(1){r3=HEAP32[HEAP32[r5>>2]+(r1<<2)>>2];r8=HEAP32[r3+20>>2];if((r8|0)==0){r9=r6;r10=r7}else{r11=(FUNCTION_TABLE[r8](r3,10624,32096)|0)==0;r9=r11?r6:1;r10=HEAP32[r2>>2]}r11=r1+1|0;if(r11>>>0<r10>>>0){r1=r11;r6=r9;r7=r10}else{r4=r9;break}}return r4}function _dsks_set_msg(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=0;r6=HEAP32[r1>>2];if((r6|0)==0){r7=1;return r7}r8=HEAP32[r1+4>>2];r1=0;while(1){r9=HEAP32[r8+(r1<<2)>>2];r10=r1+1|0;if((HEAP32[r9+24>>2]|0)==(r2|0)){break}if(r10>>>0<r6>>>0){r1=r10}else{r7=1;r5=8;break}}if(r5==8){return r7}if((r9|0)==0){r7=1;return r7}r5=HEAP32[r9+20>>2];if((r5|0)==0){r7=1;return r7}r7=FUNCTION_TABLE[r5](r9,r3,(r4|0)==0?32096:r4);return r7}function _dsk_dosemu_open_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3|0;if((_dsk_read(r1,r4,0,0,23,0)|0)!=0){r5=0;STACKTOP=r3;return r5}if((_memcmp(r4,10432,7)|0)!=0){r5=0;STACKTOP=r3;return r5}r6=_dsk_get_uint32_le(r4,15);r7=_dsk_get_uint32_le(r4,7);r8=_dsk_get_uint32_le(r4,11);r9=_dsk_get_uint32_le(r4,19);if(r9>>>0<23){r5=0;STACKTOP=r3;return r5}r4=_malloc(80);if((r4|0)==0){r5=0;STACKTOP=r3;return r5}r10=r4;_dsk_init(r10,r4,0,r6,r7,r8);_dsk_set_type(r10,4);_dsk_set_readonly(r10,r2);HEAP32[r4+4>>2]=962;HEAP32[r4+8>>2]=1126;HEAP32[r4+12>>2]=1160;r2=r4+72|0;HEAP32[r2>>2]=r9;HEAP32[r2+4>>2]=0;HEAP32[r4+68>>2]=r1;r5=r10;STACKTOP=r3;return r5}function _dsk_dosemu_del(r1){var r2;r2=HEAP32[r1+64>>2];_fclose(HEAP32[r2+68>>2]);_free(r2);return}function _dsk_dosemu_read(r1,r2,r3,r4){var r5,r6,r7;if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r5=1;return r5}r6=HEAP32[r1+64>>2];r1=r6+72|0;r7=r3;r3=_i64Add(HEAP32[r1>>2],HEAP32[r1+4>>2],r7<<9|0>>>23,0<<9|r7>>>23);r7=r4;r5=(_dsk_read(HEAP32[r6+68>>2],r2,r3,tempRet0,r7<<9|0>>>23,0<<9|r7>>>23)|0)!=0|0;return r5}function _dsk_dosemu_write(r1,r2,r3,r4){var r5,r6,r7;if((HEAP8[r1+56|0]|0)!=0){r5=1;return r5}if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r5=1;return r5}r6=HEAP32[r1+64>>2];r1=r6+72|0;r7=r3;r3=_i64Add(HEAP32[r1>>2],HEAP32[r1+4>>2],r7<<9|0>>>23,0<<9|r7>>>23);r7=r4;r4=r6+68|0;if((_dsk_write(HEAP32[r4>>2],r2,r3,tempRet0,r7<<9|0>>>23,0<<9|r7>>>23)|0)!=0){r5=1;return r5}_fflush(HEAP32[r4>>2]);r5=0;return r5}function _dsk_dosemu_open(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;if((r2|0)==0){r4=_fopen(r1,17600);if((r4|0)==0){r5=_fopen(r1,20080);r6=1;r3=5}else{r7=0;r8=r4}}else{r5=_fopen(r1,20080);r6=r2;r3=5}if(r3==5){if((r5|0)==0){r9=0;return r9}else{r7=r6;r8=r5}}r5=_dsk_dosemu_open_fp(r8,r7);if((r5|0)==0){_fclose(r8);r9=0;return r9}else{_dsk_set_fname(r5,r1);r9=r5;return r9}}function _dsk_dosemu_probe(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=_fopen(r1,20080);if((r3|0)==0){r4=0;STACKTOP=r2;return r4}r1=r2|0;if((_dsk_read(r3,r1,0,0,8,0)|0)==0){r5=(_memcmp(r1,10432,7)|0)==0|0}else{r5=0}_fclose(r3);r4=r5;STACKTOP=r2;return r4}function _dsk_pce_open_fp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;STACKTOP=STACKTOP+32|0;r4=r3|0;if((_fread(r4,1,32,r1)|0)!=32){r5=0;STACKTOP=r3;return r5}if((_dsk_get_uint32_be(r4,0)|0)!=1346981191){r5=0;STACKTOP=r3;return r5}if((_dsk_get_uint32_be(r4,4)|0)!=0){r5=0;STACKTOP=r3;return r5}if((_dsk_get_uint32_be(r4,28)|0)!=512){r5=0;STACKTOP=r3;return r5}r6=_dsk_get_uint32_be(r4,12);r7=_dsk_get_uint32_be(r4,16);r8=_dsk_get_uint32_be(r4,20);r9=_dsk_get_uint32_be(r4,24);r10=_malloc(80);if((r10|0)==0){r5=0;STACKTOP=r3;return r5}r11=r10;_dsk_init(r11,r10,r6,r7,r8,r9);_dsk_set_type(r11,3);_dsk_set_readonly(r11,r2);HEAP32[r10+68>>2]=r1;HEAP32[r10+4>>2]=686;HEAP32[r10+8>>2]=1072;HEAP32[r10+12>>2]=1200;HEAP32[r10+16>>2]=128;HEAP32[r10+20>>2]=202;HEAP32[r10+72>>2]=_dsk_get_uint32_be(r4,8);HEAP32[r10+76>>2]=_dsk_get_uint32_be(r4,28);r5=r11;STACKTOP=r3;return r5}function _dsk_pce_del(r1){var r2;r2=HEAP32[r1+64>>2];r1=HEAP32[r2+68>>2];if((r1|0)==0){_free(r2);return}_fclose(r1);_free(r2);return}function _dsk_pce_read(r1,r2,r3,r4){var r5,r6;r5=HEAP32[r1+64>>2];if((r4+r3|0)>>>0>HEAP32[r5+28>>2]>>>0){r6=1;return r6}r1=r3;r3=_i64Add(HEAP32[r5+72>>2],0,r1<<9|0>>>23,0<<9|r1>>>23);r1=r4;r6=(_dsk_read(HEAP32[r5+68>>2],r2,r3,tempRet0,r1<<9|0>>>23,0<<9|r1>>>23)|0)!=0|0;return r6}function _dsk_pce_write(r1,r2,r3,r4){var r5,r6;r5=HEAP32[r1+64>>2];if((HEAP8[r1+56|0]|0)!=0){r6=1;return r6}if((r4+r3|0)>>>0>HEAP32[r1+28>>2]>>>0){r6=1;return r6}r1=r3;r3=_i64Add(HEAP32[r5+72>>2],0,r1<<9|0>>>23,0<<9|r1>>>23);r1=r4;r4=r5+68|0;if((_dsk_write(HEAP32[r4>>2],r2,r3,tempRet0,r1<<9|0>>>23,0<<9|r1>>>23)|0)!=0){r6=1;return r6}_fflush(HEAP32[r4>>2]);r6=0;return r6}function _dsk_pce_get_msg(r1,r2,r3,r4){return 1}function _dsk_pce_set_msg(r1,r2,r3){return(_strcmp(r2,15928)|0)!=0|0}function _dsk_pce_open(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;if((r2|0)==0){r4=_fopen(r1,19968);if((r4|0)==0){r5=_fopen(r1,10224);r6=1;r3=5}else{r7=0;r8=r4}}else{r5=_fopen(r1,10224);r6=r2;r3=5}if(r3==5){if((r5|0)==0){r9=0;return r9}else{r7=r6;r8=r5}}r5=_dsk_pce_open_fp(r8,r7);if((r5|0)==0){_fclose(r8);r9=0;return r9}else{_dsk_set_fname(r5,r1);r9=r5;return r9}}function _dsk_pce_probe(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=_fopen(r1,10224);if((r3|0)==0){r4=0;STACKTOP=r2;return r4}r1=r2|0;if((_dsk_read(r3,r1,0,0,4,0)|0)==0){r5=(_dsk_get_uint32_be(r1,0)|0)==1346981191|0}else{r5=0}_fclose(r3);r4=r5;STACKTOP=r2;return r4}function _dsk_psi_read_chs(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12;r8=HEAP32[r1+68>>2];if((r8|0)==0){HEAP32[r3>>2]=0;r9=1;return r9}r1=_psi_img_get_sector(r8,r4,r5,r6,r7);if((r1|0)==0){HEAP32[r3>>2]=0;r9=1;return r9}r7=r1+20|0;r6=_psi_sct_get_alternate(r1,HEAP32[r7>>2]);if((r6|0)==0){HEAP32[r7>>2]=0;r10=r1}else{r10=r6}r6=HEAP32[r3>>2];r5=HEAPU16[r10+10>>1];if(r6>>>0>r5>>>0){HEAP32[r3>>2]=r5;r11=32;r12=r5}else{r11=0;r12=r6}if((r12|0)!=0){_memcpy(r2,HEAP32[r10+24>>2],r12)|0}r12=HEAP32[r10+12>>2];r10=r12<<2;r2=r12>>>2&2|r11|r10&4|r10&8|r10&16;if((HEAP32[r1>>2]|0)==0){r9=r2;return r9}HEAP32[r7>>2]=HEAP32[r7>>2]+1;r9=r2;return r9}function _dsk_psi_open_fp(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=_malloc(88);if((r4|0)==0){r5=0;return r5}r6=r4;_dsk_init(r6,r4,0,0,0,0);_dsk_set_type(r6,6);_dsk_set_readonly(r6,r3);HEAP32[r4+4>>2]=964;HEAP32[r4+8>>2]=1208;HEAP32[r4+12>>2]=836;HEAP32[r4+20>>2]=390;HEAP8[r4+72|0]=0;HEAP32[r4+76>>2]=2;HEAP32[r4+80>>2]=r2;HEAP32[r4+84>>2]=0;r3=_psi_load_fp(r1,r2);HEAP32[r4+68>>2]=r3;if((r3|0)==0){_dsk_psi_del(r6);r5=0;return r5}r4=HEAP16[r3>>1];r2=r4&65535;if(r4<<16>>16==0){r5=r6;return r5}r4=HEAP32[r3+4>>2];r3=0;r1=0;r7=0;while(1){r8=HEAP32[r4+(r7<<2)>>2];r9=HEAP16[r8+2>>1];r10=r9&65535;r11=r10+r3|0;if(r9<<16>>16==0){r12=r1}else{r9=HEAP32[r8+4>>2];r8=r1;r13=0;while(1){r14=HEAPU16[HEAP32[r9+(r13<<2)>>2]+2>>1]+r8|0;r15=r13+1|0;if(r15>>>0<r10>>>0){r8=r14;r13=r15}else{r12=r14;break}}}r13=r7+1|0;if(r13>>>0<r2>>>0){r3=r11;r1=r12;r7=r13}else{break}}if((r11|0)==0|(r12|0)==0){r5=r6;return r5}r7=(((((r11>>>0)/(r2>>>0)&-1)>>>1)+r11|0)>>>0)/(r2>>>0)&-1;r1=(((((r12>>>0)/(r11>>>0)&-1)>>>1)+r12|0)>>>0)/(r11>>>0)&-1;if((_dsk_set_geometry(r6,r12,r2,r7,r1)|0)!=0){r5=r6;return r5}_dsk_set_visible_chs(r6,r2,r7,r1);r5=r6;return r5}function _dsk_psi_del(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;r4=HEAP32[r1+64>>2];do{if((HEAP8[r4+72|0]|0)!=0){r5=HEAP32[_stderr>>2];r6=r1+24|0;_fprintf(r5,14352,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r6>>2],r2));STACKTOP=r2;r7=r4+84|0;if((HEAP32[r7>>2]|0)!=0){r8=r4+68|0;if(((HEAP32[r8>>2]|0)!=0?(_dsk_get_readonly(r4)|0)==0:0)?(_psi_save(HEAP32[r7>>2],HEAP32[r8>>2],HEAP32[r4+80>>2])|0)==0:0){break}}_fprintf(r5,13216,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r6>>2],r2));STACKTOP=r2}}while(0);r2=HEAP32[r4+68>>2];if((r2|0)==0){r9=r4+84|0;r10=r9;r11=HEAP32[r10>>2];_free(r11);_free(r4);STACKTOP=r3;return}_psi_img_del(r2);r9=r4+84|0;r10=r9;r11=HEAP32[r10>>2];_free(r11);_free(r4);STACKTOP=r3;return}function _dsk_psi_read(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r6;r8=r6+8;r9=r6+16;r10=r6+24;r11=HEAP32[r1+64>>2];r1=r11;r12=r11+68|0;if((r4|0)==0){r13=0;STACKTOP=r6;return r13}else{r14=r3;r15=r4;r16=r2}while(1){if((_psi_img_map_sector(HEAP32[r12>>2],r14,r7,r8,r9)|0)!=0){r13=1;r5=5;break}HEAP32[r10>>2]=512;r2=(_dsk_psi_read_chs(r1,r16,r10,HEAP32[r7>>2],HEAP32[r8>>2],HEAP32[r9>>2],1)|0)==0;if(!(r2&(HEAP32[r10>>2]|0)==512)){r13=1;r5=5;break}r2=r15-1|0;if((r2|0)==0){r13=0;r5=5;break}else{r14=r14+1|0;r15=r2;r16=r16+512|0}}if(r5==5){STACKTOP=r6;return r13}}function _dsk_psi_write(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+24|0;r7=r6;r8=r6+8;r9=r6+16;if((HEAP8[r1+56|0]|0)!=0){r10=1;STACKTOP=r6;return r10}r11=HEAP32[r1+64>>2];r1=r11+68|0;r12=r11+56|0;if((r4|0)==0){r10=0;STACKTOP=r6;return r10}r13=r11+72|0;r11=r3;r3=r4;r4=r2;while(1){if((_psi_img_map_sector(HEAP32[r1>>2],r11,r7,r8,r9)|0)!=0){r10=1;r5=16;break}r2=HEAP32[r1>>2];if((r2|0)==0){r10=1;r5=16;break}if((HEAP8[r12]|0)!=0){r10=1;r5=16;break}r14=_psi_img_get_sector(r2,HEAP32[r7>>2],HEAP32[r8>>2],HEAP32[r9>>2],1);if((r14|0)==0){r10=1;r5=16;break}r2=r14+12|0;if((HEAP32[r2>>2]&8|0)!=0){r10=1;r5=16;break}HEAP8[r13]=1;r15=HEAP16[r14+10>>1];if((r15&65535)<512){if(r15<<16>>16==0){r16=0;r17=32}else{r18=r15&65535;r19=32;r5=11}}else{r18=512;r19=0;r5=11}if(r5==11){r5=0;_memcpy(HEAP32[r14+24>>2],r4,r18)|0;r16=r18;r17=r19}HEAP32[r2>>2]=HEAP32[r2>>2]&-3;r2=r14|0;r15=HEAP32[r2>>2];if((r15|0)!=0){_psi_sct_del(r15);HEAP32[r2>>2]=0;HEAP32[r14+20>>2]=0}if(!((r17|0)==0&(r16|0)==512)){r10=1;r5=16;break}r14=r3-1|0;if((r14|0)==0){r10=0;r5=16;break}else{r11=r11+1|0;r3=r14;r4=r4+512|0}}if(r5==16){STACKTOP=r6;return r10}}function _dsk_psi_set_msg(r1,r2,r3){var r4;r3=HEAP32[r1+64>>2];if((_strcmp(r2,15880)|0)!=0){r4=1;return r4}r2=r3+84|0;if((HEAP32[r2>>2]|0)==0){r4=1;return r4}r1=r3+68|0;if((HEAP32[r1>>2]|0)==0){r4=1;return r4}if((_dsk_get_readonly(r3)|0)!=0){r4=1;return r4}if((_psi_save(HEAP32[r2>>2],HEAP32[r1>>2],HEAP32[r3+80>>2])|0)!=0){r4=1;return r4}HEAP8[r3+72|0]=0;r4=0;return r4}function _dsk_psi_open(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;if((r2|0)==0){r5=_psi_probe(r1);if((r5|0)==0){r6=_psi_guess_type(r1);if((r6|0)==0){r7=0;return r7}else{r8=r6}}else{r8=r5}}else{r8=r2}if((r3|0)==0){r2=_fopen(r1,19896);if((r2|0)==0){r9=_fopen(r1,10160);r10=1;r4=8}else{r11=0;r12=r2}}else{r9=_fopen(r1,10160);r10=r3;r4=8}if(r4==8){if((r9|0)==0){r7=0;return r7}else{r11=r10;r12=r9}}r9=_dsk_psi_open_fp(r12,r8,r11);_fclose(r12);if((r9|0)==0){r7=0;return r7}r12=HEAP32[r9+64>>2];r11=_malloc(_strlen(r1)+1|0);HEAP32[r12+84>>2]=r11;if((r11|0)!=0){_strcpy(r11,r1)}_dsk_set_fname(r9,r1);r7=r9;return r7}function _dsk_psi_probe(r1){return _psi_probe(r1)}









function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[32136>>2];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=32176+(r8<<2)|0;r10=32176+(r8+2<<2)|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)!=(r12|0)){if(r12>>>0<HEAP32[32152>>2]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}else{HEAP32[32136>>2]=r5&~(1<<r7)}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0>HEAP32[32144>>2]>>>0){if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r15=r13>>>(r9>>>0);r13=r15>>>1&2;r16=r15>>>(r13>>>0);r15=r16>>>1&1;r17=(r10|r12|r9|r13|r15)+(r16>>>(r15>>>0))|0;r15=r17<<1;r16=32176+(r15<<2)|0;r13=32176+(r15+2<<2)|0;r15=HEAP32[r13>>2];r9=r15+8|0;r12=HEAP32[r9>>2];do{if((r16|0)!=(r12|0)){if(r12>>>0<HEAP32[32152>>2]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r15|0)){HEAP32[r10>>2]=r16;HEAP32[r13>>2]=r12;break}else{_abort()}}else{HEAP32[32136>>2]=r5&~(1<<r17)}}while(0);r5=r17<<3;r12=r5-r3|0;HEAP32[r15+4>>2]=r3|3;r13=r15;r16=r13+r3|0;HEAP32[r13+(r3|4)>>2]=r12|1;HEAP32[r13+r5>>2]=r12;r5=HEAP32[32144>>2];if((r5|0)!=0){r13=HEAP32[32156>>2];r4=r5>>>3;r5=r4<<1;r6=32176+(r5<<2)|0;r11=HEAP32[32136>>2];r8=1<<r4;if((r11&r8|0)!=0){r4=32176+(r5+2<<2)|0;r7=HEAP32[r4>>2];if(r7>>>0<HEAP32[32152>>2]>>>0){_abort()}else{r18=r7;r19=r4}}else{HEAP32[32136>>2]=r11|r8;r18=r6;r19=32176+(r5+2<<2)|0}HEAP32[r19>>2]=r13;HEAP32[r18+12>>2]=r13;HEAP32[r13+8>>2]=r18;HEAP32[r13+12>>2]=r6}HEAP32[32144>>2]=r12;HEAP32[32156>>2]=r16;r14=r9;return r14}r16=HEAP32[32140>>2];if((r16|0)!=0){r12=(r16&-r16)-1|0;r16=r12>>>12&16;r6=r12>>>(r16>>>0);r12=r6>>>5&8;r13=r6>>>(r12>>>0);r6=r13>>>2&4;r5=r13>>>(r6>>>0);r13=r5>>>1&2;r8=r5>>>(r13>>>0);r5=r8>>>1&1;r11=HEAP32[32440+((r12|r16|r6|r13|r5)+(r8>>>(r5>>>0))<<2)>>2];r5=r11;r8=r11;r13=(HEAP32[r11+4>>2]&-8)-r3|0;while(1){r11=HEAP32[r5+16>>2];if((r11|0)==0){r6=HEAP32[r5+20>>2];if((r6|0)==0){break}else{r20=r6}}else{r20=r11}r11=(HEAP32[r20+4>>2]&-8)-r3|0;r6=r11>>>0<r13>>>0;r5=r20;r8=r6?r20:r8;r13=r6?r11:r13}r5=r8;r9=HEAP32[32152>>2];if(r5>>>0<r9>>>0){_abort()}r15=r5+r3|0;r17=r15;if(r5>>>0>=r15>>>0){_abort()}r15=HEAP32[r8+24>>2];r11=HEAP32[r8+12>>2];do{if((r11|0)==(r8|0)){r6=r8+20|0;r16=HEAP32[r6>>2];if((r16|0)==0){r12=r8+16|0;r4=HEAP32[r12>>2];if((r4|0)==0){r21=0;break}else{r22=r4;r23=r12}}else{r22=r16;r23=r6}while(1){r6=r22+20|0;r16=HEAP32[r6>>2];if((r16|0)!=0){r22=r16;r23=r6;continue}r6=r22+16|0;r16=HEAP32[r6>>2];if((r16|0)==0){break}else{r22=r16;r23=r6}}if(r23>>>0<r9>>>0){_abort()}else{HEAP32[r23>>2]=0;r21=r22;break}}else{r6=HEAP32[r8+8>>2];if(r6>>>0<r9>>>0){_abort()}r16=r6+12|0;if((HEAP32[r16>>2]|0)!=(r8|0)){_abort()}r12=r11+8|0;if((HEAP32[r12>>2]|0)==(r8|0)){HEAP32[r16>>2]=r11;HEAP32[r12>>2]=r6;r21=r11;break}else{_abort()}}}while(0);do{if((r15|0)!=0){r11=HEAP32[r8+28>>2];r9=32440+(r11<<2)|0;if((r8|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r21;if((r21|0)==0){HEAP32[32140>>2]=HEAP32[32140>>2]&~(1<<r11);break}}else{if(r15>>>0<HEAP32[32152>>2]>>>0){_abort()}r11=r15+16|0;if((HEAP32[r11>>2]|0)==(r8|0)){HEAP32[r11>>2]=r21}else{HEAP32[r15+20>>2]=r21}if((r21|0)==0){break}}if(r21>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r21+24>>2]=r15;r11=HEAP32[r8+16>>2];do{if((r11|0)!=0){if(r11>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r21+16>>2]=r11;HEAP32[r11+24>>2]=r21;break}}}while(0);r11=HEAP32[r8+20>>2];if((r11|0)!=0){if(r11>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r21+20>>2]=r11;HEAP32[r11+24>>2]=r21;break}}}}while(0);if(r13>>>0<16){r15=r13+r3|0;HEAP32[r8+4>>2]=r15|3;r11=r5+(r15+4)|0;HEAP32[r11>>2]=HEAP32[r11>>2]|1}else{HEAP32[r8+4>>2]=r3|3;HEAP32[r5+(r3|4)>>2]=r13|1;HEAP32[r5+(r13+r3)>>2]=r13;r11=HEAP32[32144>>2];if((r11|0)!=0){r15=HEAP32[32156>>2];r9=r11>>>3;r11=r9<<1;r6=32176+(r11<<2)|0;r12=HEAP32[32136>>2];r16=1<<r9;if((r12&r16|0)!=0){r9=32176+(r11+2<<2)|0;r4=HEAP32[r9>>2];if(r4>>>0<HEAP32[32152>>2]>>>0){_abort()}else{r24=r4;r25=r9}}else{HEAP32[32136>>2]=r12|r16;r24=r6;r25=32176+(r11+2<<2)|0}HEAP32[r25>>2]=r15;HEAP32[r24+12>>2]=r15;HEAP32[r15+8>>2]=r24;HEAP32[r15+12>>2]=r6}HEAP32[32144>>2]=r13;HEAP32[32156>>2]=r17}r14=r8+8|0;return r14}else{r26=r3}}else{r26=r3}}else{if(r1>>>0<=4294967231){r6=r1+11|0;r15=r6&-8;r11=HEAP32[32140>>2];if((r11|0)!=0){r16=-r15|0;r12=r6>>>8;if((r12|0)!=0){if(r15>>>0>16777215){r27=31}else{r6=(r12+1048320|0)>>>16&8;r9=r12<<r6;r12=(r9+520192|0)>>>16&4;r4=r9<<r12;r9=(r4+245760|0)>>>16&2;r7=14-(r12|r6|r9)+(r4<<r9>>>15)|0;r27=r15>>>((r7+7|0)>>>0)&1|r7<<1}}else{r27=0}r7=HEAP32[32440+(r27<<2)>>2];L126:do{if((r7|0)==0){r28=0;r29=r16;r30=0}else{if((r27|0)==31){r31=0}else{r31=25-(r27>>>1)|0}r9=0;r4=r16;r6=r7;r12=r15<<r31;r10=0;while(1){r32=HEAP32[r6+4>>2]&-8;r33=r32-r15|0;if(r33>>>0<r4>>>0){if((r32|0)==(r15|0)){r28=r6;r29=r33;r30=r6;break L126}else{r34=r6;r35=r33}}else{r34=r9;r35=r4}r33=HEAP32[r6+20>>2];r32=HEAP32[r6+16+(r12>>>31<<2)>>2];r36=(r33|0)==0|(r33|0)==(r32|0)?r10:r33;if((r32|0)==0){r28=r34;r29=r35;r30=r36;break}else{r9=r34;r4=r35;r6=r32;r12=r12<<1;r10=r36}}}}while(0);if((r30|0)==0&(r28|0)==0){r7=2<<r27;r16=r11&(r7|-r7);if((r16|0)==0){r26=r15;break}r7=(r16&-r16)-1|0;r16=r7>>>12&16;r8=r7>>>(r16>>>0);r7=r8>>>5&8;r17=r8>>>(r7>>>0);r8=r17>>>2&4;r13=r17>>>(r8>>>0);r17=r13>>>1&2;r5=r13>>>(r17>>>0);r13=r5>>>1&1;r37=HEAP32[32440+((r7|r16|r8|r17|r13)+(r5>>>(r13>>>0))<<2)>>2]}else{r37=r30}if((r37|0)==0){r38=r29;r39=r28}else{r13=r37;r5=r29;r17=r28;while(1){r8=(HEAP32[r13+4>>2]&-8)-r15|0;r16=r8>>>0<r5>>>0;r7=r16?r8:r5;r8=r16?r13:r17;r16=HEAP32[r13+16>>2];if((r16|0)!=0){r13=r16;r5=r7;r17=r8;continue}r16=HEAP32[r13+20>>2];if((r16|0)==0){r38=r7;r39=r8;break}else{r13=r16;r5=r7;r17=r8}}}if((r39|0)!=0?r38>>>0<(HEAP32[32144>>2]-r15|0)>>>0:0){r17=r39;r5=HEAP32[32152>>2];if(r17>>>0<r5>>>0){_abort()}r13=r17+r15|0;r11=r13;if(r17>>>0>=r13>>>0){_abort()}r8=HEAP32[r39+24>>2];r7=HEAP32[r39+12>>2];do{if((r7|0)==(r39|0)){r16=r39+20|0;r10=HEAP32[r16>>2];if((r10|0)==0){r12=r39+16|0;r6=HEAP32[r12>>2];if((r6|0)==0){r40=0;break}else{r41=r6;r42=r12}}else{r41=r10;r42=r16}while(1){r16=r41+20|0;r10=HEAP32[r16>>2];if((r10|0)!=0){r41=r10;r42=r16;continue}r16=r41+16|0;r10=HEAP32[r16>>2];if((r10|0)==0){break}else{r41=r10;r42=r16}}if(r42>>>0<r5>>>0){_abort()}else{HEAP32[r42>>2]=0;r40=r41;break}}else{r16=HEAP32[r39+8>>2];if(r16>>>0<r5>>>0){_abort()}r10=r16+12|0;if((HEAP32[r10>>2]|0)!=(r39|0)){_abort()}r12=r7+8|0;if((HEAP32[r12>>2]|0)==(r39|0)){HEAP32[r10>>2]=r7;HEAP32[r12>>2]=r16;r40=r7;break}else{_abort()}}}while(0);do{if((r8|0)!=0){r7=HEAP32[r39+28>>2];r5=32440+(r7<<2)|0;if((r39|0)==(HEAP32[r5>>2]|0)){HEAP32[r5>>2]=r40;if((r40|0)==0){HEAP32[32140>>2]=HEAP32[32140>>2]&~(1<<r7);break}}else{if(r8>>>0<HEAP32[32152>>2]>>>0){_abort()}r7=r8+16|0;if((HEAP32[r7>>2]|0)==(r39|0)){HEAP32[r7>>2]=r40}else{HEAP32[r8+20>>2]=r40}if((r40|0)==0){break}}if(r40>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r40+24>>2]=r8;r7=HEAP32[r39+16>>2];do{if((r7|0)!=0){if(r7>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r40+16>>2]=r7;HEAP32[r7+24>>2]=r40;break}}}while(0);r7=HEAP32[r39+20>>2];if((r7|0)!=0){if(r7>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r40+20>>2]=r7;HEAP32[r7+24>>2]=r40;break}}}}while(0);L204:do{if(r38>>>0>=16){HEAP32[r39+4>>2]=r15|3;HEAP32[r17+(r15|4)>>2]=r38|1;HEAP32[r17+(r38+r15)>>2]=r38;r8=r38>>>3;if(r38>>>0<256){r7=r8<<1;r5=32176+(r7<<2)|0;r16=HEAP32[32136>>2];r12=1<<r8;if((r16&r12|0)!=0){r8=32176+(r7+2<<2)|0;r10=HEAP32[r8>>2];if(r10>>>0<HEAP32[32152>>2]>>>0){_abort()}else{r43=r10;r44=r8}}else{HEAP32[32136>>2]=r16|r12;r43=r5;r44=32176+(r7+2<<2)|0}HEAP32[r44>>2]=r11;HEAP32[r43+12>>2]=r11;HEAP32[r17+(r15+8)>>2]=r43;HEAP32[r17+(r15+12)>>2]=r5;break}r5=r13;r7=r38>>>8;if((r7|0)!=0){if(r38>>>0>16777215){r45=31}else{r12=(r7+1048320|0)>>>16&8;r16=r7<<r12;r7=(r16+520192|0)>>>16&4;r8=r16<<r7;r16=(r8+245760|0)>>>16&2;r10=14-(r7|r12|r16)+(r8<<r16>>>15)|0;r45=r38>>>((r10+7|0)>>>0)&1|r10<<1}}else{r45=0}r10=32440+(r45<<2)|0;HEAP32[r17+(r15+28)>>2]=r45;HEAP32[r17+(r15+20)>>2]=0;HEAP32[r17+(r15+16)>>2]=0;r16=HEAP32[32140>>2];r8=1<<r45;if((r16&r8|0)==0){HEAP32[32140>>2]=r16|r8;HEAP32[r10>>2]=r5;HEAP32[r17+(r15+24)>>2]=r10;HEAP32[r17+(r15+12)>>2]=r5;HEAP32[r17+(r15+8)>>2]=r5;break}r8=HEAP32[r10>>2];if((r45|0)==31){r46=0}else{r46=25-(r45>>>1)|0}L225:do{if((HEAP32[r8+4>>2]&-8|0)!=(r38|0)){r10=r8;r16=r38<<r46;while(1){r47=r10+16+(r16>>>31<<2)|0;r12=HEAP32[r47>>2];if((r12|0)==0){break}if((HEAP32[r12+4>>2]&-8|0)==(r38|0)){r48=r12;break L225}else{r10=r12;r16=r16<<1}}if(r47>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r47>>2]=r5;HEAP32[r17+(r15+24)>>2]=r10;HEAP32[r17+(r15+12)>>2]=r5;HEAP32[r17+(r15+8)>>2]=r5;break L204}}else{r48=r8}}while(0);r8=r48+8|0;r16=HEAP32[r8>>2];r12=HEAP32[32152>>2];if(r48>>>0<r12>>>0){_abort()}if(r16>>>0<r12>>>0){_abort()}else{HEAP32[r16+12>>2]=r5;HEAP32[r8>>2]=r5;HEAP32[r17+(r15+8)>>2]=r16;HEAP32[r17+(r15+12)>>2]=r48;HEAP32[r17+(r15+24)>>2]=0;break}}else{r16=r38+r15|0;HEAP32[r39+4>>2]=r16|3;r8=r17+(r16+4)|0;HEAP32[r8>>2]=HEAP32[r8>>2]|1}}while(0);r14=r39+8|0;return r14}else{r26=r15}}else{r26=r15}}else{r26=-1}}}while(0);r39=HEAP32[32144>>2];if(r26>>>0<=r39>>>0){r38=r39-r26|0;r48=HEAP32[32156>>2];if(r38>>>0>15){r47=r48;HEAP32[32156>>2]=r47+r26;HEAP32[32144>>2]=r38;HEAP32[r47+(r26+4)>>2]=r38|1;HEAP32[r47+r39>>2]=r38;HEAP32[r48+4>>2]=r26|3}else{HEAP32[32144>>2]=0;HEAP32[32156>>2]=0;HEAP32[r48+4>>2]=r39|3;r38=r48+(r39+4)|0;HEAP32[r38>>2]=HEAP32[r38>>2]|1}r14=r48+8|0;return r14}r48=HEAP32[32148>>2];if(r26>>>0<r48>>>0){r38=r48-r26|0;HEAP32[32148>>2]=r38;r48=HEAP32[32160>>2];r39=r48;HEAP32[32160>>2]=r39+r26;HEAP32[r39+(r26+4)>>2]=r38|1;HEAP32[r48+4>>2]=r26|3;r14=r48+8|0;return r14}do{if((HEAP32[31936>>2]|0)==0){r48=_sysconf(30);if((r48-1&r48|0)==0){HEAP32[31944>>2]=r48;HEAP32[31940>>2]=r48;HEAP32[31948>>2]=-1;HEAP32[31952>>2]=-1;HEAP32[31956>>2]=0;HEAP32[32580>>2]=0;HEAP32[31936>>2]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);r48=r26+48|0;r38=HEAP32[31944>>2];r39=r26+47|0;r47=r38+r39|0;r46=-r38|0;r38=r47&r46;if(r38>>>0<=r26>>>0){r14=0;return r14}r45=HEAP32[32576>>2];if((r45|0)!=0){r43=HEAP32[32568>>2];r44=r43+r38|0;if(r44>>>0<=r43>>>0|r44>>>0>r45>>>0){r14=0;return r14}}L269:do{if((HEAP32[32580>>2]&4|0)==0){r45=HEAP32[32160>>2];L271:do{if((r45|0)!=0){r44=r45;r43=32584;while(1){r49=r43|0;r40=HEAP32[r49>>2];if(r40>>>0<=r44>>>0){r50=r43+4|0;if((r40+HEAP32[r50>>2]|0)>>>0>r44>>>0){break}}r40=HEAP32[r43+8>>2];if((r40|0)==0){r2=182;break L271}else{r43=r40}}if((r43|0)!=0){r44=r47-HEAP32[32148>>2]&r46;if(r44>>>0<2147483647){r5=_sbrk(r44);r40=(r5|0)==(HEAP32[r49>>2]+HEAP32[r50>>2]|0);r51=r40?r5:-1;r52=r40?r44:0;r53=r5;r54=r44;r2=191}else{r55=0}}else{r2=182}}else{r2=182}}while(0);do{if(r2==182){r45=_sbrk(0);if((r45|0)!=-1){r15=r45;r44=HEAP32[31940>>2];r5=r44-1|0;if((r5&r15|0)==0){r56=r38}else{r56=r38-r15+(r5+r15&-r44)|0}r44=HEAP32[32568>>2];r15=r44+r56|0;if(r56>>>0>r26>>>0&r56>>>0<2147483647){r5=HEAP32[32576>>2];if((r5|0)!=0?r15>>>0<=r44>>>0|r15>>>0>r5>>>0:0){r55=0;break}r5=_sbrk(r56);r15=(r5|0)==(r45|0);r51=r15?r45:-1;r52=r15?r56:0;r53=r5;r54=r56;r2=191}else{r55=0}}else{r55=0}}}while(0);L291:do{if(r2==191){r5=-r54|0;if((r51|0)!=-1){r57=r52;r58=r51;r2=202;break L269}do{if((r53|0)!=-1&r54>>>0<2147483647&r54>>>0<r48>>>0){r15=HEAP32[31944>>2];r45=r39-r54+r15&-r15;if(r45>>>0<2147483647){if((_sbrk(r45)|0)==-1){_sbrk(r5);r55=r52;break L291}else{r59=r45+r54|0;break}}else{r59=r54}}else{r59=r54}}while(0);if((r53|0)==-1){r55=r52}else{r57=r59;r58=r53;r2=202;break L269}}}while(0);HEAP32[32580>>2]=HEAP32[32580>>2]|4;r60=r55;r2=199}else{r60=0;r2=199}}while(0);if(r2==199){if(r38>>>0<2147483647){r55=_sbrk(r38);r38=_sbrk(0);if((r38|0)!=-1&(r55|0)!=-1&r55>>>0<r38>>>0){r53=r38-r55|0;r38=r53>>>0>(r26+40|0)>>>0;if(r38){r57=r38?r53:r60;r58=r55;r2=202}}}}if(r2==202){r55=HEAP32[32568>>2]+r57|0;HEAP32[32568>>2]=r55;if(r55>>>0>HEAP32[32572>>2]>>>0){HEAP32[32572>>2]=r55}r55=HEAP32[32160>>2];L311:do{if((r55|0)!=0){r60=32584;while(1){r61=HEAP32[r60>>2];r62=r60+4|0;r63=HEAP32[r62>>2];if((r58|0)==(r61+r63|0)){r2=214;break}r53=HEAP32[r60+8>>2];if((r53|0)==0){break}else{r60=r53}}if(r2==214?(HEAP32[r60+12>>2]&8|0)==0:0){r53=r55;if(r53>>>0>=r61>>>0&r53>>>0<r58>>>0){HEAP32[r62>>2]=r63+r57;r38=HEAP32[32148>>2]+r57|0;r59=r55+8|0;if((r59&7|0)==0){r64=0}else{r64=-r59&7}r59=r38-r64|0;HEAP32[32160>>2]=r53+r64;HEAP32[32148>>2]=r59;HEAP32[r53+(r64+4)>>2]=r59|1;HEAP32[r53+(r38+4)>>2]=40;HEAP32[32164>>2]=HEAP32[31952>>2];break}}if(r58>>>0<HEAP32[32152>>2]>>>0){HEAP32[32152>>2]=r58}r38=r58+r57|0;r53=32584;while(1){r65=r53|0;if((HEAP32[r65>>2]|0)==(r38|0)){r2=224;break}r59=HEAP32[r53+8>>2];if((r59|0)==0){break}else{r53=r59}}if(r2==224?(HEAP32[r53+12>>2]&8|0)==0:0){HEAP32[r65>>2]=r58;r38=r53+4|0;HEAP32[r38>>2]=HEAP32[r38>>2]+r57;r38=r58+8|0;if((r38&7|0)==0){r66=0}else{r66=-r38&7}r38=r58+(r57+8)|0;if((r38&7|0)==0){r67=0}else{r67=-r38&7}r38=r58+(r67+r57)|0;r60=r38;r59=r66+r26|0;r52=r58+r59|0;r54=r52;r39=r38-(r58+r66)-r26|0;HEAP32[r58+(r66+4)>>2]=r26|3;L348:do{if((r60|0)!=(HEAP32[32160>>2]|0)){if((r60|0)==(HEAP32[32156>>2]|0)){r48=HEAP32[32144>>2]+r39|0;HEAP32[32144>>2]=r48;HEAP32[32156>>2]=r54;HEAP32[r58+(r59+4)>>2]=r48|1;HEAP32[r58+(r48+r59)>>2]=r48;break}r48=r57+4|0;r51=HEAP32[r58+(r48+r67)>>2];if((r51&3|0)==1){r56=r51&-8;r50=r51>>>3;do{if(r51>>>0>=256){r49=r38;r46=HEAP32[r58+((r67|24)+r57)>>2];r47=HEAP32[r58+(r57+12+r67)>>2];do{if((r47|0)==(r49|0)){r5=r67|16;r43=r58+(r48+r5)|0;r45=HEAP32[r43>>2];if((r45|0)==0){r15=r58+(r5+r57)|0;r5=HEAP32[r15>>2];if((r5|0)==0){r68=0;break}else{r69=r5;r70=r15}}else{r69=r45;r70=r43}while(1){r43=r69+20|0;r45=HEAP32[r43>>2];if((r45|0)!=0){r69=r45;r70=r43;continue}r43=r69+16|0;r45=HEAP32[r43>>2];if((r45|0)==0){break}else{r69=r45;r70=r43}}if(r70>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r70>>2]=0;r68=r69;break}}else{r43=HEAP32[r58+((r67|8)+r57)>>2];if(r43>>>0<HEAP32[32152>>2]>>>0){_abort()}r45=r43+12|0;if((HEAP32[r45>>2]|0)!=(r49|0)){_abort()}r15=r47+8|0;if((HEAP32[r15>>2]|0)==(r49|0)){HEAP32[r45>>2]=r47;HEAP32[r15>>2]=r43;r68=r47;break}else{_abort()}}}while(0);if((r46|0)!=0){r47=HEAP32[r58+(r57+28+r67)>>2];r10=32440+(r47<<2)|0;if((r49|0)==(HEAP32[r10>>2]|0)){HEAP32[r10>>2]=r68;if((r68|0)==0){HEAP32[32140>>2]=HEAP32[32140>>2]&~(1<<r47);break}}else{if(r46>>>0<HEAP32[32152>>2]>>>0){_abort()}r47=r46+16|0;if((HEAP32[r47>>2]|0)==(r49|0)){HEAP32[r47>>2]=r68}else{HEAP32[r46+20>>2]=r68}if((r68|0)==0){break}}if(r68>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r68+24>>2]=r46;r47=r67|16;r10=HEAP32[r58+(r47+r57)>>2];do{if((r10|0)!=0){if(r10>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r68+16>>2]=r10;HEAP32[r10+24>>2]=r68;break}}}while(0);r10=HEAP32[r58+(r48+r47)>>2];if((r10|0)!=0){if(r10>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r68+20>>2]=r10;HEAP32[r10+24>>2]=r68;break}}}}else{r10=HEAP32[r58+((r67|8)+r57)>>2];r46=HEAP32[r58+(r57+12+r67)>>2];r49=32176+(r50<<1<<2)|0;if((r10|0)!=(r49|0)){if(r10>>>0<HEAP32[32152>>2]>>>0){_abort()}if((HEAP32[r10+12>>2]|0)!=(r60|0)){_abort()}}if((r46|0)==(r10|0)){HEAP32[32136>>2]=HEAP32[32136>>2]&~(1<<r50);break}if((r46|0)!=(r49|0)){if(r46>>>0<HEAP32[32152>>2]>>>0){_abort()}r49=r46+8|0;if((HEAP32[r49>>2]|0)==(r60|0)){r71=r49}else{_abort()}}else{r71=r46+8|0}HEAP32[r10+12>>2]=r46;HEAP32[r71>>2]=r10}}while(0);r72=r58+((r56|r67)+r57)|0;r73=r56+r39|0}else{r72=r60;r73=r39}r50=r72+4|0;HEAP32[r50>>2]=HEAP32[r50>>2]&-2;HEAP32[r58+(r59+4)>>2]=r73|1;HEAP32[r58+(r73+r59)>>2]=r73;r50=r73>>>3;if(r73>>>0<256){r48=r50<<1;r51=32176+(r48<<2)|0;r10=HEAP32[32136>>2];r46=1<<r50;if((r10&r46|0)!=0){r50=32176+(r48+2<<2)|0;r49=HEAP32[r50>>2];if(r49>>>0<HEAP32[32152>>2]>>>0){_abort()}else{r74=r49;r75=r50}}else{HEAP32[32136>>2]=r10|r46;r74=r51;r75=32176+(r48+2<<2)|0}HEAP32[r75>>2]=r54;HEAP32[r74+12>>2]=r54;HEAP32[r58+(r59+8)>>2]=r74;HEAP32[r58+(r59+12)>>2]=r51;break}r51=r52;r48=r73>>>8;if((r48|0)!=0){if(r73>>>0>16777215){r76=31}else{r46=(r48+1048320|0)>>>16&8;r10=r48<<r46;r48=(r10+520192|0)>>>16&4;r50=r10<<r48;r10=(r50+245760|0)>>>16&2;r49=14-(r48|r46|r10)+(r50<<r10>>>15)|0;r76=r73>>>((r49+7|0)>>>0)&1|r49<<1}}else{r76=0}r49=32440+(r76<<2)|0;HEAP32[r58+(r59+28)>>2]=r76;HEAP32[r58+(r59+20)>>2]=0;HEAP32[r58+(r59+16)>>2]=0;r10=HEAP32[32140>>2];r50=1<<r76;if((r10&r50|0)==0){HEAP32[32140>>2]=r10|r50;HEAP32[r49>>2]=r51;HEAP32[r58+(r59+24)>>2]=r49;HEAP32[r58+(r59+12)>>2]=r51;HEAP32[r58+(r59+8)>>2]=r51;break}r50=HEAP32[r49>>2];if((r76|0)==31){r77=0}else{r77=25-(r76>>>1)|0}L445:do{if((HEAP32[r50+4>>2]&-8|0)!=(r73|0)){r49=r50;r10=r73<<r77;while(1){r78=r49+16+(r10>>>31<<2)|0;r46=HEAP32[r78>>2];if((r46|0)==0){break}if((HEAP32[r46+4>>2]&-8|0)==(r73|0)){r79=r46;break L445}else{r49=r46;r10=r10<<1}}if(r78>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r78>>2]=r51;HEAP32[r58+(r59+24)>>2]=r49;HEAP32[r58+(r59+12)>>2]=r51;HEAP32[r58+(r59+8)>>2]=r51;break L348}}else{r79=r50}}while(0);r50=r79+8|0;r56=HEAP32[r50>>2];r10=HEAP32[32152>>2];if(r79>>>0<r10>>>0){_abort()}if(r56>>>0<r10>>>0){_abort()}else{HEAP32[r56+12>>2]=r51;HEAP32[r50>>2]=r51;HEAP32[r58+(r59+8)>>2]=r56;HEAP32[r58+(r59+12)>>2]=r79;HEAP32[r58+(r59+24)>>2]=0;break}}else{r56=HEAP32[32148>>2]+r39|0;HEAP32[32148>>2]=r56;HEAP32[32160>>2]=r54;HEAP32[r58+(r59+4)>>2]=r56|1}}while(0);r14=r58+(r66|8)|0;return r14}r59=r55;r54=32584;while(1){r80=HEAP32[r54>>2];if(r80>>>0<=r59>>>0){r81=HEAP32[r54+4>>2];r82=r80+r81|0;if(r82>>>0>r59>>>0){break}}r54=HEAP32[r54+8>>2]}r54=r80+(r81-39)|0;if((r54&7|0)==0){r83=0}else{r83=-r54&7}r54=r80+(r81-47+r83)|0;r39=r54>>>0<(r55+16|0)>>>0?r59:r54;r54=r39+8|0;r52=r58+8|0;if((r52&7|0)==0){r84=0}else{r84=-r52&7}r52=r57-40-r84|0;HEAP32[32160>>2]=r58+r84;HEAP32[32148>>2]=r52;HEAP32[r58+(r84+4)>>2]=r52|1;HEAP32[r58+(r57-36)>>2]=40;HEAP32[32164>>2]=HEAP32[31952>>2];HEAP32[r39+4>>2]=27;HEAP32[r54>>2]=HEAP32[32584>>2];HEAP32[r54+4>>2]=HEAP32[32588>>2];HEAP32[r54+8>>2]=HEAP32[32592>>2];HEAP32[r54+12>>2]=HEAP32[32596>>2];HEAP32[32584>>2]=r58;HEAP32[32588>>2]=r57;HEAP32[32596>>2]=0;HEAP32[32592>>2]=r54;r54=r39+28|0;HEAP32[r54>>2]=7;if((r39+32|0)>>>0<r82>>>0){r52=r54;while(1){r54=r52+4|0;HEAP32[r54>>2]=7;if((r52+8|0)>>>0<r82>>>0){r52=r54}else{break}}}if((r39|0)!=(r59|0)){r52=r39-r55|0;r54=r59+(r52+4)|0;HEAP32[r54>>2]=HEAP32[r54>>2]&-2;HEAP32[r55+4>>2]=r52|1;HEAP32[r59+r52>>2]=r52;r54=r52>>>3;if(r52>>>0<256){r60=r54<<1;r38=32176+(r60<<2)|0;r53=HEAP32[32136>>2];r56=1<<r54;if((r53&r56|0)!=0){r54=32176+(r60+2<<2)|0;r50=HEAP32[r54>>2];if(r50>>>0<HEAP32[32152>>2]>>>0){_abort()}else{r85=r50;r86=r54}}else{HEAP32[32136>>2]=r53|r56;r85=r38;r86=32176+(r60+2<<2)|0}HEAP32[r86>>2]=r55;HEAP32[r85+12>>2]=r55;HEAP32[r55+8>>2]=r85;HEAP32[r55+12>>2]=r38;break}r38=r55;r60=r52>>>8;if((r60|0)!=0){if(r52>>>0>16777215){r87=31}else{r56=(r60+1048320|0)>>>16&8;r53=r60<<r56;r60=(r53+520192|0)>>>16&4;r54=r53<<r60;r53=(r54+245760|0)>>>16&2;r50=14-(r60|r56|r53)+(r54<<r53>>>15)|0;r87=r52>>>((r50+7|0)>>>0)&1|r50<<1}}else{r87=0}r50=32440+(r87<<2)|0;HEAP32[r55+28>>2]=r87;HEAP32[r55+20>>2]=0;HEAP32[r55+16>>2]=0;r53=HEAP32[32140>>2];r54=1<<r87;if((r53&r54|0)==0){HEAP32[32140>>2]=r53|r54;HEAP32[r50>>2]=r38;HEAP32[r55+24>>2]=r50;HEAP32[r55+12>>2]=r55;HEAP32[r55+8>>2]=r55;break}r54=HEAP32[r50>>2];if((r87|0)==31){r88=0}else{r88=25-(r87>>>1)|0}L499:do{if((HEAP32[r54+4>>2]&-8|0)!=(r52|0)){r50=r54;r53=r52<<r88;while(1){r89=r50+16+(r53>>>31<<2)|0;r56=HEAP32[r89>>2];if((r56|0)==0){break}if((HEAP32[r56+4>>2]&-8|0)==(r52|0)){r90=r56;break L499}else{r50=r56;r53=r53<<1}}if(r89>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r89>>2]=r38;HEAP32[r55+24>>2]=r50;HEAP32[r55+12>>2]=r55;HEAP32[r55+8>>2]=r55;break L311}}else{r90=r54}}while(0);r54=r90+8|0;r52=HEAP32[r54>>2];r59=HEAP32[32152>>2];if(r90>>>0<r59>>>0){_abort()}if(r52>>>0<r59>>>0){_abort()}else{HEAP32[r52+12>>2]=r38;HEAP32[r54>>2]=r38;HEAP32[r55+8>>2]=r52;HEAP32[r55+12>>2]=r90;HEAP32[r55+24>>2]=0;break}}}else{r52=HEAP32[32152>>2];if((r52|0)==0|r58>>>0<r52>>>0){HEAP32[32152>>2]=r58}HEAP32[32584>>2]=r58;HEAP32[32588>>2]=r57;HEAP32[32596>>2]=0;HEAP32[32172>>2]=HEAP32[31936>>2];HEAP32[32168>>2]=-1;r52=0;while(1){r54=r52<<1;r59=32176+(r54<<2)|0;HEAP32[32176+(r54+3<<2)>>2]=r59;HEAP32[32176+(r54+2<<2)>>2]=r59;r59=r52+1|0;if(r59>>>0<32){r52=r59}else{break}}r52=r58+8|0;if((r52&7|0)==0){r91=0}else{r91=-r52&7}r52=r57-40-r91|0;HEAP32[32160>>2]=r58+r91;HEAP32[32148>>2]=r52;HEAP32[r58+(r91+4)>>2]=r52|1;HEAP32[r58+(r57-36)>>2]=40;HEAP32[32164>>2]=HEAP32[31952>>2]}}while(0);r57=HEAP32[32148>>2];if(r57>>>0>r26>>>0){r58=r57-r26|0;HEAP32[32148>>2]=r58;r57=HEAP32[32160>>2];r91=r57;HEAP32[32160>>2]=r91+r26;HEAP32[r91+(r26+4)>>2]=r58|1;HEAP32[r57+4>>2]=r26|3;r14=r57+8|0;return r14}}HEAP32[___errno_location()>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;if((r1|0)==0){return}r2=r1-8|0;r3=r2;r4=HEAP32[32152>>2];if(r2>>>0<r4>>>0){_abort()}r5=HEAP32[r1-4>>2];r6=r5&3;if((r6|0)==1){_abort()}r7=r5&-8;r8=r1+(r7-8)|0;r9=r8;do{if((r5&1|0)==0){r10=HEAP32[r2>>2];if((r6|0)==0){return}r11=-8-r10|0;r12=r1+r11|0;r13=r12;r14=r10+r7|0;if(r12>>>0<r4>>>0){_abort()}if((r13|0)==(HEAP32[32156>>2]|0)){r15=r1+(r7-4)|0;if((HEAP32[r15>>2]&3|0)!=3){r16=r13;r17=r14;break}HEAP32[32144>>2]=r14;HEAP32[r15>>2]=HEAP32[r15>>2]&-2;HEAP32[r1+(r11+4)>>2]=r14|1;HEAP32[r8>>2]=r14;return}r15=r10>>>3;if(r10>>>0<256){r10=HEAP32[r1+(r11+8)>>2];r18=HEAP32[r1+(r11+12)>>2];r19=32176+(r15<<1<<2)|0;if((r10|0)!=(r19|0)){if(r10>>>0<r4>>>0){_abort()}if((HEAP32[r10+12>>2]|0)!=(r13|0)){_abort()}}if((r18|0)==(r10|0)){HEAP32[32136>>2]=HEAP32[32136>>2]&~(1<<r15);r16=r13;r17=r14;break}if((r18|0)!=(r19|0)){if(r18>>>0<r4>>>0){_abort()}r19=r18+8|0;if((HEAP32[r19>>2]|0)==(r13|0)){r20=r19}else{_abort()}}else{r20=r18+8|0}HEAP32[r10+12>>2]=r18;HEAP32[r20>>2]=r10;r16=r13;r17=r14;break}r10=r12;r12=HEAP32[r1+(r11+24)>>2];r18=HEAP32[r1+(r11+12)>>2];do{if((r18|0)==(r10|0)){r19=r1+(r11+20)|0;r15=HEAP32[r19>>2];if((r15|0)==0){r21=r1+(r11+16)|0;r22=HEAP32[r21>>2];if((r22|0)==0){r23=0;break}else{r24=r22;r25=r21}}else{r24=r15;r25=r19}while(1){r19=r24+20|0;r15=HEAP32[r19>>2];if((r15|0)!=0){r24=r15;r25=r19;continue}r19=r24+16|0;r15=HEAP32[r19>>2];if((r15|0)==0){break}else{r24=r15;r25=r19}}if(r25>>>0<r4>>>0){_abort()}else{HEAP32[r25>>2]=0;r23=r24;break}}else{r19=HEAP32[r1+(r11+8)>>2];if(r19>>>0<r4>>>0){_abort()}r15=r19+12|0;if((HEAP32[r15>>2]|0)!=(r10|0)){_abort()}r21=r18+8|0;if((HEAP32[r21>>2]|0)==(r10|0)){HEAP32[r15>>2]=r18;HEAP32[r21>>2]=r19;r23=r18;break}else{_abort()}}}while(0);if((r12|0)!=0){r18=HEAP32[r1+(r11+28)>>2];r19=32440+(r18<<2)|0;if((r10|0)==(HEAP32[r19>>2]|0)){HEAP32[r19>>2]=r23;if((r23|0)==0){HEAP32[32140>>2]=HEAP32[32140>>2]&~(1<<r18);r16=r13;r17=r14;break}}else{if(r12>>>0<HEAP32[32152>>2]>>>0){_abort()}r18=r12+16|0;if((HEAP32[r18>>2]|0)==(r10|0)){HEAP32[r18>>2]=r23}else{HEAP32[r12+20>>2]=r23}if((r23|0)==0){r16=r13;r17=r14;break}}if(r23>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r23+24>>2]=r12;r18=HEAP32[r1+(r11+16)>>2];do{if((r18|0)!=0){if(r18>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r23+16>>2]=r18;HEAP32[r18+24>>2]=r23;break}}}while(0);r18=HEAP32[r1+(r11+20)>>2];if((r18|0)!=0){if(r18>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r23+20>>2]=r18;HEAP32[r18+24>>2]=r23;r16=r13;r17=r14;break}}else{r16=r13;r17=r14}}else{r16=r13;r17=r14}}else{r16=r3;r17=r7}}while(0);r3=r16;if(r3>>>0>=r8>>>0){_abort()}r23=r1+(r7-4)|0;r4=HEAP32[r23>>2];if((r4&1|0)==0){_abort()}if((r4&2|0)==0){if((r9|0)==(HEAP32[32160>>2]|0)){r24=HEAP32[32148>>2]+r17|0;HEAP32[32148>>2]=r24;HEAP32[32160>>2]=r16;HEAP32[r16+4>>2]=r24|1;if((r16|0)!=(HEAP32[32156>>2]|0)){return}HEAP32[32156>>2]=0;HEAP32[32144>>2]=0;return}if((r9|0)==(HEAP32[32156>>2]|0)){r24=HEAP32[32144>>2]+r17|0;HEAP32[32144>>2]=r24;HEAP32[32156>>2]=r16;HEAP32[r16+4>>2]=r24|1;HEAP32[r3+r24>>2]=r24;return}r24=(r4&-8)+r17|0;r25=r4>>>3;do{if(r4>>>0>=256){r20=r8;r6=HEAP32[r1+(r7+16)>>2];r2=HEAP32[r1+(r7|4)>>2];do{if((r2|0)==(r20|0)){r5=r1+(r7+12)|0;r18=HEAP32[r5>>2];if((r18|0)==0){r12=r1+(r7+8)|0;r10=HEAP32[r12>>2];if((r10|0)==0){r26=0;break}else{r27=r10;r28=r12}}else{r27=r18;r28=r5}while(1){r5=r27+20|0;r18=HEAP32[r5>>2];if((r18|0)!=0){r27=r18;r28=r5;continue}r5=r27+16|0;r18=HEAP32[r5>>2];if((r18|0)==0){break}else{r27=r18;r28=r5}}if(r28>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r28>>2]=0;r26=r27;break}}else{r5=HEAP32[r1+r7>>2];if(r5>>>0<HEAP32[32152>>2]>>>0){_abort()}r18=r5+12|0;if((HEAP32[r18>>2]|0)!=(r20|0)){_abort()}r12=r2+8|0;if((HEAP32[r12>>2]|0)==(r20|0)){HEAP32[r18>>2]=r2;HEAP32[r12>>2]=r5;r26=r2;break}else{_abort()}}}while(0);if((r6|0)!=0){r2=HEAP32[r1+(r7+20)>>2];r14=32440+(r2<<2)|0;if((r20|0)==(HEAP32[r14>>2]|0)){HEAP32[r14>>2]=r26;if((r26|0)==0){HEAP32[32140>>2]=HEAP32[32140>>2]&~(1<<r2);break}}else{if(r6>>>0<HEAP32[32152>>2]>>>0){_abort()}r2=r6+16|0;if((HEAP32[r2>>2]|0)==(r20|0)){HEAP32[r2>>2]=r26}else{HEAP32[r6+20>>2]=r26}if((r26|0)==0){break}}if(r26>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r26+24>>2]=r6;r2=HEAP32[r1+(r7+8)>>2];do{if((r2|0)!=0){if(r2>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r26+16>>2]=r2;HEAP32[r2+24>>2]=r26;break}}}while(0);r2=HEAP32[r1+(r7+12)>>2];if((r2|0)!=0){if(r2>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r26+20>>2]=r2;HEAP32[r2+24>>2]=r26;break}}}}else{r2=HEAP32[r1+r7>>2];r6=HEAP32[r1+(r7|4)>>2];r20=32176+(r25<<1<<2)|0;if((r2|0)!=(r20|0)){if(r2>>>0<HEAP32[32152>>2]>>>0){_abort()}if((HEAP32[r2+12>>2]|0)!=(r9|0)){_abort()}}if((r6|0)==(r2|0)){HEAP32[32136>>2]=HEAP32[32136>>2]&~(1<<r25);break}if((r6|0)!=(r20|0)){if(r6>>>0<HEAP32[32152>>2]>>>0){_abort()}r20=r6+8|0;if((HEAP32[r20>>2]|0)==(r9|0)){r29=r20}else{_abort()}}else{r29=r6+8|0}HEAP32[r2+12>>2]=r6;HEAP32[r29>>2]=r2}}while(0);HEAP32[r16+4>>2]=r24|1;HEAP32[r3+r24>>2]=r24;if((r16|0)==(HEAP32[32156>>2]|0)){HEAP32[32144>>2]=r24;return}else{r30=r24}}else{HEAP32[r23>>2]=r4&-2;HEAP32[r16+4>>2]=r17|1;HEAP32[r3+r17>>2]=r17;r30=r17}r17=r30>>>3;if(r30>>>0<256){r3=r17<<1;r4=32176+(r3<<2)|0;r23=HEAP32[32136>>2];r24=1<<r17;if((r23&r24|0)!=0){r17=32176+(r3+2<<2)|0;r29=HEAP32[r17>>2];if(r29>>>0<HEAP32[32152>>2]>>>0){_abort()}else{r31=r29;r32=r17}}else{HEAP32[32136>>2]=r23|r24;r31=r4;r32=32176+(r3+2<<2)|0}HEAP32[r32>>2]=r16;HEAP32[r31+12>>2]=r16;HEAP32[r16+8>>2]=r31;HEAP32[r16+12>>2]=r4;return}r4=r16;r31=r30>>>8;if((r31|0)!=0){if(r30>>>0>16777215){r33=31}else{r32=(r31+1048320|0)>>>16&8;r3=r31<<r32;r31=(r3+520192|0)>>>16&4;r24=r3<<r31;r3=(r24+245760|0)>>>16&2;r23=14-(r31|r32|r3)+(r24<<r3>>>15)|0;r33=r30>>>((r23+7|0)>>>0)&1|r23<<1}}else{r33=0}r23=32440+(r33<<2)|0;HEAP32[r16+28>>2]=r33;HEAP32[r16+20>>2]=0;HEAP32[r16+16>>2]=0;r3=HEAP32[32140>>2];r24=1<<r33;L199:do{if((r3&r24|0)!=0){r32=HEAP32[r23>>2];if((r33|0)==31){r34=0}else{r34=25-(r33>>>1)|0}L205:do{if((HEAP32[r32+4>>2]&-8|0)!=(r30|0)){r31=r32;r17=r30<<r34;while(1){r35=r31+16+(r17>>>31<<2)|0;r29=HEAP32[r35>>2];if((r29|0)==0){break}if((HEAP32[r29+4>>2]&-8|0)==(r30|0)){r36=r29;break L205}else{r31=r29;r17=r17<<1}}if(r35>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r35>>2]=r4;HEAP32[r16+24>>2]=r31;HEAP32[r16+12>>2]=r16;HEAP32[r16+8>>2]=r16;break L199}}else{r36=r32}}while(0);r32=r36+8|0;r17=HEAP32[r32>>2];r29=HEAP32[32152>>2];if(r36>>>0<r29>>>0){_abort()}if(r17>>>0<r29>>>0){_abort()}else{HEAP32[r17+12>>2]=r4;HEAP32[r32>>2]=r4;HEAP32[r16+8>>2]=r17;HEAP32[r16+12>>2]=r36;HEAP32[r16+24>>2]=0;break}}else{HEAP32[32140>>2]=r3|r24;HEAP32[r23>>2]=r4;HEAP32[r16+24>>2]=r23;HEAP32[r16+12>>2]=r16;HEAP32[r16+8>>2]=r16}}while(0);r16=HEAP32[32168>>2]-1|0;HEAP32[32168>>2]=r16;if((r16|0)==0){r37=32592}else{return}while(1){r16=HEAP32[r37>>2];if((r16|0)==0){break}else{r37=r16+8|0}}HEAP32[32168>>2]=-1;return}function _realloc(r1,r2){var r3,r4,r5,r6;if((r1|0)==0){r3=_malloc(r2);return r3}if(r2>>>0>4294967231){HEAP32[___errno_location()>>2]=12;r3=0;return r3}if(r2>>>0<11){r4=16}else{r4=r2+11&-8}r5=_try_realloc_chunk(r1-8|0,r4);if((r5|0)!=0){r3=r5+8|0;return r3}r5=_malloc(r2);if((r5|0)==0){r3=0;return r3}r4=HEAP32[r1-4>>2];r6=(r4&-8)-((r4&3|0)==0?8:4)|0;_memcpy(r5,r1,r6>>>0<r2>>>0?r6:r2)|0;_free(r1);r3=r5;return r3}function _try_realloc_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=r1+4|0;r4=HEAP32[r3>>2];r5=r4&-8;r6=r1;r7=r6+r5|0;r8=r7;r9=HEAP32[32152>>2];if(r6>>>0<r9>>>0){_abort()}r10=r4&3;if(!((r10|0)!=1&r6>>>0<r7>>>0)){_abort()}r11=r6+(r5|4)|0;r12=HEAP32[r11>>2];if((r12&1|0)==0){_abort()}if((r10|0)==0){if(r2>>>0<256){r13=0;return r13}if(r5>>>0>=(r2+4|0)>>>0?(r5-r2|0)>>>0<=HEAP32[31944>>2]<<1>>>0:0){r13=r1;return r13}r13=0;return r13}if(r5>>>0>=r2>>>0){r10=r5-r2|0;if(r10>>>0<=15){r13=r1;return r13}HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r10|3;HEAP32[r11>>2]=HEAP32[r11>>2]|1;_dispose_chunk(r6+r2|0,r10);r13=r1;return r13}if((r8|0)==(HEAP32[32160>>2]|0)){r10=HEAP32[32148>>2]+r5|0;if(r10>>>0<=r2>>>0){r13=0;return r13}r11=r10-r2|0;HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r11|1;HEAP32[32160>>2]=r6+r2;HEAP32[32148>>2]=r11;r13=r1;return r13}if((r8|0)==(HEAP32[32156>>2]|0)){r11=HEAP32[32144>>2]+r5|0;if(r11>>>0<r2>>>0){r13=0;return r13}r10=r11-r2|0;if(r10>>>0>15){HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r10|1;HEAP32[r6+r11>>2]=r10;r14=r6+(r11+4)|0;HEAP32[r14>>2]=HEAP32[r14>>2]&-2;r15=r6+r2|0;r16=r10}else{HEAP32[r3>>2]=r4&1|r11|2;r4=r6+(r11+4)|0;HEAP32[r4>>2]=HEAP32[r4>>2]|1;r15=0;r16=0}HEAP32[32144>>2]=r16;HEAP32[32156>>2]=r15;r13=r1;return r13}if((r12&2|0)!=0){r13=0;return r13}r15=(r12&-8)+r5|0;if(r15>>>0<r2>>>0){r13=0;return r13}r16=r15-r2|0;r4=r12>>>3;do{if(r12>>>0>=256){r11=r7;r10=HEAP32[r6+(r5+24)>>2];r14=HEAP32[r6+(r5+12)>>2];do{if((r14|0)==(r11|0)){r17=r6+(r5+20)|0;r18=HEAP32[r17>>2];if((r18|0)==0){r19=r6+(r5+16)|0;r20=HEAP32[r19>>2];if((r20|0)==0){r21=0;break}else{r22=r20;r23=r19}}else{r22=r18;r23=r17}while(1){r17=r22+20|0;r18=HEAP32[r17>>2];if((r18|0)!=0){r22=r18;r23=r17;continue}r17=r22+16|0;r18=HEAP32[r17>>2];if((r18|0)==0){break}else{r22=r18;r23=r17}}if(r23>>>0<r9>>>0){_abort()}else{HEAP32[r23>>2]=0;r21=r22;break}}else{r17=HEAP32[r6+(r5+8)>>2];if(r17>>>0<r9>>>0){_abort()}r18=r17+12|0;if((HEAP32[r18>>2]|0)!=(r11|0)){_abort()}r19=r14+8|0;if((HEAP32[r19>>2]|0)==(r11|0)){HEAP32[r18>>2]=r14;HEAP32[r19>>2]=r17;r21=r14;break}else{_abort()}}}while(0);if((r10|0)!=0){r14=HEAP32[r6+(r5+28)>>2];r17=32440+(r14<<2)|0;if((r11|0)==(HEAP32[r17>>2]|0)){HEAP32[r17>>2]=r21;if((r21|0)==0){HEAP32[32140>>2]=HEAP32[32140>>2]&~(1<<r14);break}}else{if(r10>>>0<HEAP32[32152>>2]>>>0){_abort()}r14=r10+16|0;if((HEAP32[r14>>2]|0)==(r11|0)){HEAP32[r14>>2]=r21}else{HEAP32[r10+20>>2]=r21}if((r21|0)==0){break}}if(r21>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r21+24>>2]=r10;r14=HEAP32[r6+(r5+16)>>2];do{if((r14|0)!=0){if(r14>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r21+16>>2]=r14;HEAP32[r14+24>>2]=r21;break}}}while(0);r14=HEAP32[r6+(r5+20)>>2];if((r14|0)!=0){if(r14>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r21+20>>2]=r14;HEAP32[r14+24>>2]=r21;break}}}}else{r14=HEAP32[r6+(r5+8)>>2];r10=HEAP32[r6+(r5+12)>>2];r11=32176+(r4<<1<<2)|0;if((r14|0)!=(r11|0)){if(r14>>>0<r9>>>0){_abort()}if((HEAP32[r14+12>>2]|0)!=(r8|0)){_abort()}}if((r10|0)==(r14|0)){HEAP32[32136>>2]=HEAP32[32136>>2]&~(1<<r4);break}if((r10|0)!=(r11|0)){if(r10>>>0<r9>>>0){_abort()}r11=r10+8|0;if((HEAP32[r11>>2]|0)==(r8|0)){r24=r11}else{_abort()}}else{r24=r10+8|0}HEAP32[r14+12>>2]=r10;HEAP32[r24>>2]=r14}}while(0);if(r16>>>0<16){HEAP32[r3>>2]=r15|HEAP32[r3>>2]&1|2;r24=r6+(r15|4)|0;HEAP32[r24>>2]=HEAP32[r24>>2]|1;r13=r1;return r13}else{HEAP32[r3>>2]=HEAP32[r3>>2]&1|r2|2;HEAP32[r6+(r2+4)>>2]=r16|3;r3=r6+(r15|4)|0;HEAP32[r3>>2]=HEAP32[r3>>2]|1;_dispose_chunk(r6+r2|0,r16);r13=r1;return r13}}function _dispose_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34;r3=r1;r4=r3+r2|0;r5=r4;r6=HEAP32[r1+4>>2];do{if((r6&1|0)==0){r7=HEAP32[r1>>2];if((r6&3|0)==0){return}r8=r3+ -r7|0;r9=r8;r10=r7+r2|0;r11=HEAP32[32152>>2];if(r8>>>0<r11>>>0){_abort()}if((r9|0)==(HEAP32[32156>>2]|0)){r12=r3+(r2+4)|0;if((HEAP32[r12>>2]&3|0)!=3){r13=r9;r14=r10;break}HEAP32[32144>>2]=r10;HEAP32[r12>>2]=HEAP32[r12>>2]&-2;HEAP32[r3+(4-r7)>>2]=r10|1;HEAP32[r4>>2]=r10;return}r12=r7>>>3;if(r7>>>0<256){r15=HEAP32[r3+(8-r7)>>2];r16=HEAP32[r3+(12-r7)>>2];r17=32176+(r12<<1<<2)|0;if((r15|0)!=(r17|0)){if(r15>>>0<r11>>>0){_abort()}if((HEAP32[r15+12>>2]|0)!=(r9|0)){_abort()}}if((r16|0)==(r15|0)){HEAP32[32136>>2]=HEAP32[32136>>2]&~(1<<r12);r13=r9;r14=r10;break}if((r16|0)!=(r17|0)){if(r16>>>0<r11>>>0){_abort()}r17=r16+8|0;if((HEAP32[r17>>2]|0)==(r9|0)){r18=r17}else{_abort()}}else{r18=r16+8|0}HEAP32[r15+12>>2]=r16;HEAP32[r18>>2]=r15;r13=r9;r14=r10;break}r15=r8;r8=HEAP32[r3+(24-r7)>>2];r16=HEAP32[r3+(12-r7)>>2];do{if((r16|0)==(r15|0)){r17=16-r7|0;r12=r3+(r17+4)|0;r19=HEAP32[r12>>2];if((r19|0)==0){r20=r3+r17|0;r17=HEAP32[r20>>2];if((r17|0)==0){r21=0;break}else{r22=r17;r23=r20}}else{r22=r19;r23=r12}while(1){r12=r22+20|0;r19=HEAP32[r12>>2];if((r19|0)!=0){r22=r19;r23=r12;continue}r12=r22+16|0;r19=HEAP32[r12>>2];if((r19|0)==0){break}else{r22=r19;r23=r12}}if(r23>>>0<r11>>>0){_abort()}else{HEAP32[r23>>2]=0;r21=r22;break}}else{r12=HEAP32[r3+(8-r7)>>2];if(r12>>>0<r11>>>0){_abort()}r19=r12+12|0;if((HEAP32[r19>>2]|0)!=(r15|0)){_abort()}r20=r16+8|0;if((HEAP32[r20>>2]|0)==(r15|0)){HEAP32[r19>>2]=r16;HEAP32[r20>>2]=r12;r21=r16;break}else{_abort()}}}while(0);if((r8|0)!=0){r16=HEAP32[r3+(28-r7)>>2];r11=32440+(r16<<2)|0;if((r15|0)==(HEAP32[r11>>2]|0)){HEAP32[r11>>2]=r21;if((r21|0)==0){HEAP32[32140>>2]=HEAP32[32140>>2]&~(1<<r16);r13=r9;r14=r10;break}}else{if(r8>>>0<HEAP32[32152>>2]>>>0){_abort()}r16=r8+16|0;if((HEAP32[r16>>2]|0)==(r15|0)){HEAP32[r16>>2]=r21}else{HEAP32[r8+20>>2]=r21}if((r21|0)==0){r13=r9;r14=r10;break}}if(r21>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r21+24>>2]=r8;r16=16-r7|0;r11=HEAP32[r3+r16>>2];do{if((r11|0)!=0){if(r11>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r21+16>>2]=r11;HEAP32[r11+24>>2]=r21;break}}}while(0);r11=HEAP32[r3+(r16+4)>>2];if((r11|0)!=0){if(r11>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r21+20>>2]=r11;HEAP32[r11+24>>2]=r21;r13=r9;r14=r10;break}}else{r13=r9;r14=r10}}else{r13=r9;r14=r10}}else{r13=r1;r14=r2}}while(0);r1=HEAP32[32152>>2];if(r4>>>0<r1>>>0){_abort()}r21=r3+(r2+4)|0;r22=HEAP32[r21>>2];if((r22&2|0)==0){if((r5|0)==(HEAP32[32160>>2]|0)){r23=HEAP32[32148>>2]+r14|0;HEAP32[32148>>2]=r23;HEAP32[32160>>2]=r13;HEAP32[r13+4>>2]=r23|1;if((r13|0)!=(HEAP32[32156>>2]|0)){return}HEAP32[32156>>2]=0;HEAP32[32144>>2]=0;return}if((r5|0)==(HEAP32[32156>>2]|0)){r23=HEAP32[32144>>2]+r14|0;HEAP32[32144>>2]=r23;HEAP32[32156>>2]=r13;HEAP32[r13+4>>2]=r23|1;HEAP32[r13+r23>>2]=r23;return}r23=(r22&-8)+r14|0;r18=r22>>>3;do{if(r22>>>0>=256){r6=r4;r11=HEAP32[r3+(r2+24)>>2];r7=HEAP32[r3+(r2+12)>>2];do{if((r7|0)==(r6|0)){r8=r3+(r2+20)|0;r15=HEAP32[r8>>2];if((r15|0)==0){r12=r3+(r2+16)|0;r20=HEAP32[r12>>2];if((r20|0)==0){r24=0;break}else{r25=r20;r26=r12}}else{r25=r15;r26=r8}while(1){r8=r25+20|0;r15=HEAP32[r8>>2];if((r15|0)!=0){r25=r15;r26=r8;continue}r8=r25+16|0;r15=HEAP32[r8>>2];if((r15|0)==0){break}else{r25=r15;r26=r8}}if(r26>>>0<r1>>>0){_abort()}else{HEAP32[r26>>2]=0;r24=r25;break}}else{r8=HEAP32[r3+(r2+8)>>2];if(r8>>>0<r1>>>0){_abort()}r15=r8+12|0;if((HEAP32[r15>>2]|0)!=(r6|0)){_abort()}r12=r7+8|0;if((HEAP32[r12>>2]|0)==(r6|0)){HEAP32[r15>>2]=r7;HEAP32[r12>>2]=r8;r24=r7;break}else{_abort()}}}while(0);if((r11|0)!=0){r7=HEAP32[r3+(r2+28)>>2];r10=32440+(r7<<2)|0;if((r6|0)==(HEAP32[r10>>2]|0)){HEAP32[r10>>2]=r24;if((r24|0)==0){HEAP32[32140>>2]=HEAP32[32140>>2]&~(1<<r7);break}}else{if(r11>>>0<HEAP32[32152>>2]>>>0){_abort()}r7=r11+16|0;if((HEAP32[r7>>2]|0)==(r6|0)){HEAP32[r7>>2]=r24}else{HEAP32[r11+20>>2]=r24}if((r24|0)==0){break}}if(r24>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r24+24>>2]=r11;r7=HEAP32[r3+(r2+16)>>2];do{if((r7|0)!=0){if(r7>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r24+16>>2]=r7;HEAP32[r7+24>>2]=r24;break}}}while(0);r7=HEAP32[r3+(r2+20)>>2];if((r7|0)!=0){if(r7>>>0<HEAP32[32152>>2]>>>0){_abort()}else{HEAP32[r24+20>>2]=r7;HEAP32[r7+24>>2]=r24;break}}}}else{r7=HEAP32[r3+(r2+8)>>2];r11=HEAP32[r3+(r2+12)>>2];r6=32176+(r18<<1<<2)|0;if((r7|0)!=(r6|0)){if(r7>>>0<r1>>>0){_abort()}if((HEAP32[r7+12>>2]|0)!=(r5|0)){_abort()}}if((r11|0)==(r7|0)){HEAP32[32136>>2]=HEAP32[32136>>2]&~(1<<r18);break}if((r11|0)!=(r6|0)){if(r11>>>0<r1>>>0){_abort()}r6=r11+8|0;if((HEAP32[r6>>2]|0)==(r5|0)){r27=r6}else{_abort()}}else{r27=r11+8|0}HEAP32[r7+12>>2]=r11;HEAP32[r27>>2]=r7}}while(0);HEAP32[r13+4>>2]=r23|1;HEAP32[r13+r23>>2]=r23;if((r13|0)==(HEAP32[32156>>2]|0)){HEAP32[32144>>2]=r23;return}else{r28=r23}}else{HEAP32[r21>>2]=r22&-2;HEAP32[r13+4>>2]=r14|1;HEAP32[r13+r14>>2]=r14;r28=r14}r14=r28>>>3;if(r28>>>0<256){r22=r14<<1;r21=32176+(r22<<2)|0;r23=HEAP32[32136>>2];r27=1<<r14;if((r23&r27|0)!=0){r14=32176+(r22+2<<2)|0;r5=HEAP32[r14>>2];if(r5>>>0<HEAP32[32152>>2]>>>0){_abort()}else{r29=r5;r30=r14}}else{HEAP32[32136>>2]=r23|r27;r29=r21;r30=32176+(r22+2<<2)|0}HEAP32[r30>>2]=r13;HEAP32[r29+12>>2]=r13;HEAP32[r13+8>>2]=r29;HEAP32[r13+12>>2]=r21;return}r21=r13;r29=r28>>>8;if((r29|0)!=0){if(r28>>>0>16777215){r31=31}else{r30=(r29+1048320|0)>>>16&8;r22=r29<<r30;r29=(r22+520192|0)>>>16&4;r27=r22<<r29;r22=(r27+245760|0)>>>16&2;r23=14-(r29|r30|r22)+(r27<<r22>>>15)|0;r31=r28>>>((r23+7|0)>>>0)&1|r23<<1}}else{r31=0}r23=32440+(r31<<2)|0;HEAP32[r13+28>>2]=r31;HEAP32[r13+20>>2]=0;HEAP32[r13+16>>2]=0;r22=HEAP32[32140>>2];r27=1<<r31;if((r22&r27|0)==0){HEAP32[32140>>2]=r22|r27;HEAP32[r23>>2]=r21;HEAP32[r13+24>>2]=r23;HEAP32[r13+12>>2]=r13;HEAP32[r13+8>>2]=r13;return}r27=HEAP32[r23>>2];if((r31|0)==31){r32=0}else{r32=25-(r31>>>1)|0}L194:do{if((HEAP32[r27+4>>2]&-8|0)==(r28|0)){r33=r27}else{r31=r27;r23=r28<<r32;while(1){r34=r31+16+(r23>>>31<<2)|0;r22=HEAP32[r34>>2];if((r22|0)==0){break}if((HEAP32[r22+4>>2]&-8|0)==(r28|0)){r33=r22;break L194}else{r31=r22;r23=r23<<1}}if(r34>>>0<HEAP32[32152>>2]>>>0){_abort()}HEAP32[r34>>2]=r21;HEAP32[r13+24>>2]=r31;HEAP32[r13+12>>2]=r13;HEAP32[r13+8>>2]=r13;return}}while(0);r34=r33+8|0;r28=HEAP32[r34>>2];r32=HEAP32[32152>>2];if(r33>>>0<r32>>>0){_abort()}if(r28>>>0<r32>>>0){_abort()}HEAP32[r28+12>>2]=r21;HEAP32[r34>>2]=r21;HEAP32[r13+8>>2]=r28;HEAP32[r13+12>>2]=r33;HEAP32[r13+24>>2]=0;return}function _memcmp(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;if((r3|0)==0){r5=0;return r5}else{r6=r3;r7=r1;r8=r2}while(1){r9=HEAP8[r7];r10=HEAP8[r8];if(r9<<24>>24!=r10<<24>>24){break}r2=r6-1|0;if((r2|0)==0){r5=0;r4=5;break}else{r6=r2;r7=r7+1|0;r8=r8+1|0}}if(r4==5){return r5}r5=(r9&255)-(r10&255)|0;return r5}function _strcasecmp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=HEAP8[r1];L1:do{if(r3<<24>>24==0){r4=r2;r5=0}else{r6=r1;r7=r2;r8=r3;while(1){r9=HEAP8[r7];if(r9<<24>>24==0){r4=r7;r5=r8;break L1}if(r8<<24>>24!=r9<<24>>24){r9=_tolower(r8&255);if((r9|0)!=(_tolower(HEAPU8[r7])|0)){break}}r9=r6+1|0;r10=r7+1|0;r11=HEAP8[r9];if(r11<<24>>24==0){r4=r10;r5=0;break L1}else{r6=r9;r7=r10;r8=r11}}r4=r7;r5=HEAP8[r6]}}while(0);r3=_tolower(r5&255);return r3-_tolower(HEAPU8[r4])|0}function _strcmp(r1,r2){var r3,r4,r5,r6,r7,r8;r3=HEAP8[r1];r4=HEAP8[r2];if(r3<<24>>24!=r4<<24>>24|r3<<24>>24==0|r4<<24>>24==0){r5=r3;r6=r4}else{r4=r1;r1=r2;while(1){r2=r4+1|0;r3=r1+1|0;r7=HEAP8[r2];r8=HEAP8[r3];if(r7<<24>>24!=r8<<24>>24|r7<<24>>24==0|r8<<24>>24==0){r5=r7;r6=r8;break}else{r4=r2;r1=r3}}}return(r5&255)-(r6&255)|0}function _strncmp(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;if((r3|0)==0){r4=0;return r4}r5=HEAP8[r1];L4:do{if(r5<<24>>24==0){r6=r2;r7=0}else{r8=r1;r9=r2;r10=r3;r11=r5;while(1){r12=r10-1|0;r13=HEAP8[r9];if(!((r12|0)!=0&r13<<24>>24!=0&r11<<24>>24==r13<<24>>24)){r6=r9;r7=r11;break L4}r13=r8+1|0;r14=r9+1|0;r15=HEAP8[r13];if(r15<<24>>24==0){r6=r14;r7=0;break}else{r8=r13;r9=r14;r10=r12;r11=r15}}}}while(0);r4=(r7&255)-HEAPU8[r6]|0;return r4}function _i64Add(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1+r3>>>0;r6=r2+r4+(r5>>>0<r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _i64Subtract(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1-r3>>>0;r6=r2-r4>>>0;r6=r2-r4-(r3>>>0>r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _bitshift64Shl(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2<<r3|(r1&r4<<32-r3)>>>32-r3;return r1<<r3}tempRet0=r1<<r3-32;return 0}function _bitshift64Lshr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=0;return r2>>>r3-32|0}function _bitshift64Ashr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=(r2|0)<0?-1:0;return r2>>r3-32|0}function _llvm_ctlz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[ctlz_i8+(r1>>>24)|0];if((r2|0)<8)return r2|0;r2=HEAP8[ctlz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[ctlz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[ctlz_i8+(r1&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_DYNAMIC);function _llvm_cttz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[cttz_i8+(r1&255)|0];if((r2|0)<8)return r2|0;r2=HEAP8[cttz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[cttz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[cttz_i8+(r1>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_DYNAMIC);function ___muldsi3(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=0,r4=0,r5=0,r6=0,r7=0,r8=0,r9=0;r3=r1&65535;r4=r2&65535;r5=Math_imul(r4,r3)|0;r6=r1>>>16;r7=(r5>>>16)+Math_imul(r4,r6)|0;r8=r2>>>16;r9=Math_imul(r8,r3)|0;return(tempRet0=(r7>>>16)+Math_imul(r8,r6)+(((r7&65535)+r9|0)>>>16)|0,r7+r9<<16|r5&65535|0)|0}function ___divdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r5=r2>>31|((r2|0)<0?-1:0)<<1;r6=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r7=r4>>31|((r4|0)<0?-1:0)<<1;r8=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r9=_i64Subtract(r5^r1,r6^r2,r5,r6)|0;r10=tempRet0;r11=_i64Subtract(r7^r3,r8^r4,r7,r8)|0;r12=r7^r5;r13=r8^r6;r14=___udivmoddi4(r9,r10,r11,tempRet0,0)|0;r15=_i64Subtract(r14^r12,tempRet0^r13,r12,r13)|0;return r15|0}function ___remdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r15=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r15|0;r6=r2>>31|((r2|0)<0?-1:0)<<1;r7=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r8=r4>>31|((r4|0)<0?-1:0)<<1;r9=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r10=_i64Subtract(r6^r1,r7^r2,r6,r7)|0;r11=tempRet0;r12=_i64Subtract(r8^r3,r9^r4,r8,r9)|0;___udivmoddi4(r10,r11,r12,tempRet0,r5)|0;r13=_i64Subtract(HEAP32[r5>>2]^r6,HEAP32[r5+4>>2]^r7,r6,r7)|0;r14=tempRet0;STACKTOP=r15;return(tempRet0=r14,r13)|0}function ___muldi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0;r5=r1;r6=r3;r7=___muldsi3(r5,r6)|0;r8=tempRet0;r9=Math_imul(r2,r6)|0;return(tempRet0=Math_imul(r4,r5)+r9+r8|r8&0,r7&-1|0)|0}function ___udivdi3(r1,r2,r3,r4){var r5;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0;r5=___udivmoddi4(r1,r2,r3,r4,0)|0;return r5|0}function ___uremdi3(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r6|0;___udivmoddi4(r1,r2,r3,r4,r5)|0;STACKTOP=r6;return(tempRet0=HEAP32[r5+4>>2]|0,HEAP32[r5>>2]|0)|0}function ___udivmoddi4(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=r5|0;r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0,r16=0,r17=0,r18=0,r19=0,r20=0,r21=0,r22=0,r23=0,r24=0,r25=0,r26=0,r27=0,r28=0,r29=0,r30=0,r31=0,r32=0,r33=0,r34=0,r35=0,r36=0,r37=0,r38=0,r39=0,r40=0,r41=0,r42=0,r43=0,r44=0,r45=0,r46=0,r47=0,r48=0,r49=0,r50=0,r51=0,r52=0,r53=0,r54=0,r55=0,r56=0,r57=0,r58=0,r59=0,r60=0,r61=0,r62=0,r63=0,r64=0,r65=0,r66=0,r67=0,r68=0,r69=0;r6=r1;r7=r2;r8=r7;r9=r3;r10=r4;r11=r10;if((r8|0)==0){r12=(r5|0)!=0;if((r11|0)==0){if(r12){HEAP32[r5>>2]=(r6>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r6>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}else{if(!r12){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}r13=(r11|0)==0;do{if((r9|0)!=0){if(!r13){r28=_llvm_ctlz_i32(r11|0)|0;r29=r28-_llvm_ctlz_i32(r8|0)|0;if(r29>>>0<=31){r30=r29+1|0;r31=31-r29|0;r32=r29-31>>31;r37=r30;r36=r6>>>(r30>>>0)&r32|r8<<r31;r35=r8>>>(r30>>>0)&r32;r34=0;r33=r6<<r31;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}r19=r9-1|0;if((r19&r9|0)!=0){r21=_llvm_ctlz_i32(r9|0)+33|0;r22=r21-_llvm_ctlz_i32(r8|0)|0;r23=64-r22|0;r24=32-r22|0;r25=r24>>31;r26=r22-32|0;r27=r26>>31;r37=r22;r36=r24-1>>31&r8>>>(r26>>>0)|(r8<<r24|r6>>>(r22>>>0))&r27;r35=r27&r8>>>(r22>>>0);r34=r6<<r23&r25;r33=(r8<<r23|r6>>>(r26>>>0))&r25|r6<<r24&r22-33>>31;break}if((r5|0)!=0){HEAP32[r5>>2]=r19&r6;HEAP32[r5+4>>2]=0}if((r9|0)==1){r69=r7|r2&0;r68=r1&-1|0;return(tempRet0=r69,r68)|0}else{r20=_llvm_cttz_i32(r9|0)|0;r69=r8>>>(r20>>>0)|0;r68=r8<<32-r20|r6>>>(r20>>>0)|0;return(tempRet0=r69,r68)|0}}else{if(r13){if((r5|0)!=0){HEAP32[r5>>2]=(r8>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r8>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}if((r6|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=(r8>>>0)%(r11>>>0)}r69=0;r68=(r8>>>0)/(r11>>>0)>>>0;return(tempRet0=r69,r68)|0}r14=r11-1|0;if((r14&r11|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r14&r8|r2&0}r69=0;r68=r8>>>((_llvm_cttz_i32(r11|0)|0)>>>0);return(tempRet0=r69,r68)|0}r15=_llvm_ctlz_i32(r11|0)|0;r16=r15-_llvm_ctlz_i32(r8|0)|0;if(r16>>>0<=30){r17=r16+1|0;r18=31-r16|0;r37=r17;r36=r8<<r18|r6>>>(r17>>>0);r35=r8>>>(r17>>>0);r34=0;r33=r6<<r18;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}while(0);if((r37|0)==0){r64=r33;r63=r34;r62=r35;r61=r36;r60=0;r59=0}else{r38=r3&-1|0;r39=r10|r4&0;r40=_i64Add(r38,r39,-1,-1)|0;r41=tempRet0;r47=r33;r46=r34;r45=r35;r44=r36;r43=r37;r42=0;while(1){r48=r46>>>31|r47<<1;r49=r42|r46<<1;r50=r44<<1|r47>>>31|0;r51=r44>>>31|r45<<1|0;_i64Subtract(r40,r41,r50,r51)|0;r52=tempRet0;r53=r52>>31|((r52|0)<0?-1:0)<<1;r54=r53&1;r55=_i64Subtract(r50,r51,r53&r38,(((r52|0)<0?-1:0)>>31|((r52|0)<0?-1:0)<<1)&r39)|0;r56=r55;r57=tempRet0;r58=r43-1|0;if((r58|0)==0){break}else{r47=r48;r46=r49;r45=r57;r44=r56;r43=r58;r42=r54}}r64=r48;r63=r49;r62=r57;r61=r56;r60=0;r59=r54}r65=r63;r66=0;r67=r64|r66;if((r5|0)!=0){HEAP32[r5>>2]=r61;HEAP32[r5+4>>2]=r62}r69=(r65|0)>>>31|r67<<1|(r66<<1|r65>>>31)&0|r60;r68=(r65<<1|0>>>31)&-2|r59;return(tempRet0=r69,r68)|0}




// EMSCRIPTEN_END_FUNCS
Module["_rc759_get_sim"] = _rc759_get_sim;
Module["_main"] = _main;
Module["_rc759_set_msg"] = _rc759_set_msg;
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






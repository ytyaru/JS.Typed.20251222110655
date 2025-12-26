(function(){
class ArgumentError extends Error {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name = 'ArgumentError';}}
class AssertionError extends Error {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name = 'AssertionError';}}
class TypeAssertionError extends AssertionError {constructor(msg, cause) {super(msg, cause); this.name = 'TypeAssertionError';}}
class ValueAssertionError extends AssertionError {constructor(msg, cause) {super(msg, cause); this.name = 'ValueAssertionError';}}
class TypeAssertion {
    static assert(v, fn) {return fn(new TypeAssertion(v,fn))}
    constructor(v, fn) {this._ = {v:v, fn:fn}}
    get p() {// Primitive
        if (!PrimitiveAssertion.is(v)) {this._throw(null, null, 'プリミティブ', 'オブジェクト');}
        return PrimitiveAssertion(this._.v, this._.fn);
    }
    get o() {// Object
        if (!ObjectalAssertion.is(is)) {this._throw(null, null, 'オブジェクト', 'プリミティブ');}
        return ObjectLikeAssertion(this._.v, this._.fn);
    }
    _throw(t, m, em, am) {
        const T = t ?? TypeAssertionError;
        if (!(T instanceof Error)) {throw new ArgumentError(`tはnullかErrorかそれを継承したクラスであるべきです。`)}
        throw new T(`${m ?? '型が期待値と違います。'}\n期待値: ${em}\n実際値: ${am ?? am+' ' : ''}${this._.v}`)
    }
}
class PrimitiveAssertion extends TypeAssertion {
    static is(v) {return v===Object(v)}
    static tag(v) {return null===v ? 'null' : typeof v}
    constructor(v, fn) {super(v, fn);}
    get isUnd() {return this.#is('undefined')}
    get isNul() {return this.#is('null')}
    get isSym() {return this.#is('symbol')}
    get isBln() {return this.#is('boolean')}
    get isNum() {return this.#is('number')}
    get isInt() {return this.#is('bigint')}
    get isStr() {return this.#is('string')}
    #is(t) {
        if ((t && 'null'!==t) ? (t!==typeof this._.v) : (null!==t)) {this._throw(null, null, t, `${typeof this._.v}`);}
        return true;
    }
}
class ObjectalAssertion extends TypeAssertion {
    static is(v) {return null!==v && 'object'===typeof v}
    static tag(v) {return this.is(v) ? Object.prototype.toString.call(v) : PrimitiveAssertion.tag(v)}
    constructor(v, fn) {super(v, fn);}
    // object,descriptor,callable,instance
    // Object,Descriptor(DD(value),AD(get/set)),Class,Instance,ErrCls,ErrIns,ArrayLike,Ary,Uint8Array,Map,Set,...,Function,Async,Generator,Arrow,AccessorDescriptor
    get o(v) {// [object Object]
        if (!ObjectAssertion.is(v)) {this._throw(null, null, `[object Object]`, `${this.tag(v)}`)}
        return new ObjectAssertion(this._.v, this._.fn);
    }
    get d() {// Descriptor
        if (!DescriptorAssertion.is(v)) {this._throw(null, null, `ディスクリプタ`, `${this.tag(v)}`)}
        return new DescriptorAssertion(this._.v, this._.fn);
    }
    get c() {// Callable(Constructor, Class, Method, ArrowFn, ES5Class, ES5Fn)
        if (!CallableAssertion.is(v)) {this._throw(null, null, `'function'===typeof v`, `${this.tag(v)}`)}
        return new CallableAssertion(this._.v, this._.fn);
    }
    get i() {// Instance
        if (ObjectAssertion.is(v)) {this._throw(null, null, `インスタンス`, `オブジェクト ${this.tag(v)}`)}
        if (DescriptorAssertion.is(v)) {this._throw(null, null, `インスタンス`, `ディスクリプタ ${this.tag(v)}`)}
        if (CallableAssertion.is(v)) {this._throw(null, null, `インスタンス`, `呼び出し可能オブジェクト ${this.tag(v)} `)}
        return new InstanceAssertion(this._.v, this._.fn);
    }
}
class ObjectAssertion extends ObjectalAssertion {
    static is(v) {return ObjectalAssertion.is(v) && '[object Object]'===Object.prototype.toString.call(v)}
    constructor(v, fn) {super(v, fn);}
    get hasPrototype() {
        if (!Object.getPrototypeOf(this._.v)) {throw new ReferenceError(`prototypeプロパティの存在が期待されましたが存在しません。`)}
        return this;
    }
    get hasnotPrototype() { // this._.v=Object.create(null)の時trueを返す
        if (!!Object.getPrototypeOf(this._.v)) {throw new ReferenceError(`prototypeプロパティが存在しないことを期待されましたが存在します。`)}
        return this;
    }
    get hasPrototype() {return !!Object.getPrototypeOf(this._.v)}
    get hasnotPrototype() {return !Object.getPrototypeOf(this._.v)} // this._.v=Object.create(null)の時trueを返す
    has(name) {return #hasCase(name, false)}
    hasOwn(name) {return #hasCase(name, true)}
    #hasCase(name, isOwn=false) {
        const fn = isOwn ? this.#has.bind(this) : this.#hasOwn.bind(this);
        if ('string'===typeof name) {this.#hasFn(name,fn)}
        else if (Array.isArray(name) && 0<name.length && name.every(n=>'string'===typeof n)) {for(let n of name) {this.#hasFn(n,fn)}}
        else {throw new ArgumentError(`nameはStringかそれだけを含むArrayであるべきです。`)}
        return this;
    }
    #has(name) {return name in this._.v}
    #hasOwn(name) {return Object.hasOwn(this._.v, name)}
    #throwHas(name) {throw new ReferenceError(`期待するプロパティ ${name} を持っていません。`)}
    #hasFn(name, fn) {if(!fn(name)){this.#throwHas(name)}}
    prop(name, fn) {
        if ('string'!==typeof name) {throw new ArgumentError(`nameはStringであるべきです。`)}
        if ('function'!==typeof fn) {throw new ArgumentError(`fnはFunctionであるべきです。`}
        this.#hasFn(name,this.#has.bind(this)); // nameが存在すること
        fn(new TypeAssertion(this._.v[name])); // fnが例外発生しないこと
        return this;
    }
}
class DescriptorAssertion extends ObjectalAssertion {
    static is(v) {
        if (null===v) {this._throw(null, null, 'ディスクリプタ')}
        if ('object'!==typeof v) {this._throw(null, null, `ディスクリプタ 'object'===typeof v`, `${typeof v}`)}
        // get, set, value, writable, enumerable, configurable のいずれかを持っているか
        const has = (key) => Object.prototype.hasOwnProperty.call(v, key);
        const isData = has('value') || has('writable');
        const isAccessor = has('get') || has('set');
        // 有効なディスクリプタは、データとアクセサの両方を持つことはできない（JS仕様）
//        return (isData || isAccessor) && !(isData && isAccessor);
        if (!isData && !isAccessor) {this._throw(null, `オブジェクトはvalue,get,setいずれも持たずディスクリプタではありません。`, `valueかget/setを持つオブジェクト`)}
        if (isData && isAccessor) {this._throw(null, `オブジェクトはvalueとget/setの片方しか持たないはずなのに両方あるためディスクリプタではありません。`, `valueかget/setの片方だけ持つオブジェクト`)}
        return new DescriptorAssertion(v);
    }
    constructor(v, fn) {super(v, fn);}
    get hasG() {
        if (!this.#has('get')) {this._throw(null, `ゲッターが期待されましたがありません。`, null, null)}
        if ( this.#has('set')) {this._throw(null, `セッターがないことを期待されましたがあります。`, null, null)}
        if ( this.#has('value')) {this._throw(null, `valueがないことを期待されましたがあります。`, null, null)}
        return this;
    }
    get hasS() {
        if (!this.#has('set')) {this._throw(null, `セッターが期待されましたがありません。`, null, null)}
        if ( this.#has('get')) {this._throw(null, `ゲッターがないことを期待されましたがあります。`, null, null)}
        if ( this.#has('value')) {this._throw(null, `valueがないことを期待されましたがあります。`, null, null)}
        return this;
    }
    get hasGS() {
        if (!this.#has('get')) {this._throw(null, `ゲッターが期待されましたがありません。`, null, null)}
        if (!this.#has('set')) {this._throw(null, `セッターが期待されましたがありません。`, null, null)}
        if ( this.#has('value')) {this._throw(null, `valueがないことを期待されましたがあります。`, null, null)}
        return this;
    }
    get hasV() {
        if (!this.#has('value') && !this.#has('writable')) {this._throw(null, `valueが期待されましたがありません。`, null, null)}
        if ( this.#has('get')) {this._throw(null, `ゲッターがないことを期待されましたがあります。`, null, null)}
        if ( this.#has('get')) {this._throw(null, `ゲッターがないことを期待されましたがあります。`, null, null)}
        return this;
    }
    get isAccessor() {// get/setがあるときはvalueがないはず
        if (!((this.#has('get') || this.#has('set')) && !this.#has('value'))) {this._throw(null, `アクセサディスクリプタが期待されましたが違います。`, `get/setがありvalueがないオブジェクト`, `get/setがないかvalueがあるか両方満たすオブジェクト`)}
        return this;
    }
    get isData() {// valueがあるときはget/setがないはず
        if (!this.#has('value') || (this.#has('get') || this.#has('set'))) {this._throw(null, `データディスクリプタが期待されましたが違います。`, `valueがありget/setがないオブジェクト`, `valueがないかget/setがあるか両方満たすオブジェクト`)}
        return this;
    }
    #has(key) {return Object.prototype.hasOwnProperty.call(this._.v, key)}
}
//class InstanceAssertion extends ObjectalAssertion {
class InstanceAssertion extends ObjectAssertion {
    static is(v) {return null!==v && 'object'===typeof v && !ObjectAssertion.is(v) && !CallableAssertion.is(v) && !DescriptorAssertion.is(v);}
}
class ExtendalClassAssertion extends CallableAssertion {// String,RegExp,ArrayBuffer,SharedArrayBuffer,DataViewは除外
    static is(targetCls, baseCls) {
        if (!CallableAssertion.is(targetCls)) {this._throw(null, null, `コレクションクラス 呼出可能`, `呼出不能`)}
        if (!('prototype' in targetCls)) {this._throw(null, null, `コレクションクラス prototypeがある`, `prototypeがない`)}
        return targetCls.prototype instanceof baseCls;
    }
    constructor(v,b) {super(v,null); this._.baseCls = b;}
    get isExtends() {
        if (!CallableAssertion.is(this._.v)) {this._throw(null, null, `継承済みクラス 呼出可能`, `呼出不能`)}
        if (!('prototype' in this._.v)) {this._throw(null, null, `継承済みクラス prototypeがある`, `prototypeがない`)}
        if (!(this._.v.prototype instanceof this._.baseCls)) {this._throw(null,null,`継承済みクラス ${this._.baseCls.name}`,`${this._.baseCls.name} を継承していない`)}
        return this;
    }
}
class CollectionClassAssertion extends ExtendalClassAssertion {// String,RegExp,ArrayBuffer,SharedArrayBuffer,DataViewは除外
    static get collectionClasses() {return [Array,Map,Set,WeakMap,WeakSet,Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float16Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array]}
    static is(cls) {return this.collectionClasses.some(T=>ExtendalClassAssertion.is(cls, T))}
    constructor(v, b) {super(v, b);}
}
class CollectionInstanceAssertion extends InstanceAssertion {// String,RegExp,ArrayBuffer,SharedArrayBuffer,DataViewは除外
    static is(v) {return InstanceAssertion.is(v) && (Array.isArray(v) || CollectionClassAssertion.collectionClasses.some(T=>v instanceof T));}
    constructor(v) {super(v, null);}
}
// ErrorClass,ErrorInstance,Window,Document,Node,Element,StyleSheet

class ErrorClassAssertion extends ExtendalClassAssertion {// Errorを継承したクラスか
    static is(v) {return ExtendalClassAssertion.is(v, Error)}
    constructor(v) {super(v,Error);}
    is() {return super.isExtends()}
}

class CallableTypeAssertion extends ObjectalAssertion {// コンストラクタ、クラス、メソッド、アロー関数、関数(ES5関数)、関数オブジェクト(ES5クラス)、組込クラス／関数
    static is(v) {return 'function'===typeof v}
    static tag(v) {return this.is(v) ? Object.prototype.toString.call(v) : PrimitiveAssertion.tag(v)}
    static AFn(){return (async()=>{}).constructor}
    static GFn(){return (function*(){yield undefined;}).constructor}
    static AGFunction(){return (async function*(){yield undefined;}).constructor}
    constructor(v, fn) {super(v, fn);}
    get isCallable() {
        if ('function'!==typeof v) {this._throw(null, null, `呼出可能 'function'===typeof v`, `呼出不能 ${typeof v}`)}
        return this;
    }
    get isConOrEs5() { // コンストラクタかES5関数
        if (!this.isCallable(v) || !v.prototype) {this._throw(null, null, `コンストラクタかES5クラス/関数`, `${typeof v}`)}
        return this;
    }
    get isNativeOrEs5() { // 組込コードかES5クラス
        if (!this.isConOrEs5(v) || v.toString().startsWith('class ')) {this._throw(null, null, `組込コードかES5クラス/関数`, `${typeof v}`)}
        return this;
    }
    get isEs6Cls() { // ES6 class 構文で作成された 関数オブジェクト
        if (!this.isCallable(v) || !v.toString().startsWith('class ')) {this._throw(null, null, `ES6 class 構文で作成された関数オブジェクト`, `${typeof v}`)}
        return this;
    }
    get isNonCon() { // 非コンストラクタ(アロー関数、メソッド、組込new不能関数、bind()済関数、ジェネレータ関数、Async関数)
        if (!this.isCallable(v) || v.prototype) {this._throw(null, null, `非コンストラクタ(prototypeがないnew不能な呼出可能オブジェクト。例: アロー関数、メソッド、組込new不能関数、bind()済関数等)`, `${typeof v}`)}
        return this;
    }
    get isArrFn() { // アロー関数
        if (!this.isNonConFn(v) || v.toString().match(/^\w+\s*\(/))) {this._throw(null, null, `アロー関数`, `${typeof v}`)}
        return this;
    }
    // isCallable
    //   isConOrEs5
    //     isNativeOrEs5
    //     isEs6Class
    //   isNonCon
    //     isArrFn
    get isAsync() {
        if (v instanceof CallableTypeAssertion.AFn) {this._throw(null, null, `asyncな呼出可能オブジェクト`, `${typeof v}`)}
        return this;
    }
    get isGen() {
        if (v instanceof CallableTypeAssertion.GFn) {this._throw(null, null, `ジェネレートな呼出可能オブジェクト`, `${typeof v}`)}
        return this;
    }
    get isAsyncGen() {
        if (v instanceof CallableTypeAssertion.AGFn) {this._throw(null, null, `asyncでジェネレートな呼出可能オブジェクト`, `${typeof v}`)}
        return this;
    }
}
// Value
class ValueAssertion {
    constructor(v) {this._={v:v}}
    eq(v) {
        if (v!==this._.v) {this._throw(`同値を期待しましたが異値です。`, v)}
        return this;
    }
    ne(v) {
        if (v===this._.v) {this._throw(`異値を期待しましたが同値です。`, v)}
        return this;
    }
    a(fn) {
        if ('function'!==typeof v) {throw new ArgumentError(`fnは関数であるべきです。戻り値は無視されるためエラー時は例外発生させてください。`)}
        fn(this._.v);
        return this;
    }
    _throw(m, e, a) {
        const M = m ? m : `値が違います。`
        const E = e ?  `\n期待値: ${e}` : '';
        const A = e ? (`\n実際値: ${a ? a + ' ' : ''}${this._.v}` : '');
        throw new ValueError(`${M}${E}${A}`);
        //const A = e && a ? `\n実際値: ${a} ${this._.v}` : '';
        //const A = e ? (`\n実際値: ${a ? a + ' ' : ''}${this._.v}` : '');
        //const A = e ? (`\n実際値: ${a ? a + ' ' + String(this._.v) : ''}` : '');
        //const A = a ? (`\n実際値: ${a}` : '') + ` ${this._.v}`;
    }
}
class BooleanValueAssertion extends ValueAssertion {
    constructor(v) {this._={v:v}}
    get isT() {return this.eq(true)}
    get isF() {return this.eq(false)}
//    get isT() {return this.#is(true)}
//    get isF() {return this.#is(false)}
//    #is(e) {if (e!==this._.v) {this._throw(`${e}を期待しましたが違います。`, e)}; return this;}
}
class NumberValueAssertion extends ValueAssertion {
    constructor(v) {this._={v:v}}
    get isNaN() {
        if (!Number.isNaN(this._.v)) {this._throw(`NaNを期待しましたが非NaNです。`, v)}
        return this;
    }
    get isPInf() {
        if (Number.POSITIVE_INFINITY!==this._.v) {this._throw(`正無限数を期待しましたが違います。`, v)}
        return this;
    }
    get isNInf() {
        if (Number.NEGATIVE_INFINITY!==this._.v) {this._throw(`負無限数を期待しましたが違います。`, v)}
        return this;
    }
    get isFinite() {
        if (!Number.isFinite(this._.v)) {this._throw(`有限数を期待しましたが違います。`, v)}
        return this;
    }
    get isInt() {
        if (!Number.isInteger(this._.v)) {this._throw(`整数を期待しましたが違います。`, v)}
        return this;
    }
    get isSafeInt() {
        if (!Number.isSafeInteger(this._.v)) {this._throw(`誤差なき安全な整数を期待しましたが違います。`, v)}
        return this;
    }
    get isPSI() {// PositiveSafeInteger
        if (!Number.isSafeInteger(this._.v) || this._.v < 0) {this._throw(`誤差なき安全な正の整数を期待しましたが違います。`, v)}
        return this;
    }
    get isNSI() {// NegativeSafeInteger
        if (!Number.isSafeInteger(this._.v) || 0 <= this._.v) {this._throw(`誤差なき安全な負の整数を期待しましたが違います。`, v)}
        return this;
    }
    get isZ() {
        if (0!==this._.v)) {this._throw(`0を期待しましたが違います。`, v)}
        return this;
    }
    // nearlyEqual: 2つ以上の数値が「ほぼ等しい」か判定する（Number(IEEE754)の誤差を考慮して）
    get neq(v) {
        if (!Number.isFinite(v))) {throw new ArgumentError(`vはNumber型の有限数であるべきです。`)}
        if (v===this._.v) {return this}
        const diff = Math.abs(this._.v - v);
        // 数値の大きさに応じてEPSILONをスケーリングさせる（相対誤差）
        // 1未満の場合は Number.EPSILON をそのまま使用（絶対誤差）
        const tolerance = Number.EPSILON * Math.max(1, Math.abs(this._.v), Math.abs(v));
        if (diff >= tolerance) {this._throw(`ほぼ同値を期待しましたがEPSILONによる誤差を考慮した上で異値です。`, v);}
        return this;
    }
}
class StringValueAssertion extends ValueAssertion {
    constructor(v) {this._={v:v}}
    isL(...args) {return this.#isSize(this._.v, 'バイト', ...args)} // Length
    isG(...args) {return this.#isSize(Array.from(this._.v), '文字', ...args)}// Graphemes
    #isSize(chars, text, ...args) {
        if (args.length < 1 || 2 < args.length) {throw new ArgumentError(`argsは一〜二個であるべきです。一個ならlengthが同じ、二個なら[0]〜[1]の範囲内であることを期待します。`)}
        if (!args.every(v=>Number.SafeInteger(v) && 0<=v)) {throw new ArgumentError(`argsの値は全てNumber型で0以上の整数であるべきです。`)}
        if (1===args.length) {
            if (args[0]!==chars.length) {this._throw(`文字列の${text}長が期待値と違います。`, args[0], chars.length)}
        } else {
            const [min,max] = args;
            if (max <= min) {throw new ArgumentError(`argsが二個の時は[0] < [1]であるべきです。`)}
            const L = chars.length;
            if (L < min || max < L) {this._throw(`文字列の${text}長が期待した範囲と違います。`, `${min}〜${max}`)}
        }
        return this;
    }
    match(r) {
        if (!(r instanceof RegExp)) {throw AgumentError(`rはRegExpインスタンスであるべきです。`)}
        const m = this._.v.match(r);
        if (!m) {this._throw(`文字列は期待した正規表現にマッチしませんでした。`, `${r}`)}
        return this;
    }
    startsWith(v) {
        if ('string'!==typeof v) {throw AgumentError(`vは文字列であるべきです。`)}
        if (!this._.v.startsWith(v)) {this._throw(`文字列は期待した先頭文字列と違います。`, v)}
        return this;
    }
    endsWith(v) {
        if ('string'!==typeof v) {throw AgumentError(`vは文字列であるべきです。`)}
        if (!this._.v.endsWith(v)) {this._throw(`文字列は期待した末尾文字列と違います。`, v)}
        return this;
    }
    has(v) {
        if ('string'!==typeof v) {throw AgumentError(`vは文字列であるべきです。`)}
        if (-1===this._.v.indexOf(v)) {this._throw(`文字列は期待した部分文字列を含みません。`, v)}
        return this;
    }
}



class ObservedValue {
    constructor(v, before, after) {
        this._ = {v:v, before:before, after:after}
        'before after'.split(' ').map(n=>{
            if ([null, undefined].some(v=>v===this._[n])) {this._[n] = null;}
            if (!isFn(this._[n]) && !isAFn(this._[n])) {throw new ArgumentError(`${n} はnullかundefinedか非ジェネレータな関数であるべきです。`)}
        });
    }
    get v() {return this._.v}
    set v(v) {
        const o = this._.v;
        const B = this#fn('before', v, o);
        if (B) { return false }
        this._.v = v;
        const A = this#fn('after', v, o);
        if (A) { return false }
        return true;
    }
    #fn(name, v, o) {return this._[name] ? this._[name](v, o) : false}
}
class TypedValue extends ObservedValue {constructor(T, v, before, after) {super(v, ()=>{T.valid(v); return before(v);}, after); this._.T = T; T.valid(v);}}
class TypedValidator {valid(v) {throw Error(`未実装。継承してから実装してください。`)}}
class PrimitiveValidator extends TypedValidator {valid(v){return v!==Object(v)}}
class UndefinedValidator extends PrimitiveValidator {valid(v){return undefined===v}}
class NullValidator extends PrimitiveValidator {valid(v){return null===v}}
class SymbolValidator extends PrimitiveValidator {valid(v){return 'symbol'===typeof v}}
class BooleanValidator extends PrimitiveValidator {valid(v){return 'boolean'===typeof v}}
class NumberValidator extends PrimitiveValidator {valid(v){return 'number'===typeof v}}
class BigIntValidator extends PrimitiveValidator {valid(v){return 'bigint'===typeof v}}
class StringValidator extends PrimitiveValidator {valid(v){return 'string'===typeof v}}
class NaNValidator extends NumberValidator {valid(v){return Number.isNaN(v)}}
class InfinityValidator extends NumberValidator {valid(v){return Number.POSITIVE_INFINITY===v || Number.NEGATIVE_INFINITY===v}}
class PositiveInfinityValidator extends InfinityValidator {valid(v){return Number.POSITIVE_INFINITY===v}}
class NegativeInfinityValidator extends InfinityValidator {valid(v){return Number.NEGATIVE_INFINITY===v}}
class FloatValidator extends NumberValidator {valid(v){return Number.isFinite(v)}}
class UnsafeIntegerValidator extends FloatValidator {valid(v){return Number.isInteger(v)}}
class IntegerValidator extends UnsafeIntegerValidator {valid(v){return Number.isSafeInteger(v)}}
class ObjectLikeValidator extends TypedValidator {valid(v){return null!==v && 'object'===typeof v}}
class ObjectValidator extends ObjectLikeValidator {valid(v){return super.valid(v) && '[object Object]'===Object.prototype.call.toString(v)}}
// 関数
class FunctionLikeValidator extends TypedValidator {valid(v){return 'function'===typeof v}}
class FunctionValidator extends TypedValidator {valid(v){return 'function'===typeof v}}
class AsyncFunctionValidator extends TypedValidator {valid(v){return 'function'===typeof v}}
class GeneratorFunctionValidator extends TypedValidator {valid(v){return 'function'===typeof v}}
class AsyncGeneratorFunctionValidator extends TypedValidator {valid(v){return 'function'===typeof v}}
class AsyncFunctionLikeValidator extends TypedValidator {valid(v){return 'function'===typeof v}}
class GeneratorFunctionLikeValidator extends TypedValidator {valid(v){return 'function'===typeof v}}
// クラス・インスタンス
class ClassValidator extends ObjectLikeValidator {valid(v){return (('function'===typeof v) && (!!v.toString().match(/^class /)))}}
class InstanceValidator extends ObjectLikeValidator {valid(v){return (('function'===typeof v) && (!!v.toString().match(/^class /)))}}

class ArrayClassValidator extends ObjectLikeValidator {valid(v){return super.valid(v) && '[object Array]'===Object.prototype.call.toString(v)}}
class ArrayInstanceValidator extends ObjectLikeValidator {valid(v){return super.valid(v) && '[object Array]'===Object.prototype.call.toString(v)}}

window.Typed = Object.freeze({
    assert: (a)=>{},
    getCls: (a)=>{},
    getIns: (a)=>{},
    Float: (v)=>{},
    Integer: (v)=>{},
    
});
})();

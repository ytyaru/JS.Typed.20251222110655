(function(){
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
        const T = t ?? TypeError;
        if (!(T instanceof Error)) {throw new TypeError(``)}
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
    get o(v) {
        if (!ObjectAssertion.is(v)) {this._throw(null, null, `[object Object]`, `${this.tag(v)}`)}
        return new ObjectAssertion(this._.v, this._.fn);
    }
    get d() {
        if (!DescriptorAssertion.is(v)) {this._throw(null, null, `ディスクリプタ`, `${this.tag(v)}`)}
        return new DescriptorAssertion(this._.v, this._.fn);
    }
    get c() {
        if (!ObjectAssertion.is(v)) {this._throw(null, null, `[object Function]`, `${this.tag(v)}`)}
        return new CallableAssertion(this._.v, this._.fn);
    }
    get i() {
        if (!ObjectAssertion.is(v)) {this._throw(null, null, `インスタンス`, `${this.tag(v)}`)}
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
        else {throw new TypeError(`nameはStringかそれだけを含むArrayであるべきです。`)}
        return this;
    }
    #has(name) {return name in this._.v}
    #hasOwn(name) {return Object.hasOwn(this._.v, name)}
    #throwHas(name) {throw new ReferenceError(`期待するプロパティ ${name} を持っていません。`)}
    #hasFn(name, fn) {if(!fn(name)){this.#throwHas(name)}}
    prop(name, fn) {
        if ('string'!==typeof name) {throw new TypeError(`nameはStringであるべきです。`)}
        if ('function'!==typeof fn) {throw new TypeError(`fnはFunctionであるべきです。`}
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
class InstanceAssertion extends ObjectalAssertion {
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
    constructor(v, fn) {super(v, fn);}
}
class CollectionInstanceAssertion extends InstanceAssertion {// String,RegExp,ArrayBuffer,SharedArrayBuffer,DataViewは除外
    static is(v) {return InstanceAssertion.is(v) && (Array.isArray(v) || CollectionClassAssertion.collectionClasses.some(T=>v instanceof T));}
}

class ObservedValue {
    constructor(v, before, after) {
        this._ = {v:v, before:before, after:after}
        'before after'.split(' ').map(n=>{
            if ([null, undefined].some(v=>v===this._[n])) {this._[n] = (()=>{});}
            if (!isFn(this._[n]) && !isAFn(this._[n])) {throw new TypeError(`${n} はnullかundefinedか非ジェネレータな関数であるべきです。`)}
        });
    }
    get v() {return this._.v}
    set v(v) {
        const o = this._.v;
        const B = this._.before(v, o);
        if (B) { return B }
        this._.v = v;
        const A = this._.after(v, o);
        if (A) { return A }
        return true;
    }
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

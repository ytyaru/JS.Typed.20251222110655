(function(){
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

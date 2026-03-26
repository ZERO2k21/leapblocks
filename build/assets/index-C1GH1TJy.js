import{r as s,R as x}from"./index-Bt8ENGo2.js";let $;try{$=require("skulpt"),$||($=window.Sk)}catch(e){console.warn("[SkulptEngine] Direct require failed, will use window.Sk:",e),$=window.Sk}const ie=`
class Sprite:
    """Control a sprite on the LeapBlocks stage from Python.
    
    Usage:
        sprite = Sprite('Robot')
        sprite.say('Hello!')
        sprite.move(50)
        sprite.turn_right()
        sprite.go_to(100, 50)
    """
    def __init__(self, name):
        self._name = str(name)
        _leap_dispatch(self._name, "INIT", [])

    def _action(self, action, *args):
        # Use the global _leap_dispatch function injected by SkulptEngine
        _leap_dispatch(self._name, action, list(args))

    # ─── Movement and Positioning ───
    def move(self, steps=20):
        """Advance the sprite forward by steps in its current direction."""
        self._action("FORWARD", steps)
    
    def move_right(self, steps=20):
        """Move the sprite to the right."""
        self._action("RIGHT", steps)
    
    def move_left(self, steps=20):
        """Move the sprite to the left."""
        self._action("LEFT", steps)
    
    def move_up(self, steps=20):
        """Move the sprite up."""
        self._action("UP", steps)
    
    def move_down(self, steps=20):
        """Move the sprite down."""
        self._action("DOWN", steps)
    
    def turn_right(self, times=1):
        """Rotate the sprite to the right."""
        self._action("TURN_RIGHT", times)
    
    def turn_left(self, times=1):
        """Rotate the sprite to the left."""
        self._action("TURN_LEFT", times)
    
    def go_to(self, x, y):
        """Move the sprite to a specific coordinate position."""
        self._action("GOTO", x, y)
    
    def setx(self, x):
        """Set the absolute horizontal (x) coordinate."""
        self._action("SETX", x)
    
    def sety(self, y):
        """Set the absolute vertical (y) coordinate."""
        self._action("SETY", y)
    
    def set_x(self, x):
        """Set the absolute horizontal (x) coordinate."""
        self._action("SETX", x)
    
    def set_y(self, y):
        """Set the absolute vertical (y) coordinate."""
        self._action("SETY", y)

    # ─── Appearance and Interaction ───
    def say(self, message, secs=2):
        """Display a speech bubble with text for specified duration."""
        self._action("SAY", str(message), secs)
    
    def think(self, message, secs=2):
        """Display a thought bubble with text."""
        self._action("THINK", str(message), secs)
    
    def hide(self):
        """Make the sprite invisible."""
        self._action("HIDE")
    
    def show(self):
        """Make the sprite visible."""
        self._action("SHOW")
    
    def set_size(self, pct):
        """Modify the size of the sprite (percentage)."""
        self._action("SIZE", pct)
    
    def change_size(self, delta):
        """Change the size by a delta amount."""
        self._action("CHANGE_SIZE", delta)
    
    def point_in_direction(self, angle):
        """Set the sprite's direction in degrees."""
        self._action("ANGLE", angle)
    
    def next_costume(self):
        """Switch to the next costume."""
        self._action("NEXT_COSTUME")
    
    def switch_costume(self, name):
        """Switch to a specific costume by name."""
        self._action("COSTUME", name)

# ─── Helper function ───
def sprite(name):
    """Create a sprite by its library name."""
    return Sprite(name)
`;class Pt{constructor(t){this.callbacks=t,this._replReady=!1}_getSk(){const t=$||window.Sk;if(!t)throw new Error("Python runtime (Skulpt) is not available. Try refreshing the page.");return t}_buildLeapModule(t){const r=this.callbacks.actions,n=a=>{if(a==null)return a;if(a instanceof t.builtin.int_)return a.v;if(a instanceof t.builtin.float_)return parseFloat(t.ffi.remapToJs(a));if(a instanceof t.builtin.str)return a.v;try{return t.ffi.remapToJs(a)}catch{return a==null?void 0:a.v}},i=(a,h,g)=>{const u=n(a),M=n(h),l=((g==null?void 0:g.v)??[]).map(n);switch(M){case"INIT":r.initSprite(u);break;case"RIGHT":r.moveRelative(u,"RIGHT",l[0]??20);break;case"LEFT":r.moveRelative(u,"LEFT",l[0]??20);break;case"UP":r.moveRelative(u,"UP",l[0]??20);break;case"DOWN":r.moveRelative(u,"DOWN",l[0]??20);break;case"FORWARD":r.moveSteps(u,l[0]??20);break;case"GOTO":r.update(u,{x:l[0]??0,y:l[1]??0,position:{x:l[0]??0,y:l[1]??0}});break;case"SETX":r.update(u,{x:l[0]??0,position:{x:l[0]??0}});break;case"SETY":r.update(u,{y:l[0]??0,position:{y:l[0]??0}});break;case"TURN_RIGHT":r.update(u,{angle:S=>(S??0)+15*(l[0]??1),direction:S=>(S??0)+15*(l[0]??1)});break;case"TURN_LEFT":r.update(u,{angle:S=>(S??0)-15*(l[0]??1),direction:S=>(S??0)-15*(l[0]??1)});break;case"SAY":r.update(u,{speech:l[0]??""});break;case"THINK":r.update(u,{speech:"💭 "+(l[0]??"")});break;case"HIDE":r.update(u,{visible:!1});break;case"SHOW":r.update(u,{visible:!0});break;case"SIZE":r.update(u,{size:l[0]??100});break;case"CHANGE_SIZE":r.update(u,{size:S=>(S||100)+(l[0]??10)});break;case"ANGLE":r.update(u,{angle:l[0]??0});break;case"COSTUME":r.update(u,{currentCostume:l[0]});break;case"NEXT_COSTUME":r.update(u,{nextCostume:!0});break}return t.builtin.none.none$};this._dispatchFunc=i;const o=new t.builtin.module;o.$d={_dispatch:new t.builtin.func(i)},t.sysmodules.mp$ass_subscript(new t.builtin.str("__leap__"),o),t.builtins&&(t.builtins.__leap__=o,t.builtins._leap_dispatch=new t.builtin.func(i))}_configureSkulpt(t){this._buildLeapModule(t),t.configure({output:r=>this.callbacks.onOut(r),read:r=>{var n,i;if((i=(n=t.builtinFiles)==null?void 0:n.files)!=null&&i[r])return t.builtinFiles.files[r];throw new Error("Module not found: '"+r+"'")},__future__:t.python3,execLimit:3e4})}_errStr(t){if(!t)return"Unknown error";if(typeof t=="string")return t;try{if(t.tp$str)return t.tp$str().v}catch{}if(t.message&&t.message!=="[object Event]")return t.message;if(t.toString&&!t.toString().includes("[object"))return t.toString();try{return JSON.stringify(t)}catch{return"Unknown error"}}async runPython(t){let r;try{r=this._getSk()}catch(n){throw this.callbacks.onErr(this._errStr(n)),n}this._configureSkulpt(r),this._replReady=!1;try{const n=ie+`
`+t,i=r.importMainWithBody("<stdin>",!1,n,!0);i!=null&&i.then&&await i}catch(n){const i=this._errStr(n);throw this.callbacks.onErr(i),new Error(i)}}async runRepl(t){let r;try{r=this._getSk()}catch(n){throw this.callbacks.onErr(this._errStr(n)),n}if(this._configureSkulpt(r),!this._replReady){this._replReady=!0;try{await r.importMainWithBody("<repl-init>",!1,ie,!0)}catch{}}try{return await r.importMainWithBody("<repl>",!1,t,!0)}catch(n){const i=this._errStr(n);throw this.callbacks.onErr(i),new Error(i)}}}function oe(e,t){(t==null||t>e.length)&&(t=e.length);for(var r=0,n=Array(t);r<t;r++)n[r]=e[r];return n}function we(e){if(Array.isArray(e))return e}function _e(e,t,r){return(t=Re(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function Se(e,t){var r=e==null?null:typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(r!=null){var n,i,o,a,h=[],g=!0,u=!1;try{if(o=(r=r.call(e)).next,t!==0)for(;!(g=(n=o.call(r)).done)&&(h.push(n.value),h.length!==t);g=!0);}catch(M){u=!0,i=M}finally{try{if(!g&&r.return!=null&&(a=r.return(),Object(a)!==a))return}finally{if(u)throw i}}return h}}function Oe(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function ae(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),r.push.apply(r,n)}return r}function ce(e){for(var t=1;t<arguments.length;t++){var r=arguments[t]!=null?arguments[t]:{};t%2?ae(Object(r),!0).forEach(function(n){_e(e,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):ae(Object(r)).forEach(function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(r,n))})}return e}function Ee(e,t){if(e==null)return{};var r,n,i=Me(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)===-1&&{}.propertyIsEnumerable.call(e,r)&&(i[r]=e[r])}return i}function Me(e,t){if(e==null)return{};var r={};for(var n in e)if({}.hasOwnProperty.call(e,n)){if(t.indexOf(n)!==-1)continue;r[n]=e[n]}return r}function je(e,t){return we(e)||Se(e,t)||Pe(e,t)||Oe()}function Te(e,t){if(typeof e!="object"||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var n=r.call(e,t);if(typeof n!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Re(e){var t=Te(e,"string");return typeof t=="symbol"?t:t+""}function Pe(e,t){if(e){if(typeof e=="string")return oe(e,t);var r={}.toString.call(e).slice(8,-1);return r==="Object"&&e.constructor&&(r=e.constructor.name),r==="Map"||r==="Set"?Array.from(e):r==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?oe(e,t):void 0}}function Ie(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function ue(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),r.push.apply(r,n)}return r}function se(e){for(var t=1;t<arguments.length;t++){var r=arguments[t]!=null?arguments[t]:{};t%2?ue(Object(r),!0).forEach(function(n){Ie(e,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):ue(Object(r)).forEach(function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(r,n))})}return e}function Ce(){for(var e=arguments.length,t=new Array(e),r=0;r<e;r++)t[r]=arguments[r];return function(n){return t.reduceRight(function(i,o){return o(i)},n)}}function H(e){return function t(){for(var r=this,n=arguments.length,i=new Array(n),o=0;o<n;o++)i[o]=arguments[o];return i.length>=e.length?e.apply(this,i):function(){for(var a=arguments.length,h=new Array(a),g=0;g<a;g++)h[g]=arguments[g];return t.apply(r,[].concat(i,h))}}}function Y(e){return{}.toString.call(e).includes("Object")}function Le(e){return!Object.keys(e).length}function z(e){return typeof e=="function"}function xe(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function ke(e,t){return Y(t)||T("changeType"),Object.keys(t).some(function(r){return!xe(e,r)})&&T("changeField"),t}function Ne(e){z(e)||T("selectorType")}function Ae(e){z(e)||Y(e)||T("handlerType"),Y(e)&&Object.values(e).some(function(t){return!z(t)})&&T("handlersType")}function De(e){e||T("initialIsRequired"),Y(e)||T("initialType"),Le(e)&&T("initialContent")}function Ue(e,t){throw new Error(e[t]||e.default)}var $e={initialIsRequired:"initial state is required",initialType:"initial state should be an object",initialContent:"initial state shouldn't be an empty object",handlerType:"handler should be an object or a function",handlersType:"all handlers should be a functions",selectorType:"selector should be a function",changeType:"provided value of changes should be an object",changeField:'it seams you want to change a field in the state which is not specified in the "initial" state',default:"an unknown error accured in `state-local` package"},T=H(Ue)($e),q={changes:ke,selector:Ne,handler:Ae,initial:De};function He(e){var t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};q.initial(e),q.handler(t);var r={current:e},n=H(We)(r,t),i=H(ze)(r),o=H(q.changes)(e),a=H(Fe)(r);function h(){var u=arguments.length>0&&arguments[0]!==void 0?arguments[0]:function(M){return M};return q.selector(u),u(r.current)}function g(u){Ce(n,i,o,a)(u)}return[h,g]}function Fe(e,t){return z(t)?t(e.current):t}function ze(e,t){return e.current=se(se({},e.current),t),t}function We(e,t,r){return z(t)?t(e.current):Object.keys(r).forEach(function(n){var i;return(i=t[n])===null||i===void 0?void 0:i.call(t,e.current[n])}),r}var Ve={create:He},Ge={paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs"}};function qe(e){return function t(){for(var r=this,n=arguments.length,i=new Array(n),o=0;o<n;o++)i[o]=arguments[o];return i.length>=e.length?e.apply(this,i):function(){for(var a=arguments.length,h=new Array(a),g=0;g<a;g++)h[g]=arguments[g];return t.apply(r,[].concat(i,h))}}}function Be(e){return{}.toString.call(e).includes("Object")}function Ye(e){return e||le("configIsRequired"),Be(e)||le("configType"),e.urls?(Xe(),{paths:{vs:e.urls.monacoBase}}):e}function Xe(){console.warn(fe.deprecation)}function Je(e,t){throw new Error(e[t]||e.default)}var fe={configIsRequired:"the configuration object is required",configType:"the configuration object should be an object",default:"an unknown error accured in `@monaco-editor/loader` package",deprecation:`Deprecation warning!
    You are using deprecated way of configuration.

    Instead of using
      monaco.config({ urls: { monacoBase: '...' } })
    use
      monaco.config({ paths: { vs: '...' } })

    For more please check the link https://github.com/suren-atoyan/monaco-loader#config
  `},le=qe(Je)(fe),Ke={config:Ye},Ze=function(){for(var t=arguments.length,r=new Array(t),n=0;n<t;n++)r[n]=arguments[n];return function(i){return r.reduceRight(function(o,a){return a(o)},i)}};function de(e,t){return Object.keys(t).forEach(function(r){t[r]instanceof Object&&e[r]&&Object.assign(t[r],de(e[r],t[r]))}),ce(ce({},e),t)}var Qe={type:"cancelation",msg:"operation is manually canceled"};function te(e){var t=!1,r=new Promise(function(n,i){e.then(function(o){return t?i(Qe):n(o)}),e.catch(i)});return r.cancel=function(){return t=!0},r}var et=["monaco"],tt=Ve.create({config:Ge,isInitialized:!1,resolve:null,reject:null,monaco:null}),pe=je(tt,2),W=pe[0],X=pe[1];function rt(e){var t=Ke.config(e),r=t.monaco,n=Ee(t,et);X(function(i){return{config:de(i.config,n),monaco:r}})}function nt(){var e=W(function(t){var r=t.monaco,n=t.isInitialized,i=t.resolve;return{monaco:r,isInitialized:n,resolve:i}});if(!e.isInitialized){if(X({isInitialized:!0}),e.monaco)return e.resolve(e.monaco),te(re);if(window.monaco&&window.monaco.editor)return he(window.monaco),e.resolve(window.monaco),te(re);Ze(it,at)(ct)}return te(re)}function it(e){return document.body.appendChild(e)}function ot(e){var t=document.createElement("script");return e&&(t.src=e),t}function at(e){var t=W(function(n){var i=n.config,o=n.reject;return{config:i,reject:o}}),r=ot("".concat(t.config.paths.vs,"/loader.js"));return r.onload=function(){return e()},r.onerror=t.reject,r}function ct(){var e=W(function(r){var n=r.config,i=r.resolve,o=r.reject;return{config:n,resolve:i,reject:o}}),t=window.require;t.config(e.config),t(["vs/editor/editor.main"],function(r){var n=r.m||r;he(n),e.resolve(n)},function(r){e.reject(r)})}function he(e){W().monaco||X({monaco:e})}function ut(){return W(function(e){var t=e.monaco;return t})}var re=new Promise(function(e,t){return X({resolve:e,reject:t})}),ge={config:rt,init:nt,__getMonacoInstance:ut},st={wrapper:{display:"flex",position:"relative",textAlign:"initial"},fullWidth:{width:"100%"},hide:{display:"none"}},ne=st,lt={container:{display:"flex",height:"100%",width:"100%",justifyContent:"center",alignItems:"center"}},ft=lt;function dt({children:e}){return x.createElement("div",{style:ft.container},e)}var pt=dt,ht=pt;function gt({width:e,height:t,isEditorReady:r,loading:n,_ref:i,className:o,wrapperProps:a}){return x.createElement("section",{style:{...ne.wrapper,width:e,height:t},...a},!r&&x.createElement(ht,null,n),x.createElement("div",{ref:i,style:{...ne.fullWidth,...!r&&ne.hide},className:o}))}var mt=gt,me=s.memo(mt);function vt(e){s.useEffect(e,[])}var ve=vt;function bt(e,t,r=!0){let n=s.useRef(!0);s.useEffect(n.current||!r?()=>{n.current=!1}:e,t)}var E=bt;function F(){}function L(e,t,r,n){return yt(e,n)||wt(e,t,r,n)}function yt(e,t){return e.editor.getModel(be(e,t))}function wt(e,t,r,n){return e.editor.createModel(t,r,n?be(e,n):void 0)}function be(e,t){return e.Uri.parse(t)}function _t({original:e,modified:t,language:r,originalLanguage:n,modifiedLanguage:i,originalModelPath:o,modifiedModelPath:a,keepCurrentOriginalModel:h=!1,keepCurrentModifiedModel:g=!1,theme:u="light",loading:M="Loading...",options:l={},height:S="100%",width:J="100%",className:K,wrapperProps:Z={},beforeMount:Q=F,onMount:ee=F}){let[_,k]=s.useState(!1),[R,b]=s.useState(!0),y=s.useRef(null),v=s.useRef(null),N=s.useRef(null),w=s.useRef(ee),d=s.useRef(Q),P=s.useRef(!1);ve(()=>{let c=ge.init();return c.then(p=>(v.current=p)&&b(!1)).catch(p=>(p==null?void 0:p.type)!=="cancelation"&&console.error("Monaco initialization: error:",p)),()=>y.current?A():c.cancel()}),E(()=>{if(y.current&&v.current){let c=y.current.getOriginalEditor(),p=L(v.current,e||"",n||r||"text",o||"");p!==c.getModel()&&c.setModel(p)}},[o],_),E(()=>{if(y.current&&v.current){let c=y.current.getModifiedEditor(),p=L(v.current,t||"",i||r||"text",a||"");p!==c.getModel()&&c.setModel(p)}},[a],_),E(()=>{let c=y.current.getModifiedEditor();c.getOption(v.current.editor.EditorOption.readOnly)?c.setValue(t||""):t!==c.getValue()&&(c.executeEdits("",[{range:c.getModel().getFullModelRange(),text:t||"",forceMoveMarkers:!0}]),c.pushUndoStop())},[t],_),E(()=>{var c,p;(p=(c=y.current)==null?void 0:c.getModel())==null||p.original.setValue(e||"")},[e],_),E(()=>{let{original:c,modified:p}=y.current.getModel();v.current.editor.setModelLanguage(c,n||r||"text"),v.current.editor.setModelLanguage(p,i||r||"text")},[r,n,i],_),E(()=>{var c;(c=v.current)==null||c.editor.setTheme(u)},[u],_),E(()=>{var c;(c=y.current)==null||c.updateOptions(l)},[l],_);let V=s.useCallback(()=>{var j;if(!v.current)return;d.current(v.current);let c=L(v.current,e||"",n||r||"text",o||""),p=L(v.current,t||"",i||r||"text",a||"");(j=y.current)==null||j.setModel({original:c,modified:p})},[r,t,i,e,n,o,a]),G=s.useCallback(()=>{var c;!P.current&&N.current&&(y.current=v.current.editor.createDiffEditor(N.current,{automaticLayout:!0,...l}),V(),(c=v.current)==null||c.editor.setTheme(u),k(!0),P.current=!0)},[l,u,V]);s.useEffect(()=>{_&&w.current(y.current,v.current)},[_]),s.useEffect(()=>{!R&&!_&&G()},[R,_,G]);function A(){var p,j,I,D;let c=(p=y.current)==null?void 0:p.getModel();h||((j=c==null?void 0:c.original)==null||j.dispose()),g||((I=c==null?void 0:c.modified)==null||I.dispose()),(D=y.current)==null||D.dispose()}return x.createElement(me,{width:J,height:S,isEditorReady:_,loading:M,_ref:N,className:K,wrapperProps:Z})}var St=_t;s.memo(St);function Ot(e){let t=s.useRef();return s.useEffect(()=>{t.current=e},[e]),t.current}var Et=Ot,B=new Map;function Mt({defaultValue:e,defaultLanguage:t,defaultPath:r,value:n,language:i,path:o,theme:a="light",line:h,loading:g="Loading...",options:u={},overrideServices:M={},saveViewState:l=!0,keepCurrentModel:S=!1,width:J="100%",height:K="100%",className:Z,wrapperProps:Q={},beforeMount:ee=F,onMount:_=F,onChange:k,onValidate:R=F}){let[b,y]=s.useState(!1),[v,N]=s.useState(!0),w=s.useRef(null),d=s.useRef(null),P=s.useRef(null),V=s.useRef(_),G=s.useRef(ee),A=s.useRef(),c=s.useRef(n),p=Et(o),j=s.useRef(!1),I=s.useRef(!1);ve(()=>{let f=ge.init();return f.then(m=>(w.current=m)&&N(!1)).catch(m=>(m==null?void 0:m.type)!=="cancelation"&&console.error("Monaco initialization: error:",m)),()=>d.current?ye():f.cancel()}),E(()=>{var m,O,U,C;let f=L(w.current,e||n||"",t||i||"",o||r||"");f!==((m=d.current)==null?void 0:m.getModel())&&(l&&B.set(p,(O=d.current)==null?void 0:O.saveViewState()),(U=d.current)==null||U.setModel(f),l&&((C=d.current)==null||C.restoreViewState(B.get(o))))},[o],b),E(()=>{var f;(f=d.current)==null||f.updateOptions(u)},[u],b),E(()=>{!d.current||n===void 0||(d.current.getOption(w.current.editor.EditorOption.readOnly)?d.current.setValue(n):n!==d.current.getValue()&&(I.current=!0,d.current.executeEdits("",[{range:d.current.getModel().getFullModelRange(),text:n,forceMoveMarkers:!0}]),d.current.pushUndoStop(),I.current=!1))},[n],b),E(()=>{var m,O;let f=(m=d.current)==null?void 0:m.getModel();f&&i&&((O=w.current)==null||O.editor.setModelLanguage(f,i))},[i],b),E(()=>{var f;h!==void 0&&((f=d.current)==null||f.revealLine(h))},[h],b),E(()=>{var f;(f=w.current)==null||f.editor.setTheme(a)},[a],b);let D=s.useCallback(()=>{var f;if(!(!P.current||!w.current)&&!j.current){G.current(w.current);let m=o||r,O=L(w.current,n||e||"",t||i||"",m||"");d.current=(f=w.current)==null?void 0:f.editor.create(P.current,{model:O,automaticLayout:!0,...u},M),l&&d.current.restoreViewState(B.get(m)),w.current.editor.setTheme(a),h!==void 0&&d.current.revealLine(h),y(!0),j.current=!0}},[e,t,r,n,i,o,u,M,l,a,h]);s.useEffect(()=>{b&&V.current(d.current,w.current)},[b]),s.useEffect(()=>{!v&&!b&&D()},[v,b,D]),c.current=n,s.useEffect(()=>{var f,m;b&&k&&((f=A.current)==null||f.dispose(),A.current=(m=d.current)==null?void 0:m.onDidChangeModelContent(O=>{I.current||k(d.current.getValue(),O)}))},[b,k]),s.useEffect(()=>{if(b){let f=w.current.editor.onDidChangeMarkers(m=>{var U;let O=(U=d.current.getModel())==null?void 0:U.uri;if(O&&m.find(C=>C.path===O.path)){let C=w.current.editor.getModelMarkers({resource:O});R==null||R(C)}});return()=>{f==null||f.dispose()}}return()=>{}},[b,R]);function ye(){var f,m;(f=A.current)==null||f.dispose(),S?l&&B.set(o,d.current.saveViewState()):(m=d.current.getModel())==null||m.dispose(),d.current.dispose()}return x.createElement(me,{width:J,height:K,isEditorReady:b,loading:g,_ref:P,className:Z,wrapperProps:Q})}var jt=Mt,Tt=s.memo(jt),It=Tt;export{It as F,Pt as S,ge as l};
//# sourceMappingURL=index-C1GH1TJy.js.map

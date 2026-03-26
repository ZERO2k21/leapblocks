import{r as Ue,a as qe,B as xe}from"./runtime-DPVmDmSC.js";import"./index-CIriCm2H.js";var Ve={exports:{}};/*! For license information please see index.js.LICENSE.txt */var Ke=Ve.exports,He;function Qe(){return He||(He=1,(function(oe,ye){(function(z,_){oe.exports=_(Ue())})(Ke,z=>(()=>{var _={370:w=>{w.exports=z}},$e={};function q(w){var $=$e[w];if($!==void 0)return $.exports;var m=$e[w]={exports:{}};return _[w](m,m.exports,q),m.exports}q.d=(w,$)=>{for(var m in $)q.o($,m)&&!q.o(w,m)&&Object.defineProperty(w,m,{enumerable:!0,get:$[m]})},q.o=(w,$)=>Object.prototype.hasOwnProperty.call(w,$),q.r=w=>{typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(w,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(w,"__esModule",{value:!0})};var le={};q.r(le),q.d(le,{FieldAngle:()=>O,Mode:()=>ne,registerFieldAngle:()=>V});var ne,f=q(370);class O extends f.FieldNumber{constructor($,m,I){super(f.Field.SKIP_SETUP),this.clockwise=!1,this.offset=0,this.displayMin=0,this.displayMax=360,this.minorTick=15,this.majorTick=45,this.symbol="°",this.boundEvents=[],this.line=null,this.gauge=null,this.symbolElement=null,$!==f.Field.SKIP_SETUP&&(I?(this.configure_(I),I.min!==void 0&&I.min!==null||this.setMin(O.DEFAULT_MIN),I.max!==void 0&&I.max!==null||this.setMax(O.DEFAULT_MAX),I.precision!==void 0&&I.precision!==null||this.setPrecision(O.DEFAULT_PRECISION)):(this.setMin(O.DEFAULT_MIN),this.setMax(O.DEFAULT_MAX),this.setPrecision(O.DEFAULT_PRECISION)),this.setValue($),m&&this.setValidator(m))}configure_($){switch(super.configure_($),$.mode){case ne.COMPASS:this.clockwise=!0,this.offset=90;break;case ne.PROTRACTOR:this.clockwise=!1,this.offset=0}if($.clockwise!==void 0&&(this.clockwise=$.clockwise),$.offset!==void 0&&(this.offset=$.offset),$.displayMin!==void 0&&(this.displayMin=$.displayMin),$.displayMax!==void 0&&(this.displayMax=$.displayMax),$.minorTick!==void 0&&(this.minorTick=$.minorTick),$.majorTick!==void 0&&(this.majorTick=$.majorTick),$.symbol!==void 0&&(this.symbol=$.symbol),this.displayMin>=this.displayMax)throw Error("Display min must be larger than display max");if(this.minorTick<0||this.majorTick<0)throw Error("Ticks cannot be negative")}initView(){super.initView(),this.symbol&&(this.symbolElement=f.utils.dom.createSvgElement(f.utils.Svg.TSPAN,{}),this.symbolElement.appendChild(document.createTextNode(this.symbol)),this.getTextElement().appendChild(this.symbolElement))}render_(){super.render_(),this.updateGraph()}showEditor_($){const m=f.utils.userAgent.MOBILE||f.utils.userAgent.ANDROID||f.utils.userAgent.IPAD;super.showEditor_($,m,!1);const I=this.dropdownCreate();f.DropDownDiv.getContentDiv().appendChild(I);const P=this.getSourceBlock();P instanceof f.BlockSvg&&f.DropDownDiv.setColour(P.style.colourPrimary,P.style.colourTertiary),f.DropDownDiv.showPositionedByField(this,this.dropdownDispose.bind(this)),this.updateGraph()}dropdownCreate(){const $=f.utils.dom.createSvgElement(f.utils.Svg.SVG,{xmlns:f.utils.dom.SVG_NS,"xmlns:html":f.utils.dom.HTML_NS,"xmlns:xlink":f.utils.dom.XLINK_NS,version:"1.1",height:2*O.HALF+"px",width:2*O.HALF+"px"});$.style.touchAction="none";const m=f.utils.dom.createSvgElement(f.utils.Svg.CIRCLE,{cx:O.HALF,cy:O.HALF,r:O.RADIUS,class:"blocklyAngleCircle"},$);this.gauge=f.utils.dom.createSvgElement(f.utils.Svg.PATH,{class:"blocklyAngleGauge"},$),this.line=f.utils.dom.createSvgElement(f.utils.Svg.LINE,{x1:O.HALF,y1:O.HALF,class:"blocklyAngleLine"},$);const I=f.utils.math.toDegrees(this.fieldAngleToRadians(this.min_)),P=f.utils.math.toDegrees(this.fieldAngleToRadians(this.max_)),C=(G,R)=>{let b=Math.ceil(I/G)*G,x=Math.floor(P/G)*G;this.clockwise?b<x&&(b+=360):b>x&&(x+=360),x===b&&(x+=360),b>x&&([b,x]=[x,b]);for(let B=b;B<=x;B+=G)f.utils.dom.createSvgElement(f.utils.Svg.LINE,{x1:O.HALF+O.RADIUS,y1:O.HALF,x2:O.HALF+O.RADIUS-R,y2:O.HALF,class:"blocklyAngleMarks",transform:"rotate("+-B+","+O.HALF+","+O.HALF+")"},$)},Q=this.displayMax-this.displayMin,W=360/Q*this.minorTick;W&&C(W,5);const k=360/Q*this.majorTick;return k&&C(k,10),this.boundEvents.push(f.browserEvents.conditionalBind($,"click",this,this.hide)),this.boundEvents.push(f.browserEvents.conditionalBind(m,"pointerdown",this,this.onMouseMove_,!0)),this.boundEvents.push(f.browserEvents.conditionalBind(m,"pointermove",this,this.onMouseMove_,!0)),$}dropdownDispose(){for(const $ of this.boundEvents)f.browserEvents.unbind($);this.boundEvents.length=0,this.gauge=null,this.line=null}hide(){f.DropDownDiv.hideIfOwner(this),f.WidgetDiv.hide()}onMouseMove_($){var m,I;const P=(I=(m=this.gauge)===null||m===void 0?void 0:m.ownerSVGElement)===null||I===void 0?void 0:I.getBoundingClientRect();if(!P)return;const C=$.clientX-P.left-O.HALF,Q=$.clientY-P.top-O.HALF;let W=Math.atan2(-Q,C);isNaN(W)||(W=this.radiansToFieldAngle(W),this.displayMouseOrKeyboardValue(W))}radiansToFieldAngle($){return $/=2*Math.PI,$-=this.offset/360,this.clockwise&&($*=-1),($%=1)<0&&($+=1),($*=this.displayMax-this.displayMin)+this.displayMin}fieldAngleToRadians($){return $-=this.displayMin,$/=this.displayMax-this.displayMin,this.clockwise&&($*=-1),$+=this.offset/360,($%=1)>.5&&($-=1),$<-.5&&($+=1),$*(2*Math.PI)}displayMouseOrKeyboardValue($){const m=this.doClassValidation_($);if(m!==null&&m!==this.value_){const I=this.value_;this.setEditorValue_(m,!1),this.sourceBlock_&&f.Events.isEnabled()&&this.value_!==I&&f.Events.fire(new(f.Events.get(f.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE))(this.sourceBlock_,this.name||null,I,this.value_))}}updateGraph(){if(!this.gauge||!this.line)return;let $=Number(this.getText());if(isNaN($))return;$=this.fieldAngleToRadians($);let m=`M ${O.HALF},${O.HALF}`,I=O.HALF,P=O.HALF;if(!isNaN($)){const C=f.utils.math.toRadians(this.offset),Q=Math.cos(C)*O.RADIUS,W=Math.sin(C)*-O.RADIUS;I+=Math.cos($)*O.RADIUS,P-=Math.sin($)*O.RADIUS;const k=Number(this.clockwise);let G=Math.abs(Math.floor(($-C)/Math.PI)%2);k&&(G=1-G),m+=` l ${Q},${W} A ${O.RADIUS},${O.RADIUS} 0 ${G} ${k} ${I},${P} z`}this.gauge.setAttribute("d",m),this.line.setAttribute("x2",`${I}`),this.line.setAttribute("y2",`${P}`)}onHtmlInputKeyDown_($){super.onHtmlInputKeyDown_($);const m=this.getSourceBlock();if(!m)throw new Error("The field has not yet been attached to its input. Call appendField to attach it.");let I=0;switch($.key){case"ArrowLeft":I=m.RTL?1:-1;break;case"ArrowRight":I=m.RTL?-1:1;break;case"ArrowDown":I=-1;break;case"ArrowUp":I=1}if(I){const P=this.getValue();this.displayMouseOrKeyboardValue(P+I*this.precision_),$.preventDefault(),$.stopPropagation()}}doClassValidation_($){if($===null)return null;let m=Number($);if(isNaN(m)||!isFinite(m))return null;m=this.wrapValue(m),this.precision_&&(m=Math.round(m/this.precision_)*this.precision_),m=Number(m.toFixed(10));const I=this.displayMax-this.displayMin,P=this.max_-this.min_;if(m<this.min_){const C=this.min_-m;m=C<I-C-P?this.min_:this.max_}if(m>this.max_){const C=m-this.max_;m=I-C-P<C?this.min_:this.max_}return m}wrapValue($){const m=this.displayMax-this.displayMin;for($%=m;$<this.displayMin;)$+=m;for(;$>=this.displayMax;)$-=m;return $}static fromJson($){return new this($.value,void 0,$)}}function V(){f.fieldRegistry.register("field_angle",O)}return O.HALF=50,O.RADIUS=O.HALF-1,O.DEFAULT_PRECISION=15,O.DEFAULT_MIN=0,O.DEFAULT_MAX=360,O.prototype.DEFAULT_VALUE=0,f.Css.register(`
.blocklyAngleCircle {
  stroke: #444;
  stroke-width: 1;
  fill: #ddd;
  fill-opacity: 0.8;
}

.blocklyAngleMarks {
  stroke: #444;
  stroke-width: 1;
}

.blocklyAngleGauge {
  fill: #f88;
  fill-opacity: 0.8;
  pointer-events: none;
}

.blocklyAngleLine {
  stroke: #f00;
  stroke-width: 2;
  stroke-linecap: round;
  pointer-events: none;
}
`),(function(w){w.COMPASS="compass",w.PROTRACTOR="protractor"})(ne||(ne={})),le})())})(Ve)),Ve.exports}var ze=Qe(),Pe={exports:{}},be={exports:{}},Je=be.exports,Ge;function Ze(){return Ge||(Ge=1,(function(oe,ye){(function(z,_){oe.exports=_(Ue())})(Je,function(z){var _=z.__namespace__,$e=function(t,n){return["[]",i.ATOMIC]},q=function(t,n){const r=Array(t.itemCount_);for(let e=0;e<t.itemCount_;e++)r[e]=n.valueToCode(t,"ADD"+e,i.NONE)||"null";return["["+r.join(", ")+"]",i.ATOMIC]},le=function(t,n){const r=n.valueToCode(t,"ITEM",i.NONE)||"null";return["new List.filled("+(n.valueToCode(t,"NUM",i.NONE)||"0")+", "+r+")",i.UNARY_POSTFIX]},ne=function(t,n){return[(n.valueToCode(t,"VALUE",i.UNARY_POSTFIX)||"[]")+".length",i.UNARY_POSTFIX]},f=function(t,n){return[(n.valueToCode(t,"VALUE",i.UNARY_POSTFIX)||"[]")+".isEmpty",i.UNARY_POSTFIX]},O=function(t,n){const r=t.getFieldValue("END")==="FIRST"?"indexOf":"lastIndexOf",e=n.valueToCode(t,"FIND",i.NONE)||"''";return n=(n.valueToCode(t,"VALUE",i.UNARY_POSTFIX)||"[]")+"."+r+"("+e+")",t.workspace.options.oneBasedIndex?[n+" + 1",i.ADDITIVE]:[n,i.UNARY_POSTFIX]},V=function(t,n){function r(){const l=n.nameDB_.getDistinctName("tmp_list",_.NameType$$module$build$src$core$names.VARIABLE),a="List "+l+" = "+s+`;
`;return s=l,a}var e=t.getFieldValue("MODE")||"GET";const o=t.getFieldValue("WHERE")||"FROM_START";let s=n.valueToCode(t,"VALUE",o==="RANDOM"||o==="FROM_END"?i.NONE:i.UNARY_POSTFIX)||"[]";if((o!=="RANDOM"||e!=="REMOVE")&&o!=="FROM_END"||s.match(/^\w+$/))switch(o){case"FIRST":if(e==="GET")return[s+".first",i.UNARY_POSTFIX];if(e==="GET_REMOVE")return[s+".removeAt(0)",i.UNARY_POSTFIX];if(e==="REMOVE")return s+`.removeAt(0);
`;break;case"LAST":if(e==="GET")return[s+".last",i.UNARY_POSTFIX];if(e==="GET_REMOVE")return[s+".removeLast()",i.UNARY_POSTFIX];if(e==="REMOVE")return s+`.removeLast();
`;break;case"FROM_START":if(t=n.getAdjusted(t,"AT"),e==="GET")return[s+"["+t+"]",i.UNARY_POSTFIX];if(e==="GET_REMOVE")return[s+".removeAt("+t+")",i.UNARY_POSTFIX];if(e==="REMOVE")return s+".removeAt("+t+`);
`;break;case"FROM_END":if(t=n.getAdjusted(t,"AT",1,!1,i.ADDITIVE),e==="GET")return[s+"["+s+".length - "+t+"]",i.UNARY_POSTFIX];if(e==="GET_REMOVE"||e==="REMOVE"){if(t=s+".removeAt("+s+".length - "+t+")",e==="GET_REMOVE")return[t,i.UNARY_POSTFIX];if(e==="REMOVE")return t+`;
`}break;case"RANDOM":if(n.definitions_.import_dart_math="import 'dart:math' as Math;",e==="REMOVE")return e=n.nameDB_.getDistinctName("tmp_x",_.NameType$$module$build$src$core$names.VARIABLE),"int "+e+" = new Math.Random().nextInt("+s+`.length);
`+(s+".removeAt("+e+`);
`);if(e==="GET")return[n.provideFunction_("lists_get_random_item",`
dynamic ${n.FUNCTION_NAME_PLACEHOLDER_}(List my_list) {
  int x = new Math.Random().nextInt(my_list.length);
  return my_list[x];
}
`)+"("+s+")",i.UNARY_POSTFIX];if(e==="GET_REMOVE")return[n.provideFunction_("lists_remove_random_item",`
dynamic ${n.FUNCTION_NAME_PLACEHOLDER_}(List my_list) {
  int x = new Math.Random().nextInt(my_list.length);
  return my_list.removeAt(x);
}
`)+"("+s+")",i.UNARY_POSTFIX]}else{if(o==="RANDOM")return n.definitions_.import_dart_math="import 'dart:math' as Math;",e=r(),t=n.nameDB_.getDistinctName("tmp_x",_.NameType$$module$build$src$core$names.VARIABLE),e+("int "+t+" = new Math.Random().nextInt("+s+`.length);
`)+(s+".removeAt("+t+`);
`);if(e==="REMOVE")return e=n.getAdjusted(t,"AT",1,!1,i.ADDITIVE),r()+(s+".removeAt("+s+".length - "+e+`);
`);if(e==="GET")return e=n.getAdjusted(t,"AT",1),[n.provideFunction_("lists_get_from_end",`
dynamic ${n.FUNCTION_NAME_PLACEHOLDER_}(List my_list, num x) {
  x = my_list.length - x;
  return my_list[x];
}
`)+"("+s+", "+e+")",i.UNARY_POSTFIX];if(e==="GET_REMOVE")return e=n.getAdjusted(t,"AT",1),[n.provideFunction_("lists_remove_from_end",`
dynamic ${n.FUNCTION_NAME_PLACEHOLDER_}(List my_list, num x) {
  x = my_list.length - x;
  return my_list.removeAt(x);
}
`)+"("+s+", "+e+")",i.UNARY_POSTFIX]}throw Error("Unhandled combination (lists_getIndex).")},w=function(t,n){function r(){if(s.match(/^\w+$/))return"";const a=n.nameDB_.getDistinctName("tmp_list",_.NameType$$module$build$src$core$names.VARIABLE),g="List "+a+" = "+s+`;
`;return s=a,g}const e=t.getFieldValue("MODE")||"GET";var o=t.getFieldValue("WHERE")||"FROM_START";let s=n.valueToCode(t,"LIST",i.UNARY_POSTFIX)||"[]";const l=n.valueToCode(t,"TO",i.ASSIGNMENT)||"null";switch(o){case"FIRST":if(e==="SET")return s+"[0] = "+l+`;
`;if(e==="INSERT")return s+".insert(0, "+l+`);
`;break;case"LAST":if(e==="SET")return r()+(s+"["+s+".length - 1] = "+l+`;
`);if(e==="INSERT")return s+".add("+l+`);
`;break;case"FROM_START":if(t=n.getAdjusted(t,"AT"),e==="SET")return s+"["+t+"] = "+l+`;
`;if(e==="INSERT")return s+".insert("+t+", "+l+`);
`;break;case"FROM_END":if(t=n.getAdjusted(t,"AT",1,!1,i.ADDITIVE),o=r(),e==="SET")return o+(s+"["+s+".length - "+t+"] = "+l+`;
`);if(e==="INSERT")return o+(s+".insert("+s+".length - "+t+", "+l+`);
`);break;case"RANDOM":if(n.definitions_.import_dart_math="import 'dart:math' as Math;",t=r(),o=n.nameDB_.getDistinctName("tmp_x",_.NameType$$module$build$src$core$names.VARIABLE),t+="int "+o+" = new Math.Random().nextInt("+s+`.length);
`,e==="SET")return t+(s+"["+o+"] = "+l+`;
`);if(e==="INSERT")return t+(s+".insert("+o+", "+l+`);
`)}throw Error("Unhandled combination (lists_setIndex).")},$=function(t,n){const r=n.valueToCode(t,"LIST",i.UNARY_POSTFIX)||"[]";var e=t.getFieldValue("WHERE1");const o=t.getFieldValue("WHERE2");if(r.match(/^\w+$/)||e!=="FROM_END"&&o==="FROM_START"){switch(e){case"FROM_START":e=n.getAdjusted(t,"AT1");break;case"FROM_END":e=n.getAdjusted(t,"AT1",1,!1,i.ADDITIVE),e=r+".length - "+e;break;case"FIRST":e="0";break;default:throw Error("Unhandled option (lists_getSublist).")}switch(o){case"FROM_START":var s=n.getAdjusted(t,"AT2",1);break;case"FROM_END":s=n.getAdjusted(t,"AT2",0,!1,i.ADDITIVE),s=r+".length - "+s;break;case"LAST":break;default:throw Error("Unhandled option (lists_getSublist).")}n=o==="LAST"?r+".sublist("+e+")":r+".sublist("+e+", "+s+")"}else s=n.getAdjusted(t,"AT1"),t=n.getAdjusted(t,"AT2"),n=n.provideFunction_("lists_get_sublist",`
List ${n.FUNCTION_NAME_PLACEHOLDER_}(List list, String where1, num at1, String where2, num at2) {
  int getAt(String where, num at) {
    if (where == 'FROM_END') {
      at = list.length - 1 - at;
    } else if (where == 'FIRST') {
      at = 0;
    } else if (where == 'LAST') {
      at = list.length - 1;
    } else if (where != 'FROM_START') {
      throw 'Unhandled option (lists_getSublist).';
    }
    return at;
  }
  at1 = getAt(where1, at1);
  at2 = getAt(where2, at2) + 1;
  return list.sublist(at1, at2);
}
`)+"("+r+", '"+e+"', "+s+", '"+o+"', "+t+")";return[n,i.UNARY_POSTFIX]},m=function(t,n){const r=n.valueToCode(t,"LIST",i.NONE)||"[]",e=t.getFieldValue("DIRECTION")==="1"?1:-1;return t=t.getFieldValue("TYPE"),[n.provideFunction_("lists_sort",`
List ${n.FUNCTION_NAME_PLACEHOLDER_}(List list, String type, int direction) {
  var compareFuncs = {
    'NUMERIC': (a, b) => (direction * a.compareTo(b)).toInt(),
    'TEXT': (a, b) => direction * a.toString().compareTo(b.toString()),
    'IGNORE_CASE':
      (a, b) => direction *
      a.toString().toLowerCase().compareTo(b.toString().toLowerCase())
  };
  list = new List.from(list);
  var compare = compareFuncs[type];
  list.sort(compare);
  return list;
}
`)+"("+r+', "'+t+'", '+e+")",i.UNARY_POSTFIX]},I=function(t,n){let r=n.valueToCode(t,"INPUT",i.UNARY_POSTFIX);if(n=n.valueToCode(t,"DELIM",i.NONE)||"''",t=t.getFieldValue("MODE"),t==="SPLIT")r||(r="''"),t="split";else if(t==="JOIN")r||(r="[]"),t="join";else throw Error("Unknown mode: "+t);return[r+"."+t+"("+n+")",i.UNARY_POSTFIX]},P=function(t,n){return["new List.from("+(n.valueToCode(t,"LIST",i.NONE)||"[]")+".reversed)",i.UNARY_POSTFIX]},C=function(t,n){let r=0,e="",o,s;n.STATEMENT_PREFIX&&(e+=n.injectId(n.STATEMENT_PREFIX,t));do s=n.valueToCode(t,"IF"+r,i.NONE)||"false",o=n.statementToCode(t,"DO"+r),n.STATEMENT_SUFFIX&&(o=n.prefixLines(n.injectId(n.STATEMENT_SUFFIX,t),n.INDENT)+o),e+=(r>0?"else ":"")+"if ("+s+`) {
`+o+"}",r++;while(t.getInput("IF"+r));return(t.getInput("ELSE")||n.STATEMENT_SUFFIX)&&(o=t.getInput("ELSE")?n.statementToCode(t,"ELSE"):"",n.STATEMENT_SUFFIX&&(o=n.prefixLines(n.injectId(n.STATEMENT_SUFFIX,t),n.INDENT)+o),e+=` else {
`+o+"}"),e+`
`},Q=function(t,n){const r={EQ:"==",NEQ:"!=",LT:"<",LTE:"<=",GT:">",GTE:">="}[t.getFieldValue("OP")],e=r==="=="||r==="!="?i.EQUALITY:i.RELATIONAL,o=n.valueToCode(t,"A",e)||"0";return t=n.valueToCode(t,"B",e)||"0",[o+" "+r+" "+t,e]},W=function(t,n){const r=t.getFieldValue("OP")==="AND"?"&&":"||",e=r==="&&"?i.LOGICAL_AND:i.LOGICAL_OR;let o=n.valueToCode(t,"A",e);return t=n.valueToCode(t,"B",e),o||t?(n=r==="&&"?"true":"false",o||(o=n),t||(t=n)):t=o="false",[o+" "+r+" "+t,e]},k=function(t,n){const r=i.UNARY_PREFIX;return["!"+(n.valueToCode(t,"BOOL",r)||"true"),r]},G=function(t,n){return[t.getFieldValue("BOOL")==="TRUE"?"true":"false",i.ATOMIC]},R=function(t,n){return["null",i.ATOMIC]},b=function(t,n){const r=n.valueToCode(t,"IF",i.CONDITIONAL)||"false",e=n.valueToCode(t,"THEN",i.CONDITIONAL)||"null";return t=n.valueToCode(t,"ELSE",i.CONDITIONAL)||"null",[r+" ? "+e+" : "+t,i.CONDITIONAL]},x=function(t,n){let r;r=t.getField("TIMES")?String(Number(t.getFieldValue("TIMES"))):n.valueToCode(t,"TIMES",i.ASSIGNMENT)||"0";let e=n.statementToCode(t,"DO");e=n.addLoopTrap(e,t),t="";const o=n.nameDB_.getDistinctName("count",_.NameType$$module$build$src$core$names.VARIABLE);let s=r;return r.match(/^\w+$/)||_.isNumber$$module$build$src$core$utils$string(r)||(s=n.nameDB_.getDistinctName("repeat_end",_.NameType$$module$build$src$core$names.VARIABLE),t+="var "+s+" = "+r+`;
`),t+("for (int "+o+" = 0; "+o+" < "+s+"; "+o+`++) {
`+e+`}
`)},B=function(t,n){const r=t.getFieldValue("MODE")==="UNTIL";let e=n.valueToCode(t,"BOOL",r?i.UNARY_PREFIX:i.NONE)||"false",o=n.statementToCode(t,"DO");return o=n.addLoopTrap(o,t),r&&(e="!"+e),"while ("+e+`) {
`+o+`}
`},y=function(t,n){var r=n.getVariableName(t.getFieldValue("VAR")),e=n.valueToCode(t,"FROM",i.ASSIGNMENT)||"0",o=n.valueToCode(t,"TO",i.ASSIGNMENT)||"0";const s=n.valueToCode(t,"BY",i.ASSIGNMENT)||"1";let l=n.statementToCode(t,"DO");if(l=n.addLoopTrap(l,t),_.isNumber$$module$build$src$core$utils$string(e)&&_.isNumber$$module$build$src$core$utils$string(o)&&_.isNumber$$module$build$src$core$utils$string(s))n=Number(e)<=Number(o),t="for ("+r+" = "+e+"; "+r+(n?" <= ":" >= ")+o+"; "+r,r=Math.abs(Number(s)),t=r===1?t+(n?"++":"--"):t+((n?" += ":" -= ")+r),t+=`) {
`+l+`}
`;else{t="";let a=e;e.match(/^\w+$/)||_.isNumber$$module$build$src$core$utils$string(e)||(a=n.nameDB_.getDistinctName(r+"_start",_.NameType$$module$build$src$core$names.VARIABLE),t+="var "+a+" = "+e+`;
`),e=o,o.match(/^\w+$/)||_.isNumber$$module$build$src$core$utils$string(o)||(e=n.nameDB_.getDistinctName(r+"_end",_.NameType$$module$build$src$core$names.VARIABLE),t+="var "+e+" = "+o+`;
`),o=n.nameDB_.getDistinctName(r+"_inc",_.NameType$$module$build$src$core$names.VARIABLE),t+="num "+o+" = ",t=_.isNumber$$module$build$src$core$utils$string(s)?t+(Math.abs(Number(s))+`;
`):t+("("+s+`).abs();
`),t+="if ("+a+" > "+e+`) {
`,t+=n.INDENT+o+" = -"+o+`;
`,t=t+`}
for (`+(r+" = "+a+"; "+o+" >= 0 ? "+r+" <= "+e+" : "+r+" >= "+e+"; "+r+" += "+o+`) {
`+l+`}
`)}return t},E=function(t,n){const r=n.getVariableName(t.getFieldValue("VAR")),e=n.valueToCode(t,"LIST",i.ASSIGNMENT)||"[]";let o=n.statementToCode(t,"DO");return o=n.addLoopTrap(o,t),"for (var "+r+" in "+e+`) {
`+o+`}
`},T=function(t,n){let r="";if(n.STATEMENT_PREFIX&&(r+=n.injectId(n.STATEMENT_PREFIX,t)),n.STATEMENT_SUFFIX&&(r+=n.injectId(n.STATEMENT_SUFFIX,t)),n.STATEMENT_PREFIX){const e=t.getSurroundLoop();e&&!e.suppressPrefixSuffix&&(r+=n.injectId(n.STATEMENT_PREFIX,e))}switch(t.getFieldValue("FLOW")){case"BREAK":return r+`break;
`;case"CONTINUE":return r+`continue;
`}throw Error("Unknown flow statement.")},A=function(t,n){return t=Number(t.getFieldValue("NUM")),t===1/0?["double.infinity",i.UNARY_POSTFIX]:t===-1/0?["-double.infinity",i.UNARY_PREFIX]:[String(t),t<0?i.UNARY_PREFIX:i.ATOMIC]},F=function(t,n){var r={ADD:[" + ",i.ADDITIVE],MINUS:[" - ",i.ADDITIVE],MULTIPLY:[" * ",i.MULTIPLICATIVE],DIVIDE:[" / ",i.MULTIPLICATIVE],POWER:[null,i.NONE]}[t.getFieldValue("OP")];const e=r[0];r=r[1];const o=n.valueToCode(t,"A",r)||"0";return t=n.valueToCode(t,"B",r)||"0",e?[o+e+t,r]:(n.definitions_.import_dart_math="import 'dart:math' as Math;",["Math.pow("+o+", "+t+")",i.UNARY_POSTFIX])},U=function(t,n){const r=t.getFieldValue("OP");let e;if(r==="NEG")return t=n.valueToCode(t,"NUM",i.UNARY_PREFIX)||"0",t[0]==="-"&&(t=" "+t),["-"+t,i.UNARY_PREFIX];switch(n.definitions_.import_dart_math="import 'dart:math' as Math;",t=r==="ABS"||r.substring(0,5)==="ROUND"?n.valueToCode(t,"NUM",i.UNARY_POSTFIX)||"0":r==="SIN"||r==="COS"||r==="TAN"?n.valueToCode(t,"NUM",i.MULTIPLICATIVE)||"0":n.valueToCode(t,"NUM",i.NONE)||"0",r){case"ABS":e=t+".abs()";break;case"ROOT":e="Math.sqrt("+t+")";break;case"LN":e="Math.log("+t+")";break;case"EXP":e="Math.exp("+t+")";break;case"POW10":e="Math.pow(10,"+t+")";break;case"ROUND":e=t+".round()";break;case"ROUNDUP":e=t+".ceil()";break;case"ROUNDDOWN":e=t+".floor()";break;case"SIN":e="Math.sin("+t+" / 180 * Math.pi)";break;case"COS":e="Math.cos("+t+" / 180 * Math.pi)";break;case"TAN":e="Math.tan("+t+" / 180 * Math.pi)"}if(e)return[e,i.UNARY_POSTFIX];switch(r){case"LOG10":e="Math.log("+t+") / Math.log(10)";break;case"ASIN":e="Math.asin("+t+") / Math.pi * 180";break;case"ACOS":e="Math.acos("+t+") / Math.pi * 180";break;case"ATAN":e="Math.atan("+t+") / Math.pi * 180";break;default:throw Error("Unknown math operator: "+r)}return[e,i.MULTIPLICATIVE]},Z=function(t,n){const r={PI:["Math.pi",i.UNARY_POSTFIX],E:["Math.e",i.UNARY_POSTFIX],GOLDEN_RATIO:["(1 + Math.sqrt(5)) / 2",i.MULTIPLICATIVE],SQRT2:["Math.sqrt2",i.UNARY_POSTFIX],SQRT1_2:["Math.sqrt1_2",i.UNARY_POSTFIX],INFINITY:["double.infinity",i.ATOMIC]};return t=t.getFieldValue("CONSTANT"),t!=="INFINITY"&&(n.definitions_.import_dart_math="import 'dart:math' as Math;"),r[t]},_e=function(t,n){var r={EVEN:[" % 2 == 0",i.MULTIPLICATIVE,i.EQUALITY],ODD:[" % 2 == 1",i.MULTIPLICATIVE,i.EQUALITY],WHOLE:[" % 1 == 0",i.MULTIPLICATIVE,i.EQUALITY],POSITIVE:[" > 0",i.RELATIONAL,i.RELATIONAL],NEGATIVE:[" < 0",i.RELATIONAL,i.RELATIONAL],DIVISIBLE_BY:[null,i.MULTIPLICATIVE,i.EQUALITY],PRIME:[null,i.NONE,i.UNARY_POSTFIX]};const e=t.getFieldValue("PROPERTY"),[o,s,l]=r[e];if(r=n.valueToCode(t,"NUMBER_TO_CHECK",s)||"0",e==="PRIME")n.definitions_.import_dart_math="import 'dart:math' as Math;",t=n.provideFunction_("math_isPrime",`
bool ${n.FUNCTION_NAME_PLACEHOLDER_}(n) {
  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if (n == 2 || n == 3) {
    return true;
  }
  // False if n is null, negative, is 1, or not whole.
  // And false if n is divisible by 2 or 3.
  if (n == null || n <= 1 || n % 1 != 0 || n % 2 == 0 || n % 3 == 0) {
    return false;
  }
  // Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for (var x = 6; x <= Math.sqrt(n) + 1; x += 6) {
    if (n % (x - 1) == 0 || n % (x + 1) == 0) {
      return false;
    }
  }
  return true;
}
`)+"("+r+")";else if(e==="DIVISIBLE_BY"){if(t=n.valueToCode(t,"DIVISOR",i.MULTIPLICATIVE)||"0",t==="0")return["false",i.ATOMIC];t=r+" % "+t+" == 0"}else t=r+o;return[t,l]},ue=function(t,n){const r=n.valueToCode(t,"DELTA",i.ADDITIVE)||"0";return t=n.getVariableName(t.getFieldValue("VAR")),t+" = ("+t+" is num ? "+t+" : 0) + "+r+`;
`},X=function(t,n){const r=t.getFieldValue("OP");switch(t=n.valueToCode(t,"LIST",i.NONE)||"[]",r){case"SUM":n=n.provideFunction_("math_sum",`
num ${n.FUNCTION_NAME_PLACEHOLDER_}(List<num> myList) {
  num sumVal = 0;
  myList.forEach((num entry) {sumVal += entry;});
  return sumVal;
}
`)+"("+t+")";break;case"MIN":n.definitions_.import_dart_math="import 'dart:math' as Math;",n=n.provideFunction_("math_min",`
num ${n.FUNCTION_NAME_PLACEHOLDER_}(List<num> myList) {
  if (myList.isEmpty) return null;
  num minVal = myList[0];
  myList.forEach((num entry) {minVal = Math.min(minVal, entry);});
  return minVal;
}
`)+"("+t+")";break;case"MAX":n.definitions_.import_dart_math="import 'dart:math' as Math;",n=n.provideFunction_("math_max",`
num ${n.FUNCTION_NAME_PLACEHOLDER_}(List<num> myList) {
  if (myList.isEmpty) return null;
  num maxVal = myList[0];
  myList.forEach((num entry) {maxVal = Math.max(maxVal, entry);});
  return maxVal;
}
`)+"("+t+")";break;case"AVERAGE":n=n.provideFunction_("math_mean",`
num ${n.FUNCTION_NAME_PLACEHOLDER_}(List myList) {
  // First filter list for numbers only.
  List localList = new List.from(myList);
  localList.removeWhere((a) => a is! num);
  if (localList.isEmpty) return null;
  num sumVal = 0;
  localList.forEach((var entry) {sumVal += entry;});
  return sumVal / localList.length;
}
`)+"("+t+")";break;case"MEDIAN":n=n.provideFunction_("math_median",`
num ${n.FUNCTION_NAME_PLACEHOLDER_}(List myList) {
  // First filter list for numbers only, then sort, then return middle value
  // or the average of two middle values if list has an even number of elements.
  List localList = new List.from(myList);
  localList.removeWhere((a) => a is! num);
  if (localList.isEmpty) return null;
  localList.sort((a, b) => (a - b));
  int index = localList.length ~/ 2;
  if (localList.length % 2 == 1) {
    return localList[index];
  } else {
    return (localList[index - 1] + localList[index]) / 2;
  }
}
`)+"("+t+")";break;case"MODE":n.definitions_.import_dart_math="import 'dart:math' as Math;",n=n.provideFunction_("math_modes",`
List ${n.FUNCTION_NAME_PLACEHOLDER_}(List values) {
  List modes = [];
  List counts = [];
  int maxCount = 0;
  for (int i = 0; i < values.length; i++) {
    var value = values[i];
    bool found = false;
    int thisCount;
    for (int j = 0; j < counts.length; j++) {
      if (counts[j][0] == value) {
        thisCount = ++counts[j][1];
        found = true;
        break;
      }
    }
    if (!found) {
      counts.add([value, 1]);
      thisCount = 1;
    }
    maxCount = Math.max(thisCount, maxCount);
  }
  for (int j = 0; j < counts.length; j++) {
    if (counts[j][1] == maxCount) {
        modes.add(counts[j][0]);
    }
  }
  return modes;
}
`)+"("+t+")";break;case"STD_DEV":n.definitions_.import_dart_math="import 'dart:math' as Math;",n=n.provideFunction_("math_standard_deviation",`
num ${n.FUNCTION_NAME_PLACEHOLDER_}(List myList) {
  // First filter list for numbers only.
  List numbers = new List.from(myList);
  numbers.removeWhere((a) => a is! num);
  if (numbers.isEmpty) return null;
  num n = numbers.length;
  num sum = 0;
  numbers.forEach((x) => sum += x);
  num mean = sum / n;
  num sumSquare = 0;
  numbers.forEach((x) => sumSquare += Math.pow(x - mean, 2));
  return Math.sqrt(sumSquare / n);
}
`)+"("+t+")";break;case"RANDOM":n.definitions_.import_dart_math="import 'dart:math' as Math;",n=n.provideFunction_("math_random_item",`
dynamic ${n.FUNCTION_NAME_PLACEHOLDER_}(List myList) {
  int x = new Math.Random().nextInt(myList.length);
  return myList[x];
}
`)+"("+t+")";break;default:throw Error("Unknown operator: "+r)}return[n,i.UNARY_POSTFIX]},J=function(t,n){const r=n.valueToCode(t,"DIVIDEND",i.MULTIPLICATIVE)||"0";return t=n.valueToCode(t,"DIVISOR",i.MULTIPLICATIVE)||"0",[r+" % "+t,i.MULTIPLICATIVE]},Ne=function(t,n){n.definitions_.import_dart_math="import 'dart:math' as Math;";const r=n.valueToCode(t,"VALUE",i.NONE)||"0",e=n.valueToCode(t,"LOW",i.NONE)||"0";return t=n.valueToCode(t,"HIGH",i.NONE)||"double.infinity",["Math.min(Math.max("+r+", "+e+"), "+t+")",i.UNARY_POSTFIX]},ee=function(t,n){n.definitions_.import_dart_math="import 'dart:math' as Math;";const r=n.valueToCode(t,"FROM",i.NONE)||"0";return t=n.valueToCode(t,"TO",i.NONE)||"0",[n.provideFunction_("math_random_int",`
int ${n.FUNCTION_NAME_PLACEHOLDER_}(num a, num b) {
  if (a > b) {
    // Swap a and b to ensure a is smaller.
    num c = a;
    a = b;
    b = c;
  }
  return new Math.Random().nextInt(b - a + 1) + a;
}
`)+"("+r+", "+t+")",i.UNARY_POSTFIX]},ve=function(t,n){return n.definitions_.import_dart_math="import 'dart:math' as Math;",["new Math.Random().nextDouble()",i.UNARY_POSTFIX]},pe=function(t,n){n.definitions_.import_dart_math="import 'dart:math' as Math;";const r=n.valueToCode(t,"X",i.NONE)||"0";return["Math.atan2("+(n.valueToCode(t,"Y",i.NONE)||"0")+", "+r+") / Math.pi * 180",i.MULTIPLICATIVE]},de=function(t,n){const r=n.getProcedureName(t.getFieldValue("NAME"));var e="";n.STATEMENT_PREFIX&&(e+=n.injectId(n.STATEMENT_PREFIX,t)),n.STATEMENT_SUFFIX&&(e+=n.injectId(n.STATEMENT_SUFFIX,t)),e&&(e=n.prefixLines(e,n.INDENT));let o="";n.INFINITE_LOOP_TRAP&&(o=n.prefixLines(n.injectId(n.INFINITE_LOOP_TRAP,t),n.INDENT));let s="";t.getInput("STACK")&&(s=n.statementToCode(t,"STACK"));let l="";t.getInput("RETURN")&&(l=n.valueToCode(t,"RETURN",i.NONE)||"");let a="";s&&l&&(a=e),l&&(l=n.INDENT+"return "+l+`;
`);const g=l?"dynamic":"void",D=[],j=t.getVars();for(let K=0;K<j.length;K++)D[K]=n.getVariableName(j[K]);return e=g+" "+r+"("+D.join(", ")+`) {
`+e+o+s+a+l+"}",e=n.scrub_(t,e),n.definitions_["%"+r]=e,null},Te=function(t,n){const r=n.getProcedureName(t.getFieldValue("NAME")),e=[],o=t.getVars();for(let s=0;s<o.length;s++)e[s]=n.valueToCode(t,"ARG"+s,i.NONE)||"null";return[r+"("+e.join(", ")+")",i.UNARY_POSTFIX]},Ie=function(t,n){return n.forBlock.procedures_callreturn(t,n)[0]+`;
`},he=function(t,n){let r="if ("+(n.valueToCode(t,"CONDITION",i.NONE)||"false")+`) {
`;return n.STATEMENT_SUFFIX&&(r+=n.prefixLines(n.injectId(n.STATEMENT_SUFFIX,t),n.INDENT)),t.hasReturnValue_?(t=n.valueToCode(t,"VALUE",i.NONE)||"null",r+=n.INDENT+"return "+t+`;
`):r+=n.INDENT+`return;
`,r+`}
`},Oe=function(t,n){return[n.quote_(t.getFieldValue("TEXT")),i.ATOMIC]},Se=function(t,n){switch(t.itemCount_){case 0:return["''",i.ATOMIC];case 1:return[(n.valueToCode(t,"ADD0",i.UNARY_POSTFIX)||"''")+".toString()",i.UNARY_POSTFIX];default:const r=Array(t.itemCount_);for(let e=0;e<t.itemCount_;e++)r[e]=n.valueToCode(t,"ADD"+e,i.NONE)||"''";return["["+r.join(",")+"].join()",i.UNARY_POSTFIX]}},Ae=function(t,n){const r=n.getVariableName(t.getFieldValue("VAR"));return t=n.valueToCode(t,"TEXT",i.NONE)||"''",r+" = ["+r+", "+t+`].join();
`},te=function(t,n){return[(n.valueToCode(t,"VALUE",i.UNARY_POSTFIX)||"''")+".length",i.UNARY_POSTFIX]},Me=function(t,n){return[(n.valueToCode(t,"VALUE",i.UNARY_POSTFIX)||"''")+".isEmpty",i.UNARY_POSTFIX]},ge=function(t,n){const r=t.getFieldValue("END")==="FIRST"?"indexOf":"lastIndexOf",e=n.valueToCode(t,"FIND",i.NONE)||"''";return n=(n.valueToCode(t,"VALUE",i.UNARY_POSTFIX)||"''")+"."+r+"("+e+")",t.workspace.options.oneBasedIndex?[n+" + 1",i.ADDITIVE]:[n,i.UNARY_POSTFIX]},fe=function(t,n){const r=t.getFieldValue("WHERE")||"FROM_START",e=n.valueToCode(t,"VALUE",r==="FIRST"||r==="FROM_START"?i.UNARY_POSTFIX:i.NONE)||"''";switch(r){case"FIRST":return[e+"[0]",i.UNARY_POSTFIX];case"FROM_START":return t=n.getAdjusted(t,"AT"),[e+"["+t+"]",i.UNARY_POSTFIX];case"LAST":case"FROM_END":return t=r==="LAST"?1:n.getAdjusted(t,"AT",1),[`${n.provideFunction_("text_get_from_end",`
String ${n.FUNCTION_NAME_PLACEHOLDER_}(String text, num x) {
  return text[text.length - x];
}
`)}(${e}, ${t})`,i.UNARY_POSTFIX];case"RANDOM":return n.definitions_.import_dart_math="import 'dart:math' as Math;",[n.provideFunction_("text_random_letter",`
String ${n.FUNCTION_NAME_PLACEHOLDER_}(String text) {
  int x = new Math.Random().nextInt(text.length);
  return text[x];
}
`)+"("+e+")",i.UNARY_POSTFIX]}throw Error("Unhandled option (text_charAt).")},Ce=function(t,n){var r=t.getFieldValue("WHERE1");const e=t.getFieldValue("WHERE2"),o=r!=="FROM_END"&&e==="FROM_START",s=n.valueToCode(t,"STRING",o?i.UNARY_POSTFIX:i.NONE)||"''";if(r==="FIRST"&&e==="LAST")return[s,i.NONE];if(s.match(/^'?\w+'?$/)||o){switch(r){case"FROM_START":r=n.getAdjusted(t,"AT1");break;case"FROM_END":r=n.getAdjusted(t,"AT1",1,!1,i.ADDITIVE),r=s+".length - "+r;break;case"FIRST":r="0";break;default:throw Error("Unhandled option (text_getSubstring).")}switch(e){case"FROM_START":var l=n.getAdjusted(t,"AT2",1);break;case"FROM_END":l=n.getAdjusted(t,"AT2",0,!1,i.ADDITIVE),l=s+".length - "+l;break;case"LAST":break;default:throw Error("Unhandled option (text_getSubstring).")}n=e==="LAST"?s+".substring("+r+")":s+".substring("+r+", "+l+")"}else l=n.getAdjusted(t,"AT1"),t=n.getAdjusted(t,"AT2"),n=n.provideFunction_("text_get_substring",`
String ${n.FUNCTION_NAME_PLACEHOLDER_}(String text, String where1, num at1, String where2, num at2) {
  int getAt(String where, num at) {
    if (where == 'FROM_END') {
      at = text.length - 1 - at;
    } else if (where == 'FIRST') {
      at = 0;
    } else if (where == 'LAST') {
      at = text.length - 1;
    } else if (where != 'FROM_START') {
      throw 'Unhandled option (text_getSubstring).';
    }
    return at;
  }
  at1 = getAt(where1, at1);
  at2 = getAt(where2, at2) + 1;
  return text.substring(at1, at2);
}
`)+"("+s+", '"+r+"', "+l+", '"+e+"', "+t+")";return[n,i.UNARY_POSTFIX]},Le=function(t,n){const r={UPPERCASE:".toUpperCase()",LOWERCASE:".toLowerCase()",TITLECASE:null}[t.getFieldValue("CASE")];return t=n.valueToCode(t,"TEXT",r?i.UNARY_POSTFIX:i.NONE)||"''",[r?t+r:n.provideFunction_("text_toTitleCase",`
String ${n.FUNCTION_NAME_PLACEHOLDER_}(String str) {
  RegExp exp = new RegExp(r'\\b');
  List<String> list = str.split(exp);
  final title = new StringBuffer();
  for (String part in list) {
    if (part.length > 0) {
      title.write(part[0].toUpperCase());
      if (part.length > 0) {
        title.write(part.substring(1).toLowerCase());
      }
    }
  }
  return title.toString();
}
`)+"("+t+")",i.UNARY_POSTFIX]},Re=function(t,n){const r={LEFT:".replaceFirst(new RegExp(r'^\\s+'), '')",RIGHT:".replaceFirst(new RegExp(r'\\s+$'), '')",BOTH:".trim()"}[t.getFieldValue("MODE")];return[(n.valueToCode(t,"TEXT",i.UNARY_POSTFIX)||"''")+r,i.UNARY_POSTFIX]},Fe=function(t,n){return"print("+(n.valueToCode(t,"TEXT",i.NONE)||"''")+`);
`},Ee=function(t,n){n.definitions_.import_dart_html="import 'dart:html' as Html;";let r="Html.window.prompt("+(t.getField("TEXT")?n.quote_(t.getFieldValue("TEXT")):n.valueToCode(t,"TEXT",i.NONE)||"''")+", '')";return t.getFieldValue("TYPE")==="NUMBER"&&(n.definitions_.import_dart_math="import 'dart:math' as Math;",r="Math.parseDouble("+r+")"),[r,i.UNARY_POSTFIX]},me=function(t,n){const r=n.valueToCode(t,"TEXT",i.NONE)||"''";return t=n.valueToCode(t,"SUB",i.NONE)||"''",[n.provideFunction_("text_count",`
int ${n.FUNCTION_NAME_PLACEHOLDER_}(String haystack, String needle) {
  if (needle.length == 0) {
    return haystack.length + 1;
  }
  int index = 0;
  int count = 0;
  while (index != -1) {
    index = haystack.indexOf(needle, index);
    if (index != -1) {
      count++;
     index += needle.length;
    }
  }
  return count;
}
`)+"("+r+", "+t+")",i.UNARY_POSTFIX]},re=function(t,n){const r=n.valueToCode(t,"TEXT",i.UNARY_POSTFIX)||"''",e=n.valueToCode(t,"FROM",i.NONE)||"''";return t=n.valueToCode(t,"TO",i.NONE)||"''",[r+".replaceAll("+e+", "+t+")",i.UNARY_POSTFIX]},De=function(t,n){return["new String.fromCharCodes("+(n.valueToCode(t,"TEXT",i.UNARY_POSTFIX)||"''")+".runes.toList().reversed)",i.UNARY_PREFIX]},ae=function(t,n){return[n.getVariableName(t.getFieldValue("VAR")),i.ATOMIC]},ie=function(t,n){const r=n.valueToCode(t,"VALUE",i.ASSIGNMENT)||"0";return n.getVariableName(t.getFieldValue("VAR"))+" = "+r+`;
`},i;(function(t){t[t.ATOMIC=0]="ATOMIC",t[t.UNARY_POSTFIX=1]="UNARY_POSTFIX",t[t.UNARY_PREFIX=2]="UNARY_PREFIX",t[t.MULTIPLICATIVE=3]="MULTIPLICATIVE",t[t.ADDITIVE=4]="ADDITIVE",t[t.SHIFT=5]="SHIFT",t[t.BITWISE_AND=6]="BITWISE_AND",t[t.BITWISE_XOR=7]="BITWISE_XOR",t[t.BITWISE_OR=8]="BITWISE_OR",t[t.RELATIONAL=9]="RELATIONAL",t[t.EQUALITY=10]="EQUALITY",t[t.LOGICAL_AND=11]="LOGICAL_AND",t[t.LOGICAL_OR=12]="LOGICAL_OR",t[t.IF_NULL=13]="IF_NULL",t[t.CONDITIONAL=14]="CONDITIONAL",t[t.CASCADE=15]="CASCADE",t[t.ASSIGNMENT=16]="ASSIGNMENT",t[t.NONE=99]="NONE"})(i||(i={}));var u=class extends _.CodeGenerator$$module$build$src$core$generator{constructor(t="Dart"){super(t),this.isInitialized=!1;for(const n in i)t=i[n],typeof t!="string"&&(this["ORDER_"+n]=t);this.addReservedWords("assert,break,case,catch,class,const,continue,default,do,else,enum,extends,false,final,finally,for,if,in,is,new,null,rethrow,return,super,switch,this,throw,true,try,var,void,while,with,print,identityHashCode,identical,BidirectionalIterator,Comparable,double,Function,int,Invocation,Iterable,Iterator,List,Map,Match,num,Pattern,RegExp,Set,StackTrace,String,StringSink,Type,bool,DateTime,Deprecated,Duration,Expando,Null,Object,RuneIterator,Runes,Stopwatch,StringBuffer,Symbol,Uri,Comparator,AbstractClassInstantiationError,ArgumentError,AssertionError,CastError,ConcurrentModificationError,CyclicInitializationError,Error,Exception,FallThroughError,FormatException,IntegerDivisionByZeroException,NoSuchMethodError,NullThrownError,OutOfMemoryError,RangeError,StackOverflowError,StateError,TypeError,UnimplementedError,UnsupportedError")}init(t){super.init(t),this.nameDB_?this.nameDB_.reset():this.nameDB_=new _.Names$$module$build$src$core$names(this.RESERVED_WORDS_),this.nameDB_.setVariableMap(t.getVariableMap()),this.nameDB_.populateVariables(t),this.nameDB_.populateProcedures(t);const n=[];var r=_.allDeveloperVariables$$module$build$src$core$variables(t);for(let e=0;e<r.length;e++)n.push(this.nameDB_.getName(r[e],_.NameType$$module$build$src$core$names.DEVELOPER_VARIABLE));for(t=_.allUsedVarModels$$module$build$src$core$variables(t),r=0;r<t.length;r++)n.push(this.nameDB_.getName(t[r].getId(),_.NameType$$module$build$src$core$names.VARIABLE));n.length&&(this.definitions_.variables="var "+n.join(", ")+";"),this.isInitialized=!0}finish(t){t&&(t=this.prefixLines(t,this.INDENT)),t=`main() {
`+t+"}";const n=[],r=[];for(let e in this.definitions_){const o=this.definitions_[e];o.match(/^import\s/)?n.push(o):r.push(o)}return t=super.finish(t),this.isInitialized=!1,this.nameDB_.reset(),(n.join(`
`)+`

`+r.join(`

`)).replace(/\n\n+/g,`

`).replace(/\n*$/,`


`)+t}scrubNakedValue(t){return t+`;
`}quote_(t){return t=t.replace(/\\/g,"\\\\").replace(/\n/g,`\\
`).replace(/\$/g,"\\$").replace(/'/g,"\\'"),"'"+t+"'"}multiline_quote_(t){return t.split(/\n/g).map(this.quote_).join(` + '\\n' + 
`)}scrub_(t,n,r=!1){let e="";if(!t.outputConnection||!t.outputConnection.targetConnection){var o=t.getCommentText();o&&(o=_.wrap$$module$build$src$core$utils$string(o,this.COMMENT_WRAP-3),e="getProcedureDef"in t?e+this.prefixLines(o+`
`,"/// "):e+this.prefixLines(o+`
`,"// "));for(let s=0;s<t.inputList.length;s++)t.inputList[s].type===_.inputTypes$$module$build$src$core$inputs$input_types.VALUE&&(o=t.inputList[s].connection.targetBlock())&&(o=this.allNestedComments(o))&&(e+=this.prefixLines(o,"// "))}return t=t.nextConnection&&t.nextConnection.targetBlock(),r=r?"":this.blockToCode(t),e+n+r}getAdjusted(t,n,r=0,e=!1,o=i.NONE){t.workspace.options.oneBasedIndex&&r--;const s=t.workspace.options.oneBasedIndex?"1":"0";let l=o;return r?l=i.ADDITIVE:e&&(l=i.UNARY_PREFIX),t=this.valueToCode(t,n,l)||s,r===0&&!e?t:_.isNumber$$module$build$src$core$utils$string(t)?(t=String(Number(t)+r),e&&(t=String(-Number(t))),t):(r>0?t=`${t} + ${r}`:r<0&&(t=`${t} - ${-r}`),e&&(t=r?`-(${t})`:`-${t}`),Math.floor(o)>=Math.floor(l)&&(t=`(${t})`),t)}},L={};L.lists_create_empty=$e,L.lists_create_with=q,L.lists_getIndex=V,L.lists_getSublist=$,L.lists_indexOf=O,L.lists_isEmpty=f,L.lists_length=ne,L.lists_repeat=le,L.lists_reverse=P,L.lists_setIndex=w,L.lists_sort=m,L.lists_split=I;var v={};v.controls_if=C,v.controls_ifelse=C,v.logic_boolean=G,v.logic_compare=Q,v.logic_negate=k,v.logic_null=R,v.logic_operation=W,v.logic_ternary=b;var S={};S.controls_flow_statements=T,S.controls_for=y,S.controls_forEach=E,S.controls_repeat=x,S.controls_repeat_ext=x,S.controls_whileUntil=B;var p={};p.math_arithmetic=F,p.math_atan2=pe,p.math_change=ue,p.math_constant=Z,p.math_constrain=Ne,p.math_modulo=J,p.math_number=A,p.math_number_property=_e,p.math_on_list=X,p.math_random_float=ve,p.math_random_int=ee,p.math_round=U,p.math_single=U,p.math_trig=U;var H={};H.procedures_callnoreturn=Ie,H.procedures_callreturn=Te,H.procedures_defnoreturn=de,H.procedures_defreturn=de,H.procedures_ifreturn=he;var c={};c.text=Oe,c.text_append=Ae,c.text_changeCase=Le,c.text_charAt=fe,c.text_count=me,c.text_getSubstring=Ce,c.text_indexOf=ge,c.text_isEmpty=Me,c.text_join=Se,c.text_length=te,c.text_print=Fe,c.text_prompt=Ee,c.text_prompt_ext=Ee,c.text_replace=re,c.text_reverse=De,c.text_trim=Re;var d={};d.variables_get=ae,d.variables_set=ie;var N={};N.variables_get_dynamic=ae,N.variables_set_dynamic=ie;var h=new u;h.addReservedWords("Html,Math");var M=Object.assign({},L,v,S,p,H,c,d,N);for(const t in M)h.forBlock[t]=M[t];var Y={};return Y.DartGenerator=u,Y.Order=i,Y.dartGenerator=h,Y.__namespace__=_,Y})})(be)),be.exports}var we={exports:{}},et=we.exports,Xe;function tt(){return Xe||(Xe=1,(function(oe,ye){(function(z,_){oe.exports=_(Ue())})(et,function(z){var _=z.__namespace__,$e=function(e,o){return["{}",u.HIGH]},q=function(e,o){const s=Array(e.itemCount_);for(let l=0;l<e.itemCount_;l++)s[l]=o.valueToCode(e,"ADD"+l,u.NONE)||"nil";return["{"+s.join(", ")+"}",u.HIGH]},le=function(e,o){const s=o.provideFunction_("create_list_repeated",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(item, count)
  local t = {}
  for i = 1, count do
    table.insert(t, item)
  end
  return t
end
  `),l=o.valueToCode(e,"ITEM",u.NONE)||"nil";return e=o.valueToCode(e,"NUM",u.NONE)||"0",[s+"("+l+", "+e+")",u.HIGH]},ne=function(e,o){return["#"+(o.valueToCode(e,"VALUE",u.UNARY)||"{}"),u.UNARY]},f=function(e,o){return["#"+(o.valueToCode(e,"VALUE",u.UNARY)||"{}")+" == 0",u.RELATIONAL]},O=function(e,o){const s=o.valueToCode(e,"FIND",u.NONE)||"''",l=o.valueToCode(e,"VALUE",u.NONE)||"{}";return[(e.getFieldValue("END")==="FIRST"?o.provideFunction_("first_index",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t, elem)
  for k, v in ipairs(t) do
    if v == elem then
      return k
    end
  end
  return 0
end
`):o.provideFunction_("last_index",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t, elem)
  for i = #t, 1, -1 do
    if t[i] == elem then
      return i
    end
  end
  return 0
end
`))+"("+l+", "+s+")",u.HIGH]},V=function(e,o){var s=e.getFieldValue("MODE")||"GET",l=e.getFieldValue("WHERE")||"FROM_START";const a=o.valueToCode(e,"VALUE",u.HIGH)||"({})";return l!=="LAST"&&l!=="FROM_END"&&l!=="RANDOM"||a.match(/^\w+$/)?(o=o.valueToCode(e,"AT",s==="GET"&&l==="FROM_END"?u.ADDITIVE:u.NONE)||"1",o=v(a,l,o),s==="GET"?[a+"["+o+"]",u.HIGH]:(l="table.remove("+a+", "+o+")",s==="GET_REMOVE"?[l,u.HIGH]:l+`
`)):s==="REMOVE"?(s=o.valueToCode(e,"AT",l==="FROM_END"?u.ADDITIVE:u.NONE)||"1",o=o.nameDB_.getDistinctName("tmp_list",_.NameType$$module$build$src$core$names.VARIABLE),s=v(o,l,s),o+" = "+a+`
table.remove(`+o+", "+s+`)
`):(e=o.valueToCode(e,"AT",u.NONE)||"1",[(s==="GET"?o.provideFunction_("list_get_"+l.toLowerCase(),["function "+o.FUNCTION_NAME_PLACEHOLDER_+"(t"+(l==="FROM_END"||l==="FROM_START"?", at)":")"),"  return t["+v("t",l,"at")+"]","end"]):o.provideFunction_("list_remove_"+l.toLowerCase(),["function "+o.FUNCTION_NAME_PLACEHOLDER_+"(t"+(l==="FROM_END"||l==="FROM_START"?", at)":")"),"  return table.remove(t, "+v("t",l,"at")+")","end"]))+"("+a+(l==="FROM_END"||l==="FROM_START"?", "+e:"")+")",u.HIGH])},w=function(e,o){let s=o.valueToCode(e,"LIST",u.HIGH)||"{}";const l=e.getFieldValue("MODE")||"SET",a=e.getFieldValue("WHERE")||"FROM_START",g=o.valueToCode(e,"AT",u.ADDITIVE)||"1";e=o.valueToCode(e,"TO",u.NONE)||"Nil";let D="";return a!=="LAST"&&a!=="FROM_END"&&a!=="RANDOM"||s.match(/^\w+$/)||(o=o.nameDB_.getDistinctName("tmp_list",_.NameType$$module$build$src$core$names.VARIABLE),D=o+" = "+s+`
`,s=o),D=l==="SET"?D+(s+"["+v(s,a,g)+"] = "+e):D+("table.insert("+s+", "+(v(s,a,g)+(a==="LAST"?" + 1":""))+", "+e+")"),D+`
`},$=function(e,o){const s=o.valueToCode(e,"LIST",u.NONE)||"{}",l=e.getFieldValue("WHERE1"),a=e.getFieldValue("WHERE2"),g=o.valueToCode(e,"AT1",u.NONE)||"1";e=o.valueToCode(e,"AT2",u.NONE)||"1";const D=l==="FROM_END"||l==="FROM_START"?", at1":"",j=a==="FROM_END"||a==="FROM_START"?", at2":"";return[o.provideFunction_("list_sublist_"+l.toLowerCase()+"_"+a.toLowerCase(),`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(source${D}${j})
  local t = {}
  local start = ${v("source",l,"at1")}
  local finish = ${v("source",a,"at2")}
  for i = start, finish do
    table.insert(t, source[i])
  end
  return t
end
`)+"("+s+(l==="FROM_END"||l==="FROM_START"?", "+g:"")+(a==="FROM_END"||a==="FROM_START"?", "+e:"")+")",u.HIGH]},m=function(e,o){const s=o.valueToCode(e,"LIST",u.NONE)||"{}",l=e.getFieldValue("DIRECTION")==="1"?1:-1;return e=e.getFieldValue("TYPE"),[o.provideFunction_("list_sort",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(list, typev, direction)
  local t = {}
  for n,v in pairs(list) do table.insert(t, v) end
  local compareFuncs = {
    NUMERIC = function(a, b)
      return (tonumber(tostring(a)) or 0)
          < (tonumber(tostring(b)) or 0) end,
    TEXT = function(a, b)
      return tostring(a) < tostring(b) end,
    IGNORE_CASE = function(a, b)
      return string.lower(tostring(a)) < string.lower(tostring(b)) end
  }
  local compareTemp = compareFuncs[typev]
  local compare = compareTemp
  if direction == -1
  then compare = function(a, b) return compareTemp(b, a) end
  end
  table.sort(t, compare)
  return t
end
`)+"("+s+',"'+e+'", '+l+")",u.HIGH]},I=function(e,o){let s=o.valueToCode(e,"INPUT",u.NONE);const l=o.valueToCode(e,"DELIM",u.NONE)||"''";if(e=e.getFieldValue("MODE"),e==="SPLIT")s||(s="''"),o=o.provideFunction_("list_string_split",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(input, delim)
  local t = {}
  local pos = 1
  while true do
    next_delim = string.find(input, delim, pos)
    if next_delim == nil then
      table.insert(t, string.sub(input, pos))
      break
    else
      table.insert(t, string.sub(input, pos, next_delim-1))
      pos = next_delim + #delim
    end
  end
  return t
end
`);else if(e==="JOIN")s||(s="{}"),o="table.concat";else throw Error("Unknown mode: "+e);return[o+"("+s+", "+l+")",u.HIGH]},P=function(e,o){return e=o.valueToCode(e,"LIST",u.NONE)||"{}",[o.provideFunction_("list_reverse",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(input)
  local reversed = {}
  for i = #input, 1, -1 do
    table.insert(reversed, input[i])
  end
  return reversed
end
`)+"("+e+")",u.HIGH]},C=function(e,o){var s=0;let l="";o.STATEMENT_PREFIX&&(l+=o.injectId(o.STATEMENT_PREFIX,e));do{const a=o.valueToCode(e,"IF"+s,u.NONE)||"false";let g=o.statementToCode(e,"DO"+s);o.STATEMENT_SUFFIX&&(g=o.prefixLines(o.injectId(o.STATEMENT_SUFFIX,e),o.INDENT)+g),l+=(s>0?"else":"")+"if "+a+` then
`+g,s++}while(e.getInput("IF"+s));return(e.getInput("ELSE")||o.STATEMENT_SUFFIX)&&(s=e.getInput("ELSE")?o.statementToCode(e,"ELSE"):"",o.STATEMENT_SUFFIX&&(s=o.prefixLines(o.injectId(o.STATEMENT_SUFFIX,e),o.INDENT)+s),l+=`else
`+s),l+`end
`},Q=function(e,o){const s={EQ:"==",NEQ:"~=",LT:"<",LTE:"<=",GT:">",GTE:">="}[e.getFieldValue("OP")],l=o.valueToCode(e,"A",u.RELATIONAL)||"0";return e=o.valueToCode(e,"B",u.RELATIONAL)||"0",[l+" "+s+" "+e,u.RELATIONAL]},W=function(e,o){const s=e.getFieldValue("OP")==="AND"?"and":"or",l=s==="and"?u.AND:u.OR;let a=o.valueToCode(e,"A",l);return e=o.valueToCode(e,"B",l),a||e?(o=s==="and"?"true":"false",a||(a=o),e||(e=o)):e=a="false",[a+" "+s+" "+e,l]},k=function(e,o){return["not "+(o.valueToCode(e,"BOOL",u.UNARY)||"true"),u.UNARY]},G=function(e,o){return[e.getFieldValue("BOOL")==="TRUE"?"true":"false",u.ATOMIC]},R=function(e,o){return["nil",u.ATOMIC]},b=function(e,o){const s=o.valueToCode(e,"IF",u.AND)||"false",l=o.valueToCode(e,"THEN",u.AND)||"nil";return e=o.valueToCode(e,"ELSE",u.OR)||"nil",[s+" and "+l+" or "+e,u.OR]},x=function(e,o){return e.includes(H)?e+o+`::continue::
`:e},B=function(e,o){let s;s=e.getField("TIMES")?String(Number(e.getFieldValue("TIMES"))):o.valueToCode(e,"TIMES",u.NONE)||"0",s=_.isNumber$$module$build$src$core$utils$string(s)?parseInt(s,10):"math.floor("+s+")";let l=o.statementToCode(e,"DO");return l=o.addLoopTrap(l,e),l=x(l,o.INDENT),"for "+o.nameDB_.getDistinctName("count",_.NameType$$module$build$src$core$names.VARIABLE)+" = 1, "+s+` do
`+l+`end
`},y=function(e,o){const s=e.getFieldValue("MODE")==="UNTIL";let l=o.valueToCode(e,"BOOL",s?u.UNARY:u.NONE)||"false",a=o.statementToCode(e,"DO");return a=o.addLoopTrap(a,e),a=x(a,o.INDENT),s&&(l="not "+l),"while "+l+` do
`+a+`end
`},E=function(e,o){const s=o.getVariableName(e.getFieldValue("VAR")),l=o.valueToCode(e,"FROM",u.NONE)||"0",a=o.valueToCode(e,"TO",u.NONE)||"0",g=o.valueToCode(e,"BY",u.NONE)||"1";let D=o.statementToCode(e,"DO");D=o.addLoopTrap(D,e),D=x(D,o.INDENT),e="";let j;return _.isNumber$$module$build$src$core$utils$string(l)&&_.isNumber$$module$build$src$core$utils$string(a)&&_.isNumber$$module$build$src$core$utils$string(g)?j=(Number(l)<=Number(a)?"":"-")+Math.abs(Number(g)):(e="",j=o.nameDB_.getDistinctName(s+"_inc",_.NameType$$module$build$src$core$names.VARIABLE),e+=j+" = ",e=_.isNumber$$module$build$src$core$utils$string(g)?e+(Math.abs(g)+`
`):e+("math.abs("+g+`)
`),e=e+("if ("+l+") > ("+a+`) then
`)+(o.INDENT+j+" = -"+j+`
`),e+=`end
`),e+("for "+s+" = "+l+", "+a+", "+j)+(` do
`+D+`end
`)},T=function(e,o){const s=o.getVariableName(e.getFieldValue("VAR")),l=o.valueToCode(e,"LIST",u.NONE)||"{}";let a=o.statementToCode(e,"DO");return a=o.addLoopTrap(a,e),a=x(a,o.INDENT),"for _, "+s+" in ipairs("+l+`) do 
`+a+`end
`},A=function(e,o){let s="";if(o.STATEMENT_PREFIX&&(s+=o.injectId(o.STATEMENT_PREFIX,e)),o.STATEMENT_SUFFIX&&(s+=o.injectId(o.STATEMENT_SUFFIX,e)),o.STATEMENT_PREFIX){const l=e.getSurroundLoop();l&&!l.suppressPrefixSuffix&&(s+=o.injectId(o.STATEMENT_PREFIX,l))}switch(e.getFieldValue("FLOW")){case"BREAK":return s+`break
`;case"CONTINUE":return s+H}throw Error("Unknown flow statement.")},F=function(e,o){return e=Number(e.getFieldValue("NUM")),[String(e),e<0?u.UNARY:u.ATOMIC]},U=function(e,o){var s={ADD:[" + ",u.ADDITIVE],MINUS:[" - ",u.ADDITIVE],MULTIPLY:[" * ",u.MULTIPLICATIVE],DIVIDE:[" / ",u.MULTIPLICATIVE],POWER:[" ^ ",u.EXPONENTIATION]}[e.getFieldValue("OP")];const l=s[0];s=s[1];const a=o.valueToCode(e,"A",s)||"0";return e=o.valueToCode(e,"B",s)||"0",[a+l+e,s]},Z=function(e,o){var s=e.getFieldValue("OP");if(s==="NEG")return e=o.valueToCode(e,"NUM",u.UNARY)||"0",["-"+e,u.UNARY];if(s==="POW10")return e=o.valueToCode(e,"NUM",u.EXPONENTIATION)||"0",["10 ^ "+e,u.EXPONENTIATION];switch(e=s==="ROUND"?o.valueToCode(e,"NUM",u.ADDITIVE)||"0":o.valueToCode(e,"NUM",u.NONE)||"0",s){case"ABS":s="math.abs("+e+")";break;case"ROOT":s="math.sqrt("+e+")";break;case"LN":s="math.log("+e+")";break;case"LOG10":s="math.log("+e+", 10)";break;case"EXP":s="math.exp("+e+")";break;case"ROUND":s="math.floor("+e+" + .5)";break;case"ROUNDUP":s="math.ceil("+e+")";break;case"ROUNDDOWN":s="math.floor("+e+")";break;case"SIN":s="math.sin(math.rad("+e+"))";break;case"COS":s="math.cos(math.rad("+e+"))";break;case"TAN":s="math.tan(math.rad("+e+"))";break;case"ASIN":s="math.deg(math.asin("+e+"))";break;case"ACOS":s="math.deg(math.acos("+e+"))";break;case"ATAN":s="math.deg(math.atan("+e+"))";break;default:throw Error("Unknown math operator: "+s)}return[s,u.HIGH]},_e=function(e,o){return{PI:["math.pi",u.HIGH],E:["math.exp(1)",u.HIGH],GOLDEN_RATIO:["(1 + math.sqrt(5)) / 2",u.MULTIPLICATIVE],SQRT2:["math.sqrt(2)",u.HIGH],SQRT1_2:["math.sqrt(1 / 2)",u.HIGH],INFINITY:["math.huge",u.HIGH]}[e.getFieldValue("CONSTANT")]},ue=function(e,o){var s={EVEN:[" % 2 == 0",u.MULTIPLICATIVE,u.RELATIONAL],ODD:[" % 2 == 1",u.MULTIPLICATIVE,u.RELATIONAL],WHOLE:[" % 1 == 0",u.MULTIPLICATIVE,u.RELATIONAL],POSITIVE:[" > 0",u.RELATIONAL,u.RELATIONAL],NEGATIVE:[" < 0",u.RELATIONAL,u.RELATIONAL],DIVISIBLE_BY:[null,u.MULTIPLICATIVE,u.RELATIONAL],PRIME:[null,u.NONE,u.HIGH]};const l=e.getFieldValue("PROPERTY"),[a,g,D]=s[l];if(s=o.valueToCode(e,"NUMBER_TO_CHECK",g)||"0",l==="PRIME")e=o.provideFunction_("math_isPrime",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(n)
  -- https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if n == 2 or n == 3 then
    return true
  end
  -- False if n is NaN, negative, is 1, or not whole.
  -- And false if n is divisible by 2 or 3.
  if not(n > 1) or n % 1 ~= 0 or n % 2 == 0 or n % 3 == 0 then
    return false
  end
  -- Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for x = 6, math.sqrt(n) + 1.5, 6 do
    if n % (x - 1) == 0 or n % (x + 1) == 0 then
      return false
    end
  end
  return true
end
`)+"("+s+")";else if(l==="DIVISIBLE_BY"){if(e=o.valueToCode(e,"DIVISOR",u.MULTIPLICATIVE)||"0",e==="0")return["nil",u.ATOMIC];e=s+" % "+e+" == 0"}else e=s+a;return[e,D]},X=function(e,o){const s=o.valueToCode(e,"DELTA",u.ADDITIVE)||"0";return e=o.getVariableName(e.getFieldValue("VAR")),e+" = "+e+" + "+s+`
`},J=function(e,o){function s(){return o.provideFunction_("math_sum",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t)
  local result = 0
  for _, v in ipairs(t) do
    result = result + v
  end
  return result
end
`)}var l=e.getFieldValue("OP");switch(e=o.valueToCode(e,"LIST",u.NONE)||"{}",l){case"SUM":l=s();break;case"MIN":l=o.provideFunction_("math_min",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t)
  if #t == 0 then
    return 0
  end
  local result = math.huge
  for _, v in ipairs(t) do
    if v < result then
      result = v
    end
  end
  return result
end
`);break;case"AVERAGE":l=o.provideFunction_("math_average",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t)
  if #t == 0 then
    return 0
  end
  return ${s()}(t) / #t
end
`);break;case"MAX":l=o.provideFunction_("math_max",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t)
  if #t == 0 then
    return 0
  end
  local result = -math.huge
  for _, v in ipairs(t) do
    if v > result then
      result = v
    end
  end
  return result
end
`);break;case"MEDIAN":l=o.provideFunction_("math_median",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t)
  -- Source: http://lua-users.org/wiki/SimpleStats
  if #t == 0 then
    return 0
  end
  local temp = {}
  for _, v in ipairs(t) do
    if type(v) == 'number' then
      table.insert(temp, v)
    end
  end
  table.sort(temp)
  if #temp % 2 == 0 then
    return (temp[#temp / 2] + temp[(#temp / 2) + 1]) / 2
  else
    return temp[math.ceil(#temp / 2)]
  end
end
`);break;case"MODE":l=o.provideFunction_("math_modes",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t)
  -- Source: http://lua-users.org/wiki/SimpleStats
  local counts = {}
  for _, v in ipairs(t) do
    if counts[v] == nil then
      counts[v] = 1
    else
      counts[v] = counts[v] + 1
    end
  end
  local biggestCount = 0
  for _, v  in pairs(counts) do
    if v > biggestCount then
      biggestCount = v
    end
  end
  local temp = {}
  for k, v in pairs(counts) do
    if v == biggestCount then
      table.insert(temp, k)
    end
  end
  return temp
end
`);break;case"STD_DEV":l=o.provideFunction_("math_standard_deviation",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t)
  local m
  local vm
  local total = 0
  local count = 0
  local result
  m = #t == 0 and 0 or ${s()}(t) / #t
  for _, v in ipairs(t) do
    if type(v) == 'number' then
      vm = v - m
      total = total + (vm * vm)
      count = count + 1
    end
  end
  result = math.sqrt(total / (count-1))
  return result
end
`);break;case"RANDOM":l=o.provideFunction_("math_random_list",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(t)
  if #t == 0 then
    return nil
  end
  return t[math.random(#t)]
end
`);break;default:throw Error("Unknown operator: "+l)}return[l+"("+e+")",u.HIGH]},Ne=function(e,o){const s=o.valueToCode(e,"DIVIDEND",u.MULTIPLICATIVE)||"0";return e=o.valueToCode(e,"DIVISOR",u.MULTIPLICATIVE)||"0",[s+" % "+e,u.MULTIPLICATIVE]},ee=function(e,o){const s=o.valueToCode(e,"VALUE",u.NONE)||"0",l=o.valueToCode(e,"LOW",u.NONE)||"-math.huge";return e=o.valueToCode(e,"HIGH",u.NONE)||"math.huge",["math.min(math.max("+s+", "+l+"), "+e+")",u.HIGH]},ve=function(e,o){const s=o.valueToCode(e,"FROM",u.NONE)||"0";return e=o.valueToCode(e,"TO",u.NONE)||"0",["math.random("+s+", "+e+")",u.HIGH]},pe=function(e,o){return["math.random()",u.HIGH]},de=function(e,o){const s=o.valueToCode(e,"X",u.NONE)||"0";return["math.deg(math.atan2("+(o.valueToCode(e,"Y",u.NONE)||"0")+", "+s+"))",u.HIGH]},Te=function(e,o){const s=o.getProcedureName(e.getFieldValue("NAME"));var l="";o.STATEMENT_PREFIX&&(l+=o.injectId(o.STATEMENT_PREFIX,e)),o.STATEMENT_SUFFIX&&(l+=o.injectId(o.STATEMENT_SUFFIX,e)),l&&(l=o.prefixLines(l,o.INDENT));let a="";o.INFINITE_LOOP_TRAP&&(a=o.prefixLines(o.injectId(o.INFINITE_LOOP_TRAP,e),o.INDENT));let g="";e.getInput("STACK")&&(g=o.statementToCode(e,"STACK"));let D="";e.getInput("RETURN")&&(D=o.valueToCode(e,"RETURN",u.NONE)||"");let j="";g&&D&&(j=l),D?D=o.INDENT+"return "+D+`
`:g||(g="");const K=[],ce=e.getVars();for(let se=0;se<ce.length;se++)K[se]=o.getVariableName(ce[se]);return l="function "+s+"("+K.join(", ")+`)
`+l+a+g+j+D+`end
`,l=o.scrub_(e,l),o.definitions_["%"+s]=l,null},Ie=function(e,o){const s=o.getProcedureName(e.getFieldValue("NAME")),l=[],a=e.getVars();for(let g=0;g<a.length;g++)l[g]=o.valueToCode(e,"ARG"+g,u.NONE)||"nil";return[s+"("+l.join(", ")+")",u.HIGH]},he=function(e,o){return o.forBlock.procedures_callreturn(e,o)[0]+`
`},Oe=function(e,o){let s="if "+(o.valueToCode(e,"CONDITION",u.NONE)||"false")+` then
`;return o.STATEMENT_SUFFIX&&(s+=o.prefixLines(o.injectId(o.STATEMENT_SUFFIX,e),o.INDENT)),e.hasReturnValue_?(e=o.valueToCode(e,"VALUE",u.NONE)||"nil",s+=o.INDENT+"return "+e+`
`):s+=o.INDENT+`return
`,s+`end
`},Se=function(e,o){return[o.quote_(e.getFieldValue("TEXT")),u.ATOMIC]},Ae=function(e,o){if(e.itemCount_===0)return["''",u.ATOMIC];if(e.itemCount_===1)return["tostring("+(o.valueToCode(e,"ADD0",u.NONE)||"''")+")",u.HIGH];if(e.itemCount_===2){var s=o.valueToCode(e,"ADD0",u.CONCATENATION)||"''";return e=o.valueToCode(e,"ADD1",u.CONCATENATION)||"''",[s+" .. "+e,u.CONCATENATION]}s=[];for(let l=0;l<e.itemCount_;l++)s[l]=o.valueToCode(e,"ADD"+l,u.NONE)||"''";return["table.concat({"+s.join(", ")+"})",u.HIGH]},te=function(e,o){const s=o.getVariableName(e.getFieldValue("VAR"));return e=o.valueToCode(e,"TEXT",u.CONCATENATION)||"''",s+" = "+s+" .. "+e+`
`},Me=function(e,o){return["#"+(o.valueToCode(e,"VALUE",u.UNARY)||"''"),u.UNARY]},ge=function(e,o){return["#"+(o.valueToCode(e,"VALUE",u.UNARY)||"''")+" == 0",u.RELATIONAL]},fe=function(e,o){const s=o.valueToCode(e,"FIND",u.NONE)||"''",l=o.valueToCode(e,"VALUE",u.NONE)||"''";return[(e.getFieldValue("END")==="FIRST"?o.provideFunction_("firstIndexOf",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(str, substr)
  local i = string.find(str, substr, 1, true)
  if i == nil then
    return 0
  end
  return i
end
`):o.provideFunction_("lastIndexOf",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(str, substr)
  local i = string.find(string.reverse(str), string.reverse(substr), 1, true)
  if i then
    return #str + 2 - i - #substr
  end
  return 0
end
`))+"("+l+", "+s+")",u.HIGH]},Ce=function(e,o){var s=e.getFieldValue("WHERE")||"FROM_START";const l=o.valueToCode(e,"VALUE",u.NONE)||"''";if(s==="RANDOM")o=o.provideFunction_("text_random_letter",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(str)
  local index = math.random(string.len(str))
  return string.sub(str, index, index)
end
`)+"("+l+")";else{if(s==="FIRST")s="1";else if(s==="LAST")s="-1";else if(e=o.valueToCode(e,"AT",s==="FROM_END"?u.UNARY:u.NONE)||"1",s==="FROM_START")s=e;else if(s==="FROM_END")s="-"+e;else throw Error("Unhandled option (text_charAt).");o=s.match(/^-?\w*$/)?"string.sub("+l+", "+s+", "+s+")":o.provideFunction_("text_char_at",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(str, index)
  return string.sub(str, index, index)
end
`)+"("+l+", "+s+")"}return[o,u.HIGH]},Le=function(e,o){const s=o.valueToCode(e,"STRING",u.NONE)||"''";var l=e.getFieldValue("WHERE1"),a=o.valueToCode(e,"AT1",l==="FROM_END"?u.UNARY:u.NONE)||"1";if(l==="FIRST")l=1;else if(l==="FROM_START")l=a;else if(l==="FROM_END")l="-"+a;else throw Error("Unhandled option (text_getSubstring)");if(a=e.getFieldValue("WHERE2"),e=o.valueToCode(e,"AT2",a==="FROM_END"?u.UNARY:u.NONE)||"1",a==="LAST")e=-1;else if(a!=="FROM_START")if(a==="FROM_END")e="-"+e;else throw Error("Unhandled option (text_getSubstring)");return["string.sub("+s+", "+l+", "+e+")",u.HIGH]},Re=function(e,o){const s=e.getFieldValue("CASE");e=o.valueToCode(e,"TEXT",u.NONE)||"''";let l;return s==="UPPERCASE"?l="string.upper":s==="LOWERCASE"?l="string.lower":s==="TITLECASE"&&(l=o.provideFunction_("text_titlecase",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(str)
  local buf = {}
  local inWord = false
  for i = 1, #str do
    local c = string.sub(str, i, i)
    if inWord then
      table.insert(buf, string.lower(c))
      if string.find(c, "%s") then
        inWord = false
      end
    else
      table.insert(buf, string.upper(c))
      inWord = true
    end
  end
  return table.concat(buf)
end
`)),[l+"("+e+")",u.HIGH]},Fe=function(e,o){const s={LEFT:"^%s*(,-)",RIGHT:"(.-)%s*$",BOTH:"^%s*(.-)%s*$"}[e.getFieldValue("MODE")];return["string.gsub("+(o.valueToCode(e,"TEXT",u.NONE)||"''")+', "'+s+'", "%1")',u.HIGH]},Ee=function(e,o){return"print("+(o.valueToCode(e,"TEXT",u.NONE)||"''")+`)
`},me=function(e,o){let s;return s=e.getField("TEXT")?o.quote_(e.getFieldValue("TEXT")):o.valueToCode(e,"TEXT",u.NONE)||"''",o=o.provideFunction_("text_prompt",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(msg)
  io.write(msg)
  io.flush()
  return io.read()
end
`)+"("+s+")",e.getFieldValue("TYPE")==="NUMBER"&&(o="tonumber("+o+", 10)"),[o,u.HIGH]},re=function(e,o){const s=o.valueToCode(e,"TEXT",u.NONE)||"''";return e=o.valueToCode(e,"SUB",u.NONE)||"''",[o.provideFunction_("text_count",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(haystack, needle)
  if #needle == 0 then
    return #haystack + 1
  end
  local i = 1
  local count = 0
  while true do
    i = string.find(haystack, needle, i, true)
    if i == nil then
      break
    end
    count = count + 1
    i = i + #needle
  end
  return count
end
`)+"("+s+", "+e+")",u.HIGH]},De=function(e,o){const s=o.valueToCode(e,"TEXT",u.NONE)||"''",l=o.valueToCode(e,"FROM",u.NONE)||"''";return e=o.valueToCode(e,"TO",u.NONE)||"''",[o.provideFunction_("text_replace",`
function ${o.FUNCTION_NAME_PLACEHOLDER_}(haystack, needle, replacement)
  local buf = {}
  local i = 1
  while i <= #haystack do
    if string.sub(haystack, i, i + #needle - 1) == needle then
      for j = 1, #replacement do
        table.insert(buf, string.sub(replacement, j, j))
      end
      i = i + #needle
    else
      table.insert(buf, string.sub(haystack, i, i))
      i = i + 1
    end
  end
  return table.concat(buf)
end
`)+"("+s+", "+l+", "+e+")",u.HIGH]},ae=function(e,o){return["string.reverse("+(o.valueToCode(e,"TEXT",u.NONE)||"''")+")",u.HIGH]},ie=function(e,o){return[o.getVariableName(e.getFieldValue("VAR")),u.ATOMIC]},i=function(e,o){const s=o.valueToCode(e,"VALUE",u.NONE)||"0";return o.getVariableName(e.getFieldValue("VAR"))+" = "+s+`
`},u;(function(e){e[e.ATOMIC=0]="ATOMIC",e[e.HIGH=1]="HIGH",e[e.EXPONENTIATION=2]="EXPONENTIATION",e[e.UNARY=3]="UNARY",e[e.MULTIPLICATIVE=4]="MULTIPLICATIVE",e[e.ADDITIVE=5]="ADDITIVE",e[e.CONCATENATION=6]="CONCATENATION",e[e.RELATIONAL=7]="RELATIONAL",e[e.AND=8]="AND",e[e.OR=9]="OR",e[e.NONE=99]="NONE"})(u||(u={}));var L=class extends _.CodeGenerator$$module$build$src$core$generator{constructor(e="Lua"){super(e),this.isInitialized=!1;for(const o in u)e=u[o],typeof e!="string"&&(this["ORDER_"+o]=e);this.addReservedWords("_,__inext,assert,bit,colors,colours,coroutine,disk,dofile,error,fs,fetfenv,getmetatable,gps,help,io,ipairs,keys,loadfile,loadstring,math,native,next,os,paintutils,pairs,parallel,pcall,peripheral,print,printError,rawequal,rawget,rawset,read,rednet,redstone,rs,select,setfenv,setmetatable,sleep,string,table,term,textutils,tonumber,tostring,turtle,type,unpack,vector,write,xpcall,_VERSION,__indext,HTTP,and,break,do,else,elseif,end,false,for,function,if,in,local,nil,not,or,repeat,return,then,true,until,while,add,sub,mul,div,mod,pow,unm,concat,len,eq,lt,le,index,newindex,call,assert,collectgarbage,dofile,error,_G,getmetatable,inpairs,load,loadfile,next,pairs,pcall,print,rawequal,rawget,rawlen,rawset,select,setmetatable,tonumber,tostring,type,_VERSION,xpcall,require,package,string,table,math,bit32,io,file,os,debug")}init(e){super.init(e),this.nameDB_?this.nameDB_.reset():this.nameDB_=new _.Names$$module$build$src$core$names(this.RESERVED_WORDS_),this.nameDB_.setVariableMap(e.getVariableMap()),this.nameDB_.populateVariables(e),this.nameDB_.populateProcedures(e),this.isInitialized=!0}finish(e){const o=Object.values(this.definitions_);return e=super.finish(e),this.isInitialized=!1,this.nameDB_.reset(),o.join(`

`)+`


`+e}scrubNakedValue(e){return"local _ = "+e+`
`}quote_(e){return e=e.replace(/\\/g,"\\\\").replace(/\n/g,`\\
`).replace(/'/g,"\\'"),"'"+e+"'"}multiline_quote_(e){return e.split(/\n/g).map(this.quote_).join(` .. '\\n' ..
`)}scrub_(e,o,s=!1){let l="";if(!e.outputConnection||!e.outputConnection.targetConnection){var a=e.getCommentText();a&&(a=_.wrap$$module$build$src$core$utils$string(a,this.COMMENT_WRAP-3),l+=this.prefixLines(a,"-- ")+`
`);for(let g=0;g<e.inputList.length;g++)e.inputList[g].type===_.inputTypes$$module$build$src$core$inputs$input_types.VALUE&&(a=e.inputList[g].connection.targetBlock())&&(a=this.allNestedComments(a))&&(l+=this.prefixLines(a,"-- "))}return e=e.nextConnection&&e.nextConnection.targetBlock(),s=s?"":this.blockToCode(e),l+o+s}},v=function(e,o,s){return o==="FIRST"?"1":o==="FROM_END"?"#"+e+" + 1 - "+s:o==="LAST"?"#"+e:o==="RANDOM"?"math.random(#"+e+")":s},S={};S.lists_create_empty=$e,S.lists_create_with=q,S.lists_getIndex=V,S.lists_getSublist=$,S.lists_indexOf=O,S.lists_isEmpty=f,S.lists_length=ne,S.lists_repeat=le,S.lists_reverse=P,S.lists_setIndex=w,S.lists_sort=m,S.lists_split=I;var p={};p.controls_if=C,p.controls_ifelse=C,p.logic_boolean=G,p.logic_compare=Q,p.logic_negate=k,p.logic_null=R,p.logic_operation=W,p.logic_ternary=b;var H=`goto continue
`,c={};c.controls_flow_statements=A,c.controls_for=E,c.controls_forEach=T,c.controls_repeat=B,c.controls_repeat_ext=B,c.controls_whileUntil=y;var d={};d.math_arithmetic=U,d.math_atan2=de,d.math_change=X,d.math_constant=_e,d.math_constrain=ee,d.math_modulo=Ne,d.math_number=F,d.math_number_property=ue,d.math_on_list=J,d.math_random_float=pe,d.math_random_int=ve,d.math_round=Z,d.math_single=Z,d.math_trig=Z;var N={};N.procedures_callnoreturn=he,N.procedures_callreturn=Ie,N.procedures_defnoreturn=Te,N.procedures_defreturn=Te,N.procedures_ifreturn=Oe;var h={};h.text=Se,h.text_append=te,h.text_changeCase=Re,h.text_charAt=Ce,h.text_count=re,h.text_getSubstring=Le,h.text_indexOf=fe,h.text_isEmpty=ge,h.text_join=Ae,h.text_length=Me,h.text_print=Ee,h.text_prompt=me,h.text_prompt_ext=me,h.text_replace=De,h.text_reverse=ae,h.text_trim=Fe;var M={};M.variables_get=ie,M.variables_set=i;var Y={};Y.variables_get_dynamic=ie,Y.variables_set_dynamic=i;var t=new L,n=Object.assign({},S,p,c,d,N,h,M,Y);for(const e in n)t.forBlock[e]=n[e];var r={};return r.LuaGenerator=L,r.Order=u,r.luaGenerator=t,r.__namespace__=_,r})})(we)),we.exports}var ke={exports:{}},rt=ke.exports,je;function nt(){return je||(je=1,(function(oe,ye){(function(z,_){oe.exports=_(Ue())})(rt,function(z){var _=z.__namespace__,$e=function(t,n){return["array()",i.FUNCTION_CALL]},q=function(t,n){const r=Array(t.itemCount_);for(let e=0;e<t.itemCount_;e++)r[e]=n.valueToCode(t,"ADD"+e,i.NONE)||"null";return["array("+r.join(", ")+")",i.FUNCTION_CALL]},le=function(t,n){const r=n.provideFunction_("lists_repeat",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($value, $count) {
  $array = array();
  for ($index = 0; $index < $count; $index++) {
    $array[] = $value;
  }
  return $array;
}
`),e=n.valueToCode(t,"ITEM",i.NONE)||"null";return t=n.valueToCode(t,"NUM",i.NONE)||"0",[r+"("+e+", "+t+")",i.FUNCTION_CALL]},ne=function(t,n){const r=n.provideFunction_("length",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($value) {
  if (is_string($value)) {
    return strlen($value);
  } else {
    return count($value);
  }
}
`);return t=n.valueToCode(t,"VALUE",i.NONE)||"''",[r+"("+t+")",i.FUNCTION_CALL]},f=function(t,n){return["empty("+(n.valueToCode(t,"VALUE",i.FUNCTION_CALL)||"array()")+")",i.FUNCTION_CALL]},O=function(t,n){const r=n.valueToCode(t,"FIND",i.NONE)||"''",e=n.valueToCode(t,"VALUE",i.MEMBER)||"[]";let o=" -1",s="";return t.workspace.options.oneBasedIndex&&(o=" 0",s=" + 1"),[(t.getFieldValue("END")==="FIRST"?n.provideFunction_("indexOf",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($haystack, $needle) {
  for ($index = 0; $index < count($haystack); $index++) {
    if ($haystack[$index] == $needle) return $index${s};
  }
  return ${o};
}
`):n.provideFunction_("lastIndexOf",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($haystack, $needle) {
  $last = ${o};
  for ($index = 0; $index < count($haystack); $index++) {
    if ($haystack[$index] == $needle) $last = $index${s};
  }
  return $last;
}
`))+"("+e+", "+r+")",i.FUNCTION_CALL]},V=function(t,n){var r=t.getFieldValue("MODE")||"GET";switch(t.getFieldValue("WHERE")||"FROM_START"){case"FIRST":if(r==="GET")return[(n.valueToCode(t,"VALUE",i.MEMBER)||"array()")+"[0]",i.MEMBER];if(r==="GET_REMOVE")return["array_shift("+(n.valueToCode(t,"VALUE",i.NONE)||"array()")+")",i.FUNCTION_CALL];if(r==="REMOVE")return"array_shift("+(n.valueToCode(t,"VALUE",i.NONE)||"array()")+`);
`;break;case"LAST":if(r==="GET")return["end("+(n.valueToCode(t,"VALUE",i.NONE)||"array()")+")",i.FUNCTION_CALL];if(r==="GET_REMOVE")return["array_pop("+(n.valueToCode(t,"VALUE",i.NONE)||"array()")+")",i.FUNCTION_CALL];if(r==="REMOVE")return"array_pop("+(n.valueToCode(t,"VALUE",i.NONE)||"array()")+`);
`;break;case"FROM_START":var e=n.getAdjusted(t,"AT");if(r==="GET")return[(n.valueToCode(t,"VALUE",i.MEMBER)||"array()")+"["+e+"]",i.MEMBER];if(r==="GET_REMOVE")return["array_splice("+(n.valueToCode(t,"VALUE",i.NONE)||"array()")+", "+e+", 1)[0]",i.FUNCTION_CALL];if(r==="REMOVE")return"array_splice("+(n.valueToCode(t,"VALUE",i.NONE)||"array()")+", "+e+`, 1);
`;break;case"FROM_END":if(r==="GET")return r=n.valueToCode(t,"VALUE",i.NONE)||"array()",n=n.getAdjusted(t,"AT",1,!0),["array_slice("+r+", "+n+", 1)[0]",i.FUNCTION_CALL];if(r==="GET_REMOVE"||r==="REMOVE"){if(e=n.valueToCode(t,"VALUE",i.NONE)||"array()",n=n.getAdjusted(t,"AT",1,!1,i.SUBTRACTION),n="array_splice("+e+", count("+e+") - "+n+", 1)[0]",r==="GET_REMOVE")return[n,i.FUNCTION_CALL];if(r==="REMOVE")return n+`;
`}break;case"RANDOM":if(t=n.valueToCode(t,"VALUE",i.NONE)||"array()",r==="GET")return[n.provideFunction_("lists_get_random_item",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($list) {
  return $list[rand(0,count($list)-1)];
}
`)+"("+t+")",i.FUNCTION_CALL];if(r==="GET_REMOVE")return[n.provideFunction_("lists_get_remove_random_item",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}(&$list) {
  $x = rand(0,count($list)-1);
  unset($list[$x]);
  return array_values($list);
}
`)+"("+t+")",i.FUNCTION_CALL];if(r==="REMOVE")return n.provideFunction_("lists_remove_random_item",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}(&$list) {
  unset($list[rand(0,count($list)-1)]);
}
`)+"("+t+`);
`}throw Error("Unhandled combination (lists_getIndex).")},w=function(t,n){const r=t.getFieldValue("MODE")||"GET";var e=t.getFieldValue("WHERE")||"FROM_START";const o=n.valueToCode(t,"TO",i.ASSIGNMENT)||"null";switch(e){case"FIRST":if(r==="SET")return(n.valueToCode(t,"LIST",i.MEMBER)||"array()")+"[0] = "+o+`;
`;if(r==="INSERT")return"array_unshift("+(n.valueToCode(t,"LIST",i.NONE)||"array()")+", "+o+`);
`;break;case"LAST":if(t=n.valueToCode(t,"LIST",i.NONE)||"array()",r==="SET")return n.provideFunction_("lists_set_last_item",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}(&$list, $value) {
  $list[count($list) - 1] = $value;
}
`)+"("+t+", "+o+`);
`;if(r==="INSERT")return"array_push("+t+", "+o+`);
`;break;case"FROM_START":if(e=n.getAdjusted(t,"AT"),r==="SET")return(n.valueToCode(t,"LIST",i.MEMBER)||"array()")+"["+e+"] = "+o+`;
`;if(r==="INSERT")return"array_splice("+(n.valueToCode(t,"LIST",i.NONE)||"array()")+", "+e+", 0, "+o+`);
`;break;case"FROM_END":if(e=n.valueToCode(t,"LIST",i.NONE)||"array()",t=n.getAdjusted(t,"AT",1),r==="SET")return n.provideFunction_("lists_set_from_end",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}(&$list, $at, $value) {
  $list[count($list) - $at] = $value;
}
`)+"("+e+", "+t+", "+o+`);
`;if(r==="INSERT")return n.provideFunction_("lists_insert_from_end",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}(&$list, $at, $value) {
  return array_splice($list, count($list) - $at, 0, $value);
}
`)+"("+e+", "+t+", "+o+`);
`;break;case"RANDOM":if(t=n.valueToCode(t,"LIST",i.REFERENCE)||"array()",t.match(/^\$\w+$/))e="";else{e=n.nameDB_.getDistinctName("tmp_list",_.NameType$$module$build$src$core$names.VARIABLE);var s=e+" = &"+t+`;
`;t=e,e=s}if(n=n.nameDB_.getDistinctName("tmp_x",_.NameType$$module$build$src$core$names.VARIABLE),e+=n+" = rand(0, count("+t+`)-1);
`,r==="SET")return e+(t+"["+n+"] = "+o+`;
`);if(r==="INSERT")return e+("array_splice("+t+", "+n+", 0, "+o+`);
`)}throw Error("Unhandled combination (lists_setIndex).")},$=function(t,n){var r=n.valueToCode(t,"LIST",i.NONE)||"array()",e=t.getFieldValue("WHERE1");const o=t.getFieldValue("WHERE2");if(e!=="FIRST"||o!=="LAST")if(r.match(/^\$\w+$/)||e!=="FROM_END"&&o==="FROM_START"){switch(e){case"FROM_START":e=n.getAdjusted(t,"AT1");break;case"FROM_END":e=n.getAdjusted(t,"AT1",1,!1,i.SUBTRACTION),e="count("+r+") - "+e;break;case"FIRST":e="0";break;default:throw Error("Unhandled option (lists_getSublist).")}switch(o){case"FROM_START":n=n.getAdjusted(t,"AT2",0,!1,i.SUBTRACTION),n+=" - ",n=_.isNumber$$module$build$src$core$utils$string(String(e))||String(e).match(/^\(.+\)$/)?n+e:n+("("+e+")"),n+=" + 1";break;case"FROM_END":n=n.getAdjusted(t,"AT2",0,!1,i.SUBTRACTION),n="count("+r+") - "+n+" - ",n=_.isNumber$$module$build$src$core$utils$string(String(e))||String(e).match(/^\(.+\)$/)?n+e:n+("("+e+")");break;case"LAST":n="count("+r+") - ",n=_.isNumber$$module$build$src$core$utils$string(String(e))||String(e).match(/^\(.+\)$/)?n+e:n+("("+e+")");break;default:throw Error("Unhandled option (lists_getSublist).")}r="array_slice("+r+", "+e+", "+n+")"}else{const s=n.getAdjusted(t,"AT1");t=n.getAdjusted(t,"AT2"),r=n.provideFunction_("lists_get_sublist",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($list, $where1, $at1, $where2, $at2) {
  if ($where1 == 'FROM_END') {
    $at1 = count($list) - 1 - $at1;
  } else if ($where1 == 'FIRST') {
    $at1 = 0;
  } else if ($where1 != 'FROM_START') {
    throw new Exception('Unhandled option (lists_get_sublist).');
  }
  $length = 0;
  if ($where2 == 'FROM_START') {
    $length = $at2 - $at1 + 1;
  } else if ($where2 == 'FROM_END') {
    $length = count($list) - $at1 - $at2;
  } else if ($where2 == 'LAST') {
    $length = count($list) - $at1;
  } else {
    throw new Exception('Unhandled option (lists_get_sublist).');
  }
  return array_slice($list, $at1, $length);
}
`)+"("+r+", '"+e+"', "+s+", '"+o+"', "+t+")"}return[r,i.FUNCTION_CALL]},m=function(t,n){const r=n.valueToCode(t,"LIST",i.NONE)||"array()",e=t.getFieldValue("DIRECTION")==="1"?1:-1;return t=t.getFieldValue("TYPE"),[n.provideFunction_("lists_sort",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($list, $type, $direction) {
  $sortCmpFuncs = array(
    'NUMERIC' => 'strnatcasecmp',
    'TEXT' => 'strcmp',
    'IGNORE_CASE' => 'strcasecmp'
  );
  $sortCmp = $sortCmpFuncs[$type];
  $list2 = $list;
  usort($list2, $sortCmp);
  if ($direction == -1) {
    $list2 = array_reverse($list2);
  }
  return $list2;
}
`)+"("+r+', "'+t+'", '+e+")",i.FUNCTION_CALL]},I=function(t,n){let r=n.valueToCode(t,"INPUT",i.NONE);if(n=n.valueToCode(t,"DELIM",i.NONE)||"''",t=t.getFieldValue("MODE"),t==="SPLIT")r||(r="''"),t="explode";else if(t==="JOIN")r||(r="array()"),t="implode";else throw Error("Unknown mode: "+t);return[t+"("+n+", "+r+")",i.FUNCTION_CALL]},P=function(t,n){return["array_reverse("+(n.valueToCode(t,"LIST",i.NONE)||"[]")+")",i.FUNCTION_CALL]},C=function(t,n){let r=0,e="",o,s;n.STATEMENT_PREFIX&&(e+=n.injectId(n.STATEMENT_PREFIX,t));do s=n.valueToCode(t,"IF"+r,i.NONE)||"false",o=n.statementToCode(t,"DO"+r),n.STATEMENT_SUFFIX&&(o=n.prefixLines(n.injectId(n.STATEMENT_SUFFIX,t),n.INDENT)+o),e+=(r>0?" else ":"")+"if ("+s+`) {
`+o+"}",r++;while(t.getInput("IF"+r));return(t.getInput("ELSE")||n.STATEMENT_SUFFIX)&&(o=t.getInput("ELSE")?n.statementToCode(t,"ELSE"):"",n.STATEMENT_SUFFIX&&(o=n.prefixLines(n.injectId(n.STATEMENT_SUFFIX,t),n.INDENT)+o),e+=` else {
`+o+"}"),e+`
`},Q=function(t,n){const r={EQ:"==",NEQ:"!=",LT:"<",LTE:"<=",GT:">",GTE:">="}[t.getFieldValue("OP")],e=r==="=="||r==="!="?i.EQUALITY:i.RELATIONAL,o=n.valueToCode(t,"A",e)||"0";return t=n.valueToCode(t,"B",e)||"0",[o+" "+r+" "+t,e]},W=function(t,n){const r=t.getFieldValue("OP")==="AND"?"&&":"||",e=r==="&&"?i.LOGICAL_AND:i.LOGICAL_OR;let o=n.valueToCode(t,"A",e);return t=n.valueToCode(t,"B",e),o||t?(n=r==="&&"?"true":"false",o||(o=n),t||(t=n)):t=o="false",[o+" "+r+" "+t,e]},k=function(t,n){const r=i.LOGICAL_NOT;return["!"+(n.valueToCode(t,"BOOL",r)||"true"),r]},G=function(t,n){return[t.getFieldValue("BOOL")==="TRUE"?"true":"false",i.ATOMIC]},R=function(t,n){return["null",i.ATOMIC]},b=function(t,n){const r=n.valueToCode(t,"IF",i.CONDITIONAL)||"false",e=n.valueToCode(t,"THEN",i.CONDITIONAL)||"null";return t=n.valueToCode(t,"ELSE",i.CONDITIONAL)||"null",[r+" ? "+e+" : "+t,i.CONDITIONAL]},x=function(t,n){let r;r=t.getField("TIMES")?String(Number(t.getFieldValue("TIMES"))):n.valueToCode(t,"TIMES",i.ASSIGNMENT)||"0";let e=n.statementToCode(t,"DO");e=n.addLoopTrap(e,t),t="";const o=n.nameDB_.getDistinctName("count",_.NameType$$module$build$src$core$names.VARIABLE);let s=r;return r.match(/^\w+$/)||_.isNumber$$module$build$src$core$utils$string(r)||(s=n.nameDB_.getDistinctName("repeat_end",_.NameType$$module$build$src$core$names.VARIABLE),t+=s+" = "+r+`;
`),t+("for ("+o+" = 0; "+o+" < "+s+"; "+o+`++) {
`+e+`}
`)},B=function(t,n){const r=t.getFieldValue("MODE")==="UNTIL";let e=n.valueToCode(t,"BOOL",r?i.LOGICAL_NOT:i.NONE)||"false",o=n.statementToCode(t,"DO");return o=n.addLoopTrap(o,t),r&&(e="!"+e),"while ("+e+`) {
`+o+`}
`},y=function(t,n){var r=n.getVariableName(t.getFieldValue("VAR")),e=n.valueToCode(t,"FROM",i.ASSIGNMENT)||"0",o=n.valueToCode(t,"TO",i.ASSIGNMENT)||"0";const s=n.valueToCode(t,"BY",i.ASSIGNMENT)||"1";let l=n.statementToCode(t,"DO");if(l=n.addLoopTrap(l,t),_.isNumber$$module$build$src$core$utils$string(e)&&_.isNumber$$module$build$src$core$utils$string(o)&&_.isNumber$$module$build$src$core$utils$string(s))n=Number(e)<=Number(o),t="for ("+r+" = "+e+"; "+r+(n?" <= ":" >= ")+o+"; "+r,r=Math.abs(Number(s)),t=r===1?t+(n?"++":"--"):t+((n?" += ":" -= ")+r),t+=`) {
`+l+`}
`;else{t="";let a=e;e.match(/^\w+$/)||_.isNumber$$module$build$src$core$utils$string(e)||(a=n.nameDB_.getDistinctName(r+"_start",_.NameType$$module$build$src$core$names.VARIABLE),t+=a+" = "+e+`;
`),e=o,o.match(/^\w+$/)||_.isNumber$$module$build$src$core$utils$string(o)||(e=n.nameDB_.getDistinctName(r+"_end",_.NameType$$module$build$src$core$names.VARIABLE),t+=e+" = "+o+`;
`),o=n.nameDB_.getDistinctName(r+"_inc",_.NameType$$module$build$src$core$names.VARIABLE),t+=o+" = ",t=_.isNumber$$module$build$src$core$utils$string(s)?t+(Math.abs(Number(s))+`;
`):t+("abs("+s+`);
`),t+="if ("+a+" > "+e+`) {
`,t+=n.INDENT+o+" = -"+o+`;
`,t=t+`}
for (`+(r+" = "+a+"; "+o+" >= 0 ? "+r+" <= "+e+" : "+r+" >= "+e+"; "+r+" += "+o+`) {
`+l+`}
`)}return t},E=function(t,n){const r=n.getVariableName(t.getFieldValue("VAR")),e=n.valueToCode(t,"LIST",i.ASSIGNMENT)||"[]";let o=n.statementToCode(t,"DO");return o=n.addLoopTrap(o,t),"foreach ("+e+" as "+r+`) {
`+o+`}
`},T=function(t,n){let r="";if(n.STATEMENT_PREFIX&&(r+=n.injectId(n.STATEMENT_PREFIX,t)),n.STATEMENT_SUFFIX&&(r+=n.injectId(n.STATEMENT_SUFFIX,t)),n.STATEMENT_PREFIX){const e=t.getSurroundLoop();e&&!e.suppressPrefixSuffix&&(r+=n.injectId(n.STATEMENT_PREFIX,e))}switch(t.getFieldValue("FLOW")){case"BREAK":return r+`break;
`;case"CONTINUE":return r+`continue;
`}throw Error("Unknown flow statement.")},A=function(t,n){return t=Number(t.getFieldValue("NUM")),t===1/0?["INF",i.ATOMIC]:t===-1/0?["-INF",i.UNARY_NEGATION]:[String(t),t>=0?i.ATOMIC:i.UNARY_NEGATION]},F=function(t,n){var r={ADD:[" + ",i.ADDITION],MINUS:[" - ",i.SUBTRACTION],MULTIPLY:[" * ",i.MULTIPLICATION],DIVIDE:[" / ",i.DIVISION],POWER:[" ** ",i.POWER]}[t.getFieldValue("OP")];const e=r[0];r=r[1];const o=n.valueToCode(t,"A",r)||"0";return t=n.valueToCode(t,"B",r)||"0",[o+e+t,r]},U=function(t,n){const r=t.getFieldValue("OP");let e;if(r==="NEG")return t=n.valueToCode(t,"NUM",i.UNARY_NEGATION)||"0",t[0]==="-"&&(t=" "+t),["-"+t,i.UNARY_NEGATION];switch(t=r==="SIN"||r==="COS"||r==="TAN"?n.valueToCode(t,"NUM",i.DIVISION)||"0":n.valueToCode(t,"NUM",i.NONE)||"0",r){case"ABS":e="abs("+t+")";break;case"ROOT":e="sqrt("+t+")";break;case"LN":e="log("+t+")";break;case"EXP":e="exp("+t+")";break;case"POW10":e="pow(10,"+t+")";break;case"ROUND":e="round("+t+")";break;case"ROUNDUP":e="ceil("+t+")";break;case"ROUNDDOWN":e="floor("+t+")";break;case"SIN":e="sin("+t+" / 180 * pi())";break;case"COS":e="cos("+t+" / 180 * pi())";break;case"TAN":e="tan("+t+" / 180 * pi())"}if(e)return[e,i.FUNCTION_CALL];switch(r){case"LOG10":e="log("+t+") / log(10)";break;case"ASIN":e="asin("+t+") / pi() * 180";break;case"ACOS":e="acos("+t+") / pi() * 180";break;case"ATAN":e="atan("+t+") / pi() * 180";break;default:throw Error("Unknown math operator: "+r)}return[e,i.DIVISION]},Z=function(t,n){return{PI:["M_PI",i.ATOMIC],E:["M_E",i.ATOMIC],GOLDEN_RATIO:["(1 + sqrt(5)) / 2",i.DIVISION],SQRT2:["M_SQRT2",i.ATOMIC],SQRT1_2:["M_SQRT1_2",i.ATOMIC],INFINITY:["INF",i.ATOMIC]}[t.getFieldValue("CONSTANT")]},_e=function(t,n){var r={EVEN:[""," % 2 == 0",i.MODULUS,i.EQUALITY],ODD:[""," % 2 == 1",i.MODULUS,i.EQUALITY],WHOLE:["is_int(",")",i.NONE,i.FUNCTION_CALL],POSITIVE:[""," > 0",i.RELATIONAL,i.RELATIONAL],NEGATIVE:[""," < 0",i.RELATIONAL,i.RELATIONAL],DIVISIBLE_BY:[null,null,i.MODULUS,i.EQUALITY],PRIME:[null,null,i.NONE,i.FUNCTION_CALL]};const e=t.getFieldValue("PROPERTY"),[o,s,l,a]=r[e];if(r=n.valueToCode(t,"NUMBER_TO_CHECK",l)||"0",e==="PRIME")t=n.provideFunction_("math_isPrime",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($n) {
  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  if ($n == 2 || $n == 3) {
    return true;
  }
  // False if n is NaN, negative, is 1, or not whole.
  // And false if n is divisible by 2 or 3.
  if (!is_numeric($n) || $n <= 1 || $n % 1 != 0 || $n % 2 == 0 || $n % 3 == 0) {
    return false;
  }
  // Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for ($x = 6; $x <= sqrt($n) + 1; $x += 6) {
    if ($n % ($x - 1) == 0 || $n % ($x + 1) == 0) {
      return false;
    }
  }
  return true;
}
`)+"("+r+")";else if(e==="DIVISIBLE_BY"){if(t=n.valueToCode(t,"DIVISOR",i.MODULUS)||"0",t==="0")return["false",i.ATOMIC];t=r+" % "+t+" == 0"}else t=o+r+s;return[t,a]},ue=function(t,n){const r=n.valueToCode(t,"DELTA",i.ADDITION)||"0";return n.getVariableName(t.getFieldValue("VAR"))+" += "+r+`;
`},X=function(t,n){var r=t.getFieldValue("OP");switch(r){case"SUM":t=n.valueToCode(t,"LIST",i.FUNCTION_CALL)||"array()",t="array_sum("+t+")";break;case"MIN":t=n.valueToCode(t,"LIST",i.FUNCTION_CALL)||"array()",t="min("+t+")";break;case"MAX":t=n.valueToCode(t,"LIST",i.FUNCTION_CALL)||"array()",t="max("+t+")";break;case"AVERAGE":r=n.provideFunction_("math_mean",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($myList) {
  return array_sum($myList) / count($myList);
}
`),t=n.valueToCode(t,"LIST",i.NONE)||"array()",t=r+"("+t+")";break;case"MEDIAN":r=n.provideFunction_("math_median",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($arr) {
  sort($arr,SORT_NUMERIC);
  return (count($arr) % 2) ? $arr[floor(count($arr) / 2)] :
      ($arr[floor(count($arr) / 2)] + $arr[floor(count($arr) / 2) - 1]) / 2;
}
`),t=n.valueToCode(t,"LIST",i.NONE)||"[]",t=r+"("+t+")";break;case"MODE":r=n.provideFunction_("math_modes",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($values) {
  if (empty($values)) return array();
  $counts = array_count_values($values);
  arsort($counts); // Sort counts in descending order
  $modes = array_keys($counts, current($counts), true);
  return $modes;
}
`),t=n.valueToCode(t,"LIST",i.NONE)||"[]",t=r+"("+t+")";break;case"STD_DEV":r=n.provideFunction_("math_standard_deviation",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($numbers) {
  $n = count($numbers);
  if (!$n) return null;
  $mean = array_sum($numbers) / count($numbers);
  foreach($numbers as $key => $num) $devs[$key] = pow($num - $mean, 2);
  return sqrt(array_sum($devs) / (count($devs) - 1));
}
`),t=n.valueToCode(t,"LIST",i.NONE)||"[]",t=r+"("+t+")";break;case"RANDOM":r=n.provideFunction_("math_random_list",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($list) {
  $x = rand(0, count($list)-1);
  return $list[$x];
}
`),t=n.valueToCode(t,"LIST",i.NONE)||"[]",t=r+"("+t+")";break;default:throw Error("Unknown operator: "+r)}return[t,i.FUNCTION_CALL]},J=function(t,n){const r=n.valueToCode(t,"DIVIDEND",i.MODULUS)||"0";return t=n.valueToCode(t,"DIVISOR",i.MODULUS)||"0",[r+" % "+t,i.MODULUS]},Ne=function(t,n){const r=n.valueToCode(t,"VALUE",i.NONE)||"0",e=n.valueToCode(t,"LOW",i.NONE)||"0";return t=n.valueToCode(t,"HIGH",i.NONE)||"Infinity",["min(max("+r+", "+e+"), "+t+")",i.FUNCTION_CALL]},ee=function(t,n){const r=n.valueToCode(t,"FROM",i.NONE)||"0";return t=n.valueToCode(t,"TO",i.NONE)||"0",[n.provideFunction_("math_random_int",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($a, $b) {
  if ($a > $b) {
    return rand($b, $a);
  }
  return rand($a, $b);
}
`)+"("+r+", "+t+")",i.FUNCTION_CALL]},ve=function(t,n){return["(float)rand()/(float)getrandmax()",i.FUNCTION_CALL]},pe=function(t,n){const r=n.valueToCode(t,"X",i.NONE)||"0";return["atan2("+(n.valueToCode(t,"Y",i.NONE)||"0")+", "+r+") / pi() * 180",i.DIVISION]},de=function(t,n){var r=[],e=t.workspace,o=_.allUsedVarModels$$module$build$src$core$variables(e)||[];for(var s of o)o=s.getName(),t.getVars().includes(o)||r.push(n.getVariableName(o));for(e=_.allDeveloperVariables$$module$build$src$core$variables(e),s=0;s<e.length;s++)r.push(n.nameDB_.getName(e[s],_.NameType$$module$build$src$core$names.DEVELOPER_VARIABLE));e=r.length?n.INDENT+"global "+r.join(", ")+`;
`:"",r=n.getProcedureName(t.getFieldValue("NAME")),s="",n.STATEMENT_PREFIX&&(s+=n.injectId(n.STATEMENT_PREFIX,t)),n.STATEMENT_SUFFIX&&(s+=n.injectId(n.STATEMENT_SUFFIX,t)),s&&(s=n.prefixLines(s,n.INDENT)),o="",n.INFINITE_LOOP_TRAP&&(o=n.prefixLines(n.injectId(n.INFINITE_LOOP_TRAP,t),n.INDENT));let l="";t.getInput("STACK")&&(l=n.statementToCode(t,"STACK"));let a="";t.getInput("RETURN")&&(a=n.valueToCode(t,"RETURN",i.NONE)||"");let g="";l&&a&&(g=s),a&&(a=n.INDENT+"return "+a+`;
`);const D=[],j=t.getVars();for(let K=0;K<j.length;K++)D[K]=n.getVariableName(j[K]);return e="function "+r+"("+D.join(", ")+`) {
`+e+s+o+l+g+a+"}",e=n.scrub_(t,e),n.definitions_["%"+r]=e,null},Te=function(t,n){const r=n.getProcedureName(t.getFieldValue("NAME")),e=[],o=t.getVars();for(let s=0;s<o.length;s++)e[s]=n.valueToCode(t,"ARG"+s,i.NONE)||"null";return[r+"("+e.join(", ")+")",i.FUNCTION_CALL]},Ie=function(t,n){return n.forBlock.procedures_callreturn(t,n)[0]+`;
`},he=function(t,n){let r="if ("+(n.valueToCode(t,"CONDITION",i.NONE)||"false")+`) {
`;return n.STATEMENT_SUFFIX&&(r+=n.prefixLines(n.injectId(n.STATEMENT_SUFFIX,t),n.INDENT)),t.hasReturnValue_?(t=n.valueToCode(t,"VALUE",i.NONE)||"null",r+=n.INDENT+"return "+t+`;
`):r+=n.INDENT+`return;
`,r+`}
`},Oe=function(t,n){return[n.quote_(t.getFieldValue("TEXT")),i.ATOMIC]},Se=function(t,n){if(t.itemCount_===0)return["''",i.ATOMIC];if(t.itemCount_===1)return[n.valueToCode(t,"ADD0",i.NONE)||"''",i.NONE];if(t.itemCount_===2){var r=n.valueToCode(t,"ADD0",i.STRING_CONCAT)||"''";return t=n.valueToCode(t,"ADD1",i.STRING_CONCAT)||"''",[r+" . "+t,i.STRING_CONCAT]}r=Array(t.itemCount_);for(let e=0;e<t.itemCount_;e++)r[e]=n.valueToCode(t,"ADD"+e,i.NONE)||"''";return["implode('', array("+r.join(",")+"))",i.FUNCTION_CALL]},Ae=function(t,n){const r=n.getVariableName(t.getFieldValue("VAR"));return t=n.valueToCode(t,"TEXT",i.ASSIGNMENT)||"''",r+" .= "+t+`;
`},te=function(t,n){const r=n.provideFunction_("length",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($value) {
  if (is_string($value)) {
    return strlen($value);
  }
  return count($value);
}
`);return t=n.valueToCode(t,"VALUE",i.NONE)||"''",[r+"("+t+")",i.FUNCTION_CALL]},Me=function(t,n){return["empty("+(n.valueToCode(t,"VALUE",i.NONE)||"''")+")",i.FUNCTION_CALL]},ge=function(t,n){const r=t.getFieldValue("END")==="FIRST"?"strpos":"strrpos",e=n.valueToCode(t,"FIND",i.NONE)||"''",o=n.valueToCode(t,"VALUE",i.NONE)||"''";let s=" -1",l="";return t.workspace.options.oneBasedIndex&&(s=" 0",l=" + 1"),[n.provideFunction_(t.getFieldValue("END")==="FIRST"?"text_indexOf":"text_lastIndexOf",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($text, $search) {
  $pos = ${r}($text, $search);
  return $pos === false ? ${s} : $pos${l};
}
`)+"("+o+", "+e+")",i.FUNCTION_CALL]},fe=function(t,n){const r=t.getFieldValue("WHERE")||"FROM_START",e=n.valueToCode(t,"VALUE",i.NONE)||"''";switch(r){case"FIRST":return["substr("+e+", 0, 1)",i.FUNCTION_CALL];case"LAST":return["substr("+e+", -1)",i.FUNCTION_CALL];case"FROM_START":return t=n.getAdjusted(t,"AT"),["substr("+e+", "+t+", 1)",i.FUNCTION_CALL];case"FROM_END":return t=n.getAdjusted(t,"AT",1,!0),["substr("+e+", "+t+", 1)",i.FUNCTION_CALL];case"RANDOM":return[n.provideFunction_("text_random_letter",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($text) {
  return $text[rand(0, strlen($text) - 1)];
}
`)+"("+e+")",i.FUNCTION_CALL]}throw Error("Unhandled option (text_charAt).")},Ce=function(t,n){const r=t.getFieldValue("WHERE1"),e=t.getFieldValue("WHERE2"),o=n.valueToCode(t,"STRING",i.NONE)||"''";if(r==="FIRST"&&e==="LAST")return[o,i.NONE];const s=n.getAdjusted(t,"AT1");return t=n.getAdjusted(t,"AT2"),[n.provideFunction_("text_get_substring",`
function ${n.FUNCTION_NAME_PLACEHOLDER_}($text, $where1, $at1, $where2, $at2) {
  if ($where1 == 'FROM_END') {
    $at1 = strlen($text) - 1 - $at1;
  } else if ($where1 == 'FIRST') {
    $at1 = 0;
  } else if ($where1 != 'FROM_START') {
    throw new Exception('Unhandled option (text_get_substring).');
  }
  $length = 0;
  if ($where2 == 'FROM_START') {
    $length = $at2 - $at1 + 1;
  } else if ($where2 == 'FROM_END') {
    $length = strlen($text) - $at1 - $at2;
  } else if ($where2 == 'LAST') {
    $length = strlen($text) - $at1;
  } else {
    throw new Exception('Unhandled option (text_get_substring).');
  }
  return substr($text, $at1, $length);
}
`)+"("+o+", '"+r+"', "+s+", '"+e+"', "+t+")",i.FUNCTION_CALL]},Le=function(t,n){n=n.valueToCode(t,"TEXT",i.NONE)||"''";let r;return t.getFieldValue("CASE")==="UPPERCASE"?r="strtoupper("+n+")":t.getFieldValue("CASE")==="LOWERCASE"?r="strtolower("+n+")":t.getFieldValue("CASE")==="TITLECASE"&&(r="ucwords(strtolower("+n+"))"),[r,i.FUNCTION_CALL]},Re=function(t,n){const r={LEFT:"ltrim",RIGHT:"rtrim",BOTH:"trim"}[t.getFieldValue("MODE")];return t=n.valueToCode(t,"TEXT",i.NONE)||"''",[r+"("+t+")",i.FUNCTION_CALL]},Fe=function(t,n){return"print("+(n.valueToCode(t,"TEXT",i.NONE)||"''")+`);
`},Ee=function(t,n){return n="readline("+(t.getField("TEXT")?n.quote_(t.getFieldValue("TEXT")):n.valueToCode(t,"TEXT",i.NONE)||"''")+")",t.getFieldValue("TYPE")==="NUMBER"&&(n="floatval("+n+")"),[n,i.FUNCTION_CALL]},me=function(t,n){const r=n.valueToCode(t,"TEXT",i.NONE)||"''";return t=n.valueToCode(t,"SUB",i.NONE)||"''",["strlen("+t+") === 0 ? strlen("+r+") + 1 : substr_count("+r+", "+t+")",i.CONDITIONAL]},re=function(t,n){const r=n.valueToCode(t,"TEXT",i.NONE)||"''",e=n.valueToCode(t,"FROM",i.NONE)||"''";return t=n.valueToCode(t,"TO",i.NONE)||"''",["str_replace("+e+", "+t+", "+r+")",i.FUNCTION_CALL]},De=function(t,n){return["strrev("+(n.valueToCode(t,"TEXT",i.NONE)||"''")+")",i.FUNCTION_CALL]},ae=function(t,n){return[n.getVariableName(t.getFieldValue("VAR")),i.ATOMIC]},ie=function(t,n){const r=n.valueToCode(t,"VALUE",i.ASSIGNMENT)||"0";return n.getVariableName(t.getFieldValue("VAR"))+" = "+r+`;
`},i;(function(t){t[t.ATOMIC=0]="ATOMIC",t[t.CLONE=1]="CLONE",t[t.NEW=1]="NEW",t[t.MEMBER=2.1]="MEMBER",t[t.FUNCTION_CALL=2.2]="FUNCTION_CALL",t[t.POWER=3]="POWER",t[t.INCREMENT=4]="INCREMENT",t[t.DECREMENT=4]="DECREMENT",t[t.BITWISE_NOT=4]="BITWISE_NOT",t[t.CAST=4]="CAST",t[t.SUPPRESS_ERROR=4]="SUPPRESS_ERROR",t[t.INSTANCEOF=5]="INSTANCEOF",t[t.LOGICAL_NOT=6]="LOGICAL_NOT",t[t.UNARY_PLUS=7.1]="UNARY_PLUS",t[t.UNARY_NEGATION=7.2]="UNARY_NEGATION",t[t.MULTIPLICATION=8.1]="MULTIPLICATION",t[t.DIVISION=8.2]="DIVISION",t[t.MODULUS=8.3]="MODULUS",t[t.ADDITION=9.1]="ADDITION",t[t.SUBTRACTION=9.2]="SUBTRACTION",t[t.STRING_CONCAT=9.3]="STRING_CONCAT",t[t.BITWISE_SHIFT=10]="BITWISE_SHIFT",t[t.RELATIONAL=11]="RELATIONAL",t[t.EQUALITY=12]="EQUALITY",t[t.REFERENCE=13]="REFERENCE",t[t.BITWISE_AND=13]="BITWISE_AND",t[t.BITWISE_XOR=14]="BITWISE_XOR",t[t.BITWISE_OR=15]="BITWISE_OR",t[t.LOGICAL_AND=16]="LOGICAL_AND",t[t.LOGICAL_OR=17]="LOGICAL_OR",t[t.IF_NULL=18]="IF_NULL",t[t.CONDITIONAL=19]="CONDITIONAL",t[t.ASSIGNMENT=20]="ASSIGNMENT",t[t.LOGICAL_AND_WEAK=21]="LOGICAL_AND_WEAK",t[t.LOGICAL_XOR=22]="LOGICAL_XOR",t[t.LOGICAL_OR_WEAK=23]="LOGICAL_OR_WEAK",t[t.NONE=99]="NONE"})(i||(i={}));var u=class extends _.CodeGenerator$$module$build$src$core$generator{constructor(t="PHP"){super(t),this.ORDER_OVERRIDES=[[i.MEMBER,i.FUNCTION_CALL],[i.MEMBER,i.MEMBER],[i.LOGICAL_NOT,i.LOGICAL_NOT],[i.MULTIPLICATION,i.MULTIPLICATION],[i.ADDITION,i.ADDITION],[i.LOGICAL_AND,i.LOGICAL_AND],[i.LOGICAL_OR,i.LOGICAL_OR]],this.isInitialized=!1;for(const n in i)t=i[n],typeof t!="string"&&(this["ORDER_"+n]=t);this.addReservedWords("__halt_compiler,abstract,and,array,as,break,callable,case,catch,class,clone,const,continue,declare,default,die,do,echo,else,elseif,empty,enddeclare,endfor,endforeach,endif,endswitch,endwhile,eval,exit,extends,final,for,foreach,function,global,goto,if,implements,include,include_once,instanceof,insteadof,interface,isset,list,namespace,new,or,print,private,protected,public,require,require_once,return,static,switch,throw,trait,try,unset,use,var,while,xor,PHP_VERSION,PHP_MAJOR_VERSION,PHP_MINOR_VERSION,PHP_RELEASE_VERSION,PHP_VERSION_ID,PHP_EXTRA_VERSION,PHP_ZTS,PHP_DEBUG,PHP_MAXPATHLEN,PHP_OS,PHP_SAPI,PHP_EOL,PHP_INT_MAX,PHP_INT_SIZE,DEFAULT_INCLUDE_PATH,PEAR_INSTALL_DIR,PEAR_EXTENSION_DIR,PHP_EXTENSION_DIR,PHP_PREFIX,PHP_BINDIR,PHP_BINARY,PHP_MANDIR,PHP_LIBDIR,PHP_DATADIR,PHP_SYSCONFDIR,PHP_LOCALSTATEDIR,PHP_CONFIG_FILE_PATH,PHP_CONFIG_FILE_SCAN_DIR,PHP_SHLIB_SUFFIX,E_ERROR,E_WARNING,E_PARSE,E_NOTICE,E_CORE_ERROR,E_CORE_WARNING,E_COMPILE_ERROR,E_COMPILE_WARNING,E_USER_ERROR,E_USER_WARNING,E_USER_NOTICE,E_DEPRECATED,E_USER_DEPRECATED,E_ALL,E_STRICT,__COMPILER_HALT_OFFSET__,TRUE,FALSE,NULL,__CLASS__,__DIR__,__FILE__,__FUNCTION__,__LINE__,__METHOD__,__NAMESPACE__,__TRAIT__")}init(t){super.init(t),this.nameDB_?this.nameDB_.reset():this.nameDB_=new _.Names$$module$build$src$core$names(this.RESERVED_WORDS_,"$"),this.nameDB_.setVariableMap(t.getVariableMap()),this.nameDB_.populateVariables(t),this.nameDB_.populateProcedures(t),this.isInitialized=!0}finish(t){const n=Object.values(this.definitions_);return t=super.finish(t),this.isInitialized=!1,this.nameDB_.reset(),n.join(`

`)+`


`+t}scrubNakedValue(t){return t+`;
`}quote_(t){return t=t.replace(/\\/g,"\\\\").replace(/\n/g,`\\
`).replace(/'/g,"\\'"),"'"+t+"'"}multiline_quote_(t){return t.split(/\n/g).map(this.quote_).join(` . "\\n" .
`)}scrub_(t,n,r=!1){let e="";if(!t.outputConnection||!t.outputConnection.targetConnection){var o=t.getCommentText();o&&(o=_.wrap$$module$build$src$core$utils$string(o,this.COMMENT_WRAP-3),e+=this.prefixLines(o,"// ")+`
`);for(let s=0;s<t.inputList.length;s++)t.inputList[s].type===_.inputTypes$$module$build$src$core$inputs$input_types.VALUE&&(o=t.inputList[s].connection.targetBlock())&&(o=this.allNestedComments(o))&&(e+=this.prefixLines(o,"// "))}return t=t.nextConnection&&t.nextConnection.targetBlock(),r=r?"":this.blockToCode(t),e+n+r}getAdjusted(t,n,r=0,e=!1,o=i.NONE){t.workspace.options.oneBasedIndex&&r--;let s=t.workspace.options.oneBasedIndex?"1":"0",l=o;return r>0?l=i.ADDITION:r<0?l=i.SUBTRACTION:e&&(l=i.UNARY_NEGATION),t=this.valueToCode(t,n,l)||s,r===0&&!e?t:_.isNumber$$module$build$src$core$utils$string(t)?(t=String(Number(t)+r),e&&(t=String(-Number(t))),t):(r>0?t=`${t} + ${r}`:r<0&&(t=`${t} - ${-r}`),e&&(t=r?`-(${t})`:`-${t}`),Math.floor(o)>=Math.floor(l)&&(t=`(${t})`),t)}},L={};L.lists_create_empty=$e,L.lists_create_with=q,L.lists_getIndex=V,L.lists_getSublist=$,L.lists_indexOf=O,L.lists_isEmpty=f,L.lists_length=ne,L.lists_repeat=le,L.lists_reverse=P,L.lists_setIndex=w,L.lists_sort=m,L.lists_split=I;var v={};v.controls_if=C,v.controls_ifelse=C,v.logic_boolean=G,v.logic_compare=Q,v.logic_negate=k,v.logic_null=R,v.logic_operation=W,v.logic_ternary=b;var S={};S.controls_flow_statements=T,S.controls_for=y,S.controls_forEach=E,S.controls_repeat=x,S.controls_repeat_ext=x,S.controls_whileUntil=B;var p={};p.math_arithmetic=F,p.math_atan2=pe,p.math_change=ue,p.math_constant=Z,p.math_constrain=Ne,p.math_modulo=J,p.math_number=A,p.math_number_property=_e,p.math_on_list=X,p.math_random_float=ve,p.math_random_int=ee,p.math_round=U,p.math_single=U,p.math_trig=U;var H={};H.procedures_callnoreturn=Ie,H.procedures_callreturn=Te,H.procedures_defnoreturn=de,H.procedures_defreturn=de,H.procedures_ifreturn=he;var c={};c.text=Oe,c.text_append=Ae,c.text_changeCase=Le,c.text_charAt=fe,c.text_count=me,c.text_getSubstring=Ce,c.text_indexOf=ge,c.text_isEmpty=Me,c.text_join=Se,c.text_length=te,c.text_print=Fe,c.text_prompt=Ee,c.text_prompt_ext=Ee,c.text_replace=re,c.text_reverse=De,c.text_trim=Re;var d={};d.variables_get=ae,d.variables_set=ie;var N={};N.variables_get_dynamic=ae,N.variables_set_dynamic=ie;var h=new u,M=Object.assign({},L,v,S,p,H,c,d,N);for(const t in M)h.forBlock[t]=M[t];var Y={};return Y.Order=i,Y.PhpGenerator=u,Y.phpGenerator=h,Y.__namespace__=_,Y})})(ke)),ke.exports}var Be={exports:{}},ot=Be.exports,Ye;function it(){return Ye||(Ye=1,(function(oe,ye){(function(z,_){oe.exports=_(Ue())})(ot,function(z){var _=z.__namespace__,$e=function(r,e){return["[]",i.ATOMIC]},q=function(r,e){const o=Array(r.itemCount_);for(let s=0;s<r.itemCount_;s++)o[s]=e.valueToCode(r,"ADD"+s,i.NONE)||"None";return["["+o.join(", ")+"]",i.ATOMIC]},le=function(r,e){const o=e.valueToCode(r,"ITEM",i.NONE)||"None";return r=e.valueToCode(r,"NUM",i.MULTIPLICATIVE)||"0",["["+o+"] * "+r,i.MULTIPLICATIVE]},ne=function(r,e){return["len("+(e.valueToCode(r,"VALUE",i.NONE)||"[]")+")",i.FUNCTION_CALL]},f=function(r,e){return["not len("+(e.valueToCode(r,"VALUE",i.NONE)||"[]")+")",i.LOGICAL_NOT]},O=function(r,e){const o=e.valueToCode(r,"FIND",i.NONE)||"[]",s=e.valueToCode(r,"VALUE",i.NONE)||"''";let l=" -1",a="",g=" - 1";return r.workspace.options.oneBasedIndex&&(l=" 0",a=" + 1",g=""),[(r.getFieldValue("END")==="FIRST"?e.provideFunction_("first_index",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(my_list, elem):
  try: index = my_list.index(elem)${a}
  except: index =${l}
  return index
`):e.provideFunction_("last_index",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(my_list, elem):
  try: index = len(my_list) - my_list[::-1].index(elem)${g}
  except: index =${l}
  return index
`))+"("+s+", "+o+")",i.FUNCTION_CALL]},V=function(r,e){const o=r.getFieldValue("MODE")||"GET",s=r.getFieldValue("WHERE")||"FROM_START";var l=e.valueToCode(r,"VALUE",s==="RANDOM"?i.NONE:i.MEMBER)||"[]";switch(s){case"FIRST":if(o==="GET")return[l+"[0]",i.MEMBER];if(o==="GET_REMOVE")return[l+".pop(0)",i.FUNCTION_CALL];if(o==="REMOVE")return l+`.pop(0)
`;break;case"LAST":if(o==="GET")return[l+"[-1]",i.MEMBER];if(o==="GET_REMOVE")return[l+".pop()",i.FUNCTION_CALL];if(o==="REMOVE")return l+`.pop()
`;break;case"FROM_START":if(r=e.getAdjustedInt(r,"AT"),o==="GET")return[l+"["+r+"]",i.MEMBER];if(o==="GET_REMOVE")return[l+".pop("+r+")",i.FUNCTION_CALL];if(o==="REMOVE")return l+".pop("+r+`)
`;break;case"FROM_END":if(r=e.getAdjustedInt(r,"AT",1,!0),o==="GET")return[l+"["+r+"]",i.MEMBER];if(o==="GET_REMOVE")return[l+".pop("+r+")",i.FUNCTION_CALL];if(o==="REMOVE")return l+".pop("+r+`)
`;break;case"RANDOM":if(e.definitions_.import_random="import random",o==="GET")return["random.choice("+l+")",i.FUNCTION_CALL];if(l=e.provideFunction_("lists_remove_random_item",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(myList):
  x = int(random.random() * len(myList))
  return myList.pop(x)
`)+"("+l+")",o==="GET_REMOVE")return[l,i.FUNCTION_CALL];if(o==="REMOVE")return l+`
`}throw Error("Unhandled combination (lists_getIndex).")},w=function(r,e){let o=e.valueToCode(r,"LIST",i.MEMBER)||"[]";const s=r.getFieldValue("MODE")||"GET";var l=r.getFieldValue("WHERE")||"FROM_START";const a=e.valueToCode(r,"TO",i.NONE)||"None";switch(l){case"FIRST":if(s==="SET")return o+"[0] = "+a+`
`;if(s==="INSERT")return o+".insert(0, "+a+`)
`;break;case"LAST":if(s==="SET")return o+"[-1] = "+a+`
`;if(s==="INSERT")return o+".append("+a+`)
`;break;case"FROM_START":if(e=e.getAdjustedInt(r,"AT"),s==="SET")return o+"["+e+"] = "+a+`
`;if(s==="INSERT")return o+".insert("+e+", "+a+`)
`;break;case"FROM_END":if(e=e.getAdjustedInt(r,"AT",1,!0),s==="SET")return o+"["+e+"] = "+a+`
`;if(s==="INSERT")return o+".insert("+e+", "+a+`)
`;break;case"RANDOM":if(e.definitions_.import_random="import random",o.match(/^\w+$/)?r="":(r=e.nameDB_.getDistinctName("tmp_list",_.NameType$$module$build$src$core$names.VARIABLE),l=r+" = "+o+`
`,o=r,r=l),e=e.nameDB_.getDistinctName("tmp_x",_.NameType$$module$build$src$core$names.VARIABLE),r+=e+" = int(random.random() * len("+o+`))
`,s==="SET")return r+(o+"["+e+"] = "+a+`
`);if(s==="INSERT")return r+(o+".insert("+e+", "+a+`)
`)}throw Error("Unhandled combination (lists_setIndex).")},$=function(r,e){const o=e.valueToCode(r,"LIST",i.MEMBER)||"[]";var s=r.getFieldValue("WHERE1");const l=r.getFieldValue("WHERE2");switch(s){case"FROM_START":s=e.getAdjustedInt(r,"AT1"),s===0&&(s="");break;case"FROM_END":s=e.getAdjustedInt(r,"AT1",1,!0);break;case"FIRST":s="";break;default:throw Error("Unhandled option (lists_getSublist)")}switch(l){case"FROM_START":r=e.getAdjustedInt(r,"AT2",1);break;case"FROM_END":r=e.getAdjustedInt(r,"AT2",0,!0),_.isNumber$$module$build$src$core$utils$string(String(r))?r===0&&(r=""):(e.definitions_.import_sys="import sys",r+=" or sys.maxsize");break;case"LAST":r="";break;default:throw Error("Unhandled option (lists_getSublist)")}return[o+"["+s+" : "+r+"]",i.MEMBER]},m=function(r,e){const o=e.valueToCode(r,"LIST",i.NONE)||"[]",s=r.getFieldValue("TYPE");return r=r.getFieldValue("DIRECTION")==="1"?"False":"True",[e.provideFunction_("lists_sort",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(my_list, type, reverse):
  def try_float(s):
    try:
      return float(s)
    except:
      return 0
  key_funcs = {
    "NUMERIC": try_float,
    "TEXT": str,
    "IGNORE_CASE": lambda s: str(s).lower()
  }
  key_func = key_funcs[type]
  list_cpy = list(my_list)
  return sorted(list_cpy, key=key_func, reverse=reverse)
`)+"("+o+', "'+s+'", '+r+")",i.FUNCTION_CALL]},I=function(r,e){var o=r.getFieldValue("MODE");if(o==="SPLIT")o=e.valueToCode(r,"INPUT",i.MEMBER)||"''",r=e.valueToCode(r,"DELIM",i.NONE),r=o+".split("+r+")";else if(o==="JOIN")o=e.valueToCode(r,"INPUT",i.NONE)||"[]",r=(e.valueToCode(r,"DELIM",i.MEMBER)||"''")+".join("+o+")";else throw Error("Unknown mode: "+o);return[r,i.FUNCTION_CALL]},P=function(r,e){return["list(reversed("+(e.valueToCode(r,"LIST",i.NONE)||"[]")+"))",i.FUNCTION_CALL]},C=function(r,e){let o=0,s="",l,a;e.STATEMENT_PREFIX&&(s+=e.injectId(e.STATEMENT_PREFIX,r));do a=e.valueToCode(r,"IF"+o,i.NONE)||"False",l=e.statementToCode(r,"DO"+o)||e.PASS,e.STATEMENT_SUFFIX&&(l=e.prefixLines(e.injectId(e.STATEMENT_SUFFIX,r),e.INDENT)+l),s+=(o===0?"if ":"elif ")+a+`:
`+l,o++;while(r.getInput("IF"+o));return(r.getInput("ELSE")||e.STATEMENT_SUFFIX)&&(l=r.getInput("ELSE")&&e.statementToCode(r,"ELSE")||e.PASS,e.STATEMENT_SUFFIX&&(l=e.prefixLines(e.injectId(e.STATEMENT_SUFFIX,r),e.INDENT)+l),s+=`else:
`+l),s},Q=function(r,e){const o={EQ:"==",NEQ:"!=",LT:"<",LTE:"<=",GT:">",GTE:">="}[r.getFieldValue("OP")],s=i.RELATIONAL,l=e.valueToCode(r,"A",s)||"0";return r=e.valueToCode(r,"B",s)||"0",[l+" "+o+" "+r,s]},W=function(r,e){const o=r.getFieldValue("OP")==="AND"?"and":"or",s=o==="and"?i.LOGICAL_AND:i.LOGICAL_OR;let l=e.valueToCode(r,"A",s);return r=e.valueToCode(r,"B",s),l||r?(e=o==="and"?"True":"False",l||(l=e),r||(r=e)):r=l="False",[l+" "+o+" "+r,s]},k=function(r,e){return["not "+(e.valueToCode(r,"BOOL",i.LOGICAL_NOT)||"True"),i.LOGICAL_NOT]},G=function(r,e){return[r.getFieldValue("BOOL")==="TRUE"?"True":"False",i.ATOMIC]},R=function(r,e){return["None",i.ATOMIC]},b=function(r,e){const o=e.valueToCode(r,"IF",i.CONDITIONAL)||"False",s=e.valueToCode(r,"THEN",i.CONDITIONAL)||"None";return r=e.valueToCode(r,"ELSE",i.CONDITIONAL)||"None",[s+" if "+o+" else "+r,i.CONDITIONAL]},x=function(r,e){let o;o=r.getField("TIMES")?String(parseInt(r.getFieldValue("TIMES"),10)):e.valueToCode(r,"TIMES",i.NONE)||"0",o=_.isNumber$$module$build$src$core$utils$string(o)?parseInt(o,10):"int("+o+")";let s=e.statementToCode(r,"DO");return s=e.addLoopTrap(s,r)||e.PASS,"for "+e.nameDB_.getDistinctName("count",_.NameType$$module$build$src$core$names.VARIABLE)+" in range("+o+`):
`+s},B=function(r,e){const o=r.getFieldValue("MODE")==="UNTIL";let s=e.valueToCode(r,"BOOL",o?i.LOGICAL_NOT:i.NONE)||"False",l=e.statementToCode(r,"DO");return l=e.addLoopTrap(l,r)||e.PASS,o&&(s="not "+s),"while "+s+`:
`+l},y=function(r,e){const o=e.getVariableName(r.getFieldValue("VAR"));var s=e.valueToCode(r,"FROM",i.NONE)||"0",l=e.valueToCode(r,"TO",i.NONE)||"0",a=e.valueToCode(r,"BY",i.NONE)||"1";let g=e.statementToCode(r,"DO");g=e.addLoopTrap(g,r)||e.PASS;let D="";r=function(){return e.provideFunction_("upRange",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(start, stop, step):
  while start <= stop:
    yield start
    start += abs(step)
`)};const j=function(){return e.provideFunction_("downRange",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(start, stop, step):
  while start >= stop:
    yield start
    start -= abs(step)
`)};if(_.isNumber$$module$build$src$core$utils$string(s)&&_.isNumber$$module$build$src$core$utils$string(l)&&_.isNumber$$module$build$src$core$utils$string(a))s=Number(s),l=Number(l),a=Math.abs(Number(a)),s%1===0&&l%1===0&&a%1===0?(s<=l?(l++,r=s===0&&a===1?l:s+", "+l,a!==1&&(r+=", "+a)):(l--,r=s+", "+l+", -"+a),r="range("+r+")"):(r=s<l?r():j(),r+="("+s+", "+l+", "+a+")");else{const K=function(ce,se){return _.isNumber$$module$build$src$core$utils$string(ce)?ce=String(Number(ce)):ce.match(/^\w+$/)||(se=e.nameDB_.getDistinctName(o+se,_.NameType$$module$build$src$core$names.VARIABLE),D+=se+" = "+ce+`
`,ce=se),ce};s=K(s,"_start"),l=K(l,"_end"),a=K(a,"_inc"),typeof s=="number"&&typeof l=="number"?(r=s<l?r():j(),r+="("+s+", "+l+", "+a+")"):r="("+s+" <= "+l+") and "+r()+"("+s+", "+l+", "+a+") or "+j()+"("+s+", "+l+", "+a+")"}return D+="for "+o+" in "+r+`:
`+g},E=function(r,e){const o=e.getVariableName(r.getFieldValue("VAR")),s=e.valueToCode(r,"LIST",i.RELATIONAL)||"[]";let l=e.statementToCode(r,"DO");return l=e.addLoopTrap(l,r)||e.PASS,"for "+o+" in "+s+`:
`+l},T=function(r,e){let o="";if(e.STATEMENT_PREFIX&&(o+=e.injectId(e.STATEMENT_PREFIX,r)),e.STATEMENT_SUFFIX&&(o+=e.injectId(e.STATEMENT_SUFFIX,r)),e.STATEMENT_PREFIX){const s=r.getSurroundLoop();s&&!s.suppressPrefixSuffix&&(o+=e.injectId(e.STATEMENT_PREFIX,s))}switch(r.getFieldValue("FLOW")){case"BREAK":return o+`break
`;case"CONTINUE":return o+`continue
`}throw Error("Unknown flow statement.")},A=function(r,e){return r=Number(r.getFieldValue("NUM")),r===1/0?['float("inf")',i.FUNCTION_CALL]:r===-1/0?['-float("inf")',i.UNARY_SIGN]:[String(r),r<0?i.UNARY_SIGN:i.ATOMIC]},F=function(r,e){var o={ADD:[" + ",i.ADDITIVE],MINUS:[" - ",i.ADDITIVE],MULTIPLY:[" * ",i.MULTIPLICATIVE],DIVIDE:[" / ",i.MULTIPLICATIVE],POWER:[" ** ",i.EXPONENTIATION]}[r.getFieldValue("OP")];const s=o[0];o=o[1];const l=e.valueToCode(r,"A",o)||"0";return r=e.valueToCode(r,"B",o)||"0",[l+s+r,o]},U=function(r,e){const o=r.getFieldValue("OP");let s;if(o==="NEG")return s=e.valueToCode(r,"NUM",i.UNARY_SIGN)||"0",["-"+s,i.UNARY_SIGN];switch(e.definitions_.import_math="import math",r=o==="SIN"||o==="COS"||o==="TAN"?e.valueToCode(r,"NUM",i.MULTIPLICATIVE)||"0":e.valueToCode(r,"NUM",i.NONE)||"0",o){case"ABS":s="math.fabs("+r+")";break;case"ROOT":s="math.sqrt("+r+")";break;case"LN":s="math.log("+r+")";break;case"LOG10":s="math.log10("+r+")";break;case"EXP":s="math.exp("+r+")";break;case"POW10":s="math.pow(10,"+r+")";break;case"ROUND":s="round("+r+")";break;case"ROUNDUP":s="math.ceil("+r+")";break;case"ROUNDDOWN":s="math.floor("+r+")";break;case"SIN":s="math.sin("+r+" / 180.0 * math.pi)";break;case"COS":s="math.cos("+r+" / 180.0 * math.pi)";break;case"TAN":s="math.tan("+r+" / 180.0 * math.pi)"}if(s)return[s,i.FUNCTION_CALL];switch(o){case"ASIN":s="math.asin("+r+") / math.pi * 180";break;case"ACOS":s="math.acos("+r+") / math.pi * 180";break;case"ATAN":s="math.atan("+r+") / math.pi * 180";break;default:throw Error("Unknown math operator: "+o)}return[s,i.MULTIPLICATIVE]},Z=function(r,e){const o={PI:["math.pi",i.MEMBER],E:["math.e",i.MEMBER],GOLDEN_RATIO:["(1 + math.sqrt(5)) / 2",i.MULTIPLICATIVE],SQRT2:["math.sqrt(2)",i.MEMBER],SQRT1_2:["math.sqrt(1.0 / 2)",i.MEMBER],INFINITY:["float('inf')",i.ATOMIC]};return r=r.getFieldValue("CONSTANT"),r!=="INFINITY"&&(e.definitions_.import_math="import math"),o[r]},_e=function(r,e){var o={EVEN:[" % 2 == 0",i.MULTIPLICATIVE,i.RELATIONAL],ODD:[" % 2 == 1",i.MULTIPLICATIVE,i.RELATIONAL],WHOLE:[" % 1 == 0",i.MULTIPLICATIVE,i.RELATIONAL],POSITIVE:[" > 0",i.RELATIONAL,i.RELATIONAL],NEGATIVE:[" < 0",i.RELATIONAL,i.RELATIONAL],DIVISIBLE_BY:[null,i.MULTIPLICATIVE,i.RELATIONAL],PRIME:[null,i.NONE,i.FUNCTION_CALL]};const s=r.getFieldValue("PROPERTY"),[l,a,g]=o[s];if(o=e.valueToCode(r,"NUMBER_TO_CHECK",a)||"0",s==="PRIME")e.definitions_.import_math="import math",e.definitions_.from_numbers_import_Number="from numbers import Number",r=e.provideFunction_("math_isPrime",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(n):
  # https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  # If n is not a number but a string, try parsing it.
  if not isinstance(n, Number):
    try:
      n = float(n)
    except:
      return False
  if n == 2 or n == 3:
    return True
  # False if n is negative, is 1, or not whole, or if n is divisible by 2 or 3.
  if n <= 1 or n % 1 != 0 or n % 2 == 0 or n % 3 == 0:
    return False
  # Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for x in range(6, int(math.sqrt(n)) + 2, 6):
    if n % (x - 1) == 0 or n % (x + 1) == 0:
      return False
  return True
`)+"("+o+")";else if(s==="DIVISIBLE_BY"){if(r=e.valueToCode(r,"DIVISOR",i.MULTIPLICATIVE)||"0",r==="0")return["False",i.ATOMIC];r=o+" % "+r+" == 0"}else r=o+l;return[r,g]},ue=function(r,e){e.definitions_.from_numbers_import_Number="from numbers import Number";const o=e.valueToCode(r,"DELTA",i.ADDITIVE)||"0";return r=e.getVariableName(r.getFieldValue("VAR")),r+" = ("+r+" if isinstance("+r+", Number) else 0) + "+o+`
`},X=function(r,e){const o=r.getFieldValue("OP");switch(r=e.valueToCode(r,"LIST",i.NONE)||"[]",o){case"SUM":e="sum("+r+")";break;case"MIN":e="min("+r+")";break;case"MAX":e="max("+r+")";break;case"AVERAGE":e.definitions_.from_numbers_import_Number="from numbers import Number",e=e.provideFunction_("math_mean",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(myList):
  localList = [e for e in myList if isinstance(e, Number)]
  if not localList: return
  return float(sum(localList)) / len(localList)
`)+"("+r+")";break;case"MEDIAN":e.definitions_.from_numbers_import_Number="from numbers import Number",e=e.provideFunction_("math_median",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(myList):
  localList = sorted([e for e in myList if isinstance(e, Number)])
  if not localList: return
  if len(localList) % 2 == 0:
    return (localList[len(localList) // 2 - 1] + localList[len(localList) // 2]) / 2.0
  else:
    return localList[(len(localList) - 1) // 2]
`)+"("+r+")";break;case"MODE":e=e.provideFunction_("math_modes",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(some_list):
  modes = []
  # Using a lists of [item, count] to keep count rather than dict
  # to avoid "unhashable" errors when the counted item is itself a list or dict.
  counts = []
  maxCount = 1
  for item in some_list:
    found = False
    for count in counts:
      if count[0] == item:
        count[1] += 1
        maxCount = max(maxCount, count[1])
        found = True
    if not found:
      counts.append([item, 1])
  for counted_item, item_count in counts:
    if item_count == maxCount:
      modes.append(counted_item)
  return modes
`)+"("+r+")";break;case"STD_DEV":e.definitions_.import_math="import math",e=e.provideFunction_("math_standard_deviation",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(numbers):
  n = len(numbers)
  if n == 0: return
  mean = float(sum(numbers)) / n
  variance = sum((x - mean) ** 2 for x in numbers) / n
  return math.sqrt(variance)
`)+"("+r+")";break;case"RANDOM":e.definitions_.import_random="import random",e="random.choice("+r+")";break;default:throw Error("Unknown operator: "+o)}return[e,i.FUNCTION_CALL]},J=function(r,e){const o=e.valueToCode(r,"DIVIDEND",i.MULTIPLICATIVE)||"0";return r=e.valueToCode(r,"DIVISOR",i.MULTIPLICATIVE)||"0",[o+" % "+r,i.MULTIPLICATIVE]},Ne=function(r,e){const o=e.valueToCode(r,"VALUE",i.NONE)||"0",s=e.valueToCode(r,"LOW",i.NONE)||"0";return r=e.valueToCode(r,"HIGH",i.NONE)||"float('inf')",["min(max("+o+", "+s+"), "+r+")",i.FUNCTION_CALL]},ee=function(r,e){e.definitions_.import_random="import random";const o=e.valueToCode(r,"FROM",i.NONE)||"0";return r=e.valueToCode(r,"TO",i.NONE)||"0",["random.randint("+o+", "+r+")",i.FUNCTION_CALL]},ve=function(r,e){return e.definitions_.import_random="import random",["random.random()",i.FUNCTION_CALL]},pe=function(r,e){e.definitions_.import_math="import math";const o=e.valueToCode(r,"X",i.NONE)||"0";return["math.atan2("+(e.valueToCode(r,"Y",i.NONE)||"0")+", "+o+") / math.pi * 180",i.MULTIPLICATIVE]},de=function(r,e){var o=[],s=r.workspace,l=_.allUsedVarModels$$module$build$src$core$variables(s)||[];for(var a of l)l=a.getName(),r.getVars().includes(l)||o.push(e.getVariableName(l));for(s=_.allDeveloperVariables$$module$build$src$core$variables(s),a=0;a<s.length;a++)o.push(e.nameDB_.getName(s[a],_.NameType$$module$build$src$core$names.DEVELOPER_VARIABLE));s=o.length?e.INDENT+"global "+o.join(", ")+`
`:"",o=e.getProcedureName(r.getFieldValue("NAME")),a="",e.STATEMENT_PREFIX&&(a+=e.injectId(e.STATEMENT_PREFIX,r)),e.STATEMENT_SUFFIX&&(a+=e.injectId(e.STATEMENT_SUFFIX,r)),a&&(a=e.prefixLines(a,e.INDENT)),l="",e.INFINITE_LOOP_TRAP&&(l=e.prefixLines(e.injectId(e.INFINITE_LOOP_TRAP,r),e.INDENT));let g="";r.getInput("STACK")&&(g=e.statementToCode(r,"STACK"));let D="";r.getInput("RETURN")&&(D=e.valueToCode(r,"RETURN",i.NONE)||"");let j="";g&&D&&(j=a),D?D=e.INDENT+"return "+D+`
`:g||(g=e.PASS);const K=[],ce=r.getVars();for(let se=0;se<ce.length;se++)K[se]=e.getVariableName(ce[se]);return s="def "+o+"("+K.join(", ")+`):
`+s+a+l+g+j+D,s=e.scrub_(r,s),e.definitions_["%"+o]=s,null},Te=function(r,e){const o=e.getProcedureName(r.getFieldValue("NAME")),s=[],l=r.getVars();for(let a=0;a<l.length;a++)s[a]=e.valueToCode(r,"ARG"+a,i.NONE)||"None";return[o+"("+s.join(", ")+")",i.FUNCTION_CALL]},Ie=function(r,e){return e.forBlock.procedures_callreturn(r,e)[0]+`
`},he=function(r,e){let o="if "+(e.valueToCode(r,"CONDITION",i.NONE)||"False")+`:
`;return e.STATEMENT_SUFFIX&&(o+=e.prefixLines(e.injectId(e.STATEMENT_SUFFIX,r),e.INDENT)),r.hasReturnValue_?(r=e.valueToCode(r,"VALUE",i.NONE)||"None",o+=e.INDENT+"return "+r+`
`):o+=e.INDENT+`return
`,o},Oe=function(r,e){return[e.quote_(r.getFieldValue("TEXT")),i.ATOMIC]},Se=function(r,e){switch(r.itemCount_){case 0:return["''",i.ATOMIC];case 1:return r=e.valueToCode(r,"ADD0",i.NONE)||"''",d(r);case 2:var o=e.valueToCode(r,"ADD0",i.NONE)||"''";return r=e.valueToCode(r,"ADD1",i.NONE)||"''",[d(o)[0]+" + "+d(r)[0],i.ADDITIVE];default:o=[];for(let s=0;s<r.itemCount_;s++)o[s]=e.valueToCode(r,"ADD"+s,i.NONE)||"''";return r=e.nameDB_.getDistinctName("x",_.NameType$$module$build$src$core$names.VARIABLE),["''.join([str("+r+") for "+r+" in ["+o.join(", ")+"]])",i.FUNCTION_CALL]}},Ae=function(r,e){const o=e.getVariableName(r.getFieldValue("VAR"));return r=e.valueToCode(r,"TEXT",i.NONE)||"''",o+" = str("+o+") + "+d(r)[0]+`
`},te=function(r,e){return["len("+(e.valueToCode(r,"VALUE",i.NONE)||"''")+")",i.FUNCTION_CALL]},Me=function(r,e){return["not len("+(e.valueToCode(r,"VALUE",i.NONE)||"''")+")",i.LOGICAL_NOT]},ge=function(r,e){const o=r.getFieldValue("END")==="FIRST"?"find":"rfind",s=e.valueToCode(r,"FIND",i.NONE)||"''";return e=(e.valueToCode(r,"VALUE",i.MEMBER)||"''")+"."+o+"("+s+")",r.workspace.options.oneBasedIndex?[e+" + 1",i.ADDITIVE]:[e,i.FUNCTION_CALL]},fe=function(r,e){const o=r.getFieldValue("WHERE")||"FROM_START",s=e.valueToCode(r,"VALUE",o==="RANDOM"?i.NONE:i.MEMBER)||"''";switch(o){case"FIRST":return[s+"[0]",i.MEMBER];case"LAST":return[s+"[-1]",i.MEMBER];case"FROM_START":return r=e.getAdjustedInt(r,"AT"),[s+"["+r+"]",i.MEMBER];case"FROM_END":return r=e.getAdjustedInt(r,"AT",1,!0),[s+"["+r+"]",i.MEMBER];case"RANDOM":return e.definitions_.import_random="import random",[e.provideFunction_("text_random_letter",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(text):
  x = int(random.random() * len(text))
  return text[x]
`)+"("+s+")",i.FUNCTION_CALL]}throw Error("Unhandled option (text_charAt).")},Ce=function(r,e){var o=r.getFieldValue("WHERE1");const s=r.getFieldValue("WHERE2"),l=e.valueToCode(r,"STRING",i.MEMBER)||"''";switch(o){case"FROM_START":o=e.getAdjustedInt(r,"AT1"),o===0&&(o="");break;case"FROM_END":o=e.getAdjustedInt(r,"AT1",1,!0);break;case"FIRST":o="";break;default:throw Error("Unhandled option (text_getSubstring)")}switch(s){case"FROM_START":r=e.getAdjustedInt(r,"AT2",1);break;case"FROM_END":r=e.getAdjustedInt(r,"AT2",0,!0),_.isNumber$$module$build$src$core$utils$string(String(r))?r===0&&(r=""):(e.definitions_.import_sys="import sys",r+=" or sys.maxsize");break;case"LAST":r="";break;default:throw Error("Unhandled option (text_getSubstring)")}return[l+"["+o+" : "+r+"]",i.MEMBER]},Le=function(r,e){const o={UPPERCASE:".upper()",LOWERCASE:".lower()",TITLECASE:".title()"}[r.getFieldValue("CASE")];return[(e.valueToCode(r,"TEXT",i.MEMBER)||"''")+o,i.FUNCTION_CALL]},Re=function(r,e){const o={LEFT:".lstrip()",RIGHT:".rstrip()",BOTH:".strip()"}[r.getFieldValue("MODE")];return[(e.valueToCode(r,"TEXT",i.MEMBER)||"''")+o,i.FUNCTION_CALL]},Fe=function(r,e){return"print("+(e.valueToCode(r,"TEXT",i.NONE)||"''")+`)
`},Ee=function(r,e){var o=e.provideFunction_("text_prompt",`
def ${e.FUNCTION_NAME_PLACEHOLDER_}(msg):
  try:
    return raw_input(msg)
  except NameError:
    return input(msg)
`);return e=r.getField("TEXT")?e.quote_(r.getFieldValue("TEXT")):e.valueToCode(r,"TEXT",i.NONE)||"''",o=o+"("+e+")",r.getFieldValue("TYPE")==="NUMBER"&&(o="float("+o+")"),[o,i.FUNCTION_CALL]},me=function(r,e){const o=e.valueToCode(r,"TEXT",i.MEMBER)||"''";return r=e.valueToCode(r,"SUB",i.NONE)||"''",[o+".count("+r+")",i.FUNCTION_CALL]},re=function(r,e){const o=e.valueToCode(r,"TEXT",i.MEMBER)||"''",s=e.valueToCode(r,"FROM",i.NONE)||"''";return r=e.valueToCode(r,"TO",i.NONE)||"''",[o+".replace("+s+", "+r+")",i.MEMBER]},De=function(r,e){return[(e.valueToCode(r,"TEXT",i.MEMBER)||"''")+"[::-1]",i.MEMBER]},ae=function(r,e){return[e.getVariableName(r.getFieldValue("VAR")),i.ATOMIC]},ie=function(r,e){const o=e.valueToCode(r,"VALUE",i.NONE)||"0";return e.getVariableName(r.getFieldValue("VAR"))+" = "+o+`
`},i;(function(r){r[r.ATOMIC=0]="ATOMIC",r[r.COLLECTION=1]="COLLECTION",r[r.STRING_CONVERSION=1]="STRING_CONVERSION",r[r.MEMBER=2.1]="MEMBER",r[r.FUNCTION_CALL=2.2]="FUNCTION_CALL",r[r.EXPONENTIATION=3]="EXPONENTIATION",r[r.UNARY_SIGN=4]="UNARY_SIGN",r[r.BITWISE_NOT=4]="BITWISE_NOT",r[r.MULTIPLICATIVE=5]="MULTIPLICATIVE",r[r.ADDITIVE=6]="ADDITIVE",r[r.BITWISE_SHIFT=7]="BITWISE_SHIFT",r[r.BITWISE_AND=8]="BITWISE_AND",r[r.BITWISE_XOR=9]="BITWISE_XOR",r[r.BITWISE_OR=10]="BITWISE_OR",r[r.RELATIONAL=11]="RELATIONAL",r[r.LOGICAL_NOT=12]="LOGICAL_NOT",r[r.LOGICAL_AND=13]="LOGICAL_AND",r[r.LOGICAL_OR=14]="LOGICAL_OR",r[r.CONDITIONAL=15]="CONDITIONAL",r[r.LAMBDA=16]="LAMBDA",r[r.NONE=99]="NONE"})(i||(i={}));var u=class extends _.CodeGenerator$$module$build$src$core$generator{constructor(r="Python"){super(r),this.ORDER_OVERRIDES=[[i.FUNCTION_CALL,i.MEMBER],[i.FUNCTION_CALL,i.FUNCTION_CALL],[i.MEMBER,i.MEMBER],[i.MEMBER,i.FUNCTION_CALL],[i.LOGICAL_NOT,i.LOGICAL_NOT],[i.LOGICAL_AND,i.LOGICAL_AND],[i.LOGICAL_OR,i.LOGICAL_OR]],this.PASS="",this.isInitialized=!1;for(const e in i)r=i[e],typeof r!="string"&&(this["ORDER_"+e]=r);this.addReservedWords("False,None,True,and,as,assert,break,class,continue,def,del,elif,else,except,exec,finally,for,from,global,if,import,in,is,lambda,nonlocal,not,or,pass,print,raise,return,try,while,with,yield,NotImplemented,Ellipsis,__debug__,quit,exit,copyright,license,credits,ArithmeticError,AssertionError,AttributeError,BaseException,BlockingIOError,BrokenPipeError,BufferError,BytesWarning,ChildProcessError,ConnectionAbortedError,ConnectionError,ConnectionRefusedError,ConnectionResetError,DeprecationWarning,EOFError,Ellipsis,EnvironmentError,Exception,FileExistsError,FileNotFoundError,FloatingPointError,FutureWarning,GeneratorExit,IOError,ImportError,ImportWarning,IndentationError,IndexError,InterruptedError,IsADirectoryError,KeyError,KeyboardInterrupt,LookupError,MemoryError,ModuleNotFoundError,NameError,NotADirectoryError,NotImplemented,NotImplementedError,OSError,OverflowError,PendingDeprecationWarning,PermissionError,ProcessLookupError,RecursionError,ReferenceError,ResourceWarning,RuntimeError,RuntimeWarning,StandardError,StopAsyncIteration,StopIteration,SyntaxError,SyntaxWarning,SystemError,SystemExit,TabError,TimeoutError,TypeError,UnboundLocalError,UnicodeDecodeError,UnicodeEncodeError,UnicodeError,UnicodeTranslateError,UnicodeWarning,UserWarning,ValueError,Warning,ZeroDivisionError,_,__build_class__,__debug__,__doc__,__import__,__loader__,__name__,__package__,__spec__,abs,all,any,apply,ascii,basestring,bin,bool,buffer,bytearray,bytes,callable,chr,classmethod,cmp,coerce,compile,complex,copyright,credits,delattr,dict,dir,divmod,enumerate,eval,exec,execfile,exit,file,filter,float,format,frozenset,getattr,globals,hasattr,hash,help,hex,id,input,int,intern,isinstance,issubclass,iter,len,license,list,locals,long,map,max,memoryview,min,next,object,oct,open,ord,pow,print,property,quit,range,raw_input,reduce,reload,repr,reversed,round,set,setattr,slice,sorted,staticmethod,str,sum,super,tuple,type,unichr,unicode,vars,xrange,zip")}init(r){super.init(r),this.PASS=this.INDENT+`pass
`,this.nameDB_?this.nameDB_.reset():this.nameDB_=new _.Names$$module$build$src$core$names(this.RESERVED_WORDS_),this.nameDB_.setVariableMap(r.getVariableMap()),this.nameDB_.populateVariables(r),this.nameDB_.populateProcedures(r);const e=[];var o=_.allDeveloperVariables$$module$build$src$core$variables(r);for(let s=0;s<o.length;s++)e.push(this.nameDB_.getName(o[s],_.Names$$module$build$src$core$names.DEVELOPER_VARIABLE_TYPE)+" = None");for(r=_.allUsedVarModels$$module$build$src$core$variables(r),o=0;o<r.length;o++)e.push(this.getVariableName(r[o].getId())+" = None");this.definitions_.variables=e.join(`
`),this.isInitialized=!0}finish(r){const e=[],o=[];for(let s in this.definitions_){const l=this.definitions_[s];l.match(/^(from\s+\S+\s+)?import\s+\S+/)?e.push(l):o.push(l)}return r=super.finish(r),this.isInitialized=!1,this.nameDB_.reset(),(e.join(`
`)+`

`+o.join(`

`)).replace(/\n\n+/g,`

`).replace(/\n*$/,`


`)+r}scrubNakedValue(r){return r+`
`}quote_(r){r=r.replace(/\\/g,"\\\\").replace(/\n/g,`\\
`);let e="'";return r.includes("'")&&(r.includes('"')?r=r.replace(/'/g,"\\'"):e='"'),e+r+e}multiline_quote_(r){return r.split(/\n/g).map(this.quote_).join(` + '\\n' + 
`)}scrub_(r,e,o=!1){let s="";if(!r.outputConnection||!r.outputConnection.targetConnection){var l=r.getCommentText();l&&(l=_.wrap$$module$build$src$core$utils$string(l,this.COMMENT_WRAP-3),s+=this.prefixLines(l+`
`,"# "));for(let a=0;a<r.inputList.length;a++)r.inputList[a].type===_.inputTypes$$module$build$src$core$inputs$input_types.VALUE&&(l=r.inputList[a].connection.targetBlock())&&(l=this.allNestedComments(l))&&(s+=this.prefixLines(l,"# "))}return r=r.nextConnection&&r.nextConnection.targetBlock(),o=o?"":this.blockToCode(r),s+e+o}getAdjustedInt(r,e,o=0,s=!1){r.workspace.options.oneBasedIndex&&o--;const l=r.workspace.options.oneBasedIndex?"1":"0";return r=this.valueToCode(r,e,o?i.ADDITIVE:i.NONE)||l,_.isNumber$$module$build$src$core$utils$string(r)?(r=parseInt(r,10)+o,s&&(r=-r)):(r=o>0?"int("+r+" + "+o+")":o<0?"int("+r+" - "+-o+")":"int("+r+")",s&&(r="-"+r)),r}},L={};L.lists_create_empty=$e,L.lists_create_with=q,L.lists_getIndex=V,L.lists_getSublist=$,L.lists_indexOf=O,L.lists_isEmpty=f,L.lists_length=ne,L.lists_repeat=le,L.lists_reverse=P,L.lists_setIndex=w,L.lists_sort=m,L.lists_split=I;var v={};v.controls_if=C,v.controls_ifelse=C,v.logic_boolean=G,v.logic_compare=Q,v.logic_negate=k,v.logic_null=R,v.logic_operation=W,v.logic_ternary=b;var S={};S.controls_flow_statements=T,S.controls_for=y,S.controls_forEach=E,S.controls_repeat=x,S.controls_repeat_ext=x,S.controls_whileUntil=B;var p={};p.math_arithmetic=F,p.math_atan2=pe,p.math_change=ue,p.math_constant=Z,p.math_constrain=Ne,p.math_modulo=J,p.math_number=A,p.math_number_property=_e,p.math_on_list=X,p.math_random_float=ve,p.math_random_int=ee,p.math_round=U,p.math_single=U,p.math_trig=U;var H={};H.procedures_callnoreturn=Ie,H.procedures_callreturn=Te,H.procedures_defnoreturn=de,H.procedures_defreturn=de,H.procedures_ifreturn=he;var c=/^\s*'([^']|\\')*'\s*$/,d=function(r){return c.test(r)?[r,i.ATOMIC]:["str("+r+")",i.FUNCTION_CALL]},N={};N.text=Oe,N.text_append=Ae,N.text_changeCase=Le,N.text_charAt=fe,N.text_count=me,N.text_getSubstring=Ce,N.text_indexOf=ge,N.text_isEmpty=Me,N.text_join=Se,N.text_length=te,N.text_print=Fe,N.text_prompt=Ee,N.text_prompt_ext=Ee,N.text_replace=re,N.text_reverse=De,N.text_trim=Re;var h={};h.variables_get=ae,h.variables_set=ie;var M={};M.variables_get_dynamic=ae,M.variables_set_dynamic=ie;var Y=new u;Y.addReservedWords("math,random,Number");var t=Object.assign({},L,v,S,p,H,N,h,M);for(const r in t)Y.forBlock[r]=t[r];var n={};return n.Order=i,n.PythonGenerator=u,n.pythonGenerator=Y,n.__namespace__=_,n})})(Be)),Be.exports}/*! For license information please see index.js.LICENSE.txt */var st=Pe.exports,We;function lt(){return We||(We=1,(function(oe,ye){(function(z,_){oe.exports=_(Ue(),qe(),Ze(),tt(),nt(),it())})(st,(z,_,$e,q,le,ne)=>(()=>{var f={127:$=>{$.exports=_},157:$=>{$.exports=q},370:$=>{$.exports=z},379:$=>{$.exports=$e},462:function($,m,I){var P;P=C=>(()=>{var Q={370:y=>{y.exports=C}},W={};function k(y){var E=W[y];if(E!==void 0)return E.exports;var T=W[y]={exports:{}};return Q[y](T,T.exports,k),T.exports}k.d=(y,E)=>{for(var T in E)k.o(E,T)&&!k.o(y,T)&&Object.defineProperty(y,T,{enumerable:!0,get:E[T]})},k.o=(y,E)=>Object.prototype.hasOwnProperty.call(y,E),k.r=y=>{typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(y,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(y,"__esModule",{value:!0})};var G={};k.r(G),k.d(G,{FieldGridDropdown:()=>B});var R=k(370);class b{constructor(E,T,A,F){this.value=A,this.selected=!1,this.selectionCallback=F,this.element=document.createElement("button"),this.element.id=R.utils.idGenerator.getNextUniqueId(),this.element.className="blocklyFieldGridItem",this.clickHandler=R.browserEvents.conditionalBind(this.element,"click",this,this.onClick,!0),E.appendChild(this.element);const U=typeof T=="string"?document.createTextNode(T):T;this.element.appendChild(U),R.utils.aria.setRole(this.element,R.utils.aria.Role.GRIDCELL)}dispose(){this.selectionCallback=null,this.element.remove(),this.clickHandler&&(R.browserEvents.unbind(this.clickHandler),this.clickHandler=null)}getId(){return this.element.id}getValue(){return this.value}isSelected(){return this.selected}setSelected(E){this.selected=E,R.utils.aria.setState(this.element,R.utils.aria.State.SELECTED,this.selected),this.element.classList.toggle("blocklyFieldGridItemSelected",this.selected),this.isSelected()&&this.focus()}onClick(){var E;this.setSelected(!0),(E=this.selectionCallback)===null||E===void 0||E.call(this,this)}focus(){this.element.focus({preventScroll:!0});const E=this.element.offsetParent;if(!E)return;const T=this.element.offsetTop,A=E.scrollTop,F=this.getInterItemSpacing();T<A?E.scrollTo(0,T-F):T+this.element.offsetHeight>A+E.clientHeight&&E.scrollBy(0,T+this.element.clientHeight-(A+E.clientHeight)+F)}getInterItemSpacing(){const E=this.element.closest(".blocklyFieldGrid");if(!E)return 0;const T=[...E.querySelectorAll(".blocklyFieldGridItem")];if(!T.length)return 0;const A=T[0].offsetTop,F=T[0].offsetHeight;for(const U of T)if(U.offsetTop!==A)return U.offsetTop-F-A;return 0}}class x{constructor(E,T,A,F,U){if(this.columns=A,this.rtl=F,this.itemIndices=new Map,this.items=new Array,this.keyDownHandler=null,this.pointerMoveHandler=null,this.selectionCallback=U,this.root=document.createElement("div"),this.root.className="blocklyFieldGrid",this.root.tabIndex=0,R.utils.aria.setRole(this.root,R.utils.aria.Role.GRID),E.appendChild(this.root),this.populateItems(T),this.keyDownHandler=R.browserEvents.conditionalBind(this.root,"keydown",this,this.onKeyDown),this.pointerMoveHandler=R.browserEvents.conditionalBind(this.root,"pointermove",this,this.onPointerMove,!0),!(A>=1))throw new Error(`Number of columns must be >= 1; got ${A}`);this.columns=A,this.root.style.setProperty("--grid-columns",`${this.columns}`)}populateItems(E){let T=document.createElement("div");for(const[A,F]of E.entries()){if(F===R.FieldDropdown.SEPARATOR)continue;A%this.columns===0&&(T=document.createElement("div"),T.className="blocklyFieldGridRow",R.utils.aria.setRole(T,R.utils.aria.Role.ROW),this.root.appendChild(T));const[U,Z]=F,_e=(()=>{if((X=U)&&typeof X=="object"&&"src"in X&&typeof X.src=="string"&&"alt"in X&&typeof X.alt=="string"&&"width"in X&&typeof X.width=="number"&&"height"in X&&typeof X.height=="number"){const J=new Image(U.width,U.height);return J.src=U.src,J.alt=U.alt||"",J}var X;return U})(),ue=new b(T,_e,Z,X=>{var J;this.setSelectedValue(X.getValue()),(J=this.selectionCallback)===null||J===void 0||J.call(this,X)});this.itemIndices.set(ue.getId(),this.itemIndices.size),this.items.push(ue)}}dispose(){this.selectionCallback=void 0;for(const E of this.items)E.dispose();this.itemIndices.clear(),this.items.length=0,this.keyDownHandler&&(R.browserEvents.unbind(this.keyDownHandler),this.keyDownHandler=null),this.pointerMoveHandler&&(R.browserEvents.unbind(this.pointerMoveHandler),this.pointerMoveHandler=null),this.root.remove()}onKeyDown(E){if(!(!this.items.length||E.shiftKey||E.ctrlKey||E.metaKey||E.altKey)){switch(E.key){case"ArrowUp":this.moveFocus(-1*this.columns,!0);break;case"ArrowDown":this.moveFocus(this.columns,!0);break;case"ArrowLeft":this.moveFocus(-1*(this.rtl?-1:1),!0);break;case"ArrowRight":this.moveFocus(1*(this.rtl?-1:1),!0);break;case"PageUp":case"Home":this.moveFocus(0,!1);break;case"PageDown":case"End":this.moveFocus(this.items.length-1,!1);break;case"Enter":case"Space":return void E.stopPropagation();default:return}E.preventDefault(),E.stopPropagation()}}onPointerMove(E){if(!E.movementX&&!E.movementY||!(E.target instanceof Element))return;const T=E.target.closest(".blocklyFieldGridItem");if(!T)return;const A=T.id,F=this.itemIndices.get(A);F!==void 0&&this.moveFocus(F,!1)}setSelectedValue(E){for(const[T,A]of this.items.entries()){const F=A.getValue()===E;A.setSelected(F),F&&this.moveFocus(T,!1)}}moveFocus(E,T){let A=E;if(T){const U=this.getFocusedItem();if(!U)return;A+=this.indexOfItem(U)}const F=this.itemAtIndex(A);F&&(F.focus(),R.utils.aria.setState(this.root,R.utils.aria.State.ACTIVEDESCENDANT,F.getId()))}indexOfItem(E){var T;return(T=this.itemIndices.get(E.getId()))!==null&&T!==void 0?T:-1}itemAtIndex(E){return this.items[E]}getFocusedItem(){var E;const T=(E=this.root.querySelector(".blocklyFieldGridItem:focus"))!==null&&E!==void 0?E:this.root.querySelector(".blocklyFieldGridItem");if(!T||!T.id)return;const A=this.itemIndices.get(T.id);return A!==void 0?this.itemAtIndex(A):void 0}}class B extends R.FieldDropdown{constructor(E,T,A){super(E,T,A),this.columns=3,A!=null&&A.columns&&this.setColumns(parseInt(`${A.columns}`)),A&&A.primaryColour&&(this.primaryColour=A.primaryColour),A&&A.borderColour&&(this.borderColour=A.borderColour)}static fromJson(E){if(!E.options)throw new Error("options are required for the dropdown field. The options property must be assigned an array of [humanReadableValue, languageNeutralValue] tuples.");return new this(E.options,void 0,E)}setColumns(E){var T;!isNaN(E)&&E>=1&&(this.columns=E,R.DropDownDiv.getOwner()===this&&R.DropDownDiv.isVisible()&&((T=this.grid)===null||T===void 0||T.dispose(),this.showEditor_()))}showEditor_(E){var T;R.DropDownDiv.clearContent();const A=!!(!((T=this.getSourceBlock())===null||T===void 0)&&T.workspace.RTL);this.grid=new x(R.DropDownDiv.getContentDiv(),this.getOptions(!1),this.columns,A,Z=>{R.DropDownDiv.hideIfOwner(this),this.setValue(Z.getValue())}),R.DropDownDiv.getContentDiv().classList.add("blocklyFieldGridContainer");const F=this.getColours();F&&F.border&&R.DropDownDiv.setColour(F.primary,F.border),R.DropDownDiv.showPositionedByField(this,this.dropdownDispose_.bind(this));const U=this.getValue();U&&this.grid.setSelectedValue(U)}doValueUpdate_(E){var T;super.doValueUpdate_(E),(T=this.grid)===null||T===void 0||T.setSelectedValue(E)}getColours(){var E,T;if(this.primaryColour&&this.borderColour)return{primary:this.primaryColour,border:this.borderColour};const A=this.getSourceBlock();if(!(A instanceof R.BlockSvg))return;const F=A.isShadow()?A.getParent():A;return F?{primary:(E=this.primaryColour)!==null&&E!==void 0?E:F.getColour(),border:(T=this.borderColour)!==null&&T!==void 0?T:F.getColourTertiary()}:void 0}}return R.fieldRegistry.register("field_grid_dropdown",B),R.Css.register(`
   .blocklyFieldGridContainer {
     padding: 7px;
     overflow: auto;
   }
   
  .blocklyFieldGrid {
    display: grid;
    grid-gap: 7px;
    grid-template-columns: repeat(var(--grid-columns), min-content);
  }

 .blocklyFieldGrid .blocklyFieldGridItem {
   border: 1px solid rgba(1, 1, 1, 0.5);
   border-radius: 4px;
   color: white;
   min-width: auto;
   background: none;
   white-space: nowrap;
   cursor: pointer;
   padding: 6px 15px;
 }
 
 .blocklyFieldGrid .blocklyFieldGridRow {
   display: contents;
 }
 
 .blocklyFieldGrid .blocklyFieldGridItem.blocklyFieldGridItemSelected {
   background-color: rgba(1, 1, 1, 0.25);
 }

 .blocklyFieldGrid .blocklyFieldGridItem:focus {
   box-shadow: 0 0 0 4px hsla(0, 0%, 100%, .2);
   outline: none;
 }
 `),G})(),$.exports=P(I(370))},537:$=>{$.exports=le},557:$=>{$.exports=ne}},O={};function V($){var m=O[$];if(m!==void 0)return m.exports;var I=O[$]={exports:{}};return f[$].call(I.exports,I,I.exports,V),I.exports}V.d=($,m)=>{for(var I in m)V.o(m,I)&&!V.o($,I)&&Object.defineProperty($,I,{enumerable:!0,get:m[I]})},V.o=($,m)=>Object.prototype.hasOwnProperty.call($,m),V.r=$=>{typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty($,Symbol.toStringTag,{value:"Module"}),Object.defineProperty($,"__esModule",{value:!0})};var w={};return(()=>{V.r(w),V.d(w,{FieldColour:()=>k,colourBlend:()=>P,colourPicker:()=>$,colourRandom:()=>m,colourRgb:()=>I,installAllBlocks:()=>H,registerFieldColour:()=>R});var $={};V.r($),V.d($,{BLOCK_NAME:()=>T,blockDefinition:()=>J,installBlock:()=>Ne,toDart:()=>U,toJavascript:()=>F,toLua:()=>Z,toPhp:()=>_e,toPython:()=>ue});var m={};V.r(m),V.d(m,{BLOCK_NAME:()=>ee,blockDefinition:()=>Se,installBlock:()=>Ae,toDart:()=>de,toJavascript:()=>pe,toLua:()=>Te,toPhp:()=>Ie,toPython:()=>he});var I={};V.r(I),V.d(I,{BLOCK_NAME:()=>te,blockDefinition:()=>Ee,installBlock:()=>me,toDart:()=>fe,toJavascript:()=>ge,toLua:()=>Ce,toPhp:()=>Le,toPython:()=>Re});var P={};V.r(P),V.d(P,{BLOCK_NAME:()=>re,blockDefinition:()=>S,installBlock:()=>p,toDart:()=>ie,toJavascript:()=>ae,toLua:()=>i,toPhp:()=>u,toPython:()=>L});var C=V(370),Q=V(462);const W=["#ffffff","#cccccc","#c0c0c0","#999999","#666666","#333333","#000000","#ffcccc","#ff6666","#ff0000","#cc0000","#990000","#660000","#330000","#ffcc99","#ff9966","#ff9900","#ff6600","#cc6600","#993300","#663300","#ffff99","#ffff66","#ffcc66","#ffcc33","#cc9933","#996633","#663333","#ffffcc","#ffff33","#ffff00","#ffcc00","#999900","#666600","#333300","#99ff99","#66ff99","#33ff33","#33cc00","#009900","#006600","#003300","#99ffff","#33ffff","#66cccc","#00cccc","#339999","#336666","#003333","#ccffff","#66ffff","#33ccff","#3366ff","#3333ff","#000099","#000066","#ccccff","#9999ff","#6666cc","#6633ff","#6600cc","#333399","#330099","#ffccff","#ff99ff","#cc66cc","#cc33cc","#993399","#663366","#330033"];class k extends Q.FieldGridDropdown{constructor(d,N,h){var M,Y;super(G((M=h==null?void 0:h.colourOptions)!==null&&M!==void 0?M:W),N,Object.assign(Object.assign({},h),{columns:(Y=h==null?void 0:h.columns)!==null&&Y!==void 0?Y:7})),this.isDirty_=!1,d!==C.Field.SKIP_SETUP&&this.setValue(d)}trimOptions(d){return{options:d}}configure_(d){super.configure_(d),d.colourOptions&&this.setColours(d.colourOptions,d.colourTitles)}initView(){const d=this.getConstants();if(!d)throw Error("Constants not found");this.size_=new C.utils.Size(d.FIELD_COLOUR_DEFAULT_WIDTH,d.FIELD_COLOUR_DEFAULT_HEIGHT),this.createBorderRect_(),this.getBorderRect().style.fillOpacity="1",this.getBorderRect().setAttribute("stroke","#fff"),this.isFullBlockField()&&(this.clickTarget_=this.sourceBlock_.getSvgRoot())}showEditor_(d){super.showEditor_(d),C.DropDownDiv.getContentDiv().classList.add("blocklyFieldColour"),C.DropDownDiv.repositionForWindowResize()}isFullBlockField(){if(!this.getSourceBlock())throw new C.UnattachedFieldError;const d=this.getConstants();return this.blockIsSimpleReporter()&&!!(d!=null&&d.FIELD_COLOUR_FULL_BLOCK)}blockIsSimpleReporter(){const d=this.getSourceBlock();if(!d)throw new C.UnattachedFieldError;if(!d.outputConnection)return!1;for(const N of d.inputList)if(N.connection||N.fieldRow.length>1)return!1;return!0}applyColour(){const d=this.getSourceBlock();if(!d)throw new C.UnattachedFieldError;if(!this.fieldGroup_)return;const N=this.borderRect_;if(!N)throw new Error("The border rect has not been initialized");this.isFullBlockField()?(N.style.display="none",d.pathObject.svgPath.setAttribute("fill",this.getValue()),d.pathObject.svgPath.setAttribute("stroke","#fff")):(N.style.display="block",N.style.fill=this.getValue())}getSize(){var d;return!((d=this.getConstants())===null||d===void 0)&&d.FIELD_COLOUR_FULL_BLOCK&&(this.render_(),this.isDirty_=!1),super.getSize()}render_(){this.updateSize_();const d=this.getSourceBlock();if(!d)throw new C.UnattachedFieldError;d.applyColour()}updateSize_(d){const N=this.getConstants();if(!N)return;let h,M;this.isFullBlockField()?(h=2*(d??0),M=N.FIELD_TEXT_HEIGHT):(h=N.FIELD_COLOUR_DEFAULT_WIDTH,M=N.FIELD_COLOUR_DEFAULT_HEIGHT),this.size_.height=M,this.size_.width=h,this.positionBorderRect_()}doClassValidation_(d){return typeof d!="string"?null:C.utils.colour.parse(d)}getText(){let d=this.value_;return/^#(.)\1(.)\2(.)\3$/.test(d)&&(d="#"+d[1]+d[3]+d[5]),d}setColours(d,N){const h=G(d,N);return this.setOptions(h),this}static fromJson(d){return new this(d.colour,void 0,d)}}function G(c,d){return c.map((N,h)=>{const M=document.createElement("div");return M.className="blocklyColourSwatch",M.style.backgroundColor=N,d&&h<d.length&&(M.title=d[h]),[M,N]})}function R(){C.fieldRegistry.register("field_colour",k)}k.prototype.DEFAULT_VALUE="#ffffff",C.Css.register(`
.blocklyFieldColour .blocklyFieldGridItemSelected,
.blocklyFieldGridItemSelected:hover {
  border-color: #eee !important;
  outline: 1px solid #333;
  position: relative;
}

.blocklyColourSwatch {
  width: 20px;
  height: 20px;
}

.blocklyGridContainer {
  padding: 0px;
}

.blocklyFieldColour .blocklyFieldGrid {
  grid-gap: 0px;
  row-gap: 4px;
}

.blocklyFieldColour .blocklyFieldGrid .blocklyGridItem {
  border-radius: 0;
  padding: 0;
  border: 0.5px solid #888;
  cursor: pointer;
}

.blocklyFieldColour .blocklyFieldGrid .blocklyFieldGridItem {
  border: 0.5px solid #888;
  padding: 0;
  margin: 0;
  border-radius: 0;
}

.blocklyFieldColour .blocklyFieldGrid .blocklyFieldGridItem:focus {
  border-color: #eee;
  box-shadow: 2px 2px 7px 2px rgba(0, 0, 0, 0.3);
  position: relative;
  border-radius: 0;
  outline: none;
}
`);var b=V(127),x=V(379),B=V(157),y=V(537),E=V(557);const T="colour_picker",A={type:T,message0:"%1",args0:[{type:"field_colour",name:"COLOUR",colour:"#ff0000"}],output:"Colour",helpUrl:"%{BKY_COLOUR_PICKER_HELPURL}",style:"colour_blocks",tooltip:"%{BKY_COLOUR_PICKER_TOOLTIP}",extensions:["parent_tooltip_when_inline"]};function F(c,d){return[d.quote_(c.getFieldValue("COLOUR")),b.Order.ATOMIC]}function U(c,d){return[d.quote_(c.getFieldValue("COLOUR")),x.Order.ATOMIC]}function Z(c,d){return[d.quote_(c.getFieldValue("COLOUR")),B.Order.ATOMIC]}function _e(c,d){return[d.quote_(c.getFieldValue("COLOUR")),y.Order.ATOMIC]}function ue(c,d){return[d.quote_(c.getFieldValue("COLOUR")),E.Order.ATOMIC]}const X=C.common.createBlockDefinitionsFromJsonArray([A]),J=X[T];function Ne(c={}){R(),C.common.defineBlocks(X),c.javascript&&(c.javascript.forBlock[T]=F),c.dart&&(c.dart.forBlock[T]=U),c.lua&&(c.lua.forBlock[T]=Z),c.php&&(c.php.forBlock[T]=_e),c.python&&(c.python.forBlock[T]=ue)}const ee="colour_random",ve={type:ee,message0:"%{BKY_COLOUR_RANDOM_TITLE}",output:"Colour",helpUrl:"%{BKY_COLOUR_RANDOM_HELPURL}",style:"colour_blocks",tooltip:"%{BKY_COLOUR_RANDOM_TOOLTIP}"};function pe(c,d){return[d.provideFunction_("colourRandom",`
function ${d.FUNCTION_NAME_PLACEHOLDER_}() {
  var num = Math.floor(Math.random() * 0x1000000);
  return '#' + ('00000' + num.toString(16)).substr(-6);
}
`)+"()",b.Order.FUNCTION_CALL]}function de(c,d){return d.definitions_.import_dart_math="import 'dart:math' as Math;",[d.provideFunction_("colour_random",`
String ${d.FUNCTION_NAME_PLACEHOLDER_}() {
  String hex = '0123456789abcdef';
  var rnd = new Math.Random();
  return '#\${hex[rnd.nextInt(16)]}\${hex[rnd.nextInt(16)]}'
      '\${hex[rnd.nextInt(16)]}\${hex[rnd.nextInt(16)]}'
      '\${hex[rnd.nextInt(16)]}\${hex[rnd.nextInt(16)]}';
}
`)+"()",x.Order.UNARY_POSTFIX]}function Te(c,d){return['string.format("#%06x", math.random(0, 2^24 - 1))',B.Order.HIGH]}function Ie(c,d){return[d.provideFunction_("colour_random",`
function ${d.FUNCTION_NAME_PLACEHOLDER_}() {
  return '#' . str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT);
}
`)+"()",y.Order.FUNCTION_CALL]}function he(c,d){return d.definitions_.import_random="import random",["'#%06x' % random.randint(0, 2**24 - 1)",E.Order.FUNCTION_CALL]}const Oe=C.common.createBlockDefinitionsFromJsonArray([ve]),Se=Oe[ee];function Ae(c={}){R(),C.common.defineBlocks(Oe),c.javascript&&(c.javascript.forBlock[ee]=pe),c.dart&&(c.dart.forBlock[ee]=de),c.lua&&(c.lua.forBlock[ee]=Te),c.php&&(c.php.forBlock[ee]=Ie),c.python&&(c.python.forBlock[ee]=he)}const te="colour_rgb",Me={type:te,message0:"%{BKY_COLOUR_RGB_TITLE} %{BKY_COLOUR_RGB_RED} %1 %{BKY_COLOUR_RGB_GREEN} %2 %{BKY_COLOUR_RGB_BLUE} %3",args0:[{type:"input_value",name:"RED",check:"Number",align:"RIGHT"},{type:"input_value",name:"GREEN",check:"Number",align:"RIGHT"},{type:"input_value",name:"BLUE",check:"Number",align:"RIGHT"}],output:"Colour",helpUrl:"%{BKY_COLOUR_RGB_HELPURL}",style:"colour_blocks",tooltip:"%{BKY_COLOUR_RGB_TOOLTIP}"};function ge(c,d){const N=d.valueToCode(c,"RED",b.Order.NONE)||0,h=d.valueToCode(c,"GREEN",b.Order.NONE)||0,M=d.valueToCode(c,"BLUE",b.Order.NONE)||0;return[`${d.provideFunction_("colourRgb",`
function ${d.FUNCTION_NAME_PLACEHOLDER_}(r, g, b) {
  r = Math.max(Math.min(Number(r), 100), 0) * 2.55;
  g = Math.max(Math.min(Number(g), 100), 0) * 2.55;
  b = Math.max(Math.min(Number(b), 100), 0) * 2.55;
  r = ('0' + (Math.round(r) || 0).toString(16)).slice(-2);
  g = ('0' + (Math.round(g) || 0).toString(16)).slice(-2);
  b = ('0' + (Math.round(b) || 0).toString(16)).slice(-2);
  return '#' + r + g + b;
}
`)}(${N}, ${h}, ${M})`,b.Order.FUNCTION_CALL]}function fe(c,d){const N=d.valueToCode(c,"RED",x.Order.NONE)||0,h=d.valueToCode(c,"GREEN",x.Order.NONE)||0,M=d.valueToCode(c,"BLUE",x.Order.NONE)||0;return d.definitions_.import_dart_math="import 'dart:math' as Math;",[`${d.provideFunction_("colour_rgb",`
String ${d.FUNCTION_NAME_PLACEHOLDER_}(num r, num g, num b) {
  num rn = (Math.max(Math.min(r, 100), 0) * 2.55).round();
  String rs = rn.toInt().toRadixString(16);
  rs = '0$rs';
  rs = rs.substring(rs.length - 2);
  num gn = (Math.max(Math.min(g, 100), 0) * 2.55).round();
  String gs = gn.toInt().toRadixString(16);
  gs = '0$gs';
  gs = gs.substring(gs.length - 2);
  num bn = (Math.max(Math.min(b, 100), 0) * 2.55).round();
  String bs = bn.toInt().toRadixString(16);
  bs = '0$bs';
  bs = bs.substring(bs.length - 2);
  return '#$rs$gs$bs';
}
`)}(${N}, ${h}, ${M})`,x.Order.UNARY_POSTFIX]}function Ce(c,d){return[`${d.provideFunction_("colour_rgb",`
function ${d.FUNCTION_NAME_PLACEHOLDER_}(r, g, b)
  r = math.floor(math.min(100, math.max(0, r)) * 2.55 + .5)
  g = math.floor(math.min(100, math.max(0, g)) * 2.55 + .5)
  b = math.floor(math.min(100, math.max(0, b)) * 2.55 + .5)
  return string.format("#%02x%02x%02x", r, g, b)
end
`)}(${d.valueToCode(c,"RED",B.Order.NONE)||0}, ${d.valueToCode(c,"GREEN",B.Order.NONE)||0}, ${d.valueToCode(c,"BLUE",B.Order.NONE)||0})`,B.Order.HIGH]}function Le(c,d){const N=d.valueToCode(c,"RED",y.Order.NONE)||0,h=d.valueToCode(c,"GREEN",y.Order.NONE)||0,M=d.valueToCode(c,"BLUE",y.Order.NONE)||0;return[`${d.provideFunction_("colour_rgb",`
function ${d.FUNCTION_NAME_PLACEHOLDER_}($r, $g, $b) {
  $r = round(max(min($r, 100), 0) * 2.55);
  $g = round(max(min($g, 100), 0) * 2.55);
  $b = round(max(min($b, 100), 0) * 2.55);
  $hex = '#';
  $hex .= str_pad(dechex($r), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($g), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
  return $hex;
}
`)}(${N}, ${h}, ${M})`,y.Order.FUNCTION_CALL]}function Re(c,d){return[d.provideFunction_("colour_rgb",`
def ${d.FUNCTION_NAME_PLACEHOLDER_}(r, g, b):
  r = round(min(100, max(0, r)) * 2.55)
  g = round(min(100, max(0, g)) * 2.55)
  b = round(min(100, max(0, b)) * 2.55)
  return '#%02x%02x%02x' % (r, g, b)
`)+"("+(d.valueToCode(c,"RED",E.Order.NONE)||0)+", "+(d.valueToCode(c,"GREEN",E.Order.NONE)||0)+", "+(d.valueToCode(c,"BLUE",E.Order.NONE)||0)+")",E.Order.FUNCTION_CALL]}const Fe=C.common.createBlockDefinitionsFromJsonArray([Me]),Ee=Fe[te];function me(c={}){R(),C.common.defineBlocks(Fe),c.javascript&&(c.javascript.forBlock[te]=ge),c.dart&&(c.dart.forBlock[te]=fe,c.dart.addReservedWords("Math")),c.lua&&(c.lua.forBlock[te]=Ce),c.php&&(c.php.forBlock[te]=Le),c.python&&(c.python.forBlock[te]=Re)}const re="colour_blend",De={type:re,message0:"%{BKY_COLOUR_BLEND_TITLE} %{BKY_COLOUR_BLEND_COLOUR1} %1 %{BKY_COLOUR_BLEND_COLOUR2} %2 %{BKY_COLOUR_BLEND_RATIO} %3",args0:[{type:"input_value",name:"COLOUR1",check:"Colour",align:"RIGHT"},{type:"input_value",name:"COLOUR2",check:"Colour",align:"RIGHT"},{type:"input_value",name:"RATIO",check:"Number",align:"RIGHT"}],output:"Colour",helpUrl:"%{BKY_COLOUR_BLEND_HELPURL}",style:"colour_blocks",tooltip:"%{BKY_COLOUR_BLEND_TOOLTIP}"};function ae(c,d){const N=d.valueToCode(c,"COLOUR1",b.Order.NONE)||"'#000000'",h=d.valueToCode(c,"COLOUR2",b.Order.NONE)||"'#000000'",M=d.valueToCode(c,"RATIO",b.Order.NONE)||.5;return[`${d.provideFunction_("colourBlend",`
function ${d.FUNCTION_NAME_PLACEHOLDER_}(c1, c2, ratio) {
  ratio = Math.max(Math.min(Number(ratio), 1), 0);
  var r1 = parseInt(c1.substring(1, 3), 16);
  var g1 = parseInt(c1.substring(3, 5), 16);
  var b1 = parseInt(c1.substring(5, 7), 16);
  var r2 = parseInt(c2.substring(1, 3), 16);
  var g2 = parseInt(c2.substring(3, 5), 16);
  var b2 = parseInt(c2.substring(5, 7), 16);
  var r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  var g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  var b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  r = ('0' + (r || 0).toString(16)).slice(-2);
  g = ('0' + (g || 0).toString(16)).slice(-2);
  b = ('0' + (b || 0).toString(16)).slice(-2);
  return '#' + r + g + b;
}
`)}(${N}, ${h}, ${M})`,b.Order.FUNCTION_CALL]}function ie(c,d){const N=d.valueToCode(c,"COLOUR1",x.Order.NONE)||"'#000000'",h=d.valueToCode(c,"COLOUR2",x.Order.NONE)||"'#000000'",M=d.valueToCode(c,"RATIO",x.Order.NONE)||.5;return d.definitions_.import_dart_math="import 'dart:math' as Math;",[`${d.provideFunction_("colour_blend",`
String ${d.FUNCTION_NAME_PLACEHOLDER_}(String c1, String c2, num ratio) {
  ratio = Math.max(Math.min(ratio, 1), 0);
  int r1 = int.parse('0x\${c1.substring(1, 3)}');
  int g1 = int.parse('0x\${c1.substring(3, 5)}');
  int b1 = int.parse('0x\${c1.substring(5, 7)}');
  int r2 = int.parse('0x\${c2.substring(1, 3)}');
  int g2 = int.parse('0x\${c2.substring(3, 5)}');
  int b2 = int.parse('0x\${c2.substring(5, 7)}');
  num rn = (r1 * (1 - ratio) + r2 * ratio).round();
  String rs = rn.toInt().toRadixString(16);
  num gn = (g1 * (1 - ratio) + g2 * ratio).round();
  String gs = gn.toInt().toRadixString(16);
  num bn = (b1 * (1 - ratio) + b2 * ratio).round();
  String bs = bn.toInt().toRadixString(16);
  rs = '0$rs';
  rs = rs.substring(rs.length - 2);
  gs = '0$gs';
  gs = gs.substring(gs.length - 2);
  bs = '0$bs';
  bs = bs.substring(bs.length - 2);
  return '#$rs$gs$bs';
}
`)}(${N}, ${h}, ${M})`,x.Order.UNARY_POSTFIX]}function i(c,d){return[`${d.provideFunction_("colour_blend",`
function ${d.FUNCTION_NAME_PLACEHOLDER_}(colour1, colour2, ratio)
  local r1 = tonumber(string.sub(colour1, 2, 3), 16)
  local r2 = tonumber(string.sub(colour2, 2, 3), 16)
  local g1 = tonumber(string.sub(colour1, 4, 5), 16)
  local g2 = tonumber(string.sub(colour2, 4, 5), 16)
  local b1 = tonumber(string.sub(colour1, 6, 7), 16)
  local b2 = tonumber(string.sub(colour2, 6, 7), 16)
  local ratio = math.min(1, math.max(0, ratio))
  local r = math.floor(r1 * (1 - ratio) + r2 * ratio + .5)
  local g = math.floor(g1 * (1 - ratio) + g2 * ratio + .5)
  local b = math.floor(b1 * (1 - ratio) + b2 * ratio + .5)
  return string.format("#%02x%02x%02x", r, g, b)
end
`)}(${d.valueToCode(c,"COLOUR1",B.Order.NONE)||"'#000000'"}, ${d.valueToCode(c,"COLOUR2",B.Order.NONE)||"'#000000'"}, ${d.valueToCode(c,"RATIO",B.Order.NONE)||0})`,B.Order.HIGH]}function u(c,d){const N=d.valueToCode(c,"COLOUR1",y.Order.NONE)||"'#000000'",h=d.valueToCode(c,"COLOUR2",y.Order.NONE)||"'#000000'",M=d.valueToCode(c,"RATIO",y.Order.NONE)||.5;return[`${d.provideFunction_("colour_blend",`
function ${d.FUNCTION_NAME_PLACEHOLDER_}($c1, $c2, $ratio) {
  $ratio = max(min($ratio, 1), 0);
  $r1 = hexdec(substr($c1, 1, 2));
  $g1 = hexdec(substr($c1, 3, 2));
  $b1 = hexdec(substr($c1, 5, 2));
  $r2 = hexdec(substr($c2, 1, 2));
  $g2 = hexdec(substr($c2, 3, 2));
  $b2 = hexdec(substr($c2, 5, 2));
  $r = round($r1 * (1 - $ratio) + $r2 * $ratio);
  $g = round($g1 * (1 - $ratio) + $g2 * $ratio);
  $b = round($b1 * (1 - $ratio) + $b2 * $ratio);
  $hex = '#';
  $hex .= str_pad(dechex($r), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($g), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
  return $hex;
}
`)}(${N}, ${h}, ${M})`,y.Order.FUNCTION_CALL]}function L(c,d){return[`${d.provideFunction_("colour_blend",`
def ${d.FUNCTION_NAME_PLACEHOLDER_}(colour1, colour2, ratio):
  r1, r2 = int(colour1[1:3], 16), int(colour2[1:3], 16)
  g1, g2 = int(colour1[3:5], 16), int(colour2[3:5], 16)
  b1, b2 = int(colour1[5:7], 16), int(colour2[5:7], 16)
  ratio = min(1, max(0, ratio))
  r = round(r1 * (1 - ratio) + r2 * ratio)
  g = round(g1 * (1 - ratio) + g2 * ratio)
  b = round(b1 * (1 - ratio) + b2 * ratio)
  return '#%02x%02x%02x' % (r, g, b)
`)}(${d.valueToCode(c,"COLOUR1",E.Order.NONE)||"'#000000'"}, ${d.valueToCode(c,"COLOUR2",E.Order.NONE)||"'#000000'"}, ${d.valueToCode(c,"RATIO",E.Order.NONE)||0})`,E.Order.FUNCTION_CALL]}const v=C.common.createBlockDefinitionsFromJsonArray([De]),S=v[re];function p(c={}){R(),C.common.defineBlocks(v),c.javascript&&(c.javascript.forBlock[re]=ae),c.dart&&(c.dart.forBlock[re]=ie,c.dart.addReservedWords("Math")),c.lua&&(c.lua.forBlock[re]=i),c.php&&(c.php.forBlock[re]=u),c.python&&(c.python.forBlock[re]=L)}function H(c={}){Ne(c),me(c),Ae(c),p(c)}})(),w})())})(Pe)),Pe.exports}var ut=lt();function dt(){const oe=window;oe.__leapblocksBlocklyFieldsRegistered||(xe.registry.hasItem(xe.registry.Type.FIELD,"field_angle")||xe.fieldRegistry.register("field_angle",ze.FieldAngle),xe.registry.hasItem(xe.registry.Type.FIELD,"field_colour")||xe.fieldRegistry.register("field_colour",ut.FieldColour),oe.__leapblocksBlocklyFieldsRegistered=!0)}dt();export{dt as registerCustomFields};
//# sourceMappingURL=registerCustomFields-DfA-4ZdP.js.map


var http=require('http'),crypto=require('crypto'),_und=require('underscore'),noop=require("./noop"),mp=require("./multipart");winston=require('winston');var EventEmitter=require('events').EventEmitter;var DigestWrapper=function(){this.configure();};DigestWrapper.prototype.configure=function(username,password,logger){this.logger=logger;this.nc=1;this.username=username;this.password=password;this.cnonce="0a4f113b";this.nonce=undefined;this.opaque=undefined;this.realm=undefined;this.qop=undefined;this.ended=false;};DigestWrapper.prototype.request=function(options,content,callback_opt){this.logger.debug("DigestWrapper.request()");var digestWrapper=this;var reqWrapper=new RequestWrapper(this.logger);var doRequest=function(){digestWrapper.logger.debug("in doRequest()");var ncUse=padNC(digestWrapper.nc);digestWrapper.nc++;var realPath=options.path;if(undefined!=options.contentType){options.headers["Content-type"]=options.contentType;}
if(content instanceof mp){digestWrapper.logger.debug("in doRequest(): Got formdata");options.headers=content.getHeaders();}
digestWrapper.logger.debug("in doRequest(): Content type header now: "+options.headers["Content-type"]);var md5ha1=crypto.createHash('md5');var ha1raw=digestWrapper.username+":"+digestWrapper.realm+":"+digestWrapper.password;md5ha1.update(ha1raw);var ha1=md5ha1.digest('hex');var md5ha2=crypto.createHash('md5');var ha2raw=options.method+":"+realPath;md5ha2.update(ha2raw);var ha2=md5ha2.digest('hex');var md5r=crypto.createHash('md5');var md5rraw=ha1+":"+digestWrapper.nonce+":"+ncUse+":"+digestWrapper.cnonce+":"+digestWrapper.qop+":"+ha2;md5r.update(md5rraw);var response=md5r.digest('hex');options.headers['Authorization']='Digest username="'+digestWrapper.username+'", realm="'+digestWrapper.realm+'", nonce="'+digestWrapper.nonce+'", uri="'+options.path+'",'+' cnonce="'+digestWrapper.cnonce+'", nc='+ncUse+', qop="'+digestWrapper.qop+'", response="'+response+'", opaque="'+digestWrapper.opaque+'"';var finalReq=http.request(options,(callback_opt||noop));finalReq.on("end",function(res){reqWrapper.doEnd(res);});finalReq.on('error',function(e){reqWrapper.error(e);});digestWrapper.logger.debug("in doRequest(): setting finalReq on wrapper");reqWrapper.finalReq=finalReq;digestWrapper.logger.debug("in doRequest(): calling finaliseRequest on wrapper");reqWrapper.finaliseRequest();digestWrapper.logger.debug("in doRequest(): finaliseRequest complete");};if(undefined!=this.realm){this.logger.debug("DigestWrapper: Got a Realm");doRequest();}else{this.logger.debug("DigestWrapper: Not got a Realm, wrapping request");var myopts={host:options.host,port:options.port}
var self=this;this.logger.debug("DigestWrapper: calling http.get for auth");var get=http.get(myopts,function(res){self.logger.debug("DigestWrapper: http.get has completed in order to carry out authentication");res.on('end',function(){self.logger.debug("DigestWrapper: auth http.get response end event raised");digestWrapper.nc=1;if(403==res.statusCode){self.logger.debug("DigestWrapper: 403 response");var response=new ErrorResponse({statusCode:403});reqWrapper.__response=response;reqWrapper.__callback=callback_opt;reqWrapper.doEnd(response);reqWrapper.finaliseRequest();}else{self.logger.debug("DigestWrapper: other response: "+res.statusCode);var auth=res.headers["www-authenticate"];self.logger.debug("HEADERS: "+JSON.stringify(res.headers));if(undefined!=auth){var params=parseDigest(auth);digestWrapper.nonce=params.nonce;digestWrapper.realm=params.realm;digestWrapper.qop=params.qop;digestWrapper.opaque=params.opaque;}
self.logger.debug("DigestWrapper: calling doRequest()");doRequest();}
self.logger.debug("DigestWrapper: After response handling code");});self.logger.debug("DigestWrapper: Got response for auth request");res.on('readable',function(){res.read();});});get.on("error",function(e){self.logger.debug("DigestWrapper: Auth request in error: "+e);reqWrapper.error(e);});}
return reqWrapper;};module.exports=function(){return new DigestWrapper();};var RequestWrapper=function(logger){this.logger=logger;this.writeData="";this.emitter=new EventEmitter();this.ended=false;this.finalReq=undefined;this.__response=undefined;this.__callback=undefined;};RequestWrapper.prototype.write=function(data,encoding){this.writeData=data;};RequestWrapper.prototype.on=function(evt,func){this.emitter.on(evt,func);};RequestWrapper.prototype.end=function(){this.logger.debug("DigestWrapper.end called");this.ended=true;this.finaliseRequest();};RequestWrapper.prototype.error=function(e){this.logger.debug("DigestWrapper.error called: "+e);this.ended=true;this.emitter.emit("error",e);};RequestWrapper.prototype.finaliseRequest=function(){this.logger.debug("DigestWrapper.RequestWrapper.finaliseRequest called");var self=this;if(this.ended&&this.finalReq!=undefined){this.logger.debug("DigestWrapper.RequestWrapper.finaliseRequest: Finalising request");if(this.writeData!=undefined){this.logger.debug("DigestWrapper.RequestWrapper.finaliseRequest: we have data - sending it now");var data=this.writeData;this.writeData=undefined;if(data instanceof mp){self.logger.debug("DigestWrapper.RequestWrapper.finaliseRequest: Got a FormData instance");self.logger.debug("DigestWrapper.RequestWrapper.finaliseRequest: Content header sent was: "+self.finalReq.getHeader("Content-type"));data.pipe(self.finalReq);self.logger.debug("DigestWrapper.RequestWrapper.finaliseRequest: Finished processing form data");}else{this.logger.debug("DigestWrapper.RequestWrapper.finaliseRequest: Writing non-form-data");this.finalReq.write(data);}}
this.finalReq.end();}else{this.logger.debug("DigestWrapper.RequestWrapper.finaliseRequest: Not ended yet. Skipping for now.");}
if(this.ended&&this.__response!=undefined){var response=this.__response;var cb=this.__callback;this.__response=undefined;this.__callback=undefined;(cb||noop)(response);}};RequestWrapper.prototype.doEnd=function(res){this.logger.debug("DigestWrapper.doEnd: end Called.");this.emitter.emit("end",res);};var ErrorResponse=function(response){this.response=response;this.statusCode=response.statusCode;this.emitter=new EventEmitter();};ErrorResponse.prototype.on=function(evt,callback){this.emitter.on(evt,callback);if(evt=="error"){this.emitter.emit(evt,this.response);}};function parseDigest(header){console.log("HEADER: "+header);return _und(header.substring(7).split(/,\s+/)).reduce(function(obj,s){var parts=s.split('=')
obj[parts[0]]=parts[1].replace(/"/g,'')
return obj},{})};function padNC(num){var pad="";for(var i=0;i<(8-(""+num).length);i++){pad+="0";}
var ret=pad+num;return ret;};
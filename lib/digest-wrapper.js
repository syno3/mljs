var http = require('http'),
    crypto = require('crypto'),
    _und = require('underscore'),
    noop = require("./noop"),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
         new winston.transports.Console()
       ],
       exceptionHandlers: [
         new winston.transports.Console()
       ]
     });

var EventEmitter = require('events').EventEmitter;

/**
* Wraps a HTTP request to the ML server for a particular user
* - Unknown bug that causes auth to fail. Using BasicWrapper instead
*/
var DigestWrapper = function(){
  this.emitter = new EventEmitter();
  this.configure();
};

DigestWrapper.prototype.configure = function(username,password) {
  this.nc = 1;
  this.username = username;
  this.password = password;
  this.cnonce = "0a4f113b";
  this.nonce = undefined;
  this.opaque = undefined;
  this.realm = undefined;
  this.qop = undefined;
  this.writeData = "";
  this.ended = false;
};

DigestWrapper.prototype.request = function(options, callback_opt) {
  //var cnonce = Math.floor(Math.random()*100000000);
  
  this.writeData = "";
  this.ended = false;
  this.finalReq = undefined;
  
  var digestWrapper = this;

  var doRequest = function() {
    var ncUse = padNC(digestWrapper.nc);
    digestWrapper.nc++;
    var realPath = options.path;
    logger.debug("----------------------------------------");
    logger.debug("options.method: '" + options.method + "'");
    logger.debug("options.hostname: '" + options.hostname + "'");
    logger.debug("options.port: '" + options.port + "'");
    logger.debug("options.path: '" + options.path + "'");
    logger.debug("path: '" + realPath + "'");
    logger.debug("cnonce: '" + digestWrapper.cnonce + "'");
    logger.debug("nonce: '" + digestWrapper.nonce + "'");
    logger.debug("nc: '" + ncUse + "'");
    logger.debug("realm: '" + digestWrapper.realm + "'");
    logger.debug("qop: '" + digestWrapper.qop + "'");
    logger.debug("opaque: '" + digestWrapper.opaque + "'");

    // See Client Request at http://en.wikipedia.org/wiki/Digest_access_authentication
    var md5ha1 = crypto.createHash('md5');
    var ha1raw = digestWrapper.username + ":" + digestWrapper.realm + ":" + digestWrapper.password;
    logger.debug("ha1raw: " + ha1raw);
    md5ha1.update(ha1raw);
    var ha1 = md5ha1.digest('hex');

    var md5ha2 = crypto.createHash('md5');
    var ha2raw = options.method + ":" + realPath;
    logger.debug("ha2raw: " + ha2raw);
    md5ha2.update(ha2raw);

    var ha2 = md5ha2.digest('hex'); // TODO check ? params are ok for the uri

    var md5r = crypto.createHash('md5');
    var md5rraw = ha1 + ":" + digestWrapper.nonce + ":" + ncUse + ":" + digestWrapper.cnonce + ":" + digestWrapper.qop + ":" + ha2;
    logger.debug("md5rraw: " + md5rraw);
    md5r.update(md5rraw);

    var response = md5r.digest('hex');
    options.headers = { 'Authorization' : 'Digest username="' + digestWrapper.username + '", realm="' + digestWrapper.realm + '", nonce="' + digestWrapper.nonce + '", uri="' + options.path + '",' + // TODO check if we remove query ? params from uri
      ' cnonce="' + digestWrapper.cnonce + '", nc=' + ncUse + ', qop="' + digestWrapper.qop + '", response="' + response + '", opaque="' + digestWrapper.opaque + '"'};
    logger.debug("DigestWrapper: Auth header: " + options.headers["Authorization"]);
    
    var finalReq = http.request(options,(callback_opt || noop));
    
    finalReq.on("end", function(res) {
      digestWrapper.doEnd(res);
    });
    
    digestWrapper.finalReq = finalReq;
    digestWrapper.finaliseRequest();
/*
    if ('GET' == options.method) {
      
    } else if ('POST' == options.method) {
      //http.post(options,func);
      // TODO
    } else {
      logger.debug("DigestWrapper: HTTP METHOD UNSUPPORTED");
    }*/
  };

  // see if we have a realm and nonce
  if (undefined != this.realm) {
    logger.debug("DigestWrapper: Got a Realm");
    doRequest();
  } else {
    logger.debug("DigestWrapper: Not got a Realm, wrapping request");

    // do authorization request then call doRequest
    var myopts = {
      host: options.host,
      port: options.port
    }

    http.get(myopts,function(res) {
      logger.debug("Check: " + res.statusCode);
      res.on('end', function() {
        // check if http 401
        logger.debug("DigestWrapper: Got HTTP response: " + res.statusCode);
        // if so, extract WWW-Authenticate header information for later requests
        logger.debug("DigestWrapper: Header: www-authenticate: " + res.headers["www-authenticate"]); 
        // E.g. from ML REST API:  Digest realm="public", qop="auth", nonce="5ffb75b7b92c8d30fe2bfce28f024a0f", opaque="b847f531f584350a"

        digestWrapper.nc = 1;

        var auth = res.headers["www-authenticate"];
        var params = parseDigest(auth);
        digestWrapper.nonce = params.nonce;
        digestWrapper.realm = params.realm;
        digestWrapper.qop = params.qop;
        digestWrapper.opaque = params.opaque;

        doRequest();
      }); 
      //res.on('close', function() { logger.debug("DigestWrapper: CLOSE");});
      //res.on('data',  function() { logger.debug("DigestWrapper: DATA");});
    });
  }
  return digestWrapper;
};

DigestWrapper.prototype.write = function(data,encoding) {
  this.writeData += data;
};

DigestWrapper.prototype.on = function(evt,func) {
  this.emitter.on(evt,func);
};

DigestWrapper.prototype.end = function() {
  this.ended = true;
  this.finaliseRequest();
};

// INTERNAL METHODS

DigestWrapper.prototype.finaliseRequest = function() {
  if (this.ended && this.finalReq != undefined){ 
    if (this.writeData != undefined && this.writeData.length > 0) {
      this.finalReq.write(this.writeData);
    }
    this.finalReq.end();
  }
};

DigestWrapper.prototype.doEnd = function(res) {
  this.emitter.emit("end",res);
};

module.exports = function() {
  return new DigestWrapper();
};

function parseDigest(header) {  
  return _und(header.substring(7).split(/,\s+/)).reduce(function(obj, s) {
    var parts = s.split('=')
    obj[parts[0]] = parts[1].replace(/"/g, '')
    return obj
    }, {})  
  }

  function padNC(num) {
    var pad = "";
    for (var i = 0;i < (8 - ("" + num).length);i++) {
      pad += "0";
    }
    var ret = pad + num;
    //logger.debug("pad: " + ret);
    return ret;
  }
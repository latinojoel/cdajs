/*
 * Copyright 2013 Joel latino
 * Contact: jlatino@sapo.pt ~ http://about.me/latinojoel/ ~ http://latinojoel.github.io/cdajs ~ http://joel-latino.blogspot.com
 * Twitter: @latinojoel
 *
 * Include this in your web-pages for debug and development purposes only. For production purposes,
 * consider using the minified/obfuscated versions in the /min directory.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Lesser General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version. This
 * program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
 * Public License for more details. You should have received a copy of the GNU General Public
 * License along with this program.
 * If not, see <http://www.gnu.org/licenses/>.
 */

"use strict"; // js-hint is fuck'd up ^^

/**
 * This is <b>CDAjs</b> - a stand-alone javascript library for working with Pentaho plugin
 * "Community Data Access" CDA (<i>Community Data Access</i>) is a open source plugin for
 * <b>Pentaho Business Analysis</b> suite, designed to allow greater flexibility for data sources.
 * Powered by <a href="http://www.webdetails.pt/ctools/cda.html" target="_blank">WebDetails</a>.
 * <br/><br/> <b>CDAjs</b> is cross-browser and <a href="http://nodejs.org"target="_blank">Node.js</a>
 * compatible and enables web-browser-based analytical Pentaho Business Intelligence applications.
 *
 * @module CDAjs
 * @title CDAjs
 */
 (function (window) {


  /**
   * Get's a XML Http Request
   *
   * @return {Object} a XML Http Request object.
   */

   function _Xhr() {
    if (window.XMLHttpRequest) {
      return new window.XMLHttpRequest();
    } else if (window.ActiveXObject) {
      return new window.ActiveXObject("MSXML2.XMLHTTP.3.0");
    } else if (typeof (require) === "function") {
      var xhr;
      (xhr = function () {
        this.readyState = 0;
        this.status = -1;
        this.statusText = "Not sent";
        this.responseText = null;
      }).prototype = {
        changeStatus: function (statusCode, readyState) {
          this.status = statusCode;
          this.statusText = statusCode;
          this.readyState = readyState;
          if (_isFun(this.onreadystatechange)) {
            this.onreadystatechange.call(this, this);
          }
        },
        open: function (method, url, async, username, password) {
          if (async !== true) {
            throw "Synchronous mode not supported in this environment.";
          }
          var options = require("url").parse(url);
          if (options.host.length > options.hostname.length) {
            // for some reason, host includes the port, this confuses http.request
            // so, overwrite host with hostname (which does not include the port)
            // and kill hostname so that we end up with only host.
            options.host = options.hostname;
            delete options.hostname;
          }
          if (!options.path && options.pathname) {
            // old versions of node may not give the path, so we need to create it ourselves.
            options.path = options.pathname + (options.search || "");
          }
          options.method = CDA.DEFAULT_OPTIONS.METHOD; // method;
          options.headers = {};
          if (username) options.headers.Authorization = "Basic " + (new Buffer(username + ":" + (password || ""))).toString("base64");
          this.options = options;
          this.changeStatus(-1, 1);
        },
        send: function (data) {
          var me = this,
          options = me.options,
          client;
          if (data) {
            options.headers["Content-Length"] = Buffer.byteLength(data);
          }
          switch (options.protocol) {
            case "http:":
            client = require("http");
            if (!options.port) options.port = "80";
            break;
            case "https:":
            client = require("https");
            if (!options.port) options.port = "443";
            break;
            default:
            throw "Unsupported protocol " + options.protocol;
          }
          me.responseText = "";
          var request = client.request(options, function (response) {
            response.setEncoding("utf8");
            me.changeStatus(-1, 2);
            response.on("data", function (chunk) {
              me.responseText += chunk;
              me.changeStatus(response.statusCode, 3);
            });
            response.on("error", function (error) {
              me.changeStatus(response.statusCode, 4);
            });
            response.on("end", function () {
              me.changeStatus(response.statusCode, 4);
            });
          });
          request.on("error", function (e) {
            me.responseText = e;
            me.changeStatus(500, 4);
          });
          if (data) request.write(data);
          request.end();
        },
        setRequestHeader: function (name, value) {
          this.options.headers[name] = value;
        }
      };
      return new xhr();
    } else {
      CDA.Exception.newError("ERROR_INSTANTIATING_XMLHTTPREQUEST", "ajax", null)._throw();
    }
  }


  /**
   * Convert parameters for HTTP request.
   *
   * @param params a parameters to convert.
   * @return {string} a string with parameters converted for HTTP request.
   */

   function _convertParams(params) {
    var form = "?";
    var isFirst = true;
    for (var key in params) {
      isFirst ? isFirst = false : form += "&";
      var value = typeof params[key] == 'function' ? params[key]() : params[key];
      form += key + "=" + value;
    }
    return form;
  }


  /**
   * Checks argument is undefined.
   *
   * @param arg an argument.
   * @return {boolean} <code>true</code> if argument is undefined, <code>false</code> if
   *         argument isn't undefined.
   */

   function _isUnd(arg) {
    return typeof (arg) === "undefined";
  }


  /**
   * Checks argument is function.
   *
   * @param arg an argument.
   * @return {boolean} <code>true</code> if argument is function, <code>false</code> if argument
   *         isn't function.
   */

   function _isFun(arg) {
    return typeof (arg) === "function";
  }


  /**
   * Function responsable for invoke an endpoint.
   *
   * @param callback a callback function executed when HTTP request to endpoint gives success.
   * @param options a options for invoke endpoint (can be HTTP parameters, ...).
   * @param endpoint an endpoint name.
   * @param self a self instance of CDAjs.
   */

   function _invokeEndpoint(callback, options, endpoint, self) {
    var xhr = _Xhr();
    options.method = options.method || CDA.DEFAULT_OPTIONS.METHOD;

    // Parameters for Pentaho Authentication
    if((options.username || self.options.username) !== undefined && (options.password || self.options.password) !== undefined){
      options.params["userid"] = options.username || self.options.username;
      options.params["password"] = options.password || self.options.password;
    }

    if(Object.getOwnPropertyNames(options.params).length>0){
      options.form = _convertParams(options.params);
    }

    var finalUrl = (options.url || self.options.url) + endpoint + (options.method.toUpperCase() === "GET" ? (options.form || "") : "");
    xhr.open(options.method, finalUrl, options.async || CDA.DEFAULT_OPTIONS.ASYNC, options.username, options.password);
    xhr.timeout = options.timeout || CDA.DEFAULT_OPTIONS.REQUEST_TIMEOUT;
    xhr.setRequestHeader("Accept", options["Accept"] || CDA.DEFAULT_OPTIONS.ACCEPT);
    xhr.setRequestHeader("Content-Type", options["Content-Type"] || CDA.DEFAULT_OPTIONS.CONTENT_TYPE);

    if (options.method.toUpperCase() === "GET") {
      xhr.send();
    } else {
      xhr.send(options.form || "");
    }

    xhr.onreadystatechange = function () {
      switch (xhr.readyState) {
        case 0:
        if (_isFun(options.aborted)) {
          options.aborted(xhr);
        }
        break;
        case 4:
        if (xhr.status === 200) {
          var response = "";
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            response = xhr.responseText;
            console.log("Can not convert to JSON after invoke " + endpoint + " endpoint.");
          }
          callback(xhr.responseText == "" ? "" : response);
        } else {
          var err = CDA.Exception.newError("HTTP_ERROR", "xhr", {
            request: options,
            status: self.status,
            statusText: self.statusText
          });
          console.log("Error: " + err);
          // When I have an error in HTTP, this allows better debugging
          // So made an extra call instead of _newError inside func call
          if (!_isUnd(options.error) && _isFun(options.error)) {
            options.error(err);
          }
        }
        break;
      }
    };
  }


  if (!window.JSON) {
    window.JSON = {
      parse: function (sJSON) {
        return eval("(" + sJSON + ")");
      },
      stringify: function (vContent) {
        if (vContent instanceof Object) {
          var sOutput = "";
          if (vContent.constructor === Array) {
            for (var nId = 0; nId < vContent.length; sOutput += this.stringify(vContent[nId]) + ",", nId++);
              return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
          }
          if (vContent.toString !== Object.prototype.toString) {
            return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\"";
          }
          for (var sProp in vContent) {
            sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ",";
          }
          return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
        }
        return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
      }
    };
  }


  /**
   * The CDA class provides a javascript API to communicate Pentaho Community Data Access plugin
   * (CDA) over HTTP.
   *
   * @class CDA
   * @constructor
   * @param options {Object} standard options
   */

   function CDA(options) {
    this.options = options || CDA.Exception.newError("ERROR_CDA_OPTIONS", "CDA.constructor", null)._throw();
    this.options.url = options.url || CDA.Exception.newError("ERROR_CDA_URL", "CDA.constructor", null)._throw();
    if(typeof exports === "undefined"){
      this.options.username = options.username;
      this.options.password = options.password;
    }else{
      this.options.username = options.username || CDA.Exception.newError("ERROR_CDA_USERNAME", "CDA.constructor", null)._throw();
      this.options.password = options.password || CDA.Exception.newError("ERROR_CDA_PASSWORD", "CDA.constructor", null)._throw();
    }
    this.options.params = options.params || {};
  }


  /**
   * These are the default options used for new CDA instances in case no custom properties are set.
   * It sets the following properties:
   * <ul>
   * <li><code>REQUEST_TIMEOUT</code> int: 60000 - number of milliseconds before a request to the
   * Pentaho server will timeout </li>
   * <li><code>ASYNC</code> boolean: true - determines whether synchronous or asynchronous
   * communication with the Pentaho server will be used.</li>
   * <li><code>ACCEPT</code> string: text/xml, application/json - determines the accept header on
   * http request with the Pentaho server will be used.</li>
   * <li><code>CONTENT_TYPE</code> string: application/json - determines the content-type header
   * on http request with the Pentaho server will be used.</li>
   * <li><code>METHOD</code> string: GET - determines the method on http request with the Pentaho
   * server will be used.</li>
   * </ul>
   *
   * @property DEFAULT_OPTIONS
   * @static
   * @type object
   */
   CDA.DEFAULT_OPTIONS = {
    REQUEST_TIMEOUT: 60000,
    ASYNC: true,
    ACCEPT: "text/xml, application/json",
    CONTENT_TYPE: "application/json",
    METHOD: "GET"
  };

  /**
   * Invokes the <code>/cda/doQuery</code> endpoint of CDA.
   *
   * @method doQuery
   * @param {function()} callback Function to be called for cda query done.
   * @param {Object} options Options to use on http request.
   */
   CDA.prototype.doQuery = function (callback, options) {
    var endpoint = "doQuery";
    if (_isUnd(options)) {
      options = this.options;
    }
    // Is mandatory use dataAccessId
    if (_isUnd(options.params) || _isUnd(options.params.dataAccessId)) {
      CDA.Exception.newError("ERROR_MISSING_DATA_ACCESS_ID", endpoint, null)._throw();
    }

    // invokes endpoint
    _invokeEndpoint(callback, options, endpoint, this);
  };


  /**
   * Invokes the <code>/cda/listQueries</code> endpoint of CDA.
   *
   * @method listQueries
   * @param {function()} callback Function to be called for cda query done.
   * @param {Object} options Options to use on http request.
   */
   CDA.prototype.listQueries = function (callback, options) {
    var endpoint = "listQueries";
    if (_isUnd(options)) {
      options = this.options;
    }
    // Is mandatory use params
    if (_isUnd(options.params)) {
      CDA.Exception.newError("ERROR_MISSING_PARAMS", endpoint, null)._throw();
    }
    // Is mandatory use param path
    if (_isUnd(options.params.path)) {
      CDA.Exception.newError("ERROR_MISSING_PARAMS_PATH", endpoint, null)._throw();
    }

    // invokes endpoint
    _invokeEndpoint(callback, options, endpoint, this);
  };


  /**
   * Invokes the <code>/cda/getCdaList</code> endpoint of CDA.
   *
   * @method getCdaList
   * @param {function()} callback Function to be called for cda query done.
   * @param {Object} options Options to use on http request.
   */
   CDA.prototype.getCdaList = function (callback, options) {
    var endpoint = "getCdaList";
    if (_isUnd(options)) {
      options = this.options;
    }

    // invokes endpoint
    _invokeEndpoint(callback, options, endpoint, this);
  };


  /**
   * Invokes the <code>/cda/listDataAccessTypes</code> endpoint of CDA.
   *
   * @method listDataAccessTypes
   * @param {function()} callback Function to be called for cda query done.
   * @param {Object} options Options to use on http request.
   */
   CDA.prototype.listDataAccessTypes = function (callback, options) {
    var endpoint = "listDataAccessTypes";
    if (_isUnd(options)) {
      options = this.options;
    }

    // invokes endpoint
    _invokeEndpoint(callback, options, endpoint, this);
  };


  /**
   * Invokes the <code>/cda/listParameters</code> endpoint of CDA.
   *
   * @method listParameters
   * @param {function()} callback Function to be called for cda query done.
   * @param {Object} options Options to use on http request.
   */
   CDA.prototype.listParameters = function (callback, options) {
    var endpoint = "listParameters";
    if (_isUnd(options)) {
      options = this.options;
    }
    // Is mandatory use params
    if (_isUnd(options.params)) {
      CDA.Exception.newError("ERROR_MISSING_PARAMS", endpoint, null)._throw();
    }
    // Is mandatory use param path
    if (_isUnd(options.params.path)) {
      CDA.Exception.newError("ERROR_MISSING_PARAMS_PATH", endpoint, null)._throw();
    }
    // Is mandatory use param dataAccessId
    if (_isUnd(options.params.dataAccessId)) {
      CDA.Exception.newError("ERROR_MISSING_PARAMS_DATA_ACCESS_ID", endpoint, null)._throw();
    }

    // invokes endpoint
    _invokeEndpoint(callback, options, endpoint, this);
  };


  /**
   * Invokes the <code>/cda/clearCache</code> endpoint of CDA.
   *
   * @method clearCache
   * @param {function()} callback Function to be called for cda query done.
   * @param {Object} options Options to use on http request.
   */
   CDA.prototype.clearCache = function (callback, options) {
    var endpoint = "clearCache";
    if (_isUnd(options)) {
      options = this.options;
    }

    // invokes endpoint
    _invokeEndpoint(callback, options, endpoint, this);
  };


  /**
   * Invokes the <code>/cda/getCdaFile</code> endpoint of CDA.
   *
   * @method getCdaFile
   * @param {function()} callback Function to be called for cda query done.
   * @param {Object} options Options to use on http request.
   */
   CDA.prototype.getCdaFile = function (callback, options) {
    var endpoint = "getCdaFile";
    if (_isUnd(options)) {
      options = this.options;
    }

    // invokes endpoint
    _invokeEndpoint(callback, options, endpoint, this);
  };


  /**
   * <p>
   * This class is used to indicate an runtime errors occurring in any of the methods of the CDAjs
   * classes.
   * </p>
   * <p>
   * You do not need to instantiate objects of this class yourself. Rather, instances of this class
   * are created and thrown at runtime whenever an error occurs.
   * </p>
   * <p>
   * To handle CDAjs errors, you can use a <code>try...catch</code> block like this:
   * </p>
   *
   * <pre>
   *    try {
   *        ...general cdajs work...
   *    } catch (exception) {
   *        if (exception instanceof CDA.Exception) {
   *            ...use exception.code, exception.message and exception.data to handle the exception.
   *        } else {
   *            ...handle other errors...
   *        }
   *    }
   * </pre>
   *
   * @class CDA.Exception
   * @constructor
   */
   CDA.Exception = function (type, code, message, helpfile, source, data, args) {
    this.type = type;
    this.code = code;
    this.message = message;
    this.source = source;
    this.helpfile = helpfile;
    this.data = data;
    this.args = args;
    return this;
  };


  /**
   * Create an exception.
   *
   * @param codeName an exception code name.
   * @param source an exception source
   * @param data an exception data to specify
   * @return {Object|CDA.Exception}
   */
   CDA.Exception.newError = function (codeName, source, data) {
    return new this.newDetailError(CDA.Exception[codeName + "_CODE"], CDA.Exception[codeName + "_MSG"], CDA.Exception[codeName + "_HELP"], source, data);
  };


  /**
   * Create an exception.
   *
   * @param code an exception code name.
   * @param message an exception message.
   * @param help an exception information help.
   * @param source an exception source
   * @param data an exception data to specify
   * @returns {Object|CDA.Exception}
   */
   CDA.Exception.newDetailError = function (code, message, help, source, data) {
    return new CDA.Exception(CDA.Exception.TYPE_ERROR, code, message, help, source, data);
  };


  var CDAWikiExceptionCodes = "https://github.com/latinojoel/cdajs/wiki/Exception-Codes";


  /**
   * Can appear as value for the type property of instances of the CDA.Exception class, and
   * indicates that this <code>CDA.Exception</code> signals an error.
   *
   * @property TYPE_ERROR
   * @static
   * @final
   * @type string
   * @default error
   */
   CDA.Exception.TYPE_ERROR = "error";


  /**
   * Can appear as value for the type property of instances of the CDA.Exception class, and
   * indicates that this <code>CDA.Exception</code> signals a warning.
   *
   * @property TYPE_WARNING
   * @static
   * @final
   * @type string
   * @default warning
   */
   CDA.Exception.TYPE_WARNING = "warning";


  /**
   * Exception code indicating that missing the CDA URL.
   *
   * @property ERROR_CDA_URL_CODE
   * @static
   * @final
   * @type {int}
   * @default -1
   */
   CDA.Exception.ERROR_CDA_URL_CODE = -1;
   CDA.Exception.ERROR_CDA_URL_MSG = "Missing CDA URL";
   CDA.Exception.ERROR_CDA_URL_HELP = "Please provide CDA url on the CDA object constructor (Please consult this page " + CDAWikiExceptionCodes + ")";


  /**
   * Exception code indicating that missing options in the constructor.
   *
   * @property ERROR_CDA_OPTIONS_CODE
   * @static
   * @final
   * @type {int}
   * @default -2
   */
   CDA.Exception.ERROR_CDA_OPTIONS_CODE = -2;
   CDA.Exception.ERROR_CDA_OPTIONS_MSG = "Missing CDA Options";
   CDA.Exception.ERROR_CDA_OPTIONS_HELP = "Please provide CDA options on the CDA object constructor (Please consult this page " + CDAWikiExceptionCodes + ")";


  /**
   * Exception code indicating a general XMLHttpRequest error. If this error occurs, the data object
   * of the exception will have these members:
   * <ul>
   * <li>request: the options that make up the original HTTP request</li>
   * <li>status: the HTTP status code</li>
   * <li>statusText: the HTTP status text</li>
   * </ul>
   *
   * @property HTTP_ERROR_CODE
   * @static
   * @final
   * @type {int}
   * @default -3
   */
   CDA.Exception.HTTP_ERROR_CODE = -3;
   CDA.Exception.HTTP_ERROR_MSG = "HTTP ERROR";
   CDA.Exception.HTTP_ERROR_HELP = "Generic HTTP error (Please consult this page " + CDAWikiExceptionCodes + ")";


  /**
   * Exception code indicating that missing username for Pentaho authentication.
   *
   * @property ERROR_CDA_USERNAME_CODE
   * @static
   * @final
   * @type {int}
   * @default -4
   */
   CDA.Exception.ERROR_CDA_USERNAME_CODE = -4;
   CDA.Exception.ERROR_CDA_USERNAME_MSG = "Missing CDA Username";
   CDA.Exception.ERROR_CDA_USERNAME_HELP = "Please provide CDA username on the CDA object constructor (Please consult this page " + CDAWikiExceptionCodes + ")";


  /**
   * Exception code indicating that missing password for Pentaho authentication.
   *
   * @property ERROR_CDA_PASSWORD_CODE
   * @static
   * @final
   * @type {int}
   * @default -5
   */
   CDA.Exception.ERROR_CDA_PASSWORD_CODE = -5;
   CDA.Exception.ERROR_CDA_PASSWORD_MSG = "Missing CDA Password";
   CDA.Exception.ERROR_CDA_PASSWORD_HELP = "Please provide CDA password on the CDA object constructor (Please consult this page " + CDAWikiExceptionCodes + ")";


  /**
   * Exception code indicating that missing data access id for CDA query.
   *
   * @property ERROR_MISSING_DATA_ACCESS_ID_CODE
   * @static
   * @final
   * @type {int}
   * @default -6
   */
   CDA.Exception.ERROR_MISSING_DATA_ACCESS_ID_CODE = -6;
   CDA.Exception.ERROR_MISSING_DATA_ACCESS_ID_MSG = "Missing CDA data access id";
   CDA.Exception.ERROR_MISSING_DATA_ACCESS_ID_HELP = "Please provide CDA data access id (Please consult this page " + CDAWikiExceptionCodes + ")";


  /**
   * Exception code indicating that missing params object for invoke CDA endpoint.
   *
   * @property ERROR_MISSING_PARAMS_CODE
   * @static
   * @final
   * @type {int}
   * @default -7
   */
   CDA.Exception.ERROR_MISSING_PARAMS_CODE = -7;
   CDA.Exception.ERROR_MISSING_PARAMS_MSG = "Missing object params";
   CDA.Exception.ERROR_MISSING_PARAMS_HELP = "Please provide params (Please consult this page " + CDAWikiExceptionCodes + ")";


  /**
   * Exception code indicating that missing path property on object params for invoke CDA endpoint.
   *
   * @property ERROR_MISSING_PARAMS_PATH_CODE
   * @static
   * @final
   * @type {int}
   * @default -9
   */
   CDA.Exception.ERROR_MISSING_PARAMS_PATH_CODE = -9;
   CDA.Exception.ERROR_MISSING_PARAMS_PATH_MSG = "Missing path property on object params";
   CDA.Exception.ERROR_MISSING_PARAMS_PATH_HELP = "Please provide path property on params (Please consult this page " + CDAWikiExceptionCodes + ")";


   CDA.Exception.prototype = {

    /**
     * This propery indicates what kind of exception occurred. It can have one of the following
     * values:
     * <dl>
     * <dt><code>TYPE_WARNING</code></dt>
     * <dd>Indicates a warning</dd>
     * <dt><code>TYPE_ERROR</code></dt>
     * <dd>Indicates an error</dd>
     * </dl>
     *
     * @property type
     * @type {string}
     * @default null
     */
     type: null,


    /**
     * A code that can be used to identify this particular kind of exception.
     *
     * @property code
     * @type {int}
     * @default null
     */
     code: null,
    /**
     * A human readable message that describes the nature of the error or warning.
     *
     * @property message
     * @type {string}
     * @default null
     */
     message: null,


    /**
     * A name that indicates in what component (on the client or server side) this error or warning
     * occurred.
     *
     * @property source
     * @type {string}
     * @default null
     */
     source: null,


    /**
     * A path or url that points to a document that contains more information about this error.
     *
     * @property helpfile
     * @type {string}
     * @default null
     */
     helpfile: null,


    /**
     * Additional data captured when the exception was instantiated. The type of information stored
     * here is dependent upon the nature of the error.
     *
     * @property data
     * @type {string}
     * @default null
     */
     data: null,
     _throw: function () {
      throw this;
    },


    /**
     * A reference to the built-in <code>arguments</code> array of the function that is throwing
     * the exception This can be used to get a "stack trace"
     *
     * @property args
     * @type {array}
     */
     args: null,


    /**
     * Returns a string representing this exception
     *
     * @method toString
     * @return a string representing this exception
     */
     toString: function () {
      return this.type + " " + this.code + ": " + this.message + " (source: " + this.source + ")";
    },


    /**
     * Get a stack trace.
     *
     * @method getStackTrace
     * @return an array of objects describing the function on the stack
     */
     getStackTrace: function () {
      var stack = "";
      if (this.args) {
        var func = this.args.callee;
        while (func) {
          funcstring = String(func);
          func = func.caller;
        }
      }
      return stack;
    }
  };


  /*
   * Register CDAjs. In an amd (https://github.com/amdjs/amdjs-api/wiki/AMD) environment, use the
   * define function Otherwise, add it to the global window variable. For server side environemnts
   * that do not have a proper window object, simply create a global variable called window and
   * assign an object to it that you want to function as the CDA container.
   */
   if (typeof (define) === "function" && define.amd) {
    define(function () {
      return CDA;
    });
  } else window.CDA = CDA;

  return CDA;

})(typeof exports === "undefined" ? window : exports);
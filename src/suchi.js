/**
 * @preserve
 *
 * Suchi.js -- No user left behind.
 *
 * Copyright 2012-2013:
 *      Alex Russell <slightlyoff@chromium.org>
 *      Frances Berriman <phaeness@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(global) {
  var suchi = global.suchi = global.suchi || {};

  // FIXME: assert here that suchi.isOld exists!

  //
  // Utility Functions
  //

  var forEach = (typeof [].forEach == "function") ?
                  function(a, cb, scope) { return a.forEach(cb, scope); } :
                  function(a, cb, scope) {
                    var i = 0, l = a.length || 0;
                    for(; i < l; ++i){
                      cb.call(scope||global, a[i], i, a);
                    }
                  };

  var isArray = function(o) {
    return Object.prototype.toString.call(o) == "[object Array]";
  };

  var ua = (global.navigator) ? global.navigator.userAgent : "";

  /* Oh if only we could really tell... this should be right on the most browsers... */
  var lang = navigator.language;
  lang = global.navigator.language || global.navigator.userLanguage || global.navigator.browserLanguage || "";
  lang = lang.toLowerCase(); 

  //
  // Maps of upgrade options, (lagging browser) -> (appropriate evergreen set)
  //


  var CHROME = "CHROME",
      GCF    = "GCF",
      FF     = "FF",
      SAFARI = "SAFARI",
      IE     = "IE",
      OPERA  = "OPERA";

  suchi.evergreenOptions = {
    IE9: {
      // IE 9 never shipped on XP. More's the pitty.
      "vista": [     CHROME, FF, GCF, OPERA ],
      "win7":  [ IE, CHROME, FF, GCF, OPERA ]
    },
    IE8: {
      "xp":    [     CHROME, FF, GCF, OPERA ],
      "vista": [ IE, CHROME, FF, GCF, OPERA ],
      "win7":  [ IE, CHROME, FF, GCF, OPERA ]
    },
    IE7: {
      "xp":    [     CHROME, FF, GCF, OPERA ],
      "vista": [ IE, CHROME, FF, GCF, OPERA ]
      // Vista was the last OS supported for IE7
    },
    IE6: {
      // Not bothering with 2K or 2K3
      "xp":    [     CHROME, FF, GCF, OPERA ]
    }
    // FIXME: need to add mobile dead-ends/options here!
    // Mobile dead-enders that we care about:
    //  Android Browser
    //  Safari on devices that won't get updates
    //    - only evergreen iOS option is a proxy-browser, e.g. Opera Mini
    // Mobile evergreen options:
    //  Opera
    //  Chrome (For ICS+ Android users)
    //  FF: for ARMv7+ devices (see: http://goo.gl/PhQs9)
  };

  var portable = [ "FF36", "CR_recent", "FF_recent" ];
  for(var x = 0; x < portable.length; x++) {
    suchi.evergreenOptions[portable[x]] = {
      "xp":    [     CHROME, FF, OPERA ],
      "vista": [ IE, CHROME, FF, OPERA ],
      "win7":  [ IE, CHROME, FF, OPERA ],
      "osx":   [     CHROME, FF, OPERA ]
    };
  }

  /*
  suchi.prompts = {

  };
  */

  // Handle configuration.
  var defaultOptionList = {
    treatGCFAsLagging: false,
    onlagging: [],
    onload: [],
    prompt: undefined,
    promptAt: "",
    allowCookies: true,
    pageviewsTillPrompt: 3,
    rePromptDelay: 4
  };
  defaultOptionList.onload.test =
  defaultOptionList.onlagging.test =
      function(v) { return (v instanceof Function); };
  /*
  function(v) {
    return typeof v == "function";
  };
  */

  suchi._mergeOptions = function(optionsObject, defaults) {
    // Merge all of the options based on a prototype of the supported options
    // Make an options object that treats "defaults" as its prototype. My
    // kingdom for __proto__!
    var OC = function() {};
    OC.prototype = defaults || {};
    var options = new OC();

    // FIXME: log an error here?
    if (!optionsObject) { return options; }

    for (var name in optionsObject) {
      (function(default_v,
                default_t,
                value,
                value_t) {

        if (default_t == "undefined" ||
            (default_t == "boolean" && value_t == "boolean") ||
            (default_t == "string"  && value_t == "string")) {
          options[name] = value;
          return;
        }

        if (isArray(default_v)) {
          var optionsValue = options[name].slice(0);
          var test = (default_v["test"] || function() { return true; });
          var valueArray = isArray(value) ? value : [ value ];

          for (var y = 0; y < valueArray.length; y++) {
            if (test(valueArray[y])) { optionsValue.push(valueArray[y]); }
          }
          options[name] = optionsValue;
          return;
        }

      })(defaults[name],      typeof defaults[name],
         optionsObject[name], typeof optionsObject[name]);
    }
    return options;
  };

  var lookupMessage = function(options){
    // do we have messages?
    var message, locales = options.prompt.defaultLocales;
    locales.splice(0, 0, lang, lang.split("-")[0]);
    for(var i=0; i<locales.length; i++){
      message = options.prompt.messages[locales[i]];
      if(message){ break };
    }
    
    return message;
  }

  var setPrompt = function(options){
    if(options.prompt.id){
      (function(){
        var el = document.getElementById(options.prompt.id);
        if(el){
            el.innerHTML = lookupMessage(options);
        }
      }());
    }
  }

  suchi._parseOptions = function(options) {
    options = suchi._mergeOptions(options, defaultOptionList);

    if (ua && suchi.isOld(ua)) {

      forEach(options.onlagging, function(cb) {
        try { 
          // We need to 

          if(typeof options.prompt === "string"){
            // load a uri?
          }else{
            setPrompt(options);
            cb( lookupMessage(options) );
          } 
        } catch(e) { 
          /* squelch */ 
        }
      });

    }
  };

  forEach((global["suchiConfig"] || []), suchi._parseOptions);

  // TODO(slightlyoff):
  //  * attach to load event and place the promo
  //  * parse and respect the config
  //  * i18n infrastructure

  // TODO(slightlyoff): Determine our current locale!
})(this);

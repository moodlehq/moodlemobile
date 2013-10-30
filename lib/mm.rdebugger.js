// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

/**
 * @fileoverview Moodle mobile remote debugging lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile remote debugging functionallity.
 */
MM.rdebugger = {
    interval:  5000,
    maxTime: 900000,
    currentTime: 0,
    enabled: false,
    errors: 0,
    streaming: false,
    startTime: 0,

    start: function() {
        MM.log('Enabling remote debugging', 'Rdebug');
        MM.rdebugger.enabled = true;
        MM.rdebugger.currentTime = 0;
        MM.rdebugger.errors = 0;
        MM.rdebugger.streaming = false;
        var d = new Date();
        MM.rdebugger.startTime = d.getTime() / 1000;
        MM.popMessage(MM.lang.s("rdebuggingenabledfor") + (MM.rdebugger.maxTime / 1000));
        setTimeout(function() { MM.rdebugger.getMessages()}, MM.rdebugger.interval);
    },

    finish: function() {
        MM.log('Disabling remote debugging', 'Rdebug');
        MM.rdebugger.enabled = false;
    },

    /**
     * Returns the base url for all remote debugger messages to go to.
     *
     * @return {String} A URL to send remote debugger messages to.
     */
    _getBaseURL: function() {
        return MM.config.current_site.siteurl + '/local/mmrdebugger/messages.php';
    },

    _getMessagesSuccess: function(messages) {
        var responsesQ = [];

        if(!messages) {
            return;
        }

        $.each(messages, function(index, message) {
            if(!message.type) {
                return true;    // next message
            }
            // Old messages.
            if (!message.timestamp || message.timestamp < MM.rdebugger.startTime) {
                return true;
            }

            MM.log("Rdebug: Message type " + message.type + " timestamp: " + message.timestamp);

            if (message.type == "command" && message.text) {
                MM.log("Rdebug: Executing command " + message.text);
                var commandReturn = "";
                try {
                    // We trust in the remote user executing commands since it's the Moodle admin
                    // We have to also enable this functionality for a restricted time
                    /// Maybe a little additional security will be interesting.
                    /// Caja or jssandbox are good candidates.
                    commandReturn = eval(message.text);
                } catch(e) {
                    commandReturn = e.message;
                }

                if (typeof(commandReturn) == "object" && commandReturn instanceof jQuery) {
                    commandReturn = commandReturn.html();
                } else if (typeof(commandReturn) == "object"){
                    try {
                        commandReturn = JSON.stringify(commandReturn);
                    } catch(e) {
                        commandReturn = new String(commandReturn);
                    }
                }
                responsesQ.push({messageid: message.id, response: commandReturn});
            } else if (message.type == "screenshot") {
                MM.rdebugger._takeScreenshot(message.id);
            } else if (message.type == "streampage") {
                MM.rdebugger.streaming = message.id;
            } else if (message.type == "stopstreampage") {
                MM.rdebugger.streaming = false;
                responsesQ.push({messageid: message.id, response: 'ACK', type: message.type});
            } else if (message.type == "inspector") {
                $("body").html(message.text);

                // Render pages in order to preserve javascript handlers.
                MM.panels.html("left", $("#panel-left").html());
                MM.panels.html("center", $("#panel-center").html());
                MM.panels.html("right", $("#panel-right").html());

                // Menu toogler
                $('.toogler').bind(MM.clickType, function() {
                    $(this).next().slideToggle(300);
                    return false;
                });

                // Main events
                if (MM.deviceType == 'tablet') {
                    $('#mainmenu').bind(MM.clickType, function(e) {
                        MM.panels.menuShow();
                        e.stopPropagation();
                    });
                } else {
                    $('#mainmenu').bind(MM.clickType, function(e) {
                        MM.panels.goBack();
                        e.stopPropagation();
                    });
                }

                // Widgets events..
                for (var el in MM.widgets.eventsRegistered) {
                    $(el).bind(MM.clickType, MM.widgets.eventsRegistered[el]);
                }
                responsesQ.push({messageid: message.id, response: 'ACK', type: message.type});
            }
        });

        MM.rdebugger._dequeueResponses(responsesQ);

        if (MM.rdebugger.streaming !== false) {
            MM.rdebugger._streamPage();
        }
    },

    /**
     * Goes through each response sending it to _getBaseURL().
     *
     * @param {Array} responses The responses to send back.
     *
     * @return void
     */
    _dequeueResponses: function(responses) {
        $.each(responses, function(index, response) {
            response.type = (!response.type)? 'command' : response.type;

            var data = {
                "token": MM.config.current_token,
                "action": "reply_message",
                "messageid": response.messageid,
                "response": response.response,
                "type": response.type
            };
            $.ajax({
                "url": MM.rdebugger._getBaseURL(),
                "data": data,
                "dataType": "json",
                "type": "POST",
                "error": function(e) {
                    MM.log("Rdebug: Error retrieving url: " + MM.rdebugger._getBaseURL());
                    MM.rdebugger.errors++;
                }
            });
        });
    },

    getMessages: function() {
        if (!MM.rdebugger.enabled) {
            return;
        }
        if (MM.rdebugger.currentTime > MM.rdebugger.maxTime) {
            MM.rdebugger.finish();
            return;
        }
        if (MM.rdebugger.errors > 5) {
            MM.rdebugger.finish();
            return;
        }

        var data = {
            "token": MM.config.current_token,
            "action": "get_messages"
        };
        $.ajax({
            url: MM.rdebugger._getBaseURL(),
            data:data,
            dataType: "json",
            success: _getMessagesSuccess,
            error: function(e) {
                MM.log("Rdebug: Error retrieving url: " + MM.rdebugger._getBaseURL());
                MM.rdebugger.errors++;
            },
            complete: function() {
                MM.rdebugger.currentTime += MM.rdebugger.interval;
                setTimeout(function() { MM.rdebugger.getMessages()}, MM.rdebugger.interval);
            }
        });
    },

    _takeScreenshot: function(messageId) {
        var baseURL = MM.rdebugger._getBaseURL();
        if (typeof(html2canvas) == "undefined") {
            $.getScript('externallib/html2canvas.js', function(d) {
                html2canvas(document.body, {
                    onrendered: function(canvas) {
                        MM.rdebugger._sendScreenshot(messageId, canvas.toDataURL("image/png"));
                        // Free memory
                        canvas = null;
                    }
                });
            });
        } else {
            html2canvas(document.body, {
                onrendered: function(canvas) {
                    MM.rdebugger._sendScreenshot(messageId, canvas.toDataURL("image/png"));
                    // Free memory
                    canvas = null;
                }
            });
        }
    },

    _sendScreenshot: function(messageId, screenshot) {
        var baseURL = MM.rdebugger._getBaseURL();
        var data = {
            "token": MM.config.current_token,
            "action": "reply_message",
            "messageid": messageId,
            "response": screenshot,
            "type": "screenshot"
        };

        $.ajax({
            "url": baseURL,
            "data": data,
            "dataType": "json",
            "type": "POST",
            "error": function(e) {
                MM.log("Rdebug: Error retrieving url: " + baseURL);
                MM.rdebugger.errors++;
            }
        });
    },

    _streamPage: function() {
        var messageId = MM.rdebugger.streaming;
        var baseURL = MM.rdebugger._getBaseURL();
        var css = [];

        for (var sheeti = 0, length = document.styleSheets.length; sheeti < length; sheeti++) {
            var sheet = document.styleSheets[sheeti];
            var rules = ('cssRules' in sheet) ? sheet.cssRules : sheet.rules;
            for (var rulei = 0, rulelength = rules.length; rulei < rulelength; rulei++) {
                var rule = rules[rulei];
                if ('cssText' in rule) {
                    css.push(rule.cssText);
                } else {
                    css.push(rule.selectorText + ' {\n' + rule.style.cssText + '\n}\n');
                }
            }
        }

        var cssText = css.join('\n');
        cssText = cssText.replace(new RegExp(location.href+"/", ""), "");
        var bodyText = $("body").html();
        var page = "<html><head><style type=\"text/css\">" + cssText + "</style></head><body>" + bodyText + "</body></html>";

        var response = {
            width: $(document).innerWidth(),
            height: $(document).innerHeight(),
            contents: encodeURIComponent(page)
        };

        var data = {
            "token": MM.config.current_token,
            "action": "reply_message",
            "messageid": messageId,
            "response": JSON.stringify(response),
            "type": "streampage"
        };
        $.ajax({
            "url": baseURL,
            "data": data,
            "dataType": "json",
            "type": "POST",
            "error": function(e) {
                MM.log("Rdebug: Error retrieving url: " + baseURL);
                MM.rdebugger.errors++;
            }
        });
    }
};
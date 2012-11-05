/**
 * Moodle Mobile main lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

var MM = {
    
    config: {},
    plugins: [],
    models: {},
    collections: {},
    deviceType: "phone",
    
    init: function(config) {
        // Config.js settings.
        this.config = config;
        
        // Device type detection.
        if (matchMedia('only screen and (min-width: 768px) and (-webkit-min-device-pixel-ratio: 1)').matches) {		
            this.deviceType = 'tablet';
        } else {
            this.deviceType = 'phone';
        }
        
        // Load the Backbone.Router for URL routing.
        var appRouter = Backbone.Router.extend();
        this.Router = new appRouter;

        // AJAX error handling.
        $.ajaxSetup({"error":function(xhr,textStatus, errorThrown) {
            var error = MM.lang.s("cannotconnect");
            if (xhr.status == 404) {
                error = MM.lang.s("invalidscheme");
            }
            MM.popErrorMessage(error);
        }});

        // Load Models.
        // Elements for the core storage model.
        var storage = {
            setting: {type: "model", bbproperties: {initialize: function(){ MM.config[this.get('name')] = this.get('value'); }}},
            settings: {type: "collection", model: "setting"},
            site: {type: "model"},
            sites: {type: "collection", model: "site"},
            course: {type: "model"},
            courses: {type: "collection", model: "course"}
        }        
        this.loadModels(storage);
        
        // Load core Routes.
        this.loadRoutes();

        // Load configs from database.
        var settings = this.collections['settings'];
        settings.fetch();
        
        settings.each(function(e){
            MM.config[e.get('name')] = e.get('value');
        });
    },
    
    loadLayout: function() {
        // Dom is ready!.
        Backbone.history.start();
        
        // Add site events.
        $('#add-site form').on('submit', this.addSite);
        
        if (typeof MM.config.presets.url != "undefined") {
            $("#url").val(MM.config.presets.url);
        }
        if (typeof MM.config.presets.username != "undefined") {
            $("#username").val(MM.config.presets.username);
        }
        
        // Panels size in pixels in three panels view
        var panelCenter = {
                left: $('#panel-center').css('left'),
                width: $('#panel-center').css('width')
            };
        var panelRight = {
                left: $('#panel-right').css('left'),
                width: $('#panel-right').css('width')
            };
        
        
        // Force the height of the panels to the screen height.
        $('#add-site, #main-wrapper, #panel-left').css('height', $(document).innerHeight());
        
        var headerHeight = $('.header-wrapper').height();
        $('#panel-center, #panel-right').css('height', $(document).innerHeight() - headerHeight);
            
        $(window).bind('orientationchange', function(e) {
            $('#main-wrapper, #panel-left').css('height', $(document).innerHeight());
        
            var dH = $(document).height();
            var wH = $(window).height();
            var diH = $(document).innerHeight();
            
            var newH = (dH < wH)? dH : wH;
            newH = (diH < newH)? diH : newH;
        
            headerHeight = $('.header-wrapper').height();
            $('#main-wrapper, #panel-left').css('height', newH);
            $('#panel-center, #panel-right').css('height', newH - headerHeight);
    
        });
    
        if (matchMedia('only screen and (min-width: 768px) and (-webkit-min-device-pixel-ratio: 1)').matches) {		

            $('#mainmenu').on('click touchstart', function(){
                MM.panels.menuShow();
            });
                                
            // Swipe detection.
            $("#main-wrapper").swipe({
                swipe: function(event, direction, distance, duration, fingerCount) {
                  if (direction != 'left' && direction != 'right')
                    return;
                  MM.panels.menuShow((direction == 'left') ? false : true);
                }
              });
        } else {
            
            $('#mainmenu').on('click touchstart', function(){
                MM.panels.goBack();
            });
            $('#panel-center, #panel-right').swipe({
                swipeRight:function(event, direction, distance, duration, fingerCount) {			  
                  MM.panels.goBack();
                }
              });    
        }
        
        // These lines makes the iPad scroll working (not momentum).
        touchScroll("panel-left");
        touchScroll("panel-center");
        touchScroll("panel-right");
        
        // Display the add site screen if no sites added.
        var current_site = MM.getConfig("current_site");

        if (current_site !== false) {
            var sites = this.collections["sites"];
            sites.fetch();
            
            if (sites.get(current_site.id)) {
                MM.loadSite(current_site.id);
                return;
            }
        }
        $("#add-site").css("display", "block");

    },

    loadSite: function(siteId) {
        var site = MM.collections['sites'].get(siteId);
        
        // For loading a site, we need the list of courses.
        MM.moodleWSCall('moodle_enrol_get_users_courses', {userid: site.get('userid')}, function(courses) {
            
            var plugins = [];
            var coursePlugins = [];

            for (var el in MM.plugins) {
                var plugin = MM.plugins[el];
                if (plugin.settings.type == "general") {
                    plugins.push(plugin.settings);
                } else if (plugin.settings.type == "course") {
                    coursePlugins.push(plugin.settings);
                }
            }

            // Prepare info for loading main menu.
            values = {
                user: {fullname: site.get("fullname"), profileimageurl: site.get("userpictureurl")},
                siteurl: site.get("siteurl"),
                coursePlugins: coursePlugins,
                courses: courses,
                plugins: plugins
            };
            
            // Load the main menu template.
            var output = _.template($("#menu_template").html(), values );
            $("#panel-left").html(output);
            
            $('.submenu:not(:first)').hide();
            $('.submenu').hide();
            $('.toogler').click(function(){
                $(this).next().slideToggle(300);
                return false;
            });
            
            // Store the courses
            _.each(courses, function(course) {
                course.courseid = course.id;
                // For avoid collising between sites.
                course.id = MM.config.current_site.id + "-" +course.id;
                MM.collections["courses"].create(course);
            });
            
            // Hide the Add Site panel.
            $('#add-site').css('display', 'none');
            // Display the main panels.
            $('#main-wrapper').css('display', 'block');
        });
    },
    
    addSite: function(e) {

        e.preventDefault();

        var siteurl =  $.trim($("#url").val());
        var username = $.trim($("#username").val());
        var password = $.trim($("#password").val());

        // Delete the last / if present
        if(siteurl.charAt(siteurl.length-1) == '/'){
            siteurl = siteurl.substring(0,siteurl.length-1);
        }

        var stop = false;
        var msg = "";
        
        if(siteurl.indexOf("http://localhost") == -1 && ! /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(siteurl)){                    
            msg += "Bad URL<br/>";
            stop = true;
        }

        if(!username){                    
            msg += "Missing username<br/>";
            stop = true;
        }
        if(!password){
            msg += MM.lang.s("passwordnotnull");
            stop = true;
        }
        
        if(stop){
            MM.popErrorMessage(msg);
            return;
        }
        
        var loginURL = siteurl + "/login/token.php";

        if (MM.config.test_enabled) {
            loginURL = "test/token.json";
        }

        // Now, we try to get a valid token.
        $.getJSON(loginURL,
            {
                username: username,
                password: password,
                service: MM.config.wsservice                       
            }    
            ,function(json) {
                if(typeof(json.token) != 'undefined'){
                    var mytoken = json.token;

                    MM.collections['settings'].create({name: "current_token",value: mytoken});

                    var preSets = {
                        wstoken: mytoken,
                        siteurl: siteurl
                    }

                    // We have a valid token, try to get the site info.
                    MM.moodleWSCall('moodle_webservice_get_siteinfo', {}, function(d) {
                        d.id = hex_md5(d.siteurl);
                        var site = MM.collections["sites"].create(d);
                        MM.collections['settings'].create({name: "current_site", value: d});

                        MM.loadSite(site.id);

                    }, preSets);
                }
                else{
                    var error = MM.lang.s("invalidaccount");
                    if(typeof(json.error) != 'undefined'){
                        error = json.error;
                    }
                    MM.popErrorMessage(error);
                }
            });
        return false;
    },

    registerPlugin: function(plugin) {
        var pluginName = plugin.settings.name;

        this.plugins[pluginName] = plugin;
        
        for (var el in plugin.routes) {
            var route = plugin.routes[el];
            // Route[0] URL to match, Route[1] id, Route[2] function to call on match.
            this.Router.route(route[0], route[1], this.plugins[pluginName][route[2]]);
        }
        this.loadModels(plugin.storage);
    },

    loadModels: function (elements) {
        
        for (var el in elements) {
            var obj = elements[el];
            
            // This allow plugins to load Backbone properties to models and collections.
            if (typeof obj.bbproperties == "undefined") {
                obj.bbproperties = {};
            }
            
            if (obj.type == "model") {
                this.models[el] =  Backbone.Model.extend(obj.bbproperties);
            }
            else if (obj.type == "collection") {
                obj.bbproperties.model = this.models[obj.model];
                obj.bbproperties.localStorage = new Store(el);
                var col = Backbone.Collection.extend(obj.bbproperties);
                // Now the instance.
                this.collections[el] = new col();
            }
        }     
    },

    loadRoutes: function() {
        var routes = [
            ["settings", "settings", MM.displaySettings],
            ["settings/:section/", "settings", MM.showSettingSection]
        ];
        
        for (var el in routes) {
            var route = routes[el];
            this.Router.route(route[0], route[1], route[2]);
        }
    },

    // A wrapper function for a moodle WebService call.
    moodleWSCall: function(method, data, callBack, preSets){

        if (typeof(preSets) == 'undefined') {
            preSets = {};
        }

        if(typeof(preSets.wstoken) == 'undefined'){
            var mytoken = MM.config.current_token;
            if(!mytoken){
                MM.popErrorMessage('Unexpected error. Please close and open again the application (mytoken)');
                return false;
            }
        }
        else{
            var mytoken = preSets.wstoken;
        }
    
        if(typeof(preSets.siteurl) == 'undefined'){
            var siteurl = MM.config.current_site.siteurl;
            if(!siteurl){
                MM.popErrorMessage('Unexpected error. Please close and open again the application (siteurl)');
                return false;
            }
        }
        else{
            var siteurl = preSets.siteurl;
        }
    
        data.wsfunction = method;
    
        var ajaxURL = siteurl+"/webservice/rest/server.php?wstoken=" + mytoken + "&moodlewsrestformat=json";
        var ajaxData = data;
        
        if (MM.config.test_enabled) {
            ajaxURL = "test/" + method + ".json";
        }
        
        $.ajax({
          type: "POST",
          url: ajaxURL,
          data: ajaxData,
          dataType: 'json',
          success: function(data){
    
            if(typeof(data.debuginfo) != "undefined"){
                MM.popErrorMessage('Unexpected error. Please close and open again the application');
                return;
            }
            if(typeof(data.exception) != "undefined"){
                MM.popErrorMessage('Error. '+data.message);
                return;
            }
    
            MM.log("Data received from WS "+typeof(data));
    
            if(typeof(data) == 'object' && typeof(data.length) != 'undefined'){
                MM.log("Data number of elements "+data.length);
            }
    
            callBack(data);
          }
        });
    },

    displaySettings: function() {
        
        // Settings plugins.
        var plugins = [];
        for (var el in MM.plugins) {
            var plugin = MM.plugins[el];
            if (plugin.settings.type == "setting") {
                plugins.push(plugin.settings);
            }
        }
        
        var html = _.template($("#settings_template").html(), {plugins: plugins});
        MM.panels.show("center", html);
    },
    
    getConfig: function(name) {
        if (typeof MM.config[name] != "undefined") {
            return MM.config[name];
        }
        return false;
    },

    panels: {
        menuStatus: false,
        
        showLoading: function (position) {
            $('#panel-' + position).html('<img src="img/loading.gif">');
        },
        
        show: function (position, content) {
            $('#panel-' + position).html(content);
            
            if (MM.deviceType == "tablet") {
                MM.panels.menuShow(false);
            } else {
                if (position == "center") {
                    $("#panel-left").animate({
                        left: "-100%"
                      }, 300);
                    $("#panel-center").animate({
                        left: 0
                      }, 300);
                    $(".header-wrapper").animate({
                        left: 0
                      }, 300);
                } else if (position == "right") {
                    $("#panel-center").animate({
                        left: "-100%"
                      }, 300);
                    $("#panel-right").animate({
                        left: 0
                      }, 300);
                }
            }
        },

        goBack: function () {
            var hideHeader = false;
                
            if(parseInt($("#panel-center").css('left')) == 0){
                hideHeader = true;
                hidePanel = '#panel-center';
                showPanel = '#panel-left';
            }
            else if(parseInt($("#panel-right").css('left')) == 0){
                hidePanel = '#panel-right';
                showPanel = '#panel-center';
            }
            else {
                return;
            }
            
            $(hidePanel).animate({
                left: "100%"
              }, 300);
            $(showPanel).animate({
                left: 0
              }, 300);
            
            if (hideHeader) {
                $(".header-wrapper").animate({
                    left: "100%"
                  }, 300);
            }
        },        
        
        menuShow: function (show) {
            
            if (typeof show != "undefined") {
                if (show && MM.panels.menuStatus) {
                    return;
                }
                if (!show && !MM.panels.menuStatus) {
                    return;
                }
            }
            
            if (!MM.panels.menuStatus){    
                $("#panel-center").animate({
                    left: "30%", width: "35%", avoidTransforms: true
                  }, 300, function(){
                        MM.panels.menuStatus = true
                    }).css('overflow', 'auto');
                
                $("#panel-right").animate({
                    left: "65%", width:"35%", avoidTransforms: true
                  }, 300).css('overflow', 'auto');
                
                $(".header-wrapper").animate({
                    left: "30%",  width: "70%", avoidTransforms: true
                  }, 300);
                
            } else {
                $("#panel-center").animate({
                    left: "0px",  width: $(document).innerWidth() / 3, avoidTransforms: true
                  }, 300, function(){
                        MM.panels.menuStatus = false;
                    }).css('overflow', 'auto');
                
                $("#panel-right").animate({
                    left: $(document).innerWidth() / 3,  width: ($(document).innerWidth() / 3) * 2, avoidTransforms: true
                  }, 300).css('overflow', 'auto');
                
                $(".header-wrapper").animate({
                    left: 0,  width: $(document).innerWidth(), avoidTransforms: true
                  }, 300);
            }            
        }
    },

    lang: {
        strings: [],
        current: "",
        
        loadLang: function(lang, strings) {
            MM.lang.current = lang;
            MM.lang.strings[lang] = strings;
        },
        
        s: function(id) {
            var translated = '';
            if(typeof(MM.lang.strings[MM.lang.current][id]) !== "undefined"){
                translated = MM.lang.strings[MM.lang.current][id];
            }
            else if(typeof(MM.lang.strings['en']) != "undefined" && typeof(MM.lang.strings['en'][id]) !== "undefined"){
                translated = MM.lang.strings['en'][id];
            }
        
            if(! translated){
                translated = "[[" + id + "]]";
            }
            return translated;
        }
    },

    fixPluginfile: function(url) {
        var token = MM.config.current_token;
        url += "?token=" + token
        url = url.replace("/pluginfile","/webservice/pluginfile");
        return url;
    },

    log: function(text) {
        console.log(text);
        return;    
    },

    popErrorMessage: function(text) {
        this.popMessage(text);
    },

    popMessage: function(text) {
        $.prompt(text);
    }
}
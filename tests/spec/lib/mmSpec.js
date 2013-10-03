describe("MM", function() {

    function resetMM() {
        // Values on the MM object
        config = {};
        plugins = [];
        models = {};
        collections = {};
        deviceType = 'phone';
        clickType = 'click';
        quickClick = 'click';
        deviceReady = false;
        deviceOS = '';
        logData = [];
        inComputer = false;
        touchMoving = false;
        scrollType = '';
        mq = 'only screen and (min-width = 768px) and (-webkit-min-device-pixel-ratio = 1)';

        if (MM.backup !== undefined) {
            // Bolt-ons to the MM object
            MM.util = _.clone(MM.backup.util);
            MM.lang = _.clone(MM.backup.lang);
            MM.mq = _.clone(MM.backup.mq);
            MM.config = _.clone(MM.backup.config);
        } else {
            MM.backup = {};
        }
    }

    beforeEach(function() {
        resetMM();

        var config = {
            'hello' : 'world'
        };
        var lang = JSON.stringify({
            'astring':'some phrase to return'
        });
        MM.init(config);
        MM.lang.base = JSON.parse(lang);
        MM.backup.util = _.clone(MM.util);
        MM.backup.lang = _.clone(MM.lang);
        MM.backup.mq = _.clone(MM.mq);
        MM.backup.config = _.clone(MM.config);
    });

    /**
     * Tests the init function.
     * @covers init
     * @covers setEventType
     * @covers setDeviceType
     * @covers setDeviceOS
     * @covers loadBackboneRouter
     * @covers checkAjax
     * @covers loadCoreModels
     * @covers loadRoutes
     */
    describe("init", function() {
        describe("MM.config has been set", function() {
            it("has the correct config", function() {
                expect(MM.config).toEqual({'hello':'world'});
            });
        });
        describe("sets correct event type", function() {
            // mock MM.util.isTouchDevice to return true
            // test MM.clickType = 'touchend'
            // test MM.quickClick = 'touchstart'
            it("when we have a touch device", function() {
                MM.util.isTouchDevice = spyOn(MM.util, "isTouchDevice").andReturn(true);
                MM.init({});
                expect(MM.util.isTouchDevice).toHaveBeenCalled();
                expect(MM.clickType).toEqual('touchend');
                expect(MM.quickClick).toEqual('touchstart');
            });

            // mock MM.util.isTouchDevice to return false
            // test MM.clickType = 'click'
            // test MM.quickClick = 'click'
            it("when we don't have a touch device", function() {
                spyOn(MM.util, "isTouchDevice").andReturn(false);
                MM.init({});
                expect(MM.util.isTouchDevice).toHaveBeenCalled();
                expect(MM.clickType).toEqual('click');
                expect(MM.quickClick).toEqual('click');
            });

        });

        describe("calls setDeviceType", function() {
            it("Sets the device to a tablet", function() {
                var matchMediaResponse = {
                    matches: true
                };
                MM.mq = {'hello':'world'};
                spyOn(window, "matchMedia").andReturn(matchMediaResponse);
                MM.init({});
                expect(window.matchMedia).toHaveBeenCalledWith({'hello':'world'});
                expect(MM.deviceType).toEqual('tablet');
                expect($("body").hasClass('tablet')).toEqual(true);
            });

            it("Sets the device to a phone", function() {
                var matchMediaResponse = {
                    matches: false
                };
                MM.mq = {'hello':'world'};
                spyOn(window, "matchMedia").andReturn(matchMediaResponse);
                MM.init({});
                expect(window.matchMedia).toHaveBeenCalledWith({'hello':'world'});
                expect(MM.deviceType).toEqual('phone');
                expect($("body").hasClass('phone')).toEqual(true);
            });
        });

        describe("calls setDeviceOS", function() {
            // Mock navigator.userAgent to be the string iPhone
            // test this.deviceOS is ios
            it("sets OS to ios when iPhone in userAgent", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 iphone abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('ios');
            });

            // Mock navigator.userAgent to be the string iPad
            // test this.deviceOS is ios
            it("sets OS to ios when iPad in userAgent", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 ipad abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('ios');
            });

            // Mock navigator.userAgent to be the string Android
            // test this.deviceOS is android
            it("sets OS to android when Android in userAgent", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 android abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('android');
            });

            // Mock navigator.userAgent to be the string foo
            // test this.deviceOS is 'null'
            it("sets OS to null when garbage in userAgent", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 some other user agent abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('null');
            });

            // Mock navigator.userAgent to be the string iPhone Android
            // test this.deviceOS is ios
            it("sets OS to ios when userAgent is contains both iPhone and Android", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 android iphone abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('ios');
            });
        });

        it("calls loadBackboneRouter", function() {
            var myBackboneRouter = function() {
                var obj = {};
                obj.route = function() {};
                obj.name = 'An anonymous router';
                return obj;
            };
            spyOn(Backbone.Router, 'extend').andReturn(myBackboneRouter);
            MM.init({});
            expect(Backbone.Router.extend).toHaveBeenCalled();
            expect(MM.Router.name).toEqual("An anonymous router");
            // Mock Backbone.Router.extend to return a fake object
            // test this.Router is an instance of the fake object
        });

        it("sets ajax defaults", function() {
            spyOn($, 'ajaxSetup').andCallThrough();
            MM.init({});
            expect($.ajaxSetup).toHaveBeenCalled();
        });

        it("loads core models", function() {
            var modelsArray = [
                'setting','site','course','user','cacheEl','syncEl'
            ];
            var collectionsArray = [
                'settings', 'sites', 'courses', 'users', 'cache', 'sync'
            ];
            MM.init({});
            expect(_.keys(MM.models)).toEqual(modelsArray);
            expect(_.keys(MM.collections)).toEqual(collectionsArray);
        });

        it("loads routes", function() {
            // We use our Router for this test.
            var myBackboneRouter = function() {
                var obj = {};
                obj.route = function(a, b, c) {};
                obj.name = 'An anonymous router';
                return obj;
            };

            // We don't want the Router doing anything in the background
            // so use our harmless one.
            spyOn(Backbone.Router, 'extend').andReturn(myBackboneRouter);

            MM.util.helpMeLogin = 'Help Me Login Text';

            MM.settings = {
                'display' : 'Settings display',
                'showSection': 'Settings show Section',
                'showSite':'Settings show site',
                'addSite':'Settings add site',
                'deleteSite':'Settings delete site'
            };

            MM.cache = {
                'purge' : 'Purge Cache Function'
            };

            var MMSyncLangFunction = function() {
                MM.lang.sync(true);
            };

            var MMSyncCSSFunction = function() {
                MM.sync.css(true);
            };

            MM.init({});

            // Overwrite the currently instantiated Router
            MM.Router = new myBackboneRouter();

            spyOn(MM, 'showLog').andReturn('Some logging function');
            spyOn(MM, 'refresh').andReturn('Some refresh function');

            // Set the spy on our new router
            spyOn(MM.Router, 'route').andCallThrough();

            // Recall the function we need to test.
            MM.loadRoutes();

            expect(MM.Router.route).toHaveBeenCalledSequentiallyWith(
                [
                    ['helpmelogin', 'helpmelogin', "Help Me Login Text"],
                    ['settings', 'settings', 'Settings display'],
                    ['refresh', 'refresh', 'Some refresh function'],
                    ['settings/:section/', 'settings_section', 'Settings show Section'],
                    ['settings/sites/:siteid', 'settings_sites_show_site', 'Settings show site'],
                    ['settings/sites/add', 'settings_sites_add_site', 'Settings add site'],
                    ['settings/sites/delete/:siteid', 'settings_sites_delete_site', 'Settings delete site'],
                    ['settings/general/purgecaches', 'settings_general_purgecaches', 'Purge Cache Function'],
                    ['settings/sync/lang', 'settings_sync_lang', MMSyncLangFunction],
                    ['settings/sync/css', 'settings_sync_css', MMSyncCSSFunction],
                    ['settings/development/log/:filter', 'settings_sync_css', 'Some logging function']
                ]
            );
            expect(MM.Router.route.callCount).toBe(11);
        });
    });

    /**
     * Tests deviceConnected
     * @covers deviceConnected
     */
    describe("deviceConnected", function() {
        it("reports state correctly when connected", function() {
            var myTestNetwork = {
                connection: {
                    type: 'testnetwork type'
                }
            };

            window.Connection = {
                'NONE':'no connection',
                'UNKNOWN':'unknown connection'
            };

            // Mock network states and test connection is reported correctly
            spyOn(MM, 'deviceConnected').andCallThrough();
            spyOn(MM, '_getNetwork').andCallFake(function() {
                return myTestNetwork;
            });
            spyOn(MM, 'getConfig').andCallFake(function() {
                return;
            });
            spyOn(MM, 'log').andCallThrough();
            MM.init({});
            var result = MM.deviceConnected();
            expect(MM.deviceConnected).toHaveBeenCalled();
            expect(result).toEqual(true);
            expect(MM.log).toHaveBeenCalledSequentiallyWith(
                [
                    ['Initializating app'],
                    ['Internet connection checked ' + true]
                ]
            );
        });

        it("reports state correctly when disconnected", function() {
            // Mock network states and test connection is reported correctly
            spyOn(MM, 'deviceConnected').andCallThrough();
            spyOn(MM, '_getNetwork').andCallFake(function() {
                return;
            });
            spyOn(MM, 'getConfig').andCallFake(function() {
                return true;
            });
            spyOn(MM, 'log').andCallThrough();
            spyOn($.fn, 'css').andReturn("block");
            MM.init({});
            var result = MM.deviceConnected();
            expect(MM.deviceConnected).toHaveBeenCalled();
            expect(result).toEqual(false);
            expect(MM.log).toHaveBeenCalledSequentiallyWith(
                [
                    ['Initializating app'],
                    ['Returning not connected (forced by settings)']
                ]
            );
        });
    });

    /**
     * Tests _defaultErrorFunction
     * @covers _defaultErrorFunction
     */
    describe("has a default error function", function() {
        beforeEach(function(){
            MM.lang = {
                s:function(field){
                    if (field == 'cannotconnect') {
                        return "Cannot Connect";
                    } else if (field == 'invalidscheme') {
                        return "Invalid Scheme";
                    } else {
                        return "Invalid Field";
                    }
                }
            };
        });
        it("when we have a 404 error", function() {
            spyOn(MM.lang, 's').andCallThrough();
            spyOn(MM, 'popErrorMessage').andReturn();

            var xhr = {
                status:404
            };
            MM._defaultErrorFunction(xhr);

            expect(MM.lang.s).toHaveBeenCalledSequentiallyWith([
                ['cannotconnect'],
                ['invalidscheme']
            ]);
            expect(MM.lang.s.callCount).toEqual(2);
            expect(MM.popErrorMessage).toHaveBeenCalledWith('Invalid Scheme');
        });
        it("when we have a different error", function() {
            spyOn(MM.lang, 's').andCallThrough();
            spyOn(MM, 'popErrorMessage').andReturn();

            var xhr = {
                status:123
            };
            MM._defaultErrorFunction(xhr);

            expect(MM.lang.s).toHaveBeenCalledWith('cannotconnect');
            expect(MM.lang.s.callCount).toEqual(1);
            expect(MM.popErrorMessage).toHaveBeenCalledWith('Cannot Connect');
        });
    });

    /**
     * Tests loadLayout
     * @covers loadLayout
     */
    describe("loadLayout", function() {
        beforeEach(function() {
            // Create required page elements
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                    $("<div>").attr('id', 'add-site_template')
                ).append(
                    $("<div>").attr('id', 'add-site')
                ).append(
                   $("<input>").attr({'id':'url','type':'text'})
                ).append(
                    $("<input>").attr({'id':'username','type':'text'})
                ).append(
                    $("<div>").attr('id', 'panel-left')
                ).append(
                    $("<div>").attr('id', 'panel-right')
                ).append(
                    $("<div>").attr('id', 'panel-center')
                )
            );
        });
        afterEach(function() {
            $("#testElements").remove();
        });
        it("sets up overflow scrolling as tablet with early return", function() {
            // Set up bolt-ons for MM object
            MM.config = {
                presets: {
                    url:'hello world',
                    username:'defaultUsername'
                }
            };
            MM.tpl = {
                render:function(){}
            };
            MM.db = {
                get:function(){}
            };
            MM.util = {
                isTouchDevice:function(){},
                overflowScrollingSupported:function(){}
            }

            matchMediaResponse = {
                addListener: function() {},
                matches:true
            };

            spyOn(MM, 'log').andReturn(false);
            spyOn(MM.tpl, 'render').andReturn($("<form>"));
            spyOn(Backbone.history, 'start').andReturn(true);
            spyOn(window, 'matchMedia').andReturn(matchMediaResponse);
            spyOn(matchMediaResponse, 'addListener').andCallThrough();
            spyOn($.fn, 'innerHeight').andReturn(123);
            spyOn(MM.util, 'isTouchDevice').andReturn(true);
            spyOn(MM.util, 'overflowScrollingSupported').andReturn(true);
            spyOn(MM, 'setUpOverflowScrolling').andReturn(true);
            spyOn(MM, 'getConfig').andReturn({id:1});
            spyOn(MM.db, 'get').andReturn(true);
            spyOn(MM, 'loadSite').andReturn(true);
            spyOn(MM, 'loadExtraJs').andReturn(true);
            spyOn(MM, 'setUpTabletModeLayout').andCallThrough();

            MM.loadLayout();
            expect(MM.tpl.render).toHaveBeenCalledWith("");
            expect($("#add-site").html()).toEqual("<form></form>");
            expect($("#url").val()).toEqual("hello world");
            expect($("#username").val()).toEqual("defaultUsername");
            expect(matchMediaResponse.addListener).toHaveBeenCalled();
            expect(MM.setUpTabletModeLayout).toHaveBeenCalled();
            expect($("#add-site").css('height')).toEqual('123px');
            expect($("#panel-left").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-right").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-center").hasClass('overflow-scroll')).toBeTruthy();
            expect(MM.setUpOverflowScrolling).toHaveBeenCalled();
            expect(MM.getConfig).toHaveBeenCalledWith('current_site');
            expect(MM.db.get).toHaveBeenCalledWith('sites', 1);
            expect(MM.loadSite).toHaveBeenCalledWith(1);
            expect(MM.loadExtraJs).toHaveBeenCalled();
            expect(MM.loadExtraJs.callCount).toEqual(1);
        });

        it("sets up overflow scrolling as tablet without early return", function() {
            // Set up bolt-ons for MM object
            MM.config = {
                presets: {
                    url:'hello world',
                    username:'defaultUsername'
                }
            };
            MM.tpl = {
                render:function(){}
            };
            MM.db = {
                get:function(){}
            };
            MM.util = {
                isTouchDevice:function(){},
                overflowScrollingSupported:function(){}
            }

            matchMediaResponse = {
                addListener: function() {},
                matches:true
            };

            spyOn(MM, 'log').andReturn(false);
            spyOn(MM.tpl, 'render').andReturn($("<form>"));
            spyOn(Backbone.history, 'start').andReturn(true);
            spyOn(window, 'matchMedia').andReturn(matchMediaResponse);
            spyOn(matchMediaResponse, 'addListener').andCallThrough();
            spyOn($.fn, 'innerHeight').andReturn(123);
            spyOn(MM.util, 'isTouchDevice').andReturn(true);
            spyOn(MM.util, 'overflowScrollingSupported').andReturn(true);
            spyOn(MM, 'setUpOverflowScrolling').andReturn(true);
            spyOn(MM, 'getConfig').andReturn({});
            spyOn(MM, 'loadExtraJs').andReturn(true);
            spyOn(MM.db, 'get').andReturn(true);
            spyOn(MM, 'setUpTabletModeLayout').andCallThrough();

            MM.loadLayout();
            expect(MM.tpl.render).toHaveBeenCalledWith("");
            expect($("#add-site").html()).toEqual("<form></form>");
            expect($("#url").val()).toEqual("hello world");
            expect($("#username").val()).toEqual("defaultUsername");
            expect(matchMediaResponse.addListener).toHaveBeenCalled();
            expect(MM.setUpTabletModeLayout).toHaveBeenCalled();
            expect($("#add-site").css('height')).toEqual('123px');
            expect($("#panel-left").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-right").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-center").hasClass('overflow-scroll')).toBeTruthy();
            expect(MM.setUpOverflowScrolling).toHaveBeenCalled();
            expect(MM.getConfig).toHaveBeenCalledWith('current_site');
            expect(MM.db.get).not.toHaveBeenCalled();
            expect(MM.loadSite).not.toHaveBeenCalled;
            expect(MM.loadExtraJs).toHaveBeenCalled();
            expect(MM.loadExtraJs.callCount).toEqual(1);
            expect($('#add-site').css('display')).toEqual('block');
        });

        it("sets up overflow scrolling as phone", function() {
            // Set up bolt-ons for MM object
            MM.config = {
                presets: {
                    url:'hello world',
                    username:'defaultUsername'
                }
            };
            MM.tpl = {
                render:function(){}
            };
            MM.db = {
                get:function(){}
            };
            MM.util = {
                isTouchDevice:function(){},
                overflowScrollingSupported:function(){}
            }

            matchMediaResponse = {
                addListener: function() {},
                matches:false
            };

            spyOn(MM, 'log').andReturn(false);
            spyOn(MM.tpl, 'render').andReturn($("<form>"));
            spyOn(Backbone.history, 'start').andReturn(true);
            spyOn(window, 'matchMedia').andReturn(matchMediaResponse);
            spyOn(matchMediaResponse, 'addListener').andCallThrough();
            spyOn($.fn, 'innerHeight').andReturn(123);
            spyOn(MM.util, 'isTouchDevice').andReturn(true);
            spyOn(MM.util, 'overflowScrollingSupported').andReturn(true);
            spyOn(MM, 'setUpOverflowScrolling').andReturn(true);
            spyOn(MM, 'getConfig').andReturn({});
            spyOn(MM, 'loadExtraJs').andReturn(true);
            spyOn(MM.db, 'get').andReturn(true);
            spyOn(MM, 'setUpTabletModeLayout').andReturn(true);
            spyOn(MM, 'setUpPhoneModeLayout').andReturn(true);

            MM.loadLayout();
            expect(MM.tpl.render).toHaveBeenCalledWith("");
            expect($("#add-site").html()).toEqual("<form></form>");
            expect($("#url").val()).toEqual("hello world");
            expect($("#username").val()).toEqual("defaultUsername");
            expect(matchMediaResponse.addListener).toHaveBeenCalled();
            expect(MM.setUpTabletModeLayout).not.toHaveBeenCalled();
            expect(MM.setUpPhoneModeLayout).toHaveBeenCalled();
            expect($("#add-site").css('height')).toEqual('123px');
            expect($("#panel-left").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-right").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-center").hasClass('overflow-scroll')).toBeTruthy();
            expect(MM.setUpOverflowScrolling).toHaveBeenCalled();
            expect(MM.getConfig).toHaveBeenCalledWith('current_site');
            expect(MM.db.get).not.toHaveBeenCalled();
            expect(MM.loadSite).not.toHaveBeenCalled;
            expect(MM.loadExtraJs).toHaveBeenCalled();
            expect(MM.loadExtraJs.callCount).toEqual(1);
            expect($('#add-site').css('display')).toEqual('block');
        });

        it("sets up native scrolling", function() {
            // Set up bolt-ons for MM object
            MM.config = {
                presets: {
                    url:'hello world',
                    username:'defaultUsername'
                }
            };
            MM.tpl = {
                render:function(){}
            };
            MM.db = {
                get:function(){}
            };
            MM.util = {
                isTouchDevice:function(){},
                overflowScrollingSupported:function(){}
            };
            MM.deviceType = 'phone';

            matchMediaResponse = {
                addListener: function() {},
                matches:false
            };

            spyOn(MM, 'log').andReturn(false);
            spyOn(MM.tpl, 'render').andReturn($("<form>"));
            spyOn(Backbone.history, 'start').andReturn(true);
            spyOn(window, 'matchMedia').andReturn(matchMediaResponse);
            spyOn(matchMediaResponse, 'addListener').andCallThrough();
            spyOn($.fn, 'innerHeight').andReturn(123);
            spyOn(MM.util, 'isTouchDevice').andReturn(true);
            spyOn(MM.util, 'overflowScrollingSupported').andReturn(false);
            spyOn(MM, 'setUpOverflowScrolling').andReturn(false);
            spyOn(MM, 'setUpNativeScrolling').andReturn(true);
            spyOn(MM, 'getConfig').andReturn({id:1});
            spyOn(MM.db, 'get').andReturn(true);
            spyOn(MM, 'loadSite').andReturn(true);
            spyOn(MM, 'loadExtraJs').andReturn(true);

            MM.loadLayout();
            expect(MM.tpl.render).toHaveBeenCalledWith("");
            expect($("#add-site").html()).toEqual("<form></form>");
            expect($("#url").val()).toEqual("hello world");
            expect($("#username").val()).toEqual("defaultUsername");
            expect(matchMediaResponse.addListener).toHaveBeenCalled();
            expect($("#add-site").css('height')).toEqual('123px');
            expect($("#panel-left").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-right").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-center").hasClass('overflow-scroll')).toBeTruthy();
            expect(MM.setUpOverflowScrolling).not.toHaveBeenCalled();
            expect(MM.setUpNativeScrolling).toHaveBeenCalled();
            expect(MM.getConfig).toHaveBeenCalledWith('current_site');
            expect(MM.db.get).toHaveBeenCalledWith('sites', 1);
            expect(MM.loadSite).toHaveBeenCalledWith(1);
            expect(MM.loadExtraJs).toHaveBeenCalled();
            expect(MM.loadExtraJs.callCount).toEqual(1);
        });

        it("sets up javascript scrolling", function() {
            // Set up bolt-ons for MM object
            MM.config = {
                presets: {
                    url:'hello world',
                    username:'defaultUsername'
                }
            };
            MM.tpl = {
                render:function(){}
            };
            MM.db = {
                get:function(){}
            };
            MM.util = {
                isTouchDevice:function(){},
                overflowScrollingSupported:function(){}
            };
            MM.deviceType = 'computer'; // can be anything except 'phone'

            matchMediaResponse = {
                addListener: function() {},
                matches:false
            };

            spyOn(MM, 'log').andReturn(false);
            spyOn(MM.tpl, 'render').andReturn($("<form>"));
            spyOn(Backbone.history, 'start').andReturn(true);
            spyOn(window, 'matchMedia').andReturn(matchMediaResponse);
            spyOn(matchMediaResponse, 'addListener').andCallThrough();
            spyOn($.fn, 'innerHeight').andReturn(123);
            spyOn(MM.util, 'isTouchDevice').andReturn(true);
            spyOn(MM.util, 'overflowScrollingSupported').andReturn(false);
            spyOn(MM, 'setUpOverflowScrolling').andReturn(false);
            spyOn(MM, 'setUpNativeScrolling').andReturn(false);
            spyOn(MM, 'setUpJavascriptScrolling').andReturn(true);
            spyOn(MM, 'getConfig').andReturn({id:1});
            spyOn(MM.db, 'get').andReturn(true);
            spyOn(MM, 'loadSite').andReturn(true);
            spyOn(MM, 'loadExtraJs').andReturn(true);

            MM.loadLayout();
            expect(MM.tpl.render).toHaveBeenCalledWith("");
            expect($("#add-site").html()).toEqual("<form></form>");
            expect($("#url").val()).toEqual("hello world");
            expect($("#username").val()).toEqual("defaultUsername");
            expect(matchMediaResponse.addListener).toHaveBeenCalled();
            expect($("#add-site").css('height')).toEqual('123px');
            expect($("#panel-left").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-right").hasClass('overflow-scroll')).toBeTruthy();
            expect($("#panel-center").hasClass('overflow-scroll')).toBeTruthy();
            expect(MM.setUpOverflowScrolling).not.toHaveBeenCalled();
            expect(MM.setUpNativeScrolling).not.toHaveBeenCalled();
            expect(MM.setUpJavascriptScrolling).toHaveBeenCalled();
            expect(MM.getConfig).toHaveBeenCalledWith('current_site');
            expect(MM.db.get).toHaveBeenCalledWith('sites', 1);
            expect(MM.loadSite).toHaveBeenCalledWith(1);
            expect(MM.loadExtraJs).toHaveBeenCalled();
            expect(MM.loadExtraJs.callCount).toEqual(1);
        });
    });

    /**
     * Tests loadSite
     * @covers loadSite
     */
    it("can load a site given an id", function() {
        var site = {
            get:function(userid) {
                return 999;
            }
        };

        MM.db = {
            get:function(name, value) {
                return site;
            }
        };

        spyOn(MM, 'log').andReturn();
        spyOn(MM.db, 'get').andCallThrough();
        spyOn(MM.sync, 'init').andReturn();
        spyOn(MM, 'setUpConfig').andReturn();
        spyOn(MM, 'setUpLanguages').andReturn();
        spyOn(MM, 'moodleWSCall').andReturn();
        spyOn(MM, 'loadCourses').andReturn();
        spyOn(MM, 'showAddSitePanel').andReturn();

        MM.loadSite(1);
        expect(MM.log).toHaveBeenCalledWith('Loading site');
        expect(MM.db.get).toHaveBeenCalledWith('sites', 1);
        expect(MM.sync.init).toHaveBeenCalled();
        expect(MM.setUpConfig).toHaveBeenCalled();
        expect(MM.setUpLanguages).toHaveBeenCalled();
        expect(MM.moodleWSCall).toHaveBeenCalledWith(
            'moodle_enrol_get_users_courses',
            {userid:999},
            MM.loadCourses,
            {omitExpires:true},
            MM.showAddSitePanel
        );
    });

    /**
     * Tests setUpConfig
     * @covers setUpConfig
     */
    it("can set up config", function() {
        MM.site = new Backbone.Model({
            id:1,
            token:'mytoken'
        });
        MM.config = {
            current_site: {
                id: 2
            }
        };
        spyOn(MM, 'setConfig');
        var MMSiteJSON = {id:1, token:'mytoken'};
        spyOn(MM.site, 'toJSON').andReturn(MMSiteJSON);
        MM.setUpConfig();
        expect(MM.setConfig).toHaveBeenCalledSequentiallyWith([
            ['current_site', MMSiteJSON],
            ['current_token', 'mytoken']
        ]);
        expect(MM.setConfig.callCount).toBe(2);
    });

    /**
     * Tests setUpLanguages
     * @covers setUpLanguages
     */
    it("can set up languages", function() {
        MM.lang = {
            setup: function(){},
            sync:function(){}
        };
        MM.config = {
            plugins:{
                'plugin_one':'plugin_one_idx',
                'plugin_two':'plugin_two_idx',
                'plugin_three':'plugin_three_idx',
            }
        };
        MM.plugins = {
            'plugin_one_idx':{
                settings:{
                    lang:{
                        component:'core'
                    },
                    name:'Plugin One'
                }
            },
            'plugin_two_idx':{
                settings:{
                    lang:{
                        component:'not-core'
                    },
                    name:'Plugin Two'
                }
            }
        };
        spyOn(MM.lang, 'setup').andReturn();
        spyOn(MM.lang, 'sync').andReturn();
        MM.setUpLanguages();
        expect(MM.lang.setup).toHaveBeenCalledWith('Plugin Two');
        expect(MM.lang.sync).toHaveBeenCalled();
    });

    /**
     * Tests showAddSitePanel
     * @covers showAddSitePanel
     */
    it("can show a site panel", function() {
        // DOM elements required
        $(document.body).append(
            $("<div>").attr('id', 'testElements').append(
                $("<div>").html(
                    "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                )
            ).append(
               $("<div>").attr({'id':'add-site'})
            )
        );

        spyOn($("#add-site"), 'css');
        MM.showAddSitePanel();
        expect($("#add-site").css('display')).toEqual('block');
        $("#testElements").remove();
    });

    /**
     * Tests loadCachedRemoteCSS
     * @covers loadCachedRemoteCSS
     */
    describe("can load cached remote CSS", function(){
        beforeEach(function() {
            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<div>").attr({'id':'mobilecssurl'})
                )
            );

        });
        afterEach(function() {
            $("#testElements").remove();
        });
        it("and displays when we have remote CSS", function(){
            MM.cache = {
                getElement:function(){}
            };
            MM.deviceOS = 'ios';
            spyOn(MM, 'setConfig').andReturn();
            spyOn(MM.cache, 'getElement').andReturn("hello world");
            spyOn(MM.sync, 'css');
            MM.loadCachedRemoteCSS();
            expect(MM.setConfig).toHaveBeenCalledWith('dev_css3transitions', true);
            expect(MM.cache.getElement).toHaveBeenCalledWith('css', true);
            expect($("#mobilecssurl").html()).toEqual("hello world");
            expect(MM.sync.css).toHaveBeenCalled();
        });
        it("and does not display when we don't have remote CSS", function() {
            MM.cache = {
                getElement:function(){}
            };
            MM.deviceOS = 'ios';
            spyOn(MM, 'setConfig').andReturn();
            spyOn(MM.cache, 'getElement').andReturn(false);
            spyOn(MM.sync, 'css');
            MM.loadCachedRemoteCSS();
            expect(MM.setConfig).toHaveBeenCalledWith('dev_css3transitions', true);
            expect(MM.cache.getElement).toHaveBeenCalledWith('css', true);
            expect($("#mobilecssurl").html()).toEqual("");
            expect(MM.sync.css).toHaveBeenCalled();
        });
    });

    /**
     * Tests addSite
     * @covers addSite
     */
    describe("Can add a site", function() {
        it("can add a site when url and password is missing", function() {
            var url = "";
            var username = "       LeadingSpacesUsername";
            var password = "";

            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<input>").attr({'id':'url','type':'text'}).val(url)
                ).append(
                    $("<input>").attr({'id':'username','type':'text'}).val(username)
                ).append(
                    $("<input>").attr({'id':'password','type':'text'}).val(password)
                )
            );

            MM.config = {
                demo_sites:[
                    // Needs 5, 3 & 4 need the same site.key === username
                    {key:'AUserName', url:'AUrl', username:'AUsername', password:'APassword'},
                    {key:'BUserName', url:'BUrl', username:'BUsername', password:'BPassword'},
                    {key:'LeadingSpacesUsername', url:'CUrl', username:'CUsername', password:'CPassword'},
                    {key:'LeadingSpacesUsername', url:'DUrl', username:'DUsername', password:'DPassword'},
                    {key:'ShouldNotSeeThis', url:'EUrl', username:'EUsername', password:'EPassword'}
                ]
            }

            spyOn(MM, 'saveSite').andReturn();
            spyOn(MM, 'validateURL').andReturn(true);

            var e = {
                preventDefault:function(){}
            };
            MM.addSite(e);
            expect(MM.validateURL).toHaveBeenCalledWith("https://CUrl");
            expect(MM.saveSite).toHaveBeenCalledWith("CUsername", "CPassword", 'https://CUrl');
            $("#testElements").remove();
        });

        it("can add a site when the data is sensible", function() {
            var url = "Some.URL/Trailing/Spaces#abcde?foo=bar        ";
            var username = "       LeadingSpacesUsername";
            var password = "PasswordNoSpaces";

            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<input>").attr({'id':'url','type':'text'}).val(url)
                ).append(
                    $("<input>").attr({'id':'username','type':'text'}).val(username)
                ).append(
                    $("<input>").attr({'id':'password','type':'text'}).val(password)
                )
            );

            MM.config = {
                demo_sites:[
                    // Needs 5, 3 & 4 need the same site.key === username
                    {key:'AUserName', url:'AUrl', username:'AUsername', password:'APassword'},
                    {key:'BUserName', url:'BUrl', username:'BUsername', password:'BPassword'},
                    {key:'LeadingSpacesUsername', url:'CUrl', username:'CUsername', password:'CPassword'},
                    {key:'LeadingSpacesUsername', url:'DUrl', username:'DUsername', password:'DPassword'},
                    {key:'ShouldNotSeeThis', url:'EUrl', username:'EUsername', password:'EPassword'}
                ]
            }

            spyOn(MM, 'saveSite').andReturn();
            spyOn(MM, 'validateURL').andReturn(true);

            var e = {
                preventDefault:function(){}
            };
            MM.addSite(e);
            expect(MM.validateURL).toHaveBeenCalledWith('https://' + $.trim(url.toLowerCase()));
            expect(MM.saveSite).toHaveBeenCalledWith("LeadingSpacesUsername", "PasswordNoSpaces", 'https://' + $.trim(url.toLowerCase()));
            $("#testElements").remove();
        });

        it("continues if the site is localhost", function() {
            var url = "http://localhost/Trailing/Spaces#abcde?foo=bar        ";
            var username = "       LeadingSpacesUsername";
            var password = "PasswordNoSpaces";

            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<input>").attr({'id':'url','type':'text'}).val(url)
                ).append(
                    $("<input>").attr({'id':'username','type':'text'}).val(username)
                ).append(
                    $("<input>").attr({'id':'password','type':'text'}).val(password)
                )
            );

            MM.config = {
                demo_sites:[
                    // Needs 5, 3 & 4 need the same site.key === username
                    {key:'AUserName', url:'AUrl', username:'AUsername', password:'APassword'},
                    {key:'BUserName', url:'BUrl', username:'BUsername', password:'BPassword'},
                    {key:'LeadingSpacesUsername', url:'CUrl', username:'CUsername', password:'CPassword'},
                    {key:'LeadingSpacesUsername', url:'DUrl', username:'DUsername', password:'DPassword'},
                    {key:'ShouldNotSeeThis', url:'EUrl', username:'EUsername', password:'EPassword'}
                ]
            }

            spyOn(MM, 'saveSite').andReturn();
            spyOn(MM, 'validateURL').andReturn(true);

            var e = {
                preventDefault:function(){}
            };
            MM.addSite(e);
            expect(MM.validateURL).not.toHaveBeenCalled(); // lazy conditional statement
            expect(MM.saveSite).toHaveBeenCalledWith("LeadingSpacesUsername", "PasswordNoSpaces", $.trim(url.toLowerCase()));
            $("#testElements").remove();
        });

        it("errors if the site isn't localhost and url doesn't validate", function() {
            var url = "Some.URL/Trailing/Spaces#abcde?foo=bar        ";
            var username = "       LeadingSpacesUsername";
            var password = "PasswordNoSpaces";

            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<input>").attr({'id':'url','type':'text'}).val(url)
                ).append(
                    $("<input>").attr({'id':'username','type':'text'}).val(username)
                ).append(
                    $("<input>").attr({'id':'password','type':'text'}).val(password)
                )
            );

            MM.config = {
                demo_sites:[
                    // Needs 5, 3 & 4 need the same site.key === username
                    {key:'AUserName', url:'AUrl', username:'AUsername', password:'APassword'},
                    {key:'BUserName', url:'BUrl', username:'BUsername', password:'BPassword'},
                    {key:'LeadingSpacesUsername', url:'CUrl', username:'CUsername', password:'CPassword'},
                    {key:'LeadingSpacesUsername', url:'DUrl', username:'DUsername', password:'DPassword'},
                    {key:'ShouldNotSeeThis', url:'EUrl', username:'EUsername', password:'EPassword'}
                ]
            };

            MM.lang = {
                s:function(field) {
                    if (field == 'siteurlrequired') {
                        return "site needed";
                    }
                    if (field == 'usernamerequired') {
                        return "username needed";
                    }
                    if (field == 'passwordrequired') {
                        return "password needed";
                    }
                }
            };

            spyOn(MM, 'saveSite').andReturn();
            spyOn(MM, 'validateURL').andReturn(false);
            spyOn(MM, 'popErrorMessage').andReturn();

            var e = {
                preventDefault:function(){}
            };
            MM.addSite(e);
            expect(MM.validateURL).toHaveBeenCalledWith('https://' + $.trim(url.toLowerCase()));
            expect(MM.saveSite).not.toHaveBeenCalled();
            expect(MM.popErrorMessage).toHaveBeenCalledWith("site needed<br/>");
            $("#testElements").remove();
        });

        it("errors when username isn't provided", function() {
            var url = "Some.URL/Trailing/Spaces#abcde?foo=bar        ";
            var username = "       ";
            var password = "PasswordNoSpaces";

            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<input>").attr({'id':'url','type':'text'}).val(url)
                ).append(
                    $("<input>").attr({'id':'username','type':'text'}).val(username)
                ).append(
                    $("<input>").attr({'id':'password','type':'text'}).val(password)
                )
            );

            MM.config = {
                demo_sites:[
                    // Needs 5, 3 & 4 need the same site.key === username
                    {key:'AUserName', url:'AUrl', username:'AUsername', password:'APassword'},
                    {key:'BUserName', url:'BUrl', username:'BUsername', password:'BPassword'},
                    {key:'LeadingSpacesUsername', url:'CUrl', username:'CUsername', password:'CPassword'},
                    {key:'LeadingSpacesUsername', url:'DUrl', username:'DUsername', password:'DPassword'},
                    {key:'ShouldNotSeeThis', url:'EUrl', username:'EUsername', password:'EPassword'}
                ]
            };

            MM.lang = {
                s:function(field) {
                    if (field == 'siteurlrequired') {
                        return "site needed";
                    }
                    if (field == 'usernamerequired') {
                        return "username needed";
                    }
                    if (field == 'passwordrequired') {
                        return "password needed";
                    }
                }
            };

            spyOn(MM, 'saveSite').andReturn();
            spyOn(MM, 'validateURL').andReturn(true);
            spyOn(MM, 'popErrorMessage').andReturn();

            var e = {
                preventDefault:function(){}
            };
            MM.addSite(e);
            expect(MM.validateURL).toHaveBeenCalledWith('https://' + $.trim(url.toLowerCase()));
            expect(MM.saveSite).not.toHaveBeenCalled();
            expect(MM.popErrorMessage).toHaveBeenCalledWith("username needed<br/>");
            $("#testElements").remove();
        });

        it("errors when password isn't provided", function() {
            var url = "Some.URL/Trailing/Spaces#abcde?foo=bar        ";
            var username = "       LeadingSpacesUsername";
            var password = "";

            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<input>").attr({'id':'url','type':'text'}).val(url)
                ).append(
                    $("<input>").attr({'id':'username','type':'text'}).val(username)
                ).append(
                    $("<input>").attr({'id':'password','type':'text'}).val(password)
                )
            );

            MM.config = {
                demo_sites:[
                    // Needs 5, 3 & 4 need the same site.key === username
                    {key:'AUserName', url:'AUrl', username:'AUsername', password:'APassword'},
                    {key:'BUserName', url:'BUrl', username:'BUsername', password:'BPassword'},
                    {key:'LeadingSpacesUsername', url:'CUrl', username:'CUsername', password:'CPassword'},
                    {key:'LeadingSpacesUsername', url:'DUrl', username:'DUsername', password:'DPassword'},
                    {key:'ShouldNotSeeThis', url:'EUrl', username:'EUsername', password:'EPassword'}
                ]
            };

            MM.lang = {
                s:function(field) {
                    if (field == 'siteurlrequired') {
                        return "site needed";
                    }
                    if (field == 'usernamerequired') {
                        return "username needed";
                    }
                    if (field == 'passwordrequired') {
                        return "password needed";
                    }
                }
            };

            spyOn(MM, 'saveSite').andReturn();
            spyOn(MM, 'validateURL').andReturn(true);
            spyOn(MM, 'popErrorMessage').andReturn();

            var e = {
                preventDefault:function(){}
            };
            MM.addSite(e);
            expect(MM.validateURL).toHaveBeenCalledWith('https://' + $.trim(url.toLowerCase()));
            expect(MM.saveSite).not.toHaveBeenCalled();
            expect(MM.popErrorMessage).toHaveBeenCalledWith("password needed");
            $("#testElements").remove();
        });

        it("errors completely when site, username and password wrong", function() {
            var url = "Some.URL/Trailing/Spaces#abcde?foo=bar        ";
            var username = "       ";
            var password = "";

            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<input>").attr({'id':'url','type':'text'}).val(url)
                ).append(
                    $("<input>").attr({'id':'username','type':'text'}).val(username)
                ).append(
                    $("<input>").attr({'id':'password','type':'text'}).val(password)
                )
            );

            MM.config = {
                demo_sites:[
                    // Needs 5, 3 & 4 need the same site.key === username
                    {key:'AUserName', url:'AUrl', username:'AUsername', password:'APassword'},
                    {key:'BUserName', url:'BUrl', username:'BUsername', password:'BPassword'},
                    {key:'LeadingSpacesUsername', url:'CUrl', username:'CUsername', password:'CPassword'},
                    {key:'LeadingSpacesUsername', url:'DUrl', username:'DUsername', password:'DPassword'},
                    {key:'ShouldNotSeeThis', url:'EUrl', username:'EUsername', password:'EPassword'}
                ]
            };

            MM.lang = {
                s:function(field) {
                    if (field == 'siteurlrequired') {
                        return "site needed";
                    }
                    if (field == 'usernamerequired') {
                        return "username needed";
                    }
                    if (field == 'passwordrequired') {
                        return "password needed";
                    }
                }
            };

            spyOn(MM, 'saveSite').andReturn();
            spyOn(MM, 'validateURL').andReturn(false);
            spyOn(MM, 'popErrorMessage').andReturn();

            var e = {
                preventDefault:function(){}
            };
            MM.addSite(e);
            expect(MM.validateURL).toHaveBeenCalledWith('https://' + $.trim(url.toLowerCase()));
            expect(MM.saveSite).not.toHaveBeenCalled();
            expect(MM.popErrorMessage).toHaveBeenCalledWith("site needed<br/>username needed<br/>password needed");
            $("#testElements").remove();
        });
    });

    /**
     * Tests saveSite
     * @covers saveSite
     */
    it("can save sites", function() {
        MM.lang = {
            s:function(field) {}
        };

        MM.config = {
            wsservice:"SomeService"
        };

        MM.loginSuccessHandler = function() {};
        MM.loginErrorHandler = function() {};

        spyOn(MM, 'showModalLoading').andReturn();
        spyOn(MM.lang, 's').andReturn("Something");
        spyOn($, 'ajax').andReturn();

        var result = MM.saveSite("AUsername", "APassword", "SomeSiteURL");

        expect(result).toEqual(false);
        expect(MM.showModalLoading).toHaveBeenCalledWith("Something");
        expect(MM.lang.s).toHaveBeenCalledWith("authenticating");
        expect(MM.siteurl).toEqual("SomeSiteURL");
    });

    /**
     * Tests registerPlugin
     * @covers registerPlugin
     */
    it("can register a plugin", function() {
        var testPlugin = {
            settings: {
                name:'Test Plugin',
                lang:{
                    component:'non-core',
                    strings:'{"a":"one","b":"two","c":"three"}'
                }
            },
            routes:{
                'route_one':['route_one_part_one', 'route_one_part_two', 'route_one_part_three'],
                'route_two':['route_two_part_one', 'route_two_part_two', 'route_two_part_three']
            },
            sync:'someSyncFunction',
            route_two_part_three:'hello_world',
            route_one_part_three:'world_hello',
            storage:'someStorage'
        };

        var testRouter = {
            route:function(){}
        };

        MM.plugins = {};
        MM.Router = testRouter;
        MM.lang = {
            loadPluginLang:function(){}
        };
        MM.sync = {
            registerHook:function(){}
        };

        spyOn(MM.Router, 'route').andReturn();
        spyOn(MM, 'loadModels').andReturn();
        spyOn(MM.lang, 'loadPluginLang').andReturn();
        spyOn(MM.sync, 'registerHook').andReturn();

        MM.registerPlugin(testPlugin);

        expect(MM.Router.route).toHaveBeenCalledSequentiallyWith([
            ['route_one_part_one', 'route_one_part_two', 'world_hello'],
            ['route_two_part_one', 'route_two_part_two', 'hello_world']
        ]);
        expect(MM.loadModels).toHaveBeenCalledWith('someStorage');
        expect(MM.lang.loadPluginLang).toHaveBeenCalledWith('Test Plugin', {a:"one",b:"two",c:"three"});
        expect(MM.sync.registerHook).toHaveBeenCalledWith('Test Plugin', 'someSyncFunction');
    });

    /**
     * Tests loadModels
     * @covers loadModels
     */
    describe("can load models", function() {
        it("when given a model", function() {
            var elements = {
                'testModel':{
                    type:'model'
                }
            };

            MM.models = {};

            spyOn(Backbone.Model, 'extend').andReturn();
            MM.loadModels(elements);
            expect(Backbone.Model.extend).toHaveBeenCalledWith({});
        });
        it("when given a collection", function() {
            var elements = {
                'testCollection':{
                    type:'collection',
                    model:'testModel',
                    bbproperties:{
                        name:'testcollection'
                    }
                }
            };

            MM.models = {
                'testModel':{}
            };

            MM.collections = {};

            spyOn(MM, '_createNewStore').andReturn({});
            spyOn(Backbone.Collection, 'extend').andCallThrough();

            MM.loadModels(elements);

            expect(MM._createNewStore).toHaveBeenCalledWith('testCollection');
            expect(Backbone.Collection.extend).toHaveBeenCalledWith(elements['testCollection'].bbproperties);
            expect(MM.collections['testCollection'].name).toEqual('testcollection');
        });
        it("When given a model and then a collection", function() {
            var elements = {
                'testModel':{
                    type:'model'
                },
                'testCollection':{
                    type:'collection',
                    model:'testModel',
                    bbproperties:{
                        name:'testcollection'
                    }
                }
            };
            MM.models = {};
            MM.collections = {};

            spyOn(Backbone.Model, 'extend').andReturn({'name':'backbone extended model'});
            spyOn(MM, '_createNewStore').andReturn({});
            spyOn(Backbone.Collection, 'extend').andCallThrough();

            MM.loadModels(elements);

            expect(MM._createNewStore).toHaveBeenCalledWith('testCollection');
            expect(Backbone.Collection.extend).toHaveBeenCalledWith(elements['testCollection'].bbproperties);
            expect(MM.collections['testCollection'].name).toEqual('testcollection');
            expect(MM.collections['testCollection'].model).toEqual({'name':'backbone extended model'});
        });
        it("Errors when given a collection and then a model", function() {
            var elements = {
                'testCollection':{
                    type:'collection',
                    model:'testModel',
                    bbproperties:{
                        name:'testcollection'
                    }
                },
                'testModel':{
                    type:'model'
                }
            };
            MM.models = {};
            MM.collections = {};

            spyOn(Backbone.Model, 'extend').andReturn({'name':'backbone extended model'});
            spyOn(MM, '_createNewStore').andReturn({});
            spyOn(Backbone.Collection, 'extend').andCallThrough();

            MM.loadModels(elements);

            expect(MM._createNewStore).toHaveBeenCalledWith('testCollection');
            expect(Backbone.Collection.extend).toHaveBeenCalledWith(elements['testCollection'].bbproperties);
            expect(MM.collections['testCollection'].name).toEqual('testcollection');
            expect(MM.collections['testCollection'].model).toBeUndefined();
        });
    });

    /**
     * Tests displaySettings
     * @covers displaySettings
     */
    it("can display settings", function() {
        // DOM elements required
        $(document.body).append(
            $("<div>").attr('id', 'testElements').append(
                $("<div>").html(
                    "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                )
            ).append(
               $("<div>").attr({'id':'settings_template'}).html('hello world')
            )
        );

        MM.plugins = {
            'first':{
                settings:{
                    type:'setting',
                    name:'first_thing'
                }
            },
            'second':{
                settings:{
                    type:'not-setting',
                    name:'second_thing'
                }
            }
        }

        MM.tpl = {
            render:function(){}
        };
        MM.panels = {
            show:function(){}
        };

        spyOn(MM.tpl, 'render').andReturn("hello world");
        spyOn(MM.panels, 'show').andReturn();

        MM.displaySettings();

        expect(MM.tpl.render).toHaveBeenCalledWith(
            'hello world',
            {
                plugins:[
                    {type:'setting',name:'first_thing'}
                ]
            }
        );
        expect(MM.panels.show).toHaveBeenCalledWith('center', 'hello world');
        $("#testElements").remove();
    });

    /**
     * Tests getConfig
     * @covers getConfig
     */
    describe("can retrieve configuration", function() {
        beforeEach(function() {
            MM.config = {};
        });

        it("when nothing is provided", function() {
            var response = MM.getConfig();
            expect(response).toBeUndefined();
        });
        it("when just a name is provided but doesn't exist", function() {
            var response = MM.getConfig("testField");
            expect(response).toBeUndefined();
        });
        it("when just a name is provided and it does exist", function() {
            MM.config['testField'] = "This is a test field";
            var response = MM.getConfig("testField");
            expect(response).toEqual("This is a test field");
        });
        it("when a name and optional have been provided and name exists", function() {
            MM.config['testField'] = "This is a test field";
            var response = MM.getConfig("testField", "optionalResponse");
            expect(response).toEqual("This is a test field");
        });
        it("when a name and optional have been provided and name doesn't exist", function() {
            var response = MM.getConfig("testField", "optionalResponse");
            expect(response).toEqual("optionalResponse");
        });
        it("when a name and site have been provided", function() {
            MM.config.current_site = {'id':1};
            MM.config['1-testField'] = "This is a test field for site One";
            var response = MM.getConfig("testField", undefined, true);
            expect(response).toEqual("This is a test field for site One");
        });
        it("when optional and site are provided", function() {
            MM.config.current_site = {'id':1};
            var response = MM.getConfig("", "optionalResponse", true);
            expect(response).toEqual("optionalResponse");
        });
        it("when name, optional and site are all provided and name exists", function() {
            MM.config.current_site = {'id':1};
            MM.config['1-testField'] = "This is a test field for site One";
            var response = MM.getConfig("testField", "optionalResponse", true);
            expect(response).toEqual("This is a test field for site One");
        });
        it("when name, optional and site are all provided and name doesn't exists", function() {
            MM.config.current_site = {'id':1};
            var response = MM.getConfig("testField", "optionalResponse", true);
            expect(response).toEqual("optionalResponse");
        });
    });

    describe("can load courses", function() {
        beforeEach(function() {
            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<div>").attr({'id':'menu_template'})
                ).append(
                    $("<div>").addClass('submenu')
                ).append(
                    $("<div>").addClass('submenu')
                ).append(
                    $("<div>").attr('id', 'add-site')
                ).append(
                    $("<div>").attr('id', 'main-wrapper')
                ).append(
                    $("<div>").addClass('toogler')
                )
            );

            MM.config = {
                plugins:{
                    'plugin_one':'plugin_one_idx',
                    'plugin_two':'plugin_two_idx',
                    'plugin_three':'plugin_three_idx'
                },
                current_site:{
                    id:123
                }
            };
            MM.plugins = {
                'plugin_one_idx':{
                    settings: {
                        type:'general'
                    }
                },
                'plugin_two_idx':{
                    settings: {
                        type:'course'
                    }
                }
            };
            MM.site = {
                get:function(field){
                    if (field == 'fullname') {
                        return "A Full Name";
                    } else if (field == 'userpictureurl') {
                        return "User Picture Url";
                    } else if (field == 'siteurl') {
                        return "Site URL";
                    } else {
                        return "Invalid Field";
                    }
                }
            }
            MM.tpl = {
                render:function() {}
            };
            MM.panels = {
                html:function(){},
                menuShow:function(){},
                hide:function(){}
            };
            MM.db = {
                insert:function(){}
            };
            MM.lang = {
                s:function() {}
            };
        });
        afterEach(function() {
            $("#testElements").remove();
        });
        it("can load general plugins with touchMoving = true", function() {
            var expectedCourse = [
                {id:'123-1', courseid:1},
                {id:'123-2', courseid:2}
            ];

            MM.clickType = 'myTestClickType';
            MM.touchMoving = true;
            MM.deviceType = 'tablet';

            spyOn(MM.site, 'get').andCallThrough();
            spyOn(MM.tpl, 'render').andReturn('hello world');
            spyOn(MM.panels, 'html').andReturn();
            spyOn(MM.panels, 'menuShow').andReturn();
            spyOn(MM.panels, 'hide').andReturn();
            spyOn(MM.lang, 's').andReturn("Welcome Text");
            spyOn(MM.db, 'insert').andCallFake(function(x, y) {
                if (y.courseid == 1) {
                    return expectedCourse[0];
                } else if (y.courseid == 2) {
                    return expectedCourse[1];
                }
            });

            var arguments = {
                'course_one':{
                    id:1
                },
                'course_two':{
                    id:2
                }
            };

            MM.loadCourses(arguments);
            $(".toogler").trigger(MM.clickType);

            expect(MM.touchMoving).toEqual(false);
            expect(MM.tpl.render).toHaveBeenCalledWith(
                "",
                {
                    user : {
                        fullname : 'A Full Name',
                        profileimageurl : 'User Picture Url'
                    },
                    siteurl : 'Site URL',
                    coursePlugins : [
                        { type : 'course' }
                    ],
                    courses : {
                        course_one : { id : 1 },
                        course_two : { id : 2 }
                    },
                    plugins : [
                        { type : 'general' }
                    ]
                }
            );
            expect(MM.panels.html).toHaveBeenCalledSequentiallyWith([
                ['left', 'hello world'],
                ['center', '<div class="welcome">Welcome Text</div>']
            ]);
            expect(MM.db.insert).toHaveBeenCalledSequentiallyWith([
                ['courses', expectedCourse[0]],
                ['courses', expectedCourse[1]]
            ]);
            expect($("#add-site").css('display')).toEqual('none');
            expect($("#main-wrapper").css('display')).toEqual('block');
            expect(MM.panels.menuShow).toHaveBeenCalledWith(true, {animate:false});
            expect(MM.panels.hide).toHaveBeenCalledWith('right', '');
        });
        it("can load course plugins with touchMoving = false", function() {
            var expectedCourse = [
                {id:'123-1', courseid:1},
                {id:'123-2', courseid:2}
            ];

            MM.clickType = 'myTestClickType';
            MM.touchMoving = false;
            MM.deviceType = 'tablet';

            spyOn(MM.site, 'get').andCallThrough();
            spyOn(MM.tpl, 'render').andReturn('hello world');
            spyOn(MM.panels, 'html').andReturn();
            spyOn(MM.panels, 'menuShow').andReturn();
            spyOn(MM.panels, 'hide').andReturn();
            spyOn(MM.lang, 's').andReturn("Welcome Text");
            spyOn(MM.db, 'insert').andCallFake(function(x, y) {
                if (y.courseid == 1) {
                    return expectedCourse[0];
                } else if (y.courseid == 2) {
                    return expectedCourse[1];
                }
            });
            var jQueryNextResponse = {
                slideToggle:function(){}
            };
            spyOn($.fn, 'next').andReturn(jQueryNextResponse);
            spyOn(jQueryNextResponse, 'slideToggle').andReturn();
            spyOn($.fn, 'toggleClass').andReturn();

            var arguments = {
                'course_one':{
                    id:1
                },
                'course_two':{
                    id:2
                }
            };

            MM.loadCourses(arguments);
            $(".toogler").trigger(MM.clickType);

            expect($.fn.next).toHaveBeenCalled();
            expect(jQueryNextResponse.slideToggle).toHaveBeenCalledWith(300);
            expect($.fn.toggleClass).toHaveBeenCalledWith("collapse expand");
            expect(MM.tpl.render).toHaveBeenCalledWith(
                "",
                {
                    user : {
                        fullname : 'A Full Name',
                        profileimageurl : 'User Picture Url'
                    },
                    siteurl : 'Site URL',
                    coursePlugins : [
                        { type : 'course' }
                    ],
                    courses : {
                        course_one : { id : 1 },
                        course_two : { id : 2 }
                    },
                    plugins : [
                        { type : 'general' }
                    ]
                }
            );
            expect(MM.panels.html).toHaveBeenCalledSequentiallyWith([
                ['left', 'hello world'],
                ['center', '<div class="welcome">Welcome Text</div>']
            ]);
            expect(MM.db.insert).toHaveBeenCalledSequentiallyWith([
                ['courses', expectedCourse[0]],
                ['courses', expectedCourse[1]]
            ]);
            expect($("#add-site").css('display')).toEqual('none');
            expect($("#main-wrapper").css('display')).toEqual('block');
            expect(MM.panels.menuShow).toHaveBeenCalledWith(true, {animate:false});
            expect(MM.panels.hide).toHaveBeenCalledWith('right', '');
        });
    });

    /**
     * Tests setConfig
     * @covers setConfig
     */
    it("can set config", function() {
        MM.config = {
            current_site : {
                id:1
            }
        };
        MM.db = {
            insert:function(){}
        };
        spyOn(MM.db, 'insert').andReturn();
        MM.setConfig('testName', 'testValue', true);
        expect(MM.db.insert).toHaveBeenCalledWith('settings', {id:'1-testName',name:'testName',value:'testValue'});
    });

    /**
     * Tests fixPluginfile
     * @covers fixPluginfile
     */
    it("can fix plugin file", function() {
        MM.config = {
            current_token:'testToken'
        };
        var response = MM.fixPluginfile("A.URL/pluginfile");
        expect(response).toEqual("A.URL/webservice/pluginfile?token=testToken");
    });

    /**
     * Tests log
     * @covers log
     */
    describe("can log information", function() {
        it("except when dev_debug is not set", function() {
            spyOn(MM, 'getConfig').andReturn(false);
            var response = MM.log("foo");
            expect(response).toBeUndefined();
        });

        it("specifying Component:Core when not set", function() {
            MM.config.log_length = 20000;
            MM.logData = [];
            spyOn(MM, 'getConfig').andReturn(true);

            // Stops any calls to window.console from working.
            spyOn(window.console, 'log').andReturn();
            MM.log("foo");
            expect(MM.logData[0]).toMatch(
                /\d{1,2}\/\d{1,2}\/\d{2,4} \d{1,2}:\d{1,2}:\d{1,2} Core: foo/
            );
        });
        it("and clears the log queue when it's too large", function() {
            MM.config.log_length = 2;
            MM.logData = ["x", "y"];
            spyOn(MM, 'getConfig').andReturn(true);

            // Stops any calls to window.console from working.
            spyOn(window.console, 'log').andReturn(false);

            MM.log("foo", "AnotherComponent");
            expect(MM.logData[0]).toMatch(
                /\d{1,2}\/\d{1,2}\/\d{2,4} \d{1,2}:\d{1,2}:\d{1,2} AnotherComponent: foo/
            );
            expect(MM.logData.length).toEqual(2);
            expect(MM.logData[1]).toEqual("x");
        });
    });

    /**
     * Tests getFormattedLog
     * @covers getFormattedLog
     */
    describe("can show formatted log information", function() {
        beforeEach(function() {
            MM.logData = [
                "log entry number one",
                "testFilter: log entry number two",
                "log entry number three",
                "testFilter: log entry number four",
                "testFilter: log entry duplicate",
                "testFilter: log entry duplicate",
                "testFilter: log entry duplicate",
                "log entry number five for testFilter",
                "log entry containing testFilter within the string",
            ];
        });
        it("except when dev_debug is not set", function() {
            spyOn(MM, 'getConfig').andReturn(false);
            var response = MM.getFormattedLog("testFilter");
            expect(response).toEqual("");
        });
        it("when filter is not a string", function() {
            spyOn(MM, 'getConfig').andReturn(true);
            var response = MM.getFormattedLog(123);
            var expected = "log entry number one<br />";
            expected += "testFilter: log entry number two<br />";
            expected += "log entry number three<br />";
            expected += "testFilter: log entry number four<br />";
            expected += "testFilter: log entry duplicate<br />";
            expected += "log entry number five for testFilter<br />";
            expected += "log entry containing testFilter within the string<br />";
            expect(response).toEqual(expected);
        });
        it("when filter is a string", function() {
            spyOn(MM, 'getConfig').andReturn(true);
            var response = MM.getFormattedLog("testFilter");
            var expected = "testFilter: log entry number two<br />";
            expected += "testFilter: log entry number four<br />";
            expected += "testFilter: log entry duplicate<br />";
            expected += "log entry number five for testFilter<br />";
            expected += "log entry containing testFilter within the string<br />";
            expect(response).toEqual(expected);
        });
    });

    /**
     * Tests showLog
     * @covers showLog
     */
    it("can show log information for everyone", function() {
        // DOM elements required
        $(document.body).append(
            $("<div>").attr('id', 'testElements').append(
                $("<div>").html(
                    "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                )
            ).append(
               $("<input>").attr({'id':'logfilter', 'value':'testbutton'})
            )
        );

        MM.panels = {
            html:function(){}
        };
        MM.config = {
            current_site:{
                username:'AUsername'
            }
        }
        MM.lang = {
            s:function(field) {
                return "Field:field";
            }
        }

        var expected = "testFilter: log entry number two<br />";
        expected += "testFilter: log entry number four<br />";
        expected += "testFilter: log entry duplicate<br />";
        expected += "log entry number five for testFilter<br />";
        expected += "log entry containing testFilter within the string<br />";
        spyOn(MM.lang, 's').andCallThrough();
        spyOn(MM, 'getFormattedLog').andReturn(expected);
        spyOn(MM.panels, 'html').andReturn();
        spyOn(MM, 'showLog').andCallThrough();
        spyOn($.fn, 'keyup').andCallThrough();

        var expectedPanelHTML = '<input id="logfilter" type="text" placeholder="Filter"> ';
        expectedPanelHTML += '<a href="javascript: MM.showLog()">Clear</a><br/><br/>';
        expectedPanelHTML += 'testFilter: log entry number two<br />';
        expectedPanelHTML += 'testFilter: log entry number four<br />';
        expectedPanelHTML += 'testFilter: log entry duplicate<br />';
        expectedPanelHTML += 'log entry number five for testFilter<br />';
        expectedPanelHTML += 'log entry containing testFilter within the string<br />';
        expectedPanelHTML += '<div class="centered">';
        expectedPanelHTML += '<a href="mailto:AUsername?subject=MMLog&body=testFilter%3A%20log%20entry%20number%20two%0AtestFilter%3A%20log%20entry%20number%20four%0AtestFilter%3A%20log%20entry%20duplicate%0Alog%20entry%20number%20five%20for%20testFilter%0Alog%20entry%20containing%20testFilter%20within%20the%20string%0A">';
        expectedPanelHTML += '<button>Field:field</button></a></div>';

        // Puts the log into the panels
        MM.showLog("testFilter");

        // Triggers the showLog function because the listener is removed each call.
        var e = {keyCode:13};
        $("#logfilter").trigger('keyup', e);
        expect(MM.lang.s).toHaveBeenCalledWith('email');
        expect(MM.panels.html).toHaveBeenCalledWith('right', expectedPanelHTML);
        expect(MM.showLog.callCount).toEqual(1);
        expect($.fn.keyup.callCount).toEqual(1);

        $("#testElements").remove();
    });

    /**
     * Tests popErrorMessage
     * @covers popErrorMessage
     */
    describe("can show an error message", function() {
        it("unless the message is blank", function(){
            MM.Router = {
                navigate:function(){}
            };
            spyOn(MM.Router, 'navigate').andReturn("");

            MM.popErrorMessage("");
            expect(MM.Router.navigate).not.toHaveBeenCalled();
        });
        it("when there's a message to show", function() {
            MM.Router = {
                navigate:function(){}
            };
            MM.lang = {
                s:function(){}
            };
            spyOn(MM.lang, 's').andReturn("hello world");
            spyOn(MM, 'popMessage').andReturn();

            MM.popErrorMessage("An error message");
            expect(MM.lang.s).toHaveBeenCalledWith('error');
            expect(MM.popMessage).toHaveBeenCalledWith('An error message', {
                title:'hello world',
                autoclose:4000
            });
        });
    });

    /**
     * Tests popMessage
     * @covers popMessage
     */
    describe("can display a message", function() {
        it("with custom options", function() {
            MM.widgets = {
                dialog:function(){}
            };
            spyOn(MM.widgets, 'dialog').andReturn();
            MM.popMessage("Some text", {autoclose:20});
            expect(MM.widgets.dialog).toHaveBeenCalledWith('Some text', {autoclose:20});
        });
        it("without custom options", function() {
            MM.widgets = {
                dialog:function(){}
            };
            spyOn(MM.widgets, 'dialog').andReturn();
            MM.popMessage("Some text");
            expect(MM.widgets.dialog).toHaveBeenCalledWith('Some text', {autoclose:4000});
        });
    });

    /**
     * Tests popConfirm
     * @covers popConfirm
     */
    it("can display a confirmation window", function() {
        MM.lang = {
            s:function(text) {
                if (text == 'yes') {
                    return 'Da';
                } else if (text == 'no') {
                    return 'Nyet';
                }
            }
        };
        MM.widgets = {
            dialogClose:'hello world'
        };
        spyOn(MM, 'popMessage').andReturn();
        var callBackFunction = function(){};
        MM.popConfirm('some text', callBackFunction);
        expect(MM.popMessage).toHaveBeenCalledWith('some text', {
            'buttons':{
                'Da':callBackFunction,
                'Nyet':'hello world'
            }
        });
    });

    /**
     * Tests handleExternalLinks
     * @covers handleExternalLinks
     */
    it("can handle external links", function() {
        MM.clickType = 'aClick';
        MM.backup.externalLinkClickHandler = MM.externalLinkClickHandler;
        MM.externalLinkClickHandler = 'externalLinkClickHandler';
        spyOn(MM, 'setExternalLinksHREF').andReturn();
        spyOn($.fn, 'bind').andReturn();
        MM.handleExternalLinks("ASelector");
        expect(MM.setExternalLinksHREF).toHaveBeenCalledWith('ASelector');
        expect($.fn.bind).toHaveBeenCalledWith('aClick', 'externalLinkClickHandler');
        MM.externalLinkClickHandler = MM.backup.externalLinkClickHandler;
    });

    /**
     * Tests setExternalLinksHREF
     * @covers setExternalLinksHREF
     */
    describe("can set external link hrefs", function() {
        it("except when the clickType is not click", function() {
            spyOn($.fn, 'bind').andReturn();
            MM.clickType = 'click';
            MM.setExternalLinksHREF("aSelector");
            expect($.fn.bind).not.toHaveBeenCalled();
        });
        it("when clickType is click and href is not #", function() {
            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<a>").attr({'id':'testLink', 'href':'some.url/place'})
                )
            );

            MM.Router = {
                navigate:function(){}
            };

            MM.clickType = 'tap';

            spyOn($("#testLink"), 'bind').andReturn();
            spyOn(MM.Router, 'navigate').andReturn();

            MM.setExternalLinksHREF("#testLink");
            $("#testLink").click();

            expect(MM.Router.navigate).toHaveBeenCalled();

            var link = $("#testLink");
            expect(link.attr('href')).toEqual('#');
            expect(link.attr('data-link')).toEqual('some.url/place');
            expect(link.attr('target')).toEqual('_self');

            $("#testElements").remove();
        });
        it("when clickType is click and href is #", function() {
            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<a>").attr({'id':'testLink', 'href':'#'})
                )
            );

            MM.Router = {
                navigate:function(){}
            };

            MM.clickType = 'tap';

            spyOn($("#testLink"), 'bind').andReturn();
            spyOn(MM.Router, 'navigate').andReturn();

            MM.setExternalLinksHREF("#testLink");
            $("#testLink").click();

            expect(MM.Router.navigate).not.toHaveBeenCalled();

            $("#testElements").remove();
        });
    });

    /**
     * Tests externalLinkClickHandler by creating a button and calling its
     * click event
     * @covers externalLinkClickHandler
     */
    describe("can handle external link click handler", function() {
        beforeEach(function() {
            var e = {
                preventDefault:function(){}
            };
            // DOM elements required
            $(document.body).append(
                $("<div>").attr('id', 'testElements').append(
                    $("<div>").html(
                        "If this is still visible then one of the loadLayout tests hasn't removed it as expected."
                    )
                ).append(
                   $("<a>").attr(
                        {'id':'testLink', 'href':'some.url/place'}
                    ).on(
                        'click', MM.externalLinkClickHandler
                    )
                ).append(
                    $("<div>").addClass('infoBox')
                )
            );
            if (typeof(window.plugins) == 'undefined') {
                window.plugins = {
                    childBrowser:{
                        showWebPage:function(){}
                    }
                };
            }
            if (typeof(window.plugins.childBrowser) == 'undefined') {
                window.plugins.childBrowser = {
                    showWebPage:function(){
                        console.log("throwing original");
                    }
                };
            }
        });
        afterEach(function() {
            $("#testElements").remove();
        });
        it("when MM.touchMoving is true", function() {
            MM.touchMoving = true;
            MM.plugins = {
                contents:{
                    infoBox:$(".infoBox")
                }
            }
            $("#testLink").click();
        });
        it("when MM.touchMoving is false and we should display in a child browser", function() {
            MM.touchMoving = false;
            MM.plugins = {
                contents:{
                    infoBox:$(".infoBox")
                }
            }
            spyOn(MM, 'log').andReturn();
            spyOn(MM, '_canUseChildBrowser').andReturn(true);
            spyOn(window.plugins.childBrowser, 'showWebPage').andReturn();

            $("#testLink").click();
            expect(MM.log).toHaveBeenCalledWith('Launching childBrowser');
            expect(MM._canUseChildBrowser).toHaveBeenCalled();
            expect(window.plugins.childBrowser.showWebPage).toHaveBeenCalledWith(
                'some.url/place',
                {
                    showLocationBar:true,
                    showAddress:false
                }
            );
        });
        it("when MM.touchMoving is false and we should display in a child browser + EXCEPTION", function() {
            MM.touchMoving = false;
            MM.plugins = {
                contents:{
                    infoBox:$(".infoBox")
                }
            }
            spyOn(MM, 'log').andReturn();
            spyOn(MM, '_canUseChildBrowser').andReturn(true);
            spyOn(window.plugins.childBrowser, 'showWebPage').andCallFake(function() {
                throw 'exception';
            });
            spyOn(window, 'open').andReturn();

            $("#testLink").click();
            expect(MM.log).toHaveBeenCalledSequentiallyWith([
                ['Launching childBrowser'],
                ['Launching childBrowser failed!, opening as standard link']
            ]);
            expect(MM._canUseChildBrowser).toHaveBeenCalled();
            expect(window.plugins.childBrowser.showWebPage).toHaveBeenCalledWith(
                'some.url/place',
                {
                    showLocationBar:true,
                    showAddress:false
                }
            );
            expect(window.open).toHaveBeenCalledWith('some.url/place', '_blank');
        });
        it("when MM.touchMoving is false and we should use navigator.app", function() {
            MM.touchMoving = false;
            MM.plugins = {
                contents:{
                    infoBox:$(".infoBox")
                }
            }

            var navigatorExisted = true;
            if (typeof(navigator.app) == 'undefined') {
                navigatorExisted = false;
                navigator.app = {
                    loadUrl: function(){}
                };
            }

            spyOn(MM, 'log').andReturn();
            spyOn(MM, '_canUseChildBrowser').andReturn(false);
            spyOn(navigator.app, 'loadUrl').andReturn();

            $("#testLink").click();
            expect(MM.log).toHaveBeenCalledWith('Opening external link using navigator.app');
            expect(MM._canUseChildBrowser).toHaveBeenCalled();
            expect(navigator.app.loadUrl).toHaveBeenCalledWith('some.url/place', {openExternal:true});

            // reset that navigator
            if (!navigatorExisted) {
                navigator.app = undefined;
            }
        });
        it("when MM.touchMoving is false and we should use window.open based on href", function() {
            MM.touchMoving = false;
            MM.plugins = {
                contents:{
                    infoBox:$(".infoBox")
                }
            }

            spyOn(MM, 'log').andReturn();
            spyOn(MM, '_canUseChildBrowser').andReturn(false);
            spyOn(window, 'open').andReturn();

            $("#testLink").click();
            expect(MM.log).toHaveBeenCalledWith('Opening external link using window.open');
            expect(MM._canUseChildBrowser).toHaveBeenCalled();
            expect(window.open).toHaveBeenCalledWith('some.url/place', '_blank');
        });
        it("when MM.touchMoving is false and we should use window.open based on data-link", function() {
            MM.touchMoving = false;
            MM.plugins = {
                contents:{
                    infoBox:$(".infoBox")
                }
            }

            spyOn(MM, 'log').andReturn();
            spyOn(MM, '_canUseChildBrowser').andReturn(false);
            spyOn(window, 'open').andReturn();

            $("#testLink").attr({
                'data-link': $("#testLink").attr('href'),
                'href':'#'
            });
            $("#testLink").click();
            expect(MM.log).toHaveBeenCalledWith('Opening external link using window.open');
            expect(MM._canUseChildBrowser).toHaveBeenCalled();
            expect(window.open).toHaveBeenCalledWith('some.url/place', '_blank');
        });
    });

    /**
     * Tests loadExtraJS
     * @covers loadExtraJS
     */
    it("can load extra js files", function() {
        MM.config = {
            extra_js:["a.js", "b.js"]
        };

        spyOn(MM, 'deviceConnected').andReturn(true);
        spyOn($, 'each').andCallThrough();
        spyOn($, 'ajax').andCallFake(function(options){
            options.success();
        });
        spyOn(MM, 'log').andReturn();

        MM.loadExtraJs();

        expect(MM.deviceConnected).toHaveBeenCalled();
        expect(MM.log).toHaveBeenCalledSequentiallyWith(
            [
                ["MM: Loading additional javascript file a.js"],
                ["MM: Loading additional javascript file b.js"],
                ["MM: Loaded additional javascript file a.js"],
                ["MM: Loaded additional javascript file b.js"]
            ]
        );
        expect($.each).toHaveBeenCalled();
        expect($.ajax).toHaveBeenCalled();
        expect($.ajax.callCount).toEqual(2);
    });

    /**
     * Tests getOS
     * @covers getOS
     */
    describe("can get the OS type", function() {
        beforeEach(function() {
            var backupDevice = undefined;
            if (typeof(window.device) != 'undefined') {
                backupDevice = window.device;
                window.device = undefined;
            }
        });
        afterEach(function() {
            if (typeof(backupDevice) != 'undefined') {
                window.device = backupDevice;
            }
        });
        it("when window.device doesn't exist", function() {
            MM.deviceOS = "myOS";
            var os = MM.getOS();
            expect(os).toEqual("myos");
        });
        it("when window.device does exist", function() {
            window.device = {
                platform : "myPlatform"
            };
            MM.deviceOS = "myOS";
            var os = MM.getOS();
            expect(os).toEqual("myplatform");
        });
    });

    /**
     * Tests showModalLoading
     * @covers showModalLoading
     */
    it("can show modal loading window", function() {
        MM.widgets = {
            dialog:function(){}
        };
        spyOn(MM.widgets, 'dialog').andReturn();
        MM.showModalLoading("aTitle", "some Text");
        expect(MM.widgets.dialog).toHaveBeenCalledWith(
            '<div class="centered"><img src="img/loadingblack.gif"><br />some Text</div>',
            { title : 'aTitle' }
        );
    });

    /**
     * Tests closeModalLoading
     * @covers closeModalLoading
     */
    it("can close modal loading windows", function() {
        MM.widgets = {
            dialogClose:function(){}
        };
        spyOn(MM.widgets, 'dialogClose').andReturn();
        MM.closeModalLoading();
        expect(MM.widgets.dialogClose).toHaveBeenCalled();
    });

    /**
     * Tests refresh
     * @covers refresh
     */
    it("can refresh itself", function() {
        MM.Router = {
            navigate:function(){}
        };
        MM.cache = {
            purge:function(){}
        };
        MM.config = {
            current_site:{
                id:1
            }
        };
        spyOn(MM.Router, 'navigate').andReturn();
        spyOn(MM.cache, 'purge').andReturn();
        spyOn(MM, 'loadSite').andReturn();

        MM.refresh();

        expect(MM.Router.navigate).toHaveBeenCalledWith("");
        expect(MM.cache.purge).toHaveBeenCalled();
        expect(MM.loadSite).toHaveBeenCalledWith(1);
    });
});
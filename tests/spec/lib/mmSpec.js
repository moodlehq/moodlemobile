describe("MM", function() {

    describe("init", function() {
        it("sets MM.config", function() {
        });

        it("calls setTouchHandlers", function() {
        });

        it("calls setDeviceType", function() {
        });

        it("calls setDeviceOS", function() {
        });

        it("calls setInComputerState", function() {
        });

        it("calls loadCordova", function() {
        });

        it("calls loadBackboneRoater", function() {
        });

        it("calls setUpAjaxErrorHandling", function() {
        });

        it("calls loadModels", function() {
        });

        it("calls loadSettings", function() {
        });

        describe("setTouchHandlers", function() {
            it("sets properties correctly", function() {
            });
        });

        describe("setDeviceType", function() {
            it("sets properties correctly", function() {
            });
        });

        describe("setDeviceOS", function() {
            it("sets properties correctly", function() {
            });
        });

        describe("setInComputerState", function() {
            it("sets properties correctly", function() {
            });
        });

        describe("loadCordova", function() {
            it("sets properties correctly", function() {
            });
        });

        describe("loadBackboneRouter", function() {
            it("sets properties correctly", function() {
            });
        });

        describe("setUpAjaxErrorHandling", function() {
            it("sets properties correctly", function() {
            });
        });

        describe("loadModels", function() {
            it("sets properties correctly", function() {
            });
        });

        describe("loadSettings", function() {
            it("sets properties correctly", function() {
            });
        });
    });

    describe("deviceConnected", function() {
        it("reports state correctly when connected", function() {
            // Mock network states and test connection is reported correctly 
        });

        it("reports state correctly when disconnected", function() {
            // Mock network states and test connection is reported correctly 
        });
    });

    describe("loadLayout", function() {
        it("starts backbone history", function() {
        });

        it("adds event handlers", function() {
        });

        it("displays the page", function() {
        });

        it("calls MM.loadExtraJs", function() {
        });

        it("handles orientation changes", function() {
            // Mock various heights & widths, test calculations
        });

        it("handles media query changes", function() {
            // Mock various MQs, test that the page is reloaded accordingly
        });

        it("sets tablet or phone layout appropriately", function() {
            // Mock device type, test correct layout function is called
        });

        it("sets correct scrolling type", function() {
            // Mock device types, test correct scrolling setup function is called
        });
    });

    describe("loadSite", function() {
        it("calls MM.sync.init", function() {
        });

        it("calls setUpConfig", function() {
        });

        it("calls setUpLanguages", function() {
        });
        
        it("calls loadCachedRemoteCSS", function() {
        });

        describe("setUpConfig", function() {
            it("calls setConfig for current_site and current_token", function() {
            });
        });

        describe("setUpLanguages", function() {
            it ("calls MM.lang.setup for each plugin", function() {
            });

            it("calls MM.lang.sync", function() {
            });
        });

        describe("loadCachedRemoteCSS", function() {
            it("sets CSS URL appropriately", function() {
                // Mock cache element, test that CSS URL is set accordingly.
            });

            it("calls MM.lang.sync", function() {
            });
        });
    });

    describe("addSite", function() {
        it("calls MM.saveSite if input is valid", function() {
        });

        it("doesn't call MM.saveSite if input is invalid", function() {
        });
    });

    describe("saveSite", function() {
        it("handles successful login attempts", function() {
        });

        it("handles unsuccessful login attempts", function() {
        });
    });

    describe("registerPlugin", function() {
        it("adds the plugin to this.plugins", function() {
        });

        it("adds the plugin's routes to the router", function() {
        });

        it("calls loadModels", function() {
        });

        it("calls MM.lang.loadPluginLang", function() {
        });

        it("calls MM.sync.registerHook if plugin.sync is defined", function() {
        });
    });

    describe("loadModels", function() {
        it("sets this.models for objects of type model", function() {
        });
        
        it("sets this.collections for objects of type collection", function() {
        });
        
        it("sets obj.bbproperties", function() {
        }); 
    });

    describe("moodleWSCall", function() {
        it("calls addOperationToQueue when device is offline", function() {
        });

        it("calls getDataFromCache when presets.cache is set", function() {
        });

        it("handles successful webservice calls", function() {
        });

        it("handles unsuccessful webservice calls", function() {
        });

        describe("addOperationToQueue", function() {
            it("adds the operation to the queue", function() {
            });

        });

        describe("getDataFromCache", function() {
            it("gets data from the cache", function() {
            });
        });
    });

    describe("moodleUploadFile", function() {
        it("calls ft.upload", function() {
        });

        it("handles disconnections", function() {
        });

        it("handles successful uploads", function() {
        });

        it("handles unsuccessful uploads", function() {
        });
    });

    describe("moodleDownloadFile", function() {
        it("handles successful downloads", function() {
        });

        it("handles unsuccessful downloads", function() {
        });
    });

    describe("wsSync", function() {
        it("logs a warning if sync process is disabled", function() {
        });

        it("exits cleanly if sync process is disabled", function() {
        });

        it("exits cleanly if device is not connected", function() {
        });

        it("calls the correct sync function for the given type", function() {
        });

        describe("wsSyncWebService", function() {
            it("makes a web service call", function() {
            });

            describe("when the web service call is successful", function() {
                it("adds an entry to the log", function() {
                });

                it("removes the sync object from the database", function() {
                });
            });

            describe("when the web service call is unsuccessful", function() {
                it("exits silently", function() {
                });
            });
        });

        describe("wsSyncUpload", function() {
            it("creates a FileTransfer object", function() {
            });

            it("calls the FileTransfer object's upload method with the appropriate args", function() {
            });

            describe("when the upload is successful", function() {
                it("adds an entry to the log", function() {
                });

                it("removes the sync object from the database", function() {
                });
            });

            describe("when the upload is unsuccessful", function() {
                it("adds an entry to the log", function() {
                });
            });
        });

        describe("wsSyncDownload", function() {
            it("exits cleanly if the sync objects site is not the current site", function() {
            });

            it("creates a directory for the download", function() {
            });

            it("calls moodleDownloadFile", function() {
            });

            describe("when the download is successful", function() {
                it("adds an entry to the log", function() {
                });

                it("stores the content in the database", function() {
                });

                it("removes the sync object from the database", function() {
                });
            });

            describe("when the download is unsuccessful", function() {
                it("adds an entry to the log", function() {
                });
            });
        });
    });

    describe("displaySettings", function() {
        it("shows the panel", function() {
        });

        it("includes all plugins", function() {
        });
    });

    describe("getConfig", function() {
        it("returns the setting if available", function() {
        });

        it("returns the default value if the setting isn't available", function() {
        });

        it("returns a site-specific settings if the site argument is passed", function() {
        }); 
    });

    describe("setConfig", function() {
        it("adds the setting to the database", function() {
        });

        it("adds a site-specific setting if the site argument is passed", function() {
        });
    });

    describe("fixPluginFile", function() {
        it("adds the tonken to the URL", function() {
        });
        
        it("removes the webservice part of the URL", function() {
        });
    });

    describe("log", function() {
        it("exits cleanly if the dev_debug setting is not set", function() {
        });

        it("logs against the 'Core' component if no component is specified", function() {
        });

        it("it logs to the console if window.console is available", function() {
        });

        it("removes the last entry from MM.logData if the length is too long", function() {
        });
    });

    describe("getFormattedLog", function() {
        it("exits cleanly if the dev_debug setting is not set", function() {
        });

        it("returns the contents of MM.logData", function() {
        });
    });

    describe("showLog", function() {
        it("puts the log info in the right panel", function() {
        });

        it("recursively calls itself when a filter is entered", function() {
        });
    });

    describe("popErrorMessage", function() {
        it("resets routing", function() {
        });

        it("calls this.popMessage with the passed message", function() {
        });
    });

    describe("popMessage", function() {
        it("calls MM.widgets.dialog with the appropriate args", function() {
        });
    });

    describe("popConfirm", function() {
        it("calls popMessage with the appropriate args", function() {
        });
    });

    describe("handleExternalLinks", function() {
        it("calls MM.setExternalLinksHREF with the given selector", function() {
        });

        it("binds the click handler", function() {
        });


        describe("setExternalLinksHREF", function() {
            it("exits cleanly if MM.clickType is not 'click'", function() {
            });

            it("binds the click/touchstart handler", function() {
            });

            describe("when the click/touchstart event fires", function() {
                it("resets the routing", function() {
                });

                it("sets the link attributes", function() {
                });
            });
        });

        describe("externalLinkClickHandler", function() {
            it("calls preventDefault", function() {
            });

            describe("when touchMoving", function() {
                it("sets touchMoving to false", function() {
                });

                it("exits cleanly", function() {
                });
            });

            describe("when not touchMoving", function() {
                it("opens the link", function() {
                    // This will need expanding upon somewhat
                });
            });
        });
    });

    describe("handleFiles", function() {
        it("calls MM.setFileLinksHREF with the given selector", function() {
        });

        it("binds the click handler", function() {
        });


        describe("setFileLinksHREF", function() {
            it("exits cleanly if MM.clickType is not 'click'", function() {
            });

            it("binds the click/touchstart handler", function() {
            });

            describe("when the click/touchstart event fires", function() {
                it("resets the routing", function() {
                });

                it("sets the link attributes", function() {
                });
            });
        });

        describe("fileLinkClickHandler", function() {
            it("calls preventDefault", function() {
            });

            describe("when touchMoving", function() {
                it("sets touchMoving to false", function() {
                });

                it("exits cleanly", function() {
                });
            });

            describe("when not touchMoving", function() {
                it("opens the link", function() {
                    // This will need expanding upon somewhat
                });
            });
        });
    });

    describe("loadExtraJs", function() {
        it("exits cleanly if the device is not connected", function() {
        });

        it("loads the etra JS specified in the config", function() {
        });
    });

    describe("getOS", function() {
        it("returns the device platform in lower case", function() {
        });
    });
    
    describe("showModalLoading", function() {
        it("calls MM.widgets.dialog with the passed title & text", function() {
        });
    });

    describe("closeModalLoading", function() {
        it("calls MM.widgets.dialogCLose", function() {
        });
    });

    describe("refresh", function() {
        it("resets the routing", function() {
        });

        it("purges the cache", function() {
        });

        it("reloads the site", function() {
        });
    });
});

var templates = [
    "root/externallib/text!root/plugins/resource/viewsingle.html",
    "root/externallib/text!root/plugins/resource/viewmultiple.html",
    "root/externallib/text!root/plugins/resource/dialog.html"
];

define(templates, function (viewSingleTpl, viewMultipleTpl, dialogTpl) {
    var plugin = {
        settings: {
            name: "resource",
            type: "mod",
            component: "mod_resource",
            lang: {
                component: "core"
            }
        },

        render: function(courseId, sectionId, section, module) {
            var data = {
                "courseId": courseId,
                "sectionId": sectionId,
                "section": section,
                "module": module
            };
            if (module.contents.length > 1) {
                return MM.tpl.render(MM.plugins.resource.templates.viewmultiple.html, data);
            } else {
                return MM.tpl.render(MM.plugins.resource.templates.viewsingle.html, data);
            }
        },

        /**
         * Callback executed when the contents resource is rendered.
         */
        contentsPageRendered: function() {

            $(".resource-downloaded").on(MM.clickType, function(e) {
                e.preventDefault();
                var path = $(this).data("path");
                path = path.substring(0, path.lastIndexOf("/") + 1) + "index.html";
                path = MM.fs.getRoot() + "/" + path;

                MM.plugins.resource._showresource(path);
            });

            $(".resource-download-all").on(MM.clickType, function(e) {
                e.preventDefault();

                var contentId = $(this).data("content");
                var courseId = $(this).data("course");
                var sectionId = $(this).data("section");

                var downloadIcon = $("#download-all-" + contentId);
                if (downloadIcon) {
                    downloadIcon.attr("src", "img/loadingblack.gif");
                }

                var that = $(this);

                var errorFn = function() {
                    downloadIcon.attr("src", "img/download.png");
                    MM.popErrorMessage(MM.lang.s("errordownloading"));
                };

                // Download all the resource images, css, etc...
                MM.plugins.contents.downloadAll(courseId, sectionId, contentId,
                    // Success.
                    function(paths) {
                        downloadIcon.remove();
                        var path = paths[0].filePath;
                        path = path.substring(0, path.lastIndexOf("/") + 1);
                        that.attr("data-path", path);

                        var indexFile = path + "index.html";
                        var indexFileURL = MM.fs.getRoot() + "/" + path + "index.html";

                        // Now, replace references.
                        MM.fs.findFileAndReadContents(indexFile,
                            function(contents) {
                                contents = $(contents);
                                contents.find('img').each(function() {
                                    var src = $(this).attr("src");
                                    src = MM.fs.normalizeFileName(src);
                                    $(this).attr("src", src);
                                });

                                var content = contents.html();
                                MM.fs.getFileAndWriteInIt(indexFile, content,
                                    function() {
                                        MM.plugins.resource._showresource(indexFileURL);
                                    },
                                    function() {
                                        MM.plugins.resource._showresource(indexFileURL);
                                        MM.log("Error writting file " + indexFileURL, "resource");
                                    }
                                );
                            },
                            function() {
                                MM.plugins.resource._showresource(indexFileURL);
                                MM.log("Error reading file " + indexFileURL, "resource");
                            }
                        );
                    },
                    // Error.
                    errorFn
                );
            });
        },

        _showResource: function(path) {
            var height= $(document).innerHeight() - 200;
            var style = 'border: none; width: 100%; height: ' + height + 'px';
            var iframe = '<iframe style="' + style + '" src="' + path + '">';
            iframe += '</iframe>';

            var data = {
                path: path
            };
            var title = MM.tpl.render(MM.plugins.resource.templates.dialog.html, data);

            var options = {
                title: title,
                width: "100%",
                marginTop: "10px"
            };
            MM.widgets.dialog(iframe, options);

            MM.handleExternalLinks('.modalHeader a[target="_blank"]');

            $("#dialog-close").on(MM.clickType, function(e){
                MM.widgets.dialogClose();
            });
        },

        templates: {
            "viewsingle": {
                html: viewSingleTpl
            },
            "viewmultiple": {
                html: viewMultipleTpl
            },
            "dialog": {
                html: dialogTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});
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

            if (typeof module.contents[0] == "undefined") {
                return "";
            }

            var extension = MM.util.getFileExtension(module.contents[0].filename);

            if (module.contents.length == 1 || (extension != "html" && extension != "htm")) {
                return MM.tpl.render(MM.plugins.resource.templates.viewsingle.html, data);
            } else {
                return MM.tpl.render(MM.plugins.resource.templates.viewmultiple.html, data);
            }
        },

        /**
         * Callback executed when the contents resource is rendered.
         */
        contentsPageRendered: function() {

            $(".resource-downloaded").on(MM.clickType, function(e) {
                e.preventDefault();
                var path = $(this).data("path");
                path = MM.fs.getRoot() + "/" + path;

                MM.plugins.resource._showResource(path);
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
                        var path;

                        _.each(paths, function(p) {
                            if (p.index == 0) {
                                path = p.filePath;
                            }
                        });

                        var link = $("#resource-" + contentId);
                        link.attr("data-path", path);
                        link.removeClass("resource-download-all").addClass("resource-downloaded");

                        var indexFile = path;
                        var indexFileURL = MM.fs.getRoot() + "/" + path;

                        MM.plugins.resource._showResource(indexFileURL);
                    },
                    // Error.
                    errorFn
                );
            });
        },

        _showResource: function(path) {
            var data = {
                path: path
            };
            var title = MM.tpl.render(MM.plugins.resource.templates.dialog.html, data);

            MM.widgets.renderIframeModal(title, path);
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
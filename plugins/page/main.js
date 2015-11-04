var templates = [
    "root/externallib/text!root/plugins/page/view.html",
    "root/externallib/text!root/plugins/page/dialog.html"
];

define(templates, function (viewTpl, dialogTpl) {
    var plugin = {
        settings: {
            name: "page",
            type: "mod",
            component: "mod_page",
            lang: {
                component: "core"
            }
        },

        render: function(courseId, sectionId, section, module) {
            // Missing instance? (Possible in older Moodle versions).
            if (typeof module.instance == "undefined") {
                module.instance = 0;
            }

            var data = {
                "courseId": courseId,
                "sectionId": sectionId,
                "section": section,
                "module": module
            };

            return MM.tpl.render(MM.plugins.page.templates.view.html, data);
        },

        /**
         * Callback executed when the contents page is rendered.
         */
        contentsPageRendered: function() {

            $(".page-downloaded").on(MM.clickType, function(e) {
                e.preventDefault();
                var path = $(this).data("path");
                var instance = $(this).data("instance");
                path = path.substring(0, path.lastIndexOf("/") + 1) + "index.html";
                path = MM.fs.getRoot() + "/" + path;

                MM.plugins.page._showPage(path, instance);
            });

            $(".page-download-all").on(MM.clickType, function(e) {
                e.preventDefault();

                var contentId = $(this).data("content");
                var courseId = $(this).data("course");
                var sectionId = $(this).data("section");
                var instance = $(this).data("instance");

                var downloadIcon = $("#download-all-" + contentId);
                if (downloadIcon) {
                    downloadIcon.attr("src", "img/loadingblack.gif");
                }

                var that = $(this);

                var errorFn = function() {
                    downloadIcon.attr("src", "img/download.png");
                    MM.popErrorMessage(MM.lang.s("errordownloading"));
                };

                // Download all the page images, css, etc...
                MM.plugins.contents.downloadAll(courseId, sectionId, contentId,
                    // Success.
                    function(paths) {
                        downloadIcon.remove();
                        var path = paths[0].filePath;
                        path = path.substring(0, path.lastIndexOf("/") + 1);
                        var link = $("#page-" + contentId);
                        link.attr("data-path", path);
                        link.removeClass("page-download-all").addClass("page-downloaded");

                        var indexFileURL = MM.fs.getRoot() + "/" + path + "index.html";

                        MM.plugins.page._showPage(indexFileURL, instance);
                    },
                    // Error.
                    errorFn
                );
            });
        },

        _showPage: function(path, instance) {
            var data = {
                path: path
            };
            var title = MM.tpl.render(MM.plugins.page.templates.dialog.html, data);

            MM.widgets.renderIframeModal(title, path);
            if (parseInt(instance) > 0) {
                MM.moodleLogging(
                    'mod_page_view_page',
                    {
                        pageid: instance
                    },
                    function() {
                        MM.cache.invalidate();
                    }
                );
            }
        },

        templates: {
            "view": {
                html: viewTpl
            },
            "dialog": {
                html: dialogTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});
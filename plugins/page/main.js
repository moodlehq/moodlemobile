var templates = [
    "root/externallib/text!root/plugins/page/view.html"
];

define(templates, function (viewTpl) {
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
                var path = $(this).data("path") + "index.html";

                var height= $(document).innerHeight() - 175;
                var style = 'width: 100%; height: ' + height + 'px';
                var iframe = '<iframe style="' + style + '" src="' + path + '">';
                iframe += '</iframe>';

                var options = {
                    width: "100%",
                    marginTop: "10px"
                };
                MM.widgets.dialog(iframe, options);
            });

            $(".page-download-all").on(MM.clickType, function(e) {
                e.preventDefault();

                var contentId = $(this).data("content");
                var courseId = $(this).data("course");
                var sectionId = $(this).data("section");

                var downloadIcon = $("#download-all-" + contentId);
                if (downloadIcon) {
                    downloadIcon.attr("src", "img/loadingblack.gif");
                }

                var that = $(this);

                MM.plugins.contents.downloadAll(courseId, sectionId, contentId,
                    // Success.
                    function(paths) {
                        downloadIcon.remove();
                        var path = paths[0].fullPath;
                        path = path.substring(0,path.lastIndexOf("/") + 1);
                        that.attr("data-path", path);
                    },
                    // Error.
                    function() {
                        downloadIcon.attr("src", "img/download.png");
                        MM.popErrorMessage(MM.lang.s("errordownloading"));
                    }
                );
            });
        },

        templates: {
            "view": {
                html: viewTpl
            }
        }

    };

    MM.registerPlugin(plugin);

});
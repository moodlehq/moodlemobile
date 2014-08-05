var templates = [
    "root/externallib/text!root/plugins/contents/sections.html",
    "root/externallib/text!root/plugins/contents/contents.html",
    "root/externallib/text!root/plugins/contents/folder.html",
    "root/externallib/text!root/plugins/contents/mimetypes.json"
];

define(templates,function (sectionsTpl, contentsTpl, folderTpl, mimeTypes) {
    var plugin = {
        settings: {
            name: "contents",
            type: "course",
            menuURL: "#course/contents/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        storage: {
            content: {type: "model"},
            contents: {type: "collection", model: "content"}
        },

        routes: [
            ["course/contents/:courseid", "course_contents", "viewCourseContents"],
            ["course/contents/:courseid/section/:sectionId", "course_contents_section", "viewCourseContentsSection"],
            ["course/contents/:courseid/section/:sectionId/folder/:contentid/sectionname/:sectionname", "course_contents_folder", "viewFolder"],
            ["course/contents/:courseid/section/:sectionId/download/:contentid", "course_contents_download", "downloadContent"],
            ["course/contents/:courseid/section/:sectionId/label/:contentid", "course_contents_label", "showLabel"],
            ["course/contents/:courseid/section/:sectionId/hidelabel/:contentid", "course_contents_label", "hideLabel"],
            ["course/contents/:courseid/section/:sectionId/info/:contentid", "course_contents_info", "infoContent"],
            ["course/contents/:courseid/section/:sectionId/download/:contentid/:index", "course_contents_download_folder", "downloadContent"],
            ["course/contents/:courseid/section/:sectionId/info/:contentid/:index", "course_contents_info_folder", "infoContent"],
        ],

        viewCourseContents: function(courseId) {

            MM.panels.showLoading('center');

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }
            // Adding loading icon.
            $('a[href="#course/contents/' +courseId+ '"]').addClass('loading-row');

            var data = {
            "options[0][name]" : "",
            "options[0][value]" : ""
            };
            data.courseid = courseId;

            MM.moodleWSCall('core_course_get_contents', data, function(contents) {
                // Removing loading icon.
                $('a[href="#course/contents/' +courseId+ '"]').removeClass('loading-row');
                var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);

                var tpl = {
                    sections: contents,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                }
                var html = MM.tpl.render(MM.plugins.contents.templates.sections.html, tpl);

                pageTitle = course.get("shortname") + " - " + MM.lang.s("contents");

                MM.panels.show("center", html, {title: pageTitle});
                if (MM.deviceType == "tablet" && contents.length > 0) {
                    $("#panel-center li:eq(1)").addClass("selected-row");
                    // First section.
                    MM.plugins.contents.viewCourseContentsSection(courseId, 0);
                }
            }, null, function(m) {
                // Error callback.
                // Removing loading icon.
                $('a[href="#course/contents/' +courseId+ '"]').removeClass('loading-row');
                if (typeof(m) !== "undefined" && m) {
                    MM.popErrorMessage(m);
                }
            });
        },


        viewCourseContentsSection: function(courseId, sectionId) {

            if (MM.deviceType == "tablet") {
                MM.panels.showLoading('right');
            }

            var data = {
            "options[0][name]" : "",
            "options[0][value]" : ""
            };
            data.courseid = courseId;

            MM.moodleWSCall('core_course_get_contents', data, function(contents) {
                var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
                var courseName = course.get("fullname");

                var firstContent = 0;

                var contentsStored = [];
                MM.db.each("contents", function(el){
                    contentsStored.push(el.get("id"));
                });

                var finalContents = [];
                $.each(JSON.parse(JSON.stringify(contents)), function(index1, sections){

                    // Skip sections deleting contents..
                    if (sectionId > -1 && sectionId != index1) {
                        // This is a continue.
                        return true;
                    }

                    $.each(sections.modules, function(index2, content){

                        content.contentid = content.id;
                        content.courseid = courseId;
                        content.id = MM.config.current_site.id + "-" + content.contentid;

                        if(!firstContent) {
                            firstContent = content.contentid;
                        }

                        // The file/s was/were downloaded.
                        var downloaded = false;

                        // This content is currently in the database.
                        if (contentsStored.indexOf(content.id) > -1) {
                            var c = MM.db.get("contents", content.id);
                            c = c.toJSON();
                            sections.modules[index2].mainExtension = c.mainExtension;
                            sections.modules[index2].webOnly = c.webOnly;
                            if (c.contents && c.contents[0] && typeof(c.contents[0].localpath) != "undefined") {
                                sections.modules[index2].contents[0].localpath = c.contents[0].localpath;
                            }

                            if (!sections.modules[index2].webOnly) {

                                if (content.modname != "folder") {
                                    var cFile = c.contents[0];
                                    downloaded = typeof(cFile.localpath) != "undefined";
                                } else {
                                    downloaded = true;
                                    $.each(c.contents, function (index5, filep) {
                                        if (typeof(filep.localpath) == "undefined") {
                                            downloaded = false;
                                        }
                                    });
                                }
                                sections.modules[index2].downloaded = downloaded;
                            }

                            // Check if our stored information has changed remotely.
                            var updateContentInDB = false;
                            var contentElements = ['filename', 'fileurl' , 'filesize',
                                'timecreated', 'timemodified', 'author', 'license'];

                            for (var indexEl in c.contents) {
                                _.each(contentElements, function(el) {
                                    if (typeof(c.contents[indexEl][el]) != "undefined" &&
                                        typeof(content.contents[indexEl][el]) != "undefined" &&
                                        c.contents[indexEl][el] != content.contents[indexEl][el]
                                        ) {
                                        updateContentInDB = true;
                                        c.contents[indexEl][el] = content.contents[indexEl][el];
                                    }
                                });
                            }

                            // Check if the content name has changed.
                            if (c.name != content.name) {
                                c.name = content.name;
                                updateContentInDB = true;
                            }

                            if (updateContentInDB) {
                                MM.db.insert("contents", c);
                            }

                            return true; // This is a continue;
                        }

                        // The mod url also exports contents but are external contents not downloadable by the app.
                        var modContents = ["folder","page","resource"];

                        if (modContents.indexOf(content.modname) == -1) {
                            content.webOnly = true;
                        } else {
                            content.webOnly = false;
                        }
                        sections.modules[index2].webOnly = content.webOnly;

                        MM.db.insert("contents", content);

                        // Sync content files.

                        if (typeof(content.contents) != "undefined") {
                            $.each(content.contents, function (index3, file) {

                                if (typeof file.fileurl == "undefined" || !file.fileurl) {
                                    return true;
                                }

                                if (file.fileurl.indexOf(MM.config.current_site.siteurl) == -1) {
                                    return true;
                                }

                                var paths = MM.plugins.contents.getLocalPaths(courseId, content.contentid, file);

                                var el = {
                                    id: hex_md5(MM.config.current_site.id + file.fileurl),
                                    url: file.fileurl,
                                    path: paths.directory,
                                    newfile: paths.file,
                                    contentid: content.id,
                                    index: index3,
                                    syncData: {
                                        name: MM.lang.s("content") + ": " + courseName + ": " + content.name,
                                        description: file.fileurl
                                    },
                                    siteid: MM.config.current_site.id,
                                    type: "content"
                                   };

                                // Disabled auto sync temporaly
                                //MM.log("Sync: Adding content: " + el.syncData.name + ": " + el.url);
                                //MM.db.insert("sync", el);

                                var extension = file.filename.substr(file.filename.lastIndexOf(".") + 1);

                                // Exception for folder type, we use the resource icon.
                                if (content.modname != "folder" && typeof(MM.plugins.contents.templates.mimetypes[extension]) != "undefined") {
                                    sections.modules[index2].mainExtension = MM.plugins.contents.templates.mimetypes[extension]["icon"];
                                    content.mainExtension = sections.modules[index2].mainExtension;
                                    MM.db.insert("contents", content);
                                }
                            });
                        }
                    });

                    finalContents.push(sections);

                });

                var tpl = {
                    sections: finalContents,
                    sectionId: sectionId,
                    courseId: courseId,
                    course: course.toJSON() // Convert a model to a plain javascript object.
                }

                var pageTitle = course.get("shortname") + " - " + MM.lang.s("contents");

                var html = MM.tpl.render(MM.plugins.contents.templates.contents.html, tpl);
                MM.panels.show('right', html, {title: pageTitle});

                // Show info content modal window.
                $(".content-info", "#panel-right").on(MM.quickClick, function(e) {
                    e.preventDefault();
                    var pos = {
                        left: e.pageX - 5,
                        top: e.pageY
                    };

                    if (MM.quickClick.indexOf("touch") > -1) {
                        pos.left = e.originalEvent.touches[0].pageX -5;
                        pos.top = e.originalEvent.touches[0].pageY;
                    }

                    MM.plugins.contents.infoContent(
                        $(this).data("course"),
                        $(this).data("section"),
                        $(this).data("content"),
                        -1,
                        pos);
                });
            });
        },

        downloadContent: function(courseId, sectionId, contentId, index){
            var file;
            var FILE_SIZE_WARNING = {
                'phone':  5000000,
                'tablet': 15000000
            };

            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();

            if (typeof(index) != "undefined") {
                file = content.contents[index];
            } else {
                file = content.contents[0];
            }

            // Now we check if we have to alert the user that is about to download a large file.
            if (file.filesize) {
                // filesize is in bytes.
                var filesize = parseInt(file.filesize);
                if (filesize > FILE_SIZE_WARNING[MM.deviceType]) {
                    var notice = MM.lang.s("noticelargefile");
                    notice += " " + MM.lang.s("filesize") + " " + MM.util.bytesToSize(filesize, 2) + "<br />";
                    notice += MM.lang.s("confirmcontinuedownload");

                    MM.popConfirm(notice, function() {
                        MM.plugins.contents.downloadContentFile(courseId, sectionId, contentId, index);
                    });
                    return;
                }
            }
            MM.plugins.contents.downloadContentFile(courseId, sectionId, contentId, index);
        },

        downloadContentFile: function(courseId, sectionId, contentId, index) {

            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();

            var downCssId = "#download-" + contentId;
            var linkCssId = "#link-" + contentId;

            if (typeof(index) != "undefined") {
                downCssId = "#download-" + contentId + "-" + index;
                linkCssId = "#link-" + contentId + "-" + index;
            } else {
                index = 0;
            }

            var file = content.contents[index];
            var downloadURL = file.fileurl + "&token=" + MM.config.current_token;

            // Now, we need to download the file.
            // First we load the file system (is not loaded yet).
            MM.fs.init(function() {
                var path = MM.plugins.contents.getLocalPaths(courseId, contentId, file);
                MM.log("Content: Starting download of file: " + downloadURL);
                // All the functions are async, like create dir.
                MM.fs.createDir(path.directory, function() {
                    MM.log("Content: Downloading content to " + path.file + " from URL: " + downloadURL);

                    $(downCssId).attr("src", "img/loadingblack.gif");

                    MM.moodleDownloadFile(downloadURL, path.file,
                        function(fullpath) {
                            MM.log("Content: Download of content finished " + fullpath + " URL: " + downloadURL);
                            content.contents[index].localpath = path.file;
                            content.contents[index].downloadtime = MM.util.timestamp();
                            MM.db.insert("contents", content);
                            $(downCssId).remove();
                            $(linkCssId).attr("href", fullpath);
                            $(linkCssId).attr("rel", "external");
                            // Android, open in new browser
                            MM.handleFiles(linkCssId);
                        },
                        function(fullpath) {
                           MM.log("Content: Error downloading " + fullpath + " URL: " + downloadURL);
                           $(downCssId).attr("src", "img/download.png");
                         });
                });
            });
        },

        viewFolder: function(courseId, sectionId, contentId, sectionName) {

            var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);
            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();

            var data = {
            "options[0][name]" : "",
            "options[0][value]" : ""
            };
            data.courseid = courseId;

            var tpl = {
                course: course,
                sectionId: sectionId,
                courseId: courseId,
                contentId: contentId,
                content: content,
                sectionName: sectionName
            };

            var html = MM.tpl.render(MM.plugins.contents.templates.folder.html, tpl);
            MM.panels.html('right', html);
            $(document).scrollTop(0);

            // Show info content modal window.
            $(".content-info", "#panel-right").on(MM.quickClick, function(e) {
                e.preventDefault();
                var pos = {
                    left: e.pageX - 5,
                    top: e.pageY
                };

                MM.plugins.contents.infoContent(
                    $(this).data("course"),
                    $(this).data("section"),
                    $(this).data("content"),
                    $(this).data("index"),
                    pos);
            });

        },

        infoContent: function(courseId, sectionId, contentId, index, i) {

            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();

            if (typeof(MM.plugins.contents.infoBox) != "undefined") {
                MM.plugins.contents.infoBox.remove();
            }

            var skipFiles = false;


            if (index === -1) {
                if (content.modname == "folder") {
                    skipFiles = true;
                }
                // Reset to a valid index.
                index = 0;
            }

            if (typeof(content.contents) == "undefined" || !content.contents[index]) {
                skipFiles = true;
            }

            var information = '<p><strong>'+content.name+'</strong></p>';
            if (typeof(content.description) != "undefined") {
                information += '<p>'+content.description+'</p>';
            }

            if (! skipFiles) {
                var file = content.contents[index];

                var fileParams = ["author", "license", "timecreated", "timemodified", "filesize", "localpath", "downloadtime"];
                for (var el in fileParams) {
                    var param = fileParams[el];
                    if (typeof(file[param]) != "undefined" && file[param]) {
                        information += MM.lang.s(param)+': ';

                        var value = file[param];

                        switch(param) {
                            case "timecreated":
                            case "timemodified":
                            case "downloadtime":
                                var d = new Date(value * 1000);
                                value = d.toLocaleString();
                                break;
                            case "filesize":
                                value = file[param] / 1024;
                                // Round to 2 decimals.
                                value = Math.round(value*100)/100 + " kb"
                                break;
                            case "localpath":
                                var url = MM.fs.getRoot() + '/' + value;
                                value = '<a href="' + url + '" rel="external">' +url + '</a>';
                                break;
                            default:
                                value = file[param];
                        }

                        information += value + '<br />';
                    }
                }
            }

            information += '<p>' + MM.lang.s("viewableonthisapp") + ': ';

            if (content.webOnly) {
                information += MM.lang.s("no");
            } else {
                information += MM.lang.s("yes");
            }
            information += "</p>";

            information += '<p><a href="'+content.url+'" target="_blank">'+content.url+'</a></p>';

            MM.plugins.contents.infoBox = $('<div id="infobox-'+contentId+'"><div class="arrow-box-contents">'+information+'</div></div>').addClass("arrow_box");
            $('body').append(MM.plugins.contents.infoBox);

            var width = $("#panel-right").width() / 1.5;
            $('#infobox-'+contentId).css("top", i.top - 30).css("left", i.left - width - 35).width(width);

            // Android, open in new browser
            MM.handleExternalLinks('#infobox-'+contentId+' a[target="_blank"]');
            MM.handleFiles('#infobox-'+contentId+' a[rel="external"]');

            // Hide the infobox on click in any link or inside itselfs
            $('#infobox-'+contentId+', a').bind('click', function(e) {
                if (typeof(MM.plugins.contents.infoBox) != "undefined") {
                    MM.plugins.contents.infoBox.remove();
                }
            });

            // Hide the infobox on scroll.
            $("#panel-right").bind("touchmove", function(){
                if (typeof(MM.plugins.contents.infoBox) != "undefined") {
                    MM.plugins.contents.infoBox.remove();
                }
            });

        },

        showLabel: function(courseId, sectionId, contentId) {
            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();
            if (content.description) {
                content.description = MM.util.formatText(content.description);
                $("#link-" + contentId + " h3").html(content.description);
                MM.handleExternalLinks('#link-' + contentId + ' h3 a[target="_blank"]');
            }
            $("#link-" + contentId).attr("href", $("#link-" + contentId).attr("href").replace("label", "hidelabel"));
            $("#link-" + contentId).toggleClass("collapse-label expand-label");
        },

        hideLabel: function(courseId, sectionId, contentId) {
            var content = MM.db.get("contents", MM.config.current_site.id + "-" + contentId);
            content = content.toJSON();
            $("#link-" + contentId + " h3").html(content.name);
            $("#link-" + contentId).attr("href", $("#link-" + contentId).attr("href").replace("hidelabel", "label"));
            $("#link-" + contentId).toggleClass("collapse-label expand-label");
        },

        getLocalPaths: function(courseId, modId, file) {

            var filename = file.fileurl;
            var paramsPart = filename.lastIndexOf("?");
            if (paramsPart) {
                filename = filename.substring(0, paramsPart);
            }
            filename = filename.substr(filename.lastIndexOf("/") + 1);

            // MOBILE-401, replace white spaces by "_"
            filename = decodeURIComponent(filename);
            filename = filename.replace(" ", "_");

            // We store in the sdcard the contents in site/course/modname/id/contentIndex/filename
            var path = MM.config.current_site.id + "/" + courseId + "/" + modId;

            var newfile = path + "/" + filename;

            return {
                directory: path,
                file: newfile
            }
        },

        getModuleIcon: function(moduleName) {
            var mods = ["assign", "assignment", "book", "chat", "choice",
            "data", "database", "date", "external-tool", "feedback", "file",
            "folder", "forum", "glossary", "ims", "imscp", "label", "lesson",
            "lti", "page", "quiz", "resource", "scorm", "survey", "url", "wiki", "workshop"
            ];

            if (mods.indexOf(moduleName) < 0) {
                moduleName = "external-tool";
            }

            return "img/mod/" + moduleName + ".png";
        },

        templates: {
            "folder": {
                html: folderTpl
            },
            "contents": {
                html: contentsTpl
            },
            "sections": {
                html: sectionsTpl
            },
            "mimetypes": JSON.parse(mimeTypes)
        }
    }

    MM.registerPlugin(plugin);
});
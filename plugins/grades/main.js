var templates = [
    "root/externallib/text!root/plugins/grades/activities.html",
    "root/externallib/text!root/plugins/grades/activities_total.html",
    "root/externallib/text!root/plugins/grades/grades_table.html"
];

define(templates,function (activities, activitiesTotal, gradesTable) {
    var plugin = {
        settings: {
            name: "grades",
            type: "course",
            menuURL: "#course/grades/",
            lang: {
                component: "core"
            }
        },

        routes: [
            ["course/grades/:courseid", "course_grades_activities", "viewActivities"],
            ["course/grades/user/:courseid/:userid/:popup", "course_grades_user", "loadGradesTable"]
        ],

        wsName: "",

        isPluginVisible: function() {
            // We store the WSName for later uses.
            // Since there is a but in older version of the core_grades_get_grades
            // we only allow to use the local_mobile plugin or an upgraded Moodle version

            if (MM.util.wsAvailable('local_mobile_gradereport_user_get_grades_table')) {
                MM.plugins.grades.wsName = 'local_mobile_gradereport_user_get_grades_table';
                return true;
            }

            if (MM.util.wsAvailable('gradereport_user_get_grades_table')) {
                MM.plugins.grades.wsName = 'gradereport_user_get_grades_table';
                return true;
            }

            if (MM.util.wsAvailable('local_mobile_core_grades_get_grades')) {
                MM.plugins.grades.wsName = 'local_mobile_core_grades_get_grades';
                return true;
            }

            if (MM.util.wsAvailable('core_grades_get_grades') &&
                    parseInt(MM.config.current_site.version, 10) >= 2014101000) {

                MM.plugins.grades.wsName = 'core_grades_get_grades';
                return true;
            }

            return false;
        },

        viewActivities: function(courseId) {

            // Adding loading icon.
            var menuEl = 'a[href="#course/grades/' + courseId + '"]';
            $(menuEl, '#panel-left').addClass('loading-row');

            MM.panels.showLoading('center');

            // Three different options for retrieving grades (depending on app version and/or Moodle version):
            // 1. Using the gradereport grades table function (recommended). It returns the complete grades table.
            // 2. Using the old WS grades_get_grades that only returns activity and total course grade.
            // 3. Using the old WS grades_get_grades that only returns activity grades.

            // Option 1.
            if (MM.plugins.grades.wsName.indexOf("gradereport_user_get_grades_table") > -1) {
                MM.plugins.grades.loadGradesTable(courseId, MM.config.current_site.userid);
            } else {
                // Option 2 and 3.

                var data = {
                    "options[0][name]" : "",
                    "options[0][value]" : ""
                };
                data.courseid = courseId;

                MM.moodleWSCall('core_course_get_contents', data, function(contents) {
                    var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);

                    var tpl = {
                        sections: contents,
                        course: course.toJSON() // Convert a model to a plain javascript object.
                    };

                    // Now, this is a dirty hack necessary.
                    // Depending on the local mobile version we can retrieve all the grades with the course total or
                    // we should ask grade by grade
                    var unsupportedVersions = ["2014052805", "2014060200", "2014060300", "2014060400", "2014060401", "2014052806",
                                                "2014060201", "2014060301", "2014060402"];

                    // Check local_mobile version and Moodle version.
                    var currentVersion = MM.util.wsVersion("local_mobile_core_grades_get_grades");
                    if (MM.util.wsAvailable('core_grades_get_grades') ||
                            unsupportedVersions.indexOf(currentVersion) == -1) {

                        MM.plugins.grades._loadAllGrades(tpl, menuEl);
                    } else {
                        MM.plugins.grades._loadGradeByGrade(tpl);
                        $(menuEl, '#panel-left').removeClass('loading-row');
                    }
                });
            }
        },

        /**
         * Creates an HTML table used the information in the JSON object
         * @param  {Object} table JSON object representing a table with data
         * @return {string}       HTML table
         */
        _createTable: function(table) {
            if (!table || !table.tables) {
                return "";
            }

            // Columns, by order.
            var columns = ["itemname", "weight","grade","range","percentage","lettergrade","rank","average","feedback", "contributiontocoursetotal"];
            var returnedColumns = [];

            var tabledata = [];
            var maxDepth = 0;
            // Check columns returned (maybe some of the above).
            if (table.tables && table.tables[0] && table.tables[0]['tabledata']) {
                tabledata = table.tables[0]['tabledata'];
                maxDepth = table.tables[0]['maxdepth'];
                for (var el in tabledata) {
                    // This is a typical row.
                    if (typeof tabledata[el]["leader"] == "undefined") {
                        for (var col in tabledata[el]) {
                            returnedColumns.push(col);
                        }
                        break;
                    }
                }
            }

            var html = "";

            var returnedColumnsLenght = returnedColumns.length;

            if (returnedColumnsLenght > 0) {

                // Reduce the returned columns for phone version.
                if (MM.deviceType == "phone") {
                    returnedColumns = ["itemname", "grade"];
                }

                html = '<table cellspacing="0" cellpadding="0" class="user-grade boxaligncenter generaltable user-grade">';
                html += '<thead>';

                var colName, extra;

                for (var el in columns) {
                    extra = "";
                    colName = columns[el];

                    if (returnedColumns.indexOf(colName) > -1) {
                        if (colName == "itemname") {
                            extra = ' colspan="' + maxDepth + '" ';
                        }
                        html += '<th id="' + colName + '" class="header" '+extra+'>' + MM.lang.s(colName) + '</th>';
                    }
                }

                html += '</thead><tbody>';

                var name, rowspan, tclass, colspan, content, celltype, id, headers,j, img, colspanVal;

                var len = tabledata.length;
                for (var i = 0; i < len; i++) {
                    html += "<tr>\n";
                    if (typeof(tabledata[i]['leader']) != "undefined") {
                        rowspan = tabledata[i]['leader']['rowspan'];
                        tclass = tabledata[i]['leader']['class'];
                        html += '<td class="' + tclass + '" rowspan="' + rowspan + '"></td>' + "\n";
                    }
                    for (el in returnedColumns) {
                        name = returnedColumns[el];

                        if (typeof(tabledata[i][name]) != "undefined") {
                            tclass = (typeof(tabledata[i][name]['class']) != "undefined")? tabledata[i][name]['class'] : '';
                            colspan = (typeof(tabledata[i][name]['colspan']) != "undefined")? "colspan='"+tabledata[i][name]['colspan']+"'" : '';
                            content = (typeof(tabledata[i][name]['content']) != "undefined")? tabledata[i][name]['content'] : null;
                            celltype = (typeof(tabledata[i][name]['celltype']) != "undefined")? tabledata[i][name]['celltype'] : 'td';
                            id = (typeof(tabledata[i][name]['id']) != "undefined")? "id='" + tabledata[i][name]['id'] +"'" : '';
                            headers = (typeof(tabledata[i][name]['headers']) != "undefined")? "headers='" + tabledata[i][name]['headers'] + "'" : '';

                            if (typeof(content) != "undefined") {
                                img = MM.plugins.grades._findImage(content);
                                content = content.replace(/<\/span>/gi, "\n");
                                content = MM.util.cleanTags(content);
                                content = content.replace("\n", "<br />");
                                content = img + " " + content;

                                html += "<" + celltype + " " + id + " " + headers + " " + "class='"+ tclass +"' " + colspan +">";
                                html += content;
                                html += "</" + celltype + ">\n";
                            }
                        }
                    }
                    html += "</tr>\n";
                }

                html += '</tbody></table>';
            }

            return html;
        },

        loadGradesTable: function(courseId, userId, popUp) {
            var menuEl = 'a[href="#course/grades/' + courseId + '"]';
            popUp = popUp || false;

            var data = {
                "courseid" : courseId,
                "userid"   : userId
            };

            MM.moodleWSCall(MM.plugins.grades.wsName, data,
                function(table) {
                    var course = MM.db.get("courses", MM.config.current_site.id + "-" + courseId);

                    var tpl = {
                        table: MM.plugins.grades._createTable(table),
                        course: course.toJSON(),
                        popUp: popUp
                    };

                    var html = MM.tpl.render(MM.plugins.grades.templates.gradesTable.html, tpl);

                    // Display as popup in the right side (from participants page).
                    if (popUp) {
                        MM.panels.show("right", html, {keepTitle: true});
                    } else {
                        $(menuEl, '#panel-left').removeClass('loading-row');
                        MM.panels.show("center", html, {title: MM.util.formatText(course.get("fullname")), hideRight: true});
                    }
                },
                {},
                function(e) {
                    if (!popUp) {
                        $(menuEl, '#panel-left').removeClass('loading-row');
                    }
                    if (e) {
                        MM.popErrorMessage(e);
                    }
                }
            );
        },

        _loadAllGrades: function(tpl, menuEl) {

            var data = {
                "courseid" : tpl.course.courseid,
                "userids[0]" : MM.config.current_site.userid
            };

            MM.moodleWSCall(MM.plugins.grades.wsName, data,
                // Succes callback.
                function(grades) {

                    // Now we should create a correct data structure for the grades.
                    var userGrades = {};

                    if (grades.items && grades.items.length > 0) {
                        _.each(grades.items, function(item) {
                            userGrades[item.activityid] = item;
                            userGrades[item.activityid].user = [];
                            if (item.grades && item.grades.length > 0) {
                                _.each(item.grades, function(userGrade) {
                                    userGrades[item.activityid].user[userGrade.userid] = {grade: null, outcome: null};
                                    userGrades[item.activityid].user[userGrade.userid]["grade"] = userGrade;
                                });
                            }
                        });
                    }

                    if (grades.outcomes && grades.outcomes.length > 0) {
                        _.each(grades.outcomes, function(outcome) {
                            if (!userGrades[outcome.activityid]) {
                                userGrades[outcome.activityid] = outcome;
                                userGrades[outcome.activityid].user = [];
                            }
                            if (outcome.grades && outcome.grades.length > 0) {
                                _.each(outcome.grades, function(userGrade) {
                                    if (typeof userGrades[outcome.activityid].user[userGrade.userid] == "undefined") {
                                        userGrades[outcome.activityid].user[userGrade.userid] = {grade: null, outcome: null};
                                    }
                                    userGrades[outcome.activityid].user[userGrade.userid]["outcome"] = userGrade;
                                });
                            }
                        });
                    }

                    // Add a section for the course total.
                    var newModule = userGrades["course"];
                    newModule.id = "course";

                    var newSection = {
                        id: "course",
                        name: MM.util.formatText(tpl.course.fullname),
                        modules: [newModule]
                    };
                    tpl.sections.push(newSection);

                    // Final data structure with the sections to display.
                    var finalSections = {};
                    var userId = MM.config.current_site.userid;

                    _.each(tpl.sections, function(section) {
                        if (typeof(section.modules) != "undefined" && section.modules.length > 0) {
                            _.each(section.modules, function(module) {
                                if (typeof userGrades[module.id] != "undefined") {
                                    if (typeof finalSections[section.id] == "undefined") {
                                        newSection = {
                                            id: section.id,
                                            name: section.name,
                                            modules: []
                                        };
                                        finalSections[section.id] = newSection;
                                    }
                                    module.grade = {
                                        grade: "-",
                                        range: "-",
                                        percentage: "-",
                                        feedback: "-"
                                    };

                                    var min = userGrades[module.id]["grademin"];
                                    var max = userGrades[module.id]["grademax"];
                                    if (min || max) {
                                        module.grade.range = min + " - " + max;
                                    }

                                    if (typeof userGrades[module.id].user[userId] != "undefined" &&
                                            userGrades[module.id].user[userId].grade) {

                                        gradeInfo = userGrades[module.id].user[userId].grade;

                                        module.grade.grade = gradeInfo["str_long_grade"];
                                        module.grade.feedback = MM.util.formatText(gradeInfo["str_feedback"], true);
                                        numGrade = gradeInfo["grade"];

                                        var div = max - min;
                                        if (numGrade && div) {
                                            module.grade.percentage = ((numGrade - min) * 100) / (div);
                                            module.grade.percentage += " %";
                                        }
                                    }

                                    finalSections[section.id].modules.push(module);
                                }
                            });
                        }
                    });

                    $(menuEl, '#panel-left').removeClass('loading-row');

                    tpl.sections = finalSections;
                    var html = MM.tpl.render(MM.plugins.grades.templates.activitiesTotal.html, tpl);
                    MM.panels.show("center", html, {title: MM.lang.s("grades"), hideRight: true});
                },
                {},
                // Error callback.
                function(e) {
                    MM.plugins.grades._loadGradeByGrade(tpl);
                }
            );
        },

        _loadGradeByGrade: function(tpl) {
            var html = MM.tpl.render(MM.plugins.grades.templates.activities.html, tpl);

            MM.panels.show("center", html, {title: MM.lang.s("grades"), hideRight: true});

            var id;
            // Now, load grades for all the elements
            $(".grade").each(function() {
                id = $(this).attr("id");
                if (id) {
                    MM.plugins.grades._getGradeForActivity(id);
                }
            });
        },

        _getGradeForActivity: function(id) {

            var info = id.split("-");

            var data = {
                "courseid" : parseInt(info[3]),
                "component" : "mod_" + info[4],
                "activityid" : parseInt(info[5]),
                "userids[0]" : MM.config.current_site.userid
            };

            var grade = "--";
            var range = "--";
            var percentage = "--";
            var feedback = "--";

            MM.moodleWSCall(MM.plugins.grades.wsName, data,
                // Succes callback.
                function(contents) {

                    if (contents.items && contents.items[0]) {
                        var min = contents.items[0]["grademin"];
                        var max = contents.items[0]["grademax"];
                        range = min + " - " + max;

                        if (contents.items[0]["grades"] && contents.items[0]["grades"][0]) {
                            gradeInfo = contents.items[0]["grades"][0];

                            grade = gradeInfo["str_long_grade"];
                            feedback = MM.util.formatText(gradeInfo["str_feedback"], true);
                            numGrade = gradeInfo["grade"];

                            var div = max - min;
                            if (numGrade && div) {
                                percentage = ((numGrade - min) * 100) / (div);
                                percentage += " %";
                            }
                        }
                    }

                    if (contents.outcomes && contents.outcomes[0] &&
                        contents.outcomes[0]["grades"] && contents.outcomes[0]["grades"][0]) {
                        var strGrade = contents.outcomes[0]["grades"][0]["str_grade"];
                        grade += " (" + strGrade + ")";
                    }

                    $("#" + id).html(grade);
                    $("#" + id.replace("-grade-", "-range-")).html(range);
                    $("#" + id.replace("-grade-", "-percentage-")).html(percentage);
                    $("#" + id.replace("-grade-", "-feedback-")).html(feedback);

                },
                {},
                // Error callback.
                function(e) {
                    var error;

                    if (typeof e == "string") {
                        error = e;
                    } else {
                        error = MM.lang.s("errorretrievinggradeinformation");
                    }
                    $("#" + id).html(error);
                    $("#" + id.replace("-grade-", "-range-")).html(error);
                    $("#" + id.replace("-grade-", "-percentage-")).html(error);
                    $("#" + id.replace("-grade-", "-feedback-")).html(error);
                }
            );

        },

        _findImage: function(text) {
            var img = "";

            if (text.indexOf("/agg_mean") > -1) {
                img = '<img src="img/grades/agg_mean.png" width="16">';
            } else if (text.indexOf("/agg_sum") > -1) {
                img = '<img src="img/grades/agg_sum.png" width="16">';
            } else if (text.indexOf("/outcomes") > -1) {
                img = '<img src="img/grades/outcomes.png" width="16">';
            } else if (text.indexOf("i/folder") > -1) {
                img = '<img src="img/folder.png" width="16">';
            } else if (text.indexOf("/manual_item") > -1) {
                img = '<img src="img/grades/manual_item.png" width="16">';
            } else if (text.indexOf("/mod/") > -1) {
                var module = text.match(/mod\/([^\/]*)\//);
                if (typeof module[1] != "undefined") {
                    img = '<img src="img/mod/' + module[1] + '.png" width="16">';
                }
            }
            if (img) {
                img = '<span class="app-ico">' + img + '</span>';
            }
            return img;
        },

        templates: {
            "activities": {
                html: activities
            },
            "activitiesTotal": {
                html: activitiesTotal
            },
            "gradesTable": {
                html: gradesTable
            }
        }
    };

    MM.registerPlugin(plugin);
});
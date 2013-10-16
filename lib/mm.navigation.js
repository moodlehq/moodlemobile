MM.navigation = {
    /**
     * Is the current navigation bar visible?
     * @val {bool}
     */
    isVisible: false,

    render:function(panel, values) {
        var output = MM.tpl.render(
            $('#menu_template').html(),
            values
        );
        MM.panels.html(panel, output);

        $('.submenu').hide();
        $('.toogler').bind(MM.getClickType(), function(e) {

            // This prevents open the toggler when we are scrolling.
            if (MM.getTouchMoving()) {
                MM.setTouchMoving(false);
            } else {
                $(this).next().slideToggle(300);
                $(this).toggleClass("collapse expand");
            }
        });
    },

    /**
     * Shows the menu if applicable
     */
    show: function(settings) {
        MM.navigation.menuShow(true, settings)
    },

    hide: function() {
        MM.navigation.menuShow(false, settings);
    },

    /**
     * Displays/hide the main left menu
     *
     * @param {boolean} show Show or hide.
     * @param {Object} settings Extra settngs.
     */
    menuShow: function(show, settings) {

        // Clear modal panels.
        if (typeof(MM.plugins.contents.infoBox) != "undefined") {
            MM.plugins.contents.infoBox.remove();
        }

        if (!settings) {
            settings = {
                animate: true,
                hideRight: false
            };
        }

        if (typeof(settings.animate) == 'undefined') {
            settings.animate = true;
        }

        if (MM.panels.hideRight) {
            settings.hideRight = true;
        }

        if (typeof show != 'undefined') {
            if (show && MM.navigation.isVisible) {
                return;
            }
            if (!show && !MM.navigation.isVisible) {
                return;
            }
        }

        $('#panel-left, #panel-center, #panel-right, .header-wrapper').css(
            "-webkit-transition", ""
        );

        // If the navigation is hidden then show it.
        if (!MM.navigation.isVisible) {

            var sizes = {
                center: {
                    left:   MM.panels.sizes.threePanels.left,
                    width:  MM.panels.sizes.threePanels.center
                },
                right: {
                    left:   MM.panels.sizes.threePanels.left + MM.panels.sizes.threePanels.center,
                    width:  MM.panels.sizes.threePanels.right
                },
                wrapper: {
                    left:   MM.panels.sizes.twoPanels.center,
                    width:  MM.panels.sizes.twoPanels.right
                }
            };

            if (settings.hideRight) {
                sizes.right.left = '100%';
                sizes.center.width = MM.panels.sizes.twoPanels.center;
            }

            if (!settings.animate) {
                $('#panel-left').css('display', 'block');
                $('#panel-center').css('left', sizes.center.left).css(
                    'width', sizes.center.width
                );
                $('#panel-right').css('left', sizes.right.left).css(
                    'width', sizes.right.width
                );
                MM.util.applyOverflow('center');
                MM.util.applyOverflow('right');
                $('.header-wrapper').css('left', sizes.wrapper.left).css(
                    'width', sizes.wrapper.width
                );
                MM.navigation.hidden = false;
                return;
            }

            if (MM.getConfig("dev_css3transitions")) {
                MM.log("Using CSS3 transitions");

                $('#panel-left').css('display', 'block');
                $('#panel-center, #panel-right, .header-wrapper').css(
                    "-webkit-transition", "left 0.3s ease-in, width 0.3s ease-in"
                );

                $('#panel-center').css('left', sizes.center.left).css(
                    'width', sizes.center.width
                );
                $('#panel-right').css('left', sizes.right.left).css(
                    'width', sizes.right.width
                );
                $('.header-wrapper').css('left', sizes.wrapper.left);

                setTimeout(function () {
                    $('.header-wrapper').css('width', sizes.wrapper.width);
                    MM.util.applyOverflow('center');
                    MM.util.applyOverflow('right');
                }, 500);

                MM.navigation.isVisible = true;
                return;
            }

            $('#panel-left').css('display', 'block');
            $('#panel-center').animate({
                left: sizes.center.left,
                width: sizes.center.width,
                avoidTransforms: true
            }, 300, function() {
                MM.navigation.isVisible = true;
                MM.util.applyOverflow('center');
            });

            $('#panel-right').animate({
                left: sizes.right.left,
                width: sizes.right.width,
                avoidTransforms: true
            }, 300, function() {
                MM.util.applyOverflow('right');
            });

            $('.header-wrapper').animate({
                left: sizes.wrapper.left,
                width: sizes.wrapper.width,
                avoidTransforms: true
            }, 300);
        } else {
            var sizes = {
                center: {
                    left:   '0px',
                    width:  MM.panels.sizes.twoPanels.center
                },
                right: {
                    left:   MM.panels.sizes.twoPanels.center,
                    width:  MM.panels.sizes.twoPanels.right
                },
                wrapper: {
                    left:   '0px',
                    width:  '100%'
                }
            };

            if (settings.hideRight) {
                sizes.right.left = '100%';
                sizes.center.width = '100%';
            }

            if (!settings.animate) {
                $('#panel-left').css('display', 'none');
                $('#panel-center').css('left', sizes.center.left).css(
                    'width', sizes.center.width
                );
                $('#panel-right').css('left', sizes.right.left).css(
                    'width', sizes.right.width
                );
                MM.util.applyOverflow('center');
                MM.util.applyOverflow('right');
                $('.header-wrapper').css('left', sizes.wrapper.left).css(
                    'width', sizes.wrapper.width
                );
                MM.navigation.isVisible = false;
                return;
            }

            if (MM.getConfig("dev_css3transitions")) {
                MM.log("Using CSS3 transitions");

                $('#panel-center, #panel-right, .header-wrapper').css(
                    "-webkit-transition", "left 0.3s ease-in, width 0.3s ease-in"
                );

                $('#panel-center').css('left', sizes.center.left).css(
                    'width', sizes.center.width
                );
                $('#panel-right').css('left', sizes.right.left).css(
                    'width', sizes.right.width
                );
                $('.header-wrapper').css('left', sizes.wrapper.left).css(
                    'width', sizes.wrapper.width
                );

                setTimeout(function () {
                    $('#panel-left').css('display', 'none');
                    MM.util.applyOverflow('center');
                    MM.util.applyOverflow('right');
                }, 500);

                MM.navigation.isVisible = false;
                return;
            }

            $('#panel-center').animate({
                left: sizes.center.left,
                width: sizes.center.width,
                avoidTransforms: true
            }, 300, function() {
                MM.navigation.isVisible = false;
                MM.util.applyOverflow('center');
                $('#panel-left').css('display', 'none');
            });

            $('#panel-right').animate({
                left: sizes.right.left,
                width: sizes.right.width,
                avoidTransforms: true
            }, 300, function() {
                MM.util.applyOverflow('right');
            });

            $('.header-wrapper').animate({
                left: sizes.wrapper.left,
                width: sizes.wrapper.width,
                avoidTransforms: true
            }, 300);
        }
    }
}
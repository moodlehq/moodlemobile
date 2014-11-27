// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

/**
 * @fileoverview Moodle mobile panels lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile panels functionallity.
 */
MM.panels = {

	menuStatus: false,
	hideRight: false,
	currentPanel: 'left',
	previousPanel: '',
	previousPanelPageTitle: '',
	nextPanelPageTitle: '',
	activeMenuElement: null,
	sizes: {
		welcomePanel: {left:0 , center:0, right:0},
		twoPanels:    {left:0 , center:0, right:0},
		threePanels:  {left:0 , center:0, right:0}
	},

	/**
	 * Inserts html in a panel
	 * @param {string} position The panel where insert the html.
	 * @param {string} html The html to be inserted.
	 */
	html: function(position, html) {
		// If we are in the center or right panel, we need to add a small br for preventing contents half displayed.
		if (position != "left") {
			html += "<br />";
		}
		$('#panel-' + position).html(html);
		// For Android, we open external links in a system browser. _blank -> external browser
		MM.handleExternalLinks('#panel-'+position+'  a[target="_blank"]');
		// external -> External resources to the app
		MM.handleFiles('#panel-'+position+' a[rel="external"]');

		// Handle active rows.
		if (MM.deviceType == "tablet" && position == "center") {
			$("#panel-center li > a").bind(MM.clickType, function(e) {
				MM.panels.activeMenuElement = this;
			});
		}

		// When the right panel is loading, we switch the active row from left
		if (MM.deviceType == "tablet" && position == "right") {
			if (MM.panels.activeMenuElement) {
				$("#panel-center li > a").parent().removeClass("selected-row");
				$(MM.panels.activeMenuElement).parent().addClass("selected-row");
				MM.panels.activeMenuElement = null;
			}
		}

		// Apply scrolling overflows to content.
		if(position != "left") {
			MM.util.applyOverflow(position);
		}

	},

	/**
	 * Show de loading icon in a panel
	 * @param {string} position The panel where to show the loading icon.
	 */
	showLoading: function(position) {
		MM.panels.html(position, '<div class="loading-icon"><img src="img/loadingblack.gif"></div>');
	},

	/**
	 * Hides a panel
	 *
	 * @param {string} position The panel to be hide.
	 * @param {boolean} clear On tablet, when to clear the right panel.
	 */
	hide: function(position, clear) {

		if (typeof(clear) == 'undefined') {
			clear = true;
		}

		if (MM.deviceType == 'tablet') {
			if (position == 'right') {
				$('#panel-right').css('left', '100%');
				if (MM.panels.menuStatus) {
					$('#panel-center').css("width", MM.panels.sizes.welcomePanel.center);
					$("#panel-center").css("left",  MM.panels.sizes.welcomePanel.left);
				} else {
					$('#panel-center').css("width", "100%");
				}
			}

			if (clear) {
				$('#panel-right').html('');
			}
		}
	},

	/**
	 * Shows a panel with some content
	 *
	 * @param {string} position The panel to be showed.
	 * @param {string} content The content to be added to the panel.
	 * @param {Object} settings Extra settings.
	 */
	show: function(position, content, settings) {

		var pageTitle	= $("#page-title");
		var panelLeft	= $('#panel-left');
		var panelCenter = $('#panel-center');
		var panelRight	= $('#panel-right');

		MM.panels.html(position, content);
		MM.panels.currentPanel = position;

		if (MM.deviceType == 'tablet') {
			// Clean the page title.
			if (!settings || !settings.keepTitle) {
				pageTitle.html("");
			}

			MM.panels.hideRight = false;
			if (settings && settings.hideRight) {
				MM.panels.hideRight = true;
			}
			if (settings && settings.title) {
				pageTitle.html(settings.title);
			}
			MM.panels.menuShow(false, settings);
		} else {
			// Clean the page title.
			MM.panels.previousPanelPageTitle = pageTitle.html();
			if (!settings || !settings.keepTitle) {
				pageTitle.html("");
			}

			// Short text for page title (MOBILE-462).
			// We can't do this using CSS text-overflow because of the header dynamic width.
			if (settings && settings.title) {
				settings.title = MM.util.shortenText(settings.title, 35);
			}

			if (position == 'center') {
				// Detect if we are in the center.
				if (panelCenter.css('display') == 'block') {
					$(".header-main .nav-item.home").removeClass("menu-back").addClass("menu-home");
					if (settings && settings.title) {
						pageTitle.html(settings.title);
					}
					$(document).scrollTop(0);
					return;
				}
				panelRight.css('display', 'none');
				panelLeft.animate({
					left: '-100%'
				  }, 300, function() { $(this).css('display', 'none') });

				panelCenter.css('display','block');
				panelCenter.animate({
					left: 0
				  }, 300, function () {
						$(".header-main .nav-item.home").removeClass("menu-back").addClass("menu-home");
						if (settings && settings.title) {
							pageTitle.html(settings.title);
						}
						$(document).scrollTop(0);
					});

				$('.header-wrapper').animate({
					left: 0
				  }, 300);

			} else if (position == 'right') {
				// Detect if we are currently at the right.
				// This is possible since there are 4 level pages (contents folder)
				var contentWidth = parseInt(panelRight.css("width"));
				if (panelRight.css('display') != 'block') {
					contentWidth = $(document).innerWidth() + 50;
					panelRight.css("width", contentWidth);
				}
				$("#panel-right .content-index").css("width", contentWidth - 50);

				panelCenter.animate({
					left: '-100%'
				  }, 300, function() { $(this).css('display', 'none') });

				panelRight.css('display','block');
				panelRight.animate({
					left: 0
				  }, 300, function(){
					$(".header-main .nav-item.home").removeClass("menu-home").addClass("menu-back");
					if (settings && settings.title) {
						pageTitle.html(settings.title);
					}
					$(document).scrollTop(0);
				});
			}
		}
	},

	/**
	 * Go back button and event only for phone
	 * Implements the animation for going back.
	 * @param {function} callBack Call back function when animation ends.
	 *
	 */
	goBack: function(callBack) {

		// We must be sure that we are in a phone
		if (MM.deviceType != "phone") {
			return;
		}

		var hideHeader = false;

		// Clear modal panels.
		if (typeof(MM.plugins.contents.infoBox) != "undefined") {
			MM.plugins.contents.infoBox.remove();
		}

		if ($('#panel-center').css('display') == 'block') {
			hideHeader = true;
			hidePanel = '#panel-center';
			showPanel = '#panel-left';
			MM.panels.currentPanel = 'left';
			MM.panels.previousPanel = 'center';
		}
		else if ($('#panel-right').css('display') == 'block') {
			hidePanel = '#panel-right';
			showPanel = '#panel-center';
			MM.panels.currentPanel = 'center';
			MM.panels.previousPanel = 'right';
		}
		// Main menu panel.
		else {
			if (navigator.app && navigator.app.exitApp) {
				// Exits the app.
				navigator.app.exitApp();
			}
			return;
		}

		// Update the url without navigation. This is for avoid keeping in the url the current feature.
		MM.Router.navigate("");

		$(hidePanel).animate({
			left: '100%'
		  }, 300, function() { $(this).css('display', 'none'); });

		$(showPanel).css('display', 'block');
		$(showPanel).animate({
			left: 0,
			display: 'block'
		  }, 300, function() {
			$(this).css('display', 'block');
			if (showPanel == "#panel-right") {
				$(".header-main .nav-item.home").removeClass("menu-home").addClass("menu-back");
			} else {
				$(".header-main .nav-item.home").removeClass("menu-back").addClass("menu-home");
			}
			MM.panels.nextPanelPageTitle = $("#page-title").html();
			$("#page-title").html(MM.panels.previousPanelPageTitle);
			$(document).scrollTop(0);
			if (typeof(callBack) === "function") {
				callBack();
			}
		});

		if (hideHeader) {
			$("#page-title").html("");
			$('.header-wrapper').animate({
				left: '100%'
			  }, 300);
		}
	},

	/**
	 * Go front button and event
	 * Implements the animation for going front.
	 */
	goFront: function(callBack) {
		var showBackArrow = false;

		// Clear modal panels.
		if (typeof(MM.plugins.contents.infoBox) != "undefined") {
			MM.plugins.contents.infoBox.remove();
		}

		if ($('#panel-left').css('display') == 'block') {
			hidePanel = '#panel-left';
			showPanel = '#panel-center';

			if (MM.panels.previousPanel != 'center') {
				return;
			}

		}
		else if ($('#panel-center').css('display') == 'block') {
			hidePanel = '#panel-center';
			showPanel = '#panel-right';

			if (MM.panels.previousPanel != 'right') {
				return;
			}
			showBackArrow = true;
		}
		else {
			return;
		}

		$(hidePanel).animate({
			left: '-100%'
		  }, 300, function() {
			$(this).css('display', 'none');
		  });

		$(showPanel).animate({
			left: 0
		  }, 300, function() {
			$(this).css('display', 'block');
			if (MM.deviceType == "phone") {
				if (showBackArrow) {
					$(".header-main .nav-item.home").removeClass("menu-home").addClass("menu-back");
				} else {
					$(".header-main .nav-item.home").removeClass("menu-back").addClass("menu-home");
				}
				MM.panels.previousPanelPageTitle = $("#page-title").html();
				$("#page-title").html(MM.panels.nextPanelPageTitle);
				$(document).scrollTop(0);
				if (typeof(callBack) === "function") {
					callBack();
				}
			}
		  });

		$('.header-wrapper').animate({
			left: '0%'
		  }, 300);

	},

	/**
	 * Displays/hide the main left menu
	 *
	 * @param {boolean} show Show or hide.
	 * @param {Object} settings Extra settngs.
	 */
	menuShow: function(show, settings) {

		var headerWrapper	= $(".header-wrapper");
		var panelLeft		= $('#panel-left');
		var panelCenter 	= $('#panel-center');
		var panelRight		= $('#panel-right');

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
			if (show && MM.panels.menuStatus) {
				return;
			}
			if (!show && !MM.panels.menuStatus) {
				return;
			}
		}

		panelLeft.css("-webkit-transition", "");
		panelCenter.css("-webkit-transition", "");
		panelRight.css("-webkit-transition", "");
		headerWrapper.css("-webkit-transition", "");


		// Menu is currently hidden, so we are going to make it visible.
		if (!MM.panels.menuStatus) {

			var sizes = {
				center: {
					left:	MM.panels.sizes.threePanels.left,
					width:	MM.panels.sizes.threePanels.center
				},
				right: {
					left:	MM.panels.sizes.threePanels.left + MM.panels.sizes.threePanels.center,
					width:	MM.panels.sizes.threePanels.right
				},
				wrapper: {
					left:	MM.panels.sizes.twoPanels.center,
					width: 	MM.panels.sizes.twoPanels.right
				}
			};

			// In this case, we are about to display the left menu.
			// But the right panel is currently hidden.
			// So we have to be sure that the right panel is going to be still hidden.
			if (panelRight.css('left') == "100%" || parseInt(panelRight.css('left')) >= $(document).innerWidth()) {
				settings.hideRight = true;
			}

			if (settings.hideRight) {
				sizes.right.left = '100%';
				sizes.center.width = MM.panels.sizes.welcomePanel.center;
			}

			if (!settings.animate) {
				panelLeft.css('display', 'block');
				panelCenter.css('left', sizes.center.left).css('width', sizes.center.width);
				panelRight.css('left', sizes.right.left).css('width', sizes.right.width);
				MM.util.applyOverflow('center');
				MM.util.applyOverflow('right');
				$('.header-wrapper').css('left', sizes.wrapper.left).css('width', sizes.wrapper.width);
				MM.panels.menuStatus = true;
				return;
			}

			if (MM.getConfig("dev_css3transitions")) {
				MM.log("Using CSS3 transitions");

				panelLeft.css('display', 'block');
				$('#panel-center, #panel-right, .header-wrapper').css("-webkit-transition", "left 0.3s ease-in, width 0.3s ease-in");

				panelCenter.css('left', sizes.center.left).css('width', sizes.center.width);
				panelRight.css('left', sizes.right.left).css('width', sizes.right.width);
				headerWrapper.css('left', sizes.wrapper.left);

				setTimeout(function () {
					headerWrapper.css('width', sizes.wrapper.width);
					MM.util.applyOverflow('center');
					MM.util.applyOverflow('right');
				}, 500);

				MM.panels.menuStatus = true;
				return;
			}

			panelLeft.css('display', 'block');
			panelCenter.animate({
				left: sizes.center.left, width: sizes.center.width, avoidTransforms: true
			  	}, 300, function() {
					MM.panels.menuStatus = true;
					MM.util.applyOverflow('center');
				});

			panelRight.animate({
				left: sizes.right.left, width: sizes.right.width, avoidTransforms: true
			  	}, 300, function() {
				   MM.util.applyOverflow('right');
				});

			headerWrapper.animate({
				left: sizes.wrapper.left, width: sizes.wrapper.width, avoidTransforms: true
			  }, 300);

		} else {
			// We are going to hide the menu.

			var sizes = {
				center: {
					left:	'0px',
					width:	MM.panels.sizes.twoPanels.center
				},
				right: {
					left:	MM.panels.sizes.twoPanels.center,
					width: 	MM.panels.sizes.twoPanels.right
				},
				wrapper: {
					left: 	'0px',
					width: 	'100%'
				}
			};

			if (settings.hideRight) {
				sizes.right.left = '100%';
				sizes.center.width = '100%';
			}

			if (!settings.animate) {
				panelLeft.css('display', 'none');
				panelCenter.css('left', sizes.center.left).css('width', sizes.center.width);
				panelRight.css('left', sizes.right.left).css('width', sizes.right.width);
				MM.util.applyOverflow('center');
				MM.util.applyOverflow('right');
				headerWrapper.css('left', sizes.wrapper.left).css('width', sizes.wrapper.width);
				MM.panels.menuStatus = false;
				return;
			}

			if (MM.getConfig("dev_css3transitions")) {
				MM.log("Using CSS3 transitions");

				$('#panel-center, #panel-right, .header-wrapper').css("-webkit-transition", "left 0.3s ease-in, width 0.3s ease-in");

				panelCenter.css('left', sizes.center.left).css('width', sizes.center.width);
				panelRight.css('left', sizes.right.left).css('width', sizes.right.width);
				headerWrapper.css('left', sizes.wrapper.left).css('width', sizes.wrapper.width);

				setTimeout(function () {
					panelLeft.css('display', 'none');
					MM.util.applyOverflow('center');
					MM.util.applyOverflow('right');
				}, 500);

				MM.panels.menuStatus = false;
				return;
			}

			panelCenter.animate({
				left: sizes.center.left, width: sizes.center.width, avoidTransforms: true
			  }, 300, function() {
					MM.panels.menuStatus = false;
					MM.util.applyOverflow('center');
					panelLeft.css('display', 'none');
				});

			panelRight.animate({
				left: sizes.right.left, width: sizes.right.width, avoidTransforms: true
			  }, 300, function() {
					MM.util.applyOverflow('right');
				});

			headerWrapper.animate({
				left: sizes.wrapper.left, width: sizes.wrapper.width, avoidTransforms: true
			  }, 300);
		}
	},

	/**
	 * Calculate the size of the panels in pixels (fixed sizes)
	 *
	 */
	calculatePanelsSizes: function() {
		var screenWidth = $(document).innerWidth();

		MM.panels.sizes.welcomePanel = {
			left:   320,
			center: screenWidth - 320,
			right:  0
		};

		MM.panels.sizes.twoPanels = {
			left:   0,
			center: 320,
			right:  screenWidth - 320
		};

		MM.panels.sizes.threePanels = {
			left:	320,
			center:	320,
			right:  screenWidth - 320
		};
	},

	/**
	 * Fix the initial size of the panels in pixels (fixed sizes)
	 *
	 */
	fixPanelsSize: function() {

		$("#panel-left").css("width", MM.panels.sizes.threePanels.left);

		$("#panel-center").css("width", MM.panels.sizes.threePanels.center);
		$("#panel-center").css("left", MM.panels.sizes.threePanels.left);

		$("#panel-right").css("width", MM.panels.sizes.threePanels.right);
		$("#panel-right").css("left", MM.panels.sizes.threePanels.left + MM.panels.sizes.threePanels.center);

		$(".header-wrapper").css("width", MM.panels.sizes.twoPanels.right);
		$(".header-wrapper").css("left",  MM.panels.sizes.twoPanels.left);
	},

	/**
	 * Resize panels on orientation change
	 *
	 */
	resizePanels: function() {
		MM.panels.calculatePanelsSizes();

		// Two panels view
		if ($("#panel-right").css("left") == $("#panel-center").css("width")) {
			$("#panel-right").css("width", MM.panels.sizes.twoPanels.right);
			$(".header-wrapper").css("width", "100%");
		} else {
			$("#panel-right").css("width", MM.panels.sizes.threePanels.right);
			$(".header-wrapper").css("width", MM.panels.sizes.twoPanels.right);
		}
	}

};

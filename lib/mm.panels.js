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
		MM.log("Rendering panel " + position);

		// If we are in the center or right panel, we need to add a small br for preventing contents half displayed.
		if (position != "left") {
			html += "<br /><br /><br />";
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
				$('#panel-center').css("width", MM.panels.sizes.welcomePanel.center);
				$("#panel-center").css("left",  MM.panels.sizes.welcomePanel.left);
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

		MM.panels.html(position, content);
		MM.panels.currentPanel = position;

		if (MM.deviceType == 'tablet') {
			MM.panels.hideRight = false;
			if (settings && settings.hideRight) {
				MM.panels.hideRight = true;
			}
			MM.navigation.hide(settings);
		} else {
			// Clean the page title.
			MM.panels.previousPanelPageTitle = $("#page-title").html();
			$("#page-title").html("");

			if (position == 'center') {

				$('#panel-left').animate({
					left: '-100%'
				  }, 300, function() { $(this).css('display', 'none') });

				$('#panel-center').css('display','block');
				$('#panel-center').animate({
					left: 0
				  }, 300, function () {
						$(".header-main .nav-item.home").removeClass("menu-back").addClass("menu-home");
						if (settings && settings.title) {
							$("#page-title").html(settings.title);
						}
					});

				$('.header-wrapper').animate({
					left: 0
				  }, 300);

			} else if (position == 'right') {
				$('#panel-right').css("width", $(document).innerWidth() + 50);
				$("#panel-right .content-index").css("width", $(document).innerWidth());

				$('#panel-center').animate({
					left: '-100%'
				  }, 300, function() { $(this).css('display', 'none') });

				$('#panel-right').css('display','block');
				$('#panel-right').animate({
					left: 0
				  }, 300, function(){
					$(".header-main .nav-item.home").removeClass("menu-home").addClass("menu-back");
					if (settings && settings.title) {
						$("#page-title").html(settings.title);
					}
				});
			}
		}
	},

	/**
	 * Go back button and event only for phone
	 * Implements the animation for going to the back.
	 */
	goBack: function() {

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
		} else if ($('#panel-right').css('display') == 'block') {
			hidePanel = '#panel-right';
			showPanel = '#panel-center';
			MM.panels.currentPanel = 'center';
			MM.panels.previousPanel = 'right';
		} else {
			// Main menu panel.
			if (navigator.app && navigator.app.exitApp) {
				// Exits the app.
				navigator.app.exitApp();
			}
			return;
		}

		// Update the url without navigation. This is to avoid keeping the
		// current feature in the url
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
	 * Implements the animation for going to the front.
	 */
	goFront: function() {
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

		} else if ($('#panel-center').css('display') == 'block') {
			hidePanel = '#panel-center';
			showPanel = '#panel-right';

			if (MM.panels.previousPanel != 'right') {
				return;
			}
			showBackArrow = true;
		} else {
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
			}
		});

		$('.header-wrapper').animate({
			left: '0%'
		}, 300);
	},

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
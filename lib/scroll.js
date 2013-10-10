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
 * @fileoverview Moodle mobile scroll lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */

var touchMoving = false;

function isTouchDevice() {
	try {
		document.createEvent('TouchEvent');
		return true;
	} catch (e) {
		return false;
	}
}

function touchScroll(id) {

	if (isTouchDevice()) { //if touch events exist...
		var el = document.getElementById(id);
		var scrollStartPos = 0;

		document.getElementById(id).addEventListener('touchstart', function(event) {
			scrollStartPos = this.scrollTop + event.touches[0].pageY;
		}, false);

		document.getElementById(id).addEventListener('touchmove', function(event) {
			touchMoving = true;
			this.scrollTop = scrollStartPos - event.touches[0].pageY;
		}, false);

		document.getElementById(id).addEventListener('touchend', function(event) {
			touchMoving = false;
		});
	}
}

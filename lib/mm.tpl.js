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
 * @fileoverview Ifaa Campus templates lib.
 * @author <a href="mailto:mail@ifaaonline.com">Tech Team</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the ifaacampus templates functionality.
 */
MM.tpl = {
    render: function(text, data, settings) {
    	var page = location.href.split("#")
		page = (page[1])? page[1] : "index.html";
		MM.log('Rendering template ' + page, 'Tpl');
        return _.template(text, data, settings);
    }
};

#!/usr/bin/env node

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* jshint node: true */

"use strict";

var fs = require("fs");

var optimist = require("optimist");

var util      = require("../lib/util");
var testcheck = require("../lib/testcheck");

function main() {

    // get args
    var argv = optimist
        .usage("Usage: $0 {options}")
        .demand("id")
        .demand("couchdb")
        .describe("id", "the build for which results are to be retrieved")
        .describe("couchdb", "the CouchDB server from which to retrieve results")
        .describe("file", "filename to which to optionally write results")
        .argv;

    var buildId    = argv.id;
    var couchdbURI = argv.couchdb;
    var outputPath = argv.file;

    console.log('Getting test results for ' + buildId);

    testcheck(buildId, couchdbURI).done(
        function onFulfilled(testResults) {

            var numFailures = testResults.mobilespec.failures;
            var numSpecs    = testResults.mobilespec.specs;

            var counts = {
                total:    numSpecs,
                failed:   numFailures,
                passed:   numSpecs - numFailures,
                warnings: 0,
            }

            if (outputPath) {
                fs.writeFileSync(outputPath, JSON.stringify(counts) + "\n", util.DEFAULT_ENCODING);
            }

            if (typeof numFailures == "undefined" || numFailures === 0) {
                console.log("No failures were detected");
            }

            console.log("Total failures: " + numFailures);
            console.log("Test failures were detected. Open " + couchdbURI + "/_utils/document.html?mobilespec_results/" + testResults._id + " for details");
            console.log("Failing tests:");

            testResults.mobilespec.results.forEach(function (result) {
                if (result.status === "failed") {
                    console.log(result.fullName);
                }
            });
        },
        function onRejected(error) {
            console.error("test check failed: " + error);
            process.exit(1);
        }
    );
}

main();

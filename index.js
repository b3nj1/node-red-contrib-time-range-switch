/**
 The MIT License (MIT)

 Copyright (c) 2016 @biddster

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

module.exports = function(RED) {
    'use strict';

    var SunCalc = require('suncalc');
    var moment = require('moment');
    require('twix');
    var fmt = 'YYYY-MM-DD HH:mm';

    RED.nodes.registerType('time-range-switch', function(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            var now = node.now();
            var start = momentFor(config.startTime, now);
            if (config.startOffset) {
                start.add(config.startOffset, 'minutes');
            }
            var end = momentFor(config.endTime, now);
            if (config.endOffset) {
                end.add(config.endOffset, 'minutes');
            }
            // align end to be before AND within 24 hours of start 
            while(end.diff(start, 'seconds') < 0) { // end before start
                end.add(1, 'day');
            }
            while(end.diff(start, 'seconds') > 86400) { // end more than day before start
                end.subtract(1, 'day');
            }   
            // move start and end window to be within a day of now
            while(end.diff(now, 'seconds') < 0) { // end before now
                start.add(1, 'day');
                end.add(1, 'day');
            }
            while(end.diff(now, 'seconds') > 86400) { // end more than day from now
                start.subtract(1, 'day');
                end.subtract(1, 'day');
            }   

            var range = moment.twix(start, end);
            var output = range.contains(now) ? 1 : 2;
            var msgs = [];
            msgs[output - 1] = msg;
            node.send(msgs);
            node.status({
                fill: 'green',
                shape: output === 1 ? 'dot' : 'ring',
                text: range.simpleFormat(fmt)
            });
        });

        function momentFor(time, now) {
            var m,
                matches = new RegExp(/(\d+):(\d+)/).exec(time);
            if (matches && matches.length) {
                m = now
                    .clone()
                    .hour(matches[1])
                    .minute(matches[2]);
            } else {
                var sunCalcTimes = SunCalc.getTimes(now.toDate(), config.lat, config.lon);
                var date = sunCalcTimes[time];
                if (date) {
                    m = moment(date);
                }
            }

            if (m) {
                m.seconds(0);
            } else {
                node.status({ fill: 'red', shape: 'dot', text: 'Invalid time: ' + time });
            }
            return m;
        }

        node.now = function() {
            return moment();
        };
    });
};

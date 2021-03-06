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

'use strict';

var assert = require('assert');
var moment = require('moment');
var mock = require('node-red-contrib-mock-node');
var nodeRedModule = require('../index.js');

function runBetween(start, end, startOffset, endOffset) {
    var node = mock(nodeRedModule, {
        startTime: start,
        endTime: end,
        startOffset: startOffset,
        endOffset: endOffset,
        lat: 51.33411,
        lon: -0.83716,
        unitTest: true
    });

    var counts = { o1: 0, o2: 0 };
    node.send = function(msg) {
        if (msg[0]) counts.o1++;
        if (msg[1]) counts.o2++;
    };

    var time = moment('2016-01-01');

    node.now = function() {
        return time.clone();
    };

    for (var i = 0; i < 7 * 24; ++i) {
        time.add(1, 'hour');
        node.emit('input', {});
    }
    return counts;
}

describe('time-range-switch', function() {
    // TODO - all these tests should assert the actual times rather than just the counts.

    it('should work between 12:45...02:45', function() {
        var counts = runBetween('12:45', '02:45');
        assert.strictEqual(98, counts.o1);
        assert.strictEqual(70, counts.o2);
    });
    it('should work between 01:45...02:45', function() {
        var counts = runBetween('01:45', '02:45');
        assert.strictEqual(7, counts.o1);
        assert.strictEqual(161, counts.o2);
    });
    it('should work between 11:45...12:45', function() {
        var counts = runBetween('11:45', '12:45');
        assert.strictEqual(7, counts.o1);
        assert.strictEqual(161, counts.o2);
    });
    it('should work between 22:45...01:45', function() {
        var counts = runBetween('22:45', '01:45');
        assert.strictEqual(21, counts.o1);
        assert.strictEqual(147, counts.o2);
    });
    it('should work between 06:30...03:30', function() {
        var counts = runBetween('06:30', '03:30');
        assert.strictEqual(147, counts.o1);
        assert.strictEqual(21, counts.o2);
    });
    it('should work between dawn...dusk', function() {
        var counts = runBetween('dawn', 'dusk');
        assert.strictEqual(63, counts.o1);
        assert.strictEqual(105, counts.o2);
    });
    it('should work between goldenHour...dawn', function() {
        var counts = runBetween('goldenHour', 'dawn');
        assert.strictEqual(112, counts.o1);
        assert.strictEqual(56, counts.o2);
    });
    it('should work between 22:45...01:45 with a start offset of 16', function() {
        var counts = runBetween('22:45', '01:45', 16);
        assert.strictEqual(14, counts.o1);
        assert.strictEqual(154, counts.o2);
    });
    it('should work between 22:45...01:45 with an end offset of -46', function() {
        var counts = runBetween('22:45', '01:45', 0, -46);
        assert.strictEqual(14, counts.o1);
        assert.strictEqual(154, counts.o2);
    });
});

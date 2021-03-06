// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

describe('URL Extractor', function() {
  var URLExtractor;

  beforeEach(function() {
    URLExtractor = foam.lookup('org.chromium.webidl.URLExtractor');
  });

  it('should return undefined for passing incorrect parameter type', function() {
    var extractor = URLExtractor.create();
    var results = extractor.extract({contents: 'Some sort of stuff here'});
    expect(results).toBeUndefined();
  });

  it('should return no URLs', function() {
    var extractor = URLExtractor.create();
    var contents = 'Test content';

    var results = extractor.extract(contents);
    expect(results).toBeDefined();
    expect(results.length).toBe(0);
  });

  it('should return all HTTP(s) URLs within the text fragment', function() {
    var extractor = URLExtractor.create();
    var urls = ['http://www.google.com', 'https://www.google.com/',
        'ftp://www.google.com', 'http://google.com', 'https://google.com',
        'https://google.com/potato?hello=true', 'www.google.com'];
    var contents = `
      Hello World! ${urls[0]} Some other thing potato ${urls[1]} test
      test ${urls[2]} potato
      test ${urls[3]} test
      potato ${urls[4]} potato
      ${urls[5]}
      test ${urls[6]} test
    `;

    var results = extractor.extract(contents);
    expect(results).toBeDefined();
    expect(results.length).toBe(5);
    expect(results[0]).toBe(urls[0]);
    expect(results[1]).toBe(urls[1]);
    // urls[2] not matched, since it begins with ftp://
    expect(results[2]).toBe(urls[3]);
    expect(results[3]).toBe(urls[4]);
    expect(results[4]).toBe(urls[5]);
    // urls[6] not matched, since it does not begin with protocol
  });

  it('should match URLs up until the anchor', function() {
    var extractor = URLExtractor.create();
    var urls = ['http://www.google.com#test', 'https://google.com#test#test2'];
    var contents = `
      No anchor test 1 ${urls[0]}
      No anchor test 2 ${urls[1]}
    `;

    var results = extractor.extract(contents);
    expect(results).toBeDefined();
    expect(results.length).toBe(2);
    expect(results[0]).toBe('http://www.google.com');
    expect(results[1]).toBe('https://google.com');
  });

  it('should return all whitelisted HTTP(s) URLs', function() {
    var include = [/google\.com/];
    var extractor = URLExtractor.create({include: include});
    var urls = ['http://google.com', 'http://potato.com', 'https://google.ca',
      'https://calendar.google.com', 'http://about.potato.com'];
    var contents = `
      This url should be accepted ${urls[0]}
      This url is not whitelisted ${urls[1]}
      This url is not whitelisted ${urls[2]}
      This url should be accepted ${urls[3]}
      This url is not whitelisted ${urls[4]}
    `;

    var results = extractor.extract(contents);
    expect(results).toBeDefined();
    expect(results.length).toBe(2);
    expect(results[0]).toBe(urls[0]);
    expect(results[1]).toBe(urls[3]);
  });

  it('should return only non-blacklisted HTTP(s) URLs', function() {
    var exclude = [/potato\.com/, /.*\.google\.com/];
    var extractor = URLExtractor.create({exclude: exclude});
    var urls = ['http://google.com', 'http://potato.com', 'https://google.ca',
      'https://calendar.google.com', 'http://about.potato.com'];
    var contents = `
      This url should be accepted ${urls[0]},
      This url is blacklisted ${urls[1]},
      This url should be accepted ${urls[2]},
      This url is blacklisted ${urls[3]},
      This url is blacklisted ${urls[4]}
    `;

    var results = extractor.extract(contents);
    expect(results).toBeDefined();
    expect(results.length).toBe(2);
    expect(results[0]).toBe(urls[0]);
    expect(results[1]).toBe(urls[2]);
  });

  it('should return whitelisted, but not blacklisted HTTP(s) URLs', function() {
    var include = [/google\.(com|ca)/];
    var exclude = [/calendar\.google\.com/];
    var extractor = URLExtractor.create({
      exclude: exclude,
      include: include,
    });
    var urls = ['https://www.google.com', 'http://calendar.google.com',
    'http://mail.google.com', 'https://about.potato.com', 'http://google.ca'];
    var contents = `
      This url should be accepted ${urls[0]}
      This url is blacklisted ${urls[1]}
      This url should be accepted ${urls[2]}
      This url is not whitelisted ${urls[3]}
      This url should be accepted ${urls[4]}
    `;

    var results = extractor.extract(contents);
    expect(results).toBeDefined();
    expect(results.length).toBe(3);
    expect(results[0]).toBe(urls[0]);
    expect(results[1]).toBe(urls[2]);
    expect(results[2]).toBe(urls[4]);
  });
});

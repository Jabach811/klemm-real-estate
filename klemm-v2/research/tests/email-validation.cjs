const assert = require('node:assert/strict');
const check = require('../../implementation/email-validation.js');
const valid = ['jack@example.com', ' joel+home@example.com ', "o'brien@homes.example.co.uk", 'first.last@my-domain.technology', 'UPPER@EXAMPLE.COM'];
const invalid = ['', '   ', 'name', 'a@@example.com', 'a@example', '.a@example.com', 'a.@example.com', 'a..b@example.com', 'a b@example.com', 'a@-example.com', 'a@example-.com', 'a@example..com', 'a@example.c', 'a@example.123', 'a@exam_ple.com', 'a'.repeat(65)+'@example.com', 'a@'+'x'.repeat(64)+'.com'];
for (const email of valid) assert.equal(check(email), '', `Rejected supported email: ${email}`);
for (const email of invalid) assert.notEqual(check(email), '', `Accepted malformed email: ${email}`);
console.log(`Email syntax: ${valid.length + invalid.length} cases passed; delivery not tested.`);

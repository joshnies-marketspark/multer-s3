const fs = require('fs');
const path = require('path');
const extend = require('xtend');
const assert = require('assert');
const multer = require('multer');
const stream = require('stream');
const FormData = require('form-data');
const onFinished = require('on-finished');
const multerS3 = require('../');
const mockS3 = require('./util/mock-s3');

const VALID_OPTIONS = {
  bucket: 'string'
};

const INVALID_OPTIONS = [
  ['numeric key', { key: 1337 }],
  ['string key', { key: 'string' }],
  ['numeric bucket', { bucket: 1337 }],
  ['numeric contentType', { contentType: 1337 }]
];

function submitForm(multerObj, form, cb) {
  form.getLength((err, length) => {
    if (err) return cb(err);

    const req = new stream.PassThrough();

    req.complete = false;
    form.once('end', () => {
      req.complete = true;
    });

    form.pipe(req);
    req.headers = {
      'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
      'content-length': length
    };

    multerObj(req, null, multerErr => {
      onFinished(req, () => {
        cb(multerErr, req);
      });
    });

    return null;
  });
}

describe('Multer S3', () => {
  it('is exposed as a function', () => {
    assert.equal(typeof multerS3, 'function');
  });

  INVALID_OPTIONS.forEach(testCase => {
    it(`throws when given ${testCase[0]}`, () => {
      function testBody() {
        multerS3(extend(VALID_OPTIONS, testCase[1]));
      }

      assert.throws(testBody, TypeError);
    });
  });

  it('upload files', done => {
    const s3 = mockS3();
    const form = new FormData();
    const storage = multerS3({ s3, bucket: 'test' });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const image = fs.createReadStream(
      path.join(__dirname, 'files', 'ffffff.png')
    );

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      assert.ifError(err);

      assert.equal(req.body.name, 'Multer');

      assert.equal(req.file.fieldname, 'image');
      assert.equal(req.file.originalname, 'ffffff.png');
      assert.equal(req.file.size, 68);
      assert.equal(req.file.bucket, 'test');
      assert.equal(req.file.etag, 'mock-etag');
      assert.equal(req.file.location, 'mock-location');

      done();
    });
  });

  it('uploads file with AES256 server-side encryption', done => {
    const s3 = mockS3();
    const form = new FormData();
    const storage = multerS3({
      s3,
      bucket: 'test',
      serverSideEncryption: 'AES256'
    });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const image = fs.createReadStream(
      path.join(__dirname, 'files', 'ffffff.png')
    );

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      assert.ifError(err);

      assert.equal(req.body.name, 'Multer');

      assert.equal(req.file.fieldname, 'image');
      assert.equal(req.file.originalname, 'ffffff.png');
      assert.equal(req.file.size, 68);
      assert.equal(req.file.bucket, 'test');
      assert.equal(req.file.etag, 'mock-etag');
      assert.equal(req.file.location, 'mock-location');
      assert.equal(req.file.serverSideEncryption, 'AES256');

      done();
    });
  });

  it('uploads file with AWS KMS-managed server-side encryption', done => {
    const s3 = mockS3();
    const form = new FormData();
    const storage = multerS3({
      s3,
      bucket: 'test',
      serverSideEncryption: 'aws:kms'
    });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const image = fs.createReadStream(
      path.join(__dirname, 'files', 'ffffff.png')
    );

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      assert.ifError(err);

      assert.equal(req.body.name, 'Multer');

      assert.equal(req.file.fieldname, 'image');
      assert.equal(req.file.originalname, 'ffffff.png');
      assert.equal(req.file.size, 68);
      assert.equal(req.file.bucket, 'test');
      assert.equal(req.file.etag, 'mock-etag');
      assert.equal(req.file.location, 'mock-location');
      assert.equal(req.file.serverSideEncryption, 'aws:kms');

      done();
    });
  });

  it('uploads PNG file with correct content-type', done => {
    const s3 = mockS3();
    const form = new FormData();
    const storage = multerS3({
      s3,
      bucket: 'test',
      serverSideEncryption: 'aws:kms',
      contentType: multerS3.AUTO_CONTENT_TYPE
    });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const image = fs.createReadStream(
      path.join(__dirname, 'files', 'ffffff.png')
    );

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      assert.ifError(err);

      assert.equal(req.body.name, 'Multer');

      assert.equal(req.file.fieldname, 'image');
      assert.equal(req.file.contentType, 'image/png');
      assert.equal(req.file.originalname, 'ffffff.png');
      assert.equal(req.file.size, 68);
      assert.equal(req.file.bucket, 'test');
      assert.equal(req.file.etag, 'mock-etag');
      assert.equal(req.file.location, 'mock-location');
      assert.equal(req.file.serverSideEncryption, 'aws:kms');

      done();
    });
  });

  it('uploads SVG file with correct content-type', done => {
    const s3 = mockS3();
    const form = new FormData();
    const storage = multerS3({
      s3,
      bucket: 'test',
      serverSideEncryption: 'aws:kms',
      contentType: multerS3.AUTO_CONTENT_TYPE
    });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const image = fs.createReadStream(
      path.join(__dirname, 'files', 'test.svg')
    );

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      assert.ifError(err);

      assert.equal(req.body.name, 'Multer');

      assert.equal(req.file.fieldname, 'image');
      assert.equal(req.file.contentType, 'image/svg+xml');
      assert.equal(req.file.originalname, 'test.svg');
      assert.equal(req.file.size, 100);
      assert.equal(req.file.bucket, 'test');
      assert.equal(req.file.etag, 'mock-etag');
      assert.equal(req.file.location, 'mock-location');
      assert.equal(req.file.serverSideEncryption, 'aws:kms');

      done();
    });
  });
});

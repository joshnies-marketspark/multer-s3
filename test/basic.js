const fs = require('fs');
const path = require('path');
const extend = require('xtend');
const { expect } = require('chai');
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
    expect(typeof multerS3m, 'function');
  });

  INVALID_OPTIONS.forEach(testCase => {
    it(`throws when given ${testCase[0]}`, () => {
      function testBody() {
        multerS3(extend(VALID_OPTIONS, testCase[1]));
      }

      expect(testBody).to.throw(TypeError);
    });
  });

  it('upload files', done => {
    const s3 = mockS3();
    const form = new FormData();
    const bucket = 'test';
    const storage = multerS3({ s3, bucket });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const filename = 'test.jpeg';
    const image = fs.createReadStream(path.join(__dirname, 'files', filename));
    const stats = fs.statSync(image.path);

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      // eslint-disable-next-line no-unused-expressions
      expect(err).to.be.undefined;

      console.log('Compressed file size:', req.file.size);
      console.log('Compression ratio:', stats.size / req.file.size);

      expect(req.body.name).to.equal('Multer');
      expect(req.file.fieldname).to.equal('image');
      expect(req.file.originalname).to.equal(filename);
      expect(req.file.size).to.be.lessThan(stats.size);
      expect(req.file.bucket, bucket);
      expect(req.file.etag).to.equal('mock-etag');
      expect(req.file.location).to.equal('mock-location');

      done();
    });
  });

  it('uploads file with AES256 server-side encryption', done => {
    const s3 = mockS3();
    const form = new FormData();
    const bucket = 'test';
    const serverSideEncryption = 'AES256';
    const storage = multerS3({
      s3,
      bucket,
      serverSideEncryption
    });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const filename = 'test.jpeg';
    const image = fs.createReadStream(path.join(__dirname, 'files', filename));
    const stats = fs.statSync(image.path);

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      // eslint-disable-next-line no-unused-expressions
      expect(err).to.be.undefined;

      console.log('Compressed file size:', req.file.size);
      console.log('Compression ratio:', stats.size / req.file.size);

      expect(req.body.name).to.equal('Multer');
      expect(req.file.fieldname).to.equal('image');
      expect(req.file.originalname).to.equal(filename);
      expect(req.file.size).to.be.lessThan(stats.size);
      expect(req.file.bucket, bucket);
      expect(req.file.etag).to.equal('mock-etag');
      expect(req.file.location).to.equal('mock-location');
      expect(req.file.serverSideEncryption, serverSideEncryption);

      done();
    });
  });

  it('uploads file with AWS KMS-managed server-side encryption', done => {
    const s3 = mockS3();
    const form = new FormData();
    const bucket = 'test';
    const serverSideEncryption = 'aws:kms';
    const storage = multerS3({
      s3,
      bucket,
      serverSideEncryption
    });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const filename = 'test.jpeg';
    const image = fs.createReadStream(path.join(__dirname, 'files', filename));
    const stats = fs.statSync(image.path);

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      // eslint-disable-next-line no-unused-expressions
      expect(err).to.be.undefined;

      console.log('Compressed file size:', req.file.size);
      console.log('Compression ratio:', stats.size / req.file.size);

      expect(req.body.name).to.equal('Multer');
      expect(req.file.fieldname).to.equal('image');
      expect(req.file.originalname).to.equal(filename);
      expect(req.file.size).to.be.lessThan(stats.size);
      expect(req.file.bucket, bucket);
      expect(req.file.etag).to.equal('mock-etag');
      expect(req.file.location).to.equal('mock-location');
      expect(req.file.serverSideEncryption, serverSideEncryption);

      done();
    });
  });

  it('uploads PNG file', done => {
    const s3 = mockS3();
    const form = new FormData();
    const bucket = 'test';
    const storage = multerS3({ s3, bucket });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const filename = 'test.png';
    const image = fs.createReadStream(path.join(__dirname, 'files', filename));
    const stats = fs.statSync(image.path);

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      // eslint-disable-next-line no-unused-expressions
      expect(err).to.be.undefined;

      console.log('Compressed file size:', req.file.size);
      console.log('Compression ratio:', stats.size / req.file.size);

      expect(req.body.name).to.equal('Multer');
      expect(req.file.fieldname).to.equal('image');
      expect(req.file.originalname).to.equal(filename);
      expect(req.file.size).to.be.lessThan(stats.size);
      expect(req.file.bucket, bucket);
      expect(req.file.etag).to.equal('mock-etag');
      expect(req.file.location).to.equal('mock-location');

      done();
    });
  });

  it('uploads SVG file with correct content-type', done => {
    const s3 = mockS3();
    const form = new FormData();
    const bucket = 'test';
    const serverSideEncryption = 'aws:kms';
    const storage = multerS3({
      s3,
      bucket,
      serverSideEncryption,
      contentType: multerS3.AUTO_CONTENT_TYPE
    });
    const upload = multer({ storage });
    const parser = upload.single('image');
    const filename = 'test.svg';
    const image = fs.createReadStream(path.join(__dirname, 'files', filename));
    const stats = fs.statSync(image.path);

    form.append('name', 'Multer');
    form.append('image', image);

    submitForm(parser, form, (err, req) => {
      // eslint-disable-next-line no-unused-expressions
      expect(err).to.be.undefined;

      expect(req.body.name).to.equal('Multer');
      expect(req.file.fieldname).to.equal('image');
      expect(req.file.contentType).to.equal('image/svg+xml');
      expect(req.file.originalname).to.equal(filename);
      expect(req.file.size).to.equal(stats.size);
      expect(req.file.bucket, bucket);
      expect(req.file.etag).to.equal('mock-etag');
      expect(req.file.location).to.equal('mock-location');
      expect(req.file.serverSideEncryption, serverSideEncryption);

      done();
    });
  });
});

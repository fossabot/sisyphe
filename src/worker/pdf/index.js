'use strict';

const bluebird = require('bluebird');
const Popplonode = require('popplonode');
const sisyphePdf = {};

sisyphePdf.init = function (options) {
  this.popplonode = new Popplonode();
};
sisyphePdf.doTheJob = function (docObject, next) {
  if (docObject.mimetype === 'application/pdf') {
    this.popplonode.load(docObject.path);
    const metadata = this.popplonode.getMetadata();
    this.getPdfWordCount(metadata.TotalNbPages).then(nbWords => {
      docObject.pdfMetadata = metadata;
      docObject.pdfPageTotal = +metadata.TotalNbPages;
      docObject.pdfWordCount = +nbWords;
      docObject.pdfWordByPage = ~~(docObject.pdfWordCount / docObject.pdfPageTotal);
      next(null, docObject);
    });
  } else {
    next(null, docObject);
  }
};

sisyphePdf.getPdfWordCount = async function (TotalNbPages) {
  const promises = [];
  for (var i = 0; i < TotalNbPages; i++) {
    promises.push(new Promise((resolve, reject) => {
      this.popplonode.getTextFromPage(i, function (err, data) {
        if (err) return reject(err);
        resolve(data);
      });
    }));
  }
  return bluebird.map(promises, function (data) {
    return data.split(/\s+/).length;
  }, {concurrency: 3}).then(data => {
    let totalWords = 0;
    data.map(data => {
      totalWords += data;
      return totalWords;
    });
    return totalWords;
  }).catch(err => {
    process.send({
      err: {
        message: err.message
      }
    });
  });
};

module.exports = sisyphePdf;

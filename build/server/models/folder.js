// Generated by CoffeeScript 1.9.3
var Folder, americano;

americano = require('cozydb');

module.exports = Folder = americano.getModel('Folder', {
  path: String,
  name: String
});

Folder.prototype.getFullPath = function() {
  return this.path + "/" + this.name;
};

Folder.all = function(callback) {
  return Folder.request("byFullPath", function(err, folders) {
    if (err) {
      return callback(err);
    }
    return callback(null, folders);
  });
};

Folder.allPath = function(callback) {
  return Folder.all(function(err, folders) {
    folders = folders.map(function(folder) {
      return folder.getFullPath();
    });
    return callback(err, folders);
  });
};

Folder.createNewFolder = function(folder, callback) {
  return Folder.create(folder, function(err, newFolder) {
    if (err) {
      return callback(err);
    } else {
      newFolder.index(["name"], function(err) {});
      if (err) {
        console.log(err);
      }
      return callback(null, newFolder);
    }
  });
};

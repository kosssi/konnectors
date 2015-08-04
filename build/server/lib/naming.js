// Generated by CoffeeScript 1.8.0
module.exports = {
  getEntryFileName: function(entry, options) {
    var extension, name, parameter, _i, _len, _ref;
    name = "";
    if (typeof options === "string") {
      name = "" + (entry.date.format('YYYYMM')) + "_" + options + ".pdf";
    } else {
      if (entry.date != null) {
        if (options.dateFormat != null) {
          name = entry.date.format(options.dateFormat);
        } else {
          name = entry.date.format('YYYYMM');
        }
      }
      name += "_" + options.vendor;
      if (options.others != null) {
        _ref = options.others;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          parameter = _ref[_i];
          if (entry[parameter] != null) {
            name += "_" + entry[parameter];
          }
        }
      }
      extension = options.extension || 'pdf';
      name = "" + name + "." + extension;
    }
    return name;
  }
};

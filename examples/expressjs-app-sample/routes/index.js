
/*
 * GET home page.
 */

var cda = require("cdajs");

exports.index = function(req, res) {
  var obj = new cda.CDA({
    url: "http://localhost:8080/pentaho/content/cda/",
    username: "joe",
    password: "password",
    error: function(error) {
      console.log("Error: " + error);
      return;
    }
  });
  obj.doQuery(function (xhr) {
    res.send("Result Set: " + xhr.resultset);
  }, {
    params: {
      dataAccessId: 1,
      outputIndexId: 1,
      pageSize: 0,
      pageStart: 0,
      path: "%2Fplugin-samples%2Fcda%2Fcdafiles%2Fscripting.cda",
      sortBy: ""
    }
  });

};
# CDAjs

CDAjs is a stand-alone javascript library for working with Pentaho Community Data Access plugin.


### About Community Data Access (CDA)

Community Data Access (CDA) is a Pentaho plugin designed for accessing data with great flexibility.
Born for overcoming some cons of the older implementation, CDA allows you to access any of the various Pentaho data sources and:
* Join different data sources just by editing an XML file;
* Cache queries providing a great boost in performance;
* Deliver data in different formats (csv, xls, etc.) through the Pentaho User Console;
* Sort and paginate data server-side.

Without worrying about the details CDA can be used as a standalone plugin on the Pentaho BI server or in combination with CDE / CDF.


### Node.js Installation
You need installed [node.js](http://nodejs.org/) and after installation you just need run the following command:
```sh
$ npm install cdajs
```



### Using on Web Page
You just need include cda.js to use the CDAjs library.

```html
  <script type="text/javascript" src="../lib/min/cda-min.js"></script>
  <script type="text/javascript">
   var obj = new CDA({
      url: "http://localhost:8080/pentaho/content/cda/",
      username: "joe",
      password: "password",
      error: function(error) {
        console.log("Error: " + error);
        return;
      }
    });
    obj.doQuery(function(xhr) {
      document.getElementById("data").innerHTML=("Result Set: " + xhr.resultset);
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
  </script>
```


### API Documentation

API documentation is available based on the the YUI Doc system on this [link](http://latinojoel.github.io/cdajs/api-0.0.1/).




## Interested Links
* [CDAjs Web Site](http://latinojoel.github.io/cdajs)
* [Joel Latino Author - About](https://about.me/latinojoel)
* [Joel Latino Author - Linkedin](http://pt.linkedin.com/in/latinojoel)
* [Joel Latino Author - Blog](http://joel-latino.blogspot.com/)

var path = require('path')

module.exports = {
  httpPort: 8081,
  streamPort: 8082,
  wsPort: 8084,
  staticFolder: path.join(__dirname + '/../../../client'),
  imagesFolder: path.join(__dirname + '/../../../client/images'),
  bootstrapFolder: path.join(__dirname + '/../../node_modules/bootstrap/dist'),
  jqueryFolder: path.join(__dirname + '/../../node_modules/jquery/dist'),
  socketioFolder: path.join(__dirname + '/../../node_modules/socket.io-client')
};

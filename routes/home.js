module.exports = function() {
  return [
    {
      method: 'OPTIONS',
      path: '/{param*}',
      handler: function (request, reply) {

          // echo request headers back to caller (allow any requested)
          var additionalHeaders = [];
          if (request.headers['access-control-request-headers']) {
              additionalHeaders = request.headers['access-control-request-headers'].split(', ');
          }
          var headers = _.union('Authorization, Content-Type, If-None-Match'.split(', '), additionalHeaders);

          reply().type('text/plain')
              .header('Access-Control-Allow-Headers', headers.join(', '));
      }
    },
    {
        method: 'GET',
        path: '/',
        config: {
            plugins: { 'hapiAuthorization': false },
            handler: function (request, reply) {

                console.log('default rote', request.path);

                reply('Welcome to Ampath ETL service.');
                //return reply(Boom.forbidden('Not this end point bruh'));
            },
            description: 'Home',
            notes: 'Returns a message that shows ETL service is running.',
            tags: ['api'],
        }
    }
  ];
}();

var
  dao = require('../dao/session/session');

module.exports = function() {
  return [
    {
      method: 'GET',
      path: '/etl/session/invalidate',
      config: {
          auth: 'simple',
          handler: function (request, reply) {
              dao.invalidateUserSession(request, reply);
          }
      }
    }
  ]
}();

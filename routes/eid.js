var
  Joi = require('joi')
  , authorizer = require('../authorization/etl-authorizer')
  , privileges = authorizer.getAllPrivileges()
  , dao = require('../etl-dao');

module.exports = function() {
  return [
    {
        method: 'POST',
        path: '/etl/eid/order/{lab}',
        config: {
            auth: 'simple',
            plugins: {
                'hapiAuthorization': { role: privileges.canViewPatient }
            },
            handler: function (request, reply) {
                dao.postLabOrderToEid(request, reply);
            }
        }
    }
  ]
}();

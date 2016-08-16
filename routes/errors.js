var
  winston = require('winston')
  , path = require('path')
  , winston_daily_rotate_file = require('winston-daily-rotate-file');

module.exports = function() {
  return [
    {
        method: 'POST',
        path: '/javascript-errors',
        config: {
            handler: function (request, reply) {
              if (request.payload) {
                var logger = new winston.Logger({
                    transports: [
                        new winston.transports.File({
                            level: 'info',
                            filename: 'client-logs.log',
                            handleExceptions: true,
                            json: true,
                            colorize: false,
                        }),
                    ],
                    exitOnError: false,
                });
                logger.add(winston_daily_rotate_file, {
                    filename: path.join(__dirname, '../', 'logs', 'client-logs.log')
                });
                logger.info(request.payload);
              }

              reply({
                  message: 'ok'
              });
            }

        }
    }
  ];
}();

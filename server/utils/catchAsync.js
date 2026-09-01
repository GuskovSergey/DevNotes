/**
  Oбертка для асинхронных контроллеров Express для перехвата исключений
  и автоматической передачи их в глобальный middleware ошибок через next().
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;

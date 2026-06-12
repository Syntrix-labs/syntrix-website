const dangerousKeyPattern = /(^\$)|(\.)/;

function assertSafeKeys(value, path = 'request') {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeKeys(item, `${path}[${index}]`));
    return;
  }

  Object.keys(value).forEach((key) => {
    if (dangerousKeyPattern.test(key)) {
      const error = new Error(`Unsafe key "${key}" in ${path}`);
      error.statusCode = 400;
      throw error;
    }

    assertSafeKeys(value[key], `${path}.${key}`);
  });
}

module.exports = function sanitizeInput(req, res, next) {
  try {
    assertSafeKeys(req.body, 'body');
    assertSafeKeys(req.params, 'params');
    assertSafeKeys(req.query, 'query');
    return next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: 'Request contains unsupported input.'
    });
  }
};

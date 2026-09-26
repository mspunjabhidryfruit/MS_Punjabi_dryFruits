export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(parsed.error);
  req.body = parsed.data;
  next();
};

import Joi from 'joi';

export const createInstrumentSchema = Joi.object({
  name: Joi.string().required(),
  serial: Joi.string().required(),
  make: Joi.string().required(),
  model: Joi.string().required(),
  category: Joi.string().required(),
  customerId: Joi.number().required(),
  dueDate: Joi.date().optional(),
  ignored: Joi.boolean().optional().default(false)
});

export const updateInstrumentSchema = Joi.object({
  name: Joi.string().optional(),
  serial: Joi.string().optional(),
  make: Joi.string().optional(),
  model: Joi.string().optional(),
  category: Joi.string().optional(),
  customerId: Joi.number().optional(),
  dueDate: Joi.date().optional(),
  ignored: Joi.boolean().optional()
});

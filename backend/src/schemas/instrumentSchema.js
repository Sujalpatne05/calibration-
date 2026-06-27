import Joi from 'joi';

export const createInstrumentSchema = Joi.object({
  name: Joi.string().required(),
  serial: Joi.string().required(),
  make: Joi.string().required(),
  model: Joi.string().required(),
  category: Joi.string().required(),
  customerId: Joi.number().required(),
  dueDate: Joi.date().optional(),
  ignored: Joi.boolean().optional().default(false),
  
  // Additional instrument fields
  series: Joi.string().optional().allow(''),
  rangeStart: Joi.string().optional().allow(''),
  rangeEnd: Joi.string().optional().allow(''),
  rangeUnit: Joi.string().optional().allow(''),
  accuracy: Joi.string().optional().allow(''),
  accuracyType: Joi.string().optional().allow(''),
  resolution: Joi.string().optional().allow(''),
  type: Joi.string().optional().allow(''),
  instrumentId: Joi.string().optional().allow(''),
  calibrationPoints: Joi.string().optional().allow(''),
  readingAccuracy: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow('')
});

export const updateInstrumentSchema = Joi.object({
  name: Joi.string().optional(),
  serial: Joi.string().optional(),
  make: Joi.string().optional(),
  model: Joi.string().optional(),
  category: Joi.string().optional(),
  customerId: Joi.number().optional(),
  dueDate: Joi.date().optional(),
  ignored: Joi.boolean().optional(),
  
  // Additional instrument fields
  series: Joi.string().optional().allow(''),
  rangeStart: Joi.string().optional().allow(''),
  rangeEnd: Joi.string().optional().allow(''),
  rangeUnit: Joi.string().optional().allow(''),
  accuracy: Joi.string().optional().allow(''),
  accuracyType: Joi.string().optional().allow(''),
  resolution: Joi.string().optional().allow(''),
  type: Joi.string().optional().allow(''),
  instrumentId: Joi.string().optional().allow(''),
  calibrationPoints: Joi.string().optional().allow(''),
  readingAccuracy: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow('')
});

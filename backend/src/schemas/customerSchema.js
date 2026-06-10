import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().required(),
  address: Joi.string().optional(),
  gstin: Joi.string().optional()
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  gstin: Joi.string().optional()
});

import pkg from '@prisma/client';
import logger from '../config/logger.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getAllInstruments = async (req, res) => {
  try {
    const { search, ignored } = req.query;

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serial: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (ignored !== undefined) {
      where.ignored = ignored === 'true';
    }

    const instruments = await prisma.instrument.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(instruments);
  } catch (error) {
    logger.error('Get instruments error:', error);
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
};

export const createInstrument = async (req, res) => {
  try {
    const instrument = await prisma.instrument.create({
      data: req.validated,
      include: { customer: true }
    });

    logger.info(`Instrument created: ${instrument.id}`);
    res.status(201).json(instrument);
  } catch (error) {
    logger.error('Create instrument error:', error);
    res.status(500).json({ error: 'Failed to create instrument' });
  }
};

export const updateInstrument = async (req, res) => {
  try {
    const { id } = req.params;

    const instrument = await prisma.instrument.update({
      where: { id: parseInt(id) },
      data: req.validated,
      include: { customer: true }
    });

    logger.info(`Instrument updated: ${id}`);
    res.json(instrument);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Instrument not found' });
    }
    logger.error('Update instrument error:', error);
    res.status(500).json({ error: 'Failed to update instrument' });
  }
};

export const deleteInstrument = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.instrument.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`Instrument deleted: ${id}`);
    res.json({ message: 'Instrument deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Instrument not found' });
    }
    logger.error('Delete instrument error:', error);
    res.status(500).json({ error: 'Failed to delete instrument' });
  }
};

import pkg from '@prisma/client';
import logger from '../config/logger.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getAllReports = async (req, res) => {
  try {
    const { type, search } = req.query;

    const where = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { certificateNo: { contains: search, mode: 'insensitive' } },
        { tcNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { instrumentName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const reports = await prisma.report.findMany({
      where,
      include: { customer: true, instrument: true },
      orderBy: { issueDate: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true, instrument: true }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

export const createReport = async (req, res) => {
  try {
    const report = await prisma.report.create({
      data: req.validated,
      include: { customer: true, instrument: true }
    });

    logger.info(`Report created: ${report.id}`);
    res.status(201).json(report);
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.update({
      where: { id: parseInt(id) },
      data: req.validated,
      include: { customer: true, instrument: true }
    });

    logger.info(`Report updated: ${id}`);
    res.json(report);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Report not found' });
    }
    logger.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.report.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`Report deleted: ${id}`);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Report not found' });
    }
    logger.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

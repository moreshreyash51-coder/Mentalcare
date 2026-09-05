import express, { Request, Response } from 'express';
import { db } from '../db/schema.js';

export const patientsRouter = express.Router();

// GET /api/patients
patientsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const patients = await db.users.find({ role: 'patient' });
    const safePatients = patients.map(({ password: _, ...p }) => p);
    res.json(safePatients);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/:id
patientsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await db.users.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    const { password: _, ...patientSafe } = patient;
    res.json(patientSafe);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve patient details' });
  }
});

// PUT /api/patients/:id
patientsRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, emergencyContact, accessibilitySettings, language, cognitiveDifficulty } = req.body;
    const existing = await db.users.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const updated = await db.users.findByIdAndUpdate(req.params.id, {
      ...(name ? { name } : {}),
      ...(emergencyContact ? { emergencyContact } : {}),
      ...(accessibilitySettings ? { accessibilitySettings } : {}),
      ...(language ? { language } : {}),
      ...(cognitiveDifficulty ? { cognitiveDifficulty } : {}),
    });

    if (!updated) {
      res.status(404).json({ error: 'Update failed' });
      return;
    }

    const { password: _, ...patientSafe } = updated;
    res.json({ message: 'Patient profile updated', patient: patientSafe });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
});

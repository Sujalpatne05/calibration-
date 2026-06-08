// Dashboard mock data: KPI figures, quick task list and recent activity feed.
export const kpis = [
  { id: 'pending-instruments', label: 'Pending Instruments', value: 41, max: 60 },
  { id: 'standards-due', label: 'Standards Due for Calibration', value: 0, max: 10 },
  { id: 'pending-customers', label: 'Pending Customers', value: 987, max: 1200 },
]

export const quickTasks = [
  { id: 1, type: 'customer', name: 'CLEAN FLOW TECHNOLOGY' },
  { id: 2, type: 'customer', name: 'MSHRIY Consulting & Engineering' },
]

export const recentActivities = [
  {
    id: 1,
    action: 'Certificate generated',
    detail: '26-27/0508 · Vijay Transtech Private Limited',
    date: '2026-06-05',
    status: 'completed',
  },
  {
    id: 2,
    action: 'Instrument added',
    detail: 'Flow Meter (FM-0091) · Clean Flow Technology',
    date: '2026-06-05',
    status: 'pending',
  },
  {
    id: 3,
    action: 'Standard calibrated',
    detail: 'Digital Manometer 477AV-2 · CAL-25100187/PR/01',
    date: '2026-06-04',
    status: 'completed',
  },
  {
    id: 4,
    action: 'Customer registered',
    detail: 'MSHRIY Consulting & Engineering',
    date: '2026-06-04',
    status: 'pending',
  },
  {
    id: 5,
    action: 'Calibration due soon',
    detail: 'Digital Thermometer (DT-5532) · Delta Engineering',
    date: '2026-06-03',
    status: 'due',
  },
]

/**
 * @deprecated DECOMMISSIONED - INSTITUTIONAL LOCALSTORAGE SOURCE REMOVED
 *
 * All institutional records (activities, submissions, evidence, task grades,
 * observations, bitácora, audit logs) have been migrated to canonical REST backend services:
 * - activityService: /api/activities
 * - submissionService: /api/submissions
 * - observationService: /api/observations
 * - dailySummaryService: /api/teachers/me/daily-summary
 * - auditLogService: /api/audit-logs
 *
 * This file is retained only to avoid broken legacy imports if any, with zero localStorage persistence.
 */

export const getTodayStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const teacherModuleService = {
  getActivities: () => [],
  getSubmissions: () => [],
  getObservations: () => [],
  getAttendance: () => [],
  getAnnouncements: () => [],
  getAuditLogs: () => [],
  getBitacoraByDate: (date: string) => ({
    date,
    attendance: [],
    activities: [],
    scheduledActivities: [],
    observations: [],
    announcements: [],
    totalRecords: 0,
    isFuture: false,
  }),
};

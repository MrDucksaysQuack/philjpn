export interface ExamMonitoringEvent {
  type: 'session_start' | 'session_end' | 'answer_saved' | 'section_change' | 'tab_switch' | 'submit';
  sessionId: string;
  userId: string;
  examId: string;
  timestamp: Date;
  data?: any;
}

export interface CheatingDetectionEvent {
  sessionId: string;
  userId: string;
  examId: string;
  eventType: 'excessive_tab_switches' | 'fast_submit' | 'copy_paste' | 'multiple_tabs';
  severity: 'warning' | 'critical';
  details: Record<string, any>;
  timestamp: Date;
}

export interface SessionStatus {
  sessionId: string;
  userId: string;
  examId: string;
  startTime: Date;
  duration: number; // minutes
  tabSwitches: number;
  lastActivity: Date;
}


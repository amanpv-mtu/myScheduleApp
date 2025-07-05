import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, BarChart2, CalendarDays, ChevronLeft, ChevronRight, Settings, FastForward, Edit, Plus, Trash2, Save, X, Clock, CheckCircle, AlertCircle, PlayCircle, StopCircle, RefreshCcw, Link, Upload, Download, BellRing } from 'lucide-react'; // Added new icons

// Tailwind CSS is assumed to be available in the environment.

// Helper function to format time
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to format HH:MM to Date object for comparison
const parseTime = (timeStr, dateContext = new Date()) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateContext); // Use dateContext to maintain day/month/year
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper function to format Date object to HH:MM AM/PM
const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

// Helper to format time as HH:MM (24-hour)
const formatTo24HourTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper to format Date object to YYYY-MM-DD
const formatDateToYYYYMMDD = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to determine time of day group for styling and grouping
const getTimeOfDayGroup = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Redefined Night: from Maghrib (21:55) to end of sleep (05:00)
  // This means 21:55 onwards, and 00:00 to 04:59
  if ((hours > 21 || (hours === 21 && minutes >= 55)) || (hours >= 0 && hours < 5)) return 'night'; // 21:55 to 04:59 (next day)
  if (hours >= 5 && hours < 9) return 'early-morning'; // 05:00 to 08:59
  if (hours >= 9 && hours < 13) return 'midday'; // 09:00 to 12:59
  if (hours >= 13 && hours < 19) return 'afternoon'; // 13:00 to 18:59
  if (hours >= 19 && (hours < 21 || (hours === 21 && minutes < 55))) return 'evening'; // 19:00 to 21:54

  return ''; // Fallback
};

// Default schedule data (adjust as needed for your actual Houghton times)
// IMPORTANT: These are the Kentwood, MI times you provided earlier.
// You MUST update these to your actual Houghton, MI Masjid times for accuracy.
const initialDefaultSchedule = { // Renamed to initialDefaultSchedule
  // Common activities for all days
  common: [
    { id: 'wake-up', activity: 'Wake Up', plannedStart: '05:00', plannedEnd: '05:00', type: 'personal' },
    { id: 'fajr-prep', activity: 'Hydrate, Wudu, Prepare for Fajr', plannedStart: '05:00', plannedEnd: '05:25', type: 'spiritual' },
    { id: 'fajr-prayer', activity: 'Fajr Iqamah & Prayer', plannedStart: '05:25', plannedEnd: '05:45', type: 'spiritual' },
    { id: 'quran-morning', activity: 'Quran Recitation & Reflection (Morning)', plannedStart: '05:45', plannedEnd: '06:00', type: 'spiritual' },
    { id: 'morning-exercise', activity: 'Morning Exercise', plannedStart: '06:00', plannedEnd: '06:30', type: 'physical' },
    { id: 'breakfast', activity: 'Breakfast & Plan Day', plannedStart: '06:30', plannedEnd: '07:00', type: 'personal' },
    { id: 'deep-work-1', activity: 'Deep Work Mode Block 1', plannedStart: '07:00', plannedEnd: '09:30', type: 'academic' }, // Renamed
    { id: 'break-1', activity: 'Break / Movement', plannedStart: '09:30', plannedEnd: '09:45', type: 'personal' },
    { id: 'deep-work-2', activity: 'Deep Work Mode Block 2', plannedStart: '09:45', plannedEnd: '12:15', type: 'academic' }, // Renamed
    { id: 'lunch', activity: 'Lunch Prep & Eat', plannedStart: '12:15', plannedEnd: '13:15', type: 'personal' },
    { id: 'dhuhr-prep', activity: 'Wind down / Prepare for Dhuhr / Family Time', plannedStart: '13:15', plannedEnd: '14:25', type: 'personal' },
    { id: 'dhuhr-prayer', activity: 'Dhuhr Iqamah & Prayer', plannedStart: '14:25', plannedEnd: '14:45', type: 'spiritual' },
    { id: 'short-break-after-dhuhr', activity: 'Short Break', plannedStart: '14:45', plannedEnd: '15:00', type: 'personal' },
    { id: 'power-nap', activity: 'Power Nap', plannedStart: '15:00', plannedEnd: '15:30', type: 'personal' },
    { id: 'deep-work-3', activity: 'Deep Work Mode Flexible Work Block', plannedStart: '15:30', plannedEnd: '17:00', type: 'academic' }, // Renamed
    { id: 'flexible-afternoon', activity: 'Flexible Block / Errands / Relax / Family Time', plannedStart: '17:00', plannedEnd: '19:25', type: 'personal' },
    { id: 'asr-prayer', activity: 'Asr Iqamah & Prayer', plannedStart: '19:25', plannedEnd: '19:45', type: 'spiritual' },
    { id: 'evening-exercise', activity: 'Evening Exercise', plannedStart: '19:45', plannedEnd: '20:15', type: 'physical' },
    { id: 'dinner', activity: 'Dinner Prep & Eat (with Family)', plannedStart: '20:15', plannedEnd: '21:15', type: 'personal' },
    { id: 'family-evening', activity: 'Family Time / Light Socializing', plannedStart: '21:15', plannedEnd: '21:45', type: 'personal' },
    { id: 'maghrib-prep', activity: 'Wind down / Prepare for Maghrib', plannedStart: '21:45', plannedEnd: '21:55', type: 'spiritual' },
    { id: 'maghrib-prayer', activity: 'Maghrib Iqamah & Prayer', plannedStart: '21:55', plannedEnd: '22:15', type: 'spiritual' },
    { id: 'quran-evening', activity: 'Evening Routine / Quran / Prepare for Bed', plannedStart: '22:15', plannedEnd: '23:15', type: 'spiritual' },
    { id: 'isha-prep', activity: 'Prepare for Isha', plannedStart: '23:15', plannedEnd: '23:25', type: 'spiritual' },
    { id: 'isha-prayer', activity: 'Isha Iqamah & Prayer', plannedStart: '23:25', plannedEnd: '23:45', type: 'spiritual' },
    { id: 'plan-next-day', activity: 'Plan Next Day', plannedStart: '23:45', plannedEnd: '23:55', type: 'personal' }, // Added new activity
    { id: 'pre-sleep', activity: 'Pre-Sleep Routine', plannedStart: '23:55', plannedEnd: '00:00', type: 'personal' }, // Adjusted start time
    { id: 'sleep', activity: 'Lights Out / Sleep', plannedStart: '00:00', plannedEnd: '05:00', type: 'personal' },
  ],
  // Specific activities for soccer days
  soccerDays: [
    { id: 'soccer-game', activity: 'Soccer Game (including travel, warm-up, cool-down, shower)', plannedStart: '20:00', plannedEnd: '22:00', type: 'physical' },
  ],
  // Specific activities for Jumu'ah (Friday)
  jumuah: [
    { id: 'jumuah-prayer', activity: 'Jumu\'ah Iqamah & Prayer', plannedStart: '14:40', plannedEnd: '15:00', type: 'spiritual' },
  ]
};

// Max duration for a sub-block in minutes
const MAX_SUB_BLOCK_MINUTES = 30;

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activityLogs, setActivityLogs] = useState(() => {
    try {
      const savedLogs = localStorage.getItem('activityLogs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (error) {
      console.error("Failed to parse activityLogs from localStorage:", error);
      return [];
    }
  });
  const [pomodoroSettings, setPomodoroSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('pomodoroSettings');
      return savedSettings ? JSON.parse(savedSettings) : { work: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
    } catch (error) {
      console.error("Failed to parse pomodoroSettings from localStorage:", error);
      return { work: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
    }
  });
  const [pomodoroTimer, setPomodoroTimer] = useState({
    running: false,
    mode: 'work', // 'work', 'short_break', 'long_break'
    timeLeft: pomodoroSettings.work * 60,
    pomodorosCompleted: 0,
  });
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule', 'report', 'settings', 'planner', 'tasks'
  const [reportDate, setReportDate] = useState(new Date());
  const intervalRef = useRef(null);
  const audioRef = useRef(new Audio('https://www.soundjay.com/buttons/beep-07.mp3')); // Simple beep sound
  const [currentActivityId, setCurrentActivityId] = useState(null); // State for current block highlighting

  // State to hold the daily schedule, calculated only when currentDate changes
  const [dailyScheduleState, setDailyScheduleState] = useState([]);

  // State for editable sub-task details (ad-hoc notes, not linked project subtasks)
  const [subTaskDetails, setSubTaskDetails] = useState(() => {
    try {
      const savedSubTasks = localStorage.getItem('subTaskDetails');
      return savedSubTasks ? JSON.parse(savedSubTasks) : {};
    } catch (error) {
      console.error("Failed to parse subTaskDetails from localStorage:", error);
      return {};
    }
  });
  const [editingSubTaskId, setEditingSubTaskId] = useState(null); // State to track which ad-hoc sub-task is being edited

  // State to track the currently running schedule block for the Pomodoro timer
  const [currentPomodoroBlockId, setCurrentPomodoroBlockId] = useState(0);
  // State to track how much time of the current schedule block has been consumed by Pomodoro cycles
  const [blockTimeConsumed, setBlockTimeConsumed] = useState(0); // in seconds

  // State for the customizable planner schedule (base common activities)
  const [plannerSchedule, setPlannerSchedule] = useState(() => {
    try {
      const savedPlannerSchedule = localStorage.getItem('plannerSchedule');
      // If a saved schedule exists, parse it. Otherwise, use a deep copy of the initial default common schedule.
      return savedPlannerSchedule ? JSON.parse(savedPlannerSchedule) : JSON.parse(JSON.stringify(initialDefaultSchedule.common));
    } catch (error) {
      console.error("Failed to parse plannerSchedule from localStorage:", error);
      return JSON.parse(JSON.stringify(initialDefaultSchedule.common)); // Fallback to default
    }
  });

  // State for the activity being edited in the planner modal
  const [editingActivity, setEditingActivity] = useState(null);
  // State to control the visibility of the planner modal
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);

  // NEW: State for the broader task list
  const [projectTasks, setProjectTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem('projectTasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error("Failed to parse projectTasks from localStorage:", error);
      return [];
    }
  });
  // State for the task being edited/added in the task modal
  const [editingTask, setEditingTask] = useState(null);
  // State to control the visibility of the task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  // State for editing subtask name within the task modal
  const [editingSubtaskNameId, setEditingSubtaskNameId] = useState(null);

  // NEW: State to toggle between task list and Eisenhower Matrix view
  const [showEisenhowerMatrix, setShowEisenhowerMatrix] = useState(false);

  // NEW: State for the Assign Task Modal
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [assigningToActivity, setAssigningToActivity] = useState(null); // { date: Date, activityId: string }
  const [assigningFromTask, setAssigningFromTask] = useState(null); // { taskId: string, subtaskId: string }

  // NEW: State for data management options (export/import)
  const [dataManagementOptions, setDataManagementOptions] = useState({
    export: {
      tasks: true,
      dailySchedule: true,
      activityLogs: true,
      pomodoroSettings: true,
      subTaskDetails: true,
    },
    import: {
      tasks: true,
      dailySchedule: true,
      activityLogs: true,
      pomodoroSettings: true,
      subTaskDetails: true,
    }
  });

  // NEW: State for reminder modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderActivity, setReminderActivity] = useState(null);
  // Using useRef to store reminders shown today, so updates don't trigger re-renders
  const remindersShownToday = useRef(new Set());

  // NEW: State for audio enablement
  const [audioEnabled, setAudioEnabled] = useState(false);


  // Ref for the table container to enable scrolling
  const scheduleTableRef = useRef(null);
  // Refs for individual activity rows
  const activityRefs = useRef(new Map());

  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (groupName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };


  // Save logs and settings to localStorage
  useEffect(() => {
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
    // When settings change, reset pomodoro timer to new work duration
    setPomodoroTimer(prev => ({
      ...prev,
      timeLeft: pomodoroSettings.work * 60,
      running: false // Stop timer if settings are changed
    }));
  }, [pomodoroSettings]);

  useEffect(() => {
    localStorage.setItem('subTaskDetails', JSON.stringify(subTaskDetails));
  }, [subTaskDetails]);

  useEffect(() => {
    localStorage.setItem('plannerSchedule', JSON.stringify(plannerSchedule));
  }, [plannerSchedule]);

  // NEW: Save projectTasks to localStorage
  useEffect(() => {
    localStorage.setItem('projectTasks', JSON.stringify(projectTasks));
  }, [projectTasks]);

  // Reset remindersShownToday when currentDate changes
  useEffect(() => {
    remindersShownToday.current = new Set();
  }, [currentDate]);


  // Pomodoro Timer Logic
  useEffect(() => {
    if (pomodoroTimer.running) {
      intervalRef.current = setInterval(() => {
        setPomodoroTimer(prev => {
          if (prev.timeLeft > 0) {
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          } else {
            // Time's up, play sound and clear interval
            if (audioEnabled) { // Only play if audio is enabled
              audioRef.current.play();
            }
            clearInterval(intervalRef.current);

            let nextMode = prev.mode;
            let nextPomodorosCompleted = prev.pomodorosCompleted;
            let nextTimeLeft = 0;

            const currentBlock = dailyScheduleState.find(block => block.id === currentPomodoroBlockId);
            const totalBlockDurationSeconds = currentBlock ? Math.floor(currentBlock.durationMinutes * 60) : 0;

            // Calculate the duration of the segment that just finished
            const completedSegmentDuration = (prev.mode === 'work' ? pomodoroSettings.work : (prev.mode === 'short_break' ? pomodoroSettings.shortBreak : pomodoroSettings.longBreak)) * 60;

            // Update the time consumed for the current schedule block
            setBlockTimeConsumed(prevConsumed => {
                const newConsumed = prevConsumed + completedSegmentDuration;
                const remaining = totalBlockDurationSeconds - newConsumed;

                if (currentBlock && remaining <= 0) {
                    setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                    setCurrentPomodoroBlockId(null);
                    setBlockTimeConsumed(0);
                    return 0;
                }
                return newConsumed;
            });

            const calculatedRemainingTime = totalBlockDurationSeconds - (blockTimeConsumed + completedSegmentDuration);

            if (prev.mode === 'work') {
                nextPomodorosCompleted++;
                if (calculatedRemainingTime <= 0) {
                    setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                    setCurrentPomodoroBlockId(null);
                    setBlockTimeConsumed(0);
                    return { ...prev, running: false, timeLeft: 0 };
                }

                if (nextPomodorosCompleted % pomodoroSettings.longBreakInterval === 0) {
                    nextMode = 'long_break';
                    nextTimeLeft = Math.min(pomodoroSettings.longBreak * 60, calculatedRemainingTime);
                } else {
                    nextMode = 'short_break';
                    nextTimeLeft = Math.min(pomodoroSettings.shortBreak * 60, calculatedRemainingTime);
                }

                if (nextTimeLeft <= 0) {
                    nextMode = 'work';
                    nextTimeLeft = Math.min(pomodoroSettings.work * 60, calculatedRemainingTime);
                    if (nextTimeLeft <= 0) {
                        setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                        setCurrentPomodoroBlockId(null);
                        setBlockTimeConsumed(0);
                        return { ...prev, running: false, timeLeft: 0 };
                    }
                }

            } else {
                if (calculatedRemainingTime <= 0) {
                    setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                    setCurrentPomodoroBlockId(null);
                    setBlockTimeConsumed(0);
                    return { ...prev, running: false, timeLeft: 0 };
                }

                nextMode = 'work';
                nextTimeLeft = Math.min(pomodoroSettings.work * 60, calculatedRemainingTime);

                if (nextTimeLeft <= 0) {
                    setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                    setCurrentPomodoroBlockId(null);
                    setBlockTimeConsumed(0);
                    return { ...prev, running: false, timeLeft: 0 };
                }
            }

            setTimeout(() => {
                setPomodoroTimer({
                    running: true,
                    mode: nextMode,
                    timeLeft: nextTimeLeft,
                    pomodorosCompleted: nextPomodorosCompleted,
                });
            }, 1000);

            return { ...prev, running: false, mode: nextMode, timeLeft: nextTimeLeft, pomodorosCompleted: nextPomodorosCompleted };
          }
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [pomodoroTimer.running, pomodoroTimer.timeLeft, pomodoroTimer.mode, pomodoroSettings, currentPomodoroBlockId, dailyScheduleState, blockTimeConsumed, audioEnabled]);


  const subdivideActivity = useCallback((activity, maxMinutes, dateContext) => {
    const subBlocks = [];
    let currentStart = parseTime(activity.plannedStart, dateContext);
    let originalEnd = parseTime(activity.plannedEnd, dateContext);

    if (originalEnd < currentStart) {
      originalEnd.setDate(originalEnd.getDate() + 1);
    }

    let part = 1;
    while (currentStart < originalEnd) {
      let subBlockEnd = new Date(currentStart.getTime() + maxMinutes * 60 * 1000);
      if (subBlockEnd > originalEnd) {
        subBlockEnd = originalEnd;
      }

      const durationMinutes = (subBlockEnd.getTime() - currentStart.getTime()) / (60 * 1000);

      let activityName = `${activity.activity} (Part ${part})`;
      if (activity.type === 'academic') {
        activityName = `${activity.activity.split(' (Pomodoro')[0].split(' (Part')[0]} (Pomodoro ${part})`;
      } else if (activity.id === 'flexible-afternoon') {
        activityName = `Flexible Block (Part ${part})`;
      }

      subBlocks.push({
        ...activity,
        id: `${activity.id}-part${part}`,
        activity: activityName,
        originalActivityId: activity.id,
        plannedStart: formatTo24HourTime(currentStart),
        plannedEnd: formatTo24HourTime(subBlockEnd),
        durationMinutes: durationMinutes,
      });

      currentStart = subBlockEnd;
      part++;
    }
    return subBlocks;
  }, []);

  useEffect(() => {
    const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const isSoccerDay = dayOfWeek === 3 || dayOfWeek === 6; // Wednesday (3) or Saturday (6)
    const isJumuah = dayOfWeek === 5; // Friday (5)

    let scheduleForDay = JSON.parse(JSON.stringify(plannerSchedule));

    if (isSoccerDay) {
      scheduleForDay = scheduleForDay.filter(
        item => !(item.id === 'evening-exercise' || item.id === 'dinner' || item.id === 'family-evening' ||
                  (parseTime(item.plannedStart, currentDate) >= parseTime('20:00', currentDate) && parseTime(item.plannedEnd, currentDate) <= parseTime('22:00', currentDate)))
      );
      const soccerGame = initialDefaultSchedule.soccerDays[0];
      const insertIndex = scheduleForDay.findIndex(item => parseTime(item.plannedStart, currentDate) > parseTime(soccerGame.plannedStart, currentDate));
      scheduleForDay.splice(insertIndex > -1 ? insertIndex : scheduleForDay.length, 0, soccerGame);

      const soccerEndTime = parseTime(soccerGame.plannedEnd, currentDate);
      const dinnerStartTime = new Date(soccerEndTime.getTime() + 15 * 60 * 1000);
      const familyEveningStartTime = new Date(dinnerStartTime.getTime() + 60 * 60 * 1000);

      const dinnerExists = scheduleForDay.some(item => item.id === 'dinner');
      const familyEveningExists = scheduleForDay.some(item => item.id === 'family-evening');

      if (!dinnerExists) {
        scheduleForDay.push({
          id: 'dinner',
          activity: 'Dinner Prep & Eat (with Family) (After Soccer)',
          plannedStart: formatTo24HourTime(dinnerStartTime),
          plannedEnd: formatTo24HourTime(familyEveningStartTime),
          type: 'personal'
        });
      }
      if (!familyEveningExists) {
        scheduleForDay.push({
          id: 'family-evening',
          activity: 'Family Time / Light Socializing (After Soccer)',
          plannedStart: formatTo24HourTime(familyEveningStartTime),
          plannedEnd: formatTo24HourTime(new Date(familyEveningStartTime.getTime() + 30 * 60 * 1000)),
          type: 'personal'
        });
      }
    }

    if (isJumuah) {
      scheduleForDay = scheduleForDay.filter(item => item.id !== 'dhuhr-prayer');
      const jumuahPrayer = initialDefaultSchedule.jumuah[0];
      const insertIndex = scheduleForDay.findIndex(item => parseTime(item.plannedStart, currentDate) > parseTime(jumuahPrayer.plannedStart, currentDate));
      scheduleForDay.splice(insertIndex > -1 ? insertIndex : scheduleForDay.length, 0, jumuahPrayer);
    }

    // Custom sort logic to put activities spanning midnight at the end of the day
    scheduleForDay.sort((a, b) => {
      const timeA = parseTime(a.plannedStart, currentDate);
      const timeB = parseTime(b.plannedStart, currentDate);

      let sortableTimeA = timeA;
      let sortableTimeB = timeB;

      // If an activity starts before 5 AM, treat it as if it's on the "next" day for sorting purposes
      // This ensures 'Lights Out / Sleep' (00:00 - 05:00) comes after activities ending near midnight
      if (timeA.getHours() < 5) {
        sortableTimeA = new Date(timeA);
        sortableTimeA.setDate(sortableTimeA.getDate() + 1);
      }
      if (timeB.getHours() < 5) {
        sortableTimeB = new Date(timeB);
        sortableTimeB.setDate(sortableTimeB.getDate() + 1);
      }

      return sortableTimeA - sortableTimeB;
    });

    let finalSchedule = [];
    scheduleForDay.forEach(activity => {
      const plannedDurationMinutes = getPlannedDuration(activity.plannedStart, activity.plannedEnd, currentDate) * 60;
      if (plannedDurationMinutes > MAX_SUB_BLOCK_MINUTES && (activity.type === 'academic' || activity.id === 'flexible-afternoon')) {
        finalSchedule = finalSchedule.concat(subdivideActivity(activity, MAX_SUB_BLOCK_MINUTES, currentDate));
      } else {
        finalSchedule.push({ ...activity, durationMinutes: plannedDurationMinutes });
      }
    });

    setDailyScheduleState(finalSchedule);
  }, [currentDate, subdivideActivity, plannerSchedule]);

  useEffect(() => {
    const updateCurrentBlockAndProgress = () => {
      const now = new Date();
      const estTimeStr = now.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/New_York'
      });
      const [estHours, estMinutes, estSeconds] = estTimeStr.split(':').map(Number);
      const currentEstDate = new Date();
      currentEstDate.setHours(estHours, estMinutes, estSeconds, 0);

      let foundCurrentActivity = null;
      dailyScheduleState.forEach(activity => {
        const plannedStart = parseTime(activity.plannedStart, currentDate);
        const plannedEnd = parseTime(activity.plannedEnd, currentDate);

        const activityStartToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedStart.getHours(), plannedStart.getMinutes(), 0, 0);
        let activityEndToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedEnd.getHours(), plannedEnd.getMinutes(), 0, 0);

        // Handle activities that span across midnight
        if (plannedEnd < plannedStart) {
          activityEndToday.setDate(activityEndToday.getDate() + 1);
        }

        // Check for current activity
        if (currentEstDate >= activityStartToday && currentEstDate < activityEndToday) {
          foundCurrentActivity = activity.id;
        }

        // Check for reminders (5 minutes before planned start)
        const reminderTime = new Date(activityStartToday.getTime() - 5 * 60 * 1000);
        if (currentEstDate >= reminderTime && currentEstDate < activityStartToday) {
            if (!remindersShownToday.current.has(activity.id)) {
                setReminderActivity(activity);
                setShowReminderModal(true);
                if (audioEnabled) { // Only play if audio is enabled
                  audioRef.current.play();
                }
                remindersShownToday.current.add(activity.id); // Mark as shown
            }
        }
      });
      setCurrentActivityId(foundCurrentActivity);
    };

    const interval = setInterval(updateCurrentBlockAndProgress, 1000);
    updateCurrentBlockAndProgress();

    return () => clearInterval(interval);
  }, [dailyScheduleState, currentDate, audioRef, audioEnabled]); // Added audioEnabled to dependencies


  useEffect(() => {
    if (currentActivityId && activeTab === 'schedule' && activityRefs.current.has(currentActivityId)) {
      const element = activityRefs.current.get(currentActivityId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentActivityId, activeTab]);


  const startPomodoro = () => {
    setPomodoroTimer(prev => ({ ...prev, running: true }));
  };

  const pausePomodoro = () => {
    setPomodoroTimer(prev => ({ ...prev, running: false }));
  };

  const resetPomodoro = () => {
    clearInterval(intervalRef.current);
    setPomodoroTimer({
      running: false,
      mode: 'work',
      timeLeft: pomodoroSettings.work * 60,
      pomodorosCompleted: 0,
    });
    setCurrentPomodoroBlockId(null);
    setBlockTimeConsumed(0);
  };

  const handlePomodoroSettingChange = (e) => {
    const { name, value } = e.target;
    setPomodoroSettings(prev => ({ ...prev, [name]: Number(value) }));
  };


  const getLogForActivity = (activityId, date = currentDate) => {
    const todayStr = date.toISOString().split('T')[0];
    return activityLogs.find(log =>
      log.date === todayStr && log.activityId === activityId
    );
  };

  const logTime = (activityId, type) => {
    const todayStr = currentDate.toISOString().split('T')[0];
    const currentTime = new Date();

    setActivityLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log =>
        log.date === todayStr && log.activityId === activityId
      );

      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        if (type === 'start') {
          updatedLogs[existingLogIndex].actualStart = currentTime.toISOString();
          updatedLogs[existingLogIndex].actualEnd = null; // Clear end time if restarting
        } else if (type === 'end') {
          updatedLogs[existingLogIndex].actualEnd = currentTime.toISOString();
        } else if (type === 'reset') { // New reset type
          updatedLogs.splice(existingLogIndex, 1); // Remove the log entry
        }
        return updatedLogs;
      } else {
        const newLog = {
          id: crypto.randomUUID(),
          date: todayStr,
          activityId: activityId,
          actualStart: type === 'start' ? currentTime.toISOString() : null,
          actualEnd: type === 'end' ? currentTime.toISOString() : null,
          linkedTaskId: null, // Initialize linked task
          linkedSubtaskId: null, // Initialize linked subtask
        };
        return [...prevLogs, newLog];
      }
    });

    if (type === 'start') {
      const activity = dailyScheduleState.find(a => a.id === activityId);
      if (activity && activity.durationMinutes) {
        const totalBlockSeconds = Math.floor(activity.durationMinutes * 60);

        setCurrentPomodoroBlockId(activityId);
        setBlockTimeConsumed(0);

        setPomodoroTimer(prev => ({
          ...prev,
          running: true,
          mode: 'work',
          timeLeft: Math.min(pomodoroSettings.work * 60, totalBlockSeconds),
          pomodorosCompleted: 0,
        }));
      }
    } else if (type === 'end') {
        setPomodoroTimer(prev => ({ ...prev, running: false })); // Stop Pomodoro when activity ends
        setCurrentPomodoroBlockId(null); // Disassociate Pomodoro from block
        setBlockTimeConsumed(0);
    } else if (type === 'reset') {
        if (currentPomodoroBlockId === activityId) {
            resetPomodoro(); // Reset Pomodoro if it was linked to this activity
        }
    }
  };

  const getActualDuration = (log) => {
    if (log && log.actualStart && log.actualEnd) {
      const start = new Date(log.actualStart);
      const end = new Date(log.actualEnd);
      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours;
    }
    return 0;
  };

  const getPlannedDuration = (plannedStart, plannedEnd, dateContext) => {
    const start = parseTime(plannedStart, dateContext);
    const end = parseTime(plannedEnd, dateContext);
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours;
  };

  const navigateDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const getReportData = useCallback(() => {
    const reportDateStr = reportDate.toISOString().split('T')[0];
    const dailyLogs = activityLogs.filter(log => log.date === reportDateStr);

    const reportSummary = {};
    let totalActualFocusedTime = 0;
    let totalPlannedFocusedTime = 0;
    let totalActualPrayerTime = 0;
    let totalPlannedPrayerTime = 0;


    dailyLogs.forEach(log => {
      const activity = dailyScheduleState.find(item => item.id === log.activityId);
      if (activity) {
        const actualDurationHours = getActualDuration(log);
        if (!reportSummary[activity.type]) {
          reportSummary[activity.type] = { planned: 0, actual: 0, activities: [] };
        }
        reportSummary[activity.type].actual += actualDurationHours;
        reportSummary[activity.type].activities.push({
          activity: activity.activity,
          actualStart: log.actualStart,
          actualEnd: log.actualEnd,
          actualDuration: actualDurationHours,
          subTask: subTaskDetails[activity.id] || '', // Still show ad-hoc subtasks in report
        });

        if (activity.type === 'academic') {
          totalActualFocusedTime += actualDurationHours;
        }
        if (activity.type === 'spiritual' && activity.activity.toLowerCase().includes('prayer')) {
            totalActualPrayerTime += actualDurationHours;
        }
      }
    });

    dailyScheduleState.forEach(activity => {
        const plannedDurationHours = getPlannedDuration(activity.plannedStart, activity.plannedEnd, currentDate);
        if (!reportSummary[activity.type]) {
            reportSummary[activity.type] = { planned: 0, actual: 0, activities: [] };
        }
        reportSummary[activity.type].planned += plannedDurationHours;

        if (activity.type === 'academic') {
            totalPlannedFocusedTime += plannedDurationHours;
        }
        if (activity.type === 'spiritual' && activity.activity.toLowerCase().includes('prayer')) {
            totalPlannedPrayerTime += plannedDurationHours;
        }
    });


    return { summary: reportSummary, totalFocused: totalActualFocusedTime, totalPlannedFocusedTime, totalActualPrayerTime, totalPlannedPrayerTime };
  }, [activityLogs, reportDate, dailyScheduleState, currentDate, subTaskDetails]);

  const reportData = getReportData();

  const getProgressBarPercentage = useCallback((activityId) => {
    const log = getLogForActivity(activityId);
    if (log && log.actualStart && !log.actualEnd) {
      const plannedActivity = dailyScheduleState.find(item => item.id === activityId);
      if (plannedActivity) {
        const startTime = new Date(log.actualStart);
        const plannedEndTime = parseTime(plannedActivity.plannedEnd, currentDate);

        let adjustedPlannedEndTime = new Date(plannedEndTime);
        if (parseTime(plannedActivity.plannedEnd, currentDate) < parseTime(plannedActivity.plannedStart, currentDate)) {
          adjustedPlannedEndTime.setDate(adjustedPlannedEndTime.getDate() + 1);
        }

        const currentTime = new Date();
        const elapsedMs = currentTime - startTime;
        const totalPlannedMs = adjustedPlannedEndTime - startTime;

        if (totalPlannedMs > 0) {
          let percentage = (elapsedMs / totalPlannedMs) * 100;
          return Math.min(100, Math.max(0, percentage));
        }
      }
    }
    return 0;
  }, [activityLogs, dailyScheduleState, getLogForActivity, currentDate]);

  const getNextTask = useCallback(() => {
    const now = new Date();
    const estTimeStr = now.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/New_York'
    });
    const [estHours, estMinutes, estSeconds] = estTimeStr.split(':').map(Number);
    const currentEstDate = new Date();
    currentEstDate.setHours(estHours, estMinutes, estSeconds, 0);

    const upcomingActivities = dailyScheduleState.filter(activity => {
      const plannedStart = parseTime(activity.plannedStart, currentDate);
      const plannedEnd = parseTime(activity.plannedEnd, currentDate);

      const activityStartToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedStart.getHours(), plannedStart.getMinutes(), 0, 0);
      let activityEndToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedEnd.getHours(), plannedEnd.getMinutes(), 0, 0);
      if (plannedEnd < plannedStart) {
        activityEndToday.setDate(activityEndToday.getDate() + 1);
      }

      return activityStartToday > currentEstDate;
    });

    upcomingActivities.sort((a, b) => {
      const timeA = parseTime(a.plannedStart, currentDate);
      const timeB = parseTime(b.plannedStart, currentDate);
      return timeA - timeB;
    });

    return upcomingActivities.length > 0 ? upcomingActivities[0] : null;
  }, [dailyScheduleState, currentDate]);

  const nextTask = getNextTask();
  const currentOngoingTask = dailyScheduleState.find(activity => activity.id === currentActivityId);

  const getNextPrayer = useCallback(() => {
    const now = new Date();
    const estTimeStr = now.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/New_York'
    });
    const [estHours, estMinutes, estSeconds] = estTimeStr.split(':').map(Number);
    const currentEstDate = new Date();
    currentEstDate.setHours(estHours, estMinutes, estSeconds, 0);

    const upcomingPrayers = dailyScheduleState.filter(activity => {
      const activityNameLower = activity.activity.toLowerCase();
      const isPrayer = activityNameLower.includes('iqamah & prayer') || activityNameLower.includes('prayer');

      if (isPrayer) {
        const plannedStart = parseTime(activity.plannedStart, currentDate);
        const activityStartToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedStart.getHours(), plannedStart.getMinutes(), 0, 0);
        return activityStartToday > currentEstDate;
      }
      return false;
    });

    upcomingPrayers.sort((a, b) => parseTime(a.plannedStart, currentDate) - parseTime(b.plannedStart, currentDate));

    return upcomingPrayers.length > 0 ? upcomingPrayers[0] : null;
  }, [dailyScheduleState, currentDate]);

  const nextPrayer = getNextPrayer();

  const handleSubTaskChange = (activityId, value) => {
    setSubTaskDetails(prev => ({
      ...prev,
      [activityId]: value,
    }));
  };

  const handleSubTaskBlur = (activityId) => {
    setEditingSubTaskId(null);
  };

  const handleSubTaskKeyDown = (e, activityId) => {
    if (e.key === 'Enter') {
      setEditingSubTaskId(null);
    }
  };

  const handleAddActivity = () => {
    setEditingActivity({
      id: `new-${Date.now()}`,
      activity: '',
      plannedStart: '09:00',
      plannedEnd: '10:00',
      type: 'personal',
      isNew: true,
    });
    setIsPlannerModalOpen(true);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity({ ...activity });
    setIsPlannerModalOpen(true);
  };

  const handleDeleteActivity = (activityId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this activity?');
    if (confirmDelete) {
      setPlannerSchedule(prevSchedule => prevSchedule.filter(act => act.id !== activityId));
    }
  };

  const handleSaveActivity = (updatedActivity) => {
    setPlannerSchedule(prevSchedule => {
      if (updatedActivity.isNew) {
        const { isNew, ...newActivity } = updatedActivity;
        return [...prevSchedule, { ...newActivity, id: crypto.randomUUID() }];
      } else {
        return prevSchedule.map(act =>
          act.id === updatedActivity.id ? updatedActivity : act
        );
      }
    });
    setIsPlannerModalOpen(false);
    setEditingActivity(null);
  };

  const handleCancelEdit = () => {
    setIsPlannerModalOpen(false);
    setEditingActivity(null);
  };

  // NEW: Task Management Functions
  const handleAddTask = () => {
    setEditingTask({
      id: `task-${Date.now()}`,
      name: '',
      description: '',
      targetStartDate: '',
      deadlineDate: '',
      expectedDurationHours: 0,
      actualCompletionDate: null,
      status: 'pending',
      type: 'personal', // Default type
      urgency: 'medium', // Default urgency
      importance: 'medium', // Default importance
      subtasks: [], // Initialize with empty subtasks array
      isNew: true,
    });
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    // Ensure subtasks array exists when editing an old task that might not have it
    setEditingTask({ ...task, subtasks: task.subtasks || [] });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this task?');
    if (confirmDelete) {
      setProjectTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  };

  const handleSaveTask = (updatedTask) => {
    setProjectTasks(prevTasks => {
      if (updatedTask.isNew) {
        const { isNew, ...newTask } = updatedTask;
        return [...prevTasks, { ...newTask, id: crypto.randomUUID() }];
      } else {
        return prevTasks.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        );
      }
    });
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleCancelTaskEdit = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // Subtask Handlers
  const handleAddSubtask = (taskId, subtaskName) => {
    setEditingTask(prevTask => {
      if (!prevTask) return prevTask;
      const newSubtask = { id: crypto.randomUUID(), name: subtaskName, completed: false };
      return {
        ...prevTask,
        subtasks: [...(prevTask.subtasks || []), newSubtask],
      };
    });
  };

  const handleToggleSubtaskCompletion = (taskId, subtaskId) => {
    setEditingTask(prevTask => {
      if (!prevTask) return prevTask;
      return {
        ...prevTask,
        subtasks: (prevTask.subtasks || []).map(sub =>
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        ),
      };
    });
  };

  const handleEditSubtaskName = (taskId, subtaskId, newName) => {
    setEditingTask(prevTask => {
      if (!prevTask) return prevTask;
      return {
        ...prevTask,
        subtasks: (prevTask.subtasks || []).map(sub =>
          sub.id === subtaskId ? { ...sub, name: newName } : sub
        ),
      };
    });
    setEditingSubtaskNameId(null); // Exit editing mode
  };

  const handleDeleteSubtask = (taskId, subtaskId) => {
    setEditingTask(prevTask => {
      if (!prevTask) return prevTask;
      return {
        ...prevTask,
        subtasks: (prevTask.subtasks || []).filter(sub => sub.id !== subtaskId),
      };
    });
  };

  // NEW: Assign Task to Schedule Logic
  const openAssignTaskModal = (activityToAssignTo = null, taskToAssign = null) => {
    setAssigningToActivity(activityToAssignTo); // This will be null if coming from tasks view
    setAssigningFromTask(taskToAssign); // This will be null if coming from schedule view
    setIsAssignTaskModalOpen(true);
  };

  const handleAssignTask = (selectedDate, selectedActivityId, selectedTaskId, selectedSubtaskId = null) => {
    const dateStr = selectedDate.toISOString().split('T')[0];

    setActivityLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log =>
        log.date === dateStr && log.activityId === selectedActivityId
      );

      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex].linkedTaskId = selectedTaskId;
        updatedLogs[existingLogIndex].linkedSubtaskId = selectedSubtaskId;
        return updatedLogs;
      } else {
        // Create a new log entry if none exists for this activity on this day
        return [...prevLogs, {
          id: crypto.randomUUID(),
          date: dateStr,
          activityId: selectedActivityId,
          actualStart: null,
          actualEnd: null,
          linkedTaskId: selectedTaskId,
          linkedSubtaskId: selectedSubtaskId,
        }];
      }
    });

    // If a subtask was assigned, mark it as in-progress if it's not completed
    if (selectedTaskId && selectedSubtaskId) {
        setProjectTasks(prevTasks => prevTasks.map(task => {
            if (task.id === selectedTaskId) {
                const updatedSubtasks = (task.subtasks || []).map(sub => {
                    if (sub.id === selectedSubtaskId && !sub.completed) {
                        return { ...sub, completed: false }; // Ensure it's not marked complete if assigned
                    }
                    return sub;
                });
                // Also update the main task status if it was pending and now has an assigned subtask
                let newStatus = task.status;
                if (newStatus === 'pending') {
                    newStatus = 'in-progress';
                }
                return { ...task, subtasks: updatedSubtasks, status: newStatus };
            }
            return task;
        }));
    } else if (selectedTaskId) {
         setProjectTasks(prevTasks => prevTasks.map(task => {
            if (task.id === selectedTaskId) {
                let newStatus = task.status;
                if (newStatus === 'pending') {
                    newStatus = 'in-progress';
                }
                return { ...task, status: newStatus };
            }
            return task;
        }));
    }

    setIsAssignTaskModalOpen(false);
    setAssigningToActivity(null);
    setAssigningFromTask(null);
  };

  const handleUnassignTask = (activityId) => {
    const dateStr = currentDate.toISOString().split('T')[0];
    setActivityLogs(prevLogs => prevLogs.map(log => {
      if (log.date === dateStr && log.activityId === activityId) {
        return { ...log, linkedTaskId: null, linkedSubtaskId: null };
      }
      return log;
    }));
  };

  const getAssignedTaskInfo = (activityId) => {
    const log = getLogForActivity(activityId);
    if (log && log.linkedTaskId) {
      const task = projectTasks.find(t => t.id === log.linkedTaskId);
      if (task) {
        const subtask = log.linkedSubtaskId ? task.subtasks?.find(st => st.id === log.linkedSubtaskId) : null;
        return {
          taskName: task.name,
          subtaskName: subtask ? subtask.name : null,
          taskId: task.id,
          subtaskId: subtask ? subtask.id : null,
        };
      }
    }
    return null;
  };


  const scrollToActivity = useCallback((activityId) => {
    if (activityId && activityRefs.current.has(activityId)) {
      const element = activityRefs.current.get(activityId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  // Group daily schedule by time of day
  const groupedSchedule = dailyScheduleState.reduce((acc, activity) => {
    const group = getTimeOfDayGroup(activity.plannedStart);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(activity);
    return acc;
  }, {});

  const timeOfDayOrder = ['early-morning', 'midday', 'afternoon', 'evening', 'night']; // Define a consistent order

  // Eisenhower Matrix Logic
  const getEisenhowerQuadrant = useCallback((task) => {
    const { urgency, importance } = task;

    const isUrgent = urgency === 'high' || urgency === 'critical';
    const isImportant = importance === 'high' || importance === 'critical';

    if (isUrgent && isImportant) return 'Do Now';
    if (!isUrgent && isImportant) return 'Schedule';
    if (isUrgent && !isImportant) return 'Delegate';
    if (!isUrgent && !isImportant) return 'Eliminate';
    return 'Uncategorized'; // Should not happen if values are properly set
  }, []);

  const eisenhowerTasks = projectTasks.reduce((acc, task) => {
    if (task.actualCompletionDate) return acc; // Don't include completed tasks in the matrix
    const quadrant = getEisenhowerQuadrant(task);
    if (!acc[quadrant]) {
      acc[quadrant] = [];
    }
    acc[quadrant].push(task);
    return acc;
  }, {});

  // Handle data management option changes
  const handleDataOptionChange = (type, category, value) => {
    setDataManagementOptions(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [category]: value
      }
    }));
  };

  // Export Data Function
  const handleExportData = () => {
    const dataToExport = {};
    if (dataManagementOptions.export.tasks) dataToExport.projectTasks = projectTasks;
    if (dataManagementOptions.export.activityLogs) dataToExport.activityLogs = activityLogs;
    if (dataManagementOptions.export.dailySchedule) dataToExport.plannerSchedule = plannerSchedule;
    if (dataManagementOptions.export.pomodoroSettings) dataToExport.pomodoroSettings = pomodoroSettings;
    if (dataManagementOptions.export.subTaskDetails) dataToExport.subTaskDetails = subTaskDetails;

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily_rhythm_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Selected data exported successfully!');
  };

  // Import Data Function
  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        let importedCount = 0;
        let skippedCount = 0;
        let message = "Import Summary:\n";

        if (window.confirm('Are you sure you want to import data? This will overwrite selected existing data categories.')) {
          if (dataManagementOptions.import.tasks && importedData.projectTasks) {
            setProjectTasks(importedData.projectTasks);
            importedCount++;
            message += "- Task List: Imported\n";
          } else if (dataManagementOptions.import.tasks && !importedData.projectTasks) {
            skippedCount++;
            message += "- Task List: Skipped (not found in file)\n";
          }

          if (dataManagementOptions.import.activityLogs && importedData.activityLogs) {
            setActivityLogs(importedData.activityLogs);
            importedCount++;
            message += "- Activity Logs: Imported\n";
          } else if (dataManagementOptions.import.activityLogs && !importedData.activityLogs) {
            skippedCount++;
            message += "- Activity Logs: Skipped (not found in file)\n";
          }

          if (dataManagementOptions.import.dailySchedule && importedData.plannerSchedule) {
            setPlannerSchedule(importedData.plannerSchedule);
            importedCount++;
            message += "- Daily Schedule: Imported\n";
          } else if (dataManagementOptions.import.dailySchedule && !importedData.plannerSchedule) {
            skippedCount++;
            message += "- Daily Schedule: Skipped (not found in file)\n";
          }

          if (dataManagementOptions.import.pomodoroSettings && importedData.pomodoroSettings) {
            setPomodoroSettings(importedData.pomodoroSettings);
            importedCount++;
            message += "- Pomodoro Settings: Imported\n";
          } else if (dataManagementOptions.import.pomodoroSettings && !importedData.pomodoroSettings) {
            skippedCount++;
            message += "- Pomodoro Settings: Skipped (not found in file)\n";
          }

          if (dataManagementOptions.import.subTaskDetails && importedData.subTaskDetails) {
              setSubTaskDetails(importedData.subTaskDetails);
              importedCount++;
              message += "- Sub-Task Details: Imported\n";
          } else if (dataManagementOptions.import.subTaskDetails && !importedData.subTaskDetails) {
              skippedCount++;
              message += "- Sub-Task Details: Skipped (not found in file)\n";
          }

          if (importedCount === 0 && skippedCount === 0) {
              message = "No data categories were selected for import or found in the file.";
          } else if (importedCount > 0) {
              message += "\nData imported successfully!";
          } else {
              message += "\nNo data was imported.";
          }
          alert(message);

        }
      } catch (error) {
        console.error("Error importing data:", error);
        alert('Failed to import data. Please ensure the file is a valid JSON.');
      }
      // Clear the file input after processing
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleEnableAudio = () => {
    setAudioEnabled(true);
    // Attempt to play a silent sound or the actual alert sound
    // This initial play, triggered by user interaction, will unlock subsequent programmatic plays
    audioRef.current.play().catch(e => console.log("Audio play failed on initial attempt (expected if no sound):", e));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-inter text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 mb-8 flex flex-col h-full">
        {/* Header and Tabs */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-indigo-700">My Daily Rhythm</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'schedule' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <CalendarDays className="inline-block mr-2" size={18} /> Schedule
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'planner' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Plus className="inline-block mr-2" size={18} /> Planner
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart2 className="inline-block mr-2" size={18} /> Tasks
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'report' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart2 className="inline-block mr-2" size={18} /> Report
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Settings className="inline-block mr-2" size={18} /> Settings
            </button>
          </div>
        </div>

        {/* Conditional rendering for tabs */}
        {activeTab === 'schedule' && (
          <div className="flex flex-col flex-grow">
            {/* Date Navigation */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-semibold text-indigo-800">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Pomodoro Timer */}
            <div className={`rounded-lg p-4 mb-6 text-center shadow-inner flex-shrink-0 transition-colors duration-300
              ${pomodoroTimer.mode === 'work' ? 'bg-green-100' :
                pomodoroTimer.mode === 'short_break' ? 'bg-blue-100' :
                pomodoroTimer.mode === 'long_break' ? 'bg-purple-100' : 'bg-indigo-50'
              }`}
            >
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Pomodoro Timer</h3>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold">
                  {formatTime(pomodoroTimer.timeLeft)}
                </div>
                {/* Simple linear progress bar for Pomodoro */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-linear
                    ${pomodoroTimer.mode === 'work' ? 'bg-green-500' :
                      pomodoroTimer.mode === 'short_break' ? 'bg-blue-500' :
                      pomodoroTimer.mode === 'long_break' ? 'bg-purple-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${(pomodoroTimer.timeLeft / ((pomodoroTimer.mode === 'work' ? pomodoroSettings.work : (pomodoroTimer.mode === 'short_break' ? pomodoroSettings.shortBreak : pomodoroSettings.longBreak)) * 60)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <p className={`text-lg mb-4 capitalize font-semibold flex items-center justify-center
                ${pomodoroTimer.mode === 'work' ? 'text-green-700' :
                  pomodoroTimer.mode === 'short_break' ? 'text-blue-700' :
                  pomodoroTimer.mode === 'long_break' ? 'text-purple-700' : 'text-gray-600'
                }`}>
                {pomodoroTimer.mode === 'work' && <PlayCircle size={20} className="mr-2" />}
                {pomodoroTimer.mode === 'short_break' && <FastForward size={20} className="mr-2" />}
                {pomodoroTimer.mode === 'long_break' && <FastForward size={20} className="mr-2" />}
                {pomodoroTimer.mode.replace('_', ' ')} Session
              </p>
              {currentPomodoroBlockId && getAssignedTaskInfo(currentPomodoroBlockId) && (
                <p className="text-sm text-gray-700 mb-2">
                  Working on: <span className="font-bold">
                    {getAssignedTaskInfo(currentPomodoroBlockId).taskName}
                    {getAssignedTaskInfo(currentPomodoroBlockId).subtaskName && ` - ${getAssignedTaskInfo(currentPomodoroBlockId).subtaskName}`}
                  </span>
                </p>
              )}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={startPomodoro}
                  disabled={pomodoroTimer.running}
                  className="p-3 rounded-full bg-green-500 text-white shadow-md hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Start Pomodoro"
                >
                  <Play size={24} />
                </button>
                <button
                  onClick={pausePomodoro}
                  disabled={!pomodoroTimer.running}
                  className="p-3 rounded-full bg-yellow-500 text-white shadow-md hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Pause Pomodoro"
                >
                  <Pause size={24} />
                </button>
                <button
                  onClick={resetPomodoro}
                  className="p-3 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors duration-200"
                  aria-label="Reset Pomodoro"
                >
                  <RotateCcw size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Pomodoros Completed: {pomodoroTimer.pomodorosCompleted}</p>

              {/* Audio Enable Button */}
              {!audioEnabled && (
                <button
                  onClick={handleEnableAudio}
                  className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-md shadow-md hover:bg-purple-600 transition-colors duration-200 flex items-center justify-center mx-auto"
                >
                  <BellRing size={20} className="mr-2" /> Enable Sounds
                </button>
              )}
              {audioEnabled && (
                <p className="mt-4 text-sm text-green-700 flex items-center justify-center">
                  <BellRing size={16} className="mr-1" /> Sounds Enabled
                </p>
              )}


              {/* Daily Insights */}
              <div className="mt-4 border-t pt-4 border-indigo-200">
                <h4 className="text-lg font-semibold text-indigo-700 mb-2">Daily Insights</h4>
                <p className="text-sm text-gray-600">
                  Focused Work: <span className="font-bold">{(reportData.totalFocused || 0).toFixed(2)} / {(reportData.totalPlannedFocusedTime || 0).toFixed(2)} hrs</span>
                </p>
                <p className="text-sm text-gray-600">
                  Prayers Logged: <span className="font-bold">{(reportData.totalActualPrayerTime || 0).toFixed(0)} / {(reportData.totalPlannedPrayerTime || 0).toFixed(0)} (est)</span>
                </p>
                {currentOngoingTask && (
                  <p
                    onClick={() => scrollToActivity(currentOngoingTask.id)}
                    className="text-base text-indigo-700 font-semibold mb-2 flex items-center justify-center cursor-pointer hover:text-indigo-900 transition-colors"
                    role="button" tabIndex="0" aria-label={`Scroll to current task: ${currentOngoingTask.activity}`}
                  >
                    <FastForward size={18} className="mr-2" /> Current Task: {currentOngoingTask.activity} ({currentOngoingTask.plannedStart} - {currentOngoingTask.plannedEnd})
                  </p>
                )}
                {nextTask && (
                  <p
                    onClick={() => scrollToActivity(nextTask.id)}
                    className="text-base text-indigo-700 font-semibold flex items-center justify-center cursor-pointer hover:text-indigo-900 transition-colors"
                    role="button" tabIndex="0" aria-label={`Scroll to next scheduled task: ${nextTask.activity}`}
                  >
                    <FastForward size={18} className="mr-2" /> Next Scheduled Task: {nextTask.activity} ({nextTask.plannedStart} - {nextTask.plannedEnd})
                  </p>
                )}
                {nextPrayer && (
                  <p
                    onClick={() => scrollToActivity(nextPrayer.id)}
                    className="text-base text-indigo-700 font-semibold mt-2 flex items-center justify-center cursor-pointer hover:text-indigo-900 transition-colors"
                    role="button" tabIndex="0" aria-label={`Scroll to next prayer: ${nextPrayer.activity}`}
                  >
                    <FastForward size={18} className="mr-2" /> Next Prayer: {nextPrayer.activity} ({nextPrayer.plannedStart} - {nextPrayer.plannedEnd})
                  </p>
                )}
              </div>
            </div>

            {/* Scrollable Schedule Table */}
            <div className="overflow-y-auto flex-grow" ref={scheduleTableRef}>
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-indigo-100 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tl-lg">Activity</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Planned</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Actual Start</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Actual End</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Actual Duration</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timeOfDayOrder.map(groupName => {
                    const activitiesInGroup = groupedSchedule[groupName];
                    if (!activitiesInGroup || activitiesInGroup.length === 0) return null;

                    const isCollapsed = collapsedSections[groupName];

                    return (
                      <React.Fragment key={groupName}>
                        <tr className="bg-indigo-200 sticky top-12 z-10">
                          <td colSpan="6" className="py-2 px-4 text-left text-md font-bold text-indigo-800 cursor-pointer" onClick={() => toggleSection(groupName)}>
                            {groupName.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            <span className="ml-2">{isCollapsed ? '▼' : '▲'}</span>
                          </td>
                        </tr>
                        {!isCollapsed && activitiesInGroup.map((activity) => {
                          const log = getLogForActivity(activity.id);
                          const assignedTaskInfo = getAssignedTaskInfo(activity.id);
                          const actualDuration = getActualDuration(log);
                          const progressBarPercentage = getProgressBarPercentage(activity.id);
                          const isSubdividedBlock = (activity.type === 'academic' || activity.originalActivityId === 'flexible-afternoon') && activity.id.includes('-part');
                          const currentAdHocSubTask = subTaskDetails[activity.id] || ''; // Ad-hoc subtask
                          const timeGroup = getTimeOfDayGroup(activity.plannedStart);
                          const activityNameLower = activity.activity.toLowerCase();
                          const isPrayerBlock = activityNameLower.includes('iqamah & prayer') || activityNameLower.includes('prayer');

                          // Determine activity status
                          let status = '';
                          let statusIcon = null;
                          let statusColor = '';
                          const now = new Date();
                          const plannedStart = parseTime(activity.plannedStart, currentDate);
                          const plannedEnd = parseTime(activity.plannedEnd, currentDate);
                          let activityEndToday = new Date(plannedEnd);
                          if (plannedEnd < plannedStart) {
                            activityEndToday.setDate(activityEndToday.getDate() + 1);
                          }

                          if (log?.actualEnd) {
                            status = 'Completed';
                            statusIcon = <CheckCircle size={14} className="inline-block mr-1" />;
                            statusColor = 'text-green-600';
                          } else if (log?.actualStart && !log?.actualEnd) {
                            status = 'Started';
                            statusIcon = <PlayCircle size={14} className="inline-block mr-1" />;
                            statusColor = 'text-blue-600';
                          } else if (now > activityEndToday && !log?.actualEnd) {
                            status = 'Overdue';
                            statusIcon = <AlertCircle size={14} className="inline-block mr-1" />;
                            statusColor = 'text-red-600';
                          } else {
                            status = 'Scheduled';
                            statusIcon = <Clock size={14} className="inline-block mr-1" />;
                            statusColor = 'text-gray-500';
                          }

                          return (
                            <tr
                              key={activity.id}
                              ref={el => activityRefs.current.set(activity.id, el)}
                              className={`border-b border-gray-200 hover:bg-gray-50 relative
                                ${activity.id === currentActivityId ? 'bg-indigo-100 border-l-4 border-indigo-600' : ''}
                                ${isPrayerBlock
                                  ? 'bg-green-50'
                                  : (
                                    timeGroup === 'night' ? 'bg-gray-100' :
                                    timeGroup === 'early-morning' ? 'bg-sky-50' :
                                    timeGroup === 'midday' ? 'bg-amber-50' :
                                    timeGroup === 'afternoon' ? 'bg-teal-50' :
                                    timeGroup === 'evening' ? 'bg-purple-50' : ''
                                  )
                                }
                              `}
                            >
                              <td className="py-3 px-4 text-sm font-medium text-gray-700">
                                <span className={`${isPrayerBlock ? 'font-bold' : ''}`}>
                                  {activity.activity}
                                </span>
                                <span className="block text-xs text-gray-500">
                                  {activity.plannedStart} - {activity.plannedEnd}
                                </span>
                                <span className={`block text-xs font-semibold ${statusColor}`}>
                                  {statusIcon} {status}
                                </span>
                                {(isSubdividedBlock || assignedTaskInfo) && (
                                  <div className="flex items-center text-xs text-gray-600 mt-1">
                                    <span className="mr-1 text-indigo-500"><Edit size={12} /></span>
                                    {assignedTaskInfo ? (
                                      <span className="italic text-indigo-700">
                                        {assignedTaskInfo.taskName}
                                        {assignedTaskInfo.subtaskName && ` - ${assignedTaskInfo.subtaskName}`}
                                      </span>
                                    ) : editingSubTaskId === activity.id ? (
                                      <input
                                        type="text"
                                        value={currentAdHocSubTask}
                                        onChange={(e) => handleSubTaskChange(activity.id, e.target.value)}
                                        onBlur={() => handleSubTaskBlur(activity.id)}
                                        onKeyDown={(e) => handleSubTaskKeyDown(e, activity.id)}
                                        className="border-b border-indigo-400 focus:outline-none focus:border-indigo-600 text-sm bg-transparent w-full"
                                        autoFocus
                                        aria-label={`Edit sub-task for ${activity.activity}`}
                                      />
                                    ) : (
                                      <span
                                        onClick={() => setEditingSubTaskId(activity.id)}
                                        className="cursor-pointer hover:text-indigo-700 italic"
                                        role="button" tabIndex="0" aria-label={`Add or edit sub-task for ${activity.activity}`}
                                      >
                                        {currentAdHocSubTask || 'Click to add sub-task'}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {log?.actualStart && !log?.actualEnd && progressBarPercentage > 0 && (
                                  <div className="absolute bottom-0 left-0 h-1 bg-green-400 rounded-full"
                                       style={{ width: `${progressBarPercentage}%` }}></div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {getPlannedDuration(activity.plannedStart, activity.plannedEnd, currentDate).toFixed(2)} hrs
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {formatDateTime(log?.actualStart)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {formatDateTime(log?.actualEnd)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {actualDuration > 0 ? `${actualDuration.toFixed(2)} hrs` : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex space-x-2">
                                  {!log?.actualStart && (
                                    <button
                                      onClick={() => logTime(activity.id, 'start')}
                                      className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors duration-200"
                                      aria-label={`Start ${activity.activity}`}
                                    >
                                      <Play size={14} className="inline-block mr-1" /> Start
                                    </button>
                                  )}
                                  {log?.actualStart && !log?.actualEnd && (
                                    <button
                                      onClick={() => logTime(activity.id, 'end')}
                                      className="px-3 py-1 bg-purple-500 text-white rounded-md text-xs font-medium hover:bg-purple-600 transition-colors duration-200"
                                      aria-label={`End ${activity.activity}`}
                                    >
                                      <StopCircle size={14} className="inline-block mr-1" /> End
                                    </button>
                                  )}
                                  {log?.actualStart && (
                                    <button
                                      onClick={() => logTime(activity.id, 'reset')}
                                      className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors duration-200"
                                      aria-label={`Reset ${activity.activity}`}
                                    >
                                      <RefreshCcw size={14} className="inline-block mr-1" /> Reset
                                    </button>
                                  )}
                                  {(activity.type === 'academic' || activity.id === 'flexible-afternoon') && (
                                    assignedTaskInfo ? (
                                      <button
                                        onClick={() => handleUnassignTask(activity.id)}
                                        className="px-3 py-1 bg-gray-500 text-white rounded-md text-xs font-medium hover:bg-gray-600 transition-colors duration-200"
                                        aria-label={`Unassign task from ${activity.activity}`}
                                      >
                                        <Link size={14} className="inline-block mr-1 rotate-45" /> Unassign
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => openAssignTaskModal({ date: currentDate, activityId: activity.id })}
                                        className="px-3 py-1 bg-indigo-500 text-white rounded-md text-xs font-medium hover:bg-indigo-600 transition-colors duration-200"
                                        aria-label={`Assign task to ${activity.activity}`}
                                      >
                                        <Link size={14} className="inline-block mr-1" /> Assign
                                      </button>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Planner Tab */}
        {activeTab === 'planner' && (
          <div className="flex-grow overflow-y-auto">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Customize Your Schedule</h2>
            <p className="text-gray-600 mb-4">
              Edit your default daily activities here. Changes will apply to future schedules.
              Day-specific events (like soccer or Jumu'ah) will still override or integrate as usual.
            </p>
            <button
              onClick={handleAddActivity}
              className="mb-4 px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              aria-label="Add New Activity"
            >
              <Plus size={20} className="mr-2" /> Add New Activity
            </button>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tl-lg">Activity</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Start</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">End</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Type</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plannerSchedule.sort((a, b) => parseTime(a.plannedStart) - parseTime(b.plannedStart)).map((activity) => {
                    const timeGroup = getTimeOfDayGroup(activity.plannedStart);
                    const activityNameLower = activity.activity.toLowerCase();
                    const isPrayerBlock = activityNameLower.includes('iqamah & prayer') || activityNameLower.includes('prayer');
                    return (
                      <tr key={activity.id} className={`border-b border-gray-200 hover:bg-gray-50
                        ${isPrayerBlock
                          ? 'bg-green-50'
                          : (
                            timeGroup === 'night' ? 'bg-gray-100' :
                            timeGroup === 'early-morning' ? 'bg-sky-50' :
                            timeGroup === 'midday' ? 'bg-amber-50' :
                            timeGroup === 'afternoon' ? 'bg-teal-50' :
                            timeGroup === 'evening' ? 'bg-purple-50' : ''
                          )
                        }
                      `}>
                        <td className="py-3 px-4 text-sm font-medium text-gray-700">
                          <span className={`${isPrayerBlock ? 'font-bold' : ''}`}>
                            {activity.activity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{activity.plannedStart}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{activity.plannedEnd}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 capitalize">{activity.type}</td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditActivity(activity)}
                              className="p-2 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors duration-200"
                              aria-label={`Edit ${activity.activity}`}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="p-2 bg-red-500 text-white rounded-md text-xs hover:bg-red-600 transition-colors duration-200"
                              aria-label={`Delete ${activity.activity}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NEW: Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="flex-grow overflow-y-auto">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-4">My Projects & Tasks</h2>
            <p className="text-gray-600 mb-4">
              Manage your long-term projects and individual tasks here. You can set target dates and track progress.
            </p>
            <div className="flex space-x-4 mb-4">
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center"
                aria-label="Add New Task"
              >
                <Plus size={20} className="mr-2" /> Add New Task
              </button>
              <button
                onClick={() => setShowEisenhowerMatrix(prev => !prev)}
                className="px-4 py-2 bg-purple-500 text-white rounded-md shadow-md hover:bg-purple-600 transition-colors duration-200 flex items-center"
                aria-label={showEisenhowerMatrix ? "Show All Tasks" : "Show Eisenhower Matrix"}
              >
                {showEisenhowerMatrix ? (
                  <>
                    <CalendarDays size={20} className="mr-2" /> Show All Tasks
                  </>
                ) : (
                  <>
                    <BarChart2 size={20} className="mr-2" /> Show Eisenhower Matrix
                  </>
                )}
              </button>
            </div>

            {showEisenhowerMatrix ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['Do Now', 'Schedule', 'Delegate', 'Eliminate'].map(quadrant => (
                  <div key={quadrant} className={`p-4 rounded-lg shadow-md
                    ${quadrant === 'Do Now' ? 'bg-red-100 border-l-4 border-red-500' : ''}
                    ${quadrant === 'Schedule' ? 'bg-blue-100 border-l-4 border-blue-500' : ''}
                    ${quadrant === 'Delegate' ? 'bg-yellow-100 border-l-4 border-yellow-500' : ''}
                    ${quadrant === 'Eliminate' ? 'bg-gray-100 border-l-4 border-gray-500' : ''}
                  `}>
                    <h3 className="text-lg font-bold mb-3">
                      {quadrant}
                      <span className="block text-sm font-normal text-gray-600">
                        {quadrant === 'Do Now' && 'Urgent & Important'}
                        {quadrant === 'Schedule' && 'Important, Not Urgent'}
                        {quadrant === 'Delegate' && 'Urgent, Not Important'}
                        {quadrant === 'Eliminate' && 'Not Urgent, Not Important'}
                      </span>
                    </h3>
                    {eisenhowerTasks[quadrant] && eisenhowerTasks[quadrant].length > 0 ? (
                      <ul className="space-y-2">
                        {eisenhowerTasks[quadrant].map(task => (
                          <li key={task.id} className="bg-white p-3 rounded-md shadow-sm flex items-center justify-between">
                            <span className="font-medium text-gray-800">{task.name}</span>
                            <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                                  aria-label={`Edit ${task.name}`}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleSaveTask({...task, actualCompletionDate: formatDateToYYYYMMDD(new Date()), status: 'completed'})}
                                    className="p-1 text-green-500 hover:text-green-700 transition-colors"
                                    aria-label={`Mark ${task.name} as complete`}
                                >
                                    <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => openAssignTaskModal(null, { taskId: task.id, subtaskId: null })}
                                  className="p-1 text-indigo-500 hover:text-indigo-700 transition-colors"
                                  aria-label={`Assign ${task.name} to schedule`}
                                >
                                  <Link size={16} />
                                </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No tasks in this quadrant.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-md">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tl-lg">Task Name</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Type</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Target Start</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Deadline</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Expected Duration</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Urgency</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Importance</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectTasks.sort((a, b) => {
                      const dateA = a.deadlineDate ? new Date(a.deadlineDate) : new Date('9999-12-31');
                      const dateB = b.deadlineDate ? new Date(b.deadlineDate) : new Date('9999-12-31');
                      return dateA - dateB;
                    }).map((task) => {
                      // Determine task status based on dates
                      let taskStatus = task.status;
                      const today = new Date();
                      today.setHours(0,0,0,0); // Normalize today to start of day

                      const deadline = task.deadlineDate ? new Date(task.deadlineDate) : null;
                      if (deadline) deadline.setHours(0,0,0,0);

                      const targetStart = task.targetStartDate ? new Date(task.targetStartDate) : null;
                      if (targetStart) targetStart.setHours(0,0,0,0);

                      if (task.actualCompletionDate) {
                          taskStatus = 'completed';
                      } else if (deadline && today > deadline && task.status !== 'completed') {
                          taskStatus = 'overdue';
                      } else if (task.status === 'pending' && targetStart && today >= targetStart) {
                          taskStatus = 'in-progress'; // Auto-set to in-progress if target start passed and not completed
                      }

                      const isDueSoon = !task.actualCompletionDate && deadline && (deadline.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000) && today <= deadline;
                      const isOverdue = taskStatus === 'overdue';

                      return (
                        <tr key={task.id} className={`border-b border-gray-200 hover:bg-gray-50
                          ${isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-yellow-50' : ''}
                        `}>
                          <td className="py-3 px-4 text-sm font-medium text-gray-700">
                            {task.name}
                            {(isDueSoon || isOverdue) && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                                ${isOverdue ? 'bg-red-400 text-white' : 'bg-yellow-400 text-gray-800'}
                              `}>
                                {isOverdue ? 'Overdue' : 'Due Soon'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 capitalize">{task.type}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{task.targetStartDate || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{task.deadlineDate || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{task.expectedDurationHours ? `${task.expectedDurationHours} hrs` : '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 capitalize">{task.urgency || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 capitalize">{task.importance || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                            <span className={`font-semibold
                              ${taskStatus === 'completed' ? 'text-green-600' : ''}
                              ${taskStatus === 'overdue' ? 'text-red-600' : ''}
                              ${taskStatus === 'in-progress' ? 'text-blue-600' : ''}
                            `}>
                              {taskStatus.replace('-', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-2 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors duration-200"
                                aria-label={`Edit ${task.name}`}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 bg-red-500 text-white rounded-md text-xs hover:bg-red-600 transition-colors duration-200"
                                aria-label={`Delete ${task.name}`}
                              >
                                <Trash2 size={16} />
                              </button>
                              {!task.actualCompletionDate && taskStatus !== 'completed' && (
                                  <button
                                      onClick={() => handleSaveTask({...task, actualCompletionDate: formatDateToYYYYMMDD(new Date()), status: 'completed'})}
                                      className="p-2 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition-colors duration-200"
                                      aria-label={`Mark ${task.name} as complete`}
                                  >
                                      <CheckCircle size={16} />
                                  </button>
                              )}
                              <button
                                onClick={() => openAssignTaskModal(null, { taskId: task.id, subtaskId: null })}
                                className="p-2 bg-indigo-500 text-white rounded-md text-xs hover:bg-indigo-600 transition-colors duration-200"
                                aria-label={`Assign ${task.name} to schedule`}
                              >
                                <Link size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="flex-grow overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setReportDate(prev => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() - 1); return newDate; })}
                className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200"
                aria-label="Previous day"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-semibold text-indigo-800">
                Report for {reportDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <button
                onClick={() => setReportDate(prev => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() + 1); return newDate; })}
                className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200"
                aria-label="Next day"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 mb-6 shadow-inner">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Summary</h3>
              <p className="text-lg text-gray-700">
                Total Actual Deep Work Mode Time:{' '}
                <span className="font-bold">{(reportData.totalFocused || 0).toFixed(2)} hours</span>
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(reportData.summary).map(([type, data]) => (
                  <div key={type} className="bg-white p-3 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-indigo-600 capitalize">{type} Activities</h4>
                    <p className="text-sm text-gray-600">Planned: {(data.planned || 0).toFixed(2)} hrs</p>
                    <p className="text-sm text-gray-600">Actual: {(data.actual || 0).toFixed(2)} hrs</p>
                    {/* Simple Bar Chart for Planned vs Actual */}
                    <div className="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${((data.actual || 0) / Math.max((data.planned || 0), (data.actual || 0), 1)) * 100}%` }}
                        title={`Actual: ${(data.actual || 0).toFixed(2)} hrs, Planned: ${(data.planned || 0).toFixed(2)} hrs`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-xl font-semibold text-indigo-700 mb-4">Detailed Logs</h3>
            {reportData.summary && Object.values(reportData.summary).some(s => s.activities.length > 0) ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-md">
                  <thead className="bg-indigo-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tl-lg">Activity</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Sub-Task</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Actual Start</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Actual End</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tr-lg">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(reportData.summary).flatMap(s => s.activities).sort((a,b) => new Date(a.actualStart) - new Date(b.actualStart)).map((log, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-700">{log.activity}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{log.subTask || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(log.actualStart)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDateTime(log.actualEnd)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{log.actualDuration.toFixed(2)} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No activities logged for this day.</p>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="flex-grow overflow-y-auto">
            <div className="bg-indigo-50 rounded-lg p-6 shadow-inner">
              <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Pomodoro Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="work" className="block text-sm font-medium text-gray-700 mb-1">Work Duration (minutes)</label>
                  <input
                    type="number"
                    id="work"
                    name="work"
                    value={pomodoroSettings.work}
                    onChange={handlePomodoroSettingChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="shortBreak" className="block text-sm font-medium text-gray-700 mb-1">Short Break (minutes)</label>
                  <input
                    type="number"
                    id="shortBreak"
                    name="shortBreak"
                    value={pomodoroSettings.shortBreak}
                    onChange={handlePomodoroSettingChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="longBreak" className="block text-sm font-medium text-gray-700 mb-1">Long Break (minutes)</label>
                  <input
                    type="number"
                    id="longBreak"
                    name="longBreak"
                    value={pomodoroSettings.longBreak}
                    onChange={handlePomodoroSettingChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="longBreakInterval" className="block text-sm font-medium text-gray-700 mb-1">Long Break Interval (Pomodoros)</label>
                  <input
                    type="number"
                    id="longBreakInterval"
                    name="longBreakInterval"
                    value={pomodoroSettings.longBreakInterval}
                    onChange={handlePomodoroSettingChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Changes are saved automatically.</p>

              <h2 className="text-2xl font-semibold text-indigo-800 mt-8 mb-4">Data Management</h2>
              <div className="flex flex-col space-y-3">
                <h3 className="text-lg font-semibold text-indigo-700 mt-4 mb-2">Export Options</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.export.tasks}
                      onChange={(e) => handleDataOptionChange('export', 'tasks', e.target.checked)}
                    />
                    <span className="ml-2">Task List</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.export.dailySchedule}
                      onChange={(e) => handleDataOptionChange('export', 'dailySchedule', e.target.checked)}
                    />
                    <span className="ml-2">Daily Schedule</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.export.activityLogs}
                      onChange={(e) => handleDataOptionChange('export', 'activityLogs', e.target.checked)}
                    />
                    <span className="ml-2">Activity Logs</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.export.pomodoroSettings}
                      onChange={(e) => handleDataOptionChange('export', 'pomodoroSettings', e.target.checked)}
                    />
                    <span className="ml-2">Pomodoro Settings</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.export.subTaskDetails}
                      onChange={(e) => handleDataOptionChange('export', 'subTaskDetails', e.target.checked)}
                    />
                    <span className="ml-2">Sub-Task Details (Ad-hoc)</span>
                  </label>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center mt-4"
                >
                  <Download size={20} className="mr-2" /> Export Selected Data
                </button>

                <h3 className="text-lg font-semibold text-indigo-700 mt-6 mb-2">Import Options</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.import.tasks}
                      onChange={(e) => handleDataOptionChange('import', 'tasks', e.target.checked)}
                    />
                    <span className="ml-2">Task List</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.import.dailySchedule}
                      onChange={(e) => handleDataOptionChange('import', 'dailySchedule', e.target.checked)}
                    />
                    <span className="ml-2">Daily Schedule</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.import.activityLogs}
                      onChange={(e) => handleDataOptionChange('import', 'activityLogs', e.target.checked)}
                    />
                    <span className="ml-2">Activity Logs</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.import.pomodoroSettings}
                      onChange={(e) => handleDataOptionChange('import', 'pomodoroSettings', e.target.checked)}
                    />
                    <span className="ml-2">Pomodoro Settings</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      checked={dataManagementOptions.import.subTaskDetails}
                      onChange={(e) => handleDataOptionChange('import', 'subTaskDetails', e.target.checked)}
                    />
                    <span className="ml-2">Sub-Task Details (Ad-hoc)</span>
                  </label>
                </div>
                <label htmlFor="importFile" className="px-4 py-2 bg-purple-500 text-white rounded-md shadow-md hover:bg-purple-600 transition-colors duration-200 flex items-center justify-center cursor-pointer mt-4">
                  <Upload size={20} className="mr-2" /> Import Data
                  <input
                    type="file"
                    id="importFile"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="text-gray-600 text-sm mt-8 flex-shrink-0">
        Built with React and Tailwind CSS. Data saved in browser's local storage.
      </footer>

      {/* Planner Modal */}
      {isPlannerModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto relative">
            <button
              onClick={handleCancelEdit}
              className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-indigo-700 mb-4">
              {editingActivity?.isNew ? 'Add New Activity' : 'Edit Activity'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="activityName" className="block text-sm font-medium text-gray-700">Activity Name</label>
                <input
                  type="text"
                  id="activityName"
                  value={editingActivity?.activity || ''}
                  onChange={(e) => setEditingActivity(prev => ({ ...prev, activity: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="plannedStart" className="block text-sm font-medium text-gray-700">Planned Start (HH:MM)</label>
                <input
                  type="time"
                  id="plannedStart"
                  value={editingActivity?.plannedStart || '09:00'}
                  onChange={(e) => setEditingActivity(prev => ({ ...prev, plannedStart: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="plannedEnd" className="block text-sm font-medium text-gray-700">Planned End (HH:MM)</label>
                <input
                  type="time"
                  id="plannedEnd"
                  value={editingActivity?.plannedEnd || '10:00'}
                  onChange={(e) => setEditingActivity(prev => ({ ...prev, plannedEnd: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  id="activityType"
                  value={editingActivity?.type || 'personal'}
                  onChange={(e) => setEditingActivity(prev => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="personal">Personal</option>
                  <option value="academic">Academic</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="physical">Physical</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                <X size={18} className="inline-block mr-1" /> Cancel
              </button>
              <button
                onClick={() => handleSaveActivity(editingActivity)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Save size={18} className="inline-block mr-1" /> Save Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto relative">
            <button
              onClick={handleCancelTaskEdit}
              className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-indigo-700 mb-4">
              {editingTask?.isNew ? 'Add New Task' : 'Edit Task'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">Task Name</label>
                <input
                  type="text"
                  id="taskName"
                  value={editingTask?.name || ''}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="taskDescription"
                  value={editingTask?.description || ''}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div>
                <label htmlFor="taskType" className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  id="taskType"
                  value={editingTask?.type || 'personal'}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="personal">Personal</option>
                  <option value="academic">Academic</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="physical">Physical</option>
                  <option value="work">Work</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label htmlFor="targetStartDate" className="block text-sm font-medium text-gray-700">Target Start Date</label>
                <input
                  type="date"
                  id="targetStartDate"
                  value={editingTask?.targetStartDate || ''}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, targetStartDate: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="deadlineDate" className="block text-sm font-medium text-gray-700">Deadline Date</label>
                <input
                  type="date"
                  id="deadlineDate"
                  value={editingTask?.deadlineDate || ''}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, deadlineDate: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="expectedDurationHours" className="block text-sm font-medium text-gray-700">Expected Duration (Hours)</label>
                <input
                  type="number"
                  id="expectedDurationHours"
                  value={editingTask?.expectedDurationHours || 0}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, expectedDurationHours: Number(e.target.value) }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">Urgency</label>
                <select
                  id="urgency"
                  value={editingTask?.urgency || 'medium'}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, urgency: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label htmlFor="importance" className="block text-sm font-medium text-gray-700">Importance</label>
                <select
                  id="importance"
                  value={editingTask?.importance || 'medium'}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, importance: e.target.value }))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              {editingTask && !editingTask.isNew && ( // Only show status and actual completion for existing tasks
                <>
                  <div>
                    <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="taskStatus"
                      value={editingTask?.status || 'pending'}
                      onChange={(e) => setEditingTask(prev => ({ ...prev, status: e.target.value }))}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  {editingTask.status === 'completed' && (
                    <div>
                      <label htmlFor="actualCompletionDate" className="block text-sm font-medium text-gray-700">Actual Completion Date</label>
                      <input
                        type="date"
                        id="actualCompletionDate"
                        value={editingTask?.actualCompletionDate || ''}
                        onChange={(e) => setEditingTask(prev => ({ ...prev, actualCompletionDate: e.target.value }))}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Subtasks Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-lg font-semibold text-indigo-700 mb-2">Subtasks</h4>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    id="newSubtaskName"
                    placeholder="New subtask name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleAddSubtask(editingTask.id, e.target.value.trim());
                        e.target.value = ''; // Clear input
                      }
                    }}
                    className="flex-grow p-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('newSubtaskName');
                      if (input.value.trim()) {
                        handleAddSubtask(editingTask.id, input.value.trim());
                        input.value = ''; // Clear input
                      }
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {editingTask?.subtasks && editingTask.subtasks.length > 0 ? (
                  <ul className="space-y-2">
                    {editingTask.subtasks.map(subtask => (
                      <li key={subtask.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center flex-grow">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => handleToggleSubtaskCompletion(editingTask.id, subtask.id)}
                            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          {editingSubtaskNameId === subtask.id ? (
                            <input
                              type="text"
                              value={subtask.name}
                              onChange={(e) => handleEditSubtaskName(editingTask.id, subtask.id, e.target.value)}
                              onBlur={() => setEditingSubtaskNameId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingSubtaskNameId(null);
                                }
                              }}
                              className="border-b border-indigo-400 focus:outline-none focus:border-indigo-600 text-sm bg-transparent w-full"
                              autoFocus
                            />
                          ) : (
                            <span
                              onClick={() => setEditingSubtaskNameId(subtask.id)}
                              className={`cursor-pointer text-sm flex-grow ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}
                            >
                              {subtask.name}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSubtask(editingTask.id, subtask.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          aria-label={`Delete subtask ${subtask.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No subtasks added yet.</p>
                )}
              </div>

            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancelTaskEdit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                <X size={18} className="inline-block mr-1" /> Cancel
              </button>
              <button
                onClick={() => handleSaveTask(editingTask)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Save size={18} className="inline-block mr-1" /> Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Assign Task to Schedule Modal */}
      {isAssignTaskModalOpen && (
        <AssignTaskModal
          onClose={() => {
            setIsAssignTaskModalOpen(false);
            setAssigningToActivity(null);
            setAssigningFromTask(null);
          }}
          projectTasks={projectTasks}
          dailyScheduleState={dailyScheduleState}
          currentDate={currentDate}
          onAssign={handleAssignTask}
          assigningToActivity={assigningToActivity}
          assigningFromTask={assigningFromTask}
        />
      )}

      {/* NEW: Reminder Modal */}
      {showReminderModal && reminderActivity && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center relative">
            <button
              onClick={() => setShowReminderModal(false)}
              className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close reminder"
            >
              <X size={20} />
            </button>
            <BellRing size={48} className="mx-auto text-yellow-500 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-indigo-700 mb-2">Upcoming Activity!</h3>
            <p className="text-lg text-gray-800 mb-4">
              <span className="font-semibold">{reminderActivity.activity}</span>
            </p>
            <p className="text-md text-gray-600 mb-6">
              Starting at: <span className="font-bold">{reminderActivity.plannedStart}</span>
            </p>
            <button
              onClick={() => setShowReminderModal(false)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 transition-colors"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// AssignTaskModal Component
const AssignTaskModal = ({ onClose, projectTasks, dailyScheduleState, currentDate, onAssign, assigningToActivity, assigningFromTask }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(assigningToActivity?.date || currentDate);
  const [selectedActivityId, setSelectedActivityId] = useState(assigningToActivity?.activityId || '');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (assigningFromTask) {
      const task = projectTasks.find(t => t.id === assigningFromTask.taskId);
      setSelectedTask(task);
      if (assigningFromTask.subtaskId && task) {
        setSelectedSubtask(task.subtasks?.find(st => st.id === assigningFromTask.subtaskId));
      }
    }
  }, [assigningFromTask, projectTasks]);

  const filteredTasks = projectTasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const relevantScheduleActivities = dailyScheduleState.filter(activity =>
    activity.type === 'academic' || activity.id === 'flexible-afternoon'
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-full overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-semibold text-indigo-700 mb-4">Assign Task to Schedule</h3>

        <div className="space-y-4">
          {/* Task Selection */}
          {!assigningFromTask && (
            <div>
              <label htmlFor="taskSearch" className="block text-sm font-medium text-gray-700 mb-1">Search Task</label>
              <input
                type="text"
                id="taskSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search tasks..."
                className="w-full p-2 border border-gray-300 rounded-md mb-2"
              />
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedTask?.id || ''}
                onChange={(e) => {
                  const task = projectTasks.find(t => t.id === e.target.value);
                  setSelectedTask(task);
                  setSelectedSubtask(null); // Reset subtask when main task changes
                }}
              >
                <option value="">Select a Task</option>
                {filteredTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.name} ({task.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTask && (
            <>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Selected Task:</p>
                <p className="font-semibold text-indigo-800">{selectedTask.name}</p>
              </div>

              {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                <div>
                  <label htmlFor="subtaskSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Subtask (Optional)</label>
                  <select
                    id="subtaskSelect"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedSubtask?.id || ''}
                    onChange={(e) => {
                      const subtask = selectedTask.subtasks.find(st => st.id === e.target.value);
                      setSelectedSubtask(subtask);
                    }}
                  >
                    <option value="">No specific subtask</option>
                    {selectedTask.subtasks.map(subtask => (
                      <option key={subtask.id} value={subtask.id}>
                        {subtask.name} {subtask.completed && '(Completed)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Schedule Block Selection */}
          {!assigningToActivity && (
            <div>
              <label htmlFor="assignDate" className="block text-sm font-medium text-gray-700 mb-1">Assign to Date</label>
              <input
                type="date"
                id="assignDate"
                value={formatDateToYYYYMMDD(selectedDate)}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md mb-2"
              />
            </div>
          )}

          <div>
            <label htmlFor="activitySelect" className="block text-sm font-medium text-gray-700 mb-1">Assign to Schedule Block</label>
            <select
              id="activitySelect"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
            >
              <option value="">Select an Activity Block</option>
              {relevantScheduleActivities.map(activity => (
                <option key={activity.id} value={activity.id}>
                  {activity.activity} ({activity.plannedStart} - {activity.plannedEnd})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            <X size={18} className="inline-block mr-1" /> Cancel
          </button>
          <button
            onClick={() => onAssign(selectedDate, selectedActivityId, selectedTask?.id, selectedSubtask?.id)}
            disabled={!selectedTask || !selectedActivityId}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="inline-block mr-1" /> Assign
          </button>
        </div>
      </div>
    </div>
  );
};
export default App;

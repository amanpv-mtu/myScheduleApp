import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, BarChart2, CalendarDays, ChevronLeft, ChevronRight, Settings, FastForward, Edit, Plus, Trash2, Save, X } from 'lucide-react'; // Added new icons

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

// Helper to determine time of day group for styling
const getTimeOfDayGroup = (timeStr) => {
  const [hours] = timeStr.split(':').map(Number);

  if (hours >= 0 && hours < 5) return 'night'; // 00:00 to 04:59
  if (hours >= 5 && hours < 9) return 'early-morning'; // 05:00 to 08:59
  if (hours >= 9 && hours < 13) return 'midday'; // 09:00 to 12:59
  if (hours >= 13 && hours < 19) return 'afternoon'; // 13:00 to 18:59 - Changed to avoid green overlap
  if (hours >= 19 && hours <= 23) return 'evening'; // 19:00 to 23:59

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
    { id: 'pre-sleep', activity: 'Pre-Sleep Routine', plannedStart: '23:45', plannedEnd: '00:00', type: 'personal' },
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
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule', 'report', 'settings', 'planner'
  const [reportDate, setReportDate] = useState(new Date());
  const intervalRef = useRef(null);
  const audioRef = useRef(new Audio('https://www.soundjay.com/buttons/beep-07.mp3')); // Simple beep sound
  const [currentActivityId, setCurrentActivityId] = useState(null); // State for current block highlighting

  // State to hold the daily schedule, calculated only when currentDate changes
  const [dailyScheduleState, setDailyScheduleState] = useState([]);

  // State for editable sub-task details
  const [subTaskDetails, setSubTaskDetails] = useState(() => {
    try {
      const savedSubTasks = localStorage.getItem('subTaskDetails');
      return savedSubTasks ? JSON.parse(savedSubTasks) : {};
    } catch (error) {
      console.error("Failed to parse subTaskDetails from localStorage:", error);
      return {};
    }
  });
  const [editingSubTaskId, setEditingSubTaskId] = useState(null); // State to track which sub-task is being edited

  // State to track the currently running schedule block for the Pomodoro timer
  const [currentPomodoroBlockId, setCurrentPomodoroBlockId] = useState(null);
  // State to track how much time of the current schedule block has been consumed by Pomodoro cycles
  const [blockTimeConsumed, setBlockTimeConsumed] = useState(0); // in seconds

  // NEW: State for the customizable planner schedule (base common activities)
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

  // Ref for the table container to enable scrolling
  const scheduleTableRef = useRef(null);
  // Refs for individual activity rows
  const activityRefs = useRef(new Map());


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

  // Save subTaskDetails to localStorage
  useEffect(() => {
    localStorage.setItem('subTaskDetails', JSON.stringify(subTaskDetails));
  }, [subTaskDetails]);

  // NEW: Save plannerSchedule to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('plannerSchedule', JSON.stringify(plannerSchedule));
  }, [plannerSchedule]);


  // Pomodoro Timer Logic
  useEffect(() => {
    if (pomodoroTimer.running) {
      intervalRef.current = setInterval(() => { // Assigns to intervalRef.current
        setPomodoroTimer(prev => {
          if (prev.timeLeft > 0) {
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          } else {
            // Time's up, play sound and clear interval
            audioRef.current.play();
            clearInterval(intervalRef.current);

            let nextMode = prev.mode;
            let nextPomodorosCompleted = prev.pomodorosCompleted;
            let nextTimeLeft = 0;

            const currentBlock = dailyScheduleState.find(block => block.id === currentPomodoroBlockId);
            const totalBlockDurationSeconds = currentBlock ? Math.floor(currentBlock.durationMinutes * 60) : 0;

            // Calculate the duration of the segment that just finished
            const completedSegmentDuration = (prev.mode === 'work' ? pomodoroSettings.work : (prev.mode === 'short_break' ? pomodoroSettings.shortBreak : pomodoroSettings.longBreak)) * 60;

            // Update the time consumed for the current schedule block
            // Use a functional update to ensure we get the latest blockTimeConsumed
            setBlockTimeConsumed(prevConsumed => {
                const newConsumed = prevConsumed + completedSegmentDuration;
                const remaining = totalBlockDurationSeconds - newConsumed;

                // If the block is completely finished after this segment, stop the timer fully
                if (currentBlock && remaining <= 0) {
                    setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                    setCurrentPomodoroBlockId(null);
                    setBlockTimeConsumed(0); // Reset for next block
                    return 0; // Return 0 to reset blockTimeConsumed
                }
                return newConsumed; // Return updated consumed time
            });

            // For immediate logic, calculate remaining time based on current state + completed segment
            const calculatedRemainingTime = totalBlockDurationSeconds - (blockTimeConsumed + completedSegmentDuration);


            if (prev.mode === 'work') {
                nextPomodorosCompleted++;

                // Decide if it's a long break or short break, or if the block is finished
                if (calculatedRemainingTime <= 0) { // Block is completely finished
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

                // If no time left for break, try next work session
                if (nextTimeLeft <= 0) {
                    nextMode = 'work'; // Try to start next work session
                    nextTimeLeft = Math.min(pomodoroSettings.work * 60, calculatedRemainingTime);
                    if (nextTimeLeft <= 0) { // No time for next work either, so stop
                        setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                        setCurrentPomodoroBlockId(null);
                        setBlockTimeConsumed(0);
                        return { ...prev, running: false, timeLeft: 0 };
                    }
                }

            } else { // prev.mode is 'short_break' or 'long_break'
                // Decide if it's another work session or if the block is finished
                if (calculatedRemainingTime <= 0) { // Block is completely finished
                    setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                    setCurrentPomodoroBlockId(null);
                    setBlockTimeConsumed(0);
                    return { ...prev, running: false, timeLeft: 0 };
                }

                nextMode = 'work';
                nextTimeLeft = Math.min(pomodoroSettings.work * 60, calculatedRemainingTime);

                if (nextTimeLeft <= 0) { // No time for next work either, stop
                    setPomodoroTimer({ ...prev, running: false, timeLeft: 0 });
                    setCurrentPomodoroBlockId(null);
                    setBlockTimeConsumed(0);
                    return { ...prev, running: false, timeLeft: 0 };
                }
            }

            // Schedule the next session (work or break) after a short delay
            setTimeout(() => {
                setPomodoroTimer({
                    running: true,
                    mode: nextMode,
                    timeLeft: nextTimeLeft,
                    pomodorosCompleted: nextPomodorosCompleted,
                });
            }, 1000); // Small delay before restarting timer

            return { ...prev, running: false, mode: nextMode, timeLeft: nextTimeLeft, pomodorosCompleted: nextPomodorosCompleted };
          }
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current); // Clears using intervalRef.current
    }

    return () => clearInterval(intervalRef.current); // Cleanup should also use intervalRef.current
  }, [pomodoroTimer.running, pomodoroTimer.timeLeft, pomodoroTimer.mode, pomodoroSettings, currentPomodoroBlockId, dailyScheduleState, blockTimeConsumed]);


  // Helper to subdivide an activity into smaller blocks
  const subdivideActivity = useCallback((activity, maxMinutes, dateContext) => {
    const subBlocks = [];
    let currentStart = parseTime(activity.plannedStart, dateContext);
    let originalEnd = parseTime(activity.plannedEnd, dateContext);

    // Handle overnight activities for subdivision
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
        // Ensure we don't duplicate "Pomodoro" in the name if it's already there
        activityName = `${activity.activity.split(' (Pomodoro')[0].split(' (Part')[0]} (Pomodoro ${part})`;
      } else if (activity.id === 'flexible-afternoon') {
        activityName = `Flexible Block (Part ${part})`;
      }


      subBlocks.push({
        ...activity,
        id: `${activity.id}-part${part}`,
        activity: activityName,
        originalActivityId: activity.id, // Keep track of the original activity
        plannedStart: formatTo24HourTime(currentStart),
        plannedEnd: formatTo24HourTime(subBlockEnd),
        durationMinutes: durationMinutes, // Store duration for easy Pomodoro linking
        // subTask will be managed by subTaskDetails state, not directly in activity object
      });

      currentStart = subBlockEnd;
      part++;
    }
    return subBlocks;
  }, []); // No dependencies as it operates on passed arguments

  // useEffect to calculate and set dailyScheduleState when currentDate changes
  useEffect(() => {
    const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const isSoccerDay = dayOfWeek === 3 || dayOfWeek === 6; // Wednesday (3) or Saturday (6)
    const isJumuah = dayOfWeek === 5; // Friday (5)

    // NEW: Use plannerSchedule as the base for common activities
    let scheduleForDay = JSON.parse(JSON.stringify(plannerSchedule)); // Deep copy to avoid direct mutation

    if (isSoccerDay) {
      // Filter out activities that conflict with soccer
      scheduleForDay = scheduleForDay.filter(
        item => !(item.id === 'evening-exercise' || item.id === 'dinner' || item.id === 'family-evening' ||
                  (parseTime(item.plannedStart, currentDate) >= parseTime('20:00', currentDate) && parseTime(item.plannedEnd, currentDate) <= parseTime('22:00', currentDate)))
      );
      // Insert soccer game at the correct time slot
      const soccerGame = initialDefaultSchedule.soccerDays[0]; // Use initial default for fixed events
      const insertIndex = scheduleForDay.findIndex(item => parseTime(item.plannedStart, currentDate) > parseTime(soccerGame.plannedStart, currentDate));
      scheduleForDay.splice(insertIndex > -1 ? insertIndex : scheduleForDay.length, 0, soccerGame);

      // Re-adjust dinner/family time around soccer if they were filtered out
      const soccerEndTime = parseTime(soccerGame.plannedEnd, currentDate);
      const dinnerStartTime = new Date(soccerEndTime.getTime() + 15 * 60 * 1000); // 15 min buffer after soccer
      const familyEveningStartTime = new Date(dinnerStartTime.getTime() + 60 * 60 * 1000); // Assuming 1 hour for dinner

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
          plannedEnd: formatTo24HourTime(new Date(familyEveningStartTime.getTime() + 30 * 60 * 1000)), // 30 min family time
          type: 'personal'
        });
      }
    }

    if (isJumuah) {
      // Replace Dhuhr with Jumu'ah
      scheduleForDay = scheduleForDay.filter(item => item.id !== 'dhuhr-prayer');
      const jumuahPrayer = initialDefaultSchedule.jumuah[0]; // Use initial default for fixed events
      const insertIndex = scheduleForDay.findIndex(item => parseTime(item.plannedStart, currentDate) > parseTime(jumuahPrayer.plannedStart, currentDate));
      scheduleForDay.splice(insertIndex > -1 ? insertIndex : scheduleForDay.length, 0, jumuahPrayer);
    }

    // Sort by planned start time before subdivision
    scheduleForDay.sort((a, b) => {
      const timeA = parseTime(a.plannedStart, currentDate);
      const timeB = parseTime(b.plannedStart, currentDate);
      return timeA - timeB;
    });

    // Subdivide activities into smaller blocks
    let finalSchedule = [];
    scheduleForDay.forEach(activity => {
      const plannedDurationMinutes = getPlannedDuration(activity.plannedStart, activity.plannedEnd, currentDate) * 60;
      // Subdivide academic blocks OR the specific flexible-afternoon block
      if (plannedDurationMinutes > MAX_SUB_BLOCK_MINUTES && (activity.type === 'academic' || activity.id === 'flexible-afternoon')) {
        finalSchedule = finalSchedule.concat(subdivideActivity(activity, MAX_SUB_BLOCK_MINUTES, currentDate));
      } else {
        finalSchedule.push({ ...activity, durationMinutes: plannedDurationMinutes }); // Add durationMinutes for non-subdivided blocks too
      }
    });

    setDailyScheduleState(finalSchedule); // Update the state with the calculated and subdivided schedule
  }, [currentDate, subdivideActivity, plannerSchedule]); // Add plannerSchedule as a dependency

  // useEffect for current block highlighting and progress bar updates
  useEffect(() => {
    const updateCurrentBlockAndProgress = () => {
      const now = new Date();
      // Convert current time to EST (America/New_York)
      const estTimeStr = now.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false, // Use 24-hour format for easier comparison
        timeZone: 'America/New_York'
      });
      const [estHours, estMinutes, estSeconds] = estTimeStr.split(':').map(Number);
      const currentEstDate = new Date();
      currentEstDate.setHours(estHours, estMinutes, estSeconds, 0);


      let foundCurrentActivity = null;
      dailyScheduleState.forEach(activity => { // Use dailyScheduleState here
        const plannedStart = parseTime(activity.plannedStart, currentDate);
        const plannedEnd = parseTime(activity.plannedEnd, currentDate);

        // Create proper Date objects for comparison, ensuring they are on the same day as currentDate
        const activityStartToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedStart.getHours(), plannedStart.getMinutes(), 0, 0);
        let activityEndToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedEnd.getHours(), plannedEnd.getMinutes(), 0, 0);

        // Handle overnight activities (e.g., sleep from 00:00 to 05:00)
        if (plannedEnd < plannedStart) {
          activityEndToday.setDate(activityEndToday.getDate() + 1);
        }

        // Compare current EST time with activity start and end times for the current day
        if (currentEstDate >= activityStartToday && currentEstDate < activityEndToday) {
          foundCurrentActivity = activity.id;
        }
      });
      setCurrentActivityId(foundCurrentActivity);
    };

    // Update every second for smooth progress bar and highlighting
    const interval = setInterval(updateCurrentBlockAndProgress, 1000); // Update every second

    // Initial call
    updateCurrentBlockAndProgress();

    return () => clearInterval(interval);
  }, [dailyScheduleState, currentDate]); // Dependencies are dailyScheduleState and currentDate

  // Auto-scroll to the current activity when it changes or on initial load
  useEffect(() => {
    if (currentActivityId && activeTab === 'schedule' && activityRefs.current.has(currentActivityId)) {
      const element = activityRefs.current.get(currentActivityId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentActivityId, activeTab]); // Only scroll when currentActivityId changes and tab is schedule


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
    // Reset current Pomodoro block tracking
    setCurrentPomodoroBlockId(null);
    setBlockTimeConsumed(0);
  };

  const handlePomodoroSettingChange = (e) => {
    const { name, value } = e.target;
    setPomodoroSettings(prev => ({ ...prev, [name]: Number(value) }));
  };


  const getLogForActivity = (activityId) => {
    const todayStr = currentDate.toISOString().split('T')[0];
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
        } else {
          updatedLogs[existingLogIndex].actualEnd = currentTime.toISOString();
        }
        return updatedLogs;
      } else {
        // Create new log entry
        const newLog = {
          id: crypto.randomUUID(), // Unique ID for the log entry
          date: todayStr,
          activityId: activityId,
          actualStart: type === 'start' ? currentTime.toISOString() : null,
          actualEnd: type === 'end' ? currentTime.toISOString() : null,
        };
        return [...prevLogs, newLog];
      }
    });

    // Auto-trigger Pomodoro when 'start' is clicked for an activity
    if (type === 'start') {
      const activity = dailyScheduleState.find(a => a.id === activityId);
      if (activity && activity.durationMinutes) {
        const totalBlockSeconds = Math.floor(activity.durationMinutes * 60);

        setCurrentPomodoroBlockId(activityId); // Set the block for the Pomodoro to manage
        setBlockTimeConsumed(0); // Reset consumed time for this new block

        setPomodoroTimer(prev => ({
          ...prev,
          running: true,
          mode: 'work',
          timeLeft: Math.min(pomodoroSettings.work * 60, totalBlockSeconds), // Start with work duration, capped by block time
          pomodorosCompleted: 0, // Reset pomodoros for a new block
        }));
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
    // Handle overnight activities (e.g., sleep from 00:00 to 05:00)
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

  // Report Generation Logic - now uses dailyScheduleState
  const getReportData = useCallback(() => {
    const reportDateStr = reportDate.toISOString().split('T')[0];
    const dailyLogs = activityLogs.filter(log => log.date === reportDateStr);

    const reportSummary = {};
    let totalActualFocusedTime = 0; // For academic tasks

    dailyLogs.forEach(log => {
      const activity = dailyScheduleState.find(item => item.id === log.activityId); // Use dailyScheduleState
      if (activity) {
        const actualDurationHours = getActualDuration(log);
        if (!reportSummary[activity.type]) {
          reportSummary[activity.type] = { planned: 0, actual: 0, activities: [] }; // Fixed: used activity.type
        }
        reportSummary[activity.type].actual += actualDurationHours;
        reportSummary[activity.type].activities.push({
          activity: activity.activity,
          actualStart: log.actualStart,
          actualEnd: log.actualEnd,
          actualDuration: actualDurationHours,
          subTask: subTaskDetails[activity.id] || '', // Include subTask in report
        });

        // Add to total focused time if it's an academic task
        if (activity.type === 'academic') {
          totalActualFocusedTime += actualDurationHours;
        }
      }
    });

    // Add planned durations from the daily schedule for the report date
    dailyScheduleState.forEach(activity => { // Use dailyScheduleState
        const plannedDurationHours = getPlannedDuration(activity.plannedStart, activity.plannedEnd, currentDate);
        if (!reportSummary[activity.type]) {
            reportSummary[activity.type] = { planned: 0, actual: 0, activities: [] }; // Fixed: used activity.type
        }
        reportSummary[activity.type].planned += plannedDurationHours;
    });


    return { summary: reportSummary, totalFocused: totalActualFocusedTime };
  }, [activityLogs, reportDate, dailyScheduleState, currentDate, subTaskDetails]); // Dependency on dailyScheduleState and currentDate, subTaskDetails

  const reportData = getReportData();

  // Progress Bar Percentage - now uses dailyScheduleState
  const getProgressBarPercentage = useCallback((activityId) => {
    const log = getLogForActivity(activityId);
    if (log && log.actualStart && !log.actualEnd) { // Only show progress if started and not ended
      const plannedActivity = dailyScheduleState.find(item => item.id === activityId); // Use dailyScheduleState
      if (plannedActivity) {
        const startTime = new Date(log.actualStart);
        const plannedEndTime = parseTime(plannedActivity.plannedEnd, currentDate);

        // Adjust plannedEndTime for overnight activities (like sleep)
        let adjustedPlannedEndTime = new Date(plannedEndTime);
        if (parseTime(plannedActivity.plannedEnd, currentDate) < parseTime(plannedActivity.plannedStart, currentDate)) {
          adjustedPlannedEndTime.setDate(adjustedPlannedEndTime.getDate() + 1);
        }

        const currentTime = new Date();
        const elapsedMs = currentTime - startTime;
        const totalPlannedMs = adjustedPlannedEndTime - startTime; // Duration from actual start to planned end

        if (totalPlannedMs > 0) {
          let percentage = (elapsedMs / totalPlannedMs) * 100;
          return Math.min(100, Math.max(0, percentage)); // Clamp between 0 and 100
        }
      }
    }
    return 0;
  }, [activityLogs, dailyScheduleState, getLogForActivity, currentDate]);

  // Get the next upcoming task
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

    // Filter out activities that have already passed or are currently active
    const upcomingActivities = dailyScheduleState.filter(activity => {
      const plannedStart = parseTime(activity.plannedStart, currentDate);
      const plannedEnd = parseTime(activity.plannedEnd, currentDate);

      const activityStartToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedStart.getHours(), plannedStart.getMinutes(), 0, 0);
      let activityEndToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), plannedEnd.getHours(), plannedEnd.getMinutes(), 0, 0);
      if (plannedEnd < plannedStart) {
        activityEndToday.setDate(activityEndToday.getDate() + 1);
      }

      // Check if the activity is in the future relative to current EST time
      return activityStartToday > currentEstDate;
    });

    // Sort by planned start time to get the very next one
    upcomingActivities.sort((a, b) => {
      const timeA = parseTime(a.plannedStart, currentDate);
      const timeB = parseTime(b.plannedStart, currentDate);
      return timeA - timeB;
    });

    return upcomingActivities.length > 0 ? upcomingActivities[0] : null;
  }, [dailyScheduleState, currentDate]); // Re-evaluate when schedule or date changes

  const nextTask = getNextTask();

  // Get the currently ongoing task
  const currentOngoingTask = dailyScheduleState.find(activity => activity.id === currentActivityId);

  // Get the next upcoming prayer
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
      // Check if the activity name includes "Iqamah & Prayer" or "Prayer"
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

  // Handlers for sub-task editing
  const handleSubTaskChange = (activityId, value) => {
    setSubTaskDetails(prev => ({
      ...prev,
      [activityId]: value,
    }));
  };

  const handleSubTaskBlur = (activityId) => {
    setEditingSubTaskId(null); // Exit edit mode
  };

  const handleSubTaskKeyDown = (e, activityId) => {
    if (e.key === 'Enter') {
      setEditingSubTaskId(null); // Exit edit mode on Enter
    }
  };

  // NEW: Planner functions
  const handleAddActivity = () => {
    setEditingActivity({
      id: `new-${Date.now()}`, // Temporary ID for new activity
      activity: '',
      plannedStart: '09:00',
      plannedEnd: '10:00',
      type: 'personal',
      isNew: true, // Flag to indicate a new activity
    });
    setIsPlannerModalOpen(true);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity({ ...activity }); // Create a copy to edit
    setIsPlannerModalOpen(true);
  };

  const handleDeleteActivity = (activityId) => {
    // Using a custom modal instead of window.confirm
    const confirmDelete = window.confirm('Are you sure you want to delete this activity?');
    if (confirmDelete) {
      setPlannerSchedule(prevSchedule => prevSchedule.filter(act => act.id !== activityId));
    }
  };

  const handleSaveActivity = (updatedActivity) => {
    setPlannerSchedule(prevSchedule => {
      if (updatedActivity.isNew) {
        // Remove temporary ID and add to schedule
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

  // Function to scroll to any activity by its ID
  const scrollToActivity = useCallback((activityId) => {
    if (activityId && activityRefs.current.has(activityId)) {
      const element = activityRefs.current.get(activityId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-inter text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 mb-8 flex flex-col h-full"> {/* Added h-full to ensure it takes full height */}
        {/* Header and Tabs - Fixed at the top of this main content box */}
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
          <div className="flex flex-col flex-grow"> {/* flex-grow to take remaining space */}
            {/* Schedule Fixed Top Content */}
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

            <div className="bg-indigo-50 rounded-lg p-4 mb-6 text-center shadow-inner flex-shrink-0">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Pomodoro Timer</h3>
              <div className={`text-5xl font-bold mb-4 ${pomodoroTimer.mode === 'work' ? 'text-green-600' : 'text-blue-600'}`}>
                {formatTime(pomodoroTimer.timeLeft)}
              </div>
              <p className="text-lg text-gray-600 mb-4 capitalize">{pomodoroTimer.mode.replace('_', ' ')} Session</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={startPomodoro}
                  disabled={pomodoroTimer.running}
                  className="p-3 rounded-full bg-green-500 text-white shadow-md hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={24} />
                </button>
                <button
                  onClick={pausePomodoro}
                  disabled={!pomodoroTimer.running}
                  className="p-3 rounded-full bg-yellow-500 text-white shadow-md hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pause size={24} />
                </button>
                <button
                  onClick={resetPomodoro}
                  className="p-3 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors duration-200"
                >
                  <RotateCcw size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Pomodoros Completed: {pomodoroTimer.pomodorosCompleted}</p>

              <div className="mt-4 border-t pt-4 border-indigo-200">
                {currentOngoingTask && (
                  <p
                    onClick={() => scrollToActivity(currentOngoingTask.id)}
                    className="text-base text-indigo-700 font-semibold mb-2 flex items-center justify-center cursor-pointer hover:text-indigo-900 transition-colors"
                  >
                    <FastForward size={18} className="mr-2" /> Current Task: {currentOngoingTask.activity} ({currentOngoingTask.plannedStart} - {currentOngoingTask.plannedEnd})
                  </p>
                )}
                {nextTask && (
                  <p
                    onClick={() => scrollToActivity(nextTask.id)}
                    className="text-base text-indigo-700 font-semibold flex items-center justify-center cursor-pointer hover:text-indigo-900 transition-colors"
                  >
                    <FastForward size={18} className="mr-2" /> Next Scheduled Task: {nextTask.activity} ({nextTask.plannedStart} - {nextTask.plannedEnd})
                  </p>
                )}
                {nextPrayer && (
                  <p
                    onClick={() => scrollToActivity(nextPrayer.id)}
                    className="text-base text-indigo-700 font-semibold mt-2 flex items-center justify-center cursor-pointer hover:text-indigo-900 transition-colors"
                  >
                    <FastForward size={18} className="mr-2" /> Next Prayer: {nextPrayer.activity} ({nextPrayer.plannedStart} - {nextPrayer.plannedEnd})
                  </p>
                )}
              </div>
            </div>

            {/* Scrollable Schedule Table */}
            <div className="overflow-y-auto flex-grow" ref={scheduleTableRef}> {/* This will now correctly scroll */}
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-indigo-100">
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
                  {dailyScheduleState.map((activity) => { // Use dailyScheduleState here
                    const log = getLogForActivity(activity.id);
                    const actualDuration = getActualDuration(log);
                    const progressBarPercentage = getProgressBarPercentage(activity.id);
                    // Check if it's an academic Pomodoro OR a subdivided flexible block
                    const isSubdividedBlock = (activity.type === 'academic' || activity.originalActivityId === 'flexible-afternoon') && activity.id.includes('-part');
                    const currentSubTask = subTaskDetails[activity.id] || '';
                    const timeGroup = getTimeOfDayGroup(activity.plannedStart); // Get time group

                    // Determine if the current activity is an "Iqamah & Prayer" block
                    const activityNameLower = activity.activity.toLowerCase();
                    const isPrayerBlock = activityNameLower.includes('iqamah & prayer') || activityNameLower.includes('prayer');

                    return (
                      <tr
                        key={activity.id}
                        ref={el => activityRefs.current.set(activity.id, el)} // Set ref for each row
                        className={`border-b border-gray-200 hover:bg-gray-50 relative
                          ${activity.id === currentActivityId ? 'bg-indigo-100 border-l-4 border-indigo-600' : ''}
                          ${isPrayerBlock
                            ? 'bg-green-50' // Apply light green for prayer activities
                            : ( // Otherwise, apply time-of-day colors
                              timeGroup === 'night' ? 'bg-gray-100' :
                              timeGroup === 'early-morning' ? 'bg-sky-50' :
                              timeGroup === 'midday' ? 'bg-amber-50' :
                              timeGroup === 'afternoon' ? 'bg-teal-50' : // Changed afternoon color
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
                          {isSubdividedBlock && ( // Show sub-task for subdivided academic or flexible blocks
                            <div className="flex items-center text-xs text-gray-600 mt-1">
                              <span className="mr-1 text-indigo-500"><Edit size={12} /></span>
                              {editingSubTaskId === activity.id ? (
                                <input
                                  type="text"
                                  value={currentSubTask}
                                  onChange={(e) => handleSubTaskChange(activity.id, e.target.value)}
                                  onBlur={() => handleSubTaskBlur(activity.id)}
                                  onKeyDown={(e) => handleSubTaskKeyDown(e, activity.id)}
                                  className="border-b border-indigo-400 focus:outline-none focus:border-indigo-600 text-sm bg-transparent w-full"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingSubTaskId(activity.id)}
                                  className="cursor-pointer hover:text-indigo-700 italic"
                                >
                                  {currentSubTask || 'Click to add sub-task'}
                                </span>
                              )}
                            </div>
                          )}
                          {/* Progress Bar */}
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
                            <button
                              onClick={() => logTime(activity.id, 'start')}
                              disabled={!!log?.actualStart && !log?.actualEnd} // Disable if already started and not ended
                              className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => logTime(activity.id, 'end')}
                              disabled={!log?.actualStart || !!log?.actualEnd} // Disable if not started or already ended
                              className="px-3 py-1 bg-purple-500 text-white rounded-md text-xs font-medium hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              End
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

        {/* NEW: Planner Tab */}
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
                    const timeGroup = getTimeOfDayGroup(activity.plannedStart); // Get time group
                    // Determine if the current activity is an "Iqamah & Prayer" block
                    const activityNameLower = activity.activity.toLowerCase();
                    const isPrayerBlock = activityNameLower.includes('iqamah & prayer') || activityNameLower.includes('prayer');
                    return (
                      <tr key={activity.id} className={`border-b border-gray-200 hover:bg-gray-50
                        ${isPrayerBlock
                          ? 'bg-green-50' // Apply light green for prayer activities
                          : ( // Otherwise, apply time-of-day colors
                            timeGroup === 'night' ? 'bg-gray-100' :
                            timeGroup === 'early-morning' ? 'bg-sky-50' :
                            timeGroup === 'midday' ? 'bg-amber-50' :
                            timeGroup === 'afternoon' ? 'bg-teal-50' : // Changed afternoon color
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
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="p-2 bg-red-500 text-white rounded-md text-xs hover:bg-red-600 transition-colors duration-200"
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

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="flex-grow overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setReportDate(prev => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() - 1); return newDate; })}
                className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-semibold text-indigo-800">
                Report for {reportDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <button
                onClick={() => setReportDate(prev => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() + 1); return newDate; })}
                className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 mb-6 shadow-inner">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">Summary</h3>
              <p className="text-lg text-gray-700">
                Total Actual Deep Work Mode Time:{' '} {/* Renamed */}
                <span className="font-bold text-green-700">
                  {reportData.totalFocused.toFixed(2)} hours
                </span>
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(reportData.summary).map(([type, data]) => (
                  <div key={type} className="bg-white p-3 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-indigo-600 capitalize">{type} Activities</h4>
                    <p className="text-sm text-gray-600">Planned: {data.planned.toFixed(2)} hrs</p>
                    <p className="text-sm text-gray-600">Actual: {data.actual.toFixed(2)} hrs</p>
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
            </div>
          </div>
        )}
      </div>
      <footer className="text-gray-600 text-sm mt-8 flex-shrink-0">
        Built with React and Tailwind CSS. Data saved in browser's local storage.
      </footer>
    </div>
  );
}

export default App;

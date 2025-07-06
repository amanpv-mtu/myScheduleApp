import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, BarChart2, CalendarDays, ChevronLeft, ChevronRight, Settings, FastForward, Edit, Plus, Trash2, Save, X, Clock, CheckCircle, AlertCircle, PlayCircle, StopCircle, RefreshCcw, Link, Download, BellRing, Square, Info, Volume2, VolumeX } from 'lucide-react';
// --- Helper Functions ---
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const parseTime = (timeStr, dateContext = new Date()) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateContext);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatDateTime = (date) => {
  if (!date) return '';
  // Ensure date is a valid Date object before formatting
  const d = new Date(date);
  if (isNaN(d.getTime())) return ''; // Return empty string if date is invalid
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

const formatTo24HourTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatDateToYYYYMMDD = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTimeOfDayGroup = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if ((hours > 21 || (hours === 21 && minutes >= 55)) || (hours >= 0 && hours < 5)) return 'night';
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 19) return 'afternoon';
  if (hours >= 19 && (hours < 21 || (hours === 21 && minutes < 55))) return 'evening';
  return '';
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getPlannedDuration = (plannedStart, plannedEnd, dateContext) => {
    const start = parseTime(plannedStart, dateContext);
    let end = parseTime(plannedEnd, dateContext);
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours;
};

const MAX_SUB_BLOCK_MINUTES = 30;

const initialDefaultSchedule = {
  weekday: [
    { id: 'wake-up', activity: 'Wake Up', plannedStart: '05:00', plannedEnd: '05:00', type: 'personal', recurrenceType: 'daily', recurrenceDays: [], constraintType: 'hard' },
    { id: 'fajr-prep', activity: 'Hydrate, Wudu, Prepare for Fajr', plannedStart: '05:00', plannedEnd: '05:25', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'fajr-prayer', activity: 'Fajr Iqamah & Prayer', plannedStart: '05:25', plannedEnd: '05:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'quran-morning', activity: 'Quran Recitation & Reflection (Morning)', plannedStart: '05:45', plannedEnd: '06:00', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'morning-exercise', activity: 'Morning Exercise', plannedStart: '06:00', plannedEnd: '06:30', type: 'physical', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'breakfast', activity: 'Breakfast & Plan Day', plannedStart: '06:30', plannedEnd: '07:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'deep-work-1', activity: 'Deep Work Mode Block 1', plannedStart: '07:00', plannedEnd: '09:30', type: 'academic', recurrenceType: 'weekly', recurrenceDays: [1, 2, 3, 4], constraintType: 'adjustable' },
    { id: 'break-1', activity: 'Break / Movement', plannedStart: '09:30', plannedEnd: '09:45', type: 'personal', recurrenceType: 'weekly', recurrenceDays: [1, 2, 3, 4], constraintType: 'adjustable' },
    { id: 'deep-work-2', activity: 'Deep Work Mode Block 2', plannedStart: '09:45', plannedEnd: '12:15', type: 'academic', recurrenceType: 'weekly', recurrenceDays: [1, 2, 3, 4], constraintType: 'adjustable' },
    { id: 'lunch', activity: 'Lunch Prep & Eat', plannedStart: '12:15', plannedEnd: '13:15', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'dhuhr-prep', activity: 'Wind down / Prepare for Dhuhr / Family Time', plannedStart: '13:15', plannedEnd: '14:25', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'dhuhr-prayer', activity: 'Dhuhr Iqamah & Prayer', plannedStart: '14:25', plannedEnd: '14:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'short-break-after-dhuhr', activity: 'Short Break', plannedStart: '14:45', plannedEnd: '15:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'power-nap', activity: 'Power Nap', plannedStart: '15:00', plannedEnd: '15:30', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'deep-work-3', activity: 'Deep Work Mode Flexible Work Block', plannedStart: '15:30', plannedEnd: '17:00', type: 'academic', recurrenceType: 'weekly', recurrenceDays: [1, 2, 3, 4], constraintType: 'adjustable' },
    { id: 'flexible-afternoon', activity: 'Flexible Block / Errands / Relax / Family Time', plannedStart: '17:00', plannedEnd: '19:25', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'asr-prayer', activity: 'Asr Iqamah & Prayer', plannedStart: '19:25', plannedEnd: '19:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'evening-exercise', activity: 'Evening Exercise', plannedStart: '19:45', plannedEnd: '20:15', type: 'physical', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'dinner', activity: 'Dinner Prep & Eat (with Family)', plannedStart: '20:15', plannedEnd: '21:15', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'family-evening', activity: 'Family Time / Light Socializing', plannedStart: '21:15', plannedEnd: '21:45', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'maghrib-prep', activity: 'Wind down / Prepare for Maghrib', plannedStart: '21:45', plannedEnd: '21:55', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'maghrib-prayer', activity: 'Maghrib Iqamah & Prayer', plannedStart: '21:55', plannedEnd: '22:15', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'quran-evening', activity: 'Evening Routine / Quran / Prepare for Bed', plannedStart: '22:15', plannedEnd: '23:15', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'isha-prep', activity: 'Prepare for Isha', plannedStart: '23:15', plannedEnd: '23:25', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'isha-prayer', activity: 'Isha Iqamah & Prayer', plannedStart: '23:25', plannedEnd: '23:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'plan-next-day', activity: 'Plan Next Day', plannedStart: '23:45', plannedEnd: '23:55', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'pre-sleep', activity: 'Pre-Sleep Routine', plannedStart: '23:55', plannedEnd: '00:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'sleep', activity: 'Lights Out / Sleep', plannedStart: '00:00', plannedEnd: '05:00', type: 'personal', recurrenceType: 'daily', constraintType: 'hard' },
  ],
  weekend: [
    { id: 'wake-up-weekend', activity: 'Wake Up (Weekend)', plannedStart: '07:00', plannedEnd: '07:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'fajr-prayer-weekend', activity: 'Fajr Iqamah & Prayer', plannedStart: '05:25', plannedEnd: '05:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'quran-morning-weekend', activity: 'Quran Recitation & Reflection (Weekend Morning)', plannedStart: '07:00', plannedEnd: '07:30', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'breakfast-weekend', activity: 'Breakfast (Weekend)', plannedStart: '07:30', plannedEnd: '08:30', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'flexible-morning-weekend', activity: 'Flexible Morning Block (Weekend)', plannedStart: '08:30', plannedEnd: '12:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'lunch-weekend', activity: 'Lunch (Weekend)', plannedStart: '12:00', plannedEnd: '13:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'dhuhr-prayer-weekend', activity: 'Dhuhr Iqamah & Prayer', plannedStart: '14:25', plannedEnd: '14:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'flexible-afternoon-weekend', activity: 'Flexible Afternoon Block (Weekend)', plannedStart: '15:00', plannedEnd: '19:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'asr-prayer-weekend', activity: 'Asr Iqamah & Prayer', plannedStart: '19:25', plannedEnd: '19:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'dinner-weekend', activity: 'Dinner (Weekend)', plannedStart: '20:15', plannedEnd: '21:15', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'maghrib-prayer-weekend', activity: 'Maghrib Iqamah & Prayer', plannedStart: '21:55', plannedEnd: '22:15', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'isha-prayer-weekend', activity: 'Isha Iqamah & Prayer', plannedStart: '23:25', plannedEnd: '23:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'sleep-weekend', activity: 'Lights Out / Sleep (Weekend)', plannedStart: '00:00', plannedEnd: '07:00', type: 'personal', recurrenceType: 'daily', constraintType: 'hard' },
  ],
  jumuah: [
    { id: 'wake-up-jumuah', activity: 'Wake Up', plannedStart: '05:00', plannedEnd: '05:00', type: 'personal', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'fajr-prep-jumuah', activity: 'Hydrate, Wudu, Prepare for Fajr', plannedStart: '05:00', plannedEnd: '05:25', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'fajr-prayer-jumuah', activity: 'Fajr Iqamah & Prayer', plannedStart: '05:25', plannedEnd: '05:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'quran-morning-jumuah', activity: 'Quran Recitation & Reflection (Morning)', plannedStart: '05:45', plannedEnd: '06:00', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'morning-exercise-jumuah', activity: 'Morning Exercise', plannedStart: '06:00', plannedEnd: '06:30', type: 'physical', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'breakfast-jumuah', activity: 'Breakfast & Plan Day', plannedStart: '06:30', plannedEnd: '07:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'deep-work-1-jumuah', activity: 'Deep Work Mode Block 1', plannedStart: '07:00', plannedEnd: '09:30', type: 'academic', recurrenceType: 'weekly', recurrenceDays: [5], constraintType: 'adjustable' },
    { id: 'break-1-jumuah', activity: 'Break / Movement', plannedStart: '09:30', plannedEnd: '09:45', type: 'personal', recurrenceType: 'weekly', recurrenceDays: [5], constraintType: 'adjustable' },
    { id: 'deep-work-2-jumuah', activity: 'Deep Work Mode Block 2', plannedStart: '09:45', plannedEnd: '12:15', type: 'academic', recurrenceType: 'weekly', recurrenceDays: [5], constraintType: 'adjustable' },
    { id: 'jumuah-prep', activity: 'Prepare for Jumu\'ah', plannedStart: '12:15', plannedEnd: '14:30', type: 'spiritual', recurrenceType: 'weekly', recurrenceDays: [5], constraintType: 'adjustable' },
    { id: 'jumuah-prayer', activity: 'Jumu\'ah Iqamah & Prayer', plannedStart: '14:40', plannedEnd: '15:00', type: 'spiritual', recurrenceType: 'weekly', recurrenceDays: [5], constraintType: 'hard' },
    { id: 'lunch-jumuah', activity: 'Lunch (After Jumu\'ah)', plannedStart: '15:00', plannedEnd: '16:00', type: 'personal', recurrenceType: 'weekly', recurrenceDays: [5], constraintType: 'adjustable' },
    { id: 'flexible-afternoon-jumuah', activity: 'Flexible Block / Errands / Relax / Family Time', plannedStart: '16:00', plannedEnd: '19:25', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'asr-prayer-jumuah', activity: 'Asr Iqamah & Prayer', plannedStart: '19:25', plannedEnd: '19:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'evening-exercise-jumuah', activity: 'Evening Exercise', plannedStart: '19:45', plannedEnd: '20:15', type: 'physical', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'dinner-jumuah', activity: 'Dinner Prep & Eat (with Family)', plannedStart: '20:15', plannedEnd: '21:15', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'family-evening-jumuah', activity: 'Family Time / Light Socializing', plannedStart: '21:15', plannedEnd: '21:45', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'maghrib-prep-jumuah', activity: 'Wind down / Prepare for Maghrib', plannedStart: '21:45', plannedEnd: '21:55', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'maghrib-prayer-jumuah', activity: 'Maghrib Iqamah & Prayer', plannedStart: '21:55', plannedEnd: '22:15', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'quran-evening-jumuah', activity: 'Evening Routine / Quran / Prepare for Bed', plannedStart: '22:15', plannedEnd: '23:15', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'isha-prep-jumuah', activity: 'Prepare for Isha', plannedStart: '23:15', plannedEnd: '23:25', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'isha-prayer-jumuah', plannedStart: '23:25', plannedEnd: '23:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'plan-next-day-jumuah', activity: 'Plan Next Day', plannedStart: '23:45', plannedEnd: '23:55', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'pre-sleep-jumuah', activity: 'Pre-Sleep Routine', plannedStart: '23:55', plannedEnd: '00:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'sleep-jumuah', activity: 'Lights Out / Sleep', plannedStart: '00:00', plannedEnd: '05:00', type: 'personal', recurrenceType: 'daily', constraintType: 'hard' },
  ],
  fasting: [
    { id: 'suhoor', activity: 'Suhoor (Pre-dawn meal)', plannedStart: '04:00', plannedEnd: '04:30', type: 'personal', recurrenceType: 'none', constraintType: 'hard' },
    { id: 'fajr-prep-fasting', activity: 'Hydrate, Wudu, Prepare for Fajr', plannedStart: '04:30', plannedEnd: '04:55', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'fajr-prayer-fasting', plannedStart: '04:55', plannedEnd: '05:15', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'quran-morning-fasting', activity: 'Quran Recitation & Reflection (Morning)', plannedStart: '05:15', plannedEnd: '05:45', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'light-work-fasting', activity: 'Light Work/Study', plannedStart: '09:00', plannedEnd: '12:00', type: 'academic', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'dhuhr-prayer-fasting', activity: 'Dhuhr Iqamah & Prayer', plannedStart: '13:00', plannedEnd: '13:20', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'rest-fasting', activity: 'Rest/Nap', plannedStart: '14:00', plannedEnd: '15:00', type: 'personal', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'asr-prayer-fasting', activity: 'Asr Iqamah & Prayer', plannedStart: '17:00', plannedEnd: '17:20', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'iftar-prep', activity: 'Iftar Preparation', plannedStart: '19:00', plannedEnd: '19:30', type: 'personal', recurrenceType: 'none', constraintType: 'adjustable' },
    { id: 'iftar', activity: 'Iftar (Breaking fast)', plannedStart: '19:30', plannedEnd: '20:00', type: 'personal', recurrenceType: 'none', constraintType: 'hard' },
    { id: 'maghrib-prayer-fasting', activity: 'Maghrib Iqamah & Prayer', plannedStart: '20:00', plannedEnd: '20:20', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'taraweeh-fasting', activity: 'Taraweeh/Evening Prayers', plannedStart: '21:30', plannedEnd: '22:30', type: 'spiritual', recurrenceType: 'daily', constraintType: 'adjustable' },
    { id: 'isha-prayer-fasting', activity: 'Isha Iqamah & Prayer', plannedStart: '22:30', plannedEnd: '22:50', type: 'spiritual', recurrenceType: 'daily', constraintType: 'hard' },
    { id: 'sleep-fasting', activity: 'Sleep', plannedStart: '23:00', plannedEnd: '04:00', type: 'personal', recurrenceType: 'daily', constraintType: 'hard' },
  ],
  overrides: {
    soccerDays: [
      { id: 'soccer-game', activity: 'Soccer Game (including travel, warm-up, cool-down, shower)', plannedStart: '20:00', plannedEnd: '22:00', type: 'physical', recurrenceType: 'weekly', recurrenceDays: [3, 6], constraintType: 'hard' },
    ],
  }
};

const generateScheduleForDate = (date, templateType, considerFasting, plannerSchedule, dailyCustomSchedules, fastingDates, iqamahConfig) => {
    const dateKey = formatDateToYYYYMMDD(date);
    const isFastingDay = !!fastingDates[dateKey];

    let initialActivities = [];

    // Prioritize daily custom schedule if it exists
    if (dailyCustomSchedules[dateKey] && dailyCustomSchedules[dateKey].length > 0) {
        initialActivities = JSON.parse(JSON.stringify(dailyCustomSchedules[dateKey]));
    } else {
        // Otherwise, generate from templates
        let baseTemplateKey = templateType;
        if (!baseTemplateKey) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 5) {
                baseTemplateKey = 'jumuah';
            } else if (dayOfWeek === 0 || dayOfWeek === 6) {
                baseTemplateKey = 'weekend';
            } else {
                baseTemplateKey = 'weekday';
            }
        }

        if (considerFasting && isFastingDay && plannerSchedule.fasting && plannerSchedule.fasting.length > 0) {
            baseTemplateKey = 'fasting';
        }

        initialActivities = JSON.parse(JSON.stringify(plannerSchedule[baseTemplateKey] || []));
    }

    let filteredActivities = initialActivities.filter(activity => {
        if (activity.recurrenceType === 'weekly' && activity.recurrenceDays && activity.recurrenceDays.length > 0) {
            return activity.recurrenceDays.includes(date.getDay());
        }
        return true;
    });

    const dayOfWeek = date.getDay();
    const applicableOverrideBaseIds = new Set(
        (plannerSchedule.overrides.soccerDays || [])
            .filter(override => override && override.recurrenceDays && Array.isArray(override.recurrenceDays) && override.recurrenceDays.includes(dayOfWeek))
            .map(override => override.id)
    );

    let activitiesWithoutOverrides = filteredActivities.filter(activity =>
        !applicableOverrideBaseIds.has(activity.id)
    );

    let finalSchedule = [];
    activitiesWithoutOverrides.forEach(activity => {
      let currentActivity = { ...activity };
      const manualIqamah = iqamahConfig.manualTimes[dateKey];

      // Apply Iqamah overrides if available and it's a prayer activity
      if (manualIqamah && currentActivity.type === 'spiritual' && currentActivity.activity.toLowerCase().includes('prayer')) {
        const prayerNameMatch = currentActivity.activity.toLowerCase().match(/^(fajr|dhuhr|asr|maghrib|isha)/);
        if (prayerNameMatch && manualIqamah[prayerNameMatch[1]]) {
          const originalDurationMinutes = timeToMinutes(currentActivity.plannedEnd) - timeToMinutes(currentActivity.plannedStart);
          currentActivity.plannedStart = manualIqamah[prayerNameMatch[1]];
          let newEndMinutes = timeToMinutes(currentActivity.plannedStart) + originalDurationMinutes;
          currentActivity.plannedEnd = minutesToTime(newEndMinutes);
        }
      }

        const startMinutes = timeToMinutes(currentActivity.plannedStart);
        let endMinutes = timeToMinutes(currentActivity.plannedEnd);
        if (endMinutes < startMinutes) endMinutes += 1440;
        const durationMinutes = endMinutes - startMinutes;

        // Subdivide flexible blocks
        if ((currentActivity.activity.includes('Deep Work Mode Flexible Work Block') || currentActivity.activity.includes('Flexible Block / Errands / Relax / Family Time')) && durationMinutes > MAX_SUB_BLOCK_MINUTES) {
            let currentSubStartMinutes = startMinutes;
            let partCounter = 1;
            while (currentSubStartMinutes < endMinutes) {
                let subEndMinutes = Math.min(currentSubStartMinutes + MAX_SUB_BLOCK_MINUTES, endMinutes);
                if (endMinutes - subEndMinutes < 15 && endMinutes - subEndMinutes > 0) { // Corrected variable name
                    subEndMinutes = endMinutes;
                }
                finalSchedule.push({
                    ...currentActivity,
                    id: `${currentActivity.id}-part-${partCounter}`,
                    originalActivityId: currentActivity.id,
                    activity: `${currentActivity.activity} (Part ${partCounter})`,
                    plannedStart: minutesToTime(currentSubStartMinutes),
                    plannedEnd: minutesToTime(subEndMinutes),
                    durationMinutes: subEndMinutes - currentSubStartMinutes,
                });
                currentSubStartMinutes = subEndMinutes;
                partCounter++;
            }
        } else {
            finalSchedule.push({
                ...currentActivity,
                durationMinutes: durationMinutes,
            });
        }
    });

    // Add overrides
    (plannerSchedule.overrides.soccerDays || []).forEach(override => {
        if (override.recurrenceDays.includes(dayOfWeek)) {
            const uniqueOverrideId = `${override.id}-${dateKey}`;
            if (!finalSchedule.some(act => act.id === uniqueOverrideId)) {
                finalSchedule.push({
                    ...override,
                    id: uniqueOverrideId,
                    durationMinutes: getPlannedDuration(override.plannedStart, override.plannedEnd, date) * 60,
                });
            }
        }
    });

    finalSchedule.sort((a, b) => timeToMinutes(a.plannedStart) - timeToMinutes(b.plannedStart));

    return finalSchedule;
};

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center relative">
        <Info size={48} className="mx-auto text-blue-500 mb-4" />
        <h3 className="text-xl font-bold text-indigo-700 mb-2">Confirm Action</h3>
        <p className="text-lg text-gray-800 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Activity Reminder Modal Component ---
const ActivityReminderModal = ({ activity, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 30000); // Auto-close after 30 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close reminder"
        >
          <X size={20} />
        </button>
        <BellRing size={48} className="mx-auto text-yellow-500 mb-4 animate-bounce" />
        <h3 className="text-2xl font-bold text-indigo-700 mb-2">Upcoming Activity!</h3>
        <p className="text-lg text-gray-800 mb-4">
          <span className="font-semibold">{activity.activity}</span>
        </p>
        <p className="text-md text-gray-600 mb-6">
          Starting at: <span className="font-bold">{activity.plannedStart}</span>
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 transition-colors"
        >
          Got It!
        </button>
      </div>
    </div>
  );
};

// --- Toast Notification Component ---
const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success' ? <CheckCircle size={20} /> : type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white flex items-center space-x-3 z-50 ${bgColor}`}>
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error: error, errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="fixed inset-0 bg-red-100 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Something went wrong.</h2>
            <p className="text-gray-700 mb-4">
              We're sorry, but an unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-sm text-gray-600 text-left mt-4 p-2 bg-gray-50 rounded-md overflow-auto max-h-48">
                <summary className="font-semibold cursor-pointer">Error Details</summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const appName = "My Daily Rhythm"; // Define the app name here
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
      return savedSettings ? JSON.parse(savedSettings) : { work: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4, reminderTime: 5 };
    } catch (error) {
      console.error("Failed to parse pomodoroSettings from localStorage:", error);
      return { work: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4, reminderTime: 5 };
    }
  });
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      return savedSettings ? JSON.parse(savedSettings) : { geminiApiKey: '', location: { city: '', country: '' } };
    } catch (error) {
      console.error("Failed to parse appSettings from localStorage:", error);
      return { geminiApiKey: '', location: { city: '', country: '' } };
    }
  });
  const [pomodoroTimer, setPomodoroTimer] = useState({
    running: false,
    mode: 'work',
    timeLeft: pomodoroSettings.work * 60,
    pomodorosCompleted: 0,
    showAlert: false,
    alertMessage: '',
    nextMode: null,
    nextTimeLeft: 0,
    linkedActivityId: null,
    initialTime: pomodoroSettings.work * 60, // Store initial time for percentage calculation
  });
  const [activeTab, setActiveTab] = useState('schedule');
  const [reportDate, setReportDate] = useState(new Date());
  const intervalRef = useRef(null);
  // Changed audio source to a more common format
  const audioRef = useRef(new Audio('https://www.soundjay.com/misc/small-bell-ringing-01.mp3'));
  const [currentActivityId, setCurrentActivityId] = useState(null);

  const [dailyScheduleState, setDailyScheduleState] = useState([]); // This will be the effective schedule for the current day

  const [subTaskDetails, setSubTaskDetails] = useState(() => {
    try {
      const savedSubTasks = localStorage.getItem('subTaskDetails');
      return savedSubTasks ? JSON.parse(savedSubTasks) : {};
    } catch (error) {
      console.error("Failed to parse subTaskDetails from localStorage:", error);
      return {};
    }
  });
  const [editingSubTaskId, setEditingSubTaskId] = useState(null);
  const [editingActualTimeLogId, setEditingActualTimeLogId] = useState(null); // New state for editing actual times

  const [currentPomodoroBlockId, setCurrentPomodoroBlockId] = useState(0);
  const [blockTimeConsumed, setBlockTimeConsumed] = useState(0);

  const [plannerSchedule, setPlannerSchedule] = useState(() => {
    try {
      const savedPlannerSchedule = localStorage.getItem('plannerSchedule');
      const parsedSchedule = savedPlannerSchedule ? JSON.parse(savedPlannerSchedule) : JSON.parse(JSON.stringify(initialDefaultSchedule));

      if (!parsedSchedule.fasting || parsedSchedule.fasting.length === 0) {
        parsedSchedule.fasting = JSON.parse(JSON.stringify(initialDefaultSchedule.weekday));
        const suhoorExists = parsedSchedule.fasting.some(act => act.id === 'suhoor');
        const iftarExists = parsedSchedule.fasting.some(act => act.id === 'iftar');
        if (!suhoorExists) {
            parsedSchedule.fasting.push({ id: 'suhoor', activity: 'Suhoor (Pre-dawn meal)', plannedStart: '04:00', plannedEnd: '04:30', type: 'personal', recurrenceType: 'none', constraintType: 'hard' });
        }
        if (!iftarExists) {
            parsedSchedule.fasting.push({ id: 'iftar', activity: 'Iftar (Breaking fast)', plannedStart: '21:00', plannedEnd: '21:30', type: 'personal', recurrenceType: 'none', constraintType: 'hard' });
        }
      }
      return parsedSchedule;
    } catch (error) {
      console.error("Failed to parse plannerSchedule from localStorage:", error);
      return JSON.parse(JSON.stringify(initialDefaultSchedule));
    }
  });

  const [activePlannerDayType, setActivePlannerDayType] = useState('weekday'); // This is for template editing

  const [dailyCustomSchedules, setDailyCustomSchedules] = useState(() => {
    try {
      const savedCustomSchedules = localStorage.getItem('dailyCustomSchedules');
      return savedCustomSchedules ? JSON.parse(savedCustomSchedules) : {};
    } catch (error) {
      console.error("Failed to parse dailyCustomSchedules from localStorage:", error);
      return {};
    }
  });

  const [selectedBaseTemplate, setSelectedBaseTemplate] = useState('weekday'); // For applying templates to current day

  const [editingActivity, setEditingActivity] = useState(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false); // Renamed from isPlannerModalOpen
  const [isEditingDailySchedule, setIsEditingDailySchedule] = useState(false); // Controls if modal edits daily or template

  const [projectTasks, setProjectTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem('projectTasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error("Failed to parse projectTasks from localStorage:", error);
      return [];
    }
  });
  const [editingTask, setEditingTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingSubtaskNameId, setEditingSubtaskNameId] = useState(null);

  const [isAssignTaskModalOpen, setIsAssignTaskModal] = useState(false);
  const [assigningToActivity, setAssigningToActivity] = useState(null);
  const [assigningFromTask, setAssigningFromTask] = useState(null);

  const [dataManagementOptions, setDataManagementOptions] = useState({
    export: {
      tasks: true, dailySchedule: true, activityLogs: true, pomodoroSettings: true, subTaskDetails: true, dailyCustomSchedules: true, fastingDates: true, appSettings: true
    },
    import: {
      tasks: true, dailySchedule: true, activityLogs: true, pomodoroSettings: true, subTaskDetails: true, dailyCustomSchedules: true, fastingDates: true, appSettings: true
    }
  });

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderActivity, setReminderActivity] = useState(null);
  const remindersShownToday = useRef(new Set());

  const [audioEnabled, setAudioEnabled] = useState(true); // Default to true
  const [isMuted, setIsMuted] = useState(false); // New state for mute toggle

  const [fastingDates, setFastingDates] = useState(() => {
    try {
      const savedFastingDates = localStorage.getItem('fastingDates');
      return savedFastingDates ? JSON.parse(savedFastingDates) : {};
    } catch (error) {
      console.error("Failed to parse fastingDates from localStorage:", error);
      return {};
    }
  });

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const confirmationCallback = useRef(null);

  const scheduleTableRef = useRef(null);
  const theadRef = useRef(null); // Ref for thead to calculate offset for "Now" line
  const activityRefs = useRef(new Map());
  const [collapsedSections, setCollapsedSections] = useState({});

  const [draggingActivity, setDraggingActivity] = useState(null);
  const [resizingActivity, setResizingActivity] = useState(null);
  const plannerTimelineRef = useRef(null); // Ref for the visual timeline in schedule/planner

  // "Now" indicator state
  const [nowIndicatorTop, setNowIndicatorTop] = useState(0);

  const [aiCommandInput, setAiCommandInput] = useState(''); // State for AI input field

  // Toast Notification State and Function
  const [toast, setToast] = useState(null); // Corrected: useState for toast
  const showToast = useCallback((message, type = 'info', duration = 3000) => { // Corrected: useCallback wraps the function definition
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  // State for switching between calendar and list view
  const [scheduleViewMode, setScheduleViewMode] = useState('calendar');
  const [taskViewMode, setTaskViewMode] = useState('list'); // New state for task view mode

  // Iqamah Times State
  const [iqamahConfig, setIqamahConfig] = useState(() => {
    try {
      const savedIqamahConfig = localStorage.getItem('iqamahConfig');
      return savedIqamahConfig ? JSON.parse(savedIqamahConfig) : {
        manualTimes: {}, // { 'YYYY-MM-DD': { fajr: 'HH:MM', dhuhr: 'HH:MM', ... } }
      };
    } catch (error) {
      console.error("Failed to parse iqamahConfig from localStorage:", error);
      return { manualTimes: {} };
    }
  });


  // --- Effects for Local Storage ---
  useEffect(() => { localStorage.setItem('activityLogs', JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
    setPomodoroTimer(prev => ({
      ...prev,
      timeLeft: pomodoroSettings.work * 60,
      running: false
    }));
  }, [pomodoroSettings]);
  useEffect(() => { localStorage.setItem('appSettings', JSON.stringify(appSettings)); }, [appSettings]);
  useEffect(() => { localStorage.setItem('subTaskDetails', JSON.stringify(subTaskDetails)); }, [subTaskDetails]);
  useEffect(() => { localStorage.setItem('plannerSchedule', JSON.stringify(plannerSchedule)); }, [plannerSchedule]);
  useEffect(() => { localStorage.setItem('projectTasks', JSON.stringify(projectTasks)); }, [projectTasks]);
  useEffect(() => { localStorage.setItem('fastingDates', JSON.stringify(fastingDates)); }, [fastingDates]);
  useEffect(() => { localStorage.setItem('dailyCustomSchedules', JSON.stringify(dailyCustomSchedules)); }, [dailyCustomSchedules]);
  useEffect(() => { localStorage.setItem('iqamahConfig', JSON.stringify(iqamahConfig)); }, [iqamahConfig]);


  // Reset remindersShownToday when currentDate changes
  useEffect(() => { remindersShownToday.current = new Set(); }, [currentDate]);

  // Update document title
  useEffect(() => {
    document.title = appName;
  }, [appName]);

  // --- Dynamic "Now" Indicator and Current Activity Highlighting ---
  useEffect(() => {
    const updateTimeIndicators = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const totalPlannerMinutes = 24 * 60; // Total minutes in a day

      if (plannerTimelineRef.current) {
        const timelineHeight = plannerTimelineRef.current.clientHeight;
        const pixelsPerMinute = timelineHeight / totalPlannerMinutes;
        setNowIndicatorTop(currentMinutes * pixelsPerMinute);
      } else {
        setNowIndicatorTop(0); // Fallback if refs are not ready
      }

      // Determine current activity
      const currentActivity = dailyScheduleState.find(activity => {
        const plannedStart = parseTime(activity.plannedStart, currentDate);
        let plannedEnd = parseTime(activity.plannedEnd, currentDate);
        if (plannedEnd < plannedStart) { // Handle overnight activities
          plannedEnd.setDate(plannedEnd.getDate() + 1);
        }
        return now >= plannedStart && now < plannedEnd;
      });
      setCurrentActivityId(currentActivity ? currentActivity.id : null);
    };

    const interval = setInterval(updateTimeIndicators, 60 * 1000); // Update every minute
    updateTimeIndicators(); // Initial update
    return () => clearInterval(interval);
  }, [dailyScheduleState, currentDate]);


  // --- Reminder System ---
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      dailyScheduleState.forEach(activity => {
        const plannedStart = parseTime(activity.plannedStart, currentDate);
        const reminderTime = new Date(plannedStart.getTime() - pomodoroSettings.reminderTime * 60 * 1000);
        const activityKey = `${activity.id}-${formatDateToYYYYMMDD(currentDate)}`;

        if (now >= reminderTime && now < plannedStart && !remindersShownToday.current.has(activityKey)) {
          setReminderActivity(activity);
          setShowReminderModal(true);
          remindersShownToday.current.add(activityKey);

          if (audioEnabled && !isMuted) { // Check isMuted
            audioRef.current.play();
          }

          // Browser Notification
          if (Notification.permission === "granted") {
            new Notification('Upcoming Activity!', {
              body: `${activity.activity} starts at ${activity.plannedStart}`,
              icon: 'https://placehold.co/64x64/000000/FFFFFF?text=DR' // Placeholder icon
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification('Upcoming Activity!', {
                  body: `${activity.activity} starts at ${activity.plannedStart}`,
                  icon: 'https://placehold.co/64x64/000000/FFFFFF?text=DR'
                });
              }
            });
          }
        }
      });
    };

    const reminderInterval = setInterval(checkReminders, 30 * 1000); // Check every 30 seconds
    return () => clearInterval(reminderInterval);
  }, [dailyScheduleState, currentDate, pomodoroSettings.reminderTime, audioEnabled, isMuted]);


  // --- Pomodoro Timer Logic ---
  useEffect(() => {
    if (pomodoroTimer.running) {
      intervalRef.current = setInterval(() => {
        setPomodoroTimer(prev => {
          if (prev.timeLeft > 0) {
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          } else {
            if (audioEnabled && !isMuted) { // Check isMuted
              audioRef.current.play();
            }
            clearInterval(intervalRef.current);

            let nextMode = prev.mode;
            let nextPomodorosCompleted = prev.pomodorosCompleted;
            let alertMessage = '';
            let nextTimeLeft = 0;

            const currentBlock = dailyScheduleState.find(block => block.id === currentPomodoroBlockId);
            const totalBlockDurationSeconds = currentBlock ? Math.floor(currentBlock.durationMinutes * 60) : 0;

            const completedSegmentDuration = (prev.mode === 'work' ? pomodoroSettings.work : (prev.mode === 'short_break' ? pomodoroSettings.shortBreak : pomodoroSettings.longBreak)) * 60;

            let newBlockTimeConsumed = prev.blockTimeConsumed + completedSegmentDuration;
            let remainingBlockTime = totalBlockDurationSeconds - newBlockTimeConsumed;

            if (prev.mode === 'work') {
                nextPomodorosCompleted++;
                alertMessage = "Work session ended! Time for a break.";

                if (nextPomodorosCompleted % pomodoroSettings.longBreakInterval === 0) {
                    nextMode = 'long_break';
                    nextTimeLeft = pomodoroSettings.longBreak * 60;
                } else {
                    nextMode = 'short_break';
                    nextTimeLeft = pomodoroSettings.shortBreak * 60;
                }
            } else {
                alertMessage = "Break ended! Time to get back to work.";
                nextMode = 'work';
                nextTimeLeft = pomodoroSettings.work * 60;
            }

            if (prev.linkedActivityId) {
                if (remainingBlockTime <= 0) {
                    return { ...prev, running: false, timeLeft: 0, showAlert: true, alertMessage: "Pomodoro session for this block has ended!", nextMode: null, nextTimeLeft: 0, linkedActivityId: null, initialTime: 0 };
                } else if (nextTimeLeft > remainingBlockTime) {
                    nextTimeLeft = remainingBlockTime;
                    if (nextTimeLeft <= 0) {
                        return { ...prev, running: false, timeLeft: 0, showAlert: true, alertMessage: "Pomodoro session for this block has ended!", nextMode: null, nextTimeLeft: 0, linkedActivityId: null, initialTime: 0 };
                    }
                }
            }

            return {
                ...prev,
                running: false,
                showAlert: true,
                alertMessage: alertMessage,
                nextMode: nextMode,
                nextTimeLeft: nextTimeLeft,
                pomodorosCompleted: nextPomodorosCompleted,
                blockTimeConsumed: newBlockTimeConsumed,
                initialTime: nextTimeLeft, // Update initialTime for the next mode
            };
          }
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [pomodoroTimer.running, pomodoroTimer.timeLeft, pomodoroTimer.mode, pomodoroSettings, currentPomodoroBlockId, dailyScheduleState, audioEnabled, isMuted, pomodoroTimer.blockTimeConsumed, pomodoroTimer.linkedActivityId]);


  const startPomodoroSession = useCallback((mode, duration, linkedActivityId = null) => {
    clearInterval(intervalRef.current);
    setPomodoroTimer({
      running: true,
      mode: mode,
      timeLeft: duration * 60,
      pomodorosCompleted: mode === 'work' ? pomodoroTimer.pomodorosCompleted : pomodoroTimer.pomodorosCompleted,
      showAlert: false,
      alertMessage: '',
      nextMode: null,
      nextTimeLeft: 0,
      linkedActivityId: linkedActivityId,
      initialTime: duration * 60, // Set initial time here
    });
    if (linkedActivityId) {
        setCurrentPomodoroBlockId(linkedActivityId);
        setBlockTimeConsumed(0);
    } else {
        setCurrentPomodoroBlockId(null);
        setBlockTimeConsumed(0);
    }
  }, [pomodoroTimer.pomodorosCompleted]);

  const pausePomodoro = () => { setPomodoroTimer(prev => ({ ...prev, running: false })); };

  const resetPomodoro = () => {
    clearInterval(intervalRef.current);
    setPomodoroTimer({
      running: false, mode: 'work', timeLeft: pomodoroSettings.work * 60, pomodorosCompleted: 0,
      showAlert: false, alertMessage: '', nextMode: null, nextTimeLeft: 0, linkedActivityId: null,
      initialTime: pomodoroSettings.work * 60,
    });
    setCurrentPomodoroBlockId(null);
    setBlockTimeConsumed(0);
  };

  const continuePomodoro = () => {
    setPomodoroTimer(prev => ({
      ...prev, running: true, mode: prev.nextMode, timeLeft: prev.nextTimeLeft,
      showAlert: false, alertMode: null, nextTimeLeft: 0, initialTime: prev.nextTimeLeft,
    }));
  };

  const endPomodoroSession = () => { resetPomodoro(); };

  const skipBreak = () => {
    setPomodoroTimer(prev => ({
      ...prev, running: true, mode: 'work', timeLeft: pomodoroSettings.work * 60,
      showAlert: false, alertMode: null, nextTimeLeft: 0, initialTime: pomodoroSettings.work * 60,
    }));
  };

  const handlePomodoroSettingChange = (e) => {
    const { name, value } = e.target;
    setPomodoroSettings(prev => ({ ...prev, [name]: Number(value) }));
  };

  const getLogForActivity = (activityId, date = currentDate) => {
    const todayStr = date.toISOString().split('T')[0];
    return activityLogs.find(log => log.date === todayStr && log.activityId === activityId);
  };

  const logTime = (activityId, type) => {
    const todayStr = currentDate.toISOString().split('T')[0];
    const currentTime = new Date();

    setActivityLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === todayStr && log.activityId === activityId);

      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        if (type === 'start') {
          updatedLogs[existingLogIndex].actualStart = currentTime.toISOString();
          updatedLogs[existingLogIndex].actualEnd = null;
        } else if (type === 'end') {
          updatedLogs[existingLogIndex].actualEnd = currentTime.toISOString();
        } else if (type === 'reset') {
          updatedLogs.splice(existingLogIndex, 1);
        }
        return updatedLogs;
      } else {
        const newLog = {
          id: crypto.randomUUID(), date: todayStr, activityId: activityId,
          actualStart: type === 'start' ? currentTime.toISOString() : null,
          actualEnd: type === 'end' ? currentTime.toISOString() : null,
          linkedTaskId: null, linkedSubtaskId: null,
        };
        return [...prevLogs, newLog];
      }
    });

    if (type === 'start') {
      const activity = dailyScheduleState.find(a => a.id === activityId);
      if (activity && activity.type === 'academic') {
        const totalBlockSeconds = Math.floor(activity.durationMinutes * 60);
        const firstPomodoroDuration = Math.min(pomodoroSettings.work * 60, totalBlockSeconds);
        startPomodoroSession('work', firstPomodoroDuration / 60, activityId);
      } else {
        resetPomodoro(); // Reset pomodoro if starting a non-academic activity
      }
    } else if (type === 'end') {
        setPomodoroTimer(prev => ({ ...prev, running: false, linkedActivityId: null, initialTime: 0 }));
        setCurrentPomodoroBlockId(null);
        setBlockTimeConsumed(0);
    } else if (type === 'reset') {
        if (currentPomodoroBlockId === activityId) {
            resetPomodoro();
        }
    }
  };

  const handleActualTimeChange = (logId, timeType, value) => {
    setActivityLogs(prevLogs => {
      const dateKey = formatDateToYYYYMMDD(currentDate);
      return prevLogs.map(log => {
        if (log.id === logId && log.date === dateKey) {
          const newLog = { ...log };
          if (timeType === 'start') {
            // Combine current date with new time for actualStart
            const [hours, minutes] = value.split(':').map(Number);
            const newDate = new Date(log.actualStart || currentDate); // Use existing date or current date
            newDate.setHours(hours, minutes, 0, 0);
            newLog.actualStart = newDate.toISOString();
          } else if (timeType === 'end') {
            // Combine current date with new time for actualEnd
            const [hours, minutes] = value.split(':').map(Number);
            const newDate = new Date(log.actualEnd || currentDate); // Use existing date or current date
            newDate.setHours(hours, minutes, 0, 0);
            newLog.actualEnd = newDate.toISOString();
          }
          return newLog;
        }
        return log;
      });
    });
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
    let totalActualTimeAllActivities = 0;
    let totalPlannedTimeAllActivities = 0;

    dailyLogs.forEach(log => {
      const activity = dailyScheduleState.find(item => item.id === log.activityId);
      if (activity) {
        const actualDurationHours = getActualDuration(log);
        if (!reportSummary[activity.type]) {
          reportSummary[activity.type] = { planned: 0, actual: 0, activities: [] };
        }
        reportSummary[activity.type].actual += actualDurationHours;
        reportSummary[activity.type].activities.push({
          activity: activity.activity, actualStart: log.actualStart, actualEnd: log.actualEnd,
          actualDuration: actualDurationHours, activityNotes: subTaskDetails[activity.id] || '',
        });

        if (activity.type === 'academic') {
          totalActualFocusedTime += actualDurationHours;
        }
        totalActualTimeAllActivities += actualDurationHours;
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
        totalPlannedTimeAllActivities += plannedDurationHours;
    });

    return {
      summary: reportSummary,
      totalFocused: totalActualFocusedTime,
      totalPlannedFocusedTime,
      totalActualTimeAllActivities,
      totalPlannedTimeAllActivities,
    };
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
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/New_York'
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
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/New_York'
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

  const handleActivityNotesChange = (activityId, value) => {
    setSubTaskDetails(prev => ({ ...prev, [activityId]: value, }));
  };

  const handleActivityNotesBlur = (activityId) => { setEditingSubTaskId(null); };

  const handleActivityNotesKeyDown = (e, activityId) => { if (e.key === 'Enter') { setEditingSubTaskId(null); } };

  // --- Template Activity Handlers (for Day Planner tab) ---
  const handleAddTemplateActivity = () => {
    setEditingActivity({
      id: `new-${Date.now()}`, activity: '', plannedStart: '09:00', plannedEnd: '10:00',
      type: 'personal', recurrenceType: 'none', recurrenceDays: [], constraintType: 'adjustable', isNew: true,
    });
    setIsEditingDailySchedule(false); // This is a template edit
    setIsActivityModalOpen(true);
  };

  const handleEditTemplateActivity = (activity) => {
    setEditingActivity({
      ...activity, recurrenceType: activity.recurrenceType || 'none',
      recurrenceDays: activity.recurrenceDays || [], constraintType: activity.constraintType || 'adjustable',
    });
    setIsEditingDailySchedule(false); // This is a template edit
    setIsActivityModalOpen(true);
  };

  const handleDeleteTemplateActivity = (activityId) => {
    setConfirmationMessage('Are you sure you want to delete this template activity?');
    confirmationCallback.current = () => {
      setPlannerSchedule(prevSchedule => {
        const updatedSchedule = { ...prevSchedule };
        updatedSchedule[activePlannerDayType] = updatedSchedule[activePlannerDayType].filter(act => act.id !== activityId);
        return updatedSchedule;
      });
      setShowConfirmationModal(false);
    };
    setShowConfirmationModal(true);
  };

  const handleSaveTemplateActivity = (updatedActivity) => {
    setPlannerSchedule(prevSchedule => {
      const updatedSchedule = { ...prevSchedule };
      if (updatedActivity.isNew) {
        const { isNew, ...newActivity } = updatedActivity;
        updatedSchedule[activePlannerDayType] = [...updatedSchedule[activePlannerDayType], { ...newActivity, id: crypto.randomUUID() }];
      } else {
        updatedSchedule[activePlannerDayType] = updatedSchedule[activePlannerDayType].map(act =>
          act.id === updatedActivity.id ? updatedActivity : act
        );
      }
      return updatedSchedule;
    });
    setIsActivityModalOpen(false);
    setEditingActivity(null);
  };

  // --- Daily Activity Handlers (for Schedule tab) ---
  const handleAddDailyActivity = (initialStart = '09:00', initialEnd = '09:30') => {
    setEditingActivity({
      id: `new-${Date.now()}`, activity: '', plannedStart: initialStart, plannedEnd: initialEnd,
      type: 'personal', recurrenceType: 'none', recurrenceDays: [], constraintType: 'adjustable', isNew: true,
    });
    setIsEditingDailySchedule(true); // This is a daily edit
    setIsActivityModalOpen(true);
  };

  const handleEditDailyActivity = (activity) => {
    setEditingActivity({
      ...activity, recurrenceType: activity.recurrenceType || 'none',
      recurrenceDays: activity.recurrenceDays || [], constraintType: activity.constraintType || 'adjustable',
    });
    setIsEditingDailySchedule(true); // This is a daily edit
    setIsActivityModalOpen(true);
  };

  const handleDeleteDailyActivity = (activityId) => {
    setConfirmationMessage('Are you sure you want to delete this activity for this specific day?');
    confirmationCallback.current = () => {
      const dateKey = formatDateToYYYYMMDD(currentDate); // Use currentDate for schedule tab
      setDailyCustomSchedules(prev => {
        const newDailyCustomSchedules = { ...prev };
        if (newDailyCustomSchedules[dateKey]) {
          newDailyCustomSchedules[dateKey] = newDailyCustomSchedules[dateKey].filter(act => act.id !== activityId);
        }
        return newDailyCustomSchedules;
      });
      setShowConfirmationModal(false);
    };
    setShowConfirmationModal(true);
  };

  const handleSaveDailyActivity = (updatedActivity) => {
    const dateKey = formatDateToYYYYMMDD(currentDate); // Use currentDate for schedule tab
    setDailyCustomSchedules(prev => {
      // If no custom schedule exists for this day, initialize it from the generated schedule
      const currentDaySchedule = prev[dateKey] ? [...prev[dateKey]] :
                                 generateScheduleForDate(currentDate, null, true, plannerSchedule, prev, fastingDates, iqamahConfig);
      let newDaySchedule;

      if (updatedActivity.isNew) {
        const { isNew, ...newActivity } = updatedActivity;
        newDaySchedule = [...currentDaySchedule, { ...newActivity, id: crypto.randomUUID() }];
      } else {
        newDaySchedule = currentDaySchedule.map(act =>
          act.id === updatedActivity.id ? updatedActivity : act
        );
      }
      return { ...prev, [dateKey]: newDaySchedule, };
    });
    setIsActivityModalOpen(false);
    setEditingActivity(null);
  };

  const handleApplyTemplateToDailyPlan = () => {
    const dateKey = formatDateToYYYYMMDD(currentDate); // Apply to current date
    const generatedSchedule = generateScheduleForDate(currentDate, selectedBaseTemplate, true, plannerSchedule, dailyCustomSchedules, fastingDates, iqamahConfig);
    setDailyCustomSchedules(prev => ({ ...prev, [dateKey]: generatedSchedule }));
    showToast(`Template '${selectedBaseTemplate}' applied to ${currentDate.toLocaleDateString()}!`, 'success');
  };

  const handleCancelEdit = () => {
    setIsActivityModalOpen(false);
    setEditingActivity(null);
  };

  const handleAddTask = () => {
    setEditingTask({
      id: `task-${Date.now()}`, name: '', description: '', targetStartDate: '', deadlineDate: '',
      expectedDurationHours: 0, actualCompletionDate: null, status: 'pending', type: 'personal',
      urgency: 'medium', importance: 'medium', subtasks: [], isNew: true,
    });
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask({ ...task, subtasks: task.subtasks || [] });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId) => {
    setConfirmationMessage('Are you sure you want to delete this task?');
    confirmationCallback.current = () => {
      setProjectTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      setShowConfirmationModal(false);
    };
    setShowConfirmationModal(true);
  };

  const handleSaveTask = (updatedTask) => {
    setProjectTasks(prevTasks => {
      if (updatedTask.isNew) {
        const { isNew, ...newTask } = updatedTask;
        return [...prevTasks, { ...newTask, id: crypto.randomUUID() }];
      } else {
        return prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task);
      }
    });
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleCancelTaskEdit = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleAddSubtask = (taskId, subtaskName) => {
    setEditingTask(prevTask => {
      if (!prevTask) return prevTask;
      const newSubtask = { id: crypto.randomUUID(), name: subtaskName, completed: false };
      return { ...prevTask, subtasks: [...(prevTask.subtasks || []), newSubtask], };
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
    setEditingSubtaskNameId(null);
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

  const openAssignTaskModal = (activityToAssignTo = null, taskToAssign = null) => {
    setAssigningToActivity(activityToAssignTo);
    setAssigningFromTask(taskToAssign);
    setIsAssignTaskModal(true);
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
        const newLog = {
          id: crypto.randomUUID(), date: dateStr, activityId: selectedActivityId,
          actualStart: null, actualEnd: null, linkedTaskId: selectedTaskId, linkedSubtaskId: selectedSubtaskId,
        };
        return [...prevLogs, newLog];
      }
    });

    if (selectedTaskId && selectedSubtaskId) {
        setProjectTasks(prevTasks => prevTasks.map(task => {
            if (task.id === selectedTaskId) {
                const updatedSubtasks = (task.subtasks || []).map(sub => {
                    if (sub.id === selectedSubtaskId && !sub.completed) {
                        return { ...sub, completed: false };
                    }
                    return sub;
                });
                let newStatus = task.status;
                if (newStatus === 'pending') { newStatus = 'in-progress'; }
                return { ...task, subtasks: updatedSubtasks, status: newStatus };
            }
            return task;
        }));
    } else if (selectedTaskId) {
         setProjectTasks(prevTasks => prevTasks.map(task => {
            if (task.id === selectedTaskId) {
                let newStatus = task.status;
                if (newStatus === 'pending') { newStatus = 'in-progress'; }
                return { ...task, status: newStatus };
            }
            return task;
        }));
    }

    setIsAssignTaskModal(false);
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
          taskName: task.name, subtaskName: subtask ? subtask.name : null,
          taskId: task.id, subtaskId: subtask ? subtask.id : null,
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

  // Function to toggle collapsed state of sections
  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const groupedSchedule = dailyScheduleState.reduce((acc, activity) => {
    const group = getTimeOfDayGroup(activity.plannedStart);
    if (!acc[group]) { acc[group] = []; }
    acc[group].push(activity);
    return acc;
  }, {});

  const timeOfDayOrder = ['morning', 'afternoon', 'evening', 'night']; // Updated order

  const getEisenhowerQuadrant = useCallback((task) => {
    const { urgency, importance } = task;
    const isUrgent = urgency === 'high' || urgency === 'critical';
    const isImportant = importance === 'high' || importance === 'critical';

    if (isUrgent && isImportant) return 'Do Now';
    if (!isUrgent && isImportant) return 'Schedule';
    if (isUrgent && !isImportant) return 'Delegate';
    if (!isUrgent && !isImportant) return 'Eliminate';
    return 'Uncategorized';
  }, []);

  const eisenhowerTasks = projectTasks.reduce((acc, task) => {
    if (task.actualCompletionDate) return acc;
    const quadrant = getEisenhowerQuadrant(task);
    if (!acc[quadrant]) { acc[quadrant] = []; }
    acc[quadrant].push(task);
    return acc;
  }, {});

  const handleDataOptionChange = (type, category, value) => {
    setDataManagementOptions(prev => ({ ...prev, [type]: { ...prev[type], [category]: value } }));
  };

  const handleExportData = () => {
    const dataToExport = {};
    if (dataManagementOptions.export.tasks) dataToExport.projectTasks = projectTasks;
    if (dataManagementOptions.export.activityLogs) dataToExport.activityLogs = activityLogs;
    if (dataManagementOptions.export.dailySchedule) dataToExport.plannerSchedule = plannerSchedule;
    if (dataManagementOptions.export.pomodoroSettings) dataToExport.pomodoroSettings = pomodoroSettings;
    if (dataManagementOptions.export.subTaskDetails) dataToExport.subTaskDetails = subTaskDetails;
    if (dataManagementOptions.export.fastingDates) dataToExport.fastingDates = fastingDates;
    if (dataManagementOptions.export.dailyCustomSchedules) dataToExport.dailyCustomSchedules = dailyCustomSchedules;
    if (dataManagementOptions.export.iqamahConfig) dataToExport.iqamahConfig = iqamahConfig;
    if (dataManagementOptions.export.appSettings) dataToExport.appSettings = appSettings;


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
    showToast('Selected data exported successfully!', 'success');
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setConfirmationMessage('Are you sure you want to import data? This will overwrite selected existing data categories.');
      confirmationCallback.current = () => {
        try {
          const importedData = JSON.parse(e.target.result);
          let importedCount = 0;
          let skippedCount = 0;
          let message = "Import Summary:\n";

          if (dataManagementOptions.import.tasks && importedData.projectTasks) { setProjectTasks(importedData.projectTasks); importedCount++; message += "- Task List: Imported\n"; } else if (dataManagementOptions.import.tasks && !importedData.projectTasks) { skippedCount++; message += "- Task List: Skipped (not found in file)\n"; }
          if (dataManagementOptions.import.activityLogs && importedData.activityLogs) { setActivityLogs(importedData.activityLogs); importedCount++; message += "- Activity Logs: Imported\n"; } else if (dataManagementOptions.import.activityLogs && !importedData.activityLogs) { skippedCount++; message += "- Activity Logs: Skipped (not found in file)\n"; }
          if (dataManagementOptions.import.dailySchedule && importedData.plannerSchedule) { setPlannerSchedule(importedData.plannerSchedule); importedCount++; message += "- Daily Schedule: Imported\n"; } else if (dataManagementOptions.import.dailySchedule && !importedData.plannerSchedule) { skippedCount++; message += "- Daily Schedule: Skipped (not found in file)\n"; }
          if (dataManagementOptions.import.pomodoroSettings && importedData.pomodoroSettings) { setPomodoroSettings(importedData.pomodoroSettings); importedCount++; message += "- Pomodoro Settings: Imported\n"; } else if (dataManagementOptions.import.pomodoroSettings && !importedData.pomodoroSettings) { skippedCount++; message += "- Pomodoro Settings: Skipped (not found in file)\n"; }
          if (dataManagementOptions.import.subTaskDetails && importedData.subTaskDetails) { setSubTaskDetails(importedData.subTaskDetails); importedCount++; message += "- Activity Notes: Imported\n"; } else if (dataManagementOptions.import.subTaskDetails && !importedData.subTaskDetails) { skippedCount++; message += "- Activity Notes: Skipped (not found in file)\n"; }
          if (dataManagementOptions.import.fastingDates && importedData.fastingDates) { setFastingDates(importedData.fastingDates); importedCount++; message += "- Fasting Dates: Imported\n"; } else if (dataManagementOptions.import.fastingDates && !importedData.fastingDates) { skippedCount++; message += "- Fasting Dates: Skipped (not found in file)\n"; }
          if (dataManagementOptions.import.dailyCustomSchedules && importedData.dailyCustomSchedules) { setDailyCustomSchedules(importedData.dailyCustomSchedules); importedCount++; message += "- Daily Custom Schedules: Imported\n"; } else if (dataManagementOptions.import.dailyCustomSchedules && !importedData.dailyCustomSchedules) { skippedCount++; message += "- Daily Custom Schedules: Skipped (not found in file)\n"; }
          if (dataManagementOptions.import.iqamahConfig && importedData.iqamahConfig) { setIqamahConfig(importedData.iqamahConfig); importedCount++; message += "- Iqamah Config: Imported\n"; } else if (dataManagementOptions.import.iqamahConfig && !importedData.iqamahConfig) { skippedCount++; message += "- Iqamah Config: Skipped (not found in file)\n"; }
          if (dataManagementOptions.import.appSettings && importedData.appSettings) { setAppSettings(importedData.appSettings); importedCount++; message += "- App Settings: Imported\n"; } else if (dataManagementOptions.import.appSettings && !importedData.appSettings) { skippedCount++; message += "- App Settings: Skipped (not found in file)\n"; }


          if (importedCount === 0 && skippedCount === 0) { message = "No data categories were selected for import or found in the file."; }
          else if (importedCount > 0) { message += "\nData imported successfully!"; }
          else { message += "\nNo data was imported."; }
          showToast(message, 'info');

        } catch (error) {
          console.error("Error importing data:", error);
          showToast('Failed to import data. Please ensure the file is a valid JSON.', 'error');
        }
        event.target.value = '';
        setShowConfirmationModal(false);
      };
      setShowConfirmationModal(true);
    };
    reader.readAsText(file);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleMouseDown = useCallback((e, activityId, type = 'move') => {
    e.preventDefault();
    // Stop propagation to prevent the parent's double-click handler from firing
    // when clicking on an activity block.
    e.stopPropagation();

    const activityElement = e.currentTarget;
    const rect = activityElement.getBoundingClientRect();
    const timelineRect = plannerTimelineRef.current.getBoundingClientRect();

    const dateKey = formatDateToYYYYMMDD(currentDate);
    // Ensure currentDayActivities is a mutable copy of the schedule for the current day
    // If no custom schedule exists for this day, initialize it from the generated schedule before modifying
    let currentDayActivities = dailyCustomSchedules[dateKey] ? [...dailyCustomSchedules[dateKey]] :
                                 generateScheduleForDate(currentDate, null, true, plannerSchedule, dailyCustomSchedules, fastingDates, iqamahConfig);

    let activityToModify = currentDayActivities.find(act => act.id === activityId);
    if (!activityToModify) return;

    // If we just initialized currentDayActivities, we need to save it back to dailyCustomSchedules
    // before starting the drag/resize to ensure future updates apply to this new custom schedule.
    if (!dailyCustomSchedules[dateKey]) {
        setDailyCustomSchedules(prev => ({ ...prev, [dateKey]: currentDayActivities }));
    }

    if (type === 'move') {
      setDraggingActivity({
        id: activityId, startY: e.clientY, initialTop: rect.top - timelineRect.top,
        initialStart: activityToModify.plannedStart,
        initialEnd: activityToModify.plannedEnd,
      });
    } else { // type is 'top' or 'bottom' for resizing
      setResizingActivity({
        id: activityId, startY: e.clientY, initialHeight: rect.height, initialTop: rect.top - timelineRect.top,
        type: type, initialStart: activityToModify.plannedStart,
        initialEnd: activityToModify.plannedEnd,
      });
    }
  }, [dailyCustomSchedules, currentDate, plannerSchedule, fastingDates, iqamahConfig]);

  const handleMouseMove = useCallback((e) => {
    const dateKey = formatDateToYYYYMMDD(currentDate);
    const totalPlannerMinutes = 24 * 60;
    // Calculate pixels per minute based on the actual height of the timeline
    const pixelsPerMinute = plannerTimelineRef.current ? plannerTimelineRef.current.clientHeight / totalPlannerMinutes : 1;

    if (draggingActivity) {
      const deltaY = e.clientY - draggingActivity.startY;
      const minutesDelta = Math.round(deltaY / pixelsPerMinute);

      const initialStartMinutes = timeToMinutes(draggingActivity.initialStart);
      const initialEndMinutes = timeToMinutes(draggingActivity.initialEnd);
      // Calculate duration considering overnight activities
      const durationMinutes = (initialEndMinutes < initialStartMinutes ? initialEndMinutes + 1440 : initialEndMinutes) - initialStartMinutes;

      let newStartMinutes = initialStartMinutes + minutesDelta;
      let newEndMinutes = newStartMinutes + durationMinutes;

      // Ensure times wrap around correctly for HH:MM display
      const finalPlannedStart = minutesToTime((newStartMinutes % 1440 + 1440) % 1440);
      const finalPlannedEnd = minutesToTime((newEndMinutes % 1440 + 1440) % 1440);

      setDailyCustomSchedules(prev => {
        const currentDaySchedule = prev[dateKey] ? [...prev[dateKey]] : dailyScheduleState;
        const updatedSchedule = currentDaySchedule.map(activity => {
          if (activity.id === draggingActivity.id) {
            return { ...activity, plannedStart: finalPlannedStart, plannedEnd: finalPlannedEnd };
          }
          return activity;
        });
        return { ...prev, [dateKey]: updatedSchedule };
      });
    } else if (resizingActivity) {
      const deltaY = e.clientY - resizingActivity.startY;
      const minutesDelta = Math.round(deltaY / pixelsPerMinute);

      setDailyCustomSchedules(prev => {
        const currentDaySchedule = prev[dateKey] ? [...prev[dateKey]] : dailyScheduleState;
        const updatedSchedule = currentDaySchedule.map(activity => {
          if (activity.id === resizingActivity.id) {
            let currentStartMinutes = timeToMinutes(resizingActivity.initialStart);
            let currentEndMinutes = timeToMinutes(resizingActivity.initialEnd);

            // Adjust initialEndMinutes if it crosses midnight relative to initialStartMinutes
            if (currentEndMinutes < currentStartMinutes) {
              currentEndMinutes += 1440;
            }

            let newStartMinutes = currentStartMinutes;
            let newEndMinutes = currentEndMinutes;

            if (resizingActivity.type === 'bottom') {
              newEndMinutes = currentEndMinutes + minutesDelta;
              if (newEndMinutes <= newStartMinutes) {
                newEndMinutes = newStartMinutes + 1; // Ensure minimum 1 minute duration
              }
            } else if (resizingActivity.type === 'top') {
              newStartMinutes = currentStartMinutes + minutesDelta;
              if (newStartMinutes >= newEndMinutes) {
                newStartMinutes = newEndMinutes - 1; // Ensure minimum 1 minute duration
              }
            }

            // Convert back to HH:MM, handling potential midnight crossings for display
            // The modulo operator handles wrapping around 24 hours (1440 minutes)
            const finalPlannedStart = minutesToTime((newStartMinutes % 1440 + 1440) % 1440);
            const finalPlannedEnd = minutesToTime((newEndMinutes % 1440 + 1440) % 1440);

            return { ...activity, plannedStart: finalPlannedStart, plannedEnd: finalPlannedEnd };
          }
          return activity;
        });
        return { ...prev, [dateKey]: updatedSchedule };
      });
    }
  }, [draggingActivity, resizingActivity, dailyCustomSchedules, currentDate, dailyScheduleState]);

  const handleMouseUp = useCallback(() => {
    setDraggingActivity(null);
    setResizingActivity(null);
  }, []);

  useEffect(() => {
    if (draggingActivity || resizingActivity) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingActivity, resizingActivity, handleMouseMove, handleMouseUp]);

  const calculateBlockStyles = useCallback((activity) => {
    const startMinutes = timeToMinutes(activity.plannedStart);
    let endMinutes = timeToMinutes(activity.plannedEnd);

    if (endMinutes < startMinutes) { endMinutes += 1440; } // Handle overnight activities

    const durationMinutes = endMinutes - startMinutes;

    const totalPlannerMinutes = 24 * 60;
    // Use a fixed height for the timeline to ensure consistent spacing
    const timelineFixedDisplayHeight = 2880; // Doubled height for more zoom
    const pixelsPerMinute = timelineFixedDisplayHeight / totalPlannerMinutes;

    const topPx = startMinutes * pixelsPerMinute;
    const heightPx = durationMinutes * pixelsPerMinute;

    return { top: `${topPx}px`, height: `${heightPx}px`, };
  }, []); // Removed plannerTimelineRef from dependency as height is fixed

  // Effect to update dailyScheduleState whenever currentDate or underlying data changes
  useEffect(() => {
    setDailyScheduleState(generateScheduleForDate(currentDate, null, true, plannerSchedule, dailyCustomSchedules, fastingDates, iqamahConfig));
  }, [currentDate, plannerSchedule, dailyCustomSchedules, fastingDates, iqamahConfig]);

  // --- AI Schedule Refinement Function (Integrated) ---
  const refineScheduleWithAI = useCallback(async (userInput) => {
    if (!userInput.trim()) {
        showToast("Please enter a command for the AI assistant.", "error");
        return;
    }
    if (!appSettings.geminiApiKey) {
        showToast("Please enter your Gemini API Key in Settings to use the AI assistant.", "error", 5000);
        return;
    }

    showToast("Processing AI command...", "info", 5000);

    // Provide the current daily schedule to the AI for better context
    const currentScheduleContext = dailyScheduleState.map(activity => ({
        id: activity.id, // Include ID for AI to potentially reference
        activity: activity.activity,
        plannedStart: activity.plannedStart,
        plannedEnd: activity.plannedEnd,
        type: activity.type,
        constraintType: activity.constraintType,
    }));

    const chatHistory = [];
    chatHistory.push({
        role: "user",
        parts: [{
            text: `Given the current daily schedule (today is ${formatDateToYYYYMMDD(currentDate)}):
            ${JSON.stringify(currentScheduleContext)}

            Please parse this schedule modification request into a JSON object.
            Your response MUST be a complete and valid JSON object, and ONLY the JSON object. Do not include any conversational text, markdown formatting outside the JSON, or incomplete JSON.
            The JSON object MUST have the following structure:
            {
                "action": "modify_activity" | "shift_activities" | "add_activity" | "delete_activity",
                "activityName": "string" (Name or part of the activity to target. Try to match closely to existing activity names if modifying/deleting. Use the exact 'id' from the provided current schedule if possible for precise targeting.),
                "targetDate": "string" (Date for the change, e.g., 'today', 'tomorrow', 'YYYY-MM-DD'. Infer 'today' if no date is given. MUST be YYYY-MM-DD format if a specific date is provided.),
                "newPlannedStart": "string" (New start time in HH:MM format. REQUIRED for modify_activity and add_activity. If not provided by user, infer based on context or typical duration.),
                "newPlannedEnd": "string" (New end time in HH:MM format. REQUIRED for modify_activity and add_activity. If not provided by user, infer based on context or typical duration (e.g., 30-60 mins).),
                "durationChangeMinutes": "number" (Change in duration in minutes, e.g., 15 for +15m, -30 for -30m. Only for modify_activity. If provided, calculate newPlannedEnd from newPlannedStart + durationChangeMinutes.),
                "shiftMinutes": "number" (Amount to shift activities in minutes, e.g., 30 for +30m, -15 for -15m. Only for shift_activities.),
                "activityTypeFilter": "string" ("personal" | "academic" | "spiritual" | "physical" | "work" | "project", optional. Filter activities by type for shifts or adding new activities. Infer if adding new activity and type is clear from name.),
                "activityId": "string" (Optional. The 'id' of the activity from the provided current schedule for precise targeting. Use this if you are confident about the activity.)
            }

            Key instructions for your parsing and suggestions:
            1.  **Contextual Awareness**: Use the provided 'current daily schedule' to understand existing activities, their times, types, and constraint types. Use the 'id' from the context if you are sure about the activity.
            2.  **Hard Constraints**: Activities with "constraintType": "hard" are IMMOVABLE. If a requested change conflicts with a hard constraint, suggest an alternative that avoids the conflict or state that the change cannot be made without violating a hard constraint.
            3.  **Adjustable/Removable Activities**: If a change to one activity (e.g., extending its duration or shifting its start time) causes an overlap with an 'adjustable' or 'removable' activity, automatically shift or shrink the overlapping 'adjustable'/'removable' activities to accommodate the change, if possible. For 'removable' activities, suggest deleting them if no other adjustment is feasible.
            4.  **Inference for Missing Times/Durations**: For 'modify_activity' or 'add_activity', if \`newPlannedStart\` or \`newPlannedEnd\` are not explicitly provided by the user, you MUST infer them. If only one is given, infer the other based on a typical duration (e.g., 30-60 minutes for a new activity, or maintaining existing duration for modifications). If neither is given for a new activity, suggest a reasonable default like '09:00' to '09:30'.
            5.  **Complete Output**: Ensure all relevant fields in the JSON schema are populated with the best possible suggestion, even if not explicitly mentioned by the user, to make the command executable seamlessly.
            6.  **Strict JSON**: Your response MUST be a complete and valid JSON object, and ONLY the JSON object. Do not include any conversational text, markdown formatting outside the JSON (e.g., backticks), or incomplete JSON. Do not add comments within the JSON values.

            User request: "${userInput}"`
        }]
    });

    const payload = { // Renamed from payload1
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            action: { type: "STRING" },
            activityName: { type: "STRING" },
            targetDate: { type: "STRING" },
            newPlannedStart: { type: "STRING" },
            newPlannedEnd: { type: "STRING" },
            durationChangeMinutes: { type: "NUMBER" },
            shiftMinutes: { type: "NUMBER" },
            activityTypeFilter: { type: "STRING" },
            activityId: { type: "STRING" } // Added activityId to schema for precise targeting
          }
        }
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${appSettings.geminiApiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) // Use the local payload
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        if (result.error && result.error.message) {
          errorMessage += `: ${result.error.message}`;
        }
        throw new Error(errorMessage);
      }

      // Check for 'text' property in result.candidates[0].content.parts[0]
      if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0 && result.candidates[0].content.parts[0].text) {
        let parsedCommand;
        let jsonString = '';
        try { // Added try-catch for JSON.parse
            jsonString = result.candidates[0].content.parts[0].text;
            parsedCommand = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Error parsing AI response JSON:", parseError, jsonString); // Log the malformed JSON string
            showToast(`AI response malformed: ${parseError.message}. Please try rephrasing your command.`, "error", 7000);
            return; // Exit if parsing fails
        }

        console.log("AI Parsed Command:", parsedCommand);

        const targetDateObj = parsedCommand.targetDate === 'today' ? currentDate :
                              parsedCommand.targetDate === 'tomorrow' ? new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) :
                              parsedCommand.targetDate ? new Date(parsedCommand.targetDate) : currentDate;
        const dateKey = formatDateToYYYYMMDD(targetDateObj);

        setDailyCustomSchedules(prevDailySchedules => {
          // Ensure we are working on a mutable copy of the current day's schedule
          let currentDayActivities = prevDailySchedules[dateKey] ? [...prevDailySchedules[dateKey]] :
                                       generateScheduleForDate(targetDateObj, null, true, plannerSchedule, prevDailySchedules, fastingDates, iqamahConfig);
          let updatedDayActivities = [...currentDayActivities];
          let changesApplied = false;
          let conflictDetected = false;

          const checkOverlap = (activityToCheck, currentActivities) => {
            const start1 = timeToMinutes(activityToCheck.plannedStart);
            let end1 = timeToMinutes(activityToCheck.plannedEnd);
            if (end1 < start1) end1 += 1440;

            for (const existingActivity of currentActivities) {
              if (existingActivity.id === activityToCheck.id) continue; // Don't check against itself

              const start2 = timeToMinutes(existingActivity.plannedStart);
              let end2 = timeToMinutes(existingActivity.plannedEnd);
              if (end2 < start2) end2 += 1440;

              // Check for overlap
              if (Math.max(start1, start2) < Math.min(end1, end2)) {
                if (existingActivity.constraintType === 'hard' || activityToCheck.constraintType === 'hard') {
                  return true; // Conflict with a hard constraint
                }
              }
            }
            return false;
          };


          if (parsedCommand.action === 'modify_activity') {
            const activityIndex = updatedDayActivities.findIndex(act =>
                (parsedCommand.activityId && act.id === parsedCommand.activityId) || // Prefer ID if provided by AI
                (parsedCommand.activityName && act.activity.toLowerCase().includes(parsedCommand.activityName.toLowerCase()))
            );
            if (activityIndex > -1) {
              const originalActivity = { ...updatedDayActivities[activityIndex] };
              let newStart = parsedCommand.newPlannedStart || originalActivity.plannedStart;
              let newEnd = parsedCommand.newPlannedEnd || originalActivity.plannedEnd;

              if (parsedCommand.durationChangeMinutes !== undefined) {
                const currentStartMinutes = timeToMinutes(newStart);
                let newEndMinutes = currentStartMinutes + parsedCommand.durationChangeMinutes;
                newEnd = minutesToTime(newEndMinutes);
              }

              const potentialActivity = { ...originalActivity, plannedStart: newStart, plannedEnd: newEnd };

              if (checkOverlap(potentialActivity, updatedDayActivities.filter((_, idx) => idx !== activityIndex))) {
                showToast(`Conflict detected: Cannot modify "${originalActivity.activity}" due to overlap with a hard constraint activity.`, 'error', 5000);
                conflictDetected = true;
              } else {
                updatedDayActivities[activityIndex] = potentialActivity;
                changesApplied = true;
                showToast(`Activity "${originalActivity.activity}" modified.`, 'success');
              }
            } else {
              showToast(`Activity "${parsedCommand.activityName}" not found for modification.`, 'error');
            }
          } else if (parsedCommand.action === 'shift_activities') {
            const shiftMinutes = parsedCommand.shiftMinutes || 0;
            if (shiftMinutes === 0) {
                showToast("No shift amount specified.", "error");
                return prevDailySchedules;
            }
            const activitiesToShift = updatedDayActivities.filter(act =>
              (!parsedCommand.activityTypeFilter || act.type === parsedCommand.activityTypeFilter) &&
              act.constraintType !== 'hard' // Don't shift hard constraint activities
            );

            let allShiftsPossible = true;
            let tempUpdatedActivities = JSON.parse(JSON.stringify(updatedDayActivities)); // Work on a deep copy for pre-check

            for (const activity of activitiesToShift) {
                const originalStartMinutes = timeToMinutes(activity.plannedStart);
                let originalEndMinutes = timeToMinutes(activity.plannedEnd);
                if (originalEndMinutes < originalStartMinutes) originalEndMinutes += 1440;

                let newStartMinutes = originalStartMinutes + shiftMinutes;
                let newEndMinutes = originalEndMinutes + shiftMinutes;

                // Handle wrap around for new times
                if (newStartMinutes < 0) { newStartMinutes += 1440; newEndMinutes += 1440; }
                else if (newStartMinutes >= 1440) { newStartMinutes -= 1440; newEndMinutes -= 1440; }

                const potentialActivity = { ...activity, plannedStart: minutesToTime(newStartMinutes), plannedEnd: minutesToTime(newEndMinutes) };

                // Temporarily update the activity in tempUpdatedActivities for collision check
                const tempIndex = tempUpdatedActivities.findIndex(a => a.id === activity.id);
                if (tempIndex > -1) {
                    const originalTemp = tempUpdatedActivities[tempIndex];
                    tempUpdatedActivities[tempIndex] = potentialActivity;
                    if (checkOverlap(potentialActivity, tempUpdatedActivities.filter(a => a.id !== activity.id))) {
                        showToast(`Conflict detected: Cannot shift "${activity.activity}" due to overlap with a hard constraint activity. Skipping all shifts.`, 'error', 5000);
                        allShiftsPossible = false;
                        break; // Stop if any conflict is found
                    }
                    tempUpdatedActivities[tempIndex] = originalTemp; // Revert for next check
                }
            }

            if (allShiftsPossible) {
                updatedDayActivities = updatedDayActivities.map(activity => {
                    if ((!parsedCommand.activityTypeFilter || activity.type === parsedCommand.activityTypeFilter) && activity.constraintType !== 'hard') {
                        const originalStartMinutes = timeToMinutes(activity.plannedStart);
                        let originalEndMinutes = timeToMinutes(activity.plannedEnd);
                        if (originalEndMinutes < originalStartMinutes) originalEndMinutes += 1440;

                        let newStartMinutes = originalStartMinutes + shiftMinutes;
                        let newEndMinutes = originalEndMinutes + shiftMinutes;

                        if (newStartMinutes < 0) { newStartMinutes += 1440; newEndMinutes += 1440; }
                        else if (newStartMinutes >= 1440) { newStartMinutes -= 1440; newEndMinutes -= 1440; }

                        changesApplied = true;
                        return { ...activity, plannedStart: minutesToTime(newStartMinutes), plannedEnd: minutesToTime(newEndMinutes) };
                    }
                    return activity;
                });
                if (changesApplied) {
                    showToast(`Activities shifted by ${shiftMinutes} minutes.`, 'success');
                } else {
                    showToast("No adjustable activities found to shift, or no shift applied.", "info");
                }
            } else {
                conflictDetected = true;
            }

          } else if (parsedCommand.action === 'add_activity') {
            const newActivity = {
              id: crypto.randomUUID(),
              activity: parsedCommand.activityName || 'New Activity',
              plannedStart: parsedCommand.newPlannedStart || '09:00', // Should be inferred by AI
              plannedEnd: parsedCommand.newPlannedEnd || '10:00',   // Should be inferred by AI
              type: parsedCommand.activityTypeFilter || 'personal',
              recurrenceType: 'none', // AI adds to daily, so no recurrence
              recurrenceDays: [],
              constraintType: 'adjustable', // Default for AI added
            };

            if (checkOverlap(newActivity, updatedDayActivities)) {
              showToast(`Conflict detected: Cannot add "${newActivity.activity}" due to overlap with a hard constraint activity.`, 'error', 5000);
              conflictDetected = true;
            } else {
              updatedDayActivities.push(newActivity);
              changesApplied = true;
              showToast(`Activity "${newActivity.activity}" added.`, 'success');
            }
          } else if (parsedCommand.action === 'delete_activity') {
            const initialLength = updatedDayActivities.length;
            updatedDayActivities = updatedDayActivities.filter(act =>
                (parsedCommand.activityId && act.id === parsedCommand.activityId) || // Prefer ID if provided by AI
                (parsedCommand.activityName && act.activity.toLowerCase().includes(parsedCommand.activityName.toLowerCase()))
            );
            if (updatedDayActivities.length < initialLength) {
              changesApplied = true;
              showToast(`Activity "${parsedCommand.activityName}" deleted.`, 'success');
            } else {
              showToast(`Activity "${parsedCommand.activityName}" not found for deletion.`, 'error');
            }
          } else {
            showToast("AI command not recognized or supported.", "error");
          }

          if (changesApplied && !conflictDetected) {
            // Sort after changes to maintain order
            updatedDayActivities.sort((a, b) => timeToMinutes(a.plannedStart) - timeToMinutes(b.plannedStart));
            return { ...prevDailySchedules, [dateKey]: updatedDayActivities };
          }
          return prevDailySchedules; // No changes applied or conflict
        });

      } else {
        console.error("AI response structure unexpected:", result);
        showToast("AI could not understand the command. Please try rephrasing.", "error");
      }
    } catch (error) {
      console.error("Error calling Gemini API or parsing response:", error);
      showToast(`Error processing AI command: ${error.message}`, "error", 7000);
    } finally {
      setAiCommandInput('');
    }
  }, [currentDate, dailyScheduleState, dailyCustomSchedules, plannerSchedule, fastingDates, iqamahConfig, showToast, appSettings.geminiApiKey]);

  // --- Iqamah Times Handlers ---
  const handleFetchIqamahTimes = useCallback(async () => {
    if (!appSettings.geminiApiKey) {
      showToast("Please enter your Gemini API Key in Settings to fetch Iqamah times.", "error", 5000);
      return;
    }
    if (!appSettings.location.city || !appSettings.location.country) {
      showToast("Please enter your City and Country in Settings to fetch Iqamah times.", "error", 5000);
      return;
    }

    showToast("Fetching Iqamah times via AI...", "info", 5000);

    const chatHistory = [];
    chatHistory.push({
      role: "user",
      parts: [{
        text: `Provide Iqamah prayer times for ${formatDateToYYYYMMDD(currentDate)} for ${appSettings.location.city}, ${appSettings.location.country}. Respond in JSON format only. If you cannot find exact Iqamah times, provide approximate prayer times (e.g., based on calculated prayer times for the location). If no times can be found, return empty strings for values.
        JSON format: {"fajr": "HH:MM", "dhuhr": "HH:MM", "asr": "HH:MM", "maghrib": "HH:MM", "isha": "HH:MM"}`
      }]
    });

    const payload = { // Renamed from payload2
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            fajr: { type: "STRING" },
            dhuhr: { type: "STRING" },
            asr: { type: "STRING" },
            maghrib: { type: "STRING" },
            isha: { type: "STRING" },
          },
          required: ["fajr", "dhuhr", "asr", "maghrib", "isha"]
        }
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${appSettings.geminiApiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) // Use the local payload
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        if (result.error && result.error.message) {
          errorMessage += `: ${result.error.message}`;
        }
        throw new Error(errorMessage);
      }

      if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0 && result.candidates[0].content.parts[0].text) {
        const jsonString = result.candidates[0].content.parts[0].text;
        const parsedTimes = JSON.parse(jsonString);
        const dateKey = formatDateToYYYYMMDD(currentDate);

        setIqamahConfig(prev => ({
          ...prev,
          manualTimes: {
            ...prev.manualTimes,
            [dateKey]: {
              fajr: parsedTimes.fajr || '',
              dhuhr: parsedTimes.dhuhr || '',
              asr: parsedTimes.asr || '',
              maghrib: parsedTimes.maghrib || '',
              isha: parsedTimes.isha || '',
            }
          }
        }));
        showToast("Iqamah times fetched successfully via AI!", "success");
      } else {
        console.error("AI response structure unexpected for Iqamah times:", result);
        showToast("AI could not retrieve Iqamah times. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error calling Gemini API for Iqamah times:", error);
      showToast(`Failed to fetch Iqamah times via AI: ${error.message}.`, "error");
    }
  }, [appSettings.geminiApiKey, appSettings.location, currentDate, showToast]);


  const handleManualIqamahChange = useCallback((prayer, time) => {
    const dateKey = formatDateToYYYYMMDD(currentDate);
    setIqamahConfig(prev => ({
      ...prev,
      manualTimes: {
        ...prev.manualTimes,
        [dateKey]: {
          ...prev.manualTimes[dateKey],
          [prayer]: time
        }
      }
    }));
  }, [currentDate]);

  const handleClearManualIqamah = useCallback(() => {
    const dateKey = formatDateToYYYYMMDD(currentDate);
    setIqamahConfig(prev => {
      const newManualTimes = { ...prev.manualTimes };
      delete newManualTimes[dateKey];
      return { ...prev, manualTimes: newManualTimes };
    });
    showToast("Manual Iqamah overrides cleared for today.", "info");
  }, [currentDate, showToast]);

  // No auto-fetch on load for AI-based Iqamah times, user explicitly clicks.


  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-inter text-gray-800 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 mb-8 flex flex-col h-full">
          {/* Header and Tabs */}
          <div className="flex justify-between items-center mb-6 border-b pb-4 flex-shrink-0">
            <h1 className="text-3xl font-bold text-indigo-700">{appName} <span className="text-xl text-gray-500">- v1.0.5</span></h1>
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
                onClick={() => setActiveTab('day-planner')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === 'day-planner' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Plus className="inline-block mr-2" size={18} /> Templates
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

              {/* Base Template Selection for Current Day */}
              <div className="flex items-center space-x-2 mb-4">
                  <label htmlFor="baseTemplateSelect" className="block text-sm font-medium text-gray-700">Apply Base Template:</label>
                  <select
                      id="baseTemplateSelect"
                      value={selectedBaseTemplate}
                      onChange={(e) => setSelectedBaseTemplate(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md"
                  >
                      <option value="weekday">Weekday</option>
                      <option value="weekend">Weekend</option>
                      <option value="jumuah">Jumu'ah</option>
                      <option value="fasting">Fasting Day</option>
                  </select>
                  <button
                      onClick={handleApplyTemplateToDailyPlan}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
                      aria-label="Apply selected template"
                  >
                      Apply Template
                  </button>
              </div>

              {/* AI Schedule Refinement Input */}
              <div className="mt-2 p-4 bg-gray-50 rounded-lg shadow-inner mb-6">
                <h3 className="text-xl font-semibold text-indigo-700 mb-2">AI Schedule Refinement</h3>
                <textarea
                  id="aiCommandInput"
                  rows="3"
                  placeholder="e.g., 'Move my morning exercise to 7 AM and make it 45 minutes long' or 'Shift all academic blocks 30 minutes later today'"
                  className="w-full p-2 border border-gray-300 rounded-md mb-2"
                  value={aiCommandInput}
                  onChange={(e) => setAiCommandInput(e.target.value)}
                ></textarea>
                <button
                  onClick={() => refineScheduleWithAI(aiCommandInput)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-700 transition-colors flex items-center"
                  aria-label="Refine schedule with AI"
                >
                  <Play size={18} className="inline-block mr-1" /> Refine with AI
                </button>
              </div>

              {/* Prominent Current/Next Activities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {currentOngoingTask ? (
                      <div
                          onClick={() => scrollToActivity(currentOngoingTask.id)}
                          className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-blue-500 cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                          role="button" tabIndex="0" aria-label={`Scroll to current activity: ${currentOngoingTask.activity}`}
                      >
                          <h5 className="text-md font-bold text-blue-700 flex items-center mb-1">
                              <PlayCircle size={18} className="mr-2" /> Current Activity
                          </h5>
                          <p className="text-lg font-semibold text-gray-800">{currentOngoingTask.activity}</p>
                          <p className="text-sm text-gray-600">{currentOngoingTask.plannedStart} - {currentOngoingTask.plannedEnd}</p>
                          {getAssignedTaskInfo(currentOngoingTask.id) && (
                              <p className="text-xs text-gray-500 mt-1">
                                  Working on: {getAssignedTaskInfo(currentOngoingTask.id).taskName}
                                  {getAssignedTaskInfo(currentOngoingTask.id).subtaskName && ` - ${getAssignedTaskInfo(currentOngoingTask.id).subtaskName}`}
                              </p>
                          )}
                          {getLogForActivity(currentOngoingTask.id)?.actualStart && !getLogForActivity(currentOngoingTask.id)?.actualEnd && (
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                  <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${getProgressBarPercentage(currentOngoingTask.id)}%` }}></div>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-300">
                          <h5 className="text-md font-bold text-gray-600 flex items-center mb-1">
                              <Clock size={18} className="mr-2" /> No Current Activity
                          </h5>
                          <p className="text-sm text-gray-500">Start an activity from the schedule below.</p>
                      </div>
                  )}

                  {nextTask ? (
                      <div
                          onClick={() => scrollToActivity(nextTask.id)}
                          className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-indigo-500 cursor-pointer hover:bg-indigo-50 transition-colors duration-200"
                          role="button" tabIndex="0" aria-label={`Scroll to next scheduled activity: ${nextTask.activity}`}
                      >
                          <h5 className="text-md font-bold text-indigo-700 flex items-center mb-1">
                              <FastForward size={18} className="mr-2" /> Next Scheduled Activity
                          </h5>
                          <p className="text-lg font-semibold text-gray-800">{nextTask.activity}</p>
                          <p className="text-sm text-gray-600">{nextTask.plannedStart} - {nextTask.plannedEnd}</p>
                      </div>
                  ) : (
                      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-300">
                          <h5 className="text-md font-bold text-gray-600 flex items-center mb-1">
                              <FastForward size={18} className="mr-2" /> No Upcoming Activity
                           </h5>
                          <p className="text-sm text-gray-500">Your schedule is clear for now.</p>
                      </div>
                  )}

                  {nextPrayer ? (
                      <div
                          onClick={() => scrollToActivity(nextPrayer.id)}
                          className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-green-500 cursor-pointer hover:bg-green-50 transition-colors duration-200"
                          role="button" tabIndex="0" aria-label={`Scroll to next prayer: ${nextPrayer.activity}`}
                      >
                          <h5 className="text-md font-bold text-green-700 flex items-center mb-1">
                              <BellRing size={18} className="mr-2" /> Next Prayer
                          </h5>
                          <p className="text-lg font-semibold text-gray-800">{nextPrayer.activity}</p>
                          <p className="text-sm text-gray-600">{nextPrayer.plannedStart} - {nextPrayer.plannedEnd}</p>
                      </div>
                  ) : (
                      <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-300">
                          <h5 className="text-md font-bold text-gray-600 flex items-center mb-1">
                              <BellRing size={18} className="mr-2" /> No Upcoming Prayer
                          </h5>
                          <p className="text-sm text-gray-500">All prayers for today are complete or not yet scheduled.</p>
                      </div>
                  )}
              </div>

              {/* Pomodoro Timer Dashboard */}
              <div className={`rounded-lg p-6 mb-6 text-center shadow-lg flex-shrink-0 transition-colors duration-300
                ${pomodoroTimer.mode === 'work' ? 'bg-green-100 border-2 border-green-300' :
                  pomodoroTimer.mode === 'short_break' ? 'bg-blue-100 border-2 border-blue-300' :
                  pomodoroTimer.mode === 'long_break' ? 'bg-purple-100 border-2 border-purple-300' : 'bg-indigo-50 border-2 border-indigo-200'
                }`}
              >
                <h3 className="text-2xl font-bold text-indigo-800 mb-4">Pomodoro Dashboard</h3>

                {/* Main Timer Display - Using SVG for better visualization */}
                <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center rounded-full bg-white shadow-inner">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth="10"
                    />
                    {/* Foreground circle (progress indicator) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={pomodoroTimer.mode === 'work' ? '#4CAF50' : pomodoroTimer.mode === 'short_break' ? '#2196F3' : '#9C27B0'}
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 45} // Circumference
                      strokeDashoffset={2 * Math.PI * 45 * (1 - (pomodoroTimer.timeLeft / Math.max(1, pomodoroTimer.initialTime)))}
                      transform="rotate(-90 50 50)" // Start from the top
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-6xl font-extrabold text-gray-900">
                    {formatTime(pomodoroTimer.timeLeft)}
                  </div>
                </div>

                {/* Pomodoro Status and Linked Activity */}
                <p className={`text-xl mb-4 capitalize font-semibold flex items-center justify-center
                  ${pomodoroTimer.mode === 'work' ? 'text-green-700' :
                    pomodoroTimer.mode === 'short_break' ? 'text-blue-700' :
                    pomodoroTimer.mode === 'long_break' ? 'text-purple-700' : 'text-gray-600'
                  }`}>
                  {pomodoroTimer.mode.replace('_', ' ')} Session
                </p>
                {pomodoroTimer.linkedActivityId && (
                  <p className="text-sm text-gray-700 mb-2">
                    Linked to: <span className="font-bold">
                      {dailyScheduleState.find(a => a.id === pomodoroTimer.linkedActivityId)?.activity || 'N/A'}
                    </span>
                  </p>
                )}
                {getAssignedTaskInfo(pomodoroTimer.linkedActivityId || currentPomodoroBlockId) && (
                  <p className="text-sm text-gray-700 mb-2">
                    Working on: <span className="font-bold">
                      {getAssignedTaskInfo(pomodoroTimer.linkedActivityId || currentPomodoroBlockId).taskName}
                      {getAssignedTaskInfo(pomodoroTimer.linkedActivityId || currentPomodoroBlockId).subtaskName && ` - ${getAssignedTaskInfo(pomodoroTimer.linkedActivityId || currentPomodoroBlockId).subtaskName}`}
                    </span>
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">Pomodoros Completed: {pomodoroTimer.pomodorosCompleted}</p>

                {/* Main Controls */}
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => startPomodoroSession('work', pomodoroSettings.work, currentActivityId)}
                    disabled={pomodoroTimer.running}
                    className="px-4 py-2 rounded-full bg-green-500 text-white shadow-md hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    aria-label="Start Pomodoro Work Session"
                  >
                    <Play size={20} className="mr-2" />
                    {currentActivityId && dailyScheduleState.find(a => a.id === currentActivityId)?.type === 'academic'
                      ? `Start Pomodoro for ${dailyScheduleState.find(a => a.id === currentActivityId)?.activity}`
                      : 'Start Work'}
                  </button>
                  <button
                    onClick={pausePomodoro}
                    disabled={!pomodoroTimer.running}
                    className="px-4 py-2 rounded-full bg-yellow-500 text-white shadow-md hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    aria-label="Pause Pomodoro"
                  >
                    <Pause size={20} className="mr-2" /> Pause
                  </button>
                  <button
                    onClick={resetPomodoro}
                    className="px-4 py-2 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors duration-200 flex items-center"
                    aria-label="Reset Pomodoro"
                  >
                    <RotateCcw size={20} className="mr-2" /> Reset
                  </button>
                </div>

                {/* Manual Break Controls */}
                <div className="mt-4 flex justify-center space-x-2">
                  <button
                    onClick={() => startPomodoroSession('short_break', pomodoroSettings.shortBreak)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm shadow-md hover:bg-blue-600 transition-colors duration-200"
                    aria-label="Start Short Break"
                  >
                    <Square size={14} className="inline-block mr-1" /> Short Break ({pomodoroSettings.shortBreak}m)
                  </button>
                  <button
                    onClick={() => startPomodoroSession('long_break', pomodoroSettings.longBreak)}
                    className="px-3 py-1 bg-purple-500 text-white rounded-md text-sm shadow-md hover:bg-purple-600 transition-colors duration-200"
                    aria-label="Start Long Break"
                  >
                    <Square size={14} className="inline-block mr-1" /> Long Break ({pomodoroSettings.longBreak}m)
                  </button>
                </div>

                {/* Audio Toggle Button */}
                <button
                  onClick={toggleMute}
                  className="mt-6 px-4 py-2 bg-gray-500 text-white rounded-md shadow-md hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center mx-auto"
                  aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
                >
                  {isMuted ? <VolumeX size={20} className="mr-2" /> : <Volume2 size={20} className="mr-2" />}
                  {isMuted ? 'Unmute Sounds' : 'Mute Sounds'}
                </button>
              </div>

              {/* Daily Insights */}
              <div className="mb-6">
                  <h4 className="text-xl font-semibold text-indigo-700 mb-4">Daily Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">
                        Focused Work: <span className="font-bold">{(reportData.totalFocused || 0).toFixed(2)} / {(reportData.totalPlannedFocusedTime || 0).toFixed(2)} hrs</span>
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: `${((reportData.totalFocused || 0) / Math.max((reportData.totalPlannedFocusedTime || 0), 1)) * 100}%`}}></div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">
                        Total Activities: <span className="font-bold">{(reportData.totalActualTimeAllActivities || 0).toFixed(2)} / {(reportData.totalPlannedTimeAllActivities || 0).toFixed(2)} hrs</span>
                      </p>
                       <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: `${((reportData.totalActualTimeAllActivities || 0) / Math.max((reportData.totalPlannedTimeAllActivities || 0), 1)) * 100}%`}}></div>
                      </div>
                    </div>
                  </div>
              </div>

              {/* Add New Activity Button for Daily Schedule */}
              <button
                  onClick={() => handleAddDailyActivity()} // No initial times here, they come from double-click
                  className="mb-4 px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center self-start"
                  aria-label="Add New Activity to Daily Plan"
              >
                  <Plus size={20} className="mr-2" /> Add New Activity to Daily Plan
              </button>

              {/* Schedule View Toggle Buttons */}
              <div className="flex justify-center space-x-4 mb-4">
                  <button
                      onClick={() => setScheduleViewMode('calendar')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          scheduleViewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                      <CalendarDays className="inline-block mr-2" size={18} /> Calendar View
                  </button>
                  <button
                      onClick={() => setScheduleViewMode('list')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          scheduleViewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                      <BarChart2 className="inline-block mr-2" /> List View
                  </button>
              </div>

              {/* Conditional Rendering for Schedule Views */}
              {scheduleViewMode === 'calendar' && (
                <>
                  {/* Visual Planner Timeline for Daily Editor (Now in Schedule Tab) */}
                  <div
                    ref={plannerTimelineRef}
                    className="relative w-full h-[2880px] bg-gray-50 rounded-lg shadow-inner overflow-y-auto border-4 border-gray-900 mb-6"
                    onDoubleClick={(e) => {
                      // Check if the double-click occurred directly on the timeline (not on an activity block)
                      // This is implicitly handled by stopping propagation in activity blocks.
                      const timelineRect = plannerTimelineRef.current.getBoundingClientRect();
                      const relativeY = e.clientY - timelineRect.top;
                      const minutesFromMidnight = (relativeY / timelineRect.clientHeight) * 1440;
                      const snappedMinutes = Math.round(minutesFromMidnight / 15) * 15; // Snap to nearest 15 minutes

                      const newActivityStart = minutesToTime(snappedMinutes);
                      const newActivityEndMinutes = (snappedMinutes + 30) % 1440; // Default 30 minutes duration
                      const newActivityEnd = minutesToTime(newActivityEndMinutes);

                      handleAddDailyActivity(newActivityStart, newActivityEnd);
                    }}
                  >
                    {/* Time Grid Lines and Labels */}
                    {[...Array(25)].map((_, hour) => (
                        <React.Fragment key={hour}>
                        <div
                            className="absolute left-0 w-full border-t border-gray-200 text-xs text-gray-500 pl-2"
                            style={{ top: `${(hour / 24) * 100}%`, height: '1px' }}
                        >
                            <span className="-translate-y-1/2 block text-sm font-semibold">{hour.toString().padStart(2, '0')}:00</span>
                        </div>
                        {hour < 24 && (
                            <>
                            <div
                                className="absolute left-0 w-full border-t border-gray-100 text-xs text-gray-400 pl-2"
                                style={{ top: `${(hour / 24) * 100 + (30 / 1440) * 100}%`, height: '1px' }}
                            >
                                <span className="-translate-y-1/2 block text-xs">{hour.toString().padStart(2, '0')}:30</span>
                            </div>
                            </>
                        )}
                        </React.Fragment>
                    ))}

                    {/* "Now" Indicator Line */}
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 transition-all duration-1000 ease-linear"
                      style={{ top: `${nowIndicatorTop}px` }}
                    >
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                      <span className="absolute left-4 -top-2 text-xs text-red-700 font-bold">Now</span>
                    </div>

                    {/* Activity Blocks for Daily Editor */}
                    {dailyScheduleState.sort((a,b) => timeToMinutes(a.plannedStart) - timeToMinutes(b.plannedStart)).map(activity => {
                        const { top, height } = calculateBlockStyles(activity);
                        const activityNameLower = activity.activity.toLowerCase();
                        const timeGroup = getTimeOfDayGroup(activity.plannedStart);
                        const isPrayerBlock = activityNameLower.includes('iqamah & prayer') || activityNameLower.includes('prayer');

                        let bgColor = '';
                        if (isPrayerBlock) {
                          bgColor = 'bg-green-50';
                        } else if (timeGroup === 'night') {
                          bgColor = 'bg-gray-100';
                        } else if (timeGroup === 'morning') {
                          bgColor = 'bg-sky-50';
                        } else if (timeGroup === 'afternoon') {
                          bgColor = 'bg-teal-50';
                        } else if (timeGroup === 'evening') {
                          bgColor = 'bg-purple-50';
                        } else {
                          bgColor = 'bg-white'; // Default fallback
                        }


                        return (
                        <div
                            key={activity.id}
                            className={`absolute left-16 right-2 rounded-md p-2 shadow-sm flex flex-col justify-center
                            ${bgColor}
                            ${activity.id === currentActivityId ? 'border-l-4 border-indigo-600' : 'border-l-2 border-transparent'}
                            ${draggingActivity?.id === activity.id || resizingActivity?.id === activity.id ? 'z-20 border-2 border-indigo-500' : 'z-10'}
                            group // Add group class for hover effects
                            border border-gray-300 hover:shadow-md transition-shadow duration-150
                            `}
                            style={{ top, height }}
                            onDoubleClick={(e) => { // Double-click to edit
                                e.stopPropagation(); // Prevent parent's onDoubleClick from firing
                                handleEditDailyActivity(activity);
                            }}
                            onMouseDown={(e) => { // Integrated drag/resize logic
                                const element = e.currentTarget;
                                const rect = element.getBoundingClientRect();
                                const offsetY = e.clientY - rect.top; // Mouse Y relative to element top
                                const clientHeight = rect.height;

                                const resizeThreshold = 10; // Pixels from top/bottom edge to trigger resize

                                if (offsetY < resizeThreshold) {
                                    handleMouseDown(e, activity.id, 'top'); // Resizing from top
                                } else if (offsetY > clientHeight - resizeThreshold) {
                                    handleMouseDown(e, activity.id, 'bottom'); // Resizing from bottom
                                } else {
                                    handleMouseDown(e, activity.id, 'move'); // Moving the block
                                }
                            }}
                            title={`${activity.activity} (${activity.plannedStart} - ${activity.plannedEnd})`}
                        >
                            <span className={`text-sm text-gray-800 truncate whitespace-nowrap overflow-hidden text-ellipsis ${isPrayerBlock ? 'font-bold' : 'font-normal'}`}>{`${activity.activity} (${activity.plannedStart} - ${activity.plannedEnd})`}</span>
                            {/* Visual indicators for resize areas (optional, but good for UX) */}
                            <div className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity duration-100"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity duration-100"></div>
                        </div>
                        );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-4 mb-6">Double-click an activity to edit details. Drag activities to adjust their times. Drag top/bottom edges to resize. Double-click on empty space to add a new activity. Changes here only affect this specific day.</p>
                </>
              )}

              {scheduleViewMode === 'list' && (
                <>
                  {/* Scrollable Schedule Table (Detailed View) */}
                  <div className="overflow-y-auto flex-grow relative" ref={scheduleTableRef}>
                    <table className="min-w-full bg-white rounded-lg shadow-md">
                      {/* Ref for thead to calculate "Now" line offset */}
                      <thead className="bg-indigo-100 sticky top-0 z-10" ref={theadRef}>
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
                                const isSubdividedBlock = (activity.type === 'academic' || activity.originalActivityId?.includes('flexible-afternoon')) && activity.id.includes('-part');
                                const currentActivityNotes = subTaskDetails[activity.id] || '';
                                const timeGroup = getTimeOfDayGroup(activity.plannedStart);
                                const activityNameLower = activity.activity.toLowerCase();
                                const isPrayerBlock = activityNameLower.includes('iqamah & prayer') || activityNameLower.includes('prayer');

                                let status = '';
                                let statusIcon = null;
                                const now = new Date();
                                const plannedStart = parseTime(activity.plannedStart, currentDate);
                                const plannedEnd = parseTime(activity.plannedEnd, currentDate);
                                let activityEndToday = new Date(plannedEnd);
                                if (plannedEnd < plannedStart) {
                                  activityEndToday.setDate(activityEndToday.getDate() + 1);
                                }

                                let statusColor = '';
                                if (log?.actualEnd) {
                                  status = 'Completed'; statusIcon = <CheckCircle size={14} className="inline-block mr-1" />; statusColor = 'text-green-600';
                                } else if (log?.actualStart && !log?.actualEnd) {
                                  status = 'Started'; statusIcon = <PlayCircle size={14} className="inline-block mr-1" />; statusColor = 'text-blue-600';
                                } else if (now > activityEndToday && !log?.actualEnd) {
                                  status = 'Overdue'; statusIcon = <AlertCircle size={14} className="inline-block mr-1" />; statusColor = 'text-red-600';
                                } else {
                                  status = 'Scheduled'; statusIcon = <Clock size={14} className="inline-block mr-1" />; statusColor = 'text-gray-500';
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
                                          timeGroup === 'morning' ? 'bg-sky-50' : // Updated from early-morning
                                          timeGroup === 'afternoon' ? 'bg-teal-50' : // Midday is now afternoon
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
                                      {(activity.type === 'academic' || activity.originalActivityId?.includes('flexible-afternoon')) && (
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
                                              value={currentActivityNotes}
                                              onChange={(e) => handleActivityNotesChange(activity.id, e.target.value)}
                                              onBlur={() => handleActivityNotesBlur(activity.id)}
                                              onKeyDown={(e) => handleActivityNotesKeyDown(e, activity.id)}
                                              className="border-b border-indigo-400 focus:outline-none focus:border-indigo-600 text-sm bg-transparent w-full"
                                              autoFocus
                                              aria-label={`Edit activity notes for ${activity.activity}`}
                                            />
                                          ) : (
                                            <span
                                              onClick={() => setEditingSubTaskId(activity.id)}
                                              className="cursor-pointer hover:text-indigo-700 italic"
                                              role="button" tabIndex="0" aria-label={`Add or edit activity notes for ${activity.activity}`}
                                            >
                                              {currentActivityNotes || 'Click to add activity notes'}
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
                                      {editingActualTimeLogId === log?.id ? (
                                        <input
                                          type="time"
                                          value={log?.actualStart ? formatTo24HourTime(new Date(log.actualStart)) : ''}
                                          onChange={(e) => handleActualTimeChange(log.id, 'start', e.target.value)}
                                          className="w-28 p-1 border border-gray-300 rounded-md text-xs"
                                        />
                                      ) : (
                                        <span onDoubleClick={() => log?.id && setEditingActualTimeLogId(log.id)}>
                                          {formatDateTime(log?.actualStart)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {editingActualTimeLogId === log?.id ? (
                                        <input
                                          type="time"
                                          value={log?.actualEnd ? formatTo24HourTime(new Date(log.actualEnd)) : ''}
                                          onChange={(e) => handleActualTimeChange(log.id, 'end', e.target.value)}
                                          className="w-28 p-1 border border-gray-300 rounded-md text-xs"
                                        />
                                      ) : (
                                        <span onDoubleClick={() => log?.id && setEditingActualTimeLogId(log.id)}>
                                          {formatDateTime(log?.actualEnd)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{actualDuration > 0 ? `${actualDuration.toFixed(2)} hrs` : '-'}</td>
                                    <td className="py-3 px-4 text-sm">
                                      <div className="flex space-x-2">
                                        {editingActualTimeLogId === log?.id ? (
                                          <>
                                            <button
                                              onClick={() => setEditingActualTimeLogId(null)}
                                              className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors duration-200"
                                              aria-label={`Save actual times for ${activity.activity}`}
                                            >
                                              <Save size={14} className="inline-block mr-1" /> Save
                                            </button>
                                            <button
                                              onClick={() => setEditingActualTimeLogId(null)} // Simply exit edit mode
                                              className="px-3 py-1 bg-gray-500 text-white rounded-md text-xs font-medium hover:bg-gray-600 transition-colors duration-200"
                                              aria-label={`Cancel editing actual times for ${activity.activity}`}
                                            >
                                              <X size={14} className="inline-block mr-1" /> Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <>
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
                                            {(activity.type === 'academic' || activity.originalActivityId?.includes('flexible-afternoon')) && (
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
                                          </>
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
                </>
              )}
            </div>
          )}

          {/* Day Planner Tab (Now Template Editor) */}
          {activeTab === 'day-planner' && (
            <div className="flex-grow flex flex-col">
              <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Manage Schedule Templates</h2>
              <p className="text-gray-600 mb-4">
                Edit your recurring daily, weekend, Jumu'ah, and fasting day templates here. These templates can be applied to any specific day in the Schedule tab.
              </p>

              {/* Day Type Selector Buttons for Templates */}
              <div className="flex flex-wrap gap-2 mb-4">
              {['weekday', 'weekend', 'jumuah', 'fasting'].map(type => (
                  <button
                  key={type}
                  onClick={() => setActivePlannerDayType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 capitalize ${
                      activePlannerDayType === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  >
                  {type.replace('-', ' ')}
                  </button>
              ))}
              </div>

              <button
              onClick={handleAddTemplateActivity}
              className="mb-4 px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center self-start"
              aria-label="Add New Activity to Template"
              >
              <Plus size={20} className="mr-2" /> Add New Activity to {activePlannerDayType.replace('-', ' ')} Template
              </button>

              {/* Quick Reference Activity List for Current Day Type */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6 shadow-inner">
              <h3 className="text-lg font-semibold text-indigo-700 mb-2 capitalize">
                  {activePlannerDayType.replace('-', ' ')} Activities Overview
              </h3>
              {plannerSchedule[activePlannerDayType] && plannerSchedule[activePlannerDayType].length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plannerSchedule[activePlannerDayType]
                      .sort((a, b) => timeToMinutes(a.plannedStart) - timeToMinutes(b.plannedStart))
                      .map(activity => (
                      <li key={activity.id} className="bg-white p-3 rounded-md shadow-sm flex items-center justify-between">
                          <div>
                          <p className="font-medium text-gray-800">{activity.activity}</p>
                          <p className="text-xs text-gray-600">
                              {activity.plannedStart} - {activity.plannedEnd} | Type: {activity.type} | Recurrence: {activity.recurrenceType}
                              {activity.recurrenceType === 'weekly' && ` (${activity.recurrenceDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')})`}
                              | Constraint: {activity.constraintType}
                          </p>
                          </div>
                          <div className="flex space-x-1">
                          <button
                              onClick={() => handleEditTemplateActivity(activity)}
                              className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                              aria-label={`Edit ${activity.activity}`}
                          >
                              <Edit size={16} />
                          </button>
                          <button
                              onClick={() => handleDeleteTemplateActivity(activity.id)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              aria-label={`Delete ${activity.activity}`}
                          >
                              <Trash2 size={16} />
                          </button>
                          </div>
                      </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-sm text-gray-500">No activities defined for this day type yet. Click "Add New Activity" to start!</p>
              )}
              </div>


              {/* Visual Planner Timeline for Templates */}
              <div ref={plannerTimelineRef} className="relative w-full h-[2880px] bg-gray-50 rounded-lg shadow-inner overflow-y-auto border border-gray-200">
              {/* Time Grid Lines and Labels */}
              {[...Array(25)].map((_, hour) => (
                  <React.Fragment key={hour}>
                  <div
                      className="absolute left-0 w-full border-t border-gray-200 text-xs text-gray-500 pl-2"
                      style={{ top: `${(hour / 24) * 100}%`, height: '1px' }}
                  >
                      <span className="-translate-y-1/2 block text-sm font-semibold">{hour.toString().padStart(2, '0')}:00</span>
                  </div>
                  {hour < 24 && (
                      <>
                      <div
                          className="absolute left-0 w-full border-t border-gray-100 text-xs text-gray-400 pl-2"
                          style={{ top: `${(hour / 24) * 100 + (30 / 1440) * 100}%`, height: '1px' }}
                      >
                          <span className="-translate-y-1/2 block text-xs">{hour.toString().padStart(2, '0')}:30</span>
                      </div>
                      </>
                  )}
                  </React.Fragment>
              ))}

              {/* Activity Blocks */}
              {plannerSchedule[activePlannerDayType] && plannerSchedule[activePlannerDayType].sort((a,b) => timeToMinutes(a.plannedStart) - timeToMinutes(b.plannedStart)).map(activity => {
                  const { top, height } = calculateBlockStyles(activity);
                  const activityNameLower = activity.activity.toLowerCase();
                  const timeGroup = getTimeOfDayGroup(activity.plannedStart);
                  const isPrayerBlock = activityNameLower.includes('iqamah & prayer') || activityNameLower.includes('prayer');

                  let bgColor = '';
                  if (isPrayerBlock) {
                    bgColor = 'bg-green-50';
                  } else if (timeGroup === 'night') {
                    bgColor = 'bg-gray-100';
                  } else if (timeGroup === 'morning') {
                    bgColor = 'bg-sky-50';
                  } else if (timeGroup === 'afternoon') {
                    bgColor = 'bg-teal-50';
                  } else if (timeGroup === 'evening') {
                    bgColor = 'bg-purple-50';
                  } else {
                    bgColor = 'bg-white'; // Default fallback
                  }


                  return (
                  <div
                      key={activity.id}
                      className={`absolute left-16 right-2 rounded-md p-2 shadow-sm flex flex-col justify-center
                      ${bgColor}
                      ${draggingActivity?.id === activity.id || resizingActivity?.id === activity.id ? 'z-20 border-2 border-indigo-500' : 'z-10'}
                      group // Add group class for hover effects
                      `}
                      style={{ top, height }}
                      onDoubleClick={() => handleEditTemplateActivity(activity)} // Double-click to edit
                      onMouseDown={(e) => { // Integrated drag/resize logic
                          const element = e.currentTarget;
                          const rect = element.getBoundingClientRect();
                          const offsetY = e.clientY - rect.top; // Mouse Y relative to element top
                          const clientHeight = rect.height;

                          const resizeThreshold = 10; // Pixels from top/bottom edge to trigger resize

                          if (offsetY < resizeThreshold) {
                              handleMouseDown(e, activity.id, 'top'); // Resizing from top
                          } else if (offsetY > clientHeight - resizeThreshold) {
                              handleMouseDown(e, activity.id, 'bottom'); // Resizing from bottom
                          } else {
                              handleMouseDown(e, activity.id, 'move'); // Moving the block
                          }
                      }}
                      title={`${activity.activity} (${activity.plannedStart} - ${activity.plannedEnd})`}
                  >
                      <span className={`text-sm text-gray-800 truncate whitespace-nowrap overflow-hidden text-ellipsis ${isPrayerBlock ? 'font-bold' : 'font-normal'}`}>{activity.activity}</span>
                      <span className="text-xs text-gray-600 truncate whitespace-nowrap overflow-hidden text-ellipsis">{activity.plannedStart} - {activity.plannedEnd}</span>
                      {/* Visual indicators for resize areas (optional, but good for UX) */}
                      <div className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity duration-100"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity duration-100"></div>
                  </div>
                  );
              })}
              </div>

              <p className="text-sm text-gray-500 mt-4">Double-click an activity to edit details. Drag activities to adjust their times. Drag top/bottom edges to resize.</p>
            </div>
          )}

          {/* Tasks Tab */}
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
                  onClick={() => setTaskViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      taskViewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <BarChart2 size={18} className="inline-block mr-2" /> List View
                </button>
                <button
                  onClick={() => setTaskViewMode('eisenhower')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      taskViewMode === 'eisenhower' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <BarChart2 size={18} className="inline-block mr-2" /> Eisenhower Matrix
                </button>
                <button
                  onClick={() => setTaskViewMode('gantt')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      taskViewMode === 'gantt' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <CalendarDays size={18} className="inline-block mr-2" /> Gantt Chart
                </button>
              </div>

              {taskViewMode === 'list' && (
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
                        let taskStatus = task.status;
                        const today = new Date();
                        today.setHours(0,0,0,0);

                        const deadline = task.deadlineDate ? new Date(task.deadlineDate) : null;
                        if (deadline) deadline.setHours(0,0,0,0);

                        const targetStart = task.targetStartDate ? new Date(task.targetStartDate) : null;
                        if (targetStart) targetStart.setHours(0,0,0,0);

                        if (task.actualCompletionDate) { taskStatus = 'completed'; }
                        else if (deadline && today > deadline && task.status !== 'completed') { taskStatus = 'overdue'; }
                        else if (task.status === 'pending' && targetStart && today >= targetStart) { taskStatus = 'in-progress'; }

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
                                {taskStatus.replace('-', ' ')}.
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

              {taskViewMode === 'eisenhower' && (
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
              )}

              {taskViewMode === 'gantt' && (
                <GanttChart projectTasks={projectTasks} />
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
                <p className="text-lg text-gray-700">
                  Total Actual Time (All Activities):{' '}
                  <span className="font-bold">{(reportData.totalActualTimeAllActivities || 0).toFixed(2)} hours</span>
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(reportData.summary).map(([type, data]) => (
                    <div key={type} className="bg-white p-3 rounded-lg shadow-sm">
                      <h4 className="font-semibold text-indigo-600 capitalize">{type} Activities</h4>
                      <p className="text-sm text-gray-600">Planned: {(data.planned || 0).toFixed(2)} hrs</p>
                      <p className="text-sm text-gray-600">Actual: {(data.actual || 0).toFixed(2)} hrs</p>
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
                        <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Activity Notes</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Actual Start</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700">Actual End</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-indigo-700 rounded-tr-lg">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(reportData.summary).flatMap(s => s.activities).sort((a,b) => new Date(a.actualStart) - new Date(b.actualStart)).map((log, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-700">{log.activity}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{log.activityNotes || '-'}</td>
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
              <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Settings</h2>

              {/* Pomodoro Settings */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6 shadow-inner">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4">Pomodoro Settings</h3>
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
                  <div>
                    <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">Activity Reminder (minutes before)</label>
                    <input
                      type="number"
                      id="reminderTime"
                      name="reminderTime"
                      value={pomodoroSettings.reminderTime}
                      onChange={handlePomodoroSettingChange}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">Changes are saved automatically.</p>
              </div>

              {/* Gemini API Key Setting */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6 shadow-inner">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4">AI Assistant Settings</h3>
                <div>
                  <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700">Gemini API Key</label>
                  <input
                    type="password" // Use password type for security
                    id="geminiApiKey"
                    value={appSettings.geminiApiKey}
                    onChange={(e) => setAppSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter your Gemini API Key here"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is saved locally in your browser and is not sent to any server.
                    Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                  </p>
                </div>
              </div>

              {/* Iqamah Times Settings */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6 shadow-inner">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4">Iqamah Times Settings (AI Powered)</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="locationCity" className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      id="locationCity"
                      value={appSettings.location.city}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      placeholder="e.g., London"
                    />
                  </div>
                  <div>
                    <label htmlFor="locationCountry" className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      id="locationCountry"
                      value={appSettings.location.country}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, location: { ...prev.location, country: e.target.value } }))}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      placeholder="e.g., UK"
                    />
                  </div>
                  <button
                    onClick={handleFetchIqamahTimes}
                    disabled={!appSettings.geminiApiKey || !appSettings.location.city || !appSettings.location.country}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Fetch Iqamah Times Now (via AI)
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-2">Manual Iqamah Overrides (for current day)</h4>
                  <p className="text-sm text-gray-500 mb-2">Override times for {currentDate.toLocaleDateString()}.</p>
                  {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(prayer => (
                    <div key={prayer} className="flex items-center mb-2">
                      <label htmlFor={`${prayer}-iqamah`} className="w-24 text-sm font-medium text-gray-700 capitalize">{prayer}</label>
                      <input
                        type="time"
                        id={`${prayer}-iqamah`}
                        value={iqamahConfig.manualTimes[formatDateToYYYYMMDD(currentDate)]?.[prayer] || ''}
                        onChange={(e) => handleManualIqamahChange(prayer, e.target.value)}
                        className="ml-2 p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleClearManualIqamah}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition-colors"
                  >
                    Clear Manual Overrides for Today
                  </button>
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-indigo-50 rounded-lg p-4 shadow-inner">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4">Data Management</h3>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Export Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {Object.keys(dataManagementOptions.export).map(key => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={dataManagementOptions.export[key]}
                          onChange={(e) => handleDataOptionChange('export', key, e.target.checked)}
                          className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        />
                        <span className="ml-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleExportData}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
                  >
                    <Download size={20} className="mr-2" /> Export Selected Data
                  </button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Import Data</h4>
                  <p className="text-sm text-red-600 mb-2">Warning: Importing data will overwrite existing data for selected categories.</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {Object.keys(dataManagementOptions.import).map(key => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={dataManagementOptions.import[key]}
                          onChange={(e) => handleDataOptionChange('import', key, e.target.checked)}
                          className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        />
                        <span className="ml-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="mt-4 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <footer className="text-gray-600 text-sm mt-8 flex-shrink-0">
          Built with React and Tailwind CSS. Data saved in browser's local storage.
        </footer>

        {/* Activity Modal (Renamed from PlannerModal) */}
        {isActivityModalOpen && (
          <ActivityModal
            onClose={handleCancelEdit}
            onSave={isEditingDailySchedule ? handleSaveDailyActivity : handleSaveTemplateActivity}
            editingActivity={editingActivity}
            isEditingDailySchedule={isEditingDailySchedule} // Pass this prop to the modal
          />
        )}

        {/* Task Modal */}
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
                {editingTask && !editingTask.isNew && (
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
                          e.target.value = '';
                        }
                      }}
                      className="flex-grow p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('newSubtaskName');
                        if (input.value.trim()) {
                          handleAddSubtask(editingTask.id, input.value.trim());
                          input.value = '';
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

        {/* Assign Task to Schedule Modal */}
        {isAssignTaskModalOpen && (
          <AssignTaskModal
            onClose={() => {
              setIsAssignTaskModal(false);
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

        {/* Activity Reminder Modal */}
        {showReminderModal && reminderActivity && (
          <ActivityReminderModal
            activity={reminderActivity}
            onClose={() => setShowReminderModal(false)}
          />
        )}

        {/* Pomodoro Alert Modal */}
        {pomodoroTimer.showAlert && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center relative">
              <button
                onClick={() => setPomodoroTimer(prev => ({ ...prev, showAlert: false }))}
                className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Close alert"
              >
                <X size={20} />
              </button>
              <BellRing size={48} className="mx-auto text-yellow-500 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-indigo-700 mb-2">Pomodoro Alert!</h3>
              <p className="text-lg text-gray-800 mb-4">
                {pomodoroTimer.alertMessage}
              </p>
              <div className="flex justify-center space-x-4 mt-6">
                {pomodoroTimer.nextMode && pomodoroTimer.nextTimeLeft > 0 && (
                  <button
                    onClick={continuePomodoro}
                    className="px-6 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors"
                  >
                    Continue to {pomodoroTimer.nextMode.replace('_', ' ')}
                  </button>
                )}
                {pomodoroTimer.mode !== 'work' && (
                  <button
                    onClick={skipBreak}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
                  >
                    Skip Break
                  </button>
                )}
                <button
                  onClick={endPomodoroSession}
                  className="px-6 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <ConfirmationModal
            message={confirmationMessage}
            onConfirm={confirmationCallback.current}
            onCancel={() => setShowConfirmationModal(false)}
          />
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

// ActivityModal Component (Renamed from PlannerModal)
const ActivityModal = ({ onClose, onSave, editingActivity, isEditingDailySchedule }) => {
  const [activity, setActivity] = useState(editingActivity || {
    id: `new-${Date.now()}`, activity: '', plannedStart: '09:00', plannedEnd: '10:00',
    type: 'personal', recurrenceType: 'none', recurrenceDays: [], constraintType: 'adjustable', isNew: true,
  });

  const handleSave = () => {
    onSave(activity);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-semibold text-indigo-700 mb-4">
          {activity?.isNew ? 'Add New Activity' : 'Edit Activity'}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="activityName" className="block text-sm font-medium text-gray-700">Activity Name</label>
            <input
              type="text"
              id="activityName"
              value={activity?.activity || ''}
              onChange={(e) => setActivity(prev => ({ ...prev, activity: e.target.value }))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="plannedStart" className="block text-sm font-medium text-gray-700">Planned Start (HH:MM)</label>
            <input
              type="time"
              id="plannedStart"
              value={activity?.plannedStart || '09:00'}
              onChange={(e) => setActivity(prev => ({ ...prev, plannedStart: e.target.value }))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="plannedEnd" className="block text-sm font-medium text-gray-700">Planned End (HH:MM)</label>
            <input
              type="time"
              id="plannedEnd"
              value={activity?.plannedEnd || '10:00'}
              onChange={(e) => setActivity(prev => ({ ...prev, plannedEnd: e.target.value }))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">Type</label>
            <select
              id="activityType"
              value={activity?.type || 'personal'}
              onChange={(e) => setActivity(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="personal">Personal</option>
              <option value="academic">Academic</option>
              <option value="spiritual">Spiritual</option>
              <option value="physical">Physical</option>
            </select>
          </div>
          {!isEditingDailySchedule && ( // Only show recurrence for template editing
            <div>
              <label htmlFor="recurrenceType" className="block text-sm font-medium text-gray-700">Recurrence</label>
              <select
                id="recurrenceType"
                value={activity?.recurrenceType || 'none'}
                onChange={(e) => setActivity(prev => ({ ...prev, recurrenceType: e.target.value, recurrenceDays: e.target.value === 'daily' ? [] : prev.recurrenceDays }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}
          {!isEditingDailySchedule && activity?.recurrenceType === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Repeat on</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activity.recurrenceDays.includes(index)}
                      onChange={(e) => {
                        const newRecurrenceDays = e.target.checked
                          ? [...activity.recurrenceDays, index]
                          : activity.recurrenceDays.filter(d => d !== index);
                        setActivity(prev => ({ ...prev, recurrenceDays: newRecurrenceDays.sort((a,b) => a-b) }));
                      }}
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label htmlFor="constraintType" className="block text-sm font-medium text-gray-700">Constraint Type</label>
            <select
              id="constraintType"
              value={activity?.constraintType || 'adjustable'}
              onChange={(e) => setActivity(prev => ({ ...prev, constraintType: e.target.value }))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="hard">Hard (Non-negotiable)</option>
              <option value="adjustable">Adjustable (Can be shifted/shrunk)</option>
              <option value="removable">Removable (Can be deleted in conflict)</option>
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
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Save size={18} className="inline-block mr-1" /> Save Activity
          </button>
        </div>
      </div>
    </div>
  );
};

// AssignTaskModal Component (kept here for single-file output)
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
    activity.type === 'academic' || activity.originalActivityId?.includes('flexible-afternoon')
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
                  setSelectedSubtask(null);
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

// GanttChart Component
const GanttChart = ({ projectTasks }) => {
  const chartRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);

  // Determine the overall date range for the chart
  const allDates = projectTasks.flatMap(task => [
    task.targetStartDate,
    task.deadlineDate,
    task.actualCompletionDate,
  ]).filter(Boolean).map(d => new Date(d));

  let minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date();
  let maxDate = allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date();

  // Adjust minDate to start of the month for better alignment
  minDate.setDate(1);
  minDate.setHours(0,0,0,0);

  // Add some padding to the date range (e.g., one month before and after)
  minDate.setMonth(minDate.getMonth() - 1);
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setDate(0); // Last day of previous month
  maxDate.setHours(23,59,59,999);


  const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

  useEffect(() => {
    const updateWidth = () => {
      if (chartRef.current) {
        setChartWidth(chartRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const pixelsPerDay = chartWidth / totalDays;

  const getPositionAndWidth = (startDateStr, endDateStr) => {
    if (!startDateStr) return { left: 0, width: 0 };

    const startDate = new Date(startDateStr);
    let endDate = endDateStr ? new Date(endDateStr) : new Date(); // If no end, extends to today

    // Ensure dates are just dates, not times
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999); // End of day

    const startOffsetDays = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const left = startOffsetDays * pixelsPerDay;
    const width = durationDays * pixelsPerDay;
    return { left, width: Math.max(width, 1) }; // Ensure minimum width of 1px
  };

  // Generate month labels
  const monthLabels = [];
  let currentMonth = new Date(minDate);
  while (currentMonth <= maxDate) {
    monthLabels.push({
      date: new Date(currentMonth),
      left: ((currentMonth.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay,
    });
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
      <h3 className="text-xl font-semibold text-indigo-700 mb-4">Project Gantt Chart</h3>
      <div className="relative border border-gray-200 rounded-md" ref={chartRef} style={{ minWidth: '800px', height: 'auto' }}>
        {/* Month Grid */}
        {monthLabels.map((month, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 border-l border-gray-300 text-xs text-gray-500 pt-1 px-2"
            style={{ left: `${month.left}px` }}
          >
            {month.date.toLocaleString('en-US', { month: 'short', year: '2-digit' })}
          </div>
        ))}
        {/* Today Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${((new Date().setHours(0,0,0,0) - minDate.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay}px` }}
        >
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-red-700 font-bold">Today</span>
        </div>

        {/* Task Rows */}
        <div className="pt-10 pb-4"> {/* Padding for month labels */}
          {projectTasks.map((task) => {
            const planned = getPositionAndWidth(task.targetStartDate, task.deadlineDate);
            const actual = getPositionAndWidth(task.targetStartDate, task.actualCompletionDate || formatDateToYYYYMMDD(new Date())); // Actual ends today if not completed

            return (
              <div key={task.id} className="relative h-12 mb-2">
                <div className="absolute left-0 w-32 text-sm font-medium text-gray-700 truncate pr-2" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                  {task.name}
                </div>
                <div className="ml-36 relative h-full">
                  {planned.width > 0 && (
                    <div
                      className="absolute h-4 bg-blue-300 rounded-sm opacity-75"
                      style={{ left: `${planned.left}px`, width: `${planned.width}px`, top: '0%' }}
                      title={`Planned: ${task.targetStartDate || 'N/A'} to ${task.deadlineDate || 'N/A'}`}
                    ></div>
                  )}
                  {actual.width > 0 && (
                    <div
                      className={`absolute h-4 rounded-sm
                        ${task.actualCompletionDate ? 'bg-green-500' : 'bg-yellow-500'}
                      `}
                      style={{ left: `${actual.left}px`, width: `${actual.width}px`, top: '50%', transform: 'translateY(-50%)' }}
                      title={`Actual: ${task.targetStartDate || 'N/A'} to ${task.actualCompletionDate || 'Today'}`}
                    ></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Blue bars represent planned timelines. Green bars represent completed actual timelines. Yellow bars represent ongoing actual timelines.
      </p>
    </div>
  );
};
export default App;

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
// --- AI Suggestion Review Modal Component ---
const AISuggestionReviewModal = ({ suggestions, onApply, onCancel }) => {
  const [editableSuggestions, setEditableSuggestions] = useState(suggestions);

  const handleInputChange = (index, field, value) => {
    setEditableSuggestions(prev => {
      const newSuggestions = [...prev];
      newSuggestions[index] = { ...newSuggestions[index], [field]: value };
      return newSuggestions;
    });
  };

  const handleDeleteSuggestion = (index) => {
    setEditableSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl relative">
        <h3 className="text-2xl font-bold text-indigo-700 mb-4">Review AI Suggestions</h3>
        <p className="text-sm text-gray-700 mb-4">
          The AI has suggested the following changes to your schedule. You can modify or remove suggestions before applying.
        </p>

        {editableSuggestions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No suggestions to review.</p>
        ) : (
          <div className="overflow-x-auto mb-6 border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original ID (if modify/delete)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th> {/* For delete button */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editableSuggestions.map((sug, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${sug.action === 'add_activity' ? 'bg-green-100 text-green-800' :
                           sug.action === 'modify_activity' ? 'bg-blue-100 text-blue-800' :
                           sug.action === 'delete_activity' ? 'bg-red-100 text-red-800' :
                           sug.action === 'shift_activities' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}
                      `}>
                        {sug.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="text"
                        value={sug.activityName || ''}
                        onChange={(e) => handleInputChange(index, 'activityName', e.target.value)}
                        className="w-full border-b border-gray-300 focus:border-indigo-500 outline-none"
                        disabled={sug.action === 'delete_activity' || sug.action === 'shift_activities'}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="time"
                        value={sug.newPlannedStart || ''}
                        onChange={(e) => handleInputChange(index, 'newPlannedStart', e.target.value)}
                        className="w-24 border-b border-gray-300 focus:border-indigo-500 outline-none"
                        disabled={sug.action === 'delete_activity'}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="time"
                        value={sug.newPlannedEnd || ''}
                        onChange={(e) => handleInputChange(index, 'newPlannedEnd', e.target.value)}
                        className="w-24 border-b border-gray-300 focus:border-indigo-500 outline-none"
                        disabled={sug.action === 'delete_activity'}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="text"
                        value={sug.originalActivityId || ''}
                        onChange={(e) => handleInputChange(index, 'originalActivityId', e.target.value)}
                        className="w-full border-b border-gray-300 focus:border-indigo-500 outline-none text-xs"
                        disabled={sug.action === 'add_activity'}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSuggestion(index)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="Delete suggestion"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(editableSuggestions)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 transition-colors"
            disabled={editableSuggestions.length === 0}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
function App() {
  const appName = "My Daily Rhythm"; // Define the app name here
    // NEW STATES for AI Suggestion Review
  const [aiSuggestedChanges, setAiSuggestedChanges] = useState([]);
  const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);

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
      return savedSettings ? JSON.parse(savedSettings) : { geminiApiKey: '', location: { city: '', country: '' } , iqamahUrl: 'https://time.my-masjid.com/timingscreen/0b7437f8-2ee4-407a-83a3-f23990ca3f0a', googleCalendarConnected: false, googleClientId: '', googleApiKey: '' };
    } catch (error) {
      console.error("Failed to parse appSettings from localStorage:", error);
      return { geminiApiKey: '', location: { city: '', country: '' } , iqamahUrl: 'https://time.my-masjid.com/timingscreen/0b7437f8-2ee4-407a-83a3-f23990ca3f0a', googleCalendarConnected: false, googleClientId: '', googleApiKey: '' };
    }
  });
  
// NEW STATES FOR GOOGLE CALENDAR
  const [isConnectingGCal, setIsConnectingGCal] = useState(false);
  const [isImportingGCal, setIsImportingGCal] = useState(false);
  const [isExportingGCal, setIsExportingGCal] = useState(false);

// NEW STATES for GCal Import Date Range - Try loading from localStorage first
  const [gCalImportStartDate, setGCalImportStartDate] = useState(() => {
    try {
      const savedDate = localStorage.getItem('gCalImportStartDate');
      return savedDate ? new Date(savedDate) : currentDate;
    } catch (error) {
      console.error("Failed to parse gCalImportStartDate from localStorage:", error);
      return currentDate;
    }
  });
  const [gCalImportEndDate, setGCalImportEndDate] = useState(() => {
    try {
      const savedDate = localStorage.getItem('gCalImportEndDate');
      return savedDate ? new Date(savedDate) : currentDate;
    } catch (error) {
      console.error("Failed to parse gCalImportEndDate from localStorage:", error);
      return currentDate;
    }
  });

  // NEW STATES for Context Menu
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuActivity, setContextMenuActivity] = useState(null);

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

  const audioEnabled = useState(true); // Default to true
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
      const parsedConfig = savedIqamahConfig ? JSON.parse(savedIqamahConfig) : {
        manualTimes: { // Added default times for today if config is new
          [formatDateToYYYYMMDD(new Date())]: {
            fajr: '05:30', dhuhr: '13:30', asr: '17:30', maghrib: '20:30', isha: '22:00'
          }
        },
      };
      return parsedConfig;
    } catch (error) {
      console.error("Failed to parse iqamahConfig from localStorage:", error);
      return {
        manualTimes: {
          [formatDateToYYYYMMDD(new Date())]: {
            fajr: '05:30', dhuhr: '13:30', asr: '17:30', maghrib: '20:30', isha: '22:00'
          }
        }
      };
    }
  });
  // NEW REFS FOR GOOGLE CALENDAR
  const gapiLoaded = useRef(false);
  const gsiLoaded = useRef(false);
  const tokenClientRef = useRef(null); // Ref to store the tokenClient instance

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
  // NEW: Save GCal Import Dates to Local Storage
  useEffect(() => {
    if (gCalImportStartDate) {
      localStorage.setItem('gCalImportStartDate', gCalImportStartDate.toISOString());
    }
  }, [gCalImportStartDate]);
  useEffect(() => {
    if (gCalImportEndDate) {
      localStorage.setItem('gCalImportEndDate', gCalImportEndDate.toISOString());
    }
  }, [gCalImportEndDate]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refineScheduleWithAI = useCallback(async (userInput) => {
    if (!appSettings.geminiApiKey) {
      showToast("Please enter your Gemini API Key in Settings to use AI features.", "error", 5000);
      return;
    }

    showToast("AI is refining your schedule...", "info", 5000);

    const currentDaySchedule = dailyCustomSchedules[formatDateToYYYYMMDD(currentDate)] ||
                               generateScheduleForDate(currentDate, null, true, plannerSchedule, dailyCustomSchedules, fastingDates, iqamahConfig);

    const scheduleDescription = currentDaySchedule.map(activity =>
      `ID: ${activity.id}, Activity: "${activity.activity}", Start: ${activity.plannedStart}, End: ${activity.plannedEnd}, Type: ${activity.type}, Constraint: ${activity.constraintType}`
    ).join('\n');

    const prompt = `You are an AI assistant for a daily rhythm planning app. Your task is to refine a user's daily schedule based on their input.
    The current date is ${currentDate.toLocaleDateString()}.
    Here is the current daily schedule:
    ${scheduleDescription}

    The user's request for refinement is: "${userInput}"

    Suggest one or more actions to modify the schedule based on the user's request.
    Each action must be one of the following types:
    - "add_activity": To add a new activity.
    - "modify_activity": To change an existing activity's name or times.
    - "delete_activity": To remove an existing activity.
    - "shift_activities": To shift a block of activities by a certain duration.

    Provide the response in a JSON array format. Each object in the array must strictly adhere to the following schema based on the action type:

    For "add_activity":
    {
      "action": "add_activity",
      "activityName": "New Activity Name",
      "newPlannedStart": "HH:MM",
      "newPlannedEnd": "HH:MM",
      "type": "personal" | "academic" | "physical" | "spiritual" | "work",
      "constraintType": "hard" | "adjustable"
    }

    For "modify_activity":
    {
      "action": "modify_activity",
      "originalActivityId": "ID of activity to modify",
      "activityName": "Updated Activity Name (optional, keep original if not changing)",
      "newPlannedStart": "HH:MM (optional, keep original if not changing)",
      "newPlannedEnd": "HH:MM (optional, keep original if not changing)"
    }

    For "delete_activity":
    {
      "action": "delete_activity",
      "originalActivityId": "ID of activity to delete"
    }

    For "shift_activities":
    {
      "action": "shift_activities",
      "startActivityId": "ID of the first activity in the block to shift",
      "endActivityId": "ID of the last activity in the block to shift",
      "shiftDurationMinutes": "Number of minutes to shift (positive for later, negative for earlier)"
    }

    Ensure all times are in HH:MM (24-hour) format.
    If an activity is being modified or deleted, its 'originalActivityId' MUST match an existing ID from the provided schedule.
    If shifting, 'startActivityId' and 'endActivityId' MUST match existing IDs.
    Consider activity constraints: 'hard' constraint activities should generally not be moved or resized unless explicitly requested by the user. 'adjustable' activities are flexible.
    Do not suggest overlapping activities unless explicitly requested and justified.
    Prioritize user's explicit requests. If a request is impossible or unclear, state so in a comment (not in the JSON).
    If no meaningful changes can be suggested, return an empty array.
    `;

    const chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048, // NEW: Increased token limit to allow for longer JSON responses
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              action: { type: "STRING", enum: ["add_activity", "modify_activity", "delete_activity", "shift_activities"] },
              activityName: { type: "STRING", nullable: true },
              newPlannedStart: { type: "STRING", pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", nullable: true },
              newPlannedEnd: { type: "STRING", pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", nullable: true },
              originalActivityId: { type: "STRING", nullable: true },
              type: { type: "STRING", enum: ["personal", "academic", "physical", "spiritual", "work"], nullable: true },
              constraintType: { type: "STRING", enum: ["hard", "adjustable"], nullable: true },
              startActivityId: { type: "STRING", nullable: true },
              endActivityId: { type: "STRING", nullable: true },
              shiftDurationMinutes: { type: "NUMBER", nullable: true }
            },
            // Define required fields based on action type
            oneOf: [
              { properties: { action: { enum: ["add_activity"] }, activityName: {}, newPlannedStart: {}, newPlannedEnd: {}, type: {}, constraintType: {} }, required: ["action", "activityName", "newPlannedStart", "newPlannedEnd", "type", "constraintType"] },
              { properties: { action: { enum: ["modify_activity"] }, originalActivityId: {} }, required: ["action", "originalActivityId"] },
              { properties: { action: { enum: ["delete_activity"] }, originalActivityId: {} }, required: ["action", "originalActivityId"] },
              { properties: { action: { enum: ["shift_activities"] }, startActivityId: {}, endActivityId: {}, shiftDurationMinutes: {} }, required: ["action", "startActivityId", "endActivityId", "shiftDurationMinutes"] }
            ]
          }
        }
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${appSettings.geminiApiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
        console.log("Raw AI response JSON string:", jsonString); // Log the raw string for debugging

        try {
          const parsedSuggestions = JSON.parse(jsonString);

          if (Array.isArray(parsedSuggestions) && parsedSuggestions.length > 0) {
            setAiSuggestedChanges(parsedSuggestions);
            setShowAISuggestionModal(true); // Open modal for review
            showToast("AI suggestions received. Please review.", "info", 5000);
          } else {
            showToast("AI did not suggest any changes or the response was empty.", "info", 5000);
          }
        } catch (parseError) {
          console.error("Error parsing AI response JSON:", parseError);
          showToast(`Failed to parse AI response: ${parseError.message}. Please try again.`, "error", 7000);
        }
      } else {
        console.error("AI response structure unexpected for schedule refinement:", result);
        showToast("AI could not refine schedule. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error calling Gemini API for schedule refinement:", error);
      showToast(`Failed to refine schedule via AI: ${error.message}.`, "error");
    }
  }, [appSettings.geminiApiKey, currentDate, dailyCustomSchedules, plannerSchedule, fastingDates, iqamahConfig, showToast, setAiSuggestedChanges, setShowAISuggestionModal]);

  // --- Iqamah Times Handlers ---
const handleFetchIqamahTimes = useCallback(async () => {
    if (!appSettings.geminiApiKey) {
      showToast("Please enter your Gemini API Key in Settings to fetch Iqamah times.", "error", 5000);
      return;
    }

    let promptText = '';
    //let disabledReason = '';

    if (appSettings.iqamahUrl) {
      promptText = `Browse the content of this URL: ${appSettings.iqamahUrl}. From the content, extract the Iqamah (or prayer) times for Fajr, Dhuhr, Asr, Maghrib, and Isha for today, ${formatDateToYYYYMMDD(currentDate)}. If a specific Iqamah time is not found, provide the general prayer time for that prayer. Respond in JSON format only. If no times can be found for a specific prayer, return an empty string for its value.
      JSON format: {"fajr": "HH:MM", "dhuhr": "HH:MM", "asr": "HH:MM", "maghrib": "HH:MM", "isha": "HH:MM"}`;
    } else if (appSettings.location.city && appSettings.location.country) {
      promptText = `Provide Iqamah prayer times for ${formatDateToYYYYMMDD(currentDate)} for ${appSettings.location.city}, ${appSettings.location.country}. Respond in JSON format only. If you cannot find exact Iqamah times, provide approximate prayer times (e.g., based on calculated prayer times for the location). If no times can be found, return empty strings for values.
      JSON format: {"fajr": "HH:MM", "dhuhr": "HH:MM", "asr": "HH:MM", "maghrib": "HH:MM", "isha": "HH:MM"}`;
    } else {
      showToast("Please enter either your City and Country OR an Iqamah Times URL in Settings to fetch Iqamah times.", "error", 5000);
      return;
    }

    showToast("Fetching Iqamah times via AI...", "info", 5000);

    const chatHistory = [];
    chatHistory.push({
      role: "user",
      parts: [{ text: promptText }] // Use the dynamically created promptText
    });

    const payload = {
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
        body: JSON.stringify(payload)
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
  }, [appSettings.geminiApiKey, appSettings.location, appSettings.iqamahUrl, currentDate, showToast]);


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

  // --- Google Calendar Integration Functions (using gapi) ---
  // Load gapi and gsi libraries
  useEffect(() => {
    // Only proceed if googleClientId is available
    if (!appSettings.googleClientId) {
      console.warn('Google Client ID is missing. Google Calendar features will not initialize.');
      return; // Exit if client ID is not set
    }

    const loadGapi = () => {
      if (window.gapi && !gapiLoaded.current) {
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            apiKey: appSettings.googleApiKey, // Optional, but good to include if present
            clientId: appSettings.googleClientId,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar.events', // Scope for reading/writing events
          }).then(() => {
            gapiLoaded.current = true;
            console.log('Google API client loaded and initialized.');
            // Check initial sign-in status if needed, though GIS handles primary auth
          }).catch(error => {
            console.error('Error initializing gapi client:', error);
            showToast('Failed to initialize Google API client. Check API Key/Client ID.', 'error', 7000);
          });
        });
      }
    };

    const loadGsi = () => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2 && !gsiLoaded.current) {
        // Ensure tokenClientRef.current is only initialized once
        if (!tokenClientRef.current) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: appSettings.googleClientId,
            scope: 'https://www.googleapis.com/auth/calendar.events',
            callback: (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                window.gapi.client.setToken(tokenResponse); // Set the token for gapi.client
                setAppSettings(prev => ({ ...prev, googleCalendarConnected: true }));
                showToast('Google Calendar connected successfully!', 'success');
                console.log('Google Calendar connected. Access Token:', tokenResponse.access_token);
              } else {
                setAppSettings(prev => ({ ...prev, googleCalendarConnected: false }));
                showToast('Failed to connect Google Calendar. Please try again.', 'error');
                console.error('Failed to connect Google Calendar:', tokenResponse);
              }
              setIsConnectingGCal(false);
            },
            error_callback: (error) => {
              console.error('GSI Error:', error);
              showToast('Google Calendar connection failed. See console for details.', 'error', 7000);
              setIsConnectingGCal(false);
            }
          });
        }
        gsiLoaded.current = true;
        console.log('Google Identity Services client initialized.');
      }
    };

    // Check if gapi and gsi are already available, otherwise wait for them
    if (window.gapi) loadGapi();
    else window.addEventListener('load', loadGapi);

    if (window.google && window.google.accounts && window.google.accounts.oauth2) loadGsi();
    else window.addEventListener('load', loadGsi);

    return () => {
      // Cleanup event listeners if necessary
      window.removeEventListener('load', loadGapi);
      window.removeEventListener('load', loadGsi);
    };
  }, [appSettings.googleClientId, appSettings.googleApiKey, setAppSettings, showToast, setIsConnectingGCal]); // Added setIsConnectingGCal to dependencies


  const connectGoogleCalendar = useCallback(() => {
    if (!appSettings.googleClientId) {
      showToast('Please enter your Google Client ID in settings.', 'error');
      return;
    }
    if (!gapiLoaded.current || !gsiLoaded.current || !tokenClientRef.current) {
      showToast('Google API libraries not fully loaded yet. Please wait a moment and try again.', 'info', 5000);
      console.log('GAPI Loaded:', gapiLoaded.current, 'GSI Loaded:', gsiLoaded.current, 'Token Client:', tokenClientRef.current);
      return;
    }

    setIsConnectingGCal(true);
    try {
      tokenClientRef.current.requestAccessToken(); // Initiate the OAuth flow
    } catch (error) {
      console.error('Error requesting access token:', error);
      showToast('Failed to initiate Google Calendar connection. See console for details.', 'error', 7000);
      setIsConnectingGCal(false);
    }
  }, [appSettings.googleClientId, showToast]);

  const fetchGoogleCalendarMeetings = useCallback(async () => {
    if (!appSettings.googleCalendarConnected) {
      showToast('Please connect Google Calendar first.', 'error');
      return;
    }
    if (!gapiLoaded.current || !window.gapi.client.calendar) {
      showToast('Google Calendar API not ready. Please try again.', 'error', 5000);
      return;
    }

    setIsImportingGCal(true);
    showToast('Importing meetings from Google Calendar...', 'info', 5000);

    try {
      // Use the selected start and end dates from state
      const timeMin = new Date(gCalImportStartDate);
      timeMin.setHours(0, 0, 0, 0); // Start of the day

      const timeMax = new Date(gCalImportEndDate);
      timeMax.setHours(23, 59, 59, 999); // End of the day

      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': timeMin.toISOString(),
        'timeMax': timeMax.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime',
      });

      const events = response.result.items;
      console.log('Fetched Google Calendar Events:', events);

      if (events.length > 0) {
        // Create a map to hold updates for dailyCustomSchedules
        const updatesToDailyCustomSchedules = {};

        events.forEach(event => {
          const eventStart = event.start.dateTime || event.start.date;
          const eventEnd = event.end.dateTime || event.end.date;

          if (eventStart && eventEnd) {
            const startDate = new Date(eventStart);
            const endDate = new Date(eventEnd);
            const eventDateKey = formatDateToYYYYMMDD(startDate); // Key for the day the event falls on

            // Ensure the target day's schedule is initialized before adding events
            if (!updatesToDailyCustomSchedules[eventDateKey]) {
              // If we don't have a custom schedule for this day yet, generate it from template
              updatesToDailyCustomSchedules[eventDateKey] = dailyCustomSchedules[eventDateKey] ? [...dailyCustomSchedules[eventDateKey]] :
                                                            generateScheduleForDate(startDate, null, true, plannerSchedule, dailyCustomSchedules, fastingDates, iqamahConfig);
            }

            const newActivity = {
              id: `gcal-${event.id}`, // Use Google Event ID for unique ID
              activity: `${event.summary || 'Google Calendar Event'} (GC)`, // Add "GC" tag
              plannedStart: formatTo24HourTime(startDate),
              plannedEnd: formatTo24HourTime(endDate),
              type: 'work', // Assume meetings are 'work' type, user can change
              recurrenceType: 'none', // Imported as one-time events
              recurrenceDays: [],
              constraintType: 'hard', // Meetings are usually hard constraints
              isGoogleCalendarEvent: true, // Mark as imported from GCal
              originalSummary: event.summary || '', // Store original summary
            };

            // Check if event already exists to avoid duplicates
            if (!updatesToDailyCustomSchedules[eventDateKey].some(act => act.id === newActivity.id)) {
              updatesToDailyCustomSchedules[eventDateKey].push(newActivity);
            }
          }
        });

        // Apply all updates to dailyCustomSchedules
        setDailyCustomSchedules(prev => {
          const newState = { ...prev };
          for (const dateKey in updatesToDailyCustomSchedules) {
            // Sort activities for each updated day
            updatesToDailyCustomSchedules[dateKey].sort((a, b) => timeToMinutes(a.plannedStart) - timeToMinutes(b.plannedStart));
            newState[dateKey] = updatesToDailyCustomSchedules[dateKey];
          }
          return newState;
        });

        showToast(`Successfully imported ${events.length} meetings from Google Calendar!`, 'success');
      } else {
        showToast(`No upcoming meetings found in Google Calendar between ${formatDateToYYYYMMDD(gCalImportStartDate)} and ${formatDateToYYYYMMDD(gCalImportEndDate)}.`, 'info');
      }
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      showToast(`Failed to import meetings: ${error.message}. Please ensure Calendar API is enabled.`, 'error', 7000);
    } finally {
      setIsImportingGCal(false);
    }
  }, [appSettings.googleCalendarConnected, gCalImportStartDate, gCalImportEndDate, setDailyCustomSchedules, showToast, dailyCustomSchedules, plannerSchedule, fastingDates, iqamahConfig]);

  const addActivityToGoogleCalendar = useCallback(async (activity) => {
    if (!appSettings.googleCalendarConnected) {
      showToast('Please connect Google Calendar first.', 'error');
      return;
    }
    if (!gapiLoaded.current || !window.gapi.client.calendar) {
      showToast('Google Calendar API not ready. Please try again.', 'error', 5000);
      return;
    }

    setIsExportingGCal(true);
    showToast(`Adding "${activity.activity}" to Google Calendar...`, 'info', 5000);

    try {
      const event = {
        'summary': activity.activity,
        'start': {
          'dateTime': `${formatDateToYYYYMMDD(currentDate)}T${activity.plannedStart}:00`,
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone, // Use local timezone
        },
        'end': {
          'dateTime': `${formatDateToYYYYMMDD(currentDate)}T${activity.plannedEnd}:00`,
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        'description': subTaskDetails[activity.id] || '',
        // 'visibility': 'private' // Or 'public', 'confidential'
      };

      const request = await window.gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event,
      });

      console.log('Event created:', request.result);
      showToast(`Activity "${activity.activity}" added to Google Calendar!`, 'success');
    } catch (error) {
      console.error('Error adding event to Google Calendar:', error);
      showToast(`Failed to add "${activity.activity}" to Google Calendar: ${error.message}.`, 'error', 7000);
    } finally {
      setIsExportingGCal(false);
    }
  }, [appSettings.googleCalendarConnected, currentDate, subTaskDetails, showToast]);

  // NEW: Handle Context Menu (Right-Click)
  const handleContextMenu = useCallback((e, activity) => {
    e.preventDefault(); // Prevent default browser context menu
    setShowContextMenu(true);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuActivity(activity);
  }, []);

  // NEW: Handle Duplicate Activity
  const handleDuplicateActivity = useCallback(() => {
    if (!contextMenuActivity) return;

    const originalActivity = contextMenuActivity;
    const dateKey = formatDateToYYYYMMDD(currentDate);

    // Calculate new start and end times with a 15-minute offset
    const originalEndMinutes = timeToMinutes(originalActivity.plannedEnd);
    const originalStartMinutes = timeToMinutes(originalActivity.plannedStart);
    const durationMinutes = (originalEndMinutes < originalStartMinutes ? originalEndMinutes + 1440 : originalEndMinutes) - originalStartMinutes;

    const newStartMinutes = (originalEndMinutes + 15) % 1440; // 15 minutes after original end
    let newEndMinutes = (newStartMinutes + durationMinutes);
    if (newEndMinutes >= 1440) newEndMinutes -= 1440; // Handle overnight wrap-around for end time

    const newActivity = {
      ...originalActivity,
      id: crypto.randomUUID(), // Ensure a new unique ID
      activity: `${originalActivity.activity} (Copy)`, // Append "(Copy)" to the name
      plannedStart: minutesToTime(newStartMinutes),
      plannedEnd: minutesToTime(newEndMinutes),
      isNew: true, // Mark as new for potential future handling if needed
    };

    setDailyCustomSchedules(prev => {
      const currentDaySchedule = prev[dateKey] ? [...prev[dateKey]] :
                                 generateScheduleForDate(currentDate, null, true, plannerSchedule, prev, fastingDates, iqamahConfig);
      const updatedSchedule = [...currentDaySchedule, newActivity];
      updatedSchedule.sort((a, b) => timeToMinutes(a.plannedStart) - timeToMinutes(b.plannedStart)); // Re-sort
      return { ...prev, [dateKey]: updatedSchedule };
    });

    showToast(`Activity "${newActivity.activity}" duplicated!`, 'success');
    setShowContextMenu(false); // Close context menu
    setContextMenuActivity(null);
  }, [contextMenuActivity, currentDate, setDailyCustomSchedules, showToast, plannerSchedule, fastingDates, iqamahConfig]);

// Handle Reconnect Google Calendar
  const handleReconnectGoogleCalendar = useCallback(() => {
    setIsConnectingGCal(true);
    setAppSettings(prev => ({ ...prev, googleCalendarConnected: false })); // Force disconnect state
    gapiLoaded.current = false; // Reset GAPI loaded status
    gsiLoaded.current = false;  // Reset GSI loaded status
    tokenClientRef.current = null; // Clear token client reference to force re-initialization

    showToast('Attempting to reconnect Google Calendar...', 'info', 5000);

    // This setTimeout is crucial because state updates (like setAppSettings) are batched.
    // We need to ensure the component re-renders and the useEffect for loading GAPI/GSI
    // has a chance to re-initialize `tokenClientRef.current` if it was cleared.
    setTimeout(() => {
      // Ensure GSI is loaded before trying to initialize tokenClient
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        // Only re-initialize tokenClient if it's null (it should be after clearing tokenClientRef.current)
        // This ensures a fresh tokenClient instance is created for a new auth flow.
        if (!tokenClientRef.current) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: appSettings.googleClientId,
            scope: 'https://www.googleapis.com/auth/calendar.events',
            callback: (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                window.gapi.client.setToken(tokenResponse);
                setAppSettings(prev => ({ ...prev, googleCalendarConnected: true }));
                showToast('Google Calendar reconnected successfully!', 'success');
              } else {
                setAppSettings(prev => ({ ...prev, googleCalendarConnected: false }));
                showToast('Failed to reconnect Google Calendar. Please try again.', 'error');
              }
              setIsConnectingGCal(false);
            },
            error_callback: (error) => {
              console.error('GSI Reconnect Error:', error);
              showToast('Google Calendar reconnection failed. See console for details.', 'error', 7000);
              setIsConnectingGCal(false);
            }
          });
        }
        // Always request access token after ensuring tokenClient is initialized
        try {
          tokenClientRef.current.requestAccessToken();
        } catch (error) {
          console.error('Error requesting access token during reconnect:', error);
          showToast('Failed to initiate Google Calendar reconnection. See console for details.', 'error', 7000);
          setIsConnectingGCal(false);
        }
      } else {
        console.warn('Google Identity Services not available for immediate reconnect. Please refresh page if issues persist.');
        showToast('Failed to re-initialize Google Calendar connection. Please refresh the page.', 'error', 7000);
        setIsConnectingGCal(false);
      }
    }, 100); // Small delay to allow state to update
  }, [setAppSettings, showToast, appSettings.googleClientId, setIsConnectingGCal]);

  // NEW: Handle Disconnect Google Calendar
  const handleDisconnectGoogleCalendar = useCallback(() => {
    setIsConnectingGCal(true); // Indicate that a connection operation is in progress
    setAppSettings(prev => ({ ...prev, googleCalendarConnected: false })); // Update UI immediately

    // Attempt to revoke token or sign out if GSI is loaded
    if (window.google && window.google.accounts && window.google.accounts.oauth2 && tokenClientRef.current) {
      try {
        const currentToken = window.gapi.client.getToken(); // Get the current token

        if (currentToken && currentToken.access_token) { // Check if token and access_token exist
          window.google.accounts.oauth2.revoke(currentToken.access_token, () => {
            console.log('Access token revoked.');
            showToast('Google Calendar disconnected successfully!', 'success');
            setIsConnectingGCal(false);
          });
        } else {
          console.log('No active access token to revoke, proceeding with local disconnect.');
          showToast('Google Calendar disconnected successfully!', 'success');
          setIsConnectingGCal(false);
        }

        // Clear gapi client's token regardless
        window.gapi.client.setToken('');

      } catch (error) {
        console.error('Error during Google Calendar disconnect:', error);
        showToast('Failed to disconnect Google Calendar. See console for details.', 'error', 7000);
        setIsConnectingGCal(false);
      }
    } else {
      showToast('Google API libraries not fully loaded or no active session to disconnect locally.', 'info');
      setIsConnectingGCal(false);
    }

    // Also clear our internal refs to ensure a clean slate for next connection
    gapiLoaded.current = false;
    gsiLoaded.current = false;
    tokenClientRef.current = null;

  }, [setAppSettings, showToast, setIsConnectingGCal]);

// NEW: Apply AI Suggestions
  const applyAISuggestions = useCallback((suggestions) => {
    setDailyCustomSchedules(prevDailySchedules => {
      const dateKey = formatDateToYYYYMMDD(currentDate);
      let currentDaySchedule = prevDailySchedules[dateKey] ? [...prevDailySchedules[dateKey]] :
                               generateScheduleForDate(currentDate, null, true, plannerSchedule, prevDailySchedules, fastingDates, iqamahConfig);

      suggestions.forEach(sug => {
        try {
          if (sug.action === 'add_activity') {
            const newActivity = {
              id: crypto.randomUUID(),
              activity: sug.activityName,
              plannedStart: sug.newPlannedStart,
              plannedEnd: sug.newPlannedEnd,
              type: sug.type || 'personal', // Default type if not provided by AI
              recurrenceType: 'none', // Added activities are usually one-time
              recurrenceDays: [],
              constraintType: sug.constraintType || 'adjustable', // Default constraint
            };
            currentDaySchedule.push(newActivity);
            showToast(`Added: "${newActivity.activity}"`, 'success', 2000);
          } else if (sug.action === 'modify_activity') {
            const index = currentDaySchedule.findIndex(act => act.id === sug.originalActivityId);
            if (index !== -1) {
              currentDaySchedule[index] = {
                ...currentDaySchedule[index],
                activity: sug.activityName || currentDaySchedule[index].activity,
                plannedStart: sug.newPlannedStart || currentDaySchedule[index].plannedStart,
                plannedEnd: sug.newPlannedEnd || currentDaySchedule[index].plannedEnd,
              };
              showToast(`Modified: "${currentDaySchedule[index].activity}"`, 'success', 2000);
            } else {
              showToast(`Failed to modify: Activity with ID "${sug.originalActivityId}" not found.`, 'error', 3000);
            }
          } else if (sug.action === 'delete_activity') {
            const originalLength = currentDaySchedule.length;
            currentDaySchedule = currentDaySchedule.filter(act => act.id !== sug.originalActivityId);
            if (currentDaySchedule.length < originalLength) {
              showToast(`Deleted: Activity with ID "${sug.originalActivityId}"`, 'success', 2000);
            } else {
              showToast(`Failed to delete: Activity with ID "${sug.originalActivityId}" not found.`, 'error', 3000);
            }
          } else if (sug.action === 'shift_activities') {
            const startIndex = currentDaySchedule.findIndex(act => act.id === sug.startActivityId);
            const endIndex = currentDaySchedule.findIndex(act => act.id === sug.endActivityId);

            if (startIndex !== -1 && endIndex !== -1) {
              const activitiesToShift = currentDaySchedule.slice(startIndex, endIndex + 1);
              const otherActivitiesBefore = currentDaySchedule.slice(0, startIndex);
              const otherActivitiesAfter = currentDaySchedule.slice(endIndex + 1);

              const shiftedActivities = activitiesToShift.map(act => {
                const startMinutes = timeToMinutes(act.plannedStart);
                const endMinutes = timeToMinutes(act.plannedEnd);
                const duration = (endMinutes < startMinutes ? endMinutes + 1440 : endMinutes) - startMinutes;

                let newStartMinutes = startMinutes + sug.shiftDurationMinutes;
                let newEndMinutes = newStartMinutes + duration;

                // Handle wrap around midnight
                newStartMinutes = (newStartMinutes % 1440 + 1440) % 1440;
                newEndMinutes = (newEndMinutes % 1440 + 1440) % 1440;

                return {
                  ...act,
                  plannedStart: minutesToTime(newStartMinutes),
                  plannedEnd: minutesToTime(newEndMinutes),
                };
              });
              currentDaySchedule = [...otherActivitiesBefore, ...shiftedActivities, ...otherActivitiesAfter];
              showToast(`Shifted activities from "${sug.startActivityId}" to "${sug.endActivityId}" by ${sug.shiftDurationMinutes} mins.`, 'success', 3000);
            } else {
              showToast(`Failed to shift: Start or end activity ID not found for shift.`, 'error', 3000);
            }
          }
        } catch (actionError) {
          console.error("Error applying AI suggestion:", sug, actionError);
          showToast(`Error applying a suggestion: ${actionError.message}.`, 'error', 5000);
        }
      });

      // Sort the schedule after applying all changes
      currentDaySchedule.sort((a, b) => timeToMinutes(a.plannedStart) - timeToMinutes(b.plannedStart));

      return { ...prevDailySchedules, [dateKey]: currentDaySchedule };
    });

    setShowAISuggestionModal(false); // Close modal after applying
    setAiSuggestedChanges([]); // Clear suggestions
  }, [currentDate, dailyCustomSchedules, plannerSchedule, fastingDates, iqamahConfig, showToast]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-inter text-gray-800 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 mb-8 flex flex-col h-full">
          {/* Header and Tabs */}
          <div className="flex justify-between items-center mb-6 border-b pb-4 flex-shrink-0">
            <h1 className="text-3xl font-bold text-indigo-700">{appName} <span className="text-xl text-gray-500">- v1.2.0</span></h1>
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
              {/* NEW: Google Calendar Import Date Range & Button */}
              <div className="flex flex-wrap items-end gap-2 mb-4"> {/* Use items-end to align button with text inputs */}
                <div className="flex-grow"> {/* Allows date pickers to take available space */}
                  <label htmlFor="gCalImportStartDate" className="block text-sm font-medium text-gray-700">Import GCal From:</label>
                  <input
                    type="date"
                    id="gCalImportStartDate"
                    // Ensure formatDateToYYYYMMDD is correctly converting the Date object to "YYYY-MM-DD" string
                    // Provide empty string if gCalImportStartDate is null
                    value={gCalImportStartDate ? formatDateToYYYYMMDD(gCalImportStartDate) : ''}
                    onChange={(e) => {
                    // Fix: Construct date in local timezone to avoid UTC conversion issues
                      const dateString = e.target.value;
                      if (dateString) {
                        const [year, month, day] = dateString.split('-').map(Number);
                        // Construct date using local year, month (0-indexed), day
                        setGCalImportStartDate(new Date(year, month - 1, day));
                      } else {
                        setGCalImportStartDate(null);
                      }
                    }}
                    className="p-2 border border-gray-300 rounded-md w-full"
                    key={`gcal-start-date-${gCalImportStartDate ? formatDateToYYYYMMDD(gCalImportStartDate) : 'null'}`}
                  />
                </div>
                <div className="flex-grow"> {/* Allows date pickers to take available space */}
                  <label htmlFor="gCalImportEndDate" className="block text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    id="gCalImportEndDate"
                    // Ensure formatDateToYYYYMMDD is correctly converting the Date object to "YYYY-MM-DD" string
                    // Provide empty string if gCalImportEndDate is null
                    value={gCalImportEndDate ? formatDateToYYYYMMDD(gCalImportEndDate) : ''}
                    onChange={(e) => {
                    // Fix: Construct date in local timezone to avoid UTC conversion issues
                      const dateString = e.target.value;
                      if (dateString) {
                        const [year, month, day] = dateString.split('-').map(Number);
                        // Construct date using local year, month (0-indexed), day
                        setGCalImportEndDate(new Date(year, month - 1, day));
                      } else {
                        setGCalImportEndDate(null);
                      }
                    }}
                    className="p-2 border border-gray-300 rounded-md w-full"
                    key={`gcal-end-date-${gCalImportEndDate ? formatDateToYYYYMMDD(gCalImportEndDate) : 'null'}`}
                  />
                </div>
                {/* Import Google Calendar Meetings Button - now part of the flex container */}
                <button
                    onClick={fetchGoogleCalendarMeetings}
                    disabled={!appSettings.googleCalendarConnected || isImportingGCal}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md shadow-md hover:bg-purple-600 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Import Google Calendar Meetings"
                >
                    {isImportingGCal ? (
                      <>
                        <span className="animate-spin mr-2">🔄</span> Importing...
                      </>
                    ) : (
                      <>
                        <Download size={18} className="inline-block mr-2" /> Import GCal
                      </>
                    )}
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
                    className="relative w-full h-[2880px] bg-gray-50 rounded-lg shadow-inner overflow-y-auto border border-gray-300 mb-6"
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
                            border-3 border-gray-700 ring-1 ring-gray-200 hover:ring-indigo-400 hover:shadow-md transition-all duration-150
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
                            onContextMenu={(e) => handleContextMenu(e, activity)}
                            title={`${activity.activity} (${activity.plannedStart} - ${activity.plannedEnd})`}
                        >
                            <span className={`text-sm text-gray-800 truncate whitespace-nowrap overflow-hidden text-ellipsis ${isPrayerBlock ? 'font-bold' : 'font-normal'}`}>{`${activity.activity} (${activity.plannedStart} - ${activity.plannedEnd})`}</span>
                            {/* NEW: Delete Button for Calendar View */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent drag/resize or double-click from firing
                                    handleDeleteDailyActivity(activity.id);
                                }}
                                className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-red-600"
                                aria-label={`Delete ${activity.activity}`}
                            >
                                <X size={12} />
                            </button>
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
                                //const isSubdividedBlock = (activity.type === 'academic' || activity.originalActivityId?.includes('flexible-afternoon')) && activity.id.includes('-part');
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
                                    onContextMenu={(e) => handleContextMenu(e, activity)}
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

                                            {/* NEW: Actions Dropdown for Google Calendar */}
                                            <div className="relative group">
                                              <button
                                                className="px-3 py-1 bg-gray-400 text-white rounded-md text-xs font-medium hover:bg-gray-500 transition-colors duration-200"
                                                aria-label="More actions"
                                              >
                                                Actions <ChevronRight size={12} className="inline-block ml-1 transform rotate-90" />
                                              </button>
                                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 origin-top-right">
                                                <button
                                                  onClick={() => addActivityToGoogleCalendar(activity)}
                                                  disabled={!appSettings.googleCalendarConnected || isExportingGCal}
                                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  {isExportingGCal ? 'Adding...' : 'Add to Google Calendar'}
                                                </button>
                                                <button
                                                  onClick={() => handleEditDailyActivity(activity)}
                                                  className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
                                                >
                                                  Edit Activity
                                                </button>
                                                {/* NEW: Delete Daily Activity Button */}
                                                <button
                                                  onClick={() => handleDeleteDailyActivity(activity.id)}
                                                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                                                >
                                                  Delete Activity
                                                </button>
                                              </div>
                                            </div>
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
                                  className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors duration-200"
                                  aria-label={`Edit ${task.name}`}
                                >
                                  <Edit size={14} className="inline-block mr-1" /> Edit
                                </button>
                                <button
                                    onClick={() => handleSaveTask({...task, actualCompletionDate: formatDateToYYYYMMDD(new Date()), status: 'completed'})}
                                    className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors duration-200"
                                    aria-label={`Mark ${task.name} as complete`}
                                >
                                    <CheckCircle size={14} className="inline-block mr-1" /> Complete
                                </button>
                                <button
                                  onClick={() => openAssignTaskModal(null, { taskId: task.id, subtaskId: null })}
                                  className="px-3 py-1 bg-indigo-500 text-white rounded-md text-xs font-medium hover:bg-indigo-600 transition-colors duration-200"
                                  aria-label={`Assign ${task.name} to schedule`}
                                >
                                  <Link size={14} className="inline-block mr-1" /> Assign
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors duration-200"
                                  aria-label={`Delete ${task.name}`}
                                >
                                  <Trash2 size={14} className="inline-block mr-1" /> Delete
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
                <GanttChart
                  tasks={projectTasks}
                  setProjectTasks={setProjectTasks} // NEW: Pass the setter
                  showToast={showToast} // NEW: Pass the toast function
                />
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

              {/* Google Calendar Integration */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6 shadow-inner">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4">Google Calendar Integration</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Connect your Google Calendar to import meetings and export activities.
                  <br/>
                  <span className="font-bold text-red-600">Note:</span> Full integration requires a Google Cloud Project and OAuth setup.
                </p>
                <div className="space-y-4 mb-4">
                  <div>
                    <label htmlFor="googleClientId" className="block text-sm font-medium text-gray-700">Google Client ID</label>
                    <input
                      type="text"
                      id="googleClientId"
                      value={appSettings.googleClientId}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, googleClientId: e.target.value }))}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter your Google Client ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">Found in Google Cloud Console Credentials (OAuth 2.0 Client IDs).</p>
                  </div>
                  {/* Removed Google Client Secret input field for security */}
                  <div>
                    <label htmlFor="googleApiKey" className="block text-sm font-medium text-gray-700">Google API Key (Optional)</label>
                    <input
                      type="password"
                      id="googleApiKey"
                      value={appSettings.googleApiKey}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, googleApiKey: e.target.value }))}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter your Google API Key (if needed for other services)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Only required for certain Google APIs, not typically for OAuth flow itself.</p>
                  </div>
                </div>

                {/* Buttons for Google Calendar Connection */}
                <div className="flex flex-wrap gap-2"> {/* Use flex and gap for horizontal layout */}
                  <button
                    onClick={connectGoogleCalendar}
                    className={`px-4 py-2 rounded-md shadow-md transition-colors duration-200 flex items-center
                      ${appSettings.googleCalendarConnected ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}
                    `}
                    disabled={appSettings.googleCalendarConnected || !appSettings.googleClientId || isConnectingGCal}
                  >
                    {isConnectingGCal ? (
                      <>
                        <span className="animate-spin mr-2">⚙️</span> Connecting...
                      </>
                    ) : appSettings.googleCalendarConnected ? (
                      <>
                        <CheckCircle size={20} className="mr-2" /> Connected
                      </>
                    ) : (
                      <>
                        <Link size={20} className="mr-2" /> Connect Google Calendar
                      </>
                    )}
                  </button>
                  {appSettings.googleCalendarConnected && (
                    <>
                      <button
                        onClick={handleReconnectGoogleCalendar}
                        className={`px-4 py-2 rounded-md shadow-md transition-colors duration-200 flex items-center
                          bg-orange-500 text-white hover:bg-orange-600
                        `}
                        disabled={isConnectingGCal}
                      >
                        <RefreshCcw size={20} className="mr-2" /> Reconnect
                      </button>
                      <button
                        onClick={handleDisconnectGoogleCalendar}
                        className={`px-4 py-2 rounded-md shadow-md transition-colors duration-200 flex items-center
                          bg-red-500 text-white hover:bg-red-600
                        `}
                        disabled={isConnectingGCal}
                      >
                        <X size={20} className="mr-2" /> Disconnect
                      </button>
                    </>
                  )}
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
                  {/* NEW URL INPUT FIELD */}
                  <div>
                    <label htmlFor="iqamahUrl" className="block text-sm font-medium text-gray-700">Iqamah Times URL (Optional)</label>
                    <input
                      type="url"
                      id="iqamahUrl"
                      value={appSettings.iqamahUrl}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, iqamahUrl: e.target.value }))}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      placeholder="e.g., https://time.my-masjid.com/timingscreen/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If provided, AI will attempt to fetch times from this URL instead of using city/country.
                    </p>
                  </div>
                  <button
                    onClick={handleFetchIqamahTimes}
                    disabled={!appSettings.geminiApiKey || (!appSettings.iqamahUrl && (!appSettings.location.city || !appSettings.location.country))}
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
        {/* NEW: Context Menu */}
        {showContextMenu && contextMenuActivity && (
          <div
            className="fixed z-50 bg-white rounded-md shadow-lg py-1 border border-gray-200"
            style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
            onMouseLeave={() => setShowContextMenu(false)} // Close if mouse leaves the menu
          >
            <button
              onClick={handleDuplicateActivity}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Duplicate Activity
            </button>
            {/* Add more context menu options here if needed later */}
          </div>
        )}

        {/* NEW: AI Suggestion Review Modal */}
        {showAISuggestionModal && (
          <AISuggestionReviewModal
            suggestions={aiSuggestedChanges}
            onApply={applyAISuggestions}
            onCancel={() => {
              setShowAISuggestionModal(false);
              setAiSuggestedChanges([]); // Clear suggestions on cancel
              showToast("AI suggestions cancelled.", "info", 2000);
            }}
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

// --- Gantt Chart Component ---
const GanttChart = ({ tasks, setProjectTasks, showToast }) => {
  // State for zoom level (pixels per day)
  const [pixelsPerDay, setPixelsPerDay] = useState(100); // Default: 100 pixels per day
  const ganttChartRef = useRef(null); // Ref for the scrollable chart area

  // States for drag & resize interactions
  const [draggingGanttTask, setDraggingGanttTask] = useState(null); // { taskId, startX, initialLeft, initialWidth, initialTargetStartDate, initialDeadlineDate }
  const [resizingGanttTask, setResizingGanttTask] = useState(null); // { taskId, startX, initialLeft, initialWidth, handleType: 'left' | 'right', initialTargetStartDate, initialDeadlineDate }

  // State for direct task editing popover
  const [editingGanttTask, setEditingGanttTask] = useState(null); // { task, position: {x, y} }
  const editPopoverRef = useRef(null); // Ref for the edit popover to handle clicks outside

  // Calculate the date range for the Gantt chart
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine minDate: Start of the week containing the earliest task, or today if no tasks
  let minDate = new Date(today);
  minDate.setDate(minDate.getDate() - minDate.getDay()); // Go to Sunday of current week

  if (tasks.length > 0) {
    const earliestTaskDate = tasks.reduce((min, task) => {
      if (!task.targetStartDate) return min;
      const taskStart = new Date(task.targetStartDate);
      return taskStart < min ? taskStart : min;
    }, new Date(today));

    // Ensure minDate is the Sunday of the week containing the earliest task
    minDate = new Date(earliestTaskDate);
    minDate.setDate(minDate.getDate() - minDate.getDay());
  }

  // Determine maxDate: End of the week containing the latest task, or 12 weeks from minDate
  let maxDate = new Date(minDate);
  maxDate.setDate(maxDate.getDate() + (12 * 7)); // Default to 12 weeks from minDate

  if (tasks.length > 0) {
    const latestTaskDate = tasks.reduce((max, task) => {
      if (!task.deadlineDate) return max;
      const taskEnd = new Date(task.deadlineDate);
      return taskEnd > max ? taskEnd : max;
    }, new Date(today));

    // Ensure maxDate is the Saturday of the week containing the latest task, plus some buffer
    maxDate = new Date(latestTaskDate);
    maxDate.setDate(maxDate.getDate() + (6 - maxDate.getDay()) + (4 * 7)); // Go to Saturday + 4 weeks buffer
  }

  const chartDurationDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
  const chartWidth = chartDurationDays * pixelsPerDay;

  // Calculate day positions for grid lines and labels
  const days = [];
  let currentDateIter = new Date(minDate);
  while (currentDateIter <= maxDate) {
    days.push(new Date(currentDateIter));
    currentDateIter.setDate(currentDateIter.getDate() + 1);
  }

  // Handle Gantt chart mouse down for drag/resize
  const handleGanttMouseDown = useCallback((e, taskId, type) => {
    e.stopPropagation(); // Prevent text selection or other default behaviors
    setEditingGanttTask(null); // Close any open edit popover

    const taskElement = e.currentTarget;
    const taskRect = taskElement.getBoundingClientRect();
    const chartRect = ganttChartRef.current.getBoundingClientRect();

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (type === 'move') {
      setDraggingGanttTask({
        taskId,
        startX: e.clientX,
        initialLeft: taskRect.left - chartRect.left + ganttChartRef.current.scrollLeft,
        initialWidth: taskRect.width,
        initialTargetStartDate: task.targetStartDate ? new Date(task.targetStartDate) : null,
        initialDeadlineDate: task.deadlineDate ? new Date(task.deadlineDate) : null,
      });
    } else if (type === 'left-handle') {
      setResizingGanttTask({
        taskId,
        startX: e.clientX,
        initialLeft: taskRect.left - chartRect.left + ganttChartRef.current.scrollLeft,
        initialWidth: taskRect.width,
        handleType: 'left',
        initialTargetStartDate: task.targetStartDate ? new Date(task.targetStartDate) : null,
        initialDeadlineDate: task.deadlineDate ? new Date(task.deadlineDate) : null,
      });
    } else if (type === 'right-handle') {
      setResizingGanttTask({
        taskId,
        startX: e.clientX,
        initialLeft: taskRect.left - chartRect.left + ganttChartRef.current.scrollLeft,
        initialWidth: taskRect.width,
        handleType: 'right',
        initialTargetStartDate: task.targetStartDate ? new Date(task.targetStartDate) : null,
        initialDeadlineDate: task.deadlineDate ? new Date(task.deadlineDate) : null,
      });
    }
  }, [tasks, pixelsPerDay]);

  // Handle Gantt chart mouse move for drag/resize
  const handleGanttMouseMove = useCallback((e) => {
    if (draggingGanttTask) {
      const dx = e.clientX - draggingGanttTask.startX;
      const daysShifted = Math.round(dx / pixelsPerDay);

      setProjectTasks(prevTasks => prevTasks.map(task => {
        if (task.id === draggingGanttTask.taskId) {
          const newTargetStartDate = draggingGanttTask.initialTargetStartDate ? new Date(draggingGanttTask.initialTargetStartDate) : null;
          const newDeadlineDate = draggingGanttTask.initialDeadlineDate ? new Date(draggingGanttTask.initialDeadlineDate) : null;

          if (newTargetStartDate) newTargetStartDate.setDate(newTargetStartDate.getDate() + daysShifted);
          if (newDeadlineDate) newDeadlineDate.setDate(newDeadlineDate.getDate() + daysShifted);

          return {
            ...task,
            targetStartDate: newTargetStartDate ? formatDateToYYYYMMDD(newTargetStartDate) : task.targetStartDate,
            deadlineDate: newDeadlineDate ? formatDateToYYYYMMDD(newDeadlineDate) : task.deadlineDate,
          };
        }
        return task;
      }));
    } else if (resizingGanttTask) {
      const dx = e.clientX - resizingGanttTask.startX;
      const task = tasks.find(t => t.id === resizingGanttTask.taskId);
      if (!task) return;

      const newTargetStartDate = resizingGanttTask.initialTargetStartDate ? new Date(resizingGanttTask.initialTargetStartDate) : null;
      const newDeadlineDate = resizingGanttTask.initialDeadlineDate ? new Date(resizingGanttTask.initialDeadlineDate) : null;

      setProjectTasks(prevTasks => prevTasks.map(t => {
        if (t.id === resizingGanttTask.taskId) {
          if (resizingGanttTask.handleType === 'left') {
            const daysShifted = Math.round(dx / pixelsPerDay);
            if (newTargetStartDate) newTargetStartDate.setDate(newTargetStartDate.getDate() + daysShifted);
            return {
              ...t,
              targetStartDate: newTargetStartDate ? formatDateToYYYYMMDD(newTargetStartDate) : t.targetStartDate,
            };
          } else if (resizingGanttTask.handleType === 'right') {
            const daysExtended = Math.round(dx / pixelsPerDay);
            if (newDeadlineDate) newDeadlineDate.setDate(newDeadlineDate.getDate() + daysExtended);
            return {
              ...t,
              deadlineDate: newDeadlineDate ? formatDateToYYYYMMDD(newDeadlineDate) : t.deadlineDate,
            };
          }
        }
        return t;
      }));
    }
  }, [draggingGanttTask, resizingGanttTask, pixelsPerDay, tasks, setProjectTasks]);

  // Handle Gantt chart mouse up to finalize drag/resize
  const handleGanttMouseUp = useCallback(() => {
    if (draggingGanttTask) {
      showToast('Task moved successfully!', 'success');
    } else if (resizingGanttTask) {
      showToast('Task resized successfully!', 'success');
    }
    setDraggingGanttTask(null);
    setResizingGanttTask(null);
  }, [draggingGanttTask, resizingGanttTask, showToast]);

  // Attach/detach mouse event listeners
  useEffect(() => {
    const chartElement = ganttChartRef.current;
    if (chartElement) {
      chartElement.addEventListener('mousemove', handleGanttMouseMove);
      chartElement.addEventListener('mouseup', handleGanttMouseUp);
      // Add global listeners for mouseup to catch releases outside the chart area
      document.addEventListener('mouseup', handleGanttMouseUp);
    }
    return () => {
      if (chartElement) {
        chartElement.removeEventListener('mousemove', handleGanttMouseMove);
        chartElement.removeEventListener('mouseup', handleGanttMouseUp);
      }
      document.removeEventListener('mouseup', handleGanttMouseUp);
    };
  }, [handleGanttMouseMove, handleGanttMouseUp]);


  // Zoom functions
  const zoomIn = () => setPixelsPerDay(prev => Math.min(prev + 20, 300)); // Max zoom
  const zoomOut = () => setPixelsPerDay(prev => Math.max(prev - 20, 50)); // Min zoom

  // Scroll to today function
  const scrollToToday = useCallback(() => {
    if (ganttChartRef.current) {
      const todayDiffDays = (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      const scrollPosition = todayDiffDays * pixelsPerDay - (ganttChartRef.current.clientWidth / 2);
      ganttChartRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [minDate, pixelsPerDay, today]);

  // Effect to scroll to today initially
  useEffect(() => {
    scrollToToday();
  }, [scrollToToday, tasks.length]); // Scroll once tasks are loaded/rendered

  // Handle click outside edit popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editPopoverRef.current && !editPopoverRef.current.contains(event.target)) {
        setEditingGanttTask(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to open edit popover
  const openEditPopover = useCallback((task, e) => {
    e.stopPropagation(); // Prevent drag/resize from starting
    const rect = e.currentTarget.getBoundingClientRect();
    setEditingGanttTask({
      task: { ...task }, // Create a copy to edit
      position: { x: rect.left + rect.width / 2, y: rect.bottom + 10 } // Position below the task bar
    });
  }, []);

  // Function to save edits from popover
  const saveEditedGanttTask = useCallback(() => {
    if (editingGanttTask && editingGanttTask.task) {
      setProjectTasks(prevTasks => prevTasks.map(t =>
        t.id === editingGanttTask.task.id ? editingGanttTask.task : t
      ));
      showToast('Task details updated!', 'success');
      setEditingGanttTask(null);
    }
  }, [editingGanttTask, setProjectTasks, showToast]);

  // Calculate total height needed for task rows
  const taskRowsHeight = tasks.length * 60; // 60px height per task row
  const minChartHeight = 300; // Minimum height for the chart area
  const totalChartHeight = Math.max(minChartHeight, taskRowsHeight);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-bold text-indigo-700 mb-4">Project Timeline (Gantt Chart)</h3>

      {/* Zoom and Scroll to Today Controls */}
      <div className="flex justify-end mb-4 space-x-2">
        <button
          onClick={zoomOut}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 transition-colors"
        >
          Zoom Out
        </button>
        <button
          onClick={zoomIn}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 transition-colors"
        >
          Zoom In
        </button>
        <button
          onClick={scrollToToday}
          className="px-3 py-1 bg-indigo-500 text-white rounded-md shadow-sm hover:bg-indigo-600 transition-colors"
        >
          Scroll to Today
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg" ref={ganttChartRef} style={{ height: `${totalChartHeight}px` }}>
        <div className="relative" style={{ width: chartWidth }}>
          {/* Date Headers (Weekly/Daily) */}
          <div className="flex h-16 border-b border-gray-300 bg-gray-50 sticky top-0 z-10">
            {days.map((date, index) => {
              const isTodayColumn = formatDateToYYYYMMDD(date) === formatDateToYYYYMMDD(today);
              const isSunday = date.getDay() === 0; // Sunday
              const isMonday = date.getDay() === 1; // Monday

              return (
                <div
                  key={index}
                  className={`flex-shrink-0 flex flex-col justify-center items-center border-r border-gray-200
                    ${isTodayColumn ? 'bg-indigo-100 font-semibold text-indigo-800' : ''}
                    ${isSunday ? 'bg-blue-50' : ''}
                  `}
                  style={{ width: pixelsPerDay }}
                >
                  <span className="text-xs text-gray-600">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-sm font-medium">{date.getDate()}</span>
                  {isMonday && (
                    <span className="absolute top-0 left-0 -translate-x-1/2 text-xs text-gray-500 font-semibold mt-1">
                      {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid Lines and Alternating Rows */}
          <div className="absolute inset-0 flex flex-col">
            {/* Horizontal Lines for Task Rows */}
            {tasks.map((_, index) => (
              <div
                key={`row-bg-${index}`}
                className={`w-full h-[60px] ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`} // Alternating row background
                style={{ top: `${index * 60 + 5}px`, position: 'absolute' }}
              ></div>
            ))}
            {/* Vertical Grid Lines */}
            <div className="absolute inset-0 flex">
              {days.map((date, index) => (
                <div
                  key={`grid-${index}`}
                  className={`flex-shrink-0 border-r border-gray-100 ${date.getDay() === 0 ? 'border-r-2 border-blue-200' : ''}`}
                  style={{ width: pixelsPerDay, height: '100%' }}
                ></div>
              ))}
            </div>
          </div>

          {/* "Today" Indicator Line */}
          {ganttChartRef.current && (
            <div
              className="absolute top-0 bottom-0 bg-indigo-500 w-0.5 z-20"
              style={{
                left: `${((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay}px`
              }}
            ></div>
          )}


          {/* Task Bars */}
          <div className="relative pt-2 pb-4">
            {tasks.map((task, taskIndex) => {
              if (!task.targetStartDate || !task.deadlineDate) return null;

              const startDate = new Date(task.targetStartDate);
              const deadlineDate = new Date(task.deadlineDate);

              // Calculate left position (days from minDate * pixelsPerDay)
              const startDiffDays = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
              const left = startDiffDays * pixelsPerDay;

              // Calculate width (duration in days * pixelsPerDay)
              const durationDays = (deadlineDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
              const width = Math.max(pixelsPerDay / 2, (durationDays + 1) * pixelsPerDay); // Min width of half a day

              // Determine status for coloring
              const now = new Date();
              const isCompleted = task.status === 'Completed';
              const isOverdue = !isCompleted && now > deadlineDate;
              const isOngoing = !isCompleted && now >= startDate && now <= deadlineDate;

              //let bgColorClass = 'bg-blue-500'; // Planned
              let gradientClass = 'from-blue-500 to-blue-600';
              let textColorClass = 'text-white';

              if (isCompleted) {
                bgColorClass = 'bg-green-500';
                gradientClass = 'from-green-500 to-green-600';
              } else if (isOverdue) {
                bgColorClass = 'bg-red-500';
                gradientClass = 'from-red-500 to-red-600';
              } else if (isOngoing) {
                bgColorClass = 'bg-yellow-500';
                gradientClass = 'from-yellow-500 to-yellow-600';
                textColorClass = 'text-gray-900'; // Dark text for yellow background
              }

              // Calculate progress bar width
              const progressPercentage = task.progress ? Math.max(0, Math.min(100, task.progress)) : 0;
              const progressBarWidth = `${progressPercentage}%`;


              return (
                <div
                  key={task.id}
                  className={`absolute h-12 rounded-md px-2 flex items-center shadow-lg cursor-grab active:cursor-grabbing group
                              bg-gradient-to-r ${gradientClass} ${textColorClass}`} // Increased height, applied gradient, shadow-lg
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    top: `${taskIndex * 60 + 5}px`, // Stack tasks vertically, adjusted top for new height
                    zIndex: draggingGanttTask?.taskId === task.id || resizingGanttTask?.taskId === task.id ? 20 : 10,
                  }}
                  onMouseDown={(e) => handleGanttMouseDown(e, task.id, 'move')}
                  onClick={(e) => openEditPopover(task, e)} // Open edit popover on click
                >
                  <span className={`text-sm font-semibold truncate ${textColorClass}`}>{task.name}</span>

                  {/* Progress Bar */}
                  {progressPercentage > 0 && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-50 rounded-full"
                      style={{ width: progressBarWidth }}
                    ></div>
                  )}

                  {/* Left Resize Handle */}
                  <div
                    className="absolute top-0 bottom-0 left-0 w-2 rounded-l-md cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black bg-opacity-20"
                    onMouseDown={(e) => handleGanttMouseDown(e, task.id, 'left-handle')}
                  ></div>
                  {/* Right Resize Handle */}
                  <div
                    className="absolute top-0 bottom-0 right-0 w-2 rounded-r-md cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black bg-opacity-20"
                    onMouseDown={(e) => handleGanttMouseDown(e, task.id, 'right-handle')}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        <span className="inline-block w-4 h-4 rounded-full bg-blue-500 mr-1"></span> Planned &nbsp;
        <span className="inline-block w-4 h-4 rounded-full bg-green-500 mr-1"></span> Completed &nbsp;
        <span className="inline-block w-4 h-4 rounded-full bg-yellow-500 mr-1"></span> Ongoing &nbsp;
        <span className="inline-block w-4 h-4 rounded-full bg-red-500 mr-1"></span> Overdue
      </p>

      {/* Task Edit Popover */}
      {editingGanttTask && (
        <div
          ref={editPopoverRef}
          className="absolute bg-white rounded-lg shadow-xl p-4 z-30 border border-gray-200"
          style={{
            left: editingGanttTask.position.x,
            top: editingGanttTask.position.y,
            transform: 'translateX(-50%)', // Center horizontally
          }}
        >
          <h4 className="font-bold text-indigo-700 mb-3">Edit Task</h4>
          <div className="space-y-3">
            <div>
              <label htmlFor="editTaskName" className="block text-xs font-medium text-gray-700">Task Name</label>
              <input
                type="text"
                id="editTaskName"
                value={editingGanttTask.task.name || ''}
                onChange={(e) => setEditingGanttTask(prev => ({ ...prev, task: { ...prev.task, name: e.target.value } }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="editTargetStartDate" className="block text-xs font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                id="editTargetStartDate"
                value={editingGanttTask.task.targetStartDate || ''}
                onChange={(e) => setEditingGanttTask(prev => ({ ...prev, task: { ...prev.task, targetStartDate: e.target.value } }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="editDeadlineDate" className="block text-xs font-medium text-gray-700">Deadline Date</label>
              <input
                type="date"
                id="editDeadlineDate"
                value={editingGanttTask.task.deadlineDate || ''}
                onChange={(e) => setEditingGanttTask(prev => ({ ...prev, task: { ...prev.task, deadlineDate: e.target.value } }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="editProgress" className="block text-xs font-medium text-gray-700">Progress (%)</label>
              <input
                type="number"
                id="editProgress"
                value={editingGanttTask.task.progress || 0}
                onChange={(e) => setEditingGanttTask(prev => ({ ...prev, task: { ...prev.task, progress: Number(e.target.value) } }))}
                min="0"
                max="100"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="editStatus" className="block text-xs font-medium text-gray-700">Status</label>
              <select
                id="editStatus"
                value={editingGanttTask.task.status || 'Not Started'}
                onChange={(e) => setEditingGanttTask(prev => ({ ...prev, task: { ...prev.task, status: e.target.value } }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="Not Started">Not Started</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setEditingGanttTask(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={saveEditedGanttTask}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;

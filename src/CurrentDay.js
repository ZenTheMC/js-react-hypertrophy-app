import React, { useState, useEffect } from "react";
import Calendar from './Calendar';
import MesoInfo from './MesoInfo';
import { getMesocycles, updateMesocycleCompletionStatus } from './FirebaseFunctions';

const CurrentDay = ({ userId }) => {

  const [currentWeek, setCurrentWeek] = useState();
  const [currentDay, setCurrentDay] = useState("");

  const [mesocycle, setMesocycle] = useState({
    name: "",
    weeks: "",
    days: [],
  });

  const handleSelectDay = (week, dayOfWeek) => {
    setCurrentWeek(week);
    setCurrentDay(dayOfWeek);
  };

  // Fetch mesocycle data from Firebase
  const fetchMesocycleData = async () => {
    try {
        const mesocycles = await getMesocycles(userId);
        if (mesocycles && mesocycles.length > 0) {
            // Sort by completion status and creation time
            mesocycles.sort((a, b) => {
                if (a.completed && !b.completed) return 1;
                if (!a.completed && b.completed) return -1;
                return b.createdAt.seconds - a.createdAt.seconds;  // Most recent comes first
            });

            setMesocycle(mesocycles[0]);  // Fetch the first mesocycle based on sorted conditions
        } else {
            console.log("No mesocycles found for the user!");
        }
    } catch (error) {
        console.error("Error fetching mesocycle data:", error);
    }
  };

  useEffect(() => {
    fetchMesocycleData();
  }, []);

  const handleWorkoutCompletion = (userId, mesocycleId) => {
    // Update workout data, etc.

    // Check if it's the last day of the last week
    if (currentWeek === mesocycle.weeks && currentDay === mesocycle.days[mesocycle.days.length - 1].dayOfWeek) {
        updateMesocycleCompletionStatus(userId, mesocycleId);  // This function will update the status in Firebase
    } else {
        // Logic to proceed to the next day or week
    }
  };

  return (
    <div>
      <h1>{mesocycle.name}</h1>
      <div>
        Week: {currentWeek} <br />
        Day: {currentDay}
      </div>
      <Calendar
        weeks={mesocycle.weeks}
        days={mesocycle.days}
        onSelectDay={handleSelectDay}
      />
      {/* TODO: Add other components such as ExerciseList and ExerciseCards */}
      <MesoInfo name={mesocycle.name} currentWeek={currentWeek} currentDay={currentDay} />
    </div>
  );
};

export default CurrentDay;

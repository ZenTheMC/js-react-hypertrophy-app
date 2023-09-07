import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "./Firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Calendar from './Calendar';
import MesoInfo from './MesoInfo';
import { getMesocycles, updateMesocycleCompletionStatus } from './FirebaseFunctions';
import styles from './CurrentDay.module.css';

const CurrentDay = ({ userId }) => {

  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState("");
  const [exerciseSets, setExerciseSets] = useState({});
  const [currentMesocycleId, setCurrentMesocycleId] = useState(null);

  const [mesocycle, setMesocycle] = useState({
    name: "",
    weeks: "",
    days: [[]],
  });

  const handleSelectDay = async (week, day) => {
    setCurrentWeek(week);
    setCurrentDay(day.dayOfWeek);

    // Get the exercises for the selected day
    console.log('Logging mesocycle.days:', mesocycle.days);
    console.log('Logging week and day.dayOfWeek:', week, day.dayOfWeek);

    mesocycle.days.flat().forEach(d => {
        console.log(`Week: ${d.week}, Day: ${d.dayOfWeek}`);
    });

    const selectedDayExercises = mesocycle.days.flat().find(d => d.dayOfWeek === day.dayOfWeek && d.week === week);
    console.log("Selected day exercises:", selectedDayExercises);
    const initialSets = {};

    if (selectedDayExercises) {
      selectedDayExercises.exercises.forEach((exercise) => {
        initialSets[exercise.name] = exercise.sets && exercise.sets.length > 0 ? exercise.sets : [ { weight: "", reps: "" }, { weight: "", reps: "" } ];
        console.log("Inspecting exercise:", exercise);
      });
    }
    console.log('Initial exerciseSets after selecting day:', initialSets);
    setExerciseSets(initialSets);
  };

  useEffect(() => {
    setExerciseSets({});
  }, [mesocycle]);  

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

        // Convert the days array to a 2D array with unique exercises
        const daysPerWeek = mesocycles[0].days.length / mesocycles[0].weeks;
        const days2D = Array.from({ length: mesocycles[0].weeks }, (_, i) => {
          const daysOfWeek = mesocycles[0].days.slice(i * daysPerWeek, (i + 1) * daysPerWeek);
          return daysOfWeek.map(day => ({
            ...day,
            exercises: day.exercises.map(exercise => ({
              ...exercise,
            })),
          }));
        });
        console.log('Original days array:', mesocycles[0].days);
        console.log('Fetched days array:', days2D);

        setCurrentMesocycleId(mesocycles[0].id);
        setMesocycle({ ...mesocycles[0], days: days2D });

      } else {
        console.log("No mesocycles found for the user!");
      }
    } catch (error) {
      console.error("Error fetching mesocycle data:", error);
    }
  };

  useEffect(() => {
    fetchMesocycleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO!!!!!
  // const handleWorkoutCompletion = (userId, mesocycleId) => {
    // Update workout data, etc.

    // Check if it's the last day of the last week
    // if (currentWeek === mesocycle.weeks && currentDay === mesocycle.days[mesocycle.days.length - 1].dayOfWeek) {
    //   updateMesocycleCompletionStatus(userId, mesocycleId);  // This function will update the status in Firebase
    // } else {
      // Logic to proceed to the next day or week
    // }
  // };

  const calculateRIR = (week, totalWeeks) => {
    if (week === totalWeeks) return 8;
    return totalWeeks - week;
  };

  const addSet = (exerciseName) => {
    console.log('addSet is called for exercise:', exerciseName);
    console.log('exerciseSets before adding:', exerciseSets);
    const newSet = { weight: "", reps: "" };

    setExerciseSets(prevSets => {
        const updatedSets = prevSets[exerciseName] ? [...prevSets[exerciseName], newSet] : [newSet];
        console.log("Updated sets:", updatedSets);
        return { ...prevSets, [exerciseName]: updatedSets };
    });
  };

  const removeSet = (exerciseName) => {
    console.log('removeSet is called for exercise:', exerciseName);
    console.log('exerciseSets before removing:', exerciseSets);

    setExerciseSets(prevSets => {
        const updatedSets = prevSets[exerciseName] ? prevSets[exerciseName].slice(0, -1) : [];
        console.log("Updated sets after removal:", updatedSets);
        return { ...prevSets, [exerciseName]: updatedSets };
    });
  };

  const handleSetChange = (exerciseName, setIndex, field, value) => {
    setExerciseSets(prevState => {
      if (!prevState[exerciseName]) {
        console.error(`Exercise "${exerciseName}" not found in exerciseSets.`);
        return prevState;  // Return the previous state unchanged.
      }
      console.log(`handleSetChange called for exercise: ${exerciseName}, setIndex: ${setIndex}, field: ${field}, value: ${value}`);
      console.log('Current exerciseSets state:', prevState);
      const updatedSets = [...prevState[exerciseName]];
      updatedSets[setIndex][field] = value;
      return {
        ...prevState,
        [exerciseName]: updatedSets
      };
    });
  };

  useEffect(() => {
    console.log("exerciseSets has changed:", exerciseSets);
  }, [exerciseSets]);

  const currentDayExercises = useMemo(() => {
    return mesocycle.days.flat().find(day => day.dayOfWeek === currentDay);
  }, [mesocycle.days, currentDay]);
  const currentDayIndex = mesocycle.days.length > 0 ? mesocycle.days[currentWeek - 1].findIndex(day => day.dayOfWeek === currentDay) : -1;

  const logSet = async (weekIndex, dayIndex, exerciseIndex, setIndex, setData) => {
    
    // Calculate the index of the day in the flattened days array
    const flatDayIndex = mesocycle.days.flat().findIndex(day => day.week === currentWeek && day.dayOfWeek === currentDay);

    if (flatDayIndex === -1) {
      console.error("Current day not found in mesocycle.days array");
      return;
    }
    
    try {
      const userId = auth.currentUser.uid;
      const mesocycleId = currentMesocycleId;
      const mesocycleRef = doc(db, 'users', userId, 'mesocycles', mesocycleId);

      // Create the new set data
      const newSetData = {
          completed: true,
          weight: setData.weight,
          reps: setData.reps,
      };

      // Fetch the current mesocycle document
      const mesocycleDoc = await getDoc(mesocycleRef);
      const mesocycleData = mesocycleDoc.data();

      // Update the sets array in the mesocycle data
      if (!mesocycleData.days[flatDayIndex].exercises[exerciseIndex].sets) {
          mesocycleData.days[flatDayIndex].exercises[exerciseIndex].sets = [];
      }
      mesocycleData.days[flatDayIndex].exercises[exerciseIndex].sets[setIndex] = newSetData;

      // Update the sets property of the currentDayExercises object
      const currentDayExercises = mesocycle.days.flat()[flatDayIndex];
      if (currentDayExercises) {
        if (!currentDayExercises.exercises[exerciseIndex].sets) {
          currentDayExercises.exercises[exerciseIndex].sets = [];
        }
        currentDayExercises.exercises[exerciseIndex].sets[setIndex] = newSetData;
      }
      console.log('Updated currentDayExercises:', currentDayExercises);

      // Update the exerciseSets state
      setExerciseSets(prevState => {
        const updatedSets = [...prevState[currentDayExercises.exercises[exerciseIndex].name]];
        updatedSets[setIndex] = newSetData;
        return {
          ...prevState,
          [currentDayExercises.exercises[exerciseIndex].name]: updatedSets
        };
      });

      // Write the entire mesocycle data back to Firestore
      await setDoc(mesocycleRef, mesocycleData);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  console.log('currentDayExercises:', currentDayExercises);

  return (
    <div className={styles.CurrentDay}>
      {console.log('exerciseSets in render:', exerciseSets)}
      <MesoInfo name={mesocycle.name} currentWeek={currentWeek} currentDay={currentDay} />
      {mesocycle.days.length > 0 && mesocycle.days[0].length > 0 && (
        <Calendar
          weeks={mesocycle.weeks}
          days={mesocycle.days}
          onSelectDay={handleSelectDay}
        />
      )}
      <h2 className={styles.Title}>Training Session</h2>
      {currentDayExercises && currentDayExercises.exercises.map((exercise, exerciseIndex) => (
        <div className={styles.Exercise} key={exerciseIndex}>
          <div className={styles.ExerciseNameContainer}>
            <span className={styles.ExerciseName}>{exercise.name}</span>
            <div className={styles.Buttons}>
              <button onClick={() => addSet(exercise.name)}>+</button>
              <button onClick={() => removeSet(exercise.name)}>-</button>
            </div>
          </div>
          <p className={styles.MuscleGroup}>{exercise.muscleGroup}</p>
          <p className={styles.Rir}>RIR {calculateRIR(currentWeek, mesocycle.weeks)}</p>
          {(exerciseSets[exercise.name] || Array(2).fill({ weight: "", reps: "" })).map((set, setIndex) => (
            <div key={setIndex}>
              <input placeholder="Weight" value={set.weight} onChange={(e) => handleSetChange(exercise.name, setIndex, "weight", e.target.value)} />
              <input placeholder="Reps" value={set.reps} onChange={(e) => handleSetChange(exercise.name, setIndex, "reps", e.target.value)} />
              <button onClick={() => logSet(currentWeek - 1, currentDayIndex, exerciseIndex, setIndex, set)}>Log Set</button>
            </div>
          ))}
          {/* Add a button or mechanism to save this data */}
        </div>
      ))}
      {/* TODO: Add other components such as ExerciseList and ExerciseCards */}
    </div>
  );
};

export default CurrentDay;

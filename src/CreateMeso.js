import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DayColumn from "./DayColumn";
import SaveMeso from "./SaveMeso";
import styles from "./CreateMeso.module.css";
import { db } from "./Firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./Firebase";
import { collection, getDocs } from "firebase/firestore";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus } from "@fortawesome/free-solid-svg-icons";

const CreateMeso = () => {
    const [meso, setMeso] = useState({
        days: [
            { dayOfWeek: "", exercises: [{ muscleGroup: "", name: "" }] }
        ]
    });
    const [mesoName, setMesoName] = useState("");
    const [mesoWeeks, setMesoWeeks] = useState("");
    const [exercises, setExercises] = useState([]);
    const [formIsValid, setFormIsValid] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [user] = useAuthState(auth);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const userId = user ? user.uid : null;

    const fetchExercises = async () => {
        const globalExercisesCollection = await getDocs(collection(db, 'globalExercises'));
        const globalExercises = globalExercisesCollection.docs.map(doc => ({
            name: doc.data().exerciseName,
            muscleGroup: doc.data().muscleGroup
        }));

        let userExercises = [];
        if (userId) {
            const userExercisesCollection = await getDocs(collection(db, 'users', userId, 'exercises'));
            userExercises = userExercisesCollection.docs.map(doc => ({
                name: doc.data().exerciseName,
                 muscleGroup: doc.data().muscleGroup
            }));
        }
        setExercises([...globalExercises, ...userExercises]);
    };

    useEffect(() => {
        fetchExercises();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const handleMesoNameChange = (event) => {
        setMesoName(event.target.value);
    };

    const handleMesoWeeksChange = (event) => {
        setMesoWeeks(event.target.value);
    };

    const addDay = () => {
        if (meso.days.length < 6) {
            setMeso(prevMeso => ({
                ...prevMeso,
                days: [...prevMeso.days, { dayOfWeek: "", exercises: [{ muscleGroup: "", name: "" }] }]
            }));
        }
    };

    const handleDayChange = (dayIndex, value) => {
        const newDays = [...meso.days];
        newDays[dayIndex] = { ...newDays[dayIndex], ...value };
        setMeso({ ...meso, days: newDays });
    };

    const deleteDay = (dayIndex) => {
        if (meso.days.length > 1) {
            setMeso(prevMeso => ({ ...prevMeso, days: prevMeso.days.filter((day, index) => index !== dayIndex) }));
        }
    };

    const validateForm = useCallback(() => {
        const weeks = parseInt(mesoWeeks, 10);
        if (!mesoName || !mesoWeeks || weeks < 4 || weeks > 6 || meso.days.length === 0) {
            return false;
        }
    
        for (const day of meso.days) {
            if (!day.dayOfWeek) {
                return false;
            }
    
            for (const exercise of day.exercises) {
                if (!exercise.muscleGroup || !exercise.name) {
                    return false;
                }
            }
        }
    
        return true;
    }, [meso, mesoName, mesoWeeks]);

    useEffect(() => {
        setFormIsValid(validateForm());
    }, [meso, mesoName, mesoWeeks, validateForm]);

    return (
        <div className={styles.CreateMeso}>
            <h1>Create A Mesocycle</h1>
            <div className={styles.Inputs}>
                <input
                    className={`${styles.Input} ${attemptedSubmit && !mesoName ? styles.InvalidInput : ''}`}
                    type="text"
                    name="name"
                    value={mesoName}
                    onChange={handleMesoNameChange}
                    placeholder="Enter Meso Name"
                    required
                />
                <input
                    className={`${styles.Input} ${attemptedSubmit && (!mesoWeeks || mesoWeeks < 4 || mesoWeeks > 6) ? styles.InvalidInput : ''}`}
                    type="number"
                    name="weeks"
                    value={mesoWeeks}
                    onChange={handleMesoWeeksChange}
                    placeholder="Choose 4-6 weeks"
                    max="6"
                    min="4"
                    required
                />
            </div>
            <div className={styles.Days}>
                {meso.days.map((day, dayIndex) => (
                    <DayColumn
                        key={dayIndex}
                        day={day}
                        dayIndex={dayIndex}
                        deleteDay={deleteDay}
                        handleDayChange={handleDayChange}
                        exercises={exercises}
                        attemptedSubmit={attemptedSubmit}
                        fetchExercises={fetchExercises}
                    />
                ))}
                <button className={styles.AddDayButton} onClick={addDay}><FontAwesomeIcon icon={faCalendarPlus}/> Day</button>
            </div>
            <div className={styles.Completion}>
                <SaveMeso 
                    meso={meso}
                    setMeso={setMeso}
                    mesoName={mesoName}
                    setMesoName={setMesoName}
                    mesoWeeks={mesoWeeks}
                    setMesoWeeks={setMesoWeeks}
                    formIsValid={formIsValid}
                    setAttemptedSubmit={setAttemptedSubmit}
                    onSuccessfulSave={() => setShowSuccessModal(true)}
                />
            </div>
            {showSuccessModal && (
                <div className={styles.SuccessModalOverlay} onClick={() => setShowSuccessModal(false)}>
                    <div className={styles.SuccessModal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.Message}>Mesocycle Created Successfully!</h2>
                        <div className={styles.Links}>
                            <Link className={styles.Link} to="/mesocycles">View Mesocycles</Link>
                            <Link className={styles.Link} to="/today">Run Mesocycle</Link>
                        </div>
                        <button className={styles.Close} onClick={() => setShowSuccessModal(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateMeso;
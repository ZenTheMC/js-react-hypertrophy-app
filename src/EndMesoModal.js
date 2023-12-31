import React from 'react';
import styles from './EndMesoModal.module.css';

const EndMesoModal = ({ show, onConfirm, onCancel, onClose }) => {
    if (!show) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3>Are you sure you want to end this mesocycle early?</h3>
                <p>This action <em>cannot be undone!</em></p>
                <div className={styles.buttons}>
                    <button className={styles.confirm} onClick={onConfirm}>Confirm</button>
                    <button className={styles.cancel} onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default EndMesoModal;
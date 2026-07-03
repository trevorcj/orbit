import styles from "./separator.module.css";

function Separator() {
  return (
    <div className={styles.separator}>
      <div className={styles.separator2}>
        <div className={styles.line} />
      </div>
      <div className={styles.labelSeparator}>
        <div className={styles.mutedLine}>
          <div className={styles.enterYourEmail}>{`OR `}</div>
        </div>
      </div>
      <div className={styles.separator2}>
        <div className={styles.line} />
      </div>
    </div>
  );
}

export default Separator;

/**
 * Questionnaire answer data model.
 *
 * All values are pulled from this single model so tests can be reconfigured
 * by changing one object — no need to touch page objects or spec files.
 */
export interface QuestionnaireAnswers {
  /**
   * Date of birth in YYYY-MM-DD format.
   * Must result in an age of 18+ years to pass the eligibility check.
   * Example: '2000-06-15'  (≈ 26 years old)
   */
  dateOfBirth: string;

  /** Biological sex selected on the gender question. */
  gender: 'male' | 'female';

  /**
   * Weight in pounds for the height / weight question.
   * Must yield BMI ≥ 25 to pass the eligibility check.
   * At 6'0" (72 in) a weight of 200 lbs → BMI ≈ 27.1  ✓
   */
  weightLbs: number;

  /** Height: feet component  (e.g. 6  for  6'0"). */
  heightFeet: number;

  /** Height: inches component (0–11, e.g. 0  for  6'0"). */
  heightInches: number;

  /**
   * Systolic blood pressure reading (top number).
   * Valid range: 51–250, must be > diastolicBp.
   */
  systolicBp: string;

  /**
   * Diastolic blood pressure reading (bottom number).
   * Valid range: 31–149, must be < systolicBp.
   */
  diastolicBp: string;

  /**
   * Exact visible text of the medical-condition option to select.
   * When undefined the first available (non-disabled) option is clicked,
   * which is convenient for "None of the above" style answers.
   */
  medicalCondition?: string;
  medicalConditionDetail?: string;

  medications?: string;
  medicationsDetail?: string;

  allergies?: string;
  allergiesDetail?: string;

  weightLost?: string;

  foodCravings?: string;

  appetiteSuppression?: string;

  newHistory?: string;
  newHistoryDetail?: string;

  sideEffects?: string[];

  doctorPcpAcknowledge?: string;

  vomitingAcknowledge?: string;

  abdominalPainAcknowledge?: string;

  commonSideEffects?: string[];

  nauseaAcknowledge?: string;

  constipationAcknowledge?: string;

  continueMedication?: string;

  discontinueConfirm?: string;

  continueMultiDose?: string;

  discontinueMultiDoseConfirm?: string;

  experiencedNausea?: string;

  experiencedFatigue?: string;

  experiencedMuscleMass?: string;

  discontinueImpact?: string[];

  nextPrescriptionDose?: string;

  messageDoctor?: string;

  supportQuestions?: string[];

  /**
   * Absolute path to a video file to upload in the video-upload question.
   * Example: '/Users/foo/Downloads/video_Test.mov'
   */
  videoPath?: string;

  /**
   * Absolute path to a photo/image file to upload in the photo-upload question.
   * Example: '/Users/foo/Downloads/photo.jpg'
   */
  photoPath?: string;
}

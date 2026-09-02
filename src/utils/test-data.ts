import type { TestInfo } from '@playwright/test';
import type { CheckoutData } from '../models/checkout.model';
import type { QuestionnaireAnswers } from '../models/questionnaire.model';
import { environment } from '../config/environment';

/**
 * Creates checkout test data for a specific Playwright test.
 *
 * Uses the static test email configured in environment / .env.
 */
export function checkoutData(testInfo?: TestInfo): CheckoutData {
  return {
    email: environment.email,

    firstName: environment.firstName,

    lastName: environment.lastName,

    address: environment.address,

    city: environment.city,

    state: environment.state,

    zipCode: environment.zip,

    phone: environment.phone,

    cardNumber: environment.cardNumber,

    expirationDate: environment.expirationDate,

    cvv: environment.cvv,
  };
}

/**
 * Default questionnaire answers used in smoke tests.
 *
 * All values are chosen to pass every eligibility validation in the quiz:
 *
 *  • dateOfBirth  — 2000-06-15  → age ≈ 26 years  (must be ≥ 18)
 *  • weight / height — 200 lbs, 6'0"  → BMI ≈ 27.1  (must be ≥ 25)
 *  • blood pressure  — 120/90  → within valid range and systolic > diastolic
 *
 * Change any value here to adjust behaviour across all tests without
 * modifying page objects or spec files.
 */
export function questionnaireAnswers(): QuestionnaireAnswers {
  return {
    /** 26 years old — clears the 18+ age-verification check. */
    dateOfBirth: '2000-06-15',

    /** Select Male on the gender card screen. */
    gender: 'male',

    /** 200 lbs at 6ft 0in → BMI ≈ 27.1 — clears the BMI ≥ 25 check. */
    weightLbs: 200,
    heightFeet: 6,
    heightInches: 0,

    /** 120/90 — valid range, systolic > diastolic. */
    systolicBp: '120',
    diastolicBp: '90',

    /**
     * Leave undefined to auto-select the first non-disabled option.
     * Set to an exact option label string to target a specific choice.
     * Example: 'None of the above'
     */
    medicalCondition: 'Yes - Please list the medical conditions',
    medicalConditionDetail: 'Test',

    medications: 'Yes - Please list the names and dosages',
    medicationsDetail: 'Test',

    allergies: 'Yes - Please list drug allergies and any known reaction',
    allergiesDetail: 'Test',

    weightLost: '13-20 pounds',

    foodCravings: 'Sometimes',

    appetiteSuppression: "I'm always hungry!",

    newHistory: 'Yes I do',
    newHistoryDetail: 'Test',

    sideEffects: [
      'Having side effects, but I can handle them',
      'Significant vomiting',
      'Abdominal pain that concerns me'
    ],

    doctorPcpAcknowledge: 'I acknowledge the above',

    vomitingAcknowledge: 'I acknowledge the above',

    abdominalPainAcknowledge: 'I acknowledge the above',

    commonSideEffects: [
      'Tell me more about CONSTIPATION',
      'Tell me more about INDIGESTION/REFLUX'
    ],

    nauseaAcknowledge: 'I acknowledge the above',

    constipationAcknowledge: 'I acknowledge the above',

    continueMedication: 'I DO NOT agree',

    discontinueConfirm: 'Yes',
    
    continueMultiDose: 'I DO NOT agree',

    discontinueMultiDoseConfirm: 'Yes',

    experiencedNausea: 'Yes',

    experiencedFatigue: 'Yes',

    experiencedMuscleMass: 'Yes',

    discontinueImpact: [
      'Significant weight gain',
      'Depression',
      'Anxiety'
    ],

    nextPrescriptionDose: 'Stay at the same dose',

    messageDoctor: 'Hi Test',

    supportQuestions: [
      'Billing',
      'Shipping',
      'Changing your shipping address'
    ],

    /**
     * Absolute paths sourced from environment / .env so the correct
     * files are used without hardcoding paths in the spec.
     */
    videoPath: environment.videoPath,

    photoPath: environment.photoPath,
  };
}

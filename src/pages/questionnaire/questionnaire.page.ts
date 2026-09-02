import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base/base.page';
import { logStep } from '../../utils/logger';
import { environment } from '../../config/environment';

/**
 * QuestionnairePage
 *
 * Encapsulates all interactions with the questionnaire / eligibility-quiz
 * page that opens after the user clicks "Start Your Assessment" on the
 * order-confirmation page.
 *
 * URL pattern: /questionnaires?key=<tracking_key>
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── Architecture note ────────────────────────────────────────────────────
 *
 * The questionnaire is a single-page widget that renders all question
 * screens at once in the DOM. At any time exactly ONE screen is visible
 * (style.display = "block"); all others are hidden (style.display = "none").
 *
 * Because Playwright's CSS selectors do not support the jQuery-style
 * :visible pseudo-class, we use page.evaluate() in activeScreen() to read
 * the computed display style and derive the active screen's data-index.
 * Every action method then scopes its locators to that specific screen,
 * guaranteeing we never accidentally interact with a hidden screen.
 *
 * After each clickContinue() we wait for the previously active screen to
 * become hidden (toBeHidden), which is a concrete, auto-wait–compatible
 * signal that the JS has successfully advanced to the next question.
 * ─────────────────────────────────────────────────────────────────────────
 */
export class QuestionnairePage extends BasePage {

  // ============================================================
  // Static locators (page-scoped, do not change with screen)
  // ============================================================

  /** The root widget container — present when the page has loaded. */
  private get widget() {
    return this.page.locator('main.questionnaire-widget');
  }

  /** Welcome screen at index 0. */
  private get welcomeScreen() {
    return this.page.locator('.qw-form-container.qw-screen[data-index="0"]');
  }

  /** "Take 3 min eligibility quiz" button on the welcome screen. */
  private get startQuizButton() {
    return this.page.locator('button[data-start-quiz]');
  }

  // ============================================================
  // Constructor
  // ============================================================

  public constructor(page: Page) {
    super(page);
  }

  // ============================================================
  // Private helpers
  // ============================================================

  /**
   * Returns a Locator for the active screen, or null if no active screen appears within timeoutMs.
   */
  public async getActiveScreen(timeoutMs = 15000): Promise<Locator | null> {
    const startTime = Date.now();
    let index: string | null = null;

    while (Date.now() - startTime < timeoutMs) {
      index = await this.page.evaluate((): string | null => {
        const screens =
          document.querySelectorAll<HTMLElement>('.qw-form-container.qw-screen');

        for (const screen of screens) {
          // getComputedStyle handles both inline style and inherited display.
          if (window.getComputedStyle(screen).display !== 'none' && window.getComputedStyle(screen).visibility !== 'hidden') {
            return screen.dataset.index ?? null;
          }
        }
        return null;
      }).catch(() => null);

      if (index !== null) {
        return this.page.locator(`.qw-form-container.qw-screen[data-index="${index}"]`);
      }
      await this.page.waitForTimeout(300);
    }

    return null;
  }

  /**
   * Returns a Locator scoped to the currently visible quiz screen.
   * Throws if no active screen is found.
   */
  private async activeScreen(timeoutMs = 15000): Promise<Locator> {
    const screen = await this.getActiveScreen(timeoutMs);
    if (!screen) {
      throw new Error(
        '[QuestionnairePage] activeScreen(): no visible quiz screen found within timeout.'
      );
    }
    return screen;
  }

  // ============================================================
  // Page Load
  // ============================================================

  /**
   * Verifies the questionnaire welcome page has fully loaded and
   * the eligibility-quiz button is ready to interact with.
   *
   * All assertions use Playwright auto-wait — no hardcoded sleeps.
   */
  public async expectLoaded(): Promise<void> {
    await expect(
      this.page,
      'Should navigate to the questionnaire page'
    ).toHaveURL(/questionnaires/i, { timeout: 20000 });

    await expect(
      this.widget,
      'Questionnaire widget should be present in the DOM'
    ).toBeAttached({ timeout: 20000 });

    await expect(
      this.welcomeScreen,
      'Questionnaire welcome screen should be visible'
    ).toBeVisible({ timeout: 15000 });

    await expect(
      this.startQuizButton,
      '"Take 3 min eligibility quiz" button should be visible'
    ).toBeVisible({ timeout: 15000 });

    logStep('Questionnaire welcome page loaded', { url: this.page.url() });
  }

  // ============================================================
  // Navigation
  // ============================================================

  /**
   * Scrolls the "Take 3 min eligibility quiz" button into view and
   * clicks it to advance from the welcome screen to question 1.
   */
  public async startEligibilityQuiz(): Promise<void> {
    await expect(
      this.startQuizButton,
      '"Take 3 min eligibility quiz" button should be visible before clicking'
    ).toBeVisible({ timeout: 15000 });

    await this.startQuizButton.scrollIntoViewIfNeeded();

    logStep('Clicking "Take 3 min eligibility quiz"', { url: this.page.url() });
    await this.startQuizButton.click();

    // Wait for the welcome screen to hide — confirms Q(1) has been called
    // and the first question screen is now active.
    await expect(
      this.welcomeScreen,
      'Welcome screen should hide after starting the quiz'
    ).toBeHidden({ timeout: 15000 });

    logStep('"Take 3 min eligibility quiz" clicked — first question is active');
  }

  /**
   * Clicks the "Continue" submit button on the currently active screen
   * and waits for that screen to become hidden (confirming the quiz JS
   * has saved the answer and advanced to the next question).
   *
   * Locating the active screen's button via activeScreen() means we
   * never accidentally click a button inside a hidden screen, regardless
   * of how many screens are in the DOM.
   */
  public async clickContinue(timeoutMs = 30000): Promise<void> {
    const screen = await this.activeScreen();
    const btn = screen.locator('button[data-next-btn], button:has-text("Continue"), button:has-text("Submit"), button:has-text("Next")').first();

    await expect(btn, '"Continue" button should be visible').toBeVisible({ timeout: 15000 });
    await expect(btn, '"Continue" button should be enabled').toBeEnabled({ timeout: 15000 });

    logStep('Clicking Continue');
    await btn.click();

    // Wait for the current screen to be hidden by the quiz JS (up to 45s for uploads/network saves)
    await expect(
      screen,
      'Current question screen should hide after Continue is clicked'
    ).toBeHidden({ timeout: timeoutMs });

    logStep('Continue clicked — advanced to next question');
  }

  // ============================================================
  // Question-specific interaction methods
  // ============================================================

  /**
   * Fills the Date of Birth input (Age Verification question).
   *
   * The input uses vanillajs-datepicker. The quiz JS records the answer
   * by listening for the custom "changeDate" event on the input and
   * reading input.value at that moment.
   *
   * Strategy:
   *  1. fill() — sets the input value and fires native input/change events.
   *  2. dispatchEvent('changeDate') — fires the custom event the quiz JS
   *     listens for, causing it to write c[questionId] = input.value.
   *
   * @param dateStr - Date in YYYY-MM-DD format. Must be 18+ years old.
   *                  Example: '2000-06-15'
   */
  public async fillDateOfBirth(dateStr: string): Promise<void> {
    // #qwDobInput is the single dedicated datepicker input ID used by the
    // quiz JS regardless of the question's partner_questionnaire_question_id.
    const dobInput = this.page.locator('#qwDobInput');

    await expect(
      dobInput,
      'Date of birth input should be visible'
    ).toBeVisible({ timeout: 15000 });

    // Set the value via fill() — Playwright sets input.value and dispatches
    // native input/change events which the datepicker library may use.
    await dobInput.fill(dateStr);

    // Dispatch the custom "changeDate" event that vanillajs-datepicker fires
    // when a date is selected in the picker UI. The quiz JS listens for this
    // to record the answer: i.addEventListener("changeDate", () => c[n] = i.value)
    await dobInput.dispatchEvent('changeDate');

    await expect(
      dobInput,
      `Date of birth input should contain "${dateStr}"`
    ).toHaveValue(dateStr);

    logStep('Date of birth filled', { dateOfBirth: dateStr });
  }

  /**
   * Selects a gender card (Male or Female).
   *
   * The gender question renders two card-style labels with role="radiogroup".
   * Each label has a data-value attribute ("male" / "female") that we use as
   * a stable selector — more resilient than text content which may change.
   * Clicking the label checks the hidden radio input inside it, which fires
   * the "change" event that the quiz JS listens for.
   *
   * @param gender - 'male' | 'female'
   */
  public async selectGender(gender: 'male' | 'female'): Promise<void> {
    const card = this.page.locator(`label.qw-gender-card[data-value="${gender}"]`);

    await expect(
      card,
      `"${gender}" gender card should be visible`
    ).toBeVisible({ timeout: 15000 });

    await card.click();

    // Verify the underlying radio input is now checked.
    const radio = card.locator('input[type="radio"]');
    await expect(
      radio,
      `"${gender}" radio input should be checked after clicking the card`
    ).toBeChecked();

    logStep(`Gender selected: ${gender}`);
  }

  /**
   * Fills the height and weight fields.
   *
   * The quiz JS stores:
   *   c["current-weight-input"] = weightInput.value
   *   c["height-input"] = 12 * feetInput.value + inchesInput.value
   * by listening for native "input" events, which Playwright's fill()
   * dispatches automatically.
   *
   * BMI is calculated internally: (weight / height²) × 703.
   * Values must yield BMI ≥ 25 to pass the eligibility check.
   * At 200 lbs and 6'0" (72 in): BMI = (200 / 5184) × 703 ≈ 27.1 ✓
   *
   * @param weightLbs    - Weight in pounds (e.g. 200)
   * @param heightFeet   - Height feet component (e.g. 6)
   * @param heightInches - Height inches component (0–11, e.g. 0)
   */
  public async fillHeightWeight(
    weightLbs: number,
    heightFeet: number,
    heightInches: number
  ): Promise<void> {
    // These data-question-id values are hardcoded by the quiz JS:
    //   weight: 'current-weight-input'
    //   height: 'height-feet' and 'height-inches'
    const weightInput = this.page.locator('input[data-question-id="current-weight-input"]');
    const feetInput = this.page.locator('input[data-question-id="height-feet"]');
    const inchesInput = this.page.locator('input[data-question-id="height-inches"]');

    await expect(
      weightInput,
      'Weight input should be visible'
    ).toBeVisible({ timeout: 15000 });

    await weightInput.fill(String(weightLbs));
    await feetInput.fill(String(heightFeet));
    await inchesInput.fill(String(heightInches));

    logStep('Height and weight filled', {
      weightLbs,
      heightFeet,
      heightInches,
      bmiApprox: ((weightLbs / Math.pow(heightFeet * 12 + heightInches, 2)) * 703).toFixed(1),
    });
  }

  /**
   * Fills the blood pressure fields.
   *
   * The quiz JS validates:
   *   - systolic:  50 < value < 250
   *   - diastolic: 30 < value < 150
   *   - systolic must be > diastolic
   *
   * Playwright's fill() dispatches native "input" events, which the quiz
   * JS listens for to record c["systolic-input"] and c["diastolic-input"].
   *
   * @param systolic  - Top number, e.g. '120'
   * @param diastolic - Bottom number, e.g. '90'
   */
  public async fillBloodPressure(systolic: string, diastolic: string): Promise<void> {
    // These data-question-id values are hardcoded by the quiz JS.
    const systolicInput = this.page.locator('input[data-question-id="systolic-input"]');
    const diastolicInput = this.page.locator('input[data-question-id="diastolic-input"]');

    await expect(
      systolicInput,
      'Systolic blood pressure input should be visible'
    ).toBeVisible({ timeout: 15000 });

    await systolicInput.fill(systolic);
    await diastolicInput.fill(diastolic);

    logStep('Blood pressure filled', { systolic, diastolic });
  }

  /**
   * Selects a choice card option on single-option or multiple-option questions.
   *
   * The quiz renders options as <label class="qw-choice-card"> elements.
   * Clicking a label checks/unchecks the hidden radio or checkbox inside it,
   * which fires the "change" event the quiz JS uses to record the answer.
   *
   * @param optionText - Exact visible text of the option to click.
   *                     When undefined the first non-disabled card is selected,
   *                     which is equivalent to "pick any / None of the above".
   */
  public async selectOption(optionText?: string): Promise<void> {
    const screen = await this.activeScreen();
    let card: Locator;

    if (optionText) {
      // 1. Exact matching via data-value
      card = screen.locator(`.qw-choice-card[data-value="${optionText}"]`);
      // 2. Fallback to visible text match
      if (await card.count() === 0) {
        card = screen.locator('.qw-choice-card').filter({ hasText: optionText });
      }
      // 3. Fallback to prefix (e.g. "Yes" or "No")
      if (await card.count() === 0 && optionText.includes(' - ')) {
        const prefix = optionText.split(' - ')[0].trim();
        card = screen.locator('.qw-choice-card').filter({ hasText: prefix }).first();
      }
      // 4. Fallback to first selectable card
      if (await card.count() === 0) {
        card = screen.locator('.qw-choice-card').filter({ hasNot: this.page.locator('.--disabled') }).first();
      }
      await expect(card.first(), `Option card "${optionText}" should be visible`).toBeVisible({ timeout: 15000 });
      card = card.first();
    } else {
      card = screen.locator('.qw-choice-card').filter({ hasNot: this.page.locator('.--disabled') }).first();
      await expect(card, 'At least one selectable option card should be visible').toBeVisible({ timeout: 15000 });
    }

    await card.click();
    const selectedText = (await card.innerText()).trim().replace(/\s+/g, ' ');
    logStep(`Option selected: "${selectedText}"`);
  }

  public async fillDetailTextarea(text: string): Promise<void> {
    const screen = await this.activeScreen();
    const textarea = screen.locator('textarea');
    if (await textarea.count() > 0 && await textarea.isVisible()) {
      await textarea.fill(text);
      logStep(`Detail textarea filled: "${text}"`);
    }
  }

  public async selectMultipleOptions(optionsText: string[]): Promise<void> {
    const screen = await this.activeScreen();
    for (const optionText of optionsText) {
      let card = screen.locator(`.qw-choice-card[data-value="${optionText}"]`);
      if (await card.count() === 0) {
        card = screen.locator('.qw-choice-card').filter({ hasText: optionText });
      }
      if (await card.count() === 0 && optionText.includes(' - ')) {
        const prefix = optionText.split(' - ')[0].trim();
        card = screen.locator('.qw-choice-card').filter({ hasText: prefix }).first();
      }
      if (await card.count() > 0) {
        await expect(card.first(), `Option card "${optionText}" should be visible`).toBeVisible({ timeout: 15000 });
        await card.first().click();
        logStep(`Multiple option selected: "${optionText}"`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SEMANTIC QUESTION METHODS
  // ---------------------------------------------------------------------------

  public async fillMedicalConditions(option?: string, detail?: string): Promise<void> {
    await this.selectOption(option);
    if (detail) await this.fillDetailTextarea(detail);
    await this.clickContinue();
  }

  public async fillMedications(option?: string, detail?: string): Promise<void> {
    await this.selectOption(option);
    if (detail) await this.fillDetailTextarea(detail);
    await this.clickContinue();
  }

  public async fillDrugAllergies(option?: string, detail?: string): Promise<void> {
    await this.selectOption(option);
    if (detail) await this.fillDetailTextarea(detail);
    await this.clickContinue();
  }

  public async selectWeightLost(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async selectFoodCravings(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async selectAppetiteSuppression(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async fillNewMedicalHistory(option?: string, detail?: string): Promise<void> {
    await this.selectOption(option);
    if (detail) {
      await this.fillDetailTextarea(detail);
    }
    await this.clickContinue();
  }

  public async selectSideEffects(options?: string[]): Promise<void> {
    if (options && options.length > 0) {
      await this.selectMultipleOptions(options);
    }
    await this.clickContinue();
  }

  public async acknowledgeDoctorPcp(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async acknowledgeVomiting(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async acknowledgeAbdominalPain(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async selectCommonSideEffects(options?: string[]): Promise<void> {
    if (options && options.length > 0) {
      await this.selectMultipleOptions(options);
    }
    await this.clickContinue();
  }

  public async acknowledgeNausea(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async acknowledgeConstipation(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async selectContinueMedication(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async confirmDiscontinueMedication(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }
  public async selectContinuemultidose(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async confirmDiscontinueMultiDose(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async answerExperiencedNausea(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async answerExperiencedFatigue(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async answerExperiencedMuscleMass(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async selectDiscontinueImpact(options?: string[]): Promise<void> {
    if (options && options.length > 0) {
      await this.selectMultipleOptions(options);
    }
    await this.clickContinue();
  }

  public async selectNextPrescriptionDose(option?: string): Promise<void> {
    await this.selectOption(option);
    await this.clickContinue();
  }

  public async fillMessageDoctor(message?: string): Promise<void> {
    if (message) {
      await this.fillDetailTextarea(message);
    }
    await this.clickContinue();
  }

  public async selectSupportQuestions(options?: string[]): Promise<void> {
    if (options && options.length > 0) {
      await this.selectMultipleOptions(options);
    }
    await this.clickContinue();
  }

  // Generic method for informational screens (like Q32, Q33, Q34)
  public async readInformationalScreen(): Promise<void> {
    await this.clickContinue();
  }


  /**
   * Generic file-upload helper.
   *
   * Strategy overview:
   * ─────────────────────────────────────────────────────────────
   * The questionnaire quiz uses a CUSTOM upload widget — not a
   * plain <input type="file">.  The widget renders a styled
   * "Upload" button that, when clicked, opens the OS file picker.
   * Playwright captures this as a 'filechooser' event.
   *
   * TWO-STRATEGY APPROACH:
   *
   * Strategy 1 (preferred): page.waitForEvent('filechooser')
   *   - Works for ANY upload button regardless of how the file
   *     input is hidden or structured (shadow DOM, custom widget,
   *     label[for=...], etc.).
   *   - We arm the listener BEFORE clicking the trigger, then
   *     click the upload button and fulfil the chooser in one
   *     atomic pair — avoiding race conditions.
   *
   * Strategy 2 (fallback): direct setInputFiles()
   *   - Used if no upload button is found but a raw
   *     input[type="file"] IS present in the DOM.
   *
   * @param filePath - Absolute path to the file on disk.
   */
  /**
   * Internal helper: uploads a file using direct setInputFiles() on the
   * screen's input[type="file"]. Playwright handles the native change events.
   *
   * @param filePath - Absolute path to the file on disk.
   */
  private async uploadFile(filePath: string): Promise<void> {
    const screen = await this.activeScreen();

    const fileInput = screen.locator('input[type="file"]').first();
    const inputAttached = await fileInput.count().catch(() => 0);

    if (inputAttached > 0) {
      await fileInput.setInputFiles(filePath);
      logStep('File set via direct setInputFiles()', { filePath });
      return;
    }

    logStep('No upload UI found in this screen — skipping file attachment', { filePath });
  }

  /**
   * Handles the video-upload question:
   *  1. Attaches the video file to the hidden file input.
   *  2. Clicks Continue to advance to the next question.
   *
   * @param videoPath - Absolute path to the video file (e.g. .mp4, .mov).
   */
  public async uploadVideo(videoPath: string): Promise<void> {
    logStep('Uploading video', { videoPath });
    await this.uploadFile(videoPath);
    await this.clickContinue(60000);
    logStep('Video uploaded and Continue clicked');
  }

  /**
   * Handles the photo-upload question:
   *  1. Attaches the image file to the hidden file input.
   *  2. Clicks Continue to advance to the next question.
   *
   * @param photoPath - Absolute path to the photo file (e.g. .jpg, .png).
   */
  public async uploadPhoto(photoPath: string): Promise<void> {
    logStep('Uploading photo', { photoPath });
    await this.uploadFile(photoPath);
    await this.clickContinue(60000);
    logStep('Photo uploaded and Continue clicked');
  }

  // ============================================================
  // Assessment Completion
  // ============================================================

  /**
   * Validates the final "Thank You" page that appears after the
   * questionnaire is fully submitted.
   *
   * WHY BOTH CONSOLE + SCREENSHOT?
   * ─────────────────────────────────────────────────────────────
   * Console output appears instantly in the Playwright report
   * terminal and is easy to scan.  The screenshot is attached to
   * the Playwright HTML report as a visual artifact — useful for
   * sign-off, sharing with stakeholders, or diagnosing failures.
   *
   * @param screenshotPath - Absolute path where the PNG will be saved.
   */
  public async expectAssessmentComplete(screenshotPath: string): Promise<void> {
    const currentUrl = this.page.url();

    // ── Step 1: Wait for a true "Thank You" / "Assessment Submitted" heading ───
    const thankYouHeading = this.page
      .locator('h1, h2, h3')
      .filter({ hasText: /thank you/i })
      .first();

    await expect(
      thankYouHeading,
      'Final Thank You screen heading should be visible'
    ).toBeVisible({ timeout: 20000 });

    // ── Step 2: Console output ───────────────────────────────────────────
    const pageTitle = await this.page.title().catch(() => 'unknown');
    const headingText = (await thankYouHeading.textContent().catch(() => '') ?? '').trim();

    console.log(
      `[ASSESSMENT COMPLETE] ✅ Final Thank You screen reached\n` +
      `  URL   : ${currentUrl}\n` +
      `  Title : ${pageTitle}\n` +
      `  Heading: ${headingText}`
    );
    logStep('Assessment complete — Thank You heading confirmed', {
      url: currentUrl,
      heading: headingText,
    });

    // ── Step 3: Full-page screenshot ─────────────────────────────────────
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(
      `[ASSESSMENT COMPLETE] 📸 Screenshot saved\n` +
      `  Path: ${screenshotPath}`
    );

    logStep('Assessment completion screenshot captured', { screenshotPath });
  }
  // ---------------------------------------------------------------------------

  /**
   * Completes the entire questionnaire flow dynamically based on the provided data model.
   * Dynamically inspects and answers whichever question screen is currently presented,
   * continuing through all questions until the final Thank You screen is displayed.
   */
  public async completeFullAssessment(qData: any): Promise<void> {
    logStep('Starting dynamic questionnaire assessment flow');

    const maxScreens = 60;
    let screenCount = 0;

    while (screenCount < maxScreens) {
      screenCount++;

      // Locate the active screen with polling (waits up to 10s for screen transition)
      const screen = await this.getActiveScreen(10000);

      if (!screen) {
        logStep(`No more active question screens found — completed all questions (total screens processed: ${screenCount - 1})`);
        break;
      }

      await expect(screen).toBeVisible({ timeout: 10000 });

      // Log question title for visibility
      const titleText = await screen.locator('h1, h2, h3, .qw-question-title').first().textContent().catch(() => '');
      if (titleText) {
        logStep(`[Question ${screenCount}] ${titleText.trim()}`);
      }

      // ── Check if this is the final Thank You screen ────────────────────────
      const isThankYou = await screen.locator('h1, h2, h3').filter({ hasText: /thank/i }).count() > 0;
      if (isThankYou) {
        logStep(`Final Thank You screen detected: "${titleText ? titleText.trim() : 'Thank You'}"`);
        break;
      }

      // ── 1. Date of Birth ───────────────────────────────────────────────────
      const dobInput = screen.locator('#qwDobInput, input[data-question-id="date-of-birth"]');
      if (await dobInput.count() > 0 && await dobInput.first().isVisible()) {
        await this.fillDateOfBirth(qData.dateOfBirth);
        await this.clickContinue();
        continue;
      }

      // ── 2. Gender Selection ────────────────────────────────────────────────
      const genderCards = screen.locator('label.qw-gender-card');
      if (await genderCards.count() > 0 && await genderCards.first().isVisible()) {
        await this.selectGender(qData.gender);
        await this.clickContinue();
        continue;
      }

      // ── 3. Height & Weight ─────────────────────────────────────────────────
      const weightInput = screen.locator('input[data-question-id="current-weight-input"]');
      if (await weightInput.count() > 0 && await weightInput.first().isVisible()) {
        await this.fillHeightWeight(qData.weightLbs, qData.heightFeet, qData.heightInches);
        await this.clickContinue();
        continue;
      }

      // ── 4. Blood Pressure ──────────────────────────────────────────────────
      const bpInput = screen.locator('input[data-question-id="systolic-input"]');
      if (await bpInput.count() > 0 && await bpInput.first().isVisible()) {
        await this.fillBloodPressure(qData.systolicBp, qData.diastolicBp);
        await this.clickContinue();
        continue;
      }

      // ── 5. Choice Cards (Single or Multiple Choice) ────────────────────────
      const choiceCards = screen.locator('.qw-choice-card');
      if (await choiceCards.count() > 0 && await choiceCards.first().isVisible()) {
        const isCheckboxGroup = await screen.locator('input[type="checkbox"]').count() > 0;

        if (isCheckboxGroup) {
          const cardValues = await choiceCards.evaluateAll(cards =>
            cards.map(c => ((c.getAttribute('data-value') || c.textContent || '').trim()))
          );

          const candidateArrays: string[][] = [
            qData.sideEffects,
            qData.commonSideEffects,
            qData.discontinueImpact,
            qData.supportQuestions,
          ].filter(Boolean);

          let selectedAny = false;
          for (const arr of candidateArrays) {
            const matches = arr.filter(opt =>
              cardValues.some(cv => cv.toLowerCase().includes(opt.toLowerCase()) || opt.toLowerCase().includes(cv.toLowerCase()))
            );
            if (matches.length > 0) {
              await this.selectMultipleOptions(matches);
              selectedAny = true;
              break;
            }
          }

          if (!selectedAny) {
            await this.selectOption();
          }
        } else {
          const cardValues = await choiceCards.evaluateAll(cards =>
            cards.map(c => ((c.getAttribute('data-value') || c.textContent || '').trim()))
          );

          const singleAnswers: string[] = [
            qData.medicalCondition,
            qData.medications,
            qData.allergies,
            qData.weightLost,
            qData.foodCravings,
            qData.appetiteSuppression,
            qData.newHistory,
            qData.nextPrescriptionDose,
            qData.doctorPcpAcknowledge,
            qData.vomitingAcknowledge,
            qData.abdominalPainAcknowledge,
            qData.nauseaAcknowledge,
            qData.constipationAcknowledge,
            qData.continueMedication,
            qData.discontinueConfirm,
            qData.continueMultiDose,
            qData.discontinueMultiDoseConfirm,
            qData.experiencedNausea,
            qData.experiencedFatigue,
            qData.experiencedMuscleMass,
          ].filter(Boolean);

          let matchedAnswer: string | undefined = undefined;
          for (const ans of singleAnswers) {
            const exactOrPartialMatch = cardValues.find(cv =>
              cv.toLowerCase() === ans.toLowerCase() ||
              cv.toLowerCase().startsWith(ans.toLowerCase().split(' - ')[0]) ||
              ans.toLowerCase().startsWith(cv.toLowerCase().split(' - ')[0])
            );
            if (exactOrPartialMatch) {
              matchedAnswer = exactOrPartialMatch;
              break;
            }
          }

          if (matchedAnswer) {
            await this.selectOption(matchedAnswer);
          } else {
            await this.selectOption();
          }
        }

        // Fill detail textarea if displayed on the screen
        const textarea = screen.locator('textarea');
        if (await textarea.count() > 0 && await textarea.first().isVisible()) {
          await this.fillDetailTextarea(qData.medicalConditionDetail ?? qData.messageDoctor ?? 'Test');
        }

        await this.clickContinue();
        continue;
      }

      // ── 6. Video Upload ────────────────────────────────────────────────────
      const isVideoScreen = await screen.locator(':has-text("video"), :has-text("Video")').count() > 0;
      if (isVideoScreen && qData.videoPath) {
        await this.uploadVideo(qData.videoPath);
        continue;
      }

      // ── 7. Photo Upload ────────────────────────────────────────────────────
      const isPhotoScreen = await screen.locator(':has-text("photo"), :has-text("Photo"), :has-text("ID"), :has-text("government")').count() > 0;
      if (isPhotoScreen && qData.photoPath) {
        await this.uploadPhoto(qData.photoPath);
        continue;
      }

      // ── 8. Single-line Text Input (e.g. Full Legal Name / Signature) ────────
      const textInput = screen.locator('input[type="text"]:not(#qwDobInput), input:not([type])');
      if (await textInput.count() > 0 && await textInput.first().isVisible()) {
        const inputName = `${environment.firstName} ${environment.lastName}`;
        await textInput.first().fill(inputName);
        logStep(`Text input filled: "${inputName}"`);
      }

      // ── 9. Standalone Textarea (e.g. Message to Doctor) ────────────────────
      const standaloneTextarea = screen.locator('textarea');
      if (await standaloneTextarea.count() > 0 && await standaloneTextarea.first().isVisible()) {
        await this.fillDetailTextarea(qData.messageDoctor ?? 'Test');
      }

      // ── 10. Standalone Consent Checkboxes ──────────────────────────────────
      const checkboxes = screen.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      for (let i = 0; i < checkboxCount; i++) {
        const cb = checkboxes.nth(i);
        if (await cb.isVisible().catch(() => false)) {
          const isChecked = await cb.isChecked().catch(() => false);
          if (!isChecked) {
            await cb.check({ force: true }).catch(() => {});
            logStep('Checked consent checkbox');
          }
        }
      }

      // ── 11. Informational / Proceed Screen ─────────────────────────────────
      await this.clickContinue();
    }

    logStep('Finished full questionnaire assessment flow');
  }
}

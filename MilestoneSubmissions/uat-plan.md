# Cookly: User Acceptance Testing (UAT) Plan

**Team:** 014-3 (Annthropic LLC)
**Status:** Planned. Tests will be executed during the project testing milestone; actual results will be reported with the final project report. All results below are **Not run**.

## 1. Scope

UAT checks whether representative users can complete Cookly's core tasks from the browser. It covers observable results only (what the user sees and can do), not database internals; those are covered by the automated tests in `ProjectSourceCode/test/`.

| Feature | Linked requirement / user story (Lab 8, item 12) |
|---|---|
| F1. Account registration | **A. Create a login:** As a new user, I want to create an account so my ingredients and preferences are saved between visits. |
| F2. Log in and protected pages | **B. Log in:** As a returning user, I want to sign in with my credentials, and I expect my pages to be unavailable to anyone who is not signed in. |
| F3. Fridge photo upload and ingredient identification | **C. Take photo of fridge/pantry** and **D. Identify ingredients:** As a busy cook, I want to upload a photo of my fridge and see the ingredients the app found, so I don't have to type them in. |
| F4. Recipe filtering and viewing | **E. Filter recipes** and **F. View recipes and instructions:** As a user, I want to see recipes I can make with my saved ingredients and open one to read its instructions. |

Out of scope for this round: the taste/cookware survey, allergy blacklisting, ingredient pricing, performance and load testing.

## 2. Acceptance criteria

| ID | Feature | Acceptance criterion (observable and measurable) |
|---|---|---|
| AC1.1 | F1 | A new user who submits a unique username, an email, and matching passwords is taken to the login page within 3 seconds. |
| AC1.2 | F1 | A newly registered user can sign in with the new credentials on the first attempt. |
| AC1.3 | F1 | If the password is missing, the user sees a message identifying the missing password field, and no account is created (a later login with that username fails). |
| AC1.4 | F1 | If the username is already taken, the user sees "Username or email is already taken" and stays on the registration page. |
| AC2.1 | F2 | A registered user who enters the correct username and password lands on the home page, which greets them by username. |
| AC2.2 | F2 | A wrong password shows "Incorrect username or password", and the user stays on the login page. |
| AC2.3 | F2 | A signed-out user who types `/home` into the address bar is sent to the login page and cannot see home page content. |
| AC2.4 | F2 | After clicking Log out, pressing the browser Back button and refreshing does not show the home page. |
| AC3.1 | F3 | A signed-in user can upload a HEIC/JPEG fridge photo and sees a list of detected ingredients within 30 seconds. |
| AC3.2 | F3 | At least 4 of the 5 clearly visible items in the standard test photo appear in the detected list. |
| AC3.3 | F3 | Detected ingredients are still listed after the user logs out and logs back in. |
| AC3.4 | F3 | Uploading an unsupported file (a `.txt` file) shows an error naming the accepted formats, and no ingredients are added. |
| AC4.1 | F4 | With saved ingredients, the user sees at least one recipe, and each listed recipe uses only ingredients the user has. |
| AC4.2 | F4 | Opening a recipe shows its name, ingredient list with quantities, and step-by-step instructions. |
| AC4.3 | F4 | A user with no saved ingredients sees a message prompting them to upload a photo, instead of an empty page or an error. |

## 3. Test environment

| Item | Plan |
|---|---|
| Environment | Localhost (`http://localhost:3000`) for the first round; repeat on the deployed URL once it is available. |
| Setup steps | 1. `cd ProjectSourceCode` 2. Create `.env` from the team template. 3. `docker compose up -d` 4. Confirm `http://localhost:3000/login` loads. 5. Create the fixture account `uat_returning` / `CooklyUAT#2026` (used by F2–F4) before testers arrive. |
| Browser / device | Chrome (current version) on a laptop. Repeat F1 and F2 on Safari on an iPhone. |
| Application version | Record the Git commit hash (`git rev-parse --short HEAD`) at the start of each session: `________` |
| Test assets | `uat/fridge_standard.heic`: photo with exactly 5 clearly visible items (eggs, milk, chicken breast, cucumber, rice); `uat/notes.txt`: unsupported file. |

## 4. Testers

| Item | Plan |
|---|---|
| Intended users | Adults who cook at home at least a few times a week but don't plan meals in advance (Cookly's target audience). No technical background required. |
| Recruitment | 4 volunteers: 2 non-CS students and 2 roommates/friends of team members who match the profile, recruited in person or over Teams. Testers do not see the code or the test cases beforehand. |
| Planned tester IDs | T1, T2, T3, T4. No names, emails, or other personal information are recorded; test accounts use the provided test data. |
| Facilitation | One team member reads each task aloud, does not help unless the tester is blocked for more than 2 minutes, and records the actual result. |
| Limitations | If classmates act as proxy users, they are more tech-savvy than the target audience and may find problems less often; this will be noted next to their results. F3 and F4 depend on features still under development, so they may be marked Blocked if not ready. |

## 5. Test cases and results

Each feature has at least one successful case and one invalid-input or alternate-path case. Results fields stay **Not run** until UAT is executed; no results are filled in ahead of time.

| Test ID | Feature/requirement | Acceptance criterion | Preconditions | Test data | User steps | Expected result | Tester ID | Actual result | Status | Issue/follow-up |
|---|---|---|---|---|---|---|---|---|---|---|
| UAT-01 | F1 / A. Create a login | AC1.1, AC1.2 | App running; user signed out; username `uat_newuser_T#` does not exist | Username `uat_newuser_T1` (use the tester's ID), email `uat_t1@example.com`, password and confirm `Cookly#2026` | 1. Open `/register`. 2. Enter the username, email, password, and confirm password. 3. Click Register. 4. On the login page, enter the same username and password. 5. Click Login. | Step 3 shows the login page within 3 s. Step 5 shows the home page greeting `uat_newuser_T1`. | T1 | Not run | Not run | |
| UAT-02 | F1 / A. Create a login (invalid input) | AC1.3 | Same as UAT-01; username `uat_nopass_T#` does not exist | Username `uat_nopass_T2`, email `uat_nopass_t2@example.com`, password left empty | 1. Open `/register`. 2. Fill in the username and email; leave both password fields empty. 3. Click Register. 4. Open `/login` and try to sign in as `uat_nopass_T2` with any password. | Step 3: a message points to the missing password field and the page does not advance. Step 4: login fails with "Incorrect username or password" (no account was created). | T2 | Not run | Not run | |
| UAT-03 | F1 / A. Create a login (alternate path: duplicate) | AC1.4 | Fixture account `uat_returning` exists | Username `uat_returning`, email `uat_dup@example.com`, password `Another#2026` | 1. Open `/register`. 2. Enter the data. 3. Click Register. | "Username or email is already taken" is shown; the user stays on the registration page. | T3 | Not run | Not run | |
| UAT-04 | F2 / B. Log in | AC2.1 | Fixture account exists; user signed out | Username `uat_returning`, password `CooklyUAT#2026` | 1. Open `/login`. 2. Enter the credentials. 3. Click Login. | The home page loads and greets `uat_returning`. | T1 | Not run | Not run | |
| UAT-05 | F2 / B. Log in (invalid input) | AC2.2 | Fixture account exists; user signed out | Username `uat_returning`, password `wrongpass1` | 1. Open `/login`. 2. Enter the credentials. 3. Click Login. | "Incorrect username or password" is shown; the user stays on the login page. | T2 | Not run | Not run | |
| UAT-06 | F2 / B. Protected pages (alternate path) | AC2.3, AC2.4 | Fixture account exists; user signed in as `uat_returning` | None | 1. Click Log out. 2. Press the browser Back button, then refresh. 3. Type `localhost:3000/home` in the address bar and press Enter. | Steps 2 and 3 both end on the login page; home page content is never shown. | T4 | Not run | Not run | |
| UAT-07 | F3 / C+D. Upload photo, identify ingredients | AC3.1, AC3.2, AC3.3 | Signed in as `uat_returning` with no saved ingredients | `uat/fridge_standard.heic` (5 known items) | 1. Open the upload page. 2. Choose the photo and click Upload. 3. Start a timer; wait for results. 4. Compare the detected list with the 5 known items. 5. Log out, log back in, and open the ingredients list. | Detected list appears within 30 s; at least 4 of the 5 items are listed; the list is unchanged after logging back in. | T3 | Not run | Not run | |
| UAT-08 | F3 / C+D. Upload photo (invalid input) | AC3.4 | Signed in as `uat_returning` | `uat/notes.txt` | 1. Open the upload page. 2. Choose the text file and click Upload. | An error names the accepted formats; the ingredient list is unchanged. | T4 | Not run | Not run | |
| UAT-09 | F4 / E+F. Filter and view recipes | AC4.1, AC4.2 | Signed in as `uat_returning` with the ingredients from UAT-07 saved | Saved ingredients: eggs, milk, chicken breast, cucumber, rice | 1. Open the recipes page. 2. Note the recipes listed. 3. Open the first recipe. 4. Compare its ingredients with the saved list. | At least one recipe is listed; the opened recipe shows name, ingredients with quantities, and instructions; every ingredient is on the saved list. | T1 | Not run | Not run | |
| UAT-10 | F4 / E+F. Recipes with no ingredients (alternate path) | AC4.3 | Signed in as a new account with no saved ingredients (`uat_newuser_T1` from UAT-01) | None | 1. Open the recipes page. | A message prompts the user to upload a photo; no error page or blank page. | T2 | Not run | Not run | |

## 6. Results reporting

After execution, the team will fill in Actual result, Status (Pass / Fail / Blocked), and Issue/follow-up for every row, link any bug to a GitHub issue, re-test fixed failures, and summarize the results in the final project report.

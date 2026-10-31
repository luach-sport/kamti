# קמתי – הוראות לעבודה על הפרויקט

## כלל ראשון: הרבה קבצים קטנים
כמו בכל הפרויקטים של המפתח: כל יכולת בקובץ קטן משלה (בערך עד 120 שורות), לא קובץ אחד ענק. כשמוסיפים יכולת, יוצרים קובץ חדש בתיקייה המתאימה ומוסיפים אותו ל-`www/index.html` (הסדר שם קובע).

## מה זה
שעון מעורר לאנדרואיד בלי כפתור עצירה: רק משימה מכבה אותו. עובד בלי אינטרנט, וגם בנגנים ובטלפונים בלי מצלמה או בלי חיישן תנועה (משימה שהמכשיר לא יכול לעשות מתחלפת בתרגילי חשבון, כדי שאף פעם לא נתקעים). אין גרסה לאייפון: אפל לא מאפשרת לאתר במסך הבית לצלצל כשהוא סגור (כך כתוב גם באתר).

## איך זה בנוי
- `www/js/` – הכל תחת `window.KM`:
  - `core/` – בסיס: הגדרות (`config`), עזרים, זמנים בעברית ומתי שעון מצלצל (`dates`, אותו חישוב כמו `AlarmMath.java`), אייקונים ולוגו, גשר ל-Capacitor (`native`), רשת, שמירה (`storage`), שיתוף (`device`).
  - `data/` – ברירות מחדל וצלילים, בדיקת נתונים (`normalize`), מצב (`state`).
  - `alarm/` – הגשר לחלק של אנדרואיד (`bridge`, עם תחליף בדפדפן `KM.AL.sim` / `simSet` לצילומים ולבדיקות), סנכרון השעונים (`sync`), בוקר אחד מהצלצול ועד "בוקר טוב" ובדיקת הערנות (`session`), היומן (`log`).
  - `tasks/` – המשימות: `info` (שמות, הגדרות, מה צריך מצלמה או חיישן), `math`, `moves` (הליכה וניעור, עם `motion`), `type`, `memory`, `order`, `photo` (עם `camera` ו-`match`: השוואת תמונות בטלפון, בלי אינטרנט).
  - `ui/`, `views/` (שעונים, עריכה, מסך הצלצול, יומן, הגדרות, אישורים), `sheets/`, `features/` (עדכונים, פניות, שיתוף), `actions/` (כל כפתור הוא `data-action="שם"` והפעולה היא `KM.A['שם']`), `app/`.
- `android-native/` – Java, מועתק לפרויקט האנדרואיד ב-`scripts/patch-android.sh`:
  - `KamtiAlarmPlugin` – מה שהאפליקציה קוראת: `sync`, `getState`, `dismiss`, `snooze`, `confirmAwake`, `test`, `device`, `permissions`, `request`, `preview`, `pickSound`. אירוע `ringState` בכל שינוי.
  - `RingState` – מה קורה עכשיו (idle / ring / check / snooze), שמור כך שישרוד סגירה והפעלה מחדש.
  - `AlarmStore` (השעונים כפי שהאפליקציה שלחה), `AlarmMath`, `Scheduler` (הכל דרך `setAlarmClock`), `AlarmReceiver`, `BootReceiver` (אחרי הפעלה מחדש: ממשיך לצלצל, ומצלצל על שעון שהוחמץ בשעה האחרונה).
  - `AlarmService` – הצלצול: ווליום מקסימום שחוזר אם מורידים, רטט, החזרת האפליקציה למסך (צריך "הצגה מעל אפליקציות"), דקה לבדיקת הערנות, ועצירה לבד אחרי שעה.
  - `MainActivity` – מעל מסך הנעילה בזמן צלצול, חוסם ווליום ו"חזור", חוזר למסך אם יוצאים.
  - `Sounds` – הצלילים (`android-res/raw/kamti_*.ogg`, נוצרים ב-`tools/make-sounds.py`), צלצול הטלפון, או קובץ שהמשתמש בחר.
- שינוי ב-`android-native/`, `android-res/`, `scripts/patch-android.sh`, `capacitor.config.json` או בתוספים ב-`package.json` מחייב APK חדש. האפליקציה מזהה את זה לבד (`nativeKey` ב-`scripts/make-update.mjs`) ומציעה להוריד APK במקום עדכון פנימי.
- בדיקת קומפילציה של ה-Java בלי Android SDK: `javac` מול `android.jar` (API 34) עם תחליפים קטנים למחלקות של Capacitor. הבנייה האמיתית ב-GitHub Actions, ושגיאות קומפילציה מופיעות שם כהערות על הריצה.

## אתר ההסבר
- https://luach-sport.github.io/kamti/ (`.github/workflows/site.yml`, לענף `gh-pages`), בנוי מהערכה המשותפת `luach-sport/itzko` (`kit/`). האפליקציה רשומה ב-`apps.json` שם.
- כאן: `site/site.json`, `site/parts/` (פרק לכל מסך), `site/css/brand.css`.
- **בכל שינוי באפליקציה שמוסיף, משנה או מוריד מסך, כפתור או יכולת, מעדכנים באותו commit גם את הפרק המתאים ב-`site/parts/`.**
- צילומי המסך נוצרים לבד (`scripts/site/scenes.mjs`, עם שעון קבוע: 22:47 לשעונים, 06:30 לצלצול). לא מעלים צילומים ידנית.
- לבנות מקומית: `node <itzko>/kit/lib/build.mjs` מתוך תיקיית הריפו (התוצאה ב-`_site/`).

## חשוב לדעת
- **מה חדש**: לפני כל גרסה כותבים את השינויים ב-`release-notes.txt` (שורה לכל שינוי, בשפה פשוטה).
- מספר גרסה: `APP_VERSION` ב-`.github/workflows/build.yml` (וברירות המחדל ב-`scripts/prepare-web.mjs`, `scripts/make-update.mjs`, `www/js/core/config.js`).
- חתימה: `signing/release.jks`, הסיסמה רק ב-GitHub Secrets בשם `KAMTI_KEY_PASS`.
- פניות נשלחות לסקריפט Google Apps Script של המפתח (אותו של MyCar ושמרתי), עם `app: 'kamti'`. כדי שבנושא המייל יהיה כתוב "קמתי" ולא "MyCar", מוסיפים בסקריפט ב-`Settings.gs`: `kamti: 'קמתי'` לרשימת `APPS`. בגוף המייל כבר כתוב "קמתי" (בשדה הגרסה).
- קרדיט: "פותח על ידי Itzko" בתחתית מסך ההגדרות. לא מורידים.
- בדיקות: `tests/` (Playwright, שרת על `www` בפורט 8765).

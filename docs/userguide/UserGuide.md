# Getting Started
---
## Authorization
---
There're two ways to get access to the admin panel: personal Heretic or Google account.

Heretic account:
1. Proceed to https://demo.hereticjs.org/.
2. Choose "Sign in" option in the right upper corner by clicking the profile icon.
3. Use the credentials below to log in:
+ Login: admin
+ Password: password

To authorize via Google account you need:
1. Proceed to https://demo.hereticjs.org/.
2. Choose "Sign in" option in the right upper corner by clicking the profile icon.
3. Click on the google icon under the "Submit" button.
4. Enter your Google account login and password.


After logging in, click "Admin tab" icon at the right upper corner to enter the tab.

## Admin panel
This page resembles the data regarding the service, hardware and software used for it's support and the left amount of resources used to run it.

Current Version shows the version of Heretic being in use.
Listening to IP/Listening to port
Serve Static Files shows 
Production mode
Features Enabled resembles additional features within Heretic available for interaction.
OAuth2 providers shows the possible authorization methods (As for now it's only Google available for OAuth2)
Rate limiting
Log level

Time Configuration panel shows the time settings Heretic uses while running (Server date/time, timezone and indication of total days uptime).

System configuration tab shows the hardware usedby Heretic: CPU, total RAM, the amount used and left.


## Users tab
User tab functionality allows to get the list of users who're registered in the system and data regarding each entry.

Admin can use his tab to create new user, delete or sort the existent entries by filtering, as well as export the search results to Excel file.

Creating new user:
1. Click "Add user" button in the upper side of the screen.
2. Fill up the data in each field accordingly: username (their name in the system), user's active status (switched by pressing the check icon, binary), displayed name(the name which will get shown instead of username where aplicable), Email of the new user, password, and choosing the group (by clicking "add" button).
3. When finished, click the "Add" button.
There's also an option to turn off the two-factor authentification, by clicking "Disable 2FA".

New user entry will appear on the list with all data added during the creation process.

To delete the user, you should perform the steps below:
1. Choose the one or several entries you want to delete.
2. Click "Delete" button in the upper side of the page.
3. Click "Yes" on the confirmation window.

The button "Reload" on User tab will allow you to refresh te page to see the changes made to the list.

Settings button's functional is sorting the list of users and adjustisting it's visual. By clicking on it, you'll see three tabs appearing in a new window: Columns, Pages and Filter.
+ Columns tab will allow you to switch types of data being shown in every entry (Username, is user active or not, display name and Email).
+ Pages will give you an option to change how many list entries are seen within one page.
+ Filter tab will help you create the filters for user list and apply the existent ones, which were previously created and saved.

To add new filter:
1. Click "+New" icon.
2. Pick the data's filter point (username, activity status, email, display name)
3. Choose the condition from the list (equals/not equals/is like/is not like)
4. Enter the data inside the empty field you aim to filter for.
5. Click "Save" button.

After the filter got saved, you can toggle it on/off to apply it for the list; to save changes, press "Save".

By clicking the button "Data", you may be able to export the list contents to Excel or tab-separated values file.

To perform this:
1. Select the items to import by clicking on the checkbox in fron of each entry you pick, or apply the filter to the list and pick all.
2. Click "Data" -> "Export to file". In the appeared window you'll see the amount of items for export, export type (Excel/Tab-separated values) and each entry's contents you can adjust to export.
3. Press "Export" button to initiate the process.

---
 
## Groups tab
Groups tab allow the admin to manage user groups they belong to, create new groups or delete the existent ones. The groups define the clearance and accesses users have for proper sorting and control.

To create a new group:
1. Click "Add Group" button.
2. Enter the new group's name in the field.
3. Click "+Add" button to adjust the group type: Personal Data Access, Site Administrator, Comment.
4. Choose the value (boolean, true or false).
5. Click "Save" button to apply changes.

Your new created group should appear in the list. You can assign users to it at Users tab.

## Events tab
Events tab will allow admin to see the activity from users: from login attempts, to changes of tables' contents.

To delete the chosen events, you should do the following:
1. Choose the one or several entries you want to delete.
2. Click "Delete" button in the upper side of the page.
3. Click "Yes" on the confirmation window.

Settings button's functional for events tab is similar for other tabs, except for the list of contents to sort from.
+ Columns tab will allow you to switch types of data being shown in every entry (Event, Date, IP, Location, Username).
+ Pages will give you an option to change how many list entries are seen within one page.
+ Filter tab will help you create the filters for user list and apply the existent ones, which were previously created and saved.

## Sessions tab
Session tab shows the list of active and ended sessions perfomed by users. Each entry is automatically created once the user logs in the system and ends once they log out or the connection to the service is interrupted.


## Logs tab
Logs tab allow the admin to see the list of all activity made my any user; the main difference between Logs tab and Events tab is that Events track only the changes made to the tables or system, while the Logs track every admin's interaction with the service.


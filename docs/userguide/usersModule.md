# Users Module

User tab functionality allows to get the list of users who're registered in the system and data regarding each entry.

Admin can use his tab to create new user, delete or sort the existent entries by filtering, as well as export the search results to Excel file.

Creating new user:

1. Click "Add user" button in the upper side of the screen
   
![Alt text](./images/addUserWindow.jpg)

2. Fill up the data in each field accordingly: username (their name in the system), user's active status (switched by pressing the check icon, binary), displayed name (the name which will get shown instead of username where applicable), e-mail of the new user, password, and choosing the groups (by clicking "add" button)
3. When finished, click the "Save" button
4. There's also an option to turn off the two-factor authorization by clicking "Disable 2FA" (if enabled)

New user entry will appear on the list with all data added during the creation process.

To delete the user, you should perform the steps below:

1. Choose the one or several entries you want to delete
2. Click "Delete" button in the upper side of the page
3. Click "Delete" on the confirmation window

The "Reload" button will allow you to refresh the list to see the changes made.

Settings buttons functional is: sorting the list of sessions and adjusting it's visual. By clicking on it, you'll see three tabs appearing in a new window: Columns, Pages and Filter.

![![Setting](image-3.png)](./images/sessionSettings.jpg)

+ Columns tab will allow you to switch types of data being shown in every entry (Session ID, creation date, end session time, IP address etc.)
+ Pages will give you an option to change how many list entries are visible within one page
+ Filter tab will help you create the filters for user list and apply the existent ones, which were previously created and saved

To add new filter:

1. Click "New" icon
2. Pick the data filter (Session ID, creation date, etc.)
3. Choose the condition from the list (equals/not equals/is like/is not like etc.)
4. Enter the data you aim to filter for
5. Click "Save" button

By clicking the "Data" button you may be able to export the list contents to Excel or tab-separated values file.

To export data:

1. Select the items to export by clicking on the checkbox in front of each entry you pick, or apply the filter to the list and pick all
2. Click "Data" &rarr; "Export to file". In the appeared window you'll see the amount of items for export, export type (Excel or Tab-Separated Values) and each entry's contents you can adjust to export
3. Press "Export" button to initiate the process

To delete the entry, you may perform the steps below:

1. Choose the one or several entries you want to delete
2. Click "Delete" button in the upper side of the page
3. Click "Delete" on the confirmation window
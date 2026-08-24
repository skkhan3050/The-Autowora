# Google Apps Script lead receiver

1. Open the Google Sheet and set sharing to **Restricted**. Keep only authorised staff as editors.
2. In the Sheet, choose **Extensions → Apps Script**.
3. Replace the default `Code.gs` contents with the code in this folder and save it.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as** to your Google account. Set access to the minimum audience needed for the public website to submit a booking. Authorise the requested spreadsheet permission, then deploy.
6. Copy the URL ending in `/exec` and provide it here. I will connect the website’s booking forms to that endpoint.

Do not use the `/dev` URL in the live website. It only works for script editors. The published `/exec` URL is the production endpoint.

The code validates form inputs, prevents spreadsheet-formula injection, serialises simultaneous submissions, creates headers in a blank `Sheet1` tab, and appends every lead with a `New` status.

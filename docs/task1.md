# Task 1: Bulk Upload Documentation

## Approach
Our approach to the bulk upload feature for the catalog was designed to provide a seamless and robust experience for administrators importing new books.

1.  **File Format Support**: We support both `.csv` and `.json` file formats.
2.  **Client-Side Parsing for CSV**: For CSV files, we utilize `papaparse` on the client side to parse the file contents in the browser. This allows us to validate the data structure before sending it to the server, providing immediate feedback if the file is malformed.
3.  **Data Transformation**: After parsing the CSV, we transform the flat row data into the nested JSON structure expected by our backend API (e.g., mapping authors, categories, and inventory details).
4.  **Direct JSON Upload**: For JSON files, we read the contents as text and parse it directly, assuming it matches the expected array of book objects.
5.  **Batched/Single Request**: The transformed data is sent to the backend ingestion endpoint (`/api/ingest/books`) in a single payload. If the backend supports chunking, this could be adapted to send chunks to avoid request size limits.
6.  **User Experience**: The UI features a drag-and-drop zone using `react-dropzone` and provides clear error messages and success notifications using a toast system. 

## Limitations
*   **Large File Handling**: Client-side parsing of extremely large CSV files may cause the browser to freeze momentarily or crash if memory limits are exceeded. Parsing is done in a synchronous block or loads the entire file into memory before sending.
*   **Request Size Limits**: Since the entire array of parsed books is sent in a single HTTP request, huge catalogs might exceed the backend's payload size limit (e.g., typical 1MB or 10MB limits in server configs).
*   **Partial Failures**: The current design assumes an all-or-nothing approach for the upload on the backend, or doesn't provide granular row-by-row error reporting back to the user if only a few specific books fail validation during ingestion.
*   **Schema Rigidity**: The CSV parsing logic currently expects specific column names. If an administrator uploads a CSV with slightly different headers, the import will fail to map the data correctly.

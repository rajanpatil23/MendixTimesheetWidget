# TimeSheet Calendar Widget

A powerful and flexible Mendix widget for managing timesheet entries in a calendar view. Built for project-based time tracking with an intuitive weekly grid interface.

## What This Widget Does

The TimeSheet Calendar widget displays your projects as rows and dates as columns, creating a simple grid where team members can log their hours. Think of it as a visual spreadsheet specifically designed for tracking time across multiple projects.

## Features

- **Weekly Calendar View** - See an entire week's worth of time entries at a glance
- **Project-Based Tracking** - Each row represents a different project
- **Easy Navigation** - Jump between weeks with Previous/Next buttons, or jump straight to Today
- **Automatic Totals** - View daily totals and project totals at a glance
- **Weekend Support** - Optionally show or hide Saturday and Sunday
- **Two-Way Edit** - Make changes directly in the grid and save automatically
- **Responsive Design** - Works well on different screen sizes
- **Clean UI** - Professional styling that fits naturally into any Mendix application

## Installation

### Prerequisites

- Mendix Studio Pro 10.x or later
- Node.js 16 or higher
- NPM 7 or higher

### Quick Start

1. Clone this repository to your local machine
2. Open your terminal and navigate to the project folder
3. Install dependencies:
   
```
bash
   npm install
   
```
   If you're using NPM v7 or later, use:
   
```
bash
   npm install --legacy-peer-deps
   
```
4. Start development mode:
   
```
bash
   npm start
   
```

### Building for Production

To create a production-ready build:

```
bash
npm run build
```

This generates a `dist` folder containing the compiled widget that you can import into your Mendix project.

## Setting Up Your Data Model

Before using the widget, you need to set up your domain model in Mendix. Here's what you need:

### 1. Project Entity

Create an entity to store your projects. This could be an existing entity in your application or a new one.

**Required Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| Name | String | The display name of the project (e.g., "Website Redesign") |
| ID | String/Integer/Long | A unique identifier for the project |

Example entity: `MyModule.Project`

```
Project (Entity)
├── Name : String
└── ProjectID : String
```

### 2. Timesheet Entry Entity

Create an entity to store existing time entries. This allows the widget to display previously logged hours.

**Required Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| ProjectID | String/Integer/Long | Links the entry to a project |
| EntryDate | DateTime | The date for this time entry |
| Hours | Decimal/Integer | Number of hours worked |

Example entity: `MyModule.TimesheetEntry`

```
TimesheetEntry (Entity)
├── ProjectID : String
├── EntryDate : DateTime
└── Hours : Decimal
```

### 3. Helper Entity (Critical for Saving)

This is a special temporary entity that the widget uses to pass data to your nanoflow when saving. It acts as a bridge between the widget and your business logic.

**Important:** This entity must be **persistent** (not a temporary object).

**Required Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| Date | DateTime | The date for the time entry |
| Hours | Decimal/Integer | The number of hours to save |
| ProjectID | String | The project identifier |

Example entity: `MyModule.TimesheetHelper`

```
TimesheetHelper (Entity) - Persistent
├── Date : DateTime
├── Hours : Decimal
└── ProjectID : String
```

The widget creates a new `TimesheetHelper` object each time a user enters hours, then triggers your nanoflow. Your nanoflow should read the helper object, create or update the actual timesheet entry, and clean up the helper object.

## Configuration Guide

Once your data model is ready, drag the widget onto a page and configure these properties:

### Data Sources

- **Projects Data Source** - Select a data grid or list view containing your projects
- **Timesheet Entries Data Source** - Select a data grid or list view containing existing timesheet entries

### Project Attributes

- **Project Name** - Choose the attribute that holds the project name (e.g., `Name`)
- **Project ID** - Choose the attribute that uniquely identifies the project (e.g., `ProjectID` or `ID`)

### Timesheet Entry Attributes

- **Entry Project ID** - The attribute linking entries to projects (e.g., `ProjectID`)
- **Entry Date** - The attribute storing the entry date (e.g., `EntryDate`)
- **Entry Hours** - The attribute storing hours worked (e.g., `Hours`)

### Helper Entity Configuration

This is where you connect the helper entity you created:

- **Helper Entity Name** - Full entity name like `MyModule.TimesheetHelper`
- **Helper Date Attribute Name** - The attribute name for date (e.g., `Date`)
- **Helper Hours Attribute Name** - The attribute name for hours (e.g., `Hours`)
- **Helper Project ID Attribute Name** - The attribute name for project ID (e.g., `ProjectID`)

### Actions

- **On Cell Change Action** - This is your nanoflow that runs when someone enters hours. More details below.

### Configuration

- **Start Date** - When the calendar should begin. Default is `[%BeginOfCurrentWeek%]`
- **Number of Days** - How many days to show (7 for a week, 14 for two weeks, etc.)
- **Show Weekends** - Toggle whether Saturday and Sunday appear

### Display Options

- **Show Row Totals** - Display total hours per project
- **Show Daily Totals** - Display total hours per day
- **Editable** - Allow users to modify entries directly

## The On Cell Change Nanoflow (Important!)

This is the heart of the widget. When a user types hours into a cell and clicks away, the widget creates a `TimesheetHelper` object with the data, then calls your nanoflow. Your nanoflow's job is to save this data to your actual timesheet entity.

### Nanoflow Setup

Create a nanoflow with the following:

**Input Parameter:**
- Name: `Project` (Type: Your Project entity, e.g., `MyModule.Project`)

**What the nanoflow should do:**

1. **Retrieve the Helper Object**
   - Use a retrieve activity to get the most recent `TimesheetHelper` object
   - Sort by creation date descending and limit to 1
   
2. **Read Helper Values**
   - Get `Date`, `Hours`, and `ProjectID` from the helper object
   
3. **Create or Update Timesheet Entry**
   - Query your `TimesheetEntry` entity to find an existing entry for the same project and date
   - If found, update the hours
   - If not found, create a new entry
   
4. **Clean Up**
   - Delete the helper object to keep things tidy

### Example Nanoflow Steps

```
1. Retrieve TimesheetHelper (first, sorted by createdDate descending)
   ↓
2. Get values from helper (Date, Hours, ProjectID)
   ↓
3. Retrieve TimesheetEntry where ProjectID = helper.ProjectID AND EntryDate = helper.Date
   ↓
4. Decision: Entry exists?
   - Yes: Update Hours attribute
   - No: Create new TimesheetEntry with ProjectID, EntryDate, Hours
   ↓
5. Delete helper object (commit changes first)
   ↓
6. Refresh your timesheet data source so the widget shows the new data
```

### Why This Approach?

You might wonder why we need a helper entity instead of passing values directly. The reason is that Mendix widgets communicate with the Mendix runtime through data objects. The helper entity serves as a temporary carrier for the three pieces of information (date, hours, project ID) that need to reach your nanoflow.

## Using the Widget

### Basic Setup

1. Create a page in your Mendix app
2. Add a data view or data grid for projects
3. Add another data grid or list view for timesheet entries (ensure it's set to pass context)
4. Drag the TimeSheet Calendar widget onto the page
5. Configure all the properties as described above

### Running in Development

The widget includes hot-reload support. When you run `npm start`:

- Changes to your code automatically rebuild the widget
- The bundle updates in the `dist` folder
- Your Mendix test project receives the updated bundle automatically

### Customizing the Look

The widget includes these CSS classes for customization:

| Class | Description |
|-------|-------------|
| `timesheet-calendar-container` | Main container wrapper |
| `timesheet-calendar` | Calendar wrapper |
| `timesheet-navigation` | Navigation header area |
| `navigation-controls` | Previous/Next/Today buttons |
| `date-range-display` | Shows current date range |
| `timesheet-table` | The main grid table |
| `project-header` | Project column header |
| `date-header` | Date column headers |
| `project-name` | Project name in each row |
| `hours-cell` | Cell containing hours input |
| `hours-input` | The actual input field |
| `hours-display` | Display mode (non-editable) |
| `row-total` | Total hours per project |
| `totals-row` | Daily totals row |
| `total-label` | "Daily Total" label |
| `column-total` | Total for a single day |
| `grand-total` | Grand total in corner |

To customize, add your own CSS file to your Mendix theme and override these classes:

```
css
/* Example: Change the input field appearance */
.hours-input {
    background-color: #f0f8ff;
    border: 2px solid #0066cc;
}

/* Example: Style the navigation buttons */
.nav-button {
    background-color: #0066cc;
    color: white;
}
```

## Common Issues and Solutions

**Widget shows "Loading projects..."**
- Check that your Projects Data Source is properly connected
- Verify the data source status is "available"

**Changes don't save**
- Ensure your helper entity is persistent (not transient)
- Verify your nanoflow is being triggered (add a breakpoint or log)
- Check that the helper entity name exactly matches your entity (case-sensitive)

**Totals show incorrect values**
- Make sure your Hours attribute is a number type (Decimal, Integer, or Long)
- Check that the entry hours attribute is correctly mapped

**Weekend days don't appear**
- Verify "Show Weekends" is set to true in the widget properties

## Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with auto-reload |
| `npm run dev` | Run development build |
| `npm run build` | Create production build |
| `npm run lint` | Check code for issues |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run release` | Create release build |

## Need Help?

- Report issues at: [GitHub Issues]
- Check Mendix documentation for widget development

## License

Apache License 2.0

## Credits

Built by Rajan Patil

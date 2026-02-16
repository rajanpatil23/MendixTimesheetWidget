import { createElement, useEffect, useState, useCallback, useMemo } from "react";
import "./ui/TimeSheetCalendar.css";

export default function TimeSheetCalendar(props) {
    const {
        projectsDataSource,
        timesheetDataSource,
        projectNameAttr,
        projectIdAttr,
        entryProjectIdAttr,
        entryDateAttr,
        entryHoursAttr,
        helperEntityName,
        helperDateAttrName,
        helperHoursAttrName,
        helperProjectIdAttrName,
        onCellChangeAction,
        startDate,
        numberOfDays,
        showWeekends,
        showTotals,
        showDailyTotals,
        editable
    } = props;

    const [projects, setProjects] = useState([]);
    const [entries, setEntries] = useState([]);
    const [currentStartDate, setCurrentStartDate] = useState(() => 
        startDate && startDate.value ? new Date(startDate.value) : new Date()
    );
    const [editingCell, setEditingCell] = useState(null);
    const [localValues, setLocalValues] = useState({});

    // Update currentStartDate when startDate prop changes
    useEffect(() => {
        if (startDate && startDate.value) {
            setCurrentStartDate(new Date(startDate.value));
        }
    }, [startDate]);

    // Navigation functions
    const goToPreviousWeek = useCallback(() => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() - 7);
            return newDate;
        });
    }, []);

    const goToNextWeek = useCallback(() => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + 7);
            return newDate;
        });
    }, []);

    const goToToday = useCallback(() => {
        const today = new Date();
        // Set to start of week (Monday)
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        today.setDate(today.getDate() + diff);
        setCurrentStartDate(today);
    }, []);

    const goToPreviousPeriod = useCallback(() => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() - (numberOfDays || 7));
            return newDate;
        });
    }, [numberOfDays]);

    const goToNextPeriod = useCallback(() => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + (numberOfDays || 7));
            return newDate;
        });
    }, [numberOfDays]);

    // Generate date range
    const dateRange = useMemo(() => {
        if (!currentStartDate || !numberOfDays) return [];

        const dates = [];
        const start = new Date(currentStartDate);
        
        for (let i = 0; i < numberOfDays; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            
            // Skip weekends if showWeekends is false
            if (!showWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
                continue;
            }
            
            dates.push(date);
        }
        
        return dates;
    }, [currentStartDate, numberOfDays, showWeekends]);

    // Format date range for display
    const dateRangeDisplay = useMemo(() => {
        if (dateRange.length === 0) return "";
        const firstDate = dateRange[0];
        const lastDate = dateRange[dateRange.length - 1];
        
        const formatOptions = { month: "short", day: "numeric", year: "numeric" };
        const firstFormatted = firstDate.toLocaleDateString("en-US", formatOptions);
        const lastFormatted = lastDate.toLocaleDateString("en-US", formatOptions);
        
        return `${firstFormatted} - ${lastFormatted}`;
    }, [dateRange]);

    // Load projects
    useEffect(() => {
        if (!projectsDataSource || projectsDataSource.status !== "available") {
            setProjects([]);
            return;
        }

        const projectList = projectsDataSource.items.map(item => ({
            id: projectIdAttr ? projectIdAttr.get(item).value : item.id,
            name: projectNameAttr ? projectNameAttr.get(item).value : "Unnamed Project",
            object: item
        }));

        setProjects(projectList);
    }, [projectsDataSource, projectIdAttr, projectNameAttr]);

    // Load timesheet entries
    useEffect(() => {
        if (!timesheetDataSource || timesheetDataSource.status !== "available") {
            setEntries([]);
            return;
        }

        const entryList = timesheetDataSource.items.map(item => ({
            projectId: entryProjectIdAttr ? entryProjectIdAttr.get(item).value : null,
            date: entryDateAttr ? entryDateAttr.get(item).value : null,
            hours: entryHoursAttr ? entryHoursAttr.get(item).value : 0,
            object: item
        }));

        setEntries(entryList);
    }, [timesheetDataSource, entryProjectIdAttr, entryDateAttr, entryHoursAttr]);

    // Get hours for a specific project and date
    const getHours = useCallback((projectId, date) => {
        const dateStr = date.toISOString().split('T')[0];
        
        // Try to find entry by matching date and project
        const entry = entries.find(e => {
            if (!e.date) return false;
            
            // Match by date
            const entryDateStr = new Date(e.date).toISOString().split('T')[0];
            if (entryDateStr !== dateStr) return false;
            
            // Match by project ID
            return e.projectId && e.projectId === projectId;
        });
        
        return entry ? entry.hours : "";
    }, [entries, projectIdAttr]);

    // Calculate row total (total hours per project)
    const getRowTotal = useCallback((projectId) => {
        return entries
            .filter(e => e.projectId === projectId)
            .reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
    }, [entries]);

    // Calculate column total (total hours per day)
    const getColumnTotal = useCallback((date) => {
        const dateStr = date.toISOString().split('T')[0];
        return entries
            .filter(e => {
                if (!e.date) return false;
                const entryDateStr = new Date(e.date).toISOString().split('T')[0];
                return entryDateStr === dateStr;
            })
            .reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
    }, [entries]);

    // Handle input change (local state)
    const handleInputChange = useCallback((projectId, date, value) => {
        const cellKey = `${projectId}-${date.toISOString()}`;
        setLocalValues(prev => ({
            ...prev,
            [cellKey]: value
        }));
    }, []);

    // Handle cell blur (save to backend via action)
    const handleCellBlur = useCallback(async (projectId, date, value) => {
        const hoursValue = parseFloat(value) || 0;
        
        // Skip if value is 0 or empty
        if (hoursValue === 0) {
            setEditingCell(null);
            const cellKey = `${projectId}-${date.toISOString()}`;
            setLocalValues(prev => {
                const newValues = { ...prev };
                delete newValues[cellKey];
                return newValues;
            });
            return;
        }
        
        if (!onCellChangeAction) {
            setEditingCell(null);
            return;
        }
        
        if (!helperEntityName || !helperDateAttrName || !helperHoursAttrName || !helperProjectIdAttrName) {
            setEditingCell(null);
            return;
        }
        
        try {
            // Create new helper entity object
            const helperObject = await new Promise((resolve, reject) => {
                window.mx.data.create({
                    entity: helperEntityName,
                    callback: resolve,
                    error: reject
                });
            });
            
            // Set attributes on helper object
            helperObject.set(helperDateAttrName, date.getTime());
            helperObject.set(helperHoursAttrName, hoursValue);
            helperObject.set(helperProjectIdAttrName, String(projectId));
            
            // Commit the helper object
            await new Promise((resolve, reject) => {
                window.mx.data.commit({
                    mxobj: helperObject,
                    callback: resolve,
                    error: reject
                });
            });
            
            // Find the project object
            const project = projects.find(p => p.id === projectId);
            if (!project || !project.object) {
                setEditingCell(null);
                return;
            }
            
            // Get and execute the action
            const action = onCellChangeAction.get(project.object);
            
            if (action && action.canExecute) {
                await action.execute();
                
                // Refresh the datasource to show changes
                if (timesheetDataSource && timesheetDataSource.reload) {
                    await timesheetDataSource.reload();
                }
            }
            
        } catch (error) {
            console.error('Error saving timesheet entry:', error);
        }

        setEditingCell(null);
        
        // Clear local value after save
        const cellKey = `${projectId}-${date.toISOString()}`;
        setLocalValues(prev => {
            const newValues = { ...prev };
            delete newValues[cellKey];
            return newValues;
        });
    }, [entries, projects, projectIdAttr, onCellChangeAction, helperEntityName, helperDateAttrName, helperHoursAttrName, helperProjectIdAttrName, timesheetDataSource]);

    // Get display value (local or saved)
    const getDisplayValue = useCallback((projectId, date) => {
        const cellKey = `${projectId}-${date.toISOString()}`;
        if (cellKey in localValues) {
            return localValues[cellKey];
        }
        return getHours(projectId, date);
    }, [localValues, getHours]);

    // Format date for display
    const formatDate = (date) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
    };

    if (!projectsDataSource || projectsDataSource.status !== "available") {
        return <div className="timesheet-calendar-loading">Loading projects...</div>;
    }

    if (projects.length === 0) {
        return <div className="timesheet-calendar-empty">No projects available</div>;
    }

    return (
        <div className="timesheet-calendar-container">
            <div className="timesheet-calendar">
                {/* Navigation Header */}
                <div className="timesheet-navigation">
                    <div className="navigation-controls">
                        <button 
                            className="nav-button nav-previous" 
                            onClick={goToPreviousPeriod}
                            title="Previous Period"
                        >
                            ◀ Previous
                        </button>
                        
                        <button 
                            className="nav-button nav-today" 
                            onClick={goToToday}
                            title="Go to Current Week"
                        >
                            Today
                        </button>
                        
                        <button 
                            className="nav-button nav-next" 
                            onClick={goToNextPeriod}
                            title="Next Period"
                        >
                            Next ▶
                        </button>
                    </div>
                    
                    <div className="date-range-display">
                        {dateRangeDisplay}
                    </div>
                    
                    <div className="quick-navigation">
                        <button 
                            className="quick-nav-button" 
                            onClick={goToPreviousWeek}
                            title="Previous Week"
                        >
                            ◀◀ Week
                        </button>
                        <button 
                            className="quick-nav-button" 
                            onClick={goToNextWeek}
                            title="Next Week"
                        >
                            Week ▶▶
                        </button>
                    </div>
                </div>

                <table className="timesheet-table">
                    <thead>
                        <tr>
                            <th className="project-header">Project</th>
                            {dateRange.map((date, idx) => (
                                <th key={idx} className="date-header">
                                    {formatDate(date)}
                                </th>
                            ))}
                            {showTotals && <th className="total-header">Total</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr key={project.id} className="project-row">
                                <td className="project-name">{project.name}</td>
                                {dateRange.map((date, idx) => {
                                    const cellKey = `${project.id}-${idx}`;
                                    const displayValue = getDisplayValue(project.id, date);
                                    
                                    return (
                                        <td key={idx} className="hours-cell">
                                            {editable ? (
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    pattern="[0-9]*\.?[0-9]*"
                                                    className="hours-input"
                                                    value={displayValue}
                                                    placeholder="0"
                                                    onFocus={() => setEditingCell(cellKey)}
                                                    onChange={(e) => handleInputChange(project.id, date, e.target.value)}
                                                    onBlur={(e) => handleCellBlur(project.id, date, e.target.value)}
                                                />
                                            ) : (
                                                <span className="hours-display">{displayValue || "-"}</span>
                                            )}
                                        </td>
                                    );
                                })}
                                {showTotals && (
                                    <td className="row-total">
                                        {getRowTotal(project.id).toFixed(1)}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {showDailyTotals && (
                            <tr className="totals-row">
                                <td className="total-label">Daily Total</td>
                                {dateRange.map((date, idx) => (
                                    <td key={idx} className="column-total">
                                        {getColumnTotal(date).toFixed(1)}
                                    </td>
                                ))}
                                {showTotals && (
                                    <td className="grand-total">
                                        {entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0).toFixed(1)}
                                    </td>
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

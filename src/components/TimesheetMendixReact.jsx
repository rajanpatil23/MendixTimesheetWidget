import { createElement, useCallback, useEffect, useMemo, useState } from "react";

export const TimesheetCalendar = ({
    projectListSource,
    timesheetDataSource,
    onCellChangeAction,
    startDate,
    numberOfDays
}) => {
    const [projects, setProjects] = useState([]);
    const [timesheetEntries, setTimesheetEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentStartDate, setCurrentStartDate] = useState(() => startDate ? new Date(startDate) : new Date());

    const dateRange = useMemo(() => {
        if (!currentStartDate || !numberOfDays) return [];
        const dates = [];
        const start = new Date(currentStartDate);
        for (let i = 0; i < numberOfDays; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [currentStartDate, numberOfDays]);

    // Update currentStartDate when startDate prop changes
    useEffect(() => {
        if (startDate) {
            setCurrentStartDate(new Date(startDate));
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
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
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

    const fetchData = useCallback(async () => {
        if (!projectListSource || !timesheetDataSource) return;

        setLoading(true);
        try {
            const [projectsData, entriesData] = await Promise.all([projectListSource(), timesheetDataSource()]);
            setProjects(projectsData || []);
            setTimesheetEntries(entriesData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            setProjects([]);
            setTimesheetEntries([]);
        } finally {
            setLoading(false);
        }
    }, [projectListSource, timesheetDataSource]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCellChange = useCallback(
        (projectId, date, hours) => {
            if (!onCellChangeAction || !onCellChangeAction.canExecute) return;
            onCellChangeAction.execute();
        },
        [onCellChangeAction]
    );

    const getEntryHours = useCallback(
        (projectId, date) => {
            const entry = timesheetEntries.find(e => e.projectId === projectId && e.date === date.toISOString());
            return entry ? entry.hours : "";
        },
        [timesheetEntries]
    );

    if (loading) {
        return <div className="timesheet-calendar loading">Loading...</div>;
    }

    return (
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

            {/* Timesheet Grid */}
            <div className="timesheet-grid">
                <div className="sticky-column">
                    <div className="column-header">Projects</div>
                    {projects.map(project => (
                        <div key={project.id} className="project-row">
                            {project.name}
                        </div>
                    ))}
                </div>
                <div className="date-columns">
                    {dateRange.map(date => (
                        <div key={date.toISOString()} className="date-column">
                            <div className="date-header">
                                <div className="date-day">
                                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                                </div>
                                <div className="date-number">
                                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </div>
                            </div>
                            {projects.map(project => (
                                <input
                                    key={`${project.id}-${date.toISOString()}`}
                                    type="number"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    value={getEntryHours(project.id, date)}
                                    onChange={e => handleCellChange(project.id, date.toISOString(), e.target.value)}
                                    placeholder="0"
                                    className="timesheet-input"
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

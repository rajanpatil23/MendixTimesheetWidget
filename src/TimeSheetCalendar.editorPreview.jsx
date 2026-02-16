import { createElement } from "react";

export function preview() {
    return (
        <div
            style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#f8f9fa"
            }}
        >
            <div style={{ marginBottom: "10px", fontWeight: "bold", fontSize: "16px" }}>
                Timesheet Calendar Widget
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                    <tr style={{ backgroundColor: "#e9ecef" }}>
                        <th style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "left" }}>
                            Project
                        </th>
                        <th style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>
                            Mon
                        </th>
                        <th style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>
                            Tue
                        </th>
                        <th style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>
                            Wed
                        </th>
                        <th style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6" }}>Project A</td>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>8</td>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>6</td>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>7</td>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "bold" }}>
                            21
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6" }}>Project B</td>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>4</td>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>5</td>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>3</td>
                        <td style={{ padding: "8px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "bold" }}>
                            12
                        </td>
                    </tr>
                </tbody>
            </table>
            <div style={{ marginTop: "10px", fontSize: "11px", color: "#6c757d" }}>
                Configure data sources and actions in the widget properties
            </div>
        </div>
    );
}

export function getPreviewCss() {
    return require("./ui/TimeSheetCalendar.css");
}

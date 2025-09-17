import React from "react";

function DictationFullScript({
    fullScript,
    toggleScript,
    showScript,
    playFullScript,
    fullScriptSpeed,
    updateFullScriptSpeed,
    }) {
    return (
        <div className="full-script-container">
            <h3>ĐẦY ĐỦ AUDIO VÀ SCRIPT</h3>
            <div>
                <button onClick={playFullScript} id="playFullScriptButton">
                    <i className="fas fa-volume-up"></i>
                </button>
                <label
                    htmlFor="fullScriptSpeedControl"
                    style={{ fontWeight: "bold", fontSize: "17px", margin: "0 10px" }}
                    >
                    Tốc độ âm thanh:
                </label>
                <input
                    type="range"
                    id="fullScriptSpeedControl"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={fullScriptSpeed}
                    onChange={updateFullScriptSpeed}
                />
                <span id="fullScriptSpeedDisplay">{fullScriptSpeed}x</span>
            </div>

            <button onClick={toggleScript} id="toggleScriptButton">
                {showScript ? "Ẩn script" : "Hiện script"}
            </button>
            {showScript && (
                <div id="fullScriptText" dangerouslySetInnerHTML={{ __html: fullScript }} />
            )}
        </div>
    );
}

export default DictationFullScript;
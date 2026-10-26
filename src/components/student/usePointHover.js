// src/components/student/usePointHover.js
// Hover for the history charts: the tooltip shows only the point under the
// pointer (not every point at that step), placed next to it.
//
// The hover state lives in <HistoryTooltip store={store} />, not in the
// chart, so hovering doesn't redraw the chart. (Redrawing makes the chart
// library rebuild its dots, which can swallow a quick click on a point.)
//
// Attach plotRef to the element around the chart, call show/hide from each
// dot's onMouseEnter/onMouseLeave, and render <HistoryTooltip store={store} />
// inside that element.
import { useRef, useState } from "react";

const TOOLTIP_WIDTH = 260;
// Room the tooltip needs above a point; with less, it opens below the point.
const TOOLTIP_HEIGHT = 190;

// A tiny store the tooltip subscribes to.
function createHoverStore() {
    let listener = null;
    return {
        subscribe(callback) {
            listener = callback;
            return () => {
                if (listener === callback) listener = null;
            };
        },
        set(update) {
            listener?.(update);
        },
    };
}

export default function usePointHover() {
    const plotRef = useRef(null);
    const [store] = useState(createHoverStore);

    // key: unique id of the dot. data: what the tooltip shows.
    function show(event, key, data) {
        const plot = plotRef.current;
        if (!plot) return;
        const area = plot.getBoundingClientRect();
        const dot = event.currentTarget.getBoundingClientRect();
        const x = dot.left + dot.width / 2 - area.left;
        const y = dot.top + dot.height / 2 - area.top;
        store.set({
            key,
            x,
            y,
            // Open toward the inside of the chart near the right/top edges.
            flipX: x > area.width - TOOLTIP_WIDTH,
            below: y < TOOLTIP_HEIGHT,
            data,
        });
    }

    function hide(key) {
        store.set((current) => (current?.key === key ? null : current));
    }

    return { plotRef, store, show, hide };
}

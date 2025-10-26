/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable no-plusplus */
/* eslint-disable prefer-spread */
/**
 * @file Mason-it - CSS Grid to Masonry Layout Converter
 * @author Druhin13
 * @version 1.0.1
 * @license MIT
 * @description A lightweight, dependency-free library that transforms CSS Grid into Masonry layout
 * @copyright 2025 Druhin13
 */

/*!
 * Mason-it v1.0.1
 * ┌─┐┌─┐┌─┐┌─┐┌┐┌   ┬┌┬┐
 * │││├─┤└─┐│ ││││───│ │
 * └┴┘┴ ┴└─┘└─┘┘└┘   ┴ ┴
 *
 * CSS grid to masonry layout converter
 * Lightweight, dependency-free, and blazing fast!
 *
 * Copyright (c) 2025 Druhin13
 * https://github.com/Druhin13/mason-it
 * Released under the MIT License
 *
 */

if (process.browser) {
    (function () {
        /**
         * Feature detection for required browser APIs
         * Exits early if essential features are missing
         */
        if (
            typeof window.getComputedStyle !== "function" ||
            typeof window.requestAnimationFrame !== "function"
        ) {
            return;
        }

        /**
         * Full ASCII representation of the Mason mascot for multi-line display
         * @type {string}
         * @private
         */
        const masonItMascot = "┌───┐\n│o‿o│\n└───┘";

        /**
         * Registry tracking all initialized Mason-it grids
         * @type {Map<Element, Object>}
         * @private
         */
        const MasonItRegistry = new Map();

        /**
         * Current library version
         * @type {string}
         * @private
         */
        const MasonItVersion = "1.0.1";

        /**
         * Debug mode state flag
         * @type {boolean}
         * @private
         */
        let MasonItDebugMode = false;

        /**
         * Inline ASCII representation of the Mason mascot for log messages
         * @type {string}
         * @private
         */
        const masonItMascotInline = "[■o‿o■]";

        /**
         * Set of elements with pending arrangement operations
         * Prevents duplicate layout calculations in the same animation frame
         * @type {Set<Element>}
         * @private
         */
        const MasonItArrangePending = new Set();

        /**
         * Console logger for Mason-it with mascot branding
         * Only logs when debug mode is enabled
         * @private
         * @param {...*} args - Arguments to log to console
         */
        function masonItLog() {
            // eslint-disable-next-line no-console
            if (MasonItDebugMode && console && console.log) {
                const args = [`${masonItMascotInline} Mason:`].concat(
                    Array.prototype.slice.call(arguments)
                );
                // eslint-disable-next-line no-console
                console.log.apply(console, args);
            }
        }

        /**
         * Error handler for Mason-it with mascot branding
         * Only logs errors when debug mode is enabled
         * @private
         * @param {string} context - The context where the error occurred
         * @param {Error} err - The error object
         */
        // eslint-disable-next-line no-unused-vars
        function masonItHandleError(context, err) {
            // if (MasonItDebugMode && console && console.error) {
            //     console.error(
            //         `${masonItMascotInline} Mason Error [${context}]:`,
            //         err
            //     );
            // }
        }

        /**
         * Core Mason-it layout function that applies the masonry layout to a grid
         * This function performs the actual DOM reads/writes
         * @private
         * @param {Element} el - The grid element to arrange as masonry
         */
        function masonItArrange(el) {
            try {
                masonItLog("Arranging masonry layout for", el);
                const gap = parseFloat(getComputedStyle(el).gap) || 0;

                /**
                 * Find all potential grid items (direct children that aren't template elements)
                 * @type {Element[]}
                 */
                const allPotentialMasonItItems = Array.prototype.filter.call(
                    el.children,
                    (c) => c.nodeType === 1 && c.tagName !== "TEMPLATE"
                );

                // Reset margins for all potential items to ensure clean slate
                allPotentialMasonItItems.forEach((item) => {
                    item.style.removeProperty("margin-top");
                });

                /**
                 * Get only the visible items for layout calculation
                 * @type {Element[]}
                 */
                const visibleMasonItItems = Array.prototype.filter.call(
                    el.children,
                    (c) => (
                        c.nodeType === 1 &&
                        c.tagName !== "TEMPLATE" &&
                        getComputedStyle(c).display !== "none"
                    )
                );

                // Exit early if no visible items
                if (visibleMasonItItems.length === 0) {
                    masonItLog("No visible items to arrange in", el);
                    return;
                }

                // Get column count from grid template columns
                const masonItCols =
                    getComputedStyle(el).gridTemplateColumns.split(" ").length;

                // Exit if not enough columns or items for masonry effect
                if (masonItCols < 2 || visibleMasonItItems.length <= masonItCols) {
                    masonItLog(
                        `Not enough columns (${masonItCols
                        }) or visible items (${visibleMasonItItems.length
                        }) for masonry effect on`,
                        el
                    );
                    return;
                }

                // Apply masonry effect by calculating and setting negative margins
                for (let i = masonItCols; i < visibleMasonItItems.length; i++) {
                    const currentItem = visibleMasonItItems[i];
                    const itemAbove = visibleMasonItItems[i - masonItCols];
                    if (!itemAbove) continue;

                    const currentItemRect = currentItem.getBoundingClientRect();
                    const itemAboveRect = itemAbove.getBoundingClientRect();
                    const spaceGap = currentItemRect.top - itemAboveRect.bottom;

                    if (spaceGap !== gap) {
                        const marginTopValue = spaceGap - gap;

                        // Perform safety checks to prevent invalid margins
                        if (!isFinite(marginTopValue)) {
                            masonItLog(
                                "Warning: Calculated non-finite margin-top for item:",
                                currentItem
                            );
                            continue;
                        }
                        if (
                            Math.abs(marginTopValue) > window.innerHeight * 2 &&
                            window.innerHeight > 0
                        ) {
                            masonItLog(
                                `Warning: Calculated excessively large margin-top (${marginTopValue
                                }px) for item:`,
                                currentItem
                            );
                            continue;
                        }

                        // Apply the calculated negative margin
                        currentItem.style.marginTop = `-${marginTopValue}px`;
                    }
                }
                masonItLog("Mason-it layout arranged successfully for", el, "✓");
            } catch (err) {
                masonItHandleError("arrange", err);
            }
        }

        /**
         * Schedules the masonItArrange function using requestAnimationFrame
         * Prevents multiple arrangements for the same element within a single frame
         * @private
         * @param {Element} el - The grid element to schedule for arrangement
         */
        function scheduleMasonItArrange(el) {
            // Skip scheduling if element is no longer valid for arrangement
            if (!MasonItRegistry.has(el) && !document.body.contains(el)) {
                masonItLog(
                    "Skipping schedule arrange for element not in registry or DOM:",
                    el
                );
                MasonItArrangePending.delete(el); // Clean up if it was pending
                return;
            }

            // Only schedule if not already pending in this animation frame
            if (!MasonItArrangePending.has(el)) {
                MasonItArrangePending.add(el);
                window.requestAnimationFrame(() => {
                    // Recheck element validity before performing expensive operations
                    if (
                        MasonItRegistry.has(el) ||
                        el.closest("[data-mason-it-active=\"true\"]")
                    ) {
                        masonItArrange(el);
                    } else {
                        masonItLog(
                            "Skipping arrange for element no longer active/valid in rAF callback:",
                            el
                        );
                    }
                    MasonItArrangePending.delete(el);
                });
            }
        }

        /**
         * @typedef {Object} MasonItOptions
         * @property {number} [masonDelay=0] - Time in ms to wait before initial layout
         * @property {number} [masonPollInterval=0] - Interval in ms for polling content changes
         */

        /**
         * @typedef {Object} MasonItRecordItem
         * @property {Element} el - The grid element
         * @property {number|null} timeout - Timeout ID for delayed initialization
         * @property {number|null} interval - Interval ID for polling
         * @property {MutationObserver|null} observer - MutationObserver instance
         * @property {string} created - ISO timestamp of when the grid was initialized
         */

        /**
         * Initializes Mason-it on a specific grid element
         * @private
         * @param {Element} el - The grid element to setup
         * @param {MasonItOptions} [userOpts={}] - Configuration options
         */
        function masonItSetup(el, userOpts) {
            try {
                if (MasonItRegistry.has(el)) {
                    masonItLog("Grid already Mason-ited, skipping", el);
                    return;
                }

                masonItLog("Mason-iting grid", el, "with options", userOpts);
                const masonItAttr = el.getAttribute("data-mason-it") || "";
                const delayMatch = /mason-delay:\{(\d+)\}/.exec(masonItAttr);
                const intervalMatch = /mason-poll-interval:\{(\d+)\}/.exec(masonItAttr);

                // Merge attribute + JS options (JS options take priority)
                const masonDelay =
                    userOpts && userOpts.masonDelay != null
                        ? userOpts.masonDelay
                        : delayMatch
                            ? +delayMatch[1]
                            : 0;
                const masonPollInterval =
                    userOpts && userOpts.masonPollInterval != null
                        ? userOpts.masonPollInterval
                        : intervalMatch
                            ? +intervalMatch[1]
                            : 0;

                /** @type {MasonItRecordItem} */
                const masonItRecord = {
                    el,
                    timeout: null,
                    interval: null,
                    observer: null,
                    created: new Date().toISOString(),
                };

                // Initial render (with optional delay)
                if (masonDelay) {
                    masonItLog("Setting initial layout delay for", masonDelay, "ms");
                    masonItRecord.timeout = setTimeout(() => {
                        scheduleMasonItArrange(el);
                    }, masonDelay);
                } else {
                    scheduleMasonItArrange(el);
                }

                // Polling for dynamic content changes if specified
                if (masonPollInterval) {
                    masonItLog("Setting poll interval for", masonPollInterval, "ms");
                    masonItRecord.interval = setInterval(() => {
                        scheduleMasonItArrange(el);
                    }, masonPollInterval);
                }

                // Auto-update with MutationObserver for better performance
                if (typeof MutationObserver === "function") {
                    masonItLog("Setting up Mason-it observer for dynamic content");
                    masonItRecord.observer = new MutationObserver((mutationsList) => {
                        for (const mutation of mutationsList) {
                            if (mutation.type === "childList") {
                                masonItLog(
                                    "MutationObserver detected childList change, scheduling arrange for",
                                    el
                                );
                                scheduleMasonItArrange(el);
                                return; // Stop checking once we've found a relevant change
                            }
                        }
                    });
                    masonItRecord.observer.observe(el, { childList: true });
                }

                // Store the grid in our registry
                MasonItRegistry.set(el, masonItRecord);
                el.setAttribute("data-mason-it-active", "true");
            } catch (err) {
                masonItHandleError("setup", err);
            }
        }

        /**
         * Auto-initializes all grid elements with the data-mason-it attribute
         * Called automatically when the DOM is ready
         * @private
         */
        function masonItAutoSetup() {
            try {
                masonItLog("Auto-setting up all grids with [data-mason-it]");
                const masonItElements = document.querySelectorAll(
                    "[data-mason-it]:not([data-mason-it-active='true'])"
                );
                masonItLog("Found", masonItElements.length, "grids to Mason-it");
                for (let i = 0; i < masonItElements.length; i++) {
                    masonItSetup(masonItElements[i], {});
                }
            } catch (err) {
                masonItHandleError("auto-setup", err);
            }
        }

        /**
         * Schedules a refresh for all initialized Mason-it grids
         * Used internally by public refresh methods and event handlers
         * @private
         */
        function masonItInternalRefreshAll() {
            masonItLog(
                `Scheduling refresh for all ${MasonItRegistry.size} Mason-ited grids`
            );
            MasonItRegistry.forEach((rec) => {
                scheduleMasonItArrange(rec.el);
            });
        }

        /**
         * Removes Mason-it behavior from a grid element
         * @private
         * @param {Element} el - The grid element to teardown
         */
        function masonItTeardown(el) {
            try {
                const rec = MasonItRegistry.get(el);
                if (!rec) {
                    masonItLog("Grid not Mason-ited, nothing to teardown", el);
                    return;
                }
                masonItLog("Un-Mason-iting grid", el);

                // Clear any scheduled events
                clearTimeout(rec.timeout);
                clearInterval(rec.interval);
                if (rec.observer) rec.observer.disconnect();

                // Remove from pending arrangements
                MasonItArrangePending.delete(el);

                // Reset the layout by arranging one last time (will clear margins)
                // Schedule this to avoid conflicts with any in-progress operations
                scheduleMasonItArrange(el);

                // Remove element from registry and clear active attribute
                MasonItRegistry.delete(el);
                el.removeAttribute("data-mason-it-active");
                masonItLog("Grid successfully un-Mason-ited");
            } catch (err) {
                masonItHandleError("teardown", err);
            }
        }

        /**
         * Converts various input types to an array or NodeList of elements
         * @private
         * @param {string|Element|NodeList|Array} selector - CSS selector, Element, NodeList or Array
         * @returns {NodeList|Element[]} - NodeList or array of elements
         */
        function masonItFindElements(selector) {
            try {
                if (typeof selector === "string") return document.querySelectorAll(selector);
                if (selector instanceof Element) return [selector];
                if (NodeList.prototype.isPrototypeOf(selector) || Array.isArray(selector)) return selector;
                return [];
            } catch (err) {
                masonItHandleError("find-elements", err);
                return [];
            }
        }

        /**
         * @namespace MasonIt
         * @description Global MasonIt object that provides the public API
         */
        window.MasonIt = {
            /**
             * Initialize Mason-it on selected elements
             * @memberof MasonIt
             * @param {string|Element|NodeList|Array} selector - CSS selector or element(s) to initialize
             * @param {MasonItOptions} [options={}] - Configuration options
             * @returns {MasonIt} - Returns the MasonIt object for chaining
             * @example
             * // Initialize with default options
             * MasonIt.init('.grid');
             *
             * // Initialize with custom options
             * MasonIt.init('.grid', {
             *   masonDelay: 500,
             *   masonPollInterval: 2000
             * });
             */
            init(selector, options) {
                masonItLog("📌 init() called with", selector, options);
                const els = masonItFindElements(selector);
                masonItLog("Found", els.length, "elements to Mason-it");
                for (let i = 0; i < els.length; i++) {
                    masonItSetup(els[i], options || {});
                }
                return this; // For chaining
            },

            /**
             * Recalculates and applies Mason-it layout to specified element(s) or all grids
             * Uses requestAnimationFrame for optimal performance
             * @memberof MasonIt
             * @param {string|Element|NodeList|Array} [selector] - CSS selector or element(s) to refresh (omit to refresh all)
             * @returns {MasonIt} - Returns the MasonIt object for chaining
             * @example
             * // Refresh all Mason-it grids
             * MasonIt.refresh();
             *
             * // Refresh specific grid
             * MasonIt.refresh('#my-grid');
             */
            refresh(selector) {
                masonItLog("🔄 refresh() called with", selector || "all grids");
                if (selector) {
                    const els = masonItFindElements(selector);
                    for (let i = 0; i < els.length; i++) {
                        if (MasonItRegistry.has(els[i])) {
                            scheduleMasonItArrange(els[i]);
                        } else {
                            masonItLog(
                                "Skipping refresh for element not in MasonItRegistry:",
                                els[i]
                            );
                        }
                    }
                } else {
                    masonItInternalRefreshAll();
                }
                return this; // For chaining
            },

            /**
             * Legacy method for backward compatibility. Use refresh() instead.
             * @deprecated since 1.0.0
             * @memberof MasonIt
             * @param {string|Element|NodeList|Array} [selector] - CSS selector or element(s) to reload
             * @returns {MasonIt} - Returns the MasonIt object for chaining
             */
            reload(selector) {
                /* Deprecated */
                masonItLog("⚠️ reload() is deprecated, please use refresh() instead");
                return this.refresh(selector);
            },

            /**
             * Removes Mason-it functionality from specified element(s) or all grids
             * @memberof MasonIt
             * @param {string|Element|NodeList|Array} [selector] - CSS selector or element(s) to destroy (omit to destroy all)
             * @returns {MasonIt} - Returns the MasonIt object for chaining
             * @example
             * // Remove Mason-it from all grids
             * MasonIt.destroy();
             *
             * // Remove Mason-it from specific grid
             * MasonIt.destroy('#my-grid');
             */
            destroy(selector) {
                masonItLog("❌ destroy() called with", selector || "all grids");
                let elementsToTeardown = [];
                if (selector) {
                    elementsToTeardown = masonItFindElements(selector);
                } else {
                    // Create a snapshot of elements to avoid issues if registry changes during iteration
                    elementsToTeardown = Array.from(MasonItRegistry.keys());
                }
                elementsToTeardown.forEach((elToTeardown) => {
                    masonItTeardown(elToTeardown);
                });
                return this; // For chaining
            },

            /**
             * Enables or disables debug mode for detailed console logs
             * @memberof MasonIt
             * @param {boolean} enable - Whether to enable debug mode
             * @returns {MasonIt} - Returns the MasonIt object for chaining
             * @example
             * // Enable debug mode
             * MasonIt.debug(true);
             *
             * // Disable debug mode
             * MasonIt.debug(false);
             */
            debug(enable) {
                MasonItDebugMode = !!enable;
                // eslint-disable-next-line no-console
                if (console && console.log) {
                    // eslint-disable-next-line no-console
                    console.log(
                        `\n${masonItMascot
                        }\n\nMason says: Debug mode ${MasonItDebugMode ? "enabled 🔍" : "disabled 🔒"}`
                    );
                }
                return this; // For chaining
            },

            /**
             * Returns the current version of Mason-it
             * @memberof MasonIt
             * @returns {string} - Version string
             * @example
             * const version = MasonIt.version(); // Returns "1.0.1"
             */
            version() {
                return MasonItVersion;
            },

            /**
             * Returns the number of currently active Mason-it grids
             * @memberof MasonIt
             * @returns {number} - Count of active grids
             * @example
             * const activeGrids = MasonIt.count(); // Returns number of active grids
             */
            count() {
                return MasonItRegistry.size;
            },
        };

        /**
         * Initialize Mason-it when DOM is ready
         * Handles both loading and loaded states
         */
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", masonItAutoSetup);
        } else {
            // DOMContentLoaded already fired, initialize immediately
            masonItAutoSetup();
        }

        /**
         * Window resize handler with requestAnimationFrame for performance optimization
         * @private
         */
        let masonItResizeTicking = false;
        window.addEventListener("resize", () => {
            if (!masonItResizeTicking) {
                masonItResizeTicking = true;
                window.requestAnimationFrame(() => {
                    masonItLog("🔄 Window resize detected - refreshing all Mason-it grids");
                    masonItInternalRefreshAll();
                    masonItResizeTicking = false;
                });
            }
        });

        /**
         * Custom events for triggering Mason-it refresh
         * @private
         */
        window.addEventListener("refresh:mason-it", () => {
            masonItLog("🔄 Custom refresh event 'refresh:mason-it' received");
            masonItInternalRefreshAll();
        });

        /**
         * Legacy event name support
         * @private
         * @deprecated since 1.0.0
         */
        window.addEventListener("reload:mason-it", () => {
    /* Deprecated */ masonItLog(
            "⚠️ 'reload:mason-it' event is deprecated, use 'refresh:mason-it'"
        );
            masonItInternalRefreshAll();
        });

        /**
         * Module exports for various module systems
         * Support CommonJS, AMD, and browser globals
         */
        if (typeof module !== "undefined" && module.exports) {
            module.exports = window.MasonIt;
            if (typeof window !== "undefined") window.MasonIt = window.MasonIt;
        } else if (typeof define === "function" && define.amd) {
            define([], () => window.MasonIt);
        }

        /**
         * Log initialization with full mascot art
         * @private
         */
        // if (console && console.log) {
        //     console.log(
        //         `${masonItMascot
        //         }\n\nMason-it v${MasonItVersion
        //         } initialized!\nMade with ❤️ by Druhin13\n`
        //     );
        // }
    }());
}
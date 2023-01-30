const {
    addDays,
    startOfWeek,
    format,
    getDay,
    isBefore,
} = require("date-fns");

module.exports = class {
    async onCreate(input) {
        this.state = {
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
            data: [],
            whitelist: [],
            disabledDaysOfWeek: [],
            firstDate: null,
            selected: {},
            visible: typeof input.visible === "boolean" ? input.visible : true,
        };
        if (input.admin) {
            await import(/* webpackChunkName: "hcalendar-admin" */ "./style-admin.scss");
        } else {
            await import(/* webpackChunkName: "hcalendar-frontend" */ "./style-frontend.scss");
        }
    }

    setCalendarData() {
        const startDate = startOfWeek(new Date(this.state.year, this.state.month, 1), {
            weekStartsOn: parseInt(this.t("global.weekStart"), 10)
        });
        const rows = 6;
        const cols = 7;
        const length = rows * cols;
        const data = Array.from({
                length
            })
            .map((_, index) => ({
                d: addDays(startDate, index).getDate(),
                m: addDays(startDate, index).getMonth(),
                y: addDays(startDate, index).getFullYear(),
                enabled: (this.state.whitelist.length ? this.state.whitelist.indexOf(format(addDays(startDate, index), "yyyyMMdd")) > -1 : true) && (this.state.disabledDaysOfWeek.length ? this.state.disabledDaysOfWeek.indexOf(getDay(addDays(startDate, index))) === -1 : true) && (!this.state.firstDate || (this.state.firstDate && !isBefore(addDays(startDate, index), this.state.firstDate)))
            }))
            .reduce((matrix, current, index, days) => !(index % cols !== 0) ? [...matrix, days.slice(index, index + cols)] : matrix, []);
        if (data[5][0].d < 10) {
            data.splice(5, 1);
        }
        this.setState("data", data);
    }

    onMount() {
        this.t = window.__heretic.t;
        this.setCalendarData();
    }

    onCalendarYearLeft(e) {
        e.preventDefault();
        this.setState("year", this.state.year - 1);
        this.setCalendarData();
    }

    onCalendarMonthLeft(e) {
        e.preventDefault();
        this.setState("year", this.state.month > 0 ? this.state.year : this.state.year - 1);
        this.setState("month", this.state.month > 0 ? this.state.month - 1 : 11);
        this.setCalendarData();
    }

    onCalendarMonthRight(e) {
        e.preventDefault();
        this.setState("year", this.state.month < 11 ? this.state.year : this.state.year + 1);
        this.setState("month", this.state.month < 11 ? this.state.month + 1 : 0);
        this.setCalendarData();
    }

    onCalendarYearRight(e) {
        e.preventDefault();
        this.setState("year", this.state.year + 1);
        this.setCalendarData();
    }

    getTimestamp() {
        const {
            d,
            m,
            y
        } = this.state.selected;
        return d ? new Date(y, m, d).getTime() / 1000 : null;
    }

    emitTimestamp() {
        this.emit("date-change", this.getTimestamp());
    }

    onCalendarCellClick(e) {
        e.preventDefault();
        const {
            d,
            m,
            y,
        } = e.target.closest("[data-d]") ? e.target.closest("[data-d]").dataset : {};
        if (d) {
            this.setState("selected", {
                d: parseInt(d, 10),
                m: parseInt(m, 10),
                y: parseInt(y, 10),
            });
            this.emitTimestamp();
        }
    }

    onCalendarToday(e) {
        e.preventDefault();
        this.setState("year", new Date().getFullYear());
        this.setState("month", new Date().getMonth());
        this.setCalendarData();
        this.setState("selected", {
            d: new Date().getDate(),
            m: new Date().getMonth(),
            y: new Date().getFullYear(),
        });
        this.emitTimestamp();
    }

    onCalendarClear(e) {
        e.preventDefault();
        this.setState("selected", {});
        this.emitTimestamp();
    }

    setDate(date) {
        this.setState("year", date.getFullYear());
        this.setState("month", date.getMonth());
        this.setState("selected", {
            d: date.getDate(),
            m: date.getMonth(),
            y: date.getFullYear(),
        });
        this.setCalendarData();
    }

    setTimestamp(timestamp) {
        if (timestamp) {
            this.setDate(new Date(timestamp));
        }
    }
};
